'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import Header from './Header';
import Footer from './Footer';
import AOS from 'aos';
import 'aos/dist/aos.css';

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isAdminRoute = pathname?.startsWith('/admin');
    const isPartnerRoute = pathname?.startsWith('/partner');
    const isAuthRoute = pathname === '/login' || pathname === '/signup';

    useEffect(() => {
        AOS.init({
            duration: 800,
            once: true,
            easing: 'ease-out-cubic',
            offset: 50,
        });
    }, []);

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
