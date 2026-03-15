'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import {
    ShoppingCart, Heart, Share2, Star, Truck, Shield, RotateCcw,
    Award, ChevronRight, Plus, Minus, Check, MapPin, Store, CreditCard, Package
} from 'lucide-react';
import { useCart } from '@/lib/cart';
import { useCustomerAuth } from '@/context/CustomerAuthContext';
import { fetchProduct, fetchProducts, fetchReviews, createReview, Product, Review } from '@/lib/api';

type RelatedProductCard = {
    id: number;
    name: string;
    slug: string;
    price: number;
    sale_price: number;
    image: string;
    rating: number;
};

export default function ProductDetailPage() {
    const router = useRouter();
    const params = useParams();
    const slug = params.slug as string;

    const { addItem } = useCart();
    const [productData, setProductData] = useState<any>(null);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedImage, setSelectedImage] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const [activeTab, setActiveTab] = useState<'description' | 'specifications' | 'reviews'>('description');
    const { addToWishlist, removeFromWishlist, isWishlisted, customer, isAuthenticated } = useCustomerAuth();
    const [addedToCart, setAddedToCart] = useState(false);
    const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
    const [reviewSubmitting, setReviewSubmitting] = useState(false);
    const [reviewError, setReviewError] = useState<string | null>(null);
    const [reviewSuccess, setReviewSuccess] = useState(false);
    const [relatedProducts, setRelatedProducts] = useState<RelatedProductCard[]>([]);

    const normalizeProducts = (response: any): Product[] => {
        if (Array.isArray(response)) {
            return response;
        }

        if (Array.isArray(response?.results)) {
            return response.results;
        }

        return [];
    };

    const mapRelatedProduct = (product: Product): RelatedProductCard => {
        const salePrice = Number(product.current_price ?? product.price ?? 0);
        const originalPrice = Number(product.price ?? product.current_price ?? 0);

        return {
            id: product.id,
            name: product.name,
            slug: product.slug,
            price: originalPrice,
            sale_price: salePrice,
            image: product.image || 'https://placehold.co/400x400/1a1a2e/ffffff?text=Product',
            rating: Number(product.rating ?? 0),
        };
    };

    const loadRelatedProducts = async (product: any) => {
        const nextRelatedProducts: RelatedProductCard[] = [];
        const seen = new Set<string>([product.slug]);

        const appendProducts = (items: Product[]) => {
            for (const item of items) {
                if (seen.has(item.slug)) {
                    continue;
                }

                nextRelatedProducts.push(mapRelatedProduct(item));
                seen.add(item.slug);

                if (nextRelatedProducts.length >= 4) {
                    break;
                }
            }
        };

        if (product.category?.slug) {
            const categoryProducts = normalizeProducts(
                await fetchProducts({ category: product.category.slug })
            );
            appendProducts(categoryProducts);
        }

        if (nextRelatedProducts.length < 4) {
            const featuredProducts = normalizeProducts(
                await fetchProducts({ featured: 'true' })
            );
            appendProducts(featuredProducts);
        }

        if (nextRelatedProducts.length < 4) {
            const latestProducts = normalizeProducts(
                await fetchProducts({ sort: 'newest' })
            );
            appendProducts(latestProducts);
        }

        setRelatedProducts(nextRelatedProducts.slice(0, 4));
    };

    // Fetch product data based on slug
    useEffect(() => {
        const loadProductData = async () => {
            try {
                setLoading(true);
                setError(null);
                const product = await fetchProduct(slug);
                setProductData(product);
                setSelectedImage(0);
                setRelatedProducts([]);

                try {
                    await loadRelatedProducts(product);
                } catch (relatedErr) {
                    console.error('Error fetching related products:', relatedErr);
                    setRelatedProducts([]);
                }

                // Fetch reviews for this product
                try {
                    const productReviews = await fetchReviews(product.id);
                    setReviews(Array.isArray(productReviews) ? productReviews : productReviews.results || []);
                } catch (reviewErr) {
                    console.error('Error fetching reviews:', reviewErr);
                    // Don't set error for reviews, just log it
                    setReviews([]);
                }
            } catch (err: any) {
                console.error('Error fetching product:', err);
                setError(err.message || 'Failed to load product');
                setRelatedProducts([]);
            } finally {
                setLoading(false);
            }
        };

        if (slug) {
            loadProductData();
        }
    }, [slug]);

    // Calculate real rating distribution from fetched reviews
    const getRatingPercent = (star: number) => {
        if (!reviews || reviews.length === 0) return 0;
        const count = reviews.filter(r => r.rating === star).length;
        return Math.round((count / reviews.length) * 100);
    };

    const handleReviewSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!productData) return;

        // Check auth again before submitting
        if (!isAuthenticated) {
            router.push(`/signup?redirect=/products/${slug}`);
            return;
        }

        setReviewSubmitting(true);
        setReviewError(null);
        setReviewSuccess(false);
        try {
            await createReview({
                product: productData.id,
                rating: reviewForm.rating,
                comment: reviewForm.comment,
            });
            setReviewSuccess(true);
            setReviewForm({ rating: 5, comment: '' });
            // Refresh reviews after successful submission
            const updatedReviews = await fetchReviews(productData.id);
            setReviews(Array.isArray(updatedReviews) ? updatedReviews : updatedReviews.results || []);
        } catch (err: any) {
            // If backend returns 401, token is expired - redirect to signup
            const msg = err.message || '';
            if (msg.includes('Authentication credentials') || msg.includes('401') || msg.includes('not provided')) {
                router.push(`/signup?redirect=/products/${slug}`);
                return;
            }
            setReviewError(msg || 'Failed to submit review. You may have already reviewed this product.');
        } finally {
            setReviewSubmitting(false);
        }
    };

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-dark-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-accent-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-silver-400">Loading product...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error || !productData) {
        return (
            <div className="min-h-screen bg-dark-900 flex items-center justify-center">
                <div className="text-center">
                    <ShoppingCart size={64} className="mx-auto text-dark-600 mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">Product Not Found</h3>
                    <p className="text-silver-500 mb-6">{error || 'The product you are looking for does not exist.'}</p>
                    <Link href="/products" className="btn-primary inline-flex items-center gap-2">
                        <ChevronRight size={20} className="rotate-180" />
                        Back to Products
                    </Link>
                </div>
            </div>
        );
    }

    // Check if product is wishlist
    const wishlisted = isWishlisted(productData.id);

    const toggleWishlist = () => {
        if (wishlisted) {
            removeFromWishlist(productData.id);
        } else {
            addToWishlist(productData);
        }
    };

    const incrementQuantity = () => {
        if (quantity < productData.stock) setQuantity(quantity + 1);
    };

    const decrementQuantity = () => {
        if (quantity > 1) setQuantity(quantity - 1);
    };

    const handleAddToCart = () => {
        addItem(productData, quantity);
        setAddedToCart(true);
        setTimeout(() => setAddedToCart(false), 2000);
    };

    const handleBuyNow = () => {
        addItem(productData, quantity);
        router.push('/cart');
    };

    const getPurchaseSignal = () => {
        const stock = Number(productData?.stock ?? 0);
        const variants = [
            `Only ${Math.max(stock, 1)} left in stock`,
            'Offer closing soon',
            'Selling fast right now',
        ];

        if (stock > 0 && stock <= 10) {
            return variants[0];
        }

        return variants[(Number(productData?.id ?? 0) + reviews.length) % variants.length];
    };

    return (
        <div className="min-h-screen bg-dark-900">
            {/* Breadcrumb */}
            <div className="bg-dark-800 border-b border-dark-700" data-aos="fade-down" data-aos-delay="0">
                <div className="container mx-auto px-4 py-4">
                    <nav className="flex items-center gap-2 text-sm text-silver-500">
                        <Link href="/" className="hover:text-accent-500 transition-colors">Home</Link>
                        <ChevronRight size={16} />
                        <Link href="/products" className="hover:text-accent-500 transition-colors">Products</Link>
                        <ChevronRight size={16} />
                        <Link href={`/products?category=${productData.category.slug}`} className="hover:text-accent-500 transition-colors">{productData.category.name}</Link>
                        <ChevronRight size={16} />
                        <span className="text-white font-medium">{productData.name}</span>
                    </nav>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                {/* Product Main Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                    {/* Image Gallery */}
                    <div className="space-y-4" data-aos="fade-right" data-aos-delay="100">
                        {(() => {
                            // Construct all images list (Main Image + Gallery Images)
                            const allImages = [
                                ...(productData.image ? [{ id: 'main', image: productData.image }] : []),
                                ...(productData.images || [])
                            ];

                            // Safe check if no images exist
                            const displayImage = allImages.length > 0
                                ? allImages[selectedImage]?.image
                                : 'https://placehold.co/600x600/1a1a2e/ffffff?text=No+Image';

                            return (
                                <>
                                    {/* Main Image */}
                                    <div className="relative aspect-square bg-dark-800 rounded-3xl overflow-hidden border border-dark-700 group">
                                        <img
                                            src={displayImage || 'https://placehold.co/600x600/1a1a2e/ffffff?text=No+Image'}
                                            alt={productData.name}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                        />
                                        {productData.discount_percent > 0 && (
                                            <div className="absolute top-4 left-4 badge badge-sale px-4 py-2 text-lg font-bold">
                                                {productData.discount_percent}% OFF
                                            </div>
                                        )}
                                        <button
                                            onClick={toggleWishlist}
                                            className={`absolute top-4 right-4 w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all ${wishlisted ? 'bg-red-500 text-white' : 'bg-dark-700 text-silver-300 hover:bg-accent-500 hover:text-dark-900'}`}
                                        >
                                            <Heart size={20} className={wishlisted ? 'fill-current' : ''} />
                                        </button>
                                    </div>

                                    {/* Thumbnail Gallery */}
                                    {allImages.length > 1 && (
                                        <div className="grid grid-cols-4 gap-3">
                                            {allImages.map((img: any, index: number) => (
                                                <button
                                                    key={img.id || index}
                                                    onClick={() => setSelectedImage(index)}
                                                    className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${selectedImage === index ? 'border-accent-500 shadow-glow-sm' : 'border-dark-600 hover:border-accent-500/50'}`}
                                                >
                                                    <img src={img.image} alt={`View ${index + 1}`} className="w-full h-full object-cover" />
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </>
                            );
                        })()}
                    </div>

                    {/* Product Info */}
                    <div className="space-y-6" data-aos="fade-left" data-aos-delay="200">
                        {/* Title & Rating */}
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="px-3 py-1 bg-accent-500/10 text-accent-500 rounded-full text-sm font-semibold">
                                    {productData.category.name}
                                </span>
                                <span className="px-3 py-1 bg-green-500/10 text-green-400 rounded-full text-sm font-semibold flex items-center gap-1">
                                    <Check size={14} /> In Stock ({productData.stock})
                                </span>
                            </div>
                            <h1 className="font-display text-3xl md:text-4xl font-bold text-white mb-3">
                                {productData.name}
                            </h1>
                            <div className="flex items-center gap-4 flex-wrap">
                                <div className="flex items-center gap-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Star
                                            key={star}
                                            size={18}
                                            className={star <= Math.floor(productData.rating) ? 'fill-amber-400 text-amber-400' : 'text-dark-500'}
                                        />
                                    ))}
                                    <span className="ml-2 text-white font-semibold">{productData.rating}</span>
                                </div>
                                <span className="text-dark-500">|</span>
                                <span className="text-silver-400">{reviews.length} Reviews</span>
                                <span className="text-dark-500">|</span>
                                <span className="text-silver-400">{getPurchaseSignal()}</span>
                            </div>
                        </div>

                        {/* Price */}
                        <div className="bg-dark-800 border border-dark-600 rounded-2xl p-6">
                            <div className="flex items-baseline gap-3 mb-2">
                                <span className="text-4xl font-bold text-white">₹{productData.current_price.toLocaleString()}</span>
                                {productData.sale_price && (
                                    <>
                                        <span className="text-2xl text-silver-500 line-through">₹{productData.price.toLocaleString()}</span>
                                        <span className="px-3 py-1 bg-green-500 text-white rounded-full text-sm font-bold">
                                            Save ₹{(productData.price - productData.current_price).toLocaleString()}
                                        </span>
                                    </>
                                )}
                            </div>
                            <p className="text-sm text-silver-500">Inclusive of all taxes</p>
                        </div>

                        {/* COD Trust Badge - Prominent */}
                        <div className="bg-accent-500/10 border border-accent-500/30 rounded-2xl p-4 flex items-center gap-4">
                            <div className="w-14 h-14 bg-accent-500/20 rounded-xl flex items-center justify-center">
                                <CreditCard className="text-accent-500" size={28} />
                            </div>
                            <div>
                                <h3 className="font-bold text-white text-lg">💵 Cash on Delivery Available</h3>
                                <p className="text-silver-400 text-sm">Pay when you receive your order. No advance payment needed.</p>
                            </div>
                        </div>

                        {/* Trust & Fulfillment Info */}
                        <div className="bg-dark-800 border border-dark-600 rounded-2xl p-5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-gradient-to-br from-accent-500 to-primary-600 rounded-full flex items-center justify-center text-dark-900">
                                        <Package size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-white flex items-center gap-2">
                                            Fulfilled by VorionMart
                                            <Award size={16} className="text-accent-500" />
                                        </h3>
                                        <div className="flex items-center gap-3 text-sm text-silver-400">
                                            <span className="flex items-center gap-1">
                                                <Star size={14} className="fill-accent-500 text-accent-500" />
                                                Premium Quality Checked
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quantity & Actions */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <span className="text-silver-300 font-medium">Quantity:</span>
                                <div className="flex items-center border-2 border-dark-600 rounded-xl overflow-hidden">
                                    <button
                                        onClick={decrementQuantity}
                                        className="w-12 h-12 flex items-center justify-center hover:bg-dark-700 transition-colors text-silver-300"
                                    >
                                        <Minus size={18} />
                                    </button>
                                    <span className="w-16 h-12 flex items-center justify-center font-bold text-lg border-x-2 border-dark-600 text-white">
                                        {quantity}
                                    </span>
                                    <button
                                        onClick={incrementQuantity}
                                        className="w-12 h-12 flex items-center justify-center hover:bg-dark-700 transition-colors text-silver-300"
                                    >
                                        <Plus size={18} />
                                    </button>
                                </div>
                                <span className="text-sm text-silver-500">({productData.stock} available)</span>
                            </div>


                            <div className="flex gap-3">
                                <button
                                    onClick={handleAddToCart}
                                    className="flex-1 btn-primary py-4 text-lg font-bold flex items-center justify-center gap-2"
                                >
                                    {addedToCart ? (
                                        <>
                                            <Check size={22} />
                                            Added to Cart!
                                        </>
                                    ) : (
                                        <>
                                            <ShoppingCart size={22} />
                                            Add to Cart
                                        </>
                                    )}
                                </button>
                                <button className="w-14 h-14 border-2 border-dark-600 rounded-xl flex items-center justify-center hover:bg-dark-700 transition-colors text-silver-300">
                                    <Share2 size={20} />
                                </button>
                            </div>

                            <button
                                onClick={handleBuyNow}
                                className="w-full py-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl font-bold text-lg hover:from-primary-500 hover:to-primary-600 transition-all shadow-glow-purple"
                            >
                                Buy Now — Pay on Delivery
                            </button>
                        </div>

                        {/* Trust Features */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center gap-3 p-4 bg-dark-800 border border-dark-600 rounded-xl">
                                <div className="w-10 h-10 bg-accent-500/10 rounded-lg flex items-center justify-center">
                                    <Truck className="text-accent-500" size={20} />
                                </div>
                                <div>
                                    <p className="font-semibold text-white text-sm">Free Delivery</p>
                                    <p className="text-xs text-silver-500">On orders above ₹500</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-4 bg-dark-800 border border-dark-600 rounded-xl">
                                <div className="w-10 h-10 bg-accent-500/10 rounded-lg flex items-center justify-center">
                                    <Shield className="text-accent-500" size={20} />
                                </div>
                                <div>
                                    <p className="font-semibold text-white text-sm">Secure Checkout</p>
                                    <p className="text-xs text-silver-500">100% protected</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-4 bg-dark-800 border border-dark-600 rounded-xl">
                                <div className="w-10 h-10 bg-accent-500/10 rounded-lg flex items-center justify-center">
                                    <RotateCcw className="text-accent-500" size={20} />
                                </div>
                                <div>
                                    <p className="font-semibold text-white text-sm">7 Days Return</p>
                                    <p className="text-xs text-silver-500">Easy returns</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-4 bg-dark-800 border border-dark-600 rounded-xl">
                                <div className="w-10 h-10 bg-accent-500/10 rounded-lg flex items-center justify-center">
                                    <Package className="text-accent-500" size={20} />
                                </div>
                                <div>
                                    <p className="font-semibold text-white text-sm">Quality Assured</p>
                                    <p className="text-xs text-silver-500">Verified seller</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs Section */}
                <div className="bg-dark-800 border border-dark-700 rounded-3xl overflow-hidden mb-12" data-aos="fade-up" data-aos-delay="300">
                    {/* Tab Headers */}
                    <div className="border-b border-dark-700">
                        <div className="flex">
                            <button
                                onClick={() => setActiveTab('description')}
                                className={`flex-1 py-4 px-6 font-semibold transition-colors ${activeTab === 'description' ? 'text-accent-500 border-b-2 border-accent-500 bg-dark-700' : 'text-silver-400 hover:text-white'}`}
                            >
                                Description
                            </button>
                            <button
                                onClick={() => setActiveTab('specifications')}
                                className={`flex-1 py-4 px-6 font-semibold transition-colors ${activeTab === 'specifications' ? 'text-accent-500 border-b-2 border-accent-500 bg-dark-700' : 'text-silver-400 hover:text-white'}`}
                            >
                                Specifications
                            </button>
                            <button
                                onClick={() => {
                                    if (!isAuthenticated) {
                                        router.push(`/signup?redirect=/products/${slug}`);
                                    } else {
                                        setActiveTab('reviews');
                                    }
                                }}
                                className={`flex-1 py-4 px-6 font-semibold transition-colors ${activeTab === 'reviews' ? 'text-accent-500 border-b-2 border-accent-500 bg-dark-700' : 'text-silver-400 hover:text-white'}`}
                            >
                                Reviews ({reviews.length})
                            </button>
                        </div>
                    </div>

                    {/* Tab Content */}
                    <div className="p-8">
                        {activeTab === 'description' && (
                            <div className="space-y-6 animate-fade-in">
                                <p className="text-silver-300 text-lg leading-relaxed">{productData.description}</p>
                                {productData.features && productData.features.length > 0 && (
                                    <div>
                                        <h3 className="font-bold text-xl text-white mb-4">Key Features</h3>
                                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {productData.features.map((feature: string, index: number) => (
                                                <li key={index} className="flex items-center gap-3 p-3 bg-dark-700 rounded-xl">
                                                    <div className="w-6 h-6 bg-accent-500 rounded-full flex items-center justify-center flex-shrink-0">
                                                        <Check size={14} className="text-dark-900" />
                                                    </div>
                                                    <span className="text-silver-300">{feature}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'specifications' && (
                            <div className="animate-fade-in">
                                {Object.keys(productData.specifications || {}).length > 0 ? (
                                    <div className="bg-dark-700 rounded-xl overflow-hidden divide-y divide-dark-600">
                                        {Object.entries(productData.specifications || {}).map(([key, value]) => (
                                            <div key={key} className="flex items-center px-5 py-3.5">
                                                <span className="font-semibold text-white w-1/3">{key}</span>
                                                <span className="text-silver-300 flex-1">{String(value)}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 bg-dark-800 rounded-xl border border-dark-700">
                                        <p className="text-silver-400">No specifications available for this product.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'reviews' && (
                            <div className="space-y-6 animate-fade-in">
                                {/* Rating Summary */}
                                <div className="bg-dark-700 rounded-2xl p-6">
                                    <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
                                        <div className="text-center flex-shrink-0">
                                            <div className="text-5xl font-bold text-white mb-2">
                                                {reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : '0.0'}
                                            </div>
                                            <div className="flex items-center gap-1 mb-1 justify-center">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <Star key={star} size={20} className={star <= Math.round(reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0) ? 'fill-amber-400 text-amber-400' : 'text-dark-500'} />
                                                ))}
                                            </div>
                                            <p className="text-sm text-silver-500">{reviews.length} review{reviews.length !== 1 ? 's' : ''}</p>
                                        </div>
                                        <div className="flex-1 w-full">
                                            {[5, 4, 3, 2, 1].map((star) => {
                                                const pct = getRatingPercent(star);
                                                return (
                                                    <div key={star} className="flex items-center gap-3 mb-2">
                                                        <span className="text-sm text-silver-400 w-8">{star} ★</span>
                                                        <div className="flex-1 h-2 bg-dark-600 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-amber-400 rounded-full transition-all duration-500"
                                                                style={{ width: `${pct}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-sm text-silver-500 w-10 text-right">{pct}%</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                {/* Write a Review */}
                                <div className="bg-dark-700 rounded-2xl p-6">
                                    <h3 className="font-bold text-lg text-white mb-4">Write a Review</h3>
                                    {isAuthenticated ? (
                                        <form onSubmit={handleReviewSubmit} className="space-y-4">
                                            {/* Star Picker */}
                                            <div>
                                                <label className="block text-sm font-medium text-silver-300 mb-2">Your Rating</label>
                                                <div className="flex items-center gap-2">
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <button
                                                            key={star}
                                                            type="button"
                                                            onClick={() => setReviewForm(prev => ({ ...prev, rating: star }))}
                                                            className="transition-transform hover:scale-125"
                                                        >
                                                            <Star
                                                                size={28}
                                                                className={star <= reviewForm.rating ? 'fill-amber-400 text-amber-400' : 'text-dark-400 hover:text-amber-300'}
                                                            />
                                                        </button>
                                                    ))}
                                                    <span className="ml-2 text-sm text-silver-400">
                                                        {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][reviewForm.rating]}
                                                    </span>
                                                </div>
                                            </div>
                                            {/* Comment */}
                                            <div>
                                                <label className="block text-sm font-medium text-silver-300 mb-2">Your Review</label>
                                                <textarea
                                                    value={reviewForm.comment}
                                                    onChange={(e) => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                                                    required
                                                    rows={4}
                                                    placeholder="Share your experience with this product..."
                                                    className="w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded-xl text-white placeholder-silver-600 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent resize-none transition"
                                                />
                                            </div>
                                            {reviewError && (
                                                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">{reviewError}</div>
                                            )}
                                            {reviewSuccess && (
                                                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm flex items-center gap-2">
                                                    <Check size={16} /> Thank you! Your review has been submitted.
                                                </div>
                                            )}
                                            <button
                                                type="submit"
                                                disabled={reviewSubmitting || !reviewForm.comment.trim()}
                                                className="px-6 py-2.5 bg-accent-600 hover:bg-accent-500 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-accent-500/20"
                                            >
                                                {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
                                            </button>
                                        </form>
                                    ) : (
                                        <div className="text-center py-4">
                                            <p className="text-silver-400 mb-4">Please sign in to write a review.</p>
                                            <Link href={`/signup?redirect=/products/${slug}`} className="btn-primary inline-flex items-center gap-2">
                                                Sign In to Review
                                            </Link>
                                        </div>
                                    )}
                                </div>

                                {/* Individual Reviews */}
                                {reviews.length === 0 ? (
                                    <div className="text-center py-8 bg-dark-700 rounded-2xl">
                                        <Star size={36} className="mx-auto text-dark-500 mb-3" />
                                        <p className="text-silver-400">No reviews yet. Be the first to review this product!</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {reviews.map((review) => (
                                            <div key={review.id} className="p-6 bg-dark-700 rounded-2xl">
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-12 h-12 bg-gradient-to-br from-accent-500 to-primary-600 rounded-full flex items-center justify-center text-dark-900 font-bold text-lg flex-shrink-0">
                                                            {review.customer_name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <h4 className="font-semibold text-white">{review.customer_name}</h4>
                                                                {review.verified && (
                                                                    <span className="px-2 py-0.5 bg-accent-500/10 text-accent-500 text-xs rounded-full font-medium flex items-center gap-1">
                                                                        <Check size={12} /> Verified Purchase
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-sm text-silver-500">{review.created_at_formatted}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-0.5 flex-shrink-0">
                                                        {[1, 2, 3, 4, 5].map((star) => (
                                                            <Star key={star} size={16} className={star <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-dark-500'} />
                                                        ))}
                                                    </div>
                                                </div>
                                                <p className="text-silver-300 leading-relaxed">{review.comment}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Related Products */}
                {relatedProducts.length > 0 && (
                <div data-aos="fade-up" data-aos-delay="400">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="font-display text-2xl font-bold text-white">You May Also Like</h2>
                        <Link href="/products" className="text-accent-500 font-medium hover:underline flex items-center gap-1">
                            View All <ChevronRight size={18} />
                        </Link>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {relatedProducts.map((product) => (
                            <Link key={product.id} href={`/products/${product.slug}`} className="group">
                                <div className="product-card">
                                    <div className="aspect-square bg-dark-700 overflow-hidden">
                                        <img
                                            src={product.image}
                                            alt={product.name}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                        />
                                    </div>
                                    <div className="p-4">
                                        <h3 className="font-semibold text-white line-clamp-2 mb-2 group-hover:text-accent-500 transition-colors">
                                            {product.name}
                                        </h3>
                                        <div className="flex items-center gap-1 mb-2">
                                            <Star size={14} className="fill-amber-400 text-amber-400" />
                                            <span className="text-sm text-silver-400">{product.rating}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg font-bold text-white">₹{product.sale_price.toLocaleString()}</span>
                                            <span className="text-sm text-silver-500 line-through">₹{product.price.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
                )}
            </div>

            {/* Sticky Mobile CTA */}
            <div className="sticky-cta">
                <div className="flex gap-3">
                    <button
                        onClick={handleAddToCart}
                        className="flex-1 btn-primary py-3 font-bold flex items-center justify-center gap-2"
                    >
                        <ShoppingCart size={20} />
                        Add to Cart
                    </button>
                    <button
                        onClick={handleBuyNow}
                        className="flex-1 bg-gradient-to-r from-primary-600 to-primary-700 text-white py-3 rounded-xl font-bold"
                    >
                        Buy Now
                    </button>
                </div>
            </div>
        </div>
    );
}
