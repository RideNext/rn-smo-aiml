import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FiUpload, FiSearch, FiGrid, FiList, FiFilter, FiX,
  FiPackage, FiAlertCircle, FiCheckCircle,
  FiInfo, FiGitBranch, FiDatabase, FiCpu, FiHardDrive, FiTag,
  FiFileText, FiBox, FiLink, FiEye
} from 'react-icons/fi';
import { rappApi } from '../api/rappApi';
import { Rapp, StatusFilter, CategoryFilter, DeploymentConfig, LifecycleAction, EnhancedRapp } from '../types';
import { DeployWorkflow, LifecycleManager, DeploymentLogsViewer } from '../components/DeploymentComponents';
import { useEnhancedRapps } from '../hooks/useEnhancedRapps';
import { CertificationBadge, CertificationIcon } from '../components/CertificationBadge';
import { KPIMiniDashboard } from '../components/KPIDashboard';

type ViewMode = 'grid' | 'list';
type DetailTab = 'overview' | 'dependencies' | 'versions' | 'content';

interface RappCardProps {
  rapp: EnhancedRapp;
  viewMode: ViewMode;
  onPrime: (id: string) => void;
  onDeploy: (id: string) => void;
  onDelete: (id: string) => void;
  onShowDetails: (rapp: EnhancedRapp) => void;
}

const getStatusBadgeClass = (state: string) => {
  const stateMap: Record<string, string> = {
    'COMMISSIONED': 'badge-info',
    'PRIMED': 'badge-warning',
    'DEPLOYED': 'badge-success',
    'DEPRECATED': 'badge-secondary',
    'PRIMING': 'badge-warning',
    'DEPLOYING': 'badge-warning',
    'UNDEPLOYING': 'badge-warning',
    'DEPRIMING': 'badge-warning',
  };
  return stateMap[state] || 'badge-secondary';
};

const getStatusLabel = (state: string) => {
  const labelMap: Record<string, string> = {
    'COMMISSIONED': 'Available',
    'PRIMED': 'Primed',
    'DEPLOYED': 'Deployed',
    'DEPRECATED': 'Deprecated',
    'PRIMING': 'Priming...',
    'DEPLOYING': 'Deploying...',
  };
  return labelMap[state] || state;
};

// Mock enhanced data - in real app, this would come from the backend

const RappCard = ({ rapp, viewMode, onPrime, onDeploy, onDelete, onShowDetails }: RappCardProps) => {
  // rapp is already enhanced by useEnhancedRapps hook

  if (viewMode === 'list') {
    return (
      <div className="card-hover flex items-center justify-between p-4">
        <div className="flex items-center space-x-4 flex-1">
          <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center flex-shrink-0">
            <FiPackage className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{rapp.name}</h3>

              {/* Certification Icon */}
              <CertificationIcon certification={rapp.certification} />

              {/* Tags */}
              {rapp.tags?.slice(0, 2).map(tag => (
                <span key={tag} className="badge-info text-xs">{tag}</span>
              ))}
            </div>
            <p className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>
              {rapp.provider} • v{rapp.version}
            </p>

            {/* KPI Mini Dashboard */}
            <KPIMiniDashboard kpis={rapp.impactKPIs} />
          </div>
        </div>
        <div className="flex items-center space-x-4">
          {/* UI Lifecycle State Badge */}
          <span
            className={rapp.uiLifecycleState.badgeClass}
            style={{
              backgroundColor: `${rapp.uiLifecycleState.badgeColor}20`,
              color: rapp.uiLifecycleState.badgeColor
            }}
          >
            {rapp.uiLifecycleState.icon} {rapp.uiLifecycleState.label}
          </span>
          {rapp.state === 'COMMISSIONED' && (
            <button onClick={() => onPrime(rapp.name)} className="btn-primary">Prime</button>
          )}
          {rapp.state === 'PRIMING' && (
            <span className="text-yellow-500 animate-pulse text-sm font-medium">Priming...</span>
          )}
          {rapp.state === 'PRIMED' && (
            <button onClick={() => onDeploy(rapp.name)} className="btn-primary">Deploy</button>
          )}
          {rapp.state === 'COMMISSIONED' && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(rapp.name); }}
              className="btn-danger hover:bg-red-500/20 text-red-500"
              title="Delete rApp"
            >
              <FiX className="w-4 h-4" />
            </button>
          )}
          <button onClick={() => onShowDetails(rapp)} className="btn-ghost px-3">
            <FiInfo className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card-hover group relative overflow-hidden" onClick={() => onShowDetails(rapp)}>
      {/* Certification Badge (top-left) */}
      <div className="absolute top-4 left-4 z-10">
        <CertificationBadge certification={rapp.certification} size="small" showDetails={false} />
      </div>

      {/* UI Lifecycle State Badge (top-right) */}
      <div className="absolute top-4 right-4 z-10 flex space-x-2">
        <span
          className={`${rapp.uiLifecycleState.badgeClass} ${rapp.uiLifecycleState.animated ? 'animate-pulse' : ''}`}
          style={{
            backgroundColor: `${rapp.uiLifecycleState.badgeColor}20`,
            color: rapp.uiLifecycleState.badgeColor
          }}
        >
          {rapp.uiLifecycleState.icon} {rapp.uiLifecycleState.label}
        </span>
        {rapp.state === 'COMMISSIONED' && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(rapp.name); }}
            className="p-1 rounded-full hover:bg-red-500/20 text-red-500 transition-colors"
            title="Delete rApp"
          >
            <FiX className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Icon */}
      <div className="mb-4">
        <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
          <FiPackage className="w-8 h-8 text-white" />
        </div>
      </div>

      {/* Content */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2 line-clamp-1" style={{ color: 'var(--text-primary)' }}>{rapp.name}</h3>
        <p className="text-sm mb-3 line-clamp-2" style={{ color: 'var(--text-muted)' }}>
          {rapp.description}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mb-3">
          {rapp.tags?.slice(0, 3).map(tag => (
            <span key={tag} className="badge-info text-xs">{tag}</span>
          ))}
        </div>

        {/* KPI Mini Dashboard */}
        <KPIMiniDashboard kpis={rapp.impactKPIs} />

        <div className="flex items-center justify-between text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
          <span>{rapp.provider}</span>
          <span>v{rapp.version}</span>
        </div>
      </div>
    </div>
  );
};

