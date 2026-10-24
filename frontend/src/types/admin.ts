export interface DashboardStats {
    total_orders: number;
    total_revenue: number;
    total_profit: number;
    total_products: number;
    total_customers: number;
    pending_orders: number;
    recent_orders: Order[];
    revenue_history: { date: string; revenue: number; profit: number }[];
    order_status_distribution: { status: string; count: number }[];
}

export interface PartnerDashboardStats {
    total_sales: number;
    my_earnings: number;
    total_products: number;
    total_orders: number;
    pending_amount: number;
    total_withdrawn: number;
    delivered_orders: number;
    returned_orders: number;
    recent_orders: Order[];
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
    delivery_address?: string;
    delivery_city?: string;
    delivery_pincode?: string;
    notes?: string;
    status_display?: string;
    refund_status?: 'pending' | 'refunded' | 'not_applicable';
    cancellation_reason?: string;
    payment_status?: string;
    payment_status_display?: string;
    is_cod?: boolean;
    meesho_order_id?: string;
    payment_method?: string;
    supplier_total_cost?: number;
    profit?: number;
    tracking_number?: string;
    shipping_charge?: number;
    discount_amount?: number;
    // Courier & Logistics (Shiprocket style)
    courier_partner?: number | null;
    courier_partner_id?: number | null;
    courier_name?: string;
    courier_awb?: string;
    courier_tracking_url?: string;
    shipping_label_url?: string;
    shipment_id?: string;
    package_weight?: number;
    package_length?: number;
    package_width?: number;
    package_height?: number;
    volumetric_weight?: number;
    shipped_at?: string | null;
    delivered_at?: string | null;
    shipments?: Shipment[];
    estimated_package_specs?: {
        weight_kg: number;
        dimensions: { length: number; width: number; height: number };
    };
}

export interface Product {
    id: number;
    name: string;
    slug: string;
    description: string;

    // New Dropshipping Pricing
    mrp?: number;
    supplier_price?: number;
    our_price?: number;
    meesho_url?: string;

    // Legacy fields (for backward compatibility)
    price: number;
    sale_price: number | null;

    current_price: number;
    discount_percent?: number;
    profit_margin?: number;
    profit_percent?: number;

    stock: number;
    sku: string;
    // Package & Shipping Specifications
    weight_kg?: number;
    package_length?: number;
    package_width?: number;
    package_height?: number;
    hsn_code?: string;
    volumetric_weight?: number;

    shop?: { id: number; name: string; slug?: string; city?: string } | null;
    shop_name?: string;
    shop_id?: number;
    is_featured: boolean;
    is_active: boolean;
    approval_status?: 'pending' | 'approved' | 'rejected';
    image: string | null;
    images?: { id: number; image: string; is_primary: boolean }[];
    category_name?: string;
    status?: string;
    category?: { id: number; name: string };
    category_id?: number;
    created_at: string;
    created_by_name?: string;
    created_by_email?: string;
    views?: number;
    sold_count?: number;
    rating?: number;
    review_count?: number;
    stock_status?: 'in_stock' | 'low_stock' | 'out_of_stock';
    is_in_stock?: boolean;
    google_merchant_status?: 'pending' | 'synced' | 'failed' | 'not_applicable';
    google_merchant_errors?: string | null;
    last_google_sync?: string | null;
}

export interface TrackingEvent {
    status: string;
    activity: string;
    location: string;
    timestamp: string;
}

export interface Shipment {
    id: number;
    order: number;
    order_id: string;
    courier_partner?: number | null;
    courier_name: string;
    awb_code: string;
    shipment_id?: string;
    status: 'manifest_generated' | 'pickup_scheduled' | 'picked_up' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'rto_initiated' | 'rto_delivered' | 'cancelled';
    status_display?: string;
    weight_kg: number;
    package_length: number;
    package_width: number;
    package_height: number;
    volumetric_weight?: number;
    shipping_charge: number;
    cod_amount: number;
    is_cod: boolean;
    pickup_location: string;
    pickup_pincode: string;
    delivery_address: string;
    delivery_city: string;
    delivery_pincode: string;
    customer_name: string;
    customer_phone: string;
    label_url?: string;
    manifest_url?: string;
    tracking_url?: string;
    tracking_events?: TrackingEvent[];
    shipped_at?: string | null;
    delivered_at?: string | null;
    created_at: string;
    updated_at: string;
}

