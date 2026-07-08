import { ensureSchema, loadState, saveState } from "./db.js";
import { 
  Agreement, 
  License, 
  LicensePurchase, 
  LicenseAssignment, 
  SubscriptionLicense, 
  Computer, 
  Installation, 
  MetricType,
  MobileDevice,
  ApplicationCategory,
  Manufacturer,
  SoftwareCatalogItem,
  DiscoveredApplication,
  PrivateCatalogItem,
  SaaSApplication,
  SaaSSubscription,
  SaaSSubscriptionPurchase,
  SaaSUser,
  SaaSUserActivity,
  SaaSConnector,
  CloudConnector,
  CloudResource,
  K8sConnector,
  K8sCluster,
  ContainerPod,
  CustomFieldDefinition,
  CustomFieldValue,
  CustomMetric,
  SavedReport,
  ReportSchedule,
  SSOConfig,
  OAuthClient,
  AdminRole,
  UserGroup,
  AdminUser,
  OrgNode,
  EnrollmentSite,
  AuditLogEntry,
  CurrencyRate,
  IPPolicy,
  MSPCustomer,
  AdminNotification,
  UploadedFile,
  LicensePool
} from "./types.js";

export interface DatabaseState {
  agreements: Agreement[];
  licenses: License[];
  purchases: LicensePurchase[];
  assignments: LicenseAssignment[];
  subscriptionLicenses: SubscriptionLicense[];
  computers: Computer[];
  installations: Installation[];
  mobileDevices: MobileDevice[];
  applicationCategories: ApplicationCategory[];
  manufacturers: Manufacturer[];
  softwareCatalog: SoftwareCatalogItem[];
  discoveredApplications: DiscoveredApplication[];
  privateCatalog: PrivateCatalogItem[];
  // SaaS Management structures
  saasApplications: SaaSApplication[];
  saasSubscriptions: SaaSSubscription[];
  saasSubscriptionPurchases: SaaSSubscriptionPurchase[];
  saasUsers: SaaSUser[];
  saasUserActivities: SaaSUserActivity[];
  saasConnectors: SaaSConnector[];
  // Cloud License Management
  cloudConnectors: CloudConnector[];
  cloudResources: CloudResource[];
  // Container Visibility
  k8sConnectors: K8sConnector[];
  k8sClusters: K8sCluster[];
  containerPods: ContainerPod[];
  // Custom Fields & Metrics
  customFieldDefinitions: CustomFieldDefinition[];
  customFieldValues: CustomFieldValue[];
  customMetrics: CustomMetric[];
  // Reports
  savedReports: SavedReport[];
  reportSchedules: ReportSchedule[];
  // Admin & Security Module
  ssoConfigs: SSOConfig[];
  oauthClients: OAuthClient[];
  adminRoles: AdminRole[];
  userGroups: UserGroup[];
  adminUsers: AdminUser[];
  orgNodes: OrgNode[];
  enrollmentSites: EnrollmentSite[];
  auditLogs: AuditLogEntry[];
  currencyRates: CurrencyRate[];
  ipPolicies: IPPolicy[];
  mspCustomers: MSPCustomer[];
  adminNotifications: AdminNotification[];
  uploadedFiles: UploadedFile[];
  licensePools: LicensePool[];
}

const DEFAULT_AGREEMENTS: Agreement[] = [
  {
    id: "agr-ms-ea",
    name: "Microsoft Enterprise Agreement",
    number: "EA-98741",
    vendor: "Microsoft",
    startDate: "2024-01-01",
    endDate: "2027-01-01",
    status: "Active",
    type: "Enterprise",
    description: "Enterprise licensing agreement covering operating systems, productivity suites, and servers."
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
    description: "Global agreement covering Oracle Database and Middleware licenses."
  },
  {
    id: "agr-adobe-cc",
    name: "Adobe Business Subscription",
    number: "ABS-554",
    vendor: "Adobe",
    startDate: "2025-01-01",
    endDate: "2026-01-01",
    status: "Active",
    type: "SaaS",
    description: "Creative Cloud SaaS subscriptions for design and video production teams."
  },
  {
    id: "agr-sforce-ea",
    name: "Salesforce Cloud Agreement",
    number: "SFA-309",
    vendor: "Salesforce",
    startDate: "2024-10-01",
    endDate: "2025-10-01",
    status: "Active",
    type: "SaaS",
    description: "Sales and Service Cloud subscription covering core CRM users."
  }
];

const DEFAULT_LICENSES: License[] = [
  {
    id: "lic-m365-e5",
    softwareName: "Office 365 Enterprise E5",
    publisher: "Microsoft",
    metricType: MetricType.USERS,
    totalQuantity: 150,
    allocatedQuantity: 80,
    agreementId: "agr-ms-ea",
    licensePoolId: "pool-na-dev",
    status: "Active",
    sku: "M365-E5-ENT",
    version: "O365 Cloud",
    downgradeRights: true,
    isSubscription: true,
    licensePolicy: { mandatoryFields: ["agreementId", "sku"] }
  },
  {
    id: "lic-oracle-db",
    softwareName: "Oracle Database Enterprise Edition",
    publisher: "Oracle",
    metricType: MetricType.PVU,
    totalQuantity: 2000,
    allocatedQuantity: 1600,
    agreementId: "agr-oracle-ma",
    licensePoolId: "pool-global-ent",
    status: "Active",
    sku: "ORCL-DB-EE-PVU",
    version: "19c",
    downgradeRights: true,
    isSubscription: false,
    licensePolicy: { mandatoryFields: ["agreementId"] }
  },
  {
    id: "lic-win-srv",
    softwareName: "Windows Server 2022 Datacenter",
    publisher: "Microsoft",
    metricType: MetricType.PROCESSOR_CORE,
    totalQuantity: 32,
    allocatedQuantity: 24,
    agreementId: "agr-ms-ea",
    licensePoolId: "pool-emea-prod",
    status: "Active",
    sku: "MS-WS22-DC-CORE",
    version: "2022",
    downgradeRights: true,
    isSubscription: false,
    licensePolicy: { mandatoryFields: ["sku"] }
  },
  {
    id: "lic-adobe-cc",
    softwareName: "Adobe Creative Cloud",
    publisher: "Adobe",
    metricType: MetricType.INSTALLATIONS,
    totalQuantity: 5,
    allocatedQuantity: 3,
    agreementId: "agr-adobe-cc",
    status: "Active",
    sku: "AD-CC-ALL",
    version: "2025",
    downgradeRights: false,
    isSubscription: true,
    licensePolicy: { mandatoryFields: ["agreementId"] }
  },
  {
    id: "lic-win-vda",
    softwareName: "Windows Enterprise VDA",
    publisher: "Microsoft",
    metricType: MetricType.VDA,
    totalQuantity: 10,
    allocatedQuantity: 2,
    agreementId: "agr-ms-ea",
    status: "Active",
    sku: "MS-WIN-VDA-VIRTUAL",
    version: "11 Enterprise",
    downgradeRights: true,
    isSubscription: true,
    licensePolicy: { mandatoryFields: ["sku"] }
  },
  {
    id: "lic-incomplete-test",
    softwareName: "IntelliJ IDEA Ultimate",
    publisher: "JetBrains",
    metricType: MetricType.USERS,
    totalQuantity: 0,
    allocatedQuantity: 0,
    status: "Incomplete",
    downgradeRights: true,
    licensePolicy: { mandatoryFields: ["agreementId", "sku"] }
  }
];

const DEFAULT_PURCHASES: LicensePurchase[] = [
  {
    id: "pur-1",
    licenseId: "lic-m365-e5",
    invoiceNumber: "INV-MS-101",
    purchaseDate: "2024-01-15",
    quantity: 100,
    unitCost: 360,
    currency: "USD",
    totalCost: 36000
  },
  {
    id: "pur-2",
    licenseId: "lic-m365-e5",
    invoiceNumber: "INV-MS-202",
    purchaseDate: "2025-01-10",
    quantity: 50,
    unitCost: 380,
    currency: "USD",
    totalCost: 19000
  },
  {
    id: "pur-3",
    licenseId: "lic-oracle-db",
    invoiceNumber: "INV-ORCL-809",
    purchaseDate: "2023-07-01",
    quantity: 2000,
    unitCost: 45,
    currency: "USD",
    totalCost: 90000
  },
  {
    id: "pur-4",
    licenseId: "lic-win-srv",
    invoiceNumber: "INV-MS-101",
    purchaseDate: "2024-01-15",
    quantity: 32,
    unitCost: 120,
    currency: "USD",
    totalCost: 3840
  },
  {
    id: "pur-5",
    licenseId: "lic-adobe-cc",
    invoiceNumber: "INV-AD-332",
    purchaseDate: "2025-01-05",
    quantity: 5,
    unitCost: 600,
    currency: "USD",
    totalCost: 3000
  },
  {
    id: "pur-6",
    licenseId: "lic-win-vda",
    invoiceNumber: "INV-MS-450",
    purchaseDate: "2024-02-01",
    quantity: 10,
    unitCost: 100,
    currency: "USD",
    totalCost: 1000
  }
];

