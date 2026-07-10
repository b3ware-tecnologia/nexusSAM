import React, { useState, useEffect } from "react";
import { Cloud, Plus, RefreshCw, AlertTriangle, CheckCircle, HelpCircle, TrendingDown, Layers } from "lucide-react";
import { CloudConnector, CloudResource } from "../types.js";

export function CloudView() {
  const [connectors, setConnectors] = useState<CloudConnector[]>([]);
  const [resources, setResources] = useState<CloudResource[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newConnName, setNewConnName] = useState("");
  const [newConnProvider, setNewConnProvider] = useState<"AWS" | "Azure" | "GCP">("AWS");

  const [providerFilter, setProviderFilter] = useState<string>("All");
  const [modelFilter, setModelFilter] = useState<string>("All");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [connRes, resRes] = await Promise.all([
        fetch("/api/cloud/connectors"),
        fetch("/api/cloud/resources")
      ]);
      if (connRes.ok && resRes.ok) {
        const conns = await connRes.json();
        const rsrcs = await resRes.json();
        setConnectors(conns);
        setResources(rsrcs);
      } else {
        setError("Failed to fetch cloud asset data.");
      }
    } catch (e: any) {
      setError(e.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/cloud/sync", { method: "POST" });
      if (res.ok) {
        await fetchData();
      } else {
        setError("Sync request failed.");
      }
    } catch (e: any) {
      setError(e.message || "Failed to trigger sync");
    } finally {
      setSyncing(false);
    }
  };

  const handleAddConnector = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newConnName) return;
    try {
      const res = await fetch("/api/cloud/connectors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newConnName, provider: newConnProvider })
      });
      if (res.ok) {
        setNewConnName("");
        setShowAddForm(false);
        await fetchData();
      } else {
        const errData = await res.json();
        setError(errData.error || "Failed to create connector");
      }
    } catch (e: any) {
      setError(e.message || "Error adding connector");
    }
  };

  // Filter computation
  const filteredResources = resources.filter(res => {
    const matchProvider = providerFilter === "All" || res.provider === providerFilter;
    const matchModel = modelFilter === "All" || res.pricingModel === modelFilter;
    return matchProvider && matchModel;
  });

  // Calculate metrics
  const totalMonthlySpend = resources.reduce((acc, curr) => acc + curr.cost, 0);
  const paygSpend = resources.filter(r => r.pricingModel === "PAYG").reduce((acc, curr) => acc + curr.cost, 0);
  const byolSpend = resources.filter(r => r.pricingModel === "BYOL").reduce((acc, curr) => acc + curr.cost, 0);
  
  // Calculate potential savings: parse through recommendations for cost numbers
  const potentialSavings = resources
    .filter(r => !r.hasLicenseCoverage && r.recommendation.toLowerCase().includes("save"))
    .reduce((acc, curr) => {
      const match = curr.recommendation.match(/\$(\d+)/);
      if (match && match[1]) {
        return acc + parseInt(match[1], 10);
      }
      return acc;
    }, 0);

  const doublePayCount = resources.filter(r => r.recommendation.toLowerCase().includes("double-pay") || r.recommendation.toLowerCase().includes("double pay")).length;

  return (
    <div className="space-y-6" id="cloud-license-view">
      {/* Alert Banner */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md text-xs text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="font-bold underline cursor-pointer">Dispensar</button>
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-xl border border-[#D0D0D0] shadow-xs flex flex-col justify-between" id="card-cloud-spend">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-[#A6A7A7] uppercase tracking-wider">Gasto Total com VM/DB na Nuvem</span>
            <Cloud className="w-4 h-4 text-[#A6A7A7]" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-[#212424]">${totalMonthlySpend.toLocaleString()}/mo</h3>
            <p className="text-[10px] text-[#6E7070] mt-1">Em contas de nuvem descobertas</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#D0D0D0] shadow-xs flex flex-col justify-between" id="card-cloud-payg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-[#A6A7A7] uppercase tracking-wider">Custo de Licenciamento PAYG</span>
            <TrendingDown className="w-4 h-4 text-orange-500" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-[#212424]">${paygSpend.toLocaleString()}/mo</h3>
            <p className="text-[10px] text-orange-600 font-semibold mt-1">
              {((paygSpend / (totalMonthlySpend || 1)) * 100).toFixed(0)}% do custo total é PAYG
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#D0D0D0] shadow-xs flex flex-col justify-between" id="card-cloud-byol">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-[#A6A7A7] uppercase tracking-wider">Coberturas BYOL Ativas</span>
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-[#212424]">${byolSpend.toLocaleString()}/mo</h3>
            <p className="text-[10px] text-emerald-600 font-semibold mt-1">
              {resources.filter(r => r.pricingModel === "BYOL").length} recursos BYOL ativos
            </p>
          </div>
        </div>

        <div className="bg-indigo-900 text-white p-5 rounded-xl shadow-md flex flex-col justify-between relative overflow-hidden" id="card-cloud-savings">
          <div className="absolute right-0 top-0 opacity-10 transform translate-x-2 -translate-y-2">
            <Cloud className="w-24 h-24" />
          </div>
          <div className="flex items-center justify-between mb-3 z-10">
            <span className="text-[10px] font-bold text-indigo-200 uppercase tracking-wider">Meta de economia otimizável</span>
            <span className="px-1.5 py-0.5 rounded text-[9px] bg-red-500 text-white font-bold animate-pulse">Oportunidade BYOL</span>
          </div>
          <div className="z-10">
            <h3 className="text-xl font-bold text-indigo-100">${potentialSavings.toLocaleString()}/mo</h3>
            <p className="text-[10px] text-indigo-300 mt-1">
              Encontradas {doublePayCount} anomalias de duplo pagamento
            </p>
          </div>
        </div>
      </div>

      {/* Connectors & Operations Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Connectors list */}
        <div className="bg-white p-6 rounded-xl border border-[#D0D0D0] shadow-xs lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#212424]">Gateways de API de Nuvem</h3>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-2 py-1 bg-[#366BB2] text-white text-[10px] font-bold rounded-lg flex items-center gap-1 hover:bg-[#4079C4] transition cursor-pointer"
              id="btn-add-cloud-connector"
            >
              <Plus className="w-3 h-3" />
              Adicionar
            </button>
          </div>

          {showAddForm && (
            <form onSubmit={handleAddConnector} className="bg-[#F2F2F2] p-4 rounded-lg border border-[#D0D0D0] mb-4 space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-[#6E7070] mb-1">Nome do Conector</label>
                <input
                  type="text"
                  value={newConnName}
                  onChange={e => setNewConnName(e.target.value)}
                  placeholder="Subconta de Produção AWS"
                  className="w-full text-xs px-2.5 py-1.5 bg-white border border-[#D0D0D0] rounded-lg focus:outline-indigo-500 text-[#212424]"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#6E7070] mb-1">Provedor</label>
                <select
                  value={newConnProvider}
                  onChange={e => setNewConnProvider(e.target.value as any)}
                  className="w-full text-xs px-2.5 py-1.5 bg-white border border-[#D0D0D0] rounded-lg focus:outline-indigo-500 text-[#212424]"
                >
                  <option value="AWS">Amazon Web Services (AWS)</option>
                  <option value="Azure">Microsoft Azure</option>
                  <option value="GCP">Google Cloud Platform (GCP)</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-2 py-1 text-[10px] bg-white border border-[#D0D0D0] rounded text-[#6E7070]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-2 py-1 text-[10px] bg-[#366BB2] text-white font-bold rounded cursor-pointer"
                >
                  Salvar Gateway
                </button>
              </div>
            </form>
          )}

          <div className="space-y-3">
            {connectors.length === 0 ? (
              <div className="text-center py-6 text-xs text-[#A6A7A7]">Nenhum conector de nuvem configurado.</div>
            ) : (
              connectors.map(conn => (
                <div key={conn.id} className="p-3 bg-[#F2F2F2] border border-[#D0D0D0] rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-white border border-[#D0D0D0] flex items-center justify-center font-bold text-xs">
                      {conn.provider === "AWS" && <span className="text-orange-500 font-mono">aws</span>}
                      {conn.provider === "Azure" && <span className="text-sky-500 font-mono">azr</span>}
                      {conn.provider === "GCP" && <span className="text-red-500 font-mono">gcp</span>}
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-[#212424]">{conn.name}</h4>
                      <p className="text-[9px] text-[#A6A7A7]">
                        {conn.resourceCount} resource VM/DB • Synced: {conn.lastSyncedAt ? new Date(conn.lastSyncedAt).toLocaleDateString() : "Never"}
                      </p>
                    </div>
                  </div>
                  <div>
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                      conn.status === "Connected" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                    }`}>
                      {conn.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-5 border-t border-[#D0D0D0] pt-4">
            <button
              onClick={handleSync}
              disabled={syncing}
              className="w-full py-2 bg-[#F2F2F2] text-[#6E7070] hover:bg-[#E8E8E8] rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
              {syncing ? "Escaneando Nuvens..." : "Acionar Varredura BYOL na Nuvem"}
            </button>
          </div>
        </div>

        {/* Right column: Discovered Cloud Assets & Double-Pay Analysis */}
        <div className="bg-white p-6 rounded-xl border border-[#D0D0D0] shadow-xs lg:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#212424]">Recursos de Nuvem Descobertos e Benefícios Híbridos</h3>
              <p className="text-[10px] text-[#A6A7A7] mt-0.5">A verificação de Duplo Pagamento confirma se você paga ao provedor por licenças que já possui</p>
            </div>
            
            {/* Filters */}
            <div className="flex gap-2">
              <select
                value={providerFilter}
                onChange={e => setProviderFilter(e.target.value)}
                className="text-[10px] bg-[#F2F2F2] border border-[#D0D0D0] rounded-lg px-2.5 py-1 text-[#6E7070]"
              >
                <option value="All">Todos os Provedores</option>
                <option value="AWS">Apenas AWS</option>
                <option value="Azure">Apenas Azure</option>
                <option value="GCP">Apenas GCP</option>
              </select>

              <select
                value={modelFilter}
                onChange={e => setModelFilter(e.target.value)}
                className="text-[10px] bg-[#F2F2F2] border border-[#D0D0D0] rounded-lg px-2.5 py-1 text-[#6E7070]"
              >
                <option value="All">Todas as Licenças</option>
                <option value="PAYG">PAYG</option>
                <option value="BYOL">BYOL</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#6E7070]">
              <thead>
                <tr className="border-b border-[#D0D0D0] text-[10px] font-bold text-[#A6A7A7] uppercase bg-[#F2F2F2]/50">
                  <th className="py-2.5 px-3">Nome do Recurso</th>
                  <th className="py-2.5 px-3">Provedor / Tipo</th>
                  <th className="py-2.5 px-3">Software Instalado</th>
                  <th className="py-2.5 px-3">Custo / Modelo</th>
                  <th className="py-2.5 px-3">Benefício Híbrido</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D0D0D0]">
                {filteredResources.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-xs text-[#A6A7A7]">Nenhum ativo de nuvem descoberto correspondente encontrado.</td>
                  </tr>
                ) : (
                  filteredResources.map(res => {
                    const isDoublePay = res.recommendation.toLowerCase().includes("double-pay") || res.recommendation.toLowerCase().includes("double pay");
                    return (
                      <tr key={res.id} className="hover:bg-[#F2F2F2]/50 transition">
                        <td className="py-3 px-3 font-medium text-[#212424]">
                          <div className="flex flex-col">
                            <span>{res.name}</span>
                            {isDoublePay && (
                              <span className="text-[9px] text-orange-600 font-bold mt-0.5 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3 text-orange-500 shrink-0" />
                                Alerta de Duplo Pagamento
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex flex-col">
                            <span className="text-[11px] font-bold text-[#6E7070]">{res.provider}</span>
                            <span className="text-[9px] text-[#A6A7A7]">{res.type}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 font-mono text-[10px] text-[#212424]">
                          {res.softwareInstalled.join(", ")}
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex flex-col">
                            <span className="font-semibold text-[#212424]">${res.cost}/mo</span>
                            <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded-full w-max mt-0.5 ${
                              res.pricingModel === "BYOL" 
                                ? "bg-indigo-100 text-indigo-800" 
                                : "bg-orange-100 text-orange-800"
                            }`}>
                              {res.pricingModel === "BYOL" ? "BYOL (Traga Sua Própria Licença)" : "PAYG (Pague Conforme o Uso)"}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3 max-w-xs text-[10px]">
                          <div className={`p-2 rounded-lg text-[#6E7070] ${
                            res.hasLicenseCoverage ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"
                          }`}>
                            <p className="font-medium leading-normal">{res.recommendation}</p>
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
    </div>
  );
}
