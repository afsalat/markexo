'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, Search, Menu, X, User, ChevronDown, Truck, Shield, Sun, Moon } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useCart } from '@/lib/cart';
import { useRouter } from 'next/navigation';
import { useCustomerAuth } from '@/context/CustomerAuthContext';
import { useTheme } from '@/context/ThemeContext';
import { fetchProducts } from '@/lib/api';

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

    // Handle scroll for shrink effect
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Debounce search suggestions
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchQuery.trim().length >= 2) {
                setIsLoadingSuggestions(true);
                try {
                    const data = await fetchProducts({ search: searchQuery, page_size: '5' });
                    setSuggestions(data.results || []);
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

    const handleSuggestionClick = (slug: string) => {
        router.push(`/products/${slug}`);
        setSearchQuery('');
        setShowSuggestions(false);
        setIsSearchOpen(false);
    };

    return (
        <header className={`sticky top-0 z-50 glass transition-all duration-300 ${isScrolled ? 'shadow-xl backdrop-blur-lg bg-dark-900/90' : ''}`}>
            {/* Top Bar - Trust Signals - Hide on scroll */}
            <div className={`overflow-hidden transition-all duration-300 bg-gradient-to-r from-dark-800 via-dark-700 to-dark-800 text-silver-300 text-sm border-b border-dark-600 ${isScrolled ? 'h-0 opacity-0' : 'py-2 h-auto opacity-100'}`}>
                <div className="container mx-auto px-4 flex justify-between items-center">
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
                            src={theme === 'dark' ? "/logo-white-text.png" : "/logo-black-text.png"}
                            alt="VorionMart"
                            className={`w-auto object-contain transition-all duration-300 ${isScrolled ? 'h-10 md:h-12' : 'h-14 md:h-16'}`}
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
                                className={`w-full pl-4 pr-12 rounded-xl bg-dark-800 border border-dark-600 text-white placeholder:text-silver-500 focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 outline-none transition-all ${isScrolled ? 'py-2' : 'py-3'}`}
                            />
                            <button
                                onClick={handleSearch}
                                className="absolute right-2 top-1/2 -translate-y-1/2 bg-accent-500 text-dark-900 p-2 rounded-lg hover:bg-accent-400 transition-colors scale-90"
                            >
                                <Search size={18} />
                            </button>

                            {/* Search Suggestions Dropdown */}
                            {showSuggestions && (suggestions.length > 0 || isLoadingSuggestions) && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-dark-800 border border-dark-600 rounded-xl shadow-xl z-50 overflow-hidden">
                                    {isLoadingSuggestions ? (
                                        <div className="px-4 py-3 text-silver-400 text-sm">Searching...</div>
                                    ) : (
                                        <>
                                            {suggestions.map((product) => (
                                                <button
                                                    key={product.id}
                                                    onClick={() => handleSuggestionClick(product.slug)}
                                                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-dark-700 transition-colors text-left"
                                                >
                                                    <img
                                                        src={product.image || '/placeholder.png'}
                                                        alt={product.name}
                                                        className="w-10 h-10 object-cover rounded-lg"
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-white text-sm font-medium truncate">{product.name}</p>
                                                        <p className="text-accent-500 text-sm font-bold">₹{(product.current_price || product.price || 0).toLocaleString()}</p>
                                                    </div>
                                                </button>
                                            ))}
                                            <button
                                                onClick={handleSearch}
                                                className="w-full px-4 py-3 text-accent-500 text-sm font-medium hover:bg-dark-700 transition-colors border-t border-dark-600"
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
                            className="md:hidden p-2 hover:bg-dark-700 dark:hover:bg-dark-700 light:hover:bg-gray-100 rounded-lg transition-colors text-silver-300 dark:text-silver-300 light:text-gray-600"
                        >
                            <Search size={22} />
                        </button>



                        {/* Theme Toggle */}
                        <button
                            onClick={toggleTheme}
                            className="p-2 hover:bg-dark-700 rounded-xl transition-colors text-silver-200"
                            aria-label="Toggle Theme"
                        >
                            {theme === 'dark' ? <Sun size={22} /> : <Moon size={22} />}
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
                                className="hidden sm:flex items-center gap-2 px-3 py-1.5 hover:bg-dark-700 rounded-xl transition-colors border border-transparent hover:border-dark-600"
                            >
                                <img
                                    src={customer?.avatar || `https://ui-avatars.com/api/?name=${customer?.name}&background=00f5d4&color=0a0a0f`}
                                    alt={customer?.name}
                                    className="w-8 h-8 rounded-full border border-dark-600"
                                />
                                <div className="text-left hidden lg:block">
                                    <p className="text-xs text-silver-500 font-medium">Hello,</p>
                                    <p className="text-sm font-bold text-white leading-none">{customer?.name.split(' ')[0]}</p>
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
                    <div className="md:hidden mt-4 animate-slide-up">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search premium products..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="w-full pl-4 pr-12 py-3 rounded-xl bg-dark-800 border border-dark-600 text-white placeholder:text-silver-500 focus:border-accent-500 outline-none"
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
            <nav className="hidden md:block border-t border-dark-600">
                <div className="container mx-auto px-4">
                    <ul className="flex items-center justify-center gap-8 py-3">
                        <li>
                            <Link href="/" className="flex items-center gap-1 font-medium text-silver-300 hover:text-accent-500 transition-colors">
                                Home
                            </Link>
                        </li>
                        <li>
                            <Link href="/products" className="flex items-center gap-1 font-medium text-silver-300 hover:text-accent-500 transition-colors">
                                All Collection
                            </Link>
                        </li>
                        <li ref={categoriesRef} className="relative">
                            <button
                                onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
                                className={`flex items-center gap-1 font-medium transition-colors ${isCategoriesOpen ? 'text-accent-500' : 'text-silver-300 hover:text-accent-500'}`}
                            >
                                Categories <ChevronDown size={16} className={`transition-transform duration-200 ${isCategoriesOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {/* Dropdown Menu */}
                            {isCategoriesOpen && (
                                <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-56 bg-dark-800 rounded-xl shadow-xl border border-dark-600 z-50 animate-fade-in">
                                    <div className="py-2">
                                        <Link href="/products?category=electronics" onClick={() => setIsCategoriesOpen(false)} className="block px-4 py-2 text-silver-300 hover:bg-dark-700 hover:text-accent-500 transition-colors">
                                            Electronics
                                        </Link>
                                        <Link href="/products?category=fashion" onClick={() => setIsCategoriesOpen(false)} className="block px-4 py-2 text-silver-300 hover:bg-dark-700 hover:text-accent-500 transition-colors">
                                            Fashion
                                        </Link>
                                        <Link href="/products?category=home-living" onClick={() => setIsCategoriesOpen(false)} className="block px-4 py-2 text-silver-300 hover:bg-dark-700 hover:text-accent-500 transition-colors">
                                            Home & Living
                                        </Link>
                                        <Link href="/products?category=sports" onClick={() => setIsCategoriesOpen(false)} className="block px-4 py-2 text-silver-300 hover:bg-dark-700 hover:text-accent-500 transition-colors">
                                            Sports & Fitness
                                        </Link>
                                        <Link href="/products?category=books" onClick={() => setIsCategoriesOpen(false)} className="block px-4 py-2 text-silver-300 hover:bg-dark-700 hover:text-accent-500 transition-colors">
                                            Books & Media
                                        </Link>
                                        <div className="border-t border-dark-600 my-2"></div>
                                        <Link href="/categories" onClick={() => setIsCategoriesOpen(false)} className="block px-4 py-2 text-accent-500 font-medium hover:bg-dark-700 transition-colors">
                                            View All Categories →
                                        </Link>
                                    </div>
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
                <div className="md:hidden border-t border-dark-600 py-4 px-4 animate-slide-up bg-dark-800">
                    <ul className="space-y-3">
                        <li>
                            <Link href="/products" className="block py-2 font-medium text-silver-200 hover:text-accent-500">All Collection</Link>
                        </li>
                        <li>
                            <Link href="/products?featured=true" className="block py-2 font-medium text-silver-200 hover:text-accent-500">Trending Now</Link>
                        </li>
                        <li>
                            <Link href="/track-order" className="block py-2 font-medium text-silver-200 hover:text-accent-500">Track Order</Link>
                        </li>
                        {isAuthenticated ? (
                            <>
                                <li className="border-t border-dark-600 pt-2 mt-2">
                                    <div className="flex items-center gap-3 py-2">
                                        <img
                                            src={customer?.avatar || `https://ui-avatars.com/api/?name=${customer?.name}&background=00f5d4&color=0a0a0f`}
                                            alt={customer?.name}
                                            className="w-8 h-8 rounded-full border border-dark-600"
                                        />
                                        <div>
                                            <p className="font-medium text-white">{customer?.name}</p>
                                            <p className="text-xs text-silver-500">{customer?.email}</p>
                                        </div>
                                    </div>
                                </li>
                                <li>
                                    <Link href="/profile" className="block py-2 font-medium text-accent-500">My Profile</Link>
                                </li>
                                <li>
                                    <button onClick={logout} className="block w-full text-left py-2 font-medium text-red-400 hover:text-red-300">
                                        Logout
                                    </button>
                                </li>
                            </>
                        ) : (
                            <li>
                                <Link href="/login" className="block py-2 font-medium text-accent-500">Login / Sign Up</Link>
                            </li>
                        )}
                    </ul>
                </div>
            )}
        </header>
    );
}
