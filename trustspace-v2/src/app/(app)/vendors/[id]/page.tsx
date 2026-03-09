"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Globe,
  Mail,
  Phone,
  User,
  Shield,
  Calendar,
  FileText,
  Upload,
  MessageSquare,
  Send,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Trash2,
  Download,
  MapPin,
  Users,
  Link as LinkIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileUpload } from "@/components/ui/file-upload";

interface Vendor {
  id: string;
  name: string;
  category: string;
  services: string | null;
  assessmentStatus: string;
  gdprCompliant: boolean | null;
  trustCenterUrl: string | null;
  certifications: string | null;
  dpoContact: string | null;
  logoUrl: string | null;
  website: string | null;
  address: string | null;
  country: string | null;
  employeeCount: string | null;
  foundedYear: number | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  dataProcessingAgreement: boolean;
  subProcessors: string | null;
  riskLevel: string | null;
  description: string | null;
  lastReviewDate: string | null;
  nextReviewDate: string | null;
  createdAt: string;
  assessments: Assessment[];
  vendorDocuments: VendorDocument[];
  vendorComments: VendorComment[];
}

interface Assessment {
  id: string;
  score: number | null;
  status: string;
  createdAt: string;
}

interface VendorDocument {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  category: string;
  description: string | null;
  createdAt: string;
}

interface VendorComment {
  id: string;
  content: string;
  authorId: string | null;
  createdAt: string;
}

type TabId = "info" | "reviews" | "documents" | "comments";

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "info", label: "Allgemeine Infos", icon: Building2 },
  { id: "reviews", label: "Reviews", icon: Shield },
  { id: "documents", label: "Dokumente", icon: FileText },
  { id: "comments", label: "Kommentare", icon: MessageSquare },
];

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

const DOC_CATEGORIES: Record<string, string> = {
  contract: "Vertrag",
  questionnaire: "Fragebogen",
  certificate: "Zertifikat",
  dpa: "AVV",
  other: "Sonstiges",
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

function formatDateInput(dateStr: string | null): string {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toISOString().split("T")[0];
  } catch {
    return "";
  }
}

function formatFileSize(bytes: number): string {
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  if (bytes >= 1_000) return `${(bytes / 1_000).toFixed(0)} KB`;
  return `${bytes} B`;
}

