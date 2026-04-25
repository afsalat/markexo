'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ChevronRight, Search, Package, CheckCircle, Clock, MapPin, AlertCircle, Truck, User, ShoppingBag } from 'lucide-react';
import { useCustomerAuth } from '@/context/CustomerAuthContext';
import { API_BASE_URL } from '@/config/apiConfig';

function TrackOrderContent() {
    const searchParams = useSearchParams();
    const { isAuthenticated, customer, orders } = useCustomerAuth();
    const [orderId, setOrderId] = useState('');
    const [status, setStatus] = useState<'idle' | 'searching' | 'found' | 'error'>('idle');
    const [orderData, setOrderData] = useState<any>(null);

    // Auto-track if order ID is in URL
    useEffect(() => {
        const urlOrderId = searchParams?.get('id');
        if (urlOrderId) {
            setOrderId(urlOrderId);
            fetchOrderData(urlOrderId);
        } else {
            // Reset state when no order ID in URL
            setOrderId('');
            setOrderData(null);
            setStatus('idle');
        }
    }, [searchParams]);

    const fetchOrderData = async (id: string) => {
        setStatus('searching');
        try {
            const apiUrl = `${API_BASE_URL}/orders/${id}/`;
            const response = await fetch(apiUrl);

            if (!response.ok) {
                throw new Error('Order not found');
            }

            const data = await response.json();
            setOrderData(data);
            setStatus('found');
        } catch (error) {
            console.error('Error fetching order:', error);
            setStatus('error');
        }
    };

    const handleTrack = (e: React.FormEvent) => {
        e.preventDefault();
        if (!orderId.trim()) return;
        fetchOrderData(orderId);
    };

    // Helper function to determine step status based on order status
    const getStepStatus = (orderStatus: string, step: number) => {
        const statusMap: { [key: string]: number } = {
            'pending_verification': 1,
            'pending': 1,
            'confirmed': 2,
            'ordered_from_meesho': 3,
            'processing': 3,
            'shipped': 4,
            'out_for_delivery': 5,
            'delivered': 6,
            'completed': 6,
            'cancelled': 0,
            'rto': 0,
        };

        const currentStep = statusMap[orderStatus?.toLowerCase().replace(/ /g, '_')] || statusMap[orderStatus?.toLowerCase()] || 1;

        if (step <= currentStep) {
            return 'completed';
        } else if (step === currentStep + 1) {
            return 'current';
        }
        return 'pending';
    };

    // Helper function to get timestamp for a specific step from status_history
    const getStepTimestamp = (statusHistory: any[], step: number) => {
        if (!statusHistory || statusHistory.length === 0) return null;

        const statusesForStep: { [key: number]: string[] } = {
            1: ['pending_verification', 'pending'],
            2: ['confirmed'],
            3: ['ordered_from_meesho', 'processing'],
            4: ['shipped'],
            5: ['out_for_delivery'],
            6: ['delivered', 'completed'],
        };

        const targetStatuses = statusesForStep[step] || [];
        const historyEntry = statusHistory.find(h =>
            targetStatuses.includes(h.status?.toLowerCase())
        );

        return historyEntry?.changed_at || null;
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-dark-950">
            {/* Breadcrumb */}
            <div className="bg-white dark:bg-dark-800 border-b border-gray-100 dark:border-dark-700">
                <div className="container mx-auto px-4 py-4">
                    <nav className="flex items-center gap-2 text-sm text-gray-500 dark:text-silver-500">
                        <Link href="/" className="hover:text-primary-600 dark:hover:text-accent-500">Home</Link>
                        <ChevronRight size={16} />
                        <span className="text-gray-900 dark:text-white font-medium">Track Order</span>
                    </nav>
                </div>
            </div>

            <div className="container mx-auto px-4 py-12">
                {/* If a specific order is being tracked (URL param or search result), show only that order */}
                {(status === 'found' && orderData) ? (
                    <div className="max-w-2xl mx-auto">
                        <div className="text-center mb-10">
                            <h1 className="font-display text-4xl font-bold text-gray-900 dark:text-white mb-4">Order Details</h1>
                            <p className="text-gray-500 dark:text-silver-400">Track the status of your order below.</p>
                        </div>

                        {/* Order Status Card */}
                        <div className="bg-white dark:bg-gradient-to-br dark:from-dark-800 dark:to-dark-900 border border-gray-100 dark:border-dark-700 rounded-3xl overflow-hidden animate-fade-in shadow-xl dark:shadow-2xl">
                            {/* Header with Order ID and Status */}
                            <div className="bg-gray-50 dark:bg-gradient-to-r dark:from-dark-700 dark:to-dark-800 px-8 py-6 flex flex-wrap justify-between items-center gap-4 border-b border-gray-100 dark:border-dark-600">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-white dark:bg-accent-500/20 flex items-center justify-center shadow-sm">
                                        <Package className="text-primary-600 dark:text-accent-500" size={24} />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-silver-500 uppercase tracking-wider font-semibold">Order ID</p>
                                        <p className="font-bold text-xl text-primary-600 dark:text-accent-400">{orderData.order_id}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-gray-500 dark:text-silver-500 uppercase tracking-wider font-semibold">Current Status</p>
                                    <span className={`inline-block px-4 py-1.5 rounded-full text-sm font-bold mt-1 ${orderData.status?.toLowerCase() === 'delivered' || orderData.status?.toLowerCase() === 'completed'
                                        ? 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400'
                                        : orderData.status?.toLowerCase() === 'shipped'
                                            ? 'bg-blue-100 dark:bg-accent-500/20 text-blue-600 dark:text-accent-400'
                                            : orderData.status?.toLowerCase().includes('return') || orderData.status?.toLowerCase() === 'rto'
                                                ? 'bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400'
                                                : orderData.status?.toLowerCase() === 'cancelled'
                                                    ? 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400'
                                                    : 'bg-primary-100 dark:bg-blue-500/20 text-primary-600 dark:text-blue-400'
                                        }`}>
                                        {orderData.status_display || orderData.status}
                                    </span>
                                </div>
                            </div>


                            {/* Progress Bar Section - Only show for active delivery orders */}
                            {!orderData.status?.toLowerCase().includes('return') &&
                                orderData.status?.toLowerCase() !== 'rto' &&
                                orderData.status?.toLowerCase() !== 'cancelled' && (
                                    <div className="px-8 py-10">
                                        <div className="flex items-start justify-between relative">
                                            {/* Progress Line Background */}
                                            <div className="absolute left-8 right-8 top-6 h-1 bg-gray-100 dark:bg-dark-600 rounded-full" />
                                            {/* Progress Line Filled with Gradient */}
                                            <div
                                                className="absolute left-8 top-6 h-1 bg-gradient-to-r from-green-500 via-primary-500 dark:via-accent-500 to-green-400 rounded-full transition-all duration-700"
                                                style={{
                                                    width: (() => {
                                                        const statusMap: { [key: string]: number } = {
                                                            'pending_verification': 1, 'pending verification': 1, 'pending': 1,
                                                            'confirmed': 2, 'ordered_from_meesho': 3, 'processing': 3,
                                                            'shipped': 4, 'out_for_delivery': 5, 'delivered': 6, 'completed': 6
                                                        };
                                                        const step = statusMap[orderData.status?.toLowerCase().replace(/ /g, '_')] || statusMap[orderData.status?.toLowerCase()] || 1;
                                                        if (step >= 6) return 'calc(100% - 64px)';
                                                        if (step >= 5) return 'calc(80% - 51px)';
                                                        if (step >= 4) return 'calc(60% - 38px)';
                                                        if (step >= 3) return 'calc(40% - 26px)';
                                                        if (step >= 2) return 'calc(20% - 13px)';
                                                        return '0%';
                                                    })()
                                                }}
                                            />

                                            {/* Step 1: Pending */}
                                            <div className="flex flex-col items-center z-10 group">
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 border-2 ${getStepStatus(orderData.status, 1) === 'completed'
                                                    ? 'bg-green-500 border-green-600 shadow-lg shadow-green-500/30'
                                                    : 'bg-white dark:bg-dark-700 border-gray-100 dark:border-dark-500 shadow-sm'
                                                    }`}>
                                                    <Clock className={getStepStatus(orderData.status, 1) === 'completed' ? 'text-white' : 'text-gray-400 dark:text-silver-500'} size={20} />
                                                </div>
                                                <p className={`text-[10px] mt-3 font-bold uppercase tracking-wide ${getStepStatus(orderData.status, 1) === 'completed' ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>Pending</p>
                                            </div>

                                            {/* Step 2: Confirmed */}
                                            <div className="flex flex-col items-center z-10 group">
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 border-2 ${getStepStatus(orderData.status, 2) === 'completed'
                                                    ? 'bg-green-500 border-green-600 shadow-lg shadow-green-500/30'
                                                    : 'bg-white dark:bg-dark-700 border-gray-100 dark:border-dark-500 shadow-sm'
                                                    }`}>
                                                    <CheckCircle className={getStepStatus(orderData.status, 2) === 'completed' ? 'text-white' : 'text-gray-400 dark:text-silver-500'} size={20} />
                                                </div>
                                                <p className={`text-[10px] mt-3 font-bold uppercase tracking-wide ${getStepStatus(orderData.status, 2) === 'completed' ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>Confirmed</p>
                                            </div>

                                            {/* Step 3: Processing */}
                                            <div className="flex flex-col items-center z-10 group">
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 border-2 ${getStepStatus(orderData.status, 3) === 'completed'
                                                    ? 'bg-green-500 border-green-600 shadow-lg shadow-green-500/30'
                                                    : 'bg-white dark:bg-dark-700 border-gray-100 dark:border-dark-500 shadow-sm'
                                                    }`}>
                                                    <Package className={getStepStatus(orderData.status, 3) === 'completed' ? 'text-white' : 'text-gray-400 dark:text-silver-500'} size={20} />
                                                </div>
                                                <p className={`text-[10px] mt-3 font-bold uppercase tracking-wide ${getStepStatus(orderData.status, 3) === 'completed' ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>Processing</p>
                                            </div>

                                            {/* Step 4: Shipped */}
                                            <div className="flex flex-col items-center z-10 group">
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 border-2 ${getStepStatus(orderData.status, 4) === 'completed'
                                                    ? 'bg-primary-500 border-primary-600 shadow-lg shadow-primary-500/30'
                                                    : 'bg-white dark:bg-dark-700 border-gray-100 dark:border-dark-500 shadow-sm'
                                                    }`}>
                                                    <Truck className={getStepStatus(orderData.status, 4) === 'completed' ? 'text-white' : 'text-gray-400 dark:text-silver-500'} size={20} />
                                                </div>
                                                <p className={`text-[10px] mt-3 font-bold uppercase tracking-wide ${getStepStatus(orderData.status, 4) === 'completed' ? 'text-primary-600 dark:text-accent-500' : 'text-gray-400'}`}>Shipped</p>
                                            </div>

                                            {/* Step 5: Out for Delivery */}
                                            <div className="flex flex-col items-center z-10 group">
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 border-2 ${getStepStatus(orderData.status, 5) === 'completed'
                                                    ? 'bg-primary-500 border-primary-600 shadow-lg shadow-primary-500/30'
                                                    : 'bg-white dark:bg-dark-700 border-gray-100 dark:border-dark-500 shadow-sm'
                                                    }`}>
                                                    <Truck className={getStepStatus(orderData.status, 5) === 'completed' ? 'text-white' : 'text-gray-400 dark:text-silver-500'} size={20} />
                                                </div>
                                                <p className={`text-[10px] mt-3 font-bold uppercase tracking-wide ${getStepStatus(orderData.status, 5) === 'completed' ? 'text-primary-600 dark:text-accent-500' : 'text-gray-400'}`}>Out for Delivery</p>
                                            </div>

                                            {/* Step 6: Delivered */}
                                            <div className="flex flex-col items-center z-10 group">
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 border-2 ${getStepStatus(orderData.status, 6) === 'completed'
                                                    ? 'bg-green-500 border-green-600 shadow-lg shadow-green-500/30'
                                                    : 'bg-white dark:bg-dark-700 border-gray-100 dark:border-dark-500 shadow-sm'
                                                    }`}>
                                                    <MapPin className={getStepStatus(orderData.status, 6) === 'completed' ? 'text-white' : 'text-gray-400 dark:text-silver-500'} size={20} />
                                                </div>
                                                <p className={`text-[10px] mt-3 font-bold uppercase tracking-wide ${getStepStatus(orderData.status, 6) === 'completed' ? 'text-green-500' : 'text-gray-400'}`}>Delivered</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                            {/* Return/RTO Information Banner */}
                            {(orderData.status?.toLowerCase().includes('return') || orderData.status?.toLowerCase() === 'rto' || orderData.status?.toLowerCase() === 'cancelled') && (
                                <div className="px-8 py-8">
                                    <div className={`${(orderData.refund_status === 'refunded' || orderData.payment_status === 'refunded')
                                        ? 'bg-green-50 dark:bg-green-500/10 border-green-100 dark:border-green-500/30'
                                        : 'bg-orange-50 dark:bg-orange-500/10 border-orange-100 dark:border-orange-500/30'
                                        } border rounded-2xl p-6`}>
                                        <div className="flex items-start gap-4">
                                            <div className={`w-12 h-12 ${(orderData.refund_status === 'refunded' || orderData.payment_status === 'refunded')
                                                ? 'bg-green-100 dark:bg-green-500/20'
                                                : 'bg-orange-100 dark:bg-orange-500/20'
                                                } rounded-full flex items-center justify-center shrink-0`}>
                                                {(orderData.refund_status === 'refunded' || orderData.payment_status === 'refunded') ? (
                                                    <CheckCircle className="text-green-600 dark:text-green-400" size={24} />
                                                ) : (
                                                    <AlertCircle className="text-orange-600 dark:text-orange-400" size={24} />
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                                                    {(orderData.refund_status === 'refunded' || orderData.payment_status === 'refunded') ? (
                                                        orderData.status?.toLowerCase() === 'cancelled' ? 'Order Cancelled - Refund Completed' :
                                                            orderData.status?.toLowerCase() === 'rto' ? 'RTO - Refund Completed' :
                                                                'Return Completed - Refund Processed'
                                                    ) : (
                                                        orderData.status?.toLowerCase() === 'cancelled' ? 'Order Cancelled' :
                                                            orderData.status?.toLowerCase() === 'rto' ? 'Returned to Origin (RTO)' :
                                                                'Order Returned'
                                                    )}
                                                </h3>
                                                {orderData.return_reason && (
                                                    <div className="mb-3">
                                                        <p className="text-xs text-gray-500 dark:text-silver-500 uppercase tracking-wider mb-1">Return Reason</p>
                                                        <p className="text-gray-700 dark:text-silver-300 whitespace-pre-wrap">
                                                            {orderData.return_reason}
                                                        </p>
                                                    </div>
                                                )}
                                                {orderData.cancellation_reason && (
                                                    <div className="mb-3">
                                                        <p className="text-xs text-gray-500 dark:text-silver-500 uppercase tracking-wider mb-1">Cancellation Reason</p>
                                                        <p className="text-gray-700 dark:text-silver-300 whitespace-pre-wrap">{orderData.cancellation_reason}</p>
                                                    </div>
                                                )}
                                                {(orderData.refund_status && orderData.refund_status !== 'not_applicable') || orderData.payment_status === 'refunded' ? (
                                                    <div className="flex items-center gap-2 mt-3">
                                                        <p className="text-xs text-gray-500 dark:text-silver-500 uppercase tracking-wider">Refund Status:</p>
                                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${orderData.refund_status === 'refunded' || orderData.payment_status === 'refunded'
                                                            ? 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400'
                                                            : 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400'
                                                            }`}>
                                                            {orderData.refund_status === 'refunded' || orderData.payment_status === 'refunded' ? 'Refunded' : 'Pending Refund'}
                                                        </span>
                                                    </div>
                                                ) : null}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Order Details Grid */}
                            <div className="grid md:grid-cols-2 gap-6 p-8 border-t border-gray-100 dark:border-dark-700">
                                {/* Order Items */}
                                <div className="bg-gray-50 dark:bg-dark-700/50 rounded-2xl p-6">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                        <Package size={20} className="text-primary-600 dark:text-accent-500" />
                                        Order Items
                                    </h3>
                                    <div className="space-y-3">
                                        {orderData.items && orderData.items.length > 0 ? (
                                            orderData.items.map((item: any, idx: number) => (
                                                <div key={idx} className="flex justify-between items-center bg-white dark:bg-dark-800 rounded-xl p-3 shadow-sm">
                                                    <div className="flex items-center gap-3">
                                                        {item.product_image ? (
                                                            <img src={item.product_image} alt={item.product_name} className="w-12 h-12 rounded-lg object-cover" />
                                                        ) : (
                                                            <div className="w-12 h-12 bg-gray-50 dark:bg-dark-600 rounded-lg flex items-center justify-center">
                                                                <Package size={20} className="text-gray-400 dark:text-silver-600" />
                                                            </div>
                                                        )}
                                                        <div>
                                                            <p className="text-gray-900 dark:text-white font-medium text-sm">{item.product_name}</p>
                                                            <p className="text-gray-500 dark:text-silver-500 text-xs">Qty: {item.quantity}</p>
                                                        </div>
                                                    </div>
                                                    <p className="text-primary-600 dark:text-accent-400 font-bold">₹{parseFloat(item.price).toLocaleString()}</p>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-gray-500 dark:text-silver-500 text-sm">No items available</p>
                                        )}
                                    </div>
                                    {/* Total */}
                                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-dark-600 flex justify-between items-center">
                                        <span className="text-gray-500 dark:text-silver-400 font-medium">Total Amount</span>
                                        <span className="text-2xl font-bold text-gray-900 dark:text-white">₹{parseFloat(orderData.total_amount).toLocaleString()}</span>
                                    </div>
                                </div>

                                {/* Delivery Info */}
                                <div className="bg-gray-50 dark:bg-dark-700/50 rounded-2xl p-6">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                        <MapPin size={20} className="text-primary-600 dark:text-accent-500" />
                                        Delivery Information
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="bg-white dark:bg-dark-800 rounded-xl p-4 shadow-sm">
                                            <p className="text-xs text-gray-500 dark:text-silver-500 uppercase tracking-wider mb-1">Shipping Address</p>
                                            <p className="text-gray-900 dark:text-white font-medium">{orderData.delivery_address || 'Address not available'}</p>
                                            {orderData.delivery_city && (
                                                <p className="text-gray-500 dark:text-silver-400 text-sm">{orderData.delivery_city} - {orderData.delivery_pincode}</p>
                                            )}
                                        </div>
                                        <div className="bg-white dark:bg-dark-800 rounded-xl p-4 shadow-sm">
                                            <p className="text-xs text-gray-500 dark:text-silver-500 uppercase tracking-wider mb-1">Order Date</p>
                                            <p className="text-gray-900 dark:text-white font-medium">
                                                {orderData.created_at ? new Date(orderData.created_at).toLocaleDateString('en-US', {
                                                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                                                }) : 'N/A'}
                                            </p>
                                        </div>
                                        <div className="bg-white dark:bg-dark-800 rounded-xl p-4 shadow-sm">
                                            <p className="text-xs text-gray-500 dark:text-silver-500 uppercase tracking-wider mb-1">Payment Method</p>
                                            <p className="text-gray-900 dark:text-white font-medium">{orderData.is_cod ? 'Cash on Delivery' : 'Online Payment'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Back to all orders if logged in */}
                        {isAuthenticated && orders.length > 0 && (
                            <div className="text-center mt-8">
                                <Link href="/track-order" className="inline-flex items-center gap-2 text-primary-600 dark:text-accent-500 hover:text-primary-700 dark:hover:text-accent-400 transition-colors font-medium">
                                    <ChevronRight className="rotate-180" size={18} />
                                    View all your orders
                                </Link>
                            </div>
                        )}
                    </div>
                ) : isAuthenticated && orders.length > 0 && !searchParams?.get('id') ? (
                    /* Authenticated user with orders and no specific order ID - show orders list */
                    <div className="max-w-4xl mx-auto">
                        <div className="text-center mb-10">
                            <h1 className="font-display text-3xl font-bold text-gray-900 dark:text-white mb-4">Your Orders</h1>
                            <p className="text-gray-500 dark:text-silver-400">Track the status of your orders below.</p>
                        </div>

                        {/* User Info Banner */}
                        <div className="bg-white dark:bg-dark-800 border border-gray-100 dark:border-dark-700 rounded-2xl p-4 mb-6 flex items-center gap-4 shadow-sm">
                            <div className="w-12 h-12 bg-primary-50 dark:bg-accent-500/20 rounded-full flex items-center justify-center">
                                <User className="text-primary-600 dark:text-accent-500" size={24} />
                            </div>
                            <div>
                                <p className="text-gray-900 dark:text-white font-semibold">{customer?.name}</p>
                                <p className="text-gray-500 dark:text-silver-500 text-sm">{customer?.email}</p>
                            </div>
                        </div>

                        {/* Orders List with Tracking */}
                        <div className="space-y-6">
                            {orders.map((order) => (
                                <div key={order.id} className="bg-white dark:bg-dark-800 border border-gray-100 dark:border-dark-700 rounded-2xl overflow-hidden animate-fade-in shadow-sm">
                                    {/* Order Header */}
                                    <div className="bg-gray-50 dark:bg-dark-700 px-6 py-4 flex flex-wrap justify-between items-center gap-4">
                                        <div className="flex flex-wrap gap-4 md:gap-8">
                                            <div>
                                                <p className="text-xs text-gray-500 dark:text-silver-500 uppercase font-semibold">Order ID</p>
                                                <p className="text-sm font-bold text-primary-600 dark:text-accent-500">{order.id}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 dark:text-silver-500 uppercase font-semibold">Order Placed</p>
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">{order.date}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 dark:text-silver-500 uppercase font-semibold">Total</p>
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">₹{order.total.toLocaleString()}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 dark:text-silver-500 uppercase font-semibold">Items</p>
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">{order.items} Items</p>
                                            </div>
                                        </div>
                                        <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${order.status === 'Delivered' ? 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400' :
                                            order.status === 'Processing' ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400' :
                                                order.status === 'Shipped' ? 'bg-primary-100 dark:bg-accent-500/20 text-primary-600 dark:text-accent-400' :
                                                    'bg-gray-100 dark:bg-dark-600 text-gray-600 dark:text-silver-400'
                                            }`}>
                                            {order.status}
                                        </span>
                                    </div>

                                    {/* Tracking Timeline */}
                                    <div className="p-6">
                                        {/* Status Summary */}
                                        <div className="flex items-center gap-4 mb-6">
                                            {order.status === 'Delivered' && <CheckCircle size={24} className="text-green-500" />}
                                            {order.status === 'Processing' && <Clock size={24} className="text-blue-500" />}
                                            {order.status === 'Shipped' && <Truck size={24} className="text-primary-600 dark:text-accent-500" />}
                                            {!['Delivered', 'Processing', 'Shipped'].includes(order.status) && <Package size={24} className="text-gray-400 dark:text-silver-500" />}
                                            <div>
                                                <p className="font-semibold text-gray-900 dark:text-white">{order.status}</p>
                                                <p className="text-sm text-gray-500 dark:text-silver-400">
                                                    {order.status === 'Delivered' ? 'Package delivered successfully' :
                                                        order.status === 'Shipped' ? 'Your order is on the way' :
                                                            order.status === 'Processing' ? 'Your order is being prepared' :
                                                                'Order received'}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Horizontal Progress Bar for Desktop */}
                                        <div className="hidden md:block">
                                            <div className="flex items-center justify-between relative">
                                                {/* Progress Line Background */}
                                                <div className="absolute left-8 right-8 top-8 h-1 bg-gray-100 dark:bg-dark-600 rounded-full" />
                                                {/* Progress Line Filled */}
                                                <div
                                                    className="absolute left-8 top-8 h-1 bg-gradient-to-r from-green-500 to-primary-500 dark:to-accent-500 rounded-full transition-all duration-500"
                                                    style={{
                                                        width: (() => {
                                                            const status = order.status?.toLowerCase();
                                                            if (status === 'delivered' || status === 'completed') return 'calc(100% - 64px)';
                                                            if (status === 'out_for_delivery') return 'calc(80% - 51px)';
                                                            if (status === 'shipped') return 'calc(60% - 38px)';
                                                            if (status === 'processing' || status === 'ordered_from_meesho') return 'calc(40% - 26px)';
                                                            if (status === 'confirmed') return 'calc(20% - 13px)';
                                                            return '0%';
                                                        })()
                                                    }}
                                                />

                                                {/* Step 1: Pending */}
                                                <div className="flex flex-col items-center z-10">
                                                    <div className={`w-16 h-16 rounded-full flex items-center justify-center ${getStepStatus(order.status, 1) === 'completed' ? 'bg-green-500 shadow-lg shadow-green-500/30' : 'bg-white dark:bg-dark-600 shadow-sm border border-gray-100 dark:border-dark-700'}`}>
                                                        <Clock className={getStepStatus(order.status, 1) === 'completed' ? 'text-white' : 'text-gray-400 dark:text-silver-500'} size={24} />
                                                    </div>
                                                    <p className={`text-sm mt-3 font-medium ${getStepStatus(order.status, 1) === 'completed' ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>Pending</p>
                                                </div>

                                                {/* Step 2: Confirmed */}
                                                <div className="flex flex-col items-center z-10">
                                                    <div className={`w-16 h-16 rounded-full flex items-center justify-center ${getStepStatus(order.status, 2) === 'completed' ? 'bg-green-500 shadow-lg shadow-green-500/30' : 'bg-white dark:bg-dark-600 shadow-sm border border-gray-100 dark:border-dark-700'}`}>
                                                        <CheckCircle className={getStepStatus(order.status, 2) === 'completed' ? 'text-white' : 'text-gray-400 dark:text-silver-500'} size={24} />
                                                    </div>
                                                    <p className={`text-sm mt-3 font-medium ${getStepStatus(order.status, 2) === 'completed' ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>Confirmed</p>
                                                </div>

                                                {/* Step 3: Processing */}
                                                <div className="flex flex-col items-center z-10">
                                                    <div className={`w-16 h-16 rounded-full flex items-center justify-center ${getStepStatus(order.status, 3) === 'completed' ? 'bg-green-500 shadow-lg shadow-green-500/30' : 'bg-white dark:bg-dark-600 shadow-sm border border-gray-100 dark:border-dark-700'}`}>
                                                        <Package className={getStepStatus(order.status, 3) === 'completed' ? 'text-white' : 'text-gray-400 dark:text-silver-500'} size={24} />
                                                    </div>
                                                    <p className={`text-sm mt-3 font-medium ${getStepStatus(order.status, 3) === 'completed' ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>Processing</p>
                                                </div>

                                                {/* Step 4: Shipped */}
                                                <div className="flex flex-col items-center z-10">
                                                    <div className={`w-16 h-16 rounded-full flex items-center justify-center ${getStepStatus(order.status, 4) === 'completed' ? 'bg-primary-500 shadow-lg shadow-primary-500/30' : 'bg-white dark:bg-dark-600 shadow-sm border border-gray-100 dark:border-dark-700'}`}>
                                                        <Truck className={getStepStatus(order.status, 4) === 'completed' ? 'text-white' : 'text-gray-400 dark:text-silver-500'} size={24} />
                                                    </div>
                                                    <p className={`text-sm mt-3 font-medium ${getStepStatus(order.status, 4) === 'completed' ? 'text-primary-600 dark:text-accent-500' : 'text-gray-400'}`}>Shipped</p>
                                                </div>

                                                {/* Step 5: Out for Delivery */}
                                                <div className="flex flex-col items-center z-10">
                                                    <div className={`w-16 h-16 rounded-full flex items-center justify-center ${getStepStatus(order.status, 5) === 'completed' ? 'bg-primary-500 shadow-lg shadow-primary-500/30' : 'bg-white dark:bg-dark-600 shadow-sm border border-gray-100 dark:border-dark-700'}`}>
                                                        <Truck className={getStepStatus(order.status, 5) === 'completed' ? 'text-white' : 'text-gray-400 dark:text-silver-500'} size={24} />
                                                    </div>
                                                    <p className={`text-sm mt-3 font-medium ${getStepStatus(order.status, 5) === 'completed' ? 'text-primary-600 dark:text-accent-500' : 'text-gray-400'}`}>Out for Delivery</p>
                                                </div>

                                                {/* Step 6: Delivered */}
                                                <div className="flex flex-col items-center z-10">
                                                    <div className={`w-16 h-16 rounded-full flex items-center justify-center ${getStepStatus(order.status, 6) === 'completed' ? 'bg-green-500 shadow-lg shadow-green-500/30' : 'bg-white dark:bg-dark-600 shadow-sm border border-gray-100 dark:border-dark-700'}`}>
                                                        <MapPin className={getStepStatus(order.status, 6) === 'completed' ? 'text-white' : 'text-gray-400 dark:text-silver-500'} size={24} />
                                                    </div>
                                                    <p className={`text-sm mt-3 font-medium ${getStepStatus(order.status, 6) === 'completed' ? 'text-green-500' : 'text-gray-400'}`}>Delivered</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Vertical Timeline for Mobile */}
                                        <div className="md:hidden">
                                            <div className="relative">
                                                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-100 dark:bg-dark-600" />
                                                <div className="space-y-6">
                                                    {/* Step 1: Pending */}
                                                    <div className="relative flex gap-4 items-start">
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${getStepStatus(order.status, 1) === 'completed' ? 'bg-green-500 shadow-sm' : 'bg-white dark:bg-dark-600 border border-gray-100 dark:border-dark-700'}`}>
                                                            <Clock className={getStepStatus(order.status, 1) === 'completed' ? 'text-white' : 'text-gray-400'} size={16} />
                                                        </div>
                                                        <div>
                                                            <h4 className={`font-semibold text-sm ${getStepStatus(order.status, 1) === 'completed' ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>Pending</h4>
                                                            <p className="text-xs text-gray-500">Order placed successfully</p>
                                                        </div>
                                                    </div>
                                                    {/* Step 2: Confirmed */}
                                                    <div className="relative flex gap-4 items-start">
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${getStepStatus(order.status, 2) === 'completed' ? 'bg-green-500 shadow-sm' : 'bg-white dark:bg-dark-600 border border-gray-100 dark:border-dark-700'}`}>
                                                            <CheckCircle className={getStepStatus(order.status, 2) === 'completed' ? 'text-white' : 'text-gray-400'} size={16} />
                                                        </div>
                                                        <div>
                                                            <h4 className={`font-semibold text-sm ${getStepStatus(order.status, 2) === 'completed' ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>Confirmed</h4>
                                                            <p className="text-xs text-gray-500">Order verified and confirmed</p>
                                                        </div>
                                                    </div>
                                                    {/* Step 3: Processing */}
                                                    <div className="relative flex gap-4 items-start">
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${getStepStatus(order.status, 3) === 'completed' ? 'bg-green-500 shadow-sm' : 'bg-white dark:bg-dark-600 border border-gray-100 dark:border-dark-700'}`}>
                                                            <Package className={getStepStatus(order.status, 3) === 'completed' ? 'text-white' : 'text-gray-400'} size={16} />
                                                        </div>
                                                        <div>
                                                            <h4 className={`font-semibold text-sm ${getStepStatus(order.status, 3) === 'completed' ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>Processing</h4>
                                                            <p className="text-xs text-gray-500">Order is being processed</p>
                                                        </div>
                                                    </div>
                                                    {/* Step 4: Shipped */}
                                                    <div className="relative flex gap-4 items-start">
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${getStepStatus(order.status, 4) === 'completed' ? 'bg-primary-500 shadow-sm' : 'bg-white dark:bg-dark-600 border border-gray-100 dark:border-dark-700'}`}>
                                                            <Truck className={getStepStatus(order.status, 4) === 'completed' ? 'text-white' : 'text-gray-400'} size={16} />
                                                        </div>
                                                        <div>
                                                            <h4 className={`font-semibold text-sm ${getStepStatus(order.status, 4) === 'completed' ? 'text-primary-600 dark:text-accent-500' : 'text-gray-400'}`}>Shipped</h4>
                                                            <p className="text-xs text-gray-500">Your order is on the way</p>
                                                        </div>
                                                    </div>
                                                    {/* Step 5: Out for Delivery */}
                                                    <div className="relative flex gap-4 items-start">
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${getStepStatus(order.status, 5) === 'completed' ? 'bg-primary-500 shadow-sm' : 'bg-white dark:bg-dark-600 border border-gray-100 dark:border-dark-700'}`}>
                                                            <Truck className={getStepStatus(order.status, 5) === 'completed' ? 'text-white' : 'text-gray-400'} size={16} />
                                                        </div>
                                                        <div>
                                                            <h4 className={`font-semibold text-sm ${getStepStatus(order.status, 5) === 'completed' ? 'text-primary-600 dark:text-accent-500' : 'text-gray-400'}`}>Out for Delivery</h4>
                                                            <p className="text-xs text-gray-500">Your order is out for delivery</p>
                                                        </div>
                                                    </div>
                                                    {/* Step 6: Delivered */}
                                                    <div className="relative flex gap-4 items-start">
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${getStepStatus(order.status, 6) === 'completed' ? 'bg-green-500 shadow-sm' : 'bg-white dark:bg-dark-600 border border-gray-100 dark:border-dark-700'}`}>
                                                            <MapPin className={getStepStatus(order.status, 6) === 'completed' ? 'text-white' : 'text-gray-400'} size={16} />
                                                        </div>
                                                        <div>
                                                            <h4 className={`font-semibold text-sm ${getStepStatus(order.status, 6) === 'completed' ? 'text-green-500' : 'text-gray-400'}`}>Delivered</h4>
                                                            <p className="text-xs text-gray-500">Package delivered to your address</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    /* Guest user or no orders - show manual tracking form */
                    <div className="max-w-2xl mx-auto">
                        <div className="text-center mb-10">
                            <h1 className="font-display text-3xl font-bold text-gray-900 dark:text-white mb-4">Track Your Order</h1>
                            <p className="text-gray-500 dark:text-silver-400">
                                {isAuthenticated && orders.length === 0
                                    ? "You don't have any orders yet. Start shopping to place your first order!"
                                    : "Enter your order ID to check the current status of your package."}
                            </p>
                            {!isAuthenticated && (
                                <p className="text-gray-500 dark:text-silver-500 mt-2">
                                    <Link href="/login" className="text-primary-600 dark:text-accent-500 hover:underline">Login</Link> to see all your orders with tracking.
                                </p>
                            )}
                        </div>

                        {/* Search Form */}
                        <div className="bg-white dark:bg-dark-800 border border-gray-100 dark:border-dark-700 rounded-2xl p-6 mb-8 shadow-sm">
                            <form onSubmit={handleTrack} className="flex gap-4">
                                <div className="flex-1 relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-silver-500" size={20} />
                                    <input
                                        type="text"
                                        placeholder="Enter Order ID (e.g. ORD-123456)"
                                        className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-dark-700 border border-gray-100 dark:border-dark-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-silver-500 focus:ring-2 focus:ring-primary-500 dark:focus:ring-accent-500 focus:border-transparent outline-none transition-all"
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

                        {/* Error State */}
                        {status === 'error' && (
                            <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-2xl p-6 text-center animate-fade-in">
                                <div className="w-12 h-12 bg-red-100 dark:bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <AlertCircle className="text-red-500" size={24} />
                                </div>
                                <h3 className="text-gray-900 dark:text-white font-bold mb-1">Order Not Found</h3>
                                <p className="text-gray-500 dark:text-silver-400 text-sm">We couldn&apos;t find an order with that ID. Please check and try again.</p>
                            </div>
                        )}

                        {/* If logged in but no orders */}
                        {isAuthenticated && orders.length === 0 && (
                            <div className="text-center mt-8">
                                <Link href="/products" className="btn-primary inline-flex items-center gap-2">
                                    <ShoppingBag size={20} />
                                    Start Shopping
                                </Link>
                            </div>
                        )}
                    </div>
                )
                }
            </div >
        </div >
    );
}

export default function TrackOrderPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 dark:bg-dark-950 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-accent-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-500 dark:text-silver-400">Loading...</p>
                </div>
            </div>
        }>
            <TrackOrderContent />
        </Suspense>
    );
}
