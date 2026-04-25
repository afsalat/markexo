import AdminGuard from '@/components/AdminGuard';
import { buildNoIndexMetadata } from '@/lib/seo';
import AdminThemeWrapper from '@/components/admin/AdminThemeWrapper';

export const metadata = buildNoIndexMetadata({
    title: 'Admin Dashboard | VorionMart',
    description: 'Manage your D2C platform - orders, products, fulfillment, and more.',
    path: '/admin',
});

import { AuthProvider } from '@/context/AuthContext';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AuthProvider storageKeyPrefix="admin">
            <AdminGuard>
                <AdminThemeWrapper>
                    {children}
                </AdminThemeWrapper>
            </AdminGuard>
        </AuthProvider>
    );
}
