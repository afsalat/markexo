'use client';

import Link from 'next/link';
import { ShoppingCart, Search, Menu, X, User, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { useCart } from '@/lib/cart';

import { useRouter } from 'next/navigation';

export default function Header() {
    const router = useRouter();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const { totalItems } = useCart();
    const { customer, isAuthenticated, logout } = useCustomerAuth();

    const handleSearch = () => {
        if (searchQuery.trim()) {
            router.push(`/products?search=${encodeURIComponent(searchQuery)}`);
            setIsSearchOpen(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    return (
        <header className="sticky top-0 z-50 glass">
            {/* Top Bar */}
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white text-sm py-2">
                <div className="container mx-auto px-4 flex justify-between items-center">
                    <p>🚀 Free Delivery on orders above ₹500</p>
                    <div className="hidden md:flex gap-4">
                        <Link href="/track-order" className="hover:underline">Track Order</Link>
                        <Link href="/contact" className="hover:underline">Contact Us</Link>
                    </div>
                </div>
            </div>

            {/* Main Header */}
            <div className="container mx-auto px-4 py-4">
                <div className="flex items-center justify-between gap-4">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center">
                            <span className="text-white font-bold text-xl">M</span>
                        </div>
                        <div>
                            <h1 className="font-display font-bold text-xl text-gray-900">Markexo</h1>
                            <p className="text-xs text-gray-500 -mt-1">by Vorion Nexus</p>
                        </div>
                    </Link>

                    {/* Search Bar - Desktop */}
                    <div className="hidden md:flex flex-1 max-w-xl mx-8">
                        <div className="relative w-full">
                            <input
                                type="text"
                                placeholder="Search for products, brands and more..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="w-full pl-4 pr-12 py-3 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                            />
                            <button
                                onClick={handleSearch}
                                className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary-600 text-white p-2 rounded-lg hover:bg-primary-700 transition-colors"
                            >
                                <Search size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center gap-3">
                        {/* Mobile Search Toggle */}
                        <button
                            onClick={() => setIsSearchOpen(!isSearchOpen)}
                            className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <Search size={22} />
                        </button>

                        {/* Cart */}
                        <Link
                            href="/cart"
                            className="relative flex items-center gap-2 px-4 py-2 hover:bg-gray-100 rounded-xl transition-colors"
                        >
                            <ShoppingCart size={22} />
                            {totalItems > 0 && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                                    {totalItems}
                                </span>
                            )}
                            <span className="hidden sm:block font-medium">Cart</span>
                        </Link>

                        {/* Account */}
                        {/* Account / Login */}
                        {isAuthenticated && customer ? (
                            <Link
                                href="/profile"
                                className="hidden sm:flex items-center gap-2 px-3 py-1.5 hover:bg-gray-100 rounded-xl transition-colors border border-transparent hover:border-gray-200"
                            >
                                <img
                                    src={customer?.avatar || `https://ui-avatars.com/api/?name=${customer?.name}&background=random`}
                                    alt={customer?.name}
                                    className="w-8 h-8 rounded-full border border-gray-200"
                                />
                                <div className="text-left hidden lg:block">
                                    <p className="text-xs text-gray-500 font-medium">Hello,</p>
                                    <p className="text-sm font-bold text-gray-900 leading-none">{customer?.name.split(' ')[0]}</p>
                                </div>
                            </Link>
                        ) : (
                            <Link
                                href="/login"
                                className="hidden sm:flex items-center gap-2 px-4 py-2 hover:bg-gray-100 rounded-xl transition-colors"
                            >
                                <User size={22} />
                                <span className="font-medium">Login</span>
                            </Link>
                        )}

                        {/* Mobile Menu Toggle */}
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
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
                                placeholder="Search products..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="w-full pl-4 pr-12 py-3 rounded-xl border border-gray-200 focus:border-primary-500 outline-none"
                            />
                            <button
                                onClick={handleSearch}
                                className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary-600 text-white p-2 rounded-lg"
                            >
                                <Search size={18} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Category Navigation */}
            <nav className="hidden md:block border-t border-gray-100">
                <div className="container mx-auto px-4">
                    <ul className="flex items-center gap-8 py-3">
                        <li>
                            <Link href="/products" className="flex items-center gap-1 font-medium text-gray-700 hover:text-primary-600 transition-colors">
                                All Products
                            </Link>
                        </li>
                        <li className="group relative">
                            <button className="flex items-center gap-1 font-medium text-gray-700 hover:text-primary-600 transition-colors">
                                Categories <ChevronDown size={16} />
                            </button>
                            {/* Dropdown Menu */}
                            <div className="absolute left-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                                <div className="py-2">
                                    <Link href="/products?category=electronics" className="block px-4 py-2 text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition-colors">
                                        Electronics
                                    </Link>
                                    <Link href="/products?category=fashion" className="block px-4 py-2 text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition-colors">
                                        Fashion
                                    </Link>
                                    <Link href="/products?category=home-living" className="block px-4 py-2 text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition-colors">
                                        Home & Living
                                    </Link>
                                    <Link href="/products?category=sports" className="block px-4 py-2 text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition-colors">
                                        Sports & Fitness
                                    </Link>
                                    <Link href="/products?category=books" className="block px-4 py-2 text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition-colors">
                                        Books & Media
                                    </Link>
                                    <div className="border-t border-gray-100 my-2"></div>
                                    <Link href="/products" className="block px-4 py-2 text-primary-600 font-medium hover:bg-primary-50 transition-colors">
                                        View All Categories →
                                    </Link>
                                </div>
                            </div>
                        </li>
                        <li>
                            <Link href="/products?featured=true" className="font-medium text-gray-700 hover:text-primary-600 transition-colors">
                                Featured
                            </Link>
                        </li>
                        <li>
                            <Link href="/products?sort=newest" className="font-medium text-gray-700 hover:text-primary-600 transition-colors">
                                New Arrivals
                            </Link>
                        </li>
                        <li>
                            <Link href="/shops" className="font-medium text-gray-700 hover:text-primary-600 transition-colors">
                                Shops
                            </Link>
                        </li>
                    </ul>
                </div>
            </nav>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="md:hidden border-t border-gray-100 py-4 px-4 animate-slide-up">
                    <ul className="space-y-3">
                        <li>
                            <Link href="/products" className="block py-2 font-medium text-gray-700">All Products</Link>
                        </li>
                        <li>
                            <Link href="/products?featured=true" className="block py-2 font-medium text-gray-700">Featured</Link>
                        </li>
                        <li>
                            <Link href="/shops" className="block py-2 font-medium text-gray-700">Shops</Link>
                        </li>
                        <li>
                            <Link href="/track-order" className="block py-2 font-medium text-gray-700">Track Order</Link>
                        </li>
                        {isAuthenticated ? (
                            <>
                                <li className="border-t border-gray-100 pt-2 mt-2">
                                    <div className="flex items-center gap-3 py-2">
                                        <img
                                            src={customer?.avatar || `https://ui-avatars.com/api/?name=${customer?.name}&background=random`}
                                            alt={customer?.name}
                                            className="w-8 h-8 rounded-full border border-gray-200"
                                        />
                                        <div>
                                            <p className="font-medium text-gray-900">{customer?.name}</p>
                                            <p className="text-xs text-gray-500">{customer?.email}</p>
                                        </div>
                                    </div>
                                </li>
                                <li>
                                    <Link href="/profile" className="block py-2 font-medium text-primary-600">My Profile</Link>
                                </li>
                                <li>
                                    <button onClick={logout} className="block w-full text-left py-2 font-medium text-red-600">
                                        Logout
                                    </button>
                                </li>
                            </>
                        ) : (
                            <li>
                                <Link href="/login" className="block py-2 font-medium text-primary-600">Login / Sign Up</Link>
                            </li>
                        )}
                    </ul>
                </div>
            )}
        </header>
    );
}

// Imports for CustomerAuth
import { useCustomerAuth } from '@/context/CustomerAuthContext';

