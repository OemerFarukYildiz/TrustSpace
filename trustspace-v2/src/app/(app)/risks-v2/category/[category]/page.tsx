"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Search,
  Filter,
  ArrowRight,
  Shield,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  Clock,
  Loader2,
  X,
} from "lucide-react";
import Link from "next/link";
import { RiskV2Panel, type RiskV2Data } from "@/components/risk-v2-panel";
import { cn } from "@/lib/utils";

const categoryTitles: Record<string, string> = {
  information: "Informationen",
  application: "Anwendungen",
  infrastructure: "Infrastruktur",
  personnel: "Personal",
  physical: "Physische Assets",
};

const categoryDescriptions: Record<string, string> = {
  information: "Datenbestände, Datenbanken und vertrauliche Informationen im ISMS-Scope.",
  application: "Software und Applikationen, die im ISMS-Scope betrieben werden.",
  infrastructure: "IT-Infrastruktur, Server und Netzwerkkomponenten.",
  personnel: "Mitarbeiter und Verantwortliche im ISMS-Scope.",
  physical: "Standorte, Gebäude und physische Komponenten.",
};

interface AssetV2 {
  id: string;
  name: string;
  category: string;
  ciaScore: number;
  confidentiality: number;
  integrity: number;
  availability: number;
  dataClassification: string;
  replacementCost: number | null;
  status: string;
  createdAt: string;
  _count?: { risksV2: number };
}

function formatEUR(amount: number | null): string {
  if (!amount) return "—";
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(amount);
}

function getRiskLevelV2(score: number) {
  if (score >= 70) return { label: "Kritisch", color: "text-red-700", bg: "bg-red-100" };
  if (score >= 50) return { label: "Hoch", color: "text-orange-700", bg: "bg-orange-100" };
  if (score >= 25) return { label: "Mittel", color: "text-yellow-700", bg: "bg-yellow-100" };
  if (score >= 10) return { label: "Niedrig", color: "text-blue-700", bg: "bg-blue-100" };
  return { label: "Minimal", color: "text-green-700", bg: "bg-green-100" };
}

