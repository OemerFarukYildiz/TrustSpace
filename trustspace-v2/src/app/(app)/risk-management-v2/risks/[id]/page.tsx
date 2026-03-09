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

// ──────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────

const CATEGORY_OPTIONS = [
  { value: "operational", label: "Operativ" },
  { value: "strategic", label: "Strategisch" },
  { value: "compliance", label: "Compliance" },
  { value: "financial", label: "Finanziell" },
  { value: "technical", label: "Technisch" },
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
// Risk Assessment Card
// ──────────────────────────────────────────────

function RiskAssessmentCard({
  title,
  probability,
  impact,
  sle,
  aro,
  onProbabilityChange,
  onImpactChange,
  onSLEChange,
  onAROChange,
}: {
  title: string;
  probability: number;
  impact: number;
  sle: number | null;
  aro: number | null;
  onProbabilityChange: (v: number) => void;
  onImpactChange: (v: number) => void;
  onSLEChange: (v: number | null) => void;
  onAROChange: (v: number | null) => void;
}) {
  const score = getRiskScoreV2(probability, impact);
  const level = getRiskLevelV2(score);
  const ale = calculateALE(sle, aro);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-gray-500">
              Wahrscheinlichkeit (1-10)
            </Label>
            <Input
              type="number"
              min={1}
              max={10}
              value={probability}
              onChange={(e) =>
                onProbabilityChange(
                  Math.min(10, Math.max(1, parseInt(e.target.value) || 1))
                )
              }
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs text-gray-500">
              Auswirkung (1-10)
            </Label>
            <Input
              type="number"
              min={1}
              max={10}
              value={impact}
              onChange={(e) =>
                onImpactChange(
                  Math.min(10, Math.max(1, parseInt(e.target.value) || 1))
                )
              }
              className="mt-1"
            />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
          <span className="text-xs font-medium text-gray-500">
            Risikoscore
          </span>
          <span
            className={cn(
              "rounded-md px-3 py-1 text-sm font-bold",
              level.color
            )}
          >
            {score} - {level.label}
          </span>
        </div>

        <div className="border-t pt-3 space-y-3">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
            FAIR-Bewertung
          </p>
          <div>
            <Label className="text-xs text-gray-500">SLE (EUR)</Label>
            <Input
              type="number"
              min={0}
              value={sle ?? ""}
              onChange={(e) =>
                onSLEChange(
                  e.target.value === "" ? null : parseFloat(e.target.value)
                )
              }
              placeholder="Schadenshoehe pro Ereignis"
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs text-gray-500">
              ARO (Haeufigkeit/Jahr)
            </Label>
            <Input
              type="number"
              min={0}
              step={0.01}
              value={aro ?? ""}
              onChange={(e) =>
                onAROChange(
                  e.target.value === "" ? null : parseFloat(e.target.value)
                )
              }
              placeholder="z.B. 0.5 = alle 2 Jahre"
              className="mt-1"
            />
          </div>
          <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
            <span className="text-xs font-medium text-gray-500">
              ALE (EUR/Jahr)
            </span>
            <span className="text-sm font-bold text-gray-900">
              {ale != null ? formatEUR(ale) : "-"}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
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

  // Brutto assessment
  const [bruttoProbability, setBruttoProbability] = useState(1);
  const [bruttoImpact, setBruttoImpact] = useState(1);
  const [bruttoSLE, setBruttoSLE] = useState<number | null>(null);
  const [bruttoARO, setBruttoARO] = useState<number | null>(null);

  // Netto assessment
  const [nettoProbability, setNettoProbability] = useState(1);
  const [nettoImpact, setNettoImpact] = useState(1);
  const [nettoSLE, setNettoSLE] = useState<number | null>(null);
  const [nettoARO, setNettoARO] = useState<number | null>(null);

  // Computed
  const bruttoScore = useMemo(
    () => getRiskScoreV2(bruttoProbability, bruttoImpact),
    [bruttoProbability, bruttoImpact]
  );
  const nettoScore = useMemo(
    () => getRiskScoreV2(nettoProbability, nettoImpact),
    [nettoProbability, nettoImpact]
  );
  const bruttoALE = useMemo(
    () => calculateALE(bruttoSLE, bruttoARO),
    [bruttoSLE, bruttoARO]
  );
  const nettoALE = useMemo(
    () => calculateALE(nettoSLE, nettoARO),
    [nettoSLE, nettoARO]
  );
  const scoreReduction = bruttoScore - nettoScore;
  const aleReduction =
    bruttoALE != null && nettoALE != null ? bruttoALE - nettoALE : null;

  const mappedControlsList = useMemo(() => {
    if (!risk?.mappedControls) return [];
    try {
      return JSON.parse(risk.mappedControls) as string[];
    } catch {
      return [];
    }
  }, [risk?.mappedControls]);

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

        setBruttoProbability(data.bruttoProbability);
        setBruttoImpact(data.bruttoImpact);
        setBruttoSLE(data.singleLossExpectancy);
        setBruttoARO(data.annualRateOccurrence);

        setNettoProbability(data.nettoProbability);
        setNettoImpact(data.nettoImpact);
        setNettoSLE(data.nettoSLE);
        setNettoARO(data.nettoARO);
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
          bruttoProbability,
          bruttoImpact,
          singleLossExpectancy: bruttoSLE,
          annualRateOccurrence: bruttoARO,
          nettoProbability,
          nettoImpact,
          nettoSLE,
          nettoARO,
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
    if (!confirm("Risiko wirklich loeschen?")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/v2/risks/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Loeschen fehlgeschlagen");
      router.push("/risk-management-v2");
    } catch (err) {
      console.error(err);
      alert("Fehler beim Loeschen.");
      setDeleting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#0066FF]" />
      </div>
    );
  }

  // Error state
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
          onClick={() => router.push("/risk-management-v2")}
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
          href="/risk-management-v2"
          className="hover:text-gray-700 transition-colors"
        >
          Risikomanagement v2
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-gray-900 font-medium truncate max-w-xs">
          {title}
        </span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/risk-management-v2")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Zurueck
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
            Loeschen
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
              <CardTitle className="text-sm font-semibold">
                Risikodetails
              </CardTitle>
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
                  <Label className="text-xs text-gray-500">
                    Risikokategorie
                  </Label>
                  <Select
                    value={riskCategory}
                    onValueChange={setRiskCategory}
                  >
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
                    Bedrohungsquelle
                  </Label>
                  <Select
                    value={threatSource}
                    onValueChange={setThreatSource}
                  >
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
              <CardTitle className="text-sm font-semibold">
                Risikobehandlung
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-gray-500">
                    Behandlungsstrategie
                  </Label>
                  <Select
                    value={riskTreatment}
                    onValueChange={setRiskTreatment}
                  >
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
                <Label className="text-xs text-gray-500">
                  Behandlungsplan
                </Label>
                <Textarea
                  value={treatmentPlan}
                  onChange={(e) => setTreatmentPlan(e.target.value)}
                  placeholder="Beschreiben Sie den Behandlungsplan..."
                  rows={3}
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-xs text-gray-500">
                  Behandlungsfrist
                </Label>
                <Input
                  type="date"
                  value={treatmentDeadline}
                  onChange={(e) => setTreatmentDeadline(e.target.value)}
                  className="mt-1"
                />
              </div>

              {/* Mapped Controls */}
              {mappedControlsList.length > 0 && (
                <div>
                  <Label className="text-xs text-gray-500">
                    Zugeordnete Kontrollen
                  </Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {mappedControlsList.map((ctrl) => (
                      <Badge key={ctrl} variant="outline">
                        {ctrl}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Asset Info */}
          {risk.asset && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">
                  Zugeordnetes Asset
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {risk.asset.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {risk.asset.category} | CIA Score:{" "}
                      {risk.asset.ciaScore?.toFixed(1)}
                    </p>
                  </div>
                  <Link href={`/asset-management-v2/${risk.asset.id}`}>
                    <Button variant="outline" size="sm">
                      Oeffnen
                      <ChevronRight className="ml-1 h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column */}
        <div className="col-span-5 space-y-6">
          {/* Brutto Assessment */}
          <RiskAssessmentCard
            title="Brutto-Risiko (Inherent Risk)"
            probability={bruttoProbability}
            impact={bruttoImpact}
            sle={bruttoSLE}
            aro={bruttoARO}
            onProbabilityChange={setBruttoProbability}
            onImpactChange={setBruttoImpact}
            onSLEChange={setBruttoSLE}
            onAROChange={setBruttoARO}
          />

          {/* Netto Assessment */}
          <RiskAssessmentCard
            title="Netto-Risiko (Residual Risk)"
            probability={nettoProbability}
            impact={nettoImpact}
            sle={nettoSLE}
            aro={nettoARO}
            onProbabilityChange={setNettoProbability}
            onImpactChange={setNettoImpact}
            onSLEChange={setNettoSLE}
            onAROChange={setNettoARO}
          />

          {/* Reduction Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-green-600" />
                Risikoreduktion
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Brutto-Score</span>
                <span
                  className={cn(
                    "rounded-md px-2 py-0.5 text-xs font-semibold",
                    getRiskLevelV2(bruttoScore).color
                  )}
                >
                  {bruttoScore}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Netto-Score</span>
                <span
                  className={cn(
                    "rounded-md px-2 py-0.5 text-xs font-semibold",
                    getRiskLevelV2(nettoScore).color
                  )}
                >
                  {nettoScore}
                </span>
              </div>
              <div className="border-t pt-3 flex items-center justify-between">
                <span className="text-xs font-medium text-gray-700">
                  Score-Reduktion
                </span>
                <span
                  className={cn(
                    "text-sm font-bold",
                    scoreReduction > 0
                      ? "text-green-600"
                      : scoreReduction < 0
                      ? "text-red-600"
                      : "text-gray-400"
                  )}
                >
                  {scoreReduction > 0 ? "-" : ""}
                  {scoreReduction} Punkte
                </span>
              </div>

              {(bruttoALE != null || nettoALE != null) && (
                <>
                  <div className="border-t pt-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        Brutto-ALE
                      </span>
                      <span className="text-xs font-medium text-gray-700">
                        {formatEUR(bruttoALE)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        Netto-ALE
                      </span>
                      <span className="text-xs font-medium text-gray-700">
                        {formatEUR(nettoALE)}
                      </span>
                    </div>
                    {aleReduction != null && (
                      <div className="flex items-center justify-between border-t pt-2">
                        <span className="text-xs font-medium text-gray-700">
                          ALE-Reduktion
                        </span>
                        <span
                          className={cn(
                            "text-sm font-bold",
                            aleReduction > 0
                              ? "text-green-600"
                              : aleReduction < 0
                              ? "text-red-600"
                              : "text-gray-400"
                          )}
                        >
                          {aleReduction > 0 ? "-" : ""}
                          {formatEUR(Math.abs(aleReduction))}
                        </span>
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Meta Info */}
          <Card>
            <CardContent className="pt-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Erstellt am</span>
                <span className="text-gray-700">
                  {formatDate(risk.createdAt)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Aktualisiert am</span>
                <span className="text-gray-700">
                  {formatDate(risk.updatedAt)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
