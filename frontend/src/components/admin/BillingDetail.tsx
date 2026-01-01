import { ArrowLeft, CheckCircle, XCircle, Share2, Calendar, Store, Mail, Phone, MapPin, IndianRupee, MessageCircle, Send } from 'lucide-react';
import { Subscription } from '@/types/admin';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { API_BASE_URL } from '@/config/apiConfig';

interface BillingDetailProps {
    subscription: Subscription;
    onBack: () => void;
}

export default function BillingDetail({ subscription: initialSub, onBack }: BillingDetailProps) {
    const { token } = useAuth();
    const [subscription, setSubscription] = useState(initialSub);
    const [loading, setLoading] = useState(false);

    const formatNumber = (num: number) => {
        return new Intl.NumberFormat('en-IN').format(num);
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const handleMarkAsPaid = async () => {
        if (!confirm('Are you sure you want to mark this bill as paid?')) return;
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/admin/subscriptions/${subscription.id}/mark_as_paid/`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setSubscription({ ...subscription, is_paid: true, status: 'active' });
            } else {
                alert('Failed to update payment status.');
            }
        } catch (error) {
            console.error('Error marking as paid:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSendEmail = () => {
        const subject = `Commission Bill Settement - ${subscription.shop_name}`;
        const body = `Hello ${subscription.shop_name},\n\nYour commission bill for the period ${formatDate(subscription.start_date)} to ${formatDate(subscription.end_date)} is ready.\n\nTotal Amount: ₹${formatNumber(subscription.amount)}\nStatus: ${subscription.is_paid ? 'Paid' : 'Pending'}\n\nPlease settle the amount if pending.\n\nRegards,\nMarkexo Admin`;
        window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    };

    const handleSendWhatsApp = () => {
        const text = `*Markexo Commission Bill*\n\nShop: *${subscription.shop_name}*\nPeriod: ${formatDate(subscription.start_date)} - ${formatDate(subscription.end_date)}\nAmount: *₹${formatNumber(subscription.amount)}*\nStatus: *${subscription.is_paid ? 'PAID' : 'PENDING'}*\n\nPlease settle the payment at the earliest.`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-700 border-green-200';
            case 'expired': return 'bg-red-100 text-red-700 border-red-200';
            case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    return (
        <div className="animate-fade-in">
            <button
                onClick={onBack}
                className="flex items-center gap-2 text-gray-600 hover:text-primary-600 mb-6 transition-colors group"
            >
                <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                <span>Back to Billing</span>
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Billing Info */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h1 className="text-3xl font-display font-bold text-gray-900 mb-2">
                                    Bill Details
                                </h1>
                                <p className="text-gray-500 flex items-center gap-2">
                                    <span className="font-mono text-sm">Bill ID: #{subscription.id.toString().padStart(6, '0')}</span>
                                    <span>•</span>
                                    <span>Generated on {formatDate(subscription.created_at)}</span>
                                </p>
                            </div>
                            <span className={`px-4 py-1.5 rounded-full text-sm font-semibold border ${getStatusColor(subscription.status)} capitalize`}>
                                {subscription.status}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-8 mb-8 border-y border-gray-100 py-8">
                            <div className="space-y-1">
                                <p className="text-sm text-gray-400 uppercase tracking-wider font-semibold">Billing Cycle</p>
                                <div className="flex items-center gap-2 text-gray-900 font-medium">
                                    <Calendar size={18} className="text-primary-500" />
                                    {formatDate(subscription.start_date)} - {formatDate(subscription.end_date)}
                                </div>
                            </div>
                            <div className="space-y-1 text-right">
                                <p className="text-sm text-gray-400 uppercase tracking-wider font-semibold">Total Commission</p>
                                <div className="text-3xl font-display font-bold text-gray-900">
                                    ₹{formatNumber(subscription.amount)}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                <CheckCircle size={20} className="text-green-500" />
                                Payment Status
                            </h2>
                            <div className={`p-4 rounded-2xl flex items-center justify-between ${subscription.is_paid ? 'bg-green-50 border border-green-100' : 'bg-red-50 border border-red-100'}`}>
                                <div className="flex items-center gap-3">
                                    {subscription.is_paid ? (
                                        <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                                            <CheckCircle size={24} />
                                        </div>
                                    ) : (
                                        <div className="w-10 h-10 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
                                            <XCircle size={24} />
                                        </div>
                                    )}
                                    <div>
                                        <p className={`font-semibold ${subscription.is_paid ? 'text-green-800' : 'text-red-800'}`}>
                                            {subscription.is_paid ? 'Payment Received' : 'Payment Pending'}
                                        </p>
                                        <p className={`text-sm ${subscription.is_paid ? 'text-green-600' : 'text-red-600'}`}>
                                            {subscription.is_paid ? 'The commission has been settled for this period.' : 'This bill is currently unpaid and requires attention.'}
                                        </p>
                                    </div>
                                </div>
                                {!subscription.is_paid && (
                                    <button
                                        onClick={handleMarkAsPaid}
                                        disabled={loading}
                                        className="px-6 py-2 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-colors shadow-sm shadow-primary-200 disabled:opacity-50"
                                    >
                                        {loading ? 'Processing...' : 'Mark as Paid'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Additional Notes/Log (Optional) */}
                    <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Billing Information</h2>
                        <div className="space-y-4">
                            <div className="flex justify-between py-3 border-b border-gray-50">
                                <span className="text-gray-500">Plan Type</span>
                                <span className="font-medium text-gray-900">{subscription.plan_name}</span>
                            </div>
                            <div className="flex justify-between py-3 border-b border-gray-50">
                                <span className="text-gray-500">Service Period</span>
                                <span className="font-medium text-gray-900">7 Days (Weekly)</span>
                            </div>
                            <div className="flex justify-between py-3 border-b border-gray-50">
                                <span className="text-gray-500">Calculated On</span>
                                <span className="font-medium text-gray-900">{formatDate(subscription.end_date)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Shop Info Card */}
                <div className="space-y-6">
                    <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                        <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                            Shop Information
                        </h2>
                        <div className="text-center mb-6">
                            <div className="w-20 h-20 bg-primary-100 text-primary-700 rounded-3xl flex items-center justify-center font-bold text-3xl mx-auto mb-4 border border-primary-50 shadow-sm shadow-primary-100">
                                {subscription.shop_name.charAt(0).toUpperCase()}
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">{subscription.shop_name}</h3>
                            <p className="text-sm text-gray-500 font-mono mt-1">ID: MKX-S{subscription.shop?.toString().padStart(4, '0') || '0000'}</p>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-start gap-3 p-3 rounded-2xl hover:bg-gray-50 transition-colors group cursor-pointer border border-transparent hover:border-gray-100">
                                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-100 transition-colors">
                                    <Mail size={18} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Email</p>
                                    <p className="text-sm text-gray-700 font-medium truncate">contact@{subscription.shop_name.toLowerCase().replace(/\s+/g, '')}.com</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 p-3 rounded-2xl hover:bg-gray-50 transition-colors group cursor-pointer border border-transparent hover:border-gray-100">
                                <div className="p-2 bg-orange-50 text-orange-600 rounded-xl group-hover:bg-orange-100 transition-colors">
                                    <MapPin size={18} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Location</p>
                                    <p className="text-sm text-gray-700 font-medium truncate">Main Market Area, City</p>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => alert('Feature coming soon: This will navigate to the Shop Management tab for this specific shop.')}
                            className="w-full mt-6 py-3 border border-primary-100 text-primary-600 rounded-xl font-semibold hover:bg-primary-50 transition-all flex items-center justify-center gap-2"
                        >
                            View Shop Details
                        </button>
                    </div>

                    <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-3xl p-8 text-white shadow-xl shadow-primary-200">
                        <Share2 size={32} className="mb-4 opacity-50" />
                        <h3 className="text-xl font-bold mb-2">Send Bill to Shop</h3>
                        <p className="text-primary-100 text-sm mb-6 leading-relaxed">
                            Share this commission statement via email or WhatsApp with the shop owner.
                        </p>
                        <div className="space-y-2">
                            <button
                                onClick={handleSendEmail}
                                className="w-full py-2.5 bg-white/20 hover:bg-white/30 rounded-xl font-medium transition-colors text-sm flex items-center justify-center gap-2"
                            >
                                <Mail size={16} /> Send via Email
                            </button>
                            <button
                                onClick={handleSendWhatsApp}
                                className="w-full py-2.5 bg-white text-primary-700 rounded-xl font-bold transition-transform hover:scale-[1.02] active:scale-95 text-sm shadow-md flex items-center justify-center gap-2"
                            >
                                <MessageCircle size={16} /> Send via WhatsApp
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
