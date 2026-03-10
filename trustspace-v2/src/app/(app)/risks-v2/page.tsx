"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, Package, Target, Database, Cpu, Building2, Users, Map } from "lucide-react";

interface CategoryCard {
  category: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  assetCount: number;
}

const BASE_CATEGORIES: Omit<CategoryCard, "assetCount">[] = [
  {
    category: "information",
    title: "Informationen",
    description: "Datenbestände, Datenbanken und vertrauliche Informationen im ISMS-Scope.",
    icon: Database,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
  },
  {
    category: "application",
    title: "Anwendungen",
    description: "Software und Applikationen, die im ISMS-Scope betrieben werden.",
    icon: Cpu,
    iconBg: "bg-purple-100",
    iconColor: "text-purple-600",
  },
  {
    category: "infrastructure",
    title: "Infrastruktur",
    description: "IT-Infrastruktur, Server und Netzwerkkomponenten.",
    icon: Building2,
    iconBg: "bg-orange-100",
    iconColor: "text-orange-600",
  },
  {
    category: "personnel",
    title: "Personal",
    description: "Mitarbeiter und Verantwortliche im ISMS-Scope.",
    icon: Users,
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
  },
  {
    category: "physical",
    title: "Physische Assets",
    description: "Standorte, Gebäude und physische Komponenten.",
    icon: Map,
    iconBg: "bg-gray-100",
    iconColor: "text-gray-600",
  },
];

export default function RisksV2Page() {
  const router = useRouter();
  const [categories, setCategories] = useState<CategoryCard[]>(
    BASE_CATEGORIES.map((c) => ({ ...c, assetCount: 0 }))
  );
  const [loading, setLoading] = useState(true);
  const [seedingScenarios, setSeedingScenarios] = useState(false);
  const [totalAssets, setTotalAssets] = useState(0);

  useEffect(() => {
    fetch("/api/v2/assets/stats")
      .then((r) => r.json())
      .then((data) => {
        const byCategory: Record<string, number> = data.byCategory || {};
        setCategories(
          BASE_CATEGORIES.map((c) => ({ ...c, assetCount: byCategory[c.category] || 0 }))
        );
        setTotalAssets(data.totalAssets || 0);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function seedScenarios() {
    setSeedingScenarios(true);
    try {
      const res = await fetch("/api/v2/scenarios", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        alert(`${data.created} Szenarien erstellt, ${data.skipped} übersprungen`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSeedingScenarios(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Risks & Assets V2</h1>
          <p className="text-sm text-gray-500 mt-1">
            Quantitatives Risikomanagement – BSI Schadensklassen & FAIR-Methodik ·{" "}
            <span className="font-medium text-blue-600">{totalAssets} Assets</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={seedScenarios} disabled={seedingScenarios}>
            {seedingScenarios ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Target className="h-4 w-4 mr-1.5" />}
            Szenarien laden
          </Button>
          <Button variant="outline" onClick={() => router.push("/risks-v2/assets/new")}>
            <Package className="h-4 w-4 mr-1.5" />
            Asset anlegen
          </Button>
          <Button onClick={() => router.push("/risks-v2/risks/new")} className="bg-[#0066FF] hover:bg-[#0052cc] text-white">
            <Plus className="h-4 w-4 mr-1.5" />
            Risiko anlegen
          </Button>
        </div>
      </div>

      {/* Category Cards */}
      <div className="grid grid-cols-5 gap-4">
        {categories.map((cat) => {
          const Icon = cat.icon;
          return (
            <div
              key={cat.category}
              className="bg-white rounded-xl border border-gray-100 cursor-pointer hover:shadow-md hover:border-blue-200 transition-all group"
              onClick={() => router.push(`/risks-v2/category/${cat.category}`)}
            >
              {/* Card Header */}
              <div className="p-5 pb-3">
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-9 h-9 rounded-lg ${cat.iconBg} flex items-center justify-center`}>
                    <Icon className={`w-4 h-4 ${cat.iconColor}`} />
                  </div>
                  {cat.assetCount > 0 && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                      {cat.assetCount}
                    </span>
                  )}
                </div>
                <h3 className="font-semibold text-gray-900 text-sm group-hover:text-blue-600 transition-colors">
                  {cat.title}
                </h3>
                <p className="text-xs text-gray-400 mt-1 line-clamp-2">{cat.description}</p>
              </div>

              {/* Bottom action hint */}
              <div className="px-5 pb-4 pt-2 border-t border-gray-50">
                {cat.assetCount === 0 ? (
                  <p className="text-xs text-gray-400">Noch keine Assets</p>
                ) : (
                  <p className="text-xs text-blue-500 font-medium group-hover:text-blue-600">
                    {cat.assetCount} {cat.assetCount === 1 ? "Asset" : "Assets"} anzeigen →
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