const DEFAULT_ASSIGNMENTS: LicenseAssignment[] = [
  {
    id: "asg-1",
    licenseId: "lic-m365-e5",
    targetType: "User",
    targetId: "ericob3ware@gmail.com",
    quantity: 1,
    allocatedAt: "2024-02-01T10:00:00Z"
  },
  {
    id: "asg-2",
    licenseId: "lic-m365-e5",
    targetType: "OrgUnit",
    targetId: "Engineering Team",
    quantity: 50,
    allocatedAt: "2024-02-01T10:30:00Z"
  },
  {
    id: "asg-3",
    licenseId: "lic-adobe-cc",
    targetType: "User",
    targetId: "alice.vance@company.com",
    quantity: 1,
    allocatedAt: "2025-01-10T09:00:00Z"
  }
];

const DEFAULT_SUBSCRIPTION_LICENSES: SubscriptionLicense[] = [
  {
    id: "sub-1",
    licenseId: "lic-m365-e5",
    startDate: "2024-01-01",
    endDate: "2027-01-01",
    autoRenew: true,
    billingFrequency: "Annually"
  },
  {
    id: "sub-2",
    licenseId: "lic-adobe-cc",
    startDate: "2025-01-01",
    endDate: "2026-01-01",
    autoRenew: true,
    billingFrequency: "Annually"
  }
];

const DEFAULT_COMPUTERS: Computer[] = [
  {
    id: "cmp-pc-1",
    name: "DESKTOP-J89A",
    cores: 4,
    pvuPerCore: 70,
    isVirtual: false,
    os: "Windows",
    ramGB: 16,
    cpuModel: "Intel Core i7-11700",
    serialNumber: "SN-DELL-88219",
    brand: "Dell",
    model: "OptiPlex 7090",
    storageGB: 512,
    warrantyStatus: "Under Warranty",
    warrantyExpirationDate: "2027-12-31",
    lifecycleStatus: "Active",
    lastActiveDate: "2026-07-06T18:30:00Z"
  },
  {
    id: "cmp-pc-2",
    name: "DESKTOP-K12B",
    cores: 8,
    pvuPerCore: 70,
    isVirtual: false,
    os: "Windows",
    ramGB: 32,
    cpuModel: "Intel Core i9-12900",
    serialNumber: "SN-LEN-45912",
    brand: "Lenovo",
    model: "ThinkCentre M90a",
    storageGB: 1024,
    warrantyStatus: "Expired",
    warrantyExpirationDate: "2025-06-01",
    lifecycleStatus: "Active",
    lastActiveDate: "2026-07-07T08:15:00Z"
  },
  {
    id: "cmp-mac-1",
    name: "MACBOOK-PRO-A2",
    cores: 10,
    pvuPerCore: 70,
    isVirtual: false,
    os: "macOS",
    ramGB: 32,
    cpuModel: "Apple M2 Pro",
    serialNumber: "SN-APL-MAC88120",
    brand: "Apple",
    model: "MacBook Pro 16",
    storageGB: 1024,
    warrantyStatus: "Under Warranty",
    warrantyExpirationDate: "2028-01-15",
    lifecycleStatus: "Active",
    lastActiveDate: "2026-07-05T12:00:00Z"
  },
  {
    id: "cmp-srv-db1",
    name: "SRV-ORACLE-01",
    cores: 16,
    pvuPerCore: 100,
    isVirtual: false,
    os: "Linux",
    ramGB: 128,
    cpuModel: "Intel Xeon Platinum 8380",
    serialNumber: "SN-HPE-PRO8892",
    brand: "HPE",
    model: "ProLiant DL380 Gen10",
    storageGB: 4096,
    warrantyStatus: "Under Warranty",
    warrantyExpirationDate: "2028-06-30",
    lifecycleStatus: "Active",
    lastActiveDate: "2026-07-07T09:00:00Z"
  },
  {
    id: "cmp-srv-iis",
    name: "SRV-IIS-02",
    cores: 24,
    pvuPerCore: 100,
    isVirtual: false,
    os: "Windows",
    ramGB: 64,
    cpuModel: "AMD EPYC 7763",
    serialNumber: "SN-DELL-PE88922",
    brand: "Dell",
    model: "PowerEdge R750",
    storageGB: 2048,
    warrantyStatus: "Under Warranty",
    warrantyExpirationDate: "2026-10-15",
    lifecycleStatus: "Active",
    lastActiveDate: "2026-07-07T09:20:00Z"
  },
  {
    id: "cmp-vm-1",
    name: "VM-WIN10-01",
    cores: 2,
    pvuPerCore: 70,
    isVirtual: true,
    os: "Windows",
    ramGB: 8,
    cpuModel: "Virtualized Processor",
    serialNumber: "SN-VM-WIN10-01",
    brand: "VMware",
    model: "ESXi vSphere Client Instance",
    storageGB: 100,
    warrantyStatus: "No Info",
    warrantyExpirationDate: "",
    lifecycleStatus: "Active",
    lastActiveDate: "2026-07-07T05:00:00Z"
  },
  {
    id: "cmp-vm-2",
    name: "VM-WIN10-02",
    cores: 2,
    pvuPerCore: 70,
    isVirtual: true,
    os: "Windows",
    ramGB: 8,
    cpuModel: "Virtualized Processor",
    serialNumber: "SN-VM-WIN10-02",
    brand: "VMware",
    model: "ESXi vSphere Client Instance",
    storageGB: 100,
    warrantyStatus: "No Info",
    warrantyExpirationDate: "",
    lifecycleStatus: "Inactive",
    lastActiveDate: "2026-04-12T14:22:00Z"
  }
];

const DEFAULT_INSTALLATIONS: Installation[] = [
  {
    id: "inst-1",
    softwareName: "Office 365 Enterprise E5",
    publisher: "Microsoft",
    version: "v2402",
    computerId: "cmp-pc-1",
    userName: "alice.vance@company.com",
    detectedAt: "2026-01-10T12:00:00Z"
  },
  {
    id: "inst-2",
    softwareName: "Office 365 Enterprise E5",
    publisher: "Microsoft",
    version: "v2402",
    computerId: "cmp-vm-1",
    userName: "alice.vance@company.com",
    detectedAt: "2026-02-15T09:30:00Z"
  },
  {
    id: "inst-3",
    softwareName: "Office 365 Enterprise E5",
    publisher: "Microsoft",
    version: "v2402",
    computerId: "cmp-pc-2",
    userName: "bob.smith@company.com",
    detectedAt: "2026-01-12T14:22:00Z"
  },
  {
    id: "inst-4",
    softwareName: "Office 365 Enterprise E5",
    publisher: "Microsoft",
    version: "v2402",
    computerId: "cmp-vm-2",
    userName: "charlie.brown@company.com",
    detectedAt: "2026-03-01T10:00:00Z"
  },
  {
    id: "inst-5",
    softwareName: "Oracle Database Enterprise Edition",
    publisher: "Oracle",
    version: "19c",
    computerId: "cmp-srv-db1",
    userName: "oracle-srv",
    detectedAt: "2025-06-20T08:00:00Z"
  },
  {
    id: "inst-6",
    softwareName: "Windows Server 2022 Datacenter",
    publisher: "Microsoft",
    version: "2022",
    computerId: "cmp-srv-iis",
    userName: "sys-admin",
    detectedAt: "2025-01-20T11:00:00Z"
  },
  {
    id: "inst-7",
    softwareName: "Adobe Creative Cloud",
    publisher: "Adobe",
    version: "v2025",
    computerId: "cmp-pc-1",
    userName: "alice.vance@company.com",
    detectedAt: "2025-02-01T15:00:00Z"
  },
  {
    id: "inst-8",
    softwareName: "Adobe Creative Cloud",
    publisher: "Adobe",
    version: "v2025",
    computerId: "cmp-pc-2",
    userName: "bob.smith@company.com",
    detectedAt: "2025-02-05T09:00:00Z"
  },
  {
    id: "inst-9",
    softwareName: "Adobe Creative Cloud",
    publisher: "Adobe",
    version: "v2025",
    computerId: "cmp-mac-1",
    userName: "charlie.brown@company.com",
    detectedAt: "2025-02-10T10:15:00Z"
  },
  {
    id: "inst-10",
    softwareName: "Windows Enterprise VDA",
    publisher: "Microsoft",
    version: "11 Enterprise",
    computerId: "cmp-vm-1",
    userName: "alice.vance@company.com",
    detectedAt: "2026-02-15T09:30:00Z"
  },
  {
    id: "inst-11",
    softwareName: "Windows Enterprise VDA",
    publisher: "Microsoft",
    version: "11 Enterprise",
    computerId: "cmp-vm-2",
    userName: "charlie.brown@company.com",
    detectedAt: "2026-03-01T10:00:00Z"
  }
];

