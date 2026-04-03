<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Sales Report</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: Arial, sans-serif;
            font-size: 12px;
            color: #000;
            line-height: 1.4;
        }
        .container {
            padding: 20px;
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #000;
            padding-bottom: 15px;
            margin-bottom: 20px;
        }
        .header h1 {
            font-size: 24px;
            margin-bottom: 5px;
        }
        .header p {
            font-size: 12px;
            color: #333;
        }
        .section {
            margin-bottom: 25px;
        }
        .section-title {
            font-size: 14px;
            font-weight: bold;
            border-bottom: 1px solid #000;
            padding-bottom: 5px;
            margin-bottom: 10px;
        }
        .summary-grid {
            display: table;
            width: 100%;
            margin-bottom: 20px;
        }
        .summary-item {
            display: table-cell;
            width: 25%;
            padding: 10px;
            border: 1px solid #000;
            text-align: center;
        }
        .summary-label {
            font-size: 10px;
            color: #333;
        }
        .summary-value {
            font-size: 16px;
            font-weight: bold;
            margin-top: 5px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }
        th, td {
            border: 1px solid #000;
            padding: 8px;
            text-align: left;
        }
        th {
            background-color: #f0f0f0;
            font-weight: bold;
        }
        .text-right {
            text-align: right;
        }
        .text-center {
            text-align: center;
        }
        .footer {
            margin-top: 30px;
            padding-top: 15px;
            border-top: 1px solid #000;
            text-align: center;
            font-size: 10px;
            color: #666;
        }
        .two-column {
            display: table;
            width: 100%;
        }
        .column {
            display: table-cell;
            width: 50%;
            padding-right: 10px;
            vertical-align: top;
        }
        .column:last-child {
            padding-right: 0;
            padding-left: 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>{{ $shop->name ?? 'Sales Report' }}</h1>
            <p>Sales Report</p>
            <p>Period: {{ $date_from }} to {{ $date_to }}</p>
            <p>Generated: {{ now()->format('Y-m-d H:i:s') }}</p>
        </div>

        <div class="section">
            <div class="section-title">Summary</div>
            <table>
                <tr>
                    <th>Total Sales</th>
                    <th>Transactions</th>
                    <th>Collected</th>
                    <th>Outstanding</th>
                </tr>
                <tr>
                    <td class="text-right">{{ $shop->currency_symbol }}{{ number_format($summary['total_sales'], 2) }}</td>
                    <td class="text-center">{{ $summary['total_transactions'] }}</td>
                    <td class="text-right">{{ $shop->currency_symbol }}{{ number_format($summary['paid_amount'], 2) }}</td>
                    <td class="text-right">{{ $shop->currency_symbol }}{{ number_format($summary['due_amount'], 2) }}</td>
                </tr>
            </table>
            <table style="margin-top: 10px;">
                <tr>
                    <th>Average Sale</th>
                    <th>Total Discounts</th>
                    <th>Total Tax</th>
                </tr>
                <tr>
                    <td class="text-right">{{ $shop->currency_symbol }}{{ number_format($summary['average_sale'], 2) }}</td>
                    <td class="text-right">{{ $shop->currency_symbol }}{{ number_format($summary['total_discounts'], 2) }}</td>
                    <td class="text-right">{{ $shop->currency_symbol }}{{ number_format($summary['total_tax'], 2) }}</td>
                </tr>
            </table>
        </div>

        @if(count($payment_breakdown) > 0)
        <div class="section">
            <div class="section-title">Payment Status Breakdown</div>
            <table>
                <thead>
                    <tr>
                        <th>Status</th>
                        <th class="text-center">Count</th>
                        <th class="text-right">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($payment_breakdown as $item)
                    <tr>
                        <td>{{ ucfirst($item->payment_status) }}</td>
                        <td class="text-center">{{ $item->count }}</td>
                        <td class="text-right">{{ $shop->currency_symbol }}{{ number_format($item->total, 2) }}</td>
                    </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
        @endif

        @if(count($type_breakdown) > 0)
        <div class="section">
            <div class="section-title">Sale Type Breakdown</div>
            <table>
                <thead>
                    <tr>
                        <th>Type</th>
                        <th class="text-center">Count</th>
                        <th class="text-right">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($type_breakdown as $item)
                    <tr>
                        <td>{{ ucfirst($item->sale_type) }}</td>
                        <td class="text-center">{{ $item->count }}</td>
                        <td class="text-right">{{ $shop->currency_symbol }}{{ number_format($item->total, 2) }}</td>
                    </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
        @endif

        @if(count($daily_breakdown) > 0)
        <div class="section">
            <div class="section-title">Daily Sales</div>
            <table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th class="text-center">Transactions</th>
                        <th class="text-right">Total Sales</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($daily_breakdown as $day)
                    <tr>
                        <td>{{ $day->date }}</td>
                        <td class="text-center">{{ $day->count }}</td>
                        <td class="text-right">{{ $shop->currency_symbol }}{{ number_format($day->total, 2) }}</td>
                    </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
        @endif

        <div class="footer">
            <p>This report was automatically generated by {{ $shop->name ?? 'Mobile Shop SaaS' }}</p>
        </div>
    </div>
</body>
</html>
