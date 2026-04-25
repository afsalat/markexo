'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function PrivacyPolicyPage() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-dark-950 py-12">
            <div className="container mx-auto px-4 max-w-4xl">
                <Link href="/" className="inline-flex items-center gap-2 text-gray-500 dark:text-silver-400 hover:text-primary-600 dark:hover:text-accent-500 mb-6 transition-colors font-medium">
                    <ArrowLeft size={18} /> Back to Home
                </Link>

                <h1 className="font-display text-4xl font-bold text-gray-900 dark:text-white mb-8">Privacy Policy</h1>

                <div className="max-w-none space-y-6">
                    <p className="text-gray-500 dark:text-silver-300">
                        Last Updated: January 2026
                    </p>

                    <section className="bg-white dark:bg-dark-800 border border-gray-100 dark:border-dark-700 rounded-xl p-6 shadow-sm">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">1. Information We Collect</h2>
                        <ul className="text-gray-600 dark:text-silver-400 space-y-2 list-disc list-inside">
                            <li><strong className="text-gray-900 dark:text-white">Personal Information:</strong> Name, email, phone number, delivery address</li>
                            <li><strong className="text-gray-900 dark:text-white">Order Information:</strong> Product details, order history, delivery preferences</li>
                            <li><strong className="text-gray-900 dark:text-white">Device Information:</strong> Browser type, IP address, device identifiers</li>
                            <li><strong className="text-gray-900 dark:text-white">Usage Data:</strong> Pages visited, time spent, click patterns</li>
                        </ul>
                    </section>

                    <section className="bg-white dark:bg-dark-800 border border-gray-100 dark:border-dark-700 rounded-xl p-6 shadow-sm">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">2. How We Use Your Information</h2>
                        <ul className="text-gray-600 dark:text-silver-400 space-y-2 list-disc list-inside">
                            <li>Processing and fulfilling your orders</li>
                            <li>Communicating order updates via SMS and email</li>
                            <li>Verifying orders through phone calls</li>
                            <li>Improving our website and services</li>
                            <li>Preventing fraud and ensuring platform security</li>
                            <li>Sending promotional offers (with your consent)</li>
                        </ul>
                    </section>

                    <section className="bg-white dark:bg-dark-800 border border-gray-100 dark:border-dark-700 rounded-xl p-6 shadow-sm">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">3. Information Sharing</h2>
                        <p className="text-gray-600 dark:text-silver-400 leading-relaxed mb-3">
                            We share your information only with:
                        </p>
                        <ul className="text-gray-600 dark:text-silver-400 space-y-2 list-disc list-inside">
                            <li><strong className="text-gray-900 dark:text-white">Delivery Partners:</strong> To fulfill and deliver your orders</li>
                            <li><strong className="text-gray-900 dark:text-white">Service Providers:</strong> SMS gateways, email services</li>
                            <li><strong className="text-gray-900 dark:text-white">Legal Requirements:</strong> When required by law or legal process</li>
                        </ul>
                        <p className="text-primary-600 dark:text-accent-500 mt-3 text-sm font-semibold">
                            We never sell your personal information to third parties.
                        </p>
                    </section>

                    <section className="bg-white dark:bg-dark-800 border border-gray-100 dark:border-dark-700 rounded-xl p-6 shadow-sm">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">4. Data Security</h2>
                        <p className="text-gray-600 dark:text-silver-400 leading-relaxed">
                            We implement industry-standard security measures to protect your data including
                            encryption, secure servers, and access controls. However, no method of transmission
                            over the Internet is 100% secure.
                        </p>
                    </section>

                    <section className="bg-white dark:bg-dark-800 border border-gray-100 dark:border-dark-700 rounded-xl p-6 shadow-sm">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">5. Your Rights</h2>
                        <ul className="text-gray-600 dark:text-silver-400 space-y-2 list-disc list-inside">
                            <li>Access your personal data</li>
                            <li>Request correction of inaccurate data</li>
                            <li>Request deletion of your data</li>
                            <li>Opt-out of marketing communications</li>
                        </ul>
                    </section>

                    <section className="bg-white dark:bg-dark-800 border border-gray-100 dark:border-dark-700 rounded-xl p-6 shadow-sm">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">6. Contact Us</h2>
                        <p className="text-gray-600 dark:text-silver-400 leading-relaxed">
                            For privacy-related inquiries:
                        </p>
                        <div className="mt-3 text-gray-700 dark:text-silver-300">
                            <p>📞 Phone: <span className="text-primary-600 dark:text-accent-500 font-semibold">7356216468</span></p>
                            <p>📧 Email: <span className="text-primary-600 dark:text-accent-500 font-semibold">vorionnexustech@gmail.com</span></p>
                            <p className="mt-1">🏢 Company: Vorion Nexus Technology, Kozhikode, Kerala</p>
                        </div>
                    </section>

                    <div className="text-center pt-6 border-t border-gray-100 dark:border-dark-700">
                        <p className="text-gray-400 dark:text-silver-500 text-sm">
                            Powered by <span className="text-primary-600 dark:text-accent-500 font-medium">Vorion Nexus Technology</span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
