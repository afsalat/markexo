import { NextResponse } from 'next/server';
import { fetchCategories } from '@/lib/api';
import { APP_URL } from '@/config/siteConfig';

/**
 * Dedicated category sitemap for search engines.
 * Helps search engines discover all category pages.
 */
export async function GET() {
    try {
        const categoriesRes = await fetchCategories({ flat: 'true' });
        const categories = Array.isArray(categoriesRes) ? categoriesRes : (categoriesRes.results || []);

        const urls = categories
            .filter((cat: any) => cat.slug && cat.is_active !== false)
            .map((category: any) => {
                const imageXml = category.image
                    ? `
      <image:image>
        <image:loc>${escapeXml(category.image)}</image:loc>
        <image:title>${escapeXml(category.name)} Category</image:title>
      </image:image>`
                    : '';

                return `
  <url>
    <loc>${APP_URL}/category/${category.slug}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.80</priority>${imageXml}
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
        console.error('Error generating category sitemap:', error);
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
