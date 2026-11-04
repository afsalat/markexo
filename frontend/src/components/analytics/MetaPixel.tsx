'use client';

import { Suspense, useEffect, useRef } from 'react';
import Script from 'next/script';
import { usePathname, useSearchParams } from 'next/navigation';
import { META_PIXEL_ID, trackPageView } from '@/lib/metaPixel';

function MetaPixelRouteTracker() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const lastTrackedUrl = useRef<string | null>(null);

    useEffect(() => {
        if (!pathname) return;
        const queryString = searchParams?.toString();
        const currentUrl = queryString ? `${pathname}?${queryString}` : pathname;

        // Prevent firing duplicate PageView for the exact same URL
        if (lastTrackedUrl.current === currentUrl) return;
        lastTrackedUrl.current = currentUrl;

        trackPageView(currentUrl);
    }, [pathname, searchParams]);

    return null;
}

export default function MetaPixel() {
    if (!META_PIXEL_ID) return null;

    return (
        <>
            <Script
                id="meta-pixel-base"
                strategy="afterInteractive"
                dangerouslySetInnerHTML={{
                    __html: `
                        !function(f,b,e,v,n,t,s)
                        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                        n.queue=[];t=b.createElement(e);t.async=!0;
                        t.src=v;s=b.getElementsByTagName(e)[0];
                        s.parentNode.insertBefore(t,s)}(window, document,'script',
                        'https://connect.facebook.net/en_US/fbevents.js');
                        fbq('init', '${META_PIXEL_ID}');
                    `,
                }}
            />
            <noscript>
                <img
                    height="1"
                    width="1"
                    style={{ display: 'none' }}
                    src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
                    alt=""
                />
            </noscript>
            <Suspense fallback={null}>
                <MetaPixelRouteTracker />
            </Suspense>
        </>
    );
}
