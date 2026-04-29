import { NextResponse } from 'next/server';
import { API_BASE_URL } from '@/config/siteConfig';

export async function GET() {
    try {
        // Fetch from the backend API which is already proxied correctly
        // We use the internal /api/ endpoint that we know works
        const res = await fetch(`${API_BASE_URL}/google-merchant-feed/`, {
            next: { revalidate: 3600 } // Cache for 1 hour
        });
        
        if (!res.ok) {
            return new NextResponse(`Feed not found (Backend returned ${res.status})`, { status: 404 });
        }
        
        const xml = await res.text();
        
        return new NextResponse(xml, {
            headers: {
                'Content-Type': 'application/xml',
                'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
            },
        });
    } catch (error) {
        console.error('Error proxying Google Merchant feed:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
