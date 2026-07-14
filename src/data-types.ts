// New project frontend types (originally from the AI Studio project)
export interface License {
  id: string;
  softwareName: string;
  category: 'Produtividade' | 'Design/Eng' | 'Segurança' | 'Utilities';
  qtyOciosa: number;
  qtyTotal?: number;
  qtyUtilizada?: number;
  custoMensal: number;
  potencialEconomia: number;
  status: 'Em Uso' | 'Ociosa' | 'Não Conforme';
  userEmail?: string;
  expiryDate?: string;
  vendor: 'Microsoft' | 'Adobe' | 'Autodesk' | 'Outros';
  contractNo?: string;
  sla?: string;
  billingPeriod?: 'mensal' | 'anual' | '2 anos' | '3 anos' | '5 anos';
  billingAmount?: number;
}

export interface ChartData {
  category: string;
  emUso: number;
  ociosa: number;
  naoConforme: number;
}

export interface VendorSpending {
  name: 'Microsoft' | 'Adobe' | 'Autodesk' | 'Outros';
  value: number;
  color: string;
}

export interface SystemAlert {
  id: string;
  softwareName: string;
  type: 'security' | 'compliance' | 'cost';
  severity: 'high' | 'medium' | 'low';
  message: string;
  date: string;
  resolved: boolean;
}

export interface CompanyData {
  id: string;
  name: string;
  softwaresInstalados: number;
  licencasGerenciadas: number;
  custoMensalTotal: number;
  complianceRate: number;
  totalDispositivos: number;
  licenses: License[];
  alerts: SystemAlert[];
}

export type ActiveTab = 'visao-geral' | 'licencas' | 'otimizacao' | 'conformidade' | 'alertas' | 'contratos' | 'dispositivos' | 'integracoes' | 'saas-visibility' | 'politicas' | 'ambientes-cloud' | 'nuvem' | 'containers' | 'admin' | 'relatorios' | 'custom-fields' | 'diagnostico' | 'licenses-backend';
