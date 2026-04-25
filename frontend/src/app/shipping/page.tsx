'use client';

import React from 'react';

export default function ShippingPage() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-dark-950 text-gray-700 dark:text-silver-300 py-16 px-4">
            <div className="container mx-auto max-w-4xl">
                <div className="bg-white dark:bg-dark-800 border border-gray-100 dark:border-dark-600 rounded-2xl p-8 md:p-12 shadow-sm dark:shadow-2xl">
                    <h1 className="font-display text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-8">Shipping Policy</h1>

                    <div className="space-y-8 text-gray-700 dark:text-silver-300 leading-relaxed">
                        <section>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Shipping Locations</h2>
                            <p>Currently shipping across India.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Delivery Timeline</h2>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>Estimated delivery: 3–7 business days.</li>
                                <li>Timelines may vary due to location or courier delays.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Shipping Charges</h2>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>Shipping charges (if any) are shown at checkout.</li>
                                <li>Free shipping may apply on select products.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Delivery Attempts</h2>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>Courier partners may attempt delivery multiple times.</li>
                                <li>Customer must be reachable on provided phone number.</li>
                            </ul>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}
