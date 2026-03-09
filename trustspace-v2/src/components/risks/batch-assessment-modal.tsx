"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";

interface RiskThreat {
  id: string;
  threatScenario: {
    code: string;
    name: string;
    description?: string | null;
  };
  bruttoScore: number;
  nettoScore: number;
  bruttoProbability?: number;
  bruttoImpact?: number;
  nettoProbability?: number;
  nettoImpact?: number;
}

interface LocalThreat {
  id: string;
  code: string;
  name: string;
  bruttoProbability: number;
  bruttoImpact: number;
  bruttoScore: number;
  nettoProbability: number;
  nettoImpact: number;
  nettoScore: number;
  isCalculated: boolean;
}

interface BatchAssessmentModalProps {
  assetId: string;
  assetName: string;
  ciaAverage: number;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

const PROBABILITY_OPTIONS = [1, 2, 3, 4, 5];
const IMPACT_OPTIONS = [1, 2, 3, 4, 5];

function getStatusColor(score: number): string {
  if (score <= 0) return "bg-gray-300";
  if (score <= 5) return "bg-green-500";
  if (score <= 10) return "bg-yellow-500";
  return "bg-red-500";
}

export function BatchAssessmentModal({
  assetId,
  assetName,
  ciaAverage,
  isOpen,
  onClose,
  onSaved,
}: BatchAssessmentModalProps) {
  const [threats, setThreats] = useState<LocalThreat[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchThreats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/risk-threats?assetId=${assetId}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data: RiskThreat[] = await res.json();

      const mapped: LocalThreat[] = data.map((rt) => {
        const bp = rt.bruttoProbability ?? 1;
        const bi = rt.bruttoImpact ?? 1;
        const np = rt.nettoProbability ?? 1;
        const ni = rt.nettoImpact ?? 1;
        const isCalculated =
          rt.bruttoScore > 1 || bp > 1 || bi > 1;

        return {
          id: rt.id,
          code: rt.threatScenario.code,
          name: rt.threatScenario.name,
          bruttoProbability: bp,
          bruttoImpact: bi,
          bruttoScore: Math.round(bp * bi * ciaAverage),
          nettoProbability: np,
          nettoImpact: ni,
          nettoScore: Math.round(np * ni * ciaAverage),
          isCalculated,
        };
      });

      // Sortierung: unbewertete zuerst
      mapped.sort((a, b) => {
        if (a.isCalculated === b.isCalculated) {
          return a.code.localeCompare(b.code);
        }
        return a.isCalculated ? 1 : -1;
      });

      setThreats(mapped);
    } catch (error) {
      console.error("Failed to fetch risk threats:", error);
    } finally {
      setLoading(false);
    }
  }, [assetId, ciaAverage]);

  useEffect(() => {
    if (isOpen) {
      fetchThreats();
    }
  }, [isOpen, fetchThreats]);

  const updateThreat = (
    id: string,
    field: keyof Pick<
      LocalThreat,
      "bruttoProbability" | "bruttoImpact" | "nettoProbability" | "nettoImpact"
    >,
    value: number
  ) => {
    setThreats((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const updated = { ...t, [field]: value, isCalculated: true };
        updated.bruttoScore = Math.round(
          updated.bruttoProbability * updated.bruttoImpact * ciaAverage
        );
        updated.nettoScore = Math.round(
          updated.nettoProbability * updated.nettoImpact * ciaAverage
        );
        return updated;
      })
    );
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const updates = threats
        .filter((t) => t.isCalculated)
        .map((t) => ({
          id: t.id,
          bruttoProbability: t.bruttoProbability,
          bruttoImpact: t.bruttoImpact,
          nettoProbability: t.nettoProbability,
          nettoImpact: t.nettoImpact,
        }));

      if (updates.length === 0) return;

      const res = await fetch("/api/risk-threats/batch", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
      });

      if (!res.ok) throw new Error("Failed to save");

      onSaved();
      onClose();
    } catch (error) {
      console.error("Failed to batch save:", error);
    } finally {
      setSaving(false);
    }
  };

  const calculatedCount = useMemo(
    () => threats.filter((t) => t.isCalculated).length,
    [threats]
  );

  const totalCount = threats.length;
  const progressPercent =
    totalCount > 0 ? Math.round((calculatedCount / totalCount) * 100) : 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[90vw] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            Risikobewertung &ndash; {assetName}
          </DialogTitle>
          <DialogDescription>
            Bewerten Sie alle Bedrohungen dieses Assets. CIA-Durchschnitt:{" "}
            {ciaAverage.toFixed(2)}
          </DialogDescription>
        </DialogHeader>

        {/* Progress */}
        <div className="flex items-center gap-3">
          <Progress value={progressPercent} className="flex-1 h-2" />
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {calculatedCount} von {totalCount} bewertet
          </span>
        </div>

        {/* Scrollable Table */}
        <div className="flex-1 overflow-auto border rounded-md">
          {loading ? (
            <div className="flex items-center justify-center h-40 text-muted-foreground">
              Laden...
            </div>
          ) : threats.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-muted-foreground">
              Keine Bedrohungen zugewiesen
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">Bedrohung</TableHead>
                  <TableHead className="w-[100px]">Brutto W</TableHead>
                  <TableHead className="w-[100px]">Brutto A</TableHead>
                  <TableHead className="w-[80px]">Brutto Score</TableHead>
                  <TableHead className="w-[1px] px-0 bg-border" />
                  <TableHead className="w-[100px]">Netto W</TableHead>
                  <TableHead className="w-[100px]">Netto A</TableHead>
                  <TableHead className="w-[80px]">Netto Score</TableHead>
                  <TableHead className="w-[50px]">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {threats.map((threat) => (
                  <TableRow key={threat.id}>
                    {/* Bedrohung */}
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-mono text-xs text-muted-foreground">
                          {threat.code}
                        </span>
                        <span className="text-sm font-medium">
                          {threat.name}
                        </span>
                      </div>
                    </TableCell>

                    {/* Brutto Wahrscheinlichkeit */}
                    <TableCell>
                      <Select
                        value={String(threat.bruttoProbability)}
                        onValueChange={(v) =>
                          updateThreat(threat.id, "bruttoProbability", Number(v))
                        }
                      >
                        <SelectTrigger className="h-8 w-[70px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PROBABILITY_OPTIONS.map((n) => (
                            <SelectItem key={n} value={String(n)}>
                              {n}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>

                    {/* Brutto Auswirkung */}
                    <TableCell>
                      <Select
                        value={String(threat.bruttoImpact)}
                        onValueChange={(v) =>
                          updateThreat(threat.id, "bruttoImpact", Number(v))
                        }
                      >
                        <SelectTrigger className="h-8 w-[70px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {IMPACT_OPTIONS.map((n) => (
                            <SelectItem key={n} value={String(n)}>
                              {n}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>

                    {/* Brutto Score */}
                    <TableCell>
                      <span className="font-semibold tabular-nums">
                        {threat.bruttoScore}
                      </span>
                    </TableCell>

                    {/* Divider */}
                    <TableCell className="px-0 w-[1px] bg-border" />

                    {/* Netto Wahrscheinlichkeit */}
                    <TableCell>
                      <Select
                        value={String(threat.nettoProbability)}
                        onValueChange={(v) =>
                          updateThreat(threat.id, "nettoProbability", Number(v))
                        }
                      >
                        <SelectTrigger className="h-8 w-[70px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PROBABILITY_OPTIONS.map((n) => (
                            <SelectItem key={n} value={String(n)}>
                              {n}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>

                    {/* Netto Auswirkung */}
                    <TableCell>
                      <Select
                        value={String(threat.nettoImpact)}
                        onValueChange={(v) =>
                          updateThreat(threat.id, "nettoImpact", Number(v))
                        }
                      >
                        <SelectTrigger className="h-8 w-[70px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {IMPACT_OPTIONS.map((n) => (
                            <SelectItem key={n} value={String(n)}>
                              {n}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>

                    {/* Netto Score */}
                    <TableCell>
                      <span className="font-semibold tabular-nums">
                        {threat.nettoScore}
                      </span>
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <div className="flex justify-center">
                        <div
                          className={`h-3 w-3 rounded-full ${getStatusColor(
                            threat.nettoScore
                          )}`}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Abbrechen
          </Button>
          <Button
            onClick={handleSaveAll}
            disabled={saving || calculatedCount === 0}
          >
            {saving ? "Speichert..." : "Alle speichern"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
