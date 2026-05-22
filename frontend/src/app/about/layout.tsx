import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'About Us | VorionMart',
    description: 'Learn about VorionMart - India\'s trusted D2C marketplace. Operated by Vorion Nexus Technology, Kozhikode, Kerala. Cash on Delivery, verified sellers, and premium products.',
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
        },
    },
    alternates: {
        canonical: '/about',
    },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
