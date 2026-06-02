'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, Calendar, Clock, User, ArrowRight, Tag, BookOpen } from 'lucide-react';
import { StaticBlogPost } from '@/lib/staticBlog';

interface BlogClientProps {
    blogPosts: StaticBlogPost[];
}

const POSTS_PER_PAGE = 6;

export default function BlogClient({ blogPosts }: BlogClientProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedTag, setSelectedTag] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);

    // Reset pagination when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedCategory, selectedTag]);

    // Extract unique categories and tags
    const { categories, tags } = useMemo(() => {
        const cats = new Set<string>();
        const tgs = new Set<string>();
        blogPosts.forEach(post => {
            if (post.category) cats.add(post.category);
            if (post.tags) post.tags.forEach(tag => tgs.add(tag));
        });
        return {
            categories: Array.from(cats),
            tags: Array.from(tgs)
        };
    }, [blogPosts]);

    // Filter posts
    const filteredPosts = useMemo(() => {
        return blogPosts.filter(post => {
            const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
            const matchesTag = selectedTag === 'all' || post.tags.includes(selectedTag);
            const matchesSearch = !searchTerm || 
                post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
                post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
            
            return matchesCategory && matchesTag && matchesSearch;
        });
    }, [blogPosts, selectedCategory, selectedTag, searchTerm]);

    // Pagination calculations
    const totalPages = Math.ceil(filteredPosts.length / POSTS_PER_PAGE);
    const paginatedPosts = useMemo(() => {
        const startIndex = (currentPage - 1) * POSTS_PER_PAGE;
        return filteredPosts.slice(startIndex, startIndex + POSTS_PER_PAGE);
    }, [filteredPosts, currentPage]);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
            {/* Header Banner */}
            <section className="relative overflow-hidden bg-gradient-to-br from-emerald-500/10 via-white to-sky-500/5 py-20 dark:from-emerald-950/20 dark:via-gray-950 dark:to-gray-900 md:py-28">
                <div className="container mx-auto px-4 text-center">
                    <div className="mx-auto max-w-3xl">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                            <BookOpen size={14} />
                            VorionMart Guides
                        </span>
                        <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white md:text-5xl lg:text-6xl">
                            Shopping Guides & <br />
                            <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent dark:from-emerald-400 dark:to-teal-300">
                                Expert Product Insights
                            </span>
                        </h1>
                        <p className="mt-6 text-lg text-gray-600 dark:text-gray-400 md:text-xl">
                            Discover highly researched, actionable articles, smart shopping insights, and practical guides curated for Indian shoppers.
                        </p>
                    </div>
                </div>
            </section>

            <div className="container mx-auto px-4 py-12">
                <div className="grid grid-cols-1 gap-12 lg:grid-cols-4">
                    {/* Left: Filters Sidebar */}
                    <aside className="space-y-8 lg:col-span-1">
                        {/* Search */}
                        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                            <h3 className="text-base font-bold text-gray-900 dark:text-white">Search Articles</h3>
                            <div className="relative mt-4">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search keywords..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm outline-none transition-all focus:border-emerald-500 focus:bg-white dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                                />
                            </div>
                        </div>

                        {/* Category List */}
                        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                            <h3 className="text-base font-bold text-gray-900 dark:text-white">Categories</h3>
                            <div className="mt-4 flex flex-col gap-2">
                                <button
                                    onClick={() => setSelectedCategory('all')}
                                    className={`flex items-center justify-between rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
                                        selectedCategory === 'all'
                                            ? 'bg-emerald-500 text-white'
                                            : 'bg-gray-50 text-gray-700 hover:bg-gray-100 dark:bg-gray-950 dark:text-gray-400 dark:hover:bg-gray-800'
                                    }`}
                                >
                                    <span>All Categories</span>
                                    <span className="text-xs opacity-75">{blogPosts.length}</span>
                                </button>
                                {categories.map(cat => {
                                    const count = blogPosts.filter(p => p.category === cat).length;
                                    return (
                                        <button
                                            key={cat}
                                            onClick={() => setSelectedCategory(cat)}
                                            className={`flex items-center justify-between rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
                                                selectedCategory === cat
                                                    ? 'bg-emerald-500 text-white'
                                                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100 dark:bg-gray-950 dark:text-gray-400 dark:hover:bg-gray-800'
                                            }`}
                                        >
                                            <span>{cat}</span>
                                            <span className="text-xs opacity-75">{count}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Tag Cloud */}
                        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                            <h3 className="text-base font-bold text-gray-900 dark:text-white">Tags Cloud</h3>
                            <div className="mt-4 flex flex-wrap gap-2">
                                <button
                                    onClick={() => setSelectedTag('all')}
                                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all ${
                                        selectedTag === 'all'
                                            ? 'bg-gray-950 text-white dark:bg-emerald-600'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-250 dark:bg-gray-950 dark:text-gray-400 dark:hover:bg-gray-800'
                                    }`}
                                >
                                    All Tags
                                </button>
                                {tags.map(tag => (
                                    <button
                                        key={tag}
                                        onClick={() => setSelectedTag(tag)}
                                        className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all ${
                                            selectedTag === tag
                                                ? 'bg-gray-950 text-white dark:bg-emerald-600'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-250 dark:bg-gray-950 dark:text-gray-400 dark:hover:bg-gray-800'
                                        }`}
                                    >
                                        <Tag size={10} />
                                        {tag}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </aside>

                    {/* Right: Posts Grid & Pagination */}
                    <main className="lg:col-span-3">
                        {paginatedPosts.length > 0 ? (
                            <>
                                <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                                    {paginatedPosts.map((post, idx) => (
                                        <article
                                            key={post.id}
                                            className="group flex flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg dark:border-gray-800 dark:bg-gray-900"
                                        >
                                            {/* Image container */}
                                            <div className="relative aspect-[16/10] bg-gray-100 dark:bg-gray-800">
                                                <Image
                                                    src={post.featured_image}
                                                    alt={post.title}
                                                    fill
                                                    sizes="(max-width: 768px) 100vw, 400px"
                                                    priority={idx === 0} // Preload the first article image for optimal LCP score
                                                    loading={idx === 0 ? 'eager' : 'lazy'}
                                                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                                                />
                                                <span className="absolute left-4 top-4 rounded-lg bg-emerald-500 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-sm">
                                                    {post.category}
                                                </span>
                                            </div>

                                            {/* Info content */}
                                            <div className="flex flex-1 flex-col justify-between p-6">
                                                <div>
                                                    {/* Meta list */}
                                                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                                                        <span className="flex items-center gap-1">
                                                            <Calendar size={12} />
                                                            {formatDate(post.publish_date)}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Clock size={12} />
                                                            {post.reading_time}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <User size={12} />
                                                            {post.author}
                                                        </span>
                                                    </div>

                                                    <h2 className="mt-4 text-xl font-bold text-gray-950 transition-colors duration-200 group-hover:text-emerald-600 dark:text-white dark:group-hover:text-emerald-400">
                                                        <Link href={`/blog/${post.slug}`} className="focus:outline-none">
                                                            {post.title}
                                                        </Link>
                                                    </h2>

                                                    <p className="mt-3 text-sm leading-relaxed text-gray-600 dark:text-gray-400 line-clamp-3">
                                                        {post.excerpt}
                                                    </p>
                                                </div>

                                                <div className="mt-6 flex items-center justify-between border-t border-gray-50 pt-4 dark:border-gray-800">
                                                    <Link
                                                        href={`/blog/${post.slug}`}
                                                        className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-600 transition-colors hover:text-emerald-500 dark:text-emerald-400"
                                                    >
                                                        Read Full Article
                                                        <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                                                    </Link>
                                                </div>
                                            </div>
                                        </article>
                                    ))}
                                </div>

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="mt-12 flex items-center justify-center gap-2">
                                        <button
                                            disabled={currentPage === 1}
                                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                            className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold transition-all hover:bg-gray-100 disabled:opacity-50 dark:border-gray-800 dark:hover:bg-gray-800"
                                        >
                                            Previous
                                        </button>
                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                            <button
                                                key={page}
                                                onClick={() => setCurrentPage(page)}
                                                className={`h-10 w-10 rounded-lg text-sm font-bold transition-all ${
                                                    currentPage === page
                                                        ? 'bg-emerald-500 text-white'
                                                        : 'border border-gray-200 hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-gray-800'
                                                }`}
                                            >
                                                {page}
                                            </button>
                                        ))}
                                        <button
                                            disabled={currentPage === totalPages}
                                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                            className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold transition-all hover:bg-gray-100 disabled:opacity-50 dark:border-gray-800 dark:hover:bg-gray-800"
                                        >
                                            Next
                                        </button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="rounded-3xl border border-dashed border-gray-200 py-16 text-center dark:border-gray-800">
                                <Search size={40} className="mx-auto text-gray-400" />
                                <h3 className="mt-4 text-lg font-bold text-gray-900 dark:text-white">No articles matched your filters</h3>
                                <p className="mt-2 text-sm text-gray-500">Try adjusting your keywords, categories, or tags selection.</p>
                                <button
                                    onClick={() => {
                                        setSearchTerm('');
                                        setSelectedCategory('all');
                                        setSelectedTag('all');
                                    }}
                                    className="mt-6 inline-flex rounded-xl bg-emerald-500 px-6 py-2.5 text-sm font-bold text-white transition-all hover:bg-emerald-600"
                                >
                                    Reset Filters
                                </button>
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
}
