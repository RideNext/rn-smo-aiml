import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    FiServer, FiPlay, FiClock, FiCode, FiCopy, FiTrash2,
    FiCheck, FiX, FiChevronDown, FiChevronRight, FiActivity,
    FiAlertCircle, FiDownload, FiRefreshCw
} from 'react-icons/fi';
import { rappApi } from '../api/rappApi';
import { Rapp } from '../types';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

interface SmeApi {
    id: string;
    rappId: string;
    rappName: string;
    name: string;
    version: string;
    basePath: string;
    description: string;
    endpoints: ApiEndpoint[];
    tags: string[];
}

interface ApiEndpoint {
    id: string;
    method: HttpMethod;
    path: string;
    description: string;
    parameters?: ApiParameter[];
    requestBody?: ApiSchema;
    responses: Record<number, ApiResponse>;
}

interface ApiParameter {
    name: string;
    in: 'query' | 'path' | 'header';
    required: boolean;
    type: string;
    description?: string;
}

interface ApiSchema {
    type: string;
    properties?: Record<string, any>;
    example?: any;
}

interface ApiResponse {
    description: string;
    schema?: ApiSchema;
}

interface ApiRequest {
    id: string;
    timestamp: Date;
    apiId: string;
    endpoint: string;
    method: HttpMethod;
    url: string;
    headers: Record<string, string>;
    body?: string;
    response?: {
        status: number;
        statusText: string;
        headers: Record<string, string>;
        body: string;
        latency: number;
    };
    error?: string;
}

// Mock SME APIs
const MOCK_SME_APIS: SmeApi[] = [
    {
        id: 'api-1',
        rappId: 'rapp-energy',
        rappName: 'Energy Optimizer',
        name: 'Energy Management API',
        version: '1.0.0',
        basePath: '/api/v1/energy',
        description: 'API for energy optimization and cell configuration',
        tags: ['Energy', 'Configuration'],
        endpoints: [
            {
                id: 'ep-1',
                method: 'GET',
                path: '/cells',
                description: 'Get all cell configurations',
                parameters: [
                    { name: 'region', in: 'query', required: false, type: 'string', description: 'Filter by region' },
                ],
                responses: {
                    200: { description: 'Success', schema: { type: 'array', example: [{ cellId: 'cell-1', status: 'active' }] } },
                },
            },
            {
                id: 'ep-2',
                method: 'POST',
                path: '/cells/{cellId}/optimize',
                description: 'Trigger energy optimization for a cell',
                parameters: [
                    { name: 'cellId', in: 'path', required: true, type: 'string', description: 'Cell identifier' },
                ],
                requestBody: {
                    type: 'object',
                    properties: { mode: { type: 'string' }, threshold: { type: 'number' } },
                    example: { mode: 'aggressive', threshold: 75 },
                },
                responses: {
                    200: { description: 'Optimization triggered' },
                    404: { description: 'Cell not found' },
                },
            },
            {
                id: 'ep-3',
                method: 'GET',
                path: '/metrics',
                description: 'Get energy savings metrics',
                responses: {
                    200: { description: 'Success', schema: { type: 'object', example: { totalSavings: '1250 kWh', efficiency: '23%' } } },
                },
            },
        ],
    },
    {
        id: 'api-2',
        rappId: 'rapp-traffic',
        rappName: 'Traffic Steering',
        name: 'Traffic Management API',
        version: '2.0.0',
        basePath: '/api/v2/traffic',
        description: 'API for traffic steering and load balancing',
        tags: ['Traffic', 'QoS'],
        endpoints: [
            {
                id: 'ep-4',
                method: 'GET',
                path: '/policies',
                description: 'List all traffic policies',
                responses: {
                    200: { description: 'Success' },
                },
            },
            {
                id: 'ep-5',
                method: 'PUT',
                path: '/policies/{policyId}',
                description: 'Update traffic policy',
                parameters: [
                    { name: 'policyId', in: 'path', required: true, type: 'string' },
                ],
                requestBody: {
                    type: 'object',
                    example: { priority: 'high', maxLoad: 80 },
                },
                responses: {
                    200: { description: 'Policy updated' },
                    404: { description: 'Policy not found' },
                },
            },
        ],
    },
];

const MOCK_LATENCY_DATA = {
    'api-1': { avg: 45, p50: 42, p95: 78, p99: 125 },
    'api-2': { avg: 62, p50: 58, p95: 95, p99: 142 },
};

