import { NextResponse } from 'next/server';
import { getStaticBlogPosts } from '@/lib/staticBlog';
import { APP_URL } from '@/config/siteConfig';

export async function GET() {
    try {
        const blogPosts = getStaticBlogPosts();

        const items = blogPosts
            .map((post) => {
                return `
        <item>
            <title>${escapeXml(post.title)}</title>
            <link>${APP_URL}/blog/${post.slug}</link>
            <guid isPermaLink="true">${APP_URL}/blog/${post.slug}</guid>
            <pubDate>${new Date(post.publish_date).toUTCString()}</pubDate>
            <author>${escapeXml(post.author)}</author>
            <description>${escapeXml(post.excerpt)}</description>
            <category>${escapeXml(post.category)}</category>
        </item>`;
            })
            .join('');

        const xml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
    <title>VorionMart Blog Feed</title>
    <link>${APP_URL}/blog</link>
    <description>Expert shopping guides, deep reviews, and specifications for premium items on VorionMart.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${APP_URL}/rss.xml" rel="self" type="application/rss+xml" />
    ${items}
</channel>
</rss>`;

        return new NextResponse(xml, {
            headers: {
                'Content-Type': 'application/xml',
                'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
            },
        });
    } catch (error) {
        console.error('Error generating RSS feed:', error);
        return new NextResponse(
            `<?xml version="1.5" encoding="UTF-8"?><rss version="2.0"><channel><title>VorionMart</title></channel></rss>`,
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
