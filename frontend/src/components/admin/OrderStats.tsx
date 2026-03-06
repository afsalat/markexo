'use client';

import { Package, Clock, CheckCircle, Truck, MapPin, XCircle, RotateCcw, DollarSign } from 'lucide-react';

interface OrderStatsProps {
    stats: {
        total: number;
        pending: number;
        confirmed: number;
        shipped: number;
        delivered: number;
        cancelled: number;
        returned: number;
        revenue: number;
    };
    onStatusClick?: (status: string) => void;
}

export default function OrderStats({ stats, onStatusClick }: OrderStatsProps) {
    const statCards = [
        {
            label: 'Total Orders',
            value: stats.total,
            icon: Package,
            color: 'bg-gradient-to-br from-purple-500 to-purple-600',
            lightBg: 'bg-purple-50',
            textColor: 'text-purple-600',
            status: ''
        },
        {
            label: 'Pending',
            value: stats.pending,
            icon: Clock,
            color: 'bg-gradient-to-br from-yellow-500 to-yellow-600',
            lightBg: 'bg-yellow-50',
            textColor: 'text-yellow-600',
            status: 'pending_verification'
        },
        {
            label: 'Confirmed',
            value: stats.confirmed,
            icon: CheckCircle,
            color: 'bg-gradient-to-br from-blue-500 to-blue-600',
            lightBg: 'bg-blue-50',
            textColor: 'text-blue-600',
            status: 'confirmed'
        },
        {
            label: 'Shipped',
            value: stats.shipped,
            icon: Truck,
            color: 'bg-gradient-to-br from-cyan-500 to-cyan-600',
            lightBg: 'bg-cyan-50',
            textColor: 'text-cyan-600',
            status: 'shipped'
        },
        {
            label: 'Delivered',
            value: stats.delivered,
            icon: MapPin,
            color: 'bg-gradient-to-br from-green-500 to-green-600',
            lightBg: 'bg-green-50',
            textColor: 'text-green-600',
            status: 'delivered'
        },
        {
            label: 'Cancelled',
            value: stats.cancelled,
            icon: XCircle,
            color: 'bg-gradient-to-br from-red-500 to-red-600',
            lightBg: 'bg-red-50',
            textColor: 'text-red-600',
            status: 'cancelled'
        },
        {
            label: 'Returned',
            value: stats.returned,
            icon: RotateCcw,
            color: 'bg-gradient-to-br from-orange-500 to-orange-600',
            lightBg: 'bg-orange-50',
            textColor: 'text-orange-600',
            status: 'returned'
        },
        {
            label: 'Total Revenue',
            value: `₹${(stats.revenue / 1000).toFixed(1)}k`,
            icon: DollarSign,
            color: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
            lightBg: 'bg-emerald-50',
            textColor: 'text-emerald-600',
            status: ''
        }
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-6">
            {statCards.map((card, index) => (
                <div
                    key={index}
                    onClick={() => card.status && onStatusClick?.(card.status)}
                    className={`bg-dark-800 rounded-xl border border-dark-700 p-4 shadow-sm hover:shadow-md transition-all duration-300 ${card.status ? 'cursor-pointer hover:border-accent-500/30' : ''}`}
                >
                    <div className="flex items-center justify-between mb-3">
                        <div className={`w-10 h-10 rounded-lg ${card.color} flex items-center justify-center shadow-lg`}>
                            <card.icon className="text-white" size={20} />
                        </div>
                    </div>
                    <div>
                        <p className="text-xs text-silver-500 font-medium mb-1">{card.label}</p>
                        <p className={`text-2xl font-bold ${card.textColor}`}>
                            {typeof card.value === 'number' ? card.value : card.value}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
}
