'use client';

import { useState, useEffect } from 'react';
import { Settings, User, CreditCard, Bell, Shield, Save, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { API_BASE_URL } from '@/config/apiConfig';

export default function PartnerSettingsPage() {
    const { user, token } = useAuth();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [activeTab, setActiveTab] = useState('profile');
    const [showPassword, setShowPassword] = useState(false);

    // Profile Settings
    const [profile, setProfile] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
    });

    // Password Settings
    const [passwords, setPasswords] = useState({
        current_password: '',
        new_password: '',
        confirm_password: '',
    });

    // Bank Settings
    const [bankDetails, setBankDetails] = useState({
        bank_name: '',
        account_number: '',
        ifsc_code: '',
        upi_id: '',
    });

    // Notification Settings
    const [notifications, setNotifications] = useState({
        email_orders: true,
        email_payouts: true,
        email_promotions: false,
    });

    useEffect(() => {
        if (user) {
            setProfile({
                first_name: user.first_name || '',
                last_name: user.last_name || '',
                email: user.email || '',
                phone: user.phone || '',
            });
        }
        fetchPartnerDetails();
    }, [user]);

    const fetchPartnerDetails = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/partner/profile/`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                if (data.bank_name) {
                    setBankDetails({
                        bank_name: data.bank_name || '',
                        account_number: data.account_number || '',
                        ifsc_code: data.ifsc_code || '',
                        upi_id: data.upi_id || '',
                    });
                }
            }
        } catch (error) {
            console.error('Error fetching partner details:', error);
        }
    };

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const res = await fetch(`${API_BASE_URL}/partner/profile/update/`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(profile)
            });

            if (res.ok) {
                setMessage({ type: 'success', text: 'Profile updated successfully!' });
            } else {
                setMessage({ type: 'error', text: 'Failed to update profile' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'An error occurred' });
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwords.new_password !== passwords.confirm_password) {
            setMessage({ type: 'error', text: 'Passwords do not match' });
            return;
        }

        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const res = await fetch(`${API_BASE_URL}/partner/change-password/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    current_password: passwords.current_password,
                    new_password: passwords.new_password
                })
            });

            if (res.ok) {
                setMessage({ type: 'success', text: 'Password changed successfully!' });
                setPasswords({ current_password: '', new_password: '', confirm_password: '' });
            } else {
                const data = await res.json();
                setMessage({ type: 'error', text: data.error || 'Failed to change password' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'An error occurred' });
        } finally {
            setLoading(false);
        }
    };

    const handleBankUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const res = await fetch(`${API_BASE_URL}/partner/bank-details/`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(bankDetails)
            });

            if (res.ok) {
                setMessage({ type: 'success', text: 'Bank details updated successfully!' });
            } else {
                setMessage({ type: 'error', text: 'Failed to update bank details' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'An error occurred' });
        } finally {
            setLoading(false);
        }
    };

    const tabs = [
        { id: 'profile', label: 'Profile', icon: User },
        { id: 'security', label: 'Security', icon: Shield },
        { id: 'bank', label: 'Bank Details', icon: CreditCard },
        { id: 'notifications', label: 'Notifications', icon: Bell },
    ];

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Settings className="text-accent-500" size={28} />
                    Settings
                </h1>
                <p className="text-silver-500 mt-1">Manage your account settings and preferences</p>
            </div>

            {/* Message */}
            {message.text && (
                <div className={`mb-4 p-4 rounded-xl ${message.type === 'success' ? 'bg-green-500/10 border border-green-500/20 text-green-500' : 'bg-red-500/10 border border-red-500/20 text-red-500'}`}>
                    {message.text}
                </div>
            )}

            <div className="flex gap-6">
                {/* Sidebar Tabs */}
                <div className="w-64 bg-dark-800 rounded-xl border border-dark-700 p-4">
                    <nav className="space-y-2">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${activeTab === tab.id
                                    ? 'bg-accent-500/10 text-accent-500 border border-accent-500/20'
                                    : 'text-silver-400 hover:bg-dark-700 hover:text-white'
                                    }`}
                            >
                                <tab.icon size={20} />
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Content */}
                <div className="flex-1 bg-dark-800 rounded-xl border border-dark-700 p-6">
                    {/* Profile Tab */}
                    {activeTab === 'profile' && (
                        <form onSubmit={handleProfileUpdate} className="space-y-6">
                            <h2 className="text-xl font-bold text-white mb-4">Profile Information</h2>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-silver-400 mb-2">First Name</label>
                                    <input
                                        type="text"
                                        value={profile.first_name}
                                        onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
                                        className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-xl text-white focus:border-accent-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-silver-400 mb-2">Last Name</label>
                                    <input
                                        type="text"
                                        value={profile.last_name}
                                        onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
                                        className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-xl text-white focus:border-accent-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-silver-400 mb-2">Email</label>
                                <input
                                    type="email"
                                    value={profile.email}
                                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                                    className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-xl text-white focus:border-accent-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-silver-400 mb-2">Phone</label>
                                <input
                                    type="tel"
                                    value={profile.phone}
                                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                                    className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-xl text-white focus:border-accent-500 outline-none"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="flex items-center gap-2 px-6 py-3 bg-accent-500 text-white rounded-xl font-medium hover:bg-accent-600 disabled:opacity-50"
                            >
                                <Save size={18} />
                                {loading ? 'Saving...' : 'Save Changes'}
                            </button>
                        </form>
                    )}

                    {/* Security Tab */}
                    {activeTab === 'security' && (
                        <form onSubmit={handlePasswordChange} className="space-y-6">
                            <h2 className="text-xl font-bold text-white mb-4">Change Password</h2>

                            <div>
                                <label className="block text-sm font-medium text-silver-400 mb-2">Current Password</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={passwords.current_password}
                                        onChange={(e) => setPasswords({ ...passwords, current_password: e.target.value })}
                                        className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-xl text-white focus:border-accent-500 outline-none pr-12"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-silver-500"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-silver-400 mb-2">New Password</label>
                                <input
                                    type="password"
                                    value={passwords.new_password}
                                    onChange={(e) => setPasswords({ ...passwords, new_password: e.target.value })}
                                    className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-xl text-white focus:border-accent-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-silver-400 mb-2">Confirm New Password</label>
                                <input
                                    type="password"
                                    value={passwords.confirm_password}
                                    onChange={(e) => setPasswords({ ...passwords, confirm_password: e.target.value })}
                                    className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-xl text-white focus:border-accent-500 outline-none"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="flex items-center gap-2 px-6 py-3 bg-accent-500 text-white rounded-xl font-medium hover:bg-accent-600 disabled:opacity-50"
                            >
                                <Shield size={18} />
                                {loading ? 'Updating...' : 'Update Password'}
                            </button>
                        </form>
                    )}

                    {/* Bank Details Tab */}
                    {activeTab === 'bank' && (
                        <form onSubmit={handleBankUpdate} className="space-y-6">
                            <h2 className="text-xl font-bold text-white mb-4">Bank Details for Payouts</h2>

                            <div>
                                <label className="block text-sm font-medium text-silver-400 mb-2">Bank Name</label>
                                <input
                                    type="text"
                                    value={bankDetails.bank_name}
                                    onChange={(e) => setBankDetails({ ...bankDetails, bank_name: e.target.value })}
                                    placeholder="e.g., State Bank of India"
                                    className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-xl text-white focus:border-accent-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-silver-400 mb-2">Account Number</label>
                                <input
                                    type="text"
                                    value={bankDetails.account_number}
                                    onChange={(e) => setBankDetails({ ...bankDetails, account_number: e.target.value })}
                                    placeholder="Enter your account number"
                                    className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-xl text-white focus:border-accent-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-silver-400 mb-2">IFSC Code</label>
                                <input
                                    type="text"
                                    value={bankDetails.ifsc_code}
                                    onChange={(e) => setBankDetails({ ...bankDetails, ifsc_code: e.target.value.toUpperCase() })}
                                    placeholder="e.g., SBIN0001234"
                                    className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-xl text-white focus:border-accent-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-silver-400 mb-2">UPI ID (Optional)</label>
                                <input
                                    type="text"
                                    value={bankDetails.upi_id}
                                    onChange={(e) => setBankDetails({ ...bankDetails, upi_id: e.target.value })}
                                    placeholder="e.g., yourname@upi"
                                    className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-xl text-white focus:border-accent-500 outline-none"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="flex items-center gap-2 px-6 py-3 bg-accent-500 text-white rounded-xl font-medium hover:bg-accent-600 disabled:opacity-50"
                            >
                                <CreditCard size={18} />
                                {loading ? 'Saving...' : 'Save Bank Details'}
                            </button>
                        </form>
                    )}

                    {/* Notifications Tab */}
                    {activeTab === 'notifications' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold text-white mb-4">Notification Preferences</h2>

                            <div className="space-y-4">
                                <label className="flex items-center justify-between p-4 bg-dark-700 rounded-xl cursor-pointer">
                                    <div>
                                        <p className="text-white font-medium">Order Notifications</p>
                                        <p className="text-sm text-silver-500">Receive emails when you get new orders</p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={notifications.email_orders}
                                        onChange={(e) => setNotifications({ ...notifications, email_orders: e.target.checked })}
                                        className="w-5 h-5 rounded accent-accent-500"
                                    />
                                </label>

                                <label className="flex items-center justify-between p-4 bg-dark-700 rounded-xl cursor-pointer">
                                    <div>
                                        <p className="text-white font-medium">Payout Notifications</p>
                                        <p className="text-sm text-silver-500">Receive emails about payout status updates</p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={notifications.email_payouts}
                                        onChange={(e) => setNotifications({ ...notifications, email_payouts: e.target.checked })}
                                        className="w-5 h-5 rounded accent-accent-500"
                                    />
                                </label>

                                <label className="flex items-center justify-between p-4 bg-dark-700 rounded-xl cursor-pointer">
                                    <div>
                                        <p className="text-white font-medium">Promotional Emails</p>
                                        <p className="text-sm text-silver-500">Receive updates about new features and promotions</p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={notifications.email_promotions}
                                        onChange={(e) => setNotifications({ ...notifications, email_promotions: e.target.checked })}
                                        className="w-5 h-5 rounded accent-accent-500"
                                    />
                                </label>
                            </div>

                            <button
                                onClick={() => setMessage({ type: 'success', text: 'Notification preferences saved!' })}
                                className="flex items-center gap-2 px-6 py-3 bg-accent-500 text-white rounded-xl font-medium hover:bg-accent-600"
                            >
                                <Bell size={18} />
                                Save Preferences
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
