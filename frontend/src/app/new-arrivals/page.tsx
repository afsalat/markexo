import type { Metadata } from 'next';
import ProductsPageClient from '@/app/products/ProductsPageClient';

export const metadata: Metadata = {
    title: 'New Arrivals | VorionMart',
    description: 'Explore the newest and freshest product arrivals at VorionMart. Stay ahead of the curve with our latest premium collections.',
    openGraph: {
        title: 'New Arrivals | VorionMart',
        description: 'Explore the newest and freshest product arrivals at VorionMart.',
        url: '/new-arrivals',
        siteName: 'VorionMart',
        locale: 'en_IN',
        type: 'website',
    },
};

export default function NewArrivalsPage() {
    return (
        <ProductsPageClient 
            initialSort="newest"
            pageTitle="New Arrivals"
        />
    );
}
