export type Lang = "en" | "hi" | "mr";

export type QuestionType = "text" | "longtext" | "rating" | "choice";

export interface Question {
  id: string;
  type: QuestionType;
  label: Record<Lang, string>;
  options?: Record<Lang, string[]>;
}

export const LANGUAGES: { code: Lang; label: string; native: string; speech: string }[] = [
  { code: "en", label: "English", native: "English", speech: "en-IN" },
  { code: "hi", label: "Hindi", native: "हिन्दी", speech: "hi-IN" },
  { code: "mr", label: "Marathi", native: "मराठी", speech: "mr-IN" },
];

export const UI = {
  en: {
    title: "Kumbh Mela Visitor Survey",
    subtitle: "Your feedback helps improve the experience for millions of pilgrims.",
    chooseLang: "Choose your language",
    start: "Start survey",
    next: "Next",
    back: "Back",
    submit: "Submit",
    required: "This question is required",
    yourAnswer: "Your answer",
    question: "Question",
    of: "of",
    voiceType: "Voice typing",
    listening: "Listening…",
    record: "Record audio answer",
    stop: "Stop recording",
    rerecord: "Record again",
    done: "Response recorded",
    thanks: "Thank you!",
    thanksBody: "Your response has been recorded.",
    another: "Submit another response",
    review: "Review your answers",
    noSpeech: "Voice typing is not supported in this browser.",
    noMic: "Microphone is not available in this browser.",
    skip: "Skip",
  },
  hi: {
    title: "कुंभ मेला आगंतुक सर्वेक्षण",
    subtitle: "आपकी प्रतिक्रिया लाखों श्रद्धालुओं का अनुभव बेहतर बनाने में मदद करती है।",
    chooseLang: "अपनी भाषा चुनें",
    start: "सर्वेक्षण शुरू करें",
    next: "आगे",
    back: "पीछे",
    submit: "जमा करें",
    required: "यह प्रश्न आवश्यक है",
    yourAnswer: "आपका उत्तर",
    question: "प्रश्न",
    of: "में से",
    voiceType: "बोलकर लिखें",
    listening: "सुन रहे हैं…",
    record: "ऑडियो उत्तर रिकॉर्ड करें",
    stop: "रिकॉर्डिंग रोकें",
    rerecord: "फिर से रिकॉर्ड करें",
    done: "उत्तर रिकॉर्ड हुआ",
    thanks: "धन्यवाद!",
    thanksBody: "आपका उत्तर दर्ज कर लिया गया है।",
    another: "एक और प्रतिक्रिया भेजें",
    review: "अपने उत्तर देखें",
    noSpeech: "इस ब्राउज़र में बोलकर लिखना उपलब्ध नहीं है।",
    noMic: "इस ब्राउज़र में माइक्रोफ़ोन उपलब्ध नहीं है।",
    skip: "छोड़ें",
  },
  mr: {
    title: "कुंभमेळा अभ्यागत सर्वेक्षण",
    subtitle: "तुमचा अभिप्राय लाखो भाविकांचा अनुभव सुधारण्यास मदत करतो.",
    chooseLang: "तुमची भाषा निवडा",
    start: "सर्वेक्षण सुरू करा",
    next: "पुढे",
    back: "मागे",
    submit: "सबमिट करा",
    required: "हा प्रश्न आवश्यक आहे",
    yourAnswer: "तुमचे उत्तर",
    question: "प्रश्न",
    of: "पैकी",
    voiceType: "बोलून लिहा",
    listening: "ऐकत आहे…",
    record: "ऑडिओ उत्तर रेकॉर्ड करा",
    stop: "रेकॉर्डिंग थांबवा",
    rerecord: "पुन्हा रेकॉर्ड करा",
    done: "उत्तर रेकॉर्ड झाले",
    thanks: "धन्यवाद!",
    thanksBody: "तुमचे उत्तर नोंदवले गेले आहे.",
    another: "आणखी एक प्रतिसाद द्या",
    review: "तुमची उत्तरे पहा",
    noSpeech: "या ब्राउझरमध्ये बोलून लिहिणे उपलब्ध नाही.",
    noMic: "या ब्राउझरमध्ये मायक्रोफोन उपलब्ध नाही.",
    skip: "वगळा",
  },
};

const yesNo: Record<Lang, string[]> = {
  en: ["Yes", "No", "Partly"],
  hi: ["हाँ", "नहीं", "आंशिक रूप से"],
  mr: ["होय", "नाही", "अंशतः"],
};

