<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Cash Flow Report</title>
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
        .b { font-weight: bold; }
        .summary td { border: none; padding: 2px 15px 2px 0; }
    </style>
</head>
<body>
    <h2>Cash Flow Report</h2>
    <p>Period: {{ $data['date_from'] }} to {{ $data['date_to'] }}</p>
    <p>Printed: {{ now()->format('Y-m-d H:i') }}</p>

    <table class="summary" style="margin: 10px 0;">
        <tr>
            <td><strong>Total Inflows:</strong> {{ $shop->currency_symbol }}{{ number_format($data['inflows']['total'], 2) }}</td>
            <td><strong>Total Outflows:</strong> {{ $shop->currency_symbol }}{{ number_format($data['outflows']['total'], 2) }}</td>
            <td><strong>Net Cash Flow:</strong> {{ $shop->currency_symbol }}{{ number_format($data['net_cash_flow'], 2) }}</td>
        </tr>
    </table>

    <h3>Inflows by Payment Method</h3>
    <table>
        <tr><th>Method</th><th class="c">Count</th><th class="r">Amount</th></tr>
        @foreach($data['inflows']['by_method'] as $m)
        <tr>
            <td>{{ $m['name'] }}</td>
            <td class="c">{{ $m['count'] }}</td>
            <td class="r">{{ $shop->currency_symbol }}{{ number_format($m['total'], 2) }}</td>
        </tr>
        @endforeach
        <tr class="b">
            <td colspan="2" class="r">Total:</td>
            <td class="r">{{ $shop->currency_symbol }}{{ number_format($data['inflows']['total'], 2) }}</td>
        </tr>
    </table>

    <h3>Outflows</h3>
    <table style="width: 50%;">
        <tr><th>Type</th><th class="r">Amount</th></tr>
        <tr><td>Expenses</td><td class="r">{{ $shop->currency_symbol }}{{ number_format($data['outflows']['expenses'], 2) }}</td></tr>
        <tr><td>Supplier Payments</td><td class="r">{{ $shop->currency_symbol }}{{ number_format($data['outflows']['supplier_payments'], 2) }}</td></tr>
        <tr class="b"><td>Total</td><td class="r">{{ $shop->currency_symbol }}{{ number_format($data['outflows']['total'], 2) }}</td></tr>
    </table>

    @if(count($data['daily_flow']) > 0)
    <h3>Daily Cash Flow</h3>
    <table>
        <tr><th>Date</th><th class="r">Inflow</th><th class="r">Outflow</th><th class="r">Net</th></tr>
        @foreach($data['daily_flow'] as $d)
        <tr>
            <td>{{ $d['date'] }}</td>
            <td class="r">{{ $shop->currency_symbol }}{{ number_format($d['inflow'], 2) }}</td>
            <td class="r">{{ $shop->currency_symbol }}{{ number_format($d['outflow'], 2) }}</td>
            <td class="r">{{ $shop->currency_symbol }}{{ number_format($d['net'], 2) }}</td>
        </tr>
        @endforeach
    </table>
    @endif
</body>
</html>
