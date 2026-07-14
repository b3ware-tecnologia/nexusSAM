import { useState, useEffect } from 'react';
import { 
  Laptop, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Info,
  Monitor,
  Cpu,
  Hash,
  Activity,
  DollarSign,
  TrendingUp,
  User,
  Clock,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  Eye,
  Settings,
  Trash2,
  Users,
  Calendar,
  FileDown,
  Printer,
  Download,
  Check
} from 'lucide-react';
import { CompanyData, License } from '../data-types';

interface DevicesViewProps {
  companyData: CompanyData;
  onNavigateToTab: (tab: any) => void;
  targetDeviceId?: string | null;
  onClearTargetDevice?: () => void;
  initialSearchQuery?: string;
  onClearInitialSearchQuery?: () => void;
}

interface DeviceSoftware {
  licenseId: string;
  softwareName: string;
  status: 'Em Uso' | 'Ociosa' | 'Não Conforme';
  custoMensal: number;
  versao: string;
  ultimoAcesso: string;
}

interface Device {
  id: string;
  hostname: string;
  ip: string;
  mac: string;
  usuario: string;
  departamento: string;
  tipo: 'Notebook' | 'Desktop' | 'Servidor';
  so: string;
  lastSeen: string;
  statusConexao: 'Online' | 'Offline';
  softwares: DeviceSoftware[];
}