// -------------------------------------------------------------
// NEW DIS (Data Intelligence Service) SEED DATA
// -------------------------------------------------------------

const DEFAULT_MOBILE_DEVICES: MobileDevice[] = [
  {
    id: "mob-1",
    name: "IPHONE-EB-01",
    brand: "Apple",
    model: "iPhone 15 Pro",
    os: "iOS 17",
    serialNumber: "SN-MOB-APP7761",
    userName: "ericob3ware@gmail.com",
    warrantyStatus: "Under Warranty",
    warrantyExpirationDate: "2026-09-20",
    lifecycleStatus: "Active",
    lastActiveDate: "2026-07-07T08:00:00Z"
  },
  {
    id: "mob-2",
    name: "SAMSUNG-AV-02",
    brand: "Samsung",
    model: "Galaxy S24 Ultra",
    os: "Android 14",
    serialNumber: "SN-MOB-SAM9902",
    userName: "alice.vance@company.com",
    warrantyStatus: "Under Warranty",
    warrantyExpirationDate: "2027-02-15",
    lifecycleStatus: "Active",
    lastActiveDate: "2026-07-06T19:40:00Z"
  }
];

const DEFAULT_APPLICATION_CATEGORIES: ApplicationCategory[] = [
  { id: "cat-os", name: "Operating System", description: "Base platform operating systems" },
  { id: "cat-office", name: "Office & Productivity", description: "Word processing, spreadsheet, and business presentation suites" },
  { id: "cat-design", name: "Design & Creative", description: "Vector drawing, video editing, and digital asset creation suites" },
  { id: "cat-dbms", name: "Database Systems", description: "Relational, document, and persistent enterprise database management platforms" },
  { id: "cat-security", name: "Security & Utilities", description: "Anti-malware, VPN, security agent, and monitoring utilities" },
  { id: "cat-dev", name: "Developer Tools", description: "Integrated Development Environments, compilers, and debugging toolkits" },
  { id: "cat-collab", name: "Collaboration", description: "Team communication, chat channels, and audio/video meeting endpoints" },
  { id: "cat-browser", name: "Web Browser", description: "Universal web browsers and rendering engines" }
];

const DEFAULT_MANUFACTURERS: Manufacturer[] = [
  { id: "man-ms", name: "Microsoft Corporation", website: "https://www.microsoft.com" },
  { id: "man-adobe", name: "Adobe Systems Incorporated", website: "https://www.adobe.com" },
  { id: "man-oracle", name: "Oracle Corporation", website: "https://www.oracle.com" },
  { id: "man-ibm", name: "IBM Corporation", website: "https://www.ibm.com" },
  { id: "man-jetbrains", name: "JetBrains s.r.o.", website: "https://www.jetbrains.com" },
  { id: "man-slack", name: "Slack Technologies (Salesforce)", website: "https://www.slack.com" },
  { id: "man-zoom", name: "Zoom Video Communications", website: "https://www.zoom.us" },
  { id: "man-google", name: "Google LLC", website: "https://www.google.com" }
];

const DEFAULT_SOFTWARE_CATALOG: SoftwareCatalogItem[] = [
  {
    id: "cat-item-m365",
    softwareName: "Office 365 Enterprise E5",
    publisher: "Microsoft Corporation",
    categoryId: "cat-office",
    defaultSku: "M365-E5-ENT",
    version: "O365 Cloud",
    isMalware: false,
    compatibleOS: ["Windows", "macOS"]
  },
  {
    id: "cat-item-win11",
    softwareName: "Windows 11 Enterprise",
    publisher: "Microsoft Corporation",
    categoryId: "cat-os",
    defaultSku: "MS-WIN11-ENT",
    version: "11",
    isMalware: false,
    compatibleOS: ["Windows"]
  },
  {
    id: "cat-item-oracle-db",
    softwareName: "Oracle Database Enterprise Edition",
    publisher: "Oracle Corporation",
    categoryId: "cat-dbms",
    defaultSku: "ORCL-DB-EE-PVU",
    version: "19c",
    eolDate: "2027-12-31",
    eosDate: "2026-06-30",
    isMalware: false,
    compatibleOS: ["Linux", "Windows"]
  },
  {
    id: "cat-item-win-srv",
    softwareName: "Windows Server 2022 Datacenter",
    publisher: "Microsoft Corporation",
    categoryId: "cat-os",
    defaultSku: "MS-WS22-DC-CORE",
    version: "2022",
    isMalware: false,
    compatibleOS: ["Windows"]
  },
  {
    id: "cat-item-acrobat",
    softwareName: "Adobe Acrobat Reader DC",
    publisher: "Adobe Systems Incorporated",
    categoryId: "cat-office",
    defaultSku: "AD-ACRO-DC",
    version: "20.x",
    isMalware: false,
    compatibleOS: ["Windows", "macOS"]
  },
  {
    id: "cat-item-photoshop",
    softwareName: "Adobe Photoshop CC",
    publisher: "Adobe Systems Incorporated",
    categoryId: "cat-design",
    defaultSku: "AD-PSD-CC",
    version: "v2025",
    isMalware: false,
    compatibleOS: ["Windows", "macOS"]
  },
  {
    id: "cat-item-chrome",
    softwareName: "Google Chrome",
    publisher: "Google LLC",
    categoryId: "cat-browser",
    defaultSku: "GGL-CHROME",
    version: "120.x",
    isMalware: false,
    compatibleOS: ["Windows", "macOS", "Linux"]
  },
  {
    id: "cat-item-intellij",
    softwareName: "IntelliJ IDEA Ultimate",
    publisher: "JetBrains s.r.o.",
    categoryId: "cat-dev",
    defaultSku: "JB-IDEA-ULT",
    version: "2024.1",
    isMalware: false,
    compatibleOS: ["Windows", "macOS", "Linux"]
  },
  {
    id: "cat-item-slack",
    softwareName: "Slack Desktop Client",
    publisher: "Slack Technologies (Salesforce)",
    categoryId: "cat-collab",
    defaultSku: "SLK-DSK-PRO",
    version: "4.35",
    isMalware: false,
    compatibleOS: ["Windows", "macOS", "Linux"]
  },
  {
    id: "cat-item-zoom",
    softwareName: "Zoom Client for Meetings",
    publisher: "Zoom Video Communications",
    categoryId: "cat-collab",
    defaultSku: "ZM-MTG-PRO",
    version: "5.17",
    isMalware: false,
    compatibleOS: ["Windows", "macOS", "Linux"]
  },
  {
    id: "cat-item-m365-e3",
    softwareName: "Office 365 Enterprise E3",
    publisher: "Microsoft Corporation",
    categoryId: "cat-office",
    defaultSku: "M365-E3-ENT",
    version: "O365 Cloud",
    isMalware: false,
    compatibleOS: ["Windows", "macOS"]
  },
  {
    id: "cat-item-sql-srv",
    softwareName: "Microsoft SQL Server 2019 Standard",
    publisher: "Microsoft Corporation",
    categoryId: "cat-dbms",
    defaultSku: "MS-SQL-19-STD",
    version: "2019",
    eolDate: "2025-01-14",
    eosDate: "2024-07-09",
    isMalware: false,
    compatibleOS: ["Windows", "Linux"]
  },
  {
    id: "cat-item-malware",
    softwareName: "CryptoMiner Background Miner Tool",
    publisher: "Unknown Malicious Group",
    categoryId: "cat-security",
    defaultSku: "MALW-MINER-01",
    version: "2.1",
    isMalware: true,
    compatibleOS: ["Windows", "Linux"]
  },
  {
    id: "cat-item-flash",
    softwareName: "Adobe Flash Player Plugin",
    publisher: "Adobe Systems Incorporated",
    categoryId: "cat-browser",
    defaultSku: "AD-FLASH-PLG",
    version: "32.0",
    eolDate: "2020-12-31",
    eosDate: "2020-12-31",
    isMalware: true,
    compatibleOS: ["Windows", "macOS"]
  }
];

