<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Inventory Report</title>
    <style>
        body { font-family: Arial, sans-serif; font-size: 10px; }
        h2 { font-size: 14px; margin: 0 0 5px 0; }
        p { margin: 2px 0; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid #000; padding: 4px; text-align: left; }
        th { background: #eee; }
        .r { text-align: right; }
        .c { text-align: center; }
        .summary { margin-bottom: 15px; }
        .summary td { border: none; padding: 2px 10px 2px 0; }
    </style>
</head>
<body>
    <h2>Inventory Report</h2>
    <p>Printed: {{ now()->format('Y-m-d H:i') }}</p>

    <table class="summary">
        <tr>
            <td><strong>Total Products:</strong> {{ $data['summary']['total_products'] }}</td>
            <td><strong>Active:</strong> {{ $data['summary']['active_products'] }}</td>
            <td><strong>Low Stock:</strong> {{ $data['summary']['low_stock'] }}</td>
            <td><strong>Out of Stock:</strong> {{ $data['summary']['out_of_stock'] }}</td>
        </tr>
        <tr>
            <td><strong>Stock Value:</strong> {{ $shop->currency_symbol }}{{ number_format($data['summary']['total_stock_value'], 2) }}</td>
            <td><strong>Retail Value:</strong> {{ $shop->currency_symbol }}{{ number_format($data['summary']['total_retail_value'], 2) }}</td>
            <td colspan="2"><strong>Potential Profit:</strong> {{ $shop->currency_symbol }}{{ number_format($data['summary']['potential_profit'], 2) }}</td>
        </tr>
    </table>

    <h3 style="font-size: 12px; margin: 15px 0 5px 0;">By Category</h3>
    <table>
        <tr><th>Category</th><th class="c">Products</th><th class="c">Stock</th><th class="r">Value</th></tr>
        @foreach($data['by_category'] as $cat)
        <tr>
            <td>{{ $cat['name'] ?? 'Uncategorized' }}</td>
            <td class="c">{{ $cat['product_count'] }}</td>
            <td class="c">{{ $cat['total_stock'] }}</td>
            <td class="r">{{ $shop->currency_symbol }}{{ number_format($cat['stock_value'], 2) }}</td>
        </tr>
        @endforeach
    </table>

    <h3 style="font-size: 12px; margin: 15px 0 5px 0;">By Brand</h3>
    <table>
        <tr><th>Brand</th><th class="c">Products</th><th class="c">Stock</th><th class="r">Value</th></tr>
        @foreach($data['by_brand'] as $brand)
        <tr>
            <td>{{ $brand['name'] ?? 'No Brand' }}</td>
            <td class="c">{{ $brand['product_count'] }}</td>
            <td class="c">{{ $brand['total_stock'] }}</td>
            <td class="r">{{ $shop->currency_symbol }}{{ number_format($brand['stock_value'], 2) }}</td>
        </tr>
        @endforeach
    </table>
</body>
</html>
