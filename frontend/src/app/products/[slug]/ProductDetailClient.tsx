'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    ShoppingCart, Heart, Share2, Star, Truck, Shield, RotateCcw,
    Award, ChevronRight, Plus, Minus, Check, MapPin, Store, CreditCard, Package, ImagePlus, X
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

type ProductDetailClientProps = {
    slug: string;
    initialProduct: Product;
};

export default function ProductDetailClient({ slug, initialProduct }: ProductDetailClientProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const { addItem } = useCart();
    const [productData, setProductData] = useState<Product | null>(initialProduct);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(!initialProduct);
    const [error, setError] = useState<string | null>(null);
    const [selectedImage, setSelectedImage] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const [activeTab, setActiveTab] = useState<'description' | 'specifications' | 'reviews'>('description');
    const { addToWishlist, removeFromWishlist, isWishlisted, customer, isAuthenticated, isLoading: authLoading } = useCustomerAuth();
    const [addedToCart, setAddedToCart] = useState(false);
    const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
    const [reviewSubmitting, setReviewSubmitting] = useState(false);
    const [reviewError, setReviewError] = useState<string | null>(null);
    const [reviewSuccess, setReviewSuccess] = useState(false);
    const [reviewImages, setReviewImages] = useState<File[]>([]);
    const [reviewImagePreviews, setReviewImagePreviews] = useState<{ file: File; url: string }[]>([]);
    const [activeReviewImage, setActiveReviewImage] = useState<{ src: string; alt: string } | null>(null);
    const [relatedProducts, setRelatedProducts] = useState<RelatedProductCard[]>([]);
    const [shareMessage, setShareMessage] = useState<string | null>(null);
    const reviewRedirectPath = `/products/${slug}?review=1#reviews`;
    const loginReviewPath = `/login?redirect=${encodeURIComponent(reviewRedirectPath)}`;
    const reviewIntent = searchParams.get('review') === '1';

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

    // Fetch reviews and related products, and refresh product data on route changes.
    useEffect(() => {
        const loadProductData = async () => {
            try {
                setError(null);
                const product = initialProduct?.slug === slug
                    ? initialProduct
                    : await fetchProduct(slug);

                setProductData(product);
                setSelectedImage(0);
                setRelatedProducts([]);
                setLoading(false);

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
            if (!initialProduct || initialProduct.slug !== slug) {
                setLoading(true);
            }
            loadProductData();
        }
    }, [slug, initialProduct]);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        const hasReviewHash = window.location.hash === '#reviews';
        if (!reviewIntent && !hasReviewHash) {
            return;
        }

        setActiveTab('reviews');

        if (!authLoading && reviewIntent && !isAuthenticated) {
            router.replace(loginReviewPath);
            return;
        }

        window.setTimeout(() => {
            document.getElementById('reviews')?.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
            });
        }, 0);
    }, [authLoading, isAuthenticated, loginReviewPath, reviewIntent, router, slug]);

    useEffect(() => {
        const previews = reviewImages.map((file) => ({
            file,
            url: URL.createObjectURL(file),
        }));
        setReviewImagePreviews(previews);

        return () => {
            previews.forEach((preview) => URL.revokeObjectURL(preview.url));
        };
    }, [reviewImages]);

    useEffect(() => {
        if (!activeReviewImage || typeof window === 'undefined') {
            return;
        }

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setActiveReviewImage(null);
            }
        };

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [activeReviewImage]);

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
            router.push(loginReviewPath);
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
                images: reviewImages,
            });
            setReviewSuccess(true);
            setReviewForm({ rating: 5, comment: '' });
            setReviewImages([]);
            // Refresh reviews after successful submission
            const updatedReviews = await fetchReviews(productData.id);
            setReviews(Array.isArray(updatedReviews) ? updatedReviews : updatedReviews.results || []);
        } catch (err: any) {
            // If backend returns 401, token is expired - redirect to login
            const msg = err.message || '';
            if (msg.includes('Authentication credentials') || msg.includes('401') || msg.includes('not provided')) {
                router.push(loginReviewPath);
                return;
            }
            setReviewError(msg || 'Failed to submit review. You may have already reviewed this product.');
        } finally {
            setReviewSubmitting(false);
        }
    };

    const handleReviewImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(event.target.files || []);
        if (selectedFiles.length === 0) {
            return;
        }

        setReviewError(null);
        let limitReached = false;
        setReviewImages((prev) => {
            const nextFiles = [...prev];
            for (const file of selectedFiles) {
                if (nextFiles.length >= 5) {
                    limitReached = true;
                    break;
                }
                const duplicate = nextFiles.some(
                    (existing) =>
                        existing.name === file.name &&
                        existing.size === file.size &&
                        existing.lastModified === file.lastModified
                );
                if (!duplicate) {
                    nextFiles.push(file);
                }
            }
            return nextFiles;
        });
        if (limitReached) {
            setReviewError('You can upload up to 5 review images.');
        }

        event.target.value = '';
    };

    const removeReviewImage = (indexToRemove: number) => {
        setReviewImages((prev) => prev.filter((_, index) => index !== indexToRemove));
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

    const handleShare = async () => {
        if (!productData || typeof window === 'undefined') {
            return;
        }

        const shareUrl = window.location.href;
        const shareData = {
            title: productData.name,
            text: `Check out ${productData.name} on VorionMart`,
            url: shareUrl,
        };

        const showShareMessage = (message: string) => {
            setShareMessage(message);
            window.setTimeout(() => setShareMessage(null), 2500);
        };

        try {
            if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
                await navigator.share(shareData);
                showShareMessage('Product link shared.');
                return;
            }
        } catch (error) {
            if (error instanceof DOMException && error.name === 'AbortError') {
                return;
            }
        }

        try {
            if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(shareUrl);
                showShareMessage('Product link copied.');
                return;
            }
        } catch (error) {
            console.error('Clipboard share failed:', error);
        }

        try {
            const textArea = document.createElement('textarea');
            textArea.value = shareUrl;
            textArea.setAttribute('readonly', '');
            textArea.style.position = 'absolute';
            textArea.style.left = '-9999px';
            document.body.appendChild(textArea);
            textArea.select();
            const copied = document.execCommand('copy');
            document.body.removeChild(textArea);

            if (copied) {
                showShareMessage('Product link copied.');
                return;
            }
        } catch (error) {
            console.error('Legacy clipboard share failed:', error);
        }

        showShareMessage('Unable to share right now.');
    };

    const displaySalePrice = Number(
        productData.current_price ?? productData.sale_price ?? productData.our_price ?? 0
    );
    const displayMrp = Number(productData.mrp ?? productData.price ?? displaySalePrice);
    const hasMrpDiscount = displayMrp > displaySalePrice;
    const savedAmount = hasMrpDiscount ? displayMrp - displaySalePrice : 0;
    const descriptionLines = String(productData.description || '')
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);
    const descriptionLead = descriptionLines[0] || '';
    const descriptionDetails = descriptionLines
        .slice(1)
        .map((line) => {
            const separatorIndex = line.indexOf(':');
            if (separatorIndex <= 0) {
                return null;
            }

            return {
                label: line.slice(0, separatorIndex).trim(),
                value: line.slice(separatorIndex + 1).trim(),
            };
        })
        .filter(Boolean) as { label: string; value: string }[];
    const descriptionNotes = descriptionLines
        .slice(1)
        .filter((line) => !line.includes(':'));
    const categoryName = productData.category?.name || 'Product';
    const categorySlug = productData.category?.slug || '';

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
                        {categorySlug ? (
                            <Link href={`/products?category=${categorySlug}`} className="hover:text-accent-500 transition-colors">{categoryName}</Link>
                        ) : (
                            <span>{categoryName}</span>
                        )}
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
                                    {categoryName}
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
                            <div className="price-reveal flex flex-wrap items-baseline gap-3 mb-2">
                                {hasMrpDiscount ? (
                                    <>
                                        <span className="price-reveal__mrp text-2xl text-silver-500">
                                            <span className="price-reveal__mrp-value">₹{displayMrp.toLocaleString()}</span>
                                        </span>
                                        <span className="price-reveal__sale text-4xl font-bold text-white">₹{displaySalePrice.toLocaleString()}</span>
                                        <span className="price-reveal__badge px-3 py-1 bg-green-500 text-white rounded-full text-sm font-bold">
                                            Save ₹{savedAmount.toLocaleString()}
                                        </span>
                                    </>
                                ) : (
                                    <span className="text-4xl font-bold text-white">₹{displaySalePrice.toLocaleString()}</span>
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
                                <button
                                    onClick={handleShare}
                                    type="button"
                                    className="w-14 h-14 border-2 border-dark-600 rounded-xl flex items-center justify-center hover:bg-dark-700 transition-colors text-silver-300"
                                    aria-label="Share product"
                                >
                                    <Share2 size={20} />
                                </button>
                            </div>

                            {shareMessage && (
                                <p className="text-sm text-accent-400">{shareMessage}</p>
                            )}

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
                <div id="reviews" className="bg-dark-800 border border-dark-700 rounded-3xl overflow-hidden mb-12 scroll-mt-24" data-aos="fade-up" data-aos-delay="300">
                    {/* Tab Headers */}
                    <div className="border-b border-dark-700">
                        <div className="flex overflow-x-auto custom-scrollbar whitespace-nowrap hidden-scrollbar">
                            <button
                                onClick={() => setActiveTab('description')}
                                className={`min-w-[132px] flex-1 px-4 py-3 text-sm font-semibold transition-colors sm:px-6 sm:py-4 sm:text-base ${activeTab === 'description' ? 'text-accent-500 border-b-2 border-accent-500 bg-dark-700' : 'text-silver-400 hover:text-white'}`}
                            >
                                Description
                            </button>
                            <button
                                onClick={() => setActiveTab('specifications')}
                                className={`min-w-[148px] flex-1 px-4 py-3 text-sm font-semibold transition-colors sm:px-6 sm:py-4 sm:text-base ${activeTab === 'specifications' ? 'text-accent-500 border-b-2 border-accent-500 bg-dark-700' : 'text-silver-400 hover:text-white'}`}
                            >
                                Specifications
                            </button>
                            <button
                                onClick={() => setActiveTab('reviews')}
                                className={`min-w-[124px] flex-1 px-4 py-3 text-sm font-semibold transition-colors sm:px-6 sm:py-4 sm:text-base ${activeTab === 'reviews' ? 'text-accent-500 border-b-2 border-accent-500 bg-dark-700' : 'text-silver-400 hover:text-white'}`}
                            >
                                Reviews ({reviews.length})
                            </button>
                        </div>
                    </div>

                    {/* Tab Content */}
                    <div className="p-4 sm:p-6 lg:p-8">
                        {activeTab === 'description' && (
                            <div className="space-y-5 animate-fade-in sm:space-y-6">
                                {descriptionLead && (
                                    <div className="rounded-2xl border border-dark-600 bg-dark-700/60 p-4 sm:p-5">
                                        <p className="text-base leading-relaxed text-silver-200 sm:text-lg">{descriptionLead}</p>
                                    </div>
                                )}

                                {descriptionDetails.length > 0 && (
                                    <div>
                                        <h3 className="mb-4 text-lg font-bold text-white sm:text-xl">Product Details</h3>
                                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                            {descriptionDetails.map((detail) => (
                                                <div
                                                    key={`${detail.label}-${detail.value}`}
                                                    className="rounded-xl border border-dark-600 bg-dark-700 px-4 py-3"
                                                >
                                                    <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-accent-500/80">
                                                        {detail.label}
                                                    </p>
                                                    <p className="break-words text-sm text-silver-200 sm:text-base">{detail.value}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {descriptionNotes.length > 0 && (
                                    <div className="rounded-2xl border border-dark-600 bg-dark-700/50 p-4 sm:p-5">
                                        <div className="space-y-2">
                                            {descriptionNotes.map((line) => (
                                                <p key={line} className="text-silver-300 leading-relaxed">
                                                    {line}
                                                </p>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {!descriptionLead && descriptionDetails.length === 0 && descriptionNotes.length === 0 && (
                                    <p className="text-silver-400">No description available for this product.</p>
                                )}
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
                                            <div key={key} className="flex flex-col gap-1 px-4 py-3.5 sm:flex-row sm:items-center sm:px-5">
                                                <span className="text-sm font-semibold text-white sm:w-1/3 sm:text-base">{key}</span>
                                                <span className="break-words text-sm text-silver-300 sm:flex-1 sm:text-base">{String(value)}</span>
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
                                            <div>
                                                <div className="flex items-center justify-between gap-3 mb-2">
                                                    <label className="block text-sm font-medium text-silver-300">Review Images</label>
                                                    <span className="text-xs text-silver-500">Up to 5 images</span>
                                                </div>
                                                <label className="flex cursor-pointer items-center justify-center gap-3 rounded-xl border border-dashed border-dark-500 bg-dark-800/80 px-4 py-4 text-silver-300 transition hover:border-accent-500/60 hover:text-white">
                                                    <ImagePlus size={20} className="text-accent-500" />
                                                    <span className="text-sm font-medium">Upload product photos</span>
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        multiple
                                                        onChange={handleReviewImageChange}
                                                        className="hidden"
                                                    />
                                                </label>
                                                {reviewImages.length > 0 && (
                                                    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                                                        {reviewImagePreviews.map(({ file, url }, index) => (
                                                            <div key={`${file.name}-${file.lastModified}`} className="relative overflow-hidden rounded-xl border border-dark-600 bg-dark-800">
                                                                <img
                                                                    src={url}
                                                                    alt={file.name}
                                                                    className="h-28 w-full object-cover"
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeReviewImage(index)}
                                                                    className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-dark-900/80 text-white transition hover:bg-red-500"
                                                                    aria-label={`Remove ${file.name}`}
                                                                >
                                                                    <X size={16} />
                                                                </button>
                                                                <div className="truncate px-3 py-2 text-xs text-silver-400">{file.name}</div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
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
                                            <Link href={loginReviewPath} className="btn-primary inline-flex items-center gap-2">
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
                                                {review.images?.length > 0 && (
                                                    <div className="mt-4 overflow-x-auto pb-2 custom-scrollbar">
                                                        <div className="flex min-w-max gap-4">
                                                            {review.images.map((image, index) => (
                                                                <button
                                                                    key={image.id}
                                                                    type="button"
                                                                    onClick={() => setActiveReviewImage({
                                                                        src: image.image,
                                                                        alt: `Review photo ${index + 1} by ${review.customer_name}`,
                                                                    })}
                                                                    className="group block w-[280px] flex-none overflow-hidden rounded-2xl border border-dark-600 bg-dark-800 transition hover:border-accent-500/60 sm:w-[340px]"
                                                                >
                                                                    <div className="relative aspect-[4/3] overflow-hidden bg-dark-900">
                                                                        <img
                                                                            src={image.image}
                                                                            alt={`Review photo ${index + 1} by ${review.customer_name}`}
                                                                            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                                                                            loading="lazy"
                                                                        />
                                                                    </div>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
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

            {activeReviewImage && (
                <div
                    className="fixed inset-0 z-[120] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
                    onClick={() => setActiveReviewImage(null)}
                >
                    <div
                        className="relative w-full max-w-6xl"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <button
                            type="button"
                            onClick={() => setActiveReviewImage(null)}
                            className="absolute right-3 top-3 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full bg-dark-900/80 text-white transition hover:bg-red-500"
                            aria-label="Close image preview"
                        >
                            <X size={20} />
                        </button>
                        <div className="overflow-hidden rounded-3xl border border-white/10 bg-dark-900 shadow-2xl">
                            <img
                                src={activeReviewImage.src}
                                alt={activeReviewImage.alt}
                                className="max-h-[85vh] w-full object-contain bg-black"
                            />
                        </div>
                    </div>
                </div>
            )}

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

