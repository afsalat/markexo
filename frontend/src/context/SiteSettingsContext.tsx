'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { SiteSetting } from '@/types/admin';
import { API_BASE_URL } from '@/config/apiConfig';

export const DEFAULT_SITE_SETTINGS: SiteSetting = {
    id: 1,
    site_name: 'VorionMart',
    site_tagline: 'Premium D2C platform bringing the future of shopping to your doorstep. Pay on delivery, no hassles.',
    logo: '/logo-black-text.webp',
    logo_light: '/logo-black-text.webp',
    logo_dark: '/logo-white-text.webp',
    contact_email: 'vorionmart@gmail.com',
    contact_phone: '+91 7356216468',
    whatsapp_number: '+91 7356216468',
    address: 'Vorion Nexus Technology, Thoppayil Beach C.25, O.P Nadakkavu, Kozhikode, Kerala 673011',
    facebook_url: 'https://facebook.com/vorionmart',
    instagram_url: 'https://instagram.com/vorionmart',
    twitter_url: 'https://twitter.com/vorionmart',
};

interface SiteSettingsContextType {
    settings: SiteSetting;
    loading: boolean;
    refreshSettings: () => Promise<void>;
    updateLocalSettings: (newSettings: Partial<SiteSetting>) => void;
}

const SiteSettingsContext = createContext<SiteSettingsContextType>({
    settings: DEFAULT_SITE_SETTINGS,
    loading: false,
    refreshSettings: async () => {},
    updateLocalSettings: () => {},
});

export function SiteSettingsProvider({ children }: { children: React.ReactNode }) {
    const [settings, setSettings] = useState<SiteSetting>(DEFAULT_SITE_SETTINGS);
    const [loading, setLoading] = useState(true);

    const mergeSettings = useCallback((apiData: Partial<SiteSetting> | null | undefined): SiteSetting => {
        if (!apiData) return DEFAULT_SITE_SETTINGS;
        return {
            ...DEFAULT_SITE_SETTINGS,
            ...apiData,
            site_name: apiData.site_name || DEFAULT_SITE_SETTINGS.site_name,
            site_tagline: apiData.site_tagline || DEFAULT_SITE_SETTINGS.site_tagline,
            logo: apiData.logo || DEFAULT_SITE_SETTINGS.logo,
            logo_light: apiData.logo_light || apiData.logo || DEFAULT_SITE_SETTINGS.logo_light,
            logo_dark: apiData.logo_dark || apiData.logo || DEFAULT_SITE_SETTINGS.logo_dark,
            contact_email: apiData.contact_email || DEFAULT_SITE_SETTINGS.contact_email,
            contact_phone: apiData.contact_phone || DEFAULT_SITE_SETTINGS.contact_phone,
            whatsapp_number: apiData.whatsapp_number || DEFAULT_SITE_SETTINGS.whatsapp_number,
            address: apiData.address || DEFAULT_SITE_SETTINGS.address,
            facebook_url: apiData.facebook_url || DEFAULT_SITE_SETTINGS.facebook_url,
            instagram_url: apiData.instagram_url || DEFAULT_SITE_SETTINGS.instagram_url,
            twitter_url: apiData.twitter_url || DEFAULT_SITE_SETTINGS.twitter_url,
        };
    }, []);

    const fetchSettings = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/settings/`);
            if (res.ok) {
                const data = await res.json();
                setSettings(mergeSettings(data));
            }
        } catch (err) {
            console.error('Failed to load site settings:', err);
        } finally {
            setLoading(false);
        }
    }, [mergeSettings]);

    useEffect(() => {
        fetchSettings();

        // Listen for updates dispatched from SettingsTab or other tabs
        const handleSettingsUpdate = (event: Event) => {
            const customEvent = event as CustomEvent<Partial<SiteSetting>>;
            if (customEvent.detail) {
                setSettings((prev) => mergeSettings({ ...prev, ...customEvent.detail }));
            } else {
                fetchSettings();
            }
        };

        window.addEventListener('site-settings-updated', handleSettingsUpdate);
        return () => window.removeEventListener('site-settings-updated', handleSettingsUpdate);
    }, [fetchSettings, mergeSettings]);

    const updateLocalSettings = useCallback((newSettings: Partial<SiteSetting>) => {
        setSettings((prev) => mergeSettings({ ...prev, ...newSettings }));
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('site-settings-updated', { detail: newSettings }));
        }
    }, [mergeSettings]);

    return (
        <SiteSettingsContext.Provider
            value={{
                settings,
                loading,
                refreshSettings: fetchSettings,
                updateLocalSettings,
            }}
        >
            {children}
        </SiteSettingsContext.Provider>
    );
}

export function useSiteSettings() {
    return useContext(SiteSettingsContext);
}
