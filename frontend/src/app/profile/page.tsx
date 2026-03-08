'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useCustomerAuth } from '@/context/CustomerAuthContext';
import { useRouter } from 'next/navigation';
import { User, Package, Heart, MapPin, Settings, LogOut, CheckCircle, Truck, Clock, XCircle, Trash2, Plus, Edit2, RotateCcw } from 'lucide-react';
import { useCart } from '@/lib/cart';
import { API_BASE_URL } from '@/config/apiConfig';

// Helper function to format date
const formatDate = (dateString: string) => {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch {
        return dateString;
    }
};

export default function ProfilePage() {
    const { customer, isAuthenticated, isLoading, logout, orders, wishlist, addresses, removeFromWishlist, deleteAddress, addAddress, refreshOrders } = useCustomerAuth();
    const router = useRouter();
    const { addItem } = useCart();
    const [activeTab, setActiveTab] = useState('overview');

    const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
    const [selectedOrderForReturn, setSelectedOrderForReturn] = useState<any>(null);
    const [returnReason, setReturnReason] = useState('');
    const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);

    const handleReturnClick = (order: any) => {
        setSelectedOrderForReturn(order);
        setReturnReason('');
        setIsReturnModalOpen(true);
    };

    const submitReturn = async () => {
        if (!selectedOrderForReturn || !returnReason.trim()) return;

        setIsSubmittingReturn(true);
        try {
            const response = await fetch(`${API_BASE_URL}/orders/${selectedOrderForReturn.id}/return/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    customer_email: customer?.email,
                    reason: returnReason
                })
            });

            if (response.ok) {
                alert('Return requested successfully');
                setIsReturnModalOpen(false);
                refreshOrders();
            } else {
                const data = await response.json();
                alert(data.error || 'Failed to request return');
            }
        } catch (error) {
            console.error('Error returning order:', error);
            alert('An error occurred');
        } finally {
            setIsSubmittingReturn(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-dark-900 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 border-4 border-accent-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-silver-400 font-medium">Loading your profile...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated || !customer) {
        // Redirect to login if not authenticated (should be handled by protected route wrapper ideally)
        if (typeof window !== 'undefined') router.push('/login');
        return null;
    }

    const tabs = [
        { id: 'overview', label: 'Overview', icon: User },
        { id: 'orders', label: 'My Orders', icon: Package },
        { id: 'wishlist', label: 'Wishlist', icon: Heart },
        { id: 'addresses', label: 'Addresses', icon: MapPin },
        { id: 'settings', label: 'Settings', icon: Settings },
    ];

    return (
        <div className="min-h-screen bg-dark-900 py-12">
            <div className="container mx-auto px-4">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Sidebar */}
                    <div className="lg:w-80" data-aos="fade-right">
                        <div className="bg-white dark:bg-dark-800 dark:border dark:border-dark-700 rounded-2xl p-6 shadow-sm mb-6">
                            <div className="flex items-center gap-4 mb-6">
                                <img
                                    src={customer.avatar || `https://ui-avatars.com/api/?name=${customer.name}&background=random`}
                                    alt={customer.name}
                                    className="w-16 h-16 rounded-full border-4 border-primary-50 dark:border-dark-700"
                                />
                                <div>
                                    <h2 className="font-bold text-gray-900 dark:text-white">{customer.name}</h2>
                                    <p className="text-sm text-gray-500 dark:text-silver-500 truncate max-w-[150px]">{customer.email}</p>
                                </div>
                            </div>

                            <nav className="space-y-1">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === tab.id
                                            ? 'bg-primary-50 dark:bg-accent-500/10 text-primary-700 dark:text-accent-500 font-medium'
                                            : 'text-gray-600 dark:text-silver-400 hover:bg-gray-50 dark:hover:bg-dark-700'
                                            }`}
                                    >
                                        <tab.icon size={20} />
                                        {tab.label}
                                    </button>
                                ))}
                                <div className="pt-4 mt-4 border-t border-gray-100 dark:border-dark-700">
                                    <button
                                        onClick={logout}
                                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                    >
                                        <LogOut size={20} />
                                        Logout
                                    </button>
                                </div>
                            </nav>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1" data-aos="fade-left" data-aos-delay="100">
                        {/* Overview Tab */}
                        {activeTab === 'overview' && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="bg-white dark:bg-dark-800 dark:border dark:border-dark-700 p-6 rounded-2xl shadow-sm">
                                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-4">
                                            <Package className="text-blue-600 dark:text-blue-400" size={24} />
                                        </div>
                                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{orders.length}</h3>
                                        <p className="text-gray-500 dark:text-silver-500">Total Orders</p>
                                    </div>
                                    <div className="bg-white dark:bg-dark-800 dark:border dark:border-dark-700 p-6 rounded-2xl shadow-sm">
                                        <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/30 rounded-xl flex items-center justify-center mb-4">
                                            <Heart className="text-pink-600 dark:text-pink-400" size={24} />
                                        </div>
                                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{wishlist.length}</h3>
                                        <p className="text-gray-500 dark:text-silver-500">Wishlist Items</p>
                                    </div>
                                    <div className="bg-white dark:bg-dark-800 dark:border dark:border-dark-700 p-6 rounded-2xl shadow-sm">
                                        <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center mb-4">
                                            <ShoppingBag className="text-green-600 dark:text-green-400" size={24} />
                                        </div>
                                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">0</h3>
                                        <p className="text-gray-500 dark:text-silver-500">Cart Items</p>
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-dark-800 dark:border dark:border-dark-700 rounded-2xl shadow-sm p-6">
                                    <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-4">Recent Orders</h3>
                                    {orders.length > 0 ? (
                                        <div className="space-y-4">
                                            {orders.map((order) => (
                                                <div key={order.id} className="flex items-center justify-between p-4 border border-gray-100 dark:border-dark-700 rounded-xl">
                                                    <div>
                                                        <p className="font-medium text-gray-900 dark:text-white">{order.id}</p>
                                                        <p className="text-sm text-gray-500 dark:text-silver-500">{formatDate(order.date)} • {order.items} Items</p>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${order.status === 'Delivered' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                                                            order.status === 'Processing' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
                                                                'bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-silver-300'
                                                            }`}>
                                                            {order.status}
                                                        </span>
                                                        <Link href={`/track-order?id=${order.id}`} className="text-primary-600 dark:text-accent-500 text-sm font-medium hover:underline">
                                                            Track
                                                        </Link>
                                                        {order.status === 'Delivered' && (
                                                            <button
                                                                onClick={() => handleReturnClick(order)}
                                                                className="text-orange-600 dark:text-orange-400 text-sm font-medium hover:underline flex items-center gap-1"
                                                            >
                                                                <RotateCcw size={14} /> Return
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8">
                                            <p className="text-gray-500 dark:text-silver-500">No orders yet.</p>
                                            <Link href="/products" className="text-primary-600 dark:text-accent-500 font-medium hover:underline mt-2 inline-block">Start Shopping</Link>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Orders Tab */}
                        {activeTab === 'orders' && (
                            <div className="bg-white dark:bg-dark-800 dark:border dark:border-dark-700 rounded-2xl shadow-sm p-6">
                                <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-6">My Orders</h3>
                                <div className="space-y-4">
                                    {orders.map((order) => {
                                        // Helper function to get step status
                                        const getStepStatus = (orderStatus: string, step: number) => {
                                            const statusMap: { [key: string]: number } = {
                                                'pending_verification': 1,
                                                'pending verification': 1,
                                                'pending': 1,
                                                'confirmed': 2,
                                                'ordered_from_meesho': 3,
                                                'processing': 3,
                                                'shipped': 4,
                                                'out_for_delivery': 5,
                                                'delivered': 6,
                                                'completed': 6,
                                            };
                                            const currentStep = statusMap[orderStatus.toLowerCase().replace(/ /g, '_')] || statusMap[orderStatus.toLowerCase()] || 1;
                                            if (step <= currentStep) return 'completed';
                                            return 'pending';
                                        };

                                        return (
                                            <div key={order.id} className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-2xl overflow-hidden shadow-lg transition-all hover:shadow-xl hover:border-gray-300 dark:hover:border-dark-600">
                                                <div className="bg-gray-50 dark:bg-dark-700/50 px-6 py-4 flex flex-wrap justify-between items-center gap-4 border-b border-gray-200 dark:border-dark-700">
                                                    <div className="flex flex-wrap gap-8">
                                                        <div>
                                                            <p className="text-xs text-gray-500 dark:text-silver-500 uppercase font-semibold tracking-wide">Order Placed</p>
                                                            <p className="text-sm font-bold text-gray-900 dark:text-white mt-0.5">{formatDate(order.date)}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-gray-500 dark:text-silver-500 uppercase font-semibold tracking-wide">Total</p>
                                                            <p className="text-sm font-bold text-gray-900 dark:text-white mt-0.5">₹{order.total.toLocaleString()}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-gray-500 dark:text-silver-500 uppercase font-semibold tracking-wide">Order ID</p>
                                                            <p className="text-sm font-bold text-primary-600 dark:text-accent-500 mt-0.5">{order.id}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-gray-500 dark:text-silver-500 uppercase font-semibold tracking-wide">Status</p>
                                                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold mt-0.5 ${order.status.toLowerCase().includes('delivered') || order.status.toLowerCase().includes('completed')
                                                                ? 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400'
                                                                : order.status.toLowerCase().includes('return') || order.status.toLowerCase() === 'rto'
                                                                    ? 'bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400'
                                                                    : order.status.toLowerCase() === 'cancelled'
                                                                        ? 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400'
                                                                        : order.status.toLowerCase().includes('shipped')
                                                                            ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400'
                                                                            : 'bg-gray-100 dark:bg-gray-500/20 text-gray-600 dark:text-gray-400'
                                                                }`}>
                                                                {order.status}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-3">
                                                        {order.status === 'Delivered' && (
                                                            <button
                                                                onClick={() => handleReturnClick(order)}
                                                                className="flex items-center gap-2 px-4 py-2 border border-orange-300 dark:border-orange-500/30 text-orange-600 dark:text-orange-500 bg-orange-50 dark:bg-orange-500/10 rounded-xl hover:bg-orange-100 dark:hover:bg-orange-500/20 font-medium transition-all text-xs"
                                                            >
                                                                <RotateCcw size={14} /> Return
                                                            </button>
                                                        )}
                                                        <Link href={`/track-order?id=${order.id}`} className="btn-secondary text-xs px-4 py-2 rounded-xl flex items-center gap-2">
                                                            Track Order
                                                        </Link>
                                                    </div>
                                                </div>


                                                {/* Tracking Progress Bar - Only show for active delivery orders */}
                                                {!order.status.toLowerCase().includes('return') &&
                                                    order.status.toLowerCase() !== 'rto' &&
                                                    order.status.toLowerCase() !== 'cancelled' && (
                                                        <div className="p-8">
                                                            <div className="flex items-center justify-between relative">
                                                                {/* Progress Line Background */}
                                                                <div className="absolute left-6 right-6 top-5 h-1 bg-gray-200 dark:bg-dark-600 rounded-full" />
                                                                {/* Progress Line Filled */}
                                                                <div
                                                                    className="absolute left-6 top-5 h-1 bg-gradient-to-r from-green-500 via-primary-500 dark:via-accent-500 to-green-400 rounded-full transition-all duration-700"
                                                                    style={{
                                                                        width: getStepStatus(order.status, 6) === 'completed' ? 'calc(100% - 48px)' :
                                                                            getStepStatus(order.status, 5) === 'completed' ? 'calc(80% - 38px)' :
                                                                                getStepStatus(order.status, 4) === 'completed' ? 'calc(60% - 29px)' :
                                                                                    getStepStatus(order.status, 3) === 'completed' ? 'calc(40% - 19px)' :
                                                                                        getStepStatus(order.status, 2) === 'completed' ? 'calc(20% - 10px)' : '0%'
                                                                    }}
                                                                />

                                                                {/* Step 1: Pending */}
                                                                <div className="flex flex-col items-center z-10 group">
                                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${getStepStatus(order.status, 1) === 'completed' ? 'bg-green-500 shadow-lg shadow-green-500/30' : 'bg-dark-600'}`}>
                                                                        <Clock className={getStepStatus(order.status, 1) === 'completed' ? 'text-white' : 'text-silver-500'} size={16} />
                                                                    </div>
                                                                    <p className={`text-[10px] mt-2 font-bold uppercase tracking-wide ${getStepStatus(order.status, 1) === 'completed' ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-silver-600'}`}>Pending</p>
                                                                    {getStepStatus(order.status, 1) === 'completed' && order.date && (
                                                                        <p className="text-[9px] text-gray-500 dark:text-silver-500 mt-0.5">{order.date}</p>
                                                                    )}
                                                                </div>

                                                                {/* Step 2: Confirmed */}
                                                                <div className="flex flex-col items-center z-10 group">
                                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${getStepStatus(order.status, 2) === 'completed' ? 'bg-green-500 shadow-lg shadow-green-500/30' : 'bg-dark-600'}`}>
                                                                        <CheckCircle className={getStepStatus(order.status, 2) === 'completed' ? 'text-white' : 'text-silver-500'} size={16} />
                                                                    </div>
                                                                    <p className={`text-[10px] mt-2 font-bold uppercase tracking-wide ${getStepStatus(order.status, 2) === 'completed' ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-silver-600'}`}>Confirmed</p>
                                                                </div>

                                                                {/* Step 3: Processing */}
                                                                <div className="flex flex-col items-center z-10 group">
                                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${getStepStatus(order.status, 3) === 'completed' ? 'bg-green-500 shadow-lg shadow-green-500/30' : 'bg-dark-600'}`}>
                                                                        <Package className={getStepStatus(order.status, 3) === 'completed' ? 'text-white' : 'text-silver-500'} size={16} />
                                                                    </div>
                                                                    <p className={`text-[10px] mt-2 font-bold uppercase tracking-wide ${getStepStatus(order.status, 3) === 'completed' ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-silver-600'}`}>Processing</p>
                                                                </div>

                                                                {/* Step 4: Shipped */}
                                                                <div className="flex flex-col items-center z-10 group">
                                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${getStepStatus(order.status, 4) === 'completed' ? 'bg-accent-500 shadow-lg shadow-accent-500/30' : 'bg-dark-600'}`}>
                                                                        <Truck className={getStepStatus(order.status, 4) === 'completed' ? 'text-dark-900' : 'text-silver-500'} size={16} />
                                                                    </div>
                                                                    <p className={`text-[10px] mt-2 font-bold uppercase tracking-wide ${getStepStatus(order.status, 4) === 'completed' ? 'text-accent-500' : 'text-gray-400 dark:text-silver-600'}`}>Shipped</p>
                                                                </div>

                                                                {/* Step 5: Out for Delivery */}
                                                                <div className="flex flex-col items-center z-10 group">
                                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${getStepStatus(order.status, 5) === 'completed' ? 'bg-accent-500 shadow-lg shadow-accent-500/30' : 'bg-dark-600'}`}>
                                                                        <Truck className={getStepStatus(order.status, 5) === 'completed' ? 'text-dark-900' : 'text-silver-500'} size={16} />
                                                                    </div>
                                                                    <p className={`text-[10px] mt-2 font-bold uppercase tracking-wide ${getStepStatus(order.status, 5) === 'completed' ? 'text-accent-500' : 'text-gray-400 dark:text-silver-600'}`}>Out for Delivery</p>
                                                                </div>

                                                                {/* Step 6: Delivered */}
                                                                <div className="flex flex-col items-center z-10 group">
                                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${getStepStatus(order.status, 6) === 'completed' ? 'bg-green-500 shadow-lg shadow-green-500/30' : 'bg-dark-600'}`}>
                                                                        <MapPin className={getStepStatus(order.status, 6) === 'completed' ? 'text-white' : 'text-silver-500'} size={16} />
                                                                    </div>
                                                                    <p className={`text-[10px] mt-2 font-bold uppercase tracking-wide ${getStepStatus(order.status, 6) === 'completed' ? 'text-green-500' : 'text-gray-400 dark:text-silver-600'}`}>Delivered</p>
                                                                </div>
                                                            </div>

                                                            {/* Status summary */}
                                                            <div className="flex items-center gap-3 mt-6 pt-4 border-t border-gray-100 dark:border-dark-700">
                                                                {['Delivered', 'Completed', 'delivered', 'completed'].includes(order.status) && <CheckCircle size={20} className="text-green-600 dark:text-green-400" />}
                                                                {order.status === 'Processing' && <Clock size={20} className="text-blue-600 dark:text-blue-400" />}
                                                                {['Shipped', 'shipped'].includes(order.status) && <Truck size={20} className="text-primary-600 dark:text-accent-500" />}
                                                                {!['Delivered', 'Processing', 'Shipped', 'Completed', 'delivered', 'completed', 'shipped'].includes(order.status) && <Clock size={20} className="text-gray-400 dark:text-silver-500" />}
                                                                <div>
                                                                    <p className="font-medium text-gray-900 dark:text-white">{order.status}</p>
                                                                    <p className="text-sm text-gray-500 dark:text-silver-500">
                                                                        {['Delivered', 'Completed', 'delivered', 'completed'].includes(order.status) ? 'Package delivered successfully' :
                                                                            ['Shipped', 'shipped'].includes(order.status) ? 'Your order is on the way' :
                                                                                order.status === 'Processing' ? 'Your order is being processed' :
                                                                                    'Order received'}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Wishlist Tab */}
                        {activeTab === 'wishlist' && (
                            <div className="bg-white dark:bg-dark-800 dark:border dark:border-dark-700 rounded-2xl shadow-sm p-6">
                                <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-6">My Wishlist ({wishlist.length})</h3>
                                {wishlist.length === 0 ? (
                                    <div className="text-center py-12">
                                        <div className="w-16 h-16 bg-gray-100 dark:bg-dark-700 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Heart className="text-gray-400 dark:text-silver-500" size={32} />
                                        </div>
                                        <h4 className="text-lg font-bold text-gray-900 dark:text-white">Your wishlist is empty</h4>
                                        <p className="text-gray-500 dark:text-silver-500 mb-6">Save items you love to buy later.</p>
                                        <Link href="/products" className="btn-primary inline-flex">Explore Products</Link>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {wishlist.map((product) => (
                                            <div key={product.id} className="border border-gray-100 dark:border-dark-700 rounded-xl p-4 flex gap-4 relative group hover:border-primary-200 dark:hover:border-accent-500/30 transition-all">
                                                <img
                                                    src={product.image || '/placeholder-product.jpg'}
                                                    alt={product.name}
                                                    className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                                                />
                                                <div className="flex-1">
                                                    <h4 className="font-medium text-gray-900 dark:text-white mb-1 line-clamp-2">{product.name}</h4>
                                                    <p className="text-lg font-bold text-gray-900 dark:text-white mb-2">₹{(product.price || 0).toLocaleString()}</p>
                                                    <button
                                                        onClick={() => {
                                                            addItem(product);
                                                            // Optionally remove from wishlist after adding to cart
                                                            // removeFromWishlist(product.id);
                                                        }}
                                                        className="text-primary-600 dark:text-accent-500 text-sm font-medium hover:underline"
                                                    >
                                                        Add to Cart
                                                    </button>
                                                </div>
                                                <button
                                                    onClick={() => removeFromWishlist(product.id)}
                                                    className="absolute top-4 right-4 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Addresses Tab */}
                        {activeTab === 'addresses' && (
                            <div className="bg-white dark:bg-dark-800 dark:border dark:border-dark-700 rounded-2xl shadow-sm p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">Saved Addresses</h3>
                                    <button
                                        onClick={() => addAddress({
                                            type: 'Home',
                                            name: customer.name,
                                            phone: customer.phone || '9876543210',
                                            address: '123 Main St, Apartment 4B',
                                            city: 'Mumbai',
                                            pincode: '400001',
                                            isDefault: addresses.length === 0
                                        })}
                                        className="btn-secondary text-sm py-2 flex items-center gap-2"
                                    >
                                        <Plus size={16} /> Add New Address
                                    </button>
                                </div>

                                {addresses.length === 0 ? (
                                    <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-dark-600 rounded-2xl">
                                        <p className="text-gray-500 dark:text-silver-500 mb-4">No addresses saved yet.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {addresses.map((addr) => (
                                            <div key={addr.id} className="border border-gray-200 dark:border-dark-700 rounded-xl p-4 relative">
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-silver-300 text-xs font-bold px-2 py-1 rounded uppercase">{addr.type}</span>
                                                    <div className="flex gap-2">
                                                        <button className="text-gray-400 hover:text-primary-600 dark:hover:text-accent-500"><Edit2 size={16} /></button>
                                                        <button onClick={() => deleteAddress(addr.id)} className="text-gray-400 hover:text-red-600 dark:hover:text-red-400"><Trash2 size={16} /></button>
                                                    </div>
                                                </div>
                                                <h4 className="font-bold text-gray-900 dark:text-white">{addr.name}</h4>
                                                <p className="text-gray-600 dark:text-silver-400 text-sm mt-1">{addr.address}</p>
                                                <p className="text-gray-600 dark:text-silver-400 text-sm">{addr.city} - {addr.pincode}</p>
                                                <p className="text-gray-600 dark:text-silver-400 text-sm mt-2">Phone: {addr.phone}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Settings Tab */}
                        {activeTab === 'settings' && (
                            <div className="bg-white dark:bg-dark-800 dark:border dark:border-dark-700 rounded-2xl shadow-sm p-6">
                                <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-6">Account Settings</h3>
                                <form className="space-y-6 max-w-lg">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-silver-300 mb-2">Full Name</label>
                                        <input
                                            type="text"
                                            defaultValue={customer.name}
                                            className="input-field"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-silver-300 mb-2">Email Address</label>
                                        <input
                                            type="email"
                                            defaultValue={customer.email}
                                            className="input-field bg-gray-50 dark:bg-dark-700"
                                            disabled
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-silver-300 mb-2">Phone Number</label>
                                        <input
                                            type="tel"
                                            defaultValue={customer.phone}
                                            placeholder="+91"
                                            className="input-field"
                                        />
                                    </div>
                                    <button type="submit" className="btn-primary">
                                        Save Changes
                                    </button>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {/* Return Modal */}
            {isReturnModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-dark-800 rounded-3xl p-8 max-w-md w-full shadow-2xl">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Return Order</h2>
                        <p className="text-gray-500 dark:text-silver-500 mb-6">
                            Reason for returning order <span className="font-bold text-gray-900 dark:text-white">{selectedOrderForReturn?.id}</span>?
                        </p>

                        <textarea
                            value={returnReason}
                            onChange={(e) => setReturnReason(e.target.value)}
                            placeholder="Please describe why you want to return this item..."
                            className="w-full p-4 rounded-2xl bg-gray-50 dark:bg-dark-700 border border-gray-100 dark:border-dark-600 focus:ring-2 focus:ring-primary-500 outline-none transition-all mb-6 min-h-[120px] text-gray-900 dark:text-white"
                        />

                        <div className="flex gap-3">
                            <button
                                onClick={() => setIsReturnModalOpen(false)}
                                className="flex-1 py-3 px-4 rounded-2xl font-bold text-gray-500 dark:text-silver-500 hover:bg-gray-100 dark:hover:bg-dark-700 transition-all"
                                disabled={isSubmittingReturn}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={submitReturn}
                                className="flex-1 py-3 px-4 bg-orange-500 text-white rounded-2xl font-bold hover:bg-orange-600 shadow-lg shadow-orange-200 dark:shadow-none transition-all disabled:opacity-50"
                                disabled={isSubmittingReturn || !returnReason.trim()}
                            >
                                {isSubmittingReturn ? 'Processing...' : 'Confirm Return'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Icon needed for import
import { ShoppingBag } from 'lucide-react';
