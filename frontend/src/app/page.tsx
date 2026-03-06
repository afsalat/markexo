'use client';

import Link from 'next/link';
import { ArrowRight, Truck, Shield, Clock, Award, ChevronRight, Star, ShoppingCart, Heart, Send, CheckCircle, CreditCard, Zap, Package, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import { API_BASE_URL } from '@/config/apiConfig';
import { fetchProducts, fetchCategories } from '@/lib/api';
import { useCustomerAuth } from '@/context/CustomerAuthContext';

// Category icons mapping
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

const testimonials = [
    { id: 1, name: 'Priya Sharma', rating: 5, review: 'Amazing platform! COD makes it so easy. Fast delivery and great quality products.', date: '2 days ago', verified: true },
    { id: 2, name: 'Rahul Verma', rating: 5, review: 'Love the variety of products. Paid on delivery with no hassle at all.', date: '1 week ago', verified: true },
    { id: 3, name: 'Anjali Patel', rating: 4, review: 'Great experience! Customer service was helpful and order arrived on time.', date: '2 weeks ago', verified: true },
];

export default function HomePage() {
    const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
    const [trendingProducts, setTrendingProducts] = useState<any[]>([]);
    const [bestSellers, setBestSellers] = useState<any[]>([]);
    const [newArrivals, setNewArrivals] = useState<any[]>([]);
    const [dealsOfTheDay, setDealsOfTheDay] = useState<any[]>([]);
    const [suggestedProducts, setSuggestedProducts] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { addToWishlist, removeFromWishlist, isWishlisted } = useCustomerAuth();

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);

                // Fetch products and categories in parallel
                const [productsResponse, categoriesResponse] = await Promise.all([
                    fetchProducts(),
                    fetchCategories()
                ]);

                // Handle paginated response - extract results array
                const allProducts = Array.isArray(productsResponse) ? productsResponse : (productsResponse.results || []);

                // Handle categories response
                const categoriesList = Array.isArray(categoriesResponse) ? categoriesResponse : (categoriesResponse.results || []);
                const formattedCategories = categoriesList.map((cat: any) => ({
                    name: cat.name,
                    slug: cat.slug,
                    count: cat.product_count || 0,
                    icon: categoryIcons[cat.name] || '📦',
                    image: cat.image
                }));
                setCategories(formattedCategories.slice(0, 12)); // Show up to 12 categories

                // Filter and set different product sections
                // Featured products - products marked as featured
                const featured = allProducts.filter((p: any) => p.is_featured).slice(0, 4);
                setFeaturedProducts(featured.length > 0 ? featured : allProducts.slice(0, 4));

                // Trending - products with high discount
                const trending = allProducts.filter((p: any) => p.discount_percent > 20).slice(0, 6);
                setTrendingProducts(trending.length > 0 ? trending : allProducts.slice(0, 6));

                // Best Sellers - first 4 products
                setBestSellers(allProducts.slice(0, 4));

                // New Arrivals - last 4 products (newest)
                setNewArrivals(allProducts.slice(-4).reverse());

                // Deals of the Day - products with highest discount
                const deals = [...allProducts].sort((a: any, b: any) => b.discount_percent - a.discount_percent).slice(0, 4);
                setDealsOfTheDay(deals);

                // Suggested - random selection
                const shuffled = [...allProducts].sort(() => 0.5 - Math.random());
                setSuggestedProducts(shuffled.slice(0, 4));

            } catch (error) {
                console.error('Error loading data:', error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    return (
        <div className="min-h-screen bg-dark-900">
            {/* ========================================
                HERO SECTION - VorionMart Identity
            ======================================== */}
            <section className="relative hero-gradient overflow-hidden">
                {/* Background Effects */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute top-1/4 -right-20 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl" />
                    <div className="absolute bottom-1/4 -left-20 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-accent-500/5 to-transparent rounded-full" />
                </div>

                <div className="container mx-auto px-4 py-20 md:py-32 relative z-10">
                    <div className="max-w-4xl mx-auto text-center">
                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 bg-dark-700/50 border border-dark-600 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium mb-6 animate-fade-in">
                            <span className="w-2 h-2 bg-accent-500 rounded-full animate-pulse" />
                            <span className="text-silver-300">💵 Cash on Delivery Available</span>
                        </div>

                        {/* Main Heading */}
                        <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold mb-6 animate-slide-up text-white">
                            The Future of Shopping.
                            <br />
                            <span className="gradient-text-accent">Delivered.</span>
                        </h1>

                        {/* Subheading */}
                        <p className="text-lg md:text-xl text-silver-400 mb-8 max-w-2xl mx-auto animate-slide-up">
                            Premium products from verified sellers. Pay when you receive.
                            No risk, no hassle, pure convenience.
                        </p>

                        {/* CTA Buttons */}
                        <div className="flex flex-wrap justify-center gap-4 animate-slide-up">
                            <Link href="/products" className="btn-primary flex items-center gap-2 text-lg px-8 py-4">
                                Shop Now <ArrowRight size={20} />
                            </Link>
                            <Link href="/categories" className="btn-secondary flex items-center gap-2 text-lg px-8 py-4">
                                Browse Categories
                            </Link>
                        </div>

                        {/* Trust Indicators */}
                        <div className="flex flex-wrap justify-center gap-6 mt-10 text-silver-400 text-sm">
                            <span className="flex items-center gap-2">
                                <CreditCard size={18} className="text-accent-500" />
                                Pay on Delivery
                            </span>
                            <span className="flex items-center gap-2">
                                <Truck size={18} className="text-accent-500" />
                                Free Shipping ₹500+
                            </span>
                            <span className="flex items-center gap-2">
                                <Shield size={18} className="text-accent-500" />
                                Verified Sellers
                            </span>
                        </div>
                    </div>
                </div>
            </section>

            {/* ========================================
                TRUST LAYER - COD First
            ======================================== */}
            <section className="py-8 bg-dark-800 border-y border-dark-700">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-accent-500/10 rounded-xl flex items-center justify-center">
                                <CreditCard className="text-accent-500" size={24} />
                            </div>
                            <div>
                                <h3 className="font-semibold text-white">Cash on Delivery</h3>
                                <p className="text-sm text-silver-500">Pay when you receive</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-accent-500/10 rounded-xl flex items-center justify-center">
                                <Truck className="text-accent-500" size={24} />
                            </div>
                            <div>
                                <h3 className="font-semibold text-white">Fast Delivery</h3>
                                <p className="text-sm text-silver-500">2-5 business days</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-accent-500/10 rounded-xl flex items-center justify-center">
                                <Shield className="text-accent-500" size={24} />
                            </div>
                            <div>
                                <h3 className="font-semibold text-white">Secure Checkout</h3>
                                <p className="text-sm text-silver-500">100% protected</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-accent-500/10 rounded-xl flex items-center justify-center">
                                <Clock className="text-accent-500" size={24} />
                            </div>
                            <div>
                                <h3 className="font-semibold text-white">24/7 Support</h3>
                                <p className="text-sm text-silver-500">Always here to help</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ========================================
                CATEGORIES
            ======================================== */}
            <section className="py-16 bg-dark-900">
                <div className="container mx-auto px-4">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h2 className="font-display text-2xl md:text-3xl font-bold text-white">Shop by Category</h2>
                            <p className="text-silver-500 mt-1">Find what you&apos;re looking for</p>
                        </div>
                        <Link href="/categories" className="hidden md:flex items-center gap-1 text-accent-500 font-medium hover:gap-2 transition-all">
                            View All <ChevronRight size={18} />
                        </Link>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {categories.map((category) => (
                            <Link
                                key={category.slug}
                                href={`/products?category=${category.slug}`}
                                className="group relative bg-dark-800 border border-dark-600 rounded-2xl p-6 text-center overflow-hidden hover:border-accent-500/50 transition-all duration-300"
                            >
                                <div className="absolute inset-0 bg-gradient-to-b from-accent-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="relative z-10 flex flex-col items-center">
                                    {category.image ? (
                                        <div className="w-16 h-16 mb-3 rounded-full overflow-hidden bg-dark-700 border-2 border-transparent group-hover:border-accent-500 transition-colors">
                                            <img
                                                src={category.image}
                                                alt={category.name}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    ) : (
                                        <div className="text-4xl mb-3 transform group-hover:scale-110 transition-transform duration-300">{category.icon}</div>
                                    )}
                                    <h3 className="font-semibold text-white mb-1 group-hover:text-accent-500 transition-colors">{category.name}</h3>
                                    <p className="text-silver-500 text-sm">{category.count} items</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* ========================================
                TRENDING PRODUCTS
            ======================================== */}
            <section className="py-16 bg-dark-800">
                <div className="container mx-auto px-4">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Zap className="text-accent-500" size={24} />
                                <h2 className="font-display text-2xl md:text-3xl font-bold text-white">Trending Now</h2>
                            </div>
                            <p className="text-silver-500">Hot picks everyone&apos;s buying</p>
                        </div>
                        <Link href="/products?trending=true" className="hidden md:flex items-center gap-1 text-accent-500 font-medium hover:gap-2 transition-all">
                            View All <ChevronRight size={18} />
                        </Link>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {trendingProducts.map((product) => (
                            <Link
                                key={product.id}
                                href={`/products/${product.slug}`}
                                className="group product-card"
                            >
                                <div className="aspect-square bg-dark-700 flex items-center justify-center relative overflow-hidden">
                                    {product.image ? (
                                        <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                                    ) : (
                                        <ShoppingCart size={40} className="text-dark-500" />
                                    )}
                                    <div className="absolute top-2 left-2 badge badge-sale text-xs">
                                        🔥 HOT
                                    </div>
                                </div>
                                <div className="p-3">
                                    <h3 className="font-semibold text-sm text-white line-clamp-2 mb-1 group-hover:text-accent-500 transition-colors">
                                        {product.name}
                                    </h3>
                                    <div className="flex items-center gap-1 mb-2">
                                        <Star size={12} className="fill-amber-400 text-amber-400" />
                                        <span className="text-xs text-silver-400">{product.rating}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg font-bold text-white">₹{product.current_price.toLocaleString()}</span>
                                        {product.price && <span className="text-xs text-silver-500 line-through">₹{product.price.toLocaleString()}</span>}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* ========================================
                FEATURED PRODUCTS
            ======================================== */}
            <section className="py-16 bg-dark-900">
                <div className="container mx-auto px-4">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h2 className="font-display text-2xl md:text-3xl font-bold text-white">Featured Products</h2>
                            <p className="text-silver-500 mt-1">Handpicked just for you</p>
                        </div>
                        <Link href="/products?featured=true" className="hidden md:flex items-center gap-1 text-accent-500 font-medium hover:gap-2 transition-all">
                            View All <ChevronRight size={18} />
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {featuredProducts.map((product) => (
                            <div key={product.id} className="product-card group">
                                <Link href={`/products/${product.slug}`} className="block">
                                    {/* Image Container */}
                                    <div className="relative aspect-square overflow-hidden bg-dark-700">
                                        {product.image ? (
                                            <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-dark-500">
                                                <ShoppingCart size={48} />
                                            </div>
                                        )}

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
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    if (isWishlisted(product.id)) {
                                                        removeFromWishlist(product.id);
                                                    } else {
                                                        addToWishlist(product);
                                                    }
                                                }}
                                                className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-colors ${isWishlisted(product.id)
                                                    ? 'bg-red-500 text-white'
                                                    : 'bg-dark-800 text-silver-300 hover:bg-accent-500 hover:text-dark-900'
                                                    }`}>
                                                <Heart size={18} className={isWishlisted(product.id) ? 'fill-current' : ''} />
                                            </button>
                                        </div>

                                        {/* Add to Cart Overlay */}
                                        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-dark-900/90 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                                            <button
                                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                                className="w-full btn-primary text-sm py-2">
                                                Add to Cart
                                            </button>
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-xs text-accent-500 font-medium bg-accent-500/10 px-2 py-1 rounded-full">
                                                {product.category?.name || 'Uncategorized'}
                                            </span>
                                        </div>

                                        <h3 className="font-semibold text-white line-clamp-2 hover:text-accent-500 transition-colors">
                                            {product.name}
                                        </h3>

                                        <p className="text-xs text-accent-500 font-medium mt-1 flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 bg-accent-500 rounded-full"></span>
                                            Fulfilled by VorionMart
                                        </p>

                                        <div className="flex items-center gap-1 mt-2">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <Star
                                                    key={star}
                                                    size={14}
                                                    className={star <= 4 ? 'fill-amber-400 text-amber-400' : 'text-dark-500'}
                                                />
                                            ))}
                                            <span className="text-sm text-silver-500 ml-1">(4.0)</span>
                                        </div>

                                        <div className="flex items-center gap-2 mt-3">
                                            <span className="text-xl font-bold text-white">
                                                ₹{product.current_price.toLocaleString()}
                                            </span>
                                            {product.price && product.price > product.current_price && (
                                                <span className="text-sm text-silver-500 line-through">
                                                    ₹{product.price.toLocaleString()}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </Link>
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

            {/* ========================================
                BEST SELLERS
            ======================================== */}
            <section className="py-16 bg-dark-800">
                <div className="container mx-auto px-4">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Award className="text-accent-500" size={24} />
                                <h2 className="font-display text-2xl md:text-3xl font-bold text-white">Best Sellers</h2>
                            </div>
                            <p className="text-silver-500">Most loved by our customers</p>
                        </div>
                        <Link href="/products?sort=bestsellers" className="hidden md:flex items-center gap-1 text-accent-500 font-medium hover:gap-2 transition-all">
                            View All <ChevronRight size={18} />
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {bestSellers.map((product) => (
                            <div key={product.id} className="product-card group">
                                <Link href={`/products/${product.slug}`} className="block">
                                    <div className="relative aspect-square overflow-hidden bg-dark-700">
                                        {product.image ? (
                                            <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-dark-500">
                                                <ShoppingCart size={48} />
                                            </div>
                                        )}
                                        {product.discount_percent > 0 && (
                                            <span className="badge badge-sale absolute top-3 left-3">-{product.discount_percent}%</span>
                                        )}
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                if (isWishlisted(product.id)) {
                                                    removeFromWishlist(product.id);
                                                } else {
                                                    addToWishlist(product);
                                                }
                                            }}
                                            className={`absolute top-3 right-3 w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-colors opacity-0 group-hover:opacity-100 ${isWishlisted(product.id)
                                                ? 'bg-red-500 text-white'
                                                : 'bg-dark-800 text-silver-300 hover:bg-accent-500 hover:text-dark-900'
                                                }`}>
                                            <Heart size={18} className={isWishlisted(product.id) ? 'fill-current' : ''} />
                                        </button>
                                    </div>
                                    <div className="p-4">
                                        <span className="text-xs text-accent-500 font-medium bg-accent-500/10 px-2 py-1 rounded-full">
                                            {product.category?.name || 'Uncategorized'}
                                        </span>
                                        <h3 className="font-semibold text-white line-clamp-2 hover:text-accent-500 transition-colors mt-2">
                                            {product.name}
                                        </h3>
                                        <p className="text-xs text-accent-500 font-medium mt-1 flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 bg-accent-500 rounded-full"></span>
                                            Fulfilled by VorionMart
                                        </p>
                                        <div className="flex items-center gap-2 mt-3">
                                            <span className="text-xl font-bold text-white">
                                                ₹{product.current_price.toLocaleString()}
                                            </span>
                                            {product.price && product.price > product.current_price && (
                                                <span className="text-sm text-silver-500 line-through">
                                                    ₹{product.price.toLocaleString()}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ========================================
                NEW ARRIVALS
            ======================================== */}
            <section className="py-16 bg-dark-900">
                <div className="container mx-auto px-4">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Package className="text-accent-500" size={24} />
                                <h2 className="font-display text-2xl md:text-3xl font-bold text-white">New Arrivals</h2>
                            </div>
                            <p className="text-silver-500">Fresh products just for you</p>
                        </div>
                        <Link href="/products?sort=newest" className="hidden md:flex items-center gap-1 text-accent-500 font-medium hover:gap-2 transition-all">
                            View All <ChevronRight size={18} />
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {newArrivals.map((product) => (
                            <div key={product.id} className="product-card group">
                                <Link href={`/products/${product.slug}`} className="block">
                                    <div className="relative aspect-square overflow-hidden bg-dark-700">
                                        {product.image ? (
                                            <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-dark-500">
                                                <ShoppingCart size={48} />
                                            </div>
                                        )}
                                        <span className="badge badge-new absolute top-3 left-3">NEW</span>
                                        {product.discount_percent > 0 && (
                                            <span className="badge badge-sale absolute top-3 left-3 mt-10">-{product.discount_percent}%</span>
                                        )}
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                if (isWishlisted(product.id)) {
                                                    removeFromWishlist(product.id);
                                                } else {
                                                    addToWishlist(product);
                                                }
                                            }}
                                            className={`absolute top-3 right-3 w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-colors opacity-0 group-hover:opacity-100 ${isWishlisted(product.id)
                                                ? 'bg-red-500 text-white'
                                                : 'bg-dark-800 text-silver-300 hover:bg-accent-500 hover:text-dark-900'
                                                }`}>
                                            <Heart size={18} className={isWishlisted(product.id) ? 'fill-current' : ''} />
                                        </button>
                                    </div>
                                    <div className="p-4">
                                        <span className="text-xs text-accent-500 font-medium bg-accent-500/10 px-2 py-1 rounded-full">
                                            {product.category?.name || 'Uncategorized'}
                                        </span>
                                        <h3 className="font-semibold text-white line-clamp-2 hover:text-accent-500 transition-colors mt-2">
                                            {product.name}
                                        </h3>
                                        <p className="text-xs text-accent-500 font-medium mt-1 flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 bg-accent-500 rounded-full"></span>
                                            Fulfilled by VorionMart
                                        </p>
                                        <div className="flex items-center gap-2 mt-3">
                                            <span className="text-xl font-bold text-white">
                                                ₹{product.current_price.toLocaleString()}
                                            </span>
                                            {product.sale_price && (
                                                <span className="text-sm text-silver-500 line-through">
                                                    ₹{product.price.toLocaleString()}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ========================================
                DEALS OF THE DAY
            ======================================== */}
            <section className="py-16 bg-dark-800">
                <div className="container mx-auto px-4">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Zap className="text-accent-500" size={24} />
                                <h2 className="font-display text-2xl md:text-3xl font-bold text-white">Deals of the Day</h2>
                            </div>
                            <p className="text-silver-500">⏰ Limited time offers - Up to 50% OFF!</p>
                        </div>
                        <Link href="/products?deals=true" className="hidden md:flex items-center gap-1 text-accent-500 font-medium hover:gap-2 transition-all">
                            View All <ChevronRight size={18} />
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {dealsOfTheDay.map((product) => (
                            <div key={product.id} className="product-card group relative">
                                <div className="absolute top-2 left-2 z-10 bg-gradient-to-r from-red-500 to-pink-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg animate-pulse">
                                    50% OFF
                                </div>
                                <Link href={`/products/${product.slug}`} className="block">
                                    <div className="relative aspect-square overflow-hidden bg-dark-700">
                                        {product.image ? (
                                            <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-dark-500">
                                                <ShoppingCart size={48} />
                                            </div>
                                        )}
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                if (isWishlisted(product.id)) {
                                                    removeFromWishlist(product.id);
                                                } else {
                                                    addToWishlist(product);
                                                }
                                            }}
                                            className={`absolute top-3 right-3 w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-colors opacity-0 group-hover:opacity-100 ${isWishlisted(product.id)
                                                ? 'bg-red-500 text-white'
                                                : 'bg-dark-800 text-silver-300 hover:bg-accent-500 hover:text-dark-900'
                                                }`}>
                                            <Heart size={18} className={isWishlisted(product.id) ? 'fill-current' : ''} />
                                        </button>
                                    </div>
                                    <div className="p-4">
                                        <span className="text-xs text-accent-500 font-medium bg-accent-500/10 px-2 py-1 rounded-full">
                                            {product.category?.name || 'Uncategorized'}
                                        </span>
                                        <h3 className="font-semibold text-white line-clamp-2 hover:text-accent-500 transition-colors mt-2">
                                            {product.name}
                                        </h3>
                                        <p className="text-xs text-accent-500 font-medium mt-1 flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 bg-accent-500 rounded-full"></span>
                                            Fulfilled by VorionMart
                                        </p>
                                        <div className="flex items-center gap-2 mt-3">
                                            <span className="text-xl font-bold text-white">
                                                ₹{(product.current_price || 0).toLocaleString()}
                                            </span>
                                            {product.price && (
                                                <span className="text-sm text-silver-500 line-through">
                                                    ₹{product.price.toLocaleString()}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ========================================
                SUGGESTED FOR YOU
            ======================================== */}
            <section className="py-16 bg-dark-900">
                <div className="container mx-auto px-4">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Star className="text-accent-500" size={24} />
                                <h2 className="font-display text-2xl md:text-3xl font-bold text-white">Suggested for You</h2>
                            </div>
                            <p className="text-silver-500">Personalized picks based on your interests</p>
                        </div>
                        <Link href="/products?suggested=true" className="hidden md:flex items-center gap-1 text-accent-500 font-medium hover:gap-2 transition-all">
                            View All <ChevronRight size={18} />
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {suggestedProducts.map((product) => (
                            <div key={product.id} className="product-card group">
                                <Link href={`/products/${product.slug}`} className="block">
                                    <div className="relative aspect-square overflow-hidden bg-dark-700">
                                        {product.image ? (
                                            <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-dark-500">
                                                <ShoppingCart size={48} />
                                            </div>
                                        )}
                                        {product.discount_percent > 0 && (
                                            <span className="badge badge-sale absolute top-3 left-3">-{product.discount_percent}%</span>
                                        )}
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                if (isWishlisted(product.id)) {
                                                    removeFromWishlist(product.id);
                                                } else {
                                                    addToWishlist(product);
                                                }
                                            }}
                                            className={`absolute top-3 right-3 w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-colors opacity-0 group-hover:opacity-100 ${isWishlisted(product.id)
                                                ? 'bg-red-500 text-white'
                                                : 'bg-dark-800 text-silver-300 hover:bg-accent-500 hover:text-dark-900'
                                                }`}>
                                            <Heart size={18} className={isWishlisted(product.id) ? 'fill-current' : ''} />
                                        </button>
                                    </div>
                                    <div className="p-4">
                                        <span className="text-xs text-accent-500 font-medium bg-accent-500/10 px-2 py-1 rounded-full">
                                            {product.category?.name || 'Uncategorized'}
                                        </span>
                                        <h3 className="font-semibold text-white line-clamp-2 hover:text-accent-500 transition-colors mt-2">
                                            {product.name}
                                        </h3>
                                        <p className="text-xs text-accent-500 font-medium mt-1 flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 bg-accent-500 rounded-full"></span>
                                            Fulfilled by VorionMart
                                        </p>
                                        <div className="flex items-center gap-2 mt-3">
                                            <span className="text-xl font-bold text-white">
                                                ₹{product.current_price.toLocaleString()}
                                            </span>
                                            {product.price && product.price > product.current_price && (
                                                <span className="text-sm text-silver-500 line-through">
                                                    ₹{product.price.toLocaleString()}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ========================================
                CUSTOMER TESTIMONIALS
            ======================================== */}
            <section className="py-16 bg-dark-800">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="font-display text-2xl md:text-3xl font-bold text-white mb-2">What Our Customers Say</h2>
                        <p className="text-silver-500">Real experiences from real people</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {testimonials.map((testimonial) => (
                            <div key={testimonial.id} className="bg-dark-700 border border-dark-600 rounded-2xl p-6 hover:border-accent-500/30 transition-colors">
                                <div className="flex items-center gap-1 mb-4">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Star key={star} size={18} className={star <= testimonial.rating ? 'fill-amber-400 text-amber-400' : 'text-dark-500'} />
                                    ))}
                                </div>
                                <p className="text-silver-300 mb-4 leading-relaxed">&ldquo;{testimonial.review}&rdquo;</p>
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-gradient-to-br from-accent-500 to-primary-600 rounded-full flex items-center justify-center text-dark-900 font-bold text-lg">
                                        {testimonial.name.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-semibold text-white">{testimonial.name}</h4>
                                            {testimonial.verified && (
                                                <span className="text-xs bg-accent-500/10 text-accent-500 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                                                    <CheckCircle size={10} /> Verified
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-silver-500">{testimonial.date}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ========================================
                WHY CHOOSE US - Stats (Moved Up)
            ======================================== */}
            {/* ========================================
                ABOUT VORIONMART
            ======================================== */}
            <section className="py-16 bg-dark-800 border-t border-dark-700">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                        <div className="relative">
                            <div className="absolute -top-10 -left-10 w-40 h-40 bg-accent-500/10 rounded-full blur-3xl" />
                            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary-600/10 rounded-full blur-3xl" />

                            <div className="relative z-10 bg-dark-700 rounded-3xl p-8 border border-dark-600 shadow-xl overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-br from-accent-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-dark-800 p-4 rounded-2xl border border-dark-600">
                                        <Award className="text-accent-500 mb-2" size={32} />
                                        <p className="text-2xl font-bold text-white">#1</p>
                                        <p className="text-sm text-silver-500">Trusted Store</p>
                                    </div>
                                    <div className="bg-dark-800 p-4 rounded-2xl border border-dark-600">
                                        <Shield className="text-primary-500 mb-2" size={32} />
                                        <p className="text-2xl font-bold text-white">100%</p>
                                        <p className="text-sm text-silver-500">Secure COD</p>
                                    </div>
                                    <div className="bg-dark-800 p-4 rounded-2xl border border-dark-600">
                                        <User className="text-green-500 mb-2" size={32} />
                                        <p className="text-2xl font-bold text-white">50k+</p>
                                        <p className="text-sm text-silver-500">Users</p>
                                    </div>
                                    <div className="bg-dark-800 p-4 rounded-2xl border border-dark-600">
                                        <Star className="text-amber-500 mb-2" size={32} />
                                        <p className="text-2xl font-bold text-white">4.8</p>
                                        <p className="text-sm text-silver-500">Rating</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <span className="text-accent-500 font-bold tracking-wider text-sm uppercase mb-2 block">Our Story</span>
                            <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-6">
                                Redefining Your <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-accent-400">Shopping Experience</span>
                            </h2>
                            <p className="text-silver-300 text-lg mb-6 leading-relaxed">
                                VorionMart is India's premier D2C marketplace designed for the modern shopper. We connect you directly with verified sellers offering premium quality products across multiple categories.
                            </p>
                            <p className="text-silver-400 mb-8 leading-relaxed">
                                Our mission is simple: To provide a seamless, secure, and delightful shopping experience with our "COD Only" model, ensuring trust and satisfaction with every order.
                            </p>

                            <div className="flex flex-wrap gap-4">
                                <Link href="/products" className="btn-primary inline-flex items-center gap-2">
                                    Start Shopping <ArrowRight size={20} />
                                </Link>
                                <Link href="/contact" className="px-6 py-3 rounded-xl border border-dark-500 text-white font-medium hover:bg-dark-700 transition-colors">
                                    Contact Us
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>


            {/* ========================================
                WHY CHOOSE US - Stats
            ======================================== */}
            <section className="py-16 bg-dark-900">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="font-display text-2xl md:text-3xl font-bold text-white mb-2">Why Choose VorionMart?</h2>
                        <p className="text-silver-500">Your trusted premium marketplace</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <div className="text-center group">
                            <div className="w-20 h-20 bg-gradient-to-br from-accent-500/20 to-accent-500/5 border border-accent-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:border-accent-500 transition-all">
                                <Award className="text-accent-500" size={36} />
                            </div>
                            <h3 className="text-4xl font-bold text-white mb-2">500+</h3>
                            <p className="text-silver-300 font-medium">Verified Sellers</p>
                            <p className="text-sm text-silver-500 mt-1">Quality assured</p>
                        </div>
                        <div className="text-center group">
                            <div className="w-20 h-20 bg-gradient-to-br from-accent-500/20 to-accent-500/5 border border-accent-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:border-accent-500 transition-all">
                                <Package className="text-accent-500" size={36} />
                            </div>
                            <h3 className="text-4xl font-bold text-white mb-2">10,000+</h3>
                            <p className="text-silver-300 font-medium">Products</p>
                            <p className="text-sm text-silver-500 mt-1">Premium selection</p>
                        </div>
                        <div className="text-center group">
                            <div className="w-20 h-20 bg-gradient-to-br from-accent-500/20 to-accent-500/5 border border-accent-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:border-accent-500 transition-all">
                                <Heart className="text-accent-500" size={36} />
                            </div>
                            <h3 className="text-4xl font-bold text-white mb-2">50,000+</h3>
                            <p className="text-silver-300 font-medium">Happy Customers</p>
                            <p className="text-sm text-silver-500 mt-1">5-star reviews</p>
                        </div>
                        <div className="text-center group">
                            <div className="w-20 h-20 bg-gradient-to-br from-accent-500/20 to-accent-500/5 border border-accent-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:border-accent-500 transition-all">
                                <Truck className="text-accent-500" size={36} />
                            </div>
                            <h3 className="text-4xl font-bold text-white mb-2">2-5 Days</h3>
                            <p className="text-silver-300 font-medium">Fast Delivery</p>
                            <p className="text-sm text-silver-500 mt-1">Pan-India shipping</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ========================================
                ENQUIRY FORM
            ======================================== */}
            <section className="py-16 bg-dark-800 border-t border-dark-700">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto">
                        <div className="text-center mb-10">
                            <h2 className="font-display text-2xl md:text-3xl font-bold text-white">Have a Question?</h2>
                            <p className="text-silver-500 mt-2">Send us a message and we&apos;ll get back to you shortly.</p>
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
            <div className="bg-accent-500/10 border border-accent-500/30 p-8 rounded-2xl text-center animate-fade-in">
                <div className="w-16 h-16 bg-accent-500/20 text-accent-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle size={32} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Message Sent!</h3>
                <p className="text-silver-400">Thank you for contacting us. We will reply to your email soon.</p>
                <button
                    onClick={() => setStatus('idle')}
                    className="mt-6 px-6 py-2 bg-dark-700 text-accent-500 border border-dark-600 rounded-lg hover:bg-dark-600 transition-colors"
                >
                    Send Another Message
                </button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="bg-dark-700 border border-dark-600 rounded-2xl p-8 md:p-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                    <label className="block text-sm font-medium text-silver-300 mb-2">Your Name</label>
                    <input
                        type="text"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        className="input-field"
                        placeholder="John Doe"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-silver-300 mb-2">Email Address</label>
                    <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className="input-field"
                        placeholder="john@example.com"
                    />
                </div>
            </div>

            <div className="mb-6">
                <label className="block text-sm font-medium text-silver-300 mb-2">Subject</label>
                <input
                    type="text"
                    name="subject"
                    required
                    value={formData.subject}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="How can we help?"
                />
            </div>

            <div className="mb-8">
                <label className="block text-sm font-medium text-silver-300 mb-2">Message</label>
                <textarea
                    name="message"
                    required
                    rows={4}
                    value={formData.message}
                    onChange={handleChange}
                    className="input-field resize-none"
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
