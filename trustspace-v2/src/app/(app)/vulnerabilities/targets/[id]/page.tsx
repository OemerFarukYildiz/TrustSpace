"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Globe,
  Server,
  Cloud,
  Box,
  Tag,
  Plus,
  Trash2,
  Loader2,
  Shield,
  Key,
  FileCode,
  Upload,
  X,
  CheckCircle2,
  AlertTriangle,
  Play,
  Lock,
  Cookie,
  FileText,
  ChevronRight,
  Wifi,
  Activity,
  Clock,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface IntruderTarget {
  id: string;
  address: string;
  display_address: string;
  target_type: "external" | "internal" | "cloud" | "container_image";
  target_status: "live" | "unscanned" | "unresponsive";
  tags: string[];
  license_type: "infrastructure" | "application" | null;
  has_api_schemas: boolean;
  has_authentications: boolean;
}

interface Authentication {
  id: number;
  name: string;
  type: string;
  url: string;
  enabled: boolean;
  login_url?: string;
  logout_url?: string;
  logged_in_indicator?: string;
  username_field?: string;
  password_field?: string;
  csrf_token_field?: string;
  headers?: { name: string; value: string }[];
  cookies?: { name: string; value: string }[];
}

interface ApiSchema {
  id: number;
  name: string;
  base_url: string;
  target_authentication_id?: number;
}

interface Issue {
  id: string;
  severity: string;
  title: string;
  description: string;
  cvss_score: number | null;
  exploit_likelihood: string;
  snoozed: boolean;
}

interface ServiceInfo {
  port: number;
  protocol: string;
  firstSeen: string;
  lastSeen: string;
}

interface ScanActivity {
  id: number;
  status: string;
  scan_type: string;
  schedule_period: string;
  created_at: string;
  start_time?: string;
  completed_time?: string;
  target_addresses?: string[];
}

interface ScanSchedule {
  id: number;
  name: string;
  schedule_period: string;
  next_scan_date: string;
  last_scan_start_time?: string;
  last_scan_end_time?: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const TYPE_ICONS: Record<string, React.ReactNode> = {
  external: <Globe className="h-5 w-5" />,
  internal: <Server className="h-5 w-5" />,
  cloud: <Cloud className="h-5 w-5" />,
  container_image: <Box className="h-5 w-5" />,
};

const STATUS_CFG: Record<string, { label: string; dot: string; cls: string }> = {
  live: { label: "Active", dot: "bg-emerald-500", cls: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  unscanned: { label: "Unscanned", dot: "bg-gray-400", cls: "text-gray-600 bg-gray-100 border-gray-200" },
  unresponsive: { label: "Unresponsive", dot: "bg-red-500", cls: "text-red-600 bg-red-50 border-red-200" },
};

const SEVERITY_CFG: Record<string, { label: string; cls: string; dot: string }> = {
  critical: { label: "Kritisch", cls: "bg-red-100 text-red-800 border-red-200", dot: "bg-red-500" },
  high: { label: "Hoch", cls: "bg-orange-100 text-orange-800 border-orange-200", dot: "bg-orange-500" },
  medium: { label: "Mittel", cls: "bg-amber-100 text-amber-800 border-amber-200", dot: "bg-amber-500" },
  low: { label: "Niedrig", cls: "bg-blue-100 text-blue-800 border-blue-200", dot: "bg-blue-500" },
};

const AUTH_TYPES = [
  { value: "oauth_client_credentials", label: "OAuth 2.0", description: "Token-basierte Authentifizierung via OAuth Server", icon: Lock },
  { value: "form", label: "Form-based Login", description: "Login-Formular mit Username & Password", icon: FileText },
  { value: "http", label: "HTTP Basic / Digest", description: "Standard HTTP Auth (Basic, Digest, NTLM)", icon: Key },
  { value: "http_header", label: "Header Authentication", description: "Custom HTTP Header (z.B. Bearer Token, API Key)", icon: Shield },
  { value: "session_cookie", label: "Session Cookie", description: "Session Cookie manuell setzen", icon: Cookie },
];

const TAG_COLORS = [
  "bg-blue-100 text-blue-700",
  "bg-violet-100 text-violet-700",
  "bg-teal-100 text-teal-700",
  "bg-amber-100 text-amber-700",
  "bg-pink-100 text-pink-700",
];

function tagColor(tag: string) {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length];
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function TargetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const targetId = params.id as string;

  const [target, setTarget] = useState<IntruderTarget | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"issues" | "auth" | "apis" | "services" | "activity">("issues");
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);

  // Issues
  const [issues, setIssues] = useState<Issue[]>([]);
  const [issuesLoading, setIssuesLoading] = useState(false);

  // Services (derived from occurrences)
  const [services, setServices] = useState<ServiceInfo[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);

  // Activity (scans for this target)
  const [scanActivity, setScanActivity] = useState<ScanActivity[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);

  // Schedules
  const [schedules, setSchedules] = useState<ScanSchedule[]>([]);

  // Last scan info
  const [lastScan, setLastScan] = useState<ScanActivity | null>(null);

  // Location
  const [location, setLocation] = useState<{ city: string; region: string; country: string } | null>(null);

  // Auth
  const [auths, setAuths] = useState<Authentication[]>([]);
  const [authsLoading, setAuthsLoading] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [authStep, setAuthStep] = useState<"type" | "details">("type");
  const [selectedAuthType, setSelectedAuthType] = useState("");
  const [authForm, setAuthForm] = useState({
    name: "",
    url: "",
    logout_url: "",
    logged_in_indicator: "",
    username: "",
    password: "",
    username_field: "",
    password_field: "",
    csrf_token_field: "",
    login_form_url: "",
    headerName: "",
    headerValue: "",
    cookieName: "",
    cookieValue: "",
    // OAuth
    oauth_token_url: "",
    oauth_client_id: "",
    oauth_client_secret: "",
  });
  const [authSubmitting, setAuthSubmitting] = useState(false);

