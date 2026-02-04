# Catalog Page Integration Example

This document shows how to integrate the adapter layer into the existing Catalog page.

## Step 1: Import Enhanced Hooks and Components

```typescript
// At the top of src/pages/Catalog.tsx
import { useEnhancedRapps } from '../hooks/useEnhancedRapps';
import { CertificationBadge, CertificationIcon } from '../components/CertificationBadge';
import { KPIDashboard, KPIMiniDashboard } from '../components/KPIDashboard';
import { StateAwareActions } from '../components/StateAwareActions';
```

## Step 2: Replace useQuery with useEnhancedRapps

```typescript
// BEFORE:
const { data: rapps, isLoading, error } = useQuery<Rapp[]>({
  queryKey: ['rapps'],
  queryFn: async () => (await rappApi.getRapps()).data,
});

// AFTER:
const { rapps: enhancedRapps, isLoading, error } = useEnhancedRapps();
```

## Step 3: Update RappCard Component

```typescript
const RappCard = ({ rapp, viewMode, onPrime, onDeploy, onShowDetails }: RappCardProps) => {
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
              
              {/* NEW: Certification Icon */}
              <CertificationIcon certification={rapp.certification} />
              
              {/* NEW: UI Lifecycle State Badge */}
              <span 
                className={rapp.uiLifecycleState.badgeClass}
                style={{ 
                  backgroundColor: `${rapp.uiLifecycleState.badgeColor}20`,
                  color: rapp.uiLifecycleState.badgeColor 
                }}
              >
                {rapp.uiLifecycleState.icon} {rapp.uiLifecycleState.label}
              </span>
            </div>
            
            {/* NEW: KPI Mini Dashboard */}
            <KPIMiniDashboard kpis={rapp.impactKPIs} />
          </div>
        </div>
        
        {/* NEW: State-Aware Actions */}
        <StateAwareActions 
          rapp={rapp}
          onAction={(action) => handleLifecycleAction(action, rapp)}
          variant="dropdown"
        />
      </div>
    );
  }

  // Grid view
  return (
    <div className="card-hover group relative overflow-hidden" onClick={() => onShowDetails(rapp)}>
      {/* NEW: Certification Badge (top-left) */}
      <div className="absolute top-4 left-4 z-10">
        <CertificationBadge certification={rapp.certification} size="small" />
      </div>

      {/* NEW: UI Lifecycle State Badge (top-right) */}
      <div className="absolute top-4 right-4 z-10">
        <span 
          className={`${rapp.uiLifecycleState.badgeClass} ${rapp.uiLifecycleState.animated ? 'animate-pulse' : ''}`}
          style={{ 
            backgroundColor: `${rapp.uiLifecycleState.badgeColor}20`,
            color: rapp.uiLifecycleState.badgeColor 
          }}
        >
          {rapp.uiLifecycleState.icon} {rapp.uiLifecycleState.label}
        </span>
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

        {/* NEW: KPI Mini Dashboard */}
        <KPIMiniDashboard kpis={rapp.impactKPIs} />
      </div>
    </div>
  );
};
```

## Step 4: Add KPI Dashboard to Detail Modal

