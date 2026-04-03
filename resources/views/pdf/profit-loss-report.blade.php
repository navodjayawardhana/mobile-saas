<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Profit & Loss</title>
    <style>
        body { font-family: Arial, sans-serif; font-size: 10px; }
        h2 { font-size: 14px; margin: 0 0 5px 0; }
        h3 { font-size: 11px; margin: 15px 0 5px 0; }
        p { margin: 2px 0; }
        table { width: 100%; border-collapse: collapse; margin-top: 5px; }
        th, td { border: 1px solid #000; padding: 4px; text-align: left; }
        th { background: #eee; }
        .r { text-align: right; }
        .b { font-weight: bold; }
        .indent { padding-left: 15px; }
        .section td { background: #eee; font-weight: bold; }
        .total td { border-top: 2px solid #000; font-weight: bold; }
    </style>
</head>
<body>
    <h2>Profit & Loss Report</h2>
    <p>Period: {{ $date_from }} to {{ $date_to }}</p>
    <p>Printed: {{ now()->format('Y-m-d H:i') }}</p>

    <table style="margin-top: 15px;">
        <tr class="section"><td colspan="2">REVENUE</td></tr>
        <tr>
            <td class="indent">Sales Revenue</td>
            <td class="r">{{ $shop->currency_symbol }}{{ number_format($revenue['sales'], 2) }}</td>
        </tr>
        <tr>
            <td class="indent">Repair Revenue</td>
            <td class="r">{{ $shop->currency_symbol }}{{ number_format($revenue['repairs'], 2) }}</td>
        </tr>
        <tr class="b">
            <td>Total Revenue</td>
            <td class="r">{{ $shop->currency_symbol }}{{ number_format($revenue['total'], 2) }}</td>
        </tr>

        <tr class="section"><td colspan="2">COST OF GOODS SOLD</td></tr>
        <tr>
            <td class="indent">Product Costs</td>
            <td class="r">{{ $shop->currency_symbol }}{{ number_format($cost_of_goods_sold, 2) }}</td>
        </tr>
        <tr class="b">
            <td>Gross Profit ({{ $gross_margin }}%)</td>
            <td class="r">{{ $shop->currency_symbol }}{{ number_format($gross_profit, 2) }}</td>
        </tr>

        <tr class="section"><td colspan="2">EXPENSES</td></tr>
        @foreach($expenses['by_category'] as $expense)
        <tr>
            <td class="indent">{{ $expense->name }}</td>
            <td class="r">{{ $shop->currency_symbol }}{{ number_format($expense->total, 2) }}</td>
        </tr>
        @endforeach
        <tr class="b">
            <td>Total Expenses</td>
            <td class="r">{{ $shop->currency_symbol }}{{ number_format($expenses['total'], 2) }}</td>
        </tr>

        <tr class="total">
            <td>NET PROFIT ({{ $net_margin }}%)</td>
            <td class="r">{{ $shop->currency_symbol }}{{ number_format($net_profit, 2) }}</td>
        </tr>
    </table>

    @if(count($monthly_breakdown) > 0)
    <h3>Monthly Breakdown</h3>
    <table>
        <tr>
            <th>Month</th>
            <th class="r">Revenue</th>
            <th class="r">Expenses</th>
            <th class="r">Profit</th>
        </tr>
        @foreach($monthly_breakdown as $m)
        <tr>
            <td>{{ $m['label'] }}</td>
            <td class="r">{{ $shop->currency_symbol }}{{ number_format($m['revenue'], 2) }}</td>
            <td class="r">{{ $shop->currency_symbol }}{{ number_format($m['expenses'], 2) }}</td>
            <td class="r">{{ $shop->currency_symbol }}{{ number_format($m['profit'], 2) }}</td>
        </tr>
        @endforeach
    </table>
    @endif
</body>
</html>
