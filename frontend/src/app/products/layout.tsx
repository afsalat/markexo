import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Shop All Products | Premium Deals',
    description: 'Browse our extensive collection of premium products across all categories. Find the best deals, verified sellers, and pay securely on delivery.',
};

export default function ProductsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
