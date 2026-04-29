'use client';

import { useState, useEffect } from 'react';
import { 
    Globe, RefreshCw, CheckCircle, XCircle, AlertTriangle, 
    ArrowRight, Settings, Info, Search, Filter, ExternalLink,
    TrendingUp, Package, Activity, Clock
} from 'lucide-react';
import { API_BASE_URL } from '@/config/apiConfig';
import { useAuth } from '@/context/AuthContext';
import { Product } from '@/types/admin';

interface MerchantStats {
    total: number;
    synced: number;
    failed: number;
    pending: number;
    is_configured: boolean;
}

export default function GoogleMerchantTab() {
    const { token } = useAuth();
    const [stats, setStats] = useState<MerchantStats | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const [statsRes, productsRes] = await Promise.all([
                fetch(`${API_BASE_URL}/admin/google-merchant/`, { headers }),
                fetch(`${API_BASE_URL}/admin/products/`, { headers })
            ]);

            if (statsRes.ok) {
                const statsData = await statsRes.json();
                setStats(statsData);
            }

            if (productsRes.ok) {
                const productsData = await productsRes.json();
                // If it's paginated, extract results
                const results = productsData.results || productsData;
                setProducts(results);
            }
        } catch (error) {
            console.error('Error fetching Google Merchant data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) fetchData();
    }, [token]);

    const handleBulkSync = async () => {
        if (!confirm('Are you sure you want to trigger a bulk sync? This will process all approved products.')) return;
        
        setSyncing(true);
        try {
            const res = await fetch(`${API_BASE_URL}/admin/google-merchant/`, {
                method: 'POST',
                headers
            });
            if (res.ok) {
                alert('Bulk sync triggered successfully in the background.');
                fetchData();
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to trigger bulk sync.');
            }
        } catch (error) {
            alert('Error triggering bulk sync.');
        } finally {
            setSyncing(false);
        }
    };

    const filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             product.sku?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || product.google_merchant_status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getStatusIcon = (status?: string) => {
        switch (status) {
            case 'synced': return <CheckCircle size={16} className="text-green-500" />;
            case 'failed': return <XCircle size={16} className="text-red-500" />;
            case 'pending': return <Clock size={16} className="text-yellow-500" />;
            default: return <AlertTriangle size={16} className="text-silver-600" />;
        }
    };

    const getStatusBadge = (status?: string) => {
        switch (status) {
            case 'synced': 
                return <span className="px-2 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded-full text-[10px] font-bold uppercase tracking-wider">Synced</span>;
            case 'failed': 
                return <span className="px-2 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full text-[10px] font-bold uppercase tracking-wider">Failed</span>;
            case 'pending': 
                return <span className="px-2 py-1 bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 rounded-full text-[10px] font-bold uppercase tracking-wider">Pending</span>;
            default: 
                return <span className="px-2 py-1 bg-dark-700 text-silver-400 border border-dark-600 rounded-full text-[10px] font-bold uppercase tracking-wider">Not Synced</span>;
        }
    };

    if (loading && !stats) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <RefreshCw size={40} className="animate-spin text-accent-500" />
                <p className="text-silver-500 animate-pulse">Loading Google Merchant data...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="font-display text-2xl font-bold text-white flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <Globe size={20} className="text-white" />
                        </div>
                        Google Merchant Center
                    </h1>
                    <p className="text-silver-500 text-sm mt-1 ml-[52px]">
                        Sync your product catalog with Google Shopping for global visibility
                    </p>
                </div>
                
                <div className="flex items-center gap-2">
                    <button 
                        onClick={fetchData}
                        className="p-2.5 bg-dark-800 hover:bg-dark-700 text-white rounded-xl border border-dark-700 transition-all"
                        title="Refresh Data"
                    >
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button 
                        onClick={handleBulkSync}
                        disabled={syncing || !stats?.is_configured}
                        className="btn-primary flex items-center gap-2 px-6 py-2.5 shadow-lg shadow-accent-500/20 disabled:opacity-50 disabled:grayscale"
                    >
                        {syncing ? <RefreshCw size={18} className="animate-spin" /> : <TrendingUp size={18} />}
                        Sync All Products
                    </button>
                </div>
            </div>

            {/* Config Warning */}
            {!stats?.is_configured && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                        <AlertTriangle size={20} className="text-amber-500" />
                    </div>
                    <div>
                        <h4 className="text-amber-500 font-bold">API Not Configured</h4>
                        <p className="text-silver-400 text-sm mt-1">
                            Google Merchant ID or Service Account file is missing in the backend settings. 
                            Please configure <code className="bg-dark-900 px-1.5 py-0.5 rounded text-amber-300">GOOGLE_MERCHANT_ID</code> in <code className="bg-dark-900 px-1.5 py-0.5 rounded text-amber-300">settings.py</code> to enable synchronization.
                        </p>
                    </div>
                </div>
            )}

            {/* Stats Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-dark-800 to-dark-800/50 border border-dark-700 rounded-2xl p-5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-accent-500/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-125 transition-transform"></div>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-accent-500/10 flex items-center justify-center">
                            <Package size={24} className="text-accent-500" />
                        </div>
                        <div>
                            <p className="text-silver-500 text-xs font-medium uppercase tracking-wider">Total Products</p>
                            <p className="text-2xl font-bold text-white">{stats?.total || 0}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-dark-800 to-dark-800/50 border border-dark-700 rounded-2xl p-5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-125 transition-transform"></div>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                            <CheckCircle size={24} className="text-green-500" />
                        </div>
                        <div>
                            <p className="text-silver-500 text-xs font-medium uppercase tracking-wider">Synced Successfully</p>
                            <div className="flex items-end gap-2">
                                <p className="text-2xl font-bold text-white">{stats?.synced || 0}</p>
                                <p className="text-xs text-green-500 mb-1 font-medium">
                                    {stats?.total ? Math.round((stats.synced / stats.total) * 100) : 0}%
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-dark-800 to-dark-800/50 border border-dark-700 rounded-2xl p-5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-125 transition-transform"></div>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center">
                            <XCircle size={24} className="text-red-500" />
                        </div>
                        <div>
                            <p className="text-silver-500 text-xs font-medium uppercase tracking-wider">Failed Sync</p>
                            <p className="text-2xl font-bold text-white">{stats?.failed || 0}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-dark-800 to-dark-800/50 border border-dark-700 rounded-2xl p-5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-500/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-125 transition-transform"></div>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                            <Clock size={24} className="text-yellow-500" />
                        </div>
                        <div>
                            <p className="text-silver-500 text-xs font-medium uppercase tracking-wider">Pending Approval</p>
                            <p className="text-2xl font-bold text-white">{stats?.pending || 0}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Public Feed Section */}
            <div className="bg-dark-800 border border-dark-700 rounded-2xl p-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2"></div>
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0">
                            <Activity size={24} className="text-orange-500" />
                        </div>
                        <div>
                            <h3 className="text-white font-bold">Public Product Feed (RSS)</h3>
                            <p className="text-silver-500 text-sm mt-1">
                                Use this URL in Google Merchant Center for manual fetching or supplemental feeds.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <code className="flex-1 md:flex-none bg-dark-900 px-4 py-2 rounded-xl text-orange-400 text-xs border border-dark-700 font-mono">
                            {window.location.origin}/google-feed.xml
                        </code>
                        <button 
                            onClick={() => {
                                navigator.clipboard.writeText(`${window.location.origin}/google-feed.xml`);
                                alert('Feed URL copied to clipboard!');
                            }}
                            className="p-2.5 bg-dark-700 hover:bg-dark-600 text-white rounded-xl transition-all border border-dark-600"
                            title="Copy URL"
                        >
                            <ExternalLink size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Product List Section */}
            <div className="bg-dark-800 border border-dark-700 rounded-2xl overflow-hidden shadow-xl">
                {/* Filters Bar */}
                <div className="p-4 border-b border-dark-700 bg-dark-900/50 flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full sm:max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-silver-600" size={16} />
                        <input 
                            type="text"
                            placeholder="Search by name or SKU..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-dark-800 border border-dark-700 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:border-accent-500 transition-all outline-none"
                        />
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Filter size={16} className="text-silver-600" />
                        <select 
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-dark-800 border border-dark-700 rounded-xl px-4 py-2 text-sm text-white focus:border-accent-500 outline-none transition-all cursor-pointer min-w-[140px]"
                        >
                            <option value="all">All Status</option>
                            <option value="synced">Synced</option>
                            <option value="failed">Failed</option>
                            <option value="pending">Pending</option>
                            <option value="not_applicable">Not Applicable</option>
                        </select>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-dark-900/30">
                                <th className="px-6 py-4 text-xs font-bold text-silver-500 uppercase tracking-widest border-b border-dark-700/50">Product</th>
                                <th className="px-6 py-4 text-xs font-bold text-silver-500 uppercase tracking-widest border-b border-dark-700/50">SKU</th>
                                <th className="px-6 py-4 text-xs font-bold text-silver-500 uppercase tracking-widest border-b border-dark-700/50">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-silver-500 uppercase tracking-widest border-b border-dark-700/50">Last Sync</th>
                                <th className="px-6 py-4 text-xs font-bold text-silver-500 uppercase tracking-widest border-b border-dark-700/50">Errors / Logs</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-dark-700/50">
                            {filteredProducts.length > 0 ? (
                                filteredProducts.map(product => (
                                    <tr key={product.id} className="hover:bg-dark-700/30 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-dark-700 overflow-hidden shrink-0">
                                                    {product.image ? (
                                                        <img src={product.image} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-silver-700">
                                                            <Package size={20} />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-white font-medium text-sm truncate max-w-[200px]">{product.name}</p>
                                                    <p className="text-silver-600 text-xs mt-0.5">ID: {product.id}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-silver-400 font-mono text-xs uppercase tracking-wider">
                                            {product.sku || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                {getStatusIcon(product.google_merchant_status)}
                                                {getStatusBadge(product.google_merchant_status)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-silver-500 text-xs">
                                            {product.last_google_sync ? new Date(product.last_google_sync).toLocaleString('en-IN', {
                                                day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                                            }) : 'Never'}
                                        </td>
                                        <td className="px-6 py-4 max-w-xs">
                                            {product.google_merchant_errors ? (
                                                <div className="flex items-start gap-2 group/error">
                                                    <AlertTriangle size={14} className="text-red-500 shrink-0 mt-0.5" />
                                                    <p className="text-red-400/80 text-[11px] leading-tight line-clamp-2 italic">
                                                        {product.google_merchant_errors}
                                                    </p>
                                                    <div className="hidden group-hover/error:block absolute bg-dark-900 border border-red-500/20 p-2 rounded-lg text-[10px] text-red-400 z-10 max-w-[250px] shadow-2xl">
                                                        {product.google_merchant_errors}
                                                    </div>
                                                </div>
                                            ) : product.google_merchant_status === 'synced' ? (
                                                <span className="text-green-500/60 text-[11px]">Ready on Google Shopping</span>
                                            ) : (
                                                <span className="text-silver-700 text-[11px]">No logs available</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center gap-2 opacity-50">
                                            <Search size={40} className="text-dark-600 mb-2" />
                                            <p className="text-white font-medium">No products found</p>
                                            <p className="text-silver-600 text-sm">Try adjusting your filters or search query</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer Info */}
                <div className="p-4 bg-dark-900/50 border-t border-dark-700 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                        <Info size={16} className="text-blue-500" />
                    </div>
                    <p className="text-silver-500 text-xs">
                        Products are automatically synced when updated if they are <span className="text-white font-medium">Approved</span> and <span className="text-white font-medium">Active</span>. 
                        Syncing might take up to 24 hours to reflect in Google Merchant Center search results.
                    </p>
                </div>
            </div>

            {/* Merchant Center Direct Link */}
            <div className="bg-gradient-to-r from-blue-600/20 to-indigo-600/20 border border-blue-500/20 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2"></div>
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center shrink-0 shadow-xl shadow-blue-500/10">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_Merchant_Center_logo.svg" alt="GMC" className="w-10 h-10" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white">Merchant Center Dashboard</h3>
                        <p className="text-silver-400 text-sm mt-1">Review detailed policy violations, tax settings, and shipping configurations directly on Google.</p>
                    </div>
                </div>
                <a 
                    href="https://merchants.google.com/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-6 py-3 bg-white text-dark-900 rounded-xl font-bold hover:bg-silver-100 transition-all shrink-0 shadow-lg"
                >
                    Open Merchant Center
                    <ExternalLink size={18} />
                </a>
            </div>
        </div>
    );
}
