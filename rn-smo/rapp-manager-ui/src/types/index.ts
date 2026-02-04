export interface Rapp {
  rappId: string;
  name: string;
  state: 'COMMISSIONED' | 'PRIMING' | 'PRIMED' | 'DEPRIMING' | 'DEPLOYED' | 'DEPLOYING' | 'UNDEPLOYING' | 'DELETING' | 'DEPRECATED';
  reason?: string;
  packageName?: string;
  packageLocation?: string;
  rappInstances?: Record<string, RappInstance>;
  rappResources?: {
    acm?: any;
    sme?: SmeResources;
    dme?: DmeResources;
  };
  asdMetadata?: AsdMetadata;
  compositionId?: string;
  // Enhanced metadata
  provider?: string;
  vendor?: string;
  description?: string;
  version?: string;
  versions?: RappVersion[];
  tags?: string[];
  category?: 'AI/ML' | 'Optimization' | 'Energy' | 'SON' | 'Traffic Steering' | 'QoS' | 'Security' | 'Other';
  oranReleases?: string[];
  requiredSchemas?: R1Schema[];
  requiredDatasets?: Dataset[];
  helmChart?: HelmChartDetails;
  csarContent?: CsarFile[];
  dependencies?: RappDependency[];
}

export interface AsdMetadata {
  version?: string;
  description?: string;
  provider?: string;
  vendor?: string;
  tags?: string[];
  category?: string;
  [key: string]: any;
}

export interface RappVersion {
  version: string;
  releaseDate: string;
  changes: string[];
  deprecated?: boolean;
  helmValues?: Record<string, any>;
  dependencies?: RappDependency[];
}

export interface R1Schema {
  name: string;
  version: string;
  type: string;
  required: boolean;
}

export interface Dataset {
  name: string;
  type: string;
  size?: string;
  source?: string;
}

export interface HelmChartDetails {
  name: string;
  version: string;
  repository?: string;
  values?: Record<string, any>;
  resources?: {
    cpu?: string;
    memory?: string;
    gpu?: number;
    storage?: string;
  };
}

export interface CsarFile {
  path: string;
  type: 'file' | 'directory';
  size?: number;
  children?: CsarFile[];
}

export interface RappDependency {
  id: string;
  name: string;
  type: 'R1' | 'A1' | 'SME' | 'DME' | 'Resource';
  description: string;
  required: boolean;
  version?: string;
}

export interface SmeResources {
  invokers?: string[];
  serviceApis?: string[];
  providerFunctions?: string[];
}

export interface DmeResources {
  producerInfoTypes?: string[];
  consumerInfoTypes?: string[];
  infoProducers?: string[];
  infoConsumers?: string[];
}

export interface RappInstance {
  rappInstanceId: string;
  state: 'DEPLOYED' | 'DEPLOYING' | 'UNDEPLOYED' | 'UNDEPLOYING' | 'DELETED';
  reason?: string;
  acm?: any;
  sme?: any;
  dme?: any;
}

export type PrimeOrder = 'PRIME' | 'DEPRIME';
export type DeployOrder = 'DEPLOY' | 'UNDEPLOY';

// Filter types
export type StatusFilter = 'all' | 'COMMISSIONED' | 'PRIMED' | 'DEPLOYED' | 'DEPRECATED';
export type CategoryFilter = 'all' | 'AI/ML' | 'Optimization' | 'Energy' | 'SON' | 'Traffic Steering' | 'QoS' | 'Security';

// Deployment Configuration
export interface DeploymentConfig {
  namespace: string;
  helmValues: Record<string, any>;
  resourceSize: 'small' | 'medium' | 'large' | 'custom';
  autoscaling: {
    enabled: boolean;
    minReplicas?: number;
    maxReplicas?: number;
    targetCPUUtilization?: number;
  };
  dmeModels: string[];
  smeProvider: string;
  customResources?: {
    cpu?: string;
    memory?: string;
    storage?: string;
    gpu?: number;
  };
}

