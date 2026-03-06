'use client';

import { useAuth } from '@/context/AuthContext';
import OrdersTab from '@/components/admin/OrdersTab';

export default function PartnerOrdersPage() {
    const { token } = useAuth();

    if (!token) return null;

    // We reuse the OrdersTab component. 
    // The backend endpoint `/admin/orders/` will be updated to filter by the user's shop
    // so this component will naturally only show relevant orders.
    return (
        <OrdersTab />
    );
}
