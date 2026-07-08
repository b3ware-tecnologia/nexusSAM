import React, { useState, useEffect } from "react";
import { FileText, Plus, Calendar, Download, Send, RefreshCw, FileSpreadsheet, Layers, Mail, Server } from "lucide-react";
import { SavedReport, ReportSchedule } from "../types.js";

export function ReportsView() {
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [schedules, setSchedules] = useState<ReportSchedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Custom Report Builder form state
  const [showBuilder, setShowBuilder] = useState(false);
  const [reportName, setReportName] = useState("");
  const [reportDesc, setReportDesc] = useState("");
  const [reportTarget, setReportTarget] = useState<"Licenses" | "Computers" | "Applications" | "Subscriptions" | "Cloud" | "Containers">("Licenses");
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [filterPublisher, setFilterPublisher] = useState("");
  const [filterRiskMin, setFilterRiskMin] = useState("");

  // Scheduler form state
  const [showScheduler, setShowScheduler] = useState(false);
  const [schedReportId, setSchedReportId] = useState("");
  const [schedFreq, setSchedFreq] = useState<"Daily" | "Weekly" | "Monthly">("Weekly");
  const [schedType, setSchedType] = useState<"Email" | "SharePoint">("Email");
  const [schedRecipients, setSchedRecipients] = useState("");

  // Active exported preview state
  const [exportedFile, setExportedFile] = useState<{ filename: string; format: string; content: string; mimeType: string } | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [repRes, schedRes] = await Promise.all([
        fetch("/api/reports"),
        fetch("/api/reports/schedules")
      ]);
      if (repRes.ok && schedRes.ok) {
        setReports(await repRes.json());
        setSchedules(await schedRes.json());
      } else {
        setError("Falha ao buscar banco de dados de relatórios.");
      }
    } catch (e: any) {
      setError(e.message || "Ocorreu um erro");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Columns helper for custom report builder
  const getAvailableColumns = (target: string) => {
    switch (target) {
      case "Licenses":
        return ["Nome do Software", "Editora", "Tipo de Métrica", "Quantidade Total", "Quantidade Alocada", "Status"];
      case "Computers":
        return ["Nome", "Núcleos", "É Virtual", "SO", "GB RAM", "Modelo da CPU", "Marca", "Modelo", "Nº de Série", "Status de Garantia"];
      case "Applications":
        return ["Nome do Software", "Editora", "ID da Categoria", "SKU Padrão", "Versão", "Data EOL", "Data EOS", "É Malware"];
      case "Subscriptions":
        return ["Nome", "Editora", "Categoria", "Pontuação de Risco", "Aprovado", "Nome da Família", "Fontes Descobertas"];
      case "Cloud":
        return ["Nome", "Provedor", "Tipo", "Custo", "Modelo de Precificação", "Software Instalado", "Recomendação"];
      case "Containers":
        return ["Nome do Pod", "Namespace", "Nome do Container", "Nome da Imagem", "Software em Execução", "Status da Licença"];
      default:
        return ["ID", "Nome"];
    }
  };

  // Pre-select columns whenever target changes
  useEffect(() => {
    setSelectedColumns(getAvailableColumns(reportTarget));
  }, [reportTarget]);

  const handleSaveReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportName) return;

    const filters: any = {};
    if (filterPublisher) filters.publisher = filterPublisher;
    if (filterRiskMin) filters.riskScoreMin = Number(filterRiskMin);

    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: reportName,
          description: reportDesc,
          targetType: reportTarget,
          columns: selectedColumns,
          filters
        })
      });

      if (res.ok) {
        setReportName("");
        setReportDesc("");
        setFilterPublisher("");
        setFilterRiskMin("");
        setShowBuilder(false);
        await fetchData();
      } else {
        setError("Falha ao salvar template de relatório.");
      }
    } catch (e: any) {
      setError(e.message || "Erro ao salvar relatório");
    }
  };

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedReportId || !schedRecipients) return;

    const recipientsArray = schedRecipients.split(",").map(r => r.trim()).filter(Boolean);

    try {
      const res = await fetch("/api/reports/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportId: schedReportId,
          frequency: schedFreq,
          deliveryType: schedType,
          recipients: recipientsArray
        })
      });

      if (res.ok) {
        setSchedRecipients("");
        setShowScheduler(false);
        await fetchData();
      } else {
        setError("Falha ao configurar agendamento de relatório.");
      }
    } catch (e: any) {
      setError(e.message || "Erro ao agendar relatório");
    }
  };

  const handleExport = async (reportId: string, format: "CSV" | "PDF" | "XLSX" | "XML") => {
    try {
      const res = await fetch("/api/reports/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId, format })
      });
      if (res.ok) {
        const fileData = await res.json();
        setExportedFile({
          filename: fileData.filename,
          format: fileData.format,
          content: fileData.content,
          mimeType: fileData.mimeType
        });
      } else {
        setError("Falha ao executar exportação de relatório.");
      }
    } catch (e: any) {
      setError(e.message || "Erro durante exportação de relatório");
    }
  };

  const handleTriggerMockDownload = () => {
    if (!exportedFile) return;
    const blob = new Blob([exportedFile.content], { type: exportedFile.mimeType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = exportedFile.filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6" id="reports-engine-view">
      {/* Alert Banner */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md text-xs text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="font-bold underline cursor-pointer">Dispensar</button>
        </div>
      )}

      {/* Reports Header Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Side: Report Catalog */}
        <div className="bg-white p-6 rounded-xl border border-[#DDDDDD] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Relatórios de Posição Efetiva de Licenças</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Selecione um relatório padrão pré-construído ou execute exportações</p>
            </div>
            <button
              onClick={() => setShowBuilder(!showBuilder)}
              className="px-3 py-1.5 bg-[#00549F] text-white text-[10px] font-bold rounded-lg flex items-center gap-1.5 cursor-pointer"
              id="btn-custom-report-builder"
            >
              <Plus className="w-3.5 h-3.5" />
              Construir Relatório
            </button>
          </div>

          {/* Builder Form */}
          {showBuilder && (
            <form onSubmit={handleSaveReport} className="bg-slate-50 p-5 rounded-lg border border-[#DDDDDD] space-y-4">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-700 border-b border-[#DDDDDD] pb-2">Configuração de Relatório Personalizado</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Nome do Relatório</label>
                  <input
                    type="text"
                    value={reportName}
                    onChange={e => setReportName(e.target.value)}
                    placeholder="Ex.: Status de Implantação do Oracle Database"
                    className="w-full text-xs px-2.5 py-1.5 bg-white border border-[#DDDDDD] rounded-lg focus:outline-indigo-500 text-slate-800"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Módulo de Entidade Alvo</label>
                  <select
                    value={reportTarget}
                    onChange={e => setReportTarget(e.target.value as any)}
                    className="w-full text-xs px-2.5 py-1.5 bg-white border border-[#DDDDDD] rounded-lg focus:outline-indigo-500 text-slate-800"
                  >
                    <option value="Licenses">Licenças (SAM Core)</option>
                    <option value="Computers">Computadores (HAM / Hardware)</option>
                    <option value="Applications">Aplicativos (Catálogo de Inteligência)</option>
                    <option value="Subscriptions">Assinaturas (SaaS SSM)</option>
                    <option value="Cloud">Licenças Cloud (AWS/Azure/GCP)</option>
                    <option value="Containers">Containers K8s (K8s/OpenShift)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Descrição</label>
                <input
                  type="text"
                  value={reportDesc}
                  onChange={e => setReportDesc(e.target.value)}
                  placeholder="Ex.: Inventário completo de componentes Oracle ativos comparados com direitos de downgrade"
                  className="w-full text-xs px-2.5 py-1.5 bg-white border border-[#DDDDDD] rounded-lg focus:outline-indigo-500 text-slate-800"
                />
              </div>

              {/* Column Selector */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Colunas Disponíveis (Marcar/Desmarcar)</label>
                <div className="flex flex-wrap gap-2 p-2.5 bg-white border border-[#DDDDDD] rounded-lg max-h-32 overflow-y-auto">
                  {getAvailableColumns(reportTarget).map(col => {
                    const checked = selectedColumns.includes(col);
                    return (
                      <button
                        type="button"
                        key={col}
                        onClick={() => {
                          if (checked) {
                            setSelectedColumns(selectedColumns.filter(c => c !== col));
                          } else {
                            setSelectedColumns([...selectedColumns, col]);
                          }
                        }}
                        className={`px-2 py-1 rounded text-[9px] font-medium transition ${
                          checked ? "bg-indigo-100 text-indigo-700 border border-indigo-200" : "bg-slate-50 text-slate-500 border border-slate-100"
                        }`}
                      >
                        {col}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Advanced Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white p-3 rounded-lg border border-slate-100">
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase">Filtro: Correspondência Editora/Fornecedor</label>
                  <input
                    type="text"
                    value={filterPublisher}
                    onChange={e => setFilterPublisher(e.target.value)}
                    placeholder="Ex.: Microsoft"
                    className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-[#DDDDDD] rounded-lg focus:outline-indigo-500 text-slate-800 mt-1"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase">Filtro: Pontuação de Risco Mínima</label>
                  <input
                    type="number"
                    value={filterRiskMin}
                    onChange={e => setFilterRiskMin(e.target.value)}
                    placeholder="Ex.: 70"
                    className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-[#DDDDDD] rounded-lg focus:outline-indigo-500 text-slate-800 mt-1"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#DDDDDD]">
                <button
                  type="button"
                  onClick={() => setShowBuilder(false)}
                  className="px-3 py-1.5 text-xs bg-white border border-[#DDDDDD] rounded-lg text-slate-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 text-xs bg-[#00549F] text-white font-bold rounded-lg cursor-pointer"
                >
                  Salvar Template de Relatório
                </button>
              </div>
            </form>
          )}

          {/* List of Report Templates */}
          <div className="space-y-4">
            {reports.map(rep => (
              <div key={rep.id} className="p-4 bg-slate-50 border border-[#DDDDDD] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded text-[8px] bg-indigo-100 text-indigo-800 font-bold uppercase">{rep.targetType}</span>
                    <h4 className="text-xs font-bold text-slate-800">{rep.name}</h4>
                  </div>
                  <p className="text-[10px] text-slate-500">{rep.description}</p>
                  <div className="flex gap-1 flex-wrap pt-1">
                    {rep.columns.map(c => (
                      <span key={c} className="text-[8px] bg-slate-200 text-slate-600 px-1 py-0.2 rounded font-mono">{c}</span>
                    ))}
                  </div>
                </div>

                {/* Export Action Controls */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] text-slate-400 font-semibold mr-1">Exportar:</span>
                  <button
                    onClick={() => handleExport(rep.id, "CSV")}
                    className="p-1.5 hover:bg-white border border-[#DDDDDD] rounded bg-slate-100 text-slate-700 text-[10px] font-bold flex items-center gap-0.5"
                    title="Exportar CSV"
                  >
                    CSV
                  </button>
                  <button
                    onClick={() => handleExport(rep.id, "XLSX")}
                    className="p-1.5 hover:bg-white border border-[#DDDDDD] rounded bg-slate-100 text-emerald-700 text-[10px] font-bold flex items-center gap-0.5"
                    title="Exportar XLSX"
                  >
                    XLSX
                  </button>
                  <button
                    onClick={() => handleExport(rep.id, "PDF")}
                    className="p-1.5 hover:bg-white border border-[#DDDDDD] rounded bg-slate-100 text-red-700 text-[10px] font-bold flex items-center gap-0.5"
                    title="Layout de Impressão PDF"
                  >
                    PDF
                  </button>
                  <button
                    onClick={() => handleExport(rep.id, "XML")}
                    className="p-1.5 hover:bg-white border border-[#DDDDDD] rounded bg-slate-100 text-orange-700 text-[10px] font-bold flex items-center gap-0.5"
                    title="Payload de API XML"
                  >
                    XML
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Report Schedulers */}
        <div className="bg-white p-6 rounded-xl border border-[#DDDDDD] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Agendamentos de Email e SharePoint</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Automatize snapshots de conformidade e relatórios de log semanal/mensal</p>
            </div>
            <button
              onClick={() => setShowScheduler(!showScheduler)}
              className="px-3 py-1.5 bg-slate-900 text-white text-[10px] font-bold rounded-lg flex items-center gap-1 hover:bg-slate-800 transition cursor-pointer"
              id="btn-schedule-delivery"
            >
              <Calendar className="w-3.5 h-3.5" />
              Agendar Entrega
            </button>
          </div>

          {/* Scheduler Form */}
          {showScheduler && (
            <form onSubmit={handleSaveSchedule} className="bg-slate-50 p-4 rounded-lg border border-[#DDDDDD] space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Selecionar Relatório Salvo</label>
                <select
                  value={schedReportId}
                  onChange={e => setSchedReportId(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 bg-white border border-[#DDDDDD] rounded-lg focus:outline-indigo-500 text-slate-800"
                  required
                >
                  <option value="">-- Escolher template --</option>
                  {reports.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Frequência</label>
                  <select
                    value={schedFreq}
                    onChange={e => setSchedFreq(e.target.value as any)}
                    className="w-full text-xs px-2.5 py-1.5 bg-white border border-[#DDDDDD] rounded-lg focus:outline-indigo-500 text-slate-800"
                  >
                    <option value="Daily">Auditoria Diária</option>
                    <option value="Weekly">Resumo Semanal</option>
                    <option value="Monthly">Posição ELP Mensal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Gateway de Entrega</label>
                  <select
                    value={schedType}
                    onChange={e => setSchedType(e.target.value as any)}
                    className="w-full text-xs px-2.5 py-1.5 bg-white border border-[#DDDDDD] rounded-lg focus:outline-indigo-500 text-slate-800"
                  >
                    <option value="Email">Email SMTP Seguro</option>
                    <option value="SharePoint">Link SharePoint Enterprise</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">
                  Destinatários / URLs do SharePoint (separados por vírgula)
                </label>
                <input
                  type="text"
                  value={schedRecipients}
                  onChange={e => setSchedRecipients(e.target.value)}
                  placeholder="conformidade@empresa.com.br, auditoria@empresa.com.br"
                  className="w-full text-xs px-2.5 py-1.5 bg-white border border-[#DDDDDD] rounded-lg focus:outline-indigo-500 text-slate-800"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowScheduler(false)}
                  className="px-2 py-1 text-[10px] bg-white border border-[#DDDDDD] rounded text-slate-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-2 py-1 text-[10px] bg-[#00549F] text-white font-bold rounded cursor-pointer"
                >
                  Salvar Agendamento
                </button>
              </div>
            </form>
          )}

          {/* Active Schedules List */}
          <div className="space-y-3">
            {schedules.map(sch => {
              const report = reports.find(r => r.id === sch.reportId);
              return (
                <div key={sch.id} className="p-3 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600">
                      {sch.deliveryType === "Email" ? <Mail className="w-4 h-4 text-indigo-500" /> : <Server className="w-4 h-4 text-emerald-500" />}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">{report ? report.name : "Relatório Personalizado"}</h4>
                      <p className="text-[10px] text-slate-400">
                        {sch.frequency} entregar para: <span className="font-mono text-slate-500 text-[9px]">{sch.recipients.join(", ")}</span>
                      </p>
                    </div>
                  </div>
                  <div>
                    <span className="px-1.5 py-0.5 rounded text-[8px] bg-emerald-100 text-emerald-800 font-bold uppercase">
                      {sch.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Live Scheduled triggers monitor log */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5 text-slate-300 font-mono text-[9px]">
            <h4 className="text-white text-[10px] font-bold border-b border-slate-800 pb-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full block animate-pulse"></span>
              Logs do Mecanismo de Entrega SMTP/SharePoint do Agendador
            </h4>
            <p className="text-slate-500">[2026-07-07 09:00:00] Trabalhos cron do despachante de email agendado inicializados...</p>
            <p className="text-slate-400">[2026-07-07 09:05:12] Email enviado: "Microsoft Compliance ELP Report" exportado para CSV. Enviado para: conformidade@empresa.com.br (SUCESSO)</p>
            <p className="text-slate-400">[2026-07-07 09:05:15] Sinc. de Link SharePoint: "High Risk Shadow IT Applications.xml" enviado para portal ITAM do Teams (SUCESSO)</p>
            <p className="text-slate-500">[2026-07-07 09:40:00] Ouvinte de fila em segundo plano agendado: ocioso, aguardando próximo período...</p>
          </div>
        </div>
      </div>

      {/* Export Preview Area */}
      {exportedFile && (
        <div className="bg-white p-6 rounded-xl border-2 border-indigo-200 shadow-md space-y-4" id="report-export-inspector">
          <div className="flex items-center justify-between border-b border-[#DDDDDD] pb-3">
            <div className="flex items-center gap-2">
              <span className="p-1 bg-indigo-100 text-indigo-700 rounded font-bold text-xs">{exportedFile.format}</span>
              <div>
                <h4 className="text-xs font-bold text-slate-900">{exportedFile.filename}</h4>
                <p className="text-[9px] text-slate-400">Tipo MIME do Arquivo: {exportedFile.mimeType} • Tamanho: {exportedFile.content.length} caracteres</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleTriggerMockDownload}
                className="px-3 py-1.5 bg-[#00549F] text-white rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Baixar Arquivo
              </button>
              <button
                onClick={() => setExportedFile(null)}
                className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold hover:bg-slate-200 cursor-pointer"
              >
                Fechar Pré-visualização
              </button>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-[#DDDDDD] max-h-96 overflow-y-auto font-mono text-[10px] text-slate-800 leading-relaxed whitespace-pre">
            {exportedFile.content}
          </div>
        </div>
      )}
    </div>
  );
}
