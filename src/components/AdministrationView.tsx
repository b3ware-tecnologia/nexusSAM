import React, { useState, useEffect } from "react";
import { 
  Shield, 
  Key, 
  Users, 
  Network, 
  FileText, 
  DollarSign, 
  Lock, 
  Briefcase, 
  Check, 
  Plus, 
  Trash2, 
  RefreshCw, 
  Globe, 
  AlertTriangle, 
  Download, 
  Eye, 
  EyeOff, 
  Search, 
  FileDown, 
  Grid, 
  Sliders, 
  ToggleLeft, 
  ToggleRight,
  Server,
  Activity,
  UserCheck,
  Building,
  Bell,
  HardDrive,
  Bot,
  MessageSquare,
  Cpu,
  Wrench,
  Share2,
  HelpCircle,
  Send,
  Terminal,
  CheckCircle2
} from "lucide-react";
import { HintTooltip } from "./HintTooltip.js";
import { 
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
  UploadedFile 
} from "../types.js";

export function AdministrationView() {
  const [activeTab, setActiveTab] = useState<"auth" | "users" | "org" | "security" | "msp" | "audit" | "currency" | "files" | "extenders" | "itsm" | "assist">("auth");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // States
  const [ssoConfigs, setSsoConfigs] = useState<SSOConfig[]>([]);
  const [oauthClients, setOauthClients] = useState<OAuthClient[]>([]);
  const [adminRoles, setAdminRoles] = useState<AdminRole[]>([]);
  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [orgNodes, setOrgNodes] = useState<OrgNode[]>([]);
  const [enrollmentSites, setEnrollmentSites] = useState<EnrollmentSite[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [currencyRates, setCurrencyRates] = useState<CurrencyRate[]>([]);
  const [ipPolicies, setIpPolicies] = useState<IPPolicy[]>([]);
  const [mspCustomers, setMspCustomers] = useState<MSPCustomer[]>([]);
  const [adminNotifications, setAdminNotifications] = useState<AdminNotification[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  // ITSM States
  const [itsmConnectors, setItsmConnectors] = useState<any[]>([]);
  const [showItsmModal, setShowItsmModal] = useState(false);
  const [newItsmName, setNewItsmName] = useState("");
  const [newItsmType, setNewItsmType] = useState("ServiceNow");
  const [newItsmUrl, setNewItsmUrl] = useState("");
  const [newItsmSyncInterval, setNewItsmSyncInterval] = useState("12 Hours");
  const [newItsmEnrichCMDB, setNewItsmEnrichCMDB] = useState(true);
  const [itsmEnriching, setItsmEnriching] = useState(false);
  const [itsmEnrichResult, setItsmEnrichResult] = useState<any | null>(null);

  // Extender Tests State
  const [activeExtenderDiagnostic, setActiveExtenderDiagnostic] = useState<any | null>(null);
  const [testingExtender, setTestingExtender] = useState<string | null>(null);

  // Package Builder State
  const [pbPlatform, setPbPlatform] = useState<"Windows" | "Linux" | "macOS">("Windows");
  const [pbGateway, setPbGateway] = useState(true);
  const [pbElevator, setPbElevator] = useState(true);
  const [pbAD, setPbAD] = useState(true);
  const [pbForwarder, setPbForwarder] = useState(false);
  const [pbInterval, setPbInterval] = useState("12");
  const [pbCompiling, setPbCompiling] = useState(false);
  const [pbCompileStep, setPbCompileStep] = useState<string | null>(null);

  // AI Assistant Chat State
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<Array<{ sender: "user" | "bot"; text: string; timestamp: Date }>>([
    { 
      sender: "bot", 
      text: "Olá! Sou o **Flexera Assist**, o copiloto de inteligência artificial avançado integrado ao Snow Atlas.\n\nEu posso responder a dúvidas complexas sobre **licenciamento BYOL**, regras de compliance (Oracle, SAP, Microsoft), otimização de custos de SaaS, ou dar orientações passo a passo para configuração de seus gateways de coleta local (Snow Extenders) e conectores de nuvem.\n\nComo posso te ajudar hoje?", 
      timestamp: new Date() 
    }
  ]);
  const [chatLoading, setChatLoading] = useState(false);

  // Simulation status & forms
  const [selectedTenant, setSelectedTenant] = useState<string>("msp-cust-acme");
  const [newClientName, setNewClientName] = useState("");
  const [newClientScopes, setNewClientScopes] = useState<string[]>(["inventory:write"]);
  const [newlyCreatedClient, setNewlyCreatedClient] = useState<OAuthClient | null>(null);

  // User Form
  const [showUserModal, setShowUserModal] = useState(false);
  const [usrName, setUsrName] = useState("");
  const [usrEmail, setUsrEmail] = useState("");
  const [usrRole, setUsrRole] = useState("role-admin");
  const [usrGroups, setUsrGroups] = useState<string[]>([]);

  // Custom Role Form
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [roleName, setRoleName] = useState("");
  const [rolePerms, setRolePerms] = useState<Record<string, "Read" | "Write" | "None">>({
    licenses: "Read",
    saas: "Read",
    cloud: "Read",
    admin: "None",
    auditLogs: "None"
  });

  // Group Form
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [gpName, setGpName] = useState("");
  const [gpRole, setGpRole] = useState("role-user");

  // Org Node Form
  const [showNodeModal, setShowNodeModal] = useState(false);
  const [nodeName, setNodeName] = useState("");
  const [nodeCode, setNodeCode] = useState("");
  const [nodeParent, setNodeParent] = useState("");
  const [nodeLicenseCount, setNodeLicenseCount] = useState("50");

  // Enrollment Site Form
  const [showSiteModal, setShowSiteModal] = useState(false);
  const [siteName, setSiteName] = useState("");
  const [siteNodeId, setSiteNodeId] = useState("");

  // IP Policy Form
  const [showIpModal, setShowIpModal] = useState(false);
  const [ipCidr, setIpCidr] = useState("");
  const [ipDesc, setIpDesc] = useState("");
  const [ipType, setIpType] = useState<"Allow" | "Deny">("Allow");

  // Currency Form
  const [showCurModal, setShowCurModal] = useState(false);
  const [curCode, setCurCode] = useState("");
  const [curSymbol, setCurSymbol] = useState("");
  const [curRate, setCurRate] = useState("");

  // MSP Customer Form
  const [showMspModal, setShowMspModal] = useState(false);
  const [mspName, setMspName] = useState("");
  const [mspScore, setMspScore] = useState("90");
  const [mspLics, setMspLics] = useState("100");
  const [mspDevs, setMspDevs] = useState("50");

  // Audit Search/Filters
  const [auditQuery, setAuditQuery] = useState("");
  const [auditCategory, setAuditCategory] = useState("All");

  const showToast = (success: string | null, err: string | null = null) => {
    if (success) {
      setSuccessMsg(success);
      setTimeout(() => setSuccessMsg(null), 4000);
    }
    if (err) {
      setError(err);
      setTimeout(() => setError(null), 4000);
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      const endpoints = [
        { key: "sso", url: "/api/admin/sso", setter: setSsoConfigs },
        { key: "oauth", url: "/api/admin/oauth-clients", setter: setOauthClients },
        { key: "roles", url: "/api/admin/roles", setter: setAdminRoles },
        { key: "groups", url: "/api/admin/groups", setter: setUserGroups },
        { key: "users", url: "/api/admin/users", setter: setAdminUsers },
        { key: "org", url: "/api/admin/org-structure", setter: setOrgNodes },
        { key: "sites", url: "/api/admin/enrollment-sites", setter: setEnrollmentSites },
        { key: "audit", url: "/api/admin/audit-logs", setter: setAuditLogs },
        { key: "currency", url: "/api/admin/currency", setter: setCurrencyRates },
        { key: "ip", url: "/api/admin/ip-policies", setter: setIpPolicies },
        { key: "msp", url: "/api/admin/msp-customers", setter: setMspCustomers },
        { key: "notif", url: "/api/admin/notifications", setter: setAdminNotifications },
        { key: "files", url: "/api/admin/files", setter: setUploadedFiles },
        { key: "itsm", url: "/api/admin/itsm-connectors", setter: setItsmConnectors }
      ];

      await Promise.all(
        endpoints.map(async (e) => {
          const res = await fetch(e.url);
          if (res.ok) {
            const data = await res.json();
            e.setter(data);
          }
        })
      );
    } catch (e: any) {
      showToast(null, "Error connecting to Administration Service APIs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Handler to add ITSM Connector
  const handleCreateItsmConnector = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItsmName || !newItsmUrl) return;
    try {
      const res = await fetch("/api/admin/itsm-connectors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newItsmName,
          type: newItsmType,
          url: newItsmUrl,
          syncInterval: newItsmSyncInterval,
          enrichCMDB: newItsmEnrichCMDB
        })
      });
      if (res.ok) {
        showToast(`ITSM Connector "${newItsmName}" created and connected.`);
        setShowItsmModal(false);
        setNewItsmName("");
        setNewItsmUrl("");
        loadAllData();
      } else {
        showToast(null, "Failed to create ITSM connection.");
      }
    } catch (e: any) {
      showToast(null, e.message);
    }
  };

  // Test ITSM Connector
  const handleTestItsmConnection = async (type: string, url: string) => {
    try {
      const res = await fetch("/api/admin/itsm-connectors/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, url })
      });
      if (res.ok) {
        const data = await res.json();
        showToast(`Test succeeded: ${data.message}`);
      } else {
        showToast(null, "ITSM gateway handshake failed.");
      }
    } catch (e: any) {
      showToast(null, e.message);
    }
  };

  // CMDB Enrichment Trigger
  const handleTriggerItsmEnrich = async () => {
    setItsmEnriching(true);
    setItsmEnrichResult(null);
    try {
      const res = await fetch("/api/admin/itsm-enrich", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setItsmEnrichResult(data);
        showToast("CMDB Enrichment sync completed successfully.");
        loadAllData();
      } else {
        showToast(null, "CMDB Enrichment sync aborted due to server error.");
      }
    } catch (e: any) {
      showToast(null, e.message);
    } finally {
      setItsmEnriching(false);
    }
  };

  // Snow Extender diagnostic test triggers
  const handleTestExtenderComponent = async (component: "gateway" | "elevator" | "ad" | "forwarder") => {
    setTestingExtender(component);
    setActiveExtenderDiagnostic(null);
    try {
      const res = await fetch(`/api/admin/extenders/test-${component}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteId: "site-1" })
      });
      if (res.ok) {
        const data = await res.json();
        setActiveExtenderDiagnostic(data);
        showToast(`Extender ${component} test successfully completed.`);
      } else {
        showToast(null, "Extender diagnostic test failed to reply.");
      }
    } catch (e: any) {
      showToast(null, e.message);
    } finally {
      setTestingExtender(null);
    }
  };

  // Agent Package Builder trigger
  const handleBuildAgentPackage = async () => {
    setPbCompiling(true);
    setPbCompileStep("Assembling package components...");
    
    // Simulate compilation steps
    setTimeout(() => {
      setPbCompileStep("Applying configurations and scan interval variables...");
      setTimeout(() => {
        setPbCompileStep("Injecting cryptographic secure certificates and code-signing...");
        setTimeout(async () => {
          try {
            const res = await fetch("/api/admin/package-builder/build", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                platform: pbPlatform,
                bundleGateway: pbGateway,
                bundleElevator: pbElevator,
                bundleAD: pbAD,
                bundleForwarder: pbForwarder,
                scanIntervalHours: pbInterval
              })
            });
            if (res.ok) {
              const data = await res.json();
              showToast("Agent package successfully compiled. Access under 'My Vault' or click Download!");
              loadAllData();
              
              // Direct download simulation
              if (data.file && data.file.id) {
                const downloadUrl = `/api/admin/files/download/${data.file.id}`;
                const a = document.createElement("a");
                a.href = downloadUrl;
                a.download = data.file.filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
              }
            } else {
              showToast(null, "Failed to compile custom installer package.");
            }
          } catch (e: any) {
            showToast(null, e.message);
          } finally {
            setPbCompiling(false);
            setPbCompileStep(null);
          }
        }, 1200);
      }, 1000);
    }, 800);
  };

  // AI Assistant Chat trigger
  const handleSendChatMessage = async (textOverride?: string) => {
    const textToSend = textOverride || chatInput;
    if (!textToSend.trim()) return;

    const userMsg = { sender: "user" as const, text: textToSend, timestamp: new Date() };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput("");
    setChatLoading(true);

    try {
      const res = await fetch("/api/chat-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: textToSend })
      });
      if (res.ok) {
        const data = await res.json();
        setChatMessages(prev => [...prev, {
          sender: "bot" as const,
          text: data.reply,
          timestamp: new Date()
        }]);
      } else {
        setChatMessages(prev => [...prev, {
          sender: "bot" as const,
          text: "Desculpe, ocorreu um erro de conexão com o serviço do Flexera Assist AI. Por favor, tente novamente.",
          timestamp: new Date()
        }]);
      }
    } catch (e: any) {
      setChatMessages(prev => [...prev, {
        sender: "bot" as const,
        text: `Erro de rede ao falar com a Inteligência Artificial: ${e.message}`,
        timestamp: new Date()
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  // Update SSO toggles
  const handleToggleSSO = async (ssoId: string, currentStatus: "Enabled" | "Disabled") => {
    const nextStatus = currentStatus === "Enabled" ? "Disabled" : "Enabled";
    try {
      const res = await fetch(`/api/admin/sso/${ssoId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus })
      });
      if (res.ok) {
        showToast(`SSO Provider status updated to ${nextStatus}.`);
        loadAllData();
      } else {
        showToast(null, "Failed to update SSO status.");
      }
    } catch (e: any) {
      showToast(null, e.message);
    }
  };

  // Create OAuth Client
  const handleCreateOAuthClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName) return;
    try {
      const res = await fetch("/api/admin/oauth-clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newClientName, scopes: newClientScopes })
      });
      if (res.ok) {
        const data = await res.json();
        setNewlyCreatedClient(data);
        setNewClientName("");
        showToast("OAuth 2.0 Credential Client Key provisioned successfully.");
        loadAllData();
      } else {
        showToast(null, "Failed to create OAuth client credential.");
      }
    } catch (e: any) {
      showToast(null, e.message);
    }
  };

  // Revoke OAuth Client
  const handleRevokeOAuthClient = async (id: string) => {
    if (!confirm("Are you sure you want to permanently revoke this API client key? On-premises Snow Extenders using this key will immediately lose connectivity.")) return;
    try {
      const res = await fetch(`/api/admin/oauth-clients/${id}`, { method: "DELETE" });
      if (res.ok) {
        showToast("OAuth Client Key revoked.");
        loadAllData();
      }
    } catch (e: any) {
      showToast(null, e.message);
    }
  };

  // Add Admin User
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usrName || !usrEmail) return;
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: usrName, email: usrEmail, roleId: usrRole, groupIds: usrGroups })
      });
      if (res.ok) {
        setUsrName("");
        setUsrEmail("");
        setUsrGroups([]);
        setShowUserModal(false);
        showToast("Admin User invited. Action logged to audit logs.");
        loadAllData();
      }
    } catch (e: any) {
      showToast(null, e.message);
    }
  };

  // Add Custom Role
  const handleAddRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleName) return;
    try {
      const res = await fetch("/api/admin/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: roleName, permissions: rolePerms })
      });
      if (res.ok) {
        setRoleName("");
        setRolePerms({ licenses: "Read", saas: "Read", cloud: "Read", admin: "None", auditLogs: "None" });
        setShowRoleModal(false);
        showToast("Custom granular role created successfully.");
        loadAllData();
      }
    } catch (e: any) {
      showToast(null, e.message);
    }
  };

  // Delete Custom Role
  const handleDeleteRole = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/roles/${id}`, { method: "DELETE" });
      if (res.ok) {
        showToast("Custom role deleted.");
        loadAllData();
      } else {
        const data = await res.json();
        showToast(null, data.error || "Failed to delete role.");
      }
    } catch (e: any) {
      showToast(null, e.message);
    }
  };

  // Add User Group
  const handleAddGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gpName) return;
    try {
      const res = await fetch("/api/admin/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: gpName, roleId: gpRole })
      });
      if (res.ok) {
        setGpName("");
        setShowGroupModal(false);
        showToast("Security User Group configured.");
        loadAllData();
      }
    } catch (e: any) {
      showToast(null, e.message);
    }
  };

  // Add Org Node
  const handleAddNode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nodeName || !nodeCode) return;
    try {
      const res = await fetch("/api/admin/org-structure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: nodeName,
          code: nodeCode,
          parentId: nodeParent || undefined,
          allocatedLicenseCount: Number(nodeLicenseCount)
        })
      });
      if (res.ok) {
        setNodeName("");
        setNodeCode("");
        setNodeParent("");
        setShowNodeModal(false);
        showToast("Organization Hierarchy Node added and licenses allocated.");
        loadAllData();
      }
    } catch (e: any) {
      showToast(null, e.message);
    }
  };

  // Add Enrollment Site
  const handleAddSite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteName || !siteNodeId) return;
    try {
      const res = await fetch("/api/admin/enrollment-sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: siteName, orgNodeId: siteNodeId })
      });
      if (res.ok) {
        setSiteName("");
        setSiteNodeId("");
        setShowSiteModal(false);
        showToast("On-premises Enrollment Site registered.");
        loadAllData();
      }
    } catch (e: any) {
      showToast(null, e.message);
    }
  };

  // Add IP Policy
  const handleAddIpPolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ipCidr) return;
    try {
      const res = await fetch("/api/admin/ip-policies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cidr: ipCidr, description: ipDesc, policyType: ipType })
      });
      if (res.ok) {
        setIpCidr("");
        setIpDesc("");
        setShowIpModal(false);
        showToast("Inbound network firewall rule appended.");
        loadAllData();
      }
    } catch (e: any) {
      showToast(null, e.message);
    }
  };

  // Delete IP Policy
  const handleDeleteIpPolicy = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/ip-policies/${id}`, { method: "DELETE" });
      if (res.ok) {
        showToast("Inbound IP rule removed.");
        loadAllData();
      }
    } catch (e: any) {
      showToast(null, e.message);
    }
  };

  // Add Currency
  const handleAddCurrency = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!curCode || !curSymbol || !curRate) return;
    try {
      const res = await fetch("/api/admin/currency", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: curCode, symbol: curSymbol, rateToBase: Number(curRate) })
      });
      if (res.ok) {
        setCurCode("");
        setCurSymbol("");
        setCurRate("");
        setShowCurModal(false);
        showToast("Conversion exchange currency pair updated.");
        loadAllData();
      }
    } catch (e: any) {
      showToast(null, e.message);
    }
  };

  // Add MSP Customer
  const handleAddMspCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mspName) return;
    try {
      const res = await fetch("/api/admin/msp-customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: mspName,
          complianceScore: Number(mspScore),
          totalLicenses: Number(mspLics),
          totalDevices: Number(mspDevs)
        })
      });
      if (res.ok) {
        setMspName("");
        setShowMspModal(false);
        showToast("Multi-tenant customer node provisioned.");
        loadAllData();
      }
    } catch (e: any) {
      showToast(null, e.message);
    }
  };

  // Export Audit Logs Action
  const handleExportAuditLogs = async () => {
    try {
      const res = await fetch("/api/admin/audit-logs/export", { method: "POST" });
      if (res.ok) {
        showToast("Audit logs exported to My Files successfully.");
        loadAllData();
      }
    } catch (e: any) {
      showToast(null, e.message);
    }
  };

  // Read notification
  const handleReadNotification = async (id: string) => {
    try {
      await fetch(`/api/admin/notifications/${id}/read`, { method: "POST" });
      loadAllData();
    } catch (e) {}
  };

  // Delete file
  const handleDeleteFile = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/files/${id}`, { method: "DELETE" });
      if (res.ok) {
        showToast("File deleted from workspace vault.");
        loadAllData();
      }
    } catch (e) {}
  };

  // Switch MSP Tenant simulation helper
  const activeTenantObj = mspCustomers.find(c => c.id === selectedTenant) || mspCustomers[0];

  // Filters for Audit Log
  const filteredAudits = auditLogs.filter(log => {
    const matchesQuery = 
      log.userEmail.toLowerCase().includes(auditQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(auditQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(auditQuery.toLowerCase());
    
    const matchesCategory = auditCategory === "All" || log.category === auditCategory;
    return matchesQuery && matchesCategory;
  });

  return (
    <div className="space-y-6" id="admin-module-container">
      {/* Banner Toast Alerts */}
      {successMsg && (
        <div className="flex items-center gap-3 bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 px-4 py-3 rounded-lg text-sm animate-fade-in" id="admin-toast-success">
          <Check className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-3 bg-rose-950/40 border border-rose-500/30 text-rose-300 px-4 py-3 rounded-lg text-sm animate-fade-in" id="admin-toast-error">
          <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-800 pb-5" id="admin-header-row">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white" id="admin-main-title">
              <Shield className="h-6 w-6 text-indigo-500" />
              Configurações de Administração e Segurança
            </h1>
            <HintTooltip text="Configure configurações do sistema: autenticação SSO, integrações de API, controle de acesso baseado em funções, hierarquia organizacional e monitoramento de logs de auditoria." side="right" size="md" />
          </div>
          <p className="text-sm text-gray-400 mt-1" id="admin-subtitle">
            Gerencie single sign-on empresarial, isolamento de locatários, firewalls de rede, RBAC de função personalizada e consolidação multimoeda.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0" id="admin-quick-switches">
          {/* Active Tenant Switcher Simulation */}
          <div className="flex items-center gap-2 bg-gray-900 border border-gray-800 px-3 py-1.5 rounded-lg text-xs text-gray-300" id="tenant-sw-wrapper">
            <Briefcase className="h-3.5 w-3.5 text-[#366BB2]/60" />
            <span>Cliente MSP Ativo:</span>
            <select 
              value={selectedTenant} 
              onChange={(e) => {
                setSelectedTenant(e.target.value);
                showToast(`Switched active enterprise tenant profile to: ${mspCustomers.find(c => c.id === e.target.value)?.name || "Acme"}`);
              }}
              className="bg-gray-950 text-indigo-300 border-none outline-none font-medium cursor-pointer py-0.5 focus:ring-0"
              id="tenant-dropdown-picker"
            >
              {mspCustomers.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <button 
            onClick={loadAllData} 
            className="flex items-center gap-1 bg-gray-900 hover:bg-gray-800 text-gray-300 px-3 py-1.5 rounded-lg text-xs transition border border-gray-800"
            id="admin-btn-sync"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            Sincronizar Config
          </button>
        </div>
      </div>

      {/* Sub-Tabs Grid Layout */}
      <div className="flex flex-col lg:flex-row gap-6" id="admin-workspace-grid">
        {/* Navigation Rail */}
        <div className="lg:w-64 shrink-0 space-y-1" id="admin-tabs-nav-list">
          <button
            onClick={() => setActiveTab("auth")}
            className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition font-medium ${
              activeTab === "auth" 
                ? "bg-indigo-600/15 border-l-2 border-[#366BB2] text-indigo-200" 
                : "text-gray-400 hover:bg-gray-900 hover:text-white"
            }`}
            id="tab-auth"
          >
            <Key className="h-4 w-4" />
            Clientes SSO e Chaves de API
          </button>

          <button
            onClick={() => setActiveTab("users")}
            className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition font-medium ${
              activeTab === "users" 
                ? "bg-indigo-600/15 border-l-2 border-[#366BB2] text-indigo-200" 
                : "text-gray-400 hover:bg-gray-900 hover:text-white"
            }`}
            id="tab-users"
          >
            <Users className="h-4 w-4" />
            Usuários e Funções RBAC
          </button>

          <button
            onClick={() => setActiveTab("org")}
            className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition font-medium ${
              activeTab === "org" 
                ? "bg-indigo-600/15 border-l-2 border-[#366BB2] text-indigo-200" 
                : "text-gray-400 hover:bg-gray-900 hover:text-white"
            }`}
            id="tab-org"
          >
            <Network className="h-4 w-4" />
            Hierarquia Organizacional e Nós
          </button>

          <button
            onClick={() => setActiveTab("security")}
            className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition font-medium ${
              activeTab === "security" 
                ? "bg-indigo-600/15 border-l-2 border-[#366BB2] text-indigo-200" 
                : "text-gray-400 hover:bg-gray-900 hover:text-white"
            }`}
            id="tab-security"
          >
            <Lock className="h-4 w-4" />
            Firewalls de IP e LGPD
          </button>

          <button
            onClick={() => setActiveTab("msp")}
            className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition font-medium ${
              activeTab === "msp" 
                ? "bg-indigo-600/15 border-l-2 border-[#366BB2] text-indigo-200" 
                : "text-gray-400 hover:bg-gray-900 hover:text-white"
            }`}
            id="tab-msp"
          >
            <Briefcase className="h-4 w-4" />
            Camada de Parceiro MSP
          </button>

          <button
            onClick={() => setActiveTab("audit")}
            className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition font-medium ${
              activeTab === "audit" 
                ? "bg-indigo-600/15 border-l-2 border-[#366BB2] text-indigo-200" 
                : "text-gray-400 hover:bg-gray-900 hover:text-white"
            }`}
            id="tab-audit"
          >
            <Activity className="h-4 w-4" />
            Trilha de Ações de Auditoria
          </button>

          <button
            onClick={() => setActiveTab("currency")}
            className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition font-medium ${
              activeTab === "currency" 
                ? "bg-indigo-600/15 border-l-2 border-[#366BB2] text-indigo-200" 
                : "text-gray-400 hover:bg-gray-900 hover:text-white"
            }`}
            id="tab-currency"
          >
            <DollarSign className="h-4 w-4" />
            Moeda Consolidada
          </button>

          <button
            onClick={() => setActiveTab("files")}
            className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition font-medium ${
              activeTab === "files" 
                ? "bg-indigo-600/15 border-l-2 border-[#366BB2] text-indigo-200" 
                : "text-gray-400 hover:bg-gray-900 hover:text-white"
            }`}
            id="tab-files"
          >
            <HardDrive className="h-4 w-4" />
            Meu Cofre e Notificações
          </button>

          <button
            onClick={() => setActiveTab("extenders")}
            className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition font-medium ${
              activeTab === "extenders" 
                ? "bg-indigo-600/15 border-l-2 border-[#366BB2] text-indigo-200" 
                : "text-gray-400 hover:bg-gray-900 hover:text-white"
            }`}
            id="tab-extenders"
          >
            <Server className="h-4 w-4" />
            Snow Extenders e Construtor
          </button>

          <button
            onClick={() => setActiveTab("itsm")}
            className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition font-medium ${
              activeTab === "itsm" 
                ? "bg-indigo-600/15 border-l-2 border-[#366BB2] text-indigo-200" 
                : "text-gray-400 hover:bg-gray-900 hover:text-white"
            }`}
            id="tab-itsm"
          >
            <Share2 className="h-4 w-4" />
            Integrações ITSM
          </button>

          <button
            onClick={() => setActiveTab("assist")}
            className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition font-medium ${
              activeTab === "assist" 
                ? "bg-indigo-600/15 border-l-2 border-[#366BB2] text-indigo-200" 
                : "text-gray-400 hover:bg-gray-900 hover:text-white"
            }`}
            id="tab-assist"
          >
            <Bot className="h-4 w-4" />
            Flexera Assist IA
          </button>

          {/* Micro stats block */}
          <div className="pt-6 border-t border-gray-800 mt-6 hidden lg:block" id="admin-micro-stats">
            <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Saúde do Workspace</h5>
            <div className="bg-gray-950 p-3 rounded-lg border border-gray-900 space-y-2 text-[11px] text-gray-400">
              <div className="flex justify-between">
                <span>Status SSO</span>
                <span className="text-emerald-400 font-medium">Totalmente Ativo</span>
              </div>
              <div className="flex justify-between">
                <span>Gateways Heartbeat</span>
                <span className="text-emerald-400 font-medium">2 Ativos</span>
              </div>
              <div className="flex justify-between">
                <span>Registros de Auditoria</span>
                <span className="text-gray-300">{auditLogs.length} registrados</span>
              </div>
              <div className="flex justify-between">
                <span>Criptografia</span>
                <span className="text-[#366BB2]/60 font-medium">AES-256 Habilitado</span>
              </div>
            </div>
          </div>
        </div>

        {/* Workspace Display Area */}
        <div className="flex-1 min-w-0" id="admin-active-view-panel">
          {/* TAB 1: SSO & OAUTH CREDENTIALS */}
          {activeTab === "auth" && (
            <div className="space-y-6" id="auth-tab-content">
              {/* SSO Section */}
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                <div className="flex items-center justify-between border-b border-gray-800 pb-4 mb-4">
                  <div>
                    <h3 className="text-base font-semibold text-white">Integração de Identidade Corporativa e SSO</h3>
                    <p className="text-xs text-gray-400 mt-1">
                      Configure e gerencie integrações OAuth 2.0 / OpenID Connect e SAML para acesso ativo de funcionários.
                    </p>
                  </div>
                  <Lock className="h-5 w-5 text-[#366BB2]/60 shrink-0" />
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  {ssoConfigs.map(sso => (
                    <div key={sso.id} className="bg-gray-950 rounded-lg p-4 border border-gray-800 flex flex-col justify-between" id={`sso-card-${sso.id}`}>
                      <div>
                        <div className="flex justify-between items-start">
                          <span className="text-xs font-semibold text-[#366BB2]/60 uppercase tracking-wider">{sso.provider}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                            sso.status === "Enabled" 
                              ? "bg-emerald-950 text-emerald-300 border border-emerald-500/20" 
                              : "bg-gray-900 text-gray-500 border border-gray-800"
                          }`}>
                            {sso.status}
                          </span>
                        </div>
                        <h4 className="font-semibold text-sm text-white mt-1">{sso.name}</h4>
                        <div className="space-y-1 mt-3 text-xs text-gray-400">
                          <div className="flex justify-between"><span className="text-gray-500">Domain:</span> <span className="font-mono text-[11px] truncate max-w-[150px]" title={sso.domainUrl}>{sso.domainUrl}</span></div>
                          <div className="flex justify-between"><span className="text-gray-500">Client ID:</span> <span className="font-mono text-[11px] truncate max-w-[150px]">{sso.clientId}</span></div>
                        </div>
                      </div>

                      <div className="border-t border-gray-800 pt-3 mt-4 flex items-center justify-between">
                        <button 
                          onClick={() => handleToggleSSO(sso.id, sso.status)} 
                          className={`text-[11px] px-2.5 py-1 rounded font-medium transition ${
                            sso.status === "Enabled" 
                              ? "bg-amber-950 text-amber-300 border border-amber-500/20 hover:bg-amber-900" 
                              : "bg-emerald-950 text-emerald-300 border border-emerald-500/20 hover:bg-emerald-900"
                          }`}
                        >
                          {sso.status === "Enabled" ? "Desativar Provedor" : "Ativar Provedor"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* OAuth 2.0 Clients (API Credentials) */}
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                <div className="flex items-center justify-between border-b border-gray-800 pb-4 mb-4">
                  <div>
                    <h3 className="text-base font-semibold text-white">Chaves de Cliente de Segurança OAuth 2.0</h3>
                    <p className="text-xs text-gray-400 mt-1">
                      Credenciais para transmissão segura de dados de entrada. Usadas por <strong>Snow Extenders</strong> locais, ServiceNow e agentes CMDB externos.
                    </p>
                  </div>
                  <Key className="h-5 w-5 text-[#366BB2]/60 shrink-0" />
                </div>

                {/* Securely display newly created client credentials */}
                {newlyCreatedClient && (
                  <div className="bg-amber-950/40 border border-amber-500/30 rounded-lg p-4 mb-6 space-y-3 animate-fade-in text-xs" id="newly-created-credentials-banner">
                    <div className="flex items-center gap-2 text-amber-300 font-semibold uppercase tracking-wider text-[11px]">
                      <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
                      CRÍTICO: Copie as credenciais agora!
                    </div>
                    <p className="text-amber-100">
                      O segredo do cliente é hash imediatamente. Nunca mais será exibido para você.
                    </p>
                    <div className="font-mono space-y-1.5 bg-gray-950 p-3 rounded border border-gray-800">
                      <div className="flex justify-between"><span className="text-gray-500">Client ID:</span> <span className="text-white select-all">{newlyCreatedClient.clientId}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Client Secret:</span> <span className="text-amber-400 font-bold select-all">{newlyCreatedClient.clientSecret}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Required Scopes:</span> <span className="text-gray-400">{newlyCreatedClient.scopes.join(", ")}</span></div>
                    </div>
                    <button 
                      onClick={() => setNewlyCreatedClient(null)}
                      className="bg-amber-900 hover:bg-amber-800 text-amber-200 px-3 py-1 rounded font-medium transition"
                    >
                      Salvei estas credenciais
                    </button>
                  </div>
                )}

                {/* Provision client form */}
                <form onSubmit={handleCreateOAuthClient} className="bg-gray-950 border border-gray-800 p-4 rounded-lg mb-6 flex flex-col md:flex-row items-end gap-4">
                  <div className="flex-1 space-y-1">
                    <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Nome do Cliente / Integração do Agente Alvo</label>
                    <input 
                      type="text" 
                      placeholder="ex: Snow Extender Gateway - Filial Frankfurt" 
                      value={newClientName}
                      onChange={(e) => setNewClientName(e.target.value)}
                      className="w-full bg-gray-900 border border-gray-800 text-sm text-white px-3 py-1.5 rounded outline-none focus:border-[#366BB2]"
                    />
                  </div>
                  <div className="w-full md:w-64 space-y-1">
                    <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Escopos Atribuídos</label>
                    <select 
                      onChange={(e) => setNewClientScopes([e.target.value])}
                      className="w-full bg-gray-900 border border-gray-800 text-sm text-indigo-300 px-2 py-1.5 rounded outline-none"
                    >
                      <option value="inventory:write">inventory:write (Extenders)</option>
                      <option value="computers:read,licenses:read">integração somente leitura</option>
                      <option value="compliance:read">compliance:read (ServiceNow)</option>
                    </select>
                  </div>
                  <button 
                    type="submit" 
                    className="bg-[#366BB2] text-white cursor-pointer font-semibold text-xs px-4 py-2 rounded shrink-0 h-9 transition flex items-center gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" /> Provisionar Chave de Cliente de API
                  </button>
                </form>

                {/* OAuth Client list */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-gray-300">
                    <thead className="bg-gray-950 border-b border-gray-800 uppercase text-[10px] font-semibold text-gray-400">
                      <tr>
                        <th className="p-3">Nome do Identificador do Cliente</th>
                        <th className="p-3">Chave de ID do Cliente</th>
                        <th className="p-3">Escopos Permitidos</th>
                        <th className="p-3">Última Atividade Heartbeat</th>
                        <th className="p-3 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {oauthClients.map(client => (
                        <tr key={client.id} className="hover:bg-gray-950">
                          <td className="p-3 font-medium text-white">{client.name}</td>
                          <td className="p-3 font-mono text-[11px] text-gray-400">{client.clientId}</td>
                          <td className="p-3 font-mono text-[11px]">
                            {client.scopes.map(s => (
                              <span key={s} className="bg-gray-900 border border-gray-800 px-1.5 py-0.5 rounded text-[#366BB2]/60 text-[10px] mr-1">{s}</span>
                            ))}
                          </td>
                          <td className="p-3 text-gray-400">{client.lastUsedAt ? new Date(client.lastUsedAt).toLocaleString() : "Nunca ativo"}</td>
                          <td className="p-3 text-right">
                            <button 
                              onClick={() => handleRevokeOAuthClient(client.id)}
                              className="text-rose-400 hover:text-rose-300 p-1 rounded hover:bg-rose-950/20 transition"
                              title="Revoke Credential"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: RBAC & USER DIRECTORY */}
          {activeTab === "users" && (
            <div className="space-y-6" id="users-tab-content">
              {/* Users & Groups Directory */}
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                <div className="flex items-center justify-between border-b border-gray-800 pb-4 mb-4">
                  <div>
                    <h3 className="text-base font-semibold text-white">Diretório de Segurança e Controles de Acesso RBAC</h3>
                    <p className="text-xs text-gray-400 mt-1">
                      Audite perfis administrativos ativos, mapeie grupos de segurança e aplique permissões de funções.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setShowUserModal(true)} 
                      className="bg-[#366BB2] text-white cursor-pointer px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1 transition"
                    >
                      <Plus className="h-3.5 w-3.5" /> Convidar Usuário
                    </button>
                    <button 
                      onClick={() => setShowGroupModal(true)} 
                      className="bg-gray-800 hover:bg-gray-750 text-white px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1 transition border border-gray-700"
                    >
                      <Plus className="h-3.5 w-3.5" /> Novo Grupo
                    </button>
                  </div>
                </div>

                <div className="grid md:grid-cols-4 gap-4 mb-6">
                  {userGroups.map(grp => (
                    <div key={grp.id} className="bg-gray-950 border border-gray-800 p-4 rounded-lg flex flex-col justify-between" id={`group-card-${grp.id}`}>
                      <div>
                        <span className="text-[10px] bg-gray-900 border border-gray-800 px-1.5 py-0.5 rounded text-gray-400 uppercase font-mono tracking-wider">Grupo de Segurança</span>
                        <h4 className="font-semibold text-sm text-white mt-1.5">{grp.name}</h4>
                        <div className="text-xs text-gray-400 mt-2 flex justify-between">
                          <span>Mapeamento de RBAC alvo:</span>
                          <span className="text-[#366BB2]/60 font-medium">{(adminRoles.find(r => r.id === grp.roleId))?.name || "User"}</span>
                        </div>
                      </div>
                      <div className="border-t border-gray-850 pt-3 mt-4 text-xs text-gray-500 flex justify-between items-center">
                        <span>Total de Membros</span>
                        <span className="font-semibold text-gray-300">{grp.memberCount} ativos</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-gray-300">
                    <thead className="bg-gray-950 border-b border-gray-800 uppercase text-[10px] font-semibold text-gray-400">
                      <tr>
                        <th className="p-3">Membro de Identidade</th>
                        <th className="p-3">Endereço de E-mail</th>
                        <th className="p-3">Função RBAC Primária</th>
                        <th className="p-3">Grupos de Segurança</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Data de Entrada</th>
                        <th className="p-3 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {adminUsers.map(usr => {
                        const roleObj = adminRoles.find(r => r.id === usr.roleId);
                        return (
                          <tr key={usr.id} className="hover:bg-gray-950">
                            <td className="p-3 font-medium text-white flex items-center gap-2">
                              <span className="h-6 w-6 rounded-full bg-indigo-900 text-indigo-200 flex items-center justify-center font-bold text-[10px] uppercase">
                                {usr.name.substring(0,2)}
                              </span>
                              {usr.name}
                            </td>
                            <td className="p-3 font-mono text-[11px] text-gray-400">{usr.email}</td>
                            <td className="p-3">
                              <span className="text-indigo-300 font-medium">{roleObj?.name || usr.roleId}</span>
                            </td>
                            <td className="p-3 text-gray-400">
                              {usr.groupIds && usr.groupIds.length > 0 ? (
                                usr.groupIds.map(gId => {
                                  const gp = userGroups.find(g => g.id === gId);
                                  return <span key={gId} className="bg-gray-900 border border-gray-800 text-[10px] px-1.5 py-0.5 rounded text-gray-300 mr-1 font-medium">{gp?.name || gId}</span>;
                                })
                              ) : (
                                <span className="text-gray-600 italic">Nenhum grupo mapeado</span>
                              )}
                            </td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                                usr.status === "Active" 
                                  ? "bg-emerald-950 text-emerald-300 border border-emerald-500/20" 
                                  : "bg-amber-950 text-amber-300 border border-amber-500/20"
                              }`}>
                                {usr.status}
                              </span>
                            </td>
                            <td className="p-3 text-gray-400">{usr.joinedDate}</td>
                            <td className="p-3 text-right">
                              <select 
                                onChange={async (e) => {
                                  const res = await fetch(`/api/admin/users/${usr.id}`, {
                                    method: "PUT",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ status: e.target.value })
                                  });
                                  if (res.ok) {
                                    showToast(`User status updated to ${e.target.value}`);
                                    loadAllData();
                                  }
                                }}
                                className="bg-gray-900 border border-gray-800 rounded text-[11px] px-1.5 py-0.5 text-gray-300 focus:outline-none"
                              >
                                <option value="">Gerenciar Estado</option>
                                <option value="Active">Active</option>
                                <option value="Suspended">Suspend</option>
                              </select>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Granular Permissions Section */}
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                <div className="flex items-center justify-between border-b border-gray-800 pb-4 mb-4">
                  <div>
                    <h3 className="text-base font-semibold text-white">Perfis de Função Granulares (Mecanismo RBAC)</h3>
                    <p className="text-xs text-gray-400 mt-1">
                      Configure permissões estruturais para funções personalizadas e padrão da plataforma.
                    </p>
                  </div>
                  <button 
                    onClick={() => setShowRoleModal(true)} 
                    className="bg-[#366BB2] text-white cursor-pointer px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1 transition"
                  >
                    <Plus className="h-3.5 w-3.5" /> Criar Função Personalizada
                  </button>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {adminRoles.map(role => (
                    <div key={role.id} className="bg-gray-950 border border-gray-800 p-4 rounded-lg flex flex-col justify-between" id={`role-card-${role.id}`}>
                      <div>
                        <div className="flex justify-between items-start">
                          <h4 className="font-semibold text-sm text-white">{role.name}</h4>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-mono tracking-wider uppercase ${
                            role.isSystem 
                              ? "bg-gray-900 border border-gray-800 text-[#366BB2]/60" 
                              : "bg-amber-950 border border-amber-500/20 text-amber-300"
                          }`}>
                            {role.isSystem ? "Nativo do Sistema" : "Perfil Personalizado"}
                          </span>
                        </div>

                        <div className="space-y-1.5 mt-4 text-xs">
                          <div className="flex justify-between border-b border-gray-900 pb-1.5">
                            <span className="text-gray-500">Módulo de Licenças SAM:</span>
                            <span className={`font-semibold ${role.permissions.licenses === 'Write' ? 'text-emerald-400' : role.permissions.licenses === 'Read' ? 'text-indigo-300' : 'text-gray-600'}`}>{role.permissions.licenses}</span>
                          </div>
                          <div className="flex justify-between border-b border-gray-900 pb-1.5">
                            <span className="text-gray-500">Gerenciamento de Aplicativos SaaS:</span>
                            <span className={`font-semibold ${role.permissions.saas === 'Write' ? 'text-emerald-400' : role.permissions.saas === 'Read' ? 'text-indigo-300' : 'text-gray-600'}`}>{role.permissions.saas}</span>
                          </div>
                          <div className="flex justify-between border-b border-gray-900 pb-1.5">
                            <span className="text-gray-500">Licenças de Nuvem e Contêiner:</span>
                            <span className={`font-semibold ${role.permissions.cloud === 'Write' ? 'text-emerald-400' : role.permissions.cloud === 'Read' ? 'text-indigo-300' : 'text-gray-600'}`}>{role.permissions.cloud}</span>
                          </div>
                          <div className="flex justify-between border-b border-gray-900 pb-1.5">
                            <span className="text-gray-500">Config. do Painel de Administração:</span>
                            <span className={`font-semibold ${role.permissions.admin === 'Write' ? 'text-emerald-400' : role.permissions.admin === 'Read' ? 'text-indigo-300' : 'text-gray-600'}`}>{role.permissions.admin}</span>
                          </div>
                          <div className="flex justify-between pb-0.5">
                            <span className="text-gray-500">Acesso a Logs de Auditoria de Segurança:</span>
                            <span className={`font-semibold ${role.permissions.auditLogs === 'Write' ? 'text-emerald-400' : role.permissions.auditLogs === 'Read' ? 'text-indigo-300' : 'text-gray-600'}`}>{role.permissions.auditLogs}</span>
                          </div>
                        </div>
                      </div>

                      {!role.isSystem && (
                        <div className="border-t border-gray-900 pt-3 mt-4 text-right">
                          <button 
                            onClick={() => handleDeleteRole(role.id)}
                            className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 ml-auto"
                          >
                              <Trash2 className="h-3.5 w-3.5" /> Excluir Função
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ORG HIERARCHY & SITES */}
          {activeTab === "org" && (
            <div className="space-y-6" id="org-tab-content">
              {/* Organization hierarchy representation */}
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                <div className="flex items-center justify-between border-b border-gray-800 pb-4 mb-4">
                  <div>
                    <h3 className="text-base font-semibold text-white">Árvore de Estrutura Corporativa Multinível</h3>
                    <p className="text-xs text-gray-400 mt-1">
                      Configure entidades legais em vários níveis, divisões corporativas regionais e mapeie cotas de licença de software por nós estruturais.
                    </p>
                  </div>
                  <button 
                    onClick={() => setShowNodeModal(true)} 
                    className="bg-[#366BB2] text-white cursor-pointer px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1 transition animate-pulse"
                  >
                    <Plus className="h-3.5 w-3.5" /> Novo Nó Estrutural
                  </button>
                </div>

                {/* Tree Visual layout */}
                <div className="bg-gray-950 p-6 rounded-lg border border-gray-800 space-y-4" id="org-tree-viz">
                  <div className="flex items-center gap-3 border-b border-gray-900 pb-3">
                    <Building className="h-5 w-5 text-[#366BB2]/60 shrink-0" />
                    <div>
                      <span className="text-[10px] uppercase font-mono tracking-wider bg-indigo-950/45 px-1.5 py-0.5 rounded text-indigo-300">Grupo Holding Raiz</span>
                      <h4 className="font-bold text-sm text-white mt-1">Acme Corporation (Global Head Office)</h4>
                    </div>
                  </div>

                  <div className="pl-6 border-l border-gray-800 space-y-4">
                    {orgNodes.filter(n => n.parentId === "org-root" || !n.parentId).map(node => (
                      <div key={node.id} className="space-y-2 bg-gray-900/40 p-4 rounded-lg border border-gray-850" id={`org-node-${node.id}`}>
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-[#366BB2]/60">{node.code}</span>
                            <span className="font-semibold text-sm text-white">{node.name}</span>
                          </div>
                          <div className="flex items-center gap-4 text-xs">
                            <div className="text-gray-400">
                              Alocação de cota de licença de software: <strong className="text-white font-semibold">{node.allocatedLicenseCount} itens</strong>
                            </div>
                            <span className="text-gray-600">|</span>
                            <div className="text-gray-400">
                              Sites Ativos: <strong className="text-emerald-400">{(enrollmentSites.filter(s => s.orgNodeId === node.id)).length} atribuídos</strong>
                            </div>
                          </div>
                        </div>

                        {/* Sites connected to this node */}
                        <div className="pl-6 border-l border-indigo-900 space-y-1.5 mt-2">
                          {enrollmentSites.filter(s => s.orgNodeId === node.id).map(site => (
                            <div key={site.id} className="flex items-center justify-between text-xs bg-gray-950 p-2 rounded border border-gray-900">
                              <span className="text-gray-300 font-medium">{site.name}</span>
                              <div className="flex items-center gap-3">
                                <span className="text-gray-400 text-[11px] font-mono">{site.snowExtenderCount} Extenders configured</span>
                                <span className={`h-2 w-2 rounded-full ${site.extenderStatus === 'Online' ? 'bg-emerald-400' : 'bg-amber-400'}`} title={site.extenderStatus}></span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Snow Extenders / Gateway Management */}
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                <div className="flex items-center justify-between border-b border-gray-800 pb-4 mb-4">
                  <div>
                    <h3 className="text-base font-semibold text-white">Gateways de Descoberta On-Premises (Snow Extenders)</h3>
                    <p className="text-xs text-gray-400 mt-1">
                      Registre escritórios lógicos locais e monitore heartbeats automáticos de extenders locais.
                    </p>
                  </div>
                  <button 
                    onClick={() => setShowSiteModal(true)} 
                    className="bg-gray-800 hover:bg-gray-750 text-white px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1 transition border border-gray-700"
                  >
                    <Plus className="h-3.5 w-3.5" /> Registrar Site de Registro
                  </button>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  {enrollmentSites.map(site => (
                    <div key={site.id} className="bg-gray-950 rounded-lg p-4 border border-gray-850 flex flex-col justify-between" id={`site-card-${site.id}`}>
                      <div>
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] bg-indigo-950 text-indigo-300 font-semibold uppercase tracking-wider px-2 py-0.5 rounded">Site de Registro</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            site.extenderStatus === "Online" 
                              ? "bg-emerald-950 text-emerald-300 border border-emerald-500/20" 
                              : "bg-gray-900 text-gray-500 border border-gray-800"
                          }`}>
                            {site.extenderStatus}
                          </span>
                        </div>
                        <h4 className="font-semibold text-sm text-white mt-2">{site.name}</h4>
                        <p className="text-xs text-gray-400 mt-2">
                          Unidade lógica conectada diretamente ao pipeline central de descoberta de ativos.
                        </p>
                      </div>

                      <div className="border-t border-gray-850 pt-3 mt-4 text-xs text-gray-500 flex justify-between">
                        <span>Extenders registrados:</span>
                        <span className="font-bold text-gray-300">{site.snowExtenderCount} ativos</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: FIREWALL IP POLICIES & SECURITY */}
          {activeTab === "security" && (
            <div className="space-y-6" id="security-tab-content">
              {/* Firewall / IP Protection Policies */}
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                <div className="flex items-center justify-between border-b border-gray-800 pb-4 mb-4">
                  <div>
                    <h3 className="text-base font-semibold text-white">Listas Brancas de IP de Rede (Proteção Administrativa)</h3>
                    <p className="text-xs text-gray-400 mt-1">
                      Restrinja o acesso ao portal de gerenciamento de ativos de TI aplicando políticas personalizadas de Permissão/Negação de IP.
                    </p>
                  </div>
                  <button 
                    onClick={() => setShowIpModal(true)} 
                    className="bg-[#366BB2] text-white cursor-pointer px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1 transition"
                  >
                    <Plus className="h-3.5 w-3.5" /> Adicionar Regra de Rede de Entrada
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-gray-300">
                    <thead className="bg-gray-950 border-b border-gray-800 uppercase text-[10px] font-semibold text-gray-400">
                      <tr>
                        <th className="p-3">Bloco de Faixa de Endereço CIDR</th>
                        <th className="p-3">Nome da Descrição</th>
                        <th className="p-3">Política de Ação de Segurança</th>
                        <th className="p-3">Status da Regra</th>
                        <th className="p-3 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {ipPolicies.map(p => (
                        <tr key={p.id} className="hover:bg-gray-950">
                          <td className="p-3 font-mono text-[11px] text-white">{p.cidr}</td>
                          <td className="p-3 text-gray-400">{p.description}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase ${
                              p.policyType === "Allow" 
                                ? "bg-emerald-950 text-emerald-300 border border-emerald-500/20" 
                                : "bg-rose-950 text-rose-300 border border-rose-500/20"
                            }`}>
                              {p.policyType}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="text-emerald-400 font-medium">{p.status}</span>
                          </td>
                          <td className="p-3 text-right">
                            <button 
                              onClick={() => handleDeleteIpPolicy(p.id)}
                              className="text-rose-400 hover:text-rose-300 p-1 rounded hover:bg-rose-950/20 transition"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* GDPR Compliance & Data Privacy settings */}
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                <div className="flex items-center justify-between border-b border-gray-800 pb-4 mb-4">
                  <div>
                    <h3 className="text-base font-semibold text-white">Conformidade com LGPD e Ofuscação de Dados PII</h3>
                    <p className="text-xs text-gray-400 mt-1">
                      Configure configurações de privacidade para pseudonimizar automaticamente proprietários de hardware e endereços de e-mail descobertos por agentes de inventário.
                    </p>
                  </div>
                  <Sliders className="h-5 w-5 text-[#366BB2]/60 shrink-0" />
                </div>

                <div className="space-y-4 text-xs text-gray-300">
                  <div className="flex items-center justify-between bg-gray-950 p-4 rounded-lg border border-gray-800">
                    <div>
                      <h4 className="font-semibold text-sm text-white">Anonimizar Contas de Usuário Descobertas</h4>
                      <p className="text-xs text-gray-400 mt-0.5">Remova domínios de e-mail nativos e substitua tags de proprietário por tokens aleatórios seguros.</p>
                    </div>
                    <span className="text-emerald-400 font-bold bg-emerald-950 border border-emerald-500/10 px-2 py-1 rounded">ATIVO / EM VIGOR</span>
                  </div>

                  <div className="flex items-center justify-between bg-gray-950 p-4 rounded-lg border border-gray-800">
                    <div>
                      <h4 className="font-semibold text-sm text-white">Excluir Domínios Específicos do Active Directory</h4>
                      <p className="text-xs text-gray-400 mt-0.5">Dispositivos pertencentes a domínios designados (ex: staging-internal.net) não serão registrados no catálogo SAM.</p>
                    </div>
                    <span className="text-gray-400 font-semibold bg-gray-900 border border-gray-800 px-2 py-1 rounded">2 DOMÍNIOS EXCLUÍDOS</span>
                  </div>

                  <div className="flex items-center justify-between bg-gray-950 p-4 rounded-lg border border-gray-800">
                    <div>
                      <h4 className="font-semibold text-sm text-white">Ciclos de Automação de Isolamento de Dispositivos</h4>
                      <p className="text-xs text-gray-400 mt-0.5">Marque automaticamente computadores ociosos como Suspensos/Arquivados se nenhum heartbeat do scanner for recebido por 90 dias.</p>
                    </div>
                    <span className="text-emerald-400 font-bold bg-emerald-950 border border-emerald-500/10 px-2 py-1 rounded">90 DIAS IDADE MÁXIMA</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: MSP PARTNER SERVICE LAYER */}
          {activeTab === "msp" && (
            <div className="space-y-6" id="msp-tab-content">
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                <div className="flex items-center justify-between border-b border-gray-800 pb-4 mb-4">
                  <div>
                    <h3 className="text-base font-semibold text-white">Console de Parceiro MSP (Provedor de Serviços Gerenciados)</h3>
                    <p className="text-xs text-gray-400 mt-1">
                      Visão geral consolidada de clientes multilocatários gerenciados sob sua estrutura de conta mestre.
                    </p>
                  </div>
                  <button 
                    onClick={() => setShowMspModal(true)} 
                    className="bg-[#366BB2] text-white cursor-pointer px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1 transition"
                  >
                    <Plus className="h-3.5 w-3.5" /> Provisionar Workspace de Locatário do Cliente
                  </button>
                </div>

                {/* Simulated tenant visual overview */}
                <div className="bg-indigo-950/20 border border-[#366BB2]/20 rounded-lg p-4 mb-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
                  <div>
                    <div className="text-[10px] text-[#366BB2]/60 uppercase tracking-wider font-semibold">Sessão de login simulada ativa:</div>
                    <h4 className="text-base font-bold text-white mt-1">{activeTenantObj?.name || "Acme corporation"}</h4>
                    <p className="text-gray-400 mt-1">
                      Access Token successfully generated. Security context restricts API responses only to client database ID: <strong className="font-mono text-indigo-300">{activeTenantObj?.id}</strong>
                    </p>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <span className="text-gray-500 block">Nota de Compliance</span>
                      <strong className={`text-sm font-bold ${activeTenantObj?.complianceScore >= 90 ? 'text-emerald-400' : 'text-amber-400'}`}>{activeTenantObj?.complianceScore}%</strong>
                    </div>
                    <div className="text-center">
                      <span className="text-gray-500 block">Licenças Próprias</span>
                      <strong className="text-sm font-bold text-white">{activeTenantObj?.totalLicenses}</strong>
                    </div>
                    <div className="text-center">
                      <span className="text-gray-500 block">Dispositivos Descobertos</span>
                      <strong className="text-sm font-bold text-white">{activeTenantObj?.totalDevices}</strong>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  {mspCustomers.map(cust => (
                    <div 
                      key={cust.id} 
                      onClick={() => {
                        setSelectedTenant(cust.id);
                        showToast(`Switched active enterprise tenant profile to: ${cust.name}`);
                      }}
                      className={`cursor-pointer bg-gray-950 p-4 rounded-lg border transition ${
                        selectedTenant === cust.id 
                          ? "border-[#366BB2] shadow-md shadow-indigo-500/10" 
                          : "border-gray-850 hover:border-gray-700"
                      }`}
                      id={`msp-card-${cust.id}`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] uppercase font-mono tracking-wider bg-gray-900 border border-gray-800 text-indigo-300 px-1.5 py-0.5 rounded">Cliente MSP</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          cust.status === "Active" 
                            ? "bg-emerald-950 text-emerald-300 border border-emerald-500/10" 
                            : "bg-rose-950 text-rose-300 border border-rose-500/10"
                        }`}>
                          {cust.status}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-white mt-3">{cust.name}</h4>
                      
                      <div className="space-y-1 mt-4 text-xs text-gray-400 border-t border-gray-900 pt-3">
                        <div className="flex justify-between"><span>Workspace do Locatário:</span> <span className="font-mono text-gray-500 text-[10px]">{cust.id}</span></div>
                        <div className="flex justify-between"><span>Estado de auditoria:</span> <span className="text-emerald-400 font-medium">Em conformidade SOC 2</span></div>
                        <div className="flex justify-between"><span>Posição Efetiva (ELP):</span> <strong className="text-gray-300">{cust.complianceScore}% pontuação</strong></div>
                      </div>

                      <div className="mt-4 pt-2 border-t border-gray-900 text-center">
                        <span className="text-[#366BB2]/60 font-medium text-[11px] hover:underline flex items-center justify-center gap-1">
                          <Check className="h-3.5 w-3.5" /> Contexto Alternado
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: AUDIT ACTION TRAIL */}
          {activeTab === "audit" && (
            <div className="space-y-6" id="audit-tab-content">
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-800 pb-4 mb-4">
                  <div>
                    <h3 className="text-base font-semibold text-white">Log de Atividades de Auditoria Centralizado Dinâmico</h3>
                    <p className="text-xs text-gray-400 mt-1">
                      Registro de rastreamento imutável de logins administrativos estruturais, alterações de credenciais e modificações de políticas.
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button 
                      onClick={async () => {
                        // Quick fetch to a simulated endpoint or append directly to verify dynamic update
                        const randomActions = [
                          { category: "Security", action: "Firewall Policy Violation Detection", details: "Blocked incoming API connection proposal from unsanctioned IP 45.112.92.15" },
                          { category: "Auth", action: "Revoke OAuth Client Credential", details: "Administrator revoked secure client credential key assigned to ServiceNow ticket manager" },
                          { category: "SAM Core", action: "Private Catalog App Definition", details: "Registered customized legacy catalog item 'Internal Inventory Gateway Helper v3'" }
                        ];
                        const randomPick = randomActions[Math.floor(Math.random() * randomActions.length)];
                        
                        // We will write an action by posting to a dummy endpoint or creating a node, which creates audit logs.
                        // Or we can post directly. Let's create an IP policy CIDR that matches simulated to force write log!
                        const dummyCidr = `${Math.floor(Math.random() * 254) + 1}.0.0.0/8`;
                        await fetch("/api/admin/ip-policies", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ cidr: dummyCidr, description: `Simulation: ${randomPick.details}`, policyType: "Deny" })
                        });
                        showToast("Simulated event written to security database logs!");
                        loadAllData();
                      }}
                      className="bg-[#366BB2] text-white cursor-pointer px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1 transition"
                    >
                      <Activity className="h-3.5 w-3.5" /> Simular Evento de Admin
                    </button>
                    <button 
                      onClick={handleExportAuditLogs}
                      className="bg-gray-800 hover:bg-gray-750 text-white px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1 transition border border-gray-700"
                    >
                      <Download className="h-3.5 w-3.5" /> Exportar Trilha de Auditoria
                    </button>
                  </div>
                </div>

                {/* Filter and Search Bar */}
                <div className="flex flex-col md:flex-row gap-3 mb-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                    <input 
                      type="text" 
                      placeholder="Pesquisar ações de auditoria, detalhes de funcionários, registros de IP ou metadados..." 
                      value={auditQuery}
                      onChange={(e) => setAuditQuery(e.target.value)}
                      className="w-full bg-gray-950 border border-gray-850 text-xs text-white pl-9 pr-3 py-2.5 rounded-lg outline-none focus:border-[#366BB2]"
                      id="audit-search-field"
                    />
                  </div>
                  <div className="w-full md:w-48">
                    <select 
                      value={auditCategory}
                      onChange={(e) => setAuditCategory(e.target.value)}
                      className="w-full bg-gray-950 border border-gray-850 text-xs text-gray-300 px-3 py-2.5 rounded-lg outline-none"
                    >
                      <option value="All">Todas as Categorias</option>
                      <option value="Auth">Autenticação e SSO</option>
                      <option value="Security">Firewalls e Proteção</option>
                      <option value="RBAC">Controle de Acesso RBAC</option>
                      <option value="SAM Core">Regras do Core SAM</option>
                      <option value="Org">Árvore Organizacional</option>
                      <option value="Cloud">Conexões de Nuvem</option>
                      <option value="Admin">Admin do Sistema</option>
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-gray-300">
                    <thead className="bg-gray-950 border-b border-gray-800 uppercase text-[10px] font-semibold text-gray-400">
                      <tr>
                        <th className="p-3">Timestamp (UTC)</th>
                        <th className="p-3">Membro de Identidade</th>
                        <th className="p-3">Categoria de Auditoria</th>
                        <th className="p-3">Ação Realizada</th>
                        <th className="p-3">IP de Rede do Cliente</th>
                        <th className="p-3">Descrição de Detalhes da Atividade</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {filteredAudits.map(log => (
                        <tr key={log.id} className="hover:bg-gray-950">
                          <td className="p-3 text-gray-400 font-mono text-[11px]" style={{ whiteSpace: 'nowrap' }}>
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                          <td className="p-3 font-semibold text-white">{log.userEmail}</td>
                          <td className="p-3">
                            <span className="bg-gray-900 border border-gray-800 px-1.5 py-0.5 rounded text-[#366BB2]/60 text-[10px] font-mono">{log.category}</span>
                          </td>
                          <td className="p-3 text-indigo-200 font-medium">{log.action}</td>
                          <td className="p-3 font-mono text-gray-400 text-[11px]">{log.ipAddress}</td>
                          <td className="p-3 text-gray-300">{log.details}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredAudits.length === 0 && (
                    <div className="p-8 text-center text-gray-500" id="empty-audits-message">
                      Nenhum log de ação de auditoria correspondente encontrado. Tente modificar seus filtros ou digitar termos de pesquisa diferentes.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: CONSOLIDATED CURRENCY SETTINGS */}
          {activeTab === "currency" && (
            <div className="space-y-6" id="currency-tab-content">
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                <div className="flex items-center justify-between border-b border-gray-800 pb-4 mb-4">
                  <div>
                    <h3 className="text-base font-semibold text-white">Gerenciador de Câmbio Multimoeda Consolidado</h3>
                    <p className="text-xs text-gray-400 mt-1">
                      Gerencie fatores de conversão e taxas de câmbio para gerar dashboards de gastos consolidados em sua moeda operacional base.
                    </p>
                  </div>
                  <button 
                    onClick={() => setShowCurModal(true)} 
                    className="bg-[#366BB2] text-white cursor-pointer px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1 transition"
                  >
                    <Plus className="h-3.5 w-3.5" /> Mapear Moeda de Conversão
                  </button>
                </div>

                <div className="grid md:grid-cols-4 gap-4 mb-6">
                  {currencyRates.map(rate => (
                    <div key={rate.id} className="bg-gray-950 border border-gray-850 p-4 rounded-lg text-xs" id={`currency-card-${rate.id}`}>
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-lg text-white font-mono">{rate.code} ({rate.symbol})</span>
                        {rate.isBase && (
                          <span className="bg-emerald-950 text-emerald-400 text-[9px] font-bold px-2 py-0.5 rounded tracking-wider border border-emerald-500/10">MOEDA BASE</span>
                        )}
                      </div>
                      <div className="mt-4 pt-3 border-t border-gray-900 flex justify-between text-gray-400">
                        <span>Taxa relativa à base USD:</span>
                        <span className="font-mono text-white font-semibold">{rate.rateToBase.toFixed(4)}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-indigo-950/20 border border-[#366BB2]/20 p-4 rounded-lg text-xs text-indigo-300">
                  <h4 className="font-bold text-sm text-white mb-1">Processo de Conversão Financeira Periodizada</h4>
                  <p className="mt-1 leading-relaxed">
                    Os gastos financeiros são avaliados diariamente consolidando valores de faturas de software locais com base nas taxas de câmbio noturnas. A moeda base padrão é o Dólar Americano ($). Para alterar o sistema operacional base, entre em contato com a conta do administrador mestre global.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: VAULT & NOTIFICATIONS */}
          {activeTab === "files" && (
            <div className="space-y-6" id="files-tab-content">
              {/* Notifications panel */}
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                <div className="flex items-center justify-between border-b border-gray-800 pb-4 mb-4">
                  <div>
                    <h3 className="text-base font-semibold text-white">Notificações de Segurança do Sistema e Atividades</h3>
                    <p className="text-xs text-gray-400 mt-1">
                      Monitore alertas da plataforma, erros de monitoramento de heartbeat e violações de compliance automatizadas.
                    </p>
                  </div>
                  <Bell className="h-5 w-5 text-[#366BB2]/60 shrink-0" />
                </div>

                <div className="space-y-3">
                  {adminNotifications.map(notif => (
                    <div 
                      key={notif.id} 
                      className={`p-4 rounded-lg border flex flex-col md:flex-row justify-between items-start md:items-center gap-3 text-xs transition ${
                        notif.isRead 
                          ? "bg-gray-950 border-gray-900 text-gray-400" 
                          : "bg-indigo-950/20 border-[#366BB2]/20 text-indigo-200"
                      }`}
                      id={`notification-card-${notif.id}`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                            notif.category === 'Security' 
                              ? 'bg-rose-950 text-rose-300 border border-rose-500/20' 
                              : notif.category === 'Warning' 
                              ? 'bg-amber-950 text-amber-300 border border-amber-500/20' 
                              : 'bg-indigo-900 text-indigo-200'
                          }`}>
                            {notif.category}
                          </span>
                          <span className="text-gray-500 font-mono">{new Date(notif.timestamp).toLocaleString()}</span>
                        </div>
                        <h4 className="font-semibold text-white text-sm">{notif.title}</h4>
                        <p className="text-gray-400">{notif.message}</p>
                      </div>

                      {!notif.isRead && (
                        <button 
                          onClick={() => handleReadNotification(notif.id)}
                          className="bg-[#366BB2] text-white cursor-pointer px-2.5 py-1 rounded text-[11px] font-semibold shrink-0 transition"
                        >
                          Marcar como lida
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* My Files Vault */}
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                <div className="flex items-center justify-between border-b border-gray-800 pb-4 mb-4">
                  <div>
                    <h3 className="text-base font-semibold text-white">Cofre de Armazenamento Central (Meus Arquivos)</h3>
                    <p className="text-xs text-gray-400 mt-1">
                      Acesse, recupere ou remova com segurança documentos de compliance exportados, dumps de sistema e recibos de faturas.
                    </p>
                  </div>
                  <HardDrive className="h-5 w-5 text-[#366BB2]/60 shrink-0" />
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  {uploadedFiles.map(file => (
                    <div key={file.id} className="bg-gray-950 border border-gray-850 p-4 rounded-lg text-xs flex flex-col justify-between" id={`file-card-${file.id}`}>
                      <div>
                        <div className="flex justify-between items-start">
                          <span className="text-[10px] bg-gray-900 border border-gray-800 text-indigo-300 font-semibold px-2 py-0.5 rounded font-mono truncate max-w-[120px]">{file.mimeType}</span>
                          <span className="text-gray-500 font-mono">{(file.sizeBytes / 1024).toFixed(1)} KB</span>
                        </div>
                        <h4 className="font-bold text-gray-200 text-sm mt-3 truncate" title={file.filename}>{file.filename}</h4>
                        <div className="text-gray-500 mt-1 flex justify-between">
                          <span>Tipo de exportação:</span>
                          <span>{file.purpose}</span>
                        </div>
                      </div>

                      <div className="border-t border-gray-900 pt-3 mt-4 flex justify-between items-center text-[11px]">
                        <span className="text-gray-500 font-mono">{new Date(file.uploadedAt).toLocaleDateString()}</span>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => {
                              showToast(`Successfully downloaded compliance file "${file.filename}" directly to user desktop.`);
                              // Mock actual browser file trigger download
                              const blob = new Blob(["Simulated ITAM Vault report export details."], { type: file.mimeType });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement("a");
                              a.href = url;
                              a.download = file.filename;
                              document.body.appendChild(a);
                              a.click();
                              document.body.removeChild(a);
                            }}
                            className="text-[#366BB2]/60 hover:text-indigo-300 p-1 rounded hover:bg-indigo-950/20"
                            title="Baixar arquivo"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteFile(file.id)}
                            className="text-rose-400 hover:text-rose-300 p-1 rounded hover:bg-rose-950/20"
                            title="Excluir arquivo"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 9: SNOW EXTENDERS (ON-PREMISES GATEWAYS) & PACKAGE BUILDER */}
          {activeTab === "extenders" && (
            <div className="space-y-6" id="extenders-tab-content">
              {/* Header */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h3 className="text-base font-semibold text-white">Gateways de Coleta On-Premises (Snow Extenders)</h3>
                    <p className="text-xs text-gray-400 mt-1">
                      Gerencie gateways de conexão segura, monitore escopos de descoberta do Active Directory e teste daemons de upload do File Elevator.
                    </p>
                  </div>
                  <Server className="h-6 w-6 text-[#366BB2]/60 shrink-0" />
                </div>
              </div>

              <div className="grid lg:grid-cols-3 gap-6">
                {/* Gateways Registry & Subsystem Testing */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                    <h4 className="text-sm font-semibold text-white mb-4">Gateways e Sites Ativos</h4>
                    
                    <div className="space-y-4">
                      {enrollmentSites.map(site => (
                        <div key={site.id} className="bg-gray-950 border border-gray-850 rounded-lg p-4 space-y-3">
                          <div className="flex justify-between items-center">
                            <div>
                              <h5 className="text-sm font-bold text-gray-200">{site.name}</h5>
                              <span className="text-[10px] text-gray-500 font-mono">ID: {site.id} | Org Node: {site.orgNodeId}</span>
                            </div>
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              site.extenderStatus === "Online" 
                                ? "bg-emerald-950 text-emerald-300 border border-emerald-500/25" 
                                : site.extenderStatus === "Offline" 
                                ? "bg-rose-950 text-rose-300 border border-rose-500/25" 
                                : "bg-gray-900 text-gray-400 border border-gray-800"
                            }`}>
                              ● {site.extenderStatus}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs border-t border-gray-900 pt-3">
                            <div>
                              <span className="text-gray-500 block">Extenders implantados</span>
                              <span className="text-gray-300 font-mono font-bold">{site.snowExtenderCount} servidores</span>
                            </div>
                            <div>
                              <span className="text-gray-500 block">Protocolo do gateway</span>
                              <span className="text-[#366BB2]/60 font-mono">TLS 1.3 (Port 443)</span>
                            </div>
                            <div>
                              <span className="text-gray-500 block">Elevador de diretório Hot</span>
                              <span className="text-emerald-400">Monitoramento Ativo</span>
                            </div>
                            <div>
                              <span className="text-gray-500 block">Sincronização AD LDAP</span>
                              <span className="text-gray-300 font-mono">Every 12 Hours</span>
                            </div>
                          </div>

                          {/* Subsystem Testing Controls */}
                          <div className="bg-gray-900/50 p-3 rounded-lg border border-gray-900 mt-2">
                            <span className="text-[10px] font-semibold text-gray-400 block mb-2 uppercase tracking-wider">Teste de Diagnóstico de Subsistema do Gateway</span>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                              <button
                                onClick={() => handleTestExtenderComponent("gateway")}
                                disabled={!!testingExtender}
                                className="bg-gray-950 border border-gray-800 text-gray-300 hover:text-white hover:bg-gray-900 px-2 py-1.5 rounded text-[10px] font-medium transition text-center"
                              >
                                {testingExtender === "gateway" ? "Testando..." : "Testar Gateway"}
                              </button>
                              <button
                                onClick={() => handleTestExtenderComponent("elevator")}
                                disabled={!!testingExtender}
                                className="bg-gray-950 border border-gray-800 text-gray-300 hover:text-white hover:bg-gray-900 px-2 py-1.5 rounded text-[10px] font-medium transition text-center"
                              >
                                {testingExtender === "elevator" ? "Testando..." : "Testar Elevator"}
                              </button>
                              <button
                                onClick={() => handleTestExtenderComponent("ad")}
                                disabled={!!testingExtender}
                                className="bg-gray-950 border border-gray-800 text-gray-300 hover:text-white hover:bg-gray-900 px-2 py-1.5 rounded text-[10px] font-medium transition text-center"
                              >
                                {testingExtender === "ad" ? "Testando..." : "Varredura de Descoberta AD"}
                              </button>
                              <button
                                onClick={() => handleTestExtenderComponent("forwarder")}
                                disabled={!!testingExtender}
                                className="bg-gray-950 border border-gray-800 text-gray-300 hover:text-white hover:bg-gray-900 px-2 py-1.5 rounded text-[10px] font-medium transition text-center"
                              >
                                {testingExtender === "forwarder" ? "Testando..." : "Testar Forwarder"}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Diagnostic Console Panel */}
                  <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                    <div className="flex items-center justify-between border-b border-gray-800 pb-3 mb-4">
                      <div className="flex items-center gap-2">
                        <Terminal className="h-4 w-4 text-emerald-400" />
                        <h4 className="text-sm font-semibold text-white">Saída de Diagnóstico de Handshake Seguro do Extender</h4>
                      </div>
                      {activeExtenderDiagnostic && (
                        <button 
                          onClick={() => setActiveExtenderDiagnostic(null)}
                          className="text-gray-500 hover:text-gray-300 text-xs"
                        >
                          Limpar
                        </button>
                      )}
                    </div>

                    {activeExtenderDiagnostic ? (
                      <div className="space-y-4">
                        <div className="p-3 bg-emerald-950/20 border border-emerald-500/25 rounded-lg flex items-start gap-2.5">
                          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                          <p className="text-xs text-emerald-300 font-medium">
                            {activeExtenderDiagnostic.message}
                          </p>
                        </div>
                        
                        <div className="bg-gray-950 p-4 rounded-lg border border-gray-850 font-mono text-xs text-emerald-400 space-y-1.5 overflow-x-auto">
                          <span className="text-gray-500 font-semibold block mb-1">// Subsystem JSON Diagnostics payload:</span>
                          <pre>{JSON.stringify(activeExtenderDiagnostic.diagnostics, null, 2)}</pre>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500 text-xs">
                        {testingExtender ? (
                          <div className="flex flex-col items-center gap-2">
                            <RefreshCw className="h-5 w-5 animate-spin text-[#366BB2]/60" />
                            <span>Solicitando handshake de token seguro do endpoint do Gateway Extender...</span>
                          </div>
                        ) : (
                          "Acione um teste de subsistema do gateway acima para capturar relatórios de diagnóstico JSON criptografados criptograficamente."
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Agent Package Builder Console */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-5 h-fit">
                  <div>
                    <h4 className="text-sm font-semibold text-white">Construtor de Pacote do Instalador do Agente</h4>
                    <p className="text-xs text-gray-400 mt-1">
                      Compile pacotes de instalador de agente personalizados para dispositivos físicos, clusters incorporados e hipervisores.
                    </p>
                  </div>

                  <div className="space-y-4 text-xs text-gray-300">
                    {/* Platform Selector */}
                    <div className="space-y-1.5">
                      <label className="font-semibold text-gray-400">Plataforma do Sistema Operacional Alvo</label>
                      <div className="grid grid-cols-3 gap-2">
                        {(["Windows", "Linux", "macOS"] as const).map(plat => (
                          <button
                            key={plat}
                            onClick={() => setPbPlatform(plat)}
                            className={`py-2 px-3 rounded text-center font-semibold transition border ${
                              pbPlatform === plat 
                                ? "bg-indigo-600/15 border-[#366BB2] text-indigo-200" 
                                : "bg-gray-950 border-gray-800 hover:bg-gray-900 text-gray-400"
                            }`}
                          >
                            {plat}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Module Inclusion Checkboxes */}
                    <div className="space-y-2 bg-gray-950 p-3 rounded-lg border border-gray-850">
                      <span className="font-semibold text-gray-400 block mb-1">Componentes para Empacotar</span>
                      
                      <label className="flex items-center gap-2.5 cursor-pointer text-gray-300 hover:text-white">
                        <input 
                          type="checkbox" 
                          checked={pbGateway} 
                          onChange={(e) => setPbGateway(e.target.checked)}
                          className="rounded border-gray-800 bg-gray-900 text-[#366BB2]"
                        />
                        Módulo de Gateway Seguro
                      </label>

                      <label className="flex items-center gap-2.5 cursor-pointer text-gray-300 hover:text-white">
                        <input 
                          type="checkbox" 
                          checked={pbElevator} 
                          onChange={(e) => setPbElevator(e.target.checked)}
                          className="rounded border-gray-800 bg-gray-900 text-[#366BB2]"
                        />
                        Vigia do File Elevator
                      </label>

                      <label className="flex items-center gap-2.5 cursor-pointer text-gray-300 hover:text-white">
                        <input 
                          type="checkbox" 
                          checked={pbAD} 
                          onChange={(e) => setPbAD(e.target.checked)}
                          className="rounded border-gray-800 bg-gray-900 text-[#366BB2]"
                        />
                        Plug-in de varredura do Active Directory
                      </label>

                      <label className="flex items-center gap-2.5 cursor-pointer text-gray-300 hover:text-white">
                        <input 
                          type="checkbox" 
                          checked={pbForwarder} 
                          onChange={(e) => setPbForwarder(e.target.checked)}
                          className="rounded border-gray-800 bg-gray-900 text-[#366BB2]"
                        />
                        Daemon do Data Forwarder
                      </label>
                    </div>

                    {/* Scan Interval */}
                    <div className="space-y-1">
                      <label className="font-semibold text-gray-400">Frequência de Medição de Inventário</label>
                      <select 
                        value={pbInterval}
                        onChange={(e) => setPbInterval(e.target.value)}
                        className="w-full bg-gray-950 border border-gray-800 rounded px-3 py-2 text-white outline-none"
                      >
                        <option value="1">A Cada 1 Hora (Alta densidade)</option>
                        <option value="4">A Cada 4 Horas</option>
                        <option value="8">A Cada 8 Horas</option>
                        <option value="12">A Cada 12 Horas (Recomendado)</option>
                        <option value="24">A Cada 24 Horas (Conservador)</option>
                      </select>
                    </div>

                    {/* Build Button or Loader */}
                    {pbCompiling ? (
                      <div className="bg-gray-950 p-4 rounded-lg border border-indigo-950/40 text-center space-y-3">
                        <RefreshCw className="h-6 w-6 text-[#366BB2]/60 animate-spin mx-auto" />
                        <span className="font-semibold text-white block">Compilando Pacote do Instalador...</span>
                        <p className="text-[10px] text-gray-400 font-mono italic">{pbCompileStep}</p>
                      </div>
                    ) : (
                      <button
                        onClick={handleBuildAgentPackage}
                        className="w-full bg-[#366BB2] text-white cursor-pointer font-semibold py-2.5 rounded-lg transition text-center flex items-center justify-center gap-2"
                      >
                        <Wrench className="h-4 w-4" />
                        Compilar Pacote do Agente ({pbPlatform})
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 10: ITSM INTEGRATIONS SERVICE NOW & JIRA */}
          {activeTab === "itsm" && (
            <div className="space-y-6" id="itsm-tab-content">
              {/* Header */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h3 className="text-base font-semibold text-white">Conectores ITSM CMDB &amp; Enrichers</h3>
                    <p className="text-xs text-gray-400 mt-1">
                      Enriqueça tabelas CMDB do ServiceNow e Jira com ciclos de hardware normalizados, status de garantia e datas de EOL/EOS de software.
                    </p>
                  </div>
                  <Share2 className="h-6 w-6 text-[#366BB2]/60 shrink-0" />
                </div>
              </div>

              <div className="grid lg:grid-cols-3 gap-6">
                {/* Active connectors and setup form */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Connectors Registry list */}
                  <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-sm font-semibold text-white">Conectores de Gateway ITSM Ativos</h4>
                      <button
                        onClick={() => setShowItsmModal(true)}
                        className="bg-[#366BB2] text-white cursor-pointer font-semibold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 transition"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Configurar Conector
                      </button>
                    </div>

                    <div className="space-y-4">
                      {itsmConnectors.map(conn => (
                        <div key={conn.id} className="bg-gray-950 border border-gray-850 rounded-lg p-4 space-y-3" id={`itsm-card-${conn.id}`}>
                          <div className="flex justify-between items-start">
                            <div>
                              <h5 className="text-sm font-bold text-gray-200">{conn.name}</h5>
                              <span className="text-[10px] font-mono text-[#366BB2]/60">{conn.url}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/20 text-[10px] font-bold">
                                {conn.status}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs border-t border-gray-900 pt-3">
                            <div>
                              <span className="text-gray-500 block">Tipo de Sistema</span>
                              <span className="text-gray-300 font-semibold">{conn.type}</span>
                            </div>
                            <div>
                              <span className="text-gray-500 block">Frequência de agendamento</span>
                              <span className="text-gray-300 font-mono">{conn.syncInterval}</span>
                            </div>
                            <div>
                              <span className="text-gray-500 block">ITSM CMDB Enhancer</span>
                              <span className={conn.enrichCMDB ? "text-emerald-400 font-semibold" : "text-gray-500"}>
                                {conn.enrichCMDB ? "Enabled" : "Disabled"}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500 block">Última Sincronização</span>
                              <span className="text-gray-400 font-mono">{new Date(conn.lastSynced).toLocaleString()}</span>
                            </div>
                          </div>

                          <div className="border-t border-gray-900 pt-3 flex justify-end gap-2">
                            <button
                              onClick={() => handleTestItsmConnection(conn.type, conn.url)}
                              className="bg-gray-900 hover:bg-gray-850 border border-gray-800 text-gray-300 px-3 py-1 rounded text-[11px] transition font-semibold"
                            >
                              Testar Handshake
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Field Mapping Definitions */}
                  <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                    <h4 className="text-sm font-semibold text-white mb-4">Mapeamento de Atributos CMDB do ITSM Enhancer</h4>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-gray-800 text-gray-400">
                            <th className="pb-2.5">Ativo SAM Descoberto</th>
                            <th className="pb-2.5">Normalização de Data Intelligence</th>
                            <th className="pb-2.5">Mapeamento Alvo ITSM CMDB</th>
                            <th className="pb-2.5 text-right">Sincronização</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-900 text-gray-300">
                          <tr>
                            <td className="py-2.5">Modelo do Computador/CPU</td>
                            <td className="py-2.5 font-mono text-[11px] text-emerald-400">EnrichedSpecs</td>
                            <td className="py-2.5">cmdb_ci_computer.hardware_spec</td>
                            <td className="py-2.5 text-right text-gray-500">Incondicional</td>
                          </tr>
                          <tr>
                            <td className="py-2.5">Serial do Hardware</td>
                            <td className="py-2.5 font-mono text-[11px] text-emerald-400 font-bold">SHA-Verified</td>
                            <td className="py-2.5">cmdb_ci_hardware.serial_number</td>
                            <td className="py-2.5 text-right text-gray-500">Incondicional</td>
                          </tr>
                          <tr>
                            <td className="py-2.5">Editora do Software</td>
                            <td className="py-2.5 font-mono text-[11px] text-emerald-400">DIS Catalog Title</td>
                            <td className="py-2.5">cmdb_software_instance.publisher</td>
                            <td className="py-2.5 text-right text-gray-500">Sob Reconhecimento</td>
                          </tr>
                          <tr>
                            <td className="py-2.5">Versão do Aplicativo</td>
                            <td className="py-2.5 font-mono text-[11px] text-emerald-400">DIS Normalization</td>
                            <td className="py-2.5">cmdb_software_instance.version</td>
                            <td className="py-2.5 text-right text-gray-500">Sob Reconhecimento</td>
                          </tr>
                          <tr>
                            <td className="py-2.5">Datas de ciclo de vida (EOL/EOS)</td>
                            <td className="py-2.5 font-mono text-[11px] text-emerald-400">EOL/EOS Metadata</td>
                            <td className="py-2.5">cmdb_software_instance.lifecycle_status</td>
                            <td className="py-2.5 text-right text-gray-500">Sob Reconhecimento</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* CMDB Enricher Action Dashboard */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-6 h-fit">
                  <div>
                    <h4 className="text-sm font-semibold text-white">Controlador do ITSM CMDB Enhancer</h4>
                    <p className="text-xs text-gray-400 mt-1">
                      Execute a sincronização de tabelas CMDB. Isso limpa entradas redundantes, unifica variações ortográficas de fabricantes e enriquece registros do service desk com marcos de ciclo de vida.
                    </p>
                  </div>

                  {itsmEnriching ? (
                    <div className="bg-gray-950 p-4 rounded-lg border border-indigo-950/30 text-center space-y-2">
                      <RefreshCw className="h-6 w-6 text-[#366BB2]/60 animate-spin mx-auto" />
                      <span className="font-semibold text-white block text-xs">Sincronizando Tabelas de Dados CMDB...</span>
                      <span className="text-[10px] text-gray-500 font-mono">Enviando entradas DIS limpas para ServiceNow</span>
                    </div>
                  ) : (
                    <button
                      onClick={handleTriggerItsmEnrich}
                      className="w-full bg-[#366BB2] text-white cursor-pointer font-semibold py-2.5 rounded-lg transition flex items-center justify-center gap-2 text-xs"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Acionar Sincronização de Enriquecimento de Tabela CMDB
                    </button>
                  )}

                  {itsmEnrichResult && (
                    <div className="bg-gray-950 border border-emerald-500/20 p-4 rounded-lg space-y-3">
                      <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs border-b border-gray-900 pb-2">
                        <Check className="h-4 w-4" />
                        <span>Sincronização de Enriquecimento Concluída</span>
                      </div>
                      <p className="text-[11px] text-gray-400">{itsmEnrichResult.message}</p>
                      
                      <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                        <div className="bg-gray-900 p-2 rounded border border-gray-850">
                          <span className="text-gray-500 block text-[10px]">Hardware atualizado</span>
                          <span className="text-gray-200 font-bold font-mono">{itsmEnrichResult.syncedHardware} nodes</span>
                        </div>
                        <div className="bg-gray-900 p-2 rounded border border-gray-850">
                          <span className="text-gray-500 block text-[10px]">Software normalizado</span>
                          <span className="text-gray-200 font-bold font-mono">{itsmEnrichResult.syncedSoftware} items</span>
                        </div>
                      </div>
                      <span className="text-[9px] text-gray-500 block font-mono text-right">{new Date(itsmEnrichResult.timestamp).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 11: FLEXERA ASSIST AI COMPILATION & DOCS BOT */}
          {activeTab === "assist" && (
            <div className="space-y-6 animate-fade-in" id="assist-tab-content">
              {/* Header */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h3 className="text-base font-semibold text-white">Flexera Assist AI Co-Pilot Hub</h3>
                    <p className="text-xs text-gray-400 mt-1">
                      Resolva cenários complexos de licenciamento, revise estratégias de prontidão para auditoria ou solicite configurações passo a passo de gateway com tecnologia Gemini 3.5 Flash.
                    </p>
                  </div>
                  <Bot className="h-6 w-6 text-[#366BB2]/60 shrink-0" />
                </div>
              </div>

              <div className="grid lg:grid-cols-4 gap-6">
                {/* Chat Panel */}
                <div className="lg:col-span-3 bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col h-[580px]">
                  <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-4" id="chat-messages-container">
                    {chatMessages.map((msg, index) => (
                      <div 
                        key={index} 
                        className={`flex gap-3 text-xs ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                      >
                        {msg.sender === "bot" && (
                          <div className="h-7 w-7 rounded-full bg-indigo-600/25 border border-[#366BB2]/20 flex items-center justify-center shrink-0">
                            <Bot className="h-4 w-4 text-[#366BB2]/60" />
                          </div>
                        )}
                        
                        <div className={`p-4 rounded-xl max-w-[85%] space-y-2 leading-relaxed ${
                          msg.sender === "user" 
                            ? "bg-gray-950 border border-[#366BB2]/20 text-indigo-100 rounded-tr-none" 
                            : "bg-gray-950 border border-gray-850 text-gray-300 rounded-tl-none"
                        }`}>
                          {/* Rich formatting parser */}
                          <div className="whitespace-pre-wrap font-sans space-y-2">
                            {msg.text.split("\n\n").map((para, pIdx) => {
                              // Render code blocks
                              if (para.startsWith("```")) {
                                return (
                                  <pre key={pIdx} className="bg-gray-900 p-3 rounded border border-gray-850 font-mono text-[10px] text-emerald-400 overflow-x-auto">
                                    {para.replace(/```[a-z]*/, "").replace(/```$/, "")}
                                  </pre>
                                );
                              }
                              // Render bullet lines
                              if (para.startsWith("- ") || para.startsWith("* ")) {
                                return (
                                  <ul key={pIdx} className="list-disc pl-4 space-y-1">
                                    {para.split("\n").map((line, lIdx) => (
                                      <li key={lIdx}>
                                        {line.substring(2).replace(/\*\*(.*?)\*\*/g, "$1")}
                                      </li>
                                    ))}
                                  </ul>
                                );
                              }
                              // Render headers
                              if (para.startsWith("### ")) {
                                return (
                                  <h5 key={pIdx} className="text-sm font-bold text-white border-b border-gray-900 pb-1 mt-3">
                                    {para.substring(4)}
                                  </h5>
                                );
                              }
                              // Default inline bold replacement
                              return (
                                <p key={pIdx} dangerouslySetInnerHTML={{
                                  __html: para.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                                }} />
                              );
                            })}
                          </div>
                          
                          <span className="text-[9px] text-gray-500 font-mono block text-right mt-1">
                            {msg.timestamp.toLocaleTimeString()}
                          </span>
                        </div>

                        {msg.sender === "user" && (
                          <div className="h-7 w-7 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center shrink-0">
                            <Users className="h-4 w-4 text-gray-400" />
                          </div>
                        )}
                      </div>
                    ))}

                    {chatLoading && (
                      <div className="flex gap-3 text-xs justify-start">
                        <div className="h-7 w-7 rounded-full bg-indigo-600/25 border border-[#366BB2]/20 flex items-center justify-center shrink-0">
                          <Bot className="h-4 w-4 text-[#366BB2]/60" />
                        </div>
                        <div className="bg-gray-950 border border-gray-850 p-4 rounded-xl text-gray-400 flex items-center gap-2.5">
                          <RefreshCw className="h-3.5 w-3.5 animate-spin text-[#366BB2]/60" />
                          <span>Flexera Assist está raciocinando e analisando o motor de regras SAM...</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Input Form */}
                  <div className="border-t border-gray-800 pt-4 mt-auto">
                    <form 
                      onSubmit={(e) => { e.preventDefault(); handleSendChatMessage(); }} 
                      className="flex gap-2"
                    >
                      <input
                        type="text"
                        placeholder="Pergunte sobre BYOL, compliance, Snow Extenders, CMDB..."
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        disabled={chatLoading}
                        className="flex-1 bg-gray-950 border border-gray-800 hover:border-gray-700 rounded-lg px-4 py-2.5 text-xs text-white outline-none transition"
                      />
                      <button
                        type="submit"
                        disabled={chatLoading || !chatInput.trim()}
                        className="bg-[#366BB2] cursor-pointer disabled:opacity-40 text-white font-semibold px-4 py-2 rounded-lg transition flex items-center gap-1 text-xs shrink-0"
                      >
                        <Send className="h-3.5 w-3.5" />
                        Enviar
                      </button>
                    </form>
                  </div>
                </div>

                {/* Quick-Click Suggestions Panel */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4 h-fit">
                  <div>
                    <h4 className="text-sm font-semibold text-white">Consultas de Assistência Sugeridas</h4>
                    <p className="text-[11px] text-gray-400 mt-1">
                      Selecione um cenário padrão pré-modelado de help-desk para revisar parâmetros automatizados de cálculo de compliance.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <button
                      onClick={() => handleSendChatMessage("Como funciona o licenciamento Cloud BYOL e prevenção de Double-Pay?")}
                      disabled={chatLoading}
                      className="w-full text-left bg-gray-950 border border-gray-850 hover:bg-gray-900 hover:border-gray-800 p-3 rounded-lg text-[11px] text-gray-300 transition hover:text-white block space-y-1"
                    >
                      <span className="font-bold text-[#366BB2]/60 block">Otimização de BYOL na Nuvem</span>
                      <span>Aprenda a combinar licenças ativas diretamente com especificações de VMs AWS/Azure.</span>
                    </button>

                    <button
                      onClick={() => handleSendChatMessage("Como configurar o File Elevator do Snow Extender local?")}
                      disabled={chatLoading}
                      className="w-full text-left bg-gray-950 border border-gray-850 hover:bg-gray-900 hover:border-gray-800 p-3 rounded-lg text-[11px] text-gray-300 transition hover:text-white block space-y-1"
                    >
                      <span className="font-bold text-[#366BB2]/60 block">Configuração do Snow Extender</span>
                      <span>Revise parâmetros de varredura de diretório para arquivos .snow XML locais.</span>
                    </button>

                    <button
                      onClick={() => handleSendChatMessage("O que é o ITSM Enhancer e CMDB Enricher?")}
                      disabled={chatLoading}
                      className="w-full text-left bg-gray-950 border border-gray-850 hover:bg-gray-900 hover:border-gray-800 p-3 rounded-lg text-[11px] text-gray-300 transition hover:text-white block space-y-1"
                    >
                      <span className="font-bold text-[#366BB2]/60 block">Integração CMDB ServiceNow</span>
                      <span>Como especificações mapeadas e deduplicação de fabricantes atualizam o CMDB alvo.</span>
                    </button>

                    <button
                      onClick={() => handleSendChatMessage("Como funciona o motor do Compliance Position (ELP)?")}
                      disabled={chatLoading}
                      className="w-full text-left bg-gray-950 border border-gray-850 hover:bg-gray-900 hover:border-gray-800 p-3 rounded-lg text-[11px] text-gray-300 transition hover:text-white block space-y-1"
                    >
                      <span className="font-bold text-[#366BB2]/60 block">Posição de Licenciamento Efetiva (ELP)</span>
                      <span>Entenda entitlements comprados vs. instalações descobertas em todo o cluster.</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* POPUP FORM MODALS */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in" id="modal-invite-user">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-md space-y-4">
            <h3 className="font-bold text-white text-base">Convidar Perfil de Membro da Equipe</h3>
            <form onSubmit={handleAddUser} className="space-y-3 text-xs text-gray-300">
              <div className="space-y-1">
                <label className="font-semibold text-gray-400">Nome</label>
                <input 
                  type="text" 
                  placeholder="ex.: Érico B." 
                  value={usrName} 
                  onChange={(e) => setUsrName(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded px-3 py-2 text-white outline-none" 
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-gray-400">Endereço de Email</label>
                <input 
                  type="email" 
                  placeholder="ex.: funcionario@empresa.com" 
                  value={usrEmail} 
                  onChange={(e) => setUsrEmail(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded px-3 py-2 text-white outline-none" 
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-gray-400">Atribuição de Função Principal</label>
                <select 
                  value={usrRole} 
                  onChange={(e) => setUsrRole(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded px-3 py-2 text-gray-300 outline-none"
                >
                  {adminRoles.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setShowUserModal(false)} className="bg-gray-850 hover:bg-gray-800 px-4 py-2 rounded font-semibold text-white">Cancelar</button>
                <button type="submit" className="bg-[#366BB2] cursor-pointer px-4 py-2 rounded font-semibold text-white">Enviar Convite</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showRoleModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in" id="modal-create-role">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-md space-y-4">
            <h3 className="font-bold text-white text-base">Configurar Perfil de Função Personalizada</h3>
            <form onSubmit={handleAddRole} className="space-y-3 text-xs text-gray-300">
              <div className="space-y-1">
                <label className="font-semibold text-gray-400">Título da Função</label>
                <input 
                  type="text" 
                  placeholder="ex.: Inspetor Financeiro" 
                  value={roleName} 
                  onChange={(e) => setRoleName(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded px-3 py-2 text-white outline-none" 
                  required
                />
              </div>
              <div className="space-y-3 pt-2 border-t border-gray-850">
                <label className="font-bold text-white block">Matriz de Permissões</label>
                
                {["licenses", "saas", "cloud", "admin", "auditLogs"].map(permKey => (
                  <div key={permKey} className="flex justify-between items-center bg-gray-950 p-2 rounded">
                    <span className="capitalize text-gray-300 font-medium">{permKey} módulos:</span>
                    <select 
                      value={rolePerms[permKey]} 
                      onChange={(e) => setRolePerms({...rolePerms, [permKey]: e.target.value as any})}
                      className="bg-gray-900 border border-gray-800 rounded px-1.5 py-0.5 text-indigo-300"
                    >
                      <option value="None">Nenhum</option>
                      <option value="Read">Somente Leitura</option>
                      <option value="Write">Escrita / CRUD</option>
                    </select>
                  </div>
                ))}
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setShowRoleModal(false)} className="bg-gray-850 hover:bg-gray-800 px-4 py-2 rounded font-semibold text-white">Cancelar</button>
                <button type="submit" className="bg-[#366BB2] cursor-pointer px-4 py-2 rounded font-semibold text-white">Salvar Função</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showGroupModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in" id="modal-create-group">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-md space-y-4">
            <h3 className="font-bold text-white text-base">Novo Grupo de Mapeamento de Segurança</h3>
            <form onSubmit={handleAddGroup} className="space-y-3 text-xs text-gray-300">
              <div className="space-y-1">
                <label className="font-semibold text-gray-400">Nome do Grupo de Segurança</label>
                <input 
                  type="text" 
                  placeholder="ex.: Auditores EMEA" 
                  value={gpName} 
                  onChange={(e) => setGpName(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded px-3 py-2 text-white outline-none" 
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-gray-400">Mapeamento de Função Alvo</label>
                <select 
                  value={gpRole} 
                  onChange={(e) => setGpRole(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded px-3 py-2 text-gray-300 outline-none"
                >
                  {adminRoles.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setShowGroupModal(false)} className="bg-gray-850 hover:bg-gray-800 px-4 py-2 rounded font-semibold text-white">Cancelar</button>
                <button type="submit" className="bg-[#366BB2] cursor-pointer px-4 py-2 rounded font-semibold text-white">Configurar Grupo</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showNodeModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in" id="modal-create-node">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-md space-y-4">
            <h3 className="font-bold text-white text-base">Adicionar Nível de Divisão Hierárquica</h3>
            <form onSubmit={handleAddNode} className="space-y-3 text-xs text-gray-300">
              <div className="space-y-1">
                <label className="font-semibold text-gray-400">Nome da Divisão</label>
                <input 
                  type="text" 
                  placeholder="ex.: Matriz da Região LATAM" 
                  value={nodeName} 
                  onChange={(e) => setNodeName(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded px-3 py-2 text-white outline-none" 
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-gray-400">Código Identificador Único da Org</label>
                <input 
                  type="text" 
                  placeholder="ex.: ACM-LATAM" 
                  value={nodeCode} 
                  onChange={(e) => setNodeCode(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded px-3 py-2 text-white outline-none" 
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-gray-400">Nó estrutural pai</label>
                <select 
                  value={nodeParent} 
                  onChange={(e) => setNodeParent(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded px-3 py-2 text-gray-300 outline-none"
                >
                  <option value="">(Nenhum - estrutura raiz)</option>
                  {orgNodes.map(o => (
                    <option key={o.id} value={o.id}>{o.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-gray-400">Capacidade de licenças alocadas</label>
                <input 
                  type="number" 
                  value={nodeLicenseCount} 
                  onChange={(e) => setNodeLicenseCount(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded px-3 py-2 text-white outline-none" 
                  min="0"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setShowNodeModal(false)} className="bg-gray-850 hover:bg-gray-800 px-4 py-2 rounded font-semibold text-white">Cancelar</button>
                <button type="submit" className="bg-[#366BB2] cursor-pointer px-4 py-2 rounded font-semibold text-white">Adicionar Nó</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSiteModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in" id="modal-create-site">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-md space-y-4">
            <h3 className="font-bold text-white text-base">Registrar Gateways de Site de Inscrição</h3>
            <form onSubmit={handleAddSite} className="space-y-3 text-xs text-gray-300">
              <div className="space-y-1">
                <label className="font-semibold text-gray-400">Nome do Local do Site</label>
                <input 
                  type="text" 
                  placeholder="ex.: LATAM - Escritório São Paulo" 
                  value={siteName} 
                  onChange={(e) => setSiteName(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded px-3 py-2 text-white outline-none" 
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-gray-400">Nó Org Corporativo Mapeado</label>
                <select 
                  value={siteNodeId} 
                  onChange={(e) => setSiteNodeId(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded px-3 py-2 text-gray-300 outline-none"
                  required
                >
                  <option value="">Selecione o Nó Estrutural Mapeado</option>
                  {orgNodes.map(o => (
                    <option key={o.id} value={o.id}>{o.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setShowSiteModal(false)} className="bg-gray-850 hover:bg-gray-800 px-4 py-2 rounded font-semibold text-white">Cancelar</button>
                <button type="submit" className="bg-[#366BB2] cursor-pointer px-4 py-2 rounded font-semibold text-white">Registrar Site</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showIpModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in" id="modal-create-ip">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-md space-y-4">
            <h3 className="font-bold text-white text-base">Regra de Proteção de Rede de Entrada</h3>
            <form onSubmit={handleAddIpPolicy} className="space-y-3 text-xs text-gray-300">
              <div className="space-y-1">
                <label className="font-semibold text-gray-400">Bloco CIDR IP</label>
                <input 
                  type="text" 
                  placeholder="ex.: 201.55.12.0/24" 
                  value={ipCidr} 
                  onChange={(e) => setIpCidr(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded px-3 py-2 text-white outline-none" 
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-gray-400">Descrição breve da regra</label>
                <input 
                  type="text" 
                  placeholder="ex.: VPN segura de desenvolvedores São Paulo" 
                  value={ipDesc} 
                  onChange={(e) => setIpDesc(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded px-3 py-2 text-white outline-none" 
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-gray-400">Ação de Acesso</label>
                <select 
                  value={ipType} 
                  onChange={(e) => setIpType(e.target.value as any)}
                  className="w-full bg-gray-950 border border-gray-800 rounded px-3 py-2 text-gray-300 outline-none"
                >
                  <option value="Allow">PERMITIR conexão de entrada</option>
                  <option value="Deny">NEGAR/BLOQUEAR tráfego de entrada</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setShowIpModal(false)} className="bg-gray-850 hover:bg-gray-800 px-4 py-2 rounded font-semibold text-white">Cancelar</button>
                <button type="submit" className="bg-[#366BB2] cursor-pointer px-4 py-2 rounded font-semibold text-white">Aplicar Política</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCurModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in" id="modal-create-cur">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-md space-y-4">
            <h3 className="font-bold text-white text-base">Taxa de Conversão de Moeda Consolidada</h3>
            <form onSubmit={handleAddCurrency} className="space-y-3 text-xs text-gray-300">
              <div className="space-y-1">
                <label className="font-semibold text-gray-400">Código da moeda (sigla)</label>
                <input 
                  type="text" 
                  placeholder="ex.: CAD" 
                  value={curCode} 
                  onChange={(e) => setCurCode(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded px-3 py-2 text-white outline-none" 
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-gray-400">Representação do Símbolo</label>
                <input 
                  type="text" 
                  placeholder="ex.: C$" 
                  value={curSymbol} 
                  onChange={(e) => setCurSymbol(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded px-3 py-2 text-white outline-none" 
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-gray-400">Fator de taxa de conversão base relativo ao USD</label>
                <input 
                  type="number" 
                  placeholder="ex.: 1.35" 
                  value={curRate} 
                  step="0.001"
                  onChange={(e) => setCurRate(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded px-3 py-2 text-white outline-none" 
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setShowCurModal(false)} className="bg-gray-850 hover:bg-gray-800 px-4 py-2 rounded font-semibold text-white">Cancelar</button>
                <button type="submit" className="bg-[#366BB2] cursor-pointer px-4 py-2 rounded font-semibold text-white">Registrar Taxa</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showMspModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in" id="modal-create-msp">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-md space-y-4">
            <h3 className="font-bold text-white text-base">Provisionar Área de Tenant Multicliente</h3>
            <form onSubmit={handleAddMspCustomer} className="space-y-3 text-xs text-gray-300">
              <div className="space-y-1">
                <label className="font-semibold text-gray-400">Nome Legal da Empresa Cliente</label>
                <input 
                  type="text" 
                  placeholder="ex.: Delta Air Lines inc" 
                  value={mspName} 
                  onChange={(e) => setMspName(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded px-3 py-2 text-white outline-none" 
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-gray-400">Alvo inicial de pontuação de Compliance (%)</label>
                <input 
                  type="number" 
                  value={mspScore} 
                  onChange={(e) => setMspScore(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded px-3 py-2 text-white outline-none" 
                  min="0" max="100"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-gray-400">Quantidade inicial de licenças possuídas</label>
                <input 
                  type="number" 
                  value={mspLics} 
                  onChange={(e) => setMspLics(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded px-3 py-2 text-white outline-none" 
                  min="0"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-gray-400">Quantidade inicial de dispositivos descobertos</label>
                <input 
                  type="number" 
                  value={mspDevs} 
                  onChange={(e) => setMspDevs(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded px-3 py-2 text-white outline-none" 
                  min="0"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setShowMspModal(false)} className="bg-gray-850 hover:bg-gray-800 px-4 py-2 rounded font-semibold text-white">Cancelar</button>
                <button type="submit" className="bg-[#366BB2] cursor-pointer px-4 py-2 rounded font-semibold text-white">Provisionar Tenant</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showItsmModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in" id="modal-create-itsm">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-md space-y-4">
            <h3 className="font-bold text-white text-base">Configurar Conexão de Gateway ITSM</h3>
            <form onSubmit={handleCreateItsmConnector} className="space-y-3 text-xs text-gray-300">
              <div className="space-y-1">
                <label className="font-semibold text-gray-400">Título da Conexão</label>
                <input 
                  type="text" 
                  placeholder="ex.: Instância ServiceNow de Produção" 
                  value={newItsmName} 
                  onChange={(e) => setNewItsmName(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded px-3 py-2 text-white outline-none" 
                  required
                />
              </div>
              
              <div className="space-y-1">
                <label className="font-semibold text-gray-400">Tipo de Provedor da Plataforma</label>
                <select 
                  value={newItsmType}
                  onChange={(e) => setNewItsmType(e.target.value as any)}
                  className="w-full bg-gray-950 border border-gray-800 rounded px-3 py-2 text-white outline-none"
                >
                  <option value="ServiceNow">ServiceNow (API V2)</option>
                  <option value="Jira Service Desk">Jira Service Desk Cloud</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-gray-400">URL do Endpoint REST API Alvo</label>
                <input 
                  type="url" 
                  placeholder="https://sua-instancia.service-now.com" 
                  value={newItsmUrl} 
                  onChange={(e) => setNewItsmUrl(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded px-3 py-2 text-white outline-none font-mono" 
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-gray-400">Agendamento de Frequência de Sincronização</label>
                <select 
                  value={newItsmSyncInterval}
                  onChange={(e) => setNewItsmSyncInterval(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded px-3 py-2 text-white outline-none"
                >
                  <option value="Every 6 Hours">A Cada 6 Horas</option>
                  <option value="Every 12 Hours">A Cada 12 Horas (Recomendado)</option>
                  <option value="Every 24 Hours">A Cada 24 Horas</option>
                  <option value="Weekly Sync">Sincronização Semanal</option>
                </select>
              </div>

              <div className="py-2">
                <label className="flex items-center gap-2.5 cursor-pointer text-gray-300 hover:text-white">
                  <input 
                    type="checkbox" 
                    checked={newItsmEnrichCMDB} 
                    onChange={(e) => setNewItsmEnrichCMDB(e.target.checked)}
                    className="rounded border-gray-800 bg-gray-900 text-[#366BB2]"
                  />
                  <span>Enriquecer tabelas CMDB com EOL de hardware e títulos de software</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setShowItsmModal(false)} className="bg-gray-850 hover:bg-gray-800 px-4 py-2 rounded font-semibold text-white">Cancelar</button>
                <button type="submit" className="bg-[#366BB2] cursor-pointer px-4 py-2 rounded font-semibold text-white">Salvar Conector</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
