// src/components/HospitalSearchModal.jsx
// Hospital & Emergency Healthcare Discovery for LifeLink AI

import { useState, useEffect } from "react";
import { fetchNearbyHospitals } from "../services/api";

export default function HospitalSearchModal({ isOpen, onClose, location, emergencyType }) {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState(emergencyType || "All");

  useEffect(() => {
    if (isOpen) {
      loadHospitals(selectedFilter === "All" ? null : selectedFilter);
    }
  }, [isOpen, selectedFilter, location]);

  const loadHospitals = async (filterType) => {
    setLoading(true);
    try {
      const res = await fetchNearbyHospitals(
        location?.latitude,
        location?.longitude,
        filterType
      );
      setHospitals(res.hospitals || []);
    } catch (err) {
      console.error("Failed to load hospitals:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card wide-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🏥 Emergency Healthcare & Hospitals</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <p className="modal-desc">
          Verified emergency hospitals and trauma centers sorted by proximity to your current location.
        </p>

        {/* LOCATION STATUS BANNER */}
        <div className="location-pill-banner">
          {location ? (
            <span>📍 Using your live GPS location: <strong>{location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}</strong> (±{Math.round(location.accuracy)}m)</span>
          ) : (
            <span>📍 GPS location pending. Displaying regional emergency hospitals in Uttara Kannada & Karnataka.</span>
          )}
        </div>

        {/* EMERGENCY FILTER CHIPS */}
        <div className="filter-chips">
          {["All", "Accident", "Medical Emergency", "Pregnancy / Delivery", "Severe Injury / Bleeding", "Breathing Emergency", "Child Emergency"].map((type) => (
            <button
              key={type}
              className={`filter-chip ${selectedFilter === type ? "active" : ""}`}
              onClick={() => setSelectedFilter(type)}
            >
              {type}
            </button>
          ))}
        </div>

        {/* HOSPITALS LIST */}
        <div className="hospitals-list">
          {loading ? (
            <p className="loading-text">Searching nearby healthcare facilities...</p>
          ) : hospitals.length === 0 ? (
            <p className="empty-text">No hospitals found matching criteria.</p>
          ) : (
            hospitals.map((hosp) => (
              <div key={hosp.id} className={`hospital-item-card ${hosp.is_emergency_priority ? "priority-match" : ""}`}>
                <div className="hospital-item-header">
                  <div>
                    <h3>{hosp.name}</h3>
                    <p className="hospital-category">{hosp.category}</p>
                  </div>
                  {hosp.distance_km != null && (
                    <div className="hospital-dist-tag">
                      🚗 <strong>{hosp.distance_km} km</strong> away
                    </div>
                  )}
                </div>

                <p className="hospital-address">📍 {hosp.address}</p>

                <div className="hospital-badges">
                  {hosp.has_emergency_ward && <span className="badge-alert">24/7 Emergency Ward</span>}
                  {hosp.icu_available && <span className="badge-info">ICU Available</span>}
                  {hosp.blood_bank && <span className="badge-warning">Blood Bank</span>}
                  {hosp.verified && <span className="badge-verified">✓ Verified Facility</span>}
                </div>

                <div className="specialties-row">
                  <strong>Key Services:</strong> {hosp.specialties.join(" • ")}
                </div>

                <div className="hospital-actions-row">
                  <a href={`tel:${hosp.emergency_phone.split("/")[0].trim()}`} className="btn-call-hospital">
                    📞 Call Emergency ({hosp.emergency_phone})
                  </a>
                  <a
                    href={hosp.directions_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-hospital-maps"
                  >
                    🗺️ Get Directions in Maps
                  </a>
                </div>
              </div>
            ))
          )}
        </div>

        <button className="close-preview-button" onClick={onClose}>
          Close Hospital Directory
        </button>
      </div>
    </div>
  );
}
