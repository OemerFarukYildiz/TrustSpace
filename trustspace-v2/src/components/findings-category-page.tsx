"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, Plus, AlertCircle, CheckCircle2, Clock,
  ShieldAlert, ClipboardList, TrendingUp, Bug,
  Folder, FolderOpen, ChevronRight, ExternalLink, Search,
  Pencil, Trash2, FolderPlus, MoreVertical, MoveRight, X, Check,
} from "lucide-react";
import Link from "next/link";

type Finding = {
  id: string;
  title: string;
  type: string;
  priority: string;
  status: string;
  dueDate: string | null;
  folder: string | null;
  createdAt: string;
  assignee?: { firstName: string; lastName: string } | null;
  vulnerability?: {
    cveId: string;
    severity: string;
    component?: {
      sbomDocumentId: string;
      sbomDocument?: { asset?: { name: string } | null } | null;
    } | null;
  } | null;
};

type FolderRecord = { id: string; name: string; type: string };

const TYPE_META: Record<string, { label: string; icon: React.ElementType; gradient: string; accent: string }> = {
  vulnerability: { label: "Schwachstellen",  icon: ShieldAlert,   gradient: "from-red-500 to-orange-500",     accent: "border-red-200 text-red-700" },
  audit_finding: { label: "Audit Findings",  icon: ClipboardList, gradient: "from-blue-500 to-indigo-500",    accent: "border-blue-200 text-blue-700" },
  improvement:   { label: "Verbesserungen",  icon: TrendingUp,    gradient: "from-green-500 to-emerald-500",  accent: "border-green-200 text-green-700" },
  incident:      { label: "Vorfälle",        icon: Bug,           gradient: "from-purple-500 to-pink-500",    accent: "border-purple-200 text-purple-700" },
  task:          { label: "Aufgaben",        icon: ClipboardList, gradient: "from-gray-500 to-slate-600",     accent: "border-gray-200 text-gray-700" },
};

const PRIORITY_CFG: Record<string, { label: string; cls: string }> = {
  critical: { label: "Kritisch", cls: "bg-red-100 text-red-700" },
  high:     { label: "Hoch",     cls: "bg-orange-100 text-orange-700" },
  medium:   { label: "Mittel",   cls: "bg-yellow-100 text-yellow-700" },
  low:      { label: "Niedrig",  cls: "bg-blue-100 text-blue-700" },
};

const STATUS_CFG: Record<string, { label: string; icon: React.ReactNode; cls: string; bg: string }> = {
  open:        { label: "Offen",          icon: <AlertCircle className="w-3 h-3" />,  cls: "text-red-600",    bg: "bg-red-50 border-red-200" },
  in_progress: { label: "In Bearbeitung", icon: <Clock className="w-3 h-3" />,        cls: "text-yellow-700", bg: "bg-yellow-50 border-yellow-200" },
  review:      { label: "In Review",      icon: <Clock className="w-3 h-3" />,        cls: "text-blue-600",   bg: "bg-blue-50 border-blue-200" },
  closed:      { label: "Abgeschlossen",  icon: <CheckCircle2 className="w-3 h-3" />, cls: "text-green-600",  bg: "bg-green-50 border-green-200" },
};

