import type { Lang, Answers } from "@/lib/survey";

export interface SurveyDraft {
  lang: Lang;
  step: number;
  responseId: string;
  answers: Answers;
  audioBlobs: Record<string, Blob>;
  files?: Record<string, File | Blob>;
  updatedAt: number;
}

const DB_NAME = "kumbh_survey_db";
const STORE_NAME = "draft";
const DRAFT_KEY = "current_draft";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB not available"));
      return;
    }
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Saves survey progress (including recorded audio blobs) into IndexedDB.
 */
export async function saveDraft(draft: SurveyDraft): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const req = tx.objectStore(STORE_NAME).put(draft, DRAFT_KEY);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    // Fallback: save metadata & text in localStorage if IndexedDB is blocked
    try {
      const textOnly = { ...draft, audioBlobs: {}, files: {} };
      localStorage.setItem("kumbh_survey_draft_text", JSON.stringify(textOnly));
    } catch {}
  }
}

/**
 * Loads saved survey draft if one exists.
 */
export async function loadDraft(): Promise<SurveyDraft | null> {
  try {
    const db = await openDB();
    return await new Promise<SurveyDraft | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const req = tx.objectStore(STORE_NAME).get(DRAFT_KEY);
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    try {
      const saved = localStorage.getItem("kumbh_survey_draft_text");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  }
}

/**
 * Deletes saved draft on successful submission or manual restart.
 */
export async function clearDraft(): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const req = tx.objectStore(STORE_NAME).delete(DRAFT_KEY);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {}
  try {
    localStorage.removeItem("kumbh_survey_draft_text");
  } catch {}
}
