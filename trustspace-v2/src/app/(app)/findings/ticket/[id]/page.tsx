"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, ShieldAlert, Clock, AlertCircle, CheckCircle2,
  ExternalLink, Save, Trash2, ChevronDown, Folder,
  MessageSquare, Paperclip, Send, Download, File, X,
} from "lucide-react";
import Link from "next/link";

type Comment = { id: string; authorName: string; content: string; createdAt: string };
type Attachment = { id: string; fileName: string; fileUrl: string; fileSize: number | null; mimeType: string | null; createdAt: string };

type Finding = {
  id: string; title: string; description: string | null; type: string;
  priority: string; status: string; dueDate: string | null; folder: string | null;
  controlRef: string | null; deviation: string | null; rootCause: string | null;
  createdAt: string; updatedAt: string;
  assignee?: { id: string; firstName: string; lastName: string } | null;
  vulnerability?: {
    id: string; cveId: string; cvssScore: number | null; severity: string;
    vexStatus: string; remediation: string | null;
    component?: {
      name: string; version: string | null; sbomDocumentId: string;
      sbomDocument?: { versionLabel: string; asset?: { id: string; name: string } | null } | null;
    } | null;
  } | null;
};

type FolderRecord = { id: string; name: string };

const PRIORITY_CFG: Record<string, { label: string; cls: string }> = {
  critical: { label: "Kritisch", cls: "bg-red-100 text-red-700 border-red-200" },
  high:     { label: "Hoch",     cls: "bg-orange-100 text-orange-700 border-orange-200" },
  medium:   { label: "Mittel",   cls: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  low:      { label: "Niedrig",  cls: "bg-blue-100 text-blue-700 border-blue-200" },
};

const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  open:        { label: "Offen",          cls: "bg-red-50 text-red-600 border-red-200" },
  in_progress: { label: "In Bearbeitung", cls: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  review:      { label: "In Review",      cls: "bg-blue-50 text-blue-600 border-blue-200" },
  closed:      { label: "Abgeschlossen",  cls: "bg-green-50 text-green-600 border-green-200" },
};

const VEX_CFG: Record<string, { label: string; cls: string }> = {
  under_investigation: { label: "In Untersuchung", cls: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  affected:            { label: "Betroffen",        cls: "bg-red-50 text-red-700 border-red-200" },
  not_affected:        { label: "Nicht betroffen",  cls: "bg-green-50 text-green-700 border-green-200" },
  fixed:               { label: "Behoben",          cls: "bg-blue-50 text-blue-700 border-blue-200" },
};

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}
function fmtDateTime(d: string) {
  return new Date(d).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
function fmtBytes(b: number | null) {
  if (!b) return "";
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FindingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [finding, setFinding]       = useState<Finding | null>(null);
  const [comments, setComments]     = useState<Comment[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [availFolders, setAvailFolders] = useState<FolderRecord[]>([]);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [saved, setSaved]           = useState(false);

  // Editable fields
  const [status, setStatus]         = useState("");
  const [priority, setPriority]     = useState("");
  const [dueDate, setDueDate]       = useState("");
  const [description, setDesc]      = useState("");
  const [folder, setFolder]         = useState("");
  const [vexStatus, setVexStatus]   = useState("");
  const [controlRef, setControlRef] = useState("");
  const [deviation, setDeviation]   = useState("");
  const [rootCause, setRootCause]   = useState("");

  // Comment
  const [commentText, setCommentText] = useState("");
  const [postingComment, setPostingComment] = useState(false);

  // File upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/findings/${id}`).then(r => r.json()),
      fetch(`/api/findings/${id}/comments`).then(r => r.json()),
      fetch(`/api/findings/${id}/attachments`).then(r => r.json()),
    ]).then(([f, c, a]) => {
      setFinding(f);
      setStatus(f.status ?? "open");
      setPriority(f.priority ?? "medium");
      setDueDate(f.dueDate ? new Date(f.dueDate).toISOString().split("T")[0] : "");
      setDesc(f.description ?? "");
      setFolder(f.folder ?? "");
      setVexStatus(f.vulnerability?.vexStatus ?? "");
      setControlRef(f.controlRef ?? "");
      setDeviation(f.deviation ?? "");
      setRootCause(f.rootCause ?? "");
      setComments(Array.isArray(c) ? c : []);
      setAttachments(Array.isArray(a) ? a : []);
      // Load available folders for this type
      fetch(`/api/findings/folders?type=${f.type}`)
        .then(r => r.json())
        .then(d => setAvailFolders(Array.isArray(d) ? d : []));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  async function save() {
    setSaving(true);
    await fetch(`/api/findings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, priority, dueDate: dueDate || null, description, folder: folder || null, vexStatus, controlRef: controlRef || null, deviation: deviation || null, rootCause: rootCause || null }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function postComment() {
    if (!commentText.trim()) return;
    setPostingComment(true);
    const res = await fetch(`/api/findings/${id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: commentText, authorName: "Benutzer" }),
    });
    const c = await res.json();
    setComments(prev => [...prev, c]);
    setCommentText("");
    setPostingComment(false);
  }

  async function uploadFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(`/api/findings/${id}/attachments`, { method: "POST", body: fd });
    const a = await res.json();
    setAttachments(prev => [a, ...prev]);
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function deleteFinding() {
    if (!confirm("Maßnahme wirklich löschen?")) return;
    await fetch(`/api/findings/${id}`, { method: "DELETE" });
    router.back();
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!finding) return <div className="p-8 text-gray-500">Nicht gefunden.</div>;

  const vuln = finding.vulnerability;
  const asset = vuln?.component?.sbomDocument?.asset;
  const sbomId = vuln?.component?.sbomDocumentId;
  const p = PRIORITY_CFG[priority] ?? PRIORITY_CFG.medium;
  const s = STATUS_CFG[status] ?? STATUS_CFG.open;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-100 px-8 py-3.5 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-1.5 text-sm text-gray-400">
            <Link href="/findings" className="hover:text-blue-600 transition-colors">Maßnahmen</Link>
            <span>/</span>
            <span className="text-gray-600">{finding.type.replace("_", " ")}</span>
            <span>/</span>
            <span className="text-gray-800 font-medium truncate max-w-sm">{finding.title}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={deleteFinding} className="text-red-500 hover:bg-red-50 border-red-100 text-xs">
            <Trash2 className="w-3.5 h-3.5 mr-1" /> Löschen
          </Button>
          <Button size="sm" onClick={save} disabled={saving} className="bg-[#0066FF] hover:bg-blue-700 text-xs">
            <Save className="w-3.5 h-3.5 mr-1" />
            {saving ? "Speichert..." : saved ? "Gespeichert ✓" : "Speichern"}
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6 grid grid-cols-3 gap-5">
        {/* LEFT: Main */}
        <div className="col-span-2 space-y-4">
          {/* Title + CVE */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-start gap-3 mb-5">
              {finding.type === "vulnerability" && (
                <div className="p-2.5 bg-red-50 rounded-xl mt-0.5 shrink-0">
                  <ShieldAlert className="w-5 h-5 text-red-500" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                {vuln?.cveId && (
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="font-mono text-xs bg-red-50 border border-red-200 text-red-600 px-2 py-0.5 rounded">
                      {vuln.cveId}
                    </span>
                    <a href={`https://github.com/advisories/${vuln.cveId}`} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-blue-500 hover:underline flex items-center gap-0.5">
                      GitHub <ExternalLink className="w-3 h-3" />
                    </a>
                    {sbomId && (
                      <Link href={`/risks/sbom/${sbomId}`} className="text-xs text-blue-500 hover:underline flex items-center gap-0.5">
                        SBOM <ExternalLink className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                )}
                <h1 className="text-xl font-bold text-gray-900">{finding.title}</h1>
                <p className="text-xs text-gray-400 mt-1">
                  Erstellt {fmtDate(finding.createdAt)} · Aktualisiert {fmtDate(finding.updatedAt)}
                </p>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Beschreibung</label>
              <textarea
                value={description}
                onChange={e => setDesc(e.target.value)}
                rows={6}
                placeholder="Beschreibung hinzufügen..."
                className="w-full text-sm text-gray-700 border border-gray-200 rounded-xl p-3.5 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors"
              />
            </div>
          </div>

          {/* Audit Finding fields */}
          {finding.type === "audit_finding" && (
            <div className="bg-white rounded-2xl border border-blue-100 shadow-sm p-6 space-y-4">
              <h2 className="text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" /> Audit Details
              </h2>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">ISO Kontrolle</label>
                <input
                  value={controlRef} onChange={e => setControlRef(e.target.value)}
                  placeholder="z.B. A.8.1.1"
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Abweichung</label>
                <textarea
                  value={deviation} onChange={e => setDeviation(e.target.value)} rows={3}
                  placeholder="Festgestellte Abweichung..."
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Ursache</label>
                <textarea
                  value={rootCause} onChange={e => setRootCause(e.target.value)} rows={3}
                  placeholder="Ursache der Abweichung..."
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                />
              </div>
            </div>
          )}

          {/* CVE Details — only for vulnerability type */}
          {vuln && finding.type === "vulnerability" && (
            <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-6">
              <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-500" /> CVE Details
              </h2>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-xs text-gray-400 mb-1">CVSS Score</p>
                  <span className="font-bold text-gray-800 text-lg">{vuln.cvssScore ?? "—"}</span>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Severity</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${
                    vuln.severity === "CRITICAL" ? "bg-red-100 text-red-700 border-red-200" :
                    vuln.severity === "HIGH" ? "bg-orange-100 text-orange-700 border-orange-200" :
                    vuln.severity === "MEDIUM" ? "bg-yellow-100 text-yellow-700 border-yellow-200" :
                    "bg-blue-100 text-blue-700 border-blue-200"
                  }`}>{vuln.severity}</span>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Komponente</p>
                  <span className="font-medium text-gray-700">{vuln.component?.name ?? "—"}</span>
                  {vuln.component?.version && <span className="text-gray-400 text-xs ml-1">v{vuln.component.version}</span>}
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Asset</p>
                  {asset
                    ? <Link href={`/risks/${asset.id}`} className="text-blue-600 hover:underline text-sm">{asset.name}</Link>
                    : <span className="text-gray-400">—</span>}
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">SBOM Version</p>
                  {sbomId
                    ? <Link href={`/risks/sbom/${sbomId}`} className="text-blue-600 hover:underline text-sm flex items-center gap-1">
                        {vuln.component?.sbomDocument?.versionLabel ?? "SBOM"} <ExternalLink className="w-3 h-3" />
                      </Link>
                    : <span className="text-gray-400">—</span>}
                </div>
              </div>
              {vuln.remediation && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-400 mb-1">Beschreibung / Remediation</p>
                  <p className="text-xs text-gray-600 leading-relaxed">{vuln.remediation}</p>
                </div>
              )}
            </div>
          )}

          {/* Attachments */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-gray-400" />
                Anhänge ({attachments.length})
              </h2>
              <Button size="sm" variant="outline" className="text-xs" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                <Paperclip className="w-3.5 h-3.5 mr-1" />
                {uploading ? "Lädt hoch..." : "Datei anhängen"}
              </Button>
              <input ref={fileInputRef} type="file" className="hidden" onChange={uploadFile} />
            </div>

            {attachments.length === 0 ? (
              <div
                className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-blue-300 hover:bg-blue-50/20 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Paperclip className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm text-gray-400">Dateien hier ablegen oder klicken zum Hochladen</p>
                <p className="text-xs text-gray-300 mt-1">PDF, Word, Excel, Bilder...</p>
              </div>
            ) : (
              <div className="space-y-2">
                {attachments.map(a => (
                  <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors group">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <File className="w-4 h-4 text-gray-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-700 truncate">{a.fileName}</p>
                      <p className="text-xs text-gray-400">{fmtBytes(a.fileSize)} · {fmtDateTime(a.createdAt)}</p>
                    </div>
                    <a href={a.fileUrl} download className="text-gray-400 hover:text-blue-600 p-1.5 rounded-lg hover:bg-blue-50 transition-colors opacity-0 group-hover:opacity-100">
                      <Download className="w-4 h-4" />
                    </a>
                  </div>
                ))}
                <div
                  className="flex items-center gap-2 p-3 rounded-xl border-2 border-dashed border-gray-200 cursor-pointer hover:border-blue-300 hover:bg-blue-50/20 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip className="w-4 h-4 text-gray-300" />
                  <span className="text-xs text-gray-400">Weitere Datei hinzufügen</span>
                </div>
              </div>
            )}
          </div>

          {/* Comments */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
              <MessageSquare className="w-4 h-4 text-gray-400" />
              Kommentare ({comments.length})
            </h2>

            <div className="space-y-4 mb-5">
              {comments.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">Noch keine Kommentare</p>
              ) : comments.map(c => (
                <div key={c.id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0 text-xs font-bold text-blue-600">
                    {c.authorName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-gray-700">{c.authorName}</span>
                      <span className="text-xs text-gray-400">{fmtDateTime(c.createdAt)}</span>
                    </div>
                    <div className="bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-700 leading-relaxed">
                      {c.content}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* New Comment */}
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center shrink-0 text-xs font-bold text-white">
                B
              </div>
              <div className="flex-1 relative">
                <textarea
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) postComment(); }}
                  rows={3}
                  placeholder="Kommentar schreiben... (Strg+Enter zum Senden)"
                  className="w-full text-sm border border-gray-200 rounded-xl p-3.5 pr-12 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors"
                />
                <button
                  onClick={postComment}
                  disabled={!commentText.trim() || postingComment}
                  className="absolute bottom-3 right-3 p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Sidebar */}
        <div className="space-y-4">
          {/* Properties */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Eigenschaften</h3>

            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Status</label>
              <div className="relative">
                <select value={status} onChange={e => setStatus(e.target.value)}
                  className={`w-full text-xs font-medium px-3 py-2 rounded-lg border appearance-none cursor-pointer focus:outline-none ${s.cls}`}>
                  <option value="open">Offen</option>
                  <option value="in_progress">In Bearbeitung</option>
                  <option value="review">In Review</option>
                  <option value="closed">Abgeschlossen</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" />
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Priorität</label>
              <div className="relative">
                <select value={priority} onChange={e => setPriority(e.target.value)}
                  className={`w-full text-xs font-medium px-3 py-2 rounded-lg border appearance-none cursor-pointer focus:outline-none ${p.cls}`}>
                  <option value="critical">Kritisch</option>
                  <option value="high">Hoch</option>
                  <option value="medium">Mittel</option>
                  <option value="low">Niedrig</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" />
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Fällig am</label>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1.5 flex items-center gap-1.5">
                <Folder className="w-3 h-3" /> Ordner
              </label>
              <select value={folder} onChange={e => setFolder(e.target.value)}
                className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400">
                <option value="">Kein Ordner</option>
                {availFolders.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
                {folder && !availFolders.find(f => f.name === folder) && (
                  <option value={folder}>{folder}</option>
                )}
              </select>
            </div>

            {finding.assignee && (
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">Zugewiesen an</label>
                <p className="text-sm font-medium text-gray-700">
                  {finding.assignee.firstName} {finding.assignee.lastName}
                </p>
              </div>
            )}
          </div>

          {/* VEX Status */}
          {vuln && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">VEX Status</h3>
              <div className="relative">
                <select value={vexStatus} onChange={e => setVexStatus(e.target.value)}
                  className={`w-full text-xs font-medium px-3 py-2 rounded-lg border appearance-none cursor-pointer focus:outline-none ${VEX_CFG[vexStatus]?.cls ?? "border-gray-200 text-gray-700"}`}>
                  <option value="under_investigation">In Untersuchung</option>
                  <option value="affected">Betroffen</option>
                  <option value="not_affected">Nicht betroffen</option>
                  <option value="fixed">Behoben</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" />
              </div>
            </div>
          )}

          {/* Meta */}
          <div className="bg-gray-50 rounded-2xl border border-gray-100 p-4 text-xs text-gray-400 space-y-1.5">
            <div className="flex justify-between"><span>Erstellt</span><span className="text-gray-600">{fmtDate(finding.createdAt)}</span></div>
            <div className="flex justify-between"><span>Aktualisiert</span><span className="text-gray-600">{fmtDate(finding.updatedAt)}</span></div>
            <div className="flex justify-between"><span>Typ</span><span className="text-gray-600 capitalize">{finding.type.replace("_", " ")}</span></div>
            <div className="flex justify-between"><span>Kommentare</span><span className="text-gray-600">{comments.length}</span></div>
            <div className="flex justify-between"><span>Anhänge</span><span className="text-gray-600">{attachments.length}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
