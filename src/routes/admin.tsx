import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { QUESTIONS, loadResponses, type StoredResponse } from "@/lib/survey";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Survey Responses | Kumbh Mela Survey Admin" },
      {
        name: "description",
        content: "Admin view of submitted Kumbh Mela visitor survey responses.",
      },
      { property: "og:title", content: "Kumbh Mela Survey Admin" },
      { property: "og:description", content: "Review submitted survey responses." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const [responses, setResponses] = useState<StoredResponse[]>([]);

  useEffect(() => {
    setResponses(loadResponses());
  }, []);

  return (
    <main className="min-h-screen bg-muted/40 px-4 py-8">
      <div className="mx-auto w-full max-w-3xl space-y-4">
        <h1 className="text-xl font-medium text-foreground">
          Survey responses ({responses.length})
        </h1>
        {responses.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No responses yet on this device.
          </p>
        )}
        {responses.map((r) => (
          <div key={r.id} className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <p className="text-xs text-muted-foreground">
              {new Date(r.submittedAt).toLocaleString()} · {r.lang.toUpperCase()}
            </p>
            <dl className="mt-3 space-y-3">
              {QUESTIONS.map((q) => {
                const a = r.answers[q.id];
                if (!a) return null;
                return (
                  <div key={q.id}>
                    <dt className="text-sm text-muted-foreground">{q.label.en}</dt>
                    <dd className="text-sm text-foreground">{a.text || "—"}</dd>
                    {a.audioUrl && (
                      <audio controls src={a.audioUrl} className="mt-1 h-9 w-full max-w-xs" />
                    )}
                  </div>
                );
              })}
            </dl>
          </div>
        ))}
      </div>
    </main>
  );
}