export const QUESTIONS: Question[] = [
  {
    id: "name",
    type: "text",
    label: {
      en: "What is your full name?",
      hi: "आपका पूरा नाम क्या है?",
      mr: "तुमचे पूर्ण नाव काय आहे?",
    },
  },
  {
    id: "state",
    type: "text",
    label: {
      en: "Which state are you from?",
      hi: "आप किस राज्य से हैं?",
      mr: "तुम्ही कोणत्या राज्यातून आला आहात?",
    },
  },
  {
    id: "experience",
    type: "rating",
    label: {
      en: "Rate your overall experience at Kumbh Mela",
      hi: "कुंभ मेले में अपने समग्र अनुभव को रेट करें",
      mr: "कुंभमेळ्यातील तुमच्या एकूण अनुभवाला गुण द्या",
    },
  },
  {
    id: "reason",
    type: "choice",
    label: {
      en: "What was your primary reason for attending?",
      hi: "आने का आपका मुख्य कारण क्या था?",
      mr: "सहभागी होण्याचे तुमचे मुख्य कारण काय होते?",
    },
    options: {
      en: ["Religious / spiritual", "Family tradition", "Tourism", "Work / duty", "Other"],
      hi: ["धार्मिक / आध्यात्मिक", "पारिवारिक परंपरा", "पर्यटन", "कार्य / ड्यूटी", "अन्य"],
      mr: ["धार्मिक / आध्यात्मिक", "कौटुंबिक परंपरा", "पर्यटन", "काम / कर्तव्य", "इतर"],
    },
  },
  {
    id: "travel",
    type: "choice",
    label: {
      en: "What was your mode of travel?",
      hi: "आपकी यात्रा का माध्यम क्या था?",
      mr: "तुमचा प्रवासाचा मार्ग कोणता होता?",
    },
    options: {
      en: ["Train", "Bus", "Car / taxi", "Two-wheeler", "On foot", "Other"],
      hi: ["ट्रेन", "बस", "कार / टैक्सी", "दोपहिया", "पैदल", "अन्य"],
      mr: ["रेल्वे", "बस", "कार / टॅक्सी", "दुचाकी", "पायी", "इतर"],
    },
  },
  {
    id: "accommodation",
    type: "rating",
    label: {
      en: "How satisfied were you with accommodation and sanitation?",
      hi: "आवास और स्वच्छता से आप कितने संतुष्ट थे?",
      mr: "निवास व स्वच्छतेबाबत तुम्ही किती समाधानी होता?",
    },
  },
  {
    id: "safety",
    type: "choice",
    label: {
      en: "Did you feel safe at the Kumbh Mela?",
      hi: "क्या आपने कुंभ मेले में सुरक्षित महसूस किया?",
      mr: "कुंभमेळ्यात तुम्हाला सुरक्षित वाटले का?",
    },
    options: yesNo,
  },
  {
    id: "medical_adequate",
    type: "choice",
    label: {
      en: "Were the medical / emergency facilities adequate?",
      hi: "क्या चिकित्सा / आपातकालीन सुविधाएँ पर्याप्त थीं?",
      mr: "वैद्यकीय / आपत्कालीन सुविधा पुरेशा होत्या का?",
    },
    options: yesNo,
  },
  {
    id: "medical_needed",
    type: "choice",
    label: {
      en: "Did anyone in your group need medical help?",
      hi: "क्या आपके समूह में किसी को चिकित्सा सहायता की आवश्यकता पड़ी?",
      mr: "तुमच्या गटातील कोणाला वैद्यकीय मदतीची गरज पडली का?",
    },
    options: {
      en: ["Yes", "No"],
      hi: ["हाँ", "नहीं"],
      mr: ["होय", "नाही"],
    },
  },
  {
    id: "crowd",
    type: "rating",
    label: {
      en: "Rate crowd management",
      hi: "भीड़ प्रबंधन को रेट करें",
      mr: "गर्दी व्यवस्थापनाला गुण द्या",
    },
  },
  {
    id: "time_help",
    type: "longtext",
    label: {
      en: "How much time did you spend in Prayagraj? Did you get help from local authorities?",
      hi: "आपने प्रयागराज में कितना समय बिताया? क्या स्थानीय प्रशासन से सहायता मिली?",
      mr: "तुम्ही प्रयागराजमध्ये किती वेळ घालवला? स्थानिक प्रशासनाकडून मदत मिळाली का?",
    },
  },
  {
    id: "transport",
    type: "choice",
    label: {
      en: "Were transportation services adequate?",
      hi: "क्या परिवहन सेवाएँ पर्याप्त थीं?",
      mr: "वाहतूक सेवा पुरेशा होत्या का?",
    },
    options: yesNo,
  },
  {
    id: "information",
    type: "choice",
    label: {
      en: "Were information services helpful?",
      hi: "क्या सूचना सेवाएँ सहायक थीं?",
      mr: "माहिती सेवा उपयुक्त होत्या का?",
    },
    options: yesNo,
  },
  {
    id: "spiritual",
    type: "rating",
    label: {
      en: "Was the spiritual / cultural aspect fulfilling?",
      hi: "क्या आध्यात्मिक / सांस्कृतिक पक्ष संतोषजनक रहा?",
      mr: "आध्यात्मिक / सांस्कृतिक अनुभव समाधानकारक होता का?",
    },
  },
  {
    id: "challenges",
    type: "longtext",
    label: {
      en: "What challenges did you face?",
      hi: "आपको किन कठिनाइयों का सामना करना पड़ा?",
      mr: "तुम्हाला कोणत्या अडचणी आल्या?",
    },
  },
  {
    id: "utilities",
    type: "choice",
    label: {
      en: "Did you get continuous electricity & internet?",
      hi: "क्या आपको निरंतर बिजली और इंटरनेट मिला?",
      mr: "तुम्हाला सतत वीज व इंटरनेट मिळाले का?",
    },
    options: yesNo,
  },
  {
    id: "suggestions",
    type: "longtext",
    label: {
      en: "Suggestions to improve medical / emergency facilities?",
      hi: "चिकित्सा / आपातकालीन सुविधाओं को बेहतर बनाने के सुझाव?",
      mr: "वैद्यकीय / आपत्कालीन सुविधा सुधारण्यासाठी सूचना?",
    },
  },
];

