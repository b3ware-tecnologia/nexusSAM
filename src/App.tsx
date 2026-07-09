import React, { useState, useEffect } from "react";
import { DashboardView } from "./components/DashboardView.js";
import { LicensesView } from "./components/LicensesView.js";
import { InvoiceIngestionView } from "./components/InvoiceIngestionView.js";
import { DiagnosticsView } from "./components/DiagnosticsView.js";
import { InventoryView } from "./components/InventoryView.js";
import { SaaSView } from "./components/SaaSView.js";
import { CloudView } from "./components/CloudView.js";
import { ContainerView } from "./components/ContainerView.js";
import { ReportsView } from "./components/ReportsView.js";
import { CustomFieldsView } from "./components/CustomFieldsView.js";
import { AdministrationView } from "./components/AdministrationView.js";
import { LoginView } from "./components/LoginView.js";
import { License, Agreement, ComplianceSnapshot, LicensePool, RenewalForecast } from "./types.js";
import { 
  LayoutDashboard, FileText, Sparkles, Terminal, Activity, HardDrive, 
  Cloud, Layers, FileSpreadsheet, Tags, Settings, 
  ChevronDown, Bell, Shield, LogOut
} from "lucide-react";
import { isAuthenticated, getStoredUser, storeAuth, clearAuth, getStoredToken, apiFetch, patchGlobalFetch, unpatchGlobalFetch } from "./api.js";

type ViewId = "RECONCILIATION" | "LICENSES" | "INGEST" | "DIAGNOSTICS" | "INVENTORY" | "SAAS" | "CLOUD" | "CONTAINERS" | "REPORTS" | "CUSTOM_FIELDS" | "ADMINISTRATION";

