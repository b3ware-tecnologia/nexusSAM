import React, { useState, useEffect, useRef } from "react";
import { Upload, FileText, Sparkles, Check, AlertCircle, RefreshCw, Layers, Save, Pencil } from "lucide-react";
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
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

  useEffect(() => {
    if (uploadedImage) {
      handleIngest();
    }
  }, [uploadedImage]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
      setError("Faça upload de um arquivo de imagem (PNG/JPG) ou documento.");
      return;
    }

    setError(null);
    setIsSaved(false);
    setExtractedData(null);

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      const cleanBase64 = base64.split(",")[1];
      setUploadedImage(cleanBase64);
      setImageMime(file.type);
      setCustomText("");
    };
    reader.readAsDataURL(file);
  };

  const handleIngest = async () => {
    if (!uploadedImage) return;

    setIsProcessing(true);
    setError(null);
    setExtractedData(null);

    try {
      const res = await fetch("/api/ingest-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileData: uploadedImage,
          mimeType: imageMime,
          description: customText || undefined,
        })
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || "Falha ao extrair direito do documento.");
      }

      const extracted: ExtractedEntitlement = await res.json();
      setExtractedData(extracted);
      setForm({
        softwareName: extracted.softwareName || "",
        publisher: extracted.publisher || "",
        quantity: extracted.quantity || 1,
        unitCost: extracted.unitCost || 0,
        currency: extracted.currency || "USD",
        sku: extracted.sku || "",
        invoiceNumber: extracted.invoiceNumber || "",
        purchaseDate: extracted.purchaseDate || new Date().toISOString().split("T")[0],
        vendor: extracted.vendor || "",
        metricType: MetricType.INSTALLATIONS,
      });
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

  const handleSave = async () => {
    if (!form.softwareName || !form.publisher) {
      setError("Nome do Software e Editora são obrigatórios.");
      return;
    }
    setError(null);
    setIsProcessing(true);
    try {
      let metric = form.metricType;
      const lowerName = form.softwareName.toLowerCase();
      const lowerSku = form.sku.toLowerCase();
      if (lowerName.includes("cloud") || lowerName.includes("sub") || lowerName.includes("365")) metric = MetricType.USERS;
      else if (lowerName.includes("pvu") || lowerSku.includes("pvu")) metric = MetricType.PVU;
      else if (lowerName.includes("core") || lowerSku.includes("core") || lowerName.includes("server")) metric = MetricType.PROCESSOR_CORE;

      await registerLicense({ ...form, metricType: metric });
      setIsSaved(true);
      onRefresh();
    } catch (e: any) {
      setError(e.message || "Falha ao salvar.");
    } finally {
      setIsProcessing(false);
    }
  };

  const resetUpload = () => {
    setUploadedImage(null);
    setImageMime(null);
    setExtractedData(null);
    setForm({
      softwareName: "", publisher: "", quantity: 1, unitCost: 0,
      currency: "USD", sku: "", invoiceNumber: "",
      purchaseDate: new Date().toISOString().split("T")[0],
      vendor: "", metricType: MetricType.INSTALLATIONS,
    });
    setIsSaved(false);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const hasExtractedOrEditing = extractedData || form.softwareName || form.publisher;

  const inputClass = "w-full text-xs border border-[#D0D0D0] rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-[#366BB2] bg-white transition-all";

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="tracking-tight" style={{ color: "#212424", fontSize: "20px", fontWeight: 400 }}>
            <Sparkles className="w-6 h-6 text-[#366BB2] inline mr-2" />
            Ingestão de Direitos Baseada em IA
          </h1>
          <HintTooltip text="Faça upload e processe arquivos de fatura para preencher automaticamente registros de compra de licenças. Suporta formatos CSV, PDF e EDI com extração de itens de linha." side="right" size="md" />
        </div>
        <p className="text-xs mt-0.5" style={{ color: "#6E7070" }}>
          Faça upload de imagens de recibos — o Gemini extrai automaticamente os metadados e preenche o formulário editável abaixo.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ─── LEFT: Upload (2 cols) ─── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Upload card */}
          <div className="bg-white border border-[#D0D0D0] rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="font-semibold text-[#212424] text-xs uppercase tracking-wider">
              Upload de Fatura / Recibo
            </h3>

            <div className="border-2 border-dashed border-[#D0D0D0] hover:border-[#366BB2] rounded-xl p-8 text-center transition-all cursor-pointer relative">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
                disabled={isProcessing}
              />
              {isProcessing ? (
                <>
                  <RefreshCw className="w-10 h-10 text-[#366BB2] mx-auto mb-3 animate-spin" />
                  <p className="text-xs font-semibold text-[#6E7070]">Extraindo dados com Gemini...</p>
                </>
              ) : (
                <>
                  <Upload className="w-10 h-10 text-[#A6A7A7] mx-auto mb-3" />
                  <p className="text-xs font-semibold text-[#6E7070]">Arraste e solte ou clique para fazer upload</p>
                  <p className="text-[10px] text-[#A6A7A7] mt-1">Suporta PNG, JPG, JPEG e PDF</p>
                </>
              )}
            </div>

            {uploadedImage && !isProcessing && (
              <div className="bg-[#F2F2F2] p-2.5 rounded-lg border border-[#D0D0D0] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#366BB2]" />
                  <span className="font-semibold text-[#6E7070]">Arivo anexado</span>
                </div>
                <button
                  onClick={resetUpload}
                  className="text-[10px] font-bold text-rose-600 hover:underline cursor-pointer"
                >
                  Remover
                </button>
              </div>
            )}
          </div>

          {/* Text description quick entry */}
          <div className="bg-white border border-[#D0D0D0] rounded-xl p-5 shadow-sm space-y-3">
            <h3 className="font-semibold text-[#212424] text-xs uppercase tracking-wider">
              Ou descreva o contrato
            </h3>
            <textarea
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder='Ex.: "Compra de 50 licenças do Microsoft 365 Business Premium por US$ 22,00 cada, fatura INV-2024-789 da Microsoft Corporation"'
              className="w-full text-xs border border-[#D0D0D0] rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-[#366BB2] bg-white resize-none"
              rows={3}
            />
            <button
              onClick={async () => {
                if (!customText.trim()) return;
                setIsProcessing(true);
                setError(null);
                setExtractedData(null);
                try {
                  const res = await fetch("/api/ingest-invoice", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ description: customText }),
                  });
                  if (!res.ok) throw new Error((await res.json()).error);
                  const extracted: ExtractedEntitlement = await res.json();
                  setExtractedData(extracted);
                  setForm({
                    softwareName: extracted.softwareName || "",
                    publisher: extracted.publisher || "",
                    quantity: extracted.quantity || 1,
                    unitCost: extracted.unitCost || 0,
                    currency: extracted.currency || "USD",
                    sku: extracted.sku || "",
                    invoiceNumber: extracted.invoiceNumber || "",
                    purchaseDate: extracted.purchaseDate || new Date().toISOString().split("T")[0],
                    vendor: extracted.vendor || "",
                    metricType: MetricType.INSTALLATIONS,
                  });
                } catch (e: any) {
                  setError(e.message);
                } finally {
                  setIsProcessing(false);
                }
              }}
              disabled={isProcessing || !customText.trim()}
              className="w-full py-2 bg-[#F2F2F2] hover:bg-[#E8E8E8] text-[#6E7070] text-xs font-semibold rounded-lg transition-all cursor-pointer disabled:opacity-50"
            >
              Extrair da Descrição
            </button>
          </div>
        </div>

        {/* ─── RIGHT: Editable extracted data (3 cols) ─── */}
        <div className="lg:col-span-3 bg-white border border-[#D0D0D0] rounded-xl p-5 shadow-sm">
          <h3 className="font-semibold text-[#212424] text-xs uppercase tracking-wider border-b border-[#D0D0D0] pb-3 flex items-center gap-2">
            {hasExtractedOrEditing ? <Pencil className="w-3.5 h-3.5 text-[#366BB2]" /> : <Sparkles className="w-3.5 h-3.5 text-[#366BB2]" />}
            {hasExtractedOrEditing ? "Dados Extraídos — Edite antes de salvar" : "Pré-visualização da Extração"}
          </h3>

          {error && (
            <div className="mt-4 p-4 bg-rose-50 border border-rose-200 rounded-lg flex gap-2 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Falha na Extração</p>
                <p className="text-[10px] mt-0.5 leading-relaxed">{error}</p>
              </div>
            </div>
          )}

          {isSaved && (
            <div className="mt-4 flex flex-col gap-2 items-center text-center py-6">
              <div className="bg-emerald-500 text-white rounded-full p-2">
                <Check className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-[#212424]">Licença Salva com Sucesso!</p>
              <p className="text-[10px] text-[#A6A7A7]">O direito foi registrado e os snapshots de conformidade foram recalculados.</p>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={resetUpload}
                  className="px-4 py-2 bg-[#F2F2F2] hover:bg-[#D0D0D0] text-[#6E7070] text-xs font-semibold rounded-lg transition-all cursor-pointer"
                >
                  Nova Ingestão
                </button>
                <button
                  onClick={onNavigateToLicenses}
                  className="px-4 py-2 bg-[#366BB2] hover:bg-[#4079C4] text-white text-xs font-semibold rounded-lg transition-all cursor-pointer"
                >
                  Ir para Licenças
                </button>
              </div>
            </div>
          )}

          {!hasExtractedOrEditing && !error && !isSaved && (
            <div className="py-12 text-center text-[#A6A7A7]">
              <Sparkles className="w-10 h-10 text-[#D0D0D0] mx-auto mb-3" />
              <p className="text-xs font-semibold text-[#6E7070]">Aguardando arquivo</p>
              <p className="text-[10px] mt-0.5">Faça upload de uma fatura para extração automática.</p>
            </div>
          )}

          {hasExtractedOrEditing && !isSaved && (
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[10px] font-bold uppercase mb-1" style={{ color: "#6E7070" }}>Nome do Software *</label>
                  <input type="text" value={form.softwareName} onChange={(e) => setForm({ ...form, softwareName: e.target.value })}
                    placeholder="ex.: Microsoft SQL Server" className={inputClass} />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[10px] font-bold uppercase mb-1" style={{ color: "#6E7070" }}>Editora *</label>
                  <input type="text" value={form.publisher} onChange={(e) => setForm({ ...form, publisher: e.target.value })}
                    placeholder="ex.: Microsoft Corporation" className={inputClass} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase mb-1" style={{ color: "#6E7070" }}>Quantidade</label>
                  <input type="number" min={1} value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: Math.max(1, Number(e.target.value)) })} className={inputClass} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase mb-1" style={{ color: "#6E7070" }}>Custo Unitário</label>
                  <input type="number" min={0} step={0.01} value={form.unitCost}
                    onChange={(e) => setForm({ ...form, unitCost: Number(e.target.value) })} className={inputClass} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase mb-1" style={{ color: "#6E7070" }}>Moeda</label>
                  <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}
                    className={`${inputClass} cursor-pointer`}>
                    {["USD", "EUR", "GBP", "BRL", "CAD", "AUD", "JPY"].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase mb-1" style={{ color: "#6E7070" }}>Tipo de Métrica</label>
                  <select value={form.metricType} onChange={(e) => setForm({ ...form, metricType: e.target.value as MetricType })}
                    className={`${inputClass} cursor-pointer`}>
                    {Object.values(MetricType).map((mt) => (
                      <option key={mt} value={mt}>{mt}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase mb-1" style={{ color: "#6E7070" }}>SKU / Nº de Peça</label>
                  <input type="text" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })}
                    placeholder="Opcional" className={inputClass} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase mb-1" style={{ color: "#6E7070" }}>Nº da Fatura</label>
                  <input type="text" value={form.invoiceNumber} onChange={(e) => setForm({ ...form, invoiceNumber: e.target.value })}
                    placeholder="Opcional" className={inputClass} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase mb-1" style={{ color: "#6E7070" }}>Data de Compra</label>
                  <input type="date" value={form.purchaseDate}
                    onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase mb-1" style={{ color: "#6E7070" }}>Fornecedor</label>
                  <input type="text" value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })}
                    placeholder="Opcional" className={inputClass} />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2 border-t border-[#D0D0D0]">
                <button
                  onClick={handleSave}
                  disabled={isProcessing || !form.softwareName || !form.publisher}
                  className="flex-1 py-2.5 bg-[#366BB2] hover:bg-[#4079C4] text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isProcessing ? (
                    <><RefreshCw className="w-4 h-4 animate-spin" /> Salvando...</>
                  ) : (
                    <><Save className="w-4 h-4" /> Salvar no Inventário de Licenças</>
                  )}
                </button>
                {extractedData && (
                  <button
                    onClick={resetUpload}
                    className="px-4 py-2.5 bg-[#F2F2F2] hover:bg-[#E8E8E8] text-[#6E7070] text-xs font-semibold rounded-lg transition-all cursor-pointer"
                  >
                    Nova Extração
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
