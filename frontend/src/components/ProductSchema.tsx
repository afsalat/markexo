import { Product, Review } from '@/lib/api';
import { APP_URL } from '@/config/siteConfig';

interface ProductSchemaProps {
    product: Product;
    reviews?: Review[];
    faqs?: Array<{
        question: string;
        answer: string;
    }>;
}

export default function ProductSchema({ product, reviews = [], faqs = [] }: ProductSchemaProps) {
    const priceValue = Number(product.current_price || product.our_price || product.price || 0);
    const mrp = Number(product.mrp || product.price || priceValue);
    const availability = product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock";
    const sku = String(product.sku || `VM-${product.id}`);
    const productUrl = `${APP_URL}/products/${product.slug}`;
    const allImages = [
        product.image,
        ...(product.images || []).map((img: any) => img.image)
    ].filter(Boolean);
    
    // Generate structured data for SEO
    const schemaData: any = {
        "@context": "https://schema.org/",
        "@type": "Product",
        "@id": `${productUrl}#product`,
        "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": productUrl
        },
        "url": productUrl,
        "name": product.name,
        "image": allImages,
        "description": product.description?.replace(/<[^>]*>?/gm, '').substring(0, 5000), // Clean HTML and truncate
        "sku": sku,
        "mpn": sku,
        "category": product.category?.name,
        "brand": {
            "@type": "Brand",
            "name": "VorionMart"
        },
        "offers": {
            "@type": "Offer",
            "@id": `${productUrl}#offer`,
            "url": productUrl,
            "priceCurrency": "INR",
            "price": priceValue.toFixed(2),
            "priceValidUntil": new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
            "itemCondition": "https://schema.org/NewCondition",
            "availability": availability,
            "seller": {
                "@type": "Organization",
                "name": "VorionMart",
                "url": APP_URL,
                "logo": `${APP_URL}/logo.png`
            },
            "priceSpecification": {
                "@type": "PriceSpecification",
                "price": priceValue.toFixed(2),
                "priceCurrency": "INR",
                "valueAddedTaxIncluded": true
            },
            "shippingDetails": {
                "@type": "OfferShippingDetails",
                "shippingRate": {
                    "@type": "MonetaryAmount",
                    "value": (priceValue >= 500 ? 0 : 49).toFixed(2),
                    "currency": "INR"
                },
                "shippingDestination": {
                    "@type": "DefinedRegion",
                    "addressCountry": "IN"
                },
                "deliveryTime": {
                    "@type": "ShippingDeliveryTime",
                    "handlingTime": {
                        "@type": "QuantitativeValue",
                        "minValue": 0,
                        "maxValue": 1,
                        "unitCode": "d"
                    },
                    "transitTime": {
                        "@type": "QuantitativeValue",
                        "minValue": 3,
                        "maxValue": 7,
                        "unitCode": "DAY"
                    }
                }
            },
            "hasMerchantReturnPolicy": {
                "@type": "MerchantReturnPolicy",
                "applicableCountry": "IN",
                "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
                "merchantReturnDays": 7,
                "returnMethod": "https://schema.org/ReturnByMail",
                "returnFees": "https://schema.org/FreeReturn",
                "url": `${APP_URL}/return-refund-policy`
            }
        },
    };

    // Add GTIN fallback if SKU looks like one
    if (sku.length >= 8 && /^\d+$/.test(sku)) {
        schemaData.gtin13 = sku;
    }

    // Handle Reviews and AggregateRating
    const productRating = Number(product.rating || 0);
    const productReviewCount = Number(product.review_count || 0);

    if (reviews && reviews.length > 0) {
        const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
        const avgRating = Number((totalRating / reviews.length).toFixed(1));

        schemaData.aggregateRating = {
            "@type": "AggregateRating",
            "ratingValue": avgRating,
            "reviewCount": reviews.length,
            "bestRating": 5,
            "worstRating": 1
        };

        schemaData.review = reviews.slice(0, 5).map(review => ({
            "@type": "Review",
            "reviewRating": {
                "@type": "Rating",
                "ratingValue": review.rating,
                "bestRating": 5,
                "worstRating": 1
            },
            "author": {
                "@type": "Person",
                "name": review.customer_name || "Verified Customer"
            },
            "reviewBody": review.comment,
            "datePublished": review.created_at
        }));
    } else if (productRating > 0 && productReviewCount > 0) {
        schemaData.aggregateRating = {
            "@type": "AggregateRating",
            "ratingValue": productRating,
            "reviewCount": productReviewCount,
            "bestRating": 5,
            "worstRating": 1
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
