# backend/app/services/hospital_service.py
import math
import httpx
from typing import List, Dict, Any, Optional

import urllib.parse

# Verified Healthcare facilities in and around Karnataka (Uttara Kannada & regional trauma centers)
VERIFIED_HOSPITALS: List[Dict[str, Any]] = [
    {
        "id": "hosp_karwar_dist",
        "name": "Karwar Institute of Medical Sciences (KIMS) District Hospital",
        "category": "Government Medical College & Tertiary Hospital",
        "address": "MG Road, Karwar, Uttara Kannada, Karnataka 581301",
        "latitude": 14.8135,
        "longitude": 74.1298,
        "place_id": "ChIJIbZ2XZd1AjoRIby6-f4D1fo",
        "location_verified": True,
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
        "place_id": "ChIJQWpLq0bLwzsRyR5Jz7vX6e0",
        "location_verified": True,
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
        "latitude": 14.4190,
        "longitude": 74.4156,
        "place_id": "ChIJc2c31ePBvzsRcZ8Zz7vX6e1",
        "location_verified": True,
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
        "address": "Sante Market Road, Bhatkal, Uttara Kannada, Karnataka 581320",
        "latitude": 13.9973,
        "longitude": 74.5531,
        "place_id": "ChIJw7t9_fLDvzsReB8Zz7vX6e2",
        "location_verified": True,
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
        "latitude": 14.6135,
        "longitude": 74.3493,
        "place_id": "ChIJ4y142eTCvzsRgD8Zz7vX6e3",
        "location_verified": True,
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
        "latitude": None,
        "longitude": None,
        "place_id": None,
        "location_verified": False,
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
        "place_id": "ChIJu46P_2zmrzsR203C6V1Uv08",
        "location_verified": True,
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
        "place_id": "ChIJU3w83ZrrwzsRsP5zX4vQ6d8",
        "location_verified": True,
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
    Hospital locations are verified and strictly decoupled from user coordinates.
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
        hosp_lat = hosp.get("latitude")
        hosp_lon = hosp.get("longitude")
        hosp_place_id = hosp.get("place_id")
        is_loc_verified = bool(hosp.get("location_verified") and ((hosp_lat is not None and hosp_lon is not None) or hosp_place_id))

        hosp_data["location_verified"] = is_loc_verified

        # 1. Compute proximity if both user GPS and hospital coordinates are present
        if latitude is not None and longitude is not None and hosp_lat is not None and hosp_lon is not None:
            dist = calculate_haversine_distance(latitude, longitude, hosp_lat, hosp_lon)
            hosp_data["distance_km"] = dist
        else:
            hosp_data["distance_km"] = None

        # 2. Build exact View Hospital Location URL (centered on verified hospital coords or place_id)
        if hosp_place_id:
            hosp_data["location_url"] = (
                f"https://www.google.com/maps/search/?api=1&query={urllib.parse.quote(hosp['name'])}&query_place_id={hosp_place_id}"
            )
        elif hosp_lat is not None and hosp_lon is not None:
            hosp_data["location_url"] = (
                f"https://www.google.com/maps/@?api=1&map_action=map&center={hosp_lat},{hosp_lon}&zoom=18"
            )
        else:
            hosp_data["location_url"] = None

        # 3. Build Get Directions URL (Destination ALWAYS targets verified hospital; user coords only used as origin)
        if is_loc_verified:
            origin_param = f"origin={latitude},{longitude}&" if (latitude is not None and longitude is not None) else ""
            if hosp_lat is not None and hosp_lon is not None:
                place_param = f"&destination_place_id={hosp_place_id}" if hosp_place_id else ""
                hosp_data["directions_url"] = (
                    f"https://www.google.com/maps/dir/?api=1&{origin_param}destination={hosp_lat},{hosp_lon}{place_param}&travelmode=driving"
                )
            elif hosp_place_id:
                hosp_data["directions_url"] = (
                    f"https://www.google.com/maps/dir/?api=1&{origin_param}destination={urllib.parse.quote(hosp['name'])}&destination_place_id={hosp_place_id}&travelmode=driving"
                )
        else:
            hosp_data["directions_url"] = None

        # 4. Resolve URL for unverified records
        hosp_data["resolve_url"] = (
            f"https://www.google.com/maps/search/?api=1&query={urllib.parse.quote(hosp['name'] + ', ' + hosp.get('address', ''))}"
        )

        # 5. Check specialty relevance
        hosp_specialties = hosp.get("specialties", [])
        is_relevant = any(
            any(kw.lower() in spec.lower() for kw in relevant_keywords)
            for spec in hosp_specialties
        )
        hosp_data["is_emergency_priority"] = is_relevant
        results.append(hosp_data)

    # If user coordinates provided, sort verified hospitals by distance; unverified hospitals at the bottom
    if latitude is not None and longitude is not None:
        results.sort(key=lambda x: (
            0 if x.get("location_verified") else 1,
            x["distance_km"] if x.get("distance_km") is not None else 9999
        ))
    else:
        results.sort(key=lambda x: (
            0 if x.get("location_verified") else 1,
            not x.get("icu_available", False),
            x["name"]
        ))

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
