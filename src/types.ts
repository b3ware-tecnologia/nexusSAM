export enum MetricType {
  INSTALLATIONS = "Installations",
  USERS = "Users",
  DEVICES = "Devices",
  PROCESSOR_CORE = "Processor/Core",
  PVU = "PVU (IBM)",
  VDA = "VDA (Windows)"
}

export interface AuditTimestamps {
  createdAt?: string;
  updatedAt?: string;
}

export interface Agreement extends AuditTimestamps {
  id: string;
  tenantId?: string;
  name: string;
  number: string;
  vendor: string;
  startDate: string;
  endDate: string;
  status: "Active" | "Expired" | "Draft";
  type: "Enterprise" | "SaaS" | "Standard" | "Volume";
  description?: string;
}

export interface LicensePurchase extends AuditTimestamps {
  id: string;
  tenantId?: string;
  licenseId: string;
  invoiceNumber: string;
  purchaseDate: string;
  quantity: number;
  unitCost: number;
  currency: string;
  totalCost: number;
}

export interface LicenseAssignment extends AuditTimestamps {
  id: string;
  tenantId?: string;
  licenseId: string;
  targetType: "User" | "Device" | "OrgUnit";
  targetId: string;
  quantity: number;
  allocatedAt: string;
}

export interface SubscriptionLicense extends AuditTimestamps {
  id: string;
  tenantId?: string;
  licenseId: string;
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  billingFrequency: "Monthly" | "Annually";
}

export interface LicensePolicy {
  mandatoryFields: string[];
}

export interface LicenseBundle {
  id: string;
  tenantId?: string;
  name: string;
  publisher: string;
  childLicenseIds: string[];
  bundleType: "Suite" | "Family" | "Productivity";
  totalCostPerSeat?: number;
}

export interface License extends AuditTimestamps {
  id: string;
  tenantId?: string;
  softwareName: string;
  publisher: string;
  metricType: MetricType;
  totalQuantity: number;
  allocatedQuantity: number;
  agreementId?: string;
  licensePoolId?: string;
  bundleId?: string;
  status: "Active" | "Archived" | "Draft" | "Incomplete";
  notes?: string;
  version?: string;
  sku?: string;
  downgradeRights: boolean;
  isSubscription?: boolean;
  subscriptionEndDate?: string;
  hasExpired?: boolean;
  licensePolicy?: LicensePolicy;
}

export interface LicensePool extends AuditTimestamps {
  id: string;
  tenantId?: string;
  name: string;
  description?: string;
  ownerOrgNodeId?: string;
  allowedMetricTypes?: MetricType[];
  autoAllocRules?: string;
  linkedAgreementIds?: string[];
  totalQuantity: number;
  consumedQuantity?: number;
}

export interface ComplianceOverride {
  id: string;
  tenantId?: string;
  softwareName: string;
  publisher: string;
  overrideType: "Entitlement" | "Consumption" | "Status";
  oldValue: string;
  newValue: string;
  reason: string;
  createdBy: string;
  createdAt: string;
  expiresAt?: string;
}

export interface RenewalForecast {
  licenseId: string;
  softwareName: string;
  publisher: string;
  agreementId?: string;
  currentEndDate: string;
  autoRenew: boolean;
  daysUntilExpiry: number;
  estimatedAnnualCost: number;
  renewalStatus: "Auto-Renew" | "Expiring Soon" | "Expired" | "Manual Renewal Needed";
  recommendation: string;
}

export interface Computer extends AuditTimestamps {
  id: string;
  tenantId?: string;
  name: string;
  cores: number;
  pvuPerCore: number;
  isVirtual: boolean;
  os: "Windows" | "Linux" | "macOS";
  ramGB: number;
  cpuModel: string;
  serialNumber?: string;
  brand?: string;
  model?: string;
  storageGB?: number;
  warrantyStatus?: "Under Warranty" | "Expired" | "No Info";
  warrantyExpirationDate?: string;
  lifecycleStatus?: "Active" | "Quarantined" | "Archived" | "Inactive";
  lastActiveDate?: string;
}

export interface MobileDevice extends AuditTimestamps {
  id: string;
  tenantId?: string;
  name: string;
  brand: string;
  model: string;
  os: string;
  serialNumber: string;
  userName: string;
  warrantyStatus: "Under Warranty" | "Expired" | "No Info";
  warrantyExpirationDate: string;
  lifecycleStatus: "Active" | "Quarantined" | "Archived" | "Inactive";
  lastActiveDate: string;
}

export interface ApplicationCategory {
  id: string;
  name: string;
  description: string;
}

export interface Manufacturer {
  id: string;
  name: string;
  website?: string;
}

