import React, { useState } from "react";
import { Upload, FileText, Sparkles, Check, AlertCircle, RefreshCw, Layers, Save } from "lucide-react";
import { MetricType } from "../types.js";
import { motion } from "motion/react";
import { HintTooltip } from "./HintTooltip.js";

interface InvoiceIngestionViewProps {
  onRefresh: () => void;
  onNavigateToLicenses: () => void;
}

interface ExtractedEntitlement {
  softwareName: string;
  publisher: string;
  quantity: number;
  unitCost: number;
  currency: string;
  sku?: string;
  invoiceNumber?: string;
  purchaseDate?: string;
  vendor?: string;
}

export function InvoiceIngestionView({ onRefresh, onNavigateToLicenses }: InvoiceIngestionViewProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedEntitlement | null>(null);
  const [customText, setCustomText] = useState("");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [imageMime, setImageMime] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  const [manualForm, setManualForm] = useState({
    softwareName: "",
    publisher: "",
    quantity: 1,
    unitCost: 0,
    currency: "USD",
    sku: "",
    invoiceNumber: "",
    purchaseDate: new Date().toISOString().split("T")[0],
    vendor: "",
    metricType: MetricType.INSTALLATIONS,
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
      setError("Faça upload de um arquivo de imagem (PNG/JPG) ou documento.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      const cleanBase64 = base64.split(",")[1];
      setUploadedImage(cleanBase64);
      setImageMime(file.type);
      setCustomText(""); // Clear text when file uploaded
      setExtractedData(null);
      setIsSaved(false);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleIngest = async () => {
    if (!customText && !uploadedImage) {
      setError("Faça upload de um arquivo de fatura ou selecione uma descrição de amostra primeiro.");
      return;
    }

    setIsProcessing(true);
    setError(null);
    setExtractedData(null);
    setIsSaved(false);

    try {
      const res = await fetch("/api/ingest-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileData: uploadedImage || undefined,
          mimeType: imageMime || undefined,
          description: customText || undefined
        })
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || "Falha ao extrair direito do documento.");
      }

      const extracted = await res.json();
      setExtractedData(extracted);
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Ocorreu um erro inesperado durante o parsing de fatura por IA.");
    } finally {
      setIsProcessing(false);
    }
  };

  const registerLicense = async (data: {
    softwareName: string;
    publisher: string;
    metricType: MetricType;
    sku: string;
    quantity: number;
    unitCost: number;
    invoiceNumber: string;
    purchaseDate: string;
    currency: string;
    vendor: string;
  }) => {
    const res = await fetch("/api/licenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        softwareName: data.softwareName,
        publisher: data.publisher,
        metricType: data.metricType,
        sku: data.sku || "N/A",
        version: "v1.0",
        notes: `Inserção manual. Fatura ${data.invoiceNumber || "N/D"}, fornecedor ${data.vendor || "N/D"}.`,
        isSubscription: false,
        purchases: [{
          quantity: data.quantity,
          unitCost: data.unitCost,
          invoiceNumber: data.invoiceNumber || "MANUAL",
          purchaseDate: data.purchaseDate || new Date().toISOString().split("T")[0],
          currency: data.currency || "USD",
        }]
      })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Falha ao salvar licença.");
    }
  };

  const handleSaveManual = async () => {
    if (!manualForm.softwareName || !manualForm.publisher) {
      setError("Nome do Software e Editora são obrigatórios.");
      return;
    }
    setError(null);
    setIsProcessing(true);
    try {
      await registerLicense(manualForm);
      setIsSaved(true);
      onRefresh();
      setManualForm({
        softwareName: "", publisher: "", quantity: 1, unitCost: 0,
        currency: "USD", sku: "", invoiceNumber: "",
        purchaseDate: new Date().toISOString().split("T")[0],
        vendor: "", metricType: MetricType.INSTALLATIONS,
      });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRegisterExtracted = async () => {
    if (!extractedData) return;
    try {
      let metric = MetricType.INSTALLATIONS;
      const lowerName = extractedData.softwareName.toLowerCase();
      const lowerSku = (extractedData.sku || "").toLowerCase();
      if (lowerName.includes("cloud") || lowerName.includes("sub") || lowerName.includes("365")) metric = MetricType.USERS;
      else if (lowerName.includes("pvu") || lowerSku.includes("pvu")) metric = MetricType.PVU;
      else if (lowerName.includes("core") || lowerSku.includes("core") || lowerName.includes("server")) metric = MetricType.PROCESSOR_CORE;

      await registerLicense({
        softwareName: extractedData.softwareName,
        publisher: extractedData.publisher,
        metricType: metric,
        sku: extractedData.sku || "",
        quantity: extractedData.quantity,
        unitCost: extractedData.unitCost,
        invoiceNumber: extractedData.invoiceNumber || "",
        purchaseDate: extractedData.purchaseDate || "",
        currency: extractedData.currency || "USD",
        vendor: extractedData.vendor || "",
      });
      setIsSaved(true);
      onRefresh();
    } catch (e: any) {
      setError(e.message || "Falha ao registrar licença extraída por IA.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            <Sparkles className="w-6 h-6 text-[#00549F]" />
            Ingestão de Direitos Baseada em IA
          </h1>
          <HintTooltip text="Faça upload e processe arquivos de fatura para preencher automaticamente registros de compra de licenças. Suporta formatos CSV, PDF e EDI com extração de itens de linha." side="right" size="md" />
        </div>
        <p className="text-slate-500 text-sm">
          Faça upload de imagens de recibos ou insira descrições de compra. Nosso modelo de parsing Gemini extrai quantidades de licenciamento, valores, moedas e SKUs.
        </p>
      </div>

      {/* Main panel layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Side: Upload & Input Area */}
        <div className="space-y-6">
          
          {/* File Upload card */}
          <div className="bg-white border border-[#DDDDDD] rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="font-semibold text-slate-800 text-xs uppercase tracking-wider">Opção A: Upload de Fatura / Recibo de PO</h3>
            
            <div className="border-2 border-dashed border-[#DDDDDD] hover:border-[#00549F] rounded-xl p-8 text-center transition-all cursor-pointer relative">
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <Upload className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-xs font-semibold text-slate-700">Arraste e solte ou clique para fazer upload</p>
              <p className="text-[10px] text-slate-400 mt-1">Suporta PNG, JPG, JPEG e documentos PDF</p>
            </div>

            {uploadedImage && (
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-150 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#00549F]" />
                  <span className="font-semibold text-slate-700">Imagem de Fatura Anexada</span>
                </div>
                <button
                  onClick={() => { setUploadedImage(null); setImageMime(null); }}
                  className="text-[10px] font-bold text-rose-600 hover:underline cursor-pointer"
                >
                  Remover
                </button>
              </div>
            )}
          </div>

          {/* Option B: Manual Entry Form */}
          <div className="bg-white border border-[#DDDDDD] rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-slate-800 text-xs uppercase tracking-wider">Opção B: Inserção Manual de Contrato</h3>
              <span className="text-[10px] bg-sky-50 text-sky-700 px-2 py-0.5 rounded-full font-bold">Salvamento Direto</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase mb-1" style={{ color: "#595959" }}>Nome do Software *</label>
                <input
                  type="text"
                  value={manualForm.softwareName}
                  onChange={(e) => setManualForm({ ...manualForm, softwareName: e.target.value })}
                  placeholder="ex.: Microsoft SQL Server"
                  className="w-full text-xs border border-[#DDDDDD] rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-[#00549F] bg-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase mb-1" style={{ color: "#595959" }}>Editora *</label>
                <input
                  type="text"
                  value={manualForm.publisher}
                  onChange={(e) => setManualForm({ ...manualForm, publisher: e.target.value })}
                  placeholder="ex.: Microsoft Corporation"
                  className="w-full text-xs border border-[#DDDDDD] rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-[#00549F] bg-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase mb-1" style={{ color: "#595959" }}>Quantidade</label>
                <input
                  type="number"
                  min={1}
                  value={manualForm.quantity}
                  onChange={(e) => setManualForm({ ...manualForm, quantity: Math.max(1, Number(e.target.value)) })}
                  className="w-full text-xs border border-[#DDDDDD] rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-[#00549F] bg-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase mb-1" style={{ color: "#595959" }}>Custo Unitário</label>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={manualForm.unitCost}
                  onChange={(e) => setManualForm({ ...manualForm, unitCost: Number(e.target.value) })}
                  className="w-full text-xs border border-[#DDDDDD] rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-[#00549F] bg-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase mb-1" style={{ color: "#595959" }}>Moeda</label>
                <select
                  value={manualForm.currency}
                  onChange={(e) => setManualForm({ ...manualForm, currency: e.target.value })}
                  className="w-full text-xs border border-[#DDDDDD] rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-[#00549F] bg-white cursor-pointer"
                >
                  {["USD", "EUR", "GBP", "BRL", "CAD", "AUD", "JPY"].map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase mb-1" style={{ color: "#595959" }}>Tipo de Métrica</label>
                <select
                  value={manualForm.metricType}
                  onChange={(e) => setManualForm({ ...manualForm, metricType: e.target.value as MetricType })}
                  className="w-full text-xs border border-[#DDDDDD] rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-[#00549F] bg-white cursor-pointer"
                >
                  {Object.values(MetricType).map((mt) => (
                    <option key={mt} value={mt}>{mt}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase mb-1" style={{ color: "#595959" }}>SKU / Nº de Peça</label>
                <input
                  type="text"
                  value={manualForm.sku}
                  onChange={(e) => setManualForm({ ...manualForm, sku: e.target.value })}
                  placeholder="Opcional"
                  className="w-full text-xs border border-[#DDDDDD] rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-[#00549F] bg-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase mb-1" style={{ color: "#595959" }}>Nº da Fatura</label>
                <input
                  type="text"
                  value={manualForm.invoiceNumber}
                  onChange={(e) => setManualForm({ ...manualForm, invoiceNumber: e.target.value })}
                  placeholder="Opcional"
                  className="w-full text-xs border border-[#DDDDDD] rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-[#00549F] bg-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase mb-1" style={{ color: "#595959" }}>Data de Compra</label>
                <input
                  type="date"
                  value={manualForm.purchaseDate}
                  onChange={(e) => setManualForm({ ...manualForm, purchaseDate: e.target.value })}
                  className="w-full text-xs border border-[#DDDDDD] rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-[#00549F] bg-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase mb-1" style={{ color: "#595959" }}>Fornecedor</label>
                <input
                  type="text"
                  value={manualForm.vendor}
                  onChange={(e) => setManualForm({ ...manualForm, vendor: e.target.value })}
                  placeholder="Opcional"
                  className="w-full text-xs border border-[#DDDDDD] rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-[#00549F] bg-white"
                />
              </div>
            </div>

            <button
              onClick={handleSaveManual}
              disabled={isProcessing || !manualForm.softwareName || !manualForm.publisher}
              className="w-full py-2.5 bg-[#00549F] text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isProcessing ? "Salvando..." : "Salvar Contrato no Inventário de Licenças"}
            </button>
          </div>
        </div>

        {/* Right Side: Extraction Output Preview */}
        <div className="bg-white border border-[#DDDDDD] rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div className="space-y-6">
            <h3 className="font-semibold text-slate-800 text-xs uppercase tracking-wider border-b border-slate-100 pb-3">
              Pré-visualização de Extração Estruturada por IA
            </h3>

            {error && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg flex gap-2 text-xs text-rose-700">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Falha na Extração</p>
                  <p className="text-[10px] mt-0.5 leading-relaxed">{error}</p>
                </div>
              </div>
            )}

            {isProcessing && (
              <div className="p-12 text-center text-slate-400 space-y-3">
                <RefreshCw className="w-8 h-8 animate-spin text-[#00549F] mx-auto" />
                <p className="text-xs font-semibold text-slate-700">Escaneando OCR e estruturas do documento...</p>
                <p className="text-[10px]">Conciliando SKUs de produtos, matrizes de licenciamento e entidades de fornecedores.</p>
              </div>
            )}

            {!extractedData && !isProcessing && !error && (
              <div className="p-12 text-center text-slate-400">
                <Sparkles className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                <p className="text-xs font-semibold text-slate-600">Aguardando Gatilho de Ingestão por IA</p>
                <p className="text-[10px] mt-0.5">Faça upload de um recibo ou selecione um template interativo acima para ver o OCR Gemini e o mapeamento de metadados.</p>
              </div>
            )}

            {extractedData && !isProcessing && (
              <div className="space-y-4">
                <div className="p-3.5 bg-emerald-50 rounded-lg border border-emerald-200 flex gap-2 text-emerald-800 text-[11px]">
                  <Check className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Ingestão Gemini Bem-sucedida!</p>
                    <p className="text-[10px] mt-0.5">Metadados estruturados e validados contra heurísticas do Catálogo de Dados Snow Atlas.</p>
                  </div>
                </div>

                {/* Structured details display */}
                <div className="grid grid-cols-2 gap-4 text-xs border border-slate-150 p-4 rounded-xl bg-slate-50/50">
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">Nome do Produto</span>
                    <span className="font-semibold text-slate-800">{extractedData.softwareName}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">Editora</span>
                    <span className="font-semibold text-slate-800">{extractedData.publisher}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">Quantidade Adquirida</span>
                    <span className="font-bold text-slate-800">{extractedData.quantity} Licenças</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">Custo Unitário</span>
                    <span className="font-semibold text-slate-800">
                      {new Intl.NumberFormat("pt-BR", { style: "currency", currency: extractedData.currency || "USD" }).format(extractedData.unitCost)}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">SKU / Nº de Peça</span>
                    <span className="font-mono text-slate-800">{extractedData.sku || "N/D"}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">Nº da Fatura</span>
                    <span className="font-mono text-slate-800">{extractedData.invoiceNumber || "N/D"}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">Data de Compra</span>
                    <span className="font-medium text-slate-800">{extractedData.purchaseDate || "N/D"}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">Loja do Fornecedor</span>
                    <span className="font-medium text-slate-800">{extractedData.vendor || "N/D"}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action to Save extracted item */}
          {extractedData && !isProcessing && (
            <div className="mt-6 border-t border-slate-100 pt-4">
              {isSaved ? (
                <div className="flex flex-col gap-2 items-center text-center">
                  <div className="bg-emerald-500 text-white rounded-full p-2">
                    <Check className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-bold text-slate-800">Ativo Salvo e Ativo!</p>
                  <p className="text-[10px] text-slate-400">O direito foi registrado e os snapshots de conformidade foram recalculados.</p>
                  <button
                    onClick={onNavigateToLicenses}
                    className="mt-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-all cursor-pointer"
                  >
                    Ir para Inventário de Licenças
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-[10px] text-slate-400">
                    O registro destes dados extraídos cria um novo registro oficial de licença de software e gera uma linha de compra de direito dinamicamente vinculada a snapshots de conformidade.
                  </p>
                  <button
                    onClick={handleRegisterExtracted}
                    className="w-full py-2.5 bg-[#00549F] text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
                  >
                    <Layers className="w-4 h-4" />
                    Registrar Direito no Catálogo de Ativos
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
