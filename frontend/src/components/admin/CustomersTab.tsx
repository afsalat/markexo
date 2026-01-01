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
            <h1 className="font-display text-2xl font-bold text-gray-900 mb-6">Customers</h1>

            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase">Customer</th>
                                <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase">Contact</th>
                                <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase">Location</th>
                                <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase">Joined Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {customers.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                                        No customers found.
                                    </td>
                                </tr>
                            ) : (
                                customers.map((customer) => (
                                    <tr key={customer.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center font-bold">
                                                    {customer.name.charAt(0)}
                                                </div>
                                                <span className="font-semibold text-gray-900">{customer.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1 text-sm text-gray-600">
                                                <div className="flex items-center gap-2">
                                                    <Mail size={14} className="text-gray-400" /> {customer.email}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Phone size={14} className="text-gray-400" /> {customer.phone}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-700">
                                            <div className="flex items-center gap-2">
                                                <MapPin size={14} className="text-gray-400" /> {customer.city}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500">{formatDate(customer.created_at)}</td>
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
