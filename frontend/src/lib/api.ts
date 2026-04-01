/**
 * API utility functions for VorionMart
 */

import { API_BASE_URL } from '@/config/apiConfig';

const API_URL = API_BASE_URL;

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
    mrp?: number;
    our_price?: number;
    supplier_price?: number;
    price: number;
    sale_price: number | null;
    current_price: number;
    discount_percent: number;
    stock: number;
    sku: string;
    category: { id: number; name: string; slug: string } | null;
    image: string | null;
    images: { id: number; image: string; is_primary: boolean }[];
    is_featured: boolean;
    is_active: boolean;
    rating: number;
    review_count: number;
    reviewCount?: number;
    sold_count?: number;
    features?: string[];
    specifications?: Record<string, string | number | boolean | null>;
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

export interface Review {
    id: number;
    product: number;
    product_name: string;
    customer: number;
    customer_name: string;
    customer_email: string;
    rating: number;
    comment: string;
    verified: boolean;
    created_at: string;
    created_at_formatted: string;
    images: { id: number; image: string }[];
    name?: string; // For backward compatibility
    date?: string; // For backward compatibility
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
    status: string;
    status_display: string;
    delivery_address: string;
    delivery_city: string;
    delivery_pincode: string;
    items: {
        product_name: string;
        quantity: number;
        price: number;
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

export async function fetchCategories(params?: Record<string, string>) {
    const searchParams = new URLSearchParams(params);
    const queryString = searchParams.toString();
    const url = queryString ? `${API_URL}/categories/?${queryString}` : `${API_URL}/categories/`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch categories');
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

export async function fetchReviews(productId?: number) {
    const url = productId ? `${API_URL}/reviews/?product=${productId}` : `${API_URL}/reviews/`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch reviews');
    return res.json();
}

export async function createReview(reviewData: {
    product: number;
    rating: number;
    comment: string;
    images?: File[];
}) {
    const token = localStorage.getItem('access_token');
    const formData = new FormData();
    formData.append('product', String(reviewData.product));
    formData.append('rating', String(reviewData.rating));
    formData.append('comment', reviewData.comment);
    for (const image of reviewData.images || []) {
        formData.append('uploaded_images', image);
    }

    const res = await fetch(`${API_URL}/reviews/`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
        body: formData,
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        if (err.detail) throw new Error(err.detail);
        throw new Error(JSON.stringify(err) || 'Failed to create review');
    }
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

export async function fetchCustomerOrders(email: string) {
    const res = await fetch(`${API_URL}/orders/my-orders/?email=${encodeURIComponent(email)}`);
    if (!res.ok) throw new Error('Failed to fetch orders');
    return res.json();
}

// Admin API functions
export async function fetchAdminStats() {
    const res = await fetch(`${API_URL}/admin/stats/`);
    if (!res.ok) throw new Error('Failed to fetch stats');
    return res.json();
}

export async function fetchAdminAnalytics(token: string) {
    const res = await fetch(`${API_URL}/admin/analytics/`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    if (!res.ok) throw new Error('Failed to fetch analytics');
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

// Cart API functions
export async function fetchCart(customerId: string) {
    const res = await fetch(`${API_URL}/cart/`, {
        headers: { 'X-Customer-Id': customerId },
    });
    if (!res.ok) throw new Error('Failed to fetch cart');
    return res.json();
}

export async function addToCart(customerId: string, productId: number, quantity: number = 1) {
    const res = await fetch(`${API_URL}/cart/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Customer-Id': customerId
        },
        body: JSON.stringify({ product_id: productId, quantity }),
    });
    if (!res.ok) throw new Error('Failed to add to cart');
    return res.json();
}

export async function updateCartItem(customerId: string, productId: number, quantity: number) {
    const res = await fetch(`${API_URL}/cart/`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'X-Customer-Id': customerId
        },
        body: JSON.stringify({ product_id: productId, quantity }),
    });
    if (!res.ok) throw new Error('Failed to update cart');
    return res.json();
}

export async function removeFromCart(customerId: string, productId: number) {
    const res = await fetch(`${API_URL}/cart/`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'X-Customer-Id': customerId
        },
        body: JSON.stringify({ product_id: productId }),
    });
    if (!res.ok) throw new Error('Failed to remove from cart');
    return res.json();
}

export async function clearCart(customerId: string) {
    const res = await fetch(`${API_URL}/cart/`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'X-Customer-Id': customerId
        },
        body: JSON.stringify({ clear_all: true }),
    });
    if (!res.ok) throw new Error('Failed to clear cart');
    return res.json();
}

// Auth API functions
export async function loginUser(credentials: any) {
    const res = await fetch(`${API_URL}/auth/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const rawMessage =
            errorData.detail ||
            errorData.message ||
            errorData.non_field_errors?.[0] ||
            (Array.isArray(errorData) ? errorData[0] : null) ||
            'Login failed';

        const errorMessage =
            rawMessage === 'No account found with this email.' || rawMessage === 'Invalid password.'
                ? 'Invalid email or password.'
                : rawMessage;

        throw new Error(errorMessage);
    }
    return res.json();
}

export async function registerUser(userData: any) {
    const res = await fetch(`${API_URL}/auth/register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));

        let errorMessage = 'Registration failed';
        if (typeof errorData === 'object' && errorData !== null) {
            // Check for specific field errors (e.g. { "email": ["user with this email already exists."] })
            const firstErrorKey = Object.keys(errorData)[0];
            if (firstErrorKey && Array.isArray(errorData[firstErrorKey])) {
                errorMessage = errorData[firstErrorKey][0];
            } else if (errorData.detail) {
                errorMessage = errorData.detail;
            } else if (errorData.message) {
                errorMessage = errorData.message;
            } else if (errorData.non_field_errors) {
                errorMessage = errorData.non_field_errors[0];
            } else {
                errorMessage = JSON.stringify(errorData);
            }
        }

        throw new Error(errorMessage);
    }
    return res.json();
}

export async function registerPartner(partnerData: any) {
    const res = await fetch(`${API_URL}/auth/register-partner/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(partnerData),
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        let errorMessage = 'Partner registration failed';

        if (typeof errorData === 'object' && errorData !== null) {
            const firstErrorKey = Object.keys(errorData)[0];
            if (firstErrorKey && Array.isArray(errorData[firstErrorKey])) {
                errorMessage = errorData[firstErrorKey][0];
            } else if (typeof errorData[firstErrorKey] === 'string') {
                errorMessage = errorData[firstErrorKey];
            } else if (errorData.detail) {
                errorMessage = errorData.detail;
            } else if (errorData.message) {
                errorMessage = errorData.message;
            } else if (errorData.non_field_errors?.[0]) {
                errorMessage = errorData.non_field_errors[0];
            }
        }

        throw new Error(errorMessage);
    }
    return res.json();
}

