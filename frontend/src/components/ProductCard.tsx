'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, Heart, Star } from 'lucide-react';
import { useCart } from '@/lib/cart';
import { Product } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useCustomerAuth } from '@/context/CustomerAuthContext';

interface ProductCardProps {
    product: Product;
}

const getFormattedImageUrl = (url: string | null | undefined) => {
    if (!url) return null;
    if (url.includes('://backend:8000') || url.includes('://backend/')) {
        return url.replace(/^https?:\/\/backend(:8000)?/, 'https://api.vorionmart.com');
    }
    return url;
};

export default function ProductCard({ product }: ProductCardProps) {
    const { addItem } = useCart();
    const router = useRouter();
    const { addToWishlist, removeFromWishlist, isWishlisted } = useCustomerAuth();
    
    const [imageLoading, setImageLoading] = useState(true);
    const [imageError, setImageError] = useState(false);

    const displayRating = Number(product.rating) > 0 ? Number(product.rating) : 4.6;
    const imageUrl = getFormattedImageUrl(product.image);

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        addItem(product);
    };

    const handleBuyNow = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        addItem(product);
        router.push('/checkout');
    };

    const handleWishlist = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (isWishlisted(product.id)) {
            removeFromWishlist(product.id);
        } else {
            addToWishlist(product);
        }
    };

    return (
        <div className="product-grid-card group cursor-pointer bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500">
            <Link href={`/products/${product.slug}`} className="block h-full">
                <span className="sr-only">View {product.name} - Premium Quality Product</span>
                {/* Image Container */}
                <div className="relative aspect-[4/5] overflow-hidden bg-slate-50">
                    {/* Fast Skeleton Loading Shimmer Animation */}
                    {imageLoading && !imageError && imageUrl && (
                        <div className="absolute inset-0 bg-slate-100 z-10">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-200/60 to-transparent animate-shimmer" />
                        </div>
                    )}

                    {imageUrl && !imageError ? (
                        <Image
                            src={imageUrl}
                            alt={product.name}
                            fill
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                            onLoadingComplete={() => setImageLoading(false)}
                            onError={() => {
                                setImageLoading(false);
                                setImageError(true);
                            }}
                            className={`object-contain w-full h-full p-2 product-image transition-all duration-500 group-hover:scale-105 ${
                                imageLoading ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
                            }`}
                        />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 text-slate-300 p-4">
                            <ShoppingCart size={40} strokeWidth={1.2} className="mb-2 text-slate-300" />
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">VorionMart</span>
                        </div>
                    )}


                    {/* Hover Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
                        {product.discount_percent > 0 && (
                            <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm">
                                -{product.discount_percent}%
                            </span>
                        )}
                        {product.is_featured && (
                            <span className="bg-accent-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm">
                                HOT
                            </span>
                        )}
                    </div>

                    {/* Wishlist */}
                    <button
                        onClick={handleWishlist}
                        className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center shadow-md transition-all opacity-0 group-hover:opacity-100 z-10 ${isWishlisted(product.id)
                            ? 'bg-red-500 text-white opacity-100'
                            : 'bg-white/90 backdrop-blur-sm text-gray-400 hover:text-red-500'
                            }`}
                    >
                        <Heart
                            size={15}
                            className={isWishlisted(product.id) ? 'fill-current' : ''}
                        />
                    </button>
                </div>

                {/* Content */}
                <div className="p-3">
                    {/* Category */}
                    <span className="text-[10px] font-bold tracking-widest text-accent-500 uppercase mb-1.5 block">
                        {product.category?.name || 'Curated'}
                    </span>

                    {/* Title - Strict 2-line limit */}
                    <h3 
                        className="font-bold text-gray-900 text-sm leading-snug group-hover:text-accent-600 transition-colors h-[40px] mb-1 overflow-hidden"
                        style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                        }}
                    >
                        {product.name}
                    </h3>

                    {/* Rating */}
                    <div className="flex items-center gap-1 mb-3">
                        <div className="flex items-center">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                    key={star}
                                    size={10}
                                    className={star <= Math.round(displayRating) ? 'fill-amber-400 text-amber-400' : 'text-gray-200 fill-gray-200'}
                                />
                            ))}
                        </div>
                        <span className="text-[10px] text-gray-400 font-medium ml-0.5">
                            {displayRating.toFixed(1)}
                        </span>
                    </div>

                    {/* Price */}
                    <div className="flex items-baseline gap-1.5 mb-4">
                        <span className="text-sm font-bold text-gray-900">
                            ₹{product.current_price.toLocaleString()}
                        </span>
                        {product.price > product.current_price && (
                            <span className="text-[10px] text-gray-400 line-through">
                                ₹{product.price.toLocaleString()}
                            </span>
                        )}
                    </div>

                    {/* Action Buttons - Stacked on Mobile, Side-by-Side on Tablet/Desktop */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-auto">
                        <button
                            onClick={handleAddToCart}
                            className="flex items-center justify-center gap-1.5 py-2 px-3 bg-gray-50 border border-gray-100 text-gray-600 rounded-xl font-bold text-[10px] hover:bg-gray-100 hover:text-gray-900 active:scale-95 transition-all w-full"
                        >
                            <ShoppingCart size={12} /> Add to Cart
                        </button>
                        <button
                            onClick={handleBuyNow}
                            className="flex items-center justify-center gap-1.5 py-2 px-3 bg-accent-500 text-white rounded-xl font-bold text-[10px] hover:bg-accent-600 active:scale-95 transition-all w-full shadow-sm shadow-accent-500/20"
                        >
                            Buy Now
                        </button>
                    </div>
                </div>
            </Link>
        </div>
    );
}
