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
      hi: "खंड अ – आगंतुक पृष्ठभूमि और यात्रा विवरण",
      mr: "विभाग अ – अभ्यागतांची पार्श्वभूमी आणि भेटीचा तपशील",
    },
  },
  B: {
    letter: "B",
    title: {
      en: "Section B – Facilities and Visitor Experience",
      hi: "खंड ब – सुविधाएं और आगंतुक अनुभव",
      mr: "विभाग ब – सुविधा आणि अभ्यागतांचा अनुभव",
    },
  },
  C: {
    letter: "C",
    title: {
      en: "Section C – Crowd Management and Technology",
      hi: "खंड स – भीड़ प्रबंधन और प्रौद्योगिकी",
      mr: "विभाग क – गर्दी व्यवस्थापन आणि तंत्रज्ञान",
    },
  },
  D: {
    letter: "D",
    title: {
      en: "Section D – Information, Communication and Basic Infrastructure",
      hi: "खंड द – सूचना, संचार और बुनियादी ढांचा",
      mr: "विभाग ड – माहिती, संप्रेषण आणि मूलभूत पायाभूत सुविधा",
    },
  },
  E: {
    letter: "E",
    title: {
      en: "Section E – Impact and Future Improvements",
      hi: "खंड इ – प्रभाव और भविष्य में सुधार",
      mr: "विभाग इ – प्रभाव आणि भविष्यातील सुधारणा",
    },
  },
};

