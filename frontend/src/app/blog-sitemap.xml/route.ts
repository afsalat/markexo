import { NextResponse } from 'next/server';
import { fetchBlogPosts } from '@/lib/api';
import { APP_URL } from '@/config/siteConfig';

/**
 * Dedicated blog sitemap for search engines.
 * Includes featured images for Google Image and News indexing.
 */
export async function GET() {
    try {
        const blogRes = await fetchBlogPosts({ is_published: 'true' });
        const blogPosts = Array.isArray(blogRes) ? blogRes : (blogRes.results || []);

        const urls = blogPosts
            .filter((post: any) => post.slug && post.is_published)
            .map((post: any) => {
                const imageXml = post.featured_image
                    ? `
      <image:image>
        <image:loc>${escapeXml(post.featured_image)}</image:loc>
        <image:title>${escapeXml(post.title)}</image:title>
      </image:image>`
                    : '';

                return `
  <url>
    <loc>${APP_URL}/blog/${post.slug}</loc>
    <lastmod>${post.updated_at || post.published_at || new Date().toISOString()}</lastmod>
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
        console.error('Error generating blog sitemap:', error);
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
