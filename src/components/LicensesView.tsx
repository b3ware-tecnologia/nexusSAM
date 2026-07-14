import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Filter, 
  Calendar, 
  DollarSign, 
  X, 
  Layers, 
  AlertTriangle,
  CheckCircle2,
  Info,
  ShieldCheck,
  FileText,
  Laptop,
  Search
} from 'lucide-react';
import { License, CompanyData } from '../data-types';

interface LicensesViewProps {
  companyData: CompanyData;
  onAddLicense: (license: Omit<License, 'id'>) => void;
  onUpdateLicense: (id: string, updated: Partial<License>) => void;
  onDeleteLicense: (id: string) => void;
  searchQuery: string;
  onNavigateToDevice?: (deviceId: string) => void;
  onNavigateToTab?: (tab: string) => void;
}

export default function LicensesView({
  companyData,
  onAddLicense,
  onUpdateLicense,
  onDeleteLicense,
  searchQuery,
  onNavigateToDevice,
  onNavigateToTab
}: LicensesViewProps) {
  // Helper to compute License counts dynamically if not defined
  const getLicenseCounts = (lic: License) => {
    if (lic.qtyTotal !== undefined && lic.qtyUtilizada !== undefined) {
      return {
        total: lic.qtyTotal,
        utilizadas: lic.qtyUtilizada,
        ociosas: lic.qtyOciosa
      };
    }

    let total = 100;
    let ociosas = lic.qtyOciosa || 0;

    if (lic.softwareName.includes('Microsoft 365')) {
      total = 450;
    } else if (lic.softwareName.includes('Adobe')) {
      total = 120;
    } else if (lic.softwareName.includes('AutoCAD')) {
      total = 40;
    } else if (lic.softwareName.includes('CrowdStrike')) {
      total = 250;
    } else if (lic.softwareName.includes('Zoom')) {
      total = 300;
    } else if (lic.softwareName.includes('Figma')) {
      total = 60;
    } else if (lic.softwareName.includes('Project')) {
      total = 50;
    } else if (lic.softwareName.includes('Tableau')) {
      total = 15;
    } else {
      const seed = lic.id.charCodeAt(lic.id.length - 1) || 10;
      total = ((seed % 5) + 2) * 10;
    }

    let utilizadas = 0;
    if (lic.status === 'Em Uso') {
      utilizadas = total;
      ociosas = 0;
    } else if (lic.status === 'Não Conforme') {
      utilizadas = total + ociosas;
      ociosas = 0;
    } else {
      utilizadas = Math.max(0, total - ociosas);
    }

    return {
      total,
      utilizadas,
      ociosas
    };
  };

  // Local filter states
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [selectedStatus, setSelectedStatus] = useState<string>('Todos');
  
  // CRUD modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLicense, setEditingLicense] = useState<License | null>(null);

  // Detail Modal State
  const [selectedDetailLicense, setSelectedDetailLicense] = useState<License | null>(null);
  const [detailTab, setDetailTab] = useState<'info' | 'dispositivos'>('info');
  const [deviceSearchQuery, setDeviceSearchQuery] = useState('');

  const getInstalledDevicesForSoftware = (selectedLic: License) => {
    const licenses = companyData.licenses;
    const isAwsConnected = licenses.some(l => l.id.startsWith('lic-aws-'));

    const awsDevices = isAwsConnected ? [
      { id: 'dev-aws-1', hostname: 'AWS-EC2-WIN-01', ip: '172.31.10.4', mac: '02:00:FF:AA:BB:CC', usuario: 'Instância Cloud EC2', departamento: 'TI / Infra', tipo: 'Servidor' as const, so: 'Windows Server 2022 Datacenter', lastSeen: 'Sincronizado há 1 min', statusConexao: 'Online' as const },
      { id: 'dev-aws-2', hostname: 'AWS-RDS-SQL-02', ip: '172.31.25.18', mac: '02:00:FF:AA:BB:DD', usuario: 'Serviço RDS SQL Server', departamento: 'TI / Infra', tipo: 'Servidor' as const, so: 'AWS Managed Engine (SQL Server)', lastSeen: 'Sincronizado há 1 min', statusConexao: 'Online' as const },
      { id: 'dev-aws-3', hostname: 'AWS-RDS-ORCL-03', ip: '172.31.25.44', mac: '02:00:FF:AA:BB:EE', usuario: 'Serviço RDS Oracle DB', departamento: 'TI / Infra', tipo: 'Servidor' as const, so: 'AWS Managed Engine (Oracle Enterprise)', lastSeen: 'Sincronizado há 1 min', statusConexao: 'Online' as const }
    ] : [];
    
    const baseDevices = [
      { id: 'dev-1', hostname: 'PC-CORP-012', ip: '192.168.1.15', mac: '00:1A:2B:3C:4D:5E', usuario: 'Lucas Silva', departamento: 'Engenharia', tipo: 'Notebook' as const, so: 'Windows 11 Pro', lastSeen: 'Sincronizado há 5 min', statusConexao: 'Online' as const },
      { id: 'dev-2', hostname: 'PC-DSG-014', ip: '192.168.1.34', mac: '24:A0:64:12:3F:8B', usuario: 'Mariana Costa', departamento: 'Design', tipo: 'Notebook' as const, so: 'macOS Sequoia', lastSeen: 'Sincronizado há 14 min', statusConexao: 'Online' as const },
      { id: 'dev-3', hostname: 'PC-FIN-082', ip: '192.168.1.82', mac: '4E:88:51:7A:B3:9C', usuario: 'Roberto Souza', departamento: 'Financeiro', tipo: 'Desktop' as const, so: 'Windows 11 Pro', lastSeen: 'Sincronizado há 30 min', statusConexao: 'Online' as const },
      { id: 'dev-4', hostname: 'SRV-PROD-01', ip: '10.0.0.10', mac: 'BC:22:90:3F:E5:66', usuario: 'Serviço Centralizado', departamento: 'TI / Infra', tipo: 'Servidor' as const, so: 'Ubuntu Server 22.04 LTS', lastSeen: 'Sincronizado há 2 min', statusConexao: 'Online' as const },
      { id: 'dev-5', hostname: 'PC-MKT-055', ip: '192.168.1.112', mac: 'A1:C2:E3:F4:05:16', usuario: 'Camila Oliveira', departamento: 'Marketing', tipo: 'Notebook' as const, so: 'macOS Sequoia', lastSeen: 'Sincronizado há 45 min', statusConexao: 'Online' as const },
      { id: 'dev-6', hostname: 'PC-ENG-003', ip: '192.168.1.16', mac: 'F0:E1:D2:C3:B4:A5', usuario: 'Eduardo Rocha', departamento: 'Engenharia', tipo: 'Desktop' as const, so: 'Windows 10 Pro', lastSeen: 'Sincronizado há 1 hora', statusConexao: 'Online' as const },
      { id: 'dev-7', hostname: 'PC-HR-111', ip: '192.168.1.75', mac: '77:88:99:AA:BB:CC', usuario: 'Patricia Alencar', departamento: 'Recursos Humanos', tipo: 'Notebook' as const, so: 'Windows 11 Pro', lastSeen: 'Sincronizado há 2 horas', statusConexao: 'Online' as const },
      { id: 'dev-8', hostname: 'PC-DIR-001', ip: '192.168.1.20', mac: '11:22:33:44:55:66', usuario: 'Arthur Neto', departamento: 'Diretoria', tipo: 'Notebook' as const, so: 'macOS Sequoia', lastSeen: 'Ontem, 18:30', statusConexao: 'Offline' as const },
      { id: 'dev-9', hostname: 'PC-SUP-040', ip: '192.168.1.99', mac: 'A0:B1:C2:D3:E4:F5', usuario: 'Juliana Peres', departamento: 'Suporte', tipo: 'Desktop' as const, so: 'Windows 11 Pro', lastSeen: 'Sincronizado há 12 min', statusConexao: 'Online' as const },
      { id: 'dev-10', hostname: 'SRV-QA-02', ip: '10.0.0.21', mac: 'D0:C1:B2:A3:94:85', usuario: 'Ambiente de Testes', departamento: 'TI / Infra', tipo: 'Servidor' as const, so: 'RedHat Enterprise 9', lastSeen: 'Sincronizado há 8 min', statusConexao: 'Online' as const }
    ];

    const mergedDevices = [...baseDevices, ...awsDevices];

    return mergedDevices.map((dev, idx) => {
      const lic = selectedLic;
      const name = lic.softwareName;
      
      let shouldInstall = false;
      let softwareStatus: 'Em Uso' | 'Ociosa' | 'Não Conforme' = 'Em Uso';
      let softwareVersao = '2024.1';

      if (lic.category === 'Segurança' || name.includes('ESET') || name.includes('CrowdStrike')) {
        if (dev.hostname !== 'AWS-RDS-SQL-02' && dev.hostname !== 'AWS-RDS-ORCL-03') {
          shouldInstall = true;
          softwareVersao = '10.4.2';
          if (lic.status === 'Não Conforme' && idx % 3 === 0) {
            softwareStatus = 'Não Conforme';
          }
        }
      } 
      else if (lic.category === 'Produtividade' || name.includes('Microsoft') || name.includes('Zoom') || name.includes('Slack')) {
        if (dev.departamento !== 'TI / Infra' && !dev.hostname.startsWith('AWS-')) {
          shouldInstall = true;
          softwareVersao = name.includes('Microsoft') ? 'v16.0 Office 365' : 'v5.17';
          if (lic.status === 'Ociosa' && idx % 4 === 0) {
            softwareStatus = 'Ociosa';
          }
          if (lic.status === 'Não Conforme' && idx % 3 === 1) {
            softwareStatus = 'Não Conforme';
          }
        }
      }
      else if (lic.category === 'Design/Eng' || name.includes('Adobe') || name.includes('Figma') || name.includes('AutoCAD')) {
        if (dev.departamento === 'Design' || dev.departamento === 'Marketing') {
          shouldInstall = true;
          softwareVersao = '2024.3';
          if (lic.status === 'Ociosa' && name.includes('Adobe') && dev.hostname === 'PC-MKT-055') {
            softwareStatus = 'Ociosa';
          }
        } else if (dev.departamento === 'Engenharia' && name.includes('AutoCAD')) {
          shouldInstall = true;
          softwareVersao = 'v24.2';
          if (lic.status === 'Não Conforme') {
            softwareStatus = 'Não Conforme';
          }
        } else if (name.includes('Figma') && (dev.departamento === 'Design' || dev.departamento === 'Marketing' || dev.hostname === 'PC-CORP-012')) {
          shouldInstall = true;
          softwareVersao = 'Cloud Native';
        }
      }
      else if (name.includes('AWS')) {
        if (dev.hostname === 'AWS-EC2-WIN-01' && name.includes('Windows Server')) {
          shouldInstall = true;
          softwareVersao = 'Datacenter v2022';
          softwareStatus = 'Em Uso';
        } else if (dev.hostname === 'AWS-RDS-SQL-02' && name.includes('SQL Server')) {
          shouldInstall = true;
          softwareVersao = 'Enterprise 2019';
          softwareStatus = lic.status;
        } else if (dev.hostname === 'AWS-RDS-ORCL-03' && name.includes('Oracle Database')) {
          shouldInstall = true;
          softwareVersao = 'Enterprise 19c';
          softwareStatus = lic.status;
        }
      }
      else {
        if (dev.departamento === 'Financeiro' && name.includes('Tableau')) {
          shouldInstall = true;
          softwareVersao = '2023.2';
        } else if (dev.departamento === 'Engenharia' && name.includes('Project')) {
          shouldInstall = true;
          softwareVersao = 'v16.0';
        }
      }

      if (shouldInstall) {
        let softwareUltimoAcesso = '';
        if (softwareStatus === 'Em Uso') {
          softwareUltimoAcesso = '03/07/2026 10:15';
        } else if (softwareStatus === 'Ociosa') {
          softwareUltimoAcesso = '19/05/2026 14:20';
        } else {
          softwareUltimoAcesso = '03/07/2026 08:34';
        }

        return {
          id: dev.id,
          hostname: dev.hostname,
          ip: dev.ip,
          mac: dev.mac,
          usuario: dev.usuario,
          departamento: dev.departamento,
          tipo: dev.tipo,
          so: dev.so,
          lastSeen: dev.lastSeen,
          statusConexao: dev.statusConexao,
          installedVersion: softwareVersao,
          installedStatus: softwareStatus,
          ultimoAcesso: softwareUltimoAcesso
        };
      }
      return null;
    }).filter((d): d is NonNullable<typeof d> => d !== null);
  };

  // Form states
  const [formSoftwareName, setFormSoftwareName] = useState('');
  const [formCategory, setFormCategory] = useState<'Produtividade' | 'Design/Eng' | 'Segurança' | 'Utilities'>('Produtividade');
  const [formStatus, setFormStatus] = useState<'Em Uso' | 'Ociosa' | 'Não Conforme'>('Em Uso');
  const [formQtyOciosa, setFormQtyOciosa] = useState(0);
  const [formQtyTotal, setFormQtyTotal] = useState(100);
  const [formQtyUtilizada, setFormQtyUtilizada] = useState(100);
  const [formCustoMensal, setFormCustoMensal] = useState(0);
  const [formExpiryDate, setFormExpiryDate] = useState('');
  const [formVendor, setFormVendor] = useState<'Microsoft' | 'Adobe' | 'Autodesk' | 'Outros'>('Microsoft');

  // Open modal for adding
  const handleOpenAddModal = () => {
    setEditingLicense(null);
    setFormSoftwareName('');
    setFormCategory('Produtividade');
    setFormStatus('Em Uso');
    setFormQtyOciosa(0);
    setFormQtyTotal(100);
    setFormQtyUtilizada(100);
    setFormCustoMensal(0);
    setFormExpiryDate('2026-12-31');
    setFormVendor('Microsoft');
    setModalOpen(true);
  };

  // Open modal for editing
  const handleOpenEditModal = (lic: License) => {
    const counts = getLicenseCounts(lic);
    setEditingLicense(lic);
    setFormSoftwareName(lic.softwareName);
    setFormCategory(lic.category);
    setFormStatus(lic.status);
    setFormQtyOciosa(lic.qtyOciosa);
    setFormQtyTotal(lic.qtyTotal || counts.total);
    setFormQtyUtilizada(lic.qtyUtilizada || counts.utilizadas);
    setFormCustoMensal(lic.custoMensal);
    setFormExpiryDate(lic.expiryDate || '');
    setFormVendor(lic.vendor);
    setModalOpen(true);
  };

  // Handle submit form
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Potencial economia logic: if status is ociosa, potencial = cost. If status is não conforme, potencial = cost. Else 0.
    const potencialEconomia = formStatus === 'Ociosa' 
      ? formCustoMensal 
      : formStatus === 'Não Conforme' 
        ? formCustoMensal 
        : 0;

    const licensePayload = {
      softwareName: formSoftwareName || 'Software Sem Nome',
      category: formCategory,
      status: formStatus,
      qtyOciosa: Number(formQtyOciosa) || 0,
      qtyTotal: Number(formQtyTotal) || 0,
      qtyUtilizada: Number(formQtyUtilizada) || 0,
      potencialEconomia: potencialEconomia,
      custoMensal: Number(formCustoMensal) || 0,
      expiryDate: formExpiryDate,
      vendor: formVendor
    };

    if (editingLicense) {
      onUpdateLicense(editingLicense.id, licensePayload);
    } else {
      onAddLicense(licensePayload);
    }

    setModalOpen(false);
  };

  // Filtering Licenses list
  const filteredLicenses = companyData.licenses.filter(lic => {
    const matchesSearch = lic.softwareName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          lic.vendor.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'Todos' || lic.category === selectedCategory;
    const matchesStatus = selectedStatus === 'Todos' || lic.status === selectedStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="space-y-6 select-none animate-fade-in">

      {/* Resumo Geral de Licenças */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total */}
        <div className="bg-white p-5 rounded-xl border border-[#c6c6cf] shadow-sm flex items-center justify-between hover:shadow-md transition-all">
          <div>
            <p className="text-[9px] font-mono uppercase font-bold text-[#45464e] tracking-wider mb-1">Total de Licenças</p>
            <p className="text-2xl font-black text-[#0b1c30] font-headline">{companyData.licencasGerenciadas}</p>
            <p className="text-[10px] text-[#45464e] mt-1 font-medium">unidades monitoradas no inventário</p>
          </div>
          <div className="bg-[#eff4ff] p-3 rounded-xl text-[#1e284c]">
            <Layers size={22} />
          </div>
        </div>

        {/* Utilizadas */}
        <div className="bg-white p-5 rounded-xl border border-[#c6c6cf] shadow-sm flex items-center justify-between hover:shadow-md transition-all">
          <div>
            <p className="text-[9px] font-mono uppercase font-bold text-[#45464e] tracking-wider mb-1">Licenças Utilizadas</p>
            <p className="text-2xl font-black text-green-700 font-headline">
              {Math.max(0, companyData.licencasGerenciadas - companyData.licenses.reduce((sum, lic) => sum + (lic.qtyOciosa || 0), 0))}
            </p>
            <p className="text-[10px] text-green-600 mt-1 font-medium">atribuídas a colaboradores ativos</p>
          </div>
          <div className="bg-green-50 p-3 rounded-xl text-green-600">
            <CheckCircle2 size={22} />
          </div>
        </div>

        {/* Ociosas */}
        <div className="bg-white p-4 rounded-sm border border-slate-200 shadow-sm flex items-center justify-between hover:border-[#00B551] transition-all">
          <div>
            <p className="text-[9px] font-mono uppercase font-bold text-slate-500 tracking-wider mb-1">Licenças Ociosas</p>
            <p className="text-2xl font-black text-amber-600 font-headline">
              {companyData.licenses.reduce((sum, lic) => sum + (lic.qtyOciosa || 0), 0)}
            </p>
            <p className="text-[10px] text-amber-600 mt-1 font-medium">potencial imediato de otimização</p>
          </div>
          <div className="bg-amber-50 p-3 rounded-xl text-amber-600">
            <AlertTriangle size={22} />
          </div>
        </div>
      </div>
      
      {/* Header Controls: Filters & Actions */}
      <div className="bg-white p-4 rounded-sm border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        
        {/* Dynamic Category and Status Filters */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Category Selector */}
          <div className="flex items-center gap-1.5">
            <Filter size={14} className="text-slate-500" />
            <span className="text-xs font-semibold text-slate-600">Categoria:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-800 border border-slate-200 rounded-sm px-2.5 py-1.5 focus:ring-1 focus:ring-[#00B551] cursor-pointer"
            >
              <option value="Todos">Todas Categorias</option>
              <option value="Produtividade">Produtividade</option>
              <option value="Design/Eng">Design / Engenharia</option>
              <option value="Segurança">Segurança</option>
              <option value="Utilities">Utilities</option>
            </select>
          </div>

          {/* Status Selector */}
          <div className="flex items-center gap-1.5 ml-2">
            <span className="text-xs font-semibold text-slate-600">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-800 border border-slate-200 rounded-sm px-2.5 py-1.5 focus:ring-1 focus:ring-[#00B551] cursor-pointer"
            >
              <option value="Todos">Todos Status</option>
              <option value="Em Uso">Em Uso</option>
              <option value="Ociosa">Ociosa</option>
              <option value="Não Conforme">Não Conforme</option>
            </select>
          </div>

        </div>

        {/* Action Button: Add License */}
        <button
          onClick={handleOpenAddModal}
          className="bg-[#00B551] text-white hover:bg-[#00cd5c] font-sans text-xs font-bold px-4 py-2 rounded-sm flex items-center gap-2 transition-all active:scale-95 cursor-pointer shadow-sm border border-transparent hover:border-[#00B551]"
        >
          <Plus size={16} />
          Cadastrar Licença
        </button>
      </div>

      {/* Licenses Data Table */}
      <div className="bg-white rounded-sm border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse zebra-table">
            <thead className="bg-slate-100 text-[10px] font-mono uppercase text-slate-600 border-b border-slate-200">
              <tr>
                <th className="px-5 py-3 font-bold">Software</th>
                <th className="px-5 py-3 font-bold">Fabricante</th>
                <th className="px-5 py-3 font-bold">Categoria</th>
                <th className="px-5 py-3 font-bold text-center">Status</th>
                <th className="px-5 py-3 font-bold text-center">Licenças (Total/Uso/Ociosa)</th>
                <th className="px-5 py-3 font-bold text-right">Custo Mensal</th>
                <th className="px-5 py-3 font-bold text-right">Validade</th>
                <th className="px-5 py-3 font-bold text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="text-xs text-slate-800 divide-y divide-slate-100">
              {filteredLicenses.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-500 font-medium">
                    Nenhum registro encontrado correspondente aos filtros.
                  </td>
                </tr>
              ) : (
                filteredLicenses.map((lic) => {
                  const counts = getLicenseCounts(lic);
                  return (
                    <tr 
                      key={lic.id} 
                      className="hover:bg-slate-50 transition-all cursor-pointer border-l-[3px] border-l-transparent hover:border-l-[#00B551]"
                      onClick={() => {
                        setSelectedDetailLicense(lic);
                        setDetailTab('info');
                        setDeviceSearchQuery('');
                      }}
                      title="Clique para ver detalhes completos"
                    >
                      <td className="px-6 py-4 font-bold text-[#1e284c] text-sm">
                        {lic.softwareName}
                      </td>
                      <td className="px-6 py-4 font-semibold text-[#45464e]">
                        {lic.vendor}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium bg-[#f8f9ff] border border-[#c6c6cf]/50 px-2 py-0.5 rounded">
                          {lic.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black tracking-wide ${
                          lic.status === 'Em Uso' 
                            ? 'bg-green-50 text-green-700 border border-green-200' 
                            : lic.status === 'Ociosa'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-red-50 text-[#ba1a1a] border border-red-200'
                        }`}>
                          {lic.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center font-mono">
                        <div className="flex flex-col items-center">
                          <div className="flex items-center gap-1.5 justify-center">
                            <span className="font-bold text-[#0b1c30] text-sm" title="Total de Licenças Contratadas">{counts.total}</span>
                            <span className="text-[#c6c6cf] text-xs">/</span>
                            <span className="font-semibold text-green-700 text-sm" title="Licenças Utilizadas">{counts.utilizadas}</span>
                            <span className="text-[#c6c6cf] text-xs">/</span>
                            <span className={`font-semibold text-sm ${counts.ociosas > 0 ? 'text-amber-600' : 'text-[#45464e]'}`} title="Licenças Ociosas">{counts.ociosas}</span>
                          </div>
                          <div className="text-[9px] text-[#45464e] font-semibold flex gap-2.5 mt-0.5 uppercase tracking-wider">
                            <span className="text-[9px] text-[#45464e]/60">Total</span>
                            <span className="text-[9px] text-green-700/80">Uso</span>
                            <span className="text-[9px] text-amber-600/80">Ociosa</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-semibold text-[#0b1c30]">
                        {formatCurrency(lic.custoMensal)}
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-[#45464e]">
                        {lic.expiryDate || 'Sem Expiração'}
                      </td>
                      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-2">
                          {/* Edit Button */}
                          <button
                            onClick={() => handleOpenEditModal(lic)}
                            className="p-1.5 hover:bg-[#eff4ff] text-[#1e284c] rounded transition-colors cursor-pointer"
                            title="Editar Licença"
                          >
                            <Edit3 size={15} />
                          </button>
                          {/* Delete Button */}
                          <button
                            onClick={() => {
                              if (confirm(`Tem certeza que deseja excluir a licença de ${lic.softwareName}?`)) {
                                onDeleteLicense(lic.id);
                              }
                            }}
                            className="p-1.5 hover:bg-red-50 text-[#ba1a1a] rounded transition-colors cursor-pointer"
                            title="Excluir Licença"
                          >
                            <Trash2 size={15} />
                          </button>
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

      {/* CRUD Add/Edit License Dialog Overlay */}
      {modalOpen && (
        <div className="fixed inset-0 bg-[#0b1c30]/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-[#c6c6cf] shadow-xl w-full max-w-lg overflow-hidden animate-scale-in">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#c6c6cf] bg-[#f8f9ff] flex justify-between items-center">
              <h3 className="font-headline text-md font-bold text-[#1e284c] flex items-center gap-2">
                <Layers size={18} />
                {editingLicense ? 'Editar Licença Cadastrada' : 'Cadastrar Nova Licença'}
              </h3>
              <button 
                onClick={() => setModalOpen(false)}
                className="p-1.5 hover:bg-[#eff4ff] rounded-full transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              
              {/* Software Name */}
              <div>
                <label className="block text-xs font-bold text-[#45464e] uppercase mb-1">Nome do Software / Versão *</label>
                <input
                  type="text"
                  required
                  value={formSoftwareName}
                  onChange={(e) => setFormSoftwareName(e.target.value)}
                  className="w-full bg-[#f8f9ff] border border-[#c6c6cf] focus:ring-2 focus:ring-[#1e284c] focus:bg-white rounded-lg px-3 py-2 text-sm focus:outline-none"
                  placeholder="Ex: Microsoft Project Pro"
                />
              </div>

              {/* Vendor & Category Side-by-Side */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#45464e] uppercase mb-1">Fabricante</label>
                  <select
                    value={formVendor}
                    onChange={(e) => setFormVendor(e.target.value as any)}
                    className="w-full bg-[#f8f9ff] border border-[#c6c6cf] focus:ring-2 focus:ring-[#1e284c] rounded-lg p-2 text-sm focus:outline-none"
                  >
                    <option value="Microsoft">Microsoft</option>
                    <option value="Adobe">Adobe</option>
                    <option value="Autodesk">Autodesk</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#45464e] uppercase mb-1">Categoria</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="w-full bg-[#f8f9ff] border border-[#c6c6cf] focus:ring-2 focus:ring-[#1e284c] rounded-lg p-2 text-sm focus:outline-none"
                  >
                    <option value="Produtividade">Produtividade</option>
                    <option value="Design/Eng">Design / Eng</option>
                    <option value="Segurança">Segurança</option>
                    <option value="Utilities">Utilities</option>
                  </select>
                </div>
              </div>

              {/* Status and Qty Ociosa Grid */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-[#45464e] uppercase mb-1">Status Licença</label>
                  <select
                    value={formStatus}
                    onChange={(e) => {
                      const st = e.target.value as any;
                      setFormStatus(st);
                      if (st === 'Em Uso') {
                        setFormQtyOciosa(0);
                        setFormQtyUtilizada(formQtyTotal);
                      } else if (st === 'Ociosa') {
                        setFormQtyOciosa(Math.max(0, formQtyTotal - formQtyUtilizada));
                      } else {
                        // Não Conforme
                        setFormQtyOciosa(Math.max(0, formQtyUtilizada - formQtyTotal));
                      }
                    }}
                    className="w-full bg-[#f8f9ff] border border-[#c6c6cf] focus:ring-2 focus:ring-[#1e284c] rounded-lg p-2 text-sm focus:outline-none"
                  >
                    <option value="Em Uso">Em Uso</option>
                    <option value="Ociosa">Ociosa</option>
                    <option value="Não Conforme">Não Conforme</option>
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#45464e] uppercase mb-1" title="Total de licenças contratadas">Total</label>
                    <input
                      type="number"
                      required
                      value={formQtyTotal}
                      onChange={(e) => {
                        const val = Math.max(0, parseInt(e.target.value) || 0);
                        setFormQtyTotal(val);
                        if (formStatus === 'Em Uso') {
                          setFormQtyUtilizada(val);
                          setFormQtyOciosa(0);
                        } else if (formStatus === 'Ociosa') {
                          setFormQtyOciosa(Math.max(0, val - formQtyUtilizada));
                        } else {
                          // Não Conforme
                          setFormQtyUtilizada(val + formQtyOciosa);
                        }
                      }}
                      className="w-full bg-[#f8f9ff] border border-[#c6c6cf] focus:ring-2 focus:ring-[#1e284c] focus:bg-white rounded-lg px-3 py-2 text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#45464e] uppercase mb-1" title="Licenças ativas em uso">Utilizadas</label>
                    <input
                      type="number"
                      required
                      value={formQtyUtilizada}
                      onChange={(e) => {
                        const val = Math.max(0, parseInt(e.target.value) || 0);
                        setFormQtyUtilizada(val);
                        if (formStatus === 'Em Uso') {
                          setFormQtyTotal(val);
                          setFormQtyOciosa(0);
                        } else if (formStatus === 'Ociosa') {
                          if (val > formQtyTotal) {
                            setFormQtyTotal(val);
                            setFormQtyOciosa(0);
                          } else {
                            setFormQtyOciosa(formQtyTotal - val);
                          }
                        } else if (formStatus === 'Não Conforme') {
                          if (val < formQtyTotal) {
                            setFormQtyTotal(val);
                            setFormQtyOciosa(0);
                          } else {
                            setFormQtyOciosa(val - formQtyTotal);
                          }
                        }
                      }}
                      className="w-full bg-[#f8f9ff] border border-[#c6c6cf] focus:ring-2 focus:ring-[#1e284c] focus:bg-white rounded-lg px-3 py-2 text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#45464e] uppercase mb-1" title="Quantidade de licenças ociosas ou desvios de conformidade">Ociosas / Desvios</label>
                    <input
                      type="number"
                      required
                      disabled={formStatus === 'Em Uso'}
                      value={formQtyOciosa}
                      onChange={(e) => {
                        const val = Math.max(0, parseInt(e.target.value) || 0);
                        setFormQtyOciosa(val);
                        if (formStatus === 'Ociosa') {
                          setFormQtyUtilizada(Math.max(0, formQtyTotal - val));
                        } else if (formStatus === 'Não Conforme') {
                          setFormQtyUtilizada(formQtyTotal + val);
                        }
                      }}
                      className="w-full bg-[#f8f9ff] disabled:opacity-50 border border-[#c6c6cf] focus:ring-2 focus:ring-[#1e284c] focus:bg-white rounded-lg px-3 py-2 text-sm focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Cost & Expiry Date Side-by-Side */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#45464e] uppercase mb-1">Custo Mensal (R$)</label>
                  <input
                    type="number"
                    required
                    value={formCustoMensal}
                    onChange={(e) => setFormCustoMensal(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full bg-[#f8f9ff] border border-[#c6c6cf] focus:ring-2 focus:ring-[#1e284c] focus:bg-white rounded-lg px-3 py-2 text-sm focus:outline-none"
                    placeholder="Valor em reais"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#45464e] uppercase mb-1">Validade de Contrato</label>
                  <input
                    type="date"
                    value={formExpiryDate}
                    onChange={(e) => setFormExpiryDate(e.target.value)}
                    className="w-full bg-[#f8f9ff] border border-[#c6c6cf] focus:ring-2 focus:ring-[#1e284c] focus:bg-white rounded-lg px-3 py-2 text-sm focus:outline-none"
                  />
                </div>
              </div>

              {/* Info Notification depending on choices */}
              {formStatus === 'Não Conforme' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-[#ba1a1a] flex gap-2 items-start">
                  <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                  <span>
                    Marcar esta licença como <strong>Não Conforme</strong> sinalizará um alerta crítico de conformidade e impactará o termômetro global da empresa até que seja regularizado.
                  </span>
                </div>
              )}

              {formStatus === 'Ociosa' && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700 flex gap-2 items-start">
                  <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
                  <span>
                    Marcar como <strong>Ociosa</strong> indicará que este software possui desperdício financeiro de {formatCurrency(formCustoMensal)}, disponível para otimização rápida no painel correspondente.
                  </span>
                </div>
              )}

              {/* Form Footer Action buttons */}
              <div className="pt-4 border-t border-[#c6c6cf] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-[#c6c6cf] text-[#45464e] hover:bg-[#f8f9ff] rounded-lg text-xs font-bold cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1e284c] text-white hover:bg-[#343e63] rounded-lg text-xs font-bold cursor-pointer transition-colors"
                >
                  {editingLicense ? 'Salvar Alterações' : 'Confirmar Cadastro'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* DETALHES COMPLETOS DO ITEM (MODAL DE DETALHES) */}
      {selectedDetailLicense && (
        <div 
          className="fixed inset-0 bg-[#0b1c30]/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity"
          onClick={() => setSelectedDetailLicense(null)}
        >
          <div 
            className="bg-white rounded-2xl border border-[#c6c6cf] shadow-2xl w-full max-w-2xl overflow-hidden animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            
            {/* Header */}
            <div className="px-6 py-5 border-b border-[#c6c6cf] bg-[#f8f9ff] flex justify-between items-center">
              <div>
                <span className="font-mono text-[9px] uppercase font-bold text-[#45464e] tracking-wider px-2 py-0.5 bg-[#eff4ff] rounded">
                  Ficha Técnica de Licenciamento
                </span>
                <h3 className="font-headline text-lg font-black text-[#1e284c] mt-1 flex items-center gap-2">
                  <Laptop size={20} className="text-[#1e284c]" />
                  {selectedDetailLicense.softwareName}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedDetailLicense(null)}
                className="p-1.5 hover:bg-[#eff4ff] rounded-full transition-colors cursor-pointer text-[#45464e]"
              >
                <X size={18} />
              </button>
            </div>

            {/* Tabs inside modal */}
            {(() => {
              const installedDevs = getInstalledDevicesForSoftware(selectedDetailLicense);
              return (
                <div className="flex border-b border-[#c6c6cf] px-6 bg-[#f8f9ff]">
                  <button
                    onClick={() => setDetailTab('info')}
                    className={`py-3 px-4 text-xs font-bold tracking-wide uppercase transition-all border-b-2 -mb-[1px] cursor-pointer ${
                      detailTab === 'info'
                        ? 'border-[#1e284c] text-[#1e284c]'
                        : 'border-transparent text-[#45464e] hover:text-[#1e284c]'
                    }`}
                  >
                    Informações Gerais
                  </button>
                  <button
                    onClick={() => setDetailTab('dispositivos')}
                    className={`py-3 px-4 text-xs font-bold tracking-wide uppercase transition-all border-b-2 -mb-[1px] cursor-pointer flex items-center gap-1.5 ${
                      detailTab === 'dispositivos'
                        ? 'border-[#1e284c] text-[#1e284c]'
                        : 'border-transparent text-[#45464e] hover:text-[#1e284c]'
                    }`}
                  >
                    <Laptop size={14} />
                    Dispositivos ({installedDevs.length})
                  </button>
                </div>
              );
            })()}

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar text-[#0b1c30]">
              {detailTab === 'info' ? (
                <>
                  {/* Overview Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-[#f8f9ff] p-4 rounded-xl border border-[#c6c6cf]/60">
                    <div>
                      <span className="block text-[9px] font-mono font-bold uppercase text-[#45464e] tracking-wider">Fabricante</span>
                      <span className="text-sm font-black text-[#1e284c]">{selectedDetailLicense.vendor}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] font-mono font-bold uppercase text-[#45464e] tracking-wider">Categoria</span>
                      <span className="text-sm font-black text-[#1e284c]">{selectedDetailLicense.category}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] font-mono font-bold uppercase text-[#45464e] tracking-wider">Status SAM</span>
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-extrabold mt-0.5 ${
                        selectedDetailLicense.status === 'Em Uso' 
                          ? 'bg-green-50 text-green-700 border border-green-200' 
                          : selectedDetailLicense.status === 'Ociosa'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-red-50 text-[#ba1a1a] border border-red-200'
                      }`}>
                        {selectedDetailLicense.status}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[9px] font-mono font-bold uppercase text-[#45464e] tracking-wider">Custo Mensal</span>
                      <span className="text-sm font-mono font-black text-[#0b1c30]">{formatCurrency(selectedDetailLicense.custoMensal)}</span>
                    </div>
                  </div>

                  {/* Progress and Volumetry Card */}
                  <div className="space-y-3 bg-white p-4 rounded-xl border border-[#c6c6cf]">
                    <h4 className="text-xs font-bold text-[#1e284c] uppercase tracking-wide flex items-center gap-1.5 border-b border-[#eff4ff] pb-2">
                      <Layers size={14} /> Volumetria de Alocação e Uso
                    </h4>
                    
                    {(() => {
                      const counts = getLicenseCounts(selectedDetailLicense);
                      const utilizationRate = counts.total > 0 ? Math.round((counts.utilizadas / counts.total) * 100) : 0;
                      return (
                        <div className="space-y-4">
                          <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="bg-[#eff4ff]/60 p-2.5 rounded-lg border border-[#eff4ff]">
                              <span className="block text-[9px] font-mono font-bold uppercase text-[#45464e]">Contratadas</span>
                              <span className="text-base font-black text-[#1e284c]">{counts.total}</span>
                            </div>
                            <div className="bg-green-50/60 p-2.5 rounded-lg border border-green-100">
                              <span className="block text-[9px] font-mono font-bold uppercase text-green-700">Ativas (Uso)</span>
                              <span className="text-base font-black text-green-700">{counts.utilizadas}</span>
                            </div>
                            <div className="bg-amber-50/60 p-2.5 rounded-lg border border-amber-100">
                              <span className="block text-[9px] font-mono font-bold uppercase text-amber-700">Ociosas / Desvio</span>
                              <span className={`text-base font-black ${counts.ociosas > 0 ? 'text-amber-700' : 'text-[#45464e]'}`}>{counts.ociosas}</span>
                            </div>
                          </div>

                          {/* Progress Bar */}
                          <div className="space-y-1">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-semibold text-[#45464e]">Taxa de Utilização Efetiva</span>
                              <span className="font-mono font-bold text-[#1e284c]">{utilizationRate}%</span>
                            </div>
                            <div className="w-full bg-[#f8f9ff] h-3.5 rounded-full border border-[#c6c6cf] overflow-hidden p-0.5">
                              <div 
                                className={`h-full rounded-full transition-all duration-500 ${
                                  selectedDetailLicense.status === 'Não Conforme'
                                    ? 'bg-[#ba1a1a]'
                                    : utilizationRate > 80 
                                      ? 'bg-green-600' 
                                      : utilizationRate > 40 
                                        ? 'bg-amber-500' 
                                        : 'bg-red-500'
                                }`}
                                style={{ width: `${Math.min(100, utilizationRate)}%` }}
                              ></div>
                            </div>
                            <p className="text-[10px] text-[#45464e] italic">
                              * Um percentual abaixo de 80% indica margem para renegociação de tiers de licenças com o fornecedor.
                            </p>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Financial and Billing details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Finance Info */}
                    <div className="bg-white p-4 rounded-xl border border-[#c6c6cf] space-y-3">
                      <h4 className="text-xs font-bold text-[#1e284c] uppercase tracking-wide flex items-center gap-1.5 border-b border-[#eff4ff] pb-2">
                        <DollarSign size={14} /> Faturamento & Custo
                      </h4>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-[#45464e] font-medium">Ciclo de Cobrança:</span>
                          <span className="font-bold text-[#0b1c30] uppercase">{selectedDetailLicense.billingPeriod || 'mensal'}</span>
                        </div>
                        <div className="flex justify-between border-t border-[#eff4ff] pt-2">
                          <span className="text-[#45464e] font-medium">Valor do Faturamento:</span>
                          <span className="font-mono font-bold text-[#0b1c30]">
                            {selectedDetailLicense.billingAmount 
                              ? formatCurrency(selectedDetailLicense.billingAmount) 
                              : formatCurrency(selectedDetailLicense.custoMensal)
                            }
                          </span>
                        </div>
                        <div className="flex justify-between border-t border-[#eff4ff] pt-2">
                          <span className="text-[#45464e] font-medium">Custo Mensal Equivalente:</span>
                          <span className="font-mono font-bold text-green-700">{formatCurrency(selectedDetailLicense.custoMensal)}/mês</span>
                        </div>
                        {selectedDetailLicense.potencialEconomia > 0 && (
                          <div className="flex justify-between border-t border-[#eff4ff] pt-2 text-amber-700 bg-amber-50/50 p-1 rounded animate-pulse">
                            <span className="font-medium flex items-center gap-1"><AlertTriangle size={12} /> Desperdício Mensal:</span>
                            <span className="font-mono font-black">{formatCurrency(selectedDetailLicense.potencialEconomia)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Contractual Info */}
                    <div className="bg-white p-4 rounded-xl border border-[#c6c6cf] space-y-3">
                      <h4 className="text-xs font-bold text-[#1e284c] uppercase tracking-wide flex items-center gap-1.5 border-b border-[#eff4ff] pb-2">
                        <FileText size={14} /> Conformidade & SLA
                      </h4>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-[#45464e] font-medium">Nº de Contrato:</span>
                          <span className="font-mono font-bold text-[#1e284c]">{selectedDetailLicense.contractNo || 'N/A (Atribuição direta)'}</span>
                        </div>
                        <div className="flex justify-between border-t border-[#eff4ff] pt-2">
                          <span className="text-[#45464e] font-medium">SLA de Atendimento:</span>
                          <span className="font-semibold text-[#45464e]">{selectedDetailLicense.sla || 'Padrão (99.5% disponibilidade)'}</span>
                        </div>
                        <div className="flex justify-between border-t border-[#eff4ff] pt-2">
                          <span className="text-[#45464e] font-medium">Vencimento do Contrato:</span>
                          <span className="font-mono font-semibold text-[#45464e]">{selectedDetailLicense.expiryDate || 'Sem Expiração'}</span>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* SAM Diagnostic / Recommendations */}
                  <div className="p-4 rounded-xl border text-xs space-y-2 bg-[#eff4ff] border-[#c6c6cf]/80">
                    <h4 className="font-bold text-[#1e284c] uppercase tracking-wide flex items-center gap-1.5">
                      <Info size={14} className="text-[#1e284c]" /> Recomendação de Otimização Inteligente
                    </h4>
                    {selectedDetailLicense.status === 'Em Uso' ? (
                      <p className="text-[#45464e] leading-relaxed">
                        Este software está operando com <strong>excelente conformidade e uso pleno</strong>. Continue monitorando as licenças ociosas para garantir que as novas contratações sejam efetuadas apenas após exaustão do inventário existente.
                      </p>
                    ) : selectedDetailLicense.status === 'Ociosa' ? (
                      <p className="text-[#45464e] leading-relaxed">
                        <strong>Atenção:</strong> Foram detectadas {selectedDetailLicense.qtyOciosa} licenças ociosas neste software. Recomendamos migrar para a aba <strong onClick={() => onNavigateToTab?.('otimizacao')} className="underline cursor-pointer hover:text-amber-700 transition-colors">Otimização Financeira</strong> para recuperar e reatribuir essas licenças a outros colaboradores de forma 100% automatizada, reduzindo o custo em até <span className="font-bold text-amber-700">{formatCurrency(selectedDetailLicense.potencialEconomia)}</span>.
                      </p>
                    ) : (
                      <p className="text-[#ba1a1a] leading-relaxed font-medium">
                        <strong>Alerta de Conformidade:</strong> O número de softwares instalados excede o número de licenças legalmente adquiridas! Isso gera riscos regulatórios sérios para a auditoria corporativa. Recomendamos regularizar a situation adquirindo licenças adicionais na aba <strong onClick={() => onNavigateToTab?.('conformidade')} className="underline cursor-pointer hover:text-red-700 transition-colors">Conformidade Legal</strong>.
                      </p>
                    )}
                  </div>

                  {/* Recomendações de Segurança Específicas */}
                  {(() => {
                    const securityAlerts = companyData.alerts.filter(a => 
                      a.type === 'security' && 
                      (a.softwareName.toLowerCase().includes(selectedDetailLicense.softwareName.toLowerCase()) ||
                       selectedDetailLicense.softwareName.toLowerCase().includes(a.softwareName.toLowerCase()))
                    );
                    
                    return (
                      <div className={`p-4 rounded-xl border text-xs space-y-2 ${
                        securityAlerts.length > 0 
                          ? 'bg-red-50 border-red-200' 
                          : 'bg-green-50/60 border-green-200/80'
                      }`}>
                        <h4 className={`font-bold uppercase tracking-wide flex items-center gap-1.5 ${
                          securityAlerts.length > 0 ? 'text-red-800' : 'text-green-800'
                        }`}>
                          {securityAlerts.length > 0 ? (
                            <>
                              <AlertTriangle size={14} className="text-red-700" /> Recomendações de Segurança Ativas
                            </>
                          ) : (
                            <>
                              <ShieldCheck size={14} className="text-green-700" /> Segurança & Conformidade TI
                            </>
                          )}
                        </h4>
                        
                        {securityAlerts.length > 0 ? (
                          <div className="space-y-2 text-[#45464e] leading-relaxed">
                            {securityAlerts.map((alert) => (
                              <div key={alert.id} className="border-b border-red-100/60 last:border-0 pb-1.5 last:pb-0 animate-fade-in">
                                <p className="text-red-900 font-semibold mb-0.5">
                                  Alerta de {alert.severity === 'high' ? 'Alto Risco' : 'Médio Risco'}:
                                </p>
                                <p className="text-xs">{alert.message}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-green-800 leading-relaxed">
                            Nenhum alerta de segurança ou patch crítico pendente para <strong>{selectedDetailLicense.softwareName}</strong>. O software está atualizado e opera de acordo com as políticas corporativas de governança de TI.
                          </p>
                        )}
                      </div>
                    );
                  })()}
                </>
              ) : (
                <div className="space-y-4 animate-fade-in">
                  {(() => {
                    const allInstalledDevs = getInstalledDevicesForSoftware(selectedDetailLicense);
                    const filteredInstalledDevs = allInstalledDevs.filter(dev => {
                      const query = deviceSearchQuery.toLowerCase();
                      return (
                        dev.hostname.toLowerCase().includes(query) ||
                        dev.usuario.toLowerCase().includes(query) ||
                        dev.departamento.toLowerCase().includes(query) ||
                        dev.ip.toLowerCase().includes(query) ||
                        dev.so.toLowerCase().includes(query)
                      );
                    });

                    return (
                      <>
                        <div className="flex justify-between items-center bg-[#eff4ff]/60 px-4 py-3 rounded-lg border border-[#eff4ff]">
                          <span className="text-xs font-medium text-[#45464e]">
                            Total de instalações detectadas nesta empresa:
                          </span>
                          <span className="font-mono font-black text-sm text-[#1e284c] bg-white border border-[#c6c6cf]/60 px-2.5 py-1 rounded">
                            {allInstalledDevs.length} máquinas
                          </span>
                        </div>

                        {allInstalledDevs.length > 0 && (
                          <div className="relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                              <Search size={16} />
                            </span>
                            <input
                              type="text"
                              placeholder="Pesquisar por hostname, usuário, departamento, IP..."
                              value={deviceSearchQuery}
                              onChange={(e) => setDeviceSearchQuery(e.target.value)}
                              className="w-full pl-10 pr-4 py-2 border border-[#c6c6cf] rounded-lg text-xs bg-white text-[#0b1c30] placeholder-gray-400 focus:outline-none focus:border-[#1e284c] focus:ring-1 focus:ring-[#1e284c]"
                            />
                            {deviceSearchQuery && (
                              <button
                                onClick={() => setDeviceSearchQuery('')}
                                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 animate-fade-in"
                              >
                                <X size={14} />
                              </button>
                            )}
                          </div>
                        )}

                        {allInstalledDevs.length === 0 ? (
                          <div className="text-center py-12 text-[#45464e] bg-[#f8f9ff] rounded-xl border border-dashed border-[#c6c6cf]">
                            <Laptop size={32} className="mx-auto text-gray-400 mb-2" />
                            <p className="text-xs font-semibold">Nenhuma instalação ativa detectada para este software.</p>
                            <p className="text-[10px] text-gray-500 mt-1">Isso pode significar que o software ainda não foi distribuído nos hosts locais ou servidores AWS.</p>
                          </div>
                        ) : filteredInstalledDevs.length === 0 ? (
                          <div className="text-center py-8 text-[#45464e] bg-[#f8f9ff] rounded-xl border border-dashed border-[#c6c6cf]">
                            <Search size={24} className="mx-auto text-gray-400 mb-2" />
                            <p className="text-xs font-semibold">Nenhum dispositivo corresponde à pesquisa "{deviceSearchQuery}".</p>
                            <p className="text-[10px] text-gray-500 mt-1">Tente pesquisar usando outros termos ou limpe o filtro.</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {filteredInstalledDevs.map((dev) => (
                              <div 
                                key={dev.id} 
                                className="bg-white border border-[#c6c6cf] hover:border-[#1e284c] rounded-xl p-4 transition-all hover:shadow-sm cursor-pointer hover:bg-[#f8f9ff]/60"
                                onClick={() => {
                                  setSelectedDetailLicense(null);
                                  onNavigateToDevice?.(dev.id);
                                }}
                                title="Clique para ir para a página de detalhes deste dispositivo"
                              >
                                <div className="flex justify-between items-start">
                                  <div className="flex items-start gap-3">
                                    <div className="p-2 bg-[#eff4ff] rounded-lg text-[#1e284c] border border-[#eff4ff]">
                                      <Laptop size={18} />
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <h5 className="font-bold text-sm text-[#1e284c]">{dev.hostname}</h5>
                                        <span className={`inline-block w-1.5 h-1.5 rounded-full ${dev.statusConexao === 'Online' ? 'bg-green-500' : 'bg-gray-400'}`} title={dev.statusConexao}></span>
                                        <span className="text-[10px] text-gray-500 font-mono">({dev.ip})</span>
                                      </div>
                                      <p className="text-xs text-gray-600 mt-0.5">
                                        Usuário: <strong className="text-[#0b1c30]">{dev.usuario}</strong> • {dev.departamento}
                                      </p>
                                      <p className="text-[10px] text-gray-500 mt-1">
                                        S.O: <span className="font-medium text-[#45464e]">{dev.so}</span> • MAC: <span className="font-mono">{dev.mac}</span>
                                      </p>
                                    </div>
                                  </div>

                                  <div className="text-right flex flex-col items-end gap-2">
                                    <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider ${
                                      dev.installedStatus === 'Em Uso'
                                        ? 'bg-green-50 text-green-700 border border-green-200'
                                        : dev.installedStatus === 'Ociosa'
                                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                          : 'bg-red-50 text-[#ba1a1a] border border-red-200'
                                    }`}>
                                      {dev.installedStatus}
                                    </span>
                                    <div className="text-[10px] text-right text-gray-500 space-y-0.5">
                                      <p>Versão: <strong className="text-[#1e284c]">{dev.installedVersion}</strong></p>
                                      <p>Último Acesso: <span className="font-mono font-bold text-gray-600">{dev.ultimoAcesso}</span></p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="px-6 py-4 border-t border-[#c6c6cf] bg-[#f8f9ff] flex justify-between items-center">
              <span className="text-[10px] text-[#45464e] font-semibold italic">ID Sistema: {selectedDetailLicense.id}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedDetailLicense(null)}
                  className="px-4 py-2 bg-[#1e284c] text-white hover:bg-[#343e63] rounded-lg text-xs font-bold cursor-pointer transition-all"
                >
                  Fechar Visualização
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
