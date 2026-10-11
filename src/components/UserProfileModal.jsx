// src/components/UserProfileModal.jsx
// User Profile & Emergency Medical Information for LifeLink AI

import { useState, useEffect } from "react";

const PROFILE_STORAGE_KEY = "lifelink_user_profile";

export default function UserProfileModal({ isOpen, onClose, onProfileUpdated }) {
  const [profile, setProfile] = useState({
    fullName: "",
    phone: "",
    bloodGroup: "Unknown",
    allergies: "",
    medications: "",
    medicalConditions: "",
    emergencyNotes: "",
  });
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      try {
        const stored = localStorage.getItem(PROFILE_STORAGE_KEY);
        if (stored) {
          setProfile(JSON.parse(stored));
        }
      } catch (err) {
        console.warn("Error reading profile:", err);
      }
    }
  }, [isOpen]);

  const handleChange = (field, value) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
    setSavedSuccess(false);
  };

  const handleSave = (e) => {
    e.preventDefault();
    try {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
      setSavedSuccess(true);
      if (onProfileUpdated) {
        onProfileUpdated(profile);
      }
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to save profile:", err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>👤 Emergency Medical Profile</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <p className="modal-desc">
          Store critical medical details that first responders and emergency doctors need during an incident.
        </p>

        {savedSuccess && (
          <div className="modal-alert modal-success">
            ✅ Emergency profile saved securely on your device.
          </div>
        )}

        <form onSubmit={handleSave} className="modal-form">
          <div className="form-row">
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                placeholder="Your full name"
                value={profile.fullName}
                onChange={(e) => handleChange("fullName", e.target.value)}
                className="modal-input"
              />
            </div>

            <div className="form-group">
              <label>Blood Group</label>
              <select
                value={profile.bloodGroup}
                onChange={(e) => handleChange("bloodGroup", e.target.value)}
                className="modal-select"
              >
                <option value="Unknown">Not Specified</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Emergency Phone Number</label>
            <input
              type="tel"
              placeholder="+91 Your Phone"
              value={profile.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              className="modal-input"
            />
          </div>

          <div className="form-group">
            <label>Allergies (e.g., Penicillin, Peanuts, Latex)</label>
            <input
              type="text"
              placeholder="List any known allergies"
              value={profile.allergies}
              onChange={(e) => handleChange("allergies", e.target.value)}
              className="modal-input"
            />
          </div>

          <div className="form-group">
            <label>Chronic Medical Conditions (e.g., Asthma, Diabetes, Cardiac)</label>
            <input
              type="text"
              placeholder="List any active medical conditions"
              value={profile.medicalConditions}
              onChange={(e) => handleChange("medicalConditions", e.target.value)}
              className="modal-input"
            />
          </div>

          <div className="form-group">
            <label>Current Medications</label>
            <input
              type="text"
              placeholder="e.g., Insulin, Blood pressure meds"
              value={profile.medications}
              onChange={(e) => handleChange("medications", e.target.value)}
              className="modal-input"
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="modal-submit-btn">
              💾 Save Medical Profile
            </button>
            <button type="button" className="modal-cancel-btn" onClick={onClose}>
              Close
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
