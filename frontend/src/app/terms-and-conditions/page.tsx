'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function TermsAndConditionsPage() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-dark-950 py-12">
            <div className="container mx-auto px-4 max-w-4xl">
                <Link href="/" className="inline-flex items-center gap-2 text-gray-500 dark:text-silver-400 hover:text-primary-600 dark:hover:text-accent-500 mb-6 transition-colors font-medium">
                    <ArrowLeft size={18} /> Back to Home
                </Link>

                <h1 className="font-display text-4xl font-bold text-gray-900 dark:text-white mb-8">Terms & Conditions</h1>

                <div className="max-w-none space-y-6">
                    <p className="text-gray-500 dark:text-silver-300">
                        Last Updated: January 2026
                    </p>

                    <section className="bg-white dark:bg-dark-800 border border-gray-100 dark:border-dark-700 rounded-xl p-6 shadow-sm">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">1. Introduction</h2>
                        <p className="text-gray-600 dark:text-silver-400 leading-relaxed">
                            Welcome to VorionMart. These Terms & Conditions govern your use of the VorionMart website
                            and your purchase of products from us. By accessing or using our services, you agree to be
                            bound by these terms.
                        </p>
                    </section>

                    <section className="bg-white dark:bg-dark-800 border border-gray-100 dark:border-dark-700 rounded-xl p-6 shadow-sm">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">2. Product Orders</h2>
                        <ul className="text-gray-600 dark:text-silver-400 space-y-2 list-disc list-inside">
                            <li>All orders are processed on a first-come, first-served basis</li>
                            <li>We reserve the right to cancel orders due to stock unavailability</li>
                            <li>Product images are for representation; actual products may vary slightly</li>
                            <li>Prices are subject to change without prior notice</li>
                        </ul>
                    </section>

                    <section className="bg-white dark:bg-dark-800 border border-gray-100 dark:border-dark-700 rounded-xl p-6 shadow-sm">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">3. Cash on Delivery (COD)</h2>
                        <ul className="text-gray-600 dark:text-silver-400 space-y-2 list-disc list-inside">
                            <li>VorionMart operates exclusively on Cash on Delivery payment model</li>
                            <li>Payment must be made in cash at the time of delivery</li>
                            <li>Our delivery partner will collect the exact order amount</li>
                            <li>No online payments or card payments are accepted</li>
                            <li>We reserve the right to refuse COD for certain pincodes or customers</li>
                        </ul>
                    </section>

                    <section className="bg-white dark:bg-dark-800 border border-gray-100 dark:border-dark-700 rounded-xl p-6 shadow-sm">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">4. Delivery</h2>
                        <ul className="text-gray-600 dark:text-silver-400 space-y-2 list-disc list-inside">
                            <li>Estimated delivery times are indicative and not guaranteed</li>
                            <li>Delivery is subject to address serviceability</li>
                            <li>You must be available to receive the order at the provided address</li>
                            <li>Failed deliveries may result in order cancellation</li>
                        </ul>
                    </section>

                    <section className="bg-white dark:bg-dark-800 border border-gray-100 dark:border-dark-700 rounded-xl p-6 shadow-sm">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">5. Returns & Refunds</h2>
                        <p className="text-gray-600 dark:text-silver-400 leading-relaxed">
                            Please refer to our <Link href="/return-refund-policy" className="text-primary-600 dark:text-accent-500 hover:underline">Return & Refund Policy</Link> for
                            detailed information about returns, exchanges, and refunds.
                        </p>
                    </section>

                    <section className="bg-white dark:bg-dark-800 border border-gray-100 dark:border-dark-700 rounded-xl p-6 shadow-sm">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">6. User Conduct</h2>
                        <ul className="text-gray-600 dark:text-silver-400 space-y-2 list-disc list-inside">
                            <li>You must provide accurate personal and contact information</li>
                            <li>Fraudulent orders or misuse of the platform is strictly prohibited</li>
                            <li>Repeated order cancellations may result in account restrictions</li>
                            <li>We may verify orders via phone call before processing</li>
                        </ul>
                    </section>

                    <section className="bg-white dark:bg-dark-800 border border-gray-100 dark:border-dark-700 rounded-xl p-6 shadow-sm">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">7. Contact Information</h2>
                        <p className="text-gray-600 dark:text-silver-400 leading-relaxed">
                            For any questions regarding these terms, contact us at:
                        </p>
                        <div className="mt-3 text-gray-700 dark:text-silver-300">
                            <p>📞 Phone: <span className="text-primary-600 dark:text-accent-500 font-semibold">7356216468</span></p>
                            <p>📧 Email: <span className="text-primary-600 dark:text-accent-500 font-semibold">vorionnexustech@gmail.com</span></p>
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
