'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, ShoppingBag, MapPin, CreditCard, ArrowLeft, Truck, Shield, Clock, ChevronRight, AlertCircle, X, Minus, Plus } from 'lucide-react';
import { useCart } from '@/lib/cart';
import { useCustomerAuth } from '@/context/CustomerAuthContext';
import { API_BASE_URL } from '@/config/apiConfig';

export default function CheckoutPage() {
    const router = useRouter();
    const { items, totalAmount, clearCart, updateQuantity } = useCart();
    const { customer, isAuthenticated, isLoading, addresses } = useCustomerAuth();
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orderPlaced, setOrderPlaced] = useState(false);
    const [orderId, setOrderId] = useState('');
    const [phoneError, setPhoneError] = useState('');
    const [pincodeError, setPincodeError] = useState('');
    const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
    const [useNewAddress, setUseNewAddress] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        pincode: '',
        notes: '',
    });

    // Protect route - Redirect to login if not authenticated
    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login?redirect=/checkout');
        }
    }, [isLoading, isAuthenticated, router]);

    // Pre-fill form with customer data and default address
    useEffect(() => {
        if (isAuthenticated && customer) {
            // Always set email from customer
            setFormData(prev => ({
                ...prev,
                email: customer.email || '',
            }));

            // Find default address or use first address
            if (addresses.length > 0) {
                const defaultAddr = addresses.find(a => a.isDefault) || addresses[0];

                if (defaultAddr && !selectedAddressId) {
                    setSelectedAddressId(defaultAddr.id);
                    setUseNewAddress(false);
                    setFormData({
                        name: defaultAddr.name || customer.name || '',
                        email: customer.email || '',
                        phone: defaultAddr.phone || customer.phone || '',
                        address: defaultAddr.address || '',
                        city: defaultAddr.city || '',
                        pincode: defaultAddr.pincode || '',
                        notes: '',
                    });
                }
            } else {
                // No saved addresses - use new address form
                setUseNewAddress(true);
                setFormData(prev => ({
                    ...prev,
                    name: customer.name || '',
                    email: customer.email || '',
                    phone: customer.phone || '',
                }));
            }
        }
    }, [isAuthenticated, customer, addresses.length]);

    // Handle address selection
    const handleSelectAddress = (addrId: string) => {
        const addr = addresses.find(a => a.id === addrId);
        if (addr) {
            setSelectedAddressId(addrId);
            setUseNewAddress(false);
            setFormData(prev => ({
                ...prev,
                name: addr.name,
                email: customer?.email || prev.email, // Preserve email from customer
                phone: addr.phone,
                address: addr.address,
                city: addr.city,
                pincode: addr.pincode,
            }));
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));

        // Real-time phone validation
        if (name === 'phone') {
            if (value && !/^(0?[6-9]\d{9})$/.test(value)) {
                setPhoneError('Enter valid 10 or 11 digit mobile number');
            } else {
                setPhoneError('');
            }
        }

        // Real-time pincode validation
        if (name === 'pincode') {
            if (value && !/^[1-9][0-9]{5}$/.test(value)) {
                setPincodeError('Enter valid 6-digit pincode');
            } else {
                setPincodeError('');
            }
        }
    };

    const validateStep1 = () => {
        // Check if we have all required fields filled (from saved address or manual entry)
        if (!formData.name || !formData.phone || !formData.address || !formData.city || !formData.pincode) {
            // If using new address form, show error
            if (useNewAddress || addresses.length === 0) {
                setErrorMessage('Please fill in all required delivery fields');
            } else {
                setErrorMessage('Please select a delivery address');
            }
            return false;
        }

        // Validate phone number format
        if (!/^(0?[6-9]\d{9})$/.test(formData.phone)) {
            setPhoneError('Enter valid 10 or 11 digit mobile number');
            return false;
        }

        // Validate pincode format (6 digits, first digit non-zero)
        if (!/^[1-9][0-9]{5}$/.test(formData.pincode)) {
            setPincodeError('Enter valid 6-digit pincode');
            return false;
        }

        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // Validate email before submitting
            if (!formData.email || !formData.email.trim()) {
                setErrorMessage('Email address is required. Please provide your email.');
                setIsSubmitting(false);
                return;
            }

            // Prepare order data
            const orderData = {
                customer_name: formData.name,
                customer_email: formData.email,
                customer_phone: formData.phone,
                delivery_address: formData.address,
                delivery_city: formData.city,
                delivery_pincode: formData.pincode,
                notes: formData.notes,
                items: items.map(item => ({
                    product_id: item.product.id,
                    quantity: item.quantity
                }))
            };

            console.log('📦 Creating order with data:', orderData);

            // Call API to create order
            const apiUrl = `${API_BASE_URL}/orders/create/`;
            console.log('🌐 API URL:', apiUrl);

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(orderData),
            });

            console.log('📡 Response status:', response.status);

            const responseText = await response.text();
            console.log('📄 Response body:', responseText);

            if (!response.ok) {
                let errorData;
                try {
                    errorData = JSON.parse(responseText);
                } catch {
                    errorData = { error: responseText };
                }

                // Format validation errors for display
                let errorMessage = errorData.error || `Server error: ${response.status}`;
                if (errorData.details) {
                    const fieldErrors = Object.entries(errorData.details)
                        .map(([field, errors]: [string, any]) => {
                            const fieldName = field.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
                            return `${fieldName}: ${Array.isArray(errors) ? errors.join(', ') : errors}`;
                        })
                        .join('\n');
                    errorMessage = `Please fix the following errors:\n\n${fieldErrors}`;
                }

                throw new Error(errorMessage);
            }

            const orderResponse = JSON.parse(responseText);
            console.log('✅ Order created successfully:', orderResponse);

            setOrderId(orderResponse.order_id);
            setOrderPlaced(true);
            clearCart();
        } catch (error: any) {
            console.error('❌ Order creation error:', error);
            setErrorMessage(error.message || 'Failed to place order. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (items.length === 0 && !orderPlaced) {
        return (
            <div className="min-h-[80vh] flex flex-col items-center justify-center px-6 bg-gray-50" data-aos="fade-up">
                <div className="w-24 h-24 bg-accent-50 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-accent-500/10">
                    <ShoppingBag size={44} className="text-accent-400" />
                </div>
                <h1 className="font-display text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h1>
                <p className="text-gray-500 mb-8 font-medium text-sm text-center">Add some products before checkout.</p>
                <Link href="/products" className="btn-primary shadow-lg shadow-accent-500/20 px-8 py-3 rounded-2xl font-bold">
                    Browse Products
                </Link>
            </div>
        );
    }

    if (orderPlaced) {
        return (
            <div className="min-h-[80vh] flex flex-col items-center justify-center px-6 bg-gray-50 py-12" data-aos="fade-up">
                <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/20">
                    <Check size={44} className="text-emerald-500" strokeWidth={3} />
                </div>
                <h1 className="font-display text-3xl font-bold text-gray-900 mb-1">Order Placed!</h1>
                <p className="text-gray-500 font-medium mb-2 text-sm">Thank you for shopping with VorionMart</p>
                <p className="text-base font-bold text-accent-600 mb-8 bg-accent-50 px-4 py-1.5 rounded-full">Order ID: {orderId}</p>

                <div className="w-full max-w-sm space-y-3 mb-8">
                    <div className="bg-blue-50 border border-blue-100 shadow-sm rounded-2xl p-4">
                        <p className="text-blue-700 text-sm text-center font-medium">
                            📞 <span className="font-bold">Verification Call:</span> Our team will call you to confirm payment before dispatch.
                        </p>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-100 shadow-sm rounded-2xl p-4">
                        <p className="text-gray-700 text-sm text-center font-medium">
                            💳 <span className="font-bold text-gray-900">Payment confirmed</span> — Your order will be processed shortly
                        </p>
                    </div>
                </div>

                <div className="flex gap-3 w-full max-w-sm">
                    <Link href={`/track-order?id=${orderId}`} className="btn-primary flex-1 text-center py-3.5 rounded-2xl font-bold shadow-lg shadow-accent-500/20">
                        Track Order
                    </Link>
                    <Link href="/products" className="flex-1 text-center py-3.5 rounded-2xl font-bold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
                        Shop More
                    </Link>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-b-4 border-accent-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-0">
            {/* Mobile Compact Header */}
            <div className="lg:hidden bg-white border-b border-gray-100 px-4 py-3 sticky top-0 z-30 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                    <Link href="/cart" className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
                        <ArrowLeft size={18} />
                    </Link>
                    <h1 className="font-display text-lg font-bold text-gray-900">Checkout</h1>
                </div>
                {/* Mobile Progress Steps */}
                <div className="flex items-center gap-2">
                    {[
                        { num: 1, label: 'Delivery' },
                        { num: 2, label: 'Payment' },
                        { num: 3, label: 'Confirm' },
                    ].map((s, i) => (
                        <div key={s.num} className="flex items-center flex-1">
                            <div className={`flex items-center gap-1.5 ${ step >= s.num ? 'text-accent-600' : 'text-gray-400'}`}>
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                                    step > s.num ? 'bg-accent-500 text-white' : step === s.num ? 'bg-accent-50 text-accent-600 border-2 border-accent-500' : 'bg-gray-100 text-gray-400'
                                }`}>
                                    {step > s.num ? <Check size={12} strokeWidth={3} /> : s.num}
                                </div>
                                <span className="text-[11px] font-semibold">{s.label}</span>
                            </div>
                            {i < 2 && <div className={`flex-1 h-[2px] mx-1.5 rounded-full ${step > s.num ? 'bg-accent-500' : 'bg-gray-200'}`} />}
                        </div>
                    ))}
                </div>
            </div>

            {/* Desktop Header */}
            <div className="hidden lg:block bg-white border-b border-gray-200 shadow-sm">
                <div className="container mx-auto px-4 py-8">
                    <Link href="/cart" className="inline-flex items-center gap-2 text-gray-500 hover:text-accent-600 font-medium mb-4 transition-colors">
                        <ArrowLeft size={18} /> Back to Cart
                    </Link>
                    <h1 className="font-display text-3xl font-bold text-gray-900 tracking-tight">Checkout</h1>
                    <div className="flex items-center gap-4 mt-8">
                        {[
                            { num: 1, label: 'Delivery', icon: MapPin },
                            { num: 2, label: 'Payment', icon: CreditCard },
                            { num: 3, label: 'Confirm', icon: Check },
                        ].map((s, i) => (
                            <div key={s.num} className="flex items-center">
                                <div className={`flex items-center gap-2 ${step >= s.num ? 'text-accent-600' : 'text-gray-400'}`}>
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${step > s.num ? 'bg-accent-50 text-accent-600 shadow-sm border border-accent-100' : step === s.num ? 'bg-accent-50 text-accent-600 border-2 border-accent-500 shadow-sm' : 'bg-gray-100/80 border border-gray-200 text-gray-400'
                                        }`}>
                                        {step > s.num ? <Check size={18} strokeWidth={3} /> : <s.icon size={18} />}
                                    </div>
                                    <span className="hidden sm:block font-bold">{s.label}</span>
                                </div>
                                {i < 2 && <div className={`w-12 h-[2px] mx-3 rounded-full ${step > s.num ? 'bg-accent-500' : 'bg-gray-200'}`} />}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-0 lg:px-4 py-0 lg:py-10">
                <div className="flex flex-col lg:flex-row gap-0 lg:gap-8">
                    {/* Form Area */}
                    <div className="flex-1" data-aos="fade-right" data-aos-delay="100">
                        <form onSubmit={handleSubmit}>
                            {step === 1 && (
                                <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6 md:p-8 animate-fade-in">
                                    <h2 className="font-display text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                        <MapPin className="text-accent-500" /> Delivery Details
                                    </h2>

                                    {/* Saved Addresses Selection */}
                                    {addresses.length > 0 && (
                                        <div className="mb-8">
                                            <label className="block text-sm font-bold text-gray-700 mb-3">Select Delivery Address</label>
                                            <div className="space-y-3">
                                                {addresses.map((addr) => (
                                                    <button
                                                        key={addr.id}
                                                        type="button"
                                                        onClick={() => handleSelectAddress(addr.id)}
                                                        className={`w-full text-left p-5 rounded-xl border-2 transition-all ${selectedAddressId === addr.id && !useNewAddress
                                                            ? 'border-accent-500 bg-accent-50/50 shadow-sm'
                                                            : 'border-gray-100 hover:border-gray-200 bg-white shadow-sm'
                                                            }`}
                                                    >
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2 mb-1.5">
                                                                    <span className="font-bold text-gray-900">{addr.name}</span>
                                                                    <span className="text-[10px] uppercase font-bold tracking-wider bg-gray-100 border border-gray-200 text-gray-600 px-2.5 py-0.5 rounded-full">{addr.type}</span>
                                                                    {addr.isDefault && (
                                                                        <span className="text-[10px] uppercase font-bold tracking-wider bg-accent-50 border border-accent-100 text-accent-600 px-2.5 py-0.5 rounded-full">Default</span>
                                                                    )}
                                                                </div>
                                                                <p className="text-sm font-medium text-gray-600">{addr.address}</p>
                                                                <p className="text-sm font-medium text-gray-600">{addr.city} - <span className="font-bold">{addr.pincode}</span></p>
                                                                <p className="text-sm font-bold text-gray-500 mt-2 flex items-center gap-1"><span className="text-[10px]">📞</span> {addr.phone}</p>
                                                            </div>
                                                            {selectedAddressId === addr.id && !useNewAddress && (
                                                                <div className="w-5 h-5 bg-accent-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                                                                    <Check size={12} strokeWidth={4} className="text-white" />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </button>
                                                ))}

                                                {/* Add New Address Option */}
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setUseNewAddress(true);
                                                        setSelectedAddressId(null);
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            name: customer?.name || '',
                                                            phone: customer?.phone || '',
                                                            address: '',
                                                            city: '',
                                                            pincode: '',
                                                        }));
                                                    }}
                                                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${useNewAddress
                                                        ? 'border-accent-500 bg-accent-50/50 shadow-sm'
                                                        : 'border-dashed border-gray-300 hover:border-accent-400 bg-white'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-sm ${useNewAddress ? 'bg-accent-500 text-white' : 'bg-gray-100 text-gray-400 border border-gray-200'}`}>
                                                            {useNewAddress ? <Check size={14} strokeWidth={4} /> : <MapPin size={14} strokeWidth={2.5} />}
                                                        </div>
                                                        <span className={`font-bold ${useNewAddress ? 'text-accent-600' : 'text-gray-600'}`}>
                                                            + Add New Delivery Address
                                                        </span>
                                                    </div>
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Email field - Always visible */}
                                    <div className="mb-6">
                                        <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center justify-between">
                                            Email Address
                                            <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            required
                                            disabled={isAuthenticated}
                                            className={`input-field bg-gray-50 border border-gray-200 text-gray-900 focus:bg-white transition-colors ${isAuthenticated ? 'opacity-70 cursor-not-allowed bg-gray-100 text-gray-600 font-medium' : ''}`}
                                            placeholder="john@example.com"
                                        />
                                        <p className="text-xs font-medium text-gray-500 mt-1.5 flex items-center gap-1.5">
                                            {isAuthenticated
                                                ? <><Check size={12} className="text-green-500" /> Linked to your logged-in account</>
                                                : "We'll send order updates to this email"}
                                        </p>
                                    </div>

                                    {/* Show form fields only if using new address or editing selected address */}
                                    <div className={`${addresses.length > 0 && !useNewAddress ? 'hidden' : ''}`}>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center justify-between">Full Name <span className="text-red-500">*</span></label>
                                                <input
                                                    type="text"
                                                    name="name"
                                                    value={formData.name}
                                                    onChange={handleInputChange}
                                                    required
                                                    className="input-field bg-gray-50 border border-gray-200 text-gray-900 focus:bg-white transition-colors"
                                                    placeholder="John Doe"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center justify-between">Phone <span className="text-red-500">*</span></label>
                                                <input
                                                    type="tel"
                                                    name="phone"
                                                    value={formData.phone}
                                                    onChange={handleInputChange}
                                                    required
                                                    className={`input-field bg-gray-50 border-gray-200 text-gray-900 focus:bg-white transition-colors ${phoneError ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                                                    placeholder="9876543210"
                                                    maxLength={10}
                                                />
                                                {phoneError && <p className="text-red-500 font-medium text-xs mt-1.5">{phoneError}</p>}
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center justify-between">Address <span className="text-red-500">*</span></label>
                                                <textarea
                                                    name="address"
                                                    value={formData.address}
                                                    onChange={handleInputChange}
                                                    required
                                                    rows={3}
                                                    className="input-field resize-none bg-gray-50 border border-gray-200 text-gray-900 focus:bg-white transition-colors"
                                                    placeholder="House no, Street, Landmark..."
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center justify-between">City <span className="text-red-500">*</span></label>
                                                <input
                                                    type="text"
                                                    name="city"
                                                    value={formData.city}
                                                    onChange={handleInputChange}
                                                    required
                                                    className="input-field bg-gray-50 border border-gray-200 text-gray-900 focus:bg-white transition-colors"
                                                    placeholder="Mumbai"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center justify-between">Pincode <span className="text-red-500">*</span></label>
                                                <input
                                                    type="text"
                                                    name="pincode"
                                                    value={formData.pincode}
                                                    onChange={handleInputChange}
                                                    required
                                                    className={`input-field bg-gray-50 border-gray-200 text-gray-900 focus:bg-white transition-colors ${pincodeError ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                                                    placeholder="400001"
                                                    maxLength={6}
                                                />
                                                {pincodeError && <p className="text-red-500 font-medium text-xs mt-1.5">{pincodeError}</p>}
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-bold text-gray-700 mb-1.5">Order Notes (optional)</label>
                                                <textarea
                                                    name="notes"
                                                    value={formData.notes}
                                                    onChange={handleInputChange}
                                                    rows={2}
                                                    className="input-field resize-none bg-gray-50 border border-gray-200 text-gray-900 focus:bg-white transition-colors"
                                                    placeholder="Special instructions for delivery..."
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => validateStep1() && setStep(2)}
                                        className="btn-primary w-full mt-6"
                                    >
                                        Continue to Payment
                                    </button>
                                </div>
                            )}

                            {step === 2 && (
                                <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6 md:p-8 animate-fade-in">
                                    <h2 className="font-display text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                        <CreditCard className="text-accent-500" /> Payment Method
                                    </h2>

                                    {/* COD - Only Option */}
                                    <div className="p-6 border-2 border-accent-500 rounded-2xl bg-accent-50/50 shadow-sm">
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="w-12 h-12 bg-accent-100 rounded-xl flex items-center justify-center border border-accent-200">
                                                <span className="text-2xl">💵</span>
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-bold text-gray-900 text-lg">Cash on Delivery</p>
                                                <p className="text-sm font-medium text-gray-500">Pay when your order arrives</p>
                                            </div>
                                            <span className="bg-green-100 text-green-700 border border-green-200 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">COD Only</span>
                                        </div>

                                        {/* COD Trust Section */}
                                        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                                            <div className="flex items-center gap-3 text-sm font-medium text-gray-700">
                                                <Shield size={18} className="text-accent-500 flex-shrink-0" />
                                                <span>100% secure delivery • No prepayment required</span>
                                            </div>
                                            <div className="flex items-center gap-3 text-sm font-medium text-gray-700">
                                                <Truck size={18} className="text-accent-500 flex-shrink-0" />
                                                <span>Inspect your order before paying</span>
                                            </div>
                                            <div className="flex items-center gap-3 text-sm font-medium text-gray-700">
                                                <Clock size={18} className="text-accent-500 flex-shrink-0" />
                                                <span>Pay cash to delivery partner</span>
                                            </div>
                                        </div>

                                        {/* Amount to Pay */}
                                        <div className="mt-4 bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                                            <div className="flex justify-between items-center">
                                                <span className="font-bold text-gray-600">Amount to Pay on Delivery:</span>
                                                <span className="text-2xl font-black text-accent-600">₹{totalAmount.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-4 mt-8">
                                        <button
                                            type="button"
                                            onClick={() => setStep(1)}
                                            className="btn-ghost flex-1 font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                                        >
                                            Back
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setStep(3)}
                                            className="btn-primary flex-1 shadow-lg shadow-accent-500/20"
                                        >
                                            Review Order
                                        </button>
                                    </div>
                                </div>
                            )}

                            {step === 3 && (
                                <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6 md:p-8 animate-fade-in">
                                    <h2 className="font-display text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                        <Check className="text-accent-500" strokeWidth={3} /> Review & Confirm
                                    </h2>

                                    {/* Delivery Info */}
                                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-5 shadow-sm">
                                        <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                                            <Truck size={18} className="text-accent-500" /> Delivery Address
                                        </h3>
                                        <p className="font-bold text-gray-800">{formData.name}</p>
                                        <p className="font-medium text-gray-600 text-sm mt-1">{formData.address}</p>
                                        <p className="font-medium text-gray-600 text-sm">{formData.city} - <span className="font-bold">{formData.pincode}</span></p>
                                        <p className="font-bold text-gray-500 text-sm mt-2 flex items-center gap-1"><span className="text-[10px]">📞</span> {formData.phone}</p>
                                    </div>

                                    {/* Payment Method */}
                                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-6 shadow-sm">
                                        <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                                            <CreditCard size={18} className="text-accent-500" /> Payment Method
                                        </h3>
                                        <p className="font-bold text-gray-800">💵 Cash on Delivery</p>
                                        <p className="text-sm font-medium text-gray-500 mt-1">Pay <span className="font-bold text-gray-900">₹{totalAmount.toLocaleString()}</span> when your order arrives</p>
                                    </div>

                                    {/* Order Items */}
                                    <div className="border border-gray-200 rounded-xl p-5">
                                        <h3 className="font-bold text-gray-900 mb-4 pb-3 border-b border-gray-100">Order Items ({items.length})</h3>
                                        <div className="space-y-4">
                                            {items.map((item) => (
                                                <div key={item.product.id} className="flex justify-between items-center gap-4">
                                                    <div className="flex-1">
                                                        <p className="font-bold text-gray-900 leading-tight">{item.product.name}</p>
                                                        <p className="text-sm font-medium text-gray-500 mt-0.5">₹{item.product.current_price.toLocaleString()} each</p>
                                                    </div>

                                                    {/* Quantity Controls */}
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                                                            <button
                                                                onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                                                className="w-8 h-8 flex items-center justify-center hover:bg-gray-200 transition-colors text-gray-600 font-bold"
                                                            >
                                                                <Minus size={14} strokeWidth={3} />
                                                            </button>
                                                            <span className="w-8 text-center font-bold text-gray-900 text-sm">{item.quantity}</span>
                                                            <button
                                                                onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                                                className="w-8 h-8 flex items-center justify-center hover:bg-gray-200 transition-colors text-gray-600 font-bold"
                                                            >
                                                                <Plus size={14} strokeWidth={3} />
                                                            </button>
                                                        </div>
                                                        <p className="font-black text-gray-900 w-20 text-right">₹{(item.product.current_price * item.quantity).toLocaleString()}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex gap-4 mt-8">
                                        <button
                                            type="button"
                                            onClick={() => setStep(2)}
                                            className="btn-ghost flex-1 font-bold text-gray-600"
                                        >
                                            Back
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="btn-primary flex-1 shadow-lg shadow-accent-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isSubmitting ? 'Placing Order...' : 'Confirm Order'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </form>
                    </div>

                    {/* Order Summary */}
                    <div className="lg:w-96" data-aos="fade-left" data-aos-delay="200">
                        <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6 sticky top-24">
                            <h2 className="font-display text-xl font-bold text-gray-900 mb-6">Order Summary</h2>

                            <div className="space-y-4 mb-6">
                                {items.slice(0, 3).map((item) => (
                                    <div key={item.product.id} className="flex gap-4">
                                        <div className="w-16 h-16 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm relative overflow-hidden">
                                            {item.product.image ? (
                                                <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <ShoppingBag size={20} className="text-gray-400" />
                                            )}
                                            <span className="absolute -top-1 -right-1 bg-gray-900 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                                                {item.quantity}
                                            </span>
                                        </div>
                                        <div className="flex-1 min-w-0 flex justify-center flex-col">
                                            <p className="font-bold text-gray-900 text-sm line-clamp-2 leading-tight">{item.product.name}</p>
                                            <p className="font-black text-sm text-gray-900 mt-1">₹{(item.product.current_price * item.quantity).toLocaleString()}</p>
                                        </div>
                                    </div>
                                ))}
                                {items.length > 3 && (
                                    <p className="text-sm font-bold text-gray-500 text-center py-2 bg-gray-50 rounded-lg">+{items.length - 3} more items</p>
                                )}
                            </div>

                            <div className="border-t border-gray-100 pt-5 space-y-3">
                                <div className="flex justify-between text-sm font-medium">
                                    <span className="text-gray-600">Subtotal</span>
                                    <span className="text-gray-900">₹{totalAmount.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm font-medium">
                                    <span className="text-gray-600">Delivery</span>
                                    <span className="text-accent-600 font-bold bg-accent-50 px-2 rounded">FREE</span>
                                </div>
                                <div className="flex justify-between text-xl font-black pt-4 border-t border-gray-200 mt-2">
                                    <span className="text-gray-900">Total</span>
                                    <span className="text-gray-900">₹{totalAmount.toLocaleString()}</span>
                                </div>
                            </div>

                            {/* COD Payment Message */}
                            <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-4 shadow-sm">
                                <p className="text-sm text-green-700 text-center font-medium flex items-center justify-center gap-2">
                                    💵 Pay <span className="font-black text-green-800 text-lg">₹{totalAmount.toLocaleString()}</span> on delivery
                                </p>
                            </div>

                            {/* Trust Badges */}
                            <div className="mt-6 grid grid-cols-3 gap-2 text-center border-t border-gray-100 pt-4">
                                <div className="p-2">
                                    <Shield size={20} className="text-gray-400 mx-auto mb-1.5" />
                                    <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Secure</p>
                                </div>
                                <div className="p-2">
                                    <Truck size={20} className="text-gray-400 mx-auto mb-1.5" />
                                    <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Fast</p>
                                </div>
                                <div className="p-2">
                                    <Clock size={20} className="text-gray-400 mx-auto mb-1.5" />
                                    <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">24/7</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Error Modal */}
            {errorMessage && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl animate-scale-in border border-red-100">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 bg-red-50 border border-red-100">
                                <AlertCircle className="text-red-500" size={24} />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-display text-xl font-bold text-gray-900 mb-2">Error Occurred</h3>
                                <p className="text-gray-600 font-medium whitespace-pre-line text-sm">{errorMessage}</p>
                            </div>
                            <button
                                onClick={() => setErrorMessage('')}
                                className="text-gray-400 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                            >
                                <X size={16} strokeWidth={3} />
                            </button>
                        </div>
                        <button
                            onClick={() => setErrorMessage('')}
                            className="bg-gray-900 text-white font-bold rounded-xl py-3 w-full mt-6 hover:bg-black transition-colors"
                        >
                            Got it, return to checkout
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
