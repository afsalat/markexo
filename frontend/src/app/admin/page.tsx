'use client';

import { useState, useEffect } from 'react';
import { DashboardStats, Order, Product, Shop, Subscription, Customer, Banner, SiteSetting, Category } from '@/types/admin';
import Sidebar from '@/components/admin/Sidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import DashboardTab from '@/components/admin/DashboardTab';
import OrdersTab from '@/components/admin/OrdersTab';
import ProductsTab from '@/components/admin/ProductsTab';
import CategoriesTab from '@/components/admin/CategoriesTab';
import ShopsTab from '@/components/admin/ShopsTab';
import SubscriptionsTab from '@/components/admin/SubscriptionsTab';
import CustomersTab from '@/components/admin/CustomersTab';
import EnquiriesTab from '@/components/admin/EnquiriesTab';
import UserManagementTab from '@/components/admin/UserManagementTab';
import BannersTab from '@/components/admin/BannersTab';
import SettingsTab from '@/components/admin/SettingsTab';
import { useAuth } from '@/context/AuthContext';
import { API_BASE_URL as API_URL } from '@/config/apiConfig';

const API_BASE_URL = API_URL;

type TabType = 'dashboard' | 'orders' | 'products' | 'categories' | 'shops' | 'subscriptions' | 'customers' | 'enquiries' | 'user-management' | 'banners' | 'settings';

export default function AdminPage() {
    const { token, user, hasPermission, loading: authLoading } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>('dashboard');
    const [loading, setLoading] = useState(true);

    // Data State
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [shops, setShops] = useState<Shop[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [banners, setBanners] = useState<Banner[]>([]);
    const [settings, setSettings] = useState<SiteSetting | null>(null);

    const fetchData = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const headers = { 'Authorization': `Bearer ${token}` };

            const requests: Promise<any>[] = [];
            const labels: string[] = [];

            // Helper to add request if permitted
            const addReq = (perm: string | null, url: string, label: string) => {
                if (!perm || hasPermission(perm)) {
                    requests.push(fetch(url, { headers }));
                    labels.push(label);
                }
            };

            addReq(null, `${API_BASE_URL}/admin/stats/`, 'stats'); // Dashboard permission checked on backend
            addReq('view_product', `${API_BASE_URL}/admin/products/`, 'products');
            addReq('view_shop', `${API_BASE_URL}/admin/shops/`, 'shops');
            addReq('view_category', `${API_BASE_URL}/admin/categories/`, 'categories');
            addReq('view_customer', `${API_BASE_URL}/admin/customers/`, 'customers');
            addReq('view_banner', `${API_BASE_URL}/admin/banners/`, 'banners');
            addReq('view_sitesetting', `${API_BASE_URL}/admin/settings/`, 'settings');

            const responses = await Promise.all(requests);

            for (let i = 0; i < responses.length; i++) {
                const res = responses[i];
                const label = labels[i];
                if (res.ok) {
                    const data = await res.json();
                    if (label === 'stats') setStats(data);
                    if (label === 'products') setProducts(data.results || data);
                    if (label === 'shops') setShops(data.results || data);
                    if (label === 'categories') setCategories(data.results || data);
                    if (label === 'customers') setCustomers(data.results || data);
                    if (label === 'banners') setBanners(data.results || data);
                    if (label === 'settings') setSettings(data);
                }
            }
        } catch (error) {
            console.error("Failed to fetch data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!authLoading && token && user) {
            fetchData();
        }
    }, [authLoading, token, user]);

    // Render content based on active tab
    const renderContent = () => {
        if (authLoading || (loading && activeTab === 'dashboard')) {
            // Give it a bit of time, if auth is done but loading still true and no user, show error
            if (!authLoading && !user) {
                return (
                    <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 bg-white rounded-3xl border border-gray-100 shadow-sm animate-fade-in">
                        <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mb-4 text-2xl font-bold">!</div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Profile Load Failure</h2>
                        <p className="text-gray-500 max-w-md mb-6">We couldn't load your admin profile. This might be due to a connection issue or a missing session.</p>
                        <button onClick={() => window.location.reload()} className="bg-primary-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-primary-700 shadow-lg">Retry Loading</button>
                    </div>
                );
            }
            return (
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                </div>
            );
        }

        const Denied = () => (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 bg-white rounded-3xl border border-gray-100 shadow-sm animate-fade-in">
                <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
                    <svg width={40} height={40} fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-10 h-10">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m11 3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Restricted</h2>
                <p className="text-gray-500 max-w-md">You do not have the required permissions to view this section. Please contact your system administrator if you believe this is an error.</p>
            </div>
        );

        const checkMap: Record<TabType, string | null> = {
            dashboard: null,
            orders: 'view_order',
            products: 'view_product',
            categories: 'view_category',
            shops: 'view_shop',
            subscriptions: 'view_subscription',
            customers: 'view_customer',
            enquiries: 'view_enquiry',
            'user-management': 'view_user',
            banners: 'view_banner',
            settings: 'view_sitesetting'
        };

        const reqPerm = checkMap[activeTab];
        if (reqPerm && !hasPermission(reqPerm)) return <Denied />;

        switch (activeTab) {
            case 'dashboard':
                if (stats) return <DashboardTab stats={stats} setActiveTab={setActiveTab} />;
                return (
                    <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Welcome back, {user?.first_name || user?.username}!</h2>
                        <p className="text-gray-500">You have successfully logged into the admin panel. Use the sidebar to navigate to the sections you have access to.</p>
                    </div>
                );
            case 'orders':
                return <OrdersTab />;
            case 'products':
                return <ProductsTab products={products} shops={shops} categories={categories} onRefresh={fetchData} />;
            case 'categories':
                return <CategoriesTab categories={categories} onRefresh={fetchData} />;
            case 'shops':
                return <ShopsTab shops={shops} onRefresh={fetchData} />;
            case 'subscriptions':
                return <SubscriptionsTab />;
            case 'customers':
                return <CustomersTab customers={customers} />;
            case 'enquiries':
                return <EnquiriesTab />;
            case 'user-management':
                return <UserManagementTab />;
            case 'banners':
                return <BannersTab banners={banners} />;
            case 'settings':
                return <SettingsTab settings={settings} />;
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Mobile Header */}
            <AdminHeader sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

            <div className="flex">
                {/* Sidebar */}
                <Sidebar
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    sidebarOpen={sidebarOpen}
                    setSidebarOpen={setSidebarOpen}
                    pendingOrdersCount={stats?.pending_orders || 0}
                />

                {/* Main Content */}
                <main className="flex-1 p-6 lg:p-8 lg:ml-64">
                    {renderContent()}
                </main>
            </div>

            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}
        </div>
    );
}
