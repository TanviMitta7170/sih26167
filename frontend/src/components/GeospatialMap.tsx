"use client";

import React, { useRef, useState, useEffect } from "react";
import { 
  Maximize2, 
  Layers, 
  Map as MapIcon, 
  MousePointer, 
  Square, 
  ZoomIn, 
  ZoomOut, 
  RefreshCw,
  SlidersHorizontal
} from "lucide-react";

interface GeospatialMapProps {
  beforeImage: string | null; // URL of preview image
  afterImage: string | null;  // URL of preview image
  beforeBounds: any | null;   // { west, south, east, north }
  afterBounds: any | null;    // { west, south, east, north }
  analysisResult: any | null; // GeoJSON style coordinates
  activeTab: "map" | "split" | "swipe" | "change";
  onAoiSelect: (bounds: { minLat: number; maxLat: number; minLon: number; maxLon: number; areaKm2: number } | null) => void;
  selectedAoi: { minLat: number; maxLat: number; minLon: number; maxLon: number; areaKm2: number } | null;
}

export default function GeospatialMap({
  beforeImage,
  afterImage,
  beforeBounds,
  afterBounds,
  analysisResult,
  activeTab,
  onAoiSelect,
  selectedAoi
}: GeospatialMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapDivRef = useRef<HTMLDivElement>(null);
  
  // Leaflet references
  const mapRef = useRef<any>(null);
  const LRef = useRef<any>(null);
  const beforeOverlayRef = useRef<any>(null);
  const afterOverlayRef = useRef<any>(null);
  const maskLayerGroupRef = useRef<any>(null);
  const aoiLayerRef = useRef<any>(null);

  // States
  const [cursorCoords, setCursorCoords] = useState({ lat: 28.6139, lon: 77.2090 });
  const [drawMode, setDrawMode] = useState<"pan" | "aoi">("pan");
  const [swipeX, setSwipeX] = useState(50);
  const [isDraggingSwipe, setIsDraggingSwipe] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [basemap, setBasemap] = useState<"satellite" | "hybrid" | "terrain" | "streets">("satellite");

  // Layer visibility
  const [opacityBefore, setOpacityBefore] = useState(100);
  const [opacityAfter, setOpacityAfter] = useState(100);
  const [showChangeMask, setShowChangeMask] = useState(true);

  // Initialize Map
  useEffect(() => {
    if (typeof window === "undefined" || !mapDivRef.current) return;

    let mapInstance: any = null;

    // Load leaflet dynamically
    import("leaflet").then((L) => {
      LRef.current = L;

      // Fix default marker icon issues in Next.js
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
      });

      // Initialize map instance
      if (!mapDivRef.current) return;
      mapInstance = L.map(mapDivRef.current, {
        zoomControl: false,
        attributionControl: false
      }).setView([28.6139, 77.2090], 13);
      mapRef.current = mapInstance;

      // Esri Satellite base map
      const esriSatellite = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        {
          maxZoom: 19,
        }
      ).addTo(mapInstance);

      // Esri Hybrid (Satellite + Labels)
      const esriHybrid = L.layerGroup([
        L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", { maxZoom: 19 }),
        L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}", { maxZoom: 19 })
      ]);

      // USGS Topographic / Terrain Map
      const usgsTopo = L.tileLayer(
        "https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer/tile/{z}/{y}/{x}",
        {
          maxZoom: 16,
        }
      );

      // OpenStreetMap base map
      const osm = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{y}/{x}.png", {
        maxZoom: 19,
      });

      // Keep reference to basemaps
      mapInstance._basemaps = {
        satellite: esriSatellite,
        hybrid: esriHybrid,
        terrain: usgsTopo,
        streets: osm
      };

      // Create LayerGroup for mask polygons
      maskLayerGroupRef.current = L.layerGroup().addTo(mapInstance);

      // Add mousemove listener for Lat/Lon HUD
      mapInstance.on("mousemove", (e: any) => {
        setCursorCoords({ lat: e.latlng.lat, lon: e.latlng.lng });
      });

      // AOI Drawing Logic using map events
      let tempRect: any = null;
      let startLatLng: any = null;

      mapInstance.on("mousedown", (e: any) => {
        if (drawMode !== "aoi") return;
        startLatLng = e.latlng;
        tempRect = L.rectangle([startLatLng, startLatLng], {
          color: "#14b8a6",
          weight: 1.5,
          dashArray: "3, 3",
          fillOpacity: 0.1
        }).addTo(mapInstance);
      });

      mapInstance.on("mousemove", (e: any) => {
        if (drawMode !== "aoi" || !tempRect || !startLatLng) return;
        tempRect.setBounds([startLatLng, e.latlng]);
      });

      mapInstance.on("mouseup", (e: any) => {
        if (drawMode !== "aoi" || !tempRect || !startLatLng) return;
        const bounds = tempRect.getBounds();
        const southWest = bounds.getSouthWest();
        const northEast = bounds.getNorthEast();

        // Calculate Area in km2
        const latMid = (southWest.lat + northEast.lat) / 2;
        const distLat = (northEast.lat - southWest.lat) * 111.1;
        const distLon = (northEast.lng - southWest.lng) * 111.1 * Math.cos((latMid * Math.PI) / 180);
        const area = Math.abs(distLat * distLon);

        if (area > 0.001) {
          onAoiSelect({
            minLat: southWest.lat,
            maxLat: northEast.lat,
            minLon: southWest.lng,
            maxLon: northEast.lng,
            areaKm2: area
          });
        }

        mapInstance.removeLayer(tempRect);
        tempRect = null;
        startLatLng = null;
        setDrawMode("pan");
      });

    });

    return () => {
      if (mapInstance) {
        mapInstance.remove();
      }
    };
  }, []);

  // Update selected Basemap layer
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map._basemaps) return;

    // Remove current basemap layers
    Object.values(map._basemaps).forEach((layer: any) => {
      if (map.hasLayer(layer)) {
        map.removeLayer(layer);
      }
    });

    // Add selected basemap layer
    const selectedLayer = map._basemaps[basemap];
    if (selectedLayer) {
      map.addLayer(selectedLayer);
    }
  }, [basemap]);

  // Update map container bounds on Fullscreen state change
  useEffect(() => {
    const map = mapRef.current;
    if (map) {
      setTimeout(() => {
        map.invalidateSize();
      }, 150);
    }
  }, [isFullscreen]);

  // Update drawing mode interaction (enable/disable dragging)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (drawMode === "aoi") {
      map.dragging.disable();
      map.doubleClickZoom.disable();
    } else {
      map.dragging.enable();
      map.doubleClickZoom.enable();
    }
  }, [drawMode]);

  // Update drawn selected AOI rectangle
  useEffect(() => {
    const map = mapRef.current;
    const L = LRef.current;
    if (!map || !L) return;

    if (aoiLayerRef.current) {
      map.removeLayer(aoiLayerRef.current);
      aoiLayerRef.current = null;
    }

    if (selectedAoi) {
      const bounds = [
        [selectedAoi.minLat, selectedAoi.minLon],
        [selectedAoi.maxLat, selectedAoi.maxLon]
      ];
      aoiLayerRef.current = L.rectangle(bounds, {
        color: "#34b27f",
        weight: 1.5,
        dashArray: "4, 4",
        fillColor: "#34b27f",
        fillOpacity: 0.08
      }).addTo(map);
    }
  }, [selectedAoi]);

  // Update Image Overlays (Before / After)
  useEffect(() => {
    const map = mapRef.current;
    const L = LRef.current;
    if (!map || !L) return;

    // Clear existing overlays
    if (beforeOverlayRef.current) {
      map.removeLayer(beforeOverlayRef.current);
      beforeOverlayRef.current = null;
    }
    if (afterOverlayRef.current) {
      map.removeLayer(afterOverlayRef.current);
      afterOverlayRef.current = null;
    }

    // Add before image overlay
    if (beforeImage && beforeBounds) {
      const bounds = [
        [beforeBounds.south, beforeBounds.west],
        [beforeBounds.north, beforeBounds.east]
      ];
      beforeOverlayRef.current = L.imageOverlay(beforeImage, bounds, {
        opacity: opacityBefore / 100
      }).addTo(map);
      
      // Auto pan/zoom to overlay
      map.fitBounds(bounds);
    }

    // Add after image overlay
    if (afterImage && afterBounds) {
      const bounds = [
        [afterBounds.south, afterBounds.west],
        [afterBounds.north, afterBounds.east]
      ];
      afterOverlayRef.current = L.imageOverlay(afterImage, bounds, {
        opacity: opacityAfter / 100
      }).addTo(map);
      
      if (!beforeImage) {
        map.fitBounds(bounds);
      }
    }
  }, [beforeImage, afterImage, beforeBounds, afterBounds]);

  // Update Overlays Opacities
  useEffect(() => {
    if (beforeOverlayRef.current) {
      beforeOverlayRef.current.setOpacity(opacityBefore / 100);
    }
  }, [opacityBefore]);

  useEffect(() => {
    if (afterOverlayRef.current) {
      afterOverlayRef.current.setOpacity(opacityAfter / 100);
    }
  }, [opacityAfter]);

  // Apply swipe effect via CSS clip-path inset
  useEffect(() => {
    if (activeTab === "swipe" && beforeOverlayRef.current && afterOverlayRef.current) {
      const beforeImgNode = beforeOverlayRef.current.getElement();
      const afterImgNode = afterOverlayRef.current.getElement();

      if (beforeImgNode) {
        beforeImgNode.style.clipPath = `inset(0 ${100 - swipeX}% 0 0)`;
      }
      if (afterImgNode) {
        afterImgNode.style.clipPath = `inset(0 0 0 ${swipeX}%)`;
      }
      
      // Keep opacities 100% in swipe mode to see swipe clearly
      beforeOverlayRef.current.setOpacity(1);
      afterOverlayRef.current.setOpacity(1);
    } else {
      // Restore default opacities and clip-paths
      if (beforeOverlayRef.current) {
        const node = beforeOverlayRef.current.getElement();
        if (node) node.style.clipPath = "none";
        beforeOverlayRef.current.setOpacity(opacityBefore / 100);
      }
      if (afterOverlayRef.current) {
        const node = afterOverlayRef.current.getElement();
        if (node) node.style.clipPath = "none";
        afterOverlayRef.current.setOpacity(opacityAfter / 100);
      }
    }
  }, [activeTab, swipeX, beforeImage, afterImage]);

  // Update GeoJSON / Contour Analysis shapes overlay
  useEffect(() => {
    const L = LRef.current;
    const group = maskLayerGroupRef.current;
    if (!L || !group) return;

    // Clear previous mask polygons
    group.clearLayers();

    if (showChangeMask && analysisResult && analysisResult.maskCoordinates) {
      analysisResult.maskCoordinates.forEach((poly: [number, number][]) => {
        L.polygon(poly, {
          color: activeTab === "change" ? "#d44b4b" : "#14b8a6",
          weight: 2,
          fillColor: activeTab === "change" ? "#b33232" : "#14b8a6",
          fillOpacity: 0.4
        }).addTo(group);
      });
    }
  }, [analysisResult, showChangeMask, activeTab]);

  // Handle Swipe dragging
  const handleSwipeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingSwipe(true);
  };

  const handleContainerMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingSwipe || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSwipeX(percent);
  };

  const handleContainerMouseUp = () => {
    setIsDraggingSwipe(false);
  };

  const handleZoomIn = () => {
    if (mapRef.current) mapRef.current.zoomIn();
  };

  const handleZoomOut = () => {
    if (mapRef.current) mapRef.current.zoomOut();
  };

  const resetView = () => {
    if (mapRef.current) {
      if (beforeBounds) {
        mapRef.current.fitBounds([
          [beforeBounds.south, beforeBounds.west],
          [beforeBounds.north, beforeBounds.east]
        ]);
      } else {
        mapRef.current.setView([28.6139, 77.2090], 13);
      }
    }
    onAoiSelect(null);
  };

  return (
    <div 
      ref={containerRef}
      className={`${
        isFullscreen 
          ? "fixed inset-0 z-[4000] w-screen h-screen flex flex-col bg-background-primary" 
          : "flex-1 bg-background-primary border border-border-subtle rounded-sm flex flex-col relative h-[500px] lg:h-auto overflow-hidden select-none"
      }`}
      onMouseMove={handleContainerMouseMove}
      onMouseUp={handleContainerMouseUp}
      onMouseLeave={handleContainerMouseUp}
    >
      {/* Top Map Action Bar */}
      <div className="h-10 bg-background-secondary border-b border-border-subtle flex items-center justify-between px-3 z-[1000] shrink-0">
        
        {/* Left Toolbar tools */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => { setDrawMode("pan"); onAoiSelect(null); }}
            className={`p-1.5 rounded-sm transition-colors ${
              drawMode === "pan" 
                ? "bg-background-tertiary text-accent-blue border border-border-muted" 
                : "text-text-secondary hover:text-text-primary hover:bg-background-tertiary"
            }`}
            title="Pan Tool"
          >
            <MousePointer className="w-3.5 h-3.5" />
          </button>
          
          <button
            onClick={() => setDrawMode("aoi")}
            className={`p-1.5 rounded-sm transition-colors flex items-center gap-1 ${
              drawMode === "aoi" 
                ? "bg-background-tertiary text-accent-teal border border-border-muted" 
                : "text-text-secondary hover:text-text-primary hover:bg-background-tertiary"
            }`}
            title="Select Region AOI (Ask Map)"
          >
            <Square className="w-3.5 h-3.5" />
            <span className="text-[10px] font-mono leading-none">ASK REGION</span>
          </button>

          <div className="h-4 w-px bg-border-subtle mx-1" />

          <button onClick={handleZoomIn} className="p-1.5 text-text-secondary hover:text-text-primary rounded-sm transition-colors hover:bg-background-tertiary">
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button onClick={handleZoomOut} className="p-1.5 text-text-secondary hover:text-text-primary rounded-sm transition-colors hover:bg-background-tertiary">
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button onClick={resetView} className="p-1.5 text-text-secondary hover:text-text-primary rounded-sm transition-colors hover:bg-background-tertiary" title="Reset view">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Dynamic Basemap selection in toolbar */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-mono text-text-secondary flex items-center gap-1">
              <MapIcon className="w-3.5 h-3.5 text-accent-blue" />
              <span className="hidden sm:inline">BASEMAP:</span>
            </span>
            <select
              value={basemap}
              onChange={(e) => setBasemap(e.target.value as any)}
              className="bg-background-primary border border-border-subtle rounded-sm text-[10px] font-mono px-2 py-0.5 text-text-primary focus:outline-none focus:border-border-muted cursor-pointer"
            >
              <option value="satellite">Satellite (Imagery)</option>
              <option value="hybrid">Hybrid (Satellite + Labels)</option>
              <option value="terrain">Terrain (Mountain/Topo)</option>
              <option value="streets">Streets (OpenStreetMap)</option>
            </select>
          </div>

          <div className="h-4 w-px bg-border-subtle" />
          
          {activeTab === "change" && (
            <label className="flex items-center gap-1.5 font-mono text-[10px] text-accent-red-light cursor-pointer">
              <input 
                type="checkbox" 
                checked={showChangeMask} 
                onChange={(e) => setShowChangeMask(e.target.checked)}
                className="accent-accent-red w-3 h-3 bg-background-primary border border-border-subtle rounded-sm"
              />
              Change Mask
            </label>
          )}

          <button
            onClick={() => setIsFullscreen(prev => !prev)}
            className="p-1.5 hover:bg-background-tertiary rounded-sm text-text-secondary hover:text-text-primary transition-colors"
            title={isFullscreen ? "Exit Fullscreen" : "Maximize Map"}
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Map Container */}
      <div ref={mapDivRef} className="flex-1 w-full bg-background-tertiary relative z-10" />

      {/* Swipe vertical divider handle in DOM (placed over map container) */}
      {activeTab === "swipe" && beforeImage && afterImage && (
        <div 
          className="absolute top-10 bottom-0 w-1 bg-accent-blue cursor-col-resize z-[1001]"
          style={{ left: `${swipeX}%` }}
          onMouseDown={handleSwipeMouseDown}
        >
          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-accent-blue border-2 border-white flex items-center justify-center text-white text-xs select-none shadow-md">
            ↔
          </div>
        </div>
      )}

      {/* Real-time coordinates HUD inside map */}
      <div className="absolute bottom-3 right-3 pointer-events-none flex flex-col gap-0.5 bg-background-primary/95 border border-border-subtle px-2.5 py-1.5 rounded-sm z-[1000]">
        <div className="flex justify-between gap-4 items-center">
          <span className="hud-label">LAT</span>
          <span className="hud-value">{cursorCoords.lat.toFixed(5)}° N</span>
        </div>
        <div className="flex justify-between gap-4 items-center">
          <span className="hud-label">LON</span>
          <span className="hud-value">{cursorCoords.lon.toFixed(5)}° E</span>
        </div>
      </div>

      {/* Overlay showing active AOI specifications */}
      {selectedAoi && (
        <div className="absolute top-12 left-3 bg-background-primary/95 border border-accent-teal/50 p-2.5 rounded-sm flex flex-col gap-1 w-52 max-w-[90%] z-[1000]">
          <span className="hud-label text-accent-teal font-bold">ACTIVE AREA OF INTEREST</span>
          <div className="h-px bg-border-subtle my-1" />
          <div className="flex justify-between items-center">
            <span className="hud-label">Extents:</span>
            <span className="hud-value truncate">
              {selectedAoi.minLat.toFixed(3)}° to {selectedAoi.maxLat.toFixed(3)}°N
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="hud-label">Area:</span>
            <span className="hud-value text-accent-green font-bold">
              {selectedAoi.areaKm2.toFixed(2)} km²
            </span>
          </div>
          <p className="text-[9px] font-technical text-text-muted italic mt-1 leading-normal">
            Any submitted AI questions will be constrained to these limits.
          </p>
        </div>
      )}

      {/* Opacity Sliders Drawer (Visible in Map Mode) */}
      {activeTab === "map" && (beforeImage || afterImage) && (
        <div className="absolute bottom-3 left-3 bg-background-primary/95 border border-border-subtle p-3 rounded-sm flex flex-col gap-2 w-64 max-w-[90%] z-[1000]">
          <span className="font-mono text-[10px] text-text-primary flex items-center gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5 text-accent-blue" />
            RASTER LAYER OPACITIES
          </span>
          <div className="h-px bg-border-subtle my-1" />
          {beforeImage && (
            <div className="flex flex-col gap-1">
              <div className="flex justify-between font-mono text-[9px] text-text-muted">
                <span>BEFORE ACQUISITION</span>
                <span>{opacityBefore}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={opacityBefore}
                onChange={(e) => setOpacityBefore(Number(e.target.value))}
                className="w-full accent-accent-blue bg-background-tertiary h-1 rounded-sm appearance-none cursor-pointer"
              />
            </div>
          )}
          {afterImage && (
            <div className="flex flex-col gap-1 mt-1">
              <div className="flex justify-between font-mono text-[9px] text-text-muted">
                <span>AFTER ACQUISITION</span>
                <span>{opacityAfter}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={opacityAfter}
                onChange={(e) => setOpacityAfter(Number(e.target.value))}
                className="w-full accent-accent-blue bg-background-tertiary h-1 rounded-sm appearance-none cursor-pointer"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
