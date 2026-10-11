// src/components/EmergencyServicesModal.jsx
// Immediate Emergency Helpline & Ambulance Services for LifeLink AI

import { OFFICIAL_EMERGENCY_SERVICES } from "../services/locationService";

export default function EmergencyServicesModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🚨 Official Emergency Services (India)</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="direct-call-alert">
          <strong>⚡ High Priority Assistance:</strong>
          <p>
            Emergency calling operates directly via your device's cellular network and is <strong>never dependent</strong> on data connectivity, GPS, or AI processing.
          </p>
        </div>

        <div className="emergency-services-grid">
          {OFFICIAL_EMERGENCY_SERVICES.map((srv, idx) => (
            <div key={idx} className={`emergency-service-card ${srv.primary ? "primary-service" : ""}`}>
              <div className="service-icon">{srv.icon}</div>
              <div className="service-details">
                <h3>{srv.name}</h3>
                <p>{srv.description}</p>
                <div className="service-number-badge">Dial: <strong>{srv.number}</strong></div>
              </div>
              <a href={`tel:${srv.number}`} className="btn-call-emergency-direct">
                📞 CALL {srv.number}
              </a>
            </div>
          ))}
        </div>

        <div className="emergency-tips-card">
          <h4>💡 When Speaking to Emergency Responders:</h4>
          <ul>
            <li>State your exact landmark, village, or town first.</li>
            <li>Describe whether the patient is conscious and breathing.</li>
            <li>Report if there is severe bleeding, chest pain, or trauma.</li>
            <li>Stay on the line until the dispatcher confirms the ambulance team is alerted.</li>
          </ul>
        </div>

        <button className="close-preview-button" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
