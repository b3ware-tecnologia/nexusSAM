import { useState, useEffect, useMemo } from 'react';
import { ActiveTab, SystemAlert } from '../data-types';
import { 
  LayoutDashboard, 
  Briefcase, 
  Eye, 
  FileSpreadsheet, 
  AppWindow, 
  Database, 
  Laptop, 
  Cloud, 
  Settings,
  ShoppingCart,
  ClipboardList,
  Users,
  FileText,
  Filter,
  Cpu,
  Search,
  ChevronsLeft,
  ChevronRight,
  User,
  Activity,
  Zap,
  CheckCircle,
  Bell,
  Lock,
  Workflow,
  TrendingDown,
  ShieldCheck,
  Container,
  Tags,
  Terminal,
  Server,
  Shield,
  BarChart3,
  Puzzle
} from 'lucide-react';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  activeAlertsCount: number;
  onOpenReportDrawer: () => void;
}

type PrimaryMenuId = 'dashboards' | 'it_visibility' | 'applications' | 'inventory' | 'automation' | 'procurement' | 'requests' | 'organization' | 'reporting' | 'data_collection' | 'administration';

type SubMenuItem = {
  id: ActiveTab | string;
  label: string;
};

type SubMenuGroup = {
  title: string;
  items: SubMenuItem[];
};

type PrimaryMenuItem = {
  id: PrimaryMenuId;
  label: string;
  icon: any;
  subgroups?: SubMenuGroup[];
  onClickOverride?: ActiveTab;
};

