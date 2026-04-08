import { Plus, Trash2, ExternalLink, RefreshCcw, X, Upload } from 'lucide-react';
import { Banner } from '@/types/admin';
import { useAuth } from '@/context/AuthContext';
import { API_BASE_URL } from '@/config/apiConfig';
import { useEffect, useMemo, useState } from 'react';

interface BannersTabProps {
    banners: Banner[];
}

const BANNER_SECTION_OPTIONS = [
    { value: 'home_hero', label: 'Homepage Hero' },
    { value: 'category_hero', label: 'Category Page Hero' },
    { value: 'promo', label: 'Promo / Campaign' },
    { value: 'general', label: 'General' },
] as const;

type BannerSection = (typeof BANNER_SECTION_OPTIONS)[number]['value'];

const initialFormState = {
    title: '',
    link: '',
    section: 'home_hero' as BannerSection,
    is_active: true,
};

export default function BannersTab({ banners: initialBanners }: BannersTabProps) {
    const { hasPermission, token } = useAuth();
    const canAdd = hasPermission('add_banner');
    const canDelete = hasPermission('delete_banner');
    const canEdit = hasPermission('change_banner');

    const [banners, setBanners] = useState<Banner[]>(initialBanners);
    const [loading, setLoading] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [formData, setFormData] = useState(initialFormState);
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    useEffect(() => {
        setBanners(initialBanners);
    }, [initialBanners]);

    useEffect(() => {
        if (!selectedImage) {
            setImagePreview(null);
            return;
        }

        const objectUrl = URL.createObjectURL(selectedImage);
        setImagePreview(objectUrl);

        return () => URL.revokeObjectURL(objectUrl);
    }, [selectedImage]);

    const groupedBanners = useMemo(() => {
        return BANNER_SECTION_OPTIONS.map((section) => ({
            ...section,
            items: banners.filter((banner) => banner.section === section.value),
        }));
    }, [banners]);

    const resetForm = () => {
        setFormData(initialFormState);
        setSelectedImage(null);
        setImagePreview(null);
    };

    const fetchBanners = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/admin/banners/`, {
                headers: { Authorization: `Bearer ${token}` },
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

        if (!selectedImage) {
            alert('Please upload a banner image.');
            return;
        }

        try {
            const payload = new FormData();
            payload.append('title', formData.title);
            payload.append('section', formData.section);
            payload.append('image', selectedImage);
            payload.append('is_active', String(formData.is_active));
            if (formData.link.trim()) {
                payload.append('link', formData.link.trim());
            }

            const res = await fetch(`${API_BASE_URL}/admin/banners/`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: payload,
            });

            if (res.ok) {
                setShowAddModal(false);
                resetForm();
                fetchBanners();
            } else {
                const errorData = await res.json().catch(() => ({}));
                alert(`Failed to add banner: ${JSON.stringify(errorData)}`);
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
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                setBanners(banners.filter((banner) => banner.id !== id));
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
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ is_active: !banner.is_active }),
            });
            if (res.ok) {
                setBanners(banners.map((item) => (
                    item.id === banner.id ? { ...item, is_active: !item.is_active } : item
                )));
            }
        } catch (error) {
            console.error('Error toggling banner:', error);
        }
    };

    return (
        <div className="animate-fade-in">
            <div className="mb-6 flex items-center justify-between">
                <h1 className="font-display text-2xl font-bold text-white">Banners</h1>
                <div className="flex gap-2">
                    <button
                        onClick={fetchBanners}
                        className="rounded-lg border border-dark-600 p-2 text-silver-400 transition-colors hover:bg-dark-700 hover:text-white"
                        title="Refresh"
                    >
                        <RefreshCcw size={18} />
                    </button>
                    {canAdd && (
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="btn-primary flex items-center gap-2 shadow-lg shadow-accent-500/20"
                        >
                            <Plus size={18} /> Add Banner
                        </button>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="flex h-64 items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-accent-500"></div>
                </div>
            ) : (
                <div className="space-y-8">
                    {groupedBanners.map((section) => (
                        <div key={section.value}>
                            <div className="mb-4 flex items-center justify-between">
                                <div>
                                    <h2 className="text-lg font-semibold text-white">{section.label}</h2>
                                    <p className="text-sm text-silver-500">{section.items.length} banner(s)</p>
                                </div>
                            </div>

                            {section.items.length === 0 ? (
                                <div className="rounded-2xl border border-dark-700 bg-dark-800 p-8 text-center text-silver-500 shadow-sm">
                                    No banners in this section.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                                    {section.items.map((banner) => (
                                        <div
                                            key={banner.id}
                                            className="group overflow-hidden rounded-2xl border border-dark-700 bg-dark-800 shadow-sm transition-all hover:border-dark-600"
                                        >
                                            <div className="relative h-48 bg-dark-900">
                                                <img
                                                    src={banner.image || 'https://placehold.co/600x400?text=No+Image'}
                                                    alt={banner.title}
                                                    className="h-full w-full object-cover"
                                                />
                                                {canDelete && (
                                                    <div className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100">
                                                        <button
                                                            onClick={() => handleDelete(banner.id)}
                                                            className="rounded-full border border-dark-600 bg-dark-800/90 p-2 text-red-500 shadow-md backdrop-blur-sm hover:bg-red-500/10"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                )}
                                                <div className="absolute bottom-2 left-2 flex gap-2">
                                                    <span className="rounded-md border border-dark-600 bg-dark-800/85 px-2 py-1 text-xs font-bold text-silver-200 backdrop-blur-sm">
                                                        {banner.section_display || section.label}
                                                    </span>
                                                    {canEdit ? (
                                                        <button
                                                            onClick={() => handleToggleActive(banner)}
                                                            className={`rounded-md border px-2 py-1 text-xs font-bold transition-all ${
                                                                banner.is_active
                                                                    ? 'border-green-500/20 bg-green-500/10 text-green-500 hover:bg-green-500/20'
                                                                    : 'border-dark-600 bg-dark-700/80 text-silver-400 hover:text-white'
                                                            }`}
                                                        >
                                                            {banner.is_active ? 'Active' : 'Inactive'}
                                                        </button>
                                                    ) : (
                                                        <span
                                                            className={`rounded-md border px-2 py-1 text-xs font-bold ${
                                                                banner.is_active
                                                                    ? 'border-green-500/20 bg-green-500/10 text-green-500'
                                                                    : 'border-dark-600 bg-dark-700/80 text-silver-400'
                                                            }`}
                                                        >
                                                            {banner.is_active ? 'Active' : 'Inactive'}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="p-4">
                                                <h3 className="mb-1 font-bold text-white">{banner.title}</h3>
                                                {banner.link && (
                                                    <a
                                                        href={banner.link}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="flex items-center gap-1 text-sm text-accent-500 hover:text-accent-400 hover:underline"
                                                    >
                                                        <ExternalLink size={14} /> {banner.link}
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-2xl border border-dark-700 bg-dark-800 p-6 shadow-2xl">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-white">Add New Banner</h2>
                            <button
                                onClick={() => {
                                    setShowAddModal(false);
                                    resetForm();
                                }}
                                className="text-silver-500 transition-colors hover:text-white"
                            >
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleAddBanner} className="space-y-4">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-silver-300">Title</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full rounded-lg border border-dark-600 bg-dark-700 px-4 py-2 text-white outline-none placeholder-silver-600 focus:border-transparent focus:ring-2 focus:ring-accent-500"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-silver-300">Section</label>
                                <select
                                    value={formData.section}
                                    onChange={(e) => setFormData({ ...formData, section: e.target.value as BannerSection })}
                                    className="w-full rounded-lg border border-dark-600 bg-dark-700 px-4 py-2 text-white outline-none focus:border-transparent focus:ring-2 focus:ring-accent-500"
                                >
                                    {BANNER_SECTION_OPTIONS.map((section) => (
                                        <option key={section.value} value={section.value}>
                                            {section.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-silver-300">Banner Image</label>
                                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-dark-500 bg-dark-700 px-4 py-4 text-sm text-silver-300 transition-colors hover:border-accent-500 hover:text-white">
                                    <Upload size={18} />
                                    <span>{selectedImage ? selectedImage.name : 'Upload banner image'}</span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => setSelectedImage(e.target.files?.[0] ?? null)}
                                    />
                                </label>
                                {imagePreview ? (
                                    <div className="mt-3 overflow-hidden rounded-xl border border-dark-600 bg-dark-900">
                                        <img src={imagePreview} alt="Banner preview" className="h-40 w-full object-cover" />
                                    </div>
                                ) : null}
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-silver-300">Link (Optional)</label>
                                <input
                                    type="text"
                                    value={formData.link}
                                    onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                                    className="w-full rounded-lg border border-dark-600 bg-dark-700 px-4 py-2 text-white outline-none placeholder-silver-600 focus:border-transparent focus:ring-2 focus:ring-accent-500"
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    checked={formData.is_active}
                                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                    className="h-4 w-4 rounded border-dark-600 bg-dark-700 text-accent-600 focus:ring-accent-500"
                                />
                                <label htmlFor="is_active" className="text-sm font-medium text-silver-300">
                                    Active
                                </label>
                            </div>

                            <div className="flex gap-2 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowAddModal(false);
                                        resetForm();
                                    }}
                                    className="flex-1 rounded-lg border border-dark-600 px-4 py-2 text-silver-400 transition-colors hover:bg-dark-700 hover:text-white"
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary flex-1 shadow-lg shadow-accent-500/20">
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
