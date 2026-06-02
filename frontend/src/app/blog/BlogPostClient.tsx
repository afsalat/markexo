'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, Clock, User, ArrowLeft, ArrowRight, Share2 } from 'lucide-react';
import { StaticBlogPost, getRelatedStaticBlogPosts, getPreviousAndNextPosts } from '@/lib/staticBlog';
import RelatedProductCard from '@/components/blog/RelatedProductCard';
import BlogStructuredData from '@/components/blog/BlogStructuredData';

interface BlogPostClientProps {
    blogPost: StaticBlogPost;
}

export default function BlogPostClient({ blogPost }: BlogPostClientProps) {
    const [shareMessage, setShareMessage] = useState<string | null>(null);

    const relatedPosts = getRelatedStaticBlogPosts(blogPost.slug, blogPost.category);
    const { previous, next } = getPreviousAndNextPosts(blogPost.slug);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const handleShare = async () => {
        const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
        if (navigator.share) {
            try {
                await navigator.share({
                    title: blogPost.title,
                    text: blogPost.excerpt,
                    url: shareUrl,
                });
            } catch (error) {
                copyToClipboard(shareUrl);
            }
        } else {
            copyToClipboard(shareUrl);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            setShareMessage('Article link copied to clipboard!');
            setTimeout(() => setShareMessage(null), 3000);
        });
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
            {/* Structured Schema Injected Dynamically */}
            <BlogStructuredData post={blogPost} />

            {/* Toast Notification for share action */}
            {shareMessage && (
                <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-white shadow-xl animate-fade-in-up">
                    {shareMessage}
                </div>
            )}

            {/* Back to Blog Button */}
            <div className="container mx-auto px-4 pt-10">
                <Link
                    href="/blog"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 transition-colors hover:text-emerald-500 dark:text-emerald-400"
                >
                    <ArrowLeft size={16} />
                    Back to all guides
                </Link>
            </div>

            {/* Hero Header Section */}
            <header className="py-12 md:py-16">
                <div className="container mx-auto px-4">
                    <div className="mx-auto max-w-4xl">
                        {/* Tags list */}
                        <div className="flex flex-wrap gap-2">
                            {blogPost.tags?.map(tag => (
                                <span
                                    key={tag}
                                    className="rounded-lg bg-emerald-500/10 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400"
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>

                        {/* Title */}
                        <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white md:text-5xl lg:text-5xl leading-tight">
                            {blogPost.title}
                        </h1>

                        {/* Meta values */}
                        <div className="mt-6 flex flex-wrap items-center gap-6 border-y border-gray-150 py-4 text-sm text-gray-600 dark:border-gray-800 dark:text-gray-400">
                            <div className="flex items-center gap-1.5">
                                <User size={16} className="text-emerald-500" />
                                <span className="font-semibold text-gray-900 dark:text-white">{blogPost.author}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Calendar size={16} />
                                <span>{formatDate(blogPost.publish_date)}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Clock size={16} />
                                <span>{blogPost.reading_time}</span>
                            </div>

                            {/* Share button */}
                            <button
                                onClick={handleShare}
                                className="ml-auto inline-flex items-center gap-2 rounded-xl bg-white border border-gray-200 px-4 py-2 text-xs font-bold text-gray-700 transition-all hover:bg-gray-50 dark:border-gray-850 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 shadow-xs"
                            >
                                <Share2 size={14} />
                                Share Article
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Featured Image Section */}
            {blogPost.featured_image && (
                <section className="container mx-auto px-4 pb-12">
                    <div className="mx-auto max-w-4xl overflow-hidden rounded-3xl shadow-lg relative aspect-[21/9]">
                        <Image
                            src={blogPost.featured_image}
                            alt={blogPost.title}
                            fill
                            priority
                            className="object-cover"
                        />
                    </div>
                </section>
            )}

            {/* Main Content Layout */}
            <main className="container mx-auto px-4 pb-20">
                <div className="mx-auto max-w-4xl bg-white rounded-3xl border border-gray-100 p-8 shadow-xs dark:border-gray-850 dark:bg-gray-900 md:p-12">
                    <article className="prose prose-emerald lg:prose-xl max-w-none dark:prose-invert">
                        <div
                            dangerouslySetInnerHTML={{ __html: blogPost.content }}
                            className="blog-rich-content text-gray-850 dark:text-gray-300 leading-relaxed text-lg"
                        />
                    </article>

                    {/* Integrated Product Recommendation Cards */}
                    {blogPost.related_products && blogPost.related_products.length > 0 && (
                        <div className="mt-12 border-t border-gray-100 pt-10 dark:border-gray-800">
                            <h3 className="text-xl font-bold text-gray-950 dark:text-white mb-6">
                                Recommended Sourced Products
                            </h3>
                            {blogPost.related_products.map((prod, index) => (
                                <RelatedProductCard key={index} product={prod} />
                            ))}
                        </div>
                    )}

                    {/* Next / Previous Article Internal Linking Navigation */}
                    {(previous || next) && (
                        <div className="mt-12 flex flex-col gap-6 border-t border-gray-100 pt-8 dark:border-gray-800 md:flex-row justify-between">
                            {previous ? (
                                <Link
                                    href={`/blog/${previous.slug}`}
                                    className="flex flex-1 flex-col rounded-2xl border border-gray-50 bg-gray-50/50 p-5 transition-all hover:bg-emerald-500/5 hover:border-emerald-500/20 dark:border-gray-850 dark:bg-gray-950 dark:hover:bg-emerald-950/10"
                                >
                                    <span className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                                        <ArrowLeft size={12} />
                                        Previous Article
                                    </span>
                                    <span className="mt-2 font-bold text-gray-950 dark:text-white line-clamp-1">
                                        {previous.title}
                                    </span>
                                </Link>
                            ) : (
                                <div className="flex-1" />
                            )}
                            {next ? (
                                <Link
                                    href={`/blog/${next.slug}`}
                                    className="flex flex-1 flex-col text-right rounded-2xl border border-gray-50 bg-gray-50/50 p-5 transition-all hover:bg-emerald-500/5 hover:border-emerald-500/20 dark:border-gray-850 dark:bg-gray-950 dark:hover:bg-emerald-950/10"
                                >
                                    <span className="flex items-center justify-end gap-1 text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                                        Next Article
                                        <ArrowRight size={12} />
                                    </span>
                                    <span className="mt-2 font-bold text-gray-950 dark:text-white line-clamp-1">
                                        {next.title}
                                    </span>
                                </Link>
                            ) : (
                                <div className="flex-1" />
                            )}
                        </div>
                    )}
                </div>

                {/* Related Blogs Section */}
                {relatedPosts.length > 0 && (
                    <section className="mx-auto max-w-4xl mt-16">
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
                            Keep Reading: Related Guides
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {relatedPosts.map(post => (
                                <article
                                    key={post.id}
                                    className="group overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 shadow-xs transition-all duration-300 hover:shadow-md dark:border-gray-850 dark:bg-gray-900"
                                >
                                    <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl bg-gray-50 dark:bg-gray-800">
                                        <Image
                                            src={post.featured_image}
                                            alt={post.title}
                                            fill
                                            sizes="(max-width: 768px) 100vw, 400px"
                                            className="object-cover transition-transform duration-500 group-hover:scale-103"
                                        />
                                    </div>
                                    <h4 className="mt-4 font-bold text-gray-950 group-hover:text-emerald-600 transition-colors line-clamp-2 dark:text-white">
                                        <Link href={`/blog/${post.slug}`}>
                                            {post.title}
                                        </Link>
                                    </h4>
                                    <p className="mt-2 text-sm text-gray-600 line-clamp-2 dark:text-gray-400">
                                        {post.excerpt}
                                    </p>
                                </article>
                            ))}
                        </div>
                    </section>
                )}
            </main>
        </div>
    );
}
