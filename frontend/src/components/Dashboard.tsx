"use client";

import React, { useRef } from "react";
import { 
  BookOpen,
  Bell,
  Upload,
  ChevronRight,
  Eye,
  Layers,
  Sliders,
  MapPin,
  Database,
  Clock,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Info,
  CheckCircle2,
  FileText,
  MessageSquare,
  Sparkles,
  Activity
} from "lucide-react";

interface DashboardProps {
  analyses: any[];
  onStartAnalysis: (mode: "single" | "change" | "fusion") => void;
  onSelectAnalysis: (id: string) => void;
  onDeleteAnalysis: (id: string) => void;
}

export default function Dashboard({
  analyses,
  onStartAnalysis,
  onSelectAnalysis,
  onDeleteAnalysis
}: DashboardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Example questions handler
  const handleExampleClick = (question: string) => {
    // Determine the mode based on the question
    if (question.includes("increased") || question.includes("changed")) {
      onStartAnalysis("change");
    } else if (question.includes("Optical") || question.includes("SAR")) {
      onStartAnalysis("fusion");
    } else {
      onStartAnalysis("single");
    }
  };

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Transition to single-image mode by default when a file is selected
      onStartAnalysis("single");
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full bg-slate-50/50">
      
      {/* Top Header / Welcome Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border-subtle pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-text-primary">
            Welcome back, User! 👋
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            What would you like to analyze today?
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="h-9 px-4 text-xs font-semibold bg-white hover:bg-slate-50 text-text-primary border border-border-subtle rounded-lg shadow-xs transition-all flex items-center gap-2">
            <BookOpen className="w-3.5 h-3.5 text-accent-blue" />
            <span>Quick Start Guide</span>
          </button>
          
          <button className="relative p-2.5 text-text-secondary hover:text-text-primary hover:bg-slate-100 rounded-full border border-border-subtle bg-white shadow-xs transition-all">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-[9px] font-bold text-white rounded-full flex items-center justify-center border-2 border-white shadow-sm animate-pulse">
              3
            </span>
          </button>
          
          <div className="h-8 w-px bg-border-subtle" />
          
          <div className="flex items-center gap-3 pl-1">
            <div className="w-9 h-9 bg-accent-purple/10 text-accent-purple font-bold rounded-full flex items-center justify-center text-sm border border-accent-purple/20 shadow-xs">
              U
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xs font-bold text-text-primary leading-tight">User</span>
              <span className="text-[10px] text-text-muted leading-tight">Standard Plan</span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 1 Grid: Start Analysis & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Start a New Analysis */}
        <div className="lg:col-span-8 border border-border-subtle bg-white rounded-xl p-5 shadow-xs flex flex-col gap-4">
          <div>
            <h2 className="font-bold text-base text-text-primary">Start a New Analysis</h2>
            <p className="text-xs text-text-secondary mt-0.5">Upload your satellite data and ask anything about it.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            {/* File Dropzone / Upload Box */}
            <div 
              onClick={handleUploadClick}
              className="border-2 border-dashed border-border-muted hover:border-accent-blue bg-slate-50/50 hover:bg-slate-50/80 rounded-xl p-6 flex flex-col items-center justify-center gap-3 text-center cursor-pointer transition-all duration-200 group"
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".tif,.tiff,.png,.jpg,.jpeg"
                onChange={handleFileChange}
              />
              <div className="w-12 h-12 rounded-full bg-accent-blue/10 flex items-center justify-center text-accent-blue group-hover:scale-105 transition-transform duration-200">
                <Upload className="w-5 h-5" />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-text-primary">
                  Drag & drop your files here
                </span>
                <span className="text-[10px] text-text-muted">or</span>
                <span className="px-4 py-1.5 bg-accent-blue hover:bg-accent-blue-dark text-white font-semibold text-xs rounded-md shadow-xs transition-colors mt-1 inline-block mx-auto">
                  Browse Files
                </span>
              </div>
              <p className="text-[9px] text-text-muted mt-2 border-t border-border-subtle/50 pt-2 w-full">
                Supported: GeoTIFF, TIFF • Max size: 2 GB per file
              </p>
            </div>

            {/* Example Questions */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-bold text-text-muted tracking-wider uppercase mb-1">Try example questions</span>
              
              <div className="flex flex-col gap-2 flex-1 justify-between">
                {[
                  "What is present in this area?",
                  "Where are the water bodies?",
                  "Has the built-up area increased?",
                  "What changed between these images?",
                  "Use Optical and SAR to detect flood areas."
                ].map((question, qIdx) => (
                  <button
                    key={qIdx}
                    onClick={() => handleExampleClick(question)}
                    className="flex items-center justify-between p-2.5 px-3 border border-border-subtle bg-white hover:bg-slate-50 hover:border-border-muted rounded-lg cursor-pointer transition-colors text-left text-xs font-medium text-text-secondary hover:text-text-primary"
                  >
                    <span>{question}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-text-muted" />
                  </button>
                ))}
                
                <button 
                  onClick={() => onStartAnalysis("single")}
                  className="text-xs font-bold text-accent-blue hover:text-accent-blue-dark flex items-center gap-1 mt-1 transition-colors"
                >
                  <span>View all examples</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="lg:col-span-4 border border-border-subtle bg-white rounded-xl p-5 shadow-xs flex flex-col gap-4">
          <h2 className="font-bold text-base text-text-primary">Quick Actions</h2>
          
          <div className="grid grid-cols-2 gap-3 flex-1">
            <button 
              onClick={() => onStartAnalysis("single")}
              className="flex flex-col items-center justify-center p-3 border border-border-subtle bg-slate-50/50 hover:bg-white hover:border-accent-blue/30 rounded-xl text-center cursor-pointer transition-all hover:shadow-md group"
            >
              <div className="w-9 h-9 rounded-lg bg-white border border-border-subtle flex items-center justify-center text-accent-purple mb-2 group-hover:text-accent-blue transition-colors shadow-xs">
                <Eye className="w-4.5 h-4.5" />
              </div>
              <span className="text-[10px] font-bold text-text-secondary group-hover:text-text-primary leading-tight">
                Single Image Analysis
              </span>
            </button>

            <button 
              onClick={() => onStartAnalysis("change")}
              className="flex flex-col items-center justify-center p-3 border border-border-subtle bg-slate-50/50 hover:bg-white hover:border-accent-blue/30 rounded-xl text-center cursor-pointer transition-all hover:shadow-md group"
            >
              <div className="w-9 h-9 rounded-lg bg-white border border-border-subtle flex items-center justify-center text-accent-green mb-2 group-hover:text-accent-blue transition-colors shadow-xs">
                <Layers className="w-4.5 h-4.5" />
              </div>
              <span className="text-[10px] font-bold text-text-secondary group-hover:text-text-primary leading-tight">
                Change Detection
              </span>
            </button>

            <button 
              onClick={() => onStartAnalysis("fusion")}
              className="flex flex-col items-center justify-center p-3 border border-border-subtle bg-slate-50/50 hover:bg-white hover:border-accent-blue/30 rounded-xl text-center cursor-pointer transition-all hover:shadow-md group"
            >
              <div className="w-9 h-9 rounded-lg bg-white border border-border-subtle flex items-center justify-center text-accent-blue mb-2 group-hover:text-accent-blue transition-colors shadow-xs">
                <Sliders className="w-4.5 h-4.5" />
              </div>
              <span className="text-[10px] font-bold text-text-secondary group-hover:text-text-primary leading-tight">
                Optical + SAR Analysis
              </span>
            </button>

            <button 
              onClick={() => onStartAnalysis("single")}
              className="flex flex-col items-center justify-center p-3 border border-border-subtle bg-slate-50/50 hover:bg-white hover:border-accent-blue/30 rounded-xl text-center cursor-pointer transition-all hover:shadow-md group"
            >
              <div className="w-9 h-9 rounded-lg bg-white border border-border-subtle flex items-center justify-center text-accent-amber mb-2 group-hover:text-accent-blue transition-colors shadow-xs">
                <MapPin className="w-4.5 h-4.5" />
              </div>
              <span className="text-[10px] font-bold text-text-secondary group-hover:text-text-primary leading-tight">
                Ask the Map
              </span>
            </button>

            <button 
              onClick={handleUploadClick}
              className="flex flex-col items-center justify-center p-3 border border-border-subtle bg-slate-50/50 hover:bg-white hover:border-accent-blue/30 rounded-xl text-center cursor-pointer transition-all hover:shadow-md group"
            >
              <div className="w-9 h-9 rounded-lg bg-white border border-border-subtle flex items-center justify-center text-accent-teal mb-2 group-hover:text-accent-blue transition-colors shadow-xs">
                <Database className="w-4.5 h-4.5" />
              </div>
              <span className="text-[10px] font-bold text-text-secondary group-hover:text-text-primary leading-tight">
                Upload Dataset
              </span>
            </button>

            <button 
              onClick={() => onSelectAnalysis(analyses[0]?.id || "analysis-1")}
              className="flex flex-col items-center justify-center p-3 border border-border-subtle bg-slate-50/50 hover:bg-white hover:border-accent-blue/30 rounded-xl text-center cursor-pointer transition-all hover:shadow-md group"
            >
              <div className="w-9 h-9 rounded-lg bg-white border border-border-subtle flex items-center justify-center text-accent-red mb-2 group-hover:text-accent-blue transition-colors shadow-xs">
                <Clock className="w-4.5 h-4.5" />
              </div>
              <span className="text-[10px] font-bold text-text-secondary group-hover:text-text-primary leading-tight">
                View History
              </span>
            </button>
          </div>
        </div>

      </div>

      {/* Row 2 Grid: Recent Analyses & Activity Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Recent Analyses list */}
        <div className="lg:col-span-8 border border-border-subtle bg-white rounded-xl p-5 shadow-xs flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-border-subtle pb-3">
            <h2 className="font-bold text-base text-text-primary">Recent Analyses</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Analysis 1: Urban Expansion */}
            <div 
              onClick={() => onSelectAnalysis("analysis-1")}
              className="border border-border-subtle bg-white hover:bg-slate-50/50 hover:border-border-muted hover:shadow-sm rounded-xl p-3 flex flex-col gap-3 transition-all duration-200 cursor-pointer group"
            >
              {/* Custom CSS Split Mockup Image */}
              <div className="w-full h-28 rounded-lg border border-border-subtle overflow-hidden flex relative">
                <div className="flex-1 bg-[#374e3d] flex items-center justify-center relative">
                  <span className="absolute top-2 left-2 px-1 bg-black/40 text-[7px] font-bold text-white tracking-widest rounded-sm">BEFORE</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-yellow-600/30 absolute top-4 left-6" />
                  <div className="w-3 h-2 rounded-sm bg-slate-500/20 absolute bottom-6 right-8" />
                  <div className="w-6 h-1 bg-[#28382c] absolute top-10 right-4" />
                </div>
                <div className="w-0.5 bg-white/70 h-full z-10" />
                <div className="flex-1 bg-[#476650] flex items-center justify-center relative">
                  <span className="absolute top-2 right-2 px-1 bg-black/40 text-[7px] font-bold text-white tracking-widest rounded-sm">AFTER</span>
                  <div className="w-2.5 h-2 rounded-xs bg-[#c2a278] absolute top-5 left-4 border border-white/20" />
                  <div className="w-3.5 h-3 rounded-xs bg-[#c2a278] absolute bottom-4 right-6 border border-white/20" />
                  <div className="w-2.5 h-2 rounded-xs bg-[#c2a278] absolute top-12 right-10 border border-white/20" />
                  <div className="w-6 h-1 bg-slate-600/40 absolute top-10 left-1" />
                </div>
              </div>
              
              <div className="flex flex-col gap-1.5">
                <h3 className="font-bold text-xs text-text-primary leading-tight group-hover:text-accent-blue transition-colors">
                  Urban Expansion Analysis
                </h3>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-text-muted font-medium">20 May 2024 • 2 Images</span>
                  <span className="px-1.5 py-0.5 text-[9px] font-bold bg-green-50 border border-green-200/50 text-accent-green-light rounded-md">
                    Completed
                  </span>
                </div>
              </div>
              <div className="border-t border-border-subtle/50 pt-2 flex items-center justify-between text-[10px] font-bold text-accent-blue group-hover:text-accent-blue-dark">
                <span>View Results</span>
                <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
              </div>
            </div>

            {/* Analysis 2: Flood Detection */}
            <div 
              onClick={() => onSelectAnalysis("analysis-2")}
              className="border border-border-subtle bg-white hover:bg-slate-50/50 hover:border-border-muted hover:shadow-sm rounded-xl p-3 flex flex-col gap-3 transition-all duration-200 cursor-pointer group"
            >
              {/* Custom Optical / SAR Mockup Image */}
              <div className="w-full h-28 rounded-lg border border-border-subtle overflow-hidden flex relative">
                <div className="flex-1 bg-[#3a586e] flex items-center justify-center relative">
                  <span className="absolute top-2 left-2 px-1 bg-black/40 text-[7px] font-bold text-white tracking-widest rounded-sm">OPTICAL</span>
                  <div className="w-6 h-6 rounded-full bg-blue-600/40 absolute top-6 right-3 blur-xs" />
                  <div className="w-3 h-8 bg-green-900/20 absolute bottom-1 left-2 rounded-full" />
                </div>
                <div className="w-0.5 bg-white/70 h-full z-10" />
                <div className="flex-1 bg-[#231533] flex items-center justify-center relative">
                  <span className="absolute top-2 right-2 px-1 bg-black/40 text-[7px] font-bold text-white tracking-widest rounded-sm">SAR</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 absolute top-5 left-5 shadow-[0_0_6px_#22d3ee]" />
                  <div className="w-2 h-2 rounded-full bg-cyan-400 absolute bottom-6 right-4 shadow-[0_0_6px_#22d3ee]" />
                  <div className="w-1 h-1 rounded-full bg-cyan-500 absolute top-12 right-12" />
                </div>
              </div>
              
              <div className="flex flex-col gap-1.5">
                <h3 className="font-bold text-xs text-text-primary leading-tight group-hover:text-accent-blue transition-colors">
                  Flood Detection (Optical + SAR)
                </h3>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-text-muted font-medium">18 May 2024 • 2 Images</span>
                  <span className="px-1.5 py-0.5 text-[9px] font-bold bg-green-50 border border-green-200/50 text-accent-green-light rounded-md">
                    Completed
                  </span>
                </div>
              </div>
              <div className="border-t border-border-subtle/50 pt-2 flex items-center justify-between text-[10px] font-bold text-accent-blue group-hover:text-accent-blue-dark">
                <span>View Results</span>
                <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
              </div>
            </div>

            {/* Analysis 3: Vegetation Change */}
            <div 
              onClick={() => onSelectAnalysis("analysis-3")}
              className="border border-border-subtle bg-white hover:bg-slate-50/50 hover:border-border-muted hover:shadow-sm rounded-xl p-3 flex flex-col gap-3 transition-all duration-200 cursor-pointer group"
            >
              {/* Custom Change Map Mockup Image */}
              <div className="w-full h-28 rounded-lg border border-border-subtle overflow-hidden relative bg-[#1e2e21] flex items-center justify-center">
                <span className="absolute top-2 left-2 px-1 bg-black/40 text-[7px] font-bold text-white tracking-widest rounded-sm">CHANGE MAP</span>
                <div className="w-8 h-8 rounded-full bg-green-500/30 absolute top-4 left-4" />
                <div className="w-10 h-6 bg-red-500/40 absolute bottom-6 right-2 rounded-full transform rotate-12" />
                <div className="w-4 h-4 bg-red-500/30 absolute top-8 right-12 rounded-full" />
                <div className="w-6 h-6 bg-green-500/20 absolute bottom-2 left-10 rounded-full" />
              </div>
              
              <div className="flex flex-col gap-1.5">
                <h3 className="font-bold text-xs text-text-primary leading-tight group-hover:text-accent-blue transition-colors">
                  Vegetation Change Detection
                </h3>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-text-muted font-medium">15 May 2024 • 2 Images</span>
                  <span className="px-1.5 py-0.5 text-[9px] font-bold bg-green-50 border border-green-200/50 text-accent-green-light rounded-md">
                    Completed
                  </span>
                </div>
              </div>
              <div className="border-t border-border-subtle/50 pt-2 flex items-center justify-between text-[10px] font-bold text-accent-blue group-hover:text-accent-blue-dark">
                <span>View Results</span>
                <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
              </div>
            </div>

          </div>
        </div>

        {/* Activity Overview */}
        <div className="lg:col-span-4 border border-border-subtle bg-white rounded-xl p-5 shadow-xs flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h2 className="font-bold text-base text-text-primary">Activity Overview</h2>
            <select className="text-[10px] font-bold text-text-secondary border border-border-subtle rounded-md px-2 py-1 bg-white focus:outline-none cursor-pointer">
              <option>This Month</option>
              <option>This Week</option>
              <option>This Year</option>
            </select>
          </div>

          <div className="flex flex-col gap-3.5 flex-1 justify-center">
            
            {/* Metric 1 */}
            <div className="flex justify-between items-center p-1.5 px-2 hover:bg-slate-50 rounded-lg transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-accent-blue/10 flex items-center justify-center text-accent-blue shadow-xs">
                  <Activity className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-text-secondary">Analyses Run</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-text-primary">24</span>
                <span className="flex items-center gap-0.5 text-[9px] font-bold text-accent-green-light bg-green-50 px-1.5 py-0.5 rounded-md border border-green-200/30">
                  <TrendingUp className="w-2.5 h-2.5" />
                  <span>+33%</span>
                </span>
              </div>
            </div>

            {/* Metric 2 */}
            <div className="flex justify-between items-center p-1.5 px-2 hover:bg-slate-50 rounded-lg transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-accent-teal/10 flex items-center justify-center text-accent-teal shadow-xs">
                  <Database className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-text-secondary">Data Processed</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-text-primary">18.7 GB</span>
                <span className="flex items-center gap-0.5 text-[9px] font-bold text-accent-green-light bg-green-50 px-1.5 py-0.5 rounded-md border border-green-200/30">
                  <TrendingUp className="w-2.5 h-2.5" />
                  <span>+28%</span>
                </span>
              </div>
            </div>

            {/* Metric 3 */}
            <div className="flex justify-between items-center p-1.5 px-2 hover:bg-slate-50 rounded-lg transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-accent-purple/10 flex items-center justify-center text-accent-purple shadow-xs">
                  <Layers className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-text-secondary">Change Maps</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-text-primary">12</span>
                <span className="flex items-center gap-0.5 text-[9px] font-bold text-accent-green-light bg-green-50 px-1.5 py-0.5 rounded-md border border-green-200/30">
                  <TrendingUp className="w-2.5 h-2.5" />
                  <span>+50%</span>
                </span>
              </div>
            </div>

            {/* Metric 4 */}
            <div className="flex justify-between items-center p-1.5 px-2 hover:bg-slate-50 rounded-lg transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-accent-amber/10 flex items-center justify-center text-accent-amber shadow-xs">
                  <FileText className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-text-secondary">Reports</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-text-primary">8</span>
                <span className="flex items-center gap-0.5 text-[9px] font-bold text-accent-green-light bg-green-50 px-1.5 py-0.5 rounded-md border border-green-200/30">
                  <TrendingUp className="w-2.5 h-2.5" />
                  <span>+14%</span>
                </span>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Row 3 Grid: How It Works & Recent Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* How It Works workflow */}
        <div className="lg:col-span-8 border border-border-subtle bg-white rounded-xl p-5 shadow-xs flex flex-col gap-4 justify-between">
          <h2 className="font-bold text-base text-text-primary">How It Works</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 relative py-2">
            
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center p-3 bg-slate-50/50 rounded-xl relative group">
              <div className="absolute -top-2.5 left-4 w-5.5 h-5.5 rounded-full bg-accent-blue text-white flex items-center justify-center text-[10px] font-black border-2 border-white shadow-sm font-mono">
                1
              </div>
              <div className="w-10 h-10 rounded-xl bg-white border border-border-subtle flex items-center justify-center text-accent-blue shadow-xs mb-3 group-hover:scale-105 transition-transform duration-200">
                <Upload className="w-4.5 h-4.5" />
              </div>
              <span className="text-xs font-bold text-text-primary mb-1">Upload Data</span>
              <p className="text-[10px] text-text-secondary leading-normal">Add your satellite images</p>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center text-center p-3 bg-slate-50/50 rounded-xl relative group">
              <div className="absolute -top-2.5 left-4 w-5.5 h-5.5 rounded-full bg-accent-blue text-white flex items-center justify-center text-[10px] font-black border-2 border-white shadow-sm font-mono">
                2
              </div>
              <div className="w-10 h-10 rounded-xl bg-white border border-border-subtle flex items-center justify-center text-accent-purple shadow-xs mb-3 group-hover:scale-105 transition-transform duration-200">
                <MessageSquare className="w-4.5 h-4.5" />
              </div>
              <span className="text-xs font-bold text-text-primary mb-1">Ask Question</span>
              <p className="text-[10px] text-text-secondary leading-normal">Type your question in natural language</p>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center text-center p-3 bg-slate-50/50 rounded-xl relative group">
              <div className="absolute -top-2.5 left-4 w-5.5 h-5.5 rounded-full bg-accent-blue text-white flex items-center justify-center text-[10px] font-black border-2 border-white shadow-sm font-mono">
                3
              </div>
              <div className="w-10 h-10 rounded-xl bg-white border border-border-subtle flex items-center justify-center text-accent-teal shadow-xs mb-3 group-hover:scale-105 transition-transform duration-200">
                <Sparkles className="w-4.5 h-4.5" />
              </div>
              <span className="text-xs font-bold text-text-primary mb-1">AI Analyzes</span>
              <p className="text-[10px] text-text-secondary leading-normal">Our AI selects the right models & tools</p>
            </div>

            {/* Step 4 */}
            <div className="flex flex-col items-center text-center p-3 bg-slate-50/50 rounded-xl relative group">
              <div className="absolute -top-2.5 left-4 w-5.5 h-5.5 rounded-full bg-accent-blue text-white flex items-center justify-center text-[10px] font-black border-2 border-white shadow-sm font-mono">
                4
              </div>
              <div className="w-10 h-10 rounded-xl bg-white border border-border-subtle flex items-center justify-center text-accent-green mb-3 group-hover:scale-105 transition-transform duration-200">
                <Sliders className="w-4.5 h-4.5" />
              </div>
              <span className="text-xs font-bold text-text-primary mb-1">Get Results</span>
              <p className="text-[10px] text-text-secondary leading-normal">View answer with evidence on map</p>
            </div>

          </div>
        </div>

        {/* Recent Alerts */}
        <div className="lg:col-span-4 border border-border-subtle bg-white rounded-xl p-5 shadow-xs flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h2 className="font-bold text-base text-text-primary">Recent Alerts</h2>
            <button className="text-xs font-bold text-accent-blue hover:text-accent-blue-dark transition-colors">
              View all
            </button>
          </div>

          <div className="flex flex-col gap-3">
            
            {/* Alert 1 */}
            <div className="flex gap-3 p-2 bg-amber-50/50 border border-amber-200/30 rounded-xl transition-all">
              <div className="w-7 h-7 rounded-lg bg-white border border-amber-200/50 flex items-center justify-center text-amber-500 shadow-xs shrink-0">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div className="flex flex-col flex-1 text-left justify-center min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-text-primary truncate leading-tight">Large change detected</span>
                  <span className="text-[9px] text-text-muted shrink-0 font-medium font-mono">10m ago</span>
                </div>
                <span className="text-[10px] text-text-secondary truncate mt-0.5">Built-up area increased in selected region</span>
              </div>
            </div>

            {/* Alert 2 */}
            <div className="flex gap-3 p-2 bg-blue-50/50 border border-blue-200/30 rounded-xl transition-all">
              <div className="w-7 h-7 rounded-lg bg-white border border-blue-200/50 flex items-center justify-center text-accent-blue shadow-xs shrink-0">
                <Info className="w-4 h-4" />
              </div>
              <div className="flex flex-col flex-1 text-left justify-center min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-text-primary truncate leading-tight">New dataset available</span>
                  <span className="text-[9px] text-text-muted shrink-0 font-medium font-mono">2h ago</span>
                </div>
                <span className="text-[10px] text-text-secondary truncate mt-0.5">Sentinel-2 imagery for your area</span>
              </div>
            </div>

            {/* Alert 3 */}
            <div className="flex gap-3 p-2 bg-green-50/50 border border-green-200/30 rounded-xl transition-all">
              <div className="w-7 h-7 rounded-lg bg-white border border-green-200/50 flex items-center justify-center text-accent-green-light shadow-xs shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="flex flex-col flex-1 text-left justify-center min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-text-primary truncate leading-tight">Analysis completed</span>
                  <span className="text-[9px] text-text-muted shrink-0 font-medium font-mono">3h ago</span>
                </div>
                <span className="text-[10px] text-text-secondary truncate mt-0.5">Urban Expansion Analysis</span>
              </div>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
