import { buildCanonicalMetadata } from '@/lib/seo';

export const metadata = buildCanonicalMetadata({
    title: 'Shop All Products | Premium Deals',
    description: 'Browse our extensive collection of premium products across all categories. Find the best deals, verified sellers, and pay securely on delivery.',
    path: '/products',
});

export default function ProductsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
