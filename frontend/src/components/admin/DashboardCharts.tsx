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
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(value);
    };

    const formatAxisCurrency = (value: number) => {
        if (value >= 100000) return `${Math.round(value / 1000)}k`;
        if (value >= 1000) return `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}k`;
        return `${value}`;
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    };

    return (
        <div className="mb-8 grid min-w-0 grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2 lg:gap-8">
            <div className="min-w-0 rounded-2xl border border-dark-700 bg-dark-800 p-4 shadow-sm sm:p-6">
                <h3 className="mb-4 font-display text-base font-bold text-white sm:mb-6 sm:text-lg">
                    Revenue &amp; Profit Trend (Last 7 Days)
                </h3>
                <div className="h-[240px] w-full sm:h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={revenueHistory} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1f2937" />
                            <XAxis
                                dataKey="date"
                                tickFormatter={formatDate}
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#9ca3af', fontSize: 12 }}
                            />
                            <YAxis
                                tickFormatter={formatAxisCurrency}
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#9ca3af', fontSize: 12 }}
                                width={48}
                            />
                            <Tooltip
                                formatter={(value: number | string | undefined, name: string | undefined) => [
                                    formatCurrency(Number(value)),
                                    name === 'revenue' ? 'Revenue' : 'Profit'
                                ]}
                                labelFormatter={formatDate}
                                contentStyle={{
                                    backgroundColor: '#1f2937',
                                    borderRadius: '12px',
                                    border: '1px solid #374151',
                                    color: '#f3f4f6'
                                }}
                                itemStyle={{ color: '#e5e7eb' }}
                                labelStyle={{ color: '#9ca3af' }}
                            />
                            <Legend wrapperStyle={{ paddingTop: 12 }} />
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

            <div className="min-w-0 rounded-2xl border border-dark-700 bg-dark-800 p-4 shadow-sm sm:p-6">
                <h3 className="mb-4 font-display text-base font-bold text-white sm:mb-6 sm:text-lg">
                    Order Status Distribution
                </h3>
                <div className="h-[240px] w-full sm:h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={statusDistribution}
                                cx="50%"
                                cy="45%"
                                innerRadius={50}
                                outerRadius={76}
                                paddingAngle={5}
                                dataKey="count"
                                nameKey="status"
                                fill="#8884d8"
                            >
                                {statusDistribution.map((entry, index) => (
                                    <Cell key={`${entry.status}-${index}`} fill={COLORS[index % COLORS.length]} stroke="#1f2937" strokeWidth={2} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#1f2937',
                                    borderRadius: '12px',
                                    border: '1px solid #374151',
                                    color: '#f3f4f6'
                                }}
                                itemStyle={{ color: '#e5e7eb' }}
                                formatter={(value: number | string | undefined) => [value, 'Orders']}
                            />
                            <Legend
                                verticalAlign="bottom"
                                height={48}
                                wrapperStyle={{ paddingTop: 12 }}
                                formatter={(value) => <span className="text-sm capitalize text-silver-400">{value}</span>}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
