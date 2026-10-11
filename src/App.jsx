import { useState, useRef, useEffect } from "react";
import "./App.css";

// Modals
import AIAssistantModal from "./components/AIAssistantModal";
import HospitalSearchModal from "./components/HospitalSearchModal";
import DoctorSpecialistModal from "./components/DoctorSpecialistModal";
import EmergencyContactsModal from "./components/EmergencyContactsModal";
import EmergencyServicesModal from "./components/EmergencyServicesModal";
import FederatedLearningModal from "./components/FederatedLearningModal";
import UserProfileModal from "./components/UserProfileModal";

// Services
import { getEmergencyContacts, recordSOSEvent } from "./services/firebase";
import { triggerWhatsAppAlert, triggerSMSAlert } from "./services/api";

function App() {
  const [sosState, setSosState] = useState("idle");
  const [countdown, setCountdown] = useState(3);
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState("");
  const [locationLoading, setLocationLoading] = useState(false);
  const [emergencyType, setEmergencyType] = useState("Medical Emergency");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [showAlertPreview, setShowAlertPreview] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [alertFeedback, setAlertFeedback] = useState("");

  const timerRef = useRef(null);
  const countdownRef = useRef(null);

  // Load profile and primary emergency contact on mount
  useEffect(() => {
    try {
      const storedProfile = localStorage.getItem("lifelink_user_profile");
      if (storedProfile) {
        setUserProfile(JSON.parse(storedProfile));
      }
    } catch (err) {
      console.warn("Could not load stored profile:", err);
    }

    getEmergencyContacts()
      .then((contacts) => {
        if (contacts && contacts.length > 0) {
          const primary = contacts.find((c) => c.isPrimary) || contacts[0];
          if (primary) {
            setContactName(primary.name);
            setContactPhone(primary.phone);
          }
        }
      })
      .catch((err) => {
        console.warn("Could not load contacts:", err);
      });
  }, []);

  // Start SOS when user presses and holds
  const startSOS = () => {
    if (sosState !== "idle") return;

    setSosState("countdown");
    setCountdown(3);

    let count = 3;

    countdownRef.current = setInterval(() => {
      count--;

      if (count > 0) {
        setCountdown(count);
      } else {
        clearInterval(countdownRef.current);
        setSosState("confirmation");
      }
    }, 1000);
  };

  // Cancel SOS
  const cancelSOS = () => {
    clearInterval(countdownRef.current);
    clearTimeout(timerRef.current);

    setCountdown(3);
    setSosState("idle");
  };

  // Confirm SOS
  const confirmSOS = () => {
    clearInterval(countdownRef.current);

    setSosState("active");

    // Fetch user location if not already obtained
    getLocation();

    // Log the SOS event in Firebase / Local storage
    recordSOSEvent({
      emergencyType: emergencyType || "Medical Emergency",
      location,
      contacts: contactPhone ? [{ name: contactName, phone: contactPhone }] : [],
      status: "Activated",
    }).catch((err) => {
      console.warn("Failed to record SOS event:", err);
    });
  };

  // Reset after SOS
  const resetSOS = () => {
    setSosState("idle");
    setCountdown(3);
    setShowAlertPreview(false);
    setAlertFeedback("");
  };

  // Location retrieval
  const getLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by this browser.");
      return;
    }

    setLocationLoading(true);
    setLocationError("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        setLocation({
          latitude,
          longitude,
          accuracy: position.coords.accuracy,
        });

        setLocationLoading(false);
      },
      (error) => {
        setLocationLoading(false);

        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError("Location permission was denied.");
            break;

          case error.POSITION_UNAVAILABLE:
            setLocationError("Location information is unavailable.");
            break;

          case error.TIMEOUT:
            setLocationError("Location request timed out.");
            break;

          default:
            setLocationError("Unable to get your location.");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 60000,
        maximumAge: 0,
      }
    );
  };

  // Send WhatsApp Alert
  const handleSendWhatsApp = async () => {
    if (!contactPhone) {
      alert("Please add or select a contact phone number first.");
      setActiveModal("contacts");
      return;
    }

    try {
      const res = await triggerWhatsAppAlert({
        phone_number: contactPhone,
        emergency_type: emergencyType,
        latitude: location?.latitude,
        longitude: location?.longitude,
        accuracy: location?.accuracy,
        user_name: userProfile?.fullName || "User",
      });

      if (res?.whatsapp_url) {
        window.open(res.whatsapp_url, "_blank");
        setAlertFeedback("✅ WhatsApp emergency alert opened. Tap send in WhatsApp to notify contact.");
      }
    } catch {
      setAlertFeedback("⚠️ Failed to open WhatsApp link. Please dial directly.");
    }
  };

  // Send SMS Alert
  const handleSendSMS = async () => {
    if (!contactPhone) {
      alert("Please add or select a contact phone number first.");
      setActiveModal("contacts");
      return;
    }

    try {
      const res = await triggerSMSAlert({
        phone_number: contactPhone,
        emergency_type: emergencyType,
        latitude: location?.latitude,
        longitude: location?.longitude,
        accuracy: location?.accuracy,
        user_name: userProfile?.fullName || "User",
      });

      setAlertFeedback(`✅ SMS alert sent successfully via ${res.provider || "emergency network"}.`);
    } catch {
      setAlertFeedback("⚠️ Failed to send SMS. Please call contact directly.");
    }
  };

  return (
    <div className="app">
      {/* HEADER */}
      <header className="header">
        <div className="logo">
          <span className="logo-icon">✚</span>
          <span>LifeLink</span>
        </div>

        <div className="header-actions">
          <button
            className="header-nav-btn danger"
            onClick={() => setActiveModal("services")}
            title="Official National Emergency Helplines"
          >
            🚨 112 / 108 Helplines
          </button>

          <button
            className="header-nav-btn purple"
            onClick={() => setActiveModal("fl")}
            title="Privacy-Preserving Federated Learning"
          >
            🧠 Federated AI
          </button>

          <button
            className="header-nav-btn"
            onClick={() => setActiveModal("profile")}
            title="Manage Medical Profile"
          >
            👤 {userProfile?.fullName ? userProfile.fullName.split(" ")[0] : "Profile"}
            {userProfile?.bloodGroup && userProfile.bloodGroup !== "Unknown" && (
              <span style={{ color: "#dc2626", fontWeight: 700, marginLeft: "4px" }}>
                ({userProfile.bloodGroup})
              </span>
            )}
          </button>

          <div className="status">
            <span className="status-dot"></span>
            System Ready
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="main-container">
        {/* WELCOME */}
        <section className="welcome">
          <p className="small-title">EMERGENCY HEALTHCARE COORDINATION</p>

          <h1>
            Help when you
            <span> need it most.</span>
          </h1>

          <p className="description">
            LifeLink connects you with emergency healthcare resources, hospitals, doctors, and emergency contacts
            using Agentic AI decision support and distributed privacy.
          </p>
        </section>

        {/* SOS CARD */}
        <section className="sos-card">
          {sosState === "idle" && (
            <>
              <div className="sos-icon">🚨</div>

              <h2>Emergency SOS</h2>

              <p>
                Press and hold the button for 3 seconds to start emergency assistance.
              </p>

              <button
                className="sos-button"
                onMouseDown={startSOS}
                onTouchStart={startSOS}
              >
                🚨 PRESS & HOLD SOS
              </button>

              <small>SOS activation will begin after holding the button.</small>
            </>
          )}

          {/* COUNTDOWN */}
          {sosState === "countdown" && (
            <>
              <div className="countdown-number">{countdown}</div>

              <h2>Emergency Detection</h2>

              <p>SOS activation will continue...</p>

              <button className="cancel-button" onClick={cancelSOS}>
                CANCEL
              </button>
            </>
          )}

          {/* CONFIRMATION */}
          {sosState === "confirmation" && (
            <>
              <div className="warning-icon">⚠️</div>

              <h2>Confirm Emergency</h2>

              <p>Are you currently experiencing an emergency?</p>

              <div className="confirmation-buttons">
                <button className="cancel-button" onClick={cancelSOS}>
                  NO, CANCEL
                </button>

                <button className="confirm-button" onClick={confirmSOS}>
                  YES, SEND SOS
                </button>
              </div>
            </>
          )}

          {/* ACTIVE SOS */}
          {sosState === "active" && (
            <>
              <div className="active-icon">🚨</div>

              <h2 className="active-title">SOS ACTIVATED</h2>

              <p>Your emergency request has been activated. Coordinating emergency logistics...</p>

              <div className="active-status">
                <div>
                  📍 <strong>GPS Location:</strong>{" "}
                  {locationLoading && "Acquiring GPS fix..."}
                  {!locationLoading && location && (
                    <span>
                      {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)} (±
                      {Math.round(location.accuracy)}m)
                    </span>
                  )}
                  {!locationLoading && !location && locationError && (
                    <span className="location-error">{locationError}</span>
                  )}
                  {!locationLoading && !location && !locationError && (
                    <button
                      onClick={getLocation}
                      style={{
                        marginLeft: "8px",
                        padding: "3px 8px",
                        fontSize: "12px",
                        borderRadius: "6px",
                      }}
                    >
                      Fetch GPS
                    </button>
                  )}
                </div>

                {/* EMERGENCY TYPE SELECTOR */}
                <div className="emergency-section">
                  <h3>🚨 Select Emergency Category:</h3>

                  <p className="emergency-subtitle">
                    Select the emergency category so LifeLink can route the appropriate specialists and equipment.
                  </p>

                  <div className="emergency-options">
                    {[
                      { type: "Accident", icon: "🚗" },
                      { type: "Medical Emergency", icon: "❤️" },
                      { type: "Pregnancy / Delivery", icon: "🤰" },
                      { type: "Severe Injury / Bleeding", icon: "🩸" },
                      { type: "Breathing Emergency", icon: "🫁" },
                      { type: "Child Emergency", icon: "👶" },
                      { type: "Other", icon: "⚠️" },
                    ].map(({ type, icon }) => (
                      <button
                        key={type}
                        className={
                          emergencyType === type ? "emergency-option selected" : "emergency-option"
                        }
                        onClick={() => setEmergencyType(type)}
                      >
                        {icon}
                        <span>{type}</span>
                      </button>
                    ))}
                  </div>

                  {emergencyType && (
                    <div className="selected-emergency">
                      ✅ Selected: <strong>{emergencyType}</strong>
                    </div>
                  )}
                </div>

                {/* EMERGENCY CONTACT DETAILS */}
                <div className="contact-section">
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "6px",
                    }}
                  >
                    <h3 style={{ margin: 0 }}>👨‍👩‍👧 Primary Emergency Contact</h3>
                    <button
                      onClick={() => setActiveModal("contacts")}
                      style={{
                        fontSize: "12px",
                        padding: "4px 10px",
                        background: "#fff",
                        border: "1px solid #cbd5e1",
                        borderRadius: "6px",
                        cursor: "pointer",
                      }}
                    >
                      Manage Contacts
                    </button>
                  </div>

                  <p className="contact-subtitle">
                    This contact receives your real-time GPS coordinates and emergency alert message.
                  </p>

                  <input
                    type="text"
                    placeholder="Contact name"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                  />

                  <input
                    type="tel"
                    placeholder="Contact phone number (+91...)"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                  />

                  {contactName && contactPhone && (
                    <div className="contact-success">
                      ✅ Emergency contact set: <strong>{contactName}</strong> ({contactPhone})
                    </div>
                  )}
                </div>

                {/* ACTION HUB */}
                <div className="sos-action-hub">
                  <button
                    className="action-hub-btn btn-ai"
                    onClick={() => setActiveModal("ai")}
                  >
                    🤖 Launch AI Agent
                  </button>

                  <button
                    className="action-hub-btn btn-hospital"
                    onClick={() => setActiveModal("hospitals")}
                  >
                    🏥 Find Hospitals
                  </button>

                  <a href="tel:108" className="action-hub-btn btn-ambulance">
                    🚑 Call 108 Ambulance
                  </a>

                  <button
                    className="action-hub-btn btn-whatsapp"
                    onClick={handleSendWhatsApp}
                  >
                    💬 WhatsApp Alert
                  </button>

                  <button
                    className="action-hub-btn btn-sms"
                    onClick={handleSendSMS}
                  >
                    📨 Send SMS Alert
                  </button>
                </div>

                {alertFeedback && (
                  <div
                    style={{
                      marginTop: "12px",
                      padding: "10px",
                      borderRadius: "8px",
                      background: "#f0fdf4",
                      color: "#166534",
                      fontSize: "13px",
                      fontWeight: 600,
                    }}
                  >
                    {alertFeedback}
                  </div>
                )}
              </div>

              {/* ALERT PREVIEW BUTTON */}
              <button
                className="alert-preview-button"
                onClick={() => setShowAlertPreview(true)}
                disabled={!emergencyType || !contactName || !contactPhone}
              >
                🚨 PREVIEW EMERGENCY ALERT MESSAGE
              </button>

              {/* PREVIEW CARD */}
              {showAlertPreview && (
                <div className="alert-preview">
                  <h3>🚨 LifeLink Emergency Alert Preview</h3>

                  <div className="alert-item">
                    <strong>Emergency Type:</strong>
                    <p>{emergencyType}</p>
                  </div>

                  <div className="alert-item">
                    <strong>📍 Location:</strong>
                    <p>
                      {location ? (
                        <>
                          Latitude: {location.latitude.toFixed(6)}
                          <br />
                          Longitude: {location.longitude.toFixed(6)}
                          <br />
                          Accuracy: ±{Math.round(location.accuracy)} meters
                        </>
                      ) : (
                        "Acquiring GPS coordinates..."
                      )}
                    </p>
                  </div>

                  {location && (
                    <a
                      className="maps-button"
                      href={`https://www.google.com/maps?q=${location.latitude},${location.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      🗺️ OPEN LOCATION IN GOOGLE MAPS
                    </a>
                  )}

                  <div className="alert-item">
                    <strong>👨‍👩‍👧 Emergency Contact:</strong>
                    <p>
                      Name: {contactName}
                      <br />
                      Phone: {contactPhone}
                    </p>
                  </div>

                  <div className="alert-warning">
                    ⚠️ This is an emergency alert preview. Click WhatsApp Alert or SMS Alert above to dispatch.
                  </div>

                  <button
                    className="close-preview-button"
                    onClick={() => setShowAlertPreview(false)}
                  >
                    CLOSE PREVIEW
                  </button>
                </div>
              )}

              <button className="reset-button" onClick={resetSOS}>
                RESET DEMO / DEACTIVATE SOS
              </button>
            </>
          )}
        </section>

        {/* QUICK ACCESS */}
        <section className="quick-section">
          <h2>Emergency Tools & Quick Access</h2>

          <div className="cards">
            {/* 1. LOCATION */}
            <div className="feature-card">
              <div className="feature-icon">📍</div>
              <h3>My GPS Location</h3>
              <p>Get precise live coordinates with accuracy estimation.</p>
              <button onClick={getLocation}>
                {locationLoading ? "Getting Location..." : "View Location"}
              </button>

              {location && (
                <div className="location-result">
                  <strong>Location Found</strong>
                  <p>Lat: {location.latitude.toFixed(6)}</p>
                  <p>Long: {location.longitude.toFixed(6)}</p>
                  <a
                    href={`https://www.google.com/maps?q=${location.latitude},${location.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-block",
                      marginTop: "6px",
                      fontSize: "12px",
                      color: "#2563eb",
                      fontWeight: 600,
                    }}
                  >
                    🗺️ Open Maps
                  </a>
                </div>
              )}

              {locationError && <p className="location-error">{locationError}</p>}
            </div>

            {/* 2. FIND HOSPITAL */}
            <div className="feature-card">
              <div className="feature-icon">🏥</div>
              <h3>Find Hospitals</h3>
              <p>Locate nearby 24/7 trauma centers and emergency wards.</p>
              <button onClick={() => setActiveModal("hospitals")}>
                Find Hospitals
              </button>
            </div>

            {/* 3. FIND DOCTORS */}
            <div className="feature-card">
              <div className="feature-icon">👨‍⚕️</div>
              <h3>Emergency Specialists</h3>
              <p>Explore trauma, cardiac, and perinatal clinical directories.</p>
              <button onClick={() => setActiveModal("doctors")}>
                Find Doctors
              </button>
            </div>

            {/* 4. EMERGENCY CONTACTS */}
            <div className="feature-card">
              <div className="feature-icon">👨‍👩‍👧</div>
              <h3>Emergency Contacts</h3>
              <p>Manage trusted guardians and designated primary SOS contacts.</p>
              <button onClick={() => setActiveModal("contacts")}>
                Manage Contacts
              </button>
            </div>

            {/* 5. OFFICIAL HELPLINES */}
            <div className="feature-card">
              <div className="feature-icon">📞</div>
              <h3>Emergency Services</h3>
              <p>Immediate 1-tap cellular dialing for 112, 108, and 102 helplines.</p>
              <button onClick={() => setActiveModal("services")}>
                View Helplines
              </button>
            </div>

            {/* 6. FEDERATED LEARNING */}
            <div className="feature-card">
              <div className="feature-icon">🧠</div>
              <h3>Federated AI Demo</h3>
              <p>Collaborative hospital machine learning preserving data privacy.</p>
              <button onClick={() => setActiveModal("fl")}>
                Explore Federated AI
              </button>
            </div>
          </div>
        </section>

        {/* AGENTIC AI CARD */}
        <section className="ai-card">
          <div className="ai-icon">🤖</div>

          <div>
            <h2>LifeLink AI Emergency Assistant</h2>
            <p>
              Autonomous Agentic AI that validates GPS coordinates, identifies nearest suitable hospital,
              generates tailored first-aid instructions, and prepares emergency alerts.
            </p>
            <button
              className="ai-card-btn"
              onClick={() => setActiveModal("ai")}
            >
              ⚡ Launch AI Emergency Coordinator
            </button>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer>
        <p>LifeLink • Intelligent Emergency Healthcare Coordination</p>
      </footer>

      {/* MODALS */}
      <AIAssistantModal
        isOpen={activeModal === "ai"}
        onClose={() => setActiveModal(null)}
        location={location}
        emergencyType={emergencyType || "Medical Emergency"}
        contactName={contactName}
        contactPhone={contactPhone}
      />

      <HospitalSearchModal
        isOpen={activeModal === "hospitals"}
        onClose={() => setActiveModal(null)}
        location={location}
        emergencyType={emergencyType}
      />

      <DoctorSpecialistModal
        isOpen={activeModal === "doctors"}
        onClose={() => setActiveModal(null)}
      />

      <EmergencyContactsModal
        isOpen={activeModal === "contacts"}
        onClose={() => setActiveModal(null)}
        onSelectPrimary={(contact) => {
          setContactName(contact.name);
          setContactPhone(contact.phone);
        }}
      />

      <EmergencyServicesModal
        isOpen={activeModal === "services"}
        onClose={() => setActiveModal(null)}
      />

      <FederatedLearningModal
        isOpen={activeModal === "fl"}
        onClose={() => setActiveModal(null)}
      />

      <UserProfileModal
        isOpen={activeModal === "profile"}
        onClose={() => setActiveModal(null)}
        onProfileUpdated={(profile) => setUserProfile(profile)}
      />
    </div>
  );
}

export default App;