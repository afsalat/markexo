'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Filter, Grid, List, ChevronDown, X, ShoppingCart, Star, Heart, SlidersHorizontal, Search, Plus, LayoutGrid, ArrowUpDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/lib/cart';
import { fetchProducts, fetchCategories, type Category } from '@/lib/api';
import { useCustomerAuth } from '@/context/CustomerAuthContext';

type FilterCategory = Category & { depth: number };

function flattenCategories(categories: Category[], depth = 0): FilterCategory[] {
    return categories.flatMap((category) => ([
        { ...category, depth },
        ...flattenCategories(category.children || [], depth + 1),
    ]));
}

function findCategoryBySlug(categories: Category[], slug: string): Category | null {
    for (const category of categories) {
        if (category.slug === slug) {
            return category;
        }

        const matchedChild = findCategoryBySlug(category.children || [], slug);
        if (matchedChild) {
            return matchedChild;
        }
    }

    return null;
}

function collectCategorySlugs(category: Category): string[] {
    return [
        category.slug,
        ...(category.children || []).flatMap(collectCategorySlugs),
    ];
}

export default function ProductsPage({ 
    initialFeatured = false, 
    initialSort = '',
    pageTitle = ''
}: { 
    initialFeatured?: boolean, 
    initialSort?: string,
    pageTitle?: string
}) {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-accent-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm text-gray-500 font-medium">Loading products...</span>
                </div>
            </div>
        }>
            <ProductsPageContent 
                initialFeatured={initialFeatured} 
                initialSort={initialSort} 
                customPageTitle={pageTitle} 
            />
        </Suspense>
    );
}

