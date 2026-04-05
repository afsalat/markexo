import { buildCanonicalMetadata } from '@/lib/seo';

export const metadata = buildCanonicalMetadata({
    title: 'Privacy Policy',
    description: 'Read the VorionMart privacy policy and learn how customer information is collected, used, and protected.',
    path: '/privacy-policy',
});

export default function PrivacyPolicyLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
