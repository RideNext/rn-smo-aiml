import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    FiActivity, FiCpu, FiHardDrive, FiServer, FiAlertTriangle,
    FiCheckCircle, FiFileText, FiFilter, FiRefreshCw, FiSearch,
    FiXCircle, FiZap, FiDatabase, FiGitBranch, FiBell, FiX
} from 'react-icons/fi';
import { rappApi } from '../api/rappApi';
import { Rapp } from '../types';

type MonitoringTab = 'health' | 'logs' | 'tracing' | 'alerts';
type LogSeverity = 'all' | 'INFO' | 'WARN' | 'ERROR';

interface PodMetrics {
    name: string;
    status: 'Running' | 'Pending' | 'Failed' | 'CrashLoopBackOff';
    cpu: number;
    memory: number;
    gpu?: number;
    restarts: number;
    uptime: string;
}

interface RequestMetrics {
    total: number;
    successful: number;
    failed: number;
    avgResponseTime: number;
    requestsPerSecond: number;
}

interface SKAdHealth {
    connected: boolean;
    producersCount: number;
    consumersCount: number;
    lastSync: Date;
    status: 'healthy' | 'degraded' | 'disconnected';
}

interface LogEntry {
    id: string;
    timestamp: Date;
    severity: 'INFO' | 'WARN' | 'ERROR';
    container: string;
    message: string;
    source: string;
}

interface TraceSpan {
    id: string;
    name: string;
    type: 'R1' | 'SME' | 'A1';
    duration: number;
    status: 'success' | 'error';
    timestamp: Date;
    details: string;
}

interface Alert {
    id: string;
    type: 'deployment' | 'response' | 'policy' | 'connection';
    severity: 'critical' | 'warning' | 'info';
    title: string;
    message: string;
    timestamp: Date;
    rappId?: string;
    resolved: boolean;
}

// Mock data generators
const generatePodMetrics = (): PodMetrics[] => [
    { name: 'rapp-energy-0', status: 'Running', cpu: 45, memory: 68, restarts: 0, uptime: '3d 14h' },
    { name: 'rapp-energy-1', status: 'Running', cpu: 52, memory: 71, restarts: 0, uptime: '3d 14h' },
    { name: 'rapp-optimizer-0', status: 'Running', cpu: 38, memory: 55, gpu: 15, restarts: 1, uptime: '2d 8h' },
    { name: 'rapp-traffic-0', status: 'CrashLoopBackOff', cpu: 5, memory: 12, restarts: 15, uptime: '45m' },
];

const generateRequestMetrics = (): RequestMetrics => ({
    total: 125847,
    successful: 124932,
    failed: 915,
    avgResponseTime: 47,
    requestsPerSecond: 23.4,
});

const generateSKAdHealth = (): SKAdHealth => ({
    connected: true,
    producersCount: 3,
    consumersCount: 2,
    lastSync: new Date(),
    status: 'healthy',
});

const generateLogs = (): LogEntry[] => [
    { id: '1', timestamp: new Date(Date.now() - 1000), severity: 'INFO', container: 'rapp-energy-0', message: 'Processing PM data batch #1523', source: 'app' },
    { id: '2', timestamp: new Date(Date.now() - 5000), severity: 'INFO', container: 'rapp-energy-1', message: 'Energy optimization policy applied successfully', source: 'app' },
    { id: '3', timestamp: new Date(Date.now() - 8000), severity: 'WARN', container: 'rapp-optimizer-0', message: 'High memory usage detected: 85%', source: 'system' },
    { id: '4', timestamp: new Date(Date.now() - 12000), severity: 'ERROR', container: 'rapp-traffic-0', message: 'Failed to connect to A1 policy management service', source: 'network' },
    { id: '5', timestamp: new Date(Date.now() - 15000), severity: 'ERROR', container: 'rapp-traffic-0', message: 'Container restarting due to unhandled exception', source: 'runtime' },
    { id: '6', timestamp: new Date(Date.now() - 20000), severity: 'INFO', container: 'rapp-energy-0', message: 'DME connection established with 3 producers', source: 'dme' },
    { id: '7', timestamp: new Date(Date.now() - 25000), severity: 'WARN', container: 'rapp-optimizer-0', message: 'GPU utilization below threshold', source: 'metrics' },
];

