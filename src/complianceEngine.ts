import {
  License, LicensePurchase, LicenseAssignment, Computer, Installation,
  ComplianceSnapshot, MetricType, LicensePool, SubscriptionLicense,
  ComplianceOverride, RenewalForecast, AzureHybridBenefit, CloudResource
} from "./types.js";

function daysUntil(dateStr: string): number {
  const now = new Date();
  const target = new Date(dateStr);
  const diff = target.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function isExpired(dateStr: string): boolean {
  return new Date(dateStr) < new Date();
}

function getActiveSubscriptionEntitlements(
  license: License,
  subscriptionLicenses: SubscriptionLicense[]
): number {
  const subs = subscriptionLicenses.filter(
    (s) => s.licenseId === license.id && !isExpired(s.endDate)
  );
  return subs.reduce((sum) => sum + (license.totalQuantity || 0), 0);
}

function computeRenewalForecast(
  license: License,
  subscriptionLicenses: SubscriptionLicense[]
): RenewalForecast | undefined {
  const sub = subscriptionLicenses.find((s) => s.licenseId === license.id);
  if (!sub) return undefined;
  const days = daysUntil(sub.endDate);
  let renewalStatus: RenewalForecast["renewalStatus"];
  let recommendation: string;
  if (days <= 0) {
    renewalStatus = "Expired";
    recommendation = "Subscription has expired. Renew immediately to avoid service interruption.";
  } else if (days <= 30) {
    renewalStatus = "Expiring Soon";
    recommendation = `Subscription expires in ${days} days. ${sub.autoRenew ? "Auto-renew is enabled." : "Manual renewal required."}`;
  } else if (sub.autoRenew) {
    renewalStatus = "Auto-Renew";
    recommendation = "Subscription renews automatically. No action needed.";
  } else {
    renewalStatus = "Manual Renewal Needed";
    recommendation = `Renewal required by ${sub.endDate}. Plan ${days} days ahead.`;
  }
  return {
    licenseId: license.id,
    softwareName: license.softwareName,
    publisher: license.publisher,
    agreementId: license.agreementId,
    currentEndDate: sub.endDate,
    autoRenew: sub.autoRenew,
    daysUntilExpiry: days,
    estimatedAnnualCost: license.totalQuantity * 0,
    renewalStatus,
    recommendation,
  };
}

/**
 * Full ELP calculation with:
 * - Subscription expiry awareness
 * - LicensePool allocation tracking
 * - Azure Hybrid Benefit detection
 * - VDA proper VM-only calculation
 * - IBM PVU sub-capacity
 * - Renewal forecasting
 */
export function calculateELP(
  licenses: License[],
  purchases: LicensePurchase[],
  computers: Computer[],
  installations: Installation[],
  assignments: LicenseAssignment[] = [],
  subscriptionLicenses: SubscriptionLicense[] = [],
  licensePools: LicensePool[] = [],
  overrides: ComplianceOverride[] = [],
  azureHybridBenefits: AzureHybridBenefit[] = [],
  cloudResources: CloudResource[] = []
): ComplianceSnapshot[] {
  const computerMap = new Map<string, Computer>();
  computers.forEach((c) => computerMap.set(c.id, c));

  const poolMap = new Map<string, LicensePool>();
  licensePools.forEach((p) => poolMap.set(p.id, p));

  const overrideMap = new Map<string, ComplianceOverride[]>();
  overrides.forEach((o) => {
    const key = `${o.publisher.toLowerCase()}|||${o.softwareName.toLowerCase()}`;
    if (!overrideMap.has(key)) overrideMap.set(key, []);
    overrideMap.get(key)!.push(o);
  });

  const activeLicenses = licenses.filter(
    (l) => l.status === "Active" || l.status === "Incomplete"
  );

  // Group by publisher + software
  const licenseGroups = new Map<string, License[]>();
  activeLicenses.forEach((l) => {
    const key = `${l.publisher.toLowerCase()}|||${l.softwareName.toLowerCase()}`;
    if (!licenseGroups.has(key)) licenseGroups.set(key, []);
    licenseGroups.get(key)!.push(l);
  });

  const installationGroups = new Map<string, Installation[]>();
  installations.forEach((inst) => {
    const key = `${inst.publisher.toLowerCase()}|||${inst.softwareName.toLowerCase()}`;
    if (!installationGroups.has(key)) installationGroups.set(key, []);
    installationGroups.get(key)!.push(inst);
  });

  const allKeys = new Set<string>([
    ...licenseGroups.keys(),
    ...installationGroups.keys(),
  ]);

  const snapshots: ComplianceSnapshot[] = [];

  allKeys.forEach((key) => {
    const parts = key.split("|||");
    const rawPublisher = parts[0];
    const rawSoftwareName = parts[1];

    const matchingLicenses = licenseGroups.get(key) || [];
    const matchingInstalls = installationGroups.get(key) || [];

    const sampleLicense = matchingLicenses[0];
    const sampleInstall = matchingInstalls[0];

    const publisher = sampleLicense?.publisher || sampleInstall?.publisher || rawPublisher;
    const softwareName = sampleLicense?.softwareName || sampleInstall?.softwareName || rawSoftwareName;

    // --- Entitlements ---
    let entitlements = 0;
    let totalSpent = 0;
    let purchasedCount = 0;
    let linkedPoolId: string | undefined;

    matchingLicenses.forEach((license) => {
      // Filter out expired subscription entitlements
      if (license.isSubscription) {
        const activeEnt = getActiveSubscriptionEntitlements(license, subscriptionLicenses);
        entitlements += activeEnt;
      } else {
        const licensePurchases = purchases.filter((p) => p.licenseId === license.id);
        const quantitySum = licensePurchases.reduce((sum, p) => sum + p.quantity, 0);
        entitlements += quantitySum;
        licensePurchases.forEach((p) => {
          totalSpent += p.quantity * p.unitCost;
          purchasedCount += p.quantity;
        });
      }
      if (license.licensePoolId) {
        linkedPoolId = license.licensePoolId;
      }
    });

    const avgUnitCost = purchasedCount > 0 ? totalSpent / purchasedCount : 150;
    const metricType = sampleLicense?.metricType || MetricType.INSTALLATIONS;

    // --- Consumption ---
    let consumption = 0;
    if (matchingInstalls.length > 0) {
      const uniqueComputerIds = new Set(matchingInstalls.map((inst) => inst.computerId));

      switch (metricType) {
        case MetricType.INSTALLATIONS:
          consumption = matchingInstalls.length;
          break;

        case MetricType.USERS:
          consumption = new Set(matchingInstalls.map((inst) => inst.userName)).size;
          break;

        case MetricType.DEVICES:
          consumption = uniqueComputerIds.size;
          break;

        case MetricType.PROCESSOR_CORE: {
          let totalCores = 0;
          uniqueComputerIds.forEach((compId) => {
            const comp = computerMap.get(compId);
            totalCores += comp ? comp.cores : 1;
          });

          // Azure Hybrid Benefit: subtract cores covered by AHB
          matchingLicenses.forEach((license) => {
            const ahbEntries = azureHybridBenefits.filter(
              (a) => a.licenseId === license.id && a.enabled
            );
            ahbEntries.forEach(() => {
              totalCores = Math.max(0, totalCores - 2);
            });
          });

          consumption = totalCores;
          break;
        }

        case MetricType.PVU: {
          let totalPVU = 0;
          uniqueComputerIds.forEach((compId) => {
            const comp = computerMap.get(compId);
            if (comp) {
              const coreLimit = comp.isVirtual ? Math.min(comp.cores, 4) : comp.cores;
              totalPVU += coreLimit * comp.pvuPerCore;
            } else {
              totalPVU += 70;
            }
          });
          consumption = totalPVU;
          break;
        }

        case MetricType.VDA: {
          // VDA: count only virtual machines, each VM = 1 license
          let virtualCount = 0;
          uniqueComputerIds.forEach((compId) => {
            const comp = computerMap.get(compId);
            if (comp && comp.isVirtual) {
              virtualCount++;
            }
          });
          consumption = virtualCount;
          break;
        }

        default:
          consumption = matchingInstalls.length;
      }
    }

    // --- Assigned (manual device assignments count as consumption) ---
    let assigned = 0;
    matchingLicenses.forEach((l) => {
      const directAssignments = assignments.filter((a) => a.licenseId === l.id);
      directAssignments.forEach((a) => {
        assigned += a.quantity;
      });
    });

    // --- Balance & Status ---
    const balance = entitlements - consumption - assigned;
    let complianceStatus: "Compliant" | "UnderLicensed" | "OverLicensed" = "Compliant";
    if (balance < 0) complianceStatus = "UnderLicensed";
    else if (balance > 0) complianceStatus = "OverLicensed";

    const costImpact = -balance * avgUnitCost;

    // --- Apply manual compliance overrides ---
    const relevantOverrides = overrideMap.get(key) || [];
    relevantOverrides.forEach((override) => {
      if (override.overrideType === "Entitlement") {
        entitlements = parseInt(override.newValue) || entitlements;
      } else if (override.overrideType === "Consumption") {
        consumption = parseInt(override.newValue) || consumption;
      } else if (override.overrideType === "Status") {
        complianceStatus = override.newValue as any;
      }
    });

    // --- Renewal forecast ---
    const renewalForecast = matchingLicenses.length > 0
      ? computeRenewalForecast(matchingLicenses[0], subscriptionLicenses)
      : undefined;

    // --- Pool consumption tracking ---
    let poolConsumption = 0;
    if (linkedPoolId) {
      const pool = poolMap.get(linkedPoolId);
      if (pool) {
        // Get all licenses in the same pool, sum their consumption
        const poolLicenses = licenses.filter((l) => l.licensePoolId === linkedPoolId);
        poolLicenses.forEach((pl) => {
          const plKey = `${pl.publisher.toLowerCase()}|||${pl.softwareName.toLowerCase()}`;
          const plInstalls = installationGroups.get(plKey) || [];
          poolConsumption += plInstalls.length;
        });
      }
    }

    snapshots.push({
      id: `${publisher}-${softwareName}-${metricType}`.replace(/\s+/g, "-"),
      calculatedAt: new Date().toISOString(),
      softwareName,
      publisher,
      metricType,
      entitlements,
      consumption,
      assigned,
      balance,
      complianceStatus,
      costImpact,
      poolId: linkedPoolId,
      licenseId: matchingLicenses[0]?.id,
      renewalForecast,
    });
  });

  // --- Downgrade Rights Resolution ---
  const isHigherVersion = (nameA: string, nameB: string): boolean => {
    const matchA = nameA.match(/\b(20\d{2}|\d+)\b/);
    const matchB = nameB.match(/\b(20\d{2}|\d+)\b/);
    if (matchA && matchB) {
      const valA = parseInt(matchA[0], 10);
      const valB = parseInt(matchB[0], 10);
      if (valA !== valB) return valA > valB;
    }
    const aLower = nameA.toLowerCase();
    const bLower = nameB.toLowerCase();
    if (aLower.includes("enterprise") && bLower.includes("standard")) return true;
    if (bLower.includes("enterprise") && aLower.includes("standard")) return false;
    return nameA.localeCompare(nameB) > 0;
  };

  const underlicensed = snapshots.filter((s) => s.complianceStatus === "UnderLicensed");
  const overlicensed = snapshots.filter((s) => s.complianceStatus === "OverLicensed");

  underlicensed.forEach((under) => {
    const donors = overlicensed.filter((donor) => {
      if (donor.publisher.toLowerCase() !== under.publisher.toLowerCase()) return false;
      if (donor.balance <= 0) return false;
      const donorLicenses = licenses.filter(
        (l) =>
          l.publisher.toLowerCase() === donor.publisher.toLowerCase() &&
          l.softwareName.toLowerCase() === donor.softwareName.toLowerCase() &&
          l.status === "Active" &&
          l.downgradeRights === true
      );
      if (donorLicenses.length === 0) return false;
      return isHigherVersion(donor.softwareName, under.softwareName);
    });

    donors.forEach((donor) => {
      if (under.balance >= 0) return;
      const deficit = Math.abs(under.balance);
      const surplus = donor.balance;
      const coverage = Math.min(deficit, surplus);

      under.entitlements += coverage;
      under.balance = under.entitlements - under.consumption;
      donor.entitlements -= coverage;
      donor.balance = donor.entitlements - donor.consumption;

      under.complianceStatus = under.balance >= 0
        ? (under.balance > 0 ? "OverLicensed" : "Compliant")
        : "UnderLicensed";
      donor.complianceStatus = donor.balance >= 0
        ? (donor.balance > 0 ? "OverLicensed" : "Compliant")
        : "UnderLicensed";

      const underAvgCost = 150;
      under.costImpact = -under.balance * underAvgCost;
      donor.costImpact = -donor.balance * underAvgCost;
    });
  });

  return snapshots;
}
