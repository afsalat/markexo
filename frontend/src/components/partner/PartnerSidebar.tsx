import Link from 'next/link';
import {
    LayoutDashboard, ShoppingBag, Package, Settings, LogOut
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface PartnerSidebarProps {
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
}

export default function PartnerSidebar({ sidebarOpen, setSidebarOpen }: PartnerSidebarProps) {
    const { logout } = useAuth();

    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/partner' },
        { id: 'products', label: 'My Products', icon: Package, href: '/partner/products' },
        { id: 'orders', label: 'My Orders', icon: ShoppingBag, href: '/partner/orders' },
        { id: 'settings', label: 'Settings', icon: Settings, href: '/partner/settings' },
    ];

    const handleLogout = async () => {
        await logout();
    };

    return (
        <aside className={`fixed inset-y-0 left-0 z-50 w-[280px] max-w-[85vw] lg:w-64 bg-gray-900 text-white transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-200 flex flex-col shadow-2xl lg:shadow-none`}>
            <div className="px-4 py-4 sm:px-6 border-b border-gray-800 flex justify-center shrink-0">
                <Link href="/" className="flex items-center gap-3">
                    <img
                        src="/logo-white-text.png"
                        alt="VorionMart Logo"
                        className="h-10 sm:h-12 w-auto object-contain"
                    />
                </Link>
            </div>

            <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-2 custom-scrollbar">
                {menuItems.map((item) => {
                    const isActive = typeof window !== 'undefined' && window.location.pathname === item.href;
                    return (
                        <Link
                            key={item.id}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
                                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 font-medium'
                                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                }`}
                            onClick={() => setSidebarOpen(false)}
                        >
                            <item.icon size={20} />
                            <span className="min-w-0 truncate">{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-gray-800 shrink-0">
                <Link href="/" className="block p-4 rounded-xl bg-gray-800 hover:bg-gray-750 transition-colors mb-2 text-center text-sm text-gray-400">
                    View Store
                </Link>
                <button
                    onClick={handleLogout}
                    className="flex items-center justify-center gap-2 w-full px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                >
                    <LogOut size={20} />
                    <span>Log Out</span>
                </button>
            </div>
        </aside>
    );
}
