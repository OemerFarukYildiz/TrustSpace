"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus, AlertTriangle, Server, Package, Shield, FileText, ChevronRight } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

interface CategoryStats {
  category: string;
  title: string;
  description: string;
  risksPercent: number;
  assetsPercent: number;
  assetCount: number;
  calculatedCount?: number;
  withRisksCount?: number;
}

interface Activity {
  id: string;
  type: string;
  message: string;
  details?: string;
  timestamp: string;
  assetId: string;
  icon: string;
}

interface CriticalRisk {
  id: string;
  bruttoScore: number;
  asset: { id: string; name: string };
  threat: { code: string; name: string };
}

interface RiskMatrixData {
  id: string;
  bruttoScore: number;
  nettoScore: number;
  bruttoProbability: number;
  bruttoImpact: number;
  assetName: string;
}

interface HardwareItem {
  id: string;
  name: string;
  type: string;
  status: string;
  riskCount: number;
}

interface SBOMItem {
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
  asset: { id: string; name: string; category: string };
}

const categories: CategoryStats[] = [
  {
    category: "processes",
    title: "Processes",
    description: "Record all essential business processes that take place within the scope of the ISMS.",
    risksPercent: 0,
    assetsPercent: 0,
    assetCount: 0,
  },
  {
    category: "software",
    title: "Software",
    description: "Record internally used software solutions.",
    risksPercent: 0,
    assetsPercent: 0,
    assetCount: 0,
  },
  {
    category: "hardware",
    title: "Hardware",
    description: "Capture all IT hardware used in the ISMS application area.",
    risksPercent: 0,
    assetsPercent: 0,
    assetCount: 0,
  },
  {
    category: "locations",
    title: "Locations",
    description: "Record different locations and premises of your company.",
    risksPercent: 0,
    assetsPercent: 0,
    assetCount: 0,
  },
  {
    category: "suppliers",
    title: "Suppliers",
    description: "Record external service providers & suppliers who are active in the scope of the ISMS.",
    risksPercent: 0,
    assetsPercent: 0,
    assetCount: 0,
  },
];

// Activity Icon
function ActivityIcon({ icon }: { icon: string }) {
  const iconClass = "w-4 h-4 text-white";
  switch (icon) {
    case "plus":
      return <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center"><Plus className={iconClass} /></div>;
    case "calculator":
      return <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center"><Shield className={iconClass} /></div>;
    case "shield":
      return <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center"><Shield className={iconClass} /></div>;
    default:
      return <div className="w-8 h-8 rounded-full bg-gray-500 flex items-center justify-center"><FileText className={iconClass} /></div>;
  }
}

// Compact Risk Matrix Widget
function CompactRiskMatrix({ data }: { data: RiskMatrixData[] }) {
  const router = useRouter();
  
  // Create 5x5 matrix
  const matrix: number[][] = Array(5).fill(null).map(() => Array(5).fill(0));
  
  data.forEach((risk) => {
    const prob = Math.min(4, Math.max(0, 5 - risk.bruttoProbability));
    const impact = Math.min(4, Math.max(0, risk.bruttoImpact - 1));
    matrix[prob][impact]++;
  });

  const getColor = (count: number) => {
    if (count === 0) return "bg-gray-50";
    if (count <= 2) return "bg-green-200";
    if (count <= 5) return "bg-yellow-200";
    if (count <= 10) return "bg-orange-200";
    return "bg-red-200";
  };

  const totalRisks = data.length;

  return (
    <div className="bg-white rounded-lg border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Risk Matrix</h3>
            <p className="text-xs text-gray-500">{totalRisks} total risks</p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-blue-600"
          onClick={() => router.push("/risks/matrix")}
        >
          View
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
      
      {/* Mini 5x5 Grid */}
      <div className="grid grid-cols-5 gap-1">
        {matrix.map((row, i) =>
          row.map((count, j) => (
            <div
              key={`${i}-${j}`}
              className={`aspect-square rounded ${getColor(count)} flex items-center justify-center text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity`}
              onClick={() => router.push("/risks/matrix")}
            >
              {count > 0 ? count : ""}
            </div>
          ))
        )}
      </div>
      
      <div className="flex justify-between text-xs text-gray-400 mt-2">
        <span>Low</span>
        <span>Critical</span>
      </div>
    </div>
  );
}

