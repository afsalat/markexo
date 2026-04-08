'use client';

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    ComposedChart,
    Legend,
    Line,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { fetchAdminAnalytics } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

type AnalyticsProduct = {
    id: number;
    name: string;
    views: number;
    sold_count: number;
    current_price: number | string;
    category_details?: {
        name?: string;
    } | null;
};

type PartnerRevenuePoint = {
    month: string;
    revenue: number;
};

type PartnerPayoutPoint = {
    name: string;
    amount: number;
};

type TopPartner = {
    name: string;
    email: string;
    total_payout: number;
};

type AdminAnalyticsResponse = {
    most_clicked: AnalyticsProduct[];
    most_ordered: AnalyticsProduct[];
    less_performed: AnalyticsProduct[];
    partner_payouts: PartnerPayoutPoint[];
    partner_revenue: PartnerRevenuePoint[];
    top_partners: TopPartner[];
};

function formatCurrency(value: number) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(value);
}

function formatCompactNumber(value: number) {
    return new Intl.NumberFormat('en-IN', {
        notation: 'compact',
        maximumFractionDigits: 1,
    }).format(value);
}

function truncateLabel(value: string, maxLength = 22) {
    if (value.length <= maxLength) {
        return value;
    }

    return `${value.slice(0, maxLength - 3)}...`;
}

function EmptyChartState({ message }: { message: string }) {
    return (
        <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-dark-600 bg-dark-900/40 px-6 text-center text-sm text-silver-500">
            {message}
        </div>
    );
}

function ProductTooltip({ active, payload }: any) {
    if (!active || !payload?.length) {
        return null;
    }

    const item = payload[0]?.payload;

    return (
        <div className="rounded-xl border border-dark-600 bg-dark-900/95 p-3 text-sm shadow-xl">
            <p className="mb-2 max-w-[260px] font-medium text-white">{item?.name}</p>
            {payload.map((entry: any) => (
                <div key={entry.dataKey} className="flex items-center justify-between gap-4 text-silver-300">
                    <span>{entry.name}</span>
                    <span className="font-semibold text-white">
                        {entry.dataKey === 'amount' || entry.dataKey === 'revenue'
                            ? formatCurrency(Number(entry.value) || 0)
                            : Number(entry.value || 0).toLocaleString('en-IN')}
                    </span>
                </div>
            ))}
        </div>
    );
}

function RevenueTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) {
        return null;
    }

    return (
        <div className="rounded-xl border border-dark-600 bg-dark-900/95 p-3 text-sm shadow-xl">
            <p className="mb-2 font-medium text-white">{label}</p>
            <div className="flex items-center justify-between gap-4 text-silver-300">
                <span>Revenue</span>
                <span className="font-semibold text-white">{formatCurrency(Number(payload[0]?.value) || 0)}</span>
            </div>
        </div>
    );
}

function ChartCard({
    title,
    description,
    children,
}: {
    title: string;
    description?: string;
    children: ReactNode;
}) {
    return (
        <div className="min-w-0 rounded-2xl border border-dark-700 bg-dark-800 p-6 shadow-sm">
            <div className="mb-5">
                <h3 className="text-lg font-semibold text-white">{title}</h3>
                {description ? <p className="mt-1 text-sm text-silver-500">{description}</p> : null}
            </div>
            <div className="h-[320px]">{children}</div>
        </div>
    );
}

