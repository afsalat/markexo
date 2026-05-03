'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Calendar, Clock, User, ArrowRight, Filter, ChevronDown } from 'lucide-react';
import { BlogPost } from '@/lib/api';

interface BlogClientProps {
    blogPosts: BlogPost[];
}

export default function BlogClient({ blogPosts }: BlogClientProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [filteredPosts, setFilteredPosts] = useState<BlogPost[]>(blogPosts);
    const [categories, setCategories] = useState<string[]>([]);

    // Extract unique categories from blog posts
    useEffect(() => {
        const uniqueCategories = Array.from(
            new Set(blogPosts.map(post => post.category).filter(Boolean))
        ) as string[];
        setCategories(uniqueCategories);
    }, [blogPosts]);

    // Filter posts based on search and category
    useEffect(() => {
        let filtered = blogPosts || [];

        if (selectedCategory !== 'all') {
            filtered = filtered.filter(post => post.category === selectedCategory);
        }

        if (searchTerm) {
            filtered = filtered.filter(post =>
                post.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                post.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                post.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }

        setFilteredPosts(filtered);
    }, [searchTerm, selectedCategory, blogPosts]);

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

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
            {/* Hero Section */}
            <section className="relative py-20 md:py-32 overflow-hidden bg-gradient-to-br from-accent-500/10 via-white to-primary-500/5 dark:from-accent-500/5 dark:via-dark-900 dark:to-primary-500/10">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto text-center">
                        <div className="inline-flex items-center gap-2 bg-accent-500/10 dark:bg-accent-500/10 border border-accent-500/20 px-4 py-1.5 rounded-full mb-8">
                            <Calendar className="text-accent-500" size={16} />
                            <span className="text-accent-500 text-xs font-bold uppercase tracking-widest">Shopping Guides</span>
                        </div>

                        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
                            Expert Shopping <br />
                            <span className="gradient-text-accent">Guides & Reviews</span>
                        </h1>
                        <p className="text-xl md:text-2xl text-gray-600 dark:text-silver-400 mb-10 max-w-3xl mx-auto leading-relaxed">
                            Discover in-depth product reviews, shopping tips, and lifestyle guides from our experts.
                            Make informed decisions with our comprehensive buying guides.
                        </p>

                        {/* Search and Filter */}
                        <div className="flex flex-col md:flex-row items-center justify-center gap-4 max-w-2xl mx-auto mb-16">
                            <div className="relative flex-1 w-full">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-silver-500" size={20} />
                                <input
                                    type="text"
                                    placeholder="Search articles..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-2xl px-12 py-4 text-gray-900 dark:text-white focus:border-accent-500 outline-none transition-all shadow-lg"
                                />
                            </div>
                            <div className="flex items-center gap-3 w-full md:w-auto relative">
                                <Filter size={20} className="text-gray-400 dark:text-silver-500 absolute left-4 pointer-events-none" />
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    className="appearance-none bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-2xl pl-12 pr-12 py-4 text-gray-900 dark:text-white focus:border-accent-500 outline-none transition-all shadow-lg cursor-pointer w-full md:w-48"
                                >
                                    <option value="all">All Categories</option>
                                    {categories.map(category => (
                                        <option key={category} value={category}>{category}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-silver-500 pointer-events-none" size={20} />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Blog Posts Grid */}
            <section className="py-16">
                <div className="container mx-auto px-4">
                    {filteredPosts.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {filteredPosts.map((post, index) => (
                                <article
                                    key={post.id}
                                    className="group bg-white dark:bg-dark-800 rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 dark:border-dark-700 hover:border-accent-500/30"
                                >
                                    {/* Featured Image */}
                                    {post.featured_image && (
                                        <div className="relative aspect-[16/9] overflow-hidden">
                                            <img
                                                src={post.featured_image}
                                                alt={post.title}
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                                            
                                            {/* Category Badge */}
                                            {post.category && (
                                                <div className="absolute top-4 left-4 bg-accent-500 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                                                    {post.category}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Content */}
                                    <div className="p-6">
                                        {/* Meta Info */}
                                        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-silver-500 mb-4">
                                            <div className="flex items-center gap-1">
                                                <Calendar size={14} />
                                                <span>{formatDate(post.published_at)}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Clock size={14} />
                                                <span>{post.read_time || calculateReadTime(post.content)} min read</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <User size={14} />
                                                <span>{post.author}</span>
                                            </div>
                                        </div>

                                        {/* Title */}
                                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3 leading-tight group-hover:text-accent-500 transition-colors">
                                            <Link href={`/blog/${post.slug}`} className="block">
                                                {post.title}
                                            </Link>
                                        </h2>

                                        {/* Excerpt */}
                                        <p className="text-gray-600 dark:text-silver-400 mb-4 line-clamp-3 leading-relaxed">
                                            {post.excerpt || (post.content ? post.content.slice(0, 150).replace(/\n/g, ' ') : 'Read our latest blog post...')}...
                                        </p>

                                        {/* Tags */}
                                        {post.tags && post.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mb-4">
                                                {post.tags.slice(0, 3).map(tag => (
                                                    <span
                                                        key={tag}
                                                        className="bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-silver-400 px-3 py-1 rounded-full text-xs font-medium"
                                                    >
                                                        #{tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        {/* Read More */}
                                        <Link
                                            href={`/blog/${post.slug}`}
                                            className="inline-flex items-center gap-2 text-accent-500 font-bold hover:text-accent-600 transition-colors group"
                                        >
                                            Read Article
                                            <ArrowRight size={16} className="transform group-hover:translate-x-1 transition-transform" />
                                        </Link>
                                    </div>
                                </article>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20">
                            <div className="w-20 h-20 bg-gray-100 dark:bg-dark-700 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Search size={32} className="text-gray-400 dark:text-silver-500" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No articles found</h3>
                            <p className="text-gray-500 dark:text-silver-500 mb-8">Try adjusting your search or filter criteria</p>
                            <button
                                onClick={() => {
                                    setSearchTerm('');
                                    setSelectedCategory('all');
                                }}
                                className="px-6 py-3 bg-accent-500 text-white font-bold rounded-xl hover:bg-accent-600 transition-colors"
                            >
                                Clear Filters
                            </button>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
