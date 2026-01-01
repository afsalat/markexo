'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function AdminGuard({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!loading) {
            if (!isAuthenticated && pathname.startsWith('/admin') && pathname !== '/admin/login') {
                router.push('/admin/login');
            } else if (isAuthenticated && pathname === '/admin/login') {
                router.push('/admin');
            }
        }
    }, [isAuthenticated, loading, pathname, router]);

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-primary-100 rounded-full animate-pulse"></div>
                    <Loader2 className="absolute top-0 animate-spin text-primary-600" size={64} />
                </div>
                <p className="mt-6 text-gray-500 font-medium animate-pulse tracking-widest uppercase text-xs">
                    Authenticating Session...
                </p>
            </div>
        );
    }

    // Allow public pages and login page regardless of auth status here (auth logic handled by useEffect)
    if (!isAuthenticated && pathname.startsWith('/admin') && pathname !== '/admin/login') {
        return null;
    }

    return <>{children}</>;
}
