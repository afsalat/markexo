import { MetadataRoute } from 'next';
import { APP_URL } from '@/config/siteConfig';

/**
 * Enhanced robots.txt configuration for AI search engine optimization.
 * Explicitly allows all major AI crawlers for maximum discoverability.
 */
export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            // Default rule: allow everything except admin/partner
            {
                userAgent: '*',
                allow: '/',
                disallow: ['/admin', '/partner', '/checkout', '/cart', '/login', '/signup', '/profile', '/track-order', '/seo-dashboard'],
            },
            // Google Search Bot - full access
            {
                userAgent: 'Googlebot',
                allow: '/',
                disallow: ['/admin', '/partner'],
            },
            // Google Image Bot
            {
                userAgent: 'Googlebot-Image',
                allow: '/',
            },
            // Bing Bot - full access
            {
                userAgent: 'Bingbot',
                allow: '/',
                disallow: ['/admin', '/partner'],
            },
            // ChatGPT / OpenAI Search Bot
            {
                userAgent: 'GPTBot',
                allow: '/',
                disallow: ['/admin', '/partner', '/checkout', '/cart'],
            },
            // OpenAI Search Bot (shopping results)
            {
                userAgent: 'OAI-SearchBot',
                allow: '/',
                disallow: ['/admin', '/partner'],
            },
            // ChatGPT User agent
            {
                userAgent: 'ChatGPT-User',
                allow: '/',
                disallow: ['/admin', '/partner'],
            },
            // Perplexity AI Bot
            {
                userAgent: 'PerplexityBot',
                allow: '/',
                disallow: ['/admin', '/partner'],
            },
            // Google Gemini (Google-Extended)
            {
                userAgent: 'Google-Extended',
                allow: '/',
                disallow: ['/admin', '/partner'],
            },
            // Anthropic Claude Web Search
            {
                userAgent: 'ClaudeBot',
                allow: '/',
                disallow: ['/admin', '/partner'],
            },
            {
                userAgent: 'anthropic-ai',
                allow: '/',
                disallow: ['/admin', '/partner'],
            },
            // Meta AI
            {
                userAgent: 'FacebookBot',
                allow: '/',
            },
            // Apple Bot (Siri/Spotlight)
            {
                userAgent: 'Applebot',
                allow: '/',
                disallow: ['/admin', '/partner'],
            },
            // Yandex Bot
            {
                userAgent: 'YandexBot',
                allow: '/',
                disallow: ['/admin', '/partner'],
            },
            // DuckDuckBot
            {
                userAgent: 'DuckDuckBot',
                allow: '/',
                disallow: ['/admin', '/partner'],
            },
        ],
        sitemap: [
            `${APP_URL}/sitemap.xml`,
            `${APP_URL}/product-sitemap.xml`,
            `${APP_URL}/category-sitemap.xml`,
            `${APP_URL}/blog-sitemap.xml`,
        ],
    };
}
