import appConfig from './appConfig.json';

const normalizeUrl = (value: string) => value.replace(/\/+$/, '');
const SITE_ORIGIN = normalizeUrl(`${appConfig.protocol}://${appConfig.host}`);

// In production the API lives on a separate subdomain (api.vorionmart.com).
// Set NEXT_PUBLIC_API_HOST env var to override (e.g. "api.vorionmart.com").
// Falls back to same origin as the frontend for local development.
const API_ORIGIN_BASE = process.env.NEXT_PUBLIC_API_HOST
    ? normalizeUrl(`https://${process.env.NEXT_PUBLIC_API_HOST}`)
    : SITE_ORIGIN;

export const APP_URL = SITE_ORIGIN;
export const API_ORIGIN = API_ORIGIN_BASE;
export const API_BASE_URL = `${API_ORIGIN_BASE}/api`;
export const MEDIA_URL = `${API_ORIGIN_BASE}/media`;

export const BASE_URL = APP_URL;
