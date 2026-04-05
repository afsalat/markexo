import Link from 'next/link';
import {
    LayoutDashboard, ShoppingCart, Package, CreditCard,
    Users, Image, Settings, ChevronRight, Grid, MessageSquare, LogOut, Shield, RotateCcw, Zap, BarChart2, TerminalSquare, Store, ClipboardList
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface SidebarProps {
    activeTab: string;
    setActiveTab: (tab: any) => void;
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
    pendingOrdersCount: number;
}

export default function Sidebar({ activeTab, setActiveTab, sidebarOpen, setSidebarOpen, pendingOrdersCount }: SidebarProps) {
    const { logout, hasPermission } = useAuth();
    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, permission: null },
        { id: 'launch-readiness', label: 'Launch Readiness', icon: ClipboardList, permission: null },
        { id: 'analytics', label: 'Analytics', icon: BarChart2, permission: 'view_product' },
        { id: 'orders', label: 'Orders', icon: ShoppingCart, permission: 'view_order' },
        { id: 'returns', label: 'Returns', icon: RotateCcw, permission: 'view_order' },
        { id: 'payments', label: 'Payments', icon: CreditCard, permission: 'view_order' },
        { id: 'products', label: 'Products', icon: Package, permission: 'view_product' },
        { id: 'shops', label: 'Shops', icon: Store, permission: 'view_shop' },
        { id: 'categories', label: 'Categories', icon: Grid, permission: 'view_category' },
        { id: 'customers', label: 'Customers', icon: Users, permission: 'view_customer' },
        { id: 'enquiries', label: 'Enquiries', icon: MessageSquare, permission: 'view_enquiry' },
        { id: 'partners', label: 'Partners', icon: Users, permission: 'add_user' },
        { id: 'user-management', label: 'User Management', icon: Shield, permission: 'view_user' },
        { id: 'suppliers', label: 'Suppliers', icon: Zap, permission: 'view_sitesetting' },
        { id: 'system-logs', label: 'System Logs', icon: TerminalSquare, permission: 'view_sitesetting' },
        { id: 'banners', label: 'Banners', icon: Image, permission: 'view_banner' },
        { id: 'settings', label: 'Settings', icon: Settings, permission: 'view_sitesetting' },
    ];

    const visibleItems = menuItems.filter(item =>
        !item.permission || hasPermission(item.permission)
    );

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

            <nav className="p-4 flex-1 overflow-y-auto custom-scrollbar">
                <ul className="space-y-1 pb-4">
                    {visibleItems.map((item) => (
                        <li key={item.id}>
                            <button
                                onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
                                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-colors ${activeTab === item.id
                                    ? item.id === 'returns'
                                        ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                                        : 'bg-accent-500 text-dark-900 shadow-lg shadow-accent-500/20'
                                    : item.id === 'returns'
                                        ? 'text-orange-400 hover:bg-orange-500/10 hover:text-orange-500'
                                        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                    }`}
                            >
                                <item.icon size={18} className={item.id === 'returns' && activeTab !== 'returns' ? 'text-orange-500' : ''} />
                                <span className="min-w-0 truncate text-left">{item.label}</span>
                                {item.id === 'orders' && pendingOrdersCount > 0 && (
                                    <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                                        {pendingOrdersCount}
                                    </span>
                                )}
                            </button>
                        </li>
                    ))}
                </ul>
            </nav>

            <div className="p-4 border-t border-gray-800 space-y-2 shrink-0 bg-gray-900 z-10">
                <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-xs px-2">
                    <ChevronRight size={16} />
                    <span>View Store</span>
                </Link>
                <button
                    onClick={logout}
                    className="w-full flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors text-xs px-2 py-1"
                >
                    <LogOut size={16} />
                    <span>Log Out</span>
                </button>
            </div>
        </aside>
    );
}
