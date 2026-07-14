import { useState } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Award, 
  Download, 
  CheckCircle, 
  TrendingUp, 
  Printer, 
  X,
  FileText
} from 'lucide-react';
import { CompanyData, License } from '../data-types';

interface ComplianceViewProps {
  companyData: CompanyData;
  onRegularizeLicense: (id: string) => void;
}

export default function ComplianceView({
  companyData,
  onRegularizeLicense
}: ComplianceViewProps) {
  const [certificateOpen, setCertificateOpen] = useState(false);

  const licenses = companyData.licenses;
  const nonCompliant = licenses.filter(lic => lic.status === 'Não Conforme');
  const compliantCount = licenses.length - nonCompliant.length;
  const complianceRate = licenses.length > 0 
    ? Math.round((compliantCount / licenses.length) * 100) 
    : 100;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 select-none animate-fade-in">
      
      {/* Overview Metric Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Compliance Rate Card */}
        <div className="bg-white p-5 rounded-sm border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <span className="font-mono text-[9px] text-slate-500 font-bold uppercase tracking-wider">Taxa de Conformidade</span>
            <ShieldCheck size={20} className={complianceRate >= 90 ? 'text-[#00B551]' : 'text-amber-600'} />
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="font-headline text-4xl font-black text-slate-900">{complianceRate}%</h3>
            <span className="text-xs text-slate-500 font-semibold">da infraestrutura</span>
          </div>
          <div className="mt-4 bg-slate-100 h-2 rounded-sm overflow-hidden">
            <div 
              className="bg-[#00B551] h-full rounded-sm transition-all duration-1000 ease-out" 
              style={{ width: `${complianceRate}%` }}
            />
          </div>
        </div>

        {/* Regularized Items count */}
        <div className="bg-white p-5 rounded-sm border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <span className="font-mono text-[9px] text-slate-500 font-bold uppercase tracking-wider">Ativos Conformes</span>
            <CheckCircle size={20} className="text-[#00B551]" />
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="font-headline text-4xl font-black text-[#00B551]">{compliantCount}</h3>
            <span className="text-xs text-slate-500 font-semibold">softwares homologados</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-4 font-semibold">Contratos e instalações em paridade</p>
        </div>

        {/* Audit status and certification generator action */}
        <div className="bg-white p-5 rounded-sm border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <span className="font-mono text-[9px] text-slate-500 font-bold uppercase tracking-wider">Auditoria de Softwares</span>
            <Award size={20} className="text-slate-800" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900">Auditoria Ativa</h4>
            <p className="text-[10px] text-slate-500 mt-1">Status: Homologado pelo sistema Governança Híbrida</p>
          </div>
          <button
            onClick={() => setCertificateOpen(true)}
            className="w-full mt-4 bg-[#00B551] text-white hover:bg-[#00cd5c] py-2 px-4 rounded-sm text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer shadow-sm border border-transparent hover:border-[#00B551]"
          >
            <FileText size={14} />
            Gerar Certificado de Auditoria
          </button>
        </div>

      </div>

      {/* Non-compliant list of software needing regularization */}
      <div className="bg-white rounded-sm border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center gap-2">
          <ShieldAlert className="text-red-600" size={20} />
          <div>
            <h3 className="font-headline text-md font-bold text-slate-900">Ações Corretivas Necessárias</h3>
            <p className="text-xs text-slate-500 mt-1">Softwares instalados na rede local sem licenças válidas contratadas junto ao fabricante.</p>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {nonCompliant.length === 0 ? (
            <div className="p-10 text-center flex flex-col items-center justify-center space-y-3">
              <ShieldCheck size={44} className="text-[#00B551] animate-bounce" />
              <h4 className="font-headline text-md font-bold text-slate-900">Conformidade Legal Máxima!</h4>
              <p className="text-xs text-slate-500 max-w-md">
                Nenhum desvio ou risco legal de sub-licenciamento detectado. Todos os softwares estão devidamente faturados e regulares.
              </p>
            </div>
          ) : (
            nonCompliant.map((lic) => (
              <div key={lic.id} className="p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-6 hover:bg-slate-50 transition-colors border-l-[3px] border-l-transparent hover:border-l-red-600">
                
                {/* Details */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-headline text-md font-bold text-slate-900">{lic.softwareName}</h4>
                    <span className="text-[10px] bg-red-50 text-red-700 border border-red-100 font-black px-2 py-0.5 rounded-sm uppercase tracking-wide">
                      Inconformidade Ativa
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">
                    Detectamos <strong>{lic.qtyOciosa || 8} instalações</strong> em uso no setor operacional sem chaves de ativação registradas no portal do fabricante <strong>{lic.vendor}</strong>.
                  </p>
                  <p className="text-xs text-red-600 font-semibold">
                    Risco financeiro avaliado: Multa potencial de até 3x o valor do software.
                  </p>
                </div>

                {/* Regularization Trigger */}
                <button
                  onClick={() => onRegularizeLicense(lic.id)}
                  className="bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 text-xs font-bold px-4 py-2 rounded-sm flex items-center gap-2 shrink-0 transition-all active:scale-95 cursor-pointer shadow-sm"
                  title="Comprar licenças em falta ou desinstalar para zerar desvio regulatório"
                >
                  <ShieldCheck size={14} />
                  Regularizar Situação
                </button>

              </div>
            ))
          )}
        </div>
      </div>

      {/* Audit Certificate Dialog Modal */}
      {certificateOpen && (
        <div className="fixed inset-0 bg-[#0b1c30]/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border-2 border-[#1e284c] shadow-2xl w-full max-w-2xl overflow-hidden animate-scale-in">
            
            {/* Header print control */}
            <div className="bg-[#eff4ff] px-6 py-4 border-b border-[#c6c6cf] flex justify-between items-center print:hidden">
              <span className="text-xs font-black text-[#1e284c] uppercase font-mono tracking-widest">NexusSAM Software Intelligence</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="bg-[#1e284c] text-white hover:bg-[#343e63] px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Printer size={14} />
                  Imprimir Certificado
                </button>
                <button
                  onClick={() => setCertificateOpen(false)}
                  className="p-1 hover:bg-[#cde5ff] rounded-full transition-colors text-[#45464e] cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Certificate Print-Ready layout */}
            <div className="p-10 space-y-8 bg-white border-8 border-double border-[#eff4ff] m-4 rounded-xl text-center relative font-sans">
              
              {/* Background watermark */}
              <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
                <ShieldCheck size={280} className="text-[#1e284c]" />
              </div>

              {/* Header block */}
              <div className="space-y-2 relative">
                <div className="flex justify-center mb-4">
                  <img 
                    alt="NexusSAM Logo" 
                    className="w-12 h-12 object-contain" 
                    src="https://lh3.googleusercontent.com/aida/AP1WRLv21RC3hZR15qTXu4xPCgwGhIJiE7iuzHqF2MLI7zLtjeuTqop9BLrvBCoFCc13flCCrkewkjU-6bEgY4cj60BVdDmsftH_dkI3NWFAYn6bnBQOcruXYOSWiT6sSYCTopMBbjvVM3nFf4sTBVgwTm1W3KMFucvaLc8bym5nV-gDxOEpuN7fDctrg17vWQnZDhC6nGtp6Ul1VSCOC1njuddxs1Yev4X6xGvi3DDYhymYyrPz-fwPqGZVrNQ"
                  />
                </div>
                <h1 className="font-headline text-2xl font-black text-[#1e284c] uppercase tracking-wider">Certificado de Conformidade de Ativos</h1>
                <p className="font-mono text-[10px] text-[#45464e] font-bold tracking-widest uppercase">Licenciamento de Software e Compliance TI</p>
              </div>

              {/* Body statement */}
              <div className="space-y-4 max-w-lg mx-auto text-sm text-[#0b1c30] leading-relaxed relative">
                <p>
                  Certificamos para os devidos fins regulatórios que a infraestrutura de TI da unidade de negócio 
                  <strong className="text-[#1e284c] block text-lg font-headline font-black my-1">{companyData.name}</strong>
                  foi devidamente submetida à auditoria de conformidade digital e análise de inventário de licenças nesta data.
                </p>
                <p>
                  O processo de varredura ativa de agentes constatou paridade de ativos em conformidade total de 
                  <strong className="text-green-600"> {complianceRate}%</strong>, validado conforme contratos e termos de licença dos fabricantes 
                  <em> Microsoft Corporation, Adobe Inc, Autodesk Inc, e outros</em>.
                </p>
              </div>

              {/* Signatures block */}
              <div className="grid grid-cols-2 gap-8 pt-8 max-w-md mx-auto relative text-xs">
                <div className="border-t border-[#c6c6cf] pt-2">
                  <p className="font-bold text-[#0b1c30]">Sistema NexusSAM</p>
                  <p className="text-[#45464e] text-[10px]">Auditoria Digital de Software</p>
                </div>
                <div className="border-t border-[#c6c6cf] pt-2">
                  <p className="font-bold text-[#0b1c30]">Admin Gestor</p>
                  <p className="text-[#45464e] text-[10px]">Gestor de Compliance Corporativo</p>
                </div>
              </div>

              {/* Stamp ID footer */}
              <div className="pt-6 relative text-[9px] font-mono text-[#76767f]">
                <p>CÓDIGO DE VERIFICAÇÃO INTEGRIDADE: NEXUS-{'COMPLIANCE'}-{companyData.id.toUpperCase()}-2026</p>
                <p>Sincronizado e auditado em: {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}</p>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
