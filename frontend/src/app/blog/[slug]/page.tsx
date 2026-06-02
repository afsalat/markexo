import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getStaticBlogPosts, getStaticBlogPostBySlug } from '@/lib/staticBlog';
import BlogPostClient from '../BlogPostClient';

type Props = {
    params: { slug: string };
};

// Generates static paths at build time (SSG) for perfect performance and PageSpeed
export async function generateStaticParams() {
    const posts = getStaticBlogPosts();
    return posts.map((post) => ({
        slug: post.slug,
    }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const blogPost = getStaticBlogPostBySlug(params.slug);
    
    if (!blogPost) {
        return {
            title: 'Article Not Found | VorionMart',
            description: 'The requested guide or article is currently unavailable.',
        };
    }
    
    return {
        title: `${blogPost.title} | VorionMart Blog`,
        description: blogPost.excerpt || `${blogPost.title} - Read expert shopping advice, reviews, and specs at VorionMart.`,
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
            title: `${blogPost.title} | VorionMart Blog`,
            description: blogPost.excerpt || `${blogPost.title} - Read expert shopping advice, reviews, and specs at VorionMart.`,
            images: blogPost.featured_image ? [blogPost.featured_image] : [],
            type: 'article',
            url: `https://vorionmart.com/blog/${blogPost.slug}`,
            publishedTime: blogPost.publish_date,
            authors: [blogPost.author],
            tags: blogPost.tags,
        },
        twitter: {
            card: 'summary_large_image',
            title: `${blogPost.title} | VorionMart Blog`,
            description: blogPost.excerpt || `${blogPost.title} - Read expert shopping advice, reviews, and specs at VorionMart.`,
            images: blogPost.featured_image ? [blogPost.featured_image] : [],
        },
        alternates: {
            canonical: `/blog/${blogPost.slug}`,
        },
        robots: {
            index: true,
            follow: true,
            googleBot: {
                index: true,
                follow: true,
            }
        }
    };
}

export default function BlogPostPage({ params }: Props) {
    const blogPost = getStaticBlogPostBySlug(params.slug);
    
    if (!blogPost) {
        notFound();
    }

    return <BlogPostClient blogPost={blogPost} />;
}
