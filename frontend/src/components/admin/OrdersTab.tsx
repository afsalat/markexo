import { Search, Filter, RefreshCcw, Eye, ChevronLeft, ChevronRight, Download, Grid, List, Edit3 } from 'lucide-react';
import { Order } from '@/types/admin';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { API_BASE_URL } from '@/config/apiConfig';
import OrderDetail from './OrderDetail';
import OrderStats from './OrderStats';

interface OrdersTabProps {
    initialStatusFilter?: string;
}

export default function OrdersTab({ initialStatusFilter = '' }: OrdersTabProps) {
    const { token } = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState(initialStatusFilter);
    const [showFilters, setShowFilters] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
    const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);

    const handleUpdatePaymentStatus = async (orderId: string, newStatus: string) => {
        setEditingPaymentId(null);
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
                // Optimistic update
                setOrders(orders.map(o =>
                    o.id.toString() === orderId
                        ? { ...o, payment_status: newStatus }
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
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        confirmed: 0,
        shipped: 0,
        delivered: 0,
        cancelled: 0,
        returned: 0,
        revenue: 0
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

    // Reset to page 1 when filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [statusFilter]);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (debouncedSearch) params.append('search', debouncedSearch);
            if (statusFilter) params.append('status', statusFilter);
            params.append('page', currentPage.toString());

            const res = await fetch(`${API_BASE_URL}/admin/orders/?${params.toString()}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (res.ok) {
                const data = await res.json();
                // Handle paginated response
                if (data.results) {
                    setOrders(data.results);
                    setTotalCount(data.count || 0);
                    const pageSize = 10; // Default PAGE_SIZE
                    setTotalPages(Math.ceil((data.count || 0) / pageSize));
                } else {
                    setOrders(data);
                    setTotalCount(data.length);
                    setTotalPages(1);
                }

                // Calculate stats from all orders (fetch without pagination for stats)
                const statsRes = await fetch(`${API_BASE_URL}/admin/orders/`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (statsRes.ok) {
                    const statsData = await statsRes.json();
                    const allOrders = statsData.results || statsData;

                    setStats({
                        total: allOrders.length,
                        pending: allOrders.filter((o: any) => o.status === 'pending_verification').length,
                        confirmed: allOrders.filter((o: any) => o.status === 'confirmed').length,
                        shipped: allOrders.filter((o: any) => o.status === 'shipped' || o.status === 'out_for_delivery').length,
                        delivered: allOrders.filter((o: any) => o.status === 'delivered' || o.status === 'completed').length,
                        cancelled: allOrders.filter((o: any) => o.status === 'cancelled').length,
                        returned: allOrders.filter((o: any) => o.status === 'returned' || o.status === 'rto').length,
                        revenue: allOrders.reduce((sum: number, o: any) => sum + (o.total_amount || 0), 0)
                    });
                }
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatNumber = (num: number) => {
        return new Intl.NumberFormat('en-IN').format(num);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending_verification': return 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20';
            case 'confirmed': return 'bg-blue-500/10 text-blue-500 border border-blue-500/20';
            case 'ordered_from_meesho': return 'bg-purple-500/10 text-purple-500 border border-purple-500/20';
            case 'shipped': return 'bg-cyan-500/10 text-cyan-500 border border-cyan-500/20';
            case 'out_for_delivery': return 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20';
            case 'delivered': return 'bg-green-500/10 text-green-500 border border-green-500/20';
            case 'completed': return 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20';
            case 'rto': return 'bg-red-500/10 text-red-500 border border-red-500/20';
            case 'cancelled': return 'bg-red-500/10 text-red-500 border border-red-500/20';
            case 'returned': return 'bg-orange-500/10 text-orange-500 border border-orange-500/20';
            default: return 'bg-dark-700 text-silver-400 border border-dark-600';
        }
    };

    const statuses = ['pending', 'pending_verification', 'confirmed', 'processing', 'ordered_from_meesho', 'shipped', 'out_for_delivery', 'delivered', 'completed', 'rto', 'cancelled', 'returned'];

    if (selectedOrder) {
        return <OrderDetail order={selectedOrder} onBack={() => setSelectedOrder(null)} />;
    }

    return (
        <div className="animate-fade-in">
            {/* Stats Dashboard */}
            <OrderStats stats={stats} onStatusClick={(status) => setStatusFilter(status)} />

            <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                <h1 className="font-display text-2xl font-bold text-white">Orders</h1>
                <div className="flex flex-wrap gap-3 items-center w-full sm:w-auto flex-1 justify-start sm:justify-end">
                    {/* View Toggle */}
                    <div className="flex gap-1 bg-dark-800 p-1 rounded-lg border border-dark-700 shrink-0">
                        <button
                            onClick={() => setViewMode('table')}
                            className={`p-2 rounded transition-colors ${viewMode === 'table' ? 'bg-accent-500/10 text-accent-500 shadow-sm' : 'text-silver-500 hover:text-white'}`}
                            title="Table View"
                        >
                            <List size={18} />
                        </button>
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded transition-colors ${viewMode === 'grid' ? 'bg-accent-500/10 text-accent-500 shadow-sm' : 'text-silver-500 hover:text-white'}`}
                            title="Grid View"
                        >
                            <Grid size={18} />
                        </button>
                    </div>

                    <div className="relative w-full sm:w-auto flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-silver-500" size={18} />
                        <input
                            type="text"
                            placeholder="Search orders..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-dark-700 rounded-lg outline-none focus:ring-2 focus:ring-accent-500 bg-dark-800 text-white placeholder-silver-600"
                        />
                    </div>
                    <div className="relative">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${statusFilter
                                ? 'bg-accent-600 text-white border border-accent-600'
                                : 'bg-dark-800 text-silver-300 border border-dark-700 hover:bg-dark-700'}`}
                        >
                            <Filter size={18} />
                            <span>{statusFilter ? statusFilter.replace(/_/g, ' ') : 'Filter'}</span>
                        </button>

                        {showFilters && (
                            <div className="absolute right-0 mt-2 w-56 bg-dark-800 rounded-xl shadow-lg border border-dark-700 py-1 z-50">
                                <button
                                    onClick={() => { setStatusFilter(''); setShowFilters(false); }}
                                    className="block w-full text-left px-4 py-2 text-sm text-silver-300 hover:bg-dark-700"
                                >
                                    All Orders
                                </button>
                                {statuses.map(s => (
                                    <button
                                        key={s}
                                        onClick={() => { setStatusFilter(s); setShowFilters(false); }}
                                        className={`block w-full text-left px-4 py-2 text-sm hover:bg-dark-700 ${statusFilter === s ? 'bg-accent-500/10 text-accent-500 font-medium' : 'text-silver-300'}`}
                                    >
                                        {s.replace(/_/g, ' ')}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <button
                        onClick={fetchOrders}
                        className="p-2 bg-dark-800 border border-dark-700 rounded-lg hover:bg-dark-700 text-silver-400"
                        title="Refresh"
                    >
                        <RefreshCcw size={18} />
                    </button>
                    <button
                        className="flex items-center gap-2 px-4 py-2 bg-accent-600 text-white rounded-lg hover:bg-accent-500 transition-colors shadow-lg shadow-accent-500/20"
                        title="Export Orders"
                    >
                        <Download size={18} />
                        <span className="hidden sm:inline">Export</span>
                    </button>
                </div>
            </div>

            <div className="bg-dark-800 rounded-2xl shadow-sm overflow-hidden min-h-[400px] border border-dark-700">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-500"></div>
                    </div>
                ) : viewMode === 'table' ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-dark-700/50">
                                <tr>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-silver-500 uppercase">Order ID</th>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-silver-500 uppercase">Customer</th>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-silver-500 uppercase">Products</th>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-silver-500 uppercase">Amount</th>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-silver-500 uppercase">Cost</th>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-silver-500 uppercase">Profit</th>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-silver-500 uppercase">Status</th>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-silver-500 uppercase">Payment</th>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-silver-500 uppercase">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-dark-700">
                                {orders.map((order) => (
                                    <tr
                                        key={order.id}
                                        onClick={() => setSelectedOrder(order)}
                                        className="hover:bg-dark-700 border-transparent transition-all cursor-pointer group"
                                    >
                                        <td className="px-6 py-4 font-bold text-white group-hover:text-accent-500 transition-colors flex items-center gap-2">
                                            {order.order_id}
                                            <Eye size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-accent-400" />
                                        </td>
                                        <td className="px-6 py-4 text-silver-400 font-medium">{order.customer?.name || 'Guest'}</td>
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
                                        <td className="px-6 py-4 font-bold text-white tracking-tight">₹{formatNumber(order.total_amount)}</td>
                                        <td className="px-6 py-4 font-medium text-silver-400">₹{formatNumber(order.supplier_total_cost || 0)}</td>
                                        <td className={`px-6 py-4 font-bold ${(order.profit || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                            ₹{formatNumber(order.profit || 0)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider border ${getStatusColor(order.status)}`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="relative flex items-center gap-2">
                                                <span className={`inline-block whitespace-nowrap px-2 py-1 rounded text-xs font-bold border ${order.payment_status === 'received_from_meesho' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                                                    order.payment_status === 'failed_rto' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                                        'bg-dark-700 text-silver-500 border-dark-600'
                                                    }`}>
                                                    {order.payment_status_display || order.payment_status || 'Pending'}
                                                </span>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setEditingPaymentId(editingPaymentId === order.id.toString() ? null : order.id.toString());
                                                    }}
                                                    className="p-1 text-silver-600 hover:text-accent-500 rounded transition-colors"
                                                >
                                                    <Edit3 size={14} />
                                                </button>

                                                {editingPaymentId === order.id.toString() && (
                                                    <div className="absolute left-0 top-full mt-2 w-48 bg-dark-800 rounded-xl shadow-xl border border-dark-700 py-1 z-50 animate-fade-in">
                                                        {[
                                                            { value: 'pending', label: 'Pending' },
                                                            { value: 'received_from_meesho', label: 'Received (Meesho)' },
                                                            { value: 'failed_rto', label: 'Failed (RTO)' },
                                                            { value: 'refunded', label: 'Refunded' },
                                                            { value: 'paid', label: 'Paid' }
                                                        ].map((status) => (
                                                            <button
                                                                key={status.value}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleUpdatePaymentStatus(order.id.toString(), status.value);
                                                                }}
                                                                className="w-full text-left px-4 py-2 text-sm text-silver-300 hover:bg-dark-700 hover:text-white transition-colors"
                                                            >
                                                                {status.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}

                                                {order.is_cod && <span className="text-[10px] bg-dark-700 border border-dark-600 px-1 rounded text-silver-500">COD</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-silver-500 font-medium">{formatDate(order.created_at)}</td>
                                    </tr>
                                ))}
                                {orders.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-silver-500">
                                            No orders found matching your criteria.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
                        {orders.map((order) => (
                            <div
                                key={order.id}
                                onClick={() => setSelectedOrder(order)}
                                className="bg-dark-800 border border-dark-700 rounded-xl p-4 hover:shadow-lg hover:border-accent-500/50 transition-all cursor-pointer group"
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <p className="text-xs text-silver-500 font-medium">Order ID</p>
                                        <p className="text-sm font-bold text-accent-500 group-hover:text-accent-400">{order.order_id}</p>
                                    </div>
                                    <Eye size={16} className="text-silver-600 group-hover:text-accent-500 transition-colors" />
                                </div>

                                <div className="space-y-2 mb-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-silver-500">Customer</span>
                                        <span className="text-sm font-medium text-white">{order.customer?.name || 'Guest'}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-silver-500">Amount</span>
                                        <span className="text-sm font-bold text-white">₹{formatNumber(order.total_amount)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-silver-500">Date</span>
                                        <span className="text-xs text-silver-400">{formatDate(order.created_at)}</span>
                                    </div>
                                </div>

                                <div className="flex gap-2 flex-wrap">
                                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase border ${getStatusColor(order.status)}`}>
                                        {order.status}
                                    </span>
                                    <span className={`inline-block whitespace-nowrap px-2 py-1 rounded text-[10px] font-bold border ${order.payment_status === 'received_from_meesho' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                                        order.payment_status === 'failed_rto' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                            'bg-dark-700 text-silver-500 border-dark-600'
                                        }`}>
                                        {order.payment_status_display || order.payment_status || 'Pending'}
                                    </span>
                                    {order.is_cod && <span className="text-[10px] bg-dark-700 border border-dark-600 px-2 py-1 rounded text-silver-500">COD</span>}
                                </div>
                            </div>
                        ))}
                        {orders.length === 0 && (
                            <div className="col-span-full text-center py-12 text-silver-500">
                                No orders found matching your criteria.
                            </div>
                        )}
                    </div>
                )}

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="flex flex-wrap items-center justify-between px-6 py-4 border-t border-dark-700 bg-dark-800 gap-4">
                        <div className="text-sm text-silver-500">
                            Showing page <span className="font-medium text-white">{currentPage}</span> of{' '}
                            <span className="font-medium text-white">{totalPages}</span>
                            {' '}({totalCount} total orders)
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="flex items-center gap-1 px-4 py-2 bg-dark-800 border border-dark-600 rounded-lg hover:bg-dark-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium text-silver-300"
                            >
                                <ChevronLeft size={16} /> Previous
                            </button>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="flex items-center gap-1 px-4 py-2 bg-dark-800 border border-dark-600 rounded-lg hover:bg-dark-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium text-silver-300"
                            >
                                Next <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
