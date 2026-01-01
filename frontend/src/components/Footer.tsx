import Link from 'next/link';
import { Facebook, Instagram, Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="bg-gray-900 text-white">
            {/* Main Footer */}
            <div className="container mx-auto px-4 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {/* Brand */}
                    <div>
                        <Link href="/" className="flex items-center gap-2 mb-4">
                            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center">
                                <span className="text-white font-bold text-xl">M</span>
                            </div>
                            <div>
                                <h2 className="font-display font-bold text-xl">Markexo</h2>
                                <p className="text-xs text-gray-400 -mt-1">by Vorion Nexus Technology</p>
                            </div>
                        </Link>
                        <p className="text-gray-400 mb-4">
                            Your trusted local marketplace connecting you with the best shops in your city.
                        </p>
                        <div className="flex gap-4">
                            <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-primary-600 transition-colors">
                                <Facebook size={20} />
                            </a>
                            <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-primary-600 transition-colors">
                                <Instagram size={20} />
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="font-display font-semibold text-lg mb-4">Quick Links</h3>
                        <ul className="space-y-2">
                            <li><Link href="/products" className="text-gray-400 hover:text-white transition-colors">All Products</Link></li>
                            <li><Link href="/products?featured=true" className="text-gray-400 hover:text-white transition-colors">Featured</Link></li>
                            <li><Link href="/shops" className="text-gray-400 hover:text-white transition-colors">Our Shops</Link></li>
                            <li><Link href="/track-order" className="text-gray-400 hover:text-white transition-colors">Track Order</Link></li>
                        </ul>
                    </div>

                    {/* Customer Service */}
                    <div>
                        <h3 className="font-display font-semibold text-lg mb-4">Customer Service</h3>
                        <ul className="space-y-2">
                            <li><Link href="/contact" className="text-gray-400 hover:text-white transition-colors">Contact Us</Link></li>
                            <li><Link href="/faq" className="text-gray-400 hover:text-white transition-colors">FAQ</Link></li>
                            <li><Link href="/shipping" className="text-gray-400 hover:text-white transition-colors">Shipping Info</Link></li>
                            <li><Link href="/returns" className="text-gray-400 hover:text-white transition-colors">Returns Policy</Link></li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h3 className="font-display font-semibold text-lg mb-4">Contact Us</h3>
                        <ul className="space-y-3">
                            <li className="flex items-start gap-3">
                                <MapPin size={20} className="text-primary-500 flex-shrink-0 mt-1" />
                                <span className="text-gray-400">Vorion Nexus Technology, Your City, India</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Phone size={20} className="text-primary-500 flex-shrink-0" />
                                <a href="tel:+919876543210" className="text-gray-400 hover:text-white transition-colors">+91 98765 43210</a>
                            </li>
                            <li className="flex items-center gap-3">
                                <Mail size={20} className="text-primary-500 flex-shrink-0" />
                                <a href="mailto:support@markexo.com" className="text-gray-400 hover:text-white transition-colors">support@markexo.com</a>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-gray-800">
                <div className="container mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-gray-400 text-sm">
                        © {new Date().getFullYear()} Markexo. All rights reserved.
                    </p>
                    <div className="flex gap-6 text-sm">
                        <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</Link>
                        <Link href="/terms" className="text-gray-400 hover:text-white transition-colors">Terms of Service</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
