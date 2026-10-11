// src/services/locationService.js
// Geolocation helpers and distance calculations for LifeLink AI

/**
 * Classifies GPS accuracy in meters into human-readable, honest descriptions
 */
export function classifyAccuracy(accuracyInMeters) {
  if (accuracyInMeters == null) return { level: "unknown", label: "Accuracy Pending", badgeClass: "badge-pending" };
  if (accuracyInMeters <= 25) {
    return { level: "high", label: `High Precision GPS (±${Math.round(accuracyInMeters)}m)`, badgeClass: "badge-high" };
  }
  if (accuracyInMeters <= 150) {
    return { level: "moderate", label: `Moderate Precision (±${Math.round(accuracyInMeters)}m)`, badgeClass: "badge-moderate" };
  }
  return { level: "approximate", label: `Approximate Network Area (±${Math.round(accuracyInMeters)}m)`, badgeClass: "badge-approx" };
}

/**
 * Calculate distance between two lat/lng coordinates in kilometers (Haversine formula)
 */
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return Math.round(d * 10) / 10; // Round to 1 decimal place
}

/**
 * Check if hospital has verified location data
 */
export function isHospitalLocationVerified(hospital) {
  if (!hospital) return false;
  if (hospital.location_verified === false) return false;
  return Boolean(
    (hospital.latitude != null && hospital.longitude != null) ||
    hospital.place_id
  );
}

/**
 * Format exact Hospital Location URL (centered on verified hospital, NEVER user coordinates)
 * Requirements 4 & 5:
 * https://www.google.com/maps/@?api=1&map_action=map&center=HOSPITAL_LATITUDE,HOSPITAL_LONGITUDE&zoom=18
 * https://www.google.com/maps/search/?api=1&query=HOSPITAL_NAME&query_place_id=GOOGLE_PLACE_ID
 */
export function getHospitalLocationUrl(hospital) {
  if (!hospital) return null;

  // 1. If backend already built a verified location_url, return it
  if (hospital.location_url) {
    return hospital.location_url;
  }

  // 2. Place ID based direct listing (highest fidelity)
  if (hospital.place_id) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hospital.name)}&query_place_id=${hospital.place_id}`;
  }

  // 3. Exact coordinates centered at zoom 18
  if (hospital.latitude != null && hospital.longitude != null) {
    return `https://www.google.com/maps/@?api=1&map_action=map&center=${hospital.latitude},${hospital.longitude}&zoom=18`;
  }

  return null;
}

/**
 * Format Google Maps driving directions
 * Requirement 6: Destination MUST always be the selected hospital's verified coordinates or Place ID.
 * The user's location is used ONLY as the origin.
 */
export function getHospitalDirectionsUrl(hospital, originLat = null, originLng = null) {
  if (!hospital || !isHospitalLocationVerified(hospital)) return null;

  const params = new URLSearchParams();
  params.append("api", "1");
  params.append("travelmode", "driving");

  // User location ONLY as origin
  if (originLat != null && originLng != null) {
    params.append("origin", `${originLat},${originLng}`);
  }

  // Hospital verified location as destination
  if (hospital.latitude != null && hospital.longitude != null) {
    params.append("destination", `${hospital.latitude},${hospital.longitude}`);
  } else if (hospital.place_id) {
    params.append("destination", hospital.name);
  }

  if (hospital.place_id) {
    params.append("destination_place_id", hospital.place_id);
  }

  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

/**
 * URL to resolve/verify unverified hospital records on Google Maps
 * Requirement 7
 */
export function getResolveHospitalUrl(hospital) {
  if (!hospital) return null;
  if (hospital.resolve_url) return hospital.resolve_url;
  const q = `${hospital.name}, ${hospital.address || ""}`.trim();
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

/**
 * General purpose Google Maps search and direction links
 */
export function getDirectionsUrl(destLat, destLng, originLat = null, originLng = null) {
  if (originLat && originLng) {
    return `https://www.google.com/maps/dir/?api=1&origin=${originLat},${originLng}&destination=${destLat},${destLng}&travelmode=driving`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${destLat},${destLng}`;
}

/**
 * Emergency services list for India
 */
export const OFFICIAL_EMERGENCY_SERVICES = [
  {
    name: "National Emergency Helpline",
    number: "112",
    description: "All-in-one emergency response (Police, Fire, Ambulance)",
    icon: "🚨",
    primary: true,
  },
  {
    name: "Government Medical Ambulance",
    number: "108",
    description: "Emergency Medical & Trauma Transport Service",
    icon: "🚑",
    primary: true,
  },
  {
    name: "Pregnant Women & Infant Ambulance",
    number: "102",
    description: "Free delivery and newborn emergency transport",
    icon: "🤰",
    primary: false,
  },
  {
    name: "Disaster Management Helpline",
    number: "1077",
    description: "District Disaster Management Authority (DDMA)",
    icon: "🌪️",
    primary: false,
  },
];