// Add Asset Modal for V2
function AddAssetV2Modal({
  isOpen,
  onClose,
  category,
  onAssetCreated,
}: {
  isOpen: boolean;
  onClose: () => void;
  category: string;
  onAssetCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/v2/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          category,
          dataClassification: "internal",
          status: "active",
        }),
      });
      if (res.ok) {
        setName("");
        setDescription("");
        onAssetCreated();
        onClose();
      } else {
        const errorData = await res.json().catch(() => ({ error: "Unknown error" }));
        alert("Fehler beim Erstellen des Assets: " + (errorData.error || "Unbekannter Fehler"));
      }
    } catch (error) {
      alert("Fehler: " + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Asset anlegen</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Asset Name *</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="z.B. Kundendatenbank" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Beschreibung</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Asset beschreiben..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kategorie</label>
            <Input value={categoryTitles[category] || category} disabled className="bg-gray-50" />
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Abbrechen</Button>
            <Button type="submit" className="flex-1 bg-[#0066FF] hover:bg-blue-700" disabled={loading || !name.trim()}>
              {loading ? "Erstelle..." : "Asset erstellen"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function RisksV2CategoryPage() {
  const { category } = useParams();
  const router = useRouter();
  const [activeView, setActiveView] = useState<"assets" | "risiken">("assets");
  const [riskTab, setRiskTab] = useState<"alle" | "massnahmen">("alle");
  const [assets, setAssets] = useState<AssetV2[]>([]);
  const [risks, setRisks] = useState<RiskV2Data[]>([]);
  const [selectedRisk, setSelectedRisk] = useState<RiskV2Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const catKey = category as string;
  const title = categoryTitles[catKey] || catKey;
  const description = categoryDescriptions[catKey] || "";

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/v2/assets?category=${catKey}`).then((r) => r.json()),
      fetch(`/api/v2/risks`).then((r) => r.json()),
    ])
      .then(([assetsData, risksData]) => {
        setAssets(Array.isArray(assetsData) ? assetsData : []);
        // Filter risks to this asset category
        const allRisks: RiskV2Data[] = Array.isArray(risksData) ? risksData : [];
        setRisks(allRisks.filter((r) => r.asset?.category === catKey));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [catKey]);

  const filteredAssets = assets.filter((a) =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredRisks = risks.filter((r) =>
    r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.asset?.name || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Risk stats
  const highRisks = risks.filter((r) => r.bruttoScore >= 50).length;
  const withControls = risks.filter((r) => {
    try { const c = r.mappedControls ? JSON.parse(r.mappedControls) : []; return c.length > 0; } catch { return false; }
  }).length;
  const nettoCalc = risks.filter((r) => r.nettoScore > 1 && r.nettoScore !== r.bruttoScore).length;

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/risks-v2" className="hover:text-gray-900">Risks & Assets V2</Link>
        <span className="text-gray-400">/</span>
        <span className="text-gray-900">{title}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
          <p className="text-sm text-gray-500 mt-1">{description}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="bg-white text-sm">
            Assets: {assets.length}
          </Button>
          <Button variant="outline" className="bg-white text-sm">
            Risiken: {risks.length}
          </Button>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        <button
          onClick={() => setActiveView("assets")}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
            activeView === "assets" ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-900"
          }`}
        >
          Assets ({assets.length})
        </button>
        <button
          onClick={() => setActiveView("risiken")}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
            activeView === "risiken" ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-900"
          }`}
        >
          Risiken ({risks.length})
        </button>
      </div>

      {/* Search + Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder={activeView === "assets" ? "Asset suchen..." : "Risiko suchen..."}
              className="pl-9 w-64 bg-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" className="bg-white">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </div>
        {activeView === "assets" && (
          <Button className="bg-[#0066FF] hover:bg-blue-700" onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Asset anlegen
          </Button>
        )}
      </div>

      {/* ── ASSETS VIEW ── */}
      {activeView === "assets" && (
        <>
          <div className="flex items-center px-4 py-2 text-sm text-gray-500 border-b">
            <div className="flex-1">Name</div>
            <div className="w-40">Erstellt</div>
            <div className="w-28">CIA Score</div>
            <div className="w-32">Klassifizierung</div>
            <div className="w-32">Wiederbeschaffung</div>
            <div className="w-16">Risiken</div>
            <div className="w-8" />
          </div>
          <div className="space-y-2">
            {filteredAssets.length === 0 ? (
              <div className="text-center py-16 text-gray-400 bg-white rounded-lg border border-gray-100">
                <Shield className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                <p>Noch keine Assets in dieser Kategorie</p>
                <Button className="mt-4 bg-[#0066FF]" onClick={() => setIsModalOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Asset anlegen
                </Button>
              </div>
            ) : (
              filteredAssets.map((asset) => (
                <div
                  key={asset.id}
                  onClick={() => router.push(`/risks-v2/assets/${asset.id}`)}
                  className="flex items-center px-4 py-3 bg-white rounded-lg border border-gray-100 hover:border-gray-200 hover:shadow-sm cursor-pointer transition-all"
                >
                  <div className="flex-1 text-gray-900 font-medium">{asset.name}</div>
                  <div className="w-40 text-sm text-gray-500">
                    {new Date(asset.createdAt).toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" })}
                  </div>
                  <div className="w-28">
                    {asset.ciaScore > 0 ? (
                      <span className={cn(
                        "px-3 py-1 rounded-full text-sm font-medium border",
                        asset.ciaScore >= 7 ? "bg-red-50 text-red-600 border-red-100" :
                        asset.ciaScore >= 5 ? "bg-orange-50 text-orange-600 border-orange-100" :
                        "bg-green-50 text-green-600 border-green-100"
                      )}>
                        {asset.ciaScore.toFixed(1)}
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-orange-50 text-orange-600 border border-orange-100">NA</span>
                    )}
                  </div>
                  <div className="w-32">
                    <Badge variant="outline" className="text-xs capitalize">{asset.dataClassification}</Badge>
                  </div>
                  <div className="w-32 text-sm text-gray-500">{formatEUR(asset.replacementCost)}</div>
                  <div className="w-16 text-sm text-gray-500">{asset._count?.risksV2 ?? 0}</div>
                  <div className="w-8">
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* ── RISIKEN VIEW ── */}
      {activeView === "risiken" && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Gesamt Risiken</span>
                <Shield className="h-4 w-4 text-gray-400" />
              </div>
              <p className="text-2xl font-bold text-gray-900 mt-2">{risks.length}</p>
              <p className="text-xs text-gray-400 mt-1">Aktive Risiken im System</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Hoch/Kritisch</span>
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              </div>
              <p className="text-2xl font-bold text-amber-600 mt-2">{highRisks}</p>
              <p className="text-xs text-gray-400 mt-1">Erfordern sofortige Aufmerksamkeit</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Mit Maßnahmen</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </div>
              <p className="text-2xl font-bold text-emerald-600 mt-2">{withControls}</p>
              <p className="text-xs text-gray-400 mt-1">{risks.length - withControls} ohne Maßnahmen</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Netto berechnet</span>
                <TrendingDown className="h-4 w-4 text-blue-500" />
              </div>
              <p className="text-2xl font-bold text-blue-600 mt-2">{nettoCalc}</p>
              <div className="flex items-center gap-1 mt-1">
                <Clock className="h-3 w-3 text-amber-500" />
                <p className="text-xs text-gray-400">{risks.length - nettoCalc} ausstehend</p>
              </div>
            </div>
          </div>

          {/* Risk Table */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="flex items-center border-b border-gray-200">
              <button
                onClick={() => setRiskTab("alle")}
                className={`flex items-center gap-2 px-5 py-4 text-sm font-medium border-b-2 transition-colors ${
                  riskTab === "alle" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-900"
                }`}
              >
                <Shield className="h-4 w-4" />
                Alle Risiken
              </button>
              <button
                onClick={() => setRiskTab("massnahmen")}
                className={`flex items-center gap-2 px-5 py-4 text-sm font-medium border-b-2 transition-colors ${
                  riskTab === "massnahmen" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-900"
                }`}
              >
                <CheckCircle2 className="h-4 w-4" />
                Maßnahmen & Berechnung
              </button>
              <div className="ml-auto pr-4">
                <span className="text-xs text-gray-400">{risks.length} Risiken</span>
              </div>
            </div>

            {risks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <Shield className="w-12 h-12 mb-4 text-gray-300" />
                <p className="text-lg">Keine Risiken in dieser Kategorie</p>
                <p className="text-sm mt-1">Assets anlegen und Risiken zuweisen, um sie hier zu sehen.</p>
              </div>
            ) : riskTab === "alle" ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="text-left p-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Risiko</th>
                      <th className="text-left p-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Asset</th>
                      <th className="text-left p-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">ALE</th>
                      <th className="text-right p-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Brutto</th>
                      <th className="text-right p-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Netto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRisks.map((risk) => {
                      const bruttoLevel = getRiskLevelV2(risk.bruttoScore);
                      const nettoLevel = getRiskLevelV2(risk.nettoScore);
                      const hasNetto = risk.nettoScore > 1 && risk.nettoScore !== risk.bruttoScore;
                      return (
                        <tr
                          key={risk.id}
                          className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() => setSelectedRisk(risk)}
                        >
                          <td className="p-3">
                            <span className="text-sm font-medium text-gray-900 truncate max-w-[220px] block">{risk.title}</span>
                          </td>
                          <td className="p-3">
                            <span className="text-sm text-blue-600">{risk.asset?.name || "—"}</span>
                          </td>
                          <td className="p-3 text-sm text-gray-600">
                            {risk.annualLossExpectancy ? formatEUR(risk.annualLossExpectancy) : "—"}
                          </td>
                          <td className="p-3 text-right">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${bruttoLevel.bg} ${bruttoLevel.color}`}>
                              {risk.bruttoScore}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            {hasNetto ? (
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${nettoLevel.bg} ${nettoLevel.color}`}>
                                {risk.nettoScore}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400">--</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="text-left p-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Risiko</th>
                      <th className="text-left p-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Asset</th>
                      <th className="text-center p-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Maßnahmen</th>
                      <th className="text-center p-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Berechnungsstatus</th>
                      <th className="text-right p-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Brutto</th>
                      <th className="text-right p-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Netto</th>
                      <th className="text-center p-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Reduktion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRisks.map((risk) => {
                      let controlCount = 0;
                      try { controlCount = risk.mappedControls ? JSON.parse(risk.mappedControls).length : 0; } catch { /* */ }
                      const hasNetto = risk.nettoScore > 1 && risk.nettoScore !== risk.bruttoScore;
                      const reduktion = hasNetto && risk.bruttoScore > 0
                        ? Math.round(((risk.bruttoScore - risk.nettoScore) / risk.bruttoScore) * 100)
                        : null;
                      const bruttoLevel = getRiskLevelV2(risk.bruttoScore);
                      const nettoLevel = getRiskLevelV2(risk.nettoScore);
                      return (
                        <tr
                          key={risk.id}
                          className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() => setSelectedRisk(risk)}
                        >
                          <td className="p-3">
                            <span className="text-sm font-medium text-gray-900 truncate max-w-[200px] block">{risk.title}</span>
                          </td>
                          <td className="p-3">
                            <span className="text-sm text-blue-600">{risk.asset?.name || "—"}</span>
                          </td>
                          <td className="p-3 text-center">
                            {controlCount === 0 ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                <AlertTriangle className="h-3 w-3" />Keine
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                                <CheckCircle2 className="h-3 w-3" />{controlCount} zugewiesen
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            {hasNetto ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                                <CheckCircle2 className="h-3 w-3" />Netto berechnet
                              </span>
                            ) : risk.bruttoScore > 1 ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                                <Clock className="h-3 w-3" />Nur Brutto
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                                <Clock className="h-3 w-3" />Nicht berechnet
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${bruttoLevel.bg} ${bruttoLevel.color}`}>
                              {risk.bruttoScore}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            {hasNetto ? (
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${nettoLevel.bg} ${nettoLevel.color}`}>
                                {risk.nettoScore}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400">--</span>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            {reduktion !== null ? (
                              <div className="flex items-center justify-center gap-2">
                                <div className="w-14 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                  <div className="h-full rounded-full bg-emerald-500" style={{ width: `${reduktion}%` }} />
                                </div>
                                <span className="text-xs font-medium text-emerald-700">-{reduktion}%</span>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">--</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Right-side detail panel */}
          {selectedRisk && (
            <RiskV2Panel
              risk={selectedRisk}
              onClose={() => setSelectedRisk(null)}
              onUpdate={(updated) => {
                setRisks((prev) => prev.map((r) => r.id === selectedRisk.id ? { ...r, ...updated } : r));
                setSelectedRisk((prev) => prev ? { ...prev, ...updated } : null);
              }}
              onDelete={async () => {
                await fetch(`/api/v2/risks/${selectedRisk.id}`, { method: "DELETE" });
                setRisks((prev) => prev.filter((r) => r.id !== selectedRisk.id));
                setSelectedRisk(null);
              }}
            />
          )}
        </>
      )}

      {/* Add Asset Modal */}
      <AddAssetV2Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        category={catKey}
        onAssetCreated={() => {
          fetch(`/api/v2/assets?category=${catKey}`)
            .then((r) => r.json())
            .then((data) => setAssets(Array.isArray(data) ? data : []));
        }}
      />
    </div>
  );
}
