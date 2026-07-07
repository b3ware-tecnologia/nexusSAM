import * as fs from "fs";
import * as path from "path";
import { DatabaseState } from "./src/dbMock.js";

const DB_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DB_DIR, "db.json");

console.log("Initializing database seed engine...");

const seedData: any = {
  agreements: [
    {
      id: "agr-ms-ea",
      name: "Microsoft Enterprise Agreement",
      number: "EA-98741",
      vendor: "Microsoft",
      startDate: "2024-01-01",
      endDate: "2027-01-01",
      status: "Active",
      type: "Enterprise",
      description: "Global enterprise-wide desktop and server license pool covering Windows Server Datacenter, SQL Server, and Office."
    },
    {
      id: "agr-oracle-ma",
      name: "Oracle Master Agreement",
      number: "OMA-2210",
      vendor: "Oracle",
      startDate: "2023-06-15",
      endDate: "2028-06-15",
      status: "Active",
      type: "Standard",
      description: "Global agreement covering Oracle Enterprise Database processors, RAC clusters, and Java SE Universal Subscriptions."
    },
    {
      id: "agr-adobe-cc",
      name: "Adobe Enterprise Creative Cloud Subscription",
      number: "ABS-554",
      vendor: "Adobe Inc.",
      startDate: "2025-01-01",
      endDate: "2026-01-01",
      status: "Active",
      type: "SaaS",
      description: "Creative Cloud SaaS seats for corporate design, product marketing, and branding groups."
    },
    {
      id: "agr-sforce-ea",
      name: "Salesforce CRM Global Agreement",
      number: "SFA-309",
      vendor: "Salesforce",
      startDate: "2024-10-01",
      endDate: "2025-10-01",
      status: "Active",
      type: "SaaS",
      description: "Sales & Service Cloud seat licensing with specialized Shield audit-logging extensions."
    },
    {
      id: "agr-ibm-pvu",
      name: "IBM Passport Advantage Master",
      number: "IBM-77621",
      vendor: "IBM",
      startDate: "2022-03-10",
      endDate: "2027-03-10",
      status: "Active",
      type: "Standard",
      description: "IBM middleware agreement covering WebSphere, DB2 instances, and MQSeries on-premises workloads mapped via PVU metric."
    },
    {
      id: "agr-redhat-sub",
      name: "Red Hat Enterprise Linux Server Pool",
      number: "RH-99120",
      vendor: "Red Hat",
      startDate: "2025-02-01",
      endDate: "2028-02-01",
      status: "Active",
      type: "Subscription",
      description: "L3 premium 24/7 support subscriptions for physical and containerized enterprise workloads."
    }
  ],
  licenses: [
    {
      id: "lic-ms-ws-dc",
      name: "Windows Server Datacenter Edition",
      publisher: "Microsoft",
      metric: "Core",
      quantity: 128,
      purchasedPrice: 145000,
      currency: "USD",
      agreementId: "agr-ms-ea",
      downgradeRights: true,
      notes: "Enables unlimited Hyper-V virtual machine hosting when all physical host cores are licensed."
    },
    {
      id: "lic-ms-sql-ee",
      name: "SQL Server Enterprise Edition (Core Licensing)",
      publisher: "Microsoft",
      metric: "Core",
      quantity: 64,
      purchasedPrice: 240000,
      currency: "USD",
      agreementId: "agr-ms-ea",
      downgradeRights: true,
      notes: "High availability database deployments with active-passive secondary clustering benefits."
    },
    {
      id: "lic-oracle-db",
      name: "Oracle Database Enterprise Edition",
      publisher: "Oracle",
      metric: "Processor",
      quantity: 8,
      purchasedPrice: 380000,
      currency: "USD",
      agreementId: "agr-oracle-ma",
      downgradeRights: true,
      notes: "Licensed using Oracle Processor Core Factor of 0.5 for Intel/AMD x86 processors."
    },
    {
      id: "lic-java-se",
      name: "Oracle Java SE Universal Subscription",
      publisher: "Oracle",
      metric: "User",
      quantity: 500,
      purchasedPrice: 15000,
      currency: "USD",
      agreementId: "agr-oracle-ma",
      downgradeRights: false,
      notes: "Per-employee subscription coverage for standard enterprise application runtimes."
    },
    {
      id: "lic-ibm-mq",
      name: "IBM MQ Advanced",
      publisher: "IBM",
      metric: "Processor (PVU)",
      quantity: 1400,
      purchasedPrice: 42000,
      currency: "USD",
      agreementId: "agr-ibm-pvu",
      downgradeRights: true,
      notes: "Calculated based on 70 PVUs per core for standard Intel Xeon dual-socket physical servers."
    }
  ],
  purchases: [
    { id: "pur-1", licenseId: "lic-ms-ws-dc", invoiceNumber: "INV-9988-1", purchaseDate: "2024-01-15", quantity: 64, unitPrice: 1100, cost: 70400 },
    { id: "pur-2", licenseId: "lic-ms-ws-dc", invoiceNumber: "INV-9988-2", purchaseDate: "2024-11-20", quantity: 64, unitPrice: 1165, cost: 74600 },
    { id: "pur-3", licenseId: "lic-ms-sql-ee", invoiceNumber: "INV-9989-1", purchaseDate: "2024-01-15", quantity: 64, unitPrice: 3750, cost: 240000 },
    { id: "pur-4", licenseId: "lic-oracle-db", invoiceNumber: "INV-7722", purchaseDate: "2023-07-01", quantity: 8, unitPrice: 47500, cost: 380000 }
  ],
  assignments: [
    { id: "asg-1", licenseId: "lic-ms-ws-dc", targetType: "Computer", targetId: "comp-srv-dc01", assignedQuantity: 32, assignedDate: "2024-02-01" },
    { id: "asg-2", licenseId: "lic-ms-ws-dc", targetType: "Computer", targetId: "comp-srv-dc02", assignedQuantity: 32, assignedDate: "2024-02-01" },
    { id: "asg-3", licenseId: "lic-ms-sql-ee", targetType: "Computer", targetId: "comp-srv-sql01", assignedQuantity: 16, assignedDate: "2024-02-10" },
    { id: "asg-4", licenseId: "lic-oracle-db", targetType: "Computer", targetId: "comp-srv-ora01", assignedQuantity: 4, assignedDate: "2023-08-01" }
  ],
  subscriptionLicenses: [
    { id: "sub-1", name: "RHEL Premium Support subscription", publisher: "Red Hat", sku: "RH00003", quantity: 40, costPerMonth: 85, startDate: "2025-02-01", endDate: "2028-02-01" }
  ],
  computers: [
    { id: "comp-srv-dc01", name: "PRD-VM-HOST-01", type: "Server", operatingSystem: "Windows Server 2022 Datacenter", cpu: "Intel Xeon Gold 6330", cpuCores: 32, ramGb: 256, lastScanDate: "2026-03-01T04:12:00Z", status: "Active", serialNumber: "SNG-8891-AA", brand: "Dell", model: "PowerEdge R750", warrantyExpiration: "2028-12-31" },
    { id: "comp-srv-dc02", name: "PRD-VM-HOST-02", type: "Server", operatingSystem: "Windows Server 2022 Datacenter", cpu: "Intel Xeon Gold 6330", cpuCores: 32, ramGb: 256, lastScanDate: "2026-03-01T04:15:00Z", status: "Active", serialNumber: "SNG-8891-AB", brand: "Dell", model: "PowerEdge R750", warrantyExpiration: "2028-12-31" },
    { id: "comp-srv-sql01", name: "PRD-DB-SQL-01", type: "Server", operatingSystem: "Windows Server 2022 Standard", cpu: "Intel Xeon Silver 4314", cpuCores: 16, ramGb: 128, lastScanDate: "2026-03-01T05:00:00Z", status: "Active", serialNumber: "SNG-5542-QQ", brand: "HP", model: "ProLiant DL380 Gen10", warrantyExpiration: "2027-06-30" },
    { id: "comp-srv-ora01", name: "PRD-DB-ORA-01", type: "Server", operatingSystem: "Red Hat Enterprise Linux 8.9", cpu: "AMD EPYC 7543", cpuCores: 32, ramGb: 512, lastScanDate: "2026-03-01T03:30:00Z", status: "Active", serialNumber: "SNG-9981-XX", brand: "Lenovo", model: "ThinkSystem SR650", warrantyExpiration: "2029-01-15" },
    { id: "comp-usr-01", name: "LAP-MKT-E01", type: "Workstation", operatingSystem: "macOS Sonoma", cpu: "Apple M3 Pro", cpuCores: 11, ramGb: 18, lastScanDate: "2026-03-01T09:44:00Z", status: "Active", serialNumber: "C02F-8899-M3", brand: "Apple", model: "MacBook Pro 14", warrantyExpiration: "2026-11-01" },
    { id: "comp-usr-02", name: "LAP-DEV-W01", type: "Workstation", operatingSystem: "Windows 11 Enterprise", cpu: "Intel Core i7-13700H", cpuCores: 14, ramGb: 32, lastScanDate: "2026-03-01T10:12:00Z", status: "Active", serialNumber: "SNG-7762-FF", brand: "Lenovo", model: "ThinkPad T14 Gen 4", warrantyExpiration: "2026-05-14" }
  ],
  installations: [
    { id: "inst-1", computerId: "comp-srv-sql01", applicationName: "Microsoft SQL Server 2022 Enterprise", version: "16.0.1000", path: "C:\\Program Files\\Microsoft SQL Server\\MSSQL16.MSSQLSERVER", installedDate: "2024-03-10" },
    { id: "inst-2", computerId: "comp-srv-ora01", applicationName: "Oracle Database Enterprise Edition", version: "19.3.0", path: "/u01/app/oracle/product/19.0.0/dbhome_1", installedDate: "2023-08-15" },
    { id: "inst-3", computerId: "comp-usr-01", applicationName: "Adobe Photoshop Creative Cloud", version: "25.4.1", path: "/Applications/Adobe Photoshop 2024/Adobe Photoshop 2024.app", installedDate: "2025-01-10" },
    { id: "inst-4", computerId: "comp-usr-01", applicationName: "Adobe Illustrator Creative Cloud", version: "28.1.0", path: "/Applications/Adobe Illustrator 2024/Adobe Illustrator.app", installedDate: "2025-01-12" },
    { id: "inst-5", computerId: "comp-usr-02", applicationName: "Oracle Java SE Runtime Environment 17", version: "17.0.9", path: "C:\\Program Files\\Java\\jdk-17", installedDate: "2024-09-01" }
  ],
  mobileDevices: [
    { id: "mob-1", name: "Érico's Corporate iPhone", type: "Smartphone", osVersion: "iOS 17.2", assignedTo: "Érico B.", manufacturer: "Apple", model: "iPhone 15 Pro", serialNumber: "MD-9912", enrollmentDate: "2025-01-01", complianceStatus: "Compliant" }
  ],
  applicationCategories: [
    { id: "cat-db", name: "Database Systems", description: "Relational and non-relational database management engines." },
    { id: "cat-os", name: "Operating Systems", description: "Base platforms for hosting client or server execution units." },
    { id: "cat-saas-crm", name: "Customer Relationship Management", description: "Enterprise SaaS software for sales pipelines and service tickets." }
  ],
  manufacturers: [
    { id: "mfr-ms", name: "Microsoft", website: "https://microsoft.com", supportEmail: "licensing@microsoft.com" },
    { id: "mfr-ora", name: "Oracle", website: "https://oracle.com", supportEmail: "license-compliance@oracle.com" }
  ],
  softwareCatalog: [
    { id: "cat-sql-2022", title: "Microsoft SQL Server 2022 Enterprise", manufacturer: "Microsoft", version: "16.x", sku: "SQL-22-ENT", category: "Database Systems", eolDate: "2027-01-11", eosDate: "2032-01-11", licenseModel: "Core" },
    { id: "cat-ora-19c", title: "Oracle Database Enterprise Edition", manufacturer: "Oracle", version: "19.c", sku: "ORA-DB-EE", category: "Database Systems", eolDate: "2026-04-30", eosDate: "2031-04-30", licenseModel: "Processor" }
  ],
  discoveredApplications: [
    { id: "disc-1", fileSignature: "sqlservr.exe", detectedTitle: "Microsoft SQL Server 2022 Enterprise", publisher: "Microsoft Corp.", rawVersion: "16.0.1000", normalizedId: "cat-sql-2022", recognitionConfidence: 0.99, matchType: "Signature" }
  ],
  privateCatalog: [
    { id: "pvt-1", title: "Corporate Payroll Ledger", publisher: "Internal IT", matchPattern: "cpl-app.jar", classification: "In-house App", targetOrgNodeId: "org-finance" }
  ],
  saasApplications: [
    { id: "saas-m365", name: "Microsoft 365 Enterprise", vendor: "Microsoft", category: "Productivity", discoverySource: "OIDC Connector", riskScore: 12, complianceStatus: "Compliant", isApproved: true },
    { id: "saas-salesforce", name: "Salesforce Sales Cloud", vendor: "Salesforce", category: "CRM", discoverySource: "SSO Hub", riskScore: 28, complianceStatus: "Compliant", isApproved: true },
    { id: "saas-dropbox-free", name: "Dropbox Personal Account", vendor: "Dropbox", category: "Cloud Storage", discoverySource: "Browser Extension", riskScore: 78, complianceStatus: "Shadow IT Detected", isApproved: false }
  ],
  saasSubscriptions: [
    { id: "saas-sub-m365-e5", saasApplicationId: "saas-m365", skuName: "M365 E5 Suite", totalLicenses: 150, assignedCount: 130, unassignedCount: 20, monthlyCostPerUser: 57, contractBillingPeriod: "Monthly", family: "Microsoft 365" },
    { id: "saas-sub-sf-ee", saasApplicationId: "saas-salesforce", skuName: "Salesforce Unlimited CRM", totalLicenses: 50, assignedCount: 48, unassignedCount: 2, monthlyCostPerUser: 150, contractBillingPeriod: "Annual", family: "Salesforce" }
  ],
  saasSubscriptionPurchases: [
    { id: "saas-p-1", saasSubscriptionId: "saas-sub-m365-e5", invoiceNumber: "SINV-112", quantity: 150, discountAppliedPercent: 12, totalValueUSD: 7524, dateOfPurchase: "2025-01-01" }
  ],
  saasUsers: [
    { id: "suser-erico", email: "erico.b@enterprise.com", name: "Érico B.", department: "Product Engineering", status: "Active", tenantSource: "Azure AD" },
    { id: "suser-john", email: "john.d@enterprise.com", name: "John Doe", department: "Field Marketing", status: "Active", tenantSource: "Google Workspace" },
    { id: "suser-lea", email: "lea.m@enterprise.com", name: "Lea Miller", department: "Business Finance", status: "Inactive", tenantSource: "Azure AD" }
  ],
  saasUserActivities: [
    { id: "sact-1", saasUserId: "suser-erico", saasApplicationId: "saas-m365", lastAccessDate: "2026-03-01T15:20:00Z", activityClassification: "Active", bytesTransferred: 450000 },
    { id: "sact-2", saasUserId: "suser-john", saasApplicationId: "saas-dropbox-free", lastAccessDate: "2026-02-28T18:05:00Z", activityClassification: "Shadow IT Active", bytesTransferred: 1200000 },
    { id: "sact-3", saasUserId: "suser-lea", saasApplicationId: "saas-salesforce", lastAccessDate: "2026-01-10T11:00:00Z", activityClassification: "No Activity", bytesTransferred: 0 }
  ],
  saasConnectors: [
    { id: "sconn-aad", name: "Microsoft Entra ID Tenant SSO Sync", provider: "Microsoft", status: "Active", lastSyncDate: "2026-03-01T12:00:00Z", accountsDiscovered: 450 }
  ],
  cloudConnectors: [
    { id: "cloud-aws-01", provider: "AWS", name: "AWS Production Resource Sync", credentialKeyId: "aws-key-prd", activeStatus: "Connected", billingCycleDay: 1 },
    { id: "cloud-az-01", provider: "Azure", name: "Azure Core Cloud Group", credentialKeyId: "az-tenant-prd", activeStatus: "Connected", billingCycleDay: 15 }
  ],
  cloudResources: [
    { id: "cres-aws-01", cloudConnectorId: "cloud-aws-01", resourceId: "i-08a992fc910b802e", resourceName: "PRD-APP-SERVER", type: "Virtual Machine", region: "us-east-1", lifecycleState: "running", monthlyPAYGCost: 1120, byolConfigured: true, matchingEntitlementId: "lic-ms-ws-dc", doublePayDetected: false, detailedSpecifications: { vCPUs: 16, RAM_GB: 64, instanceType: "m5.4xlarge" } },
    { id: "cres-aws-02", cloudConnectorId: "cloud-aws-01", resourceId: "i-08a992fc910b802f", resourceName: "PRD-LEGACY-SERVER", type: "Virtual Machine", region: "us-east-1", lifecycleState: "running", monthlyPAYGCost: 1120, byolConfigured: false, matchingEntitlementId: null, doublePayDetected: true, detailedSpecifications: { vCPUs: 16, RAM_GB: 64, instanceType: "m5.4xlarge" } },
    { id: "cres-az-01", cloudConnectorId: "cloud-az-01", resourceId: "az-vm-db01", resourceName: "PRD-AZ-SQL-HOST", type: "Database Service", region: "eastus2", lifecycleState: "Online", monthlyPAYGCost: 3450, byolConfigured: true, matchingEntitlementId: "lic-ms-sql-ee", doublePayDetected: false, detailedSpecifications: { coresAllocated: 8, Tier: "Business Critical" } }
  ],
  k8sConnectors: [
    { id: "k8s-conn-prd", name: "EKS Prod Cluster Controller", kubeconfigStatus: "Configured", activeStatus: "Active", namespacesObserved: ["default", "production", "monitoring"] }
  ],
  k8sClusters: [
    { id: "k8s-cl-prd", k8sConnectorId: "k8s-conn-prd", clusterName: "EKS-US-EAST-PRODUCTION", totalNodes: 12, runningPodsCount: 145, endpointUrl: "https://eks.us-east-1.amazonaws.com" }
  ],
  containerPods: [
    { id: "pod-1", k8sClusterId: "k8s-cl-prd", name: "ora-db-instance-881", namespace: "production", hostingNode: "ip-10-0-12-14.ec2.internal", state: "Running", imagesDeployed: ["oracle/database-ee:19.3.0"], cpuCoreLimit: 8, memoryLimitGb: 32, licensingImpactRating: "High Impact" },
    { id: "pod-2", k8sClusterId: "k8s-cl-prd", name: "web-portal-990-a", namespace: "production", hostingNode: "ip-10-0-12-15.ec2.internal", state: "Running", imagesDeployed: ["nginx:latest", "oracle-java-se:17.0.9"], cpuCoreLimit: 4, memoryLimitGb: 8, licensingImpactRating: "Medium Impact" }
  ],
  customFieldDefinitions: [
    { id: "cfd-cost-center", entityType: "License", fieldName: "Cost Center ID", fieldType: "String", isRequired: true, description: "Finance audit reference code for department allocations." },
    { id: "cfd-owner-email", entityType: "Computer", fieldName: "Custodian Email", fieldType: "String", isRequired: false, description: "Direct communication address for active laptop verification." }
  ],
  customFieldValues: [
    { id: "cfv-1", definitionId: "cfd-cost-center", entityId: "lic-ms-ws-dc", value: "CC-FIN-200" },
    { id: "cfv-2", definitionId: "cfd-owner-email", entityId: "comp-usr-01", value: "erico.b@enterprise.com" }
  ],
  customMetrics: [
    { id: "cm-sust-carbon", name: "CO2 Carbon Offset Metric", keyIndicator: "Total Power Draw (kW/h)", calculatedValue: "1,240 kg/CO2e monthly offset", trackingTarget: "Infrastructure servers core workloads" }
  ],
  savedReports: [
    { id: "rep-elp-ms", name: "Microsoft Effective License Position (ELP)", type: "Standard", columnSelection: ["Publisher", "Metric", "Purchased Core Entitlements", "Discovered Active Usage Cores", "Compliance Balance State"], filterDefinitions: { publisher: "Microsoft" }, ownerId: "admin-erico" }
  ],
  reportSchedules: [
    { id: "sch-rep-elp", savedReportId: "rep-elp-ms", frequency: "Weekly", deliveryTargetType: "Email", deliveryDestinationAddress: "cio-reporting@enterprise.com", activeStatus: "Active", lastSent: "2026-02-28T08:00:00Z" }
  ],
  ssoConfigs: [
    { id: "sso-azure-ad", providerName: "Azure Active Directory SSO", clientID: "a66f-b223-99ab-3301ff", tenantID: "t-99221-enterprise", entryPointUrl: "https://login.microsoftonline.com/oauth2/v2/authorize", groupMappingEnabled: true, status: "Enabled" },
    { id: "sso-okta", providerName: "Okta Enterprise Identity Portal", clientID: "okta-8821a-prd", tenantID: "okta-enterprise", entryPointUrl: "https://identity.enterprise-okta.com/v1/auth", groupMappingEnabled: false, status: "Disabled" }
  ],
  oauthClients: [
    { id: "oauth-ext-01", clientName: "Snow Extender - Brazil HQ", clientID: "sec_ext_br_99120", clientSecretHash: "******** (Valid AES-256 Provisioned)", scopes: ["inventory_write", "enrollment_read"], createdAt: "2025-06-15T14:10:00Z", lastUsedAt: "2026-03-01T22:45:00Z" },
    { id: "oauth-ext-02", clientName: "Snow Extender - EMEA Cloud Proxy", clientID: "sec_ext_eu_88301", clientSecretHash: "******** (Valid AES-256 Provisioned)", scopes: ["inventory_write", "enrollment_read"], createdAt: "2025-09-20T09:30:00Z", lastUsedAt: "2026-03-01T23:58:00Z" }
  ],
  adminRoles: [
    { id: "role-sysadmin", roleName: "System Administrator", description: "Full complete administrative privileges over OAuth clients, currency pairs, IP policies, and tenant configurations.", permissions: ["write_all", "sso_configure", "oauth_configure", "rbac_configure", "audit_export", "currency_write", "extenders_test", "package_compile", "itsm_configure"] },
    { id: "role-sam-manager", roleName: "SAM Core Administrator", description: "Manage licenses, agreements, physical computers, and perform compliance audit calculations.", permissions: ["read_all", "license_write", "agreement_write", "computer_write", "reports_schedule"] },
    { id: "role-auditor", roleName: "Read-Only Security Auditor", description: "Review-only access to compliance positions, active audit logs, and diagnostic files.", permissions: ["read_all", "audit_read"] }
  ],
  userGroups: [
    { id: "group-eng", groupName: "Corporate Software Governance", roleId: "role-sam-manager", ssoGroupDN: "CN=GG-SAM-Gov,OU=Groups,DC=enterprise,DC=com" }
  ],
  adminUsers: [
    { id: "usr-erico", username: "erico.b@enterprise.com", name: "Érico B.", status: "Active", assignedRoleId: "role-sysadmin", groupMembershipIds: ["group-eng"], lastLoginAt: "2026-03-01T09:00:00Z" }
  ],
  orgNodes: [
    { id: "org-global", name: "Enterprise Holding Global", parentNodeId: null, description: "Ultimate parent organizational node for license pooling consolidation.", allocatedLicensesCount: 128 },
    { id: "org-latam", name: "LATAM Operating Branch", parentNodeId: "org-global", description: "Brazil, Argentina, and Mexico regional legal entities.", allocatedLicensesCount: 30 },
    { id: "org-emea", name: "EMEA Headquarters", parentNodeId: "org-global", description: "European operations holding and branch networks.", allocatedLicensesCount: 45 }
  ],
  enrollmentSites: [
    { id: "site-latam-hq", name: "Sao Paulo LATAM Datacenter", orgNodeId: "org-latam", extenderStatus: "Online", snowExtenderCount: 1, lastSyncDate: "2026-03-01T22:45:00Z" },
    { id: "site-emea-hq", name: "Frankfurt EMEA Core Infrastructure", orgNodeId: "org-emea", extenderStatus: "Online", snowExtenderCount: 2, lastSyncDate: "2026-03-01T23:58:00Z" }
  ],
  auditLogs: [
    { id: "aud-01", timestamp: "2026-03-01T09:12:00Z", operatorUsername: "erico.b@enterprise.com", category: "Authentication", actionDescription: "SSO Secure authentication bypass completed via Azure Active Directory", ipAddress: "189.122.34.10", browserAgent: "Chrome 122.0.0" },
    { id: "aud-02", timestamp: "2026-03-01T11:45:00Z", operatorUsername: "erico.b@enterprise.com", category: "IT Asset Management", actionDescription: "Successfully initialized Effective License Position (ELP) calculation thread. Compliance results saved.", ipAddress: "189.122.34.10", browserAgent: "Chrome 122.0.0" }
  ],
  currencyRates: [
    { code: "USD", symbol: "$", rateToBase: 1 },
    { code: "EUR", symbol: "€", rateToBase: 0.92 },
    { code: "BRL", symbol: "R$", rateToBase: 4.95 },
    { code: "GBP", symbol: "£", rateToBase: 0.79 }
  ],
  ipPolicies: [
    { id: "ip-1", networkCIDR: "189.122.34.0/24", description: "Sao Paulo HQ Administration Secure subnet", policyState: "Allow" },
    { id: "ip-2", networkCIDR: "10.0.0.0/8", description: "On-Premises Gateway VPN CIDR", policyState: "Allow" }
  ],
  mspCustomers: [
    { id: "msp-cust-01", name: "Ambev Holding LATAM SA", complianceScore: 94.5, totalLicenses: 1250, totalDevices: 980 },
    { id: "msp-cust-02", name: "Banco Itau Corporate Systems", complianceScore: 98.2, totalLicenses: 4800, totalDevices: 4120 }
  ],
  adminNotifications: [
    { id: "not-1", date: "2026-03-01T08:00:00Z", type: "Security Alert", message: "New unapproved Shadow IT SaaS Dropbox access logged under host LAP-MKT-E01.", severity: "Warning", isRead: false },
    { id: "not-2", date: "2026-02-28T18:30:00Z", type: "Billing Notification", message: "Microsoft 365 Enterprise SaaS billing period upcoming. 20 unassigned E5 seats represent $1,140 potential saving.", severity: "Info", isRead: true }
  ],
  uploadedFiles: [
    { id: "f-elp-ms-q1", filename: "Microsoft_ELP_Audit_Q1_2026.pdf", mimeType: "application/pdf", sizeBytes: 1450000, uploadedBy: "erico.b@enterprise.com", uploadedAt: "2026-02-28T11:45:00Z" }
  ]
};

try {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
  fs.writeFileSync(DB_FILE, JSON.stringify(seedData, null, 2), "utf-8");
  console.log("Database seeded successfully with 100% complete enterprise asset management profiles!");
  console.log("Durable path:", DB_FILE);
} catch (e: any) {
  console.error("Critical database seeding failed:", e.message);
}
