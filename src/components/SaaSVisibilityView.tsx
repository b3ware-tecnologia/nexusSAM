import { useState, useEffect } from 'react';
import { CompanyData } from '../data-types';
import { 
  Eye, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  Search, 
  RefreshCw, 
  SlidersHorizontal, 
  ArrowUpRight, 
  Users, 
  Zap, 
  Cloud, 
  Layers, 
  Lock, 
  Unlock, 
  Activity,
  Plus,
  Trash2,
  HelpCircle,
  ExternalLink,
  DollarSign
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';

interface SaaSVisibilityViewProps {
  companyData: CompanyData;
  onNavigateToTab: (tab: any) => void;
  searchQuery?: string;
}

// Interfaces for SaaS Visibility state - Using industry standard terminology in Brazil
interface SaaSApp {
  id: string;
  name: string;
  category: string;
  status: 'Aprovado' | 'Não Aprovado' | 'Sob Análise'; // Approved, Unapproved (Shadow IT), Under Review
  discoveredVia: 'SSO Entra ID' | 'Browser Agent' | 'DNS Gateway' | 'Upload Financeiro';
  userEmail: string;
  department: string;
  monthlySpend: number;
  activeSeats: number;
  totalSeats: number;
  riskLevel: 'Crítico' | 'Médio' | 'Baixo';
  lastActive: string;
}

interface SSOLog {
  id: string;
  timestamp: string;
  user: string;
  department: string;
  app: string;
  status: 'Autorizado' | 'Não Aprovado (Shadow IT)' | 'Bloqueado';
  ipAddress: string;
}

export default function SaaSVisibilityView({ companyData, onNavigateToTab, searchQuery = '' }: SaaSVisibilityViewProps) {
  // 1. Initial State for SaaS Apps with correct market taxonomy
  const [saasApps, setSaasApps] = useState<SaaSApp[]>([
    {
      id: 'saas-1',
      name: 'Salesforce CRM',
      category: 'Vendas & CRM',
      status: 'Aprovado',
      discoveredVia: 'SSO Entra ID',
      userEmail: 'ti@b3ware.com.br',
      department: 'Comercial',
      monthlySpend: 8400,
      activeSeats: 48,
      totalSeats: 60,
      riskLevel: 'Baixo',
      lastActive: 'Há 5 minutos'
    },
    {
      id: 'saas-2',
      name: 'Canva Pro',
      category: 'Design/Mídia',
      status: 'Não Aprovado',
      discoveredVia: 'Browser Agent',
      userEmail: 'marketing.junior@b3ware.com.br',
      department: 'Marketing',
      monthlySpend: 450,
      activeSeats: 3,
      totalSeats: 3,
      riskLevel: 'Médio',
      lastActive: 'Há 12 minutos'
    },
    {
      id: 'saas-3',
      name: 'Slack Enterprise',
      category: 'Colaboração',
      status: 'Aprovado',
      discoveredVia: 'SSO Entra ID',
      userEmail: 'ti@b3ware.com.br',
      department: 'Tecnologia',
      monthlySpend: 5200,
      activeSeats: 310,
      totalSeats: 450,
      riskLevel: 'Baixo',
      lastActive: 'Ativo agora'
    },
    {
      id: 'saas-4',
      name: 'Dropbox Personal',
      category: 'Armazenamento',
      status: 'Não Aprovado',
      discoveredVia: 'DNS Gateway',
      userEmail: 'diretor.comercial@b3ware.com.br',
      department: 'Comercial',
      monthlySpend: 180,
      activeSeats: 1,
      totalSeats: 1,
      riskLevel: 'Crítico',
      lastActive: 'Há 2 horas'
    },
    {
      id: 'saas-5',
      name: 'Notion Team',
      category: 'Produtividade',
      status: 'Sob Análise',
      discoveredVia: 'Browser Agent',
      userEmail: 'gestor.produto@b3ware.com.br',
      department: 'Produtos',
      monthlySpend: 950,
      activeSeats: 15,
      totalSeats: 20,
      riskLevel: 'Médio',
      lastActive: 'Há 30 minutos'
    },
    {
      id: 'saas-6',
      name: 'HubSpot Marketing',
      category: 'Marketing',
      status: 'Aprovado',
      discoveredVia: 'SSO Entra ID',
      userEmail: 'ti@b3ware.com.br',
      department: 'Marketing',
      monthlySpend: 6200,
      activeSeats: 22,
      totalSeats: 30,
      riskLevel: 'Baixo',
      lastActive: 'Há 1 hora'
    },
    {
      id: 'saas-7',
      name: 'Miro Board Pro',
      category: 'Design/Mídia',
      status: 'Não Aprovado',
      discoveredVia: 'Browser Agent',
      userEmail: 'ux.design@b3ware.com.br',
      department: 'Design',
      monthlySpend: 380,
      activeSeats: 2,
      totalSeats: 4,
      riskLevel: 'Médio',
      lastActive: 'Há 1 dia'
    },
    {
      id: 'saas-8',
      name: 'MailChimp Lite',
      category: 'Marketing',
      status: 'Não Aprovado',
      discoveredVia: 'Upload Financeiro',
      userEmail: 'comunicacao@b3ware.com.br',
      department: 'RH',
      monthlySpend: 650,
      activeSeats: 1,
      totalSeats: 1,
      riskLevel: 'Médio',
      lastActive: 'Há 3 dias'
    },
    {
      id: 'saas-9',
      name: 'ChatGPT Plus Team',
      category: 'Inteligência Artificial',
      status: 'Sob Análise',
      discoveredVia: 'Browser Agent',
      userEmail: 'dev.lead@b3ware.com.br',
      department: 'Tecnologia',
      monthlySpend: 1150,
      activeSeats: 10,
      totalSeats: 10,
      riskLevel: 'Médio',
      lastActive: 'Há 8 minutos'
    }
  ]);

  // 2. Initial State for SSO Log Feed
  const [ssoLogs, setSsoLogs] = useState<SSOLog[]>([
    { id: 'log-1', timestamp: '09:44:12', user: 'erico.andrade@b3ware.com.br', department: 'Diretoria', app: 'Salesforce CRM', status: 'Autorizado', ipAddress: '177.85.12.91' },
    { id: 'log-2', timestamp: '09:43:05', user: 'marketing.junior@b3ware.com.br', department: 'Marketing', app: 'Canva Pro', status: 'Não Aprovado (Shadow IT)', ipAddress: '189.23.44.110' },
    { id: 'log-3', timestamp: '09:41:55', user: 'mariana.silva@b3ware.com.br', department: 'RH', app: 'Slack Enterprise', status: 'Autorizado', ipAddress: '177.85.12.92' },
    { id: 'log-4', timestamp: '09:39:40', user: 'diretor.comercial@b3ware.com.br', department: 'Comercial', app: 'Dropbox Personal', status: 'Não Aprovado (Shadow IT)', ipAddress: '200.19.82.14' },
    { id: 'log-5', timestamp: '09:37:11', user: 'ux.design@b3ware.com.br', department: 'Design', app: 'Miro Board Pro', status: 'Não Aprovado (Shadow IT)', ipAddress: '177.85.12.95' },
    { id: 'log-6', timestamp: '09:35:00', user: 'gestor.produto@b3ware.com.br', department: 'Produtos', app: 'Notion Team', status: 'Autorizado', ipAddress: '177.85.12.98' }
  ]);

  // UI Interactive States
  const [isScanning, setIsScanning] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'Todos' | 'Aprovado' | 'Não Aprovado' | 'Sob Análise'>('Todos');
  const [activeRiskFilter, setActiveRiskFilter] = useState<'Todos' | 'Crítico' | 'Médio' | 'Baixo'>('Todos');
  const [savingsSession, setSavingsSession] = useState(0);

  // Dynamic log generator (simulates real time stream)
  useEffect(() => {
    const users = [
      { email: 'rodrigo.santos@b3ware.com.br', dept: 'Engenharia' },
      { email: 'camila.costa@b3ware.com.br', dept: 'Financeiro' },
      { email: 'gustavo.silva@b3ware.com.br', dept: 'Comercial' },
      { email: 'beatriz.oliveira@b3ware.com.br', dept: 'Marketing' }
    ];
    const apps = [
      { name: 'Slack Enterprise', auth: 'Autorizado' },
      { name: 'Salesforce CRM', auth: 'Autorizado' },
      { name: 'Canva Pro', auth: 'Não Aprovado (Shadow IT)' },
      { name: 'Trello Free', auth: 'Não Aprovado (Shadow IT)' },
      { name: 'ChatGPT Plus Team', auth: 'Autorizado' },
      { name: 'WeTransfer Personal', auth: 'Não Aprovado (Shadow IT)' }
    ];

    const interval = setInterval(() => {
      const randomUser = users[Math.floor(Math.random() * users.length)];
      const randomApp = apps[Math.floor(Math.random() * apps.length)];
      const now = new Date();
      const timeStr = now.toLocaleTimeString('pt-BR');

      const newLog: SSOLog = {
        id: `log-dyn-${Date.now()}`,
        timestamp: timeStr,
        user: randomUser.email,
        department: randomUser.dept,
        app: randomApp.name,
        status: randomApp.auth as any,
        ipAddress: `177.85.12.${Math.floor(Math.random() * 200) + 10}`
      };

      setSsoLogs(prev => [newLog, ...prev.slice(0, 9)]);
    }, 12000);

    return () => clearInterval(interval);
  }, []);

  // 3. SaaS Discovery Scan Simulation
  const handleSaaSDiscovery = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      
      // Check if already injected to prevent endless duplicates
      if (saasApps.some(a => a.name === 'Airtable Pro' || a.name === 'ClickUp Premium')) {
        alert('Varredura de descoberta concluída. Nenhum novo aplicativo SaaS adicional detectado no momento.');
        return;
      }

      // Inject new Shadow IT discoveries
      const discoveredApps: SaaSApp[] = [
        {
          id: 'saas-new-1',
          name: 'Airtable Pro',
          category: 'Produtividade',
          status: 'Não Aprovado',
          discoveredVia: 'Browser Agent',
          userEmail: 'analista.dados@b3ware.com.br',
          department: 'BI & Analytics',
          monthlySpend: 680,
          activeSeats: 4,
          totalSeats: 4,
          riskLevel: 'Crítico',
          lastActive: 'Há 1 minuto'
        },
        {
          id: 'saas-new-2',
          name: 'ClickUp Premium',
          category: 'Produtividade',
          status: 'Sob Análise',
          discoveredVia: 'SSO Entra ID',
          userEmail: 'projetos.eng@b3ware.com.br',
          department: 'Engenharia',
          monthlySpend: 540,
          activeSeats: 8,
          totalSeats: 12,
          riskLevel: 'Médio',
          lastActive: 'Há 3 minutos'
        }
      ];

      setSaasApps(prev => [...discoveredApps, ...prev]);

      // Add a fresh alert in the logs
      const timeStr = new Date().toLocaleTimeString('pt-BR');
      setSsoLogs(prev => [
        {
          id: `log-dyn-scan-1`,
          timestamp: timeStr,
          user: 'analista.dados@b3ware.com.br',
          department: 'BI & Analytics',
          app: 'Airtable Pro',
          status: 'Não Aprovado (Shadow IT)',
          ipAddress: '177.85.12.155'
        },
        ...prev
      ]);

      alert('Varredura de descoberta concluída! O motor Snow Atlas localizou 2 novos sistemas SaaS ativos no ecossistema corporativo: Airtable Pro (Não Aprovado / Shadow IT) e ClickUp Premium (Sob Análise).');
    }, 2000);
  };

  // 4. Action: Revoke Access (Block App / Mitigar Risco)
  const handleRevokeAccess = (id: string, name: string) => {
    setSaasApps(prev => prev.filter(app => app.id !== id));
    
    // Log blocking action
    const timeStr = new Date().toLocaleTimeString('pt-BR');
    setSsoLogs(prev => [
      {
        id: `log-block-${Date.now()}`,
        timestamp: timeStr,
        user: 'admin@b3ware.com.br',
        department: 'TI',
        app: name,
        status: 'Bloqueado',
        ipAddress: '127.0.0.1'
      },
      ...prev
    ]);

    const app = saasApps.find(a => a.id === id);
    if (app) {
      setSavingsSession(prev => prev + app.monthlySpend);
    }

    alert(`Acesso revogado e bloqueio de segurança aplicado para ${name}. O tráfego para a URL foi restrito pelo DNS Gateway e o colaborador responsável foi notificado com as alternativas homologadas.`);
  };

  // 5. Action: Sanction App (Aprovar / Homologar)
  const handleSanctionApp = (id: string) => {
    setSaasApps(prev => prev.map(app => 
      app.id === id 
        ? { ...app, status: 'Aprovado', riskLevel: 'Baixo' } 
        : app
    ));
    alert('Aplicativo promovido para o catálogo de sistemas Aprovados. As regras de provisionamento de contas e o logon único (SSO) foram vinculados.');
  };

  // 6. Action: Reclaim Spare Licenses (Recuperar Licenças Ociosas)
  const handleReclaimLicenses = (id: string, countToReclaim: number, costPerSeat: number) => {
    setSaasApps(prev => prev.map(app => {
      if (app.id === id) {
        const updatedTotal = app.totalSeats - countToReclaim;
        const savedAmount = countToReclaim * costPerSeat;
        setSavingsSession(prevSav => prevSav + savedAmount);
        return {
          ...app,
          totalSeats: updatedTotal,
          monthlySpend: Math.max(0, app.monthlySpend - savedAmount)
        };
      }
      return app;
    }));
    alert(`Sucesso! Recuperamos ${countToReclaim} licenças ociosas deste fornecedor. O faturamento recorrente foi ajustado diretamente no contrato do serviço.`);
  };

  // Filters application
  const filteredApps = saasApps.filter(app => {
    const matchesSearch = app.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          app.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          app.userEmail.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = activeFilter === 'Todos' || app.status === activeFilter;
    const matchesRisk = activeRiskFilter === 'Todos' || app.riskLevel === activeRiskFilter;

    return matchesSearch && matchesStatus && matchesRisk;
  });

  // Calculate Metrics
  const totalSaaSSpend = saasApps.reduce((sum, app) => sum + app.monthlySpend, 0);
  const shadowITCount = saasApps.filter(app => app.status === 'Não Aprovado').length;
  const shadowITSpend = saasApps.filter(app => app.status === 'Não Aprovado').reduce((sum, app) => sum + app.monthlySpend, 0);

  const activeSeatsTotal = saasApps.reduce((sum, app) => sum + app.activeSeats, 0);
  const totalSeatsAlloted = saasApps.reduce((sum, app) => sum + app.totalSeats, 0);
  const idleSeatsCount = Math.max(0, totalSeatsAlloted - activeSeatsTotal);
  
  // Potential Savings from idle seats (Recuperação de licenças)
  const potentialSavingsSaaS = saasApps.reduce((sum, app) => {
    const idle = Math.max(0, app.totalSeats - app.activeSeats);
    const unitCost = app.totalSeats > 0 ? (app.monthlySpend / app.totalSeats) : 0;
    return sum + (idle * unitCost);
  }, 0);

  // Department charts data
  const deptDataMap: { [key: string]: number } = {};
  saasApps.forEach(app => {
    deptDataMap[app.department] = (deptDataMap[app.department] || 0) + app.monthlySpend;
  });
  const chartDeptData = Object.keys(deptDataMap).map(key => ({
    name: key,
    Gasto: deptDataMap[key]
  })).sort((a, b) => b.Gasto - a.Gasto);

  return (
    <div className="space-y-6 animate-fade-in text-gray-800">
      
      {/* Dynamic Alert for Session Savings */}
      {savingsSession > 0 && (
        <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100 rounded-lg text-emerald-700">
              <Zap size={18} />
            </div>
            <div>
              <p className="text-xs font-bold text-emerald-900">Ação de Saneamento SaaS Concluída</p>
              <p className="text-[11px] text-emerald-700">
                Você poupou <strong className="font-mono">R$ {savingsSession.toLocaleString('pt-BR')}</strong> nesta sessão de governança e recuperação!
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 font-extrabold px-2.5 py-1 rounded">
            + REALIZADO
          </span>
        </div>
      )}

      {/* 1. Header Area with Platform Context */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-50 rounded-lg text-[#00B551]">
              <Cloud size={24} />
            </div>
            <div>
              <span className="text-[9px] font-mono font-black text-emerald-600 tracking-wider uppercase bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                Módulo de Visibilidade SaaS
              </span>
              <h2 className="font-headline text-2xl font-black text-gray-900 tracking-tight">Governança SaaS e Descoberta de Shadow IT</h2>
            </div>
          </div>
          <p className="text-xs text-gray-500 leading-normal max-w-2xl">
            Mapeie o ecossistema SaaS não homologado na sua organização. Detecte assinaturas feitas diretamente por colaboradores via cartão de crédito corporativo (Shadow IT) e recupere licenças ociosas baseando-se na inatividade de logons de logon único.
          </p>
        </div>
        <div className="flex gap-3 shrink-0 w-full md:w-auto">
          <button 
            onClick={handleSaaSDiscovery}
            disabled={isScanning}
            className={`flex-1 md:flex-initial bg-gray-900 text-white font-sans text-xs font-bold px-4 py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-black active:scale-[0.98] transition-all cursor-pointer shadow-sm ${isScanning ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            <RefreshCw size={15} className={isScanning ? 'animate-spin' : ''} />
            {isScanning ? 'Sincronizando...' : 'Sincronizar e Iniciar Descoberta'}
          </button>
        </div>
      </div>

      {/* 2. KPIs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* KPI 1: SaaS Spend */}
        <div className="bg-white p-4 rounded-sm border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="font-mono text-[10px] text-slate-500 font-bold uppercase tracking-wider">Investimento Total SaaS</span>
            <div className="p-2 bg-emerald-50 rounded-lg text-[#00B551]">
              <DollarSign size={18} />
            </div>
          </div>
          <div>
            <h3 className="font-headline text-2xl font-black text-gray-900 tracking-tight">
              R$ {totalSaaSSpend.toLocaleString('pt-BR')}
            </h3>
            <span className="text-[11px] text-gray-400 font-semibold">gastos recorrentes/mês</span>
          </div>
          <div className="mt-3 border-t border-gray-100 pt-2 flex items-center text-[10px] text-gray-500">
            <Activity size={13} className="text-[#00B551] mr-1" />
            <span>{saasApps.length} aplicativos ativos no catálogo</span>
          </div>
        </div>

        {/* KPI 2: Shadow IT */}
        <div className="bg-white p-4 rounded-sm border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="font-mono text-[10px] text-slate-500 font-bold uppercase tracking-wider">Shadow IT (Não Sancionado)</span>
            <div className="p-2 bg-red-50 rounded-lg text-red-600">
              <ShieldAlert size={18} />
            </div>
          </div>
          <div>
            <h3 className={`font-headline text-2xl font-black tracking-tight ${shadowITCount > 0 ? 'text-red-600' : 'text-gray-900'}`}>
              {shadowITCount} {shadowITCount === 1 ? 'Aplicativo' : 'Aplicativos'}
            </h3>
            <span className="text-[11px] text-gray-400 font-semibold">
              R$ {shadowITSpend.toLocaleString('pt-BR')}/mês não homologados
            </span>
          </div>
          <div className="mt-3 border-t border-gray-100 pt-2 flex items-center text-[10px] text-red-600 font-medium">
            <AlertTriangle size={13} className="mr-1 shrink-0" />
            <span>Risco de Vazamento de Dados / LGPD</span>
          </div>
        </div>

        {/* KPI 3: Seat Allocation Efficiency */}
        <div className="bg-white p-4 rounded-sm border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="font-mono text-[10px] text-slate-500 font-bold uppercase tracking-wider">Eficiência de Assentos</span>
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
              <Users size={18} />
            </div>
          </div>
          <div>
            <h3 className="font-headline text-2xl font-black text-gray-900 tracking-tight">
              {totalSeatsAlloted > 0 ? Math.round((activeSeatsTotal / totalSeatsAlloted) * 100) : 0}%
            </h3>
            <span className="text-[11px] text-gray-400 font-semibold">
              {activeSeatsTotal} ativos de {totalSeatsAlloted} comprados
            </span>
          </div>
          <div className="mt-3 border-t border-gray-100 pt-2 flex items-center text-[10px] text-gray-500">
            <span className="text-amber-600 font-bold mr-1">{idleSeatsCount} licenças</span>
            <span>ociosas passíveis de reaver</span>
          </div>
        </div>

        {/* KPI 4: Potential SaaS Savings */}
        <div className="bg-white p-4 rounded-sm border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="font-mono text-[10px] text-slate-500 font-bold uppercase tracking-wider">Recuperação Potencial de Licenças</span>
            <div className="p-2 bg-amber-50 rounded-lg text-amber-500">
              <Zap size={18} />
            </div>
          </div>
          <div>
            <h3 className="font-headline text-2xl font-black text-amber-600 tracking-tight">
              R$ {potentialSavingsSaaS.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
            </h3>
            <span className="text-[11px] text-amber-600 font-semibold">economia mensal reivindicável</span>
          </div>
          <div className="mt-3 border-t border-gray-100 pt-2 flex items-center text-[10px] text-amber-600 font-medium">
            <ArrowUpRight size={13} className="mr-1" />
            <span>Disponível para desprovisionamento</span>
          </div>
        </div>
      </div>

      {/* 3. Splitted charts and SSO Activity stream log */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Spend by Department chart */}
        <div className="bg-white p-5 rounded-sm border border-slate-200 shadow-sm lg:col-span-7 flex flex-col justify-between">
          <div>
            <h4 className="font-mono text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-3">Distribuição de Gastos SaaS por Departamento</h4>
            <div className="h-[200px] w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartDeptData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: '#64748b', fontSize: 9, angle: -15, textAnchor: 'end' }} 
                    axisLine={false} 
                    tickLine={false} 
                    height={40}
                  />
                  <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    formatter={(val) => [`R$ ${Number(val).toLocaleString('pt-BR')}`, 'Gasto']}
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', color: '#1e293b', fontSize: '11px' }}
                  />
                  <Bar dataKey="Gasto" radius={[4, 4, 0, 0]}>
                    {chartDeptData.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={idx === 0 ? '#00B551' : idx === 1 ? '#34d399' : idx === 2 ? '#6ee7b7' : '#a7f3d0'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 flex items-center justify-between text-[11px] text-gray-500 mt-2">
            <span>Departamento líder em gastos de licenças</span>
            <span className="font-bold text-gray-800">{chartDeptData[0]?.name || 'N/A'}</span>
          </div>
        </div>

        {/* Live SSO Logins Stream */}
        <div className="bg-white p-5 rounded-sm border border-slate-200 shadow-sm lg:col-span-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-mono text-[10px] text-slate-500 font-bold uppercase tracking-widest">Feed em Tempo Real de Logons SSO</h4>
              <span className="text-[9px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold animate-pulse">
                Monitoramento Ativo
              </span>
            </div>
            
            {/* Logs List Container */}
            <div className="space-y-2.5 max-h-[195px] overflow-y-auto pr-1 custom-scrollbar text-xs">
              {ssoLogs.map((log) => (
                <div key={log.id} className="p-2 border border-gray-100 rounded bg-gray-50/50 flex flex-col gap-1 transition-all">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-mono text-gray-400">{log.timestamp}</span>
                    <span className={`px-1.5 py-0.2 rounded-[3px] font-extrabold text-[8px] uppercase ${
                      log.status === 'Autorizado' 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                        : log.status === 'Bloqueado'
                          ? 'bg-gray-100 text-gray-600 border border-gray-200'
                          : 'bg-red-50 text-red-700 border border-red-100 animate-pulse'
                    }`}>
                      {log.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="font-bold text-gray-800 truncate max-w-[150px]">{log.user}</span>
                    <span className="font-mono text-[10px] text-gray-400">{log.ipAddress}</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-gray-500">
                    <span>Acesso a: <strong className="text-gray-700 font-semibold">{log.app}</strong></span>
                    <span className="bg-white px-1.5 py-0.5 rounded border border-gray-100">{log.department}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="text-[10px] text-gray-400 text-center mt-3 pt-2 border-t border-gray-100">
            Integrado com Microsoft Entra ID e Agente de Segurança de Endpoint
          </div>
        </div>

      </div>

      {/* 4. Controls, Filters, and Discovered SaaS Applications List */}
      <div className="bg-white rounded-sm border border-slate-200 shadow-sm p-5 space-y-4">
        
        {/* Filters Top Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={16} className="text-gray-400" />
            <span className="text-xs font-bold text-gray-700">Filtros de Governança:</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Status Filter */}
            <div className="flex items-center bg-slate-100 rounded-sm p-0.5 border border-slate-200 text-[11px] font-medium">
              {(['Todos', 'Aprovado', 'Não Aprovado', 'Sob Análise'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setActiveFilter(status)}
                  className={`px-3 py-1 rounded-sm transition-all cursor-pointer ${
                    activeFilter === status 
                      ? 'bg-white text-[#00B551] font-bold shadow-sm' 
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            {/* Risk Filter */}
            <div className="flex items-center bg-slate-100 rounded-sm p-0.5 border border-slate-200 text-[11px] font-medium">
              <span className="px-2 text-slate-400 text-[10px] font-bold uppercase">Risco:</span>
              {(['Todos', 'Crítico', 'Médio', 'Baixo'] as const).map((risk) => (
                <button
                  key={risk}
                  onClick={() => setActiveRiskFilter(risk)}
                  className={`px-3 py-1 rounded-sm transition-all cursor-pointer ${
                    activeRiskFilter === risk 
                      ? 'bg-white text-slate-800 font-bold shadow-sm' 
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {risk}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Dynamic Discovered Apps Table */}
        <div className="overflow-x-auto custom-scrollbar border border-slate-200 rounded-sm">
          <table className="w-full text-left border-collapse zebra-table">
            <thead className="bg-slate-100 text-[9px] font-mono uppercase text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 font-bold">Aplicativo</th>
                <th className="px-4 py-3 font-bold">Responsável / Unidade</th>
                <th className="px-4 py-3 font-bold">Descoberto via</th>
                <th className="px-4 py-3 font-bold text-center">Nível de Risco</th>
                <th className="px-4 py-3 font-bold text-right">Licenças / Uso</th>
                <th className="px-4 py-3 font-bold text-right">Faturamento Mensal</th>
                <th className="px-4 py-3 font-bold text-center">Ações de Governança</th>
              </tr>
            </thead>
            <tbody className="text-xs divide-y divide-slate-100 text-slate-800">
              {filteredApps.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400 text-xs">
                    Nenhum aplicativo correspondente aos filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredApps.map((app) => {
                  const ociosas = Math.max(0, app.totalSeats - app.activeSeats);
                  const isUnsanctioned = app.status === 'Não Aprovado';
                  const isSanctioned = app.status === 'Aprovado';
                  
                  return (
                    <tr key={app.id} className="hover:bg-slate-50 transition-colors border-l-[3px] border-l-transparent hover:border-l-[#00B551]">
                      {/* Name and Category */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded ${
                            isUnsanctioned 
                              ? 'bg-red-50 text-red-600' 
                              : app.status === 'Sob Análise'
                                ? 'bg-amber-50 text-amber-600'
                                : 'bg-emerald-50 text-[#00B551]'
                          }`}>
                            <Eye size={15} />
                          </div>
                          <div>
                            <span className="font-bold text-gray-900 block">{app.name}</span>
                            <span className="text-[10px] text-gray-400">{app.category}</span>
                          </div>
                        </div>
                      </td>

                      {/* Responsible & Department */}
                      <td className="px-4 py-3">
                        <span className="text-gray-700 block font-medium truncate max-w-[150px]" title={app.userEmail}>
                          {app.userEmail}
                        </span>
                        <span className="text-[10px] font-mono bg-gray-100 text-gray-500 px-1.5 py-0.2 rounded inline-block mt-0.5">
                          {app.department}
                        </span>
                      </td>

                      {/* Discovered Via Method */}
                      <td className="px-4 py-3">
                        <span className="text-gray-600 text-[11px] block">{app.discoveredVia}</span>
                        <span className="text-[9px] text-gray-400 block font-mono">Última atividade: {app.lastActive}</span>
                      </td>

                      {/* Risk level badge */}
                      <td className="px-4 py-3 text-center">
                        <span 
                          title={
                            app.riskLevel === 'Crítico' 
                              ? "Critério Risco Crítico: Aplicativos sem criptografia de ponta-a-ponta, com histórico de vulnerabilidades conhecidas, ou que processam/armazenam dados confidenciais (ex: Dropbox pessoal)." 
                              : app.riskLevel === 'Médio'
                                ? "Critério Risco Médio: Aplicativos com termos de privacidade aceitáveis, mas sem controle corporativo centralizado, suporte a SSO ou MFA (ex: Canva, Miro)."
                                : "Critério Risco Baixo: Aplicativos de uso homologado integrados com logon único (SSO) do Entra ID, com MFA ativo e total aderência à LGPD."
                          }
                          className={`inline-block px-2 py-0.5 rounded text-[9px] font-extrabold border cursor-help transition-transform hover:scale-105 duration-150 ${
                            app.riskLevel === 'Crítico' 
                              ? 'bg-red-50 text-red-700 border-red-200' 
                              : app.riskLevel === 'Médio'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {app.riskLevel}
                        </span>
                      </td>

                      {/* License metrics */}
                      <td className="px-4 py-3 text-right">
                        <div className="font-mono text-[11px] font-bold text-gray-900">
                          {app.activeSeats} / {app.totalSeats}
                        </div>
                        <span className={`text-[9px] block ${ociosas > 0 ? 'text-amber-600 font-bold' : 'text-gray-400'}`}>
                          {ociosas > 0 ? `${ociosas} ociosas` : '100% em uso'}
                        </span>
                      </td>

                      {/* Cost */}
                      <td className="px-4 py-3 text-right">
                        <span className="font-mono font-black text-gray-900 block">
                          R$ {app.monthlySpend.toLocaleString('pt-BR')}
                        </span>
                        <span className="text-[9px] text-gray-400 block">mensal recorrente</span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {isUnsanctioned && (
                            <>
                              {/* Revogar Acesso button */}
                              <button
                                onClick={() => handleRevokeAccess(app.id, app.name)}
                                className="bg-red-50 text-red-700 border border-red-200 font-bold text-[10px] px-2.5 py-1.5 rounded-lg hover:bg-red-100 hover:text-red-800 cursor-pointer flex items-center gap-1 transition-colors"
                                title="Revogar Acesso: Bloquear tráfego não homologado pelo DNS Gateway"
                              >
                                <Lock size={12} /> Revogar Acesso
                              </button>
                              
                              {/* Sancionar button */}
                              <button
                                onClick={() => handleSanctionApp(app.id)}
                                className="bg-emerald-50 text-[#00B551] border border-emerald-200 font-bold text-[10px] px-2.5 py-1.5 rounded-lg hover:bg-emerald-100 hover:text-[#00cd5c] cursor-pointer flex items-center gap-1 transition-colors"
                                title="Aprovar: Autorizar e catalogar o aplicativo na empresa"
                              >
                                <Unlock size={12} /> Aprovar Aplicativo
                              </button>
                            </>
                          )}

                          {isSanctioned && ociosas > 0 && (
                            <button
                              onClick={() => handleReclaimLicenses(app.id, ociosas, Math.round(app.monthlySpend / app.totalSeats))}
                              className="bg-amber-50 text-amber-700 border border-amber-200 font-bold text-[10px] px-2.5 py-1.5 rounded-lg hover:bg-amber-100 cursor-pointer flex items-center gap-1 transition-colors"
                              title="Recuperar Licenças Ociosas: Reduzir assentos e mitigar desperdício"
                            >
                              <Zap size={11} /> Recuperar {ociosas} Licenças
                            </button>
                          )}

                          {isSanctioned && ociosas === 0 && (
                            <span className="text-[10px] text-gray-400 italic">
                              Sem ações necessárias
                            </span>
                          )}

                          {app.status === 'Sob Análise' && (
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleSanctionApp(app.id)}
                                className="bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[9px] px-2.5 py-1 rounded transition-colors"
                              >
                                Aprovar
                              </button>
                              <button
                                onClick={() => handleRevokeAccess(app.id, app.name)}
                                className="bg-gray-50 text-gray-600 border border-gray-200 font-bold text-[9px] px-2.5 py-1 rounded transition-colors"
                              >
                                Rejeitar
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* 5. Informational Accordion or Policy Warning */}
      <div className="bg-slate-50 border border-slate-200 p-5 rounded-sm flex items-start gap-3">
        <Activity size={20} className="text-[#00B551] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
            Diretrizes de Monitoramento e Descoberta Snow Atlas SaaS
          </h5>
          <p className="text-xs text-slate-600 leading-relaxed">
            O motor de varredura automatizado utiliza tokens integrados do Microsoft Entra ID (logins SAML/OIDC) e nosso agente de navegador implantado em computadores corporativos. Os dados de conexões externas coletados são correlacionados com nossa base global para catalogar os aplicativos em tempo real. Para habilitar novos conectores SSO (Okta, OneLogin, Google Workspace), configure-os através do painel de <strong>Integrações</strong>.
          </p>
        </div>
      </div>

    </div>
  );
}
