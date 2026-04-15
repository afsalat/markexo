import type { Metadata } from 'next';
import ProductsPageClient from '@/app/products/ProductsPageClient';

export const metadata: Metadata = {
    title: 'Trending Products | VorionMart',
    description: 'Browse the hottest and most popular products trending right now on VorionMart. Hand-picked premium selections with verified quality.',
    openGraph: {
        title: 'Trending Products | VorionMart',
        description: 'Browse the hottest and most popular products trending right now on VorionMart.',
        url: '/trending',
        siteName: 'VorionMart',
        locale: 'en_IN',
        type: 'website',
    },
};

export default function TrendingPage() {
    return (
        <ProductsPageClient 
            initialFeatured={true}
            pageTitle="Trending Products"
        />
    );
}
