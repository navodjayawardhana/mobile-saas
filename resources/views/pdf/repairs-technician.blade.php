<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Repairs by Technician</title>
    <style>
        body { font-family: Arial, sans-serif; font-size: 10px; }
        h2 { font-size: 14px; margin: 0 0 5px 0; }
        p { margin: 2px 0; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid #000; padding: 4px; text-align: left; }
        th { background: #eee; }
        .r { text-align: right; }
        .c { text-align: center; }
        .b { font-weight: bold; }
    </style>
</head>
<body>
    <h2>Repairs by Technician</h2>
    <p>Period: {{ $data['date_from'] }} to {{ $data['date_to'] }}</p>
    <p>Printed: {{ now()->format('Y-m-d H:i') }}</p>

    <table>
        <tr>
            <th>#</th>
            <th>Technician</th>
            <th class="c">Total</th>
            <th class="c">Completed</th>
            <th class="r">Revenue</th>
            <th class="c">Avg Days</th>
        </tr>
        @php $totals = ['repairs' => 0, 'completed' => 0, 'revenue' => 0]; @endphp
        @foreach($data['technicians'] as $i => $t)
        @php
            $totals['repairs'] += $t['total_repairs'];
            $totals['completed'] += $t['completed'];
            $totals['revenue'] += $t['total_revenue'];
        @endphp
        <tr>
            <td>{{ $i + 1 }}</td>
            <td>{{ $t['name'] }}</td>
            <td class="c">{{ $t['total_repairs'] }}</td>
            <td class="c">{{ $t['completed'] }}</td>
            <td class="r">{{ $shop->currency_symbol }}{{ number_format($t['total_revenue'], 2) }}</td>
            <td class="c">{{ number_format($t['avg_days'] ?? 0, 1) }}</td>
        </tr>
        @endforeach
        <tr class="b">
            <td colspan="2" class="r">Total:</td>
            <td class="c">{{ $totals['repairs'] }}</td>
            <td class="c">{{ $totals['completed'] }}</td>
            <td class="r">{{ $shop->currency_symbol }}{{ number_format($totals['revenue'], 2) }}</td>
            <td></td>
        </tr>
    </table>
</body>
</html>
