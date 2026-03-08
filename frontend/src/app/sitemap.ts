import { MetadataRoute } from 'next';
import { fetchProducts, fetchCategories } from '@/lib/api';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://vorionmart.com';

    try {
        // Fetch dynamic data
        const [productsRes, categoriesRes] = await Promise.all([
            fetchProducts(),
            fetchCategories()
        ]);

        const products = Array.isArray(productsRes) ? productsRes : (productsRes.results || []);
        const categories = Array.isArray(categoriesRes) ? categoriesRes : (categoriesRes.results || []);

        // Base static routes
        const routes: MetadataRoute.Sitemap = [
            {
                url: baseUrl,
                lastModified: new Date(),
                changeFrequency: 'daily',
                priority: 1,
            },
            {
                url: `${baseUrl}/products`,
                lastModified: new Date(),
                changeFrequency: 'daily',
                priority: 0.8,
            },
            {
                url: `${baseUrl}/categories`,
                changeFrequency: 'weekly',
                priority: 0.8,
            },
        ];

        // Dynamic Product Routes
        products.forEach((product: any) => {
            if (product.is_active) {
                routes.push({
                    url: `${baseUrl}/products/${product.slug}`,
                    lastModified: new Date(),
                    changeFrequency: 'weekly',
                    priority: 0.9,
                });
            }
        });

        // Category parameterized routes (we use query params for categories normally, but if we had unique pages)
        // Adding them here helps crawlers find parameterized URLs
        categories.forEach((category: any) => {
            routes.push({
                url: `${baseUrl}/products?category=${category.slug}`,
                changeFrequency: 'weekly',
                priority: 0.6,
            });
        });

        return routes;
    } catch (error) {
        console.error("Error generating sitemap:", error);
        // Fallback to basic routes if API fails
        return [
            {
                url: baseUrl,
                lastModified: new Date(),
            }
        ];
    }
}