export interface Answer {
  text: string;
  audioUrl?: string | undefined;
}

export type Answers = Record<string, Answer>;

export interface StoredResponse {
  id: string;
  lang: Lang;
  submittedAt: string;
  answers: Answers;
}

const KEY = "kumbh-survey-responses";

// ─── localStorage helpers (fallback) ────────────────────────────────────────

function loadLocal(): StoredResponse[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(KEY) ?? "[]") as StoredResponse[];
  } catch {
    return [];
  }
}

function saveLocal(res: StoredResponse) {
  if (typeof window === "undefined") return;
  const all = loadLocal();
  all.unshift(res);
  window.localStorage.setItem(KEY, JSON.stringify(all.slice(0, 200)));
}

// ─── Firestore ───────────────────────────────────────────────────────────────

/**
 * Strips undefined properties recursively so Firestore does not reject the document.
 */
function sanitizeForFirestore<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

/**
 * Save a survey response to Firestore.
 * Also persists to localStorage as offline cache/fallback.
 */
export async function saveResponse(res: StoredResponse): Promise<void> {
  // Always persist locally as cache/fallback
  saveLocal(res);

  try {
    const { db } = await import("@/lib/firebase");
    const { doc, setDoc } = await import("firebase/firestore");
    const cleanData = sanitizeForFirestore(res);
    await setDoc(doc(db, "responses", res.id), cleanData);
  } catch (err) {
    console.error("[survey] Firestore save failed, kept in localStorage:", err);
  }
}

/**
 * Load all survey responses from Firestore (ordered newest-first).
 * Merges any local-only cache so no submitted response is missing.
 */
export async function loadResponses(): Promise<StoredResponse[]> {
  try {
    const { db } = await import("@/lib/firebase");
    const { collection, getDocs, orderBy, query } = await import("firebase/firestore");
    const q = query(collection(db, "responses"), orderBy("submittedAt", "desc"));
    const snap = await getDocs(q);
    const firestoreData = snap.docs.map((d) => d.data() as StoredResponse);

    // Merge with any local cache that hasn't synced yet
    const map = new Map<string, StoredResponse>();
    firestoreData.forEach((r) => map.set(r.id, r));
    loadLocal().forEach((r) => {
      if (!map.has(r.id)) map.set(r.id, r);
    });

    return Array.from(map.values()).sort(
      (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    );
  } catch (err) {
    console.error("[survey] Firestore load failed, falling back to localStorage:", err);
    return loadLocal();
  }
}
