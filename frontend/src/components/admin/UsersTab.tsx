'use client';

import React, { useState, useEffect } from 'react';
import { UserPlus, Trash2, Search, Mail, Shield, Calendar, Loader2, X, Edit, Check } from 'lucide-react';
import { AdminUser, Role } from '@/types/admin';
import { useAuth } from '@/context/AuthContext';
import { API_BASE_URL } from '@/config/apiConfig';

export default function UsersTab() {
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const { token, hasPermission } = useAuth();
    const canAdd = hasPermission('add_user');
    const canEdit = hasPermission('change_user');
    const canDelete = hasPermission('delete_user');

    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        role_ids: [] as number[],
        is_active: true
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.append('search', search);

            const headers = { 'Authorization': `Bearer ${token}` };

            const [usersRes, rolesRes] = await Promise.all([
                fetch(`${API_BASE_URL}/admin/users/?${params.toString()}`, { headers }),
                fetch(`${API_BASE_URL}/admin/roles/`, { headers })
            ]);

            if (usersRes.ok) {
                const data = await usersRes.json();
                const allUsers = data.results || data;
                // Filter out partners as they have their own management tab
                const adminsOnly = allUsers.filter((u: AdminUser) =>
                    !u.roles?.some(r => r.name.toLowerCase() === 'partner')
                );
                setUsers(adminsOnly);
            }
            if (rolesRes.ok) {
                const data = await rolesRes.json();
                setRoles(data.results || data);
            }
        } catch (err) {
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            const timer = setTimeout(() => fetchData(), 500);
            return () => clearTimeout(timer);
        }
    }, [search, token]);

    const handleOpenModal = (user: AdminUser | null = null) => {
        if (user) {
            setEditingUser(user);
            setFormData({
                username: user.username,
                email: user.email,
                password: '',
                first_name: user.first_name,
                last_name: user.last_name,
                role_ids: user.roles?.map(r => r.id) || [],
                is_active: user.is_active
            });
        } else {
            setEditingUser(null);
            setFormData({
                username: '', email: '', password: '',
                first_name: '', last_name: '', role_ids: [],
                is_active: true
            });
        }
        setShowModal(true);
        setError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        const url = editingUser
            ? `${API_BASE_URL}/admin/users/${editingUser.id}/`
            : `${API_BASE_URL}/admin/users/`;

        const method = editingUser ? 'PATCH' : 'POST';

        const body = { ...formData };
        if (editingUser && !body.password) {
            delete (body as any).password;
        }

        try {
            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                setShowModal(false);
                fetchData();
            } else {
                const data = await res.json();
                setError(Object.values(data).flat().join(', '));
            }
        } catch (err) {
            setError('Failed to save user account.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteUser = async (id: number) => {
        if (!confirm('Are you sure you want to remove this admin?')) return;
        try {
            const res = await fetch(`${API_BASE_URL}/admin/users/${id}/`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) fetchData();
        } catch (err) {
            console.error('Error deleting user:', err);
        }
    };

    const toggleRole = (id: number) => {
        setFormData(prev => ({
            ...prev,
            role_ids: prev.role_ids.includes(id)
                ? prev.role_ids.filter(rid => rid !== id)
                : [...prev.role_ids, id]
        }));
    };

    return (
        <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-display font-bold text-white">Admin Management</h1>
                {canAdd && (
                    <button
                        onClick={() => handleOpenModal()}
                        className="flex items-center gap-2 btn-primary shadow-lg shadow-accent-500/20"
                    >
                        <UserPlus size={18} />
                        <span>Add New Admin</span>
                    </button>
                )}
            </div>

            <div className="bg-dark-800 rounded-2xl shadow-sm border border-dark-700 overflow-hidden">
                <div className="p-4 border-b border-dark-700 bg-dark-900/50">
                    <div className="relative max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-silver-500" size={18} />
                        <input
                            type="text"
                            placeholder="Search admins..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-dark-800 border border-dark-600 rounded-xl outline-none focus:ring-2 focus:ring-accent-500 transition-all text-white placeholder-silver-500"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-dark-900/50 text-silver-500 text-xs font-bold uppercase tracking-wider border-b border-dark-700">
                                <th className="px-6 py-4">User</th>
                                <th className="px-6 py-4">Contact</th>
                                <th className="px-6 py-4">Roles</th>
                                <th className="px-6 py-4">Status</th>
                                {(canEdit || canDelete) && <th className="px-6 py-4 text-right">Actions</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-dark-700">
                            {loading ? (
                                Array(3).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse"><td colSpan={5} className="px-6 py-8"><div className="h-4 bg-dark-700 rounded w-full"></div></td></tr>
                                ))
                            ) : users.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-12 text-center text-silver-500">No admin users found.</td></tr>
                            ) : (
                                users.map((user) => (
                                    <tr key={user.id} className="hover:bg-dark-700/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-accent-500/10 text-accent-500 border border-accent-500/20 rounded-xl flex items-center justify-center font-bold">
                                                    {user.username.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-white">{user.username}</p>
                                                    <p className="text-sm text-silver-500">{user.first_name} {user.last_name}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-silver-400">
                                            <div className="flex items-center gap-2"><Mail size={14} className="text-silver-500" />{user.email}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-1">
                                                {user.roles && user.roles.length > 0 ? user.roles.map(role => (
                                                    <span key={role.id} className="text-[10px] font-bold bg-accent-500/10 text-accent-500 px-2 py-0.5 rounded-full border border-accent-500/20 uppercase">
                                                        {role.name}
                                                    </span>
                                                )) : <span className="text-[10px] text-silver-600">No roles</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                {user.is_active ? (
                                                    <span className="flex items-center gap-1.5 text-xs font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded-full border border-green-500/20">
                                                        <Check size={12} /> Active
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1.5 text-xs font-bold text-red-500 bg-red-500/10 px-2 py-1 rounded-full border border-red-500/20">
                                                        <X size={12} /> Inactive
                                                    </span>
                                                )}
                                                {user.is_staff && (
                                                    <span className="flex items-center gap-1.5 text-xs font-bold text-accent-400 bg-accent-500/10 px-2 py-1 rounded-full border border-accent-500/20">
                                                        <Shield size={12} /> Staff
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        {(canEdit || canDelete) && (
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-1">
                                                    {canEdit && <button onClick={() => handleOpenModal(user)} className="p-2 text-silver-500 hover:text-accent-500 hover:bg-accent-500/10 rounded-lg transition-all"><Edit size={18} /></button>}
                                                    {canDelete && <button onClick={() => handleDeleteUser(user.id)} className="p-2 text-silver-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"><Trash2 size={18} /></button>}
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="bg-dark-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-scale-in border border-dark-700">
                        <div className="p-6 border-b border-dark-700 flex justify-between items-center bg-dark-900/50">
                            <h2 className="text-xl font-bold text-white">{editingUser ? 'Edit Admin' : 'Create Admin'}</h2>
                            <button onClick={() => setShowModal(false)} className="p-2 text-silver-500 hover:text-white hover:bg-dark-700 rounded-full transition-colors"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {error && <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm">{error}</div>}

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-semibold text-silver-300">First Name</label>
                                    <input required type="text" value={formData.first_name} onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} className="w-full px-4 py-2 bg-dark-700 border border-dark-600 text-white rounded-xl outline-none focus:ring-2 focus:ring-accent-500 placeholder-silver-600" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-semibold text-silver-300">Last Name</label>
                                    <input required type="text" value={formData.last_name} onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} className="w-full px-4 py-2 bg-dark-700 border border-dark-600 text-white rounded-xl outline-none focus:ring-2 focus:ring-accent-500 placeholder-silver-600" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-semibold text-silver-300">Username</label>
                                    <input required type="text" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} className="w-full px-4 py-2 bg-dark-700 border border-dark-600 text-white rounded-xl outline-none focus:ring-2 focus:ring-accent-500 placeholder-silver-600" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-semibold text-silver-300">Email Address</label>
                                    <input required type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-4 py-2 bg-dark-700 border border-dark-600 text-white rounded-xl outline-none focus:ring-2 focus:ring-accent-500 placeholder-silver-600" />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-semibold text-silver-300">Password {editingUser && '(Leave blank to keep current)'}</label>
                                <input required={!editingUser} type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="w-full px-4 py-2 bg-dark-700 border border-dark-600 text-white rounded-xl outline-none focus:ring-2 focus:ring-accent-500 placeholder-silver-600" />
                            </div>

                            <div className="flex items-center gap-3 p-4 bg-dark-700/30 rounded-2xl border border-dark-600">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <div className="relative">
                                        <input
                                            type="checkbox"
                                            checked={formData.is_active}
                                            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                            className="sr-only"
                                        />
                                        <div className={`w-10 h-6 rounded-full transition-colors ${formData.is_active ? 'bg-green-500' : 'bg-dark-600'}`}></div>
                                        <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${formData.is_active ? 'translate-x-4' : ''}`}></div>
                                    </div>
                                    <span className="text-sm font-bold text-silver-300 group-hover:text-accent-500 transition-colors">Account Active Status</span>
                                </label>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-silver-300">Assign Roles</label>
                                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-4 border border-dark-600 rounded-2xl bg-dark-900/30">
                                    {roles.map(role => (
                                        <button key={role.id} type="button" onClick={() => toggleRole(role.id)} className={`flex items-center justify-between p-3 rounded-xl border transition-all text-left text-xs ${formData.role_ids.includes(role.id) ? 'bg-accent-500/10 border-accent-500/30 text-accent-400 shadow-sm' : 'bg-dark-700 border-dark-600 text-silver-400 hover:border-dark-500'}`}>
                                            <span className="font-bold">{role.name}</span>
                                            {formData.role_ids.includes(role.id) && <Check size={14} />}
                                        </button>
                                    ))}
                                    {roles.length === 0 && <p className="col-span-2 text-center text-xs text-silver-500 py-4">No roles created yet. Go to the Roles tab to create one.</p>}
                                </div>
                            </div>

                            <div className="pt-4 border-t border-dark-700 flex gap-3">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 bg-dark-700 text-silver-300 rounded-xl font-bold hover:bg-dark-600 transition-colors">Cancel</button>
                                <button type="submit" disabled={submitting} className="flex-1 py-3 btn-primary shadow-lg shadow-accent-500/20 disabled:opacity-70 flex items-center justify-center gap-2">
                                    {submitting ? <Loader2 className="animate-spin" size={20} /> : (editingUser ? 'Update Admin' : 'Create Admin')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
