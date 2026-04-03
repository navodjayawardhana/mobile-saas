<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Sales by Product</title>
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
    <h2>Sales by Product Report</h2>
    <p>Period: {{ $date_from }} to {{ $date_to }}</p>
    <p>Printed: {{ now()->format('Y-m-d H:i') }}</p>

    <table>
        <tr>
            <th>#</th>
            <th>Product</th>
            <th>SKU</th>
            <th>Category</th>
            <th class="c">Qty</th>
            <th class="r">Revenue</th>
        </tr>
        @foreach($products as $i => $p)
        <tr>
            <td>{{ $i + 1 }}</td>
            <td>{{ $p->name }}</td>
            <td>{{ $p->sku ?? '-' }}</td>
            <td>{{ $p->category_name ?? '-' }}</td>
            <td class="c">{{ $p->total_qty }}</td>
            <td class="r">{{ $shop->currency_symbol }}{{ number_format($p->total_revenue, 2) }}</td>
        </tr>
        @endforeach
        <tr class="b">
            <td colspan="4" class="r">Total:</td>
            <td class="c">{{ number_format($totals['qty']) }}</td>
            <td class="r">{{ $shop->currency_symbol }}{{ number_format($totals['revenue'], 2) }}</td>
        </tr>
    </table>
</body>
</html>
