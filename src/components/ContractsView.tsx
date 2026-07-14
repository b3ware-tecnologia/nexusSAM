import React, { useState } from 'react';
import { 
  FileText, 
  ShieldCheck, 
  AlertTriangle, 
  Calendar, 
  DollarSign, 
  CheckCircle2, 
  Download, 
  ExternalLink, 
  Plus, 
  Search,
  ArrowUpRight,
  Filter,
  UserCheck,
  UploadCloud,
  X,
  Sparkles,
  Loader2,
  Check,
  AlertCircle,
  Info
} from 'lucide-react';
import { CompanyData, License } from '../data-types';

interface ContractsViewProps {
  companyData: CompanyData;
  onAddContract?: (contract: Omit<License, 'id'>) => void;
}

export default function ContractsView({ companyData, onAddContract }: ContractsViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVendor, setSelectedVendor] = useState('Todos');
  const [selectedSla, setSelectedSla] = useState('Todos');

  // Detail Modal State
  const [selectedDetailContract, setSelectedDetailContract] = useState<any>(null);

  // AI-powered Upload & Analysis States
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [base64Data, setBase64Data] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  
  // Interactive Review Form States (Prefilled by IA)
  const [showForm, setShowForm] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  
  const [formSoftwareName, setFormSoftwareName] = useState('');
  const [formVendor, setFormVendor] = useState<'Microsoft' | 'Adobe' | 'Autodesk' | 'Outros'>('Outros');
  const [formCategory, setFormCategory] = useState<'Produtividade' | 'Design/Eng' | 'Segurança' | 'Utilities'>('Produtividade');
  const [formCustoMensal, setFormCustoMensal] = useState<number>(0);
  const [formExpiryDate, setFormExpiryDate] = useState('');
  const [formContractNo, setFormContractNo] = useState('');
  const [formSla, setFormSla] = useState('');
  const [formQtyTotal, setFormQtyTotal] = useState<number>(100);
  const [formQtyUtilizada, setFormQtyUtilizada] = useState<number>(100);
  const [formQtyOciosa, setFormQtyOciosa] = useState<number>(0);
  const [formStatus, setFormStatus] = useState<'Em Uso' | 'Ociosa' | 'Não Conforme'>('Em Uso');

  // Interactive Review Form Billing Period States
  const [formBillingAmount, setFormBillingAmount] = useState<number>(0);
  const [formBillingPeriod, setFormBillingPeriod] = useState<'mensal' | 'anual' | '2 anos' | '3 anos' | '5 anos'>('mensal');
  const [isLinkedWithDevice, setIsLinkedWithDevice] = useState(false);

  // Recalculate custoMensal based on Billing Amount & Period
  React.useEffect(() => {
    let factor = 1;
    if (formBillingPeriod === 'anual') factor = 12;
    else if (formBillingPeriod === '2 anos') factor = 24;
    else if (formBillingPeriod === '3 anos') factor = 36;
    else if (formBillingPeriod === '5 anos') factor = 60;
    
    setFormCustoMensal(Number((formBillingAmount / factor).toFixed(2)));
  }, [formBillingAmount, formBillingPeriod]);

  // Recalculate volumetric values and status based on Software Name linking (Telemetry Coleta Link)
  const companyLicensesJSON = JSON.stringify(companyData.licenses.map(l => ({ name: l.softwareName, util: l.qtyUtilizada, status: l.status })));
  React.useEffect(() => {
    const trimmedName = formSoftwareName.trim().toLowerCase();
    if (!trimmedName) {
      setIsLinkedWithDevice(false);
      return;
    }
    
    const matched = companyData.licenses.find(
      l => l.softwareName.trim().toLowerCase() === trimmedName
    );
    
    if (matched) {
      setIsLinkedWithDevice(true);
      setFormQtyUtilizada(matched.qtyUtilizada || 0);
      setFormQtyOciosa(Math.max(0, (formQtyTotal || 0) - (matched.qtyUtilizada || 0)));
      setFormStatus(matched.status || 'Em Uso');
    } else {
      setIsLinkedWithDevice(false);
      setFormQtyUtilizada(0);
      setFormQtyOciosa(formQtyTotal || 0);
      setFormStatus('Ociosa');
    }
  }, [formSoftwareName, formQtyTotal, companyLicensesJSON]);

  const licenses = companyData.licenses;

  const resetModalState = () => {
    setSelectedFile(null);
    setBase64Data('');
    setIsAnalyzing(false);
    setErrorMsg('');
    setShowForm(false);
    setMissingFields([]);
    
    setFormSoftwareName('');
    setFormVendor('Outros');
    setFormCategory('Produtividade');
    setFormCustoMensal(0);
    setFormExpiryDate('');
    setFormContractNo('');
    setFormSla('');
    setFormQtyTotal(100);
    setFormQtyUtilizada(100);
    setFormQtyOciosa(0);
    setFormStatus('Em Uso');
    setFormBillingAmount(0);
    setFormBillingPeriod('mensal');
    setIsLinkedWithDevice(false);
  };

  const processFile = (file: File) => {
    setSelectedFile(file);
    setErrorMsg('');
    
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const commaIndex = base64String.indexOf(',');
      const cleanBase64 = commaIndex !== -1 ? base64String.substring(commaIndex + 1) : base64String;
      setBase64Data(cleanBase64);
    };
    reader.onerror = () => {
      setErrorMsg('Falha ao ler o arquivo local.');
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleAnalyzeContract = async () => {
    if (!base64Data) {
      setErrorMsg('Por favor, carregue um arquivo válido primeiro.');
      return;
    }
    
    setIsAnalyzing(true);
    setErrorMsg('');
    
    try {
      const response = await fetch('/api/analyze-contract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileData: base64Data,
          fileName: selectedFile?.name || 'documento',
          mimeType: selectedFile?.type || 'application/pdf',
        })
      });
      
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Erro na requisição ao servidor.');
      }
      
      const data = await response.json();
      
      // Prefill fields
      setFormSoftwareName(data.softwareName || '');
      setFormVendor(data.vendor || 'Outros');
      setFormCategory(data.category || 'Produtividade');
      setFormCustoMensal(Number(data.custoMensal) || 0);
      setFormBillingAmount(Number(data.custoMensal) || 0);
      setFormBillingPeriod('mensal');
      setFormExpiryDate(data.expiryDate || '');
      setFormContractNo(data.contractNo || '');
      setFormSla(data.sla || '');
      setFormQtyTotal(data.qtyTotal !== null && data.qtyTotal !== undefined ? Number(data.qtyTotal) : 100);
      setFormQtyUtilizada(data.qtyUtilizada !== null && data.qtyUtilizada !== undefined ? Number(data.qtyUtilizada) : 100);
      
      const computedTotal = data.qtyTotal !== null && data.qtyTotal !== undefined ? Number(data.qtyTotal) : 100;
      const computedUtil = data.qtyUtilizada !== null && data.qtyUtilizada !== undefined ? Number(data.qtyUtilizada) : 100;
      setFormQtyOciosa(data.qtyOciosa !== null && data.qtyOciosa !== undefined ? Number(data.qtyOciosa) : Math.max(0, computedTotal - computedUtil));
      
      if (data.complianceStatus === 'Não Conforme') {
        setFormStatus('Não Conforme');
      } else if (Number(data.qtyOciosa) > 0) {
        setFormStatus('Ociosa');
      } else {
        setFormStatus('Em Uso');
      }
      
      setMissingFields(data.missingFields || []);
      setShowForm(true);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Falha ao processar o contrato.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAddContractSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onAddContract) return;

    const newContractPayload: Omit<License, 'id'> = {
      softwareName: formSoftwareName,
      vendor: formVendor,
      category: formCategory,
      custoMensal: Number(formCustoMensal) || 0,
      expiryDate: formExpiryDate || undefined,
      contractNo: formContractNo || undefined,
      sla: formSla || undefined,
      qtyTotal: Number(formQtyTotal) || 0,
      qtyUtilizada: Number(formQtyUtilizada) || 0,
      qtyOciosa: Number(formQtyOciosa) || 0,
      potencialEconomia: formStatus === 'Ociosa' ? (Number(formQtyOciosa) / (Number(formQtyTotal) || 1)) * (Number(formCustoMensal) || 0) : 0,
      status: formStatus,
      billingPeriod: formBillingPeriod,
      billingAmount: Number(formBillingAmount) || 0
    };

    onAddContract(newContractPayload);
    setIsUploadModalOpen(false);
    resetModalState();
  };

  const isFieldMissing = (fieldName: string, value: any) => {
    // Check if explicitly listed as missing by AI
    const isExplicit = missingFields.some(f => {
      const searchStr = f.toLowerCase();
      if (fieldName === 'nome' && (searchStr.includes('nome') || searchStr.includes('software'))) return true;
      if (fieldName === 'fornecedor' && (searchStr.includes('fabricante') || searchStr.includes('fornecedor') || searchStr.includes('vendor'))) return true;
      if (fieldName === 'categoria' && searchStr.includes('categoria')) return true;
      if (fieldName === 'custo' && (searchStr.includes('custo') || searchStr.includes('valor') || searchStr.includes('faturamento'))) return true;
      if (fieldName === 'vencimento' && (searchStr.includes('vencimento') || searchStr.includes('data') || searchStr.includes('expirac') || searchStr.includes('expiry'))) return true;
      if (fieldName === 'contrato' && (searchStr.includes('contrato') || searchStr.includes('numero') || searchStr.includes('nº'))) return true;
      if (fieldName === 'sla' && searchStr.includes('sla')) return true;
      if (fieldName === 'total' && (searchStr.includes('total') || searchStr.includes('quantidade') || searchStr.includes('licencas'))) return true;
      return false;
    });

    if (isExplicit) return true;
    
    // Check if value is falsy
    if (value === null || value === undefined || value === '' || value === 0) {
      if (fieldName === 'vencimento' || fieldName === 'sla' || fieldName === 'contrato' || fieldName === 'nome' || fieldName === 'custo') {
        return true;
      }
    }
    return false;
  };

  // Derive contract details from active licenses
  const contracts = licenses.map((lic, index) => {
    // Generate realistic contract numbers and terms based on license data
    const contractNumbers = ['CTR-2026-0091', 'CTR-2025-0412', 'CTR-2026-1182', 'CTR-2024-0013', 'CTR-2025-0985', 'CTR-2026-0331', 'CTR-2025-1560', 'CTR-2026-0774'];
    const contractNo = lic.contractNo || contractNumbers[index % contractNumbers.length];
    
    // SLA terms
    const slaLevels = ['99.9% Disponibilidade', '99.5% Tempo de Resposta', '99.99% Cloud SLA', 'Suporte 24/7 Premium'];
    const sla = lic.sla || slaLevels[index % slaLevels.length];

    // Contract type based on vendor, software name, or billing period
    let tipoContrato = 'Assinatura Mensal Cloud';
    if (lic.billingPeriod) {
      const p = lic.billingPeriod;
      if (p === 'mensal') tipoContrato = 'Assinatura Mensal Cloud';
      else if (p === 'anual') tipoContrato = 'Contrato Anual Corporativo';
      else if (p === '2 anos') tipoContrato = 'Contrato Plurianual (2 Anos)';
      else if (p === '3 anos') tipoContrato = 'Contrato Plurianual (3 Anos)';
      else if (p === '5 anos') tipoContrato = 'Contrato de Longo Prazo (5 Anos)';
    } else if (lic.vendor === 'Microsoft') {
      tipoContrato = 'Enterprise Agreement (EA)';
    } else if (lic.vendor === 'Adobe') {
      tipoContrato = 'Adobe Value Incentive Plan (VIP)';
    } else if (lic.vendor === 'Autodesk') {
      tipoContrato = 'Anual Single-User Subscription';
    } else if (lic.custoMensal > 5000) {
      tipoContrato = 'Contrato Corporativo sob Medida (Custom)';
    }

    // Expiry warnings
    const expiryDateObj = lic.expiryDate ? new Date(lic.expiryDate) : null;
    const today = new Date('2026-07-03'); // Using current system context date
    const diffTime = expiryDateObj ? expiryDateObj.getTime() - today.getTime() : null;
    const diffDays = diffTime ? Math.ceil(diffTime / (1000 * 60 * 60 * 24)) : null;

    let statusContrato: 'Ativo' | 'Renovação Pendente' | 'Expirado' | 'Atenção' = 'Ativo';
    if (diffDays !== null) {
      if (diffDays < 0) statusContrato = 'Expirado';
      else if (diffDays <= 60) statusContrato = 'Renovação Pendente';
      else if (diffDays <= 180) statusContrato = 'Atenção';
    }

    return {
      id: `ctr-${lic.id}`,
      contractNo,
      softwareName: lic.softwareName,
      vendor: lic.vendor,
      category: lic.category,
      custoMensal: lic.custoMensal,
      expiryDate: lic.expiryDate || 'Sem Expiração',
      daysToExpiry: diffDays,
      statusContrato,
      tipoContrato,
      sla,
      complianceStatus: lic.status === 'Não Conforme' ? 'Não Conforme' : 'Conforme',
      billingPeriod: lic.billingPeriod,
      billingAmount: lic.billingAmount
    };
  });

  // Calculate high level contract metrics
  const totalContracts = contracts.length;
  const totalMonthlyCommitment = contracts.reduce((sum, c) => sum + c.custoMensal, 0);
  const contractsRequiringRenewal = contracts.filter(c => c.statusContrato === 'Renovação Pendente').length;
  const nonConformityContracts = contracts.filter(c => c.complianceStatus === 'Não Conforme').length;

  // Filtered contracts
  const filteredContracts = contracts.filter(c => {
    const matchesSearch = c.softwareName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.contractNo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesVendor = selectedVendor === 'Todos' || c.vendor === selectedVendor;
    const matchesStatus = selectedSla === 'Todos' || 
                          (selectedSla === 'Ativo' && c.statusContrato === 'Ativo') ||
                          (selectedSla === 'Renovação' && c.statusContrato === 'Renovação Pendente') ||
                          (selectedSla === 'Desvio' && c.complianceStatus === 'Não Conforme');

    return matchesSearch && matchesVendor && matchesStatus;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2
    }).format(value);
  };

  const handleDownloadContract = (softwareName: string, contractNo: string) => {
    alert(`Preparando download de termo legal: Termo_${softwareName.replace(/\s+/g, '_')}_${contractNo}.pdf\nEste documento inclui os Termos de Uso (EULA), SLA do Fornecedor e Extrato de Licenciamento Ativo.`);
  };

  return (
    <div className="space-y-6 select-none animate-fade-in">
      
      {/* Intro section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl border border-[#c6c6cf] shadow-sm">
        <div>
          <h2 className="font-headline text-2xl font-black text-[#0b1c30]">Contratos de Licenças</h2>
          <p className="text-xs text-[#45464e] font-medium mt-1">
            Gestão integrada de vigências, faturamentos, termos de SLA, acordos corporativos e renovações ativas com fornecedores.
          </p>
        </div>
        <button 
          onClick={() => {
            resetModalState();
            setIsUploadModalOpen(true);
          }}
          className="bg-[#1e284c] text-white hover:bg-[#343e63] font-sans text-xs font-bold px-4 py-2.5 rounded-lg flex items-center gap-2 transition-all active:scale-97 cursor-pointer shadow-sm ml-auto md:ml-0 shrink-0"
        >
          <UploadCloud size={16} />
          Anexar Contrato ou Planilha
        </button>
      </div>

      {/* Contract metrics cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1: Total Contratos */}
        <div className="bg-white p-5 rounded-xl border border-[#c6c6cf] shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-[10px] text-[#45464e] font-bold uppercase tracking-wider">Contratos Ativos</span>
            <div className="p-2 bg-[#eff4ff] rounded-lg text-[#1e284c]">
              <FileText size={18} />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <h3 className="font-headline text-3xl font-extrabold text-[#0b1c30]">{totalContracts}</h3>
            <span className="text-xs text-[#45464e] font-medium">acordos</span>
          </div>
          <div className="mt-3 flex items-center text-[11px] text-[#45464e]">
            <CheckCircle2 size={14} className="text-green-600 mr-1" />
            <span className="text-green-600 font-bold mr-1">100%</span>
            <span>auditados e catalogados</span>
          </div>
        </div>

        {/* Metric 2: Comprometimento Mensal */}
        <div className="bg-white p-5 rounded-xl border border-[#c6c6cf] shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-[10px] text-[#45464e] font-bold uppercase tracking-wider">Comprometimento Mensal</span>
            <div className="p-2 bg-[#eff4ff] rounded-lg text-[#1e284c]">
              <DollarSign size={18} />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="font-sans text-sm font-bold text-[#0b1c30]">R$</span>
            <h3 className="font-headline text-2xl font-extrabold text-[#0b1c30]">
              {new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(totalMonthlyCommitment)}
            </h3>
          </div>
          <div className="mt-3 flex items-center text-[11px] text-[#45464e]">
            <ArrowUpRight size={14} className="text-[#1e284c] mr-1" />
            <span>Cobranças recorrentes ativas</span>
          </div>
        </div>

        {/* Metric 3: Renovacoes no Horizonte */}
        <div className="bg-white p-5 rounded-xl border border-[#c6c6cf] shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-[10px] text-[#45464e] font-bold uppercase tracking-wider">Próximas Renovações</span>
            <div className="p-2 bg-amber-50 rounded-lg text-amber-700">
              <Calendar size={18} />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <h3 className="font-headline text-3xl font-extrabold text-amber-700">{contractsRequiringRenewal}</h3>
            <span className="text-xs text-[#45464e] font-medium">em 60 dias</span>
          </div>
          <div className="mt-3 flex items-center text-[11px] text-amber-700">
            <AlertTriangle size={14} className="mr-1" />
            <span>Evite interrupções de serviço</span>
          </div>
        </div>

        {/* Metric 4: Acordos em Risco */}
        <div className="bg-white p-5 rounded-xl border border-[#c6c6cf] shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-[10px] text-[#45464e] font-bold uppercase tracking-wider">Risco Contratual</span>
            <div className="p-2 bg-red-50 rounded-lg text-[#ba1a1a]">
              <ShieldCheck size={18} />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <h3 className="font-headline text-3xl font-extrabold text-[#ba1a1a]">{nonConformityContracts}</h3>
            <span className="text-xs text-[#45464e] font-medium">desvios de SLA</span>
          </div>
          <div className="mt-3 flex items-center text-[11px] text-[#ba1a1a]">
            <AlertTriangle size={14} className="mr-1" />
            <span>Inconformidade identificada</span>
          </div>
        </div>

      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-5 rounded-xl border border-[#c6c6cf] shadow-sm flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#45464e]" />
          <input
            type="text"
            placeholder="Buscar por software ou nº do contrato..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#f8f9ff] text-xs font-medium border border-[#c6c6cf] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e284c] text-[#0b1c30]"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-3">
          
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-[#45464e]" />
            <span className="text-xs font-semibold text-[#45464e]">Fabricante:</span>
            <select
              value={selectedVendor}
              onChange={(e) => setSelectedVendor(e.target.value)}
              className="bg-[#eff4ff] hover:bg-[#dce9ff] text-xs font-semibold text-[#1e284c] border-none rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-[#1e284c] cursor-pointer"
            >
              <option value="Todos">Todos</option>
              <option value="Microsoft">Microsoft</option>
              <option value="Adobe">Adobe</option>
              <option value="Autodesk">Autodesk</option>
              <option value="Outros">Outros Fabricantes</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#45464e]">Filtro de Status:</span>
            <select
              value={selectedSla}
              onChange={(e) => setSelectedSla(e.target.value)}
              className="bg-[#eff4ff] hover:bg-[#dce9ff] text-xs font-semibold text-[#1e284c] border-none rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-[#1e284c] cursor-pointer"
            >
              <option value="Todos">Todos os Status</option>
              <option value="Ativo">Apenas Contratos Ativos</option>
              <option value="Renovação">Renovações Pendentes</option>
              <option value="Desvio">Desvios de Conformidade</option>
            </select>
          </div>

        </div>

      </div>

      {/* Contracts Table */}
      <div className="bg-white rounded-xl border border-[#c6c6cf] shadow-sm overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#eff4ff] text-[10px] font-mono uppercase text-[#45464e] border-b border-[#c6c6cf]">
              <tr>
                <th className="px-6 py-4 font-bold">Nº de Contrato</th>
                <th className="px-6 py-4 font-bold">Software Beneficiário</th>
                <th className="px-6 py-4 font-bold">Modelo de Acordo</th>
                <th className="px-6 py-4 font-bold">Garantia / SLA</th>
                <th className="px-6 py-4 font-bold text-center">Status Contrato</th>
                <th className="px-6 py-4 font-bold text-center">Conformidade</th>
                <th className="px-6 py-4 font-bold text-right">Faturamento / Ciclo</th>
                <th className="px-6 py-4 font-bold text-right">Data de Renovação</th>
                <th className="px-6 py-4 font-bold text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="text-xs text-[#0b1c30] divide-y divide-[#eff4ff]">
              {filteredContracts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-[#45464e] font-medium">
                    Nenhum contrato encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredContracts.map((contract) => (
                  <tr 
                    key={contract.id} 
                    className="hover:bg-[#f8f9ff]/80 transition-all cursor-pointer border-l-4 border-l-transparent hover:border-l-[#1e284c]"
                    onClick={() => setSelectedDetailContract(contract)}
                    title="Clique para ver detalhes do contrato"
                  >
                    
                    {/* Contract Number */}
                    <td className="px-6 py-4 font-mono font-bold text-[#1e284c]">
                      {contract.contractNo}
                    </td>

                    {/* Software */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-[#1e284c] text-sm">{contract.softwareName}</span>
                        <span className="text-[10px] text-[#45464e] font-semibold">{contract.vendor}</span>
                      </div>
                    </td>

                    {/* Agreement type */}
                    <td className="px-6 py-4 font-medium text-[#45464e]">
                      {contract.tipoContrato}
                    </td>

                    {/* SLA Description */}
                    <td className="px-6 py-4">
                      <span className="flex items-center gap-1 text-[11px] text-[#45464e] font-medium">
                        <UserCheck size={13} className="text-[#1e284c]" />
                        {contract.sla}
                      </span>
                    </td>

                    {/* Contract Expiration Status */}
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black tracking-wide ${
                        contract.statusContrato === 'Ativo' 
                          ? 'bg-green-50 text-green-700 border border-green-200' 
                          : contract.statusContrato === 'Renovação Pendente'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-red-50 text-[#ba1a1a] border border-red-200'
                      }`}>
                        {contract.statusContrato}
                      </span>
                    </td>

                    {/* SLA Compliance Status */}
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black tracking-wide ${
                        contract.complianceStatus === 'Conforme' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-[#ba1a1a]'
                      }`}>
                        {contract.complianceStatus}
                      </span>
                    </td>

                    {/* Cost */}
                    <td className="px-6 py-4 text-right font-mono text-[#0b1c30]">
                      <div className="flex flex-col items-end">
                        {contract.billingAmount && contract.billingPeriod ? (
                          <>
                            <span className="font-black text-sm">{formatCurrency(contract.billingAmount)}</span>
                            <span className="text-[10px] text-[#45464e] font-bold">Ciclo: {contract.billingPeriod}</span>
                            <span className="text-[9px] text-[#45464e] font-medium italic">({formatCurrency(contract.custoMensal)}/mês eq.)</span>
                          </>
                        ) : (
                          <>
                            <span className="font-black text-sm">{formatCurrency(contract.custoMensal)}</span>
                            <span className="text-[10px] text-[#45464e] font-bold">Ciclo: mensal</span>
                          </>
                        )}
                      </div>
                    </td>

                    {/* Renewal Date */}
                    <td className="px-6 py-4 text-right font-mono text-[#45464e] font-semibold">
                      <div className="flex flex-col items-end">
                        <span>{contract.expiryDate}</span>
                        {contract.daysToExpiry !== null && contract.daysToExpiry > 0 && (
                          <span className="text-[10px] text-amber-600 font-bold">({contract.daysToExpiry} dias restantes)</span>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleDownloadContract(contract.softwareName, contract.contractNo)}
                          className="p-1.5 hover:bg-[#eff4ff] text-[#1e284c] rounded transition-colors cursor-pointer"
                          title="Baixar Contrato & SLA"
                        >
                          <Download size={15} />
                        </button>
                        <button
                          onClick={() => alert(`Fornecedor: ${contract.vendor}\nSLA Acordado: ${contract.sla}\nCanal de Suporte: suporte@${contract.vendor.toLowerCase()}.com`)}
                          className="p-1.5 hover:bg-[#eff4ff] text-[#45464e] rounded transition-colors cursor-pointer"
                          title="Detalhes de Contato Fornecedor"
                        >
                          <ExternalLink size={15} />
                        </button>
                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Upload e Análise IA */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-[#0b1c30]/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-2xl border border-[#c6c6cf] shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-slide-up">
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-[#c6c6cf] flex items-center justify-between bg-[#eff4ff]">
              <div className="flex items-center gap-2 text-[#1e284c]">
                <Sparkles size={18} className="text-[#1e284c]" />
                <h3 className="font-headline font-black text-base text-[#1e284c]">Anexar Contrato via Inteligência Artificial</h3>
              </div>
              <button 
                onClick={() => { setIsUploadModalOpen(false); resetModalState(); }}
                className="p-1 hover:bg-[#c6c6cf]/30 rounded-lg text-[#45464e] transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 flex-1 overflow-y-auto space-y-6">
              
              {!showForm && !isAnalyzing && (
                <div className="space-y-4">
                  <div className="p-4 bg-[#eff4ff] border border-[#1e284c]/20 rounded-xl flex items-start gap-3">
                    <Sparkles className="text-[#1e284c] shrink-0 mt-0.5" size={16} />
                    <div>
                      <h4 className="text-xs font-bold text-[#1e284c] uppercase">Como funciona?</h4>
                      <p className="text-xs text-[#45464e] mt-1 font-medium leading-relaxed">
                        Anexe o PDF do contrato, imagem escaneada ou planilha de licenças. O Gemini IA processará o documento para extrair nome, vigência, valores, quantidade e nível de serviço (SLA), preenchendo o cadastro automaticamente.
                      </p>
                    </div>
                  </div>

                  {/* Drag and Drop Zone */}
                  <div 
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById('contract-file-upload')?.click()}
                    className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all ${
                      isDragging 
                        ? 'border-[#1e284c] bg-[#eff4ff]/60 scale-99' 
                        : 'border-[#c6c6cf] hover:border-[#1e284c] bg-[#f8f9ff] hover:bg-white'
                    }`}
                  >
                    <input 
                      id="contract-file-upload"
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg,.csv,.txt,.xlsx"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <UploadCloud size={40} className="text-[#45464e] mb-3" />
                    <span className="text-xs font-bold text-[#0b1c30]">Arraste seu arquivo aqui ou clique para selecionar</span>
                    <span className="text-[10px] text-[#45464e] font-medium mt-1">PDF, Excel, CSV ou Imagem (Máx. 10MB)</span>
                  </div>

                  {selectedFile && (
                    <div className="bg-[#f8f9ff] border border-[#c6c6cf] rounded-xl p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <FileText size={18} className="text-[#1e284c] shrink-0" />
                        <div className="overflow-hidden">
                          <p className="text-xs font-bold text-[#0b1c30] truncate">{selectedFile.name}</p>
                          <p className="text-[10px] text-[#45464e] font-medium">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setSelectedFile(null); setBase64Data(''); }}
                        className="text-[#ba1a1a] hover:bg-red-50 p-1 rounded-lg transition-all cursor-pointer"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}

                  {errorMsg && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs font-semibold flex items-center gap-2">
                      <AlertCircle size={14} className="shrink-0" />
                      {errorMsg}
                    </div>
                  )}

                  <div className="flex justify-end gap-3 pt-4 border-t border-[#c6c6cf]/60">
                    <button 
                      type="button"
                      onClick={() => { setIsUploadModalOpen(false); resetModalState(); }}
                      className="px-4 py-2 text-xs font-bold border border-[#c6c6cf] rounded-lg text-[#45464e] hover:bg-gray-50 active:scale-97 transition-all cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="button"
                      disabled={!base64Data}
                      onClick={handleAnalyzeContract}
                      className="px-4 py-2 text-xs font-bold bg-[#1e284c] text-white rounded-lg hover:bg-[#343e63] active:scale-97 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 cursor-pointer shadow-sm"
                    >
                      <Sparkles size={14} />
                      Analisar com IA
                    </button>
                  </div>
                </div>
              )}

              {/* Loader de Análise */}
              {isAnalyzing && (
                <div className="py-12 flex flex-col items-center justify-center space-y-4">
                  <div className="relative">
                    <Loader2 size={48} className="text-[#1e284c] animate-spin" />
                    <Sparkles size={16} className="text-amber-500 absolute top-0 right-0 animate-pulse" />
                  </div>
                  <div className="text-center max-w-sm">
                    <h4 className="text-sm font-bold text-[#0b1c30]">Processando com Inteligência Artificial...</h4>
                    <p className="text-xs text-[#45464e] font-medium mt-1.5 leading-relaxed">
                      O Gemini 3.5 está lendo o documento para mapear os dados do contrato. Isso pode levar alguns segundos.
                    </p>
                  </div>
                  
                  <div className="w-full max-w-xs bg-gray-100 h-1.5 rounded-full overflow-hidden relative">
                    <div className="h-full bg-[#1e284c] rounded-full animate-pulse" style={{ width: '70%' }}></div>
                  </div>
                </div>
              )}

              {/* Formulário Interativo Pós-Análise */}
              {showForm && !isAnalyzing && (
                <form onSubmit={handleAddContractSubmit} className="space-y-6">
                  
                  {/* Feedback Bar */}
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                    <div className="flex items-center gap-2 text-amber-800">
                      <Sparkles size={16} className="shrink-0 animate-pulse" />
                      <h4 className="text-xs font-bold uppercase">Análise concluída com sucesso!</h4>
                    </div>
                    <p className="text-xs text-[#45464e] font-medium leading-relaxed">
                      Preenchemos o formulário automaticamente com as informações encontradas pela IA no arquivo <strong>{selectedFile?.name}</strong>. Os campos que a IA não detectou com precisão foram marcados em <span className="text-amber-700 font-bold">amarelo para preenchimento manual</span>.
                    </p>
                  </div>

                  {errorMsg && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs font-semibold flex items-center gap-2">
                      <AlertCircle size={14} />
                      {errorMsg}
                    </div>
                  )}

                  <div className="space-y-4">
                    <h3 className="text-xs font-black uppercase text-[#1e284c] tracking-wider border-b border-[#c6c6cf]/60 pb-1">Campos do Contrato</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      {/* Software Name */}
                      <div>
                        <label className="block text-xs font-bold text-[#45464e] uppercase mb-1">
                          Software Beneficiário *
                        </label>
                        <input 
                          type="text"
                          required
                          value={formSoftwareName}
                          onChange={(e) => setFormSoftwareName(e.target.value)}
                          className={`w-full text-xs font-semibold bg-[#f8f9ff] border rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-[#1e284c] ${
                            isFieldMissing('nome', formSoftwareName)
                              ? 'border-amber-400 bg-amber-50/20 focus:ring-amber-500'
                              : 'border-[#c6c6cf]'
                          }`}
                        />
                        {isFieldMissing('nome', formSoftwareName) && (
                          <span className="text-[10px] text-amber-700 font-bold mt-1 block">⚠️ Campo não detectado. Por favor, digite manualmente.</span>
                        )}
                      </div>

                      {/* Vendor */}
                      <div>
                        <label className="block text-xs font-bold text-[#45464e] uppercase mb-1">
                          Fabricante *
                        </label>
                        <select
                          required
                          value={formVendor}
                          onChange={(e) => setFormVendor(e.target.value as any)}
                          className={`w-full text-xs font-semibold bg-[#f8f9ff] border rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-[#1e284c] ${
                            isFieldMissing('fornecedor', formVendor)
                              ? 'border-amber-400 bg-amber-50/20 focus:ring-amber-500'
                              : 'border-[#c6c6cf]'
                          }`}
                        >
                          <option value="Microsoft">Microsoft</option>
                          <option value="Adobe">Adobe</option>
                          <option value="Autodesk">Autodesk</option>
                          <option value="Outros">Outros</option>
                        </select>
                        {isFieldMissing('fornecedor', formVendor) && (
                          <span className="text-[10px] text-amber-700 font-bold mt-1 block">⚠️ Revise se o fabricante está correto.</span>
                        )}
                      </div>

                      {/* Category */}
                      <div>
                        <label className="block text-xs font-bold text-[#45464e] uppercase mb-1">
                          Categoria *
                        </label>
                        <select
                          required
                          value={formCategory}
                          onChange={(e) => setFormCategory(e.target.value as any)}
                          className={`w-full text-xs font-semibold bg-[#f8f9ff] border rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-[#1e284c] ${
                            isFieldMissing('categoria', formCategory)
                              ? 'border-amber-400 bg-amber-50/20 focus:ring-amber-500'
                              : 'border-[#c6c6cf]'
                          }`}
                        >
                          <option value="Produtividade">Produtividade</option>
                          <option value="Design/Eng">Design/Eng</option>
                          <option value="Segurança">Segurança</option>
                          <option value="Utilities">Utilities</option>
                        </select>
                      </div>

                      {/* Contract Number */}
                      <div>
                        <label className="block text-xs font-bold text-[#45464e] uppercase mb-1">
                          Nº de Contrato
                        </label>
                        <input 
                          type="text"
                          placeholder="Ex: CTR-2026-9021"
                          value={formContractNo}
                          onChange={(e) => setFormContractNo(e.target.value)}
                          className={`w-full text-xs font-semibold bg-[#f8f9ff] border rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-[#1e284c] ${
                            isFieldMissing('contrato', formContractNo)
                              ? 'border-amber-400 bg-amber-50/20 focus:ring-amber-500'
                              : 'border-[#c6c6cf]'
                          }`}
                        />
                        {isFieldMissing('contrato', formContractNo) && (
                          <span className="text-[10px] text-amber-700 font-bold mt-1 block">⚠️ Campo não detectado. Por favor, preencha manualmente.</span>
                        )}
                      </div>

                      {/* SLA */}
                      <div>
                        <label className="block text-xs font-bold text-[#45464e] uppercase mb-1">
                          Garantia / SLA
                        </label>
                        <input 
                          type="text"
                          placeholder="Ex: 99.9% Disponibilidade"
                          value={formSla}
                          onChange={(e) => setFormSla(e.target.value)}
                          className={`w-full text-xs font-semibold bg-[#f8f9ff] border rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-[#1e284c] ${
                            isFieldMissing('sla', formSla)
                              ? 'border-amber-400 bg-amber-50/20 focus:ring-amber-500'
                              : 'border-[#c6c6cf]'
                          }`}
                        />
                        {isFieldMissing('sla', formSla) && (
                          <span className="text-[10px] text-amber-700 font-bold mt-1 block">⚠️ Campo não detectado. Por favor, preencha manualmente.</span>
                        )}
                      </div>

                      {/* Expiry Date */}
                      <div>
                        <label className="block text-xs font-bold text-[#45464e] uppercase mb-1">
                          Data de Expiração / Renovação
                        </label>
                        <input 
                          type="date"
                          value={formExpiryDate}
                          onChange={(e) => setFormExpiryDate(e.target.value)}
                          className={`w-full text-xs font-semibold bg-[#f8f9ff] border rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-[#1e284c] ${
                            isFieldMissing('vencimento', formExpiryDate)
                              ? 'border-amber-400 bg-amber-50/20 focus:ring-amber-500'
                              : 'border-[#c6c6cf]'
                          }`}
                        />
                        {isFieldMissing('vencimento', formExpiryDate) && (
                          <span className="text-[10px] text-amber-700 font-bold mt-1 block">⚠️ Campo não detectado. Por favor, selecione manualmente.</span>
                        )}
                      </div>

                      {/* Valor do Faturamento */}
                      <div>
                        <label className="block text-xs font-bold text-[#45464e] uppercase mb-1">
                          Valor do Faturamento *
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#45464e]">R$</span>
                          <input 
                            type="number"
                            step="any"
                            required
                            value={formBillingAmount || ''}
                            onChange={(e) => setFormBillingAmount(parseFloat(e.target.value) || 0)}
                            className={`w-full text-xs font-semibold bg-[#f8f9ff] border rounded-lg pl-8 pr-2.5 p-2.5 focus:outline-none focus:ring-2 focus:ring-[#1e284c] ${
                              isFieldMissing('custo', formBillingAmount)
                                ? 'border-amber-400 bg-amber-50/20 focus:ring-amber-500'
                                : 'border-[#c6c6cf]'
                            }`}
                          />
                        </div>
                        {isFieldMissing('custo', formBillingAmount) && (
                          <span className="text-[10px] text-amber-700 font-bold mt-1 block">⚠️ Revise o valor do faturamento.</span>
                        )}
                      </div>

                      {/* Período de Faturamento */}
                      <div>
                        <label className="block text-xs font-bold text-[#45464e] uppercase mb-1">
                          Período de Faturamento *
                        </label>
                        <select
                          required
                          value={formBillingPeriod}
                          onChange={(e) => setFormBillingPeriod(e.target.value as any)}
                          className="w-full text-xs font-semibold bg-[#f8f9ff] border border-[#c6c6cf] rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-[#1e284c]"
                        >
                          <option value="mensal">Mensal</option>
                          <option value="anual">Anual</option>
                          <option value="2 anos">2 Anos</option>
                          <option value="3 anos">3 Anos</option>
                          <option value="5 anos">5 Anos</option>
                        </select>
                        {formBillingAmount > 0 && (
                          <span className="text-[10px] text-[#1e284c] font-bold mt-1.5 block">
                            💡 Equivalente a: R$ {formCustoMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} por mês
                          </span>
                        )}
                      </div>

                    </div>

                    <h3 className="text-xs font-black uppercase text-[#1e284c] tracking-wider border-b border-[#c6c6cf]/60 pb-1 pt-4">Volumetria e Uso</h3>
                    
                    {/* Telemetry/Device Linking Info Card */}
                    {isLinkedWithDevice ? (
                      <div className="p-3.5 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3 text-green-800 my-2 select-none">
                        <CheckCircle2 className="shrink-0 mt-0.5 text-green-600 animate-pulse" size={16} />
                        <div>
                          <h4 className="text-[11px] font-bold uppercase tracking-wider">Vínculo de Telemetria Ativo</h4>
                          <p className="text-[11px] text-green-700 mt-0.5 font-medium leading-relaxed">
                            Encontramos este software no inventário coletado dos dispositivos. A quantidade atribuída ({formQtyUtilizada}) e o status inicial são dinâmicos e atualizados via coleta.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3.5 bg-[#eff4ff] border border-[#1e284c]/20 rounded-xl flex items-start gap-3 text-[#1e284c] my-2 select-none">
                        <Info className="shrink-0 mt-0.5 text-[#1e284c]" size={16} />
                        <div>
                          <h4 className="text-[11px] font-bold uppercase tracking-wider">Novo Contrato Sem Dispositivos Ativos</h4>
                          <p className="text-[11px] text-[#45464e] mt-0.5 font-medium leading-relaxed">
                            Contrato novo sem instalações ativas detectadas. A quantidade inicial em uso foi definida como 0 e será atualizada automaticamente assim que o software for coletado nos computadores.
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      
                      {/* Qty Total */}
                      <div>
                        <label className="block text-xs font-bold text-[#45464e] uppercase mb-1">
                          Total Contratado *
                        </label>
                        <input 
                          type="number"
                          required
                          value={formQtyTotal}
                          onChange={(e) => {
                            const tot = Math.max(0, parseInt(e.target.value) || 0);
                            setFormQtyTotal(tot);
                            setFormQtyOciosa(Math.max(0, tot - formQtyUtilizada));
                          }}
                          className={`w-full text-xs font-semibold bg-[#f8f9ff] border rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-[#1e284c] ${
                            isFieldMissing('total', formQtyTotal)
                              ? 'border-amber-400 bg-amber-50/20 focus:ring-amber-500'
                              : 'border-[#c6c6cf]'
                          }`}
                        />
                      </div>

                      {/* Qty Utilizada */}
                      <div>
                        <label className="block text-xs font-bold text-[#45464e] uppercase mb-1">
                          Atribuídas / Em Uso *
                        </label>
                        <input 
                          type="number"
                          required
                          disabled={isLinkedWithDevice || !formSoftwareName}
                          value={formQtyUtilizada}
                          onChange={(e) => {
                            const uti = Math.max(0, parseInt(e.target.value) || 0);
                            setFormQtyUtilizada(uti);
                            setFormQtyOciosa(Math.max(0, formQtyTotal - uti));
                          }}
                          className={`w-full text-xs font-semibold bg-[#f8f9ff] border border-[#c6c6cf] rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-[#1e284c] ${
                            isLinkedWithDevice ? 'opacity-70 bg-gray-100 cursor-not-allowed' : ''
                          }`}
                        />
                      </div>

                      {/* Qty Ociosa */}
                      <div>
                        <label className="block text-xs font-bold text-[#45464e] uppercase mb-1">
                          Ociosas
                        </label>
                        <input 
                          type="number"
                          disabled
                          value={formQtyOciosa}
                          className="w-full text-xs font-semibold bg-[#f8f9ff] border border-[#c6c6cf] rounded-lg p-2.5 opacity-60 cursor-not-allowed"
                        />
                      </div>

                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* License Status */}
                      <div>
                        <label className="block text-xs font-bold text-[#45464e] uppercase mb-1">
                          Status Inicial
                        </label>
                        <select
                          disabled={isLinkedWithDevice}
                          value={formStatus}
                          onChange={(e) => setFormStatus(e.target.value as any)}
                          className={`w-full text-xs font-semibold bg-[#f8f9ff] border border-[#c6c6cf] rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-[#1e284c] ${
                            isLinkedWithDevice ? 'opacity-70 bg-gray-100 cursor-not-allowed' : ''
                          }`}
                        >
                          <option value="Em Uso">Conforme / Em Uso</option>
                          <option value="Ociosa">Com Licenças Ociosas</option>
                          <option value="Não Conforme">Não Conforme (SLA/Uso)</option>
                        </select>
                      </div>
                    </div>

                  </div>

                  <div className="flex justify-end gap-3 pt-6 border-t border-[#c6c6cf]/60">
                    <button 
                      type="button"
                      onClick={() => { setShowForm(false); }}
                      className="px-4 py-2 text-xs font-bold border border-[#c6c6cf] rounded-lg text-[#45464e] hover:bg-gray-50 active:scale-97 transition-all cursor-pointer"
                    >
                      Voltar
                    </button>
                    <button 
                      type="submit"
                      className="px-4 py-2 text-xs font-bold bg-[#1e284c] text-white rounded-lg hover:bg-[#343e63] active:scale-97 transition-all flex items-center gap-2 cursor-pointer shadow-sm font-sans"
                    >
                      <Check size={14} />
                      Confirmar e Salvar Contrato
                    </button>
                  </div>

                </form>
              )}

            </div>

          </div>
        </div>
      )}

      {/* DETALHES COMPLETOS DO CONTRATO (MODAL DE DETALHES DO CONTRATO) */}
      {selectedDetailContract && (
        <div 
          className="fixed inset-0 bg-[#0b1c30]/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity"
          onClick={() => setSelectedDetailContract(null)}
        >
          <div 
            className="bg-white rounded-2xl border border-[#c6c6cf] shadow-2xl w-full max-w-2xl overflow-hidden animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            
            {/* Header */}
            <div className="px-6 py-5 border-b border-[#c6c6cf] bg-[#f8f9ff] flex justify-between items-center">
              <div>
                <span className="font-mono text-[9px] uppercase font-bold text-[#45464e] tracking-wider px-2 py-0.5 bg-[#eff4ff] rounded">
                  Dossiê de Contrato & SLA
                </span>
                <h3 className="font-headline text-lg font-black text-[#1e284c] mt-1 flex items-center gap-2">
                  <FileText size={20} className="text-[#1e284c]" />
                  Contrato {selectedDetailContract.contractNo}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedDetailContract(null)}
                className="p-1.5 hover:bg-[#eff4ff] rounded-full transition-colors cursor-pointer text-[#45464e]"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar text-[#0b1c30]">
              
              {/* Overview Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-[#f8f9ff] p-4 rounded-xl border border-[#c6c6cf]/60">
                <div>
                  <span className="block text-[9px] font-mono font-bold uppercase text-[#45464e] tracking-wider">Software Beneficiário</span>
                  <span className="text-sm font-black text-[#1e284c]">{selectedDetailContract.softwareName}</span>
                </div>
                <div>
                  <span className="block text-[9px] font-mono font-bold uppercase text-[#45464e] tracking-wider">Fabricante</span>
                  <span className="text-sm font-black text-[#1e284c]">{selectedDetailContract.vendor}</span>
                </div>
                <div>
                  <span className="block text-[9px] font-mono font-bold uppercase text-[#45464e] tracking-wider">Modelo Contrato</span>
                  <span className="text-xs font-bold text-[#45464e]">{selectedDetailContract.tipoContrato || 'Assinatura SaaS'}</span>
                </div>
                <div>
                  <span className="block text-[9px] font-mono font-bold uppercase text-[#45464e] tracking-wider">Vencimento</span>
                  <span className="text-sm font-mono font-bold text-[#1e284c]">{selectedDetailContract.expiryDate}</span>
                </div>
              </div>

              {/* Status and Health Badges */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-xl border border-[#c6c6cf] space-y-2">
                  <span className="block text-[10px] font-mono font-bold uppercase text-[#45464e]">Vigência Legal</span>
                  <div className="flex items-center gap-2">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-black tracking-wide ${
                      selectedDetailContract.statusContrato === 'Ativo' 
                        ? 'bg-green-50 text-green-700 border border-green-200' 
                        : selectedDetailContract.statusContrato === 'Renovação Pendente'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-red-50 text-[#ba1a1a] border border-red-200'
                    }`}>
                      {selectedDetailContract.statusContrato}
                    </span>
                    {selectedDetailContract.daysToExpiry !== null && selectedDetailContract.daysToExpiry > 0 && (
                      <span className="text-xs text-amber-600 font-bold">({selectedDetailContract.daysToExpiry} dias restantes)</span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#45464e]">
                    Contrato monitorado com renovação agendada sob termos standard junto ao distribuidor credenciado.
                  </p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-[#c6c6cf] space-y-2">
                  <span className="block text-[10px] font-mono font-bold uppercase text-[#45464e]">Conformidade Reguladora</span>
                  <div className="flex items-center gap-2">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-black tracking-wide ${
                      selectedDetailContract.complianceStatus === 'Conforme' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-[#ba1a1a]'
                    }`}>
                      {selectedDetailContract.complianceStatus}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#45464e]">
                    {selectedDetailContract.complianceStatus === 'Conforme' 
                      ? 'Todas as instalações ativas estão plenamente cobertas pelo volume de licenças contratado.' 
                      : 'Alerta crítico: há desvios de instalações sem cobertura contratual regulamentada. Requer regularização imediata.'
                    }
                  </p>
                </div>
              </div>

              {/* Financial Breakdown */}
              <div className="bg-white p-4 rounded-xl border border-[#c6c6cf] space-y-3">
                <h4 className="text-xs font-bold text-[#1e284c] uppercase tracking-wide flex items-center gap-1.5 border-b border-[#eff4ff] pb-2">
                  <DollarSign size={14} /> Faturamento & Custo Contratual
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="bg-[#f8f9ff] p-3 rounded-lg border border-[#c6c6cf]/40">
                    <span className="block text-[9px] font-mono uppercase font-bold text-[#45464e]">Ciclo de Cobrança</span>
                    <span className="text-sm font-bold text-[#1e284c] uppercase mt-1 block">
                      {selectedDetailContract.billingPeriod || 'mensal'}
                    </span>
                  </div>
                  <div className="bg-[#f8f9ff] p-3 rounded-lg border border-[#c6c6cf]/40">
                    <span className="block text-[9px] font-mono uppercase font-bold text-[#45464e]">Valor do Ciclo</span>
                    <span className="text-sm font-mono font-black text-[#0b1c30] mt-1 block">
                      {selectedDetailContract.billingAmount 
                        ? formatCurrency(selectedDetailContract.billingAmount) 
                        : formatCurrency(selectedDetailContract.custoMensal)
                      }
                    </span>
                  </div>
                  <div className="bg-green-50/50 p-3 rounded-lg border border-green-200">
                    <span className="block text-[9px] font-mono uppercase font-bold text-green-700">Equivalente Mensal</span>
                    <span className="text-sm font-mono font-black text-green-700 mt-1 block">
                      {formatCurrency(selectedDetailContract.custoMensal)}/mês
                    </span>
                  </div>
                </div>
              </div>

              {/* SLA & Service Level Accord Details */}
              <div className="bg-white p-4 rounded-xl border border-[#c6c6cf] space-y-3">
                <h4 className="text-xs font-bold text-[#1e284c] uppercase tracking-wide flex items-center gap-1.5 border-b border-[#eff4ff] pb-2">
                  <ShieldCheck size={14} /> Garantia de Nível de Serviço (SLA)
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center bg-[#f8f9ff] p-2 rounded">
                    <span className="text-[#45464e] font-semibold flex items-center gap-1">
                      <UserCheck size={13} className="text-[#1e284c]" /> Nível Acordado:
                    </span>
                    <span className="font-bold text-[#1e284c]">{selectedDetailContract.sla || 'Padrão (99.9% disponibilidade)'}</span>
                  </div>
                  <p className="text-[11px] text-[#45464e] leading-relaxed">
                    Este acordo garante compensação financeira creditada em fatura subsequente em caso de indisponibilidade de serviço excedente a 0,1% no mês de faturamento (equivalente a no máximo 43 minutos de downtime mensal).
                  </p>
                </div>
              </div>

              {/* Support & Contacts details */}
              <div className="p-4 rounded-xl border text-xs space-y-2 bg-[#eff4ff] border-[#c6c6cf]/80">
                <h4 className="font-bold text-[#1e284c] uppercase tracking-wide flex items-center gap-1.5">
                  <Sparkles size={14} className="text-[#1e284c]" /> Canais de Atendimento do Fabricante
                </h4>
                <p className="text-[#45464e]">
                  Para acionar a garantia de SLA ou reportar incidentes críticos de uso deste software, utilize os canais corporativos prioritários:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-[11px] mt-2">
                  <div className="bg-white p-2 rounded border border-[#c6c6cf]/50">
                    <span className="text-[#45464e]/80 block text-[9px] uppercase font-bold">Email Suporte</span>
                    <span className="text-[#1e284c] font-bold">suporte@{selectedDetailContract.vendor.toLowerCase()}.com</span>
                  </div>
                  <div className="bg-white p-2 rounded border border-[#c6c6cf]/50">
                    <span className="text-[#45464e]/80 block text-[9px] uppercase font-bold">Portal SAM do Fornecedor</span>
                    <span className="text-[#1e284c] font-bold">https://partners.{selectedDetailContract.vendor.toLowerCase()}.com/sam</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Footer Actions */}
            <div className="px-6 py-4 border-t border-[#c6c6cf] bg-[#f8f9ff] flex justify-between items-center">
              <span className="text-[10px] text-[#45464e] font-semibold italic">Identificador NexusSAM: {selectedDetailContract.id}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    handleDownloadContract(selectedDetailContract.softwareName, selectedDetailContract.contractNo);
                  }}
                  className="px-4 py-2 border border-[#c6c6cf] text-[#1e284c] hover:bg-[#eff4ff] rounded-lg text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5"
                >
                  <Download size={13} />
                  Baixar PDF Legal
                </button>
                <button
                  onClick={() => setSelectedDetailContract(null)}
                  className="px-4 py-2 bg-[#1e284c] text-white hover:bg-[#343e63] rounded-lg text-xs font-bold cursor-pointer transition-all"
                >
                  Fechar Painel
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
