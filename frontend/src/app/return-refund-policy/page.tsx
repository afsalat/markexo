'use client';

import { ArrowLeft, RotateCcw, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';

export default function ReturnRefundPolicyPage() {
    return (
        <div className="min-h-screen bg-dark-900 py-12">
            <div className="container mx-auto px-4 max-w-4xl">
                <Link href="/" className="inline-flex items-center gap-2 text-silver-400 hover:text-accent-500 mb-6 transition-colors">
                    <ArrowLeft size={18} /> Back to Home
                </Link>

                <h1 className="font-display text-4xl font-bold text-white mb-8">Return & Refund Policy</h1>

                <div className="prose prose-invert max-w-none space-y-6">
                    {/* Policy Highlights */}
                    <div className="bg-accent-500/10 border border-accent-500/30 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-3">
                            <RotateCcw className="text-accent-500" size={24} />
                            <h2 className="text-xl font-bold text-white">7-Day Return Window</h2>
                        </div>
                        <p className="text-silver-300">
                            You can request a return within 7 days of receiving your order if the product is
                            damaged, defective, or different from what you ordered.
                        </p>
                    </div>

                    <section className="bg-dark-800 border border-dark-700 rounded-xl p-6">
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <CheckCircle className="text-green-500" size={20} /> Eligible for Return
                        </h2>
                        <ul className="text-silver-400 space-y-2 list-disc list-inside">
                            <li>Product received is damaged or broken</li>
                            <li>Wrong product delivered (different from order)</li>
                            <li>Product is defective or not working</li>
                            <li>Missing items from the order</li>
                            <li>Product significantly different from description</li>
                        </ul>
                    </section>

                    <section className="bg-dark-800 border border-dark-700 rounded-xl p-6">
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <XCircle className="text-red-500" size={20} /> Not Eligible for Return
                        </h2>
                        <ul className="text-silver-400 space-y-2 list-disc list-inside">
                            <li>Return request after 7 days of delivery</li>
                            <li>Product used, washed, or altered</li>
                            <li>Missing original packaging or tags</li>
                            <li>Intimate wear, innerwear products</li>
                            <li>Customized or personalized items</li>
                            <li>Change of mind after delivery</li>
                        </ul>
                    </section>

                    <section className="bg-dark-800 border border-dark-700 rounded-xl p-6">
                        <h2 className="text-xl font-bold text-white mb-4">Return Process</h2>
                        <ol className="text-silver-400 space-y-3 list-decimal list-inside">
                            <li>Contact us within 7 days of delivery with order ID</li>
                            <li>Share photos/videos of the product issue</li>
                            <li>Our team will verify and approve the return</li>
                            <li>Pickup will be arranged from your address</li>
                            <li>Replacement or refund processed within 5-7 days</li>
                        </ol>
                    </section>

                    <section className="bg-dark-800 border border-dark-700 rounded-xl p-6">
                        <h2 className="text-xl font-bold text-white mb-4">Refund Options</h2>
                        <div className="space-y-4">
                            <div className="p-4 bg-dark-700 rounded-lg">
                                <h3 className="font-bold text-white mb-1">Replacement</h3>
                                <p className="text-sm text-silver-400">We will send a new product at no extra cost</p>
                            </div>
                            <div className="p-4 bg-dark-700 rounded-lg">
                                <h3 className="font-bold text-white mb-1">Store Credit</h3>
                                <p className="text-sm text-silver-400">Credit added to your account for future purchases</p>
                            </div>
                            <div className="p-4 bg-dark-700 rounded-lg">
                                <h3 className="font-bold text-white mb-1">Bank Refund</h3>
                                <p className="text-sm text-silver-400">Refund to bank account within 7-10 business days</p>
                            </div>
                        </div>
                    </section>

                    <section className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="text-yellow-500 flex-shrink-0 mt-1" size={20} />
                            <div>
                                <h2 className="text-lg font-bold text-white mb-2">RTO (Return to Origin) Orders</h2>
                                <p className="text-silver-400 text-sm">
                                    If you refuse to accept delivery or the order is returned due to incorrect address/phone,
                                    the order will be marked as RTO. No refund is applicable for RTO orders due to
                                    customer-side issues.
                                </p>
                            </div>
                        </div>
                    </section>

                    <section className="bg-dark-800 border border-dark-700 rounded-xl p-6">
                        <h2 className="text-xl font-bold text-white mb-4">Contact for Returns</h2>
                        <div className="text-silver-300">
                            <p>📞 Phone: <span className="text-accent-500">7356216468</span></p>
                            <p>📧 Email: <span className="text-accent-500">vorionnexustech@gmail.com</span></p>
                            <p className="text-sm text-silver-500 mt-2">Available: Mon-Sat, 10 AM - 7 PM</p>
                        </div>
                    </section>

                    <div className="text-center pt-6 border-t border-dark-700">
                        <p className="text-silver-500 text-sm">
                            Powered by <span className="text-accent-500">Vorion Nexus Technology</span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
