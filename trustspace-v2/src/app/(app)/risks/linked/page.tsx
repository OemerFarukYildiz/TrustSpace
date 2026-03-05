"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Link2, Search, Plus } from "lucide-react";
import Link from "next/link";

interface LinkedAssetDetail {
  id: string;
  primaryAsset: {
    id: string;
    name: string;
    category: string;
    ciaAverage: number;
  };
  secondaryAsset: {
    id: string;
    name: string;
    category: string;
    ciaAverage: number;
  };
  createdAt: string;
}

const categoryLabels: Record<string, string> = {
  process: "Process",
  software: "Software",
  hardware: "Hardware",
  location: "Location",
  supplier: "Supplier",
};

const getCiaBadge = (ciaAverage: number) => {
  if (!ciaAverage || ciaAverage === 0) {
    return (
      <span className="px-2 py-0.5 rounded text-xs font-medium bg-orange-50 text-orange-600 border border-orange-100">
        NA
      </span>
    );
  }
  return (
    <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-600 border border-green-100">
      {ciaAverage.toFixed(2)}
    </span>
  );
};

export default function LinkedAssetsDashboard() {
  const router = useRouter();
  const [linkedAssets, setLinkedAssets] = useState<LinkedAssetDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");

  useEffect(() => {
    loadLinkedAssets();
  }, []);

  const loadLinkedAssets = async () => {
    try {
      const res = await fetch("/api/linked-assets/all");
      if (res.ok) {
        const data = await res.json();
        setLinkedAssets(data);
      }
    } catch (error) {
      console.error("Failed to load linked assets:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLinks = linkedAssets.filter((link) => {
    const matchesSearch = 
      link.primaryAsset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      link.secondaryAsset.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = filterCategory === "all" || 
      link.primaryAsset.category === filterCategory ||
      link.secondaryAsset.category === filterCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Gruppiere nach Primary Asset
  const groupedByPrimary = filteredLinks.reduce((acc, link) => {
    const primaryId = link.primaryAsset.id;
    if (!acc[primaryId]) {
      acc[primaryId] = {
        primary: link.primaryAsset,
        secondaries: [],
      };
    }
    acc[primaryId].secondaries.push(link);
    return acc;
  }, {} as Record<string, { primary: LinkedAssetDetail["primaryAsset"]; secondaries: LinkedAssetDetail[] }>);

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/risks" className="hover:text-gray-900">Risk & Asset Management</Link>
        <span className="text-gray-400">/</span>
        <span className="text-gray-900">Linked Assets</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Linked Assets</h1>
          <p className="text-sm text-gray-500 mt-1">
            Overview of all asset relationships and dependencies
          </p>
        </div>
        <Button 
          className="bg-[#0066FF] hover:bg-blue-700"
          onClick={() => router.push("/risks/category/processes")}
        >
          <Plus className="w-4 h-4 mr-2" />
          Link New Assets
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Total Links</p>
          <p className="text-2xl font-bold text-gray-900">{linkedAssets.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Primary Assets</p>
          <p className="text-2xl font-bold text-gray-900">
            {Object.keys(groupedByPrimary).length}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 p-4">
          <p className="text-sm text-gray-500">With CIA Calculated</p>
          <p className="text-2xl font-bold text-green-600">
            {linkedAssets.filter(l => l.primaryAsset.ciaAverage > 0).length}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Pending CIA</p>
          <p className="text-2xl font-bold text-orange-600">
            {linkedAssets.filter(l => !l.primaryAsset.ciaAverage).length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input 
            placeholder="Search assets..." 
            className="pl-9 bg-white"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select 
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        >
          <option value="all">All Categories</option>
          <option value="process">Processes</option>
          <option value="software">Software</option>
          <option value="hardware">Hardware</option>
          <option value="supplier">Suppliers</option>
        </select>
      </div>

      {/* Linked Assets List */}
      <div className="space-y-4">
        {Object.values(groupedByPrimary).map(({ primary, secondaries }) => (
          <div key={primary.id} className="bg-white rounded-lg border border-gray-100 overflow-hidden">
            {/* Primary Asset Header */}
            <div 
              className="p-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between cursor-pointer hover:bg-gray-100"
              onClick={() => router.push(`/risks/${primary.id}`)}
            >
              <div className="flex items-center gap-3">
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                  {categoryLabels[primary.category]}
                </span>
                <span className="font-semibold text-gray-900">{primary.name}</span>
                {getCiaBadge(primary.ciaAverage)}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Link2 className="w-4 h-4" />
                {secondaries.length} linked
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>

            {/* Secondary Assets */}
            <div className="divide-y divide-gray-50">
              {secondaries.map((link) => (
                <div 
                  key={link.id}
                  className="p-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer"
                  onClick={() => router.push(`/risks/${link.secondaryAsset.id}`)}
                >
                  <div className="flex items-center gap-3 pl-8">
                    <div className="flex items-center gap-1 text-gray-400">
                      <div className="w-px h-4 bg-gray-300"></div>
                      <ArrowRight className="w-3 h-3" />
                    </div>
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                      {categoryLabels[link.secondaryAsset.category]}
                    </span>
                    <span className="text-gray-700">{link.secondaryAsset.name}</span>
                    {getCiaBadge(link.secondaryAsset.ciaAverage)}
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-300" />
                </div>
              ))}
            </div>
          </div>
        ))}

        {Object.keys(groupedByPrimary).length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Link2 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg">No linked assets found</p>
            <p className="text-sm">Start by linking assets from an asset detail page</p>
          </div>
        )}
      </div>
    </div>
  );
}
