import { useState } from 'react';
import {
    FiCpu, FiPlay, FiUpload, FiDownload, FiTrash2, FiLink,
    FiClock, FiDatabase, FiZap, FiCheckCircle, FiAlertCircle,
    FiRefreshCw, FiTag, FiCode, FiBox
} from 'react-icons/fi';

type ModelTab = 'registry' | 'inference';

interface AiModel {
    id: string;
    name: string;
    version: string;
    framework: 'TensorFlow' | 'PyTorch' | 'ONNX' | 'Scikit-learn';
    type: 'classification' | 'regression' | 'clustering' | 'reinforcement';
    description: string;
    uploadedBy: string;
    uploadedAt: Date;
    size: number; // bytes
    inputShape: string;
    outputShape: string;
    linkedRapps: string[];
    gpuMemoryUsage: number; // MB
    inferenceLatency: number; // ms
    accuracy?: number;
    tags: string[];
    status: 'active' | 'deprecated' | 'pending';
    endpoint: string;
}

interface InferenceRequest {
    id: string;
    timestamp: Date;
    modelId: string;
    modelName: string;
    input: any;
    output?: any;
    latency: number;
    cached: boolean;
    gpuUtilization?: number;
    error?: string;
}

// Mock AI Models
const MOCK_AI_MODELS: AiModel[] = [
    {
        id: 'model-1',
        name: 'Energy Prediction Model',
        version: '2.1.0',
        framework: 'TensorFlow',
        type: 'regression',
        description: 'Predicts energy consumption based on cell load and time of day',
        uploadedBy: 'admin',
        uploadedAt: new Date('2025-01-15'),
        size: 247 * 1024 * 1024, // 247 MB
        inputShape: '(batch, 24, 5)',
        outputShape: '(batch, 1)',
        linkedRapps: ['rapp-energy', 'rapp-optimizer'],
        gpuMemoryUsage: 1024,
        inferenceLatency: 12,
        accuracy: 94.5,
        tags: ['Energy', 'Prediction', 'Time-series'],
        status: 'active',
        endpoint: '/api/v1/inference/energy-prediction',
    },
    {
        id: 'model-2',
        name: 'Traffic Classification',
        version: '1.5.2',
        framework: 'PyTorch',
        type: 'classification',
        description: 'Classifies network traffic patterns for optimal routing',
        uploadedBy: 'operator1',
        uploadedAt: new Date('2025-02-01'),
        size: 189 * 1024 * 1024,
        inputShape: '(batch, 128)',
        outputShape: '(batch, 10)',
        linkedRapps: ['rapp-traffic'],
        gpuMemoryUsage: 768,
        inferenceLatency: 8,
        accuracy: 97.2,
        tags: ['Traffic', 'Classification', 'QoS'],
        status: 'active',
        endpoint: '/api/v1/inference/traffic-classification',
    },
    {
        id: 'model-3',
        name: 'Cell Clustering',
        version: '3.0.0',
        framework: 'Scikit-learn',
        type: 'clustering',
        description: 'Groups cells based on similar characteristics for optimization',
        uploadedBy: 'admin',
        uploadedAt: new Date('2024-12-10'),
        size: 45 * 1024 * 1024,
        inputShape: '(n_samples, 15)',
        outputShape: '(n_samples,)',
        linkedRapps: ['rapp-optimizer'],
        gpuMemoryUsage: 256,
        inferenceLatency: 5,
        tags: ['Clustering', 'Optimization'],
        status: 'active',
        endpoint: '/api/v1/inference/cell-clustering',
    },
    {
        id: 'model-4',
        name: 'Legacy Traffic Model',
        version: '1.0.0',
        framework: 'TensorFlow',
        type: 'classification',
        description: 'Deprecated traffic classification model',
        uploadedBy: 'admin',
        uploadedAt: new Date('2024-06-01'),
        size: 156 * 1024 * 1024,
        inputShape: '(batch, 64)',
        outputShape: '(batch, 5)',
        linkedRapps: [],
        gpuMemoryUsage: 512,
        inferenceLatency: 15,
        accuracy: 89.1,
        tags: ['Traffic', 'Legacy'],
        status: 'deprecated',
        endpoint: '/api/v1/inference/legacy-traffic',
    },
];

