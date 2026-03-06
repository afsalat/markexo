'use client';

import { useState, useEffect } from 'react';
import { Search, IndianRupee, Download, CheckCircle, Clock, History, AlertCircle, Check, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { API_BASE_URL } from '@/config/apiConfig';

// Mock Data Types
interface PayoutRequest {
    id: number;
    partner_name: string;
    partner_email?: string;
    partner_phone?: string;
    shop_name: string;
    amount: number;
    requested_at: string;
    status: 'pending';
    bank_account_details: string;
    notes?: string;
}

interface PayoutTransaction {
    id: number;
    partner_name: string;
    partner_email?: string;
    partner_phone?: string;
    shop_name: string;
    amount: number;
    processed_at: string;
    requested_at: string;
    transaction_id?: string;
    status: 'paid' | 'rejected';
    bank_account_details?: string;
    notes?: string;
}

export default function PartnerPayoutsTab() {
    const { token } = useAuth();
    const [activeTab, setActiveTab] = useState<'requests' | 'history'>('requests');
    const [searchTerm, setSearchTerm] = useState('');
    const [requests, setRequests] = useState<PayoutRequest[]>([]);
    const [history, setHistory] = useState<PayoutTransaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPayouts();
    }, [token]);

    const fetchPayouts = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/payouts/`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                // Handle pagination (data.results) or direct list (data)
                const results = Array.isArray(data) ? data : (data.results || []);

                setRequests(results.filter((r: any) => r.status === 'pending'));
                setHistory(results.filter((r: any) => r.status !== 'pending'));
            }
        } catch (err) {
            console.error("Failed to fetch payouts", err);
        } finally {
            setLoading(false);
        }
    };

    const [showApproveModal, setShowApproveModal] = useState(false);
    const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);
    const [transactionId, setTransactionId] = useState('');
    const [paidDate, setPaidDate] = useState(new Date().toISOString().split('T')[0]);

    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<PayoutRequest | PayoutTransaction | null>(null);

    const handleViewDetails = (request: PayoutRequest | PayoutTransaction) => {
        setSelectedRequest(request);
        setShowDetailsModal(true);
    };

    useEffect(() => {
        if (showApproveModal) {
            setPaidDate(new Date().toISOString().split('T')[0]);
            setTransactionId('');
        }
    }, [showApproveModal]);

    const initiateApprove = (id: number) => {
        setSelectedRequestId(id);
        setShowApproveModal(true);
    };

    const confirmApprove = async () => {
        if (!selectedRequestId || !transactionId) {
            alert('Transaction ID is required');
            return;
        }

        try {
            const res = await fetch(`${API_BASE_URL}/payouts/${selectedRequestId}/`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    status: 'paid',
                    transaction_id: transactionId,
                    processed_at: paidDate
                })
            });

            if (res.ok) {
                setShowApproveModal(false);
                fetchPayouts();
            } else {
                alert('Failed to approve request');
            }
        } catch (err) {
            console.error(err);
            alert('Error approving request');
        }
    };

    const handleReject = async (id: number) => {
        if (confirm(`Reject payout request #${id}?`)) {
            try {
                const res = await fetch(`${API_BASE_URL}/payouts/${id}/`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ status: 'rejected' })
                });

                if (res.ok) {
                    fetchPayouts();
                    setShowDetailsModal(false);
                } else {
                    alert('Failed to reject request');
                }
            } catch (err) {
                console.error(err);
                alert('Error rejecting request');
            }
        }
    };

    const filteredRequests = requests.filter(r =>
        r.partner_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.shop_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredHistory = history.filter(h =>
        h.partner_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        h.shop_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        h.transaction_id?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="animate-fade-in space-y-6 relative">
            {/* Details Modal */}
            {showDetailsModal && selectedRequest && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-dark-800 rounded-xl border border-dark-600 p-6 w-full max-w-2xl shadow-2xl overflow-y-auto max-h-[90vh]">
                        <div className="flex justify-between items-start mb-6 border-b border-dark-600 pb-4">
                            <div>
                                <h3 className="text-xl font-bold text-white">Payout Request Details</h3>
                                <p className="text-silver-500 text-sm mt-1">Request ID: #{selectedRequest.id}</p>
                            </div>
                            <button
                                onClick={() => setShowDetailsModal(false)}
                                className="text-silver-400 hover:text-white transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div>
                                    <h4 className="text-accent-500 font-semibold mb-3 flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-accent-500"></div>
                                        Partner Information
                                    </h4>
                                    <div className="bg-dark-900 p-4 rounded-xl border border-dark-700 space-y-3">
                                        <div>
                                            <p className="text-silver-500 text-xs uppercase font-medium">Name</p>
                                            <p className="text-white font-medium">{selectedRequest.partner_name}</p>
                                        </div>
                                        <div>
                                            <p className="text-silver-500 text-xs uppercase font-medium">Email</p>
                                            <p className="text-white">{selectedRequest.partner_email || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-silver-500 text-xs uppercase font-medium">Phone</p>
                                            <p className="text-white">{selectedRequest.partner_phone || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-silver-500 text-xs uppercase font-medium">Shop Name</p>
                                            <p className="text-white">{selectedRequest.shop_name}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <h4 className="text-green-500 font-semibold mb-3 flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                        Request Information
                                    </h4>
                                    <div className="bg-dark-900 p-4 rounded-xl border border-dark-700 space-y-4">
                                        <div className="flex justify-between items-center pb-3 border-b border-dark-700">
                                            <p className="text-silver-500 text-sm">Amount Requested</p>
                                            <p className="text-2xl font-bold text-white">₹{selectedRequest.amount.toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-silver-500 text-xs uppercase font-medium mb-1">Requested Date</p>
                                            <p className="text-white flex items-center gap-2">
                                                <Clock size={14} className="text-amber-500" />
                                                {formatDate(selectedRequest.requested_at)}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-silver-500 text-xs uppercase font-medium mb-1">Bank/Account Details</p>
                                            <div className="bg-dark-800 p-3 rounded-lg border border-dark-700 font-mono text-sm text-silver-300 break-words whitespace-pre-wrap">
                                                {selectedRequest.bank_account_details}
                                            </div>
                                        </div>
                                        {selectedRequest.notes && (
                                            <div>
                                                <p className="text-silver-500 text-xs uppercase font-medium mb-1">Notes</p>
                                                <p className="text-silver-300 text-sm italic">"{selectedRequest.notes}"</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-dark-600">
                            {selectedRequest.status === 'pending' ? (
                                <>
                                    <button
                                        onClick={() => handleReject(selectedRequest.id)}
                                        className="px-5 py-2.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-500/20 flex items-center gap-2"
                                    >
                                        <X size={18} /> Reject Request
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowDetailsModal(false);
                                            initiateApprove(selectedRequest.id);
                                        }}
                                        className="px-6 py-2.5 bg-accent-600 text-white rounded-lg hover:bg-accent-500 transition-colors font-medium shadow-lg shadow-accent-500/20 flex items-center gap-2"
                                    >
                                        <Check size={18} /> Approve & Pay
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={() => setShowDetailsModal(false)}
                                    className="px-6 py-2.5 bg-dark-700 text-white rounded-lg hover:bg-dark-600 transition-colors font-medium"
                                >
                                    Close
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal */}
            {showApproveModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-dark-800 rounded-xl border border-dark-600 p-6 w-full max-w-md shadow-2xl">
                        <h3 className="text-xl font-bold text-white mb-4">Confirm Payout</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-silver-400 text-sm mb-1">Transaction ID</label>
                                <input
                                    type="text"
                                    value={transactionId}
                                    onChange={(e) => setTransactionId(e.target.value)}
                                    className="w-full bg-dark-900 border border-dark-700 rounded-lg px-4 py-2 text-white focus:border-accent-500 outline-none"
                                    placeholder="Enter Transaction ID"
                                />
                            </div>
                            <div>
                                <label className="block text-silver-400 text-sm mb-1">Paid Date</label>
                                <input
                                    type="date"
                                    value={paidDate}
                                    onChange={(e) => setPaidDate(e.target.value)}
                                    className="w-full bg-dark-900 border border-dark-700 rounded-lg px-4 py-2 text-white focus:border-accent-500 outline-none"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => setShowApproveModal(false)}
                                className="px-4 py-2 text-silver-400 hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmApprove}
                                className="px-4 py-2 bg-accent-600 text-white rounded-lg hover:bg-accent-500 transition-colors font-medium"
                            >
                                Confirm & Pay
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <IndianRupee className="text-accent-500" size={28} />
                        Partner Payouts
                    </h2>
                    <p className="text-silver-500 mt-1">Manage partner earnings and transaction history</p>
                </div>
                <div className="flex gap-2">
                    <button className="bg-dark-800 text-silver-300 px-4 py-2 rounded-xl font-medium hover:bg-dark-700 transition-colors flex items-center gap-2 border border-dark-600">
                        <Download size={18} />
                        Export
                    </button>
                </div>
            </div>

            {/* Tabs & Search */}
            <div className="bg-dark-800 p-1 rounded-xl border border-dark-700 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex p-1 bg-dark-900/50 rounded-lg w-full md:w-auto">
                    <button
                        onClick={() => setActiveTab('requests')}
                        className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'requests'
                            ? 'bg-accent-600 text-white shadow-lg shadow-accent-500/20'
                            : 'text-silver-500 hover:text-white hover:bg-dark-700'
                            }`}
                    >
                        Payout Requests
                        <span className={`ml-2 text-xs py-0.5 px-1.5 rounded-full ${activeTab === 'requests' ? 'bg-white/20 text-white' : 'bg-dark-700 text-silver-400'}`}>
                            {requests.length}
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'history'
                            ? 'bg-accent-600 text-white shadow-lg shadow-accent-500/20'
                            : 'text-silver-500 hover:text-white hover:bg-dark-700'
                            }`}
                    >
                        Payout History
                    </button>
                </div>

                <div className="relative w-full md:w-64 pr-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-silver-500" size={16} />
                    <input
                        type="text"
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border-0 rounded-lg focus:ring-0 bg-transparent text-white placeholder-silver-600 text-sm"
                    />
                </div>
            </div>

            {/* Content Area */}
            <div className="bg-dark-800 rounded-xl border border-dark-700 shadow-sm overflow-hidden min-h-[400px]">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-500"></div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        {activeTab === 'requests' && (
                            <table className="w-full">
                                <thead className="bg-dark-900 border-b border-dark-700 text-xs uppercase font-semibold text-silver-500">
                                    <tr>
                                        <th className="px-6 py-4 text-left tracking-wider">Partner</th>
                                        <th className="px-6 py-4 text-left tracking-wider">Amount</th>
                                        <th className="px-6 py-4 text-left tracking-wider">Requested At</th>
                                        <th className="px-6 py-4 text-left tracking-wider">Account</th>
                                        <th className="px-6 py-4 text-right tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-dark-700">
                                    {filteredRequests.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center text-silver-500">
                                                No pending requests found.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredRequests.map((req) => (
                                            <tr key={req.id} className="hover:bg-dark-700/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="font-medium text-white">{req.partner_name}</div>
                                                    <div className="text-xs text-silver-500">{req.shop_name}</div>
                                                </td>
                                                <td className="px-6 py-4 font-bold text-white">₹{req.amount.toLocaleString()}</td>
                                                <td className="px-6 py-4 text-silver-400 text-sm">{formatDate(req.requested_at)}</td>
                                                <td className="px-6 py-4 text-silver-400 text-sm font-mono">{req.bank_account_details}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() => handleViewDetails(req)}
                                                            className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors"
                                                            title="View Details"
                                                        >
                                                            <Search size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleReject(req.id)}
                                                            className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                                            title="Reject"
                                                        >
                                                            <X size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => initiateApprove(req.id)}
                                                            className="p-2 text-green-500 hover:bg-green-500/10 rounded-lg transition-colors"
                                                            title="Approve & Pay"
                                                        >
                                                            <Check size={18} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        )}

                        {activeTab === 'history' && (
                            <table className="w-full">
                                <thead className="bg-dark-900 border-b border-dark-700 text-xs uppercase font-semibold text-silver-500">
                                    <tr>
                                        <th className="px-6 py-4 text-left tracking-wider">Partner</th>
                                        <th className="px-6 py-4 text-left tracking-wider">Amount</th>
                                        <th className="px-6 py-4 text-left tracking-wider">Dates</th>
                                        <th className="px-6 py-4 text-left tracking-wider">Transaction ID</th>
                                        <th className="px-6 py-4 text-left tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-right tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-dark-700">
                                    {filteredHistory.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center text-silver-500">
                                                No payment history found.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredHistory.map((txn) => (
                                            <tr key={txn.id} className="hover:bg-dark-700/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="font-medium text-white">{txn.partner_name}</div>
                                                    <div className="text-xs text-silver-500">{txn.shop_name}</div>
                                                </td>
                                                <td className="px-6 py-4 font-bold text-white">₹{txn.amount.toLocaleString()}</td>
                                                <td className="px-6 py-4 text-sm">
                                                    <div className="text-silver-300">
                                                        <span className="text-silver-500 text-xs uppercase mr-2">Paid:</span>
                                                        {formatDate(txn.processed_at)}
                                                    </div>
                                                    <div className="text-silver-500 text-xs mt-1">
                                                        <span className="uppercase mr-2">Req:</span>
                                                        {formatDate(txn.requested_at)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-silver-500 text-xs font-mono">{txn.transaction_id}</td>
                                                <td className="px-6 py-4">
                                                    {txn.status === 'paid' ? (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-500 border border-green-500/20">
                                                            <CheckCircle size={12} /> Paid
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-500 border border-red-500/20">
                                                            <AlertCircle size={12} /> Rejected
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => handleViewDetails(txn)}
                                                        className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors"
                                                        title="View Details"
                                                    >
                                                        <Search size={18} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
