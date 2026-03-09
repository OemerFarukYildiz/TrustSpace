"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ChevronLeft,
  Search,
  Shield,
  AlertTriangle,
  ExternalLink,
  ScanLine,
  Download,
  ChevronDown,
  ChevronRight,
  Package,
  Loader2,
  ClipboardList,
  X,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Vulnerability {
  id: string;
  cveId: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  cvssScore?: number;
  vexStatus: string;
  remediation?: string;
  lastCheckedAt?: string;
}

interface Component {
  id: string;
  name: string;
  version?: string;
  purl?: string;
  licenseSpdx?: string;
  dependencyType: string;
  vulnerabilities: Vulnerability[];
}

interface SBOMDetail {
  id: string;
  format: string;
  versionLabel: string;
  vulnerabilitySummary: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  components: Component[];
  asset: { id: string; name: string; category: string };
}

interface OSVDetail {
  id: string;
  aliases: string[];
  summary: string;
  details: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  cvssScore?: number;
  cvssVector?: string;
  published: string;
  modified: string;
  affected: Array<{
    name: string;
    ecosystem: string;
    ranges: Array<{ type: string; introduced?: string; fixed?: string }>;
  }>;
  references: Array<{ type: string; url: string }>;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SEVERITY_ORDER: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

const SEV = {
  CRITICAL: { bg: "bg-red-100", text: "text-red-700", border: "border-red-200", dot: "bg-red-500", label: "Critical", score: "9.0–10.0" },
  HIGH:     { bg: "bg-orange-100", text: "text-orange-700", border: "border-orange-200", dot: "bg-orange-500", label: "High", score: "7.0–8.9" },
  MEDIUM:   { bg: "bg-yellow-100", text: "text-yellow-700", border: "border-yellow-200", dot: "bg-yellow-500", label: "Medium", score: "4.0–6.9" },
  LOW:      { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-200", dot: "bg-blue-500", label: "Low", score: "0.1–3.9" },
} as const;

function vulnUrl(id: string) {
  if (id.startsWith("GHSA-")) return `https://github.com/advisories/${id}`;
  if (id.startsWith("CVE-"))  return `https://nvd.nist.gov/vuln/detail/${id}`;
  return `https://osv.dev/vulnerability/${id}`;
}

function SeverityBadge({ sev }: { sev: keyof typeof SEV }) {
  const c = SEV[sev] ?? SEV.LOW;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-xs font-semibold ${c.bg} ${c.text} ${c.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}

// ─── Vulnerability expanded detail panel ──────────────────────────────────────

function VulnDetail({ cveId }: { cveId: string }) {
  const [data, setData] = useState<OSVDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`/api/osv/${cveId}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [cveId]);

  if (loading) return (
    <div className="flex items-center gap-2 py-4 text-gray-400 text-sm">
      <Loader2 className="w-4 h-4 animate-spin" /> Lade Details...
    </div>
  );

  if (error || !data) return (
    <p className="text-sm text-red-500 py-2">Details konnten nicht geladen werden.</p>
  );

  const sev = SEV[data.severity] ?? SEV.LOW;

  return (
    <div className="space-y-4">
      {/* Top row: Severity + CVSS + Aliases */}
      <div className="flex flex-wrap gap-3 items-start">
        <div className="bg-white rounded border border-gray-200 px-3 py-2 min-w-[110px]">
          <p className="text-xs text-gray-400 mb-1">Severity</p>
          <SeverityBadge sev={data.severity} />
        </div>
        {data.cvssScore != null && (
          <div className="bg-white rounded border border-gray-200 px-3 py-2 min-w-[100px]">
            <p className="text-xs text-gray-400 mb-1">CVSS Score</p>
            <p className={`text-lg font-bold ${sev.text}`}>{data.cvssScore.toFixed(1)}</p>
          </div>
        )}
        {data.aliases.length > 0 && (
          <div className="bg-white rounded border border-gray-200 px-3 py-2">
            <p className="text-xs text-gray-400 mb-1">Aliasse / CVEs</p>
            <div className="flex flex-wrap gap-1">
              {data.aliases.map(a => (
                <a key={a} href={vulnUrl(a)} target="_blank" rel="noopener noreferrer"
                  className="text-xs font-mono text-blue-600 hover:underline">
                  {a}
                </a>
              ))}
            </div>
          </div>
        )}
        {data.cvssVector && (
          <div className="bg-white rounded border border-gray-200 px-3 py-2 flex-1 min-w-[200px]">
            <p className="text-xs text-gray-400 mb-1">CVSS Vektor</p>
            <p className="text-xs font-mono text-gray-600 break-all">{data.cvssVector}</p>
          </div>
        )}
      </div>

      {/* Summary */}
      {data.summary && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Zusammenfassung</p>
          <p className="text-sm text-gray-800 leading-relaxed">{data.summary}</p>
        </div>
      )}

      {/* Details */}
      {data.details && data.details !== data.summary && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Beschreibung</p>
          <div className="text-sm text-gray-700 leading-relaxed bg-white border border-gray-200 rounded p-3 max-h-52 overflow-y-auto whitespace-pre-wrap">
            {data.details}
          </div>
        </div>
      )}

      {/* Affected versions */}
      {data.affected.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Betroffene Versionen</p>
          <div className="space-y-2">
            {data.affected.map((pkg, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded p-3">
                <p className="text-sm font-medium text-gray-800">
                  {pkg.name}
                  <span className="text-xs text-gray-400 ml-2">{pkg.ecosystem}</span>
                </p>
                {pkg.ranges.map((r, j) => (
                  <div key={j} className="mt-1 flex gap-4 text-xs">
                    {r.introduced && (
                      <span className="text-red-600">
                        Betroffen ab: <span className="font-mono">{r.introduced}</span>
                      </span>
                    )}
                    {r.fixed ? (
                      <span className="text-green-600">
                        Gepatcht in: <span className="font-mono font-semibold">{r.fixed}</span>
                      </span>
                    ) : (
                      <span className="text-orange-600">Kein Patch verfügbar</span>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* References */}
      {data.references.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Referenzen</p>
          <div className="flex flex-col gap-1">
            {data.references.map((ref, i) => (
              <a key={i} href={ref.url} target="_blank" rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline flex items-center gap-1 truncate">
                <ExternalLink className="w-3 h-3 flex-shrink-0" />
                {ref.url}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Dates */}
      <div className="flex gap-4 text-xs text-gray-400">
        <span>Veröffentlicht: {new Date(data.published).toLocaleDateString("de-DE")}</span>
        <span>Aktualisiert: {new Date(data.modified).toLocaleDateString("de-DE")}</span>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function SBOMDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [sbom, setSbom] = useState<SBOMDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [search, setSearch] = useState("");
  const [filterSeverity, setFilterSeverity] = useState<string>("all");
  const [expandedVulns, setExpandedVulns] = useState<Set<string>>(new Set());
  const [showOnlyVulnerable, setShowOnlyVulnerable] = useState(false);
  const [findingModal, setFindingModal] = useState<{ vuln: Vulnerability; componentName: string } | null>(null);
  const [findingDueDate, setFindingDueDate] = useState("");
  const [creatingFinding, setCreatingFinding] = useState(false);

  const loadDetail = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/sbom/${id}`);
      if (res.ok) setSbom(await res.json());
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadDetail(); }, [loadDetail]);

