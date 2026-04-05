import type { Metadata } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { CartProvider } from '@/lib/cart';
import { AuthProvider } from '@/context/AuthContext';
import { CustomerAuthProvider } from '@/context/CustomerAuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import LayoutWrapper from '@/components/LayoutWrapper';
import { APP_URL } from '@/config/siteConfig';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space-grotesk' });

export const metadata: Metadata = {
    metadataBase: new URL(APP_URL),
    alternates: {
        canonical: '/',
    },
    title: {
        template: '%s | VorionMart',
        default: 'VorionMart - Premium D2C Store | Pay on Delivery',
    },
    description: 'Shop premium products with Cash on Delivery. Trusted, secure, and delivered to your doorstep. Pay when you receive. No hassle, pure convenience.',
    keywords: ['ecommerce', 'cash on delivery', 'COD shopping', 'online store', 'premium products', 'pay on delivery', 'trusted shopping', 'India delivery'],
    openGraph: {
        title: 'VorionMart - Premium D2C Store',
        description: 'Shop premium products with Cash on Delivery. Trusted, secure, and delivered to your doorstep.',
        url: '/',
        siteName: 'VorionMart',
        locale: 'en_IN',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'VorionMart - Premium D2C Store',
        description: 'Shop premium products with Cash on Delivery.',
    },
    robots: {
        index: true,
        follow: true,
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className="dark">
            <body className={`${inter.variable} ${spaceGrotesk.variable} font-sans bg-dark-900 text-white`}>
                <ThemeProvider>
                    <CustomerAuthProvider>
                        <CartProvider>
                            <LayoutWrapper>{children}</LayoutWrapper>
                        </CartProvider>
                    </CustomerAuthProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
