<?php

namespace App\Http\Controllers\Api\V1\Report;

use App\Http\Controllers\Controller;
use App\Models\Repair;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Barryvdh\DomPDF\Facade\Pdf;

class RepairReportController extends Controller
{
    /**
     * Get repair report
     */
    public function index(Request $request)
    {
        $dateFrom = $request->input('date_from', Carbon::now()->startOfMonth()->toDateString());
        $dateTo = $request->input('date_to', Carbon::now()->toDateString());
        $status = $request->input('status');
        $technicianId = $request->input('technician_id');

        $query = Repair::whereDate('received_at', '>=', $dateFrom)
            ->whereDate('received_at', '<=', $dateTo);

        if ($status) {
            $query->where('status', $status);
        }
        if ($technicianId) {
            $query->where('technician_id', $technicianId);
        }

        // Summary
        $totalRepairs = (clone $query)->count();
        $completedRepairs = (clone $query)->where('status', 'completed')->orWhere('status', 'delivered')->count();
        $totalRevenue = (clone $query)->whereIn('status', ['completed', 'delivered'])->sum('final_cost');
        $totalPaid = (clone $query)->sum('paid_amount');
        $totalDue = (clone $query)->selectRaw('SUM(final_cost - paid_amount) as due')->value('due') ?? 0;

        // By status
        $byStatus = Repair::whereDate('received_at', '>=', $dateFrom)
            ->whereDate('received_at', '<=', $dateTo)
            ->when($technicianId, fn($q) => $q->where('technician_id', $technicianId))
            ->selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->get();

        // By priority
        $byPriority = Repair::whereDate('received_at', '>=', $dateFrom)
            ->whereDate('received_at', '<=', $dateTo)
            ->when($status, fn($q) => $q->where('status', $status))
            ->when($technicianId, fn($q) => $q->where('technician_id', $technicianId))
            ->selectRaw('priority, COUNT(*) as count')
            ->groupBy('priority')
            ->get();

        // By device type
        $byDeviceType = Repair::whereDate('received_at', '>=', $dateFrom)
            ->whereDate('received_at', '<=', $dateTo)
            ->when($status, fn($q) => $q->where('status', $status))
            ->when($technicianId, fn($q) => $q->where('technician_id', $technicianId))
            ->selectRaw('device_type, COUNT(*) as count, SUM(final_cost) as revenue')
            ->groupBy('device_type')
            ->orderByDesc('count')
            ->get();

        // Average completion time (days)
        $avgCompletionTime = Repair::whereDate('received_at', '>=', $dateFrom)
            ->whereDate('received_at', '<=', $dateTo)
            ->whereIn('status', ['completed', 'delivered'])
            ->whereNotNull('completed_at')
            ->selectRaw('AVG(DATEDIFF(completed_at, received_at)) as avg_days')
            ->value('avg_days') ?? 0;

        return response()->json([
            'date_from' => $dateFrom,
            'date_to' => $dateTo,
            'summary' => [
                'total_repairs' => $totalRepairs,
                'completed_repairs' => $completedRepairs,
                'completion_rate' => $totalRepairs > 0 ? round(($completedRepairs / $totalRepairs) * 100, 2) : 0,
                'total_revenue' => $totalRevenue,
                'total_paid' => $totalPaid,
                'total_due' => $totalDue,
                'avg_completion_days' => round($avgCompletionTime, 1),
            ],
            'by_status' => $byStatus,
            'by_priority' => $byPriority,
            'by_device_type' => $byDeviceType,
        ]);
    }

