const normalizeUrl = (value: string) => value.replace(/\/+$/, '');

export const APP_URL = normalizeUrl(
    process.env.NEXT_PUBLIC_APP_URL || 'https://vorionmart.com'
);

export const API_BASE_URL = normalizeUrl(
    process.env.NEXT_PUBLIC_API_BASE_URL || `${APP_URL}/api`
);

export const BASE_URL = APP_URL;
