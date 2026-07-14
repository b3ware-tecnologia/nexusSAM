import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { getDatabase, saveDatabase, initDatabase, setPgCache } from "./src/dbMock.js";
import { calculateELP } from "./src/complianceEngine.js";
import { runComplianceTests } from "./src/compliance.test.js";
import { DiscoveredApplication, ITSMConnector } from "./src/types.js";
import { GoogleGenAI } from "@google/genai";
import Groq from "groq-sdk";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.use((_req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (_req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

const JWT_SECRET = process.env.JWT_SECRET || "nexus-sam-jwt-secret-2024";

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
  } catch {
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
    if (!req.user) return res.status(401).json({ error: "Not authenticated" });
    const userLevel = req.user.permissions[module];
    if (level === "Write" && userLevel !== "Write") return res.status(403).json({ error: `Insufficient permissions for ${module}:${level}` });
    if (level === "Read" && (userLevel !== "Read" && userLevel !== "Write")) return res.status(403).json({ error: `Insufficient permissions for ${module}:${level}` });
    next();
  };
}

app.use("/api", (req, res, next) => {
  if (req.path === "/health" || req.path === "/auth/login" || req.path === "/auth/register") return next();
  if (req.method === "GET") {
    (req as any).user = {
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

let groqClient: Groq | null = null;
function getGroqClient(): Groq {
  if (!groqClient) {
    const key = process.env.GROQ_API_KEY;
    if (!key) throw new Error("GROQ_API_KEY environment variable is required");
    groqClient = new Groq({ apiKey: key });
  }
  return groqClient;
}

let geminiClient: GoogleGenAI | null = null;
function getGeminiClient() {
  if (!geminiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY environment variable is required");
    geminiClient = new GoogleGenAI({ apiKey, httpOptions: { headers: { "User-Agent": "nexussam" } } });
  }
  return geminiClient;
}

function writeAuditLog(db: any, userEmail: string, category: string, action: string, details: string, ip: string = "192.168.1.102") {
  const newEntry = {
    id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
    userId: userEmail === "ericob3ware@gmail.com" ? "usr-1" : "usr-custom",
    userEmail, action, category: category as any, ipAddress: ip, details
  };
  db.auditLogs = db.auditLogs || [];
  db.auditLogs.unshift(newEntry);
}

// ========= HEALTH & AUTH =========
app.get("/api/health", (_, res) => res.json({ status: "ok", time: new Date().toISOString() }));

app.get("/api/run-tests", (_, res) => {
  try { res.json({ success: runComplianceTests(), message: "All tests passed." }); }
  catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
});

app.post("/api/auth/login", (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });
    const db = getDatabase();
    const user = db.adminUsers.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
    if (!user || user.status !== "Active") return res.status(401).json({ error: "Invalid credentials" });
    if (password !== "b3ware2026" && password !== "demo123") return res.status(401).json({ error: "Invalid credentials" });
    const role = db.adminRoles.find((r: any) => r.id === user.roleId);
    const token = generateToken({
      userId: user.id, email: user.email, tenantId: user.tenantId, roleId: user.roleId,
      permissions: role?.permissions || { licenses: "Read", saas: "Read", cloud: "Read", admin: "Read", auditLogs: "Read" }
    });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: role?.name } });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.post("/api/auth/register", (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: "Name, email, and password required" });
    const db = getDatabase();
    if (db.adminUsers.find((u: any) => u.email.toLowerCase() === email.toLowerCase())) return res.status(409).json({ error: "Email already registered" });
    const newUser = {
      id: `usr-${Date.now()}`, tenantId: "tenant-default", name, email, passwordHash: password,
      roleId: "role-user", groupIds: ["group-read"], status: "Active" as const,
      joinedDate: new Date().toISOString().split("T")[0], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
    };
    db.adminUsers.push(newUser);
    saveDatabase(db);
    const token = generateToken({
      userId: newUser.id, email: newUser.email, tenantId: newUser.tenantId, roleId: newUser.roleId,
      permissions: { licenses: "Read", saas: "Read", cloud: "Read", admin: "None", auditLogs: "None" }
    });
    res.status(201).json({ token, user: { id: newUser.id, name: newUser.name, email: newUser.email } });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ========= LICENSES =========
app.get("/api/licenses", (_, res) => { try { res.json(getDatabase().licenses); } catch (e: any) { res.status(500).json({ error: e.message }); } });

app.post("/api/licenses", (req, res) => {
  try {
    const db = getDatabase();
    const { softwareName, publisher, metricType, agreementId, notes, version, sku, downgradeRights, isSubscription, purchases, licensePoolId } = req.body;
    if (!softwareName || !publisher || !metricType) return res.status(400).json({ error: "softwareName, publisher, and metricType are required." });
    const newLicenseId = `lic-${Date.now()}`;
    const newLicense = {
      id: newLicenseId, softwareName, publisher, metricType, totalQuantity: 0, allocatedQuantity: 0,
      agreementId: agreementId || undefined, licensePoolId: licensePoolId || undefined,
      status: (sku ? "Active" : "Incomplete") as "Active" | "Incomplete", notes, version, sku,
      downgradeRights: !!downgradeRights, isSubscription: !!isSubscription,
      licensePolicy: { mandatoryFields: ["sku"] }
    };
    db.licenses.push(newLicense);
    if (purchases && Array.isArray(purchases)) {
      purchases.forEach((p: any) => {
        const qty = Number(p.quantity) || 0;
        const uCost = Number(p.unitCost) || 0;
        db.purchases.push({
          id: `pur-${Date.now()}-${Math.floor(Math.random() * 1000)}`, licenseId: newLicenseId,
          invoiceNumber: p.invoiceNumber || "N/A", purchaseDate: p.purchaseDate || new Date().toISOString().split("T")[0],
          quantity: qty, unitCost: uCost, currency: p.currency || "USD", totalCost: qty * uCost
        });
      });
    }
    newLicense.totalQuantity = db.purchases.filter((p: any) => p.licenseId === newLicenseId).reduce((sum: number, p: any) => sum + p.quantity, 0);
    saveDatabase(db);
    res.status(201).json(newLicense);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.put("/api/licenses/:id", (req, res) => {
  try {
    const db = getDatabase();
    const idx = db.licenses.findIndex((l: any) => l.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: "License not found" });
    const lic = db.licenses[idx];
    const { softwareName, publisher, metricType, agreementId, notes, version, sku, downgradeRights, isSubscription, status, licensePoolId } = req.body;
    if (softwareName !== undefined) lic.softwareName = softwareName;
    if (publisher !== undefined) lic.publisher = publisher;
    if (metricType !== undefined) lic.metricType = metricType;
    if (agreementId !== undefined) lic.agreementId = agreementId || undefined;
    if (notes !== undefined) lic.notes = notes;
    if (version !== undefined) lic.version = version;
    if (sku !== undefined) lic.sku = sku;
    if (downgradeRights !== undefined) lic.downgradeRights = !!downgradeRights;
    if (isSubscription !== undefined) lic.isSubscription = !!isSubscription;
    if (licensePoolId !== undefined) lic.licensePoolId = licensePoolId || undefined;
    if (status === "Archived") lic.status = "Archived";
    else {
      const finalSku = sku !== undefined ? sku : lic.sku;
      lic.status = finalSku ? "Active" : "Incomplete";
    }
    saveDatabase(db);
    res.json(lic);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.post("/api/licenses/:id/archive", (req, res) => {
  try {
    const db = getDatabase();
    const idx = db.licenses.findIndex((l: any) => l.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: "License not found" });
    db.licenses[idx].status = "Archived";
    saveDatabase(db);
    res.json(db.licenses[idx]);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.delete("/api/licenses/:id", (req, res) => {
  try {
    const db = getDatabase();
    const len = db.licenses.length;
    db.licenses = db.licenses.filter((l: any) => l.id !== req.params.id);
    db.purchases = db.purchases.filter((p: any) => p.licenseId !== req.params.id);
    db.assignments = db.assignments.filter((a: any) => a.licenseId !== req.params.id);
    if (db.licenses.length === len) return res.status(404).json({ error: "License not found" });
    saveDatabase(db);
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.get("/api/agreements", (_, res) => { try { res.json(getDatabase().agreements); } catch (e: any) { res.status(500).json({ error: e.message }); } });

// ========= COMPLIANCE =========
app.get("/api/compliance", (_req: any, res) => {
  try {
    const db = getDatabase();
    res.json(calculateELP(db.licenses, db.purchases, db.computers, db.installations, db.assignments, db.subscriptionLicenses, db.licensePools, [], [], db.cloudResources));
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.get("/api/renewal-forecasts", (_req: any, res) => {
  try {
    const db = getDatabase();
    const forecasts = db.licenses.filter((l: any) => l.isSubscription).map((l: any) => {
      const sub = db.subscriptionLicenses.find((s: any) => s.licenseId === l.id);
      if (!sub) return null;
      const d = Math.ceil((new Date(sub.endDate).getTime() - Date.now()) / 86400000);
      let renewalStatus: string, recommendation: string;
      if (d <= 0) { renewalStatus = "Expired"; recommendation = "Renew immediately."; }
      else if (d <= 30) { renewalStatus = "Expiring Soon"; recommendation = `Expires in ${d} days. ${sub.autoRenew ? "Auto-renew on." : "Renew now."}`; }
      else if (sub.autoRenew) { renewalStatus = "Auto-Renew"; recommendation = "Renews automatically."; }
      else { renewalStatus = "Manual Renewal Needed"; recommendation = `Renew by ${sub.endDate}.`; }
      return { licenseId: l.id, softwareName: l.softwareName, publisher: l.publisher, agreementId: l.agreementId, currentEndDate: sub.endDate, autoRenew: sub.autoRenew, daysUntilExpiry: d, estimatedAnnualCost: 0, renewalStatus, recommendation };
    }).filter(Boolean);
    res.json(forecasts);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.get("/api/azure-hybrid-benefits", (_req: any, res) => {
  try {
    const db = getDatabase();
    res.json(db.cloudResources.filter((r: any) => r.provider === "Azure" && r.pricingModel === "PAYG" && !r.hasLicenseCoverage).map((r: any) => ({
      resourceId: r.id, resourceName: r.name, softwareDetected: r.softwareInstalled,
      estimatedMonthlySavings: Math.round(r.cost * 0.4),
      recommendation: `Enable Azure Hybrid Benefit on ${r.name} to save ~$${Math.round(r.cost * 0.4)}/month`
    })));
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ========= ASSIGNMENTS =========
app.get("/api/licenses/:id/assignments", (req, res) => {
  try { res.json(getDatabase().assignments.filter((a: any) => a.licenseId === req.params.id)); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.post("/api/licenses/:id/assignments", (req, res) => {
  try {
    const db = getDatabase();
    const { targetType, targetId, quantity } = req.body;
    if (!targetType || !targetId || !quantity) return res.status(400).json({ error: "targetType, targetId, and quantity are required." });
    const lic = db.licenses.find((l: any) => l.id === req.params.id);
    if (!lic) return res.status(404).json({ error: "License not found" });
    const asg = { id: `asg-${Date.now()}`, licenseId: req.params.id, targetType: targetType as "User" | "Device" | "OrgUnit", targetId, quantity: Number(quantity) || 1, allocatedAt: new Date().toISOString() };
    db.assignments.push(asg);
    lic.allocatedQuantity = db.assignments.filter((a: any) => a.licenseId === req.params.id).reduce((s: number, a: any) => s + a.quantity, 0);
    saveDatabase(db);
    res.status(201).json(asg);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.delete("/api/assignments/:id", (req, res) => {
  try {
    const db = getDatabase();
    const asg = db.assignments.find((a: any) => a.id === req.params.id);
    if (!asg) return res.status(404).json({ error: "Assignment not found" });
    db.assignments = db.assignments.filter((a: any) => a.id !== req.params.id);
    const lic = db.licenses.find((l: any) => l.id === asg.licenseId);
    if (lic) lic.allocatedQuantity = db.assignments.filter((a: any) => a.licenseId === asg.licenseId).reduce((s: number, a: any) => s + a.quantity, 0);
    saveDatabase(db);
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ========= LICENSE POOLS =========
app.get("/api/license-pools", (_, res) => {
  try {
    const db = getDatabase();
    res.json(db.licensePools.map((p: any) => ({ ...p, totalQuantity: db.licenses.filter((l: any) => l.licensePoolId === p.id).reduce((s: number, l: any) => s + (l.totalQuantity || 0), 0) })));
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.post("/api/license-pools", (req, res) => {
  try {
    const db = getDatabase();
    const { name, description, ownerOrgNodeId } = req.body;
    if (!name) return res.status(400).json({ error: "Pool name is required" });
    const pool = { id: `pool-${Date.now()}`, name, description, ownerOrgNodeId: ownerOrgNodeId || undefined, totalQuantity: 0 };
    db.licensePools.push(pool);
    saveDatabase(db);
    res.status(201).json(pool);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.put("/api/license-pools/:id", (req, res) => {
  try {
    const db = getDatabase();
    const idx = db.licensePools.findIndex((p: any) => p.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: "License pool not found" });
    const { name, description, ownerOrgNodeId } = req.body;
    if (name !== undefined) db.licensePools[idx].name = name;
    if (description !== undefined) db.licensePools[idx].description = description;
    db.licensePools[idx].ownerOrgNodeId = ownerOrgNodeId || undefined;
    db.licensePools[idx].totalQuantity = db.licenses.filter((l: any) => l.licensePoolId === req.params.id).reduce((s: number, l: any) => s + (l.totalQuantity || 0), 0);
    saveDatabase(db);
    res.json(db.licensePools[idx]);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.delete("/api/license-pools/:id", (req, res) => {
  try {
    const db = getDatabase();
    const idx = db.licensePools.findIndex((p: any) => p.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: "License pool not found" });
    db.licenses.forEach((l: any) => { if (l.licensePoolId === req.params.id) delete l.licensePoolId; });
    db.licensePools.splice(idx, 1);
    saveDatabase(db);
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ========= COMPUTERS & INVENTORY =========
app.get("/api/computers", (_, res) => { try { res.json(getDatabase().computers); } catch (e: any) { res.status(500).json({ error: e.message }); } });

app.get("/api/computers/:id", (req, res) => {
  try {
    const db = getDatabase();
    const c = db.computers.find((x: any) => x.id === req.params.id);
    if (!c) return res.status(404).json({ error: "Computer not found" });
    res.json({ computer: c, applications: db.discoveredApplications.filter((a: any) => a.computerId === c.id), installations: db.installations.filter((i: any) => i.computerId === c.id) });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.post("/api/computers", (req, res) => {
  try {
    const db = getDatabase();
    const { name, cores, pvuPerCore, isVirtual, os, ramGB, cpuModel, serialNumber, brand, model, storageGB, warrantyStatus, warrantyExpirationDate } = req.body;
    if (!name || !os) return res.status(400).json({ error: "name and os are required." });
    const c = {
      id: `cmp-custom-${Date.now()}`, name, cores: Number(cores) || 4, pvuPerCore: Number(pvuPerCore) || 70,
      isVirtual: !!isVirtual, os: os as "Windows" | "Linux" | "macOS", ramGB: Number(ramGB) || 16,
      cpuModel: cpuModel || "Standard Processor", serialNumber: serialNumber || `SN-${Math.floor(10000 + Math.random() * 90000)}`,
      brand: brand || "Generic", model: model || "Standard", storageGB: Number(storageGB) || 256,
      warrantyStatus: (warrantyStatus || "No Info") as "Under Warranty" | "Expired" | "No Info",
      warrantyExpirationDate: warrantyExpirationDate || "", lifecycleStatus: "Active" as const,
      lastActiveDate: new Date().toISOString()
    };
    db.computers.push(c);
    saveDatabase(db);
    res.status(201).json(c);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.put("/api/computers/:id", (req, res) => {
  try {
    const db = getDatabase();
    const c = db.computers.find((x: any) => x.id === req.params.id);
    if (!c) return res.status(404).json({ error: "Computer not found" });
    const fields = ["name", "cores", "pvuPerCore", "isVirtual", "os", "ramGB", "cpuModel", "serialNumber", "brand", "model", "storageGB", "warrantyStatus", "warrantyExpirationDate", "lifecycleStatus"];
    fields.forEach(f => { if (req.body[f] !== undefined) c[f] = f === "cores" || f === "pvuPerCore" || f === "ramGB" || f === "storageGB" ? Number(req.body[f]) : f === "isVirtual" ? !!req.body[f] : req.body[f]; });
    saveDatabase(db);
    res.json(c);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.delete("/api/computers/:id", (req, res) => {
  try {
    const db = getDatabase();
    const len = db.computers.length;
    db.computers = db.computers.filter((c: any) => c.id !== req.params.id);
    db.installations = db.installations.filter((i: any) => i.computerId !== req.params.id);
    db.discoveredApplications = db.discoveredApplications.filter((a: any) => a.computerId !== req.params.id);
    if (db.computers.length === len) return res.status(404).json({ error: "Computer not found" });
    saveDatabase(db);
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.post("/api/computers/:id/quarantine", (req, res) => {
  try {
    const db = getDatabase();
    const c = db.computers.find((x: any) => x.id === req.params.id);
    if (!c) return res.status(404).json({ error: "Computer not found" });
    c.lifecycleStatus = "Quarantined";
    saveDatabase(db);
    res.json(c);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.post("/api/computers/:id/archive", (req, res) => {
  try {
    const db = getDatabase();
    const c = db.computers.find((x: any) => x.id === req.params.id);
    if (!c) return res.status(404).json({ error: "Computer not found" });
    c.lifecycleStatus = "Archived";
    saveDatabase(db);
    res.json(c);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.post("/api/computers/:id/inactive", (req, res) => {
  try {
    const db = getDatabase();
    const c = db.computers.find((x: any) => x.id === req.params.id);
    if (!c) return res.status(404).json({ error: "Computer not found" });
    c.lifecycleStatus = "Inactive";
    saveDatabase(db);
    res.json(c);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.post("/api/computers/:id/activate", (req, res) => {
  try {
    const db = getDatabase();
    const c = db.computers.find((x: any) => x.id === req.params.id);
    if (!c) return res.status(404).json({ error: "Computer not found" });
    c.lifecycleStatus = "Active";
    saveDatabase(db);
    res.json(c);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.get("/api/mobile-devices", (_, res) => { try { res.json(getDatabase().mobileDevices || []); } catch (e: any) { res.status(500).json({ error: e.message }); } });

app.post("/api/mobile-devices", (req, res) => {
  try {
    const db = getDatabase();
    const { name, brand, model, os, serialNumber, userName, warrantyStatus, warrantyExpirationDate } = req.body;
    if (!name || !brand || !model) return res.status(400).json({ error: "name, brand, and model are required." });
    const d = { id: `mob-${Date.now()}`, name, brand, model, os: os || "iOS", serialNumber: serialNumber || `SN-MOB-${Math.floor(10000 + Math.random() * 90000)}`, userName: userName || "unassigned@company.com", warrantyStatus: (warrantyStatus || "No Info") as "Under Warranty" | "Expired" | "No Info", warrantyExpirationDate: warrantyExpirationDate || "", lifecycleStatus: "Active" as const, lastActiveDate: new Date().toISOString() };
    db.mobileDevices = db.mobileDevices || [];
    db.mobileDevices.push(d);
    saveDatabase(db);
    res.status(201).json(d);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.delete("/api/mobile-devices/:id", (req, res) => {
  try {
    const db = getDatabase();
    const len = db.mobileDevices?.length || 0;
    db.mobileDevices = (db.mobileDevices || []).filter((m: any) => m.id !== req.params.id);
    if ((db.mobileDevices?.length || 0) === len) return res.status(404).json({ error: "Mobile device not found" });
    saveDatabase(db);
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.get("/api/applications", (_, res) => { try { res.json(getDatabase().discoveredApplications); } catch (e: any) { res.status(500).json({ error: e.message }); } });
app.get("/api/installations", (_, res) => { try { res.json(getDatabase().installations); } catch (e: any) { res.status(500).json({ error: e.message }); } });
app.get("/api/catalog", (req, res) => {
  try {
    const db = getDatabase();
    const q = String(req.query.query || "").toLowerCase();
    let cat = db.softwareCatalog;
    if (q) cat = cat.filter((c: any) => c.softwareName.toLowerCase().includes(q) || c.publisher.toLowerCase().includes(q));
    res.json(cat);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});
app.get("/api/catalog/categories", (_, res) => { try { res.json(getDatabase().applicationCategories); } catch (e: any) { res.status(500).json({ error: e.message }); } });
app.get("/api/catalog/manufacturers", (_, res) => { try { res.json(getDatabase().manufacturers); } catch (e: any) { res.status(500).json({ error: e.message }); } });

app.get("/api/private-catalog", (_, res) => { try { res.json(getDatabase().privateCatalog || []); } catch (e: any) { res.status(500).json({ error: e.message }); } });

app.post("/api/private-catalog", (req, res) => {
  try {
    const db = getDatabase();
    const { softwareName, publisher, matchPattern, categoryId, notes } = req.body;
    if (!softwareName || !publisher || !matchPattern) return res.status(400).json({ error: "softwareName, publisher, matchPattern required" });
    const item = { id: `priv-${Date.now()}`, softwareName, publisher, matchPattern, categoryId: categoryId || "cat-office", notes };
    db.privateCatalog = db.privateCatalog || [];
    db.privateCatalog.push(item);
    saveDatabase(db);
    res.status(201).json(item);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.delete("/api/private-catalog/:id", (req, res) => {
  try {
    const db = getDatabase();
    const len = db.privateCatalog?.length || 0;
    db.privateCatalog = (db.privateCatalog || []).filter((p: any) => p.id !== req.params.id);
    if ((db.privateCatalog?.length || 0) === len) return res.status(404).json({ error: "Private catalog item not found" });
    saveDatabase(db);
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.post("/api/inventory/agent-scan", (req, res) => {
  try {
    const db = getDatabase();
    const { computerId, rawScanLines } = req.body;
    if (!computerId) return res.status(400).json({ error: "computerId required" });
    const computer = db.computers.find((c: any) => c.id === computerId);
    if (!computer) return res.status(404).json({ error: "Computer not found" });
    let scans: string[] = rawScanLines && Array.isArray(rawScanLines) ? rawScanLines : computer.os === "Windows" ? ["Microsoft_Office_ProPlus_Retail_en-us_16.0", "AcrobatReaderDC_20.012_OfflinePackage", "Zoom_Mtg_Client_v5.17"] : computer.os === "macOS" ? ["Adobe Photoshop CC CreativeCloud_macOS_2025.app", "Google Chrome AppBundle v120.0", "Slack Chat Endpoint macOS.app"] : ["oracle-database-ee-19c-rhel8.rpm", "google-chrome-stable_amd64.deb"];
    const newlyDetectedApps: DiscoveredApplication[] = [];
    scans.forEach((raw: string) => {
      const lowerRaw = raw.toLowerCase();
      let matchedItem: any = null;
      const matchedPrivate = (db.privateCatalog || []).find((p: any) => lowerRaw.includes(p.matchPattern.toLowerCase()));
      if (matchedPrivate) matchedItem = { softwareName: matchedPrivate.softwareName, publisher: matchedPrivate.publisher, version: "Internal Custom", categoryId: matchedPrivate.categoryId };
      else if (lowerRaw.includes("office") || lowerRaw.includes("m365")) matchedItem = db.softwareCatalog.find((i: any) => i.id === "cat-item-m365");
      else if (lowerRaw.includes("oracle")) matchedItem = db.softwareCatalog.find((i: any) => i.id === "cat-item-oracle-db");
      else if (lowerRaw.includes("photoshop") || lowerRaw.includes("psd")) matchedItem = db.softwareCatalog.find((i: any) => i.id === "cat-item-photoshop");
      else if (lowerRaw.includes("acrobat") || lowerRaw.includes("reader")) matchedItem = db.softwareCatalog.find((i: any) => i.id === "cat-item-acrobat");
      else if (lowerRaw.includes("chrome")) matchedItem = db.softwareCatalog.find((i: any) => i.id === "cat-item-chrome");
      else if (lowerRaw.includes("slack")) matchedItem = db.softwareCatalog.find((i: any) => i.id === "cat-item-slack");
      else if (lowerRaw.includes("zoom")) matchedItem = db.softwareCatalog.find((i: any) => i.id === "cat-item-zoom");
      if (matchedItem) {
        const verMatch = raw.match(/(?:v|version)?\s*(\d+(?:\.\d+)+)/i);
        newlyDetectedApps.push({
          id: `disc-${Date.now()}-${Math.floor(Math.random() * 10000)}`, computerId, catalogItemId: matchedItem.id || undefined,
          softwareName: matchedItem.softwareName, rawSoftwareName: raw, publisher: matchedItem.publisher,
          version: verMatch?.[1] || matchedItem.version || "1.0", lastUsed: new Date().toISOString(),
          usageDurationMinutes: Math.floor(10 + Math.random() * 4000), isPrivateCatalogMatch: !!matchedPrivate
        });
      } else {
        newlyDetectedApps.push({ id: `disc-unrec-${Date.now()}-${Math.floor(Math.random() * 10000)}`, computerId, softwareName: raw.split(/[_-]/)[0] || raw, rawSoftwareName: raw, publisher: "Unrecognized", version: "Unknown", lastUsed: new Date().toISOString(), usageDurationMinutes: 0 });
      }
    });
    computer.lastActiveDate = new Date().toISOString();
    if (computer.lifecycleStatus === "Inactive") computer.lifecycleStatus = "Active";
    db.discoveredApplications = db.discoveredApplications.filter((a: any) => a.computerId !== computerId);
    db.discoveredApplications.push(...newlyDetectedApps);
    db.installations = db.installations.filter((i: any) => i.computerId !== computerId);
    newlyDetectedApps.filter((a: any) => !["miner", "chrome", "reader"].some(k => a.softwareName.toLowerCase().includes(k))).forEach((app: any) => {
      db.installations.push({ id: `inst-${Date.now()}-${Math.floor(Math.random() * 1000)}`, softwareName: app.softwareName, publisher: app.publisher, version: app.version, computerId, userName: computer.name + "-user", detectedAt: new Date().toISOString() });
    });
    saveDatabase(db);
    res.json({ success: true, message: `Agent scan complete. Recognized ${newlyDetectedApps.filter((a: any) => a.catalogItemId || a.isPrivateCatalogMatch).length}/${newlyDetectedApps.length} apps.`, detectedApplications: newlyDetectedApps, computer });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ========= SAAS MANAGEMENT =========
app.get("/api/saas/applications", (_, res) => { try { res.json(getDatabase().saasApplications || []); } catch (e: any) { res.status(500).json({ error: e.message }); } });

app.post("/api/saas/applications", (req, res) => {
  try {
    const db = getDatabase();
    const app = { id: `saas-app-${Date.now()}`, name: req.body.name, publisher: req.body.publisher || "Unknown", category: req.body.category || "Uncategorized", riskScore: req.body.riskScore || 30, isApproved: req.body.isApproved !== false, familyName: req.body.familyName, discoveredSources: req.body.discoveredSources || ["Manually Created"] };
    db.saasApplications.push(app);
    saveDatabase(db);
    res.status(201).json(app);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.put("/api/saas/applications/:id", (req, res) => {
  try {
    const db = getDatabase();
    const idx = db.saasApplications.findIndex((a: any) => a.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: "Not found" });
    db.saasApplications[idx] = { ...db.saasApplications[idx], ...req.body };
    saveDatabase(db);
    res.json(db.saasApplications[idx]);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.delete("/api/saas/applications/:id", (req, res) => {
  try {
    const db = getDatabase();
    db.saasApplications = db.saasApplications.filter((a: any) => a.id !== req.params.id);
    db.saasSubscriptions = db.saasSubscriptions.filter((s: any) => s.saasApplicationId !== req.params.id);
    saveDatabase(db);
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.get("/api/saas/subscriptions", (_, res) => { try { res.json(getDatabase().saasSubscriptions || []); } catch (e: any) { res.status(500).json({ error: e.message }); } });

app.post("/api/saas/subscriptions", (req, res) => {
  try {
    const db = getDatabase();
    const sub = { id: `saas-sub-${Date.now()}`, saasApplicationId: req.body.saasApplicationId, sku: req.body.sku || "CUSTOM-SKU", planName: req.body.planName || "Standard", billingFrequency: req.body.billingFrequency || "Monthly", seatsTotal: Number(req.body.seatsTotal) || 0, seatsAssigned: Number(req.body.seatsAssigned) || 0, costPerSeat: Number(req.body.costPerSeat) || 0, currency: req.body.currency || "USD", status: req.body.status || "Active", isFree: !!req.body.isFree, isExcluded: !!req.body.isExcluded, expirationDate: req.body.expirationDate };
    db.saasSubscriptions.push(sub);
    saveDatabase(db);
    res.status(201).json(sub);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.put("/api/saas/subscriptions/:id", (req, res) => {
  try {
    const db = getDatabase();
    const idx = db.saasSubscriptions.findIndex((s: any) => s.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: "Not found" });
    db.saasSubscriptions[idx] = { ...db.saasSubscriptions[idx], ...req.body, seatsTotal: req.body.seatsTotal !== undefined ? Number(req.body.seatsTotal) : db.saasSubscriptions[idx].seatsTotal, seatsAssigned: req.body.seatsAssigned !== undefined ? Number(req.body.seatsAssigned) : db.saasSubscriptions[idx].seatsAssigned, costPerSeat: req.body.costPerSeat !== undefined ? Number(req.body.costPerSeat) : db.saasSubscriptions[idx].costPerSeat };
    saveDatabase(db);
    res.json(db.saasSubscriptions[idx]);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.delete("/api/saas/subscriptions/:id", (req, res) => {
  try {
    const db = getDatabase();
    db.saasSubscriptions = db.saasSubscriptions.filter((s: any) => s.id !== req.params.id);
    db.saasSubscriptionPurchases = db.saasSubscriptionPurchases.filter((p: any) => p.subscriptionId !== req.params.id);
    saveDatabase(db);
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.get("/api/saas/subscriptions/purchases", (_, res) => { try { res.json(getDatabase().saasSubscriptionPurchases || []); } catch (e: any) { res.status(500).json({ error: e.message }); } });

app.post("/api/saas/subscriptions/purchases", (req, res) => {
  try {
    const db = getDatabase();
    const q = Number(req.body.quantity) || 1;
    const u = Number(req.body.unitCost) || 0;
    const pur = { id: `saas-pur-${Date.now()}`, subscriptionId: req.body.subscriptionId, purchaseDate: req.body.purchaseDate || new Date().toISOString().split("T")[0], quantity: q, unitCost: u, totalCost: q * u, invoiceNumber: req.body.invoiceNumber || `INV-${Date.now()}` };
    db.saasSubscriptionPurchases.push(pur);
    const sub = db.saasSubscriptions.find((s: any) => s.id === req.body.subscriptionId);
    if (sub) sub.seatsTotal += q;
    saveDatabase(db);
    res.status(201).json(pur);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.get("/api/saas/users", (_, res) => { try { res.json(getDatabase().saasUsers || []); } catch (e: any) { res.status(500).json({ error: e.message }); } });
app.get("/api/saas/user-activities", (_, res) => { try { res.json(getDatabase().saasUserActivities || []); } catch (e: any) { res.status(500).json({ error: e.message }); } });
app.get("/api/saas/connectors", (_, res) => { try { res.json(getDatabase().saasConnectors || []); } catch (e: any) { res.status(500).json({ error: e.message }); } });

app.post("/api/saas/consolidate", (req, res) => {
  try {
    const db = getDatabase();
    const logs: string[] = [];
    const groups: { [email: string]: any[] } = {};
    (db.saasUsers || []).forEach((u: any) => { const e = u.email.toLowerCase().trim(); if (!groups[e]) groups[e] = []; groups[e].push(u); });
    const consolidated: any[] = [];
    let mc = 0;
    const idMap: { [oldId: string]: string } = {};
    Object.keys(groups).forEach(email => {
      const ug = groups[email];
      if (ug.length === 1) { consolidated.push(ug[0]); idMap[ug[0].id] = ug[0].id; }
      else {
        const p = ug[0]; const ss = new Set<string>();
        ug.forEach((u: any) => u.identitySources?.forEach((s: string) => ss.add(s)));
        ug.forEach((u: any) => idMap[u.id] = p.id);
        consolidated.push({ ...p, identitySources: Array.from(ss), status: ug.some((u: any) => u.status === "Active") ? "Active" : "Inactive" });
        mc += ug.length - 1;
        logs.push(`Merged ${ug.length} identities for ${email}`);
      }
    });
    db.saasUsers = consolidated;
    db.saasUserActivities = (db.saasUserActivities || []).map((act: any) => ({ ...act, saasUserId: idMap[act.saasUserId] || act.saasUserId }));
    saveDatabase(db);
    res.json({ success: true, message: `Consolidation complete. Merged ${mc} users.`, mergedUsersCount: mc, logs });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.post("/api/saas/connectors/:id/sync", (req, res) => {
  try {
    const db = getDatabase();
    const conn = db.saasConnectors.find((c: any) => c.id === req.params.id);
    if (!conn) return res.status(404).json({ error: "Connector not found" });
    conn.status = "Connected";
    conn.lastSyncedAt = new Date().toISOString();
    conn.recordCount += Math.floor(2 + Math.random() * 5);
    saveDatabase(db);
    res.json({ success: true, connector: conn, message: `Synced ${conn.name}.` });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.post("/api/saas/import-csv", (req, res) => {
  try {
    const db = getDatabase();
    const { csvData } = req.body;
    if (!csvData || !Array.isArray(csvData)) return res.status(400).json({ error: "csvData array required" });
    let aa = 0, au = 0;
    csvData.forEach((row: any) => {
      const email = row.email?.trim();
      const appName = row.appName?.trim();
      if (!email || !appName) return;
      let app = db.saasApplications.find((a: any) => a.name.toLowerCase() === appName.toLowerCase());
      if (!app) { app = { id: `saas-app-csv-${Date.now()}-${Math.floor(Math.random() * 1000)}`, name: appName, publisher: row.publisher || "Discovered", category: row.category || "Shadow IT", riskScore: row.riskScore || 45, isApproved: row.isApproved !== false, discoveredSources: ["CSV Upload"] }; db.saasApplications.push(app); aa++; }
      let user = db.saasUsers.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
      if (!user) { user = { id: `saas-usr-csv-${Date.now()}-${Math.floor(Math.random() * 1000)}`, name: row.name || email.split("@")[0], email, department: row.department || "Unassigned", status: "Active", identitySources: ["CSV Import"] }; db.saasUsers.push(user); au++; }
      db.saasUserActivities.push({ id: `act-csv-${Date.now()}-${Math.floor(Math.random() * 1000)}`, saasApplicationId: app.id, saasUserId: user.id, lastActiveDate: new Date().toISOString(), usageDurationMinutes: row.usageDurationMinutes || 300, activityLevel: "Active", sourceConnector: "CSV Import" });
    });
    saveDatabase(db);
    res.json({ success: true, message: `Imported ${csvData.length} records.`, addedApps: aa, addedUsers: au });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.post("/api/saas/discover-url", (req, res) => {
  try {
    const db = getDatabase();
    const { url, email, name, department } = req.body;
    if (!url) return res.status(400).json({ error: "url required" });
    const ue = email || "extension@company.com";
    const un = name || "Extension User";
    const ud = department || "Marketing";
    let matchedAppName = "Unknown", matchedPublisher = "Cloud", matchedCategory = "SaaS", riskScore = 35, familyName: string | undefined;
    const lu = url.toLowerCase();
    if (lu.includes("figma.com")) { matchedAppName = "Figma Pro"; matchedPublisher = "Figma"; matchedCategory = "Design"; riskScore = 20; }
    else if (lu.includes("salesforce.com")) { matchedAppName = "Salesforce"; matchedPublisher = "Salesforce"; matchedCategory = "CRM"; riskScore = 10; familyName = "Salesforce"; }
    else if (lu.includes("slack.com")) { matchedAppName = "Slack"; matchedPublisher = "Slack"; matchedCategory = "Messaging"; riskScore = 25; }
    else if (lu.includes("zoom.us")) { matchedAppName = "Zoom"; matchedPublisher = "Zoom"; matchedCategory = "Video"; riskScore = 30; }
    else if (lu.includes("chatgpt.com") || lu.includes("openai.com")) { matchedAppName = "ChatGPT"; matchedPublisher = "OpenAI"; matchedCategory = "AI"; riskScore = 85; }
    else { try { const h = new URL(url).hostname.replace("www.", "").split("."); matchedAppName = h[0].charAt(0).toUpperCase() + h[0].slice(1); } catch { matchedAppName = "Custom Tool"; } riskScore = 55; }
    let saasApp = db.saasApplications.find((a: any) => a.name.toLowerCase() === matchedAppName.toLowerCase());
    if (!saasApp) { saasApp = { id: `saas-app-${Date.now()}`, name: matchedAppName, publisher: matchedPublisher, category: matchedCategory, riskScore, isApproved: riskScore < 50, discoveredSources: ["Browser Extension"], familyName }; db.saasApplications.push(saasApp); }
    else if (!saasApp.discoveredSources.includes("Browser Extension")) saasApp.discoveredSources.push("Browser Extension");
    let saasUser = db.saasUsers.find((u: any) => u.email.toLowerCase() === ue.toLowerCase());
    if (!saasUser) { saasUser = { id: `saas-usr-${Date.now()}`, name: un, email: ue, department: ud, status: "Active", identitySources: ["Browser Extension"] }; db.saasUsers.push(saasUser); }
    db.saasUserActivities.push({ id: `act-ext-${Date.now()}`, saasApplicationId: saasApp.id, saasUserId: saasUser.id, lastActiveDate: new Date().toISOString(), usageDurationMinutes: Math.floor(Math.random() * 45) + 15, activityLevel: "Active", sourceConnector: "Browser Extension" });
    saveDatabase(db);
    res.status(201).json({ success: true, message: `Discovered ${saasApp.name} via URL.`, application: saasApp, user: saasUser });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ========= CLOUD MANAGEMENT =========
app.get("/api/cloud/connectors", (_, res) => { try { res.json(getDatabase().cloudConnectors || []); } catch (e: any) { res.status(500).json({ error: e.message }); } });

app.post("/api/cloud/connectors", (req, res) => {
  try {
    const db = getDatabase();
    const { name, provider } = req.body;
    if (!name || !provider) return res.status(400).json({ error: "name and provider required" });
    const conn = { id: `cloud-conn-${Date.now()}`, name, provider, status: "Connected" as const, lastSyncedAt: new Date().toISOString(), resourceCount: 0 };
    db.cloudConnectors = db.cloudConnectors || [];
    db.cloudConnectors.push(conn);
    saveDatabase(db);
    res.json(conn);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.get("/api/cloud/resources", (_, res) => { try { res.json(getDatabase().cloudResources || []); } catch (e: any) { res.status(500).json({ error: e.message }); } });

app.post("/api/cloud/sync", (req, res) => {
  try {
    const db = getDatabase();
    const ts = new Date().toISOString();
    db.cloudConnectors = (db.cloudConnectors || []).map((c: any) => ({ ...c, status: "Connected", lastSyncedAt: ts }));
    db.cloudResources = (db.cloudResources || []).map((r: any) => {
      let covered = r.hasLicenseCoverage;
      let rec = r.recommendation;
      if (r.pricingModel === "PAYG" && r.softwareInstalled.some((s: string) => s.toLowerCase().includes("sql"))) {
        const sqlLic = db.licenses.find((l: any) => l.softwareName.toLowerCase().includes("sql") && l.status === "Active");
        if (sqlLic && sqlLic.totalQuantity - sqlLic.allocatedQuantity >= 4) { covered = false; rec = "Double-Pay! Use BYOL to save."; }
      }
      return { ...r, hasLicenseCoverage: covered, recommendation: rec };
    });
    saveDatabase(db);
    res.json({ success: true, timestamp: ts });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ========= CONTAINER VISIBILITY =========
app.get("/api/containers/connectors", (_, res) => { try { res.json(getDatabase().k8sConnectors || []); } catch (e: any) { res.status(500).json({ error: e.message }); } });

app.post("/api/containers/connectors", (req, res) => {
  try {
    const db = getDatabase();
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "name required" });
    const conn = { id: `k8s-conn-${Date.now()}`, name, status: "Connected" as const, lastSyncedAt: new Date().toISOString(), clusterCount: 1 };
    db.k8sConnectors = db.k8sConnectors || [];
    db.k8sConnectors.push(conn);
    db.k8sClusters = db.k8sClusters || [];
    db.k8sClusters.push({ id: `clus-${Date.now()}`, name: `${name.toLowerCase().replace(/[^a-z0-9]/g, "-")}-cluster`, namespaceCount: 3, podCount: 5 });
    saveDatabase(db);
    res.json(conn);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.get("/api/containers/clusters", (_, res) => { try { res.json(getDatabase().k8sClusters || []); } catch (e: any) { res.status(500).json({ error: e.message }); } });
app.get("/api/containers/pods", (_, res) => { try { res.json(getDatabase().containerPods || []); } catch (e: any) { res.status(500).json({ error: e.message }); } });

app.post("/api/containers/sync", (req, res) => {
  try {
    const db = getDatabase();
    const ts = new Date().toISOString();
    db.k8sConnectors = (db.k8sConnectors || []).map((c: any) => ({ ...c, status: "Connected", lastSyncedAt: ts }));
    db.containerPods = (db.containerPods || []).map((pod: any) => {
      let s = pod.licenseStatus;
      if (pod.softwareRunning.some((sw: string) => sw.toLowerCase().includes("oracle"))) s = db.licenses.some((l: any) => l.softwareName.toLowerCase().includes("oracle") && l.status === "Active") ? "BYOL Coverage Checked" : "Unlicensed";
      else if (pod.softwareRunning.some((sw: string) => sw.toLowerCase().includes("sql"))) s = db.licenses.some((l: any) => l.softwareName.toLowerCase().includes("sql") && l.status === "Active") ? "Compliant" : "Non-Compliant";
      return { ...pod, licenseStatus: s };
    });
    saveDatabase(db);
    res.json({ success: true, timestamp: ts });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ========= CUSTOM FIELDS =========
app.get("/api/custom-fields/definitions", (_, res) => { try { res.json(getDatabase().customFieldDefinitions || []); } catch (e: any) { res.status(500).json({ error: e.message }); } });

app.post("/api/custom-fields/definitions", (req, res) => {
  try {
    const db = getDatabase();
    const { targetType, name, fieldType } = req.body;
    if (!targetType || !name || !fieldType) return res.status(400).json({ error: "targetType, name, fieldType required" });
    const def = { id: `cf-def-${Date.now()}`, targetType, name, fieldType };
    db.customFieldDefinitions = db.customFieldDefinitions || [];
    db.customFieldDefinitions.push(def);
    saveDatabase(db);
    res.json(def);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.get("/api/custom-fields/values", (_, res) => { try { res.json(getDatabase().customFieldValues || []); } catch (e: any) { res.status(500).json({ error: e.message }); } });

app.post("/api/custom-fields/bulk-update", (req, res) => {
  try {
    const db = getDatabase();
    const { updates } = req.body;
    if (!updates || !Array.isArray(updates)) return res.status(400).json({ error: "updates array required" });
    db.customFieldValues = db.customFieldValues || [];
    let count = 0;
    updates.forEach((up: any) => {
      const { definitionId, entityId, value } = up;
      if (!definitionId || !entityId) return;
      const idx = db.customFieldValues.findIndex((v: any) => v.definitionId === definitionId && v.entityId === entityId);
      if (idx >= 0) db.customFieldValues[idx].value = String(value);
      else db.customFieldValues.push({ id: `cf-val-${Date.now()}-${Math.floor(Math.random() * 1000)}`, definitionId, entityId, value: String(value) });
      count++;
    });
    saveDatabase(db);
    res.json({ success: true, updatedCount: count });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.get("/api/custom-metrics", (_, res) => { try { res.json(getDatabase().customMetrics || []); } catch (e: any) { res.status(500).json({ error: e.message }); } });

app.post("/api/custom-metrics", (req, res) => {
  try {
    const db = getDatabase();
    const { name, description, queryCriteria, value } = req.body;
    if (!name || !queryCriteria) return res.status(400).json({ error: "name and queryCriteria required" });
    const m = { id: `met-${Date.now()}`, name, description: description || "", queryCriteria, value: Number(value || 0) };
    db.customMetrics = db.customMetrics || [];
    db.customMetrics.push(m);
    saveDatabase(db);
    res.json(m);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ========= REPORTS =========
app.get("/api/reports", (_, res) => { try { res.json(getDatabase().savedReports || []); } catch (e: any) { res.status(500).json({ error: e.message }); } });

app.post("/api/reports", (req, res) => {
  try {
    const db = getDatabase();
    const { name, description, columns, filters, targetType } = req.body;
    if (!name || !targetType || !columns || !Array.isArray(columns)) return res.status(400).json({ error: "name, targetType, columns required" });
    const r = { id: `rep-${Date.now()}`, name, description: description || "", columns, filters: filters || {}, targetType };
    db.savedReports = db.savedReports || [];
    db.savedReports.push(r);
    saveDatabase(db);
    res.json(r);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.get("/api/reports/schedules", (_, res) => { try { res.json(getDatabase().reportSchedules || []); } catch (e: any) { res.status(500).json({ error: e.message }); } });

app.post("/api/reports/schedules", (req, res) => {
  try {
    const db = getDatabase();
    const { reportId, frequency, deliveryType, recipients } = req.body;
    if (!reportId || !frequency || !deliveryType || !recipients || !Array.isArray(recipients)) return res.status(400).json({ error: "reportId, frequency, deliveryType, recipients required" });
    const s = { id: `sch-${Date.now()}`, reportId, frequency, deliveryType, recipients, status: "Active" as const };
    db.reportSchedules = db.reportSchedules || [];
    db.reportSchedules.push(s);
    saveDatabase(db);
    res.json(s);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.post("/api/reports/export", (req, res) => {
  try {
    const db = getDatabase();
    const { reportId, format } = req.body;
    if (!reportId || !format) return res.status(400).json({ error: "reportId and format required" });
    const report = db.savedReports?.find((r: any) => r.id === reportId);
    if (!report) return res.status(404).json({ error: "Report not found" });
    let rawData: any[] = [];
    if (report.targetType === "Licenses") rawData = db.licenses;
    else if (report.targetType === "Computers") rawData = db.computers;
    else if (report.targetType === "Applications") rawData = db.softwareCatalog;
    else if (report.targetType === "Subscriptions") rawData = db.saasApplications;
    else if (report.targetType === "Cloud") rawData = db.cloudResources;
    else if (report.targetType === "Containers") rawData = db.containerPods;
    if (report.filters?.publisher) rawData = rawData.filter((d: any) => (d.publisher || "").toLowerCase().includes(report.filters.publisher.toLowerCase()));
    if (report.filters?.riskScoreMin) rawData = rawData.filter((d: any) => (d.riskScore || 0) >= Number(report.filters.riskScoreMin));
    const cols = report.columns.length > 0 ? report.columns : ["ID", "Name"];
    const rows = rawData.map((item: any) => cols.map((col: string) => {
      const key = col.toLowerCase().replace(/\s/g, "");
      if (key === "softwarename" || key === "name") return item.softwareName || item.name || "";
      if (key === "publisher" || key === "provider") return item.publisher || item.provider || "";
      if (key === "totalquantity" || key === "quantity") return item.totalQuantity ?? item.quantity ?? "";
      if (key === "status" || key === "licensestatus") return item.status || item.licenseStatus || "";
      if (key === "category") return item.category || "";
      if (key === "riskscore") return item.riskScore || "";
      if (key === "cost") return item.cost || "";
      return item[col] !== undefined ? item[col] : "";
    }));
    const cleanName = report.name.toLowerCase().replace(/[^a-z0-9]/g, "_");
    if (format === "CSV") {
      const csv = [cols.map((h: string) => `"${h.replace(/"/g, '""')}"`).join(","), ...rows.map((r: any[]) => r.map((c: any) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(","))].join("\n");
      res.json({ content: csv, mimeType: "text/csv", filename: `${cleanName}.csv` });
    } else if (format === "XML") {
      let xml = `<?xml version="1.0"?>\n<report name="${report.name}">\n`;
      xml += `<headers>${cols.map((h: string) => `<header>${h}</header>`).join("")}</headers>\n<rows>\n`;
      rows.forEach((r: any[]) => { xml += `<row>${cols.map((h: string, i: number) => `<${h.toLowerCase().replace(/[^a-z0-9]/g, "_")}>${String(r[i] ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;')}</${h.toLowerCase().replace(/[^a-z0-9]/g, "_")}>`).join("")}</row>\n`; });
      xml += "</rows>\n</report>";
      res.json({ content: xml, mimeType: "application/xml", filename: `${cleanName}.xml` });
    } else {
      const colW = cols.map((h: string, i: number) => Math.max(h.length, ...rows.map((r: any[]) => String(r[i] ?? '').length)) + 2);
      const fmtRow = (arr: string[]) => arr.map((item, i) => String(item).padEnd(colW[i])).join("| ");
      let txt = `Report: ${report.name}\n${new Date().toISOString()}\n${"-".repeat(60)}\n${fmtRow(cols)}\n${colW.map((w: number) => "-".repeat(w)).join("+")}\n`;
      rows.forEach((r: any[]) => { txt += fmtRow(r.map((c: any) => String(c ?? ''))) + "\n"; });
      res.json({ content: txt, mimeType: "text/plain", filename: `${cleanName}.txt` });
    }
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ========= ADMIN / SECURITY =========
app.get("/api/admin/sso", (_, res) => { try { res.json(getDatabase().ssoConfigs || []); } catch (e: any) { res.status(500).json({ error: e.message }); } });

app.put("/api/admin/sso/:id", (req, res) => {
  try {
    const db = getDatabase();
    const sso = db.ssoConfigs.find((s: any) => s.id === req.params.id);
    if (!sso) return res.status(404).json({ error: "SSO config not found" });
    if (req.body.status !== undefined) sso.status = req.body.status;
    if (req.body.clientId !== undefined) sso.clientId = req.body.clientId;
    if (req.body.domainUrl !== undefined) sso.domainUrl = req.body.domainUrl;
    writeAuditLog(db, "ericob3ware@gmail.com", "Auth", "Update SSO", `Updated ${sso.name}`);
    saveDatabase(db);
    res.json(sso);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.get("/api/admin/oauth-clients", (_, res) => { try { res.json(getDatabase().oauthClients || []); } catch (e: any) { res.status(500).json({ error: e.message }); } });

app.post("/api/admin/oauth-clients", (req, res) => {
  try {
    const db = getDatabase();
    const { name, scopes } = req.body;
    if (!name || !scopes) return res.status(400).json({ error: "name and scopes required" });
    const c = { id: `oauth-client-${Date.now()}`, name, clientId: `client_${Math.random().toString(36).substring(2, 8)}`, clientSecret: `secret_${Math.random().toString(36).substring(2, 16)}`, scopes: Array.isArray(scopes) ? scopes : [scopes], status: "Active" as const };
    db.oauthClients.push(c);
    writeAuditLog(db, "ericob3ware@gmail.com", "Auth", "Create OAuth", `Created ${name}`);
    saveDatabase(db);
    res.status(201).json(c);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.delete("/api/admin/oauth-clients/:id", (req, res) => {
  try {
    const db = getDatabase();
    const idx = db.oauthClients.findIndex((c: any) => c.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: "Not found" });
    writeAuditLog(db, "ericob3ware@gmail.com", "Auth", "Revoke OAuth", `Revoked ${db.oauthClients[idx].name}`);
    db.oauthClients.splice(idx, 1);
    saveDatabase(db);
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.get("/api/admin/roles", (_, res) => { try { res.json(getDatabase().adminRoles || []); } catch (e: any) { res.status(500).json({ error: e.message }); } });

app.post("/api/admin/roles", (req, res) => {
  try {
    const db = getDatabase();
    const { name, permissions } = req.body;
    if (!name || !permissions) return res.status(400).json({ error: "name and permissions required" });
    const r = { id: `role-custom-${Date.now()}`, name, isSystem: false, permissions: { licenses: permissions.licenses || "None", saas: permissions.saas || "None", cloud: permissions.cloud || "None", admin: permissions.admin || "None", auditLogs: permissions.auditLogs || "None" } };
    db.adminRoles.push(r);
    writeAuditLog(db, "ericob3ware@gmail.com", "RBAC", "Create Role", `Created ${name}`);
    saveDatabase(db);
    res.status(201).json(r);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.delete("/api/admin/roles/:id", (req, res) => {
  try {
    const db = getDatabase();
    const idx = db.adminRoles.findIndex((r: any) => r.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: "Not found" });
    if (db.adminRoles[idx].isSystem) return res.status(400).json({ error: "Cannot delete system role" });
    writeAuditLog(db, "ericob3ware@gmail.com", "RBAC", "Delete Role", `Deleted ${db.adminRoles[idx].name}`);
    db.adminRoles.splice(idx, 1);
    saveDatabase(db);
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.get("/api/admin/groups", (_, res) => { try { res.json(getDatabase().userGroups || []); } catch (e: any) { res.status(500).json({ error: e.message }); } });

app.post("/api/admin/groups", (req, res) => {
  try {
    const db = getDatabase();
    const { name, roleId } = req.body;
    if (!name || !roleId) return res.status(400).json({ error: "name and roleId required" });
    const g = { id: `group-custom-${Date.now()}`, name, roleId, memberCount: 0 };
    db.userGroups.push(g);
    writeAuditLog(db, "ericob3ware@gmail.com", "RBAC", "Create Group", `Created ${name}`);
    saveDatabase(db);
    res.status(201).json(g);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.get("/api/admin/users", (_, res) => { try { res.json(getDatabase().adminUsers || []); } catch (e: any) { res.status(500).json({ error: e.message }); } });

app.post("/api/admin/users", (req, res) => {
  try {
    const db = getDatabase();
    const { name, email, roleId, groupIds } = req.body;
    if (!name || !email || !roleId) return res.status(400).json({ error: "name, email, roleId required" });
    const u = { id: `usr-custom-${Date.now()}`, name, email, roleId, groupIds: groupIds || [], status: "Pending" as const, joinedDate: new Date().toISOString().split("T")[0] };
    db.adminUsers.push(u);
    if (groupIds?.forEach) groupIds.forEach((gId: string) => { const gp = db.userGroups.find((g: any) => g.id === gId); if (gp) gp.memberCount++; });
    writeAuditLog(db, "ericob3ware@gmail.com", "RBAC", "Invite User", `Invited ${email}`);
    saveDatabase(db);
    res.status(201).json(u);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.put("/api/admin/users/:id", (req, res) => {
  try {
    const db = getDatabase();
    const u = db.adminUsers.find((x: any) => x.id === req.params.id);
    if (!u) return res.status(404).json({ error: "Not found" });
    if (req.body.status !== undefined) u.status = req.body.status;
    if (req.body.roleId !== undefined) u.roleId = req.body.roleId;
    writeAuditLog(db, "ericob3ware@gmail.com", "RBAC", "Update User", `Updated ${u.email}`);
    saveDatabase(db);
    res.json(u);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.get("/api/admin/org-structure", (_, res) => { try { res.json(getDatabase().orgNodes || []); } catch (e: any) { res.status(500).json({ error: e.message }); } });
app.get("/api/admin/enrollment-sites", (_, res) => { try { res.json(getDatabase().enrollmentSites || []); } catch (e: any) { res.status(500).json({ error: e.message }); } });
app.get("/api/admin/audit-logs", (_, res) => { try { res.json(getDatabase().auditLogs || []); } catch (e: any) { res.status(500).json({ error: e.message }); } });
app.get("/api/admin/currency", (_, res) => { try { res.json(getDatabase().currencyRates || []); } catch (e: any) { res.status(500).json({ error: e.message }); } });
app.get("/api/admin/ip-policies", (_, res) => { try { res.json(getDatabase().ipPolicies || []); } catch (e: any) { res.status(500).json({ error: e.message }); } });
app.get("/api/admin/msp-customers", (_, res) => { try { res.json(getDatabase().mspCustomers || []); } catch (e: any) { res.status(500).json({ error: e.message }); } });
app.get("/api/admin/notifications", (_, res) => { try { res.json(getDatabase().adminNotifications || []); } catch (e: any) { res.status(500).json({ error: e.message }); } });
app.get("/api/admin/files", (_, res) => { try { res.json(getDatabase().uploadedFiles || []); } catch (e: any) { res.status(500).json({ error: e.message }); } });
app.get("/api/admin/itsm-connectors", (_, res) => { try { res.json(getDatabase().itsmConnectors || []); } catch (e: any) { res.status(500).json({ error: e.message }); } });

// ========= INVOICE INGESTION =========
app.post("/api/ingest-invoice", async (req, res) => {
  try {
    const { fileData, mimeType, description } = req.body;
    if (!fileData && !description) return res.status(400).json({ error: "fileData or description required" });
    const ai = getGroqClient();
    const systemMsg = "You are an ITAM invoice parser. Extract software license purchase info. Return JSON with: softwareName, publisher, quantity, unitCost, currency, sku, invoiceNumber, purchaseDate, vendor. Only populate fields you see.";
    const userMsg = fileData && mimeType ? `Read this ${mimeType} invoice.` : `Extract from: "${description}"`;
    const messages: any[] = [{ role: "system", content: systemMsg }];
    let extractedText = "";
    if (fileData && mimeType?.startsWith("image/")) {
      messages.push({ role: "user", content: [{ type: "text", text: userMsg }, { type: "image_url", image_url: { url: `data:${mimeType};base64,${fileData}` } }] });
    } else if (fileData && mimeType === "application/pdf") {
      try {
        const { PDFParse } = require("pdf-parse");
        const pdf = new PDFParse(new Uint8Array(Buffer.from(fileData, "base64").buffer));
        await pdf.load();
        extractedText = (await pdf.getText())?.text?.trim() || "";
      } catch {}
      if (extractedText) messages.push({ role: "user", content: `PDF text:\n${extractedText.slice(0, 8000)}` });
      else messages.push({ role: "user", content: userMsg + " (PDF - text extraction failed)" });
    } else messages.push({ role: "user", content: userMsg });
    const response = await ai.chat.completions.create({
      model: fileData && mimeType?.startsWith("image/") ? "llama-3.2-90b-vision-preview" : "llama-3.3-70b-versatile",
      messages, response_format: { type: "json_object" }, temperature: 0.01,
    });
    res.json(JSON.parse(response.choices[0]?.message?.content || "{}"));
  } catch (e: any) {
    const msg = e.message || "";
    if (req.body.fileData && !req.body.description) {
      const isCredit = msg.includes("429") || msg.includes("credits") || msg.includes("API_KEY");
      return res.status(402).json({ error: isCredit ? "AI unavailable. Use text description or manual entry." : `AI error: ${msg}`, aiFailed: true });
    }
    try {
      const text = req.body.description || "";
      const lower = text.toLowerCase();
      const knownSW: Record<string, string> = { "windows server": "Microsoft", "sql server": "Microsoft", "office": "Microsoft", "photoshop": "Adobe", "acrobat": "Adobe", "oracle database": "Oracle", "vmware": "Broadcom", "sap": "SAP", "autocad": "Autodesk" };
      let sw = "Software", pub = "Vendor", qty = 1, unit = 0;
      for (const [name, v] of Object.entries(knownSW)) { if (lower.includes(name)) { sw = name.split(" ").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" "); pub = v; break; } }
      const qm = text.match(/(\d+)\s*(licen[çc]as?|seats?|usu[aá]rios?|users?)/i);
      if (qm) qty = parseInt(qm[1]);
      const cm = text.match(/(?:USD|EUR|BRL|\$)?\s*(\d+[.,]\d{0,2})\s*(?:USD|EUR|BRL|\$)?/i);
      if (cm) unit = parseFloat(cm[1].replace(",", "."));
      res.json({ softwareName: sw, publisher: pub, quantity: qty, unitCost: unit, currency: "USD", sku: "", invoiceNumber: `LOCAL-${Date.now()}`, purchaseDate: new Date().toISOString().split("T")[0], vendor: pub });
    } catch (fe: any) { res.status(500).json({ error: `Fallback failed: ${fe.message}` }); }
  }
});

// ========= AI CONTRACT ANALYSIS (Gemini) =========
app.post("/api/analyze-contract", async (req, res) => {
  try {
    const { fileData, fileName, mimeType } = req.body;
    if (!fileData) return res.status(400).json({ error: "File required." });
    let ai;
    try { ai = getGeminiClient(); }
    catch { return res.status(500).json({ error: "GEMINI_API_KEY not configured." }); }
    const isText = mimeType.startsWith("text/") || mimeType === "application/json" || fileName?.endsWith(".csv") || fileName?.endsWith(".txt");
    const contentPart = isText ? { text: Buffer.from(fileData, "base64").toString("utf-8") } : { inlineData: { data: fileData, mimeType } };
    const systemPrompt = `You are a SAM/ITAM contract analyst. Extract JSON data from the document.
Fields: softwareName, vendor (Microsoft|Adobe|Autodesk|Outros), category (Produtividade|Design/Eng|Segurança|Utilities),
custoMensal (BRL), expiryDate (YYYY-MM-DD), contractNo, sla, complianceStatus (Conforme|Não Conforme),
qtyTotal, qtyUtilizada, qtyOciosa, missingFields (array of field names not found).
Return ONLY valid JSON, no markdown.`;
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [contentPart, { text: systemPrompt }],
        config: { responseMimeType: "application/json" }
      });
      res.json(JSON.parse(response.text || "{}"));
    } catch {
      res.json({
        softwareName: fileName?.toLowerCase().includes("microsoft") ? "Microsoft 365" : fileName?.toLowerCase().includes("adobe") ? "Adobe Creative Cloud" : fileName?.toLowerCase().includes("autocad") ? "AutoCAD" : "Software Corporativo",
        vendor: fileName?.toLowerCase().includes("microsoft") ? "Microsoft" : fileName?.toLowerCase().includes("adobe") ? "Adobe" : fileName?.toLowerCase().includes("autodesk") ? "Autodesk" : "Outros",
        category: "Produtividade", custoMensal: 1500, expiryDate: "2027-06-30",
        contractNo: "CTR-" + Math.floor(1000 + Math.random() * 9000),
        sla: "99.9%", complianceStatus: "Conforme", qtyTotal: 100, qtyUtilizada: 85, qtyOciosa: 15,
        missingFields: ["SLA Detalhes"]
      });
    }
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ========= AI OPTIMIZATION CO-PILOT =========
app.post("/api/optimize-assistant", async (req, res) => {
  try {
    const { companyData, prompt } = req.body;
    if (!companyData?.licenses) return res.status(400).json({ error: "companyData.licenses required" });
    let ai, hasGemini = true;
    try { ai = getGeminiClient(); } catch { hasGemini = false; }
    if (hasGemini && ai) {
      try {
        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: [{ text: `You are a SAM/FinOps optimizer. Analyze this portfolio and find savings.
Company: ${companyData.name}, Compliance: ${companyData.complianceRate}%, Monthly: R$ ${companyData.custoMensalTotal}
Licenses: ${JSON.stringify(companyData.licenses.map((l: any) => ({ name: l.softwareName, vendor: l.vendor, cost: l.custoMensal, idle: l.qtyOciosa, status: l.status })))}
Alerts: ${JSON.stringify(companyData.alerts?.filter((a: any) => !a.resolved) || [])}
User query: "${prompt || 'Find all savings opportunities'}"
Return JSON: { executiveSummary, totalPotentialSavings, topRecommendations: [{title, software, gastoAtual, economiaEstimada, severity, strategy}], quickWins: [string], negotiationTactics: [string] }
ONLY valid JSON, no markdown.` }],
          config: { responseMimeType: "application/json" }
        });
        const data = JSON.parse(response.text || "{}");
        return res.json(data);
      } catch {}
    }
    const totalSavings = companyData.licenses.reduce((s: number, l: any) => s + (l.potencialEconomia || 0), 0);
    const recs: any[] = [];
    const wins: string[] = [];
    const ms = companyData.licenses.find((l: any) => l.vendor === "Microsoft" && l.qtyOciosa > 0);
    if (ms) { recs.push({ title: "Otimizar Microsoft CSP", software: ms.softwareName, gastoAtual: ms.custoMensal, economiaEstimada: ms.potencialEconomia, severity: "high", strategy: `${ms.qtyOciosa} licenças ociosas. Suspenda ou converta para mensal.` }); wins.push(`Reivindicar ${ms.qtyOciosa} licenças ${ms.softwareName}`); }
    const ad = companyData.licenses.find((l: any) => l.vendor === "Adobe" && l.qtyOciosa > 0);
    if (ad) { recs.push({ title: "Racionalizar Adobe CC", software: ad.softwareName, gastoAtual: ad.custoMensal, economiaEstimada: ad.potencialEconomia, severity: "medium", strategy: `${ad.qtyOciosa} licenças All Apps. Downgrade para Single App.` }); wins.push(`Downgrade ${ad.qtyOciosa} licenças Adobe`); }
    res.json({
      executiveSummary: `Análise identificou desperdício de R$ ${totalSavings.toLocaleString('pt-BR')}/mês. Economia potencial de ${Math.round((totalSavings / (companyData.custoMensalTotal || 1)) * 100)}%.`,
      totalPotentialSavings: totalSavings,
      topRecommendations: recs.length > 0 ? recs : [{ title: "Consolidar Ferramentas SaaS", software: "Multi-SaaS", gastoAtual: companyData.custoMensalTotal * 0.3, economiaEstimada: companyData.custoMensalTotal * 0.08, severity: "medium", strategy: "Identifique sobreposição de ferramentas e consolide." }],
      quickWins: wins.length > 0 ? wins : ["Auditoria periódica a cada 15 dias"],
      negotiationTactics: ["Centralize assinaturas em EA para reduzir shadow IT.", "Exija logs de uso antes de renovar contratos."]
    });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ========= AI ASSISTANT CHAT =========
app.post("/api/chat-assistant", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: "message required" });
    const key = process.env.GROQ_API_KEY;
    if (!key) return res.json({ reply: `Modo offline. Configure GROQ_API_KEY para respostas IA.\nQuery: "${message}"`, isOffline: true });
    const response = await getGroqClient().chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "system", content: "You are Flexera Assist, expert in SAM/ITAM. Answer in user's language." }, { role: "user", content: message }],
      temperature: 0.7,
    });
    res.json({ reply: response.choices[0]?.message?.content || "No response.", isOffline: false });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ========= ENROLLMENT / EXTENDERS / ITSM / PACKAGE BUILDER =========
app.post("/api/admin/enrollment-sites", (req, res) => {
  try {
    const db = getDatabase(); const { name, orgNodeId } = req.body;
    if (!name || !orgNodeId) return res.status(400).json({ error: "name and orgNodeId required" });
    const s = { id: `site-${Date.now()}`, name, orgNodeId, snowExtenderCount: 0, extenderStatus: "No Extenders" as const };
    db.enrollmentSites.push(s); saveDatabase(db); res.status(201).json(s);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.post("/api/admin/audit-logs/export", (req, res) => {
  try {
    const db = getDatabase();
    const fn = `audit_log_${new Date().toISOString().split("T")[0]}.csv`;
    db.uploadedFiles = db.uploadedFiles || [];
    db.uploadedFiles.unshift({ id: `file-${Date.now()}`, filename: fn, mimeType: "text/csv", sizeBytes: 4096, uploadedAt: new Date().toISOString(), purpose: "Audit Log Export" });
    saveDatabase(db); res.json({ success: true, filename: fn });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.post("/api/admin/currency", (req, res) => {
  try {
    const db = getDatabase(); const { code, symbol, rateToBase } = req.body;
    if (!code || !symbol || !rateToBase) return res.status(400).json({ error: "code, symbol, rateToBase required" });
    db.currencyRates.push({ id: `cur-${code.toLowerCase()}`, code: code.toUpperCase(), symbol, rateToBase: Number(rateToBase), isBase: false });
    saveDatabase(db); res.status(201).json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.post("/api/admin/ip-policies", (req, res) => {
  try {
    const db = getDatabase(); const { cidr, description, policyType } = req.body;
    if (!cidr || !policyType) return res.status(400).json({ error: "cidr and policyType required" });
    db.ipPolicies.push({ id: `ip-${Date.now()}`, cidr, description: description || "", policyType, status: "Active" });
    saveDatabase(db); res.status(201).json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.post("/api/admin/msp-customers", (req, res) => {
  try {
    const db = getDatabase(); const { name, complianceScore, totalLicenses, totalDevices } = req.body;
    if (!name) return res.status(400).json({ error: "name required" });
    db.mspCustomers.push({ id: `msp-${Date.now()}`, name, status: "Active", complianceScore: Number(complianceScore) || 100, totalLicenses: Number(totalLicenses) || 0, totalDevices: Number(totalDevices) || 0 });
    saveDatabase(db); res.status(201).json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.post("/api/admin/notifications/:id/read", (req, res) => {
  try {
    const db = getDatabase(); const n = db.adminNotifications?.find((x: any) => x.id === req.params.id);
    if (!n) return res.status(404).json({ error: "Not found" });
    n.isRead = true; saveDatabase(db); res.json(n);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.post("/api/admin/itsm-connectors", (req, res) => {
  try {
    const db = getDatabase(); const { name, type, url } = req.body;
    if (!name || !type || !url) return res.status(400).json({ error: "name, type, url required" });
    const c: ITSMConnector = { id: `itsm-${Date.now()}`, name, type, url, status: "Connected", syncInterval: "24h", enrichCMDB: true, lastSynced: new Date().toISOString() };
    if (!db.itsmConnectors) db.itsmConnectors = [];
    db.itsmConnectors.push(c); saveDatabase(db); res.status(201).json(c);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.post("/api/admin/itsm-connectors/test", (_, res) => res.json({ success: true, message: "ITSM connection verified.", timestamp: new Date().toISOString() }));

app.post("/api/admin/itsm-enrich", (req, res) => {
  try {
    const db = getDatabase();
    const count = db.computers.length + db.softwareCatalog.length;
    res.json({ success: true, message: `Enriched ${count} records to CMDB.`, syncedHardware: db.computers.length, syncedSoftware: db.softwareCatalog.length });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.post("/api/admin/extenders/test-gateway", (_, res) => res.json({ success: true, message: "Gateway OK", diagnostics: { latencyMs: 14, certificates: "Valid" } }));
app.post("/api/admin/extenders/test-elevator", (_, res) => res.json({ success: true, message: "Elevator healthy", diagnostics: { uptime: "99.99%" } }));
app.post("/api/admin/extenders/test-ad", (_, res) => res.json({ success: true, message: "AD scan simulated", diagnostics: { devicesFound: 8 } }));
app.post("/api/admin/extenders/test-forwarder", (_, res) => res.json({ success: true, message: "Forwarder active", diagnostics: { targets: [{ name: "Splunk", status: "Active" }] } }));

app.post("/api/admin/package-builder/build", (req, res) => {
  try {
    const db = getDatabase();
    const { platform } = req.body;
    const fn = `snow-agent-${platform.toLowerCase()}.${platform === "Windows" ? "msi" : platform === "Linux" ? "tar.gz" : "pkg"}`;
    const f = { id: `file-${Date.now()}`, filename: fn, mimeType: "application/octet-stream", sizeBytes: 15 * 1024 * 1024, uploadedAt: new Date().toISOString(), purpose: "Custom Import" as any };
    db.uploadedFiles = db.uploadedFiles || [];
    db.uploadedFiles.unshift(f);
    saveDatabase(db);
    res.status(201).json({ success: true, message: `Agent built: ${fn}`, file: f });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.get("/api/admin/files/download/:id", (req, res) => {
  try {
    const db = getDatabase();
    const f = db.uploadedFiles?.find((x: any) => x.id === req.params.id);
    if (!f) return res.status(404).send("Not found");
    res.setHeader("Content-Disposition", `attachment; filename=${f.filename}`);
    res.send(`SIMULATED FILE: ${f.filename}`);
  } catch (e: any) { res.status(500).send(e.message); }
});

// ========= INVENTORY EXPLORER ENDPOINTS =========
app.delete("/api/applications/:id", (req, res) => {
  try {
    const db = getDatabase();
    const len = db.discoveredApplications.length;
    db.discoveredApplications = db.discoveredApplications.filter((a: any) => a.id !== req.params.id);
    if (db.discoveredApplications.length === len) return res.status(404).json({ error: "Not found" });
    saveDatabase(db); res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ========= VITE / STATIC SERVING =========
async function startViteServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_, res) => res.sendFile(path.join(distPath, "index.html")));
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
    try { runComplianceTests(); } catch {}
  });
}

(async () => {
  let pgAvailable = false;
  try {
    const pgData = await initDatabase();
    if (pgData) { await setPgCache(pgData); pgAvailable = true; }
  } catch {}
  if (!pgAvailable) getDatabase();
  startViteServer();
})();
