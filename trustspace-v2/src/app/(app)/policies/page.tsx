"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  Plus, 
  Search, 
  ChevronLeft, 
  MoreVertical, 
  Bookmark,
  FileText,
  Check,
  Clock,
  X,
  ChevronDown,
  Download,
  Edit3,
  Users,
  Calendar,
  Lock,
  Save,
  Eye,
  Upload
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { DocumentEditor } from "@/components/document-editor";

// Categories
const categories = [
  { id: "policies", title: "Policies & Guidelines", description: "General objectives are formally documented and expressed in this section", icon: "📋", color: "from-blue-400 to-blue-600" },
  { id: "procedural", title: "Procedural Instruction", description: "A procedural instruction describes the way to execute a process or an activity", icon: "📄", color: "from-cyan-400 to-cyan-600" },
  { id: "work", title: "Work Instruction", description: "A work instruction describes the specific instruction to implement a process", icon: "🔧", color: "from-teal-400 to-teal-600" },
  { id: "external", title: "External Documents", description: "Documents of external origin (e.g. audit reports & pentests) are managed in this section", icon: "🔗", color: "from-indigo-400 to-indigo-600" },
];

interface Policy {
  id: string;
  title: string;
  content: string | null;
  status: "draft" | "review" | "approved" | "expired";
  version: number;
  category: string;
  createdAt: string;
  updatedAt: string;
  control?: { id: string; code: string; title: string } | null;
}

