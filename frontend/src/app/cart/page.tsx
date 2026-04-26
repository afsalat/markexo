'use client';

import Link from 'next/link';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Tag, ChevronRight } from 'lucide-react';
import { useCart } from '@/lib/cart';

export default function CartPage() {
    const { items, updateQuantity, removeItem, totalAmount, totalItems } = useCart();

    if (items.length === 0) {
        return (
            <div className="min-h-[80vh] bg-gray-50 flex flex-col items-center justify-center px-6" data-aos="fade-up">
                <div className="w-24 h-24 bg-accent-50 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-accent-500/10">
                    <ShoppingBag size={44} className="text-accent-400" />
                </div>
                <h1 className="font-display text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h1>
                <p className="text-gray-500 mb-8 font-medium text-center text-sm">Looks like you haven&apos;t added anything yet.</p>
                <Link href="/products" className="btn-primary flex items-center gap-2 shadow-lg shadow-accent-500/20 px-8 py-3 rounded-2xl text-base font-bold">
                    Start Shopping <ArrowRight size={18} />
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-32 lg:pb-10">
            {/* Mobile Header */}
            <div className="lg:hidden bg-white border-b border-gray-100 px-4 py-3 sticky top-0 z-30 shadow-sm">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="font-display text-lg font-bold text-gray-900">My Cart</h1>
                        <p className="text-xs text-gray-400 font-medium">{totalItems} item{totalItems !== 1 ? 's' : ''}</p>
                    </div>
                    <Link href="/products" className="text-accent-600 text-sm font-bold flex items-center gap-1">
                        + Add More <ChevronRight size={14} />
                    </Link>
                </div>
            </div>

            {/* Desktop Header */}
            <div className="hidden lg:block bg-white border-b border-gray-200">
                <div className="container mx-auto px-4 py-8">
                    <nav className="text-sm text-gray-500 mb-2 font-medium">
                        <Link href="/" className="hover:text-accent-600 transition-colors">Home</Link>
                        <span className="mx-2">/</span>
                        <span className="text-gray-900">Cart</span>
                    </nav>
                    <h1 className="font-display text-3xl font-bold text-gray-900 tracking-tight">Shopping Cart</h1>
                    <p className="text-gray-500 mt-1 font-medium">{totalItems} items in your cart</p>
                </div>
            </div>

            <div className="container mx-auto px-0 lg:px-4 py-0 lg:py-10">
                <div className="flex flex-col lg:flex-row gap-0 lg:gap-8">

                    {/* Cart Items */}
                    <div className="flex-1" data-aos="fade-right" data-aos-delay="100">
                        <div className="bg-white lg:border lg:border-gray-100 lg:shadow-sm lg:rounded-2xl overflow-hidden divide-y divide-gray-50">
                            {items.map((item) => (
                                <div key={item.product.id} className="flex gap-3 px-4 py-4 lg:gap-5 lg:p-6 hover:bg-gray-50/50 transition-colors">
                                    {/* Product Image */}
                                    <Link href={`/products/${item.product.slug}`} className="w-20 h-20 lg:w-24 lg:h-24 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden shadow-sm">
                                        {item.product.image ? (
                                            <img
                                                src={item.product.image}
                                                alt={item.product.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <ShoppingBag size={28} className="text-gray-300" />
                                        )}
                                    </Link>

                                    {/* Product Info */}
                                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                                        <div>
                                            <Link href={`/products/${item.product.slug}`}>
                                                <h3 className="font-bold text-gray-900 hover:text-accent-600 transition-colors line-clamp-2 text-sm lg:text-base leading-snug">
                                                    {item.product.name}
                                                </h3>
                                            </Link>
                                            <p className="text-base lg:text-lg font-black text-gray-900 mt-1">
                                                ₹{(item.product.current_price * item.quantity).toLocaleString()}
                                            </p>
                                            {item.quantity > 1 && (
                                                <p className="text-[11px] text-gray-400 font-medium">₹{item.product.current_price.toLocaleString()} each</p>
                                            )}
                                        </div>

                                        {/* Quantity Controls */}
                                        <div className="flex items-center justify-between mt-2">
                                            <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
                                                <button
                                                    onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                                    className="w-8 h-8 lg:w-9 lg:h-9 flex items-center justify-center hover:bg-gray-100 transition-colors text-gray-500"
                                                >
                                                    <Minus size={13} strokeWidth={2.5} />
                                                </button>
                                                <span className="w-9 text-center font-bold text-gray-900 text-sm select-none">{item.quantity}</span>
                                                <button
                                                    onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                                    className="w-8 h-8 lg:w-9 lg:h-9 flex items-center justify-center hover:bg-gray-100 transition-colors text-gray-500"
                                                >
                                                    <Plus size={13} strokeWidth={2.5} />
                                                </button>
                                            </div>
                                            <button
                                                onClick={() => removeItem(item.product.id)}
                                                className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-xl transition-colors"
                                                aria-label="Remove item"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Order Summary */}
                    <div className="lg:w-[380px]" data-aos="fade-left" data-aos-delay="200">
                        <div className="bg-white lg:border lg:border-gray-100 lg:shadow-sm lg:rounded-2xl p-4 lg:p-8 lg:sticky lg:top-[100px] mt-2 lg:mt-0">
                            <h2 className="font-display text-base lg:text-xl font-bold text-gray-900 mb-4 lg:mb-6">Order Summary</h2>

                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-500 font-medium text-sm">Subtotal ({totalItems} items)</span>
                                    <span className="font-bold text-gray-900 text-sm">₹{totalAmount.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-500 font-medium text-sm">Delivery</span>
                                    <span className="font-bold text-emerald-500 bg-emerald-50 px-2.5 py-0.5 rounded-full text-sm">FREE</span>
                                </div>
                                <div className="border-t border-gray-100 pt-3 mt-1">
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <span className="text-base lg:text-lg font-bold text-gray-900">Total</span>
                                            <p className="text-xs text-gray-400 font-medium">Including all taxes</p>
                                        </div>
                                        <span className="text-xl lg:text-2xl font-black text-gray-900">₹{totalAmount.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Promo Code */}
                            <div className="mt-4 lg:mt-8">
                                <label className="block text-xs lg:text-sm font-bold text-gray-800 mb-2 flex items-center gap-1.5">
                                    <Tag size={13} className="text-accent-500" /> Promo Code
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Enter code"
                                        className="flex-1 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:border-accent-500 focus:bg-white focus:ring-2 focus:ring-accent-500/10 outline-none transition-all font-medium text-sm"
                                    />
                                    <button className="bg-gray-900 text-white hover:bg-gray-700 font-bold rounded-xl py-2.5 px-4 text-sm transition-colors">Apply</button>
                                </div>
                            </div>

                            {/* Desktop CTA */}
                            <Link href="/checkout" className="hidden lg:flex btn-primary w-full mt-6 items-center justify-center gap-2 py-3.5 rounded-2xl font-bold shadow-xl shadow-accent-500/20 text-base">
                                Proceed to Checkout <ArrowRight size={18} />
                            </Link>
                            <Link href="/products" className="hidden lg:block text-center text-sm font-bold text-gray-400 mt-4 hover:text-black transition-colors">
                                Continue Shopping
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Sticky Bottom CTA */}
            <div className="lg:hidden fixed bottom-16 left-0 right-0 z-[70] bg-white/95 backdrop-blur-lg border-t border-gray-100 px-4 py-3 shadow-[0_-8px_30px_rgba(0,0,0,0.08)]">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-500 font-medium">Total</span>
                    <span className="text-xl font-black text-gray-900">₹{totalAmount.toLocaleString()}</span>
                </div>
                <Link href="/checkout" className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-base shadow-lg shadow-accent-500/20">
                    Checkout <ArrowRight size={18} />
                </Link>
            </div>
        </div>
    );
}
