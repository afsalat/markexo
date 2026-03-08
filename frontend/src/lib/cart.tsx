'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Product, CartItem, fetchCart, addToCart as apiAddToCart, updateCartItem as apiUpdateCartItem, removeFromCart as apiRemoveFromCart, clearCart as apiClearCart } from './api';

interface CartContextType {
    items: CartItem[];
    addItem: (product: Product, quantity?: number) => void;
    removeItem: (productId: number) => void;
    updateQuantity: (productId: number, quantity: number) => void;
    clearCart: () => void;
    totalItems: number;
    totalAmount: number;
    setCustomerId: (id: string | null) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([]);
    const [customerId, setCustomerId] = useState<string | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);

    // Load customer ID from localStorage on mount
    useEffect(() => {
        const savedCustomerId = localStorage.getItem('VorionMart_customer_id');
        if (savedCustomerId) {
            setCustomerId(savedCustomerId);
        }
        setIsInitialized(true);
    }, []);

    // Save customer ID to localStorage when it changes
    useEffect(() => {
        if (customerId) {
            localStorage.setItem('VorionMart_customer_id', customerId);
        } else {
            localStorage.removeItem('VorionMart_customer_id');
        }
    }, [customerId]);

    // Load cart based on customer status
    useEffect(() => {
        if (!isInitialized) return;

        const loadCart = async () => {
            if (customerId) {
                // Load from database for authenticated users
                try {
                    const cartData = await fetchCart(customerId);
                    if (cartData.items) {
                        // Transform API response to match local CartItem format
                        const cartItems: CartItem[] = cartData.items.map((item: any) => ({
                            product: item.product,
                            quantity: item.quantity,
                        }));
                        setItems(cartItems);
                    }
                } catch (error) {
                    console.error('Failed to load cart from server:', error);
                    // Fall back to localStorage
                    const savedCart = localStorage.getItem('VorionMart_cart');
                    if (savedCart) {
                        try {
                            setItems(JSON.parse(savedCart));
                        } catch (e) {
                            console.error('Failed to parse cart', e);
                        }
                    }
                }
            } else {
                // Load from localStorage for guests
                const savedCart = localStorage.getItem('VorionMart_cart');
                if (savedCart) {
                    try {
                        setItems(JSON.parse(savedCart));
                    } catch (e) {
                        console.error('Failed to parse cart', e);
                    }
                }
            }
        };

        loadCart();
    }, [isInitialized, customerId]);

    // Save cart to localStorage for guests (backup)
    useEffect(() => {
        if (isInitialized) {
            localStorage.setItem('VorionMart_cart', JSON.stringify(items));
        }
    }, [items, isInitialized]);

    const addItem = useCallback(async (product: Product, quantity = 1) => {
        // Optimistic local update
        setItems((prev) => {
            const existingItem = prev.find((item) => item.product.id === product.id);
            if (existingItem) {
                return prev.map((item) =>
                    item.product.id === product.id
                        ? { ...item, quantity: item.quantity + quantity }
                        : item
                );
            }
            return [...prev, { product, quantity }];
        });

        // Sync with server if authenticated
        if (customerId) {
            try {
                await apiAddToCart(customerId, product.id, quantity);
            } catch (error) {
                console.error('Failed to sync add to cart:', error);
            }
        }
    }, [customerId]);

    const removeItem = useCallback(async (productId: number) => {
        // Optimistic local update
        setItems((prev) => prev.filter((item) => item.product.id !== productId));

        // Sync with server if authenticated
        if (customerId) {
            try {
                await apiRemoveFromCart(customerId, productId);
            } catch (error) {
                console.error('Failed to sync remove from cart:', error);
            }
        }
    }, [customerId]);

    const updateQuantity = useCallback(async (productId: number, quantity: number) => {
        if (quantity <= 0) {
            removeItem(productId);
            return;
        }

        // Optimistic local update
        setItems((prev) =>
            prev.map((item) =>
                item.product.id === productId ? { ...item, quantity } : item
            )
        );

        // Sync with server if authenticated
        if (customerId) {
            try {
                await apiUpdateCartItem(customerId, productId, quantity);
            } catch (error) {
                console.error('Failed to sync update cart:', error);
            }
        }
    }, [customerId, removeItem]);

    const clearCartFn = useCallback(async () => {
        // Optimistic local update
        setItems([]);

        // Sync with server if authenticated
        if (customerId) {
            try {
                await apiClearCart(customerId);
            } catch (error) {
                console.error('Failed to sync clear cart:', error);
            }
        }
    }, [customerId]);

    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = items.reduce(
        (sum, item) => sum + item.product.current_price * item.quantity,
        0
    );

    return (
        <CartContext.Provider
            value={{
                items,
                addItem,
                removeItem,
                updateQuantity,
                clearCart: clearCartFn,
                totalItems,
                totalAmount,
                setCustomerId,
            }}
        >
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}
