'use client';

import Link from 'next/link';
import { ArrowRight, Truck, Shield, Clock, Award, ChevronRight, Star, ShoppingCart, Heart, Send, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { API_BASE_URL } from '@/config/apiConfig';

// Sample data for demo (replace with API calls in production)
const featuredProducts = [
    {
        id: 1,
        name: 'Premium Wireless Headphones',
        slug: 'premium-wireless-headphones',
        price: 4999,
        sale_price: 2999,
        current_price: 2999,
        discount_percent: 40,
        image: null,
        shop: { name: 'TechZone' },
        category: { name: 'Electronics' },
        is_featured: true,
    },
    {
        id: 2,
        name: 'Organic Cotton T-Shirt',
        slug: 'organic-cotton-tshirt',
        price: 1499,
        sale_price: null,
        current_price: 1499,
        discount_percent: 0,
        image: null,
        shop: { name: 'FashionHub' },
        category: { name: 'Fashion' },
        is_featured: true,
    },
    {
        id: 3,
        name: 'Smart Fitness Watch',
        slug: 'smart-fitness-watch',
        price: 8999,
        sale_price: 5999,
        current_price: 5999,
        discount_percent: 33,
        image: null,
        shop: { name: 'TechZone' },
        category: { name: 'Electronics' },
        is_featured: true,
    },
    {
        id: 4,
        name: 'Handcrafted Leather Wallet',
        slug: 'handcrafted-leather-wallet',
        price: 2499,
        sale_price: 1999,
        current_price: 1999,
        discount_percent: 20,
        image: null,
        shop: { name: 'ArtisanStore' },
        category: { name: 'Accessories' },
        is_featured: true,
    },
];

const categories = [
    { name: 'Electronics', slug: 'electronics', count: 150, gradient: 'from-blue-500 to-purple-600' },
    { name: 'Fashion', slug: 'fashion', count: 280, gradient: 'from-pink-500 to-rose-600' },
    { name: 'Home & Living', slug: 'home-living', count: 120, gradient: 'from-green-500 to-teal-600' },
    { name: 'Sports', slug: 'sports', count: 95, gradient: 'from-orange-500 to-red-600' },
    { name: 'Books', slug: 'books', count: 200, gradient: 'from-yellow-500 to-amber-600' },
    { name: 'Beauty', slug: 'beauty', count: 180, gradient: 'from-purple-500 to-indigo-600' },
];

const trendingProducts = [
    { id: 11, name: 'Wireless Earbuds Pro', slug: 'wireless-earbuds-pro', price: 3999, sale_price: 2499, current_price: 2499, rating: 4.8, image: null },
    { id: 12, name: 'Smart LED Bulb', slug: 'smart-led-bulb', price: 899, sale_price: 599, current_price: 599, rating: 4.5, image: null },
    { id: 13, name: 'Yoga Mat Premium', slug: 'yoga-mat-premium', price: 1499, sale_price: 999, current_price: 999, rating: 4.7, image: null },
    { id: 14, name: 'Coffee Maker', slug: 'coffee-maker', price: 4999, sale_price: 3499, current_price: 3499, rating: 4.6, image: null },
    { id: 15, name: 'Running Shoes', slug: 'running-shoes', price: 3999, sale_price: 2999, current_price: 2999, rating: 4.9, image: null },
    { id: 16, name: 'Desk Organizer', slug: 'desk-organizer', price: 799, sale_price: 499, current_price: 499, rating: 4.4, image: null },
];

const testimonials = [
    { id: 1, name: 'Priya Sharma', rating: 5, review: 'Amazing platform! Found exactly what I needed from a local shop. Fast delivery and great quality products.', date: '2 days ago', verified: true },
    { id: 2, name: 'Rahul Verma', rating: 5, review: 'Love supporting local businesses through Markexo. The variety of products is impressive and prices are competitive.', date: '1 week ago', verified: true },
    { id: 3, name: 'Anjali Patel', rating: 4, review: 'Great experience overall. Customer service was helpful and my order arrived on time. Highly recommended!', date: '2 weeks ago', verified: true },
];

const popularShops = [
    { id: 1, name: 'TechZone', slug: 'techzone', rating: 4.8, products: 245, location: 'Mumbai', verified: true },
    { id: 2, name: 'FashionHub', slug: 'fashionhub', rating: 4.7, products: 320, location: 'Delhi', verified: true },
    { id: 3, name: 'HomeDecor', slug: 'homedecor', rating: 4.6, products: 180, location: 'Bangalore', verified: true },
    { id: 4, name: 'SportsWorld', slug: 'sportsworld', rating: 4.9, products: 150, location: 'Pune', verified: true },
    { id: 5, name: 'BookHaven', slug: 'bookhaven', rating: 4.5, products: 420, location: 'Chennai', verified: true },
    { id: 6, name: 'BeautyBox', slug: 'beautybox', rating: 4.8, products: 280, location: 'Hyderabad', verified: true },
];

export default function HomePage() {
    return (
        <div className="min-h-screen">
            {/* Hero Section */}
            <section className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 text-white overflow-hidden">
                {/* Background Decorations */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-500/30 rounded-full blur-3xl" />
                    <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-accent-500/20 rounded-full blur-3xl" />
                </div>

                <div className="container mx-auto px-4 py-20 md:py-32 relative z-10">
                    <div className="max-w-3xl">
                        <span className="inline-block bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium mb-6 animate-fade-in">
                            🎉 Free Delivery on Your First Order
                        </span>
                        <h1 className="font-display text-4xl md:text-6xl font-bold mb-6 animate-slide-up">
                            Shop Local,<br />
                            <span className="text-accent-400">Support Local</span>
                        </h1>
                        <p className="text-lg md:text-xl text-white/80 mb-8 max-w-xl animate-slide-up">
                            Discover amazing products from trusted local shops in your city. Quality guaranteed, delivered to your doorstep.
                        </p>
                        <div className="flex flex-wrap gap-4 animate-slide-up">
                            <Link href="/products" className="btn-accent flex items-center gap-2">
                                Shop Now <ArrowRight size={20} />
                            </Link>
                            <Link href="/shops" className="btn-secondary">
                                Explore Shops
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Wave Divider */}
                <div className="absolute bottom-0 left-0 right-0">
                    <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="#f8fafc" />
                    </svg>
                </div>
            </section>

            {/* Features Strip */}
            <section className="py-8 border-b border-gray-100">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                                <Truck className="text-primary-600" size={24} />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">Fast Delivery</h3>
                                <p className="text-sm text-gray-500">Same day available</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                                <Shield className="text-green-600" size={24} />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">Secure Payment</h3>
                                <p className="text-sm text-gray-500">100% protected</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-accent-100 rounded-xl flex items-center justify-center">
                                <Clock className="text-accent-600" size={24} />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">24/7 Support</h3>
                                <p className="text-sm text-gray-500">Always here to help</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                                <Award className="text-purple-600" size={24} />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">Quality Products</h3>
                                <p className="text-sm text-gray-500">Verified sellers</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Categories Section */}
            <section className="py-16">
                <div className="container mx-auto px-4">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h2 className="font-display text-3xl font-bold text-gray-900">Shop by Category</h2>
                            <p className="text-gray-500 mt-1">Find what you&apos;re looking for</p>
                        </div>
                        <Link href="/products" className="hidden md:flex items-center gap-1 text-primary-600 font-medium hover:gap-2 transition-all">
                            View All <ChevronRight size={18} />
                        </Link>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {categories.map((category) => (
                            <Link
                                key={category.slug}
                                href={`/products?category=${category.slug}`}
                                className={`relative aspect-square rounded-2xl bg-gradient-to-br ${category.gradient} p-6 text-white overflow-hidden group hover:shadow-xl transition-all duration-300`}
                            >
                                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
                                <div className="relative z-10 h-full flex flex-col justify-end">
                                    <h3 className="font-semibold text-lg">{category.name}</h3>
                                    <p className="text-white/80 text-sm">{category.count} items</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* Trending Products */}
            <section className="py-16 bg-gradient-to-br from-orange-50 to-red-50">
                <div className="container mx-auto px-4">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-2xl">🔥</span>
                                <h2 className="font-display text-3xl font-bold text-gray-900">Trending Now</h2>
                            </div>
                            <p className="text-gray-500">Hot picks everyone's buying</p>
                        </div>
                        <Link href="/products?trending=true" className="hidden md:flex items-center gap-1 text-primary-600 font-medium hover:gap-2 transition-all">
                            View All <ChevronRight size={18} />
                        </Link>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {trendingProducts.map((product) => (
                            <Link
                                key={product.id}
                                href={`/products/${product.slug}`}
                                className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                            >
                                <div className="aspect-square bg-gray-100 flex items-center justify-center relative overflow-hidden">
                                    <ShoppingCart size={40} className="text-gray-400" />
                                    <div className="absolute top-2 left-2 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                                        🔥 HOT
                                    </div>
                                </div>
                                <div className="p-3">
                                    <h3 className="font-semibold text-sm text-gray-900 line-clamp-2 mb-1 group-hover:text-primary-600 transition-colors">
                                        {product.name}
                                    </h3>
                                    <div className="flex items-center gap-1 mb-2">
                                        <Star size={12} className="fill-amber-400 text-amber-400" />
                                        <span className="text-xs text-gray-600">{product.rating}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg font-bold text-gray-900">₹{product.current_price.toLocaleString()}</span>
                                        <span className="text-xs text-gray-400 line-through">₹{product.price.toLocaleString()}</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* Featured Products */}
            <section className="py-16 bg-gray-50">
                <div className="container mx-auto px-4">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h2 className="font-display text-3xl font-bold text-gray-900">Featured Products</h2>
                            <p className="text-gray-500 mt-1">Handpicked just for you</p>
                        </div>
                        <Link href="/products?featured=true" className="hidden md:flex items-center gap-1 text-primary-600 font-medium hover:gap-2 transition-all">
                            View All <ChevronRight size={18} />
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {featuredProducts.map((product) => (
                            <div key={product.id} className="product-card bg-white rounded-2xl overflow-hidden shadow-md group">
                                {/* Image Container */}
                                <div className="relative aspect-square overflow-hidden bg-gray-100">
                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                        <ShoppingCart size={48} />
                                    </div>

                                    {/* Badges */}
                                    <div className="absolute top-3 left-3 flex flex-col gap-2">
                                        {product.discount_percent > 0 && (
                                            <span className="badge badge-sale">-{product.discount_percent}%</span>
                                        )}
                                        {product.is_featured && (
                                            <span className="badge badge-featured">Featured</span>
                                        )}
                                    </div>

                                    {/* Quick Actions */}
                                    <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-primary-50 transition-colors">
                                            <Heart size={18} className="text-gray-600" />
                                        </button>
                                    </div>

                                    {/* Add to Cart Overlay */}
                                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                                        <button className="w-full btn-primary text-sm py-2">
                                            Add to Cart
                                        </button>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-xs text-primary-600 font-medium bg-primary-50 px-2 py-1 rounded-full">
                                            {product.category.name}
                                        </span>
                                    </div>

                                    <Link href={`/products/${product.slug}`}>
                                        <h3 className="font-semibold text-gray-900 line-clamp-2 hover:text-primary-600 transition-colors">
                                            {product.name}
                                        </h3>
                                    </Link>

                                    <p className="text-sm text-gray-500 mt-1">
                                        by {product.shop.name}
                                    </p>

                                    <div className="flex items-center gap-1 mt-2">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <Star
                                                key={star}
                                                size={14}
                                                className={star <= 4 ? 'fill-accent-400 text-accent-400' : 'text-gray-300'}
                                            />
                                        ))}
                                        <span className="text-sm text-gray-500 ml-1">(4.0)</span>
                                    </div>

                                    <div className="flex items-center gap-2 mt-3">
                                        <span className="text-xl font-bold text-gray-900">
                                            ₹{product.current_price.toLocaleString()}
                                        </span>
                                        {product.sale_price && (
                                            <span className="text-sm text-gray-400 line-through">
                                                ₹{product.price.toLocaleString()}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="text-center mt-10">
                        <Link href="/products" className="btn-primary inline-flex items-center gap-2">
                            View All Products <ArrowRight size={20} />
                        </Link>
                    </div>
                </div>
            </section>

            {/* Customer Testimonials */}
            <section className="py-16 bg-white">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="font-display text-3xl font-bold text-gray-900 mb-2">What Our Customers Say</h2>
                        <p className="text-gray-500">Real experiences from real people</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {testimonials.map((testimonial) => (
                            <div key={testimonial.id} className="bg-gradient-to-br from-primary-50 to-accent-50 rounded-2xl p-6 hover:shadow-lg transition-shadow">
                                <div className="flex items-center gap-1 mb-4">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Star key={star} size={18} className={star <= testimonial.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'} />
                                    ))}
                                </div>
                                <p className="text-gray-700 mb-4 leading-relaxed">{testimonial.review}</p>
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                        {testimonial.name.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                                            {testimonial.verified && (
                                                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">✓ Verified</span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-500">{testimonial.date}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Popular Shops */}
            <section className="py-16 bg-gray-50">
                <div className="container mx-auto px-4">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h2 className="font-display text-3xl font-bold text-gray-900">Popular Shops</h2>
                            <p className="text-gray-500 mt-1">Trusted by thousands of customers</p>
                        </div>
                        <Link href="/shops" className="hidden md:flex items-center gap-1 text-primary-600 font-medium hover:gap-2 transition-all">
                            View All Shops <ChevronRight size={18} />
                        </Link>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {popularShops.map((shop) => (
                            <Link
                                key={shop.id}
                                href={`/shops/${shop.slug}`}
                                className="group bg-white rounded-2xl p-4 text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                            >
                                <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center text-white font-bold text-2xl mx-auto mb-3">
                                    {shop.name.charAt(0)}
                                </div>
                                <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-primary-600 transition-colors">{shop.name}</h3>
                                <div className="flex items-center justify-center gap-1 mb-1">
                                    <Star size={14} className="fill-amber-400 text-amber-400" />
                                    <span className="text-sm text-gray-600">{shop.rating}</span>
                                </div>
                                <p className="text-xs text-gray-500">{shop.products} Products</p>
                                <p className="text-xs text-gray-400 mt-1">{shop.location}</p>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* Deals Banner */}
            <section className="py-16">
                <div className="container mx-auto px-4">
                    <div className="relative bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 rounded-3xl p-8 md:p-12 text-white overflow-hidden">
                        {/* Decorations */}
                        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
                        <div className="absolute bottom-0 left-0 w-96 h-96 bg-black/10 rounded-full blur-3xl" />

                        <div className="relative z-10 text-center max-w-3xl mx-auto">
                            <div className="inline-block bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium mb-4">
                                ⚡ Limited Time Offer
                            </div>
                            <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">
                                Mega Deals Up to 70% OFF
                            </h2>
                            <p className="text-white/90 text-lg mb-6">
                                Don't miss out on incredible savings across all categories
                            </p>
                            <div className="flex items-center justify-center gap-4 mb-8">
                                <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-3">
                                    <div className="text-3xl font-bold">12</div>
                                    <div className="text-sm">Hours</div>
                                </div>
                                <div className="text-2xl">:</div>
                                <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-3">
                                    <div className="text-3xl font-bold">34</div>
                                    <div className="text-sm">Minutes</div>
                                </div>
                                <div className="text-2xl">:</div>
                                <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-3">
                                    <div className="text-3xl font-bold">56</div>
                                    <div className="text-sm">Seconds</div>
                                </div>
                            </div>
                            <Link href="/products?deals=true" className="inline-flex items-center gap-2 bg-white text-orange-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition-colors shadow-lg">
                                Shop Deals Now <ArrowRight size={20} />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Banner */}
            <section className="py-16">
                <div className="container mx-auto px-4">
                    <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-3xl p-8 md:p-12 text-white text-center relative overflow-hidden">
                        {/* Decorations */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent-500/20 rounded-full blur-3xl" />

                        <div className="relative z-10 max-w-2xl mx-auto">
                            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
                                Are You a Local Shop Owner?
                            </h2>
                            <p className="text-white/80 text-lg mb-8">
                                Partner with Markexo and reach thousands of customers in your city. Grow your business with zero investment.
                            </p>
                            <Link href="/contact" className="btn-accent inline-flex items-center gap-2">
                                Become a Partner <ArrowRight size={20} />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Newsletter Signup */}
            <section className="py-16 bg-gradient-to-br from-primary-600 to-primary-800">
                <div className="container mx-auto px-4">
                    <div className="max-w-3xl mx-auto text-center text-white">
                        <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
                            Get Exclusive Deals & Updates
                        </h2>
                        <p className="text-white/80 text-lg mb-8">
                            Subscribe to our newsletter and never miss out on special offers, new arrivals, and local shop highlights.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                            <input
                                type="email"
                                placeholder="Enter your email address"
                                className="flex-1 px-6 py-4 rounded-xl text-gray-900 outline-none focus:ring-4 focus:ring-white/30"
                            />
                            <button className="bg-accent-500 hover:bg-accent-600 text-white px-8 py-4 rounded-xl font-bold transition-colors whitespace-nowrap">
                                Subscribe Now
                            </button>
                        </div>
                        <p className="text-white/60 text-sm mt-4">
                            🔒 We respect your privacy. Unsubscribe anytime.
                        </p>
                    </div>
                </div>
            </section>

            {/* Why Choose Us */}
            <section className="py-16 bg-white">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="font-display text-3xl font-bold text-gray-900 mb-2">Why Choose Markexo?</h2>
                        <p className="text-gray-500">Your trusted local marketplace</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <div className="text-center group">
                            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                                <Award className="text-white" size={40} />
                            </div>
                            <h3 className="text-4xl font-bold text-gray-900 mb-2">500+</h3>
                            <p className="text-gray-600 font-medium">Local Shops</p>
                            <p className="text-sm text-gray-500 mt-1">Verified & Trusted</p>
                        </div>
                        <div className="text-center group">
                            <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                                <ShoppingCart className="text-white" size={40} />
                            </div>
                            <h3 className="text-4xl font-bold text-gray-900 mb-2">10,000+</h3>
                            <p className="text-gray-600 font-medium">Products</p>
                            <p className="text-sm text-gray-500 mt-1">Quality Assured</p>
                        </div>
                        <div className="text-center group">
                            <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                                <Heart className="text-white" size={40} />
                            </div>
                            <h3 className="text-4xl font-bold text-gray-900 mb-2">50,000+</h3>
                            <p className="text-gray-600 font-medium">Happy Customers</p>
                            <p className="text-sm text-gray-500 mt-1">5-Star Reviews</p>
                        </div>
                        <div className="text-center group">
                            <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                                <Truck className="text-white" size={40} />
                            </div>
                            <h3 className="text-4xl font-bold text-gray-900 mb-2">Same Day</h3>
                            <p className="text-gray-600 font-medium">Delivery</p>
                            <p className="text-sm text-gray-500 mt-1">Fast & Reliable</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Quick Enquiry Section */}
            <section className="py-16 bg-white border-t border-gray-100">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto">
                        <div className="text-center mb-10">
                            <h2 className="font-display text-3xl font-bold text-gray-900">Have a Question?</h2>
                            <p className="text-gray-500 mt-2">Send us a message and we'll get back to you shortly.</p>
                        </div>

                        <EnquiryForm />
                    </div>
                </div>
            </section>
        </div>
    );
}

function EnquiryForm() {
    const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('submitting');

        try {
            const response = await fetch(`${API_BASE_URL}/enquiries/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                setStatus('success');
                setFormData({ name: '', email: '', subject: '', message: '' });
                setTimeout(() => setStatus('idle'), 5000);
            } else {
                setStatus('error');
            }
        } catch (error) {
            setStatus('error');
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    if (status === 'success') {
        return (
            <div className="bg-green-50 p-8 rounded-2xl text-center animate-fade-in">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle size={32} />
                </div>
                <h3 className="text-xl font-bold text-green-900 mb-2">Message Sent!</h3>
                <p className="text-green-700">Thank you for contacting us. We will reply to your email soon.</p>
                <button
                    onClick={() => setStatus('idle')}
                    className="mt-6 px-6 py-2 bg-white text-green-700 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
                >
                    Send Another Message
                </button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="bg-gray-50 rounded-2xl p-8 md:p-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Your Name</label>
                    <input
                        type="text"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-white transition-all"
                        placeholder="John Doe"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                    <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-white transition-all"
                        placeholder="john@example.com"
                    />
                </div>
            </div>

            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                <input
                    type="text"
                    name="subject"
                    required
                    value={formData.subject}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-white transition-all"
                    placeholder="How can we help?"
                />
            </div>

            <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                <textarea
                    name="message"
                    required
                    rows={4}
                    value={formData.message}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-white transition-all resize-none"
                    placeholder="Tell us more..."
                />
            </div>

            <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={status === 'submitting'}
                    className="btn-primary flex items-center gap-2 px-8 py-3 text-lg disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {status === 'submitting' ? 'Sending...' : (
                        <>
                            Send Message <Send size={18} />
                        </>
                    )}
                </button>
            </div>
        </form>
    );
}
