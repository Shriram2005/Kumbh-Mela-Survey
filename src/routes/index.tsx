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
} from "lucide-react";
import { Toaster, toast } from "sonner";
import { VoiceInput } from "@/components/VoiceInput";
import {
  LANGUAGES,
  QUESTIONS,
  UI,
  saveResponse,
  type Answers,
  type Answer,
  type Lang,
} from "@/lib/survey";
import { uploadAudioToS3, uploadFileToS3 } from "@/lib/s3";
import { saveDraft, loadDraft, clearDraft, markAsSubmitted, hasSubmitted, clearSubmissionStatus } from "@/lib/draft";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Kumbh Mela Visitor Survey | Share Your Experience" },
      {
        name: "description",
        content:
          "Answer a short Kumbh Mela visitor survey in English, Hindi or Marathi. Reply by typing, voice typing or an audio recording.",
      },
      { property: "og:title", content: "Kumbh Mela Visitor Survey" },
      {
        property: "og:description",
        content:
          "Share your Kumbh Mela experience in English, Hindi or Marathi — type or answer with your voice.",
      },
    ],
  }),
  component: SurveyPage,
});

function SurveyPage() {
  const [lang, setLang] = useState<Lang | null>(null);
  const [showIntro, setShowIntro] = useState(false);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [error, setError] = useState<string | null>(null);

  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Audio blobs kept in memory during form filling — zero uploads to AWS until final submit
  const audioBlobsRef = useRef<Record<string, Blob>>({});
  // Attached files kept in memory until final submit (supports multiple files per question)
  const filesRef = useRef<Record<string, (File | Blob)[]>>({});
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Generate a stable response ID for the entire survey session
  const responseIdRef = useRef<string>(crypto.randomUUID());
  const draftRestoredRef = useRef(false);

  // Restore draft on mount if one exists
  useEffect(() => {
    let active = true;
    
    // Check if user has already submitted
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
        // Re-instantiate local object URLs for audio playback
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
      setStep(typeof draft.step === "number" ? draft.step : 0);
      setLang(draft.lang);

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

  // Auto-save draft whenever answers, step, or language updates
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

  // Auto-scroll to newly revealed active question when step changes
  useEffect(() => {
    if (activeQuestionRef.current) {
      activeQuestionRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
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

  const isTypingQuestion =
    question.type === "text" ||
    question.type === "longtext" ||
    question.type === "file_text";

  const update = (patch: Partial<Answer>) => {
    setAnswers((prev) => ({
      ...prev,
      [question.id]: { ...(prev[question.id] ?? { text: "" }), ...patch },
    }));
    setError(null);
  };

  const MAX_TOTAL_FILE_SIZE = 10 * 1024 * 1024; // 10MB total limit across all files

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    const existingFiles = filesRef.current[question.id] || [];
    const combinedFiles = [...existingFiles, ...selectedFiles];

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
      });
    } else {
      delete filesRef.current[question.id];
      update({
        files: undefined,
        fileUrl: undefined,
        fileName: undefined,
        fileType: undefined,
      });
    }
  };

  const goNext = async () => {
    // Phone validation — optional but must be valid if filled
    if (question.id === "phone") {
      const phone = current.text?.trim() ?? "";
      if (phone.length > 0) {
        // Strip formatting chars for digit count check
        const digits = phone.replace(/[^\d]/g, "");
        if (digits.length !== 10) {
          const msg =
            lang === "hi"
              ? "कृपया 10 अंकों का वैध मोबाइल नंबर दर्ज करें"
              : lang === "mr"
              ? "कृपया 10 अंकांचा वैध मोबाइल नंबर प्रविष्ट करा"
              : "Please enter a valid 10-digit mobile number";
          setError(msg);
          return;
        }
      }
      // Phone is optional — valid empty or valid number → proceed
      setError(null);
      setStep((s) => s + 1);
      return;
    }

    // Email validation — optional but must be valid format if filled
    if (question.id === "email") {
      const email = current.text?.trim() ?? "";
      if (email.length > 0) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          const msg =
            lang === "hi"
              ? "कृपया एक मान्य ईमेल पता दर्ज करें"
              : lang === "mr"
              ? "कृपया वैध ईमेल पत्ता प्रविष्ट करा"
              : "Please enter a valid email address";
          setError(msg);
          return;
        }
      }
      setError(null);
      setStep((s) => s + 1);
      return;
    }

    // Only typing questions are optional; choice and checkbox questions are required
    if (!isTypingQuestion) {
      const hasText = Boolean(current.text?.trim());
      const hasAudio = Boolean(current.audioUrl);
      if (!hasText && !hasAudio) {
        setError(
          lang === "hi"
            ? "यह प्रश्न आवश्यक है"
            : lang === "mr"
            ? "हा प्रश्न आवश्यक आहे"
            : "This question is required"
        );
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
    try {
      const finalAnswers: Answers = { ...answers };

      const audioUploadPromises = Object.entries(audioBlobsRef.current).map(
        async ([qid, blob]) => {
          try {
            const s3Url = await uploadAudioToS3(blob, responseIdRef.current, qid);
            return { qid, s3Url };
          } catch (err) {
            console.error(`Failed to upload audio for question ${qid} to S3:`, err);
            return { qid, s3Url: undefined };
          }
        },
      );

      const fileUploadPromises = Object.entries(filesRef.current).flatMap(
        ([qid, filesList]) => {
          return filesList.map(async (fileOrBlob, idx) => {
            try {
              const fileName = fileOrBlob instanceof File ? fileOrBlob.name : undefined;
              const uploadTag = filesList.length > 1 ? `${qid}_${idx + 1}` : qid;
              const s3Url = await uploadFileToS3(
                fileOrBlob,
                responseIdRef.current,
                uploadTag,
                fileName,
              );
              return {
                qid,
                s3Url,
                fileName: fileName || `file_${idx + 1}`,
                fileType: fileOrBlob.type || "application/octet-stream",
                fileSize: fileOrBlob.size,
              };
            } catch (err) {
              console.error(`Failed to upload file for question ${qid} to S3:`, err);
              return {
                qid,
                s3Url: undefined,
                fileName: undefined,
                fileType: undefined,
                fileSize: undefined,
              };
            }
          });
        },
      );

      const [audioResults, fileResults] = await Promise.all([
        Promise.all(audioUploadPromises),
        Promise.all(fileUploadPromises),
      ]);

      for (const { qid, s3Url } of audioResults) {
        if (finalAnswers[qid] && s3Url) {
          finalAnswers[qid] = { ...finalAnswers[qid], audioUrl: s3Url };
        } else if (finalAnswers[qid]) {
          const { audioUrl: _blobUrl, ...rest } = finalAnswers[qid] as any;
          finalAnswers[qid] = rest;
        }
      }

      const fileResultsByQid: Record<
        string,
        Array<{ fileUrl: string; fileName?: string; fileType?: string; fileSize?: number }>
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
          } else {
            const {
              fileUrl: _fileBlobUrl,
              fileName: _fn,
              fileType: _ft,
              files: _fls,
              ...rest
            } = finalAnswers[qid] as any;
            finalAnswers[qid] = rest;
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
        if (a.audioUrl && a.audioUrl.startsWith("blob:")) URL.revokeObjectURL(a.audioUrl);
        if (a.fileUrl && a.fileUrl.startsWith("blob:")) URL.revokeObjectURL(a.fileUrl);
        if (a.files) {
          a.files.forEach((f) => {
            if (f.fileUrl && f.fileUrl.startsWith("blob:")) URL.revokeObjectURL(f.fileUrl);
          });
        }
      });
      audioBlobsRef.current = {};
      filesRef.current = {};

      setSubmitted(true);
    } catch (err) {
      console.error("Submit error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const restart = () => {
    clearDraft();
    clearSubmissionStatus();
    draftRestoredRef.current = false;
    Object.values(answers).forEach((a) => {
      if (a.audioUrl && a.audioUrl.startsWith("blob:")) URL.revokeObjectURL(a.audioUrl);
      if (a.fileUrl && a.fileUrl.startsWith("blob:")) URL.revokeObjectURL(a.fileUrl);
      if (a.files) {
        a.files.forEach((f) => {
          if (f.fileUrl && f.fileUrl.startsWith("blob:")) URL.revokeObjectURL(f.fileUrl);
        });
      }
    });
    audioBlobsRef.current = {};
    filesRef.current = {};
    setAnswers({});
    setStep(0);
    setSubmitted(false);
    setLang(null);
    responseIdRef.current = crypto.randomUUID();
  };

  if (submitted) {
    return (
      <Shell>
        <div className="text-center py-8 animate-in fade-in zoom-in duration-500">
          <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-primary/10 text-primary mb-6">
            <Check className="h-10 w-10" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground mb-3">
            {t.thanks}
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-md mx-auto">
            {t.thanksBody}
          </p>
          <button
            type="button"
            onClick={restart}
            className="mt-8 inline-flex items-center gap-2 px-6 py-3 rounded-xl text-base font-medium text-primary border-2 border-primary hover:bg-primary hover:text-primary-foreground transition-all active:scale-[0.97]"
          >
            <span>{t.another}</span>
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </Shell>
    );
  }

  if (!lang) {
    return (
      <Shell>
        <div className="text-center mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground">
            Kumbh Mela – Experience and Suggestions Form
          </h1>
          <p className="mt-2 text-sm sm:text-base text-muted-foreground">
            कुंभ मेला – अनुभव एवं सुझाव फ़ॉर्म
          </p>
        </div>
        
        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-6 duration-700">
          <p className="text-center text-sm sm:text-base font-medium text-foreground mb-4">
            Choose your language · अपनी भाषा चुनें · तुमची भाषा निवडा
          </p>
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => { setLang(l.code); setShowIntro(true); }}
              className="w-full flex items-center justify-between rounded-xl border-2 border-border bg-card px-6 py-5 text-left transition-all hover:border-primary hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
            >
              <span className="flex items-center gap-3">
                <span className="text-2xl">🌐</span>
                <span>
                  <span className="block text-lg font-semibold text-foreground">{l.native}</span>
                  <span className="block text-sm text-muted-foreground">{l.label}</span>
                </span>
              </span>
              <ChevronRight className="h-6 w-6 text-muted-foreground" />
            </button>
          ))}
        </div>
        
        <p className="mt-8 text-center text-xs text-muted-foreground">
          Your feedback helps improve the experience for millions of pilgrims
        </p>
      </Shell>
    );
  }

  if (showIntro && lang) {
    const introContent = {
      en: {
        greeting: "Dear Sir/Madam,",
        body: "We are collecting information from people who have previously visited or experienced the Kumbh Mela to understand their experiences, challenges, and expectations.\n\nIf you have previously attended the Kumbh Mela, kindly fill out this form and share your experience.",
        bullets: [
          "Your responses will help us understand the experiences of pilgrims and visitors.",
          "The collected information will support the study and planning of better facilities and services for the upcoming Nashik Kumbh Mela.",
          "If you know anyone who has previously attended the Kumbh Mela, kindly share this QR code/form link with your friends, relatives, neighbours, and other contacts.",
          "Please provide accurate information based on your own experience.",
          "Your participation is valuable and will contribute to better understanding and planning for future Kumbh Mela events.",
        ],
        closing: "Thank you for your valuable participation and support.",
        cta: "Start Survey",
        changeLang: "Change language",
      },
      hi: {
        greeting: "प्रिय महोदय / महोदया,",
        body: "हम उन लोगों से जानकारी एकत्र कर रहे हैं जिन्होंने पूर्व में कुंभ मेले में भाग लिया है या कुंभ मेले का अनुभव लिया है, ताकि उनके अनुभव, समस्याओं और अपेक्षाओं को समझा जा सके।\n\nयदि आपने पहले कुंभ मेले में भाग लिया है, तो कृपया इस फ़ॉर्म को भरकर अपना अनुभव साझा करें।",
        bullets: [
          "आपकी प्रतिक्रिया से तीर्थयात्रियों एवं आगंतुकों के अनुभवों को समझने में सहायता मिलेगी।",
          "एकत्रित जानकारी आगामी नासिक कुंभ मेले के लिए बेहतर सुविधाओं एवं सेवाओं के अध्ययन और योजना में सहायक होगी।",
          "यदि आप ऐसे किसी व्यक्ति को जानते हैं जिसने पूर्व में कुंभ मेले में भाग लिया है, तो कृपया यह QR Code/Form Link अपने मित्रों, रिश्तेदारों, पड़ोसियों एवं अन्य परिचितों के साथ साझा करें।",
          "कृपया अपने स्वयं के अनुभव के आधार पर सही एवं सटीक जानकारी प्रदान करें।",
          "आपकी सहभागिता भविष्य के कुंभ मेले की बेहतर समझ एवं योजना बनाने में महत्वपूर्ण योगदान देगी।",
        ],
        closing: "आपकी मूल्यवान सहभागिता एवं सहयोग के लिए धन्यवाद।",
        cta: "सर्वेक्षण शुरू करें",
        changeLang: "भाषा बदलें",
      },
      mr: {
        greeting: "प्रिय महोदय / महोदया,",
        body: "आम्ही अशा व्यक्तींकडून माहिती गोळा करत आहोत ज्यांनी यापूर्वी कुंभमेळ्यात सहभाग घेतला आहे किंवा कुंभमेळ्याचा अनुभव घेतला आहे, जेणेकरून त्यांचे अनुभव, अडचणी आणि अपेक्षा समजून घेता येतील.\n\nजर तुम्ही यापूर्वी कुंभमेळ्यात सहभागी झाला असाल, तर कृपया हा फॉर्म भरून आपला अनुभव नक्की शेअर करा.",
        bullets: [
          "तुमच्या प्रतिसादांमुळे भाविक आणि पर्यटकांचे अनुभव समजून घेण्यास मदत होईल.",
          "गोळा केलेली माहिती आगामी नासिक कुंभमेळ्यासाठी उत्तम सुविधा आणि सेवांचे नियोजन व अभ्यास करण्यासाठी उपयुक्त ठरेल.",
          "जर तुम्ही अशा कोणाला ओळखत असाल ज्यांनी यापूर्वी कुंभमेळ्यात सहभाग घेतला आहे, तर कृपया हा QR Code / फॉर्म लिंक तुमच्या मित्रांसोबत, नातेवाईकांसोबत आणि परिचितांसोबत नक्की शेअर करा.",
          "कृपया आपल्या स्वतःच्या अनुभवाच्या आधारे खरी आणि अचूक माहिती द्या.",
          "तुमचा सहभाग भविष्यातील कुंभमेळ्याच्या उत्तम नियोजनात अत्यंत मोलाचे योगदान देईल.",
        ],
        closing: "तुमच्या मौल्यवान सहभागाबद्दल आणि सहकार्याबद्दल मनापासून धन्यवाद.",
        cta: "सर्वेक्षण सुरू करा",
        changeLang: "भाषा बदला",
      },
    } as const;
    const intro = introContent[lang];
    return (    
      <Shell>
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col gap-5 pb-4 pt-6">
          {/* Info card */}
          <div className="rounded-2xl border border-border/60 bg-card/85 px-6 py-7 sm:px-8 sm:py-8 shadow-sm">
            {/* Greeting */}
            <p className="text-base sm:text-xl font-bold text-foreground mb-4">{intro.greeting}</p>

            {/* Body paragraphs */}
            <div className="space-y-4 mb-6">
              {intro.body.split("\n\n").map((para, i) => (
                <p key={i} className="text-base sm:text-lg text-muted-foreground leading-relaxed">{para}</p>
              ))}
            </div>

            {/* Bullet points */}
            <ul className="space-y-3.5 mb-6">
              {intro.bullets.map((b, i) => (
                <li key={i} className="flex items-start gap-3 text-base sm:text-lg text-foreground leading-relaxed">
                  <span className="shrink-0 text-primary font-bold text-lg leading-none mt-1">→</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>

            {/* Divider */}
            <div className="border-t border-border/60 pt-5">
              <p className="text-base sm:text-lg font-semibold text-foreground">{intro.closing}</p>
            </div>
          </div>

          {/* CTA */}
          <button
            type="button"
            onClick={() => setShowIntro(false)}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl text-lg sm:text-xl font-semibold bg-primary text-primary-foreground shadow-md transition-all hover:bg-primary/90 hover:shadow-lg active:scale-[0.97]"
          >
            <span>{intro.cta}</span>
            <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>

          <button
            type="button"
            onClick={() => { setLang(null); setShowIntro(false); }}
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

  return (
    <Shell>
      {/* Ultra-minimal Fixed Edge Progress Bar (Typeform/Linear Style) */}
      <div className="fixed top-0 left-0 right-0 z-50 h-[3px] bg-foreground/5 pointer-events-none">
        <div
          className="h-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Chat-like Conversation Flow */}
      <div className="space-y-4 sm:space-y-5 pt-2 sm:pt-4">
        {QUESTIONS.slice(0, step + 1).map((q, idx) => {
          const ans = answers[q.id];
          const isActive = idx === step;

          // Previous questions show as completed chat messages
          if (!isActive) {
            return (
              <div key={q.id} className="space-y-3 animate-in fade-in duration-300">
                {/* Question Bubble - Left Aligned */}
                <div className="flex justify-start">
                  <div className="max-w-[85%] sm:max-w-[75%]">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-t-2xl rounded-br-2xl bg-muted/60 border border-border/40">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Q{idx + 1}
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
                    <div className="mt-1 px-4 py-3 rounded-2xl rounded-tl-sm bg-amber-200/70 border border-border shadow-sm">
                      <p className="text-[15px] sm:text-base leading-relaxed text-foreground">
                        {q.label[lang]}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Answer Bubble - Right Aligned */}
                <div className="flex justify-end">
                  <div className="max-w-[85%] sm:max-w-[75%]">
                    <div className="px-4 py-3 rounded-2xl rounded-br-sm bg-primary/90 text-primary-foreground shadow-sm">
                      {ans?.text ? (
                        <p className="text-[15px] sm:text-base leading-relaxed whitespace-pre-line break-words">
                          {ans.text}
                        </p>
                      ) : null}
                      {ans?.audioUrl && (
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-xs">🎙️</span>
                          <audio src={ans.audioUrl} controls className="h-8 max-w-[180px]" />
                        </div>
                      )}
                      {ans?.files && ans.files.length > 0 ? (
                        <div className="mt-2 space-y-1">
                          {ans.files.map((f, fIdx) => (
                            <div key={fIdx} className="flex items-center gap-2 text-xs">
                              <span>📎</span>
                              <span className="truncate">{f.fileName || t.fileAttached}</span>
                            </div>
                          ))}
                        </div>
                      ) : ans?.fileUrl ? (
                        <div className="mt-2 flex items-center gap-2 text-xs">
                          <span>📎</span>
                          <span className="truncate">{ans.fileName || t.fileAttached}</span>
                        </div>
                      ) : null}
                      {!ans?.text && !ans?.audioUrl && !ans?.fileUrl && (!ans?.files || ans.files.length === 0) && (
                        <p className="text-sm italic opacity-70">—</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          }

          // Active Question - Large, centered, easy to focus
          return (
            <div
              key={q.id}
              ref={activeQuestionRef}
              className="animate-in fade-in slide-in-from-bottom-4 duration-500"
            >
              {/* Question Bubble */}
              <div className="mb-5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-t-2xl rounded-br-2xl bg-muted/60 border border-border/40">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {t.question} {step + 1} {t.of} {total}
                  </span>
                  <span className="text-[10px] text-muted-foreground/40 font-normal">·</span>
                  <span className="text-[10px] font-semibold text-primary tabular-nums">
                    {Math.round(progress)}%
                  </span>
                  {isTypingQuestion && (
                    <span className="text-[10px] font-medium text-muted-foreground px-2 py-0.5 rounded-full bg-muted/50">
                      {t.optional}
                    </span>
                  )}
                </div>
                <div className="mt-1 px-5 py-4 sm:px-6 sm:py-5 rounded-2xl rounded-tl-sm bg-amber-200/70 border-2 border-primary/20 shadow-lg">
                  <h1 className="text-base sm:text-lg leading-relaxed text-foreground font-medium">
                    {q.label[lang]}
                    {!isTypingQuestion && (
                      <span className="text-destructive ml-1" title={t.required}>*</span>
                    )}
                  </h1>
                </div>
              </div>

              {/* Answer Input Area */}
              <div className="px-1">
                {q.type === "text" && !hasAudioAnswer && (
                  <div className="space-y-2">
                    <label className="sr-only">{t.yourAnswer}</label>
                    {q.id === "phone" ? (
                      <div className="flex items-stretch rounded-xl border-2 border-border bg-card transition-all focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10 overflow-hidden">
                        <span className="flex items-center px-3.5 text-base sm:text-lg font-medium text-muted-foreground border-r border-border bg-muted/40 select-none">
                          +91
                        </span>
                        <input
                          type="tel"
                          inputMode="tel"
                          autoComplete="tel"
                          value={current.text}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^\d\s\-()]/g, "");
                            update({ text: val });
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") { e.preventDefault(); goNext(); }
                          }}
                          placeholder={t.phonePlaceholder || "98765 43210"}
                          className="flex-1 px-4 py-3.5 text-base sm:text-lg bg-transparent outline-none placeholder:text-muted-foreground/50"
                        />
                      </div>
                    ) : q.id === "email" ? (
                      <input
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        value={current.text}
                        onChange={(e) => update({ text: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") { e.preventDefault(); goNext(); }
                        }}
                        placeholder={t.emailPlaceholder || "e.g. name@example.com (Optional)"}
                        className="w-full px-4 py-3.5 text-base sm:text-lg rounded-xl border-2 border-border bg-card outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10 placeholder:text-muted-foreground/50"
                      />
                    ) : (
                      <input
                        type="text"
                        inputMode="text"
                        autoComplete={q.id === "name" ? "name" : undefined}
                        value={current.text}
                        onChange={(e) => update({ text: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") { e.preventDefault(); goNext(); }
                        }}
                        placeholder={t.yourAnswer}
                        className="w-full px-4 py-3.5 text-base sm:text-lg rounded-xl border-2 border-border bg-card outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10 placeholder:text-muted-foreground/50"
                      />
                    )}
                  </div>
                )}

                {q.type === "longtext" && !hasAudioAnswer && (
                  <div className="space-y-2">
                    <label className="sr-only">{t.yourAnswer}</label>
                    <textarea
                      value={current.text}
                      onChange={(e) => update({ text: e.target.value })}
                      placeholder={t.yourAnswer}
                      rows={5}
                      className="w-full px-4 py-3.5 text-base sm:text-lg rounded-xl border-2 border-border bg-card outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10 resize-none placeholder:text-muted-foreground/50"
                    />
                  </div>
                )}

                {q.type === "rating" && (
                  <div className="flex flex-wrap gap-3 justify-center">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => update({ text: String(n) })}
                        className={`h-16 w-16 sm:h-20 sm:w-20 rounded-2xl text-xl sm:text-2xl font-semibold transition-all ${
                          current.text === String(n)
                            ? "bg-primary text-primary-foreground shadow-lg scale-110 border-2 border-primary"
                            : "bg-card border-2 border-border hover:border-primary/40 hover:scale-105 hover:shadow-md active:scale-95"
                        }`}
                        aria-label={`Rating ${n} out of 5`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                )}

                {/* Single Choice (Radio) - Big Touch Targets */}
                {q.type === "choice" && (
                  <div className="space-y-3">
                    {q.options![lang].map((opt, optIdx) => {
                      const isYesOption = optIdx === 0;
                      const isSelected =
                        current.choice === opt ||
                        current.text === opt ||
                        Boolean(isYesOption && current.text?.startsWith(opt + " - "));
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => {
                            if (q.id === "medical_needed") {
                              if (isYesOption) {
                                const details = current.details ?? "";
                                update({
                                  choice: opt,
                                  details,
                                  text: details.trim() ? `${opt} - ${details.trim()}` : opt,
                                });
                              } else {
                                update({
                                  choice: opt,
                                  details: "",
                                  text: opt,
                                });
                              }
                            } else {
                              update({ text: opt });
                            }
                          }}
                          className={`w-full flex items-center gap-4 px-5 py-4 text-left text-base sm:text-lg rounded-xl border-2 transition-all ${
                            isSelected
                              ? "border-primary bg-primary/10 shadow-md"
                              : "border-border bg-card hover:border-primary/40 hover:shadow-sm active:scale-[0.98]"
                          }`}
                        >
                          <span
                            className={`flex-shrink-0 h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all ${
                              isSelected
                                ? "border-primary bg-primary"
                                : "border-muted-foreground/40"
                            }`}
                          >
                            {isSelected && (
                              <span className="h-3 w-3 rounded-full bg-primary-foreground" />
                            )}
                          </span>
                          <span className={isSelected ? "font-medium" : ""}>{opt}</span>
                        </button>
                      );
                    })}

                    {/* Q9 conditional input field if Yes is selected */}
                    {q.id === "medical_needed" &&
                      (current.choice === q.options![lang][0] ||
                        current.text === q.options![lang][0] ||
                        Boolean(current.text?.startsWith(q.options![lang][0] + " - "))) && (
                        <div className="mt-4 p-4 rounded-xl bg-muted/30 border border-border">
                          <label className="block text-sm font-medium text-foreground mb-2">
                            {t.specifyMedical}
                          </label>
                          <input
                            value={
                              current.details ??
                              (current.text && current.text.includes(" - ")
                                ? current.text.split(" - ").slice(1).join(" - ")
                                : "")
                            }
                            onChange={(e) => {
                              const details = e.target.value;
                              const choice = q.options?.[lang]?.[0] ?? "Yes";
                              const formatted: string = details.trim()
                                ? `${choice} - ${details.trim()}`
                                : choice;
                              update({
                                choice,
                                details,
                                text: formatted,
                              });
                            }}
                            placeholder={t.specifyMedical}
                            className="w-full px-4 py-3 text-base rounded-lg border-2 border-border bg-card outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10"
                          />
                        </div>
                      )}
                  </div>
                )}

                {/* Multi-select Checkboxes - Big Touch Targets */}
                {q.type === "checkbox" && (
                  <div className="space-y-3">
                    {q.options![lang].map((opt) => {
                      const selectedList = current.text
                        ? current.text.split(", ").map((s) => s.trim()).filter(Boolean)
                        : [];
                      const isChecked = selectedList.includes(opt);
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => {
                            const nextList = isChecked
                              ? selectedList.filter((s) => s !== opt)
                              : [...selectedList, opt];
                            update({ text: nextList.join(", ") });
                          }}
                          className={`w-full flex items-center gap-4 px-5 py-4 text-left text-base sm:text-lg rounded-xl border-2 transition-all ${
                            isChecked
                              ? "border-primary bg-primary/10 shadow-md"
                              : "border-border bg-card hover:border-primary/40 hover:shadow-sm active:scale-[0.98]"
                          }`}
                        >
                          <span
                            className={`flex-shrink-0 h-6 w-6 rounded border-2 flex items-center justify-center transition-all ${
                              isChecked
                                ? "border-primary bg-primary"
                                : "border-muted-foreground/40"
                            }`}
                          >
                            {isChecked && (
                              <Check className="h-4 w-4 stroke-[3] text-primary-foreground" />
                            )}
                          </span>
                          <span className={isChecked ? "font-medium" : ""}>{opt}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Final Question: Feedback Text + Multi-File Upload */}
                {q.type === "file_text" && (
                  <div className="space-y-4">
                    {!hasAudioAnswer && (
                      <div className="space-y-2">
                        <label className="sr-only">{t.yourAnswer}</label>
                        <textarea
                          value={current.text}
                          onChange={(e) => update({ text: e.target.value })}
                          placeholder={t.yourAnswer}
                          rows={5}
                          className="w-full px-4 py-3.5 text-base sm:text-lg rounded-xl border-2 border-border bg-card outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10 resize-none placeholder:text-muted-foreground/50"
                        />
                      </div>
                    )}

                    <div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
                        onChange={handleFileChange}
                        className="hidden"
                        id="survey-file-upload"
                      />
                      {(!current.files || current.files.length === 0) && !current.fileUrl ? (
                        <label
                          htmlFor="survey-file-upload"
                          className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border p-6 text-center cursor-pointer transition-all hover:border-primary/60 hover:bg-accent/30 active:scale-[0.98]"
                        >
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <Upload className="h-6 w-6" />
                          </div>
                          <div>
                            <p className="text-sm sm:text-base font-medium text-foreground">{t.uploadFile}</p>
                            <p className="mt-1 text-xs sm:text-sm text-muted-foreground">{t.uploadHint}</p>
                          </div>
                        </label>
                      ) : (
                        <div className="space-y-3">
                          {/* Attached files list */}
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
                                className="flex items-center justify-between gap-3 rounded-xl border-2 border-border bg-card p-3 shadow-sm"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  {fileItem.fileType?.startsWith("image/") ? (
                                    <img
                                      src={fileItem.fileUrl}
                                      alt="Preview"
                                      className="h-14 w-14 rounded-lg object-cover border border-border shrink-0"
                                    />
                                  ) : fileItem.fileType?.startsWith("video/") ? (
                                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                      <Film className="h-7 w-7" />
                                    </div>
                                  ) : (
                                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                                      <Paperclip className="h-7 w-7" />
                                    </div>
                                  )}
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium text-foreground truncate">
                                      {fileItem.fileName || t.fileAttached}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate">
                                      {fileItem.fileSize
                                        ? `${(fileItem.fileSize / (1024 * 1024)).toFixed(2)} MB`
                                        : fileItem.fileType || t.fileAttached}
                                    </p>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSpecificFile(fIdx)}
                                  className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors shrink-0"
                                  title={t.removeFile}
                                  aria-label={t.removeFile}
                                >
                                  <X className="h-5 w-5" />
                                </button>
                              </div>
                            ))}
                          </div>

                          {/* Add more files button & size summary */}
                          <div className="flex items-center justify-between pt-1">
                            <label
                              htmlFor="survey-file-upload"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg border border-border bg-card hover:bg-accent hover:border-primary/40 cursor-pointer transition-all"
                            >
                              <Upload className="h-3.5 w-3.5 text-primary" />
                              <span>{t.uploadMoreFiles || "Add more files"}</span>
                            </label>
                            <span className="text-xs text-muted-foreground">
                              {current.files?.length || 1} {t.filesAttached || "files attached"} (max 10MB total)
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Voice Input */}
                <VoiceInput
                  lang={lang}
                  questionType={q.type}
                  disableAudioRecording={
                    q.id === "name" ||
                    q.id === "phone" ||
                    q.id === "email" ||
                    q.id === "state" ||
                    q.id === "city"
                  }
                  existingText={current.text}
                  onTranscript={(text) =>
                    update({ text: current.text ? `${current.text} ${text}` : text })
                  }
                  audioUrl={current.audioUrl}
                  onRecordingChange={setIsRecordingAudio}
                  onAudio={(blob, previewUrl) => {
                    if (blob && previewUrl) {
                      audioBlobsRef.current[q.id] = blob;
                      update({ text: "", audioUrl: previewUrl });
                    } else {
                      delete audioBlobsRef.current[q.id];
                      update({ audioUrl: undefined });
                    }
                  }}
                  onRecordStart={() => {
                    if (current.audioUrl && current.audioUrl.startsWith("blob:")) {
                      URL.revokeObjectURL(current.audioUrl);
                    }
                    delete audioBlobsRef.current[q.id];
                    update({ text: "", audioUrl: undefined });
                  }}
                />

                {/* Error Message */}
                {error && (
                  <div className="mt-4 px-4 py-3 rounded-lg bg-destructive/10 border border-destructive/20">
                    <p className="text-sm font-medium text-destructive">{error}</p>
                  </div>
                )}

                {/* Navigation Buttons - Inline within the chat interface */}
                <div className="mt-6 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-3.5 sm:py-3 rounded-xl text-sm sm:text-base font-medium text-foreground bg-card border-2 border-border transition-all hover:bg-accent hover:border-primary/40 active:scale-[0.97]"
                  >
                    <ChevronLeft className="h-5 w-5" />
                    <span>{t.back}</span>
                  </button>
                  <button
                    type="button"
                    onClick={goNext}
                    disabled={submitting}
                    className="flex-[2] sm:flex-[3] inline-flex items-center justify-center gap-2 px-6 py-3.5 sm:py-3 rounded-xl text-sm sm:text-base font-semibold bg-primary text-primary-foreground shadow-md transition-all hover:bg-primary/90 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97]"
                  >
                    {submitting && <Loader2 className="h-5 w-5 animate-spin" />}
                    <span>{step === total - 1 ? t.submit : t.next}</span>
                    {!submitting && step < total - 1 && <ChevronRight className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress Indicator at Bottom */}
      <div className="mt-8 text-center">
        <p className="text-xs text-muted-foreground">
          {LANGUAGES.find((l) => l.code === lang)?.native} · {step + 1}/{total}
        </p>
      </div>

      {/* Submit Confirmation Dialog */}
      {showConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm px-4 pb-6 sm:pb-0"
          onClick={() => setShowConfirm(false)}
        >
          <div
            className="w-full max-w-sm bg-card rounded-2xl shadow-2xl border border-border p-6 animate-in fade-in slide-in-from-bottom-4 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Check className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-base font-semibold text-foreground">{t.confirmTitle}</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-5 pl-[52px]">{t.confirmMsg}</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium border-2 border-border text-foreground hover:bg-accent transition-all active:scale-[0.97]"
              >
                {t.confirmCancel}
              </button>
              <button
                type="button"
                onClick={handleConfirmedSubmit}
                className="flex-[2] px-4 py-2.5 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-md transition-all active:scale-[0.97]"
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

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen survey-form-shell px-4 py-8 sm:py-14 pb-8 sm:pb-12 flex flex-col justify-between">
      <Toaster
        position="bottom-center"
        toastOptions={{
          style: {
            fontSize: "0.8rem",
            padding: "8px 14px",
            minHeight: "unset",
            gap: "8px",
            borderRadius: "8px",
          },
        }}
      />
      <div className="mx-auto w-full max-w-2xl survey-glass-panel flex-1">{children}</div>
      <footer className="mt-8 text-center text-[11px] sm:text-xs text-muted-foreground/60 select-none tracking-wide">
        Powered by KKWIEER – MCA
      </footer>
    </main>
  );
}

