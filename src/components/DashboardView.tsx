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

const PIE_COLORS = ["#2E7D32", "#C32525", "#E17000"];
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
    { name: "Em Conformidade", value: compliantCount },
    { name: "Sublicenciado", value: underLicensedCount },
    { name: "Sobrerlicenciado", value: overLicensedCount },
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
      case MetricType.USERS: return <Users className="w-4 h-4" style={{ color: "#366BB2" }} />;
      case MetricType.PROCESSOR_CORE: return <Cpu className="w-4 h-4" style={{ color: "#386015" }} />;
      case MetricType.PVU: return <Layers className="w-4 h-4" style={{ color: "#E17000" }} />;
      case MetricType.VDA: return <HardDrive className="w-4 h-4" style={{ color: "#C32525" }} />;
      default: return <Layers className="w-4 h-4" style={{ color: "#6E7070" }} />;
    }
  };

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0];
    return (
      <div className="text-[11px] px-3 py-2 rounded-lg shadow-sm" style={{ background: "#212424", color: "#FFFFFF" }}>
        <span className="font-semibold">{d.name}: {d.value} título{d.value !== 1 ? "s" : ""}</span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="tracking-tight" style={{ color: "#212424", fontSize: "20px", fontWeight: 400 }}>
              Posição Efetiva de Licenciamento (ELP)
            </h1>
            <HintTooltip text="O ELP reconcilia continuamente seus direitos de licença adquiridos com o consumo real de software em todo o parque, sinalizando lacunas de conformidade e gastos excessivos." side="right" size="md" />
          </div>
          <p className="text-xs mt-0.5" style={{ color: "#6E7070" }}>
            Reconciliação de licenças em nível corporativo &mdash; {totalTitles} títulos de software monitorados em {snapshots.map(s => s.publisher).filter((v,i,a) => a.indexOf(v)===i).length} editoras
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs rounded-lg px-3 py-1.5" style={{ background: "#FFFFFF", border: "1px solid #D0D0D0" }}>
            <Calendar className="w-3.5 h-3.5" style={{ color: "#366BB2" }} />
            <select
              value={widgetPeriod}
              onChange={(e) => setWidgetPeriod(e.target.value as any)}
              className="text-xs border-none outline-none bg-transparent font-semibold cursor-pointer"
              style={{ color: "#212424" }}
            >
              <option value="7d">Últimos 7 dias</option>
              <option value="30d">Últimos 30 dias</option>
              <option value="90d">Últimos 90 dias</option>
            </select>
          </div>
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold transition-all cursor-pointer disabled:opacity-50 border"
            style={{ background: "#366BB2", color: "#FFFFFF", borderColor: "#366BB2", borderRadius: "3px" }}
            onMouseEnter={(e) => e.currentTarget.style.background = "#4079C4"}
            onMouseLeave={(e) => e.currentTarget.style.background = "#366BB2"}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            {isLoading ? "Recalculando..." : "Recalcular ELP"}
          </button>
        </div>
      </div>

      {/* Row 1: Core KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* KPI 1: Compliance Score */}
        <div className="rounded-lg overflow-hidden transition-all hover:shadow-md" style={{ boxShadow: "0 1px 4px 0 rgba(0,0,0,0.08)", background: "#FFFFFF" }}>
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1" style={{ color: "#6E7070" }}>
                Pontuação de Conformidade
                <HintTooltip text="Percentual de títulos de software que estão em conformidade ou sobrerlicenciados (sem lacuna de licenciamento). Quanto maior, melhor." />
              </span>
              <Gauge className="w-4 h-4" style={{ color: avgCompliancePct >= 90 ? "#386015" : avgCompliancePct >= 70 ? "#E17000" : "#C32525" }} />
            </div>
            <div className="text-2xl font-bold flex items-baseline gap-1" style={{ color: "#212424" }}>
              {avgCompliancePct}%
              <span className="text-[11px] font-normal" style={{ color: "#6E7070" }}>média</span>
            </div>
            <div className="mt-2 h-1.5 w-full rounded-full" style={{ background: "#D0D0D0" }}>
              <div className="h-1.5 rounded-full transition-all" style={{
                width: `${avgCompliancePct}%`,
                background: avgCompliancePct >= 90 ? "#386015" : avgCompliancePct >= 70 ? "#E17000" : "#C32525"
              }} />
            </div>
            <p className="text-[11px] mt-1.5" style={{ color: "#6E7070" }}>
              {compliantCount + overLicensedCount}/{totalTitles} títulos em conformidade
            </p>
          </div>
        </div>

        {/* KPI 2: Audit Exposure */}
        <div className="rounded-lg overflow-hidden transition-all hover:shadow-md" style={{ boxShadow: "0 1px 4px 0 rgba(0,0,0,0.08)", background: "#FFFFFF" }}>
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1" style={{ color: "#6E7070" }}>
                Exposição a Auditoria
                <HintTooltip text="Risco financeiro total de títulos sublicenciados. É o valor que uma editora poderia reivindicar em uma auditoria de conformidade." />
              </span>
              <AlertTriangle className="w-4 h-4" style={{ color: "#C32525" }} />
            </div>
            <div className="text-2xl font-bold" style={{ color: "#C32525" }}>{formatCurrency(totalFinancialRisk)}</div>
            <div className="flex items-center gap-2 mt-1.5">
              <div className="text-[11px]" style={{ color: "#6E7070" }}>
                <span className="font-semibold" style={{ color: "#C32525" }}>{underLicensedCount}</span> títulos em risco
              </div>
              <div className="text-[11px]" style={{ color: "#6E7070" }}>({exposureRatio}% de exposição)</div>
            </div>
          </div>
          {underLicensedCount > 0 && (
            <div className="px-4 py-2 text-[10px] font-semibold cursor-pointer hover:opacity-80" style={{ background: "#FFF5F5", color: "#C32525", borderTop: "1px solid #FFE4E4" }}>
              <button onClick={onNavigateToLicenses} className="flex items-center gap-1 cursor-pointer">
                <Eye className="w-3 h-3" /> Revisar e corrigir títulos sublicenciados
              </button>
            </div>
          )}
        </div>

        {/* KPI 3: Optimization Potential */}
        <div className="rounded-lg overflow-hidden transition-all hover:shadow-md" style={{ boxShadow: "0 1px 4px 0 rgba(0,0,0,0.08)", background: "#FFFFFF" }}>
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1" style={{ color: "#6E7070" }}>
                Gasto Excessivo
                <HintTooltip text="Gasto desperdiçado em títulos sobrerlicenciados. Redimensionar ou reutilizar esses direitos pode reduzir custos." />
              </span>
              <TrendingUp className="w-4 h-4" style={{ color: "#E17000" }} />
            </div>
            <div className="text-2xl font-bold" style={{ color: "#212424" }}>{formatCurrency(totalWastedSpend)}</div>
            <p className="text-[11px] mt-1.5" style={{ color: "#6E7070" }}>
              {overLicensedCount} título{overLicensedCount !== 1 ? "s" : ""} sobrerlicenciado{overLicensedCount !== 1 ? "s" : ""} — economia potencial com reaproveitamento
            </p>
          </div>
        </div>

        {/* KPI 4: Total Entitlement Base */}
        <div className="rounded-lg overflow-hidden transition-all hover:shadow-md" style={{ boxShadow: "0 1px 4px 0 rgba(0,0,0,0.08)", background: "#FFFFFF" }}>
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1" style={{ color: "#6E7070" }}>
                Base de Direitos de Uso
                <HintTooltip text="Número total de unidades de licença (cadeiras, núcleos, PVUs) adquiridas em todos os contratos combinados." />
              </span>
              <Database className="w-4 h-4" style={{ color: "#366BB2" }} />
            </div>
            <div className="text-2xl font-bold" style={{ color: "#212424" }}>{totalEntitlements.toLocaleString()}</div>
            <p className="text-[11px] mt-1.5" style={{ color: "#6E7070" }}>
              <span className="font-semibold">{totalConsumption.toLocaleString()}</span> consumidos no parque
            </p>
          </div>
        </div>

        {/* KPI 5: Renewals */}
        <div className="rounded-lg overflow-hidden transition-all hover:shadow-md" style={{ boxShadow: "0 1px 4px 0 rgba(0,0,0,0.08)", background: "#FFFFFF" }}>
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1" style={{ color: "#6E7070" }}>
                Alertas de Renovação
                <HintTooltip text="Licenças que expiram no período selecionado. Licenças expiradas podem gerar lacunas de conformidade e interrupção de serviços." />
              </span>
              <Clock className="w-4 h-4" style={{ color: "#366BB2" }} />
            </div>
            <div className="text-2xl font-bold flex items-baseline gap-1" style={{ color: "#212424" }}>
              {forecasts.filter((f) => f.daysUntilExpiry <= 30 && f.daysUntilExpiry > 0).length}
              <span className="text-[11px] font-normal" style={{ color: "#6E7070" }}>em 30d</span>
            </div>
            {forecasts.filter((f) => f.daysUntilExpiry <= 0).length > 0 && (
              <p className="text-[11px] font-semibold mt-1" style={{ color: "#C32525" }}>
                {forecasts.filter((f) => f.daysUntilExpiry <= 0).length} já expirada{forecasts.filter((f) => f.daysUntilExpiry <= 0).length !== 1 ? "s" : ""}
              </p>
            )}
            {forecasts.filter((f) => f.daysUntilExpiry > 0 && f.daysUntilExpiry <= 30).length === 0 && forecasts.filter((f) => f.daysUntilExpiry <= 0).length === 0 && (
              <p className="text-[11px] mt-1.5" style={{ color: "#6E7070" }}>Nenhuma renovação pendente — tudo limpo</p>
            )}
          </div>
        </div>
      </div>

      {/* Row 2: Charts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Chart 1: Compliance Pie */}
        <div className="rounded-lg overflow-hidden" style={{ boxShadow: "0 1px 4px 0 rgba(0,0,0,0.08)", background: "#FFFFFF" }}>
          <div className="px-4 py-3 flex items-center justify-between border-b" style={{ borderColor: "#D0D0D0" }}>
            <div className="flex items-center gap-1.5">
              <PieChart className="w-4 h-4" style={{ color: "#366BB2" }} />
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#212424" }}>Detalhamento de Conformidade</span>
            </div>
            <HintTooltip text="Distribuição de todos os títulos monitorados por status de conformidade. Verde = em conformidade, Vermelho = sublicenciado, Âmbar = sobrerlicenciado." />
          </div>
          <div className="p-4">
            {pieData.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-xs" style={{ color: "#6E7070" }}>
                Nenhum dado de conformidade disponível
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
                <div key={d.name} className="flex items-center gap-1.5 text-[10px]" style={{ color: "#6E7070" }}>
                  <span className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                  {d.name}: {d.value}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Chart 2: Compliance by Publisher */}
        <div className="rounded-lg overflow-hidden" style={{ boxShadow: "0 1px 4px 0 rgba(0,0,0,0.08)", background: "#FFFFFF" }}>
          <div className="px-4 py-3 flex items-center justify-between border-b" style={{ borderColor: "#D0D0D0" }}>
            <div className="flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4" style={{ color: "#366BB2" }} />
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#212424" }}>Conformidade por Editora</span>
            </div>
            <HintTooltip text="Títulos em conformidade vs sublicenciados agrupados por editora. Barras verdes mostram quantidade em conformidade, barras vermelhas mostram títulos em risco." />
          </div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={200}>
              <ReBarChart data={barData} barGap={2} barCategoryGap="12%">
                <CartesianGrid strokeDasharray="3 3" stroke="#F2F2F2" vertical={false} />
                <XAxis dataKey="publisher" tick={{ fontSize: 10, fill: "#6E7070" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#6E7070" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <ReTooltip contentStyle={{ background: "#212424", border: "none", borderRadius: "8px", fontSize: "11px", color: "#FFFFFF" }} />
                <Bar dataKey="compliant" name="Em Conformidade" radius={[3, 3, 0, 0]} fill="#386015" maxBarSize={32} />
                <Bar dataKey="under" name="Sublicenciado" radius={[3, 3, 0, 0]} fill="#C32525" maxBarSize={32} />
              </ReBarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Entitlements vs Consumption by Metric */}
        <div className="rounded-lg overflow-hidden" style={{ boxShadow: "0 1px 4px 0 rgba(0,0,0,0.08)", background: "#FFFFFF" }}>
          <div className="px-4 py-3 flex items-center justify-between border-b" style={{ borderColor: "#D0D0D0" }}>
            <div className="flex items-center gap-1.5">
              <Activity className="w-4 h-4" style={{ color: "#366BB2" }} />
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#212424" }}>Direitos vs Consumo</span>
            </div>
            <HintTooltip text="Direitos adquiridos vs consumo real divididos por tipo de métrica. Lacunas mostram onde as licenças estão sendo sub ou sobreconsumidas." />
          </div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={200}>
              <ReAreaChart data={areaData}>
                <defs>
                  <linearGradient id="entGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#366BB2" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#366BB2" stopOpacity={0.01} />
                  </linearGradient>
                  <linearGradient id="conGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E17000" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#E17000" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F2F2F2" vertical={false} />
                <XAxis dataKey="metric" tick={{ fontSize: 10, fill: "#6E7070" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#6E7070" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <ReTooltip contentStyle={{ background: "#212424", border: "none", borderRadius: "8px", fontSize: "11px", color: "#FFFFFF" }} />
                <Area type="monotone" dataKey="entitlements" name="Direitos" stroke="#366BB2" strokeWidth={2} fill="url(#entGrad)" dot={false} />
                <Area type="monotone" dataKey="consumption" name="Consumo" stroke="#E17000" strokeWidth={2} fill="url(#conGrad)" dot={false} />
              </ReAreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3: Detail Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Widget: Renewal Forecast Detail */}
        <div className="rounded-lg overflow-hidden" style={{ boxShadow: "0 1px 4px 0 rgba(0,0,0,0.08)", background: "#FFFFFF" }}>
          <div className="px-4 py-3 flex items-center justify-between border-b" style={{ borderColor: "#D0D0D0" }}>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" style={{ color: "#366BB2" }} />
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#212424" }}>Próximas Renovações</span>
            </div>
            <HintTooltip text="Licenças que expiram nos próximos 60 dias. A renovação proativa evita lacunas de conformidade e garante cobertura ininterrupta." />
          </div>
          <div className="divide-y" style={{ borderColor: "#F2F2F2" }}>
            {forecasts.filter((f) => f.daysUntilExpiry <= 60).length === 0 ? (
              <div className="px-4 py-6 text-center text-xs" style={{ color: "#6E7070" }}>
                Nenhuma renovação prevista nos próximos 60 dias
              </div>
            ) : (
              forecasts.filter((f) => f.daysUntilExpiry <= 60).slice(0, 5).map((f) => (
                <div key={f.licenseId} className="px-4 py-2.5 flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-semibold truncate" style={{ color: "#212424" }}>{f.softwareName}</div>
                    <div className="text-[10px]" style={{ color: "#6E7070" }}>{f.publisher}</div>
                  </div>
                  <span className={`text-[11px] font-bold shrink-0 ml-2 px-2 py-0.5 rounded`}
                    style={{
                      background: f.daysUntilExpiry <= 0 ? "#FFE4E4" : f.daysUntilExpiry <= 15 ? "#FFF5F5" : "#FBF3CC",
                      color: f.daysUntilExpiry <= 0 ? "#C32525" : f.daysUntilExpiry <= 15 ? "#C32525" : "#806B3C"
                    }}>
                    {f.daysUntilExpiry <= 0 ? "Expirada" : `${f.daysUntilExpiry}d`}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Widget: AHB Savings */}
        <div className="rounded-lg overflow-hidden" style={{ boxShadow: "0 1px 4px 0 rgba(0,0,0,0.08)", background: "#FFFFFF" }}>
          <div className="px-4 py-3 flex items-center justify-between border-b" style={{ borderColor: "#D0D0D0" }}>
            <div className="flex items-center gap-1.5">
              <Cloud className="w-3.5 h-3.5" style={{ color: "#366BB2" }} />
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#212424" }}>Azure Hybrid Benefit</span>
            </div>
            <HintTooltip text="O AHB permite aplicar licenças on-premises do Windows Server e SQL Server em VMs Azure com taxas reduzidas. Economia mensal potencial exibida." />
          </div>
          <div className="p-4">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold" style={{ color: "#366BB2" }}>
                {ahbSavings > 0 ? `$${ahbSavings.toLocaleString()}` : "$0"}
              </span>
              <span className="text-[11px]" style={{ color: "#6E7070" }}>/mês potencial</span>
            </div>
            <div className="mt-3 h-1.5 w-full rounded-full" style={{ background: "#D0D0D0" }}>
              <div className="h-1.5 rounded-full" style={{ width: "35%", background: "#366BB2" }} />
            </div>
            <p className="text-[11px] mt-1.5" style={{ color: "#6E7070" }}>
              {ahbSavings > 0
                ? `${Math.round(ahbSavings * 0.6).toLocaleString()} atualmente não realizados`
                : "Ative BYOL em VMs Azure elegíveis para reduzir custos"}
            </p>
          </div>
          {ahbSavings > 0 && (
            <div className="px-4 py-2 text-[10px] font-semibold" style={{ background: "#DFEFD1", color: "#386015", borderTop: "1px solid #A0A0A0" }}>
              Ative AHB em VMs PAYG para recuperar custos
            </div>
          )}
        </div>

        {/* Widget: Metric Distribution */}
        <div className="rounded-lg overflow-hidden" style={{ boxShadow: "0 1px 4px 0 rgba(0,0,0,0.08)", background: "#FFFFFF" }}>
          <div className="px-4 py-3 flex items-center justify-between border-b" style={{ borderColor: "#D0D0D0" }}>
            <div className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" style={{ color: "#366BB2" }} />
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#212424" }}>Distribuição de Métricas</span>
            </div>
            <HintTooltip text="Detalhamento de como as licenças são medidas no parque. Cada modelo de métrica possui regras de conformidade e lógica de reconciliação exclusivas." />
          </div>
          <div className="p-4 space-y-3">
            {Object.values(MetricType).map((mt) => {
              const count = snapshots.filter((s) => s.metricType === mt).length;
              const pct = totalTitles > 0 ? Math.round((count / totalTitles) * 100) : 0;
              return (
                <div key={mt}>
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="font-medium flex items-center gap-1" style={{ color: "#212424" }}>
                      {getMetricIcon(mt as MetricType)} {mt}
                    </span>
                    <span className="font-semibold" style={{ color: "#6E7070" }}>{count} ({pct}%)</span>
                  </div>
                  <div className="h-1 w-full rounded-full" style={{ background: "#F2F2F2" }}>
                    <div className="h-1 rounded-full" style={{ width: `${pct}%`, background: "#366BB2" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Widget: Quick Actions */}
        <div className="rounded-lg overflow-hidden" style={{ boxShadow: "0 1px 4px 0 rgba(0,0,0,0.08)", background: "#FFFFFF" }}>
          <div className="px-4 py-3 flex items-center justify-between border-b" style={{ borderColor: "#D0D0D0" }}>
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" style={{ color: "#E17000" }} />
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#212424" }}>Ações Rápidas</span>
            </div>
            <HintTooltip text="Tarefas comuns para gerenciar seu parque de licenças. Cada ação guia você até a seção relevante com filtros pré-aplicados." />
          </div>
          <div className="p-3 space-y-2">
            {[
              { label: "Revisar títulos sublicenciados", icon: AlertTriangle, color: "#C32525", onClick: onNavigateToLicenses },
              { label: "Exportar relatório de conformidade", icon: Download, color: "#366BB2" },
              { label: "Executar reconciliação completa", icon: RefreshCw, color: "#386015" },
              { label: "Visualizar registro de auditoria", icon: Eye, color: "#6E7070" },
            ].map((action, i) => (
              <button
                key={i}
                onClick={action.onClick}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-[11px] font-medium transition-all cursor-pointer hover:opacity-80"
                style={{ background: "#F2F2F2", color: "#212424" }}
              >
                <span className="flex items-center gap-2">
                  <action.icon className="w-3.5 h-3.5" style={{ color: action.color }} />
                  {action.label}
                </span>
                <ChevronRight className="w-3 h-3" style={{ color: "#6E7070" }} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Row 4: Metric Explanation */}
      <div className="rounded-lg overflow-hidden p-4" style={{ boxShadow: "0 1px 4px 0 rgba(0,0,0,0.08)", background: "#F2F2F2", border: "1px solid #D0D0D0" }}>
        <div className="flex items-center gap-1.5 mb-3">
          <Info className="w-3.5 h-3.5" style={{ color: "#366BB2" }} />
          <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "#212424" }}>Como as Métricas São Calculadas</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-3 rounded-lg" style={{ background: "#FFFFFF" }}>
            <h4 className="text-xs font-bold flex items-center gap-1.5 mb-1" style={{ color: "#212424" }}>
              <Users className="w-3.5 h-3.5" style={{ color: "#366BB2" }} /> Usuários
            </h4>
            <p className="text-[11px] leading-relaxed" style={{ color: "#6E7070" }}>
              Conta <strong>usuários nomeados</strong> únicos com o software instalado. Múltiplos dispositivos do mesmo usuário consomem <strong>1 direito de uso</strong>.
            </p>
          </div>
          <div className="p-3 rounded-lg" style={{ background: "#FFFFFF" }}>
            <h4 className="text-xs font-bold flex items-center gap-1.5 mb-1" style={{ color: "#212424" }}>
              <Cpu className="w-3.5 h-3.5" style={{ color: "#386015" }} /> Processador/Núcleo
            </h4>
            <p className="text-[11px] leading-relaxed" style={{ color: "#6E7070" }}>
              Calculado a partir de <strong>núcleos físicos</strong> das máquinas que executam o software. Núcleos virtuais são excluídos conforme as regras de licenciamento da maioria dos fornecedores.
            </p>
          </div>
          <div className="p-3 rounded-lg" style={{ background: "#FFFFFF" }}>
            <h4 className="text-xs font-bold flex items-center gap-1.5 mb-1" style={{ color: "#212424" }}>
              <Layers className="w-3.5 h-3.5" style={{ color: "#E17000" }} /> IBM PVU
            </h4>
            <p className="text-[11px] leading-relaxed" style={{ color: "#6E7070" }}>
              <strong>Núcleos × peso PVU</strong> por tipo de processador. O licenciamento IBM sub-capacity requer gerenciamento avançado de virtualização.
            </p>
          </div>
          <div className="p-3 rounded-lg" style={{ background: "#FFFFFF" }}>
            <h4 className="text-xs font-bold flex items-center gap-1.5 mb-1" style={{ color: "#212424" }}>
              <HardDrive className="w-3.5 h-3.5" style={{ color: "#C32525" }} /> Windows VDA
            </h4>
            <p className="text-[11px] leading-relaxed" style={{ color: "#6E7070" }}>
              Rastreia <strong>instâncias de SO cliente</strong> executando dentro de máquinas virtuais. Cada VM ou sessão de área de trabalho remota requer uma licença VDA.
            </p>
          </div>
        </div>
      </div>

      {/* Row 5: ELP Table */}
      <div className="rounded-lg overflow-hidden" style={{ boxShadow: "0 1px 4px 0 rgba(0,0,0,0.08)", background: "#FFFFFF" }}>
        <div className="px-5 py-3.5 flex items-center justify-between gap-4" style={{ borderBottom: "1px solid #D0D0D0" }}>
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4" style={{ color: "#366BB2" }} />
            <h3 className="text-xs font-bold" style={{ color: "#212424" }}>Grade de Posição Efetiva de Licenciamento (ELP)</h3>
            <HintTooltip text="Grade detalhada mostrando a quantidade de direitos de uso, consumo real, saldo, status de conformidade e impacto financeiro de cada título de software. Filtre por tipo de métrica usando o menu suspenso." />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-3 h-3" style={{ color: "#6E7070" }} />
            <span className="text-[10px] font-medium" style={{ color: "#6E7070" }}>Métrica:</span>
            <select
              value={metricFilter}
              onChange={(e) => setMetricFilter(e.target.value)}
              className="text-[11px] rounded px-2 py-1 outline-none cursor-pointer"
              style={{ border: "1px solid #D0D0D0", background: "#FFFFFF", color: "#212424" }}
            >
              <option value="ALL">Todas as Métricas</option>
              {Object.values(MetricType).map((mt) => (
                <option key={mt} value={mt}>{mt}</option>
              ))}
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 text-center" style={{ color: "#6E7070" }}>
            <RefreshCw className="w-6 h-6 mx-auto mb-2 animate-spin" style={{ color: "#366BB2" }} />
            <p className="text-xs font-medium">Reconciliando inventário e cálculos de licenças...</p>
          </div>
        ) : filteredSnapshots.length === 0 ? (
          <div className="p-12 text-center">
            <AlertTriangle className="w-10 h-10 mx-auto mb-3" style={{ color: "#A0A0A0" }} />
            <p className="text-xs font-bold" style={{ color: "#212424" }}>Nenhum snapshot de conformidade gerado.</p>
            <p className="text-[11px] mt-1" style={{ color: "#6E7070" }}>Adicione licenças de software e instalações para executar o mecanismo de cálculo.</p>
            <button
              onClick={onNavigateToLicenses}
              className="mt-4 px-4 py-2 text-xs font-bold transition-all cursor-pointer"
              style={{ background: "#366BB2", color: "#FFFFFF", borderRadius: "3px" }}
              onMouseEnter={(e) => e.currentTarget.style.background = "#4079C4"}
              onMouseLeave={(e) => e.currentTarget.style.background = "#366BB2"}
            >
                Configurar Licenças
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#F2F2F2" }}>
                  <th className="px-5 py-3 font-bold uppercase tracking-wider text-[10px]" style={{ color: "#6E7070", borderBottom: "1px solid #D0D0D0" }}>Título do Software</th>
                  <th className="px-5 py-3 font-bold uppercase tracking-wider text-[10px]" style={{ color: "#6E7070", borderBottom: "1px solid #D0D0D0" }}>Editora</th>
                  <th className="px-5 py-3 font-bold uppercase tracking-wider text-[10px]" style={{ color: "#6E7070", borderBottom: "1px solid #D0D0D0" }}>Modelo de Métrica</th>
                  <th className="px-5 py-3 font-bold uppercase tracking-wider text-[10px] text-right" style={{ color: "#6E7070", borderBottom: "1px solid #D0D0D0" }}>Direitos de Uso</th>
                  <th className="px-5 py-3 font-bold uppercase tracking-wider text-[10px] text-right" style={{ color: "#6E7070", borderBottom: "1px solid #D0D0D0" }}>Consumo</th>
                  <th className="px-5 py-3 font-bold uppercase tracking-wider text-[10px] text-right" style={{ color: "#6E7070", borderBottom: "1px solid #D0D0D0" }}>Saldo</th>
                  <th className="px-5 py-3 font-bold uppercase tracking-wider text-[10px]" style={{ color: "#6E7070", borderBottom: "1px solid #D0D0D0" }}>Status de Conformidade</th>
                  <th className="px-5 py-3 font-bold uppercase tracking-wider text-[10px] text-right" style={{ color: "#6E7070", borderBottom: "1px solid #D0D0D0" }}>Impacto Financeiro</th>
                </tr>
              </thead>
              <tbody>
                {filteredSnapshots.map((snap, idx) => {
                  const isUnder = snap.complianceStatus === "UnderLicensed";
                  const isOver = snap.complianceStatus === "OverLicensed";
                  return (
                    <tr key={snap.id} className="transition-all hover:opacity-80"
                      style={{ background: idx % 2 === 0 ? "#FFFFFF" : "#F2F2F2", borderBottom: "1px solid #F2F2F2" }}>
                      <td className="px-5 py-3.5 font-semibold" style={{ color: "#212424" }}>{snap.softwareName}</td>
                      <td className="px-5 py-3.5" style={{ color: "#6E7070" }}>{snap.publisher}</td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1.5 font-medium" style={{ color: "#212424" }}>
                          {getMetricIcon(snap.metricType)}
                          {snap.metricType}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right font-semibold" style={{ color: "#212424" }}>{snap.entitlements}</td>
                      <td className="px-5 py-3.5 text-right font-semibold" style={{ color: "#212424" }}>{snap.consumption}</td>
                      <td className={`px-5 py-3.5 text-right font-bold`} style={{ color: isUnder ? "#C32525" : isOver ? "#E17000" : "#386015" }}>
                        {snap.balance > 0 ? `+${snap.balance}` : snap.balance}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider"
                          style={{
                            background: isUnder ? "#FFE4E4" : isOver ? "#FBF3CC" : "#DFEFD1",
                            color: isUnder ? "#C32525" : isOver ? "#806B3C" : "#386015",
                          }}>
                          {isUnder ? "Sublicenciado" : isOver ? "Sobrerlicenciado" : "Em Conformidade"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right font-semibold text-[11px]">
                        {isUnder ? (
                          <span style={{ color: "#C32525" }}>{formatCurrency(snap.costImpact)}</span>
                        ) : isOver ? (
                          <span style={{ color: "#6E7070" }}>{formatCurrency(Math.abs(snap.costImpact))}</span>
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
