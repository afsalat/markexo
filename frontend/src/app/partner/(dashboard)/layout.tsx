'use client';

import { useState } from 'react';
import PartnerSidebar from '@/components/partner/PartnerSidebar';
import AdminHeader from '@/components/admin/AdminHeader';

export default function PartnerDashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-dark-900 text-silver-100 flex overflow-x-hidden">
            <PartnerSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

            <div className="flex-1 min-w-0 flex flex-col lg:ml-64">
                <AdminHeader sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

                <main className="flex-1 min-w-0 p-3 sm:p-5 lg:p-8">
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
    );
}
