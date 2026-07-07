import React, { useState } from "react";
import { ComplianceSnapshot, MetricType, RenewalForecast } from "../types.js";
import {
  Shield, AlertTriangle, CheckCircle, TrendingUp, Cpu, Users, Layers,
  HardDrive, RefreshCw, Cloud, ArrowUpRight, Database, Activity, Clock,
  FileText, BarChart3, PieChart, Gauge, Search, ChevronRight, Info,
  DollarSign, Target, Zap, Calendar, Download, Eye, Filter
} from "lucide-react";
import {
  PieChart as RePieChart, Pie, Cell, ResponsiveContainer, Tooltip as ReTooltip,
  BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid,
  AreaChart as ReAreaChart, Area, Legend
} from "recharts";
import { HintTooltip } from "./HintTooltip.js";

interface DashboardViewProps {
  onNavigateToLicenses: () => void;
  snapshots: ComplianceSnapshot[];
  isLoading: boolean;
  onRefresh: () => void;
  forecasts?: RenewalForecast[];
  ahbSavings?: number;
}

const PIE_COLORS = ["#386015", "#C32525", "#E17000"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function DashboardView({ onNavigateToLicenses, snapshots, isLoading, onRefresh, forecasts = [], ahbSavings = 0 }: DashboardViewProps) {
  const [metricFilter, setMetricFilter] = useState<string>("ALL");
  const [widgetPeriod, setWidgetPeriod] = useState<"7d" | "30d" | "90d">("30d");

  const underLicensedCount = snapshots.filter((s) => s.complianceStatus === "UnderLicensed").length;
  const compliantCount = snapshots.filter((s) => s.complianceStatus === "Compliant").length;
  const overLicensedCount = snapshots.filter((s) => s.complianceStatus === "OverLicensed").length;
  const totalTitles = snapshots.length;

  const totalFinancialRisk = snapshots
    .filter((s) => s.complianceStatus === "UnderLicensed")
    .reduce((sum, s) => sum + s.costImpact, 0);

  const totalWastedSpend = snapshots
    .filter((s) => s.complianceStatus === "OverLicensed")
    .reduce((sum, s) => sum + Math.abs(s.costImpact), 0);

  const totalEntitlements = snapshots.reduce((sum, s) => sum + s.entitlements, 0);
  const totalConsumption = snapshots.reduce((sum, s) => sum + s.consumption, 0);
  const avgCompliancePct = totalTitles > 0 ? Math.round(((compliantCount + overLicensedCount) / totalTitles) * 100) : 100;
  const coverageRatio = totalTitles > 0 ? Math.round((snapshots.filter((s) => s.complianceStatus !== "UnderLicensed").length / totalTitles) * 100) : 100;
  const exposureRatio = totalFinancialRisk > 0 ? Math.round((underLicensedCount / totalTitles) * 100) : 0;

  const pieData = [
    { name: "Compliant", value: compliantCount },
    { name: "Under-Licensed", value: underLicensedCount },
    { name: "Over-Licensed", value: overLicensedCount },
  ].filter((d) => d.value > 0);

  const snapshotByLicense = snapshots.reduce((acc, s) => {
    const key = s.licenseId || s.softwareName;
    if (!acc[key]) acc[key] = { entitlements: 0, consumption: 0, compliant: 0, under: 0 };
    acc[key].entitlements += s.entitlements;
    acc[key].consumption += s.consumption;
    if (s.complianceStatus === "Compliant") acc[key].compliant += s.entitlements;
    else if (s.complianceStatus === "UnderLicensed") acc[key].under += s.consumption - s.entitlements;
    return acc;
  }, {} as Record<string, { entitlements: number; consumption: number; compliant: number; under: number }>);

  const topPublishers = [...new Set(snapshots.map((s) => s.publisher))].slice(0, 6);
  const barData = topPublishers.map((pub) => {
    const pubSnaps = snapshots.filter((s) => s.publisher === pub);
    return {
      publisher: pub.length > 12 ? pub.slice(0, 10) + "..." : pub,
      compliant: pubSnaps.filter((s) => s.complianceStatus === "Compliant").length,
      under: pubSnaps.filter((s) => s.complianceStatus === "UnderLicensed").length,
    };
  });

  const metrics = Object.values(MetricType);
  const areaData = metrics.map((mt) => {
    const mtSnaps = snapshots.filter((s) => s.metricType === mt);
    const totalEnt = mtSnaps.reduce((sum, s) => sum + s.entitlements, 0);
    const totalCon = mtSnaps.reduce((sum, s) => sum + s.consumption, 0);
    return {
      metric: mt,
      entitlements: totalEnt,
      consumption: totalCon,
      coverage: totalEnt > 0 ? Math.round((Math.min(totalCon, totalEnt) / Math.max(totalCon, totalEnt)) * 100) : 0,
    };
  });

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(val);

  const filteredSnapshots = metricFilter === "ALL"
    ? snapshots
    : snapshots.filter((s) => s.metricType === metricFilter);

  const getMetricIcon = (metric: MetricType) => {
    switch (metric) {
      case MetricType.USERS: return <Users className="w-4 h-4" style={{ color: "#00A1DE" }} />;
      case MetricType.PROCESSOR_CORE: return <Cpu className="w-4 h-4" style={{ color: "#386015" }} />;
      case MetricType.PVU: return <Layers className="w-4 h-4" style={{ color: "#E17000" }} />;
      case MetricType.VDA: return <HardDrive className="w-4 h-4" style={{ color: "#C32525" }} />;
      default: return <Layers className="w-4 h-4" style={{ color: "#595959" }} />;
    }
  };

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0];
    return (
      <div className="text-[11px] px-3 py-2 rounded-lg shadow-sm" style={{ background: "#001833", color: "#FFFFFF" }}>
        <span className="font-semibold">{d.name}: {d.value} title{d.value !== 1 ? "s" : ""}</span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight" style={{ color: "#001833" }}>
              Effective License Position (ELP)
            </h1>
            <HintTooltip text="ELP continuously reconciles your purchased license entitlements against actual software consumption across the estate, flagging compliance gaps and overspend." side="right" size="md" />
          </div>
          <p className="text-xs mt-0.5" style={{ color: "#595959" }}>
            Enterprise-wide license reconciliation &mdash; {totalTitles} software titles tracked across {snapshots.map(s => s.publisher).filter((v,i,a) => a.indexOf(v)===i).length} publishers
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs rounded-lg px-3 py-1.5" style={{ background: "#FFFFFF", border: "1px solid #DDDDDD" }}>
            <Calendar className="w-3.5 h-3.5" style={{ color: "#00549F" }} />
            <select
              value={widgetPeriod}
              onChange={(e) => setWidgetPeriod(e.target.value as any)}
              className="text-xs border-none outline-none bg-transparent font-semibold cursor-pointer"
              style={{ color: "#001833" }}
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
          </div>
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer disabled:opacity-50 border"
            style={{ background: "#00549F", color: "#FFFFFF", borderColor: "#00549F" }}
            onMouseEnter={(e) => e.currentTarget.style.background = "#1468B3"}
            onMouseLeave={(e) => e.currentTarget.style.background = "#00549F"}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            {isLoading ? "Recalculating..." : "Recalculate ELP"}
          </button>
        </div>
      </div>

      {/* Row 1: Core KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* KPI 1: Compliance Score */}
        <div className="rounded-lg overflow-hidden transition-all hover:shadow-md" style={{ boxShadow: "0 2px 8px 0 rgba(0,0,0,0.10)", background: "#FFFFFF" }}>
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1" style={{ color: "#595959" }}>
                Compliance Score
                <HintTooltip text="Percentage of all software titles that are either fully compliant or over-licensed (no licensing gap). Higher is better." />
              </span>
              <Gauge className="w-4 h-4" style={{ color: avgCompliancePct >= 90 ? "#386015" : avgCompliancePct >= 70 ? "#E17000" : "#C32525" }} />
            </div>
            <div className="text-2xl font-bold flex items-baseline gap-1" style={{ color: "#001833" }}>
              {avgCompliancePct}%
              <span className="text-[11px] font-normal" style={{ color: "#595959" }}>avg</span>
            </div>
            <div className="mt-2 h-1.5 w-full rounded-full" style={{ background: "#DDDDDD" }}>
              <div className="h-1.5 rounded-full transition-all" style={{
                width: `${avgCompliancePct}%`,
                background: avgCompliancePct >= 90 ? "#386015" : avgCompliancePct >= 70 ? "#E17000" : "#C32525"
              }} />
            </div>
            <p className="text-[11px] mt-1.5" style={{ color: "#595959" }}>
              {compliantCount + overLicensedCount}/{totalTitles} titles compliant
            </p>
          </div>
        </div>

        {/* KPI 2: Audit Exposure */}
        <div className="rounded-lg overflow-hidden transition-all hover:shadow-md" style={{ boxShadow: "0 2px 8px 0 rgba(0,0,0,0.10)", background: "#FFFFFF" }}>
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1" style={{ color: "#595959" }}>
                Audit Exposure
                <HintTooltip text="Total financial risk from under-licensed titles. This is the amount a publisher could claim in a compliance audit." />
              </span>
              <AlertTriangle className="w-4 h-4" style={{ color: "#C32525" }} />
            </div>
            <div className="text-2xl font-bold" style={{ color: "#C32525" }}>{formatCurrency(totalFinancialRisk)}</div>
            <div className="flex items-center gap-2 mt-1.5">
              <div className="text-[11px]" style={{ color: "#595959" }}>
                <span className="font-semibold" style={{ color: "#C32525" }}>{underLicensedCount}</span> titles at risk
              </div>
              <div className="text-[11px]" style={{ color: "#9B9B9B" }}>({exposureRatio}% exposure)</div>
            </div>
          </div>
          {underLicensedCount > 0 && (
            <div className="px-4 py-2 text-[10px] font-semibold cursor-pointer hover:opacity-80" style={{ background: "#FFF5F5", color: "#C32525", borderTop: "1px solid #FFE4E4" }}>
              <button onClick={onNavigateToLicenses} className="flex items-center gap-1 cursor-pointer">
                <Eye className="w-3 h-3" /> Review & remediate under-licensed titles
              </button>
            </div>
          )}
        </div>

        {/* KPI 3: Optimization Potential */}
        <div className="rounded-lg overflow-hidden transition-all hover:shadow-md" style={{ boxShadow: "0 2px 8px 0 rgba(0,0,0,0.10)", background: "#FFFFFF" }}>
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1" style={{ color: "#595959" }}>
                Overspend
                <HintTooltip text="Wasted spend on over-licensed titles. Rightsizing or re-harvesting these entitlements can reduce costs." />
              </span>
              <TrendingUp className="w-4 h-4" style={{ color: "#E17000" }} />
            </div>
            <div className="text-2xl font-bold" style={{ color: "#001833" }}>{formatCurrency(totalWastedSpend)}</div>
            <p className="text-[11px] mt-1.5" style={{ color: "#595959" }}>
              {overLicensedCount} over-licensed title{overLicensedCount !== 1 ? "s" : ""} — potential re-harvest savings
            </p>
          </div>
        </div>

        {/* KPI 4: Total Entitlement Base */}
        <div className="rounded-lg overflow-hidden transition-all hover:shadow-md" style={{ boxShadow: "0 2px 8px 0 rgba(0,0,0,0.10)", background: "#FFFFFF" }}>
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1" style={{ color: "#595959" }}>
                Entitlement Base
                <HintTooltip text="Total number of license units (seats, cores, PVUs) purchased across all agreements combined." />
              </span>
              <Database className="w-4 h-4" style={{ color: "#00549F" }} />
            </div>
            <div className="text-2xl font-bold" style={{ color: "#001833" }}>{totalEntitlements.toLocaleString()}</div>
            <p className="text-[11px] mt-1.5" style={{ color: "#595959" }}>
              <span className="font-semibold">{totalConsumption.toLocaleString()}</span> consumed across estate
            </p>
          </div>
        </div>

        {/* KPI 5: Renewals */}
        <div className="rounded-lg overflow-hidden transition-all hover:shadow-md" style={{ boxShadow: "0 2px 8px 0 rgba(0,0,0,0.10)", background: "#FFFFFF" }}>
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1" style={{ color: "#595959" }}>
                Renewal Alerts
                <HintTooltip text="Licenses expiring within the selected period. Expired licenses can trigger compliance gaps and service disruption." />
              </span>
              <Clock className="w-4 h-4" style={{ color: "#00A1DE" }} />
            </div>
            <div className="text-2xl font-bold flex items-baseline gap-1" style={{ color: "#001833" }}>
              {forecasts.filter((f) => f.daysUntilExpiry <= 30 && f.daysUntilExpiry > 0).length}
              <span className="text-[11px] font-normal" style={{ color: "#595959" }}>in 30d</span>
            </div>
            {forecasts.filter((f) => f.daysUntilExpiry <= 0).length > 0 && (
              <p className="text-[11px] font-semibold mt-1" style={{ color: "#C32525" }}>
                {forecasts.filter((f) => f.daysUntilExpiry <= 0).length} already expired
              </p>
            )}
            {forecasts.filter((f) => f.daysUntilExpiry > 0 && f.daysUntilExpiry <= 30).length === 0 && forecasts.filter((f) => f.daysUntilExpiry <= 0).length === 0 && (
              <p className="text-[11px] mt-1.5" style={{ color: "#595959" }}>No renewals due — all clear</p>
            )}
          </div>
        </div>
      </div>

      {/* Row 2: Charts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Chart 1: Compliance Pie */}
        <div className="rounded-lg overflow-hidden" style={{ boxShadow: "0 2px 8px 0 rgba(0,0,0,0.10)", background: "#FFFFFF" }}>
          <div className="px-4 py-3 flex items-center justify-between border-b" style={{ borderColor: "#DDDDDD" }}>
            <div className="flex items-center gap-1.5">
              <PieChart className="w-4 h-4" style={{ color: "#00549F" }} />
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#001833" }}>Compliance Breakdown</span>
            </div>
            <HintTooltip text="Distribution of all tracked titles by compliance status. Green = compliant, Red = under-licensed, Amber = over-licensed." />
          </div>
          <div className="p-4">
            {pieData.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-xs" style={{ color: "#9B9B9B" }}>
                No compliance data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <RePieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={2} dataKey="value">
                    {pieData.map((_, idx) => (
                      <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} stroke="none" />
                    ))}
                  </Pie>
                  <ReTooltip content={<CustomPieTooltip />} />
                </RePieChart>
              </ResponsiveContainer>
            )}
            <div className="flex items-center justify-center gap-4 mt-2">
              {pieData.map((d, i) => (
                <div key={d.name} className="flex items-center gap-1.5 text-[10px]" style={{ color: "#595959" }}>
                  <span className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                  {d.name}: {d.value}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Chart 2: Compliance by Publisher */}
        <div className="rounded-lg overflow-hidden" style={{ boxShadow: "0 2px 8px 0 rgba(0,0,0,0.10)", background: "#FFFFFF" }}>
          <div className="px-4 py-3 flex items-center justify-between border-b" style={{ borderColor: "#DDDDDD" }}>
            <div className="flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4" style={{ color: "#00549F" }} />
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#001833" }}>Compliance by Publisher</span>
            </div>
            <HintTooltip text="Compliant vs under-licensed titles grouped by publisher. Green bars show compliant count, red bars show at-risk titles." />
          </div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={200}>
              <ReBarChart data={barData} barGap={2} barCategoryGap="12%">
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F1F1" vertical={false} />
                <XAxis dataKey="publisher" tick={{ fontSize: 10, fill: "#9B9B9B" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#9B9B9B" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <ReTooltip contentStyle={{ background: "#001833", border: "none", borderRadius: "8px", fontSize: "11px", color: "#FFFFFF" }} />
                <Bar dataKey="compliant" name="Compliant" radius={[3, 3, 0, 0]} fill="#386015" maxBarSize={32} />
                <Bar dataKey="under" name="Under-Licensed" radius={[3, 3, 0, 0]} fill="#C32525" maxBarSize={32} />
              </ReBarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Entitlements vs Consumption by Metric */}
        <div className="rounded-lg overflow-hidden" style={{ boxShadow: "0 2px 8px 0 rgba(0,0,0,0.10)", background: "#FFFFFF" }}>
          <div className="px-4 py-3 flex items-center justify-between border-b" style={{ borderColor: "#DDDDDD" }}>
            <div className="flex items-center gap-1.5">
              <Activity className="w-4 h-4" style={{ color: "#00549F" }} />
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#001833" }}>Entitlements vs Consumption</span>
            </div>
            <HintTooltip text="Purchased entitlements vs actual consumption broken down by metric type. Gaps show where licenses are over or under-consumed." />
          </div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={200}>
              <ReAreaChart data={areaData}>
                <defs>
                  <linearGradient id="entGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00549F" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#00549F" stopOpacity={0.01} />
                  </linearGradient>
                  <linearGradient id="conGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E17000" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#E17000" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F1F1" vertical={false} />
                <XAxis dataKey="metric" tick={{ fontSize: 10, fill: "#9B9B9B" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#9B9B9B" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <ReTooltip contentStyle={{ background: "#001833", border: "none", borderRadius: "8px", fontSize: "11px", color: "#FFFFFF" }} />
                <Area type="monotone" dataKey="entitlements" name="Entitlements" stroke="#00549F" strokeWidth={2} fill="url(#entGrad)" dot={false} />
                <Area type="monotone" dataKey="consumption" name="Consumption" stroke="#E17000" strokeWidth={2} fill="url(#conGrad)" dot={false} />
              </ReAreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3: Detail Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Widget: Renewal Forecast Detail */}
        <div className="rounded-lg overflow-hidden" style={{ boxShadow: "0 2px 8px 0 rgba(0,0,0,0.10)", background: "#FFFFFF" }}>
          <div className="px-4 py-3 flex items-center justify-between border-b" style={{ borderColor: "#DDDDDD" }}>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" style={{ color: "#00A1DE" }} />
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#001833" }}>Upcoming Renewals</span>
            </div>
            <HintTooltip text="Licenses expiring in the next 60 days. Proactive renewal avoids compliance gaps and ensures uninterrupted coverage." />
          </div>
          <div className="divide-y" style={{ borderColor: "#F1F1F1" }}>
            {forecasts.filter((f) => f.daysUntilExpiry <= 60).length === 0 ? (
              <div className="px-4 py-6 text-center text-xs" style={{ color: "#9B9B9B" }}>
                No renewals due in the next 60 days
              </div>
            ) : (
              forecasts.filter((f) => f.daysUntilExpiry <= 60).slice(0, 5).map((f) => (
                <div key={f.licenseId} className="px-4 py-2.5 flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-semibold truncate" style={{ color: "#333333" }}>{f.softwareName}</div>
                    <div className="text-[10px]" style={{ color: "#9B9B9B" }}>{f.publisher}</div>
                  </div>
                  <span className={`text-[11px] font-bold shrink-0 ml-2 px-2 py-0.5 rounded`}
                    style={{
                      background: f.daysUntilExpiry <= 0 ? "#FFE4E4" : f.daysUntilExpiry <= 15 ? "#FFF5F5" : "#FBF3CC",
                      color: f.daysUntilExpiry <= 0 ? "#C32525" : f.daysUntilExpiry <= 15 ? "#C32525" : "#806B3C"
                    }}>
                    {f.daysUntilExpiry <= 0 ? "Expired" : `${f.daysUntilExpiry}d`}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Widget: AHB Savings */}
        <div className="rounded-lg overflow-hidden" style={{ boxShadow: "0 2px 8px 0 rgba(0,0,0,0.10)", background: "#FFFFFF" }}>
          <div className="px-4 py-3 flex items-center justify-between border-b" style={{ borderColor: "#DDDDDD" }}>
            <div className="flex items-center gap-1.5">
              <Cloud className="w-3.5 h-3.5" style={{ color: "#00A1DE" }} />
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#001833" }}>Azure Hybrid Benefit</span>
            </div>
            <HintTooltip text="AHB lets you apply on-prem Windows Server & SQL Server licenses to Azure VMs at reduced rates. Potential monthly savings shown." />
          </div>
          <div className="p-4">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold" style={{ color: "#00549F" }}>
                {ahbSavings > 0 ? `$${ahbSavings.toLocaleString()}` : "$0"}
              </span>
              <span className="text-[11px]" style={{ color: "#595959" }}>/mo potential</span>
            </div>
            <div className="mt-3 h-1.5 w-full rounded-full" style={{ background: "#DDDDDD" }}>
              <div className="h-1.5 rounded-full" style={{ width: "35%", background: "#00A1DE" }} />
            </div>
            <p className="text-[11px] mt-1.5" style={{ color: "#595959" }}>
              {ahbSavings > 0
                ? `${Math.round(ahbSavings * 0.6).toLocaleString()} currently unrealized`
                : "Enable BYOL on eligible Azure VMs to reduce costs"}
            </p>
          </div>
          {ahbSavings > 0 && (
            <div className="px-4 py-2 text-[10px] font-semibold" style={{ background: "#DFEFD1", color: "#386015", borderTop: "1px solid #C1C1C1" }}>
              Enable AHB on PAYG VMs to recover costs
            </div>
          )}
        </div>

        {/* Widget: Metric Distribution */}
        <div className="rounded-lg overflow-hidden" style={{ boxShadow: "0 2px 8px 0 rgba(0,0,0,0.10)", background: "#FFFFFF" }}>
          <div className="px-4 py-3 flex items-center justify-between border-b" style={{ borderColor: "#DDDDDD" }}>
            <div className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" style={{ color: "#00549F" }} />
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#001833" }}>Metric Distribution</span>
            </div>
            <HintTooltip text="Breakdown of how licenses are measured across the estate. Each metric model has unique compliance rules and reconciliation logic." />
          </div>
          <div className="p-4 space-y-3">
            {Object.values(MetricType).map((mt) => {
              const count = snapshots.filter((s) => s.metricType === mt).length;
              const pct = totalTitles > 0 ? Math.round((count / totalTitles) * 100) : 0;
              return (
                <div key={mt}>
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="font-medium flex items-center gap-1" style={{ color: "#333333" }}>
                      {getMetricIcon(mt as MetricType)} {mt}
                    </span>
                    <span className="font-semibold" style={{ color: "#595959" }}>{count} ({pct}%)</span>
                  </div>
                  <div className="h-1 w-full rounded-full" style={{ background: "#F1F1F1" }}>
                    <div className="h-1 rounded-full" style={{ width: `${pct}%`, background: "#00549F" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Widget: Quick Actions */}
        <div className="rounded-lg overflow-hidden" style={{ boxShadow: "0 2px 8px 0 rgba(0,0,0,0.10)", background: "#FFFFFF" }}>
          <div className="px-4 py-3 flex items-center justify-between border-b" style={{ borderColor: "#DDDDDD" }}>
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" style={{ color: "#E17000" }} />
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#001833" }}>Quick Actions</span>
            </div>
            <HintTooltip text="Common tasks to manage your license estate. Each action guides you to the relevant section with pre-applied filters." />
          </div>
          <div className="p-3 space-y-2">
            {[
              { label: "Review under-licensed titles", icon: AlertTriangle, color: "#C32525", onClick: onNavigateToLicenses },
              { label: "Export compliance report", icon: Download, color: "#00549F" },
              { label: "Run full reconciliation", icon: RefreshCw, color: "#386015" },
              { label: "View audit log", icon: Eye, color: "#595959" },
            ].map((action, i) => (
              <button
                key={i}
                onClick={action.onClick}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-[11px] font-medium transition-all cursor-pointer hover:opacity-80"
                style={{ background: "#F8F8F8", color: "#333333" }}
              >
                <span className="flex items-center gap-2">
                  <action.icon className="w-3.5 h-3.5" style={{ color: action.color }} />
                  {action.label}
                </span>
                <ChevronRight className="w-3 h-3" style={{ color: "#9B9B9B" }} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Row 4: Metric Explanation */}
      <div className="rounded-lg overflow-hidden p-4" style={{ boxShadow: "0 2px 8px 0 rgba(0,0,0,0.10)", background: "#F8F8F8", border: "1px solid #DDDDDD" }}>
        <div className="flex items-center gap-1.5 mb-3">
          <Info className="w-3.5 h-3.5" style={{ color: "#00549F" }} />
          <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "#001833" }}>How Metrics Are Calculated</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-3 rounded-lg" style={{ background: "#FFFFFF" }}>
            <h4 className="text-xs font-bold flex items-center gap-1.5 mb-1" style={{ color: "#333333" }}>
              <Users className="w-3.5 h-3.5" style={{ color: "#00A1DE" }} /> Users
            </h4>
            <p className="text-[11px] leading-relaxed" style={{ color: "#595959" }}>
              Counts unique <strong>named users</strong> with the software installed. Multiple devices by the same user consume <strong>1 entitlement</strong>.
            </p>
          </div>
          <div className="p-3 rounded-lg" style={{ background: "#FFFFFF" }}>
            <h4 className="text-xs font-bold flex items-center gap-1.5 mb-1" style={{ color: "#333333" }}>
              <Cpu className="w-3.5 h-3.5" style={{ color: "#386015" }} /> Processor/Core
            </h4>
            <p className="text-[11px] leading-relaxed" style={{ color: "#595959" }}>
              Calculated from <strong>physical cores</strong> of machines running the software. Virtual cores are excluded per most vendor licensing rules.
            </p>
          </div>
          <div className="p-3 rounded-lg" style={{ background: "#FFFFFF" }}>
            <h4 className="text-xs font-bold flex items-center gap-1.5 mb-1" style={{ color: "#333333" }}>
              <Layers className="w-3.5 h-3.5" style={{ color: "#E17000" }} /> IBM PVU
            </h4>
            <p className="text-[11px] leading-relaxed" style={{ color: "#595959" }}>
              <strong>Cores × PVU weight</strong> per processor type. IBM sub-capacity licensing requires advanced virtualization management.
            </p>
          </div>
          <div className="p-3 rounded-lg" style={{ background: "#FFFFFF" }}>
            <h4 className="text-xs font-bold flex items-center gap-1.5 mb-1" style={{ color: "#333333" }}>
              <HardDrive className="w-3.5 h-3.5" style={{ color: "#C32525" }} /> Windows VDA
            </h4>
            <p className="text-[11px] leading-relaxed" style={{ color: "#595959" }}>
              Tracks <strong>client OS instances</strong> running inside virtual machines. Each VM or remote desktop session requires a VDA license.
            </p>
          </div>
        </div>
      </div>

      {/* Row 5: ELP Table */}
      <div className="rounded-lg overflow-hidden" style={{ boxShadow: "0 2px 8px 0 rgba(0,0,0,0.10)", background: "#FFFFFF" }}>
        <div className="px-5 py-3.5 flex items-center justify-between gap-4" style={{ borderBottom: "1px solid #DDDDDD" }}>
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4" style={{ color: "#00549F" }} />
            <h3 className="text-xs font-bold" style={{ color: "#001833" }}>Effective License Position (ELP) Grid</h3>
            <HintTooltip text="Detailed grid showing each software title's entitlement count, actual consumption, balance, compliance status, and financial impact. Filter by metric type using the dropdown." />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-3 h-3" style={{ color: "#9B9B9B" }} />
            <span className="text-[10px] font-medium" style={{ color: "#595959" }}>Metric:</span>
            <select
              value={metricFilter}
              onChange={(e) => setMetricFilter(e.target.value)}
              className="text-[11px] rounded px-2 py-1 outline-none cursor-pointer"
              style={{ border: "1px solid #DDDDDD", background: "#FFFFFF", color: "#333333" }}
            >
              <option value="ALL">All Metrics</option>
              {Object.values(MetricType).map((mt) => (
                <option key={mt} value={mt}>{mt}</option>
              ))}
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 text-center" style={{ color: "#595959" }}>
            <RefreshCw className="w-6 h-6 mx-auto mb-2 animate-spin" style={{ color: "#00A1DE" }} />
            <p className="text-xs font-medium">Reconciling inventory & license calculations...</p>
          </div>
        ) : filteredSnapshots.length === 0 ? (
          <div className="p-12 text-center">
            <AlertTriangle className="w-10 h-10 mx-auto mb-3" style={{ color: "#C1C1C1" }} />
            <p className="text-xs font-bold" style={{ color: "#001833" }}>No compliance snapshots generated.</p>
            <p className="text-[11px] mt-1" style={{ color: "#595959" }}>Add software licenses and installations to run the calculation engine.</p>
            <button
              onClick={onNavigateToLicenses}
              className="mt-4 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer"
              style={{ background: "#00549F", color: "#FFFFFF" }}
              onMouseEnter={(e) => e.currentTarget.style.background = "#1468B3"}
              onMouseLeave={(e) => e.currentTarget.style.background = "#00549F"}
            >
              Configure Licenses
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#F1F1F1" }}>
                  <th className="px-5 py-3 font-bold uppercase tracking-wider text-[10px]" style={{ color: "#595959", borderBottom: "1px solid #DDDDDD" }}>Software Title</th>
                  <th className="px-5 py-3 font-bold uppercase tracking-wider text-[10px]" style={{ color: "#595959", borderBottom: "1px solid #DDDDDD" }}>Publisher</th>
                  <th className="px-5 py-3 font-bold uppercase tracking-wider text-[10px]" style={{ color: "#595959", borderBottom: "1px solid #DDDDDD" }}>Metric Model</th>
                  <th className="px-5 py-3 font-bold uppercase tracking-wider text-[10px] text-right" style={{ color: "#595959", borderBottom: "1px solid #DDDDDD" }}>Entitlements</th>
                  <th className="px-5 py-3 font-bold uppercase tracking-wider text-[10px] text-right" style={{ color: "#595959", borderBottom: "1px solid #DDDDDD" }}>Consumption</th>
                  <th className="px-5 py-3 font-bold uppercase tracking-wider text-[10px] text-right" style={{ color: "#595959", borderBottom: "1px solid #DDDDDD" }}>Balance</th>
                  <th className="px-5 py-3 font-bold uppercase tracking-wider text-[10px]" style={{ color: "#595959", borderBottom: "1px solid #DDDDDD" }}>Compliance Status</th>
                  <th className="px-5 py-3 font-bold uppercase tracking-wider text-[10px] text-right" style={{ color: "#595959", borderBottom: "1px solid #DDDDDD" }}>Financial Impact</th>
                </tr>
              </thead>
              <tbody>
                {filteredSnapshots.map((snap, idx) => {
                  const isUnder = snap.complianceStatus === "UnderLicensed";
                  const isOver = snap.complianceStatus === "OverLicensed";
                  return (
                    <tr key={snap.id} className="transition-all hover:opacity-80"
                      style={{ background: idx % 2 === 0 ? "#FFFFFF" : "#F8F8F8", borderBottom: "1px solid #F1F1F1" }}>
                      <td className="px-5 py-3.5 font-semibold" style={{ color: "#001833" }}>{snap.softwareName}</td>
                      <td className="px-5 py-3.5" style={{ color: "#595959" }}>{snap.publisher}</td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1.5 font-medium" style={{ color: "#333333" }}>
                          {getMetricIcon(snap.metricType)}
                          {snap.metricType}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right font-semibold" style={{ color: "#001833" }}>{snap.entitlements}</td>
                      <td className="px-5 py-3.5 text-right font-semibold" style={{ color: "#001833" }}>{snap.consumption}</td>
                      <td className={`px-5 py-3.5 text-right font-bold`} style={{ color: isUnder ? "#C32525" : isOver ? "#E17000" : "#386015" }}>
                        {snap.balance > 0 ? `+${snap.balance}` : snap.balance}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider"
                          style={{
                            background: isUnder ? "#FFE4E4" : isOver ? "#FBF3CC" : "#DFEFD1",
                            color: isUnder ? "#C32525" : isOver ? "#806B3C" : "#386015",
                          }}>
                          {isUnder ? "Under-licensed" : isOver ? "Over-licensed" : "Compliant"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right font-semibold text-[11px]">
                        {isUnder ? (
                          <span style={{ color: "#C32525" }}>{formatCurrency(snap.costImpact)}</span>
                        ) : isOver ? (
                          <span style={{ color: "#595959" }}>{formatCurrency(Math.abs(snap.costImpact))}</span>
                        ) : (
                          <span style={{ color: "#386015" }}>--</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
