"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Shield,
  Crosshair,
  Play,
  Plus,
  AlertTriangle,
  AlertCircle,
  Activity,
  Globe,
  Server,
  Cloud,
  Tag,
  Clock,
  RefreshCw,
  Loader2,
  ChevronRight,
  ExternalLink,
  Zap,
  CheckCircle2,
  TrendingUp,
  ShieldAlert,
  ChevronDown,
  X,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Target {
  id: string;
  address: string;
  display_address: string;
  target_type: string;
  target_status: string;
  tags: string[];
  has_api_schemas: boolean;
  has_authentications: boolean;
  license_type: string;
}

interface Issue {
  id: string;
  severity: string;
  title: string;
  description: string;
  snoozed: boolean;
  occurrences: string;
  exploit_likelihood: string | null;
  cvss_score: number | null;
}

interface Scan {
  id: string;
  status: string;
  created_at: string;
  scan_type: string;
  schedule_period: string;
  start_time?: string;
  completed_time?: string;
  target_addresses?: string[];
}

interface Schedule {
  id: number;
  name: string;
  schedule_period: string;
  next_scan_date: string;
  status: string;
}

interface NewsArticle {
  title: string;
  link: string;
  summary: string;
  published: string;
  image: string | null;
}

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

interface TrendingCVE {
  id: string;
  cvss: number;
  severity: string;
  product: string;
  score?: number;
  scorePc?: number;
  tags?: string[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDateTime(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleString("de-DE", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function formatDateShort(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("de-DE", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function daysSince(d: string | null | undefined): number | null {
  if (!d) return null;
  const diff = Date.now() - new Date(d).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function getThreatLevel(critical: number, high: number, medium: number): {
  level: string; color: string; bgColor: string; borderColor: string; message: string;
} {
  if (critical > 0) return {
    level: "Critical", color: "text-red-700", bgColor: "bg-red-50",
    borderColor: "border-red-200",
    message: "Kritische Schwachstellen sofort beheben um Ihr Risiko zu minimieren",
  };
  if (high > 0) return {
    level: "High", color: "text-orange-700", bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
    message: "Hochriskante Issues schnellstmöglich beheben",
  };
  if (medium > 0) return {
    level: "Medium", color: "text-amber-700", bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    message: "Mittlere Risiken bestehen - zeitnah adressieren",
  };
  return {
    level: "Low", color: "text-emerald-700", bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
    message: "Gute Sicherheitslage - weiter so!",
  };
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: "bg-red-500",
  high: "bg-orange-500",
  medium: "bg-amber-400",
  low: "bg-blue-400",
};

const SEVERITY_TEXT: Record<string, string> = {
  critical: "text-red-700 bg-red-100 border-red-200",
  high: "text-orange-700 bg-orange-100 border-orange-200",
  medium: "text-amber-700 bg-amber-100 border-amber-200",
  low: "text-blue-700 bg-blue-100 border-blue-200",
};

// No hardcoded CVEs - fetched live from cvemon.intruder.io

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function VulnerabilitiesDashboard() {
  const router = useRouter();

  // Data
  const [targets, setTargets] = useState<Target[]>([]);
  const [allIssues, setAllIssues] = useState<Issue[]>([]);
  const [scans, setScans] = useState<Scan[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [criticalCount, setCriticalCount] = useState(0);
  const [highCount, setHighCount] = useState(0);
  const [mediumCount, setMediumCount] = useState(0);
  const [lowCount, setLowCount] = useState(0);
  const [activeScansCount, setActiveScansCount] = useState(0);

  // Trending CVEs + Security News
  const [trendingCVEs, setTrendingCVEs] = useState<TrendingCVE[]>([]);
  const [newsArticles, setNewsArticles] = useState<NewsArticle[]>([]);

  // Tag filter
  const [selectedTag, setSelectedTag] = useState<string>("all");
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false);

  // State
  const [loading, setLoading] = useState(true);
  const [scanLoading, setScanLoading] = useState(false);

  // Unique tags from targets
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    targets.forEach((t) => t.tags?.forEach((tag) => tagSet.add(tag)));
    return Array.from(tagSet).sort();
  }, [targets]);

  // Filtered targets by tag
  const filteredTargets = useMemo(() => {
    if (selectedTag === "all") return targets;
    return targets.filter((t) => t.tags?.includes(selectedTag));
  }, [targets, selectedTag]);

  const filteredAddresses = useMemo(() => {
    return filteredTargets.map((t) => t.address);
  }, [filteredTargets]);

  // -------------------------------------------------------------------------
  // Data fetching
  // -------------------------------------------------------------------------

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const tagParam = selectedTag !== "all" ? `&tag_names=${selectedTag}` : "";

      const [
        targetsRes, scansRes, schedulesRes,
        critRes, highRes, medRes, lowRes,
        activeRes, issuesRes,
      ] = await Promise.all([
        fetch("/api/intruder/v1/targets/?limit=100"),
        fetch("/api/intruder/v1/scans/?limit=10"),
        fetch("/api/intruder/v1/scans/schedules/"),
        fetch(`/api/intruder/v1/issues/?severity=critical&limit=1${tagParam}`),
        fetch(`/api/intruder/v1/issues/?severity=high&limit=1${tagParam}`),
        fetch(`/api/intruder/v1/issues/?severity=medium&limit=1${tagParam}`),
        fetch(`/api/intruder/v1/issues/?severity=low&limit=1${tagParam}`),
        fetch("/api/intruder/v1/scans/?status=in_progress"),
        fetch(`/api/intruder/v1/issues/?limit=100${tagParam}`),
      ]);

      if (targetsRes.ok) {
        const d: PaginatedResponse<Target> = await targetsRes.json();
        setTargets(d.results ?? []);
      }
      if (scansRes.ok) {
        const d: PaginatedResponse<Scan> = await scansRes.json();
        setScans(d.results ?? []);
      }
      if (schedulesRes.ok) {
        const d = await schedulesRes.json();
        setSchedules(d.results ?? []);
      }
      if (critRes.ok) { const d = await critRes.json(); setCriticalCount(d.count ?? 0); }
      if (highRes.ok) { const d = await highRes.json(); setHighCount(d.count ?? 0); }
      if (medRes.ok) { const d = await medRes.json(); setMediumCount(d.count ?? 0); }
      if (lowRes.ok) { const d = await lowRes.json(); setLowCount(d.count ?? 0); }
      if (activeRes.ok) { const d = await activeRes.json(); setActiveScansCount(d.count ?? 0); }
      if (issuesRes.ok) {
        const d: PaginatedResponse<Issue> = await issuesRes.json();
        setAllIssues(d.results ?? []);
      }
    } catch (err) {
      console.error("[Dashboard]", err);
    } finally {
      setLoading(false);
    }
  }, [selectedTag]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Fetch trending CVEs + CISA alerts (independent of tag filter)
  useEffect(() => {
    fetch("/api/cves/trending")
      .then((r) => r.json())
      .then((data) => { if (data.trends) setTrendingCVEs(data.trends); })
      .catch(() => {});
    fetch("/api/security-news")
      .then((r) => r.json())
      .then((data) => { if (data.articles) setNewsArticles(data.articles); })
      .catch(() => {});
  }, []);

  // -------------------------------------------------------------------------
  // Computed
  // -------------------------------------------------------------------------

  const totalIssues = criticalCount + highCount + mediumCount + lowCount;
  const critAndHigh = criticalCount + highCount;
  const threat = getThreatLevel(criticalCount, highCount, mediumCount);

  const exploitKnown = allIssues.filter((i) => i.exploit_likelihood === "known").length;

  const nextSchedule = schedules.find((s) => s.next_scan_date);
  const lastScan = scans.find((s) => s.status === "completed");

  // Issues to fix - sorted by severity
  const issuesToFix = useMemo(() => {
    const order = { Critical: 0, High: 1, Medium: 2, Low: 3 };
    return [...allIssues]
      .filter((i) => !i.snoozed)
      .sort((a, b) => (order[a.severity as keyof typeof order] ?? 4) - (order[b.severity as keyof typeof order] ?? 4))
      .slice(0, 5);
  }, [allIssues]);

  // Cyber hygiene score
  const hygieneScore = useMemo(() => {
    if (totalIssues === 0 && filteredTargets.length === 0) return 0;
    const maxPenalty = filteredTargets.length * 100;
    const penalty = criticalCount * 30 + highCount * 15 + mediumCount * 5 + lowCount * 1;
    const score = Math.max(0, Math.min(100, 100 - Math.round((penalty / Math.max(maxPenalty, 1)) * 100)));
    return totalIssues === 0 ? 100 : Math.max(score, 5);
  }, [criticalCount, highCount, mediumCount, lowCount, totalIssues, filteredTargets]);

  // Severity distribution for graph
  const severityData = [
    { label: "Kritisch", count: criticalCount, color: "bg-red-500" },
    { label: "Hoch", count: highCount, color: "bg-orange-500" },
    { label: "Mittel", count: mediumCount, color: "bg-amber-400" },
    { label: "Niedrig", count: lowCount, color: "bg-blue-400" },
  ];
  const maxSeverity = Math.max(...severityData.map((s) => s.count), 1);

  // -------------------------------------------------------------------------
  // Actions
  // -------------------------------------------------------------------------

  async function handleStartScan() {
    setScanLoading(true);
    try {
      const body: Record<string, unknown> = {};
      if (selectedTag !== "all") body.tag_names = [selectedTag];
      await fetch("/api/intruder/v1/scans/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      setTimeout(() => fetchData(), 2000);
    } finally {
      setScanLoading(false);
    }
  }

  // -------------------------------------------------------------------------
  // Loading
  // -------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#0066FF]" />
          <p className="text-sm text-gray-400">Lade Dashboard...</p>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="p-8 space-y-6 bg-gray-50 min-h-screen">
      {/* Header with Tag Filter */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

          {/* Tag Dropdown */}
          <div className="relative">
            <button
              onClick={() => setTagDropdownOpen(!tagDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Tag className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-gray-700">{selectedTag === "all" ? "Alle Tags" : selectedTag}</span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </button>
            {selectedTag !== "all" && (
              <button
                onClick={() => { setSelectedTag("all"); setTagDropdownOpen(false); }}
                className="ml-1 p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            {tagDropdownOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setTagDropdownOpen(false)} />
                <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1 max-h-64 overflow-y-auto">
                  <button
                    onClick={() => { setSelectedTag("all"); setTagDropdownOpen(false); }}
                    className={cn("w-full text-left px-3 py-2 text-sm hover:bg-gray-50", selectedTag === "all" && "bg-blue-50 text-[#0066FF] font-medium")}
                  >
                    Alle Tags
                  </button>
                  {allTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => { setSelectedTag(tag); setTagDropdownOpen(false); }}
                      className={cn("w-full text-left px-3 py-2 text-sm hover:bg-gray-50", selectedTag === tag && "bg-blue-50 text-[#0066FF] font-medium")}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button variant="outline" size="sm" onClick={fetchData} className="text-gray-600">
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Aktualisieren
          </Button>
          <Button
            onClick={handleStartScan}
            disabled={scanLoading}
            className="bg-[#0066FF] hover:bg-blue-700 text-white"
          >
            {scanLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
            Scan starten
          </Button>
        </div>
      </div>

      {/* Row 1: Connected banner like Intruder */}
      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm relative">
        {/* Flowing area chart spanning Findings through Exploit Known */}
        <div className="absolute bottom-0 left-[25%] right-0 h-[70%] pointer-events-none z-0">
          <svg viewBox="0 0 600 120" preserveAspectRatio="none" className="w-full h-full">
            <defs>
              <linearGradient id="flowGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#818cf8" stopOpacity="0.3" />
                <stop offset="50%" stopColor="#ec4899" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#fce7f3" stopOpacity="0.03" />
              </linearGradient>
            </defs>
            {(() => {
              // Each severity count maps to a height - higher count = taller curve
              const maxC = Math.max(criticalCount, highCount, mediumCount, lowCount, 1);
              const h = (v: number) => (v / maxC) * 90;

              // Points at each severity position: Critical, High, Medium, Low
              const points = [
                { x: 0,   y: 120 - h(criticalCount) * 0.5 },  // entry
                { x: 100, y: 120 - h(criticalCount) },          // Critical
                { x: 250, y: 120 - h(highCount) },              // High
                { x: 400, y: 120 - h(mediumCount) },            // Medium
                { x: 530, y: 120 - h(lowCount) },               // Low
                { x: 600, y: 120 - h(lowCount) * 0.7 },         // exit
              ];

              const line = points.map((p, i) => {
                if (i === 0) return `M${p.x},${p.y}`;
                const prev = points[i - 1];
                const cpx = (prev.x + p.x) / 2;
                return `C${cpx},${prev.y} ${cpx},${p.y} ${p.x},${p.y}`;
              }).join(" ");

              return (
                <>
                  <path d={`${line} L600,120 L0,120 Z`} fill="url(#flowGrad)" />
                  <path d={line} fill="none" stroke="#ec4899" strokeWidth="1.5" strokeOpacity="0.5" />
                </>
              );
            })()}
          </svg>
        </div>

        <div className="grid grid-cols-12 divide-x divide-gray-100 relative z-10">
          {/* Threat Level */}
          <div className={cn("col-span-3 p-6 relative", threat.bgColor)}>
            <p className="text-sm text-gray-500 mb-8">Threat level</p>
            <div className="flex items-center gap-3">
              <div className={cn("h-9 w-9 rounded-full flex items-center justify-center", criticalCount > 0 ? "bg-red-600" : highCount > 0 ? "bg-orange-500" : mediumCount > 0 ? "bg-amber-500" : "bg-emerald-500")}>
                <ShieldAlert className="h-4.5 w-4.5 text-white" />
              </div>
              <span className={cn("text-2xl font-bold", threat.color)}>{threat.level}</span>
            </div>
            <p className={cn("text-xs mt-4 leading-relaxed", threat.color)}>{threat.message}</p>
          </div>

          {/* Issues total */}
          <Link href="/vulnerabilities/issues" className="col-span-2 p-5 hover:bg-white/80 transition-colors group">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">Issues</p>
              <div className="h-7 w-7 rounded-full border border-gray-200 bg-white flex items-center justify-center group-hover:border-[#0066FF] group-hover:bg-blue-50 transition-colors">
                <ArrowRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#0066FF]" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 mt-1">{totalIssues}</p>
          </Link>

          {/* Critical */}
          <div className="col-span-2 p-5">
            <p className="text-sm text-gray-500 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              Critical
            </p>
            <p className="text-3xl font-bold text-red-700 mt-1">{criticalCount}</p>
          </div>

          {/* High */}
          <div className="col-span-2 p-5">
            <p className="text-sm text-gray-500 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-orange-500" />
              High
            </p>
            <p className="text-3xl font-bold text-orange-700 mt-1">{highCount}</p>
          </div>

          {/* Medium + Low */}
          <div className="col-span-3 p-5 grid grid-cols-2 gap-0 divide-x divide-gray-100">
            <div>
              <p className="text-sm text-gray-500 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                Medium
              </p>
              <p className="text-3xl font-bold text-amber-600 mt-1">{mediumCount}</p>
            </div>
            <div className="pl-4">
              <p className="text-sm text-gray-500 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-400" />
                Low
              </p>
              <p className="text-3xl font-bold text-blue-600 mt-1">{lowCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Targets, Scans in Progress, Top CVE, Activity */}
      <div className="grid grid-cols-4 gap-4">
        {/* Targets */}
        <Link href="/vulnerabilities/targets" className="rounded-xl border border-gray-200 bg-white p-5 hover:shadow-sm transition-shadow">
          <p className="text-sm font-semibold text-gray-800">Targets</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{filteredTargets.length}</p>
          {(() => {
            const attention = filteredTargets.filter((t) => t.target_status === "unresponsive" || t.target_status === "unscanned").length;
            return attention > 0 ? (
              <p className="text-xs text-orange-600 mt-2 flex items-center gap-1 bg-orange-50 rounded-full px-2 py-0.5 w-fit border border-orange-200">
                <AlertCircle className="w-3 h-3" />
                {attention} require attention
              </p>
            ) : null;
          })()}
        </Link>

        {/* Scans in Progress */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-800">Scans in progress</p>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs rounded-full border-gray-300"
              onClick={handleStartScan}
              disabled={scanLoading}
            >
              {scanLoading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
              Scan now
            </Button>
          </div>
          <p className="text-3xl font-bold text-gray-900 mt-1">{activeScansCount}</p>
          {nextSchedule && (
            <p className="text-xs text-gray-500 mt-2">
              Next scheduled scan {formatDateShort(nextSchedule.next_scan_date)}
            </p>
          )}
        </div>

        {/* Top Trending CVE */}
        <a
          href="https://cvemon.intruder.io"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-xl border border-gray-200 bg-white p-5 hover:shadow-sm transition-shadow group"
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
              Top trending CVE <Zap className="w-3.5 h-3.5 text-amber-500" />
            </p>
            <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-[#0066FF] transition-colors" />
          </div>
          {trendingCVEs.length > 0 ? (
            <div className="flex items-center gap-4">
              {/* Semicircle gauge like Intruder */}
              <div className="relative w-20 h-12 flex-shrink-0">
                <svg viewBox="0 0 120 70" className="w-full h-full">
                  <defs>
                    <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#e5e7eb" />
                      <stop offset="50%" stopColor="#fbbf24" />
                      <stop offset="100%" stopColor="#ef4444" />
                    </linearGradient>
                  </defs>
                  {/* Background arc */}
                  <path d="M 10 60 A 50 50 0 0 1 110 60" fill="none" stroke="#e5e7eb" strokeWidth="8" strokeLinecap="round" />
                  {/* Value arc */}
                  <path d="M 10 60 A 50 50 0 0 1 110 60" fill="none" stroke="url(#gaugeGrad)" strokeWidth="8" strokeLinecap="round"
                    strokeDasharray={`${(trendingCVEs[0].scorePc ?? (trendingCVEs[0].cvss / 10) * 100) / 100 * 157}, 157`}
                  />
                  {/* Score number */}
                  <text x="60" y="58" textAnchor="middle" className="text-lg font-bold" fill="#111827" fontSize="22" fontWeight="bold">
                    {trendingCVEs[0].scorePc ?? Math.round(trendingCVEs[0].cvss * 10)}
                  </text>
                  {/* Scale labels */}
                  <text x="12" y="70" fontSize="8" fill="#9ca3af">0</text>
                  <text x="102" y="70" fontSize="8" fill="#9ca3af">100</text>
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-mono font-bold text-gray-900">{trendingCVEs[0].id}</p>
                <span className={cn("inline-flex text-[10px] font-medium px-1.5 py-0.5 rounded border mt-1", SEVERITY_TEXT[trendingCVEs[0].severity.toLowerCase()] || "text-gray-600 bg-gray-100 border-gray-200")}>
                  {trendingCVEs[0].severity} {trendingCVEs[0].cvss}
                </span>
                <p className="text-[10px] text-gray-500 mt-0.5 truncate">{trendingCVEs[0].product}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-16">
              <Loader2 className="w-5 h-5 animate-spin text-gray-300" />
            </div>
          )}
        </a>

        {/* Activity */}
        <Link href="/vulnerabilities/scans" className="rounded-xl border border-gray-200 bg-white p-5 hover:shadow-sm transition-shadow group">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-gray-800">Activity</p>
            <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-[#0066FF] transition-colors" />
          </div>
          {lastScan ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-xs text-gray-600">
                  {lastScan.scan_type === "cloud_security" ? "Cloud scan" : "Team scan"}
                </span>
              </div>
              <p className="text-[11px] text-gray-400">
                {lastScan.target_addresses?.length ?? 0} Target{(lastScan.target_addresses?.length ?? 0) !== 1 ? "s" : ""} scanned {formatDateTime(lastScan.completed_time || lastScan.created_at)}
              </p>
              <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-100">
                <p className="text-xs font-medium text-gray-700">
                  {lastScan.schedule_period === "one_off" ? "One-off scan" : `${lastScan.schedule_period} scan`}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-gray-400 mt-2">Noch keine Scans durchgeführt</p>
          )}
        </Link>
      </div>

      {/* Row 3: Cyber Hygiene + Emerging Threats + Issues to Fix */}
      <div className="grid grid-cols-12 gap-4">
        {/* Cyber Hygiene Score */}
        <div className="col-span-4 rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-sm font-semibold text-gray-800 mb-4">Cyber Hygiene</p>
          <div className="flex items-center gap-5">
            {/* Circular Progress */}
            <div className="relative w-24 h-24 flex-shrink-0">
              <svg viewBox="0 0 36 36" className="w-24 h-24 -rotate-90">
                <path
                  d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none" stroke="#f3f4f6" strokeWidth="3.5"
                />
                <path
                  d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke={hygieneScore >= 80 ? "#10b981" : hygieneScore >= 50 ? "#f59e0b" : "#ef4444"}
                  strokeWidth="3.5"
                  strokeDasharray={`${hygieneScore}, 100`}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-xl font-bold text-gray-900">
                {hygieneScore}
              </span>
            </div>
            <div className="space-y-2 flex-1 min-w-0">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Critical</span>
                <span className="font-semibold text-red-600">{criticalCount}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">High</span>
                <span className="font-semibold text-orange-600">{highCount}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Medium</span>
                <span className="font-semibold text-amber-600">{mediumCount}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Low</span>
                <span className="font-semibold text-blue-600">{lowCount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Emerging Threat Scans */}
        <div className="col-span-3 rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
            Emerging threat scans <Zap className="w-3.5 h-3.5 text-amber-500" />
          </p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {scans.filter((s) => s.scan_type === "cloud_security" && daysSince(s.created_at) !== null && (daysSince(s.created_at) ?? 999) <= 30).length}
          </p>
          <p className="text-xs text-gray-500 mt-1">Last 30 days</p>
          <div className="flex items-center gap-1.5 mt-3 text-xs text-gray-400">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            Scans laufen automatisch
          </div>
        </div>

        {/* Issues to Fix */}
        <div className="col-span-5 rounded-xl border border-gray-200 bg-white overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-800">Issues to fix</p>
            <Link href="/vulnerabilities/issues" className="text-xs text-[#0066FF] hover:underline">
              Alle anzeigen
            </Link>
          </div>
          {issuesToFix.length === 0 ? (
            <div className="py-8 text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Keine offenen Issues</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {issuesToFix.map((issue) => {
                const days = daysSince(null); // We don't have first_seen per issue
                return (
                  <div
                    key={issue.id}
                    className="flex items-center justify-between px-5 py-2.5 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => router.push("/vulnerabilities/issues")}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-gray-800 truncate">{issue.title}</p>
                      <span className={cn("inline-flex text-[10px] font-medium px-1.5 py-0.5 rounded border mt-0.5", SEVERITY_TEXT[issue.severity.toLowerCase()])}>
                        {issue.severity}
                      </span>
                    </div>
                    {issue.cvss_score && (
                      <span className="text-xs font-mono text-gray-500 ml-3">CVSS {issue.cvss_score}</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Row 4: Trending CVEs + CISA Security Alerts */}
      <div className="grid grid-cols-12 gap-4">
        {/* Trending CVEs */}
        <div className="col-span-5 rounded-xl border border-gray-200 bg-white overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
              Trending CVEs <Zap className="w-3.5 h-3.5 text-amber-500" />
            </p>
            <a href="https://cvemon.intruder.io" target="_blank" rel="noopener noreferrer" className="text-xs text-[#0066FF] hover:underline flex items-center gap-1">
              CVEmon <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          {trendingCVEs.length === 0 ? (
            <div className="py-8 text-center">
              <Loader2 className="w-5 h-5 animate-spin text-gray-300 mx-auto" />
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {trendingCVEs.slice(0, 4).map((cve) => (
                <a
                  key={cve.id}
                  href="https://cvemon.intruder.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors"
                >
                  <span className={cn("inline-flex text-[10px] font-medium px-1.5 py-0.5 rounded border whitespace-nowrap", SEVERITY_TEXT[cve.severity.toLowerCase()] || "text-gray-600 bg-gray-100 border-gray-200")}>
                    {cve.severity} {cve.cvss}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-mono font-semibold text-gray-900">{cve.id}</p>
                    <p className="text-[11px] text-gray-500 truncate">{cve.product}</p>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Security Newsletter - Heise Security */}
        <div className="col-span-7 rounded-xl border border-gray-200 bg-white overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-[#0066FF]" />
              Security Newsletter
            </p>
            <a href="https://www.heise.de/security/" target="_blank" rel="noopener noreferrer" className="text-xs text-[#0066FF] hover:underline flex items-center gap-1">
              heise security <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          {newsArticles.length === 0 ? (
            <div className="py-8 text-center">
              <Loader2 className="w-5 h-5 animate-spin text-gray-300 mx-auto" />
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {newsArticles.slice(0, 5).map((article) => (
                <a
                  key={article.link}
                  href={article.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 px-5 py-3 hover:bg-gray-50 transition-colors group"
                >
                  {article.image && (
                    <img
                      src={article.image}
                      alt=""
                      className="w-16 h-12 rounded-lg object-cover flex-shrink-0 bg-gray-100"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-800 group-hover:text-[#0066FF] transition-colors line-clamp-1">
                      {article.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                      {article.summary}
                    </p>
                  </div>
                  <span className="text-[10px] text-gray-400 flex-shrink-0 mt-0.5">
                    {formatDateShort(article.published)}
                  </span>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
