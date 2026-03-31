"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  Loader2,
  Moon,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  Terminal,
  Globe,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Info,
  Filter,
  X,
  ShieldCheck,
  AlertCircle,
  Wrench,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Issue {
  id: string;
  severity: string;
  title: string;
  description: string;
  remediation: string;
  snoozed: boolean;
  snooze_reason: string | null;
  snooze_until: string | null;
  occurrences: string;
  exploit_likelihood: string;
  cvss_score: number | null;
}

interface Occurrence {
  id: string;
  target: string;
  display_address: string;
  affected_host?: string;
  port: number | null;
  protocol: string | null;
  cvss_score: number | null;
  exploit_likelihood: string | null;
  first_seen_at: string;
  age: string | null;
  occurrence_id?: string;
  cves?: string[];
  extra_info?: Record<string, string> | null;
}

interface FixedOccurrence {
  id: string;
  occurrence_id: string;
  affected_host: string;
  affected_port: number | null;
  display_address: string;
  title: string;
  description: string;
  remediation: string;
  severity: string;
  cvss_score: number | null;
  exploit_likelihood: string;
  first_seen_at: string;
  remediated_at: string;
  tags: string[];
}

interface PaginatedResponse<T> {
  results: T[];
  count: number;
  next: string | null;
  previous: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

/** Render text with markdown formatting: links, inline code, bullet points */
function RichText({ text }: { text: string }) {
  // Split into lines first for bullet point handling
  const lines = text.split("\n");

  return (
    <div className="space-y-1">
      {lines.map((line, li) => {
        const trimmed = line.trim();
        const isBullet = /^[-•*]\s/.test(trimmed);
        const bulletContent = isBullet ? trimmed.replace(/^[-•*]\s+/, "") : line;

        const rendered = renderInline(isBullet ? bulletContent : line);

        if (isBullet) {
          return (
            <div key={li} className="flex gap-2 pl-1">
              <span className="text-gray-400 shrink-0 mt-0.5">•</span>
              <span>{rendered}</span>
            </div>
          );
        }

        if (trimmed === "") return <div key={li} className="h-2" />;

        return <div key={li}>{rendered}</div>;
      })}
    </div>
  );
}

/** Render inline formatting: [links](url), `code`, plain URLs */
function renderInline(text: string) {
  // Match: markdown links, backtick code, plain URLs
  const parts = text.split(/(\[[^\]]+\]\([^)]+\)|`[^`]+`|https?:\/\/[^\s)\]]+)/g);
  return parts.map((part, i) => {
    // Markdown link
    const mdMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (mdMatch) {
      return (
        <a key={i} href={mdMatch[2]} target="_blank" rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 underline underline-offset-2">
          {mdMatch[1]}
        </a>
      );
    }
    // Inline code
    if (/^`[^`]+`$/.test(part)) {
      return (
        <code key={i} className="text-[13px] font-mono bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded border border-gray-200">
          {part.slice(1, -1)}
        </code>
      );
    }
    // Plain URL
    if (/^https?:\/\//.test(part)) {
      return (
        <a key={i} href={part} target="_blank" rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 underline underline-offset-2 break-all">
          {part}
        </a>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

function formatDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatDateTime(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const SEVERITY_CFG: Record<
  string,
  { label: string; cls: string; dot: string }
> = {
  critical: {
    label: "Kritisch",
    cls: "bg-red-100 text-red-800 border border-red-200",
    dot: "bg-red-500",
  },
  high: {
    label: "Hoch",
    cls: "bg-orange-100 text-orange-800 border border-orange-200",
    dot: "bg-orange-500",
  },
  medium: {
    label: "Mittel",
    cls: "bg-amber-100 text-amber-800 border border-amber-200",
    dot: "bg-amber-500",
  },
  low: {
    label: "Niedrig",
    cls: "bg-blue-100 text-blue-800 border border-blue-200",
    dot: "bg-blue-500",
  },
};

const EXPLOIT_CFG: Record<string, { label: string; cls: string }> = {
  known: { label: "Bekannt", cls: "bg-red-50 text-red-700 border-red-100" },
  very_likely: {
    label: "Sehr wahrscheinlich",
    cls: "bg-orange-50 text-orange-700 border-orange-100",
  },
  likely: {
    label: "Wahrscheinlich",
    cls: "bg-amber-50 text-amber-700 border-amber-100",
  },
  unlikely: {
    label: "Unwahrscheinlich",
    cls: "bg-blue-50 text-blue-700 border-blue-100",
  },
  rare: { label: "Selten", cls: "bg-gray-50 text-gray-600 border-gray-100" },
};

const SNOOZE_REASON_LABELS: Record<string, string> = {
  ACCEPT_RISK: "Risiko akzeptiert",
  FALSE_POSITIVE: "Fehlalarm",
  MITIGATING_CONTROLS: "Kompensierende Maßnahmen",
};

function SeverityBadge({ severity }: { severity: string }) {
  const cfg = SEVERITY_CFG[severity?.toLowerCase()] ?? {
    label: severity,
    cls: "bg-gray-100 text-gray-700 border-gray-200",
    dot: "bg-gray-400",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full",
        cfg.cls
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full", cfg.dot)} />
      {cfg.label}
    </span>
  );
}

function ExploitBadge({ likelihood }: { likelihood: string }) {
  const cfg = EXPLOIT_CFG[likelihood?.toLowerCase()] ?? {
    label: likelihood,
    cls: "bg-gray-50 text-gray-600 border-gray-100",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full border",
        cfg.cls
      )}
    >
      {cfg.label}
    </span>
  );
}

function CvssIndicator({ score }: { score: number | null }) {
  if (score === null || score === undefined) return <span className="text-gray-300 text-xs">—</span>;
  const pct = Math.min((score / 10) * 100, 100);
  const color =
    score >= 9
      ? "bg-red-500"
      : score >= 7
      ? "bg-orange-500"
      : score >= 4
      ? "bg-amber-400"
      : "bg-blue-400";
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full", color)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-mono font-semibold text-gray-700">
        {score.toFixed(1)}
      </span>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="py-20 text-center">
      <ShieldAlert className="w-12 h-12 mx-auto mb-4 text-gray-200" />
      <p className="text-sm font-medium text-gray-400">{message}</p>
      <p className="text-xs text-gray-300 mt-1">
        Keine Einträge gefunden
      </p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="py-20 text-center">
      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-[#0066FF]" />
      <p className="text-sm text-gray-400">Lade Daten...</p>
    </div>
  );
}

function Pagination({
  offset,
  limit,
  total,
  onPrev,
  onNext,
}: {
  offset: number;
  limit: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  const from = total === 0 ? 0 : offset + 1;
  const to = Math.min(offset + limit, total);
  return (
    <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 bg-gray-50/50">
      <p className="text-xs text-gray-500">
        {total === 0 ? "Keine Einträge" : `${from}–${to} von ${total}`}
      </p>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs"
          disabled={offset === 0}
          onClick={onPrev}
        >
          <ChevronLeft className="w-3.5 h-3.5 mr-1" />
          Vorherige
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs"
          disabled={offset + limit >= total}
          onClick={onNext}
        >
          Nächste
          <ChevronRight className="w-3.5 h-3.5 ml-1" />
        </Button>
      </div>
    </div>
  );
}

// ─── Scanner Output Modal ─────────────────────────────────────────────────────

function ScannerOutputBlock({
  issueId,
  occurrenceId,
}: {
  issueId: string;
  occurrenceId: string;
}) {
  const [output, setOutput] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const load = async () => {
    if (output !== null) { setOpen(true); return; }
    setLoading(true);
    try {
      const res = await fetch(
        `/api/intruder/v1/issues/${issueId}/occurrences/${occurrenceId}/scanner_output`
      );
      const text = await res.text();
      setOutput(text);
    } catch {
      setOutput("Fehler beim Laden des Scanner-Outputs.");
    } finally {
      setLoading(false);
      setOpen(true);
    }
  };

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        className="h-6 text-xs"
        onClick={load}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="w-3 h-3 animate-spin mr-1" />
        ) : (
          <Terminal className="w-3 h-3 mr-1" />
        )}
        Scanner Output
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">
              Scanner Output
            </DialogTitle>
          </DialogHeader>
          <pre className="flex-1 overflow-auto text-xs font-mono bg-gray-950 text-green-400 p-4 rounded-lg leading-relaxed whitespace-pre-wrap">
            {output ?? "Kein Output vorhanden"}
          </pre>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Snooze Dialog (legacy, kept for list-level use) ─────────────────────────

function SnoozeDialog({
  issue,
  open,
  onOpenChange,
  onSuccess,
}: {
  issue: Issue;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSuccess: () => void;
}) {
  const [reason, setReason] = useState("ACCEPT_RISK");
  const [durationType, setDurationType] = useState("forever");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/intruder/v1/issues/${issue.id}/snooze/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason,
          duration_type: durationType,
          details: details || undefined,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.detail ?? `HTTP ${res.status}`);
      }
      onSuccess();
      onOpenChange(false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unbekannter Fehler");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Moon className="w-4 h-4 text-indigo-500" />
            Issue zurückstellen
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-1">
          <p className="text-sm text-gray-500 leading-relaxed">
            <span className="font-medium text-gray-700">{issue.title}</span>
          </p>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-gray-600">Grund</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACCEPT_RISK">Risiko akzeptiert</SelectItem>
                <SelectItem value="FALSE_POSITIVE">Fehlalarm</SelectItem>
                <SelectItem value="MITIGATING_CONTROLS">
                  Kompensierende Maßnahmen
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-gray-600">Dauer</Label>
            <Select value={durationType} onValueChange={setDurationType}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="forever">Dauerhaft</SelectItem>
                <SelectItem value="day">1 Tag</SelectItem>
                <SelectItem value="week">1 Woche</SelectItem>
                <SelectItem value="month">1 Monat</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-gray-600">
              Details{" "}
              <span className="text-gray-400 font-normal">(optional)</span>
            </Label>
            <Textarea
              placeholder="Begründung oder Kommentar..."
              className="resize-none text-sm h-20"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
            />
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Abbrechen
            </Button>
            <Button
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting && (
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
              )}
              Zurückstellen
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Treatment Dialog ─────────────────────────────────────────────────────────

const TREATMENT_OPTIONS = [
  {
    value: "ACCEPT_RISK",
    label: "Risiko akzeptieren",
    description: "Das Risiko ist bekannt und wird bewusst in Kauf genommen.",
    icon: ShieldCheck,
    accent: "text-blue-600",
    activeBorder: "border-blue-500 bg-blue-50/60",
    activeIcon: "text-blue-600",
    ring: "ring-blue-200",
  },
  {
    value: "FALSE_POSITIVE",
    label: "Fehlalarm",
    description: "Das Issue ist kein echtes Sicherheitsproblem in diesem Kontext.",
    icon: AlertCircle,
    accent: "text-amber-600",
    activeBorder: "border-amber-400 bg-amber-50/60",
    activeIcon: "text-amber-500",
    ring: "ring-amber-200",
  },
  {
    value: "MITIGATING_CONTROLS",
    label: "Kompensierende Maßnahmen",
    description: "Bestehende Kontrollen reduzieren das Risiko ausreichend.",
    icon: Wrench,
    accent: "text-emerald-600",
    activeBorder: "border-emerald-500 bg-emerald-50/60",
    activeIcon: "text-emerald-600",
    ring: "ring-emerald-200",
  },
] as const;

const DURATION_OPTIONS = [
  { value: "forever", label: "Dauerhaft" },
  { value: "month", label: "1 Monat" },
  { value: "week", label: "1 Woche" },
  { value: "day", label: "1 Tag" },
] as const;

function TreatmentDialog({
  issue,
  open,
  onOpenChange,
  onSuccess,
}: {
  issue: Issue;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSuccess: () => void;
}) {
  const [reason, setReason] = useState<string>("ACCEPT_RISK");
  const [duration, setDuration] = useState<string>("forever");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = TREATMENT_OPTIONS.find((o) => o.value === reason)!;

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/intruder/v1/issues/${issue.id}/snooze/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason,
          duration_type: duration,
          details: details.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.detail ?? `HTTP ${res.status}`);
      }
      onSuccess();
      onOpenChange(false);
      setDetails("");
      setReason("ACCEPT_RISK");
      setDuration("forever");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unbekannter Fehler");
    } finally {
      setSubmitting(false);
    }
  };

  const isSnoozed = issue.snoozed;
  const reasonLabel = TREATMENT_OPTIONS.find((o) => o.value === issue.snooze_reason);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[440px] p-0 gap-0 overflow-hidden">
        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-gray-100">
          <DialogHeader>
            <DialogTitle className="text-[15px] font-semibold text-gray-900 leading-snug">
              {isSnoozed ? "Behandlungsdetails" : "Issue behandeln"}
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-gray-400 mt-1 leading-relaxed line-clamp-2">
            {issue.title}
          </p>
        </div>

        {/* Already treated - show details */}
        {isSnoozed && (
          <div className="px-5 py-5 space-y-4">
            <div className="flex items-start gap-3 p-3.5 rounded-xl border border-green-200 bg-green-50/50">
              {reasonLabel && <reasonLabel.icon className={cn("w-5 h-5 mt-0.5 shrink-0", reasonLabel.accent)} />}
              <div>
                <p className="text-sm font-medium text-gray-900">{reasonLabel?.label ?? "Behandelt"}</p>
                <p className="text-xs text-gray-500 mt-0.5">{reasonLabel?.description}</p>
                <p className="text-xs text-gray-400 mt-2">
                  {issue.snooze_until
                    ? `Gültig bis ${new Date(issue.snooze_until).toLocaleDateString("de-DE")}`
                    : "Dauerhaft gültig"}
                </p>
              </div>
            </div>
            <div className="flex justify-end">
              <Button variant="outline" size="sm" className="text-xs h-8" onClick={() => onOpenChange(false)}>
                Schließen
              </Button>
            </div>
          </div>
        )}

        {!isSnoozed && <>
        <div className="px-5 py-4 space-y-5">
          {/* Treatment Option Cards */}
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              Behandlungsart
            </p>
            <div className="space-y-1.5">
              {TREATMENT_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const isActive = reason === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setReason(opt.value)}
                    className={cn(
                      "w-full flex items-start gap-3 rounded-lg border px-3.5 py-3 text-left transition-all duration-150",
                      isActive
                        ? cn(opt.activeBorder, "ring-1", opt.ring)
                        : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/50"
                    )}
                  >
                    <div
                      className={cn(
                        "mt-0.5 rounded-md p-1.5 shrink-0 transition-colors",
                        isActive ? cn("bg-white/80", opt.activeIcon) : "bg-gray-100 text-gray-400"
                      )}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          "text-[13px] font-medium leading-tight",
                          isActive ? "text-gray-900" : "text-gray-700"
                        )}
                      >
                        {opt.label}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5 leading-snug">
                        {opt.description}
                      </p>
                    </div>
                    <div
                      className={cn(
                        "mt-1 w-3.5 h-3.5 rounded-full border-2 shrink-0 transition-all",
                        isActive
                          ? "border-[#0066FF] bg-[#0066FF]"
                          : "border-gray-300 bg-white"
                      )}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              Geltungsdauer
            </p>
            <div className="flex gap-1.5 flex-wrap">
              {DURATION_OPTIONS.map((opt) => {
                const isActive = duration === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setDuration(opt.value)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-150",
                      isActive
                        ? "bg-[#0066FF] border-[#0066FF] text-white shadow-sm"
                        : "bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                    )}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              Notiz{" "}
              <span className="normal-case font-normal text-gray-300">
                (optional)
              </span>
            </p>
            <Textarea
              placeholder="Begründung oder interner Kommentar..."
              className="resize-none text-xs h-[68px] border-gray-200 placeholder:text-gray-300 focus-visible:ring-[#0066FF]/30 focus-visible:border-[#0066FF]/60"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2.5">
              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 flex items-center justify-end gap-2">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Abbrechen
            </Button>
            <Button
              size="sm"
              className="h-8 text-xs bg-[#0066FF] hover:bg-blue-700 text-white shadow-sm"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin mr-1.5" />
                  Wird gespeichert...
                </>
              ) : (
                "Behandlung anwenden"
              )}
            </Button>
          </div>
        </div>
        </>}
      </DialogContent>
    </Dialog>
  );
}

