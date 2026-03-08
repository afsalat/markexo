'use client';

import React from 'react';

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-dark-900 text-silver-300 py-16 px-4">
            <div className="container mx-auto max-w-4xl">
                <div className="bg-dark-800 border border-dark-600 rounded-2xl p-8 md:p-12 shadow-2xl">
                    <h1 className="font-display text-3xl md:text-4xl font-bold text-white mb-2">Terms & Conditions</h1>
                    <p className="text-silver-500 mb-8">Last Updated: January 01, 2026</p>

                    <div className="space-y-8 text-silver-300 leading-relaxed">
                        <section>
                            <p className="mb-4">
                                Welcome to <strong>VorionMart</strong>. By accessing, browsing, or using our website and placing an order,
                                you agree to comply with and be bound by the following Terms & Conditions. Please read them carefully before using our services.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-white mb-3">1. About VorionMart</h2>
                            <p>
                                VorionMart is a Direct-to-Consumer (D2C) ecommerce platform operating in India.
                                All products listed on VorionMart are offered under the VorionMart brand and fulfilled through verified logistics and supply partners.
                            </p>
                            <div className="mt-4 p-4 bg-dark-700/50 rounded-xl border border-dark-600">
                                <p className="font-semibold text-white mb-2">VorionMart Platform</p>
                                <p>📞 Phone: 7356216468</p>
                                <p>📧 Email: support@vorionmart.in</p>
                                <p className="mt-2 text-sm text-silver-500">Powered by Vorion Nexus Technology</p>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-white mb-3">2. Eligibility</h2>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>You must be 18 years or older to place an order.</li>
                                <li>You agree to provide accurate, complete, and truthful information during checkout.</li>
                                <li>VorionMart reserves the right to cancel orders if false or misleading information is detected.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-white mb-3">3. Products & Pricing</h2>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>All prices are listed in Indian Rupees (INR).</li>
                                <li>Prices and product availability are subject to change without prior notice.</li>
                                <li>Product images are for illustration purposes only; slight variations may occur.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-white mb-3">4. Payment Policy (Cash on Delivery – COD)</h2>
                            <div className="p-4 bg-accent-500/10 border border-accent-500/30 rounded-xl mb-4">
                                <p className="text-white font-medium">VorionMart operates on a STRICT Cash on Delivery (COD) only model.</p>
                            </div>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>Customers must pay the full amount in cash at the time of delivery.</li>
                                <li>No online, prepaid, or digital payment methods are accepted.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-white mb-3">5. Order Confirmation & Verification</h2>
                            <p className="mb-2">To reduce fraud and ensure successful delivery:</p>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>All COD orders may undergo manual verification via phone call or message.</li>
                                <li>Orders that cannot be verified may be cancelled without prior notice.</li>
                                <li>VorionMart reserves the right to accept or reject any order at its discretion.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-white mb-3">6. Shipping & Delivery</h2>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>Delivery timelines provided are estimated and may vary due to location, logistics, weather, or courier issues.</li>
                                <li>VorionMart is not responsible for delays caused by third-party delivery partners.</li>
                                <li>Customers must be available at the delivery address to receive the order.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-white mb-3">7. Return to Origin (RTO) Policy</h2>
                            <p className="mb-2">RTO (Return to Origin) occurs when an order is returned due to unsuccessful delivery.</p>
                            <p className="mb-2">Common RTO reasons include:</p>
                            <ul className="list-disc pl-5 space-y-2 mb-4">
                                <li>Customer refusal at delivery</li>
                                <li>Incorrect or incomplete address</li>
                                <li>Unreachable phone number</li>
                                <li>Customer unavailable during delivery attempts</li>
                            </ul>
                            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                                <p className="font-bold text-red-400 mb-1">Important Notice:</p>
                                <p>Repeated RTOs from the same phone number or address may result in COD restrictions or temporary/permanent blocking.</p>
                                <p className="mt-1 text-sm opacity-80">VorionMart actively tracks RTO behavior to prevent misuse and losses.</p>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-white mb-3">8. Order Cancellation</h2>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>Orders can be cancelled before shipment only.</li>
                                <li>Once shipped, cancellation requests may not be accepted.</li>
                                <li>Refusing delivery without a valid reason may be recorded as an RTO.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-white mb-3">9. Returns & Refunds</h2>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>Returns are accepted only for damaged, defective, or incorrect products, subject to verification.</li>
                                <li>As payments are COD, approved refunds will be processed via UPI or bank transfer.</li>
                                <li>Refund processing time: 7–10 business days after approval.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-white mb-3">10. Customer Responsibilities</h2>
                            <p className="mb-2">You agree not to:</p>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>Place fake, prank, or test orders</li>
                                <li>Refuse delivery without genuine reason</li>
                                <li>Provide incorrect address or phone details</li>
                                <li>Abuse delivery staff or customer support</li>
                                <li>Use the platform for illegal or fraudulent activities</li>
                            </ul>
                            <p className="mt-2 text-red-400">Violation may result in account blocking and legal action if necessary.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-white mb-3">11. Intellectual Property Rights</h2>
                            <p>
                                All website content including logos, designs, images, text, and graphics are the exclusive property of VorionMart.
                                Unauthorized use, copying, modification, or redistribution is strictly prohibited.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-white mb-3">12. Limitation of Liability</h2>
                            <p>VorionMart shall not be liable for:</p>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>Indirect or consequential damages</li>
                                <li>Losses due to delivery delays or courier issues</li>
                                <li>Customer unavailability or incorrect information</li>
                                <li>Events beyond reasonable control</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-white mb-3">13. Changes to Terms</h2>
                            <p>
                                VorionMart reserves the right to update or modify these Terms & Conditions at any time without prior notice.
                                Continued use of the platform constitutes acceptance of the revised terms.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-white mb-3">14. Governing Law & Jurisdiction</h2>
                            <p>
                                These Terms & Conditions are governed by the laws of India.
                                All disputes shall be subject to the jurisdiction of Indian courts.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-white mb-3">15. Contact Information</h2>
                            <p className="mb-2">For any queries, support, or concerns:</p>
                            <p>📞 Phone: 7356216468</p>
                            <p>📧 Email: support@vorionmart.in</p>
                            <p className="mt-2 text-sm text-silver-500">Customer support is available during standard business hours.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-white mb-3">16. Platform Ownership & Technology</h2>
                            <p>
                                This website and ecommerce platform are operated by <strong>VorionMart</strong> and are
                                <strong> Powered by Vorion Nexus Technology</strong>.
                            </p>
                            <p className="mt-2 text-sm text-silver-500">
                                Vorion Nexus Technology manages the platform’s technical infrastructure, security, and system operations.
                            </p>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}
