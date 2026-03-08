'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { registerPartner } from '@/lib/api';
import { Mail, Lock, User, ArrowRight, ArrowLeft, MapPin, Phone, FileText } from 'lucide-react';

export default function PartnerRegisterPage() {
    const { login } = useAuth();
    const router = useRouter();
    const [formData, setFormData] = useState({
        // User fields
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        password_confirm: '',
        // Shop fields
        shop_city: '',
        shop_phone: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (formData.password.length < 8) {
            setError("Password must be at least 8 characters long");
            setLoading(false);
            return;
        }

        if (formData.password !== formData.password_confirm) {
            setError("Passwords do not match");
            setLoading(false);
            return;
        }

        try {
            await registerPartner({
                first_name: formData.first_name,
                last_name: formData.last_name,
                email: formData.email,
                password: formData.password,
                password_confirm: formData.password_confirm,
                shop_city: formData.shop_city,
                shop_phone: formData.shop_phone
            });

            // Auto login after registration
            await login(formData.email, formData.password, '/partner');
            router.push('/partner');
        } catch (err: any) {
            setError(err.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-dark-900">
            {/* Left Side - Image/Brand */}
            <div className="hidden lg:flex flex-col justify-center p-12 bg-dark-800 relative overflow-hidden border-r border-dark-700">
                <div className="absolute inset-0 bg-gradient-to-br from-accent-600/20 to-accent-900/40 opacity-90" />
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80')] bg-cover bg-center opacity-10" />

                <div className="relative z-10 text-white max-w-lg mx-auto">
                    <h1 className="font-display text-5xl font-bold mb-6">Become a Partner</h1>
                    <p className="text-xl text-silver-300 mb-8">
                        Join as a Partner: Research trending products, curate your shop, and promote listings.
                    </p>
                    <div className="space-y-4">
                        {[
                            'Research and find trending products',
                            'Create and manage your own shop',
                            'Promote products to your audience',
                            'Earn 30% profit on every sale'
                        ].map((feature, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <div className="w-6 h-6 rounded-full bg-accent-500 flex items-center justify-center text-dark-900">
                                    <ArrowRight size={14} />
                                </div>
                                <span className="font-medium text-silver-200">{feature}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="flex flex-col justify-center p-6 sm:p-12 lg:p-24 bg-dark-900 relative">
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
                        <h2 className="text-2xl font-bold text-white">Register as Partner</h2>
                        <p className="text-silver-400 mt-2">
                            Already have an account? <Link href="/partner/login" className="text-accent-500 font-medium hover:underline">Sign in</Link>
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {error && (
                            <div className="bg-red-500/10 text-red-400 px-4 py-3 rounded-xl text-sm border border-red-500/20">
                                {error}
                            </div>
                        )}

                        {/* Personal Information */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-white">Personal Information</h3>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-silver-300 mb-2">First Name</label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-silver-500" size={20} />
                                        <input
                                            type="text"
                                            required
                                            className="w-full pl-12 pr-4 py-3 bg-dark-800 border border-dark-600 rounded-xl focus:ring-2 focus:ring-accent-500 focus:border-transparent outline-none transition-all text-white placeholder:text-silver-600"
                                            placeholder="John"
                                            value={formData.first_name}
                                            onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-silver-300 mb-2">Last Name</label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-silver-500" size={20} />
                                        <input
                                            type="text"
                                            required
                                            className="w-full pl-12 pr-4 py-3 bg-dark-800 border border-dark-600 rounded-xl focus:ring-2 focus:ring-accent-500 focus:border-transparent outline-none transition-all text-white placeholder:text-silver-600"
                                            placeholder="Doe"
                                            value={formData.last_name}
                                            onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

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
                                        placeholder="Create a strong password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-silver-300 mb-2">Confirm Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-silver-500" size={20} />
                                    <input
                                        type="password"
                                        required
                                        className="w-full pl-12 pr-4 py-3 bg-dark-800 border border-dark-600 rounded-xl focus:ring-2 focus:ring-accent-500 focus:border-transparent outline-none transition-all text-white placeholder:text-silver-600"
                                        placeholder="Confirm your password"
                                        value={formData.password_confirm}
                                        onChange={(e) => setFormData({ ...formData, password_confirm: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-silver-300 mb-2">City</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded-xl focus:ring-2 focus:ring-accent-500 focus:border-transparent outline-none transition-all text-white placeholder:text-silver-600"
                                        placeholder="City"
                                        value={formData.shop_city}
                                        onChange={(e) => setFormData({ ...formData, shop_city: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-silver-300 mb-2">Phone</label>
                                    <div className="relative">
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-silver-500" size={20} />
                                        <input
                                            type="tel"
                                            required
                                            className="w-full pl-12 pr-4 py-3 bg-dark-800 border border-dark-600 rounded-xl focus:ring-2 focus:ring-accent-500 focus:border-transparent outline-none transition-all text-white placeholder:text-silver-600"
                                            placeholder="+91 9876543210"
                                            value={formData.shop_phone}
                                            onChange={(e) => setFormData({ ...formData, shop_phone: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <input type="checkbox" required className="mt-1 w-4 h-4 text-accent-500 bg-dark-800 border-dark-600 rounded focus:ring-accent-500" />
                            <span className="text-sm text-silver-400">
                                I agree to the <Link href="/terms" className="text-accent-500 hover:underline">Terms of Service</Link> and <Link href="/privacy" className="text-accent-500 hover:underline">Privacy Policy</Link>
                            </span>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full btn-primary py-3.5 flex items-center justify-center gap-2 text-lg disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Creating Account...' : (
                                <>
                                    Register as Partner <ArrowRight size={20} />
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}