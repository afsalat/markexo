import { MapPin, Phone, Mail, CheckCircle, Edit, Store } from 'lucide-react';
import { Shop } from '@/types/admin';
import { useState } from 'react';
import ShopDetail from '@/components/admin/ShopDetail';

interface PartnerShopsTabProps {
    shops: Shop[];
    onRefresh?: () => void;
}

export default function PartnerShopsTab({ shops, onRefresh }: PartnerShopsTabProps) {
    const [selectedShop, setSelectedShop] = useState<Shop | null>(null);

    if (selectedShop) {
        return <ShopDetail shop={selectedShop} onBack={() => setSelectedShop(null)} />;
    }

    return (
        <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <h1 className="font-display text-2xl font-bold text-white">My Shops</h1>
            </div>

            <div className="bg-dark-800 rounded-2xl shadow-sm overflow-hidden border border-dark-700">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-dark-900/50 border-b border-dark-700">
                            <tr>
                                <th className="text-left px-6 py-4 text-xs font-medium text-silver-500 uppercase">Shop Info</th>
                                <th className="text-left px-6 py-4 text-xs font-medium text-silver-500 uppercase">Contact</th>
                                <th className="text-left px-6 py-4 text-xs font-medium text-silver-500 uppercase">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-dark-700">
                            {shops.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="px-6 py-8 text-center text-silver-500">
                                        No shops available.
                                    </td>
                                </tr>
                            ) : (
                                shops.map((shop) => (
                                    <tr
                                        key={shop.id}
                                        onClick={() => setSelectedShop(shop)}
                                        className="hover:bg-dark-700/50 cursor-pointer transition-colors"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-accent-500/10 text-accent-500 border border-accent-500/20 rounded-lg flex items-center justify-center font-bold">
                                                    {shop.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-white">{shop.name}</p>
                                                    <p className="text-xs text-silver-500">{shop.city}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1 text-sm text-silver-400">
                                                <div>{shop.phone}</div>
                                                <div>{shop.email}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${shop.is_active ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-dark-700 text-silver-400 border-dark-600'} `}>
                                                {shop.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
