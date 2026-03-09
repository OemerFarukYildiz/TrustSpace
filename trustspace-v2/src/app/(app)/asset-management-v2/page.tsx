"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  Loader2,
  AlertTriangle,
  Search,
  Server,
  BarChart3,
  DollarSign,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

interface V2Asset {
  id: string;
  name: string;
  description: string | null;
  category: string;
  subCategory: string | null;
  department: string | null;
  confidentiality: number;
  integrity: number;
  availability: number;
  ciaScore: number;
  replacementCost: number | null;
  revenueImpact: number | null;
  dataClassification: string;
  status: string;
  location: string | null;
  createdAt: string;
  _count?: { risksV2: number };
}

// ──────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  information: "Information",
  application: "Anwendung",
  infrastructure: "Infrastruktur",
  personnel: "Personal",
  physical: "Physisch",
};

const CLASSIFICATION_LABELS: Record<string, string> = {
  public: "Oeffentlich",
  internal: "Intern",
  confidential: "Vertraulich",
  restricted: "Streng vertraulich",
};

const CLASSIFICATION_COLORS: Record<string, string> = {
  public: "bg-green-100 text-green-700",
  internal: "bg-blue-100 text-blue-700",
  confidential: "bg-orange-100 text-orange-700",
  restricted: "bg-red-100 text-red-700",
};

const STATUS_LABELS: Record<string, string> = {
  active: "Aktiv",
  decommissioned: "Stillgelegt",
  planned: "Geplant",
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  decommissioned: "bg-gray-100 text-gray-500",
  planned: "bg-blue-100 text-blue-700",
};

function getCIAColor(score: number): string {
  if (score >= 8) return "text-red-600 bg-red-50";
  if (score >= 6) return "text-orange-600 bg-orange-50";
  if (score >= 4) return "text-yellow-600 bg-yellow-50";
  if (score >= 1) return "text-green-600 bg-green-50";
  return "text-gray-400 bg-gray-50";
}

// ──────────────────────────────────────────────
// Stat Card
// ──────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  gradient,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  gradient: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
            {label}
          </p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-lg",
            gradient
          )}
        >
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Main Page
// ──────────────────────────────────────────────

export default function AssetManagementV2Page() {
  const router = useRouter();

  const [assets, setAssets] = useState<V2Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch assets
  useEffect(() => {
    const fetchAssets = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/v2/assets");
        if (!res.ok) throw new Error("Fehler beim Laden");
        setAssets(await res.json());
      } catch (err) {
        console.error(err);
        setError("Assets konnten nicht geladen werden.");
      } finally {
        setLoading(false);
      }
    };
    fetchAssets();
  }, []);

  // Computed stats
  const stats = useMemo(() => {
    const total = assets.length;
    const avgCIA =
      total > 0
        ? (
            assets.reduce((s, a) => s + a.ciaScore, 0) / total
          ).toFixed(1)
        : "0";
    const totalCost = assets.reduce(
      (s, a) => s + (a.replacementCost ?? 0),
      0
    );
    return { total, avgCIA, totalCost };
  }, [assets]);

  // Filtered rows
  const filteredAssets = useMemo(() => {
    if (!searchQuery.trim()) return assets;
    const q = searchQuery.toLowerCase();
    return assets.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q) ||
        a.department?.toLowerCase().includes(q) ||
        a.location?.toLowerCase().includes(q)
    );
  }, [assets, searchQuery]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#0066FF]" />
      </div>
    );
  }

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
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Asset-Management v2
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Inventar und Bewertung aller Informationswerte
          </p>
        </div>
        <Button
          className="bg-[#0066FF] hover:bg-blue-700"
          onClick={() => router.push("/asset-management-v2/new")}
        >
          <Plus className="mr-2 h-4 w-4" />
          Neues Asset
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          label="Gesamt"
          value={String(stats.total)}
          icon={Package}
          gradient="bg-gradient-to-br from-[#0066FF] to-blue-600"
        />
        <StatCard
          label="Durchschn. CIA-Score"
          value={stats.avgCIA}
          icon={BarChart3}
          gradient="bg-gradient-to-br from-violet-500 to-purple-600"
        />
        <StatCard
          label="Gesamte Wiederbeschaffungskosten"
          value={formatEUR(stats.totalCost)}
          icon={DollarSign}
          gradient="bg-gradient-to-br from-emerald-500 to-green-600"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="border-b border-gray-50 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">
              Assets
            </h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Suchen..."
                className="h-8 w-64 pl-9 text-sm"
              />
            </div>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/50">
              <TableHead className="text-xs">Name</TableHead>
              <TableHead className="text-xs">Kategorie</TableHead>
              <TableHead className="text-xs text-center">
                CIA Score
              </TableHead>
              <TableHead className="text-xs">Klassifikation</TableHead>
              <TableHead className="text-xs text-right">
                Wiederbeschaffungskosten
              </TableHead>
              <TableHead className="text-xs text-center">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAssets.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-12 text-center text-sm text-gray-400"
                >
                  Keine Assets gefunden
                </TableCell>
              </TableRow>
            )}
            {filteredAssets.map((asset) => (
              <TableRow
                key={asset.id}
                className="cursor-pointer transition-colors hover:bg-gray-50/80"
                onClick={() =>
                  router.push(`/asset-management-v2/${asset.id}`)
                }
              >
                <TableCell>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {asset.name}
                    </p>
                    {asset.department && (
                      <p className="text-xs text-gray-500">
                        {asset.department}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">
                    {CATEGORY_LABELS[asset.category] || asset.category}
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  <span
                    className={cn(
                      "inline-flex rounded-md px-2 py-0.5 text-xs font-bold",
                      getCIAColor(asset.ciaScore)
                    )}
                  >
                    {asset.ciaScore > 0 ? asset.ciaScore.toFixed(1) : "-"}
                  </span>
                </TableCell>
                <TableCell>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-medium",
                      CLASSIFICATION_COLORS[asset.dataClassification] ||
                        "bg-gray-100 text-gray-600"
                    )}
                  >
                    {CLASSIFICATION_LABELS[asset.dataClassification] ||
                      asset.dataClassification}
                  </span>
                </TableCell>
                <TableCell className="text-right text-xs font-medium text-gray-700">
                  {formatEUR(asset.replacementCost)}
                </TableCell>
                <TableCell className="text-center">
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-medium",
                      STATUS_COLORS[asset.status] ||
                        "bg-gray-100 text-gray-600"
                    )}
                  >
                    {STATUS_LABELS[asset.status] || asset.status}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="border-t border-gray-50 px-6 py-3">
          <p className="text-xs text-gray-400">
            {filteredAssets.length} von {assets.length} Assets angezeigt
          </p>
        </div>
      </div>
    </div>
  );
}
