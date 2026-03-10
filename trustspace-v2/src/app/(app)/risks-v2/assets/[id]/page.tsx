"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Loader2,
  AlertTriangle,
  ChevronRight,
  Shield,
  Lock,
  Eye,
  Zap,
  Plus,
  Search,
  X,
  Check,
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

interface V2AssetDetail {
  id: string;
  name: string;
  description: string | null;
  category: string;
  subCategory: string | null;
  ownerId: string | null;
  department: string | null;
  confidentiality: number;
  integrity: number;
  availability: number;
  ciaScore: number;
  replacementCost: number | null;
  revenueImpact: number | null;
  dataClassification: string;
  status: string;
  location: string | null;
  createdAt: string;
  updatedAt: string;
  risksV2?: Array<{
    id: string;
    title: string;
    riskCategory: string;
    status: string;
    nettoScore: number;
    nettoALE: number | null;
  }>;
}

// ──────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────

const CATEGORY_OPTIONS = [
  { value: "information", label: "Information" },
  { value: "application", label: "Anwendung" },
  { value: "infrastructure", label: "Infrastruktur" },
  { value: "personnel", label: "Personal" },
  { value: "physical", label: "Physisch" },
];

const STATUS_OPTIONS = [
  { value: "active", label: "Aktiv" },
  { value: "decommissioned", label: "Stillgelegt" },
  { value: "planned", label: "Geplant" },
];

const CLASSIFICATION_OPTIONS = [
  { value: "public", label: "Oeffentlich", color: "bg-green-100 text-green-700 border-green-200" },
  { value: "internal", label: "Intern", color: "bg-blue-100 text-blue-700 border-blue-200" },
  { value: "confidential", label: "Vertraulich", color: "bg-orange-100 text-orange-700 border-orange-200" },
  { value: "restricted", label: "Streng vertraulich", color: "bg-red-100 text-red-700 border-red-200" },
];

// ──────────────────────────────────────────────
// Scenario Selection Modal
// ──────────────────────────────────────────────

interface ThreatScenario {
  id: string;
  code: string;
  name: string;
  description: string | null;
  category: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  technical: "bg-blue-100 text-blue-700 border-blue-200",
  operational: "bg-orange-100 text-orange-700 border-orange-200",
  compliance: "bg-purple-100 text-purple-700 border-purple-200",
  strategic: "bg-indigo-100 text-indigo-700 border-indigo-200",
  financial: "bg-green-100 text-green-700 border-green-200",
  environmental: "bg-teal-100 text-teal-700 border-teal-200",
};

