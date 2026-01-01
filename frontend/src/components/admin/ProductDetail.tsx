import { useState } from 'react';
import { Product } from '@/types/admin';
import { ArrowLeft, Edit, Trash2, Package, ShoppingBag, Tag, Calendar, Layers, Activity, Star, Info } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface ProductDetailProps {
    product: Product;
    onBack: () => void;
    onEdit: (product: Product) => void;
}

export default function ProductDetail({ product, onBack, onEdit }: ProductDetailProps) {
    const { hasPermission } = useAuth();
    const [activeImage, setActiveImage] = useState(product.image || '');

    const canEdit = hasPermission('change_product');
    const canDelete = hasPermission('delete_product');

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

    return (
        <div className="animate-fade-in space-y-6">
            {/* Header / Navigation */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between gap-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
                        title="Back to products"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold uppercase tracking-wider text-primary-600 bg-primary-50 px-2 py-0.5 rounded">Product SKU: {product.sku || 'N/A'}</span>
                            {product.is_featured && (
                                <span className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                                    <Star size={12} fill="currentColor" /> Featured
                                </span>
                            )}
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {canEdit && (
                        <button
                            onClick={() => onEdit(product)}
                            className="bg-white border border-gray-200 text-gray-700 font-bold px-4 py-2 rounded-xl hover:bg-gray-50 flex items-center gap-2 shadow-sm transition-all"
                        >
                            <Edit size={18} /> Edit Product
                        </button>
                    )}
                    {canDelete && (
                        <button className="bg-white border border-red-100 text-red-600 font-bold px-4 py-2 rounded-xl hover:bg-red-50 flex items-center gap-2 shadow-sm transition-all">
                            <Trash2 size={18} /> Delete
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Visuals */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100">
                        <div className="aspect-square bg-gray-50 rounded-2xl overflow-hidden mb-4 border border-gray-100 flex items-center justify-center">
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
                                        className={`aspect-square rounded-lg border-2 transition-all overflow-hidden ${activeImage === img ? 'border-primary-500 ring-2 ring-primary-100' : 'border-transparent opacity-70 hover:opacity-100'}`}
                                    >
                                        <img src={img} alt={`${product.name} ${idx}`} className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Info size={18} className="text-primary-500" /> Quick Status
                        </h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500">Visibility</span>
                                <span className={`px-2 py-0.5 rounded-full font-bold text-xs ${product.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {product.is_active ? 'Public' : 'Hidden'}
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500">Stock Availability</span>
                                <span className={`px-2 py-0.5 rounded-full font-bold text-xs ${product.stock > 10 ? 'bg-green-100 text-green-700' : product.stock > 0 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                                    {product.stock > 0 ? `${product.stock} in stock` : 'Out of Stock'}
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500">Commission Rate</span>
                                <span className="font-bold text-gray-900">{product.commission_rate}%</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Details & Metadata */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Pricing Card */}
                    <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary-50/50 rounded-bl-full -mr-8 -mt-8 -z-0" />

                        <div className="relative z-10">
                            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">Pricing Information</h2>
                            <div className="flex items-end gap-3 mb-4">
                                <div className="text-4xl font-extrabold text-gray-900">{formatPrice(product.current_price)}</div>
                                {product.sale_price && (
                                    <div className="text-xl text-gray-400 line-through mb-1">{formatPrice(product.price)}</div>
                                )}
                                {product.discount_percent && (
                                    <div className="bg-red-500 text-white px-2 py-0.5 rounded-lg text-xs font-bold mb-1.5 animate-pulse">
                                        {product.discount_percent}% OFF
                                    </div>
                                )}
                            </div>
                            <p className="text-gray-500 text-sm italic">
                                * Final price shown above includes all current active discounts.
                            </p>
                        </div>
                    </div>

                    {/* Meta Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                            <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <Layers size={18} className="text-primary-500" /> Structure
                            </h3>
                            <div className="space-y-6">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-gray-50 rounded-xl text-gray-400">
                                        <ShoppingBag size={20} />
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-400 font-bold uppercase">Vendor/Shop</div>
                                        <div className="text-gray-900 font-bold">{product.shop_name}</div>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-gray-50 rounded-xl text-gray-400">
                                        <Tag size={20} />
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-400 font-bold uppercase">Department/Category</div>
                                        <div className="text-gray-900 font-bold">{product.category_name || 'Uncategorized'}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                            <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <Activity size={18} className="text-primary-500" /> History
                            </h3>
                            <div className="space-y-6">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-gray-50 rounded-xl text-gray-400">
                                        <Calendar size={20} />
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-400 font-bold uppercase">Added On</div>
                                        <div className="text-gray-900 font-bold">{formatDate(product.created_at)}</div>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-gray-50 rounded-xl text-gray-400">
                                        <Package size={20} />
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-400 font-bold uppercase">Product Identifier</div>
                                        <div className="text-gray-900 font-mono font-bold">{product.sku || 'N/A'}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Description Section */}
                    <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                        <h3 className="font-bold text-gray-900 mb-4">Description</h3>
                        <div className="prose prose-sm max-w-none text-gray-600 leading-relaxed whitespace-pre-wrap">
                            {product.description || 'No description provided for this product.'}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
