'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, Heart, Star, Plus } from 'lucide-react';
import { useCart } from '@/lib/cart';
import { Product } from '@/lib/api';

interface ProductCardProps {
    product: Product;
}

import { useCustomerAuth } from '@/context/CustomerAuthContext';

export default function ProductCard({ product }: ProductCardProps) {
    const { addItem } = useCart();
    const { addToWishlist, removeFromWishlist, isWishlisted } = useCustomerAuth();
    const displayRating = Number(product.rating) > 0 ? Number(product.rating) : 4.6;
    const displayReviewCount = (product.review_count || 0) > 0 ? product.review_count : 128;

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        addItem(product);
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
        <div className="product-grid-card group cursor-pointer">
            <Link href={`/products/${product.slug}`} className="block h-full">
                {/* Image Container */}
                <div className="relative aspect-[4/5] overflow-hidden bg-gray-50">
                    {product.image ? (
                        <Image
                            src={product.image}
                            alt={product.name}
                            fill
                            className="object-cover product-image"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-200">
                            <ShoppingCart size={40} strokeWidth={1.2} />
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
                            : 'bg-white/95 backdrop-blur-sm text-gray-400 hover:text-red-500'
                            }`}
                    >
                        <Heart
                            size={15}
                            className={isWishlisted(product.id) ? 'fill-current' : ''}
                        />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4">
                    {/* Category */}
                    <span className="text-[10px] font-bold tracking-widest text-accent-500 uppercase mb-1.5 block">
                        {product.category?.name || 'Curated'}
                    </span>

                    {/* Title */}
                    <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2 group-hover:text-accent-600 transition-colors min-h-[2.5rem] mb-1">
                        {product.name}
                    </h3>

                    {/* Rating */}
                    <div className="flex items-center gap-1 mb-3">
                        <div className="flex items-center">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                    key={star}
                                    size={11}
                                    className={star <= Math.round(displayRating) ? 'fill-amber-400 text-amber-400' : 'text-gray-200 fill-gray-200'}
                                />
                            ))}
                        </div>
                        <span className="text-[10px] text-gray-400 ml-0.5">
                            {displayRating.toFixed(1)} ({displayReviewCount})
                        </span>
                    </div>

                    {/* Price & Action */}
                    <div className="flex items-end justify-between pt-3 border-t border-gray-50">
                        <div className="flex flex-col">
                            <span className="text-base font-bold text-gray-900 tracking-tight">
                                ₹{product.current_price.toLocaleString()}
                            </span>
                            {product.sale_price && (
                                <span className="text-[11px] text-gray-400 line-through">
                                    ₹{product.price.toLocaleString()}
                                </span>
                            )}
                        </div>
                        <button
                            onClick={handleAddToCart}
                            className="h-9 w-9 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 hover:bg-accent-500 hover:text-white hover:border-accent-500 hover:scale-105 active:scale-95 transition-all"
                        >
                            <Plus size={16} />
                        </button>
                    </div>
                </div>
            </Link>
        </div>
    );
}
