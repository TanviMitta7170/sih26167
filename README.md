# VyomDrishti
**SIH 2026 · Problem Statement SIH26167 · Space Technology**

Ask a question. Get a satellite answer.

---

## What it does

You upload a satellite image and type a question in plain English. VyomDrishti figures out what kind of analysis you need, runs it, and shows you the result on a map — with a confidence score and a step-by-step trace of what happened.

No GIS tools. No scripting. Just ask.

---

## Three modes

**Single** — one image, any question. Vegetation? NDVI. Water? NDWI. Describe the scene? LLaVA.

**Change** — two images from different dates. Automatically co-registered, pixel-diffed, and summarised in plain language.

**Fusion** — one optical + one SAR image. Extracts spectral features from optical, backscatter ratio from SAR, and only keeps pixels both sensors agree on. Works through cloud cover.

---

## Stack

| | |
|---|---|
| Backend | Python · FastAPI · Rasterio · Shapely · PyProj |
| AI | LLaVA via Ollama · BigEarthNet 46-class LULC vocab |
| Spectral | NDVI · NDWI · Built-Up Index · SAR VH/VV dB |
| Frontend | Next.js 14 · Leaflet.js · Tailwind CSS |
| DB | SQLite (history log) |

Everything runs locally. No API keys. No data leaves your machine.

---

## Setup

You need Python 3.10+, Node.js 18+, and [Ollama](https://ollama.com).

```bash
# Pull the vision model (one time, ~4.7GB)
ollama pull llava
```

**Backend**
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

**Frontend**
```bash
cd frontend
npm install
npm run dev
```

## Sample data

`backend/samples/` has `delhi_before.tif` and `delhi_after.tif` — real GeoTIFFs of Delhi NCR you can use to demo all three modes immediately.

---

## How the pipeline works

```
GeoTIFF + query
    ↓
validate (format, bands, CRS, overlap)
    ↓
classify query intent
    ↓
route to specialist
    ├── grounding  →  NDVI / NDWI spectral indexer
    ├── VQA/caption →  LLaVA (BigEarthNet vocab, temp 0.2)
    └── fusion     →  optical ∩ SAR consensus mask
    ↓
map overlay + area (km²) + confidence + trace
```

Confidence is computed from actual mask statistics — not hardcoded. Near-empty or near-full masks get penalised since those indicate uncertain segmentation.

---

## Structure

```
├─ backend/
│   ├─ app/
│   │   ├─ main.py               # routes + input validation
│   │   ├─ raster_processing.py  # full analysis pipeline
│   │   ├─ models.py             # DB models
│   │   └─ config.py
│   ├─ samples/
│   └─ requirements.txt
├── frontend/
│   ├─ src/components/
│   │   ├─ AnalysisWorkspace.tsx
│   │   ├─ GeospatialMap.tsx
│   │   ├─ Dashboard.tsx
│   │   └─ HistoryReports.tsx
│   └─ next.config.mjs
└─ README.md
```

## PS details

Problem ID - SIH26167
Title - SatQuery AI — Interactive Vision-Language Assistant for Multimodal Remote Sensing Image Analysis
Organisation - ISRO
Theme - Space Technology

---

## References

- Kuckreja et al. — GeoChat, CVPR 2024
- Liu et al. — RemoteCLIP, IEEE TGRS 2024
- BigEarthNet — IGARSS 2019
