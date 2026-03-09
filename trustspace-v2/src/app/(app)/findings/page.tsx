"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Plus,
  AlertCircle,
  CheckCircle2,
  Clock,
  ShieldAlert,
  ClipboardList,
  TrendingUp,
  Bug,
  ExternalLink,
  ChevronRight,
  Folder,
  FolderOpen,
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
    component?: {
      sbomDocumentId: string;
      sbomDocument?: { asset?: { id: string; name: string } | null } | null;
    } | null;
  } | null;
};

const TYPE_LABEL: Record<string, string> = {
  audit_finding: "Audit-Finding",
  incident: "Vorfall",
  improvement: "Verbesserung",
  task: "Aufgabe",
  vulnerability: "Schwachstelle",
};

const PRIORITY_CFG: Record<string, { label: string; cls: string }> = {
  critical: { label: "Kritisch", cls: "bg-red-100 text-red-700" },
  high:     { label: "Hoch",     cls: "bg-orange-100 text-orange-700" },
  medium:   { label: "Mittel",   cls: "bg-yellow-100 text-yellow-700" },
  low:      { label: "Niedrig",  cls: "bg-blue-100 text-blue-700" },
};

const STATUS_CFG: Record<string, { label: string; icon: React.ReactNode; cls: string; bg: string }> = {
  open:        { label: "Offen",          icon: <AlertCircle className="w-3 h-3" />,   cls: "text-red-600",    bg: "bg-red-50 border-red-200" },
  in_progress: { label: "In Bearbeitung", icon: <Clock className="w-3 h-3" />,         cls: "text-yellow-700", bg: "bg-yellow-50 border-yellow-200" },
  review:      { label: "In Review",      icon: <Clock className="w-3 h-3" />,         cls: "text-blue-600",   bg: "bg-blue-50 border-blue-200" },
  closed:      { label: "Abgeschlossen",  icon: <CheckCircle2 className="w-3 h-3" />,  cls: "text-green-600",  bg: "bg-green-50 border-green-200" },
};

const CATEGORIES = [
  {
    type: "vulnerability",
    label: "Schwachstellen",
    description: "CVE & Security Issues",
    icon: ShieldAlert,
    gradient: "from-red-500 via-red-600 to-orange-500",
    accent: "border-red-200",
    countColor: "text-red-600",
  },
  {
    type: "audit_finding",
    label: "Audit Findings",
    description: "Befunde aus Audits",
    icon: ClipboardList,
    gradient: "from-blue-500 via-blue-600 to-indigo-500",
    accent: "border-blue-200",
    countColor: "text-blue-600",
  },
  {
    type: "improvement",
    label: "Verbesserungen",
    description: "Optimierungsmaßnahmen",
    icon: TrendingUp,
    gradient: "from-green-500 via-green-600 to-emerald-500",
    accent: "border-green-200",
    countColor: "text-green-600",
  },
  {
    type: "incident",
    label: "Vorfälle",
    description: "Sicherheitsvorfälle",
    icon: Bug,
    gradient: "from-purple-500 via-purple-600 to-pink-500",
    accent: "border-purple-200",
    countColor: "text-purple-600",
  },
  {
    type: "task",
    label: "Aufgaben",
    description: "Allgemeine Aufgaben",
    icon: ClipboardList,
    gradient: "from-gray-500 via-gray-600 to-slate-600",
    accent: "border-gray-200",
    countColor: "text-gray-600",
  },
];

