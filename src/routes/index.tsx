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
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [error, setError] = useState(false);

  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Audio blobs kept in memory during form filling — zero uploads to AWS until final submit
  const audioBlobsRef = useRef<Record<string, Blob>>({});
  // Attached files kept in memory until final submit
  const filesRef = useRef<Record<string, File | Blob>>({});
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
        filesRef.current = { ...draft.files };
        Object.entries(draft.files).forEach(([qid, fileOrBlob]) => {
          if (restoredAnswers[qid]) {
            restoredAnswers[qid] = {
              ...restoredAnswers[qid],
              fileUrl: URL.createObjectURL(fileOrBlob),
              fileName:
                fileOrBlob instanceof File
                  ? fileOrBlob.name
                  : restoredAnswers[qid].fileName || "attachment",
              fileType: fileOrBlob.type || restoredAnswers[qid].fileType,
            };
          }
        });
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
    setError(false);
  };

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB limit

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      toast.error(t.fileTooLarge || "File size exceeds 10MB limit. Please choose a smaller file.");
      e.target.value = "";
      return;
    }

    filesRef.current[question.id] = file;
    const previewUrl = URL.createObjectURL(file);
    update({
      fileUrl: previewUrl,
      fileName: file.name,
      fileType: file.type,
    });
    e.target.value = "";
  };

  const handleRemoveFile = () => {
    if (current.fileUrl && current.fileUrl.startsWith("blob:")) {
      URL.revokeObjectURL(current.fileUrl);
    }
    delete filesRef.current[question.id];
    update({
      fileUrl: undefined,
      fileName: undefined,
      fileType: undefined,
    });
  };

  const goNext = async () => {
    // Only typing questions are optional; choice and checkbox questions are required like before
    if (!isTypingQuestion) {
      const hasText = Boolean(current.text?.trim());
      const hasAudio = Boolean(current.audioUrl);
      if (!hasText && !hasAudio) {
        setError(true);
        return;
      }
    }
    setError(false);

    if (step === total - 1) {
      setSubmitting(true);
      try {
        const finalAnswers: Answers = { ...answers };

        // 1. Upload audio recordings to AWS S3
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

        // 2. Upload attached files to AWS S3
        const fileUploadPromises = Object.entries(filesRef.current).map(
          async ([qid, fileOrBlob]) => {
            try {
              const fileName = fileOrBlob instanceof File ? fileOrBlob.name : undefined;
              const s3Url = await uploadFileToS3(fileOrBlob, responseIdRef.current, qid, fileName);
              return { qid, s3Url, fileName };
            } catch (err) {
              console.error(`Failed to upload file for question ${qid} to S3:`, err);
              return { qid, s3Url: undefined, fileName: undefined };
            }
          },
        );

        const [audioResults, fileResults] = await Promise.all([
          Promise.all(audioUploadPromises),
          Promise.all(fileUploadPromises),
        ]);

        for (const { qid, s3Url } of audioResults) {
          if (finalAnswers[qid] && s3Url) {
            finalAnswers[qid] = {
              ...finalAnswers[qid],
              audioUrl: s3Url,
            };
          } else if (finalAnswers[qid]) {
            const { audioUrl: _blobUrl, ...rest } = finalAnswers[qid] as any;
            finalAnswers[qid] = rest;
          }
        }

        for (const { qid, s3Url, fileName } of fileResults) {
          if (finalAnswers[qid] && s3Url) {
            finalAnswers[qid] = {
              ...finalAnswers[qid],
              fileUrl: s3Url,
              fileName: fileName ?? finalAnswers[qid].fileName,
            };
          } else if (finalAnswers[qid]) {
            const { fileUrl: _fileBlobUrl, ...rest } = finalAnswers[qid] as any;
            finalAnswers[qid] = rest;
          }
        }

        await saveResponse({
          id: responseIdRef.current,
          lang: lang ?? "en",
          submittedAt: new Date().toISOString(),
          answers: finalAnswers,
        });

        // Mark survey as submitted to prevent resubmission
        markAsSubmitted();

        // Clear saved draft from device storage
        await clearDraft();

        // Clean up memory blob URLs
        Object.values(answers).forEach((a) => {
          if (a.audioUrl && a.audioUrl.startsWith("blob:")) {
            URL.revokeObjectURL(a.audioUrl);
          }
          if (a.fileUrl && a.fileUrl.startsWith("blob:")) {
            URL.revokeObjectURL(a.fileUrl);
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
      return;
    }
    setStep((s) => s + 1);
  };

  const restart = () => {
    clearDraft();
    clearSubmissionStatus();
    draftRestoredRef.current = false;
    Object.values(answers).forEach((a) => {
      if (a.audioUrl && a.audioUrl.startsWith("blob:")) {
        URL.revokeObjectURL(a.audioUrl);
      }
      if (a.fileUrl && a.fileUrl.startsWith("blob:")) {
        URL.revokeObjectURL(a.fileUrl);
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

  if (!lang) {
    return (
      <Shell>
        <div className="text-center mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground">
            Kumbh Mela Visitor Survey
          </h1>
          <p className="mt-2 text-sm sm:text-base text-muted-foreground">
            कुंभ मेला सर्वेक्षण · कुंभमेळा सर्वेक्षण
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
              onClick={() => setLang(l.code)}
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

  const handleBack = () => {
    setError(false);
    if (step === 0) {
      setLang(null);
    } else {
      setStep((s) => Math.max(0, s - 1));
    }
  };

  return (
    <Shell>
      {/* Simple Progress Bar at Top */}
      <div className="sticky top-0 z-30 -mx-4 -mt-8 mb-6 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-4 sm:py-5">
        <div className="mx-auto w-full max-w-2xl">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-muted-foreground">
              {step + 1} {t.of} {total}
            </p>
          </div>
          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Chat-like Conversation Flow */}
      <div className="space-y-4 sm:space-y-5">
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
                    <div className="mt-1 px-4 py-3 rounded-2xl rounded-tl-sm bg-card border border-border shadow-sm">
                      <p className="text-sm sm:text-base leading-relaxed text-foreground">
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
                        <p className="text-sm sm:text-base leading-relaxed whitespace-pre-line break-words">
                          {ans.text}
                        </p>
                      ) : null}
                      {ans?.audioUrl && (
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-xs">🎙️</span>
                          <audio src={ans.audioUrl} controls className="h-8 max-w-[180px]" />
                        </div>
                      )}
                      {ans?.fileUrl && (
                        <div className="mt-2 flex items-center gap-2 text-xs">
                          <span>📎</span>
                          <span className="truncate">{ans.fileName || t.fileAttached}</span>
                        </div>
                      )}
                      {!ans?.text && !ans?.audioUrl && !ans?.fileUrl && (
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
                    Question {step + 1} {t.of} {total}
                  </span>
                  {isTypingQuestion && (
                    <span className="text-[10px] font-medium text-muted-foreground px-2 py-0.5 rounded-full bg-muted/50">
                      {t.optional}
                    </span>
                  )}
                </div>
                <div className="mt-1 px-5 py-4 sm:px-6 sm:py-5 rounded-2xl rounded-tl-sm bg-card border-2 border-primary/20 shadow-lg">
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
                    <input
                      type={q.id === "phone" ? "tel" : "text"}
                      inputMode={q.id === "phone" ? "tel" : "text"}
                      autoComplete={
                        q.id === "phone" ? "tel" : q.id === "name" ? "name" : undefined
                      }
                      value={current.text}
                      onChange={(e) => {
                        let val = e.target.value;
                        if (q.id === "phone") {
                          val = val.replace(/[^\d+\s\-()]/g, "");
                        }
                        update({ text: val });
                      }}
                      placeholder={
                        q.id === "phone"
                          ? t.phonePlaceholder || "+91 98765 43210"
                          : t.yourAnswer
                      }
                      className="w-full px-4 py-3.5 text-base sm:text-lg rounded-xl border-2 border-border bg-card outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10 placeholder:text-muted-foreground/50"
                      autoFocus
                    />
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
                      autoFocus
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
                            autoFocus
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

                {/* Final Question: Feedback Text + Simple File Upload */}
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
                          autoFocus
                        />
                      </div>
                    )}

                    <div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
                        onChange={handleFileChange}
                        className="hidden"
                        id="survey-file-upload"
                      />
                      {!current.fileUrl ? (
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
                        <div className="flex items-center justify-between gap-3 rounded-xl border-2 border-border bg-card p-3 shadow-sm">
                          <div className="flex items-center gap-3 min-w-0">
                            {current.fileType?.startsWith("image/") ? (
                              <img
                                src={current.fileUrl}
                                alt="Preview"
                                className="h-14 w-14 rounded-lg object-cover border border-border shrink-0"
                              />
                            ) : current.fileType?.startsWith("video/") ? (
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
                                {current.fileName || t.fileAttached}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {current.fileType || t.fileAttached}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={handleRemoveFile}
                            className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors shrink-0"
                            title={t.removeFile}
                            aria-label={t.removeFile}
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Voice Input */}
                <VoiceInput
                  lang={lang}
                  questionType={q.type}
                  disableAudioRecording={q.id === "name" || q.id === "phone"}
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
                    <p className="text-sm font-medium text-destructive">{t.required}</p>
                  </div>
                )}

                {/* Navigation Buttons - Fixed at bottom on mobile */}
                <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-sm border-t border-border p-4 sm:relative sm:mt-6 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
                  <div className="mx-auto max-w-2xl flex items-center gap-3">
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
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen survey-form-shell px-4 py-8 sm:py-14 pb-32">
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
      <div className="mx-auto w-full max-w-2xl survey-glass-panel">{children}</div>
    </main>
  );
}
