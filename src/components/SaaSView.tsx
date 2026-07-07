import React, { useState, useEffect } from "react";
import { 
  Cloud, 
  Layers, 
  Search, 
  Users, 
  TrendingDown, 
  AlertTriangle, 
  PlusCircle, 
  Trash2, 
  Edit, 
  RefreshCw, 
  Play, 
  CheckCircle, 
  Upload, 
  Database, 
  AlertCircle, 
  Calendar, 
  DollarSign, 
  Info, 
  ArrowRight,
  ShieldAlert,
  ChevronRight,
  Sparkles,
  Award
} from "lucide-react";
import { motion } from "motion/react";
import { HintTooltip } from "./HintTooltip.js";
import { 
  SaaSApplication, 
  SaaSSubscription, 
  SaaSSubscriptionPurchase, 
  SaaSUser, 
  SaaSUserActivity, 
  SaaSConnector 
} from "../types.js";

interface SaaSViewProps {
  onRefreshAll?: () => void;
}

export function SaaSView({ onRefreshAll }: SaaSViewProps) {
  // SaaS Data States
  const [apps, setApps] = useState<SaaSApplication[]>([]);
  const [subscriptions, setSubscriptions] = useState<SaaSSubscription[]>([]);
  const [purchases, setPurchases] = useState<SaaSSubscriptionPurchase[]>([]);
  const [users, setUsers] = useState<SaaSUser[]>([]);
  const [activities, setActivities] = useState<SaaSUserActivity[]>([]);
  const [connectors, setConnectors] = useState<SaaSConnector[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // UI States
  const [activeTab, setActiveTab] = useState<"OVERVIEW" | "SUBSCRIPTIONS" | "USERS" | "CONNECTORS">("OVERVIEW");
  const [searchQuery, setSearchQuery] = useState("");
  const [syncLogs, setSyncLogs] = useState<string[]>([
    "SaaS Management module loaded successfully.",
    "System standing by for multi-source connector synchronization."
  ]);
  const [isSyncing, setIsSyncing] = useState<string | null>(null);
  
  // Modal & Form States
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<SaaSSubscription | null>(null);
  const [subForm, setSubForm] = useState({
    saasApplicationId: "",
    sku: "",
    planName: "",
    billingFrequency: "Monthly" as "Monthly" | "Annually",
    seatsTotal: 10,
    seatsAssigned: 0,
    costPerSeat: 10,
    currency: "USD",
    status: "Active" as "Active" | "Expired" | "Suspended",
    isFree: false,
    isExcluded: false,
    expirationDate: ""
  });

  // CSV Simulation State
  const [csvRawText, setCsvRawText] = useState(JSON.stringify([
    { email: "lucas.silva@company.com", name: "Lucas Silva", appName: "Notion", costPerSeat: 8, activityLevel: "Active", usageDurationMinutes: 450 },
    { email: "david.miller@company.com", name: "David Miller", appName: "Notion", costPerSeat: 8, activityLevel: "Low Activity", usageDurationMinutes: 20 },
    { email: "carol.macedo@company.com", name: "Ana Carol Macedo", appName: "Figma Pro", costPerSeat: 15, activityLevel: "Active", usageDurationMinutes: 1200 },
    { email: "charlie.brown@company.com", name: "Charlie Brown", appName: "Copy.ai", costPerSeat: 30, activityLevel: "Active", usageDurationMinutes: 90 }
  ], null, 2));
  const [csvStatusMsg, setCsvStatusMsg] = useState<string | null>(null);

  // Browser Extension Simulator State
  const [extensionUrl, setExtensionUrl] = useState("https://figma.com/file/marketing-campaign");
  const [extensionEmail, setExtensionEmail] = useState("roberta.sales@company.com");
  const [extensionName, setExtensionName] = useState("Roberta Sales");
  const [extensionDept, setExtensionDept] = useState("Marketing");
  const [isSimulatingExtension, setIsSimulatingExtension] = useState(false);
  const [extensionResult, setExtensionResult] = useState<any>(null);

  // Load All Data
  const loadSaaSData = async () => {
    setIsLoading(true);
    try {
      const [appsRes, subsRes, purRes, usersRes, actRes, connRes] = await Promise.all([
        fetch("/api/saas/applications"),
        fetch("/api/saas/subscriptions"),
        fetch("/api/saas/subscriptions/purchases"),
        fetch("/api/saas/users"),
        fetch("/api/saas/user-activities"),
        fetch("/api/saas/connectors")
      ]);

      if (appsRes.ok && subsRes.ok && purRes.ok && usersRes.ok && actRes.ok && connRes.ok) {
        setApps(await appsRes.json());
        setSubscriptions(await subsRes.json());
        setPurchases(await purRes.json());
        setUsers(await usersRes.json());
        setActivities(await actRes.json());
        setConnectors(await connRes.json());
      }
    } catch (error) {
      console.error("Failed to load SaaS Management databases:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSaaSData();
  }, []);

  // Sync Connector Call
  const handleSyncConnector = async (id: string, name: string) => {
    setIsSyncing(id);
    const newLogs = [...syncLogs, `[${new Date().toLocaleTimeString()}] Initializing synchronization of ${name}...`];
    setSyncLogs(newLogs);
    
    try {
      const res = await fetch(`/api/saas/connectors/${id}/sync`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        // Append backend logs to console
        setSyncLogs(prev => [
          ...prev, 
          ...data.logs.map((l: string) => `[${new Date().toLocaleTimeString()}] ${l}`),
          `[${new Date().toLocaleTimeString()}] Synchronization with ${name} finished successfully.`
        ]);
        // Reload SaaS numbers
        await loadSaaSData();
        if (onRefreshAll) onRefreshAll();
      } else {
        setSyncLogs(prev => [...prev, `[ERROR] Failed to synchronize ${name}.`]);
      }
    } catch (e: any) {
      setSyncLogs(prev => [...prev, `[ERROR] Network failure during sync: ${e.message}`]);
    } finally {
      setIsSyncing(null);
    }
  };

  // Run Manual Consolidation (Deduplication)
  const handleConsolidate = async () => {
    const startLogs = [...syncLogs, `[${new Date().toLocaleTimeString()}] Triggering manual multi-source account consolidation...`];
    setSyncLogs(startLogs);
    try {
      const res = await fetch("/api/saas/consolidate", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setSyncLogs(prev => [
          ...prev,
          `[RESULT] Merged ${data.mergedUsersCount} duplicate accounts.`,
          ...data.logs.map((l: string) => `[RECON] ${l}`),
          `[RESULT] Identity source normalization complete.`
        ]);
        await loadSaaSData();
      }
    } catch (e: any) {
      setSyncLogs(prev => [...prev, `[ERROR] Identity consolidation failed: ${e.message}`]);
    }
  };

  // Import Simualted CSV Data
  const handleImportCsv = async () => {
    try {
      setCsvStatusMsg("Uploading and processing CSV matrix...");
      const parsedData = JSON.parse(csvRawText);
      const res = await fetch("/api/saas/import-csv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csvData: parsedData })
      });
      if (res.ok) {
        const result = await res.json();
        setCsvStatusMsg(`Successfully imported ${result.addedActivities} usage rows! Added ${result.addedApps} apps, consolidated unified users.`);
        setSyncLogs(prev => [
          ...prev,
          `[CSV IMPORT] Processed new batch. Consolidated active accounts.`
        ]);
        await loadSaaSData();
      } else {
        const err = await res.json();
        setCsvStatusMsg(`Failed to import: ${err.error}`);
      }
    } catch (e: any) {
      setCsvStatusMsg(`Syntax Error in Simulated CSV JSON: ${e.message}`);
    }
  };

  // Simulate Extension Visit Telemetry Submission
  const handleSimulateExtensionVisit = async () => {
    setIsSimulatingExtension(true);
    setExtensionResult(null);
    try {
      const res = await fetch("/api/saas/discover-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: extensionUrl,
          email: extensionEmail,
          name: extensionName,
          department: extensionDept
        })
      });
      if (res.ok) {
        const data = await res.json();
        setExtensionResult(data);
        setSyncLogs(prev => [
          ...prev,
          `[TELEMETRY] Browser extension captured access to: ${extensionUrl}`,
          `[DISCOVERY] Identified application: ${data.application.name} (Risk: ${data.application.riskScore}/100)`,
          `[IDENTITY] Mapped session to corporate user: ${data.user.email} (${data.user.department})`,
          ...(data.incrementedSeat ? [`[SUBSCRIPTION] Automatically registered newly occupied seat on active SKU!`] : []),
          ...(data.consolidationLogs || []).map((l: string) => `[RECON] ${l}`)
        ]);
        // Reload list of applications, users and activities
        await loadSaaSData();
        if (onRefreshAll) onRefreshAll();
      } else {
        const err = await res.json();
        setExtensionResult({ success: false, message: err.error || "Failed to transmit telemetry" });
      }
    } catch (e: any) {
      setExtensionResult({ success: false, message: e.message || "Network error" });
    } finally {
      setIsSimulatingExtension(false);
    }
  };

  // Create or Update Subscription
  const handleSaveSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subForm.saasApplicationId) {
      alert("Please select a SaaS Application first.");
      return;
    }

    try {
      const url = editingSub 
        ? `/api/saas/subscriptions/${editingSub.id}`
        : "/api/saas/subscriptions";
      const method = editingSub ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subForm)
      });

      if (res.ok) {
        setIsSubModalOpen(false);
        setEditingSub(null);
        // Reset subForm
        setSubForm({
          saasApplicationId: "",
          sku: "",
          planName: "",
          billingFrequency: "Monthly",
          seatsTotal: 10,
          seatsAssigned: 0,
          costPerSeat: 10,
          currency: "USD",
          status: "Active",
          isFree: false,
          isExcluded: false,
          expirationDate: ""
        });
        await loadSaaSData();
        if (onRefreshAll) onRefreshAll();
      }
    } catch (e: any) {
      alert(`Failed to save subscription: ${e.message}`);
    }
  };

  // Trigger Edit Subscription Modal
  const handleEditSubscriptionClick = (sub: SaaSSubscription) => {
    setEditingSub(sub);
    setSubForm({
      saasApplicationId: sub.saasApplicationId,
      sku: sub.sku,
      planName: sub.planName,
      billingFrequency: sub.billingFrequency,
      seatsTotal: sub.seatsTotal,
      seatsAssigned: sub.seatsAssigned,
      costPerSeat: sub.costPerSeat,
      currency: sub.currency,
      status: sub.status,
      isFree: sub.isFree,
      isExcluded: sub.isExcluded,
      expirationDate: sub.expirationDate || ""
    });
    setIsSubModalOpen(true);
  };

  // Delete Subscription
  const handleDeleteSubscription = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this subscription and its purchase logs?")) return;
    try {
      const res = await fetch(`/api/saas/subscriptions/${id}`, { method: "DELETE" });
      if (res.ok) {
        await loadSaaSData();
        if (onRefreshAll) onRefreshAll();
      }
    } catch (e: any) {
      alert(`Delete error: ${e.message}`);
    }
  };

  // Toggle App Approval
  const handleToggleApproval = async (appId: string, currentVal: boolean) => {
    try {
      const res = await fetch(`/api/saas/applications/${appId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isApproved: !currentVal })
      });
      if (res.ok) {
        await loadSaaSData();
      }
    } catch (e: any) {
      console.error(e);
    }
  };

  // CALCULATE FINANCIAL METRICS & OPTIMIZATION INSIGHTS
  const calculateMetrics = () => {
    let totalMonthlySpend = 0;
    let totalUnassignedMonthlyWaste = 0;
    let totalInactiveMonthlyWaste = 0;
    let activeSubscriptionsCount = 0;
    
    // Calculate spend and seat leaks
    subscriptions.forEach(sub => {
      if (sub.status === "Active" && !sub.isFree && !sub.isExcluded) {
        const monthlyCost = sub.seatsTotal * sub.costPerSeat;
        totalMonthlySpend += monthlyCost;
        activeSubscriptionsCount++;

        // Unassigned waste calculation
        const unassignedSeats = Math.max(0, sub.seatsTotal - sub.seatsAssigned);
        totalUnassignedMonthlyWaste += unassignedSeats * sub.costPerSeat;
      }
    });

    // Inactive seat calculation
    // Map of apps and cost
    const appCostMap: { [appId: string]: number } = {};
    subscriptions.forEach(sub => {
      appCostMap[sub.saasApplicationId] = sub.costPerSeat;
    });

    // David Miller (Adobe), bob.smith (Salesforce) are inactive in our seed database.
    // Let's look up how many "Inactive" level activities we have and charge them
    activities.forEach(act => {
      if (act.activityLevel === "Inactive" || act.activityLevel === "No Activity") {
        const cost = appCostMap[act.saasApplicationId] || 0;
        totalInactiveMonthlyWaste += cost;
      }
    });

    const totalOptimizationPotential = totalUnassignedMonthlyWaste + totalInactiveMonthlyWaste;

    // Shadow IT applications (unapproved apps)
    const shadowApps = apps.filter(a => !a.isApproved);
    
    // Vendor Families counts
    const families = {
      m365: subscriptions.filter(s => {
        const app = apps.find(a => a.id === s.saasApplicationId);
        return app?.familyName === "Microsoft 365" || app?.name.includes("365");
      }),
      adobe: subscriptions.filter(s => {
        const app = apps.find(a => a.id === s.saasApplicationId);
        return app?.familyName === "Adobe Creative Cloud" || app?.name.includes("Adobe");
      }),
      salesforce: subscriptions.filter(s => {
        const app = apps.find(a => a.id === s.saasApplicationId);
        return app?.familyName === "Salesforce" || app?.name.includes("Salesforce");
      }),
      servicenow: subscriptions.filter(s => {
        const app = apps.find(a => a.id === s.saasApplicationId);
        return app?.familyName === "ServiceNow" || app?.name.includes("ServiceNow");
      })
    };

    return {
      totalMonthlySpend,
      totalUnassignedMonthlyWaste,
      totalInactiveMonthlyWaste,
      totalOptimizationPotential,
      activeSubscriptionsCount,
      shadowApps,
      families
    };
  };

  const metrics = calculateMetrics();

  // FILTERED LISTS
  const filteredApps = apps.filter(app => 
    app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.publisher.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8" id="saas-view-container">
      
      {/* SaaS Hub Premium Header */}
      <div className="bg-slate-900 text-white rounded-2xl p-8 relative overflow-hidden shadow-xl border border-slate-800">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/30 via-slate-900 to-slate-900 z-0"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl z-0"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full" style={{background: "rgba(0,84,159,0.2)", color: "#A8D0F5", border: "1px solid rgba(0,84,159,0.3)"}}>
              SaaS Asset Management Module
            </span>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold tracking-tight text-white font-sans sm:text-3xl">
                SaaS Multi-Source Operations
              </h2>
              <HintTooltip text="Manage SaaS application subscriptions, track user assignments, monitor license utilization, and identify cost optimization opportunities across all SaaS vendors." side="right" size="md" />
            </div>
            <p className="text-slate-400 text-sm max-w-2xl font-medium">
              Consolidate single-source subscriptions, discover unmanaged shadow IT services, track interactive user activities, and reclaim unassigned software seats instantly.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={loadSaaSData}
              disabled={isLoading}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-800/80 text-white rounded-lg text-xs font-semibold flex items-center gap-2 border border-slate-700 transition-all cursor-pointer shadow-sm"
              id="saas-refresh-btn"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
              Re-evaluate All
            </button>
            <button
              onClick={handleConsolidate}
              className="px-4 py-2.5 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer" style={{background: "#00549F"}}
              id="saas-consolidate-btn"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Consolidate Logins
            </button>
          </div>
        </div>

        {/* Bento Spend Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8 pt-8 border-t border-slate-800/80 relative z-10">
          
          <div className="bg-slate-950/40 p-5 rounded-xl border border-slate-800/50">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Monthly Spend</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-extrabold text-white font-mono leading-none">
              ${metrics.totalMonthlySpend.toLocaleString()}<span className="text-xs text-slate-500 ml-1">USD</span>
            </p>
            <p className="text-[10px] text-slate-400 mt-2 font-medium">
              Across <span className="text-white font-bold">{metrics.activeSubscriptionsCount}</span> active subscriptions
            </p>
          </div>

          <div className="bg-slate-950/40 p-5 rounded-xl border border-slate-800/50">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Optimizable potential</span>
              <TrendingDown className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-2xl font-extrabold text-amber-400 font-mono leading-none">
              ${metrics.totalOptimizationPotential.toLocaleString()}<span className="text-xs text-slate-500 ml-1">/mo</span>
            </p>
            <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-400 font-medium">
              <span className="bg-amber-500/15 text-amber-300 px-1.5 py-0.5 rounded font-bold font-mono">
                {((metrics.totalOptimizationPotential / (metrics.totalMonthlySpend || 1)) * 100).toFixed(0)}% Waste
              </span>
              <span>Reclaimable instantly</span>
            </div>
          </div>

          <div className="bg-slate-950/40 p-5 rounded-xl border border-slate-800/50">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Unassigned Seats waste</span>
              <Layers className="w-4 h-4 text-orange-400" />
            </div>
            <p className="text-2xl font-extrabold text-white font-mono leading-none">
              ${metrics.totalUnassignedMonthlyWaste.toLocaleString()}<span className="text-xs text-slate-500 ml-1">/mo</span>
            </p>
            <p className="text-[10px] text-slate-400 mt-2 font-medium">
              Idle purchased seats awaiting setup
            </p>
          </div>

          <div className="bg-slate-950/40 p-5 rounded-xl border border-slate-800/50">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Shadow IT Threats</span>
              <ShieldAlert className="w-4 h-4 text-rose-400 animate-pulse" />
            </div>
            <p className="text-2xl font-extrabold text-rose-400 font-mono leading-none">
              {metrics.shadowApps.length} Unapproved
            </p>
            <p className="text-[10px] text-slate-400 mt-2 font-medium">
              High risk-score SaaS apps discovered
            </p>
          </div>

        </div>
      </div>

      {/* View Selector Tabs */}
      <div className="border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-2">
          {(["OVERVIEW", "SUBSCRIPTIONS", "USERS", "CONNECTORS"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setSearchQuery("");
              }}
              className={`pb-4 px-4 text-xs font-bold transition-all relative cursor-pointer ${
                activeTab === tab
                  ? "text-[#00549F] border-b-2 border-[#00549F]"
                  : "text-slate-400 hover:text-slate-600"
              }`}
              id={`saas-tab-${tab.toLowerCase()}`}
            >
              {tab === "OVERVIEW" && "Control Dashboard"}
              {tab === "SUBSCRIPTIONS" && "Active Subscriptions"}
              {tab === "USERS" && "Consolidated Identities"}
              {tab === "CONNECTORS" && "Multi-source Integrations"}
            </button>
          ))}
        </div>

        {activeTab !== "CONNECTORS" && (
          <div className="relative pb-3 w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder={`Search ${activeTab.toLowerCase()}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              id="saas-search-input"
            />
          </div>
        )}
      </div>

      {/* TAB CONTENTS */}

      {/* 1. OVERVIEW CONTROL DASHBOARD */}
      {activeTab === "OVERVIEW" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left 2 Columns: Catalog and Optimization alerts */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Optimization Insights Bento Block */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-indigo-500" />
                  <h3 className="font-bold text-slate-800 text-sm">Critical Cost Reclamation Insights</h3>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded font-bold font-mono" style={{background: "#D1E7F3", color: "#1468B3"}}>
                  Real-time Actionable
                </span>
              </div>

              <div className="space-y-3">
                {/* Check Inactive Adobe seats */}
                {activities.some(a => a.activityLevel === "Inactive" && a.saasApplicationId === "saas-app-adobe-cc") && (
                  <div className="flex items-start gap-3 p-4 bg-amber-50/70 rounded-lg border border-amber-100 text-xs">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="flex-1 space-y-1">
                      <p className="font-bold text-slate-900">Adobe Creative Cloud User Inactivity detected</p>
                      <p className="text-slate-600">
                        <span className="font-bold text-slate-800">David Miller</span> has an active All Apps license ($80/mo) but has no login activity recorded for <span className="font-bold text-slate-800 font-mono">117 days</span>.
                      </p>
                      <button 
                        onClick={() => {
                          setActiveTab("USERS");
                          setSearchQuery("David");
                        }} 
                        className="font-bold hover:underline flex items-center gap-1 mt-1 cursor-pointer" style={{color: "#00549F"}}
                      >
                        Reallocate/Cancel subscription seat <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                    <span className="font-mono font-bold text-amber-700">-$80.00/mo</span>
                  </div>
                )}

                {/* Unassigned Seats alert */}
                {subscriptions.some(s => s.seatsTotal > s.seatsAssigned) && (
                  <div className="flex items-start gap-3 p-4 bg-orange-50/70 rounded-lg border border-orange-100 text-xs">
                    <Info className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                    <div className="flex-1 space-y-1">
                      <p className="font-bold text-slate-900">Unassigned Purchased SaaS Seats detected</p>
                      <div className="text-slate-600 space-y-1">
                        {subscriptions.map(s => {
                          const diff = s.seatsTotal - s.seatsAssigned;
                          if (diff > 0) {
                            const app = apps.find(a => a.id === s.saasApplicationId);
                            return (
                              <p key={s.id}>
                                • <span className="font-semibold text-slate-800">{app?.name} ({s.planName})</span> has <span className="font-bold font-mono text-slate-800">{diff}</span> unassigned seats. Waste: <span className="font-bold font-mono">${(diff * s.costPerSeat).toFixed(0)}/mo</span>.
                              </p>
                            );
                          }
                          return null;
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Shadow IT Danger Alert */}
                {metrics.shadowApps.length > 0 && (
                  <div className="flex items-start gap-3 p-4 bg-rose-50/80 rounded-lg border border-rose-100 text-xs">
                    <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div className="flex-1 space-y-1">
                      <p className="font-bold text-rose-900">High Risk Shadow IT SaaS Applications Active</p>
                      <p className="text-rose-800/80">
                        We detected unapproved third-party cloud tools used via proxy logs or Defender CASB integrations:
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                        {metrics.shadowApps.map(app => (
                          <div key={app.id} className="bg-white/80 p-2.5 rounded border border-rose-100 flex items-center justify-between">
                            <div>
                              <p className="font-bold text-slate-900 text-xs">{app.name}</p>
                              <p className="text-[10px] text-slate-500">Publisher: {app.publisher}</p>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] font-bold bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded">
                                Risk {app.riskScore}/100
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <p className="text-[10px] text-slate-500 pt-1">
                        *Mark these applications as approved or block access directly through your integrated CASB rules.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* SaaS Catalog Listing & Approval Control */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Discovered SaaS Catalog ({filteredApps.length})</h3>
                  <p className="text-[10px] text-slate-400">Continuous background detection via browser extensions, CASB, and Okta SSO integrations</p>
                </div>
                <button
                  onClick={() => {
                    setActiveTab("SUBSCRIPTIONS");
                    setIsSubModalOpen(true);
                  }}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  Add Custom Vendor
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-bold">
                      <th className="pb-3 font-semibold">Application</th>
                      <th className="pb-3 font-semibold">Publisher & Category</th>
                      <th className="pb-3 font-semibold">Security Risk</th>
                      <th className="pb-3 font-semibold">Discovery Sources</th>
                      <th className="pb-3 font-semibold">Governance Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredApps.map(app => (
                      <tr key={app.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded flex items-center justify-center font-bold text-xs uppercase ${
                              app.isApproved ? "bg-[#D1E7F3] text-[#00549F]" : "bg-rose-50 text-rose-700"
                            }`}>
                              {app.name.substring(0, 2)}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">{app.name}</p>
                              {app.familyName && (
                                <span className="text-[9px] bg-slate-100 text-slate-500 font-medium px-1 py-0.5 rounded block w-fit mt-0.5">
                                  {app.familyName} Suite
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 text-slate-600">
                          <p className="font-medium">{app.publisher}</p>
                          <p className="text-[10px] text-slate-400">{app.category}</p>
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-12 bg-slate-100 rounded-full h-1.5">
                              <div 
                                className={`h-1.5 rounded-full ${
                                  app.riskScore > 70 ? "bg-rose-500" : app.riskScore > 30 ? "bg-amber-500" : "bg-emerald-500"
                                }`}
                                style={{ width: `${app.riskScore}%` }}
                              ></div>
                            </div>
                            <span className="font-mono font-semibold text-[11px] text-slate-600">
                              {app.riskScore}/100
                            </span>
                          </div>
                        </td>
                        <td className="py-3">
                          <div className="flex flex-wrap gap-1 max-w-[180px]">
                            {app.discoveredSources?.map((src, i) => (
                              <span key={i} className="text-[9px] bg-slate-50 text-slate-500 border border-slate-200/50 px-1 py-0.2 rounded font-medium">
                                {src}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3">
                          <button
                            onClick={() => handleToggleApproval(app.id, app.isApproved)}
                            className={`px-2.5 py-1 rounded text-[10px] font-bold tracking-tight transition-all cursor-pointer ${
                              app.isApproved 
                                ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/50"
                                : "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/50"
                            }`}
                          >
                            {app.isApproved ? "Approved Vendor" : "Unapproved Shadow IT"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* Right Column: Vendor SaaS Families, simulated imports */}
          <div className="space-y-8">
            
            {/* Vendor SaaS Families Bento Block */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-800 text-sm">Vendor License Families</h3>
                <p className="text-[10px] text-slate-400">Grouping licenses by software publishers and product lines</p>
              </div>

              <div className="space-y-3">
                
                {/* M365 */}
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/60">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-slate-800 text-xs">Microsoft 365 Family</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold" style={{background: "#D1E7F3", color: "#1468B3"}}>
                      {metrics.families.m365.length} Subs
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-[10px] text-slate-600 font-semibold font-mono">
                    <div className="bg-white py-1 rounded border border-slate-100">
                      <p className="text-[8px] text-slate-400 font-sans uppercase">Total</p>
                      <p className="text-slate-800 font-bold">{metrics.families.m365.reduce((acc, s) => acc + s.seatsTotal, 0)}</p>
                    </div>
                    <div className="bg-white py-1 rounded border border-slate-100">
                      <p className="text-[8px] text-slate-400 font-sans uppercase">Assigned</p>
                      <p style={{color: "#00549F"}} className="font-bold">{metrics.families.m365.reduce((acc, s) => acc + s.seatsAssigned, 0)}</p>
                    </div>
                    <div className="bg-white py-1 rounded border border-slate-100">
                      <p className="text-[8px] text-slate-400 font-sans uppercase">Unassigned</p>
                      <p className="text-amber-600 font-bold">
                        {Math.max(0, metrics.families.m365.reduce((acc, s) => acc + (s.seatsTotal - s.seatsAssigned), 0))}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Adobe */}
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/60">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-slate-800 text-xs">Adobe CC Suite</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold" style={{background: "#D1E7F3", color: "#1468B3"}}>
                      {metrics.families.adobe.length} Subs
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-[10px] text-slate-600 font-semibold font-mono">
                    <div className="bg-white py-1 rounded border border-slate-100">
                      <p className="text-[8px] text-slate-400 font-sans uppercase">Total</p>
                      <p className="text-slate-800 font-bold">{metrics.families.adobe.reduce((acc, s) => acc + s.seatsTotal, 0)}</p>
                    </div>
                    <div className="bg-white py-1 rounded border border-slate-100">
                      <p className="text-[8px] text-slate-400 font-sans uppercase">Assigned</p>
                      <p style={{color: "#00549F"}} className="font-bold">{metrics.families.adobe.reduce((acc, s) => acc + s.seatsAssigned, 0)}</p>
                    </div>
                    <div className="bg-white py-1 rounded border border-slate-100">
                      <p className="text-[8px] text-slate-400 font-sans uppercase">Unassigned</p>
                      <p className="text-amber-600 font-bold">
                        {Math.max(0, metrics.families.adobe.reduce((acc, s) => acc + (s.seatsTotal - s.seatsAssigned), 0))}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Salesforce */}
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/60">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-slate-800 text-xs">Salesforce Cloud CRM</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold" style={{background: "#D1E7F3", color: "#1468B3"}}>
                      {metrics.families.salesforce.length} Subs
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-[10px] text-slate-600 font-semibold font-mono">
                    <div className="bg-white py-1 rounded border border-slate-100">
                      <p className="text-[8px] text-slate-400 font-sans uppercase">Total</p>
                      <p className="text-slate-800 font-bold">{metrics.families.salesforce.reduce((acc, s) => acc + s.seatsTotal, 0)}</p>
                    </div>
                    <div className="bg-white py-1 rounded border border-slate-100">
                      <p className="text-[8px] text-slate-400 font-sans uppercase">Assigned</p>
                      <p style={{color: "#00549F"}} className="font-bold">{metrics.families.salesforce.reduce((acc, s) => acc + s.seatsAssigned, 0)}</p>
                    </div>
                    <div className="bg-white py-1 rounded border border-slate-100">
                      <p className="text-[8px] text-slate-400 font-sans uppercase">Unassigned</p>
                      <p className="text-amber-600 font-bold">
                        {Math.max(0, metrics.families.salesforce.reduce((acc, s) => acc + (s.seatsTotal - s.seatsAssigned), 0))}
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Simulated CSV/API Bulk Import Portal */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
              <div>
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-slate-500" />
                  Custom CSV / JSON Import
                </h3>
                <p className="text-[10px] text-slate-400">Paste bulk cloud usage datasets directly to trigger automated discovery</p>
              </div>

              <div className="space-y-3">
                <textarea
                  value={csvRawText}
                  onChange={(e) => setCsvRawText(e.target.value)}
                  className="w-full h-36 bg-slate-900 text-emerald-400 font-mono text-[10px] p-3 rounded border border-slate-800 focus:outline-hidden"
                  id="saas-csv-textarea"
                />
                
                {csvStatusMsg && (
                  <p className="text-[10px] bg-slate-50 text-slate-600 p-2 rounded border border-slate-100 font-medium leading-normal">
                    {csvStatusMsg}
                  </p>
                )}

                <button
                  onClick={handleImportCsv}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-bold transition-all cursor-pointer shadow-xs"
                  id="saas-import-csv-btn"
                >
                  Parse & Import Matrix Logs
                </button>
              </div>
            </div>

            {/* SaaS Browser Extension Discovery Simulator */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
              <div>
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-indigo-500" />
                  Browser Extension Simulator
                </h3>
                <p className="text-[10px] text-slate-400">Simulate background user endpoint activities via Chrome/Edge extension telemetry.</p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Simulated URL Visited</label>
                  <select
                    value={extensionUrl}
                    onChange={(e) => setExtensionUrl(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                    id="saas-extension-url-select"
                  >
                    <option value="https://figma.com/file/marketing-campaign">https://figma.com/file/marketing-campaign (Figma Pro)</option>
                    <option value="https://notion.so/company-knowledge-base">https://notion.so/company-knowledge-base (Notion Enterprise)</option>
                    <option value="https://salesforce.com/lightning/r/Account">https://salesforce.com/lightning/r/Account (Salesforce)</option>
                    <option value="https://company.slack.com/messages/general">https://company.slack.com/messages/general (Slack)</option>
                    <option value="https://miro.com/app/board/brainstorming">https://miro.com/app/board/brainstorming (Miro)</option>
                    <option value="https://zoom.us/j/9876543210">https://zoom.us/j/9876543210 (Zoom)</option>
                    <option value="https://chatgpt.com/c/ai-strategy-shadow-it">https://chatgpt.com/c/ai-strategy-shadow-it (Shadow IT)</option>
                    <option value="https://custom-marketing-tool.io/dashboard">https://custom-marketing-tool.io/dashboard (Unrecognized App)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">User Email</label>
                    <input
                      type="email"
                      value={extensionEmail}
                      onChange={(e) => setExtensionEmail(e.target.value)}
                      placeholder="user@company.com"
                      className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">User Name</label>
                    <input
                      type="text"
                      value={extensionName}
                      onChange={(e) => setExtensionName(e.target.value)}
                      placeholder="John Doe"
                      className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Department</label>
                  <select
                    value={extensionDept}
                    onChange={(e) => setExtensionDept(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Sales">Sales</option>
                    <option value="Human Resources">Human Resources</option>
                    <option value="Finance">Finance</option>
                  </select>
                </div>

                {extensionResult && (
                  <div className={`p-3 rounded border text-[11px] font-sans ${
                    extensionResult.success ? "bg-indigo-50/80 border-indigo-100 text-slate-700" : "bg-rose-50/80 border-rose-100 text-rose-700"
                  }`}>
                    <div className="flex items-center gap-1.5 mb-1">
                      {extensionResult.success ? (
                        <CheckCircle className="w-3.5 h-3.5 shrink-0" style={{color: "#00549F"}} />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      )}
                      <p className="font-bold text-slate-800">{extensionResult.success ? "Telemetry Logged" : "Error Occurred"}</p>
                    </div>
                    <p className="text-[10px] leading-relaxed mb-1">{extensionResult.message}</p>
                    {extensionResult.application && (
                      <div className="mt-1.5 pt-1.5 border-t border-indigo-100/50 flex flex-wrap justify-between items-center text-[10px]">
                        <span>Identified App: <strong>{extensionResult.application.name}</strong></span>
                        <span className={`px-1.5 py-0.2 rounded font-bold ${extensionResult.application.isApproved ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`}>
                          {extensionResult.application.isApproved ? "Approved" : "Unapproved"}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                <button
                  onClick={handleSimulateExtensionVisit}
                  disabled={isSimulatingExtension}
                  className="w-full py-2 disabled:bg-slate-300 text-white rounded text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm" style={{background: "#00549F"}}
                  id="saas-simulate-extension-btn"
                >
                  {isSimulatingExtension ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Play className="w-3.5 h-3.5 fill-white" />
                  )}
                  Transmit Extension Telemetry
                </button>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* 2. SUBSCRIPTIONS MANAGEMENT & FINANCIAL COSTS */}
      {activeTab === "SUBSCRIPTIONS" && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Active License Subscriptions & Contract Sku Costs</h3>
                <p className="text-[10px] text-slate-400">Configure seats, unit costs, exclusion filters, and renewal milestones</p>
              </div>
              <button
                onClick={() => {
                  setEditingSub(null);
                  setIsSubModalOpen(true);
                }}
                className="px-4 py-2 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm" style={{background: "#00549F"}}
                id="saas-add-sub-btn"
              >
                <PlusCircle className="w-4 h-4" />
                Register Subscription
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold">
                    <th className="pb-3 font-semibold">SaaS Product</th>
                    <th className="pb-3 font-semibold">SKU / Plan Name</th>
                    <th className="pb-3 font-semibold">Billing Frequency</th>
                    <th className="pb-3 font-semibold">Seats Total / Assigned</th>
                    <th className="pb-3 font-semibold">Seat Unit Cost</th>
                    <th className="pb-3 font-semibold">Total Monthly Cost</th>
                    <th className="pb-3 font-semibold">Expiry Date</th>
                    <th className="pb-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {subscriptions.map(sub => {
                    const app = apps.find(a => a.id === sub.saasApplicationId);
                    const unassigned = Math.max(0, sub.seatsTotal - sub.seatsAssigned);
                    const monthlyTotal = sub.isFree || sub.isExcluded ? 0 : sub.seatsTotal * sub.costPerSeat;

                    return (
                      <tr key={sub.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-slate-100 rounded flex items-center justify-center font-bold text-xs text-slate-700">
                              {app?.name.substring(0, 2) || "SA"}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">{app?.name || "Unknown application"}</p>
                              <div className="flex gap-1.5 mt-0.5">
                                {sub.isFree && (
                                  <span className="text-[9px] bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.2 rounded">Free Plan</span>
                                )}
                                {sub.isExcluded && (
                                  <span className="text-[9px] bg-slate-100 text-slate-500 font-bold px-1.5 py-0.2 rounded">Excluded</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 text-slate-600">
                          <p className="font-semibold font-mono text-[11px] text-slate-800">{sub.sku}</p>
                          <p className="text-[10px] text-slate-400">{sub.planName}</p>
                        </td>
                        <td className="py-3.5">
                          <span className="bg-slate-100 text-slate-600 font-semibold text-[10px] px-2 py-0.5 rounded">
                            {sub.billingFrequency}
                          </span>
                        </td>
                        <td className="py-3.5">
                          <p className="font-bold text-slate-800 font-mono">
                            {sub.seatsAssigned} / {sub.seatsTotal} <span className="text-[10px] text-slate-400 font-normal font-sans">assigned</span>
                          </p>
                          {unassigned > 0 && (
                            <span className="text-[10px] text-amber-600 font-medium">
                              {unassigned} unassigned seats
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 font-semibold text-slate-800 font-mono">
                          ${sub.costPerSeat} <span className="text-[10px] text-slate-400 font-sans font-normal">{sub.currency}</span>
                        </td>
                        <td className="py-3.5 font-bold font-mono text-sm" style={{color: "#00549F"}}>
                          ${monthlyTotal.toLocaleString()} <span className="text-[10px] text-slate-400 font-sans font-normal">/mo</span>
                        </td>
                        <td className="py-3.5 text-slate-500 font-medium font-mono text-[11px]">
                          {sub.expirationDate ? (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              {sub.expirationDate}
                            </span>
                          ) : (
                            "No Expiration"
                          )}
                        </td>
                        <td className="py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleEditSubscriptionClick(sub)}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded transition-all cursor-pointer"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteSubscription(sub.id)}
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded transition-all cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. CONSOLIDATED USERS & SaaS ACTIVITIES */}
      {activeTab === "USERS" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* User identities table */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Unified Multi-Source Corporate Identities ({filteredUsers.length})</h3>
                <p className="text-[10px] text-slate-400">Identities matched across M365, Google, and Okta databases using SaaS Consolidation Engine</p>
              </div>
              <button
                onClick={handleConsolidate}
                className="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-all" style={{background: "#D1E7F3", color: "#1468B3"}}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Deduplicate Users
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold">
                    <th className="pb-3 font-semibold">User details</th>
                    <th className="pb-3 font-semibold">Department</th>
                    <th className="pb-3 font-semibold">Account Status</th>
                    <th className="pb-3 font-semibold">Identity Sync Sources</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map(user => (
                    <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3">
                        <div>
                          <p className="font-bold text-slate-900">{user.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{user.email}</p>
                        </div>
                      </td>
                      <td className="py-3 text-slate-600 font-medium">{user.department}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          user.status === "Active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                        }`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="py-3">
                        <div className="flex flex-wrap gap-1">
                          {user.identitySources?.map((src, i) => (
                            <span key={i} className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono font-medium">
                              {src}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Column: User activity audit streams */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-sm">Active User Logs & Usage Metering</h3>
              <p className="text-[10px] text-slate-400">Background web page & extension usage metering</p>
            </div>

            <div className="space-y-3 max-h-[480px] overflow-y-auto pr-2">
              {activities.map(act => {
                const app = apps.find(a => a.id === act.saasApplicationId);
                const user = users.find(u => u.id === act.saasUserId);

                return (
                  <div key={act.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200/50 text-[11px] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{user?.name || "Unknown identity"}</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                        act.activityLevel === "Active" 
                          ? "bg-emerald-50 text-emerald-700" 
                          : act.activityLevel === "Low Activity"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-rose-50 text-rose-700"
                      }`}>
                        {act.activityLevel}
                      </span>
                    </div>

                    <div className="flex justify-between text-slate-500">
                      <span>Product: <span className="font-semibold text-slate-700">{app?.name || "Generic cloud app"}</span></span>
                      <span className="font-mono">{act.usageDurationMinutes}m tracked</span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-200/40 pt-1.5">
                      <span>Source: {act.sourceConnector}</span>
                      <span className="font-mono">{new Date(act.lastActiveDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* 4. MULTI-SOURCE INTEGRATION CONNECTORS */}
      {activeTab === "CONNECTORS" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Connectors grid list */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {connectors.map(conn => (
                <div key={conn.id} className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col justify-between space-y-4 hover:shadow-md transition-all">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="p-2 rounded-lg" style={{background: "#D1E7F3", color: "#1468B3"}}>
                        <Cloud className="w-5 h-5" />
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        conn.status === "Connected" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                      }`}>
                        {conn.status}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{conn.name}</h4>
                      <p className="text-[10px] text-slate-400 font-semibold font-mono uppercase">{conn.type}</p>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-4 flex items-center justify-between text-[11px]">
                    <div className="text-slate-500">
                      <p>Synced: <span className="font-semibold font-mono text-slate-800">{conn.recordCount} records</span></p>
                      <p className="text-[9px] text-slate-400">
                        {conn.lastSyncedAt ? new Date(conn.lastSyncedAt).toLocaleString() : "Never Synced"}
                      </p>
                    </div>
                    
                    <button
                      onClick={() => handleSyncConnector(conn.id, conn.name)}
                      disabled={isSyncing !== null}
                      className="px-3 py-1.5 bg-slate-900 text-white hover:bg-slate-800 active:bg-slate-950 rounded text-[10px] font-bold tracking-tight transition-all flex items-center gap-1 cursor-pointer"
                    >
                      {isSyncing === conn.id ? (
                        <RefreshCw className="w-3 h-3 animate-spin" />
                      ) : (
                        <Play className="w-3 h-3 fill-white" />
                      )}
                      Sync Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Connected Logger Terminal */}
          <div className="bg-slate-950 text-slate-100 rounded-xl p-5 border border-slate-800 shadow-lg flex flex-col h-[450px]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4 shrink-0">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 block"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 block"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 block"></span>
                </div>
                <span className="text-[10px] text-slate-400 font-bold font-mono uppercase">Multi-Source Sync Monitor</span>
              </div>
              <button 
                onClick={() => setSyncLogs([])}
                className="text-[10px] text-slate-500 hover:text-slate-300 font-bold underline cursor-pointer"
              >
                Clear
              </button>
            </div>

            <div className="flex-1 overflow-y-auto font-mono text-[10px] text-indigo-300 space-y-1.5 pr-2 leading-relaxed">
              {syncLogs.map((log, i) => (
                <p key={i} className={
                  log.includes("[ERROR]") 
                    ? "text-rose-400" 
                    : log.includes("[RESULT]") 
                    ? "text-emerald-400 font-bold"
                    : log.includes("[RECON]")
                    ? "text-purple-300 pl-4"
                    : "text-slate-300"
                }>
                  {log}
                </p>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* SUBSCRIPTION CREATION/EDIT MODAL */}
      {isSubModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="bg-slate-900 text-white p-6">
              <h3 className="font-bold text-base">
                {editingSub ? "Edit Cloud SaaS Subscription" : "Register New SaaS Subscription"}
              </h3>
              <p className="text-slate-400 text-xs mt-1">Configure plan billing variables and link to software discovery vendor catalog.</p>
            </div>

            <form onSubmit={handleSaveSubscription} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                
                <div className="col-span-2">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Target Application</label>
                  <select
                    value={subForm.saasApplicationId}
                    onChange={(e) => setSubForm(p => ({ ...p, saasApplicationId: e.target.value }))}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
                  >
                    <option value="">-- Select Discovered Application --</option>
                    {apps.map(app => (
                      <option key={app.id} value={app.id}>{app.name} ({app.publisher})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Product SKU code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. M365-E5"
                    value={subForm.sku}
                    onChange={(e) => setSubForm(p => ({ ...p, sku: e.target.value }))}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Friendly Plan Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Enterprise Business E5"
                    value={subForm.planName}
                    onChange={(e) => setSubForm(p => ({ ...p, planName: e.target.value }))}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Billing frequency</label>
                  <select
                    value={subForm.billingFrequency}
                    onChange={(e) => setSubForm(p => ({ ...p, billingFrequency: e.target.value as "Monthly" | "Annually" }))}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
                  >
                    <option value="Monthly">Monthly</option>
                    <option value="Annually">Annually</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Cost Per Seat ($)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={subForm.costPerSeat}
                    onChange={(e) => setSubForm(p => ({ ...p, costPerSeat: Number(e.target.value) }))}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Total Seats Purchased</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={subForm.seatsTotal}
                    onChange={(e) => setSubForm(p => ({ ...p, seatsTotal: Number(e.target.value) }))}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Seats Currently Assigned</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={subForm.seatsAssigned}
                    onChange={(e) => setSubForm(p => ({ ...p, seatsAssigned: Number(e.target.value) }))}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Expiration/Renewal Date</label>
                  <input
                    type="date"
                    value={subForm.expirationDate}
                    onChange={(e) => setSubForm(p => ({ ...p, expirationDate: e.target.value }))}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Subscription Status</label>
                  <select
                    value={subForm.status}
                    onChange={(e) => setSubForm(p => ({ ...p, status: e.target.value as "Active" | "Expired" | "Suspended" }))}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
                  >
                    <option value="Active">Active</option>
                    <option value="Expired">Expired</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>

                <div className="col-span-2 flex items-center gap-6 py-2">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={subForm.isFree}
                      onChange={(e) => setSubForm(p => ({ ...p, isFree: e.target.checked }))}
                      className="rounded border-slate-300" style={{color: "#00549F", accentColor: "#00549F"}}
                    />
                    Mark as Free / Trial Plan
                  </label>

                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={subForm.isExcluded}
                      onChange={(e) => setSubForm(p => ({ ...p, isExcluded: e.target.checked }))}
                      className="rounded border-slate-300" style={{color: "#00549F", accentColor: "#00549F"}}
                    />
                    Exclude from Compliance Cost calculations
                  </label>
                </div>

              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSubModalOpen(false)}
                  className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                >
                  Save Subscription SKU
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
