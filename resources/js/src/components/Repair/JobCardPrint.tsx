import React from 'react';
import { useCurrency } from '../../hooks/useCurrency';

interface JobCardPrintProps {
    data: {
        repair: any;
        shop: any;
        items_by_type: Record<string, any[]>;
        total_parts: number;
        total_services: number;
        total_other: number;
    };
}

const JobCardPrint: React.FC<JobCardPrintProps> = ({ data }) => {
    const { repair, shop, items_by_type, total_parts, total_services, total_other } = data;
    const { formatCurrency } = useCurrency();

    const formatDate = (date: string | null) => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div style={{ width: '100%', padding: '20px', fontFamily: 'Arial, sans-serif', fontSize: '12px' }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '20px', borderBottom: '2px solid #000', paddingBottom: '15px' }}>
                <h1 style={{ margin: '0 0 5px 0', fontSize: '24px', fontWeight: 'bold' }}>{shop?.name || 'Mobile Shop'}</h1>
                {shop?.address && <p style={{ margin: '0 0 3px 0' }}>{shop.address}</p>}
                {shop?.phone && <p style={{ margin: '0 0 3px 0' }}>Tel: {shop.phone}</p>}
                {shop?.email && <p style={{ margin: '0' }}>Email: {shop.email}</p>}
            </div>

            {/* Job Number */}
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: '0', fontSize: '20px', fontWeight: 'bold' }}>REPAIR JOB CARD</h2>
                <p style={{ margin: '5px 0', fontSize: '18px', fontWeight: 'bold' }}>#{repair.job_number}</p>
            </div>

            {/* Two Column Layout */}
            <div style={{ display: 'flex', marginBottom: '20px' }}>
                {/* Left Column - Customer & Device */}
                <div style={{ flex: 1, paddingRight: '15px' }}>
                    <h3 style={{ borderBottom: '1px solid #ccc', paddingBottom: '5px', marginBottom: '10px', fontSize: '14px' }}>Customer Information</h3>
                    <table style={{ width: '100%', fontSize: '12px' }}>
                        <tbody>
                            <tr>
                                <td style={{ width: '100px', padding: '3px 0', fontWeight: 'bold' }}>Name:</td>
                                <td>{repair.customer?.name || 'Walk-in Customer'}</td>
                            </tr>
                            <tr>
                                <td style={{ padding: '3px 0', fontWeight: 'bold' }}>Phone:</td>
                                <td>{repair.customer?.phone || '-'}</td>
                            </tr>
                            <tr>
                                <td style={{ padding: '3px 0', fontWeight: 'bold' }}>Email:</td>
                                <td>{repair.customer?.email || '-'}</td>
                            </tr>
                        </tbody>
                    </table>

                    <h3 style={{ borderBottom: '1px solid #ccc', paddingBottom: '5px', marginBottom: '10px', marginTop: '15px', fontSize: '14px' }}>Device Information</h3>
                    <table style={{ width: '100%', fontSize: '12px' }}>
                        <tbody>
                            <tr>
                                <td style={{ width: '100px', padding: '3px 0', fontWeight: 'bold' }}>Type:</td>
                                <td>{repair.device_type}</td>
                            </tr>
                            <tr>
                                <td style={{ padding: '3px 0', fontWeight: 'bold' }}>Brand:</td>
                                <td>{repair.device_brand || '-'}</td>
                            </tr>
                            <tr>
                                <td style={{ padding: '3px 0', fontWeight: 'bold' }}>Model:</td>
                                <td>{repair.device_model || '-'}</td>
                            </tr>
                            <tr>
                                <td style={{ padding: '3px 0', fontWeight: 'bold' }}>Serial/IMEI:</td>
                                <td>{repair.serial_imei || '-'}</td>
                            </tr>
                            <tr>
                                <td style={{ padding: '3px 0', fontWeight: 'bold' }}>Condition:</td>
                                <td>{repair.device_condition || '-'}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Right Column - Job Details */}
                <div style={{ flex: 1, paddingLeft: '15px', borderLeft: '1px solid #ccc' }}>
                    <h3 style={{ borderBottom: '1px solid #ccc', paddingBottom: '5px', marginBottom: '10px', fontSize: '14px' }}>Job Details</h3>
                    <table style={{ width: '100%', fontSize: '12px' }}>
                        <tbody>
                            <tr>
                                <td style={{ width: '120px', padding: '3px 0', fontWeight: 'bold' }}>Status:</td>
                                <td style={{ textTransform: 'capitalize' }}>{repair.status.replace('_', ' ')}</td>
                            </tr>
                            <tr>
                                <td style={{ padding: '3px 0', fontWeight: 'bold' }}>Priority:</td>
                                <td style={{ textTransform: 'capitalize' }}>{repair.priority}</td>
                            </tr>
                            <tr>
                                <td style={{ padding: '3px 0', fontWeight: 'bold' }}>Received:</td>
                                <td>{formatDate(repair.received_at)}</td>
                            </tr>
                            <tr>
                                <td style={{ padding: '3px 0', fontWeight: 'bold' }}>Est. Completion:</td>
                                <td>{formatDate(repair.estimated_completion)}</td>
                            </tr>
                            <tr>
                                <td style={{ padding: '3px 0', fontWeight: 'bold' }}>Technician:</td>
                                <td>{repair.technician?.name || 'Unassigned'}</td>
                            </tr>
                            <tr>
                                <td style={{ padding: '3px 0', fontWeight: 'bold' }}>Received By:</td>
                                <td>{repair.received_by?.name || '-'}</td>
                            </tr>
                            <tr>
                                <td style={{ padding: '3px 0', fontWeight: 'bold' }}>Warranty:</td>
                                <td>{repair.warranty_days} days</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Accessories */}
            {repair.accessories_received && repair.accessories_received.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                    <h3 style={{ borderBottom: '1px solid #ccc', paddingBottom: '5px', marginBottom: '10px', fontSize: '14px' }}>Accessories Received</h3>
                    <p>{repair.accessories_received.join(', ')}</p>
                </div>
            )}

            {/* Reported Issues */}
            <div style={{ marginBottom: '20px' }}>
                <h3 style={{ borderBottom: '1px solid #ccc', paddingBottom: '5px', marginBottom: '10px', fontSize: '14px' }}>Reported Issues</h3>
                <p style={{ whiteSpace: 'pre-wrap' }}>{repair.reported_issues}</p>
            </div>

            {/* Diagnosis */}
            {repair.diagnosis && (
                <div style={{ marginBottom: '20px' }}>
                    <h3 style={{ borderBottom: '1px solid #ccc', paddingBottom: '5px', marginBottom: '10px', fontSize: '14px' }}>Diagnosis</h3>
                    <p style={{ whiteSpace: 'pre-wrap' }}>{repair.diagnosis}</p>
                </div>
            )}

            {/* Parts & Services */}
            {repair.items && repair.items.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                    <h3 style={{ borderBottom: '1px solid #ccc', paddingBottom: '5px', marginBottom: '10px', fontSize: '14px' }}>Parts & Services</h3>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f5f5f5' }}>
                                <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'left' }}>Description</th>
                                <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center', width: '60px' }}>Type</th>
                                <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center', width: '50px' }}>Qty</th>
                                <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'right', width: '80px' }}>Price</th>
                                <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'right', width: '80px' }}>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {repair.items.map((item: any, index: number) => (
                                <tr key={index}>
                                    <td style={{ border: '1px solid #ccc', padding: '8px' }}>{item.description}</td>
                                    <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center', textTransform: 'capitalize' }}>{item.type}</td>
                                    <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>{item.quantity}</td>
                                    <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'right' }}>{formatCurrency(item.unit_price)}</td>
                                    <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'right' }}>{formatCurrency(item.total_price)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Cost Summary */}
            <div style={{ marginBottom: '20px' }}>
                <table style={{ width: '250px', marginLeft: 'auto', fontSize: '12px' }}>
                    <tbody>
                        {total_parts > 0 && (
                            <tr>
                                <td style={{ padding: '3px 10px' }}>Parts:</td>
                                <td style={{ textAlign: 'right', padding: '3px 0' }}>{formatCurrency(total_parts)}</td>
                            </tr>
                        )}
                        {total_services > 0 && (
                            <tr>
                                <td style={{ padding: '3px 10px' }}>Services:</td>
                                <td style={{ textAlign: 'right', padding: '3px 0' }}>{formatCurrency(total_services)}</td>
                            </tr>
                        )}
                        {total_other > 0 && (
                            <tr>
                                <td style={{ padding: '3px 10px' }}>Other:</td>
                                <td style={{ textAlign: 'right', padding: '3px 0' }}>{formatCurrency(total_other)}</td>
                            </tr>
                        )}
                        <tr style={{ borderTop: '2px solid #000', fontWeight: 'bold' }}>
                            <td style={{ padding: '5px 10px' }}>Total:</td>
                            <td style={{ textAlign: 'right', padding: '5px 0', fontSize: '14px' }}>{formatCurrency(repair.final_cost)}</td>
                        </tr>
                        <tr>
                            <td style={{ padding: '3px 10px', color: 'green' }}>Paid:</td>
                            <td style={{ textAlign: 'right', padding: '3px 0', color: 'green' }}>{formatCurrency(repair.paid_amount)}</td>
                        </tr>
                        <tr style={{ fontWeight: 'bold' }}>
                            <td style={{ padding: '3px 10px', color: repair.due_amount > 0 ? 'red' : 'green' }}>Due:</td>
                            <td style={{ textAlign: 'right', padding: '3px 0', color: repair.due_amount > 0 ? 'red' : 'green' }}>{formatCurrency(repair.due_amount)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Notes */}
            {repair.notes && (
                <div style={{ marginBottom: '20px' }}>
                    <h3 style={{ borderBottom: '1px solid #ccc', paddingBottom: '5px', marginBottom: '10px', fontSize: '14px' }}>Notes</h3>
                    <p style={{ whiteSpace: 'pre-wrap' }}>{repair.notes}</p>
                </div>
            )}

            {/* Signature Section */}
            <div style={{ display: 'flex', marginTop: '40px', paddingTop: '20px' }}>
                <div style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ borderTop: '1px solid #000', width: '200px', margin: '0 auto', paddingTop: '5px' }}>
                        Customer Signature
                    </div>
                </div>
                <div style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ borderTop: '1px solid #000', width: '200px', margin: '0 auto', paddingTop: '5px' }}>
                        Technician Signature
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div style={{ marginTop: '30px', paddingTop: '15px', borderTop: '1px solid #ccc', textAlign: 'center', fontSize: '10px', color: '#666' }}>
                <p style={{ margin: '0' }}>Thank you for choosing {shop?.name || 'our service'}!</p>
                <p style={{ margin: '5px 0 0 0' }}>Please keep this job card for pickup and warranty claims.</p>
            </div>
        </div>
    );
};

export default JobCardPrint;