export default function PoliciesPage() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
  const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null);
  const [editContent, setEditContent] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newPolicy, setNewPolicy] = useState({ title: "", status: "draft", category: "policies" });
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load policies from API
  useEffect(() => {
    async function loadPolicies() {
      try {
        const res = await fetch("/api/policies");
        if (res.ok) {
          const data = await res.json();
          setPolicies(data);
        }
      } catch (error) {
        console.error("Failed to load policies:", error);
      } finally {
        setLoading(false);
      }
    }
    loadPolicies();
  }, []);

  const filteredPolicies = policies.filter(p => 
    (selectedCategory ? p.category === selectedCategory : true) &&
    p.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = async () => {
    try {
      const res = await fetch("/api/policies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newPolicy,
          content: "<h1>New Document</h1><p>Start editing your document here...</p>",
        }),
      });
      if (res.ok) {
        const policy = await res.json();
        setPolicies([policy, ...policies]);
        setNewPolicy({ title: "", status: "draft", category: "policies" });
        setIsCreateOpen(false);
      }
    } catch (error) {
      console.error("Failed to create policy:", error);
    }
  };

  // Handle file upload for policies
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);

    for (const file of Array.from(files)) {
      try {
        // Read file content
        const text = await file.text();
        const content = file.name.endsWith('.txt') 
          ? `<p>${text.replace(/\n/g, '</p><p>')}</p>`
          : `<h1>${file.name.replace(/\.[^/.]+$/, '')}</h1><p>Document imported from ${file.name}</p>`;

        await fetch("/api/policies", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: file.name.replace(/\.[^/.]+$/, ''),
            content,
            status: "draft",
            category: selectedCategory || "policies",
            fileType: file.name.split('.').pop(),
          }),
        });
      } catch (error) {
        console.error('Error uploading file:', file.name, error);
      }
    }

    // Reload policies
    const res = await fetch("/api/policies");
    if (res.ok) {
      const data = await res.json();
      setPolicies(data);
    }

    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSaveEdit = async () => {
    if (!editingPolicy) return;
    
    try {
      const res = await fetch(`/api/policies/${editingPolicy.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          content: editContent,
          version: editingPolicy.version + 1,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setPolicies(policies.map(p => p.id === updated.id ? updated : p));
        setEditingPolicy(null);
        setEditContent("");
        // Refresh selected policy if viewing
        if (selectedPolicy?.id === updated.id) {
          setSelectedPolicy(updated);
        }
      }
    } catch (error) {
      console.error("Failed to save policy:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: "bg-yellow-50 text-yellow-700 border-yellow-200",
      review: "bg-blue-50 text-blue-700 border-blue-200",
      approved: "bg-green-50 text-green-700 border-green-200",
      expired: "bg-red-50 text-red-700 border-red-200",
    };
    return styles[status] || "bg-gray-50 text-gray-700";
  };

  // Category Selection View
  if (!selectedCategory) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Guidelines</h1>
            <p className="text-sm text-gray-500 mt-1">Manage your ISMS policies and procedures</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input placeholder="Search guidelines..." className="pl-9 w-64" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            <Button className="bg-[#0066FF] hover:bg-blue-700" onClick={() => setIsCreateOpen(true)}>
              <Plus className="w-4 h-4 mr-2" /> Add new
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-6">
          {categories.map((category) => (
            <Card key={category.id} className="overflow-hidden hover:shadow-xl transition-all cursor-pointer group border-0 shadow-md" onClick={() => setSelectedCategory(category.id)}>
              <div className={`h-32 bg-gradient-to-br ${category.color} relative overflow-hidden`}>
                <div className="absolute top-4 right-4 text-4xl opacity-80">{category.icon}</div>
              </div>
              <CardContent className="p-5">
                <h3 className="font-semibold text-gray-900 text-lg mb-2 group-hover:text-blue-600 transition-colors">{category.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{category.description}</p>
                <div className="mt-4 flex items-center gap-2 text-sm text-gray-400">
                  <FileText className="w-4 h-4" />
                  <span>{policies.filter(p => p.category === category.id).length} documents</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Create New Document</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Title</Label>
                <Input value={newPolicy.title} onChange={(e) => setNewPolicy({...newPolicy, title: e.target.value})} placeholder="Enter document title" />
              </div>
              <div>
                <Label>Category</Label>
                <Select value={newPolicy.category} onValueChange={(v) => setNewPolicy({...newPolicy, category: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={newPolicy.status} onValueChange={(v) => setNewPolicy({...newPolicy, status: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="review">Review</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                <Button onClick={handleCreate} className="bg-[#0066FF]">Create</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Policy List View
  const category = categories.find(c => c.id === selectedCategory);

  return (
    <div className="space-y-6">
      {/* Policy Viewer Overlay - Full screen modal */}
      {selectedPolicy && (
        <div className="fixed inset-0 bg-white z-50 overflow-auto">
          <div className="p-6 max-w-7xl mx-auto">
            <PolicyViewer 
              policy={selectedPolicy}
              category={category!}
              onBack={() => setSelectedPolicy(null)}
              onEdit={() => {
                setEditingPolicy(selectedPolicy);
                setEditContent(selectedPolicy.content || "");
              }}
            />
          </div>
        </div>
      )}
      
      {/* Only show list when no policy is selected */}
      {!selectedPolicy && (
      <>
      <button onClick={() => setSelectedCategory(null)} className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1">
        <ChevronLeft className="w-4 h-4" /> Back to categories
      </button>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Select defaultValue={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[200px]"><SelectValue>{category?.title}</SelectValue></SelectTrigger>
            <SelectContent>
              {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input placeholder="Search" className="pl-9 w-64" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          <Button variant="outline"><Lock className="w-4 h-4 mr-2" /> Filters</Button>
          <Button 
            variant="outline" 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            <Upload className="w-4 h-4 mr-2" /> 
            {isUploading ? 'Uploading...' : 'Upload'}
          </Button>
          <Button className="bg-[#0066FF] hover:bg-blue-700" onClick={() => setIsCreateOpen(true)}>
            <Plus className="w-4 h-4 mr-2" /> Add Document
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".txt,.doc,.docx,.md"
            onChange={handleFileUpload}
            multiple
          />
        </div>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          <table className="w-full">
            <thead className="border-b border-gray-100">
              <tr>
                <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Guideline</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Control</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Status</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Version</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Updated</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="py-12 text-center text-gray-400">Loading...</td></tr>
              ) : filteredPolicies.length === 0 ? (
                <tr><td colSpan={6} className="py-12 text-center text-gray-400">No documents found</td></tr>
              ) : (
                filteredPolicies.map((policy) => (
                  <tr key={policy.id} className="border-b border-gray-50 hover:bg-gray-50/50 cursor-pointer transition-colors" onClick={() => setSelectedPolicy(policy)}>
                    <td className="py-4 px-6"><span className="text-gray-900 font-medium">{policy.title}</span></td>
                    <td className="py-4 px-6 text-sm text-gray-500">{policy.control?.code || "-"}</td>
                    <td className="py-4 px-6">
                      <Badge className={`${getStatusBadge(policy.status)}`} variant="outline">
                        {policy.status === "approved" && <Check className="w-3 h-3 mr-1" />}
                        {policy.status === "draft" && <Clock className="w-3 h-3 mr-1" />}
                        {policy.status.charAt(0).toUpperCase() + policy.status.slice(1)}
                      </Badge>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-500">v{policy.version}</td>
                    <td className="py-4 px-6 text-sm text-gray-500">{format(new Date(policy.updatedAt), "dd MMM yyyy")}</td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <button className="p-2 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"><Bookmark className="w-4 h-4" /></button>
                        <button className="p-2 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"><MoreVertical className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
      </>
      )}

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add New Document</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Document Name</Label>
              <Input value={newPolicy.title} onChange={(e) => setNewPolicy({...newPolicy, title: e.target.value})} placeholder="e.g. ISMS Guidelines V2" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate} className="bg-[#0066FF]">Create</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Document Editor Dialog */}
      <Dialog open={!!editingPolicy} onOpenChange={() => { setEditingPolicy(null); setEditContent(""); }}>
        <DialogContent className="max-w-6xl h-[95vh] p-0 overflow-hidden" aria-description="Document editor">
          <DialogTitle className="sr-only">{editingPolicy?.title || 'Document Editor'}</DialogTitle>
          {editingPolicy && (
            <DocumentEditor
              file={{
                id: editingPolicy.id,
                name: editingPolicy.title,
                type: "docx",
                content: editContent,
              }}
              onSave={handleSaveEdit}
              onCancel={() => { setEditingPolicy(null); setEditContent(""); }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Policy Viewer Component
function PolicyViewer({ 
  policy, 
  category,
  onBack,
  onEdit
}: { 
  policy: Policy;
  category: typeof categories[0];
  onBack: () => void;
  onEdit: () => void;
}) {
  const [activeTab, setActiveTab] = useState<"info" | "history">("info");

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: "bg-yellow-50 text-yellow-700 border-yellow-200",
      review: "bg-blue-50 text-blue-700 border-blue-200",
      approved: "bg-green-50 text-green-700 border-green-200",
      expired: "bg-red-50 text-red-700 border-red-200",
    };
    return styles[status] || "bg-gray-50 text-gray-700";
  };

  const handleExport = () => {
    const html = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' 
            xmlns:w='urn:schemas-microsoft-com:office:word' 
            xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>${policy.title}</title></head>
      <body>${policy.content}</body>
      </html>
    `;
    const blob = new Blob([html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${policy.title.replace(/\s+/g, '_')}.doc`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1">
          <ChevronLeft className="w-4 h-4" /> Back to categories
        </button>
        <Button onClick={onEdit} className="bg-[#0066FF]">
          <Edit3 className="w-4 h-4 mr-2" /> Edit Document
        </Button>
      </div>

      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-100">
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="px-3 py-1">v{policy.version} ({format(new Date(policy.createdAt), "dd MMM yyyy")})</Badge>
          {policy.control && (
            <Badge variant="outline" className="px-3 py-1 bg-blue-50 text-blue-700">{policy.control.code}</Badge>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon"><FileText className="w-4 h-4" /></Button>
          <Button variant="outline" size="icon" onClick={handleExport}><Download className="w-4 h-4" /></Button>
          <Badge className={`${getStatusBadge(policy.status)} px-4 py-1`} variant="outline">
            {policy.status.charAt(0).toUpperCase() + policy.status.slice(1)}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-white rounded-xl border border-gray-100 overflow-hidden min-h-[600px]">
          <div className="bg-gray-900 text-white p-4 flex items-center justify-between">
            <span className="font-semibold">Document Viewer</span>
            <span className="text-sm text-gray-400">{policy.title}</span>
          </div>
          <div className="p-8">
            <h1 className="text-3xl font-light text-slate-800 mb-6">{policy.title}</h1>
            {policy.control && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <span className="text-sm text-blue-600 font-medium">ISO Control: {policy.control.code}</span>
                <p className="text-sm text-gray-600">{policy.control.title}</p>
              </div>
            )}
            <div className="prose max-w-none text-gray-700" dangerouslySetInnerHTML={{ __html: policy.content || '<p class="text-gray-400 italic">No content yet. Click Edit to add content.</p>' }} />
          </div>
        </div>

        <div className="col-span-1 space-y-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="mb-4">
                <Badge className={`${getStatusBadge(policy.status)} w-full justify-center py-2`} variant="outline">
                  {policy.status.charAt(0).toUpperCase() + policy.status.slice(1)}
                </Badge>
              </div>
              <h2 className="text-lg font-semibold mb-4">{policy.title}</h2>
              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-400">Created</span>
                  <span>{format(new Date(policy.createdAt), "dd MMM yyyy")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Updated</span>
                  <span>{format(new Date(policy.updatedAt), "dd MMM yyyy")}</span>
                </div>
              </div>
              <div className="flex border-b border-gray-100 mb-4">
                <button className={`flex-1 py-2 text-sm ${activeTab === "info" ? "text-gray-900 border-b-2 border-gray-900" : "text-gray-400"}`} onClick={() => setActiveTab("info")}>Info</button>
                <button className={`flex-1 py-2 text-sm ${activeTab === "history" ? "text-gray-900 border-b-2 border-gray-900" : "text-gray-400"}`} onClick={() => setActiveTab("history")}>History</button>
              </div>
              {activeTab === "info" && (
                <div className="space-y-4">
                  <div>
                    <Label className="text-xs text-blue-500">Category</Label>
                    <p className="text-sm mt-1">{category.title}</p>
                  </div>
                  {policy.control && (
                    <div>
                      <Label className="text-xs text-blue-500">ISO Control</Label>
                      <p className="text-sm mt-1">{policy.control.code}</p>
                      <p className="text-xs text-gray-500">{policy.control.title}</p>
                    </div>
                  )}
                  <div>
                    <Label className="text-xs text-blue-500">Version</Label>
                    <p className="text-sm mt-1">v{policy.version}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
