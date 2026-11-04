export type Lang = "en" | "hi" | "mr";

export type QuestionType =
  | "text"
  | "longtext"
  | "choice"
  | "checkbox"
  | "number_unit"
  | "file_upload"
  | "file_text"
  | "rating";

export interface SectionMeta {
  letter: "A" | "B" | "C" | "D" | "E";
  title: Record<Lang, string>;
}

export interface Question {
  id: string;
  section: "A" | "B" | "C" | "D" | "E";
  type: QuestionType;
  required?: boolean;
  allowOther?: boolean;
  exclusiveOptionIndex?: number;
  label: Record<Lang, string>;
  hint?: Record<Lang, string>;
  options?: Record<Lang, string[]>;
}

export const LANGUAGES: { code: Lang; label: string; native: string; speech: string }[] = [
  { code: "en", label: "English", native: "English", speech: "en-IN" },
  { code: "hi", label: "Hindi", native: "हिन्दी", speech: "hi-IN" },
  { code: "mr", label: "Marathi", native: "मराठी", speech: "mr-IN" },
];

export const SECTIONS: Record<"A" | "B" | "C" | "D" | "E", SectionMeta> = {
  A: {
    letter: "A",
    title: {
      en: "Section A – Visitor Background and Visit Details",
      hi: "खंड अ – आपकी जानकारी और यात्रा का विवरण",
      mr: "विभाग अ – तुमची माहिती आणि प्रवासाचा तपशील",
    },
  },
  B: {
    letter: "B",
    title: {
      en: "Section B – Facilities and Visitor Experience",
      hi: "खंड ब – सुविधाएं और आपका अनुभव",
      mr: "विभाग ब – सुविधा आणि तुमचा अनुभव",
    },
  },
  C: {
    letter: "C",
    title: {
      en: "Section C – Crowd Management and Technology",
      hi: "खंड स – भीड़ नियंत्रण और टेक्नोलॉजी",
      mr: "विभाग क – गर्दीचे नियोजन आणि तंत्रज्ञान",
    },
  },
  D: {
    letter: "D",
    title: {
      en: "Section D – Information, Communication and Basic Infrastructure",
      hi: "खंड द – जानकारी, संपर्क और बुनियादी सुविधाएं (बिजली, इंटरनेट)",
      mr: "विभाग ड – माहिती, संपर्क आणि मूलभूत सोयी (वीज, इंटरनेट)",
    },
  },
  E: {
    letter: "E",
    title: {
      en: "Section E – Impact and Future Improvements",
      hi: "खंड इ – प्रभाव और भविष्य के लिए सुझाव",
      mr: "विभाग इ – प्रभाव आणि भविष्यातील सुधारणा",
    },
  },
};

