export interface DashboardStats {
    total_orders: number;
    total_revenue: number;
    total_commission: number;
    total_products: number;
    total_shops: number;
    total_customers: number;
    pending_orders: number;
    recent_orders: Order[];
    revenue_history: { date: string; revenue: number }[];
    order_status_distribution: { status: string; count: number }[];
}

export interface Order {
    id: number;
    order_id: string;
    customer: Customer;
    total_amount: number;
    status: string;
    created_at: string;
    // adding optional fields that might be used in different views
    items?: any[];
    commission_amount?: number;
    delivery_address?: string;
    delivery_city?: string;
    delivery_pincode?: string;
    notes?: string;
    status_display?: string;
    refund_status?: 'pending' | 'refunded' | 'not_applicable';
    cancellation_reason?: string;
}

export interface Product {
    id: number;
    name: string;
    slug: string;
    description: string;
    price: number;
    sale_price: number | null;
    current_price: number;
    discount_percent?: number;
    stock: number;
    sku: string;
    is_featured: boolean;
    is_active: boolean;
    image: string | null;
    images?: { id: number; image: string; is_primary: boolean }[];
    category_name?: string;
    commission_rate: number;
    status?: string;
    shop?: { id: number; name: string };
    category?: { id: number; name: string };
    shop_id?: number;
    category_id?: number;
    shop_name?: string;
    created_at: string;
}

export interface Shop {
    id: number;
    name: string;
    email: string;
    phone: string;
    city: string;
    is_active: boolean;
    created_at: string;
    product_count: number;
    current_cycle_start?: string;
}

export interface Category {
    id: number;
    name: string;
    slug: string;
    product_count?: number;
}

export interface Subscription {
    id: number;
    shop_name: string;
    plan_name: string;
    amount: number;
    start_date: string;
    end_date: string;
    status: string;
    is_paid: boolean;
    created_at?: string;
    shop?: number;
}

export interface Customer {
    id: number;
    name: string;
    email: string;
    phone: string;
    city: string;
    created_at: string;
}

export interface Banner {
    id: number;
    title: string;
    image: string;
    link: string;
    is_active: boolean;
}

export interface SiteSetting {
    id: number;
    site_name: string;
    site_logo: string;
    contact_email: string;
    contact_phone: string;
    address: string;
    facebook_url: string;
    instagram_url: string;
    twitter_url: string;
}

export interface Permission {
    id: number;
    name: string;
    codename: string;
    content_type: number;
}

export interface Role {
    id: number;
    name: string;
    permissions: Permission[];
    permission_ids?: number[];
}

export interface AdminUser {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    is_staff: boolean;
    is_superuser: boolean;
    is_active: boolean;
    date_joined: string;
    roles?: Role[];
    role_ids?: number[];
    direct_permissions?: Permission[];
    all_permissions?: string[];
}
