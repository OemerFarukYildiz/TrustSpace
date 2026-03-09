"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronRight, Save, FileText, Plus, X, Calendar, Trash2 } from "lucide-react";
import { format } from "date-fns";

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

interface Audit {
  id: string;
  title: string;
  plannedDate: string;
  actualDate?: string;
  type: string;
  status: "open" | "close";
  description?: string;
  documents?: string;
  recurring?: string;
  seriesId?: string;
  owners: { id: string; employeeId: string; employee: Employee }[];
}

const auditTypes = ["Internal Audit", "External Audit", "Certification", "Review"];

export default function AuditDetailPage() {
  const params = useParams();
  const router = useRouter();
  const auditId = params.id as string;
  const isNew = auditId === "new";
  
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  const [audit, setAudit] = useState<Partial<Audit>>({
    title: "",
    plannedDate: new Date().toISOString(),
    type: "Internal Audit",
    status: "open",
    description: "",
    recurring: "none",
    owners: [],
  });

  const [newDocument, setNewDocument] = useState("");
  const [documents, setDocuments] = useState<string[]>([]);

  // Load employees and audit data
  useEffect(() => {
    async function loadData() {
      try {
        // Load employees
        const empRes = await fetch("/api/employees");
        if (empRes.ok) {
          const empData = await empRes.json();
          setEmployees(empData);
        }

        // Load audit if editing
        if (!isNew) {
          const auditRes = await fetch(`/api/audits/${auditId}`);
          if (auditRes.ok) {
            const auditData = await auditRes.json();
            setAudit(auditData);
            if (auditData.documents) {
              try {
                setDocuments(JSON.parse(auditData.documents));
              } catch {
                setDocuments([]);
              }
            }
          }
        }
      } catch (error) {
        console.error("Failed to load data:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [auditId, isNew]);

  const year = audit.plannedDate ? new Date(audit.plannedDate).getFullYear() : new Date().getFullYear();

  const deleteAudit = async (deleteSeries: boolean) => {
    try {
      const url = `/api/audits/${auditId}${deleteSeries ? "?deleteSeries=true" : ""}`;
      await fetch(url, { method: "DELETE" });
      router.push("/audits");
    } catch (error) {
      console.error("Failed to delete audit:", error);
    }
  };

  const saveAudit = async () => {
    if (!audit.title) return;
    setSaveError(null);
    setSaving(true);
    try {
      const ownerIds = audit.owners?.map(o => o.employeeId) || [];
      const payload = {
        title: audit.title,
        type: audit.type || "Internal Audit",
        plannedDate: audit.plannedDate || new Date().toISOString(),
        actualDate: audit.actualDate || null,
        description: audit.description || null,
        status: audit.status || "open",
        ownerIds,
        documents,
        recurring: audit.recurring || "none",
      };

      const url = isNew ? "/api/audits" : `/api/audits/${auditId}`;
      const method = isNew ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        router.push("/audits");
      } else {
        const errData = await res.json().catch(() => ({ error: "Unbekannter Fehler" }));
        setSaveError(errData.error || errData.details || "Speichern fehlgeschlagen");
      }
    } catch (error) {
      setSaveError((error as Error).message || "Netzwerkfehler");
    } finally {
      setSaving(false);
    }
  };

  const addOwner = (employeeId: string) => {
    const employee = employees.find(e => e.id === employeeId);
    if (employee && !audit.owners?.some(o => o.employeeId === employeeId)) {
      setAudit({ 
        ...audit, 
        owners: [...(audit.owners || []), { id: "", employeeId, employee }] 
      });
    }
  };

  const removeOwner = (employeeId: string) => {
    setAudit({ 
      ...audit, 
      owners: audit.owners?.filter(o => o.employeeId !== employeeId) || [] 
    });
  };

  const addDocument = () => {
    if (newDocument) {
      setDocuments([...documents, newDocument]);
      setNewDocument("");
    }
  };

  const removeDocument = (doc: string) => {
    setDocuments(documents.filter(d => d !== doc));
  };

  const getEmployeeInitials = (emp: Employee) => {
    return `${emp.firstName.charAt(0)}${emp.lastName.charAt(0)}`.toUpperCase();
  };

  // Available employees (not already owners)
  const ownerIds = audit.owners?.map(o => o.employeeId) || [];
  const availableEmployees = employees.filter(e => !ownerIds.includes(e.id));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0066FF]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link href="/audits" className="text-blue-600 hover:underline">
          {year}
        </Link>
        <ChevronRight className="w-4 h-4 text-gray-400" />
        <span className="text-gray-900 font-medium">{audit.title || "New Audit"}</span>
      </div>

      {/* Form */}
      <Card>
        <CardContent className="p-6 space-y-6">
          {/* Title & Owners Row */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <Label htmlFor="title" className="text-sm text-gray-500">Title</Label>
              <Input 
                id="title"
                value={audit.title || ""}
                onChange={(e) => setAudit({ ...audit, title: e.target.value })}
                placeholder="Audit title"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm text-gray-500">Owners</Label>
              <div className="flex flex-wrap gap-2 mt-2 items-center">
                {audit.owners?.map((owner) => (
                  <div key={owner.employeeId} className="flex items-center gap-1 bg-gray-100 rounded-full px-3 py-1">
                    <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-medium">
                      {getEmployeeInitials(owner.employee)}
                    </div>
                    <span className="text-sm">{owner.employee.firstName} {owner.employee.lastName}</span>
                    <button 
                      onClick={() => removeOwner(owner.employeeId)}
                      className="ml-1 text-gray-400 hover:text-red-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                
                {/* Add Owner Dropdown */}
                {availableEmployees.length > 0 && (
                  <Select onValueChange={addOwner}>
                    <SelectTrigger className="w-10 h-10 p-0 rounded-full border-dashed border-2 border-blue-300 bg-blue-50 hover:bg-blue-100 cursor-pointer">
                      <Plus className="w-4 h-4 mx-auto text-blue-500" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableEmployees.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id}>
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs">
                              {emp.firstName.charAt(0)}{emp.lastName.charAt(0)}
                            </div>
                            <span>{emp.firstName} {emp.lastName}</span>
                            <span className="text-gray-400 text-xs">({emp.role})</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          </div>

          {/* Status & Type Row */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <Label className="text-sm text-gray-500">Status of the audit</Label>
              <Select 
                value={audit.status}
                onValueChange={(v: "open" | "close") => setAudit({ ...audit, status: v })}
              >
                <SelectTrigger className="mt-1 w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="close">Close</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm text-gray-500">Type</Label>
              <Select 
                value={audit.type}
                onValueChange={(v) => setAudit({ ...audit, type: v })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {auditTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Dates Row */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <Label className="text-sm text-gray-500">Planned Audit Date</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input 
                  type="date"
                  value={audit.plannedDate ? format(new Date(audit.plannedDate), "yyyy-MM-dd") : ""}
                  onChange={(e) => setAudit({ ...audit, plannedDate: new Date(e.target.value).toISOString() })}
                  className="flex-1"
                />
              </div>
            </div>
            <div>
              <Label className="text-sm text-gray-500">Audit Happened</Label>
              <div className="flex items-center gap-2 mt-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">
                  {audit.actualDate 
                    ? format(new Date(audit.actualDate), "dd/MM/yyyy") 
                    : "N/A"
                  }
                </span>
              </div>
            </div>
          </div>

          {/* Recurring */}
          <div>
            <Label className="text-sm text-gray-500">Wiederholung</Label>
            <div className="mt-1 flex gap-2">
              {[
                { value: "none", label: "Einmalig" },
                { value: "quarterly", label: "Quartalsweise" },
                { value: "semi-annual", label: "Halbjährlich" },
                { value: "annual", label: "Jährlich" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setAudit({ ...audit, recurring: opt.value })}
                  className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
                    (audit.recurring || "none") === opt.value
                      ? "bg-[#0066FF] text-white border-[#0066FF]"
                      : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {(audit.recurring && audit.recurring !== "none") && (
              <p className="text-xs text-blue-600 mt-1.5 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Wird automatisch für die nächsten 5 Jahre im Kalender angelegt
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description" className="text-sm text-gray-500">Description</Label>
            <Textarea
              id="description"
              value={audit.description || ""}
              onChange={(e) => setAudit({ ...audit, description: e.target.value })}
              placeholder="Enter audit description..."
              className="mt-1 min-h-[100px]"
            />
          </div>

          {/* Documents */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm text-gray-500">Documents</Label>
              <button 
                onClick={addDocument}
                className="text-sm text-blue-600 hover:underline flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Add New
              </button>
            </div>
            
            {documents.length > 0 ? (
              <div className="space-y-2">
                {documents.map((doc, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{doc}</span>
                    </div>
                    <button 
                      onClick={() => removeDocument(doc)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex gap-2">
                <Input 
                  value={newDocument}
                  onChange={(e) => setNewDocument(e.target.value)}
                  placeholder="Document name"
                  className="flex-1"
                  onKeyPress={(e) => e.key === "Enter" && addDocument()}
                />
              </div>
            )}
          </div>

          {/* Save Button */}
          <div className="flex items-center justify-between pt-4">
            {!isNew && (
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(true)}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Löschen
              </Button>
            )}
            <div className="flex flex-col items-end gap-2 ml-auto">
              {saveError && (
                <p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg border border-red-200">
                  Fehler: {saveError}
                </p>
              )}
              <Button
                onClick={saveAudit}
                disabled={saving || !audit.title}
                className="bg-green-500 hover:bg-green-600 text-white px-8"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Speichern..." : "Speichern"}
              </Button>
            </div>
          </div>

          {/* Delete Dialog */}
          {showDeleteDialog && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Audit löschen</h3>
                {audit.seriesId ? (
                  <>
                    <p className="text-sm text-gray-600 mb-6">
                      Dieser Audit ist Teil einer wiederkehrenden Serie. Möchtest du nur diesen Termin oder alle zukünftigen Instanzen löschen?
                    </p>
                    <div className="flex flex-col gap-2">
                      <Button
                        onClick={() => deleteAudit(false)}
                        variant="outline"
                        className="w-full"
                      >
                        Nur diesen Termin löschen
                      </Button>
                      <Button
                        onClick={() => deleteAudit(true)}
                        className="w-full bg-red-500 hover:bg-red-600 text-white"
                      >
                        Gesamte Serie löschen
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => setShowDeleteDialog(false)}
                        className="w-full text-gray-500"
                      >
                        Abbrechen
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-gray-600 mb-6">
                      Möchtest du diesen Audit wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
                    </p>
                    <div className="flex gap-2 justify-end">
                      <Button variant="ghost" onClick={() => setShowDeleteDialog(false)}>
                        Abbrechen
                      </Button>
                      <Button
                        onClick={() => deleteAudit(false)}
                        className="bg-red-500 hover:bg-red-600 text-white"
                      >
                        Löschen
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
