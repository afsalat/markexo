import { useEffect, useMemo, useState } from 'react';
import { Product, StockLog } from '@/types/admin';
import { ArrowLeft, Edit, Trash2, Package, ShoppingBag, Tag, Calendar, Layers, Activity, Star, Info, Link as LinkIcon, Plus, AlertTriangle, CheckCircle2, History, TrendingUp, TrendingDown, RefreshCcw, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { API_BASE_URL } from '@/config/apiConfig';

interface ProductDetailProps {
    product: Product;
    onBack: () => void;
    onEdit: (product: Product) => void;
    onDelete?: (id: number) => void;
}

const DESCRIPTION_TAGS = new Set([
    'A', 'BLOCKQUOTE', 'BR', 'CODE', 'EM', 'H2', 'H3', 'H4', 'LI', 'OL', 'P', 'PRE', 'STRONG', 'UL'
]);

const DESCRIPTION_BLOCKED_TAGS = new Set([
    'BUTTON', 'EMBED', 'FORM', 'IFRAME', 'INPUT', 'LINK', 'MATH', 'META', 'OBJECT', 'SCRIPT', 'STYLE', 'SVG', 'TEMPLATE'
]);

function sanitizeDescription(description: string) {
    const document = new DOMParser().parseFromString(description, 'text/html');

    document.body.querySelectorAll('*').forEach((element) => {
        if (DESCRIPTION_BLOCKED_TAGS.has(element.tagName)) {
            element.remove();
            return;
        }

        if (!DESCRIPTION_TAGS.has(element.tagName)) {
            element.replaceWith(...Array.from(element.childNodes));
            return;
        }

        const href = element.tagName === 'A' ? element.getAttribute('href') : null;
        Array.from(element.attributes).forEach((attribute) => element.removeAttribute(attribute.name));

        if (element.tagName === 'A' && href) {
            try {
                const url = new URL(href, window.location.origin);
                if (['http:', 'https:', 'mailto:', 'tel:'].includes(url.protocol)) {
                    element.setAttribute('href', href);
                    element.setAttribute('rel', 'noopener noreferrer');
                    if (url.protocol === 'http:' || url.protocol === 'https:') {
                        element.setAttribute('target', '_blank');
                    }
                }
            } catch {
                // Invalid links remain readable without a destination.
            }
        }
    });

    return document.body.innerHTML;
}

function ProductImagePlaceholder({ compact = false }: { compact?: boolean }) {
    return (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-dark-900 text-silver-500" aria-label="Product image unavailable">
            <Package size={compact ? 22 : 56} strokeWidth={1.5} aria-hidden="true" />
            {!compact && <span className="text-sm font-semibold">Image unavailable</span>}
        </div>
    );
}

function RichDescription({ description }: { description?: string | null }) {
    const content = description?.trim();
    const [sanitizedContent, setSanitizedContent] = useState<string | null>(null);

    useEffect(() => {
        setSanitizedContent(content ? sanitizeDescription(content) : null);
    }, [content]);

    if (!content) return <p>No description provided for this product.</p>;

    if (sanitizedContent === null) {
        return <p className="whitespace-pre-wrap">{content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()}</p>;
    }

    return <div dangerouslySetInnerHTML={{ __html: sanitizedContent }} />;
}

export default function ProductDetail({ product, onBack, onEdit, onDelete }: ProductDetailProps) {
    const { hasPermission, token } = useAuth();
    const allImages = useMemo(() => {
        const candidates = [product.image, ...(product.images?.map((image) => image.image) ?? [])];
        return Array.from(new Set(candidates.map((image) => image?.trim()).filter((image): image is string => Boolean(image))));
    }, [product.image, product.images]);
    const [activeImage, setActiveImage] = useState(allImages[0] || '');
    const [failedImages, setFailedImages] = useState<Set<string>>(() => new Set());

    const canEdit = hasPermission('change_product');
    const canDelete = hasPermission('delete_product');

    const [activeTab, setActiveTab] = useState<'overview' | 'performance' | 'stock'>('overview');
    const [currentStock, setCurrentStock] = useState<number>(product.stock ?? 0);
    const [stockLogs, setStockLogs] = useState<StockLog[]>([]);
    const [loadingStockLogs, setLoadingStockLogs] = useState(false);
    const [showStockEntryModal, setShowStockEntryModal] = useState(false);
    const [stockEntrySubmitting, setStockEntrySubmitting] = useState(false);
    const [entryForm, setEntryForm] = useState({
        change_type: 'manual_in' as 'manual_in' | 'manual_out' | 'adjustment',
        quantity: 1,
        target_stock: product.stock ?? 0,
        reference: '',
        note: '',
    });
    const [stockFeedback, setStockFeedback] = useState<string | null>(null);

    const fetchStockLogs = async () => {
        if (!token) return;
        setLoadingStockLogs(true);
        try {
            const res = await fetch(`${API_BASE_URL}/admin/products/${product.id}/stock-logs/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setStockLogs(Array.isArray(data) ? data : data.results || []);
            }
        } catch (err) {
            console.error('Failed to fetch stock logs:', err);
        } finally {
            setLoadingStockLogs(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'stock') {
            fetchStockLogs();
        }
    }, [activeTab, product.id, token]);

    const handleCreateStockEntry = async (e: React.FormEvent) => {
        e.preventDefault();
        setStockEntrySubmitting(true);
        try {
            const payload: any = {
                change_type: entryForm.change_type,
                reference: entryForm.reference || 'Manual Entry',
                note: entryForm.note,
            };
            if (entryForm.change_type === 'adjustment') {
                payload.target_stock = Number(entryForm.target_stock);
            } else {
                payload.quantity_change = Number(entryForm.quantity);
            }

            const res = await fetch(`${API_BASE_URL}/admin/products/${product.id}/stock-logs/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                const data = await res.json();
                if (typeof data.current_stock === 'number') {
                    setCurrentStock(data.current_stock);
                    product.stock = data.current_stock;
                }
                setShowStockEntryModal(false);
                setEntryForm({
                    change_type: 'manual_in',
                    quantity: 1,
                    target_stock: data.current_stock ?? currentStock,
                    reference: '',
                    note: '',
                });
                setStockFeedback('Stock entry recorded successfully!');
                setTimeout(() => setStockFeedback(null), 3500);
                fetchStockLogs();
            } else {
                const errData = await res.json().catch(() => ({}));
                alert(`Error saving stock entry: ${JSON.stringify(errData)}`);
            }
        } catch (err) {
            console.error('Error submitting stock entry:', err);
            alert('Error recording stock entry.');
        } finally {
            setStockEntrySubmitting(false);
        }
    };

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

    useEffect(() => {
        setActiveImage(allImages[0] || '');
        setFailedImages(new Set());
    }, [product.id, allImages]);

    const markImageFailed = (image: string) => {
        setFailedImages((current) => new Set(current).add(image));
    };

    return (
        <div className="animate-fade-in space-y-6">
            {/* Header / Navigation */}
            <div className="bg-dark-800 rounded-2xl p-6 shadow-sm border border-dark-700 flex flex-col md:flex-row justify-between gap-6">
                <div className="flex min-w-0 items-center gap-4">
                    <button
                        type="button"
                        onClick={onBack}
                        className="p-2 text-silver-500 hover:text-white hover:bg-dark-700 rounded-xl transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
                        title="Back to products"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="max-w-full break-words text-xs font-bold uppercase tracking-wider text-accent-500 bg-accent-500/10 px-2 py-0.5 rounded border border-accent-500/20">Product SKU: {product.sku || 'N/A'}</span>
                            {product.is_featured && (
                                <span className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                                    <Star size={12} fill="currentColor" /> Featured
                                </span>
                            )}
                            {currentStock <= 0 ? (
                                <span className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                                    <AlertTriangle size={12} /> Stock Out
                                </span>
                            ) : currentStock <= 5 ? (
                                <span className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                                    Only {currentStock} Left!
                                </span>
                            ) : (
                                <span className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                    <CheckCircle2 size={12} /> In Stock ({currentStock})
                                </span>
                            )}
                        </div>
                        <h1 className="break-words text-2xl font-bold text-white">{product.name}</h1>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {canEdit && (
                        <button
                            type="button"
                            onClick={() => onEdit(product)}
                            className="bg-dark-700 border border-dark-600 text-silver-300 font-bold px-4 py-2 rounded-xl hover:bg-dark-600 hover:text-white flex items-center gap-2 shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
                        >
                            <Edit size={18} /> Edit Product
                        </button>
                    )}
                    {canDelete && (
                        <button
                            type="button"
                            onClick={handleDelete}
                            className="bg-dark-700 border border-red-500/20 text-red-500 font-bold px-4 py-2 rounded-xl hover:bg-red-500/10 flex items-center gap-2 shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                        >
                            <Trash2 size={18} /> Delete
                        </button>
                    )}
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-dark-700">
                <button
                    type="button"
                    onClick={() => setActiveTab('overview')}
                    className={`px-6 py-3 text-sm font-bold border-b-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent-500 ${activeTab === 'overview'
                        ? 'border-accent-500 text-accent-500'
                        : 'border-transparent text-silver-500 hover:text-white'
                        }`}
                >
                    Overview
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('performance')}
                    className={`px-6 py-3 text-sm font-bold border-b-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent-500 ${activeTab === 'performance'
                        ? 'border-accent-500 text-accent-500'
                        : 'border-transparent text-silver-500 hover:text-white'
                        }`}
                >
                    Performance
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('stock')}
                    className={`flex items-center gap-2 px-6 py-3 text-sm font-bold border-b-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent-500 ${activeTab === 'stock'
                        ? 'border-accent-500 text-accent-500'
                        : 'border-transparent text-silver-500 hover:text-white'
                        }`}
                >
                    <Package size={16} />
                    Stock & Inventory
                    {currentStock <= 0 ? (
                        <span className="rounded-full bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 text-xs font-bold">
                            Stock Out
                        </span>
                    ) : currentStock <= 5 ? (
                        <span className="rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 text-xs font-bold">
                            Only {currentStock} left!
                        </span>
                    ) : (
                        <span className="rounded-full bg-dark-700 text-silver-400 px-2 py-0.5 text-xs">
                            {currentStock}
                        </span>
                    )}
                </button>
            </div>

            {activeTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 animate-fade-in">
                    {/* Left Column: Visuals */}
                    <div className="lg:col-span-2 min-w-0 space-y-6">
                        <div className="bg-dark-800 rounded-3xl p-4 shadow-sm border border-dark-700">
                            <div className="aspect-square max-h-[40rem] w-full bg-dark-900 rounded-2xl overflow-hidden mb-4 border border-dark-700 flex items-center justify-center">
                                {activeImage && !failedImages.has(activeImage) ? (
                                    <img
                                        src={activeImage}
                                        alt={`${product.name} product preview`}
                                        className="h-full w-full object-contain p-2 sm:p-4"
                                        onError={() => markImageFailed(activeImage)}
                                    />
                                ) : (
                                    <ProductImagePlaceholder />
                                )}
                            </div>

                            {allImages.length > 1 && (
                                <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Product image gallery">
                                    {allImages.map((img, idx) => (
                                        <button
                                            key={img}
                                            type="button"
                                            onClick={() => setActiveImage(img)}
                                            aria-label={`View product image ${idx + 1} of ${allImages.length}`}
                                            aria-pressed={activeImage === img}
                                            className={`h-20 w-20 shrink-0 rounded-lg border-2 bg-dark-900 transition-all overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2 focus-visible:ring-offset-dark-800 ${activeImage === img ? 'border-accent-500 ring-2 ring-accent-500/20' : 'border-dark-700 opacity-70 hover:opacity-100'}`}
                                        >
                                            {failedImages.has(img) ? (
                                                <ProductImagePlaceholder compact />
                                            ) : (
                                                <img
                                                    src={img}
                                                    alt={`${product.name} thumbnail ${idx + 1}`}
                                                    className="h-full w-full object-contain p-1"
                                                    onError={() => markImageFailed(img)}
                                                />
                                            )}
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
                                        <span className="font-bold text-green-500">{formatPrice(Number(product.profit_margin))}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Details & Metadata */}
                    <div className="lg:col-span-3 min-w-0 space-y-6">
                        {/* Pricing Card */}
                        <div className="bg-dark-800 rounded-3xl p-8 shadow-sm border border-dark-700 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-accent-500/10 rounded-bl-full -mr-8 -mt-8 -z-0" />

                            <div className="relative z-10">
                                <h2 className="text-sm font-bold text-silver-500 uppercase tracking-widest mb-2">Pricing Information</h2>
                                <div className="flex flex-wrap items-end gap-3 mb-4">
                                    <div className="break-words text-3xl sm:text-4xl font-extrabold text-white">{formatPrice(product.current_price)}</div>
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
                                        <Tag size={20} />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-xs text-silver-500 font-bold uppercase">Department/Category</div>
                                        <div className="break-words text-white font-bold">{product.category_name || 'Uncategorized'}</div>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-dark-700 rounded-xl text-silver-400">
                                        <Activity size={20} />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-xs text-silver-500 font-bold uppercase">Created By</div>
                                        <div className="break-words text-white font-bold">{product.created_by_name || 'System Admin'}</div>
                                        <div className="break-all text-xs text-silver-500">{product.created_by_email}</div>
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
                        <div className="min-w-0 bg-dark-800 rounded-3xl p-6 sm:p-8 shadow-sm border border-dark-700">
                            <h3 className="font-bold text-white mb-4">Description</h3>
                            <div className="max-w-none break-words text-sm leading-7 text-silver-400 [&_a]:break-all [&_a]:font-semibold [&_a]:text-accent-500 [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-accent-400 [&_blockquote]:border-l-2 [&_blockquote]:border-accent-500 [&_blockquote]:pl-4 [&_blockquote]:italic [&_code]:rounded [&_code]:bg-dark-900 [&_code]:px-1.5 [&_code]:py-0.5 [&_h2]:mb-3 [&_h2]:mt-7 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-white [&_h3]:mb-2 [&_h3]:mt-6 [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-white [&_h4]:mb-2 [&_h4]:mt-5 [&_h4]:font-bold [&_h4]:text-white [&_li]:my-1 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-3 [&_pre]:my-4 [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:bg-dark-900 [&_pre]:p-4 [&_strong]:font-bold [&_strong]:text-silver-200 [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6">
                                <RichDescription description={product.description} />
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

            {activeTab === 'stock' && (
                <div className="space-y-6 animate-fade-in">
                    {stockFeedback && (
                        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-400">
                            <CheckCircle2 size={18} /> {stockFeedback}
                        </div>
                    )}

                    {/* Stock Overview Cards */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="rounded-2xl border border-dark-700 bg-dark-800 p-5 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold uppercase tracking-wider text-silver-400">Current Stock</span>
                                <Package size={18} className="text-accent-500" />
                            </div>
                            <div className="flex items-baseline gap-3">
                                <span className="text-3xl font-black text-white">{currentStock}</span>
                                <span className="text-xs text-silver-400">units available</span>
                            </div>
                            <div className="mt-3">
                                {currentStock <= 0 ? (
                                    <span className="inline-flex items-center gap-1 rounded-md border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-xs font-bold text-red-400">
                                        <AlertTriangle size={13} /> Stock Out (Storefront Alert)
                                    </span>
                                ) : currentStock <= 5 ? (
                                    <span className="inline-flex items-center gap-1 rounded-md border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-amber-400">
                                        <AlertTriangle size={13} /> Only {currentStock} left in stock!
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-400">
                                        <CheckCircle2 size={13} /> In Stock &amp; Ready to Ship
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="rounded-2xl border border-dark-700 bg-dark-800 p-5 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold uppercase tracking-wider text-silver-400">Units Sold</span>
                                <ShoppingBag size={18} className="text-emerald-400" />
                            </div>
                            <div className="flex items-baseline gap-3">
                                <span className="text-3xl font-black text-white">{product.sold_count || 0}</span>
                                <span className="text-xs text-silver-400">total order units</span>
                            </div>
                            <p className="mt-3 text-xs text-silver-500">Stock automatically deducted upon confirmed customer orders.</p>
                        </div>

                        <div className="rounded-2xl border border-dark-700 bg-dark-800 p-5 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold uppercase tracking-wider text-silver-400">Stock Threshold</span>
                                <Activity size={18} className="text-amber-400" />
                            </div>
                            <div className="flex items-baseline gap-3">
                                <span className="text-3xl font-black text-amber-400">&le; 5</span>
                                <span className="text-xs text-silver-400">low stock trigger</span>
                            </div>
                            <p className="mt-3 text-xs text-silver-500">Badges appear on store product cards &amp; details when stock is &le; 5.</p>
                        </div>

                        <div className="rounded-2xl border border-dark-700 bg-dark-800 p-5 shadow-sm flex flex-col justify-between">
                            <div>
                                <span className="text-xs font-bold uppercase tracking-wider text-silver-400 block mb-1">Inventory Actions</span>
                                <p className="text-xs text-silver-500 mb-3">Adjust counts or record incoming shipments directly.</p>
                            </div>
                            {canEdit && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEntryForm({
                                            change_type: 'manual_in',
                                            quantity: 1,
                                            target_stock: currentStock,
                                            reference: '',
                                            note: '',
                                        });
                                        setShowStockEntryModal(true);
                                    }}
                                    className="btn-primary flex items-center justify-center gap-2 w-full shadow-lg shadow-accent-500/20 py-2.5 text-sm"
                                >
                                    <Plus size={16} /> New Stock Entry
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Stock Logs Table */}
                    <div className="rounded-2xl border border-dark-700 bg-dark-800 p-6 shadow-sm">
                        <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-2">
                                    <History size={18} className="text-accent-500" />
                                    <h2 className="text-lg font-bold text-white">Stock Movement Log</h2>
                                </div>
                                <p className="text-xs text-silver-400">Chronological history of purchases, returns, cancellations, and manual adjustments.</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={fetchStockLogs}
                                    className="rounded-lg border border-dark-600 p-2 text-silver-400 transition-colors hover:bg-dark-700 hover:text-white"
                                    title="Refresh logs"
                                >
                                    <RefreshCcw size={16} className={loadingStockLogs ? 'animate-spin' : ''} />
                                </button>
                                {canEdit && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setEntryForm({
                                                change_type: 'manual_in',
                                                quantity: 1,
                                                target_stock: currentStock,
                                                reference: '',
                                                note: '',
                                            });
                                            setShowStockEntryModal(true);
                                        }}
                                        className="rounded-lg border border-accent-500/30 bg-accent-500/10 px-3 py-1.5 text-xs font-bold text-accent-400 hover:bg-accent-500/20 flex items-center gap-1.5"
                                    >
                                        <Plus size={14} /> Add Entry
                                    </button>
                                )}
                            </div>
                        </div>

                        {loadingStockLogs ? (
                            <div className="flex h-36 items-center justify-center">
                                <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-accent-500"></div>
                            </div>
                        ) : stockLogs.length === 0 ? (
                            <div className="rounded-xl border border-dark-700 bg-dark-900/50 p-8 text-center text-silver-500">
                                <Package size={32} className="mx-auto mb-2 text-silver-600" />
                                <p className="font-semibold text-silver-300">No stock movements recorded yet</p>
                                <p className="text-xs text-silver-500 mt-1">Purchases, returns, cancellations, and manual stock entries will appear here automatically.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm text-silver-300">
                                    <thead className="border-b border-dark-700 text-xs uppercase tracking-wider text-silver-400 bg-dark-900/40">
                                        <tr>
                                            <th className="px-4 py-3">Date &amp; Time</th>
                                            <th className="px-4 py-3">Event Type</th>
                                            <th className="px-4 py-3">Change</th>
                                            <th className="px-4 py-3">Balance</th>
                                            <th className="px-4 py-3">Reference</th>
                                            <th className="px-4 py-3">Notes</th>
                                            <th className="px-4 py-3">Handled By</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-dark-700/60 font-medium">
                                        {stockLogs.map((log) => {
                                            const isPositive = log.quantity_change > 0;
                                            const isNegative = log.quantity_change < 0;

                                            let badgeStyle = 'bg-dark-700 text-silver-300 border-dark-600';
                                            if (log.change_type === 'purchase') {
                                                badgeStyle = 'bg-red-500/10 text-red-400 border-red-500/20';
                                            } else if (log.change_type === 'return' || log.change_type === 'manual_in') {
                                                badgeStyle = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
                                            } else if (log.change_type === 'cancellation') {
                                                badgeStyle = 'bg-sky-500/10 text-sky-400 border-sky-500/20';
                                            } else if (log.change_type === 'manual_out') {
                                                badgeStyle = 'bg-orange-500/10 text-orange-400 border-orange-500/20';
                                            } else if (log.change_type === 'adjustment') {
                                                badgeStyle = 'bg-purple-500/10 text-purple-400 border-purple-500/20';
                                            }

                                            return (
                                                <tr key={log.id} className="hover:bg-dark-700/30 transition-colors">
                                                    <td className="px-4 py-3 text-xs text-silver-400 whitespace-nowrap">
                                                        {formatDate(log.created_at)}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-semibold ${badgeStyle}`}>
                                                            {log.change_type_display || log.change_type}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap font-bold">
                                                        {isPositive && (
                                                            <span className="text-emerald-400 flex items-center gap-0.5">
                                                                <TrendingUp size={14} /> +{log.quantity_change}
                                                            </span>
                                                        )}
                                                        {isNegative && (
                                                            <span className="text-red-400 flex items-center gap-0.5">
                                                                <TrendingDown size={14} /> {log.quantity_change}
                                                            </span>
                                                        )}
                                                        {!isPositive && !isNegative && (
                                                            <span className="text-silver-400">0</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap font-mono text-xs text-silver-300">
                                                        {log.previous_stock} &rarr; <span className="font-bold text-white">{log.new_stock}</span>
                                                    </td>
                                                    <td className="px-4 py-3 text-xs text-silver-400 whitespace-nowrap font-mono">
                                                        {log.reference || '-'}
                                                    </td>
                                                    <td className="px-4 py-3 text-xs text-silver-300 max-w-xs truncate" title={log.note || ''}>
                                                        {log.note || '-'}
                                                    </td>
                                                    <td className="px-4 py-3 text-xs text-silver-400 whitespace-nowrap">
                                                        {log.created_by_name || 'System / Automatic'}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Modal: New Stock Entry */}
            {showStockEntryModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-2xl border border-dark-700 bg-dark-800 p-6 shadow-2xl">
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-white">New Stock Entry</h2>
                                <p className="text-xs text-silver-400">{product.name} (Current: {currentStock})</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowStockEntryModal(false)}
                                className="text-silver-500 transition-colors hover:text-white"
                            >
                                <X size={22} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateStockEntry} className="space-y-4">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-silver-300">Entry Type</label>
                                <select
                                    value={entryForm.change_type}
                                    onChange={(e) => setEntryForm({ ...entryForm, change_type: e.target.value as any })}
                                    className="w-full rounded-lg border border-dark-600 bg-dark-700 px-4 py-2 text-white outline-none focus:border-transparent focus:ring-2 focus:ring-accent-500 text-sm"
                                >
                                    <option value="manual_in">Manual In (Restock / Supplier Intake)</option>
                                    <option value="manual_out">Manual Out (Scrap / Damage / Defect)</option>
                                    <option value="adjustment">Stock Adjustment (Physical Count Audit)</option>
                                </select>
                            </div>

                            {entryForm.change_type === 'adjustment' ? (
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-silver-300">Target Count</label>
                                    <input
                                        type="number"
                                        min="0"
                                        required
                                        value={entryForm.target_stock}
                                        onChange={(e) => setEntryForm({ ...entryForm, target_stock: parseInt(e.target.value) || 0 })}
                                        className="w-full rounded-lg border border-dark-600 bg-dark-700 px-4 py-2 text-white outline-none focus:border-transparent focus:ring-2 focus:ring-accent-500 font-mono text-base"
                                    />
                                    <p className="mt-1 text-xs text-silver-400">
                                        Adjustment change: {entryForm.target_stock - currentStock >= 0 ? `+${entryForm.target_stock - currentStock}` : entryForm.target_stock - currentStock} units
                                    </p>
                                </div>
                            ) : (
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-silver-300">
                                        Quantity {entryForm.change_type === 'manual_in' ? 'to Add (+)' : 'to Deduct (-)'}
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        required
                                        value={entryForm.quantity}
                                        onChange={(e) => setEntryForm({ ...entryForm, quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                                        className="w-full rounded-lg border border-dark-600 bg-dark-700 px-4 py-2 text-white outline-none focus:border-transparent focus:ring-2 focus:ring-accent-500 font-mono text-base"
                                    />
                                    <p className="mt-1 text-xs text-silver-400">
                                        Resulting stock will be: {entryForm.change_type === 'manual_in' ? currentStock + entryForm.quantity : Math.max(0, currentStock - entryForm.quantity)}
                                    </p>
                                </div>
                            )}

                            <div>
                                <label className="mb-1 block text-sm font-medium text-silver-300">Reference / Document #</label>
                                <input
                                    type="text"
                                    placeholder="e.g. PO-2026-001, Physical Audit, Invoice #..."
                                    value={entryForm.reference}
                                    onChange={(e) => setEntryForm({ ...entryForm, reference: e.target.value })}
                                    className="w-full rounded-lg border border-dark-600 bg-dark-700 px-4 py-2 text-white outline-none placeholder-silver-600 focus:border-transparent focus:ring-2 focus:ring-accent-500 text-sm"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-silver-300">Note / Reason</label>
                                <textarea
                                    rows={2}
                                    placeholder="Reason for adjustment, restock batch details, etc."
                                    value={entryForm.note}
                                    onChange={(e) => setEntryForm({ ...entryForm, note: e.target.value })}
                                    className="w-full rounded-lg border border-dark-600 bg-dark-700 px-4 py-2 text-white outline-none placeholder-silver-600 focus:border-transparent focus:ring-2 focus:ring-accent-500 text-sm"
                                />
                            </div>

                            <div className="flex gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowStockEntryModal(false)}
                                    className="flex-1 rounded-lg border border-dark-600 px-4 py-2 text-silver-400 transition-colors hover:bg-dark-700 hover:text-white text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={stockEntrySubmitting}
                                    className="btn-primary flex-1 shadow-lg shadow-accent-500/20 text-sm"
                                >
                                    {stockEntrySubmitting ? 'Saving...' : 'Save Entry'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
