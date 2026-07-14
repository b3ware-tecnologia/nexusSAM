import { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import { 
  Laptop, 
  CheckCircle2, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Info,
  Layers,
  Monitor,
  Sparkles,
  Activity,
  ShieldCheck,
  Clock,
  ArrowRight,
  Zap,
  CheckCircle,
  X,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Filter,
  Building,
  CreditCard,
  Users,
  Percent,
  Award,
  ArrowUpRight,
  Calendar,
  Check
} from 'lucide-react';
import { CompanyData, License } from '../data-types';

interface OverviewViewProps {
  companyData: CompanyData;
  onNavigateToTab: (tab: any) => void;
  onReclaimLicense: (id: string) => void;
  searchQuery: string;
  savingsRealized?: number;
  onSetDeviceFilterQuery?: (query: string) => void;
}

export default function OverviewView({ 
  companyData, 
  onNavigateToTab, 
  onReclaimLicense,
  searchQuery,
  savingsRealized = 0,
  onSetDeviceFilterQuery
}: OverviewViewProps) {
  
  const licenses = companyData.licenses;
  const [ignoredIds, setIgnoredIds] = useState<string[]>([]);
  const [activeInsightIndex, setActiveInsightIndex] = useState(0);

  // Advanced Filters States
  const [selectedDept, setSelectedDept] = useState<string>('All');
  const [selectedVendor, setSelectedVendor] = useState<string>('All');
  const [selectedCC, setSelectedCC] = useState<string>('All');
  
  // Real-time Interactive Simulation States (to satisfy "atualização em tempo real")
  const [localReclaimedCount, setLocalReclaimedCount] = useState<number>(148);
  const [localReusedCount, setLocalReusedCount] = useState<number>(92);
  const [reclaimedUserIds, setReclaimedUserIds] = useState<string[]>([]);
  const [localSavingsRealized, setLocalSavingsRealized] = useState<number>(0);
  const [simulatedRenewals, setSimulatedRenewals] = useState<Record<string, boolean>>({});

  // Reset states when the active company changes
  useEffect(() => {
    setIgnoredIds([]);
    setActiveInsightIndex(0);
    setReclaimedUserIds([]);
    setLocalSavingsRealized(0);
    setLocalReclaimedCount(148);
    setLocalReusedCount(92);
    setSimulatedRenewals({});
  }, [companyData.id]);

  // Base computations
  const totalDispositivos = companyData.totalDispositivos || 0;
  const totalCusto = licenses.reduce((sum, lic) => sum + lic.custoMensal, 0);
  
  // Calculate dynamic compliance rate:
  const nonCompliantLicenses = licenses.filter(lic => lic.status === 'Não Conforme');
  const compliantCount = licenses.length - nonCompliantLicenses.length;
  const dynamicComplianceRate = licenses.length > 0 
    ? Math.round((compliantCount / licenses.length) * 100) 
    : 100;

  // Potential savings (un-optimized)
  const potencialEconomiaTotal = licenses.reduce((sum, lic) => sum + lic.potencialEconomia, 0);
  
  // Total Savings = Base Savings (12.450) + Realized in Session (from App.tsx) + Session local simulated actions
  const totalSavedMonthly = 12450 + savingsRealized + localSavingsRealized;
  const totalSavedAnnual = totalSavedMonthly * 12;

  // Format currency helper
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2
    }).format(value);
  };

  // 1. Interactive User Waste Data (Dynamic Action points)
  const initialUsersWithWaste = [
    { id: 'user-1', name: 'Rodrigo Santos', dept: 'Engenharia', cc: 'CC-ENG-05', software: 'AutoCAD 2024', waste: 3200, status: 'Sem uso há 90 dias', vendor: 'Autodesk' },
    { id: 'user-2', name: 'Mariana Costa', dept: 'Marketing', cc: 'CC-MKT-22', software: 'Adobe Creative Cloud', waste: 1250, status: 'Inativa há 45 dias', vendor: 'Adobe' },
    { id: 'user-3', name: 'Felipe Almeida', dept: 'Financeiro', cc: 'CC-FIN-12', software: 'Microsoft Project P3', waste: 900, status: 'Sem uso há 60 dias', vendor: 'Microsoft' },
    { id: 'user-4', name: 'Juliana Rocha', dept: 'TI', cc: 'CC-TI-99', software: 'Tableau Desktop', waste: 750, status: 'Inativa há 30 dias', vendor: 'Outros' },
    { id: 'user-5', name: 'Carlos Eduardo', dept: 'Operações', cc: 'CC-OP-01', software: 'Zoom Pro', waste: 250, status: 'Sem uso há 40 dias', vendor: 'Outros' }
  ];

  // Action: Reclaim / Liberar license for a user in real-time
  const handleReclaimUserLicense = (userId: string, wasteAmount: number) => {
    if (reclaimedUserIds.includes(userId)) return;
    setReclaimedUserIds(prev => [...prev, userId]);
    setLocalSavingsRealized(prev => prev + wasteAmount);
    setLocalReclaimedCount(prev => prev + 1);
    setLocalReusedCount(prev => prev + 1); // Automatically reused to next waiting list
  };

  // Filter lists based on Advanced Filters
  const isVendorMatch = (softwareVendor: string, filterVal: string) => {
    if (filterVal === 'All') return true;
    return softwareVendor.toLowerCase().includes(filterVal.toLowerCase());
  };

  const isDeptMatch = (userDept: string, filterVal: string) => {
    if (filterVal === 'All') return true;
    return userDept.toLowerCase() === filterVal.toLowerCase();
  };

  const isCCMatch = (userCC: string, filterVal: string) => {
    if (filterVal === 'All') return true;
    return userCC.toLowerCase() === filterVal.toLowerCase();
  };

  // Applied User Waste list
  const activeUsersWithWaste = initialUsersWithWaste.filter(u => 
    isVendorMatch(u.vendor, selectedVendor) &&
    isDeptMatch(u.dept, selectedDept) &&
    isCCMatch(u.cc, selectedCC)
  );

  // Dynamic calculations based on filters for metrics
  const activeLocalReclaimed = localReclaimedCount + (reclaimedUserIds.length * 3);
  const activeLocalReused = localReusedCount + (reclaimedUserIds.length * 2);
  const rawReutilizationRate = Math.round((activeLocalReused / (activeLocalReclaimed || 1)) * 100);
  const dynamicReutilizationRate = Math.min(100, Math.max(0, rawReutilizationRate));

  // Dynamic ROI of the project (Annualized Savings / Investment Setup Cost (R$ 45.000)) * 100
  const initialSetupCost = 45000;
  const dynamicROI = Math.round((totalSavedAnnual / initialSetupCost) * 100);

  // 2. Savings by Vendor Data (Calculated dynamically)
  const baseVendorSavings: Record<string, { spend: number; savings: number }> = {
    'Microsoft': { spend: 25700, savings: 4800 },
    'Adobe': { spend: 8650, savings: 3650 },
    'Autodesk': { spend: 9200, savings: 3200 },
    'Outros': { spend: 11400, savings: 5350 }
  };

  // Adjust savings with active interactive simulator inputs
  reclaimedUserIds.forEach(uId => {
    const userObj = initialUsersWithWaste.find(u => u.id === uId);
    if (userObj) {
      const vGroup = baseVendorSavings[userObj.vendor] ? userObj.vendor : 'Outros';
      baseVendorSavings[vGroup].savings += userObj.waste;
      baseVendorSavings[vGroup].spend -= userObj.waste;
    }
  });

  const vendorChartData = Object.keys(baseVendorSavings).map(vendor => {
    // Apply filters to chart values visually
    const multiplier = (selectedVendor === 'All' || selectedVendor.toLowerCase() === vendor.toLowerCase()) ? 1 : 0.15;
    return {
      name: vendor,
      'Gasto Mensal': Math.round(baseVendorSavings[vendor].spend * multiplier),
      'Economia Gerada': Math.round((baseVendorSavings[vendor].savings + (totalSavedMonthly * 0.1)) * multiplier)
    };
  }).filter(d => d['Gasto Mensal'] > 0 || d['Economia Gerada'] > 0);

  // 3. Savings by Department Data
  const baseDeptSavings: Record<string, number> = {
    'TI': 22400,
    'Engenharia': 18500,
    'Financeiro': 9300,
    'Marketing': 7200,
    'Operações': 4800
  };

  // Accumulate interactive actions
  reclaimedUserIds.forEach(uId => {
    const userObj = initialUsersWithWaste.find(u => u.id === uId);
    if (userObj && baseDeptSavings[userObj.dept] !== undefined) {
      baseDeptSavings[userObj.dept] += userObj.waste;
    }
  });

  const deptChartData = Object.keys(baseDeptSavings).map(dept => {
    const multiplier = (selectedDept === 'All' || selectedDept.toLowerCase() === dept.toLowerCase()) ? 1 : 0.2;
    return {
      name: dept,
      'Economia': Math.round(baseDeptSavings[dept] * multiplier)
    };
  }).filter(d => d.Economia > 0);

  // 4. Savings by Cost Center Data
  const baseCCSavings: Record<string, number> = {
    'CC-TI-99': 22400,
    'CC-ENG-05': 18500,
    'CC-FIN-12': 9300,
    'CC-MKT-22': 7200,
    'CC-OP-01': 4800
  };

  reclaimedUserIds.forEach(uId => {
    const userObj = initialUsersWithWaste.find(u => u.id === uId);
    if (userObj && baseCCSavings[userObj.cc] !== undefined) {
      baseCCSavings[userObj.cc] += userObj.waste;
    }
  });

  const ccChartData = Object.keys(baseCCSavings).map(cc => {
    const multiplier = (selectedCC === 'All' || selectedCC.toLowerCase() === cc.toLowerCase()) ? 1 : 0.2;
    return {
      name: cc,
      'Economia': Math.round(baseCCSavings[cc] * multiplier)
    };
  }).filter(d => d.Economia > 0);

  // 5. Software Usage: Most Used vs. Unused (Idle)
  const softwareUsageList = [
    { name: 'Microsoft 365 E5', total: 450, active: 450, idle: 0, usageRate: 100, cost: 18500 },
    { name: 'CrowdStrike Falcon', total: 250, active: 250, idle: 0, usageRate: 100, cost: 9200 },
    { name: 'Salesforce Sales Cloud', total: 50, active: 42, idle: 8, usageRate: 84, cost: 14500 },
    { name: 'Adobe Creative Cloud', total: 120, active: 78, idle: 42, usageRate: 65, cost: 2450 },
    { name: 'AutoCAD 2024', total: 40, active: 32, idle: 8, usageRate: 80, cost: 3200 },
    { name: 'Zoom Pro', total: 300, active: 180, idle: 120, usageRate: 60, cost: 2350 },
    { name: 'Microsoft Project P3', total: 50, active: 35, idle: 15, usageRate: 70, cost: 1800 },
    { name: 'Figma Enterprise', total: 60, active: 48, idle: 12, usageRate: 80, cost: 1550 }
  ];

  // Apply filters to software list
  const filteredSoftwareUsageList = softwareUsageList.filter(sw => {
    if (selectedVendor === 'All') return true;
    if (selectedVendor === 'Microsoft' && sw.name.toLowerCase().includes('microsoft')) return true;
    if (selectedVendor === 'Microsoft' && sw.name.toLowerCase().includes('project')) return true;
    if (selectedVendor === 'Adobe' && sw.name.toLowerCase().includes('adobe')) return true;
    if (selectedVendor === 'Autodesk' && sw.name.toLowerCase().includes('autocad')) return true;
    if (selectedVendor === 'Outros' && !sw.name.toLowerCase().includes('microsoft') && !sw.name.toLowerCase().includes('project') && !sw.name.toLowerCase().includes('adobe') && !sw.name.toLowerCase().includes('autocad')) return true;
    return false;
  });

  // Softwares mais utilizados (sorted by rate)
  const mostUsedSoftwares = [...filteredSoftwareUsageList].sort((a, b) => b.usageRate - a.usageRate);
  
  // Softwares sem uso / Ociosos (sorted by idle cost)
  const unusedSoftwares = [...filteredSoftwareUsageList]
    .filter(sw => sw.idle > 0)
    .map(sw => ({
      ...sw,
      idleCost: sw.idle * (sw.cost / sw.total)
    }))
    .sort((a, b) => b.idleCost - a.idleCost);

  // 6. Future renewals list (Próximos 12 meses)
  const initialFutureRenewals = [
    { id: 'ren-1', software: 'Microsoft 365 E5', date: '2027-10-01', value: 18500 * 12, status: 'Em Análise', daysLeft: 452 },
    { id: 'ren-2', software: 'Adobe Creative Cloud', date: '2027-01-15', value: 2450 * 12, status: 'Negociação Iniciada', daysLeft: 193 },
    { id: 'ren-3', software: 'CrowdStrike Falcon', date: '2026-12-15', value: 9200 * 12, status: 'Revisão Necessária', daysLeft: 162 },
    { id: 'ren-4', software: 'AutoCAD 2024', date: '2026-08-10', value: 3200 * 12, status: 'Não Conforme', daysLeft: 35 },
    { id: 'ren-5', software: 'Salesforce Sales Cloud', date: '2027-12-05', value: 14500 * 12, status: 'Planejado', daysLeft: 517 },
  ];

  const handleTriggerRenewSimulation = (id: string) => {
    setSimulatedRenewals(prev => ({
      ...prev,
      [id]: true
    }));
  };

  // Dynamic insights
  const allInsights = (() => {
    const list: Array<{
      id: string;
      title: string;
      text: string;
      type: 'cost' | 'compliance' | 'security' | 'contract';
      badge: string;
      targetTab: any;
      metric?: string;
    }> = [];

    if (potencialEconomiaTotal > 0) {
      list.push({
        id: 'insight-total-idle',
        title: 'Otimização de Custos Geral',
        text: `Identificamos um total de licenças ociosas na organização. A revogação imediata de assentos sem uso pode gerar uma economia anual de até ${formatCurrency(potencialEconomiaTotal * 12)} de forma recorrente.`,
        type: 'cost',
        badge: 'Redução de Custos',
        targetTab: 'otimizacao',
        metric: formatCurrency(potencialEconomiaTotal)
      });
    }

    const autoCadLic = licenses.find(l => l.softwareName.toLowerCase().includes('autocad'));
    if (autoCadLic && autoCadLic.status === 'Não Conforme') {
      list.push({
        id: 'insight-autocad-compliance',
        title: 'Risco Crítico de Auditoria',
        text: `Alerta: Detectamos que o software ${autoCadLic.softwareName} possui desvios graves de conformidade (instalações ativas sem licença de cobertura). Regularize para mitigar multas contratuais significativas.`,
        type: 'compliance',
        badge: 'Não Conforme',
        targetTab: 'conformidade',
        metric: 'Ação Requerida'
      });
    }

    const zoomLic = licenses.find(l => l.softwareName.toLowerCase().includes('zoom'));
    if (zoomLic && zoomLic.qtyOciosa > 0) {
      list.push({
        id: 'insight-zoom-idle',
        title: 'Inatividade Prolongada (Zoom Pro)',
        text: `Identificamos ${zoomLic.qtyOciosa} licenças de Zoom Pro sem nenhuma atividade registrada nos últimos 90 dias pelas contas dos colaboradores. Recomendamos rebaixamento imediato de tier.`,
        type: 'cost',
        badge: 'Inatividade',
        targetTab: 'otimizacao',
        metric: formatCurrency(zoomLic.potencialEconomia)
      });
    }

    const upcomingExp = licenses.find(l => l.expiryDate && new Date(l.expiryDate).getTime() < new Date('2027-02-01').getTime());
    if (upcomingExp) {
      list.push({
        id: 'insight-contract-expiration',
        title: 'Renovação de Contrato Próxima',
        text: `O contrato do software ${upcomingExp.softwareName} expira em ${upcomingExp.expiryDate}. Recomendamos iniciar o processo de renegociação com o fornecedor com pelo menos 60 dias de antecedência.`,
        type: 'contract',
        badge: 'Vencimento',
        targetTab: 'contratos',
        metric: upcomingExp.expiryDate
      });
    }

    return list;
  })();

  const activeInsights = allInsights.filter(ins => !ignoredIds.includes(ins.id));

  // Auto-rotating carousel: shifts every 12 seconds
  useEffect(() => {
    if (activeInsights.length <= 1) return;
    const timer = setInterval(() => {
      setActiveInsightIndex((prev) => (prev + 1) % activeInsights.length);
    }, 12000);
    return () => clearInterval(timer);
  }, [activeInsights.length, activeInsightIndex]);

  return (
    <div className="space-y-6 select-none animate-fade-in text-slate-800">
      
      {/* 2. 6-GRID BENTO BOX FOR REQUESTED CORE METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        
        {/* Metric 1: Economia Anual */}
        <div className="bg-white p-4 rounded-sm border border-slate-200 shadow-sm flex flex-col justify-between hover:border-[#00B551] transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-[9px] text-gray-500 font-bold uppercase tracking-wider">Economia Anual</span>
            <div className="p-1.5 bg-emerald-50 rounded text-[#00B551]">
              <Award size={14} />
            </div>
          </div>
          <div>
            <h3 className="font-headline text-lg font-black text-emerald-600 tracking-tight">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(totalSavedAnnual)}
            </h3>
            <span className="text-[10px] text-gray-400 font-medium">projetado (12 meses)</span>
          </div>
          <div className="mt-2 pt-1 border-t border-gray-100 flex items-center text-[9px] text-emerald-600 font-bold">
            <TrendingUp size={11} className="mr-0.5" />
            <span>Altamente Eficiente</span>
          </div>
        </div>

        {/* Metric 2: Economia Mensal */}
        <div className="bg-white p-4 rounded-sm border border-slate-200 shadow-sm flex flex-col justify-between hover:border-[#00B551] transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-[9px] text-gray-500 font-bold uppercase tracking-wider">Economia Mensal</span>
            <div className="p-1.5 bg-emerald-50 rounded text-[#00B551]">
              <DollarSign size={14} />
            </div>
          </div>
          <div>
            <h3 className="font-headline text-lg font-black text-gray-900 tracking-tight">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(totalSavedMonthly)}
            </h3>
            <span className="text-[10px] text-gray-400 font-medium">economia ativa recorrente</span>
          </div>
          <div className="mt-2 pt-1 border-t border-gray-100 flex items-center text-[9px] text-gray-500">
            <Zap size={11} className="text-amber-500 mr-0.5" />
            <span>Foco em Ociosidade</span>
          </div>
        </div>

        {/* Metric 3: Licenças Recuperadas */}
        <div className="bg-white p-4 rounded-sm border border-slate-200 shadow-sm flex flex-col justify-between hover:border-[#00B551] transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-[9px] text-gray-500 font-bold uppercase tracking-wider">Licenças Recuperadas</span>
            <div className="p-1.5 bg-emerald-50 rounded text-[#00B551]">
              <Laptop size={14} />
            </div>
          </div>
          <div>
            <h3 className="font-headline text-xl font-extrabold text-gray-900 tracking-tight">
              {activeLocalReclaimed}
            </h3>
            <span className="text-[10px] text-gray-400 font-medium">assentos devolvidos à TI</span>
          </div>
          <div className="mt-2 pt-1 border-t border-gray-100 flex items-center text-[9px] text-[#00B551] font-bold">
            <CheckCircle2 size={11} className="mr-0.5" />
            <span>+{reclaimedUserIds.length * 3} na sessão</span>
          </div>
        </div>

        {/* Metric 4: Licenças Reutilizadas */}
        <div className="bg-white p-4 rounded-sm border border-slate-200 shadow-sm flex flex-col justify-between hover:border-[#00B551] transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-[9px] text-gray-500 font-bold uppercase tracking-wider">Licenças Reutilizadas</span>
            <div className="p-1.5 bg-emerald-50 rounded text-[#00B551]">
              <Users size={14} />
            </div>
          </div>
          <div>
            <h3 className="font-headline text-xl font-extrabold text-gray-900 tracking-tight">
              {activeLocalReused}
            </h3>
            <span className="text-[10px] text-gray-400 font-medium">reatribuídas para novos usuários</span>
          </div>
          <div className="mt-2 pt-1 border-t border-gray-100 flex items-center text-[9px] text-gray-500">
            <span>Evitou novas compras</span>
          </div>
        </div>

        {/* Metric 5: Taxa de Reutilização */}
        <div className="bg-white p-4 rounded-sm border border-slate-200 shadow-sm flex flex-col justify-between hover:border-[#00B551] transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-[9px] text-gray-500 font-bold uppercase tracking-wider">Taxa Reutilização</span>
            <div className="p-1.5 bg-emerald-50 rounded text-[#00B551]">
              <Percent size={14} />
            </div>
          </div>
          <div>
            <h3 className="font-headline text-xl font-extrabold text-gray-900 tracking-tight">
              {dynamicReutilizationRate}%
            </h3>
            <span className="text-[10px] text-gray-400 font-medium">índice de reaproveitamento</span>
          </div>
          <div className="mt-2 pt-1 border-t border-gray-100 flex items-center text-[9px] text-emerald-600 font-bold">
            <span>Meta corporativa: 75%</span>
          </div>
        </div>

        {/* Metric 6: ROI do Projeto */}
        <div className="bg-white p-4 rounded-sm border border-slate-200 shadow-sm flex flex-col justify-between hover:border-[#00B551] transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-[9px] text-gray-500 font-bold uppercase tracking-wider">ROI do Projeto</span>
            <div className="p-1.5 bg-[#00B551]/15 rounded text-[#00B551]">
              <Activity size={14} />
            </div>
          </div>
          <div>
            <h3 className="font-headline text-xl font-black text-[#00B551] tracking-tight">
              {dynamicROI}%
            </h3>
            <span className="text-[10px] text-gray-400 font-medium">retorno sobre investimento</span>
          </div>
          <div className="mt-2 pt-1 border-t border-gray-100 flex items-center text-[9px] text-gray-500">
            <span>Setup: R$ 45k único</span>
          </div>
        </div>

      </div>

      {/* 3. COMPLIANCE & NÃO CONFORMIDADES QUICK OVERVIEW BANNER */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Compliance Rate Banner */}
        <div 
          onClick={() => onNavigateToTab('conformidade')}
          className="bg-white p-4 rounded-sm border border-slate-200 shadow-sm flex items-center justify-between cursor-pointer hover:border-[#00B551] transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-50 rounded-lg text-[#00B551]">
              <ShieldCheck size={24} />
            </div>
            <div>
              <span className="font-mono text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Compliance de Licenciamento</span>
              <h4 className="text-xl font-black text-gray-900 font-headline">{dynamicComplianceRate}% de Conformidade</h4>
              <p className="text-xs text-gray-500">Inventário total auditado com a base global de software da Flexera</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-[#00B551] font-bold text-xs">
            <span>Verificar</span>
            <ArrowRight size={14} />
          </div>
        </div>

        {/* Não Conformidades Card */}
        <div 
          onClick={() => onNavigateToTab('alertas')}
          className="bg-white p-4 rounded-sm border border-slate-200 shadow-sm flex items-center justify-between cursor-pointer hover:border-red-500 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-50 rounded-lg text-red-500">
              <AlertTriangle size={24} />
            </div>
            <div>
              <span className="font-mono text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Não Conformidades Ativas</span>
              <h4 className="text-xl font-black text-red-600 font-headline">{nonCompliantLicenses.length} Desvios de Compliance</h4>
              <p className="text-xs text-gray-500">Instalações não cobertas por contratos válidos registradas</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-red-600 font-bold text-xs">
            <span>Regularizar</span>
            <ArrowRight size={14} />
          </div>
        </div>
      </div>

      {/* GEMINI INSIGHTS CAROUSEL */}
      <div className="bg-white rounded-sm border-l-[4px] border-[#00B551] border-t border-r border-b border-slate-200 p-5 shadow-sm relative overflow-hidden transition-all duration-300">
        {activeInsights.length === 0 ? (
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 py-4 animate-fade-in">
            <div className="space-y-2 max-w-xl">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-[#00B551]/10 rounded-md">
                  <CheckCircle size={16} className="text-[#00B551]" />
                </div>
                <h4 className="font-mono text-xs font-black uppercase tracking-widest text-[#00B551]">
                  Tudo Sob Controle
                </h4>
              </div>
              <h3 className="font-headline text-lg font-bold text-gray-900">
                Todos os insights foram revisados!
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Parabéns! Sua governança de software está operando com máxima eficiência. Todas as recomendações geradas pela IA do NexusSAM foram respondidas.
              </p>
            </div>
            <div className="shrink-0">
              <button
                onClick={() => {
                  setIgnoredIds([]);
                  setActiveInsightIndex(0);
                }}
                className="px-5 py-3 bg-white hover:bg-gray-50 text-[#00B551] rounded-xl font-sans text-xs font-bold shadow-sm transition-all active:scale-95 flex items-center gap-2 cursor-pointer border border-gray-200"
              >
                <RefreshCw size={14} className="animate-spin-slow" />
                Restaurar Insights
              </button>
            </div>
          </div>
        ) : (
          (() => {
            const safeIndex = activeInsightIndex >= activeInsights.length ? 0 : activeInsightIndex;
            const currentInsight = activeInsights[safeIndex];

            let badgeBg = "bg-amber-50 text-amber-700 border border-amber-200";
            if (currentInsight.type === 'compliance') badgeBg = "bg-rose-50 text-rose-700 border border-rose-200";
            if (currentInsight.type === 'security') badgeBg = "bg-red-50 text-red-700 border border-red-200";
            if (currentInsight.type === 'cost') badgeBg = "bg-emerald-50 text-emerald-700 border border-emerald-200";

            return (
              <div className="space-y-4 animate-fade-in" key={currentInsight.id}>
                <div className="flex items-center justify-between gap-4 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-[#00B551]/10 rounded-md">
                      <Sparkles size={16} className="text-[#00B551]" />
                    </div>
                    <span className="font-mono text-[10px] font-black uppercase tracking-widest text-[#00B551]">
                      NexusSAM AI Insights
                    </span>
                    <span className={`px-2.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider ${badgeBg}`}>
                      {currentInsight.badge}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg p-1">
                    <button
                      onClick={() => {
                        setActiveInsightIndex((prev) => (prev === 0 ? activeInsights.length - 1 : prev - 1));
                      }}
                      className="p-1 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded transition-all cursor-pointer"
                      title="Insight Anterior"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span className="text-[10px] font-mono font-bold px-1.5 min-w-[45px] text-center text-gray-600">
                      {safeIndex + 1} / {activeInsights.length}
                    </span>
                    <button
                      onClick={() => {
                        setActiveInsightIndex((prev) => (prev === activeInsights.length - 1 ? 0 : prev + 1));
                      }}
                      className="p-1 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded transition-all cursor-pointer"
                      title="Próximo Insight"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                  <div className="md:col-span-12 space-y-2">
                    <h3 className="font-headline text-base font-bold text-gray-900 tracking-tight leading-snug">
                      {currentInsight.title}
                    </h3>
                    <p className="text-xs text-gray-600 leading-relaxed font-sans font-medium">
                      {currentInsight.text}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4 mt-1">
                  <button
                    onClick={() => {
                      setIgnoredIds((prev) => [...prev, currentInsight.id]);
                      if (safeIndex >= activeInsights.length - 1) {
                        setActiveInsightIndex(Math.max(0, activeInsights.length - 2));
                      }
                    }}
                    className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-500 hover:text-gray-950 border border-gray-200 rounded-xl font-sans text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                  >
                    <X size={14} />
                    Ignorar
                  </button>
                  <button
                    onClick={() => onNavigateToTab(currentInsight.targetTab)}
                    className="px-5 py-2 bg-[#00B551] hover:bg-[#00cd5c] text-white rounded-xl font-sans text-xs font-black shadow-sm hover:shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer border border-[#00B551]"
                  >
                    Ver Detalhes
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            );
          })()
        )}
      </div>

      {/* 4. DYNAMIC INTERACTIVE RECHARTS BLOCK */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Hand: Grouped Bar Chart "Economia e Gasto por Fabricante" */}
        <div className="lg:col-span-8 bg-white p-5 rounded-sm border border-slate-200 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
            <div>
              <h4 className="font-mono text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                Gasto vs. Economia por Fabricante
              </h4>
              <p className="text-[11px] text-gray-400">Comparativo mensal do investimento de software ativo contra as economias obtidas</p>
            </div>
            <div className="flex gap-4 text-xs">
              <span className="flex items-center gap-1.5 font-medium text-gray-600">
                <span className="w-2.5 h-2.5 rounded bg-slate-300"></span> Gasto
              </span>
              <span className="flex items-center gap-1.5 font-medium text-[#00B551]">
                <span className="w-2.5 h-2.5 rounded bg-[#00B551]"></span> Economia
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={vendorChartData}
                margin={{ top: 10, right: 10, left: -10, bottom: 5 }}
                barSize={24}
              >
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'Inter' }} 
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fill: '#64748b', fontSize: 10 }}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickLine={false}
                  tickFormatter={(v) => `R$ ${v / 1000}k`}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(0, 181, 81, 0.02)' }}
                  formatter={(value, name) => [
                    `R$ ${Number(value).toLocaleString('pt-BR')}`, 
                    name
                  ]}
                  contentStyle={{ 
                    backgroundColor: '#ffffff', 
                    borderColor: '#e2e8f0', 
                    borderRadius: '8px',
                    color: '#1e293b',
                    fontSize: '11px',
                    fontFamily: 'Inter'
                  }}
                />
                <Bar dataKey="Gasto Mensal" fill="#cbd5e1" radius={[4, 4, 0, 0]} name="Gasto Ativo" />
                <Bar dataKey="Economia Gerada" fill="#00B551" radius={[4, 4, 0, 0]} name="Economia Obtida" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Hand: Pie Chart "Economia por Centro de Custo" */}
        <div className="lg:col-span-4 bg-white p-5 rounded-sm border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="font-mono text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">
              Economia por Centro de Custo
            </h4>
            <p className="text-[11px] text-gray-400">Fatia das reduções de custos obtidas por Centro de Custo contábil</p>
          </div>

          <div className="h-44 w-full relative flex items-center justify-center my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={ccChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={65}
                  paddingAngle={3}
                  dataKey="Economia"
                >
                  {ccChartData.map((entry, index) => {
                    const colors = ['#00B551', '#34d399', '#6ee7b7', '#059669', '#3b82f6'];
                    return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                  })}
                </Pie>
                <Tooltip 
                  formatter={(value) => [`R$ ${Number(value).toLocaleString('pt-BR')}`, 'Economia']}
                  contentStyle={{ 
                    backgroundColor: '#ffffff', 
                    borderColor: '#e2e8f0', 
                    borderRadius: '8px',
                    fontSize: '11px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            
            <div className="absolute flex flex-col items-center">
              <span className="text-[9px] font-mono text-gray-400 uppercase font-bold">Total</span>
              <span className="text-sm font-black text-slate-800">{formatCurrency(totalSavedMonthly).split(',')[0]}</span>
            </div>
          </div>

          {/* CC breakdown list */}
          <div className="space-y-1.5 pt-2 border-t border-slate-50 text-[11px]">
            {ccChartData.slice(0, 4).map((entry, idx) => {
              const colors = ['bg-[#00B551]', 'bg-[#34d399]', 'bg-[#6ee7b7]', 'bg-[#059669]'];
              return (
                <div key={idx} className="flex justify-between items-center">
                  <div className="flex items-center gap-1.5 text-gray-600 font-medium">
                    <span className={`w-2 h-2 rounded-full ${colors[idx % colors.length]}`} />
                    <span>{entry.name}</span>
                  </div>
                  <span className="font-mono font-bold text-gray-900">R$ {entry.Economia.toLocaleString('pt-BR')}</span>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* 5. DYNAMIC COST CENTER CHART & SOFTWARE USAGE PAIRING */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Horizontal Bar Chart "Economia por Departamento" */}
        <div className="lg:col-span-6 bg-white p-5 rounded-sm border border-slate-200 shadow-sm">
          <div>
            <h4 className="font-mono text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">
              Economia por Departamento
            </h4>
            <p className="text-[11px] text-gray-400">Detalhamento financeiro das economias imputadas a cada departamento / setor da empresa</p>
          </div>

          <div className="h-64 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={deptChartData}
                margin={{ top: 10, right: 10, left: 20, bottom: 5 }}
                barSize={16}
              >
                <XAxis type="number" tick={{ fontSize: 9 }} tickFormatter={(v) => `R$ ${v/1000}k`} axisLine={{ stroke: '#e2e8f0' }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: '#475569' }} axisLine={{ stroke: '#e2e8f0' }} />
                <Tooltip 
                  formatter={(value) => [`R$ ${Number(value).toLocaleString('pt-BR')}`, 'Economia']}
                  contentStyle={{ fontSize: '11px' }}
                />
                <Bar dataKey="Economia" fill="#00B551" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Column: Softwares Mais Utilizados vs. Sem Uso (Ociosos) */}
        <div className="lg:col-span-6 bg-white p-5 rounded-sm border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="font-mono text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">
              Softwares Mais Utilizados vs. Ociosos (Sem Uso)
            </h4>
            <p className="text-[11px] text-gray-400">Eficiência de uso de licenças comparando taxa de atribuição contra desperdício de inatividade</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
            
            {/* Top used softwares */}
            <div className="space-y-3">
              <span className="block text-[10px] font-mono font-bold text-[#00B551] uppercase border-b border-emerald-50 pb-1 flex items-center gap-1">
                <TrendingUp size={12} /> Mais Utilizados (% Uso)
              </span>
              <div className="space-y-2">
                {mostUsedSoftwares.slice(0, 4).map((sw, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-gray-700">
                      <span className="truncate max-w-[120px]" title={sw.name}>{sw.name}</span>
                      <span className="font-mono text-[#00B551]">{sw.usageRate}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                      <div className="bg-[#00B551] h-1.5 rounded-full" style={{ width: `${sw.usageRate}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Most wasted/unused softwares */}
            <div className="space-y-3">
              <span className="block text-[10px] font-mono font-bold text-red-500 uppercase border-b border-red-50 pb-1 flex items-center gap-1">
                <TrendingDown size={12} /> Sem Uso / Ociosos (Desperdício)
              </span>
              <div className="space-y-2">
                {unusedSoftwares.slice(0, 4).map((sw, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-gray-700">
                      <span className="truncate max-w-[120px]" title={sw.name}>{sw.name}</span>
                      <span className="font-mono text-red-600">R$ {Math.round(sw.idleCost).toLocaleString('pt-BR')}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                      <div 
                        className="bg-red-400 h-1.5 rounded-full" 
                        style={{ width: `${Math.min(100, (sw.idleCost / 5000) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-[11px] text-gray-500 font-medium">
            <span>Pool total de softwares: {filteredSoftwareUsageList.length} mapeados</span>
            <button 
              onClick={() => onNavigateToTab('otimizacao')}
              className="text-[#00B551] font-bold hover:underline cursor-pointer flex items-center gap-0.5"
            >
              Otimizar Pools <ArrowRight size={11} />
            </button>
          </div>
        </div>

      </div>

      {/* 6. BOTTOM SECTIONS: USUÁRIOS COM MAIOR DESPERDÍCIO (INTERACTION POINT) & RENOVAÇÕES FUTURAS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Users with Most Waste (Interactive Reclaiming Table) */}
        <div className="lg:col-span-7 bg-white rounded-sm border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-4 border-b border-slate-200 bg-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="text-[#00B551]" size={16} />
                <h4 className="font-mono text-[10px] text-slate-500 font-bold uppercase tracking-widest">Colaboradores com Maior Desperdício</h4>
              </div>
              <span className="text-[9px] font-mono font-bold bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded-sm uppercase">
                Ação Corretiva Imediata
              </span>
            </div>

            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 text-[9px] font-mono uppercase text-gray-500 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 font-bold">Colaborador</th>
                    <th className="px-4 py-3 font-bold">Software Ocioso</th>
                    <th className="px-4 py-3 font-bold">Desperdício Mensal</th>
                    <th className="px-4 py-3 font-bold text-center">Ação</th>
                  </tr>
                </thead>
                <tbody className="text-xs divide-y divide-gray-100">
                  {activeUsersWithWaste.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-gray-400 font-medium">
                        Nenhum colaborador localizado com desperdício pendente para estes filtros!
                      </td>
                    </tr>
                  ) : (
                    activeUsersWithWaste.map((user) => {
                      const isReclaimed = reclaimedUserIds.includes(user.id);
                      return (
                        <tr key={user.id} className={`hover:bg-slate-50/50 transition-colors ${isReclaimed ? 'bg-emerald-50/30' : ''}`}>
                          <td className="px-4 py-3">
                            <p className="font-semibold text-gray-900">{user.name}</p>
                            <p className="text-[9px] text-gray-400 font-mono">{user.dept} • {user.cc}</p>
                          </td>
                          <td className="px-4 py-3 font-medium text-gray-600">
                            <span className="truncate max-w-[150px] inline-block">{user.software}</span>
                            <span className="block text-[9px] text-amber-600 font-bold">{user.status}</span>
                          </td>
                          <td className="px-4 py-3 font-mono font-bold text-gray-900">
                            {isReclaimed ? (
                              <span className="text-emerald-600 line-through">R$ {user.waste.toLocaleString('pt-BR')}</span>
                            ) : (
                              <span className="text-red-500">R$ {user.waste.toLocaleString('pt-BR')}</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {isReclaimed ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-full font-bold animate-fade-in">
                                <Check size={11} /> Reclamado
                              </span>
                            ) : (
                              <button
                                onClick={() => handleReclaimUserLicense(user.id, user.waste)}
                                className="px-2.5 py-1 text-[10px] bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-black rounded-lg transition-all cursor-pointer active:scale-95"
                              >
                                Reaver & Reatribuir
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-3 bg-gray-50 border-t border-gray-100 text-center text-[10px] text-gray-500 font-medium">
            * Clicar em <strong>Reaver & Reatribuir</strong> desprovisonará a licença do usuário ocioso, alocará para a fila de espera e registrará a economia anual na mesma hora.
          </div>
        </div>

        {/* Future Renewals Card */}
        <div className="lg:col-span-5 bg-white rounded-sm border border-slate-200 shadow-sm flex flex-col justify-between overflow-hidden">
          <div>
            <div className="p-4 border-b border-slate-200 bg-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="text-[#00B551]" size={16} />
                <h4 className="font-mono text-[10px] text-slate-500 font-bold uppercase tracking-widest">Renovações Contratuais Futuras</h4>
              </div>
              <span className="text-[9px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-sm uppercase">
                Próximos 12 meses
              </span>
            </div>

            <div className="divide-y divide-gray-100">
              {initialFutureRenewals.map((ren) => {
                const isSimulated = simulatedRenewals[ren.id];
                return (
                  <div key={ren.id} className={`p-3.5 flex items-center justify-between text-xs transition-colors hover:bg-slate-50/50 ${isSimulated ? 'bg-blue-50/20' : ''}`}>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-gray-900">{ren.software}</span>
                        <span className={`px-1.5 py-0.5 text-[8px] font-extrabold rounded-full ${
                          ren.daysLeft < 60 ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-slate-50 text-gray-600 border border-gray-200'
                        }`}>
                          {ren.daysLeft} dias
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-400 font-mono">
                        Vencimento: {new Date(ren.date).toLocaleDateString('pt-BR')} • Anualizado: <strong className="text-gray-700">R$ {ren.value.toLocaleString('pt-BR')}</strong>
                      </p>
                    </div>

                    <div>
                      {isSimulated ? (
                        <span className="text-[10px] text-[#00B551] font-bold border border-[#00B551]/30 bg-emerald-50 px-2 py-1 rounded-md flex items-center gap-1 animate-fade-in">
                          <CheckCircle2 size={12} /> Negociação Ativa
                        </span>
                      ) : (
                        <button
                          onClick={() => handleTriggerRenewSimulation(ren.id)}
                          className="px-2 py-1 bg-white hover:bg-gray-50 border border-slate-200 rounded-md text-[10px] font-bold text-gray-600 transition-all cursor-pointer active:scale-95"
                        >
                          Negociar
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-3 bg-gray-50 border-t border-gray-200 text-center">
            <button 
              onClick={() => onNavigateToTab('contratos')}
              className="text-[11px] font-bold text-[#00B551] hover:text-[#00cd5c] flex items-center justify-center gap-1 mx-auto cursor-pointer"
            >
              Ver Todos os Contratos e SLAs
              <ArrowRight size={12} />
            </button>
          </div>
        </div>

      </div>

      {/* ALERTA DE CICLO DE VIDA (SNOW ATLAS) */}
      <div className="bg-amber-50 rounded-sm border-l-4 border-amber-500 border-t border-r border-b border-slate-200 p-4 text-xs text-slate-700 leading-relaxed flex items-start gap-3 shadow-sm mb-4">
        <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={18} />
        <div className="space-y-1">
          <p className="font-bold text-amber-900 font-headline flex items-center gap-1">
            <span>Alerta de Ciclo de Vida do Ativo (Snow Atlas Platform)</span>
            <span className="bg-amber-100 text-amber-800 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wider">Ação Recomendada</span>
          </p>
          <p className="text-slate-600">
            Baseado na inteligência do Snow Atlas, identificamos que o{' '}
            <strong 
              className="text-amber-950 font-black underline decoration-dashed hover:text-[#00B551] hover:decoration-solid cursor-pointer transition-all"
              onClick={() => {
                onSetDeviceFilterQuery?.('Windows Server 2012');
                onNavigateToTab('dispositivos');
              }}
              title="Clique para filtrar dispositivos com este Sistema Operacional"
            >
              Windows Server 2012 R2
            </strong>{' '}
            em 2 servidores e o{' '}
            <strong 
              className="text-amber-950 font-black underline decoration-dashed hover:text-[#00B551] hover:decoration-solid cursor-pointer transition-all"
              onClick={() => {
                onSetDeviceFilterQuery?.('Adobe Acrobat 2017');
                onNavigateToTab('dispositivos');
              }}
              title="Clique para filtrar dispositivos com este software instalado"
            >
              Adobe Acrobat 2017
            </strong>{' '}
            em 14 computadores atingiram a data limite de suporte do fabricante (End-of-Support). Recomenda-se planejar a migração de versão para evitar riscos de segurança severos e sanções contratuais de conformidade de TI.
          </p>
        </div>
      </div>

      {/* FOOTER METRIC NOTE */}
      <div className="bg-slate-50 rounded-sm border border-slate-200 p-4 text-xs text-slate-500 leading-relaxed flex items-start gap-2.5">
        <Info className="text-[#00B551] shrink-0 mt-0.5" size={16} />
        <div>
          <p className="font-semibold text-slate-700">Sobre os Módulos de Governança Híbrida do NexusSAM</p>
          <p className="mt-1">
            As métricas de economia, ROI e inventário são unificadas e atualizadas periodicamente com o catálogo global de inteligência de software da Flexera (Snow Atlas Platform). Toda otimização realizada no portal é sincronizada com os agentes locais em até 15 minutos.
          </p>
        </div>
      </div>

    </div>
  );
}
