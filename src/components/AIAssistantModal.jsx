// src/components/AIAssistantModal.jsx
// Agentic AI Emergency Coordinator Visualizer for LifeLink AI

import { useState, useEffect } from "react";
import { runAICoordination } from "../services/api";
import {
  isHospitalLocationVerified,
  getHospitalLocationUrl,
  getHospitalDirectionsUrl,
  getResolveHospitalUrl,
} from "../services/locationService";

export default function AIAssistantModal({ isOpen, onClose, location, emergencyType, contactName, contactPhone }) {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      coordinate();
    }
  }, [isOpen, emergencyType, location]);

  const coordinate = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await runAICoordination({
        emergency_type: emergencyType || "Medical Emergency",
        latitude: location?.latitude,
        longitude: location?.longitude,
        accuracy: location?.accuracy,
        contact_name: contactName || "Emergency Contact",
        contact_phone: contactPhone,
      });
      setReport(result);
    } catch (err) {
      setError("AI Coordination failed to connect to backend service.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card wide-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🤖 LifeLink Agentic AI Coordinator</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <p className="modal-desc">
          Autonomous multi-tool decision support executing verified tools to streamline emergency healthcare logistics.
        </p>

        {loading ? (
          <div className="ai-loading-container">
            <div className="ai-spinner"></div>
            <p>Executing agentic coordination tools...</p>
            <small>Evaluating emergency triage • Checking location accuracy • Querying nearest emergency hospital</small>
          </div>
        ) : error ? (
          <div className="modal-alert modal-error">⚠️ {error}</div>
        ) : report ? (
          <div className="ai-report-content">
            {/* TOP SUMMARY */}
            <div className="ai-triage-card">
              <div className="ai-triage-badge">
                Triage Priority: <strong>{report.triage_priority}</strong>
              </div>
              <p className="ai-guidance">
                <strong>First-Aid Guidance:</strong> {report.first_aid_guidance}
              </p>
            </div>

            {/* RECOMMENDED HOSPITAL */}
            {report.recommended_hospital && (
              <div className="ai-recommendation-card">
                <h3>🏥 Nearest Recommended Emergency Facility</h3>
                <h4>{report.recommended_hospital.name}</h4>
                <p>{report.recommended_hospital.category}</p>
                {report.recommended_hospital.distance_km != null && (
                  <p>Distance: <strong>{report.recommended_hospital.distance_km} km</strong></p>
                )}

                <div className="ai-action-buttons">
                  <a href={`tel:${report.recommended_hospital.phone}`} className="btn-call-hospital">
                    📞 Call Hospital ({report.recommended_hospital.phone})
                  </a>

                  {isHospitalLocationVerified(report.recommended_hospital) ? (
                    <>
                      <a
                        href={getHospitalLocationUrl(report.recommended_hospital)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-view-hospital-location"
                        title="View exact hospital pin on Google Maps"
                      >
                        📍 View Hospital Location
                      </a>

                      {(getHospitalDirectionsUrl(report.recommended_hospital, location?.latitude, location?.longitude) || report.turn_by_turn_navigation) && (
                        <a
                          href={getHospitalDirectionsUrl(report.recommended_hospital, location?.latitude, location?.longitude) || report.turn_by_turn_navigation}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-hospital-maps"
                          title="Open turn-by-turn navigation"
                        >
                          🗺️ Open Navigation Route
                        </a>
                      )}
                    </>
                  ) : (
                    <div className="unverified-hospital-notice">
                      <span className="unverified-badge">⚠️ Hospital location not verified</span>
                      <a
                        href={getResolveHospitalUrl(report.recommended_hospital)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-resolve-hospital"
                      >
                        🔍 Resolve Hospital Record
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STRUCTURED TOOL EXECUTION LOGS */}
            <div className="ai-logs-container">
              <h3>🔍 Autonomous Tool Execution Audit Trail</h3>
              <p className="logs-subtitle">Verified system logs demonstrating human-explainable AI decision flow:</p>
              <div className="logs-list">
                {report.tool_execution_logs?.map((log, index) => (
                  <div key={index} className="log-entry">
                    <div className="log-time">{log.timestamp}</div>
                    <div className="log-tool-tag">🔧 {log.tool}()</div>
                    <div className={`log-status-badge ${log.status.toLowerCase()}`}>{log.status}</div>
                    <pre className="log-json">{JSON.stringify(log.details, null, 2)}</pre>
                  </div>
                ))}
              </div>
            </div>

            <div className="ai-disclaimer-box">
              ⚠️ <strong>Safe Clinical Support Notice:</strong> {report.ai_notice}
            </div>
          </div>
        ) : null}

        <button className="close-preview-button" onClick={onClose}>
          Close AI Assistant
        </button>
      </div>
    </div>
  );
}