// Dependency Graph Component
const DependencyGraph = ({ dependencies }: { dependencies: any[] }) => (
  <div className="space-y-4">
    {dependencies.map((dep) => (
      <div key={dep.id} className="flex items-start space-x-4 p-4 bg-dark-lighter rounded-lg">
        <div className={`p-2 rounded-lg ${dep.type === 'R1' ? 'bg-blue-500/20 text-blue-400' :
          dep.type === 'A1' ? 'bg-green-500/20 text-green-400' :
            dep.type === 'SME' ? 'bg-purple-500/20 text-purple-400' :
              dep.type === 'DME' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-gray-500/20 text-gray-400'
          }`}>
          <FiLink className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-medium" style={{ color: 'var(--text-primary)' }}>{dep.name}</h4>
            <span className={`badge ${dep.required ? 'badge-error' : 'badge-secondary'}`}>
              {dep.required ? 'Required' : 'Optional'}
            </span>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{dep.description}</p>
          {dep.version && (
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Version: {dep.version}</p>
          )}
        </div>
      </div>
    ))}
  </div>
);

// CSAR Content Browser
const CsarBrowser = ({ files }: { files: any[] }) => {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggleExpand = (path: string) => {
    const newExpanded = new Set(expanded);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpanded(newExpanded);
  };

  const renderFile = (file: any, depth = 0) => (
    <div key={file.path} style={{ marginLeft: `${depth * 20}px` }}>
      <div
        className="flex items-center space-x-2 py-1 px-2 hover:bg-dark-lighter rounded cursor-pointer"
        onClick={() => file.type === 'directory' && toggleExpand(file.path)}
      >
        {file.type === 'directory' ? (
          <FiBox className="w-4 h-4 text-blue-400" />
        ) : (
          <FiFileText className="w-4 h-4 text-gray-400" />
        )}
        <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{file.path}</span>
        {file.size && (
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            ({(file.size / 1024).toFixed(1)} KB)
          </span>
        )}
      </div>
      {file.type === 'directory' && expanded.has(file.path) && file.children?.map((child: any) =>
        renderFile(child, depth + 1)
      )}
    </div>
  );

  return <div className="space-y-1">{files.map(file => renderFile(file))}</div>;
};