const DEFAULT_DISCOVERED_APPLICATIONS: DiscoveredApplication[] = [
  {
    id: "disc-1",
    computerId: "cmp-pc-1",
    catalogItemId: "cat-item-m365",
    softwareName: "Office 365 Enterprise E5",
    rawSoftwareName: "Microsoft Office 365 ProPlus - en-us v16.0",
    publisher: "Microsoft Corporation",
    version: "v2402",
    lastUsed: "2026-07-06T15:00:00Z",
    usageDurationMinutes: 1420
  },
  {
    id: "disc-2",
    computerId: "cmp-pc-1",
    catalogItemId: "cat-item-acrobat",
    softwareName: "Adobe Acrobat Reader DC",
    rawSoftwareName: "Acrobat Reader DC 20.012.20048",
    publisher: "Adobe Systems Incorporated",
    version: "20.012",
    lastUsed: "2026-07-05T10:00:00Z",
    usageDurationMinutes: 480
  },
  {
    id: "disc-3",
    computerId: "cmp-pc-2",
    catalogItemId: "cat-item-m365",
    softwareName: "Office 365 Enterprise E5",
    rawSoftwareName: "M365 E5 Suite Enterprise",
    publisher: "Microsoft Corporation",
    version: "v2402",
    lastUsed: "2026-07-07T08:00:00Z",
    usageDurationMinutes: 980
  },
  {
    id: "disc-4",
    computerId: "cmp-pc-2",
    catalogItemId: "cat-item-chrome",
    softwareName: "Google Chrome",
    rawSoftwareName: "Chrome Browser Setup 118.0.22",
    publisher: "Google LLC",
    version: "118.0.22",
    lastUsed: "2026-07-07T08:10:00Z",
    usageDurationMinutes: 5200
  },
  {
    id: "disc-5",
    computerId: "cmp-srv-db1",
    catalogItemId: "cat-item-oracle-db",
    softwareName: "Oracle Database Enterprise Edition",
    rawSoftwareName: "Oracle_DB_Enterprise_19c_Release_3",
    publisher: "Oracle Corporation",
    version: "19c",
    lastUsed: "2026-07-07T09:00:00Z",
    usageDurationMinutes: 45000
  },
  {
    id: "disc-6",
    computerId: "cmp-pc-2",
    catalogItemId: "cat-item-malware",
    softwareName: "CryptoMiner Background Miner Tool",
    rawSoftwareName: "cryptominer_v2.1_setup.exe",
    publisher: "Unknown Malicious Group",
    version: "2.1",
    lastUsed: "2026-07-06T23:55:00Z",
    usageDurationMinutes: 120
  }
];

const DEFAULT_PRIVATE_CATALOG: PrivateCatalogItem[] = [
  {
    id: "priv-1",
    softwareName: "Corporate TimeTracker",
    publisher: "Internal Systems Group",
    matchPattern: "timetracker.internal",
    categoryId: "cat-office",
    notes: "Proprietary internal SaaS app tracked via URL extension scan"
  }
];

export const DEFAULT_SAAS_APPLICATIONS: SaaSApplication[] = [
  {
    id: "saas-app-m365",
    name: "Microsoft 365",
    publisher: "Microsoft",
    category: "Office & Productivity",
    riskScore: 12,
    isApproved: true,
    familyName: "Microsoft 365",
    discoveredSources: ["Connector: M365", "SSO: Okta", "Browser Extension"]
  },
  {
    id: "saas-app-gworkspace",
    name: "Google Workspace",
    publisher: "Google",
    category: "Collaboration",
    riskScore: 15,
    isApproved: true,
    discoveredSources: ["Connector: Google Workspace", "SSO: Okta"]
  },
  {
    id: "saas-app-salesforce",
    name: "Salesforce Sales Cloud",
    publisher: "Salesforce",
    category: "CRM",
    riskScore: 18,
    isApproved: true,
    familyName: "Salesforce",
    discoveredSources: ["Connector: Salesforce", "SSO: Okta"]
  },
  {
    id: "saas-app-servicenow",
    name: "ServiceNow ITSM",
    publisher: "ServiceNow",
    category: "ITSM",
    riskScore: 20,
    isApproved: true,
    familyName: "ServiceNow",
    discoveredSources: ["SSO: Okta"]
  },
  {
    id: "saas-app-adobe-cc",
    name: "Adobe Creative Cloud",
    publisher: "Adobe",
    category: "Design & Creative",
    riskScore: 10,
    isApproved: true,
    familyName: "Adobe Creative Cloud",
    discoveredSources: ["Browser Extension", "Connector: Adobe"]
  },
  {
    id: "saas-app-slack",
    name: "Slack",
    publisher: "Slack Technologies",
    category: "Collaboration",
    riskScore: 25,
    isApproved: true,
    discoveredSources: ["SSO: Okta", "Browser Extension"]
  },
  {
    id: "saas-app-zoom",
    name: "Zoom",
    publisher: "Zoom Video Communications",
    category: "Collaboration",
    riskScore: 28,
    isApproved: true,
    discoveredSources: ["SSO: Okta"]
  },
  {
    id: "saas-app-shadow-ai",
    name: "Copy.ai",
    publisher: "CopyAI Inc",
    category: "AI Assistant",
    riskScore: 78,
    isApproved: false,
    discoveredSources: ["CASB: Defender", "Browser Extension"]
  },
  {
    id: "saas-app-shadow-torrent",
    name: "WebTorrent Client",
    publisher: "WebTorrent",
    category: "File Sharing",
    riskScore: 92,
    isApproved: false,
    discoveredSources: ["CASB: Defender"]
  }
];

export const DEFAULT_SAAS_SUBSCRIPTIONS: SaaSSubscription[] = [
  {
    id: "saas-sub-m365-e5",
    saasApplicationId: "saas-app-m365",
    sku: "M365-E5-OFFICE",
    planName: "Enterprise E5",
    billingFrequency: "Monthly",
    seatsTotal: 150,
    seatsAssigned: 124,
    costPerSeat: 36,
    currency: "USD",
    status: "Active",
    isFree: false,
    isExcluded: false,
    expirationDate: "2027-01-01"
  },
  {
    id: "saas-sub-gworkspace-ent",
    saasApplicationId: "saas-app-gworkspace",
    sku: "GWORK-ENT-PROD",
    planName: "Enterprise Plus",
    billingFrequency: "Monthly",
    seatsTotal: 50,
    seatsAssigned: 35,
    costPerSeat: 30,
    currency: "USD",
    status: "Active",
    isFree: false,
    isExcluded: false,
    expirationDate: "2027-06-30"
  },
  {
    id: "saas-sub-salesforce-ent",
    saasApplicationId: "saas-app-salesforce",
    sku: "SFORCE-CRM-ENT",
    planName: "Sales Cloud Enterprise",
    billingFrequency: "Monthly",
    seatsTotal: 40,
    seatsAssigned: 38,
    costPerSeat: 150,
    currency: "USD",
    status: "Active",
    isFree: false,
    isExcluded: false,
    expirationDate: "2026-12-31"
  },
  {
    id: "saas-sub-adobe-all",
    saasApplicationId: "saas-app-adobe-cc",
    sku: "ADOBE-CC-ALL-APPS",
    planName: "Creative Cloud All Apps",
    billingFrequency: "Monthly",
    seatsTotal: 30,
    seatsAssigned: 15,
    costPerSeat: 80,
    currency: "USD",
    status: "Active",
    isFree: false,
    isExcluded: false,
    expirationDate: "2026-10-15"
  },
  {
    id: "saas-sub-servicenow-pro",
    saasApplicationId: "saas-app-servicenow",
    sku: "SNOW-ITSM-PRO",
    planName: "ITSM Professional Suite",
    billingFrequency: "Monthly",
    seatsTotal: 15,
    seatsAssigned: 15,
    costPerSeat: 100,
    currency: "USD",
    status: "Active",
    isFree: false,
    isExcluded: false,
    expirationDate: "2027-02-15"
  },
  {
    id: "saas-sub-slack-pro",
    saasApplicationId: "saas-app-slack",
    sku: "SLK-PRO-TEAM",
    planName: "Slack Pro",
    billingFrequency: "Monthly",
    seatsTotal: 100,
    seatsAssigned: 92,
    costPerSeat: 8,
    currency: "USD",
    status: "Active",
    isFree: false,
    isExcluded: false,
    expirationDate: "2026-12-31"
  }
];

