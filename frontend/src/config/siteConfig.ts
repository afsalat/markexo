const DEFAULT_APP_URL = 'https://vorionmart.com';

function normalizeUrl(value: string) {
    return value.replace(/\/+$/, '');
}

export const APP_URL = normalizeUrl(
    process.env.NEXT_PUBLIC_APP_URL || DEFAULT_APP_URL
);

export const API_BASE_URL = normalizeUrl(
    process.env.NEXT_PUBLIC_API_URL || `${APP_URL}/api`
);

export const BASE_URL = API_BASE_URL.replace(/\/api$/, '');
