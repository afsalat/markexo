'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCustomerAuth } from '@/context/CustomerAuthContext';
import { registerUser } from '@/lib/api';
import { Mail, Lock, User, Phone, ArrowRight, ArrowLeft, Github, Twitter } from 'lucide-react';

export default function SignupPage() {
    const { login, loginWithGoogle } = useCustomerAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectPath = searchParams?.get('redirect') || '/profile';
    const loginHref = `/login?redirect=${encodeURIComponent(redirectPath)}`;
    const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            setLoading(false);
            return;
        }

        try {
            const nameParts = formData.name.trim().split(' ');
            const first_name = nameParts[0];
            const last_name = nameParts.slice(1).join(' ') || '';

            await registerUser({
                email: formData.email,
                phone: formData.phone,
                password: formData.password,
                password_confirm: formData.confirmPassword,
                first_name,
                last_name
            });

            // Auto login after registration
            await login(formData.email, formData.password);
            router.push(redirectPath);
        } catch (err: any) {
            setError(err.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen lg:h-screen lg:overflow-hidden grid grid-cols-1 lg:grid-cols-2 bg-white dark:bg-dark-900">
            {/* Left Side - Image/Brand */}
            <div className="hidden lg:flex flex-col justify-center p-10 xl:p-12 bg-gray-50 dark:bg-dark-800 relative overflow-hidden border-r border-gray-100 dark:border-dark-700">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-600/10 to-primary-900/20 dark:from-accent-600/20 dark:to-accent-900/40 opacity-90" />
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1472851294608-41525b34e2c9?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80')] bg-cover bg-center opacity-10" />

                <div className="relative z-10 text-gray-900 dark:text-white max-w-md mx-auto">
                    <h1 className="font-display text-4xl xl:text-5xl font-bold mb-4 xl:mb-5 tracking-tight">Shop Better with VorionMart</h1>
                    <p className="text-lg xl:text-xl text-gray-600 dark:text-silver-300 mb-6 xl:mb-8 leading-relaxed">
                        Create your customer account to track orders, save favorite products, and check out faster every time.
                    </p>
                    <div className="space-y-3 xl:space-y-4">
                        {[
                            'Track your orders in one place',
                            'Save products to your wishlist',
                            'Faster checkout with saved details',
                            'Access customer-only offers'
                        ].map((feature, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <div className="w-5 h-5 xl:w-6 xl:h-6 rounded-full bg-primary-600 dark:bg-accent-500 flex items-center justify-center text-white dark:text-dark-900">
                                    <ArrowRight size={12} />
                                </div>
                                <span className="font-semibold text-gray-700 dark:text-silver-200">{feature}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="flex flex-col justify-center p-5 sm:p-8 lg:px-16 lg:py-8 xl:px-20 xl:py-10 bg-white dark:bg-dark-900 relative">
                {/* Back Button */}
                <Link href="/" className="absolute top-4 left-4 lg:top-5 lg:left-5 flex items-center gap-2 text-gray-500 dark:text-silver-400 hover:text-primary-600 dark:hover:text-accent-500 transition-colors group">
                    <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm font-semibold">Back to Home</span>
                </Link>
                <div className="max-w-md mx-auto w-full">
                    <div className="text-center mb-6 lg:mb-7">
                        <Link href="/" className="inline-block font-display text-3xl font-bold text-primary-600 dark:text-accent-500 mb-4 tracking-tighter">
                            VorionMart.
                        </Link>
                        <h2 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">Create your account</h2>
                        <p className="text-gray-500 dark:text-silver-400 mt-1.5 font-medium">
                            Already have an account? <Link href={loginHref} className="text-primary-600 dark:text-accent-500 font-bold hover:underline">Sign in</Link>
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-3.5">
                        {error && (
                            <div className="bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 px-4 py-2.5 rounded-xl text-sm border border-red-100 dark:border-red-500/20 font-medium animate-shake">
                                {error}
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-silver-300 mb-1.5 ml-1">Full Name</label>
                            <div className="relative group/input">
                                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-silver-500 group-focus-within/input:text-primary-600 dark:group-focus-within/input:text-accent-500 transition-colors" size={18} />
                                <input
                                    type="text"
                                    required
                                    className="w-full pl-11 pr-4 py-2.5 bg-gray-50 dark:bg-dark-800 border border-gray-100 dark:border-dark-700 rounded-xl focus:ring-2 focus:ring-primary-600 dark:focus:ring-accent-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-silver-600 font-medium"
                                    placeholder="John Doe"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-silver-300 mb-1.5 ml-1">Email Address</label>
                            <div className="relative group/input">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-silver-500 group-focus-within/input:text-primary-600 dark:group-focus-within/input:text-accent-500 transition-colors" size={18} />
                                <input
                                    type="email"
                                    required
                                    className="w-full pl-11 pr-4 py-2.5 bg-gray-50 dark:bg-dark-800 border border-gray-100 dark:border-dark-700 rounded-xl focus:ring-2 focus:ring-primary-600 dark:focus:ring-accent-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-silver-600 font-medium"
                                    placeholder="john@example.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-silver-300 mb-1.5 ml-1">Phone Number</label>
                            <div className="relative group/input">
                                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-silver-500 group-focus-within/input:text-primary-600 dark:group-focus-within/input:text-accent-500 transition-colors" size={18} />
                                <input
                                    type="tel"
                                    required
                                    className="w-full pl-11 pr-4 py-2.5 bg-gray-50 dark:bg-dark-800 border border-gray-100 dark:border-dark-700 rounded-xl focus:ring-2 focus:ring-primary-600 dark:focus:ring-accent-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-silver-600 font-medium"
                                    placeholder="+91 9876543210"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-silver-300 mb-1.5 ml-1">Password</label>
                                <div className="relative group/input">
                                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-silver-500 group-focus-within/input:text-primary-600 dark:group-focus-within/input:text-accent-500 transition-colors" size={18} />
                                    <input
                                        type="password"
                                        required
                                        className="w-full pl-11 pr-4 py-2.5 bg-gray-50 dark:bg-dark-800 border border-gray-100 dark:border-dark-700 rounded-xl focus:ring-2 focus:ring-primary-600 dark:focus:ring-accent-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-silver-600 font-medium"
                                        placeholder="••••••••"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-silver-300 mb-1.5 ml-1">Confirm</label>
                                <div className="relative group/input">
                                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-silver-500 group-focus-within/input:text-primary-600 dark:group-focus-within/input:text-accent-500 transition-colors" size={18} />
                                    <input
                                        type="password"
                                        required
                                        className="w-full pl-11 pr-4 py-2.5 bg-gray-50 dark:bg-dark-800 border border-gray-100 dark:border-dark-700 rounded-xl focus:ring-2 focus:ring-primary-600 dark:focus:ring-accent-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-silver-600 font-medium"
                                        placeholder="••••••••"
                                        value={formData.confirmPassword}
                                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex items-start gap-2.5 py-1">
                            <input type="checkbox" required className="mt-1 w-4 h-4 text-primary-600 dark:text-accent-500 bg-white dark:bg-dark-800 border-gray-200 dark:border-dark-600 rounded focus:ring-primary-600 dark:focus:ring-accent-500" />
                            <span className="text-xs lg:text-sm leading-snug text-gray-500 dark:text-silver-400 font-medium">
                                I agree to the <Link href="/terms-and-conditions" className="text-primary-600 dark:text-accent-500 hover:underline">Terms of Service</Link> and <Link href="/privacy-policy" className="text-primary-600 dark:text-accent-500 hover:underline">Privacy Policy</Link>
                            </span>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 bg-primary-600 dark:bg-accent-500 hover:bg-primary-700 dark:hover:bg-accent-600 text-white dark:text-dark-900 rounded-xl font-bold flex items-center justify-center gap-2 text-lg transition-all shadow-lg shadow-primary-600/20 dark:shadow-accent-500/20 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed group"
                        >
                            {loading ? (
                                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    <span>Create Account</span>
                                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 lg:hidden">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-100 dark:border-dark-700"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-4 bg-white dark:bg-dark-900 text-gray-400 dark:text-silver-500 font-bold uppercase tracking-widest text-[10px]">Or sign up with</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mt-4">
                            <button 
                                type="button" 
                                onClick={async () => {
                                    setLoading(true);
                                    setError(null);
                                    try {
                                        await loginWithGoogle();
                                        router.push(redirectPath);
                                    } catch (err: any) {
                                        setError(err.message || 'Google login failed');
                                    } finally {
                                        setLoading(false);
                                    }
                                }}
                                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-dark-800 border border-gray-100 dark:border-dark-700 rounded-xl hover:bg-gray-50 dark:hover:bg-dark-700 transition-all text-gray-700 dark:text-silver-300 font-bold text-xs shadow-sm"
                            >
                                <svg className="w-4 h-4" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" />
                                </svg>
                                Google
                            </button>
                            <button type="button" className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-dark-800 border border-gray-100 dark:border-dark-700 rounded-xl hover:bg-gray-50 dark:hover:bg-dark-700 transition-all text-gray-700 dark:text-silver-300 font-bold text-xs shadow-sm">
                                <Twitter size={18} className="text-[#1DA1F2]" /> Twitter
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
