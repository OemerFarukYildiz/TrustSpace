"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Loader2,
  AlertTriangle,
  ChevronRight,
  ArrowLeft,
  Grid3X3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  cn,
  formatEUR,
  getRiskLevelV2,
  getRiskScoreV2,
  getV2MatrixColor,
  calculateALE,
  formatLargeNumber,
  formatDate,
} from "@/lib/utils";

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

interface MatrixRisk {
  id: string;
  title: string;
  riskCategory: string;
  status: string;
  assetName: string | null;
  assetCategory: string | null;
  brutto: {
    probability: number;
    impact: number;
    score: number;
  };
  netto: {
    probability: number;
    impact: number;
    score: number;
  };
}

// ──────────────────────────────────────────────
// Helper
// ──────────────────────────────────────────────

function getCellColor(count: number, prob: number, impact: number): string {
  const score = prob * impact;
  if (count === 0) {
    if (score >= 70) return "bg-red-100";
    if (score >= 50) return "bg-orange-100";
    if (score >= 30) return "bg-yellow-100";
    if (score >= 10) return "bg-green-100";
    return "bg-green-50";
  }
  if (score >= 70) return "bg-red-500";
  if (score >= 50) return "bg-orange-500";
  if (score >= 30) return "bg-yellow-400";
  if (score >= 10) return "bg-green-400";
  return "bg-green-200";
}

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

// ──────────────────────────────────────────────
// Main Page
// ──────────────────────────────────────────────

