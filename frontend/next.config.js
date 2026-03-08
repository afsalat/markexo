/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        domains: ['vorionmart.com'],
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'vorionmart.com',
                pathname: '/media/**',
            },
            {
                protocol: 'http',
                hostname: 'vorionmart.com',
                pathname: '/media/**',
            }
        ],
    },
    env: {
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://vorionmart.com/api',
    },
}

module.exports = nextConfig
