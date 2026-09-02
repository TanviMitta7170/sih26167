"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Globe, 
  Layers, 
  Search, 
  ArrowRight, 
  Cpu, 
  Shield, 
  Terminal, 
  Sliders, 
  Activity, 
  Compass, 
  Eye, 
  Database,
  ArrowUpRight,
  Info,
  Clock,
  LayoutDashboard,
  PlusSquare,
  FileBarChart,
  User,
  Settings,
  HelpCircle,
  Menu,
  X,
  MessageSquare,
  FileText
} from "lucide-react";

// Import view components
import Dashboard from "../components/Dashboard";
import AnalysisWorkspace from "../components/AnalysisWorkspace";
import HistoryReports from "../components/HistoryReports";

// Preset queries for Landing Page Simulator
interface TelemetryStep {
  time: string;
  status: "idle" | "running" | "success" | "info";
  message: string;
}

const PRESET_QUERIES = [
  {
    text: "Has the built-up area increased between these two images?",
    mode: "BI-TEMPORAL",
    logs: [
      { time: "00:01", status: "info", message: "QUERY INGEST: Task classified as Bi-Temporal Change Detection." },
      { time: "00:03", status: "running", message: "ALIGNMENT: Detecting CRS overlap... Found UTM Zone 43N / EPSG:32643." },
      { time: "00:04", status: "running", message: "PREPROCESSING: Co-registering acquisitions... RMSE = 0.12 pixels." },
      { time: "00:06", status: "running", message: "MODEL SELECT: Launching ChangeFormer v2 (Land-Cover Variant)." },
      { time: "00:08", status: "running", message: "INFERENCE: Processing segmentation maps on dual tiles..." },
      { time: "00:09", status: "success", message: "EVIDENCE: Segmented built-up growth of 18.64 km² (+23.7%)." },
      { time: "00:10", status: "success", message: "RESOLVED: 'Built-up area increased significantly towards the North & East. Confidence: 91%.'" }
    ]
  },
  {
    text: "Compare the optical and SAR imagery to identify new roads.",
    mode: "OPTICAL + SAR FUSION",
    logs: [
      { time: "00:01", status: "info", message: "QUERY INGEST: Task classified as Optical + SAR Grounding." },
      { time: "00:03", status: "running", message: "ALIGNMENT: Resampling Sentinel-1 (SAR) to Sentinel-2 (Optical) 10m grid." },
      { time: "00:05", status: "running", message: "PROCESSING: Extracting VH/VV backscatter ratio and optical NDVI index." },
      { time: "00:07", status: "running", message: "MODEL SELECT: Activating FusionGrounder-VLM." },
      { time: "00:08", status: "running", message: "INFERENCE: Generating consensus mask... resolving radar layover shadows." },
      { time: "00:09", status: "success", message: "EVIDENCE: 3 linear structures detected matching roadway signature." },
      { time: "00:10", status: "success", message: "RESOLVED: 'Detected new highway construct running parallel to coordinates. Confidence: 87%.'" }
    ]
  },
  {
    text: "Find water bodies and estimate total surface area.",
    mode: "SINGLE IMAGE",
    logs: [
      { time: "00:01", status: "info", message: "QUERY INGEST: Task classified as Single Image Segmentation." },
      { time: "00:03", status: "running", message: "METADATA: Ingested GeoTIFF. Band configurations: B2, B3, B4, B8 (10m)." },
      { time: "00:05", status: "running", message: "PREPROCESSING: Calculating MNDWI (Modified Normalized Difference Water Index)." },
      { time: "00:06", status: "running", message: "MODEL SELECT: Instantiating Segment-Anything Remote Sensing (SAM-RS)." },
      { time: "00:08", status: "running", message: "INFERENCE: Isolating water body polygons..." },
      { time: "00:09", status: "success", message: "EVIDENCE: Isolated 1 major reservoir and 4 tributaries." },
      { time: "00:10", status: "success", message: "RESOLVED: 'Extracted 14.28 km² of open water. Confidence: 96%.'" }
    ]
  }
];

// Seed initial analyses list
const INITIAL_ANALYSES = [
  {
    id: "analysis-1",
    name: "Urban Expansion Study (Delhi NCR)",
    mode: "change",
    date: "May 12, 2026",
    status: "completed",
    findings: "Bi-temporal observation resolves a significant increase in urban built-up area. Growth is concentrated primarily in the northeast quadrant, corresponding with coordinate grids.",
    area: "18.64 km²",
    confidence: "91%"
  },
  {
    id: "analysis-2",
    name: "Flood Extraction Mapping (Bihar)",
    mode: "single",
    date: "May 10, 2026",
    status: "completed",
    findings: "Extraction mapping identifies 14.28 km² of open surface water within the active frame bounds, corresponding to the central reservoir tributaries.",
    area: "14.28 km²",
    confidence: "96%"
  },
  {
    id: "analysis-3",
    name: "Asphalt Highway Verification (Fused)",
    mode: "fusion",
    date: "May 08, 2026",
    status: "completed",
    findings: "Consensus model coregistered passive spectral bands with active microwave backscatter. Co-polarized VH/VV ratios verify that the linear shapes detected represent new asphalt roads.",
    area: "2.31 km²",
    confidence: "87%"
  }
];

