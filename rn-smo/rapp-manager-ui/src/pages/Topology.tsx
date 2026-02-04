import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    FiServer, FiCpu, FiActivity, FiAlertCircle, FiCheckCircle,
    FiX, FiMaximize2, FiZap, FiDatabase, FiRadio, FiFileText
} from 'react-icons/fi';
import { rappApi } from '../api/rappApi';
import { Rapp } from '../types';

interface TopologyNode {
    id: string;
    label: string;
    type: 'rapp' | 'near-rt-ric' | 'non-rt-ric' | 'du' | 'cu' | 'smo';
    x: number;
    y: number;
    status: 'healthy' | 'warning' | 'error' | 'inactive';
    metrics?: {
        cpu: number;
        memory: number;
        requests: number;
    };
    rappId?: string;
}

interface TopologyEdge {
    id: string;
    source: string;
    target: string;
    label: string;
    type: 'R1' | 'A1' | 'E2' | 'O1';
    traffic: number; // 0-100
    hasError: boolean;
}

const MOCK_NODES: TopologyNode[] = [
    // SMO Layer
    { id: 'smo', label: 'SMO Platform', type: 'smo', x: 400, y: 50, status: 'healthy' },

    // Non-RT RIC Layer
    {
        id: 'non-rt-ric', label: 'Non-RT RIC', type: 'non-rt-ric', x: 400, y: 150, status: 'healthy',
        metrics: { cpu: 45, memory: 62, requests: 1520 }
    },

    // rApps Layer
    {
        id: 'rapp-energy', label: 'Energy Optimizer', type: 'rapp', x: 200, y: 250, status: 'healthy',
        metrics: { cpu: 38, memory: 55, requests: 450 }, rappId: 'rapp-energy'
    },
    {
        id: 'rapp-traffic', label: 'Traffic Steering', type: 'rapp', x: 400, y: 250, status: 'error',
        metrics: { cpu: 5, memory: 12, requests: 0 }, rappId: 'rapp-traffic'
    },
    {
        id: 'rapp-qos', label: 'QoS Manager', type: 'rapp', x: 600, y: 250, status: 'healthy',
        metrics: { cpu: 52, memory: 68, requests: 890 }, rappId: 'rapp-qos'
    },

    // Near-RT RIC Layer
    {
        id: 'near-rt-ric-1', label: 'Near-RT RIC 1', type: 'near-rt-ric', x: 250, y: 400, status: 'healthy',
        metrics: { cpu: 65, memory: 71, requests: 2340 }
    },
    {
        id: 'near-rt-ric-2', label: 'Near-RT RIC 2', type: 'near-rt-ric', x: 550, y: 400, status: 'warning',
        metrics: { cpu: 82, memory: 89, requests: 3120 }
    },

    // CU Layer
    {
        id: 'cu-1', label: 'CU-CP 1', type: 'cu', x: 150, y: 550, status: 'healthy',
        metrics: { cpu: 45, memory: 52, requests: 1200 }
    },
    {
        id: 'cu-2', label: 'CU-UP 1', type: 'cu', x: 350, y: 550, status: 'healthy',
        metrics: { cpu: 58, memory: 64, requests: 1500 }
    },
    {
        id: 'cu-3', label: 'CU-CP 2', type: 'cu', x: 450, y: 550, status: 'healthy',
        metrics: { cpu: 48, memory: 56, requests: 1100 }
    },
    {
        id: 'cu-4', label: 'CU-UP 2', type: 'cu', x: 650, y: 550, status: 'healthy',
        metrics: { cpu: 62, memory: 68, requests: 1600 }
    },

    // DU Layer
    { id: 'du-1', label: 'DU 1', type: 'du', x: 100, y: 700, status: 'healthy' },
    { id: 'du-2', label: 'DU 2', type: 'du', x: 250, y: 700, status: 'healthy' },
    { id: 'du-3', label: 'DU 3', type: 'du', x: 400, y: 700, status: 'healthy' },
    { id: 'du-4', label: 'DU 4', type: 'du', x: 550, y: 700, status: 'error' },
    { id: 'du-5', label: 'DU 5', type: 'du', x: 700, y: 700, status: 'healthy' },
];

