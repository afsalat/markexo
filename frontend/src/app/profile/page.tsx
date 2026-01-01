'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useCustomerAuth } from '@/context/CustomerAuthContext';
import { useRouter } from 'next/navigation';
import { User, Package, Heart, MapPin, Settings, LogOut, CheckCircle, Truck, Clock, XCircle, Trash2, Plus, Edit2 } from 'lucide-react';
import { useCart } from '@/lib/cart';

export default function ProfilePage() {
    const { customer, isAuthenticated, logout, orders, wishlist, addresses, removeFromWishlist, deleteAddress, addAddress } = useCustomerAuth();
    const router = useRouter();
    const { addItem } = useCart();
    const [activeTab, setActiveTab] = useState('overview');

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
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="container mx-auto px-4">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Sidebar */}
                    <div className="lg:w-80">
                        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
                            <div className="flex items-center gap-4 mb-6">
                                <img
                                    src={customer.avatar || `https://ui-avatars.com/api/?name=${customer.name}&background=random`}
                                    alt={customer.name}
                                    className="w-16 h-16 rounded-full border-4 border-primary-50"
                                />
                                <div>
                                    <h2 className="font-bold text-gray-900">{customer.name}</h2>
                                    <p className="text-sm text-gray-500 truncate max-w-[150px]">{customer.email}</p>
                                </div>
                            </div>

                            <nav className="space-y-1">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === tab.id
                                            ? 'bg-primary-50 text-primary-700 font-medium'
                                            : 'text-gray-600 hover:bg-gray-50'
                                            }`}
                                    >
                                        <tab.icon size={20} />
                                        {tab.label}
                                    </button>
                                ))}
                                <div className="pt-4 mt-4 border-t border-gray-100">
                                    <button
                                        onClick={logout}
                                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-colors"
                                    >
                                        <LogOut size={20} />
                                        Logout
                                    </button>
                                </div>
                            </nav>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1">
                        {/* Overview Tab */}
                        {activeTab === 'overview' && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="bg-white p-6 rounded-2xl shadow-sm">
                                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                                            <Package className="text-blue-600" size={24} />
                                        </div>
                                        <h3 className="text-2xl font-bold text-gray-900">{orders.length}</h3>
                                        <p className="text-gray-500">Total Orders</p>
                                    </div>
                                    <div className="bg-white p-6 rounded-2xl shadow-sm">
                                        <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center mb-4">
                                            <Heart className="text-pink-600" size={24} />
                                        </div>
                                        <h3 className="text-2xl font-bold text-gray-900">{wishlist.length}</h3>
                                        <p className="text-gray-500">Wishlist Items</p>
                                    </div>
                                    <div className="bg-white p-6 rounded-2xl shadow-sm">
                                        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                                            <ShoppingBag className="text-green-600" size={24} />
                                        </div>
                                        <h3 className="text-2xl font-bold text-gray-900">0</h3>
                                        <p className="text-gray-500">Cart Items</p>
                                    </div>
                                </div>

                                <div className="bg-white rounded-2xl shadow-sm p-6">
                                    <h3 className="font-bold text-lg text-gray-900 mb-4">Recent Orders</h3>
                                    {orders.length > 0 ? (
                                        <div className="space-y-4">
                                            {orders.map((order) => (
                                                <div key={order.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl">
                                                    <div>
                                                        <p className="font-medium text-gray-900">{order.id}</p>
                                                        <p className="text-sm text-gray-500">{order.date} • {order.items} Items</p>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${order.status === 'Delivered' ? 'bg-green-100 text-green-700' :
                                                            order.status === 'Processing' ? 'bg-blue-100 text-blue-700' :
                                                                'bg-gray-100 text-gray-700'
                                                            }`}>
                                                            {order.status}
                                                        </span>
                                                        <Link href={`/track-order?id=${order.id}`} className="text-primary-600 text-sm font-medium hover:underline">
                                                            Track
                                                        </Link>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8">
                                            <p className="text-gray-500">No orders yet.</p>
                                            <Link href="/products" className="text-primary-600 font-medium hover:underline mt-2 inline-block">Start Shopping</Link>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Orders Tab */}
                        {activeTab === 'orders' && (
                            <div className="bg-white rounded-2xl shadow-sm p-6">
                                <h3 className="font-bold text-lg text-gray-900 mb-6">My Orders</h3>
                                <div className="space-y-4">
                                    {orders.map((order) => (
                                        <div key={order.id} className="border border-gray-100 rounded-xl overflow-hidden">
                                            <div className="bg-gray-50 px-6 py-4 flex flex-wrap justify-between items-center gap-4">
                                                <div className="flex gap-8">
                                                    <div>
                                                        <p className="text-xs text-gray-500 uppercase font-semibold">Order Placed</p>
                                                        <p className="text-sm font-medium text-gray-900">{order.date}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500 uppercase font-semibold">Total</p>
                                                        <p className="text-sm font-medium text-gray-900">₹{order.total.toLocaleString()}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500 uppercase font-semibold">Order ID</p>
                                                        <p className="text-sm font-medium text-gray-900">{order.id}</p>
                                                    </div>
                                                </div>
                                                <Link href={`/track-order?id=${order.id}`} className="btn-secondary text-sm py-2">
                                                    Track Order
                                                </Link>
                                            </div>
                                            <div className="p-6">
                                                <div className="flex items-center gap-4">
                                                    {order.status === 'Delivered' && <CheckCircle size={20} className="text-green-600" />}
                                                    {order.status === 'Processing' && <Clock size={20} className="text-blue-600" />}
                                                    {order.status === 'Shipped' && <Truck size={20} className="text-primary-600" />}
                                                    <div>
                                                        <p className="font-medium text-gray-900">{order.status}</p>
                                                        <p className="text-sm text-gray-500">
                                                            {order.status === 'Delivered' ? 'Package handed clearly to customer' : 'Your order is being processed'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Wishlist Tab */}
                        {activeTab === 'wishlist' && (
                            <div className="bg-white rounded-2xl shadow-sm p-6">
                                <h3 className="font-bold text-lg text-gray-900 mb-6">My Wishlist ({wishlist.length})</h3>
                                {wishlist.length === 0 ? (
                                    <div className="text-center py-12">
                                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Heart className="text-gray-400" size={32} />
                                        </div>
                                        <h4 className="text-lg font-bold text-gray-900">Your wishlist is empty</h4>
                                        <p className="text-gray-500 mb-6">Save items you love to buy later.</p>
                                        <Link href="/products" className="btn-primary inline-flex">Explore Products</Link>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Mock products for wishlist demo since we only have IDs */}
                                        <div className="border border-gray-100 rounded-xl p-4 flex gap-4 relative group">
                                            <div className="w-24 h-24 bg-gray-100 rounded-lg flex-shrink-0"></div>
                                            <div>
                                                <h4 className="font-medium text-gray-900 mb-1">Wireless Headphones</h4>
                                                <p className="text-lg font-bold text-gray-900 mb-2">₹2,999</p>
                                                <button className="text-primary-600 text-sm font-medium hover:underline">Add to Cart</button>
                                            </div>
                                            <button
                                                onClick={() => removeFromWishlist(0)} // Demo ID
                                                className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                        {/* Add more mock items dynamically if we had product data context */}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Addresses Tab */}
                        {activeTab === 'addresses' && (
                            <div className="bg-white rounded-2xl shadow-sm p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="font-bold text-lg text-gray-900">Saved Addresses</h3>
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
                                    <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl">
                                        <p className="text-gray-500 mb-4">No addresses saved yet.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {addresses.map((addr) => (
                                            <div key={addr.id} className="border border-gray-200 rounded-xl p-4 relative">
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="bg-gray-100 text-gray-700 text-xs font-bold px-2 py-1 rounded uppercase">{addr.type}</span>
                                                    <div className="flex gap-2">
                                                        <button className="text-gray-400 hover:text-primary-600"><Edit2 size={16} /></button>
                                                        <button onClick={() => deleteAddress(addr.id)} className="text-gray-400 hover:text-red-600"><Trash2 size={16} /></button>
                                                    </div>
                                                </div>
                                                <h4 className="font-bold text-gray-900">{addr.name}</h4>
                                                <p className="text-gray-600 text-sm mt-1">{addr.address}</p>
                                                <p className="text-gray-600 text-sm">{addr.city} - {addr.pincode}</p>
                                                <p className="text-gray-600 text-sm mt-2">Phone: {addr.phone}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Settings Tab */}
                        {activeTab === 'settings' && (
                            <div className="bg-white rounded-2xl shadow-sm p-6">
                                <h3 className="font-bold text-lg text-gray-900 mb-6">Account Settings</h3>
                                <form className="space-y-6 max-w-lg">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                                        <input
                                            type="text"
                                            defaultValue={customer.name}
                                            className="input-field"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                                        <input
                                            type="email"
                                            defaultValue={customer.email}
                                            className="input-field bg-gray-50"
                                            disabled
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
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
        </div>
    );
}

// Icon needed for import
import { ShoppingBag } from 'lucide-react';
