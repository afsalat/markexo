import { buildCanonicalMetadata } from '@/lib/seo';

export const metadata = buildCanonicalMetadata({
    title: 'Browse All Categories',
    description: 'Explore a wide variety of product categories including Electronics, Fashion, Home Goods, and more. Find exactly what you need at VorionMart.',
    path: '/categories',
});

export default function CategoriesLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
