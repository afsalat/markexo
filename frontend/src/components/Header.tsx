'use client';

import Link from 'next/link';
import { ShoppingCart, Search, Menu, X, Zap, Sparkles, ChevronDown } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useCart } from '@/lib/cart';
import { useRouter } from 'next/navigation';
import { useCustomerAuth } from '@/context/CustomerAuthContext';
import { fetchProducts, fetchCategories } from '@/lib/api';

export default function Header() {
    const router = useRouter();
    const { totalItems } = useCart();
    const { customer, isAuthenticated, logout } = useCustomerAuth();

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [categories, setCategories] = useState<any[]>([]);
    const [isLoadingCategories, setIsLoadingCategories] = useState(false);
    const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);

    const searchRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 12);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

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

    const closeMenus = () => {
        setIsMenuOpen(false);
        setIsSearchOpen(false);
        setShowSuggestions(false);
    };

    const handleSearch = () => {
        if (!searchQuery.trim()) {
            return;
        }

        router.push(`/products?search=${encodeURIComponent(searchQuery)}`);
        setIsSearchOpen(false);
        setShowSuggestions(false);
    };

    const handleKeyDown = (event: React.KeyboardEvent) => {
        if (event.key === 'Enter') {
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

    const mainNavLinks = [
        { href: '/', label: 'Home' },
        { href: '/products', label: 'Collection' },
    ];

    const specialNavLinks = [
        { href: '/trending', label: 'Trending', icon: <Zap size={14} className="fill-current" /> },
        { href: '/new-arrivals', label: 'New Arrivals', icon: <Sparkles size={14} /> },
    ];

    const suggestionDropdown =
        showSuggestions && (suggestions.length > 0 || isLoadingSuggestions) ? (
            <div className="absolute left-0 right-0 top-full z-50 mt-4 mb-5 overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.12)]">
                <div className="navbar-search-scroll max-h-[min(24rem,calc(100vh-8rem))] overflow-x-hidden overflow-y-auto overscroll-contain">
                    {isLoadingSuggestions ? (
                        <div className="px-5 py-4 text-sm text-gray-500">Searching...</div>
                    ) : (
                        <>
                            {suggestions.map((item) => (
                                <button
                                    key={`${item.type}-${item.id}`}
                                    onClick={() => handleSuggestionClick(item.slug, item.type)}
                                    className="flex w-full items-center gap-3 border-b border-gray-100 px-5 py-3 text-left transition last:border-b-0 hover:bg-gray-50"
                                >
                                    <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-gray-100">
                                        {item.image ? (
                                            <img
                                                src={item.image}
                                                alt={item.name}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <span className="text-sm font-semibold text-gray-500">
                                                {item.name.charAt(0)}
                                            </span>
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium text-gray-900">
                                            {item.name}
                                        </p>
                                        <p className="mt-0.5 text-xs text-gray-500">
                                            {item.type === 'product'
                                                ? `\u20B9${(
                                                      item.current_price ||
                                                      item.price ||
                                                      0
                                                  ).toLocaleString()}`
                                                : 'Category'}
                                        </p>
                                    </div>
                                </button>
                            ))}
                            <button
                                onClick={handleSearch}
                                className="w-full px-5 py-4 text-left text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                            >
                                View all results for "{searchQuery}"
                            </button>
                        </>
                    )}
                </div>
            </div>
        ) : null;

    return (
        <header
            className={`sticky top-0 z-50 border-b border-gray-200 bg-white/95 transition-shadow duration-300 backdrop-blur ${
                isScrolled ? 'shadow-[0_12px_40px_rgba(15,23,42,0.08)]' : 'shadow-none'
            }`}
        >
            <div className="container mx-auto px-4">
                <div className="flex min-h-[76px] items-center gap-3 lg:gap-6">
                    <Link href="/" className="ml-2 mr-3 shrink-0 md:ml-4 md:mr-6" onClick={closeMenus}>
                        <img
                            src="/logo-black-text.png"
                            alt="VorionMart"
                            className="h-10 w-auto object-contain md:h-12"
                        />
                    </Link>

                    <nav className="hidden items-center gap-7 lg:flex">
                        {mainNavLinks.map((link) => (
                            <Link
                                key={link.label}
                                href={link.href}
                                className="text-sm font-medium text-gray-700 transition-colors hover:text-black"
                            >
                                {link.label}
                            </Link>
                        ))}
                        
                        {/* Categories Dropdown */}
                        <div 
                            className="flex items-center h-full"
                            onMouseEnter={() => setIsCategoryDropdownOpen(true)}
                            onMouseLeave={() => setIsCategoryDropdownOpen(false)}
                        >
                            <button className="flex items-center gap-1 text-sm font-bold text-gray-800 transition-colors hover:text-accent-600 focus:outline-none py-6 px-1">
                                Categories <ChevronDown size={14} className={`transition-transform duration-200 ${isCategoryDropdownOpen ? 'rotate-180 text-accent-600' : 'text-gray-400'}`} />
                            </button>
                            
                            {/* Mega Menu Overlay */}
                            <div className={`fixed left-0 w-full top-[76px] transition-all duration-300 origin-top shadow-2xl z-[60] border-t border-gray-900 ${isCategoryDropdownOpen ? 'opacity-100 scale-y-100 visible pointer-events-auto' : 'opacity-0 scale-y-95 invisible pointer-events-none'}`}>
                                <div className="bg-[#0a0a0a] w-full max-h-[calc(100vh-76px)] overflow-y-auto">
                                    <div className="container mx-auto px-4 py-10 relative">
                                        {isLoadingCategories ? (
                                            <div className="text-sm text-gray-500 py-10 text-center">Loading categories...</div>
                                        ) : (
                                            <>
                                                <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-6 gap-8">
                                                    {categories.map((category) => (
                                                        <div key={category.id} className="break-inside-avoid mb-8">
                                                            <Link href={`/products?category=${category.slug}`} className="group inline-block mb-4">
                                                                <h3 className="text-white text-[12px] font-bold uppercase tracking-wider relative inline-block pb-1">
                                                                    {category.name}
                                                                    <span className="absolute bottom-0 left-0 w-8 h-[2px] bg-[#00E5FF] transition-all group-hover:w-full"></span>
                                                                </h3>
                                                            </Link>
                                                            
                                                            {category.children && category.children.length > 0 && (
                                                                <ul className="space-y-2.5">
                                                                    {category.children.map((child: any) => (
                                                                        <li key={child.id}>
                                                                            <Link 
                                                                                href={`/products?category=${child.slug}`}
                                                                                className="text-gray-400 text-[13px] hover:text-white transition-colors"
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
                                                <div className="w-full h-1 bg-gradient-to-r from-transparent via-[#00E5FF]/20 to-transparent absolute bottom-0 left-0" />
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex h-5 w-px bg-gray-200"></div>
                        
                        <div className="flex items-center gap-6 bg-gray-50/80 px-4 py-2 rounded-full border border-gray-100">
                            {specialNavLinks.map((link) => (
                                <Link
                                    key={link.label}
                                    href={link.href}
                                    className="flex items-center gap-1.5 text-sm font-bold text-gray-800 transition-colors hover:text-accent-600"
                                >
                                    <span className="text-accent-500">{link.icon}</span>
                                    {link.label}
                                </Link>
                            ))}
                        </div>
                    </nav>

                    <div className="hidden flex-1 md:block" ref={searchRef}>
                        <div className="relative mx-auto max-w-xl">
                            <input
                                type="text"
                                placeholder="Search products"
                                value={searchQuery}
                                onChange={(event) => setSearchQuery(event.target.value)}
                                onKeyDown={handleKeyDown}
                                onFocus={() => searchQuery.length >= 2 && setShowSuggestions(true)}
                                className="h-12 w-full rounded-full border border-gray-200 bg-gray-50 pl-5 pr-14 text-sm text-gray-900 outline-none transition focus:border-gray-400 focus:bg-white"
                            />
                            <button
                                onClick={handleSearch}
                                className="absolute right-1.5 top-1.5 flex h-9 w-9 items-center justify-center rounded-full bg-black text-white transition hover:bg-gray-800"
                                aria-label="Search"
                            >
                                <Search size={18} />
                            </button>

                            {suggestionDropdown}
                        </div>
                    </div>

                    <div className="ml-auto flex items-center gap-2 md:gap-3">
                        <button
                            onClick={() => setIsSearchOpen((open) => !open)}
                            className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-700 transition hover:bg-gray-50 md:hidden"
                            aria-label="Toggle search"
                        >
                            <Search size={18} />
                        </button>

                        <Link
                            href="/cart"
                            className="relative flex h-11 items-center gap-2 rounded-full border border-gray-200 px-4 text-sm font-medium text-gray-800 transition hover:bg-gray-50"
                        >
                            <ShoppingCart size={18} />
                            <span className="hidden sm:inline">Cart</span>
                            {totalItems > 0 && (
                                <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-black px-1 text-[11px] font-semibold text-white">
                                    {totalItems}
                                </span>
                            )}
                        </Link>

                        {isAuthenticated && customer ? (
                            <Link
                                href="/profile"
                                className="hidden h-11 items-center rounded-full border border-gray-200 px-5 text-sm font-medium text-gray-800 transition hover:bg-gray-50 sm:flex"
                            >
                                <span className="text-gray-500">Hi,</span>
                                <span className="ml-1 font-semibold text-gray-900">
                                    {customer?.name.split(' ')[0]}
                                </span>
                            </Link>
                        ) : (
                            <Link
                                href="/login"
                                className="hidden h-11 items-center rounded-full bg-black px-5 text-sm font-medium text-white transition hover:bg-gray-800 sm:flex"
                            >
                                Login
                            </Link>
                        )}

                        <button
                            onClick={() => setIsMenuOpen((open) => !open)}
                            className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-700 transition hover:bg-gray-50 lg:hidden"
                            aria-label="Toggle menu"
                        >
                            {isMenuOpen ? <X size={18} /> : <Menu size={18} />}
                        </button>
                    </div>
                </div>

                {isSearchOpen && (
                    <div className="border-t border-gray-200 py-4 md:hidden">
                        <div className="relative" ref={searchRef}>
                            <input
                                type="text"
                                placeholder="Search products"
                                value={searchQuery}
                                onChange={(event) => setSearchQuery(event.target.value)}
                                onKeyDown={handleKeyDown}
                                onFocus={() => searchQuery.length >= 2 && setShowSuggestions(true)}
                                className="h-12 w-full rounded-full border border-gray-200 bg-gray-50 pl-5 pr-14 text-sm text-gray-900 outline-none focus:border-gray-400 focus:bg-white"
                            />
                            <button
                                onClick={handleSearch}
                                className="absolute right-1.5 top-1.5 flex h-9 w-9 items-center justify-center rounded-full bg-black text-white"
                                aria-label="Search"
                            >
                                <Search size={18} />
                            </button>
                            {suggestionDropdown}
                        </div>
                    </div>
                )}

                {isMenuOpen && (
                    <div className="border-t border-gray-200 py-5 lg:hidden">
                        <div className="space-y-3">
                            {mainNavLinks.map((link) => (
                                <Link
                                    key={link.label}
                                    href={link.href}
                                    className="block rounded-2xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-800 transition hover:bg-gray-50"
                                    onClick={closeMenus}
                                >
                                    {link.label}
                                </Link>
                            ))}

                            <div className="grid grid-cols-2 gap-3 mt-2">
                                {specialNavLinks.map((link) => (
                                    <Link
                                        key={link.label}
                                        href={link.href}
                                        className="flex items-center justify-center gap-2 rounded-2xl bg-gray-50 border border-gray-100 px-4 py-3 text-sm font-bold text-gray-800 transition hover:bg-gray-100 hover:text-accent-600"
                                        onClick={closeMenus}
                                    >
                                        <span className="text-accent-500">{link.icon}</span>
                                        {link.label}
                                    </Link>
                                ))}
                            </div>

                            <div className="rounded-[24px] border border-gray-200 p-4">
                                <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                                    Categories
                                </p>
                                {isLoadingCategories ? (
                                    <p className="text-sm text-gray-500">Loading categories...</p>
                                ) : (
                                    <div className="grid grid-cols-2 gap-2">
                                        {categories.slice(0, 8).map((category) => (
                                            <Link
                                                key={category.id}
                                                href={`/products?category=${category.slug}`}
                                                className="rounded-2xl bg-gray-50 px-3 py-3 text-sm font-medium text-gray-800 transition hover:bg-gray-100"
                                                onClick={closeMenus}
                                            >
                                                {category.name}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {isAuthenticated && customer ? (
                                <div className="grid grid-cols-2 gap-3 pt-2">
                                    <Link
                                        href="/profile"
                                        className="rounded-2xl border border-gray-200 px-4 py-3 text-center text-sm font-medium text-gray-800"
                                        onClick={closeMenus}
                                    >
                                        My Account
                                    </Link>
                                    <button
                                        onClick={() => {
                                            logout();
                                            closeMenus();
                                        }}
                                        className="rounded-2xl bg-black px-4 py-3 text-sm font-medium text-white"
                                    >
                                        Logout
                                    </button>
                                </div>
                            ) : (
                                <Link
                                    href="/login"
                                    className="block rounded-2xl bg-black px-4 py-3 text-center text-sm font-medium text-white"
                                    onClick={closeMenus}
                                >
                                    Login
                                </Link>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
}
