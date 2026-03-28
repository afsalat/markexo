import { Metadata, ResolvingMetadata } from 'next';
import { fetchProduct, fetchReviews } from '@/lib/api';
import { APP_URL } from '@/config/siteConfig';

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
        const reviewsResponse = await fetchReviews(product.id).catch(() => []);
        const reviews = Array.isArray(reviewsResponse)
            ? reviewsResponse
            : Array.isArray(reviewsResponse?.results)
                ? reviewsResponse.results
                : [];
        const productImage = product.image || product.images?.[0]?.image || null;
        const productUrl = `${APP_URL}/products/${product.slug}`;
        const reviewCount = Number(product.review_count ?? product.reviewCount ?? reviews.length ?? 0);
        const ratingValue = Number(product.rating ?? 0);
        const salePrice = Number(product.current_price ?? product.price ?? 0);
        const shippingRate = salePrice >= 500 ? 0 : 49;
        const firstReview = reviews[0];

        jsonLd = {
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: product.name,
            url: productUrl,
            ...(productImage ? { image: [productImage] } : {}),
            description: product.description.substring(0, 160),
            sku: String(product.sku || product.id),
            mpn: String(product.sku || product.id),
            brand: {
                '@type': 'Brand',
                name: 'VorionMart',
            },
            offers: {
                '@type': 'Offer',
                url: productUrl,
                priceCurrency: 'INR',
                price: Number(product.current_price ?? product.price ?? 0).toFixed(2),
                // Valid for generic SEO, Google needs valid dates occasionally. Extend by 1 year.
                priceValidUntil: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
                itemCondition: 'https://schema.org/NewCondition',
                availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
                hasMerchantReturnPolicy: {
                    '@type': 'MerchantReturnPolicy',
                    applicableCountry: 'IN',
                    returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
                    merchantReturnDays: 7,
                    returnMethod: 'https://schema.org/ReturnByMail',
                    returnFees: 'https://schema.org/FreeReturn',
                    url: `${APP_URL}/return-refund-policy`,
                },
                shippingDetails: {
                    '@type': 'OfferShippingDetails',
                    shippingRate: {
                        '@type': 'MonetaryAmount',
                        value: shippingRate.toFixed(2),
                        currency: 'INR',
                    },
                    shippingDestination: {
                        '@type': 'DefinedRegion',
                        addressCountry: 'IN',
                    },
                    deliveryTime: {
                        '@type': 'ShippingDeliveryTime',
                        handlingTime: {
                            '@type': 'QuantitativeValue',
                            minValue: 0,
                            maxValue: 1,
                            unitCode: 'DAY',
                        },
                        transitTime: {
                            '@type': 'QuantitativeValue',
                            minValue: 5,
                            maxValue: 10,
                            unitCode: 'DAY',
                        },
                    },
                    url: `${APP_URL}/shipping-policy`,
                },
            },
            ...(reviewCount > 0 ? {
                aggregateRating: {
                    '@type': 'AggregateRating',
                    ratingValue: ratingValue || 0,
                    reviewCount,
                }
            } : {}),
            ...(firstReview ? {
                review: {
                    '@type': 'Review',
                    author: {
                        '@type': 'Person',
                        name: firstReview.customer_name,
                    },
                    reviewRating: {
                        '@type': 'Rating',
                        ratingValue: firstReview.rating,
                        bestRating: 5,
                    },
                    ...(firstReview.comment ? { reviewBody: firstReview.comment } : {}),
                    ...(firstReview.created_at ? { datePublished: firstReview.created_at } : {}),
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
