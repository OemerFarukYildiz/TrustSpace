"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Server, Monitor, Laptop, Printer, HardDrive, Router, Smartphone } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface HardwareAsset {
  id: string;
  name: string;
  type: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  location: string;
  status: string;
  purchaseDate: string;
  warrantyEnd: string;
  assignedTo: string | null;
  ipAddress: string | null;
  macAddress: string | null;
  ciaAverage: number;
  riskCount: number;
}

const hardwareTypes = [
  { id: "server", name: "Server", icon: Server },
  { id: "desktop", name: "Desktop PC", icon: Monitor },
  { id: "laptop", name: "Laptop", icon: Laptop },
  { id: "printer", name: "Printer", icon: Printer },
  { id: "storage", name: "Storage", icon: HardDrive },
  { id: "network", name: "Network Device", icon: Router },
  { id: "mobile", name: "Mobile Device", icon: Smartphone },
];

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  maintenance: "bg-yellow-100 text-yellow-800",
  retired: "bg-gray-100 text-gray-800",
  lost: "bg-red-100 text-red-800",
};

export default function HardwareListPage() {
  const router = useRouter();
  const [hardware, setHardware] = useState<HardwareAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadHardware();
  }, []);

  const loadHardware = async () => {
    try {
      const res = await fetch("/api/hardware");
      if (res.ok) {
        const data = await res.json();
        setHardware(data);
      }
    } catch (error) {
      console.error("Failed to load hardware:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredHardware = hardware.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.serialNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.assignedTo?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || item.type === filterType;
    const matchesStatus = filterStatus === "all" || item.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  // Stats
  const stats = {
    total: hardware.length,
    active: hardware.filter((h) => h.status === "active").length,
    maintenance: hardware.filter((h) => h.status === "maintenance").length,
    withRisks: hardware.filter((h) => h.riskCount > 0).length,
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

  const getHardwareIcon = (type: string) => {
    const hwType = hardwareTypes.find((t) => t.id === type);
    const Icon = hwType?.icon || Server;
    return <Icon className="w-5 h-5" />;
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
        <span className="text-gray-900">IT Hardware</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">IT Hardware Inventory</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage all physical IT assets and devices
          </p>
        </div>
        <Button
          className="bg-[#0066FF] hover:bg-blue-700"
          onClick={() => setIsModalOpen(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Hardware
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Total Devices</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Active</p>
          <p className="text-2xl font-bold text-green-600">{stats.active}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 p-4">
          <p className="text-sm text-gray-500">In Maintenance</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.maintenance}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 p-4">
          <p className="text-sm text-gray-500">With Risks</p>
          <p className="text-2xl font-bold text-red-600">{stats.withRisks}</p>
        </div>
      </div>

      {/* Type Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setFilterType("all")}
          className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
            filterType === "all"
              ? "bg-blue-500 text-white"
              : "bg-white text-gray-700 border border-gray-200"
          }`}
        >
          All Types
        </button>
        {hardwareTypes.map((type) => (
          <button
            key={type.id}
            onClick={() => setFilterType(type.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap flex items-center gap-2 ${
              filterType === type.id
                ? "bg-blue-500 text-white"
                : "bg-white text-gray-700 border border-gray-200"
            }`}
          >
            <type.icon className="w-4 h-4" />
            {type.name}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search by name, serial number, or assigned user..."
            className="pl-9 bg-white"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="maintenance">Maintenance</option>
          <option value="retired">Retired</option>
          <option value="lost">Lost/Stolen</option>
        </select>
      </div>

      {/* Hardware Table */}
      <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">
                Device
              </th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">
                Details
              </th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">
                Location
              </th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">
                Status
              </th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">
                CIA
              </th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">
                Risks
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredHardware.map((item) => (
              <tr
                key={item.id}
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() => router.push(`/risks/${item.id}`)}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                      {getHardwareIcon(item.type)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-xs text-gray-500">
                        {item.manufacturer} {item.model}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm">
                    <p className="text-gray-900">S/N: {item.serialNumber}</p>
                    {item.ipAddress && (
                      <p className="text-xs text-gray-500">IP: {item.ipAddress}</p>
                    )}
                    {item.assignedTo && (
                      <p className="text-xs text-gray-500">User: {item.assignedTo}</p>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-gray-700">{item.location}</span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      statusColors[item.status] || "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {item.status}
                  </span>
                </td>
                <td className="px-4 py-3">{getCiaBadge(item.ciaAverage)}</td>
                <td className="px-4 py-3">
                  {item.riskCount > 0 ? (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-50 text-red-600">
                      {item.riskCount} risks
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredHardware.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Server className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg">No hardware found</p>
            <p className="text-sm">Add your first IT asset</p>
          </div>
        )}
      </div>
    </div>
  );
}
