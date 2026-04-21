'use client';

import { Product } from '@/lib/api';

interface ProductSchemaProps {
    product: Product;
    faqs?: Array<{
        question: string;
        answer: string;
    }>;
}

export default function ProductSchema({ product, faqs = [] }: ProductSchemaProps) {
    // Generate structured data for SEO
    const schemaData = {
        "@context": "https://schema.org/",
        "@type": "Product",
        name: product.name,
        image: product.image || product.images?.[0]?.image,
        description: product.description,
        brand: {
            "@type": "Brand",
            name: "VorionMart"
        },
        offers: {
            "@type": "Offer",
            priceCurrency: "INR",
            price: product.current_price || product.price,
            availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            priceValidUntil: product.discount_percent > 0 ? undefined : undefined,
            seller: {
                "@type": "Organization",
                name: "VorionMart"
            }
        },
        aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: product.rating || 0,
            reviewCount: product.review_count || 0,
            bestRating: "5",
            worstRating: "1"
        },
        additionalProperty: [
            ...(product.benefits?.map((benefit, index) => ({
                "@type": "PropertyValue",
                name: `Benefit ${index + 1}`,
                value: benefit
            })) || []),
            ...(faqs?.map((faq, index) => ({
                "@type": "Question",
                name: `FAQ ${index + 1}`,
                acceptedAnswer: {
                    "@type": "Answer",
                    text: faq.answer
                }
            })) || [])
        ]
    };

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
