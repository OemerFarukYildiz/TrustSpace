"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import {
  Play,
  Square,
  CalendarClock,
  Trash2,
  Plus,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ScanLine,
  Target,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
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
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Scan {
  id: string;
  status: string;
  created_at: string;
  scan_type: string;
  schedule_period: string | null;
  target_addresses: string[];
  start_time: string | null;
  completed_time: string | null;
  throttled: boolean;
  web_ports_only: boolean;
}

interface ScansResponse {
  results?: Scan[];
  next?: string | null;
  previous?: string | null;
  count?: number;
}

interface Schedule {
  id: string;
  name: string;
  schedule_period: string;
  first_scan_time: string;
  next_scan_date: string | null;
  status: string;
  throttled: boolean;
  web_ports_only: boolean;
  latest_scan_id: string | null;
  latest_scan_status: string | null;
  targets: string[];
  target_tags: string[];
}

interface SchedulesResponse {
  results?: Schedule[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SCAN_TYPE_LABELS: Record<string, string> = {
  assessment_schedule: "Geplanter Scan",
  new_service: "Neuer Service",
  one_off: "Einmaliger Scan",
  rapid_remediation: "Schnelle Prüfung",
  cloud_security: "Cloud Security",
  container_image: "Container Scan",
};

const SCHEDULE_PERIOD_LABELS: Record<string, string> = {
  daily: "Täglich",
  weekly: "Wöchentlich",
  monthly: "Monatlich",
  quarterly: "Quartalsweise",
};

const COMPLETED_STATUS_CFG: Record<
  string,
  { label: string; cls: string; bg: string; icon: React.ReactNode }
> = {
  completed: {
    label: "Abgeschlossen",
    cls: "text-emerald-700",
    bg: "bg-emerald-50 border-emerald-200",
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
  cancelled: {
    label: "Abgebrochen",
    cls: "text-gray-500",
    bg: "bg-gray-50 border-gray-200",
    icon: <Square className="w-3 h-3" />,
  },
  failed: {
    label: "Fehlgeschlagen",
    cls: "text-red-700",
    bg: "bg-red-50 border-red-200",
    icon: <AlertCircle className="w-3 h-3" />,
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(d: string | null) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

function formatDateTime(d: string | null) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

function calcDuration(start: string | null, end: string | null) {
  if (!start || !end) return "—";
  try {
    const ms = new Date(end).getTime() - new Date(start).getTime();
    if (ms < 0) return "—";
    const totalSec = Math.floor(ms / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  } catch {
    return "—";
  }
}

// ─── Scan Terminal (animated live output) ────────────────────────────────────

const SCAN_PHASES = [
  { msg: "Initializing scan engine...", color: "text-gray-500" },
  { msg: "Loading vulnerability database (45,377 checks)...", color: "text-gray-500" },
  { msg: "Resolving DNS records...", color: "text-gray-500" },
  { msg: "TCP SYN scan on common ports (1-1024)...", color: "text-cyan-400" },
  { msg: "Service detection running...", color: "text-cyan-400" },
  { msg: "Checking port 22/tcp (ssh)...", color: "text-gray-500" },
  { msg: "Checking port 80/tcp (http)...", color: "text-gray-500" },
  { msg: "Checking port 443/tcp (https)...", color: "text-gray-500" },
  { msg: "SSL/TLS certificate analysis...", color: "text-cyan-400" },
  { msg: "TLS cipher suite enumeration...", color: "text-gray-500" },
  { msg: "HTTP header security analysis...", color: "text-cyan-400" },
  { msg: "Checking HSTS, CSP, X-Frame-Options...", color: "text-gray-500" },
  { msg: "CORS policy validation...", color: "text-gray-500" },
  { msg: "Web application fingerprinting...", color: "text-cyan-400" },
  { msg: "CMS detection (WordPress, Drupal, Joomla)...", color: "text-gray-500" },
  { msg: "Checking known CVEs for detected software...", color: "text-amber-400" },
  { msg: "SQL injection probe on form inputs...", color: "text-red-400" },
  { msg: "XSS reflection test on parameters...", color: "text-red-400" },
  { msg: "Directory traversal checks...", color: "text-gray-500" },
  { msg: "Authentication endpoint analysis...", color: "text-cyan-400" },
  { msg: "Cookie security flags validation...", color: "text-gray-500" },
  { msg: "Subresource integrity check...", color: "text-gray-500" },
  { msg: "DNS zone transfer attempt...", color: "text-amber-400" },
  { msg: "SMTP relay test...", color: "text-gray-500" },
  { msg: "Scanning high ports (8000-9999)...", color: "text-cyan-400" },
  { msg: "Checking for exposed admin panels...", color: "text-amber-400" },
  { msg: "API endpoint discovery...", color: "text-cyan-400" },
  { msg: "Brute-force default credentials check...", color: "text-red-400" },
  { msg: "Running OWASP Top 10 checks...", color: "text-amber-400" },
  { msg: "Testing for open redirects...", color: "text-gray-500" },
  { msg: "Checking server information disclosure...", color: "text-gray-500" },
  { msg: "Vulnerability correlation engine running...", color: "text-cyan-400" },
  { msg: "Calculating risk scores...", color: "text-cyan-400" },
];

function ScanTerminal({ scanId, targets, scanType, startTime, elapsedSec, progress }: {
  scanId: string;
  targets: string[];
  scanType: string;
  startTime: string | null;
  elapsedSec: number;
  progress: number;
}) {
  const termRef = useRef<HTMLDivElement>(null);

  // Number of lines to show based on elapsed time (new line every ~3 seconds)
  const lineCount = Math.min(Math.floor(elapsedSec / 3) + 3, SCAN_PHASES.length);

  // Auto-scroll to bottom
  useEffect(() => {
    if (termRef.current) {
      termRef.current.scrollTop = termRef.current.scrollHeight;
    }
  }, [lineCount]);

  const elapsedMin = Math.floor(elapsedSec / 60);
  const elapsedS = elapsedSec % 60;
  const targetStr = targets.length > 0 ? targets[0] : "all";

  return (
    <div className="mt-3 rounded-lg bg-gray-950 border border-gray-800 overflow-hidden">
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 border-b border-gray-800">
        <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
        <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
        <span className="ml-2 text-[10px] text-gray-500 font-mono">scan-{scanId} — {targetStr}</span>
        <span className="ml-auto text-[10px] text-emerald-500 font-mono animate-pulse">{elapsedMin}:{elapsedS.toString().padStart(2, "0")}</span>
      </div>
      <div ref={termRef} className="px-3 py-2.5 font-mono text-[11px] leading-[1.6] max-h-40 overflow-y-auto scrollbar-thin">
        <p className="text-emerald-400">$ intruder scan --target {targetStr} --type {scanType}</p>
        <p className="text-gray-600"># Scan started at {startTime ? new Date(startTime).toLocaleTimeString("de-DE") : "..."}</p>
        {targets.map((t) => (
          <p key={t} className="text-cyan-400">  [OK] {t} — host resolved</p>
        ))}
        {targets.length === 0 && <p className="text-cyan-400">  [OK] all targets — resolved</p>}

        {SCAN_PHASES.slice(0, lineCount).map((phase, i) => (
          <p key={i} className={phase.color}>
            <span className="text-gray-600">[+{Math.floor((i + 1) * 3 / 60)}m{((i + 1) * 3 % 60).toString().padStart(2, "0")}s]</span>{" "}
            {phase.msg}
          </p>
        ))}

        {/* Current action - always at the bottom, pulsing */}
        <p className="text-amber-400 flex items-center gap-1">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          {lineCount < SCAN_PHASES.length
            ? SCAN_PHASES[lineCount].msg.replace("...", "")
            : "Finalizing scan results"
          }... [{elapsedMin}m {elapsedS.toString().padStart(2, "0")}s elapsed]
        </p>
        <span className="inline-block w-1.5 h-3 bg-emerald-400 animate-pulse ml-0" />
      </div>
    </div>
  );
}

function ScanTypeBadge({ type }: { type: string }) {
  const label = SCAN_TYPE_LABELS[type] ?? type;
  return (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border border-blue-100 bg-blue-50 text-blue-700 font-medium">
      <ScanLine className="w-3 h-3" />
      {label}
    </span>
  );
}

function PeriodBadge({ period }: { period: string }) {
  const label = SCHEDULE_PERIOD_LABELS[period] ?? period;
  return (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border border-purple-100 bg-purple-50 text-purple-700 font-medium">
      <CalendarClock className="w-3 h-3" />
      {label}
    </span>
  );
}

// ─── Start Scan Dialog ─────────────────────────────────────────────────────────

interface StartScanDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface TargetOption {
  address: string;
  display_address: string;
  tags: string[];
}

function StartScanDialog({ open, onClose, onSuccess }: StartScanDialogProps) {
  const [mode, setMode] = useState<"all" | "targets" | "tags">("all");
  const [scanName, setScanName] = useState("");
  const [selectedTargets, setSelectedTargets] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load available tags + targets
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [availableTargets, setAvailableTargets] = useState<TargetOption[]>([]);
  useEffect(() => {
    if (!open) return;
    fetch("/api/intruder/v1/targets/?limit=100")
      .then((r) => r.json())
      .then((data) => {
        const tagSet = new Set<string>();
        const targets: TargetOption[] = [];
        for (const t of data.results ?? []) {
          for (const tag of t.tags ?? []) tagSet.add(tag);
          targets.push({ address: t.address, display_address: t.display_address, tags: t.tags ?? [] });
        }
        setAvailableTags(Array.from(tagSet).sort());
        setAvailableTargets(targets);
      })
      .catch(() => {});
  }, [open]);

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  function toggleTarget(addr: string) {
    setSelectedTargets((prev) =>
      prev.includes(addr) ? prev.filter((a) => a !== addr) : [...prev, addr]
    );
  }

  function reset() {
    setMode("all");
    setScanName("");
    setSelectedTargets([]);
    setSelectedTags([]);
    setError(null);
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {};
      if (mode === "targets" && selectedTargets.length > 0) {
        body.target_addresses = selectedTargets;
      }
      if (mode === "tags" && selectedTags.length > 0) {
        body.tag_names = selectedTags;
      }
      const res = await fetch("/api/intruder/v1/scans/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.detail ?? `Fehler ${res.status}`);
      }
      reset();
      onSuccess();
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unbekannter Fehler");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) { reset(); onClose(); }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Play className="w-4 h-4 text-[#0066FF]" />
            Scan starten
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-5 pt-1">
          {/* Targets select */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-700">Targets</Label>
            <Select value={mode} onValueChange={(v) => setMode(v as "all" | "targets" | "tags")}>
              <SelectTrigger className="text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Scan all targets</SelectItem>
                <SelectItem value="targets">Bestimmte Targets</SelectItem>
                <SelectItem value="tags">Nach Tags filtern</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Target selection */}
          {mode === "targets" && (
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700">Targets auswählen</Label>
              {availableTargets.length === 0 ? (
                <p className="text-xs text-gray-400 py-2">Keine Targets verfügbar</p>
              ) : (
                <div className="flex flex-col gap-1 p-2 border border-gray-200 rounded-lg bg-gray-50 max-h-40 overflow-y-auto">
                  {availableTargets.map((t) => {
                    const isSelected = selectedTargets.includes(t.address);
                    return (
                      <button
                        key={t.address}
                        type="button"
                        onClick={() => toggleTarget(t.address)}
                        className={cn(
                          "flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-lg border transition-colors text-left",
                          isSelected
                            ? "bg-[#0066FF]/10 text-[#0066FF] border-[#0066FF]/30 font-medium"
                            : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
                        )}
                      >
                        <div className={cn("w-4 h-4 rounded border flex items-center justify-center flex-shrink-0", isSelected ? "bg-[#0066FF] border-[#0066FF]" : "border-gray-300")}>
                          {isSelected && <span className="text-white text-[10px]">✓</span>}
                        </div>
                        <span className="font-mono">{t.display_address || t.address}</span>
                        {t.tags.length > 0 && (
                          <span className="ml-auto text-[10px] text-gray-400">{t.tags.join(", ")}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
              {selectedTargets.length > 0 && (
                <p className="text-xs text-[#0066FF]">{selectedTargets.length} Target{selectedTargets.length !== 1 ? "s" : ""} ausgewählt</p>
              )}
            </div>
          )}

          {/* Tag selection */}
          {mode === "tags" && (
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700">Tags auswählen</Label>
              {availableTags.length === 0 ? (
                <p className="text-xs text-gray-400 py-2">Keine Tags verfügbar</p>
              ) : (
                <div className="flex flex-wrap gap-1.5 p-2 border border-gray-200 rounded-lg bg-gray-50">
                  {availableTags.map((tag) => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={cn(
                          "inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-full border transition-colors font-medium",
                          isSelected
                            ? "bg-[#0066FF] text-white border-[#0066FF]"
                            : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                        )}
                      >
                        <Tag className="w-3 h-3" />
                        {tag}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Scan name */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-700">
              Scan name <span className="text-gray-400 font-normal">Optional</span>
            </Label>
            <Input
              placeholder="Add name or description"
              value={scanName}
              onChange={(e) => setScanName(e.target.value)}
              className="text-sm"
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          <div className="flex gap-2 justify-end pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => { reset(); onClose(); }}
              disabled={submitting}
            >
              Abbrechen
            </Button>
            <Button
              size="sm"
              className="bg-[#0066FF] hover:bg-blue-700"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Play className="w-4 h-4 mr-2" />
              )}
              Scan starten
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Create Schedule Dialog ────────────────────────────────────────────────────

interface CreateScheduleDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function CreateScheduleDialog({
  open,
  onClose,
  onSuccess,
}: CreateScheduleDialogProps) {
  const [name, setName] = useState("");
  const [scanDate, setScanDate] = useState("");
  const [scanTime, setScanTime] = useState("01:00");
  const [scanFrequency, setScanFrequency] = useState("weekly");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedTargets, setSelectedTargets] = useState<string[]>([]);
  const [targetMode, setTargetMode] = useState<"all" | "targets" | "tags">("all");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load available tags
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [availableTargets, setAvailableTargets] = useState<TargetOption[]>([]);
  useEffect(() => {
    if (!open) return;
    fetch("/api/intruder/v1/targets/?limit=100")
      .then((r) => r.json())
      .then((data) => {
        const tagSet = new Set<string>();
        const targets: TargetOption[] = [];
        for (const t of data.results ?? []) {
          for (const tag of t.tags ?? []) tagSet.add(tag);
          targets.push({ address: t.address, display_address: t.display_address, tags: t.tags ?? [] });
        }
        setAvailableTags(Array.from(tagSet).sort());
        setAvailableTargets(targets);
      })
      .catch(() => {});
  }, [open]);

  function toggleTarget(addr: string) {
    setSelectedTargets((prev) =>
      prev.includes(addr) ? prev.filter((a) => a !== addr) : [...prev, addr]
    );
  }

  function reset() {
    setName("");
    setScanDate("");
    setScanTime("01:00");
    setScanFrequency("weekly");
    setSelectedTags([]);
    setSelectedTargets([]);
    setTargetMode("all");
    setError(null);
  }

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  async function handleSubmit() {
    if (!name.trim() || !scanDate) {
      setError("Bitte Name und Datum angeben.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const firstScanTime = `${scanDate}T${scanTime}:00.000Z`;
      const body: Record<string, unknown> = {
        name: name.trim(),
        first_scan_time: firstScanTime,
        scan_frequency: scanFrequency,
      };
      if (targetMode === "targets" && selectedTargets.length > 0) {
        body.targets = selectedTargets;
      }
      if (targetMode === "tags" && selectedTags.length > 0) {
        body.tags = selectedTags;
      }
      const res = await fetch("/api/intruder/v1/scans/schedules/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.detail ?? JSON.stringify(data).slice(0, 120));
      }
      reset();
      onSuccess();
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unbekannter Fehler");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) { reset(); onClose(); }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <CalendarClock className="w-4 h-4 text-[#0066FF]" />
            Schedule scan
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-1">
          {/* Targets */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-700">Targets</Label>
            <Select value={targetMode} onValueChange={(v) => setTargetMode(v as "all" | "targets" | "tags")}>
              <SelectTrigger className="text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Scan all targets</SelectItem>
                <SelectItem value="targets">Bestimmte Targets</SelectItem>
                <SelectItem value="tags">Nach Tags filtern</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Target selection */}
          {targetMode === "targets" && (
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700">Targets auswählen</Label>
              {availableTargets.length === 0 ? (
                <p className="text-xs text-gray-400 py-2">Keine Targets verfügbar</p>
              ) : (
                <div className="flex flex-col gap-1 p-2 border border-gray-200 rounded-lg bg-gray-50 max-h-40 overflow-y-auto">
                  {availableTargets.map((t) => {
                    const isSelected = selectedTargets.includes(t.address);
                    return (
                      <button
                        key={t.address}
                        type="button"
                        onClick={() => toggleTarget(t.address)}
                        className={cn(
                          "flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-lg border transition-colors text-left",
                          isSelected
                            ? "bg-[#0066FF]/10 text-[#0066FF] border-[#0066FF]/30 font-medium"
                            : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
                        )}
                      >
                        <div className={cn("w-4 h-4 rounded border flex items-center justify-center flex-shrink-0", isSelected ? "bg-[#0066FF] border-[#0066FF]" : "border-gray-300")}>
                          {isSelected && <span className="text-white text-[10px]">✓</span>}
                        </div>
                        <span className="font-mono">{t.display_address || t.address}</span>
                        {t.tags.length > 0 && (
                          <span className="ml-auto text-[10px] text-gray-400">{t.tags.join(", ")}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
              {selectedTargets.length > 0 && (
                <p className="text-xs text-[#0066FF]">{selectedTargets.length} Target{selectedTargets.length !== 1 ? "s" : ""} ausgewählt</p>
              )}
            </div>
          )}

          {/* Tag selection */}
          {targetMode === "tags" && (
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700">Tags auswählen</Label>
              {availableTags.length === 0 ? (
                <p className="text-xs text-gray-400 py-2">Keine Tags verfügbar</p>
              ) : (
                <div className="flex flex-wrap gap-1.5 p-2 border border-gray-200 rounded-lg bg-gray-50 max-h-32 overflow-y-auto">
                  {availableTags.map((tag) => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={cn(
                          "inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-full border transition-colors font-medium",
                          isSelected
                            ? "bg-[#0066FF] text-white border-[#0066FF]"
                            : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                        )}
                      >
                        <Tag className="w-3 h-3" />
                        {tag}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Date + Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700">Datum</Label>
              <Input
                type="date"
                value={scanDate}
                onChange={(e) => setScanDate(e.target.value)}
                className="text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700">Uhrzeit</Label>
              <Select value={scanTime} onValueChange={setScanTime}>
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 24 }, (_, i) => {
                    const h = i.toString().padStart(2, "0");
                    return (
                      <SelectItem key={h} value={`${h}:00`}>{h}:00</SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Frequency */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-700">Repeat</Label>
            <Select value={scanFrequency} onValueChange={setScanFrequency}>
              <SelectTrigger className="text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Täglich</SelectItem>
                <SelectItem value="weekly">Wöchentlich</SelectItem>
                <SelectItem value="monthly">Monatlich</SelectItem>
                <SelectItem value="quarterly">Quartalsweise</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Scan name */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-700">
              Scan name <span className="text-gray-400 font-normal">Optional</span>
            </Label>
            <Input
              placeholder="Add name or description"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-sm"
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          <div className="flex gap-2 justify-end pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => { reset(); onClose(); }}
              disabled={submitting}
            >
              Abbrechen
            </Button>
            <Button
              size="sm"
              className="bg-[#0066FF] hover:bg-blue-700"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CalendarClock className="w-4 h-4 mr-2" />
              )}
              Zeitplan erstellen
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ScansPage() {
  // Running scans
  const [runningScans, setRunningScans] = useState<Scan[]>([]);
  const [runningLoading, setRunningLoading] = useState(true);
  const [cancellingIds, setCancellingIds] = useState<Set<string>>(new Set());

  // Completed scans
  const [completedScans, setCompletedScans] = useState<Scan[]>([]);
  const [completedLoading, setCompletedLoading] = useState(true);
  const [completedPage, setCompletedPage] = useState(1);
  const [completedHasNext, setCompletedHasNext] = useState(false);
  const [completedHasPrev, setCompletedHasPrev] = useState(false);
  const PAGE_SIZE = 10;

  // Schedules
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [schedulesLoading, setSchedulesLoading] = useState(true);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  // Dialogs
  const [showStartDialog, setShowStartDialog] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [tick, setTick] = useState(0); // Forces re-render every second for live timer

  // ── Fetch running scans ──────────────────────────────────────────────────
  const fetchRunning = useCallback(async () => {
    try {
      const res = await fetch("/api/intruder/v1/scans/?status=in_progress");
      if (res.ok) {
        const data: ScansResponse = await res.json();
        setRunningScans(data.results ?? []);
      }
    } catch {
      // silently fail on background poll
    } finally {
      setRunningLoading(false);
    }
  }, []);

  // ── Fetch completed scans (with target details) ─────────────────────────
  const fetchCompleted = useCallback(async (page: number) => {
    setCompletedLoading(true);
    try {
      const offset = (page - 1) * PAGE_SIZE;
      const res = await fetch(
        `/api/intruder/v1/scans/?status=completed&limit=${PAGE_SIZE}&offset=${offset}`
      );
      if (res.ok) {
        const data: ScansResponse = await res.json();
        const scans = data.results ?? [];

        // Fetch target_addresses for each scan (parallel)
        const enriched = await Promise.all(
          scans.map(async (scan) => {
            try {
              const detailRes = await fetch(`/api/intruder/v1/scans/${scan.id}/`);
              if (detailRes.ok) {
                const detail = await detailRes.json();
                return { ...scan, target_addresses: detail.target_addresses ?? [], start_time: detail.start_time, completed_time: detail.completed_time };
              }
            } catch { /* ignore */ }
            return scan;
          })
        );

        setCompletedScans(enriched);
        setCompletedHasNext(!!data.next);
        setCompletedHasPrev(!!data.previous);
      }
    } catch {
      // ignore
    } finally {
      setCompletedLoading(false);
    }
  }, []);

  // ── Fetch schedules ──────────────────────────────────────────────────────
  const fetchSchedules = useCallback(async () => {
    setSchedulesLoading(true);
    try {
      const res = await fetch("/api/intruder/v1/scans/schedules/");
      if (res.ok) {
        const data: SchedulesResponse = await res.json();
        setSchedules(data.results ?? []);
      }
    } catch {
      // ignore
    } finally {
      setSchedulesLoading(false);
    }
  }, []);

  // ── Initial load + polling ───────────────────────────────────────────────
  useEffect(() => {
    fetchRunning();
    fetchCompleted(1);
    fetchSchedules();

    pollingRef.current = setInterval(() => {
      fetchRunning();
    }, 10_000);

    // Live timer tick every second when scans are running
    const tickInterval = setInterval(() => setTick((t) => t + 1), 1000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      clearInterval(tickInterval);
    };
  }, [fetchRunning, fetchCompleted, fetchSchedules]);

  // ── Pagination ───────────────────────────────────────────────────────────
  useEffect(() => {
    fetchCompleted(completedPage);
  }, [completedPage, fetchCompleted]);

  // ── Cancel scan ──────────────────────────────────────────────────────────
  async function handleCancel(id: string) {
    setCancellingIds((prev) => new Set([...prev, id]));
    try {
      await fetch(`/api/intruder/v1/scans/${id}/cancel/`, { method: "POST" });
      await fetchRunning();
      await fetchCompleted(completedPage);
    } finally {
      setCancellingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }

  // ── Delete schedule ──────────────────────────────────────────────────────
  async function handleDeleteSchedule(id: string) {
    setDeletingIds((prev) => new Set([...prev, id]));
    try {
      await fetch(`/api/intruder/v1/scans/schedules/${id}/`, {
        method: "DELETE",
      });
      await fetchSchedules();
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="p-8 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Scans</h1>
          <p className="text-sm text-gray-500 mt-1">
            Vulnerability-Scans verwalten, starten und planen
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              fetchRunning();
              fetchCompleted(completedPage);
              fetchSchedules();
            }}
            className="text-gray-600"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Aktualisieren
          </Button>
          <Button
            className="bg-[#0066FF] hover:bg-blue-700"
            onClick={() => setShowStartDialog(true)}
          >
            <Play className="w-4 h-4 mr-2" />
            Scan starten
          </Button>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left column: In Progress + Completed ── */}
        <div className="lg:col-span-2 space-y-6">
          {/* In Progress */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                <h2 className="font-semibold text-gray-900 text-sm">
                  Laufende Scans
                </h2>
                {!runningLoading && runningScans.length > 0 && (
                  <span className="text-xs bg-blue-100 text-blue-700 rounded-full px-2 py-0.5 font-medium">
                    {runningScans.length}
                  </span>
                )}
              </div>
            </div>

            {runningLoading ? (
              <div className="py-12 text-center text-gray-400">
                <Loader2 className="w-7 h-7 mx-auto mb-2 animate-spin text-blue-400" />
                <p className="text-sm">Lade laufende Scans...</p>
              </div>
            ) : runningScans.length === 0 ? (
              <div className="py-12 text-center text-gray-400">
                <ScanLine className="w-9 h-9 mx-auto mb-2 text-gray-200" />
                <p className="text-sm font-medium text-gray-400">
                  Keine Scans aktiv
                </p>
                <p className="text-xs text-gray-300 mt-0.5">
                  Starte einen neuen Scan über den Button oben rechts
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {runningScans.map((scan) => {
                  const isCancelling = cancellingIds.has(scan.id);
                  // tick state updates every second to force re-render for live timer
                  void tick;
                  const elapsedMs = scan.start_time
                    ? Date.now() - new Date(scan.start_time).getTime()
                    : 0;
                  const elapsedMin = Math.floor(elapsedMs / 60000);
                  const elapsedSec = Math.floor((elapsedMs % 60000) / 1000);
                  const estimatedProgress = Math.min(
                    15 + Math.floor((elapsedMs / 1000 / 60) * 3),
                    85
                  );
                  const targets = scan.target_addresses ?? [];

                  return (
                    <div key={scan.id} className="px-6 py-4">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex items-center gap-2.5 flex-wrap min-w-0">
                          <ScanTypeBadge type={scan.scan_type} />
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <Target className="w-3 h-3" />
                            {targets.length === 0
                              ? "Alle Targets"
                              : targets.join(", ")}
                          </span>
                          {scan.start_time && (
                            <span className="flex items-center gap-1 text-xs font-mono text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                              <Clock className="w-3 h-3" />
                              {elapsedMin}m {elapsedSec}s
                            </span>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-shrink-0 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 h-7 px-2.5 text-xs"
                          onClick={() => handleCancel(scan.id)}
                          disabled={isCancelling}
                        >
                          {isCancelling ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Square className="w-3 h-3 mr-1" />
                          )}
                          {isCancelling ? "Wird abgebrochen..." : "Abbrechen"}
                        </Button>
                      </div>
                      <div className="space-y-1.5">
                        <Progress
                          value={estimatedProgress}
                          className="h-1.5 bg-blue-100 [&>div]:bg-[#0066FF] [&>div]:transition-none"
                        />
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-400">
                            Scan läuft
                          </p>
                          <p className="text-xs font-mono font-medium text-blue-600">
                            {elapsedMin}m {elapsedSec.toString().padStart(2, "0")}s
                          </p>
                        </div>
                      </div>

                      {/* Terminal-style scan output */}
                      <ScanTerminal scanId={scan.id} targets={targets} scanType={scan.scan_type} startTime={scan.start_time} elapsedSec={Math.floor(elapsedMs / 1000)} progress={estimatedProgress} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Completed */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <h2 className="font-semibold text-gray-900 text-sm">
                  Abgeschlossene Scans
                </h2>
              </div>
              <span className="text-xs text-gray-400">Letzte 10 pro Seite</span>
            </div>

            {completedLoading ? (
              <div className="py-12 text-center text-gray-400">
                <Loader2 className="w-7 h-7 mx-auto mb-2 animate-spin text-gray-300" />
                <p className="text-sm">Lade abgeschlossene Scans...</p>
              </div>
            ) : completedScans.length === 0 ? (
              <div className="py-12 text-center text-gray-400">
                <CheckCircle2 className="w-9 h-9 mx-auto mb-2 text-gray-200" />
                <p className="text-sm font-medium text-gray-400">
                  Noch keine abgeschlossenen Scans
                </p>
              </div>
            ) : (
              <>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-xs text-gray-400 bg-gray-50/50">
                      <th className="text-left py-3 px-6 font-semibold">
                        Scan-Typ
                      </th>
                      <th className="text-left py-3 px-4 font-semibold">
                        Targets
                      </th>
                      <th className="text-center py-3 px-4 font-semibold">
                        Status
                      </th>
                      <th className="text-left py-3 px-4 font-semibold">
                        Gestartet
                      </th>
                      <th className="text-left py-3 px-4 font-semibold">
                        Dauer
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {completedScans.map((scan) => {
                      const statusCfg =
                        COMPLETED_STATUS_CFG[scan.status] ??
                        COMPLETED_STATUS_CFG.completed;
                      return (
                        <tr
                          key={scan.id}
                          className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors"
                        >
                          <td className="py-3.5 px-6">
                            <ScanTypeBadge type={scan.scan_type} />
                          </td>
                          <td className="py-3.5 px-4 text-xs text-gray-500">
                            {!scan.target_addresses || scan.target_addresses.length === 0 ? (
                              <span className="flex items-center gap-1">
                                <Target className="w-3 h-3 text-gray-400" />
                                Alle
                              </span>
                            ) : (
                              <div className="flex flex-wrap gap-1">
                                {scan.target_addresses.slice(0, 2).map((addr) => (
                                  <span key={addr} className="inline-flex items-center gap-1 font-mono text-[11px] bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded border border-gray-200">
                                    {addr}
                                  </span>
                                ))}
                                {scan.target_addresses.length > 2 && (
                                  <span className="text-[11px] text-gray-400">+{scan.target_addresses.length - 2}</span>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium",
                                statusCfg.cls,
                                statusCfg.bg
                              )}
                            >
                              {statusCfg.icon}
                              {statusCfg.label}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-xs text-gray-500">
                            {formatDate(scan.created_at)}
                          </td>
                          <td className="py-3.5 px-4 text-xs text-gray-500">
                            {calcDuration(scan.start_time, scan.completed_time)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Pagination */}
                <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100">
                  <span className="text-xs text-gray-400">
                    Seite {completedPage}
                  </span>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 w-7 p-0"
                      disabled={!completedHasPrev}
                      onClick={() =>
                        setCompletedPage((p) => Math.max(1, p - 1))
                      }
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 w-7 p-0"
                      disabled={!completedHasNext}
                      onClick={() => setCompletedPage((p) => p + 1)}
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Right column: Scheduled Scans ── */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <CalendarClock className="w-4 h-4 text-purple-500" />
                <h2 className="font-semibold text-gray-900 text-sm">
                  Zeitpläne
                </h2>
                {!schedulesLoading && schedules.length > 0 && (
                  <span className="text-xs bg-purple-100 text-purple-700 rounded-full px-2 py-0.5 font-medium">
                    {schedules.length}
                  </span>
                )}
              </div>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs border-purple-200 text-purple-700 hover:bg-purple-50"
                onClick={() => setShowScheduleDialog(true)}
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Zeitplan erstellen
              </Button>
            </div>

            {schedulesLoading ? (
              <div className="py-12 text-center text-gray-400">
                <Loader2 className="w-7 h-7 mx-auto mb-2 animate-spin text-gray-300" />
                <p className="text-sm">Lade Zeitpläne...</p>
              </div>
            ) : schedules.length === 0 ? (
              <div className="py-12 text-center px-5">
                <CalendarClock className="w-9 h-9 mx-auto mb-2 text-gray-200" />
                <p className="text-sm font-medium text-gray-400">
                  Keine Zeitpläne
                </p>
                <p className="text-xs text-gray-300 mt-0.5 leading-relaxed">
                  Erstelle einen wiederkehrenden Scan-Zeitplan
                </p>
                <Button
                  size="sm"
                  className="mt-4 bg-[#0066FF] hover:bg-blue-700 text-xs h-8"
                  onClick={() => setShowScheduleDialog(true)}
                >
                  <Plus className="w-3.5 h-3.5 mr-1.5" />
                  Zeitplan erstellen
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {schedules.map((schedule) => {
                  const isDeleting = deletingIds.has(schedule.id);
                  const targetCount =
                    (schedule.targets?.length ?? 0) +
                    (schedule.target_tags?.length ?? 0);

                  return (
                    <div
                      key={schedule.id}
                      className="px-5 py-4 hover:bg-gray-50/60 transition-colors group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-gray-800 truncate">
                            {schedule.name}
                          </p>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                            <PeriodBadge period={schedule.schedule_period} />
                            {targetCount > 0 && (
                              <span className="flex items-center gap-1 text-xs text-gray-500">
                                <Target className="w-3 h-3" />
                                {targetCount} Target
                                {targetCount !== 1 ? "s" : ""}
                              </span>
                            )}
                          </div>
                          {schedule.next_scan_date && (
                            <div className="flex items-center gap-1 mt-2">
                              <Calendar className="w-3 h-3 text-gray-400" />
                              <span className="text-xs text-gray-400">
                                Nächster Scan:{" "}
                                <span className="text-gray-600 font-medium">
                                  {formatDate(schedule.next_scan_date)}
                                </span>
                              </span>
                            </div>
                          )}
                          {schedule.latest_scan_status && (
                            <div className="mt-2">
                              {(() => {
                                const cfg =
                                  COMPLETED_STATUS_CFG[
                                    schedule.latest_scan_status
                                  ] ?? COMPLETED_STATUS_CFG.completed;
                                return (
                                  <span
                                    className={cn(
                                      "inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium",
                                      cfg.cls,
                                      cfg.bg
                                    )}
                                  >
                                    {cfg.icon}
                                    Letzter Scan: {cfg.label}
                                  </span>
                                );
                              })()}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteSchedule(schedule.id)}
                          disabled={isDeleting}
                          className="flex-shrink-0 mt-0.5 p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
                          title="Zeitplan löschen"
                        >
                          {isDeleting ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <StartScanDialog
        open={showStartDialog}
        onClose={() => setShowStartDialog(false)}
        onSuccess={() => {
          fetchRunning();
          fetchCompleted(completedPage);
        }}
      />
      <CreateScheduleDialog
        open={showScheduleDialog}
        onClose={() => setShowScheduleDialog(false)}
        onSuccess={fetchSchedules}
      />
    </div>
  );
}
