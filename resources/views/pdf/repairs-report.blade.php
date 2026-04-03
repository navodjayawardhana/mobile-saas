<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Repairs Report</title>
    <style>
        body { font-family: Arial, sans-serif; font-size: 10px; }
        h2 { font-size: 14px; margin: 0 0 5px 0; }
        h3 { font-size: 11px; margin: 10px 0 5px 0; }
        p { margin: 2px 0; }
        table { width: 100%; border-collapse: collapse; margin-top: 5px; }
        th, td { border: 1px solid #000; padding: 4px; text-align: left; }
        th { background: #eee; }
        .r { text-align: right; }
        .c { text-align: center; }
        .summary td { border: none; padding: 2px 10px 2px 0; }
    </style>
</head>
<body>
    <h2>Repairs Report</h2>
    <p>Period: {{ $data['date_from'] }} to {{ $data['date_to'] }}</p>
    <p>Printed: {{ now()->format('Y-m-d H:i') }}</p>

    <table class="summary" style="margin: 10px 0;">
        <tr>
            <td><strong>Total Repairs:</strong> {{ $data['summary']['total_repairs'] }}</td>
            <td><strong>Completed:</strong> {{ $data['summary']['completed_repairs'] }} ({{ $data['summary']['completion_rate'] }}%)</td>
            <td><strong>Revenue:</strong> {{ $shop->currency_symbol }}{{ number_format($data['summary']['total_revenue'], 2) }}</td>
        </tr>
        <tr>
            <td><strong>Paid:</strong> {{ $shop->currency_symbol }}{{ number_format($data['summary']['total_paid'], 2) }}</td>
            <td><strong>Due:</strong> {{ $shop->currency_symbol }}{{ number_format($data['summary']['total_due'], 2) }}</td>
            <td><strong>Avg Days:</strong> {{ $data['summary']['avg_completion_days'] }}</td>
        </tr>
    </table>

    <h3>By Status</h3>
    <table>
        <tr><th>Status</th><th class="c">Count</th></tr>
        @foreach($data['by_status'] as $s)
        <tr><td>{{ ucfirst($s['status']) }}</td><td class="c">{{ $s['count'] }}</td></tr>
        @endforeach
    </table>

    <h3>By Priority</h3>
    <table>
        <tr><th>Priority</th><th class="c">Count</th></tr>
        @foreach($data['by_priority'] as $p)
        <tr><td>{{ ucfirst($p['priority']) }}</td><td class="c">{{ $p['count'] }}</td></tr>
        @endforeach
    </table>

    <h3>By Device Type</h3>
    <table>
        <tr><th>Device Type</th><th class="c">Count</th><th class="r">Revenue</th></tr>
        @foreach($data['by_device_type'] as $d)
        <tr>
            <td>{{ $d['device_type'] }}</td>
            <td class="c">{{ $d['count'] }}</td>
            <td class="r">{{ $shop->currency_symbol }}{{ number_format($d['revenue'], 2) }}</td>
        </tr>
        @endforeach
    </table>
</body>
</html>
