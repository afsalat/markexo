import { buildCanonicalMetadata } from '@/lib/seo';

export const metadata = buildCanonicalMetadata({
    title: 'Terms & Conditions',
    description: 'Read the VorionMart terms and conditions for orders, COD payments, delivery, returns, and platform use.',
    path: '/terms-and-conditions',
});

export default function TermsAndConditionsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
