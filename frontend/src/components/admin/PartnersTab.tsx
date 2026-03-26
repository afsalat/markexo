'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, Shield, Mail, Phone, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { API_BASE_URL } from '@/config/apiConfig';
import PartnerForm from './PartnerForm';

interface Partner {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    is_active: boolean;
    city: string;
    phone: string;
    commission_rate: string;
    notes?: string;
}

export default function PartnersTab() {
    const { token, hasPermission } = useAuth();
    // const canManage = hasPermission('add_user') && hasPermission('add_shop'); 

    const [partners, setPartners] = useState<Partner[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingPartner, setEditingPartner] = useState<Partner | null>(null);

    const fetchPartners = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/admin/partners/?search=${searchTerm}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setPartners(data.results || data);
            }
        } catch (error) {
            console.error('Failed to fetch partners:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) fetchPartners();
    }, [token, searchTerm]);

    const handleEdit = (partner: Partner) => {
        setEditingPartner(partner);
        setShowForm(true);
    };

    const handleAddNew = () => {
        setEditingPartner(null);
        setShowForm(true);
    };

    const handleFormClose = () => {
        setShowForm(false);
        setEditingPartner(null);
        fetchPartners();
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete/deactivate this partner account?')) return;
        try {
            const response = await fetch(`${API_BASE_URL}/admin/partners/${id}/`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                alert('Partner deleted successfully');
                fetchPartners();
            } else {
                alert('Failed to delete partner.');
            }
        } catch (error) {
            console.error(error);
        }
    };

    if (showForm) {
        return (
            <PartnerForm
                partner={editingPartner}
                onBack={handleFormClose}
                onSuccess={handleFormClose}
            />
        );
    }

    return (
        <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <h1 className="font-display text-2xl font-bold text-white flex items-center gap-2">
                    <Shield className="text-accent-500" />
                    Partner Management
                </h1>
                <button
                    onClick={handleAddNew}
                    className="bg-accent-600 text-white px-4 py-2 rounded-lg hover:bg-accent-500 flex items-center gap-2 font-medium transition-colors shadow-lg shadow-accent-500/20"
                >
                    <Plus size={20} />
                    Add Partner
                </button>
            </div>

            {/* Search */}
            <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-silver-500" size={20} />
                <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-dark-800 border border-dark-700 rounded-xl pl-10 pr-4 py-3 text-white placeholder-silver-500 focus:outline-none focus:border-accent-500 transition-colors shadow-sm"
                />
            </div>

            <div className="bg-dark-800 rounded-2xl shadow-sm overflow-hidden border border-dark-700">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-dark-700/50">
                            <tr>
                                <th className="text-left px-6 py-3 text-xs font-medium text-silver-500 uppercase">Partner</th>
                                <th className="text-left px-6 py-3 text-xs font-medium text-silver-500 uppercase">Contact</th>
                                <th className="text-left px-6 py-3 text-xs font-medium text-silver-500 uppercase">Status</th>
                                <th className="text-right px-6 py-3 text-xs font-medium text-silver-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-dark-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center">
                                        <div className="flex justify-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-500"></div>
                                        </div>
                                    </td>
                                </tr>
                            ) : partners.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-silver-500">
                                        No partners found.
                                    </td>
                                </tr>
                            ) : (
                                partners.map((partner) => (
                                    <tr key={partner.id} className="hover:bg-dark-700 group transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-indigo-500/10 text-indigo-500 rounded-lg flex items-center justify-center border border-indigo-500/20">
                                                    <span className="font-bold text-lg">
                                                        {partner.first_name?.[0]?.toUpperCase() || partner.email[0].toUpperCase()}
                                                    </span>
                                                </div>
                                                <div>
                                                    <div className="font-medium text-white">
                                                        {partner.first_name} {partner.last_name}
                                                    </div>
                                                    <div className="text-xs text-silver-500 flex items-center gap-1">
                                                        <Mail size={12} />
                                                        {partner.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                                <div className="text-sm text-silver-400 flex items-center gap-2">
                                                    <Phone size={14} />
                                                {partner.phone || 'N/A'}
                                                </div>
                                            </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                {partner.is_active ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-500/10 text-green-500 border border-green-500/20 w-fit">
                                                        <CheckCircle size={10} /> User Active
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-500/10 text-red-500 border border-red-500/20 w-fit">
                                                        <XCircle size={10} /> User Inactive
                                                    </span>
                                                )}
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-dark-700 text-silver-300 border border-dark-600 w-fit">
                                                    {partner.city || 'No city'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-1">
                                                <button
                                                    onClick={() => handleEdit(partner)}
                                                    className="p-2 text-silver-400 hover:text-accent-500 hover:bg-accent-500/10 rounded-lg transition-colors"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(partner.id)}
                                                    className="p-2 text-silver-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
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
