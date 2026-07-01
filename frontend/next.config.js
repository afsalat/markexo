const appConfig = require('./src/config/appConfig.json');

const normalizeUrl = (value) => value.replace(/\/+$/, '');
const siteOrigin = normalizeUrl(`${appConfig.protocol}://${appConfig.host}`);
const appUrl = siteOrigin;
const apiUrl = `${siteOrigin}/api`;
const mediaUrl = `${siteOrigin}/media`;

function getHostname(value) {
    try {
        return new URL(value).hostname;
    } catch {
        return null;
    }
}

const imageHosts = [...new Set([
    appUrl, 
    apiUrl, 
    mediaUrl,
    'https://vorionmart.com',
    'https://www.vorionmart.com',
    'http://localhost',
    'http://127.0.0.1'
].map(getHostname).filter(Boolean))];

// Internal Docker service URL for server-side proxying.
// In production (Docker Compose) the backend is reachable via its service name.
// Falls back to the public API origin for local development outside Docker.
const BACKEND_INTERNAL_URL =
    process.env.BACKEND_INTERNAL_URL || `http://backend:8000`;

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    output: 'standalone',
    poweredByHeader: false,
    async rewrites() {
        return [
            // Proxy all /api/* requests to the Django backend
            {
                source: '/api/:path*',
                destination: `${BACKEND_INTERNAL_URL}/api/:path*`,
            },
            // Proxy /media/* so images load from the same origin
            {
                source: '/media/:path*',
                destination: `${BACKEND_INTERNAL_URL}/media/:path*`,
            },
            // Proxy /static/* (Django static files served by WhiteNoise)
            {
                source: '/static/:path*',
                destination: `${BACKEND_INTERNAL_URL}/static/:path*`,
            },
        ];
    },
    async redirects() {
        return [
            {
                source: '/product/:slug*',
                destination: '/products/:slug*',
                permanent: true,
            },
            {
                source: '/privacy',
                destination: '/privacy-policy',
                permanent: true,
            },
            {
                source: '/terms',
                destination: '/terms-and-conditions',
                permanent: true,
            },
            {
                source: '/returns',
                destination: '/return-refund-policy',
                permanent: true,
            },
            {
                source: '/shipping',
                destination: '/shipping-policy',
                permanent: true,
            },
        ];
    },
    async headers() {
        return [
            {
                // Apply X-Robots-Tag to all public pages
                source: '/((?!admin|partner|checkout|cart|login|signup|profile|track-order|seo-dashboard).*)',
                headers: [
                    {
                        key: 'X-Robots-Tag',
                        value: 'index, follow',
                    },
                ],
            },
        ];
    },
    compiler: {
        removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error'] } : false,
    },
    images: {
        formats: ['image/avif', 'image/webp'],
        deviceSizes: [640, 750, 828, 1080, 1200, 1920],
        imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
        minimumCacheTTL: 2592000, // 30 days
        remotePatterns: imageHosts.flatMap((hostname) => ([
            {
                protocol: 'https',
                hostname,
                pathname: '/media/**',
            },
            {
                protocol: 'http',
                hostname,
                pathname: '/media/**',
            },
        ])),
    },
};

module.exports = nextConfig;
