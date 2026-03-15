import {
    ShoppingCart, TrendingUp, DollarSign, AlertCircle, Wallet
} from 'lucide-react';
import { DashboardStats } from '@/types/admin';
import DashboardCharts from './DashboardCharts';

interface DashboardTabProps {
    stats: DashboardStats;
    setActiveTab: (tab: any) => void;
}

export default function DashboardTab({ stats, setActiveTab }: DashboardTabProps) {
    const formatNumber = (num: number) => {
        return new Intl.NumberFormat('en-IN').format(num);
    };

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
        switch (status) {
            case 'pending': return 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20';
            case 'confirmed': return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
            case 'forwarded': return 'bg-purple-500/10 text-purple-400 border border-purple-500/20';
            case 'processing': return 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20';
            case 'shipped': return 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20';
            case 'delivered': return 'bg-green-500/10 text-green-400 border border-green-500/20';
            case 'cancelled': return 'bg-red-500/10 text-red-400 border border-red-500/20';
            default: return 'bg-dark-700 text-silver-400 border border-dark-600';
        }
    };

    return (
        <div className="animate-fade-in min-w-0 space-y-6">
            <h1 className="mb-5 font-display text-2xl font-bold text-white sm:mb-6 sm:text-3xl" data-aos="fade-right">
                Dashboard
            </h1>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5" data-aos="fade-up">
                <div className="min-w-0 rounded-2xl border border-dark-700 bg-dark-800 p-4 shadow-sm sm:p-6">
                    <div className="mb-4 flex items-center justify-between gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10 sm:h-12 sm:w-12">
                            <ShoppingCart className="text-blue-400" size={22} />
                        </div>
                        <span className="flex items-center gap-1 text-xs font-medium text-green-400 sm:text-sm">
                            <TrendingUp size={16} /> Live
                        </span>
                    </div>
                    <p className="break-words text-2xl font-bold text-white sm:text-3xl">{stats.total_orders}</p>
                    <p className="text-sm text-silver-500">Total Orders</p>
                </div>

                <div className="min-w-0 rounded-2xl border border-dark-700 bg-dark-800 p-4 shadow-sm sm:p-6">
                    <div className="mb-4 flex items-center justify-between">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-green-500/20 bg-green-500/10 sm:h-12 sm:w-12">
                            <DollarSign className="text-green-400" size={22} />
                        </div>
                    </div>
                    <p className="break-words text-2xl font-bold text-white sm:text-3xl">{formatCurrency(stats.total_revenue)}</p>
                    <p className="text-sm text-silver-500">Total Revenue</p>
                </div>

                <div className="min-w-0 rounded-2xl border border-dark-700 bg-dark-800 p-4 shadow-sm sm:p-6">
                    <div className="mb-4 flex items-center justify-between">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 sm:h-12 sm:w-12">
                            <Wallet className="text-emerald-400" size={22} />
                        </div>
                    </div>
                    <p className="break-words text-2xl font-bold text-white sm:text-3xl">{formatCurrency(stats.total_profit)}</p>
                    <p className="text-sm text-silver-500">Total Profit</p>
                </div>

                <div className="min-w-0 rounded-2xl border border-dark-700 bg-dark-800 p-4 shadow-sm sm:p-6">
                    <div className="mb-4 flex items-center justify-between">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-purple-500/20 bg-purple-500/10 sm:h-12 sm:w-12">
                            <TrendingUp className="text-purple-400" size={22} />
                        </div>
                    </div>
                    <p className="break-words text-2xl font-bold text-white sm:text-3xl">{stats.total_products}</p>
                    <p className="text-sm text-silver-500">Total Products</p>
                </div>

                <div className="min-w-0 rounded-2xl border border-dark-700 bg-dark-800 p-4 shadow-sm sm:p-6">
                    <div className="mb-4 flex items-center justify-between">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-orange-500/20 bg-orange-500/10 sm:h-12 sm:w-12">
                            <AlertCircle className="text-orange-400" size={22} />
                        </div>
                    </div>
                    <p className="break-words text-2xl font-bold text-white sm:text-3xl">{stats.pending_orders}</p>
                    <p className="text-sm text-silver-500">Pending Orders</p>
                </div>
            </div>

            <div data-aos="fade-up" data-aos-delay="100">
                <DashboardCharts
                    revenueHistory={stats.revenue_history}
                    statusDistribution={stats.order_status_distribution}
                />
            </div>

            <div
                className="overflow-hidden rounded-2xl border border-dark-700 bg-dark-800 shadow-sm"
                data-aos="fade-up"
                data-aos-delay="200"
            >
                <div className="flex flex-col gap-3 border-b border-dark-700 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                    <h2 className="font-display text-lg font-bold text-white">Recent Orders</h2>
                    <button
                        onClick={() => setActiveTab('orders')}
                        className="w-full text-left text-sm font-medium text-accent-500 hover:text-accent-400 hover:underline sm:w-auto"
                    >
                        View All
                    </button>
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
                                        <p className="text-silver-500">Amount</p>
                                        <p className="font-semibold text-white">{formatCurrency(order.total_amount)}</p>
                                    </div>
                                    <div>
                                        <p className="text-silver-500">Date</p>
                                        <p className="text-silver-300">{formatDate(order.created_at)}</p>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="rounded-2xl border border-dark-700 bg-dark-700/30 p-4 text-sm text-silver-500">
                            No recent orders yet.
                        </p>
                    )}
                </div>

                <div className="hidden overflow-x-auto md:block">
                    <table className="w-full min-w-[720px]">
                        <thead className="bg-dark-700/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-silver-500">Order ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-silver-500">Customer</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-silver-500">Amount</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-silver-500">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-silver-500">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-dark-700">
                            {stats.recent_orders.length > 0 ? (
                                stats.recent_orders.map((order) => (
                                    <tr key={order.id} className="highlight-transition hover:bg-dark-700">
                                        <td className="px-6 py-4 font-medium text-white">{order.order_id}</td>
                                        <td className="px-6 py-4 text-silver-400">{order.customer?.name || 'Guest'}</td>
                                        <td className="px-6 py-4 font-semibold text-white">{formatCurrency(order.total_amount)}</td>
                                        <td className="px-6 py-4">
                                            <span className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${getStatusColor(order.status)}`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-silver-500">{formatDate(order.created_at)}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-10 text-center text-silver-500">
                                        No recent orders yet.
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
