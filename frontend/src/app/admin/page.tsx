'use client';

import { useState, useEffect } from 'react';
import { PartnerDashboardStats, DashboardStats, Order, Product, Customer, Banner, SiteSetting, Category } from '@/types/admin';
import Sidebar from '@/components/admin/Sidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import DashboardTab from '@/components/admin/DashboardTab';
import PartnerDashboardTab from '@/components/admin/PartnerDashboardTab';
import OrdersTab from '@/components/admin/OrdersTab';
import ProductsTab from '@/components/admin/ProductsTab';
import CategoriesTab from '@/components/admin/CategoriesTab';
import CustomersTab from '@/components/admin/CustomersTab';
import EnquiriesTab from '@/components/admin/EnquiriesTab';
import UserManagementTab from '@/components/admin/UserManagementTab';
import BannersTab from '@/components/admin/BannersTab';
import SettingsTab from '@/components/admin/SettingsTab';
import ReturnsTab from '@/components/admin/ReturnsTab';
import PaymentsTab from '@/components/admin/PaymentsTab';
import SupplierAPITab from '@/components/admin/SupplierAPITab';
import SystemLogsTab from '@/components/admin/SystemLogsTab';
import ProductAnalyticsTab from '@/components/admin/ProductAnalyticsTab';
import PartnersTab from '@/components/admin/PartnersTab';
import ShopsTab from '@/components/admin/ShopsTab';
import LaunchReadinessTab from '@/components/admin/LaunchReadinessTab';
import { useAuth } from '@/context/AuthContext';
import { API_BASE_URL as API_URL } from '@/config/apiConfig';

const API_BASE_URL = API_URL;

type TabType = 'dashboard' | 'launch-readiness' | 'analytics' | 'orders' | 'returns' | 'payments' | 'products' | 'shops' | 'categories' | 'customers' | 'enquiries' | 'user-management' | 'banners' | 'settings' | 'suppliers' | 'system-logs' | 'partners';

export default function AdminPage() {
    const { token, user, hasPermission, loading: authLoading } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>('dashboard');
    const [loading, setLoading] = useState(true);

    // Data State
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [partnerStats, setPartnerStats] = useState<PartnerDashboardStats | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
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
            addReq(null, `${API_BASE_URL}/admin/partner-stats/`, 'partnerStats'); // Partner stats

            // Filter products for partners
            let productsUrl = `${API_BASE_URL}/admin/products/`;
            if (user && !user.is_superuser) {
                productsUrl += `?created_by=${user.id}`;
            }
            addReq('view_product', productsUrl, 'products');
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
                    if (label === 'partnerStats') setPartnerStats(data);
                    if (label === 'products') setProducts(data.results || data);
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
                    <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 bg-dark-800 rounded-3xl border border-dark-700 shadow-sm animate-fade-in">
                        <div className="w-20 h-20 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mb-4 text-2xl font-bold border border-amber-500/20">!</div>
                        <h2 className="text-2xl font-bold text-white mb-2">Profile Load Failure</h2>
                        <p className="text-silver-500 max-w-md mb-6">We couldn't load your admin profile. This might be due to a connection issue or a missing session.</p>
                        <button onClick={() => window.location.reload()} className="bg-accent-600 text-dark-900 px-6 py-2 rounded-xl font-bold hover:bg-accent-500 shadow-lg shadow-accent-500/20 transition-all">Retry Loading</button>
                    </div>
                );
            }
            return (
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-500"></div>
                </div>
            );
        }

        const Denied = () => (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 bg-dark-800 rounded-3xl border border-dark-700 shadow-sm animate-fade-in">
                <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-4 border border-red-500/20">
                    <svg width={40} height={40} fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-10 h-10">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m11 3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Access Restricted</h2>
                <p className="text-silver-500 max-w-md">You do not have the required permissions to view this section. Please contact your system administrator if you believe this is an error.</p>
            </div>
        );

        const checkMap: Record<TabType, string | null> = {
            dashboard: null,
            'launch-readiness': null,
            analytics: 'view_product',
            orders: 'view_order',
            returns: 'view_order',
            payments: 'view_order',
            products: 'view_product',
            shops: 'view_shop',
            categories: 'view_category',
            customers: 'view_customer',
            enquiries: 'view_enquiry',
            'user-management': 'view_user',
            banners: 'view_banner',
            settings: 'view_sitesetting',
            suppliers: 'view_sitesetting',
            'system-logs': 'view_sitesetting',
            partners: 'add_user', // Use add_user as proxy permission for now
        };

        const reqPerm = checkMap[activeTab];
        if (reqPerm && !hasPermission(reqPerm)) return <Denied />;

        switch (activeTab) {
            case 'dashboard':
                if (stats) return <DashboardTab stats={stats} setActiveTab={setActiveTab} />;
                if (partnerStats) return <PartnerDashboardTab stats={partnerStats} />;
                return (
                    <div className="bg-dark-800 rounded-3xl p-8 border border-dark-700 shadow-sm">
                        <h2 className="text-xl font-bold text-white mb-4">Welcome back, {user?.first_name || user?.username}!</h2>
                        <p className="text-silver-500">You have successfully logged into the admin panel. Your dashboard data is currently unavailable (Permission Denied). Use the sidebar to navigate to the sections you have access to.</p>
                    </div>
                );
            case 'launch-readiness':
                return <LaunchReadinessTab />;
            case 'analytics':
                return <ProductAnalyticsTab />;
            case 'orders':
                return <OrdersTab />;
            case 'returns':
                return <ReturnsTab />;
            case 'payments':
                return <PaymentsTab />;
            case 'products':
                return <ProductsTab products={products} categories={categories} onRefresh={fetchData} />;
            case 'shops':
                return <ShopsTab />;
            case 'categories':
                return <CategoriesTab categories={categories} onRefresh={fetchData} />;
            case 'partners':
                return <PartnersTab />;
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
            case 'suppliers':
                return <SupplierAPITab />;
            case 'system-logs':
                return <SystemLogsTab />;
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-dark-900 text-silver-100 overflow-x-hidden">
            {/* Mobile Header */}
            <AdminHeader sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

            <div className="flex min-w-0">
                {/* Sidebar */}
                <Sidebar
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    sidebarOpen={sidebarOpen}
                    setSidebarOpen={setSidebarOpen}
                    pendingOrdersCount={stats?.pending_orders || 0}
                />

                {/* Main Content */}
                <main className="flex-1 min-w-0 p-3 sm:p-5 lg:p-8 lg:ml-64">
                    {renderContent()}
                </main>
            </div>

            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}
        </div>
    );
}
