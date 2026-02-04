import { useState } from 'react';
import {
    FiShield, FiKey, FiFileText, FiUsers, FiCopy, FiPlus, FiTrash2,
    FiEye, FiEyeOff, FiCheck, FiX, FiAlertCircle, FiDownload
} from 'react-icons/fi';
import { User, UserRole, ApiKey, AuditLog, ROLE_PERMISSIONS } from '../types';

type SettingsTab = 'users' | 'api-keys' | 'audit-logs' | 'rbac';

// Mock data
const MOCK_USERS: User[] = [
    { id: 'u1', username: 'admin', email: 'admin@oran.org', role: 'Admin', permissions: ROLE_PERMISSIONS.Admin, createdAt: new Date('2025-01-01'), lastLogin: new Date() },
    { id: 'u2', username: 'operator1', email: 'operator@oran.org', role: 'Operator', permissions: ROLE_PERMISSIONS.Operator, createdAt: new Date('2025-01-15'), lastLogin: new Date(Date.now() - 86400000) },
    { id: 'u3', username: 'viewer1', email: 'viewer@oran.org', role: 'Viewer', permissions: ROLE_PERMISSIONS.Viewer, createdAt: new Date('2025-02-01'), lastLogin: new Date(Date.now() - 172800000) },
];

const MOCK_API_KEYS: ApiKey[] = [
    { id: 'k1', name: 'CI/CD Pipeline', key: 'rapp_sk_1a2b3c4d5e6f7g8h9i0j', role: 'Operator', createdBy: 'admin', createdAt: new Date('2025-01-10'), lastUsed: new Date(), isActive: true },
    { id: 'k2', name: 'Monitoring Script', key: 'rapp_sk_9i8h7g6f5e4d3c2b1a0j', role: 'Viewer', createdBy: 'admin', createdAt: new Date('2025-01-20'), lastUsed: new Date(Date.now() - 3600000), isActive: true },
    { id: 'k3', name: 'Legacy Integration', key: 'rapp_sk_zzz1234567890abcdef', role: 'Admin', createdBy: 'admin', createdAt: new Date('2024-12-01'), expiresAt: new Date('2025-01-01'), isActive: false },
];

const MOCK_AUDIT_LOGS: AuditLog[] = [
    { id: 'a1', timestamp: new Date(Date.now() - 300000), user: 'admin', role: 'Admin', action: 'upload_csar', resource: 'rApp', resourceId: 'rapp-energy', details: 'Uploaded energy-optimizer-v1.0.0.csar', success: true },
    { id: 'a2', timestamp: new Date(Date.now() - 600000), user: 'operator1', role: 'Operator', action: 'deploy', resource: 'rApp Instance', resourceId: 'rapp-energy-inst-1', details: 'Deployed to namespace: production', success: true },
    { id: 'a3', timestamp: new Date(Date.now() - 900000), user: 'operator1', role: 'Operator', action: 'prime', resource: 'rApp', resourceId: 'rapp-traffic', details: 'Primed rApp for deployment', success: true },
    { id: 'a4', timestamp: new Date(Date.now() - 1200000), user: 'admin', role: 'Admin', action: 'delete', resource: 'rApp', resourceId: 'rapp-old', details: 'Deleted deprecated rApp', success: true },
    { id: 'a5', timestamp: new Date(Date.now() - 1500000), user: 'operator1', role: 'Operator', action: 'deploy', resource: 'rApp Instance', resourceId: 'rapp-qos-inst-1', details: 'Deployment failed: Image pull error', success: false, errorMessage: 'ImagePullBackOff' },
    { id: 'a6', timestamp: new Date(Date.now() - 1800000), user: 'admin', role: 'Admin', action: 'rollback', resource: 'rApp Instance', resourceId: 'rapp-energy-inst-1', details: 'Rolled back to version 0.9.0', success: true },
    { id: 'a7', timestamp: new Date(Date.now() - 2100000), user: 'admin', role: 'Admin', action: 'create_api_key', resource: 'API Key', resourceId: 'k1', details: 'Created API key: CI/CD Pipeline', success: true },
];

