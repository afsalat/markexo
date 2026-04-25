import { Metadata } from 'next';
import { fetchCategories, fetchBanners } from '@/lib/api';
import CategoriesClient from './CategoriesClient';

export async function generateMetadata(): Promise<Metadata> {
    try {
        const categoriesResponse = await fetchCategories({ flat: 'true' });
        const categoriesList = Array.isArray(categoriesResponse) ? categoriesResponse : (categoriesResponse.results || []);
        
        const totalCategories = categoriesList.length;
        const featuredCategories = categoriesList.slice(0, 3).map((cat: any) => cat.name).join(', ');
        
        return {
            title: `Shop All Categories | ${totalCategories}+ Collections | VorionMart`,
            description: `Explore ${totalCategories}+ product categories at VorionMart. ${featuredCategories} and more. Premium quality products with COD delivery across India.`,
            keywords: [
                'online shopping categories',
                'buy products online',
                'e-commerce categories',
                'COD shopping',
                'cash on delivery',
                'premium products India',
                'online marketplace',
                ...categoriesList.slice(0, 10).map((cat: any) => cat.name.toLowerCase())
            ],
            openGraph: {
                title: `${totalCategories}+ Product Categories | VorionMart`,
                description: `Shop from ${totalCategories}+ verified categories. ${featuredCategories} and more with cash on delivery.`,
                images: [],
            },
            twitter: {
                card: 'summary_large_image',
                title: `${totalCategories}+ Product Categories | VorionMart`,
                description: `Shop from ${totalCategories}+ verified categories. Premium products with COD delivery.`,
            },
        };
    } catch {
        return {
            title: 'All Categories | VorionMart',
            description: 'Explore our wide range of product categories. Premium quality products with cash on delivery.',
        };
    }
}

export default async function CategoriesPage() {
    let categoriesList: any[] = [];
    let bannersList: any[] = [];

    try {
        // Fetch data on server side
        const categoriesResponse = await fetchCategories({ flat: 'true' });
        categoriesList = Array.isArray(categoriesResponse) ? categoriesResponse : (categoriesResponse.results || []);
    } catch (error) {
        console.error('Failed to fetch categories:', error);
    }

    try {
        const bannersResponse = await fetchBanners();
        bannersList = Array.isArray(bannersResponse) ? bannersResponse : (bannersResponse.results || []);
    } catch (error) {
        console.error('Failed to fetch banners:', error);
    }

    // Pass data to client component
    return <CategoriesClient categories={categoriesList} banners={bannersList} />;
}
