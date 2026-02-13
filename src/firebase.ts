import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore"; // <--- CHANGED THIS

const firebaseConfig = {
  apiKey: "AIzaSyDAui7cKWfCAOy0WWGKkRv0Edu5lzC7S_I",
  authDomain: "drive-notes-41640.firebaseapp.com",
  projectId: "drive-notes-41640",
  storageBucket: "drive-notes-41640.firebasestorage.app",
  messagingSenderId: "966628829941",
  appId: "1:966628829941:web:1974fc8595aca9514b73bc",
  measurementId: "G-T19JC05MNV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// --- THIS IS THE PART YOU WERE MISSING ---
export const db = getFirestore(app);