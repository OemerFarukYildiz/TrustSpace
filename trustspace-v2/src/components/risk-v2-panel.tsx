"use client";

import { useState, useEffect } from "react";
import {
  X,
  Info,
  ShieldCheck,
  Calculator,
  History,
  Trash2,
  TrendingDown,
  Check,
  Search,
} from "lucide-react";

type DetailTab = "informationen" | "massnahmen" | "berechnung" | "historie";

export interface RiskV2Data {
  id: string;
  title: string;
  description: string | null;
  riskCategory: string | null;
  threatSource: string | null;
  bruttoProbability: number;
  bruttoImpact: number;
  bruttoScore: number;
  nettoProbability: number;
  nettoImpact: number;
  nettoScore: number;
  singleLossExpectancy: number | null;
  annualRateOccurrence: number | null;
  annualLossExpectancy: number | null;
  nettoSLE: number | null;
  nettoARO: number | null;
  nettoALE: number | null;
  riskTreatment: string | null;
  riskOwner: string | null;
  status: string;
  mappedControls: string | null;
  asset?: { id: string; name: string; category: string; ciaScore?: number } | null;
  createdAt: string;
  updatedAt: string;
}

interface Control {
  id: string;
  code: string;
  title: string;
  implementationPct: number;
}

const CATEGORY_LABELS: Record<string, string> = {
  operational: "Operativ",
  strategic: "Strategisch",
  compliance: "Compliance",
  financial: "Finanziell",
  technical: "Technisch",
};

const TREATMENT_LABELS: Record<string, string> = {
  mitigate: "Mindern",
  accept: "Akzeptieren",
  transfer: "Transferieren",
  avoid: "Vermeiden",
};

const STATUS_LABELS: Record<string, string> = {
  identified: "Identifiziert",
  assessed: "Bewertet",
  treated: "Behandelt",
  monitored: "Überwacht",
  closed: "Geschlossen",
};

function getRiskLevelV2(score: number) {
  if (score >= 70) return { label: "Kritisch", color: "text-red-700", bg: "bg-red-100" };
  if (score >= 50) return { label: "Hoch", color: "text-orange-700", bg: "bg-orange-100" };
  if (score >= 25) return { label: "Mittel", color: "text-yellow-700", bg: "bg-yellow-100" };
  if (score >= 10) return { label: "Niedrig", color: "text-blue-700", bg: "bg-blue-100" };
  return { label: "Minimal", color: "text-green-700", bg: "bg-green-100" };
}

function formatEUR(val: number | null): string {
  if (!val) return "—";
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(val);
}

