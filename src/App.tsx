import { useState, useEffect } from 'react';
import { ActiveTab, CompanyData, License, SystemAlert } from './data-types';
import { INITIAL_COMPANIES } from './data';
import Sidebar from './components/Sidebar';
import TopAppBar from './components/TopAppBar';
import OverviewView from './components/OverviewView';
import LicensesView from './components/LicensesView';
import OptimizationView from './components/OptimizationView';
import ComplianceView from './components/ComplianceView';
import AlertsView from './components/AlertsView';
import ReportDrawer from './components/ReportDrawer';
import ContractsView from './components/ContractsView';
import DevicesView from './components/DevicesView';
import IntegrationsView from './components/IntegrationsView';
import SaaSVisibilityView from './components/SaaSVisibilityView';
import PoliciesView from './components/PoliciesView';
import { CloudView } from './components/CloudView';
import { ContainerView } from './components/ContainerView';
import { AdministrationView } from './components/AdministrationView';
import { ReportsView } from './components/ReportsView';
import { CustomFieldsView } from './components/CustomFieldsView';
import { DiagnosticsView } from './components/DiagnosticsView';

export default function App() {
  // Global States
  const [companies, setCompanies] = useState<CompanyData[]>(INITIAL_COMPANIES);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('empresa-teste');
  const [activeTab, setActiveTab] = useState<ActiveTab>('visao-geral');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [reportDrawerOpen, setReportDrawerOpen] = useState<boolean>(false);
  const [savingsRealized, setSavingsRealized] = useState<number>(0);
  const [targetDeviceId, setTargetDeviceId] = useState<string | null>(null);
  const [deviceFilterQuery, setDeviceFilterQuery] = useState<string>('');

  // Active Company Data selector
  const selectedCompany = companies.find(c => c.id === selectedCompanyId) || companies[0];

  // Dynamic recalculation of complianceRate, totalSpend, licencasGerenciadas, and softwaresInstalados whenever licenses change
  useEffect(() => {
    setCompanies(prevCompanies => 
      prevCompanies.map(company => {
        const nonCompliant = company.licenses.filter(l => l.status === 'Não Conforme');
        const compliantCount = company.licenses.length - nonCompliant.length;
        const rate = company.licenses.length > 0 
          ? Math.round((compliantCount / company.licenses.length) * 100) 
          : 100;
        
        // Compute dynamic total spend for information consistency
        const totalSpend = company.licenses.reduce((sum, lic) => sum + lic.custoMensal, 0);

        // Helper to get license total quantity
        const getLicenseTotalQtyLocal = (lic: any) => {
          if (lic.qtyTotal !== undefined) return Number(lic.qtyTotal) || 0;
          if (lic.softwareName.includes('Microsoft 365')) return 450;
          if (lic.softwareName.includes('Adobe')) return 120;
          if (lic.softwareName.includes('AutoCAD')) return 40;
          if (lic.softwareName.includes('CrowdStrike')) return 250;
          if (lic.softwareName.includes('Zoom')) return 300;
          if (lic.softwareName.includes('Figma')) return 60;
          if (lic.softwareName.includes('Project')) return 50;
          if (lic.softwareName.includes('Tableau')) return 15;
          const seed = lic.id.charCodeAt(lic.id.length - 1) || 10;
          return ((seed % 5) + 2) * 10;
        };

        // Sum up managed licenses
        const dynamicLicencasGerenciadas = company.licenses.reduce((sum, lic) => sum + getLicenseTotalQtyLocal(lic), 0);

        // Sum up installed/utilized software copies on devices
        const dynamicSoftwaresInstalados = company.licenses.reduce((sum, lic) => {
          let uti = 0;
          if (lic.qtyUtilizada !== undefined) {
            uti = lic.qtyUtilizada;
          } else {
            const tot = getLicenseTotalQtyLocal(lic);
            if (lic.status === 'Em Uso') uti = tot;
            else if (lic.status === 'Não Conforme') uti = tot + (lic.qtyOciosa || 0);
            else uti = Math.max(0, tot - (lic.qtyOciosa || 0));
          }
          return sum + uti;
        }, 0);

        // Dynamically scale devices to be slightly lower than maximum software utilization or keep a minimum ratio
        const maxUtilized = company.licenses.reduce((max, lic) => {
          const uti = lic.qtyUtilizada !== undefined ? lic.qtyUtilizada : getLicenseTotalQtyLocal(lic);
          return uti > max ? uti : max;
        }, 0);
        const dynamicTotalDispositivos = Math.max(company.totalDispositivos || 0, Math.round(maxUtilized * 1.15));

        return {
          ...company,
          complianceRate: rate,
          custoMensalTotal: totalSpend,
          licencasGerenciadas: dynamicLicencasGerenciadas,
          softwaresInstalados: dynamicSoftwaresInstalados,
          totalDispositivos: dynamicTotalDispositivos
        };
      })
    );
  }, [selectedCompany.licenses]);

  // Handler: Selecting a company
  const handleSelectCompany = (id: string) => {
    setSelectedCompanyId(id);
    // Reset session savings when switching companies to be accurate
    setSavingsRealized(0);
    // Reset search
    setSearchQuery('');
  };

  // Handler: Adding a license
  const handleAddLicense = (newLicPayload: Omit<License, 'id'>) => {
    const newLicense: License = {
      ...newLicPayload,
      id: `lic-new-${Date.now()}`
    };

    setCompanies(prev => 
      prev.map(c => {
        if (c.id === selectedCompanyId) {
          // If the added license is Non-compliant, push a compliance alert
          let updatedAlerts = [...c.alerts];
          if (newLicPayload.status === 'Não Conforme') {
            updatedAlerts.unshift({
              id: `alt-gen-${Date.now()}`,
              softwareName: newLicPayload.softwareName,
              type: 'compliance',
              severity: 'high',
              message: `Novo desvio de conformidade detectado para ${newLicPayload.softwareName}.`,
              date: 'Agora mesmo',
              resolved: false
            });
          } else if (newLicPayload.status === 'Ociosa') {
            updatedAlerts.unshift({
              id: `alt-gen-${Date.now()}`,
              softwareName: newLicPayload.softwareName,
              type: 'cost',
              severity: 'medium',
              message: `Licenças ociosas detectadas de ${newLicPayload.softwareName} avaliadas em R$ ${newLicPayload.custoMensal}.`,
              date: 'Agora mesmo',
              resolved: false
            });
          }

          return {
            ...c,
            softwaresInstalados: c.softwaresInstalados + 1,
            licenses: [newLicense, ...c.licenses],
            alerts: updatedAlerts
          };
        }
        return c;
      })
    );
  };

  // Handler: Updating a license (CRUD)
  const handleUpdateLicense = (id: string, updatedPayload: Partial<License>) => {
    setCompanies(prev =>
      prev.map(c => {
        if (c.id === selectedCompanyId) {
          return {
            ...c,
            licenses: c.licenses.map(lic => 
              lic.id === id ? { ...lic, ...updatedPayload } as License : lic
            )
          };
        }
        return c;
      })
    );
  };

  // Handler: Deleting a license (CRUD)
  const handleDeleteLicense = (id: string) => {
    setCompanies(prev =>
      prev.map(c => {
        if (c.id === selectedCompanyId) {
          const licToDelete = c.licenses.find(l => l.id === id);
          const softCountAdjust = licToDelete ? 1 : 0;
          return {
            ...c,
            softwaresInstalados: Math.max(0, c.softwaresInstalados - softCountAdjust),
            licenses: c.licenses.filter(lic => lic.id !== id)
          };
        }
        return c;
      })
    );
  };

  // Handler: Reclaim an idle/waste license
  const handleReclaimLicense = (id: string) => {
    setCompanies(prev =>
      prev.map(c => {
        if (c.id === selectedCompanyId) {
          const licToReclaim = c.licenses.find(l => l.id === id);
          if (licToReclaim) {
            // Reclaimed items trigger instant savings in active session
            setSavingsRealized(prevSavings => prevSavings + licToReclaim.potencialEconomia);
            
            // Push alert resolution note
            const resolvedAlerts = c.alerts.map(alt => 
              alt.softwareName === licToReclaim.softwareName 
                ? { ...alt, resolved: true } 
                : alt
            );

            return {
              ...c,
              licenses: c.licenses.map(lic => 
                lic.id === id 
                  ? { ...lic, status: 'Em Uso', qtyOciosa: 0, potencialEconomia: 0 } 
                  : lic
              ),
              alerts: resolvedAlerts
            };
          }
        }
        return c;
      })
    );
    alert('Sucesso! As licenças ociosas foram reatribuídas. Desperdício financeiro zerado e colaboradores alocados com sucesso.');
  };

  // Handler: Cancel a sub/contract
  const handleCancelContract = (id: string) => {
    setCompanies(prev =>
      prev.map(c => {
        if (c.id === selectedCompanyId) {
          const licToCancel = c.licenses.find(l => l.id === id);
          if (licToCancel) {
            // Canceling saves the entire contracted amount
            setSavingsRealized(prevSavings => prevSavings + licToCancel.custoMensal);
            
            // Push notification to resolved
            const resolvedAlerts = c.alerts.map(alt => 
              alt.softwareName === licToCancel.softwareName 
                ? { ...alt, resolved: true } 
                : alt
            );

            return {
              ...c,
              softwaresInstalados: Math.max(0, c.softwaresInstalados - 1),
              licenses: c.licenses.filter(lic => lic.id !== id),
              alerts: resolvedAlerts
            };
          }
        }
        return c;
      })
    );
    alert('Contrato encerrado junto ao fornecedor com sucesso. Gasto mensal reduzido e assinaturas removidas do inventário.');
  };

  // Handler: Regularize a non-compliant item (buy licenses)
  const handleRegularizeLicense = (id: string) => {
    setCompanies(prev =>
      prev.map(c => {
        if (c.id === selectedCompanyId) {
          const licToRegularize = c.licenses.find(l => l.id === id);
          if (licToRegularize) {
            // Clear corresponding alerts
            const resolvedAlerts = c.alerts.map(alt => 
              alt.softwareName === licToRegularize.softwareName && alt.type === 'compliance'
                ? { ...alt, resolved: true } 
                : alt
            );

            return {
              ...c,
              licenses: c.licenses.map(lic => 
                lic.id === id 
                  ? { ...lic, status: 'Em Uso', qtyOciosa: 0, potencialEconomia: 0 } 
                  : lic
              ),
              alerts: resolvedAlerts
            };
          }
        }
        return c;
      })
    );
    alert('Excelente decisão! Adquirimos licenças em conformidade legal. Risco regulatório mitigado e status regularizado.');
  };

  // Handler: Resolve a single alert notification
  const handleResolveAlert = (id: string) => {
    setCompanies(prev =>
      prev.map(c => {
        if (c.id === selectedCompanyId) {
          return {
            ...c,
            alerts: c.alerts.map(alt => alt.id === id ? { ...alt, resolved: true } : alt)
          };
        }
        return c;
      })
    );
  };

  // Handler: Clear all alerts
  const handleResolveAllAlerts = () => {
    setCompanies(prev =>
      prev.map(c => {
        if (c.id === selectedCompanyId) {
          return {
            ...c,
            alerts: c.alerts.map(alt => ({ ...alt, resolved: true }))
          };
        }
        return c;
      })
    );
  };

  // Handler: Connect AWS License Manager and inject high-quality AWS cloud license data
  const handleConnectAWS = () => {
    setCompanies(prev =>
      prev.map(c => {
        if (c.id === selectedCompanyId) {
          // Check if already connected to avoid duplicate injection
          if (c.licenses.some(l => l.id.startsWith('lic-aws-'))) {
            return c;
          }

          // Define 3 new AWS-specific cloud licenses with full detail matching corporate software
          const awsLicenses: License[] = [
            {
              id: 'lic-aws-ec2-win',
              softwareName: 'Windows Server 2022 Datacenter (AWS EC2)',
              vendor: 'Microsoft',
              qtyTotal: 80,
              qtyUtilizada: 80,
              qtyOciosa: 0,
              custoMensal: 4800,
              potencialEconomia: 0,
              status: 'Em Uso',
              category: 'Utilities',
              contractNo: 'CTR-AWS-EC2-8821',
              sla: '99.99% AWS Cloud SLA',
              expiryDate: '2028-06-30'
            },
            {
              id: 'lic-aws-rds-sql',
              softwareName: 'SQL Server Enterprise Edition (AWS RDS)',
              vendor: 'Microsoft',
              qtyTotal: 16,
              qtyUtilizada: 12,
              qtyOciosa: 4,
              custoMensal: 11200,
              potencialEconomia: 3200,
              status: 'Ociosa',
              category: 'Utilities',
              contractNo: 'CTR-AWS-RDS-9901',
              sla: '99.95% AWS RDS SLA',
              expiryDate: '2028-06-30'
            },
            {
              id: 'lic-aws-rds-orcl',
              softwareName: 'Oracle Database Enterprise Edition (AWS RDS BYOL)',
              vendor: 'Outros',
              qtyTotal: 4,
              qtyUtilizada: 8,
              qtyOciosa: 0,
              custoMensal: 18500,
              potencialEconomia: 0,
              status: 'Não Conforme',
              category: 'Utilities',
              contractNo: 'CTR-AWS-ORCL-2204',
              sla: '99.95% AWS RDS SLA',
              expiryDate: '2028-06-30'
            }
          ];

          // Define 2 new AWS cloud-related alerts
          const awsAlerts: SystemAlert[] = [
            {
              id: 'alt-aws-oracle',
              type: 'compliance',
              severity: 'high',
              softwareName: 'Oracle Database Enterprise Edition (AWS RDS BYOL)',
              message: 'AWS License Manager identificou 8 vCPUs de Oracle DB ativos no RDS, mas apenas 4 licenças BYOL registradas.',
              date: 'Hoje, 11:45',
              resolved: false
            },
            {
              id: 'alt-aws-sql',
              type: 'cost',
              severity: 'medium',
              softwareName: 'SQL Server Enterprise Edition (AWS RDS)',
              message: '4 instâncias RDS com SQL Server Enterprise estão ociosas há mais de 14 dias. Potencial de economia de R$ R$ 3.200,00/mês.',
              date: 'Hoje, 11:45',
              resolved: false
            }
          ];

          return {
            ...c,
            licenses: [...c.licenses, ...awsLicenses],
            alerts: [...c.alerts, ...awsAlerts]
          };
        }
        return c;
      })
    );
  };

  // Handler: Disconnect AWS License Manager and remove AWS cloud license data
  const handleDisconnectAWS = () => {
    setCompanies(prev =>
      prev.map(c => {
        if (c.id === selectedCompanyId) {
          return {
            ...c,
            licenses: c.licenses.filter(l => !l.id.startsWith('lic-aws-')),
            alerts: c.alerts.filter(a => !a.id.startsWith('alt-aws-'))
          };
        }
        return c;
      })
    );
  };

  // Total active alerts badge
  const activeAlertsCount = selectedCompany.alerts.filter(alt => !alt.resolved).length;

  return (
    <div className="flex h-screen w-full bg-[#f8f9fa] text-gray-800 overflow-hidden font-sans">
      
      {/* Sidebar Navigation Left Panel */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        activeAlertsCount={activeAlertsCount}
        onOpenReportDrawer={() => setReportDrawerOpen(true)}
      />

      {/* Main Container Area Right Panel */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#f8f9fa]">
        
        {/* Top bar search and filters and company selector */}
        <TopAppBar 
          companies={companies}
          selectedCompany={selectedCompany}
          onSelectCompany={handleSelectCompany}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          activeAlertsCount={activeAlertsCount}
          onNavigateToAlerts={() => setActiveTab('alertas')}
          onNavigateToLicenses={() => setActiveTab('licencas')}
          onNavigateToOverview={() => setActiveTab('visao-geral')}
          currentTab={activeTab}
        />

        {/* Scrollable Main Views Stage */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50 text-slate-800">
          
          {/* Sub-section router */}
          {activeTab === 'visao-geral' && (
            <OverviewView 
              companyData={selectedCompany}
              onNavigateToTab={setActiveTab}
              onReclaimLicense={handleReclaimLicense}
              searchQuery={searchQuery}
              savingsRealized={savingsRealized}
              onSetDeviceFilterQuery={setDeviceFilterQuery}
            />
          )}

          {activeTab === 'licencas' && (
            <LicensesView 
              companyData={selectedCompany}
              onAddLicense={handleAddLicense}
              onUpdateLicense={handleUpdateLicense}
              onDeleteLicense={handleDeleteLicense}
              searchQuery={searchQuery}
              onNavigateToDevice={(deviceId) => {
                setTargetDeviceId(deviceId);
                setActiveTab('dispositivos');
              }}
              onNavigateToTab={setActiveTab}
            />
          )}

          {activeTab === 'saas-visibility' && (
            <SaaSVisibilityView 
              companyData={selectedCompany}
              onNavigateToTab={setActiveTab}
              searchQuery={searchQuery}
            />
          )}

          {activeTab === 'otimizacao' && (
            <OptimizationView 
              companyData={selectedCompany}
              onReclaimLicense={handleReclaimLicense}
              onCancelContract={handleCancelContract}
              savingsRealized={savingsRealized}
            />
          )}

          {activeTab === 'conformidade' && (
            <ComplianceView 
              companyData={selectedCompany}
              onRegularizeLicense={handleRegularizeLicense}
            />
          )}

          {activeTab === 'alertas' && (
            <AlertsView 
              companyData={selectedCompany}
              onResolveAlert={handleResolveAlert}
              onResolveAllAlerts={handleResolveAllAlerts}
            />
          )}

          {activeTab === 'contratos' && (
            <ContractsView 
              companyData={selectedCompany}
              onAddContract={handleAddLicense}
            />
          )}

          {activeTab === 'dispositivos' && (
            <DevicesView 
              companyData={selectedCompany}
              onNavigateToTab={setActiveTab}
              targetDeviceId={targetDeviceId}
              onClearTargetDevice={() => setTargetDeviceId(null)}
              initialSearchQuery={deviceFilterQuery}
              onClearInitialSearchQuery={() => setDeviceFilterQuery('')}
            />
          )}

          {activeTab === 'ambientes-cloud' && (
            <IntegrationsView 
              companyData={selectedCompany}
              onConnectAWS={handleConnectAWS}
              onDisconnectAWS={handleDisconnectAWS}
              mode="cloud-only"
            />
          )}

          {activeTab === 'integracoes' && (
            <IntegrationsView 
              companyData={selectedCompany}
              onConnectAWS={handleConnectAWS}
              onDisconnectAWS={handleDisconnectAWS}
              mode="integrations-only"
            />
          )}

          {activeTab === 'politicas' && (
            <PoliciesView 
              companyData={selectedCompany}
              onNavigateToTab={setActiveTab}
            />
          )}

          {activeTab === 'nuvem' && <CloudView />}
          {activeTab === 'containers' && <ContainerView />}
          {activeTab === 'admin' && <AdministrationView />}
          {activeTab === 'relatorios' && <ReportsView />}
          {activeTab === 'custom-fields' && <CustomFieldsView />}
          {activeTab === 'diagnostico' && <DiagnosticsView />}

        </div>

        {/* Footer info Area */}
        <footer className="p-4 bg-white border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center text-[11px] text-gray-500 font-sans">
          <p>© 2026 NexusSAM Software Intelligence. Todos os direitos reservados.</p>
          <div className="flex items-center gap-4 mt-2 sm:mt-0 font-medium">
            <span className="flex items-center gap-1 text-[#00B551]">
              <span className="w-2 h-2 rounded-full bg-[#00B551] animate-pulse"></span>
              Sincronização em tempo real ativa
            </span>
            <p className="text-gray-400">Última atualização: Hoje, {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
        </footer>

      </main>

      {/* Slide-out Report Drawer */}
      <ReportDrawer 
        isOpen={reportDrawerOpen}
        onClose={() => setReportDrawerOpen(false)}
        companyData={selectedCompany}
      />

    </div>
  );
}