const MOCK_EDGES: TopologyEdge[] = [
    // SMO to Non-RT RIC
    { id: 'e1', source: 'smo', target: 'non-rt-ric', label: 'O1', type: 'O1', traffic: 45, hasError: false },

    // Non-RT RIC to rApps (A1)
    { id: 'e2', source: 'non-rt-ric', target: 'rapp-energy', label: 'A1', type: 'A1', traffic: 65, hasError: false },
    { id: 'e3', source: 'non-rt-ric', target: 'rapp-traffic', label: 'A1', type: 'A1', traffic: 0, hasError: true },
    { id: 'e4', source: 'non-rt-ric', target: 'rapp-qos', label: 'A1', type: 'A1', traffic: 78, hasError: false },

    // Near-RT RIC to rApps (R1)
    { id: 'e5', source: 'near-rt-ric-1', target: 'rapp-energy', label: 'R1', type: 'R1', traffic: 82, hasError: false },
    { id: 'e6', source: 'near-rt-ric-1', target: 'rapp-traffic', label: 'R1', type: 'R1', traffic: 0, hasError: true },
    { id: 'e7', source: 'near-rt-ric-2', target: 'rapp-qos', label: 'R1', type: 'R1', traffic: 88, hasError: false },

    // Near-RT RIC to CUs (E2)
    { id: 'e8', source: 'near-rt-ric-1', target: 'cu-1', label: 'E2', type: 'E2', traffic: 75, hasError: false },
    { id: 'e9', source: 'near-rt-ric-1', target: 'cu-2', label: 'E2', type: 'E2', traffic: 68, hasError: false },
    { id: 'e10', source: 'near-rt-ric-2', target: 'cu-3', label: 'E2', type: 'E2', traffic: 92, hasError: false },
    { id: 'e11', source: 'near-rt-ric-2', target: 'cu-4', label: 'E2', type: 'E2', traffic: 85, hasError: false },

    // CUs to DUs
    { id: 'e12', source: 'cu-1', target: 'du-1', label: 'F1', type: 'E2', traffic: 70, hasError: false },
    { id: 'e13', source: 'cu-2', target: 'du-2', label: 'F1', type: 'E2', traffic: 65, hasError: false },
    { id: 'e14', source: 'cu-3', target: 'du-3', label: 'F1', type: 'E2', traffic: 88, hasError: false },
    { id: 'e15', source: 'cu-4', target: 'du-4', label: 'F1', type: 'E2', traffic: 0, hasError: true },
    { id: 'e16', source: 'cu-4', target: 'du-5', label: 'F1', type: 'E2', traffic: 82, hasError: false },
];

