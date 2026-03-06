'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronRight, ShoppingCart, ArrowRight, Zap, Star, Shield, Award, Package, Search } from 'lucide-react';
import { fetchCategories, fetchBanners } from '@/lib/api';

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

export default function CategoriesPage() {
    const [categories, setCategories] = useState<any[]>([]);
    const [banners, setBanners] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const [categoriesResponse, bannersResponse] = await Promise.all([
                    fetchCategories(),
                    fetchBanners()
                ]);

                const categoriesList = Array.isArray(categoriesResponse) ? categoriesResponse : (categoriesResponse.results || []);
                setCategories(categoriesList);

                const bannersList = Array.isArray(bannersResponse) ? bannersResponse : (bannersResponse.results || []);
                setBanners(bannersList);
            } catch (error) {
                console.error('Error loading categories:', error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    const filteredCategories = categories.filter(cat =>
        cat.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const featuredCategories = categories.slice(0, 3); // Just pick first 3 as featured for demo

    const heroBanner = banners.find(b => b.is_active);

    return (
        <div className="min-h-screen bg-white dark:bg-dark-900">
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
                            <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-transparent dark:from-dark-950 dark:via-dark-950/80 dark:to-transparent" />
                        </>
                    ) : (
                        <div className="absolute inset-0 bg-gray-50 dark:bg-dark-950">
                            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,#00f5d4_0%,transparent_50%)] opacity-20 dark:block hidden" />
                            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 dark:hidden" />
                        </div>
                    )}
                    <div className="absolute bottom-0 left-0 w-full h-px bg-gray-200 dark:bg-dark-700" />
                </div>

                <div className="container mx-auto px-4 relative z-10">
                    <div className="max-w-4xl">
                        <nav className="flex items-center gap-2 text-sm text-gray-500 dark:text-silver-500 mb-6 animate-fade-in">
                            <Link href="/" className="hover:text-accent-500 transition-colors">Home</Link>
                            <ChevronRight size={14} />
                            <span className="text-gray-900 dark:text-white">All Categories</span>
                        </nav>

                        <div className="inline-flex items-center gap-2 bg-accent-500/10 dark:bg-accent-500/10 border border-accent-500/20 px-4 py-1.5 rounded-full mb-8 animate-fade-in">
                            <Zap size={14} className="text-accent-500 animate-pulse" />
                            <span className="text-accent-500 text-xs font-bold uppercase tracking-widest">Marketplace Bazaars</span>
                        </div>

                        <h1 className="text-5xl md:text-7xl font-bold text-gray-900 dark:text-white mb-8 animate-slide-up leading-tight">
                            The Complete <br />
                            <span className="gradient-text-accent">VorionMart Directory</span>
                        </h1>
                        <p className="text-xl md:text-2xl text-gray-600 dark:text-silver-400 mb-10 animate-slide-up delay-100 max-w-2xl leading-relaxed">
                            Navigate through our verified categories and find exactly what you need.
                            From local artisans to global brands.
                        </p>

                        <div className="relative max-w-md animate-slide-up delay-200">
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
                        <div className="flex justify-between items-end mb-10">
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
                                    className="group relative h-[400px] overflow-hidden rounded-3xl border border-gray-200 dark:border-dark-700 hover:border-accent-500/50 transition-all duration-500 shadow-2xl"
                                >
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
            <section className="py-20 bg-white dark:bg-dark-900">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
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

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="w-16 h-16 border-4 border-accent-500/20 border-t-accent-500 rounded-full animate-spin mb-4" />
                            <p className="text-gray-500 dark:text-silver-500">Unlocking our collections...</p>
                        </div>
                    ) : filteredCategories.length > 0 ? (
                        <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                            {filteredCategories.map((cat) => (
                                <Link
                                    key={cat.id}
                                    href={`/products?category=${cat.slug}`}
                                    className="group bg-gray-50 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-3xl p-6 text-center hover:border-accent-500 transition-all duration-300 hover:shadow-2xl hover:shadow-accent-500/10"
                                >
                                    <div className="relative mb-6 mx-auto w-24 h-24 flex items-center justify-center">
                                        <div className="absolute inset-0 bg-accent-500/5 rounded-full group-hover:scale-110 transition-transform duration-500" />
                                        {cat.image ? (
                                            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-gray-200 dark:border-dark-600 group-hover:border-accent-500 transition-colors">
                                                <img
                                                    src={cat.image}
                                                    alt={cat.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        ) : (
                                            <span className="text-5xl transform group-hover:rotate-12 transition-transform duration-300">
                                                {categoryIcons[cat.name] || '📦'}
                                            </span>
                                        )}

                                        {/* Corner icon */}
                                        <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-white dark:bg-dark-700 rounded-lg flex items-center justify-center border border-gray-200 dark:border-dark-600 group-hover:bg-accent-500 group-hover:border-accent-500 transition-colors">
                                            <ChevronRight size={16} className="text-gray-400 dark:text-silver-400 group-hover:text-white transition-colors" />
                                        </div>
                                    </div>

                                    <h3 className="font-bold text-gray-900 dark:text-white mb-1 group-hover:text-accent-500 transition-colors truncate">
                                        {cat.name}
                                    </h3>
                                    <p className="text-xs text-gray-500 dark:text-silver-500 font-medium">
                                        {cat.product_count || 0} Products
                                    </p>
                                </Link>
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
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-16 font-display">Why Shop at VorionMart?</h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
                        <div className="flex flex-col items-center">
                            <div className="w-16 h-16 bg-accent-500/10 rounded-2xl flex items-center justify-center mb-6 border border-accent-500/20">
                                <Shield size={32} className="text-accent-500" />
                            </div>
                            <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Authentic Gear</h4>
                            <p className="text-gray-500 dark:text-silver-500 text-sm">Every product is verified for quality and authenticity.</p>
                        </div>
                        <div className="flex flex-col items-center">
                            <div className="w-16 h-16 bg-accent-500/10 rounded-2xl flex items-center justify-center mb-6 border border-accent-500/20">
                                <Zap size={32} className="text-accent-500" />
                            </div>
                            <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Instant Savings</h4>
                            <p className="text-gray-500 dark:text-silver-500 text-sm">Direct-to-consumer prices with high discounts daily.</p>
                        </div>
                        <div className="flex flex-col items-center">
                            <div className="w-16 h-16 bg-accent-500/10 rounded-2xl flex items-center justify-center mb-6 border border-accent-500/20">
                                <Package size={32} className="text-accent-500" />
                            </div>
                            <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Premium Delivery</h4>
                            <p className="text-gray-500 dark:text-silver-500 text-sm">Priority shipping on all orders above ₹500.</p>
                        </div>
                        <div className="flex flex-col items-center">
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
