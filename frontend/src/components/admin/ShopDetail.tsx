import { useState, useEffect } from 'react';
import { Shop, Product, Order, Subscription } from '@/types/admin';
import { Package, ShoppingCart, CreditCard, ArrowLeft, Mail, Phone, MapPin, Trash2, Edit } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { API_BASE_URL } from '@/config/apiConfig';

interface ShopDetailProps {
    shop: Shop;
    onBack: () => void;
}

export default function ShopDetail({ shop, onBack }: ShopDetailProps) {
    const { token, hasPermission } = useAuth();
    const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'billing'>('products');
    const [products, setProducts] = useState<Product[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [billing, setBilling] = useState<Subscription[]>([]);
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
            const [productsRes, ordersRes, billingRes] = await Promise.all([
                fetch(`${API_BASE_URL}/admin/products/?shop=${shop.id}`, { headers }),
                fetch(`${API_BASE_URL}/admin/orders/?shop=${shop.id}`, { headers }),
                fetch(`${API_BASE_URL}/admin/subscriptions/?shop=${shop.id}`, { headers })
            ]);

            if (productsRes.ok) {
                const data = await productsRes.json();
                setProducts(data.results || data);
            }
            if (ordersRes.ok) {
                const data = await ordersRes.json();
                setOrders(data.results || data);
            }
            if (billingRes.ok) {
                const data = await billingRes.json();
                setBilling(data.results || data);
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
        { id: 'billing', label: 'Billing History', icon: CreditCard, count: billing.length, permission: 'view_subscription' },
    ];

    const tabs = allTabs.filter(t => hasPermission(t.permission));

    return (
        <div className="animate-fade-in space-y-6">
            {/* Header */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors mb-6"
                >
                    <ArrowLeft size={18} /> Back to Shops
                </button>

                <div className="flex flex-col md:flex-row justify-between gap-6">
                    <div className="flex items-start gap-4">
                        <div className="w-16 h-16 bg-primary-100 text-primary-600 rounded-2xl flex items-center justify-center text-2xl font-bold">
                            {shop.name.charAt(0)}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">{shop.name}</h1>
                            <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
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
                                <button className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                                    <Edit size={18} />
                                </button>
                            )}
                            {canDelete && (
                                <button
                                    onClick={handleDelete}
                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <Trash2 size={18} />
                                </button>
                            )}
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${shop.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {shop.is_active ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                        <div className="text-sm text-gray-500">
                            Joined {new Date(shop.created_at).toLocaleDateString()}
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-gray-200">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-6 py-3 font-medium text-sm transition-colors relative ${activeTab === tab.id
                            ? 'text-primary-600'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <tab.icon size={18} />
                        {tab.label}
                        <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                            {tab.count}
                        </span>
                        {activeTab === tab.id && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600" />
                        )}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 min-h-[400px]">
                {loading ? (
                    <div className="flex items-center justify-center h-64 text-gray-400">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mr-2"></div>
                        Loading data...
                    </div>
                ) : (
                    <div className="p-6">
                        {activeTab === 'products' && (
                            <table className="w-full">
                                <thead className="bg-gray-50 text-xs font-medium text-gray-500 uppercase">
                                    <tr>
                                        <th className="px-4 py-3 text-left">Product</th>
                                        <th className="px-4 py-3 text-left">Price</th>
                                        <th className="px-4 py-3 text-left">Stock</th>
                                        <th className="px-4 py-3 text-left">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {products.map(p => (
                                        <tr key={p.id}>
                                            <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                                            <td className="px-4 py-3">₹{p.price}</td>
                                            <td className="px-4 py-3">{p.stock}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-0.5 rounded-full text-xs ${p.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'}`}>
                                                    {p.is_active ? 'Active' : 'Hidden'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {products.length === 0 && (
                                        <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500">No products found</td></tr>
                                    )}
                                </tbody>
                            </table>
                        )}

                        {activeTab === 'orders' && (
                            <table className="w-full">
                                <thead className="bg-gray-50 text-xs font-medium text-gray-500 uppercase">
                                    <tr>
                                        <th className="px-4 py-3 text-left">Order ID</th>
                                        <th className="px-4 py-3 text-left">Customer</th>
                                        <th className="px-4 py-3 text-left">Total</th>
                                        <th className="px-4 py-3 text-left">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {orders.map(o => (
                                        <tr key={o.id}>
                                            <td className="px-4 py-3 font-medium text-gray-900">{o.order_id}</td>
                                            <td className="px-4 py-3">{o.customer?.name || 'Guest'}</td>
                                            <td className="px-4 py-3">₹{o.total_amount}</td>
                                            <td className="px-4 py-3">
                                                <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full text-xs capitalize">
                                                    {o.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {orders.length === 0 && (
                                        <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500">No orders found</td></tr>
                                    )}
                                </tbody>
                            </table>
                        )}

                        {activeTab === 'billing' && (
                            <table className="w-full">
                                <thead className="bg-gray-50 text-xs font-medium text-gray-500 uppercase">
                                    <tr>
                                        <th className="px-4 py-3 text-left">Date</th>
                                        <th className="px-4 py-3 text-left">Period</th>
                                        <th className="px-4 py-3 text-left">Amount</th>
                                        <th className="px-4 py-3 text-left">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {billing.map(b => (
                                        <tr key={b.id}>
                                            <td className="px-4 py-3 text-gray-500">{new Date(b.created_at || '').toLocaleDateString()}</td>
                                            <td className="px-4 py-3 text-sm">{b.start_date} - {b.end_date}</td>
                                            <td className="px-4 py-3 font-medium">₹{b.amount}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${b.is_paid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {b.is_paid ? 'Paid' : 'Unpaid'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {billing.length === 0 && (
                                        <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500">No billing history found</td></tr>
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