const generateTraces = (): TraceSpan[] => [
    { id: 't1', name: 'PM Data Query', type: 'R1', duration: 42, status: 'success', timestamp: new Date(Date.now() - 2000), details: 'Retrieved 1500 metrics from RAN' },
    { id: 't2', name: 'Config Update Call', type: 'SME', duration: 125, status: 'success', timestamp: new Date(Date.now() - 5000), details: 'Updated cell configuration via northbound API' },
    { id: 't3', name: 'Energy Policy Apply', type: 'A1', duration: 89, status: 'success', timestamp: new Date(Date.now() - 8000), details: 'Applied energy saving policy to 5 cells' },
    { id: 't4', name: 'Traffic Policy Apply', type: 'A1', duration: 1523, status: 'error', timestamp: new Date(Date.now() - 12000), details: 'Policy rejected: Invalid schema version' },
    { id: 't5', name: 'Cell Status Query', type: 'R1', duration: 38, status: 'success', timestamp: new Date(Date.now() - 15000), details: 'Retrieved status for 10 cells' },
];

const generateAlerts = (): Alert[] => [
    {
        id: 'a1',
        type: 'deployment',
        severity: 'critical',
        title: 'Deployment Failed',
        message: 'rApp "traffic-optimizer" failed to deploy: Image pull error',
        timestamp: new Date(Date.now() - 300000),
        rappId: 'rapp-traffic',
        resolved: false,
    },
    {
        id: 'a2',
        type: 'response',
        severity: 'warning',
        title: 'Invalid Response',
        message: 'rApp "energy-saver" sending malformed JSON responses',
        timestamp: new Date(Date.now() - 600000),
        rappId: 'rapp-energy',
        resolved: false,
    },
    {
        id: 'a3',
        type: 'policy',
        severity: 'warning',
        title: 'A1 Policy Rejected',
        message: 'Policy instance rejected: Schema validation failed',
        timestamp: new Date(Date.now() - 900000),
        resolved: false,
    },
    {
        id: 'a4',
        type: 'connection',
        severity: 'critical',
        title: 'DME Connection Lost',
        message: 'Lost connection to Information Coordinator Service',
        timestamp: new Date(Date.now() - 1200000),
        resolved: true,
    },
];

