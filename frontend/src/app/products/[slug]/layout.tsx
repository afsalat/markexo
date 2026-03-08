import { Metadata, ResolvingMetadata } from 'next';
import { fetchProduct } from '@/lib/api';

type Props = {
    params: { slug: string }
}

export async function generateMetadata(
    { params }: Props,
    parent: ResolvingMetadata
): Promise<Metadata> {
    try {
        // Fetch data
        const product = await fetchProduct(params.slug);

        // Optionally access and extend (rather than replace) parent metadata
        // const previousImages = (await parent).openGraph?.images || [];

        return {
            title: product.name,
            description: product.description.substring(0, 160), // SEO standard length
            openGraph: {
                title: product.name,
                description: product.description.substring(0, 160),
                images: product.image ? [product.image] : [],
                type: 'website',
            },
            twitter: {
                card: 'summary_large_image',
                title: product.name,
                description: product.description.substring(0, 160),
                images: product.image ? [product.image] : [],
            }
        };
    } catch (error) {
        // Fallback metadata if API fails or product not found
        return {
            title: 'Product Not Found',
            description: 'The requested product could not be found.',
        };
    }
}

export default async function ProductDetailLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: { slug: string };
}) {
    let jsonLd = null;

    try {
        const product = await fetchProduct(params.slug);
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://vorionmart.com';

        jsonLd = {
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: product.name,
            image: product.image ? [product.image] : [],
            description: product.description.substring(0, 160),
            sku: product.id.toString(), // Minimum SKU string
            offers: {
                '@type': 'Offer',
                url: `${baseUrl}/products/${product.slug}`,
                priceCurrency: 'INR',
                price: product.current_price,
                // Valid for generic SEO, Google needs valid dates occasionally. Extend by 1 year.
                priceValidUntil: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
                itemCondition: 'https://schema.org/NewCondition',
                availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
            },
            ...(product.reviewCount > 0 ? {
                aggregateRating: {
                    '@type': 'AggregateRating',
                    ratingValue: product.rating,
                    reviewCount: product.reviewCount,
                }
            } : {})
        };
    } catch (e) {
        // Silently fail jsonLd parsing if product not found to prevent layout crash.
    }

    return (
        <>
            {jsonLd && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
                />
            )}
            {children}
        </>
    );
}