function ProductsPageContent({ 
    initialFeatured, 
    initialSort, 
    customPageTitle 
}: { 
    initialFeatured?: boolean, 
    initialSort?: string,
    customPageTitle?: string
}) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const searchQuery = searchParams?.get('search') || '';
    const categoryParam = searchParams?.get('category');
    const featuredParam = searchParams?.get('featured') || searchParams?.get('trending');
    const sortParam = searchParams?.get('sort');
    const isVisualSearch = searchParams?.get('visual') === 'true';

    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [showFilters, setShowFilters] = useState(false);
    const { addItem } = useCart();
    const { addToWishlist, removeFromWishlist, isWishlisted } = useCustomerAuth();

    // Product and category states
    const [products, setProducts] = useState<any[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    // Initialize selectedCategories with URL param if present
    const [selectedCategories, setSelectedCategories] = useState<string[]>(
        categoryParam ? [categoryParam] : []
    );

    const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
    const [sortBy, setSortBy] = useState(sortParam || initialSort || 'newest');
    const [showFeaturedOnly, setShowFeaturedOnly] = useState(featuredParam === 'true' || initialFeatured || false);
    const [categorySearchArg, setCategorySearchArg] = useState('');
    const flatCategories = flattenCategories(categories);
    const categoryLookup = new Map(flatCategories.map((category) => [category.slug, category]));
    const expandedCategorySlugs = new Set(
        selectedCategories.flatMap((slug) => {
            const category = findCategoryBySlug(categories, slug);
            return category ? collectCategorySlugs(category) : [slug];
        })
    );
    const visibleCategories = flatCategories.filter((category) =>
        category.name.toLowerCase().includes(categorySearchArg.toLowerCase())
    );

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const [productsResponse, categoriesData] = await Promise.all([
                    fetchProducts(searchQuery ? { search: searchQuery } : undefined),
                    fetchCategories()
                ]);
                const productsData = Array.isArray(productsResponse) ? productsResponse : (productsResponse.results || []);
                setProducts(productsData);
                const categoriesList = Array.isArray(categoriesData) ? categoriesData : (categoriesData.results || []);
                setCategories(categoriesList as Category[]);
                if (categoryParam) {
                    const matchedCategory = findCategoryBySlug(categoriesList as Category[], categoryParam);
                    if (matchedCategory) {
                        setSelectedCategories([matchedCategory.slug]);
                    }
                }
            } catch (error) {
                console.error('Error loading products:', error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [categoryParam, searchQuery]);

    const toggleCategory = (category: string) => {
        setSelectedCategories((prev) =>
            prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
        );
    };

    const filteredProducts = products.filter((product) => {
        // Search Filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            const matchesSearch =
                product.name.toLowerCase().includes(query) ||
                product.category?.name.toLowerCase().includes(query);

            if (!matchesSearch) return false;
        }

        // Featured/Trending filter
        if (showFeaturedOnly && !product.is_featured) return false;

        if (selectedCategories.length) {
            const productCategorySlug = product.category?.slug;
            if (!productCategorySlug || !expandedCategorySlugs.has(productCategorySlug)) return false;
        }
        if (product.current_price < priceRange[0] || product.current_price > priceRange[1]) return false;

        return true;
    }).sort((a, b) => {
        switch (sortBy) {
            case 'price_low':
                return a.current_price - b.current_price;
            case 'price_high':
                return b.current_price - a.current_price;
            case 'popular':
                return (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0);
            case 'newest':
            default:
                return b.id - a.id;
        }
    });

    // Determine page title based on filters
    const getPageTitle = () => {
        if (customPageTitle) return customPageTitle;
        if (isVisualSearch) return 'Visual Search Results';
        if (searchQuery) return `Search Results for "${searchQuery}"`;
        if (showFeaturedOnly) return 'Trending Now';
        if (sortParam === 'newest') return 'New Arrivals';
        return 'All Products';
    };

    const activeFilterCount = selectedCategories.length + (priceRange[0] > 0 || priceRange[1] < 10000 ? 1 : 0);

    const displayRating = (product: any) => {
        return Number(product.rating) > 0 ? Number(product.rating) : 4.5;
    };

    return (
        <div className="min-h-screen bg-[#f8f9fb]">
            {/* Page Header */}
            <div className="bg-white border-b border-gray-100">
                <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-6">
                    <nav className="flex items-center gap-2 text-sm text-gray-400 mb-3">
                        <Link href="/" className="hover:text-accent-500 transition-colors">Home</Link>
                        <span className="text-gray-300">/</span>
                        <span className="text-gray-900 font-medium">{getPageTitle()}</span>
                    </nav>
                    <div className="flex items-end justify-between gap-4">
                        <div>
                            <h1 className="font-display text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                                {getPageTitle()}
                            </h1>
                            <p className="text-gray-500 text-sm mt-1">
                                {isVisualSearch ? 'Found products matching your image' : `${filteredProducts.length} products found`}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-6">
                <div className="flex gap-6 lg:gap-8">
                    {/* Filters Sidebar - Desktop */}
                    <aside className="hidden lg:block w-[260px] flex-shrink-0 sticky top-28 self-start max-h-[calc(100vh-7rem)] overflow-y-auto custom-scrollbar">
                        <div className="filter-sidebar">
                            {/* Sidebar Header */}
                            <div className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-100">
                                <div className="w-8 h-8 rounded-lg bg-accent-50 flex items-center justify-center">
                                    <SlidersHorizontal size={15} className="text-accent-500" />
                                </div>
                                <h2 className="font-semibold text-sm text-gray-900">Filters</h2>
                                {activeFilterCount > 0 && (
                                    <span className="ml-auto text-[10px] font-bold bg-accent-500 text-white w-5 h-5 rounded-full flex items-center justify-center">
                                        {activeFilterCount}
                                    </span>
                                )}
                            </div>

                            {/* Categories Section */}
                            <div className="px-5 py-4 border-b border-gray-50">
                                <h3 className="filter-section-title">Categories</h3>

                                {/* Category Search */}
                                <div className="relative mb-3">
                                    <input
                                        type="text"
                                        placeholder="Search categories..."
                                        value={categorySearchArg}
                                        onChange={(e) => setCategorySearchArg(e.target.value)}
                                        className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm text-gray-900 focus:border-accent-500/40 focus:bg-white focus:ring-2 focus:ring-accent-500/5 outline-none transition-all placeholder:text-gray-400"
                                    />
                                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                </div>

                                <div className="space-y-0.5 max-h-[320px] overflow-y-auto pr-1 custom-scrollbar -mr-1">
                                    {visibleCategories.map((category) => (
                                        <label
                                            key={category.slug}
                                            className={`flex items-center gap-2.5 px-2 py-2 rounded-lg cursor-pointer group select-none transition-all ${selectedCategories.includes(category.slug) ? 'bg-accent-50' : 'hover:bg-gray-50'}`}
                                            style={{ paddingLeft: `${8 + category.depth * 14}px` }}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedCategories.includes(category.slug)}
                                                onChange={() => toggleCategory(category.slug)}
                                                className="filter-checkbox"
                                            />
                                            <span className={`text-sm transition-colors truncate leading-tight ${selectedCategories.includes(category.slug) ? 'font-semibold text-accent-600' : 'text-gray-600 group-hover:text-gray-900'}`}>
                                                {category.depth > 0 && <span className="text-gray-300 mr-1">–</span>}
                                                {category.name}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Price Range Section */}
                            <div className="px-5 py-4 border-b border-gray-50">
                                <h3 className="filter-section-title">Price Range</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-medium">₹</span>
                                        <input
                                            type="number"
                                            placeholder="Min"
                                            value={priceRange[0]}
                                            onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                                            className="w-full pl-6 pr-2 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm text-gray-900 focus:border-accent-500/40 focus:ring-2 focus:ring-accent-500/5 outline-none transition-all"
                                        />
                                    </div>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-medium">₹</span>
                                        <input
                                            type="number"
                                            placeholder="Max"
                                            value={priceRange[1]}
                                            onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                                            className="w-full pl-6 pr-2 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm text-gray-900 focus:border-accent-500/40 focus:ring-2 focus:ring-accent-500/5 outline-none transition-all"
                                        />
                                    </div>
                                </div>
                                {/* Range Bar */}
                                <div className="mt-3 h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-accent-400 to-accent-500 rounded-full transition-all"
                                        style={{ width: `${Math.min(100, (priceRange[1] / 10000) * 100)}%` }}
                                    />
                                </div>
                            </div>

                            {/* Clear All */}
                            <div className="px-5 py-4">
                                <button
                                    onClick={() => {
                                        setSelectedCategories([]);
                                        setPriceRange([0, 10000]);
                                    }}
                                    className="w-full py-2.5 text-sm font-semibold text-gray-400 hover:text-accent-500 hover:bg-accent-50 border border-dashed border-gray-200 hover:border-accent-200 rounded-xl transition-all"
                                >
                                    Clear All Filters
                                </button>
                            </div>
                        </div>
                    </aside>

                    {/* Main Content */}
                    <div className="flex-1 min-w-0">
                        {/* Toolbar */}
                        <div className="toolbar mb-5">
                            {/* Mobile Filter Toggle */}
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className="lg:hidden flex items-center gap-2 px-3.5 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                            >
                                <Filter size={15} />
                                Filters
                                {activeFilterCount > 0 && (
                                    <span className="text-[10px] font-bold bg-accent-500 text-white w-4 h-4 rounded-full flex items-center justify-center">{activeFilterCount}</span>
                                )}
                            </button>

                            <div className="flex items-center gap-2 ml-auto">
                                {/* Sort */}
                                <div className="relative">
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                        className="sort-select"
                                    >
                                        <option value="newest">Newest First</option>
                                        <option value="price_low">Price: Low to High</option>
                                        <option value="price_high">Price: High to Low</option>
                                        <option value="popular">Most Popular</option>
                                    </select>
                                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                </div>

                                {/* View Mode Toggle */}
                                <div className="hidden sm:flex items-center bg-gray-50 rounded-lg p-0.5 border border-gray-100">
                                    <button
                                        onClick={() => setViewMode('grid')}
                                        className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                    >
                                        <LayoutGrid size={16} />
                                    </button>
                                    <button
                                        onClick={() => setViewMode('list')}
                                        className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                    >
                                        <List size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Active Filter Tags */}
                        {selectedCategories.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-4">
                                {selectedCategories.map((slug) => (
                                    <span key={slug} className="active-filter-tag">
                                        {categoryLookup.get(slug)?.name || slug}
                                        <button onClick={() => toggleCategory(slug)} className="ml-0.5 hover:text-accent-700 transition-colors">
                                            <X size={12} />
                                        </button>
                                    </span>
                                ))}
                                <button
                                    onClick={() => setSelectedCategories([])}
                                    className="text-xs text-gray-400 hover:text-red-500 font-medium transition-colors px-2"
                                >
                                    Clear all
                                </button>
                            </div>
                        )}

                        {/* Loading State */}
                        {loading ? (
                            <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                                {Array.from({ length: 12 }).map((_, i) => (
                                    <div key={i} className="bg-white border border-gray-100 rounded-2xl overflow-hidden animate-pulse">
                                        <div className="aspect-[4/5] bg-gray-100" />
                                        <div className="p-4 space-y-3">
                                            <div className="h-3 bg-gray-100 rounded-full w-16" />
                                            <div className="h-4 bg-gray-100 rounded-full w-full" />
                                            <div className="h-4 bg-gray-100 rounded-full w-3/4" />
                                            <div className="flex justify-between pt-2">
                                                <div className="h-5 bg-gray-100 rounded-full w-20" />
                                                <div className="h-8 w-8 bg-gray-100 rounded-full" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <>
                                {/* Products Grid */}
                                <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                                    {filteredProducts.map((product, index) => (
                                        <div
                                            key={product.id}
                                            data-aos="fade-up"
                                            data-aos-delay={(index % 12) * 40}
                                            className={`product-grid-card group ${viewMode === 'list' ? 'flex' : ''}`}
                                        >
                                            <Link href={`/products/${product.slug}`} className={`block ${viewMode === 'list' ? 'flex flex-1' : ''}`}>
                                                {/* Image */}
                                                <div className={`relative overflow-hidden bg-gray-50 ${viewMode === 'list' ? 'w-44 flex-shrink-0' : 'aspect-[4/5]'}`}>
                                                    {product.image ? (
                                                        <img
                                                            src={product.image}
                                                            alt={product.name}
                                                            className="w-full h-full object-cover product-image"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-200 min-h-[180px]">
                                                            <ShoppingCart size={40} strokeWidth={1.2} />
                                                        </div>
                                                    )}

                                                    {/* Gradient Overlay on Hover */}
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                                    {/* Badges */}
                                                    <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
                                                        {product.discount_percent > 0 && (
                                                            <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm">
                                                                -{product.discount_percent}%
                                                            </span>
                                                        )}
                                                        {product.is_featured && (
                                                            <span className="bg-accent-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm">
                                                                HOT
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Rating Badge on Hover */}
                                                    <div className="absolute top-3 right-3 z-10 product-action-overlay">
                                                        <div className="flex items-center gap-1 bg-white/95 backdrop-blur-md px-2 py-1 rounded-md shadow-sm">
                                                            <Star size={10} className="text-amber-400 fill-amber-400" />
                                                            <span className="text-[10px] font-bold text-gray-800">{displayRating(product).toFixed(1)}</span>
                                                        </div>
                                                    </div>

                                                    {/* Wishlist Button */}
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
                                                        className={`absolute bottom-3 right-3 w-9 h-9 rounded-full flex items-center justify-center shadow-md transition-all product-action-overlay z-10 ${isWishlisted(product.id)
                                                            ? 'bg-red-500 text-white scale-100'
                                                            : 'bg-white/95 backdrop-blur-sm text-gray-400 hover:text-red-500 border border-white/20'
                                                            }`}
                                                    >
                                                        <Heart size={15} className={isWishlisted(product.id) ? 'fill-current' : ''} />
                                                    </button>
                                                </div>

                                                {/* Content */}
                                                <div className="p-4 flex-1 flex flex-col">
                                                    {/* Category */}
                                                    <span className="text-[10px] font-bold tracking-widest text-accent-500 uppercase mb-1.5">
                                                        {product.category?.name || 'Curated'}
                                                    </span>

                                                    {/* Title */}
                                                    <h3 className="font-semibold text-gray-900 text-sm leading-snug mb-1 line-clamp-2 group-hover:text-accent-600 transition-colors min-h-[2.5rem]">
                                                        {product.name}
                                                    </h3>

                                                    {/* Rating inline */}
                                                    <div className="flex items-center gap-1 mb-3">
                                                        <div className="flex items-center">
                                                            {[1, 2, 3, 4, 5].map((star) => (
                                                                <Star
                                                                    key={star}
                                                                    size={11}
                                                                    className={star <= Math.round(displayRating(product)) ? 'fill-amber-400 text-amber-400' : 'text-gray-200 fill-gray-200'}
                                                                />
                                                            ))}
                                                        </div>
                                                        <span className="text-[10px] text-gray-400 ml-0.5">({product.review_count || 128})</span>
                                                    </div>

                                                    {/* Price & Cart Actions */}
                                                    <div className="mt-auto flex flex-col pt-3 border-t border-gray-50">
                                                        <div className="flex items-end justify-between mb-3">
                                                            <div className="flex flex-col">
                                                                <span className="text-base font-bold text-gray-900 tracking-tight">
                                                                    ₹{product.current_price.toLocaleString()}
                                                                </span>
                                                                {product.price > product.current_price && (
                                                                    <span className="text-[11px] text-gray-400 line-through">
                                                                        ₹{product.price.toLocaleString()}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    e.preventDefault();
                                                                    addItem(product as any);
                                                                }}
                                                                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2 bg-gray-50 border border-gray-100 text-gray-600 rounded-xl font-bold text-[10px] hover:bg-gray-100 hover:text-gray-900 active:scale-95 transition-all"
                                                            >
                                                                <ShoppingCart size={12} /> Add
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    e.preventDefault();
                                                                    addItem(product as any);
                                                                    router.push('/checkout');
                                                                }}
                                                                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2 bg-accent-500 text-white rounded-xl font-bold text-[10px] hover:bg-accent-600 active:scale-95 transition-all shadow-sm shadow-accent-500/20"
                                                            >
                                                                Buy Now
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </Link>
                                        </div>
                                    ))}
                                </div>

                                {/* Empty State */}
                                {filteredProducts.length === 0 && (
                                    <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
                                        <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
                                            <ShoppingCart size={28} className="text-gray-300" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-1">No products found</h3>
                                        <p className="text-gray-500 text-sm mb-6">Try adjusting your filters or search criteria</p>
                                        <button
                                            onClick={() => {
                                                setSelectedCategories([]);
                                                setPriceRange([0, 10000]);
                                            }}
                                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent-50 text-accent-600 rounded-xl text-sm font-semibold hover:bg-accent-100 transition-colors"
                                        >
                                            Clear all filters
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile Filter Drawer */}
            {showFilters && (
                <>
                    <div className="filter-drawer-overlay" onClick={() => setShowFilters(false)} />
                    <div className="filter-drawer">
                        {/* Drawer Handle */}
                        <div className="flex justify-center py-3">
                            <div className="w-10 h-1 bg-gray-300 rounded-full" />
                        </div>

                        {/* Drawer Header */}
                        <div className="flex items-center justify-between px-5 pb-4 border-b border-gray-100">
                            <div className="flex items-center gap-2.5">
                                <SlidersHorizontal size={16} className="text-accent-500" />
                                <h2 className="font-semibold text-gray-900">Filters</h2>
                            </div>
                            <button onClick={() => setShowFilters(false)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">
                                <X size={16} />
                            </button>
                        </div>

                        {/* Drawer Content */}
                        <div className="px-5 py-4">
                            {/* Categories */}
                            <h3 className="filter-section-title">Categories</h3>
                            <div className="space-y-0.5 max-h-[240px] overflow-y-auto mb-6">
                                {flatCategories.map((category) => (
                                    <label
                                        key={category.slug}
                                        className={`flex items-center gap-2.5 px-2 py-2 rounded-lg cursor-pointer select-none transition-all ${selectedCategories.includes(category.slug) ? 'bg-accent-50' : ''}`}
                                        style={{ paddingLeft: `${8 + category.depth * 14}px` }}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedCategories.includes(category.slug)}
                                            onChange={() => toggleCategory(category.slug)}
                                            className="filter-checkbox"
                                        />
                                        <span className={`text-sm ${selectedCategories.includes(category.slug) ? 'font-semibold text-accent-600' : 'text-gray-600'}`}>
                                            {category.name}
                                        </span>
                                    </label>
                                ))}
                            </div>

                            {/* Price Range */}
                            <h3 className="filter-section-title">Price Range</h3>
                            <div className="grid grid-cols-2 gap-2 mb-6">
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">₹</span>
                                    <input
                                        type="number"
                                        placeholder="Min"
                                        value={priceRange[0]}
                                        onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                                        className="w-full pl-6 pr-2 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm text-gray-900 outline-none focus:border-accent-500/40"
                                    />
                                </div>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">₹</span>
                                    <input
                                        type="number"
                                        placeholder="Max"
                                        value={priceRange[1]}
                                        onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                                        className="w-full pl-6 pr-2 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm text-gray-900 outline-none focus:border-accent-500/40"
                                    />
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-4 border-t border-gray-100">
                                <button
                                    onClick={() => {
                                        setSelectedCategories([]);
                                        setPriceRange([0, 10000]);
                                    }}
                                    className="flex-1 py-3 text-sm font-semibold text-gray-500 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                                >
                                    Reset
                                </button>
                                <button
                                    onClick={() => setShowFilters(false)}
                                    className="flex-1 py-3 text-sm font-semibold text-white bg-accent-500 rounded-xl hover:bg-accent-600 transition-colors"
                                >
                                    Apply Filters
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
