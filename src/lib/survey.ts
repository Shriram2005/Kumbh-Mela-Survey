export type Lang = "en" | "hi" | "mr";

export type QuestionType = "text" | "longtext" | "rating" | "choice" | "checkbox" | "file_text";

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
    optional: "Optional",
    yourAnswer: "Your answer",
    question: "Question",
    of: "of",
    voiceType: "Voice typing",
    listening: "Listening…",
    record: "Record audio answer",
    stop: "Stop recording",
    stopHint: "Click 'Stop recording' when done speaking.",
    rerecord: "Record again",
    done: "Response recorded",
    thanks: "Thank you!",
    thanksBody: "Your response has been recorded.",
    another: "Submit another response",
    review: "Review your answers",
    noSpeech: "Voice typing is not supported in this browser.",
    noMic: "Microphone is not available in this browser.",
    skip: "Skip",
    specifyMedical: "Please specify the medical assistance needed...",
    specifyReason: "Please specify...",
    uploadFile: "Upload photo, video, or document",
    uploadMoreFiles: "Add more files",
    chooseFile: "Choose file",
    noFileChosen: "No file chosen",
    fileAttached: "File attached",
    filesAttached: "files attached",
    removeFile: "Remove",
    uploadHint: "Photos, videos, audio, or documents (Total max 10MB)",
    fileTooLarge: "Total file size exceeds 10MB limit. Please choose smaller files.",
    phonePlaceholder: "e.g. 9876543210 (Optional)",
    emailPlaceholder: "e.g. name@example.com (Optional)",
    cityPlaceholder: "e.g. Nashik, Mumbai, Pune (or enter your city)",
    selectState: "Select your state",
    searchState: "Search state...",
    popularStates: "Quick select (Frequent states)",
    allStates: "All States & UTs",
    otherState: "Other / Type manually",
    clearSelection: "Clear",
    confirmTitle: "Submit your response?",
    confirmMsg: "Once submitted, your answers cannot be changed.",
    confirmYes: "Yes, submit",
    confirmCancel: "Go back",
    detectLocation: "Use my current location",
    detectingLocation: "Detecting location…",
    locationDetected: "Detected: ",
    locationError: "Could not detect location. Please select manually.",
    locationDenied: "Location permission denied. Please select manually.",
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
    optional: "वैकल्पिक",
    yourAnswer: "आपका उत्तर",
    question: "प्रश्न",
    of: "में से",
    voiceType: "बोलकर लिखें",
    listening: "सुन रहे हैं…",
    record: "ऑडियो उत्तर रिकॉर्ड करें",
    stop: "रिकॉर्डिंग रोकें",
    stopHint: "बोलना पूरा होने पर 'रिकॉर्डिंग रोकें' बटन दबाएं।",
    rerecord: "फिर से रिकॉर्ड करें",
    done: "उत्तर रिकॉर्ड हुआ",
    thanks: "धन्यवाद!",
    thanksBody: "आपका उत्तर दर्ज कर लिया गया है।",
    another: "एक और प्रतिक्रिया भेजें",
    review: "अपने उत्तर देखें",
    noSpeech: "इस ब्राउज़र में बोलकर लिखना उपलब्ध नहीं है।",
    noMic: "इस ब्राउज़र में माइक्रोफ़ोन उपलब्ध नहीं है।",
    skip: "छोड़ें",
    specifyMedical: "कृपया आवश्यक चिकित्सा सहायता का विवरण दें...",
    specifyReason: "कृपया कारण लिखें...",
    uploadFile: "फ़ोटो, वीडियो या दस्तावेज़ अपलोड करें",
    uploadMoreFiles: "और फ़ाइलें जोड़ें",
    chooseFile: "फ़ाइल चुनें",
    noFileChosen: "कोई फ़ाइल नहीं चुनी गई",
    fileAttached: "फ़ाइल संलग्न है",
    filesAttached: "फ़ाइलें संलग्न हैं",
    removeFile: "हटाएं",
    uploadHint: "फ़ोटो, वीडियो, ऑडियो या दस्तावेज़ (कुल अधिकतम 10MB)",
    fileTooLarge: "फ़ाइलों का कुल आकार 10MB की सीमा से अधिक है। कृपया छोटी फ़ाइलें चुनें।",
    phonePlaceholder: "उदा. 9876543210 (वैकल्पिक)",
    emailPlaceholder: "उदा. name@example.com (वैकल्पिक)",
    cityPlaceholder: "उदा. नासिक, मुंबई, पुणे (या अपना शहर लिखें)",
    selectState: "अपना राज्य चुनें",
    searchState: "राज्य खोजें...",
    popularStates: "त्वरित चयन (प्रमुख राज्य)",
    allStates: "सभी राज्य और केंद्र शासित प्रदेश",
    otherState: "अन्य / खुद टाइप करें",
    clearSelection: "हटाएं",
    confirmTitle: "अपना उत्तर जमा करें?",
    confirmMsg: "एक बार जमा होने के बाद आपके उत्तर बदले नहीं जा सकते।",
    confirmYes: "हाँ, जमा करें",
    confirmCancel: "वापस जाएं",
    detectLocation: "मेरा वर्तमान स्थान पहचानें",
    detectingLocation: "स्थान खोज रहे हैं…",
    locationDetected: "स्थान पहचाना गया: ",
    locationError: "स्थान की पहचान नहीं हो सकी। कृपया सूची से चुनें।",
    locationDenied: "स्थान की अनुमति नहीं मिली। कृपया सूची से चुनें।",
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
    optional: "पर्यायी",
    yourAnswer: "तुमचे उत्तर",
    question: "प्रश्न",
    of: "पैकी",
    voiceType: "बोलून लिहा",
    listening: "ऐकत आहे…",
    record: "ऑडिओ उत्तर रेकॉर्ड करा",
    stop: "रेकॉर्डिंग थांबवा",
    stopHint: "बोलणे पूर्ण झाल्यावर 'रेकॉर्डिंग थांबवा' बटण दाबा.",
    rerecord: "पुन्हा रेकॉर्ड करा",
    done: "उत्तर रेकॉर्ड झाले",
    thanks: "धन्यवाद!",
    thanksBody: "तुमचे उत्तर नोंदवले गेले आहे.",
    another: "आणखी एक प्रतिसाद द्या",
    review: "तुमची उत्तरे पहा",
    noSpeech: "या ब्राउझरमध्ये बोलून लिहिणे उपलब्ध नाही.",
    noMic: "या ब्राउझरमध्ये मायक्रोफोन उपलब्ध नाही.",
    skip: "वगळा",
    specifyMedical: "कृपया आवश्यक वैद्यकीय मदतीचा तपशील द्या...",
    specifyReason: "कृपया कारण लिहा...",
    uploadFile: "फोटो, व्हिडिओ किंवा कागदपत्र अपलोड करा",
    uploadMoreFiles: "आणखी फाईल्स जोडा",
    chooseFile: "फाईल निवडा",
    noFileChosen: "कोणतीही फाईल निवडलेली नाही",
    fileAttached: "फाईल जोडली आहे",
    filesAttached: "फाईल्स जोडल्या आहेत",
    removeFile: "काढा",
    uploadHint: "फोटो, व्हिडिओ, ऑडिओ किंवा कागदपत्र (एकूण कमाल 10MB)",
    fileTooLarge: "फाईल्सचा एकूण आकार 10MB पेक्षा जास्त आहे. कृपया लहान फाईल्स निवडा.",
    phonePlaceholder: "उदा. 9876543210 (पर्यायी)",
    emailPlaceholder: "उदा. name@example.com (पर्यायी)",
    cityPlaceholder: "उदा. नाशिक, मुंबई, पुणे (किंवा तुमचे शहर लिहा)",
    selectState: "तुमचे राज्य निवडा",
    searchState: "राज्य शोधा...",
    popularStates: "त्वरित निवडा (प्रमुख राज्ये)",
    allStates: "सर्व राज्ये आणि केंद्रशासित प्रदेश",
    otherState: "इतर / स्वतः टाईप करा",
    clearSelection: "काढा",
    confirmTitle: "तुमचे उत्तर सबमिट करायचे?",
    confirmMsg: "एकदा सबमिट केल्यानंतर तुमची उत्तरे बदलता येणार नाहीत.",
    confirmYes: "हो, सबमिट करा",
    confirmCancel: "मागे जा",
    detectLocation: "माझे वर्तमान स्थान शोधा",
    detectingLocation: "स्थान शोधत आहे…",
    locationDetected: "स्थान सापडले: ",
    locationError: "स्थान ओळखता आले नाही. कृपया यादीतून निवडा.",
    locationDenied: "स्थानाची परवानगी नाकारली. कृपया यादीतून निवडा.",
  },
};