function formatDate(d: string | null) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function FindingsPage() {
  const router = useRouter();
  const [findings, setFindings] = useState<Finding[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [openFolders, setOpenFolders] = useState<Set<string>>(new Set(["__ungrouped__"]));

  useEffect(() => {
    fetch("/api/findings")
      .then(r => r.json())
      .then(data => { setFindings(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const byType = (type: string) => findings.filter(f => f.type === type);
  const countStatus = (list: Finding[], status: string) => list.filter(f => f.status === status).length;

  const openCount    = findings.filter(f => f.status === "open").length;
  const inProgCount  = findings.filter(f => f.status === "in_progress").length;
  const closedCount  = findings.filter(f => f.status === "closed").length;

  const activeCat = CATEGORIES.find(c => c.type === activeCategory);
  const tableFindings = activeCategory ? byType(activeCategory) : findings;

  return (
    <div className="p-8 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Maßnahmen</h1>
          <p className="text-sm text-gray-500 mt-1">
            Schwachstellen, Findings, Aufgaben und Verbesserungen
            {activeCategory && activeCat && (
              <span className="ml-2 text-blue-600 font-medium">
                / {activeCat.label}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {activeCategory && (
            <Button variant="outline" size="sm" onClick={() => setActiveCategory(null)}>
              Alle anzeigen
            </Button>
          )}
          <Button className="bg-[#0066FF] hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Maßnahme erstellen
          </Button>
        </div>
      </div>

      {/* KPI Bar */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Offen",          count: openCount,   color: "text-red-600",    bg: "bg-white border-gray-100",    dot: "bg-red-500",    icon: <AlertCircle className="w-5 h-5 text-red-400" /> },
          { label: "In Bearbeitung", count: inProgCount, color: "text-yellow-700", bg: "bg-white border-gray-100",    dot: "bg-yellow-500", icon: <Clock className="w-5 h-5 text-yellow-400" /> },
          { label: "Abgeschlossen",  count: closedCount, color: "text-green-600",  bg: "bg-white border-gray-100",    dot: "bg-green-500",  icon: <CheckCircle2 className="w-5 h-5 text-green-400" /> },
        ].map(({ label, count, color, bg, icon }) => (
          <div key={label} className={`flex items-center gap-4 p-5 rounded-xl border shadow-sm ${bg}`}>
            <div className="p-2.5 rounded-lg bg-gray-50">
              {icon}
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">{label}</p>
              <p className={`text-3xl font-bold ${color}`}>{count}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Category Cards */}
      <div className="grid grid-cols-5 gap-4">
        {CATEGORIES.map(({ type, label, description, icon: Icon, gradient, accent }) => {
          const list = byType(type);
          const total = list.length;
          const isActive = activeCategory === type;
          return (
            <button
              key={type}
              onClick={() => router.push(`/findings/${type}`)}
              className={`text-left bg-white rounded-2xl border overflow-hidden shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 border-gray-100`}
            >
              {/* Gradient Header */}
              <div className={`bg-gradient-to-br ${gradient} p-5 relative overflow-hidden`}>
                <div className="absolute inset-0 bg-black/10 rounded-full w-24 h-24 -top-8 -right-8" />
                <div className="absolute inset-0 bg-white/10 rounded-full w-16 h-16 -bottom-6 -left-4" />
                <div className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-white/20 rounded-xl">
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <ChevronRight className="w-4 h-4 text-white/80" />
                  </div>
                  <p className="text-white font-bold text-base leading-tight">{label}</p>
                  <p className="text-white/70 text-xs mt-0.5">{description}</p>
                </div>
              </div>

              {/* Stats */}
              <div className="p-3 space-y-1">
                <div className="flex items-center justify-between py-0.5">
                  <span className="text-xs text-gray-500 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 inline-block" />
                    In Bearbeitung
                  </span>
                  <span className="text-xs font-bold text-yellow-700">{countStatus(list, "in_progress")}</span>
                </div>
                <div className="flex items-center justify-between py-0.5">
                  <span className="text-xs text-gray-500 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />
                    Offen
                  </span>
                  <span className="text-xs font-bold text-red-600">{countStatus(list, "open")}</span>
                </div>
                <div className="flex items-center justify-between py-0.5">
                  <span className="text-xs text-gray-500 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                    Abgeschlossen
                  </span>
                  <span className="text-xs font-bold text-green-600">{countStatus(list, "closed")}</span>
                </div>
                <div className="pt-1 mt-1 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs text-gray-400">Gesamt</span>
                  <span className="text-xs font-bold text-gray-700">{total}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            {activeCat ? (
              <>
                <activeCat.icon className="w-5 h-5 text-gray-500" />
                <h2 className="font-semibold text-gray-900">{activeCat.label} ({tableFindings.length})</h2>
              </>
            ) : (
              <>
                <ClipboardList className="w-5 h-5 text-gray-500" />
                <h2 className="font-semibold text-gray-900">Alle Maßnahmen ({tableFindings.length})</h2>
              </>
            )}
          </div>
          <Button size="sm" variant="outline" className="text-xs">
            <Plus className="w-3.5 h-3.5 mr-1" />
            Hinzufügen
          </Button>
        </div>

        {loading ? (
          <div className="py-16 text-center text-gray-400">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm">Lade Maßnahmen...</p>
          </div>
        ) : tableFindings.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <ClipboardList className="w-10 h-10 mx-auto mb-3 text-gray-200" />
            <p className="text-sm font-medium text-gray-400">Keine Einträge vorhanden</p>
            <p className="text-xs text-gray-300 mt-1">Füge eine neue Maßnahme hinzu</p>
          </div>
        ) : (() => {
          // Group findings by folder
          const grouped = new Map<string, Finding[]>();
          for (const f of tableFindings) {
            const key = f.folder || "__ungrouped__";
            if (!grouped.has(key)) grouped.set(key, []);
            grouped.get(key)!.push(f);
          }
          // Sort: named folders first, ungrouped last
          const entries = [...grouped.entries()].sort(([a], [b]) => {
            if (a === "__ungrouped__") return 1;
            if (b === "__ungrouped__") return -1;
            return a.localeCompare(b);
          });

          const toggleFolder = (key: string) => {
            setOpenFolders(prev => {
              const next = new Set(prev);
              next.has(key) ? next.delete(key) : next.add(key);
              return next;
            });
          };

          const cols = !activeCategory ? 8 : 7;

          return (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-xs text-gray-400 bg-gray-50/50">
                  <th className="text-left py-3 px-6 font-semibold">Name</th>
                  <th className="text-left py-3 px-4 font-semibold">Assets</th>
                  <th className="text-center py-3 px-4 font-semibold">Priorität</th>
                  <th className="text-left py-3 px-4 font-semibold">Verantwortlich</th>
                  <th className="text-center py-3 px-4 font-semibold">Zu erledigen bis</th>
                  <th className="text-center py-3 px-4 font-semibold">Erstellt am</th>
                  <th className="text-center py-3 px-4 font-semibold">Status</th>
                  {!activeCategory && <th className="text-center py-3 px-4 font-semibold">Typ</th>}
                </tr>
              </thead>
              <tbody>
                {entries.map(([folderKey, items]) => {
                  const isOpen = openFolders.has(folderKey);
                  const folderLabel = folderKey === "__ungrouped__" ? "Ohne Ordner" : folderKey;
                  const hasMultipleFolders = entries.length > 1 || folderKey !== "__ungrouped__";
                  return (
                    <>
                      {/* Folder Row (only show if there are multiple folders) */}
                      {hasMultipleFolders && (
                        <tr
                          key={`folder-${folderKey}`}
                          className="bg-gray-50/80 border-y border-gray-100 cursor-pointer hover:bg-gray-100/80 transition-colors"
                          onClick={() => toggleFolder(folderKey)}
                        >
                          <td colSpan={cols} className="py-2.5 px-6">
                            <div className="flex items-center gap-2">
                              {isOpen
                                ? <FolderOpen className="w-4 h-4 text-blue-500" />
                                : <Folder className="w-4 h-4 text-gray-400" />
                              }
                              <span className="text-xs font-semibold text-gray-600">{folderLabel}</span>
                              <span className="text-xs text-gray-400 ml-1">({items.length})</span>
                              <ChevronRight className={`w-3.5 h-3.5 text-gray-400 ml-auto transition-transform ${isOpen ? "rotate-90" : ""}`} />
                            </div>
                          </td>
                        </tr>
                      )}
                      {/* Finding Rows */}
                      {isOpen && items.map(f => {
                        const p = PRIORITY_CFG[f.priority] ?? PRIORITY_CFG.medium;
                        const s = STATUS_CFG[f.status] ?? STATUS_CFG.open;
                        const asset = f.vulnerability?.component?.sbomDocument?.asset;
                        const sbomId = f.vulnerability?.component?.sbomDocumentId;
                        const cveId = f.vulnerability?.cveId;
                        return (
                          <tr
                            key={f.id}
                            className="hover:bg-blue-50/40 transition-colors group cursor-pointer border-b border-gray-50"
                            onClick={() => router.push(`/findings/ticket/${f.id}`)}
                          >
                            <td className="py-3.5 px-6">
                              <div>
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
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-gray-500 text-xs">{asset?.name ?? "—"}</td>
                            <td className="py-3.5 px-4 text-center">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.cls}`}>{p.label}</span>
                            </td>
                            <td className="py-3.5 px-4 text-gray-500 text-xs">
                              {f.assignee ? `${f.assignee.firstName} ${f.assignee.lastName}` : <span className="text-gray-300">—</span>}
                            </td>
                            <td className="py-3.5 px-4 text-center text-gray-500 text-xs">
                              {f.dueDate
                                ? <span className={new Date(f.dueDate) < new Date() ? "text-red-500 font-medium" : ""}>{formatDate(f.dueDate)}</span>
                                : <span className="text-gray-300">—</span>}
                            </td>
                            <td className="py-3.5 px-4 text-center text-gray-400 text-xs">{formatDate(f.createdAt)}</td>
                            <td className="py-3.5 px-4 text-center">
                              <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium ${s.cls} ${s.bg}`}>
                                {s.icon} {s.label}
                              </span>
                            </td>
                            {!activeCategory && (
                              <td className="py-3.5 px-4 text-center">
                                <span className="text-xs border border-gray-100 rounded-full px-2 py-0.5 text-gray-500 bg-gray-50">
                                  {TYPE_LABEL[f.type] ?? f.type}
                                </span>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </>
                  );
                })}
              </tbody>
            </table>
          );
        })()}
      </div>
    </div>
  );
}
