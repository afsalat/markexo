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

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setCurrentPage(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        fetchOrders();
    }, [debouncedSearch, statusFilter, currentPage]);

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
            <OrderStats stats={stats} onStatusClick={(status) => setStatusFilter(status)} />

            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <h1 className="font-display text-2xl font-bold text-white">Orders</h1>
                <div className="flex w-full flex-1 flex-wrap items-center justify-start gap-3 sm:w-auto sm:justify-end">
                    <div className="flex shrink-0 gap-1 rounded-lg border border-dark-700 bg-dark-800 p-1">
                        <button
                            onClick={() => setViewMode('table')}
                            className={`rounded p-2 transition-colors ${viewMode === 'table' ? 'bg-accent-500/10 text-accent-500 shadow-sm' : 'text-silver-500 hover:text-white'}`}
                            title="Table View"
                        >
                            <List size={18} />
                        </button>
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`rounded p-2 transition-colors ${viewMode === 'grid' ? 'bg-accent-500/10 text-accent-500 shadow-sm' : 'text-silver-500 hover:text-white'}`}
                            title="Grid View"
                        >
                            <Grid size={18} />
                        </button>
                    </div>

                    <div className="relative min-w-[200px] flex-1 sm:w-auto">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-silver-500" size={18} />
                        <input
                            type="text"
                            placeholder="Search orders..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full rounded-lg border border-dark-700 bg-dark-800 py-2 pl-10 pr-4 text-white outline-none placeholder-silver-600 focus:ring-2 focus:ring-accent-500"
                        />
                    </div>

                    <div className="relative">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center gap-2 rounded-lg px-4 py-2 transition-colors ${statusFilter
                                ? 'border border-accent-600 bg-accent-600 text-white'
                                : 'border border-dark-700 bg-dark-800 text-silver-300 hover:bg-dark-700'}`}
                        >
                            <Filter size={18} />
                            <span>{statusFilter ? statusFilter.replace(/_/g, ' ') : 'Filter'}</span>
                        </button>

                        {showFilters && (
                            <div className="absolute right-0 z-50 mt-2 w-56 rounded-xl border border-dark-700 bg-dark-800 py-1 shadow-lg">
                                <button
                                    onClick={() => { setStatusFilter(''); setShowFilters(false); }}
                                    className="block w-full px-4 py-2 text-left text-sm text-silver-300 hover:bg-dark-700"
                                >
                                    All Orders
                                </button>
                                {statuses.map(s => (
                                    <button
                                        key={s}
                                        onClick={() => { setStatusFilter(s); setShowFilters(false); }}
                                        className={`block w-full px-4 py-2 text-left text-sm hover:bg-dark-700 ${statusFilter === s ? 'bg-accent-500/10 font-medium text-accent-500' : 'text-silver-300'}`}
                                    >
                                        {s.replace(/_/g, ' ')}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <button
                        onClick={fetchOrders}
                        className="rounded-lg border border-dark-700 bg-dark-800 p-2 text-silver-400 hover:bg-dark-700"
                        title="Refresh"
                    >
                        <RefreshCcw size={18} />
                    </button>

                    <button
                        className="flex items-center gap-2 rounded-lg bg-accent-600 px-4 py-2 text-white shadow-lg shadow-accent-500/20 transition-colors hover:bg-accent-500"
                        title="Export Orders"
                    >
                        <Download size={18} />
                        <span className="hidden sm:inline">Export</span>
                    </button>
                </div>
            </div>

            <div className="min-h-[400px] overflow-hidden rounded-2xl border border-dark-700 bg-dark-800 shadow-sm">
                {loading ? (
                    <div className="flex h-64 items-center justify-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-accent-500"></div>
                    </div>
                ) : viewMode === 'table' ? (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1240px] table-fixed">
                            <thead className="bg-dark-700/50">
                                <tr>
                                    <th className="w-[170px] px-6 py-3 text-left text-xs font-medium uppercase text-silver-500">Order ID</th>
                                    <th className="w-[150px] px-6 py-3 text-left text-xs font-medium uppercase text-silver-500">Customer</th>
                                    <th className="w-[320px] px-6 py-3 text-left text-xs font-medium uppercase text-silver-500">Products</th>
                                    <th className="w-[110px] px-6 py-3 text-left text-xs font-medium uppercase text-silver-500">Amount</th>
                                    <th className="w-[110px] px-6 py-3 text-left text-xs font-medium uppercase text-silver-500">Cost</th>
                                    <th className="w-[110px] px-6 py-3 text-left text-xs font-medium uppercase text-silver-500">Profit</th>
                                    <th className="w-[170px] px-6 py-3 text-left text-xs font-medium uppercase text-silver-500">Status</th>
                                    <th className="w-[230px] px-6 py-3 text-left text-xs font-medium uppercase text-silver-500">Payment</th>
                                    <th className="w-[130px] px-6 py-3 text-left text-xs font-medium uppercase text-silver-500">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-dark-700">
                                {orders.map((order) => (
                                    <tr
                                        key={order.id}
                                        onClick={() => setSelectedOrder(order)}
                                        className="group cursor-pointer border-transparent transition-all hover:bg-dark-700"
                                    >
                                        <td className="px-6 py-4 align-top font-bold text-white transition-colors group-hover:text-accent-500">
                                            <div className="flex items-center gap-2 whitespace-nowrap">
                                                <span>{order.order_id}</span>
                                                <Eye size={14} className="text-accent-400 opacity-0 transition-opacity group-hover:opacity-100" />
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 align-top whitespace-normal break-normal font-medium text-silver-400">{order.customer?.name || 'Guest'}</td>
                                        <td className="px-6 py-4 align-top text-sm text-white">
                                            {order.items && order.items.length > 0 ? (
                                                <div className="space-y-1">
                                                    <span className="block whitespace-normal break-normal leading-snug">
                                                        {order.items[0].product_name}
                                                    </span>
                                                    {order.items.length > 1 && <span className="text-xs text-silver-500">+{order.items.length - 1} more</span>}
                                                </div>
                                            ) : (
                                                <span className="italic text-silver-600">No Items</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 align-top whitespace-nowrap font-bold tracking-tight text-white">&#8377;{formatNumber(order.total_amount)}</td>
                                        <td className="px-6 py-4 align-top whitespace-nowrap font-medium text-silver-400">&#8377;{formatNumber(order.supplier_total_cost || 0)}</td>
                                        <td className={`px-6 py-4 align-top whitespace-nowrap font-bold ${(order.profit || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                            &#8377;{formatNumber(order.profit || 0)}
                                        </td>
                                        <td className="px-6 py-4 align-top">
                                            <span className={`inline-flex whitespace-nowrap rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-wider ${getStatusColor(order.status)}`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 align-top">
                                            <div className="relative flex items-center gap-2 whitespace-nowrap">
                                                <span className={`inline-block rounded border px-2 py-1 text-xs font-bold whitespace-nowrap ${order.payment_status === 'received_from_meesho' ? 'border-green-500/20 bg-green-500/10 text-green-500' :
                                                    order.payment_status === 'failed_rto' ? 'border-red-500/20 bg-red-500/10 text-red-500' :
                                                        'border-dark-600 bg-dark-700 text-silver-500'
                                                    }`}>
                                                    {order.payment_status_display || order.payment_status || 'Pending'}
                                                </span>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setEditingPaymentId(editingPaymentId === order.id.toString() ? null : order.id.toString());
                                                    }}
                                                    className="rounded p-1 text-silver-600 transition-colors hover:text-accent-500"
                                                >
                                                    <Edit3 size={14} />
                                                </button>

                                                {editingPaymentId === order.id.toString() && (
                                                    <div className="absolute left-0 top-full z-50 mt-2 w-48 animate-fade-in rounded-xl border border-dark-700 bg-dark-800 py-1 shadow-xl">
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
                                                                className="w-full px-4 py-2 text-left text-sm text-silver-300 transition-colors hover:bg-dark-700 hover:text-white"
                                                            >
                                                                {status.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}

                                                {order.is_cod && <span className="rounded border border-dark-600 bg-dark-700 px-1 py-0.5 text-[10px] text-silver-500">COD</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 align-top whitespace-nowrap font-medium text-silver-500">{formatDate(order.created_at)}</td>
                                    </tr>
                                ))}
                                {orders.length === 0 && (
                                    <tr>
                                        <td colSpan={9} className="px-6 py-12 text-center text-silver-500">
                                            No orders found matching your criteria.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2 lg:grid-cols-3">
                        {orders.map((order) => (
                            <div
                                key={order.id}
                                onClick={() => setSelectedOrder(order)}
                                className="group cursor-pointer rounded-xl border border-dark-700 bg-dark-800 p-4 transition-all hover:border-accent-500/50 hover:shadow-lg"
                            >
                                <div className="mb-3 flex items-start justify-between">
                                    <div>
                                        <p className="text-xs font-medium text-silver-500">Order ID</p>
                                        <p className="text-sm font-bold text-accent-500 group-hover:text-accent-400">{order.order_id}</p>
                                    </div>
                                    <Eye size={16} className="text-silver-600 transition-colors group-hover:text-accent-500" />
                                </div>

                                <div className="mb-3 space-y-2">
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="text-xs text-silver-500">Customer</span>
                                        <span className="text-right text-sm font-medium text-white">{order.customer?.name || 'Guest'}</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="text-xs text-silver-500">Amount</span>
                                        <span className="whitespace-nowrap text-sm font-bold text-white">&#8377;{formatNumber(order.total_amount)}</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="text-xs text-silver-500">Date</span>
                                        <span className="whitespace-nowrap text-xs text-silver-400">{formatDate(order.created_at)}</span>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${getStatusColor(order.status)}`}>
                                        {order.status}
                                    </span>
                                    <span className={`inline-block whitespace-nowrap rounded border px-2 py-1 text-[10px] font-bold ${order.payment_status === 'received_from_meesho' ? 'border-green-500/20 bg-green-500/10 text-green-500' :
                                        order.payment_status === 'failed_rto' ? 'border-red-500/20 bg-red-500/10 text-red-500' :
                                            'border-dark-600 bg-dark-700 text-silver-500'
                                        }`}>
                                        {order.payment_status_display || order.payment_status || 'Pending'}
                                    </span>
                                    {order.is_cod && <span className="rounded border border-dark-600 bg-dark-700 px-2 py-1 text-[10px] text-silver-500">COD</span>}
                                </div>
                            </div>
                        ))}
                        {orders.length === 0 && (
                            <div className="col-span-full py-12 text-center text-silver-500">
                                No orders found matching your criteria.
                            </div>
                        )}
                    </div>
                )}

                {totalPages > 1 && (
                    <div className="flex flex-wrap items-center justify-between gap-4 border-t border-dark-700 bg-dark-800 px-6 py-4">
                        <div className="text-sm text-silver-500">
                            Showing page <span className="font-medium text-white">{currentPage}</span> of{' '}
                            <span className="font-medium text-white">{totalPages}</span>
                            {' '}({totalCount} total orders)
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="flex items-center gap-1 rounded-lg border border-dark-600 bg-dark-800 px-4 py-2 text-sm font-medium text-silver-300 hover:bg-dark-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <ChevronLeft size={16} /> Previous
                            </button>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="flex items-center gap-1 rounded-lg border border-dark-600 bg-dark-800 px-4 py-2 text-sm font-medium text-silver-300 hover:bg-dark-700 disabled:cursor-not-allowed disabled:opacity-50"
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
