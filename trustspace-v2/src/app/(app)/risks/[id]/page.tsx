"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Loader2,
  AlertTriangle,
  ChevronRight,
  Shield,
  Lock,
  Eye,
  Zap,
  Plus,
  Search,
  X,
  Check,
  Package,
  ExternalLink,
  Upload,
  Download,
  Link2,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface Asset {
  id: string;
  name: string;
  description: string;
  category: string;
  createdAt: string;
  updatedAt: string;
  confidentiality: number;
  integrity: number;
  availability: number;
  ciaAverage: number;
  owner: { firstName: string; lastName: string } | null;
  step1Completed: boolean;
  step2Completed: boolean;
  step3Completed: boolean;
  step4Completed: boolean;
  step5Completed: boolean;
}

interface LinkedAsset {
  id: string;
  asset: {
    id: string;
    name: string;
    category: string;
    ciaAverage: number;
  };
}

interface RiskThreat {
  id: string;
  bruttoProbability: number;
  bruttoImpact: number;
  bruttoScore: number;
  nettoProbability: number;
  nettoImpact: number;
  nettoScore: number;
  controlsMapped: string;
  schadenStufe: number;
  wahrscheinlichkeitStufe: number;
  nettoSchadenStufe: number;
  nettoWahrscheinlichkeitStufe: number;
  schadenInEuro?: number | null;
  v1BruttoScore: number;
  v1NettoScore: number;
  schadenklasse?: number | null;
  wahrscheinlichkeitV2?: number | null;
  nettoSchadenklasse?: number | null;
  nettoWahrscheinlichkeitV2?: number | null;
  v2BruttoScore?: number | null;
  v2NettoScore?: number | null;
  threatScenario: {
    code: string;
    name: string;
    description: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface ThreatScenario {
  id: string;
  code: string;
  name: string;
  description: string;
  category: string;
  alreadyAssigned?: boolean;
}

interface SBOM {
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
}

interface SBOMDetail {
  id: string;
  format: string;
  versionLabel: string;
  componentsCount: number;
  vulnerabilitySummary: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  components: Array<{
    id: string;
    name: string;
    version?: string;
    purl?: string;
    supplier?: string;
    licenseSpdx?: string;
    dependencyType: string;
    vulnerabilities: Array<{
      id: string;
      cveId: string;
      severity: string;
      cvssScore?: number;
      vexStatus: string;
    }>;
  }>;
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function getCIAColor(value: number): string {
  if (value >= 3) return "text-red-600";
  if (value >= 2) return "text-orange-600";
  if (value >= 1) return "text-green-600";
  return "text-gray-400";
}

function getRiskLevel(score: number) {
  if (score <= 6) return { label: "Niedrig", color: "bg-green-100 text-green-800" };
  if (score <= 12) return { label: "Mittel", color: "bg-yellow-100 text-yellow-800" };
  if (score <= 19) return { label: "Hoch", color: "bg-orange-100 text-orange-800" };
  return { label: "Kritisch", color: "bg-red-100 text-red-800" };
}

const CATEGORY_LABELS: Record<string, string> = {
  process: "Prozesse",
  software: "Software",
  hardware: "Hardware",
  location: "Standorte",
  supplier: "Lieferanten",
};

// ─────────────────────────────────────────────
// Add Threat Modal
// ─────────────────────────────────────────────

function AddThreatModal({
  isOpen,
  onClose,
  assetId,
  onThreatAdded,
}: {
  isOpen: boolean;
  onClose: () => void;
  assetId: string;
  onThreatAdded: () => void;
}) {
  const [threats, setThreats] = useState<ThreatScenario[]>([]);
  const [selectedThreats, setSelectedThreats] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetch(`/api/threats?assetId=${assetId}`)
        .then((r) => r.json())
        .then((data) => setThreats(data.filter((t: ThreatScenario) => !t.alreadyAssigned)))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isOpen, assetId]);

  const toggleThreat = (threatId: string) => {
    setSelectedThreats((prev) =>
      prev.includes(threatId) ? prev.filter((id) => id !== threatId) : [...prev, threatId]
    );
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Technical": return "bg-blue-100 text-blue-700 border-blue-200";
      case "Physical": return "bg-orange-100 text-orange-700 border-orange-200";
      case "Operational": return "bg-purple-100 text-purple-700 border-purple-200";
      case "Legal": return "bg-red-100 text-red-700 border-red-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const filteredThreats = threats.filter((t) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      t.name.toLowerCase().includes(q) ||
      t.code.toLowerCase().includes(q) ||
      t.description?.toLowerCase().includes(q);
    const matchesCategory = filterCategory === "all" || t.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(threats.map((t) => t.category))];

  const handleSubmit = async () => {
    if (selectedThreats.length === 0) return;
    setLoading(true);
    try {
      await Promise.all(
        selectedThreats.map((threatId) =>
          fetch("/api/risk-threats", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              assetId,
              threatId,
              bruttoProbability: 1,
              bruttoImpact: 1,
              bruttoScore: 1,
              nettoProbability: 1,
              nettoImpact: 1,
              nettoScore: 1,
              mappedControls: "[]",
            }),
          })
        )
      );
      onThreatAdded();
      onClose();
      setSelectedThreats([]);
    } catch (error) {
      console.error("Failed to assign threats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Bedrohungsszenarien zuweisen</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {selectedThreats.length > 0 ? `${selectedThreats.length} ausgewählt` : "Szenarien aus dem Katalog wählen"}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="px-6 py-3 border-b space-y-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Bedrohung suchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilterCategory("all")}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                filterCategory === "all" ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Alle
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  filterCategory === cat ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-3 space-y-2">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : filteredThreats.length === 0 ? (
            <p className="text-center text-gray-400 py-12 text-sm">Keine Bedrohungen gefunden</p>
          ) : (
            filteredThreats.map((threat) => {
              const isSelected = selectedThreats.includes(threat.id);
              return (
                <div
                  key={threat.id}
                  onClick={() => toggleThreat(threat.id)}
                  className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-all ${
                    isSelected
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <div
                    className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border-2 transition-colors ${
                      isSelected ? "border-blue-500 bg-blue-500" : "border-gray-300"
                    }`}
                  >
                    {isSelected && <Check className="h-3 w-3 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-mono text-xs bg-gray-800 text-white px-2 py-0.5 rounded">
                        {threat.code}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${getCategoryColor(threat.category)}`}>
                        {threat.category}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-900">{threat.name}</p>
                    <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{threat.description}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50 rounded-b-xl">
          <span className="text-sm text-gray-500">{filteredThreats.length} verfügbar</span>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={onClose}>Abbrechen</Button>
            <Button
              className="bg-[#0066FF] hover:bg-blue-700"
              disabled={selectedThreats.length === 0 || loading}
              onClick={handleSubmit}
            >
              {loading ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Plus className="h-4 w-4 mr-1.5" />}
              {selectedThreats.length > 0 ? `${selectedThreats.length} hinzufügen` : "Hinzufügen"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Link Asset Modal
// ─────────────────────────────────────────────

function LinkAssetModal({
  isOpen,
  onClose,
  assetId,
  onLinked,
}: {
  isOpen: boolean;
  onClose: () => void;
  assetId: string;
  onLinked: () => void;
}) {
  const [availableAssets, setAvailableAssets] = useState<Array<{ id: string; name: string; category: string }>>([]);
  const [selectedAsset, setSelectedAsset] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (isOpen) {
      fetch(`/api/assets/available?excludeId=${assetId}`)
        .then((r) => r.json())
        .then((data) => setAvailableAssets(data))
        .catch(console.error);
    }
  }, [isOpen, assetId]);

  const handleLink = async () => {
    if (!selectedAsset) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/assets/${assetId}/linked`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secondaryId: selectedAsset }),
      });
      if (res.ok) {
        onLinked();
        onClose();
        setSelectedAsset("");
      }
    } catch (error) {
      console.error("Failed to link asset:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAssets = availableAssets.filter((a) =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Asset verknüpfen</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Asset suchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="max-h-64 overflow-y-auto space-y-1.5 border rounded-lg p-2">
            {filteredAssets.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Keine Assets verfügbar</p>
            ) : (
              filteredAssets.map((asset) => (
                <div
                  key={asset.id}
                  onClick={() => setSelectedAsset(asset.id)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedAsset === asset.id
                      ? "bg-blue-50 border border-blue-200"
                      : "hover:bg-gray-50 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                      {CATEGORY_LABELS[asset.category] || asset.category}
                    </span>
                    <span className="font-medium text-sm text-gray-900">{asset.name}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1">Abbrechen</Button>
            <Button
              className="flex-1 bg-[#0066FF] hover:bg-blue-700"
              disabled={!selectedAsset || loading}
              onClick={handleLink}
            >
              {loading ? "Verknüpfen..." : "Asset verknüpfen"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Linked Assets List
// ─────────────────────────────────────────────

function LinkedAssetsList({
  linkedAssets,
  onAddClick,
}: {
  linkedAssets: LinkedAsset[];
  onAddClick: () => void;
}) {
  const router = useRouter();

  if (linkedAssets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-gray-400">
        <Link2 className="h-10 w-10 mb-3 text-gray-200" />
        <p className="text-sm">Keine verknüpften Assets</p>
        <Button className="mt-4 bg-[#0066FF] hover:bg-blue-700" size="sm" onClick={onAddClick}>
          <Plus className="h-4 w-4 mr-1.5" />
          Asset verknüpfen
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {linkedAssets.map((link) => (
        <div
          key={link.id}
          onClick={() => router.push(`/risks/${link.asset.id}`)}
          className="flex items-center justify-between rounded-lg border border-gray-100 p-3 cursor-pointer hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
              {CATEGORY_LABELS[link.asset.category] || link.asset.category}
            </span>
            <span className="text-sm font-medium text-gray-900">{link.asset.name}</span>
          </div>
          <div className="flex items-center gap-2">
            {link.asset.ciaAverage > 0 && (
              <span className="text-xs text-gray-500">CIA: {link.asset.ciaAverage.toFixed(2)}</span>
            )}
            <ChevronRight className="h-4 w-4 text-gray-300" />
          </div>
        </div>
      ))}
      <Button variant="outline" size="sm" className="w-full mt-2" onClick={onAddClick}>
        <Plus className="h-4 w-4 mr-1.5" />
        Weiteres Asset verknüpfen
      </Button>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────

export default function AssetDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [asset, setAsset] = useState<Asset | null>(null);
  const [linkedAssets, setLinkedAssets] = useState<LinkedAsset[]>([]);
  const [riskThreats, setRiskThreats] = useState<RiskThreat[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Inline CIA state
  const [confidentiality, setConfidentiality] = useState(1);
  const [integrity, setIntegrity] = useState(1);
  const [availability, setAvailability] = useState(1);

  // Asset name/description (editable)
  const [assetName, setAssetName] = useState("");
  const [assetDescription, setAssetDescription] = useState("");

  // Tabs
  const [activeTab, setActiveTab] = useState<"threats" | "linked" | "sbom">("threats");
  const [riskTab, setRiskTab] = useState<"alle" | "massnahmen">("alle");

  // Panel

  // Modals
  const [isAddThreatModalOpen, setIsAddThreatModalOpen] = useState(false);
  const [isLinkAssetModalOpen, setIsLinkAssetModalOpen] = useState(false);

  // SBOM
  const [sboms, setSboms] = useState<SBOM[]>([]);
  const [selectedSbom, setSelectedSbom] = useState<SBOMDetail | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [connectTab, setConnectTab] = useState<"github" | "gitlab" | "curl">("github");
  const [copied, setCopied] = useState<string | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);

  // Computed CIA score
  const ciaScore = useMemo(() => {
    if (confidentiality > 0 && integrity > 0 && availability > 0) {
      return ((confidentiality + integrity + availability) / 3);
    }
    return 0;
  }, [confidentiality, integrity, availability]);

  useEffect(() => {
    loadAsset();
    loadLinkedAssets();
    loadRiskThreats();
    loadSBOMs();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadAsset = async () => {
    try {
      const res = await fetch(`/api/assets/${id}`);
      if (res.ok) {
        const data: Asset = await res.json();
        setAsset(data);
        setAssetName(data.name);
        setAssetDescription(data.description || "");
        setConfidentiality(data.confidentiality || 1);
        setIntegrity(data.integrity || 1);
        setAvailability(data.availability || 1);
      }
    } catch (error) {
      console.error("Failed to load asset:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadLinkedAssets = async () => {
    try {
      const res = await fetch(`/api/assets/${id}/linked`);
      if (res.ok) setLinkedAssets(await res.json());
    } catch (error) {
      console.error("Failed to load linked assets:", error);
    }
  };

  const loadRiskThreats = async () => {
    try {
      const res = await fetch(`/api/risk-threats?assetId=${id}`);
      if (res.ok) setRiskThreats(await res.json());
    } catch (error) {
      console.error("Failed to load risk threats:", error);
    }
  };

  const loadSBOMs = async () => {
    try {
      const res = await fetch(`/api/assets/${id}/sbom`);
      if (res.ok) setSboms(await res.json());
    } catch (error) {
      console.error("Failed to load SBOMs:", error);
    }
  };

  const handleSave = async () => {
    if (!asset) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/assets/${asset.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: assetName,
          description: assetDescription,
          category: asset.category,
          confidentiality,
          integrity,
          availability,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setAsset((prev) => prev ? { ...prev, ...updated } : prev);
      }
    } catch (error) {
      console.error("Failed to save asset:", error);
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#0066FF]" />
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-3">
        <AlertTriangle className="h-10 w-10 text-red-400" />
        <p className="text-sm text-red-600">Asset nicht gefunden.</p>
        <Button variant="outline" size="sm" onClick={() => router.push("/risks")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Zurück
        </Button>
      </div>
    );
  }

  const highRisks = riskThreats.filter((rt) => rt.v1BruttoScore >= 8).length;
  const withControls = riskThreats.filter((rt) => {
    try { const mc = JSON.parse(rt.controlsMapped); return Array.isArray(mc) && mc.length > 0; } catch { return false; }
  }).length;
  const nettoCalc = riskThreats.filter((rt) => rt.nettoSchadenStufe > 1 || rt.v1NettoScore !== rt.v1BruttoScore).length;

  // SBOM snippets
  const assetIdVal = id as string;
  const apiUrl = typeof window !== "undefined"
    ? `${window.location.origin}/api/sbom/upload`
    : "https://your-trustspace.domain/api/sbom/upload";

  const githubSnippet = `name: SBOM Upload to TrustSpace\n\non:\n  push:\n    branches: [main]\n\njobs:\n  sbom:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - uses: actions/setup-node@v4\n        with:\n          node-version: 20\n      - run: npm ci\n      - name: Generate SBOM\n        run: npx @cyclonedx/cyclonedx-npm --output-format JSON --output-file sbom.json --spec-version 1.6\n      - name: Upload SBOM to TrustSpace\n        run: |\n          curl -X POST ${apiUrl} \\\\\n            -F "file=@sbom.json" \\\\\n            -F "assetId=${assetIdVal}" \\\\\n            -F "versionLabel=\${{ github.sha }}"`;
  const gitlabSnippet = `sbom-upload:\n  stage: deploy\n  image: node:20\n  script:\n    - npm ci\n    - npx @cyclonedx/cyclonedx-npm --output-format JSON --output-file sbom.json --spec-version 1.6\n    - |\n      curl -X POST ${apiUrl} \\\\\n        -F "file=@sbom.json" \\\\\n        -F "assetId=${assetIdVal}" \\\\\n        -F "versionLabel=$CI_COMMIT_SHA"\n  only:\n    - main`;
  const curlSnippet = `# 1. SBOM generieren\nnpx @cyclonedx/cyclonedx-npm \\\\\n  --output-format JSON \\\\\n  --output-file sbom.json \\\\\n  --spec-version 1.6\n\n# 2. An TrustSpace senden\ncurl -X POST ${apiUrl} \\\\\n  -F "file=@sbom.json" \\\\\n  -F "assetId=${assetIdVal}" \\\\\n  -F "versionLabel=1.0.0"`;
  const snippetTabs = [
    { key: "github" as const, label: "GitHub Actions", snippet: githubSnippet },
    { key: "gitlab" as const, label: "GitLab CI", snippet: gitlabSnippet },
    { key: "curl" as const, label: "curl / manuell", snippet: curlSnippet },
  ];
  const activeSnippet = snippetTabs.find((t) => t.key === connectTab)?.snippet ?? "";

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/risks" className="hover:text-gray-700 transition-colors">
          Risk & Asset Management
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link
          href={`/risks/category/${asset.category === "process" ? "processes" : asset.category + "s"}`}
          className="hover:text-gray-700 transition-colors"
        >
          {CATEGORY_LABELS[asset.category] || asset.category}
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-gray-900 font-medium truncate max-w-xs">{asset.name}</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => router.push("/risks")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Zurück
        </Button>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAddThreatModalOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Bedrohungsszenario hinzufügen
          </Button>
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

      {/* Two Column Layout */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left Column */}
        <div className="col-span-7 space-y-6">
          {/* Grunddaten */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Grunddaten</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs text-gray-500">Name</Label>
                <Input
                  value={assetName}
                  onChange={(e) => setAssetName(e.target.value)}
                  placeholder="Asset-Name..."
                  className="mt-1 font-semibold"
                />
              </div>
              <div>
                <Label className="text-xs text-gray-500">Beschreibung</Label>
                <textarea
                  value={assetDescription}
                  onChange={(e) => setAssetDescription(e.target.value)}
                  rows={3}
                  placeholder="Beschreibung des Assets..."
                  className="mt-1 w-full px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-gray-500">Kategorie</Label>
                  <div className="mt-1 px-3 py-2 border border-input rounded-md text-sm bg-gray-50 text-gray-700">
                    {CATEGORY_LABELS[asset.category] || asset.category}
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Erstellt am</Label>
                  <div className="mt-1 px-3 py-2 border border-input rounded-md text-sm bg-gray-50 text-gray-700">
                    {new Date(asset.createdAt).toLocaleDateString("de-DE")}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Risk Threats Section */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">
                  Bedrohungsszenarien ({riskThreats.length})
                </CardTitle>
                <Button
                  size="sm"
                  className="bg-[#0066FF] hover:bg-blue-700 h-7 text-xs"
                  onClick={() => setIsAddThreatModalOpen(true)}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Hinzufügen
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {/* Stats */}
              {riskThreats.length > 0 && (
                <div className="grid grid-cols-4 gap-0 border-b divide-x">
                  {[
                    { label: "Gesamt", value: riskThreats.length, color: "text-gray-900" },
                    { label: "Hoch/Krit.", value: highRisks, color: "text-amber-600" },
                    { label: "Mit Maßnahmen", value: withControls, color: "text-emerald-600" },
                    { label: "Netto-Berechnet", value: nettoCalc, color: "text-blue-600" },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="p-3 text-center">
                      <p className={`text-xl font-bold ${color}`}>{value}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{label}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Sub-tabs */}
              <div className="flex border-b">
                <button
                  onClick={() => setRiskTab("alle")}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${
                    riskTab === "alle" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-900"
                  }`}
                >
                  <Shield className="h-3.5 w-3.5" />
                  Alle Risiken
                </button>
                <button
                  onClick={() => setRiskTab("massnahmen")}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${
                    riskTab === "massnahmen" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-900"
                  }`}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Maßnahmen & Berechnung
                </button>
              </div>

              {riskThreats.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 text-gray-400">
                  <Shield className="w-10 w-10 mb-3 text-gray-200" />
                  <p className="text-sm">Keine Bedrohungsszenarien zugewiesen</p>
                  <Button className="mt-4 bg-[#0066FF] hover:bg-blue-700" size="sm" onClick={() => setIsAddThreatModalOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Bedrohungsszenario hinzufügen
                  </Button>
                </div>
              ) : riskTab === "alle" ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b">
                        <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Szenario</th>
                        <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Bezeichnung</th>
                        <th className="text-center px-3 py-2.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Schaden</th>
                        <th className="text-center px-3 py-2.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Wahrsch.</th>
                        <th className="text-right px-4 py-2.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Brutto</th>
                        <th className="text-right px-4 py-2.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Netto</th>
                      </tr>
                    </thead>
                    <tbody>
                      {riskThreats.map((rt) => {
                        const bruttoLevel = getRiskLevel(Math.round(rt.v1BruttoScore));
                        const nettoLevel = getRiskLevel(Math.round(rt.v1NettoScore));
                        return (
                          <tr
                            key={rt.id}
                            className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                            onClick={() => router.push(`/risks/threats/${rt.id}`)}
                          >
                            <td className="px-4 py-3">
                              <span className="font-mono text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{rt.threatScenario.code}</span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-sm text-gray-700 truncate max-w-[200px] block">{rt.threatScenario.name}</span>
                            </td>
                            <td className="px-3 py-3 text-center text-sm text-gray-600">{rt.schadenStufe}</td>
                            <td className="px-3 py-3 text-center text-sm text-gray-600">{rt.wahrscheinlichkeitStufe}</td>
                            <td className="px-4 py-3 text-right">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${bruttoLevel.color}`}>
                                {rt.v1BruttoScore.toFixed(2)}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              {rt.v1NettoScore !== rt.v1BruttoScore ? (
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${nettoLevel.color}`}>
                                  {rt.v1NettoScore.toFixed(2)}
                                </span>
                              ) : (
                                <span className="text-xs text-gray-400">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b">
                        <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Szenario</th>
                        <th className="text-center px-3 py-2.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Maßnahmen</th>
                        <th className="text-center px-3 py-2.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                        <th className="text-right px-4 py-2.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Brutto</th>
                        <th className="text-right px-4 py-2.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Netto</th>
                        <th className="text-center px-3 py-2.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Reduktion</th>
                      </tr>
                    </thead>
                    <tbody>
                      {riskThreats.map((rt) => {
                        let controlCount = 0;
                        try { const mc = JSON.parse(rt.controlsMapped); controlCount = Array.isArray(mc) ? mc.length : 0; } catch { /* */ }
                        const isNettoCalc = rt.nettoSchadenStufe > 1 || rt.v1NettoScore !== rt.v1BruttoScore;
                        const reduktion = isNettoCalc && rt.v1BruttoScore > 0
                          ? Math.round(((rt.v1BruttoScore - rt.v1NettoScore) / rt.v1BruttoScore) * 100)
                          : null;
                        const bruttoLevel = getRiskLevel(Math.round(rt.v1BruttoScore));
                        const nettoLevel = getRiskLevel(Math.round(rt.v1NettoScore));
                        return (
                          <tr
                            key={rt.id}
                            className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                            onClick={() => router.push(`/risks/threats/${rt.id}`)}
                          >
                            <td className="px-4 py-3">
                              <div>
                                <span className="font-mono text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{rt.threatScenario.code}</span>
                                <span className="text-xs text-gray-700 ml-2">{rt.threatScenario.name}</span>
                              </div>
                            </td>
                            <td className="px-3 py-3 text-center">
                              {controlCount === 0 ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                  <AlertTriangle className="h-3 w-3" />
                                  Keine
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                                  <CheckCircle2 className="h-3 w-3" />
                                  {controlCount}
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-3 text-center">
                              {isNettoCalc ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                                  <CheckCircle2 className="h-3 w-3" />
                                  Netto berechnet
                                </span>
                              ) : rt.v1BruttoScore > 0 ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                                  <Clock className="h-3 w-3" />
                                  Nur Brutto
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                                  <Clock className="h-3 w-3" />
                                  Ausstehend
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${bruttoLevel.color}`}>
                                {rt.v1BruttoScore.toFixed(2)}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              {isNettoCalc ? (
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${nettoLevel.color}`}>
                                  {rt.v1NettoScore.toFixed(2)}
                                </span>
                              ) : (
                                <span className="text-xs text-gray-400">—</span>
                              )}
                            </td>
                            <td className="px-3 py-3 text-center">
                              {reduktion !== null ? (
                                <div className="flex items-center justify-center gap-1.5">
                                  <div className="w-12 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                    <div className="h-full rounded-full bg-emerald-500" style={{ width: `${reduktion}%` }} />
                                  </div>
                                  <span className="text-xs font-medium text-emerald-700">-{reduktion}%</span>
                                </div>
                              ) : (
                                <span className="text-xs text-gray-400">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Linked / SBOM Tabs */}
          <Card>
            <CardHeader className="p-0">
              <div className="flex border-b">
                <button
                  onClick={() => setActiveTab("linked")}
                  className={`flex items-center gap-1.5 px-5 py-3.5 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === "linked" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-900"
                  }`}
                >
                  <Link2 className="h-4 w-4" />
                  Verknüpfte Assets ({linkedAssets.length})
                </button>
                <button
                  onClick={() => setActiveTab("sbom")}
                  className={`flex items-center gap-1.5 px-5 py-3.5 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === "sbom" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-900"
                  }`}
                >
                  <Package className="h-4 w-4" />
                  SBOM ({sboms.length})
                </button>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {activeTab === "linked" && (
                <LinkedAssetsList
                  linkedAssets={linkedAssets}
                  onAddClick={() => setIsLinkAssetModalOpen(true)}
                />
              )}

              {activeTab === "sbom" && (
                <>
                  {asset.category !== "hardware" && asset.category !== "software" ? (
                    <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                      <Package className="h-10 w-10 mb-3 text-gray-200" />
                      <p className="text-sm">SBOM nicht anwendbar</p>
                      <p className="text-xs mt-1 text-center text-gray-400">
                        Software Bill of Materials ist nur für Hardware- und Software-Assets verfügbar.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-sm text-gray-500">{sboms.length} SBOM(s) hochgeladen</p>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => setIsConnectModalOpen(true)}>
                            <Zap className="w-4 h-4 mr-1.5" />
                            Verbinden
                          </Button>
                          <Button className="bg-[#0066FF] hover:bg-blue-700" size="sm" onClick={() => setIsUploadModalOpen(true)}>
                            <Upload className="w-4 h-4 mr-1.5" />
                            SBOM hochladen
                          </Button>
                        </div>
                      </div>

                      {sboms.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                          <Package className="h-10 w-10 mb-3 text-gray-200" />
                          <p className="text-sm">Noch keine SBOM hochgeladen</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
                            <p className="text-sm text-blue-700">Alle SBOMs und Schwachstellen anzeigen</p>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-blue-600 border-blue-200 hover:bg-blue-100"
                              onClick={() => router.push("/risks/sbom")}
                            >
                              <ExternalLink className="w-4 h-4 mr-1" />
                              SBOM-Übersicht
                            </Button>
                          </div>
                          {sboms.map((sbom) => (
                            <div
                              key={sbom.id}
                              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                                selectedSbom?.id === sbom.id ? "border-blue-300 bg-blue-50" : "border-gray-100 hover:border-gray-200"
                              }`}
                              onClick={async () => {
                                if (selectedSbom?.id === sbom.id) { setSelectedSbom(null); return; }
                                try {
                                  const res = await fetch(`/api/sbom/${sbom.id}`);
                                  if (res.ok) setSelectedSbom(await res.json());
                                } catch (error) { console.error("Failed to load SBOM details:", error); }
                              }}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded uppercase">{sbom.format}</span>
                                    <span className="font-medium text-gray-900">{sbom.versionLabel}</span>
                                    {sbom.isLatest && <span className="px-2 py-0.5 rounded text-xs bg-green-100 text-green-700">Aktuell</span>}
                                  </div>
                                  <p className="text-sm text-gray-500 mb-2">{sbom.componentsCount} Komponenten · {new Date(sbom.createdAt).toLocaleDateString("de-DE")}</p>
                                  <div className="flex items-center gap-2">
                                    {sbom.vulnerabilitySummary.total === 0 ? (
                                      <span className="px-2 py-0.5 rounded text-xs bg-green-100 text-green-700">Keine Schwachstellen</span>
                                    ) : (
                                      <>
                                        {sbom.vulnerabilitySummary.critical > 0 && <span className="px-2 py-0.5 rounded text-xs bg-red-100 text-red-700">{sbom.vulnerabilitySummary.critical} Kritisch</span>}
                                        {sbom.vulnerabilitySummary.high > 0 && <span className="px-2 py-0.5 rounded text-xs bg-orange-100 text-orange-700">{sbom.vulnerabilitySummary.high} Hoch</span>}
                                        {sbom.vulnerabilitySummary.medium > 0 && <span className="px-2 py-0.5 rounded text-xs bg-yellow-100 text-yellow-700">{sbom.vulnerabilitySummary.medium} Mittel</span>}
                                        {sbom.vulnerabilitySummary.low > 0 && <span className="px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-700">{sbom.vulnerabilitySummary.low} Niedrig</span>}
                                      </>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 ml-4">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      try {
                                        const response = await fetch(`/api/sbom/${sbom.id}/scan`, { method: "POST" });
                                        if (response.ok) loadSBOMs();
                                      } catch (error) { console.error("Failed to trigger scan:", error); }
                                    }}
                                  >
                                    Scan
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => { e.stopPropagation(); window.open(`/api/sbom/${sbom.id}/export`, "_blank"); }}
                                  >
                                    <Download className="w-4 h-4 mr-1" />
                                    Export
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}

                          {selectedSbom && (
                            <div className="mt-2 border border-blue-200 rounded-lg overflow-hidden">
                              <div className="bg-blue-50 px-4 py-3 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <span className="font-mono text-xs bg-white px-2 py-0.5 rounded uppercase border border-blue-200">{selectedSbom.format}</span>
                                  <span className="font-medium text-gray-900">{selectedSbom.versionLabel}</span>
                                  <span className="text-sm text-gray-500">{selectedSbom.components.length} Komponenten</span>
                                </div>
                                <button onClick={() => setSelectedSbom(null)} className="text-gray-400 hover:text-gray-600">
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                              {selectedSbom.vulnerabilitySummary.total > 0 && (
                                <div className="px-4 py-2 bg-red-50 border-b border-red-100 flex items-center gap-3">
                                  <AlertTriangle className="w-4 h-4 text-red-500" />
                                  <span className="text-sm font-medium text-red-700">
                                    {selectedSbom.vulnerabilitySummary.total} Schwachstellen gefunden
                                  </span>
                                </div>
                              )}
                              <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
                                {selectedSbom.components.map((comp) => (
                                  <div key={comp.id} className="px-4 py-3 flex items-start justify-between">
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium text-sm text-gray-900">{comp.name}</span>
                                        {comp.version && <span className="text-xs text-gray-400 font-mono">v{comp.version}</span>}
                                        {comp.licenseSpdx && <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">{comp.licenseSpdx}</span>}
                                      </div>
                                      {comp.vulnerabilities.length > 0 && (
                                        <div className="mt-1 flex flex-wrap gap-1">
                                          {comp.vulnerabilities.map((vuln) => (
                                            <span
                                              key={vuln.id}
                                              className={`text-xs px-2 py-0.5 rounded font-mono ${
                                                vuln.severity === "CRITICAL" ? "bg-red-100 text-red-700" :
                                                vuln.severity === "HIGH" ? "bg-orange-100 text-orange-700" :
                                                vuln.severity === "MEDIUM" ? "bg-yellow-100 text-yellow-700" :
                                                "bg-blue-100 text-blue-700"
                                              }`}
                                            >
                                              {vuln.cveId} · {vuln.severity}{vuln.cvssScore ? ` (${vuln.cvssScore})` : ""}
                                            </span>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                    {comp.vulnerabilities.length === 0 && (
                                      <Shield className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="col-span-5 space-y-6">
          {/* CIA-Bewertung */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Shield className="h-4 w-4 text-[#0066FF]" />
                CIA-Bewertung
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Vertraulichkeit */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label className="text-xs text-gray-500 flex items-center gap-1">
                    <Lock className="h-3 w-3" />
                    Vertraulichkeit (1–3)
                  </Label>
                  <span className={`text-sm font-bold ${getCIAColor(confidentiality)}`}>
                    {confidentiality || "—"}
                  </span>
                </div>
                <div className="flex gap-1.5">
                  {[1, 2, 3].map((v) => (
                    <button
                      key={v}
                      onClick={() => setConfidentiality(v)}
                      className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                        confidentiality === v
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      {v} – {v === 1 ? "Niedrig" : v === 2 ? "Mittel" : "Hoch"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Integrität */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label className="text-xs text-gray-500 flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    Integrität (1–3)
                  </Label>
                  <span className={`text-sm font-bold ${getCIAColor(integrity)}`}>
                    {integrity || "—"}
                  </span>
                </div>
                <div className="flex gap-1.5">
                  {[1, 2, 3].map((v) => (
                    <button
                      key={v}
                      onClick={() => setIntegrity(v)}
                      className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                        integrity === v
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      {v} – {v === 1 ? "Niedrig" : v === 2 ? "Mittel" : "Hoch"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Verfügbarkeit */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label className="text-xs text-gray-500 flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    Verfügbarkeit (1–3)
                  </Label>
                  <span className={`text-sm font-bold ${getCIAColor(availability)}`}>
                    {availability || "—"}
                  </span>
                </div>
                <div className="flex gap-1.5">
                  {[1, 2, 3].map((v) => (
                    <button
                      key={v}
                      onClick={() => setAvailability(v)}
                      className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                        availability === v
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      {v} – {v === 1 ? "Niedrig" : v === 2 ? "Mittel" : "Hoch"}
                    </button>
                  ))}
                </div>
              </div>

              {/* CIA Score */}
              <div className="border-t pt-3 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">CIA-Score (Ø)</span>
                <span
                  className={`rounded-lg px-3 py-1 text-lg font-bold ${getCIAColor(ciaScore)} ${
                    ciaScore >= 3 ? "bg-red-50" : ciaScore >= 2 ? "bg-orange-50" : ciaScore >= 1 ? "bg-green-50" : "bg-gray-50"
                  }`}
                >
                  {ciaScore > 0 ? ciaScore.toFixed(2) : "—"}
                </span>
              </div>

              {/* Protection Need Badge */}
              {ciaScore > 0 && (
                <div className={`rounded-lg p-3 text-center text-sm font-medium ${
                  ciaScore >= 2.34
                    ? "bg-red-50 text-red-700 border border-red-200"
                    : ciaScore >= 1.67
                    ? "bg-yellow-50 text-yellow-700 border border-yellow-200"
                    : "bg-green-50 text-green-700 border border-green-200"
                }`}>
                  Schutzbedarf:{" "}
                  <strong>
                    {ciaScore >= 2.34 ? "Sehr hoch" : ciaScore >= 1.67 ? "Hoch" : "Normal"}
                  </strong>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card>
            <CardContent className="pt-4 space-y-2">
              {[
                { label: "Erstellt am", value: new Date(asset.createdAt).toLocaleDateString("de-DE") },
                { label: "Aktualisiert am", value: new Date(asset.updatedAt).toLocaleDateString("de-DE") },
                { label: "Kategorie", value: CATEGORY_LABELS[asset.category] || asset.category },
                ...(asset.owner ? [{ label: "Verantwortlich", value: `${asset.owner.firstName} ${asset.owner.lastName}` }] : []),
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">{item.label}</span>
                  <span className="text-gray-700 font-medium">{item.value}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Risk Summary */}
          {riskThreats.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Risikozusammenfassung</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {riskThreats.slice(0, 5).map((rt) => {
                  const level = getRiskLevel(Math.round(rt.v1BruttoScore));
                  return (
                    <div
                      key={rt.id}
                      onClick={() => router.push(`/risks/threats/${rt.id}`)}
                      className="flex items-center justify-between cursor-pointer hover:bg-gray-50 rounded-lg p-2 -mx-2 transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-mono text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded flex-shrink-0">
                          {rt.threatScenario.code}
                        </span>
                        <span className="text-xs text-gray-700 truncate">{rt.threatScenario.name}</span>
                      </div>
                      <span className={`flex-shrink-0 ml-2 px-2 py-0.5 rounded-full text-[10px] font-semibold ${level.color}`}>
                        {rt.v1BruttoScore.toFixed(1)}
                      </span>
                    </div>
                  );
                })}
                {riskThreats.length > 5 && (
                  <p className="text-xs text-gray-400 text-center pt-1">
                    +{riskThreats.length - 5} weitere Szenarien
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>


      {/* Modals */}
      <AddThreatModal
        isOpen={isAddThreatModalOpen}
        onClose={() => setIsAddThreatModalOpen(false)}
        assetId={id as string}
        onThreatAdded={loadRiskThreats}
      />

      <LinkAssetModal
        isOpen={isLinkAssetModalOpen}
        onClose={() => setIsLinkAssetModalOpen(false)}
        assetId={id as string}
        onLinked={loadLinkedAssets}
      />

      {/* CI/CD Connect Modal */}
      {isConnectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">CI/CD Integration</h2>
                <p className="text-sm text-gray-500 mt-0.5">SBOM-Generierung in Ihre Pipeline integrieren</p>
              </div>
              <button onClick={() => setIsConnectModalOpen(false)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="bg-gray-50 border rounded-lg p-3 mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Asset ID (für die API)</p>
                <code className="text-sm font-mono text-gray-800">{assetIdVal}</code>
              </div>
              <button
                onClick={() => copyToClipboard(assetIdVal, "assetId")}
                className="text-xs text-blue-600 hover:text-blue-800 border border-blue-200 rounded px-2 py-1"
              >
                {copied === "assetId" ? "Kopiert ✓" : "Kopieren"}
              </button>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-4 text-sm text-blue-800">
              <strong>So funktioniert es:</strong> Ihr CI/CD-System generiert die SBOM und sendet sie per{" "}
              <code className="bg-blue-100 px-1 rounded text-xs">curl</code> an TrustSpace.
            </div>

            <div className="flex border-b mb-3">
              {snippetTabs.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setConnectTab(t.key)}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    connectTab === t.key ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="relative">
              <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 text-xs overflow-x-auto leading-relaxed max-h-64">
                {activeSnippet}
              </pre>
              <button
                onClick={() => copyToClipboard(activeSnippet, "snippet")}
                className="absolute top-2 right-2 text-xs bg-gray-700 hover:bg-gray-600 text-gray-200 rounded px-2 py-1"
              >
                {copied === "snippet" ? "Kopiert ✓" : "Kopieren"}
              </button>
            </div>

            <div className="flex justify-end mt-4">
              <Button variant="outline" onClick={() => setIsConnectModalOpen(false)}>Schließen</Button>
            </div>
          </div>
        </div>
      )}

      {/* SBOM Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">SBOM hochladen</h2>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="p-1.5 hover:bg-gray-100 rounded-lg"
                disabled={uploadLoading}
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const file = formData.get("file") as File;
                const versionLabel = formData.get("versionLabel") as string;
                if (!file || !versionLabel) { alert("Bitte Datei und Versionsbezeichnung eingeben"); return; }
                setUploadLoading(true);
                try {
                  formData.append("assetId", id as string);
                  const response = await fetch("/api/sbom/upload", { method: "POST", body: formData });
                  if (response.ok) {
                    loadSBOMs();
                    setIsUploadModalOpen(false);
                    setActiveTab("sbom");
                  } else {
                    const error = await response.json();
                    alert(`Upload fehlgeschlagen: ${error.error}`);
                  }
                } catch (error) {
                  console.error("Upload failed:", error);
                  alert("Upload fehlgeschlagen");
                } finally {
                  setUploadLoading(false);
                }
              }}
              className="space-y-4"
            >
              <div>
                <Label className="text-sm font-medium text-gray-700 block mb-2">Versionsbezeichnung</Label>
                <input
                  type="text"
                  name="versionLabel"
                  placeholder="z.B. v1.0.0"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 block mb-2">SBOM-Datei (JSON)</Label>
                <input
                  type="file"
                  name="file"
                  accept=".json"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Unterstützt CycloneDX und SPDX JSON</p>
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsUploadModalOpen(false)} className="flex-1" disabled={uploadLoading}>
                  Abbrechen
                </Button>
                <Button type="submit" className="flex-1 bg-[#0066FF] hover:bg-blue-700" disabled={uploadLoading}>
                  {uploadLoading ? "Hochladen..." : "Hochladen & Scannen"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
