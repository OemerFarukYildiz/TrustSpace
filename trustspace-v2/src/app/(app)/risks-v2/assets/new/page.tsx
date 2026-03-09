"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
// Constants
// ──────────────────────────────────────────────

const CATEGORY_OPTIONS = [
  { value: "information", label: "Information" },
  { value: "application", label: "Anwendung" },
  { value: "infrastructure", label: "Infrastruktur" },
  { value: "personnel", label: "Personal" },
  { value: "physical", label: "Physisch" },
];

const CLASSIFICATION_OPTIONS = [
  { value: "public", label: "Oeffentlich", color: "bg-green-100 text-green-700 border-green-200" },
  { value: "internal", label: "Intern", color: "bg-blue-100 text-blue-700 border-blue-200" },
  { value: "confidential", label: "Vertraulich", color: "bg-orange-100 text-orange-700 border-orange-200" },
  { value: "restricted", label: "Streng vertraulich", color: "bg-red-100 text-red-700 border-red-200" },
];

// ──────────────────────────────────────────────
// Main Page Component
// ──────────────────────────────────────────────

export default function NewAssetV2Page() {
  const router = useRouter();

  const [creating, setCreating] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("information");
  const [subCategory, setSubCategory] = useState("");
  const [department, setDepartment] = useState("");
  const [location, setLocation] = useState("");
  const [dataClassification, setDataClassification] = useState("internal");

  // Create asset
  const handleCreate = async () => {
    if (!name.trim()) {
      alert("Bitte geben Sie einen Namen ein.");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("/api/v2/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          category,
          subCategory: subCategory.trim() || null,
          department: department.trim() || null,
          location: location.trim() || null,
          dataClassification,
        }),
      });

      if (!res.ok) throw new Error("Erstellung fehlgeschlagen");

      const created = await res.json();
      router.push(`/risks-v2/assets/${created.id}`);
    } catch (err) {
      console.error(err);
      alert("Fehler beim Erstellen des Assets.");
      setCreating(false);
    }
  };

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
        <span className="text-gray-900 font-medium">Neues Asset</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Neues Asset erstellen
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Erfassen Sie einen neuen Informationswert
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/risks-v2/assets")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Zurueck
        </Button>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Asset-Informationen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <Label className="text-xs text-gray-500">
              Name <span className="text-red-500">*</span>
            </Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="z.B. ERP-System, Kundendatenbank..."
              className="mt-1"
              autoFocus
            />
          </div>

          <div>
            <Label className="text-xs text-gray-500">Beschreibung</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Beschreibung des Informationswertes..."
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
              <Label className="text-xs text-gray-500">Unterkategorie</Label>
              <Input
                value={subCategory}
                onChange={(e) => setSubCategory(e.target.value)}
                placeholder="z.B. Datenbank, Server..."
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
                placeholder="z.B. IT, HR, Finanzen..."
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500">Standort</Label>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="z.B. Cloud, Rechenzentrum..."
                className="mt-1"
              />
            </div>
          </div>

          {/* Data Classification */}
          <div>
            <Label className="text-xs text-gray-500 mb-2 block">
              Datenklassifikation
            </Label>
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
          </div>

          <div className="border-t pt-5 flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => router.push("/risks-v2/assets")}
            >
              Abbrechen
            </Button>
            <Button
              className="bg-[#0066FF] hover:bg-blue-700"
              onClick={handleCreate}
              disabled={creating || !name.trim()}
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
