'use client';

import React from 'react';

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-dark-900 text-silver-300 py-16 px-4">
            <div className="container mx-auto max-w-4xl">
                <div className="bg-dark-800 border border-dark-600 rounded-2xl p-8 md:p-12 shadow-2xl">
                    <h1 className="font-display text-3xl md:text-4xl font-bold text-white mb-2">Privacy Policy</h1>
                    <p className="text-silver-500 mb-8">Last Updated: January 01, 2026</p>

                    <div className="space-y-8 text-silver-300 leading-relaxed">
                        <section>
                            <p>
                                <strong>VorionMart</strong> respects your privacy and is committed to protecting your personal information.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-white mb-3">Information We Collect</h2>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>Name</li>
                                <li>Phone number</li>
                                <li>Address & pincode</li>
                                <li>Order details</li>
                                <li>Communication records (calls/messages)</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-white mb-3">How We Use Information</h2>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>Order processing & delivery</li>
                                <li>COD verification</li>
                                <li>Customer support</li>
                                <li>Fraud & RTO prevention</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-white mb-3">Data Protection</h2>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>Your data is stored securely.</li>
                                <li>We do <strong>NOT</strong> sell or rent personal data.</li>
                                <li>Data is shared only with logistics partners for delivery.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-white mb-3">Cookies</h2>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>Used to improve browsing experience.</li>
                                <li>No sensitive data stored in cookies.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-white mb-3">User Rights</h2>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>You may request data correction or deletion.</li>
                                <li>Contact us via email for privacy-related concerns.</li>
                            </ul>
                            <div className="mt-4 p-4 bg-dark-700/50 rounded-xl border border-dark-600">
                                <p>📧 Email: support@vorionmart.in</p>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}
