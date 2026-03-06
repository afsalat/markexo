'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Shop } from '@/types/admin';
import PartnerShopsTab from '@/components/partner/PartnerShopsTab';
import { API_BASE_URL as API_URL } from '@/config/apiConfig';

const API_BASE_URL = API_URL;

export default function PartnerShopsPage() {
    const { token } = useAuth();
    const [shops, setShops] = useState<Shop[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const headers = { 'Authorization': `Bearer ${token}` };

            const shopsRes = await fetch(`${API_BASE_URL}/admin/shops/`, { headers });

            if (shopsRes.ok) {
                const data = await shopsRes.json();
                setShops(data.results || data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [token]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
            </div>
        );
    }

    return (
        <PartnerShopsTab
            shops={shops}
            onRefresh={fetchData}
        />
    );
}