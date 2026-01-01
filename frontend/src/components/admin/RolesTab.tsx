'use client';

import React, { useState, useEffect } from 'react';
import { Shield, Plus, Trash2, Edit, Search, X, Check, Loader2, ChevronRight } from 'lucide-react';
import { Role, Permission } from '@/types/admin';
import { useAuth } from '@/context/AuthContext';
import { API_BASE_URL } from '@/config/apiConfig';

export default function RolesTab() {
    const [roles, setRoles] = useState<Role[]>([]);
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingRole, setEditingRole] = useState<Role | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const { token, hasPermission } = useAuth();
    const canAdd = hasPermission('add_group');
    const canEdit = hasPermission('change_group');
    const canDelete = hasPermission('delete_group');

    const [formData, setFormData] = useState({
        name: '',
        permission_ids: [] as number[]
    });

    const [permSearch, setPermSearch] = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            const [rolesRes, permsRes] = await Promise.all([
                fetch(`${API_BASE_URL}/admin/roles/`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch(`${API_BASE_URL}/admin/permissions/`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);

            if (rolesRes.ok) {
                const data = await rolesRes.json();
                setRoles(data.results || data);
            }
            if (permsRes.ok) {
                const data = await permsRes.json();
                setPermissions(data.results || data);
            }
        } catch (err) {
            console.error('Error fetching RBAC data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) fetchData();
    }, [token]);

    const handleOpenModal = (role: Role | null = null) => {
        if (role) {
            setEditingRole(role);
            setFormData({
                name: role.name,
                permission_ids: role.permissions.map(p => p.id)
            });
        } else {
            setEditingRole(null);
            setFormData({ name: '', permission_ids: [] });
        }
        setShowModal(true);
        setError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        const url = editingRole
            ? `${API_BASE_URL}/admin/roles/${editingRole.id}/`
            : `${API_BASE_URL}/admin/roles/`;

        const method = editingRole ? 'PATCH' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                setShowModal(false);
                fetchData();
            } else {
                const data = await res.json();
                setError(Object.values(data).flat().join(', '));
            }
        } catch (err) {
            setError('Failed to save role.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this role?')) return;
        try {
            const res = await fetch(`${API_BASE_URL}/admin/roles/${id}/`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) fetchData();
        } catch (err) {
            console.error('Delete error:', err);
        }
    };

    const togglePermission = (id: number) => {
        setFormData(prev => ({
            ...prev,
            permission_ids: prev.permission_ids.includes(id)
                ? prev.permission_ids.filter(pid => pid !== id)
                : [...prev.permission_ids, id]
        }));
    };

    const filteredPermissions = permissions.filter(p =>
        p.name.toLowerCase().includes(permSearch.toLowerCase()) ||
        p.codename.toLowerCase().includes(permSearch.toLowerCase())
    );

    return (
        <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-display font-bold text-gray-900">Roles & Permissions</h1>
                    <p className="text-sm text-gray-500">Manage administrative roles and their access levels.</p>
                </div>
                {canAdd && (
                    <button
                        onClick={() => handleOpenModal()}
                        className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-xl hover:bg-primary-700 transition-all shadow-md active:scale-95"
                    >
                        <Plus size={18} />
                        <span>Create Role</span>
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    Array(3).fill(0).map((_, i) => (
                        <div key={i} className="bg-white rounded-2xl h-48 animate-pulse border border-gray-100"></div>
                    ))
                ) : roles.map(role => (
                    <div key={role.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 group hover:border-primary-200 transition-all">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-primary-50 text-primary-600 rounded-xl group-hover:bg-primary-100 transition-colors">
                                <Shield size={24} />
                            </div>
                            {(canEdit || canDelete) && (
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {canEdit && (
                                        <button
                                            onClick={() => handleOpenModal(role)}
                                            className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                                        >
                                            <Edit size={16} />
                                        </button>
                                    )}
                                    {canDelete && (
                                        <button
                                            onClick={() => handleDelete(role.id)}
                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-1">{role.name}</h3>
                        <p className="text-sm text-gray-500 mb-4">{role.permissions.length} Permissions Assigned</p>

                        <div className="flex flex-wrap gap-1">
                            {role.permissions.slice(0, 3).map(p => (
                                <span key={p.id} className="text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                                    {p.codename.split('_')[0]}
                                </span>
                            ))}
                            {role.permissions.length > 3 && (
                                <span className="text-[10px] font-bold bg-primary-50 text-primary-600 px-2 py-0.5 rounded-full">
                                    +{role.permissions.length - 3} more
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Role Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-scale-in">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">{editingRole ? 'Edit Role' : 'Create New Role'}</h2>
                                <p className="text-xs text-gray-500">Define the role name and select access permissions.</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6">
                            {error && (
                                <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm mb-4">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-4 mb-6">
                                <div className="space-y-1">
                                    <label className="text-sm font-semibold text-gray-700">Role Name</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="e.g. Content Manager"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <label className="text-sm font-semibold text-gray-700">Select Permissions ({formData.permission_ids.length})</label>
                                        <div className="relative w-48">
                                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                                            <input
                                                type="text"
                                                placeholder="Search permissions..."
                                                value={permSearch}
                                                onChange={(e) => setPermSearch(e.target.value)}
                                                className="w-full pl-8 pr-3 py-1 text-xs border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-primary-500"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 h-64 overflow-y-auto p-4 border border-gray-100 rounded-2xl bg-gray-50/30">
                                        {filteredPermissions.map(perm => (
                                            <button
                                                key={perm.id}
                                                type="button"
                                                onClick={() => togglePermission(perm.id)}
                                                className={`flex items-center justify-between p-3 rounded-xl border transition-all text-left ${formData.permission_ids.includes(perm.id)
                                                    ? 'bg-primary-50 border-primary-200 text-primary-700 shadow-sm'
                                                    : 'bg-white border-gray-100 text-gray-600 hover:border-gray-200 shadow-none'
                                                    }`}
                                            >
                                                <div className="min-w-0">
                                                    <p className="text-xs font-bold truncate">{perm.name}</p>
                                                    <p className="text-[10px] opacity-70 font-mono truncate">{perm.codename}</p>
                                                </div>
                                                {formData.permission_ids.includes(perm.id) && <Check size={14} />}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 py-3 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 transition-all shadow-lg active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2"
                                >
                                    {submitting ? <Loader2 className="animate-spin" size={20} /> : (editingRole ? 'Update Role' : 'Create Role')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
