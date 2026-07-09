import React, { useState, useEffect } from "react";
import { License, Agreement, MetricType, LicenseAssignment, LicensePool } from "../types.js";
import { 
  Folder, Plus, Archive, ShieldAlert, CheckCircle, AlertCircle, Edit, Trash2, 
  UserPlus, X, HelpCircle, FileText, Settings, ExternalLink, Calendar
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { HintTooltip } from "./HintTooltip.js";

interface LicensesViewProps {
  licenses: License[];
  agreements: Agreement[];
  licensePools: LicensePool[];
  onRefresh: () => void;
}

export function LicensesView({ licenses, agreements, licensePools, onRefresh }: LicensesViewProps) {
  const [activeTab, setActiveTab] = useState<"ACTIVE" | "INCOMPLETE" | "ARCHIVED">("ACTIVE");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null);
  const [assignments, setAssignments] = useState<LicenseAssignment[]>([]);
  const [isAssignmentsLoading, setIsAssignmentsLoading] = useState(false);

  // Pool state managers
  const [showPoolManager, setShowPoolManager] = useState(false);
  const [newPoolName, setNewPoolName] = useState("");
  const [newPoolDesc, setNewPoolDesc] = useState("");
  const [newPoolOwner, setNewPoolOwner] = useState("");
  const [selectedPoolFilter, setSelectedPoolFilter] = useState("");

  // Form states for creating a new license
  const [softwareName, setSoftwareName] = useState("");
  const [publisher, setPublisher] = useState("");
  const [metricType, setMetricType] = useState<MetricType>(MetricType.INSTALLATIONS);
  const [agreementId, setAgreementId] = useState("");
  const [licensePoolId, setLicensePoolId] = useState("");
  const [sku, setSku] = useState("");
  const [version, setVersion] = useState("");
  const [notes, setNotes] = useState("");
  const [downgradeRights, setDowngradeRights] = useState(true);
  const [isSubscription, setIsSubscription] = useState(false);
  const [initialQuantity, setInitialQuantity] = useState("10");
  const [initialUnitCost, setInitialUnitCost] = useState("150");
  const [invoiceNumber, setInvoiceNumber] = useState("INV-SEED-01");

  // Form states for adding manual allocation
  const [allocTargetType, setAllocTargetType] = useState<"User" | "Device" | "OrgUnit">("User");
  const [allocTargetId, setAllocTargetId] = useState("");
  const [allocQuantity, setAllocQuantity] = useState("1");
  const [isAllocating, setIsAllocating] = useState(false);

  // Edit states
  const [isEditing, setIsEditing] = useState(false);
  const [editSoftwareName, setEditSoftwareName] = useState("");
  const [editPublisher, setEditPublisher] = useState("");
  const [editMetricType, setEditMetricType] = useState<MetricType>(MetricType.INSTALLATIONS);
  const [editAgreementId, setEditAgreementId] = useState("");
  const [editLicensePoolId, setEditLicensePoolId] = useState("");
  const [editSku, setEditSku] = useState("");
  const [editVersion, setEditVersion] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editDowngrade, setEditDowngrade] = useState(true);
  const [editIsSub, setEditIsSub] = useState(false);

  // Filter licenses by tab and selected pool filter
  const filteredLicenses = licenses.filter((l) => {
    const tabMatch = (() => {
      if (activeTab === "ACTIVE") return l.status === "Active";
      if (activeTab === "INCOMPLETE") return l.status === "Incomplete";
      return l.status === "Archived";
    })();
    
    if (!tabMatch) return false;
    if (selectedPoolFilter && l.licensePoolId !== selectedPoolFilter) return false;
    return true;
  });

  // Load assignments when a license is clicked
  useEffect(() => {
    if (selectedLicense) {
      loadAssignments(selectedLicense.id);
    }
  }, [selectedLicense]);

  const loadAssignments = async (licId: string) => {
    setIsAssignmentsLoading(true);
    try {
      const res = await fetch(`/api/licenses/${licId}/assignments`);
      if (res.ok) {
        const data = await res.json();
        setAssignments(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAssignmentsLoading(false);
    }
  };

  const [createError, setCreateError] = useState<string | null>(null);

  const handleCreateLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    if (!softwareName || !publisher || !metricType) {
      setCreateError("Nome do Software e Editora são obrigatórios.");
      return;
    }

    try {
      const res = await fetch("/api/licenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          softwareName,
          publisher,
          metricType,
          agreementId: agreementId || undefined,
          licensePoolId: licensePoolId || undefined,
          sku: sku || undefined,
          version,
          notes,
          downgradeRights,
          isSubscription,
          purchases: [
            {
              quantity: Number(initialQuantity) || 0,
              unitCost: Number(initialUnitCost) || 0,
              invoiceNumber,
              purchaseDate: new Date().toISOString().split("T")[0]
            }
          ]
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: "Erro desconhecido do servidor" }));
        setCreateError(errData.error || `Servidor retornou ${res.status}`);
        return;
      }

      setSoftwareName("");
      setPublisher("");
      setAgreementId("");
      setLicensePoolId("");
      setSku("");
      setVersion("");
      setNotes("");
      setInitialQuantity("10");
      setInitialUnitCost("150");
      setShowCreateModal(false);
      onRefresh();
    } catch (e: any) {
      setCreateError(e.message || "Erro de rede. O servidor está em execução?");
    }
  };

  const handleUpdateLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLicense) return;

    try {
      const res = await fetch(`/api/licenses/${selectedLicense.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          softwareName: editSoftwareName,
          publisher: editPublisher,
          metricType: editMetricType,
          agreementId: editAgreementId || undefined,
          licensePoolId: editLicensePoolId || undefined,
          sku: editSku || undefined,
          version: editVersion,
          notes: editNotes,
          downgradeRights: editDowngrade,
          isSubscription: editIsSub
        })
      });

      if (res.ok) {
        const updated = await res.json();
        setSelectedLicense(updated);
        setIsEditing(false);
        onRefresh();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleArchiveLicense = async (licId: string) => {
    try {
      const res = await fetch(`/api/licenses/${licId}/archive`, {
        method: "POST"
      });
      if (res.ok) {
        setSelectedLicense(null);
        onRefresh();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteLicense = async (licId: string) => {
    if (!confirm("Tem certeza de que deseja excluir completamente este contrato de licença? Esta ação é irreversível.")) return;
    try {
      const res = await fetch(`/api/licenses/${licId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setSelectedLicense(null);
        onRefresh();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAllocate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLicense || !allocTargetId || !allocQuantity) return;

    setIsAllocating(true);
    try {
      const res = await fetch(`/api/licenses/${selectedLicense.id}/assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetType: allocTargetType,
          targetId: allocTargetId,
          quantity: Number(allocQuantity) || 1
        })
      });

      if (res.ok) {
        setAllocTargetId("");
        setAllocQuantity("1");
        loadAssignments(selectedLicense.id);
        onRefresh();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAllocating(false);
    }
  };

  const handleDeallocate = async (asgId: string) => {
    try {
      const res = await fetch(`/api/assignments/${asgId}`, {
        method: "DELETE"
      });
      if (res.ok && selectedLicense) {
        loadAssignments(selectedLicense.id);
        onRefresh();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const startEdit = () => {
    if (!selectedLicense) return;
    setEditSoftwareName(selectedLicense.softwareName);
    setEditPublisher(selectedLicense.publisher);
    setEditMetricType(selectedLicense.metricType);
    setEditAgreementId(selectedLicense.agreementId || "");
    setEditLicensePoolId(selectedLicense.licensePoolId || "");
    setEditSku(selectedLicense.sku || "");
    setEditVersion(selectedLicense.version || "");
    setEditNotes(selectedLicense.notes || "");
    setEditDowngrade(selectedLicense.downgradeRights);
    setEditIsSub(!!selectedLicense.isSubscription);
    setIsEditing(true);
  };

  const handleCreatePool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPoolName) return;

    try {
      const res = await fetch("/api/license-pools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newPoolName,
          description: newPoolDesc,
          ownerOrgNodeId: newPoolOwner || undefined
        })
      });

      if (res.ok) {
        setNewPoolName("");
        setNewPoolDesc("");
        setNewPoolOwner("");
        onRefresh();
      }
    } catch (err) {
      console.error("Failed to create license pool:", err);
    }
  };

  const handleDeletePool = async (poolId: string) => {
    if (!confirm("Tem certeza de que deseja excluir este pool de licenças? Isso não excluirá as licenças internas, mas removerá suas associações.")) return;

    try {
      const res = await fetch(`/api/license-pools/${poolId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        onRefresh();
      }
    } catch (err) {
      console.error("Failed to delete license pool:", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upper header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#212424" }}>Inventário de Licenças</h1>
            <HintTooltip text="Gerencie todos os direitos de licença de software: crie novas licenças, acompanhe alocações, gerencie pools e audite a conformidade em toda a sua empresa." side="right" size="md" />
          </div>
          <p className="text-sm" style={{ color: "#6E7070" }}>
            Crie, audite, arquive e gerencie alocações de ativos de licença corporativos.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Pool Filter */}
          {licensePools.length > 0 && (
            <select
              value={selectedPoolFilter}
              onChange={(e) => setSelectedPoolFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
            >
              <option value="">Todos os Pools de Licenças</option>
              {licensePools.map((pool) => (
                <option key={pool.id} value={pool.id}>Pool: {pool.name}</option>
              ))}
            </select>
          )}

          <button
            onClick={() => setShowPoolManager(true)}
            className="flex items-center justify-center gap-1.5 px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-xs transition-all cursor-pointer bg-white"
          >
            <Folder className="w-4 h-4 text-purple-600" />
            Gerenciar Pools
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center justify-center gap-1.5 px-4 py-2 text-white rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer" style={{background: "#366BB2"}}
          >
            <Plus className="w-4 h-4" />
            Criar Licença
          </button>
        </div>
      </div>

      {/* Grid containing Licenses List + Detailed Side panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main inventory list */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Tabs Filter */}
          <div className="flex border-b border-slate-200 gap-6">
            <button
              onClick={() => { setActiveTab("ACTIVE"); setSelectedLicense(null); }}
              className={`pb-3 text-xs font-semibold tracking-wide uppercase border-b-2 transition-all cursor-pointer ${
                activeTab === "ACTIVE" 
                  ? "border-[#366BB2] text-[#366BB2]" 
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              Títulos Ativos
            </button>
            <button
              onClick={() => { setActiveTab("INCOMPLETE"); setSelectedLicense(null); }}
              className={`pb-3 text-xs font-semibold tracking-wide uppercase border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "INCOMPLETE" 
                  ? "border-amber-600 text-amber-600" 
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              Verificações de Política Incompletas
              {licenses.filter(l => l.status === "Incomplete").length > 0 && (
                <span className="bg-amber-100 text-amber-800 rounded-full px-1.5 py-0.5 text-[10px] font-bold">
                  {licenses.filter(l => l.status === "Incomplete").length}
                </span>
              )}
            </button>
            <button
              onClick={() => { setActiveTab("ARCHIVED"); setSelectedLicense(null); }}
              className={`pb-3 text-xs font-semibold tracking-wide uppercase border-b-2 transition-all cursor-pointer ${
                activeTab === "ARCHIVED" 
                  ? "border-slate-500 text-slate-600" 
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              Arquivados
            </button>
          </div>

          {/* Licenses items */}
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
            {filteredLicenses.length === 0 ? (
              <div className="bg-slate-50 rounded-xl p-12 text-center border border-slate-100">
                <Folder className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-medium text-slate-700">Nenhum ativo de software encontrado neste estado.</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Use a opção "Criar Licença" ou "Importar Nota Fiscal" para preencher o inventário.</p>
              </div>
            ) : (
              filteredLicenses.map((lic) => {
                const isSelected = selectedLicense?.id === lic.id;
                const isInc = lic.status === "Incomplete";
                const pool = licensePools.find(p => p.id === lic.licensePoolId);
                
                return (
                  <div
                    key={lic.id}
                    onClick={() => { setSelectedLicense(lic); setIsEditing(false); }}
                    className={`p-4 border rounded-xl shadow-sm transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white ${
                      isSelected 
                        ? "border-[#366BB2]" 
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-xs text-slate-900">{lic.softwareName}</span>
                        {lic.isSubscription && (
                          <span className="bg-sky-50 text-sky-700 text-[9px] font-bold px-1.5 py-0.5 rounded border border-sky-200">
                            Assinatura
                          </span>
                        )}
                        {pool && (
                          <span className="bg-purple-50 text-purple-700 text-[9px] font-bold px-1.5 py-0.5 rounded border border-purple-200">
                            Pool: {pool.name}
                          </span>
                        )}
                        {isInc && (
                          <span className="bg-amber-50 text-amber-700 text-[9px] font-bold px-1.5 py-0.5 rounded border border-amber-200 flex items-center gap-0.5">
                            <ShieldAlert className="w-2.5 h-2.5" /> Política Incompleta
                          </span>
                        )}
                      </div>
                      <p className="text-slate-500 text-[11px] mt-1">
                        Editora: <strong className="text-slate-700">{lic.publisher}</strong> | Métrica: <strong className="text-slate-700">{lic.metricType}</strong>
                      </p>
                      {lic.sku && (
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">SKU: {lic.sku}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-6 self-start sm:self-center">
                      <div className="text-right">
                        <span className="block text-[10px] uppercase font-medium text-slate-400 tracking-wider">Direitos</span>
                        <span className="text-sm font-bold text-slate-800">{lic.totalQuantity}</span>
                      </div>
                      <div className="text-right">
                        <span className="block text-[10px] uppercase font-medium text-slate-400 tracking-wider">Alocados</span>
                        <span className="text-sm font-bold text-slate-800">{lic.allocatedQuantity || 0}</span>
                      </div>
                      <div className="text-right">
                        <span className="block text-[10px] uppercase font-medium text-slate-400 tracking-wider">Não Atribuídos</span>
                        <span className="text-sm font-bold" style={{color: "#366BB2"}}>
                          {Math.max(0, lic.totalQuantity - (lic.allocatedQuantity || 0))}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Detailed Side Panel */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm min-h-[400px]">
          {selectedLicense ? (
            <div className="space-y-6">
              
              {/* Header and Core details */}
              <div className="border-b border-slate-100 pb-4">
                <div className="flex justify-between items-start gap-2">
                  <h3 className="font-bold text-sm text-slate-900">{selectedLicense.softwareName}</h3>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={startEdit}
                      className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-800 cursor-pointer"
                      title="Editar propriedades da licença"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    {selectedLicense.status !== "Archived" && (
                      <button
                        onClick={() => handleArchiveLicense(selectedLicense.id)}
                        className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-amber-700 cursor-pointer"
                        title="Arquivar licença"
                      >
                        <Archive className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteLicense(selectedLicense.id)}
                      className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-rose-700 cursor-pointer"
                      title="Excluir contrato de licença"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">ID do Ativo: {selectedLicense.id}</p>
              </div>

              {isEditing ? (
                /* EDITING PROPERTIES STATE */
                <form onSubmit={handleUpdateLicense} className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider" style={{color: "#366BB2"}}>Editar Propriedades</h4>
                  
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase">Título do Produto</label>
                    <input
                      type="text"
                      required
                      value={editSoftwareName}
                      onChange={(e) => setEditSoftwareName(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded p-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white mt-1"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase">Editora</label>
                    <input
                      type="text"
                      required
                      value={editPublisher}
                      onChange={(e) => setEditPublisher(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded p-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white mt-1"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase">Modelo de Métrica</label>
                    <select
                      value={editMetricType}
                      onChange={(e) => setEditMetricType(e.target.value as MetricType)}
                      className="w-full text-xs border border-slate-200 rounded p-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white mt-1"
                    >
                      {Object.values(MetricType).map((mt) => (
                        <option key={mt} value={mt}>{mt}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase">Contrato (Acordo)</label>
                    <select
                      value={editAgreementId}
                      onChange={(e) => setEditAgreementId(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded p-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white mt-1"
                    >
                      <option value="">-- Sem Contrato Vinculado --</option>
                      {agreements.map((a) => (
                        <option key={a.id} value={a.id}>{a.name} ({a.number})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase">Pool de Licenças</label>
                    <select
                      value={editLicensePoolId}
                      onChange={(e) => setEditLicensePoolId(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded p-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white mt-1"
                    >
                      <option value="">-- Nenhum Pool de Licenças --</option>
                      {licensePools.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase">SKU (Nº de Peça)</label>
                    <input
                      type="text"
                      value={editSku}
                      onChange={(e) => setEditSku(e.target.value)}
                      placeholder="ex.: SKU-123-X"
                      className="w-full text-xs border border-slate-200 rounded p-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white mt-1"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase">Versão</label>
                    <input
                      type="text"
                      value={editVersion}
                      onChange={(e) => setEditVersion(e.target.value)}
                      placeholder="ex.: 2025 Enterprise"
                      className="w-full text-xs border border-slate-200 rounded p-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white mt-1"
                    />
                  </div>

                  <div className="flex gap-4">
                    <label className="flex items-center gap-1 text-xs text-slate-700 font-medium">
                      <input
                        type="checkbox"
                        checked={editDowngrade}
                        onChange={(e) => setEditDowngrade(e.target.checked)}
                      />
                      Direitos de Downgrade
                    </label>
                    <label className="flex items-center gap-1 text-xs text-slate-700 font-medium">
                      <input
                        type="checkbox"
                        checked={editIsSub}
                        onChange={(e) => setEditIsSub(e.target.checked)}
                      />
                      Assinatura SaaS
                    </label>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="submit"
                      className="px-3 py-1.5 text-white rounded text-xs font-semibold cursor-pointer" style={{background: "#366BB2"}}
                    >
                      Salvar Alterações
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              ) : (
                /* VIEW PROPERTIES STATE */
                <div className="space-y-4">
                  {/* Local Org Policy Validation Widget */}
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-150">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Verificação de Política de Licença</span>
                      {selectedLicense.status === "Incomplete" ? (
                        <span className="text-[10px] text-amber-700 font-bold bg-amber-100 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                          <AlertCircle className="w-3 h-3" /> Ação Incompleta Necessária
                        </span>
                      ) : (
                        <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                          <CheckCircle className="w-3 h-3" /> Política Aprovada
                        </span>
                      )}
                    </div>
                    
                    <div className="mt-2 space-y-1 text-[10px]">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Vinculado a Contrato</span>
                        {selectedLicense.agreementId ? (
                          <span className="text-emerald-600 font-semibold">Verificado</span>
                        ) : (
                          <span className="text-amber-600 font-bold">Campo Obrigatório Ausente</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">SKUs Válidos e ID de Peça do Fabricante</span>
                        {selectedLicense.sku ? (
                          <span className="text-emerald-600 font-semibold">Verificado</span>
                        ) : (
                          <span className="text-amber-600 font-bold">Campo Obrigatório Ausente</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* General Specifications info */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="block text-[10px] font-semibold text-slate-400 uppercase">Editora</span>
                      <span className="font-semibold text-slate-800">{selectedLicense.publisher}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-semibold text-slate-400 uppercase">Modelo de Métrica</span>
                      <span className="font-semibold text-slate-800">{selectedLicense.metricType}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-semibold text-slate-400 uppercase">Versão</span>
                      <span className="font-medium text-slate-800">{selectedLicense.version || "N/A"}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-semibold text-slate-400 uppercase">SKU</span>
                      <span className="font-mono text-slate-800">{selectedLicense.sku || "N/A"}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-semibold text-slate-400 uppercase">Contrato</span>
                      <span className="font-semibold hover:underline cursor-pointer" style={{color: "#366BB2"}}>
                        {agreements.find(a => a.id === selectedLicense.agreementId)?.name || "Contrato Desvinculado"}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-semibold text-slate-400 uppercase">Direitos de Downgrade</span>
                      <span className="font-medium text-slate-800">{selectedLicense.downgradeRights ? "Sim" : "Não"}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-semibold text-slate-400 uppercase">Pool de Licenças</span>
                      <span className="font-semibold text-purple-700">
                        {licensePools.find(p => p.id === selectedLicense.licensePoolId)?.name || "Não Associado"}
                      </span>
                    </div>
                  </div>

                  {selectedLicense.notes && (
                    <div>
                      <span className="block text-[10px] font-semibold text-slate-400 uppercase">Observações</span>
                      <p className="text-[11px] text-slate-500 mt-1 italic">{selectedLicense.notes}</p>
                    </div>
                  )}

                  {/* Manual Assignment allocations segment */}
                  <div className="border-t border-slate-100 pt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1">
                        <UserPlus className="w-3.5 h-3.5" /> Alocações Manuais
                      </h4>
                      <span className="text-[10px] text-slate-500">
                        {assignments.reduce((sum, a) => sum + a.quantity, 0)} alocados
                      </span>
                    </div>

                    {/* Form to add new assignment */}
                    {selectedLicense.status !== "Archived" && (
                      <form onSubmit={handleAllocate} className="bg-slate-50 p-2.5 rounded-lg border border-slate-150 flex flex-col gap-2">
                        <span className="block text-[10px] font-semibold text-slate-600">Alocar Direito:</span>
                        <div className="flex gap-2">
                          <select
                            value={allocTargetType}
                            onChange={(e) => setAllocTargetType(e.target.value as any)}
                            className="text-[10px] border border-slate-200 rounded px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                          >
                            <option value="User">Usuário</option>
                            <option value="Device">Dispositivo</option>
                            <option value="OrgUnit">Unidade Organizacional</option>
                          </select>
                          <input
                            type="text"
                            required
                            placeholder={
                              allocTargetType === "User" 
                                ? "email@domain.com" 
                                : allocTargetType === "Device" 
                                ? "DESKTOP-J89A" 
                                : "Departamento de Vendas"
                            }
                            value={allocTargetId}
                            onChange={(e) => setAllocTargetId(e.target.value)}
                            className="flex-1 text-[10px] border border-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                          />
                          <input
                            type="number"
                            required
                            min="1"
                            value={allocQuantity}
                            onChange={(e) => setAllocQuantity(e.target.value)}
                            className="w-12 text-[10px] border border-slate-200 rounded px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white text-center"
                          />
                          <button
                            type="submit"
                            disabled={isAllocating}
                            className="px-2 py-1 text-white font-semibold rounded text-[10px] disabled:opacity-50 cursor-pointer" style={{background: "#366BB2"}}
                          >
                            Atribuir
                          </button>
                        </div>
                      </form>
                    )}

                    {/* Assignments List */}
                    <div className="max-h-[160px] overflow-y-auto space-y-1.5 pr-1">
                      {isAssignmentsLoading ? (
                        <p className="text-[10px] text-slate-400 text-center py-2">Carregando alocações...</p>
                      ) : assignments.length === 0 ? (
                        <p className="text-[10px] text-slate-400 text-center py-2 bg-slate-50 rounded italic border border-dashed border-slate-200">
                          Nenhuma alocação manual mapeada. Todos os direitos são autoalocados dinamicamente pelos cálculos de Compliance.
                        </p>
                      ) : (
                        assignments.map((asg) => (
                          <div key={asg.id} className="bg-white border border-slate-150 p-2 rounded-lg flex items-center justify-between gap-2 shadow-sm text-[10px]">
                            <div>
                              <div className="flex items-center gap-1">
                                <span className="font-semibold text-slate-700">Tipo: {asg.targetType}</span>
                                <span className="text-[9px] text-slate-400">({new Date(asg.allocatedAt).toLocaleDateString()})</span>
                              </div>
                              <span className="block text-slate-500 font-mono text-[9px] truncate max-w-[140px]">{asg.targetId}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-800">×{asg.quantity}</span>
                              <button
                                onClick={() => handleDeallocate(asg.id)}
                                className="p-0.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                                title="Desalocar alocação"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center h-full text-slate-400 py-12">
              <Settings className="w-10 h-10 text-slate-200 mb-2 animate-pulse" />
              <p className="text-xs font-semibold text-slate-600">Nenhuma Licença Selecionada</p>
              <p className="text-[10px] mt-0.5">Clique em qualquer cartão de título de software para visualizar políticas de auditoria, logs de alocações, alinhamentos de especificações de contrato e painel de configurações.</p>
            </div>
          )}
        </div>
      </div>

      {/* CREATE LICENSE MODAL POPUP */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-lg border border-slate-200 max-w-lg w-full overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <FileText className="w-4 h-4" style={{color: "#366BB2"}} /> Criar Ativo de Licença Corporativa
                </h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateLicense} className="p-6 space-y-4">
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Título do Produto *</label>
                    <input
                      type="text"
                      required
                      placeholder="ex.: Office 365 Enterprise"
                      value={softwareName}
                      onChange={(e) => setSoftwareName(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white mt-1"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Editora / Fabricante *</label>
                    <input
                      type="text"
                      required
                      placeholder="ex.: Microsoft"
                      value={publisher}
                      onChange={(e) => setPublisher(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Modelo de Reconciliação de Métrica *</label>
                    <select
                      value={metricType}
                      onChange={(e) => setMetricType(e.target.value as MetricType)}
                      className="w-full text-xs border border-slate-200 rounded p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white mt-1"
                    >
                      {Object.values(MetricType).map((mt) => (
                        <option key={mt} value={mt}>{mt}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase flex items-center justify-between">
                      <span>Contrato (Acordo)</span>
                      <span className="text-[8px] text-amber-600 font-bold">Obrigatório por Política</span>
                    </label>
                    <select
                      value={agreementId}
                      onChange={(e) => setAgreementId(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white mt-1"
                    >
                      <option value="">-- Deixar Desvinculado (Força Incompleto) --</option>
                      {agreements.map((a) => (
                        <option key={a.id} value={a.id}>{a.name} ({a.number})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Pool de Licenças</label>
                  <select
                    value={licensePoolId}
                    onChange={(e) => setLicensePoolId(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white mt-1"
                  >
                    <option value="">-- Nenhum Pool de Licenças --</option>
                    {licensePools.map((pool) => (
                      <option key={pool.id} value={pool.id}>{pool.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase flex items-center justify-between">
                      <span>Código SKU (Nº de Peça)</span>
                      <span className="text-[8px] text-amber-600 font-bold">Obrigatório por Política</span>
                    </label>
                    <input
                      type="text"
                      placeholder="ex.: MS-WS22-CORE"
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white mt-1"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Tag de Versão</label>
                    <input
                      type="text"
                      placeholder="ex.: 2022 R2"
                      value={version}
                      onChange={(e) => setVersion(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white mt-1"
                    />
                  </div>
                </div>

                {/* Initial Purchase Information (Creates purchase entitlement) */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                  <h4 className="text-[10px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" style={{color: "#366BB2"}} /> Direito de Compra Inicial (PO / Linha de Nota Fiscal)
                  </h4>
                  
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[9px] font-semibold text-slate-500 uppercase">Quantidade</label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={initialQuantity}
                        onChange={(e) => setInitialQuantity(e.target.value)}
                        className="w-full text-xs border border-slate-200 rounded p-1.5 focus:outline-none bg-white mt-0.5 text-center"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-semibold text-slate-500 uppercase">Custo Unitário ($)</label>
                      <input
                        type="number"
                        required
                        min="0"
                        value={initialUnitCost}
                        onChange={(e) => setInitialUnitCost(e.target.value)}
                        className="w-full text-xs border border-slate-200 rounded p-1.5 focus:outline-none bg-white mt-0.5 text-center"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-semibold text-slate-500 uppercase">Nº da Nota Fiscal</label>
                      <input
                        type="text"
                        required
                        value={invoiceNumber}
                        onChange={(e) => setInvoiceNumber(e.target.value)}
                        className="w-full text-xs border border-slate-200 rounded p-1.5 focus:outline-none bg-white mt-0.5 text-center"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <label className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
                    <input
                      type="checkbox"
                      checked={downgradeRights}
                      onChange={(e) => setDowngradeRights(e.target.checked)}
                    />
                    Conceder Direitos de Downgrade
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
                    <input
                      type="checkbox"
                      checked={isSubscription}
                      onChange={(e) => setIsSubscription(e.target.checked)}
                    />
                    Assinatura SaaS em Nuvem
                  </label>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Observações e Instruções de Auditoria</label>
                  <textarea
                    rows={2}
                    placeholder="Insira observações especiais do contrato ou caminhos de downgrade."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white mt-1"
                  />
                </div>

                {createError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-[11px] text-rose-700 flex gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{createError}</span>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-white rounded-lg text-xs font-semibold cursor-pointer" style={{background: "#366BB2"}}
                  >
                    Salvar e Reconciliar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* LICENSE POOLS MANAGER MODAL */}
      <AnimatePresence>
        {showPoolManager && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-lg border border-slate-200 max-w-2xl w-full overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <Folder className="w-4 h-4 text-purple-600" /> Gerenciar Pools de Licenças Corporativas
                </h3>
                <button
                  onClick={() => setShowPoolManager(false)}
                  className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
                
                {/* Left Side: Create New Pool Form */}
                <div className="space-y-4 border-r border-slate-100 pr-0 md:pr-6">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Criar Novo Pool</h4>
                  <form onSubmit={handleCreatePool} className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Nome do Pool *</label>
                      <input
                        type="text"
                        required
                        placeholder="ex.: Pool de Operações Europeias"
                        value={newPoolName}
                        onChange={(e) => setNewPoolName(e.target.value)}
                        className="w-full text-xs border border-slate-200 rounded p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white mt-1"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Descrição</label>
                      <textarea
                        rows={3}
                        placeholder="Propósito ou alinhamento de região..."
                        value={newPoolDesc}
                        onChange={(e) => setNewPoolDesc(e.target.value)}
                        className="w-full text-xs border border-slate-200 rounded p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white mt-1"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Nó Organizacional / Departamento Responsável</label>
                      <input
                        type="text"
                        placeholder="ex.: Divisão EMEA"
                        value={newPoolOwner}
                        onChange={(e) => setNewPoolOwner(e.target.value)}
                        className="w-full text-xs border border-slate-200 rounded p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white mt-1"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg text-xs transition-all cursor-pointer"
                    >
                      Criar Pool
                    </button>
                  </form>
                </div>

                {/* Right Side: Pools List */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between">
                    <span>Pools de Licenças Ativos</span>
                    <span className="bg-purple-100 text-purple-800 rounded-full px-2 py-0.5 text-[9px] font-bold">
                      {licensePools.length} pools
                    </span>
                  </h4>

                  <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                    {licensePools.length === 0 ? (
                      <div className="text-center py-8 text-slate-400 text-xs italic">
                        Nenhum pool personalizado definido. Use o formulário para estabelecer seu primeiro limite de contenção de licenças.
                      </div>
                    ) : (
                      licensePools.map((pool) => {
                        const associatedCount = licenses.filter(l => l.licensePoolId === pool.id).length;
                        const totalEntitlements = licenses
                          .filter(l => l.licensePoolId === pool.id)
                          .reduce((sum, l) => sum + l.totalQuantity, 0);

                        return (
                          <div key={pool.id} className="bg-slate-50 p-3 rounded-lg border border-slate-150 relative group">
                            <button
                              onClick={() => handleDeletePool(pool.id)}
                              className="absolute top-2 right-2 p-1 text-slate-400 hover:text-rose-600 rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                              title="Excluir Pool de Licenças"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            <h5 className="font-bold text-slate-800 text-xs pr-6">{pool.name}</h5>
                            {pool.description && (
                              <p className="text-slate-500 text-[10px] mt-0.5 leading-snug">{pool.description}</p>
                            )}
                            {pool.ownerOrgNodeId && (
                              <p className="text-[9px] text-purple-600 font-semibold mt-1">Responsável: {pool.ownerOrgNodeId}</p>
                            )}
                            <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[9px] text-slate-500">
                              <span>Licenças associadas: <strong>{associatedCount}</strong></span>
                              <span>Quantidade Total: <strong className="text-purple-700">{totalEntitlements}</strong></span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

              </div>

              <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowPoolManager(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Fechar Gerenciador
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
