import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Browse All Categories',
    description: 'Explore a wide variety of product categories including Electronics, Fashion, Home Goods, and more. Find exactly what you need at VorionMart.',
};

export default function CategoriesLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
