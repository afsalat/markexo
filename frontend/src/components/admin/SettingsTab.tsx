import { Save, CheckCircle } from 'lucide-react';
import { SiteSetting } from '@/types/admin';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { API_BASE_URL } from '@/config/apiConfig';

interface SettingsTabProps {
    settings: SiteSetting | null;
}

export default function SettingsTab({ settings }: SettingsTabProps) {
    const { hasPermission, token } = useAuth();
    const canEdit = hasPermission('change_sitesetting');
    const [formData, setFormData] = useState<SiteSetting | null>(null);
    const [saving, setSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

    useEffect(() => {
        if (settings) {
            setFormData(settings);
        }
    }, [settings]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (formData) {
            setFormData({
                ...formData,
                [e.target.name]: e.target.value
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData) return;

        setSaving(true);
        setSaveStatus('idle');

        try {
            const res = await fetch(`${API_BASE_URL}/admin/settings/`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                setSaveStatus('success');
                setTimeout(() => setSaveStatus('idle'), 3000);
            } else {
                setSaveStatus('error');
                alert('Failed to save settings');
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            setSaveStatus('error');
            alert('Error saving settings');
        } finally {
            setSaving(false);
        }
    };

    if (!formData) return <div>Loading settings...</div>;

    return (
        <div className="animate-fade-in max-w-4xl">
            <h1 className="font-display text-2xl font-bold text-white mb-6">Site Settings</h1>

            <div className="bg-dark-800 rounded-2xl shadow-sm p-6 sm:p-8 border border-dark-700">
                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-silver-300">Site Name</label>
                            <input
                                type="text"
                                name="site_name"
                                value={formData.site_name}
                                onChange={handleChange}
                                className="w-full px-4 py-2 bg-dark-700 border border-dark-600 text-white rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent outline-none transition-all placeholder-silver-600"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-silver-300">Contact Email</label>
                            <input
                                type="email"
                                name="contact_email"
                                value={formData.contact_email}
                                onChange={handleChange}
                                className="w-full px-4 py-2 bg-dark-700 border border-dark-600 text-white rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent outline-none transition-all placeholder-silver-600"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-silver-300">Contact Phone</label>
                            <input
                                type="text"
                                name="contact_phone"
                                value={formData.contact_phone}
                                onChange={handleChange}
                                className="w-full px-4 py-2 bg-dark-700 border border-dark-600 text-white rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent outline-none transition-all placeholder-silver-600"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-silver-300">Address</label>
                            <input
                                type="text"
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                className="w-full px-4 py-2 bg-dark-700 border border-dark-600 text-white rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent outline-none transition-all placeholder-silver-600"
                            />
                        </div>
                    </div>

                    <div className="border-t border-dark-700 pt-6">
                        <h3 className="text-lg font-semibold text-white mb-4">Social Media</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-silver-300">Facebook URL</label>
                                <input
                                    type="text"
                                    name="facebook_url"
                                    value={formData.facebook_url}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 bg-dark-700 border border-dark-600 text-white rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent outline-none transition-all placeholder-silver-600"
                                    placeholder="https://facebook.com/..."
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-silver-300">Instagram URL</label>
                                <input
                                    type="text"
                                    name="instagram_url"
                                    value={formData.instagram_url}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 bg-dark-700 border border-dark-600 text-white rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent outline-none transition-all placeholder-silver-600"
                                    placeholder="https://instagram.com/..."
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-silver-300">Twitter URL</label>
                                <input
                                    type="text"
                                    name="twitter_url"
                                    value={formData.twitter_url}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 bg-dark-700 border border-dark-600 text-white rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent outline-none transition-all placeholder-silver-600"
                                    placeholder="https://twitter.com/..."
                                />
                            </div>
                        </div>
                    </div>

                    {canEdit && (
                        <div className="flex justify-end items-center gap-3 pt-4">
                            {saveStatus === 'success' && (
                                <span className="flex items-center gap-2 text-green-500 text-sm font-medium">
                                    <CheckCircle size={18} /> Settings saved successfully!
                                </span>
                            )}
                            <button
                                type="submit"
                                disabled={saving}
                                className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-accent-500/20"
                            >
                                {saving ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save size={18} /> Save Changes
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}
