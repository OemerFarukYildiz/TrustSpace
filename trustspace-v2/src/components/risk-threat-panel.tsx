"use client";

import { useState, useEffect } from "react";
import {
  X,
  Info,
  ShieldCheck,
  Calculator,
  History,
  Trash2,
  Shield,
  TrendingDown,
  Check,
  Search,
  ChevronRight,
} from "lucide-react";

type DetailTab = "informationen" | "massnahmen" | "berechnung" | "historie";

interface RiskThreatData {
  id: string;
  schadenStufe: number;
  wahrscheinlichkeitStufe: number;
  nettoSchadenStufe: number;
  nettoWahrscheinlichkeitStufe: number;
  schadenInEuro?: number | null;
  schadenklasse?: number | null;
  wahrscheinlichkeitV2?: number | null;
  nettoSchadenklasse?: number | null;
  nettoWahrscheinlichkeitV2?: number | null;
  v1BruttoScore: number;
  v1NettoScore: number;
  v2BruttoScore?: number | null;
  v2NettoScore?: number | null;
  controlsMapped: string;
  threatScenario: { code: string; name: string; description: string };
  createdAt: string;
  updatedAt: string;
}

interface Control {
  id: string;
  code: string;
  title: string;
  implementation: string | null;
  implementationPct: number;
}

interface Asset {
  id: string;
  name: string;
  ciaAverage: number;
  confidentiality: number;
  integrity: number;
  availability: number;
}

function getRiskLevel(score: number): { label: string; color: string; bg: string } {
  if (score >= 12) return { label: "Kritisch", color: "text-red-700", bg: "bg-red-100" };
  if (score >= 8) return { label: "Hoch", color: "text-orange-700", bg: "bg-orange-100" };
  if (score >= 4) return { label: "Mittel", color: "text-yellow-700", bg: "bg-yellow-100" };
  return { label: "Niedrig", color: "text-green-700", bg: "bg-green-100" };
}

const SCHADEN_LABELS: Record<number, string> = {
  1: "Vernachlässigbar",
  2: "Begrenzt",
  3: "Beträchtlich",
  4: "Existenzbedrohend",
};

const WAHRSCHEINLICHKEIT_LABELS: Record<number, string> = {
  1: "Sehr selten",
  2: "Selten",
  3: "Mittel",
  4: "Häufig",
};