export const UI = {
  en: {
    institution: "K K Wagh Institute of Engineering Education and Research, Nashik\nDepartment of MCA",
    title: "Kumbh Mela – Pilgrim Experience and Suggestions Form",
    subtitle: "कुंभ मेला - अनुभव एवं सुझाव फ़ॉर्म",
    chooseLang: "Choose your language",
    start: "Start survey",
    next: "Next",
    back: "Back",
    submit: "Submit",
    required: "This question is required",
    optional: "Optional",
    yourAnswer: "Your answer",
    question: "Question",
    of: "of",
    section: "Section",
    voiceType: "Voice typing",
    listening: "Listening…",
    record: "Record audio answer",
    stop: "Stop recording",
    stopHint: "Click 'Stop recording' when done speaking.",
    rerecord: "Record again",
    done: "Response recorded",
    thanks: "Thank you!",
    thanksBody: "Your response has been recorded. Your insights will help make future Kumbh Mela events more visitor-friendly.",
    another: "Submit another response",
    review: "Review your answers",
    noSpeech: "Voice typing is not supported in this browser.",
    noMic: "Microphone is not available in this browser.",
    skip: "Skip",
    specifyOther: "Please specify details...",
    specifyReason: "Please specify...",
    uploadPhotosVideos: "Share photographs or videos of your Kumbh Mela visit",
    uploadFile: "Upload photo or video",
    uploadMoreFiles: "Add more photos or videos",
    chooseFile: "Choose file",
    noFileChosen: "No file chosen",
    fileAttached: "File attached",
    filesAttached: "files attached",
    removeFile: "Remove",
    uploadHint: "Photos or videos (Total max 10MB)",
    fileTooLarge: "Total file size exceeds 10MB limit. Please choose smaller files.",
    phonePlaceholder: "e.g. 9876543210 (WhatsApp number)",
    cityPlaceholder: "e.g. Nashik, Pune, Mumbai, Prayagraj...",
    clearSelection: "Clear",
    confirmTitle: "Submit your response?",
    confirmMsg: "Once submitted, your answers cannot be changed.",
    confirmYes: "Yes, submit",
    confirmCancel: "Go back",
    detectLocation: "Use current location",
    detectingLocation: "Detecting location…",
    locationDetected: "Detected: ",
    locationError: "Could not detect city. Please enter manually.",
    locationDenied: "Location permission denied. Please enter manually.",
    nameRequired: "Please enter your name",
    phoneRequired: "Please enter a valid 10-digit mobile number",
    cityRequired: "Please enter your city",
    sectionOverview: "5 Survey Sections:",
  },
  hi: {
    institution: "के के वाघ इंस्टीट्यूट ऑफ इंजीनियरिंग एजुकेशन एंड रिसर्च, नासिक\nएमसीए विभाग",
    title: "कुंभ मेला – अनुभव एवं सुझाव फ़ॉर्म",
    subtitle: "कुंभ मेला - अनुभव एवं सुझाव फ़ॉर्म",
    chooseLang: "अपनी भाषा चुनें",
    start: "सर्वेक्षण शुरू करें",
    next: "आगे",
    back: "पीछे",
    submit: "जमा करें",
    required: "यह प्रश्न आवश्यक है",
    optional: "वैकल्पिक",
    yourAnswer: "आपका उत्तर",
    question: "प्रश्न",
    of: "में से",
    section: "खंड",
    voiceType: "बोलकर लिखें",
    listening: "सुन रहे हैं…",
    record: "ऑडियो उत्तर रिकॉर्ड करें",
    stop: "रिकॉर्डिंग रोकें",
    stopHint: "बोलना पूरा होने पर 'रिकॉर्डिंग रोकें' बटन दबाएं।",
    rerecord: "फिर से रिकॉर्ड करें",
    done: "उत्तर रिकॉर्ड हुआ",
    thanks: "धन्यवाद!",
    thanksBody: "आपकी प्रतिक्रिया दर्ज कर ली गई है। आपके सुझाव भविष्य के कुंभ मेले को श्रद्धालुओं के लिए और अधिक सुविधाजनक बनाने में मदद करेंगे।",
    another: "एक और प्रतिक्रिया भेजें",
    review: "अपने उत्तर देखें",
    noSpeech: "इस ब्राउज़र में बोलकर लिखना उपलब्ध नहीं है।",
    noMic: "इस ब्राउज़र में माइक्रोफ़ोन उपलब्ध नहीं है।",
    skip: "छोड़ें",
    specifyOther: "कृपया विवरण लिखें...",
    specifyReason: "कृपया कारण लिखें...",
    uploadPhotosVideos: "अपनी कुंभ मेला यात्रा की तस्वीरें या वीडियो साझा करें",
    uploadFile: "फ़ोटो या वीडियो अपलोड करें",
    uploadMoreFiles: "और फ़ोटो या वीडियो जोड़ें",
    chooseFile: "फ़ाइल चुनें",
    noFileChosen: "कोई फ़ाइल नहीं चुनी गई",
    fileAttached: "फ़ाइल संलग्न है",
    filesAttached: "फ़ाइलें संलग्न हैं",
    removeFile: "हटाएं",
    uploadHint: "फ़ोटो या वीडियो (कुल अधिकतम 10MB)",
    fileTooLarge: "फ़ाइलों का कुल आकार 10MB की सीमा से अधिक है। कृपया छोटी फ़ाइलें चुनें।",
    phonePlaceholder: "उदा. 9876543210 (व्हाट्सएप नंबर)",
    cityPlaceholder: "उदा. नासिक, पुणे, मुंबई, प्रयागराज...",
    clearSelection: "हटाएं",
    confirmTitle: "अपना उत्तर जमा करें?",
    confirmMsg: "एक बार जमा होने के बाद आपके उत्तर बदले नहीं जा सकते।",
    confirmYes: "हाँ, जमा करें",
    confirmCancel: "वापस जाएं",
    detectLocation: "मेरा वर्तमान स्थान पहचानें",
    detectingLocation: "स्थान खोज रहे हैं…",
    locationDetected: "स्थान पहचाना गया: ",
    locationError: "स्थान की पहचान नहीं हो सकी। कृपया खुद लिखें।",
    locationDenied: "स्थान की अनुमति नहीं मिली। कृपया खुद लिखें।",
    nameRequired: "कृपया अपना नाम लिखें",
    phoneRequired: "कृपया 10 अंकों का सही मोबाइल नंबर लिखें",
    cityRequired: "कृपया अपने शहर/गांव का नाम लिखें",
    sectionOverview: "सर्वेक्षण के ५ आसान खंड:",
  },
  mr: {
    institution: "के के वाघ इन्स्टिट्यूट ऑफ इंजिनिअरिंग एज्युकेशन अँड रिसर्च, नाशिक\nएमसीए विभाग",
    title: "कुंभमेळा – अनुभव आणि सूचना फॉर्म",
    subtitle: "कुंभ मेला - अनुभव एवं सुझाव फ़ॉर्म",
    chooseLang: "तुमची भाषा निवडा",
    start: "सर्वेक्षण सुरू करा",
    next: "पुढे",
    back: "मागे",
    submit: "सबमिट करा",
    required: "हा प्रश्न आवश्यक आहे",
    optional: "पर्यायी",
    yourAnswer: "तुमचे उत्तर",
    question: "प्रश्न",
    of: "पैकी",
    section: "विभाग",
    voiceType: "बोलून लिहा",
    listening: "ऐकत आहे…",
    record: "ऑडिओ उत्तर रेकॉर्ड करा",
    stop: "रेकॉर्डिंग थांबवा",
    stopHint: "बोलणे पूर्ण झाल्यावर 'रेकॉर्डिंग थांबवा' बटण दाबा.",
    rerecord: "पुन्हा रेकॉर्ड करा",
    done: "उत्तर रेकॉर्ड झाले",
    thanks: "धन्यवाद!",
    thanksBody: "तुमचा प्रतिसाद यशस्वीरित्या नोंदवला गेला आहे. तुमच्या सूचना भविष्यातील कुंभमेळा अधिक भाविक-स्नेही बनवण्यासाठी मोलाच्या ठरतील.",
    another: "आणखी एक प्रतिसाद द्या",
    review: "तुमची उत्तरे पहा",
    noSpeech: "या ब्राउझरमध्ये बोलून लिहिणे उपलब्ध नाही.",
    noMic: "या ब्राउझरमध्ये मायक्रोफोन उपलब्ध नाही.",
    skip: "वगळा",
    specifyOther: "कृपया तपशील लिहा...",
    specifyReason: "कृपया कारण लिहा...",
    uploadPhotosVideos: "तुमच्या कुंभमेळा अनुभवाचे फोटो किंवा व्हिडिओ शेअर करा",
    uploadFile: "फोटो किंवा व्हिडिओ अपलोड करा",
    uploadMoreFiles: "आणखी फोटो किंवा व्हिडिओ जोडा",
    chooseFile: "फाईल निवडा",
    noFileChosen: "कोणतीही फाईल निवडलेली नाही",
    fileAttached: "फाईल जोडली आहे",
    filesAttached: "फाईल्स जोडल्या आहेत",
    removeFile: "काढा",
    uploadHint: "फोटो किंवा व्हिडिओ (एकूण कमाल 10MB)",
    fileTooLarge: "फाईल्सचा एकूण आकार 10MB पेक्षा जास्त आहे. कृपया लहान फाईल्स निवडा.",
    phonePlaceholder: "उदा. 9876543210 (व्हॉट्सअॅप नंबर)",
    cityPlaceholder: "उदा. नाशिक, पुणे, मुंबई, प्रयागराज...",
    clearSelection: "काढा",
    confirmTitle: "तुमचे उत्तर सबमिट करायचे?",
    confirmMsg: "एकदा सबमिट केल्यानंतर तुमची उत्तरे बदलता येणार नाहीत.",
    confirmYes: "हो, सबमिट करा",
    confirmCancel: "मागे जा",
    detectLocation: "माझे वर्तमान स्थान शोधा",
    detectingLocation: "स्थान शोधत आहे…",
    locationDetected: "स्थान सापडले: ",
    locationError: "स्थान ओळखता आले नाही. कृपया स्वतः टाईप करा.",
    locationDenied: "स्थानाची परवानगी नाकारली. कृपया स्वतः टाईप करा.",
    nameRequired: "कृपया तुमचे नाव लिहा",
    phoneRequired: "कृपया 10 अंकांचा योग्य मोबाइल नंबर लिहा",
    cityRequired: "कृपया तुमच्या शहराचे/गावाचे नाव लिहा",
    sectionOverview: "सर्वेक्षणाचे ५ सोपे विभाग:",
  },
};

