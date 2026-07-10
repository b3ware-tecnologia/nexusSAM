import React, { useState, useEffect } from "react";
import { 
  Computer, 
  MobileDevice, 
  DiscoveredApplication, 
  SoftwareCatalogItem, 
  PrivateCatalogItem, 
  ApplicationCategory,
  Manufacturer
} from "../types.js";
import { 
  HardDrive, 
  Smartphone, 
  Search, 
  Plus, 
  Trash2, 
  Play, 
  RefreshCw, 
  AlertTriangle, 
  Calendar, 
  ShieldAlert, 
  CheckCircle, 
  Settings, 
  Layers, 
  PlusCircle, 
  Activity, 
  Info,
  Clock,
  ShieldCheck,
  Building,
  HelpCircle
} from "lucide-react";
import { motion } from "motion/react";
import { HintTooltip } from "./HintTooltip.js";

interface InventoryViewProps {
  onRefreshAll: () => void;
  navigateToComputerId?: string | null;
  onNavigated?: () => void;
}

export function InventoryView({ onRefreshAll, navigateToComputerId, onNavigated }: InventoryViewProps) {
  const [activeTab, setActiveTab] = useState<"COMPUTERS" | "MOBILES" | "DISCOVERED_APPS" | "DIS_CATALOG" | "PRIVATE_CATALOG">("COMPUTERS");
  
  // States
  const [computers, setComputers] = useState<Computer[]>([]);
  const [mobiles, setMobiles] = useState<MobileDevice[]>([]);
  const [discoveredApps, setDiscoveredApps] = useState<DiscoveredApplication[]>([]);
  const [catalogItems, setCatalogItems] = useState<SoftwareCatalogItem[]>([]);
  const [categories, setCategories] = useState<ApplicationCategory[]>([]);
  const [privateCatalog, setPrivateCatalog] = useState<PrivateCatalogItem[]>([]);
  
  // UI states
  const [selectedComputer, setSelectedComputer] = useState<Computer | null>(null);
  const [computerDetails, setComputerDetails] = useState<{computer: Computer, applications: DiscoveredApplication[], installations: any[]} | null>(null);
  const [isScanning, setIsScanning] = useState<string | null>(null); // computerId being scanned
  const [searchQuery, setSearchQuery] = useState("");
  const [catalogSearch, setCatalogSearch] = useState("");
  
  // Create Modals states
  const [showAddComputerModal, setShowAddComputerModal] = useState(false);
  const [showAddMobileModal, setShowAddMobileModal] = useState(false);
  const [showAddPrivateModal, setShowAddPrivateModal] = useState(false);

  // Form states - Computer
  const [newCompName, setNewCompName] = useState("");
  const [newCompOS, setNewCompOS] = useState<"Windows" | "macOS" | "Linux">("Windows");
  const [newCompBrand, setNewCompBrand] = useState("Dell");
  const [newCompModel, setNewCompModel] = useState("OptiPlex 7090");
  const [newCompCores, setNewCompCores] = useState(4);
  const [newCompRam, setNewCompRam] = useState(16);
  const [newCompStorage, setNewCompStorage] = useState(512);
  const [newCompCpu, setNewCompCpu] = useState("Intel Core i7-11700");
  const [newCompSerial, setNewCompSerial] = useState("");
  const [newCompWarranty, setNewCompWarranty] = useState<"Under Warranty" | "Expired" | "No Info">("Under Warranty");
  const [newCompWarrantyDate, setNewCompWarrantyDate] = useState("2028-12-31");

  // Form states - Mobile
  const [newMobName, setNewMobName] = useState("");
  const [newMobBrand, setNewMobBrand] = useState("Apple");
  const [newMobModel, setNewMobModel] = useState("iPhone 15");
  const [newMobOS, setNewMobOS] = useState("iOS 17");
  const [newMobSerial, setNewMobSerial] = useState("");
  const [newMobUser, setNewMobUser] = useState("");
  const [newMobWarranty, setNewMobWarranty] = useState<"Under Warranty" | "Expired" | "No Info">("Under Warranty");
  const [newMobWarrantyDate, setNewMobWarrantyDate] = useState("2026-12-31");

  // Form states - Private Catalog
  const [privAppName, setPrivAppName] = useState("");
  const [privPublisher, setPrivPublisher] = useState("");
  const [privPattern, setPrivPattern] = useState("");
  const [privCategory, setPrivCategory] = useState("cat-office");
  const [privNotes, setPrivNotes] = useState("");

  const [notif, setNotif] = useState<{type: "success" | "error" | "info", msg: string} | null>(null);

  useEffect(() => {
    loadInventoryData();
  }, [activeTab]);

  // Auto-navigate to a specific computer when requested
  useEffect(() => {
    if (navigateToComputerId && computers.length > 0) {
      setActiveTab("COMPUTERS");
      const comp = computers.find(c => c.id === navigateToComputerId);
      if (comp) {
        setSelectedComputer(comp);
        fetch(`/api/computers/${comp.id}`).then(r => r.ok && r.json()).then(data => data && setComputerDetails(data));
      }
      onNavigated?.();
    }
  }, [navigateToComputerId, computers]);

  const showNotification = (type: "success" | "error" | "info", msg: string) => {
    setNotif({ type, msg });
    setTimeout(() => setNotif(null), 5000);
  };

  const loadInventoryData = async () => {
    try {
      const [compRes, mobRes, appsRes, catRes, categoriesRes, privRes] = await Promise.all([
        fetch("/api/computers"),
        fetch("/api/mobile-devices"),
        fetch("/api/applications"),
        fetch("/api/catalog"),
        fetch("/api/catalog/categories"),
        fetch("/api/private-catalog")
      ]);

      if (compRes.ok) setComputers(await compRes.json());
      if (mobRes.ok) setMobiles(await mobRes.json());
      if (appsRes.ok) setDiscoveredApps(await appsRes.json());
      if (catRes.ok) setCatalogItems(await catRes.json());
      if (categoriesRes.ok) setCategories(await categoriesRes.json());
      if (privRes.ok) setPrivateCatalog(await privRes.json());
    } catch (e) {
      console.error("Failed to load inventory modules", e);
    }
  };

  const handleSelectComputer = async (comp: Computer) => {
    setSelectedComputer(comp);
    try {
      const res = await fetch(`/api/computers/${comp.id}`);
      if (res.ok) {
        const data = await res.json();
        setComputerDetails(data);
      }
    } catch (e) {
      console.error("Failed to load computer endpoints", e);
    }
  };

  const handleTriggerAgentScan = async (compId: string) => {
    setIsScanning(compId);
    showNotification("info", "Executando scan de inventário do Snow Extender Agent no endpoint alvo...");
    try {
      const res = await fetch("/api/inventory/agent-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ computerId: compId })
      });
      if (res.ok) {
        const result = await res.json();
        showNotification("success", result.message);
        
        // Reload all
        await loadInventoryData();
        onRefreshAll(); // trigger main app compliance refresh

        // Refresh selected details if open
        if (selectedComputer && selectedComputer.id === compId) {
          handleSelectComputer(result.computer);
        }
      } else {
        showNotification("error", "O agente falhou ao responder ou o scan foi rejeitado.");
      }
    } catch (e) {
      showNotification("error", "Erro de conexão com o gateway seguro do agente.");
    } finally {
      setIsScanning(null);
    }
  };

  const handleUpdateLifecycle = async (compId: string, status: "Active" | "Quarantined" | "Archived" | "Inactive") => {
    let endpoint = `/api/computers/${compId}/activate`;
    if (status === "Quarantined") endpoint = `/api/computers/${compId}/quarantine`;
    if (status === "Archived") endpoint = `/api/computers/${compId}/archive`;
    if (status === "Inactive") endpoint = `/api/computers/${compId}/inactive`;

    try {
      const res = await fetch(endpoint, { method: "POST" });
      if (res.ok) {
        showNotification("success", `Status do ciclo de vida atualizado com sucesso para: ${status}`);
        const updatedComp = await res.json();
        
        // update local list
        setComputers(prev => prev.map(c => c.id === compId ? updatedComp : c));
        if (selectedComputer?.id === compId) {
          setSelectedComputer(updatedComp);
        }
        onRefreshAll();
      }
    } catch (e) {
      showNotification("error", "Falha ao atualizar o ciclo de vida.");
    }
  };

  const handleAddComputer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/computers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCompName,
          os: newCompOS,
          brand: newCompBrand,
          model: newCompModel,
          cores: newCompCores,
          pvuPerCore: newCompOS === "Linux" ? 100 : 70,
          ramGB: newCompRam,
          storageGB: newCompStorage,
          cpuModel: newCompCpu,
          serialNumber: newCompSerial,
          warrantyStatus: newCompWarranty,
          warrantyExpirationDate: newCompWarrantyDate
        })
      });

      if (res.ok) {
        showNotification("success", "Endpoint personalizado adicionado ao catálogo de inventário de TI.");
        setShowAddComputerModal(false);
        setNewCompName("");
        loadInventoryData();
      } else {
        showNotification("error", "Falha ao registrar dispositivo personalizado.");
      }
    } catch (e) {
      showNotification("error", "Erro interno de rede.");
    }
  };

  const handleDeleteComputer = async (compId: string) => {
    if (!confirm("Tem certeza de que deseja remover este ativo de hardware? Isso apagará todos os logs de software descobertos para ele.")) return;
    try {
      const res = await fetch(`/api/computers/${compId}`, { method: "DELETE" });
      if (res.ok) {
        showNotification("success", "Ativo de hardware descomissionado com sucesso.");
        setSelectedComputer(null);
        setComputerDetails(null);
        loadInventoryData();
        onRefreshAll();
      }
    } catch (e) {
      showNotification("error", "Erro ao descomissionar ativo de hardware.");
    }
  };

  const handleAddMobile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/mobile-devices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newMobName,
          brand: newMobBrand,
          model: newMobModel,
          os: newMobOS,
          serialNumber: newMobSerial,
          userName: newMobUser,
          warrantyStatus: newMobWarranty,
          warrantyExpirationDate: newMobWarrantyDate
        })
      });

      if (res.ok) {
        showNotification("success", "Dispositivo móvel cadastrado com sucesso no registro HAM.");
        setShowAddMobileModal(false);
        setNewMobName("");
        setNewMobUser("");
        setNewMobSerial("");
        loadInventoryData();
      }
    } catch (e) {
      showNotification("error", "Falha ao cadastrar dispositivo móvel.");
    }
  };

  const handleDeleteMobile = async (id: string) => {
    if (!confirm("Remover este dispositivo móvel do rastreamento de ativos?")) return;
    try {
      const res = await fetch(`/api/mobile-devices/${id}`, { method: "DELETE" });
      if (res.ok) {
        showNotification("success", "Rastreamento do dispositivo móvel interrompido.");
        loadInventoryData();
      }
    } catch (e) {
      showNotification("error", "Falha ao remover dispositivo.");
    }
  };

  const handleAddPrivatePattern = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/private-catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          softwareName: privAppName,
          publisher: privPublisher,
          matchPattern: privPattern,
          categoryId: privCategory,
          notes: privNotes
        })
      });

      if (res.ok) {
        showNotification("success", "Regra de reconhecimento de aplicativo privado adicionada. Os próximos scans a mapearão!");
        setShowAddPrivateModal(false);
        setPrivAppName("");
        setPrivPublisher("");
        setPrivPattern("");
        setPrivNotes("");
        loadInventoryData();
      }
    } catch (e) {
      showNotification("error", "Falha ao adicionar padrão de reconhecimento personalizado.");
    }
  };

  const handleDeletePrivateItem = async (id: string) => {
    if (!confirm("Tem certeza de que deseja excluir esta regra de reconhecimento personalizada?")) return;
    try {
      const res = await fetch(`/api/private-catalog/${id}`, { method: "DELETE" });
      if (res.ok) {
        showNotification("success", "Regra de reconhecimento do catálogo privado excluída.");
        loadInventoryData();
      }
    } catch (e) {
      showNotification("error", "Falha ao excluir padrão.");
    }
  };

  // Filters
  const filteredComputers = computers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.brand && c.brand.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (c.model && c.model.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (c.serialNumber && c.serialNumber.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredMobiles = mobiles.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.userName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredDisApps = discoveredApps.filter(da => 
    da.softwareName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    da.publisher.toLowerCase().includes(searchQuery.toLowerCase()) ||
    da.rawSoftwareName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCatalog = catalogItems.filter(ci => 
    ci.softwareName.toLowerCase().includes(catalogSearch.toLowerCase()) ||
    ci.publisher.toLowerCase().includes(catalogSearch.toLowerCase()) ||
    (ci.defaultSku && ci.defaultSku.toLowerCase().includes(catalogSearch.toLowerCase()))
  );

  // Stats
  const activeCompCount = computers.filter(c => c.lifecycleStatus === "Active").length;
  const quarantinedCompCount = computers.filter(c => c.lifecycleStatus === "Quarantined").length;
  const inactiveCompCount = computers.filter(c => c.lifecycleStatus === "Inactive").length;
  const underWarrantyCount = computers.filter(c => c.warrantyStatus === "Under Warranty").length + mobiles.filter(m => m.warrantyStatus === "Under Warranty").length;

  return (
    <div className="space-y-6">
      
      {/* Toast Notification */}
      {notif && (
        <div className={`fixed bottom-4 right-4 z-50 p-4 rounded-xl shadow-lg border text-xs font-semibold flex items-center gap-2.5 ${
          notif.type === "success" 
            ? "bg-emerald-50 border-emerald-200 text-emerald-800"
            : notif.type === "error"
            ? "bg-rose-50 border-rose-200 text-rose-800"
            : "bg-[#D1E7F3] border-[#D1E7F3] text-[#366BB2]"
        }`}>
          {notif.type === "success" ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <Info className="w-4 h-4" />}
          <span>{notif.msg}</span>
        </div>
      )}

      {/* Hero Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-[#212424]">
            <HardDrive className="w-6 h-6" style={{color: "#366BB2"}} />
            DIS Asset Intelligence & Núcleo HAM
          </h1>
          <HintTooltip text="Gerencie computadores descobertos, dispositivos móveis e inventário de software em toda a sua empresa. Monitore especificações de hardware, status de garantia e estados do ciclo de vida." side="right" size="md" />
        </div>
        <p className="text-[#6E7070] text-sm">
          Catálogo do Data Intelligence Service — equivalente ao Snow Atlas — para reconhecimento de software combinado com governança do ciclo de vida de ativos de hardware.
        </p>
      </div>

      {/* Global Inventory Health KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#D0D0D0] p-4 rounded-xl shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[10px] uppercase font-bold text-[#A6A7A7]">Endpoints Ativos</span>
            <span className="text-lg font-bold text-[#212424]">{activeCompCount} <span className="text-xs text-[#A6A7A7]">dispositivos</span></span>
          </div>
        </div>

        <div className="bg-white border border-[#D0D0D0] p-4 rounded-xl shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[10px] uppercase font-bold text-[#A6A7A7]">Em Quarentena</span>
            <span className="text-lg font-bold text-[#212424]">{quarantinedCompCount} <span className="text-xs text-[#A6A7A7]">ativos</span></span>
          </div>
        </div>

        <div className="bg-white border border-[#D0D0D0] p-4 rounded-xl shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#F2F2F2] text-[#6E7070] flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[10px] uppercase font-bold text-[#A6A7A7]">Inativo / Ocioso</span>
            <span className="text-lg font-bold text-[#212424]">{inactiveCompCount} <span className="text-xs text-[#A6A7A7]">sinalizados</span></span>
          </div>
        </div>

        <div className="bg-white border border-[#D0D0D0] p-4 rounded-xl shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{background: "#D1E7F3", color: "#366BB2"}}>
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[10px] uppercase font-bold text-[#A6A7A7]">Sob Garantia</span>
            <span className="text-lg font-bold text-[#212424]">{underWarrantyCount} <span className="text-xs text-[#A6A7A7]">cobertos</span></span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-[#D0D0D0] flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-4">
          <button
            onClick={() => { setActiveTab("COMPUTERS"); setSelectedComputer(null); setComputerDetails(null); }}
            className={`pb-3 text-xs font-semibold uppercase border-b-2 transition-all cursor-pointer ${
              activeTab === "COMPUTERS" 
          ? "border-[#366BB2] text-[#366BB2]" 
          : "border-transparent text-[#6E7070] hover:text-[#212424]"
            }`}
          >
            <span className="flex items-center gap-1.5"><HardDrive className="w-3.5 h-3.5" /> Computadores & Nós Servidores</span>
          </button>
          
          <button
            onClick={() => { setActiveTab("MOBILES"); }}
            className={`pb-3 text-xs font-semibold uppercase border-b-2 transition-all cursor-pointer ${
              activeTab === "MOBILES" 
                ? "border-[#366BB2] text-[#366BB2]" 
                : "border-transparent text-[#6E7070] hover:text-[#212424]"
            }`}
          >
            <span className="flex items-center gap-1.5"><Smartphone className="w-3.5 h-3.5" /> Registro Móvel (HAM)</span>
          </button>

          <button
            onClick={() => { setActiveTab("DISCOVERED_APPS"); }}
            className={`pb-3 text-xs font-semibold uppercase border-b-2 transition-all cursor-pointer ${
              activeTab === "DISCOVERED_APPS" 
                ? "border-[#366BB2] text-[#366BB2]" 
                : "border-transparent text-[#6E7070] hover:text-[#212424]"
            }`}
          >
            <span className="flex items-center gap-1.5"><Layers className="w-3.5 h-3.5" /> Apps Descobertas & Medição</span>
          </button>

          <button
            onClick={() => { setActiveTab("DIS_CATALOG"); }}
            className={`pb-3 text-xs font-semibold uppercase border-b-2 transition-all cursor-pointer ${
              activeTab === "DIS_CATALOG" 
                ? "border-[#366BB2] text-[#366BB2]" 
                : "border-transparent text-[#6E7070] hover:text-[#212424]"
            }`}
          >
            <span className="flex items-center gap-1.5"><Building className="w-3.5 h-3.5" /> Pesquisa no Catálogo DIS 800K+</span>
          </button>

          <button
            onClick={() => { setActiveTab("PRIVATE_CATALOG"); }}
            className={`pb-3 text-xs font-semibold uppercase border-b-2 transition-all cursor-pointer ${
              activeTab === "PRIVATE_CATALOG" 
                ? "border-[#366BB2] text-[#366BB2]"
                : "border-transparent text-[#6E7070] hover:text-[#212424]"
            }`}
          >
            <span className="flex items-center gap-1.5"><Settings className="w-3.5 h-3.5" /> Regras do Catálogo Privado</span>
          </button>
        </div>

        {/* Tab Actions */}
        <div className="pb-2.5">
          {activeTab === "COMPUTERS" && (
            <button
              onClick={() => setShowAddComputerModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-sm transition-all" style={{background: "#366BB2"}}
            >
              <Plus className="w-4 h-4" /> Registrar Servidor/PC
            </button>
          )}
          {activeTab === "MOBILES" && (
            <button
              onClick={() => setShowAddMobileModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-sm transition-all" style={{background: "#366BB2"}}
            >
              <Plus className="w-4 h-4" /> Cadastrar Ativo Móvel
            </button>
          )}
          {activeTab === "PRIVATE_CATALOG" && (
            <button
              onClick={() => setShowAddPrivateModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-sm transition-all" style={{background: "#366BB2"}}
            >
              <PlusCircle className="w-4 h-4" /> Adicionar Reconhecimento de Padrão
            </button>
          )}
        </div>
      </div>

      {/* Main Tab Viewports */}
      <div className="grid grid-cols-1 gap-6">

        {/* TAB 1: COMPUTERS & DETAILED ENDPOINT SIDE PANEL */}
        {activeTab === "COMPUTERS" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            
            {/* Left side list */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white border border-[#D0D0D0] rounded-xl p-4 shadow-sm space-y-3">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#A6A7A7]" />
                  <input
                    type="text"
                    placeholder="Pesquisar por nome do computador, número de série, SO ou fabricante..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full text-xs pl-9 pr-4 py-2 border border-[#D0D0D0] rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-[#F2F2F2]"
                  />
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#D0D0D0] text-[10px] font-bold text-[#A6A7A7] uppercase tracking-wider">
                        <th className="py-2.5">Nome do Endpoint</th>
                        <th className="py-2.5">Hardware / Especificações</th>
                        <th className="py-2.5">Status da Garantia</th>
                        <th className="py-2.5 text-center">Ciclo de Vida</th>
                        <th className="py-2.5 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs text-[#6E7070]">
                      {filteredComputers.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-[#A6A7A7]">
                            Nenhum endpoint de computador correspondente encontrado no registro HAM.
                          </td>
                        </tr>
                      ) : (
                        filteredComputers.map((comp) => {
                          const isSelected = selectedComputer?.id === comp.id;
                          return (
                            <tr 
                              key={comp.id}
                              onClick={() => handleSelectComputer(comp)}
                              className={`hover:bg-[#F2F2F2]/80 transition-all cursor-pointer ${isSelected ? "bg-indigo-50/40" : ""}`}
                            >
                              <td className="py-3 font-semibold text-[#212424]">
                                <div className="flex items-center gap-2">
                                  <span className={`w-2 h-2 rounded-full ${
                                    comp.lifecycleStatus === "Active" 
                                      ? "bg-emerald-500 animate-pulse" 
                                      : comp.lifecycleStatus === "Quarantined"
                                      ? "bg-amber-500"
                                      : comp.lifecycleStatus === "Inactive"
                                      ? "bg-slate-400"
                                      : "bg-slate-300"
                                  }`} />
                                  <div>
                                    <span className="block font-bold text-[#212424]">{comp.name}</span>
                                    <span className="text-[10px] text-[#A6A7A7] font-mono">{comp.serialNumber || "Sem Nº de Série"}</span>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3">
                                <div className="text-[11px]">
                                  <span className="font-semibold">{comp.brand} {comp.model}</span>
                                  <span className="block text-[10px] text-[#A6A7A7] font-mono">{comp.cores} Núcleos • {comp.ramGB}GB RAM • {comp.os}</span>
                                </div>
                              </td>
                              <td className="py-3">
                                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                                  comp.warrantyStatus === "Under Warranty"
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                    : comp.warrantyStatus === "Expired"
                                    ? "bg-rose-50 text-rose-700 border border-rose-100"
                                    : "bg-[#F2F2F2] text-[#6E7070]"
                                }`}>
                                  {comp.warrantyStatus}
                                </span>
                                {comp.warrantyExpirationDate && (
                                  <span className="block text-[9px] text-[#A6A7A7] font-mono mt-0.5">Expira em: {comp.warrantyExpirationDate}</span>
                                )}
                              </td>
                              <td className="py-3 text-center">
                                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                  comp.lifecycleStatus === "Active" 
                                    ? "bg-emerald-100 text-emerald-800" 
                                    : comp.lifecycleStatus === "Quarantined"
                                    ? "bg-amber-100 text-amber-800"
                                    : comp.lifecycleStatus === "Inactive"
                                    ? "bg-[#F2F2F2] text-[#6E7070]"
                                    : "bg-slate-200 text-[#212424]"
                                }`}>
                                  {comp.lifecycleStatus}
                                </span>
                              </td>
                              <td className="py-3 text-right" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => handleTriggerAgentScan(comp.id)}
                                    disabled={isScanning !== null}
                                    className="p-1 rounded transition-all cursor-pointer" style={{color: "#366BB2"}}
                                    title="Acionar scan seguro do agente on-premises (Snow Extender Agent)"
                                  >
                                    <RefreshCw className={`w-3.5 h-3.5 ${isScanning === comp.id ? "animate-spin text-amber-600" : ""}`} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteComputer(comp.id)}
                                    className="p-1 text-[#A6A7A7] hover:text-rose-600 hover:bg-rose-50 rounded transition-all cursor-pointer"
                                    title="Descomissionar Ativo de Hardware"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
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
            </div>

            {/* Right side Detail Panel */}
            <div className="bg-white border border-[#D0D0D0] rounded-xl p-5 shadow-sm space-y-4 min-h-[400px]">
              {selectedComputer && computerDetails ? (
                <div className="space-y-4">
                  <div className="border-b border-[#D0D0D0] pb-3 flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-[#212424] text-sm">{computerDetails.computer.name}</h3>
                      <span className="text-[10px] font-semibold text-[#A6A7A7] uppercase tracking-widest block">Diagnósticos Avançados do Endpoint</span>
                    </div>
                    <button
                      onClick={() => handleTriggerAgentScan(computerDetails.computer.id)}
                      disabled={isScanning !== null}
                      className="px-2.5 py-1 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all" style={{background: "#D1E7F3", color: "#4079C4"}}
                    >
                      <RefreshCw className={`w-3 h-3 ${isScanning === computerDetails.computer.id ? "animate-spin text-amber-600" : ""}`} />
                      {isScanning === computerDetails.computer.id ? "Scan em andamento..." : "Scan do Agente"}
                    </button>
                  </div>

                  {/* Device properties */}
                  <div className="grid grid-cols-2 gap-3 text-[11px] bg-[#F2F2F2] p-3 rounded-lg border border-[#D0D0D0]">
                    <div>
                      <span className="block text-[9px] uppercase font-bold text-[#A6A7A7]">Marca do Hardware</span>
                      <span className="font-semibold text-[#212424]">{computerDetails.computer.brand || "Genérico"}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] uppercase font-bold text-[#A6A7A7]">Estrutura do Modelo</span>
                      <span className="font-semibold text-[#212424]">{computerDetails.computer.model || "Unidade Desconhecida"}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] uppercase font-bold text-[#A6A7A7]">Alocação de RAM</span>
                      <span className="font-semibold text-[#212424] font-mono">{computerDetails.computer.ramGB} GB RAM</span>
                    </div>
                    <div>
                      <span className="block text-[9px] uppercase font-bold text-[#A6A7A7]">Tamanho do Armazenamento</span>
                      <span className="font-semibold text-[#212424] font-mono">{computerDetails.computer.storageGB || 256} GB SSD</span>
                    </div>
                    <div>
                      <span className="block text-[9px] uppercase font-bold text-[#A6A7A7]">Matriz do Processador</span>
                      <span className="font-semibold text-[#212424] font-mono">{computerDetails.computer.cores} Núcleos • {computerDetails.computer.cpuModel}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] uppercase font-bold text-[#A6A7A7]">Data do Último Scan</span>
                      <span className="font-semibold text-[#212424] font-mono text-[10px]">
                        {computerDetails.computer.lastActiveDate ? new Date(computerDetails.computer.lastActiveDate).toLocaleString() : "Nunca Escaneado"}
                      </span>
                    </div>
                  </div>

                  {/* HAM Quarantine & Lifecycle Management Actions */}
                  <div className="border border-[#D0D0D0] rounded-lg p-3 space-y-2">
                    <span className="block text-[10px] font-bold text-[#6E7070] uppercase tracking-wide">Ações de Governança ITAM & Quarentena</span>
                    <p className="text-[10px] text-[#A6A7A7] leading-normal">
                      Coloque em quarentena um ativo inativo para isolar licenças, arquive hardware descomissionado ou sinalize como ocioso.
                    </p>
                    <div className="grid grid-cols-2 gap-2 pt-1.5">
                      {computerDetails.computer.lifecycleStatus !== "Active" && (
                        <button
                          onClick={() => handleUpdateLifecycle(computerDetails.computer.id, "Active")}
                          className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded text-center cursor-pointer transition-all border border-emerald-100"
                        >
                          Recuperar Ativo
                        </button>
                      )}
                      {computerDetails.computer.lifecycleStatus !== "Quarantined" && (
                        <button
                          onClick={() => handleUpdateLifecycle(computerDetails.computer.id, "Quarantined")}
                          className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 text-[10px] font-bold rounded text-center cursor-pointer transition-all border border-amber-100"
                        >
                          Colocar em Quarentena
                        </button>
                      )}
                      {computerDetails.computer.lifecycleStatus !== "Inactive" && (
                        <button
                          onClick={() => handleUpdateLifecycle(computerDetails.computer.id, "Inactive")}
                          className="px-2 py-1 bg-[#F2F2F2] hover:bg-[#F2F2F2] text-[#6E7070] text-[10px] font-bold rounded text-center cursor-pointer transition-all border border-[#D0D0D0]"
                        >
                          Sinalizar Inativo
                        </button>
                      )}
                      {computerDetails.computer.lifecycleStatus !== "Archived" && (
                        <button
                          onClick={() => handleUpdateLifecycle(computerDetails.computer.id, "Archived")}
                          className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] font-bold rounded text-center cursor-pointer transition-all border border-rose-100"
                        >
                          Arquivar Ativo
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Discovered Apps on this endpoint */}
                  <div className="space-y-2">
                    <span className="block text-[10px] font-bold text-[#6E7070] uppercase tracking-wide flex items-center justify-between">
                      <span>Apps Detectadas no Endpoint ({computerDetails.applications.length})</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-mono uppercase tracking-widest font-bold" style={{color: "#366BB2", background: "#D1E7F3"}}>Verificado pelo DIS</span>
                    </span>

                    {computerDetails.applications.length === 0 ? (
                      <div className="p-6 bg-[#F2F2F2] text-center rounded-lg border border-dashed border-[#D0D0D0]">
                        <AlertTriangle className="w-5 h-5 text-[#A6A7A7] mx-auto mb-1" />
                        <p className="text-[10px] text-[#6E7070]">Nenhum aplicativo correspondente às assinaturas do catálogo.</p>
                        <button
                          onClick={() => handleTriggerAgentScan(computerDetails.computer.id)}
                          className="mt-2 text-[10px] font-bold hover:underline cursor-pointer" style={{color: "#366BB2"}}
                        >
                          Executar Scan Agora
                        </button>
                      </div>
                    ) : (
                      <div className="max-h-[220px] overflow-y-auto divide-y divide-slate-100 border border-[#D0D0D0] rounded-lg">
                        {computerDetails.applications.map((app) => (
                          <div key={app.id} className="p-2.5 hover:bg-[#F2F2F2] transition-all flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className={`font-bold text-[11px] ${app.catalogItemId ? "text-[#212424]" : "text-[#6E7070]"}`}>
                                  {app.softwareName}
                                </span>
                                  {app.isPrivateCatalogMatch && (
                                  <span className="bg-purple-100 text-purple-800 px-1 py-0.2 rounded text-[8px] font-extrabold uppercase">Privado</span>
                                )}
                              </div>
                              <span className="block text-[9px] text-[#A6A7A7]">Fabricante: {app.publisher} • v{app.version}</span>
                              <span className="block text-[8px] font-mono text-[#A6A7A7] uppercase mt-0.5">Assinatura bruta: "{app.rawSoftwareName}"</span>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="block text-[9px] font-bold font-mono flex items-center justify-end gap-0.5" style={{color: "#366BB2"}}>
                                <Clock className="w-2.5 h-2.5" />
                                {app.usageDurationMinutes} min
                              </span>
                              <span className="block text-[8px] text-[#A6A7A7]">Medição de Uso</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              ) : (
                <div className="p-12 text-center text-[#A6A7A7] flex flex-col items-center justify-center h-full space-y-2">
                  <Info className="w-8 h-8 text-[#A6A7A7]" />
                  <p className="text-xs font-semibold">Nenhum Endpoint Selecionado</p>
                  <p className="text-[10px] leading-normal max-w-xs text-[#A6A7A7]">
                    Selecione um nó de computador gerenciado na lista à esquerda para diagnosticar especificações, monitorar cronogramas de garantia, executar scans Extender sob demanda ou colocar licenças em quarentena.
                  </p>
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB 2: MOBILE REGISTRY */}
        {activeTab === "MOBILES" && (
          <div className="bg-white border border-[#D0D0D0] rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#D0D0D0] pb-3">
              <div>
                <h3 className="font-bold text-[#212424] text-xs uppercase tracking-wider">Ativos Móveis Corporativos Gerenciados</h3>
                <p className="text-[10px] text-[#A6A7A7]">
                  Monitore smartphones, tablets, endpoints de scanners portáteis e cronogramas de garantia vinculados a usuários do Active Directory.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMobiles.length === 0 ? (
                <div className="col-span-full py-12 text-center text-[#A6A7A7] text-xs">
                  Nenhum dispositivo móvel cadastrado nos bancos de rastreamento.
                </div>
              ) : (
                filteredMobiles.map((mob) => (
                  <div key={mob.id} className="border border-[#D0D0D0] rounded-xl p-4 space-y-3 shadow-xs relative hover:border-slate-300 transition-all bg-[#F2F2F2]/40">
                    <button
                      onClick={() => handleDeleteMobile(mob.id)}
                      className="absolute top-4 right-4 text-[#A6A7A7] hover:text-rose-600 transition-all cursor-pointer"
                      title="Desvincular ativo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center font-bold" style={{background: "#D1E7F3", color: "#366BB2"}}>
                        <Smartphone className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-[#212424] text-xs">{mob.name}</h4>
                        <span className="text-[9px] text-[#A6A7A7] font-mono block">Nº de Série: {mob.serialNumber}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px] pt-1">
                      <div>
                        <span className="block text-[#A6A7A7] font-bold uppercase text-[8px]">Especificações</span>
                        <span className="font-semibold text-[#6E7070]">{mob.brand} {mob.model} ({mob.os})</span>
                      </div>
                      <div>
                        <span className="block text-[#A6A7A7] font-bold uppercase text-[8px]">Usuário Principal</span>
                        <span className="font-semibold text-[#6E7070]">{mob.userName}</span>
                      </div>
                      <div>
                        <span className="block text-[#A6A7A7] font-bold uppercase text-[8px]">Cronograma de Garantia</span>
                        <span className={`inline-block px-1.5 py-0.2 rounded font-semibold text-[8px] ${
                          mob.warrantyStatus === "Under Warranty" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                        }`}>
                          {mob.warrantyStatus}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[#A6A7A7] font-bold uppercase text-[8px]">Expiração</span>
                        <span className="font-semibold text-[#6E7070] font-mono text-[9px]">{mob.warrantyExpirationDate || "N/D"}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 3: DISCOVERED APPLICATIONS & USAGE METERING */}
        {activeTab === "DISCOVERED_APPS" && (
          <div className="bg-white border border-[#D0D0D0] rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D0D0D0] pb-3">
              <div>
                <h3 className="font-bold text-[#212424] text-xs uppercase tracking-wider">Software Descoberto em Endpoints & Medição do Núcleo</h3>
                <p className="text-[10px] text-[#A6A7A7]">
                  Registro global de software detectado em endpoints. Inclui sinalização de malware, mapeamento de catálogo de aplicativos privados e medição passiva de duração de uso.
                </p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#A6A7A7]" />
                <input
                  type="text"
                  placeholder="Filtrar software, fabricantes ou assinaturas brutas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs pl-8 pr-3 py-1.5 border border-[#D0D0D0] rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-[#F2F2F2]"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#D0D0D0] text-[10px] font-bold text-[#A6A7A7] uppercase tracking-wider">
                    <th className="py-2.5">Software Descoberto</th>
                    <th className="py-2.5">Fabricante</th>
                    <th className="py-2.5">Host do Endpoint</th>
                    <th className="py-2.5">Qualidade do Reconhecimento</th>
                    <th className="py-2.5 text-right">Medição de Uso</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-[#6E7070]">
                  {filteredDisApps.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-[#A6A7A7]">
                        Nenhum aplicativo descoberto relatado nesta categoria.
                      </td>
                    </tr>
                  ) : (
                    filteredDisApps.map((da) => {
                      const hostComp = computers.find(c => c.id === da.computerId);
                      
                      // Check for malware or alerts based on catalog matching
                      const catMatch = catalogItems.find(c => c.id === da.catalogItemId);
                      const isDanger = catMatch?.isMalware || da.softwareName.toLowerCase().includes("miner") || da.softwareName.toLowerCase().includes("flash");

                      return (
                        <tr key={da.id} className="hover:bg-[#F2F2F2]/50 transition-all">
                          <td className="py-3 font-semibold text-[#212424]">
                            <div className="flex items-center gap-2">
                              {isDanger ? (
                                <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />
                              ) : (
                                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                              )}
                              <div>
                                <span className={`font-bold ${isDanger ? "text-rose-600 font-extrabold" : "text-[#212424]"}`}>
                                  {da.softwareName}
                                </span>
                                <span className="block text-[8px] font-mono text-[#A6A7A7]">Assinatura: "{da.rawSoftwareName}"</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 text-[#6E7070] font-semibold">{da.publisher}</td>
                          <td className="py-3 font-medium text-[#6E7070]">
                            {hostComp ? (
                              <span className="flex items-center gap-1 font-mono text-[11px] text-[#6E7070]">
                                <HardDrive className="w-3.5 h-3.5 text-[#A6A7A7]" />
                                {hostComp.name} ({hostComp.os})
                              </span>
                            ) : (
                              "Host descomissionado"
                            )}
                          </td>
                          <td className="py-3">
                            {da.isPrivateCatalogMatch ? (
                              <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider">
                                App Personalizado Privado
                              </span>
                            ) : da.catalogItemId ? (
                              <span className="bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider">
                                Normalizado pelo DIS
                              </span>
                            ) : (
                              <span className="bg-[#F2F2F2] text-[#6E7070] px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider">
                                Bruto Não Reconhecido
                              </span>
                            )}
                          </td>
                          <td className="py-3 text-right">
                            <span className="font-bold text-[#212424] font-mono">{da.usageDurationMinutes || 0} min</span>
                            <span className="block text-[9px] text-[#A6A7A7]">Último uso: {da.lastUsed ? new Date(da.lastUsed).toLocaleDateString() : "N/D"}</span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: DIS 800K+ CATALOG SEARCH */}
        {activeTab === "DIS_CATALOG" && (
          <div className="bg-white border border-[#D0D0D0] rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D0D0D0] pb-3">
              <div>
                <h3 className="font-bold text-[#212424] text-xs uppercase tracking-wider">Catálogo do Data Intelligence Service (mais de 800 mil títulos reconhecidos)</h3>
                <p className="text-[10px] text-[#A6A7A7]">
                  Repositório global de assinaturas oficiais de produtos de fornecedores, SKUs padrão, políticas de ciclo de vida (EOL/EOS), assinaturas de malware e especificações de suporte a SO.
                </p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#A6A7A7]" />
                <input
                  type="text"
                  placeholder="Pesquisar no catálogo por software, fabricante, SKU..."
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  className="w-full text-xs pl-8 pr-3 py-1.5 border border-[#D0D0D0] rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-[#F2F2F2]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredCatalog.map((item) => {
                const category = categories.find(cat => cat.id === item.categoryId)?.name || "Utilitário";
                const isThreat = item.isMalware;

                return (
                  <div 
                    key={item.id} 
                    className={`border rounded-xl p-4 shadow-xs relative transition-all ${
                      isThreat 
                        ? "bg-rose-50/20 border-rose-200 hover:border-rose-300" 
                        : "bg-[#F2F2F2]/30 border-[#D0D0D0] hover:border-slate-300"
                    }`}
                  >
                    {isThreat && (
                      <span className="absolute top-4 right-4 bg-rose-100 text-rose-800 px-2 py-0.5 rounded text-[8px] font-extrabold uppercase flex items-center gap-1">
                        <ShieldAlert className="w-2.5 h-2.5" /> Alto Risco / Malware
                      </span>
                    )}

                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isThreat ? "bg-rose-100 text-rose-700" : "bg-[#D1E7F3] text-[#366BB2]"
                      }`}>
                        <Building className="w-4 h-4" />
                      </div>
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <h4 className={`font-bold text-xs truncate ${isThreat ? "text-rose-800" : "text-[#212424]"}`}>
                          {item.softwareName}
                        </h4>
                        <p className="text-[10px] text-[#6E7070] font-semibold">{item.publisher}</p>
                        
                        <div className="grid grid-cols-2 gap-2 text-[10px] pt-1 border-t border-[#D0D0D0] mt-2">
                          <div>
                            <span className="text-[#A6A7A7] block font-bold text-[8px] uppercase">SKU Padrão</span>
                            <span className="font-mono text-[#6E7070]">{item.defaultSku || "N/D"}</span>
                          </div>
                          <div>
                            <span className="text-[#A6A7A7] block font-bold text-[8px] uppercase">Categoria</span>
                            <span className="font-semibold text-[#6E7070]">{category}</span>
                          </div>
                          <div>
                            <span className="text-[#A6A7A7] block font-bold text-[8px] uppercase">Data de EOL</span>
                            <span className="font-semibold text-rose-600 font-mono">{item.eolDate || "Nenhum EOL agendado"}</span>
                          </div>
                          <div>
                            <span className="text-[#A6A7A7] block font-bold text-[8px] uppercase">Compatibilidade</span>
                            <span className="font-semibold text-[#6E7070]">{item.compatibleOS.join(", ")}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 5: PRIVATE CATALOGUE */}
        {activeTab === "PRIVATE_CATALOG" && (
          <div className="bg-white border border-[#D0D0D0] rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#D0D0D0] pb-3">
              <div>
                <h3 className="font-bold text-[#212424] text-xs uppercase tracking-wider">Assinaturas de Aplicativos Personalizados Privados</h3>
                <p className="text-[10px] text-[#A6A7A7]">
                  Registre ferramentas proprietárias internas ou URLs personalizadas. Os mecanismos de scan mapeiam instantaneamente ocorrências de strings brutas em endpoints para estas definições.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {privateCatalog.length === 0 ? (
                <div className="p-8 text-center text-[#A6A7A7] text-xs">
                  Nenhuma regra de reconhecimento personalizada registrada ainda. Clique em "Adicionar Reconhecimento de Padrão" acima.
                </div>
              ) : (
                privateCatalog.map((p) => {
                  const catName = categories.find(cat => cat.id === p.categoryId)?.name || "Personalizado Corporativo";
                  return (
                    <div key={p.id} className="border border-[#D0D0D0] hover:border-slate-300 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#F2F2F2]/40">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-[#212424] text-xs">{p.softwareName}</h4>
                          <span className="bg-purple-100 text-purple-800 px-1.5 py-0.2 rounded text-[8px] font-bold uppercase">Padrão Privado</span>
                        </div>
                        <span className="block text-[10px] text-[#6E7070] font-semibold">Fornecedor Registrado: {p.publisher} • Categoria: {catName}</span>
                        <div className="pt-1 flex items-center gap-1">
                          <span className="text-[9px] text-[#A6A7A7] uppercase font-bold">Correspondência Regex / Substring:</span>
                          <span className="bg-[#F2F2F2] px-2 py-0.5 rounded font-mono text-[10px] font-bold border border-[#D0D0D0]" style={{color: "#4079C4"}}>
                            {p.matchPattern}
                          </span>
                        </div>
                        {p.notes && <p className="text-[10px] text-[#A6A7A7] mt-1 italic">"{p.notes}"</p>}
                      </div>

                      <button
                        onClick={() => handleDeletePrivateItem(p.id)}
                        className="px-2.5 py-1.5 border border-rose-200 hover:bg-rose-50 text-rose-600 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remover Regra
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

      </div>

      {/* ------------------------------------------------------------- */}
      {/* MODAL WINDOWS                                                 */}
      {/* ------------------------------------------------------------- */}

      {/* CREATE COMPUTER MODAL */}
      {showAddComputerModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white border border-[#D0D0D0] rounded-xl shadow-xl w-full max-w-lg overflow-hidden"
          >
            <form onSubmit={handleAddComputer}>
              <div className="px-6 py-4 border-b border-[#D0D0D0] flex items-center justify-between">
                <h3 className="font-bold text-[#212424] text-sm flex items-center gap-1.5">
                  <HardDrive className="w-4 h-4" style={{color: "#366BB2"}} /> Cadastrar Nó Gerenciado (Computador/Servidor)
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAddComputerModal(false)}
                  className="text-[#A6A7A7] hover:text-[#6E7070] font-bold text-lg"
                >
                  &times;
                </button>
              </div>

              <div className="p-6 space-y-4 max-h-[450px] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-[#6E7070] uppercase">Hostname do Computador</label>
                    <input
                      type="text"
                      required
                      placeholder="ex.: SRV-ACTIVE-01"
                      value={newCompName}
                      onChange={(e) => setNewCompName(e.target.value)}
                      className="w-full text-xs border border-[#D0D0D0] rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white mt-1"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#6E7070] uppercase">Sistema Operacional</label>
                    <select
                      value={newCompOS}
                      onChange={(e) => setNewCompOS(e.target.value as any)}
                      className="w-full text-xs border border-[#D0D0D0] rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white mt-1"
                    >
                      <option value="Windows">Windows</option>
                      <option value="Linux">Linux</option>
                      <option value="macOS">macOS</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-[#6E7070] uppercase">Marca / Fabricante</label>
                    <input
                      type="text"
                      placeholder="ex.: Dell"
                      value={newCompBrand}
                      onChange={(e) => setNewCompBrand(e.target.value)}
                      className="w-full text-xs border border-[#D0D0D0] rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white mt-1"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#6E7070] uppercase">Especificação do Modelo</label>
                    <input
                      type="text"
                      placeholder="ex.: PowerEdge R750"
                      value={newCompModel}
                      onChange={(e) => setNewCompModel(e.target.value)}
                      className="w-full text-xs border border-[#D0D0D0] rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-[#6E7070] uppercase">Núcleos</label>
                    <input
                      type="number"
                      min="1"
                      value={newCompCores}
                      onChange={(e) => setNewCompCores(Number(e.target.value))}
                      className="w-full text-xs border border-[#D0D0D0] rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white mt-1 text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#6E7070] uppercase">RAM (GB)</label>
                    <input
                      type="number"
                      min="1"
                      value={newCompRam}
                      onChange={(e) => setNewCompRam(Number(e.target.value))}
                      className="w-full text-xs border border-[#D0D0D0] rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white mt-1 text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#6E7070] uppercase">Armazenamento (GB)</label>
                    <input
                      type="number"
                      min="1"
                      value={newCompStorage}
                      onChange={(e) => setNewCompStorage(Number(e.target.value))}
                      className="w-full text-xs border border-[#D0D0D0] rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white mt-1 text-center"
                    />
                  </div>
                </div>

                <div>
                    <label className="block text-[10px] font-bold text-[#6E7070] uppercase">Modelo da CPU</label>
                  <input
                    type="text"
                    placeholder="ex.: Intel Xeon Platinum 8380"
                    value={newCompCpu}
                    onChange={(e) => setNewCompCpu(e.target.value)}
                    className="w-full text-xs border border-[#D0D0D0] rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-[#D0D0D0] pt-3">
                  <div>
                    <label className="block text-[10px] font-bold text-[#6E7070] uppercase">Esquema de Garantia</label>
                    <select
                      value={newCompWarranty}
                      onChange={(e) => setNewCompWarranty(e.target.value as any)}
                      className="w-full text-xs border border-[#D0D0D0] rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white mt-1"
                    >
                      <option value="Under Warranty">Sob Garantia</option>
                      <option value="Expired">Expirada</option>
                      <option value="No Info">Sem Informação</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#6E7070] uppercase">Data de Expiração</label>
                    <input
                      type="date"
                      value={newCompWarrantyDate}
                      onChange={(e) => setNewCompWarrantyDate(e.target.value)}
                      className="w-full text-xs border border-[#D0D0D0] rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white mt-1"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-[#F2F2F2] px-6 py-4 border-t border-[#D0D0D0] flex justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAddComputerModal(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-[#6E7070] hover:text-[#212424] bg-white border border-[#D0D0D0] rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white rounded-lg cursor-pointer shadow-sm" style={{background: "#366BB2"}}
                >
                  Salvar Nó de Hardware
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* CREATE MOBILE MODAL */}
      {showAddMobileModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white border border-[#D0D0D0] rounded-xl shadow-xl w-full max-w-lg overflow-hidden"
          >
            <form onSubmit={handleAddMobile}>
              <div className="px-6 py-4 border-b border-[#D0D0D0] flex items-center justify-between">
                <h3 className="font-bold text-[#212424] text-sm flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4" style={{color: "#366BB2"}} /> Cadastrar Ativo Móvel Corporativo
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAddMobileModal(false)}
                  className="text-[#A6A7A7] hover:text-[#6E7070] font-bold text-lg"
                >
                  &times;
                </button>
              </div>

              <div className="p-6 space-y-4 max-h-[450px] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-[#6E7070] uppercase">Nome do Dispositivo Host</label>
                    <input
                      type="text"
                      required
                      placeholder="ex.: IPHONE-EB-02"
                      value={newMobName}
                      onChange={(e) => setNewMobName(e.target.value)}
                      className="w-full text-xs border border-[#D0D0D0] rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white mt-1"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#6E7070] uppercase">SO (Firmware)</label>
                    <input
                      type="text"
                      placeholder="ex.: iOS 17.5"
                      value={newMobOS}
                      onChange={(e) => setNewMobOS(e.target.value)}
                      className="w-full text-xs border border-[#D0D0D0] rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-[#6E7070] uppercase">Marca / Fabricante</label>
                    <input
                      type="text"
                      placeholder="ex.: Apple"
                      value={newMobBrand}
                      onChange={(e) => setNewMobBrand(e.target.value)}
                      className="w-full text-xs border border-[#D0D0D0] rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white mt-1"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#6E7070] uppercase">Modelo</label>
                    <input
                      type="text"
                      placeholder="ex.: iPhone 15 Pro"
                      value={newMobModel}
                      onChange={(e) => setNewMobModel(e.target.value)}
                      className="w-full text-xs border border-[#D0D0D0] rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-[#6E7070] uppercase">Número de Série</label>
                    <input
                      type="text"
                      placeholder="ex.: SN-MOB-99212"
                      value={newMobSerial}
                      onChange={(e) => setNewMobSerial(e.target.value)}
                      className="w-full text-xs border border-[#D0D0D0] rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white mt-1"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#6E7070] uppercase">E-mail do Usuário Vinculado</label>
                    <input
                      type="email"
                      placeholder="ex.: ericob3ware@gmail.com"
                      value={newMobUser}
                      onChange={(e) => setNewMobUser(e.target.value)}
                      className="w-full text-xs border border-[#D0D0D0] rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-[#D0D0D0] pt-3">
                  <div>
                    <label className="block text-[10px] font-bold text-[#6E7070] uppercase">Esquema de Garantia</label>
                    <select
                      value={newMobWarranty}
                      onChange={(e) => setNewMobWarranty(e.target.value as any)}
                      className="w-full text-xs border border-[#D0D0D0] rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white mt-1"
                    >
                      <option value="Under Warranty">Sob Garantia</option>
                      <option value="Expired">Expirada</option>
                      <option value="No Info">Sem Informação</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#6E7070] uppercase">Data de Expiração</label>
                    <input
                      type="date"
                      value={newMobWarrantyDate}
                      onChange={(e) => setNewMobWarrantyDate(e.target.value)}
                      className="w-full text-xs border border-[#D0D0D0] rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white mt-1"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-[#F2F2F2] px-6 py-4 border-t border-[#D0D0D0] flex justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAddMobileModal(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-[#6E7070] hover:text-[#212424] bg-white border border-[#D0D0D0] rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white rounded-lg cursor-pointer shadow-sm" style={{background: "#366BB2"}}
                >
                  Cadastrar Dispositivo Móvel
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* CREATE PRIVATE CATALOG RULE MODAL */}
      {showAddPrivateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white border border-[#D0D0D0] rounded-xl shadow-xl w-full max-w-lg overflow-hidden"
          >
            <form onSubmit={handleAddPrivatePattern}>
              <div className="px-6 py-4 border-b border-[#D0D0D0] flex items-center justify-between">
                <h3 className="font-bold text-[#212424] text-sm flex items-center gap-1.5">
                  <PlusCircle className="w-4 h-4" style={{color: "#366BB2"}} /> Criar Regra de Correspondência de Reconhecimento
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAddPrivateModal(false)}
                  className="text-[#A6A7A7] hover:text-[#6E7070] font-bold text-lg"
                >
                  &times;
                </button>
              </div>

              <div className="p-6 space-y-4 max-h-[450px] overflow-y-auto">
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-[#6E7070] uppercase">Nome do Aplicativo Personalizado</label>
                    <input
                      type="text"
                      required
                      placeholder="ex.: Corporate TimeTracker"
                      value={privAppName}
                      onChange={(e) => setPrivAppName(e.target.value)}
                      className="w-full text-xs border border-[#D0D0D0] rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white mt-1"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#6E7070] uppercase">Fabricante / Fornecedor</label>
                    <input
                      type="text"
                      required
                      placeholder="ex.: Internal IT Systems"
                      value={privPublisher}
                      onChange={(e) => setPrivPublisher(e.target.value)}
                      className="w-full text-xs border border-[#D0D0D0] rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white mt-1"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#6E7070] uppercase">Categoria</label>
                    <select
                      value={privCategory}
                      onChange={(e) => setPrivCategory(e.target.value)}
                      className="w-full text-xs border border-[#D0D0D0] rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white mt-1"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#6E7070] uppercase">Padrão de Correspondência (Substring)</label>
                    <input
                      type="text"
                      required
                      placeholder="ex.: timetracker.internal (mapeia qualquer string bruta que contenha este padrão)"
                      value={privPattern}
                      onChange={(e) => setPrivPattern(e.target.value)}
                      className="w-full text-xs border border-[#D0D0D0] rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-[#F2F2F2] font-mono text-indigo-700 font-bold mt-1"
                    />
                    <p className="text-[9px] text-[#A6A7A7] mt-1">
                      Se um agente on-premises detectar um valor de registro, caminho de arquivo ou processo de navegador contendo este padrão exato, o DIS o normaliza automaticamente para este modelo de aplicativo privado.
                    </p>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#6E7070] uppercase">Observações Especiais de Ingestão</label>
                    <textarea
                      placeholder="Insira observações especiais de inventário interno, caminhos de downgrade ou contatos de suporte."
                      value={privNotes}
                      onChange={(e) => setPrivNotes(e.target.value)}
                      rows={2}
                      className="w-full text-xs border border-[#D0D0D0] rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white mt-1"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-[#F2F2F2] px-6 py-4 border-t border-[#D0D0D0] flex justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAddPrivateModal(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-[#6E7070] hover:text-[#212424] bg-white border border-[#D0D0D0] rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white rounded-lg cursor-pointer shadow-sm" style={{background: "#366BB2"}}
                >
                  Salvar Regra de Ingestão
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

    </div>
  );
}
