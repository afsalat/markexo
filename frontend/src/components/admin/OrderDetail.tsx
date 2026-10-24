import { useState } from 'react';
import { Order, CourierPartner, TrackingEvent } from '@/types/admin';
import {
    ArrowLeft, Package, User, CreditCard, Calendar,
    MapPin, Phone, Mail, Clock, CheckCircle2,
    Truck, AlertCircle, ShoppingBag, ExternalLink,
    XCircle, RefreshCw, HelpCircle, ChevronDown, Edit3,
    RotateCcw, FileText, StickyNote, Download, Loader2,
    Printer, Copy, Check, Navigation, Sparkles, Box
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { API_BASE_URL } from '@/config/apiConfig';
import { exportOrderInvoiceToExcel } from '@/lib/excelExport';

interface OrderDetailProps {
    order: Order;
    onBack: () => void;
    onStatusUpdate?: (orderId: string, newStatus: string) => void;
}

// All available order statuses
const ORDER_STATUSES = [
    { value: 'pending', label: 'Pending', color: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' },
    { value: 'pending_verification', label: 'Pending Verification', color: 'bg-orange-500/10 text-orange-400 border border-orange-500/20' },
    { value: 'confirmed', label: 'Confirmed', color: 'bg-blue-500/10 text-blue-400 border border-blue-500/20' },
    { value: 'processing', label: 'Processing', color: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' },
    { value: 'shipped', label: 'Shipped', color: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' },
    { value: 'out_for_delivery', label: 'Out for Delivery', color: 'bg-teal-500/10 text-teal-400 border border-teal-500/20' },
    { value: 'delivered', label: 'Delivered', color: 'bg-green-500/10 text-green-400 border border-green-500/20' },
    { value: 'completed', label: 'Completed', color: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' },
    { value: 'rto', label: 'Returned to Origin (RTO)', color: 'bg-red-500/10 text-red-400 border border-red-500/20' },
    { value: 'returned', label: 'Returned (Customer)', color: 'bg-orange-500/10 text-orange-400 border border-orange-500/20' },
    { value: 'cancelled', label: 'Cancelled', color: 'bg-dark-700 text-silver-400 border border-dark-600' },
];

const PAYMENT_STATUSES = [
    { value: 'pending', label: 'Pending', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
    { value: 'pending_cod', label: 'Pending COD Collection', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
    { value: 'received', label: 'Payment Received', color: 'bg-green-500/10 text-green-500 border-green-500/20' },
    { value: 'received_from_meesho', label: 'Received from Meesho', color: 'bg-green-500/10 text-green-500 border-green-500/20' },
    { value: 'failed_rto', label: 'Failed (RTO)', color: 'bg-red-500/10 text-red-500 border-red-500/20' },
    { value: 'refunded', label: 'Refunded', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
    { value: 'paid', label: 'Paid', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
];

export default function OrderDetail({ order: initialOrder, onBack, onStatusUpdate }: OrderDetailProps) {
    const [order, setOrder] = useState<Order>(initialOrder);
    const { token, user } = useAuth();
    const [isCancelling, setIsCancelling] = useState(false);
    const [isReturning, setIsReturning] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [returnReason, setReturnReason] = useState('');
    const [orderNotes, setOrderNotes] = useState(initialOrder.notes || '');
    const [isUpdating, setIsUpdating] = useState(false);
    const [showStatusDropdown, setShowStatusDropdown] = useState(false);
    const [showPaymentStatusDropdown, setShowPaymentStatusDropdown] = useState(false);
    const [downloadingInvoice, setDownloadingInvoice] = useState(false);

    // Courier & Shipping states
    const [showShipModal, setShowShipModal] = useState(false);
    const [showTrackModal, setShowTrackModal] = useState(false);
    const [showLabelModal, setShowLabelModal] = useState(false);
    const [courierPartners, setCourierPartners] = useState<CourierPartner[]>([]);
    const [loadingPartners, setLoadingPartners] = useState(false);
    const [selectedPartnerId, setSelectedPartnerId] = useState<number | ''>('');
    const [dispatchWeight, setDispatchWeight] = useState<string>(
        String(order.package_weight || order.estimated_package_specs?.weight_kg || '0.5')
    );
    const [dispatchLength, setDispatchLength] = useState<string>(
        String(order.package_length || order.estimated_package_specs?.dimensions?.length || '10')
    );
    const [dispatchWidth, setDispatchWidth] = useState<string>(
        String(order.package_width || order.estimated_package_specs?.dimensions?.width || '10')
    );
    const [dispatchHeight, setDispatchHeight] = useState<string>(
        String(order.package_height || order.estimated_package_specs?.dimensions?.height || '5')
    );
    const [customAwb, setCustomAwb] = useState('');
    const [isDispatching, setIsDispatching] = useState(false);
    const [dispatchError, setDispatchError] = useState<string | null>(null);

    const [trackingLoading, setTrackingLoading] = useState(false);
    const [liveTrackingEvents, setLiveTrackingEvents] = useState<TrackingEvent[]>([]);
    const [labelHtml, setLabelHtml] = useState<string>('');
    const [labelLoading, setLabelLoading] = useState(false);
    const [copiedAwb, setCopiedAwb] = useState(false);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedAwb(true);
        setTimeout(() => setCopiedAwb(false), 2000);
    };

    const handleOpenShipModal = async () => {
        setShowShipModal(true);
        setDispatchError(null);
        if (courierPartners.length === 0) {
            setLoadingPartners(true);
            try {
                const res = await fetch(`${API_BASE_URL}/admin/courier-partners/`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    const list: CourierPartner[] = data.results || data;
                    setCourierPartners(list);
                    const def = list.find(p => p.is_default) || list[0];
                    if (def) setSelectedPartnerId(def.id);
                }
            } catch (err) {
                console.error('Failed to load courier partners', err);
            } finally {
                setLoadingPartners(false);
            }
        }
    };

    const handleDispatchShipment = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsDispatching(true);
        setDispatchError(null);
        try {
            const res = await fetch(`${API_BASE_URL}/admin/orders/${order.id}/create_shipment/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    courier_partner_id: selectedPartnerId || undefined,
                    weight_kg: parseFloat(dispatchWeight) || 0.5,
                    length: parseFloat(dispatchLength) || 10,
                    width: parseFloat(dispatchWidth) || 10,
                    height: parseFloat(dispatchHeight) || 5,
                    custom_awb: customAwb.trim() || undefined
                })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setOrder({
                    ...order,
                    status: 'shipped',
                    courier_awb: data.awb_code,
                    courier_name: data.courier_name,
                    courier_tracking_url: data.tracking_url,
                    shipping_label_url: data.label_url,
                    shipment_id: data.shipment_id,
                    package_weight: parseFloat(dispatchWeight) || 0.5,
                    package_length: parseFloat(dispatchLength) || 10,
                    package_width: parseFloat(dispatchWidth) || 10,
                    package_height: parseFloat(dispatchHeight) || 5,
                });
                setShowShipModal(false);
                if (onStatusUpdate) onStatusUpdate(order.order_id, 'shipped');
            } else {
                setDispatchError(data.error || 'Failed to dispatch order with courier.');
            }
        } catch (err: any) {
            setDispatchError(err.message || 'Error occurred while contacting shipping service.');
        } finally {
            setIsDispatching(false);
        }
    };

    const handleOpenTrackModal = async () => {
        setShowTrackModal(true);
        setTrackingLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/admin/orders/${order.id}/track_shipment/`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setLiveTrackingEvents(data.tracking_events || []);
            }
        } catch (err) {
            console.error('Error tracking shipment', err);
        } finally {
            setTrackingLoading(false);
        }
    };

    const handleOpenLabelModal = async () => {
        setShowLabelModal(true);
        setLabelLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/admin/orders/${order.id}/shipping_label/`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const html = await res.text();
                setLabelHtml(html);
            }
        } catch (err) {
            console.error('Error fetching label', err);
        } finally {
            setLabelLoading(false);
        }
    };

    const handleReturnOrder = async () => {
        if (!returnReason.trim()) {
            alert('Please provide a reason for return');
            return;
        }

        // 1. Update status to returned
        await handleUpdateStatus('returned');

        // 2. Append return reason to notes
        try {
            const newNotes = `[Return Reason]: ${returnReason}\n${order.notes || ''}`;
            const response = await fetch(`${API_BASE_URL}/admin/orders/${order.id}/`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ notes: newNotes })
            });

            if (response.ok) {
                setOrderNotes(newNotes);
                setOrder({ ...order, notes: newNotes, status: 'returned' }); // Optimistic update
            }
        } catch (error) {
            console.error('Error saving return reason:', error);
        }

        setIsReturning(false);
    };

    const handleSaveNotes = async () => {
        try {
            setIsUpdating(true);
            const response = await fetch(`${API_BASE_URL}/admin/orders/${order.id}/`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ notes: orderNotes })
            });

            if (response.ok) {
                setOrder({ ...order, notes: orderNotes });
                alert('Notes saved successfully');
            } else {
                alert('Failed to save notes');
            }
        } catch (error) {
            console.error('Error saving notes:', error);
            alert('An error occurred');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleDownloadInvoice = async () => {
        setDownloadingInvoice(true);
        try {
            await exportOrderInvoiceToExcel(order);
        } catch (err) {
            console.error('Failed to download invoice:', err);
            alert('Failed to generate Excel invoice. Please try again.');
        } finally {
            setDownloadingInvoice(false);
        }
    };

    const handleUpdateStatus = async (newStatus: string) => {
        setIsUpdating(true);
        setShowStatusDropdown(false);
        try {
            const response = await fetch(`${API_BASE_URL}/admin/orders/${order.id}/update_status/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (response.ok) {
                const updatedOrder = { ...order, status: newStatus };
                setOrder(updatedOrder);
                if (onStatusUpdate) onStatusUpdate(order.order_id, newStatus);
            } else {
                const errorData = await response.json();
                alert(errorData.error || 'Failed to update status');
            }
        } catch (error) {
            console.error('Error updating status:', error);
            alert('An error occurred');
        } finally {
            setIsUpdating(false);
        }
    };
    const handleUpdatePaymentStatus = async (newStatus: string) => {
        setIsUpdating(true);
        setShowPaymentStatusDropdown(false);
        try {
            const response = await fetch(`${API_BASE_URL}/admin/orders/${order.id}/update_payment_status/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ payment_status: newStatus })
            });

            if (response.ok) {
                const updatedOrder = { ...order, payment_status: newStatus };
                setOrder(updatedOrder);
                alert('Payment status updated successfully');
            } else {
                const errorData = await response.json();
                alert(errorData.error || 'Failed to update payment status');
            }
        } catch (error) {
            console.error('Error updating payment status:', error);
            alert('An error occurred');
        } finally {
            setIsUpdating(false);
        }
    };

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
        const steps = ['pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered'];
        return steps.indexOf(status.toLowerCase());
    };

    // Helper function to get timestamp for a specific step from status_history
    const getStepTimestamp = (step: string) => {
        const statusHistory = (order as any).status_history;
        if (!statusHistory || statusHistory.length === 0) return null;

        const statusesForStep: { [key: string]: string[] } = {
            'pending': ['pending_verification', 'pending'],
            'confirmed': ['confirmed'],
            'processing': ['ordered_from_meesho', 'processing', 'forwarded'],
            'shipped': ['shipped'],
            'out_for_delivery': ['out_for_delivery'],
            'delivered': ['delivered', 'completed'],
        };

        const targetStatuses = statusesForStep[step] || [];
        const historyEntry = statusHistory.find((h: any) =>
            targetStatuses.includes(h.status?.toLowerCase())
        );

        return historyEntry?.changed_at || null;
    };

    const currentStep = getStatusStep(order.status);
    const currentStatusInfo = ORDER_STATUSES.find(s => s.value === order.status) || ORDER_STATUSES[0];

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
            <div className="bg-dark-800 rounded-3xl p-6 shadow-sm border border-dark-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="p-2 text-silver-500 hover:text-white hover:bg-dark-700 rounded-xl transition-all"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold uppercase tracking-wider text-accent-500 bg-accent-500/10 border border-accent-500/20 px-2 py-0.5 rounded">Order ID</span>
                            <span className="text-silver-500 text-sm font-mono">#{order.order_id}</span>
                        </div>
                        <h1 className="text-2xl font-bold text-white">Order from {order.customer?.name || 'Guest'}</h1>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Status Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                            disabled={isUpdating}
                            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold capitalize transition-all border ${currentStatusInfo.color.includes('bg-') ? currentStatusInfo.color : 'bg-dark-700 text-silver-300 border-dark-600'} hover:ring-2 hover:ring-offset-2 hover:ring-accent-500/50 hover:ring-offset-dark-900`}
                        >
                            {isUpdating ? (
                                <RefreshCw size={14} className="animate-spin" />
                            ) : (
                                <Edit3 size={14} />
                            )}
                            {currentStatusInfo.label}
                            <ChevronDown size={14} className={`transition-transform ${showStatusDropdown ? 'rotate-180' : ''}`} />
                        </button>

                        {showStatusDropdown && (
                            <div className="absolute right-0 mt-2 w-64 bg-dark-800 rounded-2xl shadow-xl border border-dark-700 py-2 z-50 max-h-80 overflow-y-auto">
                                <div className="px-4 py-2 border-b border-dark-700">
                                    <p className="text-xs font-bold text-silver-500 uppercase tracking-wider">Update Status</p>
                                </div>
                                {ORDER_STATUSES.map((statusOption) => (
                                    <button
                                        key={statusOption.value}
                                        onClick={() => handleUpdateStatus(statusOption.value)}
                                        disabled={order.status === statusOption.value}
                                        className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors flex items-center gap-3 ${order.status === statusOption.value
                                            ? 'bg-dark-700 text-silver-500 cursor-not-allowed'
                                            : 'hover:bg-dark-700 text-white'
                                            }`}
                                    >
                                        <span className={`w-2 h-2 rounded-full ${statusOption.color.replace('text-', 'bg-').split(' ')[0]}`}></span>
                                        {statusOption.label}
                                        {order.status === statusOption.value && (
                                            <CheckCircle2 size={14} className="ml-auto text-green-500" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {order.status !== 'cancelled' && order.status !== 'delivered' && order.status !== 'completed' && (
                        <button
                            onClick={() => setIsCancelling(true)}
                            className="flex items-center gap-2 px-4 py-1.5 bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 rounded-full text-sm font-bold transition-all"
                        >
                            <XCircle size={16} /> Cancel Order
                        </button>
                    )}

                    <button className="p-2 text-silver-500 hover:text-accent-500 hover:bg-accent-500/10 rounded-xl transition-all">
                        <ExternalLink size={20} />
                    </button>
                </div>
            </div>

            {/* Click outside to close dropdown */}
            {showStatusDropdown && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowStatusDropdown(false)}
                />
            )}

            {/* Cancellation Modal/Overlay */}
            {isCancelling && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-dark-800 rounded-3xl p-8 max-w-md w-full shadow-2xl animate-scale-up border border-dark-700">
                        <h2 className="text-2xl font-bold text-white mb-2">Cancel Order</h2>
                        <p className="text-silver-500 mb-6">Please provide a reason for cancelling this order. This information will be saved for audit purposes.</p>

                        <textarea
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                            placeholder="Reason for cancellation..."
                            className="w-full p-4 rounded-2xl bg-dark-700 border border-dark-600 focus:ring-2 focus:ring-accent-500 outline-none transition-all mb-6 min-h-[120px] text-white placeholder-silver-600"
                        />

                        <div className="flex gap-3">
                            <button
                                onClick={() => setIsCancelling(false)}
                                className="flex-1 py-3 px-4 rounded-2xl font-bold text-silver-400 hover:bg-dark-700 transition-all border border-dark-600"
                                disabled={isUpdating}
                            >
                                Not Now
                            </button>
                            <button
                                onClick={handleCancelOrder}
                                className="flex-1 py-3 px-4 btn-primary rounded-2xl font-bold transition-all disabled:opacity-50"
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
                <div className="bg-dark-800 rounded-3xl p-8 shadow-sm border border-dark-700">
                    <div className="relative flex justify-between">
                        {/* Progress Line */}
                        <div className="absolute top-5 left-0 right-0 h-0.5 bg-dark-700 -z-0">
                            <div
                                className="h-full bg-accent-500 transition-all duration-500"
                                style={{ width: `${(currentStep / 5) * 100}%` }}
                            />
                        </div>

                        {[
                            { id: 'pending', icon: Clock, label: 'Pending' },
                            { id: 'confirmed', icon: CheckCircle2, label: 'Confirmed' },
                            { id: 'processing', icon: ShoppingBag, label: 'Processing' },
                            { id: 'shipped', icon: Truck, label: 'Shipped' },
                            { id: 'out_for_delivery', icon: MapPin, label: 'Out for Delivery' },
                            { id: 'delivered', icon: Package, label: 'Delivered' }
                        ].map((step, idx) => {
                            const isCompleted = idx <= currentStep;
                            const isActive = idx === currentStep;
                            const stepTimestamp = getStepTimestamp(step.id);

                            return (
                                <div key={step.id} className="relative z-10 flex flex-col items-center group">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border-4 border-dark-800 shadow-sm
                                        ${isCompleted ? 'bg-accent-500 text-dark-900' : 'bg-dark-700 text-silver-600'}`}>
                                        <step.icon size={18} />
                                    </div>
                                    <span className={`mt-2 text-xs font-bold uppercase tracking-tighter
                                        ${isActive ? 'text-accent-500' : 'text-silver-600'}`}>
                                        {step.label}
                                    </span>
                                    {isCompleted && stepTimestamp && (
                                        <span className="text-[10px] text-silver-500 mt-0.5">
                                            {new Date(stepTimestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        </span>
                                    )}
                                    {isCompleted && !stepTimestamp && idx === 0 && order.created_at && (
                                        <span className="text-[10px] text-silver-500 mt-0.5">
                                            {new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                <div className="bg-red-500/10 rounded-3xl p-8 border border-red-500/20">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center shrink-0 border border-red-500/20">
                                <AlertCircle size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white mb-1">Order Cancelled</h2>
                                <p className="text-red-400/80 font-medium">Reason: {order.cancellation_reason || 'No reason provided'}</p>
                            </div>
                        </div>

                        <div className="bg-dark-800 rounded-2xl p-6 shadow-sm border border-dark-700 w-full md:w-auto">
                            <p className="text-xs font-bold text-silver-500 uppercase tracking-widest mb-3">Refund Status</p>
                            <div className="flex items-center gap-4">
                                <span className={`px-4 py-1.5 rounded-full text-sm font-bold capitalize 
                                    ${order.refund_status === 'refunded' ? 'bg-green-500/10 text-green-500 border border-green-500/20' :
                                        order.refund_status === 'pending' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' :
                                            'bg-dark-700 text-silver-500 border border-dark-600'}`}>
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
                    <div className="bg-dark-800 rounded-3xl shadow-sm border border-dark-700 overflow-hidden">
                        <div className="p-6 border-b border-dark-700 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                <Package size={20} className="text-accent-500" /> Items Summary
                            </h2>
                            <span className="text-sm font-medium text-silver-500">{order.items?.length || 0} Products</span>
                        </div>

                        <div className="divide-y divide-dark-700">
                            {order.items?.map((item) => (
                                <div key={item.id} className="p-6 flex items-center gap-4 hover:bg-dark-700/50 transition-colors">
                                    <div className="w-16 h-16 bg-dark-700 rounded-2xl flex items-center justify-center overflow-hidden shrink-0 border border-dark-600">
                                        {item.product_image ? (
                                            <img src={`${item.product_image}`} alt={item.product_name} className="w-full h-full object-cover" />
                                        ) : (
                                            <Package size={24} className="text-silver-600" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-white truncate">{item.product_name}</h3>
                                        <p className="text-sm text-silver-500 truncate">SKU: {item.sku || 'N/A'}</p>
                                    </div>
                                    <div className="text-right shrink-0 flex flex-col items-end gap-0.5">
                                        <div className="font-bold text-white">₹{formatNumber(item.price)}</div>
                                        {item.original_price && Number(item.original_price) > item.price && (
                                            <div className="text-xs text-silver-600 line-through">₹{formatNumber(Number(item.original_price))}</div>
                                        )}
                                        {item.mrp && (
                                            <div className="text-[10px] text-silver-500 font-medium">MRP: ₹{formatNumber(Number(item.mrp))}</div>
                                        )}
                                        <div className="text-xs text-accent-500 font-bold uppercase mt-1">Qty: {item.quantity}</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="p-8 bg-dark-900/30 space-y-3">
                            <div className="flex justify-between text-silver-400">
                                <span>Subtotal</span>
                                <span>₹{formatNumber(order.total_amount)}</span>
                            </div>
                            <div className="flex justify-between text-silver-400">
                                <span>Delivery Fee</span>
                                <span className="text-green-500 font-medium tracking-tight">FREE</span>
                            </div>
                            <div className="flex justify-between items-end pt-3 border-t border-dark-700">
                                <span className="font-bold text-white">Total Amount</span>
                                <span className="text-3xl font-extrabold text-accent-500">₹{formatNumber(order.total_amount)}</span>
                            </div>
                            {order.profit !== undefined && (
                                <div className="flex justify-between items-center pt-2">
                                    <span className="text-sm font-medium text-silver-500">Net Profit</span>
                                    <span className={`text-lg font-bold ${order.profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                        ₹{formatNumber(order.profit)}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Info */}
                <div className="space-y-6">
                    {/* Courier & Shipping Fulfillment Card */}
                    <div className="bg-dark-800 rounded-3xl p-8 shadow-sm border border-dark-700">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                <Truck size={20} className="text-accent-500" /> Courier & Shipping
                            </h2>
                            {order.courier_awb ? (
                                <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                                    Dispatched
                                </span>
                            ) : (
                                <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                    Ready to Ship
                                </span>
                            )}
                        </div>

                        {order.courier_awb ? (
                            <div className="space-y-4">
                                <div className="p-4 bg-dark-900/60 rounded-2xl border border-dark-700">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="text-xs text-silver-400 uppercase font-semibold">Logistics Partner</div>
                                            <div className="text-base font-extrabold text-white mt-0.5">
                                                {order.courier_name || 'Courier Partner'}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs text-silver-400 uppercase font-semibold">AWB Tracking #</div>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <span className="font-mono text-sm font-bold text-accent-400">{order.courier_awb}</span>
                                                <button
                                                    onClick={() => copyToClipboard(order.courier_awb || '')}
                                                    title="Copy AWB"
                                                    className="text-silver-400 hover:text-white p-1"
                                                >
                                                    {copiedAwb ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-dark-750 text-xs">
                                        <div>
                                            <span className="text-silver-500">Weight:</span>{' '}
                                            <span className="text-white font-bold">{order.package_weight || 0.5} kg</span>
                                        </div>
                                        <div>
                                            <span className="text-silver-500">Dimensions:</span>{' '}
                                            <span className="text-white font-mono">{order.package_length || 10}x{order.package_width || 10}x{order.package_height || 5} cm</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={handleOpenTrackModal}
                                        className="py-2.5 px-3 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                                    >
                                        <Navigation size={14} /> Track Live
                                    </button>
                                    <button
                                        onClick={handleOpenLabelModal}
                                        className="py-2.5 px-3 bg-accent-500/10 hover:bg-accent-500/20 text-accent-400 border border-accent-500/30 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                                    >
                                        <Printer size={14} /> Print Label
                                    </button>
                                </div>

                                {order.courier_tracking_url && (
                                    <a
                                        href={order.courier_tracking_url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="w-full py-2 bg-dark-700 hover:bg-dark-600 text-silver-300 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 border border-dark-600"
                                    >
                                        Open Tracking Page <ExternalLink size={12} />
                                    </a>
                                )}

                                <button
                                    onClick={handleOpenShipModal}
                                    className="w-full text-center text-xs text-silver-500 hover:text-silver-300 font-medium pt-1"
                                >
                                    Re-dispatch / Change Courier
                                </button>
                            </div>
                        ) : (
                            <div>
                                <p className="text-xs text-silver-400 mb-4 leading-relaxed">
                                    Connect and fulfill this order with Shiprocket, Delhivery, Blue Dart, DTDC, India Post, or manual dispatch.
                                </p>
                                <button
                                    onClick={handleOpenShipModal}
                                    className="w-full py-3 bg-gradient-to-r from-accent-600 to-accent-500 hover:from-accent-500 hover:to-accent-400 text-dark-900 font-extrabold rounded-2xl shadow-lg shadow-accent-500/20 transition-all flex items-center justify-center gap-2"
                                >
                                    <Truck size={18} />
                                    Ship with Courier Partner
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Customer Info */}
                    <div className="bg-dark-800 rounded-3xl p-8 shadow-sm border border-dark-700">
                        <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                            <User size={20} className="text-accent-500" /> Customer Details
                        </h2>
                        <div className="space-y-6">
                            <div className="flex items-start gap-3">
                                <div className="p-2.5 bg-dark-700 rounded-2xl text-silver-500 shrink-0">
                                    <User size={20} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] text-silver-500 font-bold uppercase tracking-widest mb-0.5">Full Name</p>
                                    <p className="font-bold text-white truncate">{order.customer?.name || 'Guest User'}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="p-2.5 bg-dark-700 rounded-2xl text-silver-500 shrink-0">
                                    <Phone size={20} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] text-silver-500 font-bold uppercase tracking-widest mb-0.5">Contact Number</p>
                                    <p className="font-bold text-white truncate">{order.customer?.phone || 'N/A'}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="p-2.5 bg-dark-700 rounded-2xl text-silver-500 shrink-0">
                                    <MapPin size={20} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] text-silver-500 font-bold uppercase tracking-widest mb-0.5">Shipping Address</p>
                                    <p className="font-medium text-silver-300 leading-relaxed text-sm">{order.delivery_address || 'Default store location address'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Order Metadata */}
                    <div className="bg-dark-800 rounded-3xl p-8 shadow-sm border border-dark-700">
                        <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                            <Calendar size={20} className="text-accent-500" /> Order History
                        </h2>
                        <div className="space-y-6">
                            <div className="flex items-start gap-3">
                                <div className="p-2.5 bg-dark-700 rounded-2xl text-silver-500 shrink-0">
                                    <Calendar size={20} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] text-silver-500 font-bold uppercase tracking-widest mb-0.5">Placed on</p>
                                    <p className="font-bold text-white">{formatDate(order.created_at)}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="p-2.5 bg-dark-700 rounded-2xl text-silver-500 shrink-0">
                                    <CreditCard size={20} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] text-silver-500 font-bold uppercase tracking-widest mb-0.5">Payment Method</p>
                                    <p className="font-bold text-white">{order.is_cod ? 'Cash on Delivery (COD)' : 'Online Payment'}</p>
                                </div>
                            </div>
                            {user?.is_superuser && (
                                <div className="flex items-start gap-3 relative">
                                    <div className="p-2.5 bg-dark-700 rounded-2xl text-silver-500 shrink-0">
                                        <CreditCard size={20} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[10px] text-silver-500 font-bold uppercase tracking-widest mb-0.5">Payment Status</p>
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${order.payment_status === 'received_from_meesho' || order.payment_status === 'received' || order.payment_status === 'paid' ? 'bg-green-500/10 text-green-500 border border-green-500/20' :
                                                order.payment_status === 'failed_rto' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                                                    order.payment_status === 'pending' || order.payment_status === 'pending_cod' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' :
                                                        'bg-dark-700 text-silver-500 border border-dark-600'
                                                }`}>
                                                {order.payment_status_display || order.payment_status || 'Pending'}
                                            </span>
                                            <button
                                                onClick={() => setShowPaymentStatusDropdown(!showPaymentStatusDropdown)}
                                                className="ml-2 p-1 text-silver-500 hover:text-white hover:bg-dark-600 rounded"
                                                title="Update Payment Status"
                                            >
                                                <Edit3 size={14} />
                                            </button>

                                            {/* Payment Status Dropdown */}
                                            {showPaymentStatusDropdown && (
                                                <div className="absolute left-0 top-full mt-2 w-56 bg-dark-800 rounded-xl shadow-xl border border-dark-700 py-1 z-50">
                                                    {PAYMENT_STATUSES.map((status) => (
                                                        <button
                                                            key={status.value}
                                                            onClick={() => handleUpdatePaymentStatus(status.value)}
                                                            className="w-full text-left px-4 py-2 text-sm text-silver-300 hover:bg-dark-700 hover:text-white transition-colors"
                                                        >
                                                            {status.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div className="flex items-start gap-3">
                                <div className="p-2.5 bg-dark-700 rounded-2xl text-silver-500 shrink-0">
                                    <Package size={20} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] text-silver-500 font-bold uppercase tracking-widest mb-0.5">Supplier Order ID</p>
                                    <p className="font-mono text-white">{order.meesho_order_id || 'Not Assigned'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Order Actions */}
                    <div className="bg-dark-800 rounded-3xl p-8 shadow-sm border border-dark-700">
                        <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                            <CheckCircle2 size={20} className="text-accent-500" /> Order Actions
                        </h2>
                        <div className="space-y-4">
                            {order.status !== 'returned' && order.status !== 'cancelled' && (
                                <button
                                    onClick={() => setIsReturning(true)}
                                    className="w-full flex items-center justify-between p-4 bg-orange-500/10 text-orange-500 border border-orange-500/20 rounded-2xl font-bold hover:bg-orange-500/20 transition-all group"
                                >
                                    <span className="flex items-center gap-3">
                                        <RotateCcw size={20} className="group-hover:-rotate-90 transition-transform" />
                                        Return Order
                                    </span>
                                    <ChevronDown size={20} className="-rotate-90" />
                                </button>
                            )}

                            <button
                                onClick={handleDownloadInvoice}
                                disabled={downloadingInvoice}
                                className="w-full flex items-center justify-between p-4 bg-dark-700 text-silver-300 border border-dark-600 rounded-2xl font-bold hover:bg-dark-600 hover:text-white transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <span className="flex items-center gap-3">
                                    {downloadingInvoice ? <Loader2 size={20} className="animate-spin text-accent-500" /> : <Download size={20} />}
                                    {downloadingInvoice ? 'Generating Invoice...' : 'Download Invoice (Excel)'}
                                </span>
                                <ExternalLink size={20} className="group-hover:scale-110 transition-transform" />
                            </button>

                            {user?.is_superuser && (
                                <div className="pt-4 border-t border-dark-600">
                                    <label className="block text-xs font-bold text-silver-500 uppercase tracking-widest mb-2">Admin Notes</label>
                                    <div className="relative">
                                        <textarea
                                            value={orderNotes}
                                            onChange={(e) => setOrderNotes(e.target.value)}
                                            placeholder="Add private notes for this order..."
                                            className="w-full p-4 rounded-2xl bg-dark-700 border border-dark-600 focus:ring-2 focus:ring-accent-500 outline-none transition-all min-h-[100px] text-sm font-medium text-white placeholder-silver-600"
                                        />
                                        <button
                                            onClick={handleSaveNotes}
                                            className="absolute bottom-3 right-3 p-2 bg-dark-800 text-accent-500 rounded-xl shadow-sm border border-dark-600 hover:bg-dark-600 transition-all"
                                            title="Save Note"
                                        >
                                            <StickyNote size={16} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            {/* Return Modal */}
            {isReturning && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-dark-800 rounded-3xl p-8 max-w-md w-full shadow-2xl animate-scale-up border border-dark-700">
                        <h2 className="text-2xl font-bold text-white mb-2">Return Order</h2>
                        <p className="text-silver-500 mb-6">Process a customer return. This will mark the order as returned and initiate the refund process.</p>

                        <textarea
                            value={returnReason}
                            onChange={(e) => setReturnReason(e.target.value)}
                            placeholder="Reason for return..."
                            className="w-full p-4 rounded-2xl bg-dark-700 border border-dark-600 focus:ring-2 focus:ring-accent-500 outline-none transition-all mb-6 min-h-[120px] text-white placeholder-silver-600"
                        />

                        <div className="flex gap-3">
                            <button
                                onClick={() => setIsReturning(false)}
                                className="flex-1 py-3 px-4 rounded-2xl font-bold text-silver-400 hover:bg-dark-700 transition-all border border-dark-600"
                                disabled={isUpdating}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleReturnOrder}
                                className="flex-1 py-3 px-4 bg-orange-500 text-white rounded-2xl font-bold hover:bg-orange-600 shadow-lg shadow-orange-500/20 transition-all disabled:opacity-50"
                                disabled={isUpdating || !returnReason.trim()}
                            >
                                {isUpdating ? 'Processing...' : 'Confirm Return'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Courier Dispatch / Fulfillment Modal */}
            {showShipModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-dark-800 rounded-3xl p-6 md:p-8 max-w-lg w-full border border-dark-700 shadow-2xl relative max-h-[90vh] overflow-y-auto">
                        <button
                            onClick={() => setShowShipModal(false)}
                            className="absolute top-6 right-6 p-2 text-silver-400 hover:text-white hover:bg-dark-700 rounded-full transition-all"
                        >
                            <XCircle size={20} />
                        </button>

                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-2xl bg-accent-500/10 border border-accent-500/20 text-accent-400 flex items-center justify-center font-bold">
                                <Truck size={20} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">Dispatch with Courier</h2>
                                <p className="text-xs text-silver-400">Order #{order.order_id} • To {order.delivery_city} ({order.delivery_pincode})</p>
                            </div>
                        </div>

                        {dispatchError && (
                            <div className="my-4 p-3.5 bg-red-500/10 border border-red-500/20 text-red-300 rounded-2xl text-xs font-semibold flex items-center gap-2">
                                <AlertCircle size={16} className="shrink-0" />
                                {dispatchError}
                            </div>
                        )}

                        <form onSubmit={handleDispatchShipment} className="space-y-4 mt-4">
                            <div>
                                <label className="block text-xs font-bold text-silver-400 uppercase mb-1">Select Courier Partner</label>
                                {loadingPartners ? (
                                    <div className="p-3 bg-dark-700 rounded-xl text-silver-400 text-xs flex items-center gap-2">
                                        <RefreshCw size={14} className="animate-spin text-accent-500" />
                                        Loading available carriers...
                                    </div>
                                ) : (
                                    <select
                                        value={selectedPartnerId}
                                        onChange={(e) => setSelectedPartnerId(e.target.value ? Number(e.target.value) : '')}
                                        className="w-full px-4 py-2.5 bg-dark-700 border border-dark-600 rounded-xl text-white text-sm focus:outline-none focus:border-accent-500 font-medium"
                                    >
                                        {courierPartners.map((p) => (
                                            <option key={p.id} value={p.id}>
                                                {p.name} {p.is_default ? '(Default)' : ''} — Base: ₹{p.base_rate}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-silver-400 uppercase mb-1">Package Weight (Kg)</label>
                                    <input
                                        type="number"
                                        step="0.05"
                                        min="0.1"
                                        value={dispatchWeight}
                                        onChange={(e) => setDispatchWeight(e.target.value)}
                                        required
                                        className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-xl text-white text-sm focus:outline-none focus:border-accent-500 font-mono"
                                    />
                                    <span className="text-[10px] text-silver-500">Auto-calculated from items</span>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-silver-400 uppercase mb-1">Payment Method</label>
                                    <div className="px-4 py-2 bg-dark-900/60 border border-dark-700 rounded-xl text-xs font-bold">
                                        {order.is_cod ? (
                                            <span className="text-amber-400">COD (Collect ₹{order.total_amount})</span>
                                        ) : (
                                            <span className="text-green-400">PREPAID (₹0 to collect)</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-silver-400 uppercase mb-1">Dimensions L x W x H (cm)</label>
                                <div className="grid grid-cols-3 gap-2">
                                    <input
                                        type="number"
                                        step="0.5"
                                        min="1"
                                        placeholder="Length"
                                        value={dispatchLength}
                                        onChange={(e) => setDispatchLength(e.target.value)}
                                        required
                                        className="px-3 py-2 bg-dark-700 border border-dark-600 rounded-xl text-white text-sm focus:outline-none focus:border-accent-500 font-mono text-center"
                                    />
                                    <input
                                        type="number"
                                        step="0.5"
                                        min="1"
                                        placeholder="Width"
                                        value={dispatchWidth}
                                        onChange={(e) => setDispatchWidth(e.target.value)}
                                        required
                                        className="px-3 py-2 bg-dark-700 border border-dark-600 rounded-xl text-white text-sm focus:outline-none focus:border-accent-500 font-mono text-center"
                                    />
                                    <input
                                        type="number"
                                        step="0.5"
                                        min="1"
                                        placeholder="Height"
                                        value={dispatchHeight}
                                        onChange={(e) => setDispatchHeight(e.target.value)}
                                        required
                                        className="px-3 py-2 bg-dark-700 border border-dark-600 rounded-xl text-white text-sm focus:outline-none focus:border-accent-500 font-mono text-center"
                                    />
                                </div>
                                <div className="flex justify-between items-center text-[11px] text-silver-500 mt-1">
                                    <span>Volumetric weight: {(((parseFloat(dispatchLength) || 10) * (parseFloat(dispatchWidth) || 10) * (parseFloat(dispatchHeight) || 5)) / 5000).toFixed(3)} kg</span>
                                    <span>Divisor: 5000</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-silver-400 uppercase mb-1">Custom AWB / Tracking # (Optional)</label>
                                <input
                                    type="text"
                                    placeholder="Leave blank to auto-generate via carrier"
                                    value={customAwb}
                                    onChange={(e) => setCustomAwb(e.target.value)}
                                    className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-xl text-white text-sm focus:outline-none focus:border-accent-500 font-mono"
                                />
                            </div>

                            <div className="pt-3 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowShipModal(false)}
                                    className="flex-1 py-3 px-4 rounded-xl font-bold text-silver-400 hover:bg-dark-700 transition-all border border-dark-600 text-sm"
                                    disabled={isDispatching}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isDispatching}
                                    className="flex-1 py-3 px-4 bg-accent-500 hover:bg-accent-400 text-dark-900 rounded-xl font-extrabold shadow-lg shadow-accent-500/20 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                                >
                                    {isDispatching ? <RefreshCw size={16} className="animate-spin" /> : <Truck size={16} />}
                                    {isDispatching ? 'Generating AWB...' : 'Generate AWB & Ship'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Live Tracking Timeline Modal */}
            {showTrackModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-dark-800 rounded-3xl p-6 md:p-8 max-w-xl w-full border border-dark-700 shadow-2xl relative max-h-[90vh] overflow-y-auto">
                        <button
                            onClick={() => setShowTrackModal(false)}
                            className="absolute top-6 right-6 p-2 text-silver-400 hover:text-white hover:bg-dark-700 rounded-full transition-all"
                        >
                            <XCircle size={20} />
                        </button>

                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
                                <Truck size={20} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">Live Tracking Timeline</h2>
                                <p className="text-xs text-silver-400 font-mono">AWB: {order.courier_awb} • {order.courier_name}</p>
                            </div>
                        </div>

                        <div className="my-6 p-4 bg-dark-900/60 rounded-2xl border border-dark-700 flex justify-between items-center text-xs">
                            <div>
                                <span className="text-silver-500">Destination:</span>
                                <div className="text-white font-bold text-sm">{order.delivery_city} ({order.delivery_pincode})</div>
                            </div>
                            <div>
                                <span className="text-silver-500">Status:</span>
                                <div className="text-accent-400 font-bold uppercase">{order.status}</div>
                            </div>
                        </div>

                        <div className="space-y-6 relative pl-6 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-dark-600">
                            {trackingLoading ? (
                                <div className="py-8 text-center text-silver-400">
                                    <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-accent-500" />
                                    Querying courier live network...
                                </div>
                            ) : liveTrackingEvents.length === 0 ? (
                                <p className="text-silver-400 text-sm">No checkpoints available yet.</p>
                            ) : (
                                liveTrackingEvents.map((ev, idx) => (
                                    <div key={idx} className="relative">
                                        <div className={`absolute -left-6 top-1 w-3.5 h-3.5 rounded-full border-2 ${idx === liveTrackingEvents.length - 1 ? 'bg-accent-500 border-accent-400 ring-4 ring-accent-500/20' : 'bg-dark-600 border-dark-500'}`} />
                                        <div className="text-sm font-bold text-white">{ev.activity}</div>
                                        <div className="flex items-center gap-2 text-xs text-silver-400 mt-1">
                                            <span className="text-accent-400 font-semibold">{ev.location}</span>
                                            <span>•</span>
                                            <span>{ev.timestamp}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {order.courier_tracking_url && (
                            <div className="mt-8 pt-4 border-t border-dark-700 flex justify-end">
                                <a
                                    href={order.courier_tracking_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-4 py-2 bg-dark-700 hover:bg-dark-600 text-silver-200 text-xs font-bold rounded-xl transition-all border border-dark-600 flex items-center gap-1.5"
                                >
                                    Open Carrier Portal <ExternalLink size={13} />
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Print Thermal Shipping Label Modal */}
            {showLabelModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-dark-800 rounded-3xl p-6 max-w-2xl w-full border border-dark-700 shadow-2xl relative max-h-[95vh] flex flex-col">
                        <div className="flex justify-between items-center pb-4 border-b border-dark-700">
                            <div>
                                <h2 className="text-lg font-bold text-white">Print Shipping Label (4x6" Thermal)</h2>
                                <p className="text-xs text-silver-400 font-mono">Consignment: {order.courier_awb} • Order #{order.order_id}</p>
                            </div>
                            <button
                                onClick={() => setShowLabelModal(false)}
                                className="p-2 text-silver-400 hover:text-white hover:bg-dark-700 rounded-full transition-all"
                            >
                                <XCircle size={20} />
                            </button>
                        </div>

                        <div className="flex-1 my-4 overflow-hidden rounded-2xl bg-white p-2">
                            {labelLoading ? (
                                <div className="h-96 flex flex-col items-center justify-center text-dark-700">
                                    <RefreshCw size={24} className="animate-spin mb-2" />
                                    Loading standard thermal layout...
                                </div>
                            ) : (
                                <iframe
                                    srcDoc={labelHtml}
                                    title="Shipping Label"
                                    className="w-full h-[520px] border-0"
                                />
                            )}
                        </div>

                        <div className="pt-2 flex justify-end gap-3">
                            <button
                                onClick={() => setShowLabelModal(false)}
                                className="px-4 py-2 bg-dark-700 hover:bg-dark-600 text-silver-300 text-sm font-bold rounded-xl transition-all"
                            >
                                Close
                            </button>
                            <button
                                onClick={() => {
                                    const win = window.open('', '_blank');
                                    if (win) {
                                        win.document.write(labelHtml);
                                        win.document.close();
                                        setTimeout(() => win.print(), 300);
                                    }
                                }}
                                className="px-5 py-2 bg-accent-500 hover:bg-accent-400 text-dark-900 text-sm font-bold rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-accent-500/20"
                            >
                                <Printer size={16} /> Print Label Now
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>

    );
}
