"use client";

import React, { useState } from "react";
import { 
  Search, 
  Download, 
  Trash2, 
  Layers, 
  MapPin, 
  FileText, 
  Cpu, 
  Clock,
  Compass
} from "lucide-react";

interface HistoryReportsProps {
  analyses: any[];
  onSelectAnalysis: (id: string) => void;
  onDeleteAnalysis: (id: string) => void;
  selectedAnalysisId: string | null;
}

export default function HistoryReports({
  analyses,
  onSelectAnalysis,
  onDeleteAnalysis,
  selectedAnalysisId
}: HistoryReportsProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMode, setFilterMode] = useState<"all" | "single" | "change" | "fusion">("all");

  const filtered = analyses.filter(a => {
    const matchesSearch = a.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          a.findings.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterMode === "all" || a.mode === filterMode;
    return matchesSearch && matchesFilter;
  });

  const activeRecord = analyses.find(a => a.id === selectedAnalysisId) || null;

  // Simulate report downloads
  const handleDownload = (format: "pdf" | "csv" | "tiff") => {
    if (!activeRecord) return;
    const jsonStr = JSON.stringify(activeRecord, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `VyomDrishti_report_${activeRecord.id}.${format === "tiff" ? "tif" : format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row overflow-hidden max-w-7xl mx-auto w-full p-6 gap-6">
      
      {/* Left side: Search, Filters, and Table list */}
      <div className="flex-1 border border-border-subtle bg-background-secondary rounded-sm p-5 flex flex-col gap-4 overflow-y-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-border-subtle pb-4">
          <div>
            <h2 className="text-sm font-bold font-mono tracking-wider text-text-primary uppercase">SPATIAL TELEMETRY RECORD DB</h2>
            <p className="text-[10px] text-text-muted mt-0.5">Filter, search, and download report specifications.</p>
          </div>
          
          <div className="flex gap-1.5 bg-background-primary p-0.5 rounded-sm border border-border-subtle font-mono text-[9px]">
            <button 
              onClick={() => setFilterMode("all")}
              className={`px-2 py-1 rounded-sm ${filterMode === "all" ? "bg-background-tertiary text-text-primary" : "text-text-secondary"}`}
            >
              ALL
            </button>
            <button 
              onClick={() => setFilterMode("single")}
              className={`px-2 py-1 rounded-sm ${filterMode === "single" ? "bg-background-tertiary text-accent-teal" : "text-text-secondary"}`}
            >
              SINGLE
            </button>
            <button 
              onClick={() => setFilterMode("change")}
              className={`px-2 py-1 rounded-sm ${filterMode === "change" ? "bg-background-tertiary text-accent-blue" : "text-text-secondary"}`}
            >
              CHANGE
            </button>
            <button 
              onClick={() => setFilterMode("fusion")}
              className={`px-2 py-1 rounded-sm ${filterMode === "fusion" ? "bg-background-tertiary text-accent-blue" : "text-text-secondary"}`}
            >
              FUSION
            </button>
          </div>
        </div>

        {/* Search bar */}
        <div className="relative">
          <span className="absolute left-3 top-3 text-text-muted">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search records by location name, finding content, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-10 pl-9 pr-4 bg-background-primary border border-border-subtle focus:border-border-muted rounded-sm text-xs font-mono text-text-primary focus:outline-none"
          />
        </div>

        {/* Table of records */}
        {filtered.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center gap-2 border border-dashed border-border-subtle rounded-sm">
            <span className="font-mono text-xs text-text-muted">No historical runs match filter query</span>
            <p className="text-[10px] text-text-muted">Modify parameters or perform a new analysis.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map((a) => (
              <div
                key={a.id}
                onClick={() => onSelectAnalysis(a.id)}
                className={`p-4 border rounded-sm transition-all cursor-pointer flex flex-col sm:flex-row justify-between sm:items-center gap-3 ${
                  activeRecord?.id === a.id
                    ? "bg-background-tertiary border-accent-blue"
                    : "bg-background-primary border-border-subtle hover:border-border-muted"
                }`}
              >
                <div className="flex flex-col gap-1.5 min-w-0">
                  <span className="font-mono text-xs font-semibold text-text-primary truncate">
                    {a.name}
                  </span>
                  <div className="flex flex-wrap items-center gap-3 font-mono text-[9px] text-text-muted">
                    <span className="text-accent-teal uppercase">{a.mode}</span>
                    <span>•</span>
                    <span>{a.date}</span>
                    <span>•</span>
                    <span className="text-text-secondary">Conf: {a.confidence}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => onSelectAnalysis(a.id)}
                    className="h-7 px-3 bg-background-tertiary hover:bg-border-muted border border-border-muted text-[10px] font-mono text-text-primary rounded-sm transition-colors"
                  >
                    Inspect
                  </button>
                  <button
                    onClick={() => onDeleteAnalysis(a.id)}
                    className="p-1.5 text-text-muted hover:text-accent-red rounded-sm transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right side: Detailed Inspection Pane */}
      {activeRecord ? (
        <div className="w-full lg:w-96 border border-border-subtle bg-background-secondary rounded-sm p-5 flex flex-col gap-5 shrink-0 overflow-y-auto">
          <div className="flex justify-between items-center border-b border-border-subtle pb-3">
            <span className="font-mono text-xs font-semibold text-text-primary flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-accent-blue" />
              TELEMETRY SPECIFICATION
            </span>
            <span className="text-[10px] font-mono text-text-muted">ID: {activeRecord.id}</span>
          </div>

          {/* Location and Metadata */}
          <div className="flex flex-col gap-3 font-mono text-[10px] bg-background-primary p-3 border border-border-subtle rounded-sm">
            <div className="flex items-center gap-2 text-text-secondary">
              <MapPin className="w-3.5 h-3.5 text-accent-red-light" />
              <span className="font-bold text-text-primary">{activeRecord.name}</span>
            </div>
            <div className="flex justify-between border-t border-border-subtle/30 pt-2">
              <span className="text-text-secondary">CRS Standard:</span>
              <span className="text-text-primary font-bold">EPSG:32643</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Date run:</span>
              <span className="text-text-primary font-bold">{activeRecord.date}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Model engine:</span>
              <span className="text-text-primary font-bold text-accent-teal">{activeRecord.mode === "fusion" ? "FusionFormer v1" : activeRecord.mode === "change" ? "ChangeFormer v2" : "SingleBand Indexer"}</span>
            </div>
          </div>

          {/* AI Findings Output */}
          <div className="flex flex-col gap-2">
            <span className="font-mono text-[10px] text-text-muted">COMPILED FINDINGS</span>
            <div className="bg-background-primary border border-border-subtle p-3.5 rounded-sm">
              <p className="font-mono text-xs text-text-primary leading-relaxed">
                {activeRecord.findings}
              </p>
            </div>
          </div>

          {/* Specific Stats */}
          <div className="grid grid-cols-2 gap-3 font-mono">
            <div className="bg-background-primary border border-border-subtle p-2.5 rounded-sm">
              <span className="text-[9px] text-text-muted leading-none">CONVERGENCE</span>
              <p className="text-sm font-bold text-accent-green-light mt-1">{activeRecord.confidence}</p>
            </div>
            <div className="bg-background-primary border border-border-subtle p-2.5 rounded-sm">
              <span className="text-[9px] text-text-muted leading-none">TOTAL CHANGE</span>
              <p className="text-sm font-bold text-accent-red-light mt-1">{activeRecord.area || "N/A"}</p>
            </div>
          </div>

          {/* Report download actions */}
          <div className="flex flex-col gap-2 mt-2">
            <span className="font-mono text-[10px] text-text-muted">EXPORT TELEMETRY</span>
            
            <button
              onClick={() => handleDownload("pdf")}
              className="w-full h-9 bg-background-tertiary hover:bg-border-muted border border-border-muted text-xs font-mono font-semibold text-text-primary rounded-sm transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-3.5 h-3.5 text-accent-blue" />
              <span>Download PDF Analysis Report</span>
            </button>

            <button
              onClick={() => handleDownload("tiff")}
              className="w-full h-9 bg-background-tertiary hover:bg-border-muted border border-border-muted text-xs font-mono font-semibold text-text-primary rounded-sm transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-3.5 h-3.5 text-accent-teal" />
              <span>Download Processed GeoTIFF</span>
            </button>

            <button
              onClick={() => handleDownload("csv")}
              className="w-full h-9 bg-background-tertiary hover:bg-border-muted border border-border-muted text-xs font-mono font-semibold text-text-primary rounded-sm transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-3.5 h-3.5 text-text-secondary" />
              <span>Export Vector Coordinates (CSV)</span>
            </button>
          </div>

        </div>
      ) : (
        <div className="w-full lg:w-96 border border-border-subtle bg-background-secondary rounded-sm p-12 flex flex-col items-center justify-center text-center gap-2">
          <span className="font-mono text-xs text-text-muted">No selected record</span>
        </div>
      )}

    </div>
  );
}