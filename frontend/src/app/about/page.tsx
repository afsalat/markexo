'use client';

import Link from 'next/link';
import { ChevronRight, Shield, Truck, CreditCard, Users, Award, CheckCircle, MapPin, Mail, Phone, Globe, Building2, Heart, Target, Zap, Star } from 'lucide-react';

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Breadcrumb */}
            <div className="bg-white border-b border-gray-100">
                <div className="container mx-auto px-4 py-4">
                    <nav className="flex items-center gap-2 text-sm text-gray-500">
                        <Link href="/" className="hover:text-primary-600">Home</Link>
                        <ChevronRight size={16} />
                        <span className="text-gray-900 font-medium">About Us</span>
                    </nav>
                </div>
            </div>

            {/* Hero Section */}
            <section className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white py-16 md:py-24 relative overflow-hidden">
                <div className="absolute inset-0">
                    <div className="absolute top-1/4 -right-20 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
                    <div className="absolute bottom-1/4 -left-20 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl" />
                </div>
                <div className="container mx-auto px-4 text-center relative z-10">
                    <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-2 rounded-full text-sm font-medium mb-6">
                        <Building2 size={16} />
                        <span>Vorion Nexus Technology</span>
                    </div>
                    <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                        About <span className="text-accent-400">VorionMart</span>
                    </h1>
                    <p className="text-white/80 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
                        India's trusted D2C marketplace connecting customers with verified sellers.
                        Premium products, Cash on Delivery, and a shopping experience you can trust.
                    </p>
                </div>
            </section>

            {/* Our Story */}
            <section className="py-16 md:py-20">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto">
                        <div className="text-center mb-12">
                            <div className="inline-flex items-center gap-2 rounded-full border border-accent-500/20 bg-accent-500/5 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-accent-600 mb-4">
                                <Heart size={14} className="fill-current" />
                                Our Story
                            </div>
                            <h2 className="font-display text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                                Built with Trust, Delivered with Care
                            </h2>
                        </div>
                        <div className="prose prose-lg max-w-none text-gray-600 space-y-6">
                            <p>
                                <strong className="text-gray-900">VorionMart</strong> is a premium Direct-to-Consumer (D2C) marketplace
                                operated by <strong className="text-gray-900">Vorion Nexus Technology</strong>, based in Kozhikode, Kerala, India.
                                We bridge the gap between quality manufacturers and discerning consumers who value authenticity,
                                convenience, and trust.
                            </p>
                            <p>
                                Our platform was founded with a simple mission: make premium shopping accessible to everyone in India,
                                with the convenience of Cash on Delivery. We understand that trust is earned, which is why every seller
                                on our platform goes through a rigorous verification process before their products go live.
                            </p>
                            <p>
                                From electronics to fashion, home textiles to beauty products — we curate the finest selection
                                of goods and deliver them right to your doorstep. You pay only when you receive your order,
                                ensuring complete peace of mind with every purchase.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Our Values */}
            <section className="py-16 bg-white">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center gap-2 rounded-full border border-primary-500/20 bg-primary-500/5 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary-600 mb-4">
                            <Target size={14} />
                            Our Values
                        </div>
                        <h2 className="font-display text-3xl md:text-4xl font-bold text-gray-900">
                            What We Stand For
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
                        {[
                            {
                                icon: <Shield size={28} />,
                                title: 'Trust & Transparency',
                                description: 'Every seller is verified. Every product is genuine. Every transaction is transparent.',
                                color: 'bg-blue-50 text-blue-600',
                            },
                            {
                                icon: <CreditCard size={28} />,
                                title: 'Cash on Delivery',
                                description: 'Pay only when you receive your order. No upfront payments, no risk.',
                                color: 'bg-green-50 text-green-600',
                            },
                            {
                                icon: <Award size={28} />,
                                title: 'Quality Assurance',
                                description: 'We partner with premium brands and manufacturers who meet our strict quality standards.',
                                color: 'bg-purple-50 text-purple-600',
                            },
                            {
                                icon: <Users size={28} />,
                                title: 'Customer First',
                                description: 'Dedicated support team available to assist you with any queries or concerns.',
                                color: 'bg-amber-50 text-amber-600',
                            },
                        ].map((value) => (
                            <div key={value.title} className="bg-gray-50 rounded-2xl p-6 text-center hover:shadow-lg transition-shadow duration-300">
                                <div className={`w-14 h-14 ${value.color} rounded-xl flex items-center justify-center mx-auto mb-4`}>
                                    {value.icon}
                                </div>
                                <h3 className="font-display text-lg font-bold text-gray-900 mb-2">{value.title}</h3>
                                <p className="text-sm text-gray-500 leading-relaxed">{value.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="py-16 bg-gray-50">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center gap-2 rounded-full border border-accent-500/20 bg-accent-500/5 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-accent-600 mb-4">
                            <Zap size={14} className="fill-current" />
                            How It Works
                        </div>
                        <h2 className="font-display text-3xl md:text-4xl font-bold text-gray-900">
                            Simple, Secure Shopping
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                        {[
                            { step: '01', title: 'Browse & Select', description: 'Explore our curated collection of premium products from verified sellers across India.' },
                            { step: '02', title: 'Place Your Order', description: 'Add items to your cart and place your order. No payment required upfront — just your delivery details.' },
                            { step: '03', title: 'Pay on Delivery', description: 'Receive your order at your doorstep and pay cash on delivery. Simple, safe, and hassle-free.' },
                        ].map((item) => (
                            <div key={item.step} className="text-center">
                                <div className="w-16 h-16 bg-accent-500 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 text-xl font-bold shadow-lg">
                                    {item.step}
                                </div>
                                <h3 className="font-display text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                                <p className="text-sm text-gray-500 leading-relaxed">{item.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Trust Indicators */}
            <section className="py-16 bg-white">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="font-display text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                            Why Customers Trust Us
                        </h2>
                        <p className="text-gray-500 max-w-2xl mx-auto">
                            We're committed to building a safe, reliable, and enjoyable shopping experience for every customer.
                        </p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
                        {[
                            { icon: <CheckCircle size={24} />, label: 'Verified Sellers', stat: '100%' },
                            { icon: <Truck size={24} />, label: 'Free Delivery', stat: 'All Orders' },
                            { icon: <Shield size={24} />, label: 'Secure Platform', stat: 'SSL Certified' },
                            { icon: <Star size={24} />, label: 'Customer Rating', stat: '4.8/5' },
                        ].map((item) => (
                            <div key={item.label} className="bg-gray-50 rounded-2xl p-6 text-center">
                                <div className="w-12 h-12 bg-accent-500/10 text-accent-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                                    {item.icon}
                                </div>
                                <p className="text-2xl font-bold text-gray-900 mb-1">{item.stat}</p>
                                <p className="text-xs text-gray-500 font-medium">{item.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Business Information - Critical for Google Merchant Center */}
            <section className="py-16 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto">
                        <div className="text-center mb-12">
                            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
                                Business Information
                            </h2>
                            <p className="text-gray-400">
                                Complete transparency about who we are and how to reach us.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Company Details */}
                            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                    <Building2 size={20} className="text-accent-400" />
                                    Company Details
                                </h3>
                                <dl className="space-y-3 text-sm">
                                    <div>
                                        <dt className="text-gray-400 text-xs uppercase tracking-wider mb-0.5">Legal Entity</dt>
                                        <dd className="font-semibold">Vorion Nexus Technology</dd>
                                    </div>
                                    <div>
                                        <dt className="text-gray-400 text-xs uppercase tracking-wider mb-0.5">Brand Name</dt>
                                        <dd className="font-semibold">VorionMart</dd>
                                    </div>
                                    <div>
                                        <dt className="text-gray-400 text-xs uppercase tracking-wider mb-0.5">Business Type</dt>
                                        <dd className="font-semibold">D2C E-Commerce Marketplace</dd>
                                    </div>
                                    <div>
                                        <dt className="text-gray-400 text-xs uppercase tracking-wider mb-0.5">Country of Operation</dt>
                                        <dd className="font-semibold">India</dd>
                                    </div>
                                </dl>
                            </div>

                            {/* Contact Details */}
                            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                    <Mail size={20} className="text-accent-400" />
                                    Contact Details
                                </h3>
                                <ul className="space-y-4 text-sm">
                                    <li className="flex items-start gap-3">
                                        <MapPin size={18} className="text-accent-400 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-semibold">Vorion Nexus Technology</p>
                                            <p className="text-gray-400">Thoppayil Beach C.25, O.P Nadakkavu</p>
                                            <p className="text-gray-400">Kozhikode, Kerala 673011, India</p>
                                        </div>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <Phone size={18} className="text-accent-400 shrink-0" />
                                        <a href="tel:+917356216468" className="hover:text-accent-400 transition-colors font-semibold">
                                            +91 735 621 6468
                                        </a>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <Mail size={18} className="text-accent-400 shrink-0" />
                                        <a href="mailto:vorionnexustech@gmail.com" className="hover:text-accent-400 transition-colors font-semibold">
                                            vorionnexustech@gmail.com
                                        </a>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <Globe size={18} className="text-accent-400 shrink-0" />
                                        <a href="https://vorionmart.com" className="hover:text-accent-400 transition-colors font-semibold">
                                            www.vorionmart.com
                                        </a>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        {/* Policies Quick Links */}
                        <div className="mt-8 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <Shield size={20} className="text-accent-400" />
                                Our Policies
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {[
                                    { href: '/return-refund-policy', label: 'Return & Refund Policy' },
                                    { href: '/shipping-policy', label: 'Shipping Policy' },
                                    { href: '/privacy-policy', label: 'Privacy Policy' },
                                    { href: '/terms-and-conditions', label: 'Terms & Conditions' },
                                ].map((policy) => (
                                    <Link
                                        key={policy.label}
                                        href={policy.href}
                                        className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-xs font-semibold text-center transition-colors"
                                    >
                                        {policy.label}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-16 bg-gray-50">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="font-display text-3xl font-bold text-gray-900 mb-4">
                        Ready to Start Shopping?
                    </h2>
                    <p className="text-gray-500 mb-8 max-w-xl mx-auto">
                        Browse our curated collection of premium products and experience the convenience of Cash on Delivery.
                    </p>
                    <div className="flex flex-wrap justify-center gap-4">
                        <Link
                            href="/products"
                            className="bg-accent-500 text-white px-8 py-4 rounded-xl font-bold text-sm hover:bg-accent-600 transition-colors shadow-lg"
                        >
                            Explore Products
                        </Link>
                        <Link
                            href="/contact"
                            className="bg-white text-gray-900 px-8 py-4 rounded-xl font-bold text-sm hover:bg-gray-100 transition-colors border border-gray-200"
                        >
                            Contact Us
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
