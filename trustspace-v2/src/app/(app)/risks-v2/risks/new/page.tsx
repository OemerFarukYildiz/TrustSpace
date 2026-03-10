"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Loader2,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

interface AssetOption {
  id: string;
  name: string;
  category: string;
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

// ──────────────────────────────────────────────
// Main Page Component
// ──────────────────────────────────────────────

export default function NewRiskV2Page() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [creating, setCreating] = useState(false);
  const [assets, setAssets] = useState<AssetOption[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(true);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assetId, setAssetId] = useState<string>(searchParams.get("assetId") || "");
  const [riskCategory, setRiskCategory] = useState("operational");
  const [threatSource, setThreatSource] = useState("external");
  const [vulnerability, setVulnerability] = useState("");

  // Fetch assets for dropdown
  useEffect(() => {
    const fetchAssets = async () => {
      setLoadingAssets(true);
      try {
        const res = await fetch("/api/v2/assets");
        if (res.ok) {
          const data = await res.json();
          setAssets(
            data.map((a: AssetOption) => ({
              id: a.id,
              name: a.name,
              category: a.category,
            }))
          );
        }
      } catch (err) {
        console.error("Fehler beim Laden der Assets:", err);
      } finally {
        setLoadingAssets(false);
      }
    };
    fetchAssets();
  }, []);

  // Create risk
  const handleCreate = async () => {
    if (!title.trim()) {
      alert("Bitte geben Sie einen Titel ein.");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("/api/v2/risks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          assetId: assetId || null,
          riskCategory,
          threatSource,
          vulnerability: vulnerability.trim() || null,
        }),
      });

      if (!res.ok) throw new Error("Erstellung fehlgeschlagen");

      const created = await res.json();
      router.push(`/risks-v2/risks/${created.id}`);
    } catch (err) {
      console.error(err);
      alert("Fehler beim Erstellen des Risikos.");
      setCreating(false);
    }
  };

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
        <span className="text-gray-900 font-medium">Neues Risiko</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Neues Risiko erstellen
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Erfassen Sie ein neues Risiko fuer die quantitative Bewertung
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/risks-v2")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Zurueck
        </Button>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Risiko-Identifikation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <Label className="text-xs text-gray-500">
              Titel <span className="text-red-500">*</span>
            </Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="z.B. Datenverlust durch Ransomware-Angriff"
              className="mt-1"
              autoFocus
            />
          </div>

          <div>
            <Label className="text-xs text-gray-500">Beschreibung</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detaillierte Beschreibung des Risikoszenarios..."
              rows={4}
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-xs text-gray-500">Asset</Label>
            <Select value={assetId} onValueChange={setAssetId}>
              <SelectTrigger className="mt-1">
                <SelectValue
                  placeholder={
                    loadingAssets ? "Laden..." : "Asset auswaehlen (optional)"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Kein Asset</SelectItem>
                {assets.map((asset) => (
                  <SelectItem key={asset.id} value={asset.id}>
                    {asset.name} ({asset.category})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              <Label className="text-xs text-gray-500">
                Bedrohungsquelle
              </Label>
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

          <div className="border-t pt-5 flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => router.push("/risks-v2")}
            >
              Abbrechen
            </Button>
            <Button
              className="bg-[#0066FF] hover:bg-blue-700"
              onClick={handleCreate}
              disabled={creating || !title.trim()}
            >
              {creating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Erstellen
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
