"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Server,
  BarChart3,
  Plus,
  Search,
  AlertTriangle,
  Shield,
  DollarSign,
  TrendingDown,
  ChevronRight,
  Loader2,
  Package,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AssetV2 {
  id: string;
  name: string;
  category: string;
  ciaScore: number;
  dataClassification: string;
  replacementCost: number | null;
  status: string;
  _count?: { risksV2: number };
}

interface RiskV2 {
  id: string;
  title: string;
  riskCategory: string | null;
  bruttoProbability: number;
  bruttoImpact: number;
  bruttoScore: number;
  nettoProbability: number;
  nettoImpact: number;
  nettoScore: number;
  annualLossExpectancy: number | null;
  nettoALE: number | null;
  riskTreatment: string | null;
  status: string;
  mappedControls: string | null;
  asset?: { id: string; name: string; category: string } | null;
}

type TabId = "overview" | "assets" | "risks";

const CATEGORY_LABELS: Record<string, string> = {
  operational: "Operativ",
  strategic: "Strategisch",
  compliance: "Compliance",
  financial: "Finanziell",
  technical: "Technisch",
  environmental: "Umwelt",
};

const TREATMENT_LABELS: Record<string, string> = {
  mitigate: "Mindern",
  accept: "Akzeptieren",
  transfer: "Transferieren",
  avoid: "Vermeiden",
};

