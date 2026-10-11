# backend/app/services/hospital_service.py
import math
import httpx
from typing import List, Dict, Any, Optional

# Verified Healthcare facilities in and around Karnataka (Uttara Kannada & regional trauma centers)
VERIFIED_HOSPITALS: List[Dict[str, Any]] = [
    {
        "id": "hosp_karwar_dist",
        "name": "Karwar Institute of Medical Sciences (KIMS) District Hospital",
        "category": "Government Medical College & Tertiary Hospital",
        "address": "MG Road, Karwar, Uttara Kannada, Karnataka 581301",
        "latitude": 14.8135,
        "longitude": 74.1298,
        "phone": "+91 8382 226210",
        "emergency_phone": "108 / +91 8382 226212",
        "has_emergency_ward": True,
        "icu_available": True,
        "blood_bank": True,
        "specialties": ["Trauma & Orthopaedics", "Cardiology", "Obstetrics & Gynaecology", "Paediatrics", "General Surgery", "Anaesthesia", "ICU"],
        "verified": True,
    },
    {
        "id": "hosp_sirsi_taluk",
        "name": "TSS Hospital (Totgars' Co-operative Hospital)",
        "category": "Super Specialty Cooperative Hospital",
        "address": "Apmc Yard, Sirsi, Uttara Kannada, Karnataka 581402",
        "latitude": 14.6195,
        "longitude": 74.8354,
        "phone": "+91 8384 226788",
        "emergency_phone": "+91 8384 227788",
        "has_emergency_ward": True,
        "icu_available": True,
        "blood_bank": True,
        "specialties": ["Trauma & Accident Care", "General Medicine", "Obstetrics", "Paediatrics", "Dialysis", "Critical Care"],
        "verified": True,
    },
    {
        "id": "hosp_kumta_taluk",
        "name": "Kumta Taluk General Government Hospital",
        "category": "Taluk Government Hospital",
        "address": "Hospital Road, Kumta, Uttara Kannada, Karnataka 581343",
        "latitude": 14.4282,
        "longitude": 74.4216,
        "phone": "+91 8386 222045",
        "emergency_phone": "108",
        "has_emergency_ward": True,
        "icu_available": False,
        "blood_bank": True,
        "specialties": ["Emergency First Response", "Obstetrics & Delivery", "General Medicine", "Minor Surgery"],
        "verified": True,
    },
    {
        "id": "hosp_bhatkal_taluk",
        "name": "Bhatkal Taluk Government Hospital",
        "category": "Taluk Government Hospital",
        "address": "Main Road, Bhatkal, Uttara Kannada, Karnataka 581320",
        "latitude": 13.9785,
        "longitude": 74.5684,
        "phone": "+91 8385 226315",
        "emergency_phone": "108",
        "has_emergency_ward": True,
        "icu_available": False,
        "blood_bank": False,
        "specialties": ["Trauma Stabilization", "Maternity Care", "Paediatrics"],
        "verified": True,
    },
    {
        "id": "hosp_ankola_taluk",
        "name": "Ankola Taluk Hospital",
        "category": "Taluk Government Hospital",
        "address": "Ankola Town, Uttara Kannada, Karnataka 581314",
        "latitude": 14.6625,
        "longitude": 74.3005,
        "phone": "+91 8388 230230",
        "emergency_phone": "108",
        "has_emergency_ward": True,
        "icu_available": False,
        "blood_bank": False,
        "specialties": ["Emergency Triage", "General Medicine", "Obstetrics"],
        "verified": True,
    },
    {
        "id": "hosp_dandeli_gen",
        "name": "Dandeli General Hospital",
        "category": "General Hospital",
        "address": "Haliyal Road, Dandeli, Uttara Kannada, Karnataka 581325",
        "latitude": 15.2415,
        "longitude": 74.6231,
        "phone": "+91 8284 231222",
        "emergency_phone": "108",
        "has_emergency_ward": True,
        "icu_available": True,
        "blood_bank": False,
        "specialties": ["Trauma & Fracture Care", "Occupational Injuries", "Paediatrics", "General Surgery"],
        "verified": True,
    },
    {
        "id": "hosp_udupi_khe",
        "name": "Kasturba Hospital (KMC Manipal - Major Regional Trauma Center)",
        "category": "Apex Quaternary Care Hospital & Level 1 Trauma",
        "address": "Madhav Nagar, Manipal, Udupi, Karnataka 576104",
        "latitude": 13.3525,
        "longitude": 74.7865,
        "phone": "+91 820 2922761",
        "emergency_phone": "+91 820 2575555 / 108",
        "has_emergency_ward": True,
        "icu_available": True,
        "blood_bank": True,
        "specialties": ["Level 1 Trauma Center", "Interventional Cardiology", "Cardiothoracic Surgery", "High-Risk Obstetrics", "NICU/PICU", "Neurosurgery", "Burn Unit"],
        "verified": True,
    },
    {
        "id": "hosp_hubballi_kims",
        "name": "KIMS Hubballi (Karnataka Institute of Medical Sciences)",
        "category": "Apex Regional Tertiary Care & Trauma Center",
        "address": "PB Road, Vidyanagar, Hubballi, Karnataka 580022",
        "latitude": 15.3647,
        "longitude": 75.1240,
        "phone": "+91 836 2373348",
        "emergency_phone": "108 / +91 836 2374242",
        "has_emergency_ward": True,
        "icu_available": True,
        "blood_bank": True,
        "specialties": ["Advanced Trauma Care", "Cardiology", "Stroke Unit", "Obstetrics & Gynaecology", "Emergency Surgery", "Paediatric ICU"],
        "verified": True,
    }
]

