import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { useSiteSettings } from '@/context/SiteSettingsContext';

interface AdminHeaderProps {
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
}

export default function AdminHeader({ sidebarOpen, setSidebarOpen }: AdminHeaderProps) {
    const { settings } = useSiteSettings();
    return (
        <div className="lg:hidden bg-dark-900 border-b border-dark-800 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
            <Link href="/admin" className="flex items-center gap-2">
                <img
                    src={settings?.logo_dark || '/logo-white-text.webp'}
                    alt={settings?.site_name ? `${settings.site_name} Logo` : 'VorionMart Logo'}
                    className="h-10 sm:h-12 w-auto max-w-[180px] object-contain"
                />
            </Link>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-lg hover:bg-dark-800 transition-colors">
                {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
        </div>
    );
}
