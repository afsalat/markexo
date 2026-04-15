'use client';

import Link from 'next/link';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '@/lib/cart';

export default function CartPage() {
    const { items, updateQuantity, removeItem, totalAmount, totalItems } = useCart();

    if (items.length === 0) {
        return (
            <div className="min-h-[60vh] bg-gray-50 flex flex-col items-center justify-center px-4" data-aos="fade-up">
                <ShoppingBag size={80} className="text-gray-300 mb-6" />
                <h1 className="font-display text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h1>
                <p className="text-gray-500 mb-8 font-medium">Looks like you haven&apos;t added anything yet.</p>
                <Link href="/products" className="btn-primary flex items-center gap-2 shadow-lg shadow-accent-500/20">
                    Start Shopping <ArrowRight size={20} />
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Page Header */}
            <div className="bg-white border-b border-gray-200" data-aos="fade-down" data-aos-delay="0">
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

            <div className="container mx-auto px-4 py-10">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Cart Items */}
                    <div className="flex-1" data-aos="fade-right" data-aos-delay="100">
                        <div className="bg-white border border-gray-100 shadow-sm rounded-2xl overflow-hidden">
                            {items.map((item, index) => (
                                <div
                                    key={item.product.id}
                                    className={`flex gap-5 p-6 ${index !== 0 ? 'border-t border-gray-100' : ''}`}
                                >
                                    {/* Product Image */}
                                    <div className="w-24 h-24 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                                        {item.product.image ? (
                                            <img
                                                src={item.product.image}
                                                alt={item.product.name}
                                                className="w-full h-full object-cover mix-blend-multiply"
                                            />
                                        ) : (
                                            <ShoppingBag size={32} className="text-gray-300" />
                                        )}
                                    </div>

                                    {/* Product Info */}
                                    <div className="flex-1 min-w-0">
                                        <Link href={`/products/${item.product.slug}`}>
                                            <h3 className="font-bold text-gray-900 hover:text-accent-600 transition-colors line-clamp-2 text-base">
                                                {item.product.name}
                                            </h3>
                                        </Link>

                                        {/* Price - Mobile */}
                                        <p className="text-lg font-black text-gray-900 mt-2 lg:hidden">
                                            ₹{(item.product.current_price * item.quantity).toLocaleString()}
                                        </p>

                                        {/* Quantity Controls */}
                                        <div className="flex items-center gap-4 mt-4">
                                            <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                                                <button
                                                    onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                                    className="w-9 h-9 flex items-center justify-center hover:bg-gray-50 transition-colors text-gray-500 hover:text-black"
                                                >
                                                    <Minus size={14} strokeWidth={2.5} />
                                                </button>
                                                <span className="w-10 text-center font-bold text-gray-900 text-sm select-none">{item.quantity}</span>
                                                <button
                                                    onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                                    className="w-9 h-9 flex items-center justify-center hover:bg-gray-50 transition-colors text-gray-500 hover:text-black"
                                                >
                                                    <Plus size={14} strokeWidth={2.5} />
                                                </button>
                                            </div>
                                            <button
                                                onClick={() => removeItem(item.product.id)}
                                                className="text-red-500 hover:text-red-600 hover:bg-red-50 px-2.5 py-1.5 rounded-md transition-colors flex items-center gap-1.5 text-sm font-bold"
                                            >
                                                <Trash2 size={16} />
                                                <span className="hidden sm:inline">Remove</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Price - Desktop */}
                                    <div className="hidden lg:block text-right pl-4">
                                        <p className="text-xl font-black text-gray-900">
                                            ₹{(item.product.current_price * item.quantity).toLocaleString()}
                                        </p>
                                        {item.quantity > 1 && (
                                            <p className="text-sm font-semibold text-gray-400 mt-1">
                                                ₹{item.product.current_price.toLocaleString()} each
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Order Summary */}
                    <div className="lg:w-[380px]" data-aos="fade-left" data-aos-delay="200">
                        <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6 md:p-8 sticky top-[100px]">
                            <h2 className="font-display text-xl font-bold text-gray-900 mb-6">Order Summary</h2>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600 font-medium text-sm">Subtotal ({totalItems} items)</span>
                                    <span className="font-bold text-gray-900">₹{totalAmount.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600 font-medium text-sm">Delivery</span>
                                    <span className="font-bold text-[#00E5FF]">FREE</span>
                                </div>
                                <div className="border-t border-gray-100 pt-5 mt-3">
                                    <div className="flex justify-between items-end">
                                        <div className="flex flex-col">
                                            <span className="text-lg font-bold text-gray-900">Total</span>
                                            <span className="text-xs text-gray-400 font-medium mt-0.5">Including all taxes</span>
                                        </div>
                                        <span className="text-2xl font-black text-gray-900">₹{totalAmount.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Coupon Code */}
                            <div className="mt-8">
                                <label className="block text-sm font-bold text-gray-800 mb-2">Promo Code</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Enter code"
                                        className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:border-accent-500 focus:bg-white focus:ring-4 focus:ring-accent-500/10 outline-none transition-all font-medium text-sm"
                                    />
                                    <button className="bg-black text-white hover:bg-gray-800 font-bold rounded-xl py-2.5 px-5 text-sm transition-colors shadow-md">Apply</button>
                                </div>
                            </div>

                            <Link href="/checkout" className="btn-primary w-full mt-8 text-center flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold shadow-xl shadow-accent-500/20">
                                Proceed to Checkout <ArrowRight size={20} />
                            </Link>

                            <Link href="/products" className="block text-center text-sm font-bold text-gray-500 mt-5 hover:text-black transition-colors">
                                Continue Shopping
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
