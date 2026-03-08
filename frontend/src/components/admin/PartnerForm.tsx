'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Save, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { API_BASE_URL } from '@/config/apiConfig';

interface PartnerFormProps {
    partner?: any;
    onBack: () => void;
    onSuccess: () => void;
}

export default function PartnerForm({ partner, onBack, onSuccess }: PartnerFormProps) {
    const { token } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        is_active: true,
        shop_description: '',
        shop_address: '',
        shop_city: '',
        shop_phone: '',
        commission_rate: '50.00',
        approval_status: 'approved'
    });

    useEffect(() => {
        if (partner) {
            setFormData({
                email: partner.email || '',
                password: '', // Don't show password
                first_name: partner.first_name || '',
                last_name: partner.last_name || '',
                is_active: partner.is_active,
                shop_description: partner.shop_description || '',
                shop_address: partner.shop_address || '',
                shop_city: partner.shop_city || '',
                shop_phone: partner.shop_phone || '',
                commission_rate: partner.commission_rate || '50.00',
                approval_status: partner.approval_status || 'approved'
            });
        }
    }, [partner]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const url = partner
                ? `${API_BASE_URL}/admin/partners/${partner.id}/`
                : `${API_BASE_URL}/admin/partners/`;

            const method = partner ? 'PUT' : 'POST';

            // Remove password if empty during edit
            const data: any = { ...formData };
            if (partner && !data.password) {
                delete data.password;
            }

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                alert(partner ? 'Partner updated successfully!' : 'Partner created successfully!');
                onSuccess();
            } else {
                const errorData = await response.json();
                alert(`Failed: ${JSON.stringify(errorData)}`);
            }
        } catch (error) {
            console.error('Error saving partner:', error);
            alert('An error occurred while saving.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-fade-in">
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={onBack}
                    className="p-2 text-silver-500 hover:text-white hover:bg-dark-700 rounded-xl transition-all"
                >
                    <ArrowLeft size={20} />
                </button>
                <h1 className="font-display text-2xl font-bold text-white">
                    {partner ? 'Edit Partner' : 'Add New Partner'}
                </h1>
            </div>

            <form onSubmit={handleSubmit} className="bg-dark-800 rounded-2xl p-8 shadow-sm border border-dark-700 max-w-4xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                    {/* User Details Section */}
                    <div className="space-y-6">
                        <h3 className="text-lg font-semibold text-accent-500 border-b border-dark-700 pb-2">User Credentials</h3>

                        <div>
                            <label className="block text-sm font-medium text-silver-300 mb-1">Email (Username)</label>
                            <input
                                type="email"
                                name="email"
                                required
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:ring-2 focus:ring-accent-500 outline-none"
                                placeholder="partner@example.com"
                            />
                        </div>

                        {!partner && (
                            <div>
                                <label className="block text-sm font-medium text-silver-300 mb-1">Password</label>
                                <input
                                    type="password"
                                    name="password"
                                    required={!partner}
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:ring-2 focus:ring-accent-500 outline-none"
                                    placeholder="*******"
                                    minLength={8}
                                />
                            </div>
                        )}
                        {partner && (
                            <div>
                                <label className="block text-sm font-medium text-silver-300 mb-1">New Password (Leave blank to keep current)</label>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:ring-2 focus:ring-accent-500 outline-none"
                                    placeholder="Change password..."
                                    minLength={8}
                                />
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-silver-300 mb-1">First Name</label>
                                <input
                                    type="text"
                                    name="first_name"
                                    required
                                    value={formData.first_name}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:ring-2 focus:ring-accent-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-silver-300 mb-1">Last Name</label>
                                <input
                                    type="text"
                                    name="last_name"
                                    value={formData.last_name}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:ring-2 focus:ring-accent-500 outline-none"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                name="is_active"
                                id="is_active"
                                checked={formData.is_active}
                                onChange={handleChange}
                                className="w-4 h-4 text-accent-600 border-dark-600 rounded focus:ring-accent-500 bg-dark-700"
                            />
                            <label htmlFor="is_active" className="text-sm font-medium text-silver-300">
                                User Active Account
                            </label>
                        </div>
                    </div>

                    {/* Shop Details Section */}
                    <div className="space-y-6">
                        <h3 className="text-lg font-semibold text-accent-500 border-b border-dark-700 pb-2">Shop Details</h3>

                        {/* Removed Shop Name Field */}

                        <div>
                            <label className="block text-sm font-medium text-silver-300 mb-1">Description</label>
                            <textarea
                                name="shop_description"
                                value={formData.shop_description}
                                onChange={handleChange}
                                rows={2}
                                className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:ring-2 focus:ring-accent-500 outline-none resize-none"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-silver-300 mb-1">City</label>
                                <input
                                    type="text"
                                    name="shop_city"
                                    required
                                    value={formData.shop_city}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:ring-2 focus:ring-accent-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-silver-300 mb-1">Phone</label>
                                <input
                                    type="text"
                                    name="shop_phone"
                                    required
                                    value={formData.shop_phone}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:ring-2 focus:ring-accent-500 outline-none"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-silver-300 mb-1">Commission Rate (%)</label>
                                <input
                                    type="number"
                                    name="commission_rate"
                                    step="0.01"
                                    required
                                    value={formData.commission_rate}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:ring-2 focus:ring-accent-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-silver-300 mb-1">Approval Status</label>
                                <select
                                    name="approval_status"
                                    value={formData.approval_status}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:ring-2 focus:ring-accent-500 outline-none"
                                >
                                    <option value="pending">Pending</option>
                                    <option value="approved">Approved</option>
                                    <option value="rejected">Rejected</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-dark-700">
                    <button
                        type="button"
                        onClick={onBack}
                        className="px-6 py-2 border border-dark-600 text-silver-400 rounded-lg hover:bg-dark-700 hover:text-white font-medium transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2 bg-accent-600 text-white rounded-lg hover:bg-accent-500 font-medium transition-colors disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-accent-500/20"
                    >
                        <Save size={18} />
                        {loading ? 'Saving...' : 'Save Partner'}
                    </button>
                </div>
            </form>
        </div>
    );
}
