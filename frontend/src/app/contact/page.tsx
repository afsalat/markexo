'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Mail, Phone, MapPin, Send, CheckCircle, Store, Users, TrendingUp } from 'lucide-react';
import { API_BASE_URL } from '@/config/apiConfig';

export default function ContactPage() {
    const [formType, setFormType] = useState<'general' | 'partner'>('general');
    const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
        businessName: '',
        businessType: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('submitting');

        try {
            const response = await fetch(`${API_BASE_URL}/enquiries/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    subject: formType === 'partner' ? `Partner Inquiry: ${formData.businessName}` : formData.subject,
                    message: formType === 'partner'
                        ? `Business Name: ${formData.businessName}\nBusiness Type: ${formData.businessType}\nPhone: ${formData.phone}\n\n${formData.message}`
                        : formData.message
                })
            });

            if (response.ok) {
                setStatus('success');
                setFormData({ name: '', email: '', phone: '', subject: '', message: '', businessName: '', businessType: '' });
                setTimeout(() => setStatus('idle'), 5000);
            } else {
                setStatus('error');
            }
        } catch (error) {
            setStatus('error');
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Breadcrumb */}
            <div className="bg-white border-b border-gray-100">
                <div className="container mx-auto px-4 py-4">
                    <nav className="flex items-center gap-2 text-sm text-gray-500">
                        <Link href="/" className="hover:text-primary-600">Home</Link>
                        <ChevronRight size={16} />
                        <span className="text-gray-900 font-medium">Contact Us</span>
                    </nav>
                </div>
            </div>

            {/* Hero Section */}
            <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white py-16">
                <div className="container mx-auto px-4 text-center">
                    <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">Get in Touch</h1>
                    <p className="text-white/80 text-lg max-w-2xl mx-auto">
                        Have questions or want to partner with us? We'd love to hear from you!
                    </p>
                </div>
            </section>

            <div className="container mx-auto px-4 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Contact Info */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl p-6 shadow-sm">
                            <h2 className="font-display text-2xl font-bold text-gray-900 mb-6">Contact Information</h2>

                            <div className="space-y-4">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                        <Mail className="text-primary-600" size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 mb-1">Email</h3>
                                        <a href="mailto:support@vorionmart.in" className="text-primary-600 hover:underline">
                                            support@vorionmart.in
                                        </a>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                        <Phone className="text-green-600" size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 mb-1">Phone</h3>
                                        <a href="tel:+911234567890" className="text-primary-600 hover:underline">
                                            +91 735 621 6468
                                        </a>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                        <MapPin className="text-purple-600" size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 mb-1">Address</h3>
                                        <p className="text-gray-600">
                                            Vorion Nexus Technology<br />
                                            Kozhikode, Kerala<br />
                                            India
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Partner Benefits */}
                        <div className="bg-gradient-to-br from-accent-50 to-primary-50 rounded-2xl p-6">
                            <h3 className="font-bold text-lg text-gray-900 mb-4">Why Partner with Us?</h3>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                                        <Users className="text-white" size={16} />
                                    </div>
                                    <span className="text-gray-700">Reach 50,000+ customers</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                                        <TrendingUp className="text-white" size={16} />
                                    </div>
                                    <span className="text-gray-700">Grow your business</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                                        <Store className="text-white" size={16} />
                                    </div>
                                    <span className="text-gray-700">Zero investment required</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contact Form */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-2xl p-8 shadow-sm">
                            {/* Form Type Selector */}
                            <div className="flex gap-4 mb-8">
                                <button
                                    onClick={() => setFormType('general')}
                                    className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all ${formType === 'general'
                                        ? 'bg-primary-600 text-white shadow-lg'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    General Inquiry
                                </button>
                                <button
                                    onClick={() => setFormType('partner')}
                                    className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all ${formType === 'partner'
                                        ? 'bg-primary-600 text-white shadow-lg'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    Become a Partner
                                </button>
                            </div>

                            {status === 'success' ? (
                                <div className="bg-green-50 p-8 rounded-2xl text-center animate-fade-in">
                                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <CheckCircle size={32} />
                                    </div>
                                    <h3 className="text-xl font-bold text-green-900 mb-2">Message Sent!</h3>
                                    <p className="text-green-700 mb-6">
                                        {formType === 'partner'
                                            ? "Thank you for your interest in partnering with us! We'll contact you within 24 hours."
                                            : "Thank you for contacting us. We'll get back to you soon."}
                                    </p>
                                    <button
                                        onClick={() => setStatus('idle')}
                                        className="px-6 py-2 bg-white text-green-700 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
                                    >
                                        Send Another Message
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                {formType === 'partner' ? 'Your Name *' : 'Name *'}
                                            </label>
                                            <input
                                                type="text"
                                                name="name"
                                                required
                                                value={formData.name}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                                                placeholder="John Doe"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                                            <input
                                                type="email"
                                                name="email"
                                                required
                                                value={formData.email}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                                                placeholder="john@example.com"
                                            />
                                        </div>
                                    </div>

                                    {formType === 'partner' ? (
                                        <>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Business Name *</label>
                                                    <input
                                                        type="text"
                                                        name="businessName"
                                                        required
                                                        value={formData.businessName}
                                                        onChange={handleChange}
                                                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                                                        placeholder="Your Shop Name"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Business Type *</label>
                                                    <select
                                                        name="businessType"
                                                        required
                                                        value={formData.businessType}
                                                        onChange={handleChange}
                                                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                                                    >
                                                        <option value="">Select type</option>
                                                        <option value="electronics">Electronics</option>
                                                        <option value="fashion">Fashion</option>
                                                        <option value="home">Home & Living</option>
                                                        <option value="sports">Sports & Fitness</option>
                                                        <option value="books">Books & Media</option>
                                                        <option value="beauty">Beauty & Personal Care</option>
                                                        <option value="other">Other</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                                                <input
                                                    type="tel"
                                                    name="phone"
                                                    required
                                                    value={formData.phone}
                                                    onChange={handleChange}
                                                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                                                    placeholder="+91 98765 43210"
                                                />
                                            </div>
                                        </>
                                    ) : (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Subject *</label>
                                            <input
                                                type="text"
                                                name="subject"
                                                required
                                                value={formData.subject}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                                                placeholder="How can we help?"
                                            />
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Message *</label>
                                        <textarea
                                            name="message"
                                            required
                                            rows={6}
                                            value={formData.message}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all resize-none"
                                            placeholder={formType === 'partner' ? "Tell us about your business and why you'd like to partner with us..." : "Tell us more..."}
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={status === 'submitting'}
                                        className="w-full btn-primary py-4 text-lg font-bold flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {status === 'submitting' ? 'Sending...' : (
                                            <>
                                                Send Message <Send size={20} />
                                            </>
                                        )}
                                    </button>

                                    {status === 'error' && (
                                        <p className="text-red-600 text-center">Failed to send message. Please try again.</p>
                                    )}
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
