'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AdminUser } from '@/types/admin';
import { API_BASE_URL } from '@/config/apiConfig';

interface AuthContextType {
    token: string | null;
    user: AdminUser | null;
    login: (token: string, refreshToken: string) => void;
    logout: () => void;
    isAuthenticated: boolean;
    loading: boolean;
    expiryWarning: boolean;
    hasPermission: (codename: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [token, setToken] = useState<string | null>(null);
    const [user, setUser] = useState<AdminUser | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const [expiryWarning, setExpiryWarning] = useState(false);
    const router = useRouter();
    const pathname = usePathname();

    const fetchUser = async (authToken: string) => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/admin/users/me/`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
            if (res.ok) {
                const data = await res.json();
                setUser(data);
            } else if (res.status === 401) {
                logout();
            }
        } catch (err) {
            console.error('Error fetching user profile:', err);
        } finally {
            setLoading(false);
        }
    };

    const logout = useCallback(() => {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_refresh_token');
        localStorage.removeItem('token_expiry');
        setToken(null);
        setUser(null);
        setIsAuthenticated(false);
        setExpiryWarning(false);

        if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
            router.push('/admin/login');
        }
    }, [router, pathname]);

    const checkTokenExpiry = useCallback(() => {
        const expiry = localStorage.getItem('token_expiry');
        if (!expiry) return;

        const now = Date.now();
        const timeLeft = parseInt(expiry) - now;

        if (timeLeft <= 300000 && timeLeft > 0) {
            setExpiryWarning(true);
        } else if (timeLeft <= 0) {
            logout();
        } else {
            setExpiryWarning(false);
        }
    }, [logout]);

    useEffect(() => {
        const storedToken = localStorage.getItem('admin_token');
        if (storedToken) {
            setToken(storedToken);
            setIsAuthenticated(true);
            fetchUser(storedToken).finally(() => setLoading(false));
        } else {
            setLoading(false);
        }

        const interval = setInterval(checkTokenExpiry, 30000);
        return () => clearInterval(interval);
    }, [checkTokenExpiry]); // Removed fetchUser from here to avoid recursive calls if setLoading(true) is inside fetchUser

    const login = async (newToken: string, refreshToken: string) => {
        localStorage.setItem('admin_token', newToken);
        localStorage.setItem('admin_refresh_token', refreshToken);
        const expiryTime = Date.now() + 60 * 60 * 1000;
        localStorage.setItem('token_expiry', expiryTime.toString());

        setToken(newToken);
        setIsAuthenticated(true);
        setExpiryWarning(false);
        await fetchUser(newToken);
        router.push('/admin');
    };

    const hasPermission = (codename: string): boolean => {
        if (!user) return false;
        // Superuser bypass
        if (user.is_superuser) return true;

        // Try to match both with and without 'api.' prefix
        const cleanCodename = codename.includes('.') ? codename.split('.').pop()! : codename;

        // 1. Check the flattened permission list from backend (preferred)
        if (user.all_permissions?.some(p => {
            const pCode = p.includes('.') ? p.split('.').pop()! : p;
            return pCode === cleanCodename;
        })) return true;

        // 2. Fallback to roles
        const fromRoles = user.roles?.some(role =>
            role.permissions?.some(p => {
                const pCode = p.codename.includes('.') ? p.codename.split('.').pop()! : p.codename;
                return pCode === cleanCodename;
            })
        ) || false;

        // 3. Fallback to direct permissions
        const fromDirect = user.direct_permissions?.some(p => {
            const pCode = p.codename.includes('.') ? p.codename.split('.').pop()! : p.codename;
            return pCode === cleanCodename;
        }) || false;

        return fromRoles || fromDirect;
    };

    return (
        <AuthContext.Provider value={{ token, user, login, logout, isAuthenticated, loading, expiryWarning, hasPermission }}>
            {children}
            {expiryWarning && (
                <div className="fixed bottom-6 right-6 z-50 animate-bounce">
                    <div className="bg-amber-500 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 border-2 border-amber-400">
                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-bold">!</div>
                        <div>
                            <p className="font-bold">Session Security Alert</p>
                            <p className="text-sm opacity-90">Your session will expire in less than 5 minutes.</p>
                        </div>
                    </div>
                </div>
            )}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
