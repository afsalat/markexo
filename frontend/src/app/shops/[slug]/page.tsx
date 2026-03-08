'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MapPin, Star, Award, Package, ChevronRight, Store, Phone, Mail, Globe, ShoppingCart, Heart } from 'lucide-react';

// Sample shop data (in production, fetch from API)
const shopData = {
    id: 1,
    name: 'TechZone',
    slug: 'techzone',
    description: 'Your one-stop destination for all electronics and gadgets. We offer the latest smartphones, laptops, accessories, and more at competitive prices. Quality guaranteed!',
    logo: null,
    banner: 'https://placehold.co/1200x400/667eea/ffffff?text=TechZone+Electronics',
    location: 'Shop No. 45, Electronic Market, Mumbai, Maharashtra - 400001',
    city: 'Mumbai',
    rating: 4.8,
    total_products: 245,
    total_orders: 1250,
    is_verified: true,
    contact_phone: '+91 98765 43210',
    contact_email: 'contact@techzone.com',
    website: 'www.techzone.com',
    created_at: '2024-01-15'
};

const shopProducts = [
    { id: 1, name: 'Premium Wireless Headphones', slug: 'premium-wireless-headphones', price: 4999, sale_price: 2999, image: 'https://placehold.co/400x400/667eea/ffffff?text=Headphones', rating: 4.5, stock: 15 },
    { id: 2, name: 'Bluetooth Speaker', slug: 'bluetooth-speaker', price: 3499, sale_price: 2499, image: 'https://placehold.co/400x400/764ba2/ffffff?text=Speaker', rating: 4.3, stock: 12 },
    { id: 3, name: 'Smart Fitness Watch', slug: 'smart-fitness-watch', price: 8999, sale_price: 5999, image: 'https://placehold.co/400x400/f093fb/ffffff?text=Watch', rating: 4.6, stock: 8 },
    { id: 4, name: 'Wireless Mouse', slug: 'wireless-mouse', price: 1499, sale_price: 999, image: 'https://placehold.co/400x400/4facfe/ffffff?text=Mouse', rating: 4.4, stock: 25 },
    { id: 5, name: 'USB-C Hub', slug: 'usb-c-hub', price: 2499, sale_price: 1799, image: 'https://placehold.co/400x400/00d2ff/ffffff?text=USB+Hub', rating: 4.2, stock: 18 },
    { id: 6, name: 'Laptop Stand', slug: 'laptop-stand', price: 1999, sale_price: 1499, image: 'https://placehold.co/400x400/ffd89b/333333?text=Stand', rating: 4.7, stock: 20 },
];

