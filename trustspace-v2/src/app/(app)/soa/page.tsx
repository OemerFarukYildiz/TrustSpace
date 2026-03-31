"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  Shield,
  CheckCircle,
  Sparkles,
  BarChart3,
  Search,
  ChevronDown,
  ChevronRight,
  Save,
  Loader2,
  AlertTriangle,
  Upload,
  X,
  FileText,
  Trash2,
  Bot,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
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

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

interface EvidenceFile {
  id: string;
  controlId: string;
  fileName: string;
  fileType: string;
  mimeType: string | null;
  fileSize: number;
  description: string | null;
  uploadedBy: string | null;
  createdAt: string;
}

interface Control {
  id: string;
  code: string;
  title: string;
  description: string | null;
  justification: string | null;
  isApplicable: boolean;
  implementation: string | null;
  notes: string | null;
  implementationDate: string | null;
  reviewDate: string | null;
  implementationPct: number;
  responsibleId: string | null;
  responsible: Employee | null;
  _count?: { evidenceFiles: number };
  evidenceFiles?: EvidenceFile[];
  createdAt: string;
  updatedAt: string;
}

// ──────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────

const CATEGORY_TABS = [
  { value: "all", label: "Alle" },
  { value: "A.5", label: "A.5" },
  { value: "A.6", label: "A.6" },
  { value: "A.7", label: "A.7" },
  { value: "A.8", label: "A.8" },
];

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

// ──────────────────────────────────────────────
// SSE Parser
// ──────────────────────────────────────────────

async function* parseSSE(response: Response): AsyncGenerator<string> {
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const data = line.slice(6);
        if (data === "[DONE]") return;
        try {
          const parsed = JSON.parse(data);
          if (parsed.type === "content_block_delta" && parsed.delta?.text) {
            yield parsed.delta.text;
          }
        } catch {
          // skip malformed SSE chunks
        }
      }
    }
  }
}

// ──────────────────────────────────────────────
// Chat Panel Types
// ──────────────────────────────────────────────

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

// ──────────────────────────────────────────────
// Stat Card
// ──────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  iconColor,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  iconColor: string;
}) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <Icon className={cn("h-8 w-8", iconColor)} />
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Control Row (Expandable)
// ──────────────────────────────────────────────

