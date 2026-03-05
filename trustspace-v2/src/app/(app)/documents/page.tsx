"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Folder, 
  FileText, 
  FileSpreadsheet, 
  File as FileIcon,
  FileImage,
  FileCode,
  ChevronLeft,
  ChevronRight,
  Search,
  Upload,
  Download,
  Plus,
  Trash2,
  X,
  Grid3X3,
  List,
  FolderOpen,
  Eye,
  RotateCcw,
  Edit3,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { DocumentEditor } from "@/components/document-editor";
import { CollaboraEditor } from "@/components/collabora-editor";

// Types from API
interface DocumentFile {
  id: string;
  name: string;
  type: "folder" | "docx" | "xlsx" | "pptx" | "pdf" | "txt" | "image" | "other";
  size: number;
  parentId: string | null;
  content?: string | null;
  sheetData?: string | null; // JSON string
  fileData?: string | null; // Base64 for images/PDFs
  mimeType?: string | null;
  createdAt: string;
  updatedAt: string;
  children?: DocumentFile[];
}

// ISO 27001 Root Folders
// Helper function to safely parse sheet data
function safeParseSheetData(data: string): any[][] {
  try {
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    // If it's not an array, wrap it
    return [['']];
  } catch {
    return [['']];
  }
}

// Excel Viewer Component
function ExcelViewer({ sheetData }: { sheetData: string }) {
  const data = safeParseSheetData(sheetData);
  
  if (!data.length || !data[0].length) {
    return <div className="p-8 text-center text-gray-400">No data in spreadsheet</div>;
  }
  
  return (
    <div className="overflow-auto border rounded-lg">
      <table className="w-full">
        <tbody>
          {data.map((row: any[], i: number) => (
            <tr key={i} className={i === 0 ? 'bg-gray-100 font-bold' : 'border-t'}>
              {row.map((cell, j) => <td key={j} className="px-4 py-2 border-r last:border-r-0">{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const rootFolders = [
  { name: "4.1 Organization", type: "folder" as const },
  { name: "5.1 Leadership", type: "folder" as const },
  { name: "6.1 Planning", type: "folder" as const },
  { name: "7.1 Support", type: "folder" as const },
  { name: "8.1 Operations", type: "folder" as const },
  { name: "9.1 Performance Evaluation", type: "folder" as const },
  { name: "10.1 Improvement", type: "folder" as const },
];

export default function DocumentsPage() {
  const [files, setFiles] = useState<DocumentFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewingFile, setViewingFile] = useState<DocumentFile | null>(null);
  const [editingFile, setEditingFile] = useState<DocumentFile | null>(null);
  const [collaboraFile, setCollaboraFile] = useState<DocumentFile | null>(null);
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const initialized = useRef(false);

  // Load documents from API
  useEffect(() => {
    async function loadDocuments() {
      try {
        const res = await fetch("/api/documents");
        if (res.ok) {
          const data = await res.json();
          
          // Initialize root folders if empty
          if (data.length === 0 && !initialized.current) {
            initialized.current = true;
            await initializeRootFolders();
            // Reload after initialization
            const reloadRes = await fetch("/api/documents");
            if (reloadRes.ok) {
              const reloadData = await reloadRes.json();
              setFiles(reloadData);
            }
          } else {
            setFiles(data);
          }
        }
      } catch (error) {
        console.error("Failed to load documents:", error);
      } finally {
        setLoading(false);
      }
    }
    loadDocuments();
  }, []);

  // Initialize root folders
  async function initializeRootFolders() {
    for (const folder of rootFolders) {
      await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: folder.name,
          type: "folder",
          parentId: null,
        }),
      });
    }
  }

  // Get current folder and its contents
  const currentFolder = files.find(f => f.id === currentFolderId);
  const folderContents = files.filter(f => 
    (currentFolderId ? f.parentId === currentFolderId : f.parentId === null) &&
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get breadcrumb path
  const getBreadcrumb = (folderId: string | null): DocumentFile[] => {
    if (!folderId) return [];
    const path: DocumentFile[] = [];
    let current = files.find(f => f.id === folderId);
    while (current) {
      path.unshift(current);
      current = files.find(f => f.id === current?.parentId);
    }
    return path;
  };

  const breadcrumb = getBreadcrumb(currentFolderId);

  const formatSize = (bytes: number): string => {
    if (bytes === 0) return "-";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const getFileType = (filename: string): DocumentFile['type'] => {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    if (['docx', 'doc'].includes(ext)) return 'docx';
    if (['xlsx', 'xls', 'csv'].includes(ext)) return 'xlsx';
    if (['pptx', 'ppt'].includes(ext)) return 'pptx';
    if (ext === 'pdf') return 'pdf';
    if (['txt', 'md'].includes(ext)) return 'txt';
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(ext)) return 'image';
    return 'other';
  };

  // Process uploaded file
  const processFile = async (file: globalThis.File): Promise<Partial<DocumentFile>> => {
    const type = getFileType(file.name);
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onloadend = () => {
        const result = reader.result as string;
        
        if (type === 'image' || type === 'pdf') {
          // Store as base64
          resolve({
            name: file.name,
            type,
            size: file.size,
            fileData: result.split(',')[1], // Remove data: prefix
            mimeType: file.type,
          });
        } else if (type === 'docx' || type === 'txt') {
          // For now store as HTML representation
          const content = type === 'txt' 
            ? `<p>${result.replace(/\n/g, '</p><p>')}</p>`
            : `<h1>${file.name.replace('.docx', '')}</h1><p>Document loaded from ${file.name}</p>`;
          
          resolve({
            name: file.name,
            type,
            size: file.size,
            content,
          });
        } else if (type === 'xlsx') {
          // Store as base64 binary for Collabora
          resolve({
            name: file.name,
            type,
            size: file.size,
            fileData: result.split(',')[1], // Remove data: prefix
            mimeType: file.type,
          });
        } else {
          resolve({
            name: file.name,
            type,
            size: file.size,
            fileData: result.split(',')[1],
            mimeType: file.type,
          });
        }
      };
      
      reader.onerror = reject;
      
      if (type === 'image' || type === 'pdf' || type === 'other' || type === 'xlsx' || type === 'docx' || type === 'pptx') {
        reader.readAsDataURL(file);
      } else {
        reader.readAsText(file);
      }
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = event.target.files;
    if (!uploadedFiles || uploadedFiles.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    const total = uploadedFiles.length;

    for (let i = 0; i < total; i++) {
      const file = uploadedFiles[i];
      try {
        const processed = await processFile(file);
        
        await fetch("/api/documents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...processed,
            parentId: currentFolderId,
          }),
        });
        
        setUploadProgress(Math.round(((i + 1) / total) * 100));
      } catch (error) {
        console.error('Error processing file:', file.name, error);
      }
    }

    // Reload files
    const res = await fetch("/api/documents");
    if (res.ok) {
      const data = await res.json();
      setFiles(data);
    }

    setIsUploading(false);
    setUploadProgress(0);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    await fetch("/api/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newFolderName.trim(),
        type: "folder",
        parentId: currentFolderId,
        size: 0,
      }),
    });

    // Reload
    const res = await fetch("/api/documents");
    if (res.ok) {
      const data = await res.json();
      setFiles(data);
    }

    setNewFolderName("");
    setIsCreateFolderOpen(false);
  };

  const handleDelete = async (fileId: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    await fetch(`/api/documents/${fileId}`, { method: "DELETE" });
    
    // Reload
    const res = await fetch("/api/documents");
    if (res.ok) {
      const data = await res.json();
      setFiles(data);
    }
    
    if (viewingFile?.id === fileId) setViewingFile(null);
    if (editingFile?.id === fileId) setEditingFile(null);
  };

  const handleView = (file: DocumentFile) => {
    setViewingFile(file);
  };

  const handleEdit = (file: DocumentFile) => {
    // Use Collabora Online for office documents
    const collaboraTypes = ['docx', 'xlsx', 'pptx', 'odt', 'ods', 'odp'];
    if (collaboraTypes.includes(file.type)) {
      setCollaboraFile(file);
    } else if (file.type === 'docx' || file.type === 'xlsx') {
      // Fallback to built-in editor
      setEditingFile(file);
    } else {
      handleView(file);
    }
  };

  const handleSaveEdit = async (content: string | any[][]) => {
    if (!editingFile) return;

    const updateData: any = {};
    if (typeof content === 'string') {
      updateData.content = content;
    } else {
      updateData.sheetData = content;
    }

    await fetch(`/api/documents/${editingFile.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updateData),
    });

    // Reload
    const res = await fetch("/api/documents");
    if (res.ok) {
      const data = await res.json();
      setFiles(data);
    }

    setEditingFile(null);
  };

  const handleDownload = (file: DocumentFile) => {
    if (file.fileData) {
      // Binary file
      const mimeType = file.mimeType || 'application/octet-stream';
      const byteString = atob(file.fileData);
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([ab], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      a.click();
      URL.revokeObjectURL(url);
    } else if (file.content && file.type === 'docx') {
      // Word doc - create HTML download
      const html = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' 
              xmlns:w='urn:schemas-microsoft-com:office:word' 
              xmlns='http://www.w3.org/TR/REC-html40'>
        <head><meta charset='utf-8'><title>${file.name}</title></head>
        <body>${file.content}</body>
        </html>
      `;
      const blob = new Blob([html], { type: 'application/msword' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name.replace('.docx', '.doc');
      a.click();
      URL.revokeObjectURL(url);
    } else if (file.sheetData && file.type === 'xlsx') {
      // Excel - need to use SheetJS for proper export
      alert('Excel export functionality requires SheetJS library. Please implement export in the editor.');
    }
  };

  const getFileIcon = (type: string, size: number = 10) => {
    const className = `w-${size} h-${size}`;
    switch (type) {
      case "folder": return <Folder className={`${className} text-blue-500`} />;
      case "docx": return <FileText className={`${className} text-blue-600`} />;
      case "xlsx": return <FileSpreadsheet className={`${className} text-green-600`} />;
      case "pptx": return <FileIcon className={`${className} text-orange-500`} />;
      case "pdf": return <FileIcon className={`${className} text-red-500`} />;
      case "image": return <FileImage className={`${className} text-purple-500`} />;
      case "txt": return <FileCode className={`${className} text-gray-500`} />;
      default: return <FileIcon className={`${className} text-gray-400`} />;
    }
  };

  const isEditable = (type: DocumentFile['type']) => {
    // Collabora Online supports these formats
    return ['docx', 'xlsx', 'pptx', 'odt', 'ods', 'odp'].includes(type);
  };

  const renderFolderCard = (file: DocumentFile) => (
    <Card 
      key={file.id}
      className="cursor-pointer hover:shadow-lg transition-all group border-0 shadow-sm bg-white"
      onClick={() => setCurrentFolderId(file.id)}
    >
      <CardContent className="p-6">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 transform group-hover:scale-110 transition-transform">
            <FolderOpen className="w-16 h-16 text-blue-500" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">{file.name}</h3>
          <p className="text-xs text-gray-400">
            {files.filter(f => f.parentId === file.id).length} items
          </p>
        </div>
      </CardContent>
    </Card>
  );

  const renderFileCard = (file: DocumentFile) => (
    <Card 
      key={file.id}
      className="cursor-pointer hover:shadow-lg transition-all group border-0 shadow-sm bg-white"
    >
      <CardContent className="p-6">
        <div className="flex flex-col items-center text-center">
          <div 
            className="mb-4 transform group-hover:scale-110 transition-transform"
            onClick={() => handleView(file)}
          >
            {getFileIcon(file.type, 16)}
          </div>
          <h3 
            className="font-semibold text-gray-900 mb-1 truncate w-full"
            onClick={() => handleView(file)}
          >
            {file.name}
          </h3>
          <p className="text-xs text-gray-400">{formatSize(file.size)}</p>
          
          <div className="flex gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleView(file); }}>
              <Eye className="w-3 h-3 mr-1" /> View
            </Button>
            {isEditable(file.type) && (
              <Button 
                variant="outline" 
                size="sm"
                className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                onClick={(e) => { e.stopPropagation(); handleEdit(file); }}
              >
                <Edit3 className="w-3 h-3 mr-1" /> Edit
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleDownload(file); }}>
              <Download className="w-3 h-3 mr-1" /> Download
            </Button>
            <Button variant="outline" size="sm" className="text-red-500 hover:text-red-600" onClick={(e) => { e.stopPropagation(); handleDelete(file.id); }}>
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderFileRow = (file: DocumentFile) => (
    <tr key={file.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
      <td className="py-3 px-4">
        <div 
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => file.type === 'folder' ? setCurrentFolderId(file.id) : handleView(file)}
        >
          {getFileIcon(file.type, 8)}
          <span className="font-medium text-gray-900">{file.name}</span>
        </div>
      </td>
      <td className="py-3 px-4 text-sm text-gray-500 uppercase">{file.type}</td>
      <td className="py-3 px-4 text-sm text-gray-500">{formatSize(file.size)}</td>
      <td className="py-3 px-4 text-sm text-gray-500">
        {format(new Date(file.updatedAt), "dd.MM.yyyy", { locale: de })}
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleView(file)}>
            <Eye className="w-4 h-4 text-gray-400" />
          </Button>
          {isEditable(file.type) && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(file)}>
              <Edit3 className="w-4 h-4 text-blue-500" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDownload(file)}>
            <Download className="w-4 h-4 text-gray-400" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(file.id)}>
            <Trash2 className="w-4 h-4 text-red-400" />
          </Button>
        </div>
      </td>
    </tr>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Document Overview</h1>
          <p className="text-sm text-gray-500 mt-1">Overview of all documents according to ISO 27001</p>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input 
            placeholder="Search" 
            className="pl-9 w-64"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Breadcrumb & Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {currentFolderId === null ? (
            <span className="text-sm font-medium text-gray-900">Documents</span>
          ) : (
            <>
              <button onClick={() => setCurrentFolderId(null)} className="text-sm text-gray-500 hover:text-gray-900">
                Documents
              </button>
              {breadcrumb.map((folder, index) => (
                <div key={folder.id} className="flex items-center">
                  <ChevronRight className="w-4 h-4 text-gray-400 mx-1" />
                  <button
                    onClick={() => setCurrentFolderId(folder.id)}
                    className={`text-sm ${index === breadcrumb.length - 1 ? 'font-medium text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                  >
                    {folder.name}
                  </button>
                </div>
              ))}
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant={viewMode === "grid" ? "default" : "outline"} size="icon" onClick={() => setViewMode("grid")} className={viewMode === "grid" ? "bg-[#0066FF]" : ""}>
            <Grid3X3 className="w-4 h-4" />
          </Button>
          <Button variant={viewMode === "list" ? "default" : "outline"} size="icon" onClick={() => setViewMode("list")} className={viewMode === "list" ? "bg-[#0066FF]" : ""}>
            <List className="w-4 h-4" />
          </Button>
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} multiple className="hidden" accept=".docx,.xlsx,.pptx,.pdf,.txt,.jpg,.jpeg,.png" />
          <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
            {isUploading ? (
              <><RotateCcw className="w-4 h-4 mr-2 animate-spin" /> {uploadProgress}%</>
            ) : (
              <><Upload className="w-4 h-4 mr-2" /> Upload</>
            )}
          </Button>
          <Button className="bg-[#0066FF] hover:bg-blue-700" onClick={() => setIsCreateFolderOpen(true)}>
            <Plus className="w-4 h-4 mr-2" /> New Folder
          </Button>
        </div>
      </div>

      {/* Empty State */}
      {!loading && folderContents.length === 0 && (
        <Card className="border-dashed border-2 border-gray-200 bg-gray-50/50">
          <CardContent className="p-12 text-center">
            <FolderOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">This folder is empty</h3>
            <p className="text-sm text-gray-500 mb-4">Upload files or create a new folder to get started</p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                <Upload className="w-4 h-4 mr-2" /> Upload Files
              </Button>
              <Button onClick={() => setIsCreateFolderOpen(true)}>
                <Plus className="w-4 h-4 mr-2" /> Create Folder
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading */}
      {loading && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-12 text-center">
            <RotateCcw className="w-8 h-8 animate-spin text-gray-400 mx-auto" />
            <p className="text-sm text-gray-500 mt-2">Loading documents...</p>
          </CardContent>
        </Card>
      )}

      {/* Content */}
      {!loading && folderContents.length > 0 && (
        viewMode === "grid" ? (
          <div className="grid grid-cols-4 gap-6">
            {folderContents.map(file => 
              file.type === "folder" ? renderFolderCard(file) : renderFileCard(file)
            )}
          </div>
        ) : (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-0">
              <table className="w-full">
                <thead className="border-b border-gray-100">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Name</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Type</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Size</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Modified</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>{folderContents.map(renderFileRow)}</tbody>
              </table>
            </CardContent>
          </Card>
        )
      )}

      {/* Create Folder Dialog */}
      <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create New Folder</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Folder Name</Label>
              <Input value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} placeholder="Enter folder name" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateFolderOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateFolder} className="bg-[#0066FF]">Create</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View File Dialog */}
      <Dialog open={!!viewingFile} onOpenChange={() => setViewingFile(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                {viewingFile && getFileIcon(viewingFile.type, 6)}
                {viewingFile?.name}
              </span>
              <div className="flex gap-2">
                {viewingFile && isEditable(viewingFile.type) && (
                  <Button variant="outline" onClick={() => { setViewingFile(null); viewingFile && handleEdit(viewingFile); }}>
                    <Edit3 className="w-4 h-4 mr-2" /> Edit
                  </Button>
                )}
                <Button variant="outline" onClick={() => viewingFile && handleDownload(viewingFile)}>
                  <Download className="w-4 h-4 mr-2" /> Download
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {viewingFile?.type === 'image' && viewingFile.fileData && (
              <img src={`data:${viewingFile.mimeType};base64,${viewingFile.fileData}`} alt={viewingFile.name} className="max-w-full max-h-[60vh] mx-auto" />
            )}
            {viewingFile?.type === 'pdf' && viewingFile.fileData && (
              <iframe src={`data:${viewingFile.mimeType};base64,${viewingFile.fileData}`} className="w-full h-[60vh]" title={viewingFile.name} />
            )}
            {viewingFile?.type === 'docx' && viewingFile.content && (
              <div className="border rounded-lg p-8 bg-white min-h-[400px] prose max-w-none" dangerouslySetInnerHTML={{ __html: viewingFile.content }} />
            )}
            {viewingFile?.type === 'xlsx' && viewingFile.sheetData && (
              <ExcelViewer sheetData={viewingFile.sheetData} />
            )}
            {viewingFile?.type === 'other' && (
              <div className="text-center p-12 text-gray-500">
                <FileIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>Preview not available for this file type</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Editor Dialog */}
      <Dialog open={!!editingFile} onOpenChange={(open) => { if (!open) setEditingFile(null); }}>
        <DialogContent className="max-w-6xl h-[95vh] p-0 overflow-hidden" aria-description="Document editor">
          <DialogTitle className="sr-only">{editingFile?.name || 'Document Editor'}</DialogTitle>
          {editingFile && (
            <DocumentEditor
              file={{
                id: editingFile.id,
                name: editingFile.name,
                type: editingFile.type as "docx" | "xlsx",
                content: editingFile.content || undefined,
                sheetData: editingFile.sheetData ? safeParseSheetData(editingFile.sheetData) : undefined,
              }}
              onSave={handleSaveEdit}
              onCancel={() => setEditingFile(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Collabora Online Editor */}
      {collaboraFile && (
        <CollaboraEditor
          fileId={collaboraFile.id}
          fileName={collaboraFile.name}
          onClose={() => setCollaboraFile(null)}
        />
      )}
    </div>
  );
}