export const Monitoring = () => {
    const [activeTab, setActiveTab] = useState<MonitoringTab>('health');
    const [selectedRapp, setSelectedRapp] = useState<string>('all');
    const [logSeverity, setLogSeverity] = useState<LogSeverity>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [podMetrics, setPodMetrics] = useState<PodMetrics[]>([]);
    const [requestMetrics, setRequestMetrics] = useState<RequestMetrics | null>(null);
    const [skadHealth, setSkadHealth] = useState<SKAdHealth | null>(null);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [traces, setTraces] = useState<TraceSpan[]>([]);
    const [alerts, setAlerts] = useState<Alert[]>([]);

    const { data: rapps } = useQuery<Rapp[]>({
        queryKey: ['rapps'],
        queryFn: async () => (await rappApi.getRapps()).data,
    });

    // Simulate real-time updates
    useEffect(() => {
        const loadData = () => {
            setPodMetrics(generatePodMetrics());
            setRequestMetrics(generateRequestMetrics());
            setSkadHealth(generateSKAdHealth());
            setLogs(generateLogs());
            setTraces(generateTraces());
            setAlerts(generateAlerts());
        };

        loadData();

        if (autoRefresh) {
            const interval = setInterval(loadData, 5000);
            return () => clearInterval(interval);
        }
    }, [autoRefresh]);

    const filteredLogs = logs.filter(log => {
        const matchesSeverity = logSeverity === 'all' || log.severity === logSeverity;
        const matchesSearch = log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
            log.container.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSeverity && matchesSearch;
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Running': case 'healthy': case 'success': return 'text-green-400';
            case 'Pending': case 'degraded': case 'warning': return 'text-yellow-400';
            case 'Failed': case 'CrashLoopBackOff': case 'disconnected': case 'error': return 'text-red-400';
            default: return 'text-gray-400';
        }
    };

    const getSeverityBadge = (severity: string) => {
        const badges: Record<string, string> = {
            INFO: 'badge-info',
            WARN: 'badge-warning',
            ERROR: 'badge-error',
            critical: 'badge-error',
            warning: 'badge-warning',
            info: 'badge-info',
        };
        return badges[severity] || 'badge-secondary';
    };

    return (
        <div className="p-8">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-3xl font-bold mb-2 flex items-center" style={{ color: 'var(--text-primary)' }}>
                            <FiActivity className="w-8 h-8 mr-3" />
                            Monitoring & Observability
                        </h1>
                        <p style={{ color: 'var(--text-muted)' }}>Operator-grade monitoring for all rApp instances</p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={autoRefresh}
                                onChange={(e) => setAutoRefresh(e.target.checked)}
                                className="w-4 h-4"
                            />
                            <span style={{ color: 'var(--text-secondary)' }}>Auto-refresh (5s)</span>
                        </label>
                        <button className="btn-secondary flex items-center space-x-2">
                            <FiRefreshCw className="w-4 h-4" />
                            <span>Refresh</span>
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex space-x-1 border-b" style={{ borderColor: 'var(--border-color)' }}>
                    {[
                        { id: 'health', label: 'Health Dashboard', icon: FiActivity },
                        { id: 'logs', label: 'Logs', icon: FiFileText },
                        { id: 'tracing', label: 'Tracing', icon: FiZap },
                        { id: 'alerts', label: 'Alerts', icon: FiBell },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as MonitoringTab)}
                            className={`flex items-center space-x-2 px-6 py-3 border-b-2 transition-colors ${activeTab === tab.id
                                    ? 'border-primary-600'
                                    : 'border-transparent hover:border-gray-600'
                                }`}
                            style={{ color: activeTab === tab.id ? '#2563eb' : 'var(--text-muted)' }}
                        >
                            <tab.icon className="w-5 h-5" />
                            <span className="font-medium">{tab.label}</span>
                            {tab.id === 'alerts' && alerts.filter(a => !a.resolved).length > 0 && (
                                <span className="badge-error text-xs">{alerts.filter(a => !a.resolved).length}</span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div>
                {/* Health Dashboard Tab */}
                {activeTab === 'health' && (
                    <div className="space-y-6">
                        {/* Pod Status */}
                        <div className="card">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-semibold flex items-center" style={{ color: 'var(--text-primary)' }}>
                                    <FiServer className="w-5 h-5 mr-2" />
                                    Pod Status
                                </h2>
                                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                                    {podMetrics.filter(p => p.status === 'Running').length} / {podMetrics.length} Running
                                </span>
                            </div>
                            <div className="space-y-3">
                                {podMetrics.map(pod => (
                                    <div key={pod.name} className="card p-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center space-x-3">
                                                <div className={`p-2 rounded-lg ${pod.status === 'Running' ? 'bg-green-500/20' :
                                                        pod.status === 'Pending' ? 'bg-yellow-500/20' :
                                                            'bg-red-500/20'
                                                    }`}>
                                                    {pod.status === 'Running' ? (
                                                        <FiCheckCircle className="w-5 h-5 text-green-400" />
                                                    ) : (
                                                        <FiXCircle className="w-5 h-5 text-red-400" />
                                                    )}
                                                </div>
                                                <div>
                                                    <h3 className="font-medium" style={{ color: 'var(--text-primary)' }}>{pod.name}</h3>
                                                    <span className={`text-sm ${getStatusColor(pod.status)}`}>{pod.status}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-4 text-sm">
                                                <div className="text-right">
                                                    <p style={{ color: 'var(--text-muted)' }}>Uptime</p>
                                                    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{pod.uptime}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p style={{ color: 'var(--text-muted)' }}>Restarts</p>
                                                    <p className={`font-medium ${pod.restarts > 0 ? 'text-yellow-400' : 'text-green-400'}`}>
                                                        {pod.restarts}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Metrics */}
                                        <div className="grid grid-cols-3 gap-4">
                                            <div>
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-sm" style={{ color: 'var(--text-muted)' }}>CPU</span>
                                                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{pod.cpu}%</span>
                                                </div>
                                                <div className="w-full bg-dark-lighter rounded-full h-2">
                                                    <div
                                                        className={`h-2 rounded-full ${pod.cpu > 80 ? 'bg-red-500' : pod.cpu > 60 ? 'bg-yellow-500' : 'bg-green-500'}`}
                                                        style={{ width: `${pod.cpu}%` }}
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Memory</span>
                                                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{pod.memory}%</span>
                                                </div>
                                                <div className="w-full bg-dark-lighter rounded-full h-2">
                                                    <div
                                                        className={`h-2 rounded-full ${pod.memory > 80 ? 'bg-red-500' : pod.memory > 60 ? 'bg-yellow-500' : 'bg-blue-500'}`}
                                                        style={{ width: `${pod.memory}%` }}
                                                    />
                                                </div>
                                            </div>
                                            {pod.gpu !== undefined && (
                                                <div>
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-sm" style={{ color: 'var(--text-muted)' }}>GPU</span>
                                                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{pod.gpu}%</span>
                                                    </div>
                                                    <div className="w-full bg-dark-lighter rounded-full h-2">
                                                        <div
                                                            className="h-2 rounded-full bg-purple-500"
                                                            style={{ width: `${pod.gpu}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Request Metrics */}
                        {requestMetrics && (
                            <div className="card">
                                <h2 className="text-xl font-semibold mb-4 flex items-center" style={{ color: 'var(--text-primary)' }}>
                                    <FiActivity className="w-5 h-5 mr-2" />
                                    Requests & Sessions
                                </h2>
                                <div className="grid grid-cols-5 gap-4">
                                    <div className="card text-center">
                                        <p className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>Total</p>
                                        <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                                            {requestMetrics.total.toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="card text-center">
                                        <p className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>Successful</p>
                                        <p className="text-2xl font-bold text-green-400">
                                            {requestMetrics.successful.toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="card text-center">
                                        <p className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>Failed</p>
                                        <p className="text-2xl font-bold text-red-400">
                                            {requestMetrics.failed.toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="card text-center">
                                        <p className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>Avg Response</p>
                                        <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                                            {requestMetrics.avgResponseTime}ms
                                        </p>
                                    </div>
                                    <div className="card text-center">
                                        <p className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>Req/s</p>
                                        <p className="text-2xl font-bold text-blue-400">
                                            {requestMetrics.requestsPerSecond}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* SKAd Health */}
                        {skadHealth && (
                            <div className="card">
                                <h2 className="text-xl font-semibold mb-4 flex items-center" style={{ color: 'var(--text-primary)' }}>
                                    <FiDatabase className="w-5 h-5 mr-2" />
                                    DME (SKAd) Health
                                </h2>
                                <div className="grid grid-cols-4 gap-4">
                                    <div className="card">
                                        <div className="flex items-center space-x-2 mb-2">
                                            <div className={`w-3 h-3 rounded-full ${skadHealth.connected ? 'bg-green-500' : 'bg-red-500'
                                                }`} />
                                            <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Connection</span>
                                        </div>
                                        <p className={`text-lg font-bold ${getStatusColor(skadHealth.status)}`}>
                                            {skadHealth.status.toUpperCase()}
                                        </p>
                                    </div>
                                    <div className="card">
                                        <p className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>Producers</p>
                                        <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                                            {skadHealth.producersCount}
                                        </p>
                                    </div>
                                    <div className="card">
                                        <p className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>Consumers</p>
                                        <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                                            {skadHealth.consumersCount}
                                        </p>
                                    </div>
                                    <div className="card">
                                        <p className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>Last Sync</p>
                                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                            {skadHealth.lastSync.toLocaleTimeString()}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Logs Tab */}
                {activeTab === 'logs' && (
                    <div className="space-y-4">
                        {/* Filters */}
                        <div className="card">
                            <div className="flex items-center space-x-4">
                                <div className="flex-1 relative">
                                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: 'var(--text-muted)' }} />
                                    <input
                                        type="text"
                                        placeholder="Search logs..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="input pl-10"
                                    />
                                </div>
                                <select
                                    value={logSeverity}
                                    onChange={(e) => setLogSeverity(e.target.value as LogSeverity)}
                                    className="input min-w-[150px]"
                                >
                                    <option value="all">All Severity</option>
                                    <option value="INFO">INFO</option>
                                    <option value="WARN">WARN</option>
                                    <option value="ERROR">ERROR</option>
                                </select>
                                <button className="btn-secondary flex items-center space-x-2">
                                    <FiFilter className="w-4 h-4" />
                                    <span>Filter</span>
                                </button>
                            </div>
                        </div>

                        {/* Logs */}
                        <div className="card bg-dark-card p-4">
                            <div className="space-y-2 font-mono text-sm max-h-[600px] overflow-y-auto custom-scrollbar">
                                {filteredLogs.map(log => (
                                    <div key={log.id} className="flex items-start space-x-3 py-2 hover:bg-dark-lighter rounded px-2">
                                        <span className="text-gray-500 flex-shrink-0 w-24">{log.timestamp.toLocaleTimeString()}</span>
                                        <span className={`${getSeverityBadge(log.severity)} flex-shrink-0`}>{log.severity}</span>
                                        <span className="text-blue-400 flex-shrink-0">[{log.container}]</span>
                                        <span style={{ color: 'var(--text-primary)' }}>{log.message}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Tracing Tab */}
                {activeTab === 'tracing' && (
                    <div className="space-y-4">
                        <div className="card">
                            <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                                OpenTelemetry Traces
                            </h2>
                            <div className="space-y-3">
                                {traces.map(trace => (
                                    <div key={trace.id} className="card p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center space-x-3">
                                                <div className={`p-2 rounded-lg ${trace.type === 'R1' ? 'bg-blue-500/20' :
                                                        trace.type === 'SME' ? 'bg-purple-500/20' :
                                                            'bg-green-500/20'
                                                    }`}>
                                                    {trace.type === 'R1' && <FiDatabase className="w-5 h-5 text-blue-400" />}
                                                    {trace.type === 'SME' && <FiServer className="w-5 h-5 text-purple-400" />}
                                                    {trace.type === 'A1' && <FiGitBranch className="w-5 h-5 text-green-400" />}
                                                </div>
                                                <div>
                                                    <h3 className="font-medium" style={{ color: 'var(--text-primary)' }}>{trace.name}</h3>
                                                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{trace.details}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className={`${getSeverityBadge(trace.status)} mb-1`}>{trace.status}</span>
                                                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                                                    {trace.duration}ms
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                            {trace.timestamp.toLocaleString()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Alerts Tab */}
                {activeTab === 'alerts' && (
                    <div className="space-y-4">
                        {alerts.map(alert => (
                            <div key={alert.id} className={`card ${alert.resolved ? 'opacity-50' : ''}`}>
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start space-x-3 flex-1">
                                        <div className={`p-2 rounded-lg ${alert.severity === 'critical' ? 'bg-red-500/20' :
                                                alert.severity === 'warning' ? 'bg-yellow-500/20' :
                                                    'bg-blue-500/20'
                                            }`}>
                                            <FiAlertTriangle className={`w-5 h-5 ${alert.severity === 'critical' ? 'text-red-400' :
                                                    alert.severity === 'warning' ? 'text-yellow-400' :
                                                        'text-blue-400'
                                                }`} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-2 mb-1">
                                                <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{alert.title}</h3>
                                                <span className={getSeverityBadge(alert.severity)}>{alert.severity}</span>
                                                {alert.resolved && <span className="badge-success">Resolved</span>}
                                            </div>
                                            <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>{alert.message}</p>
                                            <div className="flex items-center space-x-4 text-xs" style={{ color: 'var(--text-muted)' }}>
                                                <span>{alert.timestamp.toLocaleString()}</span>
                                                {alert.rappId && <span>rApp: {alert.rappId}</span>}
                                            </div>
                                        </div>
                                    </div>
                                    {!alert.resolved && (
                                        <button className="btn-ghost p-2">
                                            <FiX className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
