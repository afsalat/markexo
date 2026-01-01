import {
    ShoppingCart, TrendingUp, DollarSign, AlertCircle, Eye
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
            case 'pending': return 'bg-yellow-100 text-yellow-700';
            case 'confirmed': return 'bg-blue-100 text-blue-700';
            case 'forwarded': return 'bg-purple-100 text-purple-700';
            case 'processing': return 'bg-indigo-100 text-indigo-700';
            case 'shipped': return 'bg-cyan-100 text-cyan-700';
            case 'delivered': return 'bg-green-100 text-green-700';
            case 'cancelled': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <div className="animate-fade-in">
            <h1 className="font-display text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                            <ShoppingCart className="text-blue-600" size={24} />
                        </div>
                        <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
                            <TrendingUp size={16} /> Live
                        </span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{stats.total_orders}</p>
                    <p className="text-sm text-gray-500">Total Orders</p>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                            <DollarSign className="text-green-600" size={24} />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">₹{formatNumber(stats.total_revenue)}</p>
                    <p className="text-sm text-gray-500">Total Revenue</p>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                            <TrendingUp className="text-purple-600" size={24} />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">₹{formatNumber(stats.total_commission)}</p>
                    <p className="text-sm text-gray-500">Your Commission</p>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                            <AlertCircle className="text-orange-600" size={24} />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{stats.pending_orders}</p>
                    <p className="text-sm text-gray-500">Pending Orders</p>
                </div>
            </div>

            {/* Dashboard Charts */}
            <DashboardCharts
                revenueHistory={stats.revenue_history}
                statusDistribution={stats.order_status_distribution}
            />

            {/* Recent Orders */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="font-display text-lg font-bold text-gray-900">Recent Orders</h2>
                    <button onClick={() => setActiveTab('orders')} className="text-primary-600 text-sm font-medium hover:underline">
                        View All
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Order ID</th>
                                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Customer</th>
                                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Amount</th>
                                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {stats.recent_orders.map((order) => (
                                <tr key={order.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-900">{order.order_id}</td>
                                    <td className="px-6 py-4 text-gray-700">{order.customer.name}</td>
                                    <td className="px-6 py-4 font-semibold text-gray-900">₹{formatNumber(order.total_amount)}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(order.status)}`}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500">{formatDate(order.created_at)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
