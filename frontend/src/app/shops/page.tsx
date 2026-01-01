'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, MapPin, Star, Store, ChevronRight, Award, Package, TrendingUp } from 'lucide-react';
import { API_BASE_URL } from '@/config/apiConfig';

interface Shop {
    id: number;
    name: string;
    slug: string;
    description: string;
    logo: string | null;
    banner: string | null;
    location: string;
    rating: number;
    total_products: number;
    is_verified: boolean;
    created_at: string;
}

export default function ShopsPage() {
    const [shops, setShops] = useState<Shop[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filteredShops, setFilteredShops] = useState<Shop[]>([]);

    useEffect(() => {
        fetchShops();
    }, []);

    useEffect(() => {
        if (search) {
            const filtered = shops.filter(shop =>
                shop.name.toLowerCase().includes(search.toLowerCase()) ||
                shop.location.toLowerCase().includes(search.toLowerCase())
            );
            setFilteredShops(filtered);
        } else {
            setFilteredShops(shops);
        }
    }, [search, shops]);

    const fetchShops = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/shops/`);
            if (res.ok) {
                const data = await res.json();
                setShops(data.results || data);
                setFilteredShops(data.results || data);
            }
        } catch (error) {
            console.error('Error fetching shops:', error);
            // Use sample data as fallback
            const sampleShops: Shop[] = [
                {
                    id: 1,
                    name: 'TechZone',
                    slug: 'techzone',
                    description: 'Your one-stop destination for all electronics and gadgets. We offer the latest smartphones, laptops, and accessories.',
                    logo: null,
                    banner: 'https://placehold.co/1200x400/667eea/ffffff?text=TechZone+Electronics',
                    location: 'Mumbai, Maharashtra',
                    rating: 4.8,
                    total_products: 245,
                    is_verified: true,
                    created_at: '2024-01-15'
                },
                {
                    id: 2,
                    name: 'FashionHub',
                    slug: 'fashionhub',
                    description: 'Trendy fashion for everyone. From casual wear to formal attire, we have it all at affordable prices.',
                    logo: null,
                    banner: 'https://placehold.co/1200x400/764ba2/ffffff?text=FashionHub+Clothing',
                    location: 'Delhi, NCR',
                    rating: 4.6,
                    total_products: 380,
                    is_verified: true,
                    created_at: '2024-02-20'
                },
                {
                    id: 3,
                    name: 'SportsWorld',
                    slug: 'sportsworld',
                    description: 'Premium sports equipment and fitness gear. Quality products for athletes and fitness enthusiasts.',
                    logo: null,
                    banner: 'https://placehold.co/1200x400/f093fb/ffffff?text=SportsWorld+Fitness',
                    location: 'Bangalore, Karnataka',
                    rating: 4.7,
                    total_products: 156,
                    is_verified: true,
                    created_at: '2024-03-10'
                },
                {
                    id: 4,
                    name: 'HomeDecor',
                    slug: 'homedecor',
                    description: 'Beautiful home decor items and furniture. Transform your living space with our curated collection.',
                    logo: null,
                    banner: 'https://placehold.co/1200x400/4facfe/ffffff?text=HomeDecor+Living',
                    location: 'Pune, Maharashtra',
                    rating: 4.5,
                    total_products: 198,
                    is_verified: true,
                    created_at: '2024-04-05'
                },
                {
                    id: 5,
                    name: 'ArtisanStore',
                    slug: 'artisanstore',
                    description: 'Handcrafted products made by local artisans. Unique, authentic, and sustainable.',
                    logo: null,
                    banner: 'https://placehold.co/1200x400/00d2ff/ffffff?text=ArtisanStore+Handmade',
                    location: 'Jaipur, Rajasthan',
                    rating: 4.9,
                    total_products: 89,
                    is_verified: true,
                    created_at: '2024-05-12'
                },
                {
                    id: 6,
                    name: 'BookHaven',
                    slug: 'bookhaven',
                    description: 'A paradise for book lovers. Wide collection of books across all genres and languages.',
                    logo: null,
                    banner: 'https://placehold.co/1200x400/ffd89b/333333?text=BookHaven+Library',
                    location: 'Kolkata, West Bengal',
                    rating: 4.7,
                    total_products: 520,
                    is_verified: true,
                    created_at: '2024-06-18'
                }
            ];
            setShops(sampleShops);
            setFilteredShops(sampleShops);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Page Header */}
            <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 text-white">
                <div className="container mx-auto px-4 py-16">
                    <nav className="text-sm text-white/80 mb-4">
                        <Link href="/" className="hover:text-white">Home</Link>
                        <span className="mx-2">/</span>
                        <span className="text-white font-medium">Shops</span>
                    </nav>
                    <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
                        Explore Local Shops
                    </h1>
                    <p className="text-white/90 text-lg max-w-2xl">
                        Discover amazing products from trusted local shops in your city. Support local businesses and get quality products delivered to your doorstep.
                    </p>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                {/* Search Bar */}
                <div className="mb-8">
                    <div className="max-w-2xl mx-auto">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Search shops by name or location..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white shadow-sm text-lg"
                            />
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                            <Store className="text-blue-600" size={24} />
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{filteredShops.length}</p>
                        <p className="text-sm text-gray-500">Active Shops</p>
                    </div>
                    <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
                        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                            <Award className="text-green-600" size={24} />
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{filteredShops.filter(s => s.is_verified).length}</p>
                        <p className="text-sm text-gray-500">Verified</p>
                    </div>
                    <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
                        <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                            <Package className="text-purple-600" size={24} />
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{filteredShops.reduce((sum, shop) => sum + shop.total_products, 0)}</p>
                        <p className="text-sm text-gray-500">Products</p>
                    </div>
                    <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
                        <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                            <TrendingUp className="text-amber-600" size={24} />
                        </div>
                        <p className="text-2xl font-bold text-gray-900">4.7</p>
                        <p className="text-sm text-gray-500">Avg Rating</p>
                    </div>
                </div>

                {/* Shops Grid */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                    </div>
                ) : filteredShops.length === 0 ? (
                    <div className="text-center py-20">
                        <Store size={64} className="mx-auto text-gray-300 mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No shops found</h3>
                        <p className="text-gray-500">Try adjusting your search</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredShops.map((shop) => (
                            <Link
                                key={shop.id}
                                href={`/shops/${shop.slug}`}
                                className="group"
                            >
                                <div className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 group-hover:-translate-y-1">
                                    {/* Banner */}
                                    <div className="relative h-40 bg-gradient-to-br from-primary-500 to-accent-500 overflow-hidden">
                                        {shop.banner ? (
                                            <img
                                                src={shop.banner}
                                                alt={shop.name}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Store size={48} className="text-white/30" />
                                            </div>
                                        )}
                                        {shop.is_verified && (
                                            <div className="absolute top-3 right-3 bg-white rounded-full px-3 py-1 flex items-center gap-1 shadow-lg">
                                                <Award size={14} className="text-amber-500" />
                                                <span className="text-xs font-semibold text-gray-900">Verified</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="p-6">
                                        {/* Logo & Name */}
                                        <div className="flex items-start gap-4 mb-4">
                                            <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center text-white font-bold text-2xl shadow-lg -mt-10 border-4 border-white">
                                                {shop.logo ? (
                                                    <img src={shop.logo} alt={shop.name} className="w-full h-full object-cover rounded-lg" />
                                                ) : (
                                                    shop.name.charAt(0)
                                                )}
                                            </div>
                                            <div className="flex-1 pt-1">
                                                <h3 className="font-bold text-xl text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-1">
                                                    {shop.name}
                                                </h3>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <div className="flex items-center gap-1">
                                                        <Star size={14} className="fill-amber-400 text-amber-400" />
                                                        <span className="text-sm font-semibold text-gray-700">{shop.rating}</span>
                                                    </div>
                                                    <span className="text-gray-300">•</span>
                                                    <span className="text-sm text-gray-600">{shop.total_products} products</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Description */}
                                        <p className="text-gray-600 text-sm line-clamp-2 mb-4">
                                            {shop.description}
                                        </p>

                                        {/* Location */}
                                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <MapPin size={16} />
                                                <span className="text-sm">{shop.location}</span>
                                            </div>
                                            <div className="flex items-center gap-1 text-primary-600 font-medium text-sm group-hover:gap-2 transition-all">
                                                Visit Shop
                                                <ChevronRight size={16} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