export const ApiManagement = () => {
    const [apis] = useState<SmeApi[]>(MOCK_SME_APIS);
    const [selectedApi, setSelectedApi] = useState<SmeApi | null>(null);
    const [selectedEndpoint, setSelectedEndpoint] = useState<ApiEndpoint | null>(null);
    const [requestHistory, setRequestHistory] = useState<ApiRequest[]>([]);
    const [expandedHistory, setExpandedHistory] = useState<Set<string>>(new Set());

    // API Testing State
    const [testUrl, setTestUrl] = useState('');
    const [testMethod, setTestMethod] = useState<HttpMethod>('GET');
    const [testHeaders, setTestHeaders] = useState<Record<string, string>>({
        'Content-Type': 'application/json',
    });
    const [testBody, setTestBody] = useState('');
    const [testingInProgress, setTestingInProgress] = useState(false);
    const [testResponse, setTestResponse] = useState<ApiRequest | null>(null);

    const { data: rapps } = useQuery<Rapp[]>({
        queryKey: ['rapps'],
        queryFn: async () => (await rappApi.getRapps()).data,
    });

    const sendApiRequest = async () => {
        setTestingInProgress(true);
        const startTime = Date.now();

        const request: ApiRequest = {
            id: `req-${Date.now()}`,
            timestamp: new Date(),
            apiId: selectedApi?.id || '',
            endpoint: selectedEndpoint?.path || '',
            method: testMethod,
            url: testUrl,
            headers: testHeaders,
            body: testBody || undefined,
        };

        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 200));

            const mockResponse = {
                status: 200,
                statusText: 'OK',
                headers: {
                    'content-type': 'application/json',
                    'x-request-id': `req-${Math.random().toString(36).substr(2, 9)}`,
                },
                body: JSON.stringify(
                    selectedEndpoint?.responses[200]?.schema?.example || { success: true, message: 'Request completed successfully' },
                    null,
                    2
                ),
                latency: Date.now() - startTime,
            };

            request.response = mockResponse;
            setTestResponse(request);
            setRequestHistory([request, ...requestHistory]);
        } catch (error: any) {
            request.error = error.message;
            setTestResponse(request);
            setRequestHistory([request, ...requestHistory]);
        } finally {
            setTestingInProgress(false);
        }
    };

    const loadEndpoint = (api: SmeApi, endpoint: ApiEndpoint) => {
        setSelectedApi(api);
        setSelectedEndpoint(endpoint);
        setTestMethod(endpoint.method);

        // Build URL with path parameters
        let url = `${window.location.origin}${api.basePath}${endpoint.path}`;
        setTestUrl(url);

        // Set example body if POST/PUT/PATCH
        if (endpoint.requestBody && ['POST', 'PUT', 'PATCH'].includes(endpoint.method)) {
            setTestBody(JSON.stringify(endpoint.requestBody.example || {}, null, 2));
        } else {
            setTestBody('');
        }

        setTestResponse(null);
    };

    const getMethodColor = (method: HttpMethod) => {
        const colors: Record<HttpMethod, string> = {
            GET: 'text-blue-400',
            POST: 'text-green-400',
            PUT: 'text-yellow-400',
            DELETE: 'text-red-400',
            PATCH: 'text-purple-400',
        };
        return colors[method] || 'text-gray-400';
    };

    const getMethodBadge = (method: HttpMethod) => {
        const badges: Record<HttpMethod, string> = {
            GET: 'badge-info',
            POST: 'badge-success',
            PUT: 'badge-warning',
            DELETE: 'badge-error',
            PATCH: 'badge-secondary',
        };
        return badges[method] || 'badge-secondary';
    };

    const getStatusColor = (status: number) => {
        if (status >= 200 && status < 300) return 'text-green-400';
        if (status >= 400) return 'text-red-400';
        return 'text-yellow-400';
    };

    const toggleHistory = (id: string) => {
        const newExpanded = new Set(expandedHistory);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedHistory(newExpanded);
    };

    const clearHistory = () => {
        setRequestHistory([]);
        setExpandedHistory(new Set());
    };

    const exportHistory = () => {
        const blob = new Blob([JSON.stringify(requestHistory, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `api-history-${new Date().toISOString()}.json`;
        a.click();
    };

    return (
        <div className="p-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2 flex items-center" style={{ color: 'var(--text-primary)' }}>
                    <FiServer className="w-8 h-8 mr-3" />
                    API Management (SME)
                </h1>
                <p style={{ color: 'var(--text-muted)' }}>Service Management & Exposure APIs from deployed rApps</p>
            </div>

            <div className="grid grid-cols-3 gap-6">
                {/* Left Panel: API List */}
                <div className="space-y-4">
                    <div className="card">
                        <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Available APIs</h2>
                        {apis.map(api => (
                            <div key={api.id} className="mb-4">
                                <div className="flex items-center justify-between mb-2 p-2 hover:bg-dark-lighter rounded cursor-pointer"
                                    onClick={() => setSelectedApi(selectedApi?.id === api.id ? null : api)}>
                                    <div>
                                        <h3 className="font-medium" style={{ color: 'var(--text-primary)' }}>{api.name}</h3>
                                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{api.rappName} • v{api.version}</p>
                                    </div>
                                    {selectedApi?.id === api.id ? <FiChevronDown /> : <FiChevronRight />}
                                </div>

                                {selectedApi?.id === api.id && (
                                    <div className="ml-4 space-y-1">
                                        {api.endpoints.map(endpoint => (
                                            <button
                                                key={endpoint.id}
                                                onClick={() => loadEndpoint(api, endpoint)}
                                                className={`w-full flex items-center space-x-2 p-2 rounded text-left hover:bg-dark-card ${selectedEndpoint?.id === endpoint.id ? 'bg-primary-600/20 border border-primary-600' : ''
                                                    }`}
                                            >
                                                <span className={`${getMethodBadge(endpoint.method)} text-xs w-16 text-center`}>
                                                    {endpoint.method}
                                                </span>
                                                <span className="text-sm font-mono" style={{ color: 'var(--text-secondary)' }}>
                                                    {endpoint.path}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Latency Dashboard */}
                    <div className="card">
                        <h2 className="text-lg font-semibold mb-4 flex items-center" style={{ color: 'var(--text-primary)' }}>
                            <FiClock className="w-5 h-5 mr-2" />
                            Latency Metrics
                        </h2>
                        {Object.entries(MOCK_LATENCY_DATA).map(([apiId, metrics]) => {
                            const api = apis.find(a => a.id === apiId);
                            return (
                                <div key={apiId} className="mb-4">
                                    <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>{api?.name}</p>
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div className="card">
                                            <span style={{ color: 'var(--text-muted)' }}>Avg:</span>
                                            <span className="ml-1 font-semibold" style={{ color: 'var(--text-primary)' }}>{metrics.avg}ms</span>
                                        </div>
                                        <div className="card">
                                            <span style={{ color: 'var(--text-muted)' }}>P50:</span>
                                            <span className="ml-1 font-semibold" style={{ color: 'var(--text-primary)' }}>{metrics.p50}ms</span>
                                        </div>
                                        <div className="card">
                                            <span style={{ color: 'var(--text-muted)' }}>P95:</span>
                                            <span className="ml-1 font-semibold text-yellow-400">{metrics.p95}ms</span>
                                        </div>
                                        <div className="card">
                                            <span style={{ color: 'var(--text-muted)' }}>P99:</span>
                                            <span className="ml-1 font-semibold text-red-400">{metrics.p99}ms</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Center Panel: API Tester */}
                <div className="col-span-2 space-y-4">
                    {selectedEndpoint ? (
                        <>
                            {/* Endpoint Details */}
                            <div className="card">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center space-x-3">
                                        <span className={getMethodBadge(selectedEndpoint.method)}>{selectedEndpoint.method}</span>
                                        <code className="text-lg font-mono" style={{ color: 'var(--text-primary)' }}>
                                            {selectedApi?.basePath}{selectedEndpoint.path}
                                        </code>
                                    </div>
                                    <button onClick={() => sendApiRequest()} disabled={testingInProgress} className="btn-primary flex items-center space-x-2">
                                        {testingInProgress ? (
                                            <>
                                                <FiRefreshCw className="w-4 h-4 animate-spin" />
                                                <span>Sending...</span>
                                            </>
                                        ) : (
                                            <>
                                                <FiPlay className="w-4 h-4" />
                                                <span>Send Request</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                                <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>{selectedEndpoint.description}</p>

                                {/* URL */}
                                <div className="mb-4">
                                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Request URL</label>
                                    <input
                                        type="text"
                                        value={testUrl}
                                        onChange={(e) => setTestUrl(e.target.value)}
                                        className="input font-mono"
                                    />
                                </div>

                                {/* Headers */}
                                <div className="mb-4">
                                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Headers</label>
                                    <div className="space-y-2">
                                        {Object.entries(testHeaders).map(([key, value]) => (
                                            <div key={key} className="flex items-center space-x-2">
                                                <input value={key} readOnly className="input flex-1 font-mono text-sm" />
                                                <span>:</span>
                                                <input value={value} readOnly className="input flex-1 font-mono text-sm" />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Body (for POST/PUT/PATCH) */}
                                {['POST', 'PUT', 'PATCH'].includes(selectedEndpoint.method) && (
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Request Body (JSON)</label>
                                        <textarea
                                            value={testBody}
                                            onChange={(e) => setTestBody(e.target.value)}
                                            className="input font-mono text-sm"
                                            rows={8}
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Response */}
                            {testResponse && (
                                <div className="card">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Response</h3>
                                        {testResponse.response && (
                                            <div className="flex items-center space-x-4 text-sm">
                                                <span className={getStatusColor(testResponse.response.status)}>
                                                    {testResponse.response.status} {testResponse.response.statusText}
                                                </span>
                                                <span style={{ color: 'var(--text-muted)' }}>
                                                    {testResponse.response.latency}ms
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {testResponse.response ? (
                                        <>
                                            <div className="mb-4">
                                                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Response Headers</label>
                                                <div className="card bg-dark p-3 font-mono text-xs">
                                                    {Object.entries(testResponse.response.headers).map(([key, value]) => (
                                                        <div key={key} style={{ color: 'var(--text-muted)' }}>
                                                            <span className="text-blue-400">{key}</span>: {value}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Response Body</label>
                                                <div className="card bg-dark p-4 font-mono text-sm overflow-x-auto">
                                                    <pre style={{ color: 'var(--text-secondary)' }}>{testResponse.response.body}</pre>
                                                </div>
                                            </div>
                                        </>
                                    ) : testResponse.error ? (
                                        <div className="bg-red-500/20 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg flex items-center space-x-2">
                                            <FiAlertCircle className="w-5 h-5" />
                                            <span>{testResponse.error}</span>
                                        </div>
                                    ) : null}
                                </div>
                            )}

                            {/* Request History */}
                            {requestHistory.length > 0 && (
                                <div className="card">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                                            Request History ({requestHistory.length})
                                        </h3>
                                        <div className="flex space-x-2">
                                            <button onClick={exportHistory} className="btn-ghost p-2">
                                                <FiDownload className="w-4 h-4" />
                                            </button>
                                            <button onClick={clearHistory} className="btn-ghost p-2 text-red-400">
                                                <FiTrash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
                                        {requestHistory.map(req => (
                                            <div key={req.id} className="card">
                                                <div
                                                    className="flex items-center justify-between cursor-pointer"
                                                    onClick={() => toggleHistory(req.id)}
                                                >
                                                    <div className="flex items-center space-x-3 flex-1">
                                                        <span className={getMethodBadge(req.method)}>{req.method}</span>
                                                        <code className="text-sm font-mono" style={{ color: 'var(--text-secondary)' }}>
                                                            {req.endpoint}
                                                        </code>
                                                    </div>
                                                    <div className="flex items-center space-x-3 text-sm">
                                                        {req.response ? (
                                                            <>
                                                                <span className={getStatusColor(req.response.status)}>
                                                                    {req.response.status}
                                                                </span>
                                                                <span style={{ color: 'var(--text-muted)' }}>
                                                                    {req.response.latency}ms
                                                                </span>
                                                            </>
                                                        ) : req.error ? (
                                                            <span className="text-red-400">Error</span>
                                                        ) : null}
                                                        <span style={{ color: 'var(--text-muted)' }}>
                                                            {req.timestamp.toLocaleTimeString()}
                                                        </span>
                                                        {expandedHistory.has(req.id) ? <FiChevronDown /> : <FiChevronRight />}
                                                    </div>
                                                </div>

                                                {expandedHistory.has(req.id) && req.response && (
                                                    <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--border-color)' }}>
                                                        <div className="grid grid-cols-2 gap-4 text-xs mb-3">
                                                            <div>
                                                                <span style={{ color: 'var(--text-muted)' }}>Status:</span>
                                                                <span className={`ml-2 ${getStatusColor(req.response.status)}`}>
                                                                    {req.response.status} {req.response.statusText}
                                                                </span>
                                                            </div>
                                                            <div>
                                                                <span style={{ color: 'var(--text-muted)' }}>Latency:</span>
                                                                <span className="ml-2" style={{ color: 'var(--text-primary)' }}>
                                                                    {req.response.latency}ms
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="card bg-dark p-3 font-mono text-xs">
                                                            <pre className="overflow-x-auto" style={{ color: 'var(--text-secondary)' }}>
                                                                {req.response.body}
                                                            </pre>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="card text-center py-16">
                            <FiCode className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Select an API Endpoint</h3>
                            <p style={{ color: 'var(--text-muted)' }}>Choose an endpoint from the left to start testing</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
