"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  Plus,
  Search,
  Filter,
  Loader2,
  Target,
  MoreHorizontal,
  Tag,
  TagIcon,
  Play,
  Trash2,
  Globe,
  Server,
  Cloud,
  Box,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface IntruderTarget {
  id: string;
  address: string;
  display_address: string;
  target_type: "external" | "internal" | "cloud" | "container_image";
  target_status: "live" | "unscanned" | "unresponsive";
  tags: string[];
  license_type: "infrastructure" | "application" | null;
  has_api_schemas: boolean;
  has_authentications: boolean;
}

interface PaginatedResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: IntruderTarget[];
}

// ---------------------------------------------------------------------------
// Badge configs
// ---------------------------------------------------------------------------

const TYPE_CONFIG: Record<
  string,
  { label: string; cls: string; icon: React.ReactNode }
> = {
  external: {
    label: "External",
    cls: "bg-blue-50 text-blue-700 border-blue-200",
    icon: <Globe className="h-3 w-3" />,
  },
  internal: {
    label: "Internal",
    cls: "bg-purple-50 text-purple-700 border-purple-200",
    icon: <Server className="h-3 w-3" />,
  },
  cloud: {
    label: "Cloud",
    cls: "bg-cyan-50 text-cyan-700 border-cyan-200",
    icon: <Cloud className="h-3 w-3" />,
  },
  container_image: {
    label: "Container",
    cls: "bg-gray-100 text-gray-600 border-gray-200",
    icon: <Box className="h-3 w-3" />,
  },
};

const STATUS_CONFIG: Record<string, { label: string; cls: string; dot: string }> = {
  live: {
    label: "Live",
    cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
  },
  unscanned: {
    label: "Unscanned",
    cls: "bg-gray-100 text-gray-500 border-gray-200",
    dot: "bg-gray-400",
  },
  unresponsive: {
    label: "Unresponsive",
    cls: "bg-red-50 text-red-600 border-red-200",
    dot: "bg-red-500",
  },
};

const LICENSE_CONFIG: Record<string, { label: string; cls: string }> = {
  infrastructure: {
    label: "Infrastructure",
    cls: "bg-slate-100 text-slate-600 border-slate-200",
  },
  application: {
    label: "Application",
    cls: "bg-indigo-50 text-indigo-600 border-indigo-200",
  },
};

const TAG_COLORS = [
  "bg-blue-100 text-blue-700",
  "bg-violet-100 text-violet-700",
  "bg-teal-100 text-teal-700",
  "bg-amber-100 text-amber-700",
  "bg-pink-100 text-pink-700",
  "bg-orange-100 text-orange-700",
];

function tagColor(tag: string) {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length];
}

const LIMIT = 25;

// ---------------------------------------------------------------------------
// Action menu (inline dropdown, no external component)
// ---------------------------------------------------------------------------

interface ActionMenuProps {
  target: IntruderTarget;
  onAddTag: (target: IntruderTarget) => void;
  onRemoveTag: (target: IntruderTarget) => void;
  onStartScan: (target: IntruderTarget) => void;
  onDelete: (target: IntruderTarget) => void;
}