function ScenarioModal({
  assetId,
  existingRiskTitles,
  onClose,
  onAdded,
}: {
  assetId: string;
  existingRiskTitles: string[];
  onClose: () => void;
  onAdded: () => void;
}) {
  const [scenarios, setScenarios] = useState<ThreatScenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/v2/scenarios")
      .then((r) => r.json())
      .then((data) => setScenarios(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = scenarios.filter((s) => {
    const q = search.toLowerCase();
    return (
      !q ||
      s.name.toLowerCase().includes(q) ||
      s.code.toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q)
    );
  });

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleAdd = async () => {
    if (selected.size === 0) return;
    setSaving(true);
    try {
      const chosen = scenarios.filter((s) => selected.has(s.id));
      await Promise.all(
        chosen.map((s) =>
          fetch("/api/v2/risks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              assetId,
              title: s.name,
              description: s.description || s.name,
              riskCategory: s.category,
              threatSource: "external",
            }),
          })
        )
      );
      onAdded();
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Risikoszenarien auswählen</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {selected.size > 0 ? `${selected.size} ausgewählt` : "Szenarien aus dem BSI-Katalog wählen"}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Search */}
        <div className="px-6 py-3 border-b">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Szenario suchen (Code, Name, Kategorie)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              autoFocus
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-6 py-3 space-y-2">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-gray-400 py-12 text-sm">Keine Szenarien gefunden</p>
          ) : (
            filtered.map((s) => {
              const isSelected = selected.has(s.id);
              const alreadyAdded = existingRiskTitles.includes(s.name);
              const colorClass = CATEGORY_COLORS[s.category] || "bg-gray-100 text-gray-700 border-gray-200";
              return (
                <div
                  key={s.id}
                  onClick={() => !alreadyAdded && toggle(s.id)}
                  className={cn(
                    "flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-all",
                    alreadyAdded
                      ? "opacity-50 cursor-not-allowed bg-gray-50 border-gray-200"
                      : isSelected
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  )}
                >
                  {/* Checkbox */}
                  <div className={cn(
                    "mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border-2 transition-colors",
                    alreadyAdded
                      ? "border-gray-300 bg-gray-200"
                      : isSelected
                      ? "border-blue-500 bg-blue-500"
                      : "border-gray-300"
                  )}>
                    {(isSelected || alreadyAdded) && <Check className="h-3 w-3 text-white" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{s.code}</span>
                      <span className={cn("text-xs px-2 py-0.5 rounded-full border capitalize", colorClass)}>
                        {s.category}
                      </span>
                      {alreadyAdded && (
                        <span className="text-xs text-gray-400">bereits vorhanden</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-900">{s.name}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50 rounded-b-xl">
          <span className="text-sm text-gray-500">{filtered.length} Szenarien verfügbar</span>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={onClose}>Abbrechen</Button>
            <Button
              className="bg-[#0066FF] hover:bg-blue-700"
              disabled={selected.size === 0 || saving}
              onClick={handleAdd}
            >
              {saving ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Plus className="h-4 w-4 mr-1.5" />}
              {selected.size > 0 ? `${selected.size} hinzufügen` : "Hinzufügen"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function getCIAColor(value: number): string {
  if (value >= 3) return "text-red-600";
  if (value >= 2) return "text-orange-600";
  if (value >= 1) return "text-green-600";
  return "text-gray-400";
}

// ──────────────────────────────────────────────
// Main Page Component
// ──────────────────────────────────────────────

export default function AssetV2DetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [asset, setAsset] = useState<V2AssetDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showScenarioModal, setShowScenarioModal] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("information");
  const [subCategory, setSubCategory] = useState("");
  const [department, setDepartment] = useState("");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState("active");
  const [dataClassification, setDataClassification] = useState("internal");

  // CIA
  const [confidentiality, setConfidentiality] = useState(0);
  const [integrity, setIntegrity] = useState(0);
  const [availability, setAvailability] = useState(0);

  // Valuation
  const [replacementCost, setReplacementCost] = useState<number | null>(null);
  const [revenueImpact, setRevenueImpact] = useState<number | null>(null);

  // Computed CIA Score
  const ciaScore = useMemo(() => {
    if (confidentiality > 0 && integrity > 0 && availability > 0) {
      return ((confidentiality + integrity + availability) / 3).toFixed(1);
    }
    return "0";
  }, [confidentiality, integrity, availability]);

  // Fetch asset
  useEffect(() => {
    const fetchAsset = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/v2/assets/${id}`);
        if (!res.ok) {
          if (res.status === 404) {
            setError("Asset nicht gefunden.");
            return;
          }
          throw new Error("Fehler beim Laden");
        }
        const data: V2AssetDetail = await res.json();
        setAsset(data);

        // Populate form
        setName(data.name);
        setDescription(data.description || "");
        setCategory(data.category);
        setSubCategory(data.subCategory || "");
        setDepartment(data.department || "");
        setLocation(data.location || "");
        setStatus(data.status);
        setDataClassification(data.dataClassification);
        setConfidentiality(data.confidentiality);
        setIntegrity(data.integrity);
        setAvailability(data.availability);
        setReplacementCost(data.replacementCost);
        setRevenueImpact(data.revenueImpact);
      } catch (err) {
        console.error(err);
        setError("Asset konnte nicht geladen werden.");
      } finally {
        setLoading(false);
      }
    };
    fetchAsset();
  }, [id]);

  // Reload asset after scenarios added
  const reloadAsset = async () => {
    const res = await fetch(`/api/v2/assets/${id}`);
    if (res.ok) setAsset(await res.json());
  };

  // Save
  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/v2/assets/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: description || null,
          category,
          subCategory: subCategory || null,
          department: department || null,
          location: location || null,
          status,
          dataClassification,
          confidentiality,
          integrity,
          availability,
          replacementCost,
          revenueImpact,
        }),
      });
      if (!res.ok) throw new Error("Speichern fehlgeschlagen");
      const updated = await res.json();
      setAsset((prev) => (prev ? { ...prev, ...updated } : prev));
    } catch (err) {
      console.error(err);
      alert("Fehler beim Speichern.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#0066FF]" />
      </div>
    );
  }

  if (error || !asset) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-3">
        <AlertTriangle className="h-10 w-10 text-red-400" />
        <p className="text-sm text-red-600">
          {error || "Asset nicht gefunden."}
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/risks-v2/assets")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Zurueck
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link
          href="/risks-v2/assets"
          className="hover:text-gray-700 transition-colors"
        >
          Asset-Management v2
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-gray-900 font-medium truncate max-w-xs">
          {name}
        </span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/risks-v2/assets")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Zurueck
        </Button>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowScenarioModal(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Risikoszenario hinzufügen
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
          {/* Basic Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">
                Grunddaten
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs text-gray-500">Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Asset-Name..."
                  className="mt-1 text-lg font-semibold"
                />
              </div>

              <div>
                <Label className="text-xs text-gray-500">Beschreibung</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Beschreibung des Assets..."
                  rows={3}
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-gray-500">Kategorie</Label>
                  <Select value={category} onValueChange={setCategory}>
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
                  <Label className="text-xs text-gray-500">
                    Unterkategorie
                  </Label>
                  <Input
                    value={subCategory}
                    onChange={(e) => setSubCategory(e.target.value)}
                    placeholder="z.B. Datenbank, ERP..."
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-gray-500">Abteilung</Label>
                  <Input
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="z.B. IT, HR..."
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Standort</Label>
                  <Input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="z.B. Rechenzentrum Muenchen..."
                    className="mt-1"
                  />
                </div>
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
            </CardContent>
          </Card>

          {/* Data Classification */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">
                Datenklassifikation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {CLASSIFICATION_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setDataClassification(opt.value)}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border-2 p-3 text-left transition-all",
                      dataClassification === opt.value
                        ? opt.color + " border-current"
                        : "border-gray-100 bg-white text-gray-500 hover:border-gray-200"
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-4 w-4 items-center justify-center rounded-full border-2",
                        dataClassification === opt.value
                          ? "border-current bg-current"
                          : "border-gray-300"
                      )}
                    >
                      {dataClassification === opt.value && (
                        <div className="h-1.5 w-1.5 rounded-full bg-white" />
                      )}
                    </div>
                    <span className="text-sm font-medium">{opt.label}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Valuation */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">
                Asset-Bewertung
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs text-gray-500">
                  Wiederbeschaffungskosten (EUR)
                </Label>
                <Input
                  type="number"
                  min={0}
                  value={replacementCost ?? ""}
                  onChange={(e) =>
                    setReplacementCost(
                      e.target.value === "" ? null : parseFloat(e.target.value)
                    )
                  }
                  placeholder="z.B. 50000"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-gray-500">
                  Umsatzauswirkung (EUR/Tag)
                </Label>
                <Input
                  type="number"
                  min={0}
                  value={revenueImpact ?? ""}
                  onChange={(e) =>
                    setRevenueImpact(
                      e.target.value === "" ? null : parseFloat(e.target.value)
                    )
                  }
                  placeholder="z.B. 5000"
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="col-span-5 space-y-6">
          {/* CIA Assessment */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Shield className="h-4 w-4 text-[#0066FF]" />
                CIA-Bewertung
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label className="text-xs text-gray-500 flex items-center gap-1">
                    <Lock className="h-3 w-3" />
                    Vertraulichkeit (1-3)
                  </Label>
                  <span
                    className={cn(
                      "text-sm font-bold",
                      getCIAColor(confidentiality)
                    )}
                  >
                    {confidentiality || "-"}
                  </span>
                </div>
                <Input
                  type="number"
                  min={0}
                  max={3}
                  value={confidentiality}
                  onChange={(e) =>
                    setConfidentiality(
                      Math.min(3, Math.max(0, parseInt(e.target.value) || 0))
                    )
                  }
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label className="text-xs text-gray-500 flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    Integritaet (1-3)
                  </Label>
                  <span
                    className={cn(
                      "text-sm font-bold",
                      getCIAColor(integrity)
                    )}
                  >
                    {integrity || "-"}
                  </span>
                </div>
                <Input
                  type="number"
                  min={0}
                  max={3}
                  value={integrity}
                  onChange={(e) =>
                    setIntegrity(
                      Math.min(3, Math.max(0, parseInt(e.target.value) || 0))
                    )
                  }
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label className="text-xs text-gray-500 flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    Verfuegbarkeit (1-3)
                  </Label>
                  <span
                    className={cn(
                      "text-sm font-bold",
                      getCIAColor(availability)
                    )}
                  >
                    {availability || "-"}
                  </span>
                </div>
                <Input
                  type="number"
                  min={0}
                  max={3}
                  value={availability}
                  onChange={(e) =>
                    setAvailability(
                      Math.min(3, Math.max(0, parseInt(e.target.value) || 0))
                    )
                  }
                />
              </div>

              <div className="border-t pt-3 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  CIA-Score
                </span>
                <span
                  className={cn(
                    "rounded-lg px-3 py-1 text-lg font-bold",
                    getCIAColor(parseFloat(ciaScore)),
                    parseFloat(ciaScore) >= 3 ? "bg-red-50" : parseFloat(ciaScore) >= 2 ? "bg-orange-50" : parseFloat(ciaScore) >= 1 ? "bg-green-50" : "bg-gray-50"
                  )}
                >
                  {ciaScore}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Meta Info */}
          <Card>
            <CardContent className="pt-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Erstellt am</span>
                <span className="text-gray-700">
                  {formatDate(asset.createdAt)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Aktualisiert am</span>
                <span className="text-gray-700">
                  {formatDate(asset.updatedAt)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Scenario Selection Modal */}
      {showScenarioModal && (
        <ScenarioModal
          assetId={id}
          existingRiskTitles={(asset.risksV2 || []).map((r) => r.title)}
          onClose={() => setShowScenarioModal(false)}
          onAdded={reloadAsset}
        />
      )}

      {/* Associated Risks */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold">
            Risikoszenarien ({asset.risksV2?.length ?? 0})
          </CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowScenarioModal(true)}
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Hinzufügen
          </Button>
        </CardHeader>
        <CardContent>
          {!asset.risksV2 || asset.risksV2.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-gray-400">
              <Shield className="h-10 w-10 mb-3 text-gray-200" />
              <p className="text-sm">Noch keine Risikoszenarien zugeordnet</p>
              <Button
                className="mt-4 bg-[#0066FF] hover:bg-blue-700"
                size="sm"
                onClick={() => setShowScenarioModal(true)}
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Risikoszenario hinzufügen
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {asset.risksV2.map((risk) => {
                const level = getRiskLevelV2(risk.nettoScore);
                return (
                  <div
                    key={risk.id}
                    className="flex items-center justify-between rounded-lg border border-gray-100 p-3 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => router.push(`/risks-v2/risks/${risk.id}`)}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">
                        {risk.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        {risk.riskCategory} | {risk.status}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {risk.nettoALE != null && (
                        <span className="text-xs text-gray-500">
                          {formatEUR(risk.nettoALE)}
                        </span>
                      )}
                      <span
                        className={cn(
                          "rounded-md px-2 py-0.5 text-[10px] font-semibold",
                          level.color
                        )}
                      >
                        {risk.nettoScore}
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
    </div>
  );
}