export default function DevicesView({ 
  companyData, 
  onNavigateToTab,
  targetDeviceId,
  onClearTargetDevice,
  initialSearchQuery,
  onClearInitialSearchQuery
}: DevicesViewProps) {
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (initialSearchQuery) {
      setSearchQuery(initialSearchQuery);
      onClearInitialSearchQuery?.();
    }
  }, [initialSearchQuery]);
  const [selectedType, setSelectedType] = useState<'Todos' | 'Notebook' | 'Desktop' | 'Servidor'>('Todos');
  const [selectedCompliance, setSelectedCompliance] = useState<'Todos' | 'Conforme' | 'Com Desvio'>('Todos');
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  
  // Real-time interactive states for the second modal
  const [devicesList, setDevicesList] = useState<Device[]>([]);
  const [selectedSoftwareDetail, setSelectedSoftwareDetail] = useState<DeviceSoftware | null>(null);
  const [isUninstalling, setIsUninstalling] = useState(false);
  const [uninstallSuccess, setUninstallSuccess] = useState(false);
  const [uninstallLogs, setUninstallLogs] = useState<string[]>([]);

  // Report extraction states
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [isGeneratedReportViewOpen, setIsGeneratedReportViewOpen] = useState(false);
  const [reportFields, setReportFields] = useState({
    hostname: true, // mandatory / always checked
    users: true,
    softwares: true,
    lastSeen: true,
    uptime: true,
    usageHistory: true,
    softwareVersion: true,
    softwareStatus: true,
    licensingCosts: true
  });

  // Helper to format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2
    }).format(value);
  };

  // Generate dynamic devices list based on the current company licenses to ensure 100% data alignment!
  const getDevices = (): Device[] => {
    const licenses = companyData.licenses;
    const isAwsConnected = licenses.some(l => l.id.startsWith('lic-aws-'));

    const awsDevices = isAwsConnected ? [
      { id: 'dev-aws-1', hostname: 'AWS-EC2-WIN-01', ip: '172.31.10.4', mac: '02:00:FF:AA:BB:CC', usuario: 'Instância Cloud EC2', departamento: 'TI / Infra', tipo: 'Servidor' as const, so: 'Windows Server 2022 Datacenter', lastSeen: 'Sincronizado há 1 min', statusConexao: 'Online' as const },
      { id: 'dev-aws-2', hostname: 'AWS-RDS-SQL-02', ip: '172.31.25.18', mac: '02:00:FF:AA:BB:DD', usuario: 'Serviço RDS SQL Server', departamento: 'TI / Infra', tipo: 'Servidor' as const, so: 'AWS Managed Engine (SQL Server)', lastSeen: 'Sincronizado há 1 min', statusConexao: 'Online' as const },
      { id: 'dev-aws-3', hostname: 'AWS-RDS-ORCL-03', ip: '172.31.25.44', mac: '02:00:FF:AA:BB:EE', usuario: 'Serviço RDS Oracle DB', departamento: 'TI / Infra', tipo: 'Servidor' as const, so: 'AWS Managed Engine (Oracle Enterprise)', lastSeen: 'Sincronizado há 1 min', statusConexao: 'Online' as const }
    ] : [];
    
    // Base template of 10 discoverable devices in the company network
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
      { id: 'dev-10', hostname: 'SRV-QA-02', ip: '10.0.0.21', mac: 'D0:C1:B2:A3:94:85', usuario: 'Ambiente de Testes', departamento: 'TI / Infra', tipo: 'Servidor' as const, so: 'Windows Server 2012 R2 (End-of-Support)', lastSeen: 'Sincronizado há 8 min', statusConexao: 'Online' as const },
      { id: 'dev-legacy-srv', hostname: 'SRV-LEGACY-02', ip: '10.0.0.36', mac: 'E0:F1:D2:C3:B4:A6', usuario: 'Réplica Homologação', departamento: 'TI / Infra', tipo: 'Servidor' as const, so: 'Windows Server 2012 R2 (End-of-Support)', lastSeen: 'Sincronizado há 1 dia', statusConexao: 'Offline' as const }
    ];

    const mergedDevices = [...baseDevices, ...awsDevices];

    return mergedDevices.map((dev, idx) => {
      const devSoftwares: DeviceSoftware[] = [];
      
      // Distribute licenses realistically based on department and standard profiles
      licenses.forEach(lic => {
        const name = lic.softwareName;
        const licId = lic.id;
        
        // Let's calculate a reasonable unit cost (Total cost / estimated instances)
        const unitCost = lic.custoMensal / 30; // standard estimation of license unit share

        let shouldInstall = false;
        let softwareStatus: 'Em Uso' | 'Ociosa' | 'Não Conforme' = 'Em Uso';
        let softwareVersao = '2024.1';

        // 1. Core utilities / Security (installed on almost everything)
        if (lic.category === 'Segurança' || name.includes('ESET') || name.includes('CrowdStrike')) {
          // Don't install security endpoint agents on RDS cloud database instances, only on EC2 and local base devices
          if (dev.hostname !== 'AWS-RDS-SQL-02' && dev.hostname !== 'AWS-RDS-ORCL-03') {
            shouldInstall = true;
            softwareVersao = '10.4.2';
            if (lic.status === 'Não Conforme' && idx % 3 === 0) {
              softwareStatus = 'Não Conforme';
            }
          }
        } 
        // 2. Productivity / Microsoft 365 / Zoom (installed on corp/HR/finance/management)
        else if (lic.category === 'Produtividade' || name.includes('Microsoft') || name.includes('Zoom') || name.includes('Slack')) {
          if (dev.departamento !== 'TI / Infra' && !dev.hostname.startsWith('AWS-')) {
            shouldInstall = true;
            softwareVersao = name.includes('Microsoft') ? 'v16.0 Office 365' : 'v5.17';
            // If the license is ociosa globally, flag some as ociosa
            if (lic.status === 'Ociosa' && idx % 4 === 0) {
              softwareStatus = 'Ociosa';
            }
            if (lic.status === 'Não Conforme' && idx % 3 === 1) {
              softwareStatus = 'Não Conforme';
            }
          }
        }
        // 3. Design/Eng (Adobe, Figma, AutoCAD)
        else if (lic.category === 'Design/Eng' || name.includes('Adobe') || name.includes('Figma') || name.includes('AutoCAD')) {
          if (dev.departamento === 'Design' || dev.departamento === 'Marketing') {
            shouldInstall = true;
            softwareVersao = '2024.3';
            if (lic.status === 'Ociosa' && name.includes('Adobe') && dev.hostname === 'PC-MKT-055') {
              softwareStatus = 'Ociosa'; // Adobe ociosa on marketing computer! Matches our alert insight!
            }
          } else if (dev.departamento === 'Engenharia' && name.includes('AutoCAD')) {
            shouldInstall = true;
            softwareVersao = 'v24.2';
            if (lic.status === 'Não Conforme') {
              softwareStatus = 'Não Conforme'; // AutoCAD non compliant
            }
          } else if (name.includes('Figma') && (dev.departamento === 'Design' || dev.departamento === 'Marketing' || dev.hostname === 'PC-CORP-012')) {
            shouldInstall = true;
            softwareVersao = 'Cloud Native';
          }
        }
        // 4. AWS Licenses Mapping (Windows Server EC2, SQL Server RDS, Oracle RDS)
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
        // 5. Utilities / Other databases / tools (Project, Tableau)
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

          devSoftwares.push({
            licenseId: licId,
            softwareName: name,
            status: softwareStatus,
            custoMensal: Math.round(unitCost * 100) / 100,
            versao: softwareVersao,
            ultimoAcesso: softwareUltimoAcesso
          });
        }
      });

      // Also inject Adobe Acrobat 2017 specifically on Notebook/Desktop for realistic Snow Atlas mapping
      if (dev.tipo !== 'Servidor') {
        devSoftwares.push({
          licenseId: 'lic-adobe-acrobat-2017-' + dev.id,
          softwareName: 'Adobe Acrobat 2017 (End-of-Support)',
          status: 'Ociosa',
          custoMensal: 35.00,
          versao: '2017.011.30175',
          ultimoAcesso: '12/04/2026 09:30'
        });
      }

      return {
        ...dev,
        softwares: devSoftwares
      };
    });
  };

  // Set initial state and synchronize when companyData changes
  useEffect(() => {
    setDevicesList(getDevices());
  }, [companyData.id, companyData.licenses]);

  // Handle auto-selecting device when navigating from software modal
  useEffect(() => {
    if (targetDeviceId && devicesList.length > 0) {
      const foundDevice = devicesList.find(d => d.id === targetDeviceId);
      if (foundDevice) {
        setSelectedDevice(foundDevice);
        // Automatically open the detailed software metric submodal for idle/non-compliant licenses
        const targetSoftware = foundDevice.softwares.find(s => s.status === 'Ociosa' || s.status === 'Não Conforme') 
          || foundDevice.softwares[0];
        if (targetSoftware) {
          setSelectedSoftwareDetail(targetSoftware);
          setUninstallSuccess(false);
          setUninstallLogs([]);
        }
      }
      onClearTargetDevice?.();
    }
  }, [targetDeviceId, devicesList, onClearTargetDevice]);

  const allDevices = devicesList;

  // Filter logic
  const filteredDevices = allDevices.filter(dev => {
    // Search filter
    const matchesSearch = 
      dev.hostname.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dev.usuario.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dev.departamento.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dev.so.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dev.softwares.some(s => s.softwareName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      dev.ip.includes(searchQuery);

    // Type filter
    const matchesType = selectedType === 'Todos' || dev.tipo === selectedType;

    // Compliance filter
    const hasNonCompliant = dev.softwares.some(s => s.status === 'Não Conforme');
    const matchesCompliance = 
      selectedCompliance === 'Todos' ||
      (selectedCompliance === 'Conforme' && !hasNonCompliant) ||
      (selectedCompliance === 'Com Desvio' && hasNonCompliant);

    return matchesSearch && matchesType && matchesCompliance;
  });

  // Calculate high-level summary stats for the tab
  const totalDevsCount = allDevices.length;
  const nonCompliantDevsCount = allDevices.filter(d => d.softwares.some(s => s.status === 'Não Conforme')).length;
  const compliantDevsCount = totalDevsCount - nonCompliantDevsCount;
  
  // Average device software utilization efficiency
  const totalEfficiencySum = allDevices.reduce((sum, d) => {
    if (d.softwares.length === 0) return sum + 100;
    const active = d.softwares.filter(s => s.status === 'Em Uso').length;
    return sum + (active / d.softwares.length) * 100;
  }, 0);
  const avgEfficiency = Math.round(totalEfficiencySum / totalDevsCount);

  const handleRemoveSoftware = (licenseId: string) => {
    if (!selectedDevice || !selectedSoftwareDetail) return;
    
    setIsUninstalling(true);
    setUninstallLogs([
      "🔄 Iniciando processo de desinstalação remota...",
      "📡 SAM Agent enviando comando de auditoria para o endpoint...",
      "🧹 Removendo arquivos de licença e chaves de registro...",
      "🗑️ Executando script de desinstalação local..."
    ]);

    // Simulate logs with timed delays
    setTimeout(() => {
      setUninstallLogs(prev => [...prev, "⚡ Interrompendo instâncias em execução do processo..."]);
    }, 800);

    setTimeout(() => {
      setUninstallLogs(prev => [
        ...prev, 
        "✅ Software removido com sucesso via SAM Agent!",
        "📡 Atualizando inventário de licenças ativas do dispositivo..."
      ]);
      setIsUninstalling(false);
      setUninstallSuccess(true);
      
      // Update state
      setDevicesList(prevList => {
        const updatedList = prevList.map(dev => {
          if (dev.id === selectedDevice.id) {
            const updatedSoftwares = dev.softwares.filter(s => s.licenseId !== licenseId);
            return {
              ...dev,
              softwares: updatedSoftwares
            };
          }
          return dev;
        });

        // Also update selectedDevice with the new softwares list so details modal reflects it immediately
        const foundDevice = updatedList.find(dev => dev.id === selectedDevice.id);
        if (foundDevice) {
          setSelectedDevice(foundDevice);
        }
        
        return updatedList;
      });
    }, 2000);
  };

  const downloadTextReport = () => {
    if (!selectedDevice) return;
    let content = `====================================================\n`;
    content += `     RELATÓRIO DE ENDPOINT - SAM DISCOVERY SYSTEM   \n`;
    content += `====================================================\n\n`;
    content += `Gerado em: ${new Date().toLocaleString('pt-BR')}\n`;
    content += `Dispositivo: ${selectedDevice.hostname}\n`;
    content += `IP: ${selectedDevice.ip} | MAC: ${selectedDevice.mac}\n`;
    content += `----------------------------------------------------\n\n`;
    
    if (reportFields.users) {
      content += `[USUÁRIOS E CONEXÃO]\n`;
      content += `- Usuário Principal: ${selectedDevice.usuario} (${selectedDevice.statusConexao})\n`;
      content += `- Departamento: ${selectedDevice.departamento}\n`;
      content += `- Sistema Operacional: ${selectedDevice.so}\n\n`;
    }
    
    if (reportFields.lastSeen) {
      content += `[ÚLTIMO ACESSO]\n`;
      content += `- Última sincronização ativa: ${selectedDevice.lastSeen}\n\n`;
    }

    if (reportFields.uptime) {
      content += `[TEMPO DE ATIVIDADE]\n`;
      content += `- Tempo logado hoje: 5h 32m (Status: ${selectedDevice.statusConexao})\n\n`;
    }

    if (reportFields.softwares) {
      content += `[INVENTÁRIO DE SOFTWARES INSTALADOS]\n`;
      selectedDevice.softwares.forEach((sw, idx) => {
        content += `${idx + 1}. ${sw.softwareName}\n`;
        if (reportFields.softwareVersion) {
          content += `   - Versão: ${sw.versao}\n`;
        }
        if (reportFields.softwareStatus) {
          content += `   - Status de uso: ${sw.status}\n`;
        }
        content += `   - Último acesso: ${sw.ultimoAcesso}\n`;
        if (reportFields.usageHistory) {
          content += `   - Horas de uso: `;
          if (sw.status === 'Em Uso') {
            content += `5.4h diário / 118h mensal / 1.416h anual\n`;
          } else if (sw.status === 'Ociosa') {
            content += `0.0h diário / 0.4h mensal / 4.8h anual\n`;
          } else {
            content += `2.5h diário / 52h mensal / 624h anual\n`;
          }
        }
        if (reportFields.licensingCosts) {
          content += `   - Custo mensal: ${formatCurrency(sw.custoMensal)}\n`;
          content += `   - Custo anual estimado: ${formatCurrency(sw.custoMensal * 12)}\n`;
        }
        content += `\n`;
      });
    }

    if (reportFields.licensingCosts) {
      const totalMonthly = selectedDevice.softwares.reduce((sum, s) => sum + s.custoMensal, 0);
      content += `----------------------------------------------------\n`;
      content += `[RESUMO FINANCEIRO DE LICENCIAMENTO]\n`;
      content += `- Custo Mensal Total: ${formatCurrency(totalMonthly)}\n`;
      content += `- Custo Anual Total Estimado: ${formatCurrency(totalMonthly * 12)}\n`;
      content += `----------------------------------------------------\n`;
    }

    content += `\nFim do Relatório Corporativo. ID Sinc SAM: ${selectedDevice.id}\n`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Relatorio_SAM_${selectedDevice.hostname}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-fade-in text-[#0b1c30]">
      
      {/* Header and Discovered Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="font-headline text-xl font-black text-slate-900">Inventário de Dispositivos</h2>
          <p className="text-xs text-slate-500">
            Lista de endpoints descobertos ativamente na rede corporativa e sua relação de softwares instalados.
          </p>
        </div>
        <span className="text-[10px] font-mono font-bold bg-slate-50 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-sm flex items-center gap-1.5">
          <Activity size={14} className="text-[#00B551] animate-pulse" />
          SAM Discovery: 10 dispositivos na rede
        </span>
      </div>

      {/* Tab KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white p-4 rounded-sm border border-slate-200 shadow-sm">
          <span className="block font-mono text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-1">Endpoints Monitorados</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{totalDevsCount}</span>
            <span className="text-xs text-slate-500">na rede</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-sm mt-2">
            <div className="bg-slate-700 h-full rounded-sm" style={{ width: '100%' }}></div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-sm border border-slate-200 shadow-sm">
          <span className="block font-mono text-[9px] text-emerald-700 font-bold uppercase tracking-wider mb-1">Dispositivos Conformes</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-700">{compliantDevsCount}</span>
            <span className="text-xs text-slate-500">({Math.round((compliantDevsCount / totalDevsCount) * 100)}%)</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-sm mt-2">
            <div className="bg-[#00B551] h-full rounded-sm" style={{ width: `${(compliantDevsCount / totalDevsCount) * 100}%` }}></div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-sm border border-slate-200 shadow-sm">
          <span className="block font-mono text-[9px] text-red-600 font-bold uppercase tracking-wider mb-1">Dispositivos com Desvios</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-red-600">{nonCompliantDevsCount}</span>
            <span className="text-xs text-slate-500">({Math.round((nonCompliantDevsCount / totalDevsCount) * 100)}%)</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-sm mt-2">
            <div className="bg-red-500 h-full rounded-sm" style={{ width: `${(nonCompliantDevsCount / totalDevsCount) * 100}%` }}></div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-sm border border-slate-200 shadow-sm">
          <span className="block font-mono text-[9px] text-indigo-600 font-bold uppercase tracking-wider mb-1">Eficiência Média de Uso</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-indigo-600">{avgEfficiency}%</span>
            <span className="text-xs text-slate-500">software ativo</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-sm mt-2">
            <div className="bg-indigo-600 h-full rounded-sm" style={{ width: `${avgEfficiency}%` }}></div>
          </div>
        </div>

      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-sm border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row gap-3">
          
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#45464e]" size={16} />
            <input 
              type="text" 
              placeholder="Buscar por hostname, usuário, departamento ou IP..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#f8f9ff] border border-[#c6c6cf] rounded-lg text-xs font-sans text-[#0b1c30] placeholder-[#45464e] focus:outline-none focus:border-[#1e284c] focus:bg-white transition-all"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2.5">
            
            {/* Type */}
            <div className="flex items-center gap-1.5 bg-[#f8f9ff] border border-[#c6c6cf] rounded-lg px-2 py-1">
              <span className="font-mono text-[9px] uppercase font-bold text-[#45464e] px-1">Tipo:</span>
              <select 
                value={selectedType} 
                onChange={(e) => setSelectedType(e.target.value as any)}
                className="bg-transparent border-none text-xs font-bold text-[#1e284c] focus:outline-none cursor-pointer p-1"
              >
                <option value="Todos">Todos</option>
                <option value="Notebook">Notebook</option>
                <option value="Desktop">Desktop</option>
                <option value="Servidor">Servidor</option>
              </select>
            </div>

            {/* Compliance */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-sm px-2 py-1">
              <span className="font-mono text-[9px] uppercase font-bold text-slate-500 px-1">Conformidade:</span>
              <select 
                value={selectedCompliance} 
                onChange={(e) => setSelectedCompliance(e.target.value as any)}
                className="bg-transparent border-none text-xs font-bold text-slate-800 focus:outline-none cursor-pointer p-1"
              >
                <option value="Todos">Todos</option>
                <option value="Conforme">Conforme</option>
                <option value="Com Desvio">Com Desvio</option>
              </select>
            </div>

            {/* Reset */}
            {(searchQuery || selectedType !== 'Todos' || selectedCompliance !== 'Todos') && (
              <button 
                onClick={() => {
                  setSearchQuery('');
                  setSelectedType('Todos');
                  setSelectedCompliance('Todos');
                }}
                className="px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 rounded-sm transition-colors cursor-pointer flex items-center gap-1 border border-red-200"
              >
                <X size={14} />
                Limpar
              </button>
            )}

          </div>

        </div>
      </div>

      {/* Main Table View */}
      <div className="bg-white rounded-sm border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse zebra-table">
            <thead className="bg-slate-100 text-[9px] font-mono uppercase text-slate-600 border-b border-slate-200 sticky top-0">
              <tr>
                <th className="px-5 py-4 font-bold">Dispositivo</th>
                <th className="px-5 py-4 font-bold">Usuário / Depto</th>
                <th className="px-5 py-4 font-bold text-center">Softwares Inst.</th>
                <th className="px-5 py-4 font-bold text-center">Uso / Ociosos</th>
                <th className="px-5 py-4 font-bold">Eficiência</th>
                <th className="px-5 py-4 font-bold text-right">Custo Mensal</th>
                <th className="px-5 py-4 font-bold text-center">Conformidade</th>
              </tr>
            </thead>
            <tbody className="text-xs text-slate-800 divide-y divide-slate-100">
              {filteredDevices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500 italic">
                    Nenhum dispositivo encontrado com os filtros atuais.
                  </td>
                </tr>
              ) : (
                filteredDevices.map(dev => {
                  const totalSoftwares = dev.softwares.length;
                  const ativos = dev.softwares.filter(s => s.status === 'Em Uso').length;
                  const ociosos = dev.softwares.filter(s => s.status === 'Ociosa').length;
                  const desvios = dev.softwares.filter(s => s.status === 'Não Conforme').length;

                  const efficiencyRate = totalSoftwares > 0 ? Math.round((ativos / totalSoftwares) * 100) : 100;
                  const totalCost = dev.softwares.reduce((sum, s) => sum + s.custoMensal, 0);
                  const hasDesvio = desvios > 0;

                  return (
                    <tr 
                      key={dev.id} 
                      className="hover:bg-slate-50 transition-colors cursor-pointer border-l-[3px] border-l-transparent hover:border-l-[#00B551]"
                      onClick={() => setSelectedDevice(dev)}
                      title="Clique para ver dossiê completo do endpoint"
                    >
                      {/* Dispositivo (Hostname, IP, Tipo) */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${hasDesvio ? 'bg-red-50 text-red-600' : 'bg-[#eff4ff] text-[#1e284c]'}`}>
                            <Laptop size={16} />
                          </div>
                          <div>
                            <span className="font-mono font-bold text-sm text-[#1e284c] block">{dev.hostname}</span>
                            <span className="text-[10px] text-[#45464e] font-mono">{dev.ip} • {dev.tipo}</span>
                          </div>
                        </div>
                      </td>

                      {/* Usuário / Depto */}
                      <td className="px-6 py-4">
                        <div>
                          <span className="font-semibold text-[#0b1c30] block">{dev.usuario}</span>
                          <span className="text-[10px] text-[#45464e] font-medium">{dev.departamento}</span>
                        </div>
                      </td>

                      {/* Softwares Instalados */}
                      <td className="px-6 py-4 text-center">
                        <span className="inline-block px-2.5 py-1 bg-[#eff4ff] border border-[#c6c6cf]/30 rounded-full font-mono font-bold text-[#1e284c]">
                          {totalSoftwares}
                        </span>
                      </td>

                      {/* Uso / Ociosos (Comparison badging) */}
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center items-center gap-1.5">
                          <span className="text-green-600 font-bold font-mono" title={`${ativos} em uso ativo`}>{ativos}U</span>
                          <span className="text-[#c6c6cf]">/</span>
                          <span className={`font-bold font-mono ${ociosos > 0 ? 'text-amber-600' : 'text-[#45464e]'}`} title={`${ociosos} ociosos`}>{ociosos}O</span>
                          {desvios > 0 && (
                            <>
                              <span className="text-[#c6c6cf]">/</span>
                              <span className="text-[#ba1a1a] font-bold font-mono" title={`${desvios} não conformes`}>{desvios}D</span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Eficiência Progress Bar */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 w-28">
                          <div className="flex-1 bg-[#f8f9ff] h-2 rounded-full border border-[#c6c6cf] overflow-hidden p-0.5">
                            <div 
                              className={`h-full rounded-full ${
                                hasDesvio 
                                  ? 'bg-[#ba1a1a]' 
                                  : efficiencyRate >= 80 
                                    ? 'bg-green-600' 
                                    : efficiencyRate >= 50 
                                      ? 'bg-amber-500' 
                                      : 'bg-red-500'
                              }`}
                              style={{ width: `${efficiencyRate}%` }}
                            ></div>
                          </div>
                          <span className="font-mono text-[10px] font-bold text-[#1e284c]">{efficiencyRate}%</span>
                        </div>
                      </td>

                      {/* Custo Mensal */}
                      <td className="px-6 py-4 text-right font-mono font-bold text-[#0b1c30]">
                        {formatCurrency(totalCost)}
                      </td>

                      {/* Conformidade badge */}
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-extrabold ${
                          hasDesvio 
                            ? 'bg-red-50 text-[#ba1a1a] border border-red-200 animate-pulse' 
                            : 'bg-green-50 text-green-700 border border-green-200'
                        }`}>
                          {hasDesvio ? 'Com Desvio' : 'Conforme'}
                        </span>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAILS DOSSIER MODAL */}
      {selectedDevice && (
        <div 
          className="fixed inset-0 bg-[#0b1c30]/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity"
          onClick={() => setSelectedDevice(null)}
        >
          <div 
            className="bg-white rounded-2xl border border-[#c6c6cf] shadow-2xl w-full max-w-4xl overflow-hidden animate-scale-in text-[#0b1c30]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-[#c6c6cf] bg-[#f8f9ff] flex justify-between items-center">
              <div>
                <span className="font-mono text-[9px] uppercase font-bold text-[#45464e] tracking-wider px-2 py-0.5 bg-[#eff4ff] rounded">
                  Dossiê Técnico do Endpoint
                </span>
                <h3 className="font-headline text-lg font-black text-[#1e284c] mt-1 flex items-center gap-2">
                  <Laptop size={20} className="text-[#1e284c]" />
                  {selectedDevice.hostname}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedDevice(null)}
                className="p-1.5 hover:bg-[#eff4ff] rounded-full transition-colors cursor-pointer text-[#45464e]"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto custom-scrollbar">
              
              {/* Device Tech Specs Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-[#f8f9ff] p-4 rounded-xl border border-[#c6c6cf]/60">
                <div>
                  <span className="block text-[9px] font-mono font-bold uppercase text-[#45464e] tracking-wider">Usuário Principal</span>
                  <span className="text-xs font-black text-[#1e284c] flex items-center gap-1 mt-0.5">
                    <User size={12} className="text-[#45464e]" />
                    {selectedDevice.usuario}
                  </span>
                </div>
                <div>
                  <span className="block text-[9px] font-mono font-bold uppercase text-[#45464e] tracking-wider">Departamento</span>
                  <span className="text-xs font-black text-[#1e284c] block mt-0.5">{selectedDevice.departamento}</span>
                </div>
                <div>
                  <span className="block text-[9px] font-mono font-bold uppercase text-[#45464e] tracking-wider">S.O. Instalado</span>
                  <span className="text-xs font-bold text-[#45464e] block mt-0.5">{selectedDevice.so}</span>
                </div>
                <div>
                  <span className="block text-[9px] font-mono font-bold uppercase text-[#45464e] tracking-wider">Última Varredura</span>
                  <span className="text-xs font-mono font-semibold text-[#1e284c] block mt-0.5 flex items-center gap-1">
                    <Clock size={11} className="text-green-600" />
                    {selectedDevice.lastSeen.replace('Sincronizado ', '')}
                  </span>
                </div>
              </div>

              {/* Hardware specifications details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                
                <div className="bg-white p-3.5 rounded-xl border border-[#c6c6cf] space-y-2">
                  <span className="font-bold text-[#1e284c] uppercase text-[10px] tracking-wider flex items-center gap-1 border-b border-[#eff4ff] pb-1.5">
                    <Cpu size={14} /> Informações de Rede e Hardware
                  </span>
                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-[#45464e]">Endereço IP:</span>
                      <span className="font-mono font-semibold">{selectedDevice.ip}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#45464e]">Endereço MAC:</span>
                      <span className="font-mono font-semibold">{selectedDevice.mac}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#45464e]">Tipo de Endpoint:</span>
                      <span className="font-bold uppercase text-[#1e284c]">{selectedDevice.tipo}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-[#c6c6cf] space-y-2">
                  <span className="font-bold text-[#1e284c] uppercase text-[10px] tracking-wider flex items-center gap-1 border-b border-[#eff4ff] pb-1.5">
                    <Hash size={14} /> Atribuição SAM e Custos
                  </span>
                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-[#45464e]">Softwares Mapeados:</span>
                      <span className="font-bold text-[#1e284c]">{selectedDevice.softwares.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#45464e]">Custo de Software Licenciado:</span>
                      <span className="font-mono font-black text-green-700">
                        {formatCurrency(selectedDevice.softwares.reduce((sum, s) => sum + s.custoMensal, 0))}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#45464e]">Status de Conexão:</span>
                      <span className={`font-bold flex items-center gap-1 ${selectedDevice.statusConexao === 'Online' ? 'text-green-600' : 'text-[#45464e]'}`}>
                        <span className={`w-2 h-2 rounded-full ${selectedDevice.statusConexao === 'Online' ? 'bg-green-600 animate-pulse' : 'bg-[#c6c6cf]'}`}></span>
                        {selectedDevice.statusConexao}
                      </span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Table of Software details on the device */}
              <div className="bg-white rounded-xl border border-[#c6c6cf] overflow-hidden">
                <div className="bg-[#eff4ff] px-4 py-3 border-b border-[#c6c6cf] flex items-center justify-between">
                  <h4 className="text-[10px] font-mono font-bold uppercase text-[#45464e] tracking-widest flex items-center gap-1.5">
                    <Settings size={14} /> Softwares Instalados Detectados
                  </h4>
                  <span className="text-[9px] font-mono font-bold uppercase px-2.5 py-1 bg-indigo-600 text-white rounded font-sans flex items-center gap-1 animate-pulse">
                    <Eye size={11} /> Clique em uma linha para ver detalhes
                  </span>
                </div>

                <div className="max-h-48 overflow-y-auto custom-scrollbar">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#f8f9ff] text-[9px] font-mono uppercase text-[#45464e] border-b border-[#c6c6cf]/60">
                      <tr>
                        <th className="px-4 py-2 font-bold">Software</th>
                        <th className="px-4 py-2 font-bold">Versão</th>
                        <th className="px-4 py-2 font-bold text-center">Status no Device</th>
                        <th className="px-4 py-2 font-bold text-right">Custo Estimado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#eff4ff]">
                      {selectedDevice.softwares.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-6 text-center text-[#45464e] italic">
                            Nenhum software instalado neste dispositivo.
                          </td>
                        </tr>
                      ) : (
                        selectedDevice.softwares.flatMap((sw, sidx) => {
                          const isOcioso = sw.status === 'Ociosa';
                          const isNaoConforme = sw.status === 'Não Conforme';
                          
                          const mainRow = (
                            <tr 
                              key={`main-${sidx}`} 
                              className="hover:bg-[#eff4ff]/60 transition-colors cursor-pointer group"
                              onClick={() => {
                                setUninstallSuccess(false);
                                setUninstallLogs([]);
                                setSelectedSoftwareDetail(sw);
                              }}
                              title="Clique para ver detalhes do software, horas de uso e remoção"
                            >
                              <td className="px-4 py-2.5 font-bold text-[#1e284c] group-hover:text-indigo-600 flex items-center gap-1.5 transition-colors">
                                {sw.softwareName}
                                <Eye size={12} className="opacity-0 group-hover:opacity-100 text-indigo-500 transition-opacity" />
                              </td>
                              <td className="px-4 py-2.5 font-mono text-gray-500">{sw.versao}</td>
                              <td className="px-4 py-2.5 text-center">
                                <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-extrabold ${
                                  sw.status === 'Em Uso' 
                                    ? 'bg-green-50 text-green-700 border border-green-200' 
                                    : sw.status === 'Ociosa'
                                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                      : 'bg-red-50 text-[#ba1a1a] border border-red-200 animate-pulse'
                                }`}>
                                  {sw.status}
                                </span>
                              </td>
                              <td className="px-4 py-2.5 text-right font-mono text-[#0b1c30]">
                                {formatCurrency(sw.custoMensal)}
                              </td>
                            </tr>
                          );

                          if (isOcioso || isNaoConforme) {
                            const recRow = (
                              <tr key={`rec-${sidx}`} className="bg-slate-50/30">
                                <td colSpan={4} className="px-4 pb-2.5 pt-0">
                                  <div className={`p-2 rounded-lg text-[10px] leading-relaxed border flex items-start gap-2 ${
                                    isNaoConforme 
                                      ? 'bg-red-50/50 border-red-100/80 text-red-800' 
                                      : 'bg-amber-50/50 border-amber-100/80 text-amber-800'
                                  }`}>
                                    <ShieldAlert size={12} className="shrink-0 mt-0.5" />
                                    <div>
                                      {isNaoConforme && (
                                        <span>
                                          <strong>Desvio de Governança:</strong> Instalação não autorizada/não conforme neste endpoint. Regularize na aba <strong onClick={() => onNavigateToTab('conformidade')} className="underline cursor-pointer hover:text-red-700 transition-colors">Conformidade Legal</strong> ou remova este software.
                                        </span>
                                      )}
                                      {isOcioso && (
                                        <span>
                                          <strong>Recomendação de Otimização:</strong> Software detectado como ocioso. Efetue a revogação na aba <strong onClick={() => onNavigateToTab('otimizacao')} className="underline cursor-pointer hover:text-amber-700 transition-colors">Otimização Financeira</strong> para liberar essa licença e economizar <span className="font-mono font-bold text-amber-700">{formatCurrency(sw.custoMensal)}/mês</span>.
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            );
                            return [mainRow, recRow];
                          }

                          return [mainRow];
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            {/* Footer Actions */}
            <div className="px-6 py-4 border-t border-[#c6c6cf] bg-[#f8f9ff] flex justify-between items-center text-xs">
              <span className="text-[10px] text-[#45464e] font-semibold italic">Dispositivo ID: {selectedDevice.id}</span>
              <div className="flex gap-2">
                {selectedDevice.softwares.some(s => s.status === 'Ociosa') && (
                  <button
                    onClick={() => {
                      setSelectedDevice(null);
                      onNavigateToTab('otimizacao');
                    }}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold cursor-pointer transition-all flex items-center gap-1.5 border border-amber-500"
                  >
                    Otimizar Licenças
                    <ArrowRight size={13} />
                  </button>
                )}
                <button
                  onClick={() => setIsReportModalOpen(true)}
                  className="px-4 py-2 bg-white hover:bg-[#eff4ff] text-[#1e284c] border border-[#c6c6cf] rounded-lg font-bold cursor-pointer transition-all flex items-center gap-1.5"
                >
                  <FileDown size={14} />
                  Extrair Relatório
                </button>
                <button
                  onClick={() => setSelectedDevice(null)}
                  className="px-4 py-2 bg-[#1e284c] text-white hover:bg-[#343e63] rounded-lg font-bold cursor-pointer transition-all"
                >
                  Fechar Dossier
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* DETAILED SOFTWARE INFO SUB-MODAL */}
      {selectedSoftwareDetail && selectedDevice && (
        <div 
          className="fixed inset-0 bg-[#0b1c30]/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity"
          onClick={() => {
            if (!isUninstalling) {
              setSelectedSoftwareDetail(null);
              setUninstallSuccess(false);
              setUninstallLogs([]);
            }
          }}
        >
          <div 
            className="bg-white rounded-2xl border border-[#c6c6cf] shadow-2xl w-full max-w-xl overflow-hidden animate-scale-in text-[#0b1c30]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-[#c6c6cf] bg-[#f8f9ff] flex justify-between items-center">
              <div>
                <span className="font-mono text-[9px] uppercase font-bold text-indigo-600 tracking-wider px-2 py-0.5 bg-indigo-50 rounded">
                  Dossiê Analítico do Software no Endpoint
                </span>
                <h3 className="font-headline text-lg font-black text-[#1e284c] mt-1 flex items-center gap-2">
                  <Settings size={20} className="text-indigo-600" />
                  {selectedSoftwareDetail.softwareName}
                </h3>
              </div>
              <button 
                onClick={() => {
                  if (!isUninstalling) {
                    setSelectedSoftwareDetail(null);
                    setUninstallSuccess(false);
                    setUninstallLogs([]);
                  }
                }}
                disabled={isUninstalling}
                className="p-1.5 hover:bg-[#eff4ff] rounded-full transition-colors cursor-pointer text-[#45464e] disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto custom-scrollbar">
              
              {/* Basic status banner */}
              <div className="flex items-center justify-between p-3.5 rounded-xl border bg-slate-50 border-[#c6c6cf]/60">
                <div>
                  <span className="block text-[9px] font-mono text-[#45464e] uppercase font-bold">Versão</span>
                  <span className="text-xs font-black font-mono text-[#1e284c] block mt-0.5">{selectedSoftwareDetail.versao}</span>
                </div>
                <div>
                  <span className="block text-[9px] font-mono text-[#45464e] uppercase font-bold text-center">Status de Uso</span>
                  <span className={`inline-block px-2.5 py-0.5 rounded text-[9px] font-extrabold mt-0.5 ${
                    selectedSoftwareDetail.status === 'Em Uso' 
                      ? 'bg-green-100 text-green-800 border border-green-300' 
                      : selectedSoftwareDetail.status === 'Ociosa'
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : 'bg-red-100 text-red-800 border border-red-300 animate-pulse'
                  }`}>
                    {selectedSoftwareDetail.status}
                  </span>
                </div>
                <div className="text-right">
                  <span className="block text-[9px] font-mono text-[#45464e] uppercase font-bold">Custo da Licença</span>
                  <span className="text-xs font-black text-green-700 font-mono block mt-0.5">{formatCurrency(selectedSoftwareDetail.custoMensal)}/mês</span>
                </div>
              </div>

              {/* Detailed Metrics: Last access and Usage Hours */}
              <div className="bg-white p-4 rounded-xl border border-[#c6c6cf] space-y-4">
                <h4 className="font-bold text-xs uppercase tracking-wider text-[#1e284c] border-b border-slate-100 pb-2 flex items-center gap-1.5">
                  <Activity size={15} className="text-indigo-600" />
                  Métricas de Utilização SAM
                </h4>
                
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="bg-[#f8f9ff] p-3 rounded-lg border border-[#c6c6cf]/40">
                    <span className="block font-semibold text-[9px] text-[#45464e] uppercase">Último Acesso</span>
                    <span className="block font-black text-[#1e284c] text-xs mt-1 flex items-center gap-1">
                      <Calendar size={13} className="text-indigo-500" />
                      {selectedSoftwareDetail.status === 'Em Uso' 
                        ? `${selectedSoftwareDetail.ultimoAcesso.split(' ')[0]} às ${selectedSoftwareDetail.ultimoAcesso.split(' ')[1]} (Ativo)` 
                        : selectedSoftwareDetail.status === 'Ociosa' 
                          ? `Há 45 dias (${selectedSoftwareDetail.ultimoAcesso.split(' ')[0]})` 
                          : `${selectedSoftwareDetail.ultimoAcesso.split(' ')[0]} às ${selectedSoftwareDetail.ultimoAcesso.split(' ')[1]}`}
                    </span>
                  </div>

                  <div className="bg-[#f8f9ff] p-3 rounded-lg border border-[#c6c6cf]/40">
                    <span className="block font-semibold text-[9px] text-[#45464e] uppercase">Tempo de Atividade</span>
                    <span className="block font-black text-[#1e284c] text-xs mt-1 flex items-center gap-1">
                      <Clock size={13} className="text-indigo-500" />
                      {selectedSoftwareDetail.status === 'Em Uso' 
                        ? '4h 12m (Hoje)' 
                        : selectedSoftwareDetail.status === 'Ociosa' 
                          ? '0 min (Hoje)' 
                          : '1h 30m (Hoje)'}
                    </span>
                  </div>
                </div>

                {/* Daily, Monthly, and Annual usage hours */}
                <div className="space-y-2 text-xs">
                  <span className="block font-semibold text-[9px] text-[#45464e] uppercase">Histórico de Uso por Período</span>
                  <div className="grid grid-cols-3 gap-3">
                    
                    <div className="bg-slate-50 p-2.5 rounded border border-slate-200 text-center">
                      <span className="block text-[8px] text-[#45464e] uppercase font-bold">Diário (Média)</span>
                      <span className="block font-black font-mono text-xs text-indigo-600 mt-0.5">
                        {selectedSoftwareDetail.status === 'Em Uso' 
                          ? '5,4 horas' 
                          : selectedSoftwareDetail.status === 'Ociosa' 
                            ? '0,0 horas' 
                            : '2,5 horas'}
                      </span>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded border border-slate-200 text-center">
                      <span className="block text-[8px] text-[#45464e] uppercase font-bold">Mensal (Acumulado)</span>
                      <span className="block font-black font-mono text-xs text-indigo-600 mt-0.5">
                        {selectedSoftwareDetail.status === 'Em Uso' 
                          ? '118 horas' 
                          : selectedSoftwareDetail.status === 'Ociosa' 
                            ? '0,4 horas' 
                            : '52 horas'}
                      </span>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded border border-slate-200 text-center">
                      <span className="block text-[8px] text-[#45464e] uppercase font-bold">Anual (Estimado)</span>
                      <span className="block font-black font-mono text-xs text-indigo-600 mt-0.5">
                        {selectedSoftwareDetail.status === 'Em Uso' 
                          ? '1.416 horas' 
                          : selectedSoftwareDetail.status === 'Ociosa' 
                            ? '4,8 horas' 
                            : '624 horas'}
                      </span>
                    </div>

                  </div>
                </div>

              </div>

              {/* Recomendação de Governança Específica do Software */}
              {(selectedSoftwareDetail.status === 'Ociosa' || selectedSoftwareDetail.status === 'Não Conforme') && (
                <div className={`p-4 rounded-xl border text-xs space-y-2 ${
                  selectedSoftwareDetail.status === 'Não Conforme' 
                    ? 'bg-red-50 border-red-200' 
                    : 'bg-amber-50 border-amber-200'
                }`}>
                  <h4 className={`font-bold uppercase tracking-wide flex items-center gap-1.5 ${
                    selectedSoftwareDetail.status === 'Não Conforme' ? 'text-red-800' : 'text-amber-800'
                  }`}>
                    <ShieldAlert size={14} /> Recomendação de Governança
                  </h4>
                  <p className={`leading-relaxed ${
                    selectedSoftwareDetail.status === 'Não Conforme' ? 'text-red-900' : 'text-amber-900'
                  }`}>
                    {selectedSoftwareDetail.status === 'Não Conforme' ? (
                      <>
                        O software <strong>{selectedSoftwareDetail.softwareName}</strong> está classificado com status de desvio / não conforme neste endpoint. Adquira licenças adicionais na aba <strong onClick={() => onNavigateToTab('conformidade')} className="underline cursor-pointer hover:text-red-700 transition-colors">Conformidade Legal</strong> ou remova a instalação não autorizada imediatamente.
                      </>
                    ) : (
                      <>
                        O software <strong>{selectedSoftwareDetail.softwareName}</strong> foi detectado como ocioso no endpoint de {selectedDevice.usuario} (sem atividade significativa nos últimos 90 dias). Recomendamos efetuar a revogação para liberar essa licença na aba <strong onClick={() => onNavigateToTab('otimizacao')} className="underline cursor-pointer hover:text-amber-700 transition-colors">Otimização Financeira</strong>, economizando <span className="font-mono font-bold">{formatCurrency(selectedSoftwareDetail.custoMensal)}/mês</span>.
                      </>
                    )}
                  </p>
                </div>
              )}

              {/* Logged-In Users on the Device */}
              <div className="bg-white p-4 rounded-xl border border-[#c6c6cf] space-y-3">
                <h4 className="font-bold text-xs uppercase tracking-wider text-[#1e284c] border-b border-slate-100 pb-2 flex items-center gap-1.5">
                  <Users size={15} className="text-indigo-600" />
                  Usuário(s) Logado(s) no Dispositivo
                </h4>
                
                <div className="space-y-2 text-xs">
                  {/* Primary User Row */}
                  <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded border border-slate-200/60">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${selectedDevice.statusConexao === 'Online' ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                      <div>
                        <span className="font-bold text-[#1e284c] block">{selectedDevice.usuario}</span>
                        <span className="text-[9px] text-[#45464e] font-mono font-bold">USUÁRIO PRINCIPAL</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[#45464e] text-[9px] block">Tempo Logado</span>
                      <span className="font-bold font-mono text-[#1e284c] text-xs">
                        {selectedDevice.statusConexao === 'Online' ? '5h 32m (Ativo)' : 'Inativo / Offline'}
                      </span>
                    </div>
                  </div>

                  {/* Secondary/System User Row */}
                  <div className="flex justify-between items-center bg-slate-50/50 p-2.5 rounded border border-slate-200/40">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${selectedDevice.statusConexao === 'Online' ? 'bg-green-400' : 'bg-gray-400'}`}></div>
                      <div>
                        <span className="font-bold text-slate-600 block">operador.suporte</span>
                        <span className="text-[9px] text-[#45464e] font-mono font-bold">ADMIN / SERVIÇO DE DISCOVERY</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[#45464e] text-[9px] block">Tempo Logado</span>
                      <span className="font-bold font-mono text-slate-500 text-xs">
                        {selectedDevice.statusConexao === 'Online' ? '45 min (Segundo Plano)' : 'Inativo / Offline'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dynamic Uninstall terminal logs or success */}
              {(isUninstalling || uninstallSuccess) && (
                <div className={`p-4 rounded-xl border text-xs space-y-2 font-mono ${
                  uninstallSuccess ? 'bg-green-50 border-green-300 text-green-900' : 'bg-[#0b1c30] text-gray-300 animate-pulse'
                }`}>
                  <div className="flex justify-between items-center border-b border-current/20 pb-1 mb-1">
                    <span className="text-[9px] uppercase font-bold tracking-wider">SAM Agent Remote Uninstall Daemon</span>
                    {isUninstalling && <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>}
                  </div>
                  <div className="space-y-1 text-[10px] leading-relaxed">
                    {uninstallLogs.map((log, idx) => (
                      <div key={idx} className="flex items-start gap-1">
                        <span>{log}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Footer with actions (option to remove) */}
            <div className="px-6 py-4 border-t border-[#c6c6cf] bg-[#f8f9ff] flex justify-between items-center text-xs">
              <button
                onClick={() => {
                  setSelectedSoftwareDetail(null);
                  setUninstallSuccess(false);
                  setUninstallLogs([]);
                }}
                disabled={isUninstalling}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-[#45464e] border border-[#c6c6cf] rounded-lg font-bold cursor-pointer transition-all disabled:opacity-50"
              >
                Voltar ao Dossiê
              </button>
              
              {!uninstallSuccess ? (
                <button
                  onClick={() => handleRemoveSoftware(selectedSoftwareDetail.licenseId)}
                  disabled={isUninstalling}
                  className="px-4 py-2 bg-[#ba1a1a] hover:bg-[#961212] text-white rounded-lg font-bold cursor-pointer transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  {isUninstalling ? (
                    <>
                      <RefreshCw size={13} className="animate-spin" />
                      Desinstalando...
                    </>
                  ) : (
                    <>
                      <Trash2 size={13} />
                      Remover Software do Dispositivo
                    </>
                  )}
                </button>
              ) : (
                <span className="font-mono text-[11px] font-bold text-green-700 flex items-center gap-1 animate-bounce">
                  <CheckCircle2 size={15} />
                  Software Desinstalado!
                </span>
              )}
            </div>

          </div>
        </div>
      )}

      {/* REPORT CONFIGURATION MODAL */}
      {isReportModalOpen && selectedDevice && (
        <div 
          className="fixed inset-0 bg-[#0b1c30]/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity animate-fade-in"
          onClick={() => {
            if (!isGeneratingReport) setIsReportModalOpen(false);
          }}
        >
          <div 
            className="bg-white rounded-2xl border border-[#c6c6cf] shadow-2xl w-full max-w-lg overflow-hidden animate-scale-in text-[#0b1c30]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-[#c6c6cf] bg-[#f8f9ff] flex justify-between items-center">
              <div>
                <span className="font-mono text-[9px] uppercase font-bold text-indigo-600 tracking-wider px-2 py-0.5 bg-indigo-50 rounded">
                  SAM Report Generator
                </span>
                <h3 className="font-headline text-lg font-black text-[#1e284c] mt-1 flex items-center gap-2">
                  <FileDown size={20} className="text-indigo-600" />
                  Extrair Relatório de Endpoint
                </h3>
              </div>
              <button 
                onClick={() => setIsReportModalOpen(false)}
                disabled={isGeneratingReport}
                className="p-1.5 hover:bg-[#eff4ff] rounded-full transition-colors cursor-pointer text-[#45464e]"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body with Checkboxes */}
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
              <p className="text-xs text-[#45464e]">
                Selecione quais dados e métricas do dispositivo <strong className="text-[#1e284c]">{selectedDevice.hostname}</strong> deseja coletar e estruturar neste relatório de auditoria.
              </p>

              <div className="space-y-3.5 bg-slate-50 p-4 rounded-xl border border-[#c6c6cf]/60">
                
                {/* 1. Nome do dispositivo (Tickado Obrigatório) */}
                <label className="flex items-start gap-3 p-2.5 rounded hover:bg-white transition-colors cursor-not-allowed">
                  <input 
                    type="checkbox" 
                    checked={true}
                    disabled={true}
                    className="mt-1 h-4.5 w-4.5 rounded border-[#c6c6cf] text-indigo-600 focus:ring-indigo-500 cursor-not-allowed"
                  />
                  <div>
                    <span className="text-xs font-bold text-[#1e284c] flex items-center gap-1.5">
                      Nome do dispositivo <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 bg-indigo-100 text-indigo-800 rounded">Obrigatório</span>
                    </span>
                    <span className="block text-[10px] text-[#45464e] mt-0.5">Identificador de rede (Hostname: {selectedDevice.hostname}), IP e MAC.</span>
                  </div>
                </label>

                {/* 2. Usuários */}
                <label className="flex items-start gap-3 p-2.5 rounded hover:bg-white transition-colors cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={reportFields.users}
                    onChange={(e) => setReportFields(prev => ({ ...prev, users: e.target.checked }))}
                    className="mt-1 h-4.5 w-4.5 rounded border-[#c6c6cf] text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-bold text-[#1e284c]">Usuários</span>
                    <span className="block text-[10px] text-[#45464e] mt-0.5">Nome do colaborador ativo, departamento, cargo e tempo de sessão atual.</span>
                  </div>
                </label>

                {/* 3. Softwares Instalados */}
                <label className="flex items-start gap-3 p-2.5 rounded hover:bg-white transition-colors cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={reportFields.softwares}
                    onChange={(e) => setReportFields(prev => ({ ...prev, softwares: e.target.checked }))}
                    className="mt-1 h-4.5 w-4.5 rounded border-[#c6c6cf] text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-bold text-[#1e284c]">Softwares instalados</span>
                    <span className="block text-[10px] text-[#45464e] mt-0.5">Inventário completo de ferramentas SAM cadastradas e monitoradas.</span>
                  </div>
                </label>

                {/* 4. Último Acesso */}
                <label className="flex items-start gap-3 p-2.5 rounded hover:bg-white transition-colors cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={reportFields.lastSeen}
                    onChange={(e) => setReportFields(prev => ({ ...prev, lastSeen: e.target.checked }))}
                    className="mt-1 h-4.5 w-4.5 rounded border-[#c6c6cf] text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-bold text-[#1e284c]">Último acesso</span>
                    <span className="block text-[10px] text-[#45464e] mt-0.5">Registro temporal da última varredura bem-sucedida do SAM Agent.</span>
                  </div>
                </label>

                {/* 5. Tempo de Atividade */}
                <label className="flex items-start gap-3 p-2.5 rounded hover:bg-white transition-colors cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={reportFields.uptime}
                    onChange={(e) => setReportFields(prev => ({ ...prev, uptime: e.target.checked }))}
                    className="mt-1 h-4.5 w-4.5 rounded border-[#c6c6cf] text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-bold text-[#1e284c]">Tempo de atividade</span>
                    <span className="block text-[10px] text-[#45464e] mt-0.5">Duração das sessões produtivas diárias de uso nos endpoints.</span>
                  </div>
                </label>

                {/* 6. Histórico de Uso por Período */}
                <label className="flex items-start gap-3 p-2.5 rounded hover:bg-white transition-colors cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={reportFields.usageHistory}
                    onChange={(e) => setReportFields(prev => ({ ...prev, usageHistory: e.target.checked }))}
                    className="mt-1 h-4.5 w-4.5 rounded border-[#c6c6cf] text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-bold text-[#1e284c]">Histórico de uso por período</span>
                    <span className="block text-[10px] text-[#45464e] mt-0.5">Compilado quantitativo de horas de uso: Diário, Mensal e Anual.</span>
                  </div>
                </label>

                {/* 7. Versão do Software */}
                <label className="flex items-start gap-3 p-2.5 rounded hover:bg-white transition-colors cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={reportFields.softwareVersion}
                    onChange={(e) => setReportFields(prev => ({ ...prev, softwareVersion: e.target.checked }))}
                    className="mt-1 h-4.5 w-4.5 rounded border-[#c6c6cf] text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-bold text-[#1e284c]">Versão do software</span>
                    <span className="block text-[10px] text-[#45464e] mt-0.5">Versões específicas de cada executável ativo detectadas pelo agente.</span>
                  </div>
                </label>

                {/* 8. Status de Uso */}
                <label className="flex items-start gap-3 p-2.5 rounded hover:bg-white transition-colors cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={reportFields.softwareStatus}
                    onChange={(e) => setReportFields(prev => ({ ...prev, softwareStatus: e.target.checked }))}
                    className="mt-1 h-4.5 w-4.5 rounded border-[#c6c6cf] text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-bold text-[#1e284c]">Status de uso</span>
                    <span className="block text-[10px] text-[#45464e] mt-0.5">Classificação operacional detalhada (Em Uso, Ociosa ou Não Conforme).</span>
                  </div>
                </label>

                {/* 9. Custo de Licença Mensal e Anual */}
                <label className="flex items-start gap-3 p-2.5 rounded hover:bg-white transition-colors cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={reportFields.licensingCosts}
                    onChange={(e) => setReportFields(prev => ({ ...prev, licensingCosts: e.target.checked }))}
                    className="mt-1 h-4.5 w-4.5 rounded border-[#c6c6cf] text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-bold text-[#1e284c]">Custo de licença mensal e anual</span>
                    <span className="block text-[10px] text-[#45464e] mt-0.5">Precificação exata individualizada e consolidada do device.</span>
                  </div>
                </label>

              </div>

              {/* Progress feedback for extraction */}
              {isGeneratingReport && (
                <div className="p-4 bg-[#0b1c30] text-gray-300 rounded-xl border border-slate-700 font-mono text-[10px] space-y-1.5 animate-pulse">
                  <div className="flex justify-between items-center text-white border-b border-current/10 pb-1">
                    <span className="font-bold font-sans">AGENTE DISCOVERY EM AÇÃO...</span>
                    <RefreshCw size={12} className="animate-spin" />
                  </div>
                  <div>📡 Conectando remotamente ao host {selectedDevice.hostname}...</div>
                  <div>🔐 Extraindo assinaturas digitais de processos ativos...</div>
                  <div>💾 Agregando logs estruturados de auditoria...</div>
                  <div className="text-green-400">✅ Pacote de dados gerado com sucesso!</div>
                </div>
              )}

            </div>

            {/* Footer with actions */}
            <div className="px-6 py-4 border-t border-[#c6c6cf] bg-[#f8f9ff] flex justify-end gap-2 text-xs">
              <button
                onClick={() => setIsReportModalOpen(false)}
                disabled={isGeneratingReport}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-[#45464e] border border-[#c6c6cf] rounded-lg font-bold cursor-pointer transition-all disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  setIsGeneratingReport(true);
                  setTimeout(() => {
                    setIsGeneratingReport(false);
                    setIsReportModalOpen(false);
                    setIsGeneratedReportViewOpen(true);
                  }, 1600);
                }}
                disabled={isGeneratingReport}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold cursor-pointer transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                {isGeneratingReport ? (
                  <>
                    <RefreshCw size={13} className="animate-spin" />
                    Extraindo...
                  </>
                ) : (
                  <>
                    <Check size={14} />
                    Confirmar e Gerar
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* DETAILED GENERATED REPORT VIEW MODAL */}
      {isGeneratedReportViewOpen && selectedDevice && (
        <div 
          className="fixed inset-0 bg-[#0b1c30]/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity animate-fade-in"
          onClick={() => setIsGeneratedReportViewOpen(false)}
        >
          <div 
            className="bg-white rounded-2xl border border-[#c6c6cf] shadow-2xl w-full max-w-3xl overflow-hidden animate-scale-in text-[#0b1c30]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#c6c6cf] bg-[#f8f9ff] flex justify-between items-center">
              <div className="flex items-center gap-2">
                <FileDown size={18} className="text-indigo-600" />
                <span className="font-sans font-black text-sm text-[#1e284c]">
                  Pré-visualização do Relatório SAM
                </span>
              </div>
              <button 
                onClick={() => setIsGeneratedReportViewOpen(false)}
                className="p-1.5 hover:bg-[#eff4ff] rounded-full transition-colors cursor-pointer text-[#45464e]"
              >
                <X size={18} />
              </button>
            </div>

            {/* Print-styled Report Paper */}
            <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar bg-slate-50">
              <div id="sam-report-print-area" className="bg-white p-8 rounded-xl border border-[#c6c6cf]/80 shadow-sm font-sans space-y-6">
                
                {/* Official Header */}
                <div className="border-b-2 border-slate-900 pb-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <span className="font-mono text-[9px] font-black uppercase text-indigo-600 tracking-widest block">SYSTEM AUDIT MANAGER (SAM)</span>
                    <h2 className="text-xl font-black text-[#1e284c] mt-0.5 tracking-tight uppercase">Dossiê Consolidado de Endpoint</h2>
                  </div>
                  <div className="text-right font-mono text-[9px] text-[#45464e] leading-relaxed">
                    <div>REGISTRO: SAM-2026-{selectedDevice.id.toUpperCase()}</div>
                    <div>DATA: {new Date().toLocaleDateString('pt-BR')}</div>
                    <div>EMISSOR: SAM Discovery Agent</div>
                  </div>
                </div>

                {/* Section 1: Device General Metadata */}
                <div className="space-y-3">
                  <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-[#1e284c] border-b border-slate-100 pb-1">
                    01. Identificação Geral do Endpoint
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-3 gap-x-4 text-xs">
                    
                    {/* Always visible hostname */}
                    <div>
                      <span className="block text-[9px] font-mono font-bold text-gray-500 uppercase">Hostname do Dispositivo</span>
                      <span className="font-mono font-black text-[#1e284c] text-sm mt-0.5 block">{selectedDevice.hostname}</span>
                    </div>

                    <div>
                      <span className="block text-[9px] font-mono font-bold text-gray-500 uppercase">Endereço IP corporativo</span>
                      <span className="font-mono font-bold text-[#1e284c] mt-0.5 block">{selectedDevice.ip}</span>
                    </div>

                    <div>
                      <span className="block text-[9px] font-mono font-bold text-gray-500 uppercase">Endereço MAC físico</span>
                      <span className="font-mono font-bold text-[#1e284c] mt-0.5 block">{selectedDevice.mac}</span>
                    </div>

                    {reportFields.users && (
                      <>
                        <div>
                          <span className="block text-[9px] font-mono font-bold text-gray-500 uppercase">Usuários</span>
                          <span className="font-black text-[#1e284c] mt-0.5 block">{selectedDevice.usuario}</span>
                        </div>
                        <div>
                          <span className="block text-[9px] font-mono font-bold text-gray-500 uppercase">Departamento</span>
                          <span className="font-semibold text-gray-700 mt-0.5 block">{selectedDevice.departamento}</span>
                        </div>
                      </>
                    )}

                    {reportFields.lastSeen && (
                      <div>
                        <span className="block text-[9px] font-mono font-bold text-gray-500 uppercase">Último Acesso</span>
                        <span className="font-bold text-gray-700 mt-0.5 block">{selectedDevice.lastSeen}</span>
                      </div>
                    )}

                    {reportFields.uptime && (
                      <div>
                        <span className="block text-[9px] font-mono font-bold text-gray-500 uppercase">Tempo de Atividade</span>
                        <span className="font-mono font-bold text-indigo-600 mt-0.5 block">5h 32m (Status: {selectedDevice.statusConexao})</span>
                      </div>
                    )}

                  </div>
                </div>

                {/* Section 2: Softwares inventory and detail metrics */}
                {reportFields.softwares && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-[#1e284c] border-b border-slate-100 pb-1">
                      02. Inventário de Softwares & Métricas de Governança
                    </h3>
                    
                    <div className="border border-[#c6c6cf]/60 rounded-lg overflow-hidden">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-slate-50 text-[9px] font-mono uppercase text-[#45464e] border-b border-[#c6c6cf]/60">
                          <tr>
                            <th className="px-4 py-2 font-bold">Software Instalado</th>
                            {reportFields.softwareVersion && <th className="px-4 py-2 font-bold">Versão do software</th>}
                            {reportFields.softwareStatus && <th className="px-4 py-2 font-bold text-center">Status de uso</th>}
                            {reportFields.usageHistory && <th className="px-4 py-2 font-bold text-center">Uso (Diário/Mensal/Anual)</th>}
                            <th className="px-4 py-2 font-bold text-center">Último Acesso</th>
                            {reportFields.licensingCosts && <th className="px-4 py-2 font-bold text-right">Custo Mensal</th>}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {selectedDevice.softwares.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="px-4 py-6 text-center text-[#45464e] italic">
                                Nenhum software detectado.
                              </td>
                            </tr>
                          ) : (
                            selectedDevice.softwares.map((sw, idx) => (
                              <tr key={idx} className="hover:bg-slate-50/50">
                                <td className="px-4 py-2.5 font-bold text-[#1e284c]">{sw.softwareName}</td>
                                {reportFields.softwareVersion && (
                                  <td className="px-4 py-2.5 font-mono text-gray-500">{sw.versao}</td>
                                )}
                                {reportFields.softwareStatus && (
                                  <td className="px-4 py-2.5 text-center">
                                    <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-extrabold ${
                                      sw.status === 'Em Uso' 
                                        ? 'bg-green-50 text-green-700 border border-green-200' 
                                        : sw.status === 'Ociosa'
                                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                          : 'bg-red-50 text-[#ba1a1a] border border-red-200'
                                    }`}>
                                      {sw.status}
                                    </span>
                                  </td>
                                )}
                                {reportFields.usageHistory && (
                                  <td className="px-4 py-2.5 text-center font-mono text-[10px] text-[#45464e]">
                                    {sw.status === 'Em Uso' 
                                      ? '5.4h / 118h / 1.416h' 
                                      : sw.status === 'Ociosa' 
                                        ? '0.0h / 0.4h / 4.8h' 
                                        : '2.5h / 52h / 624h'}
                                  </td>
                                )}
                                <td className="px-4 py-2.5 text-center font-mono text-[10px] text-[#45464e]">
                                  {sw.ultimoAcesso}
                                </td>
                                {reportFields.licensingCosts && (
                                  <td className="px-4 py-2.5 text-right font-mono font-semibold text-slate-800">
                                    {formatCurrency(sw.custoMensal)}
                                  </td>
                                )}
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Section 3: Licensing costs consolidated summary */}
                {reportFields.licensingCosts && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-[#1e284c] border-b border-slate-100 pb-1">
                      03. Consolidação de Custos do Endpoint
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                      <div>
                        <span className="block text-[9px] font-mono font-bold text-[#45464e] uppercase font-sans">Soma do Custo de Licenciamento Mensal</span>
                        <span className="text-lg font-black text-green-700 font-mono mt-1 block">
                          {formatCurrency(selectedDevice.softwares.reduce((sum, s) => sum + s.custoMensal, 0))}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[9px] font-mono font-bold text-[#45464e] uppercase font-sans">Soma de Custo Estimado Anualizado</span>
                        <span className="text-lg font-black text-indigo-600 font-mono mt-1 block">
                          {formatCurrency(selectedDevice.softwares.reduce((sum, s) => sum + s.custoMensal, 0) * 12)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Corporate integrity certification */}
                <div className="border-t border-dashed border-slate-300 pt-5 mt-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-[10px] text-[#45464e]">
                  <div className="space-y-0.5">
                    <div className="font-bold text-[#1e284c] uppercase tracking-wide">Certificação SAM Discovery</div>
                    <div>Este relatório é gerado de forma autônoma de acordo com as normas ISO/IEC 19770.</div>
                  </div>
                  <div className="text-right italic font-semibold text-indigo-600 font-mono">
                    VALIDADO POR SAM-AGENT-DAEMON-V3
                  </div>
                </div>

              </div>
            </div>

            {/* Modal Footer actions */}
            <div className="px-6 py-4 border-t border-[#c6c6cf] bg-[#f8f9ff] flex justify-between items-center text-xs">
              <span className="text-[10px] text-[#45464e] font-semibold italic">Confirmação de extração SAM</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsGeneratedReportViewOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-[#45464e] border border-[#c6c6cf] rounded-lg font-bold cursor-pointer transition-all"
                >
                  Voltar
                </button>
                
                <button
                  onClick={() => {
                    const printContents = document.getElementById('sam-report-print-area')?.innerHTML;
                    if (printContents) {
                      const printWindow = window.open('', '', 'height=600,width=800');
                      if (printWindow) {
                        printWindow.document.write('<html><head><title>Relatorio SAM</title>');
                        printWindow.document.write('<style>body { font-family: sans-serif; padding: 20px; color: #0b1c30; } table { width: 100%; border-collapse: collapse; margin-top: 15px; } th, td { border: 1px solid #c6c6cf; padding: 8px; text-align: left; font-size: 12px; } th { background-color: #eff4ff; font-family: monospace; text-transform: uppercase; } .text-right { text-align: right; } .text-center { text-align: center; } .font-mono { font-family: monospace; } .font-black { font-weight: 900; } .font-bold { font-weight: 700; } .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-top: 10px; } .space-y-6 > * + * { margin-top: 1.5rem; } .border-b-2 { border-bottom: 2px solid #000; padding-bottom: 15px; } .pb-5 { padding-bottom: 1.25rem; } .mb-4 { margin-bottom: 1rem; } .bg-slate-50 { background-color: #f8f9ff; border: 1px solid #c6c6cf; padding: 15px; border-radius: 8px; }</style>');
                        printWindow.document.write('</head><body>');
                        printWindow.document.write(printContents);
                        printWindow.document.write('</body></html>');
                        printWindow.document.close();
                        printWindow.focus();
                        setTimeout(() => {
                          printWindow.print();
                        }, 500);
                      }
                    }
                  }}
                  className="px-4 py-2 bg-white hover:bg-[#eff4ff] text-[#1e284c] border border-[#c6c6cf] rounded-lg font-bold cursor-pointer transition-all flex items-center gap-1.5"
                >
                  <Printer size={13} />
                  Imprimir
                </button>

                <button
                  onClick={downloadTextReport}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold cursor-pointer transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <Download size={13} />
                  Baixar TXT Estilizado
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
