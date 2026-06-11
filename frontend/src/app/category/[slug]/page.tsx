import type { Metadata } from 'next';
import ProductsPageClient from '../../products/ProductsPageClient';

type CategoryPageProps = {
    params: {
        slug: string;
    };
};

export function generateMetadata({ params }: CategoryPageProps): Metadata {
    const category = params.slug;
    const categoryName = category.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
    const title = `${categoryName} - Shop Online | VorionMart`;
    const description = `Shop the best ${categoryName} products online at VorionMart. Premium quality, verified sellers, and Cash on Delivery available across India.`;
    const canonicalPath = `https://vorionmart.com/category/${category}`;

    return {
        title,
        description,
        alternates: {
            canonical: canonicalPath,
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
            title,
            description,
            url: canonicalPath,
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

export default function CategoryPage({ params }: CategoryPageProps) {
    return <ProductsPageClient categorySlug={params.slug} />;
}
