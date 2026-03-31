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
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
      return { label: "Freigegeben", color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2 };
    case "evaluated":
      return { label: "Bewertet", color: "bg-blue-50 text-blue-700 border-blue-200", icon: FileText };
    case "sent":
      return { label: "Versendet", color: "bg-amber-50 text-amber-700 border-amber-200", icon: Clock };
    case "rejected":
      return { label: "Abgelehnt", color: "bg-red-50 text-red-700 border-red-200", icon: AlertTriangle };
    default:
      return { label: "Nicht bewertet", color: "bg-gray-50 text-gray-500 border-gray-200", icon: Clock };
  }
}

function getRiskConfig(level: string | null) {
  switch (level) {
    case "high":   return { label: "Hoch", color: "bg-red-50 text-red-700 border-red-200" };
    case "medium": return { label: "Mittel", color: "bg-amber-50 text-amber-700 border-amber-200" };
    case "low":    return { label: "Niedrig", color: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    default:       return null;
  }
}

function formatDate(d: string | null) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch { return "—"; }
}

function VendorAvatar({ vendor }: { vendor: Vendor }) {
  const [imgError, setImgError] = useState(false);
  const domain = (() => {
    if (vendor.website) {
      try {
        const url = new URL(vendor.website.startsWith("http") ? vendor.website : `https://${vendor.website}`);
        return url.hostname;
      } catch { return null; }
    }
    return null;
  })();

  const src = vendor.logoUrl || (domain && !imgError ? `https://logo.clearbit.com/${domain}` : null);

  return (
    <div className="h-9 w-9 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0 border border-gray-200">
      {src && !imgError ? (
        <img src={src} alt={vendor.name} className="h-9 w-9 object-contain" onError={() => setImgError(true)} />
      ) : (
        <span className="text-sm font-semibold text-gray-500">
          {vendor.name.charAt(0).toUpperCase()}
        </span>
      )}
    </div>
  );
}

