import datetime
from sqlalchemy import Column, String, Float, DateTime, Text, JSON
from .database import Base

class AnalysisRecord(Base):
    __tablename__ = "analyses"

    id = Column(String, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    query = Column(String, nullable=False)
    mode = Column(String, nullable=False) # "single" | "change" | "fusion"
    status = Column(String, default="processing") # "processing" | "completed" | "failed"
    findings = Column(Text, nullable=True)
    confidence = Column(Float, nullable=True)
    area_km2 = Column(Float, nullable=True)
    percentage = Column(Float, nullable=True)
    
    # JSON columns to store lists, coordinate polygons, and nested file metadata
    execution_trace = Column(JSON, nullable=True)
    file1_name = Column(String, nullable=True)
    file1_metadata = Column(JSON, nullable=True)
    file2_name = Column(String, nullable=True)
    file2_metadata = Column(JSON, nullable=True)
    change_mask = Column(JSON, nullable=True) # GeoJSON style coordinates