export default function ProductAnalyticsTab() {
    const { token } = useAuth();
    const [data, setData] = useState<AdminAnalyticsResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!token) {
            setError('No authentication token found');
            setLoading(false);
            return;
        }

        fetchAdminAnalytics(token)
            .then((response) => {
                setData(response);
                setLoading(false);
            })
            .catch((err) => {
                setError(err.message);
                setLoading(false);
            });
    }, [token]);

    if (loading) {
        return <div className="py-10 text-center text-silver-500">Loading analytics...</div>;
    }

    if (error) {
        return <div className="py-10 text-center text-red-500">Error loading analytics: {error}</div>;
    }

    const mostClicked = (data?.most_clicked ?? []).map((product) => ({
        ...product,
        shortName: truncateLabel(product.name, 26),
    })).map((product, index) => ({
        ...product,
        rankLabel: `#${index + 1}`,
    }));

    const mostOrdered = (data?.most_ordered ?? []).map((product) => ({
        ...product,
        shortName: truncateLabel(product.name, 26),
    })).map((product, index) => ({
        ...product,
        rankLabel: `#${index + 1}`,
    }));

    const combinedPerformance = Array.from(
        new Map(
            [...(data?.most_clicked ?? []), ...(data?.most_ordered ?? [])].map((product) => [
                product.id,
                {
                    id: product.id,
                    name: product.name,
                    shortName: truncateLabel(product.name, 18),
                    views: product.views ?? 0,
                    sold_count: product.sold_count ?? 0,
                    rankLabel: '',
                },
            ])
        ).values()
    )
        .sort((left, right) => (right.views + right.sold_count * 8) - (left.views + left.sold_count * 8))
        .slice(0, 6)
        .map((product, index) => ({
            ...product,
            rankLabel: `#${index + 1}`,
        }));

    const partnerRevenue = data?.partner_revenue ?? [];
    const partnerPayouts = (data?.partner_payouts ?? []).map((partner) => ({
        ...partner,
        shortName: truncateLabel(partner.name, 22),
    }));

    const lessPerformed = data?.less_performed ?? [];
    const topPartners = data?.top_partners ?? [];

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h2 className="text-2xl font-bold text-white">Product Analytics</h2>
                <p className="mt-2 text-sm text-silver-500">
                    Better visibility for product visits, orders, revenue, and partner payouts.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <ChartCard
                    title="Product Visit Count"
                    description="Top products ranked by page visits."
                >
                    {mostClicked.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={mostClicked}
                                layout="vertical"
                                margin={{ top: 4, right: 18, left: 12, bottom: 4 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#243041" />
                                <XAxis
                                    type="number"
                                    stroke="#94a3b8"
                                    axisLine={false}
                                    tickLine={false}
                                    tickFormatter={formatCompactNumber}
                                />
                                <YAxis
                                    type="category"
                                    dataKey="rankLabel"
                                    stroke="#94a3b8"
                                    axisLine={false}
                                    tickLine={false}
                                    width={8}
                                    tick={false}
                                />
                                <Tooltip content={<ProductTooltip />} cursor={{ fill: 'rgba(139, 92, 246, 0.08)' }} />
                                <Bar dataKey="views" name="Visits" fill="#8b5cf6" radius={[0, 10, 10, 0]} barSize={18} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <EmptyChartState message="No product visit data is available yet." />
                    )}
                </ChartCard>

                <ChartCard
                    title="Most Ordered Products"
                    description="Top products by confirmed sales quantity."
                >
                    {mostOrdered.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={mostOrdered}
                                layout="vertical"
                                margin={{ top: 4, right: 18, left: 12, bottom: 4 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#243041" />
                                <XAxis
                                    type="number"
                                    stroke="#94a3b8"
                                    axisLine={false}
                                    tickLine={false}
                                    allowDecimals={false}
                                />
                                <YAxis
                                    type="category"
                                    dataKey="rankLabel"
                                    stroke="#94a3b8"
                                    axisLine={false}
                                    tickLine={false}
                                    width={8}
                                    tick={false}
                                />
                                <Tooltip content={<ProductTooltip />} cursor={{ fill: 'rgba(16, 185, 129, 0.08)' }} />
                                <Bar dataKey="sold_count" name="Orders" fill="#10b981" radius={[0, 10, 10, 0]} barSize={18} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <EmptyChartState message="No order data is available yet." />
                    )}
                </ChartCard>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <ChartCard
                    title="Product Reach vs Orders"
                    description="Compare visits against confirmed orders for the strongest products."
                >
                    {combinedPerformance.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={combinedPerformance} margin={{ top: 4, right: 16, left: 0, bottom: 8 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#243041" />
                                <XAxis
                                    dataKey="rankLabel"
                                    stroke="#94a3b8"
                                    axisLine={false}
                                    tickLine={false}
                                    interval={0}
                                    height={8}
                                    tick={false}
                                />
                                <YAxis
                                    yAxisId="left"
                                    stroke="#94a3b8"
                                    axisLine={false}
                                    tickLine={false}
                                    tickFormatter={formatCompactNumber}
                                />
                                <YAxis
                                    yAxisId="right"
                                    orientation="right"
                                    stroke="#94a3b8"
                                    axisLine={false}
                                    tickLine={false}
                                    allowDecimals={false}
                                />
                                <Tooltip content={<ProductTooltip />} />
                                <Legend wrapperStyle={{ paddingTop: 8 }} />
                                <Bar yAxisId="left" dataKey="views" name="Visits" fill="#6366f1" radius={[10, 10, 0, 0]} barSize={26} />
                                <Line yAxisId="right" type="monotone" dataKey="sold_count" name="Orders" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, fill: '#f59e0b' }} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    ) : (
                        <EmptyChartState message="There is not enough product data to compare visits and orders." />
                    )}
                </ChartCard>

                <ChartCard
                    title="Partner Revenue Trend"
                    description="Revenue contribution over the last 6 months."
                >
                    {partnerRevenue.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={partnerRevenue} margin={{ top: 4, right: 12, left: 0, bottom: 8 }}>
                                <defs>
                                    <linearGradient id="partnerRevenueGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.45} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#243041" />
                                <XAxis
                                    dataKey="month"
                                    stroke="#94a3b8"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12 }}
                                />
                                <YAxis
                                    stroke="#94a3b8"
                                    axisLine={false}
                                    tickLine={false}
                                    tickFormatter={formatCompactNumber}
                                />
                                <Tooltip content={<RevenueTooltip />} />
                                <Area
                                    type="monotone"
                                    dataKey="revenue"
                                    name="Revenue"
                                    stroke="#3b82f6"
                                    strokeWidth={3}
                                    fill="url(#partnerRevenueGradient)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <EmptyChartState message="No partner revenue data is available yet." />
                    )}
                </ChartCard>
            </div>

            <ChartCard
                title="Partner Payouts"
                description="Top paid partners ranked by total payout."
            >
                {partnerPayouts.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={partnerPayouts}
                            layout="vertical"
                            margin={{ top: 4, right: 18, left: 12, bottom: 4 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#243041" />
                            <XAxis
                                type="number"
                                stroke="#94a3b8"
                                axisLine={false}
                                tickLine={false}
                                tickFormatter={formatCompactNumber}
                            />
                            <YAxis
                                type="category"
                                dataKey="shortName"
                                stroke="#94a3b8"
                                axisLine={false}
                                tickLine={false}
                                width={170}
                                tick={{ fontSize: 12 }}
                            />
                            <Tooltip content={<ProductTooltip />} cursor={{ fill: 'rgba(245, 158, 11, 0.08)' }} />
                            <Bar dataKey="amount" name="Payout" fill="#f59e0b" radius={[0, 10, 10, 0]} barSize={18} />
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <EmptyChartState message="No partner payout data is available yet." />
                )}
            </ChartCard>

            <div className="overflow-hidden rounded-2xl border border-dark-700 bg-dark-800 shadow-sm">
                <div className="border-b border-dark-700 p-6">
                    <h3 className="text-lg font-semibold text-white">Less Performed Products</h3>
                    <p className="text-sm text-silver-500">
                        Products with the lowest sales and visits that may need attention.
                    </p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-silver-400">
                        <thead className="bg-dark-900/50 text-xs font-medium uppercase text-silver-500">
                            <tr>
                                <th className="px-6 py-4">Product</th>
                                <th className="px-6 py-4">Category</th>
                                <th className="px-6 py-4 text-center">Visits</th>
                                <th className="px-6 py-4 text-center">Orders</th>
                                <th className="px-6 py-4 text-right">Price</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-dark-700">
                            {lessPerformed.length > 0 ? (
                                lessPerformed.map((product) => (
                                    <tr key={product.id} className="transition-colors hover:bg-dark-700/50">
                                        <td className="px-6 py-4 font-medium text-white">{product.name}</td>
                                        <td className="px-6 py-4">{product.category_details?.name || 'N/A'}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="inline-flex items-center rounded-md bg-dark-700 px-2 py-1 text-xs text-silver-300">
                                                {(product.views ?? 0).toLocaleString('en-IN')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="inline-flex items-center rounded-md bg-dark-700 px-2 py-1 text-xs text-silver-300">
                                                {(product.sold_count ?? 0).toLocaleString('en-IN')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {formatCurrency(Number(product.current_price) || 0)}
                                        </td>
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

            <div className="overflow-hidden rounded-2xl border border-dark-700 bg-dark-800 shadow-sm">
                <div className="border-b border-dark-700 p-6">
                    <h3 className="text-lg font-semibold text-white">Top Performing Partners</h3>
                    <p className="text-sm text-silver-500">Partners with the highest total paid payouts.</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-silver-400">
                        <thead className="bg-dark-900/50 text-xs font-medium uppercase text-silver-500">
                            <tr>
                                <th className="px-6 py-4">Partner</th>
                                <th className="px-6 py-4">Owner Email</th>
                                <th className="px-6 py-4 text-right">Total Payout</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-dark-700">
                            {topPartners.length > 0 ? (
                                topPartners.map((partner, index) => (
                                    <tr key={`${partner.email}-${index}`} className="transition-colors hover:bg-dark-700/50">
                                        <td className="px-6 py-4 font-medium text-white">{partner.name}</td>
                                        <td className="px-6 py-4">{partner.email}</td>
                                        <td className="px-6 py-4 text-right font-bold text-emerald-400">
                                            {formatCurrency(partner.total_payout)}
                                        </td>
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
