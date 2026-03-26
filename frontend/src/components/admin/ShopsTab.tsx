import { useEffect, useMemo, useState } from 'react';
import { Building2, Edit, Loader2, Package, Plus, Save, Search, Store, Trash2, UserRound, Wallet, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { API_BASE_URL } from '@/config/apiConfig';
import { Shop } from '@/types/admin';

interface PartnerOption {
    id: number;
    partner_profile_id?: number | null;
    email: string;
    first_name: string;
    last_name: string;
}

const shopTypeOptions = [
    { value: 'b2b_ecommerce', label: 'Online B2B E-commerce Store' },
    { value: 'local_shop', label: 'Local Shop' },
    { value: 'single_product_wholesaler', label: 'Single Product Wholesaler' },
    { value: 'multi_product_seller', label: 'Multiple Product Seller' },
    { value: 'retailer', label: 'Retailer' },
    { value: 'other', label: 'Other' },
];

const emptyForm = {
    name: '',
    description: '',
    address: '',
    city: '',
    phone: '',
    email: '',
    shop_type: 'other',
    source_platform: '',
    website_url: '',
    contact_person: '',
    whatsapp_number: '',
    notes: '',
    sourcing_partner_ids: [] as string[],
    is_active: true,
    approval_status: 'approved',
};

export default function ShopsTab() {
    const { token, hasPermission } = useAuth();
    const canAdd = hasPermission('add_shop');
    const canEdit = hasPermission('change_shop');
    const canDelete = hasPermission('delete_shop');

    const [shops, setShops] = useState<Shop[]>([]);
    const [partners, setPartners] = useState<PartnerOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingShop, setEditingShop] = useState<Shop | null>(null);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState(emptyForm);

    const headers = useMemo(() => ({
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
    }), [token]);

    const fetchPartners = async () => {
        if (!token) return;
        try {
            const response = await fetch(`${API_BASE_URL}/admin/partners/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.ok) {
                const data = await response.json();
                setPartners(data.results || data);
            }
        } catch (fetchError) {
            console.error('Failed to fetch partners:', fetchError);
        }
    };

    const fetchShops = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search.trim()) params.append('search', search.trim());
            if (typeFilter) params.append('shop_type', typeFilter);

            const response = await fetch(`${API_BASE_URL}/admin/shops/?${params.toString()}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.ok) {
                const data = await response.json();
                setShops(data.results || data);
            }
        } catch (fetchError) {
            console.error('Failed to fetch shops:', fetchError);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            fetchPartners();
        }
    }, [token]);

    useEffect(() => {
        if (!token) return;
        const timer = setTimeout(() => {
            fetchShops();
        }, 250);
        return () => clearTimeout(timer);
    }, [token, search, typeFilter]);

    const totalPendingPayment = shops.reduce((sum, shop) => sum + Number(shop.pending_payment || 0), 0);
    const sourcedShops = shops.filter((shop) => (shop.sourcing_partners?.length || 0) > 0 || shop.sourcing_partner_name).length;

    const handleOpenAdd = () => {
        setEditingShop(null);
        setFormData(emptyForm);
        setError('');
        setIsModalOpen(true);
    };

    const handleOpenEdit = (shop: Shop) => {
        setEditingShop(shop);
        setFormData({
            name: shop.name || '',
            description: shop.description || '',
            address: shop.address || '',
            city: shop.city || '',
            phone: shop.phone || '',
            email: shop.email || '',
            shop_type: shop.shop_type || 'other',
            source_platform: shop.source_platform || '',
            website_url: shop.website_url || '',
            contact_person: shop.contact_person || '',
            whatsapp_number: shop.whatsapp_number || '',
            notes: shop.notes || '',
            sourcing_partner_ids: shop.sourcing_partners?.length
                ? shop.sourcing_partners.map((partner) => String(partner.id))
                : shop.sourcing_partner
                    ? [String(shop.sourcing_partner)]
                    : shop.sourcing_partner_id
                        ? [String(shop.sourcing_partner_id)]
                        : [],
            is_active: shop.is_active ?? true,
            approval_status: shop.approval_status || 'approved',
        });
        setError('');
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingShop(null);
        setFormData(emptyForm);
        setError('');
    };

    const handleDelete = async (shopId: number) => {
        if (!confirm('Delete this shop? Products linked to it will lose their source reference.')) return;
        try {
            const response = await fetch(`${API_BASE_URL}/admin/shops/${shopId}/`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.ok) {
                fetchShops();
            } else {
                alert('Failed to delete shop.');
            }
        } catch (deleteError) {
            console.error('Failed to delete shop:', deleteError);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError('');

        try {
            const payload = {
                ...formData,
                sourcing_partner_ids: formData.sourcing_partner_ids.map((partnerId) => Number(partnerId)),
            };

            const response = await fetch(
                editingShop ? `${API_BASE_URL}/admin/shops/${editingShop.id}/` : `${API_BASE_URL}/admin/shops/`,
                {
                    method: editingShop ? 'PATCH' : 'POST',
                    headers,
                    body: JSON.stringify(payload),
                }
            );

            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(JSON.stringify(data));
            }

            handleCloseModal();
            fetchShops();
        } catch (submitError) {
            console.error('Failed to save shop:', submitError);
            setError(submitError instanceof Error ? submitError.message : 'Unable to save shop.');
        } finally {
            setSaving(false);
        }
    };

    const formatCurrency = (value: number) => `₹${value.toLocaleString()}`;
    const togglePartner = (partnerId: string) => {
        setFormData((prev) => ({
            ...prev,
            sourcing_partner_ids: prev.sourcing_partner_ids.includes(partnerId)
                ? prev.sourcing_partner_ids.filter((id) => id !== partnerId)
                : [...prev.sourcing_partner_ids, partnerId],
        }));
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                    <h1 className="font-display text-2xl font-bold text-white flex items-center gap-3">
                        <Store className="text-accent-500" />
                        Shop Management
                    </h1>
                    <p className="text-silver-500 mt-1 max-w-3xl">
                        Manage sourcing shops separately from partners. Each shop can be tagged with the partner who found it, while payments stay tracked shop-wise.
                    </p>
                </div>
                {canAdd && (
                    <button
                        onClick={handleOpenAdd}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent-500 text-dark-900 font-semibold shadow-lg shadow-accent-500/20"
                    >
                        <Plus size={18} />
                        Add Shop
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="bg-dark-800 border border-dark-700 rounded-2xl p-5">
                    <p className="text-sm text-silver-500">Total shops</p>
                    <p className="text-3xl font-bold text-white mt-2">{shops.length}</p>
                </div>
                <div className="bg-dark-800 border border-dark-700 rounded-2xl p-5">
                    <p className="text-sm text-silver-500">Active shops</p>
                    <p className="text-3xl font-bold text-white mt-2">{shops.filter((shop) => shop.is_active).length}</p>
                </div>
                <div className="bg-dark-800 border border-dark-700 rounded-2xl p-5">
                    <p className="text-sm text-silver-500">Pending payments</p>
                    <p className="text-3xl font-bold text-amber-400 mt-2">{formatCurrency(totalPendingPayment)}</p>
                </div>
                <div className="bg-dark-800 border border-dark-700 rounded-2xl p-5">
                    <p className="text-sm text-silver-500">Tagged to partners</p>
                    <p className="text-3xl font-bold text-white mt-2">{sourcedShops}</p>
                </div>
            </div>

            <div className="bg-dark-800 border border-dark-700 rounded-2xl p-4 flex flex-col gap-4 lg:flex-row lg:items-center">
                <div className="relative flex-1">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-silver-500" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search shop, city, contact, phone, platform..."
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-dark-700 border border-dark-600 text-white placeholder:text-silver-500 focus:outline-none focus:border-accent-500"
                    />
                </div>
                <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="px-4 py-3 rounded-xl bg-dark-700 border border-dark-600 text-white focus:outline-none focus:border-accent-500"
                >
                    <option value="">All shop types</option>
                    {shopTypeOptions.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                </select>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {loading ? (
                    <div className="xl:col-span-2 flex items-center justify-center min-h-[240px] bg-dark-800 border border-dark-700 rounded-2xl">
                        <Loader2 className="animate-spin text-accent-500" size={28} />
                    </div>
                ) : shops.length === 0 ? (
                    <div className="xl:col-span-2 bg-dark-800 border border-dark-700 rounded-2xl p-10 text-center">
                        <Building2 className="mx-auto text-silver-500 mb-4" size={32} />
                        <p className="text-white font-semibold">No shops found</p>
                        <p className="text-silver-500 mt-2">Add shops here to track source channels, assigned sourcing partners, and pending payments.</p>
                    </div>
                ) : (
                    shops.map((shop) => (
                        <div key={shop.id} className="bg-dark-800 border border-dark-700 rounded-2xl p-5 space-y-4">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h3 className="text-lg font-bold text-white">{shop.name}</h3>
                                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold border bg-dark-700 text-silver-300 border-dark-600">
                                            {shop.shop_type_display || 'Other'}
                                        </span>
                                        {shop.is_active ? (
                                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold border bg-green-500/10 text-green-400 border-green-500/20">Active</span>
                                        ) : (
                                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold border bg-red-500/10 text-red-400 border-red-500/20">Inactive</span>
                                        )}
                                    </div>
                                    <p className="text-sm text-silver-500 mt-1">{shop.city} • {shop.phone}</p>
                                    {shop.source_platform && (
                                        <p className="text-sm text-silver-400 mt-2">Source: {shop.source_platform}</p>
                                    )}
                                </div>

                                <div className="flex items-center gap-2">
                                    {canEdit && (
                                        <button
                                            onClick={() => handleOpenEdit(shop)}
                                            className="p-2 rounded-lg text-silver-400 hover:text-accent-500 hover:bg-accent-500/10"
                                        >
                                            <Edit size={16} />
                                        </button>
                                    )}
                                    {canDelete && (
                                        <button
                                            onClick={() => handleDelete(shop.id)}
                                            className="p-2 rounded-lg text-silver-400 hover:text-red-500 hover:bg-red-500/10"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {shop.description && <p className="text-sm text-silver-300">{shop.description}</p>}

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="bg-dark-700/70 rounded-xl p-3">
                                    <div className="flex items-center gap-2 text-silver-500 text-xs uppercase tracking-wide">
                                        <Package size={14} />
                                        Products
                                    </div>
                                    <p className="text-white text-xl font-bold mt-2">{shop.product_count || 0}</p>
                                </div>
                                <div className="bg-dark-700/70 rounded-xl p-3">
                                    <div className="flex items-center gap-2 text-silver-500 text-xs uppercase tracking-wide">
                                        <Wallet size={14} />
                                        Pending payment
                                    </div>
                                    <p className="text-amber-400 text-xl font-bold mt-2">{formatCurrency(Number(shop.pending_payment || 0))}</p>
                                    <p className="text-xs text-silver-500 mt-1">{shop.pending_order_count || 0} pending order{shop.pending_order_count === 1 ? '' : 's'}</p>
                                </div>
                                <div className="bg-dark-700/70 rounded-xl p-3">
                                    <div className="flex items-center gap-2 text-silver-500 text-xs uppercase tracking-wide">
                                        <UserRound size={14} />
                                        Sourced by
                                    </div>
                                    <p className="text-white text-sm font-semibold mt-2">{shop.sourcing_partner_name || 'Not assigned'}</p>
                                    <p className="text-xs text-silver-500 mt-1">{shop.contact_person || shop.email}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                <div>
                                    <p className="text-silver-500">Email</p>
                                    <p className="text-silver-200 mt-1 break-all">{shop.email}</p>
                                </div>
                                <div>
                                    <p className="text-silver-500">Address</p>
                                    <p className="text-silver-200 mt-1">{shop.address}</p>
                                </div>
                                {shop.website_url && (
                                    <div>
                                        <p className="text-silver-500">Website</p>
                                        <a href={shop.website_url} target="_blank" rel="noreferrer" className="text-accent-400 mt-1 inline-block break-all">
                                            {shop.website_url}
                                        </a>
                                    </div>
                                )}
                                {shop.notes && (
                                    <div>
                                        <p className="text-silver-500">Notes</p>
                                        <p className="text-silver-200 mt-1">{shop.notes}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm p-4 overflow-y-auto flex items-center justify-center">
                    <div className="w-full max-w-3xl max-h-[calc(100vh-2rem)] overflow-hidden bg-dark-800 border border-dark-700 rounded-3xl shadow-2xl">
                        <div className="flex items-center justify-between px-6 py-5 border-b border-dark-700">
                            <div>
                                <h2 className="text-xl font-bold text-white">{editingShop ? 'Edit Shop' : 'Add Shop'}</h2>
                                <p className="text-sm text-silver-500 mt-1">This shop stays independent from partner accounts. Partner tagging is only for source attribution.</p>
                            </div>
                            <button onClick={handleCloseModal} className="p-2 rounded-lg text-silver-400 hover:text-white hover:bg-dark-700">
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[calc(100vh-8rem)]">
                            {error && (
                                <div className="px-4 py-3 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 text-sm break-all">
                                    {error}
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <label className="space-y-2">
                                    <span className="text-sm text-silver-300">Shop name</span>
                                    <input required value={formData.name} onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))} className="w-full px-4 py-3 rounded-xl bg-dark-700 border border-dark-600 text-white focus:outline-none focus:border-accent-500" />
                                </label>
                                <label className="space-y-2">
                                    <span className="text-sm text-silver-300">Shop type</span>
                                    <select value={formData.shop_type} onChange={(e) => setFormData((prev) => ({ ...prev, shop_type: e.target.value }))} className="w-full px-4 py-3 rounded-xl bg-dark-700 border border-dark-600 text-white focus:outline-none focus:border-accent-500">
                                        {shopTypeOptions.map((option) => (
                                            <option key={option.value} value={option.value}>{option.label}</option>
                                        ))}
                                    </select>
                                </label>
                                <label className="space-y-2">
                                    <span className="text-sm text-silver-300">Email</span>
                                    <input required type="email" value={formData.email} onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))} className="w-full px-4 py-3 rounded-xl bg-dark-700 border border-dark-600 text-white focus:outline-none focus:border-accent-500" />
                                </label>
                                <label className="space-y-2">
                                    <span className="text-sm text-silver-300">Phone</span>
                                    <input required value={formData.phone} onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))} className="w-full px-4 py-3 rounded-xl bg-dark-700 border border-dark-600 text-white focus:outline-none focus:border-accent-500" />
                                </label>
                                <label className="space-y-2">
                                    <span className="text-sm text-silver-300">City</span>
                                    <input required value={formData.city} onChange={(e) => setFormData((prev) => ({ ...prev, city: e.target.value }))} className="w-full px-4 py-3 rounded-xl bg-dark-700 border border-dark-600 text-white focus:outline-none focus:border-accent-500" />
                                </label>
                                <label className="space-y-2">
                                    <span className="text-sm text-silver-300">Contact person</span>
                                    <input value={formData.contact_person} onChange={(e) => setFormData((prev) => ({ ...prev, contact_person: e.target.value }))} className="w-full px-4 py-3 rounded-xl bg-dark-700 border border-dark-600 text-white focus:outline-none focus:border-accent-500" />
                                </label>
                                <label className="space-y-2">
                                    <span className="text-sm text-silver-300">Source platform</span>
                                    <input value={formData.source_platform} onChange={(e) => setFormData((prev) => ({ ...prev, source_platform: e.target.value }))} placeholder="IndiaMART, Meesho, Shopify, local market..." className="w-full px-4 py-3 rounded-xl bg-dark-700 border border-dark-600 text-white focus:outline-none focus:border-accent-500" />
                                </label>
                                <label className="space-y-2">
                                    <span className="text-sm text-silver-300">Website URL</span>
                                    <input value={formData.website_url} onChange={(e) => setFormData((prev) => ({ ...prev, website_url: e.target.value }))} className="w-full px-4 py-3 rounded-xl bg-dark-700 border border-dark-600 text-white focus:outline-none focus:border-accent-500" />
                                </label>
                                <label className="space-y-2">
                                    <span className="text-sm text-silver-300">WhatsApp number</span>
                                    <input value={formData.whatsapp_number} onChange={(e) => setFormData((prev) => ({ ...prev, whatsapp_number: e.target.value }))} className="w-full px-4 py-3 rounded-xl bg-dark-700 border border-dark-600 text-white focus:outline-none focus:border-accent-500" />
                                </label>
                                <div className="space-y-2">
                                    <span className="text-sm text-silver-300">Sourced by partners</span>
                                    <div className="rounded-xl bg-dark-700 border border-dark-600 p-3 max-h-44 overflow-y-auto space-y-2">
                                        {partners.length === 0 ? (
                                            <p className="text-sm text-silver-500">No partners available.</p>
                                        ) : (
                                            partners.map((partner) => {
                                                const partnerId = String(partner.partner_profile_id ?? partner.id);
                                                const label = (partner.first_name || partner.last_name)
                                                    ? `${partner.first_name} ${partner.last_name}`.trim()
                                                    : partner.email;

                                                return (
                                                    <label key={partnerId} className="flex items-start gap-3 rounded-lg px-3 py-2 hover:bg-dark-600/60 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={formData.sourcing_partner_ids.includes(partnerId)}
                                                            onChange={() => togglePartner(partnerId)}
                                                            className="mt-1 rounded border-dark-500 bg-dark-700 text-accent-500 focus:ring-accent-500"
                                                        />
                                                        <span>
                                                            <span className="block text-sm font-medium text-white">{label}</span>
                                                            <span className="block text-xs text-silver-500">{partner.email}</span>
                                                        </span>
                                                    </label>
                                                );
                                            })
                                        )}
                                    </div>
                                    <p className="text-xs text-silver-500">Select one or more partners who sourced or introduced this shop.</p>
                                </div>
                            </div>

                            <label className="space-y-2 block">
                                <span className="text-sm text-silver-300">Address</span>
                                <textarea required value={formData.address} onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))} rows={3} className="w-full px-4 py-3 rounded-xl bg-dark-700 border border-dark-600 text-white focus:outline-none focus:border-accent-500" />
                            </label>

                            <label className="space-y-2 block">
                                <span className="text-sm text-silver-300">Description</span>
                                <textarea value={formData.description} onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))} rows={3} className="w-full px-4 py-3 rounded-xl bg-dark-700 border border-dark-600 text-white focus:outline-none focus:border-accent-500" />
                            </label>

                            <label className="space-y-2 block">
                                <span className="text-sm text-silver-300">Internal notes</span>
                                <textarea value={formData.notes} onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))} rows={3} className="w-full px-4 py-3 rounded-xl bg-dark-700 border border-dark-600 text-white focus:outline-none focus:border-accent-500" />
                            </label>

                            <div className="flex items-center justify-between gap-4 flex-wrap">
                                <label className="inline-flex items-center gap-3 text-sm text-silver-300">
                                    <input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData((prev) => ({ ...prev, is_active: e.target.checked }))} className="rounded border-dark-500 bg-dark-700 text-accent-500 focus:ring-accent-500" />
                                    Active shop
                                </label>

                                <div className="flex items-center gap-3">
                                    <button type="button" onClick={handleCloseModal} className="px-4 py-2.5 rounded-xl border border-dark-600 text-silver-300 hover:bg-dark-700">
                                        Cancel
                                    </button>
                                    <button type="submit" disabled={saving} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent-500 text-dark-900 font-semibold disabled:opacity-70">
                                        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                        {editingShop ? 'Update Shop' : 'Create Shop'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
