import { Metadata } from 'next';
import { fetchBlogPosts } from '@/lib/api';
import BlogClient from './BlogClient';

export async function generateMetadata(): Promise<Metadata> {
    try {
        const blogResponse = await fetchBlogPosts({ is_published: 'true', limit: '10' });
        const blogPosts = Array.isArray(blogResponse) ? blogResponse : (blogResponse.results || []);
        
        const totalPosts = blogPosts.length;
        const latestPost = blogPosts[0];
        
        return {
            title: 'VorionMart Blog - Expert Shopping Guides & Product Reviews',
            description: `Discover expert shopping guides, product reviews, and lifestyle tips at VorionMart. ${totalPosts}+ articles on premium products with COD delivery across India.`,
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
                title: 'VorionMart Blog - Expert Shopping Guides',
                description: `Expert shopping guides and product reviews. ${totalPosts}+ articles on premium products with cash on delivery.`,
                images: latestPost?.featured_image ? [latestPost.featured_image] : [],
            },
            twitter: {
                card: 'summary_large_image',
                title: 'VorionMart Blog - Expert Shopping Guides',
                description: 'Expert shopping guides and product reviews on premium products with COD delivery.',
            },
        };
    } catch {
        return {
            title: 'VorionMart Blog - Shopping Guides & Reviews',
            description: 'Discover expert shopping guides, product reviews, and lifestyle tips at VorionMart.',
        };
    }
}

export default async function BlogPage() {
    // Fetch blog posts on server side
    const blogResponse = await fetchBlogPosts({ is_published: 'true', limit: '20' });
    const blogPosts = Array.isArray(blogResponse) ? blogResponse : (blogResponse.results || []);

    // Pass data to client component
    return <BlogClient blogPosts={blogPosts} />;
}
