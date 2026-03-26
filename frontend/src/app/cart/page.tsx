'use client';

import Link from 'next/link';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '@/lib/cart';

export default function CartPage() {
    const { items, updateQuantity, removeItem, totalAmount, totalItems } = useCart();

    if (items.length === 0) {
        return (
            <div className="min-h-[60vh] bg-dark-900 flex flex-col items-center justify-center px-4" data-aos="fade-up">
                <ShoppingBag size={80} className="text-dark-600 mb-6" />
                <h1 className="font-display text-2xl font-bold text-white mb-2">Your cart is empty</h1>
                <p className="text-silver-500 mb-8">Looks like you haven&apos;t added anything yet.</p>
                <Link href="/products" className="btn-primary flex items-center gap-2">
                    Start Shopping <ArrowRight size={20} />
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-dark-900">
            {/* Page Header */}
            <div className="bg-dark-800 border-b border-dark-700" data-aos="fade-down" data-aos-delay="0">
                <div className="container mx-auto px-4 py-6">
                    <nav className="text-sm text-silver-500 mb-2">
                        <Link href="/" className="hover:text-accent-500 transition-colors">Home</Link>
                        <span className="mx-2">/</span>
                        <span className="text-white">Cart</span>
                    </nav>
                    <h1 className="font-display text-3xl font-bold text-white">Shopping Cart</h1>
                    <p className="text-silver-500 mt-1">{totalItems} items in your cart</p>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Cart Items */}
                    <div className="flex-1" data-aos="fade-right" data-aos-delay="100">
                        <div className="bg-dark-800 border border-dark-700 rounded-2xl overflow-hidden">
                            {items.map((item, index) => (
                                <div
                                    key={item.product.id}
                                    className={`flex gap-4 p-6 ${index !== 0 ? 'border-t border-dark-700' : ''}`}
                                >
                                    {/* Product Image */}
                                    <div className="w-24 h-24 bg-dark-700 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                                        {item.product.image ? (
                                            <img
                                                src={item.product.image}
                                                alt={item.product.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <ShoppingBag size={32} className="text-dark-500" />
                                        )}
                                    </div>

                                    {/* Product Info */}
                                    <div className="flex-1 min-w-0">
                                        <Link href={`/products/${item.product.slug}`}>
                                            <h3 className="font-semibold text-white hover:text-accent-500 transition-colors line-clamp-2">
                                                {item.product.name}
                                            </h3>
                                        </Link>

                                        {/* Price - Mobile */}
                                        <p className="text-lg font-bold text-white mt-2 lg:hidden">
                                            ₹{(item.product.current_price * item.quantity).toLocaleString()}
                                        </p>

                                        {/* Quantity Controls */}
                                        <div className="flex items-center gap-4 mt-4">
                                            <div className="flex items-center border-2 border-dark-600 rounded-lg overflow-hidden">
                                                <button
                                                    onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                                    className="w-10 h-10 flex items-center justify-center hover:bg-dark-700 transition-colors text-silver-300"
                                                >
                                                    <Minus size={16} />
                                                </button>
                                                <span className="w-12 text-center font-medium text-white">{item.quantity}</span>
                                                <button
                                                    onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                                    className="w-10 h-10 flex items-center justify-center hover:bg-dark-700 transition-colors text-silver-300"
                                                >
                                                    <Plus size={16} />
                                                </button>
                                            </div>
                                            <button
                                                onClick={() => removeItem(item.product.id)}
                                                className="text-red-500 hover:text-red-400 transition-colors"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Price - Desktop */}
                                    <div className="hidden lg:block text-right">
                                        <p className="text-xl font-bold text-white">
                                            ₹{(item.product.current_price * item.quantity).toLocaleString()}
                                        </p>
                                        {item.quantity > 1 && (
                                            <p className="text-sm text-silver-500">
                                                ₹{item.product.current_price.toLocaleString()} each
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Order Summary */}
                    <div className="lg:w-96" data-aos="fade-left" data-aos-delay="200">
                        <div className="bg-dark-800 border border-dark-700 rounded-2xl p-6 sticky top-24">
                            <h2 className="font-display text-xl font-bold text-white mb-6">Order Summary</h2>

                            <div className="space-y-4">
                                <div className="flex justify-between">
                                    <span className="text-silver-400">Subtotal ({totalItems} items)</span>
                                    <span className="font-medium text-white">₹{totalAmount.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-silver-400">Delivery</span>
                                    <span className="font-medium text-green-400">FREE</span>
                                </div>
                                <div className="border-t border-dark-700 pt-4">
                                    <div className="flex justify-between">
                                        <span className="text-lg font-semibold text-white">Total</span>
                                        <span className="text-xl font-bold text-white">₹{totalAmount.toLocaleString()}</span>
                                    </div>
                                    <p className="text-sm text-silver-500 mt-1">Including all taxes</p>
                                </div>
                            </div>

                            {/* Coupon Code */}
                            <div className="mt-6">
                                <label className="block text-sm font-medium text-silver-300 mb-2">Coupon Code</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Enter code"
                                        className="flex-1 px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-silver-500 focus:border-accent-500 outline-none"
                                    />
                                    <button className="btn-secondary py-2 px-4 text-sm">Apply</button>
                                </div>
                            </div>

                            <Link href="/checkout" className="btn-primary w-full mt-6 text-center flex items-center justify-center gap-2">
                                Proceed to Checkout <ArrowRight size={20} />
                            </Link>

                            <Link href="/products" className="block text-center text-accent-500 font-medium mt-4 hover:underline">
                                Continue Shopping
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
