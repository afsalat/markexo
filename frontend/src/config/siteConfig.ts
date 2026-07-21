import appConfig from './appConfig.json';

const normalizeUrl = (value: string) => value.replace(/\/+$/, '');
const SITE_ORIGIN = normalizeUrl(`${appConfig.protocol}://${appConfig.host}`);

const isServer = typeof window === 'undefined';

let resolvedApiOrigin = SITE_ORIGIN;

if (isServer) {
    // During Server-Side Rendering (SSR):
    // - In Docker: DOCKER_ENV=true, so use the internal container hostname.
    // - In local dev: use localhost:8000 so SSR fetches can reach the Django dev server.
    const isDocker = process.env.DOCKER_ENV === 'true';
    resolvedApiOrigin = isDocker ? 'http://backend:8000' : 'http://localhost:8000';
} else {
    // In the browser, resolve the API URL based on the current domain
    const hostname = window.location.hostname;
    if (hostname === 'vorionmart.com' || hostname === 'www.vorionmart.com') {
        resolvedApiOrigin = 'https://api.vorionmart.com';
    } else {
        // Fallback for local development
        resolvedApiOrigin = `${window.location.protocol}//${hostname}:8000`;
    }
}

export const APP_URL = SITE_ORIGIN;
export const API_ORIGIN = resolvedApiOrigin;
export const API_BASE_URL = `${resolvedApiOrigin}/api`;
export const MEDIA_URL = `${resolvedApiOrigin}/media`;

export const BASE_URL = APP_URL;
