// src/components/EmergencyContactsModal.jsx
// Emergency Contact Management for LifeLink AI

import { useState, useEffect } from "react";
import {
  getEmergencyContacts,
  saveEmergencyContact,
  deleteEmergencyContact,
} from "../services/firebase";

export default function EmergencyContactsModal({ isOpen, onClose, onSelectPrimary }) {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [relationship, setRelationship] = useState("Family");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadContacts();
    }
  }, [isOpen]);

  const loadContacts = async () => {
    setLoading(true);
    try {
      const list = await getEmergencyContacts();
      setContacts(list);
    } catch (err) {
      console.error("Error loading contacts:", err);
    } finally {
      setLoading(false);
    }
  };

  const validatePhone = (p) => {
    const cleaned = p.replace(/[\s-]/g, "");
    return /^\+?[0-9]{10,15}$/.test(cleaned);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!name.trim()) {
      setError("Please provide a contact name.");
      return;
    }

    if (!validatePhone(phone)) {
      setError("Please enter a valid phone number (10-15 digits, e.g., +91 9876543210).");
      return;
    }

    try {
      const contactData = {
        name: name.trim(),
        phone: phone.trim(),
        relationship,
        isPrimary: contacts.length === 0, // First contact is primary by default
      };

      if (editingId) {
        contactData.id = editingId;
      }

      const saved = await saveEmergencyContact(contactData);

      setSuccess(`Contact ${editingId ? "updated" : "saved"} successfully.`);
      setName("");
      setPhone("");
      setEditingId(null);
      await loadContacts();

      if (saved.isPrimary && onSelectPrimary) {
        onSelectPrimary(saved);
      }
    } catch (err) {
      setError("Failed to save contact. Please try again.");
    }
  };

  const handleEdit = (c) => {
    setEditingId(c.id);
    setName(c.name);
    setPhone(c.phone);
    setRelationship(c.relationship || "Family");
    setError("");
    setSuccess("");
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Remove this emergency contact?")) return;
    try {
      await deleteEmergencyContact(id);
      await loadContacts();
      setSuccess("Contact removed.");
    } catch {
      setError("Failed to delete contact.");
    }
  };

  const handleSetPrimary = async (c) => {
    try {
      const updated = { ...c, isPrimary: true };
      await saveEmergencyContact(updated);
      await loadContacts();
      if (onSelectPrimary) {
        onSelectPrimary(updated);
      }
      setSuccess(`${c.name} set as primary contact.`);
    } catch {
      setError("Failed to set primary contact.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>👨‍👩‍👧 Trusted Emergency Contacts</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <p className="modal-desc">
          Add trusted contacts who will receive emergency notifications and GPS location during an SOS alert.
        </p>

        {error && <div className="modal-alert modal-error">⚠️ {error}</div>}
        {success && <div className="modal-alert modal-success">✅ {success}</div>}

        {/* CONTACT FORM */}
        <form onSubmit={handleSave} className="modal-form">
          <div className="form-row">
            <input
              type="text"
              placeholder="Contact Name (e.g., Mom, Dr. Sharma)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="modal-input"
            />
            <select
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
              className="modal-select"
            >
              <option value="Family">Family</option>
              <option value="Spouse">Spouse / Partner</option>
              <option value="Parent">Parent</option>
              <option value="Sibling">Sibling</option>
              <option value="Friend">Friend</option>
              <option value="Doctor">Doctor</option>
              <option value="Neighbor">Neighbor</option>
            </select>
          </div>

          <input
            type="tel"
            placeholder="Phone Number (e.g. +91 9876543210)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="modal-input"
          />

          <div className="form-actions">
            <button type="submit" className="modal-submit-btn">
              {editingId ? "Update Contact" : "➕ Add Emergency Contact"}
            </button>
            {editingId && (
              <button
                type="button"
                className="modal-cancel-btn"
                onClick={() => {
                  setEditingId(null);
                  setName("");
                  setPhone("");
                }}
              >
                Cancel Edit
              </button>
            )}
          </div>
        </form>

        {/* SAVED CONTACTS LIST */}
        <div className="contacts-list">
          <h3>Saved Emergency Contacts ({contacts.length})</h3>

          {loading ? (
            <p className="loading-text">Loading contacts...</p>
          ) : contacts.length === 0 ? (
            <p className="empty-text">No contacts saved yet. Add your first trusted contact above.</p>
          ) : (
            <div className="contact-items">
              {contacts.map((c) => (
                <div key={c.id} className={`contact-card ${c.isPrimary ? "primary" : ""}`}>
                  <div className="contact-info">
                    <div className="contact-title-row">
                      <strong>{c.name}</strong>
                      <span className="contact-rel-badge">{c.relationship || "Contact"}</span>
                      {c.isPrimary && <span className="primary-badge">PRIMARY SOS</span>}
                    </div>
                    <div className="contact-phone">📞 {c.phone}</div>
                  </div>

                  <div className="contact-actions">
                    {!c.isPrimary && (
                      <button
                        className="btn-set-primary"
                        onClick={() => handleSetPrimary(c)}
                        title="Set as primary SOS contact"
                      >
                        Set Primary
                      </button>
                    )}
                    <button
                      className="btn-edit-contact"
                      onClick={() => handleEdit(c)}
                      title="Edit contact"
                    >
                      ✏️
                    </button>
                    <button
                      className="btn-del-contact"
                      onClick={() => handleDelete(c.id)}
                      title="Delete contact"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <button className="close-preview-button" onClick={onClose}>
          Done
        </button>
      </div>
    </div>
  );
}
