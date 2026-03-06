'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Product, Shop, Category } from '@/types/admin';
import ProductsTab from '@/components/admin/ProductsTab';
import { API_BASE_URL as API_URL } from '@/config/apiConfig';

const API_BASE_URL = API_URL;

export default function PartnerProductsPage() {
    const { token } = useAuth();
    const [products, setProducts] = useState<Product[]>([]);
    const [shops, setShops] = useState<Shop[]>([]); // Likely will contain only their shop
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const headers = { 'Authorization': `Bearer ${token}` };

            // We assume backend permissions limit these to the user's data
            const [productsRes, shopsRes, categoriesRes] = await Promise.all([
                fetch(`${API_BASE_URL}/admin/products/`, { headers }),
                fetch(`${API_BASE_URL}/admin/shops/`, { headers }),
                fetch(`${API_BASE_URL}/admin/categories/`, { headers }),
            ]);

            if (productsRes.ok) {
                const data = await productsRes.json();
                setProducts(data.results || data);
            }
            if (shopsRes.ok) {
                const data = await shopsRes.json();
                setShops(data.results || data);
            }
            if (categoriesRes.ok) {
                const data = await categoriesRes.json();
                setCategories(data.results || data);
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
        <ProductsTab
            products={products}
            shops={shops}
            categories={categories}
            onRefresh={fetchData}
        />
    );
}