interface NavItem {
  id: ViewId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_SECTIONS: { title: string; items: NavItem[] }[] = [
  {
    title: "Main",
    items: [
      { id: "RECONCILIATION", label: "Dashboard", icon: LayoutDashboard },
      { id: "LICENSES", label: "Licenses", icon: FileText },
      { id: "INGEST", label: "Invoice Ingestion", icon: Sparkles },
      { id: "INVENTORY", label: "Asset Inventory", icon: HardDrive },
      { id: "SAAS", label: "SaaS Optimization", icon: Cloud },
    ]
  },
  {
    title: "Cloud & Metrics",
    items: [
      { id: "CLOUD", label: "Cloud License", icon: Cloud },
      { id: "CONTAINERS", label: "Containers", icon: Layers },
      { id: "REPORTS", label: "Reports", icon: FileSpreadsheet },
      { id: "CUSTOM_FIELDS", label: "Custom Fields", icon: Tags },
    ]
  },
  {
    title: "System",
    items: [
      { id: "DIAGNOSTICS", label: "Compliance Tests", icon: Terminal },
      { id: "ADMINISTRATION", label: "Administration", icon: Settings },
    ]
  }
];

export default function App() {
  const [authUser, setAuthUser] = useState<{ id: string; name: string; email: string; role?: string } | null>(getStoredUser);
  const [currentView, setCurrentView] = useState<ViewId>("RECONCILIATION");
  const [licenses, setLicenses] = useState<License[]>([]);
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [snapshots, setSnapshots] = useState<ComplianceSnapshot[]>([]);
  const [licensePools, setLicensePools] = useState<LicensePool[]>([]);
  const [forecasts, setForecasts] = useState<RenewalForecast[]>([]);
  const [ahbSavings, setAhbSavings] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    if (getStoredToken()) patchGlobalFetch();
  }, []);

  useEffect(() => {
    if (authUser) loadData();
  }, [authUser]);

  const handleLogin = (token: string, user: { id: string; name: string; email: string; role?: string }) => {
    storeAuth(token, user);
    patchGlobalFetch();
    setAuthUser(user);
  };

  const handleLogout = () => {
    clearAuth();
    unpatchGlobalFetch();
    setAuthUser(null);
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [licRes, agrRes, compRes, poolRes, forecastRes, ahbRes] = await Promise.all([
        apiFetch("/api/licenses"),
        apiFetch("/api/agreements"),
        apiFetch("/api/compliance"),
        apiFetch("/api/license-pools"),
        apiFetch("/api/renewal-forecasts"),
        apiFetch("/api/azure-hybrid-benefits")
      ]);
      if (licRes.ok) setLicenses(await licRes.json());
      if (agrRes.ok) setAgreements(await agrRes.json());
      if (compRes.ok) setSnapshots(await compRes.json());
      if (poolRes.ok) setLicensePools(await poolRes.json());
      if (forecastRes.ok) setForecasts(await forecastRes.json());
      if (ahbRes.ok) {
        const data = await ahbRes.json();
        setAhbSavings(data.reduce((sum: number, item: any) => sum + item.estimatedMonthlySavings, 0));
      }
    } catch (error) {
      console.error("Failed to load backend databases:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getViewTitle = () => {
    switch (currentView) {
      case "RECONCILIATION": return "ELP Reconciliation Dashboard";
      case "LICENSES": return "Licenses & Contracts Inventory";
      case "INGEST": return "AI Invoice Ingestion";
      case "DIAGNOSTICS": return "Compliance Engine Diagnostics";
      case "INVENTORY": return "IT Asset & Hardware Lifecycle (HAM)";
      case "SAAS": return "SaaS Subscription Optimization (SSM)";
      case "CLOUD": return "Cloud License Optimization (BYOL)";
      case "CONTAINERS": return "Kubernetes Container Visibility";
      case "REPORTS": return "Advanced Reports Delivery Engine";
      case "CUSTOM_FIELDS": return "Custom Fields & Custom Metrics Schema";
      case "ADMINISTRATION": return "Administration, SSO & Security Settings";
      default: return "Dashboard";
    }
  };

  if (!authUser) {
    return <LoginView onLogin={handleLogin} />;
  }

  return (
    <div className="h-screen w-screen flex overflow-hidden" style={{ fontFamily: "'Noto Sans', sans-serif", color: "#212424" }}>
      {/* Sidebar — Symantec style */}
      <aside className="w-[300px] flex flex-col shrink-0" style={{ background: "#213C60" }}>
        {/* Logo */}
        <div className="h-[46px] flex items-center gap-3 px-6 shrink-0 border-b border-white/10">
          <div className="w-7 h-7 rounded flex items-center justify-center shrink-0" style={{ background: "#366BB2" }}>
            <Activity className="w-4 h-4 text-white" />
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-white font-bold text-sm tracking-tight">nexusSAM</h1>
            <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-white/10 text-white/70">v2.4</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {NAV_SECTIONS.map((section) => (
            <div key={section.title} className="mb-6">
              <div className="text-[10px] uppercase tracking-[0.12em] font-semibold px-3 mb-1.5 text-white/40">
                {section.title}
              </div>
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentView(item.id)}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm transition-all cursor-pointer text-left"
                    style={{
                      background: isActive ? "rgba(255,255,255,0.1)" : "transparent",
                      color: isActive ? "#FFFFFF" : "rgba(255,255,255,0.65)",
                      borderRadius: "2px",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                        e.currentTarget.style.color = "#FFFFFF";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.color = "rgba(255,255,255,0.65)";
                      }
                    }}
                  >
                    <Icon className="w-4 h-4 shrink-0 opacity-70" />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Status */}
        <div className="shrink-0 px-5 py-3 border-t border-white/10">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
            <span className="text-xs text-white/50">ELP Engine Active</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden" style={{ background: "#F2F2F2" }}>
        
        {/* Top Header */}
        <header className="h-[46px] border-b shrink-0 flex items-center justify-between px-6 bg-white"
          style={{ borderColor: "#D0D0D0" }}>
          
          <div className="flex items-center gap-2 text-[13px]">
            <span style={{ color: "#6E7070" }}>nexusSAM</span>
            <span style={{ color: "#A0A0A0" }}>/</span>
            <span className="font-semibold" style={{ color: "#212424" }}>{getViewTitle()}</span>
          </div>

          <div className="flex items-center gap-3">
            <button className="p-1.5 transition-all cursor-pointer hover:opacity-70" style={{ color: "#6E7070" }}>
              <Bell className="w-4 h-4" />
            </button>
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 text-[13px] cursor-pointer"
              >
                <div className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs uppercase"
                  style={{ background: "#D1E7F3", color: "#366BB2" }}>
                  {authUser?.name?.split(" ").map(n => n[0]).join("").slice(0, 2) || "?"}
                </div>
                <span className="font-medium hidden md:inline" style={{ color: "#212424" }}>
                  {authUser?.email || "user@company.com"}
                </span>
                <ChevronDown className="w-3 h-3" style={{ color: "#6E7070" }} />
              </button>
              {showUserMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                  <div className="absolute right-0 top-full mt-1 z-50 w-48 rounded py-1 bg-white shadow-lg border" style={{ borderColor: "#D0D0D0" }}>
                    <div className="px-3 py-2 border-b" style={{ borderColor: "#D0D0D0" }}>
                      <p className="text-[13px] font-semibold text-[#212424]">{authUser?.name}</p>
                      <p className="text-[11px] text-[#6E7070]">{authUser?.email}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 text-[13px] cursor-pointer hover:bg-[#F2F2F2]"
                      style={{ color: "#C32525" }}
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            {(() => {
              switch (currentView) {
                case "RECONCILIATION":
                  return <DashboardView snapshots={snapshots} isLoading={isLoading} onRefresh={loadData} onNavigateToLicenses={() => setCurrentView("LICENSES")} forecasts={forecasts} ahbSavings={ahbSavings} />;
                case "LICENSES":
                  return <LicensesView licenses={licenses} agreements={agreements} licensePools={licensePools} onRefresh={loadData} />;
                case "INGEST":
                  return <InvoiceIngestionView onRefresh={loadData} onNavigateToLicenses={() => setCurrentView("LICENSES")} />;
                case "DIAGNOSTICS":
                  return <DiagnosticsView />;
                case "INVENTORY":
                  return <InventoryView onRefreshAll={loadData} />;
                case "SAAS":
                  return <SaaSView onRefreshAll={loadData} />;
                case "CLOUD":
                  return <CloudView />;
                case "CONTAINERS":
                  return <ContainerView />;
                case "REPORTS":
                  return <ReportsView />;
                case "CUSTOM_FIELDS":
                  return <CustomFieldsView />;
                case "ADMINISTRATION":
                  return <AdministrationView />;
                default:
                  return <DashboardView snapshots={snapshots} isLoading={isLoading} onRefresh={loadData} onNavigateToLicenses={() => setCurrentView("LICENSES")} />;
              }
            })()}
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t py-2.5 px-6 shrink-0 flex items-center justify-between text-[11px] bg-white"
          style={{ borderColor: "#D0D0D0", color: "#6E7070" }}>
          <p>© 2026 nexusSAM. All rights reserved.</p>
          <p className="flex items-center gap-1.5">
            <Shield className="w-3 h-3" />
            AES-256 Encrypted
          </p>
        </footer>
      </div>
    </div>
  );
}
