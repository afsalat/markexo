import { buildNoIndexMetadata } from '@/lib/seo';

export const metadata = buildNoIndexMetadata({
    title: 'Your Profile',
    description: 'Manage your VorionMart account, orders, wishlist, and addresses.',
    path: '/profile',
});

export default function ProfileLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
