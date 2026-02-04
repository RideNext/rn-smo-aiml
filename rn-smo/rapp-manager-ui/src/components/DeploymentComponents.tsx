import { useState, useEffect } from 'react';
import {
    FiX, FiPlay, FiPause, FiRotateCw, FiUpload, FiDownload, FiTrash2,
    FiSettings, FiCpu, FiDatabase, FiServer, FiCheck, FiAlertCircle,
    FiInfo, FiCheckCircle, FiLoader
} from 'react-icons/fi';
import {
    DeploymentConfig,
    LifecycleAction,
    DeploymentLog,
    PodEvent,
    ImagePullStatus,
    ProbeStatus,
    RESOURCE_PRESETS,
    Rapp
} from '../types';

interface DeployWorkflowProps {
    rapp: Rapp;
    onClose: () => void;
    onDeploy: (config: DeploymentConfig) => void;
}

interface LifecycleManagerProps {
    rapp: Rapp;
    instanceId?: string;
    onAction: (action: LifecycleAction, config?: DeploymentConfig) => void;
}

interface DeploymentLogsProps {
    rappId: string;
    instanceId: string;
    isOpen: boolean;
    onClose: () => void;
}

// Deploy Workflow Modal
export const DeployWorkflow = ({ rapp, onClose, onDeploy }: DeployWorkflowProps) => {
    const [step, setStep] = useState(1);
    const [config, setConfig] = useState<DeploymentConfig>({
        namespace: 'default',
        helmValues: {},
        resourceSize: 'medium',
        autoscaling: {
            enabled: false,
            minReplicas: 1,
            maxReplicas: 5,
            targetCPUUtilization: 70,
        },
        dmeModels: [],
        smeProvider: '',
    });

    const [helmValuesText, setHelmValuesText] = useState('replicaCount: 2\nimage:\n  repository: oran/rapp\n  tag: 1.0.0');
    const [errors, setErrors] = useState<string[]>([]);

    const handleResourceSizeChange = (size: 'small' | 'medium' | 'large' | 'custom') => {
        setConfig({
            ...config,
            resourceSize: size,
            customResources: size === 'custom' ? {
                cpu: '500m',
                memory: '1Gi',
                storage: '10Gi',
                gpu: 0,
            } : undefined,
        });
    };

    const handleDeploy = () => {
        const validationErrors: string[] = [];

        if (!config.namespace) validationErrors.push('Namespace is required');
        if (config.autoscaling.enabled && (!config.autoscaling.minReplicas || !config.autoscaling.maxReplicas)) {
            validationErrors.push('Autoscaling requires min and max replicas');
        }

        if (validationErrors.length > 0) {
            setErrors(validationErrors);
            return;
        }

        try {
            // Only parse if text is provided and not just empty/whitespace
            let helmValues = {};
            if (helmValuesText && helmValuesText.trim()) {
                // Simplistic YAML-like to JSON conversion for the demo
                // In production, use a real YAML parser like 'js-yaml'
                // Here we'll wrap it in braces to make it valid JSON if possible or just pass {}
                helmValues = JSON.parse(`{${helmValuesText.replace(/(\w+):/g, '"$1":')} }`);
            }
            onDeploy({ ...config, helmValues });
        } catch (e) {
            // If parsing fails, pass empty object or notify user
            // For now, we'll just log and pass empty to avoid blocking
            console.warn("Failed to parse Helm values:", e);
            onDeploy({ ...config, helmValues: {} });
        }
    };

    const availableDMEModels = ['PM_Data_Model', 'Cell_Config_Model', 'UE_Data_Model'];
    const availableSMEProviders = ['Config_Service', 'Monitoring_Service', 'Analytics_Service'];

    return (
        <div className="modal-backdrop animate-fade-in" onClick={onClose}>
            <div className="modal-content animate-scale-in max-w-4xl" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Deploy {rapp.name}</h2>
                        <p style={{ color: 'var(--text-muted)' }}>Configure deployment settings</p>
                    </div>
                    <button onClick={onClose} className="btn-ghost p-2">
                        <FiX className="w-5 h-5" />
                    </button>
                </div>

                {/* Step Indicator */}
                <div className="flex items-center justify-between mb-8">
                    {['Namespace', 'Resources', 'Integrations', 'Review'].map((label, idx) => (
                        <div key={label} className="flex items-center flex-1">
                            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step > idx + 1 ? 'bg-green-500' : step === idx + 1 ? 'bg-primary-600' : 'bg-gray-600'
                                }`}>
                                {step > idx + 1 ? <FiCheck className="w-5 h-5 text-white" /> : <span className="text-white text-sm">{idx + 1}</span>}
                            </div>
                            <div className="flex-1 ml-2">
                                <p className="text-xs font-medium" style={{ color: step >= idx + 1 ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                                    {label}
                                </p>
                            </div>
                            {idx < 3 && <div className={`h-0.5 flex-1 ${step > idx + 1 ? 'bg-green-500' : 'bg-gray-600'}`} />}
                        </div>
                    ))}
                </div>

                {/* Error Display */}
                {errors.length > 0 && (
                    <div className="bg-red-500/20 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg mb-4">
                        <ul className="list-disc list-inside">
                            {errors.map((error, idx) => <li key={idx}>{error}</li>)}
                        </ul>
                    </div>
                )}

                {/* Step Content */}
                <div className="min-h-[400px] mb-6">
                    {/* Step 1: Namespace */}
                    {step === 1 && (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                                    Kubernetes Namespace
                                </label>
                                <input
                                    type="text"
                                    value={config.namespace}
                                    onChange={(e) => setConfig({ ...config, namespace: e.target.value })}
                                    className="input"
                                    placeholder="default"
                                />
                                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                                    The Kubernetes namespace where the rApp will be deployed
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>
                                    Helm Values Override (YAML)
                                </label>
                                <textarea
                                    value={helmValuesText}
                                    onChange={(e) => setHelmValuesText(e.target.value)}
                                    className="input font-mono text-sm"
                                    rows={10}
                                    placeholder="key: value"
                                />
                                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                                    Custom Helm values to override defaults
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Resources */}
                    {step === 2 && (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>
                                    Resource Sizing
                                </label>
                                <div className="grid grid-cols-3 gap-4">
                                    {(['small', 'medium', 'large'] as const).map(size => (
                                        <button
                                            key={size}
                                            onClick={() => handleResourceSizeChange(size)}
                                            className={`card text-center p-4 cursor-pointer transition-all ${config.resourceSize === size ? 'border-primary-600 bg-primary-600/10' : ''
                                                }`}
                                        >
                                            <FiCpu className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--text-primary)' }} />
                                            <h4 className="font-semibold mb-2 capitalize" style={{ color: 'var(--text-primary)' }}>{size}</h4>
                                            <div className="text-xs space-y-1" style={{ color: 'var(--text-muted)' }}>
                                                <p>CPU: {RESOURCE_PRESETS[size].cpu}</p>
                                                <p>Memory: {RESOURCE_PRESETS[size].memory}</p>
                                                <p>Storage: {RESOURCE_PRESETS[size].storage}</p>
                                                <p>Replicas: {RESOURCE_PRESETS[size].replicas}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {config.resourceSize === 'custom' && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>CPU</label>
                                        <input
                                            type="text"
                                            value={config.customResources?.cpu}
                                            onChange={(e) => setConfig({
                                                ...config,
                                                customResources: { ...config.customResources!, cpu: e.target.value }
                                            })}
                                            className="input"
                                            placeholder="500m"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Memory</label>
                                        <input
                                            type="text"
                                            value={config.customResources?.memory}
                                            onChange={(e) => setConfig({
                                                ...config,
                                                customResources: { ...config.customResources!, memory: e.target.value }
                                            })}
                                            className="input"
                                            placeholder="1Gi"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Storage</label>
                                        <input
                                            type="text"
                                            value={config.customResources?.storage}
                                            onChange={(e) => setConfig({
                                                ...config,
                                                customResources: { ...config.customResources!, storage: e.target.value }
                                            })}
                                            className="input"
                                            placeholder="10Gi"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>GPU</label>
                                        <input
                                            type="number"
                                            value={config.customResources?.gpu}
                                            onChange={(e) => setConfig({
                                                ...config,
                                                customResources: { ...config.customResources!, gpu: parseInt(e.target.value) }
                                            })}
                                            className="input"
                                            placeholder="0"
                                        />
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={config.autoscaling.enabled}
                                        onChange={(e) => setConfig({
                                            ...config,
                                            autoscaling: { ...config.autoscaling, enabled: e.target.checked }
                                        })}
                                        className="w-4 h-4"
                                    />
                                    <span style={{ color: 'var(--text-primary)' }}>Enable Autoscaling</span>
                                </label>
                            </div>

                            {config.autoscaling.enabled && (
                                <div className="grid grid-cols-3 gap-4 pl-6">
                                    <div>
                                        <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Min Replicas</label>
                                        <input
                                            type="number"
                                            value={config.autoscaling.minReplicas}
                                            onChange={(e) => setConfig({
                                                ...config,
                                                autoscaling: { ...config.autoscaling, minReplicas: parseInt(e.target.value) }
                                            })}
                                            className="input"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Max Replicas</label>
                                        <input
                                            type="number"
                                            value={config.autoscaling.maxReplicas}
                                            onChange={(e) => setConfig({
                                                ...config,
                                                autoscaling: { ...config.autoscaling, maxReplicas: parseInt(e.target.value) }
                                            })}
                                            className="input"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Target CPU %</label>
                                        <input
                                            type="number"
                                            value={config.autoscaling.targetCPUUtilization}
                                            onChange={(e) => setConfig({
                                                ...config,
                                                autoscaling: { ...config.autoscaling, targetCPUUtilization: parseInt(e.target.value) }
                                            })}
                                            className="input"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 3: Integrations */}
                    {step === 3 && (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>
                                    <FiDatabase className="inline w-4 h-4 mr-1" />
                                    DME Models
                                </label>
                                <div className="space-y-2">
                                    {availableDMEModels.map(model => (
                                        <label key={model} className="flex items-center space-x-2 cursor-pointer p-2 hover:bg-dark-lighter rounded">
                                            <input
                                                type="checkbox"
                                                checked={config.dmeModels.includes(model)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setConfig({ ...config, dmeModels: [...config.dmeModels, model] });
                                                    } else {
                                                        setConfig({ ...config, dmeModels: config.dmeModels.filter(m => m !== model) });
                                                    }
                                                }}
                                                className="w-4 h-4"
                                            />
                                            <span style={{ color: 'var(--text-primary)' }}>{model}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>
                                    <FiServer className="inline w-4 h-4 mr-1" />
                                    SME Provider
                                </label>
                                <select
                                    value={config.smeProvider}
                                    onChange={(e) => setConfig({ ...config, smeProvider: e.target.value })}
                                    className="input"
                                >
                                    <option value="">None</option>
                                    {availableSMEProviders.map(provider => (
                                        <option key={provider} value={provider}>{provider}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Review */}
                    {step === 4 && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Review Configuration</h3>

                            <div className="card space-y-3">
                                <div className="flex justify-between">
                                    <span style={{ color: 'var(--text-muted)' }}>Namespace:</span>
                                    <span style={{ color: 'var(--text-primary)' }} className="font-medium">{config.namespace}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span style={{ color: 'var(--text-muted)' }}>Resource Size:</span>
                                    <span style={{ color: 'var(--text-primary)' }} className="font-medium capitalize">{config.resourceSize}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span style={{ color: 'var(--text-muted)' }}>Autoscaling:</span>
                                    <span style={{ color: 'var(--text-primary)' }} className="font-medium">
                                        {config.autoscaling.enabled ? `Yes (${config.autoscaling.minReplicas}-${config.autoscaling.maxReplicas})` : 'No'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span style={{ color: 'var(--text-muted)' }}>DME Models:</span>
                                    <span style={{ color: 'var(--text-primary)' }} className="font-medium">
                                        {config.dmeModels.length > 0 ? config.dmeModels.join(', ') : 'None'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span style={{ color: 'var(--text-muted)' }}>SME Provider:</span>
                                    <span style={{ color: 'var(--text-primary)' }} className="font-medium">{config.smeProvider || 'None'}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Buttons */}
                <div className="flex justify-between">
                    <button
                        onClick={() => setStep(Math.max(1, step - 1))}
                        disabled={step === 1}
                        className="btn-secondary disabled:opacity-50"
                    >
                        Previous
                    </button>
                    <div className="flex space-x-3">
                        <button onClick={onClose} className="btn-secondary">Cancel</button>
                        {step < 4 ? (
                            <button onClick={() => setStep(step + 1)} className="btn-primary">
                                Next
                            </button>
                        ) : (
                            <button onClick={handleDeploy} className="btn-primary">
                                <FiPlay className="w-4 h-4 mr-2 inline" />
                                Deploy
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Lifecycle Manager Component
export const LifecycleManager = ({ rapp, instanceId, onAction }: LifecycleManagerProps) => {
    const lifecycleButtons = [
        { action: 'deploy' as LifecycleAction, label: 'Deploy', icon: FiPlay, color: 'primary', show: rapp.state === 'PRIMED' },
        { action: 'start' as LifecycleAction, label: 'Start', icon: FiPlay, color: 'success', show: rapp.state === 'DEPLOYED' },
        { action: 'stop' as LifecycleAction, label: 'Stop', icon: FiPause, color: 'warning', show: rapp.state === 'DEPLOYED' },
        { action: 'restart' as LifecycleAction, label: 'Restart', icon: FiRotateCw, color: 'info', show: rapp.state === 'DEPLOYED' },
        { action: 'upgrade' as LifecycleAction, label: 'Upgrade', icon: FiUpload, color: 'info', show: rapp.state === 'DEPLOYED' },
        { action: 'rollback' as LifecycleAction, label: 'Rollback', icon: FiDownload, color: 'warning', show: rapp.state === 'DEPLOYED' },
        { action: 'uninstall' as LifecycleAction, label: 'Uninstall', icon: FiTrash2, color: 'error', show: true },
    ];

    return (
        <div className="flex flex-wrap gap-2">
            {lifecycleButtons.filter(btn => btn.show).map(btn => (
                <button
                    key={btn.action}
                    onClick={() => onAction(btn.action)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg font-medium transition-all ${btn.color === 'primary' ? 'btn-primary' :
                        btn.color === 'success' ? 'bg-green-600 hover:bg-green-700 text-white' :
                            btn.color === 'warning' ? 'bg-yellow-600 hover:bg-yellow-700 text-white' :
                                btn.color === 'error' ? 'bg-red-600 hover:bg-red-700 text-white' :
                                    'btn-secondary'
                        }`}
                >
                    <btn.icon className="w-4 h-4" />
                    <span>{btn.label}</span>
                </button>
            ))}
        </div>
    );
};

