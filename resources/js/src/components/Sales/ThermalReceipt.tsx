import { useCurrency } from '../../hooks/useCurrency';

interface ThermalReceiptProps {
    data: {
        shop: {
            name: string;
            address?: string;
            phone?: string;
            email?: string;
            logo?: string;
        };
        sale: {
            invoice_number: string;
            date: string;
            subtotal: number;
            discount: number;
            tax: number;
            total: number;
            paid: number;
            due: number;
            payment_status: string;
        };
        customer?: {
            name: string;
            phone?: string;
            email?: string;
        } | null;
        cashier: string;
        items: {
            name: string;
            sku: string;
            serial?: string;
            quantity: number;
            unit_price: number;
            discount: number;
            total: number;
            warranty?: string;
            warranty_expires?: string;
        }[];
        payments: {
            method: string;
            amount: number;
            date: string;
            reference?: string;
        }[];
    };
}

const ThermalReceipt = ({ data }: ThermalReceiptProps) => {
    const { formatCurrency } = useCurrency();

    const styles = {
        receipt: {
            width: '80mm',
            padding: '5mm',
            fontFamily: 'monospace',
            fontSize: '12px',
            lineHeight: '1.4',
            color: '#000',
            backgroundColor: '#fff',
        },
        header: {
            textAlign: 'center' as const,
            marginBottom: '10px',
            borderBottom: '1px dashed #000',
            paddingBottom: '10px',
        },
        shopName: {
            fontSize: '18px',
            fontWeight: 'bold',
            marginBottom: '5px',
        },
        shopInfo: {
            fontSize: '10px',
        },
        section: {
            marginBottom: '10px',
        },
        row: {
            display: 'flex',
            justifyContent: 'space-between',
        },
        label: {
            fontWeight: 'normal' as const,
        },
        value: {
            fontWeight: 'bold' as const,
        },
        divider: {
            borderTop: '1px dashed #000',
            margin: '5px 0',
        },
        itemsTable: {
            width: '100%',
            borderCollapse: 'collapse' as const,
            marginBottom: '10px',
        },
        th: {
            textAlign: 'left' as const,
            borderBottom: '1px solid #000',
            paddingBottom: '5px',
            fontSize: '10px',
        },
        td: {
            padding: '3px 0',
            fontSize: '11px',
            verticalAlign: 'top' as const,
        },
        totalRow: {
            fontWeight: 'bold' as const,
            fontSize: '14px',
        },
        footer: {
            textAlign: 'center' as const,
            marginTop: '15px',
            paddingTop: '10px',
            borderTop: '1px dashed #000',
            fontSize: '10px',
        },
    };

    return (
        <div style={styles.receipt}>
            {/* Header */}
            <div style={styles.header}>
                {data.shop.logo && (
                    <img
                        src={`/storage/${data.shop.logo}`}
                        alt=""
                        style={{ width: '60px', height: '60px', margin: '0 auto 10px', objectFit: 'contain' }}
                    />
                )}
                <div style={styles.shopName}>{data.shop.name}</div>
                {data.shop.address && <div style={styles.shopInfo}>{data.shop.address}</div>}
                {data.shop.phone && <div style={styles.shopInfo}>Tel: {data.shop.phone}</div>}
                {data.shop.email && <div style={styles.shopInfo}>{data.shop.email}</div>}
            </div>

            {/* Invoice Info */}
            <div style={styles.section}>
                <div style={styles.row}>
                    <span>Invoice #:</span>
                    <span style={styles.value}>{data.sale.invoice_number}</span>
                </div>
                <div style={styles.row}>
                    <span>Date:</span>
                    <span>{data.sale.date}</span>
                </div>
                <div style={styles.row}>
                    <span>Cashier:</span>
                    <span>{data.cashier}</span>
                </div>
            </div>

            <div style={styles.divider}></div>

            {/* Customer */}
            {data.customer && (
                <>
                    <div style={styles.section}>
                        <div style={styles.row}>
                            <span>Customer:</span>
                            <span>{data.customer.name}</span>
                        </div>
                        {data.customer.phone && (
                            <div style={styles.row}>
                                <span>Phone:</span>
                                <span>{data.customer.phone}</span>
                            </div>
                        )}
                    </div>
                    <div style={styles.divider}></div>
                </>
            )}

            {/* Items */}
            <table style={styles.itemsTable}>
                <thead>
                    <tr>
                        <th style={{ ...styles.th, width: '50%' }}>Item</th>
                        <th style={{ ...styles.th, textAlign: 'center', width: '15%' }}>Qty</th>
                        <th style={{ ...styles.th, textAlign: 'right', width: '35%' }}>Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {data.items.map((item, index) => (
                        <tr key={index}>
                            <td style={styles.td}>
                                <div>{item.name}</div>
                                {item.serial && (
                                    <div style={{ fontSize: '9px', color: '#666' }}>IMEI: {item.serial}</div>
                                )}
                                {item.warranty && (
                                    <div style={{ fontSize: '9px', color: '#666' }}>Warranty: {item.warranty}</div>
                                )}
                                {item.discount > 0 && (
                                    <div style={{ fontSize: '9px', color: '#666' }}>Disc: -{formatCurrency(item.discount)}</div>
                                )}
                            </td>
                            <td style={{ ...styles.td, textAlign: 'center' }}>{item.quantity}</td>
                            <td style={{ ...styles.td, textAlign: 'right' }}>{formatCurrency(item.total)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div style={styles.divider}></div>

            {/* Totals */}
            <div style={styles.section}>
                <div style={styles.row}>
                    <span>Subtotal:</span>
                    <span>{formatCurrency(data.sale.subtotal)}</span>
                </div>
                {data.sale.discount > 0 && (
                    <div style={styles.row}>
                        <span>Discount:</span>
                        <span>-{formatCurrency(data.sale.discount)}</span>
                    </div>
                )}
                {data.sale.tax > 0 && (
                    <div style={styles.row}>
                        <span>Tax:</span>
                        <span>{formatCurrency(data.sale.tax)}</span>
                    </div>
                )}
                <div style={{ ...styles.divider, marginTop: '5px' }}></div>
                <div style={{ ...styles.row, ...styles.totalRow }}>
                    <span>TOTAL:</span>
                    <span>{formatCurrency(data.sale.total)}</span>
                </div>
            </div>

            {/* Payments */}
            {data.payments.length > 0 && (
                <div style={styles.section}>
                    <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Payment(s):</div>
                    {data.payments.map((payment, index) => (
                        <div key={index} style={styles.row}>
                            <span>{payment.method}:</span>
                            <span>{formatCurrency(payment.amount)}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Change/Due */}
            {data.sale.paid > data.sale.total && (
                <div style={{ ...styles.row, marginTop: '5px' }}>
                    <span>Change:</span>
                    <span style={styles.value}>{formatCurrency(data.sale.paid - data.sale.total)}</span>
                </div>
            )}

            {data.sale.due > 0 && (
                <div style={{ ...styles.row, marginTop: '5px', color: 'red' }}>
                    <span>Balance Due:</span>
                    <span style={styles.value}>{formatCurrency(data.sale.due)}</span>
                </div>
            )}

            {/* Footer */}
            <div style={styles.footer}>
                <p>Thank you for your purchase!</p>
                <p>Please keep this receipt for warranty claims.</p>
                <p style={{ marginTop: '10px' }}>
                    * Items with warranty must be returned<br />
                    with original receipt and packaging *
                </p>
            </div>

        </div>
    );
};

export default ThermalReceipt;
