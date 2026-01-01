import type { Metadata } from 'next';
import { Inter, Outfit } from 'next/font/google';
import './globals.css';
import { CartProvider } from '@/lib/cart';
import { AuthProvider } from '@/context/AuthContext';
import { CustomerAuthProvider } from '@/context/CustomerAuthContext';
import LayoutWrapper from '@/components/LayoutWrapper';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' });

export const metadata: Metadata = {
    title: 'Markexo - Your Local Marketplace | Vorion Nexus Technology',
    description: 'Shop from the best local shops in your city. Quality products, fast delivery, great prices.',
    keywords: 'marketplace, local shopping, online store, ecommerce',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body className={`${inter.variable} ${outfit.variable} font-sans`}>
                <AuthProvider>
                    <CustomerAuthProvider>
                        <CartProvider>
                            <LayoutWrapper>{children}</LayoutWrapper>
                        </CartProvider>
                    </CustomerAuthProvider>
                </AuthProvider>
            </body>
        </html>
    );
}
