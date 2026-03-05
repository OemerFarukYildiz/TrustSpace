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
import { ChevronRight, Save, FileText, Plus, X, Calendar } from "lucide-react";
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
  
  const [audit, setAudit] = useState<Partial<Audit>>({
    title: "",
    plannedDate: new Date().toISOString(),
    type: "Internal Audit",
    status: "open",
    description: "",
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

  const saveAudit = async () => {
    if (!audit.title) return;
    
    setSaving(true);
    try {
      const ownerIds = audit.owners?.map(o => o.employeeId) || [];
      const payload = {
        title: audit.title,
        type: audit.type,
        plannedDate: audit.plannedDate,
        actualDate: audit.actualDate,
        description: audit.description,
        status: audit.status,
        ownerIds,
        documents,
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
        console.error("Failed to save audit");
      }
    } catch (error) {
      console.error("Failed to save audit:", error);
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
          <div className="flex justify-center pt-4">
            <Button 
              onClick={saveAudit}
              disabled={saving || !audit.title}
              className="bg-green-500 hover:bg-green-600 text-white px-8"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
