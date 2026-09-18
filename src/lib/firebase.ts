import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAOC7uGygG3-acnRcl1SzzXHnu4v81HsKM",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "kumbh-mela-survey.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "kumbh-mela-survey",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "kumbh-mela-survey.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "344396030287",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:344396030287:web:be0f6e809b6189c54a253a",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-8DVR7Y800K",
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const db = getFirestore(app);

// Analytics is browser-only and guarded for environments where IndexedDB is restricted
export let analytics: ReturnType<typeof getAnalytics> | null = null;
if (typeof window !== "undefined") {
  isSupported()
    .then((supported) => {
      if (supported) {
        analytics = getAnalytics(app);
      }
    })
    .catch(() => {});
}