export interface CourierPartner {
    id: number;
    name: string;
    provider_code: 'shiprocket' | 'delhivery' | 'bluedart' | 'dtdc' | 'indiapost' | 'shadowfax' | 'manual';
    provider_name?: string;
    is_active: boolean;
    is_default: boolean;
    environment: 'SANDBOX' | 'PRODUCTION';
    environment_display?: string;
    api_email?: string;
    api_password?: string;
    api_key?: string;
    default_pickup_location: string;
    pickup_pincode: string;
    base_rate: number;
    per_kg_rate: number;
    cod_charge: number;
    tracking_url_template?: string;
    notes?: string;
    active_shipments_count?: number;
    created_at?: string;
    updated_at?: string;
}

export interface StockLog {
    id: number;
    product: number;
    product_name?: string;
    product_sku?: string;
    change_type: 'purchase' | 'return' | 'cancellation' | 'manual_in' | 'manual_out' | 'adjustment';
    change_type_display?: string;
    quantity_change: number;
    previous_stock: number;
    new_stock: number;
    reference: string;
    note: string;
    created_by_name?: string | null;
    created_at: string;
}


export interface Shop {
    id: number;
    name: string;
    slug: string;
    description?: string;
    address: string;
    city: string;
    phone: string;
    email: string;
    shop_type?: 'b2b_ecommerce' | 'local_shop' | 'single_product_wholesaler' | 'multi_product_seller' | 'retailer' | 'other';
    shop_type_display?: string;
    source_platform?: string;
    website_url?: string;
    contact_person?: string;
    whatsapp_number?: string;
    notes?: string;
    sourcing_partner?: number | null;
    sourcing_partner_id?: number | null;
    sourcing_partner_ids?: number[];
    sourcing_partner_name?: string;
    sourcing_partner_email?: string;
    sourcing_partners?: { id: number; user_id: number; name: string; email: string }[];
    image?: string | null;
    is_active?: boolean;
    approval_status?: 'pending' | 'approved' | 'rejected';
    product_count?: number;
    pending_payment?: number;
    pending_order_count?: number;
    created_at?: string;
}

export interface Category {
    id: number;
    name: string;
    slug: string;
    product_count?: number;
    parent?: number | null;
    parent_name?: string;
    image?: string | null;
    is_active?: boolean;
    description?: string;
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
    section: 'home_hero' | 'category_hero' | 'promo' | 'general';
    section_display?: string;
    is_active: boolean;
}

export interface SiteSetting {
    id: number;
    // Site & Branding
    site_name: string;
    site_tagline?: string;
    logo?: string | null;
    contact_email: string;
    contact_phone: string;
    address: string;
    facebook_url: string;
    instagram_url: string;
    whatsapp_number?: string;
    twitter_url: string;

    // Auth Management
    google_client_id?: string;
    google_oauth_client_id?: string;
    allow_user_registration?: boolean;
    allow_partner_registration?: boolean;
    session_timeout_hours?: number;
    session_timeout_minutes?: number;

    // Email Config Manage (SMTP / App Password)
    smtp_host?: string;
    smtp_port?: number;
    smtp_user?: string;
    smtp_password?: string;
    smtp_use_tls?: boolean;
    smtp_use_ssl?: boolean;
    default_from_email?: string;

    // Other APIs Manage
    twilio_account_sid?: string;
    twilio_auth_token?: string;
    twilio_whatsapp_from?: string;
    twilio_whatsapp_number?: string;
    firebase_project_id?: string;

    // Cashfree Payment Gateway Config
    cashfree_enabled?: boolean;
    cashfree_mode?: 'SANDBOX' | 'PRODUCTION';
    cashfree_app_id?: string;
    cashfree_secret_key?: string;
    cashfree_api_version?: string;
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
    phone?: string;
    is_staff: boolean;
    is_superuser: boolean;
    is_active: boolean;
    date_joined: string;
    roles?: Role[];
    role_ids?: number[];
    direct_permissions?: Permission[];
    all_permissions?: string[];
}
