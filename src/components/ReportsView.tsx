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
        setError("Failed to fetch reports database.");
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

  // Columns helper for custom report builder
  const getAvailableColumns = (target: string) => {
    switch (target) {
      case "Licenses":
        return ["Software Name", "Publisher", "Metric Type", "Total Quantity", "Allocated Quantity", "Status"];
      case "Computers":
        return ["Name", "Cores", "Is Virtual", "OS", "RAM GB", "CPU Model", "Brand", "Model", "Serial Number", "Warranty Status"];
      case "Applications":
        return ["Software Name", "Publisher", "Category Id", "Default Sku", "Version", "EOL Date", "EOS Date", "Is Malware"];
      case "Subscriptions":
        return ["Name", "Publisher", "Category", "Risk Score", "Is Approved", "Family Name", "Discovered Sources"];
      case "Cloud":
        return ["Name", "Provider", "Type", "Cost", "Pricing Model", "Software Installed", "Recommendation"];
      case "Containers":
        return ["Pod Name", "Namespace", "Container Name", "Image Name", "Software Running", "License Status"];
      default:
        return ["ID", "Name"];
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
        setError("Failed to save report template.");
      }
    } catch (e: any) {
      setError(e.message || "Error saving report");
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
        setError("Failed to configure report schedule.");
      }
    } catch (e: any) {
      setError(e.message || "Error scheduling report");
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
        setError("Failed to execute report export.");
      }
    } catch (e: any) {
      setError(e.message || "Error during report export");
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
          <button onClick={() => setError(null)} className="font-bold underline cursor-pointer">Dismiss</button>
        </div>
      )}

      {/* Reports Header Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Side: Report Catalog */}
        <div className="bg-white p-6 rounded-xl border border-[#DDDDDD] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Effective License Position Reports</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Select a pre-built standard report or run exports</p>
            </div>
            <button
              onClick={() => setShowBuilder(!showBuilder)}
              className="px-3 py-1.5 bg-[#00549F] text-white text-[10px] font-bold rounded-lg flex items-center gap-1.5 cursor-pointer"
              id="btn-custom-report-builder"
            >
              <Plus className="w-3.5 h-3.5" />
              Build Report
            </button>
          </div>

          {/* Builder Form */}
          {showBuilder && (
            <form onSubmit={handleSaveReport} className="bg-slate-50 p-5 rounded-lg border border-[#DDDDDD] space-y-4">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-700 border-b border-[#DDDDDD] pb-2">Custom Report Configuration</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Report Name</label>
                  <input
                    type="text"
                    value={reportName}
                    onChange={e => setReportName(e.target.value)}
                    placeholder="E.g. Oracle Database Deployment Status"
                    className="w-full text-xs px-2.5 py-1.5 bg-white border border-[#DDDDDD] rounded-lg focus:outline-indigo-500 text-slate-800"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Target Entity Module</label>
                  <select
                    value={reportTarget}
                    onChange={e => setReportTarget(e.target.value as any)}
                    className="w-full text-xs px-2.5 py-1.5 bg-white border border-[#DDDDDD] rounded-lg focus:outline-indigo-500 text-slate-800"
                  >
                    <option value="Licenses">Licenses (SAM Core)</option>
                    <option value="Computers">Computers (HAM / Hardware)</option>
                    <option value="Applications">Applications (Intelligence Catalog)</option>
                    <option value="Subscriptions">Subscriptions (SaaS SSM)</option>
                    <option value="Cloud">Cloud Licenses (AWS/Azure/GCP)</option>
                    <option value="Containers">K8s Containers (K8s/OpenShift)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Description</label>
                <input
                  type="text"
                  value={reportDesc}
                  onChange={e => setReportDesc(e.target.value)}
                  placeholder="E.g. Full inventory of active Oracle components matched against downgrade rights"
                  className="w-full text-xs px-2.5 py-1.5 bg-white border border-[#DDDDDD] rounded-lg focus:outline-indigo-500 text-slate-800"
                />
              </div>

              {/* Column Selector */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Available Columns (Check/Uncheck)</label>
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
                  <label className="block text-[9px] font-bold text-slate-400 uppercase">Filter: Publisher/Vendor Match</label>
                  <input
                    type="text"
                    value={filterPublisher}
                    onChange={e => setFilterPublisher(e.target.value)}
                    placeholder="E.g. Microsoft"
                    className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-[#DDDDDD] rounded-lg focus:outline-indigo-500 text-slate-800 mt-1"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase">Filter: Minimum Risk Score</label>
                  <input
                    type="number"
                    value={filterRiskMin}
                    onChange={e => setFilterRiskMin(e.target.value)}
                    placeholder="E.g. 70"
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
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 text-xs bg-[#00549F] text-white font-bold rounded-lg cursor-pointer"
                >
                  Save Report Template
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
                  <span className="text-[10px] text-slate-400 font-semibold mr-1">Export:</span>
                  <button
                    onClick={() => handleExport(rep.id, "CSV")}
                    className="p-1.5 hover:bg-white border border-[#DDDDDD] rounded bg-slate-100 text-slate-700 text-[10px] font-bold flex items-center gap-0.5"
                    title="CSV Export"
                  >
                    CSV
                  </button>
                  <button
                    onClick={() => handleExport(rep.id, "XLSX")}
                    className="p-1.5 hover:bg-white border border-[#DDDDDD] rounded bg-slate-100 text-emerald-700 text-[10px] font-bold flex items-center gap-0.5"
                    title="XLSX Export"
                  >
                    XLSX
                  </button>
                  <button
                    onClick={() => handleExport(rep.id, "PDF")}
                    className="p-1.5 hover:bg-white border border-[#DDDDDD] rounded bg-slate-100 text-red-700 text-[10px] font-bold flex items-center gap-0.5"
                    title="PDF Print layout"
                  >
                    PDF
                  </button>
                  <button
                    onClick={() => handleExport(rep.id, "XML")}
                    className="p-1.5 hover:bg-white border border-[#DDDDDD] rounded bg-slate-100 text-orange-700 text-[10px] font-bold flex items-center gap-0.5"
                    title="XML API Payload"
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
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Email & SharePoint Schedules</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Automate compliance snapshots and log reports weekly/monthly</p>
            </div>
            <button
              onClick={() => setShowScheduler(!showScheduler)}
              className="px-3 py-1.5 bg-slate-900 text-white text-[10px] font-bold rounded-lg flex items-center gap-1 hover:bg-slate-800 transition cursor-pointer"
              id="btn-schedule-delivery"
            >
              <Calendar className="w-3.5 h-3.5" />
              Schedule Delivery
            </button>
          </div>

          {/* Scheduler Form */}
          {showScheduler && (
            <form onSubmit={handleSaveSchedule} className="bg-slate-50 p-4 rounded-lg border border-[#DDDDDD] space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Select Saved Report</label>
                <select
                  value={schedReportId}
                  onChange={e => setSchedReportId(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 bg-white border border-[#DDDDDD] rounded-lg focus:outline-indigo-500 text-slate-800"
                  required
                >
                  <option value="">-- Choose template --</option>
                  {reports.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Frequency</label>
                  <select
                    value={schedFreq}
                    onChange={e => setSchedFreq(e.target.value as any)}
                    className="w-full text-xs px-2.5 py-1.5 bg-white border border-[#DDDDDD] rounded-lg focus:outline-indigo-500 text-slate-800"
                  >
                    <option value="Daily">Daily Audit</option>
                    <option value="Weekly">Weekly Digest</option>
                    <option value="Monthly">Monthly ELP Position</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Delivery Gateway</label>
                  <select
                    value={schedType}
                    onChange={e => setSchedType(e.target.value as any)}
                    className="w-full text-xs px-2.5 py-1.5 bg-white border border-[#DDDDDD] rounded-lg focus:outline-indigo-500 text-slate-800"
                  >
                    <option value="Email">Secure SMTP Email</option>
                    <option value="SharePoint">SharePoint Enterprise Link</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">
                  Recipients / SharePoint URLs (comma separated)
                </label>
                <input
                  type="text"
                  value={schedRecipients}
                  onChange={e => setSchedRecipients(e.target.value)}
                  placeholder="it-compliance@company.com, aud-officer@company.com"
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
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-2 py-1 text-[10px] bg-[#00549F] text-white font-bold rounded cursor-pointer"
                >
                  Save Schedule
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
                      <h4 className="text-xs font-bold text-slate-800">{report ? report.name : "Custom Report"}</h4>
                      <p className="text-[10px] text-slate-400">
                        {sch.frequency} deliver to: <span className="font-mono text-slate-500 text-[9px]">{sch.recipients.join(", ")}</span>
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
              Scheduler SMTP/SharePoint Delivery Engine Logs
            </h4>
            <p className="text-slate-500">[2026-07-07 09:00:00] Initialized scheduled email dispatcher cron jobs...</p>
            <p className="text-slate-400">[2026-07-07 09:05:12] Email sent: "Microsoft Compliance ELP Report" exported to CSV. Sent to: it-compliance@company.com (SUCCESS)</p>
            <p className="text-slate-400">[2026-07-07 09:05:15] SharePoint Link Sync: uploaded "High Risk Shadow IT Applications.xml" to Teams ITAM portal (SUCCESS)</p>
            <p className="text-slate-500">[2026-07-07 09:40:00] Scheduled background queue listener: idle, waiting for next period...</p>
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
                <p className="text-[9px] text-slate-400">File MIME Type: {exportedFile.mimeType} • Size: {exportedFile.content.length} characters</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleTriggerMockDownload}
                className="px-3 py-1.5 bg-[#00549F] text-white rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Download File
              </button>
              <button
                onClick={() => setExportedFile(null)}
                className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold hover:bg-slate-200 cursor-pointer"
              >
                Close Preview
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
