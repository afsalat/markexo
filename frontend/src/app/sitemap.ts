import { MetadataRoute } from 'next';
import { fetchProducts } from '@/lib/api';
import { APP_URL } from '@/config/siteConfig';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const now = new Date();
    const staticRoutes = [
        { path: '', changeFrequency: 'daily' as const, priority: 1 },
        { path: '/products', changeFrequency: 'daily' as const, priority: 0.9 },
        { path: '/categories', changeFrequency: 'weekly' as const, priority: 0.8 },
        { path: '/contact', changeFrequency: 'monthly' as const, priority: 0.7 },
        { path: '/track-order', changeFrequency: 'weekly' as const, priority: 0.7 },
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
        const productsRes = await fetchProducts();
        const products = Array.isArray(productsRes) ? productsRes : (productsRes.results || []);
        const routes: MetadataRoute.Sitemap = [...baseRoutes];

        products.forEach((product: any) => {
            if (product.is_active) {
                routes.push({
                    url: `${APP_URL}/products/${product.slug}`,
                    lastModified: product.created_at ? new Date(product.created_at) : now,
                    changeFrequency: 'weekly',
                    priority: 0.9,
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