// ─── Issue Detail Sheet ───────────────────────────────────────────────────────

function IssueDetailSheet({
  issue,
  open,
  onOpenChange,
  onSnoozed,
}: {
  issue: Issue | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSnoozed: () => void;
}) {
  const [occurrences, setOccurrences] = useState<Occurrence[]>([]);
  const [occLoading, setOccLoading] = useState(false);
  const [treatOpen, setTreatOpen] = useState(false);

  useEffect(() => {
    if (!issue || !open) return;
    setOccurrences([]);
    setOccLoading(true);
    fetch(`/api/intruder/v1/issues/${issue.id}/occurrences`)
      .then((r) => r.json())
      .then((data: PaginatedResponse<Occurrence> | Occurrence[]) => {
        const list = Array.isArray(data) ? data : (data.results ?? []);
        setOccurrences(list);
      })
      .catch(() => setOccurrences([]))
      .finally(() => setOccLoading(false));
  }, [issue, open]);

  if (!issue) return null;

  return (
    <>
      {/* Treatment Dialog */}
      <TreatmentDialog
        issue={issue}
        open={treatOpen}
        onOpenChange={setTreatOpen}
        onSuccess={onSnoozed}
      />

      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-2xl overflow-y-auto p-0"
        >
          <SheetHeader className="px-6 py-5 border-b border-gray-100 sticky top-0 bg-white z-10">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <SheetTitle className="text-base font-semibold text-gray-900 leading-snug">
                  {issue.title}
                </SheetTitle>
                <div className="flex items-center flex-wrap gap-2 mt-2">
                  <SeverityBadge severity={issue.severity} />
                  <ExploitBadge likelihood={issue.exploit_likelihood} />
                  {issue.cvss_score !== null && (
                    <CvssIndicator score={issue.cvss_score} />
                  )}
                  {issue.snoozed && (
                    <button
                      onClick={() => setTreatOpen(true)}
                      className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full font-medium hover:bg-green-100 transition-colors cursor-pointer"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      {issue.snooze_reason === "ACCEPT_RISK" ? "Risiko akzeptiert"
                        : issue.snooze_reason === "FALSE_POSITIVE" ? "Fehlalarm"
                        : issue.snooze_reason === "MITIGATING_CONTROLS" ? "Kompensiert"
                        : "Behandelt"}
                      {issue.snooze_until ? (
                        <span className="text-green-500 font-normal ml-0.5">
                          bis {new Date(issue.snooze_until).toLocaleDateString("de-DE")}
                        </span>
                      ) : (
                        <span className="text-green-500 font-normal ml-0.5">dauerhaft</span>
                      )}
                    </button>
                  )}
                </div>
              </div>
              {!issue.snoozed && (
                <Button
                  size="sm"
                  className="shrink-0 bg-[#0066FF] hover:bg-blue-700 text-white h-8 text-xs"
                  onClick={() => setTreatOpen(true)}
                >
                  <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />
                  Behandeln
                </Button>
              )}
            </div>
          </SheetHeader>

          <div className="px-6 py-5 space-y-6">
            {/* CVSS Score Gauge + Key Metrics */}
            {(() => {
              const bestCvss = occurrences.reduce((max, o) => Math.max(max, o.cvss_score ?? 0), issue.cvss_score ?? 0);
              const allCves = [...new Set(occurrences.flatMap((o) => o.cves ?? []))];
              const bestExploit = occurrences.find((o) => o.exploit_likelihood)?.exploit_likelihood ?? issue.exploit_likelihood;
              const oldestAge = occurrences.reduce((oldest, o) => {
                if (!o.age) return oldest;
                const days = parseInt(o.age);
                return days > oldest ? days : oldest;
              }, 0);

              return (bestCvss > 0 || allCves.length > 0 || oldestAge > 0) ? (
                <section className="grid grid-cols-3 gap-4">
                  {/* CVSS Gauge */}
                  {bestCvss > 0 && (
                    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 flex flex-col items-center justify-center">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-2">CVSS Score</p>
                      <div className="relative w-20 h-20">
                        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                          <circle cx="18" cy="18" r="15.5" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                          <circle
                            cx="18" cy="18" r="15.5" fill="none"
                            stroke={bestCvss >= 9 ? "#ef4444" : bestCvss >= 7 ? "#f97316" : bestCvss >= 4 ? "#eab308" : "#3b82f6"}
                            strokeWidth="3"
                            strokeDasharray={`${(bestCvss / 10) * 97.4} 97.4`}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className={cn("text-lg font-bold", bestCvss >= 9 ? "text-red-600" : bestCvss >= 7 ? "text-orange-600" : bestCvss >= 4 ? "text-amber-600" : "text-blue-600")}>
                            {bestCvss.toFixed(1)}
                          </span>
                        </div>
                      </div>
                      <p className={cn("text-xs font-semibold mt-1", bestCvss >= 9 ? "text-red-600" : bestCvss >= 7 ? "text-orange-600" : bestCvss >= 4 ? "text-amber-600" : "text-blue-600")}>
                        {bestCvss >= 9 ? "Critical" : bestCvss >= 7 ? "High" : bestCvss >= 4 ? "Medium" : "Low"}
                      </p>
                    </div>
                  )}

                  {/* Age + Exploit */}
                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 flex flex-col justify-center gap-3">
                    {oldestAge > 0 && (
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Alter</p>
                        <p className={cn("text-xl font-bold mt-0.5", oldestAge > 90 ? "text-red-600" : oldestAge > 30 ? "text-orange-600" : "text-gray-700")}>
                          {oldestAge} Tage
                        </p>
                        {oldestAge > 90 && <p className="text-[10px] text-red-500 font-medium">Sofort beheben!</p>}
                      </div>
                    )}
                    {bestExploit && (
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Exploit</p>
                        <div className="mt-1"><ExploitBadge likelihood={bestExploit} /></div>
                      </div>
                    )}
                  </div>

                  {/* CVE List */}
                  {allCves.length > 0 && (
                    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-2">CVEs ({allCves.length})</p>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {allCves.map((cve) => (
                          <a
                            key={cve}
                            href={`https://nvd.nist.gov/vuln/detail/${cve}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 font-mono text-xs text-red-600 hover:text-red-800 hover:underline transition-colors"
                          >
                            <ShieldAlert className="w-3 h-3 flex-shrink-0" />
                            {cve}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </section>
              ) : null;
            })()}

            {/* Description */}
            {issue.description && (
              <section>
                <div className="flex items-center gap-2 mb-2">
                  <Info className="w-4 h-4 text-gray-400" />
                  <h3 className="text-sm font-semibold text-gray-700">
                    Beschreibung
                  </h3>
                </div>
                <div className="text-sm text-gray-600 leading-relaxed bg-gray-50 rounded-lg px-4 py-3 border border-gray-100">
                  <RichText text={issue.description} />
                </div>
              </section>
            )}

            {/* Remediation */}
            {issue.remediation && (
              <section>
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <h3 className="text-sm font-semibold text-gray-700">
                    Empfehlung zur Behebung
                  </h3>
                </div>
                <div className="text-sm text-gray-600 leading-relaxed bg-emerald-50 rounded-lg px-4 py-3 border border-emerald-100">
                  <RichText text={issue.remediation} />
                </div>
              </section>
            )}

            {/* Occurrences */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Globe className="w-4 h-4 text-gray-400" />
                <h3 className="text-sm font-semibold text-gray-700">
                  Betroffene Systeme
                </h3>
                {!occLoading && (
                  <span className="ml-auto text-xs text-gray-400">
                    {occurrences.length} {occurrences.length === 1 ? "System" : "Systeme"}
                  </span>
                )}
              </div>

              {occLoading ? (
                <div className="py-8 text-center">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto text-[#0066FF]" />
                </div>
              ) : occurrences.length === 0 ? (
                <p className="text-xs text-gray-400 py-4 text-center">
                  Keine betroffenen Systeme gefunden
                </p>
              ) : (
                <div className="space-y-2">
                  {occurrences.map((occ) => (
                    <div
                      key={occ.id}
                      className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <Globe className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            <p className="text-sm font-semibold text-gray-800 truncate">
                              {occ.display_address || occ.target}
                            </p>
                            {occ.port && (
                              <span className="text-xs font-mono bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                                :{occ.port}/{occ.protocol || "tcp"}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center flex-wrap gap-x-3 gap-y-1.5 mt-2">
                            {/* Per-occurrence CVSS */}
                            {occ.cvss_score != null && occ.cvss_score > 0 && (
                              <span className={cn(
                                "text-xs font-bold px-2 py-0.5 rounded-full",
                                occ.cvss_score >= 9 ? "bg-red-100 text-red-700" :
                                occ.cvss_score >= 7 ? "bg-orange-100 text-orange-700" :
                                occ.cvss_score >= 4 ? "bg-amber-100 text-amber-700" :
                                "bg-blue-100 text-blue-700"
                              )}>
                                CVSS {occ.cvss_score.toFixed(1)}
                              </span>
                            )}

                            {/* Per-occurrence exploit */}
                            {occ.exploit_likelihood && (
                              <ExploitBadge likelihood={occ.exploit_likelihood} />
                            )}

                            {/* Age */}
                            {occ.age && (
                              <span className={cn(
                                "text-xs flex items-center gap-1",
                                parseInt(occ.age) > 90 ? "text-red-500 font-semibold" :
                                parseInt(occ.age) > 30 ? "text-orange-500" : "text-gray-400"
                              )}>
                                <Clock className="w-3 h-3" />
                                {occ.age}
                              </span>
                            )}

                            {/* First seen */}
                            {occ.first_seen_at && (
                              <span className="text-xs text-gray-400 flex items-center gap-1">
                                Entdeckt {formatDate(occ.first_seen_at)}
                              </span>
                            )}
                          </div>

                          {/* CVEs */}
                          {occ.cves && occ.cves.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {occ.cves.map((cve) => (
                                <a
                                  key={cve}
                                  href={`https://nvd.nist.gov/vuln/detail/${cve}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-mono text-[11px] bg-red-50 text-red-600 border border-red-100 px-1.5 py-0.5 rounded hover:bg-red-100 transition-colors"
                                >
                                  {cve}
                                </a>
                              ))}
                            </div>
                          )}

                          {/* Extra info (AWS resources etc.) */}
                          {occ.extra_info && Object.keys(occ.extra_info).length > 0 && (
                            <div className="mt-2 rounded-md bg-gray-950 text-[11px] font-mono p-2.5 space-y-0.5">
                              {Object.entries(occ.extra_info).map(([key, val]) => (
                                <div key={key}>
                                  <span className="text-gray-500">{key}: </span>
                                  <span className="text-cyan-400">{val}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <ScannerOutputBlock
                          issueId={issue.id}
                          occurrenceId={occ.id}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </SheetContent>
      </Sheet>

      {/* Snooze passiert jetzt über Maßnahmen */}
    </>
  );
}

// ─── Filter Bar ───────────────────────────────────────────────────────────────

interface FilterState {
  tagNames: string;
  targetAddresses: string;
  severity: string;
  since: string;
}

const DEFAULT_FILTERS: FilterState = {
  tagNames: "",
  targetAddresses: "",
  severity: "all",
  since: "",
};

interface TargetTag {
  name: string;
  targetCount: number;
}

function FilterBar({
  filters,
  onChange,
  onApply,
  onReset,
}: {
  filters: FilterState;
  onChange: (f: FilterState) => void;
  onApply: () => void;
  onReset: () => void;
}) {
  const [availableTags, setAvailableTags] = useState<TargetTag[]>([]);
  const [tagsLoading, setTagsLoading] = useState(true);

  // Fetch targets and extract unique tags
  useEffect(() => {
    fetch("/api/intruder/v1/targets/?limit=200")
      .then((r) => r.json())
      .then((data) => {
        const targets = Array.isArray(data) ? data : data.results ?? [];
        const tagMap = new Map<string, number>();
        for (const target of targets) {
          const tags: Array<string | { name?: string }> = target.tags ?? [];
          for (const tag of tags) {
            const name = typeof tag === "string" ? tag : (tag as { name?: string })?.name ?? "";
            if (name) tagMap.set(name, (tagMap.get(name) || 0) + 1);
          }
        }
        setAvailableTags(
          Array.from(tagMap.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([name, targetCount]) => ({ name, targetCount }))
        );
      })
      .catch(() => setAvailableTags([]))
      .finally(() => setTagsLoading(false));
  }, []);

  const selectedTags = filters.tagNames
    ? filters.tagNames.split(",").map((t) => t.trim()).filter(Boolean)
    : [];

  const toggleTag = (tagName: string) => {
    const next = selectedTags.includes(tagName)
      ? selectedTags.filter((t) => t !== tagName)
      : [...selectedTags, tagName];
    onChange({ ...filters, tagNames: next.join(",") });
    // Auto-apply when toggling tags
    setTimeout(() => onApply(), 0);
  };

  const hasActive =
    filters.tagNames ||
    filters.targetAddresses ||
    filters.severity !== "all" ||
    filters.since;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4 space-y-3">
      {/* Tag chips row */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-semibold text-gray-700">Kundenumgebung (Tags)</span>
          {hasActive && (
            <button
              onClick={onReset}
              className="ml-auto flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Zurücksetzen
            </button>
          )}
        </div>
        {tagsLoading ? (
          <div className="flex items-center gap-2 py-1">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-300" />
            <span className="text-xs text-gray-400">Lade Tags...</span>
          </div>
        ) : availableTags.length === 0 ? (
          <p className="text-xs text-gray-400">Keine Tags in Intruder konfiguriert</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {availableTags.map((tag) => {
              const isActive = selectedTags.includes(tag.name);
              return (
                <button
                  key={tag.name}
                  onClick={() => toggleTag(tag.name)}
                  className={cn(
                    "inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-all",
                    isActive
                      ? "bg-[#0066FF] text-white border-[#0066FF] shadow-sm"
                      : "bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-100"
                  )}
                >
                  {isActive && <CheckCircle2 className="w-3 h-3" />}
                  {tag.name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Additional filters */}
      <div className="grid grid-cols-3 gap-3 pt-1 border-t border-gray-100">
        <div className="space-y-1">
          <Label className="text-xs text-gray-500 font-medium">Schwere</Label>
          <Select
            value={filters.severity}
            onValueChange={(v) => {
              onChange({ ...filters, severity: v });
              setTimeout(() => onApply(), 0);
            }}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Alle" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle</SelectItem>
              <SelectItem value="critical">Kritisch</SelectItem>
              <SelectItem value="high">Hoch</SelectItem>
              <SelectItem value="medium">Mittel</SelectItem>
              <SelectItem value="low">Niedrig</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-gray-500 font-medium">Ziele</Label>
          <Input
            className="h-8 text-xs"
            placeholder="z.B. 192.168.1.1"
            value={filters.targetAddresses}
            onChange={(e) =>
              onChange({ ...filters, targetAddresses: e.target.value })
            }
            onKeyDown={(e) => e.key === "Enter" && onApply()}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-gray-500 font-medium">Seit</Label>
          <Input
            className="h-8 text-xs"
            type="date"
            value={filters.since}
            onChange={(e) => {
              onChange({ ...filters, since: e.target.value });
              setTimeout(() => onApply(), 0);
            }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Current Issues Tab ───────────────────────────────────────────────────────

interface TargetGroup {
  target: string;
  issues: Issue[];
}

function CurrentIssuesTab() {
  const searchParams = useSearchParams();
  const [allIssues, setAllIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [issueTargets, setIssueTargets] = useState<Record<string, string[]>>({});
  const [collapsedTargets, setCollapsedTargets] = useState<Set<string>>(new Set());

  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [debouncedFilters, setDebouncedFilters] = useState<FilterState>(DEFAULT_FILTERS);

  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Debounce filter changes - apply after 300ms of no changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilters(filters);
      setOffset(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [filters]);

  const fetchIssues = useCallback(
    async (currentOffset: number, f: FilterState) => {
      setLoading(true);
      const params = new URLSearchParams({
        limit: "200",
        offset: "0",
      });
      if (f.tagNames) params.set("tag_names", f.tagNames);
      if (f.targetAddresses) params.set("target_addresses", f.targetAddresses);
      if (f.severity && f.severity !== "all") params.set("severity", f.severity);
      if (f.since) params.set("since", f.since);

      try {
        const res = await fetch(`/api/intruder/v1/issues/?${params}`);
        const data: PaginatedResponse<Issue> = await res.json();
        const issueList = data.results ?? [];
        setAllIssues(issueList);
        setTotal(data.count ?? issueList.length);

        // Use _targetMap from the proxy response (injected server-side)
        // This avoids N+1 occurrence calls from the frontend
        const serverTargetMap: Record<string, string[]> = (data as unknown as Record<string, unknown>)._targetMap as Record<string, string[]> ?? {};
        const targetMap: Record<string, string[]> = {};
        for (const issue of issueList) {
          const mapped = serverTargetMap[String(issue.id)];
          if (mapped && mapped.length > 0) {
            targetMap[issue.id] = mapped;
          }
        }
        setIssueTargets(targetMap);
      } catch {
        setAllIssues([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchIssues(offset, debouncedFilters);
  }, [fetchIssues, offset, debouncedFilters]);

  // Auto-open issue sheet from URL param ?issue=ID (runs once when issues load)
  const [deepLinkHandled, setDeepLinkHandled] = useState(false);
  useEffect(() => {
    if (deepLinkHandled || allIssues.length === 0) return;
    const issueId = searchParams.get("issue");
    if (issueId) {
      const found = allIssues.find(i => String(i.id) === issueId);
      if (found) {
        setSelectedIssue(found);
        setSheetOpen(true);
      }
      setDeepLinkHandled(true);
      // Clean URL without reload
      window.history.replaceState({}, "", "/vulnerabilities/issues");
    }
  }, [allIssues, searchParams, deepLinkHandled]);

  const handleApply = () => {
    setOffset(0);
    setDebouncedFilters({ ...filters });
  };

  const handleReset = () => {
    setFilters(DEFAULT_FILTERS);
    setOffset(0);
    setDebouncedFilters(DEFAULT_FILTERS);
  };

  const handleRowClick = (issue: Issue) => {
    setSelectedIssue(issue);
    setSheetOpen(true);
  };

  const toggleTarget = (target: string) => {
    setCollapsedTargets((prev) => {
      const next = new Set(prev);
      if (next.has(target)) next.delete(target);
      else next.add(target);
      return next;
    });
  };

  // Client-side pagination
  const issues = allIssues.slice(offset, offset + PAGE_SIZE);

  // Group ALL issues by target (global, not per page)
  const targetGroups: TargetGroup[] = (() => {
    const map = new Map<string, Issue[]>();
    for (const issue of allIssues) {
      const targets = issueTargets[issue.id];
      if (!targets || targets.length === 0) {
        const key = "Unbekanntes Ziel";
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(issue);
      } else {
        for (const t of targets) {
          if (!map.has(t)) map.set(t, []);
          map.get(t)!.push(issue);
        }
      }
    }
    // Sort: most issues first
    return Array.from(map.entries())
      .sort((a, b) => b[1].length - a[1].length)
      .map(([target, issues]) => ({ target, issues }));
  })();

  // Severity summary for a target group
  const severitySummary = (groupIssues: Issue[]) => {
    const counts: Record<string, number> = {};
    for (const i of groupIssues) {
      const s = i.severity?.toLowerCase() || "unknown";
      counts[s] = (counts[s] || 0) + 1;
    }
    return counts;
  };

  return (
    <div className="space-y-4">
      <FilterBar
        filters={filters}
        onChange={setFilters}
        onApply={handleApply}
        onReset={handleReset}
      />

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            <h2 className="text-sm font-semibold text-gray-800">
              Aktuelle Issues
            </h2>
            {!loading && (
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                {total}
              </span>
            )}
          </div>
          {!loading && targetGroups.length > 0 && (
            <p className="text-xs text-gray-400">
              {targetGroups.length} Target{targetGroups.length !== 1 ? "s" : ""}
            </p>
          )}
        </div>

        {loading ? (
          <LoadingState />
        ) : issues.length === 0 ? (
          <EmptyState message="Keine aktiven Issues gefunden" />
        ) : (
          <div className="divide-y divide-gray-100">
            {targetGroups.map((group) => {
              const isCollapsed = collapsedTargets.has(group.target);
              const counts = severitySummary(group.issues);
              return (
                <div key={group.target}>
                  {/* Target Header */}
                  <button
                    onClick={() => toggleTarget(group.target)}
                    className="w-full flex items-center gap-3 px-6 py-3.5 bg-gray-50/80 hover:bg-gray-100/80 transition-colors text-left"
                  >
                    <ChevronRight
                      className={cn(
                        "w-4 h-4 text-gray-400 transition-transform flex-shrink-0",
                        !isCollapsed && "rotate-90"
                      )}
                    />
                    <Globe className="w-4 h-4 text-[#0066FF] flex-shrink-0" />
                    <span className="text-sm font-semibold text-gray-800 font-mono">
                      {group.target}
                    </span>
                    <span className="text-xs text-gray-400 ml-1">
                      {group.issues.length} Issue{group.issues.length !== 1 ? "s" : ""}
                    </span>
                    <div className="ml-auto flex items-center gap-1.5">
                      {counts.critical && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-100 px-1.5 py-0.5 rounded">
                          {counts.critical} Krit.
                        </span>
                      )}
                      {counts.high && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-orange-700 bg-orange-100 px-1.5 py-0.5 rounded">
                          {counts.high} Hoch
                        </span>
                      )}
                      {counts.medium && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                          {counts.medium} Mittel
                        </span>
                      )}
                      {counts.low && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">
                          {counts.low} Niedrig
                        </span>
                      )}
                    </div>
                  </button>

                  {/* Issues under this target */}
                  {!isCollapsed && (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-50 bg-white text-xs text-gray-400">
                          <th className="text-left py-2 px-6 pl-14 font-medium">Schwere</th>
                          <th className="text-left py-2 px-4 font-medium">Titel</th>
                          <th className="text-left py-2 px-4 font-medium">CVSS</th>
                          <th className="text-left py-2 px-4 font-medium">Exploit</th>
                          <th className="text-center py-2 px-4 font-medium w-16">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {group.issues.map((issue) => (
                          <tr
                            key={issue.id}
                            className="hover:bg-blue-50/40 transition-colors cursor-pointer group"
                            onClick={() => handleRowClick(issue)}
                          >
                            <td className="py-3 px-6 pl-14 w-28">
                              <SeverityBadge severity={issue.severity} />
                            </td>
                            <td className="py-3 px-4">
                              <p className="font-medium text-gray-800 group-hover:text-[#0066FF] transition-colors leading-snug">
                                {issue.title}
                              </p>
                              {issue.description && (
                                <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">
                                  {issue.description.slice(0, 120)}
                                </p>
                              )}
                            </td>
                            <td className="py-3 px-4 w-28">
                              <CvssIndicator score={issue.cvss_score} />
                            </td>
                            <td className="py-3 px-4 w-40">
                              <ExploitBadge likelihood={issue.exploit_likelihood} />
                            </td>
                            <td className="py-3 px-4 text-center w-20">
                              {issue.snoozed ? (
                                <span title="Behandelt" className="inline-flex items-center gap-1 text-[10px] font-medium text-green-700 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Behandelt
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded">
                                  Offen
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {!loading && total > PAGE_SIZE && (
          <Pagination
            offset={offset}
            limit={PAGE_SIZE}
            total={total}
            onPrev={() => setOffset((o) => Math.max(0, o - PAGE_SIZE))}
            onNext={() => setOffset((o) => o + PAGE_SIZE)}
          />
        )}
      </div>

      <IssueDetailSheet
        issue={selectedIssue}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onSnoozed={() => fetchIssues(offset, debouncedFilters)}
      />
    </div>
  );
}

// ─── Fixed Occurrences Tab ────────────────────────────────────────────────────

function FixedTab() {
  const [items, setItems] = useState<FixedOccurrence[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({
      limit: String(PAGE_SIZE),
      offset: String(offset),
    });
    fetch(`/api/intruder/v1/occurrences/fixed/?${params}`)
      .then((r) => r.json())
      .then((data: PaginatedResponse<FixedOccurrence>) => {
        setItems(data.results ?? []);
        setTotal(data.count ?? 0);
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [offset]);

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
        <h2 className="text-sm font-semibold text-gray-800">
          Behobene Issues
        </h2>
        {!loading && (
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
            {total}
          </span>
        )}
      </div>

      {loading ? (
        <LoadingState />
      ) : items.length === 0 ? (
        <EmptyState message="Keine behobenen Issues gefunden" />
      ) : (
        <>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60 text-xs text-gray-500">
                <th className="text-left py-3 px-6 font-semibold">Schwere</th>
                <th className="text-left py-3 px-4 font-semibold">Titel</th>
                <th className="text-left py-3 px-4 font-semibold">Zieladresse</th>
                <th className="text-center py-3 px-4 font-semibold">Port</th>
                <th className="text-left py-3 px-4 font-semibold">CVSS</th>
                <th className="text-center py-3 px-4 font-semibold">
                  Behoben am
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {items.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-emerald-50/30 transition-colors"
                >
                  <td className="py-3.5 px-6 w-32">
                    <SeverityBadge severity={item.severity} />
                  </td>
                  <td className="py-3.5 px-4">
                    <p className="font-medium text-gray-800 leading-snug">
                      {item.title}
                    </p>
                  </td>
                  <td className="py-3.5 px-4 text-xs text-gray-600 font-mono">
                    {item.display_address || item.affected_host || "—"}
                  </td>
                  <td className="py-3.5 px-4 text-center text-xs font-mono text-gray-500">
                    {item.affected_port ?? "—"}
                  </td>
                  <td className="py-3.5 px-4 w-36">
                    <CvssIndicator score={item.cvss_score} />
                  </td>
                  <td className="py-3.5 px-4 text-center text-xs text-gray-500">
                    {formatDate(item.remediated_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination
            offset={offset}
            limit={PAGE_SIZE}
            total={total}
            onPrev={() => setOffset((o) => Math.max(0, o - PAGE_SIZE))}
            onNext={() => setOffset((o) => o + PAGE_SIZE)}
          />
        </>
      )}
    </div>
  );
}

// ─── Snoozed Tab ─────────────────────────────────────────────────────────────

function SnoozedTab() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const fetchSnoozed = useCallback(async (currentOffset: number) => {
    setLoading(true);
    const params = new URLSearchParams({
      snoozed: "true",
      limit: String(PAGE_SIZE),
      offset: String(currentOffset),
    });
    try {
      const res = await fetch(`/api/intruder/v1/issues/?${params}`);
      const data: PaginatedResponse<Issue> = await res.json();
      setIssues(data.results ?? []);
      setTotal(data.count ?? 0);
    } catch {
      setIssues([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSnoozed(offset);
  }, [fetchSnoozed, offset]);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <Moon className="w-4 h-4 text-indigo-500" />
          <h2 className="text-sm font-semibold text-gray-800">
            Zurückgestellte Issues
          </h2>
          {!loading && (
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
              {total}
            </span>
          )}
        </div>

        {loading ? (
          <LoadingState />
        ) : issues.length === 0 ? (
          <EmptyState message="Keine zurückgestellten Issues" />
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60 text-xs text-gray-500">
                  <th className="text-left py-3 px-6 font-semibold">Schwere</th>
                  <th className="text-left py-3 px-4 font-semibold">Titel</th>
                  <th className="text-left py-3 px-4 font-semibold">CVSS</th>
                  <th className="text-left py-3 px-4 font-semibold">Grund</th>
                  <th className="text-center py-3 px-4 font-semibold">
                    Zurückgestellt bis
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {issues.map((issue) => {
                  const reasonLabel =
                    SNOOZE_REASON_LABELS[issue.snooze_reason ?? ""] ??
                    issue.snooze_reason ??
                    "—";
                  return (
                    <tr
                      key={issue.id}
                      className="hover:bg-indigo-50/30 transition-colors cursor-pointer group"
                      onClick={() => {
                        setSelectedIssue(issue);
                        setSheetOpen(true);
                      }}
                    >
                      <td className="py-3.5 px-6 w-32">
                        <SeverityBadge severity={issue.severity} />
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-medium text-gray-800 group-hover:text-[#0066FF] transition-colors leading-snug">
                          {issue.title}
                        </p>
                      </td>
                      <td className="py-3.5 px-4 w-36">
                        <CvssIndicator score={issue.cvss_score} />
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 text-xs text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
                          <Moon className="w-3 h-3" />
                          {reasonLabel}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center text-xs text-gray-500">
                        {issue.snooze_until
                          ? formatDate(issue.snooze_until)
                          : <span className="text-gray-400">Dauerhaft</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <Pagination
              offset={offset}
              limit={PAGE_SIZE}
              total={total}
              onPrev={() => setOffset((o) => Math.max(0, o - PAGE_SIZE))}
              onNext={() => setOffset((o) => o + PAGE_SIZE)}
            />
          </>
        )}
      </div>

      <IssueDetailSheet
        issue={selectedIssue}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onSnoozed={() => fetchSnoozed(offset)}
      />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function VulnerabilitiesIssuesPage() {
  return (
    <div className="p-8 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="p-1.5 rounded-lg bg-[#0066FF]/10">
              <ShieldAlert className="w-5 h-5 text-[#0066FF]" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              Vulnerability Management
            </h1>
          </div>
          <p className="text-sm text-gray-500 ml-10">
            Issues und Schwachstellen aus dem Intruder-Scanner
          </p>
        </div>
      </div>

      {/* Issues List - alles wird in Maßnahmen behandelt */}
      <CurrentIssuesTab />
    </div>
  );
}
