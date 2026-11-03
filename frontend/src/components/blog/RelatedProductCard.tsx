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
    <div className="my-8 overflow-hidden neumorph-card p-3 md:flex gap-4">
      {product.image && (
        <div className="relative h-48 w-full shrink-0 neumorph-inset rounded-xl overflow-hidden md:h-auto md:w-48">
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
      <div className="flex flex-col justify-between p-4 sm:p-5 flex-1">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-accent-600">
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
            className="neumorph-btn-primary inline-flex items-center justify-center px-6 py-2.5 text-sm font-bold shadow-md"
          >
            Shop Now & Get COD
          </Link>
        </div>
      </div>
    </div>
  );
}
