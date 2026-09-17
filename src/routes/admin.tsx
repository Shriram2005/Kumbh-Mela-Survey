import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  QUESTIONS,
  loadResponses,
  type StoredResponse,
  type Lang,
} from "@/lib/survey";
import {
  Search,
  Download,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Users,
  Globe,
  Star,
  FileSpreadsheet,
  ExternalLink,
  Mic,
} from "lucide-react";

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

const LANG_LABELS: Record<Lang, string> = { en: "English", hi: "Hindi", mr: "Marathi" };

// ─── Excel export ────────────────────────────────────────────────────────────
async function exportToExcel(responses: StoredResponse[]) {
  const { utils, writeFile } = await import("xlsx");

  const headers = [
    "Response ID",
    "Submitted At",
    "Language",
    ...QUESTIONS.map((q) => q.label.en),
  ];

  const rows = responses.map((r) => {
    const baseCols = [
      r.id,
      new Date(r.submittedAt).toLocaleString(),
      LANG_LABELS[r.lang] ?? r.lang,
    ];

    const answerCols = QUESTIONS.map((q) => {
      const ans = r.answers[q.id];
      if (!ans) return "";
      // If legacy response has both text and audio, include both
      if (ans.audioUrl && ans.text) {
        return `${ans.text} (Audio: ${ans.audioUrl})`;
      }
      // If answered via audio, output the audio file path/URL directly
      if (ans.audioUrl) {
        return ans.audioUrl;
      }
      // Otherwise output text answer directly
      return ans.text ?? "";
    });

    return [...baseCols, ...answerCols];
  });

  const ws = utils.aoa_to_sheet([headers, ...rows]);

  // Auto-fit column widths (capped at 50 to prevent overflow on long URLs)
  ws["!cols"] = headers.map((h, i) => ({
    wch: Math.max(
      h.length,
      ...rows.map((r) => {
        const val = String(r[i] ?? "");
        return Math.min(val.length, 50);
      }),
    ),
  }));

  const wb = utils.book_new();
  utils.book_append_sheet(wb, ws, "Responses");
  writeFile(wb, `kumbh-mela-survey-${Date.now()}.xlsx`);
}

