import React from 'react';
import { StaticBlogPost } from '@/lib/staticBlog';
import { APP_URL } from '@/config/siteConfig';

interface BlogStructuredDataProps {
  post: StaticBlogPost;
}

export default function BlogStructuredData({ post }: BlogStructuredDataProps) {
  const baseUrl = APP_URL;
  const postUrl = `${baseUrl}/blog/${post.slug}`;
  const publisherName = 'VorionMart';
  const publisherLogo = `${baseUrl}/icon.png`;

  // 1. BlogPosting Schema
  const blogPostingSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    'mainEntityOfPage': {
      '@type': 'WebPage',
      '@id': postUrl,
    },
    'headline': post.title,
    'description': post.excerpt,
    'image': post.featured_image,
    'datePublished': post.publish_date,
    'dateModified': post.publish_date,
    'author': {
      '@type': 'Person',
      'name': post.author,
    },
    'publisher': {
      '@type': 'Organization',
      'name': publisherName,
      'logo': {
        '@type': 'ImageObject',
        'url': publisherLogo,
      },
    },
  };

  // 2. BreadcrumbList Schema
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': [
      {
        '@type': 'ListItem',
        'position': 1,
        'name': 'Home',
        'item': baseUrl,
      },
      {
        '@type': 'ListItem',
        'position': 2,
        'name': 'Blog',
        'item': `${baseUrl}/blog`,
      },
      {
        '@type': 'ListItem',
        'position': 3,
        'name': post.title,
        'item': postUrl,
      },
    ],
  };

  // 3. Product Schemas for related products
  const productSchemas = post.related_products?.map(prod => ({
    '@context': 'https://schema.org',
    '@type': 'Product',
    'name': prod.name,
    'image': prod.image || post.featured_image,
    'description': prod.excerpt || `${prod.name} available at VorionMart.`,
    'offers': {
      '@type': 'Offer',
      'url': `${baseUrl}${prod.url}`,
      'priceCurrency': 'INR',
      'price': '399.00', // Fallback standard pricing
      'itemCondition': 'https://schema.org/NewCondition',
      'availability': 'https://schema.org/InStock',
    },
  })) || [];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostingSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {productSchemas.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </>
  );
}
