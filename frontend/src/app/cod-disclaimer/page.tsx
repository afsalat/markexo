'use client';

import React from 'react';
import { Truck, Shield, AlertTriangle } from 'lucide-react';

export default function CodDisclaimerPage() {
    return (
        <div className="min-h-screen bg-dark-900 text-silver-300 py-16 px-4">
            <div className="container mx-auto max-w-3xl">
                <div className="bg-dark-800 border border-dark-600 rounded-2xl p-8 md:p-12 shadow-2xl">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 bg-accent-500/10 rounded-xl flex items-center justify-center text-accent-500">
                            <Truck size={28} />
                        </div>
                        <h1 className="font-display text-3xl font-bold text-white">Cash on Delivery (COD) Disclaimer</h1>
                    </div>

                    <div className="space-y-6 text-silver-300 leading-relaxed text-lg">
                        <p className="p-4 bg-accent-500/10 border border-accent-500/30 rounded-xl text-white font-medium">
                            VorionMart operates on a <strong>COD Only</strong> model. All orders are subject to verification.
                        </p>

                        {/* Key Notice */}
                        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                            <p className="text-amber-400 font-semibold text-center">
                                ⚠️ All Cash on Delivery orders are subject to verification. VorionMart reserves the right to cancel unverified or suspicious orders.
                            </p>
                        </div>

                        <ul className="space-y-4">
                            <li className="flex items-start gap-3">
                                <Shield className="text-accent-500 mt-1 flex-shrink-0" />
                                <span>All orders will be verified via call or WhatsApp before dispatch.</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <Shield className="text-accent-500 mt-1 flex-shrink-0" />
                                <span>Please ensure your phone number and pincode are correct and reachable.</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <AlertTriangle className="text-red-500 mt-1 flex-shrink-0" />
                                <span>Fake, duplicate, or unverified orders will be cancelled automatically.</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <AlertTriangle className="text-red-500 mt-1 flex-shrink-0" />
                                <span>Refusal at delivery will be marked as RTO (Return to Origin).</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <AlertTriangle className="text-red-500 mt-1 flex-shrink-0" />
                                <span>Repeated RTOs or order cancellations may result in COD restriction or account blocking.</span>
                            </li>
                        </ul>

                        <div className="mt-8 pt-6 border-t border-dark-700">
                            <p className="font-semibold text-white">
                                By placing a COD order, you agree to accept and pay the full amount upon delivery. Orders are fulfilled by VorionMart through our verified logistics partners.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
