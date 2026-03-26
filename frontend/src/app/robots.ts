import { MetadataRoute } from 'next';
import { APP_URL } from '@/config/siteConfig';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/admin/', '/partner/'], // Keep admin and partner interfaces out of search results
        },
        sitemap: `${APP_URL}/sitemap.xml`,
    };
}
