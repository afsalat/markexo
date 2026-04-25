'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronRight, ShoppingCart, ArrowRight, Zap, Star, Shield, Award, Package, Search } from 'lucide-react';
import { Category, Banner } from '@/lib/api';

// Category icons mapping for fallback
const categoryIcons: Record<string, string> = {
    'Sarees': '👗',
    "Women's Wear": '👚',
    "Men's Wear": '👔',
    "Kids Wear": '👶',
    'Ethnic Wear': '🥻',
    'Western Wear': '👖',
    'Home Textiles': '🏠',
    'Fabrics': '🧵',
    'Fashion Accessories': '👜',
    'Footwear': '👠',
    'Beauty & Health': '✨',
    'Electronics': '⚡',
};

interface CategoriesClientProps {
    categories: Category[];
    banners: Banner[];
}

export default function CategoriesClient({ categories, banners }: CategoriesClientProps) {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredCategories = categories.filter(cat =>
        cat.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const featuredCategories = categories.slice(0, 3); // Just pick first 3 as featured for demo

    const heroBanner = banners.find((banner) => banner.is_active && banner.section === 'category_hero')
        || banners.find((banner) => banner.is_active);

    return (
        <div className="min-h-screen bg-white">
            {/* ========================================
                HERO SECTION
            ======================================== */}
            <section className="relative py-24 md:py-32 overflow-hidden">
                {/* Dynamic Hero Background */}
                <div className="absolute inset-0">
                    {heroBanner ? (
                        <>
                            <img
                                src={heroBanner.image}
                                alt="Hero"
                                className="w-full h-full object-cover opacity-30"
                            />
                            <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-transparent" />
                        </>
                    ) : (
                        <div className="absolute inset-0 bg-gray-50">
                            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-gray-100 to-gray-200" />
                        </div>
                    )}
                    <div className="absolute bottom-0 left-0 w-full h-px bg-gray-200" />
                </div>

                <div className="container mx-auto px-4 relative z-10">
                    <div className="max-w-4xl">
                        <nav className="flex items-center gap-2 text-sm text-gray-500 dark:text-silver-500 mb-6" data-aos="fade-down" data-aos-delay="0">
                            <Link href="/" className="hover:text-accent-500 transition-colors">Home</Link>
                            <ChevronRight size={14} />
                            <span className="text-gray-900 dark:text-white">All Categories</span>
                        </nav>

                        <div className="inline-flex items-center gap-2 bg-accent-500/10 dark:bg-accent-500/10 border border-accent-500/20 px-4 py-1.5 rounded-full mb-8" data-aos="fade-down" data-aos-delay="100">
                            <Zap size={14} className="text-accent-500 animate-pulse" />
                            <span className="text-accent-500 text-xs font-bold uppercase tracking-widest">Marketplace Bazaars</span>
                        </div>

                        <h1 className="text-5xl md:text-7xl font-bold text-gray-900 dark:text-white mb-8 leading-tight" data-aos="fade-up" data-aos-delay="200">
                            The Complete <br />
                            <span className="gradient-text-accent">VorionMart Directory</span>
                        </h1>
                        <p className="text-xl md:text-2xl text-gray-600 dark:text-silver-400 mb-10 max-w-2xl leading-relaxed" data-aos="fade-up" data-aos-delay="300">
                            Navigate through our verified categories and find exactly what you need.
                            From local artisans to global brands.
                        </p>

                        <div className="relative max-w-md" data-aos="fade-up" data-aos-delay="400">
                            <input
                                type="text"
                                placeholder="Search categories..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="hero-search-input w-full bg-gray-100 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-2xl px-6 py-4 text-gray-900 dark:text-white focus:border-accent-500 outline-none transition-all shadow-xl pl-14"
                            />
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-silver-500" size={20} />
                        </div>
                    </div>
                </div>
            </section>

            {/* ========================================
                FEATURED CATEGORY BANNERS
            ======================================== */}
            {!searchTerm && (
                <section className="py-16 bg-gray-50 dark:bg-dark-900 border-b border-gray-200 dark:border-dark-800">
                    <div className="container mx-auto px-4">
                        <div className="flex justify-between items-end mb-10" data-aos="fade-up">
                            <div>
                                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 font-display">Featured Collections</h2>
                                <p className="text-gray-500 dark:text-silver-500">Specially handpicked for our premium customers</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {featuredCategories.map((cat, idx) => (
                                <Link
                                    key={cat.id}
                                    href={`/products?category=${cat.slug}`}
                                    data-aos="fade-up"
                                    data-aos-delay={idx * 100}
                                    className="group relative block h-[400px] overflow-hidden rounded-3xl border border-gray-200 dark:border-dark-700 hover:border-accent-500/50 transition-all duration-500 shadow-2xl"
                                >
                                    <span className="sr-only">Shop {cat.name} - Premium Quality Products</span>
                                    {/* Image Background */}
                                    <div className="absolute inset-0">
                                        <img
                                            src={cat.image || `https://images.unsplash.com/photo-${1500000000000 + idx}?auto=format&fit=crop&q=80&w=800`}
                                            alt={cat.name}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/40 to-transparent dark:from-dark-950 dark:via-dark-950/40 dark:to-transparent" />
                                    </div>

                                    {/* Content */}
                                    <div className="absolute inset-0 p-8 flex flex-col justify-end">
                                        <div className="mb-4">
                                            <span className="bg-accent-500 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                                                Featured
                                            </span>
                                        </div>
                                        <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 transform group-hover:-translate-y-2 transition-transform duration-300">
                                            {cat.name}
                                        </h3>
                                        <p className="text-gray-600 dark:text-silver-300 mb-6 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 line-clamp-2">
                                            {cat.description || `Explore our exclusive collection of ${cat.name.toLowerCase()} items.`}
                                        </p>
                                        <div className="flex items-center gap-2 text-accent-500 font-bold group-hover:gap-3 transition-all">
                                            View Collection <ArrowRight size={18} />
                                        </div>
                                    </div>

                                    {/* Count Badge */}
                                    <div className="absolute top-6 right-6 bg-white/80 dark:bg-dark-900/80 backdrop-blur-md border border-gray-200 dark:border-white/10 px-4 py-2 rounded-2xl">
                                        <p className="text-gray-900 dark:text-white font-bold">{cat.product_count || 0}</p>
                                        <p className="text-[10px] text-gray-500 dark:text-silver-500 uppercase tracking-tighter">Items</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* ========================================
                ALL CATEGORIES GRID
            ======================================== */}
            <section className="py-12 bg-gray-50">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4 font-display">
                            All Categories
                        </h1>
                        <p className="text-lg text-gray-600 dark:text-silver-400 mb-8">
                            Browse our complete collection of premium products
                        </p>
                    </div>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12" data-aos="fade-up">
                        <div>
                            <h2 className="text-3xl font-bold text-gray-900 dark:text-white font-display">
                                {searchTerm ? `Search results for "${searchTerm}"` : 'Everything We Offer'}
                            </h2>
                            <p className="text-gray-500 dark:text-silver-500 mt-2">
                                {filteredCategories.length} categories found in our bazaar
                            </p>
                        </div>

                        <div className="flex items-center gap-3 bg-gray-100 dark:bg-dark-800 p-1.5 rounded-2xl border border-gray-200 dark:border-dark-700">
                            <button className="px-6 py-2.5 bg-accent-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-accent-500/20 transition-all">
                                All
                            </button>
                            <button className="px-6 py-2.5 text-gray-500 dark:text-silver-400 hover:text-gray-900 dark:hover:text-white rounded-xl text-sm font-bold transition-all">
                                Fashion
                            </button>
                            <button className="px-6 py-2.5 text-gray-500 dark:text-silver-400 hover:text-gray-900 dark:hover:text-white rounded-xl text-sm font-bold transition-all">
                                Tech
                            </button>
                        </div>
                    </div>

                    {filteredCategories.length > 0 ? (
                        <div className="space-y-12">
                            {filteredCategories.map((cat, index) => (
                                <div key={cat.id} className="space-y-6" data-aos="fade-up" data-aos-delay={index * 50}>
                                    <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 shadow-sm">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 bg-accent-500/10 rounded-xl flex items-center justify-center border border-accent-500/20">
                                                {cat.image ? (
                                                    <img src={cat.image} alt={cat.name} className="w-10 h-10 object-cover rounded-lg" />
                                                ) : (
                                                    <span className="text-2xl">{categoryIcons[cat.name] || '📦'}</span>
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">{cat.name}</h3>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <span className="text-[11px] text-gray-500 dark:text-silver-500 font-mono italic">/{cat.slug}</span>
                                                    {cat.children && cat.children.length > 0 && (
                                                        <span className="bg-gray-100 dark:bg-dark-700/50 text-[10px] text-gray-600 dark:text-silver-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                                            {cat.children.length} Sub-categories
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <Link
                                            href={`/products?category=${cat.slug}`}
                                            className="p-2 hover:bg-accent-500/10 rounded-lg text-gray-400 dark:text-silver-500 hover:text-accent-500 transition-all"
                                        >
                                            <ChevronRight size={20} className="-rotate-90" />
                                        </Link>
                                    </div>

                                    {cat.children && cat.children.length > 0 && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pl-8 md:pl-16 relative">
                                            {/* Decorative connecting line */}
                                            <div className="absolute left-4 md:left-8 top-0 bottom-0 w-px bg-gradient-to-b from-gray-200 dark:from-dark-700 to-transparent" />

                                            {cat.children.map((child: Category) => (
                                                <Link
                                                    key={child.id}
                                                    href={`/products?category=${child.slug}`}
                                                    className="group flex items-center gap-4 p-3 rounded-xl bg-gray-50/50 dark:bg-dark-800/40 border border-gray-200 dark:border-dark-700/50 hover:border-accent-500 transition-all hover:shadow-lg relative"
                                                >
                                                    <div className="absolute -left-4 md:-left-8 top-1/2 -translate-y-1/2 w-4 md:w-8 h-px bg-gray-200 dark:bg-dark-700" />

                                                    <div className="w-10 h-10 bg-gray-100 dark:bg-dark-700/50 rounded-lg flex items-center justify-center group-hover:bg-accent-500/10 transition-colors">
                                                        {child.image ? (
                                                            <img src={child.image} alt={child.name} className="w-7 h-7 object-cover rounded shadow-sm" />
                                                        ) : (
                                                            <Package size={18} className="text-silver-500 group-hover:text-accent-500 transition-colors" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-accent-500 transition-colors">{child.name}</h4>
                                                        <p className="text-[10px] text-gray-500 dark:text-silver-500 italic mt-0.5">/{child.slug}</p>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-gray-50 dark:bg-dark-800/50 rounded-3xl border border-dashed border-gray-200 dark:border-dark-700">
                            <div className="w-20 h-20 bg-gray-100 dark:bg-dark-700 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Search size={32} className="text-gray-400 dark:text-dark-500" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No categories match your search</h3>
                            <p className="text-gray-500 dark:text-silver-500 mb-8">Try searching for something else or browse all collections</p>
                            <button
                                onClick={() => setSearchTerm('')}
                                className="px-6 py-3 bg-accent-500 text-white font-bold rounded-xl hover:bg-accent-600 transition-colors"
                            >
                                Clear Search
                            </button>
                        </div>
                    )}
                </div>
            </section>

            {/* ========================================
                WHY SHOP BY CATEGORY SECTION
            ======================================== */}
            <section className="py-24 bg-gray-50 dark:bg-dark-800 border-t border-gray-200 dark:border-dark-700">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-16 font-display" data-aos="fade-up">Why Shop at VorionMart?</h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
                        <div className="flex flex-col items-center" data-aos="fade-up" data-aos-delay="0">
                            <div className="w-16 h-16 bg-accent-500/10 rounded-2xl flex items-center justify-center mb-6 border border-accent-500/20">
                                <Shield size={32} className="text-accent-500" />
                            </div>
                            <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Authentic Gear</h4>
                            <p className="text-gray-500 dark:text-silver-500 text-sm">Every product is verified for quality and authenticity.</p>
                        </div>
                        <div className="flex flex-col items-center" data-aos="fade-up" data-aos-delay="100">
                            <div className="w-16 h-16 bg-accent-500/10 rounded-2xl flex items-center justify-center mb-6 border border-accent-500/20">
                                <Zap size={32} className="text-accent-500" />
                            </div>
                            <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Instant Savings</h4>
                            <p className="text-gray-500 dark:text-silver-500 text-sm">Direct-to-consumer prices with high discounts daily.</p>
                        </div>
                        <div className="flex flex-col items-center" data-aos="fade-up" data-aos-delay="200">
                            <div className="w-16 h-16 bg-accent-500/10 rounded-2xl flex items-center justify-center mb-6 border border-accent-500/20">
                                <Package size={32} className="text-accent-500" />
                            </div>
                            <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Premium Delivery</h4>
                            <p className="text-gray-500 dark:text-silver-500 text-sm">Priority shipping on all orders above ₹500.</p>
                        </div>
                        <div className="flex flex-col items-center" data-aos="fade-up" data-aos-delay="300">
                            <div className="w-16 h-16 bg-accent-500/10 rounded-2xl flex items-center justify-center mb-6 border border-accent-500/20">
                                <Award size={32} className="text-accent-500" />
                            </div>
                            <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Buyer Protection</h4>
                            <p className="text-gray-500 dark:text-silver-500 text-sm">100% money back guarantee on all COD orders.</p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
