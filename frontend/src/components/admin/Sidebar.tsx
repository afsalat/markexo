import Link from 'next/link';
import {
    LayoutDashboard, ShoppingCart, Package, Store,
    CreditCard, Users, Image, Settings, ChevronRight, Grid, MessageSquare, LogOut, Shield
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
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, permission: null }, // Dashboard check is special or handles itself
        { id: 'orders', label: 'Orders', icon: ShoppingCart, permission: 'view_order' },
        { id: 'products', label: 'Products', icon: Package, permission: 'view_product' },
        { id: 'categories', label: 'Categories', icon: Grid, permission: 'view_category' },
        { id: 'shops', label: 'Shops', icon: Store, permission: 'view_shop' },
        { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard, permission: 'view_subscription' },
        { id: 'customers', label: 'Customers', icon: Users, permission: 'view_customer' },
        { id: 'enquiries', label: 'Enquiries', icon: MessageSquare, permission: 'view_enquiry' },
        { id: 'user-management', label: 'User Management', icon: Shield, permission: 'view_user' },
        { id: 'banners', label: 'Banners', icon: Image, permission: 'view_banner' },
        { id: 'settings', label: 'Settings', icon: Settings, permission: 'view_sitesetting' },
    ];

    const visibleItems = menuItems.filter(item =>
        !item.permission || hasPermission(item.permission)
    );

    return (
        <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 text-white transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-200 overflow-y-auto`}>
            <div className="p-6 border-b border-gray-800">
                <Link href="/" className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center">
                        <span className="text-white font-bold text-xl">M</span>
                    </div>
                    <div>
                        <h1 className="font-display font-bold text-base">Markexo</h1>
                        <p className="text-[10px] text-gray-400">Admin Dashboard</p>
                    </div>
                </Link>
            </div>

            <nav className="p-4">
                <ul className="space-y-1">
                    {visibleItems.map((item) => (
                        <li key={item.id}>
                            <button
                                onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
                                className={`w-full flex items-center gap-3 px-4 py-2 text-[13px] font-medium rounded-xl transition-colors ${activeTab === item.id
                                    ? 'bg-primary-600 text-white'
                                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                    }`}
                            >
                                <item.icon size={18} />
                                <span>{item.label}</span>
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

            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800 space-y-2">
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
