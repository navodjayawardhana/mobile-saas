<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Supplier Dues</title>
    <style>
        body { font-family: Arial, sans-serif; font-size: 10px; }
        h2 { font-size: 14px; margin: 0 0 5px 0; }
        p { margin: 2px 0; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid #000; padding: 4px; text-align: left; }
        th { background: #eee; }
        .r { text-align: right; }
        .b { font-weight: bold; }
    </style>
</head>
<body>
    <h2>Supplier Dues Report</h2>
    <p>Total Outstanding: {{ $shop->currency_symbol }}{{ number_format($total_due, 2) }}</p>
    <p>Printed: {{ now()->format('Y-m-d H:i') }}</p>

    <table>
        <tr>
            <th>#</th>
            <th>Supplier</th>
            <th>Contact</th>
            <th>Phone</th>
            <th class="r">Amount Due</th>
        </tr>
        @foreach($suppliers as $i => $s)
        <tr>
            <td>{{ $i + 1 }}</td>
            <td>{{ $s['name'] }}</td>
            <td>{{ $s['contact_person'] ?? '-' }}</td>
            <td>{{ $s['phone'] ?? '-' }}</td>
            <td class="r">{{ $shop->currency_symbol }}{{ number_format($s['total_due'], 2) }}</td>
        </tr>
        @endforeach
        <tr class="b">
            <td colspan="4" class="r">Total:</td>
            <td class="r">{{ $shop->currency_symbol }}{{ number_format($total_due, 2) }}</td>
        </tr>
    </table>
</body>
</html>
