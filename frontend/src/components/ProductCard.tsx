'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, Heart, Star } from 'lucide-react';
import { useCart } from '@/lib/cart';
import { Product } from '@/lib/api';

interface ProductCardProps {
    product: Product;
}

import { useCustomerAuth } from '@/context/CustomerAuthContext';

export default function ProductCard({ product }: ProductCardProps) {
    const { addItem } = useCart();
    const { addToWishlist, removeFromWishlist, isWishlisted } = useCustomerAuth();

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
        <div className="product-card bg-white rounded-2xl overflow-hidden shadow-md group cursor-pointer">
            <Link href={`/products/${product.slug}`} className="block h-full">
                {/* Image Container */}
                <div className="relative aspect-square overflow-hidden bg-gray-100">
                    {product.image ? (
                        <Image
                            src={product.image}
                            alt={product.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <ShoppingCart size={48} />
                        </div>
                    )}

                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex flex-col gap-2">
                        {product.discount_percent > 0 && (
                            <span className="badge badge-sale">-{product.discount_percent}%</span>
                        )}
                        {product.is_featured && (
                            <span className="badge badge-featured">Featured</span>
                        )}
                    </div>

                    {/* Quick Actions */}
                    <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={handleWishlist}
                            className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-primary-50 transition-colors"
                        >
                            <Heart
                                size={18}
                                className={isWishlisted(product.id) ? "fill-red-500 text-red-500" : "text-gray-600 hover:text-red-500"}
                            />
                        </button>
                    </div>

                    {/* Add to Cart Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                        <button
                            onClick={handleAddToCart}
                            className="w-full btn-primary text-sm py-2"
                        >
                            Add to Cart
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-4">
                    {/* Category & Shop */}
                    <div className="flex items-center gap-2 mb-2">
                        {product.category && (
                            <span className="text-xs text-primary-600 font-medium bg-primary-50 px-2 py-1 rounded-full">
                                {product.category.name}
                            </span>
                        )}
                    </div>

                    {/* Title */}
                    <h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-primary-600 transition-colors">
                        {product.name}
                    </h3>

                    {/* Fulfilled by VorionMart */}
                    <p className="text-xs text-accent-500 font-medium mt-1 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-accent-500 rounded-full"></span>
                        Fulfilled by VorionMart
                    </p>

                    {/* Rating */}
                    <div className="flex items-center gap-1 mt-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                                key={star}
                                size={14}
                                className={star <= 4 ? 'fill-accent-400 text-accent-400' : 'text-gray-300'}
                            />
                        ))}
                        <span className="text-sm text-gray-500 ml-1">(4.0)</span>
                    </div>

                    {/* Price */}
                    <div className="flex items-center gap-2 mt-3">
                        <span className="text-xl font-bold text-gray-900">
                            ₹{product.current_price.toLocaleString()}
                        </span>
                        {product.sale_price && (
                            <span className="text-sm text-gray-400 line-through">
                                ₹{product.price.toLocaleString()}
                            </span>
                        )}
                    </div>
                </div>
            </Link>
        </div>
    );
}