```typescript
{selectedRapp && (
  <div className="modal-backdrop animate-fade-in" onClick={() => setSelectedRapp(null)}>
    <div className="modal-content animate-scale-in max-w-4xl" onClick={(e) => e.stopPropagation()}>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{selectedRapp.name}</h2>
            
            {/* NEW: Certification Badge */}
            <CertificationBadge certification={selectedRapp.certification} />
            
            {/* NEW: UI State Badge */}
            <span className={selectedRapp.uiLifecycleState.badgeClass}>
              {selectedRapp.uiLifecycleState.label}
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
          { id: 'kpis', label: 'Impact KPIs', icon: FiBarChart }, // NEW TAB
          { id: 'dependencies', label: 'Dependencies', icon: FiGitBranch },
          { id: 'versions', label: 'Versions', icon: FiTag },
          { id: 'content', label: 'CSAR Content', icon: FiFileText },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setDetailTab(tab.id as DetailTab)}
            className={`flex items-center space-x-2 px-4 py-2 border-b-2 transition-colors ${
              detailTab === tab.id
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent hover:border-gray-600'
            }`}
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
            {/* Existing overview content */}
          </div>
        )}

        {/* NEW: KPI Tab */}
        {detailTab === 'kpis' && (
          <div>
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              Impact KPIs
            </h3>
            <KPIDashboard kpis={selectedRapp.impactKPIs} variant="full" />
          </div>
        )}

        {/* Other tabs... */}
      </div>

      {/* Footer Actions */}
      <div className="mt-8 pt-6 border-t" style={{ borderColor: 'var(--border-color)' }}>
        <div className="flex items-center justify-between">
          {/* NEW: Governance Warnings */}
          {!selectedRapp.governanceValidation.isCompliant && (
            <div className="flex items-center space-x-2 text-yellow-500">
              <FiAlertCircle />
              <span className="text-sm">
                {selectedRapp.governanceValidation.violations.length} governance issue(s)
              </span>
            </div>
          )}

          {/* NEW: State-Aware Actions */}
          <StateAwareActions
            rapp={selectedRapp}
            onAction={(action) => handleLifecycleAction(action, selectedRapp)}
            variant="buttons"
          />

          <button onClick={() => setSelectedRapp(null)} className="btn-secondary">Close</button>
        </div>
      </div>
    </div>
  </div>
)}
```

## Step 5: Track State Changes

```typescript
// When priming a rApp
const primeMutation = useMutation({
  mutationFn: (id: string) => rappApi.primeRapp(id, 'PRIME'),
  onSuccess: (_, id) => {
    // NEW: Track state change
    const adapter = new RappAdapter();
    const rapp = enhancedRapps.find(r => r.rappId === id);
    if (rapp) {
      adapter.trackStateChange(id, rapp.state, 'PRIMING');
    }
    
    queryClient.invalidateQueries({ queryKey: ['rapps'] });
  },
});

// When deploying an instance
const deployMutation = useMutation({
  mutationFn: ({ rappId, instanceId }: { rappId: string; instanceId: string }) => 
    rappApi.deployInstance(rappId, instanceId, 'DEPLOY'),
  onSuccess: (_, { rappId, instanceId }) => {
    // NEW: Track deployment attempt
    const adapter = new RappAdapter();
    adapter.trackDeployment(rappId, instanceId, true);
    
    queryClient.invalidateQueries({ queryKey: ['rapps'] });
  },
  onError: (error, { rappId, instanceId }) => {
    // NEW: Track failed deployment
    const adapter = new RappAdapter();
    adapter.trackDeployment(rappId, instanceId, false, undefined, error.message);
  },
});
```

## Step 6: Add Cleanup on Mount

```typescript
// In Catalog component
useEffect(() => {
  // Cleanup old cache data on mount
  RappAdapter.cleanupCache();
}, []);
```

## Complete Integration Checklist

- [ ] Import enhanced hooks and components
- [ ] Replace `useQuery` with `useEnhancedRapps`
- [ ] Update RappCard to show certification badges
- [ ] Update RappCard to show UI lifecycle states
- [ ] Add KPI mini dashboard to cards
- [ ] Add KPI dashboard tab to detail modal
- [ ] Replace action buttons with StateAwareActions
- [ ] Track state changes in mutations
- [ ] Track deployment attempts
- [ ] Add cleanup on mount
- [ ] Test all states and transitions
- [ ] Verify governance rules work
- [ ] Check KPI calculations
- [ ] Verify certification badges

## Notes

- The adapter layer is completely transparent to the backend
- All historical data is stored in localStorage
- State derivation happens automatically
- Governance validation is UI-only (backend still enforces its own rules)
- KPIs are calculated on every render (cached with useMemo)
