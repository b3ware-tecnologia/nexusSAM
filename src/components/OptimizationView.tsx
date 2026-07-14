import React, { useState, useEffect } from 'react';
import { 
  TrendingDown, 
  CheckCircle, 
  XCircle, 
  HelpCircle, 
  Zap, 
  DollarSign,
  ShieldCheck,
  Brain,
  MessageSquare,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Percent,
  RefreshCw,
  Scale,
  Cloud,
  ChevronRight,
  Info,
  ShieldAlert,
  Coins
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  AreaChart, 
  Area, 
  CartesianGrid 
} from 'recharts';
import { CompanyData, License } from '../data-types';

interface OptimizationViewProps {
  companyData: CompanyData;
  onReclaimLicense: (id: string) => void;
  onCancelContract: (id: string) => void;
  savingsRealized: number;
}

// Interface for AI response
interface AICopilotResponse {
  executiveSummary: string;
  totalPotentialSavings: number;
  topRecommendations: Array<{
    title: string;
    software: string;
    gastoAtual: number;
    economiaEstimada: number;
    severity: 'high' | 'medium' | 'low';
    strategy: string;
  }>;
  quickWins: string[];
  negotiationTactics: string[];
}

export default function OptimizationView({
  companyData,
  onReclaimLicense,
  onCancelContract,
  savingsRealized
}: OptimizationViewProps) {
  
  const [activeSubTab, setActiveSubTab] = useState<'geral' | 'charts' | 'opportunities'>('geral');
  
  // AI Co-pilot states
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<AICopilotResponse | null>(null);

  // Local state for interactive downgrades/optimizations
  const [localOptimizedIds, setLocalOptimizedIds] = useState<string[]>([]);
  const [localSavings, setLocalSavings] = useState<number>(0);

  // All waste/idle licenses
  const idleLicenses = companyData.licenses.filter(
    lic => (lic.status === 'Ociosa' || lic.status === 'Não Conforme') && !localOptimizedIds.includes(lic.id)
  );

  // Total identified waste (the sum of potential savings remaining)
  const totalWasteRemaining = idleLicenses.reduce((sum, lic) => sum + lic.potencialEconomia, 0);

  // Combined real savings = global savings + local interactive simulation savings
  const combinedSavingsRealized = savingsRealized + localSavings;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Run AI optimization analysis
  const runAIEngine = async (customPrompt?: string) => {
    setAiLoading(true);
    setAiError(null);
    try {
      const response = await fetch('/api/optimize-assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          companyData: companyData,
          prompt: customPrompt || aiPrompt
        })
      });

      if (!response.ok) {
        throw new Error('Falha ao obter resposta do assistente de inteligência artificial.');
      }

      const data = await response.json();
      setAiResult(data);
    } catch (err: any) {
      console.error(err);
      setAiError(err.message || 'Erro inesperado ao consultar a IA do Flexera Snow.');
    } finally {
      setAiLoading(false);
    }
  };

  // Trigger default audit on load or sub-tab click
  useEffect(() => {
    if (!aiResult) {
      runAIEngine('Fazer auditoria completa e estruturar plano de redução de custos de software.');
    }
  }, [companyData.id]);

  // Local helper for simulated downgrade action
  const handleSimulateDowngrade = (licId: string, softwareName: string, economia: number) => {
    setLocalOptimizedIds(prev => [...prev, licId]);
    setLocalSavings(prev => prev + economia);
    alert(`Sucesso! Efetuado o downgrade estratégico de ${softwareName}. R$ ${economia.toLocaleString('pt-BR')} adicionados à Economia Realizada.`);
  };

  // Preparing charts data
  // 1. Waste by Vendor Chart
  const vendorWasteMap: Record<string, number> = {};
  idleLicenses.forEach(lic => {
    const vendor = lic.vendor || 'Outros';
    vendorWasteMap[vendor] = (vendorWasteMap[vendor] || 0) + lic.potencialEconomia;
  });
  const vendorWasteData = Object.entries(vendorWasteMap).map(([name, value]) => ({
    name,
    value
  })).filter(item => item.value > 0);

  const VENDOR_COLORS: Record<string, string> = {
    'Microsoft': '#0078D4',
    'Adobe': '#FF0000',
    'Autodesk': '#FF7F00',
    'Outros': '#6b7280'
  };

  // 2. Gasto vs. Uso Efetivo
  const costVsUseData = companyData.licenses.map(lic => {
    const totalCost = lic.custoMensal || 0;
    const waste = lic.potencialEconomia || 0;
    const effectiveUse = Math.max(0, totalCost - waste);
    return {
      name: lic.softwareName.length > 20 ? lic.softwareName.substring(0, 18) + '...' : lic.softwareName,
      'Gasto Contratado': totalCost,
      'Uso Efetivo': effectiveUse,
      'Desperdício': waste
    };
  }).slice(0, 7); // Limita para caber no gráfico

  // 3. Savings Potential by Category
  const categorySavingsMap: Record<string, number> = {};
  companyData.licenses.forEach(lic => {
    const cat = lic.category || 'Outros';
    categorySavingsMap[cat] = (categorySavingsMap[cat] || 0) + (lic.potencialEconomia || 0);
  });
  const categorySavingsData = Object.entries(categorySavingsMap).map(([name, value]) => ({
    name,
    'Economia': value
  })).filter(item => item['Economia'] > 0);

  // 4. Projeção de Economia Acumulada em 12 Meses
  const monthlyProjectionData = Array.from({ length: 12 }, (_, i) => {
    const monthName = ['Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez', 'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'][i];
    const accumulated = combinedSavingsRealized + (totalWasteRemaining * (i + 1));
    return {
      month: monthName,
      'Economia Acumulada': accumulated,
      'Economia Corrente': combinedSavingsRealized
    };
  });

  return (
    <div className="space-y-6 select-none animate-fade-in font-sans">
      
      {/* Dynamic Header */}
      <div className="bg-gradient-to-r from-[#0B1320] to-[#1C2538] p-6 rounded-sm border border-[#1C2538] flex flex-col md:flex-row md:items-center justify-between gap-4 text-white">
        <div className="space-y-1">
          <span className="text-[10px] bg-[#00B551]/20 text-[#00B551] font-mono font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border border-[#00B551]/30 inline-block mb-1">
            FLEXERA SNOW ORACLE
          </span>
          <h2 className="font-headline text-xl md:text-2xl font-bold tracking-tight">Otimização Financeira Inteligente</h2>
          <p className="text-xs text-slate-400 max-w-2xl">
            Reduza custos redundantes, consolide shadow IT e recupere licenças ociosas de forma assistida por algoritmos preditivos e inteligência artificial generativa.
          </p>
        </div>
        
        {/* Dynamic AI Status Pill */}
        <div className="bg-[#111c30] p-3 rounded border border-[#2d3a4f] flex items-center gap-3 shrink-0 self-start md:self-center">
          <div className="p-2 bg-[#00B551]/10 text-[#00B551] rounded">
            <Brain size={20} className="animate-pulse" />
          </div>
          <div>
            <span className="text-[9px] text-slate-400 block font-semibold uppercase tracking-wider">AI Copilot</span>
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-[#00B551] rounded-full inline-block animate-ping"></span>
              Sistemas Otimizados
            </span>
          </div>
        </div>
      </div>

      {/* Top Banner metrics: Remaining Waste & Session Savings */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* Identified Waste */}
        <div className="bg-white p-5 rounded-sm border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3.5 bg-amber-50 rounded text-amber-600 border border-amber-100 shrink-0">
            <TrendingDown size={24} />
          </div>
          <div>
            <span className="font-mono text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Desperdício Ativo</span>
            <span className="font-headline text-xl font-black text-slate-900 block">
              {formatCurrency(totalWasteRemaining)}
            </span>
            <span className="text-[10px] text-amber-600 font-semibold block mt-0.5">
              Ação necessária imediata
            </span>
          </div>
        </div>

        {/* Realized Session Savings */}
        <div className="bg-white p-5 rounded-sm border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow border-l-[3px] border-l-[#00B551]">
          <div className="p-3.5 bg-emerald-50 rounded text-emerald-600 border border-emerald-100 shrink-0">
            <Zap size={24} className="animate-bounce" />
          </div>
          <div>
            <span className="font-mono text-[9px] text-emerald-700 font-bold uppercase tracking-wider block">Economia Realizada</span>
            <span className="font-headline text-xl font-black text-[#00B551] block">
              {formatCurrency(combinedSavingsRealized)}
            </span>
            <span className="text-[10px] text-emerald-700 font-semibold block mt-0.5">
              {combinedSavingsRealized > 0 ? "Impacto financeiro imediato!" : "Nenhuma ação efetuada"}
            </span>
          </div>
        </div>

        {/* Annualized Projection */}
        <div className="bg-white p-5 rounded-sm border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3.5 bg-blue-50 rounded text-blue-600 border border-blue-100 shrink-0">
            <Coins size={24} />
          </div>
          <div>
            <span className="font-mono text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Economia Anualizada</span>
            <span className="font-headline text-xl font-black text-slate-900 block">
              {formatCurrency((combinedSavingsRealized + totalWasteRemaining) * 12)}
            </span>
            <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">
              Projeção de ROI em 12 meses
            </span>
          </div>
        </div>

        {/* SAM Optimization ROI */}
        <div className="bg-white p-5 rounded-sm border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3.5 bg-slate-50 rounded text-slate-700 border border-slate-200 shrink-0">
            <Scale size={24} />
          </div>
          <div>
            <span className="font-mono text-[9px] text-slate-500 font-bold uppercase tracking-wider block">ROI de Otimização</span>
            <span className="font-headline text-xl font-black text-slate-900 block">
              {companyData.custoMensalTotal > 0 
                ? `${((combinedSavingsRealized / companyData.custoMensalTotal) * 100).toFixed(1)}%` 
                : "0.0%"}
            </span>
            <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">
              Do orçamento total de TI
            </span>
          </div>
        </div>

      </div>

      {/* Info Callout for Monthly vs Annual License/Cloud Metrics */}
      <div className="bg-amber-50/70 border border-amber-200/80 p-4 rounded-sm flex items-start gap-3 text-xs leading-relaxed text-amber-900 shadow-sm animate-fade-in">
        <Info size={16} className="text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-amber-950 block text-[11px] uppercase tracking-wide font-mono">Controle de Contratos: Mensal vs Anual</span>
          <p>
            Métricas de economia podem ser dimensionadas de forma <strong>mensal</strong> ou <strong>anual</strong>. Normalmente, contratos de licenciamento corporativos de fabricantes tradicionais (como Microsoft EA, Adobe ou Oracle) são de periodicidade <strong>anual</strong>. Porém, faturamento de ativos em nuvem e SaaS são contabilizados em base <strong>mensal</strong> (mesmo possuindo contrato anual, o que permite aumentar a quantidade de recursos sob demanda de pico, mas não reduzir/fazer downgrade unilateralmente até o aniversário de renovação contratual).
          </p>
        </div>
      </div>

      {/* Subsection Tab Menu */}
      <div className="border-b border-slate-200 flex flex-wrap gap-2">
        <button
          onClick={() => setActiveSubTab('geral')}
          className={`px-4 py-2 text-xs font-bold tracking-wide uppercase border-b-2 transition-all cursor-pointer ${
            activeSubTab === 'geral' 
              ? 'border-[#00B551] text-slate-900 bg-white shadow-xs rounded-t-sm' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Análise Geral & Recomendações
        </button>
        <button
          onClick={() => setActiveSubTab('charts')}
          className={`px-4 py-2 text-xs font-bold tracking-wide uppercase border-b-2 transition-all cursor-pointer ${
            activeSubTab === 'charts' 
              ? 'border-[#00B551] text-slate-900 bg-white shadow-xs rounded-t-sm' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Gráficos Inteligentes de Economia
        </button>
        <button
          onClick={() => setActiveSubTab('opportunities')}
          className={`px-4 py-2 text-xs font-bold tracking-wide uppercase border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'opportunities' 
              ? 'border-[#00B551] text-slate-900 bg-white shadow-xs rounded-t-sm' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Todas as Oportunidades ({idleLicenses.length})
        </button>
      </div>

      {/* Sub-tab 1: Geral & Recomendações */}
      {activeSubTab === 'geral' && (
        <div className="space-y-6">
          
          {/* Main Quick Wins & Dynamic Executive Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* AI Executive Card */}
            <div className="lg:col-span-2 bg-[#0B1320] text-white p-6 rounded-sm border border-[#1C2538] flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-[#00B551]">
                  <Sparkles size={18} />
                  <span className="text-[10px] font-mono font-bold tracking-wider uppercase">Sumário Executivo IA</span>
                </div>
                <h3 className="font-headline text-lg font-bold text-white">Diagnosticado: Potencial Crítico de Economia</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {aiResult ? aiResult.executiveSummary : `Nossos diagnósticos em tempo real identificaram ${idleLicenses.length} licenças de software redundantes ou ociosas. A revogação imediata dessas assinaturas e o rightsizing do inventário cloud podem reduzir a despesa operacional mensal em até R$ ${totalWasteRemaining.toLocaleString('pt-BR')}, atingindo uma eficiência financeira imediata.`}
                </p>
              </div>

              {aiResult && (
                <div className="pt-4 border-t border-[#1C2538] grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 bg-[#111c30] rounded border border-[#2d3a4f]">
                    <span className="block text-slate-400 text-[9px] uppercase font-bold tracking-wide mb-1">Ação Recomendada de Maior Impacto</span>
                    <strong className="text-white block truncate">{aiResult.topRecommendations[0]?.title || 'Racionalização Geral'}</strong>
                    <span className="text-emerald-500 font-mono font-bold">Economia: R$ {aiResult.topRecommendations[0]?.economiaEstimada.toLocaleString('pt-BR')}</span>
                  </div>
                  <div className="p-3 bg-[#111c30] rounded border border-[#2d3a4f]">
                    <span className="block text-slate-400 text-[9px] uppercase font-bold tracking-wide mb-1">Tática de Negociação de Elite</span>
                    <p className="text-[10px] text-slate-300 line-clamp-2">{aiResult.negotiationTactics[0] || 'Análise de uso efetivo antes da renovação.'}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Wins Right Panel */}
            <div className="bg-white p-5 rounded-sm border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-1.5 text-[#0B1320] font-bold">
                  <Zap size={16} className="text-emerald-600" />
                  <h3 className="text-xs uppercase tracking-wider">Ações Recomendadas (Quick Wins)</h3>
                </div>
                <div className="space-y-2">
                  {aiResult ? (
                    aiResult.quickWins.slice(0, 4).map((win, idx) => (
                      <div key={idx} className="flex gap-2 items-start text-xs text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-100">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full shrink-0 mt-1.5"></span>
                        <p>{win}</p>
                      </div>
                    ))
                  ) : (
                    <>
                      <div className="flex gap-2 items-start text-xs text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-100">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full shrink-0 mt-1.5"></span>
                        <p>Revogar licenças ociosas de Microsoft 365 que não registram logins nos últimos 90 dias.</p>
                      </div>
                      <div className="flex gap-2 items-start text-xs text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-100">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full shrink-0 mt-1.5"></span>
                        <p>Efetuar o downgrade do pacote Adobe Creative Cloud para usuários com uso exclusivo de Photoshop.</p>
                      </div>
                      <div className="flex gap-2 items-start text-xs text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-100">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full shrink-0 mt-1.5"></span>
                        <p>Consolidar assinaturas sobrepostas de colaboração (Slack vs Microsoft Teams).</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
              <button
                onClick={() => setActiveSubTab('opportunities')}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
              >
                Executar Otimizações <ArrowRight size={13} />
              </button>
            </div>

          </div>

          {/* Golden Opportunities Cards (Interactive simulated downgrades) */}
          <div className="space-y-4">
            <h3 className="font-headline text-md font-bold text-slate-900">⚡ Oportunidades Recomendadas de Redução Contratual (Simulador)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Card 1: Downgrade de Tier */}
              <div className="bg-white p-5 rounded-sm border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-[#0B1320] font-bold text-xs uppercase tracking-wider">
                    <Scale size={15} className="text-blue-600" />
                    <span>Ajuste de Plano / Downgrade</span>
                  </div>
                  <h4 className="font-headline text-md font-bold text-slate-800">Microsoft 365 E5 para E3</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Identificamos que 32 colaboradores possuem o plano Microsoft 365 E5, mas não utilizam recursos de segurança avançada nem PowerBI Pro incluídos. O downgrade para M365 E3 reduz o custo por usuário em 40%.
                  </p>
                  <div className="bg-blue-50/50 p-2.5 rounded border border-blue-100 text-xs flex justify-between font-mono">
                    <span className="text-slate-600">Economia Estimada:</span>
                    <strong className="text-blue-700">R$ 1.920,00/mês</strong>
                  </div>
                </div>
                <button
                  disabled={localOptimizedIds.includes('m365-down')}
                  onClick={() => handleSimulateDowngrade('m365-down', 'Microsoft 365 E5 para E3', 1920)}
                  className={`w-full py-2 rounded text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    localOptimizedIds.includes('m365-down')
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200'
                  }`}
                >
                  <CheckCircle size={14} />
                  {localOptimizedIds.includes('m365-down') ? 'Downgrade Aplicado' : 'Aplicar Downgrade'}
                </button>
              </div>

              {/* Card 2: Consolidação SaaS */}
              <div className="bg-white p-5 rounded-sm border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-[#0B1320] font-bold text-xs uppercase tracking-wider">
                    <MessageSquare size={15} className="text-[#00B551]" />
                    <span>Consolidação de Shadow IT</span>
                  </div>
                  <h4 className="font-headline text-md font-bold text-slate-800">Miro vs Mural (Colaboração)</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Identificamos licenças corporativas ativas de Miro no time de UX e Mural no time de Marketing. Consolidar todos os usuários sob o contrato do Miro economiza custos de redundância contratual imediata.
                  </p>
                  <div className="bg-emerald-50/50 p-2.5 rounded border border-emerald-100 text-xs flex justify-between font-mono">
                    <span className="text-slate-600">Economia Estimada:</span>
                    <strong className="text-emerald-700">R$ 1.150,00/mês</strong>
                  </div>
                </div>
                <button
                  disabled={localOptimizedIds.includes('miro-mural')}
                  onClick={() => handleSimulateDowngrade('miro-mural', 'Consolidação Miro vs Mural', 1150)}
                  className={`w-full py-2 rounded text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    localOptimizedIds.includes('miro-mural')
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                  }`}
                >
                  <CheckCircle size={14} />
                  {localOptimizedIds.includes('miro-mural') ? 'Consolidado' : 'Consolidar Ferramentas'}
                </button>
              </div>

              {/* Card 3: Otimização de Instâncias Cloud */}
              <div className="bg-white p-5 rounded-sm border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-[#0B1320] font-bold text-xs uppercase tracking-wider">
                    <Cloud size={15} className="text-amber-600" />
                    <span>FinOps / Cloud Rightsizing</span>
                  </div>
                  <h4 className="font-headline text-md font-bold text-slate-800">Reduzir vCPU de SQL Server RDS</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Instâncias do AWS RDS SQL Server estão rodando com apenas 5% de utilização média. O rightsizing das instâncias (redução do tamanho do servidor virtual) trará economia contundente sobre as tarifas AWS e licenças Microsoft.
                  </p>
                  <div className="bg-amber-50/50 p-2.5 rounded border border-amber-100 text-xs flex justify-between font-mono">
                    <span className="text-slate-600">Economia Estimada:</span>
                    <strong className="text-amber-700">R$ 3.400,00/mês</strong>
                  </div>
                </div>
                <button
                  disabled={localOptimizedIds.includes('rds-sql-rightsize')}
                  onClick={() => handleSimulateDowngrade('rds-sql-rightsize', 'Rightsizing de SQL Server RDS', 3400)}
                  className={`w-full py-2 rounded text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    localOptimizedIds.includes('rds-sql-rightsize')
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : 'bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200'
                  }`}
                >
                  <CheckCircle size={14} />
                  {localOptimizedIds.includes('rds-sql-rightsize') ? 'Rightsizing Efetuado' : 'Rightsizing Imediato'}
                </button>
              </div>

            </div>
          </div>

        </div>
      )}



      {/* Sub-tab 3: Charts stage */}
      {activeSubTab === 'charts' && (
        <div className="space-y-6">
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Chart 1: Gasto vs Uso */}
            <div className="bg-white p-5 rounded-sm border border-slate-200 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">Custo Contratado vs. Uso Efetivo por Software</h4>
                <p className="text-[10px] text-slate-500 mt-0.5">Comparativo de desperdício (licenças ociosas) em relação ao orçamento real empregado.</p>
              </div>
              <div className="h-[260px]">
                {costVsUseData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={costVsUseData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 9 }} stroke="#94a3b8" />
                      <YAxis tick={{ fontSize: 9 }} stroke="#94a3b8" />
                      <Tooltip formatter={(value) => formatCurrency(value as number)} />
                      <Legend wrapperStyle={{ fontSize: 10 }} />
                      <Bar dataKey="Uso Efetivo" fill="#00B551" stackId="a" />
                      <Bar dataKey="Desperdício" fill="#f59e0b" stackId="a" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400">Sem dados para exibição</div>
                )}
              </div>
            </div>

            {/* Chart 2: Projected Savings */}
            <div className="bg-white p-5 rounded-sm border border-slate-200 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">Projeção de Economia Acumulada (12 Meses)</h4>
                <p className="text-[10px] text-slate-500 mt-0.5">Evolução do retorno financeiro em Reais caso todas as otimizações sejam implementadas.</p>
              </div>
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyProjectionData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00B551" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#00B551" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 9 }} stroke="#94a3b8" />
                    <YAxis tick={{ fontSize: 9 }} stroke="#94a3b8" />
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    <Area type="monotone" dataKey="Economia Acumulada" stroke="#00B551" strokeWidth={2} fillOpacity={1} fill="url(#colorSavings)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 3: Waste by Vendor */}
            <div className="bg-white p-5 rounded-sm border border-slate-200 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">Distribuição do Desperdício por Fabricante</h4>
                <p className="text-[10px] text-slate-500 mt-0.5">Foco de renegociação: Qual fabricante detém o maior volume de custo financeiro inativo.</p>
              </div>
              <div className="h-[260px] flex items-center justify-center">
                {vendorWasteData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={vendorWasteData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {vendorWasteData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={VENDOR_COLORS[entry.name] || '#6b7280'} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value as number)} />
                      <Legend wrapperStyle={{ fontSize: 10 }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-10 space-y-1">
                    <CheckCircle size={32} className="text-[#00B551] mx-auto" />
                    <p className="text-xs font-bold text-slate-700">Tudo otimizado!</p>
                    <p className="text-[10px] text-slate-400">Nenhum desperdício ativo para gerar o gráfico.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Chart 4: Savings Potential by Category */}
            <div className="bg-white p-5 rounded-sm border border-slate-200 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">Potencial de Economia por Categoria de Software</h4>
                <p className="text-[10px] text-slate-500 mt-0.5">Visão setorial das oportunidades financeiras mapeadas.</p>
              </div>
              <div className="h-[260px]">
                {categorySavingsData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart layout="vertical" data={categorySavingsData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 9 }} stroke="#94a3b8" />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} stroke="#94a3b8" />
                      <Tooltip formatter={(value) => formatCurrency(value as number)} />
                      <Bar dataKey="Economia" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400">Sem dados de desperdício ativos para estruturar as categorias.</div>
                )}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* Sub-tab 4: Opportunities list (The existing main table and list of optimization opportunities) */}
      {activeSubTab === 'opportunities' && (
        <div className="bg-white rounded-sm border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h3 className="font-headline text-md font-bold text-slate-900">Oportunidades de Otimização Mapeadas</h3>
              <p className="text-xs text-slate-500 mt-1">
                Abaixo estão listadas as licenças ociosas, subutilizadas ou não conformes com alto potencial de economia mensal.
              </p>
            </div>
            <span className="text-[10px] font-mono uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-sm font-bold">
              Sincronização Ativa
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {idleLicenses.length === 0 ? (
              <div className="p-10 text-center flex flex-col items-center justify-center space-y-3">
                <CheckCircle size={40} className="text-[#00B551]" />
                <h4 className="font-headline text-md font-bold text-slate-800">Nenhum Desperdício Ativo!</h4>
                <p className="text-xs text-slate-500 max-w-md">
                  Todas as licenças estão ativamente em uso por colaboradores credenciados, ou foram otimizadas com sucesso nesta sessão.
                </p>
              </div>
            ) : (
              idleLicenses.map((lic) => (
                <div 
                  key={lic.id} 
                  className="p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 hover:bg-slate-50 transition-colors border-l-[3px] border-l-transparent hover:border-l-[#00B551]"
                  id={`opt-item-${lic.id}`}
                >
                  {/* Left side: details */}
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-headline text-md font-bold text-slate-900">{lic.softwareName}</h4>
                      <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-sm font-bold">
                        {lic.category}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-sm font-black uppercase tracking-wide ${
                        lic.status === 'Não Conforme' 
                          ? 'bg-red-50 text-red-700 border border-red-100' 
                          : 'bg-amber-50 text-amber-700 border border-amber-100'
                      }`}>
                        {lic.status}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs text-slate-500">
                      <div>
                        <span className="block font-mono text-[9px] uppercase font-bold text-slate-400">Fabricante</span>
                        <span className="font-semibold text-slate-800">{lic.vendor}</span>
                      </div>
                      <div>
                        <span className="block font-mono text-[9px] uppercase font-bold text-slate-400">Licenças Ociosas</span>
                        <span className="font-bold text-slate-800">{lic.qtyOciosa || 'Todas'}</span>
                      </div>
                      <div>
                        <span className="block font-mono text-[9px] uppercase font-bold text-slate-400">Custo Contratado</span>
                        <span className="font-semibold text-slate-800">{formatCurrency(lic.custoMensal)} /mês</span>
                      </div>
                      <div>
                        <span className="block font-mono text-[9px] uppercase font-bold text-slate-400">Economia Potencial</span>
                        <span className="font-extrabold text-[#00B551]">{formatCurrency(lic.potencialEconomia)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right side: quick optimization buttons */}
                  <div className="flex flex-wrap items-center gap-3 lg:self-center shrink-0">
                    
                    {/* Reclaim: turn to Em Uso */}
                    <button
                      onClick={() => onReclaimLicense(lic.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-sm text-xs font-bold transition-all active:scale-95 cursor-pointer"
                      title="Alocar estas licenças ociosas para funcionários que solicitaram acesso"
                    >
                      <CheckCircle size={14} />
                      Reivindicar Licenças
                    </button>

                    {/* Cancel Contract: remove item completely */}
                    <button
                      onClick={() => {
                        if (confirm(`Deseja cancelar a assinatura e remover totalmente o contrato de ${lic.softwareName}? Esta ação gera economia imediata de ${formatCurrency(lic.custoMensal)}.`)) {
                          onCancelContract(lic.id);
                        }
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-sm text-xs font-bold transition-all active:scale-95 cursor-pointer"
                      title="Encerrar assinatura junto ao fabricante para eliminar o gasto totalmente"
                    >
                      <XCircle size={14} />
                      Cancelar Assinatura
                    </button>

                  </div>

                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Visual instructions on SAM recommendations */}
      <div className="bg-slate-50 border border-slate-200 rounded-sm p-5 flex flex-col md:flex-row gap-4 items-start">
        <HelpCircle className="text-[#00B551] shrink-0 mt-0.5" size={20} />
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Como funciona a Otimização Automática?</h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            <strong>Reivindicar Licenças:</strong> Reatribui licenças de usuários que não abriram o aplicativo nos últimos 90 dias para colaboradores que solicitaram uma nova instalação. Isso evita compras adicionais de licenças.
          </p>
          <p className="text-xs text-slate-600 leading-relaxed">
            <strong>Cancelar Assinatura:</strong> Encerra ou reduz o tier do contrato junto ao fornecedor (como Microsoft CSP ou Adobe VIP) para remover cobranças recorrentes. O valor total do contrato é subtraído do gasto mensal instantaneamente.
          </p>
        </div>
      </div>

    </div>
  );
}
