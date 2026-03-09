"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Package,
  AlertTriangle,
  Shield,
  Eye,
  ScanLine,
  Download,
  Trash2,
} from "lucide-react";

interface Asset {
  id: string;
  name: string;
  category: string;
}

interface SBOMOverview {
  id: string;
  format: string;
  versionLabel: string;
  isLatest: boolean;
  componentsCount: number;
  vulnerabilitySummary: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  createdAt: string;
  updatedAt: string;
  asset: Asset;
}

export default function SBOMOverviewPage() {
  const router = useRouter();
  const [sboms, setSboms] = useState<SBOMOverview[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAsset, setFilterAsset] = useState<string>("all");
  const [filterSeverity, setFilterSeverity] = useState<string>("all");
  const [assets, setAssets] = useState<Asset[]>([]);
  const [scanningId, setScanningId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    loadSBOMs();
    loadAssets();
  }, []);

  const loadSBOMs = async () => {
    try {
      const res = await fetch("/api/sbom/overview");
      if (res.ok) {
        const data = await res.json();
        setSboms(data);
      }
    } catch (error) {
      console.error("Failed to load SBOMs:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadAssets = async () => {
    try {
      // Load only hardware and software assets for SBOM
      const [hardwareRes, softwareRes] = await Promise.all([
        fetch("/api/assets?category=hardware"),
        fetch("/api/assets?category=software")
      ]);

      const assets = [];
      if (hardwareRes.ok) {
        const hardwareData = await hardwareRes.json();
        assets.push(...hardwareData);
      }
      if (softwareRes.ok) {
        const softwareData = await softwareRes.json();
        assets.push(...softwareData);
      }

      setAssets(assets);
    } catch (error) {
      console.error("Failed to load assets:", error);
    }
  };

  const filteredSBOMs = sboms.filter((sbom) => {
    const matchesSearch =
      sbom.asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sbom.versionLabel.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sbom.format.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesAsset =
      filterAsset === "all" || sbom.asset.id === filterAsset;

    const matchesSeverity =
      filterSeverity === "all" ||
      (filterSeverity === "critical" && sbom.vulnerabilitySummary.critical > 0) ||
      (filterSeverity === "high" && sbom.vulnerabilitySummary.high > 0) ||
      (filterSeverity === "medium" && sbom.vulnerabilitySummary.medium > 0) ||
      (filterSeverity === "clean" && sbom.vulnerabilitySummary.total === 0);

    return matchesSearch && matchesAsset && matchesSeverity;
  });

  // Calculate stats
  const stats = {
    totalSBOMs: sboms.length,
    totalComponents: sboms.reduce((sum, sbom) => sum + sbom.componentsCount, 0),
    totalVulnerabilities: sboms.reduce((sum, sbom) => sum + sbom.vulnerabilitySummary.total, 0),
    criticalVulns: sboms.reduce((sum, sbom) => sum + sbom.vulnerabilitySummary.critical, 0),
    highVulns: sboms.reduce((sum, sbom) => sum + sbom.vulnerabilitySummary.high, 0),
    assetsWithSBOM: new Set(sboms.map(sbom => sbom.asset.id)).size,
  };

  const getSeverityBadge = (summary: SBOMOverview["vulnerabilitySummary"]) => {
    if (summary.critical > 0) {
      return (
        <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
          {summary.critical} Critical
        </span>
      );
    }
    if (summary.high > 0) {
      return (
        <span className="px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-700">
          {summary.high} High
        </span>
      );
    }
    if (summary.medium > 0) {
      return (
        <span className="px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-700">
          {summary.medium} Medium
        </span>
      );
    }
    if (summary.low > 0) {
      return (
        <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
          {summary.low} Low
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
        <Shield className="w-3 h-3 inline mr-1" />
        Clean
      </span>
    );
  };

  const triggerScan = async (sbomId: string) => {
    setScanningId(sbomId);
    try {
      const response = await fetch(`/api/sbom/${sbomId}/scan`, {
        method: 'POST',
      });
      if (response.ok) {
        await loadSBOMs();
      }
    } catch (error) {
      console.error('Failed to trigger scan:', error);
    } finally {
      setScanningId(null);
    }
  };

  const deleteSbom = async (sbomId: string) => {
    setDeletingId(sbomId);
    try {
      const res = await fetch(`/api/sbom/${sbomId}`, { method: "DELETE" });
      if (res.ok) await loadSBOMs();
    } catch (error) {
      console.error("Failed to delete SBOM:", error);
    } finally {
      setDeletingId(null);
    }
  };

  const resetAll = async () => {
    setResetting(true);
    try {
      const res = await fetch("/api/sbom", { method: "DELETE" });
      if (res.ok) {
        setConfirmReset(false);
        await loadSBOMs();
      }
    } catch (error) {
      console.error("Failed to reset:", error);
    } finally {
      setResetting(false);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/risks" className="hover:text-gray-900">
          Risk & Asset Management
        </Link>
        <span className="text-gray-400">/</span>
        <span className="text-gray-900">SBOM Overview</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Software Bill of Materials (SBOM)
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Track software components and vulnerabilities across your assets
          </p>
        </div>
        <div className="flex gap-2">
          {sboms.length > 0 && (
            <Button
              variant="outline"
              className="text-red-600 border-red-200 hover:bg-red-50"
              onClick={() => setConfirmReset(true)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Alle löschen
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => router.push("/risks")}
          >
            <Package className="w-4 h-4 mr-2" />
            Manage Assets
          </Button>
        </div>
      </div>

      {/* Confirm-Dialog: Alle löschen */}
      {confirmReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setConfirmReset(false)}>
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Alle SBOM-Daten löschen?</h3>
                <p className="text-sm text-gray-500">Diese Aktion kann nicht rückgängig gemacht werden.</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Es werden alle SBOMs, Komponenten und Schwachstellenscans gelöscht. Assets bleiben erhalten.
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setConfirmReset(false)}>Abbrechen</Button>
              <Button
                className="bg-red-600 hover:bg-red-700 text-white"
                disabled={resetting}
                onClick={resetAll}
              >
                {resetting ? "Löschen..." : "Alle löschen"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Critical Alert */}
      {stats.criticalVulns > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-medium text-red-900">
              ⚠️ {stats.criticalVulns} Critical Vulnerabilities Detected
            </h4>
            <p className="text-sm text-red-700 mt-1">
              Immediate action required across {stats.assetsWithSBOM} assets with SBOM data.
            </p>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-6 gap-4">
        <div className="bg-white rounded-lg border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Total SBOMs</p>
          <p className="text-2xl font-bold text-gray-900">{stats.totalSBOMs}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Assets Covered</p>
          <p className="text-2xl font-bold text-blue-600">{stats.assetsWithSBOM}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Components</p>
          <p className="text-2xl font-bold text-gray-900">{stats.totalComponents.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 p-4">
          <p className="text-sm text-red-600">Critical</p>
          <p className="text-2xl font-bold text-red-700">{stats.criticalVulns}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 p-4">
          <p className="text-sm text-orange-600">High</p>
          <p className="text-2xl font-bold text-orange-700">{stats.highVulns}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Total Vulns</p>
          <p className="text-2xl font-bold text-gray-900">{stats.totalVulnerabilities.toLocaleString()}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search SBOMs, assets, versions..."
            className="pl-9 bg-white"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={filterAsset}
          onChange={(e) => setFilterAsset(e.target.value)}
        >
          <option value="all">All Assets</option>
          {assets.map((asset) => (
            <option key={asset.id} value={asset.id}>
              {asset.name}
            </option>
          ))}
        </select>
        <select
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={filterSeverity}
          onChange={(e) => setFilterSeverity(e.target.value)}
        >
          <option value="all">All Severities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="clean">Clean</option>
        </select>
      </div>

      {/* SBOM List */}
      <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
        {filteredSBOMs.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg">No SBOMs uploaded yet</p>
            <p className="text-sm mt-1">
              Upload SBOM files to assets to track software components and vulnerabilities
            </p>
            <Button
              className="mt-4 bg-[#0066FF]"
              onClick={() => router.push("/risks")}
            >
              <Package className="w-4 h-4 mr-2" />
              Go to Assets
            </Button>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">
                  Asset / SBOM
                </th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">
                  Format
                </th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">
                  Components
                </th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">
                  Vulnerabilities
                </th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">
                  Last Updated
                </th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase px-4 py-3">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredSBOMs.map((sbom) => (
                <tr
                  key={sbom.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                        <Package className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {sbom.asset.name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">
                            {sbom.versionLabel}
                          </span>
                          {sbom.isLatest && (
                            <span className="px-2 py-0.5 rounded text-xs bg-green-100 text-green-700">
                              Latest
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="font-mono text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded uppercase">
                      {sbom.format}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm text-gray-900 font-medium">
                      {sbom.componentsCount.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      {getSeverityBadge(sbom.vulnerabilitySummary)}
                      {sbom.vulnerabilitySummary.total > 0 && (
                        <span className="text-xs text-gray-500">
                          ({sbom.vulnerabilitySummary.total} total)
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm text-gray-500">
                      {new Date(sbom.updatedAt).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2 justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/risks/sbom/${sbom.id}`);
                        }}
                        title="Details anzeigen"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={scanningId === sbom.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          triggerScan(sbom.id);
                        }}
                        title="Scan for Vulnerabilities"
                      >
                        <ScanLine className={`w-4 h-4 ${scanningId === sbom.id ? "animate-spin" : ""}`} />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(`/api/sbom/${sbom.id}/export`, '_blank');
                        }}
                        title="Export SBOM"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={deletingId === sbom.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`SBOM von "${sbom.asset.name}" wirklich löschen?`)) {
                            deleteSbom(sbom.id);
                          }
                        }}
                        title="SBOM löschen"
                        className="text-red-500 hover:bg-red-50 hover:border-red-300"
                      >
                        <Trash2 className={`w-4 h-4 ${deletingId === sbom.id ? "animate-pulse" : ""}`} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
}