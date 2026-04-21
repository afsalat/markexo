import { MetadataRoute } from 'next';
import { fetchProducts, fetchBlogPosts } from '@/lib/api';
import { APP_URL } from '@/config/siteConfig';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const now = new Date();
    const staticRoutes = [
        { path: '', changeFrequency: 'daily' as const, priority: 1 },
        { path: '/products', changeFrequency: 'daily' as const, priority: 0.9 },
        { path: '/categories', changeFrequency: 'weekly' as const, priority: 0.8 },
        { path: '/blog', changeFrequency: 'daily' as const, priority: 0.8 },
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
        const [productsRes, blogRes] = await Promise.all([
            fetchProducts(),
            fetchBlogPosts({ is_published: 'true' })
        ]);
        
        const products = Array.isArray(productsRes) ? productsRes : (productsRes.results || []);
        const blogPosts = Array.isArray(blogRes) ? blogRes : (blogRes.results || []);
        const routes: MetadataRoute.Sitemap = [...baseRoutes];

        // Add product routes
        products.forEach((product: any) => {
            const isIndexable =
                typeof product.is_active === 'boolean'
                    ? product.is_active
                    : product.approval_status === 'approved';

            if (product.slug && isIndexable) {
                routes.push({
                    url: `${APP_URL}/products/${product.slug}`,
                    lastModified: product.created_at ? new Date(product.created_at) : now,
                    changeFrequency: 'weekly',
                    priority: 0.9,
                });
            }
        });

        // Add blog post routes
        blogPosts.forEach((blogPost: any) => {
            if (blogPost.slug && blogPost.is_published) {
                routes.push({
                    url: `${APP_URL}/blog/${blogPost.slug}`,
                    lastModified: blogPost.published_at ? new Date(blogPost.published_at) : now,
                    changeFrequency: 'weekly',
                    priority: 0.8,
                });
            }
        });

        return routes.filter(
            (route, index, array) => array.findIndex((item) => item.url === route.url) === index
        );
    } catch {
        return baseRoutes;
    }
}
