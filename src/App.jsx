import { useState, useRef } from "react";
import "./App.css";

function App() {
  const [sosState, setSosState] = useState("idle");
  const [countdown, setCountdown] = useState(3);
  const [location, setLocation] = useState(null);
const [locationError, setLocationError] = useState("");
const [locationLoading, setLocationLoading] = useState(false);
const [emergencyType, setEmergencyType] = useState("");
const [contactName, setContactName] = useState("");
const [contactPhone, setContactPhone] = useState("");
  const timerRef = useRef(null);
  const countdownRef = useRef(null);

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

  // Get the user's location
  getLocation();
};

  // Reset after SOS
  const resetSOS = () => {
    setSosState("idle");
    setCountdown(3);
  };
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

  return (
    <div className="app">

      {/* HEADER */}
      <header className="header">
        <div className="logo">
          <span className="logo-icon">✚</span>
          <span>LifeLink</span>
        </div>

        <div className="status">
          <span className="status-dot"></span>
          System Ready
        </div>
      </header>

      {/* MAIN */}
      <main className="main-container">

        {/* WELCOME */}
        <section className="welcome">

          <p className="small-title">
            EMERGENCY HEALTHCARE COORDINATION
          </p>

          <h1>
            Help when you
            <span> need it most.</span>
          </h1>

          <p className="description">
            LifeLink connects you with emergency healthcare
            resources, hospitals, doctors and emergency contacts.
          </p>

        </section>

        {/* SOS CARD */}
        <section className="sos-card">

          {sosState === "idle" && (
            <>
              <div className="sos-icon">🚨</div>

              <h2>Emergency SOS</h2>

              <p>
                Press and hold the button for 3 seconds
                to start emergency assistance.
              </p>

              <button
                className="sos-button"
                onMouseDown={startSOS}
                onTouchStart={startSOS}
              >
                🚨 PRESS & HOLD SOS
              </button>

              <small>
                SOS activation will begin after holding the button.
              </small>
            </>
          )}

          {/* COUNTDOWN */}
          {sosState === "countdown" && (
            <>
              <div className="countdown-number">
                {countdown}
              </div>

              <h2>Emergency Detection</h2>

              <p>
                SOS activation will continue...
              </p>

              <button
                className="cancel-button"
                onClick={cancelSOS}
              >
                CANCEL
              </button>
            </>
          )}

          {/* CONFIRMATION */}
          {sosState === "confirmation" && (
            <>
              <div className="warning-icon">
                ⚠️
              </div>

              <h2>Confirm Emergency</h2>

              <p>
                Are you currently experiencing an emergency?
              </p>

              <div className="confirmation-buttons">

                <button
                  className="cancel-button"
                  onClick={cancelSOS}
                >
                  NO, CANCEL
                </button>

                <button
                  className="confirm-button"
                  onClick={confirmSOS}
                >
                  YES, SEND SOS
                </button>

              </div>
            </>
          )}

          {/* ACTIVE SOS */}
          {sosState === "active" && (
            <>
              <div className="active-icon">
                🚨
              </div>

              <h2 className="active-title">
                SOS ACTIVATED
              </h2>

              <p>
                Your emergency request has been activated.
              </p>

            <div className="active-status">

  <div>
    📍 Location:{" "}

    {locationLoading && "Getting location..."}

    {!locationLoading && location && (
      <>
        Location received
        <br />
        Latitude: {location.latitude.toFixed(6)}
        <br />
        Longitude: {location.longitude.toFixed(6)}
        <br />
        Accuracy: {Math.round(location.accuracy)} meters
      </>
    )}

    {!locationLoading && !location && locationError && (
      <span className="location-error">
        {locationError}
      </span>
    )}
  </div>
  {/* EMERGENCY TYPE */}
<div className="emergency-section">

  <h3>🚨 What is the emergency?</h3>

  <p className="emergency-subtitle">
    Select the situation so LifeLink can coordinate the appropriate help.
  </p>

  <div className="emergency-options">

    <button
      className={
        emergencyType === "Accident"
          ? "emergency-option selected"
          : "emergency-option"
      }
      onClick={() => setEmergencyType("Accident")}
    >
      🚗
      <span>Accident</span>
    </button>

    <button
      className={
        emergencyType === "Medical Emergency"
          ? "emergency-option selected"
          : "emergency-option"
      }
      onClick={() => setEmergencyType("Medical Emergency")}
    >
      ❤️
      <span>Medical Emergency</span>
    </button>

    <button
      className={
        emergencyType === "Pregnancy / Delivery"
          ? "emergency-option selected"
          : "emergency-option"
      }
      onClick={() => setEmergencyType("Pregnancy / Delivery")}
    >
      🤰
      <span>Pregnancy / Delivery</span>
    </button>

    <button
      className={
        emergencyType === "Severe Injury / Bleeding"
          ? "emergency-option selected"
          : "emergency-option"
      }
      onClick={() => setEmergencyType("Severe Injury / Bleeding")}
    >
      🩸
      <span>Severe Injury / Bleeding</span>
    </button>

    <button
      className={
        emergencyType === "Breathing Emergency"
          ? "emergency-option selected"
          : "emergency-option"
      }
      onClick={() => setEmergencyType("Breathing Emergency")}
    >
      🫁
      <span>Breathing Emergency</span>
    </button>

    <button
      className={
        emergencyType === "Child Emergency"
          ? "emergency-option selected"
          : "emergency-option"
      }
      onClick={() => setEmergencyType("Child Emergency")}
    >
      👶
      <span>Child Emergency</span>
    </button>

    <button
      className={
        emergencyType === "Other"
          ? "emergency-option selected"
          : "emergency-option"
      }
      onClick={() => setEmergencyType("Other")}
    >
      ⚠️
      <span>Other</span>
    </button>

  </div>

  {emergencyType && (
    <div className="selected-emergency">
      ✅ Selected: <strong>{emergencyType}</strong>
    </div>
  )}

</div>

  <div>🤖 AI Agent: Pending</div>

  <div>🏥 Healthcare Search: Pending</div>

 
</div>
{/* EMERGENCY CONTACT */}
<div className="contact-section">

  <h3>👨‍👩‍👧 Emergency Contact</h3>

  <p className="contact-subtitle">
    Enter a trusted contact who should receive the emergency information.
  </p>

  <input
    type="text"
    placeholder="Contact name"
    value={contactName}
    onChange={(e) => setContactName(e.target.value)}
  />

  <input
    type="tel"
    placeholder="Contact phone number"
    value={contactPhone}
    onChange={(e) => setContactPhone(e.target.value)}
  />

  {contactName && contactPhone && (
    <div className="contact-success">
      ✅ Emergency contact added:
      <strong> {contactName}</strong>
    </div>
  )}

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

              <button
                className="reset-button"
                onClick={resetSOS}
              >
                RESET DEMO
              </button>
            </>
          )}

        </section>

        {/* QUICK ACCESS */}
        <section className="quick-section">

          <h2>Quick Access</h2>

          <div className="cards">

            <div className="feature-card">
  <div className="feature-icon">📍</div>

  <h3>My Location</h3>

  <p>
    Get your current GPS location.
  </p>

  <button onClick={getLocation}>
    {locationLoading ? "Getting Location..." : "View Location"}
  </button>

  {location && (
    <div className="location-result">
      <strong>Location Found</strong>

      <p>
        Lat: {location.latitude.toFixed(6)}
      </p>

      <p>
        Long: {location.longitude.toFixed(6)}
      </p>
    </div>
  )}

  {locationError && (
    <p className="location-error">
      {locationError}
    </p>
  )}
</div>

            <div className="feature-card">
              <div className="feature-icon">🏥</div>

              <h3>Find Hospital</h3>

              <p>
                Find nearby emergency healthcare facilities.
              </p>

              <button>
                Find Hospitals
              </button>
            </div>

            <div className="feature-card">
              <div className="feature-icon">👨‍⚕️</div>

              <h3>Find Doctor</h3>

              <p>
                Find doctors and relevant specialists.
              </p>

              <button>
                Find Doctors
              </button>
            </div>

            <div className="feature-card">
              <div className="feature-icon">👨‍👩‍👧</div>

              <h3>Emergency Contacts</h3>

              <p>
                Manage your emergency contacts.
              </p>

              <button>
                Manage Contacts
              </button>
            </div>

          </div>

        </section>

        {/* AI CARD */}
        <section className="ai-card">

          <div className="ai-icon">
            🤖
          </div>

          <div>

            <h2>
              LifeLink AI Emergency Assistant
            </h2>

            <p>
              Agentic AI will coordinate emergency
              information, healthcare facilities and
              emergency contacts.
            </p>

          </div>

          <span className="coming-soon">
            COMING SOON
          </span>

        </section>

      </main>

      <footer>
        <p>
          LifeLink • Intelligent Emergency Healthcare Coordination
        </p>
      </footer>

    </div>
  );
}

export default App;