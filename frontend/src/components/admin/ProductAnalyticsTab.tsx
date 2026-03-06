import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { fetchAdminAnalytics } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function ProductAnalyticsTab() {
    const { token } = useAuth();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!token) {
            setError('No authentication token found');
            setLoading(false);
            return;
        }

        fetchAdminAnalytics(token)
            .then(res => {
                console.log('Analytics Data:', res); // Debug log
                setData(res);
                setLoading(false);
            })
            .catch(err => {
                console.error('Analytics Fetch Error:', err);
                setError(err.message);
                setLoading(false);
            });
    }, [token]);

    if (loading) return <div className="text-center py-10 text-silver-500">Loading Analytics...</div>;
    if (error) return <div className="text-center py-10 text-red-500">Error loading analytics: {error}</div>;

    return (
        <div className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-bold text-white">Product Analytics</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Most Clicked */}
                <div className="bg-dark-800 p-6 rounded-2xl border border-dark-700 shadow-sm">
                    <h3 className="text-lg font-semibold text-white mb-4">Most Clicked Products</h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data?.most_clicked}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis dataKey="name" stroke="#9ca3af" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={60} />
                                <YAxis stroke="#9ca3af" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '0.5rem', color: '#fff' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Bar dataKey="views" fill="#8b5cf6" name="Views" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Most Ordered */}
                <div className="bg-dark-800 p-6 rounded-2xl border border-dark-700 shadow-sm">
                    <h3 className="text-lg font-semibold text-white mb-4">Most Ordered Products</h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data?.most_ordered}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis dataKey="name" stroke="#9ca3af" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={60} />
                                <YAxis stroke="#9ca3af" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '0.5rem', color: '#fff' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Bar dataKey="sold_count" fill="#10b981" name="Orders" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Partner Revenue */}
                <div className="bg-dark-800 p-6 rounded-2xl border border-dark-700 shadow-sm">
                    <h3 className="text-lg font-semibold text-white mb-4">Partner Revenue (Last 6 Months)</h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data?.partner_revenue}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis dataKey="month" stroke="#9ca3af" tick={{ fontSize: 10 }} />
                                <YAxis stroke="#9ca3af" tickFormatter={(value) => `₹${value}`} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '0.5rem', color: '#fff' }}
                                    itemStyle={{ color: '#fff' }}
                                    formatter={(value: any) => [`₹${value}`, 'Revenue']}
                                />
                                <Bar dataKey="revenue" fill="#3b82f6" name="Revenue" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Partner Payouts */}
                <div className="bg-dark-800 p-6 rounded-2xl border border-dark-700 shadow-sm">
                    <h3 className="text-lg font-semibold text-white mb-4">Partner Payouts (Top 10)</h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data?.partner_payouts}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis dataKey="name" stroke="#9ca3af" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={60} />
                                <YAxis stroke="#9ca3af" tickFormatter={(value) => `₹${value}`} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '0.5rem', color: '#fff' }}
                                    itemStyle={{ color: '#fff' }}
                                    formatter={(value: any) => [`₹${value}`, 'Payout']}
                                />
                                <Bar dataKey="amount" fill="#f59e0b" name="Payout" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Less Performed Table */}
            <div className="bg-dark-800 rounded-2xl border border-dark-700 overflow-hidden shadow-sm">
                <div className="p-6 border-b border-dark-700">
                    <h3 className="text-lg font-semibold text-white">Less Performed Products</h3>
                    <p className="text-sm text-silver-500">Products with lowest sales and views (Opportunities for improvement)</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-silver-400">
                        <thead className="bg-dark-900/50 text-xs uppercase font-medium text-silver-500">
                            <tr>
                                <th className="px-6 py-4">Product</th>
                                <th className="px-6 py-4">Category</th>
                                <th className="px-6 py-4 text-center">Views</th>
                                <th className="px-6 py-4 text-center">Sold Count</th>
                                <th className="px-6 py-4 text-right">Price</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-dark-700">
                            {data?.less_performed.length > 0 ? (
                                data.less_performed.map((product: any) => (
                                    <tr key={product.id} className="hover:bg-dark-700/50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-white">{product.name}</td>
                                        <td className="px-6 py-4">{product.category_details?.name || 'N/A'}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="inline-flex items-center px-2 py-1 rounded-md bg-dark-700 text-silver-300 text-xs">
                                                {product.views}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="inline-flex items-center px-2 py-1 rounded-md bg-dark-700 text-silver-300 text-xs">
                                                {product.sold_count}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">₹{product.current_price}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-silver-500">
                                        No data available
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            {/* Top Partners Table */}
            <div className="bg-dark-800 rounded-2xl border border-dark-700 overflow-hidden shadow-sm mt-6">
                <div className="p-6 border-b border-dark-700">
                    <h3 className="text-lg font-semibold text-white">Top Performing Partners</h3>
                    <p className="text-sm text-silver-500">Partners with highest total payouts</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-silver-400">
                        <thead className="bg-dark-900/50 text-xs uppercase font-medium text-silver-500">
                            <tr>
                                <th className="px-6 py-4">Shop Name</th>
                                <th className="px-6 py-4">Owner Email</th>
                                <th className="px-6 py-4 text-right">Total Payout</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-dark-700">
                            {data?.top_partners && data.top_partners.length > 0 ? (
                                data.top_partners.map((partner: any, index: number) => (
                                    <tr key={index} className="hover:bg-dark-700/50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-white">{partner.name}</td>
                                        <td className="px-6 py-4">{partner.email}</td>
                                        <td className="px-6 py-4 text-right text-emerald-400 font-bold">₹{partner.total_payout.toLocaleString()}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={3} className="px-6 py-8 text-center text-silver-500">
                                        No payout data available
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