export default function VendorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const vendorId = params.id as string;

  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>("info");
  const [saving, setSaving] = useState(false);
  const [autoFilling, setAutoFilling] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [sendingComment, setSendingComment] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [docCategory, setDocCategory] = useState("other");

  // Editable fields
  const [form, setForm] = useState({
    name: "",
    category: "",
    services: "",
    website: "",
    address: "",
    country: "",
    employeeCount: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    description: "",
    certifications: "",
    trustCenterUrl: "",
    dpoContact: "",
    gdprCompliant: null as boolean | null,
    dataProcessingAgreement: false,
    riskLevel: "",
    assessmentStatus: "",
    lastReviewDate: "",
    nextReviewDate: "",
  });

  const fetchVendor = useCallback(async () => {
    try {
      const res = await fetch(`/api/vendors/${vendorId}`);
      if (res.ok) {
        const data = await res.json();
        setVendor(data);
        setForm({
          name: data.name || "",
          category: data.category || "",
          services: data.services || "",
          website: data.website || "",
          address: data.address || "",
          country: data.country || "",
          employeeCount: data.employeeCount || "",
          contactName: data.contactName || "",
          contactEmail: data.contactEmail || "",
          contactPhone: data.contactPhone || "",
          description: data.description || "",
          certifications: data.certifications || "",
          trustCenterUrl: data.trustCenterUrl || "",
          dpoContact: data.dpoContact || "",
          gdprCompliant: data.gdprCompliant,
          dataProcessingAgreement: data.dataProcessingAgreement || false,
          riskLevel: data.riskLevel || "",
          assessmentStatus: data.assessmentStatus || "none",
          lastReviewDate: formatDateInput(data.lastReviewDate),
          nextReviewDate: formatDateInput(data.nextReviewDate),
        });
      } else {
        router.push("/vendors");
      }
    } catch {
      router.push("/vendors");
    } finally {
      setLoading(false);
    }
  }, [vendorId, router]);

  useEffect(() => {
    fetchVendor();
  }, [fetchVendor]);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/vendors/${vendorId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          lastReviewDate: form.lastReviewDate || null,
          nextReviewDate: form.nextReviewDate || null,
          riskLevel: form.riskLevel || null,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setVendor((prev) => (prev ? { ...prev, ...data } : prev));
      }
    } catch (error) {
      console.error("Failed to save:", error);
    } finally {
      setSaving(false);
    }
  }

  async function handleAutoFill() {
    if (!form.name.trim()) return;
    setAutoFilling(true);
    try {
      const res = await fetch(`/api/vendors/${vendorId}/autofill`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendorName: form.name }),
      });
      if (res.ok) {
        const data = await res.json();
        setForm((prev) => ({
          ...prev,
          website: data.website || prev.website,
          address: data.address || prev.address,
          country: data.country || prev.country,
          certifications:
            data.certifications?.join(", ") || prev.certifications,
          gdprCompliant: data.gdprCompliant ?? prev.gdprCompliant,
          employeeCount: data.employeeCount || prev.employeeCount,
        }));

        // Try to fetch logo
        if (data.website) {
          try {
            const domain = new URL(
              data.website.startsWith("http")
                ? data.website
                : `https://${data.website}`
            ).hostname;
            const logoRes = await fetch(`/api/vendors/${vendorId}/logo`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ domain }),
            });
            if (logoRes.ok) {
              const logoData = await logoRes.json();
              if (logoData.logo) {
                await fetch(`/api/vendors/${vendorId}`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ logoUrl: logoData.logo }),
                });
                setVendor((prev) =>
                  prev ? { ...prev, logoUrl: logoData.logo } : prev
                );
              }
            }
          } catch {
            // Logo fetch failed, that's ok
          }
        }
      }
    } catch (error) {
      console.error("Auto-fill failed:", error);
    } finally {
      setAutoFilling(false);
    }
  }

  async function handleUploadDocument(file: File) {
    setUploadingDoc(true);
    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1] || result);
        };
        reader.readAsDataURL(file);
      });
      const fileData = await base64Promise;

      const res = await fetch(`/api/vendors/${vendorId}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.name.split(".").pop() || "unknown",
          fileData,
          mimeType: file.type,
          fileSize: file.size,
          category: docCategory,
        }),
      });
      if (res.ok) {
        fetchVendor();
      }
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setUploadingDoc(false);
    }
  }

  async function handleAddComment() {
    if (!newComment.trim()) return;
    setSendingComment(true);
    try {
      const res = await fetch(`/api/vendors/${vendorId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment }),
      });
      if (res.ok) {
        setNewComment("");
        fetchVendor();
      }
    } catch (error) {
      console.error("Comment failed:", error);
    } finally {
      setSendingComment(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-6 w-32 bg-gray-200 rounded" />
          <div className="h-10 w-64 bg-gray-200 rounded" />
          <div className="h-96 bg-gray-100 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!vendor) return null;

  const logoDomain = vendor.website
    ? (() => {
        try {
          return new URL(
            vendor.website.startsWith("http")
              ? vendor.website
              : `https://${vendor.website}`
          ).hostname;
        } catch {
          return null;
        }
      })()
    : null;

  return (
    <div className="p-8 space-y-6 max-w-6xl">
      {/* Back + Header */}
      <button
        onClick={() => router.push("/vendors")}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Zurück zur Übersicht
      </button>

      <div className="flex items-start gap-4">
        {/* Logo */}
        <div className="h-14 w-14 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0 border border-gray-200">
          {vendor.logoUrl ? (
            <img
              src={vendor.logoUrl}
              alt={vendor.name}
              className="h-14 w-14 object-contain"
            />
          ) : logoDomain ? (
            <img
              src={`https://logo.clearbit.com/${logoDomain}`}
              alt={vendor.name}
              className="h-14 w-14 object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <span className="text-xl font-bold text-gray-400">
              {vendor.name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-gray-900">{vendor.name}</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-sm text-gray-500">{vendor.category}</span>
            {vendor.website && (
              <a
                href={
                  vendor.website.startsWith("http")
                    ? vendor.website
                    : `https://${vendor.website}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-[#0066FF] hover:underline flex items-center gap-1"
              >
                <ExternalLink className="h-3 w-3" />
                Website
              </a>
            )}
          </div>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-[#0066FF] hover:bg-[#0052cc] text-white"
        >
          {saving ? "Speichern..." : "Speichern"}
        </Button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-0">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const count =
              tab.id === "documents"
                ? vendor.vendorDocuments?.length || 0
                : tab.id === "comments"
                  ? vendor.vendorComments?.length || 0
                  : null;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors",
                  activeTab === tab.id
                    ? "text-[#0066FF] border-[#0066FF]"
                    : "text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300"
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
                {count !== null && count > 0 && (
                  <span className="ml-1 text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "info" && (
        <div className="space-y-6">
          {/* Auto-Fill Banner */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-[#0066FF]/10 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-[#0066FF]" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  KI Auto-Fill
                </p>
                <p className="text-xs text-gray-500">
                  Firmendaten automatisch aus öffentlichen Quellen abrufen
                </p>
              </div>
            </div>
            <Button
              onClick={handleAutoFill}
              disabled={autoFilling || !form.name.trim()}
              variant="outline"
              className="border-[#0066FF]/30 text-[#0066FF] hover:bg-[#0066FF]/5"
            >
              {autoFilling ? (
                <>
                  <div className="h-3.5 w-3.5 mr-2 border-2 border-[#0066FF]/30 border-t-[#0066FF] rounded-full animate-spin" />
                  Suche läuft...
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5 mr-2" />
                  Daten abrufen
                </>
              )}
            </Button>
          </div>

          {/* Company Info Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Firmendaten */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                <Building2 className="h-4 w-4 text-gray-400" />
                Firmendaten
              </h3>

              <div className="space-y-4">
                <div>
                  <Label className="text-xs text-gray-500">Name</Label>
                  <Input
                    value={form.name}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, name: e.target.value }))
                    }
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-gray-500">Kategorie</Label>
                    <Select
                      value={form.category}
                      onValueChange={(v) =>
                        setForm((p) => ({ ...p, category: v }))
                      }
                    >
                      <SelectTrigger className="mt-1">
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
                    <Label className="text-xs text-gray-500">
                      Mitarbeiterzahl
                    </Label>
                    <Select
                      value={form.employeeCount || "unknown"}
                      onValueChange={(v) =>
                        setForm((p) => ({
                          ...p,
                          employeeCount: v === "unknown" ? "" : v,
                        }))
                      }
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unknown">Unbekannt</SelectItem>
                        <SelectItem value="1-10">1-10</SelectItem>
                        <SelectItem value="11-50">11-50</SelectItem>
                        <SelectItem value="51-200">51-200</SelectItem>
                        <SelectItem value="201-1000">201-1.000</SelectItem>
                        <SelectItem value="1001-5000">1.001-5.000</SelectItem>
                        <SelectItem value="5000+">5.000+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-gray-500">Website</Label>
                  <div className="relative mt-1">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      value={form.website}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, website: e.target.value }))
                      }
                      placeholder="https://example.com"
                      className="pl-9"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-gray-500">Adresse</Label>
                  <div className="relative mt-1">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      value={form.address}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, address: e.target.value }))
                      }
                      className="pl-9"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-gray-500">Land</Label>
                  <Input
                    value={form.country}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, country: e.target.value }))
                    }
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label className="text-xs text-gray-500">
                    Dienste / Beschreibung
                  </Label>
                  <Textarea
                    value={form.services}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, services: e.target.value }))
                    }
                    rows={2}
                    className="mt-1 resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Right Column - Kontakt & Compliance */}
            <div className="space-y-6">
              {/* Kontakt */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-400" />
                  Ansprechpartner
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label className="text-xs text-gray-500">Name</Label>
                    <div className="relative mt-1">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        value={form.contactName}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            contactName: e.target.value,
                          }))
                        }
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-gray-500">E-Mail</Label>
                      <div className="relative mt-1">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          value={form.contactEmail}
                          onChange={(e) =>
                            setForm((p) => ({
                              ...p,
                              contactEmail: e.target.value,
                            }))
                          }
                          type="email"
                          className="pl-9"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Telefon</Label>
                      <div className="relative mt-1">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          value={form.contactPhone}
                          onChange={(e) =>
                            setForm((p) => ({
                              ...p,
                              contactPhone: e.target.value,
                            }))
                          }
                          className="pl-9"
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">
                      Datenschutzbeauftragter
                    </Label>
                    <Input
                      value={form.dpoContact}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, dpoContact: e.target.value }))
                      }
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Compliance & Bewertung */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                  <Shield className="h-4 w-4 text-gray-400" />
                  Compliance & Bewertung
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-gray-500">Status</Label>
                      <Select
                        value={form.assessmentStatus}
                        onValueChange={(v) =>
                          setForm((p) => ({ ...p, assessmentStatus: v }))
                        }
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Nicht bewertet</SelectItem>
                          <SelectItem value="sent">Versendet</SelectItem>
                          <SelectItem value="evaluated">Bewertet</SelectItem>
                          <SelectItem value="approved">Freigegeben</SelectItem>
                          <SelectItem value="rejected">Abgelehnt</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">
                        Risikolevel
                      </Label>
                      <Select
                        value={form.riskLevel || "none"}
                        onValueChange={(v) =>
                          setForm((p) => ({
                            ...p,
                            riskLevel: v === "none" ? "" : v,
                          }))
                        }
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Nicht bewertet</SelectItem>
                          <SelectItem value="low">Niedrig</SelectItem>
                          <SelectItem value="medium">Mittel</SelectItem>
                          <SelectItem value="high">Hoch</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs text-gray-500">
                      Zertifizierungen
                    </Label>
                    <Input
                      value={form.certifications}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          certifications: e.target.value,
                        }))
                      }
                      placeholder="ISO 27001, SOC 2, ..."
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-xs text-gray-500">
                      Trust Center URL
                    </Label>
                    <div className="relative mt-1">
                      <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        value={form.trustCenterUrl}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            trustCenterUrl: e.target.value,
                          }))
                        }
                        className="pl-9"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.gdprCompliant === true}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            gdprCompliant: e.target.checked,
                          }))
                        }
                        className="h-4 w-4 rounded border-gray-300 text-[#0066FF] focus:ring-[#0066FF]"
                      />
                      <span className="text-sm text-gray-700">
                        DSGVO-konform
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.dataProcessingAgreement}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            dataProcessingAgreement: e.target.checked,
                          }))
                        }
                        className="h-4 w-4 rounded border-gray-300 text-[#0066FF] focus:ring-[#0066FF]"
                      />
                      <span className="text-sm text-gray-700">
                        AVV vorhanden
                      </span>
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-gray-500">
                        Letztes Review
                      </Label>
                      <Input
                        type="date"
                        value={form.lastReviewDate}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            lastReviewDate: e.target.value,
                          }))
                        }
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">
                        Nächstes Review
                      </Label>
                      <Input
                        type="date"
                        value={form.nextReviewDate}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            nextReviewDate: e.target.value,
                          }))
                        }
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "reviews" && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
              Assessment-Verlauf
            </h3>
            {vendor.assessments && vendor.assessments.length > 0 ? (
              <div className="space-y-3">
                {vendor.assessments.map((assessment) => (
                  <div
                    key={assessment.id}
                    className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "h-8 w-8 rounded-lg flex items-center justify-center",
                          assessment.status === "approved"
                            ? "bg-emerald-50"
                            : assessment.status === "evaluated"
                              ? "bg-blue-50"
                              : "bg-gray-50"
                        )}
                      >
                        {assessment.status === "approved" ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        ) : assessment.status === "evaluated" ? (
                          <Shield className="h-4 w-4 text-blue-600" />
                        ) : (
                          <Clock className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {assessment.status === "approved"
                            ? "Freigegeben"
                            : assessment.status === "evaluated"
                              ? "Bewertet"
                              : "Ausstehend"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(assessment.createdAt)}
                        </p>
                      </div>
                    </div>
                    {assessment.score !== null && (
                      <div
                        className={cn(
                          "text-lg font-bold",
                          assessment.score >= 80
                            ? "text-emerald-600"
                            : assessment.score >= 50
                              ? "text-amber-600"
                              : "text-red-600"
                        )}
                      >
                        {assessment.score}%
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Shield className="h-10 w-10 mx-auto mb-3 text-gray-300" />
                <p className="text-sm text-gray-500">
                  Noch keine Assessments durchgeführt
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Starten Sie eine Bewertung, um die Compliance zu prüfen
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "documents" && (
        <div className="space-y-4">
          {/* Upload */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
                Dokument hochladen
              </h3>
              <Select value={docCategory} onValueChange={setDocCategory}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(DOC_CATEGORIES).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <FileUpload
              accept=".pdf,.doc,.docx,.xlsx,.xls,.csv,.png,.jpg,.jpeg"
              maxSize={10_000_000}
              onUpload={handleUploadDocument}
            />
            {uploadingDoc && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <div className="h-4 w-4 border-2 border-gray-300 border-t-[#0066FF] rounded-full animate-spin" />
                Wird hochgeladen...
              </div>
            )}
          </div>

          {/* Document List */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
              Hochgeladene Dokumente
            </h3>
            {vendor.vendorDocuments && vendor.vendorDocuments.length > 0 ? (
              <div className="space-y-2">
                {vendor.vendorDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between py-3 px-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center">
                        <FileText className="h-4 w-4 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {doc.fileName}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Badge
                            variant="outline"
                            className="text-xs px-1.5 py-0"
                          >
                            {DOC_CATEGORIES[doc.category] || doc.category}
                          </Badge>
                          <span>{formatFileSize(doc.fileSize)}</span>
                          <span>{formatDate(doc.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="h-10 w-10 mx-auto mb-3 text-gray-300" />
                <p className="text-sm text-gray-500">
                  Noch keine Dokumente hochgeladen
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Laden Sie Verträge, AVV oder Zertifikate hoch
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "comments" && (
        <div className="space-y-4">
          {/* New Comment */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
              Kommentar hinzufügen
            </h3>
            <div className="flex gap-3">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Kommentar schreiben..."
                rows={3}
                className="flex-1 resize-none"
              />
            </div>
            <div className="flex justify-end mt-3">
              <Button
                onClick={handleAddComment}
                disabled={!newComment.trim() || sendingComment}
                size="sm"
                className="bg-[#0066FF] hover:bg-[#0052cc] text-white"
              >
                {sendingComment ? (
                  "Sende..."
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5 mr-1.5" />
                    Kommentar senden
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Comments List */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
              Kommentare
            </h3>
            {vendor.vendorComments && vendor.vendorComments.length > 0 ? (
              <div className="space-y-4">
                {vendor.vendorComments.map((comment) => (
                  <div
                    key={comment.id}
                    className="py-3 border-b border-gray-100 last:border-0"
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center">
                        <User className="h-3 w-3 text-gray-500" />
                      </div>
                      <span className="text-xs font-medium text-gray-700">
                        {comment.authorId || "System"}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatDate(comment.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 ml-8 whitespace-pre-wrap">
                      {comment.content}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <MessageSquare className="h-10 w-10 mx-auto mb-3 text-gray-300" />
                <p className="text-sm text-gray-500">Noch keine Kommentare</p>
                <p className="text-xs text-gray-400 mt-1">
                  Fügen Sie Notizen oder Kommentare zu diesem Vendor hinzu
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
