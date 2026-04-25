'use client';

import Link from 'next/link';
import { Facebook, Instagram, Mail, Phone, MapPin, Truck, Shield, CreditCard, Headphones, ChevronRight } from 'lucide-react';

export default function Footer() {
    return (
        <footer
            className="bg-gray-900 dark:bg-dark-950 text-gray-300 dark:text-silver-400"
        >
            {/* Trust Badges Strip */}
            <div className="border-b border-gray-800 dark:border-dark-800">
                <div className="max-w-7xl mx-auto px-4 py-4 md:py-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                        {[
                            { icon: <CreditCard size={22} />, title: 'Cash on Delivery', desc: 'Pay when you receive' },
                            { icon: <Truck size={22} />, title: 'Free Shipping', desc: 'Free Delivery on Every Order' },
                            { icon: <Shield size={22} />, title: 'Secure Checkout', desc: '100% protected' },
                            { icon: <Headphones size={22} />, title: '24/7 Support', desc: 'Always here to help' },
                        ].map((item) => (
                            <div key={item.title} className="flex items-center gap-3.5">
                                <div
                                    className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-gray-800 dark:bg-dark-800 text-accent-400"
                                >
                                    {item.icon}
                                </div>
                                <div>
                                    <h4 className="font-semibold text-sm text-white">{item.title}</h4>
                                    <p className="text-xs mt-0.5 text-gray-500">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Footer Content */}
            <div className="max-w-7xl mx-auto px-4 md:px-12 py-10 md:py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 md:gap-12 lg:gap-8">
                    {/* Brand Column */}
                    <div className="lg:col-span-4">
                        <Link href="/" className="inline-flex items-center group mb-6">
                            <img
                                src="/logo-white-text.png"
                                alt="VorionMart"
                                className="h-16 w-auto object-contain"
                            />
                        </Link>
                        <p className="text-sm leading-relaxed mb-6 max-w-xs text-gray-400">
                            Premium D2C platform bringing the future of shopping to your doorstep.
                            Pay on delivery, no hassles.
                        </p>
                        <div className="flex gap-3">
                            <a
                                href="#"
                                className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 bg-gray-800 dark:bg-dark-800 text-gray-400 hover:bg-accent-500 hover:text-white"
                            >
                                <Facebook size={18} />
                            </a>
                            <a
                                href="#"
                                className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 bg-gray-800 dark:bg-dark-800 text-gray-400 hover:bg-accent-500 hover:text-white"
                            >
                                <Instagram size={18} />
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="lg:col-span-2">
                        <h3 className="font-display font-semibold text-sm uppercase tracking-wider mb-5 text-white">
                            Quick Links
                        </h3>
                        <ul className="space-y-3">
                            {[
                                { href: '/products', label: 'All Collection' },
                                { href: '/products?featured=true', label: 'Trending Now' },
                                { href: '/track-order', label: 'Track Order' },
                            ].map((link) => (
                                <li key={link.label}>
                                    <Link
                                        href={link.href}
                                        className="group flex items-center gap-2 text-sm transition-colors duration-200 text-gray-400 hover:text-white"
                                    >
                                        <ChevronRight size={14} className="transition-transform duration-200 group-hover:translate-x-0.5 text-accent-500" />
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Customer Service */}
                    <div className="lg:col-span-3">
                        <h3 className="font-display font-semibold text-sm uppercase tracking-wider mb-5 text-white">
                            Customer Service
                        </h3>
                        <ul className="space-y-3">
                            {[
                                { href: '/contact', label: 'Contact Us' },
                                { href: '/shipping-policy', label: 'Shipping Policy' },
                                { href: '/return-refund-policy', label: 'Return & Refund Policy' },
                                { href: '/cod-disclaimer', label: 'COD Disclaimer' },
                            ].map((link) => (
                                <li key={link.label}>
                                    <Link
                                        href={link.href}
                                        className="group flex items-center gap-2 text-sm transition-colors duration-200 text-gray-400 hover:text-white"
                                    >
                                        <ChevronRight size={14} className="transition-transform duration-200 group-hover:translate-x-0.5 text-accent-500" />
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div className="lg:col-span-3">
                        <h3 className="font-display font-semibold text-sm uppercase tracking-wider mb-5 text-white">
                            Get in Touch
                        </h3>
                        <ul className="space-y-4">
                            <li>
                                <a href="tel:7356216468" className="flex items-center gap-3 group text-sm transition-colors duration-200 text-gray-400 hover:text-white">
                                    <div
                                        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-gray-800 dark:bg-dark-800"
                                    >
                                        <Phone size={16} className="text-accent-400" />
                                    </div>
                                    <span className="group-hover:underline">7356216468</span>
                                </a>
                            </li>
                            <li>
                                <a href="mailto:vorionnexustech@gmail.com" className="flex items-center gap-3 group text-sm transition-colors duration-200 text-gray-400 hover:text-white">
                                    <div
                                        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-gray-800 dark:bg-dark-800"
                                    >
                                        <Mail size={16} className="text-accent-400" />
                                    </div>
                                    <span className="group-hover:underline break-all">vorionnexustech@gmail.com</span>
                                </a>
                            </li>
                            <li className="flex items-start gap-3 text-sm text-gray-400">
                                <div
                                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 bg-gray-800 dark:bg-dark-800"
                                >
                                    <MapPin size={16} className="text-accent-400" />
                                </div>
                                <div>
                                    <span className="block font-semibold mb-0.5 text-gray-200">Vorion Nexus Technology</span>
                                    <span>Kozhikode, Kerala</span>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Legal Links */}
            <div className="border-t border-gray-800 dark:border-dark-800">
                <div className="max-w-7xl mx-auto px-6 lg:px-12 py-5">
                    <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
                        {[
                            { href: '/terms-and-conditions', label: 'Terms & Conditions' },
                            { href: '/privacy-policy', label: 'Privacy Policy' },
                            { href: '/shipping-policy', label: 'Shipping Policy' },
                            { href: '/return-refund-policy', label: 'Return Policy' },
                            { href: '/cod-disclaimer', label: 'COD Disclaimer' },
                        ].map((link) => (
                            <Link
                                key={link.label}
                                href={link.href}
                                className="text-xs transition-colors duration-200 text-gray-500 hover:text-accent-400"
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-gray-800 dark:border-dark-800">
                <div className="max-w-7xl mx-auto px-6 lg:px-12 py-5 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="text-center md:text-left">
                        <p className="text-sm text-gray-500">
                            &copy; 2026 VorionMart. All Rights Reserved.
                        </p>
                        <p className="text-xs mt-1 text-gray-600">
                            Powered by <span className="font-medium text-accent-400">Vorion Nexus Technology</span>
                        </p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Shield size={15} className="text-accent-400" />
                        <span>COD Only • Trusted Platform • Secure Delivery</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