function formatEUR(amount: number | null): string {
  if (!amount) return "—";
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function getRiskColor(score: number): string {
  if (score >= 70) return "bg-red-100 text-red-800 border-red-200";
  if (score >= 50) return "bg-orange-100 text-orange-800 border-orange-200";
  if (score >= 25) return "bg-amber-100 text-amber-800 border-amber-200";
  if (score >= 10) return "bg-yellow-100 text-yellow-800 border-yellow-200";
  return "bg-green-100 text-green-800 border-green-200";
}

function getRiskLabel(score: number): string {
  if (score >= 70) return "Kritisch";
  if (score >= 50) return "Hoch";
  if (score >= 25) return "Mittel";
  if (score >= 10) return "Niedrig";
  return "Minimal";
}

function getCIAColor(score: number): string {
  if (score >= 8) return "text-red-600";
  if (score >= 6) return "text-orange-600";
  if (score >= 4) return "text-amber-600";
  return "text-green-600";
}

export default function RisksV2Page() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [assets, setAssets] = useState<AssetV2[]>([]);
  const [risks, setRisks] = useState<RiskV2[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchAssets, setSearchAssets] = useState("");
  const [searchRisks, setSearchRisks] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [seedingScenarios, setSeedingScenarios] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/v2/assets").then((r) => r.json()),
      fetch("/api/v2/risks").then((r) => r.json()),
    ])
      .then(([assetsData, risksData]) => {
        setAssets(Array.isArray(assetsData) ? assetsData : []);
        setRisks(Array.isArray(risksData) ? risksData : []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function seedScenarios() {
    setSeedingScenarios(true);
    try {
      const res = await fetch("/api/v2/scenarios", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        alert(`${data.created} Szenarien erstellt, ${data.skipped} übersprungen`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSeedingScenarios(false);
    }
  }

  // Stats
  const stats = useMemo(() => {
    const totalALE = risks.reduce((sum, r) => sum + (r.annualLossExpectancy || 0), 0);
    const totalNettoALE = risks.reduce((sum, r) => sum + (r.nettoALE || 0), 0);
    const critical = risks.filter((r) => r.bruttoScore >= 70).length;
    const assessed = risks.filter((r) => r.bruttoScore > 1).length;
    const withControls = risks.filter((r) => {
      try {
        const c = r.mappedControls ? JSON.parse(r.mappedControls) : [];
        return c.length > 0;
      } catch {
        return false;
      }
    }).length;

    return { totalALE, totalNettoALE, critical, assessed, withControls };
  }, [risks]);

  // 10x10 Matrix data
  const matrixData = useMemo(() => {
    const cells: Record<string, RiskV2[]> = {};
    for (const r of risks) {
      const key = `${r.bruttoProbability}-${r.bruttoImpact}`;
      if (!cells[key]) cells[key] = [];
      cells[key].push(r);
    }
    return cells;
  }, [risks]);

  const filteredAssets = useMemo(() => {
    return assets.filter((a) => {
      if (searchAssets && !a.name.toLowerCase().includes(searchAssets.toLowerCase())) return false;
      return true;
    });
  }, [assets, searchAssets]);

  const filteredRisks = useMemo(() => {
    return risks.filter((r) => {
      if (searchRisks && !r.title.toLowerCase().includes(searchRisks.toLowerCase())) return false;
      if (categoryFilter !== "all" && r.riskCategory !== categoryFilter) return false;
      return true;
    });
  }, [risks, searchRisks, categoryFilter]);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Risks & Assets v2</h1>
          <p className="text-sm text-gray-500 mt-1">
            Quantitatives Risikomanagement mit FAIR-Methodik
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={seedScenarios}
            disabled={seedingScenarios}
          >
            {seedingScenarios ? (
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            ) : (
              <Target className="h-4 w-4 mr-1.5" />
            )}
            Szenarien laden
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push("/risks-v2/assets/new")}
          >
            <Package className="h-4 w-4 mr-1.5" />
            Asset anlegen
          </Button>
          <Button
            onClick={() => router.push("/risks-v2/risks/new")}
            className="bg-[#0066FF] hover:bg-[#0052cc] text-white"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Risiko anlegen
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Assets</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{assets.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Risiken</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{risks.length}</p>
          {stats.critical > 0 && (
            <p className="text-xs text-red-600 mt-0.5">{stats.critical} kritisch</p>
          )}
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Brutto ALE</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{formatEUR(stats.totalALE)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Netto ALE</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{formatEUR(stats.totalNettoALE)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Mit Maßnahmen</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {stats.withControls}/{risks.length}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-0">
          {[
            { id: "overview" as TabId, label: "Übersicht", icon: BarChart3 },
            { id: "assets" as TabId, label: `Assets (${assets.length})`, icon: Server },
            { id: "risks" as TabId, label: `Risiken (${risks.length})`, icon: AlertTriangle },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors",
                  activeTab === tab.id
                    ? "text-[#0066FF] border-[#0066FF]"
                    : "text-gray-500 border-transparent hover:text-gray-700"
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Overview Tab - Risk Matrix */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
                Risikomatrix (10×10) — Brutto
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/risks-v2/matrix")}
              >
                Vollbild
              </Button>
            </div>

            <div className="flex gap-4">
              {/* Y-Axis Label */}
              <div className="flex flex-col items-center justify-center w-6">
                <span className="text-[10px] font-medium text-gray-400 -rotate-90 whitespace-nowrap">
                  Auswirkung →
                </span>
              </div>

              <div className="flex-1">
                {/* Matrix Grid */}
                <div className="grid grid-cols-10 gap-0.5">
                  {Array.from({ length: 100 }, (_, idx) => {
                    const impact = 10 - Math.floor(idx / 10);
                    const prob = (idx % 10) + 1;
                    const score = prob * impact;
                    const key = `${prob}-${impact}`;
                    const cellRisks = matrixData[key] || [];

                    let bgColor = "bg-green-50";
                    if (score >= 70) bgColor = "bg-red-100";
                    else if (score >= 50) bgColor = "bg-orange-100";
                    else if (score >= 25) bgColor = "bg-amber-50";
                    else if (score >= 10) bgColor = "bg-yellow-50";

                    return (
                      <div
                        key={`${prob}-${impact}`}
                        className={cn(
                          "aspect-square flex items-center justify-center text-[10px] rounded-[3px] relative",
                          bgColor,
                          cellRisks.length > 0 && "ring-1 ring-inset ring-gray-300 font-bold"
                        )}
                        title={`P:${prob} I:${impact} Score:${score} (${cellRisks.length} Risiken)`}
                      >
                        {cellRisks.length > 0 ? (
                          <span className="text-gray-800">{cellRisks.length}</span>
                        ) : (
                          <span className="text-gray-300">{score}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
                {/* X-Axis Label */}
                <p className="text-center text-[10px] font-medium text-gray-400 mt-2">
                  Wahrscheinlichkeit →
                </p>
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-100">
              <span className="text-xs text-gray-500">Legende:</span>
              {[
                { label: "Minimal (1-9)", color: "bg-green-50" },
                { label: "Niedrig (10-24)", color: "bg-yellow-50" },
                { label: "Mittel (25-49)", color: "bg-amber-50" },
                { label: "Hoch (50-69)", color: "bg-orange-100" },
                { label: "Kritisch (70-100)", color: "bg-red-100" },
              ].map((l) => (
                <div key={l.label} className="flex items-center gap-1.5">
                  <div className={cn("h-3 w-3 rounded-sm", l.color)} />
                  <span className="text-[10px] text-gray-600">{l.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Risks by ALE */}
          {risks.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
                Top 10 Risiken nach ALE
              </h3>
              <div className="space-y-2">
                {risks
                  .filter((r) => r.annualLossExpectancy)
                  .sort((a, b) => (b.annualLossExpectancy || 0) - (a.annualLossExpectancy || 0))
                  .slice(0, 10)
                  .map((risk) => (
                    <div
                      key={risk.id}
                      onClick={() => router.push(`/risks-v2/risks/${risk.id}`)}
                      className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border", getRiskColor(risk.bruttoScore))}>
                          {risk.bruttoScore}
                        </span>
                        <span className="text-sm text-gray-900 truncate">{risk.title}</span>
                      </div>
                      <div className="flex items-center gap-4 flex-shrink-0">
                        <span className="text-sm font-medium text-red-600">{formatEUR(risk.annualLossExpectancy)}</span>
                        {risk.nettoALE !== null && risk.nettoALE !== undefined && (
                          <span className="text-xs text-emerald-600">→ {formatEUR(risk.nettoALE)}</span>
                        )}
                        <ChevronRight className="h-4 w-4 text-gray-300" />
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Assets Tab */}
      {activeTab === "assets" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Asset suchen..."
                value={searchAssets}
                onChange={(e) => setSearchAssets(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button onClick={() => router.push("/risks-v2/assets/new")} className="bg-[#0066FF] hover:bg-[#0052cc] text-white">
              <Plus className="h-4 w-4 mr-1.5" />
              Asset anlegen
            </Button>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Name</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Kategorie</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">CIA</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Klassifizierung</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Wiederbeschaffung</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Risiken</th>
                  <th className="py-3 px-4 w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredAssets.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-16 text-gray-400 text-sm">
                      <Server className="h-10 w-10 mx-auto mb-3 text-gray-300" />
                      Noch keine Assets angelegt
                    </td>
                  </tr>
                ) : (
                  filteredAssets.map((asset) => (
                    <tr
                      key={asset.id}
                      onClick={() => router.push(`/risks-v2/assets/${asset.id}`)}
                      className="hover:bg-gray-50 cursor-pointer transition-colors group"
                    >
                      <td className="py-3 px-4">
                        <span className="text-sm font-medium text-gray-900">{asset.name}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-600">{asset.category}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={cn("text-sm font-semibold", getCIAColor(asset.ciaScore))}>
                          {asset.ciaScore > 0 ? asset.ciaScore.toFixed(1) : "—"}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="text-xs capitalize">
                          {asset.dataClassification}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-600">{formatEUR(asset.replacementCost)}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-600">{asset._count?.risksV2 ?? 0}</span>
                      </td>
                      <td className="py-3 px-4">
                        <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500" />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Risks Tab */}
      {activeTab === "risks" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Risiko suchen..."
                value={searchRisks}
                onChange={(e) => setSearchRisks(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Kategorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Kategorien</SelectItem>
                {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => router.push("/risks-v2/risks/new")} className="bg-[#0066FF] hover:bg-[#0052cc] text-white">
              <Plus className="h-4 w-4 mr-1.5" />
              Risiko anlegen
            </Button>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Risiko</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Asset</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Brutto</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Netto</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">ALE</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Maßnahmen</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Behandlung</th>
                  <th className="py-3 px-4 w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredRisks.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-16 text-gray-400 text-sm">
                      <AlertTriangle className="h-10 w-10 mx-auto mb-3 text-gray-300" />
                      Noch keine Risiken angelegt
                    </td>
                  </tr>
                ) : (
                  filteredRisks.map((risk) => {
                    let controlCount = 0;
                    try {
                      controlCount = risk.mappedControls ? JSON.parse(risk.mappedControls).length : 0;
                    } catch { /* */ }

                    return (
                      <tr
                        key={risk.id}
                        onClick={() => router.push(`/risks-v2/risks/${risk.id}`)}
                        className="hover:bg-gray-50 cursor-pointer transition-colors group"
                      >
                        <td className="py-3 px-4 max-w-[250px]">
                          <p className="text-sm font-medium text-gray-900 truncate">{risk.title}</p>
                          {risk.riskCategory && (
                            <span className="text-xs text-gray-500">{CATEGORY_LABELS[risk.riskCategory] || risk.riskCategory}</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-gray-600">{risk.asset?.name || "—"}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border", getRiskColor(risk.bruttoScore))}>
                            {risk.bruttoScore} — {getRiskLabel(risk.bruttoScore)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {risk.nettoScore > 1 ? (
                            <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border", getRiskColor(risk.nettoScore))}>
                              {risk.nettoScore}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-gray-600">{formatEUR(risk.annualLossExpectancy)}</span>
                        </td>
                        <td className="py-3 px-4">
                          {controlCount > 0 ? (
                            <Badge variant="outline" className="text-xs text-emerald-700 border-emerald-200 bg-emerald-50">
                              <Shield className="h-3 w-3 mr-1" />
                              {controlCount}
                            </Badge>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {risk.riskTreatment ? (
                            <span className="text-xs text-gray-600">{TREATMENT_LABELS[risk.riskTreatment] || risk.riskTreatment}</span>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500" />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
