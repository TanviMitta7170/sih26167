import os
import numpy as np
import rasterio
from rasterio.transform import from_bounds
from PIL import Image

def generate_sample_tiffs():
    os.makedirs("samples", exist_ok=True)
    
    # Coordinate boundaries (around central New Delhi, matching app coordinates)
    # west, south, east, north
    west, south, east, north = 77.1950, 28.6020, 77.2250, 28.6250
    width, height = 512, 512
    
    transform = from_bounds(west, south, east, north, width, height)
    crs = "EPSG:4326"
    
    # Base features:
    # 1. A river passing from top-left to bottom-right
    # 2. A forest area in the middle-left
    # 3. An urban area that expands in the "after" image
    
    x = np.linspace(0, 1, width)
    y = np.linspace(0, 1, height)
    X, Y = np.meshgrid(x, y)
    
    # River mask: curve from (0, 0.2) to (1, 0.6)
    river_center = 0.2 + 0.4 * X + 0.1 * np.sin(X * np.pi * 2)
    river_mask = np.abs(Y - river_center) < 0.03
    
    # Forest mask
    forest_mask = (X - 0.25)**2 + (Y - 0.45)**2 < 0.04
    
    # Urban area t1 (before)
    urban_mask_t1 = (X - 0.7)**2 + (Y - 0.3)**2 < 0.02
    
    # Urban area t2 (after - expands and consumes some forest)
    urban_mask_t2 = ((X - 0.7)**2 + (Y - 0.3)**2 < 0.06) | ((X - 0.4)**2 + (Y - 0.5)**2 < 0.015)
    
    for time_step, urban_mask, suffix in [("t1", urban_mask_t1, "_before"), ("t2", urban_mask_t2, "_after")]:
        # Create 4 bands: Red, Green, Blue, NIR
        r = np.zeros((height, width), dtype=np.uint8)
        g = np.zeros((height, width), dtype=np.uint8)
        b = np.zeros((height, width), dtype=np.uint8)
        nir = np.zeros((height, width), dtype=np.uint8)
        
        # Default soil background: grayish-brown
        r[:] = 120
        g[:] = 110
        b[:] = 95
        nir[:] = 100
        
        # Apply River (dark blue, low NIR)
        r[river_mask] = 20
        g[river_mask] = 40
        b[river_mask] = 120
        nir[river_mask] = 10
        
        # Apply Forest (dark green, very high NIR)
        r[forest_mask] = 30
        g[forest_mask] = 95
        b[forest_mask] = 40
        nir[forest_mask] = 210
        
        # Apply Urban (bright grey/white, medium NIR)
        r[urban_mask] = 180
        g[urban_mask] = 185
        b[urban_mask] = 190
        nir[urban_mask] = 140
        
        # Add some random texture noise
        noise = (np.random.randn(height, width) * 8).astype(np.int16)
        r = np.clip(r.astype(np.int16) + noise, 0, 255).astype(np.uint8)
        g = np.clip(g.astype(np.int16) + noise, 0, 255).astype(np.uint8)
        b = np.clip(b.astype(np.int16) + noise, 0, 255).astype(np.uint8)
        nir = np.clip(nir.astype(np.int16) + noise, 0, 255).astype(np.uint8)
        
        # Write GeoTIFF
        tif_path = f"samples/delhi{suffix}.tif"
        with rasterio.open(
            tif_path,
            'w',
            driver='GTiff',
            height=height,
            width=width,
            count=4,
            dtype=rasterio.uint8,
            crs=crs,
            transform=transform,
        ) as dst:
            dst.write(r, 1)    # Band 1: Red
            dst.write(g, 2)    # Band 2: Green
            dst.write(b, 3)    # Band 3: Blue
            dst.write(nir, 4)  # Band 4: NIR
            
        print(f"Created real GeoTIFF: {tif_path}")
        
        # Write PNG preview for frontend leaflet display (RGB)
        rgb = np.stack([r, g, b], axis=-1)
        png_path = f"samples/delhi{suffix}.png"
        Image.fromarray(rgb).save(png_path)
        print(f"Created PNG preview: {png_path}")

if __name__ == "__main__":
    generate_sample_tiffs()
