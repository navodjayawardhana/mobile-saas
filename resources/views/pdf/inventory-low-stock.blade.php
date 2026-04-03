<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Low Stock Report</title>
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
    <h2>Low Stock Report</h2>
    <p>Printed: {{ now()->format('Y-m-d H:i') }}</p>

    <table>
        <tr>
            <th>#</th>
            <th>Product</th>
            <th>SKU</th>
            <th>Category</th>
            <th class="c">Current</th>
            <th class="c">Min</th>
            <th class="c">Shortage</th>
            <th class="r">Restock Cost</th>
        </tr>
        @php $totalRestock = 0; @endphp
        @foreach($products as $i => $p)
        @php $totalRestock += $p['restock_value']; @endphp
        <tr>
            <td>{{ $i + 1 }}</td>
            <td>{{ $p['name'] }}</td>
            <td>{{ $p['sku'] ?? '-' }}</td>
            <td>{{ $p['category'] ?? '-' }}</td>
            <td class="c">{{ $p['quantity'] }}</td>
            <td class="c">{{ $p['min_stock_alert'] }}</td>
            <td class="c">{{ $p['shortage'] }}</td>
            <td class="r">{{ $shop->currency_symbol }}{{ number_format($p['restock_value'], 2) }}</td>
        </tr>
        @endforeach
        <tr class="b">
            <td colspan="7" class="r">Total Restock Cost:</td>
            <td class="r">{{ $shop->currency_symbol }}{{ number_format($totalRestock, 2) }}</td>
        </tr>
    </table>
</body>
</html>
