import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: import.meta.env["VITE_FIREBASE_API_KEY"],
  authDomain: import.meta.env["VITE_FIREBASE_AUTH_DOMAIN"],
  projectId: import.meta.env["VITE_FIREBASE_PROJECT_ID"],
  storageBucket: import.meta.env["VITE_FIREBASE_STORAGE_BUCKET"],
  messagingSenderId: import.meta.env["VITE_FIREBASE_MESSAGING_SENDER_ID"],
  appId: import.meta.env["VITE_FIREBASE_APP_ID"],
  measurementId: import.meta.env["VITE_FIREBASE_MEASUREMENT_ID"],
};

const isConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

const app =
  getApps().length > 0
    ? getApp()
    : isConfigured
      ? initializeApp(firebaseConfig)
      : null;

export const db = app ? getFirestore(app) : (null as unknown as Firestore);

// Analytics is browser-only and guarded for environments where IndexedDB is restricted
export let analytics: ReturnType<typeof getAnalytics> | null = null;
if (typeof window !== "undefined" && app) {
  isSupported()
    .then((supported) => {
      if (supported) {
        analytics = getAnalytics(app);
      }
    })
    .catch(() => {});
}

