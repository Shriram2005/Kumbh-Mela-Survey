import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Loader2,
  Upload,
  Paperclip,
  Film,
  X,
  MapPin,
  Sparkles,
} from "lucide-react";
import { Toaster, toast } from "sonner";
import confetti from "canvas-confetti";
import { VoiceInput } from "@/components/VoiceInput";
import {
  LANGUAGES,
  QUESTIONS,
  SECTIONS,
  UI,
  saveResponse,
  type Answers,
  type Answer,
  type Lang,
} from "@/lib/survey";
import { uploadAudioToS3, uploadFileToS3 } from "@/lib/s3";
import imageCompression from "browser-image-compression";
import {
  saveDraft,
  loadDraft,
  clearDraft,
  markAsSubmitted,
  hasSubmitted,
  clearSubmissionStatus,
} from "@/lib/draft";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Kumbh Mela Visitor Survey | Experience & Suggestions" },
      {
        name: "description",
        content:
          "K K Wagh Institute of Engineering Education and Research - Department of MCA: Kumbh Mela Experience and Suggestions Survey.",
      },
      { property: "og:title", content: "Kumbh Mela Visitor Survey" },
      {
        property: "og:description",
        content:
          "Share your Kumbh Mela experience in English, Hindi, or Marathi to help improve facilities for the upcoming Nashik Kumbh Mela.",
      },
    ],
  }),
  component: SurveyPage,
});

const QUICK_CITIES = [
  "Nashik",
  "Trimbakeshwar",
  "Prayagraj",
  "Haridwar",
  "Ujjain",
  "Pune",
  "Mumbai",
  "Delhi",
  "Varanasi",
  "Nagpur",
  "Indore",
  "Ahmedabad",
];