export interface SoftwareCatalogItem extends AuditTimestamps {
  id: string;
  tenantId?: string;
  softwareName: string;
  publisher: string;
  categoryId: string;
  defaultSku?: string;
  version?: string;
  eolDate?: string;
  eosDate?: string;
  isMalware: boolean;
  compatibleOS: string[];
}

export interface DiscoveredApplication extends AuditTimestamps {
  id: string;
  tenantId?: string;
  computerId: string;
  catalogItemId?: string;
  softwareName: string;
  rawSoftwareName: string;
  publisher: string;
  version: string;
  lastUsed: string;
  usageDurationMinutes: number;
  isPrivateCatalogMatch?: boolean;
}

export interface PrivateCatalogItem {
  id: string;
  tenantId?: string;
  softwareName: string;
  publisher: string;
  matchPattern: string;
  categoryId: string;
  notes?: string;
}

export interface Installation extends AuditTimestamps {
  id: string;
  tenantId?: string;
  softwareName: string;
  publisher: string;
  version: string;
  computerId: string;
  userName: string;
  detectedAt: string;
}

export interface ComplianceSnapshot {
  id: string;
  calculatedAt: string;
  softwareName: string;
  publisher: string;
  metricType: MetricType;
  entitlements: number;
  consumption: number;
  assigned: number;
  balance: number;
  complianceStatus: "Compliant" | "UnderLicensed" | "OverLicensed";
  costImpact: number;
  poolId?: string;
  licenseId?: string;
  renewalForecast?: RenewalForecast;
}

export interface SaaSApplication extends AuditTimestamps {
  id: string;
  tenantId?: string;
  name: string;
  publisher: string;
  category: string;
  riskScore: number;
  isApproved: boolean;
  familyName?: string;
  discoveredSources: string[];
}

export interface SaaSSubscription extends AuditTimestamps {
  id: string;
  tenantId?: string;
  saasApplicationId: string;
  sku: string;
  planName: string;
  billingFrequency: "Monthly" | "Annually";
  seatsTotal: number;
  seatsAssigned: number;
  costPerSeat: number;
  currency: string;
  status: "Active" | "Expired" | "Suspended";
  autoRenew?: boolean;
  isFree?: boolean;
  isExcluded?: boolean;
  expirationDate?: string;
}

export interface SaaSSubscriptionPurchase extends AuditTimestamps {
  id: string;
  tenantId?: string;
  subscriptionId: string;
  purchaseDate: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  invoiceNumber: string;
}

export interface SaaSUser extends AuditTimestamps {
  id: string;
  tenantId?: string;
  name: string;
  email: string;
  department: string;
  status: "Active" | "Inactive";
  identitySources: string[];
}

export interface SaaSUserActivity {
  id: string;
  tenantId?: string;
  saasApplicationId: string;
  saasUserId: string;
  lastActiveDate: string;
  usageDurationMinutes: number;
  activityLevel: "Active" | "Low Activity" | "Inactive" | "No Activity";
  sourceConnector: string;
}

export interface SaaSConnector {
  id: string;
  tenantId?: string;
  name: string;
  type: "VendorAPI" | "SSO" | "CASB" | "BrowserExtension" | "CSVImport";
  status: "Connected" | "Error" | "Disconnected";
  lastSyncedAt?: string;
  recordCount: number;
}

export interface CloudConnector {
  id: string;
  tenantId?: string;
  name: string;
  provider: "AWS" | "Azure" | "GCP";
  status: "Connected" | "Error" | "Disconnected";
  lastSyncedAt?: string;
  resourceCount: number;
}

export interface CloudResource extends AuditTimestamps {
  id: string;
  tenantId?: string;
  connectorId: string;
  name: string;
  provider: "AWS" | "Azure" | "GCP";
  type: "VM" | "Database" | "Container";
  cost: number;
  pricingModel: "PAYG" | "BYOL";
  softwareInstalled: string[];
  hasLicenseCoverage: boolean;
  recommendation: string;
}

export interface AzureHybridBenefit {
  id: string;
  tenantId?: string;
  resourceId: string;
  licenseId: string;
  enabled: boolean;
  estimatedMonthlySavings: number;
}

export interface K8sConnector {
  id: string;
  tenantId?: string;
  name: string;
  status: "Connected" | "Error" | "Disconnected";
  lastSyncedAt?: string;
  clusterCount: number;
}

export interface K8sCluster {
  id: string;
  tenantId?: string;
  name: string;
  namespaceCount: number;
  podCount: number;
}