function fmt(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

// ── Create Finding Modal ────────────────────────────────────────────────────
function CreateFindingModal({ type, folders, onClose, onCreated }: {
  type: string;
  folders: FolderRecord[];
  onClose: () => void;
  onCreated: (f: Finding) => void;
}) {
  const [title, setTitle]     = useState("");
  const [desc, setDesc]       = useState("");
  const [priority, setPrio]   = useState("medium");
  const [dueDate, setDue]     = useState("");
  const [folder, setFolder]   = useState("");
  const [controlRef, setCtrl] = useState("");
  const [deviation, setDev]   = useState("");
  const [rootCause, setRoot]  = useState("");
  const [saving, setSaving]   = useState(false);

  const isAudit = type === "audit_finding";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    const res = await fetch("/api/findings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title, description: desc || undefined, type, priority,
        dueDate: dueDate || undefined, folder: folder || undefined,
        controlRef: controlRef || undefined,
        deviation: deviation || undefined,
        rootCause: rootCause || undefined,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (data.finding) onCreated(data.finding);
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Neue Maßnahme erstellen</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Titel *</label>
            <input
              value={title} onChange={e => setTitle(e.target.value)} required
              placeholder="Titel der Maßnahme..."
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Beschreibung</label>
            <textarea
              value={desc} onChange={e => setDesc(e.target.value)} rows={3}
              placeholder="Beschreibung..."
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
            />
          </div>

          {isAudit && (
            <>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">ISO Kontrolle</label>
                <input value={controlRef} onChange={e => setCtrl(e.target.value)}
                  placeholder="z.B. A.8.1.1"
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Abweichung</label>
                <textarea value={deviation} onChange={e => setDev(e.target.value)} rows={2}
                  placeholder="Festgestellte Abweichung..."
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Ursache</label>
                <textarea value={rootCause} onChange={e => setRoot(e.target.value)} rows={2}
                  placeholder="Ursache der Abweichung..."
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                />
              </div>
            </>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Priorität</label>
              <select value={priority} onChange={e => setPrio(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none">
                <option value="critical">Kritisch</option>
                <option value="high">Hoch</option>
                <option value="medium">Mittel</option>
                <option value="low">Niedrig</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Fällig am</label>
              <input type="date" value={dueDate} onChange={e => setDue(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Ordner</label>
            <select value={folder} onChange={e => setFolder(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none">
              <option value="">Kein Ordner</option>
              {folders.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>Abbrechen</Button>
            <Button type="submit" size="sm" disabled={saving || !title.trim()} className="bg-[#0066FF] hover:bg-blue-700 text-white">
              {saving ? "Erstelle..." : "Erstellen"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────
export default function FindingsCategoryPage({ type }: { type: string }) {
  const router = useRouter();
  const meta = TYPE_META[type] ?? TYPE_META.task;
  const Icon = meta.icon;

  const [findings, setFindings]       = useState<Finding[]>([]);
  const [folders, setFolders]         = useState<FolderRecord[]>([]);
  const [loading, setLoading]         = useState(true);
  const [openFolders, setOpenFolders] = useState<Set<string>>(new Set());
  const [search, setSearch]           = useState("");

  // Folder management state
  const [renamingId, setRenamingId]     = useState<string | null>(null);
  const [renameVal, setRenameVal]       = useState("");
  const [showCreateFolder, setShowCF]  = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [movingFindingId, setMoving]   = useState<string | null>(null);
  const [showCreateModal, setShowModal] = useState(false);
  const moveMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/findings").then(r => r.json()),
      fetch(`/api/findings/folders?type=${type}`).then(r => r.json()),
    ]).then(([data, foldersData]) => {
      const filtered = (Array.isArray(data) ? data : []).filter((f: Finding) => f.type === type);
      setFindings(filtered);
      const folders = new Set<string>(filtered.map((f: Finding) => f.folder || "__ungrouped__"));
      setOpenFolders(folders);
      setFolders(Array.isArray(foldersData) ? foldersData : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [type]);

  // Close move menu on outside click — use capture phase so cell's stopPropagation doesn't block it
  useEffect(() => {
    if (!movingFindingId) return;
    function handle(e: MouseEvent) {
      if (moveMenuRef.current && !moveMenuRef.current.closest("[data-move-cell]")?.contains(e.target as Node)) {
        setMoving(null);
      }
    }
    document.addEventListener("click", handle, true);
    return () => document.removeEventListener("click", handle, true);
  }, [movingFindingId]);

  const filtered = search
    ? findings.filter(f =>
        f.title.toLowerCase().includes(search.toLowerCase()) ||
        f.vulnerability?.cveId?.toLowerCase().includes(search.toLowerCase())
      )
    : findings;

  const grouped = new Map<string, Finding[]>();
  for (const f of filtered) {
    const key = f.folder || "__ungrouped__";
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(f);
  }
  // Also show empty registered folders
  for (const fd of folders) {
    if (!grouped.has(fd.name)) grouped.set(fd.name, []);
  }

  const entries = [...grouped.entries()].sort(([a], [b]) => {
    if (a === "__ungrouped__") return 1;
    if (b === "__ungrouped__") return -1;
    return a.localeCompare(b);
  });

  const toggle = (key: string) => {
    setOpenFolders(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  // Folder operations
  async function createFolder() {
    if (!newFolderName.trim()) return;
    const res = await fetch("/api/findings/folders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newFolderName.trim(), type }),
    });
    if (res.ok) {
      const f = await res.json();
      setFolders(prev => [...prev, f]);
      setOpenFolders(prev => new Set([...prev, f.name]));
    }
    setNewFolderName("");
    setShowCF(false);
  }

  async function renameFolder(folderId: string, oldName: string) {
    if (!renameVal.trim() || renameVal === oldName) { setRenamingId(null); return; }
    const res = await fetch(`/api/findings/folders/${folderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: renameVal.trim() }),
    });
    if (res.ok) {
      const updated = await res.json();
      setFolders(prev => prev.map(f => f.id === folderId ? updated : f));
      setFindings(prev => prev.map(f => f.folder === oldName ? { ...f, folder: updated.name } : f));
      setOpenFolders(prev => {
        const next = new Set(prev);
        if (next.has(oldName)) { next.delete(oldName); next.add(updated.name); }
        return next;
      });
    }
    setRenamingId(null);
  }

  async function deleteFolder(folderId: string, folderName: string) {
    if (!confirm(`Ordner "${folderName}" löschen? Die Maßnahmen bleiben erhalten und werden aus dem Ordner entfernt.`)) return;
    const res = await fetch(`/api/findings/folders/${folderId}`, { method: "DELETE" });
    if (res.ok) {
      setFolders(prev => prev.filter(f => f.id !== folderId));
      setFindings(prev => prev.map(f => f.folder === folderName ? { ...f, folder: null } : f));
    }
  }

  async function moveFinding(findingId: string, targetFolder: string | null) {
    await fetch(`/api/findings/${findingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ folder: targetFolder }),
    });
    setFindings(prev => prev.map(f => f.id === findingId ? { ...f, folder: targetFolder } : f));
    setMoving(null);
  }

  const openCount   = findings.filter(f => f.status === "open").length;
  const inProgCount = findings.filter(f => f.status === "in_progress").length;
  const closedCount = findings.filter(f => f.status === "closed").length;

  // All available folder names for move menu
  const allFolderNames = [
    ...new Set([
      ...folders.map(f => f.name),
      ...findings.filter(f => f.folder).map(f => f.folder as string),
    ]),
  ].sort();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className={`bg-gradient-to-r ${meta.gradient} px-8 py-6`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push("/findings")} className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/20 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/20 rounded-xl">
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">{meta.label}</h1>
                <p className="text-white/70 text-sm">{findings.length} Einträge gesamt</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCF(true)}
              className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white text-sm px-3 py-2 rounded-xl transition-colors border border-white/20"
            >
              <FolderPlus className="w-4 h-4" />
              Ordner
            </button>
            <Button className="bg-white/20 hover:bg-white/30 text-white border-0" onClick={() => setShowModal(true)}>
              <Plus className="w-4 h-4 mr-1.5" />
              Hinzufügen
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="flex items-center gap-4 mt-5">
          {[
            { label: "Offen", count: openCount, color: "bg-red-500" },
            { label: "In Bearbeitung", count: inProgCount, color: "bg-yellow-400" },
            { label: "Abgeschlossen", count: closedCount, color: "bg-green-400" },
          ].map(({ label, count, color }) => (
            <div key={label} className="bg-white/15 backdrop-blur rounded-xl px-4 py-2.5 flex items-center gap-2.5">
              <span className={`w-2.5 h-2.5 rounded-full ${color} inline-block`} />
              <span className="text-white/80 text-xs">{label}</span>
              <span className="text-white font-bold text-lg ml-1">{count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="p-6">
        {/* Search + New folder inline */}
        <div className="flex gap-3 mb-5 items-center">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Suchen..." className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
            />
          </div>

          {showCreateFolder && (
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm">
              <Folder className="w-4 h-4 text-blue-500 shrink-0" />
              <input
                autoFocus
                value={newFolderName} onChange={e => setNewFolderName(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") createFolder(); if (e.key === "Escape") { setShowCF(false); setNewFolderName(""); } }}
                placeholder="Ordnername..."
                className="text-sm focus:outline-none w-40"
              />
              <button onClick={createFolder} className="p-1 text-green-600 hover:bg-green-50 rounded-lg transition-colors"><Check className="w-4 h-4" /></button>
              <button onClick={() => { setShowCF(false); setNewFolderName(""); }} className="p-1 text-gray-400 hover:bg-gray-50 rounded-lg transition-colors"><X className="w-4 h-4" /></button>
            </div>
          )}
        </div>

        {/* Folders + Table */}
        {loading ? (
          <div className="py-20 text-center text-gray-400">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm">Lade...</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-2xl border border-gray-100 shadow-sm">
            <Icon className="w-12 h-12 mx-auto mb-3 text-gray-200" />
            <p className="text-gray-400 font-medium">Keine Einträge vorhanden</p>
            <button onClick={() => setShowModal(true)} className="mt-3 text-sm text-blue-500 hover:underline flex items-center gap-1 mx-auto">
              <Plus className="w-3.5 h-3.5" /> Erste Maßnahme erstellen
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {entries.map(([folderKey, items]) => {
              const isOpen = openFolders.has(folderKey);
              const folderLabel = folderKey === "__ungrouped__" ? "Ohne Ordner" : folderKey;
              const showFolder = entries.length > 1 || folderKey !== "__ungrouped__";
              const folderRecord = folders.find(f => f.name === folderKey);

              return (
                <div key={folderKey} className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                  {showFolder && (
                    <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-gray-100 hover:bg-gray-50/70 transition-colors group">
                      <button className="flex-1 flex items-center gap-2.5 text-left" onClick={() => toggle(folderKey)}>
                        {isOpen
                          ? <FolderOpen className="w-4 h-4 text-blue-500 shrink-0" />
                          : <Folder className="w-4 h-4 text-gray-400 shrink-0" />}

                        {renamingId === folderRecord?.id ? (
                          <input
                            autoFocus
                            value={renameVal}
                            onChange={e => setRenameVal(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === "Enter") renameFolder(folderRecord!.id, folderKey);
                              if (e.key === "Escape") setRenamingId(null);
                            }}
                            onClick={e => e.stopPropagation()}
                            className="text-sm font-semibold text-gray-700 bg-transparent border-b border-blue-400 focus:outline-none flex-1"
                          />
                        ) : (
                          <span className="text-sm font-semibold text-gray-700">{folderLabel}</span>
                        )}
                        <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full ml-0.5">{items.length}</span>
                        <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`} />
                      </button>

                      {/* Folder actions (only for named, non-ungrouped folders) */}
                      {folderRecord && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => { setRenamingId(folderRecord.id); setRenameVal(folderKey); }}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Umbenennen"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteFolder(folderRecord.id, folderKey)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Ordner löschen"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {(!showFolder || isOpen) && (
                    items.length === 0 ? (
                      <div className="py-8 text-center text-gray-400 text-sm">
                        <p>Ordner ist leer</p>
                      </div>
                    ) : (
                      <table className="w-full text-sm" style={{ overflow: "visible" }}>
                        <thead>
                          <tr className="text-xs text-gray-400 bg-gray-50/50 border-b border-gray-100">
                            <th className="text-left py-3 px-5 font-semibold">Name</th>
                            <th className="text-left py-3 px-4 font-semibold">Asset</th>
                            <th className="text-center py-3 px-4 font-semibold">Priorität</th>
                            <th className="text-left py-3 px-4 font-semibold">Verantwortlich</th>
                            <th className="text-center py-3 px-4 font-semibold">Zu erledigen bis</th>
                            <th className="text-center py-3 px-4 font-semibold">Erstellt am</th>
                            <th className="text-center py-3 px-4 font-semibold">Status</th>
                            <th className="py-3 px-3" />
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {items.map(f => {
                            const p = PRIORITY_CFG[f.priority] ?? PRIORITY_CFG.medium;
                            const s = STATUS_CFG[f.status] ?? STATUS_CFG.open;
                            const asset = f.vulnerability?.component?.sbomDocument?.asset;
                            const sbomId = f.vulnerability?.component?.sbomDocumentId;
                            const cveId = f.vulnerability?.cveId;
                            return (
                              <tr
                                key={f.id}
                                className="hover:bg-blue-50/30 transition-colors cursor-pointer group"
                                onClick={() => router.push(`/findings/ticket/${f.id}`)}
                              >
                                <td className="py-3.5 px-5">
                                  <p className="font-medium text-gray-800 group-hover:text-blue-600 transition-colors">{f.title}</p>
                                  {cveId && (
                                    <div className="flex items-center gap-1.5 mt-0.5" onClick={e => e.stopPropagation()}>
                                      <span className="font-mono text-xs bg-red-50 text-red-600 border border-red-100 px-1.5 py-0.5 rounded">{cveId}</span>
                                      {sbomId && (
                                        <Link href={`/risks/sbom/${sbomId}`} className="text-xs text-blue-500 hover:underline flex items-center gap-0.5">
                                          SBOM <ExternalLink className="w-2.5 h-2.5" />
                                        </Link>
                                      )}
                                    </div>
                                  )}
                                </td>
                                <td className="py-3.5 px-4 text-gray-500 text-xs">{asset?.name ?? "—"}</td>
                                <td className="py-3.5 px-4 text-center">
                                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.cls}`}>{p.label}</span>
                                </td>
                                <td className="py-3.5 px-4 text-gray-500 text-xs">
                                  {f.assignee ? `${f.assignee.firstName} ${f.assignee.lastName}` : <span className="text-gray-300">—</span>}
                                </td>
                                <td className="py-3.5 px-4 text-center text-xs">
                                  {f.dueDate
                                    ? <span className={new Date(f.dueDate) < new Date() ? "text-red-500 font-medium" : "text-gray-500"}>{fmt(f.dueDate)}</span>
                                    : <span className="text-gray-300">—</span>}
                                </td>
                                <td className="py-3.5 px-4 text-center text-gray-400 text-xs">{fmt(f.createdAt)}</td>
                                <td className="py-3.5 px-4 text-center">
                                  <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium ${s.cls} ${s.bg}`}>
                                    {s.icon} {s.label}
                                  </span>
                                </td>
                                {/* Move menu */}
                                <td data-move-cell className="py-3.5 px-3 text-center relative" onClick={e => e.stopPropagation()}>
                                  <div className="relative">
                                    <button
                                      onClick={() => setMoving(movingFindingId === f.id ? null : f.id)}
                                      className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                      title="Verschieben / Optionen"
                                    >
                                      <MoreVertical className="w-3.5 h-3.5" />
                                    </button>
                                    {movingFindingId === f.id && (
                                      <div
                                        ref={moveMenuRef}
                                        className="absolute right-0 top-8 bg-white rounded-xl shadow-xl border border-gray-100 z-50 w-52 py-1 text-sm"
                                      >
                                        <p className="text-xs text-gray-400 px-3 py-2 font-semibold uppercase tracking-wide border-b border-gray-50">In Ordner verschieben</p>
                                        <button
                                          onClick={() => moveFinding(f.id, null)}
                                          className={`w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors flex items-center gap-2 ${!f.folder ? "text-blue-600 font-medium" : "text-gray-600"}`}
                                        >
                                          <Folder className="w-3.5 h-3.5 text-gray-400" />
                                          Ohne Ordner
                                        </button>
                                        {allFolderNames.map(name => (
                                          <button
                                            key={name}
                                            onClick={() => moveFinding(f.id, name)}
                                            className={`w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors flex items-center gap-2 ${f.folder === name ? "text-blue-600 font-medium" : "text-gray-600"}`}
                                          >
                                            <MoveRight className="w-3.5 h-3.5 text-gray-400" />
                                            {name}
                                          </button>
                                        ))}
                                        {allFolderNames.length === 0 && (
                                          <p className="text-xs text-gray-300 px-3 py-2 italic">Noch keine Ordner angelegt</p>
                                        )}
                                        <div className="border-t border-gray-50 mt-1 pt-1">
                                          <button
                                            onClick={async () => {
                                              if (confirm("Maßnahme löschen?")) {
                                                await fetch(`/api/findings/${f.id}`, { method: "DELETE" });
                                                setFindings(prev => prev.filter(x => x.id !== f.id));
                                                setMoving(null);
                                              }
                                            }}
                                            className="w-full text-left px-3 py-2 hover:bg-red-50 transition-colors flex items-center gap-2 text-red-500"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                            Löschen
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Finding Modal */}
      {showCreateModal && (
        <CreateFindingModal
          type={type}
          folders={folders}
          onClose={() => setShowModal(false)}
          onCreated={(f) => {
            setFindings(prev => [f as Finding, ...prev]);
            setShowModal(false);
          }}
        />
      )}
    </div>
  );
}
