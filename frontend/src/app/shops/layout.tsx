import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Our Partner Shops | Verified Sellers',
    description: 'Discover premium products from our network of verified partner shops. Support local businesses and enjoy high-quality goods with Cash on Delivery.',
    robots: {
        index: false,
        follow: false,
    },
};

export default function ShopsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
