import { Metadata } from 'next';
import AdminGuard from '@/components/AdminGuard';

export const metadata: Metadata = {
    title: 'Admin Dashboard | VorionMart',
    description: 'Manage your D2C platform - orders, products, fulfillment, and more.',
};

import { AuthProvider } from '@/context/AuthContext';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AuthProvider storageKeyPrefix="admin">
            <AdminGuard>
                <div className="min-h-screen light">
                    {children}
                </div>
            </AdminGuard>
        </AuthProvider>
    );
}
