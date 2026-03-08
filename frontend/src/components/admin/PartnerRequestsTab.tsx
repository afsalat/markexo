import { useState, useEffect } from 'react';
import { Shop } from '@/types/admin';
import { Check, X, Store, Loader, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { API_BASE_URL as API_URL } from '@/config/apiConfig';

const API_BASE_URL = API_URL;

export default function PartnerRequestsTab() {
    const { token } = useAuth();
    const [requests, setRequests] = useState<Shop[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<number | null>(null);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/admin/shops/?approval_status=pending`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setRequests(data.results || data);
            }
        } catch (error) {
            console.error("Failed to fetch partner requests:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, [token]);

    const handleAction = async (shopId: number, action: 'approve' | 'reject') => {
        setActionLoading(shopId);
        try {
            const res = await fetch(`${API_BASE_URL}/admin/shops/${shopId}/${action}/`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                // Remove from list
                setRequests(prev => prev.filter(r => r.id !== shopId));
            } else {
                alert(`Failed to ${action} shop`);
            }
        } catch (error) {
            console.error(`Error ${action}ing shop:`, error);
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-500"></div>
            </div>
        );
    }

    if (requests.length === 0) {
        return (
            <div className="bg-dark-800 rounded-3xl p-12 text-center border border-dark-700">
                <div className="w-20 h-20 bg-dark-700/50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Store className="w-10 h-10 text-silver-600" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">No Pending Requests</h3>
                <p className="text-silver-500">There are no new partner registration requests to review.</p>
                <button
                    onClick={fetchRequests}
                    className="mt-6 px-6 py-2 bg-dark-700 text-silver-300 rounded-xl hover:bg-dark-600 transition-colors"
                >
                    Refresh
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-2xl font-bold text-white flex flex-wrap items-center gap-3">
                    <Store className="text-accent-500" />
                    Partner Requests
                    <span className="bg-accent-500/10 text-accent-500 text-sm px-3 py-1 rounded-full border border-accent-500/20">
                        {requests.length} Pending
                    </span>
                </h2>
                <button
                    onClick={fetchRequests}
                    className="p-2 bg-dark-800 rounded-lg w-full sm:w-auto hover:bg-dark-700 text-silver-400 hover:text-white transition-colors flex justify-center items-center"
                >
                    <Loader size={20} className={loading ? 'animate-spin' : ''} />
                    <span className="ml-2 sm:hidden text-sm font-medium">Refresh</span>
                </button>
            </div>

            <div className="grid gap-4">
                {requests.map((shop) => (
                    <div
                        key={shop.id}
                        className="bg-dark-800 p-6 rounded-2xl border border-dark-700 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-dark-600 transition-colors"
                    >
                        <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                                <h3 className="text-xl font-bold text-white">{shop.email}</h3>
                                <span className="md:hidden text-xs bg-yellow-500/10 text-yellow-500 px-2 py-1 rounded-full">Pending</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm text-silver-400 mt-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-silver-600">Email:</span>
                                    <span className="text-silver-200">{shop.email}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-silver-600">Phone:</span>
                                    <span className="text-silver-200">{shop.phone}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-silver-600">City:</span>
                                    <span className="text-silver-200">{shop.city}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-silver-600">Date:</span>
                                    <span className="text-silver-200">{new Date(shop.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 pt-4 md:pt-0 border-t md:border-t-0 border-dark-700">
                            <button
                                onClick={() => handleAction(shop.id, 'reject')}
                                disabled={actionLoading === shop.id}
                                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                            >
                                <X size={18} />
                                Reject
                            </button>
                            <button
                                onClick={() => handleAction(shop.id, 'approve')}
                                disabled={actionLoading === shop.id}
                                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-500 hover:shadow-lg hover:shadow-emerald-500/20 transition-all disabled:opacity-50"
                            >
                                {actionLoading === shop.id ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
                                ) : (
                                    <Check size={18} />
                                )}
                                Approve
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
