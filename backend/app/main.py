import logging
import os
import shutil
import uuid
from typing import Optional, Dict, Any
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from .config import settings
from .database import engine, Base
from .raster_processing import (
    get_raster_metadata,
    extract_png_preview,
    run_single_analysis,
    run_change_analysis,
    run_fusion_analysis
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger(__name__)

# Initialize database tables on startup
logger.info("Initializing database schemas...")
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Configure CORS so Next.js on port 3000 can query the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure folders exist
os.makedirs("uploads", exist_ok=True)
os.makedirs("samples", exist_ok=True)

# Serve static folders
app.mount("/api/v1/samples", StaticFiles(directory="samples"), name="samples")
app.mount("/api/v1/uploads", StaticFiles(directory="uploads"), name="uploads")

class AnalyzeRequest(BaseModel):
    mode: str  # "single" | "change" | "fusion"
    file1: str  # filename/path in uploads/ or samples/
    file2: Optional[str] = None  # filename/path in uploads/ or samples/
    query: Optional[str] = ""
    aoi: Optional[Dict[str, float]] = None # {"minLat": ..., "maxLat": ..., "minLon": ..., "maxLon": ...}

@app.get("/")
def read_root():
    return {"message": "Welcome to VyomDrishti AI Backend API"}

# Health check endpoints
@app.get("/health")
def health_check_root():
    logger.info("Health check requested at /health")
    return {
        "status": "healthy",
        "database": "connected",
        "service": settings.PROJECT_NAME
    }

@app.get(f"{settings.API_V1_STR}/health")
def health_check_api():
    logger.info(f"Health check requested at {settings.API_V1_STR}/health")
    return {
        "status": "healthy",
        "database": "connected",
        "service": settings.PROJECT_NAME
    }

@app.post(f"{settings.API_V1_STR}/upload")
def upload_raster_file(file: UploadFile = File(...)):
    logger.info(f"Received file upload request: {file.filename}")
    
    # Save file with a unique ID
    unique_id = str(uuid.uuid4())
    ext = os.path.splitext(file.filename)[1]
    # Handle files with no extension or weird naming
    if not ext:
        ext = ".tif"
    
    saved_filename = f"{unique_id}{ext}"
    saved_filepath = os.path.join("uploads", saved_filename)
    
    try:
        with open(saved_filepath, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Parse metadata
        meta = get_raster_metadata(saved_filepath)
        
        # Generate preview
        preview_filename = f"{unique_id}.png"
        preview_filepath = os.path.join("uploads", preview_filename)
        extract_png_preview(saved_filepath, preview_filepath)
        
        # Set preview URL
        meta["id"] = saved_filename
        meta["preview_url"] = f"http://127.0.0.1:8002/api/v1/uploads/{preview_filename}"
        
        logger.info(f"Successfully processed upload. Metadata: {meta}")
        return meta
        
    except Exception as e:
        logger.error(f"Error handling file upload: {e}")
        # Clean up failed file if it exists
        if os.path.exists(saved_filepath):
            os.remove(saved_filepath)
        raise HTTPException(status_code=400, detail=f"Failed to process geospatial file: {str(e)}")

@app.post(f"{settings.API_V1_STR}/analyze")
def analyze_raster_data(req: AnalyzeRequest):
    logger.info(f"Analyze request received: {req}")
    
    # Resolve file paths (could be in samples or uploads)
    def resolve_filepath(name: str) -> str:
        if name.startswith("samples/") or name.startswith("uploads/"):
            path = name
        elif os.path.exists(os.path.join("samples", name)):
            path = os.path.join("samples", name)
        elif os.path.exists(os.path.join("uploads", name)):
            path = os.path.join("uploads", name)
        else:
            raise HTTPException(status_code=404, detail=f"File not found: {name}")
        return path
        
    try:
        file1_path = resolve_filepath(req.file1)
        file2_path = resolve_filepath(req.file2) if req.file2 else None
        
        # 1. Input Validation
        import rasterio
        from rasterio.warp import transform_bounds
        
        # Verify file 1 readability and CRS
        try:
            with rasterio.open(file1_path) as src1:
                bounds1 = src1.bounds
                crs1 = src1.crs
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid GeoTIFF format for Image 1: {str(e)}")
            
        # Verify file 2 if provided
        if file2_path:
            try:
                with rasterio.open(file2_path) as src2:
                    bounds2 = src2.bounds
                    crs2 = src2.crs
            except Exception as e:
                raise HTTPException(status_code=400, detail=f"Invalid GeoTIFF format for Image 2: {str(e)}")
                
            # Geographic overlap validation (reproject bounds to WGS84 for comparison)
            try:
                if crs1 and crs1.to_string() != "EPSG:4326":
                    west1, south1, east1, north1 = transform_bounds(crs1, "EPSG:4326", bounds1.left, bounds1.bottom, bounds1.right, bounds1.top)
                else:
                    west1, south1, east1, north1 = bounds1.left, bounds1.bottom, bounds1.right, bounds1.top
                    
                if crs2 and crs2.to_string() != "EPSG:4326":
                    west2, south2, east2, north2 = transform_bounds(crs2, "EPSG:4326", bounds2.left, bounds2.bottom, bounds2.right, bounds2.top)
                else:
                    west2, south2, east2, north2 = bounds2.left, bounds2.bottom, bounds2.right, bounds2.top
                    
                # Calculate intersection
                overlap_west = max(west1, west2)
                overlap_south = max(south1, south2)
                overlap_east = min(east1, east2)
                overlap_north = min(north1, north2)
                
                if overlap_west >= overlap_east or overlap_south >= overlap_north:
                    raise HTTPException(status_code=400, detail="Images do not overlap geographically and cannot be compared.")
            except Exception as e:
                if isinstance(e, HTTPException):
                    raise e
                logger.warning(f"Failed to check overlap between rasters: {e}")
                
        # AOI overlap validation
        if req.aoi:
            try:
                if crs1 and crs1.to_string() != "EPSG:4326":
                    west1, south1, east1, north1 = transform_bounds(crs1, "EPSG:4326", bounds1.left, bounds1.bottom, bounds1.right, bounds1.top)
                else:
                    west1, south1, east1, north1 = bounds1.left, bounds1.bottom, bounds1.right, bounds1.top
                
                aoi_west = req.aoi.get("minLon")
                aoi_south = req.aoi.get("minLat")
                aoi_east = req.aoi.get("maxLon")
                aoi_north = req.aoi.get("maxLat")
                
                # Check overlap
                overlap_west = max(west1, aoi_west)
                overlap_south = max(south1, aoi_south)
                overlap_east = min(east1, aoi_east)
                overlap_north = min(north1, aoi_north)
                
                if overlap_west >= overlap_east or overlap_south >= overlap_north:
                    raise HTTPException(status_code=400, detail="The selected AOI coordinates do not overlap with the uploaded satellite image frame.")
            except Exception as e:
                if isinstance(e, HTTPException):
                    raise e
                    
        if req.mode == "single":
            result = run_single_analysis(
                file_path=file1_path,
                query_text=req.query,
                aoi_coords=req.aoi
            )
        elif req.mode == "change":
            if not file2_path:
                raise HTTPException(status_code=400, detail="Two images are required for change detection.")
            result = run_change_analysis(
                file1_path=file1_path,
                file2_path=file2_path,
                query_text=req.query,
                aoi_coords=req.aoi
            )
        elif req.mode == "fusion":
            if not file2_path:
                raise HTTPException(status_code=400, detail="Two images are required for optical+SAR fusion.")
            result = run_fusion_analysis(
                file1_path=file1_path,
                file2_path=file2_path,
                query_text=req.query,
                aoi_coords=req.aoi
            )
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported analysis mode: {req.mode}")
            
        logger.info("Successfully executed remote-sensing analysis.")
        return result
        
    except Exception as e:
        logger.error(f"Error executing analysis: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")
