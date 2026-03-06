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
import { fetchProduct, fetchReviews, Review } from '@/lib/api';


const relatedProducts = [
    { id: 2, name: 'Bluetooth Speaker', slug: 'bluetooth-speaker', price: 3499, sale_price: 2499, image: 'https://placehold.co/400x400/1a1a2e/00f5d4?text=Speaker', rating: 4.3 },
    { id: 3, name: 'Smart Fitness Watch', slug: 'smart-fitness-watch', price: 8999, sale_price: 5999, image: 'https://placehold.co/400x400/252542/00f5d4?text=Watch', rating: 4.6 },
    { id: 4, name: 'Wireless Earbuds', slug: 'wireless-earbuds-pro', price: 2999, sale_price: 1999, image: 'https://placehold.co/400x400/1a1a2e/7c3aed?text=Earbuds', rating: 4.4 },
    { id: 5, name: 'Power Bank 20000mAh', slug: 'power-bank', price: 2499, sale_price: 1799, image: 'https://placehold.co/400x400/252542/7c3aed?text=Power+Bank', rating: 4.7 },
];

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
    const { addToWishlist, removeFromWishlist, isWishlisted } = useCustomerAuth();
    const [addedToCart, setAddedToCart] = useState(false);

    // Fetch product data based on slug
    useEffect(() => {
        const loadProductData = async () => {
            try {
                setLoading(true);
                setError(null);
                const product = await fetchProduct(slug);
                setProductData(product);
                setSelectedImage(0);

                // Fetch reviews for this product
                try {
                    const productReviews = await fetchReviews(product.id);
                    setReviews(productReviews);
                } catch (reviewErr) {
                    console.error('Error fetching reviews:', reviewErr);
                    // Don't set error for reviews, just log it
                }
            } catch (err: any) {
                console.error('Error fetching product:', err);
                setError(err.message || 'Failed to load product');
            } finally {
                setLoading(false);
            }
        };

        if (slug) {
            loadProductData();
        }
    }, [slug]);

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

    return (
        <div className="min-h-screen bg-dark-900">
            {/* Breadcrumb */}
            <div className="bg-dark-800 border-b border-dark-700">
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
                    <div className="space-y-4">
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
                    <div className="space-y-6">
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
                                <span className="text-silver-400">{productData.reviewCount} Reviews</span>
                                <span className="text-dark-500">|</span>
                                <span className="text-silver-400">{productData.soldCount} Sold</span>
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
                <div className="bg-dark-800 border border-dark-700 rounded-3xl overflow-hidden mb-12">
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
                                onClick={() => setActiveTab('reviews')}
                                className={`flex-1 py-4 px-6 font-semibold transition-colors ${activeTab === 'reviews' ? 'text-accent-500 border-b-2 border-accent-500 bg-dark-700' : 'text-silver-400 hover:text-white'}`}
                            >
                                Reviews ({productData.reviewCount})
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
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {Object.entries(productData.specifications || {}).map(([key, value]) => (
                                        <div key={key} className="flex items-center p-4 bg-dark-700 rounded-xl">
                                            <span className="font-semibold text-white w-1/2">{key}:</span>
                                            <span className="text-silver-300 w-1/2">{String(value)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'reviews' && (
                            <div className="space-y-6 animate-fade-in">
                                {/* Review Summary */}
                                <div className="bg-dark-700 rounded-2xl p-6">
                                    <div className="flex items-center gap-8">
                                        <div className="text-center">
                                            <div className="text-5xl font-bold text-white mb-2">{productData.rating}</div>
                                            <div className="flex items-center gap-1 mb-1">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <Star key={star} size={20} className={star <= Math.floor(productData.rating) ? 'fill-amber-400 text-amber-400' : 'text-dark-500'} />
                                                ))}
                                            </div>
                                            <p className="text-sm text-silver-500">{productData.reviewCount} reviews</p>
                                        </div>
                                        <div className="flex-1">
                                            {[5, 4, 3, 2, 1].map((rating) => (
                                                <div key={rating} className="flex items-center gap-3 mb-2">
                                                    <span className="text-sm text-silver-400 w-8">{rating} ★</span>
                                                    <div className="flex-1 h-2 bg-dark-600 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-amber-400 rounded-full"
                                                            style={{ width: `${rating === 5 ? 70 : rating === 4 ? 20 : rating === 3 ? 5 : rating === 2 ? 3 : 2}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-sm text-silver-500 w-12">{rating === 5 ? 70 : rating === 4 ? 20 : rating === 3 ? 5 : rating === 2 ? 3 : 2}%</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Individual Reviews */}
                                <div className="space-y-4">
                                    {reviews.map((review) => (
                                        <div key={review.id} className="p-6 bg-dark-700 rounded-2xl">
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 bg-gradient-to-br from-accent-500 to-primary-600 rounded-full flex items-center justify-center text-dark-900 font-bold">
                                                        {review.customer_name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="font-semibold text-white">{review.customer_name}</h4>
                                                            {review.verified && (
                                                                <span className="px-2 py-0.5 bg-accent-500/10 text-accent-500 text-xs rounded-full font-medium flex items-center gap-1">
                                                                    <Check size={12} /> Verified
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-silver-500">{review.created_at_formatted}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <Star key={star} size={16} className={star <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-dark-500'} />
                                                    ))}
                                                </div>
                                            </div>
                                            <p className="text-silver-300 leading-relaxed">{review.comment}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Related Products */}
                <div>
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