def calculate_haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Haversine formula to compute great-circle distance in kilometers"""
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 1)

async def search_nearby_hospitals(
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    emergency_type: Optional[str] = None,
    max_radius_km: float = 80.0
) -> List[Dict[str, Any]]:
    """
    Search hospitals using device coordinates.
    Computes distances, sorts by proximity, highlights category-specific matching specialties.
    """
    results = []

    # Map emergency types to relevant specialties
    specialty_relevance_map = {
        "Accident": ["Trauma & Orthopaedics", "Level 1 Trauma Center", "Trauma & Accident Care", "General Surgery"],
        "Medical Emergency": ["Cardiology", "Interventional Cardiology", "General Medicine", "Stroke Unit"],
        "Pregnancy / Delivery": ["Obstetrics & Gynaecology", "Maternity Care", "High-Risk Obstetrics", "NICU/PICU"],
        "Severe Injury / Bleeding": ["Blood Bank", "Trauma & Orthopaedics", "Emergency Surgery", "Burn Unit"],
        "Breathing Emergency": ["Critical Care", "ICU", "General Medicine", "NICU/PICU"],
        "Child Emergency": ["Paediatrics", "NICU/PICU", "Paediatric ICU"],
    }

    relevant_keywords = specialty_relevance_map.get(emergency_type, [])

    for hosp in VERIFIED_HOSPITALS:
        hosp_data = dict(hosp)
        if latitude is not None and longitude is not None:
            dist = calculate_haversine_distance(latitude, longitude, hosp["latitude"], hosp["longitude"])
            hosp_data["distance_km"] = dist
            hosp_data["directions_url"] = (
                f"https://www.google.com/maps/dir/?api=1&origin={latitude},{longitude}"
                f"&destination={hosp['latitude']},{hosp['longitude']}&travelmode=driving"
            )
        else:
            hosp_data["distance_km"] = None
            hosp_data["directions_url"] = (
                f"https://www.google.com/maps/search/?api=1&query={hosp['latitude']},{hosp['longitude']}"
            )

        # Check specialty relevance
        hosp_specialties = hosp.get("specialties", [])
        is_relevant = any(
            any(kw.lower() in spec.lower() for kw in relevant_keywords)
            for spec in hosp_specialties
        )
        hosp_data["is_emergency_priority"] = is_relevant
        results.append(hosp_data)

    # If coordinates provided, sort by distance; otherwise prioritize verified tertiary centers
    if latitude is not None and longitude is not None:
        results.sort(key=lambda x: (x["distance_km"] if x["distance_km"] is not None else 9999))
    else:
        results.sort(key=lambda x: (not x.get("icu_available", False), x["name"]))

    return results

def get_specialists_directory(category: Optional[str] = None) -> List[Dict[str, Any]]:
    """Return emergency specialist categories and on-call directory"""
    categories = [
        {
            "category": "Trauma & Emergency Medicine",
            "relevant_emergencies": ["Accident", "Severe Injury / Bleeding"],
            "description": "Specialists in polytrauma resuscitation, surgical haemostasis, and fracture management.",
            "recommended_facility": "Apex Level 1 Trauma Centers & District Hospitals (KIMS Karwar, KMC Manipal)",
            "key_tests": ["Trauma CT", "Focused Abdominal Sonography in Trauma (FAST)", "Blood Cross-match"]
        },
        {
            "category": "Cardiology & Resuscitation",
            "relevant_emergencies": ["Medical Emergency", "Breathing Emergency"],
            "description": "Cardiologists and emergency physicians managing acute coronary syndromes and cardiac arrest.",
            "recommended_facility": "Hospitals with 24/7 Cath Lab & CCU (KIMS Hubballi, TSS Sirsi, KMC Manipal)",
            "key_tests": ["12-Lead ECG", "Troponin-I/T", "Echocardiogram"]
        },
        {
            "category": "Obstetrics & Perinatal Emergency",
            "relevant_emergencies": ["Pregnancy / Delivery"],
            "description": "Obstetricians trained in emergency caesarean sections, eclampsia, and postpartum haemorrhage.",
            "recommended_facility": "First Referral Units (FRU) & District Maternity Hospitals (KIMS Karwar, Taluk Hospitals)",
            "key_tests": ["Foetal Doppler / Ultrasound", "Haemoglobin & Blood grouping", "Blood Pressure Monitoring"]
        },
        {
            "category": "Paediatric Critical Care",
            "relevant_emergencies": ["Child Emergency", "Breathing Emergency"],
            "description": "Paediatricians and neonatologists managing paediatric respiratory distress, convulsions, and trauma.",
            "recommended_facility": "Centres with active NICU/PICU (KIMS Karwar, TSS Sirsi, KMC Manipal)",
            "key_tests": ["Paediatric Triage Score", "Pulse Oximetry", "Electrolyte Panel"]
        },
        {
            "category": "Pulmonology & Respiratory Care",
            "relevant_emergencies": ["Breathing Emergency"],
            "description": "Chest physicians and critical care teams managing acute respiratory failure, asthma, and foreign body aspiration.",
            "recommended_facility": "Hospitals with high-flow oxygen, BiPAP, and ICU ventilators",
            "key_tests": ["Arterial Blood Gas (ABG)", "Chest X-Ray", "Peak Expiratory Flow"]
        }
    ]
    if category:
        return [c for c in categories if category.lower() in c["category"].lower() or any(category.lower() in e.lower() for e in c["relevant_emergencies"])]
    return categories
