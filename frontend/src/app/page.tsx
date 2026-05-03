import { Metadata } from 'next';
import HomePage from './HomeClient';

export const metadata: Metadata = {
    title: 'VorionMart - Premium D2C Store | Pay on Delivery',
    description: 'Shop premium products with Cash on Delivery. Trusted, secure, and delivered to your doorstep. Pay when you receive. No hassle, pure convenience.',
    keywords: ['ecommerce', 'cash on delivery', 'COD shopping', 'online store', 'premium products', 'pay on delivery', 'trusted shopping', 'India delivery'],
    alternates: {
        canonical: '/',
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
        },
    },
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
};

export default function Page() {
    return <HomePage />;
}
