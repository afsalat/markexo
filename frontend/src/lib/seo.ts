import type { Metadata } from 'next';
import { APP_URL } from '@/config/siteConfig';

type CanonicalMetadataInput = {
    title: string;
    description: string;
    path: string;
    keywords?: string[];
    openGraphType?: 'website' | 'article';
    image?: string;
    robots?: Metadata['robots'];
};

type NoIndexMetadataInput = {
    title: string;
    description: string;
    path?: string;
};

export function absoluteUrl(path: string = '/') {
    return new URL(path, APP_URL).toString();
}

export function buildCanonicalMetadata({
    title,
    description,
    path,
    keywords,
    openGraphType = 'website',
    image,
    robots,
}: CanonicalMetadataInput): Metadata {
    const images = image ? [image] : undefined;

    return {
        title,
        description,
        ...(keywords ? { keywords } : {}),
        alternates: {
            canonical: path,
        },
        ...(robots ? { robots } : {}),
        openGraph: {
            title,
            description,
            url: absoluteUrl(path),
            siteName: 'VorionMart',
            locale: 'en_IN',
            type: openGraphType,
            ...(images ? { images } : {}),
        },
        twitter: {
            card: images ? 'summary_large_image' : 'summary',
            title,
            description,
            ...(images ? { images } : {}),
        },
    };
}

export function buildNoIndexMetadata({
    title,
    description,
    path,
}: NoIndexMetadataInput): Metadata {
    return {
        title,
        description,
        ...(path
            ? {
                alternates: {
                    canonical: path,
                },
            }
            : {}),
        robots: {
            index: false,
            follow: false,
            googleBot: {
                index: false,
                follow: false,
                noimageindex: true,
            },
        },
    };
}
