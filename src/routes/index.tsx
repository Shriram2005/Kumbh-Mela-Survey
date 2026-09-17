import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { VoiceInput } from "@/components/VoiceInput";
import {
  LANGUAGES,
  QUESTIONS,
  UI,
  saveResponse,
  type Answers,
  type Lang,
} from "@/lib/survey";

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

  const goNext = () => {
    if (!current.text.trim() && !current.audioUrl) {
      setError(true);
      return;
    }
    if (step === total - 1) {
      saveResponse({
        id: crypto.randomUUID(),
        lang: lang ?? "en",
        submittedAt: new Date().toISOString(),
        answers,
      });
      setSubmitted(true);
      return;
    }
    setStep((s) => s + 1);
    setError(false);
  };

  const restart = () => {
    setAnswers({});
    setStep(0);
    setSubmitted(false);
    setLang(null);
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

  return (
    <Shell>
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="h-2.5 w-full bg-muted">
          <div
            className="h-full bg-primary/80 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="p-5 sm:p-8">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {t.question} {step + 1} {t.of} {total}
          </p>
          <h1 className="mt-3 text-lg font-medium leading-snug text-foreground sm:text-xl">
            {question.label[lang]}
          </h1>

          <div className="mt-5">
            {question.type === "text" && (
              <input
                value={current.text}
                onChange={(e) => update({ text: e.target.value })}
                placeholder={t.yourAnswer}
                className="w-full border-b border-border bg-transparent pb-2 text-base outline-none transition-colors focus:border-primary"
              />
            )}

            {question.type === "longtext" && (
              <textarea
                value={current.text}
                onChange={(e) => update({ text: e.target.value })}
                placeholder={t.yourAnswer}
                rows={4}
                className="w-full resize-none rounded-lg border border-border bg-transparent p-3 text-base outline-none transition-colors focus:border-primary"
              />
            )}

            {question.type === "rating" && (
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => update({ text: String(n) })}
                    className={`h-12 w-12 rounded-full border text-base transition-colors ${
                      current.text === String(n)
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border hover:bg-accent"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            )}

            {question.type === "choice" && (
              <div className="space-y-2">
                {question.options![lang].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => update({ text: opt })}
                    className={`flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left text-base transition-colors ${
                      current.text === opt
                        ? "border-primary bg-primary/5"
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

          <VoiceInput
            lang={lang}
            onTranscript={(text) =>
              update({ text: current.text ? `${current.text} ${text}` : text })
            }
            audioUrl={current.audioUrl}
            onAudio={(url) => update({ audioUrl: url })}
          />

          {error && <p className="mt-4 text-sm text-destructive">{t.required}</p>}

          <div className="mt-8 flex items-center justify-between gap-3 border-t border-border pt-5">
            <button
              type="button"
              disabled={step === 0}
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              className="inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm text-primary transition-colors hover:bg-accent disabled:invisible"
            >
              <ChevronLeft className="h-4 w-4" />
              {t.back}
            </button>
            <button
              type="button"
              onClick={goNext}
              className="inline-flex items-center gap-1 rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {step === total - 1 ? t.submit : t.next}
            </button>
          </div>
        </div>
      </div>
      <p className="mt-4 text-center text-xs text-muted-foreground">
        {LANGUAGES.find((l) => l.code === lang)?.native} · {step + 1}/{total}
      </p>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-muted/40 px-4 py-8 sm:py-14">
      <div className="mx-auto w-full max-w-2xl">{children}</div>
    </main>
  );
}
