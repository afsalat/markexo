'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Calendar, Clock, User, ShoppingCart, Heart, Star, CheckCircle, Share2 } from 'lucide-react';
import { BlogPost, Product } from '@/lib/api';
import { useCart } from '@/lib/cart';
import { useCustomerAuth } from '@/context/CustomerAuthContext';

interface BlogPostClientProps {
    blogPost: BlogPost;
    linkedProducts: Product[];
}

export default function BlogPostClient({ blogPost, linkedProducts }: BlogPostClientProps) {
    const { addItem } = useCart();
    const { addToWishlist, isWishlisted, isAuthenticated } = useCustomerAuth();
    const [shareMessage, setShareMessage] = useState<string | null>(null);

    const formatDate = (dateString: string) => {
        if (!dateString) return 'Pending Publication';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Draft';
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const calculateReadTime = (content: string) => {
        if (!content) return 1;
        const wordsPerMinute = 200;
        const words = content.trim().split(/\s+/).length;
        return Math.max(1, Math.ceil(words / wordsPerMinute));
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: blogPost.title,
                    text: blogPost.excerpt || blogPost.content.slice(0, 150),
                    url: window.location.href,
                });
            } catch (error) {
                // Fallback to copying link
                copyToClipboard(window.location.href);
            }
        } else {
            copyToClipboard(window.location.href);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            setShareMessage('Link copied to clipboard!');
            setTimeout(() => setShareMessage(null), 3000);
        });
    };

    const handleAddToCart = (product: Product) => {
        if (!isAuthenticated) {
            window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
            return;
        }
        addItem(product, 1);
    };

    const renderContent = (content: string) => {
        if (!content) return '';
        
        // Replace product slugs with actual product links
        let processedContent = content;
        
        if (blogPost.products && Array.isArray(blogPost.products)) {
            blogPost.products.forEach((productSlug: string) => {
                const product = linkedProducts?.find(p => p.slug === productSlug);
                if (product) {
                    const productLink = `[👉 Buy Best ${product.name}](/products/${product.slug})`;
                    const escapedSlug = productSlug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    processedContent = processedContent.replace(
                        new RegExp(escapedSlug, 'g'),
                        productLink
                    );
                }
            });
        }
        
        // If the content doesn't contain HTML tags, treat it as markdown/plain text
        if (!/<[a-z][\s\S]*>/i.test(processedContent)) {
            // Convert markdown-style links to HTML
            processedContent = processedContent.replace(
                /\[([^\]]+)\]\(([^)]+)\)/g,
                '<a href="$2" class="text-accent-500 hover:text-accent-600 font-bold underline">$1</a>'
            );

            // Convert newlines to paragraphs
            processedContent = processedContent.split('\n').map((line) => {
                const trimmed = line.trim();
                if (!trimmed) return '';
                // Simple header detection
                if (trimmed.length < 100 && !trimmed.endsWith('.') && !trimmed.endsWith('!') && !trimmed.endsWith('?')) {
                    return `<h2 class="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">${trimmed}</h2>`;
                }
                return `<p class="mb-6 text-gray-700 dark:text-silver-300 leading-relaxed text-lg">${trimmed}</p>`;
            }).join('');
        }
        
        return processedContent;
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
            {/* Hero Section */}
            <section className="relative py-20 md:py-32 overflow-hidden bg-gradient-to-br from-accent-500/10 via-white to-primary-500/5 dark:from-accent-500/5 dark:via-dark-900 dark:to-primary-500/10">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto">
                        {/* Breadcrumb */}
                        <nav className="flex items-center gap-2 text-sm text-gray-500 dark:text-silver-500 mb-6">
                            <Link href="/" className="hover:text-accent-500 transition-colors">Home</Link>
                            <span>/</span>
                            <Link href="/blog" className="hover:text-accent-500 transition-colors">Blog</Link>
                            <span>/</span>
                            <span className="text-gray-900 dark:text-white">{blogPost.title}</span>
                        </nav>

                        {/* Featured Image */}
                        {blogPost.featured_image && (
                            <div className="relative aspect-[16/9] rounded-3xl overflow-hidden mb-8 shadow-2xl">
                                <img
                                    src={blogPost.featured_image}
                                    alt={blogPost.title}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                                
                                {/* Category Badge */}
                                {blogPost.category && (
                                    <div className="absolute top-6 left-6 bg-accent-500 text-white px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider">
                                        {blogPost.category}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Title and Meta */}
                        <div className="text-center mb-8">
                            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
                                {blogPost.title}
                            </h1>
                            
                            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500 dark:text-silver-500">
                                <div className="flex items-center gap-2">
                                    <Calendar size={16} />
                                    <span>{formatDate(blogPost.published_at)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock size={16} />
                                    <span>{blogPost.read_time || calculateReadTime(blogPost.content)} min read</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <User size={16} />
                                    <span>{blogPost.author}</span>
                                </div>
                            </div>
                        </div>

                        {/* Tags */}
                        {blogPost.tags && blogPost.tags.length > 0 && (
                            <div className="flex flex-wrap justify-center gap-2 mb-8">
                                {blogPost.tags.map(tag => (
                                    <span
                                        key={tag}
                                        className="bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-silver-400 px-3 py-1 rounded-full text-xs font-medium"
                                    >
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Share Button */}
                        <div className="flex justify-center mb-8">
                            <button
                                onClick={handleShare}
                                className="flex items-center gap-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 px-6 py-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-dark-700 transition-all shadow-lg"
                            >
                                <Share2 size={18} />
                                <span className="font-medium">Share Article</span>
                            </button>
                        </div>

                        {shareMessage && (
                            <div className="fixed top-4 right-4 bg-accent-500 text-white px-4 py-2 rounded-xl shadow-lg z-50 animate-slide-in">
                                {shareMessage}
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Content */}
            <section className="py-16 bg-white dark:bg-dark-800/50">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto">
                        <style jsx global>{`
                            .blog-content h2 {
                                font-size: 1.875rem;
                                font-weight: 700;
                                color: #111827;
                                margin-top: 2.5rem;
                                margin-bottom: 1.25rem;
                                line-height: 1.25;
                            }
                            .blog-content h3 {
                                font-size: 1.5rem;
                                font-weight: 600;
                                color: #111827;
                                margin-top: 2rem;
                                margin-bottom: 1rem;
                                line-height: 1.25;
                            }
                            .blog-content p {
                                font-size: 1.125rem;
                                line-height: 1.8;
                                color: #374151;
                                margin-bottom: 1.5rem;
                            }
                            .blog-content ul, .blog-content ol {
                                margin-bottom: 1.5rem;
                                padding-left: 1.5rem;
                            }
                            .blog-content li {
                                font-size: 1.125rem;
                                line-height: 1.8;
                                color: #374151;
                                margin-bottom: 0.5rem;
                                list-style-type: disc;
                            }
                            .dark .blog-content h2, .dark .blog-content h3 {
                                color: #ffffff;
                            }
                            .dark .blog-content p, .dark .blog-content li {
                                color: #9ca3af;
                            }
                        `}</style>
                        <article className="prose prose-lg dark:prose-invert max-w-none">
                            <div
                                dangerouslySetInnerHTML={{
                                    __html: renderContent(blogPost.content)
                                }}
                                className="blog-content"
                            />
                        </article>
                    </div>
                </div>
            </section>

            {/* Linked Products Section */}
            {linkedProducts.length > 0 && (
                <section className="py-16 bg-white dark:bg-dark-800">
                    <div className="container mx-auto px-4">
                        <div className="max-w-4xl">
                            <div className="text-center mb-12">
                                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                                    Featured Products
                                </h2>
                                <p className="text-xl text-gray-600 dark:text-silver-400">
                                    Get the products mentioned in this article
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {linkedProducts.map((product, index) => (
                                    <div
                                        key={product.id}
                                        className="bg-gray-50 dark:bg-dark-900 rounded-3xl overflow-hidden border border-gray-200 dark:border-dark-700 hover:border-accent-500/30 transition-all duration-500 group"
                                    >
                                        {/* Product Image */}
                                        <div className="aspect-square bg-white dark:bg-dark-800 p-4">
                                            {product.image ? (
                                                <img
                                                    src={product.image}
                                                    alt={product.name}
                                                    className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-105"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-gray-100 dark:bg-dark-700 rounded-xl flex items-center justify-center">
                                                    <span className="text-4xl">📦</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Product Info */}
                                        <div className="p-6">
                                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-accent-500 transition-colors">
                                                {product.name}
                                            </h3>
                                            
                                            <div className="flex items-center gap-2 mb-4">
                                                <span className="text-2xl font-bold text-accent-500">₹{product.price}</span>
                                                {product.discount_percent > 0 && (
                                                    <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                                                        {product.discount_percent}% OFF
                                                    </span>
                                                )}
                                            </div>

                                            {/* Rating */}
                                            <div className="flex items-center gap-2 mb-4">
                                                <div className="flex items-center">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star
                                                            key={i}
                                                            size={16}
                                                            className={i < Math.floor(product.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}
                                                        />
                                                    ))}
                                                </div>
                                                <span className="text-sm text-gray-500 dark:text-silver-500">
                                                    ({product.review_count || 0} reviews)
                                                </span>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex gap-3">
                                                <Link
                                                    href={`/products/${product.slug}`}
                                                    className="flex-1 flex items-center justify-center gap-2 bg-accent-500 text-white px-4 py-3 rounded-xl hover:bg-accent-600 transition-colors font-bold"
                                                >
                                                    <ShoppingCart size={18} />
                                                    View Product
                                                </Link>
                                                
                                                {isAuthenticated && (
                                                    <button
                                                        onClick={() => addToWishlist(product)}
                                                        className={`p-3 rounded-xl border transition-colors ${
                                                            isWishlisted(product.id)
                                                                ? 'bg-accent-500 text-white border-accent-500'
                                                                : 'bg-white dark:bg-dark-800 border-gray-200 dark:border-dark-700 hover:border-accent-500 text-gray-600 dark:text-silver-400'
                                                        }`}
                                                    >
                                                        <Heart size={18} className={isWishlisted(product.id) ? 'fill-current' : ''} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* CTA Section */}
                            <div className="text-center mt-16 p-8 bg-gradient-to-r from-accent-500/10 to-primary-500/10 rounded-3xl border border-accent-500/20">
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                                    Ready to Shop?
                                </h3>
                                <p className="text-gray-600 dark:text-silver-400 mb-6 max-w-2xl mx-auto">
                                    Get these premium products with cash on delivery across India
                                </p>
                                <Link
                                    href="/products"
                                    className="inline-flex items-center gap-2 bg-accent-500 text-white px-8 py-4 rounded-xl hover:bg-accent-600 transition-colors font-bold text-lg"
                                >
                                    Browse All Products
                                    <ArrowRight size={20} />
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
}
