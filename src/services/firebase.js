// src/services/firebase.js
// Firebase client configuration with graceful local fallback for LifeLink AI

import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
  limit,
} from "firebase/firestore";

// Firebase configuration from Vite environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Check if actual configuration credentials are provided
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.apiKey !== "your_firebase_api_key_here" &&
  firebaseConfig.projectId &&
  firebaseConfig.projectId !== "lifelink-ai-emergency"
);

let app = null;
let db = null;

if (isFirebaseConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    console.log("LifeLink: Cloud Firestore initialized successfully.");
  } catch (err) {
    console.warn("LifeLink: Failed to initialize Firebase, falling back to local mode.", err);
  }
} else {
  console.info("LifeLink: Firebase credentials not configured. Running in Local Offline Storage mode.");
}

export { app, db };

// ---------------------------------------------------------------------
// Storage helpers with dual mode: Firestore when configured, LocalStorage otherwise
// ---------------------------------------------------------------------

const LOCAL_CONTACTS_KEY = "lifelink_emergency_contacts";
const LOCAL_EVENTS_KEY = "lifelink_sos_events";

/**
 * Get all emergency contacts
 */
export async function getEmergencyContacts() {
  if (db) {
    try {
      const colRef = collection(db, "emergency_contacts");
      const snapshot = await getDocs(colRef);
      return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    } catch (err) {
      console.warn("Firestore read failed, falling back to local storage:", err);
    }
  }

  // Local storage fallback
  try {
    const raw = localStorage.getItem(LOCAL_CONTACTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Add or update an emergency contact
 */
export async function saveEmergencyContact(contact) {
  const newContact = {
    ...contact,
    updatedAt: new Date().toISOString(),
  };

  if (db) {
    try {
      const colRef = collection(db, "emergency_contacts");
      const docRef = await addDoc(colRef, {
        ...newContact,
        createdAt: serverTimestamp(),
      });
      return { id: docRef.id, ...newContact };
    } catch (err) {
      console.warn("Firestore save failed, falling back to local storage:", err);
    }
  }

  // Local storage fallback
  const contacts = await getEmergencyContacts();
  const id = contact.id || "local_" + Date.now();
  const itemToSave = { ...newContact, id };

  const existingIndex = contacts.findIndex((c) => c.id === id);
  if (existingIndex >= 0) {
    contacts[existingIndex] = itemToSave;
  } else {
    contacts.push(itemToSave);
  }

  localStorage.setItem(LOCAL_CONTACTS_KEY, JSON.stringify(contacts));
  return itemToSave;
}

/**
 * Delete an emergency contact by ID
 */
export async function deleteEmergencyContact(contactId) {
  if (db && !contactId.startsWith("local_")) {
    try {
      await deleteDoc(doc(db, "emergency_contacts", contactId));
      return true;
    } catch (err) {
      console.warn("Firestore delete failed:", err);
    }
  }

  const contacts = await getEmergencyContacts();
  const filtered = contacts.filter((c) => c.id !== contactId);
  localStorage.setItem(LOCAL_CONTACTS_KEY, JSON.stringify(filtered));
  return true;
}

/**
 * Record a real SOS event
 * Statuses: 'Activated' | 'Location Pending' | 'Contact Notification Pending' |
 *           'Notification Sent' | 'Notification Failed' | 'Assistance Requested' | 'Resolved'
 */
export async function recordSOSEvent(eventData) {
  const eventPayload = {
    emergencyType: eventData.emergencyType || "Unspecified",
    location: eventData.location || null,
    locationAccuracy: eventData.location?.accuracy || null,
    contactsNotified: eventData.contacts || [],
    status: eventData.status || "Activated",
    statusHistory: [
      {
        status: eventData.status || "Activated",
        timestamp: new Date().toISOString(),
        note: "SOS initiated on device",
      },
    ],
    timestamp: new Date().toISOString(),
  };

  if (db) {
    try {
      const colRef = collection(db, "sos_events");
      const docRef = await addDoc(colRef, {
        ...eventPayload,
        serverCreatedAt: serverTimestamp(),
      });
      return { id: docRef.id, ...eventPayload, storage: "firestore" };
    } catch (err) {
      console.warn("Firestore event save failed:", err);
    }
  }

  // Local storage fallback
  const eventId = "sos_" + Date.now();
  const storedEvent = { id: eventId, ...eventPayload, storage: "local" };
  try {
    const raw = localStorage.getItem(LOCAL_EVENTS_KEY);
    const events = raw ? JSON.parse(raw) : [];
    events.unshift(storedEvent);
    localStorage.setItem(LOCAL_EVENTS_KEY, JSON.stringify(events.slice(0, 50)));
  } catch (err) {
    console.error("Local storage error:", err);
  }

  return storedEvent;
}

/**
 * Update the status of an active SOS event
 */
export async function updateSOSEventStatus(eventId, newStatus, note = "") {
  const updateEntry = {
    status: newStatus,
    timestamp: new Date().toISOString(),
    note,
  };

  if (db && !eventId.startsWith("sos_")) {
    try {
      const docRef = doc(db, "sos_events", eventId);
      await updateDoc(docRef, {
        status: newStatus,
        lastUpdated: serverTimestamp(),
      });
    } catch (err) {
      console.warn("Firestore event update failed:", err);
    }
  }

  // Local storage update
  try {
    const raw = localStorage.getItem(LOCAL_EVENTS_KEY);
    if (raw) {
      const events = JSON.parse(raw);
      const ev = events.find((e) => e.id === eventId);
      if (ev) {
        ev.status = newStatus;
        if (!ev.statusHistory) ev.statusHistory = [];
        ev.statusHistory.push(updateEntry);
        localStorage.setItem(LOCAL_EVENTS_KEY, JSON.stringify(events));
      }
    }
  } catch (err) {
    console.error("Failed to update local SOS event:", err);
  }
}

/**
 * Retrieve past SOS events
 */
export async function getSOSEventsList(limitCount = 10) {
  if (db) {
    try {
      const q = query(collection(db, "sos_events"), orderBy("serverCreatedAt", "desc"), limit(limitCount));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    } catch (err) {
      console.warn("Firestore events query failed:", err);
    }
  }

  try {
    const raw = localStorage.getItem(LOCAL_EVENTS_KEY);
    return raw ? JSON.parse(raw).slice(0, limitCount) : [];
  } catch {
    return [];
  }
}