export function RiskThreatDetailPanel({
  riskThreat,
  asset,
  onClose,
  onUpdate,
  onDelete,
}: {
  riskThreat: RiskThreatData;
  asset: Asset;
  onClose: () => void;
  onUpdate: (updated: Partial<RiskThreatData>) => void;
  onDelete: () => void;
}) {
  const [activeTab, setActiveTab] = useState<DetailTab>("informationen");
  const [controls, setControls] = useState<Control[]>([]);
  const [selectedControlIds, setSelectedControlIds] = useState<string[]>([]);
  const [controlSearch, setControlSearch] = useState("");
  const [allControls, setAllControls] = useState<Control[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // V1 local state
  const [schadenStufe, setSchadenStufe] = useState(riskThreat.schadenStufe);
  const [wahrscheinlichkeitStufe, setWahrscheinlichkeitStufe] = useState(riskThreat.wahrscheinlichkeitStufe);
  const [nettoSchadenStufe, setNettoSchadenStufe] = useState(riskThreat.nettoSchadenStufe);
  const [nettoWahrscheinlichkeitStufe, setNettoWahrscheinlichkeitStufe] = useState(riskThreat.nettoWahrscheinlichkeitStufe);
  const [schadenInEuro, setSchadenInEuro] = useState<string>(
    riskThreat.schadenInEuro != null ? String(riskThreat.schadenInEuro) : ""
  );

  useEffect(() => {
    // Load controls for mapping
    fetch("/api/controls")
      .then((r) => r.json())
      .then(setAllControls)
      .catch(console.error);

    // Parse currently mapped controls
    try {
      const ids = JSON.parse(riskThreat.controlsMapped);
      setSelectedControlIds(Array.isArray(ids) ? ids : []);
    } catch {
      setSelectedControlIds([]);
    }
  }, [riskThreat.id]);

  const ciaAverage = asset.ciaAverage;
  const v1BruttoScore = parseFloat((ciaAverage * schadenStufe * wahrscheinlichkeitStufe).toFixed(2));
  const v1NettoScore = parseFloat((ciaAverage * nettoSchadenStufe * nettoWahrscheinlichkeitStufe).toFixed(2));
  const v1MaxScore = ciaAverage > 0 ? parseFloat((ciaAverage * 4 * 4).toFixed(2)) : 16;

  const v1Reduktion = v1BruttoScore > 0
    ? Math.round(((v1BruttoScore - v1NettoScore) / v1BruttoScore) * 100)
    : 0;

  const mappedControls = allControls.filter((c) => selectedControlIds.includes(c.code));
  const filteredControls = allControls.filter((c) => {
    const q = controlSearch.toLowerCase();
    return !q || c.code.toLowerCase().includes(q) || c.title.toLowerCase().includes(q);
  });

  const bruttoLevel = getRiskLevel(Math.round(v1BruttoScore));
  const nettoLevel = getRiskLevel(Math.round(v1NettoScore));

  async function handleSaveCalculation() {
    setSaving(true);
    try {
      await fetch(`/api/risk-threats/${riskThreat.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schadenStufe,
          wahrscheinlichkeitStufe,
          nettoSchadenStufe,
          nettoWahrscheinlichkeitStufe,
          schadenInEuro: schadenInEuro ? parseFloat(schadenInEuro) : null,
        }),
      });
      onUpdate({
        schadenStufe,
        wahrscheinlichkeitStufe,
        nettoSchadenStufe,
        nettoWahrscheinlichkeitStufe,
        v1BruttoScore,
        v1NettoScore,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveControls() {
    setSaving(true);
    try {
      await fetch(`/api/risk-threats/${riskThreat.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mappedControls: JSON.stringify(selectedControlIds) }),
      });
      onUpdate({ controlsMapped: JSON.stringify(selectedControlIds) });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  function toggleControl(code: string) {
    setSelectedControlIds((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  }

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex justify-end">
      <div className="w-full max-w-2xl bg-white shadow-2xl border-l border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-base font-semibold text-gray-900">
              {riskThreat.threatScenario.code} – {riskThreat.threatScenario.name}
            </h2>
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${bruttoLevel.bg} ${bruttoLevel.color}`}>
                {v1BruttoScore.toFixed(2)}
              </span>
              <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-md text-gray-400">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>Asset:</span>
            <span className="font-medium text-blue-600">{asset.name}</span>
            <span className="ml-1">· CIA: {ciaAverage.toFixed(2)}</span>
            {saved && (
              <span className="ml-auto text-xs text-emerald-600 font-medium flex items-center gap-1">
                <Check className="h-3 w-3" /> Gespeichert
              </span>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {[
            { id: "informationen" as const, label: "Informationen", icon: Info },
            { id: "massnahmen" as const, label: `Maßnahmen (${selectedControlIds.length})`, icon: ShieldCheck },
            { id: "berechnung" as const, label: "Berechnung", icon: Calculator },
            { id: "historie" as const, label: "Historie", icon: History },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-900"
              }`}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* ── INFORMATIONEN ── */}
          {activeTab === "informationen" && (
            <>
              {/* Score cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Bruttorisiko (V1)</p>
                  <p className={`text-3xl font-bold ${bruttoLevel.color}`}>{v1BruttoScore.toFixed(2)}</p>
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${bruttoLevel.bg} ${bruttoLevel.color}`}>
                    {bruttoLevel.label}
                  </span>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Nettorisiko (V1)</p>
                  <p className={`text-3xl font-bold ${nettoLevel.color}`}>{v1NettoScore.toFixed(2)}</p>
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${nettoLevel.bg} ${nettoLevel.color}`}>
                    {nettoLevel.label}
                  </span>
                </div>
              </div>

              {/* Beschreibung */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Beschreibung</p>
                <p className="text-sm text-gray-700">
                  {riskThreat.threatScenario.description || "Keine Beschreibung vorhanden."}
                </p>
              </div>

              {/* CIA Details */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Schutzbedarf (CIA)</p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "Vertraulichkeit", value: asset.confidentiality },
                    { label: "Integrität", value: asset.integrity },
                    { label: "Verfügbarkeit", value: asset.availability },
                  ].map((item) => (
                    <div key={item.label} className="text-center">
                      <div className="text-lg font-bold text-gray-900">{item.value}</div>
                      <div className="text-xs text-gray-500">{item.label}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-2 pt-2 border-t border-gray-200 text-center">
                  <span className="text-sm text-gray-500">Durchschnitt: </span>
                  <span className="font-semibold text-gray-900">{ciaAverage.toFixed(2)}</span>
                </div>
              </div>

              {/* V1 Params */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-1">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">V1 Parameter</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">Schaden:</span>{" "}
                    <span className="font-medium">{schadenStufe} – {SCHADEN_LABELS[schadenStufe]}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Wahrscheinlichkeit:</span>{" "}
                    <span className="font-medium">{wahrscheinlichkeitStufe} – {WAHRSCHEINLICHKEIT_LABELS[wahrscheinlichkeitStufe]}</span>
                  </div>
                </div>
                {schadenInEuro && (
                  <div className="text-sm mt-1">
                    <span className="text-gray-500">Schaden in €:</span>{" "}
                    <span className="font-medium">{Number(schadenInEuro).toLocaleString("de-DE")} €</span>
                  </div>
                )}
              </div>

              {/* Delete */}
              <div className="pt-2">
                <button
                  onClick={onDelete}
                  className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Bedrohungsszenario entfernen
                </button>
              </div>
            </>
          )}

          {/* ── MASSNAHMEN ── */}
          {activeTab === "massnahmen" && (
            <>
              {/* Mapped Controls */}
              {mappedControls.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Zugewiesene Maßnahmen</p>
                  {mappedControls.map((ctrl) => (
                    <div key={ctrl.code} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded mr-2">{ctrl.code}</span>
                        <span className="text-sm text-gray-700">{ctrl.title}</span>
                      </div>
                      <div className="flex items-center gap-3 ml-3">
                        <span className="text-xs text-gray-500">{ctrl.implementationPct}%</span>
                        <div className="w-16 h-1.5 bg-gray-200 rounded-full">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${ctrl.implementationPct}%` }}
                          />
                        </div>
                        <button
                          onClick={() => toggleControl(ctrl.code)}
                          className="p-1 text-gray-400 hover:text-red-500"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {/* Avg Effectiveness */}
                  {mappedControls.length > 0 && (
                    <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-emerald-700 font-medium">Ø Implementierungsgrad</span>
                        <span className="text-xs font-bold text-emerald-700">
                          {Math.round(mappedControls.reduce((a, c) => a + c.implementationPct, 0) / mappedControls.length)}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-emerald-100 rounded-full">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{
                            width: `${Math.round(mappedControls.reduce((a, c) => a + c.implementationPct, 0) / mappedControls.length)}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Control Search */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Controls hinzufügen</p>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Control suchen..."
                    value={controlSearch}
                    onChange={(e) => setControlSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
                  {filteredControls.slice(0, 20).map((ctrl) => {
                    const selected = selectedControlIds.includes(ctrl.code);
                    return (
                      <button
                        key={ctrl.code}
                        onClick={() => toggleControl(ctrl.code)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                          selected ? "bg-blue-50" : "hover:bg-gray-50"
                        }`}
                      >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                          selected ? "bg-blue-600 border-blue-600" : "border-gray-300"
                        }`}>
                          {selected && <Check className="h-3 w-3 text-white" />}
                        </div>
                        <span className="text-xs font-mono text-gray-500 w-16 flex-shrink-0">{ctrl.code}</span>
                        <span className="text-sm text-gray-700 truncate">{ctrl.title}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={handleSaveControls}
                disabled={saving}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {saving ? "Speichern..." : "Maßnahmen speichern"}
              </button>
            </>
          )}

          {/* ── BERECHNUNG ── */}
          {activeTab === "berechnung" && (
            <>
              {/* V1 Berechnung */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <Calculator className="h-4 w-4 text-blue-600" />
                    V1 – Schutzbedarf-Methodik
                  </p>
                  <span className="text-xs text-gray-400">CIA × Schaden × Wahrscheinlichkeit</span>
                </div>

                {/* Brutto */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
                  <p className="text-xs font-medium text-gray-500 uppercase">Bruttorisiko</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Schaden (1–4)</label>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4].map((v) => (
                          <button
                            key={v}
                            onClick={() => setSchadenStufe(v)}
                            className={`flex-1 py-1.5 text-xs font-medium rounded border transition-colors ${
                              schadenStufe === v
                                ? "bg-blue-600 text-white border-blue-600"
                                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                            }`}
                          >
                            {v}
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{SCHADEN_LABELS[schadenStufe]}</p>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Wahrscheinlichkeit (1–4)</label>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4].map((v) => (
                          <button
                            key={v}
                            onClick={() => setWahrscheinlichkeitStufe(v)}
                            className={`flex-1 py-1.5 text-xs font-medium rounded border transition-colors ${
                              wahrscheinlichkeitStufe === v
                                ? "bg-blue-600 text-white border-blue-600"
                                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                            }`}
                          >
                            {v}
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{WAHRSCHEINLICHKEIT_LABELS[wahrscheinlichkeitStufe]}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                    <span className="text-xs text-gray-500">
                      {ciaAverage.toFixed(2)} × {schadenStufe} × {wahrscheinlichkeitStufe} =
                    </span>
                    <span className={`text-lg font-bold ${bruttoLevel.color}`}>{v1BruttoScore.toFixed(2)}</span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full h-2 bg-gray-200 rounded-full">
                    <div
                      className={`h-full rounded-full ${v1BruttoScore >= 12 ? "bg-red-500" : v1BruttoScore >= 8 ? "bg-orange-500" : v1BruttoScore >= 4 ? "bg-yellow-500" : "bg-green-500"}`}
                      style={{ width: `${Math.min((v1BruttoScore / v1MaxScore) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Netto */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
                  <p className="text-xs font-medium text-gray-500 uppercase">Nettorisiko (nach Maßnahmen)</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Schaden (1–4)</label>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4].map((v) => (
                          <button
                            key={v}
                            onClick={() => setNettoSchadenStufe(v)}
                            className={`flex-1 py-1.5 text-xs font-medium rounded border transition-colors ${
                              nettoSchadenStufe === v
                                ? "bg-emerald-600 text-white border-emerald-600"
                                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                            }`}
                          >
                            {v}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Wahrscheinlichkeit (1–4)</label>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4].map((v) => (
                          <button
                            key={v}
                            onClick={() => setNettoWahrscheinlichkeitStufe(v)}
                            className={`flex-1 py-1.5 text-xs font-medium rounded border transition-colors ${
                              nettoWahrscheinlichkeitStufe === v
                                ? "bg-emerald-600 text-white border-emerald-600"
                                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                            }`}
                          >
                            {v}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                    <span className="text-xs text-gray-500">
                      {ciaAverage.toFixed(2)} × {nettoSchadenStufe} × {nettoWahrscheinlichkeitStufe} =
                    </span>
                    <span className={`text-lg font-bold ${nettoLevel.color}`}>{v1NettoScore.toFixed(2)}</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{ width: `${Math.min((v1NettoScore / v1MaxScore) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Risikoreduktion */}
                {v1BruttoScore > 0 && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-emerald-600" />
                      <span className="text-sm font-medium text-emerald-700">Risikoreduktion</span>
                    </div>
                    <span className="text-lg font-bold text-emerald-700">-{v1Reduktion}%</span>
                  </div>
                )}

                {/* Monetärer Schaden (optional) */}
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Schadenshöhe in € (optional)</label>
                  <input
                    type="number"
                    value={schadenInEuro}
                    onChange={(e) => setSchadenInEuro(e.target.value)}
                    placeholder="z.B. 50000"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {schadenInEuro && parseFloat(schadenInEuro) > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      Erw. Schadenshöhe: <strong>{parseFloat(schadenInEuro).toLocaleString("de-DE", { style: "currency", currency: "EUR" })}</strong>
                    </p>
                  )}
                </div>
              </div>

              <button
                onClick={handleSaveCalculation}
                disabled={saving}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {saving ? "Speichern..." : "Berechnung speichern"}
              </button>
            </>
          )}

          {/* ── HISTORIE ── */}
          {activeTab === "historie" && (
            <div className="space-y-3">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Ereignisse</p>
              <div className="space-y-2">
                {[
                  {
                    label: "Bedrohungsszenario erstellt",
                    date: new Date(riskThreat.createdAt).toLocaleString("de-DE"),
                    color: "bg-blue-500",
                  },
                  {
                    label: "Zuletzt aktualisiert",
                    date: new Date(riskThreat.updatedAt).toLocaleString("de-DE"),
                    color: "bg-gray-400",
                  },
                ].map((event, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${event.color}`} />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{event.label}</p>
                      <p className="text-xs text-gray-400">{event.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