export default function RiskMatrixPage() {
  const router = useRouter();

  const [risks, setRisks] = useState<MatrixRisk[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [mode, setMode] = useState<"brutto" | "netto">("brutto");
  const [selectedCell, setSelectedCell] = useState<{
    prob: number;
    impact: number;
  } | null>(null);

  // Fetch matrix data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/v2/risks/matrix");
        if (!res.ok) throw new Error("Fehler beim Laden");
        setRisks(await res.json());
      } catch (err) {
        console.error(err);
        setError("Matrixdaten konnten nicht geladen werden.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Build cell map
  const cellMap = useMemo(() => {
    const map: Record<string, MatrixRisk[]> = {};
    risks.forEach((r) => {
      const data = mode === "brutto" ? r.brutto : r.netto;
      const key = `${data.probability}-${data.impact}`;
      if (!map[key]) map[key] = [];
      map[key].push(r);
    });
    return map;
  }, [risks, mode]);

  // Selected cell risks
  const selectedRisks = useMemo(() => {
    if (!selectedCell) return [];
    const key = `${selectedCell.prob}-${selectedCell.impact}`;
    return cellMap[key] || [];
  }, [selectedCell, cellMap]);

  // Stats
  const totalInMatrix = risks.length;
  const criticalCount = risks.filter((r) => {
    const data = mode === "brutto" ? r.brutto : r.netto;
    return data.score >= 70;
  }).length;

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
        <Link
          href="/risks-v2"
          className="hover:text-gray-700 transition-colors"
        >
          Risikomanagement v2
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-gray-900 font-medium">Risikomatrix</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Risikomatrix 10 x 10
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {totalInMatrix} Risiken | {criticalCount} kritisch (
            {mode === "brutto" ? "Brutto" : "Netto"})
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/risks-v2")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurueck
          </Button>
        </div>
      </div>

      {/* Toggle */}
      <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-0.5 w-fit">
        <button
          onClick={() => {
            setMode("brutto");
            setSelectedCell(null);
          }}
          className={cn(
            "rounded-md px-4 py-2 text-sm font-medium transition-colors",
            mode === "brutto"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          )}
        >
          Brutto
        </button>
        <button
          onClick={() => {
            setMode("netto");
            setSelectedCell(null);
          }}
          className={cn(
            "rounded-md px-4 py-2 text-sm font-medium transition-colors",
            mode === "netto"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          )}
        >
          Netto
        </button>
      </div>

      {/* Matrix */}
      <Card>
        <CardContent className="p-6">
          <div className="flex">
            {/* Y-axis label */}
            <div className="flex w-8 flex-shrink-0 items-center justify-center">
              <span className="text-xs font-medium text-gray-400 -rotate-90 whitespace-nowrap">
                Wahrscheinlichkeit
              </span>
            </div>

            <div className="flex-1">
              <div className="flex gap-1">
                {/* Y labels column */}
                <div className="flex w-10 flex-col-reverse gap-1">
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((p) => (
                    <div
                      key={p}
                      className="flex h-12 items-center justify-end pr-2"
                    >
                      <span className="text-xs text-gray-400 font-medium">
                        {p}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Matrix cells */}
                <div className="flex-1">
                  <div className="flex flex-col-reverse gap-1">
                    {Array.from({ length: 10 }, (_, pi) => pi + 1).map(
                      (prob) => (
                        <div key={prob} className="flex gap-1">
                          {Array.from({ length: 10 }, (_, ii) => ii + 1).map(
                            (impact) => {
                              const key = `${prob}-${impact}`;
                              const cellRisks = cellMap[key] || [];
                              const count = cellRisks.length;
                              const isSelected =
                                selectedCell?.prob === prob &&
                                selectedCell?.impact === impact;

                              return (
                                <button
                                  key={key}
                                  onClick={() =>
                                    setSelectedCell(
                                      isSelected
                                        ? null
                                        : { prob, impact }
                                    )
                                  }
                                  className={cn(
                                    "relative flex h-12 flex-1 items-center justify-center rounded transition-all text-xs font-bold",
                                    getCellColor(count, prob, impact),
                                    count > 0
                                      ? "text-white hover:opacity-80 cursor-pointer shadow-sm"
                                      : "text-gray-400/50 cursor-default",
                                    isSelected &&
                                      "ring-2 ring-[#0066FF] ring-offset-1"
                                  )}
                                  title={`W: ${prob}, A: ${impact} | Score: ${prob * impact} | ${count} Risiken`}
                                >
                                  {count > 0 ? count : ""}
                                </button>
                              );
                            }
                          )}
                        </div>
                      )
                    )}
                  </div>

                  {/* X-axis ticks */}
                  <div className="mt-1 flex gap-1">
                    {Array.from({ length: 10 }, (_, i) => i + 1).map(
                      (impact) => (
                        <div
                          key={impact}
                          className="flex flex-1 items-center justify-center"
                        >
                          <span className="text-xs text-gray-400 font-medium">
                            {impact}
                          </span>
                        </div>
                      )
                    )}
                  </div>

                  {/* X-axis label */}
                  <p className="mt-2 text-center text-xs font-medium text-gray-400">
                    Auswirkung
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="mt-6 flex items-center gap-4 border-t pt-4">
            <span className="text-xs text-gray-400">Risikostufe:</span>
            {[
              { label: "Minimal", cls: "bg-green-200" },
              { label: "Niedrig", cls: "bg-green-400" },
              { label: "Mittel", cls: "bg-yellow-400" },
              { label: "Hoch", cls: "bg-orange-500" },
              { label: "Kritisch", cls: "bg-red-500" },
            ].map(({ label, cls }) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className={cn("h-3 w-3 rounded-sm", cls)} />
                <span className="text-xs text-gray-500">{label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Selected Cell Detail */}
      {selectedCell && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">
                Wahrscheinlichkeit {selectedCell.prob} / Auswirkung{" "}
                {selectedCell.impact}
                <span className="ml-2 text-gray-400 font-normal">
                  (Score: {selectedCell.prob * selectedCell.impact})
                </span>
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {selectedRisks.length} Risiko(en)
                </Badge>
                <button
                  onClick={() => setSelectedCell(null)}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  Schliessen
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {selectedRisks.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-400">
                Keine Risiken in dieser Zelle
              </p>
            ) : (
              <div className="space-y-2">
                {selectedRisks.map((risk) => {
                  const data =
                    mode === "brutto" ? risk.brutto : risk.netto;
                  const level = getRiskLevelV2(data.score);
                  return (
                    <div
                      key={risk.id}
                      className="flex items-center justify-between rounded-lg border border-gray-100 p-3 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() =>
                        router.push(
                          `/risks-v2/risks/${risk.id}`
                        )
                      }
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900">
                          {risk.title}
                        </p>
                        <div className="mt-1 flex items-center gap-2">
                          {risk.assetName && (
                            <span className="text-xs text-gray-500">
                              {risk.assetName}
                            </span>
                          )}
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">
                            {CATEGORY_LABELS[risk.riskCategory] ||
                              risk.riskCategory}
                          </span>
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[10px] font-medium",
                              risk.status === "treated"
                                ? "bg-green-50 text-green-700"
                                : risk.status === "assessed"
                                ? "bg-blue-50 text-blue-700"
                                : "bg-gray-100 text-gray-600"
                            )}
                          >
                            {STATUS_LABELS[risk.status] || risk.status}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "rounded-md px-2 py-0.5 text-xs font-semibold",
                            level.color
                          )}
                        >
                          {data.score}
                        </span>
                        <ChevronRight className="h-4 w-4 text-gray-300" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
