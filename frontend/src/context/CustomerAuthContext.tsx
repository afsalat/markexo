'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { loginUser, fetchCustomerOrders, Product } from '@/lib/api';

export interface Customer {
    id: string;
    name: string;
    email: string;
    phone: string;
    avatar?: string;
}

export interface Order {
    id: string;
    date: string;
    total: number;
    status: string; // Changed from hardcoded union to string to support all statuses
    items: number;
}

interface Address {
    id: string;
    type: 'Home' | 'Work' | 'Other';
    name: string;
    phone: string;
    address: string;
    city: string;
    pincode: string;
    isDefault: boolean;
}

interface CustomerAuthContextType {
    customer: Customer | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    updateProfile: (data: Partial<Customer>) => void;
    // Wishlist
    wishlist: Product[];
    addToWishlist: (product: Product) => void;
    removeFromWishlist: (productId: number) => void;
    isWishlisted: (productId: number) => boolean;
    // Addresses
    addresses: Address[];
    addAddress: (address: Omit<Address, 'id'>) => void;
    updateAddress: (id: string, address: Omit<Address, 'id'>) => void;
    deleteAddress: (id: string) => void;
    // Orders
    orders: Order[];
    refreshOrders: () => Promise<void>;
}

const CustomerAuthContext = createContext<CustomerAuthContextType | undefined>(undefined);

export function CustomerAuthProvider({ children }: { children: React.ReactNode }) {
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [wishlist, setWishlist] = useState<Product[]>([]);
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const router = useRouter();

    // Fetch orders for customer
    const refreshOrders = async () => {
        if (!customer?.email) return;
        try {
            const data = await fetchCustomerOrders(customer.email);
            const transformedOrders: Order[] = data.map((order: any) => ({
                id: order.order_id,
                date: new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                total: parseFloat(order.total_amount),
                status: order.status_display || order.status,
                items: order.items?.length || 0
            }));
            setOrders(transformedOrders);
        } catch (error) {
            console.error('Failed to fetch orders:', error);
        }
    };

    // Load state from localStorage on mount
    useEffect(() => {
        const storedCustomer = localStorage.getItem('customer_user');
        const storedWishlist = localStorage.getItem('customer_wishlist');
        const storedAddresses = localStorage.getItem('customer_addresses');

        if (storedCustomer) {
            setCustomer(JSON.parse(storedCustomer));
            setIsAuthenticated(true);
        }

        if (storedWishlist) {
            try {
                const parsed = JSON.parse(storedWishlist);
                // Check if it's the old format (array of numbers)
                if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'number') {
                    // Clear legacy data
                    setWishlist([]);
                    localStorage.removeItem('customer_wishlist');
                } else {
                    setWishlist(parsed);
                }
            } catch (e) {
                setWishlist([]);
            }
        }

        if (storedAddresses) {
            setAddresses(JSON.parse(storedAddresses));
        }
        setIsLoading(false);
    }, []);

    // Fetch orders when customer changes
    useEffect(() => {
        if (customer?.email) {
            refreshOrders();
        }
    }, [customer?.email]);

    const login = async (email: string, password: string) => {
        setIsLoading(true);
        try {
            const data = await loginUser({ email, password });

            // Backend returns: { refresh, access, user: { id, email, name, is_staff } }
            const { access, refresh, user } = data;

            const newCustomer: Customer = {
                id: user.id.toString(),
                name: user.name || user.email.split('@')[0],
                email: user.email,
                phone: '',
                avatar: `https://ui-avatars.com/api/?name=${(user.name || 'User').replace(' ', '+')}&background=random`
            };

            setCustomer(newCustomer);
            setIsAuthenticated(true);

            localStorage.setItem('customer_user', JSON.stringify(newCustomer));
            localStorage.setItem('access_token', access);
            localStorage.setItem('refresh_token', refresh);

        } catch (error) {
            console.error('Login failed:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = () => {
        setCustomer(null);
        setIsAuthenticated(false);
        localStorage.removeItem('customer_user');
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        router.push('/login');
    };

    const updateProfile = (data: Partial<Customer>) => {
        if (!customer) return;
        const updated = { ...customer, ...data };
        setCustomer(updated);
        localStorage.setItem('customer_user', JSON.stringify(updated));
    };

    // Wishlist Logic
    const addToWishlist = (product: Product) => {
        if (!wishlist.some(item => item.id === product.id)) {
            const updated = [...wishlist, product];
            setWishlist(updated);
            localStorage.setItem('customer_wishlist', JSON.stringify(updated));
        }
    };

    const removeFromWishlist = (productId: number) => {
        const updated = wishlist.filter(item => item.id !== productId);
        setWishlist(updated);
        localStorage.setItem('customer_wishlist', JSON.stringify(updated));
    };

    const isWishlisted = (productId: number) => wishlist.some(item => item.id === productId);

    // Address Logic
    const addAddress = (address: Omit<Address, 'id'>) => {
        const newAddress = { ...address, id: Math.random().toString(36).substr(2, 9) };
        let updated = [...addresses, newAddress];

        // If new address is default, unset others
        if (address.isDefault) {
            updated = updated.map(a => a.id === newAddress.id ? a : { ...a, isDefault: false });
        }

        setAddresses(updated);
        localStorage.setItem('customer_addresses', JSON.stringify(updated));
    };

    const updateAddress = (id: string, address: Omit<Address, 'id'>) => {
        let updated = addresses.map(a => a.id === id ? { ...address, id } : a);

        // If updated address is default, unset others
        if (address.isDefault) {
            updated = updated.map(a => a.id === id ? a : { ...a, isDefault: false });
        }

        setAddresses(updated);
        localStorage.setItem('customer_addresses', JSON.stringify(updated));
    };

    const deleteAddress = (id: string) => {
        const updated = addresses.filter(a => a.id !== id);
        setAddresses(updated);
        localStorage.setItem('customer_addresses', JSON.stringify(updated));
    };

    return (
        <CustomerAuthContext.Provider value={{
            customer, isAuthenticated, isLoading, login, logout, updateProfile,
            wishlist, addToWishlist, removeFromWishlist, isWishlisted,
            addresses, addAddress, updateAddress, deleteAddress, orders, refreshOrders
        }}>
            {children}
        </CustomerAuthContext.Provider>
    );
}

export const useCustomerAuth = () => {
    const context = useContext(CustomerAuthContext);
    if (context === undefined) {
        throw new Error('useCustomerAuth must be used within a CustomerAuthProvider');
    }
    return context;
};
