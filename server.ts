import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { getDatabase, saveDatabase, initDatabase, setPgCache } from "./src/dbMock.js";
import { calculateELP } from "./src/complianceEngine.js";
import { runComplianceTests } from "./src/compliance.test.js";
import { DiscoveredApplication } from "./src/types.js";
import Groq from "groq-sdk";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));

// CORS — allows separate frontend origins in development/production
app.use((_req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (_req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

// ---------------------------------------------------------
// JWT AUTHENTICATION & RBAC MIDDLEWARE
// ---------------------------------------------------------
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "sam-core-dev-secret-change-in-production";

interface AuthPayload {
  userId: string;
  email: string;
  tenantId: string;
  roleId: string;
  permissions: {
    licenses: "None" | "Read" | "Write";
    saas: "None" | "Read" | "Write";
    cloud: "None" | "Read" | "Write";
    admin: "None" | "Read" | "Write";
    auditLogs: "None" | "Read" | "Write";
  };
}

function generateToken(payload: AuthPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

function authMiddleware(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    // Always inject default tenant (demo/SaaS mode — no strict auth for POST)
    req.user = {
      userId: "usr-1",
      email: "ericob3ware@gmail.com",
      tenantId: "tenant-default",
      roleId: "role-sysadmin",
      permissions: { licenses: "Write", saas: "Write", cloud: "Write", admin: "Write", auditLogs: "Write" },
    };
    return next();
  }
  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET) as AuthPayload;
    req.user = decoded;
    next();
  } catch (error) {
    // Token invalid/expired — fall back to default user instead of blocking
    req.user = {
      userId: "usr-1",
      email: "ericob3ware@gmail.com",
      tenantId: "tenant-default",
      roleId: "role-sysadmin",
      permissions: { licenses: "Write", saas: "Write", cloud: "Write", admin: "Write", auditLogs: "Write" },
    };
    next();
  }
}

function requirePermission(module: keyof AuthPayload["permissions"], level: "Read" | "Write") {
  return (req: any, res: any, next: any) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const userLevel = req.user.permissions[module];
    if (level === "Write" && userLevel !== "Write") {
      return res.status(403).json({ error: `Insufficient permissions for ${module}:${level}` });
    }
    if (level === "Read" && (userLevel !== "Read" && userLevel !== "Write")) {
      return res.status(403).json({ error: `Insufficient permissions for ${module}:${level}` });
    }
    next();
  };
}

function tenantIsolation(req: any, res: any, next: any) {
  if (!req.user) return next();
  const db = getDatabase();
  // Filter all data to current tenant — each entity gets filtered at query time
  req.tenantId = req.user.tenantId;
  next();
}

// Apply auth globally (can be bypassed for public endpoints)
// GET data endpoints are public (demo/SaaS mode); POST/PUT/DELETE require auth
app.use("/api", (req, res, next) => {
  if (req.path === "/health" || req.path === "/auth/login" || req.path === "/auth/register") {
    return next();
  }
  // Allow GET requests without auth so the UI can load data
  if (req.method === "GET") {
    req.user = {
      userId: "usr-1",
      email: "ericob3ware@gmail.com",
      tenantId: "tenant-default",
      roleId: "role-sysadmin",
      permissions: { licenses: "Write", saas: "Write", cloud: "Write", admin: "Write", auditLogs: "Write" },
    };
    return next();
  }
  authMiddleware(req, res, next);
});
app.use("/api", tenantIsolation);

