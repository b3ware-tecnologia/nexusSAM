import React, { useState, useEffect } from "react";
import { Plus, Tags, PlusCircle, Check, RefreshCw, BarChart, Settings, ListFilter, AlertCircle } from "lucide-react";
import { CustomFieldDefinition, CustomFieldValue, CustomMetric } from "../types.js";

export function CustomFieldsView() {
  const [definitions, setDefinitions] = useState<CustomFieldDefinition[]>([]);
  const [fieldValues, setFieldValues] = useState<CustomFieldValue[]>([]);
  const [metrics, setMetrics] = useState<CustomMetric[]>([]);
  
  // Entity lists loaded based on selected type
  const [entities, setEntities] = useState<any[]>([]);
  const [selectedTargetType, setSelectedTargetType] = useState<"License" | "Computer" | "Application" | "Subscription">("License");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // New field definition state
  const [newDefName, setNewDefName] = useState("");
  const [newDefTarget, setNewDefTarget] = useState<"License" | "Computer" | "Application" | "Subscription">("License");
  const [newDefType, setNewDefType] = useState<"Text" | "Number" | "Boolean" | "Date">("Text");

  // New metric state
  const [newMetName, setNewMetName] = useState("");
  const [newMetDesc, setNewMetDesc] = useState("");
  const [newMetCriteria, setNewMetCriteria] = useState("");
  const [newMetValue, setNewMetValue] = useState("");

  // Edit buffer for bulk editing custom fields
  // Key format: "entityId:definitionId" -> string value
  const [editBuffer, setEditBuffer] = useState<Record<string, string>>({});

  const fetchData = async () => {
    setLoading(true);
    try {
      const [defRes, valRes, metRes] = await Promise.all([
        fetch("/api/custom-fields/definitions"),
        fetch("/api/custom-fields/values"),
        fetch("/api/custom-metrics")
      ]);
      if (defRes.ok && valRes.ok && metRes.ok) {
        setDefinitions(await defRes.json());
        setFieldValues(await valRes.json());
        setMetrics(await metRes.json());
      } else {
        setError("Failed to fetch custom configurations.");
      }
    } catch (e: any) {
      setError(e.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const fetchEntities = async () => {
    try {
      let url = "/api/licenses";
      if (selectedTargetType === "Computer") url = "/api/computers";
      if (selectedTargetType === "Application") url = "/api/catalog"; // we can fallback if not supported, but let's query standard inventory /api/computers
      if (selectedTargetType === "Subscription") url = "/api/saas/applications";

      const res = await fetch(url);
      if (res.ok) {
        setEntities(await res.json());
      } else {
        // Fallback placeholders for catalog / SaaS if they don't have dedicated list endpoints
        if (selectedTargetType === "Application") {
          const catRes = await fetch("/api/licenses"); // fallback to software names in licenses
          if (catRes.ok) {
            const data = await catRes.json();
            setEntities(data.map((l: any) => ({ id: l.id, name: l.softwareName, publisher: l.publisher })));
          }
        } else if (selectedTargetType === "Subscription") {
          const saasRes = await fetch("/api/saas/applications");
          if (saasRes.ok) {
            setEntities(await saasRes.json());
          } else {
            setEntities([
              { id: "saas-app-m365", name: "Microsoft 365", publisher: "Microsoft" },
              { id: "saas-app-salesforce", name: "Salesforce CRM", publisher: "Salesforce" }
            ]);
          }
        }
      }
    } catch (e) {
      // safe fallback data
      setEntities([]);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchEntities();
    // Clear edit buffer when changing targets
    setEditBuffer({});
  }, [selectedTargetType]);

  const handleAddDefinition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDefName) return;
    try {
      const res = await fetch("/api/custom-fields/definitions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetType: newDefTarget,
          name: newDefName,
          fieldType: newDefType
        })
      });
      if (res.ok) {
        setNewDefName("");
        setSuccessMsg("Defined custom field successfully.");
        await fetchData();
      } else {
        setError("Failed to create custom field definition.");
      }
    } catch (e: any) {
      setError(e.message || "Error adding custom field definition");
    }
  };

  const handleAddMetric = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMetName || !newMetCriteria) return;
    try {
      const res = await fetch("/api/custom-metrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newMetName,
          description: newMetDesc,
          queryCriteria: newMetCriteria,
          value: Number(newMetValue || 0)
        })
      });
      if (res.ok) {
        setNewMetName("");
        setNewMetDesc("");
        setNewMetCriteria("");
        setNewMetValue("");
        setSuccessMsg("Created custom metric successfully.");
        await fetchData();
      } else {
        setError("Failed to configure custom metric.");
      }
    } catch (e: any) {
      setError(e.message || "Error adding custom metric");
    }
  };

  const handleBufferChange = (entityId: string, definitionId: string, value: string) => {
    setEditBuffer(prev => ({
      ...prev,
      [`${entityId}:${definitionId}`]: value
    }));
  };

  const handleBulkUpdate = async () => {
    const updates = Object.entries(editBuffer).map(([key, value]) => {
      const [entityId, definitionId] = key.split(":");
      return { entityId, definitionId, value };
    });

    if (updates.length === 0) {
      setError("No changes made in fields table.");
      return;
    }

    try {
      const res = await fetch("/api/custom-fields/bulk-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates })
      });
      if (res.ok) {
        setSuccessMsg(`Successfully updated ${updates.length} custom fields.`);
        setEditBuffer({});
        await fetchData();
      } else {
        setError("Failed to apply bulk update.");
      }
    } catch (e: any) {
      setError(e.message || "Error during bulk update");
    }
  };

  // Filters definitions matching currently selected target type
  const targetDefs = definitions.filter(d => d.targetType === selectedTargetType);

  return (
    <div className="space-y-6" id="custom-fields-and-metrics-view">
      {/* Alert Notifications */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md text-xs text-red-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="font-bold underline cursor-pointer">Dismiss</button>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-md text-xs text-emerald-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-500" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="font-bold underline cursor-pointer">Dismiss</button>
        </div>
      )}

      {/* Grid of Metric Definitions and Fields creation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Box 1: Custom Metrics Analyzer */}
        <div className="bg-white p-6 rounded-xl border border-[#DDDDDD] shadow-xs lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
              <BarChart className="w-4 h-4 text-indigo-500" />
              Custom Metrics (KPIs)
            </h3>
          </div>

          <form onSubmit={handleAddMetric} className="bg-slate-50 p-4 rounded-lg border border-slate-100 space-y-3">
            <h4 className="text-[10px] font-bold text-slate-500 uppercase">Create custom KPI Analyzer</h4>
            <div className="space-y-2">
              <input
                type="text"
                value={newMetName}
                onChange={e => setNewMetName(e.target.value)}
                placeholder="Metric Name (e.g., Adobe Waste)"
                className="w-full text-xs px-2.5 py-1.5 bg-white border border-[#DDDDDD] rounded-lg focus:outline-indigo-500 text-slate-800"
                required
              />
              <input
                type="text"
                value={newMetCriteria}
                onChange={e => setNewMetCriteria(e.target.value)}
                placeholder="Query/Criteria (e.g. Adobe risk > 50)"
                className="w-full text-xs px-2.5 py-1.5 bg-white border border-[#DDDDDD] rounded-lg focus:outline-indigo-500 text-slate-800"
                required
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  value={newMetValue}
                  onChange={e => setNewMetValue(e.target.value)}
                  placeholder="Computed Cost ($)"
                  className="w-full text-xs px-2.5 py-1.5 bg-white border border-[#DDDDDD] rounded-lg focus:outline-indigo-500 text-slate-800"
                />
                <button
                  type="submit"
                  className="w-full text-xs bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg transition"
                >
                  Create Metric
                </button>
              </div>
            </div>
          </form>

          {/* List of custom metrics */}
          <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
            {metrics.map(met => (
              <div key={met.id} className="p-3 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-800">{met.name}</h4>
                  <p className="text-[9px] text-slate-400 font-mono">Criteria: {met.queryCriteria}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-bold text-slate-900 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded">
                    ${met.value.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Box 2: Custom Field Dictionary definitions */}
        <div className="bg-white p-6 rounded-xl border border-[#DDDDDD] shadow-xs lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
              <Tags className="w-4 h-4 text-indigo-500" />
              Custom Fields Schema
            </h3>
          </div>

          <form onSubmit={handleAddDefinition} className="bg-slate-50 p-4 rounded-lg border border-slate-100 space-y-3">
            <h4 className="text-[10px] font-bold text-slate-500 uppercase">Add Column/Field to Schema</h4>
            <div className="space-y-2">
              <input
                type="text"
                value={newDefName}
                onChange={e => setNewDefName(e.target.value)}
                placeholder="Field Label (e.g. Cost Center)"
                className="w-full text-xs px-2.5 py-1.5 bg-white border border-[#DDDDDD] rounded-lg focus:outline-indigo-500 text-slate-800"
                required
              />
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={newDefTarget}
                  onChange={e => setNewDefTarget(e.target.value as any)}
                  className="text-xs px-2.5 py-1.5 bg-white border border-[#DDDDDD] rounded-lg focus:outline-indigo-500 text-slate-800"
                >
                  <option value="License">SAM Licenses</option>
                  <option value="Computer">Computers (HAM)</option>
                  <option value="Application">Catalog items</option>
                  <option value="Subscription">SaaS Subscriptions</option>
                </select>
                <select
                  value={newDefType}
                  onChange={e => setNewDefType(e.target.value as any)}
                  className="text-xs px-2.5 py-1.5 bg-white border border-[#DDDDDD] rounded-lg focus:outline-indigo-500 text-slate-800"
                >
                  <option value="Text">String Text</option>
                  <option value="Number">Number Float</option>
                  <option value="Boolean">Yes / No flag</option>
                  <option value="Date">Date Timestamp</option>
                </select>
              </div>
              <button
                type="submit"
                className="w-full py-1.5 text-xs bg-[#00549F] text-white font-bold rounded-lg cursor-pointer"
              >
                Define Custom Field
              </button>
            </div>
          </form>

          {/* List of definitions */}
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {definitions.map(def => (
              <div key={def.id} className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-800">{def.name}</span>
                  <span className="text-[9px] text-slate-400 block font-mono">Type: {def.fieldType}</span>
                </div>
                <div>
                  <span className="px-1.5 py-0.2 rounded text-[8px] bg-slate-200 text-slate-600 font-bold uppercase">
                    {def.targetType}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Box 3: Quick Settings summary */}
        <div className="bg-slate-900 text-slate-200 p-6 rounded-xl border border-slate-800 shadow-xs lg:col-span-1 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-2 flex items-center gap-1.5">
              <Settings className="w-4 h-4 text-[#00549F]/60" />
              ITAM Audit Readiness Guard
            </h3>
            <div className="mt-4 space-y-3 text-xs">
              <p className="text-slate-400 leading-normal">
                IT Asset Management (ITAM) and Hardware Asset Management (HAM) demand customizable tags to match cost-centers, depreciation models, and business owners.
              </p>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2 font-mono text-[9px] text-slate-300">
                <p>● DEFINED SCHEMAS: {definitions.length}</p>
                <p>● POPULATED ASSETS: {fieldValues.length}</p>
                <p>● CUSTOM KPIs TRACKED: {metrics.length}</p>
              </div>
            </div>
          </div>
          <div className="pt-4 border-t border-slate-800 text-[10px] text-slate-500 uppercase tracking-wider">
            Flexera SaaS Multi-Tenant Standard
          </div>
        </div>
      </div>

      {/* Section 4: Dynamic Assets Custom Fields values editor & BULK Write API */}
      <div className="bg-white p-6 rounded-xl border border-[#DDDDDD] shadow-xs" id="custom-fields-bulk-editor">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
              <ListFilter className="w-4 h-4 text-indigo-500" />
              Asset Value Assignments & Bulk Update write APIs
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Edit asset row parameters, then click Bulk Update to execute a single API transaction</p>
          </div>

          {/* Module Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Asset Type:</span>
            <select
              value={selectedTargetType}
              onChange={e => setSelectedTargetType(e.target.value as any)}
              className="text-xs bg-slate-50 border border-[#DDDDDD] rounded-lg px-3 py-1.5 font-semibold text-slate-700 focus:outline-indigo-500"
            >
              <option value="License">SAM core Licenses</option>
              <option value="Computer">Computers (HAM)</option>
              <option value="Application">Software catalog</option>
              <option value="Subscription">SaaS Optimization (SSM)</option>
            </select>

            <button
              onClick={handleBulkUpdate}
              className="px-4 py-1.5 bg-[#00549F] text-white text-[11px] font-bold rounded-lg flex items-center gap-1 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              Bulk Update Assets
            </button>
          </div>
        </div>

        {/* Dynamic Fields Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead>
              <tr className="border-b border-[#DDDDDD] text-[10px] font-bold text-slate-400 uppercase bg-[#F8F8F8]/50">
                <th className="py-2.5 px-3">Asset ID</th>
                <th className="py-2.5 px-3">Asset Title / Vendor</th>
                {targetDefs.map(def => (
                  <th key={def.id} className="py-2.5 px-3 text-indigo-700">
                    {def.name} <span className="text-[8px] font-normal text-slate-400">({def.fieldType})</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {entities.length === 0 ? (
                <tr>
                  <td colSpan={2 + targetDefs.length} className="py-8 text-center text-xs text-slate-400">
                    No active assets of this category found. Define custom field schemas first!
                  </td>
                </tr>
              ) : (
                entities.map(ent => {
                  const title = ent.softwareName || ent.name || "Unnamed Asset";
                  const subText = ent.publisher || ent.brand || "Unspecified Manufacturer";
                  
                  return (
                    <tr key={ent.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3 px-3 font-mono text-[10px] text-slate-500">
                        {ent.id}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-800">{title}</span>
                          <span className="text-[9px] text-slate-400">{subText}</span>
                        </div>
                      </td>
                      
                      {/* Custom defined fields inputs */}
                      {targetDefs.map(def => {
                        // find existing database value
                        const dbVal = fieldValues.find(v => v.definitionId === def.id && v.entityId === ent.id)?.value || "";
                        // buffer override if modified
                        const currentVal = editBuffer[`${ent.id}:${def.id}`] !== undefined 
                          ? editBuffer[`${ent.id}:${def.id}`] 
                          : dbVal;
                        
                        const isModified = editBuffer[`${ent.id}:${def.id}`] !== undefined && editBuffer[`${ent.id}:${def.id}`] !== dbVal;

                        return (
                          <td key={def.id} className="py-2.5 px-3">
                            <input
                              type={def.fieldType === "Number" ? "number" : (def.fieldType === "Date" ? "date" : "text")}
                              value={currentVal}
                              onChange={e => handleBufferChange(ent.id, def.id, e.target.value)}
                              placeholder={`Enter ${def.name}`}
                              className={`text-xs px-2 py-1 w-full rounded border transition-all ${
                                isModified 
                                  ? "bg-amber-50 border-amber-400 focus:outline-amber-500" 
                                  : "bg-white border-[#DDDDDD] focus:outline-indigo-500"
                              }`}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
