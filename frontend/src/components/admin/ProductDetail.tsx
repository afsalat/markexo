import { useState } from 'react';
import { Product } from '@/types/admin';
import { ArrowLeft, Edit, Trash2, Package, ShoppingBag, Tag, Calendar, Layers, Activity, Star, Info, Link as LinkIcon } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface ProductDetailProps {
    product: Product;
    onBack: () => void;
    onEdit: (product: Product) => void;
    onDelete?: (id: number) => void;
}

export default function ProductDetail({ product, onBack, onEdit, onDelete }: ProductDetailProps) {
    const { hasPermission } = useAuth();
    const [activeImage, setActiveImage] = useState(product.image || '');

    const canEdit = hasPermission('change_product');
    const canDelete = hasPermission('delete_product');

    const handleDelete = () => {
        if (confirm(`Are you sure you want to delete "${product.name}"?`)) {
            if (onDelete) {
                onDelete(product.id);
            }
        }
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
        }).format(price);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // All images (primary and secondary)
    const allImages = [
        ...(product.image ? [product.image] : []),
        ...(product.images ? product.images.map(img => img.image) : [])
    ];

    const [activeTab, setActiveTab] = useState<'overview' | 'performance'>('overview');

    return (
        <div className="animate-fade-in space-y-6">
            {/* Header / Navigation */}
            <div className="bg-dark-800 rounded-2xl p-6 shadow-sm border border-dark-700 flex flex-col md:flex-row justify-between gap-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="p-2 text-silver-500 hover:text-white hover:bg-dark-700 rounded-xl transition-all"
                        title="Back to products"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold uppercase tracking-wider text-accent-500 bg-accent-500/10 px-2 py-0.5 rounded border border-accent-500/20">Product SKU: {product.sku || 'N/A'}</span>
                            {product.is_featured && (
                                <span className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                                    <Star size={12} fill="currentColor" /> Featured
                                </span>
                            )}
                        </div>
                        <h1 className="text-2xl font-bold text-white">{product.name}</h1>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {canEdit && (
                        <button
                            onClick={() => onEdit(product)}
                            className="bg-dark-700 border border-dark-600 text-silver-300 font-bold px-4 py-2 rounded-xl hover:bg-dark-600 hover:text-white flex items-center gap-2 shadow-sm transition-all"
                        >
                            <Edit size={18} /> Edit Product
                        </button>
                    )}
                    {canDelete && (
                        <button
                            onClick={handleDelete}
                            className="bg-dark-700 border border-red-500/20 text-red-500 font-bold px-4 py-2 rounded-xl hover:bg-red-500/10 flex items-center gap-2 shadow-sm transition-all"
                        >
                            <Trash2 size={18} /> Delete
                        </button>
                    )}
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-dark-700">
                <button
                    onClick={() => setActiveTab('overview')}
                    className={`px-6 py-3 text-sm font-bold border-b-2 transition-all ${activeTab === 'overview'
                        ? 'border-accent-500 text-accent-500'
                        : 'border-transparent text-silver-500 hover:text-white'
                        }`}
                >
                    Overview
                </button>
                <button
                    onClick={() => setActiveTab('performance')}
                    className={`px-6 py-3 text-sm font-bold border-b-2 transition-all ${activeTab === 'performance'
                        ? 'border-accent-500 text-accent-500'
                        : 'border-transparent text-silver-500 hover:text-white'
                        }`}
                >
                    Performance
                </button>
            </div>

            {activeTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
                    {/* Left Column: Visuals */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-dark-800 rounded-3xl p-4 shadow-sm border border-dark-700">
                            <div className="aspect-square bg-dark-900 rounded-2xl overflow-hidden mb-4 border border-dark-700 flex items-center justify-center">
                                {activeImage ? (
                                    <img src={activeImage} alt={product.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="text-8xl">📦</div>
                                )}
                            </div>

                            {allImages.length > 1 && (
                                <div className="grid grid-cols-4 gap-2">
                                    {allImages.map((img, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setActiveImage(img)}
                                            className={`aspect-square rounded-lg border-2 transition-all overflow-hidden ${activeImage === img ? 'border-accent-500 ring-2 ring-accent-500/20' : 'border-transparent opacity-70 hover:opacity-100'}`}
                                        >
                                            <img src={img} alt={`${product.name} ${idx}`} className="w-full h-full object-cover" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="bg-dark-800 rounded-3xl p-6 shadow-sm border border-dark-700">
                            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                                <Info size={18} className="text-accent-500" /> Quick Status
                            </h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-silver-500">Visibility</span>
                                    <span className={`px-2 py-0.5 rounded-full font-bold text-xs ${product.is_active ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                                        {product.is_active ? 'Public' : 'Hidden'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-silver-500">Stock Availability</span>
                                    <span className={`px-2 py-0.5 rounded-full font-bold text-xs ${product.stock > 10 ? 'bg-green-500/10 text-green-500 border border-green-500/20' : product.stock > 0 ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                                        {product.stock > 0 ? `${product.stock} in stock` : 'Out of Stock'}
                                    </span>
                                </div>
                                {product.profit_margin && (
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-silver-500">Profit Margin</span>
                                        <span className="font-bold text-green-500">₹{Number(product.profit_margin).toFixed(2)}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Details & Metadata */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Pricing Card */}
                        <div className="bg-dark-800 rounded-3xl p-8 shadow-sm border border-dark-700 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-accent-500/10 rounded-bl-full -mr-8 -mt-8 -z-0" />

                            <div className="relative z-10">
                                <h2 className="text-sm font-bold text-silver-500 uppercase tracking-widest mb-2">Pricing Information</h2>
                                <div className="flex items-end gap-3 mb-4">
                                    <div className="text-4xl font-extrabold text-white">{formatPrice(product.current_price)}</div>
                                    {product.sale_price && (
                                        <div className="text-xl text-silver-500 line-through mb-1">{formatPrice(product.price)}</div>
                                    )}
                                    {product.discount_percent && (
                                        <div className="bg-red-500 text-white px-2 py-0.5 rounded-lg text-xs font-bold mb-1.5 animate-pulse">
                                            {product.discount_percent}% OFF
                                        </div>
                                    )}
                                </div>
                                <p className="text-silver-500 text-sm italic">
                                    * Final price shown above includes all current active discounts.
                                </p>
                            </div>
                        </div>

                        {/* Meta Info Grid */}
                        <div className="bg-dark-800 rounded-3xl p-6 shadow-sm border border-dark-700">
                            <h3 className="font-bold text-white mb-6 flex items-center gap-2">
                                <Layers size={18} className="text-accent-500" /> Structure
                            </h3>
                            <div className="space-y-6">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-dark-700 rounded-xl text-silver-400">
                                        <ShoppingBag size={20} />
                                    </div>
                                    <div>
                                        <div className="text-xs text-silver-500 font-bold uppercase">Vendor/Shop</div>
                                        <div className="text-white font-bold">{product.shop_name}</div>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-dark-700 rounded-xl text-silver-400">
                                        <Tag size={20} />
                                    </div>
                                    <div>
                                        <div className="text-xs text-silver-500 font-bold uppercase">Department/Category</div>
                                        <div className="text-white font-bold">{product.category_name || 'Uncategorized'}</div>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-dark-700 rounded-xl text-silver-400">
                                        <Activity size={20} />
                                    </div>
                                    <div>
                                        <div className="text-xs text-silver-500 font-bold uppercase">Created By</div>
                                        <div className="text-white font-bold">{product.created_by_name || 'System Admin'}</div>
                                        <div className="text-xs text-silver-500">{product.created_by_email}</div>
                                    </div>
                                </div>
                                {product.meesho_url && (
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-dark-700 rounded-xl text-silver-400">
                                            <LinkIcon size={20} />
                                        </div>
                                        <div className="overflow-hidden">
                                            <div className="text-xs text-silver-500 font-bold uppercase">Source URL</div>
                                            <a
                                                href={product.meesho_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-accent-500 font-bold hover:underline truncate block"
                                            >
                                                Open Link
                                            </a>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Description Section */}
                        <div className="bg-dark-800 rounded-3xl p-8 shadow-sm border border-dark-700">
                            <h3 className="font-bold text-white mb-4">Description</h3>
                            <div className="prose prose-sm max-w-none text-silver-400 leading-relaxed whitespace-pre-wrap">
                                {product.description || 'No description provided for this product.'}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'performance' && (
                <div className="animate-fade-in grid grid-cols-1 gap-6">
                    <div className="bg-dark-800 rounded-3xl p-6 shadow-sm border border-dark-700">
                        <h3 className="font-bold text-white mb-6 flex items-center gap-2">
                            <Activity size={18} className="text-accent-500" /> Performance
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="bg-dark-900/50 p-6 rounded-2xl border border-dark-700/50 flex flex-col items-center justify-center text-center">
                                <div className="p-3 bg-dark-800 rounded-full mb-3 text-silver-400">
                                    <Activity size={24} />
                                </div>
                                <div className="text-xs text-silver-500 font-bold uppercase mb-1">Total Views</div>
                                <div className="text-3xl font-bold text-white">
                                    {product.views || 0}
                                </div>
                                <div className="text-xs text-silver-600 font-medium mt-1">Product Page Visits</div>
                            </div>

                            <div className="bg-dark-900/50 p-6 rounded-2xl border border-dark-700/50 flex flex-col items-center justify-center text-center">
                                <div className="p-3 bg-dark-800 rounded-full mb-3 text-emerald-500">
                                    <ShoppingBag size={24} />
                                </div>
                                <div className="text-xs text-silver-500 font-bold uppercase mb-1">Total Sales</div>
                                <div className="text-3xl font-bold text-white">
                                    {product.sold_count || 0}
                                </div>
                                <div className="text-xs text-silver-600 font-medium mt-1">Units Sold</div>
                            </div>

                            <div className="bg-dark-900/50 p-6 rounded-2xl border border-dark-700/50 flex flex-col items-center justify-center text-center md:col-span-2 lg:col-span-1">
                                <div className="p-3 bg-dark-800 rounded-full mb-3 text-accent-500">
                                    <Layers size={24} />
                                </div>
                                <div className="text-xs text-silver-500 font-bold uppercase mb-1">Conversion Rate</div>
                                <div className="text-3xl font-bold text-accent-500">
                                    {((product.sold_count || 0) / (product.views || 1) * 100).toFixed(1)}%
                                </div>
                                <div className="w-full max-w-[150px] bg-dark-700 rounded-full h-2 mt-3 overflow-hidden">
                                    <div
                                        className="bg-accent-500 h-full rounded-full"
                                        style={{ width: `${Math.min(((product.sold_count || 0) / (product.views || 1) * 100), 100)}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
