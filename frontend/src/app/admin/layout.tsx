import { Metadata } from 'next';
import AdminGuard from '@/components/AdminGuard';

export const metadata: Metadata = {
    title: 'Admin Dashboard | Markexo',
    description: 'Manage your marketplace - orders, products, shops, and more.',
};

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AdminGuard>
            <div className="min-h-screen">
                {children}
            </div>
        </AdminGuard>
    );
}