function ControlRow({
  control,
  isExpanded,
  onToggle,
  employees,
  onSave,
}: {
  control: Control;
  isExpanded: boolean;
  onToggle: () => void;
  employees: Employee[];
  onSave: (id: string, data: Record<string, unknown>) => Promise<void>;
}) {
  // Local editable state
  const [justification, setJustification] = useState(
    control.justification || ""
  );
  const [notes, setNotes] = useState(control.notes || "");
  const [implementationPct, setImplementationPct] = useState(
    control.implementationPct
  );
  const [implementationDate, setImplementationDate] = useState(
    control.implementationDate
      ? new Date(control.implementationDate).toISOString().split("T")[0]
      : ""
  );
  const [reviewDate, setReviewDate] = useState(
    control.reviewDate
      ? new Date(control.reviewDate).toISOString().split("T")[0]
      : ""
  );
  const [responsibleId, setResponsibleId] = useState(
    control.responsibleId || ""
  );
  const [isApplicable, setIsApplicable] = useState(control.isApplicable);

  const [saving, setSaving] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [aiPromptOpen, setAiPromptOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");

  // Evidence state
  const [evidenceFiles, setEvidenceFiles] = useState<EvidenceFile[]>(
    control.evidenceFiles || []
  );
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Re-sync state when control prop changes (e.g., after parent refetch)
  useEffect(() => {
    setJustification(control.justification || "");
    setNotes(control.notes || "");
    setImplementationPct(control.implementationPct);
    setImplementationDate(
      control.implementationDate
        ? new Date(control.implementationDate).toISOString().split("T")[0]
        : ""
    );
    setReviewDate(
      control.reviewDate
        ? new Date(control.reviewDate).toISOString().split("T")[0]
        : ""
    );
    setResponsibleId(control.responsibleId || "");
    setIsApplicable(control.isApplicable);
  }, [control]);

  // Fetch evidence when expanded
  useEffect(() => {
    if (isExpanded && evidenceFiles.length === 0) {
      const fetchEvidence = async () => {
        try {
          const res = await fetch(`/api/controls/${control.id}/evidence`);
          if (res.ok) {
            setEvidenceFiles(await res.json());
          }
        } catch (err) {
          console.error("Failed to fetch evidence:", err);
        }
      };
      fetchEvidence();
    }
  }, [isExpanded, control.id, evidenceFiles.length]);

  // Save handler
  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(control.id, {
        justification: justification || null,
        notes: notes || null,
        implementationPct,
        implementationDate: implementationDate || null,
        reviewDate: reviewDate || null,
        responsibleId: responsibleId || null,
        isApplicable,
      });
    } finally {
      setSaving(false);
    }
  };

  // AI generation handler
  const handleGenerateAI = async () => {
    setGeneratingAI(true);
    try {
      const res = await fetch("/api/llm/soa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          controlCode: control.code,
          controlTitle: control.title,
          context: {
            organizationName: "[Firmenname einfügen]",
            industry: "IT & Software",
            assets: [],
            existingDocuments: [],
            controlDescription: control.description || "",
          },
          companyContext: aiPrompt || undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setJustification(data.justification || "");
        setAiPromptOpen(false);
        setAiPrompt("");
      } else {
        const err = await res.json().catch(() => ({}));
        alert("KI-Generierung fehlgeschlagen: " + (err.error || res.status));
      }
    } catch (err) {
      console.error(err);
      alert("Fehler bei der KI-Generierung.");
    } finally {
      setGeneratingAI(false);
    }
  };

  // Evidence upload
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const reader = new FileReader();
        const fileData = await new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });

        const res = await fetch(`/api/controls/${control.id}/evidence`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: file.name,
            fileType: file.name.split(".").pop() || "unknown",
            fileData,
            mimeType: file.type,
            fileSize: file.size,
          }),
        });
        if (res.ok) {
          const newEvidence = await res.json();
          setEvidenceFiles((prev) => [newEvidence, ...prev]);
        }
      }
    } catch (err) {
      console.error(err);
      alert("Fehler beim Hochladen.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Evidence delete
  const handleDeleteEvidence = async (evidenceId: string) => {
    if (!confirm("Evidence-Datei loeschen?")) return;
    try {
      const res = await fetch(
        `/api/controls/${control.id}/evidence/${evidenceId}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        setEvidenceFiles((prev) => prev.filter((e) => e.id !== evidenceId));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Drag handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFileUpload(e.dataTransfer.files);
  }, []);

  const evidenceCount =
    control._count?.evidenceFiles ?? evidenceFiles.length;

  return (
    <div className="border-b border-gray-100 last:border-b-0">
      {/* Collapsed Row */}
      <div
        className="flex items-center gap-4 px-6 py-3 cursor-pointer hover:bg-gray-50/50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex-shrink-0">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronRight className="h-4 w-4 text-gray-400" />
          )}
        </div>

        <Badge variant="outline" className="flex-shrink-0 font-mono text-xs">
          {control.code}
        </Badge>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-gray-900">
            {control.title}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Applicability toggle display */}
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-medium",
              control.isApplicable
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-500"
            )}
          >
            {control.isApplicable ? "Anwendbar" : "Nicht anwendbar"}
          </span>

          {/* Implementation progress */}
          <div className="flex items-center gap-2 w-28">
            <Progress
              value={control.implementationPct}
              className="h-1.5 flex-1"
            />
            <span className="text-[10px] font-medium text-gray-500 w-8 text-right">
              {control.implementationPct}%
            </span>
          </div>

          {/* Responsible */}
          <span className="text-xs text-gray-500 w-24 truncate text-right">
            {control.responsible
              ? `${control.responsible.firstName} ${control.responsible.lastName}`
              : "-"}
          </span>

          {/* Evidence count */}
          {evidenceCount > 0 && (
            <Badge variant="secondary" className="text-[10px]">
              <FileText className="mr-1 h-3 w-3" />
              {evidenceCount}
            </Badge>
          )}
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="bg-gray-50/30 px-6 py-5 border-t border-gray-100">
          {/* Control description - always visible */}
          {control.description && (
            <div className="mb-4 rounded-lg bg-blue-50/60 border border-blue-100 px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-500 mb-1">
                Umsetzungsbeschreibung
              </p>
              <p className="text-sm text-gray-700 leading-relaxed">
                {control.description}
              </p>
            </div>
          )}

          <div className="grid grid-cols-12 gap-6">
            {/* Left: Form fields */}
            <div className="col-span-7 space-y-4">
              {/* Applicability */}
              <div className="flex items-center gap-3">
                <Label className="text-xs text-gray-500 w-24">
                  Anwendbar
                </Label>
                <button
                  onClick={() => setIsApplicable(!isApplicable)}
                  className={cn(
                    "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none",
                    isApplicable ? "bg-[#0066FF]" : "bg-gray-200"
                  )}
                >
                  <span
                    className={cn(
                      "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform",
                      isApplicable ? "translate-x-5" : "translate-x-0"
                    )}
                  />
                </button>
                <span className="text-xs text-gray-500">
                  {isApplicable ? "Ja" : "Nein"}
                </span>
              </div>

              {/* Justification */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label className="text-xs text-gray-500">
                    Begründung
                  </Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      setAiPromptOpen(!aiPromptOpen);
                    }}
                    disabled={generatingAI}
                  >
                    {generatingAI ? (
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    ) : (
                      <Sparkles className="mr-1 h-3 w-3" />
                    )}
                    Mit KI generieren
                  </Button>
                </div>

                {/* AI Prompt Input */}
                {aiPromptOpen && (
                  <div className="mb-2 rounded-lg border border-purple-200 bg-purple-50/50 p-3 space-y-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-purple-500">
                      KI-Anweisung (optional)
                    </p>
                    <Input
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder="z.B. Wir nutzen Microsoft 365, Sophos, haben einen IAM-Prozess..."
                      className="text-sm bg-white border-purple-200 focus:border-purple-400 placeholder:text-gray-400"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleGenerateAI();
                        }
                      }}
                    />
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        className="h-7 text-xs bg-purple-600 hover:bg-purple-700 text-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleGenerateAI();
                        }}
                        disabled={generatingAI}
                      >
                        {generatingAI ? (
                          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        ) : (
                          <Sparkles className="mr-1 h-3 w-3" />
                        )}
                        Generieren
                      </Button>
                      <button
                        onClick={() => { setAiPromptOpen(false); setAiPrompt(""); }}
                        className="text-xs text-gray-400 hover:text-gray-600"
                      >
                        Abbrechen
                      </button>
                    </div>
                  </div>
                )}

                <Textarea
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  placeholder="Begründung für Anwendbarkeit / Nicht-Anwendbarkeit..."
                  rows={3}
                  className="text-sm"
                />
              </div>

              {/* Notes */}
              <div>
                <Label className="text-xs text-gray-500">Notizen</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Interne Notizen..."
                  rows={2}
                  className="mt-1 text-sm"
                />
              </div>

              {/* Implementation % */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label className="text-xs text-gray-500">
                    Umsetzungsgrad
                  </Label>
                  <span className="text-sm font-bold text-gray-700">
                    {implementationPct}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={implementationPct}
                  onChange={(e) =>
                    setImplementationPct(parseInt(e.target.value))
                  }
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#0066FF]"
                />
              </div>

              {/* Dates + Responsible */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs text-gray-500">
                    Umsetzungsdatum
                  </Label>
                  <Input
                    type="date"
                    value={implementationDate}
                    onChange={(e) => setImplementationDate(e.target.value)}
                    className="mt-1 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500">
                    Naechstes Review
                  </Label>
                  <Input
                    type="date"
                    value={reviewDate}
                    onChange={(e) => setReviewDate(e.target.value)}
                    className="mt-1 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500">
                    Verantwortlich
                  </Label>
                  <Select
                    value={responsibleId}
                    onValueChange={setResponsibleId}
                  >
                    <SelectTrigger className="mt-1 text-sm">
                      <SelectValue placeholder="Auswaehlen..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Keine</SelectItem>
                      {employees.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {emp.firstName} {emp.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Save Button */}
              <div className="pt-2">
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

            {/* Right: Evidence */}
            <div className="col-span-5 space-y-3">
              <Label className="text-xs text-gray-500">
                Evidence / Nachweise
              </Label>

              {/* Drop zone */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 cursor-pointer transition-colors",
                  dragActive
                    ? "border-[#0066FF] bg-blue-50/50"
                    : "border-gray-200 bg-white hover:border-gray-300"
                )}
              >
                {uploading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-[#0066FF]" />
                ) : (
                  <Upload className="h-6 w-6 text-gray-400" />
                )}
                <p className="text-xs text-gray-500 text-center">
                  {uploading
                    ? "Wird hochgeladen..."
                    : "Dateien hierher ziehen oder klicken"}
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFileUpload(e.target.files)}
                />
              </div>

              {/* File list */}
              {evidenceFiles.length > 0 && (
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {evidenceFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center gap-2 rounded-md border border-gray-100 bg-white p-2"
                    >
                      <FileText className="h-4 w-4 flex-shrink-0 text-gray-400" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-gray-700">
                          {file.fileName}
                        </p>
                        <p className="text-[10px] text-gray-400">
                          {formatFileSize(file.fileSize)} |{" "}
                          {formatDate(file.createdAt)}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteEvidence(file.id)}
                        className="flex-shrink-0 rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {evidenceFiles.length === 0 && !uploading && (
                <p className="text-xs text-gray-400 text-center py-2">
                  Noch keine Nachweise hochgeladen
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// Main Page
// ──────────────────────────────────────────────

export default function SoaPage() {
  const [controls, setControls] = useState<Control[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Global AI chat state
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatStreaming, setChatStreaming] = useState(false);
  const [appliedUpdates, setAppliedUpdates] = useState<Set<string>>(new Set());
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [controlsRes, employeesRes] = await Promise.all([
          fetch("/api/controls"),
          fetch("/api/employees"),
        ]);
        if (controlsRes.ok) {
          setControls(await controlsRes.json());
        } else {
          throw new Error("Fehler beim Laden der Kontrollen");
        }
        if (employeesRes.ok) {
          setEmployees(await employeesRes.json());
        }
      } catch (err) {
        console.error(err);
        setError("Daten konnten nicht geladen werden.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Stats
  const stats = useMemo(() => {
    const total = controls.length;
    const applicable = controls.filter((c) => c.isApplicable).length;
    const withJustification = controls.filter((c) => c.justification).length;
    const avgImplementation =
      total > 0
        ? Math.round(
            controls.reduce((s, c) => s + c.implementationPct, 0) / total
          )
        : 0;
    return { total, applicable, withJustification, avgImplementation };
  }, [controls]);

  // Filtered controls
  const filteredControls = useMemo(() => {
    let filtered = controls;

    // Tab filter
    if (activeTab !== "all") {
      filtered = filtered.filter((c) => c.code.startsWith(activeTab));
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.code.toLowerCase().includes(q) ||
          c.title.toLowerCase().includes(q) ||
          c.description?.toLowerCase().includes(q)
      );
    }

    return filtered;
  }, [controls, activeTab, searchQuery]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages]);

  // Build controls summary for chat context - include full justification text
  const controlsSummary = useMemo(
    () =>
      controls.map((c) => ({
        code: c.code,
        title: c.title,
        justification: c.justification || "",
      })),
    [controls]
  );

  // Open global chat
  const handleOpenChat = useCallback(() => {
    setChatOpen(true);
    setAppliedUpdates(new Set());
    if (chatMessages.length === 0) {
      // Seed with welcome
      setChatMessages([
        {
          role: "assistant",
          content:
            "Hallo! Ich bin der TrustSpace SOA-Assistent. Ich kann Begründungen für alle ISO 27001 Controls erstellen oder anpassen.\n\nSag mir z.B.:\n- Welche **Tools und Software** ihr nutzt (Microsoft 365, AWS, Sophos...)\n- Welche **Prozesse** etabliert sind (IAM, Change Management...)\n- Oder frag nach einem **bestimmten Control** (z.B. \"A.8.7\")\n\nIch schaue dann welche Controls ich auf dieser Basis ausfüllen kann.",
        },
      ]);
    }
    setTimeout(() => chatInputRef.current?.focus(), 200);
  }, [chatMessages.length]);

  // Send a chat message (global)
  const handleChatSend = useCallback(async () => {
    if (!chatInput.trim() || chatStreaming) return;

    const userMsg: ChatMessage = { role: "user", content: chatInput.trim() };
    setChatInput("");
    // Only send user/assistant messages (not the seeded welcome if it was never replied to)
    const conversationMessages = [...chatMessages, userMsg].filter(
      (_, i) => i > 0 || chatMessages.length > 1
    );
    setChatMessages((prev) => [...prev, userMsg]);
    setChatStreaming(true);

    const assistantMsg: ChatMessage = { role: "assistant", content: "" };
    setChatMessages((prev) => [...prev, assistantMsg]);

    try {
      const res = await fetch("/api/llm/soa/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: conversationMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          controls: controlsSummary,
        }),
      });

      if (!res.ok) {
        setChatMessages((prev) => [
          ...prev.slice(0, -1),
          { role: "assistant", content: "Fehler: Antwort konnte nicht geladen werden." },
        ]);
        return;
      }

      for await (const chunk of parseSSE(res)) {
        setChatMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant") {
            return [
              ...prev.slice(0, -1),
              { ...last, content: last.content + chunk },
            ];
          }
          return prev;
        });
      }
    } catch (err) {
      console.error("Chat send error:", err);
    } finally {
      setChatStreaming(false);
    }
  }, [chatInput, chatStreaming, chatMessages, controlsSummary]);

  // Save control
  const handleSaveControl = useCallback(
    async (id: string, data: Record<string, unknown>) => {
      try {
        const res = await fetch(`/api/controls/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Speichern fehlgeschlagen");
        const updated = await res.json();

        // Update local state
        setControls((prev) =>
          prev.map((c) => (c.id === id ? { ...c, ...updated } : c))
        );
      } catch (err) {
        console.error(err);
        alert("Fehler beim Speichern der Kontrolle.");
      }
    },
    []
  );

  // Parse and extract all UPDATE blocks from an AI message
  const parseUpdates = useCallback(
    (content: string): { code: string; justification: string }[] => {
      const updates: { code: string; justification: string }[] = [];
      const regex =
        /===UPDATE_START===\s*CONTROL:\s*(A\.\d+\.\d+)\s*JUSTIFICATION:\s*([\s\S]*?)===UPDATE_END===/g;
      let match;
      while ((match = regex.exec(content)) !== null) {
        updates.push({
          code: match[1].trim(),
          justification: match[2].trim(),
        });
      }
      return updates;
    },
    []
  );

  // Apply all updates from an AI message
  const handleApplyUpdates = useCallback(
    async (messageContent: string, messageIdx: number) => {
      const updates = parseUpdates(messageContent);
      if (updates.length === 0) return;

      for (const upd of updates) {
        const ctrl = controls.find((c) => c.code === upd.code);
        if (ctrl) {
          await handleSaveControl(ctrl.id, { justification: upd.justification });
        }
      }
      setAppliedUpdates((prev) => new Set([...prev, String(messageIdx)]));
    },
    [controls, handleSaveControl, parseUpdates]
  );

  // Loading
  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#0066FF]" />
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-3">
        <AlertTriangle className="h-10 w-10 text-red-400" />
        <p className="text-sm text-red-600">{error}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.location.reload()}
        >
          Erneut versuchen
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            SOA - Statement of Applicability
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            ISO 27001 Kontrollen und deren Anwendbarkeit
          </p>
        </div>
        <Button
          onClick={handleOpenChat}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md"
        >
          <Bot className="mr-2 h-4 w-4" />
          SOA KI-Assistent
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          label="Gesamt"
          value={stats.total}
          icon={Shield}
          iconColor="text-blue-600"
        />
        <StatCard
          label="Anwendbar"
          value={stats.applicable}
          icon={CheckCircle}
          iconColor="text-green-600"
        />
        <StatCard
          label="Mit Begruendung"
          value={stats.withJustification}
          icon={Sparkles}
          iconColor="text-purple-600"
        />
        <StatCard
          label="Avg Umsetzung %"
          value={`${stats.avgImplementation}%`}
          icon={BarChart3}
          iconColor="text-orange-600"
        />
      </div>

      {/* Filter Tabs + Search */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-0.5">
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                activeTab === tab.value
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Kontrollen suchen..."
            className="h-9 w-64 pl-9 text-sm"
          />
        </div>
      </div>

      {/* Controls List */}
      <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-6 py-3">
          <div className="flex items-center gap-4 text-[10px] font-medium uppercase tracking-wider text-gray-400">
            <span className="w-4" />
            <span className="w-14">Code</span>
            <span className="flex-1">Titel</span>
            <span className="w-24 text-center">Status</span>
            <span className="w-28 text-center">Umsetzung</span>
            <span className="w-24 text-right">Verantwortlich</span>
            <span className="w-12 text-right">Dateien</span>
          </div>
        </div>

        {filteredControls.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400">
            Keine Kontrollen gefunden
          </div>
        ) : (
          filteredControls.map((control) => (
            <ControlRow
              key={control.id}
              control={control}
              isExpanded={expandedId === control.id}
              onToggle={() =>
                setExpandedId(
                  expandedId === control.id ? null : control.id
                )
              }
              employees={employees}
              onSave={handleSaveControl}
            />
          ))
        )}

        {/* Footer */}
        <div className="border-t border-gray-100 px-6 py-3">
          <p className="text-xs text-gray-400">
            {filteredControls.length} von {controls.length} Kontrollen
            angezeigt
          </p>
        </div>
      </div>

      {/* ── Chat Panel (right side, full height) ── */}
      {chatOpen && (
        <div className="fixed inset-0 z-40 flex justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
            onClick={() => setChatOpen(false)}
          />

          {/* Panel */}
          <div className="relative z-10 flex h-full w-full max-w-xl flex-col bg-white shadow-2xl animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-gray-200 bg-white px-5 py-4 flex-shrink-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0066FF] flex-shrink-0">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900">SOA KI-Assistent</p>
                <p className="text-xs text-gray-500">
                  {controls.filter(c => c.justification).length}/{controls.length} Controls mit Begründung
                </p>
              </div>
              <button
                onClick={() => {
                  setChatMessages([]);
                  setAppliedUpdates(new Set());
                }}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Neuer Chat
              </button>
              <button
                onClick={() => setChatOpen(false)}
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
              {/* Welcome branding */}
              {chatMessages.length <= 1 && (
                <div className="flex flex-col items-center pt-10 pb-6">
                  <div className="h-24 w-24 rounded-full overflow-hidden border-2 border-gray-200 shadow-md mb-3">
                    <img
                      src="/soa-avatar.png"
                      alt="Ihr ISMS Berater"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <p className="text-sm font-medium text-gray-700">Ihr ISMS Berater</p>
                  <p className="text-xs text-gray-400 mt-0.5">TrustSpace SOA-Assistent</p>
                </div>
              )}

              {chatMessages.map((msg, idx) => {
                const isUser = msg.role === "user";
                const updates = !isUser ? parseUpdates(msg.content) : [];
                const hasUpdates = updates.length > 0;
                const alreadyApplied = appliedUpdates.has(String(idx));

                const displayContent = msg.content
                  .replace(/===UPDATE_START===\s*CONTROL:\s*A\.\d+\.\d+\s*JUSTIFICATION:\s*[\s\S]*?===UPDATE_END===/g, "")
                  .trim();

                if (isUser) {
                  return (
                    <div key={idx} className="flex justify-end">
                      <div className="max-w-[80%] rounded-2xl rounded-br-md bg-[#0066FF] px-4 py-3 text-sm text-white leading-relaxed whitespace-pre-wrap">
                        {displayContent}
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={idx} className="space-y-2">
                    {/* AI text */}
                    {displayContent ? (
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 h-7 w-7 rounded-lg bg-gray-100 flex items-center justify-center mt-0.5">
                          <Bot className="h-4 w-4 text-gray-500" />
                        </div>
                        <div className="flex-1 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                          {displayContent}
                        </div>
                      </div>
                    ) : !msg.content ? (
                      <div className="flex gap-3 items-center">
                        <div className="flex-shrink-0 h-7 w-7 rounded-lg bg-gray-100 flex items-center justify-center">
                          <Loader2 className="h-4 w-4 animate-spin text-[#0066FF]" />
                        </div>
                        <span className="text-sm text-gray-400">Analysiert Controls...</span>
                      </div>
                    ) : null}

                    {/* Update cards */}
                    {hasUpdates && (
                      <div className="ml-10 space-y-2">
                        {updates.map((upd, ui) => {
                          const ctrl = controls.find(c => c.code === upd.code);
                          return (
                            <div
                              key={ui}
                              className={cn(
                                "rounded-xl border p-3",
                                alreadyApplied
                                  ? "border-green-200 bg-green-50/50"
                                  : "border-gray-200 bg-gray-50/50"
                              )}
                            >
                              <div className="flex items-center gap-2 mb-1.5">
                                <span className="font-mono text-xs font-bold text-[#0066FF]">
                                  {upd.code}
                                </span>
                                {ctrl && (
                                  <span className="text-xs text-gray-500 truncate">
                                    {ctrl.title}
                                  </span>
                                )}
                                {alreadyApplied && (
                                  <CheckCircle className="h-3.5 w-3.5 text-green-500 ml-auto flex-shrink-0" />
                                )}
                              </div>
                              <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">
                                {upd.justification}
                              </p>
                            </div>
                          );
                        })}
                        <button
                          onClick={() => handleApplyUpdates(msg.content, idx)}
                          disabled={alreadyApplied}
                          className={cn(
                            "flex items-center justify-center gap-2 w-full rounded-xl py-2.5 text-sm font-medium transition-all",
                            alreadyApplied
                              ? "bg-green-50 text-green-700 border border-green-200"
                              : "bg-[#0066FF] text-white hover:bg-blue-700 shadow-sm"
                          )}
                        >
                          {alreadyApplied ? (
                            <>
                              <CheckCircle className="h-4 w-4" />
                              {updates.length} Control{updates.length !== 1 ? "s" : ""} gespeichert
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4" />
                              {updates.length} Control{updates.length !== 1 ? "s" : ""} übernehmen
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

              <div ref={chatBottomRef} />
            </div>

            {/* Input */}
            <div className="flex-shrink-0 border-t border-gray-200 bg-white px-5 py-4">
              <div className="flex items-end gap-3">
                <textarea
                  ref={chatInputRef}
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleChatSend();
                    }
                  }}
                  placeholder="z.B. &quot;Wir nutzen Microsoft 365, Sophos, AWS...&quot;"
                  rows={2}
                  disabled={chatStreaming}
                  className="flex-1 resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition-all focus:border-[#0066FF] focus:bg-white focus:ring-2 focus:ring-blue-100 placeholder:text-gray-400 disabled:opacity-50"
                />
                <button
                  onClick={handleChatSend}
                  disabled={chatStreaming || !chatInput.trim()}
                  className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-[#0066FF] text-white transition-all hover:bg-blue-700 disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
                >
                  {chatStreaming ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
