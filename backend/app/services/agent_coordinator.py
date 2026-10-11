# backend/app/services/agent_coordinator.py
import datetime
from typing import Dict, Any, List, Optional
from app.services.hospital_service import search_nearby_hospitals, get_specialists_directory
from app.services.sms_service import build_emergency_sms_text
from app.services.whatsapp_service import build_whatsapp_alert_payload

class AgentToolExecutor:
    """
    Executes structured tools for the LifeLink Agentic AI Emergency Coordinator.
    Generates step-by-step tool execution logs for transparent, explainable decisions.
    """

    @staticmethod
    def get_emergency_details(emergency_type: str, severity: Optional[str] = "High") -> Dict[str, Any]:
        """Tool 1: Understands emergency category, critical response protocols, and triage priority."""
        protocols = {
            "Accident": {
                "triage_priority": "Immediate / Level 1 Red",
                "target_resources": ["Level 1 / 2 Trauma Center", "Orthopaedics", "Emergency Surgery", "Blood Bank"],
                "first_aid_guidance": "Do not move patient if spinal/neck injury is suspected. Control severe haemorrhage with direct pressure.",
                "requires_immediate_ambulance": True,
            },
            "Medical Emergency": {
                "triage_priority": "Immediate / Level 1 Red",
                "target_resources": ["24/7 Cardiology / CCU", "Resuscitation Ward", "ECG"],
                "first_aid_guidance": "Keep patient seated upright if conscious. Check responsiveness and airway. Prepare for CPR if pulseless.",
                "requires_immediate_ambulance": True,
            },
            "Pregnancy / Delivery": {
                "triage_priority": "High / Level 2 Yellow",
                "target_resources": ["First Referral Unit (FRU)", "Obstetrics & Gynaecology", "NICU", "Blood Bank"],
                "first_aid_guidance": "Keep mother comfortable on her left lateral side. Monitor contractions and bleeding.",
                "requires_immediate_ambulance": True,
            },
            "Severe Injury / Bleeding": {
                "triage_priority": "Immediate / Level 1 Red",
                "target_resources": ["Trauma & Surgery", "Blood Transfusion Center", "Vascular Surgery"],
                "first_aid_guidance": "Apply continuous firm pressure on wound with sterile cloth. Elevate injured limb if no fracture.",
                "requires_immediate_ambulance": True,
            },
            "Breathing Emergency": {
                "triage_priority": "Immediate / Level 1 Red",
                "target_resources": ["Pulmonology & Critical Care", "High-Flow Oxygen & Ventilators", "ICU"],
                "first_aid_guidance": "Position upright. Loosen tight clothing around neck and chest. Administer prescribed inhaler if available.",
                "requires_immediate_ambulance": True,
            },
            "Child Emergency": {
                "triage_priority": "Immediate / Level 1 Red",
                "target_resources": ["Paediatric Emergency Unit", "PICU / NICU", "Paediatrician"],
                "first_aid_guidance": "Keep infant/child warm. Ensure airway is clear. Do not administer adult medications.",
                "requires_immediate_ambulance": True,
            },
            "Other": {
                "triage_priority": "Moderate / Level 3",
                "target_resources": ["General Emergency Department", "Triage Physician"],
                "first_aid_guidance": "Assess responsiveness, breathing, and comfort. Stay with patient until emergency team arrives.",
                "requires_immediate_ambulance": False,
            }
        }
        return protocols.get(emergency_type, protocols["Other"])

    @staticmethod
    def get_location_status(latitude: Optional[float], longitude: Optional[float], accuracy: Optional[float]) -> Dict[str, Any]:
        """Tool 2: Validates GPS signal veracity, precision tier, and accuracy range."""
        if latitude is None or longitude is None:
            return {
                "status": "unavailable",
                "description": "Device GPS coordinates are pending or blocked by browser permissions.",
                "accuracy_tier": "None",
                "can_route": False,
            }

        accuracy_val = accuracy if accuracy is not None else 999.0
        if accuracy_val <= 25.0:
            tier = "High Precision (GNSS/GPS Fix)"
        elif accuracy_val <= 150.0:
            tier = "Moderate Precision (Wi-Fi/Cellular Triangulation)"
        else:
            tier = "Approximate Area (Network Tower Radius)"

        return {
            "status": "available",
            "coordinates": {"latitude": latitude, "longitude": longitude},
            "accuracy_meters": round(accuracy_val, 1),
            "accuracy_tier": tier,
            "can_route": True,
            "google_maps_url": f"https://www.google.com/maps?q={latitude},{longitude}",
        }

    @staticmethod
    async def search_hospitals(latitude: Optional[float], longitude: Optional[float], emergency_type: str) -> List[Dict[str, Any]]:
        """Tool 3: Queries verified healthcare facilities sorted by proximity and matching emergency capabilities."""
        hospitals = await search_nearby_hospitals(latitude, longitude, emergency_type)
        return hospitals[:4]  # Return top 4 most relevant facilities

    @staticmethod
    def search_specialists(emergency_type: str) -> List[Dict[str, Any]]:
        """Tool 4: Retrieves matching medical specialist domains and diagnostic readiness."""
        return get_specialists_directory(emergency_type)

    @staticmethod
    def prepare_sos_message(emergency_type: str, latitude: Optional[float], longitude: Optional[float], accuracy: Optional[float], contact_name: str) -> Dict[str, Any]:
        """Tool 5: Formulates verified emergency text payloads for SMS and WhatsApp dispatch."""
        sms_text = build_emergency_sms_text(emergency_type, latitude, longitude, accuracy)
        return {
            "target_contact": contact_name,
            "sms_payload": sms_text,
            "length_chars": len(sms_text),
            "contains_gps": (latitude is not None and longitude is not None),
        }

    @staticmethod
    def get_navigation_link(latitude: Optional[float], longitude: Optional[float], target_lat: float, target_lng: float) -> str:
        """Tool 6: Builds turnkey Google Maps turn-by-turn driving navigation URL."""
        if latitude is not None and longitude is not None:
            return f"https://www.google.com/maps/dir/?api=1&origin={latitude},{longitude}&destination={target_lat},{target_lng}&travelmode=driving"
        return f"https://www.google.com/maps/search/?api=1&query={target_lat},{target_lng}"

