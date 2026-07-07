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
import { License, Agreement, ComplianceSnapshot, LicensePool, RenewalForecast } from "./types.js";
import { 
  LayoutDashboard, FileText, Sparkles, Terminal, Activity, HardDrive, 
  Cloud, Layers, FileSpreadsheet, Tags, Settings, RefreshCw, Moon, Sun, 
  ChevronDown, Bell, Search, Monitor, AppWindow, Boxes, Shield, Database
} from "lucide-react";

export default function App() {
  const [currentView, setCurrentView] = useState<"RECONCILIATION" | "LICENSES" | "INGEST" | "DIAGNOSTICS" | "INVENTORY" | "SAAS" | "CLOUD" | "CONTAINERS" | "REPORTS" | "CUSTOM_FIELDS" | "ADMINISTRATION">("RECONCILIATION");
  const [licenses, setLicenses] = useState<License[]>([]);
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [snapshots, setSnapshots] = useState<ComplianceSnapshot[]>([]);
  const [licensePools, setLicensePools] = useState<LicensePool[]>([]);
  const [forecasts, setForecasts] = useState<RenewalForecast[]>([]);
  const [ahbSavings, setAhbSavings] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [licRes, agrRes, compRes, poolRes, forecastRes, ahbRes] = await Promise.all([
        fetch("/api/licenses"),
        fetch("/api/agreements"),
        fetch("/api/compliance"),
        fetch("/api/license-pools"),
        fetch("/api/renewal-forecasts"),
        fetch("/api/azure-hybrid-benefits")
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

  const getViewName = () => {
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

  const navItems = [
    { id: "RECONCILIATION" as const, label: "ELP Reconciliation", icon: LayoutDashboard, color: "" },
    { id: "LICENSES" as const, label: "Licenses Inventory", icon: FileText, color: "" },
    { id: "INGEST" as const, label: "Invoice Ingestion AI", icon: Sparkles, color: "" },
    { id: "INVENTORY" as const, label: "Asset Inventory & HAM", icon: HardDrive, color: "" },
    { id: "SAAS" as const, label: "SaaS Optimization (SSM)", icon: Cloud, color: "" },
    { id: null as any, label: "Cloud & Custom Metrics", icon: null, color: "", isSection: true },
    { id: "CLOUD" as const, label: "Cloud License (BYOL)", icon: Cloud, color: "text-orange-400" },
    { id: "CONTAINERS" as const, label: "Container Visibility", icon: Layers, color: "text-sky-400" },
    { id: "REPORTS" as const, label: "Reports Engine", icon: FileSpreadsheet, color: "text-emerald-400" },
    { id: "CUSTOM_FIELDS" as const, label: "Custom Fields & Metrics", icon: Tags, color: "text-amber-400" },
    { id: null as any, label: "", icon: null, color: "", isDivider: true },
    { id: "DIAGNOSTICS" as const, label: "Compliance Tests", icon: Terminal, color: "" },
    { id: "ADMINISTRATION" as const, label: "Administration & SSO", icon: Settings, color: "" },
  ];

  return (
    <div className="h-screen w-screen flex overflow-hidden font-sans" style={{ color: "#001833" }}>
      {/* Snow Atlas Sidebar */}
      <aside className={`${sidebarCollapsed ? "w-16" : "w-64"} flex flex-col shrink-0 transition-all duration-200 border-r`}
        style={{ background: "#1A2B4C", borderColor: "#243B5E" }}>
        
        {/* Logo */}
        <div className={`${sidebarCollapsed ? "px-4 py-5" : "px-6 py-5"} border-b`} style={{ borderColor: "#243B5E" }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded flex items-center justify-center shrink-0"
              style={{ background: "#00A1DE" }}>
              <Activity className="w-4 h-4 text-white" />
            </div>
            {!sidebarCollapsed && (
              <div>
                <h1 className="text-white font-bold tracking-tight text-sm flex items-center gap-1.5">
                  SAM Core
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-bold"
                    style={{ background: "rgba(0, 161, 222, 0.2)", color: "#7CDBD5" }}>
                    v2.4
                  </span>
                </h1>
                <span className="text-[9px] uppercase tracking-[0.15em] font-bold block"
                  style={{ color: "#8A8C8E" }}>
                  Snow Atlas Hub
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className={`flex-1 ${sidebarCollapsed ? "px-2 py-3" : "px-3 py-4"} space-y-0.5 overflow-y-auto`}>
          {navItems.map((item, idx) => {
            if (item.isDivider) return <div key={idx} className="h-px my-2" style={{ background: "#243B5E" }} />;
            if (item.isSection) {
              if (sidebarCollapsed) return null;
              return (
                <div key={idx} className="text-[9px] uppercase tracking-wider font-bold px-3 pt-3 pb-1"
                  style={{ color: "#5A6D8A" }}>
                  {item.label}
                </div>
              );
            }
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id!)}
                className={`w-full flex items-center gap-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  sidebarCollapsed ? "justify-center px-2 py-3" : "px-3 py-2.5"
                }`}
                style={{
                  background: isActive ? "#2E4A6F" : "transparent",
                  color: isActive ? "#7CDBD5" : "#8A8C8E",
                }}
                onMouseEnter={isActive ? undefined : (e) => { e.currentTarget.style.background = "#243B5E"; e.currentTarget.style.color = "#FFFFFF"; }}
                onMouseLeave={isActive ? undefined : (e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#8A8C8E"; }}
                title={sidebarCollapsed ? item.label : undefined}
              >
                {Icon && <Icon className={`w-4 h-4 shrink-0 ${item.color || ""}`} style={isActive && !item.color ? { color: "#7CDBD5" } : {}} />}
                {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Collapse Toggle */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="p-3 border-t text-xs flex items-center justify-center cursor-pointer transition-all hover:opacity-80"
          style={{ borderColor: "#243B5E", color: "#5A6D8A" }}
        >
          <ChevronDown className={`w-4 h-4 transition-transform ${sidebarCollapsed ? "" : "rotate-90"}`} />
        </button>

        {/* Status */}
        {!sidebarCollapsed && (
          <div className="p-4 border-t" style={{ background: "rgba(0,0,0,0.2)", borderColor: "#243B5E" }}>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-2 h-2 rounded-full block animate-pulse" style={{ background: "#00A1DE" }} />
              <span className="text-[11px] font-medium" style={{ color: "#8A8C8E" }}>ELP Engine Active</span>
            </div>
            <p className="text-[9px] uppercase tracking-widest leading-none" style={{ color: "#5A6D8A" }}>
              Last Snapshot: 2026-07-07 09:38
            </p>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden" style={{ background: "#F8F8F8" }}>
        
        {/* Header */}
        <header className="h-14 border-b shrink-0 flex items-center justify-between px-6"
          style={{ background: "#FFFFFF", borderColor: "#DDDDDD" }}>
          
          <div className="flex items-center gap-2 text-xs font-medium" style={{ color: "#595959" }}>
            <span style={{ color: "#9B9B9B" }}>SAM Core</span>
            <span style={{ color: "#C1C1C1" }}>/</span>
            <span className="font-bold tracking-tight" style={{ color: "#001833" }}>{getViewName()}</span>
          </div>

          <div className="flex items-center gap-3">
            <button className="p-2 rounded-lg transition-all cursor-pointer hover:opacity-70" style={{ color: "#9B9B9B" }}>
              <Bell className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg transition-all cursor-pointer hover:opacity-70"
              style={{ color: darkMode ? "#ECC200" : "#9B9B9B" }}
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <div className="h-5 w-px" style={{ background: "#DDDDDD" }} />
            <div className="flex items-center gap-2.5 text-xs">
              <div className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs uppercase shadow-sm"
                style={{ background: "#D1E7F3", color: "#00549F", border: "1px solid #99D9F2" }}>
                EB
              </div>
              <span className="font-semibold hidden md:inline-block" style={{ color: "#333333" }}>
                ericob3ware@gmail.com
              </span>
              <ChevronDown className="w-3 h-3" style={{ color: "#9B9B9B" }} />
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 lg:p-8">
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
        <footer className="border-t py-3 px-6 shrink-0 flex items-center justify-between text-[10px] font-medium"
          style={{ borderColor: "#DDDDDD", background: "#FFFFFF", color: "#9B9B9B" }}>
          <p>© 2026 Snow Atlas SAM Core IT Asset Manager. All rights reserved.</p>
          <p className="flex items-center gap-1.5">
            <Shield className="w-3 h-3" style={{ color: "#00A1DE" }} />
            ISO 27001 & SOC 2 Type II • AES-256 Encrypted
          </p>
        </footer>
      </div>
    </div>
  );
}
