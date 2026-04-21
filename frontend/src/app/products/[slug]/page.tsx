import { notFound } from 'next/navigation';
import { fetchProduct, Product } from '@/lib/api';
import ProductDetailClient from './ProductDetailClient';
import { Metadata } from 'next';

type Props = {
    params: { slug: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    try {
        const product = await fetchProduct(params.slug);
        
        // Extract category for better targeting
        const category = product.category?.name || 'Premium Products';
        const price = product.price || '0';
        const discountText = product.discount_percent > 0 ? ` | ${product.discount_percent}% OFF` : '';
        
        // Include benefits in description for SEO
        const benefitsText = product.benefits && product.benefits.length > 0 
            ? `. Features: ${product.benefits.slice(0, 3).join(', ')}` 
            : '';
        
        return {
            title: `Buy ${product.name} Online | ${category} | ₹${price}${discountText} | COD Available`,
            description: `${product.name} - Premium quality ${category.toLowerCase()} at best price${benefitsText}. Cash on delivery available across India. Fast shipping & easy returns.`,
            keywords: [
                product.name,
                category,
                `buy ${product.name.toLowerCase()}`,
                `${category.toLowerCase()} online`,
                'cash on delivery',
                'COD shopping',
                'premium products',
                'online shopping India',
                ...(product.benefits || []).slice(0, 5)
            ],
            openGraph: {
                title: `${product.name} | ${category} | ₹${price}${discountText}`,
                description: `Shop ${product.name} - Premium ${category.toLowerCase()} with cash on delivery. Fast shipping across India.`,
                images: product.image ? [product.image] : [],
            },
            twitter: {
                card: 'summary_large_image',
                title: `${product.name} | ${category} | ₹${price}${discountText}`,
                description: `Shop ${product.name} - Premium ${category.toLowerCase()} with cash on delivery. Fast shipping across India.`,
                images: product.image ? [product.image] : [],
            },
        };
    } catch {
        return {
            title: 'Product Not Found | VorionMart',
            description: 'The product you are looking for is not available.',
        };
    }
}

export default async function ProductDetailPage({ params }: Props) {
    let product: Product;

    try {
        product = await fetchProduct(params.slug);
    } catch {
        notFound();
    }

    return <ProductDetailClient slug={params.slug} initialProduct={product} />;
}
