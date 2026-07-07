import React, { useState } from "react";
import { Upload, FileText, Sparkles, Check, AlertCircle, RefreshCw, Layers } from "lucide-react";
import { MetricType } from "../types.js";
import { motion } from "motion/react";

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

  // Sample templates to let users test instantly
  const sampleInvoices = [
    {
      title: "Adobe Acrobat Volume Licenses",
      text: "INVOICE #INV-AD-2026\nVendor: Adobe Systems Inc.\nDate: 2026-05-15\n\nLine Items:\n1. Adobe Acrobat Pro Enterprise (SKU: AD-AC-PRO-VOL) - Qty: 15 - Unit Price: $180.00 USD\n\nTotal Due: $2,700.00"
    },
    {
      title: "Oracle Database Core Upgrades",
      text: "BILL TO: Corp Enterprise Accounts\nPO Number: PO-ORCL-1010\nDate: 2026-06-01\nVendor: Oracle Corporation\n\nDescription:\nOracle Database Enterprise Edition Licensing PVU Points (SKU: ORCL-DB-EE-PVU)\nQuantity: 1500 PVU points\nUnit Cost: $40.00\n\nTotal Price: $60,000.00 USD"
    },
    {
      title: "Salesforce Service Cloud Subscription",
      text: "SALESFORCE.COM SALES RECEIPT\nReceipt ID: SF-REC-998\nDate: 2026-04-10\n\nPurchased Subscriptions:\nSalesforce Service Cloud (SKU: SF-CC-SERV) - 75 seats\nAnnual Subscription Unit Fee: $1,200.00 USD\n\nTotal Amount: $90,000.00 USD"
    }
  ];

  const handleSelectSample = (text: string) => {
    setCustomText(text);
    setUploadedImage(null);
    setImageMime(null);
    setExtractedData(null);
    setIsSaved(false);
    setError(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
      setError("Please upload an image file (PNG/JPG) or document.");
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
      setError("Please upload an invoice file or select a sample description first.");
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
        throw new Error(errJson.error || "Failed to extract entitlement from document.");
      }

      const extracted = await res.json();
      setExtractedData(extracted);
    } catch (e: any) {
      console.error(e);
      setError(e.message || "An unexpected error occurred during AI invoice parsing.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRegisterLicense = async () => {
    if (!extractedData) return;

    try {
      // Determine suitable Metric Type based on SKU or title heuristics
      let metric = MetricType.INSTALLATIONS;
      const lowerName = extractedData.softwareName.toLowerCase();
      const lowerSku = (extractedData.sku || "").toLowerCase();

      if (lowerName.includes("cloud") || lowerName.includes("sub") || lowerName.includes("365")) {
        metric = MetricType.USERS;
      } else if (lowerName.includes("pvu") || lowerSku.includes("pvu")) {
        metric = MetricType.PVU;
      } else if (lowerName.includes("core") || lowerSku.includes("core") || lowerName.includes("server")) {
        metric = MetricType.PROCESSOR_CORE;
      }

      const res = await fetch("/api/licenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          softwareName: extractedData.softwareName,
          publisher: extractedData.publisher,
          metricType: metric,
          sku: extractedData.sku || "N/A",
          version: "AI Extracted",
          notes: `Automated ingest via AI Ingestion from Invoice ${extractedData.invoiceNumber || "N/A"} purchased from vendor ${extractedData.vendor || "N/A"}.`,
          isSubscription: lowerName.includes("sub") || lowerName.includes("cloud"),
          purchases: [
            {
              quantity: extractedData.quantity,
              unitCost: extractedData.unitCost,
              invoiceNumber: extractedData.invoiceNumber || "AI-INGEST",
              purchaseDate: extractedData.purchaseDate || new Date().toISOString().split("T")[0],
              currency: extractedData.currency || "USD"
            }
          ]
        })
      });

      if (res.ok) {
        setIsSaved(true);
        onRefresh();
      } else {
        const errorMsg = await res.json();
        setError(errorMsg.error || "Failed to save AI-extracted license.");
      }
    } catch (e) {
      console.error(e);
      setError("Failed to register AI-extracted license contract.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-[#00549F]" />
          AI-Based Entitlement Ingestion
        </h1>
        <p className="text-slate-500 text-sm">
          Upload receipt images or input purchase descriptions. Our Gemini parsing model extracts licensing quantities, values, currencies, and SKUs.
        </p>
      </div>

      {/* Main panel layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Side: Upload & Input Area */}
        <div className="space-y-6">
          
          {/* File Upload card */}
          <div className="bg-white border border-[#DDDDDD] rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="font-semibold text-slate-800 text-xs uppercase tracking-wider">Option A: Upload Invoice / PO Receipt</h3>
            
            <div className="border-2 border-dashed border-[#DDDDDD] hover:border-[#00549F] rounded-xl p-8 text-center transition-all cursor-pointer relative">
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <Upload className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-xs font-semibold text-slate-700">Drag & drop or click to upload</p>
              <p className="text-[10px] text-slate-400 mt-1">Supports PNG, JPG, JPEG, and PDF documents</p>
            </div>

            {uploadedImage && (
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-150 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#00549F]" />
                  <span className="font-semibold text-slate-700">Invoice Image Attached</span>
                </div>
                <button
                  onClick={() => { setUploadedImage(null); setImageMime(null); }}
                  className="text-[10px] font-bold text-rose-600 hover:underline cursor-pointer"
                >
                  Remove
                </button>
              </div>
            )}
          </div>

          {/* Option B: Text samples card */}
          <div className="bg-white border border-[#DDDDDD] rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-800 text-xs uppercase tracking-wider">Option B: Ingest from Invoice Description</h3>
              <span className="text-[10px] bg-sky-50 text-sky-700 px-2 py-0.5 rounded-full font-bold">Fast Trial</span>
            </div>

            {/* Selector boxes */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {sampleInvoices.map((inv, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectSample(inv.text)}
                  className="p-2 text-left bg-slate-50 border border-[#DDDDDD] hover:border-[#00549F] rounded-lg text-[10px] font-medium text-slate-700 transition-all cursor-pointer line-clamp-1"
                >
                  {inv.title}
                </button>
              ))}
            </div>

            {/* Custom Description Textarea */}
            <div>
              <textarea
                rows={5}
                placeholder="Or paste purchase quotes, fatures text, invoice line summaries, or email order confirmation messages directly here..."
                value={customText}
                onChange={(e) => {
                  setCustomText(e.target.value);
                  setUploadedImage(null);
                  setImageMime(null);
                }}
                className="w-full text-xs border border-[#DDDDDD] rounded-lg p-3 focus:outline-none focus:ring-1 focus:ring-[#00549F] bg-white"
              />
            </div>
          </div>

          {/* Action Trigger Button */}
          <button
            onClick={handleIngest}
            disabled={isProcessing || (!customText && !uploadedImage)}
            className="w-full py-3 bg-[#00549F] text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 disabled:opacity-50 transition-all cursor-pointer shadow"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Gemini AI Extracting Line Items...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Trigger Gemini AI Parsing Engine
              </>
            )}
          </button>
        </div>

        {/* Right Side: Extraction Output Preview */}
        <div className="bg-white border border-[#DDDDDD] rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div className="space-y-6">
            <h3 className="font-semibold text-slate-800 text-xs uppercase tracking-wider border-b border-slate-100 pb-3">
              AI Structured Extraction Preview
            </h3>

            {error && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg flex gap-2 text-xs text-rose-700">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Extraction Failed</p>
                  <p className="text-[10px] mt-0.5 leading-relaxed">{error}</p>
                </div>
              </div>
            )}

            {isProcessing && (
              <div className="p-12 text-center text-slate-400 space-y-3">
                <RefreshCw className="w-8 h-8 animate-spin text-[#00549F] mx-auto" />
                <p className="text-xs font-semibold text-slate-700">Scanning document OCR & structures...</p>
                <p className="text-[10px]">Reconciling product SKUs, licensing matrices, and vendor entities.</p>
              </div>
            )}

            {!extractedData && !isProcessing && !error && (
              <div className="p-12 text-center text-slate-400">
                <Sparkles className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                <p className="text-xs font-semibold text-slate-600">Waiting for AI Ingest Trigger</p>
                <p className="text-[10px] mt-0.5">Upload a receipt or select an interactive template above to see Gemini OCR and metadata mapping.</p>
              </div>
            )}

            {extractedData && !isProcessing && (
              <div className="space-y-4">
                <div className="p-3.5 bg-emerald-50 rounded-lg border border-emerald-200 flex gap-2 text-emerald-800 text-[11px]">
                  <Check className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Gemini Ingest Successful!</p>
                    <p className="text-[10px] mt-0.5">Metadata structured and validated against Snow Atlas Data Catalog heuristics.</p>
                  </div>
                </div>

                {/* Structured details display */}
                <div className="grid grid-cols-2 gap-4 text-xs border border-slate-150 p-4 rounded-xl bg-slate-50/50">
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">Product Name</span>
                    <span className="font-semibold text-slate-800">{extractedData.softwareName}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">Publisher</span>
                    <span className="font-semibold text-slate-800">{extractedData.publisher}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">Purchased Quantity</span>
                    <span className="font-bold text-slate-800">{extractedData.quantity} Licenses</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">Unit Cost</span>
                    <span className="font-semibold text-slate-800">
                      {new Intl.NumberFormat("en-US", { style: "currency", currency: extractedData.currency || "USD" }).format(extractedData.unitCost)}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">SKU / Part Number</span>
                    <span className="font-mono text-slate-800">{extractedData.sku || "N/A"}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">Invoice Number</span>
                    <span className="font-mono text-slate-800">{extractedData.invoiceNumber || "N/A"}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">Purchase Date</span>
                    <span className="font-medium text-slate-800">{extractedData.purchaseDate || "N/A"}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">Vendor Store</span>
                    <span className="font-medium text-slate-800">{extractedData.vendor || "N/A"}</span>
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
                  <p className="text-xs font-bold text-slate-800">Asset Saved & Active!</p>
                  <p className="text-[10px] text-slate-400">The entitlement has been registered and compliance snaps are recalculated.</p>
                  <button
                    onClick={onNavigateToLicenses}
                    className="mt-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-all cursor-pointer"
                  >
                    Go to Licenses Inventory
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-[10px] text-slate-400">
                    Registering this extracted data creates a new official software license record and seeds an entitlement purchase line dynamically bound to compliance snapshots.
                  </p>
                  <button
                    onClick={handleRegisterLicense}
                    className="w-full py-2.5 bg-[#00549F] text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
                  >
                    <Layers className="w-4 h-4" />
                    Register Entitlement to Asset Catalog
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
