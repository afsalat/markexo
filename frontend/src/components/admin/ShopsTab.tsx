import { Search, Plus, MapPin, Phone, Mail, Globe, CheckCircle, X, Edit, Trash2, ShieldCheck, ShoppingBag, Store, Filter, RefreshCcw, ExternalLink, Save } from 'lucide-react';
import { Shop } from '@/types/admin';
import { useState } from 'react';
import ShopDetail from './ShopDetail';
import { useAuth } from '@/context/AuthContext';
import { API_BASE_URL } from '@/config/apiConfig';

interface ShopsTabProps {
    shops: Shop[];
    onRefresh?: () => void;
}

export default function ShopsTab({ shops, onRefresh }: ShopsTabProps) {
    const { token, hasPermission } = useAuth();
    const canAdd = hasPermission('add_shop');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        city: '',
        address: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL} /admin/shops / `, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token} `
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                setIsModalOpen(false);
                setFormData({
                    name: '',
                    email: '',
                    phone: '',
                    city: '',
                    address: ''
                });
                if (onRefresh) onRefresh();
            } else {
                console.error('Failed to create shop');
                alert('Failed to create shop. Please try again.');
            }
        } catch (error) {
            console.error('Error creating shop:', error);
            alert('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };



    const [selectedShop, setSelectedShop] = useState<Shop | null>(null);

    if (selectedShop) {
        return <ShopDetail shop={selectedShop} onBack={() => setSelectedShop(null)} />;
    }

    return (
        <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <h1 className="font-display text-2xl font-bold text-white">Partner Shops</h1>
                {canAdd && (
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="btn-primary flex items-center gap-2 shadow-lg shadow-accent-500/20"
                    >
                        <Plus size={18} /> Add Shop
                    </button>
                )}
            </div>

            <div className="bg-dark-800 rounded-2xl shadow-sm overflow-hidden border border-dark-700">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-dark-900/50 border-b border-dark-700">
                            <tr>
                                <th className="text-left px-6 py-4 text-xs font-medium text-silver-500 uppercase">Shop Info</th>
                                <th className="text-left px-6 py-4 text-xs font-medium text-silver-500 uppercase">Contact</th>
                                <th className="text-left px-6 py-4 text-xs font-medium text-silver-500 uppercase">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-dark-700">
                            {shops.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="px-6 py-8 text-center text-silver-500">
                                        No shops found. Add one to get started.
                                    </td>
                                </tr>
                            ) : (
                                shops.map((shop) => (
                                    <tr
                                        key={shop.id}
                                        onClick={() => setSelectedShop(shop)}
                                        className="hover:bg-dark-700/50 cursor-pointer transition-colors"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-accent-500/10 text-accent-500 border border-accent-500/20 rounded-lg flex items-center justify-center font-bold">
                                                    {shop.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-white">{shop.name}</p>
                                                    <p className="text-xs text-silver-500">{shop.city}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1 text-sm text-silver-400">
                                                <div>{shop.phone}</div>
                                                <div>{shop.email}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${shop.is_active ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-dark-700 text-silver-400 border-dark-600'} `}>
                                                {shop.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Shop Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-dark-800 rounded-2xl w-full max-w-lg shadow-2xl animate-scale-in border border-dark-700">
                        <div className="flex justify-between items-center p-6 border-b border-dark-700">
                            <h2 className="text-xl font-bold text-white">Add New Shop</h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-silver-500 hover:text-white transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-silver-300 mb-1">Shop Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    required
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-dark-600 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent outline-none bg-dark-700 text-white placeholder-silver-600"
                                    placeholder="e.g. Fresh Mart"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-silver-300 mb-1">Phone</label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        required
                                        value={formData.phone}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-dark-600 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent outline-none bg-dark-700 text-white placeholder-silver-600"
                                        placeholder="+91..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-silver-300 mb-1">Email</label>
                                    <input
                                        type="email"
                                        name="email"
                                        required
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-dark-600 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent outline-none bg-dark-700 text-white placeholder-silver-600"
                                        placeholder="shop@example.com"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-silver-300 mb-1">City</label>
                                <input
                                    type="text"
                                    name="city"
                                    required
                                    value={formData.city}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-dark-600 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent outline-none bg-dark-700 text-white placeholder-silver-600"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-silver-300 mb-1">Address</label>
                                <textarea
                                    name="address"
                                    required
                                    value={formData.address}
                                    onChange={handleChange}
                                    rows={3}
                                    className="w-full px-4 py-2 border border-dark-600 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent outline-none resize-none bg-dark-700 text-white placeholder-silver-600"
                                    placeholder="Full shop address..."
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-silver-400 hover:bg-dark-700 hover:text-white rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="btn-primary flex items-center gap-2 shadow-lg shadow-accent-500/20"
                                >
                                    {loading ? 'Creating...' : (
                                        <>
                                            <Save size={18} /> Create Shop
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
