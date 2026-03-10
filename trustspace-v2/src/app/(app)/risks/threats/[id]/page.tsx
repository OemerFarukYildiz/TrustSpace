"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Trash2,
  Loader2,
  AlertTriangle,
  ChevronRight,
  TrendingDown,
  Shield,
  Search,
  X,
  Check,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn, formatDate } from "@/lib/utils";

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

interface RiskThreatDetail {
  id: string;
  schadenStufe: number;
  wahrscheinlichkeitStufe: number;
  nettoSchadenStufe: number;
  nettoWahrscheinlichkeitStufe: number;
  schadenInEuro: number | null;
  v1BruttoScore: number;
  v1NettoScore: number;
  controlsMapped: string;
  riskTreatment: string | null;
  status: string | null;
  treatmentPlan: string | null;
  treatmentDeadline: string | null;
  riskOwner: string | null;
  threatScenario: {
    code: string;
    name: string;
    description: string;
    category: string;
  };
  asset: {
    id: string;
    name: string;
    category: string;
    ciaAverage: number;
    confidentiality: number;
    integrity: number;
    availability: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface ControlItem {
  id: string;
  code: string;
  title: string;
  implementationPct: number | null;
}

// ──────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────

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

const CATEGORY_LABELS: Record<string, string> = {
  process: "Prozesse",
  software: "Software",
  hardware: "Hardware",
  location: "Standorte",
  supplier: "Lieferanten",
};

function getRiskLevel(score: number) {
  if (score >= 12) return { label: "Kritisch", color: "text-red-700", bg: "bg-red-100", border: "border-red-200" };
  if (score >= 8) return { label: "Hoch", color: "text-orange-700", bg: "bg-orange-100", border: "border-orange-200" };
  if (score >= 4) return { label: "Mittel", color: "text-yellow-700", bg: "bg-yellow-100", border: "border-yellow-200" };
  return { label: "Niedrig", color: "text-green-700", bg: "bg-green-100", border: "border-green-200" };
}

// ──────────────────────────────────────────────
// Control Mapping Modal
// ──────────────────────────────────────────────

function ControlMappingModal({
  isOpen,
  onClose,
  selectedControls,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  selectedControls: string[];
  onSave: (controls: string[]) => void;
}) {
  const [controls, setControls] = useState<ControlItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set(selectedControls));
  const [filterCat, setFilterCat] = useState("all");

  useEffect(() => {
    if (isOpen) {
      setSelected(new Set(selectedControls));
      setLoading(true);
      fetch("/api/controls")
        .then((r) => r.json())
        .then(setControls)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  const categories = useMemo(() => {
    const cats = new Set(controls.map((c) => c.code.split(".")[0]));
    return Array.from(cats).sort();
  }, [controls]);

  const filtered = useMemo(() => {
    return controls.filter((c) => {
      if (search) {
        const q = search.toLowerCase();
        if (!c.code.toLowerCase().includes(q) && !c.title.toLowerCase().includes(q)) return false;
      }
      if (filterCat !== "all" && !c.code.startsWith(filterCat)) return false;
      return true;
    });
  }, [controls, search, filterCat]);

  const toggle = (code: string) => {
    const next = new Set(selected);
    if (next.has(code)) next.delete(code);
    else next.add(code);
    setSelected(next);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-[#0066FF]" />
            Maßnahmen zuordnen
          </DialogTitle>
          <p className="text-xs text-gray-500">{selected.size} ausgewählt</p>
        </DialogHeader>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <Input
              placeholder="Suche..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-xs"
            />
          </div>
          <select
            value={filterCat}
            onChange={(e) => setFilterCat(e.target.value)}
            className="h-8 text-xs border border-gray-200 rounded-md px-2"
          >
            <option value="all">Alle</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        <div className="flex-1 overflow-y-auto min-h-0 border rounded-lg divide-y">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-sm text-gray-400">Keine Maßnahmen gefunden</div>
          ) : (
            filtered.map((ctrl) => {
              const isSelected = selected.has(ctrl.code);
              return (
                <button
                  key={ctrl.id}
                  onClick={() => toggle(ctrl.code)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors",
                    isSelected ? "bg-blue-50 hover:bg-blue-100" : "hover:bg-gray-50"
                  )}
                >
                  <div className={cn(
                    "flex items-center justify-center h-5 w-5 rounded border-2 flex-shrink-0",
                    isSelected ? "bg-[#0066FF] border-[#0066FF] text-white" : "border-gray-300 bg-white"
                  )}>
                    {isSelected && <Check className="h-3 w-3" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-mono font-semibold text-gray-700">{ctrl.code}</span>
                    <p className="text-xs text-gray-500 truncate">{ctrl.title}</p>
                  </div>
                </button>
              );
            })
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>Abbrechen</Button>
          <Button size="sm" className="bg-[#0066FF] hover:bg-blue-700" onClick={() => { onSave(Array.from(selected)); onClose(); }}>
            <Check className="h-4 w-4 mr-1" />
            {selected.size} Maßnahmen speichern
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ──────────────────────────────────────────────
// Score Button Row (1-4)
// ──────────────────────────────────────────────

function ScoreButtons({
  value,
  onChange,
  labels,
  variant = "brutto",
}: {
  value: number;
  onChange: (v: number) => void;
  labels: Record<number, string>;
  variant?: "brutto" | "netto";
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex gap-1.5">
        {[1, 2, 3, 4].map((v) => {
          const isActive = value === v;
          const activeColor = variant === "netto"
            ? "bg-emerald-600 text-white border-emerald-600"
            : "bg-blue-600 text-white border-blue-600";
          return (
            <button
              key={v}
              onClick={() => onChange(v)}
              className={cn(
                "flex-1 py-2 rounded-lg border text-sm font-semibold transition-colors",
                isActive ? activeColor : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              )}
            >
              {v}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-gray-400">{labels[value]}</p>
    </div>
  );
}

// ──────────────────────────────────────────────
// Main Page
// ──────────────────────────────────────────────

export default function ThreatDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [threat, setThreat] = useState<RiskThreatDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [controlModalOpen, setControlModalOpen] = useState(false);

  // Calculation state
  const [schadenStufe, setSchadenStufe] = useState(1);
  const [wahrscheinlichkeitStufe, setWahrscheinlichkeitStufe] = useState(1);
  const [nettoSchadenStufe, setNettoSchadenStufe] = useState(1);
  const [nettoWahrscheinlichkeitStufe, setNettoWahrscheinlichkeitStufe] = useState(1);
  const [schadenInEuro, setSchadenInEuro] = useState("");
  const [mappedControls, setMappedControls] = useState<string[]>([]);
  // Risikobehandlung state
  const [riskTreatment, setRiskTreatment] = useState("");
  const [riskStatus, setRiskStatus] = useState("");
  const [treatmentPlan, setTreatmentPlan] = useState("");
  const [treatmentDeadline, setTreatmentDeadline] = useState("");
  const [riskOwner, setRiskOwner] = useState("");

  // Computed scores
  const cia = threat?.asset?.ciaAverage ?? 1;
  const bruttoScore = parseFloat((cia * schadenStufe * wahrscheinlichkeitStufe).toFixed(2));
  const nettoScore = parseFloat((cia * nettoSchadenStufe * nettoWahrscheinlichkeitStufe).toFixed(2));
  const maxScore = cia > 0 ? parseFloat((cia * 4 * 4).toFixed(2)) : 16;
  const reductionPct = bruttoScore > 0
    ? Math.round(((bruttoScore - nettoScore) / bruttoScore) * 100)
    : 0;

  const bruttoLevel = getRiskLevel(bruttoScore);
  const nettoLevel = getRiskLevel(nettoScore);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/risk-threats/${id}`)
      .then(async (r) => {
        if (!r.ok) throw new Error(r.status === 404 ? "not_found" : "error");
        return r.json();
      })
      .then((data: RiskThreatDetail) => {
        setThreat(data);
        setSchadenStufe(data.schadenStufe || 1);
        setWahrscheinlichkeitStufe(data.wahrscheinlichkeitStufe || 1);
        setNettoSchadenStufe(data.nettoSchadenStufe || 1);
        setNettoWahrscheinlichkeitStufe(data.nettoWahrscheinlichkeitStufe || 1);
        setSchadenInEuro(data.schadenInEuro != null ? String(data.schadenInEuro) : "");
        try {
          const mc = JSON.parse(data.controlsMapped || "[]");
          setMappedControls(Array.isArray(mc) ? mc : []);
        } catch {
          setMappedControls([]);
        }
        setRiskTreatment(data.riskTreatment || "");
        setRiskStatus(data.status || "");
        setTreatmentPlan(data.treatmentPlan || "");
        setTreatmentDeadline(
          data.treatmentDeadline ? data.treatmentDeadline.substring(0, 10) : ""
        );
        setRiskOwner(data.riskOwner || "");
      })
      .catch((e) => setError(e.message === "not_found" ? "Bedrohungsszenario nicht gefunden." : "Fehler beim Laden."))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/risk-threats/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schadenStufe,
          wahrscheinlichkeitStufe,
          nettoSchadenStufe,
          nettoWahrscheinlichkeitStufe,
          schadenInEuro: schadenInEuro ? parseFloat(schadenInEuro) : null,
          mappedControls: JSON.stringify(mappedControls),
          riskTreatment: riskTreatment || null,
          status: riskStatus || null,
          treatmentPlan: treatmentPlan || null,
          treatmentDeadline: treatmentDeadline || null,
          riskOwner: riskOwner || null,
        }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setThreat((prev) => prev ? { ...prev, ...updated } : prev);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      alert("Fehler beim Speichern.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Bedrohungsszenario wirklich entfernen?")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/risk-threats/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      router.push(threat?.asset ? `/risks/${threat.asset.id}` : "/risks");
    } catch {
      alert("Fehler beim Löschen.");
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#0066FF]" />
      </div>
    );
  }

  if (error || !threat) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-3">
        <AlertTriangle className="h-10 w-10 text-red-400" />
        <p className="text-sm text-red-600">{error || "Nicht gefunden."}</p>
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Zurück
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/risks" className="hover:text-gray-700 transition-colors">Risk & Asset Management</Link>
        <ChevronRight className="h-4 w-4" />
        <Link href={`/risks/${threat.asset.id}`} className="hover:text-gray-700 transition-colors">
          {threat.asset.name}
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-gray-900 font-medium truncate max-w-xs">
          {threat.threatScenario.code} – {threat.threatScenario.name}
        </span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => router.push(`/risks/${threat.asset.id}`)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Zurück
        </Button>
        <div className="flex items-center gap-2">
          {saved && (
            <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
              <Check className="h-3 w-3" /> Gespeichert
            </span>
          )}
          <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleting}>
            {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
            Entfernen
          </Button>
          <Button className="bg-[#0066FF] hover:bg-blue-700" size="sm" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Speichern
          </Button>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left Column */}
        <div className="col-span-7 space-y-6">
          {/* Scenario Info */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm bg-gray-100 text-gray-700 px-2 py-1 rounded">
                  {threat.threatScenario.code}
                </span>
                <CardTitle className="text-base font-semibold">
                  {threat.threatScenario.name}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {threat.threatScenario.description && (
                <p className="text-sm text-gray-600 leading-relaxed">
                  {threat.threatScenario.description}
                </p>
              )}
              <div className="flex items-center gap-2 pt-1">
                <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                  {threat.threatScenario.category}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Maßnahmen */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Shield className="h-4 w-4 text-[#0066FF]" />
                  Zugeordnete Maßnahmen ({mappedControls.length})
                </CardTitle>
                <Button variant="outline" size="sm" onClick={() => setControlModalOpen(true)}>
                  <Shield className="h-3.5 w-3.5 mr-1.5" />
                  Maßnahmen zuordnen
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {mappedControls.length === 0 ? (
                <div className="text-center py-6 text-gray-400">
                  <Shield className="h-8 w-8 mx-auto mb-2 text-gray-200" />
                  <p className="text-sm">Keine Maßnahmen zugeordnet</p>
                  <button
                    onClick={() => setControlModalOpen(true)}
                    className="text-[#0066FF] hover:underline mt-1 text-xs"
                  >
                    Jetzt hinzufügen
                  </button>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {mappedControls.map((code) => (
                    <Badge
                      key={code}
                      variant="outline"
                      className="pl-2 pr-1 py-1 gap-1 text-xs font-mono bg-blue-50 border-blue-200 text-blue-800"
                    >
                      {code}
                      <button
                        onClick={() => setMappedControls((prev) => prev.filter((c) => c !== code))}
                        className="ml-1 rounded-full p-0.5 hover:bg-blue-200"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Risikobehandlung */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-purple-500" />
                Risikobehandlung
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Behandlungsstrategie</label>
                  <select
                    value={riskTreatment}
                    onChange={(e) => setRiskTreatment(e.target.value)}
                    className="w-full h-9 text-sm border border-gray-200 rounded-md px-2 bg-white"
                  >
                    <option value="">Nicht festgelegt</option>
                    <option value="mitigate">Mitigieren</option>
                    <option value="transfer">Transferieren</option>
                    <option value="avoid">Vermeiden</option>
                    <option value="accept">Akzeptieren</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Status</label>
                  <select
                    value={riskStatus}
                    onChange={(e) => setRiskStatus(e.target.value)}
                    className="w-full h-9 text-sm border border-gray-200 rounded-md px-2 bg-white"
                  >
                    <option value="">Nicht festgelegt</option>
                    <option value="identified">Identifiziert</option>
                    <option value="assessed">Bewertet</option>
                    <option value="treated">In Behandlung</option>
                    <option value="accepted">Akzeptiert</option>
                    <option value="closed">Geschlossen</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Behandlungsplan</label>
                <textarea
                  value={treatmentPlan}
                  onChange={(e) => setTreatmentPlan(e.target.value)}
                  placeholder="Beschreiben Sie die geplanten Maßnahmen zur Risikobehandlung..."
                  rows={3}
                  className="w-full text-sm border border-gray-200 rounded-md px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-blue-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Behandlungsfrist</label>
                  <Input
                    type="date"
                    value={treatmentDeadline}
                    onChange={(e) => setTreatmentDeadline(e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Risikoinhaber</label>
                  <Input
                    type="text"
                    value={riskOwner}
                    onChange={(e) => setRiskOwner(e.target.value)}
                    placeholder="z.B. Max Mustermann"
                    className="h-9 text-sm"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Asset Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Zugeordnetes Asset</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4">
                <div>
                  <p className="text-sm font-medium text-gray-900">{threat.asset.name}</p>
                  <p className="text-xs text-gray-500">
                    {CATEGORY_LABELS[threat.asset.category] || threat.asset.category} · CIA Ø {threat.asset.ciaAverage.toFixed(2)}
                  </p>
                </div>
                <Link href={`/risks/${threat.asset.id}`}>
                  <Button variant="outline" size="sm">
                    Öffnen <ChevronRight className="ml-1 h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Optionaler monetärer Schaden */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Info className="h-4 w-4 text-gray-400" />
                Monetärer Schaden (optional)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  value={schadenInEuro}
                  onChange={(e) => setSchadenInEuro(e.target.value)}
                  placeholder="z.B. 50000"
                  className="flex-1"
                />
                <span className="text-sm text-gray-500 flex-shrink-0">€</span>
              </div>
              {schadenInEuro && parseFloat(schadenInEuro) > 0 && (
                <p className="text-xs text-gray-500 mt-2">
                  Erwarteter Schaden:{" "}
                  <strong>
                    {parseFloat(schadenInEuro).toLocaleString("de-DE", { style: "currency", currency: "EUR" })}
                  </strong>
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column — Risikoberechnung */}
        <div className="col-span-5 space-y-4">
          {/* CIA Card (read-only) */}
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Schutzbedarf (CIA)</p>
                  <p className="text-xs text-blue-500 mt-0.5">Vom Asset · Skala 1–3</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-blue-700">{cia.toFixed(2)}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 border-t border-blue-200 pt-3">
                {[
                  { label: "Vertraulichkeit", value: threat.asset.confidentiality },
                  { label: "Integrität", value: threat.asset.integrity },
                  { label: "Verfügbarkeit", value: threat.asset.availability },
                ].map((item) => (
                  <div key={item.label} className="text-center">
                    <p className="text-lg font-bold text-blue-700">{item.value}</p>
                    <p className="text-[10px] text-blue-500">{item.label}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Bruttorisiko */}
          <Card>
            <CardHeader className="pb-3 bg-gradient-to-b from-red-50 to-white border-b border-red-100">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">Brutto-Risiko</CardTitle>
                <div className="flex items-center gap-2">
                  <span className={cn("text-lg font-bold", bruttoLevel.color)}>{bruttoScore.toFixed(2)}</span>
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", bruttoLevel.bg, bruttoLevel.color)}>
                    {bruttoLevel.label}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div>
                <p className="text-xs text-gray-500 mb-1.5">Schaden (1–4)</p>
                <ScoreButtons value={schadenStufe} onChange={setSchadenStufe} labels={SCHADEN_LABELS} variant="brutto" />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1.5">Wahrscheinlichkeit (1–4)</p>
                <ScoreButtons value={wahrscheinlichkeitStufe} onChange={setWahrscheinlichkeitStufe} labels={WAHRSCHEINLICHKEIT_LABELS} variant="brutto" />
              </div>
              <div className="bg-red-50 border border-red-100 rounded-lg p-3">
                <p className="text-[10px] text-gray-400 mb-1">
                  CIA ({cia.toFixed(2)}) × Schaden ({schadenStufe}) × Wahrsch. ({wahrscheinlichkeitStufe}) =
                </p>
                <p className={cn("text-xl font-bold", bruttoLevel.color)}>{bruttoScore.toFixed(2)}</p>
                <div className="mt-2 w-full h-2 bg-red-100 rounded-full">
                  <div
                    className="h-full rounded-full bg-red-400"
                    style={{ width: `${Math.min((bruttoScore / maxScore) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Nettorisiko */}
          <Card>
            <CardHeader className="pb-3 bg-gradient-to-b from-emerald-50 to-white border-b border-emerald-100">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">Netto-Risiko</CardTitle>
                <div className="flex items-center gap-2">
                  <span className={cn("text-lg font-bold", nettoLevel.color)}>{nettoScore.toFixed(2)}</span>
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", nettoLevel.bg, nettoLevel.color)}>
                    {nettoLevel.label}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div>
                <p className="text-xs text-gray-500 mb-1.5">Netto-Schaden (1–4)</p>
                <ScoreButtons value={nettoSchadenStufe} onChange={setNettoSchadenStufe} labels={SCHADEN_LABELS} variant="netto" />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1.5">Netto-Wahrscheinlichkeit (1–4)</p>
                <ScoreButtons value={nettoWahrscheinlichkeitStufe} onChange={setNettoWahrscheinlichkeitStufe} labels={WAHRSCHEINLICHKEIT_LABELS} variant="netto" />
              </div>
              <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3">
                <p className="text-[10px] text-gray-400 mb-1">
                  CIA ({cia.toFixed(2)}) × Schaden ({nettoSchadenStufe}) × Wahrsch. ({nettoWahrscheinlichkeitStufe}) =
                </p>
                <p className={cn("text-xl font-bold", nettoLevel.color)}>{nettoScore.toFixed(2)}</p>
                <div className="mt-2 w-full h-2 bg-emerald-100 rounded-full">
                  <div
                    className="h-full rounded-full bg-emerald-400"
                    style={{ width: `${Math.min((nettoScore / maxScore) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Risikoreduktion */}
          {bruttoScore > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-green-600" />
                  Risikoreduktion
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Bruttorisiko</span>
                  <span className={cn("font-semibold", bruttoLevel.color)}>{bruttoScore.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Nettorisiko</span>
                  <span className={cn("font-semibold", nettoLevel.color)}>{nettoScore.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between border-t pt-2">
                  <span className="text-xs font-medium text-gray-700">Reduktion</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] bg-green-50 text-green-700 border-green-200">
                      -{reductionPct}%
                    </Badge>
                    <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-emerald-500" style={{ width: `${reductionPct}%` }} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Metadata */}
          <Card>
            <CardContent className="pt-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Erstellt am</span>
                <span className="text-gray-700">{formatDate(threat.createdAt)}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Aktualisiert am</span>
                <span className="text-gray-700">{formatDate(threat.updatedAt)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <ControlMappingModal
        isOpen={controlModalOpen}
        onClose={() => setControlModalOpen(false)}
        selectedControls={mappedControls}
        onSave={setMappedControls}
      />
    </div>
  );
}
