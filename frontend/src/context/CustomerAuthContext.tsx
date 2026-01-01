'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

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
    status: 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
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
    login: (email: string, name: string) => void;
    logout: () => void;
    updateProfile: (data: Partial<Customer>) => void;
    // Wishlist
    wishlist: number[];
    addToWishlist: (productId: number) => void;
    removeFromWishlist: (productId: number) => void;
    isWishlisted: (productId: number) => boolean;
    // Addresses
    addresses: Address[];
    addAddress: (address: Omit<Address, 'id'>) => void;
    deleteAddress: (id: string) => void;
    // Orders (Mock)
    orders: Order[];
}

const CustomerAuthContext = createContext<CustomerAuthContextType | undefined>(undefined);

export function CustomerAuthProvider({ children }: { children: React.ReactNode }) {
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [wishlist, setWishlist] = useState<number[]>([]);
    const [addresses, setAddresses] = useState<Address[]>([]);
    const router = useRouter();

    // Mock Orders
    const orders: Order[] = [
        { id: 'ORD-837264', date: 'Dec 20, 2024', total: 4999, status: 'Delivered', items: 2 },
        { id: 'ORD-192837', date: 'Dec 15, 2024', total: 1299, status: 'Processing', items: 1 },
    ];

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
            setWishlist(JSON.parse(storedWishlist));
        }

        if (storedAddresses) {
            setAddresses(JSON.parse(storedAddresses));
        }
    }, []);

    const login = (email: string, name: string) => {
        const newCustomer = {
            id: 'CUST-' + Math.random().toString(36).substr(2, 9),
            name,
            email,
            phone: '',
            avatar: `https://ui-avatars.com/api/?name=${name.replace(' ', '+')}&background=random`
        };
        setCustomer(newCustomer);
        setIsAuthenticated(true);
        localStorage.setItem('customer_user', JSON.stringify(newCustomer));
        router.push('/profile');
    };

    const logout = () => {
        setCustomer(null);
        setIsAuthenticated(false);
        localStorage.removeItem('customer_user');
        router.push('/login');
    };

    const updateProfile = (data: Partial<Customer>) => {
        if (!customer) return;
        const updated = { ...customer, ...data };
        setCustomer(updated);
        localStorage.setItem('customer_user', JSON.stringify(updated));
    };

    // Wishlist Logic
    const addToWishlist = (productId: number) => {
        const updated = [...wishlist, productId];
        setWishlist(updated);
        localStorage.setItem('customer_wishlist', JSON.stringify(updated));
    };

    const removeFromWishlist = (productId: number) => {
        const updated = wishlist.filter(id => id !== productId);
        setWishlist(updated);
        localStorage.setItem('customer_wishlist', JSON.stringify(updated));
    };

    const isWishlisted = (productId: number) => wishlist.includes(productId);

    // Address Logic
    const addAddress = (address: Omit<Address, 'id'>) => {
        const newAddress = { ...address, id: Math.random().toString(36).substr(2, 9) };
        const updated = [...addresses, newAddress];
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
            customer, isAuthenticated, login, logout, updateProfile,
            wishlist, addToWishlist, removeFromWishlist, isWishlisted,
            addresses, addAddress, deleteAddress, orders
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
