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
  Paperclip,
  Film,
  Phone,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

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

      const text = (ans.text || ans.choice || "")?.trim();
      const hasAudio = Boolean(ans.audioUrl);
      const hasFile = Boolean(ans.fileUrl);

      // Only file, no text and no audio
      if (hasFile && !text && !hasAudio) {
        return ans.fileUrl!;
      }
      // Only audio, no text and no file
      if (hasAudio && !text && !hasFile) {
        return ans.audioUrl!;
      }

      // If text exists along with file/audio, combine cleanly in single column
      let result = text;
      if (hasFile) {
        result = result ? `${result} (File: ${ans.fileUrl})` : `(File: ${ans.fileUrl})`;
      }
      if (hasAudio) {
        result = result ? `${result} (Audio: ${ans.audioUrl})` : `(Audio: ${ans.audioUrl})`;
      }
      return result;
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
  const [filesOnly, setFilesOnly] = useState(false);
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
    let totalFiles = 0;
    let withFilesCount = 0;

    responses.forEach((r) => {
      const audioCount = Object.values(r.answers).filter((a) => Boolean(a.audioUrl)).length;
      if (audioCount > 0) {
        withAudioCount += 1;
        totalAudioRecordings += audioCount;
      }
      const fileCount = Object.values(r.answers).filter((a) => Boolean(a.fileUrl)).length;
      if (fileCount > 0) {
        withFilesCount += 1;
        totalFiles += fileCount;
      }
    });

    return { byLang, avgRating, withAudioCount, totalAudioRecordings, withFilesCount, totalFiles };
  }, [responses]);

  // Visual Analytics Chart Data
  const chartData = useMemo(() => {
    if (responses.length === 0) {
      return { overTime: [], ratings: [], languages: [], states: [], previousKumbh: [] };
    }

    // 1. Responses over time
    const dateMap = new Map<string, number>();
    const sortedChronological = [...responses].sort(
      (a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime()
    );

    sortedChronological.forEach((r) => {
      const dateStr = new Date(r.submittedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      dateMap.set(dateStr, (dateMap.get(dateStr) ?? 0) + 1);
    });

    const overTime = Array.from(dateMap.entries()).map(([date, count]) => ({
      date,
      responses: count,
    }));

    // 2. Rating distribution
    const RATING_LOOKUP: Record<string, string> = {
      "5": "5 Stars", "4": "4 Stars", "3": "3 Stars", "2": "2 Stars", "1": "1 Star",
      "Excellent": "5 Stars", "उत्कृष्ट": "5 Stars",
      "Good": "4 Stars", "अच्छा": "4 Stars", "चांगले": "4 Stars",
      "Average": "3 Stars", "औसत": "3 Stars", "सरासरी": "3 Stars", "Fair": "3 Stars", "सामान्य": "3 Stars", "साधारण": "3 Stars",
      "Poor": "2 Stars", "खराब": "2 Stars", "वाईट": "2 Stars",
      "Very Poor": "1 Star", "बहुत खराब": "1 Star", "खूप वाईट": "1 Star",
    };

    const ratingCounts: Record<string, number> = {
      "5 Stars": 0,
      "4 Stars": 0,
      "3 Stars": 0,
      "2 Stars": 0,
      "1 Star": 0,
    };

    responses.forEach((r) => {
      const val = r.answers["experience"]?.text;
      if (!val) return;
      const key = RATING_LOOKUP[val];
      if (key) {
        ratingCounts[key] = (ratingCounts[key] ?? 0) + 1;
      }
    });

    const ratings = Object.entries(ratingCounts).map(([rating, count]) => ({
      rating,
      count,
    }));

    // 3. Language distribution
    const langCounts: Record<string, number> = { English: 0, Hindi: 0, Marathi: 0 };
    responses.forEach((r) => {
      const label = LANG_LABELS[r.lang] ?? r.lang;
      langCounts[label] = (langCounts[label] ?? 0) + 1;
    });

    const languages = [
      { name: "English", value: langCounts["English"] ?? 0, color: "#3b82f6" },
      { name: "Hindi", value: langCounts["Hindi"] ?? 0, color: "#8b5cf6" },
      { name: "Marathi", value: langCounts["Marathi"] ?? 0, color: "#ec4899" },
    ].filter((l) => l.value > 0);

    // 4. State / Location distribution
    const stateMap = new Map<string, number>();
    responses.forEach((r) => {
      const st = r.answers["state"]?.text?.trim();
      if (st) {
        const cleanSt = st.charAt(0).toUpperCase() + st.slice(1);
        stateMap.set(cleanSt, (stateMap.get(cleanSt) ?? 0) + 1);
      }
    });

    const states = Array.from(stateMap.entries())
      .map(([state, count]) => ({ state, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    // 5. Previous Kumbh attendance distribution
    const kumbhCounts: Record<string, number> = {
      "Prayagraj (2024)": 0,
      "Haridwar (2010)": 0,
      "Ujjain (2004)": 0,
      "Nashik (2015)": 0,
      "First-time Visitor": 0,
    };

    responses.forEach((r) => {
      const val =
        r.answers["previous_kumbh"]?.text?.trim() ||
        r.answers["previous_kumbh"]?.choice?.trim();
      if (!val) return;
      if (val.includes("2024") || val.includes("Prayagraj") || val.includes("प्रयागराज")) {
        kumbhCounts["Prayagraj (2024)"] = (kumbhCounts["Prayagraj (2024)"] ?? 0) + 1;
      } else if (val.includes("2010") || val.includes("Haridwar") || val.includes("हरिद्वार")) {
        kumbhCounts["Haridwar (2010)"] = (kumbhCounts["Haridwar (2010)"] ?? 0) + 1;
      } else if (val.includes("2004") || val.includes("Ujjain") || val.includes("उज्जैन")) {
        kumbhCounts["Ujjain (2004)"] = (kumbhCounts["Ujjain (2004)"] ?? 0) + 1;
      } else if (val.includes("2015") || val.includes("Nashik") || val.includes("नासिक") || val.includes("नाशिक")) {
        kumbhCounts["Nashik (2015)"] = (kumbhCounts["Nashik (2015)"] ?? 0) + 1;
      } else {
        kumbhCounts["First-time Visitor"] = (kumbhCounts["First-time Visitor"] ?? 0) + 1;
      }
    });

    const previousKumbh = Object.entries(kumbhCounts)
      .map(([mela, count]) => ({ mela, count }))
      .filter((item) => item.count > 0);

    return { overTime, ratings, languages, states, previousKumbh };
  }, [responses]);

  // Filtered
  const filtered = useMemo(() => {
    return responses.filter((r) => {
      if (langFilter !== "all" && r.lang !== langFilter) return false;
      if (audioOnly) {
        const hasAudio = Object.values(r.answers).some((a) => Boolean(a.audioUrl));
        if (!hasAudio) return false;
      }
      if (filesOnly) {
        const hasFiles = Object.values(r.answers).some((a) => Boolean(a.fileUrl));
        if (!hasFiles) return false;
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
        const matchFile =
          (q === "file" || q === "files" || q === "upload" || q === "image" || q === "video") &&
          Object.values(r.answers).some((a) => Boolean(a.fileUrl));
        const matchFileName = Object.values(r.answers).some(
          (a) => a.fileName?.toLowerCase().includes(q),
        );
        return matchId || matchText || matchAudio || matchFile || matchFileName;
      }
      return true;
    });
  }, [responses, search, langFilter, audioOnly, filesOnly]);

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
        {/* ── Stats KPI Cards ────────────────────────────────────────────────── */}
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

        {/* ── Analytics Visualizations ────────────────────────────────────────── */}
        {!loading && responses.length > 0 && (
          <section className="space-y-6">
            {/* Trend Chart: Responses Over Time */}
            <div className="rounded-xl border border-border bg-card p-5 sm:p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-semibold text-foreground">Responses Over Time</h2>
                  <p className="text-xs text-muted-foreground">Daily submission trends</p>
                </div>
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary">
                  {responses.length} total
                </span>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData.overTime} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorResponses" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                    <XAxis dataKey="date" tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--color-card)",
                        borderColor: "var(--color-border)",
                        borderRadius: "8px",
                        fontSize: "12px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                      }}
                    />
                    <Area type="monotone" dataKey="responses" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorResponses)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Split Grid: Ratings & Languages */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Rating Distribution */}
              <div className="rounded-xl border border-border bg-card p-5 sm:p-6 shadow-sm">
                <div className="mb-4">
                  <h2 className="text-base font-semibold text-foreground">Rating Breakdown</h2>
                  <p className="text-xs text-muted-foreground">Overall visitor satisfaction</p>
                </div>
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData.ratings} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                      <XAxis dataKey="rating" tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "var(--color-card)",
                          borderColor: "var(--color-border)",
                          borderRadius: "8px",
                          fontSize: "12px",
                        }}
                      />
                      <Bar dataKey="count" radius={[6, 6, 0, 0]} fill="#f59e0b" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Language Distribution */}
              <div className="rounded-xl border border-border bg-card p-5 sm:p-6 shadow-sm">
                <div className="mb-4">
                  <h2 className="text-base font-semibold text-foreground">Language Distribution</h2>
                  <p className="text-xs text-muted-foreground">Responses by selected language</p>
                </div>
                <div className="h-56 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData.languages}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {chartData.languages.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "var(--color-card)",
                          borderColor: "var(--color-border)",
                          borderRadius: "8px",
                          fontSize: "12px",
                        }}
                      />
                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        formatter={(value) => <span className="text-xs font-medium text-foreground">{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Location & Previous Kumbh Insights Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
              {/* Location / State Insights (if data exists) */}
              {chartData.states.length > 0 && (
                <div className="rounded-xl border border-border bg-card p-5 sm:p-6 shadow-sm">
                  <div className="mb-4">
                    <h2 className="text-base font-semibold text-foreground">Top Visitor Locations</h2>
                    <p className="text-xs text-muted-foreground">Most frequent origins reported by pilgrims</p>
                  </div>
                  <div className="h-56 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart layout="vertical" data={chartData.states} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--color-border)" />
                        <XAxis type="number" tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} allowDecimals={false} />
                        <YAxis dataKey="state" type="category" tick={{ fontSize: 12, fill: "var(--color-foreground)" }} axisLine={false} tickLine={false} width={100} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "var(--color-card)",
                            borderColor: "var(--color-border)",
                            borderRadius: "8px",
                            fontSize: "12px",
                          }}
                        />
                        <Bar dataKey="count" fill="#10b981" radius={[0, 6, 6, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Previous Kumbh Attendance Insights (if data exists) */}
              {chartData.previousKumbh.length > 0 && (
                <div className="rounded-xl border border-border bg-card p-5 sm:p-6 shadow-sm">
                  <div className="mb-4">
                    <h2 className="text-base font-semibold text-foreground">Previous Kumbh Attendance</h2>
                    <p className="text-xs text-muted-foreground">Past Kumbh Melas attended by respondents</p>
                  </div>
                  <div className="h-56 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart layout="vertical" data={chartData.previousKumbh} margin={{ top: 5, right: 20, left: 25, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--color-border)" />
                        <XAxis type="number" tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} allowDecimals={false} />
                        <YAxis dataKey="mela" type="category" tick={{ fontSize: 11, fill: "var(--color-foreground)" }} axisLine={false} tickLine={false} width={125} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "var(--color-card)",
                            borderColor: "var(--color-border)",
                            borderRadius: "8px",
                            fontSize: "12px",
                          }}
                        />
                        <Bar dataKey="count" fill="#8b5cf6" radius={[0, 6, 6, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── Filters ──────────────────────────────────────────────────────── */}
        <section className="admin-filters">
          <div className="admin-search-wrap">
            <Search className="admin-search-icon" />
            <input
              type="search"
              placeholder="Search by name, phone, state, keyword, or 'audio'…"
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
            <button
              type="button"
              onClick={() => setFilesOnly((prev) => !prev)}
              className={`admin-lang-btn ${filesOnly ? "active" : ""}`}
              title="Filter responses with file attachments"
            >
              <Paperclip className="h-3 w-3 inline mr-1" />
              With Files ({stats.withFilesCount})
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

  const phoneObj = response.answers["phone"];
  const phoneText = phoneObj?.text?.trim();

  const stateObj = response.answers["state"];
  const stateText = stateObj?.text?.trim();
  const stateAudio = stateObj?.audioUrl;

  const cityObj = response.answers["city"];
  const cityText = cityObj?.text?.trim();

  const expRating = response.answers["experience"]?.text;
  const prevKumbh =
    response.answers["previous_kumbh"]?.text?.trim() ||
    response.answers["previous_kumbh"]?.choice?.trim();
  const audioCount = Object.values(response.answers).filter((a) => Boolean(a.audioUrl)).length;
  const fileCount = Object.values(response.answers).filter((a) => Boolean(a.fileUrl)).length;

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

            {phoneText ? (
              <a
                href={`tel:${phoneText}`}
                onClick={(e) => e.stopPropagation()}
                className="response-card-phone inline-flex items-center gap-1"
                title={`Call ${phoneText}`}
              >
                <Phone className="h-3 w-3" />
                <span>{phoneText}</span>
              </a>
            ) : null}

            {cityText || stateText ? (
              <span className="response-card-state">
                {[cityText, stateText].filter(Boolean).join(", ")}
              </span>
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
            {prevKumbh && (
              <span
                className="response-lang-pill bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20"
                title={`Previous Kumbh: ${prevKumbh}`}
              >
                🏛️ {prevKumbh.includes("नहीं") || prevKumbh.includes("नाही") || prevKumbh.includes("not attended") ? "First-time" : prevKumbh}
              </span>
            )}
            {audioCount > 0 && (
              <span className="response-audio-badge">
                <Mic className="h-3 w-3" /> {audioCount} audio
              </span>
            )}
            {fileCount > 0 && (
              <span className="response-audio-badge text-blue-600 bg-blue-500/10 border-blue-500/20">
                <Paperclip className="h-3 w-3" /> {fileCount} file{fileCount > 1 ? "s" : ""}
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
              const hasFile = Boolean(a?.fileUrl);

              if (!a && !hasAudio && !hasFile) return null;

              return (
                <div key={q.id} className="answer-item">
                  <div className="answer-header-row">
                    <dt className="answer-question">{q.label.en}</dt>
                    {hasFile ? (
                      <span className="answer-type-tag bg-blue-500/10 text-blue-600 border border-blue-500/20 flex items-center gap-1">
                        <Paperclip className="h-2.5 w-2.5" /> File
                      </span>
                    ) : hasAudio ? (
                      <span className="answer-type-tag answer-type-audio flex items-center gap-1">
                        <Mic className="h-2.5 w-2.5" /> Audio
                      </span>
                    ) : q.type === "checkbox" ? (
                      <span className="answer-type-tag bg-purple-500/10 text-purple-600 border border-purple-500/20">
                        Checkboxes
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

                    {/* Render file attachment if present */}
                    {hasFile && (
                      <div className="mt-2 flex items-center gap-3 rounded-lg border border-border bg-card/70 p-2.5">
                        {a!.fileType?.startsWith("image/") ||
                        a!.fileUrl?.match(/\.(jpeg|jpg|png|gif|webp)/i) ? (
                          <a
                            href={a!.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0 group relative"
                            title="Open full image"
                          >
                            <img
                              src={a!.fileUrl}
                              alt={a!.fileName || "Uploaded attachment"}
                              className="h-14 w-14 rounded object-cover border border-border transition-transform group-hover:scale-105"
                            />
                          </a>
                        ) : a!.fileType?.startsWith("video/") ||
                          a!.fileUrl?.match(/\.(mp4|webm|mov|ogg)/i) ? (
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded bg-primary/10 text-primary">
                            <Film className="h-6 w-6" />
                          </div>
                        ) : (
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded bg-muted text-muted-foreground">
                            <Paperclip className="h-6 w-6" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-foreground truncate">
                            {a!.fileName || "Attachment"}
                          </p>
                          <a
                            href={a!.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline mt-0.5"
                          >
                            <span>Open file</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </div>
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

                    {/* Only show '—' if neither text, audio, nor file is present */}
                    {!hasText && !hasAudio && !hasFile && (
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