export const DEFAULT_SAAS_SUBSCRIPTION_PURCHASES: SaaSSubscriptionPurchase[] = [
  {
    id: "saas-pur-m365",
    subscriptionId: "saas-sub-m365-e5",
    purchaseDate: "2025-01-01",
    quantity: 150,
    unitCost: 36,
    totalCost: 5400,
    invoiceNumber: "INV-S-M365-998"
  },
  {
    id: "saas-pur-gwork",
    subscriptionId: "saas-sub-gworkspace-ent",
    purchaseDate: "2025-02-10",
    quantity: 50,
    unitCost: 30,
    totalCost: 1500,
    invoiceNumber: "INV-S-GWORK-112"
  },
  {
    id: "saas-pur-salesforce",
    subscriptionId: "saas-sub-salesforce-ent",
    purchaseDate: "2025-01-15",
    quantity: 40,
    unitCost: 150,
    totalCost: 6000,
    invoiceNumber: "INV-S-SF-445"
  }
];

export const DEFAULT_SAAS_USERS: SaaSUser[] = [
  {
    id: "saas-usr-1",
    name: "Érico B.",
    email: "ericob3ware@gmail.com",
    department: "Engineering",
    status: "Active",
    identitySources: ["M365", "Google Workspace", "Okta SSO"]
  },
  {
    id: "saas-usr-2",
    name: "Alice Vance",
    email: "alice.vance@company.com",
    department: "Product/Design",
    status: "Active",
    identitySources: ["M365", "Adobe Creative Cloud", "Okta SSO"]
  },
  {
    id: "saas-usr-3",
    name: "Bob Smith",
    email: "bob.smith@company.com",
    department: "Sales",
    status: "Active",
    identitySources: ["M365", "Salesforce Sales Cloud"]
  },
  {
    id: "saas-usr-4",
    name: "Charlie Brown",
    email: "charlie.brown@company.com",
    department: "Engineering",
    status: "Active",
    identitySources: ["Google Workspace", "M365", "Okta SSO"]
  },
  {
    id: "saas-usr-5",
    name: "David Miller",
    email: "david.miller@company.com",
    department: "Marketing",
    status: "Active",
    identitySources: ["M365", "Okta SSO"]
  },
  {
    id: "saas-usr-6",
    name: "Eve Pollard",
    email: "eve.pollard@company.com",
    department: "Human Resources",
    status: "Active",
    identitySources: ["Okta SSO"]
  }
];

export const DEFAULT_SAAS_USER_ACTIVITIES: SaaSUserActivity[] = [
  {
    id: "act-1",
    saasApplicationId: "saas-app-m365",
    saasUserId: "saas-usr-1",
    lastActiveDate: "2026-07-07T09:12:00Z",
    usageDurationMinutes: 1200,
    activityLevel: "Active",
    sourceConnector: "Connector: M365"
  },
  {
    id: "act-2",
    saasApplicationId: "saas-app-gworkspace",
    saasUserId: "saas-usr-1",
    lastActiveDate: "2026-07-06T17:00:00Z",
    usageDurationMinutes: 450,
    activityLevel: "Active",
    sourceConnector: "Connector: Google Workspace"
  },
  {
    id: "act-3",
    saasApplicationId: "saas-app-adobe-cc",
    saasUserId: "saas-usr-2",
    lastActiveDate: "2026-07-07T08:30:00Z",
    usageDurationMinutes: 1800,
    activityLevel: "Active",
    sourceConnector: "Connector: Adobe"
  },
  {
    id: "act-4",
    saasApplicationId: "saas-app-adobe-cc",
    saasUserId: "saas-usr-5",
    lastActiveDate: "2026-03-12T10:00:00Z",
    usageDurationMinutes: 10,
    activityLevel: "Inactive",
    sourceConnector: "Browser Extension"
  },
  {
    id: "act-5",
    saasApplicationId: "saas-app-salesforce",
    saasUserId: "saas-usr-3",
    lastActiveDate: "2026-06-28T14:15:00Z",
    usageDurationMinutes: 120,
    activityLevel: "Low Activity",
    sourceConnector: "Connector: Salesforce"
  },
  {
    id: "act-6",
    saasApplicationId: "saas-app-shadow-ai",
    saasUserId: "saas-usr-4",
    lastActiveDate: "2026-07-07T05:22:00Z",
    usageDurationMinutes: 45,
    activityLevel: "Active",
    sourceConnector: "CASB: Defender"
  },
  {
    id: "act-7",
    saasApplicationId: "saas-app-shadow-torrent",
    saasUserId: "saas-usr-4",
    lastActiveDate: "2026-07-05T19:00:00Z",
    usageDurationMinutes: 240,
    activityLevel: "Active",
    sourceConnector: "CASB: Defender"
  },
  {
    id: "act-8",
    saasApplicationId: "saas-app-slack",
    saasUserId: "saas-usr-1",
    lastActiveDate: "2026-07-07T09:44:00Z",
    usageDurationMinutes: 3400,
    activityLevel: "Active",
    sourceConnector: "SSO: Okta"
  },
  {
    id: "act-9",
    saasApplicationId: "saas-app-slack",
    saasUserId: "saas-usr-2",
    lastActiveDate: "2026-07-07T07:15:00Z",
    usageDurationMinutes: 1500,
    activityLevel: "Active",
    sourceConnector: "SSO: Okta"
  }
];

export const DEFAULT_SAAS_CONNECTORS: SaaSConnector[] = [
  {
    id: "conn-m365",
    name: "Microsoft 365 Connector",
    type: "VendorAPI",
    status: "Connected",
    lastSyncedAt: "2026-07-07T09:00:00Z",
    recordCount: 150
  },
  {
    id: "conn-gworkspace",
    name: "Google Workspace Integration",
    type: "VendorAPI",
    status: "Connected",
    lastSyncedAt: "2026-07-07T08:30:00Z",
    recordCount: 50
  },
  {
    id: "conn-salesforce",
    name: "Salesforce CRM Link",
    type: "VendorAPI",
    status: "Connected",
    lastSyncedAt: "2026-07-07T08:00:00Z",
    recordCount: 40
  },
  {
    id: "conn-okta",
    name: "Okta Identity Cloud SSO",
    type: "SSO",
    status: "Connected",
    lastSyncedAt: "2026-07-07T09:15:00Z",
    recordCount: 120
  },
  {
    id: "conn-defender",
    name: "Microsoft Defender CASB",
    type: "CASB",
    status: "Connected",
    lastSyncedAt: "2026-07-07T07:45:00Z",
    recordCount: 45
  },
  {
    id: "conn-extension",
    name: "Agent Web Extension Gateway",
    type: "BrowserExtension",
    status: "Connected",
    lastSyncedAt: "2026-07-07T09:30:00Z",
    recordCount: 33
  }
];

export const DEFAULT_CLOUD_CONNECTORS: CloudConnector[] = [
  {
    id: "cloud-conn-aws",
    name: "AWS Production Org Connector",
    provider: "AWS",
    status: "Connected",
    lastSyncedAt: "2026-07-06T12:00:00Z",
    resourceCount: 3
  },
  {
    id: "cloud-conn-azure",
    name: "Azure Enterprise Subscription",
    provider: "Azure",
    status: "Connected",
    lastSyncedAt: "2026-07-06T13:15:00Z",
    resourceCount: 2
  },
  {
    id: "cloud-conn-gcp",
    name: "GCP Sandbox Project",
    provider: "GCP",
    status: "Disconnected",
    lastSyncedAt: "2026-07-05T10:00:00Z",
    resourceCount: 1
  }
];

