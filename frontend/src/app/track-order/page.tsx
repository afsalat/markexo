'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Search, Package, Truc, CheckCircle, Clock, MapPin, AlertCircle, Truck } from 'lucide-react';

export default function TrackOrderPage() {
    const [orderId, setOrderId] = useState('');
    const [status, setStatus] = useState<'idle' | 'searching' | 'found' | 'error'>('idle');

    const handleTrack = (e: React.FormEvent) => {
        e.preventDefault();
        if (!orderId.trim()) return;

        setStatus('searching');

        // Simulate API call
        setTimeout(() => {
            if (orderId.includes('ERR')) {
                setStatus('error');
            } else {
                setStatus('found');
            }
        }, 1500);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Breadcrumb */}
            <div className="bg-white border-b border-gray-100">
                <div className="container mx-auto px-4 py-4">
                    <nav className="flex items-center gap-2 text-sm text-gray-500">
                        <Link href="/" className="hover:text-primary-600">Home</Link>
                        <ChevronRight size={16} />
                        <span className="text-gray-900 font-medium">Track Order</span>
                    </nav>
                </div>
            </div>

            <div className="container mx-auto px-4 py-12">
                <div className="max-w-2xl mx-auto">
                    <div className="text-center mb-10">
                        <h1 className="font-display text-3xl font-bold text-gray-900 mb-4">Track Your Order</h1>
                        <p className="text-gray-500">Enter your order ID to check the current status of your package.</p>
                    </div>

                    {/* Search Form */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm mb-8">
                        <form onSubmit={handleTrack} className="flex gap-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="text"
                                    placeholder="Enter Order ID (e.g. ORD-123456)"
                                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                                    value={orderId}
                                    onChange={(e) => setOrderId(e.target.value)}
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={status === 'searching' || !orderId.trim()}
                                className="btn-primary px-8 py-3 font-semibold disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {status === 'searching' ? 'Tracking...' : 'Track'}
                            </button>
                        </form>
                    </div>

                    {/* error state */}
                    {status === 'error' && (
                        <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-center animate-fade-in">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertCircle className="text-red-600" size={24} />
                            </div>
                            <h3 className="text-red-900 font-bold mb-1">Order Not Found</h3>
                            <p className="text-red-700 text-sm">We couldn&apos;t find an order with that ID. Please check and try again.</p>
                        </div>
                    )}

                    {/* Order Status */}
                    {status === 'found' && (
                        <div className="bg-white rounded-2xl overflow-hidden shadow-sm animate-fade-in">
                            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                                <div>
                                    <p className="text-sm text-gray-500">Order ID</p>
                                    <p className="font-bold text-gray-900">{orderId}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-gray-500">Expected Delivery</p>
                                    <p className="font-bold text-green-600">Today, 5:00 PM</p>
                                </div>
                            </div>

                            <div className="p-8">
                                <div className="relative">
                                    {/* Progress Line */}
                                    <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200" />

                                    {/* Comparison Steps */}
                                    <div className="space-y-8">
                                        {/* Step 1: Placed */}
                                        <div className="relative flex gap-6">
                                            <div className="w-16 h-16 rounded-full bg-green-100 border-4 border-white z-10 flex items-center justify-center flex-shrink-0">
                                                <CheckCircle className="text-green-600" size={24} />
                                            </div>
                                            <div className="pt-2">
                                                <h3 className="font-bold text-gray-900">Order Placed</h3>
                                                <p className="text-gray-500 text-sm">We have received your order</p>
                                                <p className="text-xs text-gray-400 mt-1">Dec 25, 10:30 AM</p>
                                            </div>
                                        </div>

                                        {/* Step 2: Confirmed */}
                                        <div className="relative flex gap-6">
                                            <div className="w-16 h-16 rounded-full bg-green-100 border-4 border-white z-10 flex items-center justify-center flex-shrink-0">
                                                <CheckCircle className="text-green-600" size={24} />
                                            </div>
                                            <div className="pt-2">
                                                <h3 className="font-bold text-gray-900">Order Confirmed</h3>
                                                <p className="text-gray-500 text-sm">Your order has been verified</p>
                                                <p className="text-xs text-gray-400 mt-1">Dec 25, 10:35 AM</p>
                                            </div>
                                        </div>

                                        {/* Step 3: Shipped */}
                                        <div className="relative flex gap-6">
                                            <div className="w-16 h-16 rounded-full bg-primary-100 border-4 border-white z-10 flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary-100">
                                                <Truck className="text-primary-600" size={24} />
                                            </div>
                                            <div className="pt-2">
                                                <h3 className="font-bold text-primary-600">Out for Delivery</h3>
                                                <p className="text-gray-600 text-sm">Agent is on the way to your location</p>
                                                <span className="inline-block px-3 py-1 bg-primary-50 text-primary-700 text-xs font-semibold rounded-full mt-2">
                                                    In Progress
                                                </span>
                                            </div>
                                        </div>

                                        {/* Step 4: Delivered */}
                                        <div className="relative flex gap-6">
                                            <div className="w-16 h-16 rounded-full bg-gray-100 border-4 border-white z-10 flex items-center justify-center flex-shrink-0">
                                                <MapPin className="text-gray-400" size={24} />
                                            </div>
                                            <div className="pt-2">
                                                <h3 className="font-bold text-gray-400">Delivered</h3>
                                                <p className="text-gray-400 text-sm">Package delivered to your address</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
