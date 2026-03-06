'use client';

import React from 'react';

export default function ReturnsPage() {
    return (
        <div className="min-h-screen bg-dark-900 text-silver-300 py-16 px-4">
            <div className="container mx-auto max-w-4xl">
                <div className="bg-dark-800 border border-dark-600 rounded-2xl p-8 md:p-12 shadow-2xl">
                    <h1 className="font-display text-3xl md:text-4xl font-bold text-white mb-8">Return & Refund Policy</h1>

                    <div className="space-y-8 text-silver-300 leading-relaxed">
                        <section>
                            <h2 className="text-xl font-bold text-white mb-3">Eligible Returns</h2>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>Damaged products</li>
                                <li>Defective products</li>
                                <li>Incorrect items delivered</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-white mb-3">Non-Eligible Returns</h2>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>Change of mind</li>
                                <li>Used or opened products</li>
                                <li>Refusal without reason</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-white mb-3">Refund Process</h2>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>COD refunds via UPI or bank transfer.</li>
                                <li>Processing time: 7–10 business days.</li>
                                <li>Refund initiated after product verification.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-white mb-3">Contact</h2>
                            <div className="p-4 bg-dark-700/50 rounded-xl border border-dark-600">
                                <p>📞 Phone: 7356216468</p>
                                <p>📧 Email: vorionnexustech@gmail.com</p>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}
