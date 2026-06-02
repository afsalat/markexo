import { Metadata } from 'next';
import { getStaticBlogPosts } from '@/lib/staticBlog';
import BlogClient from './BlogClient';

export async function generateMetadata(): Promise<Metadata> {
    const blogPosts = getStaticBlogPosts();
    const totalPosts = blogPosts.length;
    const latestPost = blogPosts[0];
    
    return {
        title: 'VorionMart Blog | Expert Shopping Guides & Product Reviews',
        description: `Discover expert shopping guides, deep product reviews, and lifestyle tips at VorionMart. Read ${totalPosts}+ articles with cash on delivery across India.`,
        keywords: [
            'online shopping blog',
            'product reviews',
            'shopping guides',
            'COD shopping tips',
            'premium products India',
            'lifestyle blog',
            'product recommendations',
            'best products India'
        ],
        openGraph: {
            title: 'VorionMart Blog | Expert Shopping Guides & Reviews',
            description: `Expert shopping guides and product reviews. Read ${totalPosts}+ helpful articles on premium products.`,
            images: latestPost?.featured_image ? [latestPost.featured_image] : [],
            url: 'https://vorionmart.com/blog',
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title: 'VorionMart Blog | Expert Shopping Guides',
            description: 'Expert shopping guides and product reviews on premium products with COD delivery.',
            images: latestPost?.featured_image ? [latestPost.featured_image] : [],
        },
        alternates: {
            canonical: '/blog',
        },
        robots: {
            index: true,
            follow: true,
        },
    };
}

export default function BlogPage() {
    const blogPosts = getStaticBlogPosts();
    return <BlogClient blogPosts={blogPosts} />;
}
