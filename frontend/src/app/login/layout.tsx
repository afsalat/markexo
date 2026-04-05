import { buildNoIndexMetadata } from '@/lib/seo';

export const metadata = buildNoIndexMetadata({
    title: 'Customer Login',
    description: 'Sign in to your VorionMart account.',
    path: '/login',
});

export default function LoginLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
