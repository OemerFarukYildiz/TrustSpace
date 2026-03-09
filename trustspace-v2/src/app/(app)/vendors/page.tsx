"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Store,
  Plus,
  Search,
  Shield,
  Globe,
  ChevronRight,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Building2,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Vendor {
  id: string;
  name: string;
  category: string;
  services: string | null;
  assessmentStatus: string;
  gdprCompliant: boolean | null;
  trustCenterUrl: string | null;
  certifications: string | null;
  logoUrl: string | null;
  website: string | null;
  country: string | null;
  contactName: string | null;
  contactEmail: string | null;
  riskLevel: string | null;
  lastReviewDate: string | null;
  nextReviewDate: string | null;
  createdAt: string;
  _count?: {
    assessments: number;
    vendorDocuments: number;
  };
}

const CATEGORIES = [
  "IT-Dienstleistung",
  "Cloud-Anbieter",
  "SaaS",
  "Beratung",
  "Infrastruktur",
  "Sicherheit",
  "Datenverarbeitung",
  "Sonstiges",
];

function getStatusConfig(status: string) {
  switch (status) {
    case "approved":
      return {
        label: "Freigegeben",
        color: "bg-emerald-50 text-emerald-700 border-emerald-200",
        icon: CheckCircle2,
      };
    case "evaluated":
      return {
        label: "Bewertet",
        color: "bg-blue-50 text-blue-700 border-blue-200",
        icon: FileText,
      };
    case "sent":
      return {
        label: "Versendet",
        color: "bg-amber-50 text-amber-700 border-amber-200",
        icon: Clock,
      };
    case "rejected":
      return {
        label: "Abgelehnt",
        color: "bg-red-50 text-red-700 border-red-200",
        icon: AlertTriangle,
      };
    default:
      return {
        label: "Nicht bewertet",
        color: "bg-gray-50 text-gray-600 border-gray-200",
        icon: Clock,
      };
  }
}

