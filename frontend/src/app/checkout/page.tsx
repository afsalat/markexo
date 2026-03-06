'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, ShoppingBag, MapPin, CreditCard, ArrowLeft, Truck, Shield, Clock, ChevronRight, AlertCircle, X, Minus, Plus } from 'lucide-react';
import { useCart } from '@/lib/cart';
import { useCustomerAuth } from '@/context/CustomerAuthContext';

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
            const apiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api'}/orders/create/`;
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
            <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 bg-dark-900">
                <ShoppingBag size={80} className="text-dark-600 mb-6" />
                <h1 className="font-display text-2xl font-bold text-white mb-2">Your cart is empty</h1>
                <p className="text-silver-500 mb-8">Add some products before checkout.</p>
                <Link href="/products" className="btn-primary">
                    Browse Products
                </Link>
            </div>
        );
    }

    if (orderPlaced) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 bg-dark-900 py-12">
                <div className="w-20 h-20 bg-accent-500/20 rounded-full flex items-center justify-center mb-6 animate-bounce">
                    <Check size={40} className="text-accent-500" />
                </div>
                <h1 className="font-display text-3xl font-bold text-white mb-2">Order Placed!</h1>
                <p className="text-silver-400 mb-2">Thank you for shopping with VorionMart</p>
                <p className="text-lg font-semibold text-accent-500 mb-8">Order ID: {orderId}</p>

                <div className="w-full max-w-md space-y-4 mb-8">
                    {/* Payment Verification Notice */}
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                        <p className="text-blue-400 text-sm text-center">
                            📞 <span className="font-semibold">Verification Call:</span> Our team will call you to confirm payment before dispatch.
                        </p>
                    </div>

                    {/* Payment Confirmation */}
                    <div className="bg-accent-500/10 border border-accent-500/30 rounded-xl p-4">
                        <p className="text-silver-300 text-center">
                            💳 <span className="font-semibold text-white">Payment confirmed</span>
                        </p>
                        <p className="text-sm text-silver-400 mt-1 text-center">Your order will be processed shortly</p>
                    </div>
                </div>

                <div className="flex gap-4">
                    <Link href={`/track-order?id=${orderId}`} className="btn-primary">
                        Track Order
                    </Link>
                    <Link href="/products" className="btn-secondary">
                        Continue Shopping
                    </Link>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-dark-900 text-white flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-dark-900">
            {/* Page Header */}
            <div className="bg-dark-800 border-b border-dark-700">
                <div className="container mx-auto px-4 py-6">
                    <Link href="/cart" className="inline-flex items-center gap-2 text-silver-400 hover:text-accent-500 mb-4 transition-colors">
                        <ArrowLeft size={18} /> Back to Cart
                    </Link>
                    <h1 className="font-display text-3xl font-bold text-white">Checkout</h1>

                    {/* Progress Steps */}
                    <div className="flex items-center gap-4 mt-6">
                        {[
                            { num: 1, label: 'Delivery', icon: MapPin },
                            { num: 2, label: 'Payment', icon: CreditCard },
                            { num: 3, label: 'Confirm', icon: Check },
                        ].map((s, i) => (
                            <div key={s.num} className="flex items-center">
                                <div className={`flex items-center gap-2 ${step >= s.num ? 'text-accent-500' : 'text-silver-600'}`}>
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step > s.num ? 'bg-accent-500 text-dark-900' : step === s.num ? 'bg-accent-500/20 text-accent-500 border border-accent-500' : 'bg-dark-700'
                                        }`}>
                                        {step > s.num ? <Check size={20} /> : <s.icon size={20} />}
                                    </div>
                                    <span className="hidden sm:block font-medium">{s.label}</span>
                                </div>
                                {i < 2 && <div className={`w-12 h-0.5 mx-2 ${step > s.num ? 'bg-accent-500' : 'bg-dark-600'}`} />}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Form Area */}
                    <div className="flex-1">
                        <form onSubmit={handleSubmit}>
                            {step === 1 && (
                                <div className="bg-dark-800 border border-dark-700 rounded-2xl p-6 animate-fade-in">
                                    <h2 className="font-display text-xl font-bold text-white mb-6 flex items-center gap-2">
                                        <MapPin className="text-accent-500" /> Delivery Details
                                    </h2>

                                    {/* Saved Addresses Selection */}
                                    {addresses.length > 0 && (
                                        <div className="mb-6">
                                            <label className="block text-sm font-medium text-silver-300 mb-3">Select Delivery Address</label>
                                            <div className="space-y-3">
                                                {addresses.map((addr) => (
                                                    <button
                                                        key={addr.id}
                                                        type="button"
                                                        onClick={() => handleSelectAddress(addr.id)}
                                                        className={`w-full text-left p-4 rounded-xl border transition-all ${selectedAddressId === addr.id && !useNewAddress
                                                            ? 'border-accent-500 bg-accent-500/10'
                                                            : 'border-dark-600 hover:border-dark-500 bg-dark-700'
                                                            }`}
                                                    >
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <span className="font-semibold text-white">{addr.name}</span>
                                                                    <span className="text-xs bg-dark-600 text-silver-400 px-2 py-0.5 rounded uppercase">{addr.type}</span>
                                                                    {addr.isDefault && (
                                                                        <span className="text-xs bg-accent-500/20 text-accent-500 px-2 py-0.5 rounded">Default</span>
                                                                    )}
                                                                </div>
                                                                <p className="text-sm text-silver-400">{addr.address}</p>
                                                                <p className="text-sm text-silver-400">{addr.city} - {addr.pincode}</p>
                                                                <p className="text-sm text-silver-500 mt-1">📞 {addr.phone}</p>
                                                            </div>
                                                            {selectedAddressId === addr.id && !useNewAddress && (
                                                                <div className="w-6 h-6 bg-accent-500 rounded-full flex items-center justify-center flex-shrink-0">
                                                                    <Check size={14} className="text-dark-900" />
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
                                                    className={`w-full text-left p-4 rounded-xl border transition-all ${useNewAddress
                                                        ? 'border-accent-500 bg-accent-500/10'
                                                        : 'border-dashed border-dark-600 hover:border-dark-500'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${useNewAddress ? 'bg-accent-500' : 'bg-dark-600'}`}>
                                                            {useNewAddress ? <Check size={16} className="text-dark-900" /> : <MapPin size={16} className="text-silver-400" />}
                                                        </div>
                                                        <span className={`font-medium ${useNewAddress ? 'text-accent-500' : 'text-silver-400'}`}>
                                                            + Add New Delivery Address
                                                        </span>
                                                    </div>
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Email field - Always visible */}
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-silver-300 mb-1">Email *</label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            required
                                            disabled={isAuthenticated}
                                            className={`input-field ${isAuthenticated ? 'opacity-60 cursor-not-allowed bg-dark-800' : ''}`}
                                            placeholder="john@example.com"
                                        />
                                        <p className="text-xs text-silver-500 mt-1">
                                            {isAuthenticated
                                                ? "Linked to your logged-in account"
                                                : "We'll send order updates to this email"}
                                        </p>
                                    </div>

                                    {/* Show form fields only if using new address or editing selected address */}
                                    <div className={`${addresses.length > 0 && !useNewAddress ? 'hidden' : ''}`}>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-silver-300 mb-1">Full Name *</label>
                                                <input
                                                    type="text"
                                                    name="name"
                                                    value={formData.name}
                                                    onChange={handleInputChange}
                                                    required
                                                    className="input-field"
                                                    placeholder="John Doe"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-silver-300 mb-1">Phone *</label>
                                                <input
                                                    type="tel"
                                                    name="phone"
                                                    value={formData.phone}
                                                    onChange={handleInputChange}
                                                    required
                                                    className={`input-field ${phoneError ? 'input-field-error' : ''}`}
                                                    placeholder="9876543210"
                                                    maxLength={10}
                                                />
                                                {phoneError && <p className="text-red-400 text-xs mt-1">{phoneError}</p>}
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-silver-300 mb-1">Address *</label>
                                                <textarea
                                                    name="address"
                                                    value={formData.address}
                                                    onChange={handleInputChange}
                                                    required
                                                    rows={3}
                                                    className="input-field resize-none"
                                                    placeholder="House no, Street, Landmark..."
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-silver-300 mb-1">City *</label>
                                                <input
                                                    type="text"
                                                    name="city"
                                                    value={formData.city}
                                                    onChange={handleInputChange}
                                                    required
                                                    className="input-field"
                                                    placeholder="Mumbai"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-silver-300 mb-1">Pincode *</label>
                                                <input
                                                    type="text"
                                                    name="pincode"
                                                    value={formData.pincode}
                                                    onChange={handleInputChange}
                                                    required
                                                    className={`input-field ${pincodeError ? 'input-field-error' : ''}`}
                                                    placeholder="400001"
                                                    maxLength={6}
                                                />
                                                {pincodeError && <p className="text-red-400 text-xs mt-1">{pincodeError}</p>}
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-silver-300 mb-1">Order Notes (optional)</label>
                                                <textarea
                                                    name="notes"
                                                    value={formData.notes}
                                                    onChange={handleInputChange}
                                                    rows={2}
                                                    className="input-field resize-none"
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
                                <div className="bg-dark-800 border border-dark-700 rounded-2xl p-6 animate-fade-in">
                                    <h2 className="font-display text-xl font-bold text-white mb-6 flex items-center gap-2">
                                        <CreditCard className="text-accent-500" /> Payment Method
                                    </h2>

                                    {/* COD - Only Option */}
                                    <div className="p-6 border-2 border-accent-500 rounded-2xl bg-accent-500/10">
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="w-12 h-12 bg-accent-500 rounded-xl flex items-center justify-center">
                                                <span className="text-2xl">💵</span>
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-bold text-white text-lg">Cash on Delivery</p>
                                                <p className="text-sm text-silver-400">Pay when your order arrives</p>
                                            </div>
                                            <span className="badge badge-cod px-3 py-1">COD Only</span>
                                        </div>

                                        {/* COD Trust Section */}
                                        <div className="bg-dark-700/50 rounded-xl p-4 space-y-3">
                                            <div className="flex items-center gap-3 text-sm text-silver-300">
                                                <Shield size={18} className="text-accent-500 flex-shrink-0" />
                                                <span>100% secure delivery • No prepayment required</span>
                                            </div>
                                            <div className="flex items-center gap-3 text-sm text-silver-300">
                                                <Truck size={18} className="text-accent-500 flex-shrink-0" />
                                                <span>Inspect your order before paying</span>
                                            </div>
                                            <div className="flex items-center gap-3 text-sm text-silver-300">
                                                <Clock size={18} className="text-accent-500 flex-shrink-0" />
                                                <span>Pay cash to delivery partner</span>
                                            </div>
                                        </div>

                                        {/* Amount to Pay */}
                                        <div className="mt-4 bg-dark-800 rounded-xl p-4 border border-dark-600">
                                            <div className="flex justify-between items-center">
                                                <span className="text-silver-400">Amount to Pay on Delivery:</span>
                                                <span className="text-2xl font-bold text-accent-500">₹{totalAmount.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-4 mt-6">
                                        <button
                                            type="button"
                                            onClick={() => setStep(1)}
                                            className="btn-ghost flex-1"
                                        >
                                            Back
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setStep(3)}
                                            className="btn-primary flex-1"
                                        >
                                            Review Order
                                        </button>
                                    </div>
                                </div>
                            )}

                            {step === 3 && (
                                <div className="bg-dark-800 border border-dark-700 rounded-2xl p-6 animate-fade-in">
                                    <h2 className="font-display text-xl font-bold text-white mb-6 flex items-center gap-2">
                                        <Check className="text-accent-500" /> Review & Confirm
                                    </h2>

                                    {/* Delivery Info */}
                                    <div className="bg-dark-700 rounded-xl p-4 mb-4">
                                        <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
                                            <Truck size={18} className="text-accent-500" /> Delivery Address
                                        </h3>
                                        <p className="text-white">{formData.name}</p>
                                        <p className="text-silver-400 text-sm">{formData.address}</p>
                                        <p className="text-silver-400 text-sm">{formData.city} - {formData.pincode}</p>
                                        <p className="text-silver-400 text-sm">{formData.phone}</p>
                                    </div>

                                    {/* Payment Method */}
                                    <div className="bg-dark-700 rounded-xl p-4 mb-4">
                                        <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
                                            <CreditCard size={18} className="text-accent-500" /> Payment Method
                                        </h3>
                                        <p className="text-white">💵 Cash on Delivery</p>
                                        <p className="text-sm text-silver-400 mt-1">Pay ₹{totalAmount.toLocaleString()} when your order arrives</p>
                                    </div>

                                    {/* Order Items */}
                                    <div className="border-t border-dark-600 pt-4">
                                        <h3 className="font-semibold text-white mb-4">Order Items ({items.length})</h3>
                                        <div className="space-y-3">
                                            {items.map((item) => (
                                                <div key={item.product.id} className="flex justify-between items-center gap-4">
                                                    <div className="flex-1">
                                                        <p className="font-medium text-white">{item.product.name}</p>
                                                        <p className="text-sm text-silver-500">₹{item.product.current_price.toLocaleString()} each</p>
                                                    </div>

                                                    {/* Quantity Controls */}
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex items-center border border-dark-600 rounded-lg overflow-hidden">
                                                            <button
                                                                onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                                                className="w-8 h-8 flex items-center justify-center hover:bg-dark-700 transition-colors text-silver-300"
                                                            >
                                                                <Minus size={14} />
                                                            </button>
                                                            <span className="w-10 text-center font-medium text-white text-sm">{item.quantity}</span>
                                                            <button
                                                                onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                                                className="w-8 h-8 flex items-center justify-center hover:bg-dark-700 transition-colors text-silver-300"
                                                            >
                                                                <Plus size={14} />
                                                            </button>
                                                        </div>
                                                        <p className="font-semibold text-white w-20 text-right">₹{(item.product.current_price * item.quantity).toLocaleString()}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex gap-4 mt-6">
                                        <button
                                            type="button"
                                            onClick={() => setStep(2)}
                                            className="btn-ghost flex-1"
                                        >
                                            Back
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="btn-primary flex-1 disabled:opacity-50"
                                        >
                                            {isSubmitting ? 'Placing Order...' : 'Place Order'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </form>
                    </div>

                    {/* Order Summary */}
                    <div className="lg:w-96">
                        <div className="bg-dark-800 border border-dark-700 rounded-2xl p-6 sticky top-24">
                            <h2 className="font-display text-xl font-bold text-white mb-6">Order Summary</h2>

                            <div className="space-y-3 mb-4">
                                {items.slice(0, 3).map((item) => (
                                    <div key={item.product.id} className="flex gap-3">
                                        <div className="w-14 h-14 bg-dark-700 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <ShoppingBag size={20} className="text-dark-500" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-white text-sm line-clamp-1">{item.product.name}</p>
                                            <p className="text-sm text-silver-500">×{item.quantity}</p>
                                        </div>
                                        <p className="font-semibold text-sm text-white">₹{(item.product.current_price * item.quantity).toLocaleString()}</p>
                                    </div>
                                ))}
                                {items.length > 3 && (
                                    <p className="text-sm text-silver-500 text-center">+{items.length - 3} more items</p>
                                )}
                            </div>

                            <div className="border-t border-dark-600 pt-4 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-silver-400">Subtotal</span>
                                    <span className="text-white">₹{totalAmount.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-silver-400">Delivery</span>
                                    <span className="text-accent-500 font-medium">FREE</span>
                                </div>
                                <div className="flex justify-between text-lg font-bold pt-2 border-t border-dark-600">
                                    <span className="text-white">Total</span>
                                    <span className="text-white">₹{totalAmount.toLocaleString()}</span>
                                </div>
                            </div>

                            {/* COD Payment Message */}
                            <div className="mt-4 bg-green-500/10 border border-green-500/30 rounded-xl p-3">
                                <p className="text-sm text-green-400 text-center font-medium flex items-center justify-center gap-2">
                                    💵 Pay <span className="font-bold text-white">₹{totalAmount.toLocaleString()}</span> on delivery
                                </p>
                            </div>

                            {/* Trust Badges */}
                            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                                <div className="p-2">
                                    <Shield size={20} className="text-accent-500 mx-auto mb-1" />
                                    <p className="text-xs text-silver-500">Secure</p>
                                </div>
                                <div className="p-2">
                                    <Truck size={20} className="text-accent-500 mx-auto mb-1" />
                                    <p className="text-xs text-silver-500">Fast</p>
                                </div>
                                <div className="p-2">
                                    <Clock size={20} className="text-accent-500 mx-auto mb-1" />
                                    <p className="text-xs text-silver-500">24/7</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Error Modal */}
            {errorMessage && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="bg-dark-800 rounded-2xl p-6 max-w-md w-full shadow-2xl animate-scale-in border border-red-500/30">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 bg-red-500/20">
                                <AlertCircle className="text-red-500" size={24} />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-display text-xl font-bold text-white mb-2">Error</h3>
                                <p className="text-silver-300 whitespace-pre-line">{errorMessage}</p>
                            </div>
                            <button
                                onClick={() => setErrorMessage('')}
                                className="text-silver-400 hover:text-white transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <button
                            onClick={() => setErrorMessage('')}
                            className="btn-primary w-full mt-6"
                        >
                            OK
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
