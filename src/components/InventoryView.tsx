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

interface InventoryViewProps {
  onRefreshAll: () => void;
}

export function InventoryView({ onRefreshAll }: InventoryViewProps) {
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
    showNotification("info", "Executing Snow Extender Agent Inventory collection scan on target endpoint...");
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
        showNotification("error", "Agent failed to respond or scan was rejected.");
      }
    } catch (e) {
      showNotification("error", "Connection error with agent secure gateway.");
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
        showNotification("success", `Lifecycle status updated successfully to: ${status}`);
        const updatedComp = await res.json();
        
        // update local list
        setComputers(prev => prev.map(c => c.id === compId ? updatedComp : c));
        if (selectedComputer?.id === compId) {
          setSelectedComputer(updatedComp);
        }
        onRefreshAll();
      }
    } catch (e) {
      showNotification("error", "Failed to update lifecycle.");
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
        showNotification("success", "Custom endpoint added to IT inventory catalogue.");
        setShowAddComputerModal(false);
        setNewCompName("");
        loadInventoryData();
      } else {
        showNotification("error", "Failed to register custom device.");
      }
    } catch (e) {
      showNotification("error", "Internal network error.");
    }
  };

  const handleDeleteComputer = async (compId: string) => {
    if (!confirm("Are you sure you want to remove this hardware asset? This wipes all discovered software logs for it.")) return;
    try {
      const res = await fetch(`/api/computers/${compId}`, { method: "DELETE" });
      if (res.ok) {
        showNotification("success", "Hardware asset decommissioned successfully.");
        setSelectedComputer(null);
        setComputerDetails(null);
        loadInventoryData();
        onRefreshAll();
      }
    } catch (e) {
      showNotification("error", "Error decommissioning hardware asset.");
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
        showNotification("success", "Mobile device enrolled successfully in HAM registry.");
        setShowAddMobileModal(false);
        setNewMobName("");
        setNewMobUser("");
        setNewMobSerial("");
        loadInventoryData();
      }
    } catch (e) {
      showNotification("error", "Failed to enroll mobile device.");
    }
  };

  const handleDeleteMobile = async (id: string) => {
    if (!confirm("Remove this mobile device from asset tracking?")) return;
    try {
      const res = await fetch(`/api/mobile-devices/${id}`, { method: "DELETE" });
      if (res.ok) {
        showNotification("success", "Mobile device tracking stopped.");
        loadInventoryData();
      }
    } catch (e) {
      showNotification("error", "Failed to remove device.");
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
        showNotification("success", "Private Application Recognition rule added. Next scans will map it!");
        setShowAddPrivateModal(false);
        setPrivAppName("");
        setPrivPublisher("");
        setPrivPattern("");
        setPrivNotes("");
        loadInventoryData();
      }
    } catch (e) {
      showNotification("error", "Failed to add custom recognition pattern.");
    }
  };

  const handleDeletePrivateItem = async (id: string) => {
    if (!confirm("Are you sure you want to delete this custom recognition rule?")) return;
    try {
      const res = await fetch(`/api/private-catalog/${id}`, { method: "DELETE" });
      if (res.ok) {
        showNotification("success", "Private catalog recognition rule deleted.");
        loadInventoryData();
      }
    } catch (e) {
      showNotification("error", "Failed to delete pattern.");
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
            : "bg-[#D1E7F3] border-[#D1E7F3] text-[#00549F]"
        }`}>
          {notif.type === "success" ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <Info className="w-4 h-4" />}
          <span>{notif.msg}</span>
        </div>
      )}

      {/* Hero Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <HardDrive className="w-6 h-6" style={{color: "#00549F"}} />
          DIS Asset Intelligence & HAM Core
        </h1>
        <p className="text-slate-500 text-sm">
          Snow Atlas equivalent Data Intelligence Service catalogue for software recognition combined with Hardware Asset lifecycle governance.
        </p>
      </div>

      {/* Global Inventory Health KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[10px] uppercase font-bold text-slate-400">Active Endpoints</span>
            <span className="text-lg font-bold text-slate-800">{activeCompCount} <span className="text-xs text-slate-400">devices</span></span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[10px] uppercase font-bold text-slate-400">Quarantined</span>
            <span className="text-lg font-bold text-slate-800">{quarantinedCompCount} <span className="text-xs text-slate-400">assets</span></span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[10px] uppercase font-bold text-slate-400">Inactive / Idle</span>
            <span className="text-lg font-bold text-slate-800">{inactiveCompCount} <span className="text-xs text-slate-400">flagged</span></span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{background: "#D1E7F3", color: "#00549F"}}>
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[10px] uppercase font-bold text-slate-400">Under Warranty</span>
            <span className="text-lg font-bold text-slate-800">{underWarrantyCount} <span className="text-xs text-slate-400">covered</span></span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-4">
          <button
            onClick={() => { setActiveTab("COMPUTERS"); setSelectedComputer(null); setComputerDetails(null); }}
            className={`pb-3 text-xs font-semibold uppercase border-b-2 transition-all cursor-pointer ${
              activeTab === "COMPUTERS" 
          ? "border-[#00549F] text-[#00549F]" 
          : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <span className="flex items-center gap-1.5"><HardDrive className="w-3.5 h-3.5" /> Computers & Server Nodes</span>
          </button>
          
          <button
            onClick={() => { setActiveTab("MOBILES"); }}
            className={`pb-3 text-xs font-semibold uppercase border-b-2 transition-all cursor-pointer ${
              activeTab === "MOBILES" 
                ? "border-[#00549F] text-[#00549F]" 
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <span className="flex items-center gap-1.5"><Smartphone className="w-3.5 h-3.5" /> Mobile Registry (HAM)</span>
          </button>

          <button
            onClick={() => { setActiveTab("DISCOVERED_APPS"); }}
            className={`pb-3 text-xs font-semibold uppercase border-b-2 transition-all cursor-pointer ${
              activeTab === "DISCOVERED_APPS" 
                ? "border-[#00549F] text-[#00549F]" 
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <span className="flex items-center gap-1.5"><Layers className="w-3.5 h-3.5" /> Discovered Apps & Metering</span>
          </button>

          <button
            onClick={() => { setActiveTab("DIS_CATALOG"); }}
            className={`pb-3 text-xs font-semibold uppercase border-b-2 transition-all cursor-pointer ${
              activeTab === "DIS_CATALOG" 
                ? "border-[#00549F] text-[#00549F]" 
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <span className="flex items-center gap-1.5"><Building className="w-3.5 h-3.5" /> DIS 800K+ Catalog Search</span>
          </button>

          <button
            onClick={() => { setActiveTab("PRIVATE_CATALOG"); }}
            className={`pb-3 text-xs font-semibold uppercase border-b-2 transition-all cursor-pointer ${
              activeTab === "PRIVATE_CATALOG" 
                ? "border-[#00549F] text-[#00549F]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <span className="flex items-center gap-1.5"><Settings className="w-3.5 h-3.5" /> Private Catalog Rules</span>
          </button>
        </div>

        {/* Tab Actions */}
        <div className="pb-2.5">
          {activeTab === "COMPUTERS" && (
            <button
              onClick={() => setShowAddComputerModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-sm transition-all" style={{background: "#00549F"}}
            >
              <Plus className="w-4 h-4" /> Enregister Server/PC
            </button>
          )}
          {activeTab === "MOBILES" && (
            <button
              onClick={() => setShowAddMobileModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-sm transition-all" style={{background: "#00549F"}}
            >
              <Plus className="w-4 h-4" /> Enroll Mobile Asset
            </button>
          )}
          {activeTab === "PRIVATE_CATALOG" && (
            <button
              onClick={() => setShowAddPrivateModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-sm transition-all" style={{background: "#00549F"}}
            >
              <PlusCircle className="w-4 h-4" /> Add Pattern Recognition
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
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by Computer Name, Serial Number, OS, or Manufacturer..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full text-xs pl-9 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50"
                  />
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="py-2.5">Endpoint Name</th>
                        <th className="py-2.5">Hardware / Specs</th>
                        <th className="py-2.5">Warranty Status</th>
                        <th className="py-2.5 text-center">Lifecycle Status</th>
                        <th className="py-2.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                      {filteredComputers.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-400">
                            No matching computer endpoints found in HAM registry.
                          </td>
                        </tr>
                      ) : (
                        filteredComputers.map((comp) => {
                          const isSelected = selectedComputer?.id === comp.id;
                          return (
                            <tr 
                              key={comp.id}
                              onClick={() => handleSelectComputer(comp)}
                              className={`hover:bg-slate-50/80 transition-all cursor-pointer ${isSelected ? "bg-indigo-50/40" : ""}`}
                            >
                              <td className="py-3 font-semibold text-slate-800">
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
                                    <span className="block font-bold text-slate-800">{comp.name}</span>
                                    <span className="text-[10px] text-slate-400 font-mono">{comp.serialNumber || "No Serial"}</span>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3">
                                <div className="text-[11px]">
                                  <span className="font-semibold">{comp.brand} {comp.model}</span>
                                  <span className="block text-[10px] text-slate-400 font-mono">{comp.cores} Cores • {comp.ramGB}GB RAM • {comp.os}</span>
                                </div>
                              </td>
                              <td className="py-3">
                                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                                  comp.warrantyStatus === "Under Warranty"
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                    : comp.warrantyStatus === "Expired"
                                    ? "bg-rose-50 text-rose-700 border border-rose-100"
                                    : "bg-slate-100 text-slate-600"
                                }`}>
                                  {comp.warrantyStatus}
                                </span>
                                {comp.warrantyExpirationDate && (
                                  <span className="block text-[9px] text-slate-400 font-mono mt-0.5">Exp: {comp.warrantyExpirationDate}</span>
                                )}
                              </td>
                              <td className="py-3 text-center">
                                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                  comp.lifecycleStatus === "Active" 
                                    ? "bg-emerald-100 text-emerald-800" 
                                    : comp.lifecycleStatus === "Quarantined"
                                    ? "bg-amber-100 text-amber-800"
                                    : comp.lifecycleStatus === "Inactive"
                                    ? "bg-slate-100 text-slate-600"
                                    : "bg-slate-200 text-slate-800"
                                }`}>
                                  {comp.lifecycleStatus}
                                </span>
                              </td>
                              <td className="py-3 text-right" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => handleTriggerAgentScan(comp.id)}
                                    disabled={isScanning !== null}
                                    className="p-1 rounded transition-all cursor-pointer" style={{color: "#00549F"}}
                                    title="Trigger secure agent on-premises scan (Snow Extender Agent)"
                                  >
                                    <RefreshCw className={`w-3.5 h-3.5 ${isScanning === comp.id ? "animate-spin text-amber-600" : ""}`} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteComputer(comp.id)}
                                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-all cursor-pointer"
                                    title="Decommission Hardware Asset"
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
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4 min-h-[400px]">
              {selectedComputer && computerDetails ? (
                <div className="space-y-4">
                  <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{computerDetails.computer.name}</h3>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block">Endpoint Deep Diagnostics</span>
                    </div>
                    <button
                      onClick={() => handleTriggerAgentScan(computerDetails.computer.id)}
                      disabled={isScanning !== null}
                      className="px-2.5 py-1 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all" style={{background: "#D1E7F3", color: "#1468B3"}}
                    >
                      <RefreshCw className={`w-3 h-3 ${isScanning === computerDetails.computer.id ? "animate-spin text-amber-600" : ""}`} />
                      {isScanning === computerDetails.computer.id ? "Scanning..." : "Agent Scan"}
                    </button>
                  </div>

                  {/* Device properties */}
                  <div className="grid grid-cols-2 gap-3 text-[11px] bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <div>
                      <span className="block text-[9px] uppercase font-bold text-slate-400">Hardware Brand</span>
                      <span className="font-semibold text-slate-800">{computerDetails.computer.brand || "Generic"}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] uppercase font-bold text-slate-400">Model Structure</span>
                      <span className="font-semibold text-slate-800">{computerDetails.computer.model || "Unknown Unit"}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] uppercase font-bold text-slate-400">RAM Allocation</span>
                      <span className="font-semibold text-slate-800 font-mono">{computerDetails.computer.ramGB} GB RAM</span>
                    </div>
                    <div>
                      <span className="block text-[9px] uppercase font-bold text-slate-400">Storage Size</span>
                      <span className="font-semibold text-slate-800 font-mono">{computerDetails.computer.storageGB || 256} GB SSD</span>
                    </div>
                    <div>
                      <span className="block text-[9px] uppercase font-bold text-slate-400">Processor Matrix</span>
                      <span className="font-semibold text-slate-800 font-mono">{computerDetails.computer.cores} Cores • {computerDetails.computer.cpuModel}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] uppercase font-bold text-slate-400">Last Scanned Date</span>
                      <span className="font-semibold text-slate-800 font-mono text-[10px]">
                        {computerDetails.computer.lastActiveDate ? new Date(computerDetails.computer.lastActiveDate).toLocaleString() : "Never Scanned"}
                      </span>
                    </div>
                  </div>

                  {/* HAM Quarantine & Lifecycle Management Actions */}
                  <div className="border border-slate-200 rounded-lg p-3 space-y-2">
                    <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">ITAM Governance & Quarantine Actions</span>
                    <p className="text-[10px] text-slate-400 leading-normal">
                      quarantine an inactive asset to isolate licenses, archive decommissioned hardware, or flag as idle.
                    </p>
                    <div className="grid grid-cols-2 gap-2 pt-1.5">
                      {computerDetails.computer.lifecycleStatus !== "Active" && (
                        <button
                          onClick={() => handleUpdateLifecycle(computerDetails.computer.id, "Active")}
                          className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded text-center cursor-pointer transition-all border border-emerald-100"
                        >
                          Recover Active
                        </button>
                      )}
                      {computerDetails.computer.lifecycleStatus !== "Quarantined" && (
                        <button
                          onClick={() => handleUpdateLifecycle(computerDetails.computer.id, "Quarantined")}
                          className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 text-[10px] font-bold rounded text-center cursor-pointer transition-all border border-amber-100"
                        >
                          Quarantine Device
                        </button>
                      )}
                      {computerDetails.computer.lifecycleStatus !== "Inactive" && (
                        <button
                          onClick={() => handleUpdateLifecycle(computerDetails.computer.id, "Inactive")}
                          className="px-2 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 text-[10px] font-bold rounded text-center cursor-pointer transition-all border border-slate-200"
                        >
                          Flag Inactive
                        </button>
                      )}
                      {computerDetails.computer.lifecycleStatus !== "Archived" && (
                        <button
                          onClick={() => handleUpdateLifecycle(computerDetails.computer.id, "Archived")}
                          className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] font-bold rounded text-center cursor-pointer transition-all border border-rose-100"
                        >
                          Archive Asset
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Discovered Apps on this endpoint */}
                  <div className="space-y-2">
                    <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide flex items-center justify-between">
                      <span>Detected Apps on Endpoint ({computerDetails.applications.length})</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-mono uppercase tracking-widest font-bold" style={{color: "#00549F", background: "#D1E7F3"}}>DIS Verified</span>
                    </span>

                    {computerDetails.applications.length === 0 ? (
                      <div className="p-6 bg-slate-50 text-center rounded-lg border border-dashed border-slate-200">
                        <AlertTriangle className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                        <p className="text-[10px] text-slate-500">No applications matching catalog signatures.</p>
                        <button
                          onClick={() => handleTriggerAgentScan(computerDetails.computer.id)}
                          className="mt-2 text-[10px] font-bold hover:underline cursor-pointer" style={{color: "#00549F"}}
                        >
                          Run Scan Now
                        </button>
                      </div>
                    ) : (
                      <div className="max-h-[220px] overflow-y-auto divide-y divide-slate-100 border border-slate-100 rounded-lg">
                        {computerDetails.applications.map((app) => (
                          <div key={app.id} className="p-2.5 hover:bg-slate-50 transition-all flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className={`font-bold text-[11px] ${app.catalogItemId ? "text-slate-800" : "text-slate-500"}`}>
                                  {app.softwareName}
                                </span>
                                {app.isPrivateCatalogMatch && (
                                  <span className="bg-purple-100 text-purple-800 px-1 py-0.2 rounded text-[8px] font-extrabold uppercase">Private</span>
                                )}
                              </div>
                              <span className="block text-[9px] text-slate-400">Publisher: {app.publisher} • v{app.version}</span>
                              <span className="block text-[8px] font-mono text-slate-400 uppercase mt-0.5">Raw signature: "{app.rawSoftwareName}"</span>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="block text-[9px] font-bold font-mono flex items-center justify-end gap-0.5" style={{color: "#00549F"}}>
                                <Clock className="w-2.5 h-2.5" />
                                {app.usageDurationMinutes} min
                              </span>
                              <span className="block text-[8px] text-slate-400">Usage Metering</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              ) : (
                <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center h-full space-y-2">
                  <Info className="w-8 h-8 text-slate-300" />
                  <p className="text-xs font-semibold">No Endpoint Selected</p>
                  <p className="text-[10px] leading-normal max-w-xs text-slate-400">
                    Select a managed computer node on the left list to diagnose specs, monitor warranty schedules, perform on-demand Extender scans, or quarantine licenses.
                  </p>
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB 2: MOBILE REGISTRY */}
        {activeTab === "MOBILES" && (
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Managed Corporate Mobile Assets</h3>
                <p className="text-[10px] text-slate-400">
                  Track smartphones, tablets, handheld scanner endpoints and warranty schedules linked with Active Directory users.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMobiles.length === 0 ? (
                <div className="col-span-full py-12 text-center text-slate-400 text-xs">
                  No mobile devices enrolled in tracking databases.
                </div>
              ) : (
                filteredMobiles.map((mob) => (
                  <div key={mob.id} className="border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs relative hover:border-slate-300 transition-all bg-slate-50/40">
                    <button
                      onClick={() => handleDeleteMobile(mob.id)}
                      className="absolute top-4 right-4 text-slate-400 hover:text-rose-600 transition-all cursor-pointer"
                      title="De-enroll asset"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center font-bold" style={{background: "#D1E7F3", color: "#00549F"}}>
                        <Smartphone className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-xs">{mob.name}</h4>
                        <span className="text-[9px] text-slate-400 font-mono block">Serial: {mob.serialNumber}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px] pt-1">
                      <div>
                        <span className="block text-slate-400 font-bold uppercase text-[8px]">Specs</span>
                        <span className="font-semibold text-slate-700">{mob.brand} {mob.model} ({mob.os})</span>
                      </div>
                      <div>
                        <span className="block text-slate-400 font-bold uppercase text-[8px]">Primary User</span>
                        <span className="font-semibold text-slate-700">{mob.userName}</span>
                      </div>
                      <div>
                        <span className="block text-slate-400 font-bold uppercase text-[8px]">Warranty Schedule</span>
                        <span className={`inline-block px-1.5 py-0.2 rounded font-semibold text-[8px] ${
                          mob.warrantyStatus === "Under Warranty" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                        }`}>
                          {mob.warrantyStatus}
                        </span>
                      </div>
                      <div>
                        <span className="block text-slate-400 font-bold uppercase text-[8px]">Expiration</span>
                        <span className="font-semibold text-slate-700 font-mono text-[9px]">{mob.warrantyExpirationDate || "N/A"}</span>
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
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Discovered Endpoint Software & Core Metering</h3>
                <p className="text-[10px] text-slate-400">
                  Global ledger of software detected on endpoints. Features malware flagging, private application catalog mapping, and passive usage duration metering.
                </p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter software, publishers, or raw signatures..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-2.5">Discovered Software</th>
                    <th className="py-2.5">Publisher</th>
                    <th className="py-2.5">Endpoint Host</th>
                    <th className="py-2.5">Recognition Quality</th>
                    <th className="py-2.5 text-right">Usage Metering</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {filteredDisApps.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400">
                        No discovered applications reported in this category.
                      </td>
                    </tr>
                  ) : (
                    filteredDisApps.map((da) => {
                      const hostComp = computers.find(c => c.id === da.computerId);
                      
                      // Check for malware or alerts based on catalog matching
                      const catMatch = catalogItems.find(c => c.id === da.catalogItemId);
                      const isDanger = catMatch?.isMalware || da.softwareName.toLowerCase().includes("miner") || da.softwareName.toLowerCase().includes("flash");

                      return (
                        <tr key={da.id} className="hover:bg-slate-50/50 transition-all">
                          <td className="py-3 font-semibold text-slate-800">
                            <div className="flex items-center gap-2">
                              {isDanger ? (
                                <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />
                              ) : (
                                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                              )}
                              <div>
                                <span className={`font-bold ${isDanger ? "text-rose-600 font-extrabold" : "text-slate-800"}`}>
                                  {da.softwareName}
                                </span>
                                <span className="block text-[8px] font-mono text-slate-400">Signature: "{da.rawSoftwareName}"</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 text-slate-600 font-semibold">{da.publisher}</td>
                          <td className="py-3 font-medium text-slate-600">
                            {hostComp ? (
                              <span className="flex items-center gap-1 font-mono text-[11px] text-slate-700">
                                <HardDrive className="w-3.5 h-3.5 text-slate-400" />
                                {hostComp.name} ({hostComp.os})
                              </span>
                            ) : (
                              "Decommissioned host"
                            )}
                          </td>
                          <td className="py-3">
                            {da.isPrivateCatalogMatch ? (
                              <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider">
                                Private Custom App
                              </span>
                            ) : da.catalogItemId ? (
                              <span className="bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider">
                                DIS Normalized
                              </span>
                            ) : (
                              <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider">
                                Unrecognized Raw
                              </span>
                            )}
                          </td>
                          <td className="py-3 text-right">
                            <span className="font-bold text-slate-800 font-mono">{da.usageDurationMinutes || 0} min</span>
                            <span className="block text-[9px] text-slate-400">Last used: {da.lastUsed ? new Date(da.lastUsed).toLocaleDateString() : "N/A"}</span>
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
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Data Intelligence Service Catalogue (800K+ recognized titles)</h3>
                <p className="text-[10px] text-slate-400">
                  Global repository of official vendor product signatures, default SKUs, lifecycle policies (EOL / EOS), malware signatures, and OS support specifications.
                </p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search catalog by software, publisher, SKU..."
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  className="w-full text-xs pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredCatalog.map((item) => {
                const category = categories.find(cat => cat.id === item.categoryId)?.name || "Utility";
                const isThreat = item.isMalware;

                return (
                  <div 
                    key={item.id} 
                    className={`border rounded-xl p-4 shadow-xs relative transition-all ${
                      isThreat 
                        ? "bg-rose-50/20 border-rose-200 hover:border-rose-300" 
                        : "bg-slate-50/30 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    {isThreat && (
                      <span className="absolute top-4 right-4 bg-rose-100 text-rose-800 px-2 py-0.5 rounded text-[8px] font-extrabold uppercase flex items-center gap-1">
                        <ShieldAlert className="w-2.5 h-2.5" /> High Risk / Malware
                      </span>
                    )}

                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isThreat ? "bg-rose-100 text-rose-700" : "bg-[#D1E7F3] text-[#00549F]"
                      }`}>
                        <Building className="w-4 h-4" />
                      </div>
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <h4 className={`font-bold text-xs truncate ${isThreat ? "text-rose-800" : "text-slate-800"}`}>
                          {item.softwareName}
                        </h4>
                        <p className="text-[10px] text-slate-500 font-semibold">{item.publisher}</p>
                        
                        <div className="grid grid-cols-2 gap-2 text-[10px] pt-1 border-t border-slate-100 mt-2">
                          <div>
                            <span className="text-slate-400 block font-bold text-[8px] uppercase">Default SKU</span>
                            <span className="font-mono text-slate-700">{item.defaultSku || "N/A"}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block font-bold text-[8px] uppercase">Category</span>
                            <span className="font-semibold text-slate-700">{category}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block font-bold text-[8px] uppercase">EOL Date</span>
                            <span className="font-semibold text-rose-600 font-mono">{item.eolDate || "No scheduled EOL"}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block font-bold text-[8px] uppercase">Compatibility</span>
                            <span className="font-semibold text-slate-600">{item.compatibleOS.join(", ")}</span>
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
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Private Custom Application Signatures</h3>
                <p className="text-[10px] text-slate-400">
                  Register proprietary internally-built tools or custom URLs. Scan engines map raw string hits on endpoints instantly to these definitions.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {privateCatalog.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No custom recognition rules registered yet. Click "Add Pattern Recognition" above.
                </div>
              ) : (
                privateCatalog.map((p) => {
                  const catName = categories.find(cat => cat.id === p.categoryId)?.name || "Corporate Custom";
                  return (
                    <div key={p.id} className="border border-slate-200 hover:border-slate-300 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/40">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-800 text-xs">{p.softwareName}</h4>
                          <span className="bg-purple-100 text-purple-800 px-1.5 py-0.2 rounded text-[8px] font-bold uppercase">Private Pattern</span>
                        </div>
                        <span className="block text-[10px] text-slate-500 font-semibold">Registered Vendor: {p.publisher} • Category: {catName}</span>
                        <div className="pt-1 flex items-center gap-1">
                          <span className="text-[9px] text-slate-400 uppercase font-bold">Regex / Substring Match:</span>
                          <span className="bg-slate-100 px-2 py-0.5 rounded font-mono text-[10px] font-bold border border-slate-200" style={{color: "#1468B3"}}>
                            {p.matchPattern}
                          </span>
                        </div>
                        {p.notes && <p className="text-[10px] text-slate-400 mt-1 italic">"{p.notes}"</p>}
                      </div>

                      <button
                        onClick={() => handleDeletePrivateItem(p.id)}
                        className="px-2.5 py-1.5 border border-rose-200 hover:bg-rose-50 text-rose-600 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remove Rule
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
            className="bg-white border border-slate-200 rounded-xl shadow-xl w-full max-w-lg overflow-hidden"
          >
            <form onSubmit={handleAddComputer}>
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <HardDrive className="w-4 h-4" style={{color: "#00549F"}} /> Enroll Managed Node (Computer/Server)
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAddComputerModal(false)}
                  className="text-slate-400 hover:text-slate-600 font-bold text-lg"
                >
                  &times;
                </button>
              </div>

              <div className="p-6 space-y-4 max-h-[450px] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Computer Hostname</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. SRV-ACTIVE-01"
                      value={newCompName}
                      onChange={(e) => setNewCompName(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white mt-1"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Operating System</label>
                    <select
                      value={newCompOS}
                      onChange={(e) => setNewCompOS(e.target.value as any)}
                      className="w-full text-xs border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white mt-1"
                    >
                      <option value="Windows">Windows</option>
                      <option value="Linux">Linux</option>
                      <option value="macOS">macOS</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Brand / Manufacturer</label>
                    <input
                      type="text"
                      placeholder="e.g. Dell"
                      value={newCompBrand}
                      onChange={(e) => setNewCompBrand(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white mt-1"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Model Specification</label>
                    <input
                      type="text"
                      placeholder="e.g. PowerEdge R750"
                      value={newCompModel}
                      onChange={(e) => setNewCompModel(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Cores</label>
                    <input
                      type="number"
                      min="1"
                      value={newCompCores}
                      onChange={(e) => setNewCompCores(Number(e.target.value))}
                      className="w-full text-xs border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white mt-1 text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">RAM (GB)</label>
                    <input
                      type="number"
                      min="1"
                      value={newCompRam}
                      onChange={(e) => setNewCompRam(Number(e.target.value))}
                      className="w-full text-xs border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white mt-1 text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Storage (GB)</label>
                    <input
                      type="number"
                      min="1"
                      value={newCompStorage}
                      onChange={(e) => setNewCompStorage(Number(e.target.value))}
                      className="w-full text-xs border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white mt-1 text-center"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">CPU Model</label>
                  <input
                    type="text"
                    placeholder="e.g. Intel Xeon Platinum 8380"
                    value={newCompCpu}
                    onChange={(e) => setNewCompCpu(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Warranty Scheme</label>
                    <select
                      value={newCompWarranty}
                      onChange={(e) => setNewCompWarranty(e.target.value as any)}
                      className="w-full text-xs border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white mt-1"
                    >
                      <option value="Under Warranty">Under Warranty</option>
                      <option value="Expired">Expired</option>
                      <option value="No Info">No Info</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Expiration Date</label>
                    <input
                      type="date"
                      value={newCompWarrantyDate}
                      onChange={(e) => setNewCompWarrantyDate(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white mt-1"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAddComputerModal(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white rounded-lg cursor-pointer shadow-sm" style={{background: "#00549F"}}
                >
                  Save Hardware Node
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
            className="bg-white border border-slate-200 rounded-xl shadow-xl w-full max-w-lg overflow-hidden"
          >
            <form onSubmit={handleAddMobile}>
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4" style={{color: "#00549F"}} /> Enroll Corporate Mobile Asset
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAddMobileModal(false)}
                  className="text-slate-400 hover:text-slate-600 font-bold text-lg"
                >
                  &times;
                </button>
              </div>

              <div className="p-6 space-y-4 max-h-[450px] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Device Host Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. IPHONE-EB-02"
                      value={newMobName}
                      onChange={(e) => setNewMobName(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white mt-1"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">OS (Firmware)</label>
                    <input
                      type="text"
                      placeholder="e.g. iOS 17.5"
                      value={newMobOS}
                      onChange={(e) => setNewMobOS(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Brand / Maker</label>
                    <input
                      type="text"
                      placeholder="e.g. Apple"
                      value={newMobBrand}
                      onChange={(e) => setNewMobBrand(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white mt-1"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Model</label>
                    <input
                      type="text"
                      placeholder="e.g. iPhone 15 Pro"
                      value={newMobModel}
                      onChange={(e) => setNewMobModel(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Serial Number</label>
                    <input
                      type="text"
                      placeholder="e.g. SN-MOB-99212"
                      value={newMobSerial}
                      onChange={(e) => setNewMobSerial(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white mt-1"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Linked User Email</label>
                    <input
                      type="email"
                      placeholder="e.g. ericob3ware@gmail.com"
                      value={newMobUser}
                      onChange={(e) => setNewMobUser(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Warranty Scheme</label>
                    <select
                      value={newMobWarranty}
                      onChange={(e) => setNewMobWarranty(e.target.value as any)}
                      className="w-full text-xs border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white mt-1"
                    >
                      <option value="Under Warranty">Under Warranty</option>
                      <option value="Expired">Expired</option>
                      <option value="No Info">No Info</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Expiration Date</label>
                    <input
                      type="date"
                      value={newMobWarrantyDate}
                      onChange={(e) => setNewMobWarrantyDate(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white mt-1"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAddMobileModal(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white rounded-lg cursor-pointer shadow-sm" style={{background: "#00549F"}}
                >
                  Enroll Mobile Device
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
            className="bg-white border border-slate-200 rounded-xl shadow-xl w-full max-w-lg overflow-hidden"
          >
            <form onSubmit={handleAddPrivatePattern}>
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <PlusCircle className="w-4 h-4" style={{color: "#00549F"}} /> Create Recognition Matching Rule
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAddPrivateModal(false)}
                  className="text-slate-400 hover:text-slate-600 font-bold text-lg"
                >
                  &times;
                </button>
              </div>

              <div className="p-6 space-y-4 max-h-[450px] overflow-y-auto">
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Custom Application Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Corporate TimeTracker"
                      value={privAppName}
                      onChange={(e) => setPrivAppName(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white mt-1"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Manufacturer / Vendor</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Internal IT Systems"
                      value={privPublisher}
                      onChange={(e) => setPrivPublisher(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white mt-1"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Category</label>
                    <select
                      value={privCategory}
                      onChange={(e) => setPrivCategory(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white mt-1"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Recognition Match Pattern (Substring Match)</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. timetracker.internal (will map any raw string containing this!)"
                      value={privPattern}
                      onChange={(e) => setPrivPattern(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50 font-mono text-indigo-700 font-bold mt-1"
                    />
                    <p className="text-[9px] text-slate-400 mt-1">
                      If an on-premises agent detects a registry value, file path, or browser process containing this exact pattern, DIS automatically normalizes it into this private app model.
                    </p>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Special Ingestion Notes</label>
                    <textarea
                      placeholder="Enter special internal inventory, downgrade paths, or support contacts."
                      value={privNotes}
                      onChange={(e) => setPrivNotes(e.target.value)}
                      rows={2}
                      className="w-full text-xs border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white mt-1"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAddPrivateModal(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white rounded-lg cursor-pointer shadow-sm" style={{background: "#00549F"}}
                >
                  Save Ingestion Rule
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

    </div>
  );
}
