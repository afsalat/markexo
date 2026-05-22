import { MetadataRoute } from 'next';
import { fetchProducts, fetchCategories, fetchBlogPosts } from '@/lib/api';
import { APP_URL } from '@/config/siteConfig';

/**
 * Master sitemap combining all routes for maximum search engine coverage.
 * Includes static pages, products, categories, and blog posts.
 * Auto-updates when new content is added.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const now = new Date();

    // === Static Routes ===
    const staticRoutes = [
        { path: '', changeFrequency: 'daily' as const, priority: 1.0 },
        { path: '/products', changeFrequency: 'daily' as const, priority: 0.9 },
        { path: '/categories', changeFrequency: 'weekly' as const, priority: 0.9 },
        { path: '/blog', changeFrequency: 'daily' as const, priority: 0.8 },
        { path: '/new-arrivals', changeFrequency: 'daily' as const, priority: 0.8 },
        { path: '/trending', changeFrequency: 'daily' as const, priority: 0.8 },
        { path: '/about', changeFrequency: 'monthly' as const, priority: 0.7 },
        { path: '/contact', changeFrequency: 'monthly' as const, priority: 0.7 },
        { path: '/shipping-policy', changeFrequency: 'monthly' as const, priority: 0.5 },
        { path: '/return-refund-policy', changeFrequency: 'monthly' as const, priority: 0.5 },
        { path: '/privacy-policy', changeFrequency: 'monthly' as const, priority: 0.4 },
        { path: '/terms-and-conditions', changeFrequency: 'monthly' as const, priority: 0.4 },
        { path: '/cod-disclaimer', changeFrequency: 'monthly' as const, priority: 0.4 },
    ];

    const baseRoutes: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
        url: `${APP_URL}${route.path}`,
        lastModified: now,
        changeFrequency: route.changeFrequency,
        priority: route.priority,
    }));

    try {
        const [productsRes, categoriesRes, blogRes] = await Promise.all([
            fetchProducts().catch(() => []),
            fetchCategories({ flat: 'true' }).catch(() => []),
            fetchBlogPosts({ is_published: 'true' }).catch(() => []),
        ]);

        const products = Array.isArray(productsRes) ? productsRes : (productsRes.results || []);
        const categories = Array.isArray(categoriesRes) ? categoriesRes : (categoriesRes.results || []);
        const blogPosts = Array.isArray(blogRes) ? blogRes : (blogRes.results || []);

        const routes: MetadataRoute.Sitemap = [...baseRoutes];

        // === Product Routes ===
        products.forEach((product: any) => {
            const isIndexable =
                typeof product.is_active === 'boolean'
                    ? product.is_active
                    : product.approval_status === 'approved';

            if (product.slug && isIndexable) {
                routes.push({
                    url: `${APP_URL}/products/${product.slug}`,
                    lastModified: product.updated_at ? new Date(product.updated_at) : (product.created_at ? new Date(product.created_at) : now),
                    changeFrequency: 'weekly',
                    priority: product.is_featured ? 0.95 : 0.9,
                });
            }
        });

        // === Category Routes ===
        categories.forEach((category: any) => {
            if (category.slug && category.is_active !== false) {
                routes.push({
                    url: `${APP_URL}/products?category=${category.slug}`,
                    lastModified: now,
                    changeFrequency: 'weekly',
                    priority: 0.8,
                });
            }
        });

        // === Blog Routes ===
        blogPosts.forEach((blogPost: any) => {
            if (blogPost.slug && blogPost.is_published) {
                routes.push({
                    url: `${APP_URL}/blog/${blogPost.slug}`,
                    lastModified: blogPost.updated_at ? new Date(blogPost.updated_at) : (blogPost.published_at ? new Date(blogPost.published_at) : now),
                    changeFrequency: 'weekly',
                    priority: 0.8,
                });
            }
        });

        // === Feed Routes (for AI discovery) ===
        routes.push(
            { url: `${APP_URL}/google-feed.xml`, lastModified: now, changeFrequency: 'daily', priority: 0.6 },
            { url: `${APP_URL}/rss.xml`, lastModified: now, changeFrequency: 'daily', priority: 0.6 },
            { url: `${APP_URL}/llms.txt`, lastModified: now, changeFrequency: 'weekly', priority: 0.5 },
        );

        // Deduplicate by URL
        return routes.filter(
            (route, index, array) => array.findIndex((item) => item.url === route.url) === index
        );
    } catch {
        return baseRoutes;
    }
}
