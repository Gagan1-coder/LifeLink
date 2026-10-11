# backend/app/main.py
# FastAPI Application Entry Point for LifeLink AI

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

from app.core.config import settings
from app.services.hospital_service import search_nearby_hospitals, get_specialists_directory
from app.services.sms_service import send_emergency_sms
from app.services.whatsapp_service import build_whatsapp_alert_payload
from app.services.agent_coordinator import run_emergency_agent_coordination
from app.federated_learning.simulation import run_federated_training_rounds

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Emergency Healthcare Coordination API using Agentic AI and Federated Learning"
)

# Enable CORS for Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------------------------------------
# Pydantic Request / Response Models
# -------------------------------------------------------------

class LocationData(BaseModel):
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    accuracy: Optional[float] = None

class SOSCreateRequest(BaseModel):
    emergency_type: str = Field(..., example="Accident")
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    accuracy: Optional[float] = None
    contact_name: Optional[str] = "Primary Contact"
    contact_phone: Optional[str] = None
    user_name: Optional[str] = None

class SOSStatusUpdateRequest(BaseModel):
    event_id: str
    status: str
    note: Optional[str] = None

class SMSAlertRequest(BaseModel):
    phone_number: str
    emergency_type: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    accuracy: Optional[float] = None
    user_name: Optional[str] = None

class WhatsAppAlertRequest(BaseModel):
    phone_number: str
    emergency_type: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    accuracy: Optional[float] = None
    user_name: Optional[str] = None

class AICoordinateRequest(BaseModel):
    emergency_type: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    accuracy: Optional[float] = None
    contact_name: Optional[str] = "Primary Contact"
    contact_phone: Optional[str] = None

class FLTrainRequest(BaseModel):
    rounds: int = Field(default=5, ge=1, le=20)

# -------------------------------------------------------------
# Endpoints
# -------------------------------------------------------------

@app.get("/")
def root():
    return {
        "project": "LifeLink AI",
        "description": "Intelligent Emergency Healthcare Coordination Platform",
        "status": "online",
        "version": settings.VERSION,
    }

# --- Module 7 & 8: Hospital & Specialist Search ---

@app.get("/api/v1/hospitals/nearby")
async def get_nearby_hospitals(
    latitude: Optional[float] = Query(None),
    longitude: Optional[float] = Query(None),
    emergency_type: Optional[str] = Query(None),
):
    hospitals = await search_nearby_hospitals(latitude, longitude, emergency_type)
    return {
        "status": "success",
        "count": len(hospitals),
        "emergency_type": emergency_type,
        "coordinates": {"latitude": latitude, "longitude": longitude} if latitude else None,
        "hospitals": hospitals,
    }

@app.get("/api/v1/hospitals/specialists")
def get_specialists(category: Optional[str] = Query(None)):
    directory = get_specialists_directory(category)
    return {
        "status": "success",
        "count": len(directory),
        "specialists": directory,
    }

# --- Module 5: SMS Emergency Alert ---

@app.post("/api/v1/alerts/sms")
async def trigger_sms_alert(req: SMSAlertRequest):
    if not req.phone_number:
        raise HTTPException(status_code=400, detail="Phone number is required")
    res = await send_emergency_sms(
        phone_number=req.phone_number,
        emergency_type=req.emergency_type,
        latitude=req.latitude,
        longitude=req.longitude,
        accuracy=req.accuracy,
        user_name=req.user_name,
    )
    return res

# --- Module 6: WhatsApp Emergency Alert ---

@app.post("/api/v1/alerts/whatsapp")
def trigger_whatsapp_alert(req: WhatsAppAlertRequest):
    if not req.phone_number:
        raise HTTPException(status_code=400, detail="Phone number is required")
    payload = build_whatsapp_alert_payload(
        phone_number=req.phone_number,
        emergency_type=req.emergency_type,
        latitude=req.latitude,
        longitude=req.longitude,
        accuracy=req.accuracy,
        user_name=req.user_name,
    )
    return payload

# --- Module 10: Agentic AI Emergency Coordinator ---

@app.post("/api/v1/ai/coordinate")
async def coordinate_emergency(req: AICoordinateRequest):
    coordination_report = await run_emergency_agent_coordination(
        emergency_type=req.emergency_type,
        latitude=req.latitude,
        longitude=req.longitude,
        accuracy=req.accuracy,
        contact_name=req.contact_name,
        contact_phone=req.contact_phone,
    )
    return coordination_report

# --- Module 11: Federated Learning ---

@app.get("/api/v1/fl/status")
def get_fl_status():
    return {
        "status": "ready",
        "framework": "Flower + PyTorch Simulation Engine",
        "task": "Hospital Emergency Triage Risk Classification",
        "hospital_nodes": [
            {"id": "node_a", "name": "Hospital A (Karwar District Tertiary)", "samples": 320},
            {"id": "node_b", "name": "Hospital B (Sirsi Taluk Hospital)", "samples": 240},
            {"id": "node_c", "name": "Hospital C (Kumta Community Health Centre)", "samples": 180},
        ],
        "privacy_mechanism": "Federated Averaging (Local training with weight aggregation only)",
    }

@app.post("/api/v1/fl/train")
def train_federated_model(req: FLTrainRequest):
    results = run_federated_training_rounds(total_rounds=req.rounds)
    return results
