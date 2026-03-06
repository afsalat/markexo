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

    return (
        <div className="animate-fade-in space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="font-display text-2xl font-bold text-white">Partner Dashboard</h1>
                <span className="px-4 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-sm font-medium">
                    You earn 30% of profit per sale
                </span>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* My Earnings - Hero Card */}
                <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-900/20 rounded-2xl p-6 shadow-lg border border-emerald-500/30 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <DollarSign size={80} />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="bg-emerald-500 rounded-lg p-2 text-white">
                                <DollarSign size={20} />
                            </div>
                            <span className="text-emerald-300 font-medium">My Earnings</span>
                        </div>
                        <p className="text-3xl font-bold text-white">{formatCurrency(stats.my_earnings)}</p>
                        <p className="text-emerald-400 text-sm mt-1">Total Commission</p>
                    </div>
                </div>

                {/* Total Sales */}
                <div className="bg-dark-800 rounded-2xl p-6 shadow-sm border border-dark-700">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20">
                            <TrendingUp className="text-blue-400" size={24} />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-white">{formatCurrency(stats.total_sales)}</p>
                    <p className="text-sm text-silver-500">Shop Sales</p>
                </div>

                {/* Total Withdrawn */}
                <div className="bg-dark-800 rounded-2xl p-6 shadow-sm border border-dark-700">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20">
                            <DollarSign className="text-blue-400" size={24} />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-white">{formatCurrency(stats.total_withdrawn || 0)}</p>
                    <p className="text-sm text-silver-500">Total Withdrawn</p>
                </div>

                {/* Wallet (Available) */}
                <div className="bg-dark-800 rounded-2xl p-6 shadow-sm border border-dark-700">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20">
                            <TrendingUp className="text-emerald-400" size={24} />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-white">{formatCurrency(stats.pending_amount || 0)}</p>
                    <p className="text-sm text-silver-500">Wallet Balance</p>
                </div>

                {/* Total Products */}
                <div className="bg-dark-800 rounded-2xl p-6 shadow-sm border border-dark-700">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center border border-purple-500/20">
                            <Package className="text-purple-400" size={24} />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-white">{stats.total_products}</p>
                    <p className="text-sm text-silver-500">Active Products</p>
                </div>

                {/* Total Orders */}
                <div className="bg-dark-800 rounded-2xl p-6 shadow-sm border border-dark-700">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center border border-orange-500/20">
                            <ShoppingBag className="text-orange-400" size={24} />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-white">{stats.total_orders}</p>
                    <p className="text-sm text-silver-500">Total Orders</p>
                </div>

                {/* Delivered Orders */}
                <div className="bg-dark-800 rounded-2xl p-6 shadow-sm border border-dark-700">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center border border-green-500/20">
                            <Package className="text-green-400" size={24} />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-white">{stats.delivered_orders}</p>
                    <p className="text-sm text-silver-500">Delivered Orders</p>
                </div>

                {/* Returned Orders */}
                <div className="bg-dark-800 rounded-2xl p-6 shadow-sm border border-dark-700">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center border border-red-500/20">
                            <Package className="text-red-400" size={24} />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-white">{stats.returned_orders}</p>
                    <p className="text-sm text-silver-500">Returned Orders</p>
                </div>
            </div>

            {/* Recent Orders Section */}
            <div className="bg-dark-800 rounded-3xl border border-dark-700 overflow-hidden">
                <div className="p-6 border-b border-dark-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white font-display">Recent Sales</h2>
                    <span className="text-sm text-silver-500">Last 10 orders</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-dark-700 text-silver-400 text-sm">
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
                                    <tr key={order.id} className="hover:bg-dark-700/50 transition-colors">
                                        <td className="p-4 font-medium text-white">{order.order_id}</td>
                                        <td className="p-4 text-sm text-silver-400 flex items-center gap-2">
                                            <Clock size={14} />
                                            {formatDate(order.created_at)}
                                        </td>
                                        <td className="p-4">{order.customer?.name || 'Guest'}</td>
                                        <td className="p-4 font-medium">{formatCurrency(order.total_amount)}</td>
                                        <td className="p-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${order.status === 'delivered' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                                order.status === 'cancelled' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                                    'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                                                }`}>
                                                {order.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-silver-500">
                                        No orders found yet. Share your shop link to start selling!
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