export const QUESTIONS: Question[] = [
  // ─────────────────────────────────────────────────────────────────────────────
  // SECTION A – Visitor Background and Visit Details
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: "name",
    section: "A",
    type: "text",
    required: true,
    label: {
      en: "Name of visitor",
      hi: "यात्री / श्रद्धालु का नाम (आपका पूरा नाम)",
      mr: "कुंभमेळ्याला भेट देणाऱ्याचे नाव (तुमचे पूर्ण नाव)",
    },
  },
  {
    id: "phone",
    section: "A",
    type: "text",
    required: true,
    label: {
      en: "Mobile Number of Visitor (Preferably WhatsApp number)",
      hi: "आपका मोबाइल नंबर (हो सके तो व्हाट्सएप नंबर)",
      mr: "तुमचा मोबाइल नंबर (शक्यतो व्हॉट्सअॅप असलेला नंबर)",
    },
  },
  {
    id: "city",
    section: "A",
    type: "text",
    required: true,
    label: {
      en: "Which city are you from?",
      hi: "आप किस शहर या गांव से आए हैं?",
      mr: "तुम्ही कोणत्या शहर किंवा गावातून आला आहात?",
    },
  },
  {
    id: "previous_kumbh",
    section: "A",
    type: "checkbox",
    required: true,
    allowOther: true,
    label: {
      en: "Which Kumbh Mela(s) have you attended previously?",
      hi: "आपने पूर्व में कौन से कुंभ मेले में भाग लिया है?",
      mr: "तुम्ही यापूर्वी कोणत्या कुंभमेळ्यात सहभागी झाला आहात?",
    },
    options: {
      en: [
        "Prayagraj (2025)",
        "Haridwar (2021)",
        "Ujjain (2016)",
        "Nashik–Trimbakeshwar (2015)",
        "Other",
      ],
      hi: [
        "प्रयागराज (2025)",
        "हरिद्वार (2021)",
        "उज्जैन (2016)",
        "नासिक–त्र्यंबकेश्वर (2015)",
        "अन्य",
      ],
      mr: [
        "प्रयागराज (2025)",
        "हरिद्वार (2021)",
        "उज्जैन (2016)",
        "नाशिक–त्र्यंबकेश्वर (2015)",
        "इतर",
      ],
    },
  },
  {
    id: "travel_companions",
    section: "A",
    type: "choice",
    required: true,
    allowOther: true,
    label: {
      en: "How did you travel to Kumbh Mela?",
      hi: "आप कुंभ मेले की यात्रा पर किसके साथ गए थे?",
      mr: "तुम्ही कुंभमेळ्याला कोणासोबत प्रवास केला?",
    },
    options: {
      en: [
        "Alone",
        "With family",
        "With friends",
        "With relatives",
        "With an organised group",
        "Other",
      ],
      hi: [
        "अकेले",
        "परिवार के साथ",
        "दोस्तों के साथ",
        "रिश्तेदारों के साथ",
        "किसी टूर ग्रुप, संस्था या मंडल के साथ",
        "अन्य",
      ],
      mr: [
        "एकटे",
        "कुटुंबासोबत",
        "मित्रांसोबत",
        "नातेवाईकांसोबत",
        "टूर ग्रुप, मंडळ किंवा संघासोबत",
        "इतर",
      ],
    },
  },
  {
    id: "group_size",
    section: "A",
    type: "choice",
    required: true,
    label: {
      en: "How many people travelled with you in your group?",
      hi: "आपके ग्रुप में आपके साथ कितने लोग थे?",
      mr: "तुमच्या ग्रुपमध्ये तुमच्यासोबत किती लोक होते?",
    },
    options: {
      en: [
        "I travelled alone",
        "2–5 people",
        "6–10 people",
        "11–20 people",
        "More than 20 people",
      ],
      hi: [
        "मैंने अकेले यात्रा की",
        "2–5 लोग",
        "6–10 लोग",
        "11–20 लोग",
        "20 से अधिक लोग",
      ],
      mr: [
        "मी एकट्याने प्रवास केला",
        "२–५ लोक",
        "६–१० लोक",
        "११–२० लोक",
        "२० पेक्षा जास्त लोक",
      ],
    },
  },
  {
    id: "primary_reason",
    section: "A",
    type: "choice",
    required: true,
    allowOther: true,
    label: {
      en: "What was your primary reason for visiting Kumbh Mela?",
      hi: "कुंभ मेले में आने का आपका मुख्य कारण क्या था?",
      mr: "कुंभमेळ्यात येण्याचे तुमचे मुख्य कारण काय होते?",
    },
    options: {
      en: [
        "Spiritual / Religious purpose",
        "Cultural experience",
        "Family tradition",
        "Personal fulfilment",
        "Tourism / Exploration",
        "Photography / Content creation",
        "Academic / Research purpose",
        "Other",
      ],
      hi: [
        "धार्मिक या आध्यात्मिक कारण (स्नान, दर्शन, पूजा)",
        "सांस्कृतिक अनुभव",
        "परिवार की पुरानी परंपरा",
        "मन की शांति / आत्म-संतुष्टि के लिए",
        "घूमने-फिरने / पर्यटन के लिए",
        "फ़ोटो या वीडियो बनाने के लिए (Photography/Content)",
        "पढ़ाई या रिसर्च/शोध के काम से",
        "अन्य",
      ],
      mr: [
        "धार्मिक किंवा आध्यात्मिक कारण (पूजा/स्नान/दर्शन)",
        "सांस्कृतिक अनुभव",
        "घरातील जुनी परंपरा / रीतिरिवाज",
        "मनाला शांती / समाधान मिळावे म्हणून",
        "फिरण्यासाठी / पर्यटन (Tourism)",
        "फोटो किंवा व्हिडिओ/रील्स काढण्यासाठी (Photography)",
        "अभ्यास किंवा संशोधनासाठी (Study/Research)",
        "इतर",
      ],
    },
  },
  {
    id: "transport_mode",
    section: "A",
    type: "checkbox",
    required: true,
    allowOther: true,
    label: {
      en: "What was your primary mode of transportation?",
      hi: "आप किस साधन से आए थे? (आने-जाने का मुख्य साधन)",
      mr: "तुम्ही कशाने प्रवास केला? (प्रवासाचे मुख्य साधन)",
    },
    options: {
      en: [
        "Railway",
        "Bus / Public Transport",
        "Air",
        "Own vehicle",
        "Rented vehicle",
        "Taxi / Cab",
        "Other",
      ],
      hi: [
        "रेलवे / ट्रेन",
        "बस / सरकारी या प्राइवेट बस",
        "हवाई जहाज़ (Flight)",
        "अपनी गाड़ी (कार / बाइक)",
        "किराये की गाड़ी",
        "टैक्सी / कैब",
        "अन्य",
      ],
      mr: [
        "रेल्वे",
        "बस / एसटी / सार्वजनिक वाहतूक",
        "विमान प्रवास",
        "स्वतःचे वाहन (कार/बाईक)",
        "भाड्याचे वाहन",
        "टॅक्सी / कॅब",
        "इतर",
      ],
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // SECTION B – Facilities and Visitor Experience
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: "facilities_used",
    section: "B",
    type: "checkbox",
    required: true,
    allowOther: true,
    label: {
      en: "Which facilities did you use during your Kumbh Mela visit?",
      hi: "कुंभ मेले में आपने कौन-कौन सी सुविधाओं का इस्तेमाल किया?",
      mr: "कुंभमेळ्यात तुम्ही कोणकोणत्या सुविधा वापरल्या?",
    },
    options: {
      en: [
        "Accommodation facilities",
        "Toilets / Sanitation facilities",
        "Drinking water",
        "Food facilities",
        "Parking",
        "Public transport",
        "Medical / First-aid facilities",
        "Information centres",
        "Digital / Mobile services",
        "Other",
      ],
      hi: [
        "रहने / ठहरने की व्यवस्था (Accommodation)",
        "शौचालय / स्वच्छता सुविधाएं",
        "पीने का पानी",
        "भोजन सुविधाएं",
        "पार्किंग",
        "सार्वजनिक परिवहन",
        "चिकित्सा / प्राथमिक उपचार सुविधाएं",
        "सूचना केंद्र",
        "डिजिटल / मोबाइल सेवाएं",
        "अन्य",
      ],
      mr: [
        "राहण्याची सोय (धर्मशाळा/तंबू/हॉटेल/आश्रम)",
        "शौचालय / स्वच्छता सुविधा",
        "पिण्याचे पाणी",
        "भोजन सुविधा",
        "पार्किंग",
        "सार्वजनिक वाहतूक",
        "दवाखाना / प्रथमोपचार सुविधा (Medical)",
        "माहिती केंद्र",
        "डिजिटल / मोबाइल सेवा",
        "इतर",
      ],
    },
  },
  {
    id: "facilities_satisfaction",
    section: "B",
    type: "choice",
    required: true,
    label: {
      en: "How satisfied were you with the facilities you used during your visit?",
      hi: "अपनी यात्रा के दौरान मिली सुविधाओं से आप कितने संतुष्ट थे?",
      mr: "मिळालेल्या सुविधांबाबत तुम्ही किती समाधानी होता?",
    },
    options: {
      en: [
        "Very Satisfied",
        "Satisfied",
        "Neutral",
        "Dissatisfied",
        "Very Dissatisfied",
      ],
      hi: [
        "बहुत संतुष्ट",
        "संतुष्ट",
        "ठीक-ठाक / सामान्य (Neutral)",
        "असंतोषजनक / खराब",
        "बहुत असंतोषजनक / बहुत खराब",
      ],
      mr: [
        "खूप समाधानी",
        "समाधानी",
        "ठीक-ठाक / मध्यम (Neutral)",
        "असमाधानी",
        "खूप असमाधानी",
      ],
    },
  },
  {
    id: "challenges_faced",
    section: "B",
    type: "checkbox",
    required: true,
    allowOther: true,
    label: {
      en: "What major challenges did you face during your Kumbh Mela visit?",
      hi: "कुंभ मेले में आपको कौन-सी मुख्य दिक्कतें या परेशानियां आईं?",
      mr: "कुंभमेळ्यात तुम्हाला कोणत्या मुख्य अडचणी किंवा समस्या आल्या?",
    },
    options: {
      en: [
        "Overcrowding",
        "Difficulty in finding facilities",
        "Lack of clear information",
        "Navigation / finding locations",
        "Communication problems",
        "Internet / network problems",
        "Electricity-related problems",
        "Transportation difficulties",
        "Sanitation-related issues",
        "Accommodation-related issues",
        "Other",
      ],
      hi: [
        "बहुत ज्यादा भीड़ (Overcrowding)",
        "सुविधाएं ढूंढने में परेशानी",
        "सही या स्पष्ट जानकारी न मिलना",
        "रास्ता या जगह ढूंढने में परेशानी (Navigation)",
        "मोबाइल नेटवर्क / संपर्क न हो पाना",
        "धीमा या बंद इंटरनेट",
        "बिजली की समस्या",
        "आने-जाने / ट्रैफिक व गाड़ी की दिक्कत",
        "गंदगी / साफ-सफाई की कमी",
        "रुकने/ठहरने की जगह न मिलना",
        "अन्य",
      ],
      mr: [
        "प्रचंड गर्दी (Overcrowding)",
        "सुविधा शोधण्यात अडचण",
        "योग्य किंवा वेळेवर माहिती न मिळणे",
        "रस्ता किंवा ठिकाण सापडण्यात अडचण (Navigation)",
        "मोबाइल नेटवर्क / संपर्कातील अडचण",
        "इंटरनेट / नेटवर्क समस्या",
        "वीज पुरवठ्याची समस्या",
        "वाहतूक / ट्रॅफिकच्या अडचणी",
        "घाण / अस्वच्छता (कचरा किंवा अस्वच्छ शौचालय)",
        "राहण्यासाठी जागा न मिळणे / निवासाची अडचण",
        "इतर",
      ],
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // SECTION C – Crowd Management and Technology
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: "time_spent",
    section: "C",
    type: "number_unit",
    required: true,
    label: {
      en: "How much time did you spend at the Kumbh Mela?",
      hi: "आपने कुंभ मेले में कितना समय बिताया?",
      mr: "तुम्ही कुंभमेळ्यात किती वेळ घालवला?",
    },
    options: {
      en: ["Hours", "Days", "Months"],
      hi: ["घंटे", "दिन", "महीने"],
      mr: ["तास", "दिवस", "महिने"],
    },
  },
  {
    id: "crowd_management_rating",
    section: "C",
    type: "choice",
    required: true,
    label: {
      en: "How would you rate the crowd management during your visit?",
      hi: "भीड़ नियंत्रण और व्यवस्था आपको कैसी लगी?",
      mr: "कुंभमेळ्यातील गर्दीचे नियोजन तुम्हाला कसे वाटले?",
    },
    options: {
      en: ["Excellent", "Good", "Fair", "Poor", "Very Poor"],
      hi: ["बहुत अच्छी (उत्कृष्ट)", "अच्छी", "ठीक-ठाक / सामान्य", "खराब", "बहुत खराब"],
      mr: ["उत्कृष्ट", "चांगले", "ठीक-ठाक / साधारण", "वाईट", "खूप वाईट"],
    },
  },
  {
    id: "tech_observed",
    section: "C",
    type: "checkbox",
    required: true,
    allowOther: true,
    exclusiveOptionIndex: 9, // "I did not notice/use any technology"
    label: {
      en: "Which technology-based systems did you observe or use for crowd management?",
      hi: "भीड़ संभालने के लिए आपने वहां कौन-सी टेक्नोलॉजी या डिजिटल सुविधाएं देखीं/इस्तेमाल कीं?",
      mr: "गर्दीच्या नियंत्रणासाठी तुम्ही कोणकोणते तंत्रज्ञान किंवा डिजिटल साधने पाहिली/वापरली?",
    },
    options: {
      en: [
        "CCTV surveillance",
        "Public announcement systems",
        "Digital display boards",
        "Mobile applications",
        "GPS / location services",
        "Digital maps / navigation",
        "Online crowd information",
        "QR codes",
        "AI / smart technology",
        "I did not notice/use any technology",
        "Other",
      ],
      hi: [
        "सीसीटीवी कैमरे (CCTV Cameras)",
        "लाउडस्पीकर से घोषणाएं / अनाउंसमेंट (PA System)",
        "डिजिटल डिस्प्ले बोर्ड",
        "मोबाइल ऐप",
        "जीपीएस / लोकेशन सेवाएं",
        "गूगल मैप्स / डिजिटल नक्शे",
        "ऑनलाइन भीड़ की जानकारी",
        "क्यूआर कोड (QR codes)",
        "एआई / स्मार्ट टेक्नोलॉजी (AI / smart tech)",
        "मैंने ऐसी कोई टेक्नोलॉजी नहीं देखी या इस्तेमाल की",
        "अन्य",
      ],
      mr: [
        "सीसीटीव्ही कॅमेरे (CCTV Cameras)",
        "लाउडस्पीकरवरून केलेल्या घोषणा / सूचना (PA Announcements)",
        "डिजिटल डिस्प्ले बोर्ड",
        "मोबाइल अ‍ॅप्स",
        "जीपीएस / लोकेशन सेवा",
        "मोबाईलमधील नकाशे / गुगल मॅप्स",
        "ऑनलाइन गर्दीची माहिती",
        "क्यूआर कोड (QR codes)",
        "एआय / स्मार्ट तंत्रज्ञान",
        "मी कोणतेही तंत्रज्ञान पाहिले/वापरले नाही",
        "इतर",
      ],
    },
  },
  {
    id: "tech_problems",
    section: "C",
    type: "checkbox",
    required: true,
    allowOther: true,
    exclusiveOptionIndex: 9, // "No technology-related problem"
    label: {
      en: "What technology-related problems did you face during your visit?",
      hi: "यात्रा के दौरान आपको टेक्नोलॉजी या मोबाइल से जुड़ी क्या समस्याएं आईं?",
      mr: "भेटीदरम्यान तुम्हाला तंत्रज्ञान किंवा मोबाईलशी संबंधित कोणत्या अडचणी आल्या?",
    },
    options: {
      en: [
        "Poor mobile network",
        "Slow / unavailable internet",
        "Difficulty using mobile applications",
        "GPS / navigation problems",
        "Digital information was not available",
        "Digital information was difficult to understand",
        "QR codes / digital systems did not work properly",
        "Lack of charging facilities",
        "Technology was not available where required",
        "No technology-related problem",
        "Other",
      ],
      hi: [
        "कमजोर मोबाइल नेटवर्क",
        "धीमा या बंद इंटरनेट",
        "मोबाइल ऐप चलाने में परेशानी",
        "जीपीएस / मैप में रास्ता ढूंढने में परेशानी",
        "डिजिटल जानकारी उपलब्ध नहीं थी",
        "मोबाइल/स्क्रीन की जानकारी समझना कठिन था",
        "क्यूआर कोड / डिजिटल सिस्टम ठीक से काम नहीं कर रहे थे",
        "मोबाइल चार्जिंग की सुविधा नहीं थी",
        "जहां जरूरत थी वहां कोई डिजिटल सुविधा नहीं थी",
        "टेक्नोलॉजी से जुड़ी कोई समस्या नहीं आई",
        "अन्य",
      ],
      mr: [
        "कमकुवत मोबाइल नेटवर्क",
        "मंद / बंद इंटरनेट",
        "मोबाइल अ‍ॅप्स वापरण्यात अडचण",
        "जीपीएस / नकाशात रस्ता शोधण्यात अडचण",
        "मोबाईल/इंटरनेटवर माहिती उपलब्ध नव्हती",
        "मोबाईल/स्क्रीनवरील माहिती समजायला अवघड होती",
        "क्यूआर कोड / डिजिटल प्रणाली नीट चालत नव्हती",
        "मोबाइल चार्जिंगची सोय नव्हती",
        "जिथे गरज होती तिथे कोणतीही डिजिटल सोय नव्हती",
        "तंत्रज्ञानाशी संबंधित कोणतीही अडचण आली नाही",
        "इतर",
      ],
    },
  },
  {
    id: "tech_suggestions_features",
    section: "C",
    type: "checkbox",
    required: true,
    allowOther: true,
    label: {
      en: "What technology or digital facility would have made your Kumbh Mela experience easier?",
      hi: "किस तकनीक या डिजिटल सुविधा से आपका कुंभ मेला अनुभव और आसान हो सकता था?",
      mr: "कोणत्या तंत्रज्ञान किंवा डिजिटल सुविधेमुळे तुमचा कुंभमेळ्याचा अनुभव अधिक सोपा झाला असता?",
    },
    options: {
      en: [
        "Real-time crowd information",
        "Digital map/navigation",
        "Mobile application",
        "Online facility locator",
        "Real-time transportation information",
        "Emergency alert system",
        "Digital accommodation information",
        "Digital sanitation/toilet locator",
        "Medical facility locator",
        "Lost-and-found digital service",
        "Other",
      ],
      hi: [
        "किस जगह कितनी भीड़ है इसकी लाइव जानकारी (Live Crowd Info)",
        "डिजिटल मैप / रास्ता दिखाने वाली सुविधा",
        "कुंभ मेला मोबाइल ऐप",
        "आस-पास की सुविधाएं ढूंढने का ऐप (शौचालय, पानी, अस्पताल आदि)",
        "बस/ट्रेन की लाइव जानकारी (Real-time transport info)",
        "इमरजेंसी अलर्ट / खतरे की तुरंत सूचना (Emergency Alerts)",
        "रुकने/ठहरने की डिजिटल जानकारी",
        "पास के शौचालय ढूंढने की सुविधा",
        "दवाखाना / अस्पताल ढूंढने की सुविधा",
        "खोए हुए लोग या सामान ढूंढने की ऑनलाइन सेवा (Lost & Found)",
        "अन्य",
      ],
      mr: [
        "कोणत्या घाटावर/जागेवर किती गर्दी आहे याची थेट (Live) माहिती",
        "डिजिटल नकाशा / रस्ता शोधण्याची सोय",
        "कुंभमेळा मोबाइल अ‍ॅप",
        "जवळच्या सुविधा शोधण्यासाठी अ‍ॅप/नकाशा (शौचालय, पाणी, दवाखाना शोधणे)",
        "थेट वाहतूक / बसची माहिती (Live Transport Info)",
        "तातडीच्या धोक्याच्या सूचना / इमर्जन्सी अलर्ट (Emergency Alerts)",
        "राहण्याच्या ठिकाणांची डिजिटल माहिती",
        "जवळचे स्वच्छतागृह / शौचालय शोधक",
        "जवळचा दवाखाना / वैद्यकीय मदत शोधक",
        "हरवलेली माणसे किंवा वस्तू शोधण्याची डिजिटल सोय (Lost & Found)",
        "इतर",
      ],
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // SECTION D – Information, Communication and Basic Infrastructure
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: "info_sources",
    section: "D",
    type: "checkbox",
    required: true,
    allowOther: true,
    label: {
      en: "How did you mainly obtain information about Kumbh Mela facilities, routes and events?",
      hi: "कुंभ मेले की सुविधाओं, रास्तों और कार्यक्रमों के बारे में आपको मुख्य रूप से जानकारी कैसे मिली?",
      mr: "कुंभमेळ्यातील सुविधा, रस्ते आणि कार्यक्रमांविषयी तुम्हाला प्रामुख्याने कशी माहिती मिळाली?",
    },
    options: {
      en: [
        "Friends / Family",
        "Social Media",
        "Google / Internet",
        "Mobile Application",
        "Government / Official Website",
        "Digital Display Boards",
        "Public Announcements",
        "Information Centres",
        "Other",
      ],
      hi: [
        "दोस्त / परिवार",
        "सोशल मीडिया",
        "गूगल / इंटरनेट",
        "मोबाइल ऐप",
        "सरकारी / आधिकारिक वेबसाइट",
        "डिजिटल डिस्प्ले बोर्ड",
        "लाउडस्पीकर से की गई घोषणाएं / अनाउंसमेंट",
        "पूछताछ व सूचना केंद्र",
        "अन्य",
      ],
      mr: [
        "मित्र / कुटुंब",
        "सोशल मीडिया",
        "गूगल / इंटरनेट",
        "मोबाइल अ‍ॅप",
        "शासकीय / अधिकृत वेबसाइट",
        "डिजिटल डिस्प्ले बोर्ड",
        "लाउडस्पीकरवरून दिलेल्या सूचना / अनाउन्समेंट",
        "माहिती व मदत केंद्र",
        "इतर",
      ],
    },
  },
  {
    id: "utilities_connectivity",
    section: "D",
    type: "choice",
    required: true,
    label: {
      en: "Did you have adequate electricity and internet connectivity during your visit?",
      hi: "क्या आपकी यात्रा के दौरान पर्याप्त बिजली और इंटरनेट कनेक्टिविटी उपलब्ध थी?",
      mr: "तुमच्या भेटीदरम्यान पुरेशी वीज आणि इंटरनेट कनेक्टिव्हिटी उपलब्ध होती का?",
    },
    options: {
      en: [
        "Both electricity and internet were adequate",
        "Electricity was adequate but internet was inadequate",
        "Internet was adequate but electricity was inadequate",
        "Both were inadequate",
        "Not applicable",
      ],
      hi: [
        "बिजली और इंटरनेट दोनों अच्छे से मिल रहे थे",
        "बिजली तो थी लेकिन इंटरनेट ठीक नहीं था",
        "इंटरनेट तो था लेकिन बिजली की दिक्कत थी",
        "बिजली और इंटरनेट दोनों की कमी थी",
        "लागू नहीं",
      ],
      mr: [
        "वीज आणि इंटरनेट दोन्ही व्यवस्थित मिळत होते",
        "वीज पुरेशी होती पण इंटरनेटची अडचण होती",
        "इंटरनेट व्यवस्थित होते पण विजेची अडचण होती",
        "वीज आणि इंटरनेट दोन्ही गोष्टींची कमतरता होती",
        "लागू नाही",
      ],
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // SECTION E – Impact and Future Improvements
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: "visit_impact",
    section: "E",
    type: "checkbox",
    required: true,
    allowOther: true,
    label: {
      en: "How did your Kumbh Mela visit impact you?",
      hi: "कुंभ मेले की यात्रा का आप पर क्या प्रभाव पड़ा?",
      mr: "कुंभमेळा भेटीचा तुमच्यावर काय प्रभाव पडला?",
    },
    options: {
      en: [
        "Increased spiritual satisfaction",
        "Increased cultural awareness",
        "Created memorable experiences",
        "Increased interest in Indian traditions",
        "Helped me connect with family/friends",
        "Increased interest in visiting again",
        "Provided learning/research experience",
        "Other",
      ],
      hi: [
        "मन को शांति और आध्यात्मिक संतुष्टि मिली",
        "संस्कृति को करीब से जानने का मौका मिला",
        "बहुत सुंदर और यादगार अनुभव रहा",
        "भारतीय परंपराओं में रुचि बढ़ी",
        "परिवार और दोस्तों के साथ रिश्ते मजबूत हुए",
        "दोबारा आने का मन हुआ",
        "कुछ नया सीखने को मिला",
        "अन्य",
      ],
      mr: [
        "आध्यात्मिक समाधान आणि मनःशांती मिळाली",
        "भारतीय संस्कृतीबद्दल समज आणि आदर वाढला",
        "खूप सुंदर आणि कायम लक्षात राहणारा अनुभव मिळाला",
        "भारतीय परंपरांबद्दल आवड वाढली",
        "कुटुंब आणि मित्रांसोबत नाते घट्ट झाले",
        "पुन्हा भेट देण्याची उत्सुकता वाढली",
        "काहीतरी नवीन शिकायला मिळाले",
        "इतर",
      ],
    },
  },
  {
    id: "photos_videos",
    section: "E",
    type: "file_upload",
    required: false,
    label: {
      en: "Would you like to share photographs or videos related to your Kumbh Mela experience?",
      hi: "क्या आप अपने कुंभ मेला अनुभव से संबंधित तस्वीरें या वीडियो साझा करना चाहेंगे?",
      mr: "तुम्हाला तुमच्या कुंभमेळ्याच्या अनुभवाशी संबंधित फोटो किंवा व्हिडिओ शेअर करायला आवडेल का?",
    },
    hint: {
      en: "Allowed: Photos / Videos · Purpose: To understand actual visitor experiences, facilities, crowd conditions and challenges observed during the event.",
      hi: "अनुमति: फ़ोटो / वीडियो · उद्देश्य: वास्तविक यात्री अनुभव, सुविधाएं, भीड़ की स्थिति और आने वाली परेशानियों को समझना।",
      mr: "परवानगी: फोटो / व्हिडिओ · उद्देश: प्रत्यक्ष भाविकांचे अनुभव, सुविधा, गर्दीची परिस्थिती आणि अडचणी समजून घेणे.",
    },
  },
  {
    id: "tech_suggestions",
    section: "E",
    type: "longtext",
    required: false,
    label: {
      en: "What suggestions would you give for making future Kumbh Mela more visitor-friendly using modern technology?",
      hi: "आने वाले कुंभ मेले में श्रद्धालुओं की सुविधा के लिए मोबाइल, ऐप या नई टेक्नोलॉजी का उपयोग कैसे किया जा सकता है? अपने सुझाव लिखें:",
      mr: "भविष्यातील कुंभमेळ्यात भाविकांची सोय व्हावी यासाठी मोबाईल, अ‍ॅप किंवा नव्या तंत्रज्ञानाचा कसा वापर करता येईल? तुमच्या काही सूचना आहेत का?",
    },
  },
];

export interface AttachedFile {
  fileUrl: string;
  fileName?: string | undefined;
  fileType?: string | undefined;
  fileSize?: number | undefined;
}

export interface Answer {
  text?: string | undefined;
  audioUrl?: string | undefined;
  fileUrl?: string | undefined;
  fileName?: string | undefined;
  fileType?: string | undefined;
  files?: AttachedFile[] | undefined;
  choice?: string | undefined;
  details?: string | undefined;
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
    if (!db) {
      console.warn("[survey] Firebase is not configured. Saved to localStorage only.");
      return;
    }
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
    if (!db) {
      console.warn("[survey] Firebase is not configured. Loading from localStorage only.");
      return loadLocal();
    }
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
