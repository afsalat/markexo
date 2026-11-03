import { NextResponse } from 'next/server';
import { API_BASE_URL } from '@/config/siteConfig';

export async function GET() {
    try {
        // Fetch from the backend API which is already proxied correctly
        // We use the internal /api/ endpoint that we know works
        const feedUrl = `${API_BASE_URL}/google-merchant-feed/`;
        let res = await fetch(feedUrl, {
            next: { revalidate: 300 }, // Cache for 5 minutes
            headers: { 'Accept': 'application/xml, text/xml' }
        });
        
        if (!res.ok) {
            // Fallback to backend root google-feed.xml if api endpoint fails
            const fallbackUrl = API_BASE_URL.replace(/\/api\/?$/, '') + '/google-feed.xml';
            res = await fetch(fallbackUrl, {
                next: { revalidate: 300 },
                headers: { 'Accept': 'application/xml, text/xml' }
            });
        }

        if (!res.ok) {
            return new NextResponse(`Feed not found (Backend returned ${res.status})`, { status: 404 });
        }
        
        const xml = await res.text();
        
        return new NextResponse(xml, {
            headers: {
                'Content-Type': 'application/xml; charset=utf-8',
                'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=86400',
            },
        });
    } catch (error) {
        console.error('Error proxying Google Merchant feed:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
