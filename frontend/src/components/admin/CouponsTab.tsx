import React, { useState, useEffect, useMemo } from 'react';
import {
    Ticket, Plus, Search, Filter, RefreshCcw, Copy, Check, Edit2, Trash2,
    Calendar, Users, DollarSign, Tag, AlertCircle, X, Sparkles, Clock, CheckCircle2,
    ChevronRight, ArrowUpDown, TrendingUp, Percent, ShieldCheck, Eye
} from 'lucide-react';
import { Coupon, CouponStats, CouponUsage } from '@/types/admin';
import { useAuth } from '@/context/AuthContext';
import { API_BASE_URL } from '@/config/apiConfig';

interface FormState {
    code: string;
    title: string;
    description: string;
    discount_type: 'percentage' | 'fixed' | 'free_shipping';
    discount_value: string;
    min_order_value: string;
    max_discount_amount: string;
    usage_limit: string;
    usage_limit_per_user: string;
    valid_from: string;
    valid_until: string;
    is_active: boolean;
    is_featured: boolean;
}

const defaultForm: FormState = {
    code: '',
    title: '',
    description: '',
    discount_type: 'percentage',
    discount_value: '10',
    min_order_value: '0',
    max_discount_amount: '',
    usage_limit: '',
    usage_limit_per_user: '1',
    valid_from: new Date().toISOString().slice(0, 16),
    valid_until: '',
    is_active: true,
    is_featured: true,
};

