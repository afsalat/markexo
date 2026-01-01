'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    ShoppingCart, Heart, Share2, Star, Truck, Shield, RotateCcw,
    Award, ChevronRight, Plus, Minus, Check, MapPin, Store, Tag
} from 'lucide-react';
import { useCart } from '@/lib/cart';
import { useCustomerAuth } from '@/context/CustomerAuthContext';

// Sample product data (in production, fetch from API)
const productData = {
    id: 1,
    name: 'Premium Wireless Headphones',
    slug: 'premium-wireless-headphones',
    price: 4999,
    sale_price: 2999,
    current_price: 2999,
    discount_percent: 40,
    description: 'Experience crystal-clear audio with our premium wireless headphones. Featuring advanced noise cancellation, 30-hour battery life, and premium comfort padding for all-day wear.',
    features: [
        'Active Noise Cancellation (ANC)',
        '30-hour battery life',
        'Premium comfort padding',
        'Bluetooth 5.0 connectivity',
        'Built-in microphone',
        'Foldable design with carrying case'
    ],
    specifications: {
        'Brand': 'AudioPro',
        'Model': 'AP-WH1000',
        'Color': 'Matte Black',
        'Weight': '250g',
        'Connectivity': 'Bluetooth 5.0, 3.5mm Jack',
        'Battery': '30 hours playback'
    },
    images: [
        'https://placehold.co/800x800/667eea/ffffff?text=Product+Image+1',
        'https://placehold.co/800x800/764ba2/ffffff?text=Product+Image+2',
        'https://placehold.co/800x800/f093fb/ffffff?text=Product+Image+3',
        'https://placehold.co/800x800/4facfe/ffffff?text=Product+Image+4',
    ],
    shop: { id: 1, name: 'TechZone', slug: 'techzone', rating: 4.8, location: 'Mumbai', image: null },
    category: { id: 1, name: 'Electronics', slug: 'electronics' },
    stock: 15,
    rating: 4.5,
    reviewCount: 128,
    soldCount: 450,
    sku: 'AP-WH1000',
    is_featured: true,
    is_active: true,
    images: []
};

const reviews = [
    { id: 1, name: 'Rajesh Kumar', rating: 5, date: '2024-12-20', comment: 'Excellent sound quality! Worth every penny. The noise cancellation is amazing.', verified: true },
    { id: 2, name: 'Priya Sharma', rating: 4, date: '2024-12-18', comment: 'Great product, comfortable to wear for long hours. Battery life is impressive.', verified: true },
    { id: 3, name: 'Amit Patel', rating: 5, date: '2024-12-15', comment: 'Best headphones I have ever used. Highly recommended!', verified: true },
];

const relatedProducts = [
    { id: 2, name: 'Bluetooth Speaker', slug: 'bluetooth-speaker', price: 3499, sale_price: 2499, image: 'https://placehold.co/400x400/667eea/ffffff?text=Speaker', rating: 4.3 },
    { id: 3, name: 'Smart Fitness Watch', slug: 'smart-fitness-watch', price: 8999, sale_price: 5999, image: 'https://placehold.co/400x400/764ba2/ffffff?text=Watch', rating: 4.6 },
    { id: 4, name: 'Wireless Earbuds', slug: 'wireless-earbuds', price: 2999, sale_price: 1999, image: 'https://placehold.co/400x400/f093fb/ffffff?text=Earbuds', rating: 4.4 },
    { id: 5, name: 'Power Bank 20000mAh', slug: 'power-bank', price: 2499, sale_price: 1799, image: 'https://placehold.co/400x400/4facfe/ffffff?text=Power+Bank', rating: 4.7 },
];