// Lifecycle Actions
export type LifecycleAction = 'deploy' | 'start' | 'stop' | 'restart' | 'upgrade' | 'rollback' | 'uninstall';

export interface LifecycleActionRequest {
  action: LifecycleAction;
  rappId: string;
  instanceId?: string;
  targetVersion?: string;
  config?: DeploymentConfig;
}

// Real-time Deployment Logs
export interface DeploymentLog {
  id: string;
  timestamp: Date;
  type: 'helm' | 'pod' | 'image' | 'probe' | 'error' | 'info';
  severity: 'info' | 'warning' | 'error' | 'success';
  message: string;
  source?: string;
  metadata?: Record<string, any>;
}

export interface PodEvent {
  name: string;
  namespace: string;
  phase: 'Pending' | 'Running' | 'Succeeded' | 'Failed' | 'Unknown';
  reason?: string;
  message?: string;
  timestamp: Date;
}

export interface ImagePullStatus {
  image: string;
  status: 'pulling' | 'pulled' | 'failed';
  progress?: number;
  error?: string;
}

export interface ProbeStatus {
  type: 'readiness' | 'liveness';
  status: 'passing' | 'failing' | 'unknown';
  lastCheck: Date;
  failureCount?: number;
}

// Resource Sizing Presets
export const RESOURCE_PRESETS = {
  small: {
    cpu: '250m',
    memory: '512Mi',
    storage: '5Gi',
    replicas: 1,
  },
  medium: {
    cpu: '500m',
    memory: '1Gi',
    storage: '10Gi',
    replicas: 2,
  },
  large: {
    cpu: '1000m',
    memory: '2Gi',
    storage: '20Gi',
    replicas: 3,
  },
};

// Security & RBAC
export type UserRole = 'Admin' | 'Operator' | 'Viewer';

export interface Permission {
  resource: 'rapp' | 'deployment' | 'monitoring' | 'settings' | 'audit';
  action: 'view' | 'create' | 'update' | 'delete' | 'deploy' | 'prime';
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  permissions: Permission[];
  createdAt: Date;
  lastLogin?: Date;
}

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  role: UserRole;
  createdBy: string;
  createdAt: Date;
  expiresAt?: Date;
  lastUsed?: Date;
  isActive: boolean;
}

export interface AuditLog {
  id: string;
  timestamp: Date;
  user: string;
  role: UserRole;
  action: 'upload_csar' | 'deploy' | 'rollback' | 'delete' | 'prime' | 'deprime' | 'login' | 'create_api_key' | 'revoke_api_key';
  resource: string;
  resourceId: string;
  details: string;
  ipAddress?: string;
  success: boolean;
  errorMessage?: string;
}

// Role Permissions Matrix
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  Admin: [
    { resource: 'rapp', action: 'view' },
    { resource: 'rapp', action: 'create' },
    { resource: 'rapp', action: 'update' },
    { resource: 'rapp', action: 'delete' },
    { resource: 'rapp', action: 'prime' },
    { resource: 'deployment', action: 'view' },
    { resource: 'deployment', action: 'deploy' },
    { resource: 'deployment', action: 'delete' },
    { resource: 'monitoring', action: 'view' },
    { resource: 'settings', action: 'view' },
    { resource: 'settings', action: 'update' },
    { resource: 'audit', action: 'view' },
  ],
  Operator: [
    { resource: 'rapp', action: 'view' },
    { resource: 'rapp', action: 'prime' },
    { resource: 'deployment', action: 'view' },
    { resource: 'deployment', action: 'deploy' },
    { resource: 'monitoring', action: 'view' },
    { resource: 'audit', action: 'view' },
  ],
  Viewer: [
    { resource: 'rapp', action: 'view' },
    { resource: 'deployment', action: 'view' },
    { resource: 'monitoring', action: 'view' },
  ],
};


// ============================================================================
// ADAPTER LAYER TYPES
// ============================================================================

/**
 * Enhanced rApp with derived UI state, certification, KPIs, and governance
 */