  // API Schemas
  const [schemas, setSchemas] = useState<ApiSchema[]>([]);
  const [schemasLoading, setSchemasLoading] = useState(false);
  const [showSchemaDialog, setShowSchemaDialog] = useState(false);
  const [schemaForm, setSchemaForm] = useState({ name: "", base_url: "", authId: "" });
  const [schemaFile, setSchemaFile] = useState<File | null>(null);
  const [schemaSubmitting, setSchemaSubmitting] = useState(false);

  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [licenseError, setLicenseError] = useState<{ show: boolean; context: "auth" | "api" }>({ show: false, context: "auth" });

  function showToast(msg: string, type: "success" | "error" = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  function parseApiError(err: Record<string, unknown>): string {
    // License error
    const nfe = err?.non_field_errors;
    if (Array.isArray(nfe) && nfe.some((e: string) => e.toLowerCase().includes("license"))) {
      return "__LICENSE_ERROR__";
    }
    // Domain mismatch
    if (Array.isArray(nfe) && nfe.some((e: string) => e.toLowerCase().includes("domain"))) {
      return "Die URL muss zur Target-Domain passen";
    }
    // Field-specific errors
    if (Array.isArray(nfe)) return nfe.join(". ");
    // Generic
    const firstVal = Object.values(err).find(v => Array.isArray(v));
    if (Array.isArray(firstVal)) return (firstVal as string[]).join(". ");
    return JSON.stringify(err).slice(0, 120);
  }

  // ─── Fetch target from list ──────────────────────────────────────────────

  const fetchTarget = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/intruder/v1/targets/?limit=100");
      if (!res.ok) throw new Error();
      const data = await res.json();
      const found = (data.results ?? []).find(
        (t: IntruderTarget) => String(t.id) === targetId
      );
      setTarget(found || null);
    } catch {
      setTarget(null);
    } finally {
      setLoading(false);
    }
  }, [targetId]);

  // ─── Fetch issues for this target ────────────────────────────────────────

  const fetchIssues = useCallback(async () => {
    if (!target) return;
    setIssuesLoading(true);
    try {
      const addr = target.address;
      const res = await fetch(
        `/api/intruder/v1/issues/?target_addresses=${encodeURIComponent(addr)}&limit=50`
      );
      if (res.ok) {
        const data = await res.json();
        setIssues(data.results ?? []);
      }
    } catch { /* ignore */ }
    finally { setIssuesLoading(false); }
  }, [target]);

  // ─── Fetch authentications ───────────────────────────────────────────────

  const fetchAuths = useCallback(async () => {
    setAuthsLoading(true);
    try {
      const res = await fetch(`/api/intruder/v1/targets/${targetId}/authentications/`);
      if (res.ok) {
        const data = await res.json();
        setAuths(Array.isArray(data) ? data : data.results ?? []);
      }
    } catch { /* ignore */ }
    finally { setAuthsLoading(false); }
  }, [targetId]);

  // ─── Fetch API schemas ───────────────────────────────────────────────────

  const fetchSchemas = useCallback(async () => {
    setSchemasLoading(true);
    try {
      const res = await fetch(`/api/intruder/v1/targets/${targetId}/api_schemas/`);
      if (res.ok) {
        const data = await res.json();
        setSchemas(Array.isArray(data) ? data : data.results ?? []);
      }
    } catch { /* ignore */ }
    finally { setSchemasLoading(false); }
  }, [targetId]);

  // ─── Fetch services (ports from occurrences) ──────────────────────────

  const fetchServices = useCallback(async () => {
    if (!target) return;
    setServicesLoading(true);
    try {
      const res = await fetch(
        `/api/intruder/v1/issues/?target_addresses=${encodeURIComponent(target.address)}&limit=100`
      );
      if (!res.ok) return;
      const data = await res.json();
      const issueList: Issue[] = data.results ?? [];

      // Collect all occurrences to extract port/protocol
      const portMap = new Map<string, ServiceInfo>();
      await Promise.all(
        issueList.map(async (issue) => {
          try {
            const occRes = await fetch(
              `/api/intruder/v1/issues/${issue.id}/occurrences/?limit=50`
            );
            if (!occRes.ok) return;
            const occData = await occRes.json();
            const occs = Array.isArray(occData) ? occData : occData.results ?? [];
            for (const occ of occs) {
              if (occ.target === target.address && occ.port) {
                const key = `${occ.port}/${occ.protocol}`;
                const existing = portMap.get(key);
                if (!existing) {
                  portMap.set(key, {
                    port: occ.port,
                    protocol: occ.protocol || "tcp",
                    firstSeen: occ.first_seen_at,
                    lastSeen: occ.first_seen_at,
                  });
                } else {
                  if (occ.first_seen_at < existing.firstSeen) existing.firstSeen = occ.first_seen_at;
                  if (occ.first_seen_at > existing.lastSeen) existing.lastSeen = occ.first_seen_at;
                }
              }
            }
          } catch { /* ignore */ }
        })
      );
      setServices(Array.from(portMap.values()).sort((a, b) => a.port - b.port));
    } catch { /* ignore */ }
    finally { setServicesLoading(false); }
  }, [target]);

  // ─── Fetch scan activity ──────────────────────────────────────────────

  const fetchActivity = useCallback(async () => {
    if (!target) return;
    setActivityLoading(true);
    try {
      const res = await fetch(`/api/intruder/v1/scans/?limit=50`);
      if (!res.ok) return;
      const data = await res.json();
      const allScans: ScanActivity[] = data.results ?? [];
      // Filter scans that include this target
      const targetScans: ScanActivity[] = [];
      for (const scan of allScans) {
        // Fetch detail to see target_addresses
        try {
          const detailRes = await fetch(`/api/intruder/v1/scans/${scan.id}/`);
          if (detailRes.ok) {
            const detail = await detailRes.json();
            const addrs: string[] = detail.target_addresses ?? [];
            // Scan includes this target if target_addresses is empty (all targets) or contains the address
            if (addrs.length === 0 || addrs.includes(target.address)) {
              targetScans.push({ ...scan, ...detail });
            }
          }
        } catch { /* ignore */ }
      }
      setScanActivity(targetScans.slice(0, 20));
      // Set last completed scan
      const lastCompleted = targetScans.find((s) => s.status === "completed");
      if (lastCompleted) setLastScan(lastCompleted);
    } catch { /* ignore */ }
    finally { setActivityLoading(false); }
  }, [target]);

  // ─── Fetch schedules ──────────────────────────────────────────────────

  const fetchSchedules = useCallback(async () => {
    try {
      const res = await fetch(`/api/intruder/v1/scans/schedules/`);
      if (res.ok) {
        const data = await res.json();
        setSchedules(data.results ?? []);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchTarget(); fetchSchedules(); }, [fetchTarget, fetchSchedules]);

  // Fetch location via IP geolocation
  useEffect(() => {
    if (!target || target.target_type === "cloud") return;
    const addr = target.address;
    fetch(`http://ip-api.com/json/${addr}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.status === "success") {
          setLocation({ city: data.city, region: data.regionName, country: data.countryCode });
        }
      })
      .catch(() => {});
  }, [target]);

  // Always load issues when target is available (needed for Issues, Noise tabs + WAF banner + tab counts)
  useEffect(() => {
    if (target) fetchIssues();
  }, [target, fetchIssues]);

  useEffect(() => {
    if (target && activeTab === "auth") fetchAuths();
    if (target && activeTab === "apis") fetchSchemas();
    if (target && activeTab === "services") fetchServices();
    if (target && activeTab === "activity") fetchActivity();
  }, [target, activeTab, fetchAuths, fetchSchemas, fetchServices, fetchActivity]);

  // Fetch last scan on initial load
  useEffect(() => {
    if (target && !lastScan) fetchActivity();
  }, [target]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Add Authentication ──────────────────────────────────────────────────

  async function handleAddAuth() {
    if (!selectedAuthType || !authForm.url) return;
    setAuthSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        type: selectedAuthType,
        url: authForm.url,
        name: authForm.name || undefined,
        logout_url: authForm.logout_url || undefined,
        logged_in_indicator: authForm.logged_in_indicator || undefined,
      };

      if (selectedAuthType === "form") {
        body.username = authForm.username;
        body.password = authForm.password;
        body.username_field = authForm.username_field;
        body.password_field = authForm.password_field;
        body.login_url = authForm.login_form_url || authForm.url;
        body.csrf_token_field = authForm.csrf_token_field || undefined;
      } else if (selectedAuthType === "http") {
        body.username = authForm.username;
        body.password = authForm.password;
      } else if (selectedAuthType === "http_header") {
        if (authForm.headerName) {
          body.headers = [{ name: authForm.headerName, value: authForm.headerValue }];
        }
      } else if (selectedAuthType === "session_cookie") {
        if (authForm.cookieName) {
          body.cookies = [{ name: authForm.cookieName, value: authForm.cookieValue }];
        }
      } else if (selectedAuthType === "oauth_client_credentials") {
        body.login_url = authForm.oauth_token_url || undefined;
        body.username = authForm.oauth_client_id;
        body.password = authForm.oauth_client_secret;
      }

      const res = await fetch(`/api/intruder/v1/targets/${targetId}/authentications/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok || res.status === 201) {
        showToast("Authentifizierung hinzugefuegt");
        setShowAuthDialog(false);
        resetAuthForm();
        fetchAuths();
      } else {
        const err = await res.json().catch(() => ({}));
        const msg = parseApiError(err);
        if (msg === "__LICENSE_ERROR__") {
          setShowAuthDialog(false);
          setLicenseError({ show: true, context: "auth" });
        } else {
          showToast(msg, "error");
        }
      }
    } catch {
      showToast("Netzwerkfehler", "error");
    } finally {
      setAuthSubmitting(false);
    }
  }

  function resetAuthForm() {
    setAuthStep("type");
    setSelectedAuthType("");
    setAuthForm({
      name: "", url: "", logout_url: "", logged_in_indicator: "",
      username: "", password: "", username_field: "", password_field: "",
      csrf_token_field: "", login_form_url: "", headerName: "", headerValue: "",
      cookieName: "", cookieValue: "", oauth_token_url: "", oauth_client_id: "", oauth_client_secret: "",
    });
  }

  // ─── Delete Authentication ───────────────────────────────────────────────

  async function handleDeleteAuth(authId: number) {
    if (!confirm("Authentifizierung wirklich loeschen?")) return;
    try {
      const res = await fetch(`/api/intruder/v1/targets/${targetId}/authentications/${authId}/`, {
        method: "DELETE",
      });
      if (res.ok || res.status === 204) {
        showToast("Authentifizierung entfernt");
        fetchAuths();
      } else {
        showToast("Fehler beim Loeschen", "error");
      }
    } catch {
      showToast("Netzwerkfehler", "error");
    }
  }

  // ─── Add API Schema ──────────────────────────────────────────────────────

  async function handleAddSchema() {
    if (!schemaForm.name || !schemaForm.base_url || !schemaFile) return;
    setSchemaSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("name", schemaForm.name);
      formData.append("base_url", schemaForm.base_url);
      formData.append("file", schemaFile);
      if (schemaForm.authId && schemaForm.authId !== "none") {
        formData.append("target_authentication_id", schemaForm.authId);
      }

      const res = await fetch(`/api/intruder/v1/targets/${targetId}/api_schemas/`, {
        method: "POST",
        body: formData,
      });

      if (res.ok || res.status === 201) {
        showToast("API Schema hinzugefuegt");
        setShowSchemaDialog(false);
        setSchemaForm({ name: "", base_url: "", authId: "" });
        setSchemaFile(null);
        fetchSchemas();
      } else {
        const err = await res.json().catch(() => ({}));
        const msg = parseApiError(err);
        if (msg === "__LICENSE_ERROR__") {
          setShowSchemaDialog(false);
          setLicenseError({ show: true, context: "api" });
        } else {
          showToast(msg, "error");
        }
      }
    } catch {
      showToast("Netzwerkfehler", "error");
    } finally {
      setSchemaSubmitting(false);
    }
  }

  // ─── Delete API Schema ───────────────────────────────────────────────────

  async function handleDeleteSchema(schemaId: number) {
    if (!confirm("API Schema wirklich loeschen?")) return;
    try {
      const res = await fetch(`/api/intruder/v1/targets/${targetId}/api_schemas/${schemaId}/`, {
        method: "DELETE",
      });
      if (res.ok || res.status === 204) {
        showToast("API Schema entfernt");
        fetchSchemas();
      } else {
        showToast("Fehler beim Loeschen", "error");
      }
    } catch {
      showToast("Netzwerkfehler", "error");
    }
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#0066FF]" />
      </div>
    );
  }

  if (!target) {
    return (
      <div className="p-8">
        <Button variant="outline" onClick={() => router.push("/vulnerabilities/targets")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Zurueck
        </Button>
        <div className="flex flex-col items-center justify-center py-20">
          <AlertTriangle className="w-12 h-12 text-gray-300 mb-3" />
          <p className="text-gray-500">Target nicht gefunden</p>
        </div>
      </div>
    );
  }

  const status = STATUS_CFG[target.target_status] ?? STATUS_CFG.unscanned;

  const TABS = [
    { key: "issues" as const, label: "Issues", icon: AlertTriangle, count: issues.length },
    { key: "auth" as const, label: "Authentications", icon: Key, count: auths.length },
    { key: "apis" as const, label: "APIs", icon: FileCode, count: schemas.length },
    { key: "services" as const, label: "Services", icon: Wifi, count: services.length },
    { key: "activity" as const, label: "Activity", icon: Activity, count: scanActivity.length },
  ];

  return (
    <div className="p-8 space-y-6 bg-gray-50 min-h-screen">
      {/* Toast */}
      {toast && (
        <div className={cn(
          "fixed top-4 right-4 z-50 flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium shadow-lg transition-all",
          toast.type === "error" ? "bg-red-600 text-white" : "bg-gray-900 text-white"
        )}>
          {toast.type === "error" ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Back + Header */}
      <div>
        <button
          onClick={() => router.push("/vulnerabilities/targets")}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Targets
        </button>

        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-[#0066FF]/10 flex items-center justify-center text-[#0066FF]">
              {TYPE_ICONS[target.target_type] ?? <Globe className="h-5 w-5" />}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 font-mono">
                {target.display_address || target.address}
              </h1>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border", status.cls)}>
                  <span className={cn("w-1.5 h-1.5 rounded-full", status.dot)} />
                  {status.label}
                </span>
                {target.tags.map((tag) => (
                  <span key={tag} className={cn("text-xs font-medium px-2 py-0.5 rounded-full", tagColor(tag))}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <Button className="bg-[#0066FF] hover:bg-blue-700 text-white">
            <Play className="w-4 h-4 mr-2" />
            Scan starten
          </Button>
        </div>
      </div>

      {/* WAF Interference Banner */}
      {issues.some((i) => i.title.toLowerCase().includes("possible scan interference")) && (
        <div className="rounded-xl border border-purple-200 bg-purple-50 px-5 py-4 flex items-start gap-3">
          <div className="h-7 w-7 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Shield className="w-4 h-4 text-purple-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-purple-900">WAF Interference</p>
            <p className="text-xs text-purple-700 mt-0.5 leading-relaxed">
              Eine Web Application Firewall blockiert den Scanner.{" "}
              <a
                href="https://help.intruder.io/en/articles/1635683-why-do-i-need-to-add-ips-to-my-allowlist"
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-medium"
              >
                Intruder IPs zur Allowlist hinzufuegen
              </a>{" "}
              um vollstaendige Scan-Ergebnisse zu erhalten. Der Status wird beim naechsten Scan aktualisiert.
            </p>
          </div>
        </div>
      )}

      {/* Info Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {location && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1">Standort</p>
            <p className="text-sm font-medium text-gray-800">{location.city}, {location.region}, {location.country}</p>
          </div>
        )}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1">Lizenz</p>
          <p className="text-sm font-medium text-gray-800">
            {target.license_type === "application" ? "Application" : target.license_type === "infrastructure" ? "Infrastructure" : "Nicht zugewiesen"}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1">Letzter Scan</p>
          <p className="text-sm font-medium text-gray-800">
            {lastScan?.completed_time
              ? new Date(lastScan.completed_time).toLocaleString("de-DE", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
              : "—"}
          </p>
        </div>
        {schedules.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1">Geplante Scans</p>
            {schedules.map((s) => (
              <div key={s.id} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#0066FF]" />
                <span className="text-sm font-medium text-gray-800">{s.name}</span>
              </div>
            ))}
          </div>
        )}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1">Target Typ</p>
          <p className="text-sm font-medium text-gray-800 capitalize">{target.target_type}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-0">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors -mb-px",
                activeTab === tab.key
                  ? "border-[#0066FF] text-[#0066FF]"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.count > 0 && (
                <span className={cn(
                  "text-xs px-1.5 py-0.5 rounded-full",
                  activeTab === tab.key ? "bg-blue-100 text-[#0066FF]" : "bg-gray-100 text-gray-500"
                )}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Issues Tab ─────────────────────────────────────────────────────── */}
      {activeTab === "issues" && (
        <div className="flex gap-4">
          {/* Issues list */}
          <div className={cn("bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden", selectedIssue ? "flex-1" : "w-full")}>
            {issuesLoading ? (
              <div className="py-16 text-center">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#0066FF] mb-2" />
                <p className="text-xs text-gray-400">Lade Issues...</p>
              </div>
            ) : issues.length === 0 ? (
              <div className="py-16 text-center">
                <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-300 mb-3" />
                <p className="text-sm font-medium text-gray-500">Keine Issues gefunden</p>
                <p className="text-xs text-gray-400 mt-1">Dieses Target hat aktuell keine offenen Schwachstellen</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {issues.map((issue) => {
                  const sev = SEVERITY_CFG[issue.severity?.toLowerCase()] ?? { label: issue.severity, cls: "bg-gray-100 text-gray-700", dot: "bg-gray-400" };
                  const isSelected = selectedIssue?.id === issue.id;
                  return (
                    <div
                      key={issue.id}
                      onClick={() => router.push(`/vulnerabilities/issues?issue=${issue.id}`)}
                      className={cn(
                        "px-5 py-4 cursor-pointer transition-colors",
                        isSelected ? "bg-blue-50 border-l-2 border-l-[#0066FF]" : "hover:bg-gray-50/80"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0", sev.cls)}>
                          <span className={cn("w-1.5 h-1.5 rounded-full", sev.dot)} />
                          {sev.label}
                        </span>
                        <p className="text-sm font-medium text-gray-800 flex-1 truncate">{issue.title}</p>
                        {issue.cvss_score !== null && (
                          <span className="text-xs font-mono text-gray-500 flex-shrink-0">{issue.cvss_score.toFixed(1)}</span>
                        )}
                        <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Issue detail panel */}
          {selectedIssue && (
            <div className="w-[420px] flex-shrink-0 bg-white rounded-xl border border-gray-100 shadow-sm overflow-y-auto max-h-[600px]">
              <div className="px-5 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-bold text-gray-900 leading-snug">{selectedIssue.title}</h3>
                  <button onClick={() => setSelectedIssue(null)} className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 flex-shrink-0">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  {(() => {
                    const sev = SEVERITY_CFG[selectedIssue.severity?.toLowerCase()] ?? { label: selectedIssue.severity, cls: "bg-gray-100 text-gray-700", dot: "bg-gray-400" };
                    return (
                      <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full", sev.cls)}>
                        <span className={cn("w-1.5 h-1.5 rounded-full", sev.dot)} />
                        {sev.label}
                      </span>
                    );
                  })()}
                  {selectedIssue.cvss_score !== null && (
                    <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                      CVSS {selectedIssue.cvss_score.toFixed(1)}
                    </span>
                  )}
                  {selectedIssue.exploit_likelihood && (
                    <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-500 capitalize">
                      {selectedIssue.exploit_likelihood.replace("_", " ")}
                    </span>
                  )}
                </div>
              </div>
              <div className="px-5 py-4 space-y-4">
                {selectedIssue.description && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5">Beschreibung</p>
                    <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{selectedIssue.description}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── Authentications Tab ─────────────────────────────────────────────── */}
      {activeTab === "auth" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button
              onClick={() => {
                resetAuthForm();
                // Pre-fill URL with target address
                const addr = target?.address ?? "";
                const prefill = addr.includes("://") ? addr : `https://${addr}`;
                setAuthForm((f) => ({ ...f, url: prefill }));
                setShowAuthDialog(true);
              }}
              className="bg-[#0066FF] hover:bg-blue-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Authentication hinzufuegen
            </Button>
          </div>

          {authsLoading ? (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm py-16 text-center">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#0066FF] mb-2" />
              <p className="text-xs text-gray-400">Lade Authentifizierungen...</p>
            </div>
          ) : auths.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm py-16 text-center">
              <Key className="w-10 h-10 mx-auto text-gray-200 mb-3" />
              <p className="text-sm font-medium text-gray-500">Keine Authentifizierungen konfiguriert</p>
              <p className="text-xs text-gray-400 mt-1">
                Authentifizierung hinzufuegen um authentifiziertes Web App Scanning zu aktivieren
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {auths.map((auth) => {
                const typeInfo = AUTH_TYPES.find((t) => t.value === auth.type);
                const Icon = typeInfo?.icon ?? Key;
                return (
                  <div key={auth.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 flex-shrink-0">
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{auth.name || typeInfo?.label || auth.type}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{typeInfo?.label ?? auth.type}</p>
                          <p className="text-xs text-gray-400 font-mono mt-1">{auth.url}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "text-xs font-medium px-2 py-0.5 rounded-full",
                          auth.enabled ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"
                        )}>
                          {auth.enabled ? "Aktiv" : "Deaktiviert"}
                        </span>
                        <button
                          onClick={() => handleDeleteAuth(auth.id)}
                          className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── APIs Tab ────────────────────────────────────────────────────────── */}
      {activeTab === "apis" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button
              onClick={() => { setSchemaForm({ name: "", base_url: "", authId: "" }); setSchemaFile(null); setShowSchemaDialog(true); }}
              className="bg-[#0066FF] hover:bg-blue-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              API Schema hochladen
            </Button>
          </div>

          {schemasLoading ? (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm py-16 text-center">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#0066FF] mb-2" />
            </div>
          ) : schemas.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm py-16 text-center">
              <FileCode className="w-10 h-10 mx-auto text-gray-200 mb-3" />
              <p className="text-sm font-medium text-gray-500">Keine API Schemas konfiguriert</p>
              <p className="text-xs text-gray-400 mt-1">
                OpenAPI/Swagger Spec hochladen fuer gezieltes API-Scanning
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {schemas.map((schema) => (
                <div key={schema.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-lg bg-cyan-50 flex items-center justify-center text-cyan-600 flex-shrink-0">
                        <FileCode className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{schema.name}</p>
                        <p className="text-xs text-gray-400 font-mono mt-1">{schema.base_url}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteSchema(schema.id)}
                      className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── Services Tab ──────────────────────────────────────────────────── */}
      {activeTab === "services" && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <Wifi className="w-4 h-4 text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-800">Erkannte Services</h2>
            {!servicesLoading && services.length > 0 && (
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{services.length}</span>
            )}
          </div>

          {servicesLoading ? (
            <div className="py-16 text-center">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#0066FF] mb-2" />
              <p className="text-xs text-gray-400">Lade Services...</p>
            </div>
          ) : services.length === 0 ? (
            <div className="py-16 text-center">
              <Wifi className="w-10 h-10 mx-auto text-gray-200 mb-3" />
              <p className="text-sm font-medium text-gray-500">Keine Services erkannt</p>
              <p className="text-xs text-gray-400 mt-1">Services werden nach dem naechsten Scan angezeigt</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60 text-xs text-gray-500">
                  <th className="text-left py-3 px-6 font-semibold">Service</th>
                  <th className="text-left py-3 px-4 font-semibold">First Observed</th>
                  <th className="text-left py-3 px-4 font-semibold">Last Seen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {services.map((svc) => (
                  <tr key={`${svc.port}/${svc.protocol}`} className="hover:bg-gray-50/50">
                    <td className="py-3.5 px-6">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center">
                          <Wifi className="w-4 h-4 text-gray-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 font-mono">
                            {svc.port}/{svc.protocol}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-gray-500">
                      {new Date(svc.firstSeen).toLocaleDateString("de-DE", { day: "2-digit", month: "short", year: "numeric" })}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-gray-500">
                      {new Date(svc.lastSeen).toLocaleString("de-DE", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ─── Activity Tab ────────────────────────────────────────────────────── */}
      {activeTab === "activity" && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <Activity className="w-4 h-4 text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-800">Scan-Aktivitaet</h2>
          </div>

          {activityLoading ? (
            <div className="py-16 text-center">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#0066FF] mb-2" />
              <p className="text-xs text-gray-400">Lade Aktivitaet...</p>
            </div>
          ) : scanActivity.length === 0 ? (
            <div className="py-16 text-center">
              <Activity className="w-10 h-10 mx-auto text-gray-200 mb-3" />
              <p className="text-sm font-medium text-gray-500">Keine Scan-Aktivitaet</p>
              <p className="text-xs text-gray-400 mt-1">Starten Sie einen Scan um Aktivitaeten zu sehen</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {scanActivity.map((scan) => {
                const isCloud = scan.scan_type === "cloud_security";
                const duration = scan.start_time && scan.completed_time
                  ? Math.round((new Date(scan.completed_time).getTime() - new Date(scan.start_time).getTime()) / 60000)
                  : null;

                return (
                  <div key={scan.id} className="px-6 py-4">
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5",
                        scan.status === "completed" ? "bg-emerald-50 text-emerald-500" :
                        scan.status === "in_progress" ? "bg-blue-50 text-[#0066FF]" :
                        "bg-gray-100 text-gray-400"
                      )}>
                        {isCloud ? <Cloud className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900">
                            {isCloud ? "Cloud Security Scan" :
                             scan.schedule_period === "one_off" ? "One-off Scan" :
                             scan.schedule_period === "weekly" ? "Weekly Scan" :
                             scan.schedule_period === "monthly" ? "Monthly Scan" :
                             "Scan"}
                          </p>
                          <span className={cn(
                            "text-[10px] font-medium px-1.5 py-0.5 rounded-full",
                            scan.status === "completed" ? "bg-emerald-50 text-emerald-600" :
                            scan.status === "in_progress" ? "bg-blue-50 text-[#0066FF]" :
                            scan.status === "cancelled" ? "bg-red-50 text-red-500" :
                            "bg-gray-100 text-gray-500"
                          )}>
                            {scan.status === "completed" ? "Abgeschlossen" :
                             scan.status === "in_progress" ? "Laeuft..." :
                             scan.status === "cancelled" ? "Abgebrochen" :
                             scan.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(scan.created_at).toLocaleString("de-DE", {
                              day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
                            })}
                          </span>
                          {duration !== null && (
                            <span>
                              Dauer: {duration < 60 ? `${duration} Min` : `${Math.floor(duration / 60)}h ${duration % 60}m`}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── Add Authentication Dialog ───────────────────────────────────────── */}
      <Dialog open={showAuthDialog} onOpenChange={(v) => { if (!v) resetAuthForm(); setShowAuthDialog(v); }}>
        <DialogContent className="sm:max-w-[520px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="w-5 h-5 text-indigo-500" />
              Authentication hinzufuegen
            </DialogTitle>
            <p className="text-xs text-gray-500 font-mono mt-1">{target.address}</p>
          </DialogHeader>

          {/* Step indicator */}
          <div className="flex items-center gap-2 text-xs text-gray-400 pb-2">
            <span className={cn("font-semibold", authStep === "type" ? "text-[#0066FF]" : "text-gray-400")}>
              Typ
            </span>
            <span>{">"}</span>
            <span className={cn("font-semibold", authStep === "details" ? "text-[#0066FF]" : "text-gray-400")}>
              Details
            </span>
          </div>

          {/* Step 1: Choose type */}
          {authStep === "type" && (
            <div className="space-y-2">
              {AUTH_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => { setSelectedAuthType(t.value); setAuthStep("details"); }}
                  className={cn(
                    "w-full flex items-center gap-3 p-4 rounded-lg border text-left transition-all hover:border-[#0066FF] hover:bg-blue-50/30",
                    selectedAuthType === t.value ? "border-[#0066FF] bg-blue-50/30" : "border-gray-200"
                  )}
                >
                  <div className="h-9 w-9 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 flex-shrink-0">
                    <t.icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{t.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{t.description}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Step 2: Details form */}
          {authStep === "details" && (
            <div className="space-y-4">
              {/* Common fields */}
              <div>
                <Label className="text-xs">Name <span className="text-gray-400">(optional)</span></Label>
                <Input className="mt-1" placeholder="z.B. Staging Login" value={authForm.name}
                  onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Entrypoint URL <span className="text-red-500">*</span></Label>
                <Input className="mt-1 font-mono" placeholder="https://app.example.com/" value={authForm.url}
                  onChange={(e) => setAuthForm({ ...authForm, url: e.target.value })} />
                <p className="text-[10px] text-gray-400 mt-1">Muss zur Target-Domain passen (z.B. https://{target?.address}/...)</p>
              </div>
              <div>
                <Label className="text-xs">Logout URL <span className="text-gray-400">(optional)</span></Label>
                <Input className="mt-1 font-mono" placeholder="https://app.example.com/logout" value={authForm.logout_url}
                  onChange={(e) => setAuthForm({ ...authForm, logout_url: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Logged-in Indicator <span className="text-gray-400">(optional)</span></Label>
                <Input className="mt-1" placeholder='z.B. "Log out" oder "Dashboard"' value={authForm.logged_in_indicator}
                  onChange={(e) => setAuthForm({ ...authForm, logged_in_indicator: e.target.value })} />
                <p className="text-[10px] text-gray-400 mt-1">Text-Pattern das anzeigt dass der Scanner eingeloggt ist</p>
              </div>

              {/* Type-specific fields */}
              {(selectedAuthType === "form" || selectedAuthType === "http") && (
                <>
                  <div className="border-t border-gray-100 pt-4">
                    <p className="text-xs font-semibold text-gray-600 mb-3">Anmeldedaten</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Username <span className="text-red-500">*</span></Label>
                      <Input className="mt-1" value={authForm.username}
                        onChange={(e) => setAuthForm({ ...authForm, username: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-xs">Password <span className="text-red-500">*</span></Label>
                      <Input className="mt-1" type="password" value={authForm.password}
                        onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })} />
                    </div>
                  </div>
                  {selectedAuthType === "form" && (
                    <>
                      <div>
                        <Label className="text-xs">Login URL <span className="text-red-500">*</span></Label>
                        <Input className="mt-1 font-mono" placeholder="https://app.example.com/login" value={authForm.login_form_url}
                          onChange={(e) => setAuthForm({ ...authForm, login_form_url: e.target.value })} />
                        <p className="text-[10px] text-gray-400 mt-1">URL des Login-Formulars</p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">Username-Feld <span className="text-red-500">*</span></Label>
                          <Input className="mt-1 font-mono" placeholder='z.B. "email" oder "username"' value={authForm.username_field}
                            onChange={(e) => setAuthForm({ ...authForm, username_field: e.target.value })} />
                          <p className="text-[10px] text-gray-400 mt-1">Name des Input-Felds im HTML</p>
                        </div>
                        <div>
                          <Label className="text-xs">Password-Feld <span className="text-red-500">*</span></Label>
                          <Input className="mt-1 font-mono" placeholder='z.B. "password"' value={authForm.password_field}
                            onChange={(e) => setAuthForm({ ...authForm, password_field: e.target.value })} />
                          <p className="text-[10px] text-gray-400 mt-1">Name des Password-Felds im HTML</p>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs">CSRF Token Feld <span className="text-gray-400">(optional)</span></Label>
                        <Input className="mt-1 font-mono" placeholder='z.B. "_token" oder "csrf_token"' value={authForm.csrf_token_field}
                          onChange={(e) => setAuthForm({ ...authForm, csrf_token_field: e.target.value })} />
                      </div>
                    </>
                  )}
                </>
              )}

              {selectedAuthType === "http_header" && (
                <div className="border-t border-gray-100 pt-4 space-y-3">
                  <p className="text-xs font-semibold text-gray-600">HTTP Header</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Header Name <span className="text-red-500">*</span></Label>
                      <Input className="mt-1 font-mono" placeholder="Authorization" value={authForm.headerName}
                        onChange={(e) => setAuthForm({ ...authForm, headerName: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-xs">Header Value <span className="text-red-500">*</span></Label>
                      <Input className="mt-1 font-mono" placeholder="Bearer eyJhbG..." value={authForm.headerValue}
                        onChange={(e) => setAuthForm({ ...authForm, headerValue: e.target.value })} />
                    </div>
                  </div>
                </div>
              )}

              {selectedAuthType === "session_cookie" && (
                <div className="border-t border-gray-100 pt-4 space-y-3">
                  <p className="text-xs font-semibold text-gray-600">Session Cookie</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Cookie Name <span className="text-red-500">*</span></Label>
                      <Input className="mt-1 font-mono" placeholder="session_id" value={authForm.cookieName}
                        onChange={(e) => setAuthForm({ ...authForm, cookieName: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-xs">Cookie Value <span className="text-red-500">*</span></Label>
                      <Input className="mt-1 font-mono" placeholder="abc123..." value={authForm.cookieValue}
                        onChange={(e) => setAuthForm({ ...authForm, cookieValue: e.target.value })} />
                    </div>
                  </div>
                </div>
              )}

              {selectedAuthType === "oauth_client_credentials" && (
                <div className="border-t border-gray-100 pt-4 space-y-3">
                  <p className="text-xs font-semibold text-gray-600">OAuth 2.0 Client Credentials</p>
                  <div>
                    <Label className="text-xs">Token URL <span className="text-red-500">*</span></Label>
                    <Input className="mt-1 font-mono" placeholder="https://auth.example.com/oauth/token" value={authForm.oauth_token_url}
                      onChange={(e) => setAuthForm({ ...authForm, oauth_token_url: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Client ID <span className="text-red-500">*</span></Label>
                      <Input className="mt-1 font-mono" value={authForm.oauth_client_id}
                        onChange={(e) => setAuthForm({ ...authForm, oauth_client_id: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-xs">Client Secret <span className="text-red-500">*</span></Label>
                      <Input className="mt-1 font-mono" type="password" value={authForm.oauth_client_secret}
                        onChange={(e) => setAuthForm({ ...authForm, oauth_client_secret: e.target.value })} />
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-between pt-4 border-t border-gray-100">
                <Button variant="outline" onClick={() => setAuthStep("type")}>
                  Zurueck
                </Button>
                <Button
                  onClick={handleAddAuth}
                  disabled={!authForm.url || authSubmitting}
                  className="bg-[#0066FF] hover:bg-blue-700 text-white"
                >
                  {authSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                  Authentication anlegen
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── Add API Schema Dialog ───────────────────────────────────────────── */}
      <Dialog open={showSchemaDialog} onOpenChange={setShowSchemaDialog}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileCode className="w-5 h-5 text-cyan-500" />
              API Schema hochladen
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs">Name <span className="text-red-500">*</span></Label>
              <Input className="mt-1" placeholder="z.B. Main API v2" value={schemaForm.name}
                onChange={(e) => setSchemaForm({ ...schemaForm, name: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Base URL <span className="text-red-500">*</span></Label>
              <Input className="mt-1 font-mono" placeholder="https://api.example.com/v2" value={schemaForm.base_url}
                onChange={(e) => setSchemaForm({ ...schemaForm, base_url: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">OpenAPI / Swagger Datei <span className="text-red-500">*</span></Label>
              <div className="mt-1">
                <label className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-200 p-6 cursor-pointer hover:border-gray-300 transition-colors">
                  {schemaFile ? (
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="w-4 h-4 text-cyan-500" />
                      <span className="font-medium text-gray-700">{schemaFile.name}</span>
                      <button onClick={(e) => { e.preventDefault(); setSchemaFile(null); }} className="text-gray-400 hover:text-red-500">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-6 h-6 text-gray-400" />
                      <p className="text-xs text-gray-500">JSON oder YAML Datei auswaehlen</p>
                    </>
                  )}
                  <input
                    type="file"
                    accept=".json,.yaml,.yml"
                    className="hidden"
                    onChange={(e) => setSchemaFile(e.target.files?.[0] ?? null)}
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Auth linking */}
          {auths.length > 0 && (
            <div className="space-y-1">
              <Label className="text-xs">Authentication verknüpfen <span className="text-gray-400">(optional)</span></Label>
              <Select value={schemaForm.authId} onValueChange={(v) => setSchemaForm({ ...schemaForm, authId: v })}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Keine — ohne Authentifizierung scannen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Keine</SelectItem>
                  {auths.map((a) => (
                    <SelectItem key={a.id} value={String(a.id)}>
                      {a.name || a.type} — {a.url}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[10px] text-gray-400">Scanner nutzt diese Auth-Credentials beim API-Scanning</p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowSchemaDialog(false)}>Abbrechen</Button>
            <Button
              onClick={handleAddSchema}
              disabled={!schemaForm.name || !schemaForm.base_url || !schemaFile || schemaSubmitting}
              className="bg-[#0066FF] hover:bg-blue-700 text-white"
            >
              {schemaSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
              Hochladen
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── License Error Dialog ────────────────────────────────────────────── */}
      <Dialog open={licenseError.show} onOpenChange={(v) => setLicenseError((p) => ({ ...p, show: v }))}>
        <DialogContent className="sm:max-w-[480px]">
          <div className="flex flex-col items-center text-center py-4">
            {/* Icon */}
            <div className="h-16 w-16 rounded-2xl bg-amber-50 flex items-center justify-center mb-5">
              <AlertTriangle className="h-8 w-8 text-amber-500" />
            </div>

            {/* Title */}
            <h2 className="text-lg font-bold text-gray-900 mb-2">
              Application License erforderlich
            </h2>

            {/* Description */}
            <p className="text-sm text-gray-500 leading-relaxed max-w-sm mb-6">
              {licenseError.context === "auth"
                ? "Um authentifizierte Scans fuer Web-Applikationen zu konfigurieren, wird eine Application License benoetigt. Die Lizenz wird fuer 30 Tage an dieses Target gebunden."
                : "Um API Schemas hochzuladen und gezieltes API-Scanning zu aktivieren, wird eine Application License benoetigt."
              }
            </p>

            {/* License info */}
            <div className="w-full rounded-xl border border-gray-200 bg-gray-50 p-4 mb-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Aktuelle Lizenzen</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-white border border-gray-100 p-3 text-center">
                  <p className="text-xs text-gray-500">Infrastructure</p>
                  <p className="text-lg font-bold text-gray-900 mt-0.5">4 frei</p>
                </div>
                <div className="rounded-lg bg-white border border-amber-200 p-3 text-center">
                  <p className="text-xs text-amber-600 font-medium">Application</p>
                  <p className="text-lg font-bold text-amber-600 mt-0.5">0 frei</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 w-full">
              <a
                href="https://portal.intruder.io"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 w-full h-10 rounded-lg bg-[#0066FF] hover:bg-blue-700 text-white text-sm font-medium transition-colors"
              >
                Lizenz im Intruder Portal hinzufuegen
                <ChevronRight className="w-4 h-4" />
              </a>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setLicenseError((p) => ({ ...p, show: false }))}
              >
                Schliessen
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
