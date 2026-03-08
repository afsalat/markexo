import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://vorionmart.com';

    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/admin/', '/partner/', '/shops/', '/shops'], // Keep admin, partner and shops interfaces out of search results
        },
        sitemap: `${baseUrl}/sitemap.xml`,
    };
}
