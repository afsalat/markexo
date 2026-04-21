import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { fetchBlogPost, fetchProduct, BlogPost } from '@/lib/api';
import BlogPostClient from '../BlogPostClient';

type Props = {
    params: { slug: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    try {
        const blogPost = await fetchBlogPost(params.slug);
        
        return {
            title: blogPost.meta_title || blogPost.title,
            description: blogPost.meta_description || `${blogPost.title} - Expert shopping guide and product review. Discover the best products with cash on delivery.`,
            keywords: [
                blogPost.title.toLowerCase(),
                'shopping guide',
                'product review',
                'expert advice',
                'best products',
                'online shopping',
                'COD delivery',
                ...(blogPost.tags || [])
            ],
            openGraph: {
                title: blogPost.meta_title || blogPost.title,
                description: blogPost.meta_description || `${blogPost.title} - Expert shopping guide and product review.`,
                images: blogPost.featured_image ? [blogPost.featured_image] : [],
                type: 'article',
            },
            twitter: {
                card: 'summary_large_image',
                title: blogPost.meta_title || blogPost.title,
                description: blogPost.meta_description || `${blogPost.title} - Expert shopping guide and product review.`,
                images: blogPost.featured_image ? [blogPost.featured_image] : [],
            },
        };
    } catch {
        return {
            title: 'Blog Post Not Found | VorionMart',
            description: 'The blog post you are looking for is not available.',
        };
    }
}

export default async function BlogPostPage({ params }: Props) {
    let blogPost: BlogPost;
    let linkedProducts: any[] = [];

    try {
        blogPost = await fetchBlogPost(params.slug);
        
        // Fetch linked products if any
        if (blogPost.products && blogPost.products.length > 0) {
            const productPromises = blogPost.products.map(async (productSlug: string) => {
                try {
                    return await fetchProduct(productSlug);
                } catch {
                    return null;
                }
            });
            
            const products = await Promise.all(productPromises);
            linkedProducts = products.filter(product => product !== null);
        }
    } catch {
        notFound();
    }

    return <BlogPostClient blogPost={blogPost} linkedProducts={linkedProducts} />;
}