export function RiskV2Panel({
  risk,
  onClose,
  onUpdate,
  onDelete,
}: {
  risk: RiskV2Data;
  onClose: () => void;
  onUpdate: (updated: Partial<RiskV2Data>) => void;
  onDelete: () => void;
}) {
  const [activeTab, setActiveTab] = useState<DetailTab>("informationen");
  const [allControls, setAllControls] = useState<Control[]>([]);
  const [selectedControlIds, setSelectedControlIds] = useState<string[]>([]);
  const [controlSearch, setControlSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Berechnung state
  const [sle, setSle] = useState<string>(risk.singleLossExpectancy != null ? String(risk.singleLossExpectancy) : "");
  const [aro, setAro] = useState<string>(risk.annualRateOccurrence != null ? String(risk.annualRateOccurrence) : "");
  const [nettoSle, setNettoSle] = useState<string>(risk.nettoSLE != null ? String(risk.nettoSLE) : "");
  const [nettoAro, setNettoAro] = useState<string>(risk.nettoARO != null ? String(risk.nettoARO) : "");

  useEffect(() => {
    fetch("/api/controls").then((r) => r.json()).then(setAllControls).catch(console.error);
    try {
      const ids = JSON.parse(risk.mappedControls || "[]");
      setSelectedControlIds(Array.isArray(ids) ? ids : []);
    } catch {
      setSelectedControlIds([]);
    }
  }, [risk.id]);

  const cia = Math.max(1, Math.min(3, Math.round(risk.asset?.ciaScore ?? 1)));
  const bruttoALE = parseFloat(sle) > 0 && parseFloat(aro) > 0
    ? parseFloat((cia * parseFloat(sle) * parseFloat(aro)).toFixed(2))
    : null;
  const calcNettoALE = parseFloat(nettoSle) > 0 && parseFloat(nettoAro) > 0
    ? parseFloat((cia * parseFloat(nettoSle) * parseFloat(nettoAro)).toFixed(2))
    : null;
  const reductionPct = bruttoALE && calcNettoALE && bruttoALE > 0
    ? Math.round(((bruttoALE - calcNettoALE) / bruttoALE) * 100)
    : 0;

  const mappedControls = allControls.filter((c) => selectedControlIds.includes(c.code));
  const filteredControls = allControls.filter((c) => {
    const q = controlSearch.toLowerCase();
    return !q || c.code.toLowerCase().includes(q) || c.title.toLowerCase().includes(q);
  });

  async function handleSaveCalculation() {
    setSaving(true);
    try {
      await fetch(`/api/v2/risks/${risk.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          singleLossExpectancy: sle ? parseFloat(sle) : null,
          annualRateOccurrence: aro ? parseFloat(aro) : null,
          annualLossExpectancy: bruttoALE,
          nettoSLE: nettoSle ? parseFloat(nettoSle) : null,
          nettoARO: nettoAro ? parseFloat(nettoAro) : null,
          nettoALE: calcNettoALE,
        }),
      });
      onUpdate({
        bruttoScore: bruttoALE ?? risk.bruttoScore,
        nettoScore: calcNettoALE ?? risk.nettoScore,
        singleLossExpectancy: sle ? parseFloat(sle) : null,
        annualRateOccurrence: aro ? parseFloat(aro) : null,
        annualLossExpectancy: bruttoALE,
        nettoSLE: nettoSle ? parseFloat(nettoSle) : null,
        nettoARO: nettoAro ? parseFloat(nettoAro) : null,
        nettoALE: calcNettoALE,
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
      await fetch(`/api/v2/risks/${risk.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mappedControls: JSON.stringify(selectedControlIds) }),
      });
      onUpdate({ mappedControls: JSON.stringify(selectedControlIds) });
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
            <h2 className="text-base font-semibold text-gray-900 truncate pr-4">{risk.title}</h2>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                {risk.bruttoScore > 0 ? formatEUR(risk.bruttoScore) : "—"}
              </span>
              <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-md text-gray-400">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            {risk.asset && <span className="font-medium text-blue-600">{risk.asset.name}</span>}
            {risk.riskCategory && (
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                {CATEGORY_LABELS[risk.riskCategory] || risk.riskCategory}
              </span>
            )}
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
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Brutto-ALE</p>
                  <p className="text-2xl font-bold text-red-600">{risk.bruttoScore > 0 ? formatEUR(risk.bruttoScore) : "—"}</p>
                  <p className="text-xs text-gray-400 mt-1">CIA {cia} × SLE × ARO</p>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Netto-ALE</p>
                  <p className="text-2xl font-bold text-emerald-600">{risk.nettoScore > 0 ? formatEUR(risk.nettoScore) : "—"}</p>
                  <p className="text-xs text-gray-400 mt-1">nach Maßnahmen</p>
                </div>
              </div>

              {/* Beschreibung */}
              {risk.description && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Beschreibung</p>
                  <p className="text-sm text-gray-700">{risk.description}</p>
                </div>
              )}

              {/* Meta */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Details</p>
                {[
                  { label: "Status", value: STATUS_LABELS[risk.status] || risk.status },
                  { label: "Behandlung", value: risk.riskTreatment ? TREATMENT_LABELS[risk.riskTreatment] || risk.riskTreatment : "—" },
                  { label: "Verantwortlich", value: risk.riskOwner || "—" },
                  { label: "Bedrohungsquelle", value: risk.threatSource || "—" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">{item.label}</span>
                    <span className="font-medium text-gray-900">{item.value}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <button
                  onClick={onDelete}
                  className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Risiko löschen
                </button>
              </div>
            </>
          )}

          {/* ── MASSNAHMEN ── */}
          {activeTab === "massnahmen" && (
            <>
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
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${ctrl.implementationPct}%` }} />
                        </div>
                        <button onClick={() => toggleControl(ctrl.code)} className="p-1 text-gray-400 hover:text-red-500">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
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
                          style={{ width: `${Math.round(mappedControls.reduce((a, c) => a + c.implementationPct, 0) / mappedControls.length)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

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
                        className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${selected ? "bg-blue-50" : "hover:bg-gray-50"}`}
                      >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${selected ? "bg-blue-600 border-blue-600" : "border-gray-300"}`}>
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
              {/* CIA (read-only from asset) */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-blue-700 uppercase tracking-wider">Schutzbedarf (CIA)</p>
                    <p className="text-xs text-blue-500 mt-0.5">Vom verknüpften Asset</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-700">{cia}</p>
                    <p className="text-xs text-blue-500">
                      {cia === 3 ? "Sehr hoch" : cia === 2 ? "Hoch" : "Normal"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Bruttorisiko */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
                <p className="text-xs font-medium text-gray-500 uppercase">Bruttorisiko</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Schadenshöhe / SLE (€)</label>
                    <input
                      type="number"
                      value={sle}
                      onChange={(e) => setSle(e.target.value)}
                      placeholder="z.B. 50000"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Eintrittshäufigkeit ARO</label>
                    <input
                      type="number"
                      step="0.01"
                      value={aro}
                      onChange={(e) => setAro(e.target.value)}
                      placeholder="z.B. 0.1 = 1×/10 Jahre"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">CIA × SLE × ARO = Brutto-ALE</p>
                  <p className="text-xs text-gray-400 mb-2">
                    {cia} × {sle || "—"} × {aro || "—"} =
                  </p>
                  <p className="text-xl font-bold text-red-600">{bruttoALE !== null ? formatEUR(bruttoALE) : "—"}</p>
                </div>
              </div>

              {/* Nettorisiko */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
                <p className="text-xs font-medium text-gray-500 uppercase">Nettorisiko (nach Maßnahmen)</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Netto Schadenshöhe / SLE (€)</label>
                    <input
                      type="number"
                      value={nettoSle}
                      onChange={(e) => setNettoSle(e.target.value)}
                      placeholder="z.B. 20000"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Netto ARO</label>
                    <input
                      type="number"
                      step="0.01"
                      value={nettoAro}
                      onChange={(e) => setNettoAro(e.target.value)}
                      placeholder="z.B. 0.05"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">CIA × Netto-SLE × Netto-ARO = Netto-ALE</p>
                  <p className="text-xs text-gray-400 mb-2">
                    {cia} × {nettoSle || "—"} × {nettoAro || "—"} =
                  </p>
                  <p className="text-xl font-bold text-emerald-600">{calcNettoALE !== null ? formatEUR(calcNettoALE) : "—"}</p>
                </div>
              </div>

              {/* Reduktion */}
              {bruttoALE !== null && calcNettoALE !== null && bruttoALE > 0 && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-emerald-600" />
                    <span className="text-sm font-medium text-emerald-700">Risikoreduktion</span>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-emerald-700">-{reductionPct}%</p>
                    <p className="text-xs text-emerald-500">{formatEUR(bruttoALE - calcNettoALE)} eingespart</p>
                  </div>
                </div>
              )}

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
                  { label: "Risiko erstellt", date: new Date(risk.createdAt).toLocaleString("de-DE"), color: "bg-blue-500" },
                  { label: "Zuletzt aktualisiert", date: new Date(risk.updatedAt).toLocaleString("de-DE"), color: "bg-gray-400" },
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