export const DEFAULT_CLOUD_RESOURCES: CloudResource[] = [
  {
    id: "res-aws-1",
    connectorId: "cloud-conn-aws",
    name: "aws-prod-sql-vm",
    provider: "AWS",
    type: "VM",
    cost: 1200,
    pricingModel: "PAYG",
    softwareInstalled: ["Microsoft SQL Server 2022"],
    hasLicenseCoverage: false,
    recommendation: "Convert to BYOL: Save $450/month using your existing Microsoft SQL Enterprise core licenses."
  },
  {
    id: "res-aws-2",
    connectorId: "cloud-conn-aws",
    name: "aws-dev-web-01",
    provider: "AWS",
    type: "VM",
    cost: 150,
    pricingModel: "PAYG",
    softwareInstalled: ["Ubuntu Linux"],
    hasLicenseCoverage: true,
    recommendation: "No actions needed."
  },
  {
    id: "res-aws-3",
    connectorId: "cloud-conn-aws",
    name: "aws-prod-oracle-01",
    provider: "AWS",
    type: "VM",
    cost: 3200,
    pricingModel: "BYOL",
    softwareInstalled: ["Oracle Database 19c Enterprise"],
    hasLicenseCoverage: true,
    recommendation: "Double-pay check: Confirmed BYOL license mapped to Oracle core count."
  },
  {
    id: "res-azure-1",
    connectorId: "cloud-conn-azure",
    name: "azure-prod-winserver",
    provider: "Azure",
    type: "VM",
    cost: 800,
    pricingModel: "PAYG",
    softwareInstalled: ["Windows Server 2022 DataCenter"],
    hasLicenseCoverage: false,
    recommendation: "Double-Pay Detected! You are paying Azure for Windows licenses while you have active hybrid benefits under Microsoft EA Agreement EA-98741. Enable BYOL Azure Hybrid Benefit to save $220/month."
  },
  {
    id: "res-azure-2",
    connectorId: "cloud-conn-azure",
    name: "azure-sql-managed-db",
    provider: "Azure",
    type: "Database",
    cost: 2400,
    pricingModel: "BYOL",
    softwareInstalled: ["Microsoft SQL Server 2019"],
    hasLicenseCoverage: true,
    recommendation: "BYOL coverage active."
  },
  {
    id: "res-gcp-1",
    connectorId: "cloud-conn-gcp",
    name: "gcp-k8s-node-01",
    provider: "GCP",
    type: "VM",
    cost: 450,
    pricingModel: "PAYG",
    softwareInstalled: ["Red Hat Enterprise Linux"],
    hasLicenseCoverage: true,
    recommendation: "RHEL Subscription attached."
  }
];

export const DEFAULT_K8S_CONNECTORS: K8sConnector[] = [
  {
    id: "k8s-conn-eks",
    name: "EKS Production Cluster Gateway",
    status: "Connected",
    lastSyncedAt: "2026-07-07T08:30:00Z",
    clusterCount: 1
  },
  {
    id: "k8s-conn-onprem",
    name: "On-Premises OpenShift Agent",
    status: "Connected",
    lastSyncedAt: "2026-07-07T09:00:00Z",
    clusterCount: 1
  }
];

export const DEFAULT_K8S_CLUSTERS: K8sCluster[] = [
  {
    id: "clus-eks-1",
    name: "eks-prod-01",
    namespaceCount: 8,
    podCount: 12
  },
  {
    id: "clus-onprem-1",
    name: "k8s-onprem-01",
    namespaceCount: 4,
    podCount: 6
  }
];

export const DEFAULT_CONTAINER_PODS: ContainerPod[] = [
  {
    id: "pod-1",
    clusterId: "clus-eks-1",
    namespace: "default",
    podName: "oracle-pod-9b8",
    containerName: "oracle-db",
    imageName: "oracle/database:19.3.0-ee",
    softwareRunning: ["Oracle Database 19c Enterprise"],
    licenseStatus: "BYOL Coverage Checked"
  },
  {
    id: "pod-2",
    clusterId: "clus-eks-1",
    namespace: "production",
    podName: "mssql-pod-77d",
    containerName: "sql-engine",
    imageName: "mcr.microsoft.com/mssql/server:2022-latest",
    softwareRunning: ["Microsoft SQL Server 2022"],
    licenseStatus: "Non-Compliant"
  },
  {
    id: "pod-3",
    clusterId: "clus-eks-1",
    namespace: "web",
    podName: "nginx-proxy-ff4",
    containerName: "nginx",
    imageName: "nginx:alpine",
    softwareRunning: ["NGINX Open Source"],
    licenseStatus: "Compliant"
  },
  {
    id: "pod-4",
    clusterId: "clus-onprem-1",
    namespace: "finance",
    podName: "sap-app-54c",
    containerName: "sap-netweaver",
    imageName: "sap/netweaver:7.5",
    softwareRunning: ["SAP NetWeaver"],
    licenseStatus: "Compliant"
  }
];

export const DEFAULT_CUSTOM_FIELD_DEFINITIONS: CustomFieldDefinition[] = [
  {
    id: "cf-def-cost-center",
    targetType: "License",
    name: "Cost Center",
    fieldType: "Text"
  },
  {
    id: "cf-def-asset-tag",
    targetType: "Computer",
    name: "Asset Tag",
    fieldType: "Text"
  },
  {
    id: "cf-def-criticality",
    targetType: "Application",
    name: "Criticality",
    fieldType: "Text"
  },
  {
    id: "cf-def-business-owner",
    targetType: "Subscription",
    name: "Business Owner",
    fieldType: "Text"
  }
];

export const DEFAULT_CUSTOM_FIELD_VALUES: CustomFieldValue[] = [
  {
    id: "cf-val-1",
    definitionId: "cf-def-cost-center",
    entityId: "lic-ms-sql",
    value: "CC-FINANCE-01"
  },
  {
    id: "cf-val-2",
    definitionId: "cf-def-asset-tag",
    entityId: "comp-ws-1",
    value: "TAG-2026-001"
  }
];

export const DEFAULT_CUSTOM_METRICS: CustomMetric[] = [
  {
    id: "met-1",
    name: "Unused SaaS License Cost",
    description: "Total monthly cost of SaaS subscriptions with 'No Activity' or 'Inactive' status.",
    queryCriteria: "SaaS Subscriptions status == 'No Activity' || 'Inactive'",
    value: 4320
  },
  {
    id: "met-2",
    name: "SQL Server Double-Pay Cost",
    description: "Total monthly waste from cloud virtual machines running SQL Server on PAYG instead of BYOL.",
    queryCriteria: "Cloud resources with softwareInstalled includes 'SQL Server' AND pricingModel == 'PAYG'",
    value: 1850
  }
];

export const DEFAULT_SAVED_REPORTS: SavedReport[] = [
  {
    id: "rep-1",
    name: "Microsoft Compliance ELP Report",
    description: "Effective License Position for all Microsoft licenses under Active agreements.",
    columns: ["Software Name", "Publisher", "Metric Type", "Total Quantity", "Allocated Quantity", "Status"],
    filters: { publisher: "Microsoft" },
    targetType: "Licenses"
  },
  {
    id: "rep-2",
    name: "High Risk Shadow IT Applications",
    description: "SaaS applications with risk scores higher than 70 discovered via defender/browser extensions.",
    columns: ["name", "publisher", "category", "riskScore", "discoveredSources"],
    filters: { riskScoreMin: 70 },
    targetType: "Subscriptions"
  }
];

export const DEFAULT_REPORT_SCHEDULES: ReportSchedule[] = [
  {
    id: "sch-1",
    reportId: "rep-1",
    frequency: "Weekly",
    deliveryType: "Email",
    recipients: ["it-compliance@company.com"],
    status: "Active"
  },
  {
    id: "sch-2",
    reportId: "rep-2",
    frequency: "Monthly",
    deliveryType: "SharePoint",
    recipients: ["https://company.sharepoint.com/teams/itam"],
    status: "Active"
  }
];

export const DEFAULT_SSO_CONFIGS: SSOConfig[] = [
  { id: "sso-azure", provider: "AzureAD", name: "Azure AD Integration", clientId: "00000000-0000-0000-0000-000000000000", domainUrl: "login.microsoftonline.com/company.onmicrosoft.com", status: "Enabled" },
  { id: "sso-google", provider: "GoogleWorkspace", name: "Google Workspace Admin Directory", clientId: "company-google-oauth-client-id.apps.googleusercontent.com", domainUrl: "accounts.google.com/o/oauth2", status: "Disabled" },
  { id: "sso-okta", provider: "Okta", name: "Okta Identity Portal SSO", clientId: "okta_client_id_77d3", domainUrl: "company.okta.com", status: "Enabled" }
];

export const DEFAULT_OAUTH_CLIENTS: OAuthClient[] = [
  { id: "oauth-client-snow", name: "Snow Extender Security Gateway", clientId: "snow_ext_client_8c892b", clientSecret: "••••••••••••••••••••••••••••••••", scopes: ["inventory:write", "computers:read"], lastUsedAt: "2026-07-07T09:30:00Z", status: "Active" },
  { id: "oauth-client-servicenow", name: "ServiceNow ITSM Enhancer Client", clientId: "snow_itsm_client_44fa12", clientSecret: "••••••••••••••••••••••••••••••••", scopes: ["compliance:read", "licenses:read"], lastUsedAt: "2026-07-06T15:22:00Z", status: "Active" }
];

