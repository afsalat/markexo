import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { fetchBlogPost, fetchProduct, fetchProducts, BlogPost, Product } from '@/lib/api';
import BlogPostClient from '../BlogPostClient';

type Props = {
    params: { slug: string };
};

function normalizeProducts(payload: unknown): Product[] {
    if (Array.isArray(payload)) {
        return payload as Product[];
    }

    if (payload && typeof payload === 'object' && Array.isArray((payload as { results?: Product[] }).results)) {
        return (payload as { results: Product[] }).results;
    }

    return [];
}

function getSuggestionTerms(blogPost: BlogPost) {
    const stopWords = new Set([
        'best', 'guide', 'review', 'reviews', 'buy', 'buying', 'online', 'india', 'for', 'and', 'with',
        'your', 'the', 'this', 'that', 'from', 'into', 'how', 'why', 'what', 'when', 'where', 'tips',
        'top', 'complete', 'ultimate', 'vorionmart', 'organize', 'style',
    ]);
    const sourceText = [
        blogPost.title,
        blogPost.category,
        ...(blogPost.tags || []),
        ...(blogPost.keywords || []),
        blogPost.excerpt,
    ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

    const words = sourceText
        .replace(/<[^>]+>/g, ' ')
        .replace(/[^a-z0-9]+/g, ' ')
        .split(/\s+/)
        .map((word) => word.trim())
        .filter((word) => word.length > 2 && !stopWords.has(word));

    const terms = new Set<string>();
    for (let index = 0; index < words.length - 1; index += 1) {
        terms.add(`${words[index]} ${words[index + 1]}`);
        if (terms.size >= 4) break;
    }

    words.forEach((word) => {
        if (terms.size < 8) {
            terms.add(word);
        }
    });

    return Array.from(terms);
}

async function fetchSuggestedProducts(blogPost: BlogPost) {
    const suggestions = new Map<number, Product>();

    const addProducts = (products: Product[]) => {
        products.forEach((product) => {
            if (!suggestions.has(product.id)) {
                suggestions.set(product.id, product);
            }
        });
    };

    const productSlugs = blogPost.products || blogPost.related_products || [];
    if (productSlugs.length > 0) {
        const products = await Promise.all(productSlugs.map(async (productSlug: string) => {
            try {
                return await fetchProduct(productSlug);
            } catch {
                return null;
            }
        }));
        addProducts(products.filter(Boolean) as Product[]);
    }

    for (const term of getSuggestionTerms(blogPost)) {
        if (suggestions.size >= 6) break;

        try {
            addProducts(normalizeProducts(await fetchProducts({ search: term })));
        } catch {
            // Keep trying other terms; one empty or failed search should not remove suggestions.
        }
    }

    if (suggestions.size < 3) {
        try {
            addProducts(normalizeProducts(await fetchProducts({ featured: 'true' })));
        } catch {
            // Final fallback is optional.
        }
    }

    return Array.from(suggestions.values()).slice(0, 6);
}

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
                images: blogPost.featured_image ? [blogPost.featured_image] : [],
            },
            alternates: {
                canonical: `/blog/${params.slug}`,
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
    } catch {
        return {
            title: 'Blog Post Not Found | VorionMart',
            description: 'The blog post you are looking for is not available.',
        };
    }
}

export default async function BlogPostPage({ params }: Props) {
    let blogPost: BlogPost;
    let suggestedProducts: Product[] = [];

    try {
        blogPost = await fetchBlogPost(params.slug);
        suggestedProducts = await fetchSuggestedProducts(blogPost);
    } catch {
        notFound();
    }

    return <BlogPostClient blogPost={blogPost} linkedProducts={suggestedProducts} />;
}
