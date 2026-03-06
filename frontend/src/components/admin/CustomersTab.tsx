import { Search, Mail, Phone, MapPin } from 'lucide-react';
import { Customer } from '@/types/admin';

interface CustomersTabProps {
    customers: Customer[];
}

export default function CustomersTab({ customers }: CustomersTabProps) {
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className="animate-fade-in">
            <h1 className="font-display text-2xl font-bold text-white mb-6">Customers</h1>

            <div className="bg-dark-800 rounded-2xl shadow-sm overflow-hidden border border-dark-700">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-dark-900/50 border-b border-dark-700">
                            <tr>
                                <th className="text-left px-6 py-4 text-xs font-medium text-silver-500 uppercase">Customer</th>
                                <th className="text-left px-6 py-4 text-xs font-medium text-silver-500 uppercase">Contact</th>
                                <th className="text-left px-6 py-4 text-xs font-medium text-silver-500 uppercase">Location</th>
                                <th className="text-left px-6 py-4 text-xs font-medium text-silver-500 uppercase">Joined Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-dark-700">
                            {customers.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-silver-500">
                                        No customers found.
                                    </td>
                                </tr>
                            ) : (
                                customers.map((customer) => (
                                    <tr key={customer.id} className="hover:bg-dark-700/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-accent-500/10 text-accent-500 border border-accent-500/20 rounded-full flex items-center justify-center font-bold">
                                                    {customer.name.charAt(0)}
                                                </div>
                                                <span className="font-semibold text-white">{customer.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1 text-sm text-silver-400">
                                                <div className="flex items-center gap-2">
                                                    <Mail size={14} className="text-silver-500" /> {customer.email}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Phone size={14} className="text-silver-500" /> {customer.phone}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-silver-300">
                                            <div className="flex items-center gap-2">
                                                <MapPin size={14} className="text-silver-500" /> {customer.city}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-silver-500">{formatDate(customer.created_at)}</td>
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
