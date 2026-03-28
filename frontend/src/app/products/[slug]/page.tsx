import { notFound } from 'next/navigation';
import { fetchProduct, Product } from '@/lib/api';
import ProductDetailClient from './ProductDetailClient';

type Props = {
    params: { slug: string };
};

export default async function ProductDetailPage({ params }: Props) {
    let product: Product;

    try {
        product = await fetchProduct(params.slug);
    } catch {
        notFound();
    }

    return <ProductDetailClient slug={params.slug} initialProduct={product} />;
}
