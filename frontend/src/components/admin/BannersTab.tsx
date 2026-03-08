import { Plus, Trash2, ExternalLink, RefreshCcw, X } from 'lucide-react';
import { Banner } from '@/types/admin';
import { useAuth } from '@/context/AuthContext';
import { API_BASE_URL } from '@/config/apiConfig';
import { useState, useEffect } from 'react';

interface BannersTabProps {
    banners: Banner[];
}

export default function BannersTab({ banners: initialBanners }: BannersTabProps) {
    const { hasPermission, token } = useAuth();
    const canAdd = hasPermission('add_banner');
    const canDelete = hasPermission('delete_banner');
    const canEdit = hasPermission('change_banner');

    const [banners, setBanners] = useState<Banner[]>(initialBanners);
    const [loading, setLoading] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        link: '',
        image: '',
        is_active: true
    });

    useEffect(() => {
        setBanners(initialBanners);
    }, [initialBanners]);

    const fetchBanners = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/admin/banners/`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setBanners(data.results || data);
            }
        } catch (error) {
            console.error('Error fetching banners:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddBanner = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_BASE_URL}/admin/banners/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                setShowAddModal(false);
                setFormData({ title: '', link: '', image: '', is_active: true });
                fetchBanners();
            } else {
                alert('Failed to add banner');
            }
        } catch (error) {
            console.error('Error adding banner:', error);
            alert('Error adding banner');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this banner?')) return;

        try {
            const res = await fetch(`${API_BASE_URL}/admin/banners/${id}/`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setBanners(banners.filter(b => b.id !== id));
            } else {
                alert('Failed to delete banner');
            }
        } catch (error) {
            console.error('Error deleting banner:', error);
        }
    };

    const handleToggleActive = async (banner: Banner) => {
        try {
            const res = await fetch(`${API_BASE_URL}/admin/banners/${banner.id}/`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ is_active: !banner.is_active })
            });
            if (res.ok) {
                setBanners(banners.map(b =>
                    b.id === banner.id ? { ...b, is_active: !b.is_active } : b
                ));
            }
        } catch (error) {
            console.error('Error toggling banner:', error);
        }
    };

    return (
        <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <h1 className="font-display text-2xl font-bold text-white">Banners</h1>
                <div className="flex gap-2">
                    <button
                        onClick={fetchBanners}
                        className="p-2 border border-dark-600 rounded-lg hover:bg-dark-700 text-silver-400 hover:text-white transition-colors"
                        title="Refresh"
                    >
                        <RefreshCcw size={18} />
                    </button>
                    {canAdd && (
                        <button onClick={() => setShowAddModal(true)} className="btn-primary flex items-center gap-2 shadow-lg shadow-accent-500/20">
                            <Plus size={18} /> Add Banner
                        </button>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-500"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {banners.length === 0 ? (
                        <div className="col-span-full bg-dark-800 rounded-2xl p-12 text-center text-silver-500 shadow-sm border border-dark-700">
                            No banners found. Add one to get started.
                        </div>
                    ) : (
                        banners.map((banner) => (
                            <div key={banner.id} className="bg-dark-800 rounded-2xl shadow-sm overflow-hidden group border border-dark-700 hover:border-dark-600 transition-all">
                                <div className="relative h-48 bg-dark-900">
                                    <img
                                        src={banner.image || "https://placehold.co/600x400?text=No+Image"}
                                        alt={banner.title}
                                        className="w-full h-full object-cover"
                                    />
                                    {canDelete && (
                                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleDelete(banner.id)}
                                                className="p-2 bg-dark-800/90 rounded-full text-red-500 shadow-md hover:bg-red-500/10 backdrop-blur-sm border border-dark-600"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    )}
                                    <div className="absolute bottom-2 left-2">
                                        {canEdit ? (
                                            <button
                                                onClick={() => handleToggleActive(banner)}
                                                className={`px-2 py-1 rounded-md text-xs font-bold transition-all border ${banner.is_active ? 'bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20' : 'bg-dark-700/80 text-silver-400 border-dark-600 hover:text-white'}`}
                                            >
                                                {banner.is_active ? 'Active' : 'Inactive'}
                                            </button>
                                        ) : (
                                            <span className={`px-2 py-1 rounded-md text-xs font-bold border ${banner.is_active ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-dark-700/80 text-silver-400 border-dark-600'}`}>
                                                {banner.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="p-4">
                                    <h3 className="font-bold text-white mb-1">{banner.title}</h3>
                                    {banner.link && (
                                        <a href={banner.link} target="_blank" rel="noreferrer" className="text-sm text-accent-500 flex items-center gap-1 hover:underline hover:text-accent-400">
                                            <ExternalLink size={14} /> {banner.link}
                                        </a>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Add Banner Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-dark-800 rounded-2xl p-6 max-w-md w-full border border-dark-700 shadow-2xl">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-white">Add New Banner</h2>
                            <button onClick={() => setShowAddModal(false)} className="text-silver-500 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleAddBanner} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-silver-300 mb-1">Title</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-4 py-2 border border-dark-600 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent outline-none bg-dark-700 text-white placeholder-silver-600"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-silver-300 mb-1">Image URL</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.image}
                                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                                    className="w-full px-4 py-2 border border-dark-600 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent outline-none bg-dark-700 text-white placeholder-silver-600"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-silver-300 mb-1">Link (Optional)</label>
                                <input
                                    type="text"
                                    value={formData.link}
                                    onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                                    className="w-full px-4 py-2 border border-dark-600 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent outline-none bg-dark-700 text-white placeholder-silver-600"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    checked={formData.is_active}
                                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                    className="w-4 h-4 text-accent-600 border-dark-600 rounded focus:ring-accent-500 bg-dark-700"
                                />
                                <label htmlFor="is_active" className="text-sm font-medium text-silver-300">Active</label>
                            </div>
                            <div className="flex gap-2 pt-4">
                                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-2 border border-dark-600 text-silver-400 rounded-lg hover:bg-dark-700 hover:text-white transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" className="flex-1 btn-primary shadow-lg shadow-accent-500/20">
                                    Add Banner
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
