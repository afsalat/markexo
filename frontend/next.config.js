/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        domains: ['vorionmart.com', 'localhost', '127.0.0.1'],
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
