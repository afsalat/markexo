import { NextResponse } from 'next/server';
import { fetchProducts } from '@/lib/api';
import { APP_URL } from '@/config/siteConfig';

/**
 * Dedicated product sitemap for search engines.
 * Includes product images for Google Image indexing.
 */
export async function GET() {
    try {
        const productsRes = await fetchProducts();
        const products = Array.isArray(productsRes) ? productsRes : (productsRes.results || []);

        const urls = products
            .filter((p: any) => p.slug && (p.is_active || p.approval_status === 'approved'))
            .map((product: any) => {
                const images = [
                    product.image,
                    ...(product.images || []).map((img: any) => img.image),
                ].filter(Boolean);

                const imageXml = images.map((img: string) => `
      <image:image>
        <image:loc>${escapeXml(img)}</image:loc>
        <image:title>${escapeXml(product.name)}</image:title>
        <image:caption>${escapeXml(product.name)} - Buy online at VorionMart</image:caption>
      </image:image>`).join('');

                return `
  <url>
    <loc>${APP_URL}/products/${product.slug}</loc>
    <lastmod>${product.updated_at || product.created_at || new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${product.is_featured ? '0.95' : '0.90'}</priority>${imageXml}
  </url>`;
            })
            .join('');

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls}
</urlset>`;

        return new NextResponse(xml, {
            headers: {
                'Content-Type': 'application/xml',
                'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
            },
        });
    } catch (error) {
        console.error('Error generating product sitemap:', error);
        return new NextResponse(
            `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`,
            { headers: { 'Content-Type': 'application/xml' } }
        );
    }
}

function escapeXml(str: string): string {
    return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}
