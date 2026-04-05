import { buildNoIndexMetadata } from '@/lib/seo';

export const metadata = buildNoIndexMetadata({
    title: 'Secure Checkout | Pay on Delivery',
    description: 'Complete your order securely with VorionMart. Choose Cash on Delivery and pay only when your products arrive at your doorstep.',
    path: '/checkout',
});

export default function CheckoutLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