const primaryMenuItems: PrimaryMenuItem[] = [
  { 
    id: 'dashboards', 
    label: 'Home', 
    icon: LayoutDashboard,
    onClickOverride: 'visao-geral'
  },
  { 
    id: 'it_visibility', 
    label: 'Visibilidade de TI', 
    icon: Eye,
    subgroups: [
      {
        title: 'STATUS DE VISIBILIDADE',
        items: [
          { id: 'alertas', label: 'Alertas e Monitoramento' }
        ]
      },
      {
        title: 'GERENCIAMENTO DE LICENÇAS',
        items: [
          { id: 'licencas', label: 'Inventário de Software' }
        ]
      },
      {
        title: 'ATIVOS DE HARDWARE',
        items: [
          { id: 'dispositivos', label: 'Endpoints e Servidores' }
        ]
      },
      {
        title: 'GERENCIAMENTO DE SAAS',
        items: [
          { id: 'saas-visibility', label: 'Descoberta de SaaS' }
        ]
      },
      {
        title: 'AMBIENTES EM NUVEM',
        items: [
          { id: 'ambientes-cloud', label: 'Ambientes Cloud' },
          { id: 'integracoes', label: 'Integrações' },
          { id: 'nuvem', label: 'Provedores Cloud' },
          { id: 'containers', label: 'Containers' }
        ]
      }
    ]
  },
  { id: 'applications', label: 'Aplicações e Evidências', icon: AppWindow },
  { id: 'inventory', label: 'Inventário', icon: Database },
  { id: 'automation', label: 'Automação', icon: Cpu },
  { 
    id: 'procurement', 
    label: 'Compras', 
    icon: ShoppingCart,
    subgroups: [
      {
        title: 'AQUISIÇÕES',
        items: [
          { id: 'contratos', label: 'Contratos e Finanças' }
        ]
      }
    ]
  },
  { id: 'requests', label: 'Solicitações de Ativos', icon: ClipboardList },
  { id: 'organization', label: 'Organização', icon: Users },
  { 
    id: 'reporting', 
    label: 'Relatórios', 
    icon: FileText,
    subgroups: [
      {
        title: 'RELATÓRIOS E CONFORMIDADE',
        items: [
          { id: 'conformidade', label: 'Compliance (Auditoria)' },
          { id: 'otimizacao', label: 'Otimização de Custos' },
          { id: 'relatorios', label: 'Relatórios' },
          { id: 'custom-fields', label: 'Custom Fields' },
          { id: 'diagnostico', label: 'Diagnóstico' }
        ]
      }
    ]
  },
  { 
    id: 'data_collection', 
    label: 'Coleta de Dados', 
    icon: Filter,
    subgroups: [
      {
        title: 'PROCESSAR DADOS',
        items: [
          { id: 'reconcile', label: 'Reconciliar' }
        ]
      },
      {
        title: 'TAREFAS DE INVENTÁRIO DE ATIVOS',
        items: [
          { id: 'discovery_rules', label: 'Regras de Descoberta' },
          { id: 'beacons', label: 'Beacons' },
          { id: 'sap_landscapes', label: 'Sistemas SAP' },
          { id: 'inventory_settings', label: 'Configurações de Inventário' },
          { id: 'data_imports', label: 'Importação de Dados' },
          { id: 'integracoes', label: 'Integrações e Conectores' }
        ]
      },
      {
        title: 'TAREFAS DE VISIBILIDADE',
        items: [
          { id: 'inventory_targets', label: 'Alvos de Inventário' },
          { id: 'inventory_groups', label: 'Grupos de Inventário' },
          { id: 'task_lists', label: 'Listas de Tarefas' },
          { id: 'external_connections', label: 'Conexões Externas' },
        ]
      }
    ]
  },
  { 
    id: 'administration', 
    label: 'Administração', 
    icon: Settings,
    subgroups: [
      {
        title: 'TAREFAS ADMINISTRATIVAS',
        items: [
          { id: 'politicas', label: 'Políticas de SAM' },
          { id: 'admin', label: 'Administração (RBAC)' }
        ]
      }
    ]
  },
];

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  activeAlertsCount,
  onOpenReportDrawer 
}: SidebarProps) {
  
  const [activePrimaryMenu, setActivePrimaryMenu] = useState<PrimaryMenuId>('dashboards');
  const [isSecondaryOpen, setIsSecondaryOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Only automatically switch primary menu if there's no search active
    if (searchQuery.trim() !== '') return;

    // Find the primary menu that contains the currently active tab
    const parentMenu = primaryMenuItems.find(menu => 
      menu.onClickOverride === activeTab ||
      menu.subgroups?.some(group => 
        group.items.some(item => item.id === activeTab)
      )
    );
    if (parentMenu) {
      setActivePrimaryMenu(prev => {
        // Do not force open the secondary sidebar on tab switch from external triggers.
        // Instead, keep it closed so it doesn't overlap or clutter the screen.
        if (prev !== parentMenu.id) {
          setIsSecondaryOpen(false);
        }
        return parentMenu.id;
      });
    }
  }, [activeTab, searchQuery]);

  const activeMenuData = primaryMenuItems.find(m => m.id === activePrimaryMenu);

  // Search logic
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    const results: { id: string | ActiveTab, label: string, isPrimary: boolean, parentId?: PrimaryMenuId, icon?: any }[] = [];
    
    primaryMenuItems.forEach(menu => {
      // Check primary menu label
      if (menu.label.toLowerCase().includes(query)) {
        results.push({ 
          id: menu.id, 
          label: menu.label, 
          isPrimary: true,
          icon: menu.icon,
          parentId: menu.id
        });
      }
      // Check submenu labels
      menu.subgroups?.forEach(group => {
        group.items.forEach(item => {
          if (item.label.toLowerCase().includes(query)) {
            results.push({
              id: item.id,
              label: item.label,
              isPrimary: false,
              parentId: menu.id
            });
          }
        });
      });
    });
    return results;
  }, [searchQuery]);

  const highlightText = (text: string, highlight: string) => {
    if (!highlight.trim()) return text;
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === highlight.toLowerCase() 
        ? <span key={i} className="text-[#00B551] font-bold">{part}</span> 
        : part
    );
  };

  const handleNavClick = (id: string, isPrimary: boolean, parentId?: PrimaryMenuId) => {
    if (isPrimary) {
      const menu = primaryMenuItems.find(m => m.id === id);
      if (menu) {
        if (activePrimaryMenu === menu.id) {
          setIsSecondaryOpen(prev => !prev);
        } else {
          setActivePrimaryMenu(menu.id);
          setIsSecondaryOpen(true);
          if (menu.onClickOverride) {
            setActiveTab(menu.onClickOverride);
          }
        }
      }
    } else {
      if (parentId) {
        setActivePrimaryMenu(prev => {
          if (prev !== parentId) {
            setIsSecondaryOpen(true);
          }
          return parentId;
        });
      }
      // Assuming valid ActiveTab ids are present in the list
      if (['visao-geral', 'licencas', 'saas-visibility', 'contratos', 'dispositivos', 'otimizacao', 'conformidade', 'politicas', 'alertas', 'integracoes', 'ambientes-cloud', 'nuvem', 'containers', 'admin', 'relatorios', 'custom-fields', 'diagnostico'].includes(id)) {
        setActiveTab(id as ActiveTab);
        setIsSecondaryOpen(false);
      }
    }
    setSearchQuery('');
  };

  return (
    <aside className="w-[230px] h-full flex shrink-0 select-none relative z-50">
      {/* 1. Primary Left Sidebar */}
      <div className="w-[230px] h-full bg-[#0B1320] flex flex-col border-r border-[#1C2538] shrink-0">
        
        {/* Brand Logo */}
        <div className="h-16 flex items-center px-4 shrink-0 pt-2 pb-2">
          <h1 className="text-[21px] font-black text-white flex items-center tracking-wider font-sans uppercase">
            Nexus<span className="text-[#00B551] font-medium text-[21px]">SAM</span>
          </h1>
        </div>

        {/* Search */}
        <div className="px-3 pb-4 pt-1 shrink-0">
          <div className="relative group">
            <input 
              type="text" 
              placeholder="Pesquisar..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#1C2538] text-white text-[13px] rounded-sm py-1.5 pl-3 pr-8 outline-none border border-transparent focus:border-[#00B551] transition-colors placeholder-[#426488]" 
            />
            <Search size={14} className="absolute right-2.5 top-2 text-[#426488] group-focus-within:text-[#00B551] transition-colors" />
          </div>
        </div>

        {/* Primary Nav List or Search Results */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-2 py-1 space-y-[2px]">
          {searchQuery.trim() !== '' ? (
            // Search Results
            <div className="space-y-1">
              <h3 className="px-2 text-[10px] font-bold text-[#8E95A3] uppercase tracking-widest mb-2">
                Resultados
              </h3>
              {searchResults.length === 0 ? (
                <p className="px-2 text-xs text-[#426488]">Nenhum item encontrado.</p>
              ) : (
                searchResults.map((result, idx) => {
                  const Icon = result.icon || ChevronRight;
                  return (
                    <button 
                      key={`${result.id}-${idx}`}
                      onClick={() => handleNavClick(result.id, result.isPrimary, result.parentId)}
                      className="w-full text-left px-3 py-2 flex items-center gap-3 text-[13px] font-medium transition-colors rounded-sm text-[#8E95A3] hover:text-white hover:bg-[#1C2538]"
                    >
                      {result.isPrimary ? (
                        <Icon size={14} className="text-[#426488]" />
                      ) : (
                        <div className="w-[14px] flex justify-center"><div className="w-1 h-1 rounded-full bg-[#426488]" /></div>
                      )}
                      <span className="truncate">{highlightText(result.label, searchQuery)}</span>
                    </button>
                  )
                })
              )}
            </div>
          ) : (
            // Normal Primary Nav
            primaryMenuItems.map(item => {
              const isActive = activePrimaryMenu === item.id;
              const IconComponent = item.icon;
              return (
                <button 
                  key={item.id}
                  onClick={() => {
                    if (isActive) {
                      setIsSecondaryOpen(prev => !prev);
                    } else {
                      setActivePrimaryMenu(item.id);
                      setIsSecondaryOpen(true);
                      if (item.onClickOverride) {
                        setActiveTab(item.onClickOverride);
                      }
                    }
                  }}
                  className={`w-full text-left px-3 py-[9px] flex items-center gap-3 text-[13px] font-medium transition-colors rounded-sm ${
                    isActive 
                      ? 'bg-[#1C2538] text-white' 
                      : 'text-[#8E95A3] hover:text-[#D1D5DB] hover:bg-[#1C2538]/50'
                  }`}
                >
                  <IconComponent size={16} className={isActive ? 'text-white' : 'text-[#8E95A3]'} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })
          )}
        </div>

        {/* Collapse button at bottom */}
        <div className="p-3 border-t border-[#1C2538] shrink-0 flex justify-end">
          <button 
            onClick={() => setIsSecondaryOpen(!isSecondaryOpen)}
            className="text-[#8E95A3] hover:text-white transition-colors cursor-pointer p-1"
            title="Toggle Submenu"
          >
            <ChevronsLeft size={16} className={`transition-transform duration-200 ${isSecondaryOpen ? '' : 'rotate-180'}`} />
          </button>
        </div>
      </div>

      {/* 2. Secondary Right Sidebar (Submenus) */}
      {!searchQuery && activeMenuData?.subgroups && isSecondaryOpen && (
        <div className="w-[260px] h-full bg-[#0B1320] flex flex-col border-r border-[#1C2538] shrink-0 shadow-[4px_0_12px_rgba(0,0,0,0.5)] absolute left-full top-0">
          <div className="flex-1 overflow-y-auto custom-scrollbar pt-5 pb-6">
            {activeMenuData.subgroups.map((group, groupIdx) => (
              <div key={groupIdx} className="mb-7">
                <h3 className="px-5 text-[11px] font-bold text-[#b4b7c2] uppercase tracking-widest mb-3 pb-2 border-b border-[#1C2538]/60">
                  {group.title}
                </h3>
                <div className="flex flex-col space-y-[1px] px-2">
                  {group.items.map(item => {
                    const isTabActive = activeTab === item.id;
                    return (
                      <button 
                        key={item.id}
                        onClick={() => {
                          if (['visao-geral', 'licencas', 'saas-visibility', 'contratos', 'dispositivos', 'otimizacao', 'conformidade', 'politicas', 'alertas', 'integracoes', 'ambientes-cloud', 'nuvem', 'containers', 'admin', 'relatorios', 'custom-fields', 'diagnostico'].includes(item.id)) {
                            setActiveTab(item.id as ActiveTab);
                            setIsSecondaryOpen(false); // Close submenu!
                          }
                        }}
                        className={`w-full text-left px-3 py-2 text-[13px] rounded-sm transition-colors relative ${
                          isTabActive 
                            ? 'text-white font-medium bg-[#1C2538]' 
                            : 'text-[#8E95A3] hover:text-white hover:bg-[#1C2538]/40'
                        }`}
                      >
                        {isTabActive && (
                          <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-[#00B551] rounded-l-sm" />
                        )}
                        <span className="truncate block ml-1">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          
          {/* User profile minimal at bottom of secondary */}
          <div className="p-4 border-t border-[#1C2538] bg-[#0B1320] shrink-0">
            <div className="flex items-center justify-between group cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-[#1C2538] flex items-center justify-center border border-[#2A364E]">
                  <User size={14} className="text-slate-300" />
                </div>
                <div className="overflow-hidden">
                  <p className="font-sans text-[12px] font-semibold truncate text-slate-200">Admin Gestor</p>
                  <p className="font-mono text-[10px] text-slate-500 truncate group-hover:text-slate-400">Configurações</p>
                </div>
              </div>
              <Settings size={14} className="text-slate-500 group-hover:text-slate-300 transition-colors" />
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
