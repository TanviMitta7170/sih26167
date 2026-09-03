"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  ArrowLeft, 
  Upload, 
  FileText, 
  Compass, 
  Search, 
  Send, 
  Terminal, 
  Activity, 
  CheckCircle2, 
  AlertCircle, 
  Database,
  Cpu,
  Layers,
  ArrowRight,
  Download,
  Info
} from "lucide-react";
import GeospatialMap from "./GeospatialMap";

interface AnalysisWorkspaceProps {
  onBackToDashboard: () => void;
  onSaveAnalysis: (newAnalysis: any) => void;
  initialMode: "single" | "change" | "fusion";
}

interface FileMetadata {
  name: string;
  size: string;
  type: string;
  crs: string;
  resolution: string;
  bands: string;
  dimensions: string;
  src: string;
  bounds: any;
  id?: string;
}

export default function AnalysisWorkspace({
  onBackToDashboard,
  onSaveAnalysis,
  initialMode
}: AnalysisWorkspaceProps) {
  const [mode, setMode] = useState<"single" | "change" | "fusion">(initialMode);
  const [activeMapTab, setActiveMapTab] = useState<"map" | "split" | "swipe" | "change">("map");

  // File Upload State
  const [file1, setFile1] = useState<FileMetadata | null>(null);
  const [file2, setFile2] = useState<FileMetadata | null>(null);
  const file1Ref = useRef<HTMLInputElement>(null);
  const file2Ref = useRef<HTMLInputElement>(null);

  // AOI State
  const [selectedAoi, setSelectedAoi] = useState<{ minLat: number; maxLat: number; minLon: number; maxLon: number; areaKm2: number } | null>(null);

  // Analysis / Execution State
  const [query, setQuery] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressStep, setProgressStep] = useState(0);
  const [analysisCompleted, setAnalysisCompleted] = useState(false);

  // Simulated AI Output
  const [outputAnswer, setOutputAnswer] = useState<string>("");
  const [confidenceScore, setConfidenceScore] = useState<number | string>(0);
  const [calculations, setCalculations] = useState<{ areaKm2: number; percentage: number } | null>(null);
  const [executionTrace, setExecutionTrace] = useState<any[]>([]);

  // Default coordinate changes overlay representing Delhi building growth
  const [changeMask, setChangeMask] = useState<any | null>(null);

  // Pre-load default real imagery
  useEffect(() => {
    // Default Delhi sample bounds
    const defaultBounds = {
      west: 77.1950,
      south: 28.6020,
      east: 77.2250,
      north: 28.6250
    };

    if (mode === "change" || mode === "fusion") {
      setFile1({
        name: "delhi_before.tif",
        size: "0.26 MB",
        type: "TIFF (Optical RGB + NIR)",
        crs: "EPSG:4326",
        resolution: "6.5 m / pixel",
        bands: "Red, Green, Blue, NIR",
        dimensions: "512 x 512",
        src: "http://127.0.0.1:8002/api/v1/samples/delhi_before.png",
        bounds: defaultBounds,
        id: "samples/delhi_before.tif"
      });
      setFile2({
        name: "delhi_after.tif",
        size: "0.26 MB",
        type: "TIFF (Optical RGB + NIR)",
        crs: "EPSG:4326",
        resolution: "6.5 m / pixel",
        bands: "Red, Green, Blue, NIR",
        dimensions: "512 x 512",
        src: "http://127.0.0.1:8002/api/v1/samples/delhi_after.png",
        bounds: defaultBounds,
        id: "samples/delhi_after.tif"
      });
    } else {
      setFile1({
        name: "delhi_before.tif",
        size: "0.26 MB",
        type: "TIFF (Optical RGB + NIR)",
        crs: "EPSG:4326",
        resolution: "6.5 m / pixel",
        bands: "Red, Green, Blue, NIR",
        dimensions: "512 x 512",
        src: "http://127.0.0.1:8002/api/v1/samples/delhi_before.png",
        bounds: defaultBounds,
        id: "samples/delhi_before.tif"
      });
      setFile2(null);
    }
  }, [mode]);

  // Handle local file uploads
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, imageSlot: 1 | 2) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show loading trace or UI state
    setExecutionTrace(prev => [
      ...prev,
      {
        time: "Now",
        message: `Uploading ${file.name} to server for geospatial parsing...`,
        status: "info"
      }
    ]);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://127.0.0.1:8002/api/v1/upload", {
        method: "POST",
        body: formData
      });
      if (!response.ok) throw new Error("Upload and metadata extraction failed.");
      
      const data = await response.json();
      
      const metadata: FileMetadata = {
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        type: data.bands_count ? `${data.bands_count} bands raster` : file.type,
        crs: data.crs,
        resolution: data.resolution,
        bands: data.bands,
        dimensions: data.dimensions,
        src: data.preview_url,
        bounds: data.bounds,
        id: data.id
      };

      if (imageSlot === 1) {
        setFile1(metadata);
      } else {
        setFile2(metadata);
      }

      setExecutionTrace(prev => [
        ...prev,
        {
          time: "+0.0s",
          message: `Ingested ${file.name}. Parsed CRS: ${data.crs}, Res: ${data.resolution}.`,
          status: "success"
        }
      ]);
    } catch (err: any) {
      console.error(err);
      alert(`Error uploading file: ${err.message || err}`);
      setExecutionTrace(prev => [
        ...prev,
        {
          time: "Error",
          message: `Failed to upload ${file.name}. Ensure backend server is online.`,
          status: "error"
        }
      ]);
    }
  };

  // Submit AI Question
  const handleQuerySubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim() || isProcessing || !file1) return;

    setIsProcessing(true);
    setAnalysisCompleted(false);
    setProgressStep(1);
    setExecutionTrace([]);

    const payload = {
      mode: mode,
      file1: file1.id || "samples/delhi_before.tif",
      file2: file2 ? (file2.id || "samples/delhi_after.tif") : null,
      query: query,
      aoi: selectedAoi ? {
        minLat: selectedAoi.minLat,
        maxLat: selectedAoi.maxLat,
        minLon: selectedAoi.minLon,
        maxLon: selectedAoi.maxLon
      } : null
    };

    // Trigger step-by-step progress simulation in UI
    const steps = [
      { step: 1, message: "Validating input files and coordinate reference overlap..." },
      { step: 2, message: "Co-registering raster layers and aligning spatial resolution grids..." },
      { step: 3, message: "Selecting specialist models: ChangeFormer v2 + ResNet adapter..." },
      { step: 4, message: "Performing pixel-level inference and calculating indices..." },
      { step: 5, message: "Compiling vector evidence shapes and grounding confidence..." }
    ];

    let current = 0;
    const interval = setInterval(() => {
      if (current < steps.length - 1) {
        setProgressStep(steps[current].step);
        setExecutionTrace(prev => [
          ...prev,
          {
            time: `+${(current * 0.4).toFixed(1)}s`,
            message: steps[current].message,
            status: "success"
          }
        ]);
        current++;
      } else {
        clearInterval(interval);
      }
    }, 500);

    try {
      const response = await fetch("http://127.0.0.1:8002/api/v1/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error("Backend remote-sensing analysis engine failed.");
      const result = await response.json();

      clearInterval(interval);
      setProgressStep(5);
      
      // Update results
      setOutputAnswer(result.findings);
      setConfidenceScore(result.confidence);
      setCalculations({
        areaKm2: result.area_km2,
        percentage: result.percentage
      });
      setChangeMask({
        maskCoordinates: result.maskCoordinates
      });
      
      setIsProcessing(false);
      setAnalysisCompleted(true);
      setActiveMapTab("change"); // Default to change mask view

      if (result.execution_trace && Array.isArray(result.execution_trace)) {
        setExecutionTrace(prev => [
          ...prev,
          ...result.execution_trace
        ]);
      } else {
        setExecutionTrace(prev => [
          ...prev,
          {
            time: "+2.5s",
            message: "Spatial evidence vectors successfully generated and mapped.",
            status: "success"
          }
        ]);
      }
    } catch (err: any) {
      clearInterval(interval);
      setIsProcessing(false);
      console.error(err);
      alert(`Analysis failed: ${err.message || err}`);
      setExecutionTrace(prev => [
        ...prev,
        {
          time: "Error",
          message: `Inference failed. Ensure Python GIS backend is running.`,
          status: "error"
        }
      ]);
    }
  };

  // Pre-fill suggested queries
  const handleSuggestedClick = (qText: string) => {
    setQuery(qText);
  };

  // Clear inputs and state
  const resetWorkspace = () => {
    setQuery("");
    setAnalysisCompleted(false);
    setCalculations(null);
    setChangeMask(null);
    setSelectedAoi(null);
    setProgressStep(0);
    setExecutionTrace([]);
  };

  // Save analysis to parent state database
  const saveToHistory = () => {
    if (!analysisCompleted) return;
    const newRecord = {
      id: `analysis-${Date.now()}`,
      name: query.length > 30 ? query.substring(0, 30) + "..." : query,
      mode: mode,
      date: new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }),
      status: "completed",
      findings: outputAnswer,
      area: `${calculations?.areaKm2.toFixed(2)} km²`,
      confidence: typeof confidenceScore === 'number' ? `${confidenceScore}%` : confidenceScore
    };
    onSaveAnalysis(newRecord);
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)]">
      
      {/* Workspace Sub-header */}
      <div className="h-12 border-b border-border-subtle bg-background-secondary flex items-center justify-between px-6 z-10 shrink-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBackToDashboard}
            className="flex items-center gap-1.5 font-mono text-xs text-text-secondary hover:text-text-primary transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>DASHBOARD</span>
          </button>
          <div className="h-4 w-px bg-border-subtle" />
          <span className="font-mono text-xs text-text-primary uppercase font-bold">
            WORKSPACE: {mode.toUpperCase()} MODE
          </span>
        </div>

        <div className="flex items-center gap-2">
          {analysisCompleted && (
            <button 
              onClick={saveToHistory}
              className="h-7 px-3 bg-background-tertiary hover:bg-border-muted border border-border-muted text-[10px] font-mono text-text-primary rounded-sm transition-colors"
            >
              Save to Logs
            </button>
          )}
        </div>
      </div>

      {/* Main Workspace Panels Layout */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        
        {/* LEFT PANEL: Inputs, Uploads, Metadata */}
        <div className="w-full lg:w-80 border-r border-border-subtle bg-background-secondary/70 flex flex-col divide-y divide-border-subtle/50 overflow-y-auto shrink-0">
          
          {/* Mode Selector */}
          <div className="p-4 flex flex-col gap-2.5">
            <span className="font-mono text-[10px] text-text-muted">WORKFLOW PIPELINE</span>
            <div className="grid grid-cols-3 gap-1 bg-background-primary p-1 rounded-sm border border-border-subtle">
              <button
                onClick={() => { setMode("single"); resetWorkspace(); }}
                className={`py-1 text-[10px] font-mono rounded-sm transition-colors ${
                  mode === "single" ? "bg-background-tertiary text-accent-teal" : "text-text-secondary hover:text-text-primary"
                }`}
              >
                SINGLE
              </button>
              <button
                onClick={() => { setMode("change"); resetWorkspace(); }}
                className={`py-1 text-[10px] font-mono rounded-sm transition-colors ${
                  mode === "change" ? "bg-background-tertiary text-accent-blue" : "text-text-secondary hover:text-text-primary"
                }`}
              >
                CHANGE
              </button>
              <button
                onClick={() => { setMode("fusion"); resetWorkspace(); }}
                className={`py-1 text-[10px] font-mono rounded-sm transition-colors ${
                  mode === "fusion" ? "bg-background-tertiary text-accent-blue" : "text-text-secondary hover:text-text-primary"
                }`}
              >
                FUSION
              </button>
            </div>
          </div>

          {/* Raster Inputs slots */}
          <div className="p-4 flex flex-col gap-4">
            <span className="font-mono text-[10px] text-text-muted">INPUT ACQUISITIONS</span>
            
            {/* Input Slot 1 */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center text-[10px] font-mono">
                <span className="text-text-secondary font-semibold">IMAGE 1 {mode === "change" && "(BEFORE)"}</span>
                {file1 && (
                  <button onClick={() => setFile1(null)} className="text-accent-red hover:underline">Clear</button>
                )}
              </div>
              
              {file1 ? (
                <div className="bg-background-primary border border-border-subtle p-3 rounded-sm flex items-start gap-3">
                  <div className="w-10 h-10 border border-border-subtle rounded-sm overflow-hidden shrink-0">
                    <img src={file1.src} alt="Thumb 1" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0 font-mono text-[9px] text-text-secondary leading-tight flex flex-col gap-0.5">
                    <span className="text-text-primary truncate font-bold">{file1.name}</span>
                    <span>{file1.type} • {file1.size}</span>
                  </div>
                </div>
              ) : (
                <div 
                  onClick={() => file1Ref.current?.click()}
                  className="h-20 border border-dashed border-border-subtle hover:border-border-muted bg-background-primary rounded-sm flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors"
                >
                  <Upload className="w-4 h-4 text-text-muted" />
                  <span className="font-mono text-[10px] text-text-secondary">Upload raster file</span>
                  <input type="file" ref={file1Ref} onChange={(e) => handleFileUpload(e, 1)} className="hidden" accept="image/*" />
                </div>
              )}
            </div>

            {/* Input Slot 2 (Only for change / fusion) */}
            {mode !== "single" && (
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span className="text-text-secondary font-semibold">
                    IMAGE 2 {mode === "change" ? "(AFTER)" : "(SAR MATRIX)"}
                  </span>
                  {file2 && (
                    <button onClick={() => setFile2(null)} className="text-accent-red hover:underline">Clear</button>
                  )}
                </div>
                
                {file2 ? (
                  <div className="bg-background-primary border border-border-subtle p-3 rounded-sm flex items-start gap-3">
                    <div className="w-10 h-10 border border-border-subtle rounded-sm overflow-hidden shrink-0">
                      <img src={file2.src} alt="Thumb 2" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0 font-mono text-[9px] text-text-secondary leading-tight flex flex-col gap-0.5">
                      <span className="text-text-primary truncate font-bold">{file2.name}</span>
                      <span>{file2.type} • {file2.size}</span>
                    </div>
                  </div>
                ) : (
                  <div 
                    onClick={() => file2Ref.current?.click()}
                    className="h-20 border border-dashed border-border-subtle hover:border-border-muted bg-background-primary rounded-sm flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors"
                  >
                    <Upload className="w-4 h-4 text-text-muted" />
                    <span className="font-mono text-[10px] text-text-secondary">Upload raster file</span>
                    <input type="file" ref={file2Ref} onChange={(e) => handleFileUpload(e, 2)} className="hidden" accept="image/*" />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Raster metadata details */}
          {file1 && (
            <div className="p-4 flex flex-col gap-3 font-mono text-[10px]">
              <span className="text-text-muted">ACTIVE LAYER METADATA</span>
              
              <div className="flex justify-between border-b border-border-subtle/30 pb-1.5">
                <span className="text-text-secondary">Resolution</span>
                <span className="text-text-primary font-bold">{file1.resolution}</span>
              </div>
              <div className="flex justify-between border-b border-border-subtle/30 pb-1.5">
                <span className="text-text-secondary">CRS Projection</span>
                <span className="text-text-primary font-bold">{file1.crs}</span>
              </div>
              <div className="flex justify-between border-b border-border-subtle/30 pb-1.5">
                <span className="text-text-secondary">Grid Boundaries</span>
                <span className="text-text-primary font-bold">{file1.dimensions}</span>
              </div>
              <div className="flex justify-between border-b border-border-subtle/30 pb-1.5">
                <span className="text-text-secondary">Active Bands</span>
                <span className="text-text-primary font-bold text-accent-teal">{file1.bands}</span>
              </div>
            </div>
          )}

        </div>

        {/* CENTER PANEL: Geospatial Map View */}
        <div className="flex-1 flex flex-col bg-background-primary p-4 gap-4 overflow-y-auto">
          {/* Map Display Tab Selectors */}
          <div className="flex justify-between items-center shrink-0">
            <div className="flex gap-1.5 bg-background-secondary p-1 rounded-sm border border-border-subtle">
              <button
                onClick={() => setActiveMapTab("map")}
                className={`px-3 py-1 text-[10px] font-mono rounded-sm transition-colors ${
                  activeMapTab === "map" ? "bg-background-tertiary text-text-primary" : "text-text-secondary hover:text-text-primary"
                }`}
              >
                MAP VIEW
              </button>
              {mode !== "single" && (
                <>
                  <button
                    onClick={() => setActiveMapTab("swipe")}
                    className={`px-3 py-1 text-[10px] font-mono rounded-sm transition-colors ${
                      activeMapTab === "swipe" ? "bg-background-tertiary text-text-primary" : "text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    SWIPE VIEW
                  </button>
                  <button
                    onClick={() => setActiveMapTab("change")}
                    className={`px-3 py-1 text-[10px] font-mono rounded-sm transition-colors ${
                      activeMapTab === "change" ? "bg-background-tertiary text-text-primary" : "text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    CHANGE MAP
                  </button>
                </>
              )}
            </div>

            <span className="text-[10px] font-mono text-text-muted flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-accent-blue" />
              CO-REGISTERED FRAME: WGS 84
            </span>
          </div>

          {/* Interactive Custom Map component */}
          <GeospatialMap 
            beforeImage={file1 ? file1.src : null}
            afterImage={file2 ? file2.src : null}
            beforeBounds={file1 ? file1.bounds : null}
            afterBounds={file2 ? file2.bounds : null}
            analysisResult={changeMask}
            activeTab={activeMapTab}
            onAoiSelect={setSelectedAoi}
            selectedAoi={selectedAoi}
          />

          {/* Bottom Execution Trace Panel */}
          <div className="border border-border-subtle bg-background-secondary/60 rounded-sm p-4 flex flex-col gap-3">
            <span className="font-mono text-xs font-semibold text-text-primary flex items-center gap-1.5 border-b border-border-subtle pb-2">
              <Terminal className="w-4 h-4 text-accent-teal" />
              SYSTEM EXECUTION TRACE
            </span>
            
            {executionTrace.length === 0 ? (
              <p className="text-[10px] text-text-muted font-mono italic">
                Awaiting observation submission to populate trace metrics...
              </p>
            ) : (
              <div className="flex flex-col gap-1.5 font-mono text-[9px] max-h-24 overflow-y-auto">
                {executionTrace.map((log, idx) => (
                  <div key={idx} className="flex gap-3">
                    <span className="text-text-muted">[{log.time}]</span>
                    <span className="text-accent-teal font-semibold">✓</span>
                    <span className="text-text-secondary">{log.message}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL: AI Analyst Assistant Panel */}
        <div className="w-full lg:w-96 border-l border-border-subtle bg-background-secondary/70 p-4 flex flex-col gap-5 overflow-y-auto shrink-0">
          
          <div className="flex justify-between items-center border-b border-border-subtle pb-3">
            <span className="font-mono text-xs font-semibold text-text-primary flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-accent-blue" />
              AI SPATIAL ANALYST
            </span>
            <span className={`px-2 py-0.5 rounded-sm font-mono text-[9px] border ${
              isProcessing 
                ? "bg-accent-amber/5 border-accent-amber/30 text-accent-amber" 
                : "bg-accent-green/5 border-accent-green/30 text-accent-green-light"
            }`}>
              {isProcessing ? "PROCESSING" : "STANDBY"}
            </span>
          </div>

          {/* Chat Form */}
          <form onSubmit={handleQuerySubmit} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-[10px] text-text-secondary">ASK SENSOR QUESTION</label>
              <div className="relative">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={
                    selectedAoi 
                      ? "Ask question about selected AOI..." 
                      : "Has the built-up area increased?"
                  }
                  className="w-full h-10 pl-3 pr-10 bg-background-primary border border-border-subtle focus:border-border-muted rounded-sm text-xs font-mono text-text-primary focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!query.trim() || isProcessing}
                  className="absolute right-2 top-2 h-6 w-6 flex items-center justify-center text-text-secondary hover:text-text-primary disabled:text-text-muted disabled:hover:text-text-muted transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Suggested questions based on mode */}
            {!analysisCompleted && !isProcessing && (
              <div className="flex flex-col gap-1.5">
                <span className="font-mono text-[9px] text-text-muted uppercase">Suggested queries:</span>
                <div className="flex flex-col gap-1">
                  {(mode === "change" ? [
                    "Has the built-up area increased?",
                    "What changed between these two images?",
                    "Detect new roads constructed in this region."
                  ] : mode === "fusion" ? [
                    "Compare optical and SAR evidence here.",
                    "Verify road constructing consensus.",
                    "Reconcile layout cloud coverage."
                  ] : [
                    "Is there evidence of flooding?",
                    "Find water bodies and estimate area.",
                    "Generate scene caption description."
                  ]).map((suggest, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSuggestedClick(suggest)}
                      className="text-left px-2.5 py-1.5 bg-background-primary hover:bg-background-tertiary border border-border-subtle rounded-sm text-[10px] font-mono text-text-secondary hover:text-text-primary transition-colors truncate"
                    >
                      {suggest}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </form>

          {/* Dynamic AI Results Panel */}
          {(isProcessing || analysisCompleted) && (
            <div className="flex-1 flex flex-col gap-4 border-t border-border-subtle pt-4">
              
              {/* Telemetry processing checkpoints */}
              {isProcessing && (
                <div className="flex flex-col gap-2.5 font-mono text-[10px]">
                  <span className="text-text-muted">EXECUTION STATUS</span>
                  <div className="flex items-center gap-2">
                    <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                      progressStep >= 1 ? "border-accent-green text-accent-green-light" : "border-border-muted"
                    }`}>
                      {progressStep > 1 && "✓"}
                    </div>
                    <span className={progressStep === 1 ? "text-accent-blue" : "text-text-secondary"}>Understanding Query</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                      progressStep >= 2 ? "border-accent-green text-accent-green-light" : "border-border-muted"
                    }`}>
                      {progressStep > 2 && "✓"}
                    </div>
                    <span className={progressStep === 2 ? "text-accent-blue" : "text-text-secondary"}>Validating Imagery</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                      progressStep >= 3 ? "border-accent-green text-accent-green-light" : "border-border-muted"
                    }`}>
                      {progressStep > 3 && "✓"}
                    </div>
                    <span className={progressStep === 3 ? "text-accent-blue" : "text-text-secondary"}>Selecting Specialist Models</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                      progressStep >= 4 ? "border-accent-green text-accent-green-light" : "border-border-muted"
                    }`}>
                      {progressStep > 4 && "✓"}
                    </div>
                    <span className={progressStep === 4 ? "text-accent-blue" : "text-text-secondary"}>Processing Rasters</span>
                  </div>
                </div>
              )}

              {/* Final Answers report */}
              {analysisCompleted && (
                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-center font-mono text-[10px]">
                    <span className="text-text-muted">SPATIAL EVIDENCE MATCH</span>
                    <span className="text-accent-green-light font-bold">CONFIDENCE: {typeof confidenceScore === 'number' ? `${confidenceScore}%` : confidenceScore}</span>
                  </div>

                  <div className="bg-background-primary border border-border-subtle p-3 rounded-sm">
                    <p className="text-xs font-mono text-text-primary leading-relaxed">
                      {outputAnswer}
                    </p>
                  </div>

                  {calculations && (
                    <div className="grid grid-cols-2 gap-3 font-mono">
                      <div className="bg-background-primary border border-border-subtle p-2.5 rounded-sm">
                        <span className="text-[9px] text-text-muted leading-none">DETECTED CHANGE AREA</span>
                        <p className="text-sm font-bold text-accent-red-light mt-1">{calculations.areaKm2.toFixed(2)} km²</p>
                      </div>
                      <div className="bg-background-primary border border-border-subtle p-2.5 rounded-sm">
                        <span className="text-[9px] text-text-muted leading-none">SCALE OF VARIATION</span>
                        <p className="text-sm font-bold text-accent-blue-light mt-1">+{calculations.percentage.toFixed(1)}%</p>
                      </div>
                    </div>
                  )}

                  {/* Contextual indicators */}
                  {selectedAoi && (
                    <div className="p-3 bg-background-primary border border-accent-teal/30 rounded-sm font-mono text-[9px] text-text-secondary flex gap-2">
                      <Info className="w-4 h-4 text-accent-teal shrink-0 mt-0.5" />
                      <p>
                        Calculations constrained to selected AOI box bounds ({selectedAoi.areaKm2.toFixed(2)} km²).
                      </p>
                    </div>
                  )}

                </div>
              )}

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
