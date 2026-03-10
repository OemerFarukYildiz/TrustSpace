"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn, formatEUR, formatDate } from "@/lib/utils";

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

interface V2RiskDetail {
  id: string;
  title: string;
  description: string | null;
  riskCategory: string;
  threatSource: string | null;
  vulnerability: string | null;
  bruttoProbability: number;
  bruttoImpact: number;
  bruttoScore: number;
  singleLossExpectancy: number | null;
  annualRateOccurrence: number | null;
  annualLossExpectancy: number | null;
  nettoProbability: number;
  nettoImpact: number;
  nettoScore: number;
  nettoSLE: number | null;
  nettoARO: number | null;
  nettoALE: number | null;
  riskTreatment: string;
  riskOwner: string | null;
  treatmentPlan: string | null;
  treatmentDeadline: string | null;
  status: string;
  mappedControls: string | null;
  assetId: string | null;
  asset?: {
    id: string;
    name: string;
    category: string;
    ciaScore: number;
    confidentiality: number;
    integrity: number;
    availability: number;
  } | null;
  createdAt: string;
  updatedAt: string;
}

interface ControlItem {
  id: string;
  code: string;
  title: string;
  status: string;
  implementationPct: number | null;
}

// ──────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────

const CATEGORY_OPTIONS = [
  { value: "operational", label: "Operativ" },
  { value: "strategic", label: "Strategisch" },
  { value: "compliance", label: "Compliance" },
  { value: "financial", label: "Finanziell" },
  { value: "technical", label: "Technisch" },
  { value: "environmental", label: "Umwelt" },
];

const THREAT_SOURCE_OPTIONS = [
  { value: "internal", label: "Intern" },
  { value: "external", label: "Extern" },
  { value: "environmental", label: "Umweltbedingt" },
];

const STATUS_OPTIONS = [
  { value: "identified", label: "Identifiziert" },
  { value: "assessed", label: "Bewertet" },
  { value: "treated", label: "Behandelt" },
  { value: "accepted", label: "Akzeptiert" },
  { value: "closed", label: "Geschlossen" },
];

