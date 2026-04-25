'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Lock, Mail, Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react';
import { AUTH_URL } from '@/config/apiConfig';

export default function PartnerLoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch(AUTH_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            if (res.ok) {
                const data = await res.json();
                // Check if partner has been approved (is_staff = true)
                if (!data.user?.is_staff) {
                    setError('Your account is pending admin approval. Please wait for approval before logging in.');
                    setLoading(false);
                    return;
                }
                // Login specific for partners -> redirect to /partner
                login(data.access, data.refresh, '/partner');
            } else {
                const data = await res.json();
                // non_field_errors comes from backend ValidationError, detail from DRF default
                const errorMsg = data.detail || (data.non_field_errors && data.non_field_errors[0]) || 'Invalid email or password. Please try again.';
                if (errorMsg === 'No active account found with the given credentials') {
                    setError('Your account has been deactivated. Please contact support.');
                } else {
                    setError(errorMsg);
                }
            }
        } catch (err) {
            setError('Unable to connect to the server. Please check your connection.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-dark-900 flex items-center justify-center p-4 transition-all duration-500">
            <div className="max-w-sm w-full animate-fade-in">
                <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg shadow-emerald-500/20 text-white font-black text-2xl mb-3 transform hover:rotate-12 transition-transform cursor-default">
                        P
                    </div>
                    <h1 className="text-2xl font-display font-black text-gray-900 dark:text-white tracking-tight mb-1">
                        VorionMart Partner
                    </h1>
                    <p className="text-gray-500 dark:text-silver-500 font-bold tracking-widest uppercase text-[10px] opacity-70">
                        Vendor Access
                    </p>
                </div>

                <div className="bg-white dark:bg-dark-800 rounded-[2rem] p-8 shadow-xl dark:shadow-2xl dark:shadow-dark-950/40 border border-gray-100 dark:border-dark-700 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform duration-700 ease-out"></div>

                    <form onSubmit={handleSubmit} className="relative z-10 space-y-4">
                        {error && (
                            <div className="bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 text-red-600 dark:text-red-400 px-4 py-3 rounded-2xl text-sm flex items-center gap-3 animate-shake">
                                <div className="w-6 h-6 bg-red-100 dark:bg-red-500/20 rounded-full flex items-center justify-center shrink-0 text-red-600 dark:text-red-400 font-bold">!</div>
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-600 dark:text-silver-300 ml-1">Account Email</label>
                            <div className="relative group/input">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-silver-500 group-focus-within/input:text-emerald-500 transition-colors" size={20} />
                                <input
                                    type="text"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="partner@vorionmart.com"
                                    className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-dark-900 border border-gray-100 dark:border-dark-600 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-gray-900 dark:text-white font-medium text-sm placeholder:text-gray-400 dark:placeholder:text-silver-600"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-600 dark:text-silver-300 ml-1">Password</label>
                            <div className="relative group/input">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-silver-500 group-focus-within/input:text-emerald-500 transition-colors" size={20} />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full pl-11 pr-11 py-3 bg-gray-50 dark:bg-dark-900 border border-gray-100 dark:border-dark-600 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-gray-900 dark:text-white font-medium text-sm placeholder:text-gray-400 dark:placeholder:text-silver-600"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-silver-500 hover:text-emerald-500 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:from-emerald-400 hover:to-emerald-500 transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.98] disabled:opacity-70 group mt-2"
                        >
                            {loading ? (
                                <Loader2 className="animate-spin" size={24} />
                            ) : (
                                <>
                                    <span>Sign In as Partner</span>
                                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <p className="text-center mt-6 text-[10px] text-gray-400 dark:text-silver-600 font-bold tracking-widest uppercase opacity-60">
                    Protected by Vorion Nexus Security
                </p>
            </div>

            <style jsx global>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-4px); }
                    75% { transform: translateX(4px); }
                }
                .animate-shake {
                    animation: shake 0.2s ease-in-out 0s 2;
                }
            `}</style>
        </div>
    );
}
