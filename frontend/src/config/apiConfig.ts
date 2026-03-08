const isLocal = process.env.NODE_ENV === 'development';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://vorionmart.com/api';
export const BASE_URL = API_BASE_URL.replace(/\/api$/, '');
export const AUTH_URL = `${API_BASE_URL}/auth/login/`;
export const ADMIN_API_URL = `${API_BASE_URL}/admin`;