// Real-time Deployment Logs Viewer
export const DeploymentLogsViewer = ({ rappId, instanceId, isOpen, onClose }: DeploymentLogsProps) => {
    const [logs, setLogs] = useState<DeploymentLog[]>([]);
    const [podEvents, setPodEvents] = useState<PodEvent[]>([]);
    const [imagePulls, setImagePulls] = useState<ImagePullStatus[]>([]);
    const [probes, setProbes] = useState<ProbeStatus[]>([]);
    const [activeTab, setActiveTab] = useState<'logs' | 'events' | 'images' | 'probes'>('logs');

    // Simulate real-time log streaming
    useEffect(() => {
        if (!isOpen) return;

        const mockLogs: DeploymentLog[] = [
            { id: '1', timestamp: new Date(), type: 'helm', severity: 'info', message: 'Starting Helm installation...', source: 'helm' },
            { id: '2', timestamp: new Date(), type: 'helm', severity: 'success', message: 'Chart downloaded successfully', source: 'helm' },
            { id: '3', timestamp: new Date(), type: 'pod', severity: 'info', message: 'Pod rapp-energy-0 created', source: 'k8s' },
            { id: '4', timestamp: new Date(), type: 'image', severity: 'info', message: 'Pulling image oran/rapp:1.0.0', source: 'kubelet' },
            { id: '5', timestamp: new Date(), type: 'image', severity: 'success', message: 'Image pulled successfully', source: 'kubelet' },
            { id: '6', timestamp: new Date(), type: 'pod', severity: 'info', message: 'Pod rapp-energy-0 started', source: 'k8s' },
            { id: '7', timestamp: new Date(), type: 'probe', severity: 'success', message: 'Readiness probe passed', source: 'kubelet' },
            { id: '8', timestamp: new Date(), type: 'helm', severity: 'success', message: 'Deployment successful', source: 'helm' },
        ];

        const mockPodEvents: PodEvent[] = [
            { name: 'rapp-energy-0', namespace: 'default', phase: 'Running', reason: 'Started', message: 'Pod started successfully', timestamp: new Date() },
            { name: 'rapp-energy-1', namespace: 'default', phase: 'Running', reason: 'Started', message: 'Pod started successfully', timestamp: new Date() },
        ];

        const mockImagePulls: ImagePullStatus[] = [
            { image: 'oran/rapp:1.0.0', status: 'pulled', progress: 100 },
        ];

        const mockProbes: ProbeStatus[] = [
            { type: 'readiness', status: 'passing', lastCheck: new Date(), failureCount: 0 },
            { type: 'liveness', status: 'passing', lastCheck: new Date(), failureCount: 0 },
        ];

        setTimeout(() => {
            setLogs(mockLogs);
            setPodEvents(mockPodEvents);
            setImagePulls(mockImagePulls);
            setProbes(mockProbes);
        }, 500);
    }, [isOpen]);

    if (!isOpen) return null;

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'success': return 'text-green-400';
            case 'warning': return 'text-yellow-400';
            case 'error': return 'text-red-400';
            default: return 'text-blue-400';
        }
    };

    return (
        <div className="modal-backdrop animate-fade-in" onClick={onClose}>
            <div className="modal-content animate-scale-in max-w-5xl" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Deployment Logs</h2>
                        <p style={{ color: 'var(--text-muted)' }}>Instance: {instanceId}</p>
                    </div>
                    <button onClick={onClose} className="btn-ghost p-2">
                        <FiX className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex space-x-1 border-b mb-4" style={{ borderColor: 'var(--border-color)' }}>
                    {[
                        { id: 'logs', label: 'Helm Logs', icon: FiSettings },
                        { id: 'events', label: 'Pod Events', icon: FiInfo },
                        { id: 'images', label: 'Image Pulls', icon: FiLoader },
                        { id: 'probes', label: 'Probes', icon: FiCheckCircle },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center space-x-2 px-4 py-2 border-b-2 transition-colors ${activeTab === tab.id
                                ? 'border-primary-600'
                                : 'border-transparent hover:border-gray-600'
                                }`}
                            style={{ color: activeTab === tab.id ? '#2563eb' : 'var(--text-muted)' }}
                        >
                            <tab.icon className="w-4 h-4" />
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="bg-dark-card rounded-lg p-4 max-h-[500px] overflow-y-auto custom-scrollbar font-mono text-sm">
                    {activeTab === 'logs' && (
                        <div className="space-y-1">
                            {logs.map(log => (
                                <div key={log.id} className="flex items-start space-x-2">
                                    <span className="text-gray-500 text-xs">{log.timestamp.toLocaleTimeString()}</span>
                                    <span className={`${getSeverityColor(log.severity)} flex-shrink-0`}>
                                        [{log.type.toUpperCase()}]
                                    </span>
                                    <span style={{ color: 'var(--text-primary)' }}>{log.message}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'events' && (
                        <div className="space-y-2">
                            {podEvents.map((event, idx) => (
                                <div key={idx} className="card p-3">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{event.name}</span>
                                        <span className={`badge ${event.phase === 'Running' ? 'badge-success' :
                                            event.phase === 'Failed' ? 'badge-error' :
                                                'badge-warning'
                                            }`}>{event.phase}</span>
                                    </div>
                                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{event.message}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'images' && (
                        <div className="space-y-2">
                            {imagePulls.map((image, idx) => (
                                <div key={idx} className="card p-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <span style={{ color: 'var(--text-primary)' }}>{image.image}</span>
                                        <span className={`badge ${image.status === 'pulled' ? 'badge-success' :
                                            image.status === 'failed' ? 'badge-error' :
                                                'badge-warning'
                                            }`}>{image.status}</span>
                                    </div>
                                    {image.progress !== undefined && (
                                        <div className="w-full bg-dark-lighter rounded-full h-2">
                                            <div
                                                className="bg-primary-600 h-2 rounded-full transition-all"
                                                style={{ width: `${image.progress}%` }}
                                            />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'probes' && (
                        <div className="space-y-2">
                            {probes.map((probe, idx) => (
                                <div key={idx} className="card p-3 flex items-center justify-between">
                                    <div>
                                        <span className="font-medium capitalize" style={{ color: 'var(--text-primary)' }}>{probe.type} Probe</span>
                                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                            Last check: {probe.lastCheck.toLocaleTimeString()}
                                        </p>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        {probe.status === 'passing' ? <FiCheckCircle className="w-5 h-5 text-green-400" /> :
                                            <FiAlertCircle className="w-5 h-5 text-red-400" />
                                        }
                                        <span className={`badge ${probe.status === 'passing' ? 'badge-success' : 'badge-error'}`}>
                                            {probe.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="mt-6 flex justify-end">
                    <button onClick={onClose} className="btn-secondary">Close</button>
                </div>
            </div>
        </div>
    );
};
