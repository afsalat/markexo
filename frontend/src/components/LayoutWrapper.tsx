'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import Header from './Header';
import Footer from './Footer';
import BottomNav from './BottomNav';
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
        <div className={`flex flex-col pb-16 lg:pb-0 ${pathname?.startsWith('/categories') ? 'h-[100dvh] overflow-hidden md:h-auto md:min-h-screen md:overflow-visible' : 'min-h-screen'}`}>
            <Header />
            <main className="flex-1 overflow-hidden md:overflow-visible flex flex-col">{children}</main>
            <div className={pathname?.startsWith('/categories') ? "hidden md:block" : ""}>
                <Footer />
            </div>
            <BottomNav />
        </div>
    );
}
