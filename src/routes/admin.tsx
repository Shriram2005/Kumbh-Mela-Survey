import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  QUESTIONS,
  SECTIONS,
  loadResponses,
  type StoredResponse,
  type Lang,
} from "@/lib/survey";
import {
  Search,
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
  MessageCircle,
  MapPin,
  Sparkles,
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
    ...QUESTIONS.map((q) => `[Sec ${q.section}] ${q.label.en}`),
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
      const allFiles =
        ans.files && ans.files.length > 0
          ? ans.files
          : ans.fileUrl
          ? [{ fileUrl: ans.fileUrl, fileName: ans.fileName }]
          : [];
      const hasFiles = allFiles.length > 0;
      const fileUrlsStr = allFiles.map((f) => f.fileUrl).join(", ");

      if (hasFiles && !text && !hasAudio) {
        return fileUrlsStr;
      }
      if (hasAudio && !text && !hasFiles) {
        return ans.audioUrl!;
      }

      let result = text;
      if (hasFiles) {
        result = result ? `${result} (Files: ${fileUrlsStr})` : `(Files: ${fileUrlsStr})`;
      }
      if (hasAudio) {
        result = result ? `${result} (Audio: ${ans.audioUrl})` : `(Audio: ${ans.audioUrl})`;
      }
      return result;
    });

    return [...baseCols, ...answerCols];
  });

  const ws = utils.aoa_to_sheet([headers, ...rows]);

  ws["!cols"] = headers.map((h, i) => ({
    wch: Math.max(
      h.length,
      ...rows.map((r) => {
        const val = String(r[i] ?? "");
        return Math.min(val.length, 50);
      })
    ),
  }));

  const wb = utils.book_new();
  utils.book_append_sheet(wb, ws, "Kumbh Mela Responses");
  writeFile(wb, `kumbh-mela-survey-responses-${Date.now()}.xlsx`);
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
      {} as Record<string, number>
    );

    const SATISFACTION_SCORES: Record<string, number> = {
      "Very Satisfied": 5, "बहुत संतुष्ट": 5, "खूप समाधानी": 5,
      "Satisfied": 4, "संतुष्ट": 4, "समाधानी": 4,
      "Neutral": 3, "तटस्थ": 3,
      "Dissatisfied": 2, "असंतोषजनक": 2, "असमाधानी": 2,
      "Very Dissatisfied": 1, "बहुत असंतोषजनक": 1, "खूप असमाधानी": 1,
    };

    const satScores = responses
      .map((r) => {
        const val = r.answers["facilities_satisfaction"]?.text || r.answers["facilities_satisfaction"]?.choice;
        if (!val) return null;
        return SATISFACTION_SCORES[val] ?? null;
      })
      .filter((n): n is number => n !== null);

    const avgSatisfaction =
      satScores.length > 0
        ? (satScores.reduce((a, b) => a + b, 0) / satScores.length).toFixed(1)
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
      let respFileCount = 0;
      Object.values(r.answers).forEach((a) => {
        if (a.files && a.files.length > 0) {
          respFileCount += a.files.length;
        } else if (a.fileUrl) {
          respFileCount += 1;
        }
      });
      if (respFileCount > 0) {
        withFilesCount += 1;
        totalFiles += respFileCount;
      }
    });

    return {
      byLang,
      avgSatisfaction,
      withAudioCount,
      totalAudioRecordings,
      withFilesCount,
      totalFiles,
    };
  }, [responses]);

  // Visual Analytics Chart Data
  const chartData = useMemo(() => {
    if (responses.length === 0) {
      return {
        overTime: [],
        satisfaction: [],
        crowdRating: [],
        languages: [],
        cities: [],
        previousKumbh: [],
      };
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

    // 2. Facilities Satisfaction distribution (Q10)
    const satCounts: Record<string, number> = {
      "Very Satisfied": 0,
      "Satisfied": 0,
      "Neutral": 0,
      "Dissatisfied": 0,
      "Very Dissatisfied": 0,
    };

    responses.forEach((r) => {
      const val = r.answers["facilities_satisfaction"]?.text || r.answers["facilities_satisfaction"]?.choice;
      if (!val) return;
      if (val.includes("Very Satisfied") || val.includes("बहुत संतुष्ट") || val.includes("खूप समाधानी")) {
        satCounts["Very Satisfied"] = (satCounts["Very Satisfied"] ?? 0) + 1;
      } else if (val.includes("Satisfied") || val.includes("संतुष्ट") || val.includes("समाधानी")) {
        satCounts["Satisfied"] = (satCounts["Satisfied"] ?? 0) + 1;
      } else if (val.includes("Neutral") || val.includes("तटस्थ")) {
        satCounts["Neutral"] = (satCounts["Neutral"] ?? 0) + 1;
      } else if (val.includes("Very Dissatisfied") || val.includes("बहुत असंतोषजनक") || val.includes("खूप असमाधानी")) {
        satCounts["Very Dissatisfied"] = (satCounts["Very Dissatisfied"] ?? 0) + 1;
      } else if (val.includes("Dissatisfied") || val.includes("असंतोषजनक") || val.includes("असमाधानी")) {
        satCounts["Dissatisfied"] = (satCounts["Dissatisfied"] ?? 0) + 1;
      }
    });

    const satisfaction = Object.entries(satCounts).map(([rating, count]) => ({
      rating,
      count,
    }));

    // 3. Crowd Management Rating (Q13)
    const crowdCounts: Record<string, number> = {
      "Excellent": 0,
      "Good": 0,
      "Fair": 0,
      "Poor": 0,
      "Very Poor": 0,
    };

    responses.forEach((r) => {
      const val = r.answers["crowd_management_rating"]?.text || r.answers["crowd_management_rating"]?.choice;
      if (!val) return;
      if (val.includes("Excellent") || val.includes("उत्कृष्ट")) {
        crowdCounts["Excellent"] = (crowdCounts["Excellent"] ?? 0) + 1;
      } else if (val.includes("Good") || val.includes("अच्छा") || val.includes("चांगले")) {
        crowdCounts["Good"] = (crowdCounts["Good"] ?? 0) + 1;
      } else if (val.includes("Fair") || val.includes("सामान्य") || val.includes("साधारण")) {
        crowdCounts["Fair"] = (crowdCounts["Fair"] ?? 0) + 1;
      } else if (val.includes("Very Poor") || val.includes("बहुत खराब") || val.includes("खूप वाईट")) {
        crowdCounts["Very Poor"] = (crowdCounts["Very Poor"] ?? 0) + 1;
      } else if (val.includes("Poor") || val.includes("खराब") || val.includes("वाईट")) {
        crowdCounts["Poor"] = (crowdCounts["Poor"] ?? 0) + 1;
      }
    });

    const crowdRating = Object.entries(crowdCounts).map(([rating, count]) => ({
      rating,
      count,
    }));

    // 4. Language distribution
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

    // 5. City distribution (Q3)
    const cityMap = new Map<string, number>();
    responses.forEach((r) => {
      const city = r.answers["city"]?.text?.trim();
      if (city) {
        const cleanCity = city.charAt(0).toUpperCase() + city.slice(1);
        cityMap.set(cleanCity, (cityMap.get(cleanCity) ?? 0) + 1);
      }
    });

    const cities = Array.from(cityMap.entries())
      .map(([city, count]) => ({ city, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 7);

    // 6. Previous Kumbh attendance distribution (Q4)
    const kumbhCounts: Record<string, number> = {
      "Prayagraj (2025)": 0,
      "Haridwar (2021)": 0,
      "Ujjain (2016)": 0,
      "Nashik (2015)": 0,
      "Other": 0,
    };

    responses.forEach((r) => {
      const val =
        r.answers["previous_kumbh"]?.text?.trim() ||
        r.answers["previous_kumbh"]?.choice?.trim();
      if (!val) return;

      if (val.includes("Prayagraj") || val.includes("2025") || val.includes("प्रयागराज")) {
        kumbhCounts["Prayagraj (2025)"] = (kumbhCounts["Prayagraj (2025)"] ?? 0) + 1;
      }
      if (val.includes("Haridwar") || val.includes("2021") || val.includes("हरिद्वार")) {
        kumbhCounts["Haridwar (2021)"] = (kumbhCounts["Haridwar (2021)"] ?? 0) + 1;
      }
      if (val.includes("Ujjain") || val.includes("2016") || val.includes("उज्जैन")) {
        kumbhCounts["Ujjain (2016)"] = (kumbhCounts["Ujjain (2016)"] ?? 0) + 1;
      }
      if (val.includes("Nashik") || val.includes("2015") || val.includes("नासिक") || val.includes("नाशिक")) {
        kumbhCounts["Nashik (2015)"] = (kumbhCounts["Nashik (2015)"] ?? 0) + 1;
      }
      if (val.includes("Other") || val.includes("अन्य") || val.includes("इतर")) {
        kumbhCounts["Other"] = (kumbhCounts["Other"] ?? 0) + 1;
      }
    });

    const previousKumbh = Object.entries(kumbhCounts)
      .map(([mela, count]) => ({ mela, count }))
      .filter((item) => item.count > 0);

    return { overTime, satisfaction, crowdRating, languages, cities, previousKumbh };
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
        const hasFiles = Object.values(r.answers).some(
          (a) => Boolean(a.fileUrl) || Boolean(a.files && a.files.length > 0)
        );
        if (!hasFiles) return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchId = r.id.toLowerCase().includes(q);
        const matchText = Object.values(r.answers).some(
          (a) => a.text?.toLowerCase().includes(q) || a.choice?.toLowerCase().includes(q)
        );
        const matchAudio =
          (q === "audio" || q === "voice" || q === "mic") &&
          Object.values(r.answers).some((a) => Boolean(a.audioUrl));
        const matchFile =
          (q === "file" || q === "files" || q === "upload" || q === "photo" || q === "video") &&
          Object.values(r.answers).some(
            (a) => Boolean(a.fileUrl) || Boolean(a.files && a.files.length > 0)
          );
        return matchId || matchText || matchAudio || matchFile;
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
            <div>
              <div className="flex items-center gap-2">
                <h1 className="admin-title">Kumbh Mela Survey Admin</h1>
                <span className="admin-badge">K K Wagh MCA</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Visitor Experience & Technology Questionnaire Analytics
              </p>
            </div>
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
                {exporting ? "Exporting…" : "Export Excel (21 Qs)"}
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
            label="Avg Facilities Rating"
            value={`${stats.avgSatisfaction}/5`}
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
                  ) : null
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
                  <AreaChart
                    data={chartData.overTime}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorResponses" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--color-card)",
                        borderColor: "var(--color-border)",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="responses"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorResponses)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Split Grid: Facilities Satisfaction & Crowd Management Rating */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Facilities Satisfaction (Q10) */}
              <div className="rounded-xl border border-border bg-card p-5 sm:p-6 shadow-sm">
                <div className="mb-4">
                  <h2 className="text-base font-semibold text-foreground">
                    Facilities Satisfaction (Q10)
                  </h2>
                  <p className="text-xs text-muted-foreground">Pilgrim feedback on facilities used</p>
                </div>
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData.satisfaction}
                      margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                      <XAxis
                        dataKey="rating"
                        tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
                        axisLine={false}
                        tickLine={false}
                        allowDecimals={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "var(--color-card)",
                          borderColor: "var(--color-border)",
                          borderRadius: "8px",
                          fontSize: "12px",
                        }}
                      />
                      <Bar dataKey="count" radius={[6, 6, 0, 0]} fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Crowd Management Rating (Q13) */}
              <div className="rounded-xl border border-border bg-card p-5 sm:p-6 shadow-sm">
                <div className="mb-4">
                  <h2 className="text-base font-semibold text-foreground">
                    Crowd Management Rating (Q13)
                  </h2>
                  <p className="text-xs text-muted-foreground">Evaluation of crowd control measures</p>
                </div>
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData.crowdRating}
                      margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                      <XAxis
                        dataKey="rating"
                        tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
                        axisLine={false}
                        tickLine={false}
                        allowDecimals={false}
                      />
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
            </div>

            {/* Split Grid: Top Cities & Previous Kumbh */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* City Breakdown (Q3) */}
              {chartData.cities.length > 0 && (
                <div className="rounded-xl border border-border bg-card p-5 sm:p-6 shadow-sm">
                  <div className="mb-4">
                    <h2 className="text-base font-semibold text-foreground">
                      Top Visitor Cities (Q3)
                    </h2>
                    <p className="text-xs text-muted-foreground">Most common visitor origins</p>
                  </div>
                  <div className="h-56 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        layout="vertical"
                        data={chartData.cities}
                        margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--color-border)" />
                        <XAxis
                          type="number"
                          tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
                          axisLine={false}
                          tickLine={false}
                          allowDecimals={false}
                        />
                        <YAxis
                          dataKey="city"
                          type="category"
                          tick={{ fontSize: 12, fill: "var(--color-foreground)" }}
                          axisLine={false}
                          tickLine={false}
                          width={90}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "var(--color-card)",
                            borderColor: "var(--color-border)",
                            borderRadius: "8px",
                            fontSize: "12px",
                          }}
                        />
                        <Bar dataKey="count" fill="#3b82f6" radius={[0, 6, 6, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Previous Kumbh Attendance (Q4) */}
              {chartData.previousKumbh.length > 0 && (
                <div className="rounded-xl border border-border bg-card p-5 sm:p-6 shadow-sm">
                  <div className="mb-4">
                    <h2 className="text-base font-semibold text-foreground">
                      Previous Kumbh Attendance (Q4)
                    </h2>
                    <p className="text-xs text-muted-foreground">Past Kumbh Melas attended</p>
                  </div>
                  <div className="h-56 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        layout="vertical"
                        data={chartData.previousKumbh}
                        margin={{ top: 5, right: 20, left: 25, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--color-border)" />
                        <XAxis
                          type="number"
                          tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
                          axisLine={false}
                          tickLine={false}
                          allowDecimals={false}
                        />
                        <YAxis
                          dataKey="mela"
                          type="category"
                          tick={{ fontSize: 11, fill: "var(--color-foreground)" }}
                          axisLine={false}
                          tickLine={false}
                          width={140}
                        />
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
              placeholder="Search by name, phone, city, feedback, or 'audio'…"
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
            >
              <Mic className="h-3 w-3 inline mr-1" />
              Audio ({stats.withAudioCount})
            </button>
            <button
              type="button"
              onClick={() => setFilesOnly((prev) => !prev)}
              className={`admin-lang-btn ${filesOnly ? "active" : ""}`}
            >
              <Paperclip className="h-3 w-3 inline mr-1" />
              Photos/Videos ({stats.withFilesCount})
            </button>
          </div>
        </section>

        {/* ── Results Bar ──────────────────────────────────────────────────── */}
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
              <FileSpreadsheet className="h-3.5 w-3.5" />
              {exporting ? "Exporting…" : "Export filtered to Excel"}
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

  const cityObj = response.answers["city"];
  const cityText = cityObj?.text?.trim();

  const satRating =
    response.answers["facilities_satisfaction"]?.text ||
    response.answers["facilities_satisfaction"]?.choice;

  const crowdRating =
    response.answers["crowd_management_rating"]?.text ||
    response.answers["crowd_management_rating"]?.choice;

  const prevKumbh =
    response.answers["previous_kumbh"]?.text?.trim() ||
    response.answers["previous_kumbh"]?.choice?.trim();

  const audioCount = Object.values(response.answers).filter((a) => Boolean(a.audioUrl)).length;
  const fileCount = Object.values(response.answers).reduce((acc, a) => {
    if (a.files && a.files.length > 0) return acc + a.files.length;
    if (a.fileUrl) return acc + 1;
    return acc;
  }, 0);

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
              <div className="flex items-center gap-1.5">
                <a
                  href={`tel:${phoneText}`}
                  onClick={(e) => e.stopPropagation()}
                  className="response-card-phone inline-flex items-center gap-1"
                  title={`Call ${phoneText}`}
                >
                  <Phone className="h-3 w-3" />
                  <span>{phoneText}</span>
                </a>
                <a
                  href={`https://wa.me/91${phoneText.replace(/[^\d]/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="p-1 rounded-md text-emerald-600 hover:bg-emerald-500/10 transition-colors"
                  title="WhatsApp"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                </a>
              </div>
            ) : null}

            {cityText ? (
              <span className="response-card-state inline-flex items-center gap-1">
                <MapPin className="h-3 w-3 text-muted-foreground" />
                <span>{cityText}</span>
              </span>
            ) : null}
          </div>

          <div className="response-card-sub">
            <span className="response-lang-pill">{LANG_LABELS[response.lang]}</span>

            {satRating && (
              <span className="response-rating" title="Facilities Satisfaction">
                <Star className="h-3 w-3" /> {satRating}
              </span>
            )}

            {crowdRating && (
              <span className="response-lang-pill bg-amber-500/10 text-amber-600 border border-amber-500/20">
                Crowd: {crowdRating}
              </span>
            )}

            {prevKumbh && (
              <span
                className="response-lang-pill bg-purple-500/10 text-purple-600 border border-purple-500/20 max-w-[200px] truncate"
                title={`Previous Kumbh: ${prevKumbh}`}
              >
                🏛️ {prevKumbh}
              </span>
            )}

            {audioCount > 0 && (
              <span className="response-audio-badge">
                <Mic className="h-3 w-3" /> {audioCount} audio
              </span>
            )}

            {fileCount > 0 && (
              <span className="response-audio-badge text-blue-600 bg-blue-500/10 border-blue-500/20">
                <Film className="h-3 w-3" /> {fileCount} file{fileCount > 1 ? "s" : ""}
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
            {QUESTIONS.map((q, idx) => {
              const a = response.answers[q.id];
              const hasText = Boolean(a?.text?.trim() || a?.choice?.trim());
              const hasAudio = Boolean(a?.audioUrl);
              const allFiles =
                a?.files && a.files.length > 0
                  ? a.files
                  : a?.fileUrl
                  ? [{ fileUrl: a.fileUrl, fileName: a.fileName, fileType: a.fileType, fileSize: undefined }]
                  : [];
              const hasFile = allFiles.length > 0;
              const section = SECTIONS[q.section];

              if (!a && !hasAudio && !hasFile) return null;

              return (
                <div key={q.id} className="answer-item">
                  <div className="answer-header-row">
                    <dt className="answer-question">
                      <span className="text-[11px] font-bold text-primary mr-1.5">
                        [{section.letter}{idx + 1}]
                      </span>
                      {q.label.en}
                    </dt>
                    {hasFile ? (
                      <span className="answer-type-tag bg-blue-500/10 text-blue-600 border border-blue-500/20 flex items-center gap-1">
                        <Paperclip className="h-2.5 w-2.5" /> {allFiles.length > 1 ? `${allFiles.length} Media` : "Media"}
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
                      <span className="answer-type-tag answer-type-choice">Single Choice</span>
                    ) : null}
                  </div>

                  <dd className="answer-body">
                    {hasText && (
                      <span className="answer-text whitespace-pre-line">{a!.text || a!.choice}</span>
                    )}

                    {/* Media files preview */}
                    {hasFile && (
                      <div className="mt-2.5 space-y-2">
                        {allFiles.map((fileItem, fIdx) => (
                          <div
                            key={fIdx}
                            className="flex items-center gap-3 rounded-lg border border-border bg-card/70 p-2.5"
                          >
                            {fileItem.fileType?.startsWith("image/") ||
                            fileItem.fileUrl?.match(/\.(jpeg|jpg|png|gif|webp)/i) ? (
                              <a
                                href={fileItem.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="shrink-0 group relative"
                                title="Open full photo"
                              >
                                <img
                                  src={fileItem.fileUrl}
                                  alt={fileItem.fileName || "Uploaded photo"}
                                  className="h-14 w-14 rounded-lg object-cover border border-border transition-transform group-hover:scale-105"
                                />
                              </a>
                            ) : fileItem.fileType?.startsWith("video/") ||
                              fileItem.fileUrl?.match(/\.(mp4|webm|mov|ogg)/i) ? (
                              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <Film className="h-6 w-6" />
                              </div>
                            ) : (
                              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                                <Paperclip className="h-6 w-6" />
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-semibold text-foreground truncate">
                                {fileItem.fileName || "Media attachment"}
                              </p>
                              <a
                                href={fileItem.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline mt-0.5"
                              >
                                <span>Open full media</span>
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Audio recording player */}
                    {hasAudio && (
                      <div className="answer-audio-row">
                        <audio controls src={a!.audioUrl} className="answer-audio-player" />
                        <a
                          href={a!.audioUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="answer-audio-link"
                          title="Open audio in new tab"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    )}

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
