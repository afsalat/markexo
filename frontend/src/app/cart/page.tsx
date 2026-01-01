'use client';

import Link from 'next/link';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '@/lib/cart';

export default function CartPage() {
    const { items, updateQuantity, removeItem, totalAmount, totalItems } = useCart();

    if (items.length === 0) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
                <ShoppingBag size={80} className="text-gray-300 mb-6" />
                <h1 className="font-display text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h1>
                <p className="text-gray-500 mb-8">Looks like you haven&apos;t added anything yet.</p>
                <Link href="/products" className="btn-primary flex items-center gap-2">
                    Start Shopping <ArrowRight size={20} />
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Page Header */}
            <div className="bg-white border-b border-gray-100">
                <div className="container mx-auto px-4 py-6">
                    <nav className="text-sm text-gray-500 mb-2">
                        <Link href="/" className="hover:text-primary-600">Home</Link>
                        <span className="mx-2">/</span>
                        <span className="text-gray-900">Cart</span>
                    </nav>
                    <h1 className="font-display text-3xl font-bold text-gray-900">Shopping Cart</h1>
                    <p className="text-gray-500 mt-1">{totalItems} items in your cart</p>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Cart Items */}
                    <div className="flex-1">
                        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                            {items.map((item, index) => (
                                <div
                                    key={item.product.id}
                                    className={`flex gap-4 p-6 ${index !== 0 ? 'border-t border-gray-100' : ''}`}
                                >
                                    {/* Product Image */}
                                    <div className="w-24 h-24 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                        <ShoppingBag size={32} className="text-gray-400" />
                                    </div>

                                    {/* Product Info */}
                                    <div className="flex-1 min-w-0">
                                        <Link href={`/products/${item.product.slug}`}>
                                            <h3 className="font-semibold text-gray-900 hover:text-primary-600 transition-colors line-clamp-2">
                                                {item.product.name}
                                            </h3>
                                        </Link>
                                        {item.product.shop && (
                                            <p className="text-sm text-gray-500 mt-1">by {item.product.shop.name}</p>
                                        )}

                                        {/* Price - Mobile */}
                                        <p className="text-lg font-bold text-gray-900 mt-2 lg:hidden">
                                            ₹{(item.product.current_price * item.quantity).toLocaleString()}
                                        </p>

                                        {/* Quantity Controls */}
                                        <div className="flex items-center gap-4 mt-4">
                                            <div className="flex items-center border border-gray-200 rounded-lg">
                                                <button
                                                    onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                                    className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 transition-colors"
                                                >
                                                    <Minus size={16} />
                                                </button>
                                                <span className="w-12 text-center font-medium">{item.quantity}</span>
                                                <button
                                                    onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                                    className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 transition-colors"
                                                >
                                                    <Plus size={16} />
                                                </button>
                                            </div>
                                            <button
                                                onClick={() => removeItem(item.product.id)}
                                                className="text-red-500 hover:text-red-600 transition-colors"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Price - Desktop */}
                                    <div className="hidden lg:block text-right">
                                        <p className="text-xl font-bold text-gray-900">
                                            ₹{(item.product.current_price * item.quantity).toLocaleString()}
                                        </p>
                                        {item.quantity > 1 && (
                                            <p className="text-sm text-gray-500">
                                                ₹{item.product.current_price.toLocaleString()} each
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Order Summary */}
                    <div className="lg:w-96">
                        <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-24">
                            <h2 className="font-display text-xl font-bold text-gray-900 mb-6">Order Summary</h2>

                            <div className="space-y-4">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Subtotal ({totalItems} items)</span>
                                    <span className="font-medium">₹{totalAmount.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Delivery</span>
                                    <span className="font-medium text-green-600">FREE</span>
                                </div>
                                <div className="border-t border-gray-100 pt-4">
                                    <div className="flex justify-between">
                                        <span className="text-lg font-semibold text-gray-900">Total</span>
                                        <span className="text-xl font-bold text-gray-900">₹{totalAmount.toLocaleString()}</span>
                                    </div>
                                    <p className="text-sm text-gray-500 mt-1">Including all taxes</p>
                                </div>
                            </div>

                            {/* Coupon Code */}
                            <div className="mt-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Coupon Code</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Enter code"
                                        className="flex-1 input-field py-2"
                                    />
                                    <button className="btn-secondary py-2 px-4 text-sm">Apply</button>
                                </div>
                            </div>

                            <Link href="/checkout" className="btn-primary w-full mt-6 text-center flex items-center justify-center gap-2">
                                Proceed to Checkout <ArrowRight size={20} />
                            </Link>

                            <Link href="/products" className="block text-center text-primary-600 font-medium mt-4 hover:underline">
                                Continue Shopping
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
