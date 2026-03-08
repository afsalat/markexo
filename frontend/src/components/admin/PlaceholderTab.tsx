import { Users, Image, Settings } from 'lucide-react';

interface PlaceholderTabProps {
    tabName: string;
}

export default function PlaceholderTab({ tabName }: PlaceholderTabProps) {
    return (
        <div className="animate-fade-in">
            <h1 className="font-display text-2xl font-bold text-gray-900 mb-6 capitalize">{tabName}</h1>
            <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    {tabName === 'customers' && <Users className="text-gray-400" size={32} />}
                    {tabName === 'banners' && <Image className="text-gray-400" size={32} />}
                    {tabName === 'settings' && <Settings className="text-gray-400" size={32} />}
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">{tabName} Management</h2>
                <p className="text-gray-500">This section is ready to be connected to your Django backend API.</p>
            </div>
        </div>
    );
}
