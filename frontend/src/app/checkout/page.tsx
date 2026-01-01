'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, ShoppingBag, MapPin, CreditCard, ArrowLeft, Truck } from 'lucide-react';
import { useCart } from '@/lib/cart';
import { useCustomerAuth } from '@/context/CustomerAuthContext';

export default function CheckoutPage() {
    const router = useRouter();
    const { items, totalAmount, clearCart } = useCart();
    const { customer, isAuthenticated } = useCustomerAuth();
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orderPlaced, setOrderPlaced] = useState(false);
    const [orderId, setOrderId] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        pincode: '',
        notes: '',
    });

    // Pre-fill form with customer data
    useEffect(() => {
        if (isAuthenticated && customer) {
            setFormData(prev => ({
                ...prev,
                name: customer.name || '',
                email: customer.email || '',
                phone: customer.phone || '',
                address: customer.addresses?.[0]?.street || '',
                city: customer.addresses?.[0]?.city || '',
                pincode: customer.addresses?.[0]?.zipCode || ''
            }));
        }
    }, [isAuthenticated, customer]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Simulate order creation
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Generate order ID
        const newOrderId = 'MKX' + Math.random().toString().slice(2, 10);
        setOrderId(newOrderId);
        setOrderPlaced(true);
        clearCart();
        setIsSubmitting(false);
    };

    if (items.length === 0 && !orderPlaced) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
                <ShoppingBag size={80} className="text-gray-300 mb-6" />
                <h1 className="font-display text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h1>
                <p className="text-gray-500 mb-8">Add some products before checkout.</p>
                <Link href="/products" className="btn-primary">
                    Browse Products
                </Link>
            </div>
        );
    }

    if (orderPlaced) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 animate-bounce">
                    <Check size={40} className="text-green-600" />
                </div>
                <h1 className="font-display text-3xl font-bold text-gray-900 mb-2">Order Placed!</h1>
                <p className="text-gray-500 mb-2">Thank you for shopping with us.</p>
                <p className="text-lg font-semibold text-primary-600 mb-8">Order ID: {orderId}</p>
                <div className="flex gap-4">
                    <Link href={`/track-order?id=${orderId}`} className="btn-primary">
                        Track Order
                    </Link>
                    <Link href="/products" className="btn-secondary">
                        Continue Shopping
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Page Header */}
            <div className="bg-white border-b border-gray-100">
                <div className="container mx-auto px-4 py-6">
                    <Link href="/cart" className="inline-flex items-center gap-2 text-gray-600 hover:text-primary-600 mb-4">
                        <ArrowLeft size={18} /> Back to Cart
                    </Link>
                    <h1 className="font-display text-3xl font-bold text-gray-900">Checkout</h1>

                    {/* Progress Steps */}
                    <div className="flex items-center gap-4 mt-6">
                        {[
                            { num: 1, label: 'Delivery', icon: MapPin },
                            { num: 2, label: 'Payment', icon: CreditCard },
                            { num: 3, label: 'Confirm', icon: Check },
                        ].map((s, i) => (
                            <div key={s.num} className="flex items-center">
                                <div className={`flex items-center gap-2 ${step >= s.num ? 'text-primary-600' : 'text-gray-400'}`}>
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step > s.num ? 'bg-primary-600 text-white' : step === s.num ? 'bg-primary-100 text-primary-600' : 'bg-gray-100'
                                        }`}>
                                        {step > s.num ? <Check size={20} /> : <s.icon size={20} />}
                                    </div>
                                    <span className="hidden sm:block font-medium">{s.label}</span>
                                </div>
                                {i < 2 && <div className={`w-12 h-0.5 mx-2 ${step > s.num ? 'bg-primary-600' : 'bg-gray-200'}`} />}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Form Area */}
                    <div className="flex-1">
                        <form onSubmit={handleSubmit}>
                            {step === 1 && (
                                <div className="bg-white rounded-2xl shadow-sm p-6 animate-fade-in">
                                    <h2 className="font-display text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                        <MapPin className="text-primary-600" /> Delivery Details
                                    </h2>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                                            <input
                                                type="text"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleInputChange}
                                                required
                                                className="input-field"
                                                placeholder="John Doe"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                                            <input
                                                type="tel"
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleInputChange}
                                                required
                                                className="input-field"
                                                placeholder="+91 98765 43210"
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                                            <input
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                required
                                                className="input-field"
                                                placeholder="john@example.com"
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
                                            <textarea
                                                name="address"
                                                value={formData.address}
                                                onChange={handleInputChange}
                                                required
                                                rows={3}
                                                className="input-field resize-none"
                                                placeholder="House no, Street, Landmark..."
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                                            <input
                                                type="text"
                                                name="city"
                                                value={formData.city}
                                                onChange={handleInputChange}
                                                required
                                                className="input-field"
                                                placeholder="Mumbai"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Pincode *</label>
                                            <input
                                                type="text"
                                                name="pincode"
                                                value={formData.pincode}
                                                onChange={handleInputChange}
                                                required
                                                className="input-field"
                                                placeholder="400001"
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Order Notes (optional)</label>
                                            <textarea
                                                name="notes"
                                                value={formData.notes}
                                                onChange={handleInputChange}
                                                rows={2}
                                                className="input-field resize-none"
                                                placeholder="Special instructions for delivery..."
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => setStep(2)}
                                        className="btn-primary w-full mt-6"
                                    >
                                        Continue to Payment
                                    </button>
                                </div>
                            )}

                            {step === 2 && (
                                <div className="bg-white rounded-2xl shadow-sm p-6 animate-fade-in">
                                    <h2 className="font-display text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                        <CreditCard className="text-primary-600" /> Payment Method
                                    </h2>

                                    <div className="space-y-4">
                                        <label className="flex items-center gap-4 p-4 border-2 border-primary-600 rounded-xl cursor-pointer bg-primary-50">
                                            <input type="radio" name="payment" defaultChecked className="w-5 h-5 text-primary-600" />
                                            <div>
                                                <p className="font-semibold text-gray-900">Cash on Delivery</p>
                                                <p className="text-sm text-gray-500">Pay when you receive your order</p>
                                            </div>
                                        </label>
                                        <label className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl cursor-pointer hover:border-gray-300">
                                            <input type="radio" name="payment" disabled className="w-5 h-5" />
                                            <div>
                                                <p className="font-semibold text-gray-400">Online Payment</p>
                                                <p className="text-sm text-gray-400">Coming soon...</p>
                                            </div>
                                        </label>
                                    </div>

                                    <div className="flex gap-4 mt-6">
                                        <button
                                            type="button"
                                            onClick={() => setStep(1)}
                                            className="btn-secondary flex-1"
                                        >
                                            Back
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setStep(3)}
                                            className="btn-primary flex-1"
                                        >
                                            Review Order
                                        </button>
                                    </div>
                                </div>
                            )}

                            {step === 3 && (
                                <div className="bg-white rounded-2xl shadow-sm p-6 animate-fade-in">
                                    <h2 className="font-display text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                        <Check className="text-primary-600" /> Review & Confirm
                                    </h2>

                                    {/* Delivery Info */}
                                    <div className="bg-gray-50 rounded-xl p-4 mb-4">
                                        <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                            <Truck size={18} /> Delivery Address
                                        </h3>
                                        <p className="text-gray-700">{formData.name}</p>
                                        <p className="text-gray-600 text-sm">{formData.address}</p>
                                        <p className="text-gray-600 text-sm">{formData.city} - {formData.pincode}</p>
                                        <p className="text-gray-600 text-sm">{formData.phone}</p>
                                    </div>

                                    {/* Payment Method */}
                                    <div className="bg-gray-50 rounded-xl p-4 mb-4">
                                        <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                            <CreditCard size={18} /> Payment Method
                                        </h3>
                                        <p className="text-gray-700">Cash on Delivery</p>
                                    </div>

                                    {/* Order Items */}
                                    <div className="border-t border-gray-100 pt-4">
                                        <h3 className="font-semibold text-gray-900 mb-4">Order Items ({items.length})</h3>
                                        <div className="space-y-3">
                                            {items.map((item) => (
                                                <div key={item.product.id} className="flex justify-between items-center">
                                                    <div>
                                                        <p className="font-medium text-gray-900">{item.product.name}</p>
                                                        <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                                                    </div>
                                                    <p className="font-semibold">₹{(item.product.current_price * item.quantity).toLocaleString()}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex gap-4 mt-6">
                                        <button
                                            type="button"
                                            onClick={() => setStep(2)}
                                            className="btn-secondary flex-1"
                                        >
                                            Back
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="btn-primary flex-1 disabled:opacity-50"
                                        >
                                            {isSubmitting ? 'Placing Order...' : 'Place Order'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </form>
                    </div>

                    {/* Order Summary */}
                    <div className="lg:w-96">
                        <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-24">
                            <h2 className="font-display text-xl font-bold text-gray-900 mb-6">Order Summary</h2>

                            <div className="space-y-3 mb-4">
                                {items.slice(0, 3).map((item) => (
                                    <div key={item.product.id} className="flex gap-3">
                                        <div className="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <ShoppingBag size={20} className="text-gray-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-gray-900 text-sm line-clamp-1">{item.product.name}</p>
                                            <p className="text-sm text-gray-500">×{item.quantity}</p>
                                        </div>
                                        <p className="font-semibold text-sm">₹{(item.product.current_price * item.quantity).toLocaleString()}</p>
                                    </div>
                                ))}
                                {items.length > 3 && (
                                    <p className="text-sm text-gray-500 text-center">+{items.length - 3} more items</p>
                                )}
                            </div>

                            <div className="border-t border-gray-100 pt-4 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Subtotal</span>
                                    <span>₹{totalAmount.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Delivery</span>
                                    <span className="text-green-600">FREE</span>
                                </div>
                                <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-100">
                                    <span>Total</span>
                                    <span>₹{totalAmount.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