// ─── Component ───────────────────────────────────────────────────────────────
function AdminPage() {
  const [responses, setResponses] = useState<StoredResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [langFilter, setLangFilter] = useState<Lang | "all">("all");
  const [audioOnly, setAudioOnly] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const fetchResponses = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await loadResponses();
      setResponses(data);
    } catch (err) {
      console.error("Failed to load responses:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchResponses();
  }, []);

  // Stats
  const stats = useMemo(() => {
    const byLang = responses.reduce(
      (acc, r) => {
        acc[r.lang] = (acc[r.lang] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const RATING_MAP: Record<string, number> = {
      "5": 5, "4": 4, "3": 3, "2": 2, "1": 1,
      "Excellent": 5, "उत्कृष्ट": 5,
      "Good": 4, "अच्छा": 4, "चांगले": 4,
      "Average": 3, "औसत": 3, "सरासरी": 3, "Fair": 3, "सामान्य": 3, "साधारण": 3,
      "Poor": 2, "खराब": 2, "वाईट": 2,
      "Very Poor": 1, "बहुत खराब": 1, "खूप वाईट": 1,
    };

    const ratings = responses
      .map((r) => {
        const val = r.answers["experience"]?.text;
        if (!val) return null;
        if (RATING_MAP[val] !== undefined) return RATING_MAP[val];
        const num = parseFloat(val);
        return isNaN(num) ? null : num;
      })
      .filter((n): n is number => n !== null);

    const avgRating =
      ratings.length > 0
        ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
        : "—";

    let totalAudioRecordings = 0;
    let withAudioCount = 0;
    responses.forEach((r) => {
      const count = Object.values(r.answers).filter((a) => Boolean(a.audioUrl)).length;
      if (count > 0) {
        withAudioCount += 1;
        totalAudioRecordings += count;
      }
    });

    return { byLang, avgRating, withAudioCount, totalAudioRecordings };
  }, [responses]);

  // Filtered
  const filtered = useMemo(() => {
    return responses.filter((r) => {
      if (langFilter !== "all" && r.lang !== langFilter) return false;
      if (audioOnly) {
        const hasAudio = Object.values(r.answers).some((a) => Boolean(a.audioUrl));
        if (!hasAudio) return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchId = r.id.toLowerCase().includes(q);
        const matchText = Object.values(r.answers).some(
          (a) => a.text?.toLowerCase().includes(q),
        );
        const matchAudio =
          (q === "audio" || q === "voice" || q === "mic") &&
          Object.values(r.answers).some((a) => Boolean(a.audioUrl));
        return matchId || matchText || matchAudio;
      }
      return true;
    });
  }, [responses, search, langFilter, audioOnly]);

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportToExcel(filtered);
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="admin-root">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="admin-header">
        <div className="admin-header-inner">
          <div className="admin-header-title-group">
            <h1 className="admin-title">Survey Admin</h1>
            <span className="admin-badge">Kumbh Mela 2025</span>
          </div>
          <div className="admin-header-actions">
            <button
              type="button"
              onClick={() => fetchResponses(true)}
              disabled={refreshing}
              className="admin-btn admin-btn-ghost"
              title="Refresh"
            >
              <RefreshCw className={`admin-btn-icon ${refreshing ? "animate-spin" : ""}`} />
              <span className="admin-btn-label">Refresh</span>
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={exporting || filtered.length === 0}
              className="admin-btn admin-btn-primary"
            >
              <FileSpreadsheet className="admin-btn-icon" />
              <span className="admin-btn-label">
                {exporting ? "Exporting…" : "Export Excel"}
              </span>
            </button>
          </div>
        </div>
      </header>

      <main className="admin-main">
        {/* ── Stats ──────────────────────────────────────────────────────────── */}
        <section className="admin-stats-grid">
          <StatCard
            icon={<Users className="stat-icon-svg" />}
            label="Total Responses"
            value={responses.length}
            accent="blue"
          />
          <StatCard
            icon={<Mic className="stat-icon-svg" />}
            label="Voice Responses"
            value={
              <span>
                {stats.withAudioCount}{" "}
                <span style={{ fontSize: "0.78rem", fontWeight: 400, opacity: 0.75 }}>
                  ({stats.totalAudioRecordings} clips)
                </span>
              </span>
            }
            accent="purple"
          />
          <StatCard
            icon={<Star className="stat-icon-svg" />}
            label="Avg. Rating"
            value={stats.avgRating}
            accent="amber"
          />
          <StatCard
            icon={<Globe className="stat-icon-svg" />}
            label="Languages"
            value={
              <span className="stat-lang-chips">
                {(["en", "hi", "mr"] as Lang[]).map((l) =>
                  stats.byLang[l] ? (
                    <span key={l} className="stat-lang-chip">
                      {LANG_LABELS[l]}: <strong>{stats.byLang[l]}</strong>
                    </span>
                  ) : null,
                )}
              </span>
            }
            accent="green"
          />
        </section>

        {/* ── Filters ──────────────────────────────────────────────────────── */}
        <section className="admin-filters">
          <div className="admin-search-wrap">
            <Search className="admin-search-icon" />
            <input
              type="search"
              placeholder="Search by name, state, keyword, or 'audio'…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="admin-search-input"
            />
          </div>
          <div className="admin-lang-filter">
            {(["all", "en", "hi", "mr"] as const).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLangFilter(l)}
                className={`admin-lang-btn ${langFilter === l ? "active" : ""}`}
              >
                {l === "all" ? "All" : LANG_LABELS[l]}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setAudioOnly((prev) => !prev)}
              className={`admin-lang-btn ${audioOnly ? "active" : ""}`}
              title="Filter responses with audio recordings"
            >
              <Mic className="h-3 w-3 inline mr-1" />
              With Audio ({stats.withAudioCount})
            </button>
          </div>
        </section>

        {/* ── Results label ─────────────────────────────────────────────────── */}
        <div className="admin-results-bar">
          <p className="admin-results-label">
            {loading
              ? "Loading responses…"
              : `${filtered.length} of ${responses.length} responses`}
          </p>
          {filtered.length > 0 && (
            <button
              type="button"
              onClick={handleExport}
              disabled={exporting}
              className="admin-export-inline"
            >
              <Download className="h-3.5 w-3.5" />
              {exporting ? "Exporting…" : "Export filtered"}
            </button>
          )}
        </div>

        {/* ── Content ──────────────────────────────────────────────────────── */}
        {loading ? (
          <LoadingSkeleton />
        ) : filtered.length === 0 ? (
          <EmptyState hasFilter={search !== "" || langFilter !== "all" || audioOnly} />
        ) : (
          <div className="admin-response-list">
            {filtered.map((r) => (
              <ResponseCard
                key={r.id}
                response={r}
                expanded={expandedId === r.id}
                onToggle={() => setExpandedId(expandedId === r.id ? null : r.id)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

// ─── Stat Card ───────────────────────────────────────────────────────────────
function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  accent: "blue" | "amber" | "green" | "purple";
}) {
  return (
    <div className={`stat-card stat-card-${accent}`}>
      <div className="stat-icon-wrap">{icon}</div>
      <div className="stat-body">
        <p className="stat-label">{label}</p>
        <div className="stat-value">{value}</div>
      </div>
    </div>
  );
}

// ─── Response Card ────────────────────────────────────────────────────────────
function ResponseCard({
  response,
  expanded,
  onToggle,
}: {
  response: StoredResponse;
  expanded: boolean;
  onToggle: () => void;
}) {
  const nameObj = response.answers["name"];
  const nameText = nameObj?.text?.trim();
  const nameAudio = nameObj?.audioUrl;

  const stateObj = response.answers["state"];
  const stateText = stateObj?.text?.trim();
  const stateAudio = stateObj?.audioUrl;

  const expRating = response.answers["experience"]?.text;
  const audioCount = Object.values(response.answers).filter((a) => Boolean(a.audioUrl)).length;

  return (
    <div className={`response-card ${expanded ? "response-card-expanded" : ""}`}>
      {/* Summary row */}
      <button type="button" className="response-card-header" onClick={onToggle}>
        <div className="response-card-meta">
          <div className="response-card-name-row">
            {nameText ? (
              <span className="response-card-name">{nameText}</span>
            ) : nameAudio ? (
              <span className="response-card-name flex items-center gap-1.5 text-primary">
                <Mic className="h-3.5 w-3.5" /> Audio Name
              </span>
            ) : (
              <span className="response-card-name text-muted-foreground italic">Anonymous</span>
            )}

            {stateText ? (
              <span className="response-card-state">{stateText}</span>
            ) : stateAudio ? (
              <span className="response-card-state flex items-center gap-1 text-primary">
                <Mic className="h-3 w-3" /> Audio State
              </span>
            ) : null}
          </div>
          <div className="response-card-sub">
            <span className="response-lang-pill">{LANG_LABELS[response.lang]}</span>
            {expRating && (
              <span className="response-rating">
                <Star className="h-3 w-3" /> {!isNaN(Number(expRating)) ? `${expRating}/5` : expRating}
              </span>
            )}
            {audioCount > 0 && (
              <span className="response-audio-badge">
                <Mic className="h-3 w-3" /> {audioCount} audio
              </span>
            )}
            <span className="response-date">
              {new Date(response.submittedAt).toLocaleString("en-IN", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </span>
          </div>
        </div>
        <span className="response-toggle-icon">
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </span>
      </button>

      {/* Expanded answers */}
      {expanded && (
        <div className="response-answers">
          <dl className="response-answer-grid">
            {QUESTIONS.map((q) => {
              const a = response.answers[q.id];
              const hasText = Boolean(a?.text?.trim());
              const hasAudio = Boolean(a?.audioUrl);

              if (!a && !hasAudio) return null;

              return (
                <div key={q.id} className="answer-item">
                  <div className="answer-header-row">
                    <dt className="answer-question">{q.label.en}</dt>
                    {hasAudio ? (
                      <span className="answer-type-tag answer-type-audio flex items-center gap-1">
                        <Mic className="h-2.5 w-2.5" /> Audio
                      </span>
                    ) : q.type === "choice" ? (
                      <span className="answer-type-tag answer-type-choice">Option</span>
                    ) : null}
                  </div>
                  <dd className="answer-body">
                    {/* Render text if present */}
                    {hasText && (
                      <span className="answer-text">{a!.text}</span>
                    )}

                    {/* Render audio player if audio was submitted */}
                    {hasAudio && (
                      <div className="answer-audio-row">
                        <audio controls src={a!.audioUrl} className="answer-audio-player" />
                        <a
                          href={a!.audioUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="answer-audio-link"
                          title="Open audio file in new tab"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    )}

                    {/* Only show '—' if neither text nor audio is present */}
                    {!hasText && !hasAudio && (
                      <span className="answer-empty">—</span>
                    )}
                  </dd>
                </div>
              );
            })}
          </dl>
          <div className="response-id-row">
            <span className="response-id-label">Response ID:</span>
            <code className="response-id-code">{response.id}</code>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <div className="admin-response-list">
      {[1, 2, 3].map((i) => (
        <div key={i} className="response-card skeleton-card">
          <div className="skeleton-line skeleton-line-wide" />
          <div className="skeleton-line skeleton-line-mid" />
        </div>
      ))}
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState({ hasFilter }: { hasFilter: boolean }) {
  return (
    <div className="admin-empty">
      <div className="admin-empty-icon">📋</div>
      <p className="admin-empty-title">
        {hasFilter ? "No matching responses" : "No responses yet"}
      </p>
      <p className="admin-empty-sub">
        {hasFilter
          ? "Try clearing your search or language filter."
          : "Submitted survey responses will appear here."}
      </p>
    </div>
  );
}
