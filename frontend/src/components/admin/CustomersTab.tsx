import { useState, useMemo } from 'react';
import { Search, Mail, Phone, MapPin, Download, Loader2 } from 'lucide-react';
import { Customer } from '@/types/admin';
import { exportCustomersToExcel } from '@/lib/excelExport';

interface CustomersTabProps {
    customers: Customer[];
}

export default function CustomersTab({ customers }: CustomersTabProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [exporting, setExporting] = useState(false);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const filteredCustomers = useMemo(() => {
        const query = searchTerm.trim().toLowerCase();
        if (!query) return customers;
        return customers.filter((c) =>
            (c.name || '').toLowerCase().includes(query) ||
            (c.email || '').toLowerCase().includes(query) ||
            (c.phone || '').toLowerCase().includes(query) ||
            (c.city || '').toLowerCase().includes(query)
        );
    }, [customers, searchTerm]);

    const handleExportCustomers = async () => {
        setExporting(true);
        try {
            const listToExport = filteredCustomers.length > 0 ? filteredCustomers : customers;
            if (!listToExport || listToExport.length === 0) {
                alert('No customers found to export.');
                return;
            }

            const searchLabel = searchTerm.trim() ? `Search: "${searchTerm.trim()}"` : '';
            await exportCustomersToExcel(listToExport, {
                subtitle: searchLabel ? `Customer Directory | ${searchLabel}` : 'Registered customer profiles and contacts',
            });
        } catch (err) {
            console.error('Failed to export customers:', err);
            alert('Failed to export customers to Excel. Please try again.');
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="animate-fade-in space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="font-display text-2xl font-bold text-white">Customers</h1>
                    <p className="mt-1 text-sm text-silver-500">
                        Showing {filteredCustomers.length} of {customers.length} registered customers
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative w-full sm:w-64">
                        <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-silver-500" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search name, phone, city..."
                            className="w-full rounded-xl border border-dark-700 bg-dark-800 py-2 pl-10 pr-3 text-sm text-white placeholder:text-silver-500 focus:border-accent-500 focus:outline-none"
                        />
                    </div>
                    <button
                        type="button"
                        onClick={handleExportCustomers}
                        disabled={exporting}
                        className="flex shrink-0 items-center justify-center gap-2 rounded-xl border border-dark-600 bg-dark-700 px-4 py-2 font-medium text-white shadow-sm transition-colors hover:bg-dark-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Export Customers to Excel"
                    >
                        {exporting ? <Loader2 size={18} className="animate-spin text-accent-500" /> : <Download size={18} />}
                        <span className="hidden sm:inline">{exporting ? 'Exporting...' : 'Export'}</span>
                    </button>
                </div>
            </div>

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
                            {filteredCustomers.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-silver-500">
                                        No customers found.
                                    </td>
                                </tr>
                            ) : (
                                filteredCustomers.map((customer) => (
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
