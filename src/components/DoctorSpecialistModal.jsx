// src/components/DoctorSpecialistModal.jsx
// Doctor & Emergency Specialist Discovery for LifeLink AI

import { useState, useEffect } from "react";
import { fetchSpecialists } from "../services/api";

export default function DoctorSpecialistModal({ isOpen, onClose }) {
  const [specialists, setSpecialists] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadSpecialists();
    }
  }, [isOpen]);

  const loadSpecialists = async () => {
    setLoading(true);
    try {
      const res = await fetchSpecialists();
      setSpecialists(res.specialists || []);
    } catch (err) {
      console.error("Failed to load specialists:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card wide-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>👨‍⚕️ Emergency Specialists & Clinical Domains</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <p className="modal-desc">
          Emergency-critical medical disciplines, vital diagnostics required, and recommended regional referral centers.
        </p>

        <div className="specialists-list">
          {loading ? (
            <p className="loading-text">Loading specialist directory...</p>
          ) : (
            specialists.map((spec, idx) => (
              <div key={idx} className="specialist-item-card">
                <h3>🩺 {spec.category}</h3>
                <p className="spec-desc">{spec.description}</p>

                <div className="spec-section">
                  <strong>Recommended Level of Facility:</strong>
                  <p>{spec.recommended_facility}</p>
                </div>

                <div className="spec-section">
                  <strong>Immediate Diagnostic Tests:</strong>
                  <div className="diagnostic-pills">
                    {spec.key_tests?.map((test, i) => (
                      <span key={i} className="test-pill">🔬 {test}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <button className="close-preview-button" onClick={onClose}>
          Close Specialist Directory
        </button>
      </div>
    </div>
  );
}
