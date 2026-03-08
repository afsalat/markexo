'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Lock, Mail, Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react';
import { AUTH_URL, API_BASE_URL } from '@/config/apiConfig';

export default function LoginPage() {
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

                // Verify if user is actually an admin
                try {
                    const userRes = await fetch(`${API_BASE_URL}/admin/users/me/`, {
                        headers: { 'Authorization': `Bearer ${data.access}` }
                    });

                    if (userRes.ok) {
                        const userData = await userRes.json();
                        const isAdmin = userData.is_superuser || userData.roles?.some((r: any) => r.name.toLowerCase() === 'admin');

                        if (!isAdmin) {
                            setError('Access Denied: You do not have permission to access the admin panel.');
                            setLoading(false);
                            return;
                        }

                        login(data.access, data.refresh, '/admin');
                    } else {
                        setError('Failed to verify user permissions.');
                    }
                } catch (userErr) {
                    console.error("Permission check failed", userErr);
                    setError('Unable to verify permissions.');
                }
            } else {
                const data = await res.json();
                if (data.detail === 'No active account found with the given credentials') {
                    setError('Your account has been deactivated. Please contact the administrator.');
                } else {
                    setError(data.detail || 'Invalid email or password. Please try again.');
                }
            }
        } catch (err) {
            setError('Unable to connect to the server. Please check your connection.');
        } finally {
            if (!error) setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4 transition-all duration-500">
            <div className="max-w-sm w-full animate-fade-in">
                <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-accent-500 to-primary-600 rounded-xl shadow-lg shadow-accent-500/20 text-dark-900 font-black text-2xl mb-3 transform hover:rotate-12 transition-transform cursor-default">
                        V
                    </div>
                    <h1 className="text-2xl font-display font-black text-white tracking-tight mb-1">
                        VorionMart Admin
                    </h1>
                    <p className="text-silver-500 font-bold tracking-widest uppercase text-[10px] opacity-70">
                        Secure Access Control Panel
                    </p>
                </div>

                <div className="bg-dark-800 rounded-[2rem] p-8 shadow-2xl shadow-dark-950/40 border border-dark-700 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-accent-500/10 rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform duration-700 ease-out"></div>

                    <form onSubmit={handleSubmit} className="relative z-10 space-y-4">
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-2xl text-sm flex items-center gap-3 animate-shake">
                                <div className="w-6 h-6 bg-red-500/20 rounded-full flex items-center justify-center shrink-0 text-red-400">!</div>
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-silver-300 ml-1">Admin Email</label>
                            <div className="relative group/input">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-silver-500 group-focus-within/input:text-accent-500 transition-colors" size={20} />
                                <input
                                    type="text"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="admin@vorionmart.com"
                                    className="w-full pl-11 pr-4 py-3 bg-dark-900 border border-dark-600 rounded-xl outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition-all text-white font-medium text-sm placeholder:text-silver-600"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-silver-300 ml-1">Password</label>
                            <div className="relative group/input">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-silver-500 group-focus-within/input:text-accent-500 transition-colors" size={20} />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full pl-11 pr-11 py-3 bg-dark-900 border border-dark-600 rounded-xl outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition-all text-white font-medium text-sm placeholder:text-silver-600"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-silver-500 hover:text-silver-300 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 bg-gradient-to-r from-accent-500 to-primary-600 text-dark-900 rounded-xl font-bold flex items-center justify-center gap-2 hover:from-accent-400 hover:to-primary-500 transition-all shadow-lg shadow-accent-500/20 active:scale-[0.98] disabled:opacity-70 group mt-2"
                        >
                            {loading ? (
                                <Loader2 className="animate-spin" size={24} />
                            ) : (
                                <>
                                    <span>Sign In to Dashboard</span>
                                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <p className="text-center mt-6 text-[10px] text-silver-600 font-bold tracking-widest uppercase opacity-60">
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
