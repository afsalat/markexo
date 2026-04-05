import { buildCanonicalMetadata } from '@/lib/seo';

export const metadata = buildCanonicalMetadata({
    title: 'Return & Refund Policy',
    description: 'Read the VorionMart return and refund policy for eligible returns, refund timelines, and support details.',
    path: '/return-refund-policy',
});

export default function ReturnRefundPolicyLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