  const triggerScan = async () => {
    setScanning(true);
    try {
      const res = await fetch(`/api/sbom/${id}/scan`, { method: "POST" });
      if (res.ok) await loadDetail();
    } finally {
      setScanning(false);
    }
  };

  const createFinding = async () => {
    if (!findingModal) return;
    setCreatingFinding(true);
    try {
      const { vuln, componentName } = findingModal;
      const priority = vuln.severity.toLowerCase() as "low" | "medium" | "high" | "critical";
      const res = await fetch("/api/findings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `${vuln.cveId} in ${componentName} beheben`,
          description: vuln.remediation
            ? `CVE: ${vuln.cveId}\nKomponente: ${componentName}\n\n${vuln.remediation}`
            : `CVE: ${vuln.cveId}\nKomponente: ${componentName}`,
          priority,
          dueDate: findingDueDate || undefined,
          vulnerabilityId: vuln.id,
          vexStatus: "affected",
        }),
      });
      if (res.ok) {
        setFindingModal(null);
        setFindingDueDate("");
        alert("Maßnahme wurde erstellt und ist unter /findings sichtbar.");
      } else {
        const err = await res.json();
        alert(`Fehler: ${err.error}`);
      }
    } finally {
      setCreatingFinding(false);
    }
  };

  const toggleVuln = (vulnId: string) => {
    setExpandedVulns(prev => {
      const next = new Set(prev);
      next.has(vulnId) ? next.delete(vulnId) : next.add(vulnId);
      return next;
    });
  };

  if (loading) return <div className="p-8 text-gray-400 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Laden...</div>;
  if (!sbom) return <div className="p-8 text-red-500">SBOM nicht gefunden.</div>;

  const { vulnerabilitySummary: vs } = sbom;

  // All vulns flattened and sorted by severity
  const allVulns = sbom.components
    .flatMap(c => c.vulnerabilities.map(v => ({ ...v, componentName: c.name, componentVersion: c.version })))
    .sort((a, b) => (SEVERITY_ORDER[a.severity] ?? 9) - (SEVERITY_ORDER[b.severity] ?? 9));

  // Filtered components
  const filteredComponents = sbom.components
    .filter(c => {
      if (showOnlyVulnerable && c.vulnerabilities.length === 0) return false;
      if (filterSeverity !== "all" && !c.vulnerabilities.some(v => v.severity === filterSeverity.toUpperCase())) return false;
      if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      const aMin = Math.min(...(a.vulnerabilities.length ? a.vulnerabilities.map(v => SEVERITY_ORDER[v.severity] ?? 9) : [99]));
      const bMin = Math.min(...(b.vulnerabilities.length ? b.vulnerabilities.map(v => SEVERITY_ORDER[v.severity] ?? 9) : [99]));
      return aMin - bMin;
    });

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/risks" className="hover:text-gray-900">Risk & Asset Management</Link>
        <span>/</span>
        <Link href="/risks/sbom" className="hover:text-gray-900">SBOM Overview</Link>
        <span>/</span>
        <span className="text-gray-900">{sbom.asset.name}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.push("/risks/sbom")}>
            <ChevronLeft className="w-4 h-4 mr-1" /> Zurück
          </Button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded uppercase">{sbom.format}</span>
              <h1 className="text-2xl font-semibold text-gray-900">{sbom.asset.name}</h1>
              <span className="text-gray-400">·</span>
              <span className="text-gray-500 text-sm font-mono">{sbom.versionLabel}</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">{sbom.components.length.toLocaleString()} Komponenten</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => window.open(`/api/sbom/${id}/export`, "_blank")}>
            <Download className="w-4 h-4 mr-2" /> Exportieren
          </Button>
          <Button size="sm" className="bg-[#0066FF] hover:bg-blue-700 text-white" disabled={scanning} onClick={triggerScan}>
            <ScanLine className={`w-4 h-4 mr-2 ${scanning ? "animate-spin" : ""}`} />
            {scanning ? "Scannen..." : "Neu scannen"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => router.push(`/risks/${sbom.asset.id}?tab=sbom`)}>
            <ExternalLink className="w-4 h-4 mr-2" /> Asset öffnen
          </Button>
        </div>
      </div>

      {/* Severity summary cards */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { label: "Gesamt", value: vs.total, color: "text-gray-900", sub: "Schwachstellen" },
          { label: "Critical", value: vs.critical, color: vs.critical > 0 ? "text-red-700" : "text-gray-300", sub: "CVSS ≥ 9.0", active: vs.critical > 0, activeBg: "bg-red-50 border-red-200" },
          { label: "High", value: vs.high, color: vs.high > 0 ? "text-orange-700" : "text-gray-300", sub: "CVSS 7.0–8.9", active: vs.high > 0, activeBg: "bg-orange-50 border-orange-200" },
          { label: "Medium", value: vs.medium, color: vs.medium > 0 ? "text-yellow-700" : "text-gray-300", sub: "CVSS 4.0–6.9", active: vs.medium > 0, activeBg: "bg-yellow-50 border-yellow-200" },
          { label: "Low", value: vs.low, color: vs.low > 0 ? "text-blue-700" : "text-gray-300", sub: "CVSS < 4.0", active: vs.low > 0, activeBg: "bg-blue-50 border-blue-200" },
        ].map(card => (
          <div key={card.label} className={`rounded-lg border p-4 ${(card as any).active ? (card as any).activeBg : "bg-white border-gray-100"}`}>
            <p className="text-xs text-gray-500 font-medium">{card.label}</p>
            <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Alert banner */}
      {(vs.critical > 0 || vs.high > 0) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-red-900">
              {[vs.critical > 0 && `${vs.critical} Critical`, vs.high > 0 && `${vs.high} High`].filter(Boolean).join(" und ")} Schwachstellen erfordern sofortige Maßnahmen
            </p>
            <p className="text-sm text-red-700 mt-1">
              Aktualisieren Sie die betroffenen Pakete auf die gepatchten Versionen. Klicken Sie auf eine Schwachstelle für Details.
            </p>
          </div>
        </div>
      )}

      {/* ── Vulnerability list ── */}
      {allVulns.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Gefundene Schwachstellen ({allVulns.length})</h2>
            <p className="text-xs text-gray-400">Klicken für Details</p>
          </div>
          <div className="divide-y divide-gray-100">
            {allVulns.map(vuln => {
              const cfg = SEV[vuln.severity] ?? SEV.LOW;
              const isOpen = expandedVulns.has(vuln.id);
              return (
                <div key={vuln.id}>
                  {/* Row */}
                  <button
                    className="w-full text-left px-5 py-3.5 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                    onClick={() => toggleVuln(vuln.id)}
                  >
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
                    <SeverityBadge sev={vuln.severity} />
                    <span className="font-mono text-sm font-semibold text-gray-800">{vuln.cveId}</span>
                    <span className="text-xs text-gray-400">in</span>
                    <span className="text-sm text-gray-700 font-medium">{(vuln as any).componentName}</span>
                    {(vuln as any).componentVersion && (
                      <span className="font-mono text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{(vuln as any).componentVersion}</span>
                    )}
                    <span className="ml-auto flex items-center gap-2 flex-shrink-0">
                      <a href={vulnUrl(vuln.cveId)} target="_blank" rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                        GitHub <ExternalLink className="w-3 h-3" />
                      </a>
                      {isOpen
                        ? <ChevronDown className="w-4 h-4 text-gray-400" />
                        : <ChevronRight className="w-4 h-4 text-gray-400" />
                      }
                    </span>
                  </button>

                  {/* Expanded panel – fetches OSV details */}
                  {isOpen && (
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                      <VulnDetail cveId={vuln.cveId} />
                      <div className="mt-3 pt-3 border-t border-gray-200 flex items-center gap-2">
                        <span className="text-xs text-gray-400">VEX-Status:</span>
                        <span className="text-xs px-2 py-0.5 rounded bg-yellow-100 text-yellow-700 font-medium">{vuln.vexStatus}</span>
                        <button
                          onClick={() => setFindingModal({ vuln, componentName: (vuln as any).componentName || "" })}
                          className="ml-auto flex items-center gap-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition-colors"
                        >
                          <ClipboardList className="w-3.5 h-3.5" />
                          Als Maßnahme erstellen
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {vs.total === 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <Shield className="w-5 h-5 text-green-600" />
          <p className="font-medium text-green-900">Keine Schwachstellen gefunden – alle Komponenten sind sicher.</p>
        </div>
      )}

      {/* ── Component table ── */}
      <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-4 flex-wrap">
          <h2 className="font-semibold text-gray-900">Alle Komponenten ({sbom.components.length.toLocaleString()})</h2>
          <div className="flex items-center gap-3 flex-wrap">
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input type="checkbox" checked={showOnlyVulnerable} onChange={e => setShowOnlyVulnerable(e.target.checked)} className="rounded" />
              Nur gefährdete
            </label>
            <select className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white" value={filterSeverity} onChange={e => setFilterSeverity(e.target.value)}>
              <option value="all">Alle Schweregrade</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input placeholder="Komponente suchen..." className="pl-9 h-8 text-sm w-56" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
        </div>

        {filteredComponents.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Package className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p>Keine Komponenten gefunden</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-5 py-3">Komponente</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-3 py-3 w-32">Version</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-3 py-3 w-28">Lizenz</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-3 py-3">Schwachstellen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredComponents.map(comp => (
                <tr key={comp.id} className={comp.vulnerabilities.length > 0 ? "bg-red-50/20" : ""}>
                  <td className="px-5 py-3">
                    <span className="font-medium text-sm text-gray-900">{comp.name}</span>
                  </td>
                  <td className="px-3 py-3">
                    <span className="text-xs font-mono text-gray-500">{comp.version || "—"}</span>
                  </td>
                  <td className="px-3 py-3">
                    <span className="text-xs text-gray-500">{comp.licenseSpdx || "—"}</span>
                  </td>
                  <td className="px-3 py-3">
                    {comp.vulnerabilities.length === 0 ? (
                      <div className="flex items-center gap-1 text-green-600">
                        <Shield className="w-3.5 h-3.5" /><span className="text-xs">Sicher</span>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {comp.vulnerabilities
                          .sort((a, b) => (SEVERITY_ORDER[a.severity] ?? 9) - (SEVERITY_ORDER[b.severity] ?? 9))
                          .map(vuln => {
                            const cfg = SEV[vuln.severity] ?? SEV.LOW;
                            return (
                              <button
                                key={vuln.id}
                                onClick={() => {
                                  // Scroll to and open the vuln in the list above
                                  toggleVuln(vuln.id);
                                  document.getElementById(`vuln-${vuln.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
                                }}
                                className={`inline-flex items-center gap-1.5 px-2 py-1 rounded border text-xs font-mono hover:opacity-80 transition-opacity ${cfg.bg} ${cfg.text} ${cfg.border}`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
                                <span className="font-semibold">{cfg.label}</span>
                                <span>·</span>
                                <span>{vuln.cveId}</span>
                              </button>
                            );
                          })}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Als Maßnahme erstellen Modal */}
    {findingModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Maßnahme erstellen</h2>
            <button onClick={() => setFindingModal(null)} className="p-1 hover:bg-gray-100 rounded">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1">
              <div><span className="text-gray-500">CVE:</span> <span className="font-mono font-semibold">{findingModal.vuln.cveId}</span></div>
              <div><span className="text-gray-500">Komponente:</span> <span className="font-medium">{findingModal.componentName}</span></div>
              <div><span className="text-gray-500">Severity:</span> <span className={`font-medium ${findingModal.vuln.severity === "CRITICAL" ? "text-red-600" : findingModal.vuln.severity === "HIGH" ? "text-orange-600" : "text-yellow-600"}`}>{findingModal.vuln.severity}</span></div>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm text-blue-800">
              Die Maßnahme wird mit Priorität <strong>{findingModal.vuln.severity.toLowerCase()}</strong> erstellt
              und der VEX-Status auf <strong>affected</strong> gesetzt.
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Fälligkeitsdatum (optional)</label>
              <input
                type="date"
                value={findingDueDate}
                onChange={e => setFindingDueDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setFindingModal(null)}>Abbrechen</Button>
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={createFinding}
                disabled={creatingFinding}
              >
                <ClipboardList className="w-4 h-4 mr-2" />
                {creatingFinding ? "Wird erstellt..." : "Maßnahme erstellen"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    )}
    </div>
  );
}
