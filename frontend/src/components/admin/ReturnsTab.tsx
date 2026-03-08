'use client';

import { useState, useEffect } from 'react';
import { RotateCcw, Search, Filter, CheckCircle, XCircle, Clock, Package, AlertCircle, Eye, Download, Edit3 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { API_BASE_URL } from '@/config/apiConfig';

interface ReturnRequest {
    id: string;
    order_id: string;
    customer_name: string;
    customer_email: string;
    product_name: string;
    amount: number;
    reason: string;
    status: 'pending' | 'approved' | 'rejected' | 'refunded';
    requested_date: string;
    processed_date?: string;
    refund_method?: string;
    payment_status?: string;
    payment_status_display?: string;
    mrp?: number;

    original_price?: number;
    profit?: number;
    items_count?: number;
}

export default function ReturnsTab() {
    const { token } = useAuth();
    const [returns, setReturns] = useState<ReturnRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [selectedReturn, setSelectedReturn] = useState<ReturnRequest | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);

    const handleUpdatePaymentStatus = async (returnId: string, newStatus: string) => {
        setEditingPaymentId(null);
        try {
            const response = await fetch(`${API_BASE_URL}/admin/orders/${returnId.toString()}/update_payment_status/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ payment_status: newStatus })
            });

            if (response.ok) {
                const statusLabels: { [key: string]: string } = {
                    'pending': 'Pending',
                    'pending_cod': 'Pending COD',
                    'received': 'Payment Received',
                    'received_from_meesho': 'Received (Meesho)',
                    'failed_rto': 'Failed (RTO)',
                    'refunded': 'Refunded',
                    'paid': 'Paid'
                };
                const display = statusLabels[newStatus] || newStatus;

                setReturns(returns.map(r =>
                    r.id === returnId
                        ? { ...r, payment_status: newStatus, payment_status_display: display }
                        : r
                ));
            } else {
                alert('Failed to update payment status');
            }
        } catch (error) {
            console.error('Error updating payment status:', error);
            alert('An error occurred');
        }
    };

    useEffect(() => {
        fetchReturns();
    }, []);

    const fetchReturns = async () => {
        setLoading(true);
        try {
            // Fetch all pages of orders
            let allOrders: any[] = [];
            let page = 1;
            let hasMore = true;

            while (hasMore) {
                const response = await fetch(`${API_BASE_URL}/admin/orders/?page=${page}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (response.ok) {
                    const data = await response.json();
                    const orders = data.results || data;

                    if (Array.isArray(orders)) {
                        allOrders = [...allOrders, ...orders];
                        // Check if there are more pages
                        hasMore = data.next != null;
                        page++;
                    } else {
                        // If it's not paginated, just use the data
                        allOrders = Array.isArray(data) ? data : [data];
                        hasMore = false;
                    }
                } else {
                    hasMore = false;
                }
            }

            console.log('Total orders fetched:', allOrders.length);
            console.log('All order statuses:', allOrders.map(o => ({ id: o.order_id || o.id, status: o.status })));

            // Filter for ALL return-related orders (case-insensitive)
            const returnedOrders = allOrders.filter((order: any) => {
                const status = (order.status || '').toLowerCase();
                const normalizedStatus = status.replace(/[_\s\(\)]/g, '');

                // Check for any return-related status
                const isReturn =
                    status.includes('return') ||
                    status.includes('rto') ||
                    status.includes('refund') ||
                    normalizedStatus.includes('returnedtoorigin') ||
                    normalizedStatus.includes('returnedcustomer') ||
                    normalizedStatus.includes('origintoreturn');

                if (isReturn) {
                    console.log('Found returned order:', order.order_id || order.id, 'with status:', order.status);
                }

                return isReturn;
            });

            console.log('Filtered returned orders:', returnedOrders.length);

            // Transform orders into return requests format
            const transformedReturns: ReturnRequest[] = returnedOrders.map((order: any) => {
                const status = (order.status || '').toLowerCase();

                // Determine return status based on order status
                let returnStatus: 'pending' | 'approved' | 'rejected' | 'refunded' = 'pending';

                if (status.includes('refund') || status === 'returned') {
                    returnStatus = 'refunded';
                } else if (status.includes('rto') || status.includes('returned to origin')) {
                    returnStatus = 'approved'; // RTO means return approved and in transit back
                } else if (status.includes('returned (customer)') || status.includes('customer')) {
                    returnStatus = 'approved'; // Customer initiated return
                } else if (status.includes('return') && !status.includes('request')) {
                    returnStatus = 'approved';
                } else {
                    returnStatus = 'pending'; // Return requested but not yet processed
                }

                const firstItem = order.items?.[0];
                return {
                    id: order.id,
                    order_id: order.order_id || order.id,
                    customer_name: order.customer_name || order.customer?.name || 'N/A',
                    customer_email: order.customer_email || order.customer?.email || 'N/A',
                    product_name: firstItem?.product_name || order.product_name || 'Multiple Items',
                    amount: typeof order.total_amount === 'string' ? parseFloat(order.total_amount) : (order.total_amount || 0),
                    reason: order.return_reason || 'No reason provided',
                    status: returnStatus,
                    requested_date: order.created_at || order.date || new Date().toISOString().split('T')[0],
                    processed_date: order.updated_at,
                    refund_method: order.is_cod ? 'Cash on Delivery' : 'Online Payment',
                    payment_status: order.payment_status,
                    payment_status_display: order.payment_status_display,
                    mrp: firstItem?.mrp ? Number(firstItem.mrp) : undefined,
                    original_price: firstItem?.original_price ? Number(firstItem.original_price) : undefined,
                    profit: order.profit || 0,
                    items_count: order.items?.length || 0
                };
            });

            setReturns(transformedReturns);
        } catch (error) {
            console.error('Failed to fetch returns:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (returnId: string, newStatus: string) => {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/orders/${returnId}/`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: newStatus })
            });
            if (response.ok) {
                fetchReturns();
                alert(`Return ${newStatus} successfully`);
            } else {
                alert('Failed to update return status');
            }
        } catch (error) {
            console.error('Failed to update return status:', error);
            alert('Failed to update return status');
        }
    };

    const filteredReturns = returns.filter(ret => {
        const matchesSearch = ret.order_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ret.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ret.customer_email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || ret.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getStatusBadge = (status: string) => {
        const styles = {
            pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
            approved: 'bg-green-500/10 text-green-500 border-green-500/20',
            rejected: 'bg-red-500/10 text-red-500 border-red-500/20',
            refunded: 'bg-blue-500/10 text-blue-500 border-blue-500/20'
        };
        return styles[status as keyof typeof styles] || 'bg-dark-700 text-silver-400';
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pending': return <Clock size={16} />;
            case 'approved': return <CheckCircle size={16} />;
            case 'rejected': return <XCircle size={16} />;
            case 'refunded': return <Package size={16} />;
            default: return <AlertCircle size={16} />;
        }
    };

    const stats = {
        total: returns.length,
        pending: returns.filter(r => r.status === 'pending').length,
        approved: returns.filter(r => r.status === 'approved').length,
        rejected: returns.filter(r => r.status === 'rejected').length,
        refunded: returns.filter(r => r.status === 'refunded').length
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <RotateCcw className="text-accent-500" size={28} />
                        Return Requests
                    </h2>
                    <p className="text-silver-500 mt-1">Manage product returns and refunds</p>
                </div>
                <button className="bg-accent-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-accent-500 transition-colors flex items-center gap-2 shadow-lg shadow-accent-500/20">
                    <Download size={18} />
                    Export Returns
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="bg-dark-800 p-4 rounded-xl border border-dark-700 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-silver-500">Total Returns</p>
                            <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
                        </div>
                        <div className="w-12 h-12 bg-dark-700 rounded-xl flex items-center justify-center">
                            <RotateCcw className="text-silver-400" size={24} />
                        </div>
                    </div>
                </div>
                <div className="bg-dark-800 p-4 rounded-xl border border-dark-700 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-yellow-500">Pending</p>
                            <p className="text-2xl font-bold text-white mt-1">{stats.pending}</p>
                        </div>
                        <div className="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center border border-yellow-500/20">
                            <Clock className="text-yellow-500" size={24} />
                        </div>
                    </div>
                </div>
                <div className="bg-dark-800 p-4 rounded-xl border border-dark-700 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-green-500">Approved</p>
                            <p className="text-2xl font-bold text-white mt-1">{stats.approved}</p>
                        </div>
                        <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center border border-green-500/20">
                            <CheckCircle className="text-green-500" size={24} />
                        </div>
                    </div>
                </div>
                <div className="bg-dark-800 p-4 rounded-xl border border-dark-700 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-red-500">Rejected</p>
                            <p className="text-2xl font-bold text-white mt-1">{stats.rejected}</p>
                        </div>
                        <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center border border-red-500/20">
                            <XCircle className="text-red-500" size={24} />
                        </div>
                    </div>
                </div>
                <div className="bg-dark-800 p-4 rounded-xl border border-dark-700 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-blue-500">Refunded</p>
                            <p className="text-2xl font-bold text-white mt-1">{stats.refunded}</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20">
                            <Package className="text-blue-500" size={24} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-dark-800 p-4 rounded-xl border border-dark-700 shadow-sm">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-silver-500" size={20} />
                        <input
                            type="text"
                            placeholder="Search by order ID, customer name, or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-dark-600 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent outline-none bg-dark-700 text-white placeholder-silver-600"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Filter size={20} className="text-silver-500" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-4 py-2 border border-dark-600 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent outline-none bg-dark-700 text-white"
                        >
                            <option value="all">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                            <option value="refunded">Refunded</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Returns Table */}
            <div className="bg-dark-800 rounded-xl border border-dark-700 shadow-sm min-h-[400px]">
                <div>
                    <table className="w-full">
                        <thead className="bg-dark-700/50 border-b border-dark-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-silver-500 uppercase tracking-wider">Order ID</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-silver-500 uppercase tracking-wider">Customer</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-silver-500 uppercase tracking-wider">Payment Status</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-silver-500 uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-silver-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-silver-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-silver-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-dark-700">
                            {filteredReturns.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center">
                                            <RotateCcw className="text-dark-600 mb-3" size={48} />
                                            <p className="text-silver-500 font-medium">No return requests found</p>
                                            <p className="text-silver-600 text-sm mt-1">Return requests will appear here</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredReturns.map((returnReq, index) => {
                                    const isLast = index >= filteredReturns.length - 2 && filteredReturns.length > 3;
                                    return (
                                        <tr key={returnReq.id} className="hover:bg-dark-700 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm font-medium text-accent-500">{returnReq.order_id}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="text-sm font-medium text-white">{returnReq.customer_name}</p>
                                                    <p className="text-xs text-silver-500">{returnReq.customer_email}</p>
                                                </div>
                                            </td>

                                            <td className="px-6 py-4">
                                                <div className="relative flex items-center gap-2">
                                                    <span className={`inline-block whitespace-nowrap px-2 py-1 rounded text-xs font-bold border ${returnReq.payment_status === 'received_from_meesho' || returnReq.payment_status === 'received' || returnReq.payment_status === 'paid' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                                                        returnReq.payment_status === 'failed_rto' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                                            returnReq.payment_status === 'refunded' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                                                                returnReq.payment_status === 'pending' || returnReq.payment_status === 'pending_cod' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                                                                    'bg-dark-700 text-silver-500 border-dark-600'
                                                        }`}>
                                                        {returnReq.payment_status_display || returnReq.payment_status || 'Pending'}
                                                    </span>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setEditingPaymentId(editingPaymentId === returnReq.id ? null : returnReq.id);
                                                        }}
                                                        className="p-1 text-silver-600 hover:text-accent-500 rounded transition-colors"
                                                    >
                                                        <Edit3 size={14} />
                                                    </button>

                                                    {editingPaymentId === returnReq.id && (
                                                        <div className={`absolute left-0 ${isLast ? 'bottom-full mb-2' : 'top-full mt-2'} w-48 bg-dark-800 rounded-xl shadow-xl border border-dark-700 py-1 z-50 animate-fade-in`}>
                                                            {[
                                                                { value: 'pending', label: 'Pending' },
                                                                { value: 'pending_cod', label: 'Pending COD' },
                                                                { value: 'received', label: 'Payment Received' },
                                                                { value: 'received_from_meesho', label: 'Received (Meesho)' },
                                                                { value: 'paid', label: 'Paid' },
                                                                { value: 'failed_rto', label: 'Failed (RTO)' },
                                                                { value: 'refunded', label: 'Refunded' },
                                                            ].map((status) => (
                                                                <button
                                                                    key={status.value}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleUpdatePaymentStatus(returnReq.id, status.value);
                                                                    }}
                                                                    className="w-full text-left px-4 py-2 text-sm text-silver-300 hover:bg-dark-700 hover:text-white transition-colors"
                                                                >
                                                                    {status.label}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-white">₹{returnReq.amount.toLocaleString()}</span>
                                                    {returnReq.original_price && returnReq.original_price > returnReq.amount && (
                                                        <span className="text-xs text-silver-500 line-through">₹{returnReq.original_price.toLocaleString()}</span>
                                                    )}
                                                    {returnReq.mrp && (
                                                        <span className="text-[10px] text-silver-600">MRP: ₹{returnReq.mrp.toLocaleString()}</span>
                                                    )}
                                                </div>
                                            </td>

                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex whitespace-nowrap items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(returnReq.status)}`}>
                                                    {getStatusIcon(returnReq.status)}
                                                    {returnReq.status.charAt(0).toUpperCase() + returnReq.status.slice(1)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-silver-500">
                                                {new Date(returnReq.requested_date).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedReturn(returnReq);
                                                            setShowDetailModal(true);
                                                        }}
                                                        className="text-silver-400 hover:text-accent-500 transition-colors"
                                                        title="View Details"
                                                    >
                                                        <Eye size={18} />
                                                    </button>
                                                    {returnReq.status === 'pending' && (
                                                        <>
                                                            <button
                                                                onClick={() => handleStatusUpdate(returnReq.id, 'approved')}
                                                                className="text-green-500 hover:text-green-400 transition-colors"
                                                                title="Approve"
                                                            >
                                                                <CheckCircle size={18} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleStatusUpdate(returnReq.id, 'rejected')}
                                                                className="text-red-500 hover:text-red-400 transition-colors"
                                                                title="Reject"
                                                            >
                                                                <XCircle size={18} />
                                                            </button>
                                                        </>
                                                    )}
                                                    {returnReq.status === 'approved' && (
                                                        <button
                                                            onClick={() => handleStatusUpdate(returnReq.id, 'refunded')}
                                                            className="text-blue-500 hover:text-blue-400 transition-colors text-xs font-medium px-2 py-1 border border-blue-500/30 rounded bg-blue-500/10"
                                                            title="Mark as Refunded"
                                                        >
                                                            Refund
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Detail Modal */}
            {showDetailModal && selectedReturn && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-dark-800 rounded-2xl p-6 max-w-2xl w-full shadow-2xl border border-dark-700">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-white">Return Request Details</h3>
                                <p className="text-sm text-silver-500 mt-1">Order ID: {selectedReturn.order_id}</p>
                            </div>
                            <button
                                onClick={() => setShowDetailModal(false)}
                                className="text-silver-400 hover:text-white"
                            >
                                <XCircle size={24} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-silver-500">Customer Name</p>
                                    <p className="font-medium text-white">{selectedReturn.customer_name}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-silver-500">Email</p>
                                    <p className="font-medium text-white">{selectedReturn.customer_email}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-silver-500">Product</p>
                                    <p className="font-medium text-white">
                                        {selectedReturn.product_name}
                                        {(selectedReturn.items_count || 0) > 1 && (
                                            <span className="text-silver-500 text-xs ml-1">
                                                +{(selectedReturn.items_count || 0) - 1} more
                                            </span>
                                        )}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-silver-500">Amount</p>
                                    <div className="flex flex-col">
                                        <p className="font-medium text-white">₹{selectedReturn.amount.toLocaleString()}</p>
                                        {selectedReturn.original_price && selectedReturn.original_price > selectedReturn.amount && (
                                            <p className="text-xs text-silver-500 line-through">₹{selectedReturn.original_price.toLocaleString()}</p>
                                        )}
                                        {selectedReturn.mrp && (
                                            <p className="text-[10px] text-silver-600">MRP: ₹{selectedReturn.mrp.toLocaleString()}</p>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm text-silver-500">Profit</p>
                                    <p className={`text-lg font-bold ${(selectedReturn.profit || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                        ₹{(selectedReturn.profit || 0).toLocaleString()}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-silver-500">Status</p>
                                    <span className={`inline-flex whitespace-nowrap items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(selectedReturn.status)}`}>
                                        {getStatusIcon(selectedReturn.status)}
                                        {selectedReturn.status.charAt(0).toUpperCase() + selectedReturn.status.slice(1)}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-sm text-silver-500">Requested Date</p>
                                    <p className="font-medium text-white">{new Date(selectedReturn.requested_date).toLocaleString()}</p>
                                </div>
                            </div>

                            <div>
                                <p className="text-sm text-silver-500 mb-2">Return Reason</p>
                                <div className="bg-dark-700 p-4 rounded-lg border border-dark-600">
                                    <p className="text-white">{selectedReturn.reason}</p>
                                </div>
                            </div>

                            {selectedReturn.status === 'pending' && (
                                <div className="flex gap-3 pt-4 border-t border-dark-700">
                                    <button
                                        onClick={() => {
                                            handleStatusUpdate(selectedReturn.id, 'approved');
                                            setShowDetailModal(false);
                                        }}
                                        className="flex-1 bg-green-500 text-white py-2 px-4 rounded-xl font-medium hover:bg-green-600 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-green-500/20"
                                    >
                                        <CheckCircle size={18} />
                                        Approve Return
                                    </button>
                                    <button
                                        onClick={() => {
                                            handleStatusUpdate(selectedReturn.id, 'rejected');
                                            setShowDetailModal(false);
                                        }}
                                        className="flex-1 bg-red-500 text-white py-2 px-4 rounded-xl font-medium hover:bg-red-600 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-red-500/20"
                                    >
                                        <XCircle size={18} />
                                        Reject Return
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
