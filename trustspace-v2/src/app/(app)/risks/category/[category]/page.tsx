"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDown, Plus, Search, Filter, ArrowRight, X } from "lucide-react";
import Link from "next/link";

const categoryTitles: Record<string, string> = {
  processes: "Processes",
  software: "Software", 
  hardware: "Hardware",
  locations: "Locations",
  suppliers: "Suppliers",
};

const categoryDescriptions: Record<string, string> = {
  processes: "Record all essential business processes that take place within the scope of the ISMS.",
  software: "Record internally used software solutions.",
  hardware: "Capture all IT hardware used in the ISMS application area.",
  locations: "Record different locations and premises of your company.",
  suppliers: "Record external service providers & suppliers who are active in the scope of the ISMS.",
};

// Kategorie-Mapping für API
const categoryMapping: Record<string, string> = {
  processes: "process",
  software: "software",
  hardware: "hardware",
  locations: "location",
  suppliers: "supplier",
};

interface Asset {
  id: string;
  name: string;
  createdAt: string;
  ciaAverage: number;
  owner: { firstName: string; lastName: string } | null;
  riskCount: number;
}

// Modal Component
function AddAssetModal({ 
  isOpen, 
  onClose, 
  category, 
  onAssetCreated 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  category: string;
  onAssetCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          category: categoryMapping[category],
          type: "primary",
        }),
      });

      if (res.ok) {
        setName("");
        setDescription("");
        onAssetCreated();
        loadStats();
        onClose();
      } else {
        const errorData = await res.json().catch(() => ({ error: "Unknown error" }));
        console.error("Failed to create asset:", errorData);
        alert("Failed to create asset: " + (errorData.error || errorData.details || "Unknown error"));
      }
    } catch (error) {
      console.error("Error creating asset:", error);
      alert("Error creating asset: " + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Add New Asset</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Asset Name *
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Videoüberwachung"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the asset..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <Input value={categoryTitles[category]} disabled className="bg-gray-50" />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1 bg-[#0066FF] hover:bg-blue-700"
              disabled={loading || !name.trim()}
            >
              {loading ? "Creating..." : "Create Asset"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface CategoryStats {
  assetsPercent: number;
  risksPercent: number;
  assetCount: number;
  calculatedCount: number;
  withRisksCount: number;
}

export default function AssetListPage() {
  const { category } = useParams();
  const router = useRouter();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [stats, setStats] = useState<CategoryStats>({
    assetsPercent: 0,
    risksPercent: 0,
    assetCount: 0,
    calculatedCount: 0,
    withRisksCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadAssets();
    loadStats();
  }, [category]);

  const loadAssets = async () => {
    try {
      const res = await fetch(`/api/assets?category=${category}`);
      if (res.ok) {
        const data = await res.json();
        setAssets(data);
      }
    } catch (error) {
      console.error("Failed to load assets:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const res = await fetch("/api/assets/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data[category as string] || stats);
      }
    } catch (error) {
      console.error("Failed to load stats:", error);
    }
  };

  const filteredAssets = assets.filter(a => 
    a.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getCiaBadge = (ciaAverage: number) => {
    if (!ciaAverage || ciaAverage === 0) {
      return (
        <span className="px-3 py-1 rounded-full text-sm font-medium bg-orange-50 text-orange-600 border border-orange-100">
          NA
        </span>
      );
    }
    return (
      <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-50 text-green-600 border border-green-100">
        {ciaAverage.toFixed(2)}
      </span>
    );
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/risks" className="hover:text-gray-900">Risk & Asset Management</Link>
        <span className="text-gray-400">/</span>
        <span className="text-gray-900">{categoryTitles[category as string]}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{categoryTitles[category as string]}</h1>
          <p className="text-sm text-gray-500 mt-1">{categoryDescriptions[category as string]}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="bg-white">
            <span className="text-sm">Assets Calculated {stats.assetsPercent}%</span>
          </Button>
          <Button variant="outline" className="bg-white">
            <span className="text-sm">Risks Assigned {stats.risksPercent}%</span>
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" className="bg-white">
            Prozesse
            <ChevronDown className="w-4 h-4 ml-2" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input 
              placeholder="Search Assets" 
              className="pl-9 w-64 bg-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" className="bg-white">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
          <Button 
            className="bg-[#0066FF] hover:bg-blue-700"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add new
          </Button>
        </div>
      </div>

      {/* Table Header */}
      <div className="flex items-center px-4 py-2 text-sm text-gray-500 border-b">
        <div className="flex-1 flex items-center gap-1">
          Name
          <ChevronDown className="w-3 h-3" />
        </div>
        <div className="w-32 flex items-center gap-1">
          Creation
          <ChevronDown className="w-3 h-3" />
        </div>
        <div className="w-28 flex items-center gap-1">
          CIA Average
          <ChevronDown className="w-3 h-3" />
        </div>
        <div className="w-28">Assigned To</div>
        <div className="w-16">Risks</div>
        <div className="w-8"></div>
      </div>

      {/* Asset List */}
      <div className="space-y-2">
        {filteredAssets.map((asset) => (
          <div
            key={asset.id}
            onClick={() => router.push(`/risks/${asset.id}`)}
            className="flex items-center px-4 py-3 bg-white rounded-lg border border-gray-100 hover:border-gray-200 hover:shadow-sm cursor-pointer transition-all"
          >
            <div className="flex-1 flex items-center gap-3">
              <button 
                className="p-1 hover:bg-gray-100 rounded"
                onClick={(e) => e.stopPropagation()}
              >
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>
              <span className="text-gray-900 font-medium">{asset.name}</span>
            </div>
            <div className="w-32 text-sm text-gray-500">
              {new Date(asset.createdAt).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </div>
            <div className="w-28">
              {getCiaBadge(asset.ciaAverage)}
            </div>
            <div className="w-28 text-sm text-gray-400">
              {asset.owner ? `${asset.owner.firstName} ${asset.owner.lastName}` : "-"}
            </div>
            <div className="w-16 text-sm text-gray-500">
              {asset.riskCount}
            </div>
            <div className="w-8">
              <ArrowRight className="w-4 h-4 text-gray-400" />
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      <AddAssetModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        category={category as string}
        onAssetCreated={loadAssets}
      />
    </div>
  );
}
