import { buildNoIndexMetadata } from '@/lib/seo';

export const metadata = buildNoIndexMetadata({
    title: 'Your Shopping Cart',
    description: 'Review the items in your cart before checkout. Enjoy securely verified products and simple Cash on Delivery.',
    path: '/cart',
});

export default function CartLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
