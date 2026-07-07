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
      setCreateError("Software Name and Publisher are required.");
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
        const errData = await res.json().catch(() => ({ error: "Unknown server error" }));
        setCreateError(errData.error || `Server returned ${res.status}`);
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
      setCreateError(e.message || "Network error. Is the server running?");
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
    if (!confirm("Are you sure you want to completely delete this license contract? This action is irreversible.")) return;
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
    if (!confirm("Are you sure you want to delete this license pool? This will not delete the licenses inside, but will remove their association.")) return;

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
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#001833" }}>Licenses Inventory</h1>
            <HintTooltip text="Manage all software license entitlements: create new licenses, track allocations, manage pools, and audit compliance status across your enterprise." side="right" size="md" />
          </div>
          <p className="text-sm" style={{ color: "#595959" }}>
            Create, audit, archive and manage allocations for enterprise license assets.
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
              <option value="">All License Pools</option>
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
            Manage Pools
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center justify-center gap-1.5 px-4 py-2 text-white rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer" style={{background: "#00549F"}}
          >
            <Plus className="w-4 h-4" />
            Create License
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
                  ? "border-[#00549F] text-[#00549F]" 
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              Active Titles
            </button>
            <button
              onClick={() => { setActiveTab("INCOMPLETE"); setSelectedLicense(null); }}
              className={`pb-3 text-xs font-semibold tracking-wide uppercase border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "INCOMPLETE" 
                  ? "border-amber-600 text-amber-600" 
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              Incomplete Policy Checks
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
              Archived
            </button>
          </div>

          {/* Licenses items */}
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
            {filteredLicenses.length === 0 ? (
              <div className="bg-slate-50 rounded-xl p-12 text-center border border-slate-100">
                <Folder className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-medium text-slate-700">No software assets found in this state.</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Use the "Create License" or "Invoice Ingest" option to populate the inventory.</p>
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
                        ? "border-[#00549F]" 
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-xs text-slate-900">{lic.softwareName}</span>
                        {lic.isSubscription && (
                          <span className="bg-sky-50 text-sky-700 text-[9px] font-bold px-1.5 py-0.5 rounded border border-sky-200">
                            Subscription
                          </span>
                        )}
                        {pool && (
                          <span className="bg-purple-50 text-purple-700 text-[9px] font-bold px-1.5 py-0.5 rounded border border-purple-200">
                            Pool: {pool.name}
                          </span>
                        )}
                        {isInc && (
                          <span className="bg-amber-50 text-amber-700 text-[9px] font-bold px-1.5 py-0.5 rounded border border-amber-200 flex items-center gap-0.5">
                            <ShieldAlert className="w-2.5 h-2.5" /> Policy Incomplete
                          </span>
                        )}
                      </div>
                      <p className="text-slate-500 text-[11px] mt-1">
                        Publisher: <strong className="text-slate-700">{lic.publisher}</strong> | Metric: <strong className="text-slate-700">{lic.metricType}</strong>
                      </p>
                      {lic.sku && (
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">SKU: {lic.sku}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-6 self-start sm:self-center">
                      <div className="text-right">
                        <span className="block text-[10px] uppercase font-medium text-slate-400 tracking-wider">Entitlements</span>
                        <span className="text-sm font-bold text-slate-800">{lic.totalQuantity}</span>
                      </div>
                      <div className="text-right">
                        <span className="block text-[10px] uppercase font-medium text-slate-400 tracking-wider">Allocated</span>
                        <span className="text-sm font-bold text-slate-800">{lic.allocatedQuantity || 0}</span>
                      </div>
                      <div className="text-right">
                        <span className="block text-[10px] uppercase font-medium text-slate-400 tracking-wider">Unassigned</span>
                        <span className="text-sm font-bold" style={{color: "#00549F"}}>
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
                      title="Edit license properties"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    {selectedLicense.status !== "Archived" && (
                      <button
                        onClick={() => handleArchiveLicense(selectedLicense.id)}
                        className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-amber-700 cursor-pointer"
                        title="Archive license"
                      >
                        <Archive className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteLicense(selectedLicense.id)}
                      className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-rose-700 cursor-pointer"
                      title="Delete license contract"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">Asset ID: {selectedLicense.id}</p>
              </div>

              {isEditing ? (
                /* EDITING PROPERTIES STATE */
                <form onSubmit={handleUpdateLicense} className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider" style={{color: "#00549F"}}>Edit Properties</h4>
                  
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase">Product Title</label>
                    <input
                      type="text"
                      required
                      value={editSoftwareName}
                      onChange={(e) => setEditSoftwareName(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded p-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white mt-1"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase">Publisher</label>
                    <input
                      type="text"
                      required
                      value={editPublisher}
                      onChange={(e) => setEditPublisher(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded p-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white mt-1"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase">Metric Model</label>
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
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase">Agreement (Contract)</label>
                    <select
                      value={editAgreementId}
                      onChange={(e) => setEditAgreementId(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded p-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white mt-1"
                    >
                      <option value="">-- No Contract Binding --</option>
                      {agreements.map((a) => (
                        <option key={a.id} value={a.id}>{a.name} ({a.number})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase">License Pool</label>
                    <select
                      value={editLicensePoolId}
                      onChange={(e) => setEditLicensePoolId(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded p-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white mt-1"
                    >
                      <option value="">-- No License Pool --</option>
                      {licensePools.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase">SKU (Part Number)</label>
                    <input
                      type="text"
                      value={editSku}
                      onChange={(e) => setEditSku(e.target.value)}
                      placeholder="e.g. SKU-123-X"
                      className="w-full text-xs border border-slate-200 rounded p-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white mt-1"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase">Version</label>
                    <input
                      type="text"
                      value={editVersion}
                      onChange={(e) => setEditVersion(e.target.value)}
                      placeholder="e.g. 2025 Enterprise"
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
                      Downgrade Rights
                    </label>
                    <label className="flex items-center gap-1 text-xs text-slate-700 font-medium">
                      <input
                        type="checkbox"
                        checked={editIsSub}
                        onChange={(e) => setEditIsSub(e.target.checked)}
                      />
                      SaaS Subscription
                    </label>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="submit"
                      className="px-3 py-1.5 text-white rounded text-xs font-semibold cursor-pointer" style={{background: "#00549F"}}
                    >
                      Save Changes
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                /* VIEW PROPERTIES STATE */
                <div className="space-y-4">
                  {/* Local Org Policy Validation Widget */}
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-150">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">License Policy Check</span>
                      {selectedLicense.status === "Incomplete" ? (
                        <span className="text-[10px] text-amber-700 font-bold bg-amber-100 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                          <AlertCircle className="w-3 h-3" /> Incomplete Action Needed
                        </span>
                      ) : (
                        <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                          <CheckCircle className="w-3 h-3" /> Policy Approved
                        </span>
                      )}
                    </div>
                    
                    <div className="mt-2 space-y-1 text-[10px]">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Bound to Agreement Contract</span>
                        {selectedLicense.agreementId ? (
                          <span className="text-emerald-600 font-semibold">Verified</span>
                        ) : (
                          <span className="text-amber-600 font-bold">Missing Required Field</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Valid SKUs & Manufacturer Part ID</span>
                        {selectedLicense.sku ? (
                          <span className="text-emerald-600 font-semibold">Verified</span>
                        ) : (
                          <span className="text-amber-600 font-bold">Missing Required Field</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* General Specifications info */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="block text-[10px] font-semibold text-slate-400 uppercase">Publisher</span>
                      <span className="font-semibold text-slate-800">{selectedLicense.publisher}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-semibold text-slate-400 uppercase">Metric Model</span>
                      <span className="font-semibold text-slate-800">{selectedLicense.metricType}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-semibold text-slate-400 uppercase">Version</span>
                      <span className="font-medium text-slate-800">{selectedLicense.version || "N/A"}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-semibold text-slate-400 uppercase">SKU</span>
                      <span className="font-mono text-slate-800">{selectedLicense.sku || "N/A"}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-semibold text-slate-400 uppercase">Agreement</span>
                      <span className="font-semibold hover:underline cursor-pointer" style={{color: "#00549F"}}>
                        {agreements.find(a => a.id === selectedLicense.agreementId)?.name || "Unbound Contract"}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-semibold text-slate-400 uppercase">Downgrade Rights</span>
                      <span className="font-medium text-slate-800">{selectedLicense.downgradeRights ? "Yes" : "No"}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-semibold text-slate-400 uppercase">License Pool</span>
                      <span className="font-semibold text-purple-700">
                        {licensePools.find(p => p.id === selectedLicense.licensePoolId)?.name || "Unassociated"}
                      </span>
                    </div>
                  </div>

                  {selectedLicense.notes && (
                    <div>
                      <span className="block text-[10px] font-semibold text-slate-400 uppercase">Notes</span>
                      <p className="text-[11px] text-slate-500 mt-1 italic">{selectedLicense.notes}</p>
                    </div>
                  )}

                  {/* Manual Assignment allocations segment */}
                  <div className="border-t border-slate-100 pt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1">
                        <UserPlus className="w-3.5 h-3.5" /> Manual Allocations
                      </h4>
                      <span className="text-[10px] text-slate-500">
                        {assignments.reduce((sum, a) => sum + a.quantity, 0)} allocated
                      </span>
                    </div>

                    {/* Form to add new assignment */}
                    {selectedLicense.status !== "Archived" && (
                      <form onSubmit={handleAllocate} className="bg-slate-50 p-2.5 rounded-lg border border-slate-150 flex flex-col gap-2">
                        <span className="block text-[10px] font-semibold text-slate-600">Allocate Entitlement:</span>
                        <div className="flex gap-2">
                          <select
                            value={allocTargetType}
                            onChange={(e) => setAllocTargetType(e.target.value as any)}
                            className="text-[10px] border border-slate-200 rounded px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                          >
                            <option value="User">User</option>
                            <option value="Device">Device</option>
                            <option value="OrgUnit">Org Unit</option>
                          </select>
                          <input
                            type="text"
                            required
                            placeholder={
                              allocTargetType === "User" 
                                ? "email@domain.com" 
                                : allocTargetType === "Device" 
                                ? "DESKTOP-J89A" 
                                : "Sales Department"
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
                            className="px-2 py-1 text-white font-semibold rounded text-[10px] disabled:opacity-50 cursor-pointer" style={{background: "#00549F"}}
                          >
                            Assign
                          </button>
                        </div>
                      </form>
                    )}

                    {/* Assignments List */}
                    <div className="max-h-[160px] overflow-y-auto space-y-1.5 pr-1">
                      {isAssignmentsLoading ? (
                        <p className="text-[10px] text-slate-400 text-center py-2">Loading assignments...</p>
                      ) : assignments.length === 0 ? (
                        <p className="text-[10px] text-slate-400 text-center py-2 bg-slate-50 rounded italic border border-dashed border-slate-200">
                          No manual allocations mapped. All entitlements are autoallocated dynamically by the Compliance calculations.
                        </p>
                      ) : (
                        assignments.map((asg) => (
                          <div key={asg.id} className="bg-white border border-slate-150 p-2 rounded-lg flex items-center justify-between gap-2 shadow-sm text-[10px]">
                            <div>
                              <div className="flex items-center gap-1">
                                <span className="font-semibold text-slate-700">Type: {asg.targetType}</span>
                                <span className="text-[9px] text-slate-400">({new Date(asg.allocatedAt).toLocaleDateString()})</span>
                              </div>
                              <span className="block text-slate-500 font-mono text-[9px] truncate max-w-[140px]">{asg.targetId}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-800">×{asg.quantity}</span>
                              <button
                                onClick={() => handleDeallocate(asg.id)}
                                className="p-0.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                                title="Deallocate allocation"
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
              <p className="text-xs font-semibold text-slate-600">No License Selected</p>
              <p className="text-[10px] mt-0.5">Click any software title card to view audit policies, assignments logs, contract spec alignments, and settings drawer.</p>
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
                  <FileText className="w-4 h-4" style={{color: "#00549F"}} /> Create Enterprise License Asset
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
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Product Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Office 365 Enterprise"
                      value={softwareName}
                      onChange={(e) => setSoftwareName(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white mt-1"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Publisher / Manufacturer *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Microsoft"
                      value={publisher}
                      onChange={(e) => setPublisher(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Metric Reconciliation Model *</label>
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
                      <span>Agreement (Contract)</span>
                      <span className="text-[8px] text-amber-600 font-bold">Policy Mandatory</span>
                    </label>
                    <select
                      value={agreementId}
                      onChange={(e) => setAgreementId(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white mt-1"
                    >
                      <option value="">-- Leave Unbound (Forces Incomplete) --</option>
                      {agreements.map((a) => (
                        <option key={a.id} value={a.id}>{a.name} ({a.number})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">License Pool</label>
                  <select
                    value={licensePoolId}
                    onChange={(e) => setLicensePoolId(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white mt-1"
                  >
                    <option value="">-- No License Pool --</option>
                    {licensePools.map((pool) => (
                      <option key={pool.id} value={pool.id}>{pool.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase flex items-center justify-between">
                      <span>SKU Code (Part Number)</span>
                      <span className="text-[8px] text-amber-600 font-bold">Policy Mandatory</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. MS-WS22-CORE"
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white mt-1"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Version Tag</label>
                    <input
                      type="text"
                      placeholder="e.g. 2022 R2"
                      value={version}
                      onChange={(e) => setVersion(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white mt-1"
                    />
                  </div>
                </div>

                {/* Initial Purchase Information (Creates purchase entitlement) */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                  <h4 className="text-[10px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" style={{color: "#00549F"}} /> Initial Purchase Entitlement (PO / Invoice line)
                  </h4>
                  
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[9px] font-semibold text-slate-500 uppercase">Quantity</label>
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
                      <label className="block text-[9px] font-semibold text-slate-500 uppercase">Unit Cost ($)</label>
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
                      <label className="block text-[9px] font-semibold text-slate-500 uppercase">Invoice #</label>
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
                    Grant Downgrade Rights
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
                    <input
                      type="checkbox"
                      checked={isSubscription}
                      onChange={(e) => setIsSubscription(e.target.checked)}
                    />
                    SaaS Cloud Subscription
                  </label>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Notes & Audit Instructions</label>
                  <textarea
                    rows={2}
                    placeholder="Enter special contract notes or downgrade paths."
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
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-white rounded-lg text-xs font-semibold cursor-pointer" style={{background: "#00549F"}}
                  >
                    Save & Reconcile
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
                  <Folder className="w-4 h-4 text-purple-600" /> Manage Enterprise License Pools
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
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Create New Pool</h4>
                  <form onSubmit={handleCreatePool} className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Pool Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. European Operations Pool"
                        value={newPoolName}
                        onChange={(e) => setNewPoolName(e.target.value)}
                        className="w-full text-xs border border-slate-200 rounded p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white mt-1"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Description</label>
                      <textarea
                        rows={3}
                        placeholder="Purpose or region alignment..."
                        value={newPoolDesc}
                        onChange={(e) => setNewPoolDesc(e.target.value)}
                        className="w-full text-xs border border-slate-200 rounded p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white mt-1"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Owner Org Node / Department</label>
                      <input
                        type="text"
                        placeholder="e.g. EMEA Division"
                        value={newPoolOwner}
                        onChange={(e) => setNewPoolOwner(e.target.value)}
                        className="w-full text-xs border border-slate-200 rounded p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white mt-1"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg text-xs transition-all cursor-pointer"
                    >
                      Create Pool
                    </button>
                  </form>
                </div>

                {/* Right Side: Pools List */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between">
                    <span>Active License Pools</span>
                    <span className="bg-purple-100 text-purple-800 rounded-full px-2 py-0.5 text-[9px] font-bold">
                      {licensePools.length} pools
                    </span>
                  </h4>

                  <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                    {licensePools.length === 0 ? (
                      <div className="text-center py-8 text-slate-400 text-xs italic">
                        No custom pools defined. Use the form to establish your first license containment boundary.
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
                              title="Delete License Pool"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            <h5 className="font-bold text-slate-800 text-xs pr-6">{pool.name}</h5>
                            {pool.description && (
                              <p className="text-slate-500 text-[10px] mt-0.5 leading-snug">{pool.description}</p>
                            )}
                            {pool.ownerOrgNodeId && (
                              <p className="text-[9px] text-purple-600 font-semibold mt-1">Owner: {pool.ownerOrgNodeId}</p>
                            )}
                            <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[9px] text-slate-500">
                              <span>Licenses associated: <strong>{associatedCount}</strong></span>
                              <span>Total Quantity: <strong className="text-purple-700">{totalEntitlements}</strong></span>
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
                  Close Manager
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
