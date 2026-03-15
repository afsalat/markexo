const normalizeUrl = (value) => value.replace(/\/+$/, '');

const appUrl = normalizeUrl(process.env.NEXT_PUBLIC_APP_URL || 'https://vorionmart.com');
const apiUrl = normalizeUrl(process.env.NEXT_PUBLIC_API_BASE_URL || `${appUrl}/api`);
const mediaUrl = normalizeUrl(process.env.NEXT_PUBLIC_MEDIA_URL || `${appUrl}/media`);

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
