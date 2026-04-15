'use client';

import Link from 'next/link';
import { ArrowRight, Truck, Shield, Clock, Award, ChevronRight, ChevronLeft, Star, ShoppingCart, Heart, Send, CheckCircle, CreditCard, Zap, Package, User, Plus } from 'lucide-react';
import { useState, useEffect } from 'react';
import { API_BASE_URL, BASE_URL } from '@/config/apiConfig';
import { fetchProducts, fetchCategories, fetchBanners } from '@/lib/api';
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

const resolveAssetUrl = (value: string | null | undefined) => {
    if (!value) {
        return null;
    }

    if (/^https?:\/\//i.test(value)) {
        return value;
    }

    return `${BASE_URL}${value.startsWith('/') ? value : `/${value}`}`;
};



export default function HomePage() {
    const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
    const [trendingProducts, setTrendingProducts] = useState<any[]>([]);
    const [bestSellers, setBestSellers] = useState<any[]>([]);
    const [newArrivals, setNewArrivals] = useState<any[]>([]);
    const [dealsOfTheDay, setDealsOfTheDay] = useState<any[]>([]);
    const [suggestedProducts, setSuggestedProducts] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [banners, setBanners] = useState<any[]>([]);
    const [currentOfferIndex, setCurrentOfferIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const { addToWishlist, removeFromWishlist, isWishlisted } = useCustomerAuth();

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);

                // Fetch products and categories in parallel
                const [productsResponse, categoriesResponse, bannersResponse] = await Promise.all([
                    fetchProducts(),
                    fetchCategories(),
                    fetchBanners(),
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
                    image: resolveAssetUrl(cat.image)
                }));
                setCategories(formattedCategories.slice(0, 12)); // Show up to 12 categories

                const bannerList = Array.isArray(bannersResponse) ? bannersResponse : (bannersResponse.results || []);
                setBanners(bannerList);

                // Filter and set different product sections
                // Featured products - products marked as featured
                const featured = allProducts.filter((p: any) => p.is_featured).slice(0, 10);
                setFeaturedProducts(featured.length > 0 ? featured : allProducts.slice(0, 10));

                // Trending - products with high discount
                const trending = allProducts.filter((p: any) => p.discount_percent > 20).slice(0, 10);
                setTrendingProducts(trending.length > 0 ? trending : allProducts.slice(0, 10));

                // Best Sellers - first 10 products
                setBestSellers(allProducts.slice(0, 10));

                // New Arrivals - last 10 products (newest)
                setNewArrivals(allProducts.slice(-10).reverse());

                // Deals of the Day - products with highest discount
                const deals = [...allProducts].sort((a: any, b: any) => b.discount_percent - a.discount_percent).slice(0, 10);
                setDealsOfTheDay(deals);

                // Suggested - random selection
                const shuffled = [...allProducts].sort(() => 0.5 - Math.random());
                setSuggestedProducts(shuffled.slice(0, 10));

            } catch (error) {
                console.error('Error loading data:', error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    const homeOfferBanners = banners.filter(
        (banner) => banner.is_active && (banner.section === 'home_hero' || banner.section === 'general')
    );
    const heroCarouselOffers = [
        {
            id: 'local-banner-1',
            image: '/banner1.png',
            link: '/products',
            title: 'Banner 1',
        },
        {
            id: 'local-banner-2',
            image: '/banner2.png',
            link: '/products',
            title: 'Banner 2',
        },
        {
            id: 'local-banner-3',
            image: '/banner3.png',
            link: '/products',
            title: 'Banner 3',
        },
        {
            id: 'local-banner-4',
            image: '/banner4.png',
            link: '/products',
            title: 'Banner 4',
        },
        ...homeOfferBanners.slice(0, 4),
    ];

    useEffect(() => {
        if (currentOfferIndex > heroCarouselOffers.length - 1) {
            setCurrentOfferIndex(0);
        }
    }, [currentOfferIndex, heroCarouselOffers.length]);

    useEffect(() => {
        if (heroCarouselOffers.length <= 1) {
            return;
        }

        const intervalId = window.setInterval(() => {
            setCurrentOfferIndex((current) =>
                current === heroCarouselOffers.length - 1 ? 0 : current + 1
            );
        }, 5000);

        return () => window.clearInterval(intervalId);
    }, [heroCarouselOffers.length]);

    const showPreviousOffer = () => {
        setCurrentOfferIndex((current) =>
            current === 0 ? heroCarouselOffers.length - 1 : current - 1
        );
    };

    const showNextOffer = () => {
        setCurrentOfferIndex((current) =>
            current === heroCarouselOffers.length - 1 ? 0 : current + 1
        );
    };

    return (
        <div className="min-h-screen bg-white">
            {/* ========================================
                HERO SECTION - VorionMart Identity
            ======================================== */}
            <section className="hidden relative hero-gradient overflow-hidden">
                {/* Background Effects */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute top-1/4 -right-20 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl" />
                    <div className="absolute bottom-1/4 -left-20 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-accent-500/5 to-transparent rounded-full" />
                </div>

                <div className="container mx-auto px-4 py-20 md:py-32 relative z-10">
                    <div className="max-w-4xl mx-auto text-center">
                        {/* Badge */}
                        <div data-aos="fade-down" data-aos-delay="100" className="inline-flex items-center gap-2 bg-slate-100/80 border border-slate-200 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium mb-6">
                            <span className="w-2 h-2 bg-accent-500 rounded-full animate-pulse" />
                            <span className="text-slate-600">💵 Cash on Delivery Available</span>
                        </div>

                        {/* Main Heading */}
                        <h1 data-aos="fade-up" data-aos-delay="200" className="font-display text-4xl md:text-6xl lg:text-7xl font-bold mb-6 text-slate-900">
                            The Future of Shopping.
                            <br />
                            <span className="gradient-text-accent">Delivered.</span>
                        </h1>

                        {/* Subheading */}
                        <p data-aos="fade-up" data-aos-delay="300" className="text-lg md:text-xl text-slate-500 mb-8 max-w-2xl mx-auto">
                            Premium products from verified sellers. Pay when you receive.
                            No risk, no hassle, pure convenience.
                        </p>

                        {/* CTA Buttons */}
                        <div data-aos="fade-up" data-aos-delay="400" className="flex flex-wrap justify-center gap-4">
                            <Link href="/products" className="btn-primary flex items-center gap-2 text-lg px-8 py-4">
                                Shop Now <ArrowRight size={20} />
                            </Link>
                            <Link href="/categories" className="btn-secondary flex items-center gap-2 text-lg px-8 py-4">
                                Browse Categories
                            </Link>
                        </div>

                        {/* Trust Indicators */}
                        <div data-aos="fade-up" data-aos-delay="500" className="flex flex-wrap justify-center gap-6 mt-10 text-slate-500 text-sm">
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



            <section className="relative overflow-hidden bg-white">
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
                </div>

                <div className="relative z-10 w-full py-0">
                    <div
                        data-aos="fade-up"
                        data-aos-delay="120"
                        className="relative overflow-hidden rounded-none"
                    >
                        <div
                            className="flex transition-transform duration-500 ease-out"
                            style={{ transform: `translateX(-${currentOfferIndex * 100}%)` }}
                        >
                            {heroCarouselOffers.map((banner) => (
                                <Link
                                    key={banner.id}
                                    href={banner.link || '/products'}
                                    className="group relative block min-h-[calc(100vh-76px)] min-w-full overflow-hidden rounded-none bg-slate-100"
                                >
                                    <img
                                        src={banner.image}
                                        alt={banner.title}
                                        className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.01]"
                                    />
                                </Link>
                            ))}
                        </div>

                        <div className="pointer-events-none absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-white/35 to-transparent md:w-28" />
                        <div className="pointer-events-none absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-white/35 to-transparent md:w-28" />

                        <button
                            type="button"
                            onClick={showPreviousOffer}
                            className="absolute left-5 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200/90 bg-white/95 text-slate-900 shadow-[0_16px_40px_rgba(15,23,42,0.22)] backdrop-blur-md transition hover:scale-105 hover:bg-white md:left-8 md:h-14 md:w-14"
                            aria-label="Previous offer"
                        >
                            <ChevronLeft size={24} />
                        </button>

                        <button
                            type="button"
                            onClick={showNextOffer}
                            className="absolute right-5 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200/90 bg-white/95 text-slate-900 shadow-[0_16px_40px_rgba(15,23,42,0.22)] backdrop-blur-md transition hover:scale-105 hover:bg-white md:right-8 md:h-14 md:w-14"
                            aria-label="Next offer"
                        >
                            <ChevronRight size={24} />
                        </button>

                        <div className="absolute bottom-5 left-1/2 z-10 flex -translate-x-1/2 gap-2 md:bottom-6">
                            {heroCarouselOffers.map((_, index) => (
                                <button
                                    key={`offer-dot-${index}`}
                                    type="button"
                                    onClick={() => setCurrentOfferIndex(index)}
                                    className={`h-2.5 rounded-full transition-all ${currentOfferIndex === index
                                            ? 'w-8 bg-white shadow-[0_4px_16px_rgba(15,23,42,0.22)]'
                                            : 'w-2.5 bg-white/65'
                                        }`}
                                    aria-label={`Go to offer ${index + 1}`}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <section className="bg-white py-10 border-b border-gray-100">
                <div className="container mx-auto px-4 lg:px-8">
                    {/* Hide scrollbar but allow horizontal scroll */}
                    <div className="overflow-x-auto pb-6 -mx-4 px-4 md:mx-0 md:px-0 hide-scrollbar">
                        <div className="flex min-w-max items-start justify-start md:justify-center gap-6 lg:gap-8">
                            {categories.slice(0, 8).map((category, index) => (
                                <Link
                                    key={category.slug}
                                    href={`/products?category=${category.slug}`}
                                    data-aos="fade-up"
                                    data-aos-delay={index * 50}
                                    className="group flex w-[100px] md:w-[120px] flex-col items-center gap-4 transition-all duration-300"
                                >
                                    {/* Image Container with animated ring */}
                                    <div className="relative p-1 rounded-full bg-transparent transition-all duration-300 group-hover:bg-gradient-to-tr group-hover:from-accent-400 group-hover:to-accent-600">
                                        <div className="flex h-[80px] w-[80px] md:h-[100px] md:w-[100px] items-center justify-center overflow-hidden rounded-full bg-gray-50 border-4 border-white shadow-lg transition-transform duration-500 group-hover:scale-95 group-hover:shadow-accent-500/25">
                                            {category.image ? (
                                                <img
                                                    src={category.image}
                                                    alt={category.name}
                                                    className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
                                                />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center bg-gray-100 text-3xl transition duration-500 group-hover:scale-110">
                                                    {category.icon || category.name.charAt(0)}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Text Content */}
                                    <div className="flex flex-col items-center gap-1">
                                        <span className="text-center text-[13px] md:text-sm font-bold text-gray-800 transition-colors group-hover:text-accent-500 break-words leading-tight max-w-[100px]">
                                            {category.name}
                                        </span>
                                        {/* Optional: Add a subtle underline dot */}
                                        <div className="h-1 w-1 rounded-full bg-transparent transition-all duration-300 group-hover:bg-accent-500 group-hover:w-4" />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>

                <style dangerouslySetInnerHTML={{__html: `
                    .hide-scrollbar::-webkit-scrollbar {
                        display: none;
                    }
                    .hide-scrollbar {
                        -ms-overflow-style: none;
                        scrollbar-width: none;
                    }
                `}} />
            </section>

            {/* ========================================
                TRENDING PRODUCTS
            ======================================== */}
            <section className="relative overflow-hidden bg-white py-16 md:py-24 border-b border-gray-100">
                <div className="container mx-auto px-4 lg:px-8">
                    <div className="relative z-10 mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6" data-aos="fade-up">
                        <div className="max-w-xl">
                            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent-500/20 bg-accent-500/5 px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest text-accent-600">
                                <Zap size={14} className="fill-current" />
                                Trending Now
                            </div>
                            <h2 className="font-display text-3xl font-bold tracking-tight text-gray-900 md:text-5xl">Our Most Popular <span className="text-accent-500">Picks</span></h2>
                            <p className="mt-4 text-base leading-relaxed text-gray-500">Discover what's hot right now. Curated selection of high-demand products with unmatched quality and style.</p>
                        </div>
                        <Link href="/trending" className="group flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-6 py-4 text-sm font-bold text-gray-900 transition-all hover:bg-gray-50 hover:border-gray-300">
                            Explore All Trending <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                        </Link>
                    </div>

                    <div className="relative z-10 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5 lg:gap-8">
                        {trendingProducts.map((product, index) => (
                            <Link
                                key={product.id}
                                href={`/products/${product.slug}`}
                                data-aos="fade-up"
                                data-aos-delay={index * 50}
                                className="product-card group relative bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:border-accent-500/20"
                            >
                                <div className="relative aspect-[4/5] overflow-hidden bg-gray-50">
                                    {product.image ? (
                                        <img src={product.image} alt={product.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center text-gray-200">
                                            <ShoppingCart size={48} />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                    
                                    <div className="absolute left-4 top-4 flex flex-col gap-2">
                                        <div className="rounded-full bg-white/95 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-accent-600 shadow-sm border border-accent-500/10 backdrop-blur-md">
                                            Trending
                                        </div>
                                    </div>

                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            isWishlisted(product.id) ? removeFromWishlist(product.id) : addToWishlist(product);
                                        }}
                                        className={`absolute right-4 top-4 w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all scale-90 group-hover:scale-100 ${isWishlisted(product.id) ? 'bg-red-500 text-white' : 'bg-white text-gray-400 hover:text-accent-500 hover:bg-gray-50 border border-gray-100'}`}
                                    >
                                        <Heart size={18} className={isWishlisted(product.id) ? 'fill-current' : ''} />
                                    </button>
                                </div>
                                
                                <div className="p-6">
                                    <div className="mb-3 flex items-center justify-between gap-2">
                                        <span className="text-[10px] font-bold tracking-widest text-accent-500 uppercase bg-accent-500/5 px-2.5 py-1 rounded-full border border-accent-500/10">
                                            {product.category?.name || 'Curated'}
                                        </span>
                                        <div className="flex items-center gap-1">
                                            <Star size={12} className="fill-amber-400 text-amber-400" />
                                            <span className="text-xs font-bold text-gray-900">4.8</span>
                                        </div>
                                    </div>
                                    <h3 className="mb-4 line-clamp-2 text-base font-bold text-gray-900 group-hover:text-accent-500 transition-colors leading-tight min-h-[2.5rem]">
                                        {product.name}
                                    </h3>
                                    <div className="flex items-baseline justify-between gap-2 pt-4 border-t border-gray-50">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">Sale Price</span>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-lg font-bold text-gray-900">₹{product.current_price.toLocaleString()}</span>
                                                {product.price > product.current_price && (
                                                    <span className="text-xs text-gray-400 line-through">₹{product.price.toLocaleString()}</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="h-10 w-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-accent-500 group-hover:text-white transition-all">
                                            <ShoppingCart size={18} />
                                        </div>
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
            <section className="py-24 bg-gray-50/50">
                <div className="container mx-auto px-4 lg:px-8">
                    <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6" data-aos="fade-up">
                        <div className="text-center md:text-left">
                            <h2 className="font-display text-3xl md:text-4xl font-bold text-gray-900 mb-2">Editor's <span className="text-accent-500">Choice</span></h2>
                            <p className="text-gray-500 text-lg">Handpicked premium products for your lifestyle.</p>
                        </div>
                        <Link href="/trending" className="group flex items-center gap-2 text-accent-500 font-bold text-sm bg-accent-500/5 px-6 py-3 rounded-2xl hover:bg-accent-500/10 transition-all">
                            View Collections <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                        </Link>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 lg:gap-8">
                        {featuredProducts.map((product, index) => (
                            <Link key={product.id} href={`/products/${product.slug}`} className="product-card group relative bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl" data-aos="fade-up" data-aos-delay={index * 50}>
                                {/* Image Container */}
                                <div className="relative aspect-[4/5] overflow-hidden bg-gray-50">
                                    {product.image ? (
                                        <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-200">
                                            <ShoppingCart size={48} />
                                        </div>
                                    )}

                                    {/* Badges */}
                                    <div className="absolute top-4 left-4">
                                        <span className="rounded-full bg-gray-900/90 backdrop-blur-md px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest text-white shadow-sm">Featured</span>
                                    </div>

                                    {/* Wishlist */}
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            isWishlisted(product.id) ? removeFromWishlist(product.id) : addToWishlist(product);
                                        }}
                                        className={`absolute right-4 top-4 w-9 h-9 rounded-full flex items-center justify-center shadow-lg transition-all scale-90 group-hover:scale-100 ${isWishlisted(product.id) ? 'bg-red-500 text-white' : 'bg-white/80 backdrop-blur-sm text-gray-400 hover:text-red-500 hover:bg-white'}`}>
                                        <Heart size={16} className={isWishlisted(product.id) ? 'fill-current' : ''} />
                                    </button>
                                </div>

                                {/* Content */}
                                <div className="p-6">
                                    <span className="text-[10px] font-bold tracking-widest text-accent-500 uppercase mb-2 block">
                                        {product.category?.name || 'Exclusive'}
                                    </span>
                                    <h3 className="font-bold text-gray-900 text-base leading-tight mb-4 line-clamp-2 min-h-[2.5rem]">
                                        {product.name}
                                    </h3>
                                    
                                    <div className="flex items-center justify-between border-t border-gray-50 pt-4">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-gray-900">₹{product.current_price.toLocaleString()}</span>
                                            {product.price > product.current_price && (
                                                <span className="text-[10px] text-gray-400 line-through">₹{product.price.toLocaleString()}</span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1 text-[10px] font-bold text-amber-500">
                                            <Star size={10} className="fill-current" />
                                            <span>4.9</span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* ========================================
                BEST SELLERS
            ======================================== */}
            <section className="py-24 bg-white">
                <div className="container mx-auto px-4 lg:px-8">
                    <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6" data-aos="fade-up">
                        <div className="max-w-xl">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2.5 bg-accent-500/10 rounded-xl text-accent-600">
                                    <Award size={26} />
                                </div>
                                <h2 className="font-display text-3xl md:text-5xl font-bold text-gray-900 leading-tight">Best <span className="text-accent-500">Sellers</span></h2>
                            </div>
                            <p className="text-gray-500 text-lg">Top-rated products that our community is absolutely obsessed with.</p>
                        </div>
                        <Link href="/products?sort=bestsellers" className="group flex items-center gap-2 px-8 py-4 bg-gray-900 text-white rounded-2xl font-bold text-sm hover:bg-gray-800 transition-all shadow-xl shadow-gray-200">
                            See Top Rated <ChevronRight size={18} className="transition-transform group-hover:translate-x-1" />
                        </Link>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 lg:gap-8">
                        {bestSellers.map((product, index) => (
                            <Link key={product.id} href={`/products/${product.slug}`} className="product-card group relative bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl" data-aos="fade-up" data-aos-delay={index * 50}>
                                <div className="relative aspect-[4/5] overflow-hidden bg-gray-50">
                                    {product.image ? (
                                        <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-200">
                                            <ShoppingCart size={48} />
                                        </div>
                                    )}
                                    {product.discount_percent > 0 && (
                                        <div className="absolute top-4 left-4 bg-red-500 text-white px-2.5 py-1 rounded-full text-[10px] font-bold shadow-lg">
                                            -{product.discount_percent}%
                                        </div>
                                    )}
                                </div>
                                <div className="p-6">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-[10px] font-bold text-accent-500 uppercase tracking-widest">{product.category?.name || 'Essentials'}</span>
                                        <div className="flex items-center gap-1">
                                            <Star size={10} className="fill-amber-400 text-amber-400" />
                                            <span className="text-[10px] font-bold text-gray-600">4.9</span>
                                        </div>
                                    </div>
                                    <h3 className="font-bold text-gray-900 text-base leading-snug line-clamp-2 transition-colors group-hover:text-accent-500 mb-4 min-h-[2.5rem]">
                                        {product.name}
                                    </h3>
                                    <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                        <span className="text-lg font-bold text-gray-900">₹{product.current_price.toLocaleString()}</span>
                                        <div className="h-8 w-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 scale-90 group-hover:scale-100 group-hover:bg-accent-500 group-hover:text-white transition-all">
                                            <Plus size={16} />
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* ========================================
                NEW ARRIVALS
            ======================================== */}
            <section className="py-16 bg-white">
                <div className="container mx-auto px-4">
                    <div className="flex justify-between items-center mb-8" data-aos="fade-up">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Package className="text-accent-500" size={24} />
                                <h2 className="font-display text-2xl md:text-3xl font-bold text-slate-900">New Arrivals</h2>
                            </div>
                            <p className="text-slate-500">Fresh products just for you</p>
                        </div>
                        <Link href="/new-arrivals" className="hidden md:flex items-center gap-1 text-accent-500 font-medium hover:gap-2 transition-all">
                            View All <ChevronRight size={18} />
                        </Link>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                        {newArrivals.map((product, index) => (
                            <div key={product.id} className="product-card group" data-aos="fade-up" data-aos-delay={index * 100}>
                                <Link href={`/products/${product.slug}`} className="block">
                                    <div className="relative aspect-square overflow-hidden bg-slate-100">
                                        {product.image ? (
                                            <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-300">
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
                                                : 'bg-white text-slate-500 hover:bg-accent-500 hover:text-white'
                                                }`}>
                                            <Heart size={18} className={isWishlisted(product.id) ? 'fill-current' : ''} />
                                        </button>
                                    </div>
                                    <div className="p-4">
                                        <span className="text-xs text-accent-500 font-medium bg-accent-500/10 px-2 py-1 rounded-full">
                                            {product.category?.name || 'Uncategorized'}
                                        </span>
                                        <h3 className="font-semibold text-slate-900 line-clamp-2 hover:text-accent-500 transition-colors mt-2">
                                            {product.name}
                                        </h3>
                                        <p className="text-xs text-accent-500 font-medium mt-1 flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 bg-accent-500 rounded-full"></span>
                                            Fulfilled by VorionMart
                                        </p>
                                        <div className="flex items-center gap-2 mt-3">
                                            <span className="text-xl font-bold text-slate-900">
                                                ₹{product.current_price.toLocaleString()}
                                            </span>
                                            {product.sale_price && (
                                                <span className="text-sm text-slate-400 line-through">
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
            <section className="py-24 bg-red-50/30 overflow-hidden relative border-y border-red-100/50">
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-red-500/5 rounded-full blur-[100px] -mr-48 -mt-48" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent-500/5 rounded-full blur-[100px] -ml-48 -mb-48" />

                <div className="container mx-auto px-4 lg:px-8 relative z-10">
                    <div className="flex flex-col md:flex-row justify-between items-center mb-16 gap-8" data-aos="fade-up">
                        <div className="text-center md:text-left">
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-full text-red-600 text-[10px] font-bold uppercase tracking-widest mb-6 animate-pulse">
                                <Clock size={14} />
                                Flash Sale Ending Soon
                            </div>
                            <h2 className="font-display text-4xl md:text-6xl font-bold mb-4 text-gray-900">Deals of the <span className="text-red-500">Day</span></h2>
                            <p className="text-gray-500 text-lg max-w-2xl">Premium collections at unbeatable prices. Limited time offers updated every 24 hours.</p>
                        </div>
                        <div className="flex items-center gap-4 bg-white shadow-xl shadow-red-500/10 border border-red-100 p-6 rounded-3xl">
                            <div className="text-center">
                                <div className="text-3xl font-bold text-red-600">22</div>
                                <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">HRS</div>
                            </div>
                            <div className="text-xl font-bold text-gray-200">:</div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-red-600">45</div>
                                <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">MINS</div>
                            </div>
                            <div className="text-xl font-bold text-gray-200">:</div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-red-600">12</div>
                                <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">SECS</div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 lg:gap-8">
                        {dealsOfTheDay.map((product, index) => (
                            <Link key={product.id} href={`/products/${product.slug}`} className="product-card group relative bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:border-red-200" data-aos="fade-up" data-aos-delay={index * 50}>
                                <div className="absolute top-4 left-4 z-20 bg-red-600 text-white px-3 py-1.5 rounded-full text-[10px] font-bold shadow-lg">
                                    -{product.discount_percent || 50}%
                                </div>
                                <div className="relative aspect-[4/5] overflow-hidden bg-gray-50">
                                    {product.image ? (
                                        <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-200">
                                            <ShoppingCart size={48} />
                                        </div>
                                    )}
                                    <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/60 to-transparent flex justify-center opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0">
                                        <div className="w-full py-2 bg-red-600 text-white text-center rounded-xl text-[10px] font-bold shadow-lg uppercase tracking-wider">Grab Deal Now</div>
                                    </div>
                                </div>
                                <div className="p-6">
                                    <h3 className="font-bold text-gray-900 text-base leading-tight line-clamp-2 min-h-[2.5rem] mb-4 group-hover:text-red-600 transition-colors">
                                        {product.name}
                                    </h3>
                                    <div className="flex items-center gap-3 mb-4">
                                        <span className="text-xl font-bold text-red-600">₹{product.current_price.toLocaleString()}</span>
                                        {product.price > product.current_price && (
                                            <span className="text-xs text-gray-400 line-through font-medium">₹{product.price.toLocaleString()}</span>
                                        )}
                                    </div>
                                    <div className="mt-4 w-full bg-gray-100 h-1 rounded-full overflow-hidden">
                                        <div className="h-full bg-red-500 w-[75%]" />
                                    </div>
                                    <div className="flex justify-between mt-2">
                                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Limited Stock</span>
                                        <span className="text-[9px] font-bold text-red-500 uppercase tracking-widest">Ending Soon</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* ========================================
                SUGGESTED FOR YOU
            ======================================== */}
            <section className="py-24 bg-white border-t border-gray-100">
                <div className="container mx-auto px-4 lg:px-8">
                    <div className="mb-12 flex items-center justify-between" data-aos="fade-up">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-accent-500/10 flex items-center justify-center text-accent-600">
                                <Heart size={24} className="fill-current" />
                            </div>
                            <h2 className="font-display text-2xl md:text-3xl font-bold text-gray-900">Suggested For <span className="text-accent-500">You</span></h2>
                        </div>
                        <p className="hidden md:block text-gray-500 font-medium italic">Based on your interests</p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 lg:gap-8">
                        {suggestedProducts.map((product, index) => (
                            <Link key={product.id} href={`/products/${product.slug}`} className="product-card group relative bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:border-accent-500/20" data-aos="fade-up" data-aos-delay={index * 50}>
                                <div className="relative aspect-[4/5] overflow-hidden bg-gray-50">
                                    {product.image ? (
                                        <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-200">
                                            <ShoppingCart size={48} />
                                        </div>
                                    )}
                                    {product.discount_percent > 0 && (
                                        <span className="absolute top-4 left-4 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-md">-{product.discount_percent}%</span>
                                    )}
                                </div>
                                <div className="p-6">
                                    <h3 className="font-bold text-gray-900 text-base leading-tight mb-4 line-clamp-2 min-h-[2.5rem] group-hover:text-accent-500 transition-colors">
                                        {product.name}
                                    </h3>
                                    <div className="flex items-center justify-between border-t border-gray-50 pt-4">
                                        <span className="text-lg font-bold text-gray-900">₹{product.current_price.toLocaleString()}</span>
                                        <div className="h-9 w-9 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-accent-500 group-hover:text-white transition-all">
                                            <ShoppingCart size={16} />
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* ========================================
                CUSTOMER TESTIMONIALS
            ======================================== */}
            <section className="py-16 bg-gray-50">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12" data-aos="fade-up">
                        <h2 className="font-display text-2xl md:text-3xl font-bold text-slate-900 mb-2">What Our Customers Say</h2>
                        <p className="text-slate-500">Real experiences from real people</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {testimonials.map((testimonial, index) => (
                            <div key={testimonial.id} className="bg-white border border-slate-200 rounded-2xl p-6 hover:border-accent-500/30 transition-colors shadow-sm" data-aos="fade-up" data-aos-delay={index * 100}>
                                <div className="flex items-center gap-1 mb-4">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Star key={star} size={18} className={star <= testimonial.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'} />
                                    ))}
                                </div>
                                <p className="text-slate-600 mb-4 leading-relaxed">&ldquo;{testimonial.review}&rdquo;</p>
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-gradient-to-br from-accent-500 to-primary-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                        {testimonial.name.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-semibold text-slate-900">{testimonial.name}</h4>
                                            {testimonial.verified && (
                                                <span className="text-xs bg-accent-500/10 text-accent-500 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                                                    <CheckCircle size={10} /> Verified
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-slate-500">{testimonial.date}</p>
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
            <section className="py-16 bg-white border-t border-slate-200">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                        <div className="relative" data-aos="fade-right">
                            <div className="absolute -top-10 -left-10 w-40 h-40 bg-accent-500/10 rounded-full blur-3xl" />
                            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary-600/10 rounded-full blur-3xl" />

                            <div className="relative z-10 bg-slate-50 rounded-3xl p-8 border border-slate-200 shadow-xl overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-br from-accent-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white p-4 rounded-2xl border border-slate-200">
                                        <Award className="text-accent-500 mb-2" size={32} />
                                        <p className="text-2xl font-bold text-slate-900">#1</p>
                                        <p className="text-sm text-slate-500">Trusted Store</p>
                                    </div>
                                    <div className="bg-white p-4 rounded-2xl border border-slate-200">
                                        <Shield className="text-primary-500 mb-2" size={32} />
                                        <p className="text-2xl font-bold text-slate-900">100%</p>
                                        <p className="text-sm text-slate-500">Secure COD</p>
                                    </div>
                                    <div className="bg-white p-4 rounded-2xl border border-slate-200">
                                        <User className="text-green-500 mb-2" size={32} />
                                        <p className="text-2xl font-bold text-slate-900">50k+</p>
                                        <p className="text-sm text-slate-500">Users</p>
                                    </div>
                                    <div className="bg-white p-4 rounded-2xl border border-slate-200">
                                        <Star className="text-amber-500 mb-2" size={32} />
                                        <p className="text-2xl font-bold text-slate-900">4.8</p>
                                        <p className="text-sm text-slate-500">Rating</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div data-aos="fade-left">
                            <span className="text-accent-500 font-bold tracking-wider text-sm uppercase mb-2 block">Our Story</span>
                            <h2 className="font-display text-3xl md:text-4xl font-bold text-slate-900 mb-6">
                                Redefining Your <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-accent-400">Shopping Experience</span>
                            </h2>
                            <p className="text-slate-600 text-lg mb-6 leading-relaxed">
                                VorionMart is India's premier D2C marketplace designed for the modern shopper. We connect you directly with verified sellers offering premium quality products across multiple categories.
                            </p>
                            <p className="text-slate-500 mb-8 leading-relaxed">
                                Our mission is simple: To provide a seamless, secure, and delightful shopping experience with our "COD Only" model, ensuring trust and satisfaction with every order.
                            </p>

                            <div className="flex flex-wrap gap-4">
                                <Link href="/products" className="btn-primary inline-flex items-center gap-2">
                                    Start Shopping <ArrowRight size={20} />
                                </Link>
                                <Link href="/contact" className="px-6 py-3 rounded-xl border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-colors">
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
            <section className="py-16 bg-gray-50">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12" data-aos="fade-up">
                        <h2 className="font-display text-2xl md:text-3xl font-bold text-slate-900 mb-2">Why Choose VorionMart?</h2>
                        <p className="text-slate-500">Your trusted premium marketplace</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <div className="text-center group" data-aos="fade-up" data-aos-delay="0">
                            <div className="w-20 h-20 bg-gradient-to-br from-accent-500/20 to-accent-500/5 border border-accent-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:border-accent-500 transition-all">
                                <Award className="text-accent-500" size={36} />
                            </div>
                            <h3 className="text-4xl font-bold text-slate-900 mb-2">500+</h3>
                            <p className="text-slate-600 font-medium">Verified Sellers</p>
                            <p className="text-sm text-slate-500 mt-1">Quality assured</p>
                        </div>
                        <div className="text-center group" data-aos="fade-up" data-aos-delay="100">
                            <div className="w-20 h-20 bg-gradient-to-br from-accent-500/20 to-accent-500/5 border border-accent-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:border-accent-500 transition-all">
                                <Package className="text-accent-500" size={36} />
                            </div>
                            <h3 className="text-4xl font-bold text-slate-900 mb-2">10,000+</h3>
                            <p className="text-slate-600 font-medium">Products</p>
                            <p className="text-sm text-slate-500 mt-1">Premium selection</p>
                        </div>
                        <div className="text-center group" data-aos="fade-up" data-aos-delay="200">
                            <div className="w-20 h-20 bg-gradient-to-br from-accent-500/20 to-accent-500/5 border border-accent-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:border-accent-500 transition-all">
                                <Heart className="text-accent-500" size={36} />
                            </div>
                            <h3 className="text-4xl font-bold text-slate-900 mb-2">50,000+</h3>
                            <p className="text-slate-600 font-medium">Happy Customers</p>
                            <p className="text-sm text-slate-500 mt-1">5-star reviews</p>
                        </div>
                        <div className="text-center group" data-aos="fade-up" data-aos-delay="300">
                            <div className="w-20 h-20 bg-gradient-to-br from-accent-500/20 to-accent-500/5 border border-accent-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:border-accent-500 transition-all">
                                <Truck className="text-accent-500" size={36} />
                            </div>
                            <h3 className="text-4xl font-bold text-slate-900 mb-2">2-5 Days</h3>
                            <p className="text-slate-600 font-medium">Fast Delivery</p>
                            <p className="text-sm text-slate-500 mt-1">Pan-India shipping</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ========================================
                ENQUIRY FORM
            ======================================== */}
            <section className="py-16 bg-white border-t border-slate-200">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto" data-aos="fade-up">
                        <div className="text-center mb-10">
                            <h2 className="font-display text-2xl md:text-3xl font-bold text-slate-900">Have a Question?</h2>
                            <p className="text-slate-500 mt-2">Send us a message and we&apos;ll get back to you shortly.</p>
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
            <div className="bg-green-50 border border-green-200 p-8 rounded-2xl text-center animate-fade-in">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Message Sent!</h3>
                <p className="text-slate-500">Thank you for contacting us. We will reply to your email soon.</p>
                <button
                    onClick={() => setStatus('idle')}
                    className="mt-6 px-6 py-2 bg-slate-100 text-accent-500 border border-slate-200 rounded-lg hover:bg-slate-200 transition-colors"
                >
                    Send Another Message
                </button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="bg-slate-50 border border-slate-200 rounded-2xl p-8 md:p-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Your Name</label>
                    <input
                        type="text"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent-500/40 focus:border-accent-500 transition-colors"
                        placeholder="John Doe"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
                    <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent-500/40 focus:border-accent-500 transition-colors"
                        placeholder="john@example.com"
                    />
                </div>
            </div>

            <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">Subject</label>
                <input
                    type="text"
                    name="subject"
                    required
                    value={formData.subject}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent-500/40 focus:border-accent-500 transition-colors"
                    placeholder="How can we help?"
                />
            </div>

            <div className="mb-8">
                <label className="block text-sm font-medium text-slate-700 mb-2">Message</label>
                <textarea
                    name="message"
                    required
                    rows={4}
                    value={formData.message}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent-500/40 focus:border-accent-500 transition-colors resize-none"
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
