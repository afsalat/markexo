/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        domains: ['localhost', '127.0.0.1', 'vorionmart.com'],
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'vorionmart.com',
                pathname: '/media/**',
            },
            {
                protocol: 'http',
                hostname: 'localhost',
                port: '8000',
                pathname: '/media/**',
            },
        ],
    },
    env: {
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://vorionmart.com/api',
    },
}

module.exports = nextConfig
