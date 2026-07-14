import { useState, useEffect, FormEvent } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { 
  Workflow, 
  RefreshCw, 
  Check, 
  Server, 
  Cloud, 
  ArrowRight, 
  Database, 
  Settings2, 
  ShieldCheck, 
  FileText, 
  Plus, 
  Trash2, 
  AlertTriangle, 
  Lock, 
  UserCheck, 
  TrendingDown,
  TrendingUp,
  Info,
  Sliders,
  Sparkles,
  Search,
  X,
  Key,
  SlidersHorizontal,
  Globe,
  DollarSign,
  Activity,
  Layers,
  Cpu
} from 'lucide-react';
import { CompanyData, License } from '../data-types';

interface IntegrationsViewProps {
  companyData: CompanyData;
  onConnectAWS?: () => void;
  onDisconnectAWS?: () => void;
  mode?: 'cloud-only' | 'integrations-only';
}

interface AttributeMapping {
  id: string;
  adField: string;
  msField: string;
  status: 'Ativo' | 'Inativo';
}

interface LicenseRule {
  id: string;
  adGroup: string;
  msLicense: string;
  action: 'Atribuir' | 'Remover';
}

export default function IntegrationsView({ companyData, onConnectAWS, onDisconnectAWS, mode = 'cloud-only' }: IntegrationsViewProps) {
  // Sub-tabs in Integrations
  const [subTab, setSubTab] = useState<'cloud' | 'status' | 'config' | 'mapping' | 'governance' | 'logs'>(
    mode === 'cloud-only' ? 'cloud' : 'status'
  );

  useEffect(() => {
    setSubTab(mode === 'cloud-only' ? 'cloud' : 'status');
  }, [mode]);

  // Sync Simulator State
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<string[]>([]);
  const [syncStep, setSyncStep] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState<string>('Hoje, às 11:45');

  // Config States (AD & Microsoft Admin)
  const [adDomain, setAdDomain] = useState('b3ware.local');
  const [adServer, setAdServer] = useState('dc01.b3ware.local');
  const [adUser, setAdUser] = useState('administrator@b3ware.local');
  const [adPassword, setAdPassword] = useState('••••••••••••••••••••');
  const [adBaseDN, setAdBaseDN] = useState('OU=Colaboradores,DC=b3ware,DC=local');
  const [adPort, setAdPort] = useState('636');
  const [adSSL, setAdSSL] = useState(true);

  const [msTenantId, setMsTenantId] = useState('72f988bf-86f1-41af-91ab-2d7cd011db47');
  const [msClientId, setMsClientId] = useState('3b4d4f82-a7d5-454d-bf9c-29b28ea1203b');
  const [msClientSecret, setMsClientSecret] = useState('••••••••••••••••••••••••••••••••••••');
  const [msVerified, setMsVerified] = useState(true);

  // Connector Marketplace Interface
  interface Connector {
    id: string;
    name: string;
    description: string;
    category: 'Diretório' | 'Produtividade' | 'Cloud' | 'Segurança' | 'Backup';
    status: 'Conectado' | 'Configurado' | 'Não Configurado';
    lastSync: string;
    iconName: string;
    tech: string;
  }

  // State for Marketplace
  const [connectors, setConnectors] = useState<Connector[]>([
    {
      id: 'active_directory',
      name: 'Active Directory (LDAP)',
      description: 'Integração LDAP segura (LDAPS) com os servidores de domínio local para importar OUs, grupos e computadores.',
      category: 'Diretório',
      status: 'Conectado',
      lastSync: 'Hoje, 11:45',
      iconName: 'Server',
      tech: 'LDAP / LDAPS (Porta 636)'
    },
    {
      id: 'microsoft_admin',
      name: 'Microsoft Admin Center (M365)',
      description: 'Sincronização bidirecional via Microsoft Graph API para provisionar licenças M365 e monitorar o Entra ID.',
      category: 'Produtividade',
      status: 'Conectado',
      lastSync: 'Hoje, 11:45',
      iconName: 'Cloud',
      tech: 'Microsoft Graph REST API'
    },
    {
      id: 'aws',
      name: 'AWS License Manager',
      description: 'Descoberta de ativos baseados em instâncias EC2 e monitoramento de licenças RDS (SQL Server, Oracle) em nuvem AWS.',
      category: 'Cloud',
      status: 'Não Configurado',
      lastSync: 'Nunca',
      iconName: 'Database',
      tech: 'AWS Systems Manager API'
    },
    {
      id: 'veeam',
      name: 'Veeam Backup & Replication',
      description: 'Sincroniza o número de instâncias de máquinas virtuais e servidores físicos que utilizam pacotes de backup ativos.',
      category: 'Backup',
      status: 'Não Configurado',
      lastSync: 'Nunca',
      iconName: 'RefreshCw',
      tech: 'Veeam REST API v1.2'
    },
    {
      id: 'redhat',
      name: 'Red Hat Subscription Manager',
      description: 'Valida subscrições ativas de RHEL e clusters de OpenShift rodando em bare-metal ou nuvens híbridas.',
      category: 'Cloud',
      status: 'Não Configurado',
      lastSync: 'Nunca',
      iconName: 'Workflow',
      tech: 'RHSM Client Web API'
    },
    {
      id: 'symantec',
      name: 'Symantec Endpoint Security',
      description: 'Mapeia agentes antivírus Symantec (SES) instalados e valida conformidade de licenças corporativas adquiridas.',
      category: 'Segurança',
      status: 'Não Configurado',
      lastSync: 'Nunca',
      iconName: 'ShieldCheck',
      tech: 'Symantec SEPM Web Services'
    },
    {
      id: 'kaspersky',
      name: 'Kaspersky Security Center',
      description: 'Audita conformidade de chaves de licença para servidores e endpoints protegidos pelo Kaspersky no ambiente local.',
      category: 'Segurança',
      status: 'Não Configurado',
      lastSync: 'Nunca',
      iconName: 'Lock',
      tech: 'Kaspersky KSC Open API'
    }
  ]);

  // Marketplace UI states
  const [searchQuery, setSearchQuery] = useState('');
  const [cloudSearch, setCloudSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [selectedConnectorId, setSelectedConnectorId] = useState<string | null>(null);
  const [selectedCloudLicense, setSelectedCloudLicense] = useState<License | null>(null);
  const [showOnlyConnected, setShowOnlyConnected] = useState(false);

  // AWS Configuration States
  const [awsAccessKey, setAwsAccessKey] = useState('AKIAIOSFODNN7EXAMPLE');
  const [awsSecretKey, setAwsSecretKey] = useState('••••••••••••••••••••••••••••••••••••');
  const [awsRegion, setAwsRegion] = useState('us-east-1');

  // Veeam Configuration States
  const [veeamUrl, setVeeamUrl] = useState('https://veeam.b3ware.local:8443');
  const [veeamUser, setVeeamUser] = useState('administrator');
  const [veeamPassword, setVeeamPassword] = useState('••••••••••••••••••••');

  // Red Hat Configuration States
  const [rhOrgId, setRhOrgId] = useState('12409543');
  const [rhActivationKey, setRhActivationKey] = useState('rh-key-prod-b3ware');

  // Symantec Configuration States
  const [symantecUrl, setSymantecUrl] = useState('https://symantec-sepm.b3ware.local:9090');
  const [symantecClientId, setSymantecClientId] = useState('client_sam_b3ware');
  const [symantecClientSecret, setSymantecClientSecret] = useState('••••••••••••••••••••');

  // Kaspersky Configuration States
  const [kasperskyServer, setKasperskyServer] = useState('ksc01.b3ware.local');
  const [kasperskyApiKey, setKasperskyApiKey] = useState('••••••••••••••••••••••••••••••••••••');

  // Attribute Mappings
  const [mappings, setMappings] = useState<AttributeMapping[]>([
    { id: '1', adField: 'sAMAccountName', msField: 'userPrincipalName', status: 'Ativo' },
    { id: '2', adField: 'mail', msField: 'mail', status: 'Ativo' },
    { id: '3', adField: 'givenName', msField: 'givenName', status: 'Ativo' },
    { id: '4', adField: 'sn', msField: 'surname', status: 'Ativo' },
    { id: '5', adField: 'department', msField: 'department', status: 'Ativo' },
    { id: '6', adField: 'title', msField: 'jobTitle', status: 'Ativo' },
    { id: '7', adField: 'telephoneNumber', msField: 'businessPhones', status: 'Ativo' },
  ]);

  const [newAdField, setNewAdField] = useState('');
  const [newMsField, setNewMsField] = useState('');

  // Licensing Rules
  const [licenseRules, setLicenseRules] = useState<LicenseRule[]>([
    { id: '1', adGroup: 'GG_M365_E5_Users', msLicense: 'Microsoft 365 E5', action: 'Atribuir' },
    { id: '2', adGroup: 'GG_Adobe_Designers', msLicense: 'Adobe Creative Cloud', action: 'Atribuir' },
    { id: '3', adGroup: 'GG_AutoCAD_Engineers', msLicense: 'AutoCAD Premium', action: 'Atribuir' },
    { id: '4', adGroup: 'GG_Office_Standard', msLicense: 'Office 365 Business Premium', action: 'Atribuir' },
  ]);

  const [newAdGroup, setNewAdGroup] = useState('');
  const [newMsLicense, setNewMsLicense] = useState('Microsoft 365 E5');

  // Governance Policies
  const [autoRevokeIdle, setAutoRevokeIdle] = useState(true);
  const [idleDays, setIdleDays] = useState(30);
  const [blockOnAdDisable, setBlockOnAdDisable] = useState(true);
  const [notifyOnSavings, setNotifyOnSavings] = useState(true);
  const [enforceMfaForAdUsers, setEnforceMfaForAdUsers] = useState(true);
  const [writebackAdLicense, setWritebackAdLicense] = useState(false);

  // Mock Logs
  const [syncLogs, setSyncLogs] = useState([
    { id: '101', date: 'Hoje, 11:45', type: 'Diferencial', usersMatched: 232, licensesAssigned: 1, licensesReclaimed: 3, conflicts: 0, status: 'Sucesso' },
    { id: '102', date: 'Ontem, 18:00', type: 'Diferencial', usersMatched: 232, licensesAssigned: 0, licensesReclaimed: 1, conflicts: 0, status: 'Sucesso' },
    { id: '103', date: 'Ontem, 12:00', type: 'Completa', usersMatched: 231, licensesAssigned: 4, licensesReclaimed: 8, conflicts: 1, status: 'Sucesso com Alertas' },
    { id: '104', date: '01/07/2026, 18:00', type: 'Diferencial', usersMatched: 228, licensesAssigned: 2, licensesReclaimed: 0, conflicts: 0, status: 'Sucesso' },
    { id: '105', date: '01/07/2026, 12:00', type: 'Diferencial', usersMatched: 228, licensesAssigned: 1, licensesReclaimed: 4, conflicts: 2, status: 'Falha na Conexão AD' },
  ]);

  // Synchronize the connectors state with the company's loaded licenses in real-time
  useEffect(() => {
    const isAwsConnected = companyData.licenses.some(l => l.id.startsWith('lic-aws-'));
    setConnectors(prev => prev.map(c => {
      if (c.id === 'aws') {
        return {
          ...c,
          status: isAwsConnected ? 'Conectado' : 'Não Configurado',
          lastSync: isAwsConnected ? 'Hoje, 11:45' : 'Nunca'
        };
      }
      return c;
    }));
  }, [companyData.licenses]);

  // Sync animation simulation
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isSyncing) {
      const isAwsConnected = companyData.licenses.some(l => l.id.startsWith('lic-aws-'));
      const steps = [
        '📡 Iniciando handshake TLS seguro com o Active Directory...',
        `🔑 Autenticado em ${adServer}:${adPort} via SSL com sucesso.`,
        '🔄 Carregando hierarquia da Unidade Organizacional (OU) corporativa...',
        `👥 Identificados 232 colaboradores na base '${adBaseDN}'.`,
        '🌐 Conectando à nuvem da Microsoft Admin (Graph API Endpoint)...',
        '⚡ Mapeando grupos de segurança do AD com licenças M365 ativas...',
        '🔍 Comparando contas locais com o Microsoft Entra ID...',
        ...(isAwsConnected ? [
          '☁️ Conectando à API do AWS License Manager (us-east-1)...',
          '📊 Mapeando licenças vCPU de Windows Server e instâncias SQL Server...',
          '⚠️ Identificado desvio de conformidade no Oracle Database (RDS BYOL)...',
          '💡 Identificada oportunidade de otimização no SQL Server (4 instâncias ociosas)...'
        ] : []),
        '💰 Analisando ociosidade de licenças nos endpoints descobertos...',
        '✅ Atualizando dados: 2 usuários tiveram licenças provisionadas, 3 licenças ociosas suspensas com sucesso.',
        '💾 Gravando log consolidado na governança NexusSAM ITAM...'
      ];

      if (syncStep < steps.length) {
        timer = setTimeout(() => {
          setSyncProgress(prev => [...prev, steps[syncStep]]);
          setSyncStep(prev => prev + 1);
        }, 800);
      } else {
        timer = setTimeout(() => {
          setIsSyncing(false);
          const now = new Date();
          const formattedTime = `Hoje, às ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
          setLastSyncTime(formattedTime);
          
          // Add new log to the beginning
          setSyncLogs(prev => [
            {
              id: `log-new-${Date.now()}`,
              date: formattedTime,
              type: 'Diferencial',
              usersMatched: 232,
              licensesAssigned: 2,
              licensesReclaimed: 3,
              conflicts: 0,
              status: 'Sucesso'
            },
            ...prev
          ]);
        }, 1000);
      }
    }
    return () => clearTimeout(timer);
  }, [isSyncing, syncStep]);

  const handleStartSync = () => {
    setIsSyncing(true);
    setSyncStep(0);
    setSyncProgress([]);
  };

  const handleAddMapping = (e: FormEvent) => {
    e.preventDefault();
    if (!newAdField || !newMsField) return;
    const newMap: AttributeMapping = {
      id: `map-${Date.now()}`,
      adField: newAdField,
      msField: newMsField,
      status: 'Ativo'
    };
    setMappings([...mappings, newMap]);
    setNewAdField('');
    setNewMsField('');
  };

  const handleRemoveMapping = (id: string) => {
    setMappings(mappings.filter(m => m.id !== id));
  };

  const handleAddRule = (e: FormEvent) => {
    e.preventDefault();
    if (!newAdGroup) return;
    const newRule: LicenseRule = {
      id: `rule-${Date.now()}`,
      adGroup: newAdGroup,
      msLicense: newMsLicense,
      action: 'Atribuir'
    };
    setLicenseRules([...licenseRules, newRule]);
    setNewAdGroup('');
  };

  const handleRemoveRule = (id: string) => {
    setLicenseRules(licenseRules.filter(r => r.id !== id));
  };

  const handleSaveConfig = () => {
    alert('Configurações de infraestrutura e credenciais salvas com sucesso! Um teste de ping foi realizado e a integridade da conexão está 100% OK.');
  };

  const getConnectorIcon = (id: string) => {
    switch (id) {
      case 'active_directory':
        return (
          <svg viewBox="0 0 32 32" className="w-8 h-8" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="11" y="2" width="10" height="7" rx="1.5" fill="#0078D4" />
            <rect x="13" y="5" width="6" height="1.5" fill="white" opacity="0.8" />
            <rect x="2" y="19" width="8" height="7" rx="1.5" fill="#00a4ef" />
            <rect x="4" y="22" width="4" height="1.5" fill="white" opacity="0.8" />
            <rect x="22" y="19" width="8" height="7" rx="1.5" fill="#00a4ef" />
            <rect x="24" y="22" width="4" height="1.5" fill="white" opacity="0.8" />
            <path d="M16 9v5M6 21v-3h20v3M16 14h-10M16 14h10" stroke="#0078D4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="16" cy="14" r="2" fill="#005a9e" />
          </svg>
        );
      case 'microsoft_admin':
        return (
          <svg viewBox="0 0 23 23" className="w-7 h-7" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="1" y="1" width="10" height="10" fill="#f25022" />
            <rect x="12" y="1" width="10" height="10" fill="#7fba00" />
            <rect x="1" y="12" width="10" height="10" fill="#00a4ef" />
            <rect x="12" y="12" width="10" height="10" fill="#ffb900" />
          </svg>
        );
      case 'aws':
        return (
          <svg viewBox="0 0 48 32" className="w-10 h-10" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g fill="#232F3E">
              <path d="M12.5 18.5c-.3.4-.8.7-1.4.7-.8 0-1.2-.5-1.2-1.1 0-1.1.9-1.6 2.5-1.6v.5c0 .7-.1 1.1-.9 1.5zm1.5-4.3c-.6-.4-1.3-.6-2.1-.6-2.1 0-3.4 1.1-3.4 3.1 0 1.9 1.2 3 3.1 3 1 0 1.7-.4 2.1-.8l.1.7h1.4v-5.6c0-1.8-.9-2.7-2.7-2.7-1.1 0-2.1.4-2.7.9l.5 1.1c.5-.3 1.1-.6 1.8-.6.9 0 1.4.4 1.4 1.3v.2z"/>
              <path d="M25.4 13h-1.5l-2.1 6.5-1.9-6.5h-1.5l-1.9 6.5-2-6.5h-1.5l2.7 8.3h1.5l1.9-6.2 1.9 6.2h1.5l2.9-8.3z"/>
              <path d="M30.6 15.6c-.9-.4-1.4-.6-1.9-.6-.6 0-.9.3-.9.7 0 .4.3.6 1.2.9 1.5.4 2.3 1 2.3 2.2 0 1.6-1.3 2.5-3.1 2.5-1.1 0-2.1-.3-2.7-.8l.5-1.1c.6.4 1.3.7 2 .7.7 0 1.1-.3 1.1-.8 0-.4-.3-.6-1.2-.9-1.4-.4-2.2-1-2.2-2.1 0-1.5 1.2-2.4 2.9-2.4.9 0 1.7.2 2.3.6l-.5 1.2z"/>
            </g>
            <path d="M10.5 24c4.5 3 14.5 4.5 22.5 1.5" stroke="#FF9900" strokeWidth="2.5" strokeLinecap="round"/>
            <path d="M33 25.5l.5-3.5-3 1.5 2.5 2z" fill="#FF9900"/>
          </svg>
        );
      case 'veeam':
        return (
          <svg viewBox="0 0 32 32" className="w-8 h-8" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="2" width="28" height="28" rx="4" fill="#00B356" />
            <rect x="7" y="7" width="6" height="18" fill="white" />
            <rect x="13" y="19" width="12" height="6" fill="white" />
            <rect x="13" y="7" width="12" height="6" fill="white" />
            <rect x="19" y="13" width="6" height="6" fill="white" />
          </svg>
        );
      case 'redhat':
        return (
          <svg viewBox="0 0 32 32" className="w-9 h-9" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2 20c1.5-1.5 5.5-3 10-3s12 1.5 14 3c1 .7.5 1.5-1 2-2 .7-8 1.5-13 1.5s-9-.8-10-1.5c-.8-.5-.8-1.3 0-2z" fill="#333333" />
            <path d="M6 19.5c0-4 3-10.5 10-10.5s9 5 9 10.5c0 .3-1.5.5-3 .5s-3-2-6-2-4 2-5 2c-1.5 0-5-.2-5-.5z" fill="#CC0000" />
            <path d="M12 17.2c2.5 0 5-1.2 7-1.2s3.5.8 4.5 1.2c.5.2.5-.5.5-.8 0-4-2-7.2-6-7.2s-6 3.2-6 7.2c0 .3 0 1 .5.8z" fill="#EE0000" />
            <path d="M11 17c1.5-1 3-1.5 5-1.5s3.5.5 5 1.5" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" opacity="0.9" />
          </svg>
        );
      case 'symantec':
        return (
          <svg viewBox="0 0 32 32" className="w-8 h-8" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="16" r="13" fill="#FFCC00" />
            <path d="M9 15.5l4.5 4.5L23 10" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M9 15.5l4.5 4.5L23 10" stroke="#111111" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );
      case 'kaspersky':
        return (
          <svg viewBox="0 0 32 32" className="w-8 h-8" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="2" width="28" height="28" rx="6" fill="#006D5B" />
            <path d="M8 8h3.5v16H8V8z" fill="#FFFFFF" />
            <path d="M19.5 8h-4.2l-3.8 6.5L11.5 16l3.8 1.5 4.2 6.5h4.2l-5.8-9 5.8-7z" fill="#FFFFFF" opacity="0.95" />
          </svg>
        );
      default:
        return <Workflow className="text-indigo-600" size={24} />;
    }
  };

  const handleSaveConnectorConfig = (connectorId: string) => {
    if (connectorId === 'aws') {
      onConnectAWS?.();
    } else {
      setConnectors(prev => prev.map(c => {
        if (c.id === connectorId) {
          return {
            ...c,
            status: 'Conectado',
            lastSync: 'Hoje, ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
          };
        }
        return c;
      }));
    }
    alert(`Parâmetros do conector salvos com sucesso! A integração está ativa.`);
    setSelectedConnectorId(null);
  };

  const handleDisconnectConnector = (connectorId: string) => {
    if (connectorId === 'aws') {
      onDisconnectAWS?.();
    } else {
      setConnectors(prev => prev.map(c => {
        if (c.id === connectorId) {
          return {
            ...c,
            status: 'Não Configurado',
            lastSync: 'Nunca'
          };
        }
        return c;
      }));
    }
    alert(`Integração com o conector desativada com sucesso!`);
  };

  const handleTestConnectorConnection = (connectorId: string) => {
    alert(`Teste de comunicação bem-sucedido! O agente de integração SAM conseguiu realizar a autenticação e obteve resposta positiva (Status: 200 OK).`);
  };

  return (
    <div className="space-y-6 select-none animate-fade-in text-[#0b1c30]">
      
      {/* HEADER BAR */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        {mode === 'cloud-only' ? (
          <div>
            <span className="font-mono text-[9px] uppercase font-bold text-indigo-600 tracking-wider px-2 py-0.5 bg-indigo-50 rounded">
              Governança e Ativos de Nuvem Híbrida
            </span>
            <h2 className="font-headline text-2xl font-black text-[#1e284c] tracking-tight mt-1 flex items-center gap-2">
              <Cloud className="text-indigo-600" />
              Gerenciamento de Ambientes Cloud
            </h2>
            <p className="text-xs text-[#45464e] mt-1 max-w-xl">
              Consolide licenças em nuvem, controle o consumo de instâncias virtuais (EC2, RDS) e configure a governança BYOL (Bring Your Own License) integrada ao seu Active Directory local.
            </p>
          </div>
        ) : (
          <div>
            <span className="font-mono text-[9px] uppercase font-bold text-indigo-600 tracking-wider px-2 py-0.5 bg-indigo-50 rounded">
              Hub de Conectividade Híbrida
            </span>
            <h2 className="font-headline text-2xl font-black text-[#1e284c] tracking-tight mt-1 flex items-center gap-2">
              <Workflow className="text-indigo-600" />
              Integração AD ↔ Microsoft Entra ID
            </h2>
            <p className="text-xs text-[#45464e] mt-1 max-w-xl">
              Sincronize sua base de colaboradores do Active Directory local com o Microsoft Entra ID (Azure AD), permitindo automação de licenças, desprovisionamento de ociosidades e auditorias financeiras centralizadas.
            </p>
          </div>
        )}
        
        {mode === 'integrations-only' && (
          <button
            onClick={handleStartSync}
            disabled={isSyncing}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-sans text-xs font-bold py-2.5 px-4 rounded-xl flex items-center gap-2 shadow-sm transition-all cursor-pointer active:scale-97 disabled:opacity-50"
          >
            <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
            {isSyncing ? 'Sincronizando...' : 'Sincronizar Agora'}
          </button>
        )}
      </div>

      {mode === 'integrations-only' && (
        <>
          {/* HEALTH VISUALIZER FLOW */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 bg-white p-6 rounded-2xl border border-[#c6c6cf] shadow-sm relative overflow-hidden">
            
            {/* On-Premises AD Node */}
            <div className="flex flex-col p-4 bg-slate-50 border border-slate-200 rounded-xl relative">
              <div className="absolute top-3 right-3 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-[10px] font-mono font-bold text-green-700 uppercase">ONLINE</span>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <Server size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-[#1e284c]">Active Directory local</h4>
                  <p className="font-mono text-[9px] text-[#45464e] font-bold mt-0.5">{adDomain}</p>
                </div>
              </div>
              
              <div className="mt-5 space-y-2 border-t border-slate-200/60 pt-4 text-[11px] text-[#45464e]">
                <div className="flex justify-between">
                  <span>Servidor LDAP:</span>
                  <span className="font-mono font-bold text-slate-800">{adServer}</span>
                </div>
                <div className="flex justify-between">
                  <span>Porta Ativa:</span>
                  <span className="font-mono font-semibold text-slate-800">{adPort} (LDAPS)</span>
                </div>
                <div className="flex justify-between">
                  <span>Filtro de Busca:</span>
                  <span className="font-medium text-slate-800 truncate max-w-[150px]" title={adBaseDN}>{adBaseDN.split(',')[0]}</span>
                </div>
              </div>
            </div>

            {/* Connection Link Status Indicator */}
            <div className="flex flex-col justify-center items-center py-4 lg:py-0 text-center">
              <div className="bg-indigo-50 border border-indigo-100 rounded-full px-4 py-1.5 text-[10px] font-mono font-bold text-indigo-700 flex items-center gap-1.5 mb-3 shadow-xs">
                <ShieldCheck size={12} />
                Conexão TLS v1.3 Segura
              </div>
              
              <div className="flex items-center gap-4 w-full px-8">
                <div className="h-[2px] bg-indigo-100 flex-1 relative hidden lg:block">
                  <div className="absolute inset-0 bg-indigo-500 w-1/2 rounded-full animate-infinite-scroll"></div>
                </div>
                <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-md animate-pulse">
                  <Workflow size={20} />
                </div>
                <div className="h-[2px] bg-indigo-100 flex-1 relative hidden lg:block">
                  <div className="absolute inset-0 bg-indigo-500 w-1/2 rounded-full animate-infinite-scroll-reverse"></div>
                </div>
              </div>
              
              <div className="mt-3">
                <p className="text-[10px] text-[#45464e] font-bold">Fluxo Bidirecional Ativo</p>
                <p className="text-[9px] text-gray-400 font-mono mt-0.5">Último Sync: {lastSyncTime}</p>
              </div>
            </div>

            {/* Cloud Microsoft Admin Node */}
            <div className="flex flex-col p-4 bg-slate-50 border border-slate-200 rounded-xl relative">
              <div className="absolute top-3 right-3 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-[10px] font-mono font-bold text-green-700 uppercase">CONECTADO</span>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <Cloud size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-[#1e284c]">Microsoft Admin Center</h4>
                  <p className="font-mono text-[9px] text-[#45464e] font-bold mt-0.5">Entra ID / M365 Cloud</p>
                </div>
              </div>
              
              <div className="mt-5 space-y-2 border-t border-slate-200/60 pt-4 text-[11px] text-[#45464e]">
                <div className="flex justify-between">
                  <span>Status da Graph API:</span>
                  <span className="font-bold text-green-700 bg-green-50 px-1.5 py-0.2 rounded border border-green-200 text-[10px]">Autorizado</span>
                </div>
                <div className="flex justify-between">
                  <span>Tenant ID:</span>
                  <span className="font-mono text-slate-800 truncate max-w-[120px]" title={msTenantId}>{msTenantId}</span>
                </div>
                <div className="flex justify-between">
                  <span>Mapeamento de Licenças:</span>
                  <span className="font-mono font-semibold text-indigo-600">4 Softwares Monitorados</span>
                </div>
              </div>
            </div>

          </div>

          {/* SYNC RUNNER SCREEN - ONLY VISIBLE WHEN RUNNING SYNC */}
          {isSyncing && (
            <div className="bg-[#0b1c30] text-gray-300 p-6 rounded-2xl border border-slate-700 font-mono text-[11px] space-y-3.5 shadow-xl">
              <div className="flex justify-between items-center text-white border-b border-slate-700 pb-3">
                <div className="flex items-center gap-2">
                  <RefreshCw size={14} className="animate-spin text-indigo-400" />
                  <span className="font-sans font-black text-sm tracking-wide">MOTOR DE SINCRONIZAÇÃO EM EXECUÇÃO</span>
                </div>
                <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-indigo-300 font-bold">
                  Passo {syncStep} de 10
                </span>
              </div>
              
              <div className="space-y-1.5 max-h-[180px] overflow-y-auto custom-scrollbar">
                {syncProgress.map((line, idx) => (
                  <div key={idx} className="flex items-start gap-2 animate-fade-in">
                    <span className="text-indigo-400 shrink-0">[{idx + 1}]</span>
                    <span className={idx === syncProgress.length - 1 ? 'text-white font-bold' : ''}>{line}</span>
                  </div>
                ))}
              </div>

              {syncStep < 10 && (
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-indigo-500 h-full transition-all duration-300"
                    style={{ width: `${syncStep * 10}%` }}
                  ></div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* VIEW TABS TOOLBAR */}
      {mode === 'integrations-only' && (
        <div className="border-b border-[#c6c6cf] flex flex-wrap gap-1">
          <button
            onClick={() => setSubTab('status')}
            className={`px-4 py-2.5 font-sans text-xs font-bold border-b-2 transition-all cursor-pointer ${
              subTab === 'status' 
                ? 'border-indigo-600 text-indigo-600 bg-white rounded-t-lg' 
                : 'border-transparent text-[#45464e] hover:text-indigo-600 hover:bg-[#eff4ff]'
            }`}
          >
            Sincronização AD ↔ Entra ID
          </button>
          <button
            onClick={() => setSubTab('config')}
            className={`px-4 py-2.5 font-sans text-xs font-bold border-b-2 transition-all cursor-pointer ${
              subTab === 'config' 
                ? 'border-indigo-600 text-indigo-600 bg-white rounded-t-lg' 
                : 'border-transparent text-[#45464e] hover:text-indigo-600 hover:bg-[#eff4ff]'
            }`}
          >
            Marketplace de Conectores
          </button>
          <button
            onClick={() => setSubTab('mapping')}
            className={`px-4 py-2.5 font-sans text-xs font-bold border-b-2 transition-all cursor-pointer ${
              subTab === 'mapping' 
                ? 'border-indigo-600 text-indigo-600 bg-white rounded-t-lg' 
                : 'border-transparent text-[#45464e] hover:text-indigo-600 hover:bg-[#eff4ff]'
            }`}
          >
            Mapeamento de Atributos & Grupos
          </button>
          <button
            onClick={() => setSubTab('governance')}
            className={`px-4 py-2.5 font-sans text-xs font-bold border-b-2 transition-all cursor-pointer ${
              subTab === 'governance' 
                ? 'border-indigo-600 text-indigo-600 bg-white rounded-t-lg' 
                : 'border-transparent text-[#45464e] hover:text-indigo-600 hover:bg-[#eff4ff]'
            }`}
          >
            Regras de Governança
          </button>
          <button
            onClick={() => setSubTab('logs')}
            className={`px-4 py-2.5 font-sans text-xs font-bold border-b-2 transition-all cursor-pointer ${
              subTab === 'logs' 
                ? 'border-indigo-600 text-indigo-600 bg-white rounded-t-lg' 
                : 'border-transparent text-[#45464e] hover:text-indigo-600 hover:bg-[#eff4ff]'
            }`}
          >
            Histórico de Auditoria
          </button>
        </div>
      )}

      {/* VIEW SUB-TAB CONTENT */}
      <div className="space-y-6">
        
        {/* TAB 0: CLOUD DASHBOARD AND LICENSES */}
        {subTab === 'cloud' && (() => {
          const isAwsConnected = companyData.licenses.some(l => l.id.startsWith('lic-aws-'));
          
          const cloudLicenses = companyData.licenses.filter(l => 
            l.id.startsWith('lic-aws-') || 
            l.softwareName.toLowerCase().includes('aws') || 
            l.softwareName.toLowerCase().includes('azure') || 
            l.softwareName.toLowerCase().includes('cloud') ||
            l.softwareName.toLowerCase().includes('rds') ||
            l.softwareName.toLowerCase().includes('ec2') ||
            l.softwareName.toLowerCase().includes('365') ||
            l.softwareName.toLowerCase().includes('figma') ||
            l.softwareName.toLowerCase().includes('zoom')
          );

          // Totals
          const totalCloudCost = cloudLicenses.reduce((sum, l) => sum + l.custoMensal, 0);
          const totalCloudSavings = cloudLicenses.reduce((sum, l) => sum + l.potencialEconomia, 0);
          const totalCloudQtyPurchased = cloudLicenses.reduce((sum, l) => sum + (l.qtyTotal || 0), 0);
          const totalCloudQtyUsed = cloudLicenses.reduce((sum, l) => sum + (l.qtyUtilizada || 0), 0);
          const totalCloudQtyIdle = cloudLicenses.reduce((sum, l) => sum + (l.qtyOciosa || 0), 0);
          const totalCloudQtyUnlicensed = cloudLicenses.reduce((sum, l) => {
            if ((l.qtyUtilizada || 0) > (l.qtyTotal || 0)) {
              return sum + ((l.qtyUtilizada || 0) - (l.qtyTotal || 0));
            }
            return sum;
          }, 0);

          const shortenCloudName = (name: string) => {
            let n = name;
            n = n.replace(/AWS EC2 Compute-Optimized \(c5\.2xlarge\)/gi, 'EC2 c5.2xlarge');
            n = n.replace(/Microsoft SQL Server Enterprise \(Azure VM\)/gi, 'SQL (Azure)');
            n = n.replace(/Red Hat Enterprise Linux \(Google Cloud\)/gi, 'RHEL (GCP)');
            n = n.replace(/Salesforce Sales Cloud Pro/gi, 'Salesforce Pro');
            n = n.replace(/Microsoft 365 E5 Enterprise/gi, 'M365 E5');
            n = n.replace(/Adobe Creative Cloud All Apps/gi, 'Adobe CC All');
            n = n.replace(/Zoom Meetings Pro Plan/gi, 'Zoom Pro');
            n = n.replace(/Figma Design Organization/gi, 'Figma Org');
            n = n.replace(/Autodesk AutoCAD 2024/gi, 'AutoCAD 2024');
            n = n.replace(' Enterprise Edition', '');
            n = n.replace(' Datacenter', '');
            if (n.length > 18) {
              n = n.substring(0, 16) + '...';
            }
            return n;
          };

          // Chart data 1: Cost per vendor/type
          const costData = cloudLicenses.map(l => ({
            name: shortenCloudName(l.softwareName),
            value: l.custoMensal,
            savings: l.potencialEconomia
          })).sort((a, b) => b.value - a.value);

          // Chart data 2: Qty comprado x usado x ocioso
          const qtyData = cloudLicenses.map(l => ({
            name: shortenCloudName(l.softwareName),
            Compradas: l.qtyTotal || 0,
            'Em Uso': l.qtyUtilizada || 0,
            Ociosas: l.qtyOciosa || 0,
            'Sem Licença': (l.qtyUtilizada || 0) > (l.qtyTotal || 0) ? (l.qtyUtilizada || 0) - (l.qtyTotal || 0) : 0
          }));

          const COLORS = ['#4f46e5', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'];

          // Cloud alerts
          const cloudAlerts = companyData.alerts.filter(a => 
            a.id.startsWith('alt-aws-') || 
            a.id.startsWith('alt-cloud-') ||
            a.softwareName.toLowerCase().includes('aws') || 
            a.softwareName.toLowerCase().includes('azure') || 
            a.softwareName.toLowerCase().includes('rds') ||
            a.softwareName.toLowerCase().includes('ec2') ||
            a.softwareName.toLowerCase().includes('gcp') ||
            a.softwareName.toLowerCase().includes('google') ||
            a.softwareName.toLowerCase().includes('salesforce') ||
            a.softwareName.toLowerCase().includes('cloud')
          );

          return (
            <div className="space-y-6 animate-fade-in">
              
              {/* CARDS GRID */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-[#c6c6cf] shadow-sm flex items-center justify-between">
                  <div>
                    <span className="block text-[9px] font-mono font-bold text-[#45464e] uppercase tracking-wider">Custo Mensal Cloud & SaaS</span>
                    <span className="text-xl font-black text-[#1e284c] block mt-1">
                      R$ {totalCloudCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium block mt-1">
                      Consolidado de todas as assinaturas
                    </span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <DollarSign size={20} />
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-[#c6c6cf] shadow-sm flex items-center justify-between">
                  <div>
                    <span className="block text-[9px] font-mono font-bold text-[#45464e] uppercase tracking-wider">Provedores Conectados</span>
                    <div className="flex flex-col gap-1 mt-1">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${isAwsConnected ? 'bg-green-500 animate-pulse' : 'bg-red-400'}`}></span>
                        AWS: {isAwsConnected ? 'Conectado' : 'Não Conectado'}
                      </span>
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        Microsoft Azure/M365: Conectado
                      </span>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Cloud size={20} />
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-[#c6c6cf] shadow-sm flex items-center justify-between">
                  <div>
                    <span className="block text-[9px] font-mono font-bold text-[#45464e] uppercase tracking-wider">Volume de Ativos Ativos</span>
                    <span className="text-xl font-black text-[#1e284c] block mt-1">
                      {totalCloudQtyUsed} ativos
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium block mt-1 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00B551]"></span> {totalCloudQtyIdle} licenças ociosas
                    </span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                    <Cpu size={20} />
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-[#c6c6cf] shadow-sm flex items-center justify-between">
                  <div>
                    <span className="block text-[9px] font-mono font-bold text-[#45464e] uppercase tracking-wider">Economia Potencial (BYOL / Ocioso)</span>
                    <span className="text-xl font-black text-green-700 block mt-1">
                      R$ {totalCloudSavings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] text-green-700 font-bold block mt-1 flex items-center gap-1">
                      <TrendingDown size={12} /> {((totalCloudSavings / (totalCloudCost || 1)) * 100).toFixed(1)}% de economia potencial
                    </span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
                    <TrendingDown size={20} />
                  </div>
                </div>
              </div>

              {/* CHARTS CONTAINER */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Cost Distribution Chart */}
                <div className="bg-white p-5 rounded-2xl border border-[#c6c6cf] shadow-sm flex flex-col justify-between h-[360px]">
                  <div>
                    <h3 className="font-headline text-sm font-black text-[#1e284c] flex items-center gap-1.5">
                      <Activity size={16} className="text-indigo-600" />
                      Distribuição do Custo Mensal por Ativo de Nuvem
                    </h3>
                    <p className="text-[11px] text-[#45464e] mt-0.5">Visão proporcional dos gastos corporativos mensais em ativos de nuvem e SaaS.</p>
                  </div>

                  <div className="flex-1 h-56 mt-4 relative">
                    {costData.length === 0 ? (
                      <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-400 font-medium">
                        Nenhum dado disponível. Conecte um conector na aba Marketplace.
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={costData}
                            cx="50%"
                            cy="45%"
                            innerRadius={50}
                            outerRadius={80}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {costData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value: any) => [`R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Custo Mensal']}
                            contentStyle={{ borderRadius: '12px', borderColor: '#c6c6cf', fontSize: '11px', fontFamily: 'sans-serif' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>

                  <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 text-[10px] border-t border-slate-100 pt-3">
                    {costData.slice(0, 5).map((entry, index) => (
                      <div key={entry.name} className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                        <span className="text-[#45464e] font-semibold">{entry.name}:</span>
                        <span className="text-slate-900 font-bold">R$ {entry.value.toLocaleString('pt-BR')}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Licenses Quantities Comparison Chart */}
                <div className="bg-white p-5 rounded-2xl border border-[#c6c6cf] shadow-sm flex flex-col justify-between h-[360px]">
                  <div>
                    <h3 className="font-headline text-sm font-black text-[#1e284c] flex items-center gap-1.5">
                      <Layers size={16} className="text-indigo-600" />
                      Status de Licenciamento (Compradas x Em Uso x Sem Licença)
                    </h3>
                    <p className="text-[11px] text-[#45464e] mt-0.5">Mapeamento de desvios e conformidade com base nas quantidades detectadas.</p>
                  </div>

                  <div className="flex-1 h-56 mt-4 relative">
                    {qtyData.length === 0 ? (
                      <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-400 font-medium">
                        Nenhum dado disponível.
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={qtyData} margin={{ top: 10, right: 10, left: -25, bottom: 45 }}>
                          <XAxis 
                            dataKey="name" 
                            stroke="#c6c6cf" 
                            tick={{ fontSize: 8, fill: '#45464e', angle: -20, textAnchor: 'end' }} 
                            interval={0} 
                            height={50}
                          />
                          <YAxis stroke="#c6c6cf" tick={{ fontSize: 9, fill: '#45464e' }} />
                          <Tooltip contentStyle={{ borderRadius: '12px', borderColor: '#c6c6cf', fontSize: '11px', fontFamily: 'sans-serif' }} />
                          <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                          <Bar dataKey="Compradas" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="Em Uso" fill="#10b981" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="Ociosas" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="Sem Licença" fill="#ef4444" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

              </div>

              {/* ACTIVE COMPLIANCE WARNINGS */}
              {cloudAlerts.length > 0 && (
                <div className="bg-[#fff9f0] p-5 rounded-2xl border border-amber-200 shadow-sm space-y-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="text-amber-600" size={18} />
                    <h3 className="font-headline text-sm font-black text-amber-900">
                      Alertas Críticos de Conformidade e Custos em Nuvem ({cloudAlerts.length})
                    </h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {cloudAlerts.map(alert => (
                      <div key={alert.id} className="p-3.5 bg-white rounded-xl border border-amber-200/60 flex items-start gap-3 justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[9px] font-bold px-1.5 py-0.5 rounded uppercase bg-amber-100 text-amber-800">
                              {alert.type === 'compliance' ? 'Conformidade BYOL' : 'Custo Excedente'}
                            </span>
                            <span className="font-mono text-[9px] text-slate-400 font-bold">{alert.date}</span>
                          </div>
                          <strong className="text-xs text-slate-800 block leading-tight">{alert.softwareName}</strong>
                          <p className="text-[11px] text-[#45464e] leading-snug">{alert.message}</p>
                        </div>

                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                          alert.severity === 'high' 
                            ? 'bg-red-50 text-[#ba1a1a] border border-red-200' 
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {alert.severity === 'high' ? 'Alto risco' : 'Médio'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* OFF-PREM CLOUD CONNECTOR ADVERTISEMENT */}
              {!isAwsConnected && (
                <div className="p-6 bg-gradient-to-r from-indigo-50 via-purple-50 to-indigo-100 border border-indigo-200 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs">
                  <div className="space-y-1">
                    <h4 className="font-headline text-sm font-black text-[#1e284c] flex items-center gap-1.5">
                      <Sparkles className="text-indigo-600 animate-pulse" size={16} />
                      Conecte seu AWS License Manager em 1 Clique
                    </h4>
                    <p className="text-xs text-[#45464e] leading-relaxed max-w-xl">
                      Obtenha visibilidade instantânea de licenças vCPU de Windows Server Datacenter, instâncias SQL Server ociosas e bancos de dados Oracle não conformes rodando em seu console Amazon EC2 ou RDS.
                    </p>
                  </div>
                  <button
                    onClick={() => setSubTab('config')}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 px-4 font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer active:scale-97 shrink-0"
                  >
                    Ir para Marketplace de Conectores
                  </button>
                </div>
              )}

              {/* DETAILED LICENSE LIST */}
              <div className="bg-white p-6 rounded-2xl border border-[#c6c6cf] shadow-sm space-y-4">
                
                {/* Search & Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="font-headline text-base font-black text-[#1e284c]">
                      Inventário Detalhado de Ativos Cloud & SaaS
                    </h3>
                    <p className="text-xs text-[#45464e] mt-0.5">Relação completa de todos os softwares e licenças auditados nas nuvens corporativas.</p>
                  </div>

                  {/* Search Bar */}
                  <div className="relative max-w-xs w-full">
                    <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={cloudSearch}
                      onChange={(e) => setCloudSearch(e.target.value)}
                      placeholder="Filtrar licenças cloud..."
                      className="w-full bg-slate-50 border border-[#c6c6cf] rounded-lg pl-9 pr-8 py-2 text-xs focus:bg-white focus:ring-1 focus:ring-indigo-500 transition-all"
                    />
                    {cloudSearch && (
                      <button 
                        onClick={() => setCloudSearch('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Table */}
                <div className="border border-[#c6c6cf]/60 rounded-xl overflow-hidden text-xs">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-[#f8f9ff] text-[10px] font-mono font-bold uppercase text-[#45464e] border-b border-[#c6c6cf]/60">
                      <tr>
                        <th className="px-4 py-3">Software / Serviço</th>
                        <th className="px-4 py-3">Provedor Cloud</th>
                        <th className="px-4 py-3">Contrato / Código</th>
                        <th className="px-4 py-3 text-center">Adquirido</th>
                        <th className="px-4 py-3 text-center">Em Uso</th>
                        <th className="px-4 py-3 text-center">Ocioso / Sem Licença</th>
                        <th className="px-4 py-3 text-right">Custo Mensal</th>
                        <th className="px-4 py-3 text-right">Economia Potencial</th>
                        <th className="px-4 py-3 text-center">Status</th>
                        <th className="px-4 py-3 text-center">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-sans">
                      {cloudLicenses
                        .filter(l => 
                          l.softwareName.toLowerCase().includes(cloudSearch.toLowerCase()) ||
                          l.vendor.toLowerCase().includes(cloudSearch.toLowerCase())
                        )
                        .map(l => {
                          const isOverUtilized = (l.qtyUtilizada || 0) > (l.qtyTotal || 0);
                          const idleOrOverageValue = isOverUtilized 
                            ? (l.qtyUtilizada || 0) - (l.qtyTotal || 0) 
                            : l.qtyOciosa || 0;

                          // Deduce cloud provider icon/name
                          let provider = 'SaaS Cloud';
                          const lowerName = l.softwareName.toLowerCase();
                          const lowerVendor = l.vendor.toLowerCase();
                          if (lowerName.includes('aws') || lowerVendor.includes('amazon')) provider = 'AWS Cloud';
                          else if (lowerName.includes('azure')) provider = 'Azure Cloud';
                          else if (lowerName.includes('google') || lowerName.includes('gcp')) provider = 'Google Cloud';
                          else if (lowerName.includes('salesforce')) provider = 'Salesforce SaaS';
                          else if (lowerName.includes('servicenow')) provider = 'ServiceNow SaaS';
                          else if (lowerName.includes('365')) provider = 'Microsoft Admin';
                          else if (lowerVendor.includes('microsoft')) provider = 'Microsoft Cloud';
                          else if (lowerVendor.includes('adobe')) provider = 'Adobe Cloud';

                          return (
                            <tr key={l.id} className="hover:bg-slate-50/50">
                              <td className="px-4 py-3">
                                <div 
                                  onClick={() => setSelectedCloudLicense(l)}
                                  className="flex items-center gap-2.5 cursor-pointer group/row select-none"
                                  title="Clique para ver detalhes"
                                >
                                  <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100/30 group-hover/row:bg-indigo-100 group-hover/row:text-indigo-700 transition-colors">
                                    {l.softwareName.toLowerCase().includes('rds') || l.softwareName.toLowerCase().includes('database') || l.softwareName.toLowerCase().includes('oracle') || l.softwareName.toLowerCase().includes('sql')
                                      ? <Database size={14} /> 
                                      : <Cloud size={14} />
                                    }
                                  </div>
                                  <div>
                                    <strong className="text-slate-800 text-[11px] block font-semibold group-hover/row:text-indigo-600 transition-colors">
                                      {l.softwareName}
                                    </strong>
                                    <span className="text-[10px] text-gray-400 font-mono mt-0.5 block group-hover/row:text-indigo-500 transition-colors">
                                      {l.vendor}
                                    </span>
                                  </div>
                                </div>
                              </td>

                              <td className="px-4 py-3">
                                <span className="font-bold text-slate-700 flex items-center gap-1">
                                  <span className={`w-1.5 h-1.5 rounded-full ${provider.includes('AWS') ? 'bg-amber-500' : provider.includes('Azure') || provider.includes('Microsoft') ? 'bg-blue-500' : 'bg-indigo-500'}`}></span>
                                  {provider}
                                </span>
                              </td>

                              <td className="px-4 py-3 font-mono text-[10px] text-slate-500">
                                {l.contractNo || 'Auto-Provisionado'}
                              </td>

                              <td className="px-4 py-3 text-center font-bold text-slate-800">
                                {l.qtyTotal || 'Ilimitado'}
                              </td>

                              <td className="px-4 py-3 text-center font-bold text-slate-800">
                                {l.qtyUtilizada || 0}
                              </td>

                              <td className="px-4 py-3 text-center">
                                {isOverUtilized ? (
                                  <span className="text-[#ba1a1a] font-bold">
                                    {idleOrOverageValue} (Sem Licença)
                                  </span>
                                ) : (
                                  <span className="text-amber-600 font-bold">
                                    {idleOrOverageValue} ociosas
                                  </span>
                                )}
                              </td>

                              <td className="px-4 py-3 text-right font-bold text-[#1e284c]">
                                R$ {l.custoMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </td>

                              <td className="px-4 py-3 text-right font-bold text-green-700">
                                R$ {l.potencialEconomia.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </td>

                              <td className="px-4 py-3 text-center">
                                <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                                  l.status === 'Em Uso' 
                                    ? 'bg-green-50 text-green-700 border-green-200' 
                                    : l.status === 'Ociosa'
                                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                                      : 'bg-red-50 text-[#ba1a1a] border border-red-200'
                                }`}>
                                  {l.status}
                                </span>
                              </td>

                              <td className="px-4 py-3 text-center">
                                <button
                                  onClick={() => alert(`Iniciando fluxo de otimização de custos e reatribuição condicional via NexusSAM Cloud-SAM para '${l.softwareName}'...`)}
                                  className="px-2.5 py-1 text-[10px] bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold rounded-lg transition-all cursor-pointer active:scale-95"
                                >
                                  Otimizar
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>

                <div className="text-[10px] text-gray-400 font-medium">
                  * A conciliação de ativos cloud é efetuada a cada 15 minutos sincronizando com APIs nativas dos provedores de nuvem.
                </div>
              </div>

            </div>
          );
        })()}

        {/* TAB 1: STATUS OVERVIEW */}
        {subTab === 'status' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Sync summary stats */}
            <div className="lg:col-span-2 space-y-6">
              
              <div className="bg-white p-6 rounded-2xl border border-[#c6c6cf] shadow-sm">
                <h3 className="font-headline text-base font-black text-[#1e284c] mb-4 flex items-center gap-2">
                  <Sliders size={18} className="text-indigo-600" />
                  Métricas Consolidadas da Integração Híbrida
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                    <span className="block text-[9px] font-mono font-bold text-[#45464e] uppercase">Contas Correlacionadas</span>
                    <span className="text-2xl font-black text-[#1e284c] mt-1.5 block">232 usuários</span>
                    <span className="text-[10px] text-green-700 font-bold block mt-1 flex items-center gap-1">
                      <Check size={12} /> 100% mapeado com AD
                    </span>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                    <span className="block text-[9px] font-mono font-bold text-[#45464e] uppercase">Licenças Provisionadas por AD</span>
                    <span className="text-2xl font-black text-indigo-600 mt-1.5 block">142 assinaturas</span>
                    <span className="text-[10px] text-[#45464e] font-medium block mt-1">
                      Atribuídas via Regras de Grupo
                    </span>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                    <span className="block text-[9px] font-mono font-bold text-[#45464e] uppercase">Economia Ativa Conquistada</span>
                    <span className="text-2xl font-black text-green-700 mt-1.5 block">R$ 5.420 / mês</span>
                    <span className="text-[10px] text-green-700 font-bold block mt-1 flex items-center gap-1">
                      <TrendingDown size={12} className="text-green-600" /> 12 ociosidades suspensas
                    </span>
                  </div>
                </div>

                <div className="mt-6 p-4.5 bg-indigo-50/50 border border-indigo-100 rounded-xl flex items-start gap-3.5">
                  <Info size={18} className="text-indigo-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-[#0b1c30] leading-relaxed">
                    <strong className="text-[#1e284c] block mb-0.5">Automação Inteligente de Desprovisionamento Ativa:</strong>
                    A integração detecta de forma contínua quando um software mapeado está no estado <strong className="text-[#1e284c]">Ociosa</strong> ou <strong className="text-[#1e284c]">Inativa</strong> no dispositivo Windows/macOS do usuário local e agenda o desprovisionamento automático da licença correspondente no Microsoft Admin para evitar gastos redundantes.
                  </div>
                </div>
              </div>

              {/* Quick instructions / features list */}
              <div className="bg-white p-6 rounded-2xl border border-[#c6c6cf] shadow-sm space-y-4">
                <h3 className="font-headline text-base font-black text-[#1e284c] flex items-center gap-2">
                  <Sparkles size={18} className="text-indigo-600" />
                  Recursos Habilitados na Sincronização Microsoft Admin
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="flex gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="w-7 h-7 rounded-full bg-green-50 text-green-700 flex items-center justify-center shrink-0 border border-green-200">
                      <Check size={14} />
                    </div>
                    <div>
                      <strong className="block text-[#1e284c]">Sincronização de Usuários</strong>
                      <span className="text-[11px] text-[#45464e] mt-0.5 block">Atualizações de nome, cargo e departamento replicadas em tempo real.</span>
                    </div>
                  </div>

                  <div className="flex gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="w-7 h-7 rounded-full bg-green-50 text-green-700 flex items-center justify-center shrink-0 border border-green-200">
                      <Check size={14} />
                    </div>
                    <div>
                      <strong className="block text-[#1e284c]">Alocação por Grupo AD</strong>
                      <span className="text-[11px] text-[#45464e] mt-0.5 block">Licenças são concedidas ou revogadas com base na inclusão de grupos de segurança.</span>
                    </div>
                  </div>

                  <div className="flex gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="w-7 h-7 rounded-full bg-green-50 text-green-700 flex items-center justify-center shrink-0 border border-green-200">
                      <Check size={14} />
                    </div>
                    <div>
                      <strong className="block text-[#1e284c]">Bloqueio de Sessão Automatizado</strong>
                      <span className="text-[11px] text-[#45464e] mt-0.5 block">Bloqueia acessos ao M365 instantaneamente se a conta AD for desativada.</span>
                    </div>
                  </div>

                  <div className="flex gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="w-7 h-7 rounded-full bg-green-50 text-green-700 flex items-center justify-center shrink-0 border border-green-200">
                      <Check size={14} />
                    </div>
                    <div>
                      <strong className="block text-[#1e284c]">Monitoramento de Custo</strong>
                      <span className="text-[11px] text-[#45464e] mt-0.5 block">Custo real de cada assinatura Entra ID consolidado nos contratos do SAM.</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Quick Actions Panel */}
            <div className="space-y-6">
              
              <div className="bg-white p-6 rounded-2xl border border-[#c6c6cf] shadow-sm space-y-4">
                <h3 className="font-headline text-base font-black text-[#1e284c] flex items-center gap-2">
                  <Lock size={16} className="text-indigo-600" />
                  Segurança e Permissões
                </h3>
                <p className="text-xs text-[#45464e] leading-relaxed">
                  As conexões são feitas de forma criptografada usando HTTPS (TLS 1.3) para as chamadas de API do Microsoft Graph e LDAPS (porta 636) para as consultas ao Active Directory corporativo.
                </p>

                <div className="space-y-2 text-[11px] font-mono bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2 text-green-700 font-bold">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                    User.Read.All (Ativo)
                  </div>
                  <div className="flex items-center gap-2 text-green-700 font-bold">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                    Directory.ReadWrite.All (Ativo)
                  </div>
                  <div className="flex items-center gap-2 text-green-700 font-bold">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                    Organization.Read.All (Ativo)
                  </div>
                  <div className="flex items-center gap-2 text-green-700 font-bold">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                    UserLicense.ReadWrite.All (Ativo)
                  </div>
                </div>

                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex gap-2 text-[11px] text-amber-800 leading-relaxed">
                  <AlertTriangle size={15} className="shrink-0 mt-0.5 text-amber-600" />
                  <span>
                    <strong>Dica de Auditoria:</strong> Certifique-se de que a conta AD de sincronização não possui permissões administrativas excessivas além de leitura no catálogo LDAP.
                  </span>
                </div>
              </div>

              {/* Connection Diagnostics Card */}
              <div className="bg-white p-6 rounded-2xl border border-[#c6c6cf] shadow-sm space-y-3.5">
                <h3 className="font-headline text-base font-black text-[#1e284c] flex items-center gap-2">
                  <UserCheck size={18} className="text-indigo-600" />
                  Status dos Conectores
                </h3>

                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="font-bold text-slate-700">LDAP Conector</span>
                    <span className="font-mono text-[10px] bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-bold">Ativo & Online</span>
                  </div>

                  <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="font-bold text-slate-700">Graph API Endpoint</span>
                    <span className="font-mono text-[10px] bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-bold">Ativo & Autorizado</span>
                  </div>

                  <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="font-bold text-slate-700">SAM Endpoint Agent</span>
                    <span className="font-mono text-[10px] bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-bold">232 Sincronizados</span>
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* TAB 2: ACCESS CONFIGURATIONS (CONNECTOR MARKETPLACE) */}
        {subTab === 'config' && (
          <div className="space-y-6">
            
            {/* Marketplace Header and Filters */}
            <div className="bg-white p-6 rounded-2xl border border-[#c6c6cf] shadow-sm space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="font-headline text-lg font-black text-[#1e284c] flex items-center gap-2">
                    <Workflow size={20} className="text-indigo-600" />
                    Marketplace de Conectores & Soluções
                  </h3>
                  <p className="text-xs text-[#45464e] mt-1">
                    Conecte o SAM corporativo com as melhores soluções globais de diretório, nuvem, segurança e backup para gerenciar licenças em tempo real.
                  </p>
                </div>

                {/* Search Bar */}
                <div className="relative max-w-sm w-full">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#45464e]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar conector..."
                    className="w-full bg-slate-50 border border-[#c6c6cf] rounded-xl pl-10 pr-4 py-2 text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Category Filters */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100 pt-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-500 mr-2 flex items-center gap-1">
                    <SlidersHorizontal size={12} />
                    Filtrar por:
                  </span>
                  {['Todos', 'Diretório', 'Produtividade', 'Cloud', 'Backup', 'Segurança'].map(category => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                        selectedCategory === category
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setShowOnlyConnected(!showOnlyConnected)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer select-none shrink-0 ${
                    showOnlyConnected 
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-700 shadow-xs' 
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${showOnlyConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                  Apenas Conectados
                </button>
              </div>
            </div>

            {/* Grid of Connectors */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {connectors
                .filter(c => {
                  const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                        c.description.toLowerCase().includes(searchQuery.toLowerCase());
                  const matchesCategory = selectedCategory === 'Todos' || c.category === selectedCategory;
                  const matchesConnected = !showOnlyConnected || c.status === 'Conectado';
                  return matchesSearch && matchesCategory && matchesConnected;
                })
                .map(c => {
                  const isConnected = c.status === 'Conectado';
                  return (
                    <div 
                      key={c.id} 
                      className={`bg-white rounded-2xl border transition-all duration-300 hover:shadow-md flex flex-col justify-between overflow-hidden ${
                        isConnected 
                          ? 'border-indigo-300 ring-2 ring-indigo-500/5' 
                          : 'border-[#c6c6cf] hover:border-slate-400'
                      }`}
                    >
                      <div className="p-5 space-y-4">
                        {/* Header of Card */}
                        <div className="flex justify-between items-start">
                          <span className="text-[10px] bg-slate-100 border border-slate-200 font-bold px-2 py-0.5 rounded text-slate-600">
                            {c.category}
                          </span>
                          
                          <span className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded-full border ${
                            isConnected
                              ? 'bg-green-50 text-green-700 border-green-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {c.status}
                          </span>
                        </div>

                        {/* Title and Icon */}
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shadow-xs shrink-0">
                            {getConnectorIcon(c.id)}
                          </div>
                          <div>
                            <h4 className="font-headline text-sm font-black text-[#1e284c] tracking-tight">{c.name}</h4>
                            <p className="text-[10px] font-mono text-gray-400 font-semibold mt-0.5">{c.tech}</p>
                          </div>
                        </div>

                        {/* Description */}
                        <p className="text-xs text-[#45464e] leading-relaxed line-clamp-3">
                          {c.description}
                        </p>
                      </div>

                      {/* Footer Actions of Card */}
                      <div className="bg-slate-50 px-5 py-3 border-t border-slate-100 flex justify-between items-center text-xs">
                        <span className="text-[10px] text-gray-400 font-medium">
                          Sync: <span className="font-mono font-bold text-gray-600">{c.lastSync}</span>
                        </span>
                        
                        <div className="flex gap-2">
                          {isConnected && (
                            <button
                              onClick={() => handleDisconnectConnector(c.id)}
                              className="px-3 py-1.5 rounded-lg font-bold text-[11px] bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 transition-all cursor-pointer active:scale-97"
                            >
                              Desconectar
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedConnectorId(c.id)}
                            className={`px-3 py-1.5 rounded-lg font-bold text-[11px] transition-all cursor-pointer active:scale-97 ${
                              isConnected
                                ? 'bg-slate-200/80 hover:bg-slate-200 text-slate-800 border border-slate-300'
                                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                            }`}
                          >
                            {isConnected ? 'Configurar' : 'Conectar'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* CONNECTOR DETAIL CONFIGURATION DRAWER/MODAL POPUP */}
            {selectedConnectorId && (() => {
              const selectedConnector = connectors.find(c => c.id === selectedConnectorId);
              if (!selectedConnector) return null;
              return (
                <div className="fixed inset-0 z-50 bg-[#0b1c30]/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
                  <div className="bg-white rounded-2xl border border-[#c6c6cf] shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto flex flex-col justify-between">
                    
                    {/* Header */}
                    <div className="p-6 border-b border-slate-100 flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                          {getConnectorIcon(selectedConnector.id)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-headline text-base font-black text-[#1e284c] tracking-tight">{selectedConnector.name}</h3>
                            <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded font-bold">{selectedConnector.category}</span>
                          </div>
                          <p className="text-[11px] font-mono text-gray-400 mt-0.5">Tecnologia: {selectedConnector.tech}</p>
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => setSelectedConnectorId(null)}
                        className="text-gray-400 hover:text-gray-600 bg-slate-50 hover:bg-slate-100 p-1.5 rounded-lg transition-all cursor-pointer"
                      >
                        <X size={18} />
                      </button>
                    </div>

                    {/* Form content depending on selected connector */}
                    <div className="p-6 space-y-5 flex-1">
                      <p className="text-xs text-[#45464e] leading-relaxed">
                        Defina as credenciais seguras e parâmetros de rede para o conector estabelecer a ponte automática de auditoria. Todas as chaves são transmitidas sob criptografia ponta a ponta e salvas localmente.
                      </p>

                      {/* ACTIVE DIRECTORY FORM */}
                      {selectedConnector.id === 'active_directory' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                          <div className="space-y-1.5">
                            <label className="font-bold text-slate-700 block">Domínio Corporativo AD</label>
                            <input 
                              type="text" 
                              value={adDomain} 
                              onChange={(e) => setAdDomain(e.target.value)}
                              className="w-full bg-slate-50 border border-[#c6c6cf] rounded-lg p-2.5 focus:bg-white focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
                              placeholder="ex: empresa.local"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="font-bold text-slate-700 block">Servidor Domain Controller</label>
                            <input 
                              type="text" 
                              value={adServer} 
                              onChange={(e) => setAdServer(e.target.value)}
                              className="w-full bg-slate-50 border border-[#c6c6cf] rounded-lg p-2.5 focus:bg-white focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
                              placeholder="ex: dc01.empresa.local"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="font-bold text-slate-700 block">Porta LDAP</label>
                            <input 
                              type="text" 
                              value={adPort} 
                              onChange={(e) => setAdPort(e.target.value)}
                              className="w-full bg-slate-50 border border-[#c6c6cf] rounded-lg p-2.5 focus:bg-white focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
                              placeholder="ex: 389 ou 636"
                            />
                          </div>

                          <div className="space-y-1.5 flex items-end">
                            <label className="flex items-center gap-2.5 p-2 bg-slate-50 rounded-lg border border-[#c6c6cf]/60 w-full cursor-pointer hover:bg-slate-100 select-none">
                              <input 
                                type="checkbox" 
                                checked={adSSL} 
                                onChange={(e) => setAdSSL(e.target.checked)}
                                className="h-4 w-4 text-indigo-600 rounded focus:ring-indigo-500"
                              />
                              <span className="font-bold text-slate-700 text-[11px]">Requerer SSL (LDAPS)</span>
                            </label>
                          </div>

                          <div className="space-y-1.5 sm:col-span-2">
                            <label className="font-bold text-slate-700 block">Base Distinguished Name (Search Base DN)</label>
                            <input 
                              type="text" 
                              value={adBaseDN} 
                              onChange={(e) => setAdBaseDN(e.target.value)}
                              className="w-full bg-slate-50 border border-[#c6c6cf] rounded-lg p-2.5 focus:bg-white focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
                              placeholder="ex: OU=Users,DC=empresa,DC=local"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="font-bold text-slate-700 block">Usuário de Sincronização (Service Account)</label>
                            <input 
                              type="text" 
                              value={adUser} 
                              onChange={(e) => setAdUser(e.target.value)}
                              className="w-full bg-slate-50 border border-[#c6c6cf] rounded-lg p-2.5 focus:bg-white focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
                              placeholder="ex: srv-sam@empresa.local"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="font-bold text-slate-700 block">Senha da Service Account</label>
                            <input 
                              type="password" 
                              value={adPassword} 
                              onChange={(e) => setAdPassword(e.target.value)}
                              className="w-full bg-slate-50 border border-[#c6c6cf] rounded-lg p-2.5 focus:bg-white focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
                            />
                          </div>
                        </div>
                      )}

                      {/* MICROSOFT GRAPH FORM */}
                      {selectedConnector.id === 'microsoft_admin' && (
                        <div className="space-y-4 text-xs">
                          <div className="space-y-1.5">
                            <label className="font-bold text-slate-700 block">Directory (Tenant) ID</label>
                            <input 
                              type="text" 
                              value={msTenantId} 
                              onChange={(e) => setMsTenantId(e.target.value)}
                              className="w-full bg-slate-50 border border-[#c6c6cf] rounded-lg p-2.5 focus:bg-white focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
                              placeholder="ex: 00000000-0000-0000-0000-000000000000"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="font-bold text-slate-700 block">Application (Client) ID</label>
                            <input 
                              type="text" 
                              value={msClientId} 
                              onChange={(e) => setMsClientId(e.target.value)}
                              className="w-full bg-slate-50 border border-[#c6c6cf] rounded-lg p-2.5 focus:bg-white focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
                              placeholder="ex: 00000000-0000-0000-0000-000000000000"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="font-bold text-slate-700 block">Client Secret da Credencial de Aplicativo</label>
                            <input 
                              type="password" 
                              value={msClientSecret} 
                              onChange={(e) => setMsClientSecret(e.target.value)}
                              className="w-full bg-slate-50 border border-[#c6c6cf] rounded-lg p-2.5 focus:bg-white focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
                            />
                          </div>

                          <div className="p-3.5 bg-indigo-50 rounded-xl border border-indigo-100 flex items-start gap-2.5 text-[11px] leading-relaxed text-indigo-900">
                            <ShieldCheck size={16} className="text-indigo-600 mt-0.5 shrink-0" />
                            <span>
                              <strong>Integração via Graph:</strong> Garanta as permissões do escopo <code className="font-mono text-[9px] bg-indigo-100 px-1 py-0.2 rounded font-bold">UserLicense.ReadWrite.All</code> no painel Azure AD para suspender licenças ociosas.
                            </span>
                          </div>
                        </div>
                      )}

                      {/* AWS LICENSE MANAGER FORM */}
                      {selectedConnector.id === 'aws' && (
                        <div className="space-y-4 text-xs">
                          <div className="space-y-1.5">
                            <label className="font-bold text-slate-700 block">AWS Access Key ID</label>
                            <input 
                              type="text" 
                              value={awsAccessKey} 
                              onChange={(e) => setAwsAccessKey(e.target.value)}
                              className="w-full bg-slate-50 border border-[#c6c6cf] rounded-lg p-2.5 focus:bg-white focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
                              placeholder="ex: AKIAIOSFODNN7EXAMPLE"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="font-bold text-slate-700 block">AWS Secret Access Key</label>
                            <input 
                              type="password" 
                              value={awsSecretKey} 
                              onChange={(e) => setAwsSecretKey(e.target.value)}
                              className="w-full bg-slate-50 border border-[#c6c6cf] rounded-lg p-2.5 focus:bg-white focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="font-bold text-slate-700 block">Região Padrão AWS</label>
                            <select 
                              value={awsRegion} 
                              onChange={(e) => setAwsRegion(e.target.value)}
                              className="w-full bg-slate-50 border border-[#c6c6cf] rounded-lg p-2.5 focus:bg-white focus:ring-2 focus:ring-indigo-500 text-xs font-semibold"
                            >
                              <option value="us-east-1">us-east-1 (N. Virginia)</option>
                              <option value="us-west-2">us-west-2 (Oregon)</option>
                              <option value="sa-east-1">sa-east-1 (São Paulo)</option>
                              <option value="eu-west-1">eu-west-1 (Ireland)</option>
                            </select>
                          </div>

                          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-2 text-[11px] leading-relaxed text-amber-900">
                            <Info size={16} className="text-amber-600 mt-0.5 shrink-0" />
                            <span>
                              <strong>Permissões Necessárias:</strong> A IAM policy deve incluir permissões de leitura em <code className="font-mono text-[9px]">license-manager:*</code> e <code className="font-mono text-[9px]">ec2:DescribeInstances</code>.
                            </span>
                          </div>
                        </div>
                      )}

                      {/* VEEAM BACKUP & REPLICATION FORM */}
                      {selectedConnector.id === 'veeam' && (
                        <div className="space-y-4 text-xs">
                          <div className="space-y-1.5">
                            <label className="font-bold text-slate-700 block">URL do Servidor de Backup Veeam</label>
                            <input 
                              type="text" 
                              value={veeamUrl} 
                              onChange={(e) => setVeeamUrl(e.target.value)}
                              className="w-full bg-slate-50 border border-[#c6c6cf] rounded-lg p-2.5 focus:bg-white focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
                              placeholder="ex: https://veeam-server.empresa.local:8443"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="font-bold text-slate-700 block">Usuário de Serviço</label>
                              <input 
                                type="text" 
                                value={veeamUser} 
                                onChange={(e) => setVeeamUser(e.target.value)}
                                className="w-full bg-slate-50 border border-[#c6c6cf] rounded-lg p-2.5 focus:bg-white focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
                              />
                            </div>

                            <div className="space-y-1.5">
                              <label className="font-bold text-slate-700 block">Senha do Usuário</label>
                              <input 
                                type="password" 
                                value={veeamPassword} 
                                onChange={(e) => setVeeamPassword(e.target.value)}
                                className="w-full bg-slate-50 border border-[#c6c6cf] rounded-lg p-2.5 focus:bg-white focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
                              />
                            </div>
                          </div>

                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-2 text-[11px] leading-relaxed text-slate-700">
                            <Sliders size={16} className="text-indigo-600 mt-0.5 shrink-0" />
                            <span>
                              <strong>API REST v1.2:</strong> Conectividade direta com o Veeam Backup Enterprise Manager para auditoria de workloads protegidos.
                            </span>
                          </div>
                        </div>
                      )}

                      {/* RED HAT FORM */}
                      {selectedConnector.id === 'redhat' && (
                        <div className="space-y-4 text-xs">
                          <div className="space-y-1.5">
                            <label className="font-bold text-slate-700 block">Red Hat Subscription Organization ID</label>
                            <input 
                              type="text" 
                              value={rhOrgId} 
                              onChange={(e) => setRhOrgId(e.target.value)}
                              className="w-full bg-slate-50 border border-[#c6c6cf] rounded-lg p-2.5 focus:bg-white focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
                              placeholder="ex: 12409543"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="font-bold text-slate-700 block">Chave de Ativação (Activation Key)</label>
                            <input 
                              type="text" 
                              value={rhActivationKey} 
                              onChange={(e) => setRhActivationKey(e.target.value)}
                              className="w-full bg-slate-50 border border-[#c6c6cf] rounded-lg p-2.5 focus:bg-white focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
                              placeholder="ex: rh-key-prod"
                            />
                          </div>

                          <div className="p-3 bg-red-50 rounded-xl border border-red-100 flex items-start gap-2 text-[11px] leading-relaxed text-red-900">
                            <Globe size={16} className="text-red-600 mt-0.5 shrink-0" />
                            <span>
                              <strong>Conexão Red Hat Customer Portal:</strong> Permite consultar o balanço de assinaturas virtuais e físicas de RHEL / OpenShift para evitar sobredimensionamento de núcleos (Cores).
                            </span>
                          </div>
                        </div>
                      )}

                      {/* SYMANTEC ENDPOINT SECURITY FORM */}
                      {selectedConnector.id === 'symantec' && (
                        <div className="space-y-4 text-xs">
                          <div className="space-y-1.5">
                            <label className="font-bold text-slate-700 block">URL do Console Symantec SEPM</label>
                            <input 
                              type="text" 
                              value={symantecUrl} 
                              onChange={(e) => setSymantecUrl(e.target.value)}
                              className="w-full bg-slate-50 border border-[#c6c6cf] rounded-lg p-2.5 focus:bg-white focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
                              placeholder="ex: https://symantec-console.empresa.local:9090"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="font-bold text-slate-700 block">SEPM Client ID</label>
                              <input 
                                type="text" 
                                value={symantecClientId} 
                                onChange={(e) => setSymantecClientId(e.target.value)}
                                className="w-full bg-slate-50 border border-[#c6c6cf] rounded-lg p-2.5 focus:bg-white focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
                              />
                            </div>

                            <div className="space-y-1.5">
                              <label className="font-bold text-slate-700 block">SEPM Client Secret</label>
                              <input 
                                type="password" 
                                value={symantecClientSecret} 
                                onChange={(e) => setSymantecClientSecret(e.target.value)}
                                className="w-full bg-slate-50 border border-[#c6c6cf] rounded-lg p-2.5 focus:bg-white focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
                              />
                            </div>
                          </div>

                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-2 text-[11px] leading-relaxed text-slate-700">
                            <Key size={16} className="text-indigo-600 mt-0.5 shrink-0" />
                            <span>
                              <strong>Web Services API:</strong> Coleta a quantidade de agentes corporativos licenciados ativos e que estão se comunicando com o console gerenciador central.
                            </span>
                          </div>
                        </div>
                      )}

                      {/* KASPERSKY FORM */}
                      {selectedConnector.id === 'kaspersky' && (
                        <div className="space-y-4 text-xs">
                          <div className="space-y-1.5">
                            <label className="font-bold text-slate-700 block">Kaspersky Security Center Server (FQDN / IP)</label>
                            <input 
                              type="text" 
                              value={kasperskyServer} 
                              onChange={(e) => setKasperskyServer(e.target.value)}
                              className="w-full bg-slate-50 border border-[#c6c6cf] rounded-lg p-2.5 focus:bg-white focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
                              placeholder="ex: ksc.b3ware.local"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="font-bold text-slate-700 block">Admin API Key</label>
                            <input 
                              type="password" 
                              value={kasperskyApiKey} 
                              onChange={(e) => setKasperskyApiKey(e.target.value)}
                              className="w-full bg-slate-50 border border-[#c6c6cf] rounded-lg p-2.5 focus:bg-white focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
                            />
                          </div>

                          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex items-start gap-2 text-[11px] leading-relaxed text-emerald-900">
                            <ShieldCheck size={16} className="text-emerald-600 mt-0.5 shrink-0" />
                            <span>
                              <strong>KSC OpenAPI:</strong> Monitoramento contínuo de chaves antivírus aplicadas e status de updates de vírus nos servidores corporativos locais.
                            </span>
                          </div>
                        </div>
                      )}

                    </div>

                    {/* Footer Actions */}
                    <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-between gap-3 text-xs">
                      <button
                        type="button"
                        onClick={() => handleTestConnectorConnection(selectedConnector.id)}
                        className="px-4 py-2.5 bg-white hover:bg-slate-50 border border-[#c6c6cf] text-slate-800 rounded-xl font-bold cursor-pointer transition-all active:scale-97"
                      >
                        Testar Comunicação
                      </button>
                      
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedConnectorId(null)}
                          className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer transition-all"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveConnectorConfig(selectedConnector.id)}
                          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold cursor-pointer transition-all shadow-sm active:scale-97"
                        >
                          Salvar e Ativar
                        </button>
                      </div>
                    </div>

                  </div>
                </div>
              );
            })()}

          </div>
        )}

        {/* TAB 3: ATTRIBUTE & GROUP MAPPING */}
        {subTab === 'mapping' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Attribute Mapping */}
            <div className="bg-white p-6 rounded-2xl border border-[#c6c6cf] shadow-sm space-y-5">
              <div>
                <h3 className="font-headline text-base font-black text-[#1e284c] flex items-center gap-2">
                  <Sliders size={18} className="text-indigo-600" />
                  Mapeamento de Atributos de Contas de Usuários
                </h3>
                <p className="text-xs text-[#45464e] mt-1">
                  Associe campos do esquema local do Active Directory às propriedades do usuário correspondentes no Microsoft Graph (Entra ID).
                </p>
              </div>

              {/* Add Mapping Form */}
              <form onSubmit={handleAddMapping} className="p-4 bg-slate-50 border border-slate-200/60 rounded-xl grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 block">Atributo Active Directory (LDAP)</label>
                  <input 
                    type="text" 
                    value={newAdField}
                    onChange={(e) => setNewAdField(e.target.value)}
                    placeholder="ex: physicalDeliveryOffice"
                    className="w-full bg-white border border-[#c6c6cf] rounded-lg p-2 text-xs font-mono focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 block">Atributo Microsoft Graph</label>
                  <input 
                    type="text" 
                    value={newMsField}
                    onChange={(e) => setNewMsField(e.target.value)}
                    placeholder="ex: officeLocation"
                    className="w-full bg-white border border-[#c6c6cf] rounded-lg p-2 text-xs font-mono focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-[#1e284c] hover:bg-[#343e63] text-white py-2 px-3 font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 h-10 transition-all cursor-pointer"
                >
                  <Plus size={14} /> Mapear Campo
                </button>
              </form>

              {/* Table of active mappings */}
              <div className="border border-[#c6c6cf]/60 rounded-lg overflow-hidden text-xs">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-[#f8f9ff] text-[10px] font-mono font-bold uppercase text-[#45464e] border-b border-[#c6c6cf]/60">
                    <tr>
                      <th className="px-4 py-2.5">Atributo AD local</th>
                      <th className="px-4 py-2.5 text-center">
                        <ArrowRight size={14} className="inline text-slate-400" />
                      </th>
                      <th className="px-4 py-2.5">Propriedade Microsoft Cloud</th>
                      <th className="px-4 py-2.5 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {mappings.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-2.5 text-[#1e284c] font-semibold">{m.adField}</td>
                        <td className="px-4 py-2.5 text-center text-slate-400">↔</td>
                        <td className="px-4 py-2.5 text-slate-700 font-medium">{m.msField}</td>
                        <td className="px-4 py-2.5 text-center">
                          <button 
                            type="button"
                            onClick={() => handleRemoveMapping(m.id)}
                            className="p-1 text-slate-400 hover:text-[#ba1a1a] rounded hover:bg-red-50 transition-colors cursor-pointer"
                            title="Remover Mapeamento"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* AD Group to Microsoft License rules */}
            <div className="bg-white p-6 rounded-2xl border border-[#c6c6cf] shadow-sm space-y-5">
              <div>
                <h3 className="font-headline text-base font-black text-[#1e284c] flex items-center gap-2">
                  <Database size={18} className="text-indigo-600" />
                  Atribuição de Licenças M365 Baseada em Grupos AD
                </h3>
                <p className="text-xs text-[#45464e] mt-1">
                  Usuários adicionados aos seguintes grupos de segurança do Active Directory local terão as respectivas assinaturas provisionadas de forma autônoma no Microsoft Admin.
                </p>
              </div>

              {/* Add Rule Form */}
              <form onSubmit={handleAddRule} className="p-4 bg-slate-50 border border-slate-200/60 rounded-xl grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 block">Grupo de Segurança AD (GG_)</label>
                  <input 
                    type="text" 
                    value={newAdGroup}
                    onChange={(e) => setNewAdGroup(e.target.value)}
                    placeholder="ex: GG_M365_E3"
                    className="w-full bg-white border border-[#c6c6cf] rounded-lg p-2 text-xs font-mono focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 block">Licença Microsoft Admin</label>
                  <select 
                    value={newMsLicense}
                    onChange={(e) => setNewMsLicense(e.target.value)}
                    className="w-full bg-white border border-[#c6c6cf] rounded-lg p-2 text-xs font-sans focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="Microsoft 365 E5">Microsoft 365 E5</option>
                    <option value="Microsoft 365 E3">Microsoft 365 E3</option>
                    <option value="Office 365 Business Premium">Office 365 Business Premium</option>
                    <option value="Adobe Creative Cloud">Adobe Creative Cloud</option>
                    <option value="AutoCAD Premium">AutoCAD Premium</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-3 font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 h-10 transition-all cursor-pointer"
                >
                  <Plus size={14} /> Ativar Regra
                </button>
              </form>

              {/* Table of Group-based rules */}
              <div className="border border-[#c6c6cf]/60 rounded-lg overflow-hidden text-xs">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-[#f8f9ff] text-[10px] font-mono font-bold uppercase text-[#45464e] border-b border-[#c6c6cf]/60">
                    <tr>
                      <th className="px-4 py-2.5">Grupo do Active Directory local</th>
                      <th className="px-4 py-2.5 text-center">Ação</th>
                      <th className="px-4 py-2.5">Licença Cloud Associada</th>
                      <th className="px-4 py-2.5 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {licenseRules.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-2.5 font-mono text-[11px] text-[#1e284c] font-semibold">{r.adGroup}</td>
                        <td className="px-4 py-2.5 text-center">
                          <span className="inline-block px-2 py-0.5 rounded text-[9px] font-extrabold bg-green-50 text-green-700 border border-green-100 uppercase tracking-wider">
                            {r.action}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 font-bold text-slate-700">{r.msLicense}</td>
                        <td className="px-4 py-2.5 text-center">
                          <button 
                            type="button"
                            onClick={() => handleRemoveRule(r.id)}
                            className="p-1 text-slate-400 hover:text-[#ba1a1a] rounded hover:bg-red-50 transition-colors cursor-pointer"
                            title="Desativar Regra"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* TAB 4: GOVERNANCE & COMPLIANCE POLICIES */}
        {subTab === 'governance' && (
          <div className="bg-white p-6 rounded-2xl border border-[#c6c6cf] shadow-sm space-y-6">
            <div>
              <h3 className="font-headline text-base font-black text-[#1e284c] flex items-center gap-2">
                <ShieldCheck size={18} className="text-green-600" />
                Diretrizes de Governança & Políticas Automatizadas
              </h3>
              <p className="text-xs text-[#45464e] mt-1">
                Configure os gatilhos autônomos e limites de segurança que o conector Microsoft Admin executará de acordo com o inventário SAM gerado nos endpoints da empresa.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              
              {/* Card 1: Desprovisionamento Automatizado */}
              <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-[#1e284c] text-sm">Desprovisionamento Autônomo de Licenças Ociosas</h4>
                    <p className="text-[11px] text-[#45464e] mt-0.5">Revoga ou reduz a assinatura se o software estiver ocioso no endpoint físico.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={autoRevokeIdle} 
                      onChange={(e) => setAutoRevokeIdle(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                {autoRevokeIdle && (
                  <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-2 animate-fade-in">
                    <label className="font-semibold text-slate-700 block">Tempo limite de ociosidade permitido (Dias):</label>
                    <div className="flex items-center gap-3">
                      <input 
                        type="number" 
                        value={idleDays} 
                        onChange={(e) => setIdleDays(Number(e.target.value))}
                        className="bg-slate-50 border border-[#c6c6cf] rounded-lg p-2 font-mono text-xs w-20 text-center focus:bg-white focus:ring-2 focus:ring-indigo-500"
                        min="7"
                        max="180"
                      />
                      <span className="text-[#45464e] font-medium">Dias inativo no SAM Agent antes de liberar a licença</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Card 2: Bloqueio de Login Híbrido */}
              <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-[#1e284c] text-sm">Bloqueio de Sessão por Desativação AD</h4>
                    <p className="text-[11px] text-[#45464e] mt-0.5">Bloqueia instantaneamente o login na nuvem do M365 se a conta AD local for desativada.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={blockOnAdDisable} 
                      onChange={(e) => setBlockOnAdDisable(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                <div className="p-3.5 bg-slate-100 rounded-lg border border-slate-200 text-[10px] text-indigo-800 leading-normal font-mono">
                  🔒 GATILHO ATIVO: LDAP 'userAccountControl' (Bit 2 == true) ➔ Entra ID 'accountEnabled = false' & Revogação de Refresh Tokens.
                </div>
              </div>

              {/* Card 3: Notificações e Alertas Financeiros */}
              <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-[#1e284c] text-sm">Notificar Economias no Painel de Alertas</h4>
                    <p className="text-[11px] text-[#45464e] mt-0.5">Envia um alerta de governança do tipo "Financeiro" assim que as licenças forem liberadas de forma automática.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={notifyOnSavings} 
                      onChange={(e) => setNotifyOnSavings(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
              </div>

              {/* Card 4: Double Check MFA para contas AD sincronizadas */}
              <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-[#1e284c] text-sm">Exigir MFA condicional para usuários AD</h4>
                    <p className="text-[11px] text-[#45464e] mt-0.5">Força o registro de autenticação multifator no Entra ID para contas mapeadas pelo LDAP corporativo.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={enforceMfaForAdUsers} 
                      onChange={(e) => setEnforceMfaForAdUsers(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
              </div>

              {/* Card 5: Write-back de informações no AD local */}
              <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-4 md:col-span-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-[#1e284c] text-sm">Write-back de Informação de Licenciamento no AD local</h4>
                    <p className="text-[11px] text-[#45464e] mt-0.5">Grava no campo de notas do objeto de usuário no Active Directory qual licença M365 ele possui ativa.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={writebackAdLicense} 
                      onChange={(e) => setWritebackAdLicense(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
              </div>

            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="button"
                onClick={() => alert('Políticas de governança salvas com sucesso no banco de dados corporativo do SAM!')}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm cursor-pointer transition-all active:scale-97"
              >
                Salvar Políticas de Governança
              </button>
            </div>
          </div>
        )}

        {/* TAB 5: AUDIT LOGS */}
        {subTab === 'logs' && (
          <div className="bg-white p-6 rounded-2xl border border-[#c6c6cf] shadow-sm space-y-5">
            <div>
              <h3 className="font-headline text-base font-black text-[#1e284c] flex items-center gap-2">
                <FileText size={18} className="text-indigo-600" />
                Histórico de Execuções e Auditoria de Sincronizações
              </h3>
              <p className="text-xs text-[#45464e] mt-1">
                Abaixo estão registradas todas as varreduras, conexões e automações de licenças executadas entre o AD local e a nuvem Microsoft Admin.
              </p>
            </div>

            <div className="border border-[#c6c6cf]/60 rounded-lg overflow-hidden text-xs">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#f8f9ff] text-[10px] font-mono font-bold uppercase text-[#45464e] border-b border-[#c6c6cf]/60">
                  <tr>
                    <th className="px-4 py-3">ID Execução</th>
                    <th className="px-4 py-3">Data e Hora</th>
                    <th className="px-4 py-3">Tipo de Varredura</th>
                    <th className="px-4 py-3 text-center">Contas Lidas</th>
                    <th className="px-4 py-3 text-center">Atribuições Cloud</th>
                    <th className="px-4 py-3 text-center">Ociosidades Liberadas</th>
                    <th className="px-4 py-3 text-center">Erros/Conflitos</th>
                    <th className="px-4 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {syncLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 text-indigo-600 font-bold">#{log.id}</td>
                      <td className="px-4 py-3 text-slate-700">{log.date}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wide border ${
                          log.type === 'Completa' 
                            ? 'bg-purple-50 text-purple-700 border-purple-200' 
                            : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                        }`}>
                          {log.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-slate-800">{log.usersMatched}</td>
                      <td className="px-4 py-3 text-center text-green-700 font-bold">+{log.licensesAssigned}</td>
                      <td className="px-4 py-3 text-center text-amber-600 font-bold">-{log.licensesReclaimed}</td>
                      <td className="px-4 py-3 text-center font-bold text-red-600">{log.conflicts}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wide ${
                          log.status.includes('Sucesso') 
                            ? 'bg-green-50 text-green-700 border border-green-200' 
                            : log.status.includes('Conexão')
                              ? 'bg-red-50 text-[#ba1a1a] border border-red-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="text-[10px] text-gray-400 font-medium text-right leading-none">
              * Histórico retido por até 180 dias de acordo com os critérios de compliance ISO 19770.
            </div>
          </div>
        )}

      </div>

      {/* Cloud License Detail Drawer */}
      {selectedCloudLicense && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-[#0b1c30]/40 backdrop-blur-xs transition-opacity" 
            onClick={() => setSelectedCloudLicense(null)}
          />

          {/* Panel */}
          <div className="relative w-full max-w-lg h-full bg-[#f8f9ff] border-l border-[#c6c6cf] shadow-2xl flex flex-col z-10 animate-slide-in">
            
            {/* Drawer Header */}
            <div className="p-6 border-b border-[#c6c6cf] flex justify-between items-start bg-white">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                    selectedCloudLicense.status === 'Em Uso' 
                      ? 'bg-green-50 text-green-700 border-green-200' 
                      : selectedCloudLicense.status === 'Ociosa'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-red-50 text-red-700 border-red-200'
                  }`}>
                    {selectedCloudLicense.status}
                  </span>
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono font-bold">
                    ID: {selectedCloudLicense.id}
                  </span>
                </div>
                <h3 className="font-headline text-md font-bold text-[#1e284c] leading-tight">
                  {selectedCloudLicense.softwareName}
                </h3>
                <p className="text-xs text-gray-400 font-medium">
                  Provedor: <span className="font-bold text-slate-700">{selectedCloudLicense.vendor}</span> • Contrato: <span className="font-mono font-bold text-slate-700">{selectedCloudLicense.contractNo || 'Auto-Provisionado'}</span>
                </p>
              </div>
              
              <button 
                onClick={() => setSelectedCloudLicense(null)}
                className="p-1.5 hover:bg-[#eff4ff] rounded-full transition-colors cursor-pointer text-[#45464e]"
              >
                <X size={18} />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar text-xs">
              
              {/* Cost & Savings Summary Box */}
              <div className="grid grid-cols-2 gap-4 bg-white p-4.5 rounded-xl border border-[#c6c6cf] shadow-sm">
                <div>
                  <span className="text-[9px] font-mono font-bold text-[#45464e] uppercase block">Custo Mensal</span>
                  <span className="text-lg font-black text-[#1e284c] mt-1 block">
                    R$ {selectedCloudLicense.custoMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-[10px] text-gray-400 block mt-0.5">
                    R$ {(selectedCloudLicense.custoMensal * 12).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} / ano
                  </span>
                </div>
                <div className="border-l border-slate-100 pl-4">
                  <span className="text-[9px] font-mono font-bold text-[#45464e] uppercase block">Potencial de Economia</span>
                  <span className={`text-lg font-black mt-1 block ${selectedCloudLicense.potencialEconomia > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                    R$ {selectedCloudLicense.potencialEconomia.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                  {selectedCloudLicense.potencialEconomia > 0 ? (
                    <span className="text-[10px] text-green-700 font-bold block mt-0.5 flex items-center gap-0.5">
                      <TrendingDown size={11} /> Redução viável imediata
                    </span>
                  ) : (
                    <span className="text-[10px] text-gray-400 block mt-0.5">
                      Totalmente otimizado
                    </span>
                  )}
                </div>
              </div>

              {/* Quantities & Allocation Meter */}
              <div className="bg-white p-5 rounded-xl border border-[#c6c6cf] shadow-sm space-y-4">
                <h4 className="font-headline font-bold text-[#1e284c] flex items-center gap-1.5 text-xs">
                  <Layers size={14} className="text-indigo-600" />
                  Distribuição de Licenças e Alocação
                </h4>

                {/* Allocation Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-[11px] font-medium text-slate-700">
                    <span>Taxa de Utilização</span>
                    <span className="font-bold">
                      {selectedCloudLicense.qtyTotal 
                        ? Math.round(((selectedCloudLicense.qtyUtilizada || 0) / selectedCloudLicense.qtyTotal) * 100)
                        : 100}%
                    </span>
                  </div>
                  
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex border border-slate-200/50">
                    <div 
                      style={{ width: `${selectedCloudLicense.qtyTotal ? Math.min(100, ((selectedCloudLicense.qtyUtilizada || 0) / selectedCloudLicense.qtyTotal) * 100) : 100}%` }}
                      className={`h-full ${selectedCloudLicense.status === 'Não Conforme' ? 'bg-red-500' : 'bg-indigo-600'}`}
                    />
                    {selectedCloudLicense.qtyOciosa > 0 && selectedCloudLicense.qtyTotal && (
                      <div 
                        style={{ width: `${(selectedCloudLicense.qtyOciosa / selectedCloudLicense.qtyTotal) * 100}%` }}
                        className="h-full bg-amber-400"
                      />
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 text-[10px] font-mono text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-indigo-600 block"></span>
                      <span>Ativo: <strong className="text-slate-800">{selectedCloudLicense.qtyUtilizada || 0}</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-400 block"></span>
                      <span>Ocioso: <strong className="text-slate-800">{selectedCloudLicense.qtyOciosa || 0}</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-slate-200 block border border-slate-300"></span>
                      <span>Total: <strong className="text-slate-800">{selectedCloudLicense.qtyTotal || 'Ilimitado'}</strong></span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Detailed Cloud Properties */}
              <div className="bg-white p-5 rounded-xl border border-[#c6c6cf] shadow-sm space-y-4">
                <h4 className="font-headline font-bold text-[#1e284c] flex items-center gap-1.5 text-xs">
                  <Cpu size={14} className="text-indigo-600" />
                  Propriedades e Telemetria API
                </h4>

                <div className="grid grid-cols-2 gap-x-4 gap-y-3 font-sans">
                  <div className="p-2.5 bg-slate-50/70 border border-slate-100 rounded-lg">
                    <span className="text-[10px] text-gray-400 block">Tipo de Licenciamento</span>
                    <strong className="text-slate-800 text-[11px] font-semibold mt-0.5 block font-mono">SaaS / Cloud Computacional</strong>
                  </div>
                  <div className="p-2.5 bg-slate-50/70 border border-slate-100 rounded-lg">
                    <span className="text-[10px] text-gray-400 block">Frequência de Varredura</span>
                    <strong className="text-slate-800 text-[11px] font-semibold mt-0.5 block font-mono">15 minutos (Real-time API)</strong>
                  </div>
                  <div className="p-2.5 bg-slate-50/70 border border-slate-100 rounded-lg">
                    <span className="text-[10px] text-gray-400 block">Expiração do Contrato</span>
                    <strong className="text-slate-800 text-[11px] font-semibold mt-0.5 block font-mono">
                      {selectedCloudLicense.expiryDate || 'Renovação Automática'}
                    </strong>
                  </div>
                  <div className="p-2.5 bg-slate-50/70 border border-slate-100 rounded-lg">
                    <span className="text-[10px] text-gray-400 block">Nível de Serviço (SLA)</span>
                    <strong className="text-slate-800 text-[11px] font-semibold mt-0.5 block font-mono">
                      {selectedCloudLicense.sla || '99.95% de Disponibilidade'}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Recommendation and Action Block */}
              <div className={`p-4 rounded-xl border flex items-start gap-3.5 ${
                selectedCloudLicense.status === 'Não Conforme' 
                  ? 'bg-red-50/60 border-red-200 text-red-900' 
                  : selectedCloudLicense.status === 'Ociosa'
                    ? 'bg-amber-50/60 border-amber-200 text-amber-900'
                    : 'bg-indigo-50/60 border-indigo-200 text-indigo-900'
              }`}>
                {selectedCloudLicense.status === 'Não Conforme' ? (
                  <AlertTriangle size={18} className="text-red-600 shrink-0 mt-0.5" />
                ) : selectedCloudLicense.status === 'Ociosa' ? (
                  <Info size={18} className="text-amber-600 shrink-0 mt-0.5" />
                ) : (
                  <ShieldCheck size={18} className="text-indigo-600 shrink-0 mt-0.5" />
                )}
                
                <div className="space-y-1.5 leading-relaxed text-[11px]">
                  <strong className="block font-black text-xs">
                    {selectedCloudLicense.status === 'Não Conforme' && 'Ação Corretiva Recomendada (Compliance)'}
                    {selectedCloudLicense.status === 'Ociosa' && 'Oportunidade de Redução de Gastos (Desperdício)'}
                    {selectedCloudLicense.status === 'Em Uso' && 'Status de Ativos Conforme e Saudável'}
                  </strong>
                  <p>
                    {selectedCloudLicense.status === 'Não Conforme' && 
                      `Identificamos que o uso de ${selectedCloudLicense.qtyUtilizada} núcleos/assinas excede as ${selectedCloudLicense.qtyTotal} licenças adquiridas. Recomendamos regularizar imediatamente adicionando licenças adicionais para evitar penalidades de conformidade.`
                    }
                    {selectedCloudLicense.status === 'Ociosa' && 
                      `Há ${selectedCloudLicense.qtyOciosa} licenças ociosas detectadas nas APIs de telemetria cloud. Você pode recuperar R$ ${selectedCloudLicense.potencialEconomia.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} por mês suspendendo temporariamente essas contas ou reduzindo o tier do serviço.`
                    }
                    {selectedCloudLicense.status === 'Em Uso' && 
                      'Todas as alocações estão operando dentro do limite contratual com monitoramento contínuo ativo. O consumo está em conformidade com as diretivas de governança corporativa.'
                    }
                  </p>
                </div>
              </div>

            </div>

            {/* Drawer Footer Actions */}
            <div className="p-5 border-t border-[#c6c6cf] bg-white flex gap-3">
              <button
                onClick={() => {
                  alert(`Iniciando desprovisionamento e readequação de custos para '${selectedCloudLicense.softwareName}' via Snow Atlas Automation Link...`);
                  setSelectedCloudLicense(null);
                }}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm cursor-pointer transition-all active:scale-95 text-center font-sans"
              >
                {selectedCloudLicense.status === 'Ociosa' ? 'Otimizar Licenças' : 'Regularizar Alocação'}
              </button>
              <button
                onClick={() => {
                  alert(`Sincronização manual forçada das APIs cloud de '${selectedCloudLicense.softwareName}' concluída com sucesso!`);
                }}
                className="px-4 py-2.5 bg-white hover:bg-slate-50 border border-[#c6c6cf]/80 text-[#1e284c] text-xs font-bold rounded-lg shadow-sm cursor-pointer transition-all active:scale-95 flex items-center gap-1.5 font-sans"
              >
                <RefreshCw size={12} />
                Sincronizar
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
