import type { ReactNode } from 'react';
import {
    Save, CheckCircle, Globe, Upload, MessageCircle, Mail, Phone, MapPin,
    Shield, Key, CreditCard, Cpu, Send, RefreshCw, AlertCircle, Eye, EyeOff,
    Check, Lock, ExternalLink
} from 'lucide-react';
import { SiteSetting } from '@/types/admin';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { API_BASE_URL } from '@/config/apiConfig';
import { APP_URL } from '@/config/siteConfig';

interface SettingsTabProps {
    settings: SiteSetting | null;
}

type TabKey = 'site' | 'auth' | 'email' | 'apis' | 'cashfree';

type SettingsFormData = {
    id: number;
    // Site & Branding
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

    // Auth Management
    google_oauth_client_id: string;
    allow_user_registration: boolean;
    allow_partner_registration: boolean;
    session_timeout_minutes: number;

    // Email Config Manage
    smtp_host: string;
    smtp_port: number;
    smtp_user: string;
    smtp_password: string;
    smtp_use_tls: boolean;
    smtp_use_ssl: boolean;
    default_from_email: string;

    // Other APIs Manage
    twilio_account_sid: string;
    twilio_auth_token: string;
    twilio_whatsapp_number: string;
    firebase_project_id: string;

    // Cashfree Payment Gateway Config
    cashfree_enabled: boolean;
    cashfree_mode: 'SANDBOX' | 'PRODUCTION';
    cashfree_app_id: string;
    cashfree_secret_key: string;
    cashfree_api_version: string;
};

function buildInitialFormData(settings: SiteSetting): SettingsFormData {
    return {
        id: settings.id,
        // Site
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

        // Auth
        google_oauth_client_id: settings.google_oauth_client_id || '',
        allow_user_registration: settings.allow_user_registration ?? true,
        allow_partner_registration: settings.allow_partner_registration ?? true,
        session_timeout_minutes: settings.session_timeout_minutes || 1440,

        // Email
        smtp_host: settings.smtp_host || 'smtp.gmail.com',
        smtp_port: settings.smtp_port || 587,
        smtp_user: settings.smtp_user || '',
        smtp_password: settings.smtp_password || '',
        smtp_use_tls: settings.smtp_use_tls ?? true,
        smtp_use_ssl: settings.smtp_use_ssl ?? false,
        default_from_email: settings.default_from_email || '',

        // Other APIs
        twilio_account_sid: settings.twilio_account_sid || '',
        twilio_auth_token: settings.twilio_auth_token || '',
        twilio_whatsapp_number: settings.twilio_whatsapp_number || '',
        firebase_project_id: settings.firebase_project_id || 'markexo-e-commerce',

        // Cashfree
        cashfree_enabled: settings.cashfree_enabled ?? false,
        cashfree_mode: settings.cashfree_mode || 'SANDBOX',
        cashfree_app_id: settings.cashfree_app_id || '',
        cashfree_secret_key: settings.cashfree_secret_key || '',
        cashfree_api_version: settings.cashfree_api_version || '2023-08-01',
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
                <p className="mt-1 text-sm text-white break-all">{value || 'Not set'}</p>
            </div>
        </div>
    );
}

