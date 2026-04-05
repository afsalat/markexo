import { buildCanonicalMetadata } from '@/lib/seo';

export const metadata = buildCanonicalMetadata({
    title: 'Shipping Policy',
    description: 'Read the VorionMart shipping policy for delivery timelines, shipping charges, and service coverage across India.',
    path: '/shipping-policy',
});

export default function ShippingPolicyLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