async def run_emergency_agent_coordination(
    emergency_type: str,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    accuracy: Optional[float] = None,
    contact_name: Optional[str] = "Primary Emergency Contact",
    contact_phone: Optional[str] = "",
) -> Dict[str, Any]:
    """
    Autonomous multi-step execution loop for LifeLink Agentic AI Coordinator.
    Executes real structured tools and documents explainable logs for demonstration.
    """
    logs: List[Dict[str, Any]] = []

    def log_step(tool_name: str, status: str, details: Any):
        logs.append({
            "timestamp": datetime.datetime.now().strftime("%H:%M:%S.%f")[:-3],
            "tool": tool_name,
            "status": status,
            "details": details,
        })

    # Step 1: Tool Execution -> get_emergency_details
    log_step("get_emergency_details", "INVOKED", {"emergency_type": emergency_type})
    details = AgentToolExecutor.get_emergency_details(emergency_type)
    log_step("get_emergency_details", "COMPLETED", {
        "triage_priority": details["triage_priority"],
        "target_resources": details["target_resources"]
    })

    # Step 2: Tool Execution -> get_location_status
    log_step("get_location_status", "INVOKED", {"lat": latitude, "lon": longitude, "acc": accuracy})
    loc_status = AgentToolExecutor.get_location_status(latitude, longitude, accuracy)
    log_step("get_location_status", "COMPLETED", {
        "status": loc_status["status"],
        "tier": loc_status["accuracy_tier"]
    })

    # Step 3: Tool Execution -> search_hospitals
    log_step("search_hospitals", "INVOKED", {"lat": latitude, "lon": longitude, "emergency_type": emergency_type})
    hospitals = await AgentToolExecutor.search_hospitals(latitude, longitude, emergency_type)
    log_step("search_hospitals", "COMPLETED", {
        "facilities_found": len(hospitals),
        "nearest_facility": hospitals[0]["name"] if hospitals else "None",
        "distance_km": hospitals[0].get("distance_km") if hospitals else None
    })

    # Step 4: Tool Execution -> search_specialists
    log_step("search_specialists", "INVOKED", {"emergency_type": emergency_type})
    specialists = AgentToolExecutor.search_specialists(emergency_type)
    log_step("search_specialists", "COMPLETED", {
        "matched_categories": [s["category"] for s in specialists]
    })

    # Step 5: Tool Execution -> prepare_sos_message
    log_step("prepare_sos_message", "INVOKED", {"contact": contact_name})
    msg_data = AgentToolExecutor.prepare_sos_message(emergency_type, latitude, longitude, accuracy, contact_name or "Contact")
    log_step("prepare_sos_message", "COMPLETED", {"message_ready": True, "chars": msg_data["length_chars"]})

    # Step 6: Formulate AI Decision Synthesis
    primary_hosp = hospitals[0] if hospitals else None
    nav_link = None
    if primary_hosp and latitude is not None and longitude is not None:
        nav_link = AgentToolExecutor.get_navigation_link(latitude, longitude, primary_hosp["latitude"], primary_hosp["longitude"])

    synthesis = {
        "coordination_id": f"coord_{int(datetime.datetime.now().timestamp())}",
        "emergency_type": emergency_type,
        "triage_priority": details["triage_priority"],
        "first_aid_guidance": details["first_aid_guidance"],
        "recommended_hospital": primary_hosp,
        "backup_hospital": hospitals[1] if len(hospitals) > 1 else None,
        "specialists_needed": specialists,
        "turn_by_turn_navigation": nav_link,
        "requires_ambulance": details.get("requires_immediate_ambulance", False),
        "prepared_alert_message": msg_data["sms_payload"],
        "tool_execution_logs": logs,
        "ai_notice": "LifeLink AI provides operational coordination support. It does not replace medical triage by licensed physicians.",
        "completed_at": datetime.datetime.now().isoformat(),
    }

    return synthesis
