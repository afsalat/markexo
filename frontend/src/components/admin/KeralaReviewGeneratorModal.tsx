'use client';

import { useState } from 'react';
import {
    X, Sparkles, Star, Check, ShieldCheck, MapPin,
    AlertCircle, RefreshCw, Trash2, CheckCircle2, ChevronRight
} from 'lucide-react';
import { Product } from '@/types/admin';
import { API_BASE_URL } from '@/config/apiConfig';
import { formatImageUrl } from '@/lib/imageUrl';

interface KeralaReviewGeneratorModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: Product | null;
    allProducts?: Product[];
    token: string | null;
    onSuccess?: () => void;
}

export default function KeralaReviewGeneratorModal({
    isOpen,
    onClose,
    product,
    allProducts = [],
    token,
    onSuccess,
}: KeralaReviewGeneratorModalProps) {
    const [isBulkMode, setIsBulkMode] = useState(!product && allProducts.length > 0);
    const [selectedProductIds, setSelectedProductIds] = useState<number[]>(
        product ? [product.id] : allProducts.map(p => p.id)
    );

    const [reviewCount, setReviewCount] = useState<number>(100);
    const [customCount, setCustomCount] = useState<string>('100');
    const [tone, setTone] = useState<'natural' | 'detailed' | 'concise'>('natural');
    const [ratingSkew, setRatingSkew] = useState<'high' | 'perfect' | 'balanced'>('high');
    const [verified, setVerified] = useState<boolean>(true);
    const [clearExisting, setClearExisting] = useState<boolean>(false);

    const [loading, setLoading] = useState<boolean>(false);
    const [clearing, setClearing] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [resultDetails, setResultDetails] = useState<any>(null);

    if (!isOpen) return null;

    const targetProduct = product || (allProducts.find(p => p.id === selectedProductIds[0]) || allProducts[0]);

    const handleCountPreset = (count: number) => {
        setReviewCount(count);
        setCustomCount(String(count));
    };

    const handleCustomCountChange = (val: string) => {
        setCustomCount(val);
        const parsed = parseInt(val, 10);
        if (!isNaN(parsed) && parsed > 0) {
            setReviewCount(Math.min(parsed, 500));
        }
    };

    const handleGenerate = async () => {
        if (!token) {
            setError('Authentication token missing. Please re-login.');
            return;
        }

        setLoading(true);
        setError(null);
        setSuccessMessage(null);
        setResultDetails(null);

        try {
            if (isBulkMode) {
                // Bulk Generation
                const targetIds = selectedProductIds.length > 0
                    ? selectedProductIds
                    : allProducts.map(p => p.id);

                const response = await fetch(`${API_BASE_URL}/admin/products/bulk-generate-kerala-reviews/`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        product_ids: targetIds,
                        count: reviewCount,
                        tone,
                        rating_skew: ratingSkew,
                        verified,
                        clear_existing: clearExisting,
                    }),
                });

                if (!response.ok) {
                    const err = await response.json().catch(() => ({}));
                    throw new Error(err.error || 'Failed to bulk generate reviews');
                }

                const data = await response.json();
                setResultDetails(data);
                setSuccessMessage(`Successfully generated ${reviewCount} authentic Kerala reviews across ${data.processed_products} products!`);
                if (onSuccess) onSuccess();
            } else {
                // Single Product Generation
                if (!targetProduct) throw new Error('No product selected.');

                const response = await fetch(`${API_BASE_URL}/admin/products/${targetProduct.id}/generate-kerala-reviews/`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        count: reviewCount,
                        tone,
                        rating_skew: ratingSkew,
                        verified,
                        clear_existing: clearExisting,
                    }),
                });

                if (!response.ok) {
                    const err = await response.json().catch(() => ({}));
                    throw new Error(err.error || 'Failed to generate reviews');
                }

                const data = await response.json();
                setResultDetails(data);
                setSuccessMessage(
                    `Generated ${data.generated_count} Kerala reviews for "${targetProduct.name}"! New Rating: ${data.new_rating}★ (${data.total_reviews} reviews total).`
                );
                if (onSuccess) onSuccess();
            }
        } catch (err: any) {
            console.error('Error generating reviews:', err);
            setError(err.message || 'An error occurred during generation');
        } finally {
            setLoading(false);
        }
    };

    const handleClearReviews = async () => {
        if (!targetProduct || !token) return;
        if (!confirm(`Are you sure you want to delete ALL reviews for "${targetProduct.name}"? This will reset the product rating to 0.`)) {
            return;
        }

        setClearing(true);
        setError(null);
        setSuccessMessage(null);

        try {
            const response = await fetch(`${API_BASE_URL}/admin/products/${targetProduct.id}/clear-reviews/`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to clear reviews');
            }

            const data = await response.json();
            setSuccessMessage(`Cleared ${data.deleted_count} reviews. Product rating reset.`);
            if (onSuccess) onSuccess();
        } catch (err: any) {
            console.error('Error clearing reviews:', err);
            setError(err.message || 'Failed to clear reviews');
        } finally {
            setClearing(false);
        }
    };

    // Live preview sample based on selected options
    const getPreviewSample = () => {
        const prodName = targetProduct?.name || 'this product';
        const isPerfume = prodName.toLowerCase().includes('perfume') || prodName.toLowerCase().includes('fragrance');
        const isElec = prodName.toLowerCase().includes('cable') || prodName.toLowerCase().includes('charger');

        if (isPerfume) {
            if (tone === 'concise') {
                return '“Adipoli fragrance set! Lasts throughout my work shift. Reached Kozhikode in just 2 days. Worth every single rupee!”';
            }
            if (tone === 'detailed') {
                return '“Really impressed with the scent quality. Feels very luxury. The atomiser spray nozzle produces a very fine mist and CEO & Oud variants have rich citrus & wood notes. Reached Kochi safely in 48 hours. Definite re-order from VorionMart once this finishes.”';
            }
            return '“Adipoli fragrance set! All bottles have distinct rich notes. CEO and Oud variants stay on clothes easily 6-7 hours. Reached Calicut in just 2 days with safe bubble wrap. Worth every single rupee!”';
        }

        if (isElec) {
            return '“Adipoli build quality! Exactly what I needed for my workstation. Adhesive stickiness is very powerful on wooden table. Reached Ernakulam in 2 days. Must buy for work from home desk setups.”';
        }

        return `“Adipoli purchase! ${prodName} matches exactly as shown in photos. Super satisfied with VorionMart service. Prompt delivery to Kozhikode, very neatly packed. 10/10 recommended!”`;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/75 p-4 backdrop-blur-sm animate-fadeIn">
            <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl border border-dark-700 bg-dark-900 shadow-2xl p-6 sm:p-8 custom-scrollbar">
                
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute right-5 top-5 rounded-full p-2 text-silver-400 transition-colors hover:bg-dark-800 hover:text-white"
                >
                    <X size={20} />
                </button>

                {/* Header Badge & Title */}
                <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 text-dark-900 shadow-lg shadow-amber-500/20">
                        <Sparkles size={24} className="fill-current" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-400 border border-emerald-500/20">
                                🌴 Kerala Authenticity Engine
                            </span>
                            <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-400 border border-amber-500/20">
                                1-Click 100+ Reviews
                            </span>
                        </div>
                        <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
                            Kerala Product Reviews Generator
                        </h2>
                    </div>
                </div>

                {/* Mode Selector (Single vs Bulk) */}
                {allProducts.length > 1 && (
                    <div className="mb-6 flex rounded-xl border border-dark-700 bg-dark-800 p-1">
                        <button
                            type="button"
                            onClick={() => setIsBulkMode(false)}
                            className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all ${
                                !isBulkMode
                                    ? 'bg-accent-600 text-white shadow-md'
                                    : 'text-silver-400 hover:text-white'
                            }`}
                        >
                            Single Product Mode
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsBulkMode(true)}
                            className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all ${
                                isBulkMode
                                    ? 'bg-accent-600 text-white shadow-md'
                                    : 'text-silver-400 hover:text-white'
                            }`}
                        >
                            Bulk Multi-Product ({allProducts.length} Products)
                        </button>
                    </div>
                )}

                {/* Target Product Preview Card */}
                {!isBulkMode && targetProduct && (
                    <div className="mb-6 flex items-center gap-4 rounded-2xl border border-dark-700 bg-dark-800/80 p-4">
                        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-dark-600 bg-dark-700">
                            {targetProduct.image ? (
                                <img
                                    src={formatImageUrl(targetProduct.image)}
                                    alt={targetProduct.name}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <span className="flex h-full w-full items-center justify-center text-2xl">📦</span>
                            )}
                        </div>
                        <div className="min-w-0 flex-1">
                            <h3 className="truncate font-semibold text-white text-base">
                                {targetProduct.name}
                            </h3>
                            <div className="flex items-center gap-3 text-xs text-silver-400 mt-1">
                                <span>Category: <strong className="text-silver-200">{targetProduct.category_name || 'General'}</strong></span>
                                <span>•</span>
                                <span className="flex items-center gap-1 text-amber-400 font-semibold">
                                    <Star size={13} className="fill-current" />
                                    {targetProduct.rating || '0.0'}★
                                    <span className="text-silver-500 font-normal">({targetProduct.review_count || 0} reviews)</span>
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Bulk Mode Product Selection */}
                {isBulkMode && (
                    <div className="mb-6 rounded-2xl border border-dark-700 bg-dark-800/80 p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-white">Target Products</span>
                            <span className="text-xs text-silver-400">
                                {selectedProductIds.length} of {allProducts.length} selected
                            </span>
                        </div>
                        <p className="text-xs text-silver-400 mb-3">
                            Each selected product will receive {reviewCount} personalized Kerala customer reviews customized for its unique category.
                        </p>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setSelectedProductIds(allProducts.map(p => p.id))}
                                className="text-xs text-accent-400 hover:underline"
                            >
                                Select All ({allProducts.length})
                            </button>
                            <span className="text-silver-600">•</span>
                            <button
                                type="button"
                                onClick={() => setSelectedProductIds(product ? [product.id] : [])}
                                className="text-xs text-silver-400 hover:text-white"
                            >
                                Reset Selection
                            </button>
                        </div>
                    </div>
                )}

                {/* Settings Grid */}
                <div className="space-y-5">
                    {/* 1. Review Count Presets */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-semibold text-silver-200">
                                Number of Reviews to Generate
                            </label>
                            <span className="text-xs text-amber-400 font-semibold">
                                {reviewCount} Reviews Total
                            </span>
                        </div>
                        <div className="grid grid-cols-4 gap-2 mb-2">
                            {[50, 100, 150, 200].map((preset) => (
                                <button
                                    key={preset}
                                    type="button"
                                    onClick={() => handleCountPreset(preset)}
                                    className={`rounded-xl py-2 px-3 text-xs font-bold transition-all border ${
                                        reviewCount === preset
                                            ? 'border-amber-500 bg-amber-500/15 text-amber-400 shadow-sm'
                                            : 'border-dark-700 bg-dark-800 text-silver-300 hover:border-dark-600 hover:text-white'
                                    }`}
                                >
                                    {preset === 100 ? '⭐ 100 (1-Click)' : `${preset} Reviews`}
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-silver-400">Or custom amount:</span>
                            <input
                                type="number"
                                min="1"
                                max="500"
                                value={customCount}
                                onChange={(e) => handleCustomCountChange(e.target.value)}
                                className="w-24 rounded-lg border border-dark-700 bg-dark-800 px-3 py-1 text-xs text-white focus:border-accent-500 focus:outline-none"
                            />
                            <span className="text-xs text-silver-500">(1 to 500 reviews)</span>
                        </div>
                    </div>

                    {/* 2. Tone & Language Style */}
                    <div>
                        <label className="block text-sm font-semibold text-silver-200 mb-2">
                            Review Tone & Language Style
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                            {[
                                {
                                    id: 'natural',
                                    title: '🌴 Kerala Real Mix',
                                    desc: 'English + Malayali praise ("Adipoli", "Valare Nannayittund", district deliveries)',
                                },
                                {
                                    id: 'detailed',
                                    title: '📝 In-Depth Feature Review',
                                    desc: '3-4 sentences on packaging, build quality, scent notes & performance',
                                },
                                {
                                    id: 'concise',
                                    title: '⚡ Quick Verified Buyer',
                                    desc: 'Crisp 1-2 sentence real buyer testimonials',
                                },
                            ].map((item) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => setTone(item.id as any)}
                                    className={`rounded-xl p-3 text-left transition-all border ${
                                        tone === item.id
                                            ? 'border-accent-500 bg-accent-500/10 text-white shadow-sm'
                                            : 'border-dark-700 bg-dark-800 text-silver-400 hover:border-dark-600 hover:text-silver-200'
                                    }`}
                                >
                                    <div className="text-xs font-bold text-white mb-1">{item.title}</div>
                                    <div className="text-[11px] leading-relaxed text-silver-400">{item.desc}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 3. Rating Skew Strategy */}
                    <div>
                        <label className="block text-sm font-semibold text-silver-200 mb-2">
                            Target Rating Distribution
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                            {[
                                {
                                    id: 'high',
                                    badge: '⭐ 4.8★ - 4.9★',
                                    label: 'Top-Rated Trust (Recommended)',
                                    detail: '84% 5-Star, 13% 4-Star, 3% 3-Star',
                                },
                                {
                                    id: 'perfect',
                                    badge: '🌟 5.0★ Pure',
                                    label: 'Ultra-Premium',
                                    detail: '100% 5-Star Reviews',
                                },
                                {
                                    id: 'balanced',
                                    badge: '⚖️ 4.6★ - 4.7★',
                                    label: 'Natural Spread',
                                    detail: '70% 5-Star, 24% 4-Star, 6% 3-Star',
                                },
                            ].map((item) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => setRatingSkew(item.id as any)}
                                    className={`rounded-xl p-3 text-left transition-all border ${
                                        ratingSkew === item.id
                                            ? 'border-amber-500 bg-amber-500/10 text-white shadow-sm'
                                            : 'border-dark-700 bg-dark-800 text-silver-400 hover:border-dark-600 hover:text-silver-200'
                                    }`}
                                >
                                    <span className="inline-block rounded-md bg-dark-700 px-2 py-0.5 text-[10px] font-bold text-amber-400 mb-1">
                                        {item.badge}
                                    </span>
                                    <div className="text-xs font-semibold text-white">{item.label}</div>
                                    <div className="text-[10px] text-silver-400 mt-0.5">{item.detail}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 4. Verified & Date Options */}
                    <div className="rounded-2xl border border-dark-700 bg-dark-800/60 p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2.5 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={verified}
                                    onChange={(e) => setVerified(e.target.checked)}
                                    className="h-4 w-4 rounded border-dark-600 bg-dark-700 text-accent-600 focus:ring-0"
                                />
                                <div>
                                    <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                                        <ShieldCheck size={14} className="text-emerald-400" />
                                        Include "Verified Buyer" Badges
                                    </span>
                                    <span className="text-[11px] text-silver-400 block">
                                        Renders official verified purchase checkmarks on each review card
                                    </span>
                                </div>
                            </label>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-dark-700">
                            <label className="flex items-center gap-2.5 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={clearExisting}
                                    onChange={(e) => setClearExisting(e.target.checked)}
                                    className="h-4 w-4 rounded border-dark-600 bg-dark-700 text-red-500 focus:ring-0"
                                />
                                <div>
                                    <span className="text-xs font-semibold text-white">
                                        Replace Existing Reviews
                                    </span>
                                    <span className="text-[11px] text-silver-400 block">
                                        Clears old reviews before generating new ones (or unchecked to append)
                                    </span>
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* Kerala Geographic Coverage Pills */}
                    <div className="rounded-2xl border border-dark-700/60 bg-dark-800/40 p-3.5">
                        <div className="flex items-center gap-2 text-xs font-semibold text-silver-300 mb-2">
                            <MapPin size={14} className="text-emerald-400" />
                            <span>14 Kerala Districts & Hub Coverage (148 Authentic Personas):</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 text-[11px]">
                            {['Kozhikode', 'Kochi', 'Thrissur', 'Kannur', 'Malappuram', 'Trivandrum', 'Palakkad', 'Kottayam', 'Alappuzha', 'Wayanad', 'Kollam'].map(city => (
                                <span key={city} className="rounded-md bg-dark-700/80 px-2 py-0.5 text-silver-300">
                                    {city}
                                </span>
                            ))}
                            <span className="rounded-md bg-dark-700/40 px-2 py-0.5 text-silver-500">+4 more</span>
                        </div>
                    </div>

                    {/* Live Sample Preview */}
                    {!isBulkMode && (
                        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
                            <div className="flex items-center justify-between text-xs text-amber-400 font-semibold mb-1.5">
                                <span className="flex items-center gap-1.5">
                                    <Star size={13} className="fill-current" />
                                    Live Sample Preview (Generated Dynamically for this item):
                                </span>
                                <span className="text-[10px] text-silver-400">By Rahul Nair, Kozhikode • Verified Buyer</span>
                            </div>
                            <p className="text-xs text-silver-200 italic leading-relaxed">
                                {getPreviewSample()}
                            </p>
                        </div>
                    )}

                    {/* Error Banner */}
                    {error && (
                        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-400 flex items-start gap-2.5">
                            <AlertCircle size={16} className="shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Success Banner */}
                    {successMessage && (
                        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-400 flex items-start gap-3">
                            <CheckCircle2 size={18} className="shrink-0 mt-0.5 text-emerald-400" />
                            <div className="flex-1">
                                <p className="font-semibold">{successMessage}</p>
                                {resultDetails && (
                                    <div className="mt-2 flex items-center gap-3 text-[11px] text-emerald-300">
                                        <span>New Rating: <strong>{resultDetails.new_rating}★</strong></span>
                                        <span>•</span>
                                        <span>Total Reviews: <strong>{resultDetails.total_reviews}</strong></span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Action Buttons */}
                <div className="mt-8 flex flex-col-reverse sm:flex-row items-center justify-between gap-3 border-t border-dark-700 pt-5">
                    {!isBulkMode && targetProduct && (
                        <button
                            type="button"
                            onClick={handleClearReviews}
                            disabled={clearing || loading}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-xs font-semibold text-red-400 hover:bg-red-500/20 disabled:opacity-50 transition-colors"
                        >
                            {clearing ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
                            <span>Clear Reviews</span>
                        </button>
                    )}

                    <div className="flex w-full sm:w-auto items-center justify-end gap-3 ml-auto">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-xl border border-dark-700 bg-dark-800 px-4 py-2.5 text-xs font-semibold text-silver-300 hover:bg-dark-700 hover:text-white transition-colors"
                        >
                            {successMessage ? 'Done' : 'Cancel'}
                        </button>
                        <button
                            type="button"
                            onClick={handleGenerate}
                            disabled={loading || clearing}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 px-6 py-2.5 text-xs font-bold text-dark-950 shadow-lg shadow-amber-500/25 transition-all disabled:opacity-50"
                        >
                            {loading ? (
                                <>
                                    <RefreshCw size={15} className="animate-spin text-dark-950" />
                                    <span>Generating {reviewCount}+ Reviews...</span>
                                </>
                            ) : (
                                <>
                                    <Sparkles size={15} className="fill-current text-dark-950" />
                                    <span>Generate {reviewCount}+ Kerala Reviews</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}
