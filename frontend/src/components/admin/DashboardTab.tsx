import {
    ShoppingCart, TrendingUp, DollarSign, AlertCircle, Eye, Wallet
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
        <div className="animate-fade-in">
            <h1 className="font-display text-2xl font-bold text-white mb-6" data-aos="fade-right">Dashboard</h1>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8" data-aos="fade-up">
                <div className="bg-dark-800 rounded-2xl p-6 shadow-sm border border-dark-700">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20">
                            <ShoppingCart className="text-blue-400" size={24} />
                        </div>
                        <span className="flex items-center gap-1 text-green-400 text-sm font-medium">
                            <TrendingUp size={16} /> Live
                        </span>
                    </div>
                    <p className="text-2xl font-bold text-white">{stats.total_orders}</p>
                    <p className="text-sm text-silver-500">Total Orders</p>
                </div>

                <div className="bg-dark-800 rounded-2xl p-6 shadow-sm border border-dark-700">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center border border-green-500/20">
                            <DollarSign className="text-green-400" size={24} />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-white">₹{formatNumber(stats.total_revenue)}</p>
                    <p className="text-sm text-silver-500">Total Revenue</p>
                </div>

                <div className="bg-dark-800 rounded-2xl p-6 shadow-sm border border-dark-700">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20">
                            <Wallet className="text-emerald-400" size={24} />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-white">₹{formatNumber(stats.total_profit)}</p>
                    <p className="text-sm text-silver-500">Total Profit</p>
                </div>

                <div className="bg-dark-800 rounded-2xl p-6 shadow-sm border border-dark-700">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center border border-purple-500/20">
                            <TrendingUp className="text-purple-400" size={24} />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-white">{stats.total_products}</p>
                    <p className="text-sm text-silver-500">Total Products</p>
                </div>

                <div className="bg-dark-800 rounded-2xl p-6 shadow-sm border border-dark-700">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center border border-orange-500/20">
                            <AlertCircle className="text-orange-400" size={24} />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-white">{stats.pending_orders}</p>
                    <p className="text-sm text-silver-500">Pending Orders</p>
                </div>
            </div>

            {/* Dashboard Charts */}
            <div data-aos="fade-up" data-aos-delay="100">
                <DashboardCharts
                    revenueHistory={stats.revenue_history}
                    statusDistribution={stats.order_status_distribution}
                />
            </div>

            {/* Recent Orders */}
            <div className="bg-dark-800 rounded-2xl shadow-sm overflow-hidden border border-dark-700" data-aos="fade-up" data-aos-delay="200">
                <div className="p-6 border-b border-dark-700 flex justify-between items-center">
                    <h2 className="font-display text-lg font-bold text-white">Recent Orders</h2>
                    <button onClick={() => setActiveTab('orders')} className="text-accent-500 text-sm font-medium hover:text-accent-400 hover:underline">
                        View All
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-dark-700/50">
                            <tr>
                                <th className="text-left px-6 py-3 text-xs font-medium text-silver-500 uppercase">Order ID</th>
                                <th className="text-left px-6 py-3 text-xs font-medium text-silver-500 uppercase">Customer</th>
                                <th className="text-left px-6 py-3 text-xs font-medium text-silver-500 uppercase">Amount</th>
                                <th className="text-left px-6 py-3 text-xs font-medium text-silver-500 uppercase">Status</th>
                                <th className="text-left px-6 py-3 text-xs font-medium text-silver-500 uppercase">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-dark-700">
                            {stats.recent_orders.map((order) => (
                                <tr key={order.id} className="hover:bg-dark-700 highlight-transition">
                                    <td className="px-6 py-4 font-medium text-white">{order.order_id}</td>
                                    <td className="px-6 py-4 text-silver-400">{order.customer.name}</td>
                                    <td className="px-6 py-4 font-semibold text-white">₹{formatNumber(order.total_amount)}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize border ${getStatusColor(order.status)}`}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-silver-500">{formatDate(order.created_at)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