    /**
     * Repairs by technician
     */
    public function byTechnician(Request $request)
    {
        $dateFrom = $request->input('date_from', Carbon::now()->startOfMonth()->toDateString());
        $dateTo = $request->input('date_to', Carbon::now()->toDateString());

        $technicians = Repair::leftJoin('users', 'repairs.technician_id', '=', 'users.id')
            ->whereDate('repairs.received_at', '>=', $dateFrom)
            ->whereDate('repairs.received_at', '<=', $dateTo)
            ->selectRaw('
                users.id,
                COALESCE(users.name, "Unassigned") as name,
                COUNT(*) as total_repairs,
                SUM(CASE WHEN repairs.status IN ("completed", "delivered") THEN 1 ELSE 0 END) as completed,
                SUM(repairs.final_cost) as total_revenue,
                AVG(CASE WHEN repairs.completed_at IS NOT NULL THEN DATEDIFF(repairs.completed_at, repairs.received_at) END) as avg_days
            ')
            ->groupBy('users.id', 'users.name')
            ->orderByDesc('total_repairs')
            ->get();

        return response()->json([
            'date_from' => $dateFrom,
            'date_to' => $dateTo,
            'technicians' => $technicians,
        ]);
    }

    /**
     * Repair turnaround analysis
     */
    public function turnaround(Request $request)
    {
        $dateFrom = $request->input('date_from', Carbon::now()->startOfMonth()->toDateString());
        $dateTo = $request->input('date_to', Carbon::now()->toDateString());

        // Turnaround distribution
        $distribution = Repair::whereDate('received_at', '>=', $dateFrom)
            ->whereDate('received_at', '<=', $dateTo)
            ->whereIn('status', ['completed', 'delivered'])
            ->whereNotNull('completed_at')
            ->selectRaw('
                CASE
                    WHEN DATEDIFF(completed_at, received_at) <= 1 THEN "Same/Next day"
                    WHEN DATEDIFF(completed_at, received_at) <= 3 THEN "2-3 days"
                    WHEN DATEDIFF(completed_at, received_at) <= 7 THEN "4-7 days"
                    WHEN DATEDIFF(completed_at, received_at) <= 14 THEN "1-2 weeks"
                    ELSE "Over 2 weeks"
                END as turnaround_bracket,
                COUNT(*) as count
            ')
            ->groupByRaw('turnaround_bracket')
            ->get();

        // On-time vs late
        $onTimeAnalysis = Repair::whereDate('received_at', '>=', $dateFrom)
            ->whereDate('received_at', '<=', $dateTo)
            ->whereIn('status', ['completed', 'delivered'])
            ->whereNotNull('completed_at')
            ->whereNotNull('estimated_completion')
            ->selectRaw('
                SUM(CASE WHEN completed_at <= estimated_completion THEN 1 ELSE 0 END) as on_time,
                SUM(CASE WHEN completed_at > estimated_completion THEN 1 ELSE 0 END) as late
            ')
            ->first();

        return response()->json([
            'date_from' => $dateFrom,
            'date_to' => $dateTo,
            'distribution' => $distribution,
            'on_time_analysis' => [
                'on_time' => $onTimeAnalysis->on_time ?? 0,
                'late' => $onTimeAnalysis->late ?? 0,
                'on_time_rate' => ($onTimeAnalysis->on_time ?? 0) + ($onTimeAnalysis->late ?? 0) > 0
                    ? round(($onTimeAnalysis->on_time / (($onTimeAnalysis->on_time ?? 0) + ($onTimeAnalysis->late ?? 0))) * 100, 2)
                    : 0,
            ],
        ]);
    }

    /**
     * Common repair issues
     */
    public function commonIssues(Request $request)
    {
        $dateFrom = $request->input('date_from', Carbon::now()->startOfMonth()->toDateString());
        $dateTo = $request->input('date_to', Carbon::now()->toDateString());
        $deviceType = $request->input('device_type');

        // This is a simplified version - in production you might want to use
        // NLP or keyword extraction for better analysis
        $repairs = Repair::whereDate('received_at', '>=', $dateFrom)
            ->whereDate('received_at', '<=', $dateTo)
            ->when($deviceType, fn($q) => $q->where('device_type', $deviceType))
            ->get(['device_type', 'device_brand', 'reported_issues']);

        // Simple keyword frequency analysis
        $keywords = [
            'screen' => 0, 'battery' => 0, 'charging' => 0, 'water' => 0,
            'broken' => 0, 'not working' => 0, 'slow' => 0, 'camera' => 0,
            'speaker' => 0, 'microphone' => 0, 'button' => 0, 'software' => 0,
        ];

        foreach ($repairs as $repair) {
            $issues = strtolower($repair->reported_issues ?? '');
            foreach ($keywords as $keyword => $count) {
                if (str_contains($issues, $keyword)) {
                    $keywords[$keyword]++;
                }
            }
        }

        arsort($keywords);

        return response()->json([
            'date_from' => $dateFrom,
            'date_to' => $dateTo,
            'total_repairs' => $repairs->count(),
            'common_issues' => collect($keywords)->map(fn($count, $keyword) => [
                'keyword' => $keyword,
                'count' => $count,
                'percentage' => $repairs->count() > 0 ? round(($count / $repairs->count()) * 100, 2) : 0,
            ])->filter(fn($item) => $item['count'] > 0)->values(),
        ]);
    }

    /**
     * Export repairs report as PDF
     */
    public function exportPdf(Request $request)
    {
        $data = json_decode($this->index($request)->content(), true);
        $shop = auth()->user()->shop;

        $pdf = Pdf::loadView('pdf.repairs-report', [
            'shop' => $shop,
            'data' => $data,
        ]);

        return response($pdf->output(), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="repairs_report.pdf"',
        ]);
    }

    /**
     * Export repairs by technician as PDF
     */
    public function exportTechnicianPdf(Request $request)
    {
        $data = json_decode($this->byTechnician($request)->content(), true);
        $shop = auth()->user()->shop;

        $pdf = Pdf::loadView('pdf.repairs-technician', [
            'shop' => $shop,
            'data' => $data,
        ]);

        return response($pdf->output(), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="repairs_by_technician.pdf"',
        ]);
    }

    /**
     * Export turnaround report as PDF
     */
    public function exportTurnaroundPdf(Request $request)
    {
        $data = json_decode($this->turnaround($request)->content(), true);
        $shop = auth()->user()->shop;

        $pdf = Pdf::loadView('pdf.repairs-turnaround', [
            'shop' => $shop,
            'data' => $data,
        ]);

        return response($pdf->output(), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="repairs_turnaround.pdf"',
        ]);
    }
}
