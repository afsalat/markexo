'use client';

import { useState, useEffect } from 'react';
import {
    Zap, Plus, Edit2, Trash2, CheckCircle, XCircle,
    RefreshCw, Send, Settings, Link2, Key,
    Globe, ToggleLeft, ToggleRight, Clock,
    ArrowRight, Activity, TrendingUp, Wifi, X, Package
} from 'lucide-react';
import { API_BASE_URL } from '@/config/apiConfig';
import { useAuth } from '@/context/AuthContext';

interface Supplier {
    id: number;
    name: string;
    api_endpoint: string;
    masked_api_key: string;
    webhook_url: string;
    is_active: boolean;
    auto_send: boolean;
    last_sync?: string;
    orders_sent?: number;
    success_rate?: number;
}

interface ForwardLog {
    id: number;
    order_id: string;
    supplier_name: string;
    status: 'pending' | 'sent' | 'failed' | 'acknowledged';
    response_message: string;
    created_at: string;
}

interface Order {
    id: number;
    order_id: string;
    customer: { name: string };
    total_amount: number;
    status: string;
    created_at: string;
}

export default function SupplierAPITab() {
    const { token } = useAuth();
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [forwardLogs, setForwardLogs] = useState<ForwardLog[]>([]);
    const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
    const [activeView, setActiveView] = useState<'suppliers' | 'logs'>('suppliers');
    const [testingConnection, setTestingConnection] = useState<number | null>(null);
    const [selectedOrders, setSelectedOrders] = useState<number[]>([]);
    const [selectedSupplierForForward, setSelectedSupplierForForward] = useState<number | null>(null);
    const [forwarding, setForwarding] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        api_endpoint: '',
        api_key: '',
        api_secret: '',
        webhook_url: '',
        auto_send: false
    });

    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };

    // Fetch suppliers from API
    const fetchSuppliers = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/admin/suppliers/`, { headers });
            if (res.ok) {
                const data = await res.json();
                setSuppliers(data.results || data);
            }
        } catch (error) {
            console.error('Error fetching suppliers:', error);
        }
    };

    // Fetch forward logs from API
    const fetchForwardLogs = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/admin/forward-logs/`, { headers });
            if (res.ok) {
                const data = await res.json();
                setForwardLogs(data.results || data);
            }
        } catch (error) {
            console.error('Error fetching forward logs:', error);
        }
    };

    // Fetch pending orders
    const fetchPendingOrders = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/admin/pending-orders-for-forwarding/`, { headers });
            if (res.ok) {
                const data = await res.json();
                setPendingOrders(data);
            }
        } catch (error) {
            console.error('Error fetching pending orders:', error);
        }
    };

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            await Promise.all([fetchSuppliers(), fetchForwardLogs()]);
            setLoading(false);
        };
        if (token) loadData();
    }, [token]);

    const handleAddNew = () => {
        setEditingSupplier(null);
        setFormData({
            name: '',
            api_endpoint: '',
            api_key: '',
            api_secret: '',
            webhook_url: '',
            auto_send: false
        });
        setIsModalOpen(true);
    };

    const handleEdit = (supplier: Supplier) => {
        setEditingSupplier(supplier);
        setFormData({
            name: supplier.name,
            api_endpoint: supplier.api_endpoint,
            api_key: '',
            api_secret: '',
            webhook_url: supplier.webhook_url,
            auto_send: supplier.auto_send
        });
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        try {
            const payload: any = {
                name: formData.name,
                api_endpoint: formData.api_endpoint,
                webhook_url: formData.webhook_url,
                auto_send: formData.auto_send
            };
            if (formData.api_key) payload.api_key = formData.api_key;
            if (formData.api_secret) payload.api_secret = formData.api_secret;

            if (editingSupplier) {
                await fetch(`${API_BASE_URL}/admin/suppliers/${editingSupplier.id}/`, {
                    method: 'PATCH',
                    headers,
                    body: JSON.stringify(payload)
                });
            } else {
                payload.api_key = formData.api_key || 'placeholder-key';
                await fetch(`${API_BASE_URL}/admin/suppliers/`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(payload)
                });
            }
            setIsModalOpen(false);
            fetchSuppliers();
        } catch (error) {
            console.error('Error saving supplier:', error);
        }
    };

    const handleDelete = async (id: number) => {
        if (confirm('Are you sure you want to delete this supplier?')) {
            try {
                await fetch(`${API_BASE_URL}/admin/suppliers/${id}/`, {
                    method: 'DELETE',
                    headers
                });
                fetchSuppliers();
            } catch (error) {
                console.error('Error deleting supplier:', error);
            }
        }
    };

    const toggleActive = async (id: number) => {
        try {
            await fetch(`${API_BASE_URL}/admin/suppliers/${id}/toggle_active/`, {
                method: 'POST',
                headers
            });
            fetchSuppliers();
        } catch (error) {
            console.error('Error toggling active:', error);
        }
    };

    const toggleAutoSend = async (id: number) => {
        try {
            await fetch(`${API_BASE_URL}/admin/suppliers/${id}/toggle_auto_send/`, {
                method: 'POST',
                headers
            });
            fetchSuppliers();
        } catch (error) {
            console.error('Error toggling auto-send:', error);
        }
    };

    const testConnection = async (id: number) => {
        setTestingConnection(id);
        try {
            const res = await fetch(`${API_BASE_URL}/admin/suppliers/${id}/test_connection/`, {
                method: 'POST',
                headers
            });
            const data = await res.json();
            alert(data.message || 'Connection test completed');
        } catch (error) {
            alert('Connection test failed');
        }
        setTestingConnection(null);
    };

    const openOrderModal = (supplierId: number) => {
        setSelectedSupplierForForward(supplierId);
        setSelectedOrders([]);
        fetchPendingOrders();
        setIsOrderModalOpen(true);
    };

    const forwardOrders = async () => {
        if (!selectedSupplierForForward || selectedOrders.length === 0) return;
        setForwarding(true);
        try {
            const res = await fetch(`${API_BASE_URL}/admin/forward-orders/`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    order_ids: selectedOrders,
                    supplier_id: selectedSupplierForForward
                })
            });
            const data = await res.json();
            if (res.ok) {
                alert(data.message || 'Orders forwarded successfully');
                setIsOrderModalOpen(false);
                fetchSuppliers();
                fetchForwardLogs();
            } else {
                alert(data.error || 'Failed to forward orders');
            }
        } catch (error) {
            alert('Error forwarding orders');
        }
        setForwarding(false);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'sent': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
            case 'acknowledged': return 'bg-green-500/20 text-green-400 border-green-500/30';
            case 'failed': return 'bg-red-500/20 text-red-400 border-red-500/30';
            default: return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
        }
    };

    const formatDate = (dateString: string) => {
        try {
            return new Date(dateString).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return dateString;
        }
    };

    // Stats
    const totalOrders = suppliers.reduce((acc, s) => acc + (s.orders_sent || 0), 0);
    const activeSuppliers = suppliers.filter(s => s.is_active).length;
    const avgSuccessRate = suppliers.length > 0
        ? Math.round(suppliers.reduce((acc, s) => acc + (s.success_rate || 0), 0) / suppliers.length)
        : 0;

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <RefreshCw size={32} className="animate-spin text-accent-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="font-display text-2xl font-bold text-white flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-500 to-accent-600 flex items-center justify-center">
                            <Zap size={20} className="text-dark-900" />
                        </div>
                        Supplier API Integration
                    </h1>
                    <p className="text-silver-500 text-sm mt-1 ml-[52px]">
                        Configure and manage dropshipping supplier integrations
                    </p>
                </div>
                <button
                    onClick={handleAddNew}
                    className="btn-primary flex items-center gap-2 shadow-lg shadow-accent-500/20"
                >
                    <Plus size={18} /> Add Supplier
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-dark-800 to-dark-800/50 border border-dark-700 rounded-2xl p-5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-accent-500/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-accent-500/10 flex items-center justify-center">
                            <Activity size={24} className="text-accent-500" />
                        </div>
                        <div>
                            <p className="text-silver-500 text-sm">Active Suppliers</p>
                            <p className="text-2xl font-bold text-white">{activeSuppliers} <span className="text-silver-500 text-sm font-normal">/ {suppliers.length}</span></p>
                        </div>
                    </div>
                </div>
                <div className="bg-gradient-to-br from-dark-800 to-dark-800/50 border border-dark-700 rounded-2xl p-5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                            <Send size={24} className="text-blue-400" />
                        </div>
                        <div>
                            <p className="text-silver-500 text-sm">Orders Forwarded</p>
                            <p className="text-2xl font-bold text-white">{totalOrders}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-gradient-to-br from-dark-800 to-dark-800/50 border border-dark-700 rounded-2xl p-5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                            <TrendingUp size={24} className="text-green-400" />
                        </div>
                        <div>
                            <p className="text-silver-500 text-sm">Success Rate</p>
                            <p className="text-2xl font-bold text-white">{avgSuccessRate}%</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* View Toggle */}
            <div className="flex gap-1 bg-dark-800/50 p-1.5 rounded-xl w-fit border border-dark-700">
                <button
                    onClick={() => setActiveView('suppliers')}
                    className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${activeView === 'suppliers'
                            ? 'bg-accent-500 text-dark-900 shadow-lg shadow-accent-500/20'
                            : 'text-silver-400 hover:text-white hover:bg-dark-700'
                        }`}
                >
                    <Settings size={16} className="inline mr-2 -mt-0.5" />
                    Suppliers
                </button>
                <button
                    onClick={() => setActiveView('logs')}
                    className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${activeView === 'logs'
                            ? 'bg-accent-500 text-dark-900 shadow-lg shadow-accent-500/20'
                            : 'text-silver-400 hover:text-white hover:bg-dark-700'
                        }`}
                >
                    <Clock size={16} className="inline mr-2 -mt-0.5" />
                    Forwarding Logs
                </button>
            </div>

            {/* Suppliers View */}
            {activeView === 'suppliers' && (
                <div className="space-y-4">
                    {suppliers.length === 0 ? (
                        <div className="bg-dark-800 border border-dark-700 rounded-2xl p-16 text-center">
                            <div className="w-20 h-20 bg-dark-700 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                <Zap size={40} className="text-dark-500" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">No Suppliers Configured</h3>
                            <p className="text-silver-500 mb-6 max-w-md mx-auto">Add your first supplier to start forwarding orders automatically to your dropshipping partners.</p>
                            <button onClick={handleAddNew} className="btn-primary shadow-lg shadow-accent-500/20">
                                <Plus size={18} className="inline mr-2" /> Add Your First Supplier
                            </button>
                        </div>
                    ) : (
                        suppliers.map(supplier => (
                            <div
                                key={supplier.id}
                                className={`bg-gradient-to-r from-dark-800 to-dark-800/80 border rounded-2xl overflow-hidden transition-all hover:border-dark-600 ${supplier.is_active ? 'border-dark-700' : 'border-dark-700/50 opacity-70'
                                    }`}
                            >
                                {/* Supplier Header */}
                                <div className="p-6 border-b border-dark-700/50">
                                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${supplier.is_active
                                                    ? 'bg-gradient-to-br from-accent-500/20 to-accent-600/10 border border-accent-500/30'
                                                    : 'bg-dark-700 border border-dark-600'
                                                }`}>
                                                <span className="text-2xl font-bold text-white">{supplier.name.charAt(0)}</span>
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-3">
                                                    <h3 className="text-xl font-bold text-white">{supplier.name}</h3>
                                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${supplier.is_active
                                                            ? 'bg-green-500/10 text-green-400 border-green-500/30'
                                                            : 'bg-gray-500/10 text-gray-400 border-gray-500/30'
                                                        }`}>
                                                        {supplier.is_active ? '● Active' : '○ Inactive'}
                                                    </span>
                                                    {supplier.auto_send && (
                                                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-accent-500/10 text-accent-400 border border-accent-500/30">
                                                            ⚡ Auto-Send
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-silver-500 text-sm mt-1 flex items-center gap-2">
                                                    <Globe size={14} />
                                                    {supplier.api_endpoint}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex flex-wrap items-center gap-2">
                                            <button
                                                onClick={() => openOrderModal(supplier.id)}
                                                disabled={!supplier.is_active}
                                                className="px-4 py-2.5 bg-accent-500/10 hover:bg-accent-500/20 text-accent-400 rounded-xl text-sm font-medium flex items-center gap-2 transition-all disabled:opacity-50 border border-accent-500/30"
                                            >
                                                <Package size={16} />
                                                Forward Orders
                                            </button>
                                            <button
                                                onClick={() => testConnection(supplier.id)}
                                                disabled={testingConnection === supplier.id}
                                                className="px-4 py-2.5 bg-dark-700 hover:bg-dark-600 text-white rounded-xl text-sm font-medium flex items-center gap-2 transition-all disabled:opacity-50 border border-dark-600"
                                            >
                                                {testingConnection === supplier.id ? (
                                                    <RefreshCw size={16} className="animate-spin" />
                                                ) : (
                                                    <Wifi size={16} />
                                                )}
                                                Test
                                            </button>
                                            <button
                                                onClick={() => toggleAutoSend(supplier.id)}
                                                className={`px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 transition-all border ${supplier.auto_send
                                                        ? 'bg-accent-500/10 text-accent-400 hover:bg-accent-500/20 border-accent-500/30'
                                                        : 'bg-dark-700 text-silver-400 hover:bg-dark-600 border-dark-600'
                                                    }`}
                                            >
                                                {supplier.auto_send ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                                                Auto
                                            </button>
                                            <button
                                                onClick={() => toggleActive(supplier.id)}
                                                className={`px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 transition-all border ${supplier.is_active
                                                        ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20 border-green-500/30'
                                                        : 'bg-dark-700 text-silver-400 hover:bg-dark-600 border-dark-600'
                                                    }`}
                                            >
                                                {supplier.is_active ? <CheckCircle size={16} /> : <XCircle size={16} />}
                                                {supplier.is_active ? 'On' : 'Off'}
                                            </button>
                                            <button
                                                onClick={() => handleEdit(supplier)}
                                                className="p-2.5 bg-dark-700 hover:bg-dark-600 text-white rounded-xl transition-all border border-dark-600"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(supplier.id)}
                                                className="p-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-all border border-red-500/30"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Supplier Stats */}
                                <div className="px-6 py-4 bg-dark-900/30 grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="flex items-center gap-3">
                                        <Key size={16} className="text-silver-600" />
                                        <div>
                                            <p className="text-xs text-silver-500">API Key</p>
                                            <p className="text-sm text-white font-mono">{supplier.masked_api_key || '••••••••'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Send size={16} className="text-silver-600" />
                                        <div>
                                            <p className="text-xs text-silver-500">Orders Sent</p>
                                            <p className="text-sm text-white font-bold">{supplier.orders_sent || 0}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <TrendingUp size={16} className="text-silver-600" />
                                        <div>
                                            <p className="text-xs text-silver-500">Success Rate</p>
                                            <p className="text-sm text-green-400 font-bold">{supplier.success_rate || 0}%</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Clock size={16} className="text-silver-600" />
                                        <div>
                                            <p className="text-xs text-silver-500">Last Sync</p>
                                            <p className="text-sm text-white">{supplier.last_sync ? formatDate(supplier.last_sync) : 'Never'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Forwarding Logs View */}
            {activeView === 'logs' && (
                <div className="bg-dark-800 border border-dark-700 rounded-2xl overflow-hidden">
                    {forwardLogs.length === 0 ? (
                        <div className="p-12 text-center">
                            <Clock size={48} className="text-dark-600 mx-auto mb-4" />
                            <h3 className="text-lg font-bold text-white mb-2">No Forwarding Logs</h3>
                            <p className="text-silver-500">Forward some orders to see activity here.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-dark-900/50 border-b border-dark-700">
                                    <tr>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-silver-400 uppercase tracking-wider">Order ID</th>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-silver-400 uppercase tracking-wider">Supplier</th>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-silver-400 uppercase tracking-wider">Status</th>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-silver-400 uppercase tracking-wider">Response</th>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-silver-400 uppercase tracking-wider">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-dark-700">
                                    {forwardLogs.map(log => (
                                        <tr key={log.id} className="hover:bg-dark-700/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <span className="font-bold text-accent-500">{log.order_id}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-3 py-1 bg-dark-700 rounded-lg text-white text-sm">{log.supplier_name}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${getStatusColor(log.status)}`}>
                                                    {log.status.charAt(0).toUpperCase() + log.status.slice(1)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-silver-400 text-sm max-w-xs truncate">{log.response_message}</td>
                                            <td className="px-6 py-4 text-silver-500 text-sm">{formatDate(log.created_at)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Add/Edit Supplier Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-gradient-to-b from-dark-800 to-dark-900 rounded-2xl p-8 max-w-lg w-full shadow-2xl border border-dark-700">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 rounded-xl bg-accent-500/10 flex items-center justify-center">
                                <Zap size={24} className="text-accent-500" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">
                                    {editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
                                </h2>
                                <p className="text-silver-500 text-sm">Configure API credentials</p>
                            </div>
                        </div>

                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-silver-300 mb-2">Supplier Name *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full bg-dark-900 border border-dark-600 rounded-xl px-4 py-3 text-white placeholder-silver-600 focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 transition-all"
                                    placeholder="e.g., Shop101, GlowRoad"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-silver-300 mb-2">API Endpoint *</label>
                                <input
                                    type="url"
                                    value={formData.api_endpoint}
                                    onChange={(e) => setFormData(prev => ({ ...prev, api_endpoint: e.target.value }))}
                                    className="w-full bg-dark-900 border border-dark-600 rounded-xl px-4 py-3 text-white placeholder-silver-600 focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 transition-all"
                                    placeholder="https://api.supplier.com/v1/orders"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-silver-300 mb-2">API Key {!editingSupplier && '*'}</label>
                                    <input
                                        type="password"
                                        value={formData.api_key}
                                        onChange={(e) => setFormData(prev => ({ ...prev, api_key: e.target.value }))}
                                        className="w-full bg-dark-900 border border-dark-600 rounded-xl px-4 py-3 text-white placeholder-silver-600 focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 transition-all"
                                        placeholder={editingSupplier ? '(unchanged)' : 'Enter key'}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-silver-300 mb-2">API Secret</label>
                                    <input
                                        type="password"
                                        value={formData.api_secret}
                                        onChange={(e) => setFormData(prev => ({ ...prev, api_secret: e.target.value }))}
                                        className="w-full bg-dark-900 border border-dark-600 rounded-xl px-4 py-3 text-white placeholder-silver-600 focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 transition-all"
                                        placeholder="Optional"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-silver-300 mb-2">Webhook URL</label>
                                <input
                                    type="url"
                                    value={formData.webhook_url}
                                    onChange={(e) => setFormData(prev => ({ ...prev, webhook_url: e.target.value }))}
                                    className="w-full bg-dark-900 border border-dark-600 rounded-xl px-4 py-3 text-white placeholder-silver-600 focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 transition-all"
                                    placeholder="https://yoursite.com/webhook/supplier"
                                />
                            </div>

                            <div className="flex items-center gap-4 p-5 bg-dark-900/50 rounded-xl border border-dark-600">
                                <input
                                    type="checkbox"
                                    id="auto_send"
                                    checked={formData.auto_send}
                                    onChange={(e) => setFormData(prev => ({ ...prev, auto_send: e.target.checked }))}
                                    className="w-5 h-5 rounded-lg border-dark-600 bg-dark-800 text-accent-500 focus:ring-accent-500 focus:ring-offset-0"
                                />
                                <label htmlFor="auto_send" className="flex-1 cursor-pointer">
                                    <span className="text-white font-medium flex items-center gap-2">
                                        <Zap size={16} className="text-accent-500" /> Auto-Send Orders
                                    </span>
                                    <p className="text-xs text-silver-500 mt-0.5">Automatically forward confirmed orders to this supplier</p>
                                </label>
                            </div>
                        </div>

                        <div className="flex gap-4 mt-8">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="flex-1 px-6 py-3 bg-dark-700 hover:bg-dark-600 text-white rounded-xl font-medium transition-all border border-dark-600"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={!formData.name || !formData.api_endpoint}
                                className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {editingSupplier ? 'Save Changes' : 'Add Supplier'}
                                <ArrowRight size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Forward Orders Modal */}
            {isOrderModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-gradient-to-b from-dark-800 to-dark-900 rounded-2xl p-8 max-w-2xl w-full shadow-2xl border border-dark-700 max-h-[80vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-accent-500/10 flex items-center justify-center">
                                    <Package size={24} className="text-accent-500" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">Select Orders to Forward</h2>
                                    <p className="text-silver-500 text-sm">Choose orders to send to supplier</p>
                                </div>
                            </div>
                            <button onClick={() => setIsOrderModalOpen(false)} className="text-silver-400 hover:text-white">
                                <X size={24} />
                            </button>
                        </div>

                        {pendingOrders.length === 0 ? (
                            <div className="text-center py-12">
                                <Package size={48} className="text-dark-600 mx-auto mb-4" />
                                <p className="text-silver-500">No pending orders to forward</p>
                            </div>
                        ) : (
                            <>
                                <div className="space-y-2 mb-6">
                                    {pendingOrders.map(order => (
                                        <label key={order.id} className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${selectedOrders.includes(order.id)
                                                ? 'bg-accent-500/10 border-accent-500/30'
                                                : 'bg-dark-700/50 border-dark-600 hover:border-dark-500'
                                            }`}>
                                            <input
                                                type="checkbox"
                                                checked={selectedOrders.includes(order.id)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedOrders([...selectedOrders, order.id]);
                                                    } else {
                                                        setSelectedOrders(selectedOrders.filter(id => id !== order.id));
                                                    }
                                                }}
                                                className="w-5 h-5 rounded border-dark-500 bg-dark-800 text-accent-500"
                                            />
                                            <div className="flex-1">
                                                <p className="font-bold text-white">{order.order_id}</p>
                                                <p className="text-sm text-silver-500">{order.customer?.name || 'Unknown'} • ₹{order.total_amount}</p>
                                            </div>
                                            <span className="text-xs text-silver-500">{formatDate(order.created_at)}</span>
                                        </label>
                                    ))}
                                </div>

                                <div className="flex gap-4">
                                    <button
                                        onClick={() => setIsOrderModalOpen(false)}
                                        className="flex-1 px-6 py-3 bg-dark-700 hover:bg-dark-600 text-white rounded-xl font-medium transition-all border border-dark-600"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={forwardOrders}
                                        disabled={selectedOrders.length === 0 || forwarding}
                                        className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {forwarding ? <RefreshCw size={18} className="animate-spin" /> : <Send size={18} />}
                                        Forward {selectedOrders.length} Order{selectedOrders.length !== 1 ? 's' : ''}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
