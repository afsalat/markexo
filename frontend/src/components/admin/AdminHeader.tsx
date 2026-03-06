import Link from 'next/link';
import { Menu, X } from 'lucide-react';

interface AdminHeaderProps {
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
}

export default function AdminHeader({ sidebarOpen, setSidebarOpen }: AdminHeaderProps) {
    return (
        <div className="lg:hidden bg-white border-b border-gray-200 p-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
                <img
                    src="/logo-black-text.jpg"
                    alt="VorionMart Logo"
                    className="h-16 w-auto object-contain"
                />
            </Link>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2">
                {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
        </div>
    );
}