export default function CouponsTab() {
    const { token } = useAuth();
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [stats, setStats] = useState<CouponStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [statsLoading, setStatsLoading] = useState(true);
    const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

    // Filters & Search
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'expired'>('all');
    const [typeFilter, setTypeFilter] = useState<'all' | 'percentage' | 'fixed' | 'free_shipping'>('all');

    // Modals
    const [showModal, setShowModal] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
    const [formData, setFormData] = useState<FormState>(defaultForm);
    const [formError, setFormError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Copy Feedback
    const [copiedCode, setCopiedCode] = useState<string | null>(null);

    // Usage Log Modal
    const [showUsageModal, setShowUsageModal] = useState(false);
    const [selectedCouponForUsage, setSelectedCouponForUsage] = useState<Coupon | null>(null);
    const [usages, setUsages] = useState<CouponUsage[]>([]);
    const [usageLoading, setUsageLoading] = useState(false);

    // Fetch Coupons
    const fetchCoupons = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (searchQuery.trim()) params.append('search', searchQuery.trim());
            if (statusFilter !== 'all') params.append('status', statusFilter);
            if (typeFilter !== 'all') params.append('discount_type', typeFilter);

            const res = await fetch(`${API_BASE_URL}/admin/coupons/?${params.toString()}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setCoupons(data.results || data);
            }
        } catch (err) {
            console.error('Failed to load coupons:', err);
        } finally {
            setLoading(false);
        }
    };

    // Fetch Stats
    const fetchStats = async () => {
        if (!token) return;
        setStatsLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/admin/coupons/stats/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setStats(data);
            }
        } catch (err) {
            console.error('Failed to load coupon stats:', err);
        } finally {
            setStatsLoading(false);
        }
    };

    useEffect(() => {
        fetchCoupons();
    }, [token, statusFilter, typeFilter]);

    useEffect(() => {
        fetchStats();
    }, [token]);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        fetchCoupons();
    };

    // Copy coupon code
    const handleCopy = (code: string) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    // Toggle active status
    const handleToggleStatus = async (coupon: Coupon) => {
        if (!token) return;
        setActionLoadingId(coupon.id);
        try {
            const res = await fetch(`${API_BASE_URL}/admin/coupons/${coupon.id}/toggle_status/`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const updated = await res.json();
                setCoupons(prev => prev.map(c => c.id === updated.id ? updated : c));
                fetchStats();
            }
        } catch (err) {
            console.error('Failed to toggle status:', err);
        } finally {
            setActionLoadingId(null);
        }
    };

    // Delete coupon
    const handleDelete = async (id: number, code: string) => {
        if (!token) return;
        if (!window.confirm(`Are you sure you want to delete coupon code '${code}'?`)) return;

        setActionLoadingId(id);
        try {
            const res = await fetch(`${API_BASE_URL}/admin/coupons/${id}/`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok || res.status === 204) {
                setCoupons(prev => prev.filter(c => c.id !== id));
                fetchStats();
            }
        } catch (err) {
            console.error('Failed to delete coupon:', err);
        } finally {
            setActionLoadingId(null);
        }
    };

    // Open Create Modal
    const handleOpenCreate = () => {
        setEditingCoupon(null);
        setFormData(defaultForm);
        setFormError(null);
        setShowModal(true);
    };

    // Open Edit Modal
    const handleOpenEdit = (coupon: Coupon) => {
        setEditingCoupon(coupon);
        setFormData({
            code: coupon.code,
            title: coupon.title,
            description: coupon.description || '',
            discount_type: coupon.discount_type,
            discount_value: String(coupon.discount_value),
            min_order_value: String(coupon.min_order_value || '0'),
            max_discount_amount: coupon.max_discount_amount ? String(coupon.max_discount_amount) : '',
            usage_limit: coupon.usage_limit ? String(coupon.usage_limit) : '',
            usage_limit_per_user: String(coupon.usage_limit_per_user || '1'),
            valid_from: coupon.valid_from ? coupon.valid_from.slice(0, 16) : new Date().toISOString().slice(0, 16),
            valid_until: coupon.valid_until ? coupon.valid_until.slice(0, 16) : '',
            is_active: coupon.is_active,
            is_featured: coupon.is_featured,
        });
        setFormError(null);
        setShowModal(true);
    };

    // Random Code Generator
    const generateRandomCode = () => {
        const prefixes = ['VORION', 'SAVE', 'DEAL', 'SUPER', 'FESTIVE', 'SPECIAL', 'FLASH'];
        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        const nums = Math.floor(10 + Math.random() * 90);
        setFormData(prev => ({ ...prev, code: `${prefix}${nums}` }));
    };

    // Save Form
    const handleSaveCoupon = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) return;
        setIsSaving(true);
        setFormError(null);

        const payload: Record<string, any> = {
            code: formData.code.trim().toUpperCase(),
            title: formData.title.trim(),
            description: formData.description.trim(),
            discount_type: formData.discount_type,
            discount_value: parseFloat(formData.discount_value) || 0,
            min_order_value: parseFloat(formData.min_order_value) || 0,
            max_discount_amount: formData.max_discount_amount ? parseFloat(formData.max_discount_amount) : null,
            usage_limit: formData.usage_limit ? parseInt(formData.usage_limit, 10) : null,
            usage_limit_per_user: parseInt(formData.usage_limit_per_user, 10) || 1,
            valid_from: formData.valid_from ? new Date(formData.valid_from).toISOString() : new Date().toISOString(),
            valid_until: formData.valid_until ? new Date(formData.valid_until).toISOString() : null,
            is_active: formData.is_active,
            is_featured: formData.is_featured,
        };

        try {
            const url = editingCoupon
                ? `${API_BASE_URL}/admin/coupons/${editingCoupon.id}/`
                : `${API_BASE_URL}/admin/coupons/`;
            const method = editingCoupon ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const saved = await res.json();
                if (editingCoupon) {
                    setCoupons(prev => prev.map(c => c.id === saved.id ? saved : c));
                } else {
                    setCoupons(prev => [saved, ...prev]);
                }
                setShowModal(false);
                fetchStats();
            } else {
                const errData = await res.json();
                const errMsg = Object.entries(errData)
                    .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
                    .join(' | ') || 'Failed to save coupon.';
                setFormError(errMsg);
            }
        } catch (err: any) {
            setFormError(err.message || 'An unexpected error occurred.');
        } finally {
            setIsSaving(false);
        }
    };

    // Open Usage Log
    const handleOpenUsage = async (coupon: Coupon) => {
        if (!token) return;
        setSelectedCouponForUsage(coupon);
        setShowUsageModal(true);
        setUsageLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/admin/coupons/${coupon.id}/usages/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setUsages(data);
            }
        } catch (err) {
            console.error('Failed to load usages:', err);
        } finally {
            setUsageLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header & KPI Summary */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5">
                        <Ticket className="text-accent-500" size={28} />
                        Coupons & Offers
                    </h1>
                    <p className="text-sm text-gray-400 mt-1">
                        Manage discount promo codes, cart incentives, and checkout offers.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => { fetchCoupons(); fetchStats(); }}
                        disabled={loading}
                        className="px-4 py-2.5 bg-dark-800 hover:bg-dark-700 text-gray-300 rounded-xl border border-dark-700 text-sm font-semibold flex items-center gap-2 transition-all shadow-sm"
                        title="Refresh"
                    >
                        <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                    <button
                        onClick={handleOpenCreate}
                        className="px-5 py-2.5 bg-accent-500 hover:bg-accent-400 text-dark-900 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-accent-500/20 transition-all active:scale-95"
                    >
                        <Plus size={18} />
                        Create Coupon
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-dark-800 border border-dark-700 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Coupons</span>
                        <div className="w-9 h-9 rounded-xl bg-accent-500/10 text-accent-400 flex items-center justify-center">
                            <Tag size={18} />
                        </div>
                    </div>
                    <p className="text-2xl font-black text-white mt-3">
                        {statsLoading ? '...' : stats?.total_coupons || 0}
                    </p>
                    <span className="text-xs text-gray-400 mt-1 block">Configured discounts</span>
                </div>

                <div className="bg-dark-800 border border-dark-700 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Active Offers</span>
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                            <CheckCircle2 size={18} />
                        </div>
                    </div>
                    <p className="text-2xl font-black text-emerald-400 mt-3">
                        {statsLoading ? '...' : stats?.active_coupons || 0}
                    </p>
                    <span className="text-xs text-gray-400 mt-1 block">Live on checkout</span>
                </div>

                <div className="bg-dark-800 border border-dark-700 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Used</span>
                        <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                            <Users size={18} />
                        </div>
                    </div>
                    <p className="text-2xl font-black text-blue-400 mt-3">
                        {statsLoading ? '...' : (stats?.total_redemptions || 0).toLocaleString()}
                    </p>
                    <span className="text-xs text-gray-400 mt-1 block">Customer redemptions</span>
                </div>

                <div className="bg-dark-800 border border-dark-700 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Discount Granted</span>
                        <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                            <Sparkles size={18} />
                        </div>
                    </div>
                    <p className="text-2xl font-black text-amber-400 mt-3">
                        ₹{statsLoading ? '...' : Math.round(stats?.total_discount_given || 0).toLocaleString()}
                    </p>
                    <span className="text-xs text-gray-400 mt-1 block">Savings given to buyers</span>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-dark-800 border border-dark-700 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
                <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by code (e.g. VORION10) or title..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-dark-900 border border-dark-700 rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none focus:border-accent-500 transition-colors"
                    />
                </form>

                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    {/* Status Filter */}
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 font-medium">Status:</span>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as any)}
                            className="bg-dark-900 border border-dark-700 text-sm text-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-accent-500"
                        >
                            <option value="all">All Statuses</option>
                            <option value="active">Active Only</option>
                            <option value="inactive">Inactive</option>
                            <option value="expired">Expired</option>
                        </select>
                    </div>

                    {/* Type Filter */}
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 font-medium">Type:</span>
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value as any)}
                            className="bg-dark-900 border border-dark-700 text-sm text-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-accent-500"
                        >
                            <option value="all">All Types</option>
                            <option value="percentage">Percentage (%)</option>
                            <option value="fixed">Fixed Amount (₹)</option>
                            <option value="free_shipping">Free Shipping</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Coupons List / Grid */}
            {loading ? (
                <div className="flex items-center justify-center py-20 bg-dark-800 rounded-3xl border border-dark-700">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-accent-500" />
                </div>
            ) : coupons.length === 0 ? (
                <div className="text-center py-16 bg-dark-800 rounded-3xl border border-dark-700 p-8 shadow-sm">
                    <div className="w-16 h-16 bg-dark-700/50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-gray-400">
                        <Ticket size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1">No Coupons Found</h3>
                    <p className="text-sm text-gray-400 max-w-sm mx-auto mb-6">
                        No promotional discount codes match your search criteria. Create your first coupon to boost checkout conversion!
                    </p>
                    <button
                        onClick={handleOpenCreate}
                        className="px-5 py-2.5 bg-accent-500 hover:bg-accent-400 text-dark-900 rounded-xl font-bold text-sm inline-flex items-center gap-2 transition-all shadow-md shadow-accent-500/20"
                    >
                        <Plus size={16} />
                        Create Coupon Now
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {coupons.map((coupon) => {
                        const isExpired = coupon.valid_until && new Date(coupon.valid_until) < new Date();
                        const isScheduled = coupon.valid_from && new Date(coupon.valid_from) > new Date();
                        const limitReached = coupon.usage_limit && coupon.times_used >= coupon.usage_limit;

                        let statusBadge = (
                            <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Active
                            </span>
                        );

                        if (!coupon.is_active) {
                            statusBadge = (
                                <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-gray-700 text-gray-300">
                                    Inactive
                                </span>
                            );
                        } else if (limitReached) {
                            statusBadge = (
                                <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                    Limit Reached
                                </span>
                            );
                        } else if (isExpired) {
                            statusBadge = (
                                <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                    Expired
                                </span>
                            );
                        } else if (isScheduled) {
                            statusBadge = (
                                <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                    Scheduled
                                </span>
                            );
                        }

                        return (
                            <div
                                key={coupon.id}
                                className="bg-dark-800 border border-dark-700 hover:border-dark-600 rounded-2xl p-5 flex flex-col justify-between shadow-sm transition-all relative overflow-hidden group"
                            >
                                {/* Top Badge & Status */}
                                <div>
                                    <div className="flex items-center justify-between gap-2 mb-3">
                                        <div className="flex items-center gap-2">
                                            {statusBadge}
                                            {coupon.is_featured && (
                                                <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md bg-accent-500/15 text-accent-400 border border-accent-500/30">
                                                    ⭐ Featured
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => handleOpenEdit(coupon)}
                                                className="p-1.5 text-gray-400 hover:text-white hover:bg-dark-700 rounded-lg transition-colors"
                                                title="Edit Coupon"
                                            >
                                                <Edit2 size={15} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(coupon.id, coupon.code)}
                                                disabled={actionLoadingId === coupon.id}
                                                className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                title="Delete Coupon"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Coupon Code & Copy */}
                                    <div className="flex items-center justify-between bg-dark-900 border border-dashed border-dark-600 rounded-xl px-3.5 py-2.5 mb-3 group-hover:border-accent-500/50 transition-colors">
                                        <div className="flex items-center gap-2 font-mono font-black text-base text-accent-400 tracking-wider">
                                            <Ticket size={16} />
                                            {coupon.code}
                                        </div>
                                        <button
                                            onClick={() => handleCopy(coupon.code)}
                                            className="text-xs text-gray-400 hover:text-white flex items-center gap-1 bg-dark-800 hover:bg-dark-700 px-2 py-1 rounded-md transition-all border border-dark-700"
                                            title="Copy Code"
                                        >
                                            {copiedCode === coupon.code ? (
                                                <>
                                                    <Check size={12} className="text-emerald-400" />
                                                    <span className="text-emerald-400 font-bold">Copied</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Copy size={12} />
                                                    <span>Copy</span>
                                                </>
                                            )}
                                        </button>
                                    </div>

                                    {/* Title & Description */}
                                    <h4 className="font-bold text-white text-base mb-1 line-clamp-1">{coupon.title}</h4>
                                    {coupon.description && (
                                        <p className="text-xs text-gray-400 line-clamp-2 mb-3">{coupon.description}</p>
                                    )}

                                    {/* Discount Highlights */}
                                    <div className="bg-dark-900/60 rounded-xl p-3 space-y-1.5 mb-4 text-xs border border-dark-700/50">
                                        <div className="flex justify-between items-center text-gray-300">
                                            <span className="text-gray-400">Discount:</span>
                                            <span className="font-bold text-white text-sm">
                                                {coupon.discount_type === 'percentage'
                                                    ? `${coupon.discount_value}% OFF`
                                                    : coupon.discount_type === 'fixed'
                                                    ? `₹${coupon.discount_value} FLAT OFF`
                                                    : 'Free Shipping'}
                                                {coupon.max_discount_amount ? ` (Up to ₹${coupon.max_discount_amount})` : ''}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center text-gray-400">
                                            <span>Min. Order Subtotal:</span>
                                            <span className="font-semibold text-gray-200">
                                                {coupon.min_order_value > 0 ? `₹${coupon.min_order_value}` : 'No Minimum'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center text-gray-400">
                                            <span>Usage Limit:</span>
                                            <span className="font-semibold text-gray-200">
                                                {coupon.times_used} / {coupon.usage_limit ? coupon.usage_limit : '∞'} used
                                                {coupon.usage_limit_per_user > 1 ? ` (${coupon.usage_limit_per_user}/user)` : ' (1/user)'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Bottom Bar & Actions */}
                                <div>
                                    <div className="flex items-center justify-between text-[11px] text-gray-400 border-t border-dark-700/80 pt-3 mb-3">
                                        <div className="flex items-center gap-1.5">
                                            <Calendar size={13} className="text-gray-500" />
                                            <span>
                                                {coupon.valid_until
                                                    ? `Expires ${new Date(coupon.valid_until).toLocaleDateString()}`
                                                    : 'No expiration'}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => handleOpenUsage(coupon)}
                                            className="text-accent-400 hover:text-accent-300 font-semibold flex items-center gap-1 transition-colors"
                                        >
                                            <Eye size={12} /> Redemptions ({coupon.times_used})
                                        </button>
                                    </div>

                                    {/* Status Switch Toggle */}
                                    <button
                                        onClick={() => handleToggleStatus(coupon)}
                                        disabled={actionLoadingId === coupon.id}
                                        className={`w-full py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                                            coupon.is_active
                                                ? 'bg-dark-700 hover:bg-dark-600 text-gray-300'
                                                : 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30'
                                        }`}
                                    >
                                        {actionLoadingId === coupon.id ? (
                                            <RefreshCcw size={13} className="animate-spin" />
                                        ) : coupon.is_active ? (
                                            'Deactivate Coupon'
                                        ) : (
                                            'Activate Coupon'
                                        )}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Create / Edit Coupon Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
                    <div className="bg-dark-800 border border-dark-700 rounded-3xl w-full max-w-xl p-6 sm:p-7 shadow-2xl relative my-8">
                        <button
                            onClick={() => setShowModal(false)}
                            className="absolute top-5 right-5 text-gray-400 hover:text-white p-2 rounded-xl hover:bg-dark-700 transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-10 h-10 rounded-2xl bg-accent-500/10 text-accent-400 flex items-center justify-center">
                                <Ticket size={22} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white">
                                    {editingCoupon ? `Edit Coupon: ${editingCoupon.code}` : 'Create New Coupon'}
                                </h3>
                                <p className="text-xs text-gray-400">Configure discount value, usage limits, and expiration.</p>
                            </div>
                        </div>

                        {formError && (
                            <div className="mb-5 p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-center gap-2">
                                <AlertCircle size={16} className="shrink-0" />
                                <span>{formError}</span>
                            </div>
                        )}

                        <form onSubmit={handleSaveCoupon} className="space-y-4">
                            {/* Code & Random Generator */}
                            <div>
                                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                                    Coupon Code <span className="text-red-400">*</span>
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. VORION50"
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase().replace(/\s+/g, '') })}
                                        className="flex-1 px-4 py-2.5 bg-dark-900 border border-dark-700 rounded-xl text-white font-mono font-bold uppercase tracking-wider text-sm focus:outline-none focus:border-accent-500"
                                    />
                                    <button
                                        type="button"
                                        onClick={generateRandomCode}
                                        className="px-3.5 py-2 bg-dark-700 hover:bg-dark-600 text-gray-200 text-xs font-bold rounded-xl border border-dark-600 flex items-center gap-1.5 transition-colors"
                                    >
                                        <Sparkles size={14} className="text-accent-400" /> Random
                                    </button>
                                </div>
                            </div>

                            {/* Title */}
                            <div>
                                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                                    Coupon Title / Offer Name <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. 15% Off on All Orders"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-dark-900 border border-dark-700 rounded-xl text-white text-sm focus:outline-none focus:border-accent-500"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                                    Description / Terms (Optional)
                                </label>
                                <textarea
                                    rows={2}
                                    placeholder="e.g. Applicable on carts above ₹499. One redemption per customer."
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-4 py-2 bg-dark-900 border border-dark-700 rounded-xl text-white text-sm focus:outline-none focus:border-accent-500 resize-none"
                                />
                            </div>

                            {/* Discount Type & Value */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                                        Discount Type
                                    </label>
                                    <select
                                        value={formData.discount_type}
                                        onChange={(e) => setFormData({ ...formData, discount_type: e.target.value as any })}
                                        className="w-full px-3.5 py-2.5 bg-dark-900 border border-dark-700 rounded-xl text-white text-sm focus:outline-none focus:border-accent-500"
                                    >
                                        <option value="percentage">Percentage Discount (%)</option>
                                        <option value="fixed">Fixed Amount Discount (₹)</option>
                                        <option value="free_shipping">Free Shipping</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                                        {formData.discount_type === 'percentage'
                                            ? 'Discount Percentage (%)'
                                            : formData.discount_type === 'fixed'
                                            ? 'Discount Amount (₹)'
                                            : 'Discount Value'}
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        max={formData.discount_type === 'percentage' ? '100' : '100000'}
                                        required={formData.discount_type !== 'free_shipping'}
                                        disabled={formData.discount_type === 'free_shipping'}
                                        placeholder={formData.discount_type === 'percentage' ? '10' : '50'}
                                        value={formData.discount_value}
                                        onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-dark-900 border border-dark-700 rounded-xl text-white text-sm focus:outline-none focus:border-accent-500 disabled:opacity-50"
                                    />
                                </div>
                            </div>

                            {/* Min Order & Max Discount Cap */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                                        Minimum Order Subtotal (₹)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        placeholder="0 (No minimum)"
                                        value={formData.min_order_value}
                                        onChange={(e) => setFormData({ ...formData, min_order_value: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-dark-900 border border-dark-700 rounded-xl text-white text-sm focus:outline-none focus:border-accent-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                                        Max Discount Cap (₹)
                                        <span className="text-gray-500 font-normal ml-1">(For %)</span>
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        placeholder="Leave blank for no cap"
                                        value={formData.max_discount_amount}
                                        onChange={(e) => setFormData({ ...formData, max_discount_amount: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-dark-900 border border-dark-700 rounded-xl text-white text-sm focus:outline-none focus:border-accent-500"
                                    />
                                </div>
                            </div>

                            {/* Usage Limits */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                                        Total Usage Limit
                                        <span className="text-gray-500 font-normal ml-1">(Blank = Unlimited)</span>
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        placeholder="e.g. 100 total uses"
                                        value={formData.usage_limit}
                                        onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-dark-900 border border-dark-700 rounded-xl text-white text-sm focus:outline-none focus:border-accent-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                                        Limit Per Customer
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        placeholder="1 (Recommended)"
                                        value={formData.usage_limit_per_user}
                                        onChange={(e) => setFormData({ ...formData, usage_limit_per_user: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-dark-900 border border-dark-700 rounded-xl text-white text-sm focus:outline-none focus:border-accent-500"
                                    />
                                </div>
                            </div>

                            {/* Validity Dates */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                                        Valid From
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={formData.valid_from}
                                        onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                                        className="w-full px-3.5 py-2.5 bg-dark-900 border border-dark-700 rounded-xl text-white text-sm focus:outline-none focus:border-accent-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                                        Valid Until (Expiry)
                                        <span className="text-gray-500 font-normal ml-1">(Optional)</span>
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={formData.valid_until}
                                        onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                                        className="w-full px-3.5 py-2.5 bg-dark-900 border border-dark-700 rounded-xl text-white text-sm focus:outline-none focus:border-accent-500"
                                    />
                                </div>
                            </div>

                            {/* Toggles */}
                            <div className="pt-2 border-t border-dark-700/80 space-y-3">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.is_active}
                                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                        className="w-4 h-4 rounded text-accent-500 bg-dark-900 border-dark-600 focus:ring-accent-500"
                                    />
                                    <span className="text-sm text-gray-200 font-medium">Coupon is Active</span>
                                </label>

                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.is_featured}
                                        onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                                        className="w-4 h-4 rounded text-accent-500 bg-dark-900 border-dark-600 focus:ring-accent-500"
                                    />
                                    <span className="text-sm text-gray-200 font-medium">
                                        Feature on Checkout (Display in &apos;Available Offers&apos; list for buyers)
                                    </span>
                                </label>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-3 pt-4 border-t border-dark-700">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-5 py-2.5 bg-dark-700 hover:bg-dark-600 text-gray-300 font-bold rounded-xl text-sm transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="px-6 py-2.5 bg-accent-500 hover:bg-accent-400 text-dark-900 font-bold rounded-xl text-sm transition-all shadow-lg shadow-accent-500/20 disabled:opacity-50 flex items-center gap-2"
                                >
                                    {isSaving ? (
                                        <>
                                            <RefreshCcw size={16} className="animate-spin" />
                                            Saving...
                                        </>
                                    ) : editingCoupon ? (
                                        'Update Coupon'
                                    ) : (
                                        'Create Coupon'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Usage Log Modal */}
            {showUsageModal && selectedCouponForUsage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="bg-dark-800 border border-dark-700 rounded-3xl w-full max-w-2xl p-6 sm:p-7 shadow-2xl relative max-h-[85vh] flex flex-col">
                        <button
                            onClick={() => setShowUsageModal(false)}
                            className="absolute top-5 right-5 text-gray-400 hover:text-white p-2 rounded-xl hover:bg-dark-700 transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <div className="flex items-center gap-3 mb-4 shrink-0">
                            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                                <Users size={20} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    Redemption Logs: <span className="font-mono text-accent-400">{selectedCouponForUsage.code}</span>
                                </h3>
                                <p className="text-xs text-gray-400">Total redemptions: {selectedCouponForUsage.times_used}</p>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
                            {usageLoading ? (
                                <div className="flex items-center justify-center py-16">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-500" />
                                </div>
                            ) : usages.length === 0 ? (
                                <div className="text-center py-12 text-gray-400">
                                    <p className="text-sm">No redemptions recorded for this coupon yet.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-dark-700">
                                    {usages.map((u) => (
                                        <div key={u.id} className="py-3 flex items-center justify-between text-xs">
                                            <div>
                                                <p className="font-bold text-white">
                                                    Order: {u.order_number || 'N/A'}
                                                </p>
                                                <p className="text-gray-400 mt-0.5">
                                                    Phone: {u.customer_phone || 'Anonymous'}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <span className="font-black text-emerald-400 text-sm">
                                                    -₹{Number(u.discount_applied).toLocaleString()}
                                                </span>
                                                <p className="text-[10px] text-gray-500 mt-0.5">
                                                    {new Date(u.used_at).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
