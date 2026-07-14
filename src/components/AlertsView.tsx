import { useState } from 'react';
import { 
  AlertTriangle, 
  CheckCircle, 
  ShieldAlert, 
  Clock, 
  Filter, 
  Check, 
  ShieldCheck,
  TrendingUp,
  X
} from 'lucide-react';
import { CompanyData, SystemAlert } from '../data-types';

interface AlertsViewProps {
  companyData: CompanyData;
  onResolveAlert: (id: string) => void;
  onResolveAllAlerts: () => void;
}

export default function AlertsView({
  companyData,
  onResolveAlert,
  onResolveAllAlerts
}: AlertsViewProps) {
  const [severityFilter, setSeverityFilter] = useState<string>('Todos');
  const [typeFilter, setTypeFilter] = useState<string>('Todos');

  const activeAlerts = companyData.alerts.filter(alt => !alt.resolved);

  // Apply filters
  const filteredAlerts = activeAlerts.filter(alt => {
    const matchesSeverity = severityFilter === 'Todos' || alt.severity === severityFilter;
    const matchesType = typeFilter === 'Todos' || alt.type === typeFilter;
    return matchesSeverity && matchesType;
  });

  const getSeverityBadge = (severity: 'high' | 'medium' | 'low') => {
    switch(severity) {
      case 'high':
        return <span className="bg-red-50 text-[#ba1a1a] border border-red-200 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full">Alta Prioridade</span>;
      case 'medium':
        return <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full">Média Prioridade</span>;
      case 'low':
        return <span className="bg-[#eff4ff] text-[#1e284c] border border-blue-100 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full">Baixa Prioridade</span>;
    }
  };

  const getAlertIcon = (type: 'security' | 'compliance' | 'cost') => {
    switch(type) {
      case 'security':
        return <ShieldAlert size={18} className="text-[#ba1a1a]" />;
      case 'compliance':
        return <AlertTriangle size={18} className="text-amber-500" />;
      case 'cost':
        return <TrendingUp size={18} className="text-[#04a8ff]" />;
    }
  };

  return (
    <div className="space-y-6 select-none animate-fade-in">
      
      {/* Filters Toolbar */}
      <div className="bg-white p-5 rounded-xl border border-[#c6c6cf] shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        
        {/* Multiselect inputs */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Severity Filter */}
          <div className="flex items-center gap-1.5">
            <Filter size={14} className="text-[#45464e]" />
            <span className="text-xs font-semibold text-[#45464e]">Severidade:</span>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-[#eff4ff] hover:bg-[#dce9ff] text-xs font-semibold text-[#1e284c] border-none rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-[#1e284c] cursor-pointer"
            >
              <option value="Todos">Todas Prioridades</option>
              <option value="high">Prioridade Alta</option>
              <option value="medium">Prioridade Média</option>
              <option value="low">Prioridade Baixa</option>
            </select>
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-1.5 ml-2">
            <span className="text-xs font-semibold text-[#45464e]">Tipo de Ocorrência:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-[#eff4ff] hover:bg-[#dce9ff] text-xs font-semibold text-[#1e284c] border-none rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-[#1e284c] cursor-pointer"
            >
              <option value="Todos">Todos Tipos</option>
              <option value="security">Segurança TI</option>
              <option value="compliance">Conformidade Legal</option>
              <option value="cost">Desperdício Financeiro</option>
            </select>
          </div>

        </div>

        {/* Clear All action button */}
        {activeAlerts.length > 0 && (
          <button
            onClick={onResolveAllAlerts}
            className="text-xs font-bold text-[#ba1a1a] bg-red-50 hover:bg-red-100 border border-red-200 px-3.5 py-2 rounded-lg cursor-pointer transition-colors active:scale-97"
          >
            Limpar Todos os Alertas
          </button>
        )}
      </div>

      {/* List of active alerts */}
      <div className="space-y-4">
        {filteredAlerts.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-xl border border-[#c6c6cf] shadow-sm flex flex-col items-center justify-center space-y-3">
            <ShieldCheck size={44} className="text-green-500" />
            <h4 className="font-headline text-md font-bold text-[#1e284c]">Nenhum Alerta Pendente</h4>
            <p className="text-xs text-[#45464e] max-w-sm">
              Sua infraestrutura de software está limpa e operando dentro de conformidade excelente, sem incidentes ativos.
            </p>
          </div>
        ) : (
          filteredAlerts.map((alt) => (
            <div 
              key={alt.id}
              className={`bg-white p-5 rounded-xl border shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-all hover:translate-x-1 duration-150 ${
                alt.severity === 'high' 
                  ? 'border-l-4 border-l-[#ba1a1a] border-[#c6c6cf]' 
                  : alt.severity === 'medium' 
                    ? 'border-l-4 border-l-amber-500 border-[#c6c6cf]' 
                    : 'border-l-4 border-l-[#04a8ff] border-[#c6c6cf]'
              }`}
            >
              {/* Left Side Info */}
              <div className="flex gap-4 items-start">
                <div className={`p-2 rounded-lg mt-0.5 shrink-0 ${
                  alt.severity === 'high' ? 'bg-red-50' : alt.severity === 'medium' ? 'bg-amber-50' : 'bg-[#eff4ff]'
                }`}>
                  {getAlertIcon(alt.type)}
                </div>
                
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="font-headline text-sm font-bold text-[#0b1c30]">{alt.softwareName}</h4>
                    {getSeverityBadge(alt.severity)}
                    <span className="text-[10px] font-mono text-[#76767f] uppercase font-bold bg-[#f8f9ff] px-2 py-0.5 rounded border border-[#c6c6cf]/50">
                      {alt.type === 'security' ? 'Segurança' : alt.type === 'compliance' ? 'Conformidade' : 'Financeiro'}
                    </span>
                  </div>
                  <p className="text-xs text-[#45464e] leading-relaxed font-medium">
                    {alt.message}
                  </p>
                  <div className="flex items-center gap-1 text-[10px] text-[#76767f] font-mono">
                    <Clock size={11} />
                    <span>{alt.date}</span>
                  </div>
                </div>
              </div>

              {/* Action - Mark as Resolved */}
              <button
                onClick={() => onResolveAlert(alt.id)}
                className="bg-[#eff4ff] hover:bg-[#dce9ff] text-[#1e284c] border border-[#c6c6cf]/60 hover:border-[#1e284c] text-xs font-bold px-3.5 py-2 rounded-lg flex items-center gap-1.5 cursor-pointer self-start sm:self-center transition-all active:scale-95 shrink-0"
                title="Marcar este evento como solucionado para retirar do dashboard"
              >
                <Check size={14} />
                Solucionar
              </button>

            </div>
          ))
        )}
      </div>

    </div>
  );
}
