/**
 * API utility functions for Markexo
 */

import { API_BASE_URL } from '@/config/apiConfig';

const API_URL = API_BASE_URL;

export interface Shop {
    id: number;
    name: string;
    slug: string;
    description: string;
    address: string;
    city: string;
    phone: string;
    email: string;
    image: string | null;
    commission_rate: number;
    is_active: boolean;
    product_count: number;
}

export interface Category {
    id: number;
    name: string;
    slug: string;
    description: string;
    image: string | null;
    parent: number | null;
    children: Category[];
    product_count: number;
}

export interface Product {
    id: number;
    name: string;
    slug: string;
    description: string;
    price: number;
    sale_price: number | null;
    current_price: number;
    discount_percent: number;
    stock: number;
    sku: string;
    shop: { id: number; name: string; slug: string; image: string | null };
    category: { id: number; name: string; slug: string } | null;
    image: string | null;
    images: { id: number; image: string; is_primary: boolean }[];
    is_featured: boolean;
    is_active: boolean;
}

export interface Banner {
    id: number;
    title: string;
    subtitle: string;
    image: string;
    link: string;
    is_active: boolean;
}

export interface CartItem {
    product: Product;
    quantity: number;
}

export interface Order {
    id: number;
    order_id: string;
    customer: {
        name: string;
        email: string;
        phone: string;
    };
    total_amount: number;
    commission_amount: number;
    status: string;
    status_display: string;
    delivery_address: string;
    delivery_city: string;
    delivery_pincode: string;
    items: {
        product_name: string;
        quantity: number;
        price: number;
        shop_name: string;
    }[];
    created_at: string;
}

// Fetch functions
export async function fetchProducts(params?: Record<string, string>) {
    const searchParams = new URLSearchParams(params);
    const res = await fetch(`${API_URL}/products/?${searchParams}`);
    if (!res.ok) throw new Error('Failed to fetch products');
    return res.json();
}

export async function fetchProduct(slug: string) {
    const res = await fetch(`${API_URL}/products/${slug}/`);
    if (!res.ok) throw new Error('Failed to fetch product');
    return res.json();
}

export async function fetchCategories() {
    const res = await fetch(`${API_URL}/categories/`);
    if (!res.ok) throw new Error('Failed to fetch categories');
    return res.json();
}

export async function fetchShops() {
    const res = await fetch(`${API_URL}/shops/`);
    if (!res.ok) throw new Error('Failed to fetch shops');
    return res.json();
}

export async function fetchBanners() {
    const res = await fetch(`${API_URL}/banners/`);
    if (!res.ok) throw new Error('Failed to fetch banners');
    return res.json();
}

export async function fetchSettings() {
    const res = await fetch(`${API_URL}/settings/`);
    if (!res.ok) throw new Error('Failed to fetch settings');
    return res.json();
}

export async function createOrder(orderData: {
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    delivery_address: string;
    delivery_city: string;
    delivery_pincode: string;
    notes?: string;
    items: { product_id: number; quantity: number }[];
}) {
    const res = await fetch(`${API_URL}/orders/create/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
    });
    if (!res.ok) throw new Error('Failed to create order');
    return res.json();
}

export async function fetchOrder(orderId: string) {
    const res = await fetch(`${API_URL}/orders/${orderId}/`);
    if (!res.ok) throw new Error('Failed to fetch order');
    return res.json();
}

// Admin API functions
export async function fetchAdminStats() {
    const res = await fetch(`${API_URL}/admin/stats/`);
    if (!res.ok) throw new Error('Failed to fetch stats');
    return res.json();
}

export async function fetchAdminProducts(params?: Record<string, string>) {
    const searchParams = new URLSearchParams(params);
    const res = await fetch(`${API_URL}/admin/products/?${searchParams}`);
    if (!res.ok) throw new Error('Failed to fetch products');
    return res.json();
}

export async function createProduct(data: FormData) {
    const res = await fetch(`${API_URL}/admin/products/`, {
        method: 'POST',
        body: data,
    });
    if (!res.ok) throw new Error('Failed to create product');
    return res.json();
}

export async function updateProduct(id: number, data: FormData) {
    const res = await fetch(`${API_URL}/admin/products/${id}/`, {
        method: 'PUT',
        body: data,
    });
    if (!res.ok) throw new Error('Failed to update product');
    return res.json();
}

export async function deleteProduct(id: number) {
    const res = await fetch(`${API_URL}/admin/products/${id}/`, {
        method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete product');
}

export async function fetchAdminOrders(params?: Record<string, string>) {
    const searchParams = new URLSearchParams(params);
    const res = await fetch(`${API_URL}/admin/orders/?${searchParams}`);
    if (!res.ok) throw new Error('Failed to fetch orders');
    return res.json();
}

export async function updateOrderStatus(id: number, status: string) {
    const res = await fetch(`${API_URL}/admin/orders/${id}/update_status/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error('Failed to update order status');
    return res.json();
}

export async function fetchAdminShops() {
    const res = await fetch(`${API_URL}/admin/shops/`);
    if (!res.ok) throw new Error('Failed to fetch shops');
    return res.json();
}

export async function createShop(data: FormData) {
    const res = await fetch(`${API_URL}/admin/shops/`, {
        method: 'POST',
        body: data,
    });
    if (!res.ok) throw new Error('Failed to create shop');
    return res.json();
}

export async function deleteShop(id: number) {
    const res = await fetch(`${API_URL}/admin/shops/${id}/`, {
        method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete shop');
}
