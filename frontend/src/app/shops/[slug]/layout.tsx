import { Metadata, ResolvingMetadata } from 'next';

// Note: Ensure this function exists in your api.ts or use an equivalent fetch
import { API_BASE_URL } from '@/config/apiConfig';

async function fetchShopDetails(slug: string) {
    const res = await fetch(`${API_BASE_URL}/shops/${slug}/`);
    if (!res.ok) throw new Error('Failed to fetch shop');
    return res.json();
}

type Props = {
    params: { slug: string }
}

export async function generateMetadata(
    { params }: Props,
    parent: ResolvingMetadata
): Promise<Metadata> {
    try {
        // Fetch data
        const shop = await fetchShopDetails(params.slug);

        return {
            title: `${shop.name} | Verified Partner Shop`,
            description: `Shop premium products directly from ${shop.name}. ${shop.description ? shop.description.substring(0, 120) : ''}`,
            openGraph: {
                title: `${shop.name} - Partner Shop`,
                description: `Shop premium products directly from ${shop.name}.`,
                images: shop.image ? [shop.image] : (shop.logo ? [shop.logo] : []),
                type: 'website',
            },
            robots: {
                index: false,
                follow: false,
            },
        };
    } catch (error) {
        // Fallback metadata if API fails or shop not found
        return {
            title: 'Shop Not Found',
            description: 'The requested partner shop could not be found.',
        };
    }
}

export default function ShopDetailLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
