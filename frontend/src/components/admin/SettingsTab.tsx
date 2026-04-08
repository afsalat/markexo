import type { ReactNode } from 'react';
import { Save, CheckCircle, Globe, Upload, MessageCircle, Mail, Phone, MapPin } from 'lucide-react';
import { SiteSetting } from '@/types/admin';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { API_BASE_URL } from '@/config/apiConfig';
import { APP_URL } from '@/config/siteConfig';

interface SettingsTabProps {
    settings: SiteSetting | null;
}

type SettingsFormData = {
    id: number;
    site_name: string;
    site_tagline: string;
    logo: string | null;
    contact_email: string;
    contact_phone: string;
    whatsapp_number: string;
    address: string;
    facebook_url: string;
    instagram_url: string;
    twitter_url: string;
};

function buildInitialFormData(settings: SiteSetting): SettingsFormData {
    return {
        id: settings.id,
        site_name: settings.site_name || '',
        site_tagline: settings.site_tagline || '',
        logo: settings.logo || null,
        contact_email: settings.contact_email || '',
        contact_phone: settings.contact_phone || '',
        whatsapp_number: settings.whatsapp_number || '',
        address: settings.address || '',
        facebook_url: settings.facebook_url || '',
        instagram_url: settings.instagram_url || '',
        twitter_url: settings.twitter_url || '',
    };
}

function PreviewItem({
    icon,
    label,
    value,
}: {
    icon: ReactNode;
    label: string;
    value: string;
}) {
    return (
        <div className="flex items-start gap-3 rounded-xl border border-dark-700 bg-dark-900/60 p-3">
            <div className="mt-0.5 text-accent-400">{icon}</div>
            <div>
                <p className="text-xs uppercase tracking-wide text-silver-500">{label}</p>
                <p className="mt-1 text-sm text-white">{value || 'Not set'}</p>
            </div>
        </div>
    );
}

