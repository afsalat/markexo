import { Metadata, ResolvingMetadata } from 'next';
import { fetchProduct, fetchReviews, type Review } from '@/lib/api';
import { APP_URL } from '@/config/siteConfig';
import { absoluteUrl } from '@/lib/seo';

type Props = {
    params: { slug: string }
}

function truncateDescription(description: string) {
    return description.slice(0, 160).trim();
}

function getProductImages(product: {
    image?: string | null;
    images?: { image: string }[];
}) {
    return [
        ...(product.image ? [product.image] : []),
        ...((product.images || []).map((image) => image.image).filter(Boolean)),
    ].filter((value, index, array) => array.indexOf(value) === index);
}

export async function generateMetadata(
    { params }: Props,
    _parent: ResolvingMetadata
): Promise<Metadata> {
    try {
        const product = await fetchProduct(params.slug);
        const description = truncateDescription(product.description || '');
        const productImages = getProductImages(product);

        return {
            title: product.name,
            description,
            alternates: {
                canonical: `/products/${product.slug}`,
            },
            openGraph: {
                title: product.name,
                description,
                url: absoluteUrl(`/products/${product.slug}`),
                siteName: 'VorionMart',
                locale: 'en_IN',
                images: productImages.map((url) => ({
                    url,
                    alt: product.name,
                })),
                type: 'website',
            },
            twitter: {
                card: productImages.length > 0 ? 'summary_large_image' : 'summary',
                title: product.name,
                description,
                images: productImages,
            },
        };
    } catch {
        // Fallback metadata if API fails or product not found
        return {
            title: 'Product Not Found',
            description: 'The requested product could not be found.',
            robots: {
                index: false,
                follow: false,
            },
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
        const productImages = getProductImages(product);
        const productUrl = `${APP_URL}/products/${product.slug}`;
        const description = truncateDescription(product.description || '');
        const reviewCount = Number(product.review_count ?? product.reviewCount ?? reviews.length ?? 0);
        const ratingValue = Number(product.rating ?? 0);
        const salePrice = Number(product.current_price ?? product.price ?? 0);
        const shippingRate = salePrice >= 500 ? 0 : 49;
        const schemaReviews = reviews.slice(0, 3)
            .filter((review: Review) => Boolean(review?.comment) && Number(review?.rating) > 0)
            .map((review: Review) => ({
                '@type': 'Review',
                author: {
                    '@type': 'Person',
                    name: review.customer_name || 'Verified customer',
                },
                reviewRating: {
                    '@type': 'Rating',
                    ratingValue: Number(review.rating),
                    bestRating: 5,
                    worstRating: 1,
                },
                ...(review.comment ? { reviewBody: review.comment } : {}),
                ...(review.created_at ? { datePublished: review.created_at } : {}),
                ...(review.verified ? {
                    isVerifiedPurchase: true,
                } : {}),
            }));

        jsonLd = {
            '@context': 'https://schema.org',
            '@graph': [
                {
                    '@type': 'BreadcrumbList',
                    itemListElement: [
                        {
                            '@type': 'ListItem',
                            position: 1,
                            name: 'Home',
                            item: APP_URL,
                        },
                        {
                            '@type': 'ListItem',
                            position: 2,
                            name: 'Products',
                            item: `${APP_URL}/products`,
                        },
                        ...(product.category?.name
                            ? [{
                                '@type': 'ListItem',
                                position: 3,
                                name: product.category.name,
                                item: `${APP_URL}/products?category=${product.category.slug}`,
                            }]
                            : []),
                        {
                            '@type': 'ListItem',
                            position: product.category?.name ? 4 : 3,
                            name: product.name,
                            item: productUrl,
                        },
                    ],
                },
                {
                    '@type': 'Product',
                    name: product.name,
                    url: productUrl,
                    mainEntityOfPage: productUrl,
                    ...(productImages.length > 0 ? { image: productImages } : {}),
                    description,
                    sku: String(product.sku || product.id),
                    mpn: String(product.sku || product.id),
                    brand: {
                        '@type': 'Brand',
                        name: 'VorionMart',
                    },
                    category: product.category?.name,
                    offers: {
                        '@type': 'Offer',
                        url: productUrl,
                        priceCurrency: 'INR',
                        price: Number(product.current_price ?? product.price ?? 0).toFixed(2),
                        priceValidUntil: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
                        itemCondition: 'https://schema.org/NewCondition',
                        availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
                        seller: {
                            '@type': 'Organization',
                            name: 'VorionMart',
                        },
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
                    ...(reviewCount > 0 && ratingValue > 0 ? {
                        aggregateRating: {
                            '@type': 'AggregateRating',
                            ratingValue,
                            ratingCount: reviewCount,
                            reviewCount,
                            bestRating: 5,
                            worstRating: 1,
                        }
                    } : {}),
                    ...(schemaReviews.length > 0 ? { review: schemaReviews } : {}),
                },
            ],
        };
    } catch {
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
