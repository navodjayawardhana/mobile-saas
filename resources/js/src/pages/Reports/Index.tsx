import { Link } from 'react-router-dom';

const ReportsIndex = () => {
    const reportCategories = [
        {
            title: 'Sales Reports',
            icon: (
                <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
            ),
            color: 'bg-primary',
            reports: [
                { name: 'Sales Overview', path: '/reports/sales', description: 'Daily sales, payment status, and trends' },
                { name: 'Sales by Product', path: '/reports/sales/products', description: 'Top selling products analysis' },
                { name: 'Sales by Staff', path: '/reports/sales/staff', description: 'Staff performance metrics' },
            ],
        },
        {
            title: 'Inventory Reports',
            icon: (
                <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
            ),
            color: 'bg-info',
            reports: [
                { name: 'Stock Levels', path: '/reports/inventory', description: 'Current inventory overview' },
                { name: 'Stock Valuation', path: '/reports/inventory/valuation', description: 'Inventory value analysis' },
                { name: 'Low Stock Report', path: '/reports/inventory/low-stock', description: 'Items needing restock' },
            ],
        },
        {
            title: 'Repair Reports',
            icon: (
                <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                </svg>
            ),
            color: 'bg-warning',
            reports: [
                { name: 'Repair Overview', path: '/reports/repairs', description: 'Status, priority, and device types' },
                { name: 'Technician Performance', path: '/reports/repairs/technicians', description: 'Tech productivity metrics' },
                { name: 'Turnaround Analysis', path: '/reports/repairs/turnaround', description: 'Repair completion times' },
            ],
        },
        {
            title: 'Financial Reports',
            icon: (
                <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 3v18h18" />
                    <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />
                </svg>
            ),
            color: 'bg-success',
            reports: [
                { name: 'Profit & Loss', path: '/reports/profit-loss', description: 'Revenue, expenses, and profit' },
                { name: 'Cash Flow', path: '/reports/cash-flow', description: 'Inflows and outflows analysis' },
                { name: 'Customer Dues', path: '/reports/dues/customers', description: 'Outstanding customer balances' },
                { name: 'Supplier Dues', path: '/reports/dues/suppliers', description: 'Outstanding supplier balances' },
            ],
        },
    ];

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="panel">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div>
                        <h5 className="text-lg font-semibold dark:text-white-light">Reports</h5>
                        <p className="text-gray-500">Business insights and analytics</p>
                    </div>
                </div>
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Link
                    to="/reports/sales"
                    className="panel bg-primary text-white hover:shadow-lg transition-shadow"
                >
                    <div className="flex flex-col items-center py-4">
                        <svg className="w-10 h-10 mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                        </svg>
                        <span className="font-semibold">Sales Report</span>
                    </div>
                </Link>
                <Link
                    to="/reports/profit-loss"
                    className="panel bg-success text-white hover:shadow-lg transition-shadow"
                >
                    <div className="flex flex-col items-center py-4">
                        <svg className="w-10 h-10 mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 3v18h18" />
                            <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />
                        </svg>
                        <span className="font-semibold">Profit & Loss</span>
                    </div>
                </Link>
                <Link
                    to="/reports/inventory"
                    className="panel bg-info text-white hover:shadow-lg transition-shadow"
                >
                    <div className="flex flex-col items-center py-4">
                        <svg className="w-10 h-10 mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                        <span className="font-semibold">Inventory Report</span>
                    </div>
                </Link>
                <Link
                    to="/reports/repairs"
                    className="panel bg-warning text-white hover:shadow-lg transition-shadow"
                >
                    <div className="flex flex-col items-center py-4">
                        <svg className="w-10 h-10 mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                            </svg>
                        <span className="font-semibold">Repair Report</span>
                    </div>
                </Link>
            </div>

            {/* Report Categories */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {reportCategories.map((category, index) => (
                    <div key={index} className="panel">
                        <div className="flex items-center gap-4 mb-5">
                            <div className={`w-14 h-14 rounded-full ${category.color} text-white flex items-center justify-center`}>
                                {category.icon}
                            </div>
                            <h5 className="text-lg font-semibold dark:text-white-light">{category.title}</h5>
                        </div>
                        <div className="space-y-3">
                            {category.reports.map((report, idx) => (
                                <Link
                                    key={idx}
                                    to={report.path}
                                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                >
                                    <div>
                                        <p className="font-medium dark:text-white-light">{report.name}</p>
                                        <p className="text-sm text-gray-500">{report.description}</p>
                                    </div>
                                    <svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M9 5l7 7-7 7" />
                                    </svg>
                                </Link>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ReportsIndex;
