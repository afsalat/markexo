'use client';

import { usePathname } from 'next/navigation';
import Header from './Header';
import Footer from './Footer';

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isAdminRoute = pathname?.startsWith('/admin');
    const isPartnerRoute = pathname?.startsWith('/partner');
    const isAuthRoute = pathname === '/login' || pathname === '/signup';

    if (isAdminRoute || isPartnerRoute || isAuthRoute) {
        return <>{children}</>;
    }

    return (
        <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
        </div>
    );
}
