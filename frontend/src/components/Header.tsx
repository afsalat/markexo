'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, Search, Menu, X, User, ChevronDown, Truck, Shield, Sun, Moon } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useCart } from '@/lib/cart';
import { useRouter } from 'next/navigation';
import { useCustomerAuth } from '@/context/CustomerAuthContext';
import { useTheme } from '@/context/ThemeContext';
import { fetchProducts, fetchCategories } from '@/lib/api';

export default function Header() {
    const router = useRouter();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
    const categoriesRef = useRef<HTMLLIElement>(null);
    const { totalItems } = useCart();
    const { customer, isAuthenticated, logout } = useCustomerAuth();
    const { theme, toggleTheme } = useTheme();
    const [isScrolled, setIsScrolled] = useState(false);
    const [categories, setCategories] = useState<any[]>([]);
    const [isLoadingCategories, setIsLoadingCategories] = useState(false);
    const megaMenuTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Handle scroll for shrink effect
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Fetch categories for mega-menu
    useEffect(() => {
        const loadCategories = async () => {
            setIsLoadingCategories(true);
            try {
                const data = await fetchCategories();
                setCategories(data.results || []);
            } catch (error) {
                console.error('Failed to fetch categories:', error);
            } finally {
                setIsLoadingCategories(false);
            }
        };
        loadCategories();
    }, []);

    const handleMouseEnterCategories = () => {
        if (megaMenuTimerRef.current) clearTimeout(megaMenuTimerRef.current);
        setIsCategoriesOpen(true);
    };

    const handleMouseLeaveCategories = () => {
        megaMenuTimerRef.current = setTimeout(() => {
            setIsCategoriesOpen(false);
        }, 300); // 300ms delay to give user time to move cursor to menu
    };

    // Debounce search suggestions
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchQuery.trim().length >= 2) {
                setIsLoadingSuggestions(true);
                try {
                    const [productsData, categoriesData] = await Promise.all([
                        fetchProducts({ search: searchQuery, page_size: '4' }),
                        fetchCategories({ search: searchQuery })
                    ]);

                    const products = (productsData.results || []).map((p: any) => ({ ...p, type: 'product' }));
                    const categories = (categoriesData.results || []).slice(0, 2).map((c: any) => ({ ...c, type: 'category' }));

                    setSuggestions([...categories, ...products]);
                    setShowSuggestions(true);
                } catch (error) {
                    console.error('Failed to fetch suggestions:', error);
                    setSuggestions([]);
                } finally {
                    setIsLoadingSuggestions(false);
                }
            } else {
                setSuggestions([]);
                setShowSuggestions(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Close suggestions on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
            if (categoriesRef.current && !categoriesRef.current.contains(event.target as Node)) {
                setIsCategoriesOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearch = () => {
        if (searchQuery.trim()) {
            router.push(`/products?search=${encodeURIComponent(searchQuery)}`);
            setIsSearchOpen(false);
            setShowSuggestions(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const handleSuggestionClick = (slug: string, type: string = 'product') => {
        if (type === 'category') {
            router.push(`/products?category=${slug}`);
        } else {
            router.push(`/products/${slug}`);
        }
        setSearchQuery('');
        setShowSuggestions(false);
        setIsSearchOpen(false);
    };

    return (
        <header className={`sticky top-0 z-50 transition-all duration-300 ${isScrolled ? 'shadow-xl bg-dark-900/95 backdrop-blur-md' : 'bg-dark-900'}`}>
            {/* Top Bar - Trust Signals - Hide on scroll */}
            <div className={`overflow-hidden transition-all duration-300 ease-in-out bg-gradient-to-r from-dark-800 via-dark-700 to-dark-800 text-silver-300 text-sm border-b border-dark-600 ${isScrolled ? 'h-0 opacity-0 border-transparent' : 'h-[36px] opacity-100'}`}>
                <div className="container mx-auto px-4 h-full flex justify-between items-center">
                    <div className="flex items-center gap-6">
                        <span className="flex items-center gap-2 text-accent-500 font-medium">
                            <Truck size={16} />
                            Cash on Delivery Available
                        </span>
                        <span className="hidden sm:flex items-center gap-2">
                            <Shield size={16} className="text-accent-500" />
                            Premium Quality Guaranteed
                        </span>
                    </div>
                    <div className="hidden md:flex gap-4 text-silver-400">
                        <Link href="/track-order" className="hover:text-accent-500 transition-colors">Track Order</Link>
                        <Link href="/contact" className="hover:text-accent-500 transition-colors">Contact</Link>
                    </div>
                </div>
            </div>

            {/* Main Header */}
            <div className={`container mx-auto px-4 transition-all duration-300 ${isScrolled ? 'py-2' : 'py-4'}`}>
                <div className="flex items-center justify-between gap-4">
                    {/* Logo */}
                    <Link href="/" className="flex items-center group">
                        <img
                            src="/logo-white-text.png"
                            alt="VorionMart"
                            className="h-12 md:h-16 w-auto object-contain transition-all duration-300"
                        />
                    </Link>

                    {/* Search Bar - Desktop */}
                    <div className="hidden md:flex flex-1 max-w-xl mx-8" ref={searchRef}>
                        <div className="relative w-full">
                            <input
                                type="text"
                                placeholder="Search premium products..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={handleKeyDown}
                                onFocus={() => searchQuery.length >= 2 && setShowSuggestions(true)}
                                className={`w-full pl-4 pr-12 rounded-xl bg-dark-800 border border-dark-700 text-white placeholder:text-silver-500 focus:border-accent-500 focus:ring-1 focus:ring-accent-500/20 outline-none transition-all ${isScrolled ? 'py-2' : 'py-3'}`}
                            />
                            <button
                                onClick={handleSearch}
                                className="absolute right-2 top-1/2 -translate-y-1/2 bg-accent-500 text-dark-900 p-2 rounded-lg hover:bg-accent-400 transition-colors scale-90"
                            >
                                <Search size={18} />
                            </button>

                            {/* Search Suggestions Dropdown */}
                            {showSuggestions && (suggestions.length > 0 || isLoadingSuggestions) && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-dark-800 border border-dark-700 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                    {isLoadingSuggestions ? (
                                        <div className="px-4 py-3 text-silver-400 text-sm">Searching...</div>
                                    ) : (
                                        <>
                                            {suggestions.map((item) => (
                                                <button
                                                    key={`${item.type}-${item.id}`}
                                                    onClick={() => handleSuggestionClick(item.slug, item.type)}
                                                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-dark-700 transition-colors text-left"
                                                >
                                                    <img
                                                        src={item.image || '/placeholder.png'}
                                                        alt={item.name}
                                                        className={`w-10 h-10 object-cover ${item.type === 'category' ? 'rounded-full' : 'rounded-lg'}`}
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-white text-sm font-medium truncate">{item.name}</p>
                                                        {item.type === 'product' ? (
                                                            <p className="text-accent-500 text-sm font-bold">₹{(item.current_price || item.price || 0).toLocaleString()}</p>
                                                        ) : (
                                                            <p className="text-silver-400 text-xs mt-0.5">Category</p>
                                                        )}
                                                    </div>
                                                </button>
                                            ))}
                                            <button
                                                onClick={handleSearch}
                                                className="w-full px-4 py-3 text-accent-500 text-sm font-medium hover:bg-dark-700 transition-colors border-t border-dark-700"
                                            >
                                                View all results for "{searchQuery}"
                                            </button>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center gap-3">
                        {/* Mobile Search Toggle */}
                        <button
                            onClick={() => setIsSearchOpen(!isSearchOpen)}
                            className="md:hidden p-2 hover:bg-dark-700 rounded-lg transition-colors text-silver-300"
                        >
                            <Search size={22} />
                        </button>


                        {/* Cart */}
                        <Link
                            href="/cart"
                            className="relative flex items-center gap-2 px-4 py-2 hover:bg-dark-700 rounded-xl transition-colors text-silver-200"
                        >
                            <ShoppingCart size={22} />
                            {totalItems > 0 && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent-500 text-dark-900 text-xs font-bold rounded-full flex items-center justify-center">
                                    {totalItems}
                                </span>
                            )}
                            <span className="hidden sm:block font-medium">Cart</span>
                        </Link>

                        {/* Account / Login */}
                        {isAuthenticated && customer ? (
                            <Link
                                href="/profile"
                                className="hidden sm:flex items-center gap-2 px-3 py-1.5 hover:bg-dark-700 rounded-xl transition-colors border border-transparent hover:border-dark-700"
                            >
                                <img
                                    src={customer?.avatar || `https://ui-avatars.com/api/?name=${customer?.name}&background=00f5d4&color=0a0a0f`}
                                    alt={customer?.name}
                                    className="w-8 h-8 rounded-full border border-dark-700"
                                />
                                <div className="text-left hidden lg:block">
                                    <p className="text-xs text-silver-500 font-medium leading-tight">Hello,</p>
                                    <p className="text-sm font-bold text-white leading-tight">{customer?.name.split(' ')[0]}</p>
                                </div>
                            </Link>
                        ) : (
                            <Link
                                href="/login"
                                className="hidden sm:flex items-center gap-2 px-4 py-2 hover:bg-dark-700 rounded-xl transition-colors text-silver-200"
                            >
                                <User size={22} />
                                <span className="font-medium">Login</span>
                            </Link>
                        )}

                        {/* Mobile Menu Toggle */}
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="md:hidden p-2 hover:bg-dark-700 rounded-lg transition-colors text-silver-300"
                        >
                            {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
                        </button>
                    </div>
                </div>

                {/* Mobile Search */}
                {isSearchOpen && (
                    <div className="md:hidden mt-4 animate-in slide-in-from-top-4 duration-300">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search premium products..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="w-full pl-4 pr-12 py-3 rounded-xl bg-dark-800 border border-dark-700 text-white placeholder:text-silver-500 focus:border-accent-500 outline-none"
                            />
                            <button
                                onClick={handleSearch}
                                className="absolute right-2 top-1/2 -translate-y-1/2 bg-accent-500 text-dark-900 p-2 rounded-lg"
                            >
                                <Search size={18} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Category Navigation */}
            <nav className="hidden md:block border-t border-dark-700">
                <div className="container mx-auto px-4">
                    <ul className="flex items-center justify-center gap-8 py-3">
                        <li>
                            <Link href="/" className="font-medium text-silver-300 hover:text-accent-500 transition-colors">
                                Home
                            </Link>
                        </li>
                        <li>
                            <Link href="/products" className="font-medium text-silver-300 hover:text-accent-500 transition-colors">
                                All Collection
                            </Link>
                        </li>
                        <li
                            ref={categoriesRef}
                            className="static group"
                            onMouseEnter={handleMouseEnterCategories}
                            onMouseLeave={handleMouseLeaveCategories}
                        >
                            <button
                                onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
                                className={`flex items-center gap-1 font-medium transition-colors ${isCategoriesOpen ? 'text-accent-500' : 'text-silver-300 hover:text-accent-500'}`}
                            >
                                Categories <ChevronDown size={16} className={`transition-transform duration-200 ${isCategoriesOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {/* Mega Menu Dropdown */}
                            {isCategoriesOpen && (
                                <div
                                    className="absolute left-0 right-0 top-full bg-dark-900 border-y border-dark-700 shadow-2xl z-[100] animate-in fade-in slide-in-from-top-2 duration-300"
                                    onMouseEnter={handleMouseEnterCategories}
                                    onMouseLeave={handleMouseLeaveCategories}
                                >
                                    <div className="container mx-auto px-4 py-8">
                                        {isLoadingCategories ? (
                                            <div className="flex items-center justify-center py-12">
                                                <div className="w-8 h-8 border-2 border-accent-500 border-t-transparent rounded-full animate-spin"></div>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-6 gap-y-10">
                                                {categories.map((category) => (
                                                    <div key={category.id} className="space-y-4">
                                                        <Link
                                                            href={`/products?category=${category.slug}`}
                                                            onClick={() => setIsCategoriesOpen(false)}
                                                            className="block group/title"
                                                        >
                                                            <div className="flex items-center gap-2 mb-2">
                                                                {category.image && (
                                                                    <img
                                                                        src={category.image}
                                                                        alt={category.name}
                                                                        className="w-8 h-8 rounded-lg object-cover border border-dark-700 group-hover/title:border-accent-500 transition-colors"
                                                                    />
                                                                )}
                                                                <h3 className="font-bold text-white group-hover/title:text-accent-500 transition-colors uppercase tracking-wider text-xs">
                                                                    {category.name}
                                                                </h3>
                                                            </div>
                                                            <div className="h-0.5 w-6 bg-accent-500 rounded-full group-hover/title:w-full transition-all duration-300"></div>
                                                        </Link>

                                                        {category.children && category.children.length > 0 && (
                                                            <ul className="space-y-1.5 pl-1 border-l border-dark-700/50 ml-1">
                                                                {category.children.map((child: any) => (
                                                                    <li key={child.id}>
                                                                        <Link
                                                                            href={`/products?category=${child.slug}`}
                                                                            onClick={() => setIsCategoriesOpen(false)}
                                                                            className="text-silver-400 hover:text-accent-500 text-[12px] transition-colors flex items-center gap-2 group/link pl-2"
                                                                        >
                                                                            {child.name}
                                                                        </Link>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        )}
                                                    </div>
                                                ))}

                                            </div>
                                        )}
                                    </div>

                                    {/* Bottom Decorative Bar */}
                                    <div className="h-1 bg-gradient-to-r from-transparent via-accent-500/20 to-transparent"></div>
                                </div>
                            )}
                        </li>
                        <li>
                            <Link href="/products?featured=true" className="font-medium text-silver-300 hover:text-accent-500 transition-colors">
                                Trending Now
                            </Link>
                        </li>
                        <li>
                            <Link href="/products?sort=newest" className="font-medium text-silver-300 hover:text-accent-500 transition-colors">
                                New Arrivals
                            </Link>
                        </li>
                    </ul>
                </div>
            </nav>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="md:hidden fixed inset-0 top-[100px] z-[100] bg-dark-900 overflow-y-auto pt-4 pb-20 px-4 animate-in slide-in-from-bottom duration-300">
                    <ul className="space-y-4">
                        <li>
                            <Link href="/" className="block py-3 px-4 rounded-xl bg-dark-800 font-medium text-silver-200 border border-dark-700" onClick={() => setIsMenuOpen(false)}>Home</Link>
                        </li>
                        <li>
                            <Link href="/products" className="block py-3 px-4 rounded-xl bg-dark-800 font-medium text-silver-200 border border-dark-700" onClick={() => setIsMenuOpen(false)}>All Collection</Link>
                        </li>
                        <li className="space-y-4">
                            <p className="px-4 text-[10px] font-bold text-silver-500 uppercase tracking-widest">Shop by Categories</p>
                            <div className="space-y-1.5">
                                {categories.map((category) => (
                                    <div key={category.id} className="space-y-1.5">
                                        <Link
                                            href={`/products?category=${category.slug}`}
                                            className="flex items-center justify-between py-2 px-3 rounded-lg bg-dark-800 border border-dark-700 text-white font-bold text-sm"
                                            onClick={() => setIsMenuOpen(false)}
                                        >
                                            <div className="flex items-center gap-2">
                                                {category.image && (
                                                    <img src={category.image} alt={category.name} className="w-6 h-6 rounded object-cover" />
                                                )}
                                                <span>{category.name}</span>
                                            </div>
                                            <ChevronDown size={14} className="-rotate-90 text-silver-500" />
                                        </Link>

                                        {category.children && category.children.length > 0 && (
                                            <div className="grid grid-cols-2 gap-1.5 px-1.5">
                                                {category.children.map((child: any) => (
                                                    <Link
                                                        key={child.id}
                                                        href={`/products?category=${child.slug}`}
                                                        className="py-1.5 px-2 rounded-md bg-dark-800/40 border border-dark-700/50 text-silver-400 text-[11px] font-medium"
                                                        onClick={() => setIsMenuOpen(false)}
                                                    >
                                                        {child.name}
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                                <Link
                                    href="/categories"
                                    className="block w-full py-3 mt-1 rounded-lg bg-accent-500/10 border border-accent-500/30 text-accent-500 text-xs font-bold text-center"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    Browse All Categories
                                </Link>
                            </div>
                        </li>
                        <li className="pt-4 border-t border-dark-700">
                            <Link href="/track-order" className="flex items-center gap-3 py-3 px-4 text-silver-300" onClick={() => setIsMenuOpen(false)}>
                                <Truck size={18} />
                                <span>Track Order</span>
                            </Link>
                        </li>

                        {isAuthenticated && customer ? (
                            <>
                                <li className="pt-4 mt-4 border-t border-dark-700">
                                    <div className="flex items-center gap-4 px-4 py-2">
                                        <img
                                            src={customer?.avatar || `https://ui-avatars.com/api/?name=${customer?.name}&background=00f5d4&color=0a0a0f`}
                                            alt={customer?.name}
                                            className="w-12 h-12 rounded-full border-2 border-accent-500"
                                        />
                                        <div>
                                            <p className="font-bold text-white text-lg leading-tight">{customer?.name}</p>
                                            <p className="text-sm text-silver-500">{customer?.email}</p>
                                        </div>
                                    </div>
                                </li>
                                <li className="grid grid-cols-2 gap-2 px-4 pt-2">
                                    <Link href="/profile" className="py-3 bg-dark-800 rounded-xl text-center font-bold text-accent-500 border border-dark-700" onClick={() => setIsMenuOpen(false)}>My Account</Link>
                                    <button onClick={logout} className="py-3 bg-red-500/10 rounded-xl text-center font-bold text-red-500 border border-red-500/30">Logout</button>
                                </li>
                            </>
                        ) : (
                            <li className="px-4 pt-4">
                                <Link href="/login" className="block w-full py-4 bg-accent-500 text-dark-900 rounded-xl text-center font-bold text-lg shadow-lg shadow-accent-500/20" onClick={() => setIsMenuOpen(false)}>Login / Register</Link>
                            </li>
                        )}
                    </ul>
                </div>
            )}
        </header>
    );
}
