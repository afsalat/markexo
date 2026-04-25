'use client';

import { ArrowLeft, Truck, Clock, MapPin, Package } from 'lucide-react';
import Link from 'next/link';

export default function ShippingPolicyPage() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-dark-950 py-12">
            <div className="container mx-auto px-4 max-w-4xl">
                <Link href="/" className="inline-flex items-center gap-2 text-gray-500 dark:text-silver-400 hover:text-primary-600 dark:hover:text-accent-500 mb-6 transition-colors font-medium">
                    <ArrowLeft size={18} /> Back to Home
                </Link>

                <h1 className="font-display text-4xl font-bold text-gray-900 dark:text-white mb-8">Shipping Policy</h1>

                <div className="max-w-none space-y-6">
                    {/* Shipping Highlights */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white dark:bg-dark-800 border border-gray-100 dark:border-dark-700 rounded-xl p-4 text-center shadow-sm">
                            <Truck className="text-primary-600 dark:text-accent-500 mx-auto mb-2" size={28} />
                            <p className="font-bold text-gray-900 dark:text-white">Free Shipping</p>
                            <p className="text-xs text-gray-500 dark:text-silver-500">Above ₹500</p>
                        </div>
                        <div className="bg-white dark:bg-dark-800 border border-gray-100 dark:border-dark-700 rounded-xl p-4 text-center shadow-sm">
                            <Clock className="text-primary-600 dark:text-accent-500 mx-auto mb-2" size={28} />
                            <p className="font-bold text-gray-900 dark:text-white">5-10 Days</p>
                            <p className="text-xs text-gray-500 dark:text-silver-500">Delivery Time</p>
                        </div>
                        <div className="bg-white dark:bg-dark-800 border border-gray-100 dark:border-dark-700 rounded-xl p-4 text-center shadow-sm">
                            <MapPin className="text-primary-600 dark:text-accent-500 mx-auto mb-2" size={28} />
                            <p className="font-bold text-gray-900 dark:text-white">Pan India</p>
                            <p className="text-xs text-gray-500 dark:text-silver-500">Delivery</p>
                        </div>
                        <div className="bg-white dark:bg-dark-800 border border-gray-100 dark:border-dark-700 rounded-xl p-4 text-center shadow-sm">
                            <Package className="text-primary-600 dark:text-accent-500 mx-auto mb-2" size={28} />
                            <p className="font-bold text-gray-900 dark:text-white">Live Tracking</p>
                            <p className="text-xs text-gray-500 dark:text-silver-500">Order Status</p>
                        </div>
                    </div>

                    <section className="bg-white dark:bg-dark-800 border border-gray-100 dark:border-dark-700 rounded-xl p-6 shadow-sm">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Delivery Timeframes</h2>
                        <ul className="text-gray-600 dark:text-silver-400 space-y-2 list-disc list-inside">
                            <li><strong className="text-gray-900 dark:text-white">Metro Cities:</strong> 3-7 business days</li>
                            <li><strong className="text-gray-900 dark:text-white">Tier 2 Cities:</strong> 5-10 business days</li>
                            <li><strong className="text-gray-900 dark:text-white">Rural Areas:</strong> 7-14 business days</li>
                            <li><strong className="text-gray-900 dark:text-white">Remote Locations:</strong> 10-15 business days</li>
                        </ul>
                        <p className="text-orange-600 dark:text-yellow-400 text-sm mt-3 font-medium">
                            ⚠️ Times are estimates and may vary due to logistics, weather, or unforeseen circumstances.
                        </p>
                    </section>

                    <section className="bg-white dark:bg-dark-800 border border-gray-100 dark:border-dark-700 rounded-xl p-6 shadow-sm">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Shipping Charges</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full text-gray-600 dark:text-silver-400">
                                <thead>
                                    <tr className="border-b border-gray-100 dark:border-dark-600">
                                        <th className="text-left py-2 text-gray-900 dark:text-white">Order Value</th>
                                        <th className="text-right py-2 text-gray-900 dark:text-white">Shipping Charge</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b border-gray-50 dark:border-dark-700">
                                        <td className="py-2">Above ₹500</td>
                                        <td className="text-right text-primary-600 dark:text-accent-500 font-bold">FREE</td>
                                    </tr>
                                    <tr>
                                        <td className="py-2">Below ₹500</td>
                                        <td className="text-right">₹49</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <section className="bg-white dark:bg-dark-800 border border-gray-100 dark:border-dark-700 rounded-xl p-6 shadow-sm">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Order Processing</h2>
                        <ol className="text-gray-600 dark:text-silver-400 space-y-3 list-decimal list-inside">
                            <li>Order received and verified (1-2 hours)</li>
                            <li>Order confirmation call (within 24 hours)</li>
                            <li>Order dispatched from supplier warehouse</li>
                            <li>Tracking details shared via SMS</li>
                            <li>Out for delivery notification</li>
                            <li>Delivery & COD payment collection</li>
                        </ol>
                    </section>

                    <section className="bg-white dark:bg-dark-800 border border-gray-100 dark:border-dark-700 rounded-xl p-6 shadow-sm">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Non-Serviceable Areas</h2>
                        <p className="text-gray-600 dark:text-silver-400 leading-relaxed">
                            Some remote pincodes may not be serviceable. During checkout, you will be notified
                            if your pincode is not covered. We are continuously expanding our delivery network.
                        </p>
                    </section>

                    <section className="bg-white dark:bg-dark-800 border border-gray-100 dark:border-dark-700 rounded-xl p-6 shadow-sm">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Contact for Shipping Queries</h2>
                        <div className="text-gray-700 dark:text-silver-300">
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
