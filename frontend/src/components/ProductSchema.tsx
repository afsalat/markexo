import { Product, Review } from '@/lib/api';

interface ProductSchemaProps {
    product: Product;
    reviews?: Review[];
    faqs?: Array<{
        question: string;
        answer: string;
    }>;
}

export default function ProductSchema({ product, reviews = [], faqs = [] }: ProductSchemaProps) {
    const price = product.current_price || product.price || product.our_price || 0;
    const availability = product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock";
    const sku = product.sku || `VM-${product.id}`;
    const productUrl = `https://vorionmart.com/products/${product.slug}`;
    
    // Generate structured data for SEO
    const schemaData: any = {
        "@context": "https://schema.org/",
        "@type": "Product",
        "@id": `${productUrl}#product`,
        name: product.name,
        image: product.image || (product.images && product.images.length > 0 ? product.images[0].image : undefined),
        description: product.description,
        sku: sku,
        mpn: sku,
        category: product.category?.name,
        brand: {
            "@type": "Brand",
            name: "VorionMart"
        },
        offers: {
            "@type": "Offer",
            "@id": `${productUrl}#offer`,
            url: productUrl,
            priceCurrency: "INR",
            price: price,
            priceValidUntil: "2026-12-31",
            itemCondition: "https://schema.org/NewCondition",
            availability: availability,
            seller: {
                "@type": "Organization",
                name: "VorionMart",
                url: "https://vorionmart.com",
                logo: "https://vorionmart.com/logo.png"
            },
            shippingDetails: {
                "@type": "OfferShippingDetails",
                shippingRate: {
                    "@type": "MonetaryAmount",
                    value: 0,
                    currency: "INR"
                },
                shippingDestination: {
                    "@type": "DefinedRegion",
                    addressCountry: "IN"
                },
                deliveryTime: {
                    "@type": "ShippingDeliveryTime",
                    handlingTime: {
                        "@type": "QuantitativeValue",
                        minValue: 0,
                        maxValue: 1,
                        unitCode: "d"
                    },
                    transitTime: {
                        "@type": "QuantitativeValue",
                        minValue: 3,
                        maxValue: 7,
                        unitCode: "d"
                    }
                }
            },
            hasMerchantReturnPolicy: {
                "@type": "MerchantReturnPolicy",
                applicableCountry: "IN",
                returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnPeriod",
                merchantReturnDays: 7,
                returnMethod: "https://schema.org/ReturnByMail",
                returnFees: "https://schema.org/FreeReturn"
            }
        },
    };

    // Add identifier if it looks like a GTIN
    if (sku.length >= 8 && /^\d+$/.test(sku)) {
        schemaData.gtin13 = sku;
    }

    // Handle Reviews and AggregateRating
    if (reviews && reviews.length > 0) {
        const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
        const avgRating = Number((totalRating / reviews.length).toFixed(1));

        schemaData.aggregateRating = {
            "@type": "AggregateRating",
            ratingValue: avgRating,
            reviewCount: reviews.length,
            bestRating: 5,
            worstRating: 1
        };

        schemaData.review = reviews.slice(0, 5).map(review => ({
            "@type": "Review",
            reviewRating: {
                "@type": "Rating",
                ratingValue: review.rating,
                bestRating: 5,
                worstRating: 1
            },
            author: {
                "@type": "Person",
                name: review.customer_name || "Verified Customer"
            },
            reviewBody: review.comment,
            datePublished: review.created_at
        }));
    } else if (product.rating && product.rating > 0 && (product.review_count ?? 0) > 0) {
        // Fallback to product level rating ONLY if review_count is also > 0
        schemaData.aggregateRating = {
            "@type": "AggregateRating",
            ratingValue: product.rating,
            reviewCount: product.review_count,
            bestRating: 5,
            worstRating: 1
        };
    }

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify(schemaData, null, 2)
                }}
            />
            
            {/* FAQ Section with Schema */}
            {faqs && faqs.length > 0 && (
                <div className="mt-8 p-6 bg-gray-50 dark:bg-dark-900 rounded-2xl">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                        Frequently Asked Questions
                    </h2>
                    <div className="space-y-6">
                        {faqs.map((faq, index) => (
                            <div key={index} className="bg-white dark:bg-dark-800 p-6 rounded-xl border border-gray-200 dark:border-dark-700">
                                <div itemScope itemProp="mainEntity" itemType="https://schema.org/Question">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3" itemProp="name">
                                        {faq.question}
                                    </h3>
                                    <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                                        <p className="text-gray-700 dark:text-silver-300 leading-relaxed" itemProp="text">
                                            {faq.answer}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </>
    );
}