export const DEFAULT_ADMIN_ROLES: AdminRole[] = [
  { id: "role-sysadmin", name: "System Administrator", isSystem: true, permissions: { licenses: "Write", saas: "Write", cloud: "Write", admin: "Write", auditLogs: "Write" } },
  { id: "role-admin", name: "Administrator", isSystem: true, permissions: { licenses: "Write", saas: "Write", cloud: "Write", admin: "Read", auditLogs: "Read" } },
  { id: "role-user", name: "User", isSystem: true, permissions: { licenses: "Read", saas: "Read", cloud: "Read", admin: "None", auditLogs: "None" } },
  { id: "role-finance", name: "Finance & Procurement", isSystem: false, permissions: { licenses: "Write", saas: "Read", cloud: "Read", admin: "None", auditLogs: "None" } }
];

export const DEFAULT_USER_GROUPS: UserGroup[] = [
  { id: "group-admins", name: "Global IT Asset Managers", roleId: "role-sysadmin", memberCount: 3 },
  { id: "group-finance", name: "Finance and Procurement Team", roleId: "role-finance", memberCount: 5 },
  { id: "group-read", name: "Read-Only Auditors", roleId: "role-user", memberCount: 12 }
];

export const DEFAULT_ADMIN_USERS: AdminUser[] = [
  { id: "usr-1", name: "Érico B.", email: "ericob3ware@gmail.com", roleId: "role-sysadmin", groupIds: ["group-admins"], status: "Active", joinedDate: "2024-05-15" },
  { id: "usr-2", name: "Alice Vance", email: "alice.vance@company.com", roleId: "role-admin", groupIds: ["group-admins"], status: "Active", joinedDate: "2024-06-01" },
  { id: "usr-3", name: "Bob Smith", email: "bob.smith@company.com", roleId: "role-user", groupIds: ["group-read"], status: "Active", joinedDate: "2024-08-20" },
  { id: "usr-4", name: "External Auditor (Partner)", email: "auditor@msp-partner.com", roleId: "role-user", groupIds: ["group-read"], status: "Pending", joinedDate: "2026-07-01" }
];

export const DEFAULT_ORG_NODES: OrgNode[] = [
  { id: "org-root", name: "Acme Corporation", code: "ACM-ROOT", allocatedLicenseCount: 150 },
  { id: "org-na", name: "North America Division", parentId: "org-root", code: "ACM-NA", allocatedLicenseCount: 100 },
  { id: "org-emea", name: "EMEA Region Headquarters", parentId: "org-root", code: "ACM-EMEA", allocatedLicenseCount: 35 },
  { id: "org-apac", name: "APAC Regional Hub", parentId: "org-root", code: "ACM-APAC", allocatedLicenseCount: 15 }
];

export const DEFAULT_ENROLLMENT_SITES: EnrollmentSite[] = [
  { id: "site-na-east", name: "US East - Virginia Data Center", orgNodeId: "org-na", snowExtenderCount: 2, extenderStatus: "Online" },
  { id: "site-emea-west", name: "EU West - Frankfurt Office", orgNodeId: "org-emea", snowExtenderCount: 1, extenderStatus: "Online" },
  { id: "site-apac-south", name: "APAC South - Singapore Office", orgNodeId: "org-apac", snowExtenderCount: 0, extenderStatus: "No Extenders" }
];

export const DEFAULT_AUDIT_LOGS: AuditLogEntry[] = [
  { id: "audit-1", timestamp: "2026-07-07T09:15:00Z", userId: "usr-1", userEmail: "ericob3ware@gmail.com", action: "User Login", category: "Auth", ipAddress: "192.168.1.102", details: "Successful SSO login via Okta Identity Cloud SSO" },
  { id: "audit-2", timestamp: "2026-07-07T08:30:00Z", userId: "usr-2", userEmail: "alice.vance@company.com", action: "Update License Policy", category: "SAM Core", ipAddress: "192.168.1.105", details: "Updated mandatory fields for Office 365 Enterprise E5 to include 'agreementId'" },
  { id: "audit-3", timestamp: "2026-07-06T14:40:00Z", userId: "usr-1", userEmail: "ericob3ware@gmail.com", action: "Configure Cloud Connector", category: "Cloud", ipAddress: "200.45.19.88", details: "Added AWS Production Org Connector with client key ending in ...8c89" },
  { id: "audit-4", timestamp: "2026-07-05T11:00:00Z", userId: "usr-2", userEmail: "alice.vance@company.com", action: "Create Custom Role", category: "RBAC", ipAddress: "10.0.4.15", details: "Created custom role 'Finance & Procurement' with write access to licenses" }
];

export const DEFAULT_CURRENCY_RATES: CurrencyRate[] = [
  { id: "cur-usd", code: "USD", symbol: "$", rateToBase: 1.0, isBase: true },
  { id: "cur-eur", code: "EUR", symbol: "€", rateToBase: 0.92, isBase: false },
  { id: "cur-brl", code: "BRL", symbol: "R$", rateToBase: 5.60, isBase: false },
  { id: "cur-gbp", code: "GBP", symbol: "£", rateToBase: 0.78, isBase: false }
];

export const DEFAULT_IP_POLICIES: IPPolicy[] = [
  { id: "ip-allow-corp", cidr: "192.168.1.0/24", description: "Acme HQ Corporate LAN Office Network", policyType: "Allow", status: "Active" },
  { id: "ip-allow-vpn", cidr: "10.0.0.0/8", description: "Internal Secure Operations VPN Network", policyType: "Allow", status: "Active" },
  { id: "ip-deny-malicious", cidr: "185.220.101.0/24", description: "Known Tor Exit Node & Spam Source List", policyType: "Deny", status: "Active" }
];

export const DEFAULT_MSP_CUSTOMERS: MSPCustomer[] = [
  { id: "msp-cust-acme", name: "Acme Corporate Holding", status: "Active", complianceScore: 92, totalLicenses: 250, totalDevices: 120 },
  { id: "msp-cust-beta", name: "Beta Financial Services Inc.", status: "Active", complianceScore: 78, totalLicenses: 120, totalDevices: 85 },
  { id: "msp-cust-gamma", name: "Gamma Logistics Logistics S/A", status: "Suspended", complianceScore: 45, totalLicenses: 400, totalDevices: 310 }
];

export const DEFAULT_ADMIN_NOTIFICATIONS: AdminNotification[] = [
  { id: "notif-1", timestamp: "2026-07-07T09:30:00Z", title: "Effective License Position Critical Alert", message: "Microsoft SQL Server 2022 has exceeded compliance entitlements in EKS Production Cluster. Missing 4 licenses.", category: "Security", isRead: false },
  { id: "notif-2", timestamp: "2026-07-07T08:00:00Z", title: "Snow Extender Disconnected", message: "APAC South Gateway 'Singapore Office' Snow Extender has failed to heartbeat for more than 4 hours.", category: "Warning", isRead: false },
  { id: "notif-3", timestamp: "2026-07-06T15:00:00Z", title: "Billing Cost Report Generated", message: "SaaS monthly spend report for Microsoft 365 and Salesforce has been successfully calculated and saved to My Files.", category: "Info", isRead: true }
];

export const DEFAULT_UPLOADED_FILES: UploadedFile[] = [
  { id: "file-rep-1", filename: "microsoft_compliance_elp_report.xlsx", mimeType: "application/vnd.ms-excel", sizeBytes: 15200, uploadedAt: "2026-07-07T09:38:00Z", purpose: "Report Export" },
  { id: "file-notif-2", filename: "saas_subscription_waste_summary.pdf", mimeType: "application/pdf", sizeBytes: 42300, uploadedAt: "2026-07-06T15:00:00Z", purpose: "Report Export" },
  { id: "file-audit-3", filename: "security_audit_log_dump_q2.csv", mimeType: "text/csv", sizeBytes: 189000, uploadedAt: "2026-07-05T12:00:00Z", purpose: "Audit Log Export" }
];

export const DEFAULT_LICENSE_POOLS: LicensePool[] = [
  { id: "pool-na-dev", name: "North America Dev Pool", description: "Licenses reserved for NA development environments", ownerOrgNodeId: "org-na", totalQuantity: 150 },
  { id: "pool-emea-prod", name: "EMEA Production Pool", description: "Licenses for European Production clusters", ownerOrgNodeId: "org-emea", totalQuantity: 32 },
  { id: "pool-global-ent", name: "Global Enterprise Pool", description: "Standard corporate license pool", ownerOrgNodeId: undefined, totalQuantity: 2000 }
];

