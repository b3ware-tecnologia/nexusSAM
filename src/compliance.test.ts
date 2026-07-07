import { calculateELP } from "./complianceEngine.js";
import { License, LicensePurchase, Computer, Installation, MetricType } from "./types.js";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

export function runComplianceTests() {
  console.log("=== RUNNING 10 COMPLIANCE ENGINE UNIT TESTS ===");

  const dummyComputers: Computer[] = [
    { id: "c1", name: "PC-ALPHA", cores: 4, pvuPerCore: 70, isVirtual: false, os: "Windows", ramGB: 16, cpuModel: "Intel i5" },
    { id: "c2", name: "PC-BETA", cores: 8, pvuPerCore: 100, isVirtual: false, os: "Linux", ramGB: 32, cpuModel: "AMD Ryzen" },
    { id: "c3", name: "VM-GAMMA", cores: 2, pvuPerCore: 70, isVirtual: true, os: "Windows", ramGB: 8, cpuModel: "Virtual" }
  ];

  const dummyPurchases: LicensePurchase[] = [
    { id: "pur-over", licenseId: "lic-over", invoiceNumber: "INV-101", purchaseDate: "2026-01-01", quantity: 10, unitCost: 100, currency: "USD", totalCost: 1000 },
    { id: "pur-under", licenseId: "lic-under", invoiceNumber: "INV-102", purchaseDate: "2026-01-01", quantity: 2, unitCost: 200, currency: "USD", totalCost: 400 },
    { id: "pur-exp", licenseId: "lic-exp", invoiceNumber: "INV-103", purchaseDate: "2026-01-01", quantity: 5, unitCost: 150, currency: "USD", totalCost: 750 },
    { id: "pur-down-high", licenseId: "lic-down-high", invoiceNumber: "INV-104", purchaseDate: "2026-01-01", quantity: 5, unitCost: 300, currency: "USD", totalCost: 1500 },
    { id: "pur-down-low", licenseId: "lic-down-low", invoiceNumber: "INV-105", purchaseDate: "2026-01-01", quantity: 0, unitCost: 150, currency: "USD", totalCost: 0 },
    { id: "pur-users", licenseId: "lic-users", invoiceNumber: "INV-106", purchaseDate: "2026-01-01", quantity: 5, unitCost: 80, currency: "USD", totalCost: 400 },
    { id: "pur-devices", licenseId: "lic-devices", invoiceNumber: "INV-107", purchaseDate: "2026-01-01", quantity: 5, unitCost: 120, currency: "USD", totalCost: 600 },
    { id: "pur-cores", licenseId: "lic-cores", invoiceNumber: "INV-108", purchaseDate: "2026-01-01", quantity: 12, unitCost: 50, currency: "USD", totalCost: 600 },
    { id: "pur-pvu", licenseId: "lic-pvu", invoiceNumber: "INV-109", purchaseDate: "2026-01-01", quantity: 500, unitCost: 3, currency: "USD", totalCost: 1500 },
    { id: "pur-vda", licenseId: "lic-vda", invoiceNumber: "INV-110", purchaseDate: "2026-01-01", quantity: 2, unitCost: 90, currency: "USD", totalCost: 180 }
  ];

  // ---------------------------------------------------------------------------
  // TEST 1: Over-licensing Scenario
  // ---------------------------------------------------------------------------
  {
    const licenses: License[] = [
      { id: "lic-over", softwareName: "AppOver", publisher: "VendorA", metricType: MetricType.INSTALLATIONS, totalQuantity: 10, allocatedQuantity: 0, status: "Active", downgradeRights: false }
    ];
    const installations: Installation[] = [
      { id: "i1", softwareName: "AppOver", publisher: "VendorA", version: "1.0", computerId: "c1", userName: "user1", detectedAt: "" },
      { id: "i2", softwareName: "AppOver", publisher: "VendorA", version: "1.0", computerId: "c2", userName: "user2", detectedAt: "" }
    ];

    const result = calculateELP(licenses, dummyPurchases, dummyComputers, installations);
    const snap = result.find(s => s.softwareName === "AppOver");
    assert(!!snap, "AppOver snapshot should exist");
    assert(snap!.entitlements === 10, `Expected 10 entitlements, got ${snap!.entitlements}`);
    assert(snap!.consumption === 2, `Expected 2 consumption, got ${snap!.consumption}`);
    assert(snap!.balance === 8, `Expected balance of 8, got ${snap!.balance}`);
    assert(snap!.complianceStatus === "OverLicensed", "Should be OverLicensed");
    console.log("✓ Test 1: Over-licensing Scenario Passed");
  }

  // ---------------------------------------------------------------------------
  // TEST 2: Under-licensing Scenario
  // ---------------------------------------------------------------------------
  {
    const licenses: License[] = [
      { id: "lic-under", softwareName: "AppUnder", publisher: "VendorA", metricType: MetricType.INSTALLATIONS, totalQuantity: 2, allocatedQuantity: 0, status: "Active", downgradeRights: false }
    ];
    const installations: Installation[] = [
      { id: "i1", softwareName: "AppUnder", publisher: "VendorA", version: "1.0", computerId: "c1", userName: "user1", detectedAt: "" },
      { id: "i2", softwareName: "AppUnder", publisher: "VendorA", version: "1.0", computerId: "c2", userName: "user2", detectedAt: "" },
      { id: "i3", softwareName: "AppUnder", publisher: "VendorA", version: "1.0", computerId: "c3", userName: "user3", detectedAt: "" }
    ];

    const result = calculateELP(licenses, dummyPurchases, dummyComputers, installations);
    const snap = result.find(s => s.softwareName === "AppUnder");
    assert(!!snap, "AppUnder snapshot should exist");
    assert(snap!.entitlements === 2, "Expected 2 entitlements");
    assert(snap!.consumption === 3, "Expected 3 consumption");
    assert(snap!.balance === -1, `Expected balance of -1, got ${snap!.balance}`);
    assert(snap!.complianceStatus === "UnderLicensed", "Should be UnderLicensed");
    assert(snap!.costImpact === 200, `Expected cost impact of 200 (1 missing * $200 unitCost), got ${snap!.costImpact}`);
    console.log("✓ Test 2: Under-licensing Scenario Passed");
  }

  // ---------------------------------------------------------------------------
  // TEST 3: Expired / Archieved / Non-Active License Filter Scenario
  // ---------------------------------------------------------------------------
  {
    const licenses: License[] = [
      // Status is "Archived", meaning it's inactive and should be filtered out from active entitlements
      { id: "lic-exp", softwareName: "AppExp", publisher: "VendorA", metricType: MetricType.INSTALLATIONS, totalQuantity: 5, allocatedQuantity: 0, status: "Archived", downgradeRights: false }
    ];
    const installations: Installation[] = [
      { id: "i1", softwareName: "AppExp", publisher: "VendorA", version: "1.0", computerId: "c1", userName: "user1", detectedAt: "" }
    ];

    const result = calculateELP(licenses, dummyPurchases, dummyComputers, installations);
    const snap = result.find(s => s.softwareName === "AppExp");
    assert(!!snap, "AppExp snapshot should exist since there's an installation");
    assert(snap!.entitlements === 0, `Expected 0 entitlements for archived license, got ${snap!.entitlements}`);
    assert(snap!.consumption === 1, "Expected 1 consumption");
    assert(snap!.balance === -1, `Expected balance of -1, got ${snap!.balance}`);
    assert(snap!.complianceStatus === "UnderLicensed", "Should be UnderLicensed due to filtered archived license");
    console.log("✓ Test 3: Expired / Non-Active License Filter Scenario Passed");
  }

  // ---------------------------------------------------------------------------
  // TEST 4: Downgrade Rights Active (Surplus of SQL 2022 covers SQL 2019)
  // ---------------------------------------------------------------------------
  {
    const licenses: License[] = [
      { id: "lic-down-high", softwareName: "SQL Server 2022", publisher: "Microsoft", metricType: MetricType.INSTALLATIONS, totalQuantity: 5, allocatedQuantity: 0, status: "Active", downgradeRights: true },
      { id: "lic-down-low", softwareName: "SQL Server 2019", publisher: "Microsoft", metricType: MetricType.INSTALLATIONS, totalQuantity: 0, allocatedQuantity: 0, status: "Active", downgradeRights: false }
    ];
    const installations: Installation[] = [
      { id: "i1", softwareName: "SQL Server 2019", publisher: "Microsoft", version: "15.0", computerId: "c1", userName: "user1", detectedAt: "" },
      { id: "i2", softwareName: "SQL Server 2019", publisher: "Microsoft", version: "15.0", computerId: "c2", userName: "user2", detectedAt: "" }
    ];

    const result = calculateELP(licenses, dummyPurchases, dummyComputers, installations);
    
    // SQL Server 2019 snap has 0 licenses but receives coverage from SQL Server 2022 surplus (+5)
    const lowSnap = result.find(s => s.softwareName === "SQL Server 2019");
    const highSnap = result.find(s => s.softwareName === "SQL Server 2022");

    assert(!!lowSnap, "SQL Server 2019 snapshot should exist");
    assert(!!highSnap, "SQL Server 2022 snapshot should exist");

    // The high snap had 5 entitlements, 0 consumption. Balance = 5.
    // Low snap had 0 entitlements, 2 consumption. Deficit = 2.
    // Downgrade rights covers 2, so low snap entitlements become 2, balance = 0 (Compliant).
    // High snap entitlements become 5 - 2 = 3, balance = 3 (OverLicensed).
    assert(lowSnap!.balance === 0, `Expected low snap balance 0 after downgrade resolution, got ${lowSnap!.balance}`);
    assert(lowSnap!.complianceStatus === "Compliant", `Expected low snap to be Compliant, got ${lowSnap!.complianceStatus}`);
    assert(highSnap!.balance === 3, `Expected high snap balance 3 after downgrade transfer, got ${highSnap!.balance}`);
    assert(highSnap!.complianceStatus === "OverLicensed", "Expected high snap to remain OverLicensed with remaining surplus");
    console.log("✓ Test 4: Downgrade Rights Active Scenario Passed");
  }

  // ---------------------------------------------------------------------------
  // TEST 5: Downgrade Rights Disabled (Surplus of SQL 2022 does NOT cover SQL 2019)
  // ---------------------------------------------------------------------------
  {
    const licenses: License[] = [
      // downgradeRights is false
      { id: "lic-down-high", softwareName: "SQL Server 2022", publisher: "Microsoft", metricType: MetricType.INSTALLATIONS, totalQuantity: 5, allocatedQuantity: 0, status: "Active", downgradeRights: false },
      { id: "lic-down-low", softwareName: "SQL Server 2019", publisher: "Microsoft", metricType: MetricType.INSTALLATIONS, totalQuantity: 0, allocatedQuantity: 0, status: "Active", downgradeRights: false }
    ];
    const installations: Installation[] = [
      { id: "i1", softwareName: "SQL Server 2019", publisher: "Microsoft", version: "15.0", computerId: "c1", userName: "user1", detectedAt: "" },
      { id: "i2", softwareName: "SQL Server 2019", publisher: "Microsoft", version: "15.0", computerId: "c2", userName: "user2", detectedAt: "" }
    ];

    const result = calculateELP(licenses, dummyPurchases, dummyComputers, installations);
    
    const lowSnap = result.find(s => s.softwareName === "SQL Server 2019");
    const highSnap = result.find(s => s.softwareName === "SQL Server 2022");

    assert(!!lowSnap, "SQL Server 2019 snapshot should exist");
    assert(!!highSnap, "SQL Server 2022 snapshot should exist");

    // Deficit of 2 on SQL Server 2019 cannot be covered because downgradeRights is false
    assert(lowSnap!.balance === -2, `Expected low snap balance to remain -2, got ${lowSnap!.balance}`);
    assert(lowSnap!.complianceStatus === "UnderLicensed", "Expected low snap to remain UnderLicensed");
    assert(highSnap!.balance === 5, `Expected high snap balance to remain 5, got ${highSnap!.balance}`);
    assert(highSnap!.complianceStatus === "OverLicensed", "Expected high snap to remain OverLicensed");
    console.log("✓ Test 5: Downgrade Rights Disabled Scenario Passed");
  }

  // ---------------------------------------------------------------------------
  // TEST 6: Auto-allocation for USERS Metric (De-duplicating same user)
  // ---------------------------------------------------------------------------
  {
    const licenses: License[] = [
      { id: "lic-users", softwareName: "AppUsers", publisher: "VendorB", metricType: MetricType.USERS, totalQuantity: 5, allocatedQuantity: 0, status: "Active", downgradeRights: false }
    ];
    const installations: Installation[] = [
      // Same user installed on c1, c2, c3. Consumption should count as 1 user.
      { id: "i1", softwareName: "AppUsers", publisher: "VendorB", version: "1.0", computerId: "c1", userName: "alice", detectedAt: "" },
      { id: "i2", softwareName: "AppUsers", publisher: "VendorB", version: "1.0", computerId: "c2", userName: "alice", detectedAt: "" },
      { id: "i3", softwareName: "AppUsers", publisher: "VendorB", version: "1.0", computerId: "c3", userName: "alice", detectedAt: "" }
    ];

    const result = calculateELP(licenses, dummyPurchases, dummyComputers, installations);
    const snap = result.find(s => s.softwareName === "AppUsers");
    assert(!!snap, "AppUsers snapshot should exist");
    assert(snap!.consumption === 1, `Expected 1 user consumption, got ${snap!.consumption}`);
    assert(snap!.balance === 4, `Expected balance of 4, got ${snap!.balance}`);
    assert(snap!.complianceStatus === "OverLicensed", "Should be OverLicensed");
    console.log("✓ Test 6: Auto-allocation for USERS Metric Passed");
  }

  // ---------------------------------------------------------------------------
  // TEST 7: Auto-allocation for DEVICES Metric (De-duplicating multiple installs per device)
  // ---------------------------------------------------------------------------
  {
    const licenses: License[] = [
      { id: "lic-devices", softwareName: "AppDevices", publisher: "VendorB", metricType: MetricType.DEVICES, totalQuantity: 5, allocatedQuantity: 0, status: "Active", downgradeRights: false }
    ];
    const installations: Installation[] = [
      // Multiple versions or paths on same computer "c1" and "c2". Consumes 2 devices.
      { id: "i1", softwareName: "AppDevices", publisher: "VendorB", version: "1.0", computerId: "c1", userName: "user1", detectedAt: "" },
      { id: "i2", softwareName: "AppDevices", publisher: "VendorB", version: "2.0", computerId: "c1", userName: "user1", detectedAt: "" },
      { id: "i3", softwareName: "AppDevices", publisher: "VendorB", version: "1.0", computerId: "c2", userName: "user2", detectedAt: "" }
    ];

    const result = calculateELP(licenses, dummyPurchases, dummyComputers, installations);
    const snap = result.find(s => s.softwareName === "AppDevices");
    assert(!!snap, "AppDevices snapshot should exist");
    assert(snap!.consumption === 2, `Expected 2 unique devices, got ${snap!.consumption}`);
    assert(snap!.balance === 3, `Expected balance of 3, got ${snap!.balance}`);
    assert(snap!.complianceStatus === "OverLicensed", "Should be OverLicensed");
    console.log("✓ Test 7: Auto-allocation for DEVICES Metric Passed");
  }

  // ---------------------------------------------------------------------------
  // TEST 8: Auto-allocation for PROCESSOR_CORE Metric (Summing computer cores)
  // ---------------------------------------------------------------------------
  {
    const licenses: License[] = [
      { id: "lic-cores", softwareName: "AppCores", publisher: "VendorC", metricType: MetricType.PROCESSOR_CORE, totalQuantity: 12, allocatedQuantity: 0, status: "Active", downgradeRights: false }
    ];
    const installations: Installation[] = [
      // Installed on PC-ALPHA (4 cores) and PC-BETA (8 cores) -> Total 12 cores consumed
      { id: "i1", softwareName: "AppCores", publisher: "VendorC", version: "1.0", computerId: "c1", userName: "user1", detectedAt: "" },
      { id: "i2", softwareName: "AppCores", publisher: "VendorC", version: "1.0", computerId: "c2", userName: "user2", detectedAt: "" }
    ];

    const result = calculateELP(licenses, dummyPurchases, dummyComputers, installations);
    const snap = result.find(s => s.softwareName === "AppCores");
    assert(!!snap, "AppCores snapshot should exist");
    assert(snap!.consumption === 12, `Expected 12 cores consumption, got ${snap!.consumption}`);
    assert(snap!.balance === 0, `Expected balance of 0, got ${snap!.balance}`);
    assert(snap!.complianceStatus === "Compliant", "Should be Compliant");
    console.log("✓ Test 8: Auto-allocation for PROCESSOR_CORE Metric Passed");
  }

  // ---------------------------------------------------------------------------
  // TEST 9: IBM PVU Metric (cores * pvuPerCore)
  // ---------------------------------------------------------------------------
  {
    const licenses: License[] = [
      { id: "lic-pvu", softwareName: "AppPVU", publisher: "VendorC", metricType: MetricType.PVU, totalQuantity: 500, allocatedQuantity: 0, status: "Active", downgradeRights: false }
    ];
    const installations: Installation[] = [
      // Installed on PC-ALPHA (4 cores, 70 PVU per core = 280 PVU consumption)
      { id: "i1", softwareName: "AppPVU", publisher: "VendorC", version: "1.0", computerId: "c1", userName: "user1", detectedAt: "" }
    ];

    const result = calculateELP(licenses, dummyPurchases, dummyComputers, installations);
    const snap = result.find(s => s.softwareName === "AppPVU");
    assert(!!snap, "AppPVU snapshot should exist");
    assert(snap!.consumption === 280, `Expected 280 PVU consumption, got ${snap!.consumption}`);
    assert(snap!.balance === 220, `Expected balance of 220, got ${snap!.balance}`);
    assert(snap!.complianceStatus === "OverLicensed", "Should be OverLicensed");
    console.log("✓ Test 9: IBM PVU Metric Passed");
  }

  // ---------------------------------------------------------------------------
  // TEST 10: Windows VDA Metric (Count VM installations only)
  // ---------------------------------------------------------------------------
  {
    const licenses: License[] = [
      { id: "lic-vda", softwareName: "AppVDA", publisher: "VendorE", metricType: MetricType.VDA, totalQuantity: 2, allocatedQuantity: 0, status: "Active", downgradeRights: false }
    ];
    const installations: Installation[] = [
      // Installed on PC-ALPHA (isVirtual = false) and VM-GAMMA (isVirtual = true) -> Only VM-GAMMA (1) consumes VDA
      { id: "i1", softwareName: "AppVDA", publisher: "VendorE", version: "1.0", computerId: "c1", userName: "user1", detectedAt: "" },
      { id: "i2", softwareName: "AppVDA", publisher: "VendorE", version: "1.0", computerId: "c3", userName: "user2", detectedAt: "" }
    ];

    const result = calculateELP(licenses, dummyPurchases, dummyComputers, installations);
    const snap = result.find(s => s.softwareName === "AppVDA");
    assert(!!snap, "AppVDA snapshot should exist");
    assert(snap!.consumption === 1, `Expected 1 virtual device, got ${snap!.consumption}`);
    assert(snap!.balance === 1, `Expected balance of 1, got ${snap!.balance}`);
    assert(snap!.complianceStatus === "OverLicensed", "Should be OverLicensed");
    console.log("✓ Test 10: Windows VDA Metric Scenario Passed");
  }

  console.log("=== ALL 10 COMPLIANCE ENGINE TESTS PASSED SUCCESSFULLY! ===");
  return true;
}

// Enable direct execution under tsx CLI for npm test pipeline
if (process.argv[1] && (process.argv[1].endsWith("compliance.test.ts") || process.argv[1].endsWith("compliance.test.js"))) {
  try {
    runComplianceTests();
    process.exit(0);
  } catch (err: any) {
    console.error("Test suite failed:", err);
    process.exit(1);
  }
}