export interface EnhancedRapp extends Rapp {
  uiLifecycleState: UILifecycleState;
  certification: CertificationStatus;
  impactKPIs: ImpactKPIs;
  availableActions: LifecycleAction[];
  governanceValidation: GovernanceValidation;
}

/**
 * Derived UI lifecycle state from backend state + instance conditions
 */
export interface UILifecycleState {
  state: 'available' | 'ready' | 'deploying' | 'deployed' | 'partial' | 'preparing' | 'decommissioning' | 'issues' | 'scaling-down';
  label: string;
  badgeColor: string;
  badgeClass: string;
  animated: boolean;
  description: string;
  icon?: string;
}

/**
 * Certification status derived from package structure, metadata, and deployment history
 */
export interface CertificationStatus {
  level: 'certified' | 'validated' | 'experimental' | 'uncertified';
  badge: string;
  score: number; // 0-100
  checks: CertificationCheck[];
  lastUpdated: Date;
}

export interface CertificationCheck {
  name: string;
  description: string;
  passed: boolean;
  weight: number; // Contribution to overall score
  details?: string;
}

/**
 * Impact KPIs calculated from backend data and historical tracking
 */
export interface ImpactKPIs {
  deploymentSuccessRate: KPIMetric;
  resourceUtilization: KPIMetric;
  availabilityScore: KPIMetric;
  governanceCompliance: KPIMetric;
  instanceHealth: KPIMetric;
  trend: 'improving' | 'stable' | 'declining';
  lastCalculated: Date;
}

export interface KPIMetric {
  value: number; // 0-100
  label: string;
  status: 'good' | 'warning' | 'critical';
  color: string;
  description: string;
  trend?: 'up' | 'down' | 'stable';
}

/**
 * Governance validation results
 */
export interface GovernanceValidation {
  isCompliant: boolean;
  score: number; // 0-100
  violations: GovernanceViolation[];
  warnings: string[];
  lastChecked: Date;
}

export interface GovernanceViolation {
  rule: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  actionBlocked?: LifecycleAction;
}

/**
 * Historical tracking data stored in StateCache
 */
export interface DeploymentRecord {
  timestamp: Date;
  instanceId: string;
  success: boolean;
  duration?: number;
  error?: string;
  state?: string;
}

export interface StateTransition {
  timestamp: Date;
  fromState: string;
  toState: string;
  reason?: string;
  triggeredBy?: string;
}

export interface RappHistoricalData {
  rappId: string;
  deploymentHistory: DeploymentRecord[];
  stateTransitions: StateTransition[];
  firstObserved: Date;
  lastUpdated: Date;
  totalDeployAttempts: number;
  successfulDeploys: number;
  failedDeploys: number;
}

/**
 * StateCache storage schema
 */
export interface StateCacheData {
  version: string;
  rapps: Record<string, RappHistoricalData>;
  lastCleanup: Date;
}

/**
 * Governance rules configuration
 */
export interface GovernanceRules {
  maxInstancesPerRapp: number;
  maxTotalInstances: number;
  requireCertificationForProduction: boolean;
  minCertificationScore: number;
  allowedStatesForDeploy: string[];
  allowedStatesForDelete: string[];
  resourceQuotas: {
    maxCPUPerInstance: string;
    maxMemoryPerInstance: string;
    maxStoragePerInstance: string;
  };
}

/**
 * Default governance rules
 */
export const DEFAULT_GOVERNANCE_RULES: GovernanceRules = {
  maxInstancesPerRapp: 10,
  maxTotalInstances: 100,
  requireCertificationForProduction: false,
  minCertificationScore: 50,
  allowedStatesForDeploy: ['PRIMED'],
  allowedStatesForDelete: ['COMMISSIONED', 'PRIMED'],
  resourceQuotas: {
    maxCPUPerInstance: '2000m',
    maxMemoryPerInstance: '4Gi',
    maxStoragePerInstance: '20Gi',
  },
};
