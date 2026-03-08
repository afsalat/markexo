import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Your Shopping Cart',
    description: 'Review the items in your cart before checkout. Enjoy securely verified products and simple Cash on Delivery.',
};

export default function CartLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