function getRiskBadge(level: string | null) {
  switch (level) {
    case "high":
      return { label: "Hoch", color: "bg-red-50 text-red-700 border-red-200" };
    case "medium":
      return {
        label: "Mittel",
        color: "bg-amber-50 text-amber-700 border-amber-200",
      };
    case "low":
      return {
        label: "Niedrig",
        color: "bg-emerald-50 text-emerald-700 border-emerald-200",
      };
    default:
      return null;
  }
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

function getLogoDomain(vendor: Vendor): string | null {
  if (vendor.logoUrl) return null; // already has logo
  if (vendor.website) {
    try {
      const url = new URL(
        vendor.website.startsWith("http")
          ? vendor.website
          : `https://${vendor.website}`
      );
      return url.hostname;
    } catch {
      return null;
    }
  }
  return null;
}

export default function VendorsPage() {
  const router = useRouter();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newVendor, setNewVendor] = useState({
    name: "",
    category: "IT-Dienstleistung",
    services: "",
  });

  useEffect(() => {
    fetchVendors();
  }, []);

  async function fetchVendors() {
    try {
      const res = await fetch("/api/vendors");
      if (res.ok) {
        const data = await res.json();
        setVendors(data);
      }
    } catch (error) {
      console.error("Failed to fetch vendors:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!newVendor.name.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/vendors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newVendor),
      });
      if (res.ok) {
        const created = await res.json();
        setShowCreateDialog(false);
        setNewVendor({ name: "", category: "IT-Dienstleistung", services: "" });
        router.push(`/vendors/${created.id}`);
      }
    } catch (error) {
      console.error("Failed to create vendor:", error);
    } finally {
      setCreating(false);
    }
  }

  const filtered = useMemo(() => {
    return vendors.filter((v) => {
      const matchesSearch =
        !search ||
        v.name.toLowerCase().includes(search.toLowerCase()) ||
        v.category.toLowerCase().includes(search.toLowerCase()) ||
        v.services?.toLowerCase().includes(search.toLowerCase()) ||
        v.contactName?.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || v.assessmentStatus === statusFilter;

      const matchesCategory =
        categoryFilter === "all" || v.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [vendors, search, statusFilter, categoryFilter]);

  const stats = useMemo(() => {
    return {
      total: vendors.length,
      approved: vendors.filter((v) => v.assessmentStatus === "approved").length,
      pending: vendors.filter(
        (v) => v.assessmentStatus === "none" || v.assessmentStatus === "sent"
      ).length,
      gdpr: vendors.filter((v) => v.gdprCompliant).length,
    };
  }, [vendors]);

  const uniqueCategories = useMemo(() => {
    const cats = new Set(vendors.map((v) => v.category));
    return Array.from(cats).sort();
  }, [vendors]);

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-gray-200 rounded" />
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gray-100 rounded-xl" />
            ))}
          </div>
          <div className="h-96 bg-gray-100 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vendoren</h1>
          <p className="text-sm text-gray-500 mt-1">
            Drittanbieter verwalten und bewerten
          </p>
        </div>
        <Button
          onClick={() => setShowCreateDialog(true)}
          className="bg-[#0066FF] hover:bg-[#0052cc] text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Vendor hinzufügen
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Gesamt
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {stats.total}
              </p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <Store className="h-5 w-5 text-[#0066FF]" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Freigegeben
              </p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">
                {stats.approved}
              </p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center">
              <Shield className="h-5 w-5 text-emerald-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ausstehend
              </p>
              <p className="text-2xl font-bold text-amber-600 mt-1">
                {stats.pending}
              </p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-amber-50 flex items-center justify-center">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                DSGVO-konform
              </p>
              <p className="text-2xl font-bold text-purple-600 mt-1">
                {stats.gdpr}
              </p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center">
              <Globe className="h-5 w-5 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Vendor suchen..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-gray-50 border-gray-200 focus:bg-white"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px] bg-gray-50 border-gray-200">
              <div className="flex items-center gap-2">
                <Filter className="h-3.5 w-3.5 text-gray-400" />
                <SelectValue placeholder="Status" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Status</SelectItem>
              <SelectItem value="approved">Freigegeben</SelectItem>
              <SelectItem value="evaluated">Bewertet</SelectItem>
              <SelectItem value="sent">Versendet</SelectItem>
              <SelectItem value="none">Nicht bewertet</SelectItem>
              <SelectItem value="rejected">Abgelehnt</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[200px] bg-gray-50 border-gray-200">
              <div className="flex items-center gap-2">
                <Building2 className="h-3.5 w-3.5 text-gray-400" />
                <SelectValue placeholder="Kategorie" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Kategorien</SelectItem>
              {uniqueCategories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Lieferant
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Kategorie
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Risiko
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  DSGVO
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Review
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Dokumente
                </th>
                <th className="py-3 px-4 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="text-center py-16 text-gray-400 text-sm"
                  >
                    <Store className="h-10 w-10 mx-auto mb-3 text-gray-300" />
                    {vendors.length === 0
                      ? "Noch keine Vendoren angelegt"
                      : "Keine Vendoren gefunden"}
                  </td>
                </tr>
              ) : (
                filtered.map((vendor) => {
                  const statusCfg = getStatusConfig(vendor.assessmentStatus);
                  const StatusIcon = statusCfg.icon;
                  const riskBadge = getRiskBadge(vendor.riskLevel);
                  const logoDomain = getLogoDomain(vendor);

                  return (
                    <tr
                      key={vendor.id}
                      onClick={() => router.push(`/vendors/${vendor.id}`)}
                      className="hover:bg-gray-50/80 cursor-pointer transition-colors group"
                    >
                      {/* Lieferant */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {vendor.logoUrl ? (
                              <img
                                src={vendor.logoUrl}
                                alt={vendor.name}
                                className="h-9 w-9 object-contain"
                              />
                            ) : logoDomain ? (
                              <img
                                src={`https://logo.clearbit.com/${logoDomain}`}
                                alt={vendor.name}
                                className="h-9 w-9 object-contain"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display =
                                    "none";
                                  (
                                    e.target as HTMLImageElement
                                  ).nextElementSibling?.classList.remove(
                                    "hidden"
                                  );
                                }}
                              />
                            ) : null}
                            <span
                              className={cn(
                                "text-sm font-semibold text-gray-400",
                                (vendor.logoUrl || logoDomain) && "hidden"
                              )}
                            >
                              {vendor.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {vendor.name}
                            </p>
                            {vendor.services && (
                              <p className="text-xs text-gray-500 truncate max-w-[200px]">
                                {vendor.services}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Kategorie */}
                      <td className="py-3.5 px-4">
                        <span className="text-sm text-gray-600">
                          {vendor.category}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <div
                          className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
                            statusCfg.color
                          )}
                        >
                          <StatusIcon className="h-3 w-3" />
                          {statusCfg.label}
                        </div>
                      </td>

                      {/* Risiko */}
                      <td className="py-3.5 px-4">
                        {riskBadge ? (
                          <span
                            className={cn(
                              "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border",
                              riskBadge.color
                            )}
                          >
                            {riskBadge.label}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>

                      {/* DSGVO */}
                      <td className="py-3.5 px-4">
                        {vendor.gdprCompliant === true ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        ) : vendor.gdprCompliant === false ? (
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>

                      {/* Review */}
                      <td className="py-3.5 px-4">
                        <span className="text-xs text-gray-500">
                          {formatDate(vendor.nextReviewDate)}
                        </span>
                      </td>

                      {/* Dokumente */}
                      <td className="py-3.5 px-4">
                        <span className="text-xs text-gray-500">
                          {vendor._count?.vendorDocuments ?? 0}
                        </span>
                      </td>

                      {/* Arrow */}
                      <td className="py-3.5 px-4">
                        <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Neuen Vendor hinzufügen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="vendor-name">Name *</Label>
              <Input
                id="vendor-name"
                placeholder="z.B. Microsoft Azure"
                value={newVendor.name}
                onChange={(e) =>
                  setNewVendor((p) => ({ ...p, name: e.target.value }))
                }
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="vendor-category">Kategorie</Label>
              <Select
                value={newVendor.category}
                onValueChange={(v) =>
                  setNewVendor((p) => ({ ...p, category: v }))
                }
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="vendor-services">Dienste / Beschreibung</Label>
              <Input
                id="vendor-services"
                placeholder="z.B. Cloud-Infrastruktur, SaaS-Plattform"
                value={newVendor.services}
                onChange={(e) =>
                  setNewVendor((p) => ({ ...p, services: e.target.value }))
                }
                className="mt-1.5"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
            >
              Abbrechen
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!newVendor.name.trim() || creating}
              className="bg-[#0066FF] hover:bg-[#0052cc] text-white"
            >
              {creating ? "Erstelle..." : "Vendor anlegen"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
