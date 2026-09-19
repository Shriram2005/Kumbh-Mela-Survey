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
import { saveDraft, loadDraft, clearDraft } from "@/lib/draft";

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
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="h-2.5 w-full bg-primary/80" />
          <div className="p-5 sm:p-8">
            <h1 className="text-xl font-medium text-foreground sm:text-3xl">
              Kumbh Mela Visitor Survey
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              कुंभ मेला सर्वेक्षण · कुंभमेळा सर्वेक्षण
            </p>
            <div className="mt-6 border-t border-border pt-6">
              <p className="text-base text-foreground">Choose your language</p>
              <div className="mt-4 space-y-3">
                {LANGUAGES.map((l) => (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => setLang(l.code)}
                    className="flex w-full items-center justify-between rounded-lg border border-border px-4 py-3 text-left text-base transition-colors hover:border-primary hover:bg-accent"
                  >
                    <span>
                      {l.native}
                      <span className="ml-2 text-sm text-muted-foreground">{l.label}</span>
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Shell>
    );
  }

  if (submitted) {
    return (
      <Shell>
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="h-2.5 w-full bg-primary/80" />
          <div className="p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Check className="h-5 w-5" />
              </span>
              <h1 className="text-xl font-medium text-foreground">{t.thanks}</h1>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{t.thanksBody}</p>
            <button
              type="button"
              onClick={restart}
              className="mt-6 text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              {t.another}
            </button>
          </div>
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
      {/* Sticky Progress Header Card */}
      <div className="sticky top-4 z-20 mb-6 overflow-hidden rounded-xl border border-border bg-card shadow-sm backdrop-blur-md">
        <div className="h-2.5 w-full bg-muted">
          <div
            className="h-full bg-primary/80 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex items-center justify-between px-5 py-3 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t.question} {step + 1} {t.of} {total}
          </p>
          <button
            type="button"
            onClick={() => setLang(null)}
            className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1"
            title={t.chooseLang}
          >
            <span>{LANGUAGES.find((l) => l.code === lang)?.native}</span>
            <span className="text-[10px]">🌐</span>
          </button>
        </div>
      </div>

      {/* Conversational Question & Answer Stream */}
      <div className="space-y-6">
        {QUESTIONS.slice(0, step + 1).map((q, idx) => {
          const ans = answers[q.id];
          const isActive = idx === step;

          if (!isActive) {
            return (
              <div key={q.id} className="space-y-3">
                {/* Question Card - Aligned LEFT */}
                <div className="mr-auto max-w-[88%] sm:max-w-[80%] rounded-xl border border-border bg-card p-4 sm:p-5 shadow-sm transition-all hover:border-primary/40">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {t.question} {idx + 1}
                    </p>
                    <button
                      type="button"
                      onClick={() => setStep(idx)}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      {t.back}
                    </button>
                  </div>
                  <h2 className="text-sm font-medium text-foreground sm:text-base">
                    {q.label[lang]}
                  </h2>
                </div>

                {/* User Answer Card - Aligned RIGHT */}
                <div className="ml-auto max-w-[88%] sm:max-w-[80%] rounded-xl border border-primary/20 bg-primary/5 p-4 sm:p-5 shadow-sm text-right">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-primary/70 mb-1">
                    {t.yourAnswer}
                  </p>
                  {ans?.text ? (
                    <p className="text-sm sm:text-base font-medium text-foreground whitespace-pre-line">
                      {ans.text}
                    </p>
                  ) : null}
                  {ans?.audioUrl ? (
                    <div className="mt-2 flex items-center justify-end gap-2 text-xs font-medium text-primary">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-primary">
                        🎙️ {t.done}
                      </span>
                      <audio src={ans.audioUrl} controls className="h-8 max-w-[200px]" />
                    </div>
                  ) : null}
                  {ans?.fileUrl ? (
                    <div className="mt-2 flex items-center justify-end gap-2 text-xs font-medium text-primary">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-primary">
                        📎 {ans.fileName || t.fileAttached}
                      </span>
                    </div>
                  ) : null}
                  {!ans?.text && !ans?.audioUrl && !ans?.fileUrl && (
                    <p className="text-sm italic text-muted-foreground">—</p>
                  )}
                </div>
              </div>
            );
          }

          return (
            <div
              key={q.id}
              ref={activeQuestionRef}
              className="overflow-hidden rounded-xl border border-border bg-card shadow-md transition-all ring-1 ring-primary/20"
            >
              <div className="h-1.5 w-full bg-primary/80" />
              <div className="p-5 sm:p-8">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {t.question} {step + 1} {t.of} {total}
                  </p>
                  {isTypingQuestion ? (
                    <span className="text-xs font-medium text-muted-foreground/80 bg-muted px-2 py-0.5 rounded">
                      {t.optional}
                    </span>
                  ) : null}
                </div>
                <h1 className="mt-3 text-lg font-medium leading-snug text-foreground sm:text-xl">
                  {q.label[lang]}
                  {!isTypingQuestion && (
                    <span className="text-destructive font-semibold ml-1" title={t.required}>*</span>
                  )}
                </h1>

                <div className="mt-5">
                  {q.type === "text" && !hasAudioAnswer && (
                    <input
                      value={current.text}
                      onChange={(e) => update({ text: e.target.value })}
                      placeholder={t.yourAnswer}
                      className="w-full border-b border-border bg-transparent pb-2 text-base outline-none transition-colors focus:border-primary"
                    />
                  )}

                  {q.type === "longtext" && !hasAudioAnswer && (
                    <textarea
                      value={current.text}
                      onChange={(e) => update({ text: e.target.value })}
                      placeholder={t.yourAnswer}
                      rows={4}
                      className="w-full resize-none rounded-lg border border-border bg-transparent p-3 text-base outline-none transition-colors focus:border-primary"
                    />
                  )}

                  {q.type === "rating" && (
                    <div className="flex flex-wrap gap-2">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => update({ text: String(n) })}
                          className={`h-12 w-12 rounded-full border text-base transition-colors ${
                            current.text === String(n)
                              ? "border-primary bg-primary text-primary-foreground font-medium"
                              : "border-border hover:bg-accent"
                          }`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Single Choice (Radio) */}
                  {q.type === "choice" && (
                    <div className="space-y-2">
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
                            className={`flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left text-base transition-colors ${
                              isSelected
                                ? "border-primary bg-primary/5 font-medium"
                                : "border-border hover:bg-accent"
                            }`}
                          >
                            <span
                              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                                isSelected ? "border-primary" : "border-muted-foreground"
                              }`}
                            >
                              {isSelected && (
                                <span className="h-2 w-2 rounded-full bg-primary" />
                              )}
                            </span>
                            {opt}
                          </button>
                        );
                      })}

                      {/* Q9 conditional input field if Yes is selected */}
                      {q.id === "medical_needed" &&
                        (current.choice === q.options![lang][0] ||
                          current.text === q.options![lang][0] ||
                          Boolean(current.text?.startsWith(q.options![lang][0] + " - "))) && (
                          <div className="mt-3 pt-3 border-t border-border">
                            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
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
                              className="w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
                              autoFocus
                            />
                          </div>
                        )}
                    </div>
                  )}

                  {/* Multi-select Checkboxes for Q4, Q5, Q15 */}
                  {q.type === "checkbox" && (
                    <div className="space-y-2">
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
                            className={`flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left text-base transition-colors ${
                              isChecked
                                ? "border-primary bg-primary/5 font-medium"
                                : "border-border hover:bg-accent"
                            }`}
                          >
                            <span
                              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                                isChecked
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-muted-foreground"
                              }`}
                            >
                              {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                            </span>
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Final Question: Feedback Text + Simple File Upload */}
                  {q.type === "file_text" && (
                    <div className="space-y-4">
                      {!hasAudioAnswer && (
                        <textarea
                          value={current.text}
                          onChange={(e) => update({ text: e.target.value })}
                          placeholder={t.yourAnswer}
                          rows={4}
                          className="w-full resize-none rounded-lg border border-border bg-transparent p-3 text-base outline-none transition-colors focus:border-primary"
                        />
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
                            className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border p-5 text-center cursor-pointer transition-colors hover:border-primary/60 hover:bg-accent/40"
                          >
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                              <Upload className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground">{t.uploadFile}</p>
                              <p className="mt-0.5 text-xs text-muted-foreground">{t.uploadHint}</p>
                            </div>
                          </label>
                        ) : (
                          <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-3 shadow-sm">
                            <div className="flex items-center gap-3 min-w-0">
                              {current.fileType?.startsWith("image/") ? (
                                <img
                                  src={current.fileUrl}
                                  alt="Preview"
                                  className="h-12 w-12 rounded object-cover border border-border shrink-0"
                                />
                              ) : current.fileType?.startsWith("video/") ? (
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded bg-primary/10 text-primary">
                                  <Film className="h-6 w-6" />
                                </div>
                              ) : (
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded bg-muted text-muted-foreground">
                                  <Paperclip className="h-6 w-6" />
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">
                                  {current.fileName || t.fileAttached}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {current.fileType || t.fileAttached}
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={handleRemoveFile}
                              className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors shrink-0"
                              title={t.removeFile}
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Voice input: available for text, longtext, and file_text */}
                <VoiceInput
                  lang={lang}
                  questionType={q.type}
                  disableAudioRecording={q.id === "name"}
                  existingText={current.text}
                  onTranscript={(text) =>
                    update({ text: current.text ? `${current.text} ${text}` : text })
                  }
                  audioUrl={current.audioUrl}
                  onRecordingChange={setIsRecordingAudio}
                  onAudio={(blob, previewUrl) => {
                    if (blob && previewUrl) {
                      audioBlobsRef.current[q.id] = blob;
                      // When audio is recorded, clear text for this question
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

                {error && <p className="mt-4 text-sm text-destructive">{t.required}</p>}

                <div className="mt-8 flex items-center justify-between gap-3 border-t border-border pt-5">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm text-primary transition-colors hover:bg-accent"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    {t.back}
                  </button>
                  <button
                    type="button"
                    onClick={goNext}
                    disabled={submitting}
                    className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-70"
                  >
                    {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                    {step === total - 1 ? t.submit : t.next}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        {LANGUAGES.find((l) => l.code === lang)?.native} · {step + 1}/{total}
      </p>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-muted/40 px-4 py-8 sm:py-14">
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
      <div className="mx-auto w-full max-w-2xl">{children}</div>
    </main>
  );
}
