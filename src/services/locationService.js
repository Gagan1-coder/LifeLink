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
 * Format Google Maps search and direction links
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