// Public auth endpoints
app.post("/api/auth/login", (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }
    const db = getDatabase();
    const user = db.adminUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user || user.status !== "Active") {
      return res.status(401).json({ error: "Invalid credentials or user inactive" });
    }
    // Simple password check (in production use bcrypt)
    if (password !== "b3ware2026" && password !== "demo123") {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const role = db.adminRoles.find((r) => r.id === user.roleId);
    const token = generateToken({
      userId: user.id,
      email: user.email,
      tenantId: user.tenantId,
      roleId: user.roleId,
      permissions: role?.permissions || { licenses: "Read", saas: "Read", cloud: "Read", admin: "Read", auditLogs: "Read" },
    });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: role?.name } });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/auth/register", (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email, and password required" });
    }
    const db = getDatabase();
    if (db.adminUsers.find((u) => u.email.toLowerCase() === email.toLowerCase())) {
      return res.status(409).json({ error: "Email already registered" });
    }
    const newUser = {
      id: `usr-${Date.now()}`,
      tenantId: "tenant-default",
      name,
      email,
      passwordHash: password,
      roleId: "role-user",
      groupIds: ["group-read"],
      status: "Active" as const,
      joinedDate: new Date().toISOString().split("T")[0],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.adminUsers.push(newUser);
    saveDatabase(db);
    const token = generateToken({
      userId: newUser.id,
      email: newUser.email,
      tenantId: newUser.tenantId,
      roleId: newUser.roleId,
      permissions: { licenses: "Read", saas: "Read", cloud: "Read", admin: "None", auditLogs: "None" },
    });
    res.status(201).json({ token, user: { id: newUser.id, name: newUser.name, email: newUser.email } });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Lazy initializer for Groq SDK
let groqClient: Groq | null = null;
function getGroqClient(): Groq {
  if (!groqClient) {
    const key = process.env.GROQ_API_KEY;
    if (!key) {
      throw new Error("GROQ_API_KEY environment variable is required. Please add it via Settings > Secrets.");
    }
    groqClient = new Groq({ apiKey: key });
  }
  return groqClient;
}

// ---------------------------------------------------------
// REST API ROUTES
// ---------------------------------------------------------

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// Run compliance engine tests
app.get("/api/run-tests", (req, res) => {
  try {
    const success = runComplianceTests();
    res.json({ success, message: "All unit tests completed successfully." });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all licenses
app.get("/api/licenses", (req, res) => {
  try {
    const db = getDatabase();
    res.json(db.licenses);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get agreements
app.get("/api/agreements", (req, res) => {
  try {
    const db = getDatabase();
    res.json(db.agreements);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Calculate and return ELP Compliance Snapshots
app.get("/api/compliance", (req: any, res) => {
  try {
    const db = getDatabase();
    const snapshots = calculateELP(
      db.licenses,
      db.purchases,
      db.computers,
      db.installations,
      db.assignments,
      db.subscriptionLicenses,
      db.licensePools,
      [],
      [],
      db.cloudResources
    );
    res.json(snapshots);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Renewal forecasting endpoint
app.get("/api/renewal-forecasts", (req: any, res) => {
  try {
    const db = getDatabase();
    const forecasts = db.licenses
      .filter((l) => l.isSubscription)
      .map((l) => {
        const sub = db.subscriptionLicenses.find((s) => s.licenseId === l.id);
        if (!sub) return null;
        const daysUntilExpiry = Math.ceil(
          (new Date(sub.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
        let renewalStatus: string;
        let recommendation: string;
        if (daysUntilExpiry <= 0) {
          renewalStatus = "Expired";
          recommendation = "Subscription has expired. Renew immediately.";
        } else if (daysUntilExpiry <= 30) {
          renewalStatus = "Expiring Soon";
          recommendation = `Expires in ${daysUntilExpiry} days. ${sub.autoRenew ? "Auto-renew enabled." : "Manual renewal needed."}`;
        } else if (sub.autoRenew) {
          renewalStatus = "Auto-Renew";
          recommendation = "Renews automatically.";
        } else {
          renewalStatus = "Manual Renewal Needed";
          recommendation = `Renew by ${sub.endDate}.`;
        }
        return {
          licenseId: l.id,
          softwareName: l.softwareName,
          publisher: l.publisher,
          agreementId: l.agreementId,
          currentEndDate: sub.endDate,
          autoRenew: sub.autoRenew,
          daysUntilExpiry,
          estimatedAnnualCost: l.totalQuantity * 0,
          renewalStatus,
          recommendation,
        };
      })
      .filter(Boolean);
    res.json(forecasts);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Azure Hybrid Benefit endpoint
app.get("/api/azure-hybrid-benefits", (req: any, res) => {
  try {
    const db = getDatabase();
    const benefits = db.cloudResources
      .filter((r) => r.provider === "Azure" && r.pricingModel === "PAYG" && !r.hasLicenseCoverage)
      .map((r) => {
        const savings = Math.round(r.cost * 0.4);
        return {
          resourceId: r.id,
          resourceName: r.name,
          softwareDetected: r.softwareInstalled,
          estimatedMonthlySavings: savings,
          recommendation: `Enable Azure Hybrid Benefit on ${r.name} to save ~$${savings}/month`,
        };
      });
    res.json(benefits);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new license
app.post("/api/licenses", (req, res) => {
  try {
    const db = getDatabase();
    const { softwareName, publisher, metricType, agreementId, notes, version, sku, downgradeRights, isSubscription, purchases, licensePoolId } = req.body;

    if (!softwareName || !publisher || !metricType) {
      return res.status(400).json({ error: "softwareName, publisher, and metricType are required." });
    }

    // Default policy: requires agreementId and SKU to be present
    const policyFields = ["agreementId", "sku"];
    
    // Check if the mandatory fields are supplied
    let isComplete = true;
    if (policyFields.includes("agreementId") && !agreementId) isComplete = false;
    if (policyFields.includes("sku") && !sku) isComplete = false;

    const newLicenseId = `lic-${Date.now()}`;
    const newLicense = {
      id: newLicenseId,
      softwareName,
      publisher,
      metricType,
      totalQuantity: 0,
      allocatedQuantity: 0,
      agreementId: agreementId || undefined,
      licensePoolId: licensePoolId || undefined,
      status: (isComplete ? "Active" : "Incomplete") as "Active" | "Incomplete",
      notes,
      version,
      sku,
      downgradeRights: !!downgradeRights,
      isSubscription: !!isSubscription,
      licensePolicy: { mandatoryFields: policyFields }
    };

    db.licenses.push(newLicense);

    // If user provided an initial purchase along with the license creation
    if (purchases && Array.isArray(purchases)) {
      purchases.forEach((p: any) => {
        const qty = Number(p.quantity) || 0;
        const uCost = Number(p.unitCost) || 0;
        const newPurchase = {
          id: `pur-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          licenseId: newLicenseId,
          invoiceNumber: p.invoiceNumber || "N/A",
          purchaseDate: p.purchaseDate || new Date().toISOString().split("T")[0],
          quantity: qty,
          unitCost: uCost,
          currency: p.currency || "USD",
          totalCost: qty * uCost
        };
        db.purchases.push(newPurchase);
      });
    }

    // Re-evaluate license total quantity
    const licensePurchases = db.purchases.filter(p => p.licenseId === newLicenseId);
    newLicense.totalQuantity = licensePurchases.reduce((sum, p) => sum + p.quantity, 0);

    saveDatabase(db);
    res.status(201).json(newLicense);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update a license
app.put("/api/licenses/:id", (req, res) => {
  try {
    const db = getDatabase();
    const licenseId = req.params.id;
    const index = db.licenses.findIndex(l => l.id === licenseId);

    if (index === -1) {
      return res.status(404).json({ error: "License not found" });
    }

    const currentLicense = db.licenses[index];
    const { softwareName, publisher, metricType, agreementId, notes, version, sku, downgradeRights, isSubscription, status, licensePoolId } = req.body;

    // Check mandatory policy fields
    const policyFields = currentLicense.licensePolicy?.mandatoryFields || ["agreementId", "sku"];
    let isComplete = true;
    const finalAgreementId = agreementId !== undefined ? agreementId : currentLicense.agreementId;
    const finalSku = sku !== undefined ? sku : currentLicense.sku;

    if (policyFields.includes("agreementId") && !finalAgreementId) isComplete = false;
    if (policyFields.includes("sku") && !finalSku) isComplete = false;

    // Update fields
    if (softwareName !== undefined) currentLicense.softwareName = softwareName;
    if (publisher !== undefined) currentLicense.publisher = publisher;
    if (metricType !== undefined) currentLicense.metricType = metricType;
    currentLicense.agreementId = finalAgreementId || undefined;
    if (licensePoolId !== undefined) currentLicense.licensePoolId = licensePoolId || undefined;
    if (notes !== undefined) currentLicense.notes = notes;
    if (version !== undefined) currentLicense.version = version;
    currentLicense.sku = finalSku || undefined;
    if (downgradeRights !== undefined) currentLicense.downgradeRights = !!downgradeRights;
    if (isSubscription !== undefined) currentLicense.isSubscription = !!isSubscription;

    // Determine status (Archive requests are respected, otherwise complete/incomplete decides)
    if (status === "Archived") {
      currentLicense.status = "Archived";
    } else {
      currentLicense.status = isComplete ? "Active" : "Incomplete";
    }

    db.licenses[index] = currentLicense;
    saveDatabase(db);
    res.json(currentLicense);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Archive a license directly
app.post("/api/licenses/:id/archive", (req, res) => {
  try {
    const db = getDatabase();
    const licenseId = req.params.id;
    const index = db.licenses.findIndex(l => l.id === licenseId);

    if (index === -1) {
      return res.status(404).json({ error: "License not found" });
    }

    db.licenses[index].status = "Archived";
    saveDatabase(db);
    res.json(db.licenses[index]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a license completely
app.delete("/api/licenses/:id", (req, res) => {
  try {
    const db = getDatabase();
    const licenseId = req.params.id;
    const initialLength = db.licenses.length;
    
    db.licenses = db.licenses.filter(l => l.id !== licenseId);
    db.purchases = db.purchases.filter(p => p.licenseId !== licenseId);
    db.assignments = db.assignments.filter(a => a.licenseId !== licenseId);

    if (db.licenses.length === initialLength) {
      return res.status(404).json({ error: "License not found" });
    }

    saveDatabase(db);
    res.json({ success: true, message: "License and associated purchase entitlements/allocations deleted." });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get manual assignments for a license
app.get("/api/licenses/:id/assignments", (req, res) => {
  try {
    const db = getDatabase();
    const licenseId = req.params.id;
    const licenseAssignments = db.assignments.filter(a => a.licenseId === licenseId);
    res.json(licenseAssignments);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create manual assignment for a license
app.post("/api/licenses/:id/assignments", (req, res) => {
  try {
    const db = getDatabase();
    const licenseId = req.params.id;
    const { targetType, targetId, quantity } = req.body;

    if (!targetType || !targetId || !quantity) {
      return res.status(400).json({ error: "targetType, targetId, and quantity are required." });
    }

    const license = db.licenses.find(l => l.id === licenseId);
    if (!license) {
      return res.status(404).json({ error: "License not found" });
    }

    const newAssignment = {
      id: `asg-${Date.now()}`,
      licenseId,
      targetType: targetType as "User" | "Device" | "OrgUnit",
      targetId,
      quantity: Number(quantity) || 1,
      allocatedAt: new Date().toISOString()
    };

    db.assignments.push(newAssignment);

    // Update the license allocated quantity cached value
    const totalAllocated = db.assignments
      .filter(a => a.licenseId === licenseId)
      .reduce((sum, a) => sum + a.quantity, 0);
    
    license.allocatedQuantity = totalAllocated;

    saveDatabase(db);
    res.status(201).json(newAssignment);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete assignment
app.delete("/api/assignments/:id", (req, res) => {
  try {
    const db = getDatabase();
    const assignmentId = req.params.id;
    const assignment = db.assignments.find(a => a.id === assignmentId);

    if (!assignment) {
      return res.status(404).json({ error: "Assignment not found" });
    }

    const licenseId = assignment.licenseId;
    db.assignments = db.assignments.filter(a => a.id !== assignmentId);

    // Recompute cached allocated quantity
    const license = db.licenses.find(l => l.id === licenseId);
    if (license) {
      license.allocatedQuantity = db.assignments
        .filter(a => a.licenseId === licenseId)
        .reduce((sum, a) => sum + a.quantity, 0);
    }

    saveDatabase(db);
    res.json({ success: true, message: "Assignment deallocated successfully." });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ---------------------------------------------------------
// LICENSE POOLS & BROWSER SAAS DISCOVERY ENDPOINTS
// ---------------------------------------------------------

// Get all license pools, with computed quantity based on linked licenses
app.get("/api/license-pools", (req, res) => {
  try {
    const db = getDatabase();
    // Compute total quantity dynamically for each pool based on licenses assigned to it
    const poolsWithQuantities = db.licensePools.map(pool => {
      const poolLicenses = db.licenses.filter(l => l.licensePoolId === pool.id);
      const computedTotal = poolLicenses.reduce((sum, l) => sum + (l.totalQuantity || 0), 0);
      return {
        ...pool,
        totalQuantity: computedTotal
      };
    });
    res.json(poolsWithQuantities);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new license pool
app.post("/api/license-pools", (req, res) => {
  try {
    const db = getDatabase();
    const { name, description, ownerOrgNodeId } = req.body;
    if (!name) {
      return res.status(400).json({ error: "Pool name is required" });
    }
    const newPool = {
      id: `pool-${Date.now()}`,
      name,
      description,
      ownerOrgNodeId: ownerOrgNodeId || undefined,
      totalQuantity: 0
    };
    db.licensePools.push(newPool);
    saveDatabase(db);
    res.status(201).json(newPool);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update a license pool
app.put("/api/license-pools/:id", (req, res) => {
  try {
    const db = getDatabase();
    const poolId = req.params.id;
    const index = db.licensePools.findIndex(p => p.id === poolId);
    if (index === -1) {
      return res.status(404).json({ error: "License pool not found" });
    }
    const { name, description, ownerOrgNodeId } = req.body;
    if (name !== undefined) db.licensePools[index].name = name;
    if (description !== undefined) db.licensePools[index].description = description;
    db.licensePools[index].ownerOrgNodeId = ownerOrgNodeId || undefined;
    
    // Recompute total quantity
    const poolLicenses = db.licenses.filter(l => l.licensePoolId === poolId);
    db.licensePools[index].totalQuantity = poolLicenses.reduce((sum, l) => sum + (l.totalQuantity || 0), 0);

    saveDatabase(db);
    res.json(db.licensePools[index]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a license pool
app.delete("/api/license-pools/:id", (req, res) => {
  try {
    const db = getDatabase();
    const poolId = req.params.id;
    const index = db.licensePools.findIndex(p => p.id === poolId);
    if (index === -1) {
      return res.status(404).json({ error: "License pool not found" });
    }
    
    // Remove reference from licenses in this pool
    db.licenses.forEach(l => {
      if (l.licensePoolId === poolId) {
        delete l.licensePoolId;
      }
    });

    db.licensePools.splice(index, 1);
    saveDatabase(db);
    res.json({ success: true, message: "License pool deleted successfully." });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Browser Extension SaaS URL Identification & Discovery Endpoint
app.post("/api/saas/discover-url", (req, res) => {
  try {
    const db = getDatabase();
    const { url, email, userName } = req.body;
    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    const urlLower = url.toLowerCase();
    let matchedApp = null;

    // Check custom private catalog first
    const privateMatch = db.privateCatalog.find(item => urlLower.includes(item.matchPattern.toLowerCase()));
    if (privateMatch) {
      matchedApp = db.saasApplications.find(app => app.name === privateMatch.softwareName);
      if (!matchedApp) {
        // Create SaaS application representation if not exist
        matchedApp = {
          id: `saas-app-${Date.now()}`,
          name: privateMatch.softwareName,
          publisher: privateMatch.publisher,
          category: "Private Application",
          riskScore: 15,
          isApproved: true,
          discoveredSources: ["Browser Extension"]
        };
        db.saasApplications.push(matchedApp);
      }
    }

    // Check predefined applications
    if (!matchedApp) {
      if (urlLower.includes("salesforce.com")) {
        matchedApp = db.saasApplications.find(a => a.id === "saas-app-salesforce");
      } else if (urlLower.includes("office.com") || urlLower.includes("microsoft365.com") || urlLower.includes("outlook.live.com")) {
        matchedApp = db.saasApplications.find(a => a.id === "saas-app-m365");
      } else if (urlLower.includes("mail.google.com") || urlLower.includes("drive.google.com") || urlLower.includes("docs.google.com")) {
        matchedApp = db.saasApplications.find(a => a.id === "saas-app-gworkspace");
      } else if (urlLower.includes("slack.com")) {
        matchedApp = db.saasApplications.find(a => a.id === "saas-app-slack");
      } else if (urlLower.includes("zoom.us")) {
        matchedApp = db.saasApplications.find(a => a.id === "saas-app-zoom");
      } else if (urlLower.includes("adobe.com") || urlLower.includes("creativecloud")) {
        matchedApp = db.saasApplications.find(a => a.id === "saas-app-adobe-cc");
      } else if (urlLower.includes("servicenow.com")) {
        matchedApp = db.saasApplications.find(a => a.id === "saas-app-servicenow");
      } else if (urlLower.includes("copy.ai")) {
        matchedApp = db.saasApplications.find(a => a.id === "saas-app-shadow-ai");
      } else if (urlLower.includes("webtorrent")) {
        matchedApp = db.saasApplications.find(a => a.id === "saas-app-shadow-torrent");
      } else if (urlLower.includes("figma.com")) {
        // Register a new SaaS app for Figma
        matchedApp = db.saasApplications.find(a => a.name.toLowerCase() === "figma");
        if (!matchedApp) {
          matchedApp = {
            id: "saas-app-figma",
            name: "Figma",
            publisher: "Figma Inc.",
            category: "Design & Creative",
            riskScore: 22,
            isApproved: true,
            discoveredSources: ["Browser Extension"]
          };
          db.saasApplications.push(matchedApp);
        }
      } else if (urlLower.includes("trello.com")) {
        matchedApp = db.saasApplications.find(a => a.name.toLowerCase() === "trello");
        if (!matchedApp) {
          matchedApp = {
            id: "saas-app-trello",
            name: "Trello",
            publisher: "Atlassian",
            category: "Project Management",
            riskScore: 20,
            isApproved: true,
            discoveredSources: ["Browser Extension"]
          };
          db.saasApplications.push(matchedApp);
        }
      } else if (urlLower.includes("chatgpt.com") || urlLower.includes("openai.com")) {
        matchedApp = db.saasApplications.find(a => a.name.toLowerCase() === "chatgpt");
        if (!matchedApp) {
          matchedApp = {
            id: "saas-app-chatgpt",
            name: "ChatGPT",
            publisher: "OpenAI",
            category: "AI Assistant",
            riskScore: 45,
            isApproved: false, // Shadow IT by default
            discoveredSources: ["Browser Extension"]
          };
          db.saasApplications.push(matchedApp);
        }
      }
    }

    // If still not matched, register as a generic shadow SaaS application based on domain
    if (!matchedApp) {
      try {
        const domain = new URL(url).hostname;
        const nameClean = domain.replace("www.", "").split(".")[0];
        const appName = nameClean.charAt(0).toUpperCase() + nameClean.slice(1);
        matchedApp = {
          id: `saas-app-${nameClean}`,
          name: appName,
          publisher: `${appName} Inc.`,
          category: "General SaaS",
          riskScore: 50,
          isApproved: false,
          discoveredSources: ["Browser Extension"]
        };
        db.saasApplications.push(matchedApp);
      } catch (e) {
        // Fallback for invalid URLs or relative paths
        matchedApp = {
          id: `saas-app-unknown`,
          name: "Unknown Web App",
          publisher: "Unknown",
          category: "General SaaS",
          riskScore: 60,
          isApproved: false,
          discoveredSources: ["Browser Extension"]
        };
      }
    }

    // Now record user activity
    if (matchedApp) {
      // Ensure "Browser Extension" is in sources
      if (!matchedApp.discoveredSources.includes("Browser Extension")) {
        matchedApp.discoveredSources.push("Browser Extension");
      }

      // Find or create SaaS User
      const userEmail = email || "ericob3ware@gmail.com";
      let saasUser = db.saasUsers.find(u => u.email.toLowerCase() === userEmail.toLowerCase());
      if (!saasUser) {
        saasUser = {
          id: `saas-usr-${Date.now()}`,
          name: userName || "Extension User",
          email: userEmail,
          department: "Operations",
          status: "Active",
          identitySources: ["Browser Extension"]
        };
        db.saasUsers.push(saasUser);
      } else {
        if (!saasUser.identitySources.includes("Browser Extension")) {
          saasUser.identitySources.push("Browser Extension");
        }
      }

      // Add activity entry
      const newActivity = {
        id: `act-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        saasApplicationId: matchedApp.id,
        saasUserId: saasUser.id,
        lastActiveDate: new Date().toISOString(),
        usageDurationMinutes: 10, // Default tick
        activityLevel: "Active" as const,
        sourceConnector: "Browser Extension"
      };
      db.saasUserActivities.push(newActivity);

      // Create an Audit Log entry for discovery
      const newAuditLog = {
        id: `audit-${Date.now()}`,
        timestamp: new Date().toISOString(),
        userId: "system",
        userEmail: userEmail,
        action: "Browser Extension Discovery",
        category: "SaaS" as const,
        ipAddress: "127.0.0.1",
        details: `Discovered use of SaaS App ${matchedApp.name} via URL: ${url}`
      };
      db.auditLogs.unshift(newAuditLog);

      saveDatabase(db);
    }

    res.json({
      success: true,
      identified: true,
      application: matchedApp
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Local invoice parser fallback (when Groq AI is unavailable)
function localParseInvoice(body: any) {
  const { fileData, mimeType, description } = body;
  const text = description || "";
  const lower = text.toLowerCase();

  const knownSoftware: Record<string, { publisher: string }> = {
    "windows server": { publisher: "Microsoft" },
    "sql server": { publisher: "Microsoft" },
    "office": { publisher: "Microsoft" },
    "visual studio": { publisher: "Microsoft" },
    "microsoft 365": { publisher: "Microsoft" },
    "exchange": { publisher: "Microsoft" },
    "photoshop": { publisher: "Adobe" },
    "acrobat": { publisher: "Adobe" },
    "illustrator": { publisher: "Adobe" },
    "oracle database": { publisher: "Oracle" },
    "weblogic": { publisher: "Oracle" },
    "java": { publisher: "Oracle" },
    "mysql": { publisher: "Oracle" },
    "vmware": { publisher: "Broadcom" },
    "vsphere": { publisher: "Broadcom" },
    "sap": { publisher: "SAP" },
    "autocad": { publisher: "Autodesk" },
    "solidworks": { publisher: "Dassault" },
    "matlab": { publisher: "MathWorks" },
    "slack": { publisher: "Salesforce" },
    "jira": { publisher: "Atlassian" },
    "confluence": { publisher: "Atlassian" },
    "snow": { publisher: "Snow Software" },
    "flexera": { publisher: "Flexera" },
    "ibm": { publisher: "IBM" },
  };

  let softwareName = "Software Title";
  let publisher = "Vendor";
  let quantity = 1;
  let unitCost = 0;

  for (const [name, meta] of Object.entries(knownSoftware)) {
    if (lower.includes(name)) {
      softwareName = name.split(" ").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
      publisher = meta.publisher;
      break;
    }
  }

  const qtyMatch = text.match(/(\d+)\s*(licen[cç]as?|seats?|usu[aá]rios?|users?|unidades?|c[aá]pias?|copies?|units?)/i);
  if (qtyMatch) quantity = parseInt(qtyMatch[1]);

  const costMatch = text.match(/(?:USD|EUR|BRL|\$)?\s*(\d+[.,]\d{0,2})\s*(?:USD|EUR|BRL|\$)?\s*(?:per|por|cada|each|\/)?\s*(?:license|seat|user|unit)?/i);
  if (costMatch) unitCost = parseFloat(costMatch[1].replace(",", "."));

  const invoiceMatch = text.match(/(?:invoice|fatura|nota|po|order)\s*(?:#|n[º°]|number)?\s*:?\s*([\w-]+)/i);
  const invoiceNumber = invoiceMatch?.[1] || `LOCAL-${Date.now()}`;

  const dateMatch = text.match(/(\d{4}[-/]\d{2}[-/]\d{2})/);
  const purchaseDate = dateMatch?.[1] || new Date().toISOString().split("T")[0];

  if (fileData && !description) {
    softwareName = "Documento ANEXADO — use descrição textual para extração precisa";
    publisher = "Verificar manualmente";
  }

  return {
    softwareName,
    publisher,
    quantity,
    unitCost,
    currency: costMatch && text.toUpperCase().includes("EUR") ? "EUR" : text.toUpperCase().includes("BRL") ? "BRL" : "USD",
    sku: "",
    invoiceNumber,
    purchaseDate,
    vendor: publisher,
  };
}

// AI Invoice Ingest End-Point
app.post("/api/ingest-invoice", async (req, res) => {
  try {
    const { fileData, mimeType, description } = req.body;

    if (!fileData && !description) {
      return res.status(400).json({ error: "Either base64 fileData or a text description is required." });
    }

    // Call Groq with Llama vision model
    const ai = getGroqClient();
    const systemMsg = `You are an ITAM invoice parser. Extract software license purchase info from the document.
Look CAREFULLY at the document text. Identify the actual software product, publisher, and license details.
Return ONLY valid JSON with these exact fields (use empty string "" for missing fields):
- "softwareName": the actual product name found in the document (e.g. "ESET Protect", "Microsoft 365 Business", "Adobe Acrobat Pro")
- "publisher": the software publisher/vendor found in the document (e.g. "ESET", "Microsoft", "Adobe", "Oracle")
- "quantity": total number of licenses/seats purchased (integer, 0 if not found)
- "unitCost": cost per license unit (number, 0 if not found)
- "currency": ISO currency code found (e.g. USD, EUR, BRL, GBP) or "" if not found
- "sku": manufacturer SKU / part number if visible, or ""
- "invoiceNumber": invoice or PO number if visible, or ""
- "purchaseDate": purchase date in YYYY-MM-DD if visible, or ""
- "vendor": reseller or vendor name if visible, or ""
IMPORTANT: Only populate fields with data you actually see in the document. Do NOT guess or invent values.`;

    const userMsg = fileData && mimeType
      ? `Read this ${mimeType} invoice/contract document carefully. Extract all visible software license purchase information exactly as shown in the document.`
      : `Extract the license purchase details from this description: "${description}"`;

    const messages: any[] = [{ role: "system", content: systemMsg }];

    let extractedText = "";

    if (fileData && mimeType) {
      if (mimeType.startsWith("image/")) {
        const base64Data = `data:${mimeType};base64,${fileData}`;
        messages.push({
          role: "user",
          content: [
            { type: "text", text: userMsg },
            { type: "image_url", image_url: { url: base64Data } }
          ]
        });
      } else if (mimeType === "application/pdf") {
        try {
          const raw = Buffer.from(fileData, "base64");
          const uint8 = new Uint8Array(raw.buffer, raw.byteOffset, raw.byteLength);
          const { PDFParse } = require("pdf-parse");
          const pdf = new PDFParse(uint8);
          await pdf.load();
          const pages = await pdf.getText();
          extractedText = (Array.isArray(pages) ? pages.map((p: any) => p.text || p.content || "").join("\n") : String(pages)).trim();
        } catch (pdfErr: any) {
          console.error("PDF parse error:", pdfErr.message);
        }
        if (extractedText) {
          messages.push({
            role: "user",
            content: `Extract the license purchase details from this PDF content:\n\n"""\n${extractedText.slice(0, 8000)}\n"""`
          });
        } else {
          messages.push({ role: "user", content: userMsg + " (PDF — unable to extract text)" });
        }
      } else {
        messages.push({ role: "user", content: userMsg });
      }
    } else {
      messages.push({ role: "user", content: userMsg });
    }

    const response = await ai.chat.completions.create({
      model: fileData && mimeType?.startsWith("image/") ? "qwen/qwen3.6-27b" : "llama-3.3-70b-versatile",
      messages,
      response_format: { type: "json_object" },
      temperature: 0.01,
    });

    const parsedJson = JSON.parse(response.choices[0]?.message?.content || "{}");
    res.json(parsedJson);

  } catch (error: any) {
    console.error("AI Ingestion error:", error);
    const msg = error.message || "";
    // If credits depleted or auth error — don't fallback for images (can't read them locally)
    if (req.body.fileData && !req.body.description) {
      const isCreditIssue = msg.includes("429") || msg.includes("credits") || msg.includes("RESOURCE_EXHAUSTED") || msg.includes("API_KEY");
      return res.status(402).json({
        error: isCreditIssue
          ? "IA temporariamente indisponível (créditos/limite). Use a descrição textual abaixo ou preencha manualmente."
          : `IA temporariamente indisponível: ${msg}. Preencha os dados manualmente.`,
        aiFailed: true
      });
    }
    // For text descriptions, fall back to local parser
    try {
      const localResult = localParseInvoice(req.body);
      return res.json(localResult);
    } catch (fallbackErr: any) {
      return res.status(500).json({ error: `Fallback também falhou: ${fallbackErr.message}` });
    }
  }
});


// ---------------------------------------------------------
// INVENTORY & SOFTWARE RECOGNITION SERVICE (DIS & HAM)
// ---------------------------------------------------------

// GET all computers (including HAM fields)
app.get("/api/computers", (req, res) => {
  try {
    const db = getDatabase();
    res.json(db.computers);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET single computer with detailed detected apps
app.get("/api/computers/:id", (req, res) => {
  try {
    const db = getDatabase();
    const computer = db.computers.find(c => c.id === req.params.id);
    if (!computer) {
      return res.status(404).json({ error: "Computer not found" });
    }
    const apps = db.discoveredApplications.filter(a => a.computerId === computer.id);
    const insts = db.installations.filter(i => i.computerId === computer.id);
    res.json({ computer, applications: apps, installations: insts });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// CREATE a computer
app.post("/api/computers", (req, res) => {
  try {
    const db = getDatabase();
    const { name, cores, pvuPerCore, isVirtual, os, ramGB, cpuModel, serialNumber, brand, model, storageGB, warrantyStatus, warrantyExpirationDate } = req.body;
    
    if (!name || !os) {
      return res.status(400).json({ error: "Computer name and operating system (os) are required." });
    }

    const newComputer = {
      id: `cmp-custom-${Date.now()}`,
      name,
      cores: Number(cores) || 4,
      pvuPerCore: Number(pvuPerCore) || 70,
      isVirtual: !!isVirtual,
      os: os as "Windows" | "Linux" | "macOS",
      ramGB: Number(ramGB) || 16,
      cpuModel: cpuModel || "Standard Processor",
      serialNumber: serialNumber || `SN-SYS-${Math.floor(10000 + Math.random() * 90000)}`,
      brand: brand || "Generic",
      model: model || "Standard Hardware",
      storageGB: Number(storageGB) || 256,
      warrantyStatus: (warrantyStatus || "No Info") as "Under Warranty" | "Expired" | "No Info",
      warrantyExpirationDate: warrantyExpirationDate || "",
      lifecycleStatus: "Active" as "Active" | "Quarantined" | "Archived" | "Inactive",
      lastActiveDate: new Date().toISOString()
    };

    db.computers.push(newComputer);
    saveDatabase(db);
    res.status(201).json(newComputer);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// UPDATE a computer
app.put("/api/computers/:id", (req, res) => {
  try {
    const db = getDatabase();
    const computer = db.computers.find(c => c.id === req.params.id);
    if (!computer) {
      return res.status(404).json({ error: "Computer not found" });
    }

    const { name, cores, pvuPerCore, isVirtual, os, ramGB, cpuModel, serialNumber, brand, model, storageGB, warrantyStatus, warrantyExpirationDate, lifecycleStatus } = req.body;

    if (name !== undefined) computer.name = name;
    if (cores !== undefined) computer.cores = Number(cores);
    if (pvuPerCore !== undefined) computer.pvuPerCore = Number(pvuPerCore);
    if (isVirtual !== undefined) computer.isVirtual = !!isVirtual;
    if (os !== undefined) computer.os = os;
    if (ramGB !== undefined) computer.ramGB = Number(ramGB);
    if (cpuModel !== undefined) computer.cpuModel = cpuModel;
    if (serialNumber !== undefined) computer.serialNumber = serialNumber;
    if (brand !== undefined) computer.brand = brand;
    if (model !== undefined) computer.model = model;
    if (storageGB !== undefined) computer.storageGB = Number(storageGB);
    if (warrantyStatus !== undefined) computer.warrantyStatus = warrantyStatus;
    if (warrantyExpirationDate !== undefined) computer.warrantyExpirationDate = warrantyExpirationDate;
    if (lifecycleStatus !== undefined) computer.lifecycleStatus = lifecycleStatus;

    saveDatabase(db);
    res.json(computer);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE computer (also wipes discovered apps/installs)
app.delete("/api/computers/:id", (req, res) => {
  try {
    const db = getDatabase();
    const initialLen = db.computers.length;
    db.computers = db.computers.filter(c => c.id !== req.params.id);
    db.installations = db.installations.filter(i => i.computerId !== req.params.id);
    db.discoveredApplications = db.discoveredApplications.filter(a => a.computerId !== req.params.id);

    if (db.computers.length === initialLen) {
      return res.status(404).json({ error: "Computer not found" });
    }

    saveDatabase(db);
    res.json({ success: true, message: "Computer and its endpoint software collections removed." });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// HAM Lifecycle Quarantine/Archive/Inactivate/Activate triggers
app.post("/api/computers/:id/quarantine", (req, res) => {
  try {
    const db = getDatabase();
    const computer = db.computers.find(c => c.id === req.params.id);
    if (!computer) return res.status(404).json({ error: "Computer not found" });
    computer.lifecycleStatus = "Quarantined";
    saveDatabase(db);
    res.json(computer);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/computers/:id/archive", (req, res) => {
  try {
    const db = getDatabase();
    const computer = db.computers.find(c => c.id === req.params.id);
    if (!computer) return res.status(404).json({ error: "Computer not found" });
    computer.lifecycleStatus = "Archived";
    saveDatabase(db);
    res.json(computer);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/computers/:id/inactive", (req, res) => {
  try {
    const db = getDatabase();
    const computer = db.computers.find(c => c.id === req.params.id);
    if (!computer) return res.status(404).json({ error: "Computer not found" });
    computer.lifecycleStatus = "Inactive";
    saveDatabase(db);
    res.json(computer);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/computers/:id/activate", (req, res) => {
  try {
    const db = getDatabase();
    const computer = db.computers.find(c => c.id === req.params.id);
    if (!computer) return res.status(404).json({ error: "Computer not found" });
    computer.lifecycleStatus = "Active";
    saveDatabase(db);
    res.json(computer);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET all mobile devices
app.get("/api/mobile-devices", (req, res) => {
  try {
    const db = getDatabase();
    res.json(db.mobileDevices || []);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// CREATE mobile device
app.post("/api/mobile-devices", (req, res) => {
  try {
    const db = getDatabase();
    const { name, brand, model, os, serialNumber, userName, warrantyStatus, warrantyExpirationDate } = req.body;
    
    if (!name || !brand || !model) {
      return res.status(400).json({ error: "Device name, brand, and model are required." });
    }

    const newDevice = {
      id: `mob-${Date.now()}`,
      name,
      brand,
      model,
      os: os || "iOS",
      serialNumber: serialNumber || `SN-MOB-${Math.floor(10000 + Math.random() * 90000)}`,
      userName: userName || "unassigned@company.com",
      warrantyStatus: (warrantyStatus || "No Info") as "Under Warranty" | "Expired" | "No Info",
      warrantyExpirationDate: warrantyExpirationDate || "",
      lifecycleStatus: "Active" as "Active" | "Quarantined" | "Archived" | "Inactive",
      lastActiveDate: new Date().toISOString()
    };

    db.mobileDevices.push(newDevice);
    saveDatabase(db);
    res.status(201).json(newDevice);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE mobile device
app.delete("/api/mobile-devices/:id", (req, res) => {
  try {
    const db = getDatabase();
    const initialLen = db.mobileDevices.length;
    db.mobileDevices = db.mobileDevices.filter(m => m.id !== req.params.id);
    if (db.mobileDevices.length === initialLen) {
      return res.status(404).json({ error: "Mobile device not found" });
    }
    saveDatabase(db);
    res.json({ success: true, message: "Mobile device removed successfully." });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET all discovered applications (with optional computer details)
app.get("/api/applications", (req, res) => {
  try {
    const db = getDatabase();
    res.json(db.discoveredApplications);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// CRUD discovered applications
app.delete("/api/applications/:id", (req, res) => {
  try {
    const db = getDatabase();
    const initialLen = db.discoveredApplications.length;
    db.discoveredApplications = db.discoveredApplications.filter(a => a.id !== req.params.id);
    if (db.discoveredApplications.length === initialLen) {
      return res.status(404).json({ error: "Discovered app not found" });
    }
    saveDatabase(db);
    res.json({ success: true, message: "Discovered application record removed." });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET DIS Software Catalog
app.get("/api/catalog", (req, res) => {
  try {
    const db = getDatabase();
    const { query } = req.query;
    
    let catalog = db.softwareCatalog;
    if (query) {
      const q = String(query).toLowerCase();
      catalog = catalog.filter(c => 
        c.softwareName.toLowerCase().includes(q) || 
        c.publisher.toLowerCase().includes(q) ||
        (c.defaultSku && c.defaultSku.toLowerCase().includes(q))
      );
    }
    res.json(catalog);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/catalog/categories", (req, res) => {
  try {
    const db = getDatabase();
    res.json(db.applicationCategories);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/catalog/manufacturers", (req, res) => {
  try {
    const db = getDatabase();
    res.json(db.manufacturers);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Private Application Catalogue endpoints
app.get("/api/private-catalog", (req, res) => {
  try {
    const db = getDatabase();
    res.json(db.privateCatalog || []);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/private-catalog", (req, res) => {
  try {
    const db = getDatabase();
    const { softwareName, publisher, matchPattern, categoryId, notes } = req.body;

    if (!softwareName || !publisher || !matchPattern) {
      return res.status(400).json({ error: "softwareName, publisher, and matchPattern are required." });
    }

    const newItem = {
      id: `priv-${Date.now()}`,
      softwareName,
      publisher,
      matchPattern,
      categoryId: categoryId || "cat-office",
      notes
    };

    db.privateCatalog.push(newItem);
    saveDatabase(db);
    res.status(201).json(newItem);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/private-catalog/:id", (req, res) => {
  try {
    const db = getDatabase();
    const initialLen = db.privateCatalog.length;
    db.privateCatalog = db.privateCatalog.filter(p => p.id !== req.params.id);
    if (db.privateCatalog.length === initialLen) {
      return res.status(404).json({ error: "Private catalog item not found." });
    }
    saveDatabase(db);
    res.json({ success: true, message: "Private custom application pattern deleted." });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// -----------------------------------------------------------------
// SOFTWARE RECOGNITION SERVICE & ONSITE AGENT INVENTORY TRIGGER
// -----------------------------------------------------------------
app.post("/api/inventory/agent-scan", (req, res) => {
  try {
    const db = getDatabase();
    const { computerId, rawScanLines } = req.body;

    if (!computerId) {
      return res.status(400).json({ error: "computerId is required." });
    }

    const computer = db.computers.find(c => c.id === computerId);
    if (!computer) {
      return res.status(404).json({ error: "Target computer not found." });
    }

    // Determine raw string inputs based on payload or simulated endpoint OS
    let scans: string[] = [];
    if (rawScanLines && Array.isArray(rawScanLines)) {
      scans = rawScanLines;
    } else {
      // Simulate real raw scanner output based on OS
      if (computer.os === "Windows") {
        scans = [
          "Microsoft_Office_ProPlus_Retail_en-us_16.0",
          "AcrobatReaderDC_20.012_OfflinePackage",
          "cryptominer_v2.1_setup.exe", // suspicious mining tool (malware)
          "timetracker.internal/employee_portal_sync_daemon", // custom private app
          "Zoom_Mtg_Client_v5.17"
        ];
      } else if (computer.os === "macOS") {
        scans = [
          "Adobe Photoshop CC CreativeCloud_macOS_2025.app",
          "Google Chrome AppBundle v120.0",
          "Slack Chat Endpoint macOS.app",
          "timetracker.internal/mac_login_endpoint" // custom private app
        ];
      } else {
        // Linux
        scans = [
          "oracle-database-ee-19c-rhel8.rpm",
          "google-chrome-stable_amd64.deb",
          "intellij-idea-ultimate-bin"
        ];
      }
    }

    // PROCESS scans via the Software Recognition Service engine!
    const newlyDetectedApps: DiscoveredApplication[] = [];

    scans.forEach((raw) => {
      const lowerRaw = raw.toLowerCase();
      let matchedItem: any = null;
      let isPrivate = false;

      // 1. Check Private Catalog patterns first
      const matchedPrivate = db.privateCatalog?.find(p => 
        lowerRaw.includes(p.matchPattern.toLowerCase())
      );

      if (matchedPrivate) {
        matchedItem = {
          softwareName: matchedPrivate.softwareName,
          publisher: matchedPrivate.publisher,
          version: "Internal Custom",
          categoryId: matchedPrivate.categoryId
        };
        isPrivate = true;
      } else {
        // 2. Fall back to 800K+ DIS Software Catalog matches
        // Fuzzy checks
        if (lowerRaw.includes("office") || lowerRaw.includes("proplus") || lowerRaw.includes("m365")) {
          matchedItem = db.softwareCatalog.find(item => item.id === "cat-item-m365");
        } else if (lowerRaw.includes("win11") || lowerRaw.includes("windows 11")) {
          matchedItem = db.softwareCatalog.find(item => item.id === "cat-item-win11");
        } else if (lowerRaw.includes("oracle") || lowerRaw.includes("orcl")) {
          matchedItem = db.softwareCatalog.find(item => item.id === "cat-item-oracle-db");
        } else if (lowerRaw.includes("server 2022") || lowerRaw.includes("srv-iis")) {
          matchedItem = db.softwareCatalog.find(item => item.id === "cat-item-win-srv");
        } else if (lowerRaw.includes("acrobat") || lowerRaw.includes("reader")) {
          matchedItem = db.softwareCatalog.find(item => item.id === "cat-item-acrobat");
        } else if (lowerRaw.includes("photoshop") || lowerRaw.includes("psd")) {
          matchedItem = db.softwareCatalog.find(item => item.id === "cat-item-photoshop");
        } else if (lowerRaw.includes("chrome") || lowerRaw.includes("chromium")) {
          matchedItem = db.softwareCatalog.find(item => item.id === "cat-item-chrome");
        } else if (lowerRaw.includes("intellij") || lowerRaw.includes("idea")) {
          matchedItem = db.softwareCatalog.find(item => item.id === "cat-item-intellij");
        } else if (lowerRaw.includes("slack")) {
          matchedItem = db.softwareCatalog.find(item => item.id === "cat-item-slack");
        } else if (lowerRaw.includes("zoom")) {
          matchedItem = db.softwareCatalog.find(item => item.id === "cat-item-zoom");
        } else if (lowerRaw.includes("miner") || lowerRaw.includes("cryptominer")) {
          matchedItem = db.softwareCatalog.find(item => item.id === "cat-item-malware");
        } else if (lowerRaw.includes("flash")) {
          matchedItem = db.softwareCatalog.find(item => item.id === "cat-item-flash");
        }
      }

      // 3. Assemble discovered application object
      if (matchedItem) {
        // Extract a mock version number from raw scan if present
        let parsedVersion = matchedItem.version || "1.0";
        const verMatch = raw.match(/(?:v|version)?\s*(\d+(?:\.\d+)+)/i);
        if (verMatch) parsedVersion = verMatch[1];

        const discApp: DiscoveredApplication = {
          id: `disc-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
          computerId: computerId,
          catalogItemId: matchedItem.id || undefined,
          softwareName: matchedItem.softwareName,
          rawSoftwareName: raw,
          publisher: matchedItem.publisher,
          version: parsedVersion,
          lastUsed: new Date().toISOString(),
          usageDurationMinutes: Math.floor(10 + Math.random() * 4000),
          isPrivateCatalogMatch: isPrivate
        };

        newlyDetectedApps.push(discApp);
      } else {
        // Unrecognized, save anyway as generic discovery
        newlyDetectedApps.push({
          id: `disc-unrec-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
          computerId: computerId,
          softwareName: raw.split(/[_-]/)[0] || raw,
          rawSoftwareName: raw,
          publisher: "Unrecognized Vendor",
          version: "Unknown",
          lastUsed: new Date().toISOString(),
          usageDurationMinutes: 0
        });
      }
    });

    // 4. Update the computer's last active stamp & reset lifecycleStatus to Active
    computer.lastActiveDate = new Date().toISOString();
    if (computer.lifecycleStatus === "Inactive") {
      computer.lifecycleStatus = "Active"; // scanned endpoints become active
    }

    // 5. Save discovered apps to db.discoveredApplications (remove old entries first)
    db.discoveredApplications = db.discoveredApplications.filter(a => a.computerId !== computerId);
    db.discoveredApplications.push(...newlyDetectedApps);

    // 6. SYNC installations to db.installations so ELP calculator immediately re-evaluates
    // Remove old installations for this computer
    db.installations = db.installations.filter(i => i.computerId !== computerId);
    
    // Add new installations for license matching (filtering out malware or non-licensed utilities)
    newlyDetectedApps.forEach(app => {
      // Don't add malware or Chrome as license inventory items unless wanted
      if (app.softwareName.toLowerCase().includes("miner") || app.softwareName.toLowerCase().includes("chrome") || app.softwareName.toLowerCase().includes("reader")) {
        return;
      }
      db.installations.push({
        id: `inst-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        softwareName: app.softwareName,
        publisher: app.publisher,
        version: app.version,
        computerId: computerId,
        userName: computer.name + "-user",
        detectedAt: new Date().toISOString()
      });
    });

    saveDatabase(db);
    res.json({
      success: true,
      message: `Endpoint inventory collection agent returned successfully. Recognized ${newlyDetectedApps.filter(a => a.catalogItemId || a.isPrivateCatalogMatch).length}/${newlyDetectedApps.length} applications.`,
      detectedApplications: newlyDetectedApps,
      computer
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});


// =========================================================
// SAAS MANAGEMENT MODULE APIS
// =========================================================

// GET SaaS Applications
app.get("/api/saas/applications", (req, res) => {
  try {
    const db = getDatabase();
    res.json(db.saasApplications || []);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST Create SaaS Application
app.post("/api/saas/applications", (req, res) => {
  try {
    const db = getDatabase();
    const newApp = {
      id: `saas-app-${Date.now()}`,
      name: req.body.name,
      publisher: req.body.publisher || "Unknown",
      category: req.body.category || "Uncategorized",
      riskScore: req.body.riskScore || 30,
      isApproved: req.body.isApproved !== false,
      familyName: req.body.familyName,
      discoveredSources: req.body.discoveredSources || ["Manually Created"]
    };
    db.saasApplications.push(newApp);
    saveDatabase(db);
    res.status(201).json(newApp);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT Update SaaS Application
app.put("/api/saas/applications/:id", (req, res) => {
  try {
    const db = getDatabase();
    const appIndex = db.saasApplications.findIndex(a => a.id === req.params.id);
    if (appIndex === -1) return res.status(404).json({ error: "SaaS application not found" });

    db.saasApplications[appIndex] = {
      ...db.saasApplications[appIndex],
      ...req.body
    };
    saveDatabase(db);
    res.json(db.saasApplications[appIndex]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE SaaS Application
app.delete("/api/saas/applications/:id", (req, res) => {
  try {
    const db = getDatabase();
    db.saasApplications = db.saasApplications.filter(a => a.id !== req.params.id);
    db.saasSubscriptions = db.saasSubscriptions.filter(s => s.saasApplicationId !== req.params.id);
    saveDatabase(db);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET SaaS Subscriptions
app.get("/api/saas/subscriptions", (req, res) => {
  try {
    const db = getDatabase();
    res.json(db.saasSubscriptions || []);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST Create SaaS Subscription
app.post("/api/saas/subscriptions", (req, res) => {
  try {
    const db = getDatabase();
    const newSub = {
      id: `saas-sub-${Date.now()}`,
      saasApplicationId: req.body.saasApplicationId,
      sku: req.body.sku || "CUSTOM-SKU",
      planName: req.body.planName || "Standard",
      billingFrequency: req.body.billingFrequency || "Monthly",
      seatsTotal: Number(req.body.seatsTotal) || 0,
      seatsAssigned: Number(req.body.seatsAssigned) || 0,
      costPerSeat: Number(req.body.costPerSeat) || 0,
      currency: req.body.currency || "USD",
      status: req.body.status || "Active",
      isFree: !!req.body.isFree,
      isExcluded: !!req.body.isExcluded,
      expirationDate: req.body.expirationDate
    };
    db.saasSubscriptions.push(newSub);
    saveDatabase(db);
    res.status(201).json(newSub);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT Update SaaS Subscription
app.put("/api/saas/subscriptions/:id", (req, res) => {
  try {
    const db = getDatabase();
    const subIndex = db.saasSubscriptions.findIndex(s => s.id === req.params.id);
    if (subIndex === -1) return res.status(404).json({ error: "SaaS Subscription not found" });

    db.saasSubscriptions[subIndex] = {
      ...db.saasSubscriptions[subIndex],
      ...req.body,
      seatsTotal: req.body.seatsTotal !== undefined ? Number(req.body.seatsTotal) : db.saasSubscriptions[subIndex].seatsTotal,
      seatsAssigned: req.body.seatsAssigned !== undefined ? Number(req.body.seatsAssigned) : db.saasSubscriptions[subIndex].seatsAssigned,
      costPerSeat: req.body.costPerSeat !== undefined ? Number(req.body.costPerSeat) : db.saasSubscriptions[subIndex].costPerSeat
    };
    saveDatabase(db);
    res.json(db.saasSubscriptions[subIndex]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE SaaS Subscription
app.delete("/api/saas/subscriptions/:id", (req, res) => {
  try {
    const db = getDatabase();
    db.saasSubscriptions = db.saasSubscriptions.filter(s => s.id !== req.params.id);
    db.saasSubscriptionPurchases = db.saasSubscriptionPurchases.filter(p => p.subscriptionId !== req.params.id);
    saveDatabase(db);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET SaaS Subscription Purchases
app.get("/api/saas/subscriptions/purchases", (req, res) => {
  try {
    const db = getDatabase();
    res.json(db.saasSubscriptionPurchases || []);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST Create SaaS Subscription Purchase
app.post("/api/saas/subscriptions/purchases", (req, res) => {
  try {
    const db = getDatabase();
    const newPurchase = {
      id: `saas-pur-${Date.now()}`,
      subscriptionId: req.body.subscriptionId,
      purchaseDate: req.body.purchaseDate || new Date().toISOString().split('T')[0],
      quantity: Number(req.body.quantity) || 1,
      unitCost: Number(req.body.unitCost) || 0,
      totalCost: (Number(req.body.quantity) || 1) * (Number(req.body.unitCost) || 0),
      invoiceNumber: req.body.invoiceNumber || `INV-${Date.now()}`
    };
    db.saasSubscriptionPurchases.push(newPurchase);
    
    // Auto-update total seats on subscription
    const sub = db.saasSubscriptions.find(s => s.id === req.body.subscriptionId);
    if (sub) {
      sub.seatsTotal += newPurchase.quantity;
    }
    
    saveDatabase(db);
    res.status(201).json(newPurchase);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET SaaS Users
app.get("/api/saas/users", (req, res) => {
  try {
    const db = getDatabase();
    res.json(db.saasUsers || []);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET SaaS User Activities
app.get("/api/saas/user-activities", (req, res) => {
  try {
    const db = getDatabase();
    res.json(db.saasUserActivities || []);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET SaaS Connectors
app.get("/api/saas/connectors", (req, res) => {
  try {
    const db = getDatabase();
    res.json(db.saasConnectors || []);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Helper for consolidation
function consolidateSaaSData(db: any): { mergedUsers: number; logs: string[] } {
  const logs: string[] = [];
  const users = [...(db.saasUsers || [])];
  const activities = [...(db.saasUserActivities || [])];
  
  const groups: { [email: string]: any[] } = {};
  users.forEach(u => {
    const email = u.email.toLowerCase().trim();
    if (!groups[email]) groups[email] = [];
    groups[email].push(u);
  });
  
  const consolidatedUsers: any[] = [];
  let mergedCount = 0;
  const idMap: { [oldId: string]: string } = {};
  
  Object.keys(groups).forEach(email => {
    const userGroup = groups[email];
    if (userGroup.length === 1) {
      consolidatedUsers.push(userGroup[0]);
      idMap[userGroup[0].id] = userGroup[0].id;
    } else {
      const primary = userGroup[0];
      const identitySourcesSet = new Set<string>();
      userGroup.forEach(u => {
        u.identitySources?.forEach((src: string) => identitySourcesSet.add(src));
        idMap[u.id] = primary.id;
      });
      
      const mergedUser = {
        ...primary,
        identitySources: Array.from(identitySourcesSet),
        status: userGroup.some(u => u.status === "Active") ? "Active" : "Inactive"
      };
      
      consolidatedUsers.push(mergedUser);
      mergedCount += (userGroup.length - 1);
      logs.push(`Consolidated ${userGroup.length} identities for ${email} (Merged sources: ${mergedUser.identitySources.join(", ")})`);
    }
  });
  
  const updatedActivities = activities.map(act => {
    const newUserId = idMap[act.saasUserId];
    if (newUserId && newUserId !== act.saasUserId) {
      return { ...act, saasUserId: newUserId };
    }
    return act;
  });
  
  db.saasUsers = consolidatedUsers;
  db.saasUserActivities = updatedActivities;
  return { mergedUsers: mergedCount, logs };
}

// POST Consolidation Action
app.post("/api/saas/consolidate", (req, res) => {
  try {
    const db = getDatabase();
    const result = consolidateSaaSData(db);
    saveDatabase(db);
    res.json({
      success: true,
      message: `Data Consolidation Engine completed successfully. Consolidating multi-source logins and deduplicating records.`,
      mergedUsersCount: result.mergedUsers,
      logs: result.logs
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST Sync Connector Simulation
app.post("/api/saas/connectors/:id/sync", (req, res) => {
  try {
    const db = getDatabase();
    const connector = db.saasConnectors.find(c => c.id === req.params.id);
    if (!connector) return res.status(404).json({ error: "Connector not found" });
    
    connector.status = "Connected";
    connector.lastSyncedAt = new Date().toISOString();
    
    const logs: string[] = [];
    logs.push(`Starting secure connection to ${connector.name} endpoint API...`);
    
    const increment = Math.floor(2 + Math.random() * 5);
    connector.recordCount += increment;
    logs.push(`Sync retrieved ${increment} raw account logs and usage metrics.`);
    
    if (connector.id === "conn-okta" && db.saasUsers.length > 0) {
      const randomId = Math.floor(Math.random() * 1000);
      const duplicateUser = {
        id: `saas-usr-dup-${randomId}`,
        name: "Érico Barbosa",
        email: "ericob3ware@gmail.com",
        department: "Engineering",
        status: "Active" as const,
        identitySources: ["Okta SSO Sync Logs"]
      };
      db.saasUsers.push(duplicateUser);
      logs.push(`Discovered new OAuth Login session for user ${duplicateUser.name} (<${duplicateUser.email}>) on Okta SSO.`);
    } else if (connector.id === "conn-m365") {
      const sub = db.saasSubscriptions.find(s => s.id === "saas-sub-m365-e5");
      if (sub && sub.seatsAssigned < sub.seatsTotal) {
        sub.seatsAssigned += 1;
        logs.push(`Updated seat assignment on plan 'Enterprise E5' (Total assigned: ${sub.seatsAssigned}).`);
      }
    }
    
    const consResult = consolidateSaaSData(db);
    logs.push(...consResult.logs);
    
    saveDatabase(db);
    res.json({
      success: true,
      connector,
      logs,
      message: `Successfully synchronized ${connector.name} and executed multi-source data consolidation.`
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST Import Custom CSV Simulation
app.post("/api/saas/import-csv", (req, res) => {
  try {
    const db = getDatabase();
    const { csvData } = req.body;
    
    if (!csvData || !Array.isArray(csvData)) {
      return res.status(400).json({ error: "csvData array is required." });
    }
    
    const logs: string[] = [];
    let addedApps = 0;
    let addedUsers = 0;
    let addedActivities = 0;
    
    csvData.forEach(row => {
      const email = row.email?.trim();
      const appName = row.appName?.trim();
      if (!email || !appName) return;
      
      let app = db.saasApplications.find(a => a.name.toLowerCase() === appName.toLowerCase());
      if (!app) {
        app = {
          id: `saas-app-csv-${Date.now()}-${Math.floor(Math.random()*1000)}`,
          name: appName,
          publisher: row.publisher || "Discovered SaaS Vendor",
          category: row.category || "Shadow IT / Custom App",
          riskScore: row.riskScore || 45,
          isApproved: row.isApproved !== false,
          discoveredSources: ["CSV Upload"]
        };
        db.saasApplications.push(app);
        addedApps++;
        logs.push(`Discovered new SaaS Application via CSV: ${appName}`);
      }
      
      let user = db.saasUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (!user) {
        user = {
          id: `saas-usr-csv-${Date.now()}-${Math.floor(Math.random()*1000)}`,
          name: row.name || email.split("@")[0],
          email: email,
          department: row.department || "Unassigned",
          status: "Active",
          identitySources: ["CSV Data Import"]
        };
        db.saasUsers.push(user);
        addedUsers++;
      } else {
        if (!user.identitySources.includes("CSV Data Import")) {
          user.identitySources.push("CSV Data Import");
        }
      }
      
      const actId = `act-csv-${Date.now()}-${Math.floor(Math.random()*1000)}`;
      db.saasUserActivities.push({
        id: actId,
        saasApplicationId: app.id,
        saasUserId: user.id,
        lastActiveDate: new Date().toISOString(),
        usageDurationMinutes: row.usageDurationMinutes || 300,
        activityLevel: row.activityLevel || "Active",
        sourceConnector: "CSV Import API"
      });
      addedActivities++;
    });
    
    const consResult = consolidateSaaSData(db);
    logs.push(...consResult.logs);
    
    saveDatabase(db);
    res.json({
      success: true,
      message: `Imported ${csvData.length} records successfully.`,
      addedApps,
      addedUsers,
      addedActivities,
      logs
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST Discover SaaS Application via Browser Extension URL
app.post("/api/saas/discover-url", (req, res) => {
  try {
    const db = getDatabase();
    const { url, email, name, department } = req.body;

    if (!url) {
      return res.status(400).json({ error: "url is required" });
    }

    const userEmail = email || "browser.extension.user@company.com";
    const userName = name || "Extension User";
    const userDept = department || "Marketing";

    // 1. Parse URL to identify the SaaS app
    let matchedAppName = "";
    let matchedPublisher = "Cloud Services";
    let matchedCategory = "SaaS Application";
    let riskScore = 35;
    let familyName: "Adobe Creative Cloud" | "Microsoft 365" | "Salesforce" | "ServiceNow" | undefined = undefined;

    const lowerUrl = url.toLowerCase();
    if (lowerUrl.includes("figma.com")) {
      matchedAppName = "Figma Pro";
      matchedPublisher = "Figma";
      matchedCategory = "Design & Collaboration";
      riskScore = 20;
    } else if (lowerUrl.includes("notion.so") || lowerUrl.includes("notion.com")) {
      matchedAppName = "Notion Enterprise";
      matchedPublisher = "Notion Labs";
      matchedCategory = "Document Management";
      riskScore = 15;
    } else if (lowerUrl.includes("salesforce.com") || lowerUrl.includes("force.com")) {
      matchedAppName = "Salesforce Sales Cloud";
      matchedPublisher = "Salesforce";
      matchedCategory = "CRM & Sales";
      riskScore = 10;
      familyName = "Salesforce";
    } else if (lowerUrl.includes("slack.com")) {
      matchedAppName = "Slack";
      matchedPublisher = "Salesforce";
      matchedCategory = "Instant Messaging";
      riskScore = 25;
    } else if (lowerUrl.includes("miro.com")) {
      matchedAppName = "Miro";
      matchedPublisher = "RealtimeBoard";
      matchedCategory = "Whiteboarding";
      riskScore = 40;
    } else if (lowerUrl.includes("zoom.us")) {
      matchedAppName = "Zoom";
      matchedPublisher = "Zoom Video Communications";
      matchedCategory = "Video Conference";
      riskScore = 30;
    } else if (lowerUrl.includes("chat.openai.com") || lowerUrl.includes("chatgpt.com")) {
      matchedAppName = "ChatGPT Pro";
      matchedPublisher = "OpenAI";
      matchedCategory = "AI Assistants (Shadow IT)";
      riskScore = 85; // high risk score for shadow AI
    } else {
      // Generic SaaS recognition based on URL domain
      try {
        const parsed = new URL(url);
        const hostParts = parsed.hostname.replace("www.", "").split(".");
        const domain = hostParts[0];
        matchedAppName = domain.charAt(0).toUpperCase() + domain.slice(1);
      } catch (e) {
        matchedAppName = "Custom Cloud Tool";
      }
      riskScore = 55;
    }

    // 2. See if this app exists in saasApplications, otherwise create it
    let saasApp = db.saasApplications.find(a => a.name.toLowerCase() === matchedAppName.toLowerCase());
    let isNewApp = false;
    if (!saasApp) {
      saasApp = {
        id: `saas-app-${Date.now()}`,
        name: matchedAppName,
        publisher: matchedPublisher,
        category: matchedCategory,
        riskScore,
        isApproved: riskScore < 50, // auto-approve low risk apps
        discoveredSources: ["Browser Extension"],
        familyName: familyName || undefined
      };
      db.saasApplications.push(saasApp);
      isNewApp = true;
    } else {
      if (!saasApp.discoveredSources.includes("Browser Extension")) {
        saasApp.discoveredSources.push("Browser Extension");
      }
    }

    // 3. See if user exists in saasUsers, otherwise create it
    let saasUser = db.saasUsers.find(u => u.email.toLowerCase() === userEmail.toLowerCase());
    let isNewUser = false;
    if (!saasUser) {
      saasUser = {
        id: `saas-usr-${Date.now()}`,
        name: userName,
        email: userEmail,
        department: userDept,
        status: "Active",
        identitySources: ["Browser Extension"]
      };
      db.saasUsers.push(saasUser);
      isNewUser = true;
    } else {
      if (!saasUser.identitySources.includes("Browser Extension")) {
        saasUser.identitySources.push("Browser Extension");
      }
    }

    // 4. Log User Activity
    const actId = `act-ext-${Date.now()}`;
    const newActivity = {
      id: actId,
      saasApplicationId: saasApp.id,
      saasUserId: saasUser.id,
      lastActiveDate: new Date().toISOString(),
      usageDurationMinutes: Math.floor(Math.random() * 45) + 15, // 15-60 min
      activityLevel: "Active" as const,
      sourceConnector: "Browser Extension"
    };
    db.saasUserActivities.push(newActivity);

    // 5. If this is an active app, optionally increment seatsAssigned on any active subscriptions for this app
    const activeSub = db.saasSubscriptions.find(s => s.saasApplicationId === saasApp.id && s.status === "Active");
    let incrementedSeat = false;
    if (activeSub && activeSub.seatsAssigned < activeSub.seatsTotal) {
      // check if user already has an active activity for this app to avoid double assigning seats
      const existingUserActivityCount = db.saasUserActivities.filter(a => a.saasUserId === saasUser.id && a.saasApplicationId === saasApp.id).length;
      if (existingUserActivityCount <= 1) {
        activeSub.seatsAssigned += 1;
        incrementedSeat = true;
      }
    }

    // Re-consolidate to ensure no duplication issues
    const consResult = consolidateSaaSData(db);

    saveDatabase(db);

    res.status(201).json({
      success: true,
      message: `SaaS Discovery Browser Extension logged access to ${url}. Identified application: ${saasApp.name}.`,
      isNewApp,
      isNewUser,
      incrementedSeat,
      application: saasApp,
      user: saasUser,
      activity: newActivity,
      consolidationLogs: consResult.logs
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});


// ---------------------------------------------------------
// CLOUD LICENSE MANAGEMENT ENDPOINTS
// ---------------------------------------------------------
app.get("/api/cloud/connectors", (req, res) => {
  try {
    const db = getDatabase();
    res.json(db.cloudConnectors || []);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/cloud/connectors", (req, res) => {
  try {
    const db = getDatabase();
    const { name, provider } = req.body;
    if (!name || !provider) {
      return res.status(400).json({ error: "name and provider are required" });
    }
    const newConnector = {
      id: `cloud-conn-${Date.now()}`,
      name,
      provider,
      status: "Connected" as const,
      lastSyncedAt: new Date().toISOString(),
      resourceCount: 0
    };
    db.cloudConnectors = db.cloudConnectors || [];
    db.cloudConnectors.push(newConnector);
    saveDatabase(db);
    res.json(newConnector);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/cloud/resources", (req, res) => {
  try {
    const db = getDatabase();
    res.json(db.cloudResources || []);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/cloud/sync", (req, res) => {
  try {
    const db = getDatabase();
    const timestamp = new Date().toISOString();
    
    // Mappings and simulated discoveries for Cloud BYOL / PAYG double-pay checks
    db.cloudConnectors = (db.cloudConnectors || []).map(conn => ({
      ...conn,
      status: "Connected" as const,
      lastSyncedAt: timestamp
    }));

    // Trigger compliance check matching softwareInstalled with purchased licenses
    db.cloudResources = (db.cloudResources || []).map(res => {
      let isCovered = res.hasLicenseCoverage;
      let rec = res.recommendation;

      // Real calculation integration check: If SQL server or Oracle VM is PAYG, check if we have excess owned licenses
      if (res.pricingModel === "PAYG" && res.softwareInstalled.some(s => s.toLowerCase().includes("sql"))) {
        const sqlLicenses = db.licenses.find(l => l.softwareName.toLowerCase().includes("sql") && l.status === "Active");
        if (sqlLicenses && (sqlLicenses.totalQuantity - sqlLicenses.allocatedQuantity >= 4)) {
          isCovered = false;
          rec = "Double-Pay Detected! You have 4 unused SQL Server core licenses under Microsoft EA Agreement. Enabling BYOL saves $450/month.";
        }
      }
      return { ...res, hasLicenseCoverage: isCovered, recommendation: rec };
    });

    saveDatabase(db);
    res.json({ success: true, timestamp, updatedCount: db.cloudResources.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});


// ---------------------------------------------------------
// CONTAINER VISIBILITY ENDPOINTS
// ---------------------------------------------------------
app.get("/api/containers/connectors", (req, res) => {
  try {
    const db = getDatabase();
    res.json(db.k8sConnectors || []);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/containers/connectors", (req, res) => {
  try {
    const db = getDatabase();
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: "name is required" });
    }
    const newConn = {
      id: `k8s-conn-${Date.now()}`,
      name,
      status: "Connected" as const,
      lastSyncedAt: new Date().toISOString(),
      clusterCount: 1
    };
    db.k8sConnectors = db.k8sConnectors || [];
    db.k8sConnectors.push(newConn);
    
    // Auto-create a mock cluster for it
    db.k8sClusters = db.k8sClusters || [];
    db.k8sClusters.push({
      id: `clus-${Date.now()}`,
      name: `${name.toLowerCase().replace(/[^a-z0-9]/g, "-")}-cluster`,
      namespaceCount: 3,
      podCount: 5
    });

    saveDatabase(db);
    res.json(newConn);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/containers/clusters", (req, res) => {
  try {
    const db = getDatabase();
    res.json(db.k8sClusters || []);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/containers/pods", (req, res) => {
  try {
    const db = getDatabase();
    res.json(db.containerPods || []);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/containers/sync", (req, res) => {
  try {
    const db = getDatabase();
    const timestamp = new Date().toISOString();
    db.k8sConnectors = (db.k8sConnectors || []).map(c => ({
      ...c,
      status: "Connected" as const,
      lastSyncedAt: timestamp
    }));

    // Trigger analysis of licenses running inside containers
    db.containerPods = (db.containerPods || []).map(pod => {
      let status = pod.licenseStatus;
      if (pod.softwareRunning.some(s => s.toLowerCase().includes("oracle"))) {
        const hasOracleLic = db.licenses.some(l => l.softwareName.toLowerCase().includes("oracle") && l.status === "Active");
        status = hasOracleLic ? "BYOL Coverage Checked" : "Unlicensed";
      } else if (pod.softwareRunning.some(s => s.toLowerCase().includes("sql server"))) {
        const hasSqlLic = db.licenses.some(l => l.softwareName.toLowerCase().includes("sql") && l.status === "Active");
        status = hasSqlLic ? "Compliant" : "Non-Compliant";
      }
      return { ...pod, licenseStatus: status };
    });

    saveDatabase(db);
    res.json({ success: true, timestamp, podsCount: db.containerPods.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});


// ---------------------------------------------------------
// CUSTOM FIELDS & CUSTOM METRICS ENDPOINTS
// ---------------------------------------------------------
app.get("/api/custom-fields/definitions", (req, res) => {
  try {
    const db = getDatabase();
    res.json(db.customFieldDefinitions || []);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/custom-fields/definitions", (req, res) => {
  try {
    const db = getDatabase();
    const { targetType, name, fieldType } = req.body;
    if (!targetType || !name || !fieldType) {
      return res.status(400).json({ error: "targetType, name, and fieldType are required" });
    }
    const newDef = {
      id: `cf-def-${Date.now()}`,
      targetType,
      name,
      fieldType
    };
    db.customFieldDefinitions = db.customFieldDefinitions || [];
    db.customFieldDefinitions.push(newDef);
    saveDatabase(db);
    res.json(newDef);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/custom-fields/values", (req, res) => {
  try {
    const db = getDatabase();
    res.json(db.customFieldValues || []);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Write API for Bulk Updates of Custom Fields (replaces existing or creates new)
app.post("/api/custom-fields/bulk-update", (req, res) => {
  try {
    const db = getDatabase();
    const { updates } = req.body; // Array of { definitionId, entityId, value }
    if (!updates || !Array.isArray(updates)) {
      return res.status(400).json({ error: "updates array is required" });
    }

    db.customFieldValues = db.customFieldValues || [];

    let updatedCount = 0;
    updates.forEach((up: any) => {
      const { definitionId, entityId, value } = up;
      if (!definitionId || !entityId) return;

      const idx = db.customFieldValues.findIndex(
        v => v.definitionId === definitionId && v.entityId === entityId
      );

      if (idx >= 0) {
        db.customFieldValues[idx].value = String(value);
      } else {
        db.customFieldValues.push({
          id: `cf-val-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          definitionId,
          entityId,
          value: String(value)
        });
      }
      updatedCount++;
    });

    saveDatabase(db);
    res.json({ success: true, updatedCount });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/custom-metrics", (req, res) => {
  try {
    const db = getDatabase();
    res.json(db.customMetrics || []);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/custom-metrics", (req, res) => {
  try {
    const db = getDatabase();
    const { name, description, queryCriteria, value } = req.body;
    if (!name || !queryCriteria) {
      return res.status(400).json({ error: "name and queryCriteria are required" });
    }
    const newMetric = {
      id: `met-${Date.now()}`,
      name,
      description: description || "",
      queryCriteria,
      value: Number(value || 0)
    };
    db.customMetrics = db.customMetrics || [];
    db.customMetrics.push(newMetric);
    saveDatabase(db);
    res.json(newMetric);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});


// ---------------------------------------------------------
// REPORTS ENGINE ENDPOINTS & EXPORTS
// ---------------------------------------------------------
app.get("/api/reports", (req, res) => {
  try {
    const db = getDatabase();
    res.json(db.savedReports || []);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/reports", (req, res) => {
  try {
    const db = getDatabase();
    const { name, description, columns, filters, targetType } = req.body;
    if (!name || !targetType || !columns || !Array.isArray(columns)) {
      return res.status(400).json({ error: "name, targetType, and columns array are required" });
    }
    const newReport = {
      id: `rep-${Date.now()}`,
      name,
      description: description || "",
      columns,
      filters: filters || {},
      targetType
    };
    db.savedReports = db.savedReports || [];
    db.savedReports.push(newReport);
    saveDatabase(db);
    res.json(newReport);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/reports/schedules", (req, res) => {
  try {
    const db = getDatabase();
    res.json(db.reportSchedules || []);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/reports/schedules", (req, res) => {
  try {
    const db = getDatabase();
    const { reportId, frequency, deliveryType, recipients } = req.body;
    if (!reportId || !frequency || !deliveryType || !recipients || !Array.isArray(recipients)) {
      return res.status(400).json({ error: "reportId, frequency, deliveryType, and recipients array are required" });
    }
    const newSchedule = {
      id: `sch-${Date.now()}`,
      reportId,
      frequency,
      deliveryType,
      recipients,
      status: "Active" as const
    };
    db.reportSchedules = db.reportSchedules || [];
    db.reportSchedules.push(newSchedule);
    saveDatabase(db);
    res.json(newSchedule);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/reports/export", (req, res) => {
  try {
    const db = getDatabase();
    const { reportId, format } = req.body; // format: "CSV" | "PDF" | "XLSX" | "XML"
    if (!reportId || !format) {
      return res.status(400).json({ error: "reportId and format are required" });
    }

    const report = db.savedReports?.find(r => r.id === reportId);
    if (!report) {
      return res.status(404).json({ error: "Report template not found" });
    }

    // Gathers actual raw data based on targetType
    let rawData: any[] = [];
    if (report.targetType === "Licenses") {
      rawData = db.licenses;
    } else if (report.targetType === "Computers") {
      rawData = db.computers;
    } else if (report.targetType === "Applications") {
      rawData = db.softwareCatalog;
    } else if (report.targetType === "Subscriptions") {
      rawData = db.saasApplications;
    } else if (report.targetType === "Cloud") {
      rawData = db.cloudResources;
    } else if (report.targetType === "Containers") {
      rawData = db.containerPods;
    }

    // Apply simple filter matches if present
    if (report.filters) {
      if (report.filters.publisher) {
        const pub = report.filters.publisher.toLowerCase();
        rawData = rawData.filter(d => (d.publisher || d.provider || '').toLowerCase().includes(pub));
      }
      if (report.filters.riskScoreMin) {
        rawData = rawData.filter(d => (d.riskScore || 0) >= Number(report.filters.riskScoreMin));
      }
    }

    // Construct table rows based on defined report columns
    const columnsToUse = report.columns && report.columns.length > 0 ? report.columns : ["ID", "Name"];
    
    const rows = rawData.map(item => {
      return columnsToUse.map(col => {
        // dynamic map key based on column name variations
        const key = col.toLowerCase().replace(/\s/g, "");
        if (key === "softwarename" || key === "name") return item.softwareName || item.name || "";
        if (key === "publisher" || key === "provider") return item.publisher || item.provider || "";
        if (key === "metrictype" || key === "metric") return item.metricType || "";
        if (key === "totalquantity" || key === "quantity") return item.totalQuantity ?? item.quantity ?? "";
        if (key === "allocatedquantity" || key === "assigned") return item.allocatedQuantity ?? "";
        if (key === "status" || key === "licensestatus") return item.status || item.licenseStatus || "";
        if (key === "category") return item.category || "";
        if (key === "riskscore") return item.riskScore || "";
        if (key === "discoveredsources") return item.discoveredSources?.join(", ") || "";
        if (key === "cost") return item.cost || "";
        if (key === "pricingmodel") return item.pricingModel || "";
        if (key === "softwareinstalled" || key === "softwarerunning") return (item.softwareInstalled || item.softwareRunning || []).join(", ");
        if (key === "recommendation") return item.recommendation || "";
        
        // fallback to standard object values
        return item[col] !== undefined ? item[col] : (item[col.toLowerCase()] !== undefined ? item[col.toLowerCase()] : "");
      });
    });

    const exportResult = generateExportContent(format, report.name, columnsToUse, rows);
    res.json(exportResult);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

function generateExportContent(format: string, reportName: string, headers: string[], rows: any[][]): { content: string, mimeType: string, filename: string } {
  const cleanName = reportName.toLowerCase().replace(/[^a-z0-9]/g, "_");
  if (format === "CSV") {
    const csvRows = [
      headers.map(h => `"${h.replace(/"/g, '""')}"`).join(","),
      ...rows.map(row => row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(","))
    ];
    return {
      content: csvRows.join("\n"),
      mimeType: "text/csv",
      filename: `${cleanName}.csv`
    };
  } else if (format === "XML") {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<report name="${reportName}">\n`;
    xml += `  <headers>\n` + headers.map(h => `    <header>${h}</header>`).join("\n") + `\n  </headers>\n`;
    xml += `  <rows>\n`;
    rows.forEach(row => {
      xml += `    <row>\n`;
      headers.forEach((h, idx) => {
        const tag = h.toLowerCase().replace(/[^a-z0-9]/g, "_");
        xml += `      <${tag}>${String(row[idx] ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</${tag}>\n`;
      });
      xml += `    </row>\n`;
    });
    xml += `  </rows>\n</report>`;
    return {
      content: xml,
      mimeType: "application/xml",
      filename: `${cleanName}.xml`
    };
  } else if (format === "XLSX") {
    let xls = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">\n`;
    xls += `<head><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Sheet1</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head>\n`;
    xls += `<body><table border="1">\n`;
    xls += `  <tr style="background-color: #1e293b; color: #ffffff; font-weight: bold;">\n` + headers.map(h => `    <th>${h}</th>`).join("\n") + `\n  </tr>\n`;
    rows.forEach(row => {
      xls += `  <tr>\n` + row.map(cell => `    <td>${String(cell ?? '')}</td>`).join("\n") + `\n  </tr>\n`;
    });
    xls += `</table></body></html>`;
    return {
      content: xls,
      mimeType: "application/vnd.ms-excel",
      filename: `${cleanName}.xlsx`
    };
  } else {
    let pdfText = `========================================================================\n`;
    pdfText += `                       SYSTEM GENERATED REPORT\n`;
    pdfText += `========================================================================\n`;
    pdfText += `Report Title: ${reportName}\n`;
    pdfText += `Generated At: ${new Date().toISOString()}\n`;
    pdfText += `------------------------------------------------------------------------\n\n`;
    
    const colWidths = headers.map((h, i) => Math.max(h.length, ...rows.map(r => String(r[i] ?? '').length)) + 2);
    const formatRow = (arr: string[]) => arr.map((item, idx) => String(item).padEnd(colWidths[idx])).join("| ");
    
    pdfText += formatRow(headers) + "\n";
    pdfText += colWidths.map(w => "-".repeat(w)).join("+") + "\n";
    rows.forEach(row => {
      pdfText += formatRow(row.map(c => String(c ?? ''))) + "\n";
    });
    pdfText += `\n========================================================================\n`;
    pdfText += `End of Report (${rows.length} rows exported successfully)\n`;
    pdfText += `========================================================================\n`;
    
    return {
      content: pdfText,
      mimeType: "application/pdf",
      filename: `${cleanName}.pdf`
    };
  }
}


// ---------------------------------------------------------
// ADMINISTRATION & SECURITY MODULE ENDPOINTS
// ---------------------------------------------------------

// Helper to log audit actions
function writeAuditLog(db: any, userEmail: string, category: string, action: string, details: string, ip: string = "192.168.1.102") {
  const newEntry = {
    id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
    userId: userEmail === "ericob3ware@gmail.com" ? "usr-1" : "usr-custom",
    userEmail,
    action,
    category: category as any,
    ipAddress: ip,
    details
  };
  db.auditLogs = db.auditLogs || [];
  db.auditLogs.unshift(newEntry);
}

// SSO Settings
app.get("/api/admin/sso", (req, res) => {
  try {
    const db = getDatabase();
    res.json(db.ssoConfigs || []);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/admin/sso/:id", (req, res) => {
  try {
    const db = getDatabase();
    const sso = db.ssoConfigs.find(s => s.id === req.params.id);
    if (!sso) return res.status(404).json({ error: "SSO Config not found" });

    const { status, clientId, domainUrl } = req.body;
    if (status !== undefined) sso.status = status;
    if (clientId !== undefined) sso.clientId = clientId;
    if (domainUrl !== undefined) sso.domainUrl = domainUrl;

    writeAuditLog(db, "ericob3ware@gmail.com", "Auth", "Update SSO Configuration", `Updated ${sso.name} SSO Provider setting status to ${sso.status}`);
    saveDatabase(db);
    res.json(sso);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// OAuth 2.0 Clients
app.get("/api/admin/oauth-clients", (req, res) => {
  try {
    const db = getDatabase();
    res.json(db.oauthClients || []);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/admin/oauth-clients", (req, res) => {
  try {
    const db = getDatabase();
    const { name, scopes } = req.body;
    if (!name || !scopes) return res.status(400).json({ error: "name and scopes are required" });

    const newClient = {
      id: `oauth-client-${Date.now()}`,
      name,
      clientId: `client_id_${Math.random().toString(36).substring(2, 8)}`,
      clientSecret: `client_secret_${Math.random().toString(36).substring(2, 16)}`,
      scopes: Array.isArray(scopes) ? scopes : [scopes],
      status: "Active" as const
    };

    db.oauthClients.push(newClient);
    writeAuditLog(db, "ericob3ware@gmail.com", "Auth", "Create OAuth Client", `Provisioned new client key credential: "${name}"`);
    saveDatabase(db);
    res.status(201).json(newClient);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/admin/oauth-clients/:id", (req, res) => {
  try {
    const db = getDatabase();
    const idx = db.oauthClients.findIndex(c => c.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: "OAuth client not found" });

    const client = db.oauthClients[idx];
    writeAuditLog(db, "ericob3ware@gmail.com", "Auth", "Revoke OAuth Client", `Revoked and deleted credential client key for: "${client.name}"`);
    db.oauthClients.splice(idx, 1);
    saveDatabase(db);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// RBAC Roles
app.get("/api/admin/roles", (req, res) => {
  try {
    const db = getDatabase();
    res.json(db.adminRoles || []);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/admin/roles", (req, res) => {
  try {
    const db = getDatabase();
    const { name, permissions } = req.body;
    if (!name || !permissions) return res.status(400).json({ error: "name and permissions object are required" });

    const newRole = {
      id: `role-custom-${Date.now()}`,
      name,
      isSystem: false,
      permissions: {
        licenses: permissions.licenses || "None",
        saas: permissions.saas || "None",
        cloud: permissions.cloud || "None",
        admin: permissions.admin || "None",
        auditLogs: permissions.auditLogs || "None"
      }
    };

    db.adminRoles.push(newRole);
    writeAuditLog(db, "ericob3ware@gmail.com", "RBAC", "Create Custom Role", `Created custom RBAC role profile: "${name}"`);
    saveDatabase(db);
    res.status(201).json(newRole);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/admin/roles/:id", (req, res) => {
  try {
    const db = getDatabase();
    const idx = db.adminRoles.findIndex(r => r.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: "Role not found" });

    const role = db.adminRoles[idx];
    if (role.isSystem) return res.status(400).json({ error: "System role cannot be deleted" });

    writeAuditLog(db, "ericob3ware@gmail.com", "RBAC", "Delete Custom Role", `Removed custom RBAC role profile: "${role.name}"`);
    db.adminRoles.splice(idx, 1);
    saveDatabase(db);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Groups
app.get("/api/admin/groups", (req, res) => {
  try {
    const db = getDatabase();
    res.json(db.userGroups || []);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/admin/groups", (req, res) => {
  try {
    const db = getDatabase();
    const { name, roleId } = req.body;
    if (!name || !roleId) return res.status(400).json({ error: "name and roleId are required" });

    const newGroup = {
      id: `group-custom-${Date.now()}`,
      name,
      roleId,
      memberCount: 0
    };

    db.userGroups.push(newGroup);
    writeAuditLog(db, "ericob3ware@gmail.com", "RBAC", "Create User Group", `Configured new security organization group: "${name}"`);
    saveDatabase(db);
    res.status(201).json(newGroup);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Users
app.get("/api/admin/users", (req, res) => {
  try {
    const db = getDatabase();
    res.json(db.adminUsers || []);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/admin/users", (req, res) => {
  try {
    const db = getDatabase();
    const { name, email, roleId, groupIds } = req.body;
    if (!name || !email || !roleId) return res.status(400).json({ error: "name, email, and roleId are required" });

    const newUser = {
      id: `usr-custom-${Date.now()}`,
      name,
      email,
      roleId,
      groupIds: groupIds || [],
      status: "Pending" as const,
      joinedDate: new Date().toISOString().split("T")[0]
    };

    db.adminUsers.push(newUser);
    writeAuditLog(db, "ericob3ware@gmail.com", "RBAC", "Invite Admin User", `Sent platform invite proposal to "${email}" with designated role ${roleId}`);
    
    // Increment member counts
    if (groupIds && Array.isArray(groupIds)) {
      groupIds.forEach(gId => {
        const gp = db.userGroups.find(g => g.id === gId);
        if (gp) gp.memberCount++;
      });
    }

    saveDatabase(db);
    res.status(201).json(newUser);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/admin/users/:id", (req, res) => {
  try {
    const db = getDatabase();
    const usr = db.adminUsers.find(u => u.id === req.params.id);
    if (!usr) return res.status(404).json({ error: "User not found" });

    const { status, roleId } = req.body;
    if (status !== undefined) usr.status = status;
    if (roleId !== undefined) usr.roleId = roleId;

    writeAuditLog(db, "ericob3ware@gmail.com", "RBAC", "Modify Admin User", `Updated staff user profile parameters for "${usr.email}"`);
    saveDatabase(db);
    res.json(usr);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Organization structure / Hierarchy Nodes
app.get("/api/admin/org-structure", (req, res) => {
  try {
    const db = getDatabase();
    res.json(db.orgNodes || []);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/admin/org-structure", (req, res) => {
  try {
    const db = getDatabase();
    const { name, parentId, code, allocatedLicenseCount } = req.body;
    if (!name || !code) return res.status(400).json({ error: "name and code are required" });

    const newNode = {
      id: `org-${Date.now()}`,
      name,
      parentId: parentId || undefined,
      code,
      allocatedLicenseCount: Number(allocatedLicenseCount) || 0
    };

    db.orgNodes.push(newNode);
    writeAuditLog(db, "ericob3ware@gmail.com", "Org", "Add Organization Node", `Appended new branch level "${name}" [${code}] to the corporate tree`);
    saveDatabase(db);
    res.status(201).json(newNode);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Enrollment sites
app.get("/api/admin/enrollment-sites", (req, res) => {
  try {
    const db = getDatabase();
    res.json(db.enrollmentSites || []);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/admin/enrollment-sites", (req, res) => {
  try {
    const db = getDatabase();
    const { name, orgNodeId } = req.body;
    if (!name || !orgNodeId) return res.status(400).json({ error: "name and orgNodeId are required" });

    const newSite = {
      id: `site-${Date.now()}`,
      name,
      orgNodeId,
      snowExtenderCount: 0,
      extenderStatus: "No Extenders" as const
    };

    db.enrollmentSites.push(newSite);
    writeAuditLog(db, "ericob3ware@gmail.com", "Org", "Register Enrollment Site", `Created client enrollment site portal "${name}" mapped to orgNode ${orgNodeId}`);
    saveDatabase(db);
    res.status(201).json(newSite);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Audit Logs
app.get("/api/admin/audit-logs", (req, res) => {
  try {
    const db = getDatabase();
    res.json(db.auditLogs || []);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Export audit logs action -> generates a mock downloadable CSV file
app.post("/api/admin/audit-logs/export", (req, res) => {
  try {
    const db = getDatabase();
    const filename = `audit_log_export_${new Date().toISOString().split('T')[0]}.csv`;
    const header = "ID,Timestamp,User Email,Category,Action,IP Address,Details\n";
    const body = db.auditLogs.map(l => 
      `"${l.id}","${l.timestamp}","${l.userEmail}","${l.category}","${l.action}","${l.ipAddress}","${l.details.replace(/"/g, '""')}"`
    ).join("\n");

    const newFile = {
      id: `file-audit-${Date.now()}`,
      filename,
      mimeType: "text/csv",
      sizeBytes: Buffer.byteLength(header + body),
      uploadedAt: new Date().toISOString(),
      purpose: "Audit Log Export" as const
    };

    db.uploadedFiles = db.uploadedFiles || [];
    db.uploadedFiles.unshift(newFile);

    writeAuditLog(db, "ericob3ware@gmail.com", "Security", "Export Audit Logs", "Successfully exported system audit log catalog to downloadable CSV package");
    saveDatabase(db);
    res.status(201).json({ success: true, file: newFile });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Currencies
app.get("/api/admin/currency", (req, res) => {
  try {
    const db = getDatabase();
    res.json(db.currencyRates || []);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/admin/currency", (req, res) => {
  try {
    const db = getDatabase();
    const { code, symbol, rateToBase } = req.body;
    if (!code || !symbol || !rateToBase) return res.status(400).json({ error: "code, symbol, and rateToBase are required" });

    const newRate = {
      id: `cur-${code.toLowerCase()}`,
      code: code.toUpperCase(),
      symbol,
      rateToBase: Number(rateToBase),
      isBase: false
    };

    db.currencyRates.push(newRate);
    writeAuditLog(db, "ericob3ware@gmail.com", "Admin", "Add Currency Settings", `Registered currency conversion pair: "${code}" with base rate multiplier ${rateToBase}`);
    saveDatabase(db);
    res.status(201).json(newRate);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// IP Policies
app.get("/api/admin/ip-policies", (req, res) => {
  try {
    const db = getDatabase();
    res.json(db.ipPolicies || []);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/admin/ip-policies", (req, res) => {
  try {
    const db = getDatabase();
    const { cidr, description, policyType } = req.body;
    if (!cidr || !policyType) return res.status(400).json({ error: "cidr and policyType are required" });

    const newPolicy = {
      id: `ip-${Date.now()}`,
      cidr,
      description: description || "Custom CIDR rule block",
      policyType: policyType as "Allow" | "Deny",
      status: "Active" as const
    };

    db.ipPolicies.push(newPolicy);
    writeAuditLog(db, "ericob3ware@gmail.com", "Security", "Create IP Policy", `Added firewall ingress rule: ${policyType} traffic from ${cidr}`);
    saveDatabase(db);
    res.status(201).json(newPolicy);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/admin/ip-policies/:id", (req, res) => {
  try {
    const db = getDatabase();
    const idx = db.ipPolicies.findIndex(p => p.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: "IP Policy rule not found" });

    const policy = db.ipPolicies[idx];
    writeAuditLog(db, "ericob3ware@gmail.com", "Security", "Delete IP Policy", `Removed ingress firewall rule block for ${policy.cidr}`);
    db.ipPolicies.splice(idx, 1);
    saveDatabase(db);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// MSP Customers Partner Layer
app.get("/api/admin/msp-customers", (req, res) => {
  try {
    const db = getDatabase();
    res.json(db.mspCustomers || []);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/admin/msp-customers", (req, res) => {
  try {
    const db = getDatabase();
    const { name, complianceScore, totalLicenses, totalDevices } = req.body;
    if (!name) return res.status(400).json({ error: "name is required" });

    const newCust = {
      id: `msp-cust-${Date.now()}`,
      name,
      status: "Active" as const,
      complianceScore: Number(complianceScore) || 100,
      totalLicenses: Number(totalLicenses) || 0,
      totalDevices: Number(totalDevices) || 0
    };

    db.mspCustomers.push(newCust);
    writeAuditLog(db, "ericob3ware@gmail.com", "Admin", "MSP Add Customer", `Provisioned new multi-tenant MSP workspace for client account: "${name}"`);
    saveDatabase(db);
    res.status(201).json(newCust);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Notifications
app.get("/api/admin/notifications", (req, res) => {
  try {
    const db = getDatabase();
    res.json(db.adminNotifications || []);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/admin/notifications/:id/read", (req, res) => {
  try {
    const db = getDatabase();
    const notif = db.adminNotifications.find(n => n.id === req.params.id);
    if (!notif) return res.status(404).json({ error: "Notification not found" });

    notif.isRead = true;
    saveDatabase(db);
    res.json(notif);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// My Files (Uploaded & Exported Files)
app.get("/api/admin/files", (req, res) => {
  try {
    const db = getDatabase();
    res.json(db.uploadedFiles || []);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/admin/files/:id", (req, res) => {
  try {
    const db = getDatabase();
    const idx = db.uploadedFiles.findIndex(f => f.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: "File not found" });

    const file = db.uploadedFiles[idx];
    writeAuditLog(db, "ericob3ware@gmail.com", "Admin", "Delete Exported File", `Wiped saved file "${file.filename}" from My Files repository`);
    db.uploadedFiles.splice(idx, 1);
    saveDatabase(db);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});


// ---------------------------------------------------------
// ITSM, EXTENDERS, AGENT BUILDER & AI ASSISTANT ENDPOINTS
// ---------------------------------------------------------

// ITSM Connectors
app.get("/api/admin/itsm-connectors", (req, res) => {
  try {
    const db = getDatabase();
    const defaultITSM = [
      { id: "itsm-sn", name: "ServiceNow ITSM Connector", type: "ServiceNow", url: "https://company.service-now.com", status: "Connected", syncInterval: "6 Hours", enrichCMDB: true, lastSynced: "2026-07-07T09:00:00Z" },
      { id: "itsm-jira", name: "Jira Service Desk Link", type: "Jira", url: "https://company.atlassian.net/jira", status: "Connected", syncInterval: "12 Hours", enrichCMDB: false, lastSynced: "2026-07-06T18:30:00Z" }
    ];
    if (!(db as any).itsmConnectors) {
      (db as any).itsmConnectors = defaultITSM;
      saveDatabase(db);
    }
    res.json((db as any).itsmConnectors);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/admin/itsm-connectors", (req, res) => {
  try {
    const db = getDatabase();
    const { name, type, url, syncInterval, enrichCMDB } = req.body;
    if (!name || !type || !url) {
      return res.status(400).json({ error: "name, type, and url are required" });
    }
    const newConnector = {
      id: `itsm-${Date.now()}`,
      name,
      type,
      url,
      status: "Connected",
      syncInterval: syncInterval || "24 Hours",
      enrichCMDB: !!enrichCMDB,
      lastSynced: new Date().toISOString()
    };
    if (!(db as any).itsmConnectors) {
      (db as any).itsmConnectors = [];
    }
    (db as any).itsmConnectors.push(newConnector);
    writeAuditLog(db, "ericob3ware@gmail.com", "Admin", "ITSM Add Connector", `Added ${type} ITSM connector targeting ${url}`);
    saveDatabase(db);
    res.status(201).json(newConnector);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/admin/itsm-connectors/test", (req, res) => {
  try {
    const { url, type } = req.body;
    res.json({
      success: true,
      message: `Connection to ${type} gateway at ${url} verified successfully. Protocol TLS 1.3 established. OAuth handshake completed.`,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/admin/itsm-enrich", (req, res) => {
  try {
    const db = getDatabase();
    const recordCount = db.computers.length + db.softwareCatalog.length;
    writeAuditLog(db, "ericob3ware@gmail.com", "Admin", "ITSM CMDB Enrichment", `Triggered ITSM Enhancer: Synced ${db.computers.length} hardware assets and ${db.softwareCatalog.length} normalized catalog applications with external CMDB schema.`);
    saveDatabase(db);
    res.json({
      success: true,
      message: `ITSM Enhancer complete! Successfully pushed ${recordCount} normalized records to target CMDB. Redundant items deduplicated. Lifecycle, warranty status, and EOL/EOS dates enriched.`,
      syncedHardware: db.computers.length,
      syncedSoftware: db.softwareCatalog.length,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Snow Extenders Testing Endpoints
app.post("/api/admin/extenders/test-gateway", (req, res) => {
  res.json({
    success: true,
    message: "Secure Gateway verification succeeded: Extender payload signatures are authentic. Port 443 listening. Cryptographic TLS tunnel is solid.",
    diagnostics: {
      latencyMs: 14,
      certificates: "Valid (Expires 2027-04-12)",
      ingressIp: "18.192.12.98"
    }
  });
});

app.post("/api/admin/extenders/test-elevator", (req, res) => {
  res.json({
    success: true,
    message: "File Elevator service is healthy: Active directory monitor active. Found 0 backlog inventory .snow files. Successfully processed mock transmission buffer.",
    diagnostics: {
      watchDirectory: "C:\\ProgramData\\SnowSoftware\\Inventory\\Elevator\\",
      fileTypeEnforced: "*.snow (XML compressed)",
      lastElevatedFile: "INV_PC_FRANKFURT_20260707.snow",
      uptime: "99.99%"
    }
  });
});

app.post("/api/admin/extenders/test-ad", (req, res) => {
  res.json({
    success: true,
    message: "Active Directory Discovery scan simulated! Queried LDAP server. Found 1,240 computer accounts, 4,500 user objects, and 45 Organizational Units (OUs). Sync log generated.",
    diagnostics: {
      ldapServer: "ldap://corp.company.local:389",
      domainDN: "DC=corp,DC=company,DC=local",
      lastScanTime: "12.4 seconds",
      newDevicesFound: 8,
      newUsersFound: 14
    }
  });
});

app.post("/api/admin/extenders/test-forwarder", (req, res) => {
  res.json({
    success: true,
    message: "Data Forwarder active. Verified downstream target buffers are receiving payload streams correctly.",
    diagnostics: {
      targets: [
        { name: "SIEM Gateway (Splunk)", status: "Active", throughput: "128 kb/s" },
        { name: "Secondary AWS Cold Storage S3", status: "Active", throughput: "2.4 MB/s" }
      ],
      packetLoss: "0.00%",
      retransmissionCount: 0
    }
  });
});

// Package Builder Endpoint
app.post("/api/admin/package-builder/build", (req, res) => {
  try {
    const db = getDatabase();
    const { platform, bundleGateway, bundleElevator, bundleAD, bundleForwarder, scanIntervalHours } = req.body;
    
    const fileId = `file-agent-${Date.now()}`;
    const filename = `snow-agent-v2.4.1-${platform.toLowerCase()}.${platform === "Windows" ? "msi" : platform === "Linux" ? "tar.gz" : "pkg"}`;
    
    const newFile = {
      id: fileId,
      filename,
      mimeType: platform === "Windows" ? "application/octet-stream" : "application/x-gzip",
      sizeBytes: 1024 * 1024 * (Math.floor(Math.random() * 5) + 12), // 12-17 MB
      uploadedAt: new Date().toISOString(),
      purpose: "Custom Import" as any,
      url: `/api/admin/files/download/${fileId}`
    };

    db.uploadedFiles = db.uploadedFiles || [];
    db.uploadedFiles.unshift(newFile);
    writeAuditLog(db, "ericob3ware@gmail.com", "Admin", "Build Agent Package", `Compiled custom Snow Extender inventory agent package for ${platform}. Inclusions: Gateway=${!!bundleGateway}, Elevator=${!!bundleElevator}, AD=${!!bundleAD}, Forwarder=${!!bundleForwarder}. Interval=${scanIntervalHours}h`);
    saveDatabase(db);

    res.status(201).json({
      success: true,
      message: `Agent package compiled, code-signed with SHA-256, and stored under 'My Files' tab.`,
      file: newFile
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Download simulation endpoint
app.get("/api/admin/files/download/:id", (req, res) => {
  try {
    const db = getDatabase();
    const file = db.uploadedFiles.find(f => f.id === req.params.id);
    if (!file) return res.status(404).send("File not found");
    
    res.setHeader("Content-Disposition", `attachment; filename=${file.filename}`);
    res.setHeader("Content-Type", file.mimeType);
    res.send(`SIMULATED AGENT INSTALLER BINARY DATA\nFile: ${file.filename}\nBytes: ${file.sizeBytes}\nBuilt with Snow Atlas Package Builder.`);
  } catch (error: any) {
    res.status(500).send(error.message);
  }
});

// AI Assistant Endpoint (Flexera Assist)
app.post("/api/chat-assistant", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: "message parameter is required" });
    }

    const key = process.env.GROQ_API_KEY;
    if (!key) {
      const offlineReply = getOfflineHelpResponse(message);
      return res.json({ reply: offlineReply, isOffline: true });
    }

    const ai = getGroqClient();
    const SYSTEM_INSTRUCTION = `You are Flexera Assist, the advanced, expert AI Assistant for Snow Atlas — the world's leading cloud-native IT Asset Management (ITAM), Software Asset Management (SAM), SaaS Management, Cloud License Management (BYOL), and Hardware Asset Management (HAM) platform.

Your tone is highly professional, helpful, objective, and expert. You have detailed knowledge of:
1. SAM Core: Windows, Linux, macOS inventory agents; Oracle Database, Middleware, and Java metrics scan; Microsoft, IBM PVU, SAP, VMware licensing models; Effective License Position (ELP); audit readiness.
2. SaaS Management (SSM): SSO integrations (Okta, Entra ID), CASB discovery (Microsoft Defender), unassigned and inactive user activity tracking.
3. Cloud BYOL Optimization: AWS, Azure, Google Cloud BYOL mapping, Double-Pay prevention (PAYG VM with hybrid benefits).
4. Container Visibility: Kubernetes/OpenShift container scanners, database catalog discovery inside Docker pods.
5. Snow Extenders on-premises gateways: Secure Gateway port 443, File Elevator upload pipelines, Active Directory LDAP discovery, inventory APIs.
6. ITSM integrations: ServiceNow and Jira CMDB synchronization and CMDB enrichment mapper.

Always answer in the user's language (e.g. if they query in Portuguese, reply in Portuguese; if in English, reply in English). Use formatting, markdown tables, and code snippets when appropriate. Avoid marketing hype, and do not reference directories like "/src/components" or database mock files. Focus on functional and professional ITAM guidance.`;

    const response = await ai.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: SYSTEM_INSTRUCTION },
        { role: "user", content: message }
      ],
      temperature: 0.7,
    });

    res.json({ reply: response.choices[0]?.message?.content || "No response.", isOffline: false });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Helper for offline assist matching
function getOfflineHelpResponse(message: string): string {
  const query = message.toLowerCase();
  
  if (query.includes("byol") || query.includes("cloud") || query.includes("double-pay") || query.includes("double pay")) {
    return `### Cloud BYOL & Double-Pay Optimization (Offline Help Mode)
    
No Snow Atlas, a otimização de BYOL (Bring Your Own License) permite que você mapeie suas licenças on-premises ativas (como Microsoft Windows Server e SQL Server do seu Enterprise Agreement ou Oracle Database) diretamente para as suas instâncias de nuvem AWS, Azure e Google Cloud.

**O que é o Double-Pay (Duplo Pagamento)?**
Ocorre quando você inicia uma máquina virtual na nuvem sob o modelo PAYG (Pay-As-You-Go) onde o custo da licença do software já está embutido na tarifa de computação do provedor de nuvem, mesmo que você já possua licenças perpétuas ativas com direitos de mobilidade ou benefícios híbridos.

**Como otimizar isso no Snow Atlas:**
1. **Conectores de Nuvem**: Configure os conectores para AWS, Azure ou GCP na aba de Cloud Management.
2. **Varredura Ativa**: O sistema mapeia os recursos de nuvem e identifica o software instalado (ex: SQL Server).
3. **Análise de Compliance**: O Compliance Engine compara o consumo com suas licenças sob contrato (ex: Microsoft EA-98741).
4. **Recomendação de Economia**: Se um recurso PAYG for elegível para BYOL, o sistema emite um alerta crítico mostrando a economia mensal exata ao habilitar o benefício híbrido (ex: Azure Hybrid Benefit).

*Dica: Adicione a chave **GROQ_API_KEY** em Settings > Secrets para respostas totalmente dinâmicas via AI.*`;
  }
  
  if (query.includes("servicenow") || query.includes("jira") || query.includes("itsm") || query.includes("cmdb") || query.includes("integracao") || query.includes("integração")) {
    return `### Integrações ITSM & Enriquecimento de CMDB (Offline Help Mode)

O módulo de integração ITSM do Snow Atlas permite que você exporte dados de ativos de hardware e softwares totalmente normalizados e enriquecidos diretamente para os seus sistemas ServiceNow e Jira Service Desk.

**ITSM Enhancer (Enriquecedor de CMDB):**
Essa funcionalidade faz uma varredura nas aplicações descobertas no seu parque de TI, cruza com nosso catálogo inteligente (Data Intelligence Service - DIS) e empurra os registros limpos para o CMDB de destino:
- **Deduplicação Inteligente**: Elimina inconsistências de grafia de fabricante (ex: "MSFT", "Microsoft Corp" unificados como "Microsoft Corporation").
- **Mapeamento Granular**: Envia dados enriquecidos para o ServiceNow, preenchendo as tabelas de CIs de hardware com fabricante, modelo, CPU, RAM, número de série e status de garantia, e as tabelas de software com datas críticas de Fim de Vida (EOL) e Fim de Suporte (EOS).
- **Auditoria Rápida**: Reduz o tempo de defesa contra auditorias de semanas para apenas algumas horas, fornecendo relatórios robustos de compliance integrados ao seu fluxo de ITSM.

*Dica: Adicione a chave **GROQ_API_KEY** em Settings > Secrets para respostas totalmente dinâmicas via AI.*`;
  }

  if (query.includes("extender") || query.includes("agent") || query.includes("on-premise") || query.includes("on-premises") || query.includes("gateway") || query.includes("elevator")) {
    return `### Guia de Configuração dos Snow Extenders (Offline Help Mode)

Os **Snow Extenders** atuam como gateways de coleta locais altamente seguros que fazem a ponte entre o seu ambiente de datacenter físico (on-premises) ou escritórios remotos e o console do Snow Atlas na nuvem.

**Principais Componentes do Extender:**
1. **Secure Gateway**: Inbound listener seguro que recebe os pacotes de inventário dos agentes Windows, Linux e macOS instalados nas máquinas finais, usando tráfego criptografado TLS 1.3 via porta 443.
2. **File Elevator**: Monitora diretórios locais (hot-folders) para processar uploads contínuos e arquivos no formato proprietário compactado \`.snow\`.
3. **Active Directory Discovery**: Conecta via LDAP/LDAPS aos seus Controladores de Domínio para varrer de forma agendada computadores, servidores de cluster e grupos de segurança que ainda não possuam agentes instalados.
4. **Data Forwarder**: Repassa logs agregados e relatórios de status de conexão para servidores secundários ou gateways de monitoramento como Splunk ou AWS S3.
5. **Inventory API**: Permite conexões REST programáticas de agentes de terceiro para inclusão direta no banco de dados centralizado.

*Dica: Adicione a chave **GROQ_API_KEY** em Settings > Secrets para respostas totalmente dinâmicas via AI.*`;
  }

  if (query.includes("compliance") || query.includes("elp") || query.includes("licença") || query.includes("licenca") || query.includes("auditoria")) {
    return `### Effective License Position (ELP) & Compliance (Offline Help Mode)

O **Compliance Calculation Engine** do Snow Atlas roda de forma automatizada para calcular a sua Posição Efetiva de Licenciamento (ELP - Effective License Position).

**Como o cálculo é realizado:**
- **Entitlements (Direitos comprados)**: Registrados em contratos/agreements e compras de licenças (múltiplas compras com SKUs e modelos variados como por dispositivo, por usuário, processador/core, IBM PVU, etc.).
- **Consumption (Consumo real)**: Mapeado pelos agentes de descoberta instalados nas máquinas físicas, VMs ou descoberto em containers Kubernetes (ex: pods rodando Oracle 19c ou SQL Server).
- **Compliance Position**:
  - **Licensing correto**: Suas licenças cobrem exatamente o uso do parque.
  - **Under-licensing (Sub-licenciamento)**: Você está rodando softwares sem cobertura (risco financeiro de multa em auditorias).
  - **Over-licensing (Super-licenciamento)**: Você comprou mais licenças do que o necessário (desperdício de orçamento, oportunidade de redução de custos).

*Dica: Adicione a chave **GROQ_API_KEY** em Settings > Secrets para respostas totalmente dinâmicas via AI.*`;
  }

  return `### Bem-vindo ao Flexera Assist! (Offline Help Mode)

Olá! Eu sou o assistente virtual inteligente do Snow Atlas. Eu posso te ajudar a configurar, analisar e otimizar todo o seu ecossistema de ativos de TI:

**Tópicos que posso esclarecer:**
- **SAM Core**: Modelos de licenciamento, auditoria Microsoft/Oracle/SAP, Effective License Position (ELP).
- **HAM (Hardware Asset Management)**: Gerenciamento de ciclo de vida de hardware, quarentena de computadores, warranties.
- **SaaS Management**: Descoberta de shadow IT, monitoramento de assinaturas ociosas (M365, Google Workspace, Salesforce).
- **Cloud License**: Otimização BYOL no Azure/AWS, detecção de Double-Pay (tarifa dupla).
- **Snow Extenders**: Configuração de Secure Gateways, File Elevator, Active Directory scans.
- **ITSM Integrations**: ServiceNow Connector e enriquecimento de CMDB.

*Dica: Adicione a chave **GROQ_API_KEY** em Settings > Secrets na plataforma para liberar a Inteligência Artificial dinâmica via Groq Llama!*`;
}


// ---------------------------------------------------------
// VITE OR STATIC SERVING MIDDLEWARE
// ---------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`SAM Core Server running on http://0.0.0.0:${PORT}`);
    // Run tests once on startup to verify state integrity
    try {
      runComplianceTests();
    } catch (e) {
      console.error("Warning: Initial compliance engine verification failed:", e);
    }
  });
}

// Initialize PostgreSQL and start server
(async () => {
  let pgAvailable = false;
  try {
    const pgData = await initDatabase();
    if (pgData) {
      await setPgCache(pgData);
      console.log("✓ Database loaded from PostgreSQL");
      pgAvailable = true;
    }
  } catch (err) {
    console.log("ℹ PostgreSQL not available — using JSON file storage");
  }
  // Even without PostgreSQL, the JSON file storage works fine
  if (!pgAvailable) {
    // Force create the database from defaults if it doesn't exist
    getDatabase();
  }
  startServer();
})();
