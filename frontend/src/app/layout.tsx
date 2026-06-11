import type { Metadata } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { CartProvider } from '@/lib/cart';
import { AuthProvider } from '@/context/AuthContext';
import { CustomerAuthProvider } from '@/context/CustomerAuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import LayoutWrapper from '@/components/LayoutWrapper';
import { APP_URL } from '@/config/siteConfig';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space-grotesk' });

export const metadata: Metadata = {
    metadataBase: new URL(APP_URL),
    title: {
        template: '%s | VorionMart',
        default: 'VorionMart - Premium D2C Store | Pay on Delivery',
    },
    description: 'Shop premium products with Cash on Delivery. Trusted, secure, and delivered to your doorstep. Pay when you receive. No hassle, pure convenience.',
    keywords: ['VorionMart', 'Vorion Mart', 'ecommerce', 'cash on delivery', 'COD shopping', 'online store', 'premium products', 'pay on delivery', 'trusted shopping', 'India delivery'],
    openGraph: {
        title: 'VorionMart - Premium D2C Store',
        description: 'Shop premium products with Cash on Delivery. Trusted, secure, and delivered to your doorstep.',
        url: '/',
        siteName: 'VorionMart',
        locale: 'en_IN',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'VorionMart - Premium D2C Store',
        description: 'Shop premium products with Cash on Delivery.',
    },
    robots: {
        index: true,
        follow: true,
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Generate Google Search Result Structured Data (JSON-LD)
    const websiteJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        'name': 'VorionMart',
        'alternateName': ['Vorion Mart', 'VorionMart D2C'],
        'url': APP_URL || 'https://vorionmart.com',
        'potentialAction': {
            '@type': 'SearchAction',
            'target': {
                '@type': 'EntryPoint',
                'urlTemplate': `${APP_URL || 'https://vorionmart.com'}/products?search={search_term_string}`
            },
            'query-input': 'required name=search_term_string'
        }
    };

    const organizationJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        'name': 'VorionMart',
        'url': APP_URL || 'https://vorionmart.com',
        'logo': `${APP_URL || 'https://vorionmart.com'}/logo-black-text.webp`,
        'sameAs': [
            'https://www.instagram.com/vorionmart',
            'https://www.facebook.com/vorionmart',
            'https://twitter.com/vorionmart'
        ],
        'contactPoint': {
            '@type': 'ContactPoint',
            'telephone': '+91-7356216468',
            'contactType': 'customer support',
            'email': 'vorionmart@gmail.com',
            'areaServed': 'IN',
            'availableLanguage': 'en'
        }
    };

    const siteNavigationJsonLd = {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@context': 'https://schema.org',
                '@type': 'SiteNavigationElement',
                '@id': '#primary-navigation-home',
                'name': 'Home',
                'url': `${APP_URL || 'https://vorionmart.com'}/`
            },
            {
                '@context': 'https://schema.org',
                '@type': 'SiteNavigationElement',
                '@id': '#primary-navigation-collection',
                'name': 'Shop Collection',
                'url': `${APP_URL || 'https://vorionmart.com'}/products`
            },
            {
                '@context': 'https://schema.org',
                '@type': 'SiteNavigationElement',
                '@id': '#primary-navigation-categories',
                'name': 'Product Categories',
                'url': `${APP_URL || 'https://vorionmart.com'}/categories`
            },
            {
                '@context': 'https://schema.org',
                '@type': 'SiteNavigationElement',
                '@id': '#primary-navigation-trending',
                'name': 'Trending Products',
                'url': `${APP_URL || 'https://vorionmart.com'}/trending`
            },
            {
                '@context': 'https://schema.org',
                '@type': 'SiteNavigationElement',
                '@id': '#primary-navigation-new-arrivals',
                'name': 'New Arrivals',
                'url': `${APP_URL || 'https://vorionmart.com'}/new-arrivals`
            },
            {
                '@context': 'https://schema.org',
                '@type': 'SiteNavigationElement',
                '@id': '#primary-navigation-track',
                'name': 'Track Your Order',
                'url': `${APP_URL || 'https://vorionmart.com'}/track-order`
            },
            {
                '@context': 'https://schema.org',
                '@type': 'SiteNavigationElement',
                '@id': '#primary-navigation-about',
                'name': 'About Us',
                'url': `${APP_URL || 'https://vorionmart.com'}/about`
            },
            {
                '@context': 'https://schema.org',
                '@type': 'SiteNavigationElement',
                '@id': '#primary-navigation-contact',
                'name': 'Contact Us',
                'url': `${APP_URL || 'https://vorionmart.com'}/contact`
            }
        ]
    };

    return (
        <html lang="en" className="light">
            <head>
                {/* Global Structured Data for Google Search Sitelinks & Sitelinks Searchbox */}
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
                />
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
                />
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(siteNavigationJsonLd) }}
                />
            </head>
            <body className={`${inter.variable} ${spaceGrotesk.variable} font-sans bg-[#f8f9fb] text-gray-900`}>
                <ThemeProvider>
                    <CustomerAuthProvider>
                        <CartProvider>
                            <LayoutWrapper>{children}</LayoutWrapper>
                        </CartProvider>
                    </CustomerAuthProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