export interface ContainerPod {
  id: string;
  tenantId?: string;
  clusterId: string;
  namespace: string;
  podName: string;
  containerName: string;
  imageName: string;
  softwareRunning: string[];
  licenseStatus: "Compliant" | "Non-Compliant" | "BYOL Coverage Checked" | "Unlicensed";
}

export interface CustomFieldDefinition {
  id: string;
  tenantId?: string;
  targetType: "License" | "Computer" | "Application" | "Subscription";
  name: string;
  fieldType: "Text" | "Number" | "Boolean" | "Date";
}

export interface CustomFieldValue {
  id: string;
  tenantId?: string;
  definitionId: string;
  entityId: string;
  value: string;
}

export interface CustomMetric extends AuditTimestamps {
  id: string;
  tenantId?: string;
  name: string;
  description: string;
  queryCriteria: string;
  value: number;
}

export interface SavedReport extends AuditTimestamps {
  id: string;
  tenantId?: string;
  name: string;
  description: string;
  columns: string[];
  filters: any;
  targetType: "Licenses" | "Computers" | "Applications" | "Subscriptions" | "Cloud" | "Containers";
}

export interface ReportSchedule extends AuditTimestamps {
  id: string;
  tenantId?: string;
  reportId: string;
  frequency: "Daily" | "Weekly" | "Monthly";
  deliveryType: "Email" | "SharePoint";
  recipients: string[];
  status: "Active" | "Paused";
}

export interface SSOConfig {
  id: string;
  tenantId?: string;
  provider: "AzureAD" | "GoogleWorkspace" | "Okta" | "SAML" | "OIDC";
  name: string;
  clientId: string;
  domainUrl: string;
  status: "Enabled" | "Disabled";
  metadataXml?: string;
}

export interface OAuthClient {
  id: string;
  tenantId?: string;
  name: string;
  clientId: string;
  clientSecret: string;
  scopes: string[];
  lastUsedAt?: string;
  status: "Active" | "Revoked";
}

export interface AdminRole {
  id: string;
  tenantId?: string;
  name: string;
  isSystem: boolean;
  permissions: {
    licenses: "None" | "Read" | "Write";
    saas: "None" | "Read" | "Write";
    cloud: "None" | "Read" | "Write";
    admin: "None" | "Read" | "Write";
    auditLogs: "None" | "Read" | "Write";
  };
}

export interface UserGroup {
  id: string;
  tenantId?: string;
  name: string;
  roleId: string;
  memberCount: number;
}

export interface AdminUser extends AuditTimestamps {
  id: string;
  tenantId?: string;
  name: string;
  email: string;
  passwordHash?: string;
  roleId: string;
  groupIds: string[];
  status: "Active" | "Inactive" | "Pending";
  joinedDate: string;
  lastLoginAt?: string;
}

export interface OrgNode extends AuditTimestamps {
  id: string;
  tenantId?: string;
  name: string;
  parentId?: string;
  code: string;
  allocatedLicenseCount: number;
}

export interface EnrollmentSite {
  id: string;
  tenantId?: string;
  name: string;
  orgNodeId: string;
  snowExtenderCount: number;
  extenderStatus: "Online" | "Offline" | "No Extenders";
}

export interface AuditLogEntry {
  id: string;
  tenantId?: string;
  timestamp: string;
  userId: string;
  userEmail: string;
  action: string;
  category: "Auth" | "SAM Core" | "SaaS" | "Cloud" | "RBAC" | "Org" | "Security" | "Admin";
  ipAddress: string;
  details: string;
}

export interface CurrencyRate {
  id: string;
  code: string;
  symbol: string;
  rateToBase: number;
  isBase: boolean;
}

export interface IPPolicy {
  id: string;
  tenantId?: string;
  cidr: string;
  description: string;
  policyType: "Allow" | "Deny";
  status: "Active" | "Inactive";
}

export interface MSPCustomer extends AuditTimestamps {
  id: string;
  tenantId?: string;
  name: string;
  status: "Active" | "Suspended";
  complianceScore: number;
  totalLicenses: number;
  totalDevices: number;
}

export interface AdminNotification {
  id: string;
  tenantId?: string;
  timestamp: string;
  title: string;
  message: string;
  category: "Info" | "Warning" | "Error" | "Security";
  isRead: boolean;
}

export interface UploadedFile extends AuditTimestamps {
  id: string;
  tenantId?: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string;
  purpose: "Report Export" | "Audit Log Export" | "Invoice Attachment" | "Custom Import";
  url?: string;
}

export interface Tenant {
  id: string;
  name: string;
  domain?: string;
  plan: "Free" | "Pro" | "Enterprise";
  status: "Active" | "Suspended";
  createdAt: string;
  settings: Record<string, any>;
}
