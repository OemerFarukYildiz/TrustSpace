"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, Info } from "lucide-react";

interface RiskData {
  id: string;
  assetId: string;
  assetName: string;
  assetCategory: string;
  threatCode: string;
  threatName: string;
  bruttoProbability: number;
  bruttoImpact: number;
  bruttoScore: number;
  nettoScore: number;
}

interface MatrixCell {
  probability: number;
  impact: number;
  risks: RiskData[];
  count: number;
}

export default function RiskMatrixPage() {
  const router = useRouter();
  const [risks, setRisks] = useState<RiskData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCell, setSelectedCell] = useState<MatrixCell | null>(null);
  const [viewMode, setViewMode] = useState<"brutto" | "netto">("brutto");

  useEffect(() => {
    loadRisks();
  }, []);

  const loadRisks = async () => {
    try {
      const res = await fetch("/api/risks/matrix");
      if (res.ok) {
        const data = await res.json();
        setRisks(data);
      }
    } catch (error) {
      console.error("Failed to load risks:", error);
    } finally {
      setLoading(false);
    }
  };

  // Erstelle 5x5 Matrix
  const matrix: MatrixCell[][] = [];
  for (let prob = 5; prob >= 1; prob--) {
    const row: MatrixCell[] = [];
    for (let impact = 1; impact <= 5; impact++) {
      const score = prob * impact;
      const cellRisks = risks.filter((r) => {
        const checkScore = viewMode === "brutto" ? r.bruttoScore : r.nettoScore;
        const checkProb = viewMode === "brutto" ? r.bruttoProbability : Math.ceil(r.nettoScore / 5);
        const checkImpact = viewMode === "brutto" ? r.bruttoImpact : Math.ceil(r.nettoScore / checkProb) || 1;
        return checkProb === prob && checkImpact === impact;
      });
      row.push({
        probability: prob,
        impact,
        risks: cellRisks,
        count: cellRisks.length,
      });
    }
    matrix.push(row);
  }

  const getCellColor = (count: number, score: number) => {
    if (count === 0) return "bg-gray-50";
    
    // Farbe basierend auf Risiko-Score
    if (score <= 6) return "bg-green-100 hover:bg-green-200"; // Low
    if (score <= 12) return "bg-yellow-100 hover:bg-yellow-200"; // Medium
    if (score <= 19) return "bg-orange-100 hover:bg-orange-200"; // High
    return "bg-red-100 hover:bg-red-200"; // Critical
  };

  const getRiskLevel = (score: number) => {
    if (score <= 6) return { label: "Low", color: "text-green-700" };
    if (score <= 12) return { label: "Medium", color: "text-yellow-700" };
    if (score <= 19) return { label: "High", color: "text-orange-700" };
    return { label: "Critical", color: "text-red-700" };
  };

  const probabilityLabels = ["Very Likely", "Likely", "Possible", "Unlikely", "Very Unlikely"];
  const impactLabels = ["Very Low", "Low", "Medium", "High", "Very High"];

  // Stats
  const stats = {
    total: risks.length,
    low: risks.filter((r) => (viewMode === "brutto" ? r.bruttoScore : r.nettoScore) <= 6).length,
    medium: risks.filter((r) => {
      const score = viewMode === "brutto" ? r.bruttoScore : r.nettoScore;
      return score > 6 && score <= 12;
    }).length,
    high: risks.filter((r) => {
      const score = viewMode === "brutto" ? r.bruttoScore : r.nettoScore;
      return score > 12 && score <= 19;
    }).length,
    critical: risks.filter((r) => (viewMode === "brutto" ? r.bruttoScore : r.nettoScore) > 19).length,
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
        <span className="text-gray-900">Risk Matrix</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Risk Matrix</h1>
          <p className="text-sm text-gray-500 mt-1">
            Visual overview of all risk assessments by probability and impact
          </p>
        </div>
        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setViewMode("brutto")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === "brutto"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Brutto (without controls)
          </button>
          <button
            onClick={() => setViewMode("netto")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === "netto"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Netto (with controls)
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4">
        <div className="bg-white rounded-lg border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Total Risks</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 p-4">
          <p className="text-sm text-green-600">Low Risk</p>
          <p className="text-2xl font-bold text-green-700">{stats.low}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 p-4">
          <p className="text-sm text-yellow-600">Medium Risk</p>
          <p className="text-2xl font-bold text-yellow-700">{stats.medium}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 p-4">
          <p className="text-sm text-orange-600">High Risk</p>
          <p className="text-2xl font-bold text-orange-700">{stats.high}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 p-4">
          <p className="text-sm text-red-600">Critical Risk</p>
          <p className="text-2xl font-bold text-red-700">{stats.critical}</p>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-sm">
        <span className="text-gray-500">Risk Level:</span>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-100"></div>
          <span>Low (1-6)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-yellow-100"></div>
          <span>Medium (7-12)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-orange-100"></div>
          <span>High (13-19)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-100"></div>
          <span>Critical (20-25)</span>
        </div>
      </div>

      {/* Matrix Grid */}
      <div className="bg-white rounded-lg border border-gray-100 p-6">
        <div className="flex">
          {/* Y-Axis Label */}
          <div className="flex flex-col justify-center pr-4">
            <span className="text-sm font-medium text-gray-500 -rotate-90 whitespace-nowrap">
              Probability →
            </span>
          </div>

          <div className="flex-1">
            {/* Matrix */}
            <div className="grid grid-cols-6 gap-1">
              {/* Header Row */}
              <div className="p-2"></div>
              {impactLabels.map((label, i) => (
                <div key={i} className="p-2 text-center text-xs text-gray-500">
                  {i + 1}
                  <br />
                  {label}
                </div>
              ))}

              {/* Matrix Rows */}
              {matrix.map((row, rowIndex) => (
                <>
                  {/* Row Label */}
                  <div key={`label-${rowIndex}`} className="p-2 text-right text-xs text-gray-500 flex items-center justify-end">
                    {5 - rowIndex} - {probabilityLabels[rowIndex]}
                  </div>
                  {/* Cells */}
                  {row.map((cell, colIndex) => {
                    const score = cell.probability * cell.impact;
                    return (
                      <div
                        key={`${rowIndex}-${colIndex}`}
                        className={`aspect-square rounded-lg border border-gray-200 flex flex-col items-center justify-center cursor-pointer transition-all ${getCellColor(
                          cell.count,
                          score
                        )}`}
                        onClick={() => cell.count > 0 && setSelectedCell(cell)}
                      >
                        {cell.count > 0 ? (
                          <>
                            <span className="text-lg font-bold text-gray-900">{score}</span>
                            <span className="text-xs text-gray-600">{cell.count} risks</span>
                          </>
                        ) : (
                          <span className="text-xs text-gray-300">{score}</span>
                        )}
                      </div>
                    );
                  })}
                </>
              ))}
            </div>

            {/* X-Axis Label */}
            <div className="text-center mt-4">
              <span className="text-sm font-medium text-gray-500">Impact →</span>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Cell Details */}
      {selectedCell && (
        <div className="bg-white rounded-lg border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Risk Details
              </h3>
              <p className="text-sm text-gray-500">
                Probability: {selectedCell.probability} | Impact: {selectedCell.impact} | Score: {selectedCell.probability * selectedCell.impact}
              </p>
            </div>
            <button
              onClick={() => setSelectedCell(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {selectedCell.risks.map((risk) => (
              <div
                key={risk.id}
                className="p-3 border border-gray-100 rounded-lg hover:bg-gray-50 cursor-pointer"
                onClick={() => router.push(`/risks/${risk.assetId}`)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">
                        {risk.threatCode}
                      </span>
                      <span className="font-medium text-gray-900">{risk.threatName}</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Asset: {risk.assetName} ({risk.assetCategory})
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        getRiskLevel(viewMode === "brutto" ? risk.bruttoScore : risk.nettoScore).color
                      } bg-opacity-10`}
                    >
                      {getRiskLevel(viewMode === "brutto" ? risk.bruttoScore : risk.nettoScore).label}
                    </span>
                    <p className="text-lg font-bold text-gray-900 mt-1">
                      {viewMode === "brutto" ? risk.bruttoScore : risk.nettoScore}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 mt-0.5" />
        <div>
          <h4 className="font-medium text-blue-900">How to read the matrix</h4>
          <p className="text-sm text-blue-700 mt-1">
            Each cell represents a combination of probability and impact. The number shows the risk score (probability × impact). 
            Click on a colored cell to see all risks in that category. Toggle between Brutto (without controls) and Netto (with controls) 
            to see how your security measures reduce risks.
          </p>
        </div>
      </div>
    </div>
  );
}
