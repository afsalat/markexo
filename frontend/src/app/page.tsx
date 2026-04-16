'use client';

import Link from 'next/link';
import { ArrowRight, Truck, Shield, Clock, Award, ChevronRight, ChevronLeft, Star, ShoppingCart, Heart, Send, CheckCircle, CreditCard, Zap, Package, User, Plus, MapPin, ChevronDown, Search, Camera, X } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
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
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [currentOfferIndex, setCurrentOfferIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const { addToWishlist, removeFromWishlist, isWishlisted } = useCustomerAuth();
    const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchQuery.trim().length < 2) {
                setSuggestions([]);
                setShowSuggestions(false);
                return;
            }

            setIsLoadingSuggestions(true);
            try {
                const [productsData, categoriesData] = await Promise.all([
                    fetchProducts({ search: searchQuery, page_size: '4' }),
                    fetchCategories({ search: searchQuery }),
                ]);

                const productMatches = (productsData.results || []).map((product: any) => ({
                    ...product,
                    type: 'product',
                }));
                const categoryMatches = (categoriesData.results || [])
                    .slice(0, 3)
                    .map((category: any) => ({
                        ...category,
                        type: 'category',
                    }));

                setSuggestions([...categoryMatches, ...productMatches]);
                setShowSuggestions(true);
            } catch (error) {
                console.error('Failed to fetch suggestions:', error);
                setSuggestions([]);
            } finally {
                setIsLoadingSuggestions(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearch = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!searchQuery.trim()) return;
        router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
        setShowSuggestions(false);
    };

    const handleSuggestionClick = (slug: string, type: string = 'product') => {
        if (type === 'category') {
            router.push(`/products?category=${slug}`);
        } else {
            router.push(`/products/${slug}`);
        }
        setSearchQuery('');
        setShowSuggestions(false);
    };

    const handleCameraClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setIsAnalyzing(true);
            setShowSuggestions(false);
            // Simulate AI analysis
            setTimeout(() => {
                setIsAnalyzing(false);
                router.push('/products?visual=true');
            }, 2500);
        }
    };

    useEffect(() => {
        const updateTimer = () => {
            const now = new Date();
            const midnight = new Date();
            midnight.setHours(24, 0, 0, 0);
            const diff = midnight.getTime() - now.getTime();

            if (diff <= 0) {
                setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
                return;
            }

            setTimeLeft({
                hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((diff / 1000 / 60) % 60),
                seconds: Math.floor((diff / 1000) % 60)
            });
        };

        updateTimer();
        const timer = setInterval(updateTimer, 1000);
        return () => clearInterval(timer);
    }, []);

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

    const homeOfferBanners = banners
        .filter((banner) => banner.is_active && (banner.section === 'home_hero' || banner.section === 'general'))
        .map(banner => ({
            ...banner,
            image: resolveAssetUrl(banner.image)
        }));

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
                SEARCH & LOCATION SCANNER (Mobile App View)
            ======================================== */}
            <div className="bg-white px-4 py-3 sticky top-0 z-50 border-b border-slate-100 md:hidden">
                <div className="flex items-center gap-3 mb-2.5">
                    <div className="flex items-center gap-1.5 text-accent-600">
                        <MapPin size={14} className="fill-accent-500/10" />
                        <span className="text-[11px] font-bold tracking-tight">Delivering to Kozhikode...</span>
                        <ChevronDown size={12} />
                    </div>
                </div>
                <div className="relative group" ref={searchRef}>
                    <form onSubmit={handleSearch} className="relative">
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-accent-500 transition-colors">
                            <Search size={18} />
                        </div>
                        <input
                            type="text"
                            placeholder="Search for electronics, fashion..."
                            value={searchQuery}
                            onFocus={() => searchQuery.length >= 2 && setShowSuggestions(true)}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-100/80 border-none rounded-xl py-2.5 pl-12 pr-12 text-sm placeholder:text-slate-400 focus:ring-2 focus:ring-accent-500/20 focus:bg-white transition-all shadow-inner"
                        />
                        <div className="absolute inset-y-0 right-3 flex items-center gap-2">
                            {searchQuery && (
                                <button 
                                    type="button"
                                    onClick={() => setSearchQuery('')}
                                    className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            )}
                            <button 
                                type="button"
                                onClick={handleCameraClick}
                                className="p-1.5 hover:bg-slate-200 rounded-full transition-colors text-accent-500"
                            >
                                <Camera size={18} />
                            </button>
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                onChange={handleFileChange} 
                                accept="image/*" 
                                capture="environment" 
                                className="hidden" 
                            />
                        </div>
                    </form>

                    {/* Analyzing Overlay */}
                    {isAnalyzing && (
                        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-300">
                            <div className="bg-white rounded-3xl p-8 max-w-xs w-full text-center shadow-2xl animate-in zoom-in-95 duration-300">
                                <div className="relative w-20 h-20 mx-auto mb-6">
                                    <div className="absolute inset-0 border-4 border-accent-100 rounded-full" />
                                    <div className="absolute inset-0 border-4 border-accent-500 border-t-transparent rounded-full animate-spin" />
                                    <Camera size={32} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-accent-500" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">Analyzing Image</h3>
                                <p className="text-sm text-slate-500 leading-relaxed">
                                    Our AI is scanning your photo to find the most similar premium products...
                                </p>
                                <div className="mt-6 flex flex-col gap-2">
                                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-accent-500 animate-progress" style={{ width: '100%' }} />
                                    </div>
                                    <span className="text-[10px] font-bold text-accent-500 uppercase tracking-widest animate-pulse">
                                        Processing...
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Suggestions Dropdown */}
                    {showSuggestions && (suggestions.length > 0 || isLoadingSuggestions) && (
                        <div className="absolute left-0 right-0 top-full z-[60] mt-2 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="max-h-[60vh] overflow-y-auto overscroll-contain">
                                {isLoadingSuggestions ? (
                                    <div className="px-5 py-4 text-sm text-slate-500 flex items-center gap-3">
                                        <div className="w-4 h-4 border-2 border-accent-500 border-t-transparent rounded-full animate-spin" />
                                        Searching...
                                    </div>
                                ) : (
                                    <div className="divide-y divide-slate-50">
                                        {suggestions.map((item) => (
                                            <button
                                                key={`${item.type}-${item.id}`}
                                                onClick={() => handleSuggestionClick(item.slug, item.type)}
                                                className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-slate-50"
                                            >
                                                <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-slate-100 shrink-0">
                                                    {item.image ? (
                                                        <img
                                                            src={item.image}
                                                            alt={item.name}
                                                            className="h-full w-full object-cover"
                                                        />
                                                    ) : (
                                                        <span className="text-xs font-bold text-slate-400">
                                                            {item.name.charAt(0).toUpperCase()}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-sm font-semibold text-slate-900">
                                                        {item.name}
                                                    </p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                        {item.type === 'product'
                                                            ? `\u20B9${(item.current_price || item.price || 0).toLocaleString()}`
                                                            : 'Category'}
                                                    </p>
                                                </div>
                                                <ChevronRight size={14} className="text-slate-300" />
                                            </button>
                                        ))}
                                        <button
                                            onClick={() => handleSearch()}
                                            className="w-full px-5 py-3.5 text-left text-xs font-bold text-accent-600 bg-accent-50/30 hover:bg-accent-50 transition-colors flex items-center justify-between"
                                        >
                                            View all results for "{searchQuery}"
                                            <ArrowRight size={14} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

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
                <div className="relative z-10 w-full py-0">
                    <div
                        data-aos="fade-up"
                        data-aos-delay="120"
                        className="relative overflow-hidden"
                    >
                        <div
                            className="flex transition-transform duration-700 ease-in-out"
                            style={{ transform: `translateX(-${currentOfferIndex * 100}%)` }}
                        >
                            {heroCarouselOffers.map((banner, index) => (
                                <Link
                                    key={banner.id || index}
                                    href={banner.link || '/products'}
                                    className="group relative block min-w-full w-full flex-shrink-0 overflow-hidden bg-slate-50 lg:h-[calc(100vh-76px)]"
                                >
                                    <div className="absolute inset-0 z-10 bg-black/5 group-hover:bg-black/0 transition-colors duration-500" />
                                    <img
                                        src={banner.image || ''}
                                        alt={banner.title || 'Special Offer'}
                                        className="w-full h-auto lg:h-full lg:object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                                        loading={index === 0 ? "eager" : "lazy"}
                                    />
                                    {/* Desktop Only Caption Overlay */}
                                    <div className="hidden lg:flex absolute bottom-12 left-12 z-20 flex-col gap-4 max-w-lg">
                                        <h2 className="text-5xl font-bold text-white drop-shadow-lg">{banner.title}</h2>
                                        <span className="inline-block px-6 py-3 bg-white text-slate-900 rounded-full font-bold text-lg w-max">Shop Now</span>
                                    </div>
                                </Link>
                            ))}
                        </div>

                        {/* Pagination Progress Bar (Mobile App Style) */}
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
                            {heroCarouselOffers.map((_, i) => (
                                <div
                                    key={i}
                                    className={`h-1 rounded-full transition-all duration-300 ${
                                        i === currentOfferIndex ? 'w-6 bg-accent-500' : 'w-2 bg-white/50'
                                    }`}
                                />
                            ))}
                        </div>

                        <div className="pointer-events-none absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-white/35 to-transparent md:w-28" />
                        <div className="pointer-events-none absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-white/35 to-transparent md:w-28" />
                    </div>
                </div>
            </section>

            <section className="bg-white py-4 md:py-6 border-b border-gray-100">
                <div className="container mx-auto px-4">
                    {/* Hide scrollbar but allow horizontal scroll */}
                    <div className="overflow-x-auto pb-2 -mx-4 px-4 hide-scrollbar">
                        <div className="flex min-w-max items-start justify-start gap-4 lg:gap-8">
                            {/* "All" Story Circle */}
                            <Link href="/products" className="group flex w-[64px] md:w-[90px] flex-col items-center gap-2">
                                <div className="relative p-0.5 rounded-full bg-gradient-to-tr from-primary-400 to-accent-500 animate-gradient-xy">
                                    <div className="flex h-[58px] w-[58px] md:h-[80px] md:w-[80px] items-center justify-center overflow-hidden rounded-full bg-white border-2 border-white shadow-sm">
                                        <div className="flex h-full w-full items-center justify-center bg-accent-500 text-white font-bold text-xs uppercase tracking-tighter">
                                            All
                                        </div>
                                    </div>
                                </div>
                                <span className="text-center text-[9px] md:text-xs font-bold text-slate-800 tracking-tight">View All</span>
                            </Link>

                            {categories.slice(0, 10).map((category, index) => (
                                <Link
                                    key={category.slug}
                                    href={`/products?category=${category.slug}`}
                                    data-aos="fade-up"
                                    data-aos-delay={index * 30}
                                    className="group flex w-[64px] md:w-[90px] flex-col items-center gap-2 transition-all duration-300"
                                >
                                    {/* Image Container - Story Style Border */}
                                    <div className="relative p-0.5 rounded-full bg-slate-100 transition-all duration-300 group-hover:bg-gradient-to-tr group-hover:from-accent-400 group-hover:to-accent-600">
                                        <div className="flex h-[58px] w-[58px] md:h-[80px] md:w-[80px] items-center justify-center overflow-hidden rounded-full bg-white border-2 border-white shadow-sm transition-transform duration-500 group-hover:scale-[0.98]">
                                            {category.image ? (
                                                <img
                                                    src={category.image}
                                                    alt={category.name}
                                                    className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
                                                />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center bg-gray-50 text-xl transition duration-500 group-hover:scale-110">
                                                    {category.icon || category.name.charAt(0)}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Text Content */}
                                    <span className="text-center text-[9px] md:text-xs font-semibold text-slate-700 group-hover:text-accent-600 transition-colors truncate w-full px-1">
                                        {category.name}
                                    </span>
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
                    @keyframes gradient-xy {
                        0%, 100% { background-position: 0% 50%; }
                        50% { background-position: 100% 50%; }
                    }
                    .animate-gradient-xy {
                        background-size: 200% 200%;
                        animation: gradient-xy 3s ease infinite;
                    }
                `}} />
            </section>

            {/* ========================================
                TRENDING PRODUCTS
            ======================================== */}
            <section className="relative overflow-hidden bg-white py-8 md:py-16 border-b border-gray-100">
                <div className="container mx-auto px-4 lg:px-8">
                    <div className="relative z-10 mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4" data-aos="fade-up">
                        <div className="max-w-xl">
                            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-accent-500/20 bg-accent-500/5 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-accent-600">
                                <Zap size={12} className="fill-current" />
                                Trending Now
                            </div>
                            <h2 className="font-display text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">Our Popular <span className="text-accent-500">Picks</span></h2>
                            <p className="mt-2 text-sm leading-relaxed text-gray-500">Discover what's hot right now. Curated selections of high-demand products.</p>
                        </div>
                        <Link href="/trending" className="group flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3 text-xs font-bold text-gray-900 transition-all hover:bg-gray-50">
                            Explore All <ArrowRight size={16} />
                        </Link>
                    </div>

                    <div className="relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
                        {trendingProducts.map((product, index) => (
                            <Link
                                key={product.id}
                                href={`/products/${product.slug}`}
                                data-aos="fade-up"
                                data-aos-delay={index * 50}
                                className="product-card group relative bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm transition-all duration-500 hover:-translate-y-1.5 hover:shadow-xl hover:border-accent-500/20"
                            >
                                <div className="relative aspect-[4/5] overflow-hidden bg-gray-50">
                                    {product.image ? (
                                        <img src={product.image} alt={product.name} className="h-full w-full object-contain p-2 transition-transform duration-700 group-hover:scale-105" />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center text-gray-200">
                                            <ShoppingCart size={32} />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                    
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            isWishlisted(product.id) ? removeFromWishlist(product.id) : addToWishlist(product);
                                        }}
                                        className={`absolute right-2 top-2 w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition-all scale-90 group-hover:scale-100 ${isWishlisted(product.id) ? 'bg-red-500 text-white' : 'bg-white text-gray-400 hover:text-accent-500 hover:bg-white border border-gray-100'}`}
                                    >
                                        <Heart size={14} className={isWishlisted(product.id) ? 'fill-current' : ''} />
                                    </button>
                                </div>
                                
                                <div className="p-3">
                                    <div className="mb-2 flex items-center justify-between gap-1">
                                        <span className="text-[9px] font-bold tracking-widest text-accent-500 uppercase bg-accent-500/5 px-2 py-0.5 rounded-full border border-accent-500/10">
                                            {product.category?.name || 'Exclusive'}
                                        </span>
                                        <div className="flex items-center gap-1">
                                            <Star size={10} className="fill-amber-400 text-amber-400" />
                                            <span className="text-[10px] font-bold text-gray-900">4.8</span>
                                        </div>
                                    </div>
                                    <h3 className="mb-2 line-clamp-2 text-xs font-bold text-gray-900 group-hover:text-accent-500 transition-colors leading-tight min-h-[2rem]">
                                        {product.name}
                                    </h3>
                                    <div className="flex items-baseline justify-between gap-2 pt-2 border-t border-gray-50">
                                        <div className="flex flex-col">
                                            <div className="flex items-baseline gap-1.5">
                                                <span className="text-sm font-bold text-gray-900">₹{product.current_price.toLocaleString()}</span>
                                                {product.price > product.current_price && (
                                                    <span className="text-[10px] text-gray-400 line-through">₹{product.price.toLocaleString()}</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="h-7 w-7 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-accent-500 group-hover:text-white transition-all">
                                            <Plus size={14} />
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
            <section className="py-12 md:py-20 bg-gray-50/50">
                <div className="container mx-auto px-4 lg:px-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4" data-aos="fade-up">
                        <div className="text-center md:text-left">
                            <h2 className="font-display text-2xl md:text-3xl font-bold text-gray-900 mb-1">Editor's <span className="text-accent-500">Choice</span></h2>
                            <p className="text-gray-500 text-sm">Handpicked premium products for your lifestyle.</p>
                        </div>
                        <Link href="/trending" className="group flex items-center gap-2 text-accent-500 font-bold text-xs bg-accent-500/5 px-4 py-2.5 rounded-xl hover:bg-accent-500/10 transition-all">
                            View Collections <ArrowRight size={16} />
                        </Link>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
                        {featuredProducts.map((product, index) => (
                            <Link key={product.id} href={`/products/${product.slug}`} className="product-card group relative bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm transition-all duration-500 hover:-translate-y-1.5" data-aos="fade-up" data-aos-delay={index * 50}>
                                <div className="relative aspect-[4/5] overflow-hidden bg-gray-50">
                                    {product.image ? (
                                        <img src={product.image} alt={product.name} className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-700" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-200">
                                            <ShoppingCart size={32} />
                                        </div>
                                    )}
                                    <div className="absolute top-2 left-2">
                                        <span className="rounded-full bg-gray-900/90 backdrop-blur-md px-2 py-1 text-[8px] font-bold uppercase tracking-widest text-white">Featured</span>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            isWishlisted(product.id) ? removeFromWishlist(product.id) : addToWishlist(product);
                                        }}
                                        className={`absolute right-2 top-2 w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition-all scale-90 group-hover:scale-100 ${isWishlisted(product.id) ? 'bg-red-500 text-white' : 'bg-white/80 backdrop-blur-sm text-gray-400 hover:text-red-500'}`}>
                                        <Heart size={14} className={isWishlisted(product.id) ? 'fill-current' : ''} />
                                    </button>
                                </div>
                                <div className="p-3">
                                    <span className="text-[9px] font-bold tracking-widest text-accent-500 uppercase mb-1.5 block">
                                        {product.category?.name || 'Exclusive'}
                                    </span>
                                    <h3 className="font-bold text-gray-900 text-xs leading-tight mb-3 line-clamp-2 min-h-[2rem]">
                                        {product.name}
                                    </h3>
                                    <div className="flex items-center justify-between border-t border-gray-50 pt-3">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-gray-900">₹{product.current_price.toLocaleString()}</span>
                                            {product.price > product.current_price && (
                                                <span className="text-[9px] text-gray-400 line-through">₹{product.price.toLocaleString()}</span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1 text-[9px] font-bold text-amber-500">
                                            <Star size={9} className="fill-current" />
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
            <section className="py-12 md:py-20 bg-white">
                <div className="container mx-auto px-4 lg:px-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4" data-aos="fade-up">
                        <div className="max-w-xl">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="p-2 bg-accent-500/10 rounded-lg text-accent-600">
                                    <Award size={20} />
                                </div>
                                <h2 className="font-display text-2xl md:text-3xl font-bold text-gray-900 leading-tight">Best <span className="text-accent-500">Sellers</span></h2>
                            </div>
                            <p className="text-gray-500 text-sm">Top-rated products that our community loves.</p>
                        </div>
                        <Link href="/products?sort=bestsellers" className="group flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl font-bold text-xs hover:bg-gray-800 transition-all">
                            See Top Rated <ChevronRight size={16} />
                        </Link>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
                        {bestSellers.map((product, index) => (
                            <Link key={product.id} href={`/products/${product.slug}`} className="product-card group relative bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm transition-all duration-500 hover:-translate-y-1.5" data-aos="fade-up" data-aos-delay={index * 50}>
                                <div className="relative aspect-[4/5] overflow-hidden bg-gray-50">
                                    {product.image ? (
                                        <img src={product.image} alt={product.name} className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-700" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-200">
                                            <ShoppingCart size={32} />
                                        </div>
                                    )}
                                    {product.discount_percent > 0 && (
                                        <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-0.5 rounded-full text-[9px] font-bold shadow-lg">
                                            -{product.discount_percent}%
                                        </div>
                                    )}
                                </div>
                                <div className="p-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[9px] font-bold text-accent-500 uppercase tracking-widest">{product.category?.name || 'Essentials'}</span>
                                        <div className="flex items-center gap-1">
                                            <Star size={9} className="fill-amber-400 text-amber-400" />
                                            <span className="text-[9px] font-bold text-gray-600">4.9</span>
                                        </div>
                                    </div>
                                    <h3 className="font-bold text-gray-900 text-xs leading-snug line-clamp-2 transition-colors group-hover:text-accent-500 mb-3 min-h-[2rem]">
                                        {product.name}
                                    </h3>
                                    <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                                        <span className="text-base font-bold text-gray-900">₹{product.current_price.toLocaleString()}</span>
                                        <div className="h-7 w-7 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 scale-90 group-hover:scale-100 group-hover:bg-accent-500 group-hover:text-white transition-all">
                                            <Plus size={14} />
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
            <section className="py-8 bg-white overflow-hidden">
                <div className="container mx-auto px-4">
                    <div className="flex justify-between items-center mb-6" data-aos="fade-up">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <Package className="text-accent-500" size={20} />
                                <h2 className="font-display text-xl md:text-3xl font-bold text-slate-900">New Arrivals</h2>
                            </div>
                            <p className="text-slate-500 text-xs">Fresh products just for you</p>
                        </div>
                        <Link href="/new-arrivals" className="hidden md:flex items-center gap-1 text-accent-500 font-medium hover:gap-2 transition-all text-xs">
                            View All <ChevronRight size={14} />
                        </Link>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {newArrivals.map((product, index) => (
                            <div key={product.id} className="product-card group relative bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm transition-all duration-500 hover:-translate-y-1" data-aos="fade-up" data-aos-delay={index * 50}>
                                <Link href={`/products/${product.slug}`} className="block">
                                    <div className="relative aspect-square overflow-hidden bg-slate-50">
                                        {product.image ? (
                                            <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-200">
                                                <ShoppingCart size={32} />
                                            </div>
                                        )}
                                        <span className="absolute top-2 left-2 bg-black text-white px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest">NEW</span>
                                        {product.discount_percent > 0 && (
                                            <span className="absolute top-2 right-2 bg-red-500 text-white px-1.5 py-0.5 rounded text-[8px] font-bold shadow-md">-{product.discount_percent}%</span>
                                        )}
                                    </div>
                                    <div className="p-3">
                                        <span className="text-[9px] font-bold tracking-widest text-accent-500 uppercase mb-1 block">
                                            {product.category?.name || 'Latest'}
                                        </span>
                                        <h3 className="font-bold text-gray-900 text-xs leading-tight mb-3 line-clamp-2 min-h-[2rem]">
                                            {product.name}
                                        </h3>
                                        <div className="flex items-center justify-between border-t border-gray-50 pt-2.5">
                                            <span className="text-sm font-bold text-gray-900">₹{product.current_price.toLocaleString()}</span>
                                            <div className="h-7 w-7 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-accent-500 group-hover:text-white transition-all scale-90 group-hover:scale-100">
                                                <Plus size={14} />
                                            </div>
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
            <section className="py-10 bg-red-50/30 overflow-hidden relative border-y border-red-100/50">
                <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 rounded-full blur-[80px] -mr-32 -mt-32" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent-500/5 rounded-full blur-[80px] -ml-32 -mb-32" />

                <div className="container mx-auto px-4 lg:px-8 relative z-10">
                    <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6" data-aos="fade-up">
                        <div className="text-center md:text-left">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/10 rounded-full text-red-600 text-[9px] font-bold uppercase tracking-widest mb-4 animate-pulse">
                                <Clock size={12} />
                                Flash Sale Ending Soon
                            </div>
                            <h2 className="font-display text-2xl md:text-4xl font-bold mb-2 text-gray-900">Deals of the <span className="text-red-500">Day</span></h2>
                            <p className="text-gray-500 text-xs max-w-xl">Premium collections at unbeatable prices. Limited time offers.</p>
                        </div>
                        <div className="flex items-center gap-3 bg-white shadow-lg shadow-red-500/5 border border-red-100 p-4 rounded-2xl scale-90 md:scale-100">
                            <div className="text-center min-w-[40px]">
                                <div className="text-xl font-bold text-red-600">
                                    {timeLeft.hours.toString().padStart(2, '0')}
                                </div>
                                <div className="text-[8px] uppercase font-bold text-gray-400 tracking-wider">HRS</div>
                            </div>
                            <div className="text-lg font-bold text-gray-200">:</div>
                            <div className="text-center min-w-[40px]">
                                <div className="text-xl font-bold text-red-600">
                                    {timeLeft.minutes.toString().padStart(2, '0')}
                                </div>
                                <div className="text-[8px] uppercase font-bold text-gray-400 tracking-wider">MINS</div>
                            </div>
                            <div className="text-lg font-bold text-gray-200">:</div>
                            <div className="text-center min-w-[40px]">
                                <div className="text-xl font-bold text-red-600">
                                    {timeLeft.seconds.toString().padStart(2, '0')}
                                </div>
                                <div className="text-[8px] uppercase font-bold text-gray-400 tracking-wider">SECS</div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {dealsOfTheDay.map((product, index) => (
                            <Link key={product.id} href={`/products/${product.slug}`} className="product-card group relative bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-xl" data-aos="fade-up" data-aos-delay={index * 50}>
                                <div className="absolute top-2 left-2 z-20 bg-red-600 text-white px-2 py-0.5 rounded text-[8px] font-bold shadow-lg">
                                    -{product.discount_percent || 50}%
                                </div>
                                <div className="relative aspect-square overflow-hidden bg-gray-50">
                                    {product.image ? (
                                        <img src={product.image} alt={product.name} className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-700" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-200">
                                            <ShoppingCart size={32} />
                                        </div>
                                    )}
                                </div>
                                <div className="p-3">
                                    <h3 className="font-bold text-gray-900 text-[11px] leading-tight line-clamp-2 min-h-[2.2rem] mb-3 group-hover:text-red-600 transition-colors">
                                        {product.name}
                                    </h3>
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="text-base font-bold text-red-600">₹{product.current_price.toLocaleString()}</span>
                                        {product.price > product.current_price && (
                                            <span className="text-[10px] text-gray-400 line-through font-medium">₹{product.price.toLocaleString()}</span>
                                        )}
                                    </div>
                                    <div className="w-full bg-gray-100 h-1 rounded-full overflow-hidden">
                                        <div className="h-full bg-red-500 w-[75%]" />
                                    </div>
                                    <div className="flex justify-between mt-1.5 px-0.5">
                                        <span className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">Limited Stock</span>
                                        <span className="text-[8px] font-bold text-red-500 uppercase tracking-widest">Ending Soon</span>
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
            <section className="py-10 bg-white border-t border-gray-100">
                <div className="container mx-auto px-4 lg:px-8">
                    <div className="mb-8 flex items-center justify-between" data-aos="fade-up">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-accent-500/10 flex items-center justify-center text-accent-600">
                                <Heart size={20} className="fill-current" />
                            </div>
                            <h2 className="font-display text-xl md:text-3xl font-bold text-gray-900">Suggested For <span className="text-accent-500">You</span></h2>
                        </div>
                        <p className="hidden md:block text-gray-400 text-xs font-medium italic">Based on your interests</p>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {suggestedProducts.map((product, index) => (
                            <Link key={product.id} href={`/products/${product.slug}`} className="product-card group relative bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-xl" data-aos="fade-up" data-aos-delay={index * 50}>
                                <div className="relative aspect-square overflow-hidden bg-gray-50">
                                    {product.image ? (
                                        <img src={product.image} alt={product.name} className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-700" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-200">
                                            <ShoppingCart size={32} />
                                        </div>
                                    )}
                                    {product.discount_percent > 0 && (
                                        <span className="absolute top-2 left-2 bg-red-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow-md">-{product.discount_percent}%</span>
                                    )}
                                </div>
                                <div className="p-3">
                                    <h3 className="font-bold text-gray-900 text-[11px] leading-tight mb-3 line-clamp-2 min-h-[2.2rem] group-hover:text-accent-500 transition-colors">
                                        {product.name}
                                    </h3>
                                    <div className="flex items-center justify-between border-t border-gray-50 pt-3">
                                        <span className="text-base font-bold text-gray-900">₹{product.current_price.toLocaleString()}</span>
                                        <div className="h-7 w-7 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 scale-90 group-hover:scale-100 group-hover:bg-accent-500 group-hover:text-white transition-all">
                                            <ShoppingCart size={14} />
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
            <section className="py-10 md:py-16 bg-gray-50">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-8" data-aos="fade-up">
                        <h2 className="font-display text-xl md:text-3xl font-bold text-slate-900 mb-1">What Our Customers Say</h2>
                        <p className="text-slate-500 text-xs">Real experiences from real people</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {testimonials.map((testimonial, index) => (
                            <div key={testimonial.id} className="bg-white border border-slate-200 rounded-2xl p-4 md:p-6 hover:border-accent-500/30 transition-colors shadow-sm" data-aos="fade-up" data-aos-delay={index * 100}>
                                <div className="flex items-center gap-1 mb-4">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Star key={star} size={18} className={star <= testimonial.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'} />
                                    ))}
                                </div>
                                <p className="text-slate-600 mb-4 leading-relaxed">&ldquo;{testimonial.review}&rdquo;</p>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gradient-to-br from-accent-500 to-primary-600 rounded-full flex items-center justify-center text-white font-bold text-base">
                                        {testimonial.name.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-semibold text-slate-900 text-sm">{testimonial.name}</h4>
                                            {testimonial.verified && (
                                                <span className="text-[10px] bg-accent-500/10 text-accent-500 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                                                    <CheckCircle size={8} /> Verified
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-[10px] text-slate-500">{testimonial.date}</p>
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
            <section className="py-10 md:py-20 bg-white border-t border-slate-200">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
                        <div className="relative" data-aos="fade-right">
                            <div className="absolute -top-10 -left-10 w-40 h-40 bg-accent-500/10 rounded-full blur-3xl" />
                            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary-600/10 rounded-full blur-3xl" />

                            <div className="relative z-10 bg-slate-50 rounded-2xl p-4 md:p-8 border border-slate-200 shadow-xl overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-br from-accent-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                <div className="grid grid-cols-2 gap-3 md:gap-4">
                                    <div className="bg-white p-3 md:p-4 rounded-xl border border-slate-200">
                                        <Award className="text-accent-500 mb-1.5 md:mb-2" size={24} />
                                        <p className="text-lg md:text-2xl font-bold text-slate-900">#1</p>
                                        <p className="text-[10px] md:text-sm text-slate-500">Trusted Store</p>
                                    </div>
                                    <div className="bg-white p-3 md:p-4 rounded-xl border border-slate-200">
                                        <Shield className="text-primary-500 mb-1.5 md:mb-2" size={24} />
                                        <p className="text-lg md:text-2xl font-bold text-slate-900">100%</p>
                                        <p className="text-[10px] md:text-sm text-slate-500">Secure COD</p>
                                    </div>
                                    <div className="bg-white p-3 md:p-4 rounded-xl border border-slate-200">
                                        <User className="text-green-500 mb-1.5 md:mb-2" size={24} />
                                        <p className="text-lg md:text-2xl font-bold text-slate-900">50k+</p>
                                        <p className="text-[10px] md:text-sm text-slate-500">Users</p>
                                    </div>
                                    <div className="bg-white p-3 md:p-4 rounded-xl border border-slate-200">
                                        <Star className="text-amber-500 mb-1.5 md:mb-2" size={24} />
                                        <p className="text-lg md:text-2xl font-bold text-slate-900">4.8</p>
                                        <p className="text-[10px] md:text-sm text-slate-500">Rating</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div data-aos="fade-left">
                            <span className="text-accent-500 font-bold tracking-wider text-[10px] md:text-sm uppercase mb-2 block">Our Story</span>
                            <h2 className="font-display text-xl md:text-4xl font-bold text-slate-900 mb-4 md:mb-6 leading-tight">
                                Redefining Your <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-accent-400">Shopping Experience</span>
                            </h2>
                            <p className="text-slate-600 text-sm md:text-lg mb-4 md:mb-6 leading-relaxed">
                                VorionMart is India's premier D2C marketplace designed for the modern shopper. We connect you directly with verified sellers offering premium quality products across multiple categories.
                            </p>
                            <p className="text-slate-500 text-xs md:text-base mb-6 md:mb-8 leading-relaxed">
                                Our mission is simple: To provide a seamless, secure, and delightful shopping experience with our "COD Only" model, ensuring trust and satisfaction with every order.
                            </p>

                            <div className="flex flex-wrap gap-3 md:gap-4">
                                <Link href="/products" className="px-5 py-2.5 bg-accent-500 text-white rounded-xl font-bold text-xs md:text-base inline-flex items-center gap-2">
                                    Start Shopping <ArrowRight size={16} />
                                </Link>
                                <Link href="/contact" className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-medium text-xs md:text-base hover:bg-slate-50 transition-colors">
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
            <section className="py-10 md:py-16 bg-gray-50">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-8" data-aos="fade-up">
                        <h2 className="font-display text-xl md:text-3xl font-bold text-slate-900 mb-1">Why Choose VorionMart?</h2>
                        <p className="text-slate-500 text-xs">Your trusted premium marketplace</p>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
                        <div className="text-center group p-2" data-aos="fade-up" data-aos-delay="0">
                            <div className="w-14 h-14 md:w-20 md:h-20 bg-gradient-to-br from-accent-500/20 to-accent-500/5 border border-accent-500/30 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 group-hover:border-accent-500 transition-all">
                                <Award className="text-accent-500" size={28} />
                            </div>
                            <h3 className="text-xl md:text-4xl font-bold text-slate-900 mb-1">500+</h3>
                            <p className="text-slate-600 font-medium text-[10px] md:text-base">Verified Sellers</p>
                            <p className="hidden md:block text-sm text-slate-500 mt-1">Quality assured</p>
                        </div>
                        <div className="text-center group p-2" data-aos="fade-up" data-aos-delay="100">
                            <div className="w-14 h-14 md:w-20 md:h-20 bg-gradient-to-br from-accent-500/20 to-accent-500/5 border border-accent-500/30 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 group-hover:border-accent-500 transition-all">
                                <Package className="text-accent-500" size={28} />
                            </div>
                            <h3 className="text-xl md:text-4xl font-bold text-slate-900 mb-1">10k+</h3>
                            <p className="text-slate-600 font-medium text-[10px] md:text-base">Products</p>
                            <p className="hidden md:block text-sm text-slate-500 mt-1">Premium selection</p>
                        </div>
                        <div className="text-center group p-2" data-aos="fade-up" data-aos-delay="200">
                            <div className="w-14 h-14 md:w-20 md:h-20 bg-gradient-to-br from-accent-500/20 to-accent-500/5 border border-accent-500/30 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 group-hover:border-accent-500 transition-all">
                                <Heart className="text-accent-500" size={28} />
                            </div>
                            <h3 className="text-xl md:text-4xl font-bold text-slate-900 mb-1">50k+</h3>
                            <p className="text-slate-600 font-medium text-[10px] md:text-base">Customers</p>
                            <p className="hidden md:block text-sm text-slate-500 mt-1">5-star reviews</p>
                        </div>
                        <div className="text-center group p-2" data-aos="fade-up" data-aos-delay="300">
                            <div className="w-14 h-14 md:w-20 md:h-20 bg-gradient-to-br from-accent-500/20 to-accent-500/5 border border-accent-500/30 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 group-hover:border-accent-500 transition-all">
                                <Truck className="text-accent-500" size={28} />
                            </div>
                            <h3 className="text-xl md:text-4xl font-bold text-slate-900 mb-1">2-5 Days</h3>
                            <p className="text-slate-600 font-medium text-[10px] md:text-base">Fast Shipping</p>
                            <p className="hidden md:block text-sm text-slate-500 mt-1">Pan-India</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ========================================
                ENQUIRY FORM
            ======================================== */}
            <section className="py-10 md:py-16 bg-white border-t border-slate-200">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto" data-aos="fade-up">
                        <div className="text-center mb-8">
                            <h2 className="font-display text-xl md:text-3xl font-bold text-slate-900">Have a Question?</h2>
                            <p className="text-slate-500 text-xs mt-1">Send us a message and we&apos;ll get back to you shortly.</p>
                        </div>

                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 md:p-10 shadow-sm transition-all hover:shadow-md">
                            <EnquiryForm />
                        </div>
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
            <div className="text-center py-4">
                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CheckCircle size={24} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">Message Sent!</h3>
                <p className="text-xs text-slate-500">We will reply to your email shortly.</p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                    <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1.5 ml-1">Your Name</label>
                    <input
                        type="text"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 transition-all"
                        placeholder="John Doe"
                    />
                </div>
                <div>
                    <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1.5 ml-1">Email Address</label>
                    <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 transition-all"
                        placeholder="john@example.com"
                    />
                </div>
            </div>

            <div className="mb-4">
                <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1.5 ml-1">Subject</label>
                <input
                    type="text"
                    name="subject"
                    required
                    value={formData.subject}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 transition-all"
                    placeholder="How can we help?"
                />
            </div>

            <div className="mb-6">
                <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1.5 ml-1">Message</label>
                <textarea
                    name="message"
                    required
                    rows={4}
                    value={formData.message}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 transition-all resize-none"
                    placeholder="Tell us more..."
                />
            </div>

            <div className="flex justify-center md:justify-end">
                <button
                    type="submit"
                    disabled={status === 'submitting'}
                    className="w-full md:w-auto px-8 py-3 bg-accent-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-accent-500/20 flex items-center justify-center gap-2 hover:bg-accent-600 active:scale-95 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {status === 'submitting' ? 'Sending...' : (
                        <>
                            Send Message <Send size={16} />
                        </>
                    )}
                </button>
            </div>
        </form>
    );
}
