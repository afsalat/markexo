'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Package, ShoppingCart, User, Grid } from 'lucide-react';
import { useCart } from '@/lib/cart';

export default function BottomNav() {
    const pathname = usePathname();
    const { totalItems } = useCart();

    const navItems = [
        { label: 'Home', icon: Home, href: '/' },
        { label: 'Categories', icon: Grid, href: '/products' },
        { label: 'Orders', icon: Package, href: '/profile?tab=orders' },
        { label: 'Cart', icon: ShoppingCart, href: '/cart', badge: totalItems },
        { label: 'Account', icon: User, href: '/profile' },
    ];

    return (
        <nav className="fixed bottom-0 left-0 z-[60] w-full border-t border-gray-100 bg-white/95 pb-safe pt-2 backdrop-blur-md lg:hidden">
            <div className="flex items-center justify-around">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.label}
                            href={item.href}
                            className={`flex flex-col items-center gap-1 px-3 py-1 transition-colors ${
                                isActive ? 'text-black' : 'text-gray-400'
                            }`}
                        >
                            <div className="relative">
                                <Icon size={20} className={isActive ? 'fill-black' : ''} />
                                {typeof item.badge !== 'undefined' && item.badge > 0 && (
                                    <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-accent-600 text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
                                        {item.badge}
                                    </span>
                                )}
                            </div>
                            <span className={`text-[10px] font-medium ${isActive ? 'text-black' : 'text-gray-400'}`}>
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
