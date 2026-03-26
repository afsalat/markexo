const appConfig = require('./src/config/appConfig.json');

const normalizeUrl = (value) => value.replace(/\/+$/, '');

const buildOrigin = (port) =>
    normalizeUrl(`${appConfig.protocol}://${appConfig.host}:${port}`);

const appUrl = buildOrigin(appConfig.frontendPort);
const apiUrl = `${buildOrigin(appConfig.backendPort)}/api`;
const mediaUrl = `${buildOrigin(appConfig.backendPort)}/media`;

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
