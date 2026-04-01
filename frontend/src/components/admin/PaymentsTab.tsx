import { useState, useEffect } from 'react';
import { CreditCard, Search, Filter, Download, ChevronLeft, ChevronRight, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { API_BASE_URL } from '@/config/apiConfig';
import { Order } from '@/types/admin';

interface PaymentsTabProps {
    initialFilter?: string;
}

export default function PaymentsTab({ initialFilter = '' }: PaymentsTabProps) {
    const { token } = useAuth();
    const salesExcludedStatuses = new Set(['cancelled', 'returned', 'rto', 'refunded']);
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState(initialFilter);
    const [showFilters, setShowFilters] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [stats, setStats] = useState({
        total: 0,
        paid: 0,
        pending: 0,
        refunded: 0,
        failed: 0,
        total_revenue: 0
    });

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setCurrentPage(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    // Fetch orders when filters or page change
    useEffect(() => {
        fetchOrders();
    }, [debouncedSearch, statusFilter, currentPage]);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (debouncedSearch) params.append('search', debouncedSearch);
            // We want all orders to manage payments, but maybe filter by payment status if specified
            if (statusFilter) params.append('payment_status', statusFilter);
            params.append('page', currentPage.toString());

            const res = await fetch(`${API_BASE_URL}/admin/orders/?${params.toString()}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (res.ok) {
                const data = await res.json();
                if (data.results) {
                    setOrders(data.results);
                    setTotalCount(data.count || 0);
                    const pageSize = 10;
                    setTotalPages(Math.ceil((data.count || 0) / pageSize));
                } else {
                    setOrders(data);
                    setTotalCount(data.length);
                    setTotalPages(1);
                }

                // Fetch stats (mocked or full fetch for now until specialized endpoint)
                // ideally we should have /admin/payments/stats endpoint
                calculateStats(data.results || data);
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (orderList: Order[]) => {
        // This is client side calculation on current page/fetched data, ideally needs backend stats
        // For now, let's try to fetch all or use existing stats endpoint
        const total = orderList.length;
        const paid = orderList.filter(o => o.payment_status === 'paid' || o.payment_status === 'received_from_meesho' || o.payment_status === 'received').length;
        const pending = orderList.filter(o => !o.payment_status || o.payment_status === 'pending' || o.payment_status === 'pending_cod').length;
        const refunded = orderList.filter(o => o.payment_status === 'refunded').length;
        const failed = orderList.filter(o => o.payment_status === 'failed_rto').length;
        const revenue = orderList.reduce((acc, o) => (
            salesExcludedStatuses.has(o.status || '')
                ? acc
                : acc + (
                    o.payment_status === 'paid' || o.payment_status === 'received_from_meesho' || o.payment_status === 'received'
                        ? (parseFloat(String(o.total_amount)) || 0)
                        : 0
                )
        ), 0);

        setStats({ total, paid, pending, refunded, failed, total_revenue: revenue });
    };

    const handleUpdatePaymentStatus = async (orderId: string, newStatus: string) => {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/orders/${orderId}/update_payment_status/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ payment_status: newStatus })
            });

            if (response.ok) {
                const statusLabel = paymentStatuses.find(s => s.value === newStatus)?.label || newStatus;
                setOrders(orders.map(o =>
                    o.id.toString() === orderId
                        ? { ...o, payment_status: newStatus, payment_status_display: statusLabel }
                        : o
                ));
            } else {
                alert('Failed to update payment status');
            }
        } catch (error) {
            console.error('Error updating payment status:', error);
            alert('An error occurred');
        }
    };

    const paymentStatuses = [
        { value: 'pending', label: 'Pending', color: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20' },
        { value: 'pending_cod', label: 'Pending COD Collection', color: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20' },
        { value: 'received', label: 'Payment Received', color: 'text-green-500 bg-green-500/10 border-green-500/20' },
        { value: 'received_from_meesho', label: 'Received (Meesho)', color: 'text-green-500 bg-green-500/10 border-green-500/20' },
        { value: 'failed_rto', label: 'Failed (RTO)', color: 'text-red-500 bg-red-500/10 border-red-500/20' },
        { value: 'refunded', label: 'Refunded', color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' },
        { value: 'paid', label: 'Paid', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' },
    ];

    const getStatusStyle = (status: string) => {
        const found = paymentStatuses.find(s => s.value === status);
        return found ? found.color : 'text-silver-500 bg-dark-700 border-dark-600';
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <CreditCard className="text-accent-500" size={28} />
                        Payment Management
                    </h2>
                    <p className="text-silver-500 mt-1">Track and manage order payments</p>
                </div>
                <button className="bg-accent-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-accent-500 transition-colors flex items-center gap-2 shadow-lg shadow-accent-500/20">
                    <Download size={18} />
                    Export Report
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div
                    onClick={() => setStatusFilter('')}
                    className={`p-4 rounded-xl border shadow-sm cursor-pointer transition-all ${statusFilter === '' ? 'bg-accent-500/10 border-accent-500' : 'bg-dark-800 border-dark-700 hover:border-silver-500'}`}
                >
                    <p className="text-sm text-silver-500">Total Revenue</p>
                    <p className="text-2xl font-bold text-white mt-1">₹{stats.total_revenue.toLocaleString()}</p>
                </div>
                <div
                    onClick={() => setStatusFilter('pending')}
                    className={`p-4 rounded-xl border shadow-sm cursor-pointer transition-all ${statusFilter === 'pending' ? 'bg-yellow-500/10 border-yellow-500' : 'bg-dark-800 border-dark-700 hover:border-yellow-500/50'}`}
                >
                    <p className="text-sm text-yellow-500">Pending Payments</p>
                    <p className="text-2xl font-bold text-white mt-1">{stats.pending}</p>
                </div>
                <div
                    onClick={() => setStatusFilter('paid,received_from_meesho')}
                    className={`p-4 rounded-xl border shadow-sm cursor-pointer transition-all ${statusFilter === 'paid,received_from_meesho' ? 'bg-green-500/10 border-green-500' : 'bg-dark-800 border-dark-700 hover:border-green-500/50'}`}
                >
                    <p className="text-sm text-green-500">Settled Payments</p>
                    <p className="text-2xl font-bold text-white mt-1">{stats.paid}</p>
                </div>
                <div
                    onClick={() => setStatusFilter('failed_rto,refunded')}
                    className={`p-4 rounded-xl border shadow-sm cursor-pointer transition-all ${statusFilter === 'failed_rto,refunded' ? 'bg-red-500/10 border-red-500' : 'bg-dark-800 border-dark-700 hover:border-red-500/50'}`}
                >
                    <p className="text-sm text-red-500">Failed/Refunded</p>
                    <p className="text-2xl font-bold text-white mt-1">{stats.failed + stats.refunded}</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-dark-800 p-4 rounded-xl border border-dark-700 shadow-sm">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-silver-500" size={20} />
                        <input
                            type="text"
                            placeholder="Search order ID or customer..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
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
                            <option value="">All Statuses</option>
                            {paymentStatuses.map(s => (
                                <option key={s.value} value={s.value}>{s.label}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Payments Table */}
            <div className="bg-dark-800 rounded-xl border border-dark-700 shadow-sm min-h-[400px]">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-500"></div>
                    </div>
                ) : (
                    <div className="rounded-xl">
                        <table className="w-full">
                            <thead className="bg-dark-900 border-b border-dark-700 text-xs uppercase font-semibold text-silver-500">
                                <tr>
                                    <th className="px-6 py-4 text-left tracking-wider">Order ID</th>
                                    <th className="px-6 py-4 text-left tracking-wider">Customer</th>
                                    <th className="px-6 py-4 text-left tracking-wider">Products</th>
                                    <th className="px-6 py-4 text-left tracking-wider">Amount</th>
                                    <th className="px-6 py-4 text-left tracking-wider">Profit</th>
                                    <th className="px-6 py-4 text-left tracking-wider">Payment Status</th>
                                    <th className="px-6 py-4 text-left tracking-wider">Method</th>
                                    <th className="px-6 py-4 text-left tracking-wider">Date</th>
                                    <th className="px-6 py-4 text-left tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-dark-700">
                                {orders.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-silver-500">
                                            No orders found.
                                        </td>
                                    </tr>
                                ) : (
                                    orders.map((order, index) => {
                                        const isLast = index >= orders.length - 2 && orders.length > 3;
                                        return (
                                            <tr key={order.id} className="hover:bg-dark-700/50 transition-colors group">
                                                <td className="px-6 py-4 font-medium text-white">{order.order_id}</td>
                                                <td className="px-6 py-4 text-silver-400">{order.customer?.name || 'Guest'}</td>
                                                <td className="px-6 py-4 text-white text-sm">
                                                    {order.items && order.items.length > 0 ? (
                                                        <span>
                                                            {order.items[0].product_name}
                                                            {order.items.length > 1 && <span className="text-silver-500 text-xs ml-1">+{order.items.length - 1} more</span>}
                                                        </span>
                                                    ) : (
                                                        <span className="text-silver-600 italic">No Items</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 font-bold text-white">₹{order.total_amount.toLocaleString()}</td>
                                                <td className={`px-6 py-4 font-bold ${(order.profit || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                    ₹{(order.profit || 0).toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-block whitespace-nowrap px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusStyle(order.payment_status || 'pending')}`}>
                                                        {order.payment_status_display || order.payment_status || 'Pending'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-silver-400 text-sm">
                                                    {order.is_cod ? 'Cash on Delivery' : 'Online Payment'}
                                                </td>
                                                <td className="px-6 py-4 text-silver-500 text-sm">
                                                    {new Date(order.created_at).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 relative">
                                                    <div className="relative">
                                                        {/* Using CSS Hover for simplicity but improved styling */}
                                                        <button className="text-silver-400 hover:text-white p-2 rounded-lg hover:bg-dark-600 transition-colors peer">
                                                            <RefreshCw size={16} />
                                                        </button>

                                                        {/* Quick Update Dropdown - Improved positioning and z-index */}
                                                        <div className={`absolute right-0 ${isLast ? 'bottom-full mb-2 origin-bottom-right' : 'top-full mt-2 origin-top-right'} w-48 bg-dark-900 rounded-xl shadow-2xl border border-dark-600 py-1 z-50 hidden peer-hover:block hover:block transition-all`}>
                                                            <div className="px-3 py-2 border-b border-dark-700 mb-1">
                                                                <p className="text-xs font-semibold text-silver-500 uppercase">Update Status</p>
                                                            </div>
                                                            {paymentStatuses.map(s => (
                                                                <button
                                                                    key={s.value}
                                                                    onClick={() => handleUpdatePaymentStatus(order.id.toString(), s.value)}
                                                                    className="w-full text-left px-4 py-2.5 text-sm text-silver-300 hover:bg-dark-800 hover:text-white transition-colors flex items-center gap-2"
                                                                >
                                                                    <div className={`w-2 h-2 rounded-full ${s.color.split(' ')[0].replace('text-', 'bg-')}`}></div>
                                                                    {s.label}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-dark-700 bg-dark-800">
                        <div className="text-sm text-silver-500">
                            Page {currentPage} of {totalPages}
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-2 bg-dark-700 border border-dark-600 rounded-lg hover:bg-dark-600 disabled:opacity-50 text-silver-300"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="p-2 bg-dark-700 border border-dark-600 rounded-lg hover:bg-dark-600 disabled:opacity-50 text-silver-300"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