export default function AppOrchestrator() {
  const [view, setView] = useState<"landing" | "dashboard" | "workspace" | "history">("landing");
  const [analyses, setAnalyses] = useState(INITIAL_ANALYSES);
  
  // Workspace specific states
  const [workspaceMode, setWorkspaceMode] = useState<"single" | "change" | "fusion">("change");
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string | null>(null);

  // Mobile menu sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Scrollytelling Canvas states and references
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [scrollFraction, setScrollFraction] = useState(0);
  const [images, setImages] = useState<HTMLImageElement[]>([]);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const totalFrames = 240;

  // Render a specific frame on canvas with bounding limits and auto centering
  const drawFrame = (frameIndex: number, loadedImages = images) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Smoothly fade out the movie poster style title and tagline on scroll (fades completely by frame 80)
    const textEl = document.getElementById("canvas-overlay-text");
    const subEl = document.getElementById("canvas-overlay-sub");
    if (textEl) {
      const opacity = Math.max(0, 1 - frameIndex / 80);
      textEl.style.opacity = (opacity * 0.9).toString();
      if (subEl) {
        subEl.style.opacity = (opacity * 0.6).toString();
      }
    }

    // Dynamically resolve canvas backing store size if it's 0 or doesn't match client layout dimensions
    const layoutWidth = canvas.offsetWidth || canvas.clientWidth || 800;
    const layoutHeight = canvas.offsetHeight || canvas.clientHeight || 600;
    if (canvas.width !== layoutWidth || canvas.height !== layoutHeight) {
      canvas.width = layoutWidth;
      canvas.height = layoutHeight;
    }

    // Clear canvas frame before render
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const activeImage = loadedImages[frameIndex];
    if (activeImage && activeImage.complete && activeImage.naturalWidth !== 0) {
      // Draw image scaled and centered (object-cover behavior)
      const hRatio = canvas.width / activeImage.width;
      const vRatio = canvas.height / activeImage.height;
      const ratio = Math.max(hRatio, vRatio);
      const centerShift_x = (canvas.width - activeImage.width * ratio) / 2;
      const centerShift_y = (canvas.height - activeImage.height * ratio) / 2;
      
      ctx.drawImage(
        activeImage, 
        0, 0, activeImage.width, activeImage.height,
        centerShift_x, centerShift_y, activeImage.width * ratio, activeImage.height * ratio
      );
    } else {
      // Glowing tech/satellite holographic earcup wireframe representation (Awwwards fallback style)
      ctx.save();
      ctx.strokeStyle = "rgba(0, 214, 255, 0.25)";
      ctx.lineWidth = 1;
      
      // Outer orbits grids
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height / 2, 120 + Math.sin(frameIndex / 8) * 12, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = "rgba(0, 80, 255, 0.4)";
      ctx.lineWidth = 1.5;
      
      // Floating earcups/wings depending on scroll (explodes outward)
      const explodeOffset = (frameIndex / totalFrames) * 80;
      ctx.beginPath();
      ctx.ellipse(canvas.width / 2 - 120 - explodeOffset, canvas.height / 2, 50, 80, 0, 0, Math.PI * 2);
      ctx.ellipse(canvas.width / 2 + 120 + explodeOffset, canvas.height / 2, 50, 80, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Headband core
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height / 2 - 30, 110 + (explodeOffset * 0.2), Math.PI, 2 * Math.PI);
      ctx.stroke();

      // Exploded particle tracks
      ctx.fillStyle = "#00D6FF";
      for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        const pOffset = (explodeOffset * (1.2 + i * 0.2));
        ctx.arc(canvas.width / 2 - 100 + i * 40 - (i < 3 ? pOffset : -pOffset), canvas.height / 2 + Math.sin(frameIndex / 6 + i) * 35, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  };

  // Preload all 240 frames in the background
  useEffect(() => {
    let loadedCount = 0;
    const preloadedImages: HTMLImageElement[] = [];
    
    for (let i = 0; i < totalFrames; i++) {
      const img = new Image();
      const frameNum = String(i + 1).padStart(3, '0');
      img.src = `/frames/ezgif-2d99b3d12be7ee74-jpg/ezgif-frame-${frameNum}.jpg`; 
      
      img.onload = () => {
        loadedCount++;
        setLoadProgress(Math.round((loadedCount / totalFrames) * 100));
        if (loadedCount === totalFrames) {
          setImagesLoaded(true);
        }
      };
      
      img.onerror = () => {
        // Fallback: Check if the folder contents were placed directly in /frames/
        img.src = `/frames/ezgif-frame-${frameNum}.jpg`;
        img.onload = () => {
          loadedCount++;
          setLoadProgress(Math.round((loadedCount / totalFrames) * 100));
          if (loadedCount === totalFrames) {
            setImagesLoaded(true);
          }
        };
        img.onerror = () => {
          // Standard frame fallbacks
          img.src = `/frames/frame_${frameNum}.jpg`;
          img.onload = () => {
            loadedCount++;
            setLoadProgress(Math.round((loadedCount / totalFrames) * 100));
            if (loadedCount === totalFrames) {
              setImagesLoaded(true);
            }
          };
          img.onerror = () => {
            loadedCount++;
            setLoadProgress(Math.round((loadedCount / totalFrames) * 100));
            if (loadedCount === totalFrames) {
              setImagesLoaded(true);
            }
          };
        };
      };
      preloadedImages.push(img);
    }
    setImages(preloadedImages);
  }, []);

  // Synchronous frame index tracker for smooth scroll wheel rendering
  const frameIndexRef = useRef(0);

  // Monitor scroll/wheel/touch behavior of the page and calculate frame selection
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (view !== "landing" || !imagesLoaded) return;

      const currentScrollY = window.scrollY;
      
      // If at the top of the page, play/rewind the animation in place
      if (currentScrollY <= 5) {
        const isScrollingDown = e.deltaY > 0;
        const isScrollingUp = e.deltaY < 0;

        if (
          (isScrollingDown && frameIndexRef.current < totalFrames - 1) || 
          (isScrollingUp && frameIndexRef.current > 0)
        ) {
          e.preventDefault();
          
          // Adjust scroll speed (increment/decrement frame index)
          const step = isScrollingDown ? 2 : -2;
          frameIndexRef.current = Math.max(0, Math.min(totalFrames - 1, frameIndexRef.current + step));
          
          drawFrame(frameIndexRef.current);
        }
      }
    };

    let touchStartY = 0;
    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (view !== "landing" || !imagesLoaded) return;

      const currentScrollY = window.scrollY;
      if (currentScrollY <= 5) {
        const touchCurrentY = e.touches[0].clientY;
        const deltaY = touchStartY - touchCurrentY;
        const isScrollingDown = deltaY > 0;
        const isScrollingUp = deltaY < 0;

        if (
          (isScrollingDown && frameIndexRef.current < totalFrames - 1) ||
          (isScrollingUp && frameIndexRef.current > 0)
        ) {
          e.preventDefault();
          const step = isScrollingDown ? 2 : -2;
          frameIndexRef.current = Math.max(0, Math.min(totalFrames - 1, frameIndexRef.current + step));
          drawFrame(frameIndexRef.current);
          touchStartY = touchCurrentY;
        }
      }
    };

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > 10) {
        frameIndexRef.current = totalFrames - 1;
        drawFrame(totalFrames - 1);
      } else if (currentScrollY === 0 && frameIndexRef.current === totalFrames - 1) {
        frameIndexRef.current = 0;
        drawFrame(0);
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("scroll", handleScroll);

    // Initial draw
    if (imagesLoaded) {
      drawFrame(frameIndexRef.current);
    }

    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [imagesLoaded, view, images]);

  // Adjust canvas resolution dynamically on window resize based on window dimensions
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      drawFrame(frameIndexRef.current);
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, [imagesLoaded, images]);

  // Landing Page sandbox interactive state
  const [activeQueryIndex, setActiveQueryIndex] = useState(0);
  const [queryText, setQueryText] = useState(PRESET_QUERIES[0].text);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationLogs, setSimulationLogs] = useState<TelemetryStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Auto-fill query text when preset selection changes
  const handlePresetSelect = (index: number) => {
    if (isSimulating) return;
    setActiveQueryIndex(index);
    setQueryText(PRESET_QUERIES[index].text);
    setSimulationLogs([]);
  };

  // Run simulation sequence
  const startSimulation = () => {
    if (isSimulating) return;
    setIsSimulating(true);
    setSimulationLogs([]);
    setCurrentStepIndex(0);
  };

  useEffect(() => {
    if (!isSimulating) return;

    const steps = PRESET_QUERIES[activeQueryIndex].logs;
    if (currentStepIndex < steps.length) {
      const timer = setTimeout(() => {
        setSimulationLogs(prev => [...prev, steps[currentStepIndex] as TelemetryStep]);
        setCurrentStepIndex(prev => prev + 1);
      }, 700);
      return () => clearTimeout(timer);
    } else {
      setIsSimulating(false);
    }
  }, [isSimulating, currentStepIndex, activeQueryIndex]);

  // Save new workspace run records
  const handleSaveAnalysis = (record: any) => {
    setAnalyses(prev => [record, ...prev]);
    setSelectedAnalysisId(record.id);
    setView("history"); // Redirect straight to inspect history logs
  };

  // Delete analysis records
  const handleDeleteAnalysis = (id: string) => {
    setAnalyses(prev => prev.filter(a => a.id !== id));
    if (selectedAnalysisId === id) {
      setSelectedAnalysisId(null);
    }
  };

  // Trigger analysis workspace setup
  const handleStartAnalysis = (mode: "single" | "change" | "fusion") => {
    setWorkspaceMode(mode);
    setView("workspace");
  };

  // Select item from history tables to inspect
  const handleSelectAnalysis = (id: string) => {
    setSelectedAnalysisId(id);
    setView("history");
  };

  // Render Landing
  if (view === "landing") {
    return (
      <div className="min-h-screen bg-background-primary text-text-primary overflow-x-hidden relative select-none geo-grid flex flex-col">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#ffffff]/50 to-[#ffffff] pointer-events-none" />

        {/* Global preloading overlay screen */}
        {!imagesLoaded && (
          <div className="fixed inset-0 z-50 bg-[#050505] flex flex-col items-center justify-center select-none pointer-events-none">
            <div className="flex flex-col items-center gap-4 max-w-xs w-full px-6">
              <div className="relative w-12 h-12 flex items-center justify-center">
                <div className="absolute inset-0 border border-dashed border-[#00bcd4]/30 rounded-full animate-spin" style={{ animationDuration: '6s' }} />
                <div className="w-8 h-8 border-2 border-[#00bcd4] border-t-transparent rounded-full animate-spin" />
              </div>
              <span className="font-mono text-[9px] text-white/60 tracking-[0.2em] uppercase">LOADING 3D ENGINE: {loadProgress}%</span>
            </div>
          </div>
        )}

        {/* Header (Fixed floating at top of screen) */}
        <header className="fixed top-4 left-0 right-0 z-50 w-full max-w-5xl mx-auto px-4 select-none shrink-0">
          <div className="w-full overflow-hidden rounded-full shadow-xl border border-slate-500/10">
            <div className="flex items-stretch h-12 w-[110%] -ml-[5%] transform -skew-x-[20deg]">
              
              {/* Leftmost trailing cap */}
              <div className="bg-[#7b93b4]/40 w-16 shrink-0" />

              {/* Logo section */}
              <div className="bg-[#454c54] flex items-center justify-center pl-10 pr-6 shrink-0">
                <div className="transform skew-x-[20deg] flex items-center">
                  <span 
                    className="text-2xl font-bold text-[#ffcb05] select-none tracking-tight" 
                    style={{ fontFamily: "'Brush Script MT', 'Comic Sans MS', cursive" }}
                  >
                    satquery
                  </span>
                </div>
              </div>

              {/* Cyan separator line */}
              <div className="w-1.5 bg-[#00bcd4] shrink-0" />

              {/* Main Nav Links Segment */}
              <div className="bg-white flex-1 flex items-center justify-between pl-12 pr-6">
                <div className="transform skew-x-[20deg] flex items-center gap-8 text-[#2c3238] font-medium text-sm">
                  <a href="#capabilities" className="hover:text-cyan-600 transition-colors">Capabilities</a>
                  <a href="#how-it-works" className="hover:text-cyan-600 transition-colors">Engine</a>
                  <a href="#specifications" className="hover:text-cyan-600 transition-colors">Specifications</a>
                  <button onClick={() => setView("dashboard")} className="hover:text-cyan-600 transition-colors">Console Preview</button>
                </div>

                <div className="transform skew-x-[20deg] flex items-center">
                  <button 
                    onClick={() => setView("dashboard")} 
                    className="bg-[#ffcb05] hover:bg-[#e0b200] rounded-lg px-5 py-1.5 flex items-center justify-center cursor-pointer transition-colors shadow-sm text-[#2c3238] font-black text-[10px] tracking-wider"
                  >
                    LAUNCH
                  </button>
                </div>
              </div>

              {/* Rightmost trailing cap */}
              <div className="bg-[#7b93b4]/40 w-24 shrink-0" />

            </div>
          </div>
        </header>

        {/* Section 1: Canvas Section (Fits the screen height exactly) */}
        <div ref={scrollContainerRef} className="h-[calc(100vh+4rem)] w-full relative z-10 -mt-16 bg-transparent flex items-center justify-center overflow-hidden">
          {/* The interactive full-viewport Image Sequence canvas */}
          <canvas 
            ref={canvasRef} 
            className="w-full h-full object-cover relative z-0"
          />

          {/* Movie poster style overlay text centered at the bottom */}
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 pointer-events-none select-none z-10 text-center flex flex-col gap-1.5 items-center">
            <h1 
              id="canvas-overlay-text"
              className="text-2xl md:text-3xl font-bold tracking-[0.5em] text-black uppercase select-none transition-all duration-75 font-sans pl-[0.5em]"
              style={{ opacity: 0.9 }}
            >
              SATQUERY
            </h1>
            <span 
              id="canvas-overlay-sub"
              className="text-[9px] font-mono tracking-[0.4em] text-black/60 uppercase select-none transition-all duration-75 pl-[0.4em]"
              style={{ opacity: 0.6 }}
            >
              AGENTIC REMOTE SENSING ENGINE
            </span>
          </div>
        </div>

        {/* Section 2: Hero Content & Dashboard Preview (Scrolls up normally after canvas animation finishes) */}
        <main className="relative z-20 bg-background-primary flex-1 max-w-7xl mx-auto w-full px-6 py-20 flex flex-col gap-24 mt-0">
          
          {/* Section 2.1: Hero Section */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-7 flex flex-col gap-6">
              <div className="flex flex-col gap-3">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 w-max rounded-sm bg-background-secondary border border-border-subtle hud-label text-accent-blue">
                  <span className="w-1.5 h-1.5 bg-accent-blue rounded-full animate-pulse" />
                  SYSTEM LEVEL: OPERATIONAL (AGENTIC VLM)
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-7xl font-extrabold tracking-tighter text-text-primary leading-[1.02]">
                  ASK EARTH.<br />
                  <span className="text-text-secondary font-light tracking-tight">GET THE EVIDENCE.</span>
                </h1>
                <p className="text-sm md:text-base text-text-secondary max-w-xl leading-relaxed mt-2">
                  An agentic vision-language system that reasons over optical, SAR, and time-series satellite imagery to deliver verified spatial answers.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button onClick={() => setView("dashboard")} className="h-11 px-6 text-sm font-mono font-semibold bg-accent-blue hover:bg-accent-blue-light text-white rounded-sm transition-colors flex items-center gap-2">
                  <span>Start Free Analysis</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button onClick={() => setView("dashboard")} className="h-11 px-6 text-sm font-mono font-semibold bg-background-secondary hover:bg-background-tertiary border border-border-subtle hover:border-border-muted text-text-secondary hover:text-text-primary rounded-sm transition-colors">
                  Explore Core Engine
                </button>
              </div>

              {/* Interactive Query Sandbox */}
              <div className="border border-border-subtle bg-background-secondary/90 p-5 rounded-sm flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                  <span className="font-mono text-xs font-semibold text-text-secondary flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-accent-teal" />
                    QUERY SIMULATION SANDBOX
                  </span>
                  <span className="text-[10px] font-mono text-text-muted">PRE-REGISTRATION PREVIEW</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {PRESET_QUERIES.map((q, idx) => (
                    <button
                      key={idx}
                      disabled={isSimulating}
                      onClick={() => handlePresetSelect(idx)}
                      className={`px-3 py-1.5 text-[11px] font-mono rounded-sm border transition-colors ${
                        activeQueryIndex === idx
                          ? "bg-background-tertiary border-accent-blue text-accent-blue-light"
                          : "bg-background-primary border-border-subtle text-text-secondary hover:border-border-muted hover:text-text-primary"
                      }`}
                    >
                      {q.mode}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2">
                  <div className="flex-1 relative flex items-center">
                    <span className="absolute left-3 text-text-muted select-none">
                      <Search className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      value={queryText}
                      readOnly
                      className="w-full h-10 pl-9 pr-4 bg-background-primary border border-border-subtle rounded-sm text-xs font-mono text-text-primary focus:outline-none cursor-default"
                    />
                  </div>
                  <button
                    onClick={startSimulation}
                    disabled={isSimulating}
                    className={`h-10 px-5 font-mono text-xs font-bold rounded-sm border transition-all flex items-center gap-2 ${
                      isSimulating 
                        ? "bg-background-tertiary border-border-subtle text-text-muted cursor-not-allowed" 
                        : "bg-background-tertiary hover:bg-border-muted border-border-muted text-text-primary hover:text-accent-teal"
                    }`}
                  >
                    {isSimulating ? (
                      <>
                        <div className="w-3 h-3 border-2 border-accent-teal border-t-transparent rounded-full animate-spin" />
                        <span>Processing</span>
                      </>
                    ) : (
                      <>
                        <Activity className="w-3.5 h-3.5" />
                        <span>Analyze</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="bg-background-primary border border-border-subtle rounded-sm p-4 h-40 overflow-y-auto font-mono text-[11px] leading-relaxed flex flex-col gap-1.5 scrollbar-thin">
                  {simulationLogs.length === 0 && (
                    <p className="text-text-muted italic self-center my-auto">
                      Click "Analyze" to execute simulated backend orchestration trace...
                    </p>
                  )}
                  {simulationLogs.map((log, index) => (
                    <div key={index} className="flex gap-3">
                      <span className="text-text-muted select-none">[{log.time}]</span>
                      <span className={
                        log.status === "success" ? "text-accent-green-light" :
                        log.status === "running" ? "text-accent-blue-light" :
                        log.status === "info" ? "text-accent-blue-light" :
                        "text-text-primary"
                      }>
                        {log.message}
                      </span>
                    </div>
                  ))}
                  {isSimulating && (
                    <div className="flex items-center gap-1.5 text-text-muted mt-1 select-none animate-pulse">
                      <span className="w-1.5 h-1.5 bg-text-muted rounded-full" />
                      <span>Awaiting task callback...</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Original Satellite Video Box (Sentinel video swath) */}
            <div className="lg:col-span-5 flex items-center justify-center relative">
              <div className="w-full max-w-md aspect-square bg-background-secondary border border-border-subtle rounded-sm p-6 relative flex flex-col justify-between overflow-hidden">
                <div className="absolute top-3 left-3 w-4 h-4 border-t border-l border-border-muted" />
                <div className="absolute top-3 right-3 w-4 h-4 border-t border-r border-border-muted" />
                <div className="absolute bottom-3 left-3 w-4 h-4 border-b border-l border-border-muted" />
                <div className="absolute bottom-3 right-3 w-4 h-4 border-b border-r border-border-muted" />

                <div className="flex items-center justify-between font-mono text-[10px] text-text-muted border-b border-border-subtle/50 pb-2 z-10">
                  <span className="flex items-center gap-1.5">
                    <Compass className="w-3 h-3 text-accent-blue" />
                    SENSOR GRID SWATH
                  </span>
                  <span className="text-accent-teal">ALT: 786KM | INCL: 98.2°</span>
                </div>

                <div className="flex-1 w-full flex items-center justify-center relative my-4 overflow-hidden rounded-sm">
                  <video
                    src="/satellite.mp4"
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover absolute inset-0"
                  />

                  <div className="absolute bottom-2 left-2 z-10 flex flex-col font-mono text-[9px] text-text-secondary bg-background-primary/95 px-2 py-1.5 border border-border-subtle/80 rounded-sm">
                    <span>WGS 84 / EPSG:4326</span>
                    <span className="text-text-primary mt-0.5">LAT: 28.6139° N</span>
                    <span className="text-text-primary">LON: 77.2090° E</span>
                  </div>

                  <div className="absolute top-2 right-2 z-10 flex flex-col font-mono text-[9px] text-text-secondary leading-tight text-right bg-background-primary/95 px-2 py-1.5 border border-border-subtle/80 rounded-sm">
                    <span className="text-accent-teal">SCAN ACTIVE</span>
                    <span className="text-text-primary mt-0.5">RES: 10m / px</span>
                    <span className="text-text-primary">MODE: MSI / SAR</span>
                  </div>
                </div>

                <div className="border-t border-border-subtle/50 pt-2 flex items-center justify-between font-mono text-[9px] text-text-muted">
                  <span>SENSOR: Sentinel-1A / Sentinel-2B Co-pass</span>
                  <span>STATUS: AWAITING_INGEST</span>
                </div>
              </div>
            </div>

          </section>

          {/* Section 2.2: Capabilities */}
          <section id="capabilities" className="flex flex-col gap-12 border-t border-border-subtle pt-16">
            <div className="flex flex-col gap-3">
              <span className="font-mono text-xs text-accent-blue font-semibold uppercase tracking-wider">PRODUCT FEATURES</span>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-text-primary">Multi-Sensor Analytical Modalities</h2>
              <p className="text-sm text-text-secondary max-w-2xl leading-relaxed">
                SatQuery translates raw electromagnetic observations and radar backscatter into queryable vector intelligence without requiring complex desktop GIS setups.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div onClick={() => setView("dashboard")} className="border border-border-subtle hover:border-border-muted bg-background-secondary p-6 rounded-sm flex flex-col justify-between group transition-all duration-300 cursor-pointer">
                <div className="flex flex-col gap-4">
                  <div className="w-10 h-10 rounded-sm bg-background-tertiary border border-border-subtle flex items-center justify-center text-accent-teal">
                    <Eye className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-mono text-sm font-semibold text-text-primary mb-1.5">Single Image Semantics</h3>
                    <p className="text-xs text-text-secondary leading-relaxed">
                      Understand localized land features. Execute VQA, extract object segmentation masks, and generate descriptive scene captions from a single optical or SAR scene.
                    </p>
                  </div>
                </div>
                <div className="border-t border-border-subtle/50 mt-6 pt-4 flex items-center justify-between font-mono text-[10px] text-text-muted group-hover:text-accent-teal transition-colors">
                  <span>VQA & CAPTIONING</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </div>

              <div onClick={() => setView("dashboard")} className="border border-border-subtle hover:border-border-muted bg-background-secondary p-6 rounded-sm flex flex-col justify-between group transition-all duration-300 cursor-pointer">
                <div className="flex flex-col gap-4">
                  <div className="w-10 h-10 rounded-sm bg-background-tertiary border border-border-subtle flex items-center justify-center text-accent-blue">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-mono text-sm font-semibold text-text-primary mb-1.5">Bi-Temporal Tracking</h3>
                    <p className="text-xs text-text-secondary leading-relaxed">
                      Automatically align multi-date satellite acquisitions. Quantify spatial construction increase, track water shrinkage, detect new roadways, and map changes.
                    </p>
                  </div>
                </div>
                <div className="border-t border-border-subtle/50 mt-6 pt-4 flex items-center justify-between font-mono text-[10px] text-text-muted group-hover:text-accent-blue transition-colors">
                  <span>CHANGE MAP GENERATION</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </div>

              <div onClick={() => setView("dashboard")} className="border border-border-subtle hover:border-border-muted bg-background-secondary p-6 rounded-sm flex flex-col justify-between group transition-all duration-300 cursor-pointer">
                <div className="flex flex-col gap-4">
                  <div className="w-10 h-10 rounded-sm bg-background-tertiary border border-border-subtle flex items-center justify-center text-accent-blue">
                    <Sliders className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-mono text-sm font-semibold text-text-primary mb-1.5">Sensor Agreement & Fusion</h3>
                    <p className="text-xs text-text-secondary leading-relaxed">
                      Fuse optical bands with active radar backscatter (SAR). Reconcile atmospheric interference or cloud cover, and cross-validate terrain classification metrics.
                    </p>
                  </div>
                </div>
                <div className="border-t border-border-subtle/50 mt-6 pt-4 flex items-center justify-between font-mono text-[10px] text-text-muted group-hover:text-accent-blue transition-colors">
                  <span>OPTICAL-SAR CONSENSUS</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </div>
          </section>

          {/* Section 2.3: Trust Specs */}
          <section id="how-it-works" className="flex flex-col gap-12 border-t border-border-subtle pt-16">
            <div className="flex flex-col gap-3">
              <span className="font-mono text-xs text-accent-blue font-semibold uppercase tracking-wider">SYSTEM SPECIFICATIONS</span>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-text-primary">Engineered for Real-World Remote Sensing</h2>
              <p className="text-sm text-text-secondary max-w-2xl leading-relaxed">
                Unlike generic vision LLMs, SatQuery utilizes purpose-built spatial adapters trained directly on multispectral bands and raw backscatter tensors.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="border border-border-subtle bg-background-secondary p-5 rounded-sm flex gap-4">
                <div className="text-accent-blue mt-1 shrink-0"><Cpu className="w-5 h-5" /></div>
                <div className="flex flex-col gap-1">
                  <span className="font-mono text-xs font-semibold text-text-primary">Remote Sensing Adapted</span>
                  <p className="text-[11px] text-text-secondary leading-relaxed">Adapters fine-tuned on real remote sensing data (MSI & SAR), preventing hallucinations typical of terrestrial LLMs.</p>
                </div>
              </div>

              <div className="border border-border-subtle bg-background-secondary p-5 rounded-sm flex gap-4">
                <div className="text-accent-teal mt-1 shrink-0"><Database className="w-5 h-5" /></div>
                <div className="flex flex-col gap-1">
                  <span className="font-mono text-xs font-semibold text-text-primary">Raster Engine Core</span>
                  <p className="text-[11px] text-text-secondary leading-relaxed">Support for raw GeoTIFF format files, extracting real geospatial metadata, CRS coordinate boundaries, and resolution parameters.</p>
                </div>
              </div>

              <div className="border border-border-subtle bg-background-secondary p-5 rounded-sm flex gap-4">
                <div className="text-accent-green mt-1 shrink-0"><Shield className="w-5 h-5" /></div>
                <div className="flex flex-col gap-1">
                  <span className="font-mono text-xs font-semibold text-text-primary">Evidence-Grounded Answers</span>
                  <p className="text-[11px] text-text-secondary leading-relaxed">Every textual prediction aligns directly with geographic coordinate shapes, pixel-level masks, or localized bounding boxes.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 2.4: Hackathon Specs */}
          <section id="specifications" className="border border-border-subtle bg-background-secondary p-6 rounded-sm flex flex-col gap-4">
            <div className="flex items-center gap-2 text-accent-amber font-mono text-xs font-semibold">
              <Info className="w-4 h-4" />
              <span>DEVELOPER SPECIFICATIONS & LOGISTICAL BOUNDS</span>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              SatQuery is engineered in accordance with Smart India Hackathon criteria. The models register real-time coordinate transformations using 
              <code className="text-accent-teal bg-background-primary px-1 py-0.5 rounded-sm mx-1">rasterio</code> 
              and <code className="text-accent-teal bg-background-primary px-1 py-0.5 rounded-sm mx-1">GDAL</code>, 
              producing direct PNG representations of coordinate masks overlayed directly over interactive base maps. 
              All confidence scores are compiled from model cross-entropies and band coverage ratios.
            </p>
          </section>

        </main>

        {/* Footer */}
        <footer className="border-t border-border-subtle bg-background-secondary py-12 relative z-10 w-full shrink-0">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 flex items-center justify-center border border-accent-blue/40 rounded-sm"><div className="w-1.5 h-1.5 bg-accent-blue" /></div>
                <span className="font-mono text-sm font-bold tracking-wider text-text-primary">SATQUERY.AI</span>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed max-w-xs">
                Next-generation remote sensing intelligence. Agentic visual validation for multispectral earth observation.
              </p>
            </div>
            <div className="flex flex-col gap-3 font-mono text-xs">
              <span className="text-text-primary font-semibold">SPECIFICATIONS</span>
              <button onClick={() => setView("dashboard")} className="text-left text-text-secondary hover:text-text-primary">VQA Grounding</button>
              <button onClick={() => setView("dashboard")} className="text-left text-text-secondary hover:text-text-primary">Change Verification</button>
            </div>
            <div className="flex flex-col gap-3 font-mono text-xs">
              <span className="text-text-primary font-semibold">RESOURCES</span>
              <a href="https://github.com" target="_blank" rel="noreferrer" className="text-text-secondary hover:text-text-primary">API Reference</a>
              <a href="https://github.com" target="_blank" rel="noreferrer" className="text-text-secondary hover:text-text-primary">Open Docs</a>
            </div>
            <div className="flex flex-col gap-3 font-mono text-xs">
              <span className="text-text-primary font-semibold">COMPLIANCE</span>
              <span className="text-text-secondary">WGS-84 Coordinate Standard</span>
              <span className="text-text-secondary">Smart India Hackathon 2026</span>
            </div>
          </div>
          <div className="max-w-7xl mx-auto px-6 border-t border-border-subtle/50 mt-8 pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-mono text-text-muted">
            <span>© 2026 SATQUERY AI. ALL RIGHTS RESERVED.</span>
            <span>BUILT FOR PREMIUM GEOSPATIAL ANALYSIS AND RESEARCH</span>
          </div>
        </footer>
      </div>
    );
  }

  // Render Console Application Shell (Dashboard, Workspace, History)
  return (
    <div className="h-screen bg-background-primary flex overflow-hidden">
      
      {/* SIDEBAR NAVIGATION - Responsive */}
      <aside className={`w-64 bg-[#1c2a20] text-slate-300 flex flex-col justify-between shrink-0 z-20 transition-all duration-300 lg:static absolute top-0 bottom-0 left-0 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      }`}>
        
        {/* Top Logo Section */}
        <div className="p-5 border-b border-[#2c3f31] flex flex-col text-left">
          <span className="font-sans text-lg font-bold tracking-tight text-white leading-none">
            SatQuery AI
          </span>
          <span className="text-[9px] text-slate-400 font-mono tracking-tighter mt-1.5 leading-none">
            Ask. Analyze. Understand Earth.
          </span>
        </div>

        {/* Navigation Group */}
        <div className="flex-1 overflow-y-auto px-4 py-5 flex flex-col gap-6 scrollbar-thin">
          
          {/* NAVIGATION section */}
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-bold text-slate-500 tracking-wider uppercase px-3 mb-1.5">
              NAVIGATION
            </span>
            
            {[
              { name: "Dashboard", view: "dashboard", icon: LayoutDashboard },
              { name: "New Analysis", view: "workspace", mode: "change", icon: PlusSquare },
              { name: "Ask the Map", view: "workspace", mode: "single", icon: Search },
              { name: "History", view: "history", icon: Clock },
              { name: "Datasets", view: "history", icon: Database },
              { name: "Reports", view: "history", icon: FileBarChart },
              { name: "Settings", view: "dashboard", icon: Settings },
              { name: "Help & Support", view: "dashboard", icon: HelpCircle },
            ].map((item, idx) => {
              const Icon = item.icon;
              const isActive = (item.view === view) && (!item.mode || workspaceMode === item.mode);
              return (
                <button
                  key={idx}
                  onClick={() => {
                    setView(item.view as any);
                    if (item.mode) setWorkspaceMode(item.mode as any);
                    setSidebarOpen(false);
                  }}
                  className={`w-full h-8.5 px-3 text-xs font-semibold rounded-lg transition-all flex items-center gap-2.5 ${
                    isActive
                      ? "bg-accent-terracotta/15 border border-accent-terracotta/30 text-white font-bold"
                      : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? "text-accent-terracotta-light" : ""}`} />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </div>

          {/* TOOLS section */}
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-bold text-slate-500 tracking-wider uppercase px-3 mb-1.5">
              TOOLS
            </span>
            
            {[
              { name: "VQA (Ask)", view: "workspace", mode: "single", icon: MessageSquare },
              { name: "Captioning", view: "workspace", mode: "single", icon: FileText },
              { name: "Grounding", view: "workspace", mode: "single", icon: Globe },
              { name: "Change Detection", view: "workspace", mode: "change", icon: Layers },
              { name: "Optical + SAR", view: "workspace", mode: "fusion", icon: Sliders },
              { name: "Land Cover", view: "workspace", mode: "single", icon: Compass },
            ].map((item, idx) => {
              const Icon = item.icon;
              // Make highlight match active tools
              const isActive = (view === "workspace") && (workspaceMode === item.mode);
              return (
                <button
                  key={idx}
                  onClick={() => {
                    setView("workspace");
                    setWorkspaceMode(item.mode as any);
                    setSidebarOpen(false);
                  }}
                  className={`w-full h-8.5 px-3 text-xs font-semibold rounded-lg transition-all flex items-center gap-2.5 ${
                    isActive
                      ? "bg-accent-terracotta/15 border border-accent-terracotta/30 text-white font-bold"
                      : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? "text-accent-terracotta-light" : ""}`} />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </div>

        </div>

        {/* Sidebar Footer - System Status */}
        <div className="p-4 border-t border-[#2c3f31] flex flex-col gap-3.5 bg-[#131d16]">
          <div className="flex items-center gap-2 px-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <div className="flex flex-col text-left">
              <span className="text-[10px] font-bold text-white leading-tight">System Status</span>
              <span className="text-[9px] text-green-400 leading-tight">All Systems Operational</span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 font-mono text-[9px] text-slate-400 px-1">
            <div className="flex justify-between">
              <span>Models Online</span>
              <span className="text-white font-bold">8/8</span>
            </div>
            <div className="flex justify-between">
              <span>Storage Used</span>
              <span className="text-white font-bold">24.6 GB</span>
            </div>
            <div className="flex justify-between">
              <span>Jobs Running</span>
              <span className="text-white font-bold">2</span>
            </div>
          </div>

          <button
            onClick={() => { setView("dashboard"); setSidebarOpen(false); }}
            className="w-full h-8 border border-accent-terracotta/40 hover:bg-accent-terracotta/10 text-accent-terracotta-light hover:text-white rounded-lg text-[10px] font-bold tracking-wider uppercase transition-all"
          >
            View System Health
          </button>
        </div>

      </aside>

      {/* Backdrop for mobile menu */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          className="absolute inset-0 bg-[#080d0a]/60 backdrop-blur-xs lg:hidden z-10" 
        />
      )}

      {/* View render hub */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        
        {/* Mobile Top Bar */}
        <div className="h-14 border-b border-border-subtle flex items-center justify-between px-4 lg:hidden shrink-0 bg-white z-10">
          <button 
            onClick={() => setSidebarOpen(prev => !prev)}
            className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-slate-100 border border-border-subtle rounded-md transition-colors"
          >
            {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
          
          <div className="flex items-center" onClick={() => setView("landing")}>
            <span className="font-sans text-xs font-bold text-text-primary">SatQuery AI</span>
          </div>
          
          <div className="w-7 h-7 rounded-full bg-accent-purple/10 text-accent-purple font-bold flex items-center justify-center text-[10px] border border-accent-purple/20">
            U
          </div>
        </div>

        {view === "dashboard" && (
          <Dashboard 
            analyses={analyses}
            onStartAnalysis={handleStartAnalysis}
            onSelectAnalysis={handleSelectAnalysis}
            onDeleteAnalysis={handleDeleteAnalysis}
          />
        )}

        {view === "workspace" && (
          <AnalysisWorkspace 
            initialMode={workspaceMode}
            onBackToDashboard={() => setView("dashboard")}
            onSaveAnalysis={handleSaveAnalysis}
          />
        )}

        {view === "history" && (
          <HistoryReports 
            analyses={analyses}
            selectedAnalysisId={selectedAnalysisId}
            onSelectAnalysis={setSelectedAnalysisId}
            onDeleteAnalysis={handleDeleteAnalysis}
          />
        )}
      </div>

    </div>
  );
}
