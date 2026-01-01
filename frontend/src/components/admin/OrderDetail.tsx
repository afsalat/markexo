import { useState } from 'react';
import { Order } from '@/types/admin';
import {
    ArrowLeft, Package, User, CreditCard, Calendar,
    MapPin, Phone, Mail, Clock, CheckCircle2,
    Truck, AlertCircle, ShoppingBag, ExternalLink,
    XCircle, RefreshCw, HelpCircle
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { API_BASE_URL } from '@/config/apiConfig';

interface OrderDetailProps {
    order: Order;
    onBack: () => void;
    onStatusUpdate?: (orderId: string, newStatus: string) => void;
}

export default function OrderDetail({ order: initialOrder, onBack, onStatusUpdate }: OrderDetailProps) {
    const [order, setOrder] = useState<Order>(initialOrder);
    const { token } = useAuth();
    const [isCancelling, setIsCancelling] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);

    const formatNumber = (num: number) => {
        return new Intl.NumberFormat('en-IN').format(num);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusStep = (status: string) => {
        const steps = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
        return steps.indexOf(status.toLowerCase());
    };

    const currentStep = getStatusStep(order.status);

    const handleCancelOrder = async () => {
        if (!cancelReason.trim()) {
            alert('Please provide a reason for cancellation');
            return;
        }

        setIsUpdating(true);
        try {
            const response = await fetch(`${API_BASE_URL}/admin/orders/${order.id}/cancel_order/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ reason: cancelReason })
            });

            if (response.ok) {
                const updatedOrder = { ...order, status: 'cancelled', cancellation_reason: cancelReason };
                setOrder(updatedOrder);
                setIsCancelling(false);
                if (onStatusUpdate) onStatusUpdate(order.order_id, 'cancelled');
            } else {
                alert('Failed to cancel order');
            }
        } catch (error) {
            console.error('Error cancelling order:', error);
            alert('An error occurred');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleUpdateRefundStatus = async (status: string) => {
        setIsUpdating(true);
        try {
            const response = await fetch(`${API_BASE_URL}/admin/orders/${order.id}/mark_refunded/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ refund_status: status })
            });

            if (response.ok) {
                const updatedOrder = { ...order, refund_status: status as any };
                setOrder(updatedOrder);
            } else {
                alert('Failed to update refund status');
            }
        } catch (error) {
            console.error('Error updating refund status:', error);
            alert('An error occurred');
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="animate-fade-in space-y-6">
            {/* Header */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold uppercase tracking-wider text-primary-600 bg-primary-50 px-2 py-0.5 rounded">Order ID</span>
                            <span className="text-gray-500 text-sm font-mono">#{order.order_id}</span>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">Order from {order.customer?.name || 'Guest'}</h1>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <span className={`px-4 py-1.5 rounded-full text-sm font-bold capitalize 
                        ${order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                            order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                'bg-amber-100 text-amber-700'}`}>
                        {order.status}
                    </span>

                    {order.status !== 'cancelled' && order.status !== 'delivered' && (
                        <button
                            onClick={() => setIsCancelling(true)}
                            className="flex items-center gap-2 px-4 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-full text-sm font-bold transition-all"
                        >
                            <XCircle size={16} /> Cancel Order
                        </button>
                    )}

                    <button className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all">
                        <ExternalLink size={20} />
                    </button>
                </div>
            </div>

            {/* Cancellation Modal/Overlay */}
            {isCancelling && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-scale-up">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Cancel Order</h2>
                        <p className="text-gray-500 mb-6">Please provide a reason for cancelling this order. This information will be saved for audit purposes.</p>

                        <textarea
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                            placeholder="Reason for cancellation..."
                            className="w-full p-4 rounded-2xl bg-gray-50 border border-gray-100 focus:ring-2 focus:ring-primary-500 outline-none transition-all mb-6 min-h-[120px]"
                        />

                        <div className="flex gap-3">
                            <button
                                onClick={() => setIsCancelling(false)}
                                className="flex-1 py-3 px-4 rounded-2xl font-bold text-gray-500 hover:bg-gray-100 transition-all"
                                disabled={isUpdating}
                            >
                                Not Now
                            </button>
                            <button
                                onClick={handleCancelOrder}
                                className="flex-1 py-3 px-4 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 shadow-lg shadow-red-200 transition-all disabled:opacity-50"
                                disabled={isUpdating || !cancelReason.trim()}
                            >
                                {isUpdating ? 'Cancelling...' : 'Confirm Cancellation'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Stepper (Status Progress) or Cancellation Details */}
            {order.status !== 'cancelled' ? (
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                    <div className="relative flex justify-between">
                        {/* Progress Line */}
                        <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-100 -z-0">
                            <div
                                className="h-full bg-primary-500 transition-all duration-500"
                                style={{ width: `${(currentStep / 4) * 100}%` }}
                            />
                        </div>

                        {[
                            { id: 'pending', icon: Clock, label: 'Pending' },
                            { id: 'confirmed', icon: CheckCircle2, label: 'Confirmed' },
                            { id: 'processing', icon: ShoppingBag, label: 'Processing' },
                            { id: 'shipped', icon: Truck, label: 'Shipped' },
                            { id: 'delivered', icon: Package, label: 'Delivered' }
                        ].map((step, idx) => {
                            const isCompleted = idx <= currentStep;
                            const isActive = idx === currentStep;

                            return (
                                <div key={step.id} className="relative z-10 flex flex-col items-center group">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border-4 border-white shadow-sm
                                        ${isCompleted ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                                        <step.icon size={18} />
                                    </div>
                                    <span className={`mt-2 text-xs font-bold uppercase tracking-tighter
                                        ${isActive ? 'text-primary-600' : 'text-gray-400'}`}>
                                        {step.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                <div className="bg-red-50 rounded-3xl p-8 border border-red-100">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center shrink-0">
                                <AlertCircle size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-red-900 mb-1">Order Cancelled</h2>
                                <p className="text-red-700/80 font-medium">Reason: {order.cancellation_reason || 'No reason provided'}</p>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-red-100/50 w-full md:w-auto">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Refund Status</p>
                            <div className="flex items-center gap-4">
                                <span className={`px-4 py-1.5 rounded-full text-sm font-bold capitalize 
                                    ${order.refund_status === 'refunded' ? 'bg-green-100 text-green-700' :
                                        order.refund_status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                            'bg-gray-100 text-gray-700'}`}>
                                    {order.refund_status?.replace('_', ' ') || 'Not Applicable'}
                                </span>

                                <div className="flex gap-2">
                                    {order.refund_status !== 'refunded' && (
                                        <button
                                            onClick={() => handleUpdateRefundStatus('refunded')}
                                            disabled={isUpdating}
                                            className="p-2 text-green-600 hover:bg-green-50 rounded-xl transition-all"
                                            title="Mark as Refunded"
                                        >
                                            <CheckCircle2 size={20} />
                                        </button>
                                    )}
                                    {order.refund_status !== 'pending' && (
                                        <button
                                            onClick={() => handleUpdateRefundStatus('pending')}
                                            disabled={isUpdating}
                                            className="p-2 text-amber-600 hover:bg-amber-50 rounded-xl transition-all"
                                            title="Mark Refund Pending"
                                        >
                                            <Clock size={20} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Items */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-50 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <Package size={20} className="text-primary-500" /> Items Summary
                            </h2>
                            <span className="text-sm font-medium text-gray-500">{order.items?.length || 0} Products</span>
                        </div>

                        <div className="divide-y divide-gray-50">
                            {order.items?.map((item) => (
                                <div key={item.id} className="p-6 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                                    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center overflow-hidden shrink-0 border border-gray-50">
                                        {item.product_image ? (
                                            <img src={`${item.product_image}`} alt={item.product_name} className="w-full h-full object-cover" />
                                        ) : (
                                            <Package size={24} className="text-gray-400" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-gray-900 truncate">{item.product_name}</h3>
                                        <p className="text-sm text-gray-500 truncate">SKU: {item.sku || 'N/A'}</p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <div className="font-bold text-gray-900">₹{formatNumber(item.price)}</div>
                                        <div className="text-xs text-gray-400 font-bold uppercase">Qty: {item.quantity}</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="p-8 bg-gray-50/50 space-y-3">
                            <div className="flex justify-between text-gray-500">
                                <span>Subtotal</span>
                                <span>₹{formatNumber(order.total_amount)}</span>
                            </div>
                            <div className="flex justify-between text-gray-500">
                                <span>Delivery Fee</span>
                                <span className="text-green-600 font-medium tracking-tight">FREE</span>
                            </div>
                            <div className="flex justify-between items-end pt-3 border-t border-gray-100">
                                <span className="font-bold text-gray-900">Total Amount</span>
                                <span className="text-3xl font-extrabold text-primary-600">₹{formatNumber(order.total_amount)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Info */}
                <div className="space-y-6">
                    {/* Customer Info */}
                    <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                        <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <User size={20} className="text-primary-500" /> Customer Details
                        </h2>
                        <div className="space-y-6">
                            <div className="flex items-start gap-3">
                                <div className="p-2.5 bg-gray-50 rounded-2xl text-gray-400 shrink-0">
                                    <User size={20} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">Full Name</p>
                                    <p className="font-bold text-gray-900 truncate">{order.customer?.name || 'Guest User'}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="p-2.5 bg-gray-50 rounded-2xl text-gray-400 shrink-0">
                                    <Phone size={20} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">Contact Number</p>
                                    <p className="font-bold text-gray-900 truncate">{order.customer?.phone || 'N/A'}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="p-2.5 bg-gray-50 rounded-2xl text-gray-400 shrink-0">
                                    <MapPin size={20} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">Shipping Address</p>
                                    <p className="font-medium text-gray-600 leading-relaxed text-sm">{order.delivery_address || 'Default store location address'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Order Metadata */}
                    <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                        <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <Calendar size={20} className="text-primary-500" /> Order History
                        </h2>
                        <div className="space-y-6">
                            <div className="flex items-start gap-3">
                                <div className="p-2.5 bg-gray-50 rounded-2xl text-gray-400 shrink-0">
                                    <Calendar size={20} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">Placed on</p>
                                    <p className="font-bold text-gray-900">{formatDate(order.created_at)}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="p-2.5 bg-gray-50 rounded-2xl text-gray-400 shrink-0">
                                    <CreditCard size={20} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">Payment Method</p>
                                    <p className="font-bold text-gray-900">COD / Online</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
