import type { Metadata } from 'next';
import ProductsPageClient from './ProductsPageClient';

type ProductsPageProps = {
    searchParams?: {
        search?: string;
        category?: string;
        featured?: string;
        sort?: string;
    };
};

export function generateMetadata({ searchParams }: ProductsPageProps): Metadata {
    const search = searchParams?.search?.trim();
    const category = searchParams?.category?.trim();
    const featured = searchParams?.featured === 'true';
    const sort = searchParams?.sort?.trim();
    const hasVariant = Boolean(search || category || featured || sort);

    let title = 'Shop All Products | Premium Deals';
    let description = 'Browse our extensive collection of premium products across all categories. Find the best deals, verified sellers, and pay securely on delivery.';

    if (search) {
        title = `Search Results for "${search}"`;
        description = `Browse VorionMart search results for "${search}".`;
    } else if (category) {
        title = `${category} Products`;
        description = `Browse products in the ${category} category on VorionMart.`;
    } else if (featured) {
        title = 'Trending Products';
        description = 'Browse trending and featured products on VorionMart.';
    } else if (sort === 'newest') {
        title = 'New Arrivals';
        description = 'Browse the newest product arrivals on VorionMart.';
    }

    return {
        title,
        description,
        alternates: {
            canonical: '/products',
        },
        robots: hasVariant
            ? {
                index: false,
                follow: true,
                googleBot: {
                    index: false,
                    follow: true,
                },
            }
            : {
                index: true,
                follow: true,
            },
        openGraph: {
            title,
            description,
            url: '/products',
            siteName: 'VorionMart',
            locale: 'en_IN',
            type: 'website',
        },
        twitter: {
            card: 'summary',
            title,
            description,
        },
    };
}

export default function ProductsPage() {
    return <ProductsPageClient />;
}
