import { buildNoIndexMetadata } from '@/lib/seo';

export const metadata = buildNoIndexMetadata({
    title: 'SEO Dashboard',
    description: 'Internal SEO execution dashboard for VorionMart.',
    path: '/seo-dashboard',
});

export default function SeoDashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
