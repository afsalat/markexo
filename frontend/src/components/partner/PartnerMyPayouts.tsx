'use client';

import { useState, useEffect } from 'react';
import { IndianRupee, History, Send, Clock, CheckCircle, AlertCircle, PlusCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { API_BASE_URL } from '@/config/apiConfig';

// Mock Data Types
interface PayoutRequest {
    id: number;
    amount: number;
    requested_at: string;
    status: 'pending';
    account_details: string;
}

interface PayoutTransaction {
    id: number;
    amount: number;
    processed_at: string;
    transaction_id: string;
    status: 'paid' | 'rejected';
}

export default function PartnerMyPayouts() {
    const { user, token } = useAuth();
    const [activeTab, setActiveTab] = useState<'request' | 'history'>('request');
    const [loading, setLoading] = useState(true);

    // Form State
    const [amount, setAmount] = useState('');
    const [accountDetails, setAccountDetails] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [availableBalance, setAvailableBalance] = useState(0);
    const [statusLog, setStatusLog] = useState<string>('');

    // Data State
    const [myRequests, setMyRequests] = useState<PayoutRequest[]>([]);
    const [myHistory, setMyHistory] = useState<PayoutTransaction[]>([]);

    useEffect(() => {
        const fetchPayouts = async () => {
            setLoading(true);
            setStatusLog('Started...');
            try {
                // 1. Fetch Payouts
                const payoutsUrl = `${API_BASE_URL}/payouts/`;
                console.log("Fetching Payouts:", payoutsUrl);

                const res = await fetch(payoutsUrl, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                setStatusLog(prev => prev + ` | Payouts: ${res.status}`);

                if (res.ok) {
                    const data = await res.json();
                    // Handle pagination (data.results) or direct list (data)
                    const results = Array.isArray(data) ? data : (data.results || []);

                    setMyRequests(results.filter((r: any) => r.status === 'pending'));
                    setMyHistory(results.filter((r: any) => r.status !== 'pending'));
                } else {
                    setStatusLog(prev => prev + ` | Payouts Fail`);
                }

                // 2. Fetch Stats
                const statsUrl = `${API_BASE_URL}/admin/partner-stats/`;
                console.log("Fetching Stats:", statsUrl);

                const statsRes = await fetch(statsUrl, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                setStatusLog(prev => prev + ` | Stats: ${statsRes.status}`);

                if (statsRes.ok) {
                    const stats = await statsRes.json();
                    console.log("Partner Stats JSON:", stats);
                    const pending = parseFloat(stats.pending_amount) || 0;
                    setAvailableBalance(pending);
                    setStatusLog(prev => prev + ` | BAL: ${pending}`);
                } else {
                    const txt = await statsRes.text();
                    setStatusLog(prev => prev + ` | Stats Err: ${txt.substring(0, 20)}`);
                }

            } catch (err: any) {
                console.error("Payouts Fetch Error", err);
                setStatusLog(prev => prev + ` | ERROR: ${err.message}`);
            } finally {
                setLoading(false);
            }
        };

        if (token) fetchPayouts();
    }, [token]);

    const handleSubmitRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        const reqAmount = parseFloat(amount);

        if (!reqAmount || reqAmount <= 0) {
            alert("Please enter a valid amount.");
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch(`${API_BASE_URL}/payouts/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    amount: reqAmount,
                    bank_account_details: accountDetails,
                    notes: "User requested payout"
                })
            });

            if (res.ok) {
                const newReq = await res.json();
                setMyRequests([newReq, ...myRequests]);
                setAmount('');
                setAccountDetails('');
                alert("Payout request submitted successfully!");
            } else {
                alert("Failed to submit request.");
            }
        } catch (err) {
            console.error(err);
            alert("Error submitting request.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatDate = (dateString: string | null | undefined) => {
        if (!dateString) return 'Pending';
        const date = new Date(dateString);
        return isNaN(date.getTime())
            ? 'Invalid Date'
            : date.toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
    };

    return (
        <div className="animate-fade-in space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <IndianRupee className="text-accent-500" size={28} />
                        My Payouts
                    </h2>
                    <p className="text-silver-500 mt-1">Manage your earnings and withdraw funds</p>
                </div>
            </div>

            {/* Balance Card */}
            <div className="bg-gradient-to-r from-accent-600 to-accent-800 rounded-2xl p-6 shadow-lg shadow-accent-500/20 text-white relative overflow-hidden">
                <div className="relative z-10">
                    <p className="text-accent-100 font-medium mb-1">Available for Payout</p>
                    <h3 className="text-4xl font-bold">₹{availableBalance.toLocaleString()}</h3>
                    <p className="text-sm text-accent-200 mt-2 opacity-80">
                        Total Earnings: ₹{(
                            Number(availableBalance) +
                            myRequests.reduce((a, b) => a + Number(b.amount), 0) +
                            myHistory
                                .filter(t => t.status === 'paid')
                                .reduce((a, b) => a + Number(b.amount), 0)
                        ).toLocaleString()}
                    </p>
                </div>
                <IndianRupee className="absolute -right-6 -bottom-6 text-white/10 w-40 h-40" />
            </div>

            {/* Tabs */}
            <div className="bg-dark-800 p-1 rounded-xl border border-dark-700 shadow-sm inline-flex">
                <button
                    onClick={() => setActiveTab('request')}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'request'
                        ? 'bg-accent-600 text-white shadow-lg shadow-accent-500/20'
                        : 'text-silver-500 hover:text-white hover:bg-dark-700'
                        }`}
                >
                    <PlusCircle size={16} />
                    Request Payout
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'history'
                        ? 'bg-accent-600 text-white shadow-lg shadow-accent-500/20'
                        : 'text-silver-500 hover:text-white hover:bg-dark-700'
                        }`}
                >
                    <History size={16} />
                    Payout History
                </button>
            </div>

            {/* Content Area */}
            <div className="bg-dark-800 rounded-xl border border-dark-700 shadow-sm overflow-hidden min-h-[400px] p-6">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-500"></div>
                    </div>
                ) : (
                    <>
                        {activeTab === 'request' && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div>
                                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                        <Send size={20} className="text-accent-500" />
                                        Submit New Request
                                    </h3>
                                    <form onSubmit={handleSubmitRequest} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-silver-400 mb-1">Amount to Withdraw (₹)</label>
                                            <input
                                                type="number"
                                                value={amount}
                                                onChange={(e) => setAmount(e.target.value)}
                                                max={availableBalance}
                                                className="w-full bg-dark-900 border border-dark-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent-500 transition-colors"
                                                placeholder="Enter amount"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-silver-400 mb-1">Account Details (UPI / Bank)</label>
                                            <textarea
                                                value={accountDetails}
                                                onChange={(e) => setAccountDetails(e.target.value)}
                                                className="w-full bg-dark-900 border border-dark-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent-500 transition-colors h-24 resize-none"
                                                placeholder="e.g. UPI ID: name@upi or Bank Account details..."
                                                required
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={isSubmitting || availableBalance <= 0}
                                            className="w-full bg-accent-600 text-white font-bold py-3 rounded-xl hover:bg-accent-500 transition-colors shadow-lg shadow-accent-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                    Processing...
                                                </>
                                            ) : (
                                                <>Submit Request</>
                                            )}
                                        </button>
                                    </form>
                                </div>

                                <div>
                                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                        <Clock size={20} className="text-amber-500" />
                                        Pending Requests
                                    </h3>
                                    {myRequests.length === 0 ? (
                                        <div className="bg-dark-900/50 rounded-xl p-8 text-center border border-dark-700 border-dashed">
                                            <p className="text-silver-500">No pending payout requests.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {myRequests.map(req => (
                                                <div key={req.id} className="bg-dark-900 p-4 rounded-xl border border-dark-700 flex justify-between items-center">
                                                    <div>
                                                        <p className="text-white font-bold text-lg">₹{req.amount.toLocaleString()}</p>
                                                        <p className="text-xs text-silver-500">{formatDate(req.requested_at)}</p>
                                                    </div>
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                                        <Clock size={12} /> Pending
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'history' && (
                            <div>
                                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                    <History size={20} className="text-accent-500" />
                                    Transaction History
                                </h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-dark-900 border-b border-dark-700 text-xs uppercase font-semibold text-silver-500">
                                            <tr>
                                                <th className="px-6 py-4 text-left tracking-wider">Transaction ID</th>
                                                <th className="px-6 py-4 text-left tracking-wider">Date</th>
                                                <th className="px-6 py-4 text-left tracking-wider">Amount</th>
                                                <th className="px-6 py-4 text-left tracking-wider">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-dark-700">
                                            {myHistory.length === 0 ? (
                                                <tr>
                                                    <td colSpan={4} className="px-6 py-12 text-center text-silver-500">
                                                        No transaction history found.
                                                    </td>
                                                </tr>
                                            ) : (
                                                myHistory.map((txn) => (
                                                    <tr key={txn.id} className="hover:bg-dark-700/50 transition-colors">
                                                        <td className="px-6 py-4 text-silver-400 font-mono text-xs">
                                                            {txn.transaction_id}
                                                        </td>
                                                        <td className="px-6 py-4 text-silver-300 text-sm">
                                                            {formatDate(txn.processed_at)}
                                                        </td>
                                                        <td className="px-6 py-4 font-bold text-white">
                                                            ₹{txn.amount.toLocaleString()}
                                                        </td>
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
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
