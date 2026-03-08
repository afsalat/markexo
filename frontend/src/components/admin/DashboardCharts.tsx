'use client';

import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';

interface DashboardChartsProps {
    revenueHistory: { date: string; revenue: number; profit: number }[];
    statusDistribution: { status: string; count: number }[];
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#6366F1', '#EF4444'];

export default function DashboardCharts({ revenueHistory, statusDistribution }: DashboardChartsProps) {
    const formatCurrency = (value: number) => {
        return `₹${new Intl.NumberFormat('en-IN').format(value)}`;
    };

    const formatDate = (dateStr: any) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Revenue & Profit Trend Line Chart */}
            <div className="bg-dark-800 p-6 rounded-2xl shadow-sm border border-dark-700">
                <h3 className="text-lg font-bold text-white mb-6 font-display">Revenue & Profit Trend (Last 7 Days)</h3>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={revenueHistory}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1f2937" />
                            <XAxis
                                dataKey="date"
                                tickFormatter={formatDate}
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#9ca3af', fontSize: 12 }}
                            />
                            <YAxis
                                tickFormatter={(value) => `₹${value >= 1000 ? (value / 1000) + 'k' : value}`}
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#9ca3af', fontSize: 12 }}
                            />
                            <Tooltip
                                formatter={(value: any, name: any) => [
                                    formatCurrency(Number(value)),
                                    name === 'revenue' ? 'Revenue' : 'Profit'
                                ]}
                                labelFormatter={formatDate}
                                contentStyle={{ backgroundColor: '#1f2937', borderRadius: '12px', border: '1px solid #374151', color: '#f3f4f6' }}
                                itemStyle={{ color: '#e5e7eb' }}
                                labelStyle={{ color: '#9ca3af' }}
                            />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey="revenue"
                                name="revenue"
                                stroke="#3B82F6"
                                strokeWidth={3}
                                dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                                activeDot={{ r: 6, strokeWidth: 0 }}
                            />
                            <Line
                                type="monotone"
                                dataKey="profit"
                                name="profit"
                                stroke="#10B981"
                                strokeWidth={3}
                                dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                                activeDot={{ r: 6, strokeWidth: 0 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Order Status Distribution Pie Chart */}
            <div className="bg-dark-800 p-6 rounded-2xl shadow-sm border border-dark-700">
                <h3 className="text-lg font-bold text-white mb-6 font-display">Order Status Distribution</h3>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={statusDistribution}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="count"
                                nameKey="status"
                                fill="#8884d8"
                            >
                                {statusDistribution.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="#1f2937" strokeWidth={2} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1f2937', borderRadius: '12px', border: '1px solid #374151', color: '#f3f4f6' }}
                                itemStyle={{ color: '#e5e7eb' }}
                                formatter={(value: any) => [value, 'Orders']}
                            />
                            <Legend
                                verticalAlign="bottom"
                                height={36}
                                formatter={(value) => <span className="text-sm text-silver-400 capitalize">{value}</span>}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