export const Settings = () => {
    const [activeTab, setActiveTab] = useState<SettingsTab>('users');
    const [users, setUsers] = useState<User[]>(MOCK_USERS);
    const [apiKeys, setApiKeys] = useState<ApiKey[]>(MOCK_API_KEYS);
    const [auditLogs] = useState<AuditLog[]>(MOCK_AUDIT_LOGS);
    const [showNewKeyModal, setShowNewKeyModal] = useState(false);
    const [newKeyName, setNewKeyName] = useState('');
    const [newKeyRole, setNewKeyRole] = useState<UserRole>('Viewer');
    const [generatedKey, setGeneratedKey] = useState<string | null>(null);
    const [copiedKey, setCopiedKey] = useState(false);
    const [showKey, setShowKey] = useState<Record<string, boolean>>({});

    const currentUser: User = users[0]; // Simulate logged-in admin user

    const hasPermission = (resource: string, action: string) => {
        return currentUser.permissions.some(
            p => p.resource === resource && p.action === action
        );
    };

    const generateApiKey = () => {
        const key = `rapp_sk_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
        const newKey: ApiKey = {
            id: `k${apiKeys.length + 1}`,
            name: newKeyName,
            key,
            role: newKeyRole,
            createdBy: currentUser.username,
            createdAt: new Date(),
            isActive: true,
        };
        setApiKeys([...apiKeys, newKey]);
        setGeneratedKey(key);
        setNewKeyName('');
    };

    const revokeApiKey = (id: string) => {
        setApiKeys(apiKeys.map(k => k.id === id ? { ...k, isActive: false } : k));
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedKey(true);
        setTimeout(() => setCopiedKey(false), 2000);
    };

    const exportAuditLogs = () => {
        const csv = [
            ['Timestamp', 'User', 'Role', 'Action', 'Resource', 'Resource ID', 'Details', 'Success', 'Error'].join(','),
            ...auditLogs.map(log => [
                log.timestamp.toISOString(),
                log.user,
                log.role,
                log.action,
                log.resource,
                log.resourceId,
                `"${log.details}"`,
                log.success,
                log.errorMessage || ''
            ].join(','))
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-logs-${new Date().toISOString()}.csv`;
        a.click();
    };

    const getRoleBadgeClass = (role: UserRole) => {
        switch (role) {
            case 'Admin': return 'badge-error';
            case 'Operator': return 'badge-warning';
            case 'Viewer': return 'badge-info';
            default: return 'badge-secondary';
        }
    };

    const getActionBadgeClass = (action: string) => {
        switch (action) {
            case 'delete':
            case 'revoke_api_key':
                return 'badge-error';
            case 'deploy':
            case 'upload_csar':
            case 'create_api_key':
                return 'badge-success';
            case 'rollback':
                return 'badge-warning';
            default:
                return 'badge-info';
        }
    };

    return (
        <div className="p-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2 flex items-center" style={{ color: 'var(--text-primary)' }}>
                    <FiShield className="w-8 h-8 mr-3" />
                    Security & Access Control
                </h1>
                <p style={{ color: 'var(--text-muted)' }}>Manage users, roles, API keys, and audit logs</p>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 border-b mb-8" style={{ borderColor: 'var(--border-color)' }}>
                {[
                    { id: 'users', label: 'Users & Roles', icon: FiUsers },
                    { id: 'api-keys', label: 'API Keys', icon: FiKey },
                    { id: 'audit-logs', label: 'Audit Logs', icon: FiFileText },
                    { id: 'rbac', label: 'Permissions Matrix', icon: FiShield },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as SettingsTab)}
                        className={`flex items-center space-x-2 px-6 py-3 border-b-2 transition-colors ${activeTab === tab.id ? 'border-primary-600' : 'border-transparent hover:border-gray-600'
                            }`}
                        style={{ color: activeTab === tab.id ? '#2563eb' : 'var(--text-muted)' }}
                    >
                        <tab.icon className="w-5 h-5" />
                        <span className="font-medium">{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Users & Roles Tab */}
            {activeTab === 'users' && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>Users</h2>
                        {hasPermission('settings', 'update') && (
                            <button className="btn-primary flex items-center space-x-2">
                                <FiPlus className="w-4 h-4" />
                                <span>Add User</span>
                            </button>
                        )}
                    </div>

                    {users.map(user => (
                        <div key={user.id} className="card">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                        {user.username[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{user.username}</h3>
                                        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{user.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <div className="text-right">
                                        <span className={getRoleBadgeClass(user.role)}>{user.role}</span>
                                        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                                            Last login: {user.lastLogin?.toLocaleDateString()}
                                        </p>
                                    </div>
                                    {hasPermission('settings', 'update') && user.id !== currentUser.id && (
                                        <button className="btn-ghost p-2 text-red-400">
                                            <FiTrash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* API Keys Tab */}
            {activeTab === 'api-keys' && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>API Keys</h2>
                        {hasPermission('settings', 'update') && (
                            <button onClick={() => setShowNewKeyModal(true)} className="btn-primary flex items-center space-x-2">
                                <FiPlus className="w-4 h-4" />
                                <span>Generate API Key</span>
                            </button>
                        )}
                    </div>

                    {apiKeys.map(key => (
                        <div key={key.id} className="card">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex-1">
                                    <div className="flex items-center space-x-3 mb-2">
                                        <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{key.name}</h3>
                                        <span className={getRoleBadgeClass(key.role)}>{key.role}</span>
                                        {!key.isActive && <span className="badge-secondary">Revoked</span>}
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <code className="text-sm font-mono px-3 py-1 bg-dark-lighter rounded" style={{ color: 'var(--text-secondary)' }}>
                                            {showKey[key.id] ? key.key : '•'.repeat(30)}
                                        </code>
                                        <button
                                            onClick={() => setShowKey({ ...showKey, [key.id]: !showKey[key.id] })}
                                            className="btn-ghost p-1"
                                        >
                                            {showKey[key.id] ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                                        </button>
                                        <button onClick={() => copyToClipboard(key.key)} className="btn-ghost p-1">
                                            <FiCopy className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <div className="text-right text-xs" style={{ color: 'var(--text-muted)' }}>
                                        <p>Created: {key.createdAt.toLocaleDateString()}</p>
                                        <p>Last used: {key.lastUsed?.toLocaleTimeString() || 'Never'}</p>
                                        {key.expiresAt && <p className="text-yellow-400">Expires: {key.expiresAt.toLocaleDateString()}</p>}
                                    </div>
                                    {hasPermission('settings', 'update') && key.isActive && (
                                        <button onClick={() => revokeApiKey(key.id)} className="btn-ghost p-2 text-red-400">
                                            <FiTrash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Audit Logs Tab */}
            {activeTab === 'audit-logs' && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>Audit Trail</h2>
                        <button onClick={exportAuditLogs} className="btn-secondary flex items-center space-x-2">
                            <FiDownload className="w-4 h-4" />
                            <span>Export CSV</span>
                        </button>
                    </div>

                    <div className="space-y-2">
                        {auditLogs.map(log => (
                            <div key={log.id} className="card">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start space-x-3 flex-1">
                                        <div className={`p-2 rounded-lg ${log.success ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                                            {log.success ? (
                                                <FiCheck className="w-5 h-5 text-green-400" />
                                            ) : (
                                                <FiX className="w-5 h-5 text-red-400" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-2 mb-1">
                                                <span className={getActionBadgeClass(log.action)}>{log.action.replace(/_/g, ' ').toUpperCase()}</span>
                                                <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{log.resource}</span>
                                                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>({log.resourceId})</span>
                                            </div>
                                            <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>{log.details}</p>
                                            {!log.success && log.errorMessage && (
                                                <div className="flex items-center space-x-1 text-xs text-red-400">
                                                    <FiAlertCircle className="w-3 h-3" />
                                                    <span>{log.errorMessage}</span>
                                                </div>
                                            )}
                                            <div className="flex items-center space-x-3 text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                                                <span>{log.timestamp.toLocaleString()}</span>
                                                <span>•</span>
                                                <span>User: {log.user}</span>
                                                <span>•</span>
                                                <span className={getRoleBadgeClass(log.role)}>{log.role}</span>
                                                {log.ipAddress && (
                                                    <>
                                                        <span>•</span>
                                                        <span>IP: {log.ipAddress}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* RBAC Permissions Matrix Tab */}
            {activeTab === 'rbac' && (
                <div className="space-y-6">
                    <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>Role-Based Access Control Matrix</h2>

                    {Object.entries(ROLE_PERMISSIONS).map(([role, permissions]) => (
                        <div key={role} className="card">
                            <h3 className="text-lg font-semibold mb-4 flex items-center" style={{ color: 'var(--text-primary)' }}>
                                <span className={getRoleBadgeClass(role as UserRole)}>{role}</span>
                            </h3>

                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                {permissions.map((perm, idx) => (
                                    <div key={idx} className="flex items-center space-x-2 p-2 bg-dark-lighter rounded">
                                        <FiCheck className="w-4 h-4 text-green-400 flex-shrink-0" />
                                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                            {perm.action} <span style={{ color: 'var(--text-muted)' }}>{perm.resource}</span>
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* New API Key Modal */}
            {showNewKeyModal && (
                <div className="modal-backdrop animate-fade-in" onClick={() => setShowNewKeyModal(false)}>
                    <div className="modal-content animate-scale-in max-w-lg" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Generate API Key</h2>
                            <button onClick={() => setShowNewKeyModal(false)} className="btn-ghost p-2">
                                <FiX className="w-5 h-5" />
                            </button>
                        </div>

                        {!generatedKey ? (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                                        Key Name
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g., CI/CD Pipeline"
                                        value={newKeyName}
                                        onChange={(e) => setNewKeyName(e.target.value)}
                                        className="input"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                                        Role
                                    </label>
                                    <select
                                        value={newKeyRole}
                                        onChange={(e) => setNewKeyRole(e.target.value as UserRole)}
                                        className="input"
                                    >
                                        <option value="Viewer">Viewer (Read-only)</option>
                                        <option value="Operator">Operator (Deploy & Monitor)</option>
                                        <option value="Admin">Admin (Full Access)</option>
                                    </select>
                                </div>

                                <div className="mt-6 flex space-x-3">
                                    <button
                                        onClick={generateApiKey}
                                        disabled={!newKeyName}
                                        className="btn-primary flex-1 disabled:opacity-50"
                                    >
                                        Generate Key
                                    </button>
                                    <button onClick={() => setShowNewKeyModal(false)} className="btn-secondary flex-1">
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="bg-green-500/20 border border-green-500/30 text-green-400 px-4 py-3 rounded-lg">
                                    <p className="font-semibold mb-1">API Key Generated Successfully!</p>
                                    <p className="text-sm">Copy this key now. You won't be able to see it again.</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                                        Your API Key
                                    </label>
                                    <div className="flex items-center space-x-2">
                                        <code className="flex-1 text-sm font-mono px-3 py-2 bg-dark-lighter rounded" style={{ color: 'var(--text-primary)' }}>
                                            {generatedKey}
                                        </code>
                                        <button
                                            onClick={() => copyToClipboard(generatedKey)}
                                            className={`btn-secondary flex items-center space-x-2 ${copiedKey ? 'bg-green-600' : ''}`}
                                        >
                                            {copiedKey ? <FiCheck className="w-4 h-4" /> : <FiCopy className="w-4 h-4" />}
                                            <span>{copiedKey ? 'Copied!' : 'Copy'}</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="mt-6">
                                    <button
                                        onClick={() => { setGeneratedKey(null); setShowNewKeyModal(false); }}
                                        className="btn-primary w-full"
                                    >
                                        Done
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
