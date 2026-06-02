import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { RelatedProduct } from '@/lib/staticBlog';

interface RelatedProductCardProps {
  product: RelatedProduct;
}

export default function RelatedProductCard({ product }: RelatedProductCardProps) {
  const handleProductClick = () => {
    // Custom Analytics Tracking
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'click_related_product_blog', {
        event_category: 'Blog Integration',
        event_label: product.name,
        product_slug: product.slug,
        destination_url: product.url
      });
    }
    console.log(`Analytics logged: Clicked related product '${product.name}'`);
  };

  return (
    <div className="my-8 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:shadow-md dark:border-gray-800 dark:bg-gray-900 md:flex">
      {product.image && (
        <div className="relative h-48 w-full shrink-0 bg-gray-50 dark:bg-gray-800 md:h-auto md:w-48">
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 100vw, 192px"
            className="object-cover object-center"
            loading="lazy"
          />
        </div>
      )}
      <div className="flex flex-col justify-between p-6">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            Featured Product Recommendation
          </span>
          <h4 className="mt-2 text-xl font-bold text-gray-950 dark:text-white">
            {product.name}
          </h4>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
            {product.excerpt || 'Neatly categorized, premium quality everyday item carefully reviewed and recommended by our team.'}
          </p>
        </div>
        <div className="mt-6 flex items-center">
          <Link
            href={product.url}
            onClick={handleProductClick}
            className="inline-flex items-center justify-center rounded-xl bg-gray-950 px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-gray-850 dark:bg-emerald-600 dark:hover:bg-emerald-500"
          >
            Shop Now & Get COD
          </Link>
        </div>
      </div>
    </div>
  );
}
