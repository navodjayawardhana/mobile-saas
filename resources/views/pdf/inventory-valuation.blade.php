<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Stock Valuation</title>
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
    <h2>Stock Valuation Report</h2>
    <p>Printed: {{ now()->format('Y-m-d H:i') }}</p>

    <table>
        <tr>
            <th>#</th>
            <th>Product</th>
            <th>SKU</th>
            <th>Category</th>
            <th class="c">Stock</th>
            <th class="r">Cost</th>
            <th class="r">Value</th>
            <th class="r">Profit</th>
        </tr>
        @foreach($products as $i => $p)
        <tr>
            <td>{{ $i + 1 }}</td>
            <td>{{ $p['name'] }}</td>
            <td>{{ $p['sku'] ?? '-' }}</td>
            <td>{{ $p['category'] ?? '-' }}</td>
            <td class="c">{{ $p['quantity'] }}</td>
            <td class="r">{{ $shop->currency_symbol }}{{ number_format($p['cost_price'], 2) }}</td>
            <td class="r">{{ $shop->currency_symbol }}{{ number_format($p['stock_value'], 2) }}</td>
            <td class="r">{{ $shop->currency_symbol }}{{ number_format($p['potential_profit'], 2) }}</td>
        </tr>
        @endforeach
        <tr class="b">
            <td colspan="6" class="r">Total:</td>
            <td class="r">{{ $shop->currency_symbol }}{{ number_format($totals['stock_value'], 2) }}</td>
            <td class="r">{{ $shop->currency_symbol }}{{ number_format($totals['potential_profit'], 2) }}</td>
        </tr>
    </table>
</body>
</html>
