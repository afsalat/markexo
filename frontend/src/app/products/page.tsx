'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Filter, Grid, List, ChevronDown, X, ShoppingCart, Star, Heart } from 'lucide-react';

// Sample products data
const sampleProducts = [
    { id: 1, name: 'Premium Wireless Headphones', slug: 'premium-wireless-headphones', price: 4999, sale_price: 2999, current_price: 2999, discount_percent: 40, image: null, shop: { name: 'TechZone' }, category: { name: 'Electronics' }, is_featured: true, stock: 15 },
    { id: 2, name: 'Organic Cotton T-Shirt', slug: 'organic-cotton-tshirt', price: 1499, sale_price: null, current_price: 1499, discount_percent: 0, image: null, shop: { name: 'FashionHub' }, category: { name: 'Fashion' }, is_featured: false, stock: 50 },
    { id: 3, name: 'Smart Fitness Watch', slug: 'smart-fitness-watch', price: 8999, sale_price: 5999, current_price: 5999, discount_percent: 33, image: null, shop: { name: 'TechZone' }, category: { name: 'Electronics' }, is_featured: true, stock: 8 },
    { id: 4, name: 'Handcrafted Leather Wallet', slug: 'handcrafted-leather-wallet', price: 2499, sale_price: 1999, current_price: 1999, discount_percent: 20, image: null, shop: { name: 'ArtisanStore' }, category: { name: 'Accessories' }, is_featured: true, stock: 25 },
    { id: 5, name: 'Bluetooth Speaker', slug: 'bluetooth-speaker', price: 3499, sale_price: 2499, current_price: 2499, discount_percent: 29, image: null, shop: { name: 'TechZone' }, category: { name: 'Electronics' }, is_featured: false, stock: 12 },
    { id: 6, name: 'Running Shoes', slug: 'running-shoes', price: 5999, sale_price: 4499, current_price: 4499, discount_percent: 25, image: null, shop: { name: 'SportsWorld' }, category: { name: 'Sports' }, is_featured: true, stock: 20 },
    { id: 7, name: 'Yoga Mat Premium', slug: 'yoga-mat-premium', price: 1999, sale_price: null, current_price: 1999, discount_percent: 0, image: null, shop: { name: 'SportsWorld' }, category: { name: 'Sports' }, is_featured: false, stock: 30 },
    { id: 8, name: 'Ceramic Coffee Mug Set', slug: 'ceramic-coffee-mug-set', price: 899, sale_price: 699, current_price: 699, discount_percent: 22, image: null, shop: { name: 'HomeDecor' }, category: { name: 'Home & Living' }, is_featured: false, stock: 45 },
];

const categories = ['Electronics', 'Fashion', 'Sports', 'Home & Living', 'Accessories', 'Books', 'Beauty'];
const shops = ['TechZone', 'FashionHub', 'SportsWorld', 'HomeDecor', 'ArtisanStore'];

export default function ProductsPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>}>
            <ProductsPageContent />
        </Suspense>
    );
}

