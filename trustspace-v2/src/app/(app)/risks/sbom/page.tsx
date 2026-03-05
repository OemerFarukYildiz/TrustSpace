"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Package, Server, AlertTriangle, Shield, ExternalLink, Plus } from "lucide-react";

interface SBOMEntry {
  id: string;
  softwareId: string;
  softwareName: string;
  componentName: string;
  componentVersion: string;
  componentType: string;
  license: string;
  vulnerabilityCount: number;
  criticalVulns: number;
  highVulns: number;
  mediumVulns: number;
  lowVulns: number;
  lastScanned: string;
}

interface SoftwareAsset {
  id: string;
  name: string;
  componentCount: number;
  vulnerabilityCount: number;
}

const componentTypeIcons: Record<string, any> = {
  library: Package,
  framework: Package,
  operating_system: Server,
  application: Package,
  container: Server,
};

export default function SBOMPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<SBOMEntry[]>([]);
  const [softwareAssets, setSoftwareAssets] = useState<SoftwareAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSoftware, setFilterSoftware] = useState<string>("all");
  const [filterSeverity, setFilterSeverity] = useState<string>("all");

  useEffect(() => {
    loadSBOM();
    loadSoftwareAssets();
  }, []);

  const loadSBOM = async () => {
    try {
      const res = await fetch("/api/sbom");
      if (res.ok) {
        const data = await res.json();
        setEntries(data);
      }
    } catch (error) {
      console.error("Failed to load SBOM:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadSoftwareAssets = async () => {
    try {
      const res = await fetch("/api/assets?category=software");
      if (res.ok) {
        const data = await res.json();
        setSoftwareAssets(data);
      }
    } catch (error) {
      console.error("Failed to load software assets:", error);
    }
  };

  const filteredEntries = entries.filter((entry) => {
    const matchesSearch =
      entry.componentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.softwareName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSoftware =
      filterSoftware === "all" || entry.softwareId === filterSoftware;
    const matchesSeverity =
      filterSeverity === "all" ||
      (filterSeverity === "critical" && entry.criticalVulns > 0) ||
      (filterSeverity === "high" && entry.highVulns > 0) ||
      (filterSeverity === "medium" && entry.mediumVulns > 0);
    return matchesSearch && matchesSoftware && matchesSeverity;
  });

  // Stats
  const stats = {
    totalComponents: entries.length,
    totalVulnerabilities: entries.reduce(
      (sum, e) => sum + e.vulnerabilityCount,
      0
    ),
    criticalVulns: entries.reduce((sum, e) => sum + e.criticalVulns, 0),
    highVulns: entries.reduce((sum, e) => sum + e.highVulns, 0),
    softwareCount: softwareAssets.length,
  };

  const getSeverityBadge = (
    critical: number,
    high: number,
    medium: number,
    low: number
  ) => {
    if (critical > 0)
      return (
        <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
          {critical} Critical
        </span>
      );
    if (high > 0)
      return (
        <span className="px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-700">
          {high} High
        </span>
      );
    if (medium > 0)
      return (
        <span className="px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-700">
          {medium} Medium
        </span>
      );
    if (low > 0)
      return (
        <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
          {low} Low
        </span>
      );
    return (
      <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
        <Shield className="w-3 h-3 inline mr-1" />
        Clean
      </span>
    );
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
        <span className="text-gray-900">SBOM</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Software Bill of Materials
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Track software components and their vulnerabilities
          </p>
        </div>
        <Button
          className="bg-[#0066FF] hover:bg-blue-700"
          onClick={() => router.push("/risks/category/software")}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Software
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4">
        <div className="bg-white rounded-lg border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Software Assets</p>
          <p className="text-2xl font-bold text-gray-900">
            {stats.softwareCount}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Components</p>
          <p className="text-2xl font-bold text-gray-900">
            {stats.totalComponents}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 p-4">
          <p className="text-sm text-red-600">Critical Vulns</p>
          <p className="text-2xl font-bold text-red-700">
            {stats.criticalVulns}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 p-4">
          <p className="text-sm text-orange-600">High Vulns</p>
          <p className="text-2xl font-bold text-orange-700">{stats.highVulns}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Total Vulns</p>
          <p className="text-2xl font-bold text-gray-900">
            {stats.totalVulnerabilities}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search components..."
            className="pl-9 bg-white"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
          value={filterSoftware}
          onChange={(e) => setFilterSoftware(e.target.value)}
        >
          <option value="all">All Software</option>
          {softwareAssets.map((sw) => (
            <option key={sw.id} value={sw.id}>
              {sw.name}
            </option>
          ))}
        </select>
        <select
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
          value={filterSeverity}
          onChange={(e) => setFilterSeverity(e.target.value)}
        >
          <option value="all">All Severities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
        </select>
      </div>

      {/* Components List */}
      <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">
                Component
              </th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">
                Software
              </th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">
                Version
              </th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">
                License
              </th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">
                Vulnerabilities
              </th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">
                Last Scanned
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredEntries.map((entry) => {
              const Icon =
                componentTypeIcons[entry.componentType] || Package;
              return (
                <tr
                  key={entry.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() =>
                    router.push(`/risks/sbom/component/${entry.id}`)
                  }
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {entry.componentName}
                        </p>
                        <p className="text-xs text-gray-500 capitalize">
                          {entry.componentType.replace("_", " ")}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-700">
                      {entry.softwareName}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-mono text-gray-600">
                      {entry.componentVersion}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-600">
                      {entry.license || "Unknown"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {getSeverityBadge(
                      entry.criticalVulns,
                      entry.highVulns,
                      entry.mediumVulns,
                      entry.lowVulns
                    )}
                    {entry.vulnerabilityCount > 0 && (
                      <span className="ml-2 text-xs text-gray-500">
                        ({entry.vulnerabilityCount} total)
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-500">
                      {new Date(entry.lastScanned).toLocaleDateString()}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredEntries.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg">No SBOM entries found</p>
            <p className="text-sm">
              Add software assets to generate SBOM entries
            </p>
          </div>
        )}
      </div>

      {/* Vulnerable Components Alert */}
      {stats.criticalVulns > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-red-900">
              Critical Vulnerabilities Detected
            </h4>
            <p className="text-sm text-red-700 mt-1">
              {stats.criticalVulns} critical vulnerabilities found across your
              software components. Immediate action recommended.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
