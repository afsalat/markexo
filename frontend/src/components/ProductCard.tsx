'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, Heart, Star } from 'lucide-react';
import { useCart } from '@/lib/cart';
import { Product } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useCustomerAuth } from '@/context/CustomerAuthContext';

import { formatImageUrl } from '@/lib/imageUrl';

interface ProductCardProps {
    product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
    const { addItem } = useCart();
    const router = useRouter();
    const { addToWishlist, removeFromWishlist, isWishlisted } = useCustomerAuth();
    
    const [imageLoading, setImageLoading] = useState(true);
    const [imageError, setImageError] = useState(false);

    const displayRating = Number(product.rating) > 0 ? Number(product.rating) : 4.6;
    const imageUrl = formatImageUrl(product.image);

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
        <div className="product-grid-card neumorph-card group cursor-pointer p-2.5 sm:p-3 flex flex-col justify-between transition-all duration-400">
            <Link href={`/products/${product.slug}`} className="block h-full">
                <span className="sr-only">View {product.name} - Premium Quality Product</span>
                {/* Image Container with Inset Neumorphic Frame */}
                <div className="relative aspect-[4/5] overflow-hidden neumorph-inset rounded-2xl mb-2.5">
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
                            className={`object-contain w-full h-full p-2.5 product-image transition-all duration-500 group-hover:scale-105 ${
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
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    {/* Badges */}
                    <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10">
                        {product.stock <= 0 ? (
                            <span className="bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-lg neumorph-badge uppercase tracking-wide">
                                Stock Out
                            </span>
                        ) : product.stock <= 5 ? (
                            <span className="bg-amber-500 text-white text-[10px] font-black px-2 py-0.5 rounded-lg neumorph-badge uppercase tracking-wide">
                                Only {product.stock} Left!
                            </span>
                        ) : null}
                        {product.discount_percent > 0 && (
                            <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-lg neumorph-badge">
                                -{product.discount_percent}%
                            </span>
                        )}
                        {product.is_featured && (
                            <span className="bg-accent-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-lg neumorph-badge">
                                HOT
                            </span>
                        )}
                    </div>

                    {/* Neumorphic Wishlist Button */}
                    <button
                        onClick={handleWishlist}
                        className={`absolute top-2.5 right-2.5 w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center neumorph-btn-circle transition-all opacity-0 group-hover:opacity-100 z-10 ${isWishlisted(product.id)
                            ? '!bg-red-500 !text-white opacity-100'
                            : 'text-gray-400 hover:text-red-500'
                            }`}
                    >
                        <Heart
                            size={14}
                            className={isWishlisted(product.id) ? 'fill-current text-white' : ''}
                        />
                    </button>
                </div>

                {/* Content */}
                <div className="px-1 pb-1 flex flex-col flex-grow">
                    {/* Category */}
                    <span className="text-[10px] font-extrabold tracking-widest text-accent-600 uppercase mb-1 block">
                        {product.category?.name || 'Curated'}
                    </span>

                    {/* Title - Strict 2-line limit */}
                    <h3 
                        className="font-bold text-gray-900 text-sm leading-snug group-hover:text-accent-600 transition-colors h-[40px] mb-1.5 overflow-hidden"
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
                    <div className="flex items-center gap-1 mb-2.5">
                        <div className="flex items-center">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                    key={star}
                                    size={10}
                                    className={star <= Math.round(displayRating) ? 'fill-amber-400 text-amber-400' : 'text-gray-200 fill-gray-200'}
                                />
                            ))}
                        </div>
                        <span className="text-[10px] text-gray-400 font-semibold ml-0.5">
                            {displayRating.toFixed(1)}
                        </span>
                    </div>

                    {/* Price */}
                    <div className="flex items-baseline gap-1.5 mb-3">
                        <span className="text-sm sm:text-base font-extrabold text-gray-900">
                            ₹{product.current_price.toLocaleString()}
                        </span>
                        {product.price > product.current_price && (
                            <span className="text-[10px] sm:text-[11px] text-gray-400 line-through">
                                ₹{product.price.toLocaleString()}
                            </span>
                        )}
                    </div>

                    {/* Neumorphic Action Buttons */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-auto">
                        {product.stock <= 0 ? (
                            <div className="col-span-1 sm:col-span-2 py-2 px-3 bg-red-50/80 border border-red-200/80 text-red-600 rounded-xl font-bold text-[11px] text-center uppercase tracking-wider">
                                Out of Stock
                            </div>
                        ) : (
                            <>
                                <button
                                    onClick={handleAddToCart}
                                    className="neumorph-btn-raised flex items-center justify-center gap-1.5 py-2 px-2.5 font-bold text-[10px] sm:text-[11px] w-full"
                                >
                                    <ShoppingCart size={13} /> Add to Cart
                                </button>
                                <button
                                    onClick={handleBuyNow}
                                    className="neumorph-btn-primary flex items-center justify-center gap-1.5 py-2 px-2.5 font-bold text-[10px] sm:text-[11px] w-full"
                                >
                                    Buy Now
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </Link>
        </div>
    );
}
