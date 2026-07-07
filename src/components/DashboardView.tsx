import React, { useState } from "react";
import { ComplianceSnapshot, MetricType, RenewalForecast } from "../types.js";
import { 
  Shield, AlertTriangle, CheckCircle, TrendingUp, Cpu, Users, Layers, 
  HardDrive, RefreshCw, Cloud, ArrowUpRight, Database, Activity, Clock,
  FileText, BarChart3, PieChart, Gauge, Search, ChevronRight
} from "lucide-react";

interface DashboardViewProps {
  onNavigateToLicenses: () => void;
  snapshots: ComplianceSnapshot[];
  isLoading: boolean;
  onRefresh: () => void;
  forecasts?: RenewalForecast[];
  ahbSavings?: number;
}

type SnowboardWidget = "COMPLIANCE_SCORE" | "AUDIT_RISK" | "OPTIMIZATION" | "BREAKDOWN" | "RENEWALS" | "AHB" | "COVERAGE" | "METRICS_PILLS";

export function DashboardView({ onNavigateToLicenses, snapshots, isLoading, onRefresh, forecasts = [], ahbSavings = 0 }: DashboardViewProps) {
  const [metricFilter, setMetricFilter] = useState<string>("ALL");
  const [activeSnowboard, setActiveSnowboard] = useState(0);

  const underLicensedCount = snapshots.filter((s) => s.complianceStatus === "UnderLicensed").length;
  const compliantCount = snapshots.filter((s) => s.complianceStatus === "Compliant").length;
  const overLicensedCount = snapshots.filter((s) => s.complianceStatus === "OverLicensed").length;

  const totalFinancialRisk = snapshots
    .filter((s) => s.complianceStatus === "UnderLicensed")
    .reduce((sum, s) => sum + s.costImpact, 0);

  const totalWastedSpend = snapshots
    .filter((s) => s.complianceStatus === "OverLicensed")
    .reduce((sum, s) => sum + Math.abs(s.costImpact), 0);

  const filteredSnapshots = metricFilter === "ALL"
    ? snapshots
    : snapshots.filter((s) => s.metricType === metricFilter);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency", currency: "USD", maximumFractionDigits: 0
    }).format(val);
  };

  const getMetricIcon = (metric: MetricType) => {
    switch (metric) {
      case MetricType.USERS: return <Users className="w-4 h-4" style={{ color: "#00A1DE" }} />;
      case MetricType.PROCESSOR_CORE: return <Cpu className="w-4 h-4" style={{ color: "#386015" }} />;
      case MetricType.PVU: return <Layers className="w-4 h-4" style={{ color: "#E17000" }} />;
      case MetricType.VDA: return <HardDrive className="w-4 h-4" style={{ color: "#C32525" }} />;
      default: return <Layers className="w-4 h-4" style={{ color: "#595959" }} />;
    }
  };

  const snowboards = [
    { name: "Default Snowboard", label: "Main Dashboard" },
    { name: "Compliance View", label: "Compliance Overview" },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header + Snowboard Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight" style={{ color: "#001833" }}>
            Effective License Position (ELP)
          </h1>
          <p className="text-xs mt-0.5" style={{ color: "#595959" }}>
            Continuous reconciliation matching purchased entitlement contracts against active software installations.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs rounded-lg px-3 py-1.5"
            style={{ background: "#FFFFFF", border: "1px solid #DDDDDD" }}>
            <PieChart className="w-3.5 h-3.5" style={{ color: "#00549F" }} />
            <select
              value={activeSnowboard}
              onChange={(e) => setActiveSnowboard(Number(e.target.value))}
              className="text-xs border-none outline-none bg-transparent font-semibold cursor-pointer"
              style={{ color: "#001833" }}
            >
              {snowboards.map((sb, i) => (
                <option key={i} value={i}>{sb.name}</option>
              ))}
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

      {/* Snowboard Widget Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Widget: Compliance Health */}
        <div className="rounded-lg overflow-hidden" style={{ boxShadow: "0 2px 8px 0 rgba(0,0,0,0.10)", background: "#FFFFFF" }}>
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#595959" }}>Compliance Health</span>
              <Gauge className="w-4 h-4" style={{ color: "#386015" }} />
            </div>
            <div className="text-2xl font-bold" style={{ color: "#001833" }}>
              {snapshots.length > 0 ? Math.round(((compliantCount + overLicensedCount) / snapshots.length) * 100) : 100}%
            </div>
            <div className="mt-1 h-1.5 w-full rounded-full" style={{ background: "#DDDDDD" }}>
              <div className="h-1.5 rounded-full transition-all" style={{ 
                width: `${snapshots.length > 0 ? Math.round(((compliantCount + overLicensedCount) / snapshots.length) * 100) : 100}%`,
                background: "#386015"
              }} />
            </div>
            <p className="text-[11px] mt-1.5" style={{ color: "#595959" }}>
              {compliantCount + overLicensedCount}/{snapshots.length} titles compliant
            </p>
          </div>
        </div>

        {/* Widget: Audit Exposure Risk */}
        <div className="rounded-lg overflow-hidden" style={{ boxShadow: "0 2px 8px 0 rgba(0,0,0,0.10)", background: "#FFFFFF" }}>
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#595959" }}>Audit Exposure Risk</span>
              <AlertTriangle className="w-4 h-4" style={{ color: "#C32525" }} />
            </div>
            <div className="text-2xl font-bold" style={{ color: "#C32525" }}>{formatCurrency(totalFinancialRisk)}</div>
            <p className="text-[11px] mt-1.5" style={{ color: "#595959" }}>
              Exposure across {underLicensedCount} under-licensed titles
            </p>
          </div>
          {underLicensedCount > 0 && (
            <div className="px-4 py-2 text-[10px] font-semibold cursor-pointer hover:opacity-80"
              style={{ background: "#FFF5F5", color: "#C32525", borderTop: "1px solid #FFE4E4" }}>
              <button onClick={onNavigateToLicenses} className="flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3" /> View under-licensed titles
              </button>
            </div>
          )}
        </div>

        {/* Widget: Optimization Potential */}
        <div className="rounded-lg overflow-hidden" style={{ boxShadow: "0 2px 8px 0 rgba(0,0,0,0.10)", background: "#FFFFFF" }}>
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#595959" }}>Optimization Potential</span>
              <TrendingUp className="w-4 h-4" style={{ color: "#E17000" }} />
            </div>
            <div className="text-2xl font-bold" style={{ color: "#001833" }}>{formatCurrency(totalWastedSpend)}</div>
            <p className="text-[11px] mt-1.5" style={{ color: "#595959" }}>
              Wasted on {overLicensedCount} over-licensed titles
            </p>
          </div>
        </div>

        {/* Widget: Summary Breakdown */}
        <div className="rounded-lg overflow-hidden" style={{ boxShadow: "0 2px 8px 0 rgba(0,0,0,0.10)", background: "#FFFFFF" }}>
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#595959" }}>Status Breakdown</span>
              <BarChart3 className="w-4 h-4" style={{ color: "#00549F" }} />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center p-2 rounded" style={{ background: "#DFEFD1" }}>
                <div className="text-[9px] font-bold uppercase" style={{ color: "#386015" }}>OK</div>
                <div className="text-lg font-bold" style={{ color: "#386015" }}>{compliantCount}</div>
              </div>
              <div className="text-center p-2 rounded" style={{ background: "#FFE4E4" }}>
                <div className="text-[9px] font-bold uppercase" style={{ color: "#C32525" }}>Under</div>
                <div className="text-lg font-bold" style={{ color: "#C32525" }}>{underLicensedCount}</div>
              </div>
              <div className="text-center p-2 rounded" style={{ background: "#FBF3CC" }}>
                <div className="text-[9px] font-bold uppercase" style={{ color: "#806B3C" }}>Over</div>
                <div className="text-lg font-bold" style={{ color: "#806B3C" }}>{overLicensedCount}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Snowboard Widget Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Widget: Renewal Forecasts */}
        <div className="rounded-lg overflow-hidden" style={{ boxShadow: "0 2px 8px 0 rgba(0,0,0,0.10)", background: "#FFFFFF" }}>
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#595959" }}>Renewal Forecasts</span>
              <Clock className="w-4 h-4" style={{ color: "#00A1DE" }} />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold" style={{ color: "#001833" }}>
                {forecasts.filter((f) => f.daysUntilExpiry <= 30 && f.daysUntilExpiry > 0).length}
              </span>
              <span className="text-[11px]" style={{ color: "#595959" }}>expiring within 30 days</span>
            </div>
            {forecasts.filter((f) => f.daysUntilExpiry <= 0).length > 0 && (
              <p className="text-[11px] font-semibold mt-1" style={{ color: "#C32525" }}>
                {forecasts.filter((f) => f.daysUntilExpiry <= 0).length} already expired
              </p>
            )}
          </div>
          {forecasts.filter((f) => f.daysUntilExpiry <= 30).length > 0 && (
            <div className="border-t px-4 py-3 space-y-2" style={{ borderColor: "#DDDDDD" }}>
              {forecasts.filter((f) => f.daysUntilExpiry <= 30).slice(0, 4).map((f) => (
                <div key={f.licenseId} className="flex justify-between items-center text-[11px]">
                  <span className="truncate font-medium" style={{ color: "#333333" }}>{f.softwareName}</span>
                  <span className={`font-bold shrink-0 ml-2 ${f.daysUntilExpiry <= 0 ? "" : ""}`}
                    style={{ color: f.daysUntilExpiry <= 0 ? "#C32525" : "#E17000" }}>
                    {f.daysUntilExpiry <= 0 ? "Expired" : `${f.daysUntilExpiry}d`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Widget: Azure Hybrid Benefit */}
        <div className="rounded-lg overflow-hidden" style={{ boxShadow: "0 2px 8px 0 rgba(0,0,0,0.10)", background: "#FFFFFF" }}>
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#595959" }}>Azure Hybrid Benefit</span>
              <Cloud className="w-4 h-4" style={{ color: "#00A1DE" }} />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold" style={{ color: "#00549F" }}>
                {ahbSavings > 0 ? `$${ahbSavings.toLocaleString()}` : "$0"}
              </span>
              <span className="text-[11px]" style={{ color: "#595959" }}>/mo</span>
            </div>
            <p className="text-[11px] mt-1" style={{ color: "#595959" }}>
              Potential monthly savings via BYOL
            </p>
          </div>
          {ahbSavings > 0 && (
            <div className="px-4 py-2 text-[10px] font-semibold" style={{ background: "#DFEFD1", color: "#386015", borderTop: "1px solid #C1C1C1" }}>
              Enable AHB on PAYG VMs to recover costs
            </div>
          )}
        </div>

        {/* Widget: ELP Coverage Ratio */}
        <div className="rounded-lg overflow-hidden" style={{ boxShadow: "0 2px 8px 0 rgba(0,0,0,0.10)", background: "#FFFFFF" }}>
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#595959" }}>ELP Coverage Ratio</span>
              <Database className="w-4 h-4" style={{ color: "#386015" }} />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold" style={{ color: "#001833" }}>
                {snapshots.length > 0
                  ? `${Math.round((snapshots.filter((s) => s.complianceStatus !== "UnderLicensed").length / snapshots.length) * 100)}%`
                  : "N/A"}
              </span>
              <span className="text-[11px]" style={{ color: "#595959" }}>coverage</span>
            </div>
            <p className="text-[11px] mt-1" style={{ color: "#595959" }}>
              {snapshots.filter((s) => s.complianceStatus !== "UnderLicensed").length}/{snapshots.length} titles covered
            </p>
          </div>
        </div>
      </div>

      {/* Metric Explanation Widget */}
      <div className="rounded-lg overflow-hidden p-4" style={{ boxShadow: "0 2px 8px 0 rgba(0,0,0,0.10)", background: "#F8F8F8", border: "1px solid #DDDDDD" }}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <h4 className="text-xs font-bold flex items-center gap-1.5 mb-1" style={{ color: "#333333" }}>
              <Users className="w-3.5 h-3.5" style={{ color: "#00A1DE" }} /> Users & Device Metrics
            </h4>
            <p className="text-[11px] leading-relaxed" style={{ color: "#595959" }}>
              Consolidates installs per individual account. Multiple device installations by the same user consume exactly <strong>1 User entitlement</strong>.
            </p>
          </div>
          <div>
            <h4 className="text-xs font-bold flex items-center gap-1.5 mb-1" style={{ color: "#333333" }}>
              <Cpu className="w-3.5 h-3.5" style={{ color: "#386015" }} /> Processor & Core Metrics
            </h4>
            <p className="text-[11px] leading-relaxed" style={{ color: "#595959" }}>
              Matches server licensing structures. Calculates requirements based on the aggregated physical <strong>CPU cores</strong> of machines running the software.
            </p>
          </div>
          <div>
            <h4 className="text-xs font-bold flex items-center gap-1.5 mb-1" style={{ color: "#333333" }}>
              <Layers className="w-3.5 h-3.5" style={{ color: "#E17000" }} /> IBM PVU & Windows VDA
            </h4>
            <p className="text-[11px] leading-relaxed" style={{ color: "#595959" }}>
              PVU tracks <strong>cores × PVU weight</strong> values. VDA monitors client OS instances running inside nested <strong>Virtual Machines</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* ELP Grid (table card) */}
      <div className="rounded-lg overflow-hidden" style={{ boxShadow: "0 2px 8px 0 rgba(0,0,0,0.10)", background: "#FFFFFF" }}>
        <div className="px-5 py-3.5 flex items-center justify-between gap-4" style={{ borderBottom: "1px solid #DDDDDD" }}>
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4" style={{ color: "#00549F" }} />
            <h3 className="text-xs font-bold" style={{ color: "#001833" }}>Effective License Position (ELP) Grid</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-medium" style={{ color: "#595959" }}>Filter Metric:</span>
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
                            border: `1px solid ${isUnder ? "#FFE4E4" : isOver ? "#FBF3CC" : "#DFEFD1"}`
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
