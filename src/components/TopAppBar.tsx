import { useState, useRef, useEffect } from 'react';
import { Search, Bell, Settings, ChevronDown, Check, Menu } from 'lucide-react';
import { CompanyData } from '../data-types';

interface TopAppBarProps {
  companies: CompanyData[];
  selectedCompany: CompanyData;
  onSelectCompany: (id: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activeAlertsCount: number;
  onNavigateToAlerts: () => void;
  onNavigateToLicenses: () => void;
  onNavigateToOverview: () => void;
  currentTab: string;
}

export default function TopAppBar({
  companies,
  selectedCompany,
  onSelectCompany,
  searchQuery,
  setSearchQuery,
  activeAlertsCount,
  onNavigateToAlerts,
  onNavigateToLicenses,
  onNavigateToOverview,
  currentTab
}: TopAppBarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="w-full h-14 border-b border-gray-200 bg-white flex justify-between items-center px-6 sticky top-0 z-40 select-none shadow-sm">
      <div className="flex items-center gap-8 h-full">
        {/* Company Name */}
        <div className="flex items-center gap-3">
          <Menu size={18} className="text-gray-500 cursor-pointer lg:hidden" />
          <h2 className="font-headline text-[15px] font-bold text-gray-800 tracking-tight flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00B551]"></span>
            {selectedCompany.name}
          </h2>
        </div>

        {/* Dynamic Navigation Sub-header Tabs */}
        <div className="hidden md:flex gap-6 items-center h-full pt-0.5">
          <button 
            onClick={onNavigateToOverview}
            className={`font-sans text-[13px] font-semibold transition-all h-full flex items-center border-b-[3px] px-1 ${
              currentTab === 'visao-geral' || currentTab === 'conformidade' || currentTab === 'alertas'
                ? 'text-[#00B551] border-[#00B551]'
                : 'text-gray-500 border-transparent hover:text-gray-800'
            }`}
          >
            Dashboard
          </button>
          <button 
            onClick={onNavigateToLicenses}
            className={`font-sans text-[13px] font-semibold transition-all h-full flex items-center border-b-[3px] px-1 ${
              currentTab === 'licencas' || currentTab === 'otimizacao' || currentTab === 'contratos'
                ? 'text-[#00B551] border-[#00B551]'
                : 'text-gray-500 border-transparent hover:text-gray-800'
            }`}
          >
            Aplicações
          </button>
        </div>
      </div>

      <div className="flex items-center gap-5">
        {/* Universal Search Input */}
        <div className="relative group hidden lg:block">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-gray-100 text-xs text-gray-800 placeholder-gray-500 border border-transparent rounded-sm pl-9 pr-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#00B551] focus:bg-white focus:border-[#00B551] w-60 transition-all"
            placeholder="Buscar ativos, licenças, usuários..."
          />
          <Search 
            size={14} 
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#00B551] transition-colors" 
          />
        </div>

        {/* Top Control Buttons */}
        <div className="flex items-center gap-1 border-r border-gray-200 pr-4">
          {/* Notifications Trigger */}
          <button 
            onClick={onNavigateToAlerts}
            className="p-1.5 hover:bg-gray-100 rounded-sm transition-colors text-gray-600 hover:text-gray-900 relative cursor-pointer"
            title="Ver Alertas"
          >
            <Bell size={16} />
            {activeAlertsCount > 0 && (
              <span className="absolute top-0 right-0 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-600 text-[9px] font-bold text-white shadow-sm ring-2 ring-white">
                {activeAlertsCount}
              </span>
            )}
          </button>

          {/* Settings Mock Toggle */}
          <button 
            className="p-1.5 hover:bg-gray-100 rounded-sm transition-colors text-gray-600 hover:text-gray-900 cursor-pointer"
            title="Configurações"
            onClick={() => alert('Parâmetros do sistema abertos.')}
          >
            <Settings size={16} />
          </button>
        </div>

        {/* Company Interactive Selector Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="bg-white text-gray-800 pl-3 pr-2 py-1.5 rounded-sm text-xs font-semibold hover:bg-gray-50 transition-colors flex items-center gap-2 border border-gray-200 cursor-pointer shadow-sm"
          >
            <span>Trocar Empresa</span>
            <ChevronDown size={14} className={`text-gray-500 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-sm shadow-lg z-50 overflow-hidden divide-y divide-gray-100">
              <div className="px-3 py-2 bg-gray-50/80">
                <span className="text-[10px] font-mono text-gray-500 font-bold uppercase tracking-widest">Organizações</span>
              </div>
              <div className="py-1">
                {companies.map((c) => {
                  const isSelected = c.id === selectedCompany.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => {
                        onSelectCompany(c.id);
                        setDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors cursor-pointer ${
                        isSelected 
                          ? 'bg-[#00B551]/5 text-[#00B551] font-semibold' 
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <span className="truncate pr-2">{c.name}</span>
                      {isSelected && <Check size={14} className="text-[#00B551] shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
