/**
 * Meta Pixel (Facebook Pixel) Tracking Utilities for VorionMart
 * Pixel ID: 888338177639026
 *
 * Provides TypeScript-safe methods for Meta standard events:
 * - PageView
 * - ViewContent
 * - AddToCart
 * - InitiateCheckout
 * - Purchase
 */

export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || '888338177639026';

declare global {
    interface Window {
        fbq?: (...args: any[]) => void;
        _fbq?: (...args: any[]) => void;
    }
}

export interface MetaProductItem {
    id: string | number;
    name?: string;
    price: number;
    quantity?: number;
    category?: string;
}

export interface ViewContentParams {
    id: string | number;
    name: string;
    price: number;
    category?: string;
    currency?: string;
}

export interface AddToCartParams {
    id: string | number;
    name: string;
    price: number;
    quantity?: number;
    category?: string;
    currency?: string;
}

export interface InitiateCheckoutParams {
    items: MetaProductItem[];
    totalValue: number;
    currency?: string;
}

export interface PurchaseParams {
    orderId: string;
    value: number;
    currency?: string;
    items?: MetaProductItem[];
}

/**
 * Low-level safe wrapper around window.fbq
 */
export const fbq = (...args: any[]) => {
    if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
        try {
            window.fbq(...args);
        } catch (err) {
            console.error('[Meta Pixel] Error calling fbq:', err);
        }
    }
};

/**
 * Tracks PageView on initial load and client-side route changes.
 */
export const trackPageView = (url?: string) => {
    if (typeof window === 'undefined') return;
    fbq('track', 'PageView');
};

/**
 * Tracks ViewContent when a customer views a product detail page.
 */
export const trackViewContent = (params: ViewContentParams) => {
    if (typeof window === 'undefined') return;
    const { id, name, price, category, currency = 'INR' } = params;
    fbq('track', 'ViewContent', {
        content_name: name,
        content_category: category || '',
        content_ids: [String(id)],
        content_type: 'product',
        value: Number(price) || 0,
        currency,
    });
};

/**
 * Tracks AddToCart when an item is added to the cart.
 */
export const trackAddToCart = (params: AddToCartParams) => {
    if (typeof window === 'undefined') return;
    const { id, name, price, quantity = 1, category, currency = 'INR' } = params;
    const unitPrice = Number(price) || 0;
    const qty = Number(quantity) || 1;
    const totalValue = unitPrice * qty;

    fbq('track', 'AddToCart', {
        content_name: name,
        content_category: category || '',
        content_ids: [String(id)],
        content_type: 'product',
        value: totalValue,
        currency,
    });
};

// Throttle InitiateCheckout to prevent duplicate events within 10 seconds (e.g. cart click to checkout mount)
let lastInitiateCheckoutTime = 0;

/**
 * Tracks InitiateCheckout when a customer enters the checkout flow.
 */
export const trackInitiateCheckout = (params: InitiateCheckoutParams) => {
    if (typeof window === 'undefined') return;
    const now = Date.now();
    if (now - lastInitiateCheckoutTime < 10000) {
        return;
    }
    lastInitiateCheckoutTime = now;

    const { items, totalValue, currency = 'INR' } = params;
    const contentIds = items.map((item) => String(item.id));
    const contents = items.map((item) => ({
        id: String(item.id),
        quantity: Number(item.quantity) || 1,
        item_price: Number(item.price) || 0,
    }));
    const numItems = items.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);

    fbq('track', 'InitiateCheckout', {
        content_ids: contentIds,
        content_type: 'product',
        contents,
        num_items: numItems,
        value: Number(totalValue) || 0,
        currency,
    });
};

// Set to ensure each order ID only triggers Purchase once per session
const trackedPurchases = new Set<string>();

/**
 * Tracks Purchase ONLY after a successful order confirmation from the backend.
 * Uses orderId as eventID for deduplication against server-side Conversions API.
 */
export const trackPurchase = (params: PurchaseParams) => {
    if (typeof window === 'undefined') return;
    const { orderId, value, currency = 'INR', items = [] } = params;

    if (!orderId) {
        console.warn('[Meta Pixel] trackPurchase skipped: missing orderId');
        return;
    }

    const cleanOrderId = String(orderId).trim();
    if (trackedPurchases.has(cleanOrderId)) {
        return;
    }

    // Secondary browser storage guard for page reloads / hot-reloads
    try {
        const storageKey = `meta_purchase_${cleanOrderId}`;
        if (sessionStorage.getItem(storageKey)) {
            return;
        }
        sessionStorage.setItem(storageKey, 'true');
    } catch {
        // Storage access might be restricted; continue with in-memory set
    }

    trackedPurchases.add(cleanOrderId);

    const contentIds = items.map((item) => String(item.id));
    const contents = items.map((item) => ({
        id: String(item.id),
        quantity: Number(item.quantity) || 1,
        item_price: Number(item.price) || 0,
    }));
    const numItems = items.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);

    fbq(
        'track',
        'Purchase',
        {
            content_ids: contentIds,
            content_type: 'product',
            contents,
            num_items: numItems,
            value: Number(value) || 0,
            currency,
        },
        { eventID: cleanOrderId }
    );
};
