/**
 * Image URL normalization utility for VorionMart.
 * Ensures image URLs point to the public API/media host and resolves relative media paths.
 */
export function formatImageUrl(url: string | null | undefined): string {
    if (!url) return '';
    const trimmed = String(url).trim();
    if (!trimmed || trimmed === 'null' || trimmed === 'undefined') return '';

    // If already absolute with public domain or other external CDN
    if (trimmed.startsWith('https://') || trimmed.startsWith('http://')) {
        // Rewrite internal Docker hostname or localhost to public api domain
        if (
            trimmed.includes('://backend:8000') ||
            trimmed.includes('://backend/') ||
            trimmed.includes('://localhost:8000') ||
            trimmed.includes('://127.0.0.1:8000')
        ) {
            return trimmed.replace(
                /^https?:\/\/(backend(:8000)?|localhost:8000|127\.0\.0\.1:8000)/,
                'https://api.vorionmart.com'
            );
        }
        return trimmed;
    }

    // Data URLs
    if (trimmed.startsWith('data:')) {
        return trimmed;
    }

    // Relative media path (e.g. /media/products/... or media/products/...)
    if (trimmed.startsWith('/media/') || trimmed.startsWith('media/')) {
        const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
        return `https://api.vorionmart.com${cleanPath}`;
    }

    // Any other relative path
    return `https://api.vorionmart.com/${trimmed.replace(/^\/+/, '')}`;
}