export const UI = {
  en: {
    institution: "K K Wagh Institute of Engineering Education and Research, Nashik\nDepartment of MCA",
    title: "Kumbh Mela – Experience and Suggestions Form",
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
    thanksBody: "आपकी प्रतिक्रिया दर्ज कर ली गई है। आपके सुझाव भविष्य के कुंभ मेले को और बेहतर बनाने में मदद करेंगे।",
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
    nameRequired: "कृपया अपना नाम दर्ज करें",
    phoneRequired: "कृपया 10 अंकों का वैध मोबाइल नंबर दर्ज करें",
    cityRequired: "कृपया अपना शहर दर्ज करें",
    sectionOverview: "सर्वेक्षण के ५ खंड:",
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
    nameRequired: "कृपया तुमचे नाव प्रविष्ट करा",
    phoneRequired: "कृपया 10 अंकांचा वैध मोबाइल नंबर प्रविष्ट करा",
    cityRequired: "कृपया तुमचे शहर प्रविष्ट करा",
    sectionOverview: "सर्वेक्षणाचे ५ विभाग:",
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
      hi: "आगंतुक का नाम",
      mr: "अभ्यागताचे नाव",
    },
  },
  {
    id: "phone",
    section: "A",
    type: "text",
    required: true,
    label: {
      en: "Mobile Number of Visitor (Preferably WhatsApp number)",
      hi: "आगंतुक का मोबाइल नंबर (अधिमानतः व्हाट्सएप नंबर)",
      mr: "अभ्यागताचा मोबाइल नंबर (शक्यतो व्हॉट्सअॅप नंबर)",
    },
  },
  {
    id: "city",
    section: "A",
    type: "text",
    required: true,
    label: {
      en: "Which city are you from?",
      hi: "आप किस शहर से हैं?",
      mr: "तुम्ही कोणत्या शहरातून आला आहात?",
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
        "मित्रों के साथ",
        "रिश्तेदारों के साथ",
        "आयोजित समूह के साथ",
        "अन्य",
      ],
      mr: [
        "एकटे",
        "कुटुंबासोबत",
        "मित्रांसोबत",
        "नातेवाईकांसोबत",
        "आयोजित गटासोबत",
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
      hi: "आपके समूह में आपके साथ कितने लोगों ने यात्रा की?",
      mr: "तुमच्या गटात तुमच्यासोबत किती लोकांनी प्रवास केला?",
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
      mr: "कुंभमेळ्याला भेट देण्याचे तुमचे मुख्य कारण काय होते?",
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
        "आध्यात्मिक / धार्मिक उद्देश्य",
        "सांस्कृतिक अनुभव",
        "पारिवारिक परंपरा",
        "व्यक्तिगत संतुष्टि",
        "पर्यटन / अन्वेषण",
        "फोटोग्राफी / कंटेंट क्रिएशन",
        "शैक्षणिक / शोध उद्देश्य",
        "अन्य",
      ],
      mr: [
        "आध्यात्मिक / धार्मिक उद्देश",
        "सांस्कृतिक अनुभव",
        "कौटुंबिक परंपरा",
        "वैयक्तिक समाधान",
        "पर्यटन / शोध",
        "छायाचित्रण (फोटोग्राफी) / कंटेंट निर्मिती",
        "शैक्षणिक / संशोधन उद्देश",
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
      hi: "परिवहन का आपका मुख्य साधन क्या था?",
      mr: "तुमचा प्रवासाचा मुख्य मार्ग/साधन कोणता होता?",
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
        "रेलवे",
        "बस / सार्वजनिक परिवहन",
        "हवाई यात्रा",
        "निजी वाहन",
        "किराये का वाहन",
        "टैक्सी / कैब",
        "अन्य",
      ],
      mr: [
        "रेल्वे",
        "बस / सार्वजनिक वाहतूक",
        "विमान प्रवास",
        "स्वतःचे वाहन",
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
      hi: "कुंभ मेले की यात्रा के दौरान आपने किन सुविधाओं का उपयोग किया?",
      mr: "कुंभमेळा भेटीदरम्यान तुम्ही कोणत्या सुविधांचा वापर केला?",
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
        "आवास सुविधाएं",
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
        "निवास सुविधा",
        "शौचालय / स्वच्छता सुविधा",
        "पिण्याचे पाणी",
        "भोजन सुविधा",
        "पार्किंग",
        "सार्वजनिक वाहतूक",
        "वैद्यकीय / प्रथमोपचार सुविधा",
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
      hi: "अपनी यात्रा के दौरान उपयोग की गई सुविधाओं से आप कितने संतुष्ट थे?",
      mr: "भेटीदरम्यान वापरलेल्या सुविधांबाबत तुम्ही किती समाधानी होता?",
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
        "तटस्थ",
        "असंतोषजनक",
        "बहुत असंतोषजनक",
      ],
      mr: [
        "खूप समाधानी",
        "समाधानी",
        "तटस्थ",
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
      hi: "कुंभ मेले की यात्रा के दौरान आपको किन प्रमुख चुनौतियों का सामना करना पड़ा?",
      mr: "कुंभमेळा भेटीदरम्यान तुम्हाला कोणत्या प्रमुख अडचणींना तोंड द्यावे लागले?",
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
        "अत्यधिक भीड़ (Overcrowding)",
        "सुविधाएं खोजने में कठिनाई",
        "स्पष्ट जानकारी का अभाव",
        "नेविगेशन / स्थान खोजने में परेशानी",
        "संचार समस्याएं",
        "इंटरनेट / नेटवर्क समस्याएं",
        "बिजली संबंधी समस्याएं",
        "परिवहन संबंधी कठिनाइयां",
        "स्वच्छता संबंधी समस्याएं",
        "आवास संबंधी समस्याएं",
        "अन्य",
      ],
      mr: [
        "अतिगर्दी (Overcrowding)",
        "सुविधा शोधण्यात अडचण",
        "स्पष्ट माहितीचा अभाव",
        "नेव्हिगेशन / ठिकाणे शोधण्यात अडचण",
        "संवाद / संपर्कातील अडचणी",
        "इंटरनेट / नेटवर्क समस्या",
        "वीज पुरवठ्याशी संबंधित समस्या",
        "वाहतुकीतील अडचणी",
        "स्वच्छतेच्या समस्या",
        "निवासाच्या समस्या",
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
      hi: "अपनी यात्रा के दौरान भीड़ प्रबंधन को आप कैसे रेट करेंगे?",
      mr: "तुमच्या भेटीदरम्यान गर्दी व्यवस्थापनाला तुम्ही कसे मानांकन द्याल?",
    },
    options: {
      en: ["Excellent", "Good", "Fair", "Poor", "Very Poor"],
      hi: ["उत्कृष्ट", "अच्छा", "सामान्य", "खराब", "बहुत खराब"],
      mr: ["उत्कृष्ट", "चांगले", "साधारण", "वाईट", "खूप वाईट"],
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
      hi: "भीड़ प्रबंधन के लिए आपने कौन-सी तकनीक-आधारित प्रणालियों को देखा या उपयोग किया?",
      mr: "गर्दी व्यवस्थापनासाठी तुम्ही कोणती तंत्रज्ञान-आधारित यंत्रणा पाहिली किंवा वापरली?",
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
        "सीसीटीवी निगरानी (CCTV surveillance)",
        "सार्वजनिक घोषणा प्रणाली (PA systems)",
        "डिजिटल डिस्प्ले बोर्ड",
        "मोबाइल एप्लिकेशन",
        "जीपीएस / लोकेशन सेवाएं",
        "डिजिटल मैप्स / नेविगेशन",
        "ऑनलाइन भीड़ की जानकारी",
        "क्यूआर कोड (QR codes)",
        "एआई / स्मार्ट तकनीक (AI / smart tech)",
        "मैंने किसी तकनीक का उपयोग/अवलोकन नहीं किया",
        "अन्य",
      ],
      mr: [
        "सीसीटीव्ही पाळत (CCTV surveillance)",
        "सार्वजनिक उद्घोषणा प्रणाली (PA systems)",
        "डिजिटल डिस्प्ले बोर्ड",
        "मोबाइल अ‍ॅप्स",
        "जीपीएस / लोकेशन सेवा",
        "डिजिटल नकाशे / नेव्हिगेशन",
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
      hi: "अपनी यात्रा के दौरान आपको प्रौद्योगिकी से संबंधित किन समस्याओं का सामना करना पड़ा?",
      mr: "तुमच्या भेटीदरम्यान तुम्हाला तंत्रज्ञानाशी संबंधित कोणत्या समस्यांना तोंड द्यावे लागले?",
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
        "धीमा / अनुपलब्ध इंटरनेट",
        "मोबाइल ऐप्स का उपयोग करने में कठिनाई",
        "जीपीएस / नेविगेशन समस्याएं",
        "डिजिटल जानकारी उपलब्ध नहीं थी",
        "डिजिटल जानकारी समझना कठिन था",
        "क्यूआर कोड / डिजिटल सिस्टम ठीक से काम नहीं कर रहे थे",
        "चार्जिंग सुविधाओं का अभाव",
        "जहाँ आवश्यकता थी वहाँ तकनीक उपलब्ध नहीं थी",
        "प्रौद्योगिकी संबंधी कोई समस्या नहीं आई",
        "अन्य",
      ],
      mr: [
        "कमकुवत मोबाइल नेटवर्क",
        "मंद / अनुपलब्ध इंटरनेट",
        "मोबाइल अ‍ॅप्स वापरण्यात अडचण",
        "जीपीएस / नेव्हिगेशन समस्या",
        "डिजिटल माहिती उपलब्ध नव्हती",
        "डिजिटल माहिती समजण्यास कठीण होती",
        "क्यूआर कोड / डिजिटल प्रणाली नीट चालत नव्हती",
        "चार्जिंग सुविधांचा अभाव",
        "जिथे गरज होती तिथे तंत्रज्ञान उपलब्ध नव्हते",
        "तंत्रज्ञानाशी संबंधित कोणतीही समस्या आली नाही",
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
      hi: "किस तकनीक या डिजिटल सुविधा से आपका कुंभ मेला अनुभव अधिक सुगम हो सकता था?",
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
        "रीयल-टाइम भीड़ की जानकारी (Real-time crowd info)",
        "डिजिटल मैप / नेविगेशन",
        "मोबाइल एप्लिकेशन",
        "ऑनलाइन सुविधा लोकेटर",
        "रीयल-टाइम परिवहन जानकारी",
        "आपातकालीन अलर्ट प्रणाली (Emergency alerts)",
        "डिजिटल आवास जानकारी",
        "डिजिटल स्वच्छता / शौचालय लोकेटर",
        "चिकित्सा सुविधा लोकेटर",
        "खोया-पाया (Lost & found) डिजिटल सेवा",
        "अन्य",
      ],
      mr: [
        "थेट गर्दीची माहिती (Real-time crowd info)",
        "डिजिटल नकाशा / नेव्हिगेशन",
        "मोबाइल अ‍ॅप",
        "ऑनलाइन सुविधा शोधक (Facility locator)",
        "थेट वाहतूक माहिती",
        "आपत्कालीन अलर्ट प्रणाली",
        "डिजिटल निवास माहिती",
        "डिजिटल स्वच्छतागृह / शौचालय शोधक",
        "वैद्यकीय सुविधा शोधक",
        "हरवले-सापडले डिजिटल सेवा (Lost & found)",
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
      hi: "कुंभ मेले की सुविधाओं, मार्गों और कार्यक्रमों के बारे में आपको मुख्य रूप से जानकारी कैसे मिली?",
      mr: "कुंभमेळ्यातील सुविधा, मार्ग आणि कार्यक्रमांविषयी तुम्हाला प्रामुख्याने कशी माहिती मिळाली?",
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
        "मित्र / परिवार",
        "सोशल मीडिया",
        "गूगल / इंटरनेट",
        "मोबाइल एप्लिकेशन",
        "सरकारी / आधिकारिक वेबसाइट",
        "डिजिटल डिस्प्ले बोर्ड",
        "सार्वजनिक घोषणाएं (Public Announcements)",
        "सूचना केंद्र",
        "अन्य",
      ],
      mr: [
        "मित्र / कुटुंब",
        "सोशल मीडिया",
        "गूगल / इंटरनेट",
        "मोबाइल अ‍ॅप",
        "शासकीय / अधिकृत वेबसाइट",
        "डिजिटल डिस्प्ले बोर्ड",
        "सार्वजनिक उद्घोषणा",
        "माहिती केंद्र",
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
        "बिजली और इंटरनेट दोनों पर्याप्त थे",
        "बिजली पर्याप्त थी लेकिन इंटरनेट अपर्याप्त था",
        "इंटरनेट पर्याप्त था लेकिन बिजली अपर्याप्त थी",
        "दोनों ही अपर्याप्त थे",
        "लागू नहीं",
      ],
      mr: [
        "वीज आणि इंटरनेट दोन्ही पुरेसे होते",
        "वीज पुरेशी होती पण इंटरनेट अपुरे होते",
        "इंटरनेट पुरेसे होते पण वीज अपुरी होती",
        "दोन्ही अपुरे होते",
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
        "आध्यात्मिक संतुष्टि में वृद्धि",
        "सांस्कृतिक जागरूकता में वृद्धि",
        "यादगार अनुभव बने",
        "भारतीय परंपराओं में रुचि बढ़ी",
        "परिवार/मित्रों से जुड़ने में मदद मिली",
        "पुनः आने की इच्छा बढ़ी",
        "सीखने/शोध का अनुभव प्राप्त हुआ",
        "अन्य",
      ],
      mr: [
        "आध्यात्मिक समाधान वाढले",
        "सांस्कृतिक जाणीव वाढली",
        "अविस्मरणीय आठवणी निर्माण झाल्या",
        "भारतीय परंपरांबद्दल आवड वाढली",
        "कुटुंब/मित्रांशी नाते घट्ट झाले",
        "पुन्हा भेट देण्याची उत्सुकता वाढली",
        "शिकण्याचा/संशोधनाचा अनुभव मिळाला",
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
      hi: "अनुमत: फ़ोटो / वीडियो · उद्देश्य: वास्तविक आगंतुक अनुभवों, सुविधाओं, भीड़ की स्थिति और चुनौतियों को समझना।",
      mr: "परवानगी: फोटो / व्हिडिओ · उद्देश: प्रत्यक्ष अभ्यागतांचे अनुभव, सुविधा, गर्दीची परिस्थिती आणि आव्हाने समजून घेणे.",
    },
  },
  {
    id: "tech_suggestions",
    section: "E",
    type: "longtext",
    required: false,
    label: {
      en: "What suggestions would you give for making future Kumbh Mela more visitor-friendly using modern technology?",
      hi: "आधुनिक तकनीक का उपयोग करके भविष्य के कुंभ मेले को अधिक आगंतुक-अनुकूल बनाने के लिए आप क्या सुझाव देंगे?",
      mr: "आधुनिक तंत्रज्ञानाचा वापर करून भविष्यातील कुंभमेळा अधिक भाविक-स्नेही (visitor-friendly) बनवण्यासाठी तुम्ही काय सूचना द्याल?",
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
