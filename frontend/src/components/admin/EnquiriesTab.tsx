import { Trash2, Mail, MessageSquare, Calendar, Search, Filter, RefreshCcw } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { API_BASE_URL } from '@/config/apiConfig';

interface Enquiry {
    id: number;
    name: string;
    email: string;
    subject: string;
    message: string;
    status: 'pending' | 'responded';
    is_read: boolean;
    created_at: string;
}

export default function EnquiriesTab() {
    const { token, hasPermission } = useAuth();
    const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
    const [loading, setLoading] = useState(true);
    const canDelete = hasPermission('delete_enquiry');
    const canEdit = hasPermission('change_enquiry');
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        fetchEnquiries();
    }, [search, statusFilter]);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchEnquiries();
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    const fetchEnquiries = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.append('search', search);
            if (statusFilter) params.append('status', statusFilter);

            const response = await fetch(`${API_BASE_URL}/admin/enquiries/?${params.toString()}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setEnquiries(data.results || data);
            }
        } catch (error) {
            console.error('Error fetching enquiries:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this enquiry?')) return;

        try {
            const response = await fetch(`${API_BASE_URL}/admin/enquiries/${id}/`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                setEnquiries(enquiries.filter(e => e.id !== id));
            } else {
                alert('Failed to delete enquiry');
            }
        } catch (error) {
            console.error('Error delete enquiry:', error);
        }
    };

    const handleStatusToggle = async (enquiry: Enquiry) => {
        const newStatus = enquiry.status === 'pending' ? 'responded' : 'pending';

        try {
            const response = await fetch(`${API_BASE_URL}/admin/enquiries/${enquiry.id}/`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (response.ok) {
                setEnquiries(enquiries.map(e =>
                    e.id === enquiry.id ? { ...e, status: newStatus } : e
                ));
            }
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    return (
        <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="font-display text-2xl font-bold text-white">Enquiries</h1>
                    <p className="text-sm text-silver-500 mt-1">Manage customer messages and support requests.</p>
                </div>

                <div className="flex gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-silver-500" size={18} />
                        <input
                            type="text"
                            placeholder="Search enquiries..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-dark-600 rounded-lg outline-none focus:ring-2 focus:ring-accent-500 w-64 bg-dark-700 text-white placeholder-silver-600"
                        />
                    </div>
                    <div className="relative">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-dark-700 transition-colors ${statusFilter ? 'border-accent-500 text-accent-500 bg-accent-500/10' : 'border-dark-600 text-silver-400'}`}
                        >
                            <Filter size={18} /> {statusFilter ? (statusFilter === 'pending' ? 'Pending' : 'Responded') : 'All Status'}
                        </button>

                        {showFilters && (
                            <div className="absolute right-0 mt-2 w-48 bg-dark-800 rounded-xl shadow-lg border border-dark-700 py-1 z-10">
                                <button
                                    onClick={() => { setStatusFilter(''); setShowFilters(false); }}
                                    className="block w-full text-left px-4 py-2 text-sm text-silver-300 hover:bg-dark-700 hover:text-white"
                                >
                                    All Enquiries
                                </button>
                                <button
                                    onClick={() => { setStatusFilter('pending'); setShowFilters(false); }}
                                    className="block w-full text-left px-4 py-2 text-sm text-silver-300 hover:bg-dark-700 hover:text-white"
                                >
                                    Pending
                                </button>
                                <button
                                    onClick={() => { setStatusFilter('responded'); setShowFilters(false); }}
                                    className="block w-full text-left px-4 py-2 text-sm text-silver-300 hover:bg-dark-700 hover:text-white"
                                >
                                    Responded
                                </button>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={fetchEnquiries}
                        className="p-2 border border-dark-600 rounded-lg hover:bg-dark-700 text-silver-500 hover:text-white transition-colors"
                        title="Refresh"
                    >
                        <RefreshCcw size={18} />
                    </button>
                </div>
            </div>

            <div className="grid gap-4">
                {loading ? (
                    <div className="p-12 text-center text-silver-500">Loading enquiries...</div>
                ) : enquiries.length === 0 ? (
                    <div className="bg-dark-800 rounded-2xl p-12 text-center text-silver-500 shadow-sm border border-dashed border-dark-700">
                        <MessageSquare size={48} className="mx-auto mb-4 text-dark-600" />
                        <p className="text-lg font-medium text-white">No enquiries found</p>
                        <p className="text-sm">Try adjusting your search or filters.</p>
                    </div>
                ) : (
                    enquiries.map((enquiry) => (
                        <div key={enquiry.id} className="bg-dark-800 p-6 rounded-2xl shadow-sm border border-dark-700 hover:border-dark-600 transition-all">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-accent-500/10 text-accent-500 border border-accent-500/20 rounded-full flex items-center justify-center font-bold">
                                        {enquiry.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold text-white">{enquiry.name}</h3>
                                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${enquiry.status === 'responded'
                                                ? 'bg-green-500/10 text-green-500 border-green-500/20'
                                                : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                                }`}>
                                                {enquiry.status === 'responded' ? 'Responded' : 'Pending'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-silver-500">
                                            <Mail size={14} /> {enquiry.email}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    {canEdit && (
                                        <button
                                            onClick={() => handleStatusToggle(enquiry)}
                                            className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${enquiry.status === 'pending'
                                                ? 'border-accent-500/30 text-accent-500 hover:bg-accent-500/10'
                                                : 'border-dark-600 text-silver-500 hover:bg-dark-700 hover:text-white'
                                                }`}
                                        >
                                            {enquiry.status === 'pending' ? 'Mark Responded' : 'Mark Pending'}
                                        </button>
                                    )}
                                    <span className="text-xs text-silver-600 flex items-center gap-1">
                                        <Calendar size={12} />
                                        {new Date(enquiry.created_at).toLocaleDateString()}
                                    </span>
                                    {canDelete && (
                                        <button
                                            onClick={() => handleDelete(enquiry.id)}
                                            className="text-silver-600 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="mt-2 pl-14">
                                <h4 className="font-medium text-white mb-1">Subject: {enquiry.subject}</h4>
                                <div className="bg-dark-900/50 rounded-lg p-3 text-silver-300 text-sm leading-relaxed whitespace-pre-wrap border border-dark-700/50">
                                    {enquiry.message}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
