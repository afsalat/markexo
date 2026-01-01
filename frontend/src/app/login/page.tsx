'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useCustomerAuth } from '@/context/CustomerAuthContext';
import { Mail, Lock, ArrowRight, Github, Twitter } from 'lucide-react';

export default function LoginPage() {
    const { login } = useCustomerAuth();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        // Use part of email as name for demo
        const name = formData.email.split('@')[0];
        login(formData.email, name.charAt(0).toUpperCase() + name.slice(1));
    };

    return (
        <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
            {/* Left Side - Image/Brand */}
            <div className="hidden lg:flex flex-col justify-center p-12 bg-primary-900 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-600 to-primary-900 opacity-90" />
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1557821552-17105176677c?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80')] bg-cover bg-center opacity-20" />

                <div className="relative z-10 text-white max-w-lg mx-auto">
                    <h1 className="font-display text-5xl font-bold mb-6">Welcome Back!</h1>
                    <p className="text-xl text-primary-100 mb-8">
                        Login to access your personalized shopping experience, track orders, and manage your wishlist.
                    </p>
                    <div className="grid grid-cols-3 gap-6">
                        {[
                            { value: '50k+', label: 'Happy Customers' },
                            { value: '10k+', label: 'Products' },
                            { value: '500+', label: 'Local Shops' }
                        ].map((stat, i) => (
                            <div key={i} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
                                <div className="font-bold text-2xl mb-1">{stat.value}</div>
                                <div className="text-sm text-primary-200">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="flex flex-col justify-center p-6 sm:p-12 lg:p-24 bg-white">
                <div className="max-w-md mx-auto w-full">
                    <div className="text-center mb-10">
                        <Link href="/" className="inline-block font-display text-3xl font-bold text-primary-600 mb-6">
                            Markexo.
                        </Link>
                        <h2 className="text-2xl font-bold text-gray-900">Sign in to your account</h2>
                        <p className="text-gray-500 mt-2">
                            Don't have an account? <Link href="/signup" className="text-primary-600 font-medium hover:underline">Sign up</Link>
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="email"
                                    required
                                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                                    placeholder="john@example.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="password"
                                    required
                                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>
                            <div className="flex justify-end mt-2">
                                <Link href="#" className="text-sm text-primary-600 hover:underline">Forgot password?</Link>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full btn-primary py-3.5 flex items-center justify-center gap-2 text-lg disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Signing in...' : (
                                <>
                                    Sign In <ArrowRight size={20} />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-100"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-4 bg-white text-gray-500">Or continue with</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-6">
                            <button className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                                <Github size={20} /> GitHub
                            </button>
                            <button className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                                <Twitter size={20} className="text-blue-400" /> Twitter
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