export const AiModelManagement = () => {
    const [activeTab, setActiveTab] = useState<ModelTab>('registry');
    const [models] = useState<AiModel[]>(MOCK_AI_MODELS);
    const [selectedModel, setSelectedModel] = useState<AiModel | null>(null);
    const [showUploadModal, setShowUploadModal] = useState(false);

    // Inference testing state
    const [inferenceInput, setInferenceInput] = useState('');
    const [inferenceHistory, setInferenceHistory] = useState<InferenceRequest[]>([]);
    const [testingInProgress, setTestingInProgress] = useState(false);
    const [lastInference, setLastInference] = useState<InferenceRequest | null>(null);

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    const getFrameworkBadge = (framework: string) => {
        const badges: Record<string, string> = {
            TensorFlow: 'badge-warning',
            PyTorch: 'badge-error',
            ONNX: 'badge-info',
            'Scikit-learn': 'badge-success',
        };
        return badges[framework] || 'badge-secondary';
    };

    const getStatusBadge = (status: string) => {
        const badges: Record<string, string> = {
            active: 'badge-success',
            deprecated: 'badge-secondary',
            pending: 'badge-warning',
        };
        return badges[status] || 'badge-secondary';
    };

    const runInference = async () => {
        if (!selectedModel) return;

        setTestingInProgress(true);
        const startTime = Date.now();

        try {
            const input = JSON.parse(inferenceInput);

            // Simulate inference with cache check
            const isCached = Math.random() > 0.7; // 30% cache hit rate
            const baseLatency = selectedModel.inferenceLatency;
            const actualLatency = isCached ? baseLatency * 0.1 : baseLatency + Math.random() * 10;

            await new Promise(resolve => setTimeout(resolve, actualLatency));

            // Mock output based on model type
            let output;
            if (selectedModel.type === 'classification') {
                output = { classes: ['class_0', 'class_1', 'class_2'], probabilities: [0.7, 0.2, 0.1], predicted: 'class_0' };
            } else if (selectedModel.type === 'regression') {
                output = { prediction: 1234.56, confidence: 0.92 };
            } else {
                output = { cluster: 2, distance: 0.45 };
            }

            const request: InferenceRequest = {
                id: `inf-${Date.now()}`,
                timestamp: new Date(),
                modelId: selectedModel.id,
                modelName: selectedModel.name,
                input,
                output,
                latency: Date.now() - startTime,
                cached: isCached,
                gpuUtilization: isCached ? 10 : (50 + Math.random() * 40),
            };

            setLastInference(request);
            setInferenceHistory([request, ...inferenceHistory]);
        } catch (error: any) {
            const request: InferenceRequest = {
                id: `inf-${Date.now()}`,
                timestamp: new Date(),
                modelId: selectedModel.id,
                modelName: selectedModel.name,
                input: inferenceInput,
                latency: Date.now() - startTime,
                cached: false,
                error: error.message,
            };
            setLastInference(request);
            setInferenceHistory([request, ...inferenceHistory]);
        } finally {
            setTestingInProgress(false);
        }
    };

    const loadExampleInput = () => {
        if (!selectedModel) return;

        const examples: Record<string, any> = {
            'classification': {
                features: [0.5, 0.3, 0.8, 0.1, 0.9],
                metadata: { timestamp: new Date().toISOString() },
            },
            'regression': {
                time_of_day: 14,
                day_of_week: 2,
                load_values: [45, 52, 61, 58, 55],
            },
            'clustering': {
                features: [1.2, 3.4, 2.1, 0.8, 4.5],
            },
        };

        setInferenceInput(JSON.stringify(examples[selectedModel.type] || {}, null, 2));
    };

    return (
        <div className="p-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2 flex items-center" style={{ color: 'var(--text-primary)' }}>
                    <FiCpu className="w-8 h-8 mr-3" />
                    AI/ML Model Management (ACM)
                </h1>
                <p style={{ color: 'var(--text-muted)' }}>AI/ML Catalog & Model inference for rApp intelligence</p>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 border-b mb-8" style={{ borderColor: 'var(--border-color)' }}>
                {[
                    { id: 'registry', label: 'Model Registry', icon: FiDatabase },
                    { id: 'inference', label: 'Inference Testing', icon: FiZap },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as ModelTab)}
                        className={`flex items-center space-x-2 px-6 py-3 border-b-2 transition-colors ${activeTab === tab.id ? 'border-primary-600' : 'border-transparent hover:border-gray-600'
                            }`}
                        style={{ color: activeTab === tab.id ? '#2563eb' : 'var(--text-muted)' }}
                    >
                        <tab.icon className="w-5 h-5" />
                        <span className="font-medium">{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Model Registry Tab */}
            {activeTab === 'registry' && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>AI Models ({models.length})</h2>
                        <button onClick={() => setShowUploadModal(true)} className="btn-primary flex items-center space-x-2">
                            <FiUpload className="w-4 h-4" />
                            <span>Upload Model</span>
                        </button>
                    </div>

                    {/* Models Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {models.map(model => (
                            <div key={model.id} className="card hover:border-primary-600 transition-all cursor-pointer"
                                onClick={() => setSelectedModel(selectedModel?.id === model.id ? null : model)}>
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-2 mb-1">
                                            <h3 className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>{model.name}</h3>
                                            <span className="badge-info text-xs">v{model.version}</span>
                                        </div>
                                        <p className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>{model.description}</p>
                                    </div>
                                    <span className={getStatusBadge(model.status)}>{model.status}</span>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-3">
                                    <div>
                                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Framework</span>
                                        <div className="mt-1">
                                            <span className={getFrameworkBadge(model.framework)}>{model.framework}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Type</span>
                                        <p className="text-sm font-medium capitalize mt-1" style={{ color: 'var(--text-secondary)' }}>{model.type}</p>
                                    </div>
                                    <div>
                                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Size</span>
                                        <p className="text-sm font-medium mt-1" style={{ color: 'var(--text-secondary)' }}>{formatBytes(model.size)}</p>
                                    </div>
                                    <div>
                                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>GPU Memory</span>
                                        <p className="text-sm font-medium mt-1" style={{ color: 'var(--text-secondary)' }}>{model.gpuMemoryUsage} MB</p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center space-x-4">
                                        <div className="flex items-center space-x-1" style={{ color: 'var(--text-muted)' }}>
                                            <FiClock className="w-4 h-4" />
                                            <span>{model.inferenceLatency}ms</span>
                                        </div>
                                        {model.accuracy && (
                                            <div className="flex items-center space-x-1 text-green-400">
                                                <FiCheckCircle className="w-4 h-4" />
                                                <span>{model.accuracy}%</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center space-x-1" style={{ color: 'var(--text-muted)' }}>
                                        <FiLink className="w-4 h-4" />
                                        <span>{model.linkedRapps.length} rApp{model.linkedRapps.length !== 1 ? 's' : ''}</span>
                                    </div>
                                </div>

                                {selectedModel?.id === model.id && (
                                    <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
                                        <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                                            <div>
                                                <span style={{ color: 'var(--text-muted)' }}>Input Shape:</span>
                                                <code className="ml-2 text-xs" style={{ color: 'var(--text-secondary)' }}>{model.inputShape}</code>
                                            </div>
                                            <div>
                                                <span style={{ color: 'var(--text-muted)' }}>Output Shape:</span>
                                                <code className="ml-2 text-xs" style={{ color: 'var(--text-secondary)' }}>{model.outputShape}</code>
                                            </div>
                                        </div>

                                        <div className="mb-3">
                                            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Linked rApps:</span>
                                            <div className="flex flex-wrap gap-2 mt-1">
                                                {model.linkedRapps.length > 0 ? (
                                                    model.linkedRapps.map(rappId => (
                                                        <span key={rappId} className="badge-info text-xs">{rappId}</span>
                                                    ))
                                                ) : (
                                                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>No linked rApps</span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="mb-3">
                                            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Tags:</span>
                                            <div className="flex flex-wrap gap-2 mt-1">
                                                {model.tags.map(tag => (
                                                    <span key={tag} className="badge-secondary text-xs flex items-center space-x-1">
                                                        <FiTag className="w-3 h-3" />
                                                        <span>{tag}</span>
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                            Uploaded {model.uploadedAt.toLocaleDateString()} by {model.uploadedBy}
                                        </div>

                                        <div className="mt-4 flex space-x-2">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setActiveTab('inference');
                                                    setSelectedModel(model);
                                                    loadExampleInput();
                                                }}
                                                className="btn-primary flex-1 text-sm flex items-center justify-center space-x-1"
                                            >
                                                <FiPlay className="w-4 h-4" />
                                                <span>Test Inference</span>
                                            </button>
                                            <button className="btn-ghost p-2">
                                                <FiDownload className="w-4 h-4" />
                                            </button>
                                            <button className="btn-ghost p-2 text-red-400">
                                                <FiTrash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Inference Testing Tab */}
            {activeTab === 'inference' && (
                <div className="grid grid-cols-3 gap-6">
                    {/* Left: Model Selection */}
                    <div className="space-y-4">
                        <div className="card">
                            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Select Model</h3>
                            <div className="space-y-2">
                                {models.filter(m => m.status === 'active').map(model => (
                                    <button
                                        key={model.id}
                                        onClick={() => {
                                            setSelectedModel(model);
                                            loadExampleInput();
                                        }}
                                        className={`w-full text-left p-3 rounded-lg border transition-all ${selectedModel?.id === model.id
                                                ? 'border-primary-600 bg-primary-600/10'
                                                : 'border-dark-border hover:border-primary-600/50'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{model.name}</span>
                                            <span className="text-xs badge-info">v{model.version}</span>
                                        </div>
                                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                            {model.framework} • {model.inferenceLatency}ms
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* GPU Usage */}
                        {selectedModel && (
                            <div className="card">
                                <h3 className="text-sm font-semibold mb-3 flex items-center" style={{ color: 'var(--text-secondary)' }}>
                                    <FiCpu className="w-4 h-4 mr-2" />
                                    GPU Resources
                                </h3>
                                <div className="space-y-3">
                                    <div>
                                        <div className="flex items-center justify-between mb-1 text-xs">
                                            <span style={{ color: 'var(--text-muted)' }}>Memory</span>
                                            <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                                                {selectedModel.gpuMemoryUsage} MB
                                            </span>
                                        </div>
                                        <div className="w-full bg-dark-lighter rounded-full h-2">
                                            <div
                                                className="h-2 rounded-full bg-purple-500"
                                                style={{ width: `${(selectedModel.gpuMemoryUsage / 2048) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                    {lastInference && lastInference.gpuUtilization && (
                                        <div>
                                            <div className="flex items-center justify-between mb-1 text-xs">
                                                <span style={{ color: 'var(--text-muted)' }}>Utilization</span>
                                                <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                                                    {lastInference.gpuUtilization.toFixed(1)}%
                                                </span>
                                            </div>
                                            <div className="w-full bg-dark-lighter rounded-full h-2">
                                                <div
                                                    className={`h-2 rounded-full ${lastInference.gpuUtilization > 80 ? 'bg-red-500' :
                                                            lastInference.gpuUtilization > 60 ? 'bg-yellow-500' : 'bg-green-500'
                                                        }`}
                                                    style={{ width: `${lastInference.gpuUtilization}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Center/Right: Testing Interface */}
                    <div className="col-span-2 space-y-4">
                        {selectedModel ? (
                            <>
                                <div className="card">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                                            Test: {selectedModel.name}
                                        </h3>
                                        <button onClick={loadExampleInput} className="btn-ghost text-sm flex items-center space-x-1">
                                            <FiCode className="w-4 h-4" />
                                            <span>Load Example</span>
                                        </button>
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                                            Input (JSON)
                                        </label>
                                        <textarea
                                            value={inferenceInput}
                                            onChange={(e) => setInferenceInput(e.target.value)}
                                            className="input font-mono text-sm"
                                            rows={10}
                                            placeholder='{ "features": [...] }'
                                        />
                                    </div>

                                    <button
                                        onClick={runInference}
                                        disabled={testingInProgress || !inferenceInput}
                                        className="btn-primary w-full flex items-center justify-center space-x-2 disabled:opacity-50"
                                    >
                                        {testingInProgress ? (
                                            <>
                                                <FiRefreshCw className="w-5 h-5 animate-spin" />
                                                <span>Running Inference...</span>
                                            </>
                                        ) : (
                                            <>
                                                <FiPlay className="w-5 h-5" />
                                                <span>Run Inference</span>
                                            </>
                                        )}
                                    </button>
                                </div>

                                {/* Last Inference Result */}
                                {lastInference && (
                                    <div className="card">
                                        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                                            Inference Result
                                        </h3>

                                        {lastInference.error ? (
                                            <div className="bg-red-500/20 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg flex items-center space-x-2">
                                                <FiAlertCircle className="w-5 h-5" />
                                                <span>{lastInference.error}</span>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="grid grid-cols-3 gap-4 mb-4">
                                                    <div className="card text-center">
                                                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Latency</span>
                                                        <p className="text-2xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>
                                                            {lastInference.latency.toFixed(1)}ms
                                                        </p>
                                                    </div>
                                                    <div className="card text-center">
                                                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Cache</span>
                                                        <p className="text-2xl font-bold mt-1">
                                                            {lastInference.cached ? (
                                                                <span className="text-green-400">HIT</span>
                                                            ) : (
                                                                <span className="text-yellow-400">MISS</span>
                                                            )}
                                                        </p>
                                                    </div>
                                                    <div className="card text-center">
                                                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>GPU %</span>
                                                        <p className="text-2xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>
                                                            {lastInference.gpuUtilization?.toFixed(0) || 0}%
                                                        </p>
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                                                        Output
                                                    </label>
                                                    <div className="card bg-dark p-4 font-mono text-sm overflow-x-auto">
                                                        <pre style={{ color: 'var(--text-secondary)' }}>
                                                            {JSON.stringify(lastInference.output, null, 2)}
                                                        </pre>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}

                                {/* Inference History */}
                                {inferenceHistory.length > 0 && (
                                    <div className="card">
                                        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                                            Test History ({inferenceHistory.length})
                                        </h3>
                                        <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
                                            {inferenceHistory.map(req => (
                                                <div key={req.id} className="card p-3">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex-1">
                                                            <div className="flex items-center space-x-3 mb-1">
                                                                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                                                    {req.modelName}
                                                                </span>
                                                                {req.cached && (
                                                                    <span className="badge-success text-xs">Cached</span>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center space-x-4 text-xs" style={{ color: 'var(--text-muted)' }}>
                                                                <span>{req.timestamp.toLocaleTimeString()}</span>
                                                                <span>•</span>
                                                                <span>{req.latency.toFixed(1)}ms</span>
                                                                {req.gpuUtilization && (
                                                                    <>
                                                                        <span>•</span>
                                                                        <span>GPU: {req.gpuUtilization.toFixed(0)}%</span>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="card text-center py-16">
                                <FiBox className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Select a Model</h3>
                                <p style={{ color: 'var(--text-muted)' }}>Choose a model from the left to start testing</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Upload Modal */}
            {showUploadModal && (
                <div className="modal-backdrop animate-fade-in" onClick={() => setShowUploadModal(false)}>
                    <div className="modal-content animate-scale-in max-w-2xl" onClick={(e) => e.stopPropagation()}>
                        <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Upload AI Model</h2>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Model Name</label>
                                    <input type="text" className="input" placeholder="e.g., Traffic Predictor" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Version</label>
                                    <input type="text" className="input" placeholder="e.g., 1.0.0" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Framework</label>
                                <select className="input">
                                    <option>TensorFlow</option>
                                    <option>PyTorch</option>
                                    <option>ONNX</option>
                                    <option>Scikit-learn</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Model File</label>
                                <div className="border-2 border-dashed rounded-lg p-8 text-center" style={{ borderColor: 'var(--border-color)' }}>
                                    <FiUpload className="w-12 h-12 mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
                                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Drag & drop or click to upload</p>
                                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Supported: .h5, .pt, .onnx, .pkl</p>
                                </div>
                            </div>

                            <div className="flex space-x-3 mt-6">
                                <button className="btn-primary flex-1">Upload Model</button>
                                <button onClick={() => setShowUploadModal(false)} className="btn-secondary flex-1">Cancel</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
