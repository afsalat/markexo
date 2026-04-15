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
    const reviewIntent = searchParams?.get('review') === '1';

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
        const LIMIT = 15;

        const appendProducts = (items: Product[]) => {
            for (const item of items) {
                if (seen.has(item.slug)) {
                    continue;
                }

                nextRelatedProducts.push(mapRelatedProduct(item));
                seen.add(item.slug);

                if (nextRelatedProducts.length >= LIMIT) {
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

        if (nextRelatedProducts.length < LIMIT) {
            const featuredProducts = normalizeProducts(
                await fetchProducts({ featured: 'true' })
            );
            appendProducts(featuredProducts);
        }

        if (nextRelatedProducts.length < LIMIT) {
            const latestProducts = normalizeProducts(
                await fetchProducts({ sort: 'newest' })
            );
            appendProducts(latestProducts);
        }

        setRelatedProducts(nextRelatedProducts.slice(0, LIMIT));
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
    const fallbackReviewCount = Number(productData?.review_count ?? 0);
    const fetchedReviewCount = reviews.length;
    const displayReviewCount = fetchedReviewCount || fallbackReviewCount;
    const averageRatingValue = fetchedReviewCount > 0
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / fetchedReviewCount
        : Number(productData?.rating ?? 0);
    const formattedDisplayRating = averageRatingValue.toFixed(1);
    const roundedDisplayRating = Math.round(averageRatingValue);

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
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-accent-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-500 font-medium">Loading product...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error || !productData) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center px-4">
                    <ShoppingCart size={64} className="mx-auto text-gray-200 mb-4" />
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Product Not Found</h3>
                    <p className="text-gray-500 mb-6 max-w-md mx-auto">{error || 'The product you are looking for does not exist.'}</p>
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
        <div className="min-h-screen bg-white">
            {/* Breadcrumb */}
            <div className="bg-gray-50 border-b border-gray-100" data-aos="fade-down" data-aos-delay="0">
                <div className="container mx-auto px-4 py-4">
                    <nav className="flex items-center gap-2 text-sm text-gray-500">
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
                        <span className="text-gray-900 font-medium">{productData.name}</span>
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
                                    <div className="relative aspect-square bg-white rounded-3xl overflow-hidden border border-gray-100 group shadow-sm">
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
                                            className={`absolute top-4 right-4 w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all ${wishlisted ? 'bg-red-500 text-white' : 'bg-white/80 backdrop-blur-md text-gray-500 hover:bg-accent-500 hover:text-white'}`}
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
                                                    className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${selectedImage === index ? 'border-accent-500 shadow-sm' : 'border-gray-200 hover:border-accent-500/50'}`}
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
                            <h1 className="font-display text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                                {productData.name}
                            </h1>
                            <div className="flex items-center gap-4 flex-wrap">
                                <div className="flex items-center gap-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Star
                                            key={star}
                                            size={18}
                                            className={star <= roundedDisplayRating ? 'fill-amber-400 text-amber-400' : 'text-dark-500'}
                                        />
                                    ))}
                                    <span className="ml-2 text-gray-900 font-semibold">{formattedDisplayRating}</span>
                                </div>
                                <span className="text-gray-300">|</span>
                                <span className="text-gray-500">{displayReviewCount} Review{displayReviewCount !== 1 ? 's' : ''}</span>
                                <span className="text-gray-300">|</span>
                                <span className="text-gray-500">{getPurchaseSignal()}</span>
                            </div>
                        </div>

                        {/* Price */}
                        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                            <div className="price-reveal flex flex-wrap items-baseline gap-3 mb-2">
                                {hasMrpDiscount ? (
                                    <>
                                        <span className="price-reveal__mrp text-2xl text-gray-400">
                                            <span className="price-reveal__mrp-value">₹{displayMrp.toLocaleString()}</span>
                                        </span>
                                        <span className="price-reveal__sale text-4xl font-bold text-gray-900">₹{displaySalePrice.toLocaleString()}</span>
                                        <span className="price-reveal__badge px-3 py-1 bg-green-500 text-white rounded-full text-sm font-bold">
                                            Save ₹{savedAmount.toLocaleString()}
                                        </span>
                                    </>
                                ) : (
                                    <span className="text-4xl font-bold text-gray-900">₹{displaySalePrice.toLocaleString()}</span>
                                )}
                            </div>
                            <p className="text-sm text-gray-500 font-medium">Inclusive of all taxes</p>
                        </div>

                        {/* COD Trust Badge - Prominent */}
                        <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 flex items-center gap-4">
                            <div className="w-14 h-14 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                                <CreditCard className="text-emerald-600" size={28} />
                            </div>
                            <div>
                                <h3 className="font-bold text-emerald-900 text-lg">Cash on Delivery Available</h3>
                                <p className="text-emerald-700/70 text-sm">Pay when you receive your order. No advance payment needed.</p>
                            </div>
                        </div>

                        {/* Trust & Fulfillment Info */}
                        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-gray-900 border border-gray-100">
                                        <Package size={24} className="text-accent-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 flex items-center gap-2 text-sm sm:text-base">
                                            Fulfilled by VorionMart
                                            <Award size={16} className="text-accent-500" />
                                        </h3>
                                        <div className="flex items-center gap-3 text-sm text-gray-500">
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
                                <span className="text-gray-700 font-medium">Quantity:</span>
                                <div className="flex items-center border-2 border-gray-100 rounded-xl overflow-hidden shadow-sm">
                                    <button
                                        onClick={decrementQuantity}
                                        className="w-12 h-12 flex items-center justify-center hover:bg-gray-100 transition-colors text-gray-600"
                                    >
                                        <Minus size={18} />
                                    </button>
                                    <span className="w-16 h-12 flex items-center justify-center font-bold text-lg border-x-2 border-gray-100 text-gray-900">
                                        {quantity}
                                    </span>
                                    <button
                                        onClick={incrementQuantity}
                                        className="w-12 h-12 flex items-center justify-center hover:bg-gray-100 transition-colors text-gray-600 hover:text-accent-500"
                                    >
                                        <Plus size={18} />
                                    </button>
                                </div>
                                <span className="text-sm text-gray-500">({productData.stock} available)</span>
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
                                    className="w-14 h-14 border-2 border-gray-100 rounded-xl flex items-center justify-center hover:bg-gray-50 transition-all text-gray-600 hover:border-accent-500 hover:text-accent-500 shadow-sm"
                                    aria-label="Share product"
                                >
                                    <Share2 size={20} />
                                </button>
                            </div>

                            {shareMessage && (
                                <p className="text-sm text-accent-600 font-medium">{shareMessage}</p>
                            )}

                            <button
                                onClick={handleBuyNow}
                                className="w-full py-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl font-bold text-lg hover:from-primary-500 hover:to-primary-600 transition-all shadow-lg active:scale-[0.98]"
                            >
                                Buy Now — Pay on Delivery
                            </button>
                        </div>

                        {/* Trust Features Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { icon: Truck, title: 'Free Delivery', detail: 'On orders above ₹500' },
                                { icon: Shield, title: 'Secure Checkout', detail: '100% protected' },
                                { icon: RotateCcw, title: '7 Days Return', detail: 'Easy returns' },
                                { icon: Package, title: 'Quality Assured', detail: 'Verified seller' }
                            ].map((item, idx) => (
                                <div key={idx} className="flex items-center gap-3 p-4 bg-white border border-gray-100 rounded-xl shadow-sm transition-all hover:bg-gray-50/50">
                                    <div className="w-10 h-10 bg-accent-500/10 rounded-lg flex items-center justify-center shrink-0">
                                        <item.icon className="text-accent-500" size={20} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900 text-sm leading-tight">{item.title}</p>
                                        <p className="text-xs text-gray-500 mt-0.5">{item.detail}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Product Detailed Content Sections */}
                <div className="space-y-12 mb-16">
                    {/* Description Section */}
                    <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm" data-aos="fade-up">
                        <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
                            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <Package className="text-accent-500" size={22} />
                                Description
                            </h2>
                        </div>
                        <div className="p-6 sm:p-8 space-y-8">
                            {descriptionLead && (
                                <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-5 sm:p-6">
                                    <p className="text-base leading-relaxed text-gray-700 sm:text-lg">{descriptionLead}</p>
                                </div>
                            )}

                            {descriptionDetails.length > 0 && (
                                <div>
                                    <h3 className="mb-4 text-lg font-bold text-gray-900 sm:text-xl">Product Details</h3>
                                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                        {descriptionDetails.map((detail) => (
                                            <div
                                                key={`${detail.label}-${detail.value}`}
                                                className="rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm"
                                            >
                                                <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-accent-500/80">
                                                    {detail.label}
                                                </p>
                                                <p className="break-words text-sm text-gray-700 sm:text-base">{detail.value}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {descriptionNotes.length > 0 && (
                                <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-5 sm:p-6">
                                    <div className="space-y-2">
                                        {descriptionNotes.map((line) => (
                                            <p key={line} className="text-gray-600 leading-relaxed">
                                                {line}
                                            </p>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {productData.features && productData.features.length > 0 && (
                                <div>
                                    <h3 className="font-bold text-xl text-gray-900 mb-4">Key Features</h3>
                                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {productData.features.map((feature: string, index: number) => (
                                            <li key={index} className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl shadow-sm">
                                                <div className="w-6 h-6 bg-accent-500 rounded-full flex items-center justify-center flex-shrink-0">
                                                    <Check size={14} className="text-white" />
                                                </div>
                                                <span className="text-gray-600">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Specifications Section */}
                    <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm" data-aos="fade-up">
                        <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
                            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <Award className="text-accent-500" size={22} />
                                Specifications
                            </h2>
                        </div>
                        <div className="p-6 sm:p-8">
                            {Object.keys(productData.specifications || {}).length > 0 ? (
                                <div className="bg-white border border-gray-100 rounded-xl overflow-hidden divide-y divide-gray-100 shadow-sm">
                                    {Object.entries(productData.specifications || {}).map(([key, value]) => (
                                        <div key={key} className="flex flex-col gap-1 px-4 py-3.5 sm:flex-row sm:items-center sm:px-5">
                                            <span className="text-sm font-semibold text-gray-900 sm:w-1/3 sm:text-base">{key}</span>
                                            <span className="break-words text-sm text-gray-600 sm:flex-1 sm:text-base">{String(value)}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 bg-gray-50 rounded-xl border border-gray-100 shadow-sm">
                                    <p className="text-gray-400">No specifications available for this product.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Reviews Section */}
                    <div id="reviews" className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm scroll-mt-24" data-aos="fade-up">
                        <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
                            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <Star className="text-amber-400 fill-amber-400" size={22} />
                                Customer Reviews ({displayReviewCount})
                            </h2>
                        </div>
                        <div className="p-6 sm:p-8 space-y-10">
                            {/* Rating Summary */}
                            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6 shadow-sm">
                                <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
                                    <div className="text-center flex-shrink-0">
                                        <div className="text-5xl font-bold text-gray-900 mb-2">
                                            {formattedDisplayRating}
                                        </div>
                                        <div className="flex items-center gap-1 mb-1 justify-center">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <Star key={star} size={20} className={star <= roundedDisplayRating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'} />
                                            ))}
                                        </div>
                                        <p className="text-sm text-gray-500">{displayReviewCount} review{displayReviewCount !== 1 ? 's' : ''}</p>
                                    </div>
                                    <div className="flex-1 w-full">
                                        {[5, 4, 3, 2, 1].map((star) => {
                                            const pct = getRatingPercent(star);
                                            return (
                                                <div key={star} className="flex items-center gap-3 mb-2">
                                                    <span className="text-sm text-gray-400 w-8">{star} ★</span>
                                                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-amber-400 rounded-full transition-all duration-500"
                                                            style={{ width: `${pct}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-sm text-gray-500 w-10 text-right">{pct}%</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Write a Review */}
                            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6 shadow-sm">
                                <h3 className="font-bold text-lg text-gray-900 mb-4">Write a Review</h3>
                                {isAuthenticated ? (
                                    <form onSubmit={handleReviewSubmit} className="space-y-4">
                                        {/* Star Picker */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Your Rating</label>
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
                                                            className={star <= reviewForm.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300 hover:text-amber-300'}
                                                        />
                                                    </button>
                                                ))}
                                                <span className="ml-2 text-sm text-gray-500">
                                                    {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][reviewForm.rating]}
                                                </span>
                                            </div>
                                        </div>
                                        {/* Comment */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Your Review</label>
                                            <textarea
                                                value={reviewForm.comment}
                                                onChange={(e) => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                                                required
                                                rows={4}
                                                placeholder="Share your experience with this product..."
                                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent resize-none transition shadow-sm"
                                            />
                                        </div>
                                        <div>
                                            <div className="flex items-center justify-between gap-3 mb-2">
                                                <label className="block text-sm font-medium text-gray-700">Review Images</label>
                                                <span className="text-xs text-gray-500">Up to 5 images</span>
                                            </div>
                                            <label className="flex cursor-pointer items-center justify-center gap-3 rounded-xl border border-dashed border-gray-300 bg-white px-4 py-4 text-gray-500 transition hover:border-accent-500/60 hover:text-gray-900">
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
                                                        <div key={`${file.name}-${file.lastModified}`} className="relative overflow-hidden rounded-xl border border-gray-100 bg-gray-50 shadow-sm">
                                                            <img
                                                                src={url}
                                                                alt={file.name}
                                                                className="h-28 w-full object-cover"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => removeReviewImage(index)}
                                                                className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-gray-900/80 text-white transition hover:bg-red-500"
                                                                aria-label={`Remove ${file.name}`}
                                                            >
                                                                <X size={16} />
                                                            </button>
                                                            <div className="truncate px-3 py-2 text-xs text-gray-500">{file.name}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        {reviewError && (
                                            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{reviewError}</div>
                                        )}
                                        {reviewSuccess && (
                                            <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-green-600 text-sm flex items-center gap-2">
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
                                        <p className="text-gray-500 mb-4">Please sign in to write a review.</p>
                                        <Link href={loginReviewPath} className="btn-primary inline-flex items-center gap-2">
                                            Sign In to Review
                                        </Link>
                                    </div>
                                )}
                            </div>

                            {/* Individual Reviews */}
                            {reviews.length === 0 ? (
                                <div className="text-center py-12 bg-gray-50 border border-gray-100 rounded-2xl">
                                    <Star size={40} className="mx-auto text-gray-200 mb-3" />
                                    <p className="text-gray-500 font-medium">No reviews yet. Be the first to review this product!</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {reviews.map((review) => (
                                        <div key={review.id} className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm hover:border-gray-200 transition-colors">
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 bg-gradient-to-br from-accent-500 to-primary-600 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-sm">
                                                        {review.customer_name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <h4 className="font-bold text-gray-900">{review.customer_name}</h4>
                                                            {review.verified && (
                                                                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-xs rounded-lg font-bold flex items-center gap-1 border border-emerald-100">
                                                                    <Check size={12} strokeWidth={3} /> Verified Purchase
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-gray-400">{review.created_at_formatted}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-0.5 flex-shrink-0">
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <Star key={star} size={16} className={star <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'} />
                                                    ))}
                                                </div>
                                            </div>
                                            <p className="text-gray-700 leading-relaxed font-medium">{review.comment}</p>
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
                                                                className="group block w-[280px] flex-none overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:border-accent-500/60 sm:w-[340px]"
                                                            >
                                                                <div className="relative aspect-[4/3] overflow-hidden bg-gray-50">
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
                    </div>
                </div>

                {/* Related Products */}
                {relatedProducts.length > 0 && (
                <div data-aos="fade-up" data-aos-delay="400" className="mt-16">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="font-display text-2xl font-bold text-gray-900 px-1 border-l-4 border-accent-500 pl-4">You May Also Like</h2>
                        <Link href="/products" className="text-accent-600 font-bold hover:text-accent-700 flex items-center gap-1 transition-colors">
                            View All <ChevronRight size={18} />
                        </Link>
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
                        {relatedProducts.map((product) => (
                            <Link key={product.id} href={`/products/${product.slug}`} className="group">
                                <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                                    <div className="aspect-square bg-gray-50 overflow-hidden relative">
                                        <img
                                            src={product.image}
                                            alt={product.name}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                        />
                                        <div className="absolute top-3 right-3">
                                            <div className="bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-sm text-gray-400 group-hover:text-accent-500 transition-colors">
                                                <Star size={14} className="fill-current" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-5">
                                        <h3 className="font-bold text-gray-900 line-clamp-2 mb-2 group-hover:text-accent-600 transition-colors h-12">
                                            {product.name}
                                        </h3>
                                        <div className="flex items-center gap-1 mb-3">
                                            <div className="flex items-center text-amber-400">
                                                <Star size={14} className="fill-current" />
                                            </div>
                                            <span className="text-xs font-bold text-gray-500">{product.rating}</span>
                                        </div>
                                        <div className="flex items-center justify-between gap-2 mt-auto">
                                            <div className="flex flex-col">
                                                <span className="text-lg font-bold text-gray-900 border-b-2 border-accent-500/20">₹{product.sale_price.toLocaleString()}</span>
                                                <span className="text-xs text-gray-400 line-through">₹{product.price.toLocaleString()}</span>
                                            </div>
                                            <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 group-hover:bg-accent-500 group-hover:text-white transition-all">
                                                <ShoppingCart size={18} />
                                            </div>
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
                    className="fixed inset-0 z-[120] flex items-center justify-center bg-gray-900/95 p-4 backdrop-blur-md"
                    onClick={() => setActiveReviewImage(null)}
                >
                    <div
                        className="relative w-full max-w-6xl animate-zoom-in"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <button
                            type="button"
                            onClick={() => setActiveReviewImage(null)}
                            className="absolute -top-12 right-0 sm:-right-12 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-all"
                            aria-label="Close image preview"
                        >
                            <X size={24} />
                        </button>
                        <div className="overflow-hidden rounded-3xl border border-white/10 shadow-2xl">
                            <img
                                src={activeReviewImage.src}
                                alt={activeReviewImage.alt}
                                className="max-h-[80vh] w-full object-contain mx-auto"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Sticky Mobile CTA */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 p-4 bg-white/80 backdrop-blur-lg border-t border-gray-100 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
                <div className="flex gap-3 max-w-lg mx-auto">
                    <button
                        onClick={handleAddToCart}
                        className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-900 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm"
                    >
                        <ShoppingCart size={20} />
                        Add to Cart
                    </button>
                    <button
                        onClick={handleBuyNow}
                        className="flex-1 bg-accent-600 hover:bg-accent-500 text-white py-4 rounded-2xl font-bold transition-all active:scale-95 shadow-lg shadow-accent-600/20"
                    >
                        Buy Now
                    </button>
                </div>
            </div>
        </div>
    );
}