export default function ProductDetailPage() {
    const router = useRouter();
    const { addItem } = useCart();
    const [selectedImage, setSelectedImage] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const [activeTab, setActiveTab] = useState<'description' | 'specifications' | 'reviews'>('description');
    const { addToWishlist, removeFromWishlist, isWishlisted } = useCustomerAuth();
    const [addedToCart, setAddedToCart] = useState(false);

    // Check if product is wishlist
    const wishlisted = isWishlisted(productData.id);

    const toggleWishlist = () => {
        if (wishlisted) {
            removeFromWishlist(productData.id);
        } else {
            addToWishlist(productData.id);
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
        <div className="min-h-screen bg-gray-50">
            {/* Breadcrumb */}
            <div className="bg-white border-b border-gray-100">
                <div className="container mx-auto px-4 py-4">
                    <nav className="flex items-center gap-2 text-sm text-gray-500">
                        <Link href="/" className="hover:text-primary-600">Home</Link>
                        <ChevronRight size={16} />
                        <Link href="/products" className="hover:text-primary-600">Products</Link>
                        <ChevronRight size={16} />
                        <Link href={`/products?category=${productData.category.slug}`} className="hover:text-primary-600">{productData.category.name}</Link>
                        <ChevronRight size={16} />
                        <span className="text-gray-900 font-medium">{productData.name}</span>
                    </nav>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                {/* Product Main Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                    {/* Image Gallery */}
                    <div className="space-y-4">
                        {/* Main Image */}
                        <div className="relative aspect-square bg-white rounded-3xl overflow-hidden shadow-lg group">
                            <img
                                src={productData.images[selectedImage]}
                                alt={productData.name}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                            {productData.discount_percent > 0 && (
                                <div className="absolute top-4 left-4 bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-2 rounded-full font-bold text-lg shadow-lg">
                                    {productData.discount_percent}% OFF
                                </div>
                            )}
                            <button
                                onClick={toggleWishlist}
                                className={`absolute top-4 right-4 w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all ${wishlisted ? 'bg-red-500 text-white' : 'bg-white text-gray-600 hover:bg-red-50'}`}
                            >
                                <Heart size={20} className={wishlisted ? 'fill-current' : ''} />
                            </button>
                        </div>

                        {/* Thumbnail Gallery */}
                        <div className="grid grid-cols-4 gap-3">
                            {productData.images.map((image, index) => (
                                <button
                                    key={index}
                                    onClick={() => setSelectedImage(index)}
                                    className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${selectedImage === index ? 'border-primary-500 shadow-lg scale-105' : 'border-gray-200 hover:border-primary-300'}`}
                                >
                                    <img src={image} alt={`View ${index + 1}`} className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Product Info */}
                    <div className="space-y-6">
                        {/* Title & Rating */}
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-semibold">
                                    {productData.category.name}
                                </span>
                                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold flex items-center gap-1">
                                    <Check size={14} /> In Stock ({productData.stock})
                                </span>
                            </div>
                            <h1 className="font-display text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                                {productData.name}
                            </h1>
                            <div className="flex items-center gap-4 flex-wrap">
                                <div className="flex items-center gap-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Star
                                            key={star}
                                            size={18}
                                            className={star <= Math.floor(productData.rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}
                                        />
                                    ))}
                                    <span className="ml-2 text-gray-700 font-semibold">{productData.rating}</span>
                                </div>
                                <span className="text-gray-500">|</span>
                                <span className="text-gray-600">{productData.reviewCount} Reviews</span>
                                <span className="text-gray-500">|</span>
                                <span className="text-gray-600">{productData.soldCount} Sold</span>
                            </div>
                        </div>

                        {/* Price */}
                        <div className="bg-gradient-to-r from-primary-50 to-accent-50 rounded-2xl p-6">
                            <div className="flex items-baseline gap-3 mb-2">
                                <span className="text-4xl font-bold text-gray-900">₹{productData.current_price.toLocaleString()}</span>
                                {productData.sale_price && (
                                    <>
                                        <span className="text-2xl text-gray-400 line-through">₹{productData.price.toLocaleString()}</span>
                                        <span className="px-3 py-1 bg-green-500 text-white rounded-full text-sm font-bold">
                                            Save ₹{(productData.price - productData.current_price).toLocaleString()}
                                        </span>
                                    </>
                                )}
                            </div>
                            <p className="text-sm text-gray-600">Inclusive of all taxes</p>
                        </div>

                        {/* Shop Info */}
                        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                        {productData.shop.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                            {productData.shop.name}
                                            <Award size={16} className="text-amber-500" />
                                        </h3>
                                        <div className="flex items-center gap-3 text-sm text-gray-600">
                                            <span className="flex items-center gap-1">
                                                <Star size={14} className="fill-amber-400 text-amber-400" />
                                                {productData.shop.rating}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <MapPin size={14} />
                                                {productData.shop.location}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <Link href={`/shops/${productData.shop.id}`} className="text-primary-600 font-medium hover:underline text-sm">
                                    Visit Shop
                                </Link>
                            </div>
                        </div>

                        {/* Quantity & Actions */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <span className="text-gray-700 font-medium">Quantity:</span>
                                <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden">
                                    <button
                                        onClick={decrementQuantity}
                                        className="w-12 h-12 flex items-center justify-center hover:bg-gray-100 transition-colors"
                                    >
                                        <Minus size={18} />
                                    </button>
                                    <span className="w-16 h-12 flex items-center justify-center font-bold text-lg border-x-2 border-gray-200">
                                        {quantity}
                                    </span>
                                    <button
                                        onClick={incrementQuantity}
                                        className="w-12 h-12 flex items-center justify-center hover:bg-gray-100 transition-colors"
                                    >
                                        <Plus size={18} />
                                    </button>
                                </div>
                                <span className="text-sm text-gray-500">({productData.stock} available)</span>
                            </div>


                            <div className="flex gap-3">
                                <button
                                    onClick={handleAddToCart}
                                    className="flex-1 btn-primary py-4 text-lg font-bold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-shadow"
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
                                <button className="w-14 h-14 border-2 border-gray-200 rounded-xl flex items-center justify-center hover:bg-gray-50 transition-colors">
                                    <Share2 size={20} />
                                </button>
                            </div>

                            <button
                                onClick={handleBuyNow}
                                className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold text-lg hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg"
                            >
                                Buy Now
                            </button>
                        </div>

                        {/* Features */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl">
                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <Truck className="text-blue-600" size={20} />
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900 text-sm">Free Delivery</p>
                                    <p className="text-xs text-gray-600">On orders above ₹500</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl">
                                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                    <Shield className="text-green-600" size={20} />
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900 text-sm">Secure Payment</p>
                                    <p className="text-xs text-gray-600">100% protected</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-xl">
                                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                    <RotateCcw className="text-purple-600" size={20} />
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900 text-sm">7 Days Return</p>
                                    <p className="text-xs text-gray-600">Easy returns</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-xl">
                                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                                    <Award className="text-amber-600" size={20} />
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900 text-sm">Quality Assured</p>
                                    <p className="text-xs text-gray-600">Verified seller</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs Section */}
                <div className="bg-white rounded-3xl shadow-sm overflow-hidden mb-12">
                    {/* Tab Headers */}
                    <div className="border-b border-gray-200">
                        <div className="flex">
                            <button
                                onClick={() => setActiveTab('description')}
                                className={`flex-1 py-4 px-6 font-semibold transition-colors ${activeTab === 'description' ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50' : 'text-gray-600 hover:text-gray-900'}`}
                            >
                                Description
                            </button>
                            <button
                                onClick={() => setActiveTab('specifications')}
                                className={`flex-1 py-4 px-6 font-semibold transition-colors ${activeTab === 'specifications' ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50' : 'text-gray-600 hover:text-gray-900'}`}
                            >
                                Specifications
                            </button>
                            <button
                                onClick={() => setActiveTab('reviews')}
                                className={`flex-1 py-4 px-6 font-semibold transition-colors ${activeTab === 'reviews' ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50' : 'text-gray-600 hover:text-gray-900'}`}
                            >
                                Reviews ({productData.reviewCount})
                            </button>
                        </div>
                    </div>

                    {/* Tab Content */}
                    <div className="p-8">
                        {activeTab === 'description' && (
                            <div className="space-y-6 animate-fade-in">
                                <p className="text-gray-700 text-lg leading-relaxed">{productData.description}</p>
                                <div>
                                    <h3 className="font-bold text-xl text-gray-900 mb-4">Key Features</h3>
                                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {productData.features.map((feature, index) => (
                                            <li key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                                <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0">
                                                    <Check size={14} className="text-white" />
                                                </div>
                                                <span className="text-gray-700">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        )}

                        {activeTab === 'specifications' && (
                            <div className="animate-fade-in">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {Object.entries(productData.specifications).map(([key, value]) => (
                                        <div key={key} className="flex items-center p-4 bg-gray-50 rounded-xl">
                                            <span className="font-semibold text-gray-900 w-1/2">{key}:</span>
                                            <span className="text-gray-700 w-1/2">{value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'reviews' && (
                            <div className="space-y-6 animate-fade-in">
                                {/* Review Summary */}
                                <div className="bg-gradient-to-r from-primary-50 to-accent-50 rounded-2xl p-6">
                                    <div className="flex items-center gap-8">
                                        <div className="text-center">
                                            <div className="text-5xl font-bold text-gray-900 mb-2">{productData.rating}</div>
                                            <div className="flex items-center gap-1 mb-1">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <Star key={star} size={20} className={star <= Math.floor(productData.rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'} />
                                                ))}
                                            </div>
                                            <p className="text-sm text-gray-600">{productData.reviewCount} reviews</p>
                                        </div>
                                        <div className="flex-1">
                                            {[5, 4, 3, 2, 1].map((rating) => (
                                                <div key={rating} className="flex items-center gap-3 mb-2">
                                                    <span className="text-sm text-gray-600 w-8">{rating} ★</span>
                                                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-amber-400 rounded-full"
                                                            style={{ width: `${rating === 5 ? 70 : rating === 4 ? 20 : rating === 3 ? 5 : rating === 2 ? 3 : 2}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-sm text-gray-600 w-12">{rating === 5 ? 70 : rating === 4 ? 20 : rating === 3 ? 5 : rating === 2 ? 3 : 2}%</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Individual Reviews */}
                                <div className="space-y-4">
                                    {reviews.map((review) => (
                                        <div key={review.id} className="p-6 bg-gray-50 rounded-2xl">
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center text-white font-bold">
                                                        {review.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="font-semibold text-gray-900">{review.name}</h4>
                                                            {review.verified && (
                                                                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium flex items-center gap-1">
                                                                    <Check size={12} /> Verified
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-gray-500">{review.date}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <Star key={star} size={16} className={star <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'} />
                                                    ))}
                                                </div>
                                            </div>
                                            <p className="text-gray-700 leading-relaxed">{review.comment}</p>
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
                        <h2 className="font-display text-2xl font-bold text-gray-900">You May Also Like</h2>
                        <Link href="/products" className="text-primary-600 font-medium hover:underline flex items-center gap-1">
                            View All <ChevronRight size={18} />
                        </Link>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {relatedProducts.map((product) => (
                            <Link key={product.id} href={`/products/${product.slug}`} className="group">
                                <div className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 group-hover:-translate-y-1">
                                    <div className="aspect-square bg-gray-100 overflow-hidden">
                                        <img
                                            src={product.image}
                                            alt={product.name}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                        />
                                    </div>
                                    <div className="p-4">
                                        <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2 group-hover:text-primary-600 transition-colors">
                                            {product.name}
                                        </h3>
                                        <div className="flex items-center gap-1 mb-2">
                                            <Star size={14} className="fill-amber-400 text-amber-400" />
                                            <span className="text-sm text-gray-600">{product.rating}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg font-bold text-gray-900">₹{product.sale_price.toLocaleString()}</span>
                                            <span className="text-sm text-gray-400 line-through">₹{product.price.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