export default function ShopDetailPage() {
    const [activeTab, setActiveTab] = useState<'products' | 'about'>('products');

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Breadcrumb */}
            <div className="bg-white border-b border-gray-100">
                <div className="container mx-auto px-4 py-4">
                    <nav className="flex items-center gap-2 text-sm text-gray-500">
                        <Link href="/" className="hover:text-primary-600">Home</Link>
                        <ChevronRight size={16} />
                        <Link href="/shops" className="hover:text-primary-600">Shops</Link>
                        <ChevronRight size={16} />
                        <span className="text-gray-900 font-medium">{shopData.name}</span>
                    </nav>
                </div>
            </div>

            {/* Shop Header */}
            <div className="bg-white border-b border-gray-100">
                {/* Shop Info */}
                <div className="container mx-auto px-4 py-8">
                    <div className="flex flex-col items-center md:items-start md:flex-row gap-4 md:gap-6 pb-8">
                        {/* Logo */}
                        <div className="w-28 h-28 md:w-36 md:h-36 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl flex items-center justify-center text-white font-bold text-4xl md:text-5xl shadow-xl border-4 border-white flex-shrink-0">
                            {shopData.logo ? (
                                <img src={shopData.logo} alt={shopData.name} className="w-full h-full object-cover rounded-xl" />
                            ) : (
                                shopData.name.charAt(0)
                            )}
                        </div>


                        {/* Details */}
                        <div className="flex-1 md:pt-6 text-center md:text-left">
                            <div className="flex flex-col gap-3">
                                <div className="flex flex-col md:flex-row items-center md:items-center gap-2 md:gap-3">
                                    <h1 className="font-display text-2xl md:text-3xl font-bold text-gray-900">
                                        {shopData.name}
                                    </h1>
                                    {shopData.is_verified && (
                                        <div className="flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-700 rounded-full">
                                            <Award size={16} />
                                            <span className="text-sm font-semibold">Verified</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 md:gap-4 text-gray-600 text-sm md:text-base">
                                    <div className="flex items-center gap-1">
                                        <Star size={18} className="fill-amber-400 text-amber-400" />
                                        <span className="font-semibold text-gray-900">{shopData.rating}</span>
                                        <span className="text-xs md:text-sm">({shopData.total_orders} orders)</span>
                                    </div>
                                    <span className="text-gray-300 hidden md:inline">•</span>
                                    <div className="flex items-center gap-1">
                                        <Package size={18} />
                                        <span>{shopData.total_products} Products</span>
                                    </div>
                                    <span className="text-gray-300 hidden md:inline">•</span>
                                    <div className="flex items-center gap-1">
                                        <MapPin size={18} />
                                        <span>{shopData.city}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2">
                        {/* Tabs */}
                        <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-6">
                            <div className="border-b border-gray-200">
                                <div className="flex">
                                    <button
                                        onClick={() => setActiveTab('products')}
                                        className={`flex-1 py-4 px-6 font-semibold transition-colors ${activeTab === 'products' ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50' : 'text-gray-600 hover:text-gray-900'}`}
                                    >
                                        Products ({shopData.total_products})
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('about')}
                                        className={`flex-1 py-4 px-6 font-semibold transition-colors ${activeTab === 'about' ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50' : 'text-gray-600 hover:text-gray-900'}`}
                                    >
                                        About Shop
                                    </button>
                                </div>
                            </div>

                            <div className="p-6">
                                {activeTab === 'products' ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        {shopProducts.map((product) => (
                                            <Link
                                                key={product.id}
                                                href={`/products/${product.slug}`}
                                                className="group"
                                            >
                                                <div className="bg-gray-50 rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300 group-hover:-translate-y-1">
                                                    <div className="aspect-square bg-gray-100 overflow-hidden">
                                                        <img
                                                            src={product.image}
                                                            alt={product.name}
                                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                        />
                                                    </div>
                                                    <div className="p-4">
                                                        <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2 group-hover:text-primary-600 transition-colors">
                                                            {product.name}
                                                        </h3>
                                                        <div className="flex items-center gap-1 mb-2">
                                                            <Star size={14} className="fill-amber-400 text-amber-400" />
                                                            <span className="text-sm text-gray-600">{product.rating}</span>
                                                            <span className="text-gray-300 mx-1">•</span>
                                                            <span className="text-sm text-gray-600">{product.stock} in stock</span>
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-lg font-bold text-gray-900">₹{product.sale_price.toLocaleString()}</span>
                                                                <span className="text-sm text-gray-400 line-through">₹{product.price.toLocaleString()}</span>
                                                            </div>
                                                            <button className="w-8 h-8 bg-primary-100 text-primary-600 rounded-lg flex items-center justify-center hover:bg-primary-200 transition-colors">
                                                                <ShoppingCart size={16} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="font-bold text-xl text-gray-900 mb-3">About Us</h3>
                                            <p className="text-gray-700 leading-relaxed">{shopData.description}</p>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-xl text-gray-900 mb-3">Our Commitment</h3>
                                            <ul className="space-y-2">
                                                <li className="flex items-start gap-2 text-gray-700">
                                                    <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                                        <Award size={12} className="text-green-600" />
                                                    </div>
                                                    <span>100% Authentic Products</span>
                                                </li>
                                                <li className="flex items-start gap-2 text-gray-700">
                                                    <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                                        <Award size={12} className="text-green-600" />
                                                    </div>
                                                    <span>Quality Guaranteed</span>
                                                </li>
                                                <li className="flex items-start gap-2 text-gray-700">
                                                    <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                                        <Award size={12} className="text-green-600" />
                                                    </div>
                                                    <span>Fast & Reliable Delivery</span>
                                                </li>
                                                <li className="flex items-start gap-2 text-gray-700">
                                                    <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                                        <Award size={12} className="text-green-600" />
                                                    </div>
                                                    <span>Excellent Customer Service</span>
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Contact Info */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm">
                            <h3 className="font-bold text-lg text-gray-900 mb-4">Contact Information</h3>
                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <MapPin className="text-blue-600" size={20} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 mb-1">Address</p>
                                        <p className="text-sm text-gray-600 break-words">{shopData.location}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <Phone className="text-green-600" size={20} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 mb-1">Phone</p>
                                        <a href={`tel:${shopData.contact_phone}`} className="text-sm text-primary-600 hover:underline break-words">
                                            {shopData.contact_phone}
                                        </a>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <Mail className="text-purple-600" size={20} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 mb-1">Email</p>
                                        <a href={`mailto:${shopData.contact_email}`} className="text-sm text-primary-600 hover:underline break-words">
                                            {shopData.contact_email}
                                        </a>
                                    </div>
                                </div>
                                {shopData.website && (
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <Globe className="text-amber-600" size={20} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 mb-1">Website</p>
                                            <a href={`https://${shopData.website}`} target="_blank" rel="noopener noreferrer" className="text-sm text-primary-600 hover:underline break-words">
                                                {shopData.website}
                                            </a>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="bg-gradient-to-br from-primary-50 to-accent-50 rounded-2xl p-6">
                            <h3 className="font-bold text-lg text-gray-900 mb-4">Shop Statistics</h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-700">Total Products</span>
                                    <span className="font-bold text-gray-900">{shopData.total_products}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-700">Total Orders</span>
                                    <span className="font-bold text-gray-900">{shopData.total_orders}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-700">Average Rating</span>
                                    <div className="flex items-center gap-1">
                                        <Star size={16} className="fill-amber-400 text-amber-400" />
                                        <span className="font-bold text-gray-900">{shopData.rating}</span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-700">Member Since</span>
                                    <span className="font-bold text-gray-900">{new Date(shopData.created_at).getFullYear()}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
