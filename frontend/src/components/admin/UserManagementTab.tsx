'use client';

import React, { useState } from 'react';
import { Users, Shield } from 'lucide-react';
import UsersTab from './UsersTab';
import RolesTab from './RolesTab';
import { useAuth } from '@/context/AuthContext';

export default function UserManagementTab() {
    const [activeSubTab, setActiveSubTab] = useState<'admins' | 'roles'>('admins');
    const { hasPermission } = useAuth();

    const canViewUsers = hasPermission('view_user');
    const canViewRoles = hasPermission('view_group');

    // Default to roles if users cannot be viewed
    React.useEffect(() => {
        if (!canViewUsers && canViewRoles) {
            setActiveSubTab('roles');
        }
    }, [canViewUsers, canViewRoles]);

    const tabs = [
        { id: 'admins', label: 'Admins', icon: Users, permission: 'view_user' },
        { id: 'roles', label: 'Roles & Permissions', icon: Shield, permission: 'view_group' },
    ].filter(tab => hasPermission(tab.permission));

    if (tabs.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 bg-white rounded-3xl border border-gray-100 shadow-sm">
                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
                    <Shield size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h3>
                <p className="text-gray-500">You don't have permission to manage users or roles.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex gap-2 border-b border-gray-200">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveSubTab(tab.id as any)}
                        className={`flex items-center gap-2 px-6 py-3 font-medium text-sm transition-colors relative ${activeSubTab === tab.id
                            ? 'text-primary-600'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <tab.icon size={18} />
                        {tab.label}
                        {activeSubTab === tab.id && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600" />
                        )}
                    </button>
                ))}
            </div>

            <div className="animate-fade-in">
                {activeSubTab === 'admins' && <UsersTab />}
                {activeSubTab === 'roles' && <RolesTab />}
            </div>
        </div>
    );
}
