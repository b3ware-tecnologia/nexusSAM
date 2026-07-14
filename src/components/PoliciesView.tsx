import React, { useState, useEffect } from 'react';
import { CompanyData } from '../data-types';
import { 
  Lock, 
  ShieldCheck, 
  ShieldAlert, 
  Laptop, 
  Users, 
  Plus, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  Sliders, 
  Settings, 
  Trash2, 
  ArrowRight, 
  Check, 
  FileSpreadsheet, 
  Cloud, 
  DollarSign, 
  Info,
  Layers,
  Sparkles,
  RefreshCw,
  FolderPlus,
  Tv
} from 'lucide-react';

interface PoliciesViewProps {
  companyData: CompanyData;
  onNavigateToTab: (tab: any) => void;
}

// Interfaces
interface Policy {
  id: string;
  name: string;
  description: string;
  module: 'SAM' | 'SaaS' | 'FinOps';
  status: 'Ativo' | 'Inativo';
  severity: 'Crítico' | 'Médio' | 'Informativo';
}

interface DeviceGroup {
  id: string;
  name: string;
  description: string;
  policyIds: string[];
  deviceCount: number;
}

interface Device {
  id: string;
  hostname: string;
  usuario: string;
  departamento: string;
  tipo: 'Notebook' | 'Desktop' | 'Servidor';
  groupId: string; // link to DeviceGroup.id
  statusConexao: 'Online' | 'Offline';
  activePoliciesCount: number;
  lastSync: string;
}