function SurveyPage() {
  const [lang, setLang] = useState<Lang | null>(null);
  const [showIntro, setShowIntro] = useState(false);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [error, setError] = useState<string | null>(null);

  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);

  // In-memory audio blobs & file handles
  const audioBlobsRef = useRef<Record<string, Blob>>({});
  const filesRef = useRef<Record<string, (File | Blob)[]>>({});
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const responseIdRef = useRef<string>(crypto.randomUUID());
  const draftRestoredRef = useRef(false);
  const prevLangRef = useRef<Lang | null>(null);

  // Restore draft on mount
  useEffect(() => {
    let active = true;

    if (hasSubmitted()) {
      setSubmitted(true);
      return;
    }

    loadDraft().then((draft) => {
      if (!active || !draft || !draft.lang || draftRestoredRef.current) return;
      draftRestoredRef.current = true;

      const restoredAnswers: Answers = { ...draft.answers };
      if (draft.audioBlobs) {
        audioBlobsRef.current = { ...draft.audioBlobs };
        Object.entries(draft.audioBlobs).forEach(([qid, blob]) => {
          if (restoredAnswers[qid]) {
            restoredAnswers[qid] = {
              ...restoredAnswers[qid],
              audioUrl: URL.createObjectURL(blob),
            };
          }
        });
      }
      if (draft.files) {
        const restoredFilesRef: Record<string, (File | Blob)[]> = {};
        Object.entries(draft.files).forEach(([qid, filesOrFile]) => {
          const fileArray: (File | Blob)[] = Array.isArray(filesOrFile)
            ? filesOrFile
            : [filesOrFile];
          restoredFilesRef[qid] = fileArray;

          const fileItems = fileArray.map((f) => ({
            fileUrl: URL.createObjectURL(f),
            fileName: f instanceof File ? f.name : "attachment",
            fileType: f.type || "application/octet-stream",
            fileSize: f.size,
          }));

          if (restoredAnswers[qid]) {
            restoredAnswers[qid] = {
              ...restoredAnswers[qid],
              files: fileItems,
              fileUrl: fileItems[0]?.fileUrl,
              fileName: fileItems[0]?.fileName,
              fileType: fileItems[0]?.fileType,
            };
          }
        });
        filesRef.current = restoredFilesRef;
      }
      responseIdRef.current = draft.responseId || crypto.randomUUID();
      setAnswers(restoredAnswers);
      setStep(typeof draft.step === "number" ? Math.min(draft.step, QUESTIONS.length - 1) : 0);
      setLang(draft.lang);
      prevLangRef.current = draft.lang;

      toast.success("Draft restored", {
        id: "draft-restored",
        description: "Resuming where you left off.",
        duration: 3000,
      });
    });
    return () => {
      active = false;
    };
  }, []);

  // Auto-save draft
  useEffect(() => {
    if (!lang || submitted) return;
    saveDraft({
      lang,
      step,
      responseId: responseIdRef.current,
      answers,
      audioBlobs: audioBlobsRef.current,
      files: filesRef.current,
      updatedAt: Date.now(),
    });
  }, [lang, step, answers, submitted]);

  const activeQuestionRef = useRef<HTMLDivElement | null>(null);

  // Smooth auto-scroll to the top of the active question on mobile
  useEffect(() => {
    if (activeQuestionRef.current) {
      activeQuestionRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [step]);

  const t = UI[lang ?? "en"];
  const total = QUESTIONS.length;
  const question = QUESTIONS[step]!;
  const current = answers[question.id] ?? { text: "" };
  const progress = useMemo(() => ((step + 1) / total) * 100, [step, total]);

  const [isRecordingAudio, setIsRecordingAudio] = useState(false);

  useEffect(() => {
    setIsRecordingAudio(false);
  }, [step]);

  const hasAudioAnswer = Boolean(current.audioUrl) || isRecordingAudio;

  const isRequired =
    question.required ??
    (question.type !== "longtext" &&
      question.type !== "file_upload" &&
      question.type !== "file_text");

  const currentSection = SECTIONS[question.section];

  const update = (patch: Partial<Answer>) => {
    setAnswers((prev) => ({
      ...prev,
      [question.id]: { ...(prev[question.id] ?? { text: "" }), ...patch },
    }));
    setError(null);
  };

  const MAX_TOTAL_FILE_SIZE = 10 * 1024 * 1024; // 10MB total limit

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    setIsCompressing(true);
    const processedFiles: File[] = [];

    try {
      for (const file of selectedFiles) {
        if (
          file.type === "image/jpeg" ||
          file.type === "image/png" ||
          file.type === "image/webp"
        ) {
          const options = {
            maxSizeMB: 0.6,
            maxWidthOrHeight: 1600,
            useWebWorker: true,
          };
          try {
            const compressed = await imageCompression(file, options);
            processedFiles.push(compressed);
          } catch (err) {
            console.error("Compression error:", err);
            processedFiles.push(file);
          }
        } else {
          processedFiles.push(file);
        }
      }
    } finally {
      setIsCompressing(false);
    }

    const existingFiles = filesRef.current[question.id] || [];
    const combinedFiles = [...existingFiles, ...processedFiles];
    const totalBytes = combinedFiles.reduce((acc, f) => acc + f.size, 0);

    if (totalBytes > MAX_TOTAL_FILE_SIZE) {
      const formattedTotal = (totalBytes / (1024 * 1024)).toFixed(1);
      toast.error(
        `${t.fileTooLarge || "Total file size exceeds 10MB limit."} (${formattedTotal} MB)`
      );
      e.target.value = "";
      return;
    }

    filesRef.current[question.id] = combinedFiles;

    const fileItems = combinedFiles.map((f) => {
      const fName = f instanceof File ? f.name : "attachment";
      const existing = current.files?.find(
        (ef) => ef.fileName === fName && ef.fileSize === f.size
      );
      return {
        fileUrl: existing ? existing.fileUrl : URL.createObjectURL(f),
        fileName: fName,
        fileType: f.type || "application/octet-stream",
        fileSize: f.size,
      };
    });

    update({
      files: fileItems,
      fileUrl: fileItems[0]?.fileUrl,
      fileName: fileItems[0]?.fileName,
      fileType: fileItems[0]?.fileType,
      text: fileItems.length > 0 ? `${fileItems.length} file(s) attached` : "",
    });
    e.target.value = "";
  };

  const handleRemoveSpecificFile = (fileIndex: number) => {
    const existingFiles = filesRef.current[question.id] || [];
    const existingItems = current.files || [];

    const fileToRemove = existingItems[fileIndex];
    if (fileToRemove?.fileUrl && fileToRemove.fileUrl.startsWith("blob:")) {
      URL.revokeObjectURL(fileToRemove.fileUrl);
    }

    const nextFiles = existingFiles.filter((_, idx) => idx !== fileIndex);
    const nextItems = existingItems.filter((_, idx) => idx !== fileIndex);

    if (nextFiles.length > 0) {
      filesRef.current[question.id] = nextFiles;
      update({
        files: nextItems,
        fileUrl: nextItems[0]?.fileUrl,
        fileName: nextItems[0]?.fileName,
        fileType: nextItems[0]?.fileType,
        text: `${nextItems.length} file(s) attached`,
      });
    } else {
      delete filesRef.current[question.id];
      update({
        files: undefined,
        fileUrl: undefined,
        fileName: undefined,
        fileType: undefined,
        text: "",
      });
    }
  };

  const goNext = async () => {
    // Q1: Name validation
    if (question.id === "name") {
      const name = current.text?.trim() ?? "";
      const hasAudio = Boolean(current.audioUrl);
      if (!name && !hasAudio) {
        setError(t.nameRequired);
        return;
      }
      setError(null);
      setStep((s) => s + 1);
      return;
    }

    // Q2: Mobile Number validation
    if (question.id === "phone") {
      const phone = current.text?.trim() ?? "";
      let digits = phone.replace(/[^\d]/g, "");
      if (digits.length > 10 && digits.startsWith("91")) digits = digits.slice(2);
      else if (digits.length > 10 && digits.startsWith("0")) digits = digits.slice(1);

      const isRepetitive = /^(\d)\1{9}$/.test(digits);

      if (digits.length !== 10 || isRepetitive) {
        setError(t.phoneRequired);
        return;
      }
      setError(null);
      setStep((s) => s + 1);
      return;
    }

    // Q3: City validation
    if (question.id === "city") {
      const city = current.text?.trim() ?? "";
      const hasAudio = Boolean(current.audioUrl);
      if (!city && !hasAudio) {
        setError(t.cityRequired);
        return;
      }
      setError(null);
      setStep((s) => s + 1);
      return;
    }

    // General Required check for single-choice, multiple-choice, number_unit
    if (isRequired) {
      const hasText = Boolean(current.text?.trim() || current.choice?.trim());
      const hasAudio = Boolean(current.audioUrl);
      const hasFiles =
        Boolean(current.files && current.files.length > 0) || Boolean(current.fileUrl);

      if (!hasText && !hasAudio && !hasFiles) {
        setError(t.required);
        return;
      }
    }

    setError(null);

    if (step === total - 1) {
      setShowConfirm(true);
      return;
    }
    setStep((s) => s + 1);
  };

  const handleConfirmedSubmit = async () => {
    setShowConfirm(false);
    setSubmitting(true);
    setUploadProgress(null);

    try {
      const finalAnswers: Answers = { ...answers };

      let completedUploads = 0;
      const totalUploads =
        Object.keys(audioBlobsRef.current).length +
        Object.values(filesRef.current).reduce((acc, list) => acc + list.length, 0);

      if (totalUploads > 0) {
        setUploadProgress({ current: 0, total: totalUploads });
      }

      const incrementProgress = () => {
        completedUploads++;
        setUploadProgress({ current: completedUploads, total: totalUploads });
      };

      const audioUploadPromises = Object.entries(audioBlobsRef.current).map(
        async ([qid, blob]) => {
          try {
            const s3Url = await uploadAudioToS3(blob, responseIdRef.current, qid);
            incrementProgress();
            return { qid, s3Url };
          } catch (err) {
            console.error(`Audio upload failed for ${qid}:`, err);
            incrementProgress();
            return { qid, s3Url: undefined };
          }
        }
      );

      const fileUploadPromises = Object.entries(filesRef.current).flatMap(
        ([qid, filesList]) => {
          return filesList.map(async (fileOrBlob, idx) => {
            try {
              const fileName =
                fileOrBlob instanceof File
                  ? fileOrBlob.name
                  : `file_${idx}_${Date.now()}.bin`;
              const fileType = fileOrBlob.type || "application/octet-stream";
              const s3Url = await uploadFileToS3(
                fileOrBlob,
                responseIdRef.current,
                `${qid}_${idx}`,
                fileName
              );
              incrementProgress();
              return {
                qid,
                s3Url,
                fileName,
                fileType,
                fileSize: fileOrBlob.size,
              };
            } catch (err) {
              console.error(`File upload failed for ${qid} [${idx}]:`, err);
              incrementProgress();
              return {
                qid,
                s3Url: undefined,
                fileName: undefined,
                fileType: undefined,
                fileSize: undefined,
              };
            }
          });
        }
      );

      const [audioResults, fileResults] = await Promise.all([
        Promise.all(audioUploadPromises),
        Promise.all(fileUploadPromises),
      ]);

      audioResults.forEach(({ qid, s3Url }) => {
        if (s3Url && finalAnswers[qid]) {
          finalAnswers[qid] = { ...finalAnswers[qid], audioUrl: s3Url };
        }
      });

      const fileResultsByQid: Record<
        string,
        { fileUrl: string; fileName?: string; fileType?: string; fileSize?: number }[]
      > = {};

      for (const res of fileResults) {
        if (res.s3Url) {
          const list = fileResultsByQid[res.qid] ?? [];
          list.push({
            fileUrl: res.s3Url,
            fileName: res.fileName,
            fileType: res.fileType,
            fileSize: res.fileSize,
          });
          fileResultsByQid[res.qid] = list;
        }
      }

      Object.keys(filesRef.current).forEach((qid) => {
        if (finalAnswers[qid]) {
          const uploadedFiles = fileResultsByQid[qid] || [];
          if (uploadedFiles.length > 0) {
            finalAnswers[qid] = {
              ...finalAnswers[qid],
              files: uploadedFiles,
              fileUrl: uploadedFiles[0]?.fileUrl,
              fileName: uploadedFiles[0]?.fileName,
              fileType: uploadedFiles[0]?.fileType,
            };
          }
        }
      });

      await saveResponse({
        id: responseIdRef.current,
        lang: lang ?? "en",
        submittedAt: new Date().toISOString(),
        answers: finalAnswers,
      });

      markAsSubmitted();
      await clearDraft();

      Object.values(answers).forEach((a) => {
        if (a.audioUrl?.startsWith("blob:")) URL.revokeObjectURL(a.audioUrl);
        if (a.fileUrl?.startsWith("blob:")) URL.revokeObjectURL(a.fileUrl);
        a.files?.forEach((f) => {
          if (f.fileUrl?.startsWith("blob:")) URL.revokeObjectURL(f.fileUrl);
        });
      });
      audioBlobsRef.current = {};
      filesRef.current = {};

      setSubmitted(true);

      confetti({
        particleCount: 160,
        spread: 80,
        origin: { y: 0.5 },
        colors: ["#f59e0b", "#16a34a", "#3b82f6", "#ec4899", "#8b5cf6"],
        zIndex: 9999,
      });
    } catch (err) {
      console.error("Submit error:", err);
      toast.error("Failed to submit response. Please try again.");
    } finally {
      setSubmitting(false);
      setUploadProgress(null);
    }
  };

  const restart = () => {
    clearDraft();
    clearSubmissionStatus();
    draftRestoredRef.current = false;
    Object.values(answers).forEach((a) => {
      if (a.audioUrl?.startsWith("blob:")) URL.revokeObjectURL(a.audioUrl);
      if (a.fileUrl?.startsWith("blob:")) URL.revokeObjectURL(a.fileUrl);
      a.files?.forEach((f) => {
        if (f.fileUrl?.startsWith("blob:")) URL.revokeObjectURL(f.fileUrl);
      });
    });
    audioBlobsRef.current = {};
    filesRef.current = {};
    setAnswers({});
    setStep(0);
    setSubmitted(false);
    setLang(null);
    responseIdRef.current = crypto.randomUUID();
  };

  const handleLanguageSelect = (selectedLang: Lang) => {
    if (prevLangRef.current && prevLangRef.current !== selectedLang) {
      clearDraft();
      clearSubmissionStatus();
      draftRestoredRef.current = false;
      audioBlobsRef.current = {};
      filesRef.current = {};
      setAnswers({});
      setStep(0);
      setSubmitted(false);
      responseIdRef.current = crypto.randomUUID();
    }
    prevLangRef.current = selectedLang;
    setLang(selectedLang);
    setShowIntro(true);
  };

  // ─── Submitted View ──────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <Shell>
        <div className="text-center py-8 animate-in fade-in zoom-in duration-500">
          <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-primary/10 text-primary mb-6 shadow-sm">
            <Check className="h-10 w-10 stroke-[2.5]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
            {t.thanks}
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-md mx-auto leading-relaxed">
            {t.thanksBody}
          </p>

          <div className="mt-8 pt-6 border-t border-border/50">
            <button
              type="button"
              onClick={restart}
              className="inline-flex items-center gap-2 min-h-[48px] px-6 py-3.5 rounded-xl text-base font-semibold text-primary border-2 border-primary hover:bg-primary hover:text-primary-foreground transition-all active:scale-[0.97] shadow-sm"
            >
              <span>{t.another}</span>
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </Shell>
    );
  }

  // ─── Language Selection Screen ───────────────────────────────────────────────
  if (!lang) {
    return (
      <Shell>
        <div className="text-center mb-6 sm:mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider mb-3">
            <span>K K Wagh MCA · Research Questionnaire</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight">
            Kumbh Mela – Experience and Suggestions Form
          </h1>
          <p className="mt-2 text-base text-muted-foreground font-medium">
            कुंभ मेला – अनुभव एवं सुझाव फ़ॉर्म
          </p>
        </div>

        <div className="space-y-3.5 animate-in fade-in slide-in-from-bottom-6 duration-700">
          <p className="text-center text-sm sm:text-base font-medium text-foreground mb-3">
            Choose your language · अपनी भाषा चुनें · तुमची भाषा निवडा
          </p>
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => handleLanguageSelect(l.code)}
              className="w-full min-h-[64px] flex items-center justify-between rounded-2xl border-2 border-border bg-card px-5 sm:px-6 py-4 sm:py-5 text-left transition-all hover:border-primary hover:shadow-md hover:scale-[1.01] active:scale-[0.98]"
              aria-label={`Select ${l.label}`}
            >
              <span className="flex items-center gap-3.5 sm:gap-4">
                <span className="flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-primary/10 text-2xl shrink-0">
                  🌐
                </span>
                <span>
                  <span className="block text-lg font-bold text-foreground">{l.native}</span>
                  <span className="block text-xs sm:text-sm text-muted-foreground">{l.label}</span>
                </span>
              </span>
              <ChevronRight className="h-6 w-6 text-muted-foreground shrink-0" />
            </button>
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground px-2">
          Your feedback will help improve planning and services for upcoming Kumbh Mela events
        </p>
      </Shell>
    );
  }

  // ─── Intro Screen with PDF Sections Overview ────────────────────────────────
  if (showIntro && lang) {
    const introContent = {
      en: {
        institution: "K K Wagh Institute of Engineering Education and Research, Nashik",
        dept: "Department of MCA",
        title: "Kumbh Mela – Experience and Suggestions Form",
        greeting: "Dear Sir/Madam,",
        body: "If you have previously experienced the Kumbh Mela, kindly fill out this Form.",
        bullets: [
          "Your response will help improve planning and facilities for future Kumbh Mela events.",
          "The pilgrims attending the upcoming Nashik Kumbh Mela can receive better services.",
          "If you know someone who has attended, kindly share the QR code/link with friends, relatives, and neighbors.",
        ],
        structureDesc:
          "The survey is structured into five sections to systematically capture visitors’ background, experiences and challenges, technology-related aspects, and their overall impact and suggestions.",
        sections: [
          "A. Visitor Background and Visit Details",
          "B. Facilities and Visitor Experience",
          "C. Crowd Management and Technology",
          "D. Information, Communication and Basic Infrastructure",
          "E. Impact and Future Improvements",
        ],
        cta: "Start Survey",
        changeLang: "Change language",
      },
      hi: {
        institution: "के के वाघ इंस्टीट्यूट ऑफ इंजीनियरिंग एजुकेशन एंड रिसर्च, नासिक",
        dept: "एमसीए विभाग",
        title: "कुंभ मेला – अनुभव एवं सुझाव फ़ॉर्म",
        greeting: "प्रिय महोदय / महोदया,\nसादर प्रणाम…!!!!",
        body: "यदि आपने पूर्व में कुंभ मेले का अनुभव लिया है, तो कृपया इस फ़ॉर्म को भरें।",
        bullets: [
          "आपकी प्रतिक्रिया भविष्य के कुंभ मेला आयोजनों की योजना और सुविधाओं को बेहतर बनाएगी।",
          "आगामी नासिक कुंभ मेले में भाग लेने वाले श्रद्धालुओं को उत्कृष्ट सेवाएं मिल सकेंगी।",
          "यदि आप किसी ऐसे व्यक्ति को जानते हैं जिन्होंने कुंभ मेले में भाग लिया है, तो कृपया यह लिंक / क्यूआर कोड मित्रों, रिश्तेदारों और पड़ोसियों के साथ साझा करें।",
        ],
        structureDesc:
          "यह सर्वेक्षण आगंतुकों की पृष्ठभूमि, अनुभव एवं चुनौतियों, प्रौद्योगिकी संबंधी पहलुओं और उनके समग्र प्रभाव व सुझावों को व्यवस्थित रूप से दर्ज करने के लिए पांच खंडों में संरचित है:",
        sections: [
          "खंड अ: आगंतुक पृष्ठभूमि और यात्रा विवरण",
          "खंड ब: सुविधाएं और आगंतुक अनुभव",
          "खंड स: भीड़ प्रबंधन और प्रौद्योगिकी",
          "खंड द: सूचना, संचार और बुनियादी ढांचा",
          "खंड इ: प्रभाव और भविष्य में सुधार",
        ],
        cta: "सर्वेक्षण शुरू करें",
        changeLang: "भाषा बदलें",
      },
      mr: {
        institution: "के के वाघ इन्स्टिट्यूट ऑफ इंजिनिअरिंग एज्युकेशन अँड रिसर्च, नाशिक",
        dept: "एमसीए विभाग",
        title: "कुंभमेळा – अनुभव आणि सूचना फॉर्म",
        greeting: "प्रिय महोदय / महोदया,\nसस्नेह नमस्कार…!!!!",
        body: "जर तुम्ही यापूर्वी कुंभमेळ्याचा अनुभव घेतला असेल, तर कृपया हा फॉर्म भरावा.",
        bullets: [
          "तुमचा प्रतिसाद भविष्यातील कुंभमेळा आयोजनांचे नियोजन व सुविधा सुधारण्यास मदत करेल.",
          "आगामी नासिक कुंभमेळ्यात सहभागी होणाऱ्या भाविकांना अधिक चांगल्या सुविधा मिळू शकतील.",
          "जर तुम्ही अशा कोणाला ओळखत असाल ज्यांनी कुंभमेळ्यास भेट दिली आहे, तर कृपया ही लिंक / क्यूआर कोड मित्र, नातेवाईक आणि शेजाऱ्यांसोबत नक्की शेअर करा.",
        ],
        structureDesc:
          "हे सर्वेक्षण अभ्यागतांची पार्श्वभूमी, अनुभव आणि आव्हाने, तंत्रज्ञानविषयक पैलू आणि त्यांचा एकूण प्रभाव व सूचना पद्धतशीरपणे नोंदवण्यासाठी पाच विभागांमध्ये विभागलेले आहे:",
        sections: [
          "विभाग अ: अभ्यागतांची पार्श्वभूमी आणि भेटीचा तपशील",
          "विभाग ब: सुविधा आणि अभ्यागतांचा अनुभव",
          "विभाग क: गर्दी व्यवस्थापन आणि तंत्रज्ञान",
          "विभाग ड: माहिती, संप्रेषण आणि मूलभूत पायाभूत सुविधा",
          "विभाग इ: प्रभाव आणि भविष्यातील सुधारणा",
        ],
        cta: "सर्वेक्षण सुरू करा",
        changeLang: "भाषा बदला",
      },
    } as const;

    const intro = introContent[lang];

    return (
      <Shell>
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col gap-4 pb-4 pt-2">
          <div className="rounded-2xl border border-border/70 bg-card/90 px-5 py-6 sm:px-8 sm:py-8 shadow-sm">
            {/* Institution Badge */}
            <div className="text-center border-b border-border/60 pb-4 mb-4">
              <p className="text-xs sm:text-sm font-semibold tracking-wide text-primary uppercase">
                {intro.institution}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground font-medium mt-0.5">
                {intro.dept}
              </p>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground mt-2">
                {intro.title}
              </h2>
            </div>

            {/* Greeting & Body */}
            <div className="mb-2 space-y-0.5">
              {intro.greeting.split("\n").map((line, i) => (
                <p key={i} className="text-sm sm:text-base text-foreground leading-relaxed">
                  {line}
                </p>
              ))}
            </div>

            <p className="text-sm sm:text-base text-foreground mb-3 leading-relaxed">
              {intro.body}
            </p>

            {/* Bullets */}
            <ul className="space-y-2 mb-4">
              {intro.bullets.map((b, i) => (
                <li key={i} className="flex items-start gap-2 text-sm sm:text-base text-foreground">
                  <span className="shrink-0 text-foreground select-none">→</span>
                  <span className="leading-relaxed">{b}</span>
                </li>
              ))}
            </ul>

            {/* Structure Overview */}
            <div className="pt-1 space-y-3">
              <p className="text-sm sm:text-base text-foreground leading-relaxed">
                {intro.structureDesc}
              </p>
              <div className="pl-4 sm:pl-6 space-y-1.5 text-sm sm:text-base text-foreground">
                {intro.sections.map((s, i) => (
                  <p key={i} className="leading-relaxed">
                    {s}
                  </p>
                ))}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowIntro(false)}
            className="w-full min-h-[52px] inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-base sm:text-lg font-semibold bg-primary text-primary-foreground shadow-md transition-all hover:bg-primary/90 hover:shadow-lg active:scale-[0.98]"
          >
            <span>{intro.cta}</span>
            <ChevronRight className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={() => {
              setLang(null);
              setShowIntro(false);
            }}
            className="text-sm text-muted-foreground underline-offset-2 hover:underline text-center pb-2"
          >
            ← {intro.changeLang}
          </button>
        </div>
      </Shell>
    );
  }

  const handleBack = () => {
    setError(null);
    if (step === 0) {
      setLang(null);
    } else {
      setStep((s) => Math.max(0, s - 1));
    }
  };

  // ─── Survey Chat Flow ────────────────────────────────────────────────────────
  return (
    <Shell>
      {/* Top Progress Bar */}
      <div
        className="fixed top-0 left-0 right-0 z-50 h-[3px] bg-foreground/5 pointer-events-none"
        role="progressbar"
        aria-valuenow={Math.round(progress)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Survey completion progress"
      >
        <div
          className="h-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="space-y-4 pt-1 sm:pt-3">
        {/* Previous Questions Bubbles */}
        {QUESTIONS.slice(0, step).map((q, idx) => {
          const ans = answers[q.id];
          const qSection = SECTIONS[q.section];

          return (
            <div key={q.id} className="space-y-2 animate-in fade-in duration-300">
              <div className="flex justify-start">
                <div className="max-w-[90%] sm:max-w-[75%]">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-t-xl rounded-br-xl bg-muted/60 border border-border/40">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {qSection.letter} · Q{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => setStep(idx)}
                      className="text-[10px] font-medium text-primary hover:underline"
                      aria-label={`Edit question ${idx + 1}`}
                    >
                      Edit
                    </button>
                  </div>
                  <div className="mt-1 px-4 py-3 sm:px-5 sm:py-3.5 rounded-2xl rounded-tl-sm bg-amber-200/70 dark:bg-amber-950/40 border border-border shadow-xs">
                    <p className="text-[15px] sm:text-base leading-relaxed text-foreground">
                      {q.label[lang]}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <div className="max-w-[90%] sm:max-w-[75%]">
                  <div className="px-4 py-3 sm:px-5 sm:py-3.5 rounded-2xl rounded-br-sm bg-primary/90 text-primary-foreground shadow-xs">
                    {ans?.text ? (
                      <p className="text-[15px] sm:text-base leading-relaxed whitespace-pre-line break-words">
                        {ans.text}
                      </p>
                    ) : null}
                    {ans?.audioUrl && (
                      <div className="mt-1.5 flex items-center gap-2">
                        <span className="text-xs">🎙️</span>
                        <audio src={ans.audioUrl} controls className="h-7 max-w-[170px]" />
                      </div>
                    )}
                    {ans?.files && ans.files.length > 0 ? (
                      <div className="mt-1.5 space-y-1">
                        {ans.files.map((f, fIdx) => (
                          <div key={fIdx} className="flex items-center gap-2 text-xs">
                            <span>📎</span>
                            <span className="truncate">{f.fileName || t.fileAttached}</span>
                          </div>
                        ))}
                      </div>
                    ) : null}
                    {!ans?.text &&
                      !ans?.audioUrl &&
                      (!ans?.files || ans.files.length === 0) && (
                        <p className="text-xs italic opacity-70">—</p>
                      )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Active Question Area */}
        <div
          ref={activeQuestionRef}
          className="animate-in fade-in slide-in-from-bottom-3 duration-400 pt-1"
        >
          {/* Question Bubble & Minimal Section Header */}
          <div className="mb-4">
            <div className="flex items-center justify-between gap-2 px-1 mb-2">
              {/* Section tag: compact on mobile, full section on tablet+ */}
              <div className="inline-flex items-center gap-1.5 min-w-0">
                <span className="inline-flex items-center justify-center h-5 px-1.5 rounded-md bg-primary/10 text-primary text-[10px] sm:text-[11px] font-semibold tracking-wider shrink-0">
                  SECTION {currentSection.letter}
                </span>
                <span className="hidden sm:inline text-xs font-medium text-muted-foreground truncate max-w-[260px]">
                  {currentSection.title[lang].replace(/^(Section|खंड|विभाग)\s+[A-E]\s*[–-]\s*/i, "")}
                </span>
              </div>

              {/* Progress & Optional Indicator */}
              <div className="inline-flex items-center gap-2 shrink-0">
                <span className="text-xs font-semibold text-foreground">
                  {step + 1} <span className="text-muted-foreground font-normal">/ {total}</span>
                </span>
                {!isRequired && (
                  <span className="text-[10px] font-medium text-muted-foreground px-2 py-0.5 rounded-full bg-muted/80 border border-border/50">
                    {t.optional}
                  </span>
                )}
              </div>
            </div>

            <div className="px-5 py-4 sm:px-6 sm:py-5 rounded-2xl bg-amber-200/70 dark:bg-amber-950/40 border-2 border-primary/25 shadow-sm">
              <h1 className="text-base sm:text-lg leading-relaxed text-foreground font-medium">
                {question.label[lang]}
                {isRequired && (
                  <span className="text-destructive ml-1.5 font-bold" title={t.required}>
                    *
                  </span>
                )}
              </h1>
              {question.hint && (
                <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 leading-relaxed">
                  {question.hint[lang]}
                </p>
              )}
            </div>
          </div>

          {/* Answer Input Area */}
          <div className="px-0.5">
            {/* Short text inputs */}
            {question.type === "text" && !hasAudioAnswer && (
              <div className="space-y-2">
                {question.id === "phone" ? (
                  <div className="flex items-stretch rounded-xl border-2 border-border bg-card transition-all focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10 overflow-hidden min-h-[52px]">
                    <span className="flex items-center px-3.5 text-base sm:text-lg font-medium text-muted-foreground border-r border-border bg-muted/40 select-none">
                      +91
                    </span>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel-national"
                      aria-label="10-digit mobile number"
                      aria-required={isRequired}
                      value={current.text}
                      onChange={(e) => {
                        let digits = e.target.value.replace(/[^\d]/g, "");
                        // Auto-strip leading +91 or 0 if pasted
                        if (digits.length > 10 && digits.startsWith("91")) {
                          digits = digits.slice(2);
                        } else if (digits.length > 10 && digits.startsWith("0")) {
                          digits = digits.slice(1);
                        }
                        if (digits.length > 10) digits = digits.slice(0, 10);
                        update({ text: digits });
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          goNext();
                        }
                      }}
                      placeholder={t.phonePlaceholder}
                      className="flex-1 px-4 py-3 text-base sm:text-lg bg-transparent outline-none placeholder:text-muted-foreground/50"
                    />
                  </div>
                ) : question.id === "city" ? (
                  <CityInput
                    value={current.text ?? ""}
                    onChange={(val) => update({ text: val })}
                    lang={lang}
                    t={t}
                    onEnter={goNext}
                  />
                ) : (
                  <input
                    id={question.id === "name" ? "name" : undefined}
                    name={question.id === "name" ? "name" : undefined}
                    type="text"
                    autoComplete={question.id === "name" ? "name" : undefined}
                    aria-label={question.label[lang]}
                    aria-required={isRequired}
                    value={current.text}
                    onChange={(e) => update({ text: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        goNext();
                      }
                    }}
                    placeholder={t.yourAnswer}
                    className="w-full min-h-[52px] px-4 py-3 text-base sm:text-lg rounded-xl border-2 border-border bg-card outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10 placeholder:text-muted-foreground/50"
                  />
                )}
              </div>
            )}

            {/* Long Answer textarea */}
            {question.type === "longtext" && !hasAudioAnswer && (
              <div className="space-y-2">
                <textarea
                  aria-label={question.label[lang]}
                  value={current.text}
                  onChange={(e) => update({ text: e.target.value })}
                  placeholder={t.yourAnswer}
                  rows={4}
                  className="w-full px-4 py-3 text-base sm:text-lg rounded-xl border-2 border-border bg-card outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10 resize-none placeholder:text-muted-foreground/50"
                />
              </div>
            )}

            {/* Number with Unit (e.g., Q12: Hours, Days, Months) */}
            {question.type === "number_unit" && (
              <div className="flex gap-2.5 sm:gap-3">
                <div className="flex-1">
                  <input
                    type="number"
                    min="1"
                    aria-label="Duration number"
                    value={current.details ?? ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      const unit = current.choice || question.options![lang][0];
                      update({
                        details: val,
                        choice: unit,
                        text: val ? `${val} ${unit}` : "",
                      });
                    }}
                    placeholder="e.g. 3"
                    className="w-full min-h-[52px] px-4 py-3 text-base sm:text-lg rounded-xl border-2 border-border bg-card outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10 placeholder:text-muted-foreground/50"
                  />
                </div>
                <div className="flex-1">
                  <select
                    aria-label="Duration unit"
                    value={current.choice || question.options![lang][0]}
                    onChange={(e) => {
                      const unit = e.target.value;
                      const val = current.details ?? "";
                      update({
                        choice: unit,
                        details: val,
                        text: val ? `${val} ${unit}` : "",
                      });
                    }}
                    className="w-full min-h-[52px] px-3.5 py-3 text-base sm:text-lg rounded-xl border-2 border-border bg-card outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10 cursor-pointer"
                  >
                    {question.options![lang].map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Single Choice (Radio) */}
            {question.type === "choice" && (
              <div
                className="space-y-2"
                role="radiogroup"
                aria-label={question.label[lang]}
              >
                {question.options![lang].map((opt, optIdx) => {
                  const isOtherOption =
                    question.allowOther && optIdx === question.options![lang].length - 1;
                  const isSelected =
                    current.choice === opt ||
                    current.text === opt ||
                    Boolean(current.text?.startsWith(opt + " - "));

                  return (
                    <button
                      key={opt}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => {
                        if (isOtherOption) {
                          const details = current.details ?? "";
                          update({
                            choice: opt,
                            details,
                            text: details.trim() ? `${opt} - ${details.trim()}` : opt,
                          });
                        } else {
                          update({ choice: opt, text: opt, details: "" });
                        }
                      }}
                      className={`w-full min-h-[46px] sm:min-h-[48px] flex items-center gap-3.5 sm:gap-4 px-4 sm:px-5 py-2.5 sm:py-3 text-left text-base sm:text-lg rounded-xl border-2 transition-all ${
                        isSelected
                          ? "border-primary bg-primary/10 shadow-sm"
                          : "border-border bg-card hover:border-primary/40 active:scale-[0.98]"
                      }`}
                    >
                      <span
                        className={`flex-shrink-0 h-5 w-5 sm:h-6 sm:w-6 rounded-full border-2 flex items-center justify-center transition-all ${
                          isSelected
                            ? "border-primary bg-primary"
                            : "border-muted-foreground/40"
                        }`}
                      >
                        {isSelected && (
                          <span className="h-2.5 w-2.5 rounded-full bg-primary-foreground" />
                        )}
                      </span>
                      <span className={isSelected ? "font-semibold" : ""}>{opt}</span>
                    </button>
                  );
                })}

                {/* Other text input for Single Choice */}
                {question.allowOther &&
                  (current.choice === question.options![lang][question.options![lang].length - 1] ||
                    Boolean(
                      current.text?.startsWith(
                        question.options![lang][question.options![lang].length - 1] + " - "
                      )
                    )) && (
                    <div className="mt-2.5 p-3.5 rounded-xl bg-muted/40 border border-border animate-in fade-in">
                      <label className="block text-sm font-medium text-foreground mb-1.5">
                        {t.specifyOther}
                      </label>
                      <input
                        aria-label={t.specifyOther}
                        value={current.details ?? ""}
                        onChange={(e) => {
                          const details = e.target.value;
                          const otherOpt =
                            question.options![lang][question.options![lang].length - 1]!;
                          update({
                            choice: otherOpt,
                            details,
                            text: details.trim() ? `${otherOpt} - ${details.trim()}` : otherOpt,
                          });
                        }}
                        placeholder={t.specifyOther}
                        className="w-full min-h-[48px] px-4 py-3 text-base sm:text-lg rounded-xl border-2 border-border bg-card outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10"
                      />
                    </div>
                  )}
              </div>
            )}

            {/* Multiple Choice Checkboxes */}
            {question.type === "checkbox" && (
              <div
                className="space-y-2"
                role="group"
                aria-label={question.label[lang]}
              >
                {question.options![lang].map((opt, optIdx) => {
                  const isOther =
                    question.allowOther && optIdx === question.options![lang].length - 1;
                  const isExclusive =
                    question.exclusiveOptionIndex !== undefined &&
                    optIdx === question.exclusiveOptionIndex;

                  const selectedList = current.text
                    ? current.text
                        .split(", ")
                        .map((s) => s.trim())
                        .filter(Boolean)
                    : [];

                  const isChecked = isOther
                    ? selectedList.some(
                        (s) =>
                          s === opt ||
                          s.startsWith(opt + " - ") ||
                          s.startsWith(opt + ": ") ||
                          s === "Other" ||
                          s.startsWith("Other - ")
                      )
                    : selectedList.includes(opt);

                  return (
                    <button
                      key={opt}
                      type="button"
                      role="checkbox"
                      aria-checked={isChecked}
                      onClick={() => {
                        let nextList: string[];

                        if (isExclusive) {
                          if (isChecked) {
                            nextList = [];
                          } else {
                            nextList = [opt];
                          }
                          update({ text: nextList.join(", "), details: "" });
                          return;
                        }

                        const filteredList =
                          question.exclusiveOptionIndex !== undefined
                            ? selectedList.filter(
                                (s) => s !== question.options![lang][question.exclusiveOptionIndex!]
                              )
                            : selectedList;

                        if (isOther) {
                          if (isChecked) {
                            nextList = filteredList.filter(
                              (s) =>
                                s !== opt &&
                                !s.startsWith(opt + " - ") &&
                                !s.startsWith(opt + ": ") &&
                                s !== "Other" &&
                                !s.startsWith("Other - ")
                            );
                            update({ text: nextList.join(", "), details: "" });
                          } else {
                            const details = current.details?.trim();
                            const otherVal = details ? `${opt} - ${details}` : opt;
                            nextList = [...filteredList, otherVal];
                            update({ text: nextList.join(", ") });
                          }
                        } else {
                          nextList = isChecked
                            ? filteredList.filter((s) => s !== opt)
                            : [...filteredList, opt];
                          update({ text: nextList.join(", ") });
                        }
                      }}
                      className={`w-full min-h-[46px] sm:min-h-[48px] flex items-center gap-3.5 sm:gap-4 px-4 sm:px-5 py-2.5 sm:py-3 text-left text-base sm:text-lg rounded-xl border-2 transition-all ${
                        isChecked
                          ? "border-primary bg-primary/10 shadow-sm"
                          : "border-border bg-card hover:border-primary/40 active:scale-[0.98]"
                      }`}
                    >
                      <span
                        className={`flex-shrink-0 h-5 w-5 sm:h-6 sm:w-6 rounded border-2 flex items-center justify-center transition-all ${
                          isChecked
                            ? "border-primary bg-primary"
                            : "border-muted-foreground/40"
                        }`}
                      >
                        {isChecked && (
                          <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 stroke-[3] text-primary-foreground" />
                        )}
                      </span>
                      <span className={isChecked ? "font-semibold" : ""}>{opt}</span>
                    </button>
                  );
                })}

                {/* Other text input for Checkboxes */}
                {question.allowOther && (() => {
                  const otherOpt = question.options![lang][question.options![lang].length - 1]!;
                  const selectedList = current.text
                    ? current.text
                        .split(", ")
                        .map((s) => s.trim())
                        .filter(Boolean)
                    : [];

                  const isOtherChecked = selectedList.some(
                    (s) =>
                      s === otherOpt ||
                      s.startsWith(otherOpt + " - ") ||
                      s.startsWith(otherOpt + ": ") ||
                      s === "Other" ||
                      s.startsWith("Other - ")
                  );

                  if (!isOtherChecked) return null;

                  const otherEntry = selectedList.find(
                    (s) =>
                      s.startsWith(otherOpt + " - ") ||
                      s.startsWith(otherOpt + ": ") ||
                      s.startsWith("Other - ")
                  );
                  const existingDetails =
                    current.details ??
                    (otherEntry ? otherEntry.split(/ - |: /).slice(1).join(" - ") : "");

                  return (
                    <div className="mt-2.5 p-3.5 rounded-xl bg-muted/40 border border-border animate-in fade-in">
                      <label className="block text-sm font-medium text-foreground mb-1.5">
                        {t.specifyOther}
                      </label>
                      <input
                        aria-label={t.specifyOther}
                        value={existingDetails}
                        onChange={(e) => {
                          const details = e.target.value;
                          const updatedList = selectedList.map((item) => {
                            if (
                              item === otherOpt ||
                              item.startsWith(otherOpt + " - ") ||
                              item.startsWith(otherOpt + ": ") ||
                              item === "Other" ||
                              item.startsWith("Other - ")
                            ) {
                              return details.trim() ? `${otherOpt} - ${details.trim()}` : otherOpt;
                            }
                            return item;
                          });
                          update({
                            details,
                            text: updatedList.join(", "),
                          });
                        }}
                        placeholder={t.specifyOther}
                        className="w-full min-h-[48px] px-4 py-3 text-base sm:text-lg rounded-xl border-2 border-border bg-card outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10"
                      />
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Q20: File Upload (Photos / Videos) */}
            {question.type === "file_upload" && (
              <div className="space-y-3.5">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleFileChange}
                  disabled={isCompressing}
                  className="hidden"
                  id="survey-media-upload"
                  aria-label="Upload photos or videos"
                />

                {(!current.files || current.files.length === 0) && !current.fileUrl ? (
                  <label
                    htmlFor="survey-media-upload"
                    className={`flex flex-col items-center justify-center gap-2.5 rounded-2xl border-2 border-dashed border-border bg-card shadow-xs p-6 sm:p-8 text-center transition-all ${
                      isCompressing
                        ? "cursor-wait opacity-70"
                        : "cursor-pointer hover:border-primary hover:shadow-sm active:scale-[0.98]"
                    }`}
                  >
                    <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                      {isCompressing ? (
                        <Loader2 className="h-6 w-6 animate-spin" />
                      ) : (
                        <Upload className="h-6 w-6" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm sm:text-base font-semibold text-foreground">
                        {isCompressing ? "Compressing media..." : t.uploadPhotosVideos}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">{t.uploadHint}</p>
                    </div>
                  </label>
                ) : (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      {(current.files && current.files.length > 0
                        ? current.files
                        : [
                            {
                              fileUrl: current.fileUrl!,
                              fileName: current.fileName,
                              fileType: current.fileType,
                              fileSize: undefined,
                            },
                          ]
                      ).map((fileItem, fIdx) => (
                        <div
                          key={fIdx}
                          className="flex items-center justify-between gap-3 rounded-xl border-2 border-border bg-card p-2.5 sm:p-3 shadow-xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {fileItem.fileType?.startsWith("image/") ? (
                              <img
                                src={fileItem.fileUrl}
                                alt="Preview"
                                className="h-11 w-11 sm:h-12 sm:w-12 rounded-lg object-cover border border-border shrink-0"
                              />
                            ) : fileItem.fileType?.startsWith("video/") ? (
                              <div className="flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <Film className="h-5 w-5" />
                              </div>
                            ) : (
                              <div className="flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                                <Paperclip className="h-5 w-5" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-xs sm:text-sm font-medium text-foreground truncate">
                                {fileItem.fileName || t.fileAttached}
                              </p>
                              {fileItem.fileSize ? (
                                <p className="text-[11px] text-muted-foreground">
                                  {(fileItem.fileSize / 1024).toFixed(0)} KB
                                </p>
                              ) : null}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveSpecificFile(fIdx)}
                            className="p-2 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors shrink-0"
                            aria-label={`${t.removeFile} ${fileItem.fileName}`}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <label
                        htmlFor="survey-media-upload"
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-border bg-muted/70 text-foreground transition-all ${
                          isCompressing
                            ? "cursor-wait opacity-60"
                            : "cursor-pointer hover:bg-accent active:scale-95"
                        }`}
                      >
                        <Upload className="h-3.5 w-3.5 text-primary" />
                        <span>
                          {isCompressing ? "Compressing..." : t.uploadMoreFiles}
                        </span>
                      </label>
                      <span className="text-xs text-muted-foreground">
                        {current.files?.length || 1} {t.filesAttached}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Voice Input */}
            {question.type !== "choice" &&
              question.type !== "checkbox" &&
              question.type !== "file_upload" &&
              question.type !== "number_unit" && (
                <VoiceInput
                  lang={lang}
                  questionType={question.type}
                  disableAudioRecording={
                    question.id === "name" ||
                    question.id === "phone" ||
                    question.id === "city"
                  }
                  existingText={current.text}
                  onTranscript={(text) =>
                    update({ text: current.text ? `${current.text} ${text}` : text })
                  }
                  audioUrl={current.audioUrl}
                  onRecordingChange={setIsRecordingAudio}
                  onAudio={(blob, previewUrl) => {
                    if (blob && previewUrl) {
                      audioBlobsRef.current[question.id] = blob;
                      update({ text: "", audioUrl: previewUrl });
                    } else {
                      delete audioBlobsRef.current[question.id];
                      update({ audioUrl: undefined });
                    }
                  }}
                  onRecordStart={() => {
                    if (current.audioUrl?.startsWith("blob:")) {
                      URL.revokeObjectURL(current.audioUrl);
                    }
                    delete audioBlobsRef.current[question.id];
                    update({ text: "", audioUrl: undefined });
                  }}
                />
              )}

            {/* Error Banner with ARIA live */}
            {error && (
              <div
                role="alert"
                aria-live="assertive"
                className="mt-3.5 px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/20 animate-in fade-in"
              >
                <p className="text-xs sm:text-sm font-semibold text-destructive">{error}</p>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="mt-5 flex items-center gap-2.5 sm:gap-3">
              <button
                type="button"
                onClick={handleBack}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 min-h-[48px] px-4 sm:px-5 py-3 rounded-xl text-sm sm:text-base font-medium text-foreground bg-card border-2 border-border transition-all hover:bg-accent active:scale-[0.97]"
                aria-label="Previous question"
              >
                <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>{t.back}</span>
              </button>

              <button
                type="button"
                onClick={goNext}
                disabled={submitting || isCompressing}
                className="flex-[2] sm:flex-[3] inline-flex items-center justify-center gap-2 min-h-[48px] px-5 sm:px-6 py-3 rounded-xl text-sm sm:text-base font-semibold bg-primary text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97]"
                aria-label={step === total - 1 ? t.submit : t.next}
              >
                {(submitting || isCompressing) && (
                  <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                )}
                <span>
                  {submitting && uploadProgress && uploadProgress.total > 0
                    ? `Uploading ${uploadProgress.current}/${uploadProgress.total}...`
                    : step === total - 1
                    ? t.submit
                    : t.next}
                </span>
                {!(submitting || isCompressing) && step < total - 1 && (
                  <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Footer */}
      <div className="mt-6 sm:mt-8 text-center">
        <p className="text-xs text-muted-foreground font-medium">
          {LANGUAGES.find((l) => l.code === lang)?.native} · {step + 1} of {total} · {Math.round(progress)}%
        </p>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm px-4 pb-6 sm:pb-0"
          onClick={() => setShowConfirm(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-dialog-title"
        >
          <div
            className="w-full max-w-sm bg-card rounded-2xl shadow-2xl border border-border p-5 sm:p-6 animate-in fade-in slide-in-from-bottom-4 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-2.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Check className="h-5 w-5 text-primary" />
              </div>
              <h2 id="confirm-dialog-title" className="text-base font-bold text-foreground">
                {t.confirmTitle}
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mb-5 pl-[52px] leading-relaxed">
              {t.confirmMsg}
            </p>
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="flex-1 min-h-[44px] px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium border-2 border-border text-foreground hover:bg-accent transition-all active:scale-[0.97]"
              >
                {t.confirmCancel}
              </button>
              <button
                type="button"
                onClick={handleConfirmedSubmit}
                className="flex-[2] min-h-[44px] px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-green-600 hover:bg-green-700 text-white shadow-sm transition-all active:scale-[0.97]"
              >
                {t.confirmYes}
              </button>
            </div>
          </div>
        </div>
      )}
    </Shell>
  );
}

// ─── City Input with Geolocation & Quick Cities ──────────────────────────────
function CityInput({
  value,
  onChange,
  lang: _lang,
  t,
  onEnter,
}: {
  value: string;
  onChange: (val: string) => void;
  lang: Lang;
  t: (typeof UI)[Lang];
  onEnter: () => void;
}) {
  const [isLocating, setIsLocating] = useState(false);

  const handleDetectCity = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      toast.error(t.locationError);
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          );
          if (res.ok) {
            const data = await res.json();
            const detected = data.city || data.locality || "";
            if (detected) {
              const cleanCity = detected.replace(/\s*(City|Taluka|District)\s*$/gi, "").trim();
              onChange(cleanCity);
              toast.success(`${t.locationDetected}${cleanCity}`);
            } else {
              toast.error(t.locationError);
            }
          }
        } catch (err) {
          console.error("Geocoding error:", err);
          toast.error(t.locationError);
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        setIsLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          toast.error(t.locationDenied);
        } else {
          toast.error(t.locationError);
        }
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
    );
  };

  return (
    <div className="space-y-2.5">
      {/* Quick Select Chips */}
      <div>
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
          Quick select popular cities:
        </span>
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {QUICK_CITIES.map((c) => {
            const isSelected = value.toLowerCase() === c.toLowerCase();
            return (
              <button
                key={c}
                type="button"
                role="button"
                aria-pressed={isSelected}
                onClick={() => onChange(c)}
                className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium border transition-all ${
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary shadow-xs scale-102"
                    : "bg-card border-border hover:border-primary/50 hover:bg-primary/5 active:scale-95"
                }`}
              >
                {c}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between pt-0.5">
        <label htmlFor="city-input" className="sr-only">
          {t.yourAnswer}
        </label>
        <button
          type="button"
          onClick={handleDetectCity}
          disabled={isLocating}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors ml-auto pb-0.5"
          title={t.detectLocation}
        >
          {isLocating ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <MapPin className="w-3.5 h-3.5" />
          )}
          <span>{isLocating ? t.detectingLocation : t.detectLocation}</span>
        </button>
      </div>

      <input
        id="city-input"
        name="city"
        type="text"
        autoComplete="address-level2"
        aria-label="Which city are you from?"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onEnter();
          }
        }}
        placeholder={t.cityPlaceholder}
        className="w-full min-h-[52px] px-4 py-3 text-base sm:text-lg rounded-xl border-2 border-border bg-card outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10 placeholder:text-muted-foreground/50"
      />
    </div>
  );
}

// ─── Outer Shell ─────────────────────────────────────────────────────────────
function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-[100dvh] survey-form-shell px-3 sm:px-4 py-4 sm:py-10 pb-6 sm:pb-12 flex flex-col justify-between overflow-x-hidden">
      <Toaster
        position="bottom-center"
        toastOptions={{
          style: {
            fontSize: "0.85rem",
            padding: "10px 16px",
            borderRadius: "10px",
          },
        }}
      />
      <div className="mx-auto w-full max-w-2xl survey-glass-panel flex-1">{children}</div>
      <footer className="mt-6 sm:mt-8 text-center space-y-1 px-2">
        <p className="text-xs text-muted-foreground text-foreground/80">
          KKWIEER – MCA
        </p>
        <p className="text-[11px] text-muted-foreground">
          Kumbh Mela Research & Visitor Experience Survey
        </p>
      </footer>
    </main>
  );
}