export default function SettingsTab({ settings }: SettingsTabProps) {
    const { hasPermission, token } = useAuth();
    const canEdit = hasPermission('change_sitesetting');
    const [formData, setFormData] = useState<SettingsFormData | null>(null);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        if (settings) {
            setFormData(buildInitialFormData(settings));
            setLogoFile(null);
            setLogoPreview(settings.logo || null);
        }
    }, [settings]);

    useEffect(() => {
        if (!logoFile) {
            if (formData?.logo) {
                setLogoPreview(formData.logo);
            }
            return;
        }

        const objectUrl = URL.createObjectURL(logoFile);
        setLogoPreview(objectUrl);

        return () => URL.revokeObjectURL(objectUrl);
    }, [logoFile, formData?.logo]);

    useEffect(() => {
        if (!logoFile && formData?.logo) {
            setLogoPreview(formData.logo);
        }
    }, [formData?.logo, logoFile]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (!formData) return;

        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData) return;

        setSaving(true);
        setSaveStatus('idle');
        setErrorMessage('');

        try {
            const payload = new FormData();
            payload.append('site_name', formData.site_name);
            payload.append('site_tagline', formData.site_tagline);
            payload.append('contact_email', formData.contact_email);
            payload.append('contact_phone', formData.contact_phone);
            payload.append('whatsapp_number', formData.whatsapp_number);
            payload.append('address', formData.address);
            payload.append('facebook_url', formData.facebook_url);
            payload.append('instagram_url', formData.instagram_url);
            payload.append('twitter_url', formData.twitter_url);
            if (logoFile) {
                payload.append('logo', logoFile);
            }

            const res = await fetch(`${API_BASE_URL}/admin/settings/`, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: payload,
            });

            if (res.ok) {
                const updated = await res.json();
                setFormData(buildInitialFormData(updated));
                setLogoFile(null);
                setSaveStatus('success');
                setTimeout(() => setSaveStatus('idle'), 3000);
            } else {
                const errorData = await res.json().catch(() => ({}));
                setSaveStatus('error');
                setErrorMessage(typeof errorData === 'object' ? JSON.stringify(errorData) : 'Failed to save settings');
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            setSaveStatus('error');
            setErrorMessage(error instanceof Error ? error.message : 'Error saving settings');
        } finally {
            setSaving(false);
        }
    };

    if (!formData) {
        return <div className="text-silver-500">Loading settings...</div>;
    }

    return (
        <div className="max-w-6xl animate-fade-in">
            <div className="mb-6">
                <h1 className="font-display text-2xl font-bold text-white">Site Settings</h1>
                <p className="mt-2 text-sm text-silver-500">
                    Manage storefront branding, contact details, and social links from one place.
                </p>
            </div>

            <form className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.9fr)]" onSubmit={handleSubmit}>
                <div className="space-y-6 rounded-2xl border border-dark-700 bg-dark-800 p-6 shadow-sm sm:p-8">
                    <div>
                        <h2 className="mb-4 text-lg font-semibold text-white">Branding</h2>
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-silver-300">Site Name</label>
                                <input
                                    type="text"
                                    name="site_name"
                                    value={formData.site_name}
                                    onChange={handleInputChange}
                                    className="w-full rounded-lg border border-dark-600 bg-dark-700 px-4 py-3 text-white outline-none transition-all placeholder-silver-600 focus:border-transparent focus:ring-2 focus:ring-accent-500"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-silver-300">WhatsApp Number</label>
                                <input
                                    type="text"
                                    name="whatsapp_number"
                                    value={formData.whatsapp_number}
                                    onChange={handleInputChange}
                                    placeholder="+91..."
                                    className="w-full rounded-lg border border-dark-600 bg-dark-700 px-4 py-3 text-white outline-none transition-all placeholder-silver-600 focus:border-transparent focus:ring-2 focus:ring-accent-500"
                                />
                            </div>
                        </div>

                        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,1fr)_240px]">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-silver-300">Site Tagline</label>
                                <input
                                    type="text"
                                    name="site_tagline"
                                    value={formData.site_tagline}
                                    onChange={handleInputChange}
                                    placeholder="Short line used across the storefront"
                                    className="w-full rounded-lg border border-dark-600 bg-dark-700 px-4 py-3 text-white outline-none transition-all placeholder-silver-600 focus:border-transparent focus:ring-2 focus:ring-accent-500"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-silver-300">Site Logo</label>
                                <label className="flex min-h-[124px] cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-dark-500 bg-dark-700/70 px-4 py-4 text-center transition-colors hover:border-accent-500 hover:bg-dark-700">
                                    {logoPreview ? (
                                        <img src={logoPreview} alt="Site logo preview" className="h-14 max-w-[150px] object-contain" />
                                    ) : (
                                        <div className="rounded-full bg-accent-500/10 p-3 text-accent-400">
                                            <Upload size={18} />
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-sm font-medium text-white">{logoFile ? logoFile.name : 'Upload logo'}</p>
                                        <p className="mt-1 text-xs text-silver-500">PNG, JPG, WEBP</p>
                                    </div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
                                    />
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-dark-700 pt-6">
                        <h2 className="mb-4 text-lg font-semibold text-white">Contact</h2>
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-silver-300">Contact Email</label>
                                <input
                                    type="email"
                                    name="contact_email"
                                    value={formData.contact_email}
                                    onChange={handleInputChange}
                                    className="w-full rounded-lg border border-dark-600 bg-dark-700 px-4 py-3 text-white outline-none transition-all placeholder-silver-600 focus:border-transparent focus:ring-2 focus:ring-accent-500"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-silver-300">Contact Phone</label>
                                <input
                                    type="text"
                                    name="contact_phone"
                                    value={formData.contact_phone}
                                    onChange={handleInputChange}
                                    className="w-full rounded-lg border border-dark-600 bg-dark-700 px-4 py-3 text-white outline-none transition-all placeholder-silver-600 focus:border-transparent focus:ring-2 focus:ring-accent-500"
                                />
                            </div>
                        </div>

                        <div className="mt-6 space-y-2">
                            <label className="text-sm font-medium text-silver-300">Address</label>
                            <textarea
                                name="address"
                                value={formData.address}
                                onChange={handleInputChange}
                                rows={4}
                                className="w-full rounded-lg border border-dark-600 bg-dark-700 px-4 py-3 text-white outline-none transition-all placeholder-silver-600 focus:border-transparent focus:ring-2 focus:ring-accent-500"
                            />
                        </div>
                    </div>

                    <div className="border-t border-dark-700 pt-6">
                        <h2 className="mb-4 text-lg font-semibold text-white">Social Media</h2>
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-silver-300">Facebook URL</label>
                                <input
                                    type="text"
                                    name="facebook_url"
                                    value={formData.facebook_url}
                                    onChange={handleInputChange}
                                    placeholder="https://facebook.com/..."
                                    className="w-full rounded-lg border border-dark-600 bg-dark-700 px-4 py-3 text-white outline-none transition-all placeholder-silver-600 focus:border-transparent focus:ring-2 focus:ring-accent-500"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-silver-300">Instagram URL</label>
                                <input
                                    type="text"
                                    name="instagram_url"
                                    value={formData.instagram_url}
                                    onChange={handleInputChange}
                                    placeholder="https://instagram.com/..."
                                    className="w-full rounded-lg border border-dark-600 bg-dark-700 px-4 py-3 text-white outline-none transition-all placeholder-silver-600 focus:border-transparent focus:ring-2 focus:ring-accent-500"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-silver-300">Twitter URL</label>
                                <input
                                    type="text"
                                    name="twitter_url"
                                    value={formData.twitter_url}
                                    onChange={handleInputChange}
                                    placeholder="https://twitter.com/..."
                                    className="w-full rounded-lg border border-dark-600 bg-dark-700 px-4 py-3 text-white outline-none transition-all placeholder-silver-600 focus:border-transparent focus:ring-2 focus:ring-accent-500"
                                />
                            </div>
                        </div>
                    </div>

                    {canEdit && (
                        <div className="flex items-center justify-between gap-3 border-t border-dark-700 pt-6">
                            <div>
                                {saveStatus === 'success' && (
                                    <span className="flex items-center gap-2 text-sm font-medium text-green-500">
                                        <CheckCircle size={18} /> Settings saved successfully.
                                    </span>
                                )}
                                {saveStatus === 'error' && errorMessage && (
                                    <span className="text-sm font-medium text-red-500">{errorMessage}</span>
                                )}
                            </div>
                            <button
                                type="submit"
                                disabled={saving}
                                className="btn-primary flex items-center gap-2 shadow-lg shadow-accent-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {saving ? (
                                    <>
                                        <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
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
                </div>

                <div className="space-y-6">
                    <div className="rounded-2xl border border-dark-700 bg-dark-800 p-6 shadow-sm">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-white">Live Preview</h2>
                            <a
                                href={APP_URL}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 text-sm text-accent-400 transition-colors hover:text-accent-300"
                            >
                                <Globe size={16} />
                                View Store
                            </a>
                        </div>

                        <div className="rounded-2xl border border-dark-700 bg-dark-900/80 p-5">
                            <div className="mb-5 flex items-center gap-4">
                                <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-dark-600 bg-dark-800">
                                    {logoPreview ? (
                                        <img src={logoPreview} alt="Preview logo" className="h-full w-full object-contain p-2" />
                                    ) : (
                                        <span className="text-xl font-bold text-accent-400">{formData.site_name.slice(0, 1) || 'V'}</span>
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <h3 className="truncate text-lg font-bold text-white">{formData.site_name || 'Site Name'}</h3>
                                    <p className="mt-1 text-sm text-silver-400">{formData.site_tagline || 'No tagline added yet.'}</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <PreviewItem icon={<Mail size={16} />} label="Email" value={formData.contact_email} />
                                <PreviewItem icon={<Phone size={16} />} label="Phone" value={formData.contact_phone} />
                                <PreviewItem icon={<MessageCircle size={16} />} label="WhatsApp" value={formData.whatsapp_number} />
                                <PreviewItem icon={<MapPin size={16} />} label="Address" value={formData.address} />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-dark-700 bg-dark-800 p-6 shadow-sm">
                        <h2 className="mb-4 text-lg font-semibold text-white">Connected Links</h2>
                        <div className="space-y-3">
                            <PreviewItem icon={<Globe size={16} />} label="Facebook" value={formData.facebook_url} />
                            <PreviewItem icon={<Globe size={16} />} label="Instagram" value={formData.instagram_url} />
                            <PreviewItem icon={<Globe size={16} />} label="Twitter" value={formData.twitter_url} />
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}
