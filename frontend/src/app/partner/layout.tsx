'use client';

import AdminGuard from '@/components/AdminGuard';
import { AuthProvider } from '@/context/AuthContext';

import { useState } from 'react';
import PartnerSidebar from '@/components/partner/PartnerSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import { usePathname } from 'next/navigation';

export default function PartnerLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const pathname = usePathname();
    const normalizedPath = pathname?.toLowerCase() || '';
    const isAuthPage = normalizedPath.includes('/partner/login') || normalizedPath.includes('/partner/register');

    return (
        <AuthProvider storageKeyPrefix="partner">
            <AdminGuard>
                {isAuthPage ? (
                    children
                ) : (
                    <div className="min-h-screen bg-dark-900 text-silver-100 flex">
                        <PartnerSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

                        <div className="flex-1 flex flex-col lg:ml-64">
                            <AdminHeader sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

                            <main className="flex-1 p-6 lg:p-8">
                                {children}
                            </main>
                        </div>

                        {/* Mobile Overlay */}
                        {sidebarOpen && (
                            <div
                                className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden"
                                onClick={() => setSidebarOpen(false)}
                            />
                        )}
                    </div>
                )}
            </AdminGuard>
        </AuthProvider>
    );
}
