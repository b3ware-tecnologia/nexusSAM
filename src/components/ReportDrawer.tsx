import { useState } from 'react';
import { 
  X, 
  FileSpreadsheet, 
  ShieldCheck, 
  TrendingDown, 
  Printer, 
  CheckCircle2,
  FileText
} from 'lucide-react';
import { CompanyData } from '../data-types';

interface ReportDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  companyData: CompanyData;
}

export default function ReportDrawer({
  isOpen,
  onClose,
  companyData
}: ReportDrawerProps) {
  const [compiledReportType, setCompiledReportType] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCompile = (type: string) => {
    setCompiledReportType(type);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end select-none">
      
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-[#0b1c30]/40 backdrop-blur-xs transition-opacity" 
        onClick={() => {
          setCompiledReportType(null);
          onClose();
        }}
      />

      {/* Drawer Panel Container */}
      <div className="relative w-full max-w-md h-full bg-[#f8f9ff] border-l border-[#c6c6cf] shadow-2xl flex flex-col z-10 animate-slide-in">
        
        {/* Drawer Header */}
        <div className="p-6 border-b border-[#c6c6cf] flex justify-between items-center bg-white">
          <h3 className="font-headline text-md font-bold text-[#1e284c] flex items-center gap-2">
            <FileText size={18} />
            Central de Relatórios
          </h3>
          <button 
            onClick={() => {
              setCompiledReportType(null);
              onClose();
            }}
            className="p-1.5 hover:bg-[#eff4ff] rounded-full transition-colors cursor-pointer text-[#45464e]"
          >
            <X size={18} />
          </button>
        </div>

        {/* Dynamic Inner body based on whether a report is compiled */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          
          {!compiledReportType ? (
            // Select Report type list
            <div className="space-y-4">
              <p className="text-[10px] font-mono font-bold text-[#45464e] uppercase tracking-widest">
                Selecione o tipo de documento
              </p>

              {/* Report option 1 */}
              <button 
                onClick={() => handleCompile('inventario')}
                className="w-full text-left p-4 bg-white border border-[#c6c6cf]/80 hover:border-[#1e284c] rounded-xl hover:bg-[#eff4ff]/30 transition-all cursor-pointer group space-y-1.5"
              >
                <div className="flex items-center gap-2 text-[#1e284c] group-hover:text-[#04a8ff]">
                  <FileSpreadsheet size={16} />
                  <span className="font-headline text-sm font-bold">Inventário de Software Ativo</span>
                </div>
                <p className="text-xs text-[#45464e]">
                  Gera um compilado completo de todos os ativos de software contratados, valores individuais e validade de contratos.
                </p>
              </button>

              {/* Report option 2 */}
              <button 
                onClick={() => handleCompile('compliance')}
                className="w-full text-left p-4 bg-white border border-[#c6c6cf]/80 hover:border-[#1e284c] rounded-xl hover:bg-[#eff4ff]/30 transition-all cursor-pointer group space-y-1.5"
              >
                <div className="flex items-center gap-2 text-[#1e284c] group-hover:text-[#04a8ff]">
                  <ShieldCheck size={16} />
                  <span className="font-headline text-sm font-bold">Relatório de Conformidade (Audit)</span>
                </div>
                <p className="text-xs text-[#45464e]">
                  Avalia vulnerabilidades regulatórias de sublicenciamento, riscos operacionais e apresenta status de integridade global.
                </p>
              </button>

              {/* Report option 3 */}
              <button 
                onClick={() => handleCompile('economia')}
                className="w-full text-left p-4 bg-white border border-[#c6c6cf]/80 hover:border-[#1e284c] rounded-xl hover:bg-[#eff4ff]/30 transition-all cursor-pointer group space-y-1.5"
              >
                <div className="flex items-center gap-2 text-[#1e284c] group-hover:text-[#04a8ff]">
                  <TrendingDown size={16} />
                  <span className="font-headline text-sm font-bold">Plano de Redução de Custos</span>
                </div>
                <p className="text-xs text-[#45464e]">
                  Identifica e quantifica todos os desperdícios com licenças ociosas, sugerindo cortes e renegociações imediatas.
                </p>
              </button>
            </div>
          ) : (
            // Compiled Report Preview
            <div className="space-y-6 bg-white p-5 rounded-xl border border-[#c6c6cf] text-[#0b1c30]">
              
              {/* Header */}
              <div className="flex justify-between items-start border-b border-[#eff4ff] pb-4">
                <div>
                  <h4 className="font-headline font-black text-[#1e284c] text-sm uppercase">
                    {compiledReportType === 'inventario' && 'Inventário Geral de TI'}
                    {compiledReportType === 'compliance' && 'Auditoria de Conformidade Legal'}
                    {compiledReportType === 'economia' && 'Dossiê de Otimização de Gasto'}
                  </h4>
                  <p className="text-[10px] text-[#45464e] font-mono mt-0.5">UN: {companyData.name}</p>
                </div>
                <CheckCircle2 size={18} className="text-green-600 shrink-0" />
              </div>

              {/* Detailed metrics inside compiled report */}
              <div className="space-y-4 text-xs">
                
                {compiledReportType === 'inventario' && (
                  <>
                    <p className="leading-relaxed">
                      Este documento apresenta o levantamento físico e financeiro de chaves de ativação na rede corporativa.
                    </p>
                    <div className="bg-[#f8f9ff] p-3 rounded border border-[#eff4ff] space-y-1.5 font-mono text-[11px]">
                      <div className="flex justify-between">
                        <span>Cadastrados no sistema:</span>
                        <span className="font-bold text-[#1e284c]">{companyData.licenses.length} Softwares</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total de dispositivos:</span>
                        <span className="font-bold text-[#1e284c]">{companyData.totalDispositivos || 0} Máquinas</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Valor total de contratos:</span>
                        <span className="font-bold text-green-600">
                          {formatCurrency(companyData.licenses.reduce((a, b) => a + b.custoMensal, 0))}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-1 border-t border-[#eff4ff] pt-3">
                      <p className="font-bold text-[#1e284c]">Acessos Ativos:</p>
                      {companyData.licenses.map((lic, i) => (
                        <div key={i} className="flex justify-between text-[11px] py-0.5">
                          <span className="truncate max-w-[200px]">{lic.softwareName}</span>
                          <span className="font-semibold">{formatCurrency(lic.custoMensal)}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {compiledReportType === 'compliance' && (
                  <>
                    <p className="leading-relaxed">
                      Avaliação regulatória de risco de infraestrutura digital.
                    </p>
                    <div className="bg-[#f8f9ff] p-3 rounded border border-[#eff4ff] space-y-1.5 font-mono text-[11px]">
                      <div className="flex justify-between">
                        <span>Taxa Integridade Global:</span>
                        <span className="font-bold text-[#1e284c]">{companyData.complianceRate}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Instalações Regulares:</span>
                        <span className="font-bold text-green-600">
                          {companyData.licenses.filter(l => l.status !== 'Não Conforme').length} de {companyData.licenses.length}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2 border-t border-[#eff4ff] pt-3">
                      <p className="font-bold text-[#1e284c]">Ponto de Atenção:</p>
                      {companyData.licenses.filter(l => l.status === 'Não Conforme').length === 0 ? (
                        <p className="text-[11px] text-green-600 font-semibold">Tudo conforme! Risco zero avaliado.</p>
                      ) : (
                        companyData.licenses.filter(l => l.status === 'Não Conforme').map((lic, i) => (
                          <p key={i} className="text-[11px] text-[#ba1a1a] font-semibold">
                            ⚠️ {lic.softwareName}: Instalações excedendo licenças compradas.
                          </p>
                        ))
                      )}
                    </div>
                  </>
                )}

                {compiledReportType === 'economia' && (
                  <>
                    <p className="leading-relaxed">
                      Plano estrutural para enxugamento de despesas recorrentes com assinaturas de software.
                    </p>
                    <div className="bg-[#f8f9ff] p-3 rounded border border-[#eff4ff] space-y-1.5 font-mono text-[11px]">
                      <div className="flex justify-between">
                        <span>Economia Potencial Levantada:</span>
                        <span className="font-bold text-green-600">
                          {formatCurrency(companyData.licenses.reduce((a, b) => a + b.potencialEconomia, 0))}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Gasto Atual Mensal:</span>
                        <span className="font-bold text-[#ba1a1a]">
                          {formatCurrency(companyData.licenses.reduce((a, b) => a + b.custoMensal, 0))}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-1.5 border-t border-[#eff4ff] pt-3">
                      <p className="font-bold text-[#1e284c]">Plano de Corte sugerido:</p>
                      {companyData.licenses.filter(l => l.status === 'Ociosa').map((lic, i) => (
                        <div key={i} className="flex justify-between text-[11px] py-0.5">
                          <span>{lic.softwareName}</span>
                          <span className="font-bold text-green-600">-{formatCurrency(lic.potencialEconomia)}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}

              </div>

              {/* Action buttons on compiled report */}
              <div className="flex gap-2 pt-4 border-t border-[#eff4ff]">
                <button
                  onClick={() => window.print()}
                  className="flex-1 bg-[#1e284c] text-white hover:bg-[#343e63] py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Printer size={13} />
                  Imprimir
                </button>
                <button
                  onClick={() => setCompiledReportType(null)}
                  className="flex-1 border border-[#c6c6cf] text-[#45464e] hover:bg-[#f8f9ff] py-2 rounded-lg text-xs font-bold cursor-pointer text-center"
                >
                  Voltar
                </button>
              </div>

            </div>
          )}

        </div>

        {/* Drawer Footer info */}
        <div className="p-6 bg-[#eff4ff]/60 border-t border-[#c6c6cf]">
          <p className="text-[10px] text-[#45464e] text-center font-medium">
            Relatórios compilados dinamicamente em tempo real com base na base de inventário ativa.
          </p>
        </div>

      </div>

    </div>
  );
}
