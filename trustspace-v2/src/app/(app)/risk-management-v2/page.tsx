"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Shield,
  TrendingDown,
  BarChart3,
  CheckCircle2,
  Plus,
  ArrowUpDown,
  ChevronRight,
  AlertTriangle,
  Search,
  Filter,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  formatEUR,
  getRiskLevelV2,
  getRiskScoreV2,
  getV2MatrixColor,
  calculateALE,
  formatLargeNumber,
} from "@/lib/utils";

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

interface V2Risk {
  id: string;
  title: string;
  description: string;
  riskCategory: string;
  status: string;
  threatSource: string;
  vulnerability: string;
  bruttoProbability: number;
  bruttoImpact: number;
  bruttoScore: number;
  bruttoSLE: number | null;
  bruttoARO: number | null;
  bruttoALE: number | null;
  nettoProbability: number;
  nettoImpact: number;
  nettoScore: number;
  nettoSLE: number | null;
  nettoARO: number | null;
  nettoALE: number | null;
  riskTreatment: string;
  asset?: { id: string; name: string };
  mappedControls?: string[];
}

interface V2Stats {
  totalRisks: number;
  totalALE: number;
  avgScore: number;
  treatedCount: number;
}

type SortField =
  | "title"
  | "riskCategory"
  | "bruttoScore"
  | "nettoScore"
  | "nettoALE"
  | "riskTreatment"
  | "status";
type SortDir = "asc" | "desc";

// ──────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  operational: "Operativ",
  strategic: "Strategisch",
  compliance: "Compliance",
  financial: "Finanziell",
  technical: "Technisch",
};

const STATUS_LABELS: Record<string, string> = {
  identified: "Identifiziert",
  assessed: "Bewertet",
  treated: "Behandelt",
  accepted: "Akzeptiert",
  closed: "Geschlossen",
};

const TREATMENT_LABELS: Record<string, string> = {
  mitigate: "Mitigieren",
  transfer: "Transferieren",
  avoid: "Vermeiden",
  accept: "Akzeptieren",
  none: "Keine",
};

const PROBABILITY_LABELS: string[] = [
  "",
  "Sehr unwahrscheinlich",
  "Unwahrscheinlich",
  "Moeglich",
  "Wahrscheinlich",
  "Sehr wahrscheinlich",
  "Fast sicher",
  "Ueberwiegend",
  "Haeufig",
  "Sehr haeufig",
  "Nahezu sicher",
];

const IMPACT_LABELS: string[] = [
  "",
  "Minimal",
  "Gering",
  "Moderat",
  "Erheblich",
  "Schwerwiegend",
  "Sehr schwer",
  "Kritisch",
  "Sehr kritisch",
  "Verheerend",
  "Katastrophal",
];

// ──────────────────────────────────────────────
// Helper: 10x10 matrix cell color
// ──────────────────────────────────────────────

function getMatrixCellBg(prob: number, impact: number): string {
  const score = prob * impact;
  if (score >= 70) return "bg-red-500/90";
  if (score >= 50) return "bg-orange-500/80";
  if (score >= 30) return "bg-amber-400/70";
  if (score >= 15) return "bg-yellow-300/60";
  if (score >= 5) return "bg-lime-300/50";
  return "bg-emerald-200/50";
}

// ──────────────────────────────────────────────
// Component: Stat Card
// ──────────────────────────────────────────────

function StatCard({
  label,
  value,
  subtext,
  icon: Icon,
  gradient,
}: {
  label: string;
  value: string;
  subtext?: string;
  icon: React.ElementType;
  gradient: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
            {label}
          </p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtext && (
            <p className="text-xs text-gray-400">{subtext}</p>
          )}
        </div>
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-lg",
            gradient
          )}
        >
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
      <div
        className={cn(
          "absolute -bottom-4 -right-4 h-24 w-24 rounded-full opacity-[0.06]",
          gradient
        )}
      />
    </div>
  );
}

// ──────────────────────────────────────────────
// Component: Interactive 10x10 Matrix
// ──────────────────────────────────────────────

