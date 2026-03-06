/**
 * Central API configuration for VorionMart
 * Dynamically determines the backend URL based on the current host.
 */

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://vorionmart.com/api';
export const BASE_URL = API_BASE_URL.replace(/\/api$/, '');
export const AUTH_URL = `${API_BASE_URL}/token/`;
export const ADMIN_API_URL = `${API_BASE_URL}/admin`;
