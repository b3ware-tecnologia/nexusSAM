import React, { useState, useEffect } from "react";
import { Layers, Plus, RefreshCw, Box, ShieldAlert, CheckCircle, HelpCircle } from "lucide-react";
import { K8sConnector, K8sCluster, ContainerPod } from "../types.js";

export function ContainerView() {
  const [connectors, setConnectors] = useState<K8sConnector[]>([]);
  const [clusters, setClusters] = useState<K8sCluster[]>([]);
  const [pods, setPods] = useState<ContainerPod[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newConnName, setNewConnName] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [connRes, clusRes, podRes] = await Promise.all([
        fetch("/api/containers/connectors"),
        fetch("/api/containers/clusters"),
        fetch("/api/containers/pods")
      ]);
      if (connRes.ok && clusRes.ok && podRes.ok) {
        setConnectors(await connRes.json());
        setClusters(await clusRes.json());
        setPods(await podRes.json());
      } else {
        setError("Failed to fetch Kubernetes container visibility data.");
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
      const res = await fetch("/api/containers/sync", { method: "POST" });
      if (res.ok) {
        await fetchData();
      } else {
        setError("Failed to sync Kubernetes container scanners.");
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
      const res = await fetch("/api/containers/connectors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newConnName })
      });
      if (res.ok) {
        setNewConnName("");
        setShowAddForm(false);
        await fetchData();
      } else {
        setError("Failed to configure new cluster connector.");
      }
    } catch (e: any) {
      setError(e.message || "Error adding cluster connector");
    }
  };

  const unlicensedCount = pods.filter(p => p.licenseStatus === "Non-Compliant" || p.licenseStatus === "Unlicensed").length;

  return (
    <div className="space-y-6" id="container-visibility-view">
      {/* Alert Banner */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md text-xs text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="font-bold underline cursor-pointer">Dispensar</button>
        </div>
      )}

      {/* Cluster Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-xl border border-[#DDDDDD] shadow-xs flex flex-col justify-between" id="card-k8s-clusters">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Clusters Monitorados</span>
            <Layers className="w-4 h-4 text-indigo-500" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">{clusters.length} Clusters K8s</h3>
            <p className="text-[10px] text-slate-500 mt-1">AWS EKS e OpenShift On-Premises</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#DDDDDD] shadow-xs flex flex-col justify-between" id="card-k8s-namespaces">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total de Namespaces</span>
            <Box className="w-4 h-4 text-[#00549F]/60" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">{clusters.reduce((acc, curr) => acc + curr.namespaceCount, 0)} Namespaces</h3>
            <p className="text-[10px] text-slate-500 mt-1">Escopo para varredura do catálogo de licenças</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#DDDDDD] shadow-xs flex flex-col justify-between" id="card-k8s-pods">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pods de Contêiner Inspecionados</span>
            <Box className="w-4 h-4 text-emerald-500" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">{pods.length} Pods Ativos</h3>
            <p className="text-[10px] text-slate-500 mt-1">Contêineres correspondentes a padrões de software</p>
          </div>
        </div>

        <div className="bg-slate-900 text-white p-5 rounded-xl border border-slate-800 shadow-xs flex flex-col justify-between" id="card-k8s-warnings">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Anomalias de Compliance em Contêineres</span>
            <ShieldAlert className="w-4 h-4 text-red-500 animate-pulse" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-red-400">{unlicensedCount} Apps Não Licenciados</h3>
            <p className="text-[10px] text-slate-400 mt-1">Requer atribuições de licença principal</p>
          </div>
        </div>
      </div>

      {/* Connectors and Pods table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: K8s cluster gateways */}
        <div className="bg-white p-6 rounded-xl border border-[#DDDDDD] shadow-xs lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Gateways de Cluster K8s</h3>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-2 py-1 bg-slate-900 text-white text-[10px] font-bold rounded-lg flex items-center gap-1 hover:bg-slate-800 transition cursor-pointer"
              id="btn-add-k8s-connector"
            >
              <Plus className="w-3 h-3" />
              Adicionar
            </button>
          </div>

          {showAddForm && (
            <form onSubmit={handleAddConnector} className="bg-slate-50 p-4 rounded-lg border border-[#DDDDDD] mb-4 space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Nome do Gateway</label>
                <input
                  type="text"
                  value={newConnName}
                  onChange={e => setNewConnName(e.target.value)}
                  placeholder="Scanner do Cluster de Desenvolvimento EKS"
                  className="w-full text-xs px-2.5 py-1.5 bg-white border border-[#DDDDDD] rounded-lg focus:outline-indigo-500 text-slate-800"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-2 py-1 text-[10px] bg-white border border-[#DDDDDD] rounded text-slate-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-2 py-1 text-[10px] bg-[#00549F] text-white font-bold rounded cursor-pointer"
                >
                  Salvar Gateway
                </button>
              </div>
            </form>
          )}

          <div className="space-y-3">
            {connectors.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400">Nenhum conector Kubernetes configurado.</div>
            ) : (
              connectors.map(conn => (
                <div key={conn.id} className="p-3 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-semibold text-slate-800">{conn.name}</h4>
                    <p className="text-[9px] text-slate-400">
                      Last scan: {conn.lastSyncedAt ? new Date(conn.lastSyncedAt).toLocaleString() : "Never"}
                    </p>
                  </div>
                  <div>
                    <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-emerald-100 text-emerald-800">
                      Connected
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-5 border-t border-slate-100 pt-4">
            <button
              onClick={handleSync}
              disabled={syncing}
              className="w-full py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
              {syncing ? "Escaneando Contêineres..." : "Escaneear Licenças de Contêiner K8s"}
            </button>
          </div>
        </div>

        {/* Right column: Pods licensing inventory */}
        <div className="bg-white p-6 rounded-xl border border-[#DDDDDD] shadow-xs lg:col-span-2">
          <div className="mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Lista de Descoberta de Aplicativos em Contêineres</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Escaneia imagens de contêiner em execução, combinando com o catálogo de reconhecimento do Snow Software</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead>
                <tr className="border-b border-[#DDDDDD] text-[10px] font-bold text-slate-400 uppercase bg-[#F8F8F8]/50">
                  <th className="py-2.5 px-3">Nome do Pod / Namespace</th>
                  <th className="py-2.5 px-3">Nome da Imagem do Contêiner</th>
                  <th className="py-2.5 px-3">Software de Licença Detectado</th>
                  <th className="py-2.5 px-3">Status de Compliance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pods.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-xs text-slate-400">Nenhum software de contêiner descoberto encontrado.</td>
                  </tr>
                ) : (
                  pods.map(pod => {
                    const isAnomalous = pod.licenseStatus === "Non-Compliant" || pod.licenseStatus === "Unlicensed";
                    return (
                      <tr key={pod.id} className="hover:bg-slate-50/50 transition">
                        <td className="py-3 px-3">
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-900">{pod.podName}</span>
                            <span className="text-[9px] text-slate-400">Namespace: {pod.namespace}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 font-mono text-[10px] text-slate-600">
                          {pod.imageName}
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex flex-wrap gap-1">
                            {pod.softwareRunning.map((s, i) => (
                              <span key={i} className="px-1.5 py-0.5 bg-slate-100 text-slate-700 text-[9px] font-medium rounded">
                                {s}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold flex items-center gap-1 w-max ${
                            pod.licenseStatus === "Compliant" || pod.licenseStatus === "BYOL Coverage Checked"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-red-100 text-red-800"
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full block ${
                              pod.licenseStatus === "Compliant" || pod.licenseStatus === "BYOL Coverage Checked"
                                ? "bg-emerald-500"
                                : "bg-red-500"
                            }`}></span>
                            {pod.licenseStatus}
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
      </div>
    </div>
  );
}