function RiskMatrix({
  risks,
  mode,
  onModeChange,
  onCellClick,
}: {
  risks: V2Risk[];
  mode: "brutto" | "netto";
  onModeChange: (m: "brutto" | "netto") => void;
  onCellClick: (prob: number, impact: number, cellRisks: V2Risk[]) => void;
}) {
  const cellMap = useMemo(() => {
    const map: Record<string, V2Risk[]> = {};
    risks.forEach((r) => {
      const p = mode === "brutto" ? r.bruttoProbability : r.nettoProbability;
      const i = mode === "brutto" ? r.bruttoImpact : r.nettoImpact;
      const key = `${p}-${i}`;
      if (!map[key]) map[key] = [];
      map[key].push(r);
    });
    return map;
  }, [risks, mode]);

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900">
            Risikomatrix
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            10 x 10 Wahrscheinlichkeit / Auswirkung
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-0.5">
          <button
            onClick={() => onModeChange("brutto")}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              mode === "brutto"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            Brutto
          </button>
          <button
            onClick={() => onModeChange("netto")}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              mode === "netto"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            Netto
          </button>
        </div>
      </div>

      <div className="flex">
        {/* Y-axis label */}
        <div className="flex w-6 flex-shrink-0 items-center justify-center">
          <span className="text-[10px] font-medium text-gray-400 -rotate-90 whitespace-nowrap">
            Wahrscheinlichkeit
          </span>
        </div>

        <div className="flex-1">
          {/* Y-axis ticks + grid */}
          <div className="flex gap-0.5">
            {/* Y labels column */}
            <div className="flex w-8 flex-col-reverse gap-0.5">
              {Array.from({ length: 10 }, (_, i) => i + 1).map((p) => (
                <div
                  key={p}
                  className="flex h-8 items-center justify-end pr-1"
                >
                  <span className="text-[9px] text-gray-400 font-medium">
                    {p}
                  </span>
                </div>
              ))}
            </div>

            {/* Matrix cells */}
            <div className="flex-1">
              <div className="flex flex-col-reverse gap-0.5">
                {Array.from({ length: 10 }, (_, pi) => pi + 1).map((prob) => (
                  <div key={prob} className="flex gap-0.5">
                    {Array.from({ length: 10 }, (_, ii) => ii + 1).map(
                      (impact) => {
                        const key = `${prob}-${impact}`;
                        const cellRisks = cellMap[key] || [];
                        const count = cellRisks.length;

                        return (
                          <button
                            key={key}
                            onClick={() =>
                              onCellClick(prob, impact, cellRisks)
                            }
                            className={cn(
                              "relative flex h-8 flex-1 items-center justify-center rounded-[3px] text-[10px] font-semibold transition-all",
                              getMatrixCellBg(prob, impact),
                              count > 0
                                ? "ring-1 ring-inset ring-white/40 hover:ring-white/70 cursor-pointer"
                                : "opacity-60 cursor-default"
                            )}
                            title={`W: ${prob}, A: ${impact} - ${count} Risiken`}
                          >
                            {count > 0 && (
                              <span className="text-white drop-shadow-sm">
                                {count}
                              </span>
                            )}
                          </button>
                        );
                      }
                    )}
                  </div>
                ))}
              </div>

              {/* X-axis ticks */}
              <div className="mt-0.5 flex gap-0.5">
                {Array.from({ length: 10 }, (_, i) => i + 1).map((impact) => (
                  <div
                    key={impact}
                    className="flex flex-1 items-center justify-center"
                  >
                    <span className="text-[9px] text-gray-400 font-medium">
                      {impact}
                    </span>
                  </div>
                ))}
              </div>

              {/* X-axis label */}
              <p className="mt-1 text-center text-[10px] font-medium text-gray-400">
                Auswirkung
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center gap-3 border-t border-gray-50 pt-3">
        <span className="text-[10px] text-gray-400">Risikostufe:</span>
        {[
          { label: "Minimal", cls: "bg-emerald-200" },
          { label: "Niedrig", cls: "bg-lime-300" },
          { label: "Mittel", cls: "bg-yellow-300" },
          { label: "Hoch", cls: "bg-amber-400" },
          { label: "Sehr Hoch", cls: "bg-orange-500" },
          { label: "Kritisch", cls: "bg-red-500" },
        ].map(({ label, cls }) => (
          <div key={label} className="flex items-center gap-1">
            <div className={cn("h-2.5 w-2.5 rounded-sm", cls)} />
            <span className="text-[10px] text-gray-500">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Component: Top Risks sidebar
// ──────────────────────────────────────────────

function TopRisksList({ risks }: { risks: V2Risk[] }) {
  const router = useRouter();
  const topRisks = useMemo(() => {
    return [...risks]
      .filter((r) => r.nettoALE != null)
      .sort((a, b) => (b.nettoALE ?? 0) - (a.nettoALE ?? 0))
      .slice(0, 10);
  }, [risks]);

  return (
    <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
      <div className="border-b border-gray-50 px-5 py-4">
        <h2 className="text-base font-semibold text-gray-900">
          Top 10 Risiken nach ALE
        </h2>
        <p className="text-xs text-gray-500 mt-0.5">
          Jaehrlicher erwarteter Verlust
        </p>
      </div>
      <div className="divide-y divide-gray-50">
        {topRisks.length === 0 && (
          <div className="px-5 py-8 text-center text-sm text-gray-400">
            Keine Risiken mit ALE-Bewertung vorhanden
          </div>
        )}
        {topRisks.map((risk, idx) => {
          const level = getRiskLevelV2(risk.nettoScore);
          return (
            <button
              key={risk.id}
              className="flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-gray-50/80"
              onClick={() =>
                router.push(`/risk-management-v2/risks/${risk.id}`)
              }
            >
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-[10px] font-bold text-gray-500">
                {idx + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900">
                  {risk.title}
                </p>
                <p className="text-xs text-gray-500">
                  {formatEUR(risk.nettoALE)} /Jahr
                </p>
              </div>
              <span
                className={cn(
                  "flex-shrink-0 rounded-md px-2 py-0.5 text-[10px] font-semibold",
                  level.color
                )}
              >
                {risk.nettoScore}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Component: Cell Detail Panel
// ──────────────────────────────────────────────

function CellDetailPanel({
  prob,
  impact,
  risks,
  onClose,
}: {
  prob: number;
  impact: number;
  risks: V2Risk[];
  onClose: () => void;
}) {
  const router = useRouter();
  if (risks.length === 0) return null;

  return (
    <div className="mt-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium text-gray-900">
          Wahrscheinlichkeit {prob} / Auswirkung {impact}{" "}
          <span className="text-gray-400">
            - {risks.length} Risiko(en)
          </span>
        </p>
        <button
          onClick={onClose}
          className="text-xs text-gray-400 hover:text-gray-600"
        >
          Schliessen
        </button>
      </div>
      <div className="max-h-48 space-y-2 overflow-y-auto">
        {risks.map((r) => (
          <div
            key={r.id}
            className="flex cursor-pointer items-center justify-between rounded-lg border border-gray-100 p-3 transition-colors hover:bg-gray-50"
            onClick={() =>
              router.push(`/risk-management-v2/risks/${r.id}`)
            }
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-900">
                {r.title}
              </p>
              {r.asset && (
                <p className="text-xs text-gray-500">{r.asset.name}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">
                {formatEUR(r.nettoALE)}
              </span>
              <ChevronRight className="h-4 w-4 text-gray-300" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Main Page
// ──────────────────────────────────────────────

export default function RiskManagementV2Page() {
  const router = useRouter();

  // Data
  const [risks, setRisks] = useState<V2Risk[]>([]);
  const [stats, setStats] = useState<V2Stats>({
    totalRisks: 0,
    totalALE: 0,
    avgScore: 0,
    treatedCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Matrix
  const [matrixMode, setMatrixMode] = useState<"brutto" | "netto">("brutto");
  const [selectedCell, setSelectedCell] = useState<{
    prob: number;
    impact: number;
    risks: V2Risk[];
  } | null>(null);

  // Table
  const [sortField, setSortField] = useState<SortField>("nettoScore");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // ── Fetch data ──
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [risksRes, statsRes] = await Promise.all([
          fetch("/api/v2/risks"),
          fetch("/api/v2/risks/stats"),
        ]);
        if (risksRes.ok) {
          setRisks(await risksRes.json());
        }
        if (statsRes.ok) {
          setStats(await statsRes.json());
        }
      } catch (err) {
        console.error("Fehler beim Laden:", err);
        setError("Daten konnten nicht geladen werden.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // ── Computed stats (fallback from local data) ──
  const computedStats = useMemo(() => {
    if (stats.totalRisks > 0) return stats;
    const totalALE = risks.reduce((s, r) => s + (r.nettoALE ?? 0), 0);
    const avgScore =
      risks.length > 0
        ? Math.round(
            risks.reduce((s, r) => s + r.nettoScore, 0) / risks.length
          )
        : 0;
    const treatedCount = risks.filter((r) => r.status !== "identified").length;
    return {
      totalRisks: risks.length,
      totalALE,
      avgScore,
      treatedCount,
    };
  }, [risks, stats]);

  // ── Sorted & filtered table rows ──
  const tableRows = useMemo(() => {
    let filtered = [...risks];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.asset?.name?.toLowerCase().includes(q) ||
          r.riskCategory.toLowerCase().includes(q)
      );
    }

    if (filterCategory !== "all") {
      filtered = filtered.filter((r) => r.riskCategory === filterCategory);
    }
    if (filterStatus !== "all") {
      filtered = filtered.filter((r) => r.status === filterStatus);
    }

    filtered.sort((a, b) => {
      let valA: string | number = 0;
      let valB: string | number = 0;
      switch (sortField) {
        case "title":
          valA = a.title.toLowerCase();
          valB = b.title.toLowerCase();
          break;
        case "riskCategory":
          valA = a.riskCategory;
          valB = b.riskCategory;
          break;
        case "bruttoScore":
          valA = a.bruttoScore;
          valB = b.bruttoScore;
          break;
        case "nettoScore":
          valA = a.nettoScore;
          valB = b.nettoScore;
          break;
        case "nettoALE":
          valA = a.nettoALE ?? 0;
          valB = b.nettoALE ?? 0;
          break;
        case "riskTreatment":
          valA = a.riskTreatment;
          valB = b.riskTreatment;
          break;
        case "status":
          valA = a.status;
          valB = b.status;
          break;
      }
      if (valA < valB) return sortDir === "asc" ? -1 : 1;
      if (valA > valB) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [risks, sortField, sortDir, filterCategory, filterStatus, searchQuery]);

  const toggleSort = useCallback(
    (field: SortField) => {
      if (sortField === field) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortField(field);
        setSortDir("desc");
      }
    },
    [sortField]
  );

  // ── Loading / Error ──
  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#0066FF]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-3">
        <AlertTriangle className="h-10 w-10 text-red-400" />
        <p className="text-sm text-red-600">{error}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.location.reload()}
        >
          Erneut versuchen
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/risk-management-v2" className="text-gray-900 font-medium">
          Risikomanagement v2
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Risikomanagement v2
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Quantitative Risikobewertung (FAIR-Methodik)
          </p>
        </div>
        <Button
          className="bg-[#0066FF] hover:bg-blue-700"
          onClick={() => router.push("/risk-management-v2/risks/new")}
        >
          <Plus className="mr-2 h-4 w-4" />
          Neues Risiko
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          label="Gesamtrisiken"
          value={String(computedStats.totalRisks)}
          icon={Shield}
          gradient="bg-gradient-to-br from-[#0066FF] to-blue-600"
        />
        <StatCard
          label="Jaehrliches Gesamtrisiko (ALE)"
          value={formatEUR(computedStats.totalALE)}
          subtext="Netto - nach Massnahmen"
          icon={TrendingDown}
          gradient="bg-gradient-to-br from-orange-500 to-red-500"
        />
        <StatCard
          label="Durchschnittlicher Score"
          value={String(computedStats.avgScore)}
          subtext="Netto-Score aller Risiken"
          icon={BarChart3}
          gradient="bg-gradient-to-br from-violet-500 to-purple-600"
        />
        <StatCard
          label="Behandelte Risiken"
          value={`${computedStats.treatedCount} / ${computedStats.totalRisks}`}
          subtext={
            computedStats.totalRisks > 0
              ? `${Math.round(
                  (computedStats.treatedCount / computedStats.totalRisks) * 100
                )}% abgeschlossen`
              : undefined
          }
          icon={CheckCircle2}
          gradient="bg-gradient-to-br from-emerald-500 to-green-600"
        />
      </div>

      {/* Matrix + Top Risks */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-7">
          <RiskMatrix
            risks={risks}
            mode={matrixMode}
            onModeChange={setMatrixMode}
            onCellClick={(prob, impact, cellRisks) =>
              setSelectedCell(
                cellRisks.length > 0 ? { prob, impact, risks: cellRisks } : null
              )
            }
          />
          {selectedCell && (
            <CellDetailPanel
              prob={selectedCell.prob}
              impact={selectedCell.impact}
              risks={selectedCell.risks}
              onClose={() => setSelectedCell(null)}
            />
          )}
        </div>
        <div className="col-span-5">
          <TopRisksList risks={risks} />
        </div>
      </div>

      {/* Risk Register Table */}
      <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="border-b border-gray-50 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">
              Risikoregister
            </h2>
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Suchen..."
                  className="h-8 w-56 pl-9 text-sm"
                />
              </div>

              {/* Category Filter */}
              <Select
                value={filterCategory}
                onValueChange={setFilterCategory}
              >
                <SelectTrigger className="h-8 w-40 text-xs">
                  <Filter className="mr-1 h-3 w-3" />
                  <SelectValue placeholder="Kategorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Kategorien</SelectItem>
                  {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Status Filter */}
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="h-8 w-36 text-xs">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Status</SelectItem>
                  {Object.entries(STATUS_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/50">
              <TableHead>
                <button
                  className="flex items-center gap-1 text-xs"
                  onClick={() => toggleSort("title")}
                >
                  Titel
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </TableHead>
              <TableHead className="text-xs">Asset</TableHead>
              <TableHead>
                <button
                  className="flex items-center gap-1 text-xs"
                  onClick={() => toggleSort("riskCategory")}
                >
                  Kategorie
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </TableHead>
              <TableHead>
                <button
                  className="flex items-center gap-1 text-xs"
                  onClick={() => toggleSort("bruttoScore")}
                >
                  Brutto
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </TableHead>
              <TableHead>
                <button
                  className="flex items-center gap-1 text-xs"
                  onClick={() => toggleSort("nettoScore")}
                >
                  Netto
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </TableHead>
              <TableHead>
                <button
                  className="flex items-center gap-1 text-xs"
                  onClick={() => toggleSort("nettoALE")}
                >
                  ALE
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </TableHead>
              <TableHead>
                <button
                  className="flex items-center gap-1 text-xs"
                  onClick={() => toggleSort("riskTreatment")}
                >
                  Behandlung
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </TableHead>
              <TableHead>
                <button
                  className="flex items-center gap-1 text-xs"
                  onClick={() => toggleSort("status")}
                >
                  Status
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tableRows.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="py-12 text-center text-sm text-gray-400"
                >
                  Keine Risiken gefunden
                </TableCell>
              </TableRow>
            )}
            {tableRows.map((risk) => {
              const bruttoLevel = getRiskLevelV2(risk.bruttoScore);
              const nettoLevel = getRiskLevelV2(risk.nettoScore);

              return (
                <TableRow
                  key={risk.id}
                  className="cursor-pointer transition-colors hover:bg-gray-50/80"
                  onClick={() =>
                    router.push(`/risk-management-v2/risks/${risk.id}`)
                  }
                >
                  <TableCell className="max-w-[200px]">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {risk.title}
                    </p>
                  </TableCell>
                  <TableCell className="text-xs text-gray-500">
                    {risk.asset?.name ?? "-"}
                  </TableCell>
                  <TableCell>
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">
                      {CATEGORY_LABELS[risk.riskCategory] ?? risk.riskCategory}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "rounded-md px-2 py-0.5 text-[10px] font-semibold",
                        bruttoLevel.color
                      )}
                    >
                      {risk.bruttoScore}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "rounded-md px-2 py-0.5 text-[10px] font-semibold",
                        nettoLevel.color
                      )}
                    >
                      {risk.nettoScore}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-gray-700 font-medium">
                    {formatEUR(risk.nettoALE)}
                  </TableCell>
                  <TableCell className="text-xs text-gray-500">
                    {TREATMENT_LABELS[risk.riskTreatment] ?? risk.riskTreatment}
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-medium",
                        risk.status === "identified"
                          ? "bg-gray-100 text-gray-600"
                          : risk.status === "assessed"
                          ? "bg-blue-50 text-blue-700"
                          : risk.status === "treated"
                          ? "bg-green-50 text-green-700"
                          : risk.status === "accepted"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-gray-100 text-gray-500"
                      )}
                    >
                      {STATUS_LABELS[risk.status] ?? risk.status}
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {/* Footer */}
        <div className="border-t border-gray-50 px-6 py-3">
          <p className="text-xs text-gray-400">
            {tableRows.length} von {risks.length} Risiken angezeigt
          </p>
        </div>
      </div>
    </div>
  );
}
