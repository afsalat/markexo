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
                <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold">M</span>
                </div>
                <span className="font-display font-bold">Markexo Admin</span>
            </Link>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2">
                {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
        </div>
    );
}