export const Topology = () => {
    const [nodes] = useState<TopologyNode[]>(MOCK_NODES);
    const [edges] = useState<TopologyEdge[]>(MOCK_EDGES);
    const [selectedNode, setSelectedNode] = useState<TopologyNode | null>(null);
    const [hoveredNode, setHoveredNode] = useState<string | null>(null);

    const { data: rapps } = useQuery<Rapp[]>({
        queryKey: ['rapps'],
        queryFn: async () => (await rappApi.getRapps()).data,
    });

    const getNodeColor = (status: string) => {
        switch (status) {
            case 'healthy': return { fill: '#10b981', stroke: '#059669', glow: '#10b981' };
            case 'warning': return { fill: '#f59e0b', stroke: '#d97706', glow: '#f59e0b' };
            case 'error': return { fill: '#ef4444', stroke: '#dc2626', glow: '#ef4444' };
            case 'inactive': return { fill: '#6b7280', stroke: '#4b5563', glow: '#6b7280' };
            default: return { fill: '#6b7280', stroke: '#4b5563', glow: '#6b7280' };
        }
    };

    const getNodeIcon = (type: string) => {
        switch (type) {
            case 'rapp': return FiZap;
            case 'near-rt-ric': return FiCpu;
            case 'non-rt-ric': return FiServer;
            case 'du': return FiRadio;
            case 'cu': return FiDatabase;
            case 'smo': return FiActivity;
            default: return FiServer;
        }
    };

    const getEdgeColor = (type: string, hasError: boolean) => {
        if (hasError) return '#ef4444';
        switch (type) {
            case 'R1': return '#3b82f6'; // Blue
            case 'A1': return '#10b981'; // Green
            case 'E2': return '#8b5cf6'; // Purple
            case 'O1': return '#f59e0b'; // Orange
            default: return '#6b7280';
        }
    };

    const calculateEdgePath = (source: TopologyNode, target: TopologyNode) => {
        const dx = target.x - source.x;
        const dy = target.y - source.y;
        const dr = Math.sqrt(dx * dx + dy * dy);

        // Create a curved path
        return `M ${source.x} ${source.y} Q ${source.x + dx / 2} ${source.y + dy / 2 - 30} ${target.x} ${target.y}`;
    };

    const getLogs = (nodeId: string) => [
        { time: '14:23:01', level: 'INFO', message: `${nodeId} processing requests normally` },
        { time: '14:23:05', level: 'WARN', message: 'High memory usage detected' },
        { time: '14:23:12', level: 'ERROR', message: 'Connection timeout to downstream service' },
    ];

    return (
        <div className="p-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2 flex items-center" style={{ color: 'var(--text-primary)' }}>
                    <FiActivity className="w-8 h-8 mr-3" />
                    Network Topology
                </h1>
                <p style={{ color: 'var(--text-muted)' }}>Interactive visualization of RIC nodes, rApps, and network elements</p>
            </div>

            <div className="flex gap-6">
                {/* Topology Canvas */}
                <div className="flex-1 card p-6 bg-dark-card" style={{ minHeight: '800px' }}>
                    <div className="mb-4 flex items-center justify-between">
                        <div className="flex items-center space-x-6 text-sm">
                            <div className="flex items-center space-x-2">
                                <div className="w-3 h-3 rounded-full bg-green-500" />
                                <span style={{ color: 'var(--text-secondary)' }}>Healthy</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                                <span style={{ color: 'var(--text-secondary)' }}>Warning</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <div className="w-3 h-3 rounded-full bg-red-500" />
                                <span style={{ color: 'var(--text-secondary)' }}>Error</span>
                            </div>
                        </div>
                        <button className="btn-ghost p-2">
                            <FiMaximize2 className="w-5 h-5" />
                        </button>
                    </div>

                    {/* SVG Topology Map */}
                    <svg width="100%" height="750" viewBox="0 0 800 800" className="bg-dark rounded-lg">
                        <defs>
                            {/* Arrow markers for different edge types */}
                            <marker id="arrow-r1" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
                                <path d="M0,0 L0,6 L9,3 z" fill="#3b82f6" />
                            </marker>
                            <marker id="arrow-a1" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
                                <path d="M0,0 L0,6 L9,3 z" fill="#10b981" />
                            </marker>
                            <marker id="arrow-e2" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
                                <path d="M0,0 L0,6 L9,3 z" fill="#8b5cf6" />
                            </marker>
                            <marker id="arrow-o1" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
                                <path d="M0,0 L0,6 L9,3 z" fill="#f59e0b" />
                            </marker>
                            <marker id="arrow-error" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
                                <path d="M0,0 L0,6 L9,3 z" fill="#ef4444" />
                            </marker>

                            {/* Glow filters for error nodes */}
                            <filter id="glow-error" x="-50%" y="-50%" width="200%" height="200%">
                                <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                                <feMerge>
                                    <feMergeNode in="coloredBlur" />
                                    <feMergeNode in="SourceGraphic" />
                                </feMerge>
                            </filter>

                            {/* Animated gradient for traffic flow */}
                            <linearGradient id="traffic-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="currentColor" stopOpacity="0.2">
                                    <animate attributeName="offset" values="0;1;0" dur="2s" repeatCount="indefinite" />
                                </stop>
                                <stop offset="50%" stopColor="currentColor" stopOpacity="1">
                                    <animate attributeName="offset" values="0;1;0" dur="2s" repeatCount="indefinite" />
                                </stop>
                                <stop offset="100%" stopColor="currentColor" stopOpacity="0.2">
                                    <animate attributeName="offset" values="0;1;0" dur="2s" repeatCount="indefinite" />
                                </stop>
                            </linearGradient>
                        </defs>

                        {/* Layer Labels */}
                        <text x="10" y="80" fill="#6b7280" fontSize="14" fontWeight="600">SMO Layer</text>
                        <text x="10" y="180" fill="#6b7280" fontSize="14" fontWeight="600">Non-RT RIC</text>
                        <text x="10" y="280" fill="#6b7280" fontSize="14" fontWeight="600">rApps</text>
                        <text x="10" y="430" fill="#6b7280" fontSize="14" fontWeight="600">Near-RT RIC</text>
                        <text x="10" y="580" fill="#6b7280" fontSize="14" fontWeight="600">CU Layer</text>
                        <text x="10" y="730" fill="#6b7280" fontSize="14" fontWeight="600">DU Layer</text>

                        {/* Edges (connections) */}
                        <g>
                            {edges.map(edge => {
                                const sourceNode = nodes.find(n => n.id === edge.source);
                                const targetNode = nodes.find(n => n.id === edge.target);
                                if (!sourceNode || !targetNode) return null;

                                const color = getEdgeColor(edge.type, edge.hasError);
                                const markerId = edge.hasError ? 'arrow-error' :
                                    edge.type === 'R1' ? 'arrow-r1' :
                                        edge.type === 'A1' ? 'arrow-a1' :
                                            edge.type === 'E2' ? 'arrow-e2' : 'arrow-o1';

                                return (
                                    <g key={edge.id}>
                                        {/* Traffic flow indicator (animated) */}
                                        {edge.traffic > 0 && (
                                            <path
                                                d={calculateEdgePath(sourceNode, targetNode)}
                                                fill="none"
                                                stroke={color}
                                                strokeWidth="3"
                                                strokeOpacity="0.3"
                                                strokeDasharray="10 5"
                                            >
                                                <animate
                                                    attributeName="stroke-dashoffset"
                                                    values="0;-15;0"
                                                    dur="2s"
                                                    repeatCount="indefinite"
                                                />
                                            </path>
                                        )}

                                        {/* Main edge */}
                                        <path
                                            d={calculateEdgePath(sourceNode, targetNode)}
                                            fill="none"
                                            stroke={color}
                                            strokeWidth={edge.hasError ? "2.5" : "1.5"}
                                            strokeOpacity={edge.traffic > 0 ? 0.8 : 0.3}
                                            markerEnd={`url(#${markerId})`}
                                        >
                                            {edge.hasError && (
                                                <animate
                                                    attributeName="stroke-opacity"
                                                    values="0.3;1;0.3"
                                                    dur="1s"
                                                    repeatCount="indefinite"
                                                />
                                            )}
                                        </path>

                                        {/* Edge label */}
                                        <text
                                            x={(sourceNode.x + targetNode.x) / 2}
                                            y={(sourceNode.y + targetNode.y) / 2 - 35}
                                            fill={color}
                                            fontSize="11"
                                            fontWeight="600"
                                            textAnchor="middle"
                                        >
                                            {edge.label}
                                        </text>
                                    </g>
                                );
                            })}
                        </g>

                        {/* Nodes */}
                        <g>
                            {nodes.map(node => {
                                const colors = getNodeColor(node.status);
                                const isHovered = hoveredNode === node.id;
                                const isSelected = selectedNode?.id === node.id;
                                const nodeSize = node.type === 'rapp' ? 50 : node.type === 'smo' ? 60 : 45;

                                return (
                                    <g
                                        key={node.id}
                                        transform={`translate(${node.x}, ${node.y})`}
                                        onMouseEnter={() => setHoveredNode(node.id)}
                                        onMouseLeave={() => setHoveredNode(null)}
                                        onClick={() => setSelectedNode(node)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        {/* Glow effect for errors */}
                                        {node.status === 'error' && (
                                            <circle
                                                r={nodeSize / 2 + 8}
                                                fill={colors.glow}
                                                opacity="0.3"
                                                filter="url(#glow-error)"
                                            >
                                                <animate
                                                    attributeName="r"
                                                    values={`${nodeSize / 2 + 8};${nodeSize / 2 + 12};${nodeSize / 2 + 8}`}
                                                    dur="2s"
                                                    repeatCount="indefinite"
                                                />
                                            </circle>
                                        )}

                                        {/* Selection ring */}
                                        {isSelected && (
                                            <circle
                                                r={nodeSize / 2 + 6}
                                                fill="none"
                                                stroke="#2563eb"
                                                strokeWidth="2"
                                            />
                                        )}

                                        {/* Hover effect */}
                                        {isHovered && (
                                            <circle
                                                r={nodeSize / 2 + 4}
                                                fill="none"
                                                stroke={colors.stroke}
                                                strokeWidth="1.5"
                                                opacity="0.5"
                                            />
                                        )}

                                        {/* Main node circle */}
                                        <circle
                                            r={nodeSize / 2}
                                            fill={colors.fill}
                                            stroke={colors.stroke}
                                            strokeWidth="2"
                                            opacity={isHovered ? 0.9 : 0.8}
                                        />

                                        {/* Node type indicator (inner circle pattern) */}
                                        {node.type === 'rapp' && (
                                            <circle r={nodeSize / 4} fill="#ffffff" opacity="0.3" />
                                        )}

                                        {/* Status indicator dot */}
                                        <circle
                                            cx={nodeSize / 2 - 8}
                                            cy={-nodeSize / 2 + 8}
                                            r="4"
                                            fill={colors.fill}
                                            stroke="#1f2937"
                                            strokeWidth="1.5"
                                        >
                                            {node.status === 'error' && (
                                                <animate
                                                    attributeName="opacity"
                                                    values="1;0.3;1"
                                                    dur="1s"
                                                    repeatCount="indefinite"
                                                />
                                            )}
                                        </circle>

                                        {/* Node label */}
                                        <text
                                            y={nodeSize / 2 + 20}
                                            fill="#e5e7eb"
                                            fontSize="12"
                                            fontWeight="600"
                                            textAnchor="middle"
                                        >
                                            {node.label}
                                        </text>

                                        {/* Metrics indicator for rApps */}
                                        {node.metrics && node.type === 'rapp' && (
                                            <text
                                                y={nodeSize / 2 + 35}
                                                fill="#9ca3af"
                                                fontSize="10"
                                                textAnchor="middle"
                                            >
                                                {node.metrics.requests} req/s
                                            </text>
                                        )}
                                    </g>
                                );
                            })}
                        </g>
                    </svg>
                </div>

                {/* Side Panel */}
                {selectedNode && (
                    <div className="w-96 space-y-4">
                        {/* Node Details Card */}
                        <div className="card animate-scale-in">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                                    {selectedNode.label}
                                </h3>
                                <button onClick={() => setSelectedNode(null)} className="btn-ghost p-2">
                                    <FiX className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Status */}
                            <div className="flex items-center space-x-2 mb-4">
                                {selectedNode.status === 'healthy' && <FiCheckCircle className="w-5 h-5 text-green-400" />}
                                {selectedNode.status === 'error' && <FiAlertCircle className="w-5 h-5 text-red-400" />}
                                {selectedNode.status === 'warning' && <FiAlertCircle className="w-5 h-5 text-yellow-400" />}
                                <span className="text-sm font-medium capitalize" style={{ color: 'var(--text-secondary)' }}>
                                    {selectedNode.status}
                                </span>
                            </div>

                            {/* Metrics */}
                            {selectedNode.metrics && (
                                <div className="space-y-3 mb-4">
                                    <div>
                                        <div className="flex items-center justify-between mb-1 text-sm">
                                            <span style={{ color: 'var(--text-muted)' }}>CPU</span>
                                            <span style={{ color: 'var(--text-primary)' }} className="font-medium">{selectedNode.metrics.cpu}%</span>
                                        </div>
                                        <div className="w-full bg-dark-lighter rounded-full h-2">
                                            <div
                                                className={`h-2 rounded-full ${selectedNode.metrics.cpu > 80 ? 'bg-red-500' :
                                                        selectedNode.metrics.cpu > 60 ? 'bg-yellow-500' : 'bg-green-500'
                                                    }`}
                                                style={{ width: `${selectedNode.metrics.cpu}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex items-center justify-between mb-1 text-sm">
                                            <span style={{ color: 'var(--text-muted)' }}>Memory</span>
                                            <span style={{ color: 'var(--text-primary)' }} className="font-medium">{selectedNode.metrics.memory}%</span>
                                        </div>
                                        <div className="w-full bg-dark-lighter rounded-full h-2">
                                            <div
                                                className={`h-2 rounded-full ${selectedNode.metrics.memory > 80 ? 'bg-red-500' :
                                                        selectedNode.metrics.memory > 60 ? 'bg-yellow-500' : 'bg-blue-500'
                                                    }`}
                                                style={{ width: `${selectedNode.metrics.memory}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div className="text-sm">
                                        <span style={{ color: 'var(--text-muted)' }}>Requests: </span>
                                        <span style={{ color: 'var(--text-primary)' }} className="font-medium">
                                            {selectedNode.metrics.requests}/s
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Connected Interfaces */}
                            <div className="mb-4">
                                <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Connected Interfaces</h4>
                                <div className="space-y-1">
                                    {edges
                                        .filter(e => e.source === selectedNode.id || e.target === selectedNode.id)
                                        .slice(0, 3)
                                        .map(edge => (
                                            <div key={edge.id} className="flex items-center justify-between text-xs p-2 bg-dark-lighter rounded">
                                                <span style={{ color: 'var(--text-secondary)' }}>{edge.label}</span>
                                                <span className={`badge ${edge.hasError ? 'badge-error' : 'badge-success'}`}>
                                                    {edge.hasError ? 'Error' : `${edge.traffic}%`}
                                                </span>
                                            </div>
                                        ))}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex space-x-2">
                                <button className="btn-primary flex-1 text-sm flex items-center justify-center space-x-1">
                                    <FiFileText className="w-4 h-4" />
                                    <span>View Logs</span>
                                </button>
                                <button className="btn-secondary flex-1 text-sm flex items-center justify-center space-x-1">
                                    <FiActivity className="w-4 h-4" />
                                    <span>Metrics</span>
                                </button>
                            </div>
                        </div>

                        {/* Recent Logs Card */}
                        <div className="card">
                            <h4 className="text-sm font-semibold mb-3 flex items-center" style={{ color: 'var(--text-secondary)' }}>
                                <FiFileText className="w-4 h-4 mr-2" />
                                Recent Logs
                            </h4>
                            <div className="space-y-2 text-xs font-mono max-h-48 overflow-y-auto custom-scrollbar">
                                {getLogs(selectedNode.id).map((log, idx) => (
                                    <div key={idx} className="flex items-start space-x-2">
                                        <span className="text-gray-500 flex-shrink-0">{log.time}</span>
                                        <span className={`${log.level === 'ERROR' ? 'badge-error' :
                                                log.level === 'WARN' ? 'badge-warning' : 'badge-info'
                                            } flex-shrink-0 text-xs`}>
                                            {log.level}
                                        </span>
                                        <span style={{ color: 'var(--text-secondary)' }}>{log.message}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