const TREATMENT_OPTIONS = [
  { value: "mitigate", label: "Mitigieren" },
  { value: "transfer", label: "Transferieren" },
  { value: "avoid", label: "Vermeiden" },
  { value: "accept", label: "Akzeptieren" },
];

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
  const [selected, setSelected] = useState<Set<string>>(
    new Set(selectedControls)
  );
  const [filterCat, setFilterCat] = useState("all");

  useEffect(() => {
    if (isOpen) {
      setSelected(new Set(selectedControls));
      loadControls();
    }
  }, [isOpen]);

  const loadControls = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/controls");
      if (res.ok) {
        const data = await res.json();
        setControls(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggle = (code: string) => {
    const next = new Set(selected);
    if (next.has(code)) next.delete(code);
    else next.add(code);
    setSelected(next);
  };

  const categories = useMemo(() => {
    const cats = new Set(controls.map((c) => c.code.split(".")[0]));
    return Array.from(cats).sort();
  }, [controls]);

  const filtered = useMemo(() => {
    return controls.filter((c) => {
      if (search) {
        const q = search.toLowerCase();
        if (
          !c.code.toLowerCase().includes(q) &&
          !c.title.toLowerCase().includes(q)
        )
          return false;
      }
      if (filterCat !== "all" && !c.code.startsWith(filterCat)) return false;
      return true;
    });
  }, [controls, search, filterCat]);

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-[#0066FF]" />
            Maßnahmen zuordnen
          </DialogTitle>
          <p className="text-xs text-gray-500">
            {selected.size} Maßnahmen ausgewählt
          </p>
        </DialogHeader>

        {/* Search + Filter */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <Input
              placeholder="Suche nach Code oder Titel..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-xs"
            />
          </div>
          <Select value={filterCat} onValueChange={setFilterCat}>
            <SelectTrigger className="w-[120px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Controls list */}
        <div className="flex-1 overflow-y-auto min-h-0 border rounded-lg divide-y">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-sm text-gray-400">
              Keine Maßnahmen gefunden
            </div>
          ) : (
            filtered.map((ctrl) => {
              const isSelected = selected.has(ctrl.code);
              return (
                <button
                  key={ctrl.id}
                  onClick={() => toggle(ctrl.code)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors",
                    isSelected
                      ? "bg-blue-50 hover:bg-blue-100"
                      : "hover:bg-gray-50"
                  )}
                >
                  <div
                    className={cn(
                      "flex items-center justify-center h-5 w-5 rounded border-2 flex-shrink-0 transition-colors",
                      isSelected
                        ? "bg-[#0066FF] border-[#0066FF] text-white"
                        : "border-gray-300 bg-white"
                    )}
                  >
                    {isSelected && <Check className="h-3 w-3" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-semibold text-gray-700">
                        {ctrl.code}
                      </span>
                      {ctrl.implementationPct != null && (
                        <span className="text-[10px] text-gray-400">
                          {ctrl.implementationPct}%
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 truncate">
                      {ctrl.title}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Abbrechen
          </Button>
          <Button
            size="sm"
            className="bg-[#0066FF] hover:bg-blue-700"
            onClick={() => {
              onSave(Array.from(selected));
              onClose();
            }}
          >
            <Check className="h-4 w-4 mr-1" />
            {selected.size} Maßnahmen speichern
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ──────────────────────────────────────────────
// Main Page Component
// ──────────────────────────────────────────────

export default function RiskV2DetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [risk, setRisk] = useState<V2RiskDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [controlModalOpen, setControlModalOpen] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [riskCategory, setRiskCategory] = useState("operational");
  const [threatSource, setThreatSource] = useState("external");
  const [vulnerability, setVulnerability] = useState("");
  const [treatmentPlan, setTreatmentPlan] = useState("");
  const [treatmentDeadline, setTreatmentDeadline] = useState("");
  const [riskTreatment, setRiskTreatment] = useState("mitigate");
  const [status, setStatus] = useState("identified");

  // Calculation state
  const [sle, setSle] = useState<string>("");
  const [aro, setAro] = useState<string>("");
  const [nettoSle, setNettoSle] = useState<string>("");
  const [nettoAro, setNettoAro] = useState<string>("");

  // Mapped controls
  const [mappedControls, setMappedControls] = useState<string[]>([]);

  // Derived CIA from asset (capped 1-3)
  const cia = useMemo(() => {
    if (!risk?.asset?.ciaScore) return 1;
    return Math.max(1, Math.min(3, Math.round(risk.asset.ciaScore)));
  }, [risk]);

  // Computed ALE values
  const bruttoALE = useMemo(() => {
    const s = parseFloat(sle);
    const a = parseFloat(aro);
    if (s > 0 && a > 0) return parseFloat((cia * s * a).toFixed(2));
    return null;
  }, [cia, sle, aro]);

  const nettoALE = useMemo(() => {
    const s = parseFloat(nettoSle);
    const a = parseFloat(nettoAro);
    if (s > 0 && a > 0) return parseFloat((cia * s * a).toFixed(2));
    return null;
  }, [cia, nettoSle, nettoAro]);

  const reductionPct = useMemo(() => {
    if (bruttoALE && nettoALE && bruttoALE > 0) {
      return Math.round(((bruttoALE - nettoALE) / bruttoALE) * 100);
    }
    return null;
  }, [bruttoALE, nettoALE]);

  // Fetch risk
  useEffect(() => {
    const fetchRisk = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/v2/risks/${id}`);
        if (!res.ok) {
          if (res.status === 404) {
            setError("Risiko nicht gefunden.");
            return;
          }
          throw new Error("Fehler beim Laden");
        }
        const data: V2RiskDetail = await res.json();
        setRisk(data);

        // Populate form
        setTitle(data.title);
        setDescription(data.description || "");
        setRiskCategory(data.riskCategory);
        setThreatSource(data.threatSource || "external");
        setVulnerability(data.vulnerability || "");
        setTreatmentPlan(data.treatmentPlan || "");
        setTreatmentDeadline(
          data.treatmentDeadline
            ? new Date(data.treatmentDeadline).toISOString().split("T")[0]
            : ""
        );
        setRiskTreatment(data.riskTreatment);
        setStatus(data.status);

        setSle(data.singleLossExpectancy != null ? String(data.singleLossExpectancy) : "");
        setAro(data.annualRateOccurrence != null ? String(data.annualRateOccurrence) : "");
        setNettoSle(data.nettoSLE != null ? String(data.nettoSLE) : "");
        setNettoAro(data.nettoARO != null ? String(data.nettoARO) : "");

        // Parse mapped controls
        try {
          const mc = data.mappedControls
            ? JSON.parse(data.mappedControls)
            : [];
          setMappedControls(Array.isArray(mc) ? mc : []);
        } catch {
          setMappedControls([]);
        }
      } catch (err) {
        console.error(err);
        setError("Daten konnten nicht geladen werden.");
      } finally {
        setLoading(false);
      }
    };
    fetchRisk();
  }, [id]);

  // Save
  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/v2/risks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          riskCategory,
          threatSource,
          vulnerability,
          treatmentPlan,
          treatmentDeadline: treatmentDeadline || null,
          riskTreatment,
          status,
          singleLossExpectancy: sle ? parseFloat(sle) : null,
          annualRateOccurrence: aro ? parseFloat(aro) : null,
          nettoSLE: nettoSle ? parseFloat(nettoSle) : null,
          nettoARO: nettoAro ? parseFloat(nettoAro) : null,
          mappedControls,
        }),
      });
      if (!res.ok) throw new Error("Speichern fehlgeschlagen");
      const updated = await res.json();
      setRisk(updated);
    } catch (err) {
      console.error(err);
      alert("Fehler beim Speichern.");
    } finally {
      setSaving(false);
    }
  };

  // Delete
  const handleDelete = async () => {
    if (!confirm("Risiko wirklich löschen?")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/v2/risks/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Löschen fehlgeschlagen");
      router.push("/risks-v2");
    } catch (err) {
      console.error(err);
      alert("Fehler beim Löschen.");
      setDeleting(false);
    }
  };

  const removeControl = (code: string) => {
    setMappedControls((prev) => prev.filter((c) => c !== code));
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#0066FF]" />
      </div>
    );
  }

  if (error || !risk) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-3">
        <AlertTriangle className="h-10 w-10 text-red-400" />
        <p className="text-sm text-red-600">
          {error || "Risiko nicht gefunden."}
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/risks-v2")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Zurück
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/risks-v2" className="hover:text-gray-700 transition-colors">
          Risks & Assets v2
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-gray-900 font-medium truncate max-w-xs">
          {title}
        </span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => router.push("/risks-v2")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Zurück
        </Button>
        <div className="flex items-center gap-2">
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="mr-2 h-4 w-4" />
            )}
            Löschen
          </Button>
          <Button
            className="bg-[#0066FF] hover:bg-blue-700"
            size="sm"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Speichern
          </Button>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left Column */}
        <div className="col-span-7 space-y-6">
          {/* Basic Info Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Risikodetails</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs text-gray-500">Titel</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Risikotitel eingeben..."
                  className="mt-1 text-lg font-semibold"
                />
              </div>

              <div>
                <Label className="text-xs text-gray-500">Beschreibung</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Risikobeschreibung..."
                  rows={3}
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-gray-500">Risikokategorie</Label>
                  <Select value={riskCategory} onValueChange={setRiskCategory}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORY_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Bedrohungsquelle</Label>
                  <Select value={threatSource} onValueChange={setThreatSource}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {THREAT_SOURCE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-xs text-gray-500">Schwachstelle</Label>
                <Textarea
                  value={vulnerability}
                  onChange={(e) => setVulnerability(e.target.value)}
                  placeholder="Welche Schwachstelle wird ausgenutzt..."
                  rows={2}
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          {/* Treatment Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Risikobehandlung</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-gray-500">Behandlungsstrategie</Label>
                  <Select value={riskTreatment} onValueChange={setRiskTreatment}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TREATMENT_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-xs text-gray-500">Behandlungsplan</Label>
                <Textarea
                  value={treatmentPlan}
                  onChange={(e) => setTreatmentPlan(e.target.value)}
                  placeholder="Beschreiben Sie den Behandlungsplan..."
                  rows={3}
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-xs text-gray-500">Behandlungsfrist</Label>
                <Input
                  type="date"
                  value={treatmentDeadline}
                  onChange={(e) => setTreatmentDeadline(e.target.value)}
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          {/* Mapped Controls */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Shield className="h-4 w-4 text-[#0066FF]" />
                  Zugeordnete Maßnahmen ({mappedControls.length})
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setControlModalOpen(true)}
                >
                  <Shield className="h-3.5 w-3.5 mr-1.5" />
                  Maßnahmen zuordnen
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {mappedControls.length === 0 ? (
                <div className="text-center py-6 text-sm text-gray-400">
                  <Shield className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  Keine Maßnahmen zugeordnet
                  <br />
                  <button
                    onClick={() => setControlModalOpen(true)}
                    className="text-[#0066FF] hover:underline mt-1 text-xs"
                  >
                    Jetzt Maßnahmen hinzufügen
                  </button>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {mappedControls.map((ctrl) => (
                    <Badge
                      key={ctrl}
                      variant="outline"
                      className="pl-2 pr-1 py-1 gap-1 text-xs font-mono bg-blue-50 border-blue-200 text-blue-800"
                    >
                      {ctrl}
                      <button
                        onClick={() => removeControl(ctrl)}
                        className="ml-1 rounded-full p-0.5 hover:bg-blue-200 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Asset Info */}
          {risk.asset && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Zugeordnetes Asset</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {risk.asset.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {risk.asset.category} · CIA Score: {risk.asset.ciaScore?.toFixed(1)} (C:{risk.asset.confidentiality} I:{risk.asset.integrity} A:{risk.asset.availability})
                    </p>
                  </div>
                  <Link href={`/risks-v2/assets/${risk.asset.id}`}>
                    <Button variant="outline" size="sm">
                      Öffnen
                      <ChevronRight className="ml-1 h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column — Risikoberechnung */}
        <div className="col-span-5 space-y-4">
          {/* CIA Card (read-only from asset) */}
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider">
                    Schutzbedarf (CIA)
                  </p>
                  <p className="text-xs text-blue-500 mt-0.5">
                    Vom verknüpften Asset · Skala 1–3
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-blue-700">{cia}</p>
                  <p className="text-xs text-blue-500">
                    {cia === 3 ? "Sehr hoch" : cia === 2 ? "Hoch" : "Normal"}
                  </p>
                </div>
              </div>
              {!risk.asset && (
                <p className="text-xs text-blue-400 mt-2 flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  Kein Asset verknüpft — CIA = 1 (Standard)
                </p>
              )}
            </CardContent>
          </Card>

          {/* Bruttorisiko */}
          <Card>
            <CardHeader className="pb-3 bg-gradient-to-b from-red-50 to-white border-b border-red-100">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">Brutto-Risiko</CardTitle>
                <div className="text-right">
                  <p className="text-sm font-bold text-red-600">
                    {bruttoALE != null ? formatEUR(bruttoALE) : "—"}
                  </p>
                  <p className="text-[10px] text-gray-400">Brutto-ALE/Jahr</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[10px] text-gray-500">Schadenshöhe / SLE (€)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={sle}
                    onChange={(e) => setSle(e.target.value)}
                    placeholder="z.B. 50000"
                    className="mt-0.5 h-8 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-gray-500">Eintrittshäufigkeit / ARO</Label>
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    value={aro}
                    onChange={(e) => setAro(e.target.value)}
                    placeholder="z.B. 0.1 = 1×/10J"
                    className="mt-0.5 h-8 text-xs"
                  />
                </div>
              </div>
              <div className="rounded-lg bg-red-50 border border-red-100 p-3">
                <p className="text-[10px] text-gray-400 mb-1">
                  CIA ({cia}) × SLE ({sle || "—"}) × ARO ({aro || "—"}) =
                </p>
                <p className="text-lg font-bold text-red-600">
                  {bruttoALE != null ? formatEUR(bruttoALE) : "—"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Nettorisiko */}
          <Card>
            <CardHeader className="pb-3 bg-gradient-to-b from-emerald-50 to-white border-b border-emerald-100">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">Netto-Risiko</CardTitle>
                <div className="text-right">
                  <p className="text-sm font-bold text-emerald-600">
                    {nettoALE != null ? formatEUR(nettoALE) : "—"}
                  </p>
                  <p className="text-[10px] text-gray-400">Netto-ALE/Jahr</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[10px] text-gray-500">Netto Schadenshöhe / SLE (€)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={nettoSle}
                    onChange={(e) => setNettoSle(e.target.value)}
                    placeholder="z.B. 20000"
                    className="mt-0.5 h-8 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-gray-500">Netto ARO</Label>
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    value={nettoAro}
                    onChange={(e) => setNettoAro(e.target.value)}
                    placeholder="z.B. 0.05"
                    className="mt-0.5 h-8 text-xs"
                  />
                </div>
              </div>
              <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-3">
                <p className="text-[10px] text-gray-400 mb-1">
                  CIA ({cia}) × Netto-SLE ({nettoSle || "—"}) × Netto-ARO ({nettoAro || "—"}) =
                </p>
                <p className="text-lg font-bold text-emerald-600">
                  {nettoALE != null ? formatEUR(nettoALE) : "—"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Risikoreduktion */}
          {bruttoALE != null && nettoALE != null && bruttoALE > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-green-600" />
                  Risikoreduktion
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Brutto-ALE</span>
                  <span className="font-semibold text-red-600">{formatEUR(bruttoALE)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Netto-ALE</span>
                  <span className="font-semibold text-emerald-600">{formatEUR(nettoALE)}</span>
                </div>
                <div className="flex items-center justify-between border-t pt-2">
                  <span className="text-xs font-medium text-gray-700">Einsparung</span>
                  <div className="flex items-center gap-2">
                    {reductionPct != null && (
                      <Badge
                        variant="outline"
                        className="text-[10px] bg-green-50 text-green-700 border-green-200"
                      >
                        -{reductionPct}%
                      </Badge>
                    )}
                    <span className="text-sm font-bold text-green-600">
                      {formatEUR(bruttoALE - nettoALE)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Meta Info */}
          <Card>
            <CardContent className="pt-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Erstellt am</span>
                <span className="text-gray-700">{formatDate(risk.createdAt)}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Aktualisiert am</span>
                <span className="text-gray-700">{formatDate(risk.updatedAt)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Control Mapping Modal */}
      <ControlMappingModal
        isOpen={controlModalOpen}
        onClose={() => setControlModalOpen(false)}
        selectedControls={mappedControls}
        onSave={setMappedControls}
      />
    </div>
  );
}