export const Catalog = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [providerFilter, setProviderFilter] = useState('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedRapp, setSelectedRapp] = useState<EnhancedRapp | null>(null);
  const [detailTab, setDetailTab] = useState<DetailTab>('overview');
  const [rappId, setRappId] = useState('');
  const [file, setFile] = useState<File | null>(null);

  // Deployment workflow states
  const [showDeployWorkflow, setShowDeployWorkflow] = useState(false);
  const [deployingRapp, setDeployingRapp] = useState<EnhancedRapp | null>(null);

  // Logs viewer states
  const [showLogsViewer, setShowLogsViewer] = useState(false);
  const [logsRappId, setLogsRappId] = useState('');
  const [logsInstanceId, setLogsInstanceId] = useState('');

  const queryClient = useQueryClient();

  // Use enhanced rapps with adapter layer
  const { rapps, isLoading, error } = useEnhancedRapps();


  const onboardMutation = useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => rappApi.createRapp(id, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rapps'] });
      setShowUploadModal(false);
      setRappId('');
      setFile(null);
    },
    onError: (error: any) => {
      alert(`Upload failed: ${error.response?.data?.message || error.message}`);
    },
  });

  const primeMutation = useMutation({
    mutationFn: (id: string) => rappApi.primeRapp(id, 'PRIME'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rapps'] }),
    onError: (error: any) => {
      alert(`Prime failed: ${error.response?.data?.message || error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => rappApi.deleteRapp(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rapps'] }),
    onError: (error: any) => {
      alert(`Delete failed: ${error.response?.data?.message || error.message}`);
    },
  });

  // Handlers for deployment workflow
  const handleShowDeployWorkflow = (rapp: EnhancedRapp) => {
    setDeployingRapp(rapp);
    setShowDeployWorkflow(true);
  };

  const deployMutation = useMutation({
    mutationFn: async ({ rappId, config }: { rappId: string; config: DeploymentConfig }) => {
      // 1. Create an instance first (POST)
      // Use name if passed as rappId, but make sure we are consistent
      // Fix: Must provide ACM instance name to avoid NPE in backend
      const { data: instance } = await rappApi.createInstance(rappId, { acm: { instance: 'k8s-instance' } });

      // 2. Then deploy that instance (PUT)
      if (instance && instance.rappInstanceId) {
        return rappApi.deployInstance(rappId, instance.rappInstanceId, 'DEPLOY');
      } else {
        throw new Error('Failed to create instance: No ID returned');
      }
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['rapps'] });
      setShowDeployWorkflow(false);

      // Show logs viewer for the new instance
      if (deployingRapp) {
        setLogsRappId(deployingRapp.name); // Log viewer also needs to track via Name for consistency if used in APIs
        // FIXME: The backend API response structure for deployInstance needs to be checked.
        // For now, we assume the valid flow will let us check status later.
        // We'll use a placeholder or derived ID if possible, but the mutationFn logic above
        // doesn't easily expose the intermediate instance ID to this callback without extra state.
        // For simple UX, we'll auto-refresh the list.
        setShowLogsViewer(true);
      }
    },
    onError: (error: any) => {
      alert(`Deployment failed: ${error.response?.data?.message || error.message}`);
    },
  });

  const handleDeploy = (config: DeploymentConfig) => {
    if (deployingRapp) {
      // Pass NAME instead of UUID
      deployMutation.mutate({ rappId: deployingRapp.name, config });
    }
  };

  const handleLifecycleAction = (action: LifecycleAction, rapp: EnhancedRapp, config?: DeploymentConfig) => {
    console.log(`Lifecycle action: ${action} for rApp ${rapp.rappId}`, config);

    switch (action) {
      case 'deploy':
        handleShowDeployWorkflow(rapp);
        break;
      case 'start':
      case 'stop':
      case 'restart':
        // TODO: Integrate with actual lifecycle API
        alert(`${action.toUpperCase()} action triggered for ${rapp.name}`);
        break;
      case 'upgrade':
        // TODO: Show version selection
        alert(`Upgrade workflow for ${rapp.name}`);
        break;
      case 'rollback':
        // TODO: Show version  selection for rollback
        alert(`Rollback workflow for ${rapp.name}`);
        break;
      case 'uninstall':
        if (confirm(`Are you sure you want to uninstall ${rapp.name}?`)) {
          // TODO: Integrate with actual uninstall API
          alert(`Uninstalling ${rapp.name}...`);
        }
        break;
    }
  };

  const handleViewLogs = (rappId: string, instanceId: string) => {
    setLogsRappId(rappId);
    setLogsInstanceId(instanceId);
    setShowLogsViewer(true);
  };

  // Rapps are already enhanced by useEnhancedRapps hook
  const enhancedRapps = rapps || [];

  // Get unique providers
  const providers = Array.from(new Set(enhancedRapps.map(r => r.provider).filter(Boolean)));

  // Filter rapps
  const filteredRapps = enhancedRapps.filter(rapp => {
    const matchesSearch = rapp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rapp.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || rapp.state === statusFilter;
    const matchesCategory = categoryFilter === 'all' || rapp.category === categoryFilter;
    const matchesProvider = providerFilter === 'all' || rapp.provider === providerFilter;
    return matchesSearch && matchesStatus && matchesCategory && matchesProvider;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p style={{ color: 'var(--text-muted)' }}>Loading catalog...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="card max-w-md text-center">
          <FiAlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Connection Error</h2>
          <p style={{ color: 'var(--text-muted)' }} className="mb-4">Cannot connect to rApp Manager backend</p>
          <button onClick={() => window.location.reload()} className="btn-primary">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center" style={{ color: 'var(--text-primary)' }}>
              <FiPackage className="w-8 h-8 mr-3" />
              rApp Catalog
            </h1>
            <p style={{ color: 'var(--text-muted)' }}>Browse and manage your rApp packages</p>
          </div>
          <button onClick={() => setShowUploadModal(true)} className="btn-primary flex items-center space-x-2">
            <FiUpload className="w-5 h-5" />
            <span>Upload rApp</span>
          </button>
        </div>

        {/* Enhanced Filters */}
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search by name, description, tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10 w-full"
            />
          </div>

          {/* Filter Row */}
          <div className="flex items-center space-x-4 flex-wrap gap-4">
            {/* Status Filter */}
            <div className="flex items-center space-x-2">
              <FiFilter className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                className="input min-w-[150px]"
              >
                <option value="all">All Status</option>
                <option value="COMMISSIONED">Available</option>
                <option value="PRIMED">Primed</option>
                <option value="DEPLOYED">Deployed</option>
                <option value="DEPRECATED">Deprecated</option>
              </select>
            </div>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as CategoryFilter)}
              className="input min-w-[150px]"
            >
              <option value="all">All Categories</option>
              <option value="AI/ML">AI/ML</option>
              <option value="Optimization">Optimization</option>
              <option value="Energy">Energy</option>
              <option value="SON">SON</option>
              <option value="Traffic Steering">Traffic Steering</option>
              <option value="QoS">QoS</option>
              <option value="Security">Security</option>
            </select>

            {/* Provider Filter */}
            <select
              value={providerFilter}
              onChange={(e) => setProviderFilter(e.target.value)}
              className="input min-w-[150px]"
            >
              <option value="all">All Providers</option>
              {providers.map(provider => (
                <option key={provider} value={provider}>{provider}</option>
              ))}
            </select>

            {/* View Mode */}
            <div className="flex items-center space-x-1 bg-dark-lighter rounded-lg p-1 ml-auto">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-primary-600 text-white' : 'hover:bg-dark-card'}`}
                style={{ color: viewMode === 'grid' ? 'white' : 'var(--text-muted)' }}
                title="Grid View"
              >
                <FiGrid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-primary-600 text-white' : 'hover:bg-dark-card'}`}
                style={{ color: viewMode === 'list' ? 'white' : 'var(--text-muted)' }}
                title="List View"
              >
                <FiList className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-4">
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Showing {filteredRapps.length} of {enhancedRapps.length} rApps
        </p>
      </div>

      {/* rApp Grid/List */}
      {filteredRapps.length === 0 ? (
        <div className="card text-center py-16">
          <FiPackage className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>No rApps Found</h3>
          <p style={{ color: 'var(--text-muted)' }} className="mb-6">
            {searchQuery || statusFilter !== 'all' || categoryFilter !== 'all' || providerFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Get started by uploading your first rApp'}
          </p>
        </div>
      ) : (
        <div className={viewMode === 'grid'
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
          : 'space-y-4'
        }>
          {filteredRapps.map(rapp => (
            <RappCard
              key={rapp.rappId}
              rapp={rapp}
              viewMode={viewMode}
              onPrime={(id) => primeMutation.mutate(id)}
              onDeploy={() => handleShowDeployWorkflow(rapp)}
              onDelete={(id) => {
                if (confirm('Are you sure you want to delete this rApp?')) {
                  deleteMutation.mutate(id);
                }
              }}
              onShowDetails={setSelectedRapp}
            />
          ))}
        </div>
      )}

      {/* Enhanced Details Modal */}
      {selectedRapp && (
        <div className="modal-backdrop animate-fade-in" onClick={() => setSelectedRapp(null)}>
          <div className="modal-content animate-scale-in max-w-4xl" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{selectedRapp.name}</h2>
                  <span className={getStatusBadgeClass(selectedRapp.state)}>
                    {getStatusLabel(selectedRapp.state)}
                  </span>
                </div>
                <p style={{ color: 'var(--text-muted)' }}>{selectedRapp.description}</p>
              </div>
              <button onClick={() => setSelectedRapp(null)} className="btn-ghost p-2">
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 border-b mb-6" style={{ borderColor: 'var(--border-color)' }}>
              {[
                { id: 'overview', label: 'Overview', icon: FiInfo },
                { id: 'dependencies', label: 'Dependencies', icon: FiGitBranch },
                { id: 'versions', label: 'Versions', icon: FiTag },
                { id: 'content', label: 'CSAR Content', icon: FiFileText },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setDetailTab(tab.id as DetailTab)}
                  className={`flex items-center space-x-2 px-4 py-2 border-b-2 transition-colors ${detailTab === tab.id
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent hover:border-gray-600'
                    }`}
                  style={{ color: detailTab === tab.id ? '#2563eb' : 'var(--text-muted)' }}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
              {detailTab === 'overview' && (
                <div className="space-y-6">
                  {/* Metadata Grid */}
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-sm font-semibold uppercase mb-3" style={{ color: 'var(--text-muted)' }}>Basic Information</h3>
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs" style={{ color: 'var(--text-muted)' }}>Provider</label>
                          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{selectedRapp.provider}</p>
                        </div>
                        <div>
                          <label className="text-xs" style={{ color: 'var(--text-muted)' }}>Vendor</label>
                          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{selectedRapp.vendor}</p>
                        </div>
                        <div>
                          <label className="text-xs" style={{ color: 'var(--text-muted)' }}>Version</label>
                          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>v{selectedRapp.version}</p>
                        </div>
                        <div>
                          <label className="text-xs" style={{ color: 'var(--text-muted)' }}>Category</label>
                          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{selectedRapp.category}</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold uppercase mb-3" style={{ color: 'var(--text-muted)' }}>Specifications</h3>
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs" style={{ color: 'var(--text-muted)' }}>O-RAN Releases</label>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {selectedRapp.oranReleases?.map(release => (
                              <span key={release} className="badge-info text-xs">{release}</span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="text-xs" style={{ color: 'var(--text-muted)' }}>Tags</label>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {selectedRapp.tags?.map(tag => (
                              <span key={tag} className="badge-secondary text-xs">{tag}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Resources */}
                  <div>
                    <h3 className="text-sm font-semibold uppercase mb-3" style={{ color: 'var(--text-muted)' }}>
                      <FiCpu className="inline w-4 h-4 mr-1" />
                      Resource Requirements
                    </h3>
                    <div className="grid grid-cols-4 gap-4">
                      <div className="card text-center">
                        <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>CPU</p>
                        <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{selectedRapp.helmChart?.resources?.cpu}</p>
                      </div>
                      <div className="card text-center">
                        <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Memory</p>
                        <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{selectedRapp.helmChart?.resources?.memory}</p>
                      </div>
                      <div className="card text-center">
                        <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Storage</p>
                        <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{selectedRapp.helmChart?.resources?.storage}</p>
                      </div>
                      <div className="card text-center">
                        <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>GPU</p>
                        <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{selectedRapp.helmChart?.resources?.gpu || 0}</p>
                      </div>
                    </div>
                  </div>

                  {/* Required Schemas */}
                  <div>
                    <h3 className="text-sm font-semibold uppercase mb-3" style={{ color: 'var(--text-muted)' }}>
                      <FiDatabase className="inline w-4 h-4 mr-1" />
                      Required R1 Schemas
                    </h3>
                    <div className="space-y-2">
                      {selectedRapp.requiredSchemas?.map(schema => (
                        <div key={schema.name} className="flex items-center justify-between p-3 bg-dark-lighter rounded-lg">
                          <div>
                            <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{schema.name}</p>
                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{schema.type} • v{schema.version}</p>
                          </div>
                          <span className={`badge ${schema.required ? 'badge-error' : 'badge-secondary'}`}>
                            {schema.required ? 'Required' : 'Optional'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Required Datasets */}
                  <div>
                    <h3 className="text-sm font-semibold uppercase mb-3" style={{ color: 'var(--text-muted)' }}>
                      <FiHardDrive className="inline w-4 h-4 mr-1" />
                      Required Datasets
                    </h3>
                    <div className="space-y-2">
                      {selectedRapp.requiredDatasets?.map(dataset => (
                        <div key={dataset.name} className="flex items-center justify-between p-3 bg-dark-lighter rounded-lg">
                          <div>
                            <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{dataset.name}</p>
                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{dataset.type} • {dataset.size} • From: {dataset.source}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {detailTab === 'dependencies' && (
                <div>
                  <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Dependency Graph</h3>
                  <DependencyGraph dependencies={selectedRapp.dependencies || []} />
                </div>
              )}

              {detailTab === 'versions' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Version History</h3>
                  {selectedRapp.versions?.map(version => (
                    <div key={version.version} className="card">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <span className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>v{version.version}</span>
                          {version.deprecated && <span className="badge-error">Deprecated</span>}
                        </div>
                        <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{version.releaseDate}</span>
                      </div>
                      <ul className="space-y-1">
                        {version.changes.map((change, idx) => (
                          <li key={idx} className="text-sm flex items-start">
                            <FiCheckCircle className="w-4 h-4 mr-2 mt-0.5 text-green-400 flex-shrink-0" />
                            <span style={{ color: 'var(--text-secondary)' }}>{change}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}

              {detailTab === 'content' && (
                <div>
                  <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>CSAR Package Contents</h3>
                  <div className="card">
                    <CsarBrowser files={selectedRapp.csarContent || []} />
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="mt-8 pt-6 border-t" style={{ borderColor: 'var(--border-color)' }}>
              <div className="flex items-center justify-between">
                <div>
                  {selectedRapp.state === 'DEPLOYED' && (
                    <button
                      onClick={() => handleViewLogs(selectedRapp.rappId, `${selectedRapp.rappId}-instance-1`)}
                      className="btn-secondary flex items-center space-x-2"
                    >
                      <FiEye className="w-4 h-4" />
                      <span>View Logs</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center space-x-3">
                  {selectedRapp.state === 'COMMISSIONED' && (
                    <button
                      onClick={() => { primeMutation.mutate(selectedRapp.rappId); setSelectedRapp(null); }}
                      className="btn-primary"
                    >
                      Prime rApp
                    </button>
                  )}

                  <LifecycleManager
                    rapp={selectedRapp}
                    onAction={(action, config) => handleLifecycleAction(action, selectedRapp, config)}
                  />

                  <button onClick={() => setSelectedRapp(null)} className="btn-secondary">Close</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="modal-backdrop animate-fade-in" onClick={() => setShowUploadModal(false)}>
          <div className="modal-content animate-scale-in max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Upload rApp Package</h2>
              <button onClick={() => setShowUploadModal(false)} className="btn-ghost p-2">
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>rApp ID</label>
                <input
                  type="text"
                  placeholder="Enter unique rApp identifier"
                  value={rappId}
                  onChange={(e) => setRappId(e.target.value)}
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>CSAR Package</label>
                <div className="relative">
                  <input
                    type="file"
                    accept=".csar"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="input cursor-pointer flex items-center justify-center py-8 border-2 border-dashed"
                  >
                    <div className="text-center">
                      <FiUpload className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
                      <span style={{ color: 'var(--text-muted)' }}>
                        {file ? file.name : 'Click to select CSAR file'}
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <div className="mt-8 flex space-x-3">
              <button
                onClick={() => file && onboardMutation.mutate({ id: rappId, file })}
                disabled={!rappId || !file || onboardMutation.isPending}
                className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {onboardMutation.isPending ? 'Uploading...' : 'Upload'}
              </button>
              <button onClick={() => setShowUploadModal(false)} className="btn-secondary flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Deploy Workflow Modal */}
      {showDeployWorkflow && deployingRapp && (
        <DeployWorkflow
          rapp={deployingRapp}
          onClose={() => setShowDeployWorkflow(false)}
          onDeploy={handleDeploy}
        />
      )}

      {/* Deployment Logs Viewer */}
      <DeploymentLogsViewer
        rappId={logsRappId}
        instanceId={logsInstanceId}
        isOpen={showLogsViewer}
        onClose={() => setShowLogsViewer(false)}
      />
    </div>
  );
};
