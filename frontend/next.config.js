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

const imageHosts = [...new Set([appUrl, apiUrl, mediaUrl].map(getHostname).filter(Boolean))];

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    output: 'standalone',
    poweredByHeader: false,
    async redirects() {
        return [
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
