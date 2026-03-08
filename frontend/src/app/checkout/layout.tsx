import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Secure Checkout | Pay on Delivery',
    description: 'Complete your order securely with VorionMart. Choose Cash on Delivery and pay only when your products arrive at your doorstep.',
};

export default function CheckoutLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
