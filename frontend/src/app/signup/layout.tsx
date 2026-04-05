import { buildNoIndexMetadata } from '@/lib/seo';

export const metadata = buildNoIndexMetadata({
    title: 'Create Account',
    description: 'Create a VorionMart customer account.',
    path: '/signup',
});

export default function SignupLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
