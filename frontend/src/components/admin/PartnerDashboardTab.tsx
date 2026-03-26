import {
    DollarSign, ShoppingBag, Package, TrendingUp, Clock
} from 'lucide-react';
import { PartnerDashboardStats } from '@/types/admin';

interface PartnerDashboardTabProps {
    stats: PartnerDashboardStats;
}

export default function PartnerDashboardTab({ stats }: PartnerDashboardTabProps) {
    const formatCurrency = (num: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(num);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getStatusColor = (status: string) => {
        if (status === 'delivered') return 'bg-green-500/10 text-green-400 border border-green-500/20';
        if (status === 'cancelled') return 'bg-red-500/10 text-red-400 border border-red-500/20';
        return 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20';
    };

    return (
        <div className="animate-fade-in min-w-0 space-y-6">
            <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center" data-aos="fade-down">
                <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">Partner Dashboard</h1>
                <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400 sm:px-4 sm:text-sm">
                    You earn 30% of profit per sale
                </span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" data-aos="fade-up">
                <div className="group relative min-w-0 overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/20 to-emerald-900/20 p-4 shadow-lg sm:col-span-2 sm:p-6 xl:col-span-2">
                    <div className="absolute right-0 top-0 p-3 opacity-10 transition-opacity group-hover:opacity-20 sm:p-4">
                        <DollarSign size={64} className="sm:h-20 sm:w-20" />
                    </div>
                    <div className="relative z-10">
                        <div className="mb-2 flex items-center gap-2">
                            <div className="rounded-lg bg-emerald-500 p-2 text-white">
                                <DollarSign size={18} />
                            </div>
                            <span className="font-medium text-emerald-300">My Earnings</span>
                        </div>
                        <p className="break-words text-2xl font-bold text-white sm:text-3xl">{formatCurrency(stats.my_earnings)}</p>
                        <p className="mt-1 text-sm text-emerald-400">Total Commission</p>
                    </div>
                </div>

                <div className="min-w-0 rounded-2xl border border-dark-700 bg-dark-800 p-4 shadow-sm sm:p-6">
                    <div className="mb-4 flex items-center justify-between">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10 sm:h-12 sm:w-12">
                            <TrendingUp className="text-blue-400" size={22} />
                        </div>
                    </div>
                    <p className="break-words text-2xl font-bold text-white sm:text-3xl">{formatCurrency(stats.total_sales)}</p>
                    <p className="text-sm text-silver-500">Catalog Sales</p>
                </div>

                <div className="min-w-0 rounded-2xl border border-dark-700 bg-dark-800 p-4 shadow-sm sm:p-6">
                    <div className="mb-4 flex items-center justify-between">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10 sm:h-12 sm:w-12">
                            <DollarSign className="text-blue-400" size={22} />
                        </div>
                    </div>
                    <p className="break-words text-2xl font-bold text-white sm:text-3xl">{formatCurrency(stats.total_withdrawn || 0)}</p>
                    <p className="text-sm text-silver-500">Total Withdrawn</p>
                </div>

                <div className="min-w-0 rounded-2xl border border-dark-700 bg-dark-800 p-4 shadow-sm sm:p-6">
                    <div className="mb-4 flex items-center justify-between">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 sm:h-12 sm:w-12">
                            <TrendingUp className="text-emerald-400" size={22} />
                        </div>
                    </div>
                    <p className="break-words text-2xl font-bold text-white sm:text-3xl">{formatCurrency(stats.pending_amount || 0)}</p>
                    <p className="text-sm text-silver-500">Wallet Balance</p>
                </div>

                <div className="min-w-0 rounded-2xl border border-dark-700 bg-dark-800 p-4 shadow-sm sm:p-6">
                    <div className="mb-4 flex items-center justify-between">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-purple-500/20 bg-purple-500/10 sm:h-12 sm:w-12">
                            <Package className="text-purple-400" size={22} />
                        </div>
                    </div>
                    <p className="break-words text-2xl font-bold text-white sm:text-3xl">{stats.total_products}</p>
                    <p className="text-sm text-silver-500">Active Products</p>
                </div>

                <div className="min-w-0 rounded-2xl border border-dark-700 bg-dark-800 p-4 shadow-sm sm:p-6">
                    <div className="mb-4 flex items-center justify-between">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-orange-500/20 bg-orange-500/10 sm:h-12 sm:w-12">
                            <ShoppingBag className="text-orange-400" size={22} />
                        </div>
                    </div>
                    <p className="break-words text-2xl font-bold text-white sm:text-3xl">{stats.total_orders}</p>
                    <p className="text-sm text-silver-500">Total Orders</p>
                </div>

                <div className="min-w-0 rounded-2xl border border-dark-700 bg-dark-800 p-4 shadow-sm sm:p-6">
                    <div className="mb-4 flex items-center justify-between">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-green-500/20 bg-green-500/10 sm:h-12 sm:w-12">
                            <Package className="text-green-400" size={22} />
                        </div>
                    </div>
                    <p className="break-words text-2xl font-bold text-white sm:text-3xl">{stats.delivered_orders}</p>
                    <p className="text-sm text-silver-500">Delivered Orders</p>
                </div>

                <div className="min-w-0 rounded-2xl border border-dark-700 bg-dark-800 p-4 shadow-sm sm:p-6">
                    <div className="mb-4 flex items-center justify-between">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10 sm:h-12 sm:w-12">
                            <Package className="text-red-400" size={22} />
                        </div>
                    </div>
                    <p className="break-words text-2xl font-bold text-white sm:text-3xl">{stats.returned_orders}</p>
                    <p className="text-sm text-silver-500">Returned Orders</p>
                </div>
            </div>

            <div className="overflow-hidden rounded-3xl border border-dark-700 bg-dark-800" data-aos="fade-up" data-aos-delay="100">
                <div className="flex flex-col gap-2 border-b border-dark-700 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                    <h2 className="font-display text-lg font-bold text-white sm:text-xl">Recent Sales</h2>
                    <span className="text-sm text-silver-500">Last 10 orders</span>
                </div>

                <div className="space-y-3 p-4 md:hidden">
                    {stats.recent_orders.length > 0 ? (
                        stats.recent_orders.map((order) => (
                            <div key={order.id} className="rounded-2xl border border-dark-700 bg-dark-700/40 p-4">
                                <div className="mb-3 flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-semibold text-white">{order.order_id}</p>
                                        <p className="truncate text-xs text-silver-400">{order.customer?.name || 'Guest'}</p>
                                    </div>
                                    <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium capitalize ${getStatusColor(order.status)}`}>
                                        {order.status}
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <p className="text-silver-500">Date</p>
                                        <p className="flex items-center gap-2 text-silver-300">
                                            <Clock size={14} />
                                            {formatDate(order.created_at)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-silver-500">Amount</p>
                                        <p className="font-medium text-white">{formatCurrency(order.total_amount)}</p>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="rounded-2xl border border-dark-700 bg-dark-700/30 p-4 text-sm text-silver-500">
                            No orders found yet. Add products and start selling.
                        </p>
                    )}
                </div>

                <div className="hidden overflow-x-auto md:block">
                    <table className="w-full min-w-[720px] border-collapse text-left">
                        <thead>
                            <tr className="border-b border-dark-700 text-sm text-silver-400">
                                <th className="p-4 font-medium">Order ID</th>
                                <th className="p-4 font-medium">Date</th>
                                <th className="p-4 font-medium">Customer</th>
                                <th className="p-4 font-medium">Amount</th>
                                <th className="p-4 font-medium">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-dark-700 text-silver-200">
                            {stats.recent_orders.length > 0 ? (
                                stats.recent_orders.map((order) => (
                                    <tr key={order.id} className="transition-colors hover:bg-dark-700/50">
                                        <td className="p-4 font-medium text-white">{order.order_id}</td>
                                        <td className="p-4 text-sm text-silver-400">
                                            <span className="flex items-center gap-2">
                                                <Clock size={14} />
                                                {formatDate(order.created_at)}
                                            </span>
                                        </td>
                                        <td className="p-4">{order.customer?.name || 'Guest'}</td>
                                        <td className="p-4 font-medium">{formatCurrency(order.total_amount)}</td>
                                        <td className="p-4">
                                            <span className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${getStatusColor(order.status)}`}>
                                                {order.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-silver-500">
                                        No orders found yet. Add products and start selling.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