function tryLoadFromPg(): DatabaseState | null {
  return cachedPgState;
}

// Call this once at server startup to preload from PostgreSQL
export async function initDatabase(): Promise<DatabaseState | null> {
  try {
    await ensureSchema();
    const pg = await loadState();
    if (pg) {
      // Apply schema upgrades like the JSON version does
      if (!pg.mobileDevices) { (pg as any).mobileDevices = DEFAULT_MOBILE_DEVICES; }
      if (!pg.applicationCategories) { (pg as any).applicationCategories = DEFAULT_APPLICATION_CATEGORIES; }
      if (!pg.manufacturers) { (pg as any).manufacturers = DEFAULT_MANUFACTURERS; }
      if (!pg.softwareCatalog) { (pg as any).softwareCatalog = DEFAULT_SOFTWARE_CATALOG; }
      if (!pg.discoveredApplications) { (pg as any).discoveredApplications = DEFAULT_DISCOVERED_APPLICATIONS; }
      if (!pg.privateCatalog) { (pg as any).privateCatalog = DEFAULT_PRIVATE_CATALOG; }
      if (!pg.saasApplications) { (pg as any).saasApplications = DEFAULT_SAAS_APPLICATIONS; }
      if (!pg.saasSubscriptions) { (pg as any).saasSubscriptions = DEFAULT_SAAS_SUBSCRIPTIONS; }
      if (!pg.saasSubscriptionPurchases) { (pg as any).saasSubscriptionPurchases = DEFAULT_SAAS_SUBSCRIPTION_PURCHASES; }
      if (!pg.saasUsers) { (pg as any).saasUsers = DEFAULT_SAAS_USERS; }
      if (!pg.saasUserActivities) { (pg as any).saasUserActivities = DEFAULT_SAAS_USER_ACTIVITIES; }
      if (!pg.saasConnectors) { (pg as any).saasConnectors = DEFAULT_SAAS_CONNECTORS; }
      if (!pg.cloudConnectors) { (pg as any).cloudConnectors = DEFAULT_CLOUD_CONNECTORS; }
      if (!pg.cloudResources) { (pg as any).cloudResources = DEFAULT_CLOUD_RESOURCES; }
      if (!pg.k8sConnectors) { (pg as any).k8sConnectors = DEFAULT_K8S_CONNECTORS; }
      if (!pg.k8sClusters) { (pg as any).k8sClusters = DEFAULT_K8S_CLUSTERS; }
      if (!pg.containerPods) { (pg as any).containerPods = DEFAULT_CONTAINER_PODS; }
      if (!pg.customFieldDefinitions) { (pg as any).customFieldDefinitions = DEFAULT_CUSTOM_FIELD_DEFINITIONS; }
      if (!pg.customFieldValues) { (pg as any).customFieldValues = DEFAULT_CUSTOM_FIELD_VALUES; }
      if (!pg.customMetrics) { (pg as any).customMetrics = DEFAULT_CUSTOM_METRICS; }
      if (!pg.savedReports) { (pg as any).savedReports = DEFAULT_SAVED_REPORTS; }
      if (!pg.reportSchedules) { (pg as any).reportSchedules = DEFAULT_REPORT_SCHEDULES; }
      if (!pg.ssoConfigs) { (pg as any).ssoConfigs = DEFAULT_SSO_CONFIGS; }
      if (!pg.oauthClients) { (pg as any).oauthClients = DEFAULT_OAUTH_CLIENTS; }
      if (!pg.adminRoles) { (pg as any).adminRoles = DEFAULT_ADMIN_ROLES; }
      if (!pg.userGroups) { (pg as any).userGroups = DEFAULT_USER_GROUPS; }
      if (!pg.adminUsers) { (pg as any).adminUsers = DEFAULT_ADMIN_USERS; }
      if (!pg.orgNodes) { (pg as any).orgNodes = DEFAULT_ORG_NODES; }
      if (!pg.enrollmentSites) { (pg as any).enrollmentSites = DEFAULT_ENROLLMENT_SITES; }
      if (!pg.auditLogs) { (pg as any).auditLogs = DEFAULT_AUDIT_LOGS; }
      if (!pg.currencyRates) { (pg as any).currencyRates = DEFAULT_CURRENCY_RATES; }
      if (!pg.ipPolicies) { (pg as any).ipPolicies = DEFAULT_IP_POLICIES; }
      if (!pg.mspCustomers) { (pg as any).mspCustomers = DEFAULT_MSP_CUSTOMERS; }
      if (!pg.adminNotifications) { (pg as any).adminNotifications = DEFAULT_ADMIN_NOTIFICATIONS; }
      if (!pg.uploadedFiles) { (pg as any).uploadedFiles = DEFAULT_UPLOADED_FILES; }
      if (!pg.licensePools) { (pg as any).licensePools = DEFAULT_LICENSE_POOLS; }
      return pg;
    }
  } catch {}
  return null;
}

let cachedPgState: DatabaseState | null = null;

export async function setPgCache(state: DatabaseState | null): Promise<void> {
  cachedPgState = state;
}

export function getDatabase(): DatabaseState {
  // Check PostgreSQL cache first (loaded at startup)
  if (cachedPgState) return cachedPgState;

  // Try PostgreSQL
  const pgState = tryLoadFromPg();
  if (pgState) return pgState;

  // Fallback to defaults when no database is available
  return {
    agreements: DEFAULT_AGREEMENTS,
    licenses: DEFAULT_LICENSES,
    purchases: DEFAULT_PURCHASES,
    assignments: DEFAULT_ASSIGNMENTS,
    subscriptionLicenses: DEFAULT_SUBSCRIPTION_LICENSES,
    computers: DEFAULT_COMPUTERS,
    installations: DEFAULT_INSTALLATIONS,
    mobileDevices: DEFAULT_MOBILE_DEVICES,
    applicationCategories: DEFAULT_APPLICATION_CATEGORIES,
    manufacturers: DEFAULT_MANUFACTURERS,
    softwareCatalog: DEFAULT_SOFTWARE_CATALOG,
    discoveredApplications: DEFAULT_DISCOVERED_APPLICATIONS,
    privateCatalog: DEFAULT_PRIVATE_CATALOG,
    saasApplications: DEFAULT_SAAS_APPLICATIONS,
    saasSubscriptions: DEFAULT_SAAS_SUBSCRIPTIONS,
    saasSubscriptionPurchases: DEFAULT_SAAS_SUBSCRIPTION_PURCHASES,
    saasUsers: DEFAULT_SAAS_USERS,
    saasUserActivities: DEFAULT_SAAS_USER_ACTIVITIES,
    saasConnectors: DEFAULT_SAAS_CONNECTORS,
    cloudConnectors: DEFAULT_CLOUD_CONNECTORS,
    cloudResources: DEFAULT_CLOUD_RESOURCES,
    k8sConnectors: DEFAULT_K8S_CONNECTORS,
    k8sClusters: DEFAULT_K8S_CLUSTERS,
    containerPods: DEFAULT_CONTAINER_PODS,
    customFieldDefinitions: DEFAULT_CUSTOM_FIELD_DEFINITIONS,
    customFieldValues: DEFAULT_CUSTOM_FIELD_VALUES,
    customMetrics: DEFAULT_CUSTOM_METRICS,
    savedReports: DEFAULT_SAVED_REPORTS,
    reportSchedules: DEFAULT_REPORT_SCHEDULES,
    ssoConfigs: DEFAULT_SSO_CONFIGS,
    oauthClients: DEFAULT_OAUTH_CLIENTS,
    adminRoles: DEFAULT_ADMIN_ROLES,
    userGroups: DEFAULT_USER_GROUPS,
    adminUsers: DEFAULT_ADMIN_USERS,
    orgNodes: DEFAULT_ORG_NODES,
    enrollmentSites: DEFAULT_ENROLLMENT_SITES,
    auditLogs: DEFAULT_AUDIT_LOGS,
    currencyRates: DEFAULT_CURRENCY_RATES,
    ipPolicies: DEFAULT_IP_POLICIES,
    mspCustomers: DEFAULT_MSP_CUSTOMERS,
    adminNotifications: DEFAULT_ADMIN_NOTIFICATIONS,
    uploadedFiles: DEFAULT_UPLOADED_FILES,
    licensePools: DEFAULT_LICENSE_POOLS
  };
}

export function saveDatabase(db: DatabaseState): void {
  cachedPgState = db;
  saveState(db).catch((err) => console.error("PostgreSQL save error:", err));
}