export interface StateOption {
  en: string;
  hi: string;
  mr: string;
  isPopular?: boolean;
}

export const INDIAN_STATES: StateOption[] = [
  // Popular / High-frequency pilgrim states for Kumbh Mela
  { en: "Maharashtra", hi: "महाराष्ट्र", mr: "महाराष्ट्र", isPopular: true },
  { en: "Madhya Pradesh", hi: "मध्य प्रदेश", mr: "मध्य प्रदेश", isPopular: true },
  { en: "Gujarat", hi: "गुजरात", mr: "गुजरात", isPopular: true },
  { en: "Uttar Pradesh", hi: "उत्तर प्रदेश", mr: "उत्तर प्रदेश", isPopular: true },
  { en: "Rajasthan", hi: "राजस्थान", mr: "राजस्थान", isPopular: true },
  { en: "Delhi", hi: "दिल्ली", mr: "दिल्ली", isPopular: true },
  { en: "Karnataka", hi: "कर्नाटक", mr: "कर्नाटक", isPopular: true },
  { en: "Bihar", hi: "बिहार", mr: "बिहार", isPopular: true },

  // Other States
  { en: "Andhra Pradesh", hi: "आंध्र प्रदेश", mr: "आंध्र प्रदेश" },
  { en: "Arunachal Pradesh", hi: "अरुणाचल प्रदेश", mr: "अरुणाचल प्रदेश" },
  { en: "Assam", hi: "असम", mr: "आसाम" },
  { en: "Chhattisgarh", hi: "छत्तीसगढ़", mr: "छत्तीसगड" },
  { en: "Goa", hi: "गोवा", mr: "गोवा" },
  { en: "Haryana", hi: "हरियाणा", mr: "हरियाणा" },
  { en: "Himachal Pradesh", hi: "हिमाचल प्रदेश", mr: "हिमाचल प्रदेश" },
  { en: "Jharkhand", hi: "झारखंड", mr: "झारखंड" },
  { en: "Kerala", hi: "केरल", mr: "केरळ" },
  { en: "Manipur", hi: "मणिपुर", mr: "मणिपूर" },
  { en: "Meghalaya", hi: "मेघालय", mr: "मेघालय" },
  { en: "Mizoram", hi: "मिज़ोरम", mr: "मिझोरम" },
  { en: "Nagaland", hi: "नागालैंड", mr: "नागालँड" },
  { en: "Odisha", hi: "ओडिशा", mr: "ओडिशा" },
  { en: "Punjab", hi: "पंजाब", mr: "पंजाब" },
  { en: "Sikkim", hi: "सिक्किम", mr: "सिक्कीम" },
  { en: "Tamil Nadu", hi: "तमिलनाडु", mr: "तमिळनाडू" },
  { en: "Telangana", hi: "तेलंगाना", mr: "तेलंगणा" },
  { en: "Tripura", hi: "त्रिपुरा", mr: "त्रिपुरा" },
  { en: "Uttarakhand", hi: "उत्तराखंड", mr: "उत्तराखंड" },
  { en: "West Bengal", hi: "पश्चिम बंगाल", mr: "पश्चिम बंगाल" },

  // Union Territories
  { en: "Andaman and Nicobar Islands", hi: "अंडमान और निकोबार द्वीप समूह", mr: "अंदमान आणि निकोबार" },
  { en: "Chandigarh", hi: "चंडीगढ़", mr: "चंदिगढ" },
  { en: "Dadra and Nagar Haveli and Daman and Diu", hi: "दादरा और नगर हवेली और दमन और दीव", mr: "दादरा आणि नगर हवेली आणि दमण आणि दीव" },
  { en: "Jammu and Kashmir", hi: "जम्मू और कश्मीर", mr: "जम्मू आणि काश्मीर" },
  { en: "Ladakh", hi: "लद्दाख", mr: "लडाख" },
  { en: "Lakshadweep", hi: "लक्षद्वीप", mr: "लक्षद्वीप" },
  { en: "Puducherry", hi: "पुडुचेरी", mr: "पुडुचेरी" },

  // Other / Foreign
  { en: "Other / Outside India", hi: "अन्य / भारत के बाहर", mr: "इतर / भारताबाहेर" },
];

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
    id: "phone",
    type: "text",
    label: {
      en: "What is your phone number?",
      hi: "आपका फ़ोन नंबर क्या है?",
      mr: "तुमचा फोन नंबर काय आहे?",
    },
  },
  {
    id: "email",
    type: "text",
    label: {
      en: "What is your email address?",
      hi: "आपका ईमेल पता क्या है?",
      mr: "तुमचा ईमेल पत्ता काय आहे?",
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
    id: "city",
    type: "text",
    label: {
      en: "Which city are you from?",
      hi: "आप किस शहर से हैं?",
      mr: "तुम्ही कोणत्या शहरातून आला आहात?",
    },
  },
  {
    id: "previous_kumbh",
    type: "checkbox",
    label: {
      en: "Have you attended any previous Kumbh Mela?",
      hi: "क्या आपने पहले किसी कुंभ मेले में भाग लिया है?",
      mr: "तुम्ही यापूर्वी कोणत्याही कुंभमेळ्यात सहभागी झाला आहात का?",
    },
    options: {
      en: [
        "Prayagraj (2024)",
        "Haridwar (2010)",
        "Ujjain (2004)",
        "Nashik (2015)",
        "Have not attended any previous Kumbh Mela",
      ],
      hi: [
        "प्रयागराज (2024)",
        "हरिद्वार (2010)",
        "उज्जैन (2004)",
        "नासिक (2015)",
        "आपने पिछले किसी भी कुम्भ मेलों में भाग नहीं लिया है",
      ],
      mr: [
        "प्रयागराज (2024)",
        "हरिद्वार (2010)",
        "उज्जैन (2004)",
        "नाशिक (2015)",
        "यापूर्वी कोणत्याही कुंभमेळ्यात सहभागी झालेलो नाही",
      ],
    },
  },
  {
    id: "experience",
    type: "choice",
    label: {
      en: "Rate your overall experience at Kumbh Mela:",
      hi: "कुंभ मेले में आपका समग्र अनुभव कैसा रहा?",
      mr: "कुंभमेळ्यातील तुमचा एकूण अनुभव कसा होता?",
    },
    options: {
      en: ["Excellent", "Good", "Average", "Poor", "Very Poor"],
      hi: ["उत्कृष्ट", "अच्छा", "औसत", "खराब", "बहुत खराब"],
      mr: ["उत्कृष्ट", "चांगले", "सरासरी", "वाईट", "खूप वाईट"],
    },
  },
  {
    id: "reason",
    type: "checkbox",
    label: {
      en: "What was your primary reason for attending?",
      hi: "आने का आपका मुख्य कारण क्या था?",
      mr: "सहभागी होण्याचे तुमचे मुख्य कारण काय होते?",
    },
    options: {
      en: ["Spiritual", "Cultural", "Photography", "Academic", "Other"],
      hi: ["आध्यात्मिक", "सांस्कृतिक", "फ़ोटोग्राफ़ी", "शैक्षणिक", "अन्य"],
      mr: ["आध्यात्मिक", "सांस्कृतिक", "छायाचित्रण (फोटोग्राफी)", "शैक्षणिक", "इतर"],
    },
  },
  {
    id: "travel",
    type: "checkbox",
    label: {
      en: "What was your mode of travel?",
      hi: "आपकी यात्रा का माध्यम क्या था?",
      mr: "तुमचा प्रवासाचा मार्ग कोणता होता?",
    },
    options: {
      en: ["Air", "Railway", "Road", "Public Transport", "Own Vehicle"],
      hi: ["हवाई यात्रा", "रेलवे", "सड़क मार्ग", "सार्वजनिक परिवहन", "निजी वाहन"],
      mr: ["विमान", "रेल्वे", "रस्ता मार्ग", "सार्वजनिक वाहतूक", "स्वतःचे वाहन"],
    },
  },
  {
    id: "accommodation",
    type: "choice",
    label: {
      en: "How satisfied were you with accommodation and sanitation?",
      hi: "आवास और स्वच्छता से आप कितने संतुष्ट थे?",
      mr: "निवास व स्वच्छतेबाबत तुम्ही किती समाधानी होता?",
    },
    options: {
      en: ["Very Satisfied", "Satisfied", "Neutral", "Dissatisfied", "Very Dissatisfied"],
      hi: ["बहुत संतुष्ट", "संतुष्ट", "तटस्थ", "असंतोषजनक", "बहुत असंतुष्ट"],
      mr: ["खूप समाधानी", "समाधानी", "तटस्थ", "असमाधानी", "खूप असमाधानी"],
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
    options: {
      en: ["Yes, completely", "Mostly", "Somewhat", "No", "Not sure"],
      hi: ["हाँ, पूरी तरह से", "अधिकांशतः", "कुछ हद तक", "नहीं", "निश्चित नहीं"],
      mr: ["होय, पूर्णपणे", "बहुतांश", "काही प्रमाणात", "नाही", "निश्चित नाही"],
    },
  },
  {
    id: "medical_adequate",
    type: "choice",
    label: {
      en: "Were the medical/emergency facilities adequate?",
      hi: "क्या चिकित्सा/आपातकालीन सुविधाएँ पर्याप्त थीं?",
      mr: "वैद्यकीय/आपत्कालीन सुविधा पुरेशा होत्या का?",
    },
    options: {
      en: ["Very Adequate", "Adequate", "Neutral", "Inadequate", "Very Inadequate"],
      hi: ["अत्यंत पर्याप्त", "पर्याप्त", "तटस्थ", "अपर्याप्त", "बहुत अपर्याप्त"],
      mr: ["अतिशय पुरेसे", "पुरेसे", "तटस्थ", "अपुरे", "खूप अपुरे"],
    },
  },
  {
    id: "medical_needed",
    type: "choice",
    label: {
      en: "Did anyone in your group need medical help? (If yes, please specify)",
      hi: "क्या आपके समूह में किसी को चिकित्सा सहायता की आवश्यकता पड़ी? (यदि हाँ, तो कृपया उल्लेख करें)",
      mr: "तुमच्या गटातील कोणाला वैद्यकीय मदतीची गरज पडली का? (होय असल्यास, कृपया नमूद करा)",
    },
    options: {
      en: ["Yes", "No"],
      hi: ["हाँ", "नहीं"],
      mr: ["होय", "नाही"],
    },
  },
  {
    id: "crowd",
    type: "choice",
    label: {
      en: "Rate crowd management:",
      hi: "भीड़ प्रबंधन को रेट करें:",
      mr: "गर्दी व्यवस्थापनाला गुण द्या:",
    },
    options: {
      en: ["Excellent", "Good", "Fair", "Poor", "Very Poor"],
      hi: ["उत्कृष्ट", "अच्छा", "सामान्य", "खराब", "बहुत खराब"],
      mr: ["उत्कृष्ट", "चांगले", "साधारण", "वाईट", "खूप वाईट"],
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
    options: {
      en: ["Very Adequate", "Adequate", "Neutral", "Inadequate", "Very Inadequate"],
      hi: ["अत्यंत पर्याप्त", "पर्याप्त", "तटस्थ", "अपर्याप्त", "बहुत अपर्याप्त"],
      mr: ["अतिशय पुरेसे", "पुरेसे", "तटस्थ", "अपुरे", "खूप अपुरे"],
    },
  },
  {
    id: "information",
    type: "choice",
    label: {
      en: "Were information services helpful?",
      hi: "क्या सूचना सेवाएँ सहायक थीं?",
      mr: "माहिती सेवा उपयुक्त होत्या का?",
    },
    options: {
      en: ["Very Helpful", "Somewhat Helpful", "Not Helpful", "Did not use"],
      hi: ["बहुत सहायक", "कुछ हद तक सहायक", "सहायक नहीं", "उपयोग नहीं किया"],
      mr: ["खूप उपयुक्त", "काही प्रमाणात उपयुक्त", "उपयुक्त नाही", "वापर केला नाही"],
    },
  },
  {
    id: "spiritual",
    type: "choice",
    label: {
      en: "Was the spiritual/cultural aspect fulfilling?",
      hi: "क्या आध्यात्मिक/सांस्कृतिक पक्ष संतोषजनक रहा?",
      mr: "आध्यात्मिक/सांस्कृतिक अनुभव समाधानकारक होता का?",
    },
    options: {
      en: ["Extremely", "Mostly", "Neutral", "Not very", "Not at all"],
      hi: ["अत्यंत", "अधिकांशतः", "तटस्थ", "खास नहीं", "बिल्कुल नहीं"],
      mr: ["अत्यंत", "बहुतांश", "तटस्थ", "फारसे नाही", "मुळीच नाही"],
    },
  },
  {
    id: "challenges",
    type: "checkbox",
    label: {
      en: "What challenges did you face?",
      hi: "आपको किन कठिनाइयों का सामना करना पड़ा?",
      mr: "तुम्हाला कोणत्या अडचणी आल्या?",
    },
    options: {
      en: ["Accommodation", "Sanitation", "Health", "Information", "Overcrowding", "Other"],
      hi: ["आवास", "स्वच्छता", "स्वास्थ्य", "सूचना", "अत्यधिक भीड़", "अन्य"],
      mr: ["निवास", "स्वच्छता", "आरोग्य", "माहिती", "अतिगर्दी", "इतर"],
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
    options: {
      en: ["Yes", "No"],
      hi: ["हाँ", "नहीं"],
      mr: ["होय", "नाही"],
    },
  },
  {
    id: "suggestions",
    type: "longtext",
    label: {
      en: "Suggestions to improve medical/emergency facilities?",
      hi: "चिकित्सा/आपातकालीन सुविधाओं को बेहतर बनाने के सुझाव?",
      mr: "वैद्यकीय/आपत्कालीन सुविधा सुधारण्यासाठी सूचना?",
    },
  },
  {
    id: "additional_feedback",
    type: "file_text",
    label: {
      en: "Is there anything else you would like to share?",
      hi: "क्या आप कुछ और साझा करना चाहते हैं?",
      mr: "तुम्हाला इतर काही सांगायचे किंवा शेअर करायचे आहे का?",
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
