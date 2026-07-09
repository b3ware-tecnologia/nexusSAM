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
  ChevronDown, Bell, Shield, LogOut, Search
} from "lucide-react";
import { getStoredUser, storeAuth, clearAuth, getStoredToken, apiFetch, patchGlobalFetch, unpatchGlobalFetch } from "./api.js";

type ViewId = "RECONCILIATION" | "LICENSES" | "INGEST" | "DIAGNOSTICS" | "INVENTORY" | "SAAS" | "CLOUD" | "CONTAINERS" | "REPORTS" | "CUSTOM_FIELDS" | "ADMINISTRATION";

const NAV_ITEMS: { id: ViewId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "RECONCILIATION", label: "Dashboard", icon: LayoutDashboard },
  { id: "LICENSES", label: "Licenses", icon: FileText },
  { id: "INGEST", label: "Invoice Ingestion", icon: Sparkles },
  { id: "INVENTORY", label: "Asset Inventory", icon: HardDrive },
  { id: "SAAS", label: "SaaS Optimization", icon: Cloud },
  { id: "CLOUD", label: "Cloud License", icon: Cloud },
  { id: "CONTAINERS", label: "Containers", icon: Layers },
  { id: "REPORTS", label: "Reports", icon: FileSpreadsheet },
  { id: "CUSTOM_FIELDS", label: "Custom Fields", icon: Tags },
  { id: "DIAGNOSTICS", label: "Compliance Tests", icon: Terminal },
  { id: "ADMINISTRATION", label: "Administration", icon: Settings },
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
  const [sidebarHover, setSidebarHover] = useState(false);

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

  const sidebarExpanded = sidebarHover;

  if (!authUser) {
    return <LoginView onLogin={handleLogin} />;
  }

  return (
    <div className="h-screen w-screen flex overflow-hidden" style={{ fontFamily: "'Noto Sans', sans-serif", color: "#212424" }}>
      {/* ─── SIDEBAR (Symantec: 78px collapsed / 300px expanded) ─── */}
      <aside
        className="flex flex-col shrink-0 transition-[width] duration-200 ease-in-out"
        style={{
          width: sidebarExpanded ? "300px" : "78px",
          background: "#213C60",
          overflow: "hidden",
        }}
        onMouseEnter={() => setSidebarHover(true)}
        onMouseLeave={() => setSidebarHover(false)}
      >
        {/* Logo area — 74.5px to match Symantec header height */}
        <div className="shrink-0 flex items-center px-5" style={{ height: "74.5px" }}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-7 h-7 rounded flex items-center justify-center shrink-0" style={{ background: "#00A4B7" }}>
              <Activity className="w-4 h-4 text-white" />
            </div>
            {sidebarExpanded && (
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-white font-semibold text-sm tracking-tight whitespace-nowrap">nexusSAM</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/60 font-semibold whitespace-nowrap">v2.4</span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation items — 50px height, 3px margin, teal active */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden pt-6">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <div
                key={item.id}
                className="flex items-center cursor-pointer transition-all"
                style={{
                  height: "50px",
                  margin: "3px 0",
                  background: isActive ? "#00A4B7" : "transparent",
                }}
                onClick={() => setCurrentView(item.id)}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.background = "transparent";
                }}
              >
                <div className="flex items-center gap-4 px-5 min-w-0" style={{ width: sidebarExpanded ? "300px" : "78px" }}>
                  <Icon className="w-5 h-5 shrink-0" style={{ color: isActive ? "#FFFFFF" : "rgba(255,255,255,0.6)" }} />
                  {sidebarExpanded && (
                    <span className="text-sm whitespace-nowrap truncate" style={{ color: "#FFFFFF" }}>
                      {item.label}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </nav>
      </aside>

      {/* ─── MAIN CONTENT ─── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden" style={{ background: "#F2F2F2" }}>
        
        {/* ─── TOP HEADER (Symantec: 74.5px, white, padding 15px 20px) ─── */}
        <header
          className="shrink-0 flex items-center bg-white"
          style={{ height: "74.5px", padding: "15px 20px" }}
        >
          {/* Left: Logo area (takes remaining space like Symantec) */}
          <div className="flex-1 flex items-center">
            <span className="text-sm font-semibold" style={{ color: "#212424" }}>
              {/* Page title — Symantec uses 20px H2, weight 400 */}
            </span>
          </div>

          {/* Right: Navigation tabs + Domain switcher + Account */}
          <div className="flex items-center gap-4">
            <button className="p-1.5 transition-all cursor-pointer hover:opacity-70" style={{ color: "#6E7070" }}>
              <Bell className="w-4 h-4" />
            </button>
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 text-[13px] cursor-pointer"
              >
                <div className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs uppercase bg-[#D1E7F3] text-[#366BB2]">
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
                      className="w-full flex items-center gap-2 px-3 py-2 text-[13px] cursor-pointer hover:bg-[#F2F2F2] text-[#C32525]"
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

        {/* ─── CONTENT AREA ─── */}
        <div className="flex-1 overflow-y-auto">
          <div style={{ padding: "16px 20px" }}>
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

        {/* ─── FOOTER ─── */}
        <footer className="shrink-0 flex items-center justify-between text-[11px] bg-white border-t px-5 py-2.5" style={{ borderColor: "#D0D0D0", color: "#6E7070" }}>
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