// IT Hardware List Widget
function HardwareListWidget({ items }: { items: HardwareItem[] }) {
  const router = useRouter();
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-700";
      case "maintenance": return "bg-yellow-100 text-yellow-700";
      case "retired": return "bg-gray-100 text-gray-700";
      default: return "bg-blue-100 text-blue-700";
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
            <Server className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">IT Hardware</h3>
            <p className="text-xs text-gray-500">{items.length} devices</p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-blue-600"
          onClick={() => router.push("/risks/hardware")}
        >
          View All
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
      
      <div className="space-y-2">
        {items.slice(0, 4).map((item) => (
          <div 
            key={item.id} 
            className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
            onClick={() => router.push(`/risks/${item.id}`)}
          >
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-700 truncate max-w-[120px]">{item.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded text-xs ${getStatusColor(item.status)}`}>
                {item.status}
              </span>
              {item.riskCount > 0 && (
                <span className="px-2 py-0.5 rounded text-xs bg-red-100 text-red-700">
                  {item.riskCount} risks
                </span>
              )}
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-4">No hardware registered</p>
        )}
      </div>
    </div>
  );
}

// SBOM List Widget
function SBOMListWidget({ items }: { items: SBOMItem[] }) {
  const router = useRouter();

  const totalComponents = items.reduce((s, i) => s + i.componentsCount, 0);

  return (
    <div className="bg-white rounded-lg border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center">
            <Package className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">SBOM</h3>
            <p className="text-xs text-gray-500">
              {items.length === 0 ? "Keine SBOMs" : `${items.length} SBOMs · ${totalComponents.toLocaleString()} Komponenten`}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-blue-600"
          onClick={() => router.push("/risks/sbom")}
        >
          View All
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">Noch keine SBOMs hochgeladen</p>
      ) : (
      <div className="space-y-2">
        {items.slice(0, 4).map((item) => {
          const vs = item.vulnerabilitySummary;
          return (
          <div
            key={item.id}
            className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
            onClick={() => router.push(`/risks/sbom/${item.id}`)}
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-700 truncate font-medium">{item.asset.name}</p>
              <p className="text-xs text-gray-400 font-mono">{item.versionLabel} · {item.componentsCount} Komp.</p>
            </div>
            <div className="flex items-center gap-1">
              {vs.critical > 0 && (
                <span className="px-2 py-0.5 rounded text-xs bg-red-100 text-red-700 font-semibold">
                  {vs.critical} C
                </span>
              )}
              {vs.high > 0 && (
                <span className="px-2 py-0.5 rounded text-xs bg-orange-100 text-orange-700 font-semibold">
                  {vs.high} H
                </span>
              )}
              {vs.medium > 0 && (
                <span className="px-2 py-0.5 rounded text-xs bg-yellow-100 text-yellow-700 font-semibold">
                  {vs.medium} M
                </span>
              )}
              {vs.total === 0 && (
                <span className="px-2 py-0.5 rounded text-xs bg-green-100 text-green-700">
                  Clean
                </span>
              )}
            </div>
          </div>
          );
        })}
      </div>
      )}
    </div>
  );
}

