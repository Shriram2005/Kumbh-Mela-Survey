import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Check, Loader2 } from "lucide-react";
import { Toaster, toast } from "sonner";
import { VoiceInput } from "@/components/VoiceInput";
import {
  LANGUAGES,
  QUESTIONS,
  UI,
  saveResponse,
  type Answers,
  type Lang,
} from "@/lib/survey";
import { uploadAudioToS3 } from "@/lib/s3";
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

  // Generate a stable response ID for the entire survey session
  const responseIdRef = useRef<string>(crypto.randomUUID());
  const draftRestoredRef = useRef(false);

  // Restore draft on mount if one exists — show a brief toast instead of a modal
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

  const update = (patch: Partial<{ text: string; audioUrl?: string | undefined }>) => {
    setAnswers((prev) => ({
      ...prev,
      [question.id]: { ...(prev[question.id] ?? { text: "" }), ...patch },
    }));
    setError(false);
  };

  const goNext = async () => {
    if (!current.text.trim() && !current.audioUrl) {
      setError(true);
      return;
    }
    if (step === total - 1) {
      setSubmitting(true);
      try {
        // Upload only the final, confirmed audio recordings to AWS S3
        const finalAnswers: Answers = { ...answers };
        const uploadPromises = Object.entries(audioBlobsRef.current).map(
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

        const uploadResults = await Promise.all(uploadPromises);
        for (const { qid, s3Url } of uploadResults) {
          if (finalAnswers[qid] && s3Url) {
            finalAnswers[qid] = {
              ...finalAnswers[qid],
              audioUrl: s3Url,
            };
          } else if (finalAnswers[qid]) {
            // Remove blob: URL — don't persist local blob URLs to Firestore
            const { audioUrl: _blobUrl, ...rest } = finalAnswers[qid] as any;
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
        });
        audioBlobsRef.current = {};

        setSubmitted(true);
      } catch (err) {
        console.error("Submit error:", err);
      } finally {
        setSubmitting(false);
      }
      return;
    }
    setStep((s) => s + 1);
    setError(false);
  };

  const restart = () => {
    clearDraft();
    draftRestoredRef.current = false;
    Object.values(answers).forEach((a) => {
      if (a.audioUrl && a.audioUrl.startsWith("blob:")) {
        URL.revokeObjectURL(a.audioUrl);
      }
    });
    audioBlobsRef.current = {};
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
                  {!ans?.text && !ans?.audioUrl && (
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
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t.question} {step + 1} {t.of} {total}
                </p>
                <h1 className="mt-3 text-lg font-medium leading-snug text-foreground sm:text-xl">
                  {q.label[lang]}
                </h1>

                <div className="mt-5">
                  {q.type === "text" && (
                    <input
                      value={current.text}
                      onChange={(e) => update({ text: e.target.value })}
                      placeholder={t.yourAnswer}
                      className="w-full border-b border-border bg-transparent pb-2 text-base outline-none transition-colors focus:border-primary"
                    />
                  )}

                  {q.type === "longtext" && (
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

                  {q.type === "choice" && (
                    <div className="space-y-2">
                      {q.options![lang].map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => update({ text: opt })}
                          className={`flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left text-base transition-colors ${
                            current.text === opt
                              ? "border-primary bg-primary/5 font-medium"
                              : "border-border hover:bg-accent"
                          }`}
                        >
                          <span
                            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                              current.text === opt ? "border-primary" : "border-muted-foreground"
                            }`}
                          >
                            {current.text === opt && (
                              <span className="h-2 w-2 rounded-full bg-primary" />
                            )}
                          </span>
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Voice input: hidden for choice/rating questions */}
                <VoiceInput
                  lang={lang}
                  questionType={q.type}
                  existingText={current.text}
                  onTranscript={(text) =>
                    update({ text: current.text ? `${current.text} ${text}` : text })
                  }
                  audioUrl={current.audioUrl}
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
                    // Wipe typed text when user starts audio recording
                    update({ text: "" });
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
