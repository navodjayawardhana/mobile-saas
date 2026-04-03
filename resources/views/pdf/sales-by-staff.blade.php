<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Sales by Staff</title>
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
    <h2>Sales by Staff Report</h2>
    <p>Period: {{ $date_from }} to {{ $date_to }}</p>
    <p>Printed: {{ now()->format('Y-m-d H:i') }}</p>

    <table>
        <tr>
            <th>#</th>
            <th>Staff Name</th>
            <th class="c">Transactions</th>
            <th class="r">Total Sales</th>
            <th class="r">Collected</th>
            <th class="r">Avg Sale</th>
        </tr>
        @foreach($staff as $i => $s)
        <tr>
            <td>{{ $i + 1 }}</td>
            <td>{{ $s->name }}</td>
            <td class="c">{{ $s->transaction_count }}</td>
            <td class="r">{{ $shop->currency_symbol }}{{ number_format($s->total_sales, 2) }}</td>
            <td class="r">{{ $shop->currency_symbol }}{{ number_format($s->total_collected, 2) }}</td>
            <td class="r">{{ $shop->currency_symbol }}{{ number_format($s->avg_sale, 2) }}</td>
        </tr>
        @endforeach
        <tr class="b">
            <td colspan="2" class="r">Total:</td>
            <td class="c">{{ $totals['transactions'] }}</td>
            <td class="r">{{ $shop->currency_symbol }}{{ number_format($totals['sales'], 2) }}</td>
            <td class="r">{{ $shop->currency_symbol }}{{ number_format($totals['collected'], 2) }}</td>
            <td></td>
        </tr>
    </table>
</body>
</html>
