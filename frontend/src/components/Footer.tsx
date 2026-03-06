'use client';

import Link from 'next/link';
import { Facebook, Instagram, Mail, Phone, MapPin, Truck, Shield, CreditCard, Headphones } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="bg-dark-900 text-silver-300 border-t border-dark-700">
            {/* Trust Badges Strip */}
            <div className="border-b border-dark-700">
                <div className="container mx-auto px-4 py-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-dark-700 rounded-xl flex items-center justify-center text-accent-500">
                                <CreditCard size={24} />
                            </div>
                            <div>
                                <h4 className="font-semibold text-white text-sm">Cash on Delivery</h4>
                                <p className="text-xs text-silver-500">Pay when you receive</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-dark-700 rounded-xl flex items-center justify-center text-accent-500">
                                <Truck size={24} />
                            </div>
                            <div>
                                <h4 className="font-semibold text-white text-sm">Free Shipping</h4>
                                <p className="text-xs text-silver-500">On orders above ₹500</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-dark-700 rounded-xl flex items-center justify-center text-accent-500">
                                <Shield size={24} />
                            </div>
                            <div>
                                <h4 className="font-semibold text-white text-sm">Secure Checkout</h4>
                                <p className="text-xs text-silver-500">100% protected</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-dark-700 rounded-xl flex items-center justify-center text-accent-500">
                                <Headphones size={24} />
                            </div>
                            <div>
                                <h4 className="font-semibold text-white text-sm">24/7 Support</h4>
                                <p className="text-xs text-silver-500">Always here to help</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Footer */}
            <div className="container mx-auto px-4 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {/* Brand */}
                    <div>
                        <Link href="/" className="flex items-center group mb-4">
                            <img
                                src="/logo-white-text.png"
                                alt="VorionMart"
                                className="h-14 w-auto object-contain"
                            />
                        </Link>
                        <p className="text-silver-400 mb-4 text-sm leading-relaxed">
                            Premium D2C platform bringing the future of shopping to your doorstep. Pay on delivery, no hassles.
                        </p>
                        <div className="flex gap-3">
                            <a href="#" className="w-10 h-10 bg-dark-700 rounded-lg flex items-center justify-center text-silver-400 hover:bg-accent-500 hover:text-dark-900 transition-colors">
                                <Facebook size={18} />
                            </a>
                            <a href="#" className="w-10 h-10 bg-dark-700 rounded-lg flex items-center justify-center text-silver-400 hover:bg-accent-500 hover:text-dark-900 transition-colors">
                                <Instagram size={18} />
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="font-display font-semibold text-white text-lg mb-4">Quick Links</h3>
                        <ul className="space-y-2">
                            <li><Link href="/products" className="text-silver-400 hover:text-accent-500 transition-colors text-sm">All Collection</Link></li>
                            <li><Link href="/products?featured=true" className="text-silver-400 hover:text-accent-500 transition-colors text-sm">Trending Now</Link></li>
                            <li><Link href="/track-order" className="text-silver-400 hover:text-accent-500 transition-colors text-sm">Track Order</Link></li>
                        </ul>
                    </div>

                    {/* Customer Service */}
                    <div>
                        <h3 className="font-display font-semibold text-white text-lg mb-4">Customer Service</h3>
                        <ul className="space-y-2">
                            <li><Link href="/contact" className="text-silver-400 hover:text-accent-500 transition-colors text-sm">Contact Us</Link></li>
                            <li><Link href="/shipping-policy" className="text-silver-400 hover:text-accent-500 transition-colors text-sm">Shipping Policy</Link></li>
                            <li><Link href="/return-refund-policy" className="text-silver-400 hover:text-accent-500 transition-colors text-sm">Return & Refund Policy</Link></li>
                            <li><Link href="/cod-disclaimer" className="text-silver-400 hover:text-accent-500 transition-colors text-sm">COD Disclaimer</Link></li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h3 className="font-display font-semibold text-white text-lg mb-4">Contact Us</h3>
                        <ul className="space-y-3">
                            <li className="flex items-center gap-3 text-silver-400 text-sm">
                                <Phone size={18} className="text-accent-500 flex-shrink-0" />
                                <a href="tel:7356216468" className="hover:text-accent-500 transition-colors">7356216468</a>
                            </li>
                            <li><Link href="/contact" className="flex items-center gap-3 group text-silver-400 hover:text-accent-500 transition-colors text-sm">
                                <Mail size={18} className="text-accent-500 flex-shrink-0" />
                                <span>vorionnexustech@gmail.com</span>
                            </Link></li>
                            <li className="flex items-start gap-3 text-silver-400 text-sm">
                                <MapPin size={18} className="text-accent-500 flex-shrink-0 mt-1" />
                                <div>
                                    <span className="block font-semibold text-white">Head Office:</span>
                                    <span>Vorion Nexus Technology,<br />Kozhikode, Kerala</span>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Legal Links */}
            <div className="border-t border-dark-700">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex flex-wrap justify-center gap-4 text-sm">
                        <Link href="/terms-and-conditions" className="text-silver-500 hover:text-accent-500 transition-colors">Terms & Conditions</Link>
                        <Link href="/privacy-policy" className="text-silver-500 hover:text-accent-500 transition-colors">Privacy Policy</Link>
                        <Link href="/shipping-policy" className="text-silver-500 hover:text-accent-500 transition-colors">Shipping Policy</Link>
                        <Link href="/return-refund-policy" className="text-silver-500 hover:text-accent-500 transition-colors">Return Policy</Link>
                        <Link href="/cod-disclaimer" className="text-silver-500 hover:text-accent-500 transition-colors">COD Disclaimer</Link>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-dark-700">
                <div className="container mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="text-center md:text-left">
                        <p className="text-silver-500 text-sm">
                            &copy; 2026 VorionMart. All Rights Reserved.
                        </p>
                        <p className="text-xs text-silver-600 mt-1">
                            Powered by <span className="text-accent-500 font-medium">Vorion Nexus Technology</span>
                        </p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-silver-500">
                        <Shield size={16} className="text-accent-500" />
                        <span>COD Only • Trusted Platform • Secure Delivery</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