function ActionMenu({ target, onAddTag, onRemoveTag, onStartScan, onDelete }: ActionMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={menuRef} className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="h-7 w-7 rounded-md flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {open && (
        <div className="absolute right-0 top-8 z-50 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1 text-sm">
          <button
            onClick={() => { setOpen(false); onAddTag(target); }}
            className="flex items-center gap-2.5 w-full px-3 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Tag className="h-3.5 w-3.5 text-gray-400" />
            Tag hinzufügen
          </button>
          <button
            onClick={() => { setOpen(false); onRemoveTag(target); }}
            disabled={target.tags.length === 0}
            className="flex items-center gap-2.5 w-full px-3 py-2 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <TagIcon className="h-3.5 w-3.5 text-gray-400" />
            Tag entfernen
          </button>
          <button
            onClick={() => { setOpen(false); onStartScan(target); }}
            className="flex items-center gap-2.5 w-full px-3 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Play className="h-3.5 w-3.5 text-gray-400" />
            Scan starten
          </button>
          <div className="my-1 border-t border-gray-100" />
          <button
            onClick={() => { setOpen(false); onDelete(target); }}
            className="flex items-center gap-2.5 w-full px-3 py-2 text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Löschen
          </button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Toast-like notification
// ---------------------------------------------------------------------------

interface ToastMsg {
  id: number;
  text: string;
  type: "success" | "error";
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function TargetsPage() {
  // Data state
  const [data, setData] = useState<PaginatedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);

  // License usage
  const [licenses, setLicenses] = useState<{
    infrastructure: { used: number; limit: number; available: number };
    application: { used: number; limit: number; available: number };
  } | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchDebounced, setSearchDebounced] = useState("");

  // Dialogs
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showAddTagDialog, setShowAddTagDialog] = useState(false);
  const [showRemoveTagDialog, setShowRemoveTagDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showScanDialog, setShowScanDialog] = useState(false);
  const [activeTarget, setActiveTarget] = useState<IntruderTarget | null>(null);

  // Add Target multi-step
  const [addStep, setAddStep] = useState<"type" | "details" | "cloud">("type");
  const [addType, setAddType] = useState<"infrastructure" | "webapp" | "">("");
  const [cloudEmail, setCloudEmail] = useState("");
  const [cloudSent, setCloudSent] = useState(false);
  const [newAddress, setNewAddress] = useState("");
  const [newAddressBulk, setNewAddressBulk] = useState(""); // for infra: multiple IPs
  const [newTagsInput, setNewTagsInput] = useState("");
  const [newEntrypoint, setNewEntrypoint] = useState(""); // for webapp

  // Other form state
  const [addTagInput, setAddTagInput] = useState("");
  const [removeTagSelect, setRemoveTagSelect] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Toast
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  const toastIdRef = useRef(0);

  function showToast(text: string, type: "success" | "error" = "success") {
    const id = ++toastIdRef.current;
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  // Reset offset when filters change
  useEffect(() => {
    setOffset(0);
  }, [searchDebounced, typeFilter, statusFilter]);

  const fetchTargets = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: String(LIMIT), offset: String(offset) });
      if (typeFilter !== "all") params.set("target_type", typeFilter);
      if (statusFilter !== "all") params.set("target_status", statusFilter);
      if (searchDebounced.trim()) params.set("address", searchDebounced.trim());

      const res = await fetch(`/api/intruder/v1/targets/?${params.toString()}`);
      if (res.ok) {
        const json: PaginatedResponse = await res.json();
        setData(json);
      } else {
        setData(null);
        showToast("Fehler beim Laden der Targets", "error");
      }
    } catch {
      setData(null);
      showToast("Verbindung zur Intruder API fehlgeschlagen", "error");
    } finally {
      setLoading(false);
      refreshLicenses();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offset, typeFilter, statusFilter, searchDebounced]);

  useEffect(() => {
    fetchTargets();
  }, [fetchTargets]);

  // Fetch license limits
  useEffect(() => {
    fetch("/api/intruder/licenses")
      .then(r => r.json())
      .then(setLicenses)
      .catch(() => {});
  }, []);

  // Refresh licenses after target changes
  const refreshLicenses = () => {
    fetch("/api/intruder/licenses").then(r => r.json()).then(setLicenses).catch(() => {});
  };

  // ---------------------------------------------------------------------------
  // Action handlers
  // ---------------------------------------------------------------------------

  function resetAddDialog() {
    setAddStep("type");
    setAddType("");
    setNewAddress("");
    setNewAddressBulk("");
    setNewTagsInput("");
    setNewEntrypoint("");
    setCloudEmail("");
    setCloudSent(false);
  }

  async function handleAddTarget() {
    setSubmitting(true);
    try {
      const tags = newTagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      if (addType === "infrastructure" && newAddressBulk.trim()) {
        // Bulk add: multiple IPs, one per line
        const addresses = newAddressBulk
          .split("\n")
          .map((a) => a.trim())
          .filter(Boolean);
        let success = 0;
        let failed = 0;
        for (const addr of addresses) {
          try {
            const res = await fetch("/api/intruder/v1/targets/", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ address: addr, tags }),
            });
            if (res.ok || res.status === 201) success++;
            else failed++;
          } catch { failed++; }
        }
        if (success > 0) showToast(`${success} Target(s) hinzugefügt${failed > 0 ? `, ${failed} fehlgeschlagen` : ""}`);
        else showToast("Keine Targets hinzugefügt", "error");
      } else {
        // Single target
        const addr = newAddress.trim();
        if (!addr) { setSubmitting(false); return; }
        const res = await fetch("/api/intruder/v1/targets/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address: addr, tags }),
        });
        if (res.ok || res.status === 201) {
          showToast("Target erfolgreich hinzugefügt");
        } else {
          const err = await res.json().catch(() => ({}));
          showToast(err?.error || err?.detail || err?.address?.[0] || "Fehler beim Hinzufügen", "error");
          setSubmitting(false);
          return;
        }
      }
      setShowAddDialog(false);
      resetAddDialog();
      fetchTargets();
    } catch {
      showToast("Netzwerkfehler", "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAddTag() {
    if (!activeTarget || !addTagInput.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/intruder/v1/targets/${activeTarget.id}/tags/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: addTagInput.trim() }),
      });
      if (res.ok || res.status === 201) {
        showToast("Tag hinzugefügt");
        setShowAddTagDialog(false);
        setAddTagInput("");
        fetchTargets();
      } else {
        showToast("Fehler beim Hinzufügen des Tags", "error");
      }
    } catch {
      showToast("Netzwerkfehler", "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRemoveTag() {
    if (!activeTarget || !removeTagSelect) return;
    setSubmitting(true);
    try {
      const res = await fetch(
        `/api/intruder/v1/targets/${activeTarget.id}/tags/${encodeURIComponent(removeTagSelect)}/`,
        { method: "DELETE" }
      );
      if (res.ok || res.status === 204) {
        showToast("Tag entfernt");
        setShowRemoveTagDialog(false);
        setRemoveTagSelect("");
        fetchTargets();
      } else {
        showToast("Fehler beim Entfernen des Tags", "error");
      }
    } catch {
      showToast("Netzwerkfehler", "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStartScan() {
    if (!activeTarget) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/intruder/v1/scans/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target_addresses: [activeTarget.address] }),
      });
      if (res.ok || res.status === 201) {
        showToast(`Scan für ${activeTarget.address} gestartet`);
        setShowScanDialog(false);
      } else {
        showToast("Fehler beim Starten des Scans", "error");
      }
    } catch {
      showToast("Netzwerkfehler", "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!activeTarget) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/intruder/v1/targets/${activeTarget.id}/`, {
        method: "DELETE",
      });
      if (res.ok || res.status === 204) {
        showToast("Target gelöscht");
        setShowDeleteDialog(false);
        setActiveTarget(null);
        fetchTargets();
      } else {
        showToast("Fehler beim Löschen", "error");
      }
    } catch {
      showToast("Netzwerkfehler", "error");
    } finally {
      setSubmitting(false);
    }
  }

  // Open dialog helpers
  function openAddTag(target: IntruderTarget) {
    setActiveTarget(target);
    setAddTagInput("");
    setShowAddTagDialog(true);
  }
  function openRemoveTag(target: IntruderTarget) {
    setActiveTarget(target);
    setRemoveTagSelect(target.tags[0] ?? "");
    setShowRemoveTagDialog(true);
  }
  function openStartScan(target: IntruderTarget) {
    setActiveTarget(target);
    setShowScanDialog(true);
  }
  function openDelete(target: IntruderTarget) {
    setActiveTarget(target);
    setShowDeleteDialog(true);
  }

  const targets = data?.results ?? [];
  const totalCount = data?.count ?? 0;
  const currentPage = Math.floor(offset / LIMIT) + 1;
  const totalPages = Math.ceil(totalCount / LIMIT);
  const hasPrev = offset > 0;
  const hasNext = data?.next != null;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="p-8 space-y-6">
      {/* Toast container */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "px-4 py-3 rounded-lg shadow-lg text-sm font-medium border flex items-center gap-2 pointer-events-auto",
              t.type === "success"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-red-50 text-red-800 border-red-200"
            )}
          >
            {t.type === "error" && <AlertTriangle className="h-4 w-4 flex-shrink-0" />}
            {t.text}
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Targets</h1>
          <p className="text-sm text-gray-500 mt-1">
            Angriffsfläche überwachen und Scans verwalten
          </p>
        </div>
        <div className="flex items-center gap-2">
          {licenses?.infrastructure?.available === 0 && licenses?.application?.available === 0 && (
            <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1.5 rounded-lg">
              Alle Lizenzen belegt
            </span>
          )}
          <Button
            onClick={() => { resetAddDialog(); setShowAddDialog(true); }}
            disabled={licenses?.infrastructure?.available === 0 && licenses?.application?.available === 0}
            className="bg-[#0066FF] hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4 mr-2" />
            Target hinzufügen
          </Button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-5 gap-3">
        {[
          {
            label: "Gesamt",
            value: totalCount,
            icon: Target,
            iconBg: "bg-blue-50",
            iconColor: "text-[#0066FF]",
            valueColor: "text-gray-900",
          },
          {
            label: "Live",
            value: data?.results?.filter((t) => t.target_status === "live").length ?? 0,
            icon: Globe,
            iconBg: "bg-emerald-50",
            iconColor: "text-emerald-600",
            valueColor: "text-emerald-600",
          },
          {
            label: "Unresponsive",
            value: data?.results?.filter((t) => t.target_status === "unresponsive").length ?? 0,
            icon: AlertTriangle,
            iconBg: "bg-red-50",
            iconColor: "text-red-500",
            valueColor: "text-red-600",
          },
          {
            label: "Infrastructure",
            value: licenses?.infrastructure ? `${licenses.infrastructure.used}/${licenses.infrastructure.limit}` : "—",
            icon: Server,
            iconBg: licenses?.infrastructure?.available === 0 ? "bg-amber-50" : "bg-gray-50",
            iconColor: licenses?.infrastructure?.available === 0 ? "text-amber-600" : "text-gray-500",
            valueColor: licenses?.infrastructure?.available === 0 ? "text-amber-600" : "text-gray-900",
          },
          {
            label: "Application",
            value: licenses?.application ? `${licenses.application.used}/${licenses.application.limit}` : "—",
            icon: Globe,
            iconBg: licenses?.application?.available === 0 ? "bg-amber-50" : "bg-gray-50",
            iconColor: licenses?.application?.available === 0 ? "text-amber-600" : "text-gray-500",
            valueColor: licenses?.application?.available === 0 ? "text-amber-600" : "text-gray-900",
          },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                  {s.label}
                </p>
                <p className={cn("text-xl font-bold mt-1", s.valueColor)}>{s.value}</p>
              </div>
              <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center", s.iconBg)}>
                <s.icon className={cn("h-4 w-4", s.iconColor)} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Adresse filtern..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-gray-50 border-gray-200 focus:bg-white"
            />
          </div>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[190px] bg-gray-50 border-gray-200">
              <div className="flex items-center gap-2">
                <Filter className="h-3.5 w-3.5 text-gray-400" />
                <SelectValue placeholder="Typ" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Typen</SelectItem>
              <SelectItem value="external">External</SelectItem>
              <SelectItem value="internal">Internal</SelectItem>
              <SelectItem value="cloud">Cloud</SelectItem>
              <SelectItem value="container_image">Container Image</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[190px] bg-gray-50 border-gray-200">
              <div className="flex items-center gap-2">
                <Filter className="h-3.5 w-3.5 text-gray-400" />
                <SelectValue placeholder="Status" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Status</SelectItem>
              <SelectItem value="live">Live</SelectItem>
              <SelectItem value="unscanned">Unscanned</SelectItem>
              <SelectItem value="unresponsive">Unresponsive</SelectItem>
            </SelectContent>
          </Select>

          {(typeFilter !== "all" || statusFilter !== "all" || search) && (
            <button
              onClick={() => { setSearch(""); setTypeFilter("all"); setStatusFilter("all"); }}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 px-2.5 py-1.5 rounded-md hover:bg-gray-100 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
              Zurücksetzen
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-[#0066FF]" />
            <p className="text-sm text-gray-400">Lade Targets...</p>
          </div>
        ) : targets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400">
            <Target className="h-12 w-12 mb-4 text-gray-200" />
            <p className="text-sm font-medium text-gray-500">Keine Targets gefunden</p>
            {!searchDebounced && typeFilter === "all" && statusFilter === "all" ? (
              <button
                onClick={() => setShowAddDialog(true)}
                className="mt-3 text-xs text-[#0066FF] hover:underline"
              >
                Erstes Target hinzufügen
              </button>
            ) : (
              <p className="text-xs text-gray-400 mt-1">Passen Sie die Filter an</p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Target
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Typ
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Tags
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Lizenz
                  </th>
                  <th className="py-3 px-4 w-12" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {targets.map((target) => {
                  const typeCfg = TYPE_CONFIG[target.target_type] ?? TYPE_CONFIG.external;
                  const statusCfg = STATUS_CONFIG[target.target_status] ?? STATUS_CONFIG.unscanned;
                  const licenseCfg = target.license_type
                    ? LICENSE_CONFIG[target.license_type]
                    : null;
                  const showDisplayAddress =
                    target.display_address &&
                    target.display_address !== target.address;

                  return (
                    <tr
                      key={target.id}
                      className="hover:bg-gray-50/80 transition-colors group cursor-pointer"
                      onClick={() => window.location.href = `/vulnerabilities/targets/${target.id}`}
                    >
                      {/* Target */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
                            <span className="text-gray-400">{typeCfg.icon}</span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate font-mono group-hover:text-[#0066FF] transition-colors">
                              {target.address}
                            </p>
                            {showDisplayAddress && (
                              <p className="text-xs text-gray-400 truncate font-mono">
                                {target.display_address}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Typ */}
                      <td className="py-3.5 px-4">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
                            typeCfg.cls
                          )}
                        >
                          {typeCfg.icon}
                          {typeCfg.label}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
                            statusCfg.cls
                          )}
                        >
                          <span
                            className={cn("h-1.5 w-1.5 rounded-full flex-shrink-0", statusCfg.dot)}
                          />
                          {statusCfg.label}
                        </span>
                      </td>

                      {/* Tags */}
                      <td className="py-3.5 px-4">
                        {target.tags.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5 max-w-[220px]">
                            {target.tags.slice(0, 4).map((tag) => (
                              <span
                                key={tag}
                                className={cn(
                                  "px-2 py-0.5 rounded-full text-xs font-medium",
                                  tagColor(tag)
                                )}
                              >
                                {tag}
                              </span>
                            ))}
                            {target.tags.length > 4 && (
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                                +{target.tags.length - 4}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>

                      {/* Lizenz */}
                      <td className="py-3.5 px-4">
                        {licenseCfg ? (
                          <span
                            className={cn(
                              "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border",
                              licenseCfg.cls
                            )}
                          >
                            {licenseCfg.label}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>

                      {/* Aktionen */}
                      <td className="py-3.5 px-4">
                        <ActionMenu
                          target={target}
                          onAddTag={openAddTag}
                          onRemoveTag={openRemoveTag}
                          onStartScan={openStartScan}
                          onDelete={openDelete}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <p className="text-xs text-gray-400">
                {totalCount > 0
                  ? `${offset + 1}–${Math.min(offset + LIMIT, totalCount)} von ${totalCount} Targets`
                  : "0 Targets"}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">
                  Seite {currentPage} von {totalPages || 1}
                </span>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!hasPrev}
                    onClick={() => setOffset((o) => Math.max(0, o - LIMIT))}
                    className="h-7 px-2.5 text-xs"
                  >
                    <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                    Vorherige
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!hasNext}
                    onClick={() => setOffset((o) => o + LIMIT)}
                    className="h-7 px-2.5 text-xs"
                  >
                    Nächste
                    <ChevronRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Add Target Dialog — Multi-Step                                      */}
      {/* ------------------------------------------------------------------ */}
      <Dialog open={showAddDialog} onOpenChange={(v) => { if (!v) resetAddDialog(); setShowAddDialog(v); }}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-[#0066FF]/10 flex items-center justify-center">
                <Target className="h-4 w-4 text-[#0066FF]" />
              </div>
              Target hinzufügen
            </DialogTitle>
          </DialogHeader>

          {/* Step indicator */}
          {addType && (
            <div className="flex items-center gap-2 text-xs pb-1">
              <button onClick={() => { setAddStep("type"); setAddType(""); }} className="text-[#0066FF] font-semibold hover:underline">
                Typ
              </button>
              <ChevronRight className="w-3 h-3 text-gray-300" />
              <span className={cn("font-semibold", addStep === "details" ? "text-[#0066FF]" : "text-gray-400")}>
                {addType === "webapp" ? "Web Application" : "Infrastructure"}
              </span>
              <ChevronRight className="w-3 h-3 text-gray-300" />
              <span className="text-gray-400">Details</span>
            </div>
          )}

          {/* ── Step 1: Choose Type ─────────────────────────────────────── */}
          {addStep === "type" && (
            <div className="space-y-3 py-2">
              {/* Cloud environments - contact us */}
              <button
                type="button"
                onClick={() => { setAddStep("cloud"); setCloudSent(false); setCloudEmail(""); }}
                className="w-full flex items-start gap-3 p-4 rounded-xl border border-indigo-200 bg-indigo-50/50 text-left hover:bg-indigo-50 transition-colors group"
              >
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Cloud className="h-5 w-5 text-indigo-500" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-900">Cloud Environments</p>
                    <span className="text-[9px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded">
                      Kontakt
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">AWS, Azure, GCP oder Cloudflare — wir richten es für Sie ein</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 mt-1" />
              </button>

              {/* External Infrastructure */}
              <button
                type="button"
                onClick={() => { setAddType("infrastructure"); setAddStep("details"); }}
                className="w-full flex items-start gap-3 p-4 rounded-xl border border-gray-200 text-left hover:border-[#0066FF] hover:bg-blue-50/20 transition-all group"
              >
                <div className="h-9 w-9 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <Server className="h-4.5 w-4.5 text-slate-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">External Infrastructure</p>
                  <p className="text-xs text-gray-500 mt-0.5">IPs oder Domains mit Standard-Software (Server, Netzwerk)</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#0066FF] mt-1" />
              </button>

              {/* External Web Application */}
              <button
                type="button"
                onClick={() => { setAddType("webapp"); setAddStep("details"); }}
                className="w-full flex items-start gap-3 p-4 rounded-xl border border-gray-200 text-left hover:border-[#0066FF] hover:bg-blue-50/20 transition-all group"
              >
                <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <Globe className="h-4.5 w-4.5 text-[#0066FF]" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">External Web Application</p>
                  <p className="text-xs text-gray-500 mt-0.5">Eigene Web-Apps, APIs und Portale mit eigenem Code</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#0066FF] mt-1" />
              </button>
            </div>
          )}

          {/* ── Step 2: Infrastructure Details ──────────────────────────── */}
          {addStep === "details" && addType === "infrastructure" && (
            <div className="space-y-4 py-2">
              <div>
                <Label className="text-xs font-medium">
                  Targets <span className="text-red-500">*</span>
                </Label>
                <textarea
                  value={newAddressBulk}
                  onChange={(e) => setNewAddressBulk(e.target.value)}
                  placeholder={"z.B.\n192.168.1.1\nexample.com\n10.0.0.0/24"}
                  rows={5}
                  className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#0066FF]/20 focus:border-[#0066FF] resize-none placeholder:text-gray-400"
                />
                <p className="text-[10px] text-gray-400 mt-1">IP-Adressen, Domains oder CIDR-Ranges — je eine pro Zeile</p>
              </div>

              <div>
                <Label className="text-xs font-medium">
                  Kundenumgebung / Tag <span className="text-gray-400 font-normal">(optional)</span>
                </Label>
                <Input
                  placeholder="z.B. TrustSpace, production"
                  value={newTagsInput}
                  onChange={(e) => setNewTagsInput(e.target.value)}
                  className="mt-1.5"
                />
                <p className="text-[10px] text-gray-400 mt-1">Kommagetrennt — ordnet Targets einer Kundenumgebung zu</p>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <Button
                  onClick={handleAddTarget}
                  disabled={!newAddressBulk.trim() || submitting}
                  className="w-full bg-[#0066FF] hover:bg-blue-700 text-white h-10"
                >
                  {submitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="mr-2 h-4 w-4" />
                  )}
                  Target hinzufügen
                </Button>
                <button
                  onClick={() => { setAddStep("type"); setAddType(""); }}
                  className="text-xs text-gray-500 hover:text-gray-700 font-medium py-1"
                >
                  Zurück
                </button>
              </div>
            </div>
          )}

          {/* ── Step 2: Web Application Details ─────────────────────────── */}
          {addStep === "details" && addType === "webapp" && (
            <div className="space-y-4 py-2">
              <div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">
                    Domain / IP <span className="text-red-500">*</span>
                  </Label>
                  <span className="text-[10px] text-gray-400">Erforderlich</span>
                </div>
                <Input
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  placeholder="z.B. app.example.com"
                  className="mt-1.5 font-mono"
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">Entrypoint URL</Label>
                  <span className="text-[10px] text-gray-400">Optional</span>
                </div>
                <Input
                  value={newEntrypoint}
                  onChange={(e) => setNewEntrypoint(e.target.value)}
                  placeholder="z.B. https://app.example.com/portal"
                  className="mt-1.5 font-mono"
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  Startpunkt für den Scanner — typischerweise der Root der Web-App
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">Kundenumgebung / Tags</Label>
                  <span className="text-[10px] text-gray-400">Optional</span>
                </div>
                <Input
                  value={newTagsInput}
                  onChange={(e) => setNewTagsInput(e.target.value)}
                  placeholder="z.B. TrustSpace, staging"
                  className="mt-1.5"
                />
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <Button
                  onClick={handleAddTarget}
                  disabled={!newAddress.trim() || submitting}
                  className="w-full bg-[#0066FF] hover:bg-blue-700 text-white h-10"
                >
                  {submitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="mr-2 h-4 w-4" />
                  )}
                  Target hinzufügen
                </Button>
                <button
                  onClick={() => { setAddStep("type"); setAddType(""); }}
                  className="text-xs text-gray-500 hover:text-gray-700 font-medium py-1"
                >
                  Zurück
                </button>
              </div>
            </div>
          )}

          {/* ── Cloud Contact Step ─────────────────────────────────────── */}
          {addStep === "cloud" && (
            <div className="py-4 space-y-4">
              {cloudSent ? (
                <div className="text-center py-6">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                    <Cloud className="w-6 h-6 text-green-600" />
                  </div>
                  <p className="text-sm font-semibold text-gray-900">Anfrage gesendet</p>
                  <p className="text-xs text-gray-500 mt-1.5 max-w-xs mx-auto">
                    Wir melden uns in Kürze bei Ihnen um die Cloud-Umgebung einzurichten.
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4 text-xs"
                    onClick={() => { resetAddDialog(); setShowAddDialog(false); }}
                  >
                    Schließen
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex items-start gap-3 p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-100">
                    <Cloud className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Cloud-Scanning einrichten</p>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                        Für AWS, Azure, GCP und Cloudflare richten wir das Scanning individuell für Sie ein.
                        Geben Sie Ihre E-Mail an und wir kontaktieren Sie mit den nächsten Schritten.
                      </p>
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs text-gray-500">E-Mail-Adresse</Label>
                    <Input
                      type="email"
                      value={cloudEmail}
                      onChange={(e) => setCloudEmail(e.target.value)}
                      placeholder="name@unternehmen.de"
                      className="mt-1.5"
                    />
                  </div>

                  <div className="flex flex-col gap-2 pt-2">
                    <Button
                      onClick={() => {
                        if (!cloudEmail.trim()) return;
                        // TODO: Send email via API (for now just show success)
                        setCloudSent(true);
                        showToast("Cloud-Anfrage gesendet");
                      }}
                      disabled={!cloudEmail.trim() || !cloudEmail.includes("@")}
                      className="w-full bg-[#0066FF] hover:bg-blue-700 text-white h-10"
                    >
                      Anfrage senden
                    </Button>
                    <button
                      onClick={() => setAddStep("type")}
                      className="text-xs text-gray-500 hover:text-gray-700 font-medium py-1"
                    >
                      Zurück
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ------------------------------------------------------------------ */}
      {/* Add Tag Dialog                                                       */}
      {/* ------------------------------------------------------------------ */}
      <Dialog open={showAddTagDialog} onOpenChange={setShowAddTagDialog}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Tag hinzufügen</DialogTitle>
          </DialogHeader>
          {activeTarget && (
            <div className="space-y-4 py-2">
              <p className="text-sm text-gray-500">
                Target:{" "}
                <span className="font-mono font-medium text-gray-800">
                  {activeTarget.address}
                </span>
              </p>
              <div>
                <Label htmlFor="new-tag">Tag-Name</Label>
                <Input
                  id="new-tag"
                  placeholder="z.B. production"
                  value={addTagInput}
                  onChange={(e) => setAddTagInput(e.target.value)}
                  className="mt-1.5"
                  onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
                />
              </div>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowAddTagDialog(false)}>
              Abbrechen
            </Button>
            <Button
              onClick={handleAddTag}
              disabled={!addTagInput.trim() || submitting}
              className="bg-[#0066FF] hover:bg-blue-700 text-white"
            >
              {submitting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Hinzufügen...</>
              ) : (
                "Tag hinzufügen"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ------------------------------------------------------------------ */}
      {/* Remove Tag Dialog                                                    */}
      {/* ------------------------------------------------------------------ */}
      <Dialog open={showRemoveTagDialog} onOpenChange={setShowRemoveTagDialog}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Tag entfernen</DialogTitle>
          </DialogHeader>
          {activeTarget && (
            <div className="space-y-4 py-2">
              <p className="text-sm text-gray-500">
                Target:{" "}
                <span className="font-mono font-medium text-gray-800">
                  {activeTarget.address}
                </span>
              </p>
              {activeTarget.tags.length === 0 ? (
                <p className="text-sm text-gray-400 italic">
                  Dieses Target hat keine Tags.
                </p>
              ) : (
                <div>
                  <Label htmlFor="remove-tag-select">Tag auswählen</Label>
                  <Select value={removeTagSelect} onValueChange={setRemoveTagSelect}>
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Tag wählen..." />
                    </SelectTrigger>
                    <SelectContent>
                      {activeTarget.tags.map((tag) => (
                        <SelectItem key={tag} value={tag}>
                          {tag}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowRemoveTagDialog(false)}>
              Abbrechen
            </Button>
            <Button
              onClick={handleRemoveTag}
              disabled={!removeTagSelect || submitting || (activeTarget?.tags.length ?? 0) === 0}
              variant="destructive"
            >
              {submitting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Entfernen...</>
              ) : (
                "Tag entfernen"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ------------------------------------------------------------------ */}
      {/* Start Scan Confirmation                                              */}
      {/* ------------------------------------------------------------------ */}
      <Dialog open={showScanDialog} onOpenChange={setShowScanDialog}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Scan starten</DialogTitle>
          </DialogHeader>
          {activeTarget && (
            <div className="py-2">
              <p className="text-sm text-gray-600">
                Soll ein neuer Scan für das Target{" "}
                <span className="font-mono font-semibold text-gray-900">
                  {activeTarget.address}
                </span>{" "}
                gestartet werden?
              </p>
              <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                <p className="text-xs text-blue-700">
                  Der Scan wird über die Intruder API ausgelöst. Die Ergebnisse
                  erscheinen nach Abschluss im Intruder-Dashboard.
                </p>
              </div>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowScanDialog(false)}>
              Abbrechen
            </Button>
            <Button
              onClick={handleStartScan}
              disabled={submitting}
              className="bg-[#0066FF] hover:bg-blue-700 text-white"
            >
              {submitting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Starte...</>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Scan starten
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ------------------------------------------------------------------ */}
      {/* Delete Confirmation                                                  */}
      {/* ------------------------------------------------------------------ */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="text-red-600">Target löschen</DialogTitle>
          </DialogHeader>
          {activeTarget && (
            <div className="py-2">
              <p className="text-sm text-gray-600">
                Soll das Target{" "}
                <span className="font-mono font-semibold text-gray-900">
                  {activeTarget.address}
                </span>{" "}
                unwiderruflich gelöscht werden?
              </p>
              <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-700">
                  Diese Aktion kann nicht rückgängig gemacht werden. Alle zugehörigen
                  Scan-Daten bleiben in Intruder erhalten.
                </p>
              </div>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Abbrechen
            </Button>
            <Button
              onClick={handleDelete}
              disabled={submitting}
              variant="destructive"
            >
              {submitting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Löschen...</>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Endgültig löschen
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