export default function RisksOverviewPage() {
  const router = useRouter();
  const [stats, setStats] = useState(categories);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [criticalRisks, setCriticalRisks] = useState<CriticalRisk[]>([]);
  const [criticalCount, setCriticalCount] = useState(0);
  const [overallProgress, setOverallProgress] = useState(0);
  const [matrixData, setMatrixData] = useState<RiskMatrixData[]>([]);
  const [hardwareItems, setHardwareItems] = useState<HardwareItem[]>([]);
  const [sbomItems, setSbomItems] = useState<SBOMItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load stats
      const statsRes = await fetch("/api/assets/stats");
      if (statsRes.ok) {
        const data = await statsRes.json();
        const updated = categories.map(cat => ({
          ...cat,
          ...data[cat.category],
        }));
        setStats(updated);

        // Calculate overall progress
        const totalAssets = Object.values(data).reduce((acc: number, cat: any) => acc + (cat.assetCount || 0), 0);
        const completedAssets = Object.values(data).reduce((acc: number, cat: any) => 
          acc + (cat.assetsPercent > 0 ? 1 : 0), 0
        );
        setOverallProgress(totalAssets > 0 ? Math.round((completedAssets / 5) * 100) : 0);
      }

      // Load activity and critical risks
      const activityRes = await fetch("/api/risks/activity");
      if (activityRes.ok) {
        const data = await activityRes.json();
        setActivities(data.activities);
        setCriticalRisks(data.criticalRisks);
        setCriticalCount(data.criticalCount);
      }

      // Load matrix data
      const matrixRes = await fetch("/api/risks/matrix");
      if (matrixRes.ok) {
        setMatrixData(await matrixRes.json());
      }

      // Load hardware list
      const hardwareRes = await fetch("/api/hardware");
      if (hardwareRes.ok) {
        const hw = await hardwareRes.json();
        setHardwareItems(hw.slice(0, 5)); // Top 5
      }

      // Load SBOM list (real data from overview endpoint)
      const sbomRes = await fetch("/api/sbom/overview");
      if (sbomRes.ok) {
        const sbom = await sbomRes.json();
        // Sort by worst vulnerability first
        sbom.sort((a: SBOMItem, b: SBOMItem) =>
          (b.vulnerabilitySummary.critical * 1000 + b.vulnerabilitySummary.high * 100 + b.vulnerabilitySummary.medium) -
          (a.vulnerabilitySummary.critical * 1000 + a.vulnerabilitySummary.high * 100 + a.vulnerabilitySummary.medium)
        );
        setSbomItems(sbom.slice(0, 5));
      }
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/risks" className="hover:text-gray-900">Risk & Asset Management</Link>
      </div>

      {/* Critical Risks Banner */}
      {criticalCount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-red-900">
              ⚠️ {criticalCount} {criticalCount === 1 ? "Asset has" : "Assets have"} critical risks
            </h3>
            <p className="text-sm text-red-700">
              Immediate action required. Review and implement controls to reduce risk levels.
            </p>
          </div>
          <Button 
            variant="outline" 
            className="border-red-300 text-red-700 hover:bg-red-100"
            onClick={() => router.push("/risks/matrix")}
          >
            View Matrix
          </Button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Risk & Asset Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            Overall ISMS Coverage: <span className="font-medium text-blue-600">{overallProgress}%</span>
          </p>
        </div>
        <Button 
          className="bg-[#0066FF] hover:bg-blue-700"
          onClick={() => router.push("/risks/category/processes")}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add new
        </Button>
      </div>

      {/* 1. Category Cards - Asset Liste */}
      <div className="grid grid-cols-5 gap-4">
        {stats.map((cat) => {
          const withRisks = cat.withRisksCount ?? 0;
          const calculated = cat.calculatedCount ?? 0;
          const total = cat.assetCount;
          const hasIssues = withRisks > 0 && calculated < total;
          return (
            <div
              key={cat.category}
              className={`bg-white rounded-xl border cursor-pointer hover:shadow-md transition-all group ${hasIssues ? "border-amber-200 hover:border-amber-300" : "border-gray-100 hover:border-blue-200"}`}
              onClick={() => router.push(`/risks/category/${cat.category}`)}
            >
              {/* Card Header */}
              <div className="p-5 pb-3">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 text-sm group-hover:text-blue-600 transition-colors">{cat.title}</h3>
                  {total > 0 && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium flex-shrink-0 ml-2">
                      {total}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 line-clamp-2">{cat.description}</p>
              </div>

              {/* Metrics */}
              <div className="px-5 pb-5 pt-3 border-t border-gray-50 space-y-2.5">
                {/* Risk assessment progress */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Risiken</span>
                    <span className="text-xs font-semibold text-gray-700">{withRisks}/{total}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-400 rounded-full transition-all"
                      style={{ width: total > 0 ? `${cat.risksPercent}%` : "0%" }}
                    />
                  </div>
                </div>
                {/* CIA calculation progress */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">CIA berechnet</span>
                    <span className="text-xs font-semibold text-gray-700">{calculated}/{total}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${cat.assetsPercent === 100 ? "bg-emerald-400" : "bg-amber-400"}`}
                      style={{ width: total > 0 ? `${cat.assetsPercent}%` : "0%" }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 2. Dashboard Widgets Row */}
      <div className="grid grid-cols-3 gap-4">
        <CompactRiskMatrix data={matrixData} />
        <HardwareListWidget items={hardwareItems} />
        <SBOMListWidget items={sbomItems} />
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
        {activities.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No recent activity</p>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div 
                key={activity.id} 
                className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                onClick={() => router.push(`/risks/${activity.assetId}`)}
              >
                <ActivityIcon icon={activity.icon} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">{activity.message}</p>
                  {activity.details && (
                    <p className="text-xs text-gray-500 mt-0.5">{activity.details}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-5 text-white">
          <p className="text-blue-100 text-sm">Total Assets</p>
          <p className="text-3xl font-bold mt-1">
            {stats.reduce((acc, cat) => acc + cat.assetCount, 0)}
          </p>
        </div>
        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg p-5 text-white">
          <p className="text-red-100 text-sm">Critical Risks</p>
          <p className="text-3xl font-bold mt-1">{criticalCount}</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-5 text-white">
          <p className="text-green-100 text-sm">Completed Assessments</p>
          <p className="text-3xl font-bold mt-1">{overallProgress}%</p>
        </div>
      </div>
    </div>
  );
}
