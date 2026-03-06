/**
 * Central API configuration for VorionMart
 * Dynamically determines the backend URL based on the current host.
 */

const getBaseUrl = () => {
    // Check if we are in a browser environment
    if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        // If we're on localhost or an IP, assume backend is on port 8000 of the same host
        return `http://${hostname}:8000`;
    }
    // Fallback for SSR or if window is not available
    return process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
};

export const BASE_URL = getBaseUrl();
export const API_BASE_URL = `${BASE_URL}/api`;
export const AUTH_URL = `${BASE_URL}/api/token/`;
export const ADMIN_API_URL = `${API_BASE_URL}/admin`;
