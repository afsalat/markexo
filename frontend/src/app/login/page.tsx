'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCustomerAuth } from '@/context/CustomerAuthContext';
import { Mail, Lock, ArrowRight, ArrowLeft, Github, Twitter } from 'lucide-react';

export default function LoginPage() {
    const { login } = useCustomerAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectPath = searchParams?.get('redirect') || '/profile';
    const signupHref = `/signup?redirect=${encodeURIComponent(redirectPath)}`;
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await login(formData.email, formData.password);
            router.push(redirectPath);
        } catch (err: any) {
            setError(err.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-dark-900">
            {/* Left Side - Image/Brand */}
            <div className="hidden lg:flex flex-col justify-center p-12 bg-dark-800 relative overflow-hidden border-r border-dark-700" data-aos="fade-right">
                <div className="absolute inset-0 bg-gradient-to-br from-accent-600/20 to-primary-900/40 opacity-90" />
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1557821552-17105176677c?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80')] bg-cover bg-center opacity-10" />

                <div className="relative z-10 text-white max-w-lg mx-auto">
                    <h1 className="font-display text-5xl font-bold mb-6">Welcome Back!</h1>
                    <p className="text-xl text-silver-300 mb-8">
                        Login to access your personalized shopping experience, track orders, and manage your wishlist.
                    </p>
                    <div className="grid grid-cols-3 gap-6">
                        {[
                            { value: '50k+', label: 'Happy Customers' },
                            { value: '10k+', label: 'Products' },
                            { value: '500+', label: 'Local Shops' }
                        ].map((stat, i) => (
                            <div key={i} className="bg-dark-700/50 backdrop-blur-sm rounded-2xl p-4 text-center border border-dark-600" data-aos="zoom-in" data-aos-delay={i * 100 + 300}>
                                <div className="font-bold text-2xl mb-1 text-accent-500">{stat.value}</div>
                                <div className="text-sm text-silver-400">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="flex flex-col justify-center p-6 sm:p-12 lg:p-24 bg-dark-900 relative" data-aos="fade-left">
                {/* Back Button */}
                <Link href="/" className="absolute top-6 left-6 flex items-center gap-2 text-silver-400 hover:text-accent-500 transition-colors">
                    <ArrowLeft size={20} />
                    <span className="text-sm font-medium">Back to Home</span>
                </Link>
                <div className="max-w-md mx-auto w-full">
                    <div className="text-center mb-10">
                        <Link href="/" className="inline-block font-display text-3xl font-bold text-accent-500 mb-6">
                            VorionMart.
                        </Link>
                        <h2 className="text-2xl font-bold text-white">Sign in to your account</h2>
                        <p className="text-silver-400 mt-2">
                            Don't have an account? <Link href={signupHref} className="text-accent-500 font-medium hover:underline">Sign up</Link>
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="bg-red-500/10 text-red-400 px-4 py-3 rounded-xl text-sm border border-red-500/20">
                                {error}
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-medium text-silver-300 mb-2">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-silver-500" size={20} />
                                <input
                                    type="email"
                                    required
                                    className="w-full pl-12 pr-4 py-3 bg-dark-800 border border-dark-600 rounded-xl focus:ring-2 focus:ring-accent-500 focus:border-transparent outline-none transition-all text-white placeholder:text-silver-600"
                                    placeholder="john@example.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-silver-300 mb-2">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-silver-500" size={20} />
                                <input
                                    type="password"
                                    required
                                    className="w-full pl-12 pr-4 py-3 bg-dark-800 border border-dark-600 rounded-xl focus:ring-2 focus:ring-accent-500 focus:border-transparent outline-none transition-all text-white placeholder:text-silver-600"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>
                            <div className="flex justify-end mt-2">
                                <Link href="#" className="text-sm text-accent-500 hover:underline">Forgot password?</Link>
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
                                <div className="w-full border-t border-dark-600"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-4 bg-dark-900 text-silver-500">Or continue with</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-6">
                            <button type="button" className="flex items-center justify-center gap-2 px-4 py-3 bg-dark-800 border border-dark-600 rounded-xl hover:bg-dark-700 transition-colors text-silver-300">
                                <Github size={20} className="text-silver-300" /> GitHub
                            </button>
                            <button type="button" className="flex items-center justify-center gap-2 px-4 py-3 bg-dark-800 border border-dark-600 rounded-xl hover:bg-dark-700 transition-colors text-silver-300">
                                <Twitter size={20} className="text-blue-400" /> Twitter
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
