import { Share2, CheckCircle, XCircle, Search, Filter, RefreshCcw } from 'lucide-react';
import { Subscription } from '@/types/admin';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { API_BASE_URL } from '@/config/apiConfig';
import BillingDetail from './BillingDetail';

export default function SubscriptionsTab() {
    const { token } = useAuth();
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);

    useEffect(() => {
        fetchSubscriptions();
    }, [search, statusFilter]);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchSubscriptions();
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    const fetchSubscriptions = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.append('search', search);
            if (statusFilter) params.append('status', statusFilter);

            const res = await fetch(`${API_BASE_URL}/admin/subscriptions/?${params.toString()}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setSubscriptions(data.results || data);
            }
        } catch (error) {
            console.error('Error fetching subscriptions:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatNumber = (num: number) => {
        return new Intl.NumberFormat('en-IN').format(num);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-700';
            case 'expired': return 'bg-red-100 text-red-700';
            case 'pending': return 'bg-yellow-100 text-yellow-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    if (selectedSubscription) {
        return (
            <BillingDetail
                subscription={selectedSubscription}
                onBack={() => setSelectedSubscription(null)}
            />
        );
    }

    return (
        <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="font-display text-2xl font-bold text-gray-900">Commission Billing</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage weekly commission bills and shop payment status.</p>
                </div>

                <div className="flex gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by shop..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 w-64"
                        />
                    </div>
                    <div className="relative">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 ${statusFilter ? 'border-primary-500 text-primary-600 bg-primary-50' : 'border-gray-200'}`}
                        >
                            <Filter size={18} /> {statusFilter ? (statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)) : 'All Status'}
                        </button>

                        {showFilters && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-10">
                                <button
                                    onClick={() => { setStatusFilter(''); setShowFilters(false); }}
                                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                >
                                    All Bills
                                </button>
                                <button
                                    onClick={() => { setStatusFilter('pending'); setShowFilters(false); }}
                                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                >
                                    Pending
                                </button>
                                <button
                                    onClick={() => { setStatusFilter('active'); setShowFilters(false); }}
                                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                >
                                    Received (Active)
                                </button>
                                <button
                                    onClick={() => { setStatusFilter('expired'); setShowFilters(false); }}
                                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                >
                                    Expired (Unpaid)
                                </button>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={fetchSubscriptions}
                        className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600"
                        title="Refresh"
                    >
                        <RefreshCcw size={18} />
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm overflow-hidden min-h-[400px]">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Shop</th>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Billing Cycle</th>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Total Commission</th>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Start Date</th>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">End Date</th>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Payment</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {subscriptions.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                            No commission bills found matching your criteria.
                                        </td>
                                    </tr>
                                ) : (
                                    subscriptions.map((sub) => (
                                        <tr
                                            key={sub.id}
                                            className="hover:bg-gray-50 group cursor-pointer"
                                            onClick={() => setSelectedSubscription(sub)}
                                        >
                                            <td className="px-6 py-4 font-medium text-gray-900">
                                                <div className="flex flex-col">
                                                    <span>{sub.shop_name}</span>
                                                    <span className="text-[10px] text-gray-400 group-hover:text-primary-500 transition-colors">ID: {sub.shop}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-700">
                                                <div className="flex items-center gap-2">
                                                    <Share2 size={14} className="text-gray-400" />
                                                    {sub.plan_name}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-semibold text-gray-900">₹{formatNumber(sub.amount)}</td>
                                            <td className="px-6 py-4 text-gray-500">{new Date(sub.start_date).toLocaleDateString()}</td>
                                            <td className="px-6 py-4 text-gray-500">{new Date(sub.end_date).toLocaleDateString()}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(sub.status)}`}>
                                                    {sub.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {sub.is_paid ? (
                                                    <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
                                                        <CheckCircle size={16} /> Received
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1 text-red-600 text-sm font-medium">
                                                        <XCircle size={16} /> Pending
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
