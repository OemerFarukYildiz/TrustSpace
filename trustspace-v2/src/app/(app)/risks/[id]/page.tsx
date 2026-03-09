"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ChevronRight, Plus, Trash2, Search, X, AlertTriangle, Shield, Calculator, Link2, Upload, Download, Package, ExternalLink, Zap } from "lucide-react";
import Link from "next/link";

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
  threatScenario: {
    code: string;
    name: string;
    description: string;
  };
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

// CIA Calculator Modal
function CIACalculatorModal({
  isOpen,
  onClose,
  asset,
  onCalculated,
}: {
  isOpen: boolean;
  onClose: () => void;
  asset: Asset | null;
  onCalculated: () => void;
}) {
  const [confidentiality, setConfidentiality] = useState(1);
  const [integrity, setIntegrity] = useState(1);
  const [availability, setAvailability] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (asset) {
      setConfidentiality(asset.confidentiality || 1);
      setIntegrity(asset.integrity || 1);
      setAvailability(asset.availability || 1);
    }
  }, [asset, isOpen]);

  if (!isOpen || !asset) return null;

  const ciaAverage = (confidentiality + integrity + availability) / 3;

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/assets/${asset.id}/calculate-cia`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          confidentiality,
          integrity,
          availability,
        }),
      });

      if (res.ok) {
        onCalculated();
        onClose();
      }
    } catch (error) {
      console.error("Failed to save CIA:", error);
    } finally {
      setLoading(false);
    }
  };

  const getProtectionNeed = (value: number) => {
    if (value <= 1.5) return { label: "Normal", color: "green" };
    if (value <= 2.3) return { label: "High", color: "yellow" };
    return { label: "Very High", color: "red" };
  };

  const protectionNeed = getProtectionNeed(ciaAverage);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Calculate Protection Need (CIA)</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Rate each CIA factor from 1 (Low) to 3 (High):
          </p>

          {/* Confidentiality */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confidentiality (Vertraulichkeit)
            </label>
            <div className="flex gap-2">
              {[1, 2, 3].map((value) => (
                <button
                  key={value}
                  onClick={() => setConfidentiality(value)}
                  className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    confidentiality === value
                      ? "bg-blue-500 text-white border-blue-500"
                      : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {value} - {value === 1 ? "Low" : value === 2 ? "Medium" : "High"}
                </button>
              ))}
            </div>
          </div>

          {/* Integrity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Integrity (Integrität)
            </label>
            <div className="flex gap-2">
              {[1, 2, 3].map((value) => (
                <button
                  key={value}
                  onClick={() => setIntegrity(value)}
                  className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    integrity === value
                      ? "bg-blue-500 text-white border-blue-500"
                      : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {value} - {value === 1 ? "Low" : value === 2 ? "Medium" : "High"}
                </button>
              ))}
            </div>
          </div>

          {/* Availability */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Availability (Verfügbarkeit)
            </label>
            <div className="flex gap-2">
              {[1, 2, 3].map((value) => (
                <button
                  key={value}
                  onClick={() => setAvailability(value)}
                  className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    availability === value
                      ? "bg-blue-500 text-white border-blue-500"
                      : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {value} - {value === 1 ? "Low" : value === 2 ? "Medium" : "High"}
                </button>
              ))}
            </div>
          </div>

          {/* Result */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">CIA Average</p>
                <p className="text-2xl font-bold">{ciaAverage.toFixed(2)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Protection Need</p>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    protectionNeed.color === "green"
                      ? "bg-green-100 text-green-800"
                      : protectionNeed.color === "yellow"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {protectionNeed.label}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              className="flex-1 bg-[#0066FF] hover:bg-blue-700"
              disabled={loading}
              onClick={handleSave}
            >
              {loading ? "Saving..." : "Save Calculation"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Control Mapping Section for V1
function ControlMappingSection({
  selectedControls,
  onToggle,
}: {
  selectedControls: Set<string>;
  onToggle: (code: string) => void;
}) {
  const [controls, setControls] = useState<Array<{ id: string; code: string; title: string; status: string; implementationPct: number | null }>>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/controls")
      .then((r) => r.json())
      .then((data) => setControls(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = controls.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return c.code.toLowerCase().includes(q) || c.title.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-gray-900 flex items-center gap-2">
          <Shield className="w-4 h-4 text-blue-600" />
          Mapped Controls ({selectedControls.size})
        </h3>
      </div>
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search controls..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="max-h-40 overflow-y-auto border rounded-lg divide-y divide-gray-100">
        {loading ? (
          <p className="text-center py-4 text-sm text-gray-400">Loading...</p>
        ) : filtered.length === 0 ? (
          <p className="text-center py-4 text-sm text-gray-400">No controls found</p>
        ) : (
          filtered.map((ctrl) => {
            const isSelected = selectedControls.has(ctrl.code);
            return (
              <button
                key={ctrl.id}
                onClick={() => onToggle(ctrl.code)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-left transition-colors ${
                  isSelected ? "bg-blue-50" : "hover:bg-gray-50"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                    isSelected ? "bg-blue-500 border-blue-500" : "border-gray-300"
                  }`}
                >
                  {isSelected && (
                    <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <span className="text-xs font-mono font-semibold text-gray-600 w-14 flex-shrink-0">{ctrl.code}</span>
                <span className="text-xs text-gray-700 truncate">{ctrl.title}</span>
              </button>
            );
          })
        )}
      </div>
      {selectedControls.size > 0 && (
        <div className="flex flex-wrap gap-1">
          {Array.from(selectedControls).map((code) => (
            <span key={code} className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 border border-blue-200 rounded text-xs font-mono text-blue-700">
              {code}
              <button onClick={() => onToggle(code)} className="hover:text-red-500">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// Risk Calculation Modal
function RiskCalculationModal({
  isOpen,
  onClose,
  risk,
  asset,
  onCalculated,
}: {
  isOpen: boolean;
  onClose: () => void;
  risk: RiskThreat | null;
  asset: Asset | null;
  onCalculated: () => void;
}) {
  const [bruttoProbability, setBruttoProbability] = useState(1);
  const [bruttoImpact, setBruttoImpact] = useState(1);
  const [nettoProbability, setNettoProbability] = useState(1);
  const [nettoImpact, setNettoImpact] = useState(1);
  const [mappedControlsSet, setMappedControlsSet] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (risk && isOpen) {
      setBruttoProbability(risk.bruttoProbability || 1);
      setBruttoImpact(risk.bruttoImpact || 1);
      setNettoProbability(risk.nettoProbability || 1);
      setNettoImpact(risk.nettoImpact || 1);
      try {
        const mc = risk.controlsMapped ? JSON.parse(risk.controlsMapped) : [];
        setMappedControlsSet(new Set(Array.isArray(mc) ? mc : []));
      } catch {
        setMappedControlsSet(new Set());
      }
    }
  }, [risk, isOpen]);

  if (!isOpen || !risk || !asset) return null;

  const toggleControl = (code: string) => {
    setMappedControlsSet((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  // Berechnung mit CIA-Werten
  const ciaFactor = asset.ciaAverage || 1;
  const bruttoScore = Math.round(bruttoProbability * bruttoImpact * ciaFactor);
  const nettoScore = Math.round(nettoProbability * nettoImpact * ciaFactor);
  const reductionPct = bruttoScore > 0 ? Math.round(((bruttoScore - nettoScore) / bruttoScore) * 100) : 0;

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/risk-threats/${risk.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bruttoProbability,
          bruttoImpact,
          bruttoScore,
          nettoProbability,
          nettoImpact,
          nettoScore,
          mappedControls: JSON.stringify(Array.from(mappedControlsSet)),
        }),
      });

      if (res.ok) {
        onCalculated();
        onClose();
      }
    } catch (error) {
      console.error("Failed to save risk calculation:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskLevel = (score: number) => {
    if (score <= 5) return { label: "Low", color: "bg-green-100 text-green-800" };
    if (score <= 10) return { label: "Medium", color: "bg-yellow-100 text-yellow-800" };
    if (score <= 20) return { label: "High", color: "bg-orange-100 text-orange-800" };
    return { label: "Critical", color: "bg-red-100 text-red-800" };
  };

  const bruttoLevel = getRiskLevel(bruttoScore);
  const nettoLevel = getRiskLevel(nettoScore);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">Calculate Risk</h2>
            <p className="text-sm text-gray-500">
              {risk.threatScenario.code} - {risk.threatScenario.name}
            </p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="space-y-6">
          {/* CIA Values Display */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-900">Protection Need (CIA)</span>
              <span className="text-lg font-bold text-blue-900">{ciaFactor.toFixed(2)}</span>
            </div>
            <div className="flex gap-4 text-sm text-blue-700">
              <span>C: {asset.confidentiality}</span>
              <span>I: {asset.integrity}</span>
              <span>A: {asset.availability}</span>
            </div>
          </div>

          {/* Brutto Risk */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Gross Risk (Without Controls)</h3>

            <div>
              <label className="text-sm text-gray-600 block mb-2">Probability (1-5)</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    onClick={() => setBruttoProbability(value)}
                    className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                      bruttoProbability === value
                        ? "bg-red-500 text-white border-red-500"
                        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-600 block mb-2">Impact (1-5)</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    onClick={() => setBruttoImpact(value)}
                    className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                      bruttoImpact === value
                        ? "bg-red-500 text-white border-red-500"
                        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-red-50 p-3 rounded-lg border border-red-100">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Gross Risk Score</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500">
                    {bruttoProbability} x {bruttoImpact} x {ciaFactor.toFixed(1)} =
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${bruttoLevel.color}`}>
                    {bruttoScore} ({bruttoLevel.label})
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Control Mapping */}
          <ControlMappingSection
            selectedControls={mappedControlsSet}
            onToggle={toggleControl}
          />

          {/* Netto Risk */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Net Risk (With Controls)</h3>

            <div>
              <label className="text-sm text-gray-600 block mb-2">Residual Probability (1-5)</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    onClick={() => setNettoProbability(value)}
                    className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                      nettoProbability === value
                        ? "bg-green-500 text-white border-green-500"
                        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-600 block mb-2">Residual Impact (1-5)</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    onClick={() => setNettoImpact(value)}
                    className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                      nettoImpact === value
                        ? "bg-green-500 text-white border-green-500"
                        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-green-50 p-3 rounded-lg border border-green-100">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Net Risk Score</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500">
                    {nettoProbability} x {nettoImpact} x {ciaFactor.toFixed(1)} =
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${nettoLevel.color}`}>
                    {nettoScore} ({nettoLevel.label})
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Risk Reduction Summary */}
          <div className="bg-gradient-to-r from-red-50 to-green-50 p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-900">Risk Reduction</span>
              <span className={`text-lg font-bold ${reductionPct > 0 ? "text-green-700" : "text-gray-400"}`}>
                {reductionPct > 0 ? `-${reductionPct}%` : "0%"}
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span>Brutto: <strong className="text-red-600">{bruttoScore}</strong></span>
              <span>-&gt;</span>
              <span>Netto: <strong className="text-green-600">{nettoScore}</strong></span>
              <span>|</span>
              <span>{mappedControlsSet.size} Controls mapped</span>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              className="flex-1 bg-[#0066FF] hover:bg-blue-700"
              disabled={loading}
              onClick={handleSave}
            >
              {loading ? "Saving..." : "Save Calculation"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Add Threat Modal - Simple Assignment (No Calculation)
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
      loadThreats();
    }
  }, [isOpen]);

  const loadThreats = async () => {
    try {
      const res = await fetch(`/api/threats?assetId=${assetId}`);
      if (res.ok) {
        const data = await res.json();
        setThreats(data.filter((t: ThreatScenario) => !t.alreadyAssigned));
      }
    } catch (error) {
      console.error("Failed to load threats:", error);
    }
  };

  const toggleThreat = (threatId: string) => {
    setSelectedThreats((prev) =>
      prev.includes(threatId)
        ? prev.filter((id) => id !== threatId)
        : [...prev, threatId]
    );
  };

  const selectAll = () => {
    const visibleThreats = filteredThreats.map((t) => t.id);
    const allSelected = visibleThreats.every((id) => selectedThreats.includes(id));
    if (allSelected) {
      setSelectedThreats((prev) => prev.filter((id) => !visibleThreats.includes(id)));
    } else {
      setSelectedThreats((prev) => [...new Set([...prev, ...visibleThreats])]);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Technical": return "bg-blue-50 text-blue-700 border-blue-200";
      case "Physical": return "bg-orange-50 text-orange-700 border-orange-200";
      case "Operational": return "bg-purple-50 text-purple-700 border-purple-200";
      case "Legal": return "bg-red-50 text-red-700 border-red-200";
      default: return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const handleSubmit = async () => {
    if (selectedThreats.length === 0) return;

    setLoading(true);
    try {
      // Alle ausgewählten Threats speichern mit Default-Werten
      const promises = selectedThreats.map((threatId) =>
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
      );

      await Promise.all(promises);

      onThreatAdded();
      onClose();
      setSelectedThreats([]);
    } catch (error) {
      console.error("Failed to assign threats:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredThreats = threats.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === "all" || t.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(threats.map((t) => t.category))];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-lg font-semibold">Assign Threat Scenarios</h2>
            <p className="text-sm text-gray-500">
              {selectedThreats.length} selected
            </p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Filters */}
          <div className="p-4 border-b space-y-3">
            <input
              type="text"
              placeholder="Search threats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setFilterCategory("all")}
                className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                  filterCategory === "all"
                    ? "bg-gray-800 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                    filterCategory === cat
                      ? "bg-gray-800 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">
                {filteredThreats.length} threats available
              </span>
              <button
                onClick={selectAll}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                Select All Visible
              </button>
            </div>
          </div>

          {/* Threat List - Scrollable */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {filteredThreats.length === 0 ? (
              <p className="text-center text-gray-400 py-8">No threats found</p>
            ) : (
              filteredThreats.map((threat) => {
                const isSelected = selectedThreats.includes(threat.id);
                return (
                  <div
                    key={threat.id}
                    onClick={() => toggleThreat(threat.id)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      isSelected
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-100 hover:border-gray-300 bg-white"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Checkbox */}
                      <div
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          isSelected
                            ? "bg-blue-500 border-blue-500"
                            : "border-gray-300"
                        }`}
                      >
                        {isSelected && (
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-mono text-xs bg-gray-800 text-white px-2 py-0.5 rounded">
                            {threat.code}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${getCategoryColor(threat.category)}`}>
                            {threat.category}
                          </span>
                        </div>
                        <h4 className="font-medium text-gray-900 mb-1">{threat.name}</h4>
                        <p className="text-sm text-gray-500 line-clamp-2">{threat.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="bg-[#0066FF] hover:bg-blue-700"
            disabled={selectedThreats.length === 0 || loading}
            onClick={handleSubmit}
          >
            {loading ? "Assigning..." : `Assign ${selectedThreats.length} Threat(s)`}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Link Asset Modal
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
  const [availableAssets, setAvailableAssets] = useState<any[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (isOpen) {
      loadAvailableAssets();
    }
  }, [isOpen]);

  const loadAvailableAssets = async () => {
    try {
      const res = await fetch(`/api/assets/available?excludeId=${assetId}`);
      if (res.ok) {
        const data = await res.json();
        setAvailableAssets(data);
      }
    } catch (error) {
      console.error("Failed to load available assets:", error);
    }
  };

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

  const categoryLabels: Record<string, string> = {
    process: "Process",
    software: "Software",
    hardware: "Hardware",
    location: "Location",
    supplier: "Supplier",
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Link Asset</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Select an asset to link to this asset:
          </p>

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search assets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="max-h-64 overflow-y-auto space-y-2 border rounded-lg p-2">
            {filteredAssets.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">
                No available assets found
              </p>
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
                      {categoryLabels[asset.category] || asset.category}
                    </span>
                    <span className="font-medium text-sm">{asset.name}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              className="flex-1 bg-[#0066FF] hover:bg-blue-700"
              disabled={!selectedAsset || loading}
              onClick={handleLink}
            >
              {loading ? "Linking..." : "Link Asset"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Asset Tree Node Component
function AssetTreeNode({ 
  asset, 
  level = 0,
  onAddClick,
  isAddButton = false
}: { 
  asset?: LinkedAsset["asset"]; 
  level?: number;
  onAddClick?: () => void;
  isAddButton?: boolean;
}) {
  const router = useRouter();
  
  if (isAddButton) {
    return (
      <div 
        className="flex flex-col items-center cursor-pointer group"
        onClick={onAddClick}
      >
        <div className="w-px h-8 bg-gray-300 mb-2"></div>
        <div className="px-4 py-2 bg-green-50 border border-green-200 rounded-full text-green-600 text-sm font-medium hover:bg-green-100 transition-colors flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add new
        </div>
      </div>
    );
  }

  if (!asset) return null;

  return (
    <div 
      className="flex flex-col items-center cursor-pointer group"
      onClick={() => router.push(`/risks/${asset.id}`)}
    >
      {level > 0 && <div className="w-px h-6 bg-gray-300 mb-1"></div>}
      <div className="px-4 py-2 bg-white border border-gray-200 rounded-full text-gray-700 text-sm hover:border-blue-400 hover:text-blue-600 transition-colors shadow-sm">
        {asset.name}
      </div>
    </div>
  );
}

// Linked Assets Tree Component
function LinkedAssetsTree({ 
  linkedAssets, 
  onAddClick 
}: { 
  linkedAssets: LinkedAsset[];
  onAddClick: () => void;
}) {
  // Gruppiere nach Kategorie
  const groupedByCategory = linkedAssets.reduce((acc, link) => {
    const cat = link.asset.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(link);
    return acc;
  }, {} as Record<string, LinkedAsset[]>);

  const categoryLabels: Record<string, string> = {
    process: "Processes",
    software: "Software",
    hardware: "Hardware",
    location: "Locations",
    supplier: "Suppliers",
  };

  const categories = Object.keys(groupedByCategory);

  return (
    <div className="flex flex-col items-center py-8">
      {/* Root */}
      <div className="mb-8">
        <div className="px-6 py-3 bg-blue-50 border border-blue-200 rounded-full text-blue-800 font-medium">
          Assets
        </div>
      </div>

      {/* Connector */}
      {categories.length > 0 && <div className="w-px h-8 bg-gray-300"></div>}

      {/* Categories Row */}
      {categories.length > 0 && (
        <div className="flex gap-16 relative">
          {/* Horizontal connector */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gray-300" style={{ 
            marginLeft: `${100 / categories.length / 2}%`,
            marginRight: `${100 / categories.length / 2}%`
          }}></div>
          
          {categories.map((category) => (
            <div key={category} className="flex flex-col items-center">
              {/* Vertical connector */}
              <div className="w-px h-8 bg-gray-300"></div>
              
              {/* Category Node */}
              <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-gray-700 text-sm font-medium mb-4">
                {categoryLabels[category] || category}
              </div>

              {/* Assets under this category */}
              <div className="flex flex-col items-center gap-3">
                {groupedByCategory[category].map((link, idx) => (
                  <AssetTreeNode 
                    key={link.id} 
                    asset={link.asset} 
                    level={1}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Button */}
      <div className="mt-8">
        <AssetTreeNode onAddClick={onAddClick} isAddButton />
      </div>
    </div>
  );
}

export default function AssetDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [asset, setAsset] = useState<Asset | null>(null);
  const [linkedAssets, setLinkedAssets] = useState<LinkedAsset[]>([]);
  const [riskThreats, setRiskThreats] = useState<RiskThreat[]>([]);
  const [activeTab, setActiveTab] = useState(
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("tab") || "calculation"
      : "calculation"
  );
  const [loading, setLoading] = useState(true);
  const [isCIAModalOpen, setIsCIAModalOpen] = useState(false);
  const [isAddThreatModalOpen, setIsAddThreatModalOpen] = useState(false);
  const [isLinkAssetModalOpen, setIsLinkAssetModalOpen] = useState(false);
  const [editingRisk, setEditingRisk] = useState<RiskThreat | null>(null);
  const [isRiskCalculationModalOpen, setIsRiskCalculationModalOpen] = useState(false);
  const [sboms, setSboms] = useState<SBOM[]>([]);
  const [selectedSbom, setSelectedSbom] = useState<SBOMDetail | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [connectTab, setConnectTab] = useState<"github" | "gitlab" | "curl">("github");
  const [copied, setCopied] = useState<string | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);

  useEffect(() => {
    loadAsset();
    loadLinkedAssets();
    loadRiskThreats();
    loadSBOMs();
  }, [id]);

  const loadAsset = async () => {
    try {
      const res = await fetch(`/api/assets/${id}`);
      if (res.ok) {
        const data = await res.json();
        setAsset(data);
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
      if (res.ok) {
        const data = await res.json();
        setLinkedAssets(data);
      }
    } catch (error) {
      console.error("Failed to load linked assets:", error);
    }
  };

  const loadRiskThreats = async () => {
    try {
      const res = await fetch(`/api/risk-threats?assetId=${id}`);
      if (res.ok) {
        const data = await res.json();
        setRiskThreats(data);
      }
    } catch (error) {
      console.error("Failed to load risk threats:", error);
    }
  };

  const loadSBOMs = async () => {
    try {
      const res = await fetch(`/api/assets/${id}/sbom`);
      if (res.ok) {
        const data = await res.json();
        setSboms(data);
      }
    } catch (error) {
      console.error("Failed to load SBOMs:", error);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const getCiaBadge = () => {
    if (!asset?.ciaAverage || asset.ciaAverage === 0) {
      return (
        <span className="px-3 py-1 rounded-full text-sm font-medium bg-orange-50 text-orange-600 border border-orange-100">
          NA
        </span>
      );
    }
    return (
      <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-50 text-green-600 border border-green-100">
        {asset.ciaAverage.toFixed(2)}
      </span>
    );
  };

  const getRiskLevel = (score: number) => {
    if (score <= 6) return { label: "Low", color: "bg-green-100 text-green-800" };
    if (score <= 12) return { label: "Medium", color: "bg-yellow-100 text-yellow-800" };
    if (score <= 19) return { label: "High", color: "bg-orange-100 text-orange-800" };
    return { label: "Critical", color: "bg-red-100 text-red-800" };
  };

  const categoryLabels: Record<string, string> = {
    process: "Processes",
    software: "Software",
    hardware: "Hardware",
    location: "Locations",
    supplier: "Suppliers",
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (!asset) return <div className="p-8">Asset not found</div>;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/risks" className="hover:text-gray-900">Risk & Asset Management</Link>
        <span className="text-gray-400">/</span>
        <Link href={`/risks/category/${asset.category === "process" ? "processes" : asset.category + "s"}`} className="hover:text-gray-900">
          {categoryLabels[asset.category] || asset.category}
        </Link>
        <span className="text-gray-400">/</span>
        <span className="text-gray-900">{asset.name}</span>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left Panel - Details */}
        <div className="col-span-5 space-y-4">
          <div className="bg-white rounded-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Details</h2>
              <div className="flex items-center gap-2">
                <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">Saved</span>
                <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50">
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete Asset
                </Button>
              </div>
            </div>

            <div className="space-y-6">
              {/* Owners */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Owners</label>
                <button className="flex items-center gap-2 text-gray-500 hover:text-gray-700">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                    <Plus className="w-4 h-4" />
                  </div>
                  <span>Add owner</span>
                  <Plus className="w-4 h-4 text-blue-600" />
                </button>
              </div>

              {/* Created on */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Created on :</label>
                <p className="text-sm text-gray-900">
                  {new Date(asset.createdAt).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>

              {/* Asset Name */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Asset Name</label>
                <Input 
                  defaultValue={asset.name} 
                  className="bg-white"
                />
              </div>

              {/* Aggregate Assets (Description) */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Aggregate Assets</label>
                <textarea
                  defaultValue={asset.description}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Classification */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Classification</label>
                <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>N/A</option>
                  <option>Public</option>
                  <option>Internal</option>
                  <option>Confidential</option>
                  <option>Secret</option>
                </select>
              </div>

              {/* Location */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Location</label>
                <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>N/A</option>
                  <option>Headquarters</option>
                  <option>Branch Office</option>
                  <option>Remote</option>
                </select>
              </div>

              {/* Legal Responsibility */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Legal Responsibility</label>
                <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>Select an option</option>
                  <option>Data Controller</option>
                  <option>Data Processor</option>
                  <option>Joint Controller</option>
                </select>
              </div>

              {/* Department */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Department</label>
                <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>Select an option</option>
                  <option>IT</option>
                  <option>HR</option>
                  <option>Finance</option>
                  <option>Operations</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Need For Protection */}
        <div className="col-span-7 space-y-4">
          <div className="bg-white rounded-lg p-6 border border-gray-100">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-gray-900">Need For Protection :</h2>
                {getCiaBadge()}
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-600 flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" />
                  Open
                </span>
              </div>
              <Button 
                className="bg-[#0066FF] hover:bg-blue-700"
                onClick={() => setIsCIAModalOpen(true)}
              >
                <Calculator className="w-4 h-4 mr-2" />
                {asset.ciaAverage > 0 ? "Edit CIA" : "Calculate"}
              </Button>
            </div>

            {/* CIA Values Display */}
            {asset.ciaAverage > 0 && (
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 p-3 rounded-lg text-center">
                  <p className="text-xs text-blue-600 mb-1">Confidentiality</p>
                  <p className="text-xl font-bold text-blue-900">{asset.confidentiality}</p>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg text-center">
                  <p className="text-xs text-blue-600 mb-1">Integrity</p>
                  <p className="text-xl font-bold text-blue-900">{asset.integrity}</p>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg text-center">
                  <p className="text-xs text-blue-600 mb-1">Availability</p>
                  <p className="text-xl font-bold text-blue-900">{asset.availability}</p>
                </div>
              </div>
            )}

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full bg-gray-50 p-1 rounded-lg mb-6">
                <TabsTrigger value="calculation" className="flex-1 data-[state=active]:bg-white">
                  Calculation History
                </TabsTrigger>
                <TabsTrigger value="threats" className="flex-1 data-[state=active]:bg-white">
                  Threat Scenarios ({riskThreats.length})
                </TabsTrigger>
                <TabsTrigger value="linked" className="flex-1 data-[state=active]:bg-white">
                  Linked Assets ({linkedAssets.length})
                </TabsTrigger>
                <TabsTrigger value="sbom" className="flex-1 data-[state=active]:bg-white">
                  SBOM ({sboms.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="calculation" className="mt-0">
                {!asset.ciaAverage || asset.ciaAverage === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                    <Calculator className="w-12 h-12 mb-4 text-gray-300" />
                    <p className="text-lg">No Calculation to display</p>
                    <p className="text-sm mt-2">Click "Calculate" to enter CIA values</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-4 gap-4 text-sm font-medium text-gray-500 pb-2 border-b">
                      <span>Date</span>
                      <span>CIA Values</span>
                      <span>Average</span>
                      <span>Status</span>
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-sm py-3 items-center">
                      <span>{new Date(asset.updatedAt || asset.createdAt).toLocaleDateString()}</span>
                      <span>C:{asset.confidentiality} I:{asset.integrity} A:{asset.availability}</span>
                      <span className="font-medium text-green-600">{asset.ciaAverage.toFixed(2)}</span>
                      <span className="text-green-600 text-xs">✓ Calculated</span>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="threats" className="mt-0">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-gray-500">
                    {riskThreats.length} threat scenario(s) assigned
                  </p>
                  <Button 
                    className="bg-[#0066FF] hover:bg-blue-700"
                    onClick={() => setIsAddThreatModalOpen(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Threat Scenario
                  </Button>
                </div>

                {riskThreats.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                    <Shield className="w-12 h-12 mb-4 text-gray-300" />
                    <p className="text-lg">No threats assigned</p>
                    <Button 
                      className="mt-4 bg-[#0066FF]"
                      onClick={() => setIsAddThreatModalOpen(true)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Threat Scenario
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {riskThreats.map((rt) => {
                      const bruttoLevel = getRiskLevel(rt.bruttoScore);
                      const nettoLevel = getRiskLevel(rt.nettoScore);
                      let controlCount = 0;
                      try {
                        const mc = rt.controlsMapped ? JSON.parse(rt.controlsMapped) : [];
                        controlCount = Array.isArray(mc) ? mc.length : 0;
                      } catch { /* */ }
                      const reductionPct = rt.bruttoScore > 1 && rt.nettoScore < rt.bruttoScore
                        ? Math.round(((rt.bruttoScore - rt.nettoScore) / rt.bruttoScore) * 100)
                        : 0;
                      const statusTag = rt.bruttoScore <= 1
                        ? { label: "Offen", color: "bg-gray-100 text-gray-500" }
                        : controlCount > 0 && rt.nettoScore < rt.bruttoScore
                        ? { label: "Mitigiert", color: "bg-emerald-100 text-emerald-700" }
                        : controlCount > 0
                        ? { label: "Maßnahmen", color: "bg-blue-100 text-blue-700" }
                        : { label: "Unbehandelt", color: "bg-orange-100 text-orange-700" };

                      return (
                        <div
                          key={rt.id}
                          className="p-4 border border-gray-100 rounded-lg hover:border-gray-200 hover:shadow-sm cursor-pointer transition-all"
                          onClick={() => {
                            setEditingRisk(rt);
                            setIsRiskCalculationModalOpen(true);
                          }}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">
                                  {rt.threatScenario.code}
                                </span>
                                <span className="font-medium text-gray-900">{rt.threatScenario.name}</span>
                              </div>
                              <p className="text-sm text-gray-500 truncate">{rt.threatScenario.description}</p>
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0">
                              {/* Status Tag */}
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusTag.color}`}>
                                {statusTag.label}
                              </span>
                              {/* Controls badge */}
                              {controlCount > 0 && (
                                <span className="flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                                  <Shield className="w-3 h-3" />
                                  {controlCount}
                                </span>
                              )}
                              {/* Brutto */}
                              <div className="text-right">
                                <p className="text-xs text-gray-400">Brutto</p>
                                <div className="flex items-center gap-1.5">
                                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${bruttoLevel.color}`}>
                                    {bruttoLevel.label}
                                  </span>
                                  <span className="font-bold text-red-600">{rt.bruttoScore}</span>
                                </div>
                              </div>
                              <ChevronRight className="w-4 h-4 text-gray-300" />
                              {/* Netto */}
                              <div className="text-right">
                                <p className="text-xs text-gray-400">
                                  Netto{reductionPct > 0 && <span className="text-emerald-600 ml-1">-{reductionPct}%</span>}
                                </p>
                                <div className="flex items-center gap-1.5">
                                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${nettoLevel.color}`}>
                                    {nettoLevel.label}
                                  </span>
                                  <span className="font-bold text-green-600">{rt.nettoScore}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="linked" className="mt-0">
                {linkedAssets.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                    <Link2 className="w-12 h-12 mb-4 text-gray-300" />
                    <p className="text-lg">No linked assets</p>
                    <p className="text-sm mt-1">Link secondary assets to this asset</p>
                    <AssetTreeNode onAddClick={() => setIsLinkAssetModalOpen(true)} isAddButton />
                  </div>
                ) : (
                  <LinkedAssetsTree 
                    linkedAssets={linkedAssets} 
                    onAddClick={() => setIsLinkAssetModalOpen(true)}
                  />
                )}
              </TabsContent>

              <TabsContent value="sbom" className="mt-0">
                {asset?.category !== "hardware" && asset?.category !== "software" ? (
                  <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                    <Package className="w-12 h-12 mb-4 text-gray-300" />
                    <p className="text-lg">SBOM not applicable</p>
                    <p className="text-sm mt-1 text-center">
                      Software Bill of Materials is only available for hardware and software assets
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm text-gray-500">
                        {sboms.length} SBOM(s) uploaded
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setIsConnectModalOpen(true)}
                        >
                          <Zap className="w-4 h-4 mr-2" />
                          Connect
                        </Button>
                        <Button
                          className="bg-[#0066FF] hover:bg-blue-700"
                          onClick={() => setIsUploadModalOpen(true)}
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Upload SBOM
                        </Button>
                      </div>
                    </div>

                {sboms.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                    <Package className="w-12 h-12 mb-4 text-gray-300" />
                    <p className="text-lg">No SBOM uploaded</p>
                    <p className="text-sm mt-1">Upload a CycloneDX or SPDX SBOM for vulnerability scanning</p>
                    <div className="flex gap-2 mt-4">
                      <Button
                        variant="outline"
                        onClick={() => setIsConnectModalOpen(true)}
                      >
                        <Zap className="w-4 h-4 mr-2" />
                        Connect
                      </Button>
                      <Button
                        className="bg-[#0066FF]"
                        onClick={() => setIsUploadModalOpen(true)}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload SBOM
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Link to SBOM Overview */}
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
                      <p className="text-sm text-blue-700">View all SBOMs and vulnerability details</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-blue-600 border-blue-200 hover:bg-blue-100"
                        onClick={() => router.push("/risks/sbom")}
                      >
                        <ExternalLink className="w-4 h-4 mr-1" />
                        Open SBOM Overview
                      </Button>
                    </div>
                    {sboms.map((sbom) => (
                      <div
                        key={sbom.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${selectedSbom?.id === sbom.id ? "border-blue-300 bg-blue-50" : "border-gray-100 hover:border-gray-200"}`}
                        onClick={async () => {
                          if (selectedSbom?.id === sbom.id) {
                            setSelectedSbom(null);
                            return;
                          }
                          try {
                            const res = await fetch(`/api/sbom/${sbom.id}`);
                            if (res.ok) {
                              const data = await res.json();
                              setSelectedSbom(data);
                            }
                          } catch (error) {
                            console.error("Failed to load SBOM details:", error);
                          }
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded uppercase">
                                {sbom.format}
                              </span>
                              <span className="font-medium text-gray-900">{sbom.versionLabel}</span>
                              {sbom.isLatest && (
                                <span className="px-2 py-0.5 rounded text-xs bg-green-100 text-green-700">
                                  Latest
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-500 mb-2">
                              {sbom.componentsCount} components • {new Date(sbom.createdAt).toLocaleDateString()}
                            </p>

                            {/* Vulnerability Summary */}
                            <div className="flex items-center gap-2">
                              {sbom.vulnerabilitySummary.total === 0 ? (
                                <span className="px-2 py-0.5 rounded text-xs bg-green-100 text-green-700">
                                  No vulnerabilities
                                </span>
                              ) : (
                                <>
                                  {sbom.vulnerabilitySummary.critical > 0 && (
                                    <span className="px-2 py-0.5 rounded text-xs bg-red-100 text-red-700">
                                      {sbom.vulnerabilitySummary.critical} Critical
                                    </span>
                                  )}
                                  {sbom.vulnerabilitySummary.high > 0 && (
                                    <span className="px-2 py-0.5 rounded text-xs bg-orange-100 text-orange-700">
                                      {sbom.vulnerabilitySummary.high} High
                                    </span>
                                  )}
                                  {sbom.vulnerabilitySummary.medium > 0 && (
                                    <span className="px-2 py-0.5 rounded text-xs bg-yellow-100 text-yellow-700">
                                      {sbom.vulnerabilitySummary.medium} Medium
                                    </span>
                                  )}
                                  {sbom.vulnerabilitySummary.low > 0 && (
                                    <span className="px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-700">
                                      {sbom.vulnerabilitySummary.low} Low
                                    </span>
                                  )}
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
                                  const response = await fetch(`/api/sbom/${sbom.id}/scan`, {
                                    method: 'POST',
                                  });
                                  if (response.ok) {
                                    // Refresh SBOM list after scan
                                    loadSBOMs();
                                  }
                                } catch (error) {
                                  console.error('Failed to trigger scan:', error);
                                }
                              }}
                            >
                              Scan
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(`/api/sbom/${sbom.id}/export`, '_blank');
                              }}
                            >
                              <Download className="w-4 h-4 mr-1" />
                              Export
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* SBOM Detail Panel */}
                    {selectedSbom && (
                      <div className="mt-4 border border-blue-200 rounded-lg overflow-hidden">
                        <div className="bg-blue-50 px-4 py-3 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-xs bg-white px-2 py-0.5 rounded uppercase border border-blue-200">
                              {selectedSbom.format}
                            </span>
                            <span className="font-medium text-gray-900">{selectedSbom.versionLabel}</span>
                            <span className="text-sm text-gray-500">{selectedSbom.components.length} components</span>
                          </div>
                          <button onClick={() => setSelectedSbom(null)} className="text-gray-400 hover:text-gray-600">
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Vulnerability Summary */}
                        {selectedSbom.vulnerabilitySummary.total > 0 && (
                          <div className="px-4 py-2 bg-red-50 border-b border-red-100 flex items-center gap-3">
                            <AlertTriangle className="w-4 h-4 text-red-500" />
                            <span className="text-sm font-medium text-red-700">
                              {selectedSbom.vulnerabilitySummary.total} vulnerabilities found
                            </span>
                            <div className="flex gap-2">
                              {selectedSbom.vulnerabilitySummary.critical > 0 && <span className="px-2 py-0.5 rounded text-xs bg-red-100 text-red-700">{selectedSbom.vulnerabilitySummary.critical} Critical</span>}
                              {selectedSbom.vulnerabilitySummary.high > 0 && <span className="px-2 py-0.5 rounded text-xs bg-orange-100 text-orange-700">{selectedSbom.vulnerabilitySummary.high} High</span>}
                              {selectedSbom.vulnerabilitySummary.medium > 0 && <span className="px-2 py-0.5 rounded text-xs bg-yellow-100 text-yellow-700">{selectedSbom.vulnerabilitySummary.medium} Medium</span>}
                              {selectedSbom.vulnerabilitySummary.low > 0 && <span className="px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-700">{selectedSbom.vulnerabilitySummary.low} Low</span>}
                            </div>
                          </div>
                        )}

                        {/* Component List */}
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
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Modals */}
      <CIACalculatorModal
        isOpen={isCIAModalOpen}
        onClose={() => setIsCIAModalOpen(false)}
        asset={asset}
        onCalculated={loadAsset}
      />

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

      <RiskCalculationModal
        isOpen={isRiskCalculationModalOpen}
        onClose={() => {
          setIsRiskCalculationModalOpen(false);
          setEditingRisk(null);
        }}
        risk={editingRisk}
        asset={asset}
        onCalculated={loadRiskThreats}
      />

      {/* SBOM Connect / CI Integration Modal */}
      {isConnectModalOpen && (() => {
        const assetIdVal = id as string;
        const apiUrl = typeof window !== "undefined"
          ? `${window.location.origin}/api/sbom/upload`
          : "https://your-trustspace.domain/api/sbom/upload";

        const githubSnippet = `name: SBOM Upload to TrustSpace

on:
  push:
    branches: [main]

jobs:
  sbom:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - run: npm ci

      - name: Generate SBOM
        run: npx @cyclonedx/cyclonedx-npm --output-format JSON --output-file sbom.json --spec-version 1.6

      - name: Upload SBOM to TrustSpace
        run: |
          curl -X POST ${apiUrl} \\
            -F "file=@sbom.json" \\
            -F "assetId=${assetIdVal}" \\
            -F "versionLabel=\${{ github.sha }}"`;

        const gitlabSnippet = `sbom-upload:
  stage: deploy
  image: node:20
  script:
    - npm ci
    - npx @cyclonedx/cyclonedx-npm --output-format JSON --output-file sbom.json --spec-version 1.6
    - |
      curl -X POST ${apiUrl} \\
        -F "file=@sbom.json" \\
        -F "assetId=${assetIdVal}" \\
        -F "versionLabel=$CI_COMMIT_SHA"
  only:
    - main`;

        const curlSnippet = `# 1. SBOM generieren (lokal oder in CI)
npx @cyclonedx/cyclonedx-npm \\
  --output-format JSON \\
  --output-file sbom.json \\
  --spec-version 1.6

# 2. An TrustSpace senden
curl -X POST ${apiUrl} \\
  -F "file=@sbom.json" \\
  -F "assetId=${assetIdVal}" \\
  -F "versionLabel=1.0.0"`;

        const tabs = [
          { key: "github" as const, label: "GitHub Actions", snippet: githubSnippet },
          { key: "gitlab" as const, label: "GitLab CI", snippet: gitlabSnippet },
          { key: "curl" as const, label: "curl / manuell", snippet: curlSnippet },
        ];
        const activeSnippet = tabs.find(t => t.key === connectTab)?.snippet ?? "";

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold">CI/CD Integration</h2>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Integrieren Sie die SBOM-Generierung in Ihre Pipeline
                  </p>
                </div>
                <button onClick={() => setIsConnectModalOpen(false)} className="p-1 hover:bg-gray-100 rounded">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Asset ID */}
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

              {/* How it works */}
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-4 text-sm text-blue-800">
                <strong>So funktioniert es:</strong> Ihr CI/CD-System generiert die SBOM mit{" "}
                <code className="bg-blue-100 px-1 rounded text-xs">@cyclonedx/cyclonedx-npm</code> und sendet
                sie per <code className="bg-blue-100 px-1 rounded text-xs">curl</code> an TrustSpace.
                Keine Zugangsdaten zu Ihrem Repository nötig.
              </div>

              {/* Tabs */}
              <div className="flex border-b mb-3">
                {tabs.map(t => (
                  <button
                    key={t.key}
                    onClick={() => setConnectTab(t.key)}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                      connectTab === t.key
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Code snippet */}
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
                <Button variant="outline" onClick={() => setIsConnectModalOpen(false)}>
                  Schließen
                </Button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* SBOM Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Upload SBOM</h2>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="p-1 hover:bg-gray-100 rounded"
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

                if (!file || !versionLabel) {
                  alert("Please select a file and enter a version label");
                  return;
                }

                setUploadLoading(true);
                try {
                  formData.append("assetId", id as string);

                  const response = await fetch("/api/sbom/upload", {
                    method: "POST",
                    body: formData,
                  });

                  if (response.ok) {
                    loadSBOMs();
                    setIsUploadModalOpen(false);
                    setActiveTab("sbom");
                  } else {
                    const error = await response.json();
                    alert(`Upload failed: ${error.error}`);
                  }
                } catch (error) {
                  console.error("Upload failed:", error);
                  alert("Upload failed");
                } finally {
                  setUploadLoading(false);
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  Version Label
                </label>
                <input
                  type="text"
                  name="versionLabel"
                  placeholder="e.g., v1.0.0"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  SBOM File (JSON)
                </label>
                <input
                  type="file"
                  name="file"
                  accept=".json"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Supports CycloneDX and SPDX JSON formats
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="flex-1"
                  disabled={uploadLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-[#0066FF] hover:bg-blue-700"
                  disabled={uploadLoading}
                >
                  {uploadLoading ? "Uploading..." : "Upload & Scan"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
