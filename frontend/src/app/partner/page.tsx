'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { PartnerDashboardStats } from '@/types/admin';
import PartnerDashboardTab from '@/components/admin/PartnerDashboardTab';
import { API_BASE_URL as API_URL } from '@/config/apiConfig';

const API_BASE_URL = API_URL;

export default function PartnerDashboardPage() {
    const { token } = useAuth();
    const [stats, setStats] = useState<PartnerDashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            if (!token) return;
            try {
                const res = await fetch(`${API_BASE_URL}/partner/stats/`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!res.ok) throw new Error('Failed to fetch dashboard data');
                const data = await res.json();
                setStats(data);
            } catch (err) {
                console.error(err);
                setError('Failed to load dashboard.');
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [token]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
            </div>
        );
    }

    if (error || !stats) {
        return (
            <div className="bg-dark-800 rounded-3xl p-5 sm:p-8 border border-dark-700 shadow-sm">
                <div className="text-center max-w-md mx-auto">
                    <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-3">Welcome Partner!</h2>
                    <p className="text-silver-400 mb-6">
                        {error === 'Failed to load dashboard.'
                            ? "We couldn't load your partner dashboard right now."
                            : error || 'No partner activity found yet.'}
                    </p>
                    <div className="bg-dark-700/50 rounded-xl p-4 text-left">
                        <h3 className="text-sm font-semibold text-emerald-400 mb-2">What to check:</h3>
                        <ol className="text-sm text-silver-400 space-y-2">
                            <li>1. Confirm this partner account can access the portal</li>
                            <li>2. Add or review products under this user</li>
                            <li>3. Refresh the page after changes are saved</li>
                            <li>4. Contact support if the dashboard still stays empty</li>
                        </ol>
                    </div>
                </div>
            </div>
        );
    }

    return <PartnerDashboardTab stats={stats} />;
}