export default function VendorsPage() {
  const router = useRouter();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  // new field, part of creation form
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newVendor, setNewVendor] = useState({ name: "", category: "IT-Dienstleistung", services: "", website: "" });

  useEffect(() => { fetchVendors(); }, []);

  async function fetchVendors() {
    try {
      const res = await fetch("/api/vendors");
      if (res.ok) setVendors(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!newVendor.name.trim()) return;
    setCreating(true);
    try {
      // automatically compute a logo url based on the provided website if no logo
      // has been specified by the user.
      const payload: any = { ...newVendor };
      if (newVendor.website) {
        try {
          const url = new URL(
            newVendor.website.startsWith("http") ? newVendor.website : `https://${newVendor.website}`
          );
          const domain = url.hostname;
          payload.logoUrl = `https://logo.clearbit.com/${domain}`;
        } catch {
          // ignore invalid url
        }
      }

      const res = await fetch("/api/vendors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const created = await res.json();
        setShowCreateDialog(false);
        setNewVendor({ name: "", category: "IT-Dienstleistung", services: "", website: "" });
        router.push(`/vendors/${created.id}`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCreating(false);
    }
  }

  const filtered = useMemo(() => vendors.filter((v) => {
    if (search) {
      const q = search.toLowerCase();
      if (
        !v.name.toLowerCase().includes(q) &&
        !v.category.toLowerCase().includes(q) &&
        !v.services?.toLowerCase().includes(q) &&
        !v.contactName?.toLowerCase().includes(q)
      ) return false;
    }
    if (statusFilter !== "all" && v.assessmentStatus !== statusFilter) return false;
    if (categoryFilter !== "all" && v.category !== categoryFilter) return false;
    return true;
  }), [vendors, search, statusFilter, categoryFilter]);

  const stats = useMemo(() => ({
    total: vendors.length,
    approved: vendors.filter((v) => v.assessmentStatus === "approved").length,
    pending: vendors.filter((v) => v.assessmentStatus === "none" || v.assessmentStatus === "sent").length,
    gdpr: vendors.filter((v) => v.gdprCompliant).length,
  }), [vendors]);

  const uniqueCategories = useMemo(() => Array.from(new Set(vendors.map((v) => v.category))).sort(), [vendors]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#0066FF]" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lieferantenmanagement</h1>
          <p className="text-sm text-gray-500 mt-1">Drittanbieter verwalten und bewerten</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="bg-[#0066FF] hover:bg-blue-700 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Hinzufügen
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Gesamt", value: stats.total, icon: Store, iconBg: "bg-blue-50", iconColor: "text-[#0066FF]", valueColor: "text-gray-900" },
          { label: "Freigegeben", value: stats.approved, icon: Shield, iconBg: "bg-emerald-50", iconColor: "text-emerald-600", valueColor: "text-emerald-600" },
          { label: "Ausstehend", value: stats.pending, icon: Clock, iconBg: "bg-amber-50", iconColor: "text-amber-600", valueColor: "text-amber-600" },
          { label: "DSGVO-konform", value: stats.gdpr, icon: Globe, iconBg: "bg-purple-50", iconColor: "text-purple-600", valueColor: "text-purple-600" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{s.label}</p>
                <p className={cn("text-2xl font-bold mt-1", s.valueColor)}>{s.value}</p>
              </div>
              <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", s.iconBg)}>
                <s.icon className={cn("h-5 w-5", s.iconColor)} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Lieferant suchen..."
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
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Store className="h-12 w-12 mb-4 text-gray-200" />
            <p className="text-sm font-medium">
              {vendors.length === 0 ? "Noch keine Lieferanten angelegt" : "Keine Lieferanten gefunden"}
            </p>
            {vendors.length === 0 && (
              <button
                onClick={() => setShowCreateDialog(true)}
                className="mt-3 text-xs text-[#0066FF] hover:underline"
              >
                Ersten Lieferanten hinzufügen
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Lieferant</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Kategorie</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Fragebogen Status</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Risiko</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">DSGVO</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Verantwortlich</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Review Datum</th>
                  <th className="py-3 px-4 w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((vendor) => {
                  const statusCfg = getStatusConfig(vendor.assessmentStatus);
                  const StatusIcon = statusCfg.icon;
                  const riskCfg = getRiskConfig(vendor.riskLevel);

                  return (
                    <tr
                      key={vendor.id}
                      onClick={() => router.push(`/vendors/${vendor.id}`)}
                      className="hover:bg-gray-50/80 cursor-pointer transition-colors group"
                    >
                      {/* Lieferant */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <VendorAvatar vendor={vendor} />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{vendor.name}</p>
                            {vendor.services && (
                              <p className="text-xs text-gray-400 truncate max-w-[200px]">{vendor.services}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Kategorie */}
                      <td className="py-3.5 px-4">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
                          {vendor.category}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border", statusCfg.color)}>
                          <StatusIcon className="h-3 w-3" />
                          {statusCfg.label}
                        </div>
                      </td>

                      {/* Risiko */}
                      <td className="py-3.5 px-4">
                        {riskCfg ? (
                          <span className={cn("inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border", riskCfg.color)}>
                            {riskCfg.label}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>

                      {/* DSGVO */}
                      <td className="py-3.5 px-4">
                        {vendor.gdprCompliant === true ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        ) : vendor.gdprCompliant === false ? (
                          <AlertTriangle className="h-4 w-4 text-red-400" />
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>

                      {/* Verantwortlich */}
                      <td className="py-3.5 px-4">
                        <span className="text-sm text-gray-600">{vendor.contactName || <span className="text-gray-300">—</span>}</span>
                      </td>

                      {/* Review Datum */}
                      <td className="py-3.5 px-4">
                        <span className="text-xs text-gray-500">{formatDate(vendor.nextReviewDate)}</span>
                      </td>

                      {/* Arrow */}
                      <td className="py-3.5 px-4">
                        <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400">
              {filtered.length} von {vendors.length} Lieferanten
            </div>
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Neuen Lieferanten hinzufügen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="vendor-name">Name *</Label>
              <Input
                id="vendor-name"
                placeholder="z.B. Microsoft Azure"
                value={newVendor.name}
                onChange={(e) => setNewVendor((p) => ({ ...p, name: e.target.value }))}
                className="mt-1.5"
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              />
            </div>
            <div>
              <Label htmlFor="vendor-category">Kategorie</Label>
              <Select value={newVendor.category} onValueChange={(v) => setNewVendor((p) => ({ ...p, category: v }))}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="vendor-website">Website</Label>
              <div className="relative mt-1.5">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="vendor-website"
                  placeholder="https://example.com"
                  value={newVendor.website}
                  onChange={(e) => setNewVendor((p) => ({ ...p, website: e.target.value }))}
                  className="pl-9"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="vendor-services">Dienste / Beschreibung</Label>
              <Input
                id="vendor-services"
                placeholder="z.B. Cloud-Infrastruktur, SaaS-Plattform"
                value={newVendor.services}
                onChange={(e) => setNewVendor((p) => ({ ...p, services: e.target.value }))}
                className="mt-1.5"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Abbrechen</Button>
            <Button
              onClick={handleCreate}
              disabled={!newVendor.name.trim() || creating}
              className="bg-[#0066FF] hover:bg-blue-700 text-white"
            >
              {creating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Erstelle...</> : "Lieferant anlegen"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
