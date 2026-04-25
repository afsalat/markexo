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
            const normalizedPath = pathname?.toLowerCase() || '';
            if (!isAuthenticated) {
                if (normalizedPath.startsWith('/admin') && normalizedPath !== '/admin/login') {
                    router.push('/admin/login');
                } else if (normalizedPath.startsWith('/partner') &&
                    !normalizedPath.includes('/partner/login') &&
                    !normalizedPath.includes('/partner/register')) {
                    router.push('/partner/login');
                }
            } else {
                if (normalizedPath === '/admin/login') {
                    router.push('/admin');
                } else if (normalizedPath === '/partner/login') {
                    router.push('/partner');
                }
            }
        }
    }, [isAuthenticated, loading, pathname, router]);

    const normalizedPath = pathname?.toLowerCase() || '';
    const isPublicPath =
        (normalizedPath.startsWith('/partner') && (normalizedPath.includes('/partner/login') || normalizedPath.includes('/partner/register'))) ||
        (normalizedPath.startsWith('/admin') && normalizedPath === '/admin/login');

    if (loading && !isPublicPath) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-dark-950">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-accent-500/10 rounded-full animate-pulse"></div>
                    <Loader2 className="absolute top-0 animate-spin text-accent-500" size={64} />
                </div>
                <p className="mt-6 text-silver-500 font-bold animate-pulse tracking-widest uppercase text-xs">
                    Authenticating Session...
                </p>
            </div>
        );
    }

    // Allow public pages and login page regardless of auth status here (auth logic handled by useEffect)
    const isProtectedAdmin = normalizedPath.startsWith('/admin') && normalizedPath !== '/admin/login';
    const isProtectedPartner = normalizedPath.startsWith('/partner') &&
        !normalizedPath.includes('/partner/login') &&
        !normalizedPath.includes('/partner/register');

    if (!isAuthenticated && (isProtectedAdmin || isProtectedPartner)) {
        return null;
    }

    return <>{children}</>;
}