function ProductsPageContent() {
    const searchParams = useSearchParams();
    const searchQuery = searchParams.get('search') || '';
    const categoryParam = searchParams.get('category');

    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [showFilters, setShowFilters] = useState(false);

    // Initialize selectedCategories with URL param if present
    const [selectedCategories, setSelectedCategories] = useState<string[]>(
        categoryParam ? [categoryParam.charAt(0).toUpperCase() + categoryParam.slice(1)] : []
    );

    const [selectedShops, setSelectedShops] = useState<string[]>([]);
    const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
    const [sortBy, setSortBy] = useState('newest');

    const toggleCategory = (category: string) => {
        setSelectedCategories((prev) =>
            prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
        );
    };

    const toggleShop = (shop: string) => {
        setSelectedShops((prev) =>
            prev.includes(shop) ? prev.filter((s) => s !== shop) : [...prev, shop]
        );
    };

    const filteredProducts = sampleProducts.filter((product) => {
        // Search Filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            const matchesSearch =
                product.name.toLowerCase().includes(query) ||
                product.shop.name.toLowerCase().includes(query) ||
                product.category.name.toLowerCase().includes(query);

            if (!matchesSearch) return false;
        }

        if (selectedCategories.length && !selectedCategories.includes(product.category.name)) return false;
        if (selectedShops.length && !selectedShops.includes(product.shop.name)) return false;
        if (product.current_price < priceRange[0] || product.current_price > priceRange[1]) return false;
        return true;
    });

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Page Header */}
            <div className="bg-white border-b border-gray-100">
                <div className="container mx-auto px-4 py-6">
                    <nav className="text-sm text-gray-500 mb-2">
                        <Link href="/" className="hover:text-primary-600">Home</Link>
                        <span className="mx-2">/</span>
                        <span className="text-gray-900">Products</span>
                    </nav>
                    <h1 className="font-display text-3xl font-bold text-gray-900">
                        {searchQuery ? `Search Results for "${searchQuery}"` : 'All Products'}
                    </h1>
                    <p className="text-gray-500 mt-1">{filteredProducts.length} products found</p>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                <div className="flex gap-8">
                    {/* Filters Sidebar - Desktop */}
                    <aside className="hidden lg:block w-64 flex-shrink-0">
                        <div className="bg-white rounded-2xl p-6 shadow-sm sticky top-24">
                            <h2 className="font-semibold text-lg mb-4">Filters</h2>

                            {/* Categories */}
                            <div className="mb-6">
                                <h3 className="font-medium text-gray-900 mb-3">Categories</h3>
                                <div className="space-y-2">
                                    {categories.map((category) => (
                                        <label key={category} className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={selectedCategories.includes(category)}
                                                onChange={() => toggleCategory(category)}
                                                className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                            />
                                            <span className="text-gray-700">{category}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Shops */}
                            <div className="mb-6">
                                <h3 className="font-medium text-gray-900 mb-3">Shops</h3>
                                <div className="space-y-2">
                                    {shops.map((shop) => (
                                        <label key={shop} className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={selectedShops.includes(shop)}
                                                onChange={() => toggleShop(shop)}
                                                className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                            />
                                            <span className="text-gray-700">{shop}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Price Range */}
                            <div className="mb-6">
                                <h3 className="font-medium text-gray-900 mb-3">Price Range</h3>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        placeholder="Min"
                                        value={priceRange[0]}
                                        onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                    />
                                    <span>-</span>
                                    <input
                                        type="number"
                                        placeholder="Max"
                                        value={priceRange[1]}
                                        onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                    />
                                </div>
                            </div>

                            {/* Clear Filters */}
                            <button
                                onClick={() => {
                                    setSelectedCategories([]);
                                    setSelectedShops([]);
                                    setPriceRange([0, 10000]);
                                }}
                                className="w-full py-2 text-sm text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                            >
                                Clear All Filters
                            </button>
                        </div>
                    </aside>

                    {/* Products Grid */}
                    <div className="flex-1">
                        {/* Toolbar */}
                        <div className="bg-white rounded-xl p-4 shadow-sm mb-6 flex items-center justify-between gap-4">
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className="lg:hidden flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
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
                                        className="appearance-none px-4 py-2 pr-10 border border-gray-200 rounded-lg bg-white cursor-pointer"
                                    >
                                        <option value="newest">Newest First</option>
                                        <option value="price_low">Price: Low to High</option>
                                        <option value="price_high">Price: High to Low</option>
                                        <option value="popular">Most Popular</option>
                                    </select>
                                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                </div>

                                {/* View Mode */}
                                <div className="hidden sm:flex items-center gap-1 border border-gray-200 rounded-lg p-1">
                                    <button
                                        onClick={() => setViewMode('grid')}
                                        className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-primary-100 text-primary-600' : 'hover:bg-gray-100'}`}
                                    >
                                        <Grid size={18} />
                                    </button>
                                    <button
                                        onClick={() => setViewMode('list')}
                                        className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-primary-100 text-primary-600' : 'hover:bg-gray-100'}`}
                                    >
                                        <List size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Active Filters */}
                        {(selectedCategories.length > 0 || selectedShops.length > 0) && (
                            <div className="flex flex-wrap gap-2 mb-4">
                                {selectedCategories.map((cat) => (
                                    <span key={cat} className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">
                                        {cat}
                                        <button onClick={() => toggleCategory(cat)}><X size={14} /></button>
                                    </span>
                                ))}
                                {selectedShops.map((shop) => (
                                    <span key={shop} className="inline-flex items-center gap-1 px-3 py-1 bg-accent-100 text-accent-700 rounded-full text-sm">
                                        {shop}
                                        <button onClick={() => toggleShop(shop)}><X size={14} /></button>
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Products */}
                        <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'}`}>
                            {filteredProducts.map((product) => (
                                <div key={product.id} className={`product-card bg-white rounded-2xl overflow-hidden shadow-md group ${viewMode === 'list' ? 'flex' : ''}`}>
                                    {/* Image */}
                                    <div className={`relative bg-gray-100 ${viewMode === 'list' ? 'w-48 flex-shrink-0' : 'aspect-square'}`}>
                                        <div className="w-full h-full flex items-center justify-center text-gray-400 min-h-[12rem]">
                                            <ShoppingCart size={48} />
                                        </div>
                                        {product.discount_percent > 0 && (
                                            <span className="absolute top-3 left-3 badge badge-sale">-{product.discount_percent}%</span>
                                        )}
                                        <button className="absolute top-3 right-3 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Heart size={18} className="text-gray-600" />
                                        </button>
                                    </div>

                                    {/* Content */}
                                    <div className="p-4 flex-1">
                                        <span className="text-xs text-primary-600 font-medium bg-primary-50 px-2 py-1 rounded-full">
                                            {product.category.name}
                                        </span>
                                        <Link href={`/products/${product.slug}`}>
                                            <h3 className="font-semibold text-gray-900 mt-2 line-clamp-2 hover:text-primary-600 transition-colors">
                                                {product.name}
                                            </h3>
                                        </Link>
                                        <p className="text-sm text-gray-500 mt-1">by {product.shop.name}</p>
                                        <div className="flex items-center gap-1 mt-2">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <Star key={star} size={14} className={star <= 4 ? 'fill-accent-400 text-accent-400' : 'text-gray-300'} />
                                            ))}
                                        </div>
                                        <div className="flex items-center justify-between mt-3">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xl font-bold text-gray-900">₹{product.current_price.toLocaleString()}</span>
                                                {product.sale_price && (
                                                    <span className="text-sm text-gray-400 line-through">₹{product.price.toLocaleString()}</span>
                                                )}
                                            </div>
                                            <button className="btn-primary text-sm py-2 px-4">Add</button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {filteredProducts.length === 0 && (
                            <div className="text-center py-16">
                                <ShoppingCart size={64} className="mx-auto text-gray-300 mb-4" />
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">No products found</h3>
                                <p className="text-gray-500">Try adjusting your filters</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