export default function SettingsTab({ settings }: SettingsTabProps) {
    const { hasPermission, token } = useAuth();
    const canEdit = hasPermission('change_sitesetting');
    const [currentSubTab, setCurrentSubTab] = useState<TabKey>('site');
    const [formData, setFormData] = useState<SettingsFormData | null>(null);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    // Visibility toggles for sensitive secrets
    const [showSmtpPassword, setShowSmtpPassword] = useState(false);
    const [showTwilioToken, setShowTwilioToken] = useState(false);
    const [showCashfreeSecret, setShowCashfreeSecret] = useState(false);

    // Testing Email state
    const [testEmailRecipient, setTestEmailRecipient] = useState('');
    const [testingEmail, setTestingEmail] = useState(false);
    const [testEmailResult, setTestEmailResult] = useState<{ success: boolean; message: string } | null>(null);

    // Testing Cashfree state
    const [testingCashfree, setTestingCashfree] = useState(false);
    const [testCashfreeResult, setTestCashfreeResult] = useState<{ success: boolean; message: string } | null>(null);

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

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        if (!formData) return;
        const target = e.target;
        const name = target.name;
        let value: any = target.value;

        if (target instanceof HTMLInputElement && target.type === 'checkbox') {
            value = target.checked;
        } else if (target instanceof HTMLInputElement && target.type === 'number') {
            value = parseInt(target.value) || 0;
        }

        setFormData({
            ...formData,
            [name]: value,
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
            Object.entries(formData).forEach(([key, value]) => {
                if (key === 'logo') return;
                if (value !== null && value !== undefined) {
                    payload.append(key, String(value));
                }
            });
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
                setTimeout(() => setSaveStatus('idle'), 3500);
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

    const handleTestEmail = async () => {
        if (!testEmailRecipient.trim()) {
            alert('Please enter a recipient email address.');
            return;
        }
        setTestingEmail(true);
        setTestEmailResult(null);
        try {
            const res = await fetch(`${API_BASE_URL}/admin/settings/test-email/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    recipient: testEmailRecipient.trim(),
                    smtp_host: formData?.smtp_host,
                    smtp_port: formData?.smtp_port,
                    smtp_user: formData?.smtp_user,
                    smtp_password: formData?.smtp_password,
                    smtp_use_tls: formData?.smtp_use_tls,
                    smtp_use_ssl: formData?.smtp_use_ssl,
                    default_from_email: formData?.default_from_email,
                }),
            });
            const data = await res.json();
            if (res.ok) {
                setTestEmailResult({ success: true, message: data.message || 'Test email sent successfully!' });
            } else {
                setTestEmailResult({ success: false, message: data.error || 'Failed to send test email.' });
            }
        } catch (err: any) {
            setTestEmailResult({ success: false, message: err.message || 'Error executing SMTP test.' });
        } finally {
            setTestingEmail(false);
        }
    };

    const handleTestCashfree = async () => {
        setTestingCashfree(true);
        setTestCashfreeResult(null);
        try {
            const res = await fetch(`${API_BASE_URL}/admin/settings/test-cashfree/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    cashfree_app_id: formData?.cashfree_app_id,
                    cashfree_secret_key: formData?.cashfree_secret_key,
                    cashfree_mode: formData?.cashfree_mode,
                }),
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setTestCashfreeResult({
                    success: true,
                    message: `Cashfree credentials verified! Mode: ${data.environment || formData?.cashfree_mode}.`,
                });
            } else {
                setTestCashfreeResult({
                    success: false,
                    message: data.message || data.error || 'Cashfree verification failed. Verify App ID and Secret Key.',
                });
            }
        } catch (err: any) {
            setTestCashfreeResult({ success: false, message: err.message || 'Error communicating with Cashfree.' });
        } finally {
            setTestingCashfree(false);
        }
    };

    if (!formData) {
        return <div className="text-silver-500">Loading settings...</div>;
    }

    const TABS = [
        { id: 'site' as TabKey, label: 'Site Settings', icon: Globe, badge: null },
        { id: 'auth' as TabKey, label: 'Auth Management', icon: Shield, badge: null },
        { id: 'email' as TabKey, label: 'Email Config (App Pass)', icon: Mail, badge: formData.smtp_user ? 'Configured' : null },
        { id: 'apis' as TabKey, label: 'Other APIs', icon: Cpu, badge: null },
        { id: 'cashfree' as TabKey, label: 'Cashfree Gateway', icon: CreditCard, badge: formData.cashfree_enabled ? 'Active' : 'Disabled' },
    ];

    return (
        <div className="max-w-6xl animate-fade-in space-y-6">
            <div>
                <h1 className="font-display text-2xl font-bold text-white">System Settings &amp; Integrations</h1>
                <p className="mt-1 text-sm text-silver-400">
                    Configure storefront branding, user authentication, SMTP email credentials, external APIs, and the Cashfree payment gateway.
                </p>
            </div>

            {/* Sub-tab Navigation */}
            <div className="flex flex-wrap gap-2 border-b border-dark-700 pb-3">
                {TABS.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = currentSubTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setCurrentSubTab(tab.id)}
                            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                                isActive
                                    ? 'bg-accent-600 text-white shadow-lg shadow-accent-600/20'
                                    : 'bg-dark-800 text-silver-400 hover:bg-dark-700 hover:text-white border border-dark-700'
                            }`}
                        >
                            <Icon size={16} />
                            <span>{tab.label}</span>
                            {tab.badge && (
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                    tab.badge === 'Active' || tab.badge === 'Configured'
                                        ? 'bg-emerald-500/20 text-emerald-300'
                                        : 'bg-dark-700 text-silver-400'
                                }`}>
                                    {tab.badge}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* 1. SITE SETTINGS TAB */}
                {currentSubTab === 'site' && (
                    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.9fr)] animate-fade-in">
                        <div className="space-y-6 rounded-2xl border border-dark-700 bg-dark-800 p-6 shadow-sm sm:p-8">
                            <div>
                                <h2 className="mb-4 text-lg font-semibold text-white">Storefront Branding</h2>
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-silver-300">Site Name</label>
                                        <input
                                            type="text"
                                            name="site_name"
                                            value={formData.site_name}
                                            onChange={handleInputChange}
                                            className="w-full rounded-lg border border-dark-600 bg-dark-700 px-4 py-3 text-white outline-none focus:border-transparent focus:ring-2 focus:ring-accent-500"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-silver-300">WhatsApp Support Number</label>
                                        <input
                                            type="text"
                                            name="whatsapp_number"
                                            value={formData.whatsapp_number}
                                            onChange={handleInputChange}
                                            placeholder="+91..."
                                            className="w-full rounded-lg border border-dark-600 bg-dark-700 px-4 py-3 text-white outline-none focus:border-transparent focus:ring-2 focus:ring-accent-500"
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
                                            placeholder="Short tagline used on the storefront"
                                            className="w-full rounded-lg border border-dark-600 bg-dark-700 px-4 py-3 text-white outline-none focus:border-transparent focus:ring-2 focus:ring-accent-500"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-silver-300">Store Logo</label>
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
                                <h2 className="mb-4 text-lg font-semibold text-white">Contact Information</h2>
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-silver-300">Contact Email</label>
                                        <input
                                            type="email"
                                            name="contact_email"
                                            value={formData.contact_email}
                                            onChange={handleInputChange}
                                            className="w-full rounded-lg border border-dark-600 bg-dark-700 px-4 py-3 text-white outline-none focus:border-transparent focus:ring-2 focus:ring-accent-500"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-silver-300">Contact Phone</label>
                                        <input
                                            type="text"
                                            name="contact_phone"
                                            value={formData.contact_phone}
                                            onChange={handleInputChange}
                                            className="w-full rounded-lg border border-dark-600 bg-dark-700 px-4 py-3 text-white outline-none focus:border-transparent focus:ring-2 focus:ring-accent-500"
                                        />
                                    </div>
                                </div>

                                <div className="mt-6 space-y-2">
                                    <label className="text-sm font-medium text-silver-300">Office / Store Address</label>
                                    <textarea
                                        name="address"
                                        value={formData.address}
                                        onChange={handleInputChange}
                                        rows={3}
                                        className="w-full rounded-lg border border-dark-600 bg-dark-700 px-4 py-3 text-white outline-none focus:border-transparent focus:ring-2 focus:ring-accent-500"
                                    />
                                </div>
                            </div>

                            <div className="border-t border-dark-700 pt-6">
                                <h2 className="mb-4 text-lg font-semibold text-white">Social Media Links</h2>
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-silver-300">Facebook URL</label>
                                        <input
                                            type="text"
                                            name="facebook_url"
                                            value={formData.facebook_url}
                                            onChange={handleInputChange}
                                            placeholder="https://facebook.com/..."
                                            className="w-full rounded-lg border border-dark-600 bg-dark-700 px-4 py-3 text-white outline-none focus:border-transparent focus:ring-2 focus:ring-accent-500"
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
                                            className="w-full rounded-lg border border-dark-600 bg-dark-700 px-4 py-3 text-white outline-none focus:border-transparent focus:ring-2 focus:ring-accent-500"
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
                                            className="w-full rounded-lg border border-dark-600 bg-dark-700 px-4 py-3 text-white outline-none focus:border-transparent focus:ring-2 focus:ring-accent-500"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Live Preview Column */}
                        <div className="space-y-6">
                            <div className="rounded-2xl border border-dark-700 bg-dark-800 p-6 shadow-sm">
                                <div className="mb-4 flex items-center justify-between">
                                    <h2 className="text-lg font-semibold text-white">Live Storefront Preview</h2>
                                    <a
                                        href={APP_URL}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1.5 text-xs text-accent-400 hover:text-accent-300 font-bold"
                                    >
                                        <Globe size={14} /> View Store
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
                    </div>
                )}

                {/* 2. AUTH MANAGEMENT TAB */}
                {currentSubTab === 'auth' && (
                    <div className="rounded-2xl border border-dark-700 bg-dark-800 p-6 shadow-sm sm:p-8 space-y-6 animate-fade-in">
                        <div>
                            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                                <Key className="text-accent-500" size={20} /> User &amp; Partner Authentication Management
                            </h2>
                            <p className="text-sm text-silver-400 mt-1">
                                Control login providers, registrations, and account security rules.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-silver-300">Google OAuth Client ID</label>
                                <input
                                    type="text"
                                    name="google_oauth_client_id"
                                    value={formData.google_oauth_client_id}
                                    onChange={handleInputChange}
                                    placeholder="e.g. 123456789-abcdef.apps.googleusercontent.com"
                                    className="w-full rounded-lg border border-dark-600 bg-dark-700 px-4 py-3 text-white outline-none focus:border-transparent focus:ring-2 focus:ring-accent-500 font-mono text-sm"
                                />
                                <p className="text-xs text-silver-500">
                                    Used for Google One-Tap and Social Sign-In on customer login and checkout.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                                <div className="flex items-center justify-between p-4 rounded-xl border border-dark-700 bg-dark-900/60">
                                    <div>
                                        <p className="text-sm font-bold text-white">Allow Customer Registration</p>
                                        <p className="text-xs text-silver-400 mt-0.5">Let new shoppers register accounts on the storefront</p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        name="allow_user_registration"
                                        checked={formData.allow_user_registration}
                                        onChange={handleInputChange}
                                        className="h-5 w-5 rounded border-dark-600 bg-dark-700 text-accent-600 focus:ring-accent-500"
                                    />
                                </div>

                                <div className="flex items-center justify-between p-4 rounded-xl border border-dark-700 bg-dark-900/60">
                                    <div>
                                        <p className="text-sm font-bold text-white">Allow Partner Registration</p>
                                        <p className="text-xs text-silver-400 mt-0.5">Allow vendors and sourcing partners to submit partner sign-ups</p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        name="allow_partner_registration"
                                        checked={formData.allow_partner_registration}
                                        onChange={handleInputChange}
                                        className="h-5 w-5 rounded border-dark-600 bg-dark-700 text-accent-600 focus:ring-accent-500"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2 pt-2">
                                <label className="text-sm font-medium text-silver-300">Session Timeout (Minutes)</label>
                                <input
                                    type="number"
                                    name="session_timeout_minutes"
                                    value={formData.session_timeout_minutes}
                                    onChange={handleInputChange}
                                    min="15"
                                    max="43200"
                                    className="w-full max-w-xs rounded-lg border border-dark-600 bg-dark-700 px-4 py-3 text-white outline-none focus:border-transparent focus:ring-2 focus:ring-accent-500 font-mono text-sm"
                                />
                                <p className="text-xs text-silver-500">JWT token refresh and expiration cycle (Default: 1440 mins = 24 hours).</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* 3. EMAIL CONFIG MANAGE (SMTP / APP PASSWORD) */}
                {currentSubTab === 'email' && (
                    <div className="rounded-2xl border border-dark-700 bg-dark-800 p-6 shadow-sm sm:p-8 space-y-6 animate-fade-in">
                        <div>
                            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                                <Mail className="text-accent-500" size={20} /> Email &amp; SMTP Configuration (App Passwords)
                            </h2>
                            <p className="text-sm text-silver-400 mt-1">
                                Configure outgoing email service for order receipts, password resets, and customer status updates.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-silver-300">SMTP Host</label>
                                <input
                                    type="text"
                                    name="smtp_host"
                                    value={formData.smtp_host}
                                    onChange={handleInputChange}
                                    placeholder="smtp.gmail.com"
                                    className="w-full rounded-lg border border-dark-600 bg-dark-700 px-4 py-3 text-white outline-none focus:border-transparent focus:ring-2 focus:ring-accent-500 font-mono text-sm"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-silver-300">SMTP Port</label>
                                <input
                                    type="number"
                                    name="smtp_port"
                                    value={formData.smtp_port}
                                    onChange={handleInputChange}
                                    placeholder="587"
                                    className="w-full rounded-lg border border-dark-600 bg-dark-700 px-4 py-3 text-white outline-none focus:border-transparent focus:ring-2 focus:ring-accent-500 font-mono text-sm"
                                />
                                <p className="text-xs text-silver-500">587 (TLS - Recommended) or 465 (SSL)</p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-silver-300">SMTP Username / Email</label>
                                <input
                                    type="email"
                                    name="smtp_user"
                                    value={formData.smtp_user}
                                    onChange={handleInputChange}
                                    placeholder="your-email@gmail.com"
                                    className="w-full rounded-lg border border-dark-600 bg-dark-700 px-4 py-3 text-white outline-none focus:border-transparent focus:ring-2 focus:ring-accent-500 text-sm"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-silver-300">
                                    App Password / SMTP Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showSmtpPassword ? 'text' : 'password'}
                                        name="smtp_password"
                                        value={formData.smtp_password}
                                        onChange={handleInputChange}
                                        placeholder="16-character Google App Password (e.g. abcd efgh ijkl mnop)"
                                        className="w-full rounded-lg border border-dark-600 bg-dark-700 px-4 py-3 pr-10 text-white outline-none focus:border-transparent focus:ring-2 focus:ring-accent-500 font-mono text-sm"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowSmtpPassword(!showSmtpPassword)}
                                        className="absolute right-3 top-3.5 text-silver-400 hover:text-white"
                                        title={showSmtpPassword ? 'Hide password' : 'Show password'}
                                    >
                                        {showSmtpPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                <p className="text-xs text-silver-500">
                                    For Gmail: Generate an &ldquo;App Password&rdquo; in Google Account &gt; Security &gt; 2-Step Verification.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-silver-300">Default &ldquo;From&rdquo; Email</label>
                                <input
                                    type="text"
                                    name="default_from_email"
                                    value={formData.default_from_email}
                                    onChange={handleInputChange}
                                    placeholder="VorionMart <noreply@vorionmart.com>"
                                    className="w-full rounded-lg border border-dark-600 bg-dark-700 px-4 py-3 text-white outline-none focus:border-transparent focus:ring-2 focus:ring-accent-500 text-sm"
                                />
                            </div>

                            <div className="flex items-center gap-6 pt-6">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="smtp_use_tls"
                                        checked={formData.smtp_use_tls}
                                        onChange={handleInputChange}
                                        className="h-4 w-4 rounded border-dark-600 bg-dark-700 text-accent-600 focus:ring-accent-500"
                                    />
                                    <span className="text-sm font-medium text-silver-300">Use TLS (STARTTLS)</span>
                                </label>

                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="smtp_use_ssl"
                                        checked={formData.smtp_use_ssl}
                                        onChange={handleInputChange}
                                        className="h-4 w-4 rounded border-dark-600 bg-dark-700 text-accent-600 focus:ring-accent-500"
                                    />
                                    <span className="text-sm font-medium text-silver-300">Use SSL</span>
                                </label>
                            </div>
                        </div>

                        {/* Interactive Test Email Utility */}
                        <div className="rounded-xl border border-dark-700 bg-dark-900/70 p-5 mt-6 space-y-3">
                            <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                <Send size={16} className="text-accent-500" /> Test SMTP Configuration
                            </h3>
                            <p className="text-xs text-silver-400">
                                Send a live test email using the settings above before saving.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-3 pt-1">
                                <input
                                    type="email"
                                    placeholder="Enter your email to receive test message"
                                    value={testEmailRecipient}
                                    onChange={(e) => setTestEmailRecipient(e.target.value)}
                                    className="flex-1 rounded-lg border border-dark-600 bg-dark-700 px-4 py-2.5 text-white outline-none focus:border-transparent focus:ring-2 focus:ring-accent-500 text-sm"
                                />
                                <button
                                    type="button"
                                    onClick={handleTestEmail}
                                    disabled={testingEmail}
                                    className="rounded-lg border border-accent-500 bg-accent-600/20 px-5 py-2.5 text-sm font-bold text-accent-400 hover:bg-accent-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {testingEmail ? (
                                        <>
                                            <RefreshCw size={15} className="animate-spin" /> Sending...
                                        </>
                                    ) : (
                                        <>
                                            <Send size={15} /> Send Test Email
                                        </>
                                    )}
                                </button>
                            </div>

                            {testEmailResult && (
                                <div className={`p-3 rounded-lg text-xs font-medium border flex items-center gap-2 ${
                                    testEmailResult.success
                                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                        : 'bg-red-500/10 border-red-500/30 text-red-400'
                                }`}>
                                    {testEmailResult.success ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                                    <span>{testEmailResult.message}</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* 4. OTHER APIS MANAGE */}
                {currentSubTab === 'apis' && (
                    <div className="rounded-2xl border border-dark-700 bg-dark-800 p-6 shadow-sm sm:p-8 space-y-6 animate-fade-in">
                        <div>
                            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                                <Cpu className="text-accent-500" size={20} /> Third-Party Services &amp; APIs
                            </h2>
                            <p className="text-sm text-silver-400 mt-1">
                                WhatsApp notifications via Twilio and Firebase server credentials.
                            </p>
                        </div>

                        <div className="space-y-6">
                            {/* Twilio Section */}
                            <div className="p-5 rounded-xl border border-dark-700 bg-dark-900/50 space-y-4">
                                <div className="flex items-center gap-2 text-white font-bold text-sm">
                                    <MessageCircle className="text-emerald-400" size={18} /> Twilio WhatsApp Messaging
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-silver-300">Twilio Account SID</label>
                                        <input
                                            type="text"
                                            name="twilio_account_sid"
                                            value={formData.twilio_account_sid}
                                            onChange={handleInputChange}
                                            placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                                            className="w-full rounded-lg border border-dark-600 bg-dark-700 px-3.5 py-2.5 text-white outline-none focus:ring-2 focus:ring-accent-500 font-mono text-xs"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-silver-300">Twilio Auth Token</label>
                                        <div className="relative">
                                            <input
                                                type={showTwilioToken ? 'text' : 'password'}
                                                name="twilio_auth_token"
                                                value={formData.twilio_auth_token}
                                                onChange={handleInputChange}
                                                placeholder="Your Twilio auth token"
                                                className="w-full rounded-lg border border-dark-600 bg-dark-700 px-3.5 py-2.5 pr-10 text-white outline-none focus:ring-2 focus:ring-accent-500 font-mono text-xs"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowTwilioToken(!showTwilioToken)}
                                                className="absolute right-3 top-2.5 text-silver-400 hover:text-white"
                                            >
                                                {showTwilioToken ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5 md:col-span-2">
                                        <label className="text-xs font-medium text-silver-300">Twilio WhatsApp Number</label>
                                        <input
                                            type="text"
                                            name="twilio_whatsapp_number"
                                            value={formData.twilio_whatsapp_number}
                                            onChange={handleInputChange}
                                            placeholder="whatsapp:+14155238886"
                                            className="w-full rounded-lg border border-dark-600 bg-dark-700 px-3.5 py-2.5 text-white outline-none focus:ring-2 focus:ring-accent-500 font-mono text-xs"
                                        />
                                        <p className="text-[11px] text-silver-500">Twilio approved sender number prefixed with &ldquo;whatsapp:&rdquo;.</p>
                                    </div>
                                </div>
                            </div>

                            {/* Firebase Section */}
                            <div className="p-5 rounded-xl border border-dark-700 bg-dark-900/50 space-y-4">
                                <div className="flex items-center gap-2 text-white font-bold text-sm">
                                    <Shield className="text-amber-400" size={18} /> Firebase Project
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-silver-300">Firebase Project ID</label>
                                    <input
                                        type="text"
                                        name="firebase_project_id"
                                        value={formData.firebase_project_id}
                                        onChange={handleInputChange}
                                        placeholder="markexo-e-commerce"
                                        className="w-full rounded-lg border border-dark-600 bg-dark-700 px-3.5 py-2.5 text-white outline-none focus:ring-2 focus:ring-accent-500 font-mono text-xs"
                                    />
                                    <p className="text-[11px] text-silver-500">Google Cloud / Firebase Project identifier for customer Auth tokens.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 5. CASHFREE PAYMENT GATEWAY CONFIG */}
                {currentSubTab === 'cashfree' && (
                    <div className="rounded-2xl border border-dark-700 bg-dark-800 p-6 shadow-sm sm:p-8 space-y-6 animate-fade-in">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-dark-700 pb-5">
                            <div>
                                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                                    <CreditCard className="text-accent-500" size={20} /> Cashfree Payment Gateway
                                </h2>
                                <p className="text-sm text-silver-400 mt-1">
                                    Enable seamless UPI, Cards, NetBanking, and Wallets collection via Cashfree Payments API.
                                </p>
                            </div>
                            <div className="flex items-center gap-3 bg-dark-900/70 px-4 py-2 rounded-xl border border-dark-600">
                                <label className="text-xs font-bold uppercase tracking-wider text-silver-300">Gateway Status:</label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="cashfree_enabled"
                                        checked={formData.cashfree_enabled}
                                        onChange={handleInputChange}
                                        className="h-5 w-5 rounded border-dark-600 bg-dark-700 text-accent-600 focus:ring-accent-500"
                                    />
                                    <span className={`text-xs font-bold ${formData.cashfree_enabled ? 'text-emerald-400' : 'text-silver-500'}`}>
                                        {formData.cashfree_enabled ? 'ENABLED' : 'DISABLED'}
                                    </span>
                                </label>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-silver-300">Environment Mode</label>
                                    <select
                                        name="cashfree_mode"
                                        value={formData.cashfree_mode}
                                        onChange={handleInputChange}
                                        className="w-full rounded-lg border border-dark-600 bg-dark-700 px-4 py-3 text-white outline-none focus:ring-2 focus:ring-accent-500 font-semibold text-sm"
                                    >
                                        <option value="SANDBOX">SANDBOX (Test Mode - sandbox.cashfree.com)</option>
                                        <option value="PRODUCTION">PRODUCTION (Live Mode - api.cashfree.com)</option>
                                    </select>
                                    <p className="text-xs text-silver-500">
                                        Toggle between test sandbox and live production transactions.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-silver-300">API Version</label>
                                    <input
                                        type="text"
                                        name="cashfree_api_version"
                                        value={formData.cashfree_api_version}
                                        onChange={handleInputChange}
                                        placeholder="2023-08-01"
                                        className="w-full rounded-lg border border-dark-600 bg-dark-700 px-4 py-3 text-white outline-none focus:ring-2 focus:ring-accent-500 font-mono text-sm"
                                    />
                                    <p className="text-xs text-silver-500">Cashfree PG API version (default: 2023-08-01).</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-silver-300">App ID / Client ID</label>
                                    <input
                                        type="text"
                                        name="cashfree_app_id"
                                        value={formData.cashfree_app_id}
                                        onChange={handleInputChange}
                                        placeholder="TEST..."
                                        className="w-full rounded-lg border border-dark-600 bg-dark-700 px-4 py-3 text-white outline-none focus:ring-2 focus:ring-accent-500 font-mono text-sm"
                                    />
                                    <p className="text-xs text-silver-500">Provided in your Cashfree Merchant Dashboard &gt; Developers &gt; API Keys.</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-silver-300">Secret Key</label>
                                    <div className="relative">
                                        <input
                                            type={showCashfreeSecret ? 'text' : 'password'}
                                            name="cashfree_secret_key"
                                            value={formData.cashfree_secret_key}
                                            onChange={handleInputChange}
                                            placeholder="cfsk_ma_..."
                                            className="w-full rounded-lg border border-dark-600 bg-dark-700 px-4 py-3 pr-10 text-white outline-none focus:ring-2 focus:ring-accent-500 font-mono text-sm"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowCashfreeSecret(!showCashfreeSecret)}
                                            className="absolute right-3 top-3.5 text-silver-400 hover:text-white"
                                        >
                                            {showCashfreeSecret ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                    <p className="text-xs text-silver-500">Merchant secret key used to sign and authenticate API requests.</p>
                                </div>
                            </div>

                            {/* Test Cashfree API Connection Utility */}
                            <div className="rounded-xl border border-dark-700 bg-dark-900/70 p-5 mt-6 space-y-3">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div>
                                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                            <Shield size={16} className="text-accent-500" /> Validate Cashfree Credentials
                                        </h3>
                                        <p className="text-xs text-silver-400">
                                            Ping Cashfree API using App ID and Secret Key to verify authentication.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleTestCashfree}
                                        disabled={testingCashfree}
                                        className="rounded-lg border border-accent-500 bg-accent-600/20 px-5 py-2.5 text-sm font-bold text-accent-400 hover:bg-accent-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {testingCashfree ? (
                                            <>
                                                <RefreshCw size={15} className="animate-spin" /> Verifying...
                                            </>
                                        ) : (
                                            <>
                                                <Check size={15} /> Test Credentials
                                            </>
                                        )}
                                    </button>
                                </div>

                                {testCashfreeResult && (
                                    <div className={`p-3 rounded-lg text-xs font-medium border flex items-center gap-2 ${
                                        testCashfreeResult.success
                                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                            : 'bg-red-500/10 border-red-500/30 text-red-400'
                                    }`}>
                                        {testCashfreeResult.success ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                                        <span>{testCashfreeResult.message}</span>
                                    </div>
                                )}
                            </div>

                            <div className="p-4 rounded-xl border border-dark-700 bg-dark-900/40 text-xs text-silver-400 space-y-1">
                                <p className="font-semibold text-silver-300">Webhook Endpoint URL (for Cashfree Dashboard):</p>
                                <p className="font-mono text-accent-400 select-all">https://api.vorionmart.com/api/payments/cashfree/webhook/</p>
                                <p className="text-[11px] text-silver-500">Configure this URL under Cashfree Dashboard &gt; Developers &gt; Webhooks to receive instant asynchronous payment confirmations.</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Common Bottom Save Bar */}
                {canEdit && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-dark-700 bg-dark-800 p-5 shadow-sm">
                        <div>
                            {saveStatus === 'success' && (
                                <span className="flex items-center gap-2 text-sm font-medium text-emerald-400">
                                    <CheckCircle size={18} /> Settings saved and applied successfully.
                                </span>
                            )}
                            {saveStatus === 'error' && errorMessage && (
                                <span className="text-sm font-medium text-red-400 flex items-center gap-1.5">
                                    <AlertCircle size={16} /> {errorMessage}
                                </span>
                            )}
                            {saveStatus === 'idle' && (
                                <span className="text-xs text-silver-400">
                                    Save your changes to update store configurations immediately across all tabs.
                                </span>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={saving}
                            className="btn-primary flex items-center gap-2 shadow-lg shadow-accent-500/20 disabled:cursor-not-allowed disabled:opacity-50 px-6 py-3 text-sm font-bold w-full sm:w-auto justify-center"
                        >
                            {saving ? (
                                <>
                                    <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save size={18} /> Save Settings
                                </>
                            )}
                        </button>
                    </div>
                )}
            </form>
        </div>
    );
}
