'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Filter, Grid, List, ChevronDown, X, ShoppingCart, Star, Heart, SlidersHorizontal, Search } from 'lucide-react';
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

export default function ProductsPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-dark-900 flex items-center justify-center text-white">Loading...</div>}>
            <ProductsPageContent />
        </Suspense>
    );
}

function ProductsPageContent() {
    const searchParams = useSearchParams();
    const searchQuery = searchParams.get('search') || '';
    const categoryParam = searchParams.get('category');
    const featuredParam = searchParams.get('featured');
    const sortParam = searchParams.get('sort');

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
    const [sortBy, setSortBy] = useState(sortParam || 'newest');
    const [showFeaturedOnly, setShowFeaturedOnly] = useState(featuredParam === 'true');
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
                    fetchProducts(),
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
    }, [categoryParam]);

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

        return true; // Product passed all filters
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

    console.log('🔍 Filtering Debug:', {
        totalProducts: products.length,
        filters: { searchQuery, selectedCategories, priceRange },
        filteredCount: filteredProducts.length,
        sampleProduct: products[0],
        allProducts: products.map(p => ({ id: p.id, name: p.name, is_active: p.is_active, category: p.category?.name }))
    });

    console.log('🔬 Sample Product Full Structure:', products[0]);

    // Determine page title based on filters
    const getPageTitle = () => {
        if (searchQuery) return `Search Results for "${searchQuery}"`;
        if (showFeaturedOnly) return 'Trending Now';
        if (sortParam === 'newest') return 'New Arrivals';
        return 'All Products';
    };

    return (
        <div className="min-h-screen bg-dark-900">
            {/* Page Header */}
            <div className="bg-dark-900 border-b border-dark-700">
                <div className="w-full max-w-[1920px] mx-auto px-6 lg:px-12 py-6">
                    <nav className="text-sm text-silver-500 mb-2" data-aos="fade-down" data-aos-delay="0">
                        <Link href="/" className="hover:text-accent-500">Home</Link>
                        <span className="mx-2">/</span>
                        <span className="text-white">{getPageTitle()}</span>
                    </nav>
                    <h1 className="font-display text-3xl font-bold text-white" data-aos="fade-right" data-aos-delay="100">
                        {getPageTitle()}
                    </h1>
                    <p className="text-silver-500 mt-1" data-aos="fade-right" data-aos-delay="200">{filteredProducts.length} products found</p>
                </div>
            </div>

            <div className="w-full max-w-[1920px] mx-auto px-6 lg:px-12 py-8">
                <div className="flex gap-8">
                    {/* Filters Sidebar - Desktop */}
                    <aside className="hidden lg:block w-64 flex-shrink-0 sticky top-28 self-start max-h-[calc(100vh-7rem)] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']" data-aos="fade-right" data-aos-delay="300">
                        <div className="bg-dark-800 rounded-2xl p-5 border border-dark-700 shadow-lg shadow-dark-950/20">
                            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-dark-700">
                                <SlidersHorizontal size={18} className="text-accent-500" />
                                <h2 className="font-semibold text-base text-white">Refine Results</h2>
                            </div>

                            {/* Categories */}
                            <div className="mb-6">
                                <h3 className="font-medium text-white mb-4 text-sm uppercase tracking-wider text-silver-400">Categories</h3>

                                {/* Category Search Input */}
                                <div className="relative mb-3">
                                    <input
                                        type="text"
                                        placeholder="Search categories..."
                                        value={categorySearchArg}
                                        onChange={(e) => setCategorySearchArg(e.target.value)}
                                        className="w-full pl-8 pr-3 py-2 bg-dark-900 border border-dark-600 rounded-lg text-sm text-white focus:border-accent-500 outline-none transition-colors"
                                    />
                                    <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-silver-500" />
                                </div>

                                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                    {visibleCategories.map((category) => (
                                        <label
                                            key={category.slug}
                                            className="flex items-start gap-3 cursor-pointer group select-none"
                                            style={{ paddingLeft: `${category.depth * 14}px` }}
                                        >
                                            <div className="relative flex items-center mt-1">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedCategories.includes(category.slug)}
                                                    onChange={() => toggleCategory(category.slug)}
                                                    className="peer appearance-none w-5 h-5 rounded-md border border-dark-600 bg-dark-900 checked:bg-accent-500 checked:border-accent-500 transition-colors cursor-pointer"
                                                />
                                                <svg
                                                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 text-dark-900 opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none"
                                                    viewBox="0 0 14 14"
                                                    fill="none"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                >
                                                    <path d="M11.6666 3.5L5.24992 9.91667L2.33325 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            </div>
                                            <span className={`text-sm transition-colors leading-relaxed ${category.depth === 0 ? 'font-semibold text-silver-200 group-hover:text-white' : 'text-silver-300 group-hover:text-white'}`}>
                                                {category.depth > 0 ? `${'-- '.repeat(category.depth)}${category.name}` : category.name}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Price Range */}
                            <div className="mb-8">
                                <h3 className="font-medium text-white mb-4 text-sm uppercase tracking-wider text-silver-400">Price Range</h3>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-silver-500 text-sm">₹</span>
                                            <input
                                                type="number"
                                                placeholder="Min"
                                                value={priceRange[0]}
                                                onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                                                className="w-full pl-6 pr-3 py-2.5 bg-dark-900 border border-dark-600 rounded-lg text-sm text-white focus:border-accent-500 outline-none transition-colors"
                                            />
                                        </div>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-silver-500 text-sm">₹</span>
                                            <input
                                                type="number"
                                                placeholder="Max"
                                                value={priceRange[1]}
                                                onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                                                className="w-full pl-6 pr-3 py-2.5 bg-dark-900 border border-dark-600 rounded-lg text-sm text-white focus:border-accent-500 outline-none transition-colors"
                                            />
                                        </div>
                                    </div>
                                    {/* Visual Range Indicator (Static for now) */}
                                    <div className="h-1.5 w-full bg-dark-700 rounded-full overflow-hidden">
                                        <div className="h-full bg-accent-500/50 w-full rounded-full"></div>
                                    </div>
                                </div>
                            </div>

                            {/* Clear Filters */}
                            <button
                                onClick={() => {
                                    setSelectedCategories([]);
                                    setPriceRange([0, 10000]);
                                }}
                                className="w-full py-3 text-sm font-medium text-accent-500 hover:text-accent-400 hover:bg-accent-500/5 border border-dashed border-accent-500/30 rounded-xl transition-all"
                            >
                                Clear All Filters
                            </button>
                        </div>
                    </aside>

                    {/* Products Grid */}
                    <div className="flex-1">
                        {/* Toolbar */}
                        <div className="bg-dark-800 border border-dark-700 rounded-xl p-4 mb-6 flex items-center justify-between gap-4" data-aos="fade-up" data-aos-delay="400">
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className="lg:hidden flex items-center gap-2 px-4 py-2 border border-dark-600 text-white rounded-lg hover:bg-dark-700"
                            >
                                <Filter size={18} />
                                Filters
                            </button>

                            <div className="flex items-center gap-4 ml-auto">
                                {/* Sort */}
                                <div className="relative">
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                        className="sort-select appearance-none px-4 py-2 pr-10 bg-dark-700 border border-dark-600 text-white rounded-lg cursor-pointer focus:border-accent-500 outline-none"
                                    >
                                        <option value="newest">Newest First</option>
                                        <option value="price_low">Price: Low to High</option>
                                        <option value="price_high">Price: High to Low</option>
                                        <option value="popular">Most Popular</option>
                                    </select>
                                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-silver-500 pointer-events-none" />
                                </div>

                                {/* View Mode */}
                                <div className="hidden sm:flex items-center gap-1 border border-dark-600 rounded-lg p-1">
                                    <button
                                        onClick={() => setViewMode('grid')}
                                        className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-accent-500/10 text-accent-500' : 'text-silver-500 hover:bg-dark-700'}`}
                                    >
                                        <Grid size={18} />
                                    </button>
                                    <button
                                        onClick={() => setViewMode('list')}
                                        className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-accent-500/10 text-accent-500' : 'text-silver-500 hover:bg-dark-700'}`}
                                    >
                                        <List size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Active Filters */}
                        {selectedCategories.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-4">
                                {selectedCategories.map((slug) => (
                                    <span key={slug} className="inline-flex items-center gap-1 px-3 py-1 bg-accent-500/10 text-accent-500 rounded-full text-sm border border-accent-500/20">
                                        {categoryLookup.get(slug)?.name || slug}
                                        <button onClick={() => toggleCategory(slug)} className="hover:text-white transition-colors"><X size={14} /></button>
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Products */}
                        <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
                            {filteredProducts.map((product, index) => (
                                <div key={product.id} data-aos="fade-up" data-aos-delay={(index % 12) * 50} className={`product-card group relative bg-dark-800 border border-dark-700 rounded-2xl overflow-hidden shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-accent-500/20 hover:border-accent-500/40 ${viewMode === 'list' ? 'flex' : ''}`}>
                                    <Link href={`/products/${product.slug}`} className={`block relative overflow-hidden ${viewMode === 'list' ? 'flex flex-1' : ''}`}>
                                        {/* Image Container */}
                                        <div className={`relative bg-dark-700 overflow-hidden ${viewMode === 'list' ? 'w-48 flex-shrink-0' : 'aspect-[4/5]'}`}>
                                            {product.image ? (
                                                <img
                                                    src={product.image}
                                                    alt={product.name}
                                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-dark-500 min-h-[12rem]">
                                                    <ShoppingCart size={48} />
                                                </div>
                                            )}

                                            {/* Overlay Gradient on Hover */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                                            {/* Badges */}
                                            <div className="absolute top-3 left-3 flex flex-col gap-2">
                                                {product.discount_percent > 0 && (
                                                    <span className="badge badge-sale shadow-md backdrop-blur-md">-{product.discount_percent}%</span>
                                                )}
                                                {product.is_featured && (
                                                    <span className="badge badge-featured shadow-md backdrop-blur-md">Hot</span>
                                                )}
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
                                                className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center shadow-lg transition-all transform hover:scale-110 z-10 ${isWishlisted(product.id)
                                                    ? 'bg-red-500 text-white'
                                                    : 'bg-white/10 backdrop-blur-md text-white hover:bg-accent-500 hover:text-dark-900 border border-white/20'
                                                    }`}>
                                                <Heart size={16} className={isWishlisted(product.id) ? 'fill-current' : ''} />
                                            </button>
                                        </div>

                                        {/* Content */}
                                        <div className="p-5 flex-1 flex flex-col relative z-10">
                                            <div className="mb-2 flex items-start justify-between gap-2">
                                                <span className="text-[10px] font-bold tracking-wider text-accent-500 uppercase bg-accent-500/10 px-2.5 py-1 rounded-full border border-accent-500/20">
                                                    {product.category?.name || 'General'}
                                                </span>
                                                <div className="flex items-center gap-0.5 bg-dark-900/50 px-1.5 py-0.5 rounded-lg border border-dark-600">
                                                    <Star size={12} className="text-amber-400 fill-amber-400" />
                                                    <span className="text-xs font-bold text-white">4.5</span>
                                                </div>
                                            </div>

                                            <h3 className="font-bold text-white text-lg leading-tight mb-2 line-clamp-2 group-hover:text-accent-500 transition-colors">
                                                {product.name}
                                            </h3>

                                            <div className="mt-auto pt-3 flex items-end justify-between border-t border-dark-700/50">
                                                <div className="flex flex-col">
                                                    <span className="text-xs text-silver-500 font-medium">Price</span>
                                                    <div className="flex items-baseline gap-2">
                                                        <span className="text-xl font-bold text-white">₹{product.current_price.toLocaleString()}</span>
                                                        {product.sale_price && (
                                                            <span className="text-sm text-silver-500 line-through">₹{product.price.toLocaleString()}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>

                                    {/* Action Buttons - Slide up on hover for Desktop, Static on Mobile */}
                                    <div className="p-4 pt-0 flex gap-2">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                e.preventDefault();
                                                addItem(product as any);
                                            }}
                                            className="flex-1 btn-ghost text-xs font-bold py-2.5 rounded-xl border-dashed border-dark-600 hover:border-accent-500 hover:bg-accent-500/10 hover:text-accent-500 transition-all">
                                            Add to Cart
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                e.preventDefault();
                                                addItem(product as any);
                                                window.location.href = '/cart';
                                            }}
                                            className="flex-1 btn-primary text-xs font-bold py-2.5 rounded-xl shadow-lg shadow-accent-500/20">
                                            Buy Now
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {filteredProducts.length === 0 && (
                            <div className="text-center py-16" data-aos="fade-up">
                                <ShoppingCart size={64} className="mx-auto text-dark-600 mb-4" />
                                <h3 className="text-xl font-semibold text-white mb-2">No products found</h3>
                                <p className="text-silver-500">Try adjusting your filters</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div >
    );
}
