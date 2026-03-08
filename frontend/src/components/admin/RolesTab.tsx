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
                    <h1 className="text-2xl font-display font-bold text-white">Roles & Permissions</h1>
                    <p className="text-sm text-silver-500">Manage administrative roles and their access levels.</p>
                </div>
                {canAdd && (
                    <button
                        onClick={() => handleOpenModal()}
                        className="flex items-center gap-2 btn-primary shadow-lg shadow-accent-500/20 active:scale-95"
                    >
                        <Plus size={18} />
                        <span>Create Role</span>
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    Array(3).fill(0).map((_, i) => (
                        <div key={i} className="bg-dark-800 rounded-2xl h-48 animate-pulse border border-dark-700"></div>
                    ))
                ) : roles.map(role => (
                    <div key={role.id} className="bg-dark-800 rounded-2xl p-6 shadow-sm border border-dark-700 group hover:border-accent-500/50 transition-all">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-accent-500/10 text-accent-500 rounded-xl border border-accent-500/20 group-hover:bg-accent-500/20 transition-colors">
                                <Shield size={24} />
                            </div>
                            {(canEdit || canDelete) && (
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {canEdit && (
                                        <button
                                            onClick={() => handleOpenModal(role)}
                                            className="p-2 text-silver-500 hover:text-accent-500 hover:bg-accent-500/10 rounded-lg transition-all"
                                        >
                                            <Edit size={16} />
                                        </button>
                                    )}
                                    {canDelete && (
                                        <button
                                            onClick={() => handleDelete(role.id)}
                                            className="p-2 text-silver-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                        <h3 className="text-xl font-bold text-white mb-1">{role.name}</h3>
                        <p className="text-sm text-silver-500 mb-4">{role.permissions.length} Permissions Assigned</p>

                        <div className="flex flex-wrap gap-1">
                            {role.permissions.slice(0, 3).map(p => (
                                <span key={p.id} className="text-[10px] font-bold uppercase tracking-wider bg-dark-700 text-silver-400 px-2 py-0.5 rounded-full border border-dark-600">
                                    {p.codename.split('_')[0]}
                                </span>
                            ))}
                            {role.permissions.length > 3 && (
                                <span className="text-[10px] font-bold bg-accent-500/10 text-accent-500 px-2 py-0.5 rounded-full border border-accent-500/20">
                                    +{role.permissions.length - 3} more
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Role Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="bg-dark-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-scale-in border border-dark-700">
                        <div className="p-6 border-b border-dark-700 flex justify-between items-center bg-dark-900/50">
                            <div>
                                <h2 className="text-xl font-bold text-white">{editingRole ? 'Edit Role' : 'Create New Role'}</h2>
                                <p className="text-xs text-silver-500">Define the role name and select access permissions.</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="p-2 text-silver-500 hover:text-white hover:bg-dark-700 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6">
                            {error && (
                                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm mb-4">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-4 mb-6">
                                <div className="space-y-1">
                                    <label className="text-sm font-semibold text-silver-300">Role Name</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="e.g. Content Manager"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-2 bg-dark-700 border border-dark-600 text-white rounded-xl outline-none focus:ring-2 focus:ring-accent-500 placeholder-silver-600"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <label className="text-sm font-semibold text-silver-300">Select Permissions ({formData.permission_ids.length})</label>
                                        <div className="relative w-48">
                                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-silver-500" size={14} />
                                            <input
                                                type="text"
                                                placeholder="Search permissions..."
                                                value={permSearch}
                                                onChange={(e) => setPermSearch(e.target.value)}
                                                className="w-full pl-8 pr-3 py-1 text-xs bg-dark-700 border border-dark-600 text-white rounded-lg outline-none focus:ring-1 focus:ring-accent-500 placeholder-silver-500"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 h-64 overflow-y-auto p-4 border border-dark-600 rounded-2xl bg-dark-900/30">
                                        {filteredPermissions.map(perm => (
                                            <button
                                                key={perm.id}
                                                type="button"
                                                onClick={() => togglePermission(perm.id)}
                                                className={`flex items-center justify-between p-3 rounded-xl border transition-all text-left ${formData.permission_ids.includes(perm.id)
                                                    ? 'bg-accent-500/10 border-accent-500/30 text-accent-400 shadow-sm'
                                                    : 'bg-dark-700 border-dark-600 text-silver-400 hover:border-dark-500 shadow-none'
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

                            <div className="flex gap-3 pt-4 border-t border-dark-700">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 py-3 bg-dark-700 text-silver-300 rounded-xl font-bold hover:bg-dark-600 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 py-3 btn-primary shadow-lg shadow-accent-500/20 active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2"
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
