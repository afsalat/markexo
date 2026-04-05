import { buildCanonicalMetadata } from '@/lib/seo';

export const metadata = buildCanonicalMetadata({
    title: 'COD Disclaimer',
    description: 'Read the VorionMart Cash on Delivery disclaimer and customer responsibilities for COD orders.',
    path: '/cod-disclaimer',
});

export default function CodDisclaimerLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
