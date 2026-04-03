<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Repair Turnaround</title>
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
    </style>
</head>
<body>
    <h2>Repair Turnaround Report</h2>
    <p>Period: {{ $data['date_from'] }} to {{ $data['date_to'] }}</p>
    <p>Printed: {{ now()->format('Y-m-d H:i') }}</p>

    <h3>On-Time Analysis</h3>
    <table style="width: 50%;">
        <tr><th>Metric</th><th class="c">Value</th></tr>
        <tr><td>On Time</td><td class="c">{{ $data['on_time_analysis']['on_time'] }}</td></tr>
        <tr><td>Late</td><td class="c">{{ $data['on_time_analysis']['late'] }}</td></tr>
        <tr><td>On-Time Rate</td><td class="c">{{ $data['on_time_analysis']['on_time_rate'] }}%</td></tr>
    </table>

    <h3>Turnaround Distribution</h3>
    <table>
        <tr><th>Time Range</th><th class="c">Count</th></tr>
        @foreach($data['distribution'] as $d)
        <tr>
            <td>{{ $d['turnaround_bracket'] ?? $d['range'] ?? $d['label'] }}</td>
            <td class="c">{{ $d['count'] }}</td>
        </tr>
        @endforeach
    </table>
</body>
</html>
