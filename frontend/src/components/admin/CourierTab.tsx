'use client';

import { useState, useEffect } from 'react';
import {
    Truck, Package, ShieldCheck, MapPin, Search, RefreshCw, Printer, ExternalLink,
    CheckCircle2, Clock, AlertTriangle, ArrowRight, Settings, Plus, Edit3, X,
    ChevronDown, DollarSign, Box, Check, Copy, AlertCircle, Sparkles, Navigation
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { API_BASE_URL } from '@/config/apiConfig';
import { CourierPartner, Shipment, TrackingEvent } from '@/types/admin';

export default function CourierTab() {
    const { token } = useAuth();
    const [subTab, setSubTab] = useState<'shipments' | 'partners' | 'calculator' | 'warehouse'>('shipments');
    const [loading, setLoading] = useState(true);

    // Shipments state
    const [shipments, setShipments] = useState<Shipment[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    // Courier Partners state
    const [partners, setPartners] = useState<CourierPartner[]>([]);
    const [testingPartnerId, setTestingPartnerId] = useState<number | null>(null);
    const [testResult, setTestResult] = useState<{ id: number; success: boolean; message: string } | null>(null);
    const [editingPartner, setEditingPartner] = useState<CourierPartner | null>(null);
    const [savingPartner, setSavingPartner] = useState(false);

    // Tracking Modal state
    const [trackingModalShipment, setTrackingModalShipment] = useState<Shipment | null>(null);
    const [trackingLoading, setTrackingLoading] = useState(false);
    const [liveTrackingEvents, setLiveTrackingEvents] = useState<TrackingEvent[]>([]);

    // Print Label Modal state
    const [labelModalShipment, setLabelModalShipment] = useState<Shipment | null>(null);
    const [labelHtml, setLabelHtml] = useState<string>('');
    const [labelLoading, setLabelLoading] = useState(false);

    // Rate Calculator state
    const [calcPickupPincode, setCalcPickupPincode] = useState('110020');
    const [calcDeliveryPincode, setCalcDeliveryPincode] = useState('560001');
    const [calcWeight, setCalcWeight] = useState('0.5');
    const [calcIsCod, setCalcIsCod] = useState(true);
    const [calcLoading, setCalcLoading] = useState(false);
    const [calcResults, setCalcResults] = useState<any[] | null>(null);

    // Warehouse Settings state
    const [warehouseForm, setWarehouseForm] = useState({
        pickup_warehouse_name: 'VorionMart Central Hub',
        pickup_phone: '+91 9876543210',
        pickup_address: 'Plot 42, Logistics Park, Okhla Industrial Area',
        pickup_city: 'New Delhi',
        pickup_state: 'Delhi',
        pickup_pincode: '110020',
        pickup_gstin: '07AAAAA0000A1Z5',
    });
    const [savingWarehouse, setSavingWarehouse] = useState(false);
    const [warehouseSavedMessage, setWarehouseSavedMessage] = useState(false);

    // Copy to clipboard helper
    const [copiedAwb, setCopiedAwb] = useState<string | null>(null);
    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedAwb(text);
        setTimeout(() => setCopiedAwb(null), 2000);
    };

    // Fetch Shipments
    const fetchShipments = async () => {
        if (!token) return;
        try {
            let url = `${API_BASE_URL}/admin/shipments/`;
            const params = new URLSearchParams();
            if (statusFilter !== 'all') params.append('status', statusFilter);
            if (searchQuery.trim()) params.append('search', searchQuery.trim());
            if (params.toString()) url += `?${params.toString()}`;

            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setShipments(data.results || data);
            }
        } catch (e) {
            console.error('Failed to fetch shipments', e);
        }
    };

    // Fetch Courier Partners
    const fetchPartners = async () => {
        if (!token) return;
        try {
            const res = await fetch(`${API_BASE_URL}/admin/courier-partners/`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setPartners(data.results || data);
            }
        } catch (e) {
            console.error('Failed to fetch partners', e);
        }
    };

    // Fetch Warehouse Settings
    const fetchWarehouseSettings = async () => {
        if (!token) return;
        try {
            const res = await fetch(`${API_BASE_URL}/admin/settings/`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setWarehouseForm({
                    pickup_warehouse_name: data.pickup_warehouse_name || 'VorionMart Central Hub',
                    pickup_phone: data.pickup_phone || '+91 9876543210',
                    pickup_address: data.pickup_address || 'Plot 42, Logistics Park, Okhla Industrial Area',
                    pickup_city: data.pickup_city || 'New Delhi',
                    pickup_state: data.pickup_state || 'Delhi',
                    pickup_pincode: data.pickup_pincode || '110020',
                    pickup_gstin: data.pickup_gstin || '07AAAAA0000A1Z5',
                });
            }
        } catch (e) {
            console.error('Failed to fetch warehouse settings', e);
        }
    };

    useEffect(() => {
        const loadAll = async () => {
            setLoading(true);
            await Promise.all([fetchShipments(), fetchPartners(), fetchWarehouseSettings()]);
            setLoading(false);
        };
        loadAll();
    }, [token, statusFilter]);

    // Test Partner Connection
    const handleTestConnection = async (partner: CourierPartner) => {
        setTestingPartnerId(partner.id);
        setTestResult(null);
        try {
            const res = await fetch(`${API_BASE_URL}/admin/courier-partners/${partner.id}/test_connection/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            const data = await res.json();
            setTestResult({
                id: partner.id,
                success: !!data.success,
                message: data.message || (data.success ? 'Connected successfully!' : 'Connection failed')
            });
        } catch (e) {
            setTestResult({
                id: partner.id,
                success: false,
                message: 'Failed to connect to courier API.'
            });
        } finally {
            setTestingPartnerId(null);
        }
    };

    // Set Default Partner
    const handleSetDefault = async (partner: CourierPartner) => {
        try {
            const res = await fetch(`${API_BASE_URL}/admin/courier-partners/${partner.id}/set_default/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            if (res.ok) {
                await fetchPartners();
            }
        } catch (e) {
            console.error('Failed to set default', e);
        }
    };

    // Save Edited Partner
    const handleSavePartner = async () => {
        if (!editingPartner) return;
        setSavingPartner(true);
        try {
            const res = await fetch(`${API_BASE_URL}/admin/courier-partners/${editingPartner.id}/`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(editingPartner)
            });
            if (res.ok) {
                setEditingPartner(null);
                await fetchPartners();
            }
        } catch (e) {
            console.error('Failed to save partner', e);
        } finally {
            setSavingPartner(false);
        }
    };

    // Track Shipment
    const handleOpenTracking = async (shipment: Shipment) => {
        setTrackingModalShipment(shipment);
        setTrackingLoading(true);
        setLiveTrackingEvents(shipment.tracking_events || []);
        try {
            const res = await fetch(`${API_BASE_URL}/admin/shipments/${shipment.id}/track/`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                if (data.tracking_events) {
                    setLiveTrackingEvents(data.tracking_events);
                }
            }
        } catch (e) {
            console.error('Failed to fetch tracking', e);
        } finally {
            setTrackingLoading(false);
        }
    };

    // Open Label Modal
    const handleOpenLabel = async (shipment: Shipment) => {
        setLabelModalShipment(shipment);
        setLabelLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/admin/shipments/${shipment.id}/label/`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const html = await res.text();
                setLabelHtml(html);
            }
        } catch (e) {
            console.error('Failed to load label', e);
        } finally {
            setLabelLoading(false);
        }
    };

    // Cancel Shipment
    const handleCancelShipment = async (shipmentId: number) => {
        if (!confirm('Are you sure you want to cancel this consignment with the courier partner?')) return;
        try {
            const res = await fetch(`${API_BASE_URL}/admin/shipments/${shipmentId}/cancel/`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                await fetchShipments();
            }
        } catch (e) {
            console.error('Failed to cancel shipment', e);
        }
    };

    // Run Rate Calculator
    const handleCalculateRate = async (e: React.FormEvent) => {
        e.preventDefault();
        setCalcLoading(true);
        setCalcResults(null);
        try {
            const defaultPartner = partners.find(p => p.is_default) || partners[0];
            if (!defaultPartner) {
                alert('No courier partner available to calculate rates.');
                return;
            }

            const res = await fetch(`${API_BASE_URL}/admin/courier-partners/${defaultPartner.id}/check_serviceability/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    pickup_pincode: calcPickupPincode,
                    delivery_pincode: calcDeliveryPincode,
                    weight_kg: parseFloat(calcWeight) || 0.5,
                    is_cod: calcIsCod
                })
            });

            if (res.ok) {
                const data = await res.json();
                setCalcResults(data.available_couriers || []);
            }
        } catch (e) {
            console.error('Failed to calculate rate', e);
        } finally {
            setCalcLoading(false);
        }
    };

    // Save Warehouse Settings
    const handleSaveWarehouse = async (e: React.FormEvent) => {
        e.preventDefault();
        setSavingWarehouse(true);
        setWarehouseSavedMessage(false);
        try {
            const res = await fetch(`${API_BASE_URL}/admin/settings/`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(warehouseForm)
            });
            if (res.ok) {
                setWarehouseSavedMessage(true);
                setTimeout(() => setWarehouseSavedMessage(false), 3000);
            }
        } catch (e) {
            console.error('Failed to save warehouse', e);
        } finally {
            setSavingWarehouse(false);
        }
    };

    // Status Badge Helper
    const getStatusBadge = (status: string) => {
        const map: Record<string, { label: string; class: string }> = {
            manifest_generated: { label: 'Manifest Created', class: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
            pickup_scheduled: { label: 'Pickup Scheduled', class: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
            picked_up: { label: 'Picked Up', class: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
            in_transit: { label: 'In Transit', class: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' },
            out_for_delivery: { label: 'Out for Delivery', class: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
            delivered: { label: 'Delivered', class: 'bg-green-500/10 text-green-400 border-green-500/20' },
            rto_initiated: { label: 'RTO Initiated', class: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
            rto_delivered: { label: 'RTO Delivered', class: 'bg-red-500/10 text-red-400 border-red-500/20' },
            cancelled: { label: 'Cancelled', class: 'bg-dark-600 text-silver-400 border-dark-500' },
        };
        const s = map[status] || { label: status, class: 'bg-dark-700 text-silver-300 border-dark-600' };
        return <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${s.class}`}>{s.label}</span>;
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-dark-800 p-6 rounded-3xl border border-dark-700 shadow-sm">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-accent-600 to-accent-400 flex items-center justify-center text-dark-900 shadow-lg shadow-accent-500/20 font-bold">
                            <Truck size={22} />
                        </div>
                        <h1 className="text-2xl font-black text-white tracking-tight">Courier & Shipping Logistics</h1>
                    </div>
                    <p className="text-silver-400 text-sm">
                        Shiprocket AI aggregator & multi-courier fulfillment for VorionMart orders and products.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => { fetchShipments(); fetchPartners(); }}
                        className="flex items-center gap-2 px-4 py-2.5 bg-dark-700 hover:bg-dark-600 text-silver-300 hover:text-white rounded-xl text-sm font-semibold transition-all border border-dark-600"
                    >
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex flex-wrap border-b border-dark-700 gap-2">
                <button
                    onClick={() => setSubTab('shipments')}
                    className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all ${subTab === 'shipments'
                        ? 'border-accent-500 text-accent-500'
                        : 'border-transparent text-silver-400 hover:text-white'
                        }`}
                >
                    <Box size={16} />
                    All Shipments ({shipments.length})
                </button>
                <button
                    onClick={() => setSubTab('partners')}
                    className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all ${subTab === 'partners'
                        ? 'border-accent-500 text-accent-500'
                        : 'border-transparent text-silver-400 hover:text-white'
                        }`}
                >
                    <Truck size={16} />
                    Courier Partners ({partners.length})
                </button>
                <button
                    onClick={() => setSubTab('calculator')}
                    className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all ${subTab === 'calculator'
                        ? 'border-accent-500 text-accent-500'
                        : 'border-transparent text-silver-400 hover:text-white'
                        }`}
                >
                    <DollarSign size={16} />
                    Rate & Serviceability Calculator
                </button>
                <button
                    onClick={() => setSubTab('warehouse')}
                    className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all ${subTab === 'warehouse'
                        ? 'border-accent-500 text-accent-500'
                        : 'border-transparent text-silver-400 hover:text-white'
                        }`}
                >
                    <MapPin size={16} />
                    Warehouse Origin Settings
                </button>
            </div>

            {/* SUBTAB 1: SHIPMENTS LIST */}
            {subTab === 'shipments' && (
                <div className="space-y-4">
                    {/* Filter & Search Bar */}
                    <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                        <div className="relative flex-1 max-w-md">
                            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-silver-500" />
                            <input
                                type="text"
                                placeholder="Search by AWB, Order ID, customer, city..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && fetchShipments()}
                                className="w-full pl-10 pr-4 py-2.5 bg-dark-800 border border-dark-700 rounded-xl text-white placeholder-silver-500 text-sm focus:outline-none focus:border-accent-500"
                            />
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            {['all', 'manifest_generated', 'pickup_scheduled', 'in_transit', 'out_for_delivery', 'delivered'].map((st) => (
                                <button
                                    key={st}
                                    onClick={() => setStatusFilter(st)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all border ${statusFilter === st
                                        ? 'bg-accent-500 text-dark-900 border-accent-500 shadow-md shadow-accent-500/20'
                                        : 'bg-dark-800 text-silver-400 border-dark-700 hover:text-white'
                                        }`}
                                >
                                    {st.replace('_', ' ')}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Shipments Table */}
                    <div className="bg-dark-800 rounded-3xl border border-dark-700 overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-dark-700 bg-dark-900/40 text-silver-400 text-xs uppercase font-extrabold tracking-wider">
                                        <th className="py-4 px-6">AWB / Courier</th>
                                        <th className="py-4 px-4">Order ID</th>
                                        <th className="py-4 px-4">Customer & City</th>
                                        <th className="py-4 px-4">Specs (Kg / Dims)</th>
                                        <th className="py-4 px-4">Type / Amount</th>
                                        <th className="py-4 px-4">Status</th>
                                        <th className="py-4 px-6 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-dark-700 text-sm">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={7} className="py-12 text-center text-silver-400">
                                                <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-accent-500" />
                                                Loading shipments...
                                            </td>
                                        </tr>
                                    ) : shipments.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="py-16 text-center text-silver-400">
                                                <Box size={40} className="mx-auto mb-3 opacity-30 text-silver-400" />
                                                <p className="font-semibold text-white">No shipments found</p>
                                                <p className="text-xs text-silver-500 mt-1">Dispatched orders with courier partners will appear here.</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        shipments.map((s) => (
                                            <tr key={s.id} className="hover:bg-dark-750/50 transition-colors">
                                                <td className="py-4 px-6">
                                                    <div className="font-extrabold text-white flex items-center gap-1.5 font-mono">
                                                        <span>{s.awb_code}</span>
                                                        <button
                                                            onClick={() => copyToClipboard(s.awb_code)}
                                                            title="Copy AWB code"
                                                            className="text-silver-500 hover:text-accent-500 p-1"
                                                        >
                                                            {copiedAwb === s.awb_code ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                                                        </button>
                                                    </div>
                                                    <div className="text-xs text-accent-400 font-medium mt-0.5">
                                                        {s.courier_name}
                                                    </div>
                                                </td>

                                                <td className="py-4 px-4">
                                                    <span className="font-mono text-xs font-bold text-silver-300 bg-dark-700/80 px-2 py-1 rounded">
                                                        #{s.order_id}
                                                    </span>
                                                    <div className="text-xs text-silver-500 mt-1">
                                                        {new Date(s.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                                    </div>
                                                </td>

                                                <td className="py-4 px-4">
                                                    <div className="font-semibold text-white">{s.customer_name}</div>
                                                    <div className="text-xs text-silver-400">
                                                        {s.delivery_city} ({s.delivery_pincode})
                                                    </div>
                                                </td>

                                                <td className="py-4 px-4">
                                                    <div className="text-xs font-bold text-silver-200">{s.weight_kg} kg</div>
                                                    <div className="text-[11px] text-silver-500 font-mono">
                                                        {s.package_length}x{s.package_width}x{s.package_height} cm
                                                    </div>
                                                </td>

                                                <td className="py-4 px-4">
                                                    {s.is_cod ? (
                                                        <div>
                                                            <span className="px-2 py-0.5 text-[11px] font-extrabold rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                                                COD
                                                            </span>
                                                            <div className="text-xs font-bold text-white mt-1">₹{Number(s.cod_amount).toLocaleString()}</div>
                                                        </div>
                                                    ) : (
                                                        <div>
                                                            <span className="px-2 py-0.5 text-[11px] font-extrabold rounded bg-green-500/10 text-green-400 border border-green-500/20">
                                                                PREPAID
                                                            </span>
                                                            <div className="text-xs text-silver-400 mt-1">₹0.00 collect</div>
                                                        </div>
                                                    )}
                                                </td>

                                                <td className="py-4 px-4">
                                                    {getStatusBadge(s.status)}
                                                </td>

                                                <td className="py-4 px-6 text-right">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <button
                                                            onClick={() => handleOpenTracking(s)}
                                                            className="flex items-center gap-1 px-3 py-1.5 bg-accent-500/10 hover:bg-accent-500/20 text-accent-400 border border-accent-500/30 rounded-lg text-xs font-bold transition-all"
                                                            title="Track Live Shipment"
                                                        >
                                                            <Navigation size={13} />
                                                            Track
                                                        </button>

                                                        <button
                                                            onClick={() => handleOpenLabel(s)}
                                                            className="flex items-center gap-1 px-3 py-1.5 bg-dark-700 hover:bg-dark-600 text-silver-200 border border-dark-600 rounded-lg text-xs font-bold transition-all"
                                                            title="Print 4x6 Thermal Label"
                                                        >
                                                            <Printer size={13} />
                                                            Label
                                                        </button>

                                                        {s.status !== 'cancelled' && s.status !== 'delivered' && (
                                                            <button
                                                                onClick={() => handleCancelShipment(s.id)}
                                                                className="p-1.5 hover:bg-red-500/10 text-silver-500 hover:text-red-400 rounded-lg transition-all"
                                                                title="Cancel Consignment"
                                                            >
                                                                <X size={15} />
                                                            </button>
                                                        )}
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
            )}

            {/* SUBTAB 2: COURIER PARTNERS */}
            {subTab === 'partners' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {partners.map((p) => {
                            const isSR = p.provider_code === 'shiprocket';
                            return (
                                <div
                                    key={p.id}
                                    className={`bg-dark-800 rounded-3xl p-6 border transition-all relative flex flex-col justify-between ${p.is_default
                                        ? 'border-accent-500/50 shadow-lg shadow-accent-500/5 bg-gradient-to-b from-dark-800 to-accent-950/10'
                                        : 'border-dark-700 hover:border-dark-600'
                                        }`}
                                >
                                    <div>
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${isSR ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'bg-dark-700 text-silver-300'}`}>
                                                    <Truck size={18} />
                                                </div>
                                                <div>
                                                    <h3 className="font-extrabold text-white text-base leading-tight">{p.name}</h3>
                                                    <span className="text-[11px] text-silver-400 font-mono">{p.provider_code}</span>
                                                </div>
                                            </div>

                                            {p.is_default && (
                                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-accent-500 text-dark-900 border border-accent-400">
                                                    DEFAULT
                                                </span>
                                            )}
                                        </div>

                                        <p className="text-xs text-silver-400 mb-4 line-clamp-2">{p.notes || 'Reliable courier partner for domestic e-commerce delivery.'}</p>

                                        {/* Rate Cards */}
                                        <div className="grid grid-cols-3 gap-2 bg-dark-900/60 p-3 rounded-2xl border border-dark-700/60 text-center mb-4">
                                            <div>
                                                <div className="text-[10px] uppercase font-bold text-silver-500">Base (500g)</div>
                                                <div className="text-sm font-extrabold text-white">₹{p.base_rate}</div>
                                            </div>
                                            <div>
                                                <div className="text-[10px] uppercase font-bold text-silver-500">Per +1Kg</div>
                                                <div className="text-sm font-extrabold text-white">₹{p.per_kg_rate}</div>
                                            </div>
                                            <div>
                                                <div className="text-[10px] uppercase font-bold text-silver-500">COD Fee</div>
                                                <div className="text-sm font-extrabold text-amber-400">₹{p.cod_charge}</div>
                                            </div>
                                        </div>

                                        {/* Details */}
                                        <div className="space-y-1.5 text-xs mb-4">
                                            <div className="flex justify-between text-silver-400">
                                                <span>Environment:</span>
                                                <span className={`font-bold ${p.environment === 'PRODUCTION' ? 'text-green-400' : 'text-amber-400'}`}>
                                                    {p.environment}
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-silver-400">
                                                <span>Pickup Pin:</span>
                                                <span className="font-mono text-white">{p.pickup_pincode || '110020'}</span>
                                            </div>
                                            {isSR && (
                                                <div className="flex justify-between text-silver-400">
                                                    <span>API Status:</span>
                                                    <span className={p.api_email ? 'text-green-400 font-bold' : 'text-silver-500'}>
                                                        {p.api_email ? 'Configured' : 'Sandbox Fallback'}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Test Result Message */}
                                        {testResult && testResult.id === p.id && (
                                            <div className={`p-3 rounded-xl text-xs font-semibold mb-4 border ${testResult.success ? 'bg-green-500/10 text-green-300 border-green-500/20' : 'bg-rose-500/10 text-rose-300 border-rose-500/20'}`}>
                                                {testResult.message}
                                            </div>
                                        )}
                                    </div>

                                    {/* Action buttons */}
                                    <div className="pt-2 border-t border-dark-700/60 flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleTestConnection(p)}
                                                disabled={testingPartnerId === p.id}
                                                className="px-3 py-1.5 bg-dark-700 hover:bg-dark-600 text-silver-200 text-xs font-bold rounded-xl transition-all border border-dark-600 flex items-center gap-1.5"
                                            >
                                                {testingPartnerId === p.id ? <RefreshCw size={12} className="animate-spin" /> : <ShieldCheck size={13} />}
                                                Test
                                            </button>
                                            <button
                                                onClick={() => setEditingPartner(p)}
                                                className="p-1.5 bg-dark-700 hover:bg-dark-600 text-silver-200 rounded-xl transition-all border border-dark-600"
                                                title="Edit Settings"
                                            >
                                                <Edit3 size={13} />
                                            </button>
                                        </div>

                                        {!p.is_default && (
                                            <button
                                                onClick={() => handleSetDefault(p)}
                                                className="px-3 py-1.5 bg-accent-500/10 hover:bg-accent-500/20 text-accent-400 text-xs font-bold rounded-xl transition-all border border-accent-500/30"
                                            >
                                                Set Default
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* SUBTAB 3: RATE & SERVICEABILITY CALCULATOR */}
            {subTab === 'calculator' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1 bg-dark-800 rounded-3xl p-6 border border-dark-700 shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                            <Sparkles size={18} className="text-accent-400" />
                            <h2 className="text-lg font-bold text-white">Rate & Courier Calculator</h2>
                        </div>
                        <p className="text-xs text-silver-400 mb-6">
                            Simulate and fetch real-time freight charges and carrier options across all postal codes.
                        </p>

                        <form onSubmit={handleCalculateRate} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-silver-400 uppercase mb-1">Pickup Pincode (Origin)</label>
                                <input
                                    type="text"
                                    value={calcPickupPincode}
                                    onChange={(e) => setCalcPickupPincode(e.target.value)}
                                    required
                                    className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-xl text-white text-sm focus:outline-none focus:border-accent-500 font-mono"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-silver-400 uppercase mb-1">Delivery Pincode (Destination)</label>
                                <input
                                    type="text"
                                    value={calcDeliveryPincode}
                                    onChange={(e) => setCalcDeliveryPincode(e.target.value)}
                                    required
                                    className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-xl text-white text-sm focus:outline-none focus:border-accent-500 font-mono"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-silver-400 uppercase mb-1">Package Weight (in Kg)</label>
                                <input
                                    type="number"
                                    step="0.05"
                                    min="0.1"
                                    value={calcWeight}
                                    onChange={(e) => setCalcWeight(e.target.value)}
                                    required
                                    className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-xl text-white text-sm focus:outline-none focus:border-accent-500 font-mono"
                                />
                            </div>

                            <div className="flex items-center gap-3 pt-2">
                                <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-white">
                                    <input
                                        type="checkbox"
                                        checked={calcIsCod}
                                        onChange={(e) => setCalcIsCod(e.target.checked)}
                                        className="w-4 h-4 rounded text-accent-500 focus:ring-accent-500 bg-dark-700 border-dark-600"
                                    />
                                    Cash on Delivery (COD)
                                </label>
                            </div>

                            <button
                                type="submit"
                                disabled={calcLoading}
                                className="w-full mt-4 py-3 bg-gradient-to-r from-accent-600 to-accent-500 hover:from-accent-500 hover:to-accent-400 text-dark-900 font-extrabold rounded-xl shadow-lg shadow-accent-500/20 transition-all flex items-center justify-center gap-2"
                            >
                                {calcLoading ? <RefreshCw size={16} className="animate-spin" /> : <Truck size={16} />}
                                Calculate Shipping Rates
                            </button>
                        </form>
                    </div>

                    <div className="lg:col-span-2 bg-dark-800 rounded-3xl p-6 border border-dark-700 shadow-sm flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-bold text-white">Available Logistics Partners</h2>
                            <span className="text-xs text-silver-500">Origin: {calcPickupPincode} → Destination: {calcDeliveryPincode}</span>
                        </div>

                        {calcResults === null ? (
                            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-silver-500 border border-dashed border-dark-700 rounded-2xl">
                                <Truck size={36} className="opacity-30 mb-2" />
                                <p className="font-semibold text-white">No Calculation Yet</p>
                                <p className="text-xs max-w-sm mt-1">Enter pincodes and parcel weight on the left to compare delivery times and shipping rates across Shiprocket partner networks.</p>
                            </div>
                        ) : calcResults.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-silver-500 border border-dashed border-dark-700 rounded-2xl">
                                <AlertCircle size={36} className="text-amber-500 mb-2" />
                                <p className="font-semibold text-white">No Courier Serviceable</p>
                                <p className="text-xs">No active carrier covers this pincode combination with COD.</p>
                            </div>
                        ) : (
                            <div className="space-y-3 flex-1 overflow-y-auto">
                                {calcResults.map((c, i) => (
                                    <div
                                        key={i}
                                        className="flex items-center justify-between p-4 bg-dark-700/60 hover:bg-dark-700 rounded-2xl border border-dark-600 transition-all"
                                    >
                                        <div className="flex items-center gap-3.5">
                                            <div className="w-10 h-10 rounded-xl bg-accent-500/10 border border-accent-500/20 flex items-center justify-center text-accent-400 font-extrabold text-sm">
                                                {i + 1}
                                            </div>
                                            <div>
                                                <h3 className="font-extrabold text-white text-base">{c.courier_name}</h3>
                                                <div className="flex items-center gap-3 text-xs text-silver-400 mt-0.5">
                                                    <span className="flex items-center gap-1 text-silver-300">
                                                        <Clock size={12} className="text-silver-400" />
                                                        Est. Delivery: {c.etd}
                                                    </span>
                                                    <span>•</span>
                                                    <span>⭐ {c.rating} Rating</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <div className="text-xl font-black text-white">₹{c.rate}</div>
                                            <span className="text-[11px] text-green-400 font-semibold">Serviceable</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* SUBTAB 4: WAREHOUSE ORIGIN SETTINGS */}
            {subTab === 'warehouse' && (
                <div className="max-w-2xl bg-dark-800 rounded-3xl p-8 border border-dark-700 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <MapPin size={22} className="text-accent-400" />
                        <h2 className="text-xl font-bold text-white">Pickup Warehouse / Consignor Address</h2>
                    </div>
                    <p className="text-silver-400 text-xs mb-6">
                        This origin address appears on all shipping manifests, thermal labels, tax invoices, and is sent to Shiprocket as the default pickup hub.
                    </p>

                    <form onSubmit={handleSaveWarehouse} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-silver-400 uppercase mb-1">Warehouse / Seller Name</label>
                            <input
                                type="text"
                                value={warehouseForm.pickup_warehouse_name}
                                onChange={(e) => setWarehouseForm({ ...warehouseForm, pickup_warehouse_name: e.target.value })}
                                required
                                className="w-full px-4 py-2.5 bg-dark-700 border border-dark-600 rounded-xl text-white text-sm focus:outline-none focus:border-accent-500"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-silver-400 uppercase mb-1">Contact Phone</label>
                                <input
                                    type="text"
                                    value={warehouseForm.pickup_phone}
                                    onChange={(e) => setWarehouseForm({ ...warehouseForm, pickup_phone: e.target.value })}
                                    required
                                    className="w-full px-4 py-2.5 bg-dark-700 border border-dark-600 rounded-xl text-white text-sm focus:outline-none focus:border-accent-500 font-mono"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-silver-400 uppercase mb-1">Seller GSTIN</label>
                                <input
                                    type="text"
                                    value={warehouseForm.pickup_gstin}
                                    onChange={(e) => setWarehouseForm({ ...warehouseForm, pickup_gstin: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-dark-700 border border-dark-600 rounded-xl text-white text-sm focus:outline-none focus:border-accent-500 font-mono"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-silver-400 uppercase mb-1">Pickup Street Address</label>
                            <textarea
                                rows={2}
                                value={warehouseForm.pickup_address}
                                onChange={(e) => setWarehouseForm({ ...warehouseForm, pickup_address: e.target.value })}
                                required
                                className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-xl text-white text-sm focus:outline-none focus:border-accent-500"
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-silver-400 uppercase mb-1">City</label>
                                <input
                                    type="text"
                                    value={warehouseForm.pickup_city}
                                    onChange={(e) => setWarehouseForm({ ...warehouseForm, pickup_city: e.target.value })}
                                    required
                                    className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-xl text-white text-sm focus:outline-none focus:border-accent-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-silver-400 uppercase mb-1">State</label>
                                <input
                                    type="text"
                                    value={warehouseForm.pickup_state}
                                    onChange={(e) => setWarehouseForm({ ...warehouseForm, pickup_state: e.target.value })}
                                    required
                                    className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-xl text-white text-sm focus:outline-none focus:border-accent-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-silver-400 uppercase mb-1">Pincode</label>
                                <input
                                    type="text"
                                    value={warehouseForm.pickup_pincode}
                                    onChange={(e) => setWarehouseForm({ ...warehouseForm, pickup_pincode: e.target.value })}
                                    required
                                    className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-xl text-white text-sm focus:outline-none focus:border-accent-500 font-mono"
                                />
                            </div>
                        </div>

                        {warehouseSavedMessage && (
                            <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-300 rounded-xl text-sm font-semibold flex items-center gap-2">
                                <CheckCircle2 size={16} />
                                Origin warehouse settings updated successfully!
                            </div>
                        )}

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={savingWarehouse}
                                className="px-6 py-3 bg-accent-500 hover:bg-accent-400 text-dark-900 font-bold rounded-xl transition-all shadow-md shadow-accent-500/20 flex items-center gap-2"
                            >
                                {savingWarehouse ? <RefreshCw size={16} className="animate-spin" /> : <Check size={16} />}
                                Save Origin Settings
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* LIVE TRACKING TIMELINE MODAL */}
            {trackingModalShipment && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-dark-800 rounded-3xl p-6 md:p-8 max-w-xl w-full border border-dark-700 shadow-2xl relative max-h-[90vh] overflow-y-auto">
                        <button
                            onClick={() => setTrackingModalShipment(null)}
                            className="absolute top-6 right-6 p-2 text-silver-400 hover:text-white hover:bg-dark-700 rounded-full transition-all"
                        >
                            <X size={20} />
                        </button>

                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
                                <Truck size={20} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">Live Tracking Details</h2>
                                <p className="text-xs text-silver-400 font-mono">
                                    AWB: {trackingModalShipment.awb_code} • {trackingModalShipment.courier_name}
                                </p>
                            </div>
                        </div>

                        <div className="my-6 p-4 bg-dark-900/60 rounded-2xl border border-dark-700 flex justify-between items-center">
                            <div>
                                <div className="text-xs text-silver-400">Order Reference:</div>
                                <div className="text-sm font-bold text-white font-mono">#{trackingModalShipment.order_id}</div>
                            </div>
                            <div>
                                <div className="text-xs text-silver-400">Destination:</div>
                                <div className="text-sm font-bold text-white">{trackingModalShipment.delivery_city}</div>
                            </div>
                            <div>
                                <div className="text-xs text-silver-400">Status:</div>
                                <div>{getStatusBadge(trackingModalShipment.status)}</div>
                            </div>
                        </div>

                        <div className="space-y-6 relative pl-6 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-dark-600">
                            {trackingLoading ? (
                                <div className="py-8 text-center text-silver-400">
                                    <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-accent-500" />
                                    Querying carrier tracking network...
                                </div>
                            ) : liveTrackingEvents.length === 0 ? (
                                <p className="text-silver-400 text-sm">No checkpoints recorded yet.</p>
                            ) : (
                                liveTrackingEvents.map((ev, idx) => (
                                    <div key={idx} className="relative">
                                        <div className={`absolute -left-6 top-1 w-3.5 h-3.5 rounded-full border-2 ${idx === liveTrackingEvents.length - 1 ? 'bg-accent-500 border-accent-400 ring-4 ring-accent-500/20' : 'bg-dark-600 border-dark-500'}`} />
                                        <div className="text-sm font-bold text-white">{ev.activity}</div>
                                        <div className="flex items-center gap-2 text-xs text-silver-400 mt-1">
                                            <span className="text-accent-400 font-semibold">{ev.location}</span>
                                            <span>•</span>
                                            <span>{ev.timestamp}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {trackingModalShipment.tracking_url && (
                            <div className="mt-8 pt-4 border-t border-dark-700 flex justify-end">
                                <a
                                    href={trackingModalShipment.tracking_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-4 py-2 bg-dark-700 hover:bg-dark-600 text-silver-200 text-xs font-bold rounded-xl transition-all border border-dark-600 flex items-center gap-1.5"
                                >
                                    Open Carrier Portal <ExternalLink size={13} />
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* PRINT SHIPPING LABEL MODAL */}
            {labelModalShipment && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-dark-800 rounded-3xl p-6 max-w-2xl w-full border border-dark-700 shadow-2xl relative max-h-[95vh] flex flex-col">
                        <div className="flex justify-between items-center pb-4 border-b border-dark-700">
                            <div>
                                <h2 className="text-lg font-bold text-white">Print Shipping Label (4x6" Thermal)</h2>
                                <p className="text-xs text-silver-400 font-mono">Consignment: {labelModalShipment.awb_code}</p>
                            </div>
                            <button
                                onClick={() => setLabelModalShipment(null)}
                                className="p-2 text-silver-400 hover:text-white hover:bg-dark-700 rounded-full transition-all"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 my-4 overflow-hidden rounded-2xl bg-white p-2">
                            {labelLoading ? (
                                <div className="h-96 flex flex-col items-center justify-center text-dark-700">
                                    <RefreshCw size={24} className="animate-spin mb-2" />
                                    Loading standard thermal layout...
                                </div>
                            ) : (
                                <iframe
                                    srcDoc={labelHtml}
                                    title="Shipping Label"
                                    className="w-full h-[520px] border-0"
                                />
                            )}
                        </div>

                        <div className="pt-2 flex justify-end gap-3">
                            <button
                                onClick={() => setLabelModalShipment(null)}
                                className="px-4 py-2 bg-dark-700 hover:bg-dark-600 text-silver-300 text-sm font-bold rounded-xl transition-all"
                            >
                                Close
                            </button>
                            <button
                                onClick={() => {
                                    const win = window.open('', '_blank');
                                    if (win) {
                                        win.document.write(labelHtml);
                                        win.document.close();
                                        setTimeout(() => win.print(), 300);
                                    }
                                }}
                                className="px-5 py-2 bg-accent-500 hover:bg-accent-400 text-dark-900 text-sm font-bold rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-accent-500/20"
                            >
                                <Printer size={16} /> Print Label Now
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* EDIT COURIER PARTNER MODAL */}
            {editingPartner && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-dark-800 rounded-3xl p-6 md:p-8 max-w-lg w-full border border-dark-700 shadow-2xl relative">
                        <button
                            onClick={() => setEditingPartner(null)}
                            className="absolute top-6 right-6 p-2 text-silver-400 hover:text-white hover:bg-dark-700 rounded-full transition-all"
                        >
                            <X size={20} />
                        </button>

                        <h2 className="text-xl font-bold text-white mb-1">Edit {editingPartner.name}</h2>
                        <p className="text-xs text-silver-400 mb-6">Configure credentials, rates, and pickup locations.</p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-silver-400 uppercase mb-1">Courier Name</label>
                                <input
                                    type="text"
                                    value={editingPartner.name}
                                    onChange={(e) => setEditingPartner({ ...editingPartner, name: e.target.value })}
                                    className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-xl text-white text-sm focus:outline-none focus:border-accent-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-silver-400 uppercase mb-1">Environment</label>
                                    <select
                                        value={editingPartner.environment}
                                        onChange={(e) => setEditingPartner({ ...editingPartner, environment: e.target.value as any })}
                                        className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-xl text-white text-sm focus:outline-none focus:border-accent-500"
                                    >
                                        <option value="SANDBOX">Sandbox / Testing</option>
                                        <option value="PRODUCTION">Production / Live</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-silver-400 uppercase mb-1">Pickup Pincode</label>
                                    <input
                                        type="text"
                                        value={editingPartner.pickup_pincode}
                                        onChange={(e) => setEditingPartner({ ...editingPartner, pickup_pincode: e.target.value })}
                                        className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-xl text-white text-sm focus:outline-none focus:border-accent-500 font-mono"
                                    />
                                </div>
                            </div>

                            {editingPartner.provider_code === 'shiprocket' && (
                                <div className="space-y-3 p-4 bg-dark-900/60 rounded-2xl border border-dark-700">
                                    <div className="text-xs font-bold text-accent-400 uppercase">Shiprocket API Credentials</div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-silver-400 mb-1">API Email / Client ID</label>
                                        <input
                                            type="text"
                                            value={editingPartner.api_email || ''}
                                            onChange={(e) => setEditingPartner({ ...editingPartner, api_email: e.target.value })}
                                            placeholder="e.g. shiprocket-account@domain.com"
                                            className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white text-xs focus:outline-none focus:border-accent-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-silver-400 mb-1">API Password / Secret</label>
                                        <input
                                            type="password"
                                            value={editingPartner.api_password || ''}
                                            onChange={(e) => setEditingPartner({ ...editingPartner, api_password: e.target.value })}
                                            placeholder="Shiprocket API password"
                                            className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white text-xs focus:outline-none focus:border-accent-500"
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-silver-400 uppercase mb-1">Base Rate (₹)</label>
                                    <input
                                        type="number"
                                        step="1"
                                        value={editingPartner.base_rate}
                                        onChange={(e) => setEditingPartner({ ...editingPartner, base_rate: parseFloat(e.target.value) || 0 })}
                                        className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-xl text-white text-sm focus:outline-none focus:border-accent-500 font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-silver-400 uppercase mb-1">Per +1Kg (₹)</label>
                                    <input
                                        type="number"
                                        step="1"
                                        value={editingPartner.per_kg_rate}
                                        onChange={(e) => setEditingPartner({ ...editingPartner, per_kg_rate: parseFloat(e.target.value) || 0 })}
                                        className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-xl text-white text-sm focus:outline-none focus:border-accent-500 font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-silver-400 uppercase mb-1">COD Fee (₹)</label>
                                    <input
                                        type="number"
                                        step="1"
                                        value={editingPartner.cod_charge}
                                        onChange={(e) => setEditingPartner({ ...editingPartner, cod_charge: parseFloat(e.target.value) || 0 })}
                                        className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-xl text-white text-sm focus:outline-none focus:border-accent-500 font-mono"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    onClick={() => setEditingPartner(null)}
                                    className="px-4 py-2 bg-dark-700 hover:bg-dark-600 text-silver-300 text-sm font-bold rounded-xl transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSavePartner}
                                    disabled={savingPartner}
                                    className="px-5 py-2 bg-accent-500 hover:bg-accent-400 text-dark-900 text-sm font-bold rounded-xl transition-all flex items-center gap-2"
                                >
                                    {savingPartner ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
