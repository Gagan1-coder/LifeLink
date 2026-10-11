// src/components/FederatedLearningModal.jsx
// Federated Learning Training & Evaluation Demonstration for LifeLink AI

import { useState } from "react";
import { triggerFederatedLearning } from "../services/api";

export default function FederatedLearningModal({ isOpen, onClose }) {
  const [rounds, setRounds] = useState(5);
  const [training, setTraining] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");

  const runSimulation = async () => {
    setTraining(true);
    setError("");
    try {
      const res = await triggerFederatedLearning(rounds);
      setResults(res);
    } catch (err) {
      setError("Federated Learning simulation failed. Please ensure backend is running.");
    } finally {
      setTraining(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card wide-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🧠 Privacy-Preserving Federated Learning</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <p className="modal-desc">
          Collaborative medical machine learning training across distributed hospital nodes without exchanging raw patient health records.
        </p>

        {/* ARCHITECTURE OVERVIEW */}
        <div className="fl-nodes-grid">
          <div className="fl-node-card">
            <h4>🏥 Hospital A</h4>
            <p>Karwar District Tertiary Hospital</p>
            <span className="node-dataset-pill">320 Local Records</span>
            <small>Polytrauma & Cardiac focus</small>
          </div>
          <div className="fl-node-card">
            <h4>🏥 Hospital B</h4>
            <p>Sirsi Taluk Hospital</p>
            <span className="node-dataset-pill">240 Local Records</span>
            <small>Obstetrics & Paediatrics focus</small>
          </div>
          <div className="fl-node-card">
            <h4>🏥 Hospital C</h4>
            <p>Kumta Community Health Centre</p>
            <span className="node-dataset-pill">180 Local Records</span>
            <small>Rural Primary Triage focus</small>
          </div>
        </div>

        {/* CONTROLS */}
        <div className="fl-controls-bar">
          <div className="fl-input-group">
            <label>Training Rounds:</label>
            <select
              value={rounds}
              onChange={(e) => setRounds(Number(e.target.value))}
              disabled={training}
              className="modal-select"
            >
              <option value={3}>3 Rounds</option>
              <option value={5}>5 Rounds (Recommended)</option>
              <option value={8}>8 Rounds</option>
            </select>
          </div>

          <button
            className="btn-run-fl"
            onClick={runSimulation}
            disabled={training}
          >
            {training ? "⏳ Simulating FedAvg Rounds..." : "🚀 Run Federated Training (FedAvg)"}
          </button>
        </div>

        {error && <div className="modal-alert modal-error">⚠️ {error}</div>}

        {/* RESULTS DASHBOARD */}
        {results && (
          <div className="fl-results-dashboard">
            <div className="fl-summary-metrics">
              <div className="metric-box">
                <span className="metric-title">Task</span>
                <span className="metric-value">{results.task}</span>
              </div>
              <div className="metric-box">
                <span className="metric-title">Aggregation Algorithm</span>
                <span className="metric-value">{results.algorithm}</span>
              </div>
              <div className="metric-box highlight">
                <span className="metric-title">Final Global Accuracy</span>
                <span className="metric-value">
                  {(results.final_model.validation_accuracy * 100).toFixed(1)}%
                </span>
              </div>
              <div className="metric-box">
                <span className="metric-title">Final Global Loss</span>
                <span className="metric-value">{results.final_model.validation_loss.toFixed(4)}</span>
              </div>
            </div>

            {/* ROUND-BY-ROUND TABLE */}
            <div className="fl-rounds-table-container">
              <h3>📈 Convergence History Across Training Rounds</h3>
              <table className="fl-table">
                <thead>
                  <tr>
                    <th>Round</th>
                    <th>Global Validation Accuracy</th>
                    <th>Global Loss</th>
                    <th>Hospital A Acc</th>
                    <th>Hospital B Acc</th>
                    <th>Hospital C Acc</th>
                  </tr>
                </thead>
                <tbody>
                  {results.round_history.map((r) => (
                    <tr key={r.round}>
                      <td><strong>Round {r.round}</strong></td>
                      <td>
                        <div className="accuracy-cell">
                          <div
                            className="accuracy-bar"
                            style={{ width: `${r.global_validation_accuracy * 100}%` }}
                          ></div>
                          <span>{(r.global_validation_accuracy * 100).toFixed(1)}%</span>
                        </div>
                      </td>
                      <td>{r.global_validation_loss.toFixed(4)}</td>
                      <td>{(r.client_reports[0]?.local_accuracy * 100).toFixed(1)}%</td>
                      <td>{(r.client_reports[1]?.local_accuracy * 100).toFixed(1)}%</td>
                      <td>{(r.client_reports[2]?.local_accuracy * 100).toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* PRIVACY EXPLANATION */}
            <div className="fl-privacy-notice">
              🔒 <strong>Privacy Guarantee & Clinical Rigor:</strong>
              <p>{results.privacy_guarantee}</p>
            </div>
          </div>
        )}

        <button className="close-preview-button" onClick={onClose}>
          Close Federated Learning Dashboard
        </button>
      </div>
    </div>
  );
}
