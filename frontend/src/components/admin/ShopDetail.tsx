import { useState, useEffect } from 'react';
import { Shop, Product, Order } from '@/types/admin';
import { Package, ShoppingCart, ArrowLeft, Mail, Phone, MapPin, Trash2, Edit } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { API_BASE_URL } from '@/config/apiConfig';

interface ShopDetailProps {
    shop: Shop;
    onBack: () => void;
}

export default function ShopDetail({ shop, onBack }: ShopDetailProps) {
    const { token, hasPermission } = useAuth();
    const [activeTab, setActiveTab] = useState<'products' | 'orders'>('products');
    const [products, setProducts] = useState<Product[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    const canDelete = hasPermission('delete_shop');
    const canEdit = hasPermission('change_shop');

    useEffect(() => {
        if (token) fetchShopData();
    }, [shop.id, token]);

    const fetchShopData = async () => {
        setLoading(true);
        try {
            const headers = { 'Authorization': `Bearer ${token}` };
            const [productsRes, ordersRes] = await Promise.all([
                fetch(`${API_BASE_URL}/admin/products/?shop=${shop.id}`, { headers }),
                fetch(`${API_BASE_URL}/admin/orders/?shop=${shop.id}`, { headers })
            ]);

            if (productsRes.ok) {
                const data = await productsRes.json();
                setProducts(data.results || data);
            }
            if (ordersRes.ok) {
                const data = await ordersRes.json();
                setOrders(data.results || data);
            }
        } catch (error) {
            console.error('Error fetching shop details:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this shop and all its associations?')) return;
        try {
            const response = await fetch(`${API_BASE_URL}/admin/shops/${shop.id}/`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                onBack();
            } else {
                alert('Failed to delete shop.');
            }
        } catch (error) {
            console.error('Error deleting shop:', error);
        }
    };

    const allTabs = [
        { id: 'products', label: 'Products', icon: Package, count: products.length, permission: 'view_product' },
        { id: 'orders', label: 'Orders', icon: ShoppingCart, count: orders.length, permission: 'view_order' },
    ];

    const tabs = allTabs.filter(t => hasPermission(t.permission));

    return (
        <div className="animate-fade-in space-y-6">
            {/* Header */}
            <div className="bg-dark-800 rounded-2xl p-6 shadow-sm border border-dark-700">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-silver-500 hover:text-white transition-colors mb-6"
                >
                    <ArrowLeft size={18} /> Back to Shops
                </button>

                <div className="flex flex-col md:flex-row justify-between gap-6">
                    <div className="flex items-start gap-4">
                        <div className="w-16 h-16 bg-accent-500/10 text-accent-500 rounded-2xl flex items-center justify-center text-2xl font-bold border border-accent-500/20">
                            {shop.name.charAt(0)}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">{shop.name}</h1>
                            <div className="flex flex-wrap gap-4 mt-2 text-sm text-silver-500">
                                <div className="flex items-center gap-1.5">
                                    <Mail size={14} /> {shop.email}
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Phone size={14} /> {shop.phone}
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <MapPin size={14} /> {shop.city}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 text-right">
                        <div className="flex items-center gap-2">
                            {canEdit && (
                                <button className="p-2 text-silver-400 hover:text-accent-500 hover:bg-accent-500/10 rounded-lg transition-colors">
                                    <Edit size={18} />
                                </button>
                            )}
                            {canDelete && (
                                <button
                                    onClick={handleDelete}
                                    className="p-2 text-silver-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                >
                                    <Trash2 size={18} />
                                </button>
                            )}
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${shop.is_active ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                                {shop.is_active ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                        <div className="text-sm text-silver-500">
                            Joined {new Date(shop.created_at).toLocaleDateString()}
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-dark-700">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-6 py-3 font-medium text-sm transition-colors relative ${activeTab === tab.id
                            ? 'text-accent-500'
                            : 'text-silver-500 hover:text-white'
                            }`}
                    >
                        <tab.icon size={18} />
                        {tab.label}
                        <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === tab.id ? 'bg-accent-500/10 text-accent-500' : 'bg-dark-700 text-silver-500'}`}>
                            {tab.count}
                        </span>
                        {activeTab === tab.id && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-500 shadow-[0_0_10px_rgba(235,255,0,0.5)]" />
                        )}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="bg-dark-800 rounded-2xl shadow-sm border border-dark-700 min-h-[400px]">
                {loading ? (
                    <div className="flex items-center justify-center h-64 text-silver-500">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-500 mr-2"></div>
                        Loading data...
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        {activeTab === 'products' && (
                            <table className="w-full">
                                <thead className="bg-dark-700/50 text-xs font-medium text-silver-500 uppercase border-b border-dark-700">
                                    <tr>
                                        <th className="px-6 py-4 text-left">Product</th>
                                        <th className="px-6 py-4 text-left">Price</th>
                                        <th className="px-6 py-4 text-left">Stock</th>
                                        <th className="px-6 py-4 text-left">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-dark-700">
                                    {products.map(p => (
                                        <tr key={p.id} className="hover:bg-dark-700/50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-white">{p.name}</td>
                                            <td className="px-6 py-4 text-silver-300">₹{p.price}</td>
                                            <td className="px-6 py-4 text-silver-300">{p.stock}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-0.5 rounded-full text-xs border ${p.is_active ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-dark-700 text-silver-500 border-dark-600'}`}>
                                                    {p.is_active ? 'Active' : 'Hidden'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {products.length === 0 && (
                                        <tr><td colSpan={4} className="px-6 py-12 text-center text-silver-500">No products found</td></tr>
                                    )}
                                </tbody>
                            </table>
                        )}

                        {activeTab === 'orders' && (
                            <table className="w-full">
                                <thead className="bg-dark-700/50 text-xs font-medium text-silver-500 uppercase border-b border-dark-700">
                                    <tr>
                                        <th className="px-6 py-4 text-left">Order ID</th>
                                        <th className="px-6 py-4 text-left">Customer</th>
                                        <th className="px-6 py-4 text-left">Total</th>
                                        <th className="px-6 py-4 text-left">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-dark-700">
                                    {orders.map(o => (
                                        <tr key={o.id} className="hover:bg-dark-700/50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-white">{o.order_id}</td>
                                            <td className="px-6 py-4 text-silver-300">{o.customer?.name || 'Guest'}</td>
                                            <td className="px-6 py-4 text-accent-400 font-medium">₹{o.total_amount}</td>
                                            <td className="px-6 py-4">
                                                <span className="px-2.5 py-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full text-xs capitalize">
                                                    {o.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {orders.length === 0 && (
                                        <tr><td colSpan={4} className="px-6 py-12 text-center text-silver-500">No orders found</td></tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