export default function PoliciesView({ companyData, onNavigateToTab }: PoliciesViewProps) {
  // 1. Policies State (by module)
  const [policies, setPolicies] = useState<Policy[]>([
    // SAM module policies
    {
      id: 'pol-sam-1',
      name: 'Bloqueio de Instaladores não Homologados',
      description: 'Impede a execução de instaladores (.msi, .exe) que não constam no catálogo homologado da TI.',
      module: 'SAM',
      status: 'Ativo',
      severity: 'Crítico'
    },
    {
      id: 'pol-sam-2',
      name: 'Exigir Justificativa para Ociosidade > 30 Dias',
      description: 'Dispara uma notificação automática exigindo justificativa se uma licença paga não for aberta por 30 dias.',
      module: 'SAM',
      status: 'Ativo',
      severity: 'Médio'
    },
    {
      id: 'pol-sam-3',
      name: 'Varredura Diária de Softwares Locais',
      description: 'Executa uma varredura silenciosa às 12h00 para inventariar novos executáveis na máquina.',
      module: 'SAM',
      status: 'Ativo',
      severity: 'Informativo'
    },
    // SaaS module policies
    {
      id: 'pol-saas-1',
      name: 'Bloqueio DNS de SaaS Não Aprovados',
      description: 'Bloqueia o acesso direto no nível de rede (DNS Gateway) a ferramentas de Shadow IT classificadas com Risco Crítico.',
      module: 'SaaS',
      status: 'Ativo',
      severity: 'Crítico'
    },
    {
      id: 'pol-saas-2',
      name: 'Exigir Aprovação de Novas Ferramentas de IA',
      description: 'Coloca em quarentena de avaliação qualquer nova extensão de navegador ou login em serviços de IA generativa.',
      module: 'SaaS',
      status: 'Ativo',
      severity: 'Médio'
    },
    {
      id: 'pol-saas-3',
      name: 'Revogação Automática via SSO (MFA)',
      description: 'Desativa o token de sessão ativa em apps conectados se o colaborador não realizar validação MFA de rotina.',
      module: 'SaaS',
      status: 'Inativo',
      severity: 'Crítico'
    },
    // FinOps module policies
    {
      id: 'pol-finops-1',
      name: 'Programação de Desligamento de VMs Dev',
      description: 'Desliga automaticamente servidores de homologação e sandbox entre 20h00 e 07h00 e aos fins de semana.',
      module: 'FinOps',
      status: 'Ativo',
      severity: 'Médio'
    },
    {
      id: 'pol-finops-2',
      name: 'Alerta de Projeção Orçamentária Cloud (+15%)',
      description: 'Emite um alerta crítico se a projeção linear de custos mensais do Azure/AWS ultrapassar o teto em 15%.',
      module: 'FinOps',
      status: 'Ativo',
      severity: 'Crítico'
    },
    {
      id: 'pol-finops-3',
      name: 'Downgrade Automático de CPU Ociosa',
      description: 'Identifica instâncias com média de utilização de CPU < 5% por 7 dias seguidos e sugere redução de tier.',
      module: 'FinOps',
      status: 'Inativo',
      severity: 'Informativo'
    }
  ]);

  // 2. Device Groups State
  const [deviceGroups, setDeviceGroups] = useState<DeviceGroup[]>([
    {
      id: 'group-1',
      name: 'Engenharia & Desenvolvimento',
      description: 'Desenvolvedores, Arquitetos de Nuvem e Engenheiros de Software.',
      policyIds: ['pol-sam-2', 'pol-sam-3', 'pol-saas-2', 'pol-finops-1', 'pol-finops-2'],
      deviceCount: 4
    },
    {
      id: 'group-2',
      name: 'Comercial & Vendas',
      description: 'Equipes de campo e Executivos de Contas com alta mobilidade.',
      policyIds: ['pol-sam-1', 'pol-saas-1', 'pol-sam-3'],
      deviceCount: 3
    },
    {
      id: 'group-3',
      name: 'Marketing & Design',
      description: 'Produtores de conteúdo, designers gráficos e editores de mídia.',
      policyIds: ['pol-sam-3', 'pol-saas-1', 'pol-saas-2'],
      deviceCount: 2
    },
    {
      id: 'group-4',
      name: 'Infraestrutura de Servidores',
      description: 'Servidores locais de banco de dados, sandbox e instâncias locais.',
      policyIds: ['pol-sam-1', 'pol-sam-3', 'pol-finops-2', 'pol-finops-3'],
      deviceCount: 2
    },
    {
      id: 'group-none',
      name: 'Sem Grupo Atribuído',
      description: 'Dispositivos recém-descobertos pendentes de governança e triagem.',
      policyIds: [],
      deviceCount: 1
    }
  ]);

  // 3. Individual Devices State
  const [devices, setDevices] = useState<Device[]>([
    { id: 'dev-1', hostname: 'B3W-ENG-SRV01', usuario: 'rodrigo.santos', departamento: 'Tecnologia', tipo: 'Servidor', groupId: 'group-4', statusConexao: 'Online', activePoliciesCount: 4, lastSync: 'Ativo agora' },
    { id: 'dev-2', hostname: 'B3W-DEV-LPT09', usuario: 'dev.lead@b3ware.com.br', departamento: 'Tecnologia', tipo: 'Notebook', groupId: 'group-1', statusConexao: 'Online', activePoliciesCount: 5, lastSync: 'Há 5 minutos' },
    { id: 'dev-3', hostname: 'B3W-MKT-DSG02', usuario: 'ux.design@b3ware.com.br', departamento: 'Marketing', tipo: 'Notebook', groupId: 'group-3', statusConexao: 'Online', activePoliciesCount: 3, lastSync: 'Há 12 minutos' },
    { id: 'dev-4', hostname: 'B3W-COM-SLS05', usuario: 'diretor.comercial', departamento: 'Comercial', tipo: 'Notebook', groupId: 'group-2', statusConexao: 'Online', activePoliciesCount: 3, lastSync: 'Há 2 horas' },
    { id: 'dev-5', hostname: 'B3W-ENG-LPT12', usuario: 'analista.dados', departamento: 'BI & Analytics', tipo: 'Notebook', groupId: 'group-1', statusConexao: 'Online', activePoliciesCount: 5, lastSync: 'Ativo agora' },
    { id: 'dev-6', hostname: 'B3W-ADM-FIN14', usuario: 'camila.costa', departamento: 'Financeiro', tipo: 'Desktop', groupId: 'group-none', statusConexao: 'Offline', activePoliciesCount: 0, lastSync: 'Há 1 dia' },
    { id: 'dev-7', hostname: 'B3W-COM-SLS11', usuario: 'marketing.junior', departamento: 'Marketing', tipo: 'Notebook', groupId: 'group-2', statusConexao: 'Online', activePoliciesCount: 3, lastSync: 'Há 30 minutos' },
    { id: 'dev-8', hostname: 'B3W-ENG-LPT15', usuario: 'projetos.eng', departamento: 'Engenharia', tipo: 'Notebook', groupId: 'group-1', statusConexao: 'Online', activePoliciesCount: 5, lastSync: 'Há 8 minutos' },
    { id: 'dev-9', hostname: 'B3W-DEV-LPT21', usuario: 'estagiario.dev', departamento: 'Tecnologia', tipo: 'Notebook', groupId: 'group-1', statusConexao: 'Online', activePoliciesCount: 5, lastSync: 'Ativo agora' },
    { id: 'dev-10', hostname: 'B3W-COM-SLS22', usuario: 'vendedor.junior', departamento: 'Comercial', tipo: 'Notebook', groupId: 'group-2', statusConexao: 'Online', activePoliciesCount: 3, lastSync: 'Há 1 hora' },
    { id: 'dev-11', hostname: 'B3W-MKT-DSG05', usuario: 'designer.junior', departamento: 'Marketing', tipo: 'Desktop', groupId: 'group-3', statusConexao: 'Offline', activePoliciesCount: 3, lastSync: 'Há 3 dias' },
    { id: 'dev-12', hostname: 'B3W-PROD-SRV02', usuario: 'infra.admin', departamento: 'Infraestrutura', tipo: 'Servidor', groupId: 'group-4', statusConexao: 'Online', activePoliciesCount: 4, lastSync: 'Ativo agora' }
  ]);

  // UI Interactive States
  const [activeTabModule, setActiveTabModule] = useState<'Todos' | 'SAM' | 'SaaS' | 'FinOps'>('Todos');
  const [searchQueryDevice, setSearchQueryDevice] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<DeviceGroup | null>(deviceGroups[0]);
  const [selectedDevicesForAssign, setSelectedDevicesForAssign] = useState<string[]>([]);
  const [assignTargetGroupId, setAssignTargetGroupId] = useState<string>('group-1');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // For Modals/Forms
  const [isNewPolicyOpen, setIsNewPolicyOpen] = useState(false);
  const [isNewGroupOpen, setIsNewGroupOpen] = useState(false);

  // New Policy form state
  const [newPolicyName, setNewPolicyName] = useState('');
  const [newPolicyDesc, setNewPolicyDesc] = useState('');
  const [newPolicyModule, setNewPolicyModule] = useState<'SAM' | 'SaaS' | 'FinOps'>('SAM');
  const [newPolicySeverity, setNewPolicySeverity] = useState<'Crítico' | 'Médio' | 'Informativo'>('Médio');

  // New Group form state
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [newGroupSelectedPolicies, setNewGroupSelectedPolicies] = useState<string[]>([]);

  // Show visual alerts/toasts
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // 1. Policy Toggle Status
  const handleTogglePolicyStatus = (id: string) => {
    setPolicies(prev => prev.map(p => {
      if (p.id === id) {
        const nextStatus = p.status === 'Ativo' ? 'Inativo' : 'Ativo';
        triggerToast(`Política "${p.name}" foi alterada para ${nextStatus.toUpperCase()}.`);
        return { ...p, status: nextStatus };
      }
      return p;
    }));
  };

  // 2. Add New Policy
  const handleCreatePolicy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPolicyName.trim()) return;

    const newPol: Policy = {
      id: `pol-${newPolicyModule.toLowerCase()}-${Date.now()}`,
      name: newPolicyName,
      description: newPolicyDesc || 'Sem descrição inserida.',
      module: newPolicyModule,
      status: 'Ativo',
      severity: newPolicySeverity
    };

    setPolicies(prev => [...prev, newPol]);
    setIsNewPolicyOpen(false);
    triggerToast(`Política de ${newPolicyModule} "${newPolicyName}" criada e ativada com sucesso!`);
    
    // Clear form
    setNewPolicyName('');
    setNewPolicyDesc('');
    setNewPolicyModule('SAM');
    setNewPolicySeverity('Médio');
  };

  // 3. Add New Device Group
  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    const newGrp: DeviceGroup = {
      id: `group-custom-${Date.now()}`,
      name: newGroupName,
      description: newGroupDesc || 'Grupo personalizado de computadores.',
      policyIds: newGroupSelectedPolicies,
      deviceCount: 0
    };

    setDeviceGroups(prev => [...prev, newGrp]);
    setIsNewGroupOpen(false);
    setSelectedGroup(newGrp);
    triggerToast(`Grupo de Dispositivos "${newGroupName}" criado com sucesso contendo ${newGroupSelectedPolicies.length} políticas vinculadas.`);

    // Clear form
    setNewGroupName('');
    setNewGroupDesc('');
    setNewGroupSelectedPolicies([]);
  };

  // 4. Assign Device(s) to a Group - Extremely easy multi-select assignment mechanism
  const handleAssignDevicesToGroup = () => {
    if (selectedDevicesForAssign.length === 0) {
      triggerToast('Selecione pelo menos um dispositivo na tabela para atribuir.');
      return;
    }

    const targetGroupObj = deviceGroups.find(g => g.id === assignTargetGroupId);
    if (!targetGroupObj) return;

    // Update devices list
    setDevices(prev => prev.map(dev => {
      if (selectedDevicesForAssign.includes(dev.id)) {
        return {
          ...dev,
          groupId: assignTargetGroupId,
          activePoliciesCount: targetGroupObj.policyIds.length
        };
      }
      return dev;
    }));

    // Recalculate group device counts dynamically
    triggerToast(`Sucesso! ${selectedDevicesForAssign.length} dispositivo(s) foram movidos para o grupo "${targetGroupObj.name}".`);
    setSelectedDevicesForAssign([]); // Clear selection
  };

  // Toggle Policy in Selected Group
  const handleTogglePolicyInGroup = (policyId: string) => {
    if (!selectedGroup) return;

    const isCurrentlyLinked = selectedGroup.policyIds.includes(policyId);
    let updatedPolicyIds: string[];

    if (isCurrentlyLinked) {
      updatedPolicyIds = selectedGroup.policyIds.filter(id => id !== policyId);
    } else {
      updatedPolicyIds = [...selectedGroup.policyIds, policyId];
    }

    // Update DeviceGroups state
    setDeviceGroups(prev => prev.map(g => {
      if (g.id === selectedGroup.id) {
        return { ...g, policyIds: updatedPolicyIds };
      }
      return g;
    }));

    // Update selected group ref
    setSelectedGroup(prev => prev ? { ...prev, policyIds: updatedPolicyIds } : null);

    // Update device active policy counts for devices in this group
    setDevices(prev => prev.map(dev => {
      if (dev.groupId === selectedGroup.id) {
        return { ...dev, activePoliciesCount: updatedPolicyIds.length };
      }
      return dev;
    }));

    triggerToast(isCurrentlyLinked 
      ? `Política removida de "${selectedGroup.name}".` 
      : `Política vinculada a "${selectedGroup.name}" com herança automática ativa.`
    );
  };

  // Recalculate Device Counts per group in real-time
  useEffect(() => {
    setDeviceGroups(prev => prev.map(group => {
      const count = devices.filter(d => d.groupId === group.id).length;
      return { ...group, deviceCount: count };
    }));
  }, [devices]);

  // Select all / deselect all devices
  const handleSelectAllDevices = () => {
    const visibleDeviceIds = filteredDevices.map(d => d.id);
    const allSelected = visibleDeviceIds.every(id => selectedDevicesForAssign.includes(id));
    
    if (allSelected) {
      // Remove all visible from selection
      setSelectedDevicesForAssign(prev => prev.filter(id => !visibleDeviceIds.includes(id)));
    } else {
      // Add all visible to selection
      setSelectedDevicesForAssign(prev => {
        const unique = new Set([...prev, ...visibleDeviceIds]);
        return Array.from(unique);
      });
    }
  };

  const handleToggleSelectDevice = (id: string) => {
    setSelectedDevicesForAssign(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Filters application
  const filteredPolicies = policies.filter(p => 
    activeTabModule === 'Todos' || p.module === activeTabModule
  );

  const filteredDevices = devices.filter(dev => {
    const matchesSearch = dev.hostname.toLowerCase().includes(searchQueryDevice.toLowerCase()) ||
                          dev.usuario.toLowerCase().includes(searchQueryDevice.toLowerCase()) ||
                          dev.departamento.toLowerCase().includes(searchQueryDevice.toLowerCase());
    return matchesSearch;
  });

  // Policy count stats
  const totalActivePolicies = policies.filter(p => p.status === 'Ativo').length;
  const criticalPoliciesCount = policies.filter(p => p.status === 'Ativo' && p.severity === 'Crítico').length;
  const devicesWithoutGroup = devices.filter(d => d.groupId === 'group-none').length;

  return (
    <div className="space-y-6 animate-fade-in text-gray-800">
      
      {/* Dynamic Alert / Toast Message */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white text-xs font-bold px-4 py-3.5 rounded-xl shadow-2xl flex items-center gap-2.5 animate-bounce border border-gray-800">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Header block */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-50 rounded-lg text-[#00B551]">
              <Lock size={24} />
            </div>
            <div>
              <span className="text-[9px] font-mono font-black text-emerald-600 tracking-wider uppercase bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                Módulo Core de Governança
              </span>
              <h2 className="font-headline text-2xl font-black text-gray-900 tracking-tight">Políticas Globais de Conformidade</h2>
            </div>
          </div>
          <p className="text-xs text-gray-500 leading-normal max-w-2xl">
            Crie diretrizes unificadas para os módulos SAM, SaaS e FinOps. Agrupe computadores e servidores em grupos departamentais e realize a atribuição dinâmica de regras para monitoramento de desvios corporativos em tempo real.
          </p>
        </div>
        <div className="flex gap-2.5 shrink-0 w-full md:w-auto">
          <button 
            onClick={() => setIsNewPolicyOpen(true)}
            className="flex-1 md:flex-initial bg-gray-100 hover:bg-gray-200 text-gray-800 font-sans text-xs font-bold px-4 py-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-gray-200"
          >
            <Plus size={14} /> Nova Política
          </button>
          <button 
            onClick={() => setIsNewGroupOpen(true)}
            className="flex-1 md:flex-initial bg-gray-900 text-white font-sans text-xs font-bold px-4 py-3 rounded-lg flex items-center justify-center gap-1.5 hover:bg-black transition-all cursor-pointer shadow-sm"
          >
            <FolderPlus size={14} /> Novo Grupo de Dispositivos
          </button>
        </div>
      </div>

      {/* 2. Policies KPI Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="font-mono text-[10px] text-gray-500 font-bold uppercase tracking-wider">Políticas Vigentes</span>
            <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600">
              <ShieldCheck size={16} />
            </div>
          </div>
          <div>
            <h3 className="font-headline text-2xl font-black text-gray-900 tracking-tight">
              {totalActivePolicies} Ativas
            </h3>
            <span className="text-[11px] text-gray-400 font-semibold">de {policies.length} cadastradas no total</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="font-mono text-[10px] text-gray-500 font-bold uppercase tracking-wider">Regras Críticas Ativas</span>
            <div className="p-1.5 bg-red-50 rounded-lg text-red-600">
              <ShieldAlert size={16} />
            </div>
          </div>
          <div>
            <h3 className="font-headline text-2xl font-black text-red-600 tracking-tight">
              {criticalPoliciesCount} Regras
            </h3>
            <span className="text-[11px] text-gray-400 font-semibold">bloqueiam ou barram ações locais</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="font-mono text-[10px] text-gray-500 font-bold uppercase tracking-wider">Dispositivos Governáveis</span>
            <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600">
              <Laptop size={16} />
            </div>
          </div>
          <div>
            <h3 className="font-headline text-2xl font-black text-gray-900 tracking-tight">
              {devices.length} Máquinas
            </h3>
            <span className="text-[11px] text-gray-400 font-semibold">{devices.filter(d => d.statusConexao === 'Online').length} online para sincronia de políticas</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="font-mono text-[10px] text-gray-500 font-bold uppercase tracking-wider">Desvios de Triagem</span>
            <div className="p-1.5 bg-amber-50 rounded-lg text-amber-500">
              <AlertTriangle size={16} />
            </div>
          </div>
          <div>
            <h3 className={`font-headline text-2xl font-black tracking-tight ${devicesWithoutGroup > 0 ? 'text-amber-600' : 'text-gray-900'}`}>
              {devicesWithoutGroup} {devicesWithoutGroup === 1 ? 'Dispositivo' : 'Dispositivos'}
            </h3>
            <span className="text-[11px] text-gray-400 font-semibold">sem grupo de políticas vinculadas</span>
          </div>
        </div>
      </div>

      {/* 3. Main Dashboard: Left Sidebar for Groups & Policies, Right area for Device Matrix & Easy Assignment */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN (Lg: Col Span 5): Policies & Device Groups Configuration */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Section A: Policy Rules Catalog */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Sliders size={16} className="text-gray-400" />
                <h4 className="font-headline font-bold text-gray-900 text-sm">Catálogo Unificado de Diretrizes</h4>
              </div>
              <span className="text-[9px] font-mono text-gray-400">Herança por módulo</span>
            </div>

            {/* Module Filter Tabs */}
            <div className="flex items-center bg-gray-50 rounded-lg p-0.5 border border-gray-200 text-[10px] font-bold">
              {(['Todos', 'SAM', 'SaaS', 'FinOps'] as const).map((mod) => (
                <button
                  key={mod}
                  onClick={() => setActiveTabModule(mod)}
                  className={`flex-1 py-1 rounded-md transition-all cursor-pointer ${
                    activeTabModule === mod 
                      ? 'bg-white text-[#00B551] shadow-xs' 
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  {mod}
                </button>
              ))}
            </div>

            {/* List of Policies with custom toggles */}
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar text-xs">
              {filteredPolicies.map((pol) => (
                <div key={pol.id} className="p-3 border border-gray-100 rounded-lg bg-gray-50/50 flex flex-col gap-2 relative">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className={`inline-block px-1.5 py-0.2 rounded text-[8px] font-black uppercase font-mono mr-1.5 ${
                        pol.module === 'SAM' 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                          : pol.module === 'SaaS'
                            ? 'bg-purple-50 text-purple-700 border border-purple-100'
                            : 'bg-blue-50 text-blue-700 border border-blue-100'
                      }`}>
                        {pol.module}
                      </span>
                      <span className={`inline-block px-1 rounded text-[8px] font-bold ${
                        pol.severity === 'Crítico' 
                          ? 'bg-red-50 text-red-600' 
                          : pol.severity === 'Médio'
                            ? 'bg-amber-50 text-amber-600'
                            : 'bg-gray-100 text-gray-500'
                      }`}>
                        {pol.severity}
                      </span>
                    </div>

                    {/* Status Toggle Switch */}
                    <button 
                      onClick={() => handleTogglePolicyStatus(pol.id)}
                      className="cursor-pointer text-[10px] font-mono flex items-center gap-1 font-bold"
                    >
                      <span className={pol.status === 'Ativo' ? 'text-emerald-600' : 'text-gray-400'}>
                        {pol.status}
                      </span>
                      <div className={`w-6 h-3 rounded-full p-0.5 transition-all ${pol.status === 'Ativo' ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                        <div className={`w-2 h-2 rounded-full bg-white transition-transform ${pol.status === 'Ativo' ? 'translate-x-3' : 'translate-x-0'}`}></div>
                      </div>
                    </button>
                  </div>

                  <h5 className="font-bold text-gray-800 leading-tight">{pol.name}</h5>
                  <p className="text-[10px] text-gray-400 leading-relaxed">{pol.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Section B: Device Groups Manager */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Users size={16} className="text-gray-400" />
                <h4 className="font-headline font-bold text-gray-900 text-sm">Grupos de Dispositivos</h4>
              </div>
              <span className="text-[9px] font-mono bg-emerald-50 text-emerald-700 px-1.5 py-0.2 rounded font-bold">
                {deviceGroups.length} Grupos
              </span>
            </div>

            <p className="text-[10px] text-gray-400 leading-relaxed">
              Selecione um grupo para associar diretrizes específicas aplicadas de forma centralizada e imediata para todos os computadores que fazem parte dele:
            </p>

            {/* Groups list container */}
            <div className="space-y-2.5">
              {deviceGroups.map((group) => {
                const isSelected = selectedGroup?.id === group.id;
                return (
                  <div 
                    key={group.id}
                    onClick={() => setSelectedGroup(group)}
                    className={`p-3 border rounded-lg cursor-pointer transition-all ${
                      isSelected 
                        ? 'bg-emerald-50/50 border-emerald-400 shadow-xs' 
                        : 'bg-white border-gray-100 hover:bg-gray-50/50'
                    }`}
                  >
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-gray-800">{group.name}</span>
                      <span className="font-mono text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.2 rounded">
                        {group.deviceCount} {group.deviceCount === 1 ? 'dispositivo' : 'dispositivos'}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-400 truncate mt-1 leading-normal">
                      {group.description}
                    </p>
                    <div className="mt-2.5 flex flex-wrap gap-1">
                      {group.policyIds.length === 0 ? (
                        <span className="text-[8px] text-red-500 italic bg-red-50 px-1.5 py-0.2 rounded border border-red-100 font-bold">
                          Sem políticas vinculadas (Alto risco)
                        </span>
                      ) : (
                        group.policyIds.map(pId => {
                          const matchingPol = policies.find(p => p.id === pId);
                          return (
                            <span key={pId} className="text-[8px] font-mono bg-white text-gray-500 border border-gray-100 px-1.5 py-0.2 rounded">
                              {matchingPol ? matchingPol.name.substring(0, 18) + '...' : pId}
                            </span>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Active Group Policy Editor Panel (Visible when a group is selected) */}
            {selectedGroup && (
              <div className="border-t border-gray-100 pt-4 mt-2 space-y-3 bg-gray-50/40 p-3 rounded-lg border border-gray-150">
                <div className="flex justify-between items-center">
                  <h5 className="text-[11px] font-bold text-gray-800">
                    Diretrizes em <strong className="text-[#00B551]">{selectedGroup.name}</strong>
                  </h5>
                  <span className="text-[9px] text-gray-400 font-mono font-bold">
                    {selectedGroup.policyIds.length} Ativas
                  </span>
                </div>

                <p className="text-[9px] text-gray-400 leading-normal">
                  Clique nas diretrizes para vincular ou remover deste grupo. As mudanças herdam automaticamente em tempo real para as máquinas.
                </p>

                {/* Grid checklist of ALL policies */}
                <div className="grid grid-cols-1 gap-1.5 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                  {policies.map(p => {
                    const isLinked = selectedGroup.policyIds.includes(p.id);
                    return (
                      <button
                        key={p.id}
                        onClick={() => handleTogglePolicyInGroup(p.id)}
                        className={`text-left p-2 rounded border text-[10px] flex items-center justify-between gap-2 transition-all cursor-pointer ${
                          isLinked 
                            ? 'bg-white border-emerald-300 text-emerald-950 font-semibold' 
                            : 'bg-white border-gray-100 text-gray-400 hover:text-gray-600'
                        }`}
                      >
                        <div className="truncate pr-2">
                          <span className="text-[8px] font-bold uppercase font-mono mr-1 text-gray-400">
                            [{p.module}]
                          </span>
                          {p.name}
                        </div>
                        <div className={`p-0.5 rounded-full ${isLinked ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-300'}`}>
                          <Check size={11} className={isLinked ? 'opacity-100' : 'opacity-0'} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

          </div>

        </div>

        {/* RIGHT COLUMN (Lg: Col Span 7): EASY ATRIBUTION MATRIX & DEVICES LIST */}
        <div className="lg:col-span-7 space-y-6">
          
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
            
            {/* Table title & Search bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="font-headline font-bold text-gray-900 text-sm">Dispositivos do Inventário</h4>
                <p className="text-[10px] text-gray-400 mt-0.5">Vincule um ou múltiplos dispositivos a grupos de políticas</p>
              </div>

              {/* Search */}
              <div className="relative max-w-xs w-full">
                <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Filtrar por hostname, usuário..."
                  value={searchQueryDevice}
                  onChange={(e) => setSearchQueryDevice(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-emerald-500 focus:bg-white"
                />
              </div>
            </div>

            {/* QUICK ASSIGN PANEL (Ação Fácil de Atribuição de Grupo) */}
            <div className="bg-emerald-50/40 p-4 rounded-xl border border-emerald-200/60 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 w-full">
                <span className="text-[9px] font-mono text-emerald-700 font-extrabold uppercase tracking-wider block bg-emerald-50 border border-emerald-100 px-1.5 py-0.2 rounded w-fit">
                  Atribuição em Massa de Diretrizes
                </span>
                <p className="text-[11px] text-gray-600">
                  {selectedDevicesForAssign.length === 0 
                    ? 'Selecione as caixas de verificação na tabela abaixo para aplicar políticas coletivamente.' 
                    : `Você selecionou ${selectedDevicesForAssign.length} dispositivo(s). Atribuir ao grupo:`
                  }
                </p>
              </div>

              {selectedDevicesForAssign.length > 0 && (
                <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                  <select
                    value={assignTargetGroupId}
                    onChange={(e) => setAssignTargetGroupId(e.target.value)}
                    className="bg-white border border-gray-200 text-xs font-medium rounded-lg px-2.5 py-2 focus:outline-none focus:border-emerald-500"
                  >
                    {deviceGroups.map(g => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>

                  <button
                    onClick={handleAssignDevicesToGroup}
                    className="bg-gray-900 hover:bg-black text-white text-xs font-bold px-3.5 py-2 rounded-lg flex items-center gap-1 transition-all cursor-pointer whitespace-nowrap"
                  >
                    Vincular <ArrowRight size={13} />
                  </button>
                </div>
              )}
            </div>

            {/* Table Area */}
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 text-[9px] font-mono uppercase text-gray-500 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-center w-10">
                      <input 
                        type="checkbox"
                        checked={filteredDevices.length > 0 && filteredDevices.every(d => selectedDevicesForAssign.includes(d.id))}
                        onChange={handleSelectAllDevices}
                        className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                    </th>
                    <th className="px-4 py-3 font-bold">Máquina / Usuário</th>
                    <th className="px-4 py-3 font-bold">Departamento</th>
                    <th className="px-4 py-3 font-bold">Grupo Vinculado</th>
                    <th className="px-4 py-3 font-bold text-center">Regras Ativas</th>
                    <th className="px-4 py-3 font-bold text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="text-xs divide-y divide-gray-100">
                  {filteredDevices.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-400 italic">
                        Nenhum computador encontrado correspondente à busca.
                      </td>
                    </tr>
                  ) : (
                    filteredDevices.map((dev) => {
                      const matchedGroupObj = deviceGroups.find(g => g.id === dev.groupId);
                      const isUnassigned = dev.groupId === 'group-none';
                      const isSelected = selectedDevicesForAssign.includes(dev.id);

                      return (
                        <tr 
                          key={dev.id} 
                          className={`hover:bg-gray-50/40 transition-colors ${isSelected ? 'bg-emerald-50/10' : ''}`}
                        >
                          {/* Selection Checkbox */}
                          <td className="px-4 py-3 text-center">
                            <input 
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelectDevice(dev.id)}
                              className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                            />
                          </td>

                          {/* Device & User info */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className={`p-1.5 rounded ${dev.statusConexao === 'Online' ? 'bg-emerald-50 text-[#00B551]' : 'bg-gray-100 text-gray-400'}`}>
                                <Laptop size={14} />
                              </div>
                              <div>
                                <span className="font-bold text-gray-900 block font-mono text-[11px]">{dev.hostname}</span>
                                <span className="text-[10px] text-gray-400">{dev.usuario}</span>
                              </div>
                            </div>
                          </td>

                          {/* Department */}
                          <td className="px-4 py-3">
                            <span className="text-gray-600">{dev.departamento}</span>
                            <span className="text-[9px] text-gray-400 block font-mono">Tipo: {dev.tipo}</span>
                          </td>

                          {/* Group badge */}
                          <td className="px-4 py-3">
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                              isUnassigned 
                                ? 'bg-red-50 text-red-600 font-bold border border-red-100 animate-pulse' 
                                : 'bg-gray-100 text-gray-700 font-medium'
                            }`}>
                              {matchedGroupObj?.name || 'Nenhum'}
                            </span>
                          </td>

                          {/* Policies Count */}
                          <td className="px-4 py-3 text-center">
                            <span className={`font-mono font-black text-xs ${isUnassigned ? 'text-red-500' : 'text-gray-900'}`}>
                              {isUnassigned ? '0' : dev.activePoliciesCount}
                            </span>
                            <span className="text-[9px] text-gray-400 block">regras</span>
                          </td>

                          {/* Individual fast actions */}
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Quick switch group helper dropdown */}
                              <select
                                value={dev.groupId}
                                onChange={(e) => {
                                  const targetGroupId = e.target.value;
                                  const targetGrp = deviceGroups.find(g => g.id === targetGroupId);
                                  
                                  setDevices(prev => prev.map(d => 
                                    d.id === dev.id 
                                      ? { ...d, groupId: targetGroupId, activePoliciesCount: targetGrp ? targetGrp.policyIds.length : 0 } 
                                      : d
                                  ));

                                  triggerToast(`Dispositivo ${dev.hostname} migrado para "${targetGrp?.name}".`);
                                }}
                                className="bg-white border border-gray-200 text-[10px] rounded p-1 cursor-pointer focus:outline-none focus:border-emerald-500 font-medium"
                              >
                                {deviceGroups.map(g => (
                                  <option key={g.id} value={g.id}>{g.name}</option>
                                ))}
                              </select>
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

          {/* Section D: Direct drag and drop instructions / visual flow */}
          <div className="bg-[#f0f9f4] border border-emerald-200 p-5 rounded-xl flex items-start gap-3">
            <Sparkles size={20} className="text-emerald-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h5 className="text-xs font-bold text-emerald-950 uppercase tracking-wide">
                Configuração Automática e Sincronização em Lote
              </h5>
              <p className="text-xs text-emerald-800 leading-relaxed">
                As políticas vinculadas a cada grupo de computadores são atualizadas silenciosamente na próxima sincronização do agente local Snow Atlas (que ocorre a cada 15 minutos). Alterar as políticas de um grupo reescreve as regras herdeiras instantaneamente sem necessidade de reiniciar o dispositivo ou solicitar intervenção do usuário.
              </p>
            </div>
          </div>

        </div>

      </div>

      {/* 4. MODALS (Portals implemented directly using local state render helpers) */}
      
      {/* Policy creation modal */}
      {isNewPolicyOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="font-headline font-black text-gray-900 text-base">Nova Diretriz Corporativa</h3>
              <button 
                onClick={() => setIsNewPolicyOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-xs font-bold font-mono cursor-pointer"
              >
                [FECHAR]
              </button>
            </div>

            <form onSubmit={handleCreatePolicy} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-gray-700 block">Nome da Diretriz</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex: Impedir Logon após às 22h" 
                  value={newPolicyName}
                  onChange={(e) => setNewPolicyName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:border-emerald-500 focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700 block">Módulo de Governança</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['SAM', 'SaaS', 'FinOps'] as const).map(mod => (
                    <button
                      key={mod}
                      type="button"
                      onClick={() => setNewPolicyModule(mod)}
                      className={`p-2.5 rounded-lg border text-center font-bold cursor-pointer transition-all ${
                        newPolicyModule === mod 
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-800' 
                          : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {mod}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700 block">Classificação de Gravidade</label>
                <select 
                  value={newPolicySeverity}
                  onChange={(e) => setNewPolicySeverity(e.target.value as any)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:border-emerald-500"
                >
                  <option value="Informativo">Informativo</option>
                  <option value="Médio">Médio</option>
                  <option value="Crítico">Crítico</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700 block">Descrição e Impacto</label>
                <textarea 
                  rows={3}
                  placeholder="Descreva as restrições e o que acontecerá caso haja o desvio..."
                  value={newPolicyDesc}
                  onChange={(e) => setNewPolicyDesc(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:border-emerald-500 focus:bg-white resize-none"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewPolicyOpen(false)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-4 py-2.5 rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-4 py-2.5 rounded-lg cursor-pointer"
                >
                  Criar e Ativar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Device Group creation modal */}
      {isNewGroupOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="font-headline font-black text-gray-900 text-base">Novo Grupo de Dispositivos</h3>
              <button 
                onClick={() => setIsNewGroupOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-xs font-bold font-mono cursor-pointer"
              >
                [FECHAR]
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-gray-700 block">Nome do Grupo</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex: Diretoria & Financeiro" 
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:border-emerald-500 focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700 block">Descrição</label>
                <textarea 
                  rows={2}
                  placeholder="Descreva o propósito deste grupo..."
                  value={newGroupDesc}
                  onChange={(e) => setNewGroupDesc(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:border-emerald-500 focus:bg-white resize-none"
                />
              </div>

              {/* Checklist to link policies on group creation */}
              <div className="space-y-1">
                <label className="font-bold text-gray-700 block">Vincular Diretrizes Iniciais</label>
                <div className="border border-gray-100 rounded-lg p-2 max-h-[140px] overflow-y-auto space-y-1 bg-gray-50/50">
                  {policies.map(p => {
                    const isChecked = newGroupSelectedPolicies.includes(p.id);
                    return (
                      <label key={p.id} className="flex items-center gap-2 p-1.5 hover:bg-white rounded cursor-pointer transition-colors text-[10px]">
                        <input 
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            setNewGroupSelectedPolicies(prev => 
                              prev.includes(p.id) ? prev.filter(id => id !== p.id) : [...prev, p.id]
                            );
                          }}
                          className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="truncate">
                          <strong className="text-gray-500 font-mono font-bold mr-1">[{p.module}]</strong>
                          {p.name}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewGroupOpen(false)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-4 py-2.5 rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-4 py-2.5 rounded-lg cursor-pointer"
                >
                  Criar Grupo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
