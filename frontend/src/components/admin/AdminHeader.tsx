import Link from 'next/link';
import { Menu, X } from 'lucide-react';

interface AdminHeaderProps {
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
}

export default function AdminHeader({ sidebarOpen, setSidebarOpen }: AdminHeaderProps) {
    return (
        <div className="lg:hidden bg-dark-900 border-b border-dark-800 p-4 flex items-center justify-between sticky top-0 z-40">
            <Link href="/admin" className="flex items-center gap-2">
                <img
                    src="/logo-white-text.png"
                    alt="VorionMart Logo"
                    className="h-14 w-auto object-contain"
                />
            </Link>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2">
                {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
        </div>
    );
}
