"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";

const PageEditor = dynamic(() => import("@/components/page-editor"), { ssr: false });
import { Input } from "@/components/ui/input";
import {
  Folder,
  FileText,
  FileSpreadsheet,
  File as FileIcon,
  FileImage,
  FileCode,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Search,
  Upload,
  Download,
  Plus,
  Trash2,
  Grid3X3,
  List,
  FolderOpen,
  Eye,
  RotateCcw,
  Edit3,
  ArrowUp,
  ArrowDown,
  Columns3,
  SidebarIcon,
  Copy,
  Pencil,
  Info,
  HardDrive,
  Clock,
  Star,
  Home,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { DocumentEditor } from "@/components/document-editor";
import { CollaboraEditor } from "@/components/collabora-editor";

// Types
interface DocumentFile {
  id: string;
  name: string;
  type: "folder" | "page" | "docx" | "xlsx" | "pptx" | "pdf" | "txt" | "image" | "other";
  size: number;
  parentId: string | null;
  content?: string | null;
  sheetData?: string | null;
  fileData?: string | null;
  mimeType?: string | null;
  createdAt: string;
  updatedAt: string;
  children?: DocumentFile[];
}

type SortField = "name" | "type" | "size" | "updatedAt";
type SortDir = "asc" | "desc";
type ViewMode = "grid" | "list" | "columns";

function safeParseSheetData(data: string): any[][] {
  try {
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [[""]];
  } catch {
    return [[""]];
  }
}

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
            <tr key={i} className={i === 0 ? "bg-gray-100 font-bold" : "border-t"}>
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-2 border-r last:border-r-0">{cell}</td>
              ))}
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

// --- Sidebar Tree Node ---
function TreeNode({
  file,
  files,
  currentFolderId,
  onNavigate,
  onOpenFile,
  depth = 0,
  expandedFolders,
  toggleExpand,
}: {
  file: DocumentFile;
  files: DocumentFile[];
  currentFolderId: string | null;
  onNavigate: (id: string | null) => void;
  onOpenFile?: (file: DocumentFile) => void;
  depth?: number;
  expandedFolders: Set<string>;
  toggleExpand: (id: string) => void;
}) {
  const isFolder = file.type === "folder";
  const childFolders = files.filter((f) => f.parentId === file.id && f.type === "folder");
  const childFiles = files.filter((f) => f.parentId === file.id && f.type !== "folder");
  const hasChildren = childFolders.length > 0 || childFiles.length > 0;
  const isExpanded = expandedFolders.has(file.id);
  const isActive = isFolder && currentFolderId === file.id;

  const icon = isFolder
    ? <Folder className={`w-4 h-4 shrink-0 ${isActive ? "text-blue-600" : "text-blue-400"}`} />
    : file.type === "page"
      ? <FileText className="w-4 h-4 shrink-0 text-[#0066FF]" />
      : <FileIcon className="w-4 h-4 shrink-0 text-gray-400" />;

  return (
    <div>
      <div
        className={`flex items-center gap-1 py-[3px] px-2 rounded-md cursor-pointer text-[13px] select-none transition-colors ${
          isActive
            ? "bg-blue-500/15 text-blue-700 font-medium"
            : "text-gray-700 hover:bg-black/5"
        }`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => {
          if (isFolder) onNavigate(file.id);
          else onOpenFile?.(file);
        }}
      >
        {isFolder && hasChildren ? (
          <button
            className="w-4 h-4 flex items-center justify-center shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              toggleExpand(file.id);
            }}
          >
            <ChevronRight
              className={`w-3 h-3 text-gray-400 transition-transform duration-150 ${
                isExpanded ? "rotate-90" : ""
              }`}
            />
          </button>
        ) : (
          <span className="w-4 h-4 shrink-0" />
        )}
        {icon}
        <span className="truncate">{file.name}</span>
      </div>
      {isFolder && isExpanded && hasChildren && (
        <div>
          {childFolders
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((child) => (
              <TreeNode
                key={child.id}
                file={child}
                files={files}
                currentFolderId={currentFolderId}
                onNavigate={onNavigate}
                onOpenFile={onOpenFile}
                depth={depth + 1}
                expandedFolders={expandedFolders}
                toggleExpand={toggleExpand}
              />
            ))}
          {childFiles
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((child) => (
              <TreeNode
                key={child.id}
                file={child}
                files={files}
                currentFolderId={currentFolderId}
                onNavigate={onNavigate}
                onOpenFile={onOpenFile}
                depth={depth + 1}
                expandedFolders={expandedFolders}
                toggleExpand={toggleExpand}
              />
            ))}
        </div>
      )}
    </div>
  );
}

// --- Context Menu ---
function ContextMenu({
  x,
  y,
  file,
  onClose,
  onOpen,
  onRename,
  onDownload,
  onDelete,
  onGetInfo,
}: {
  x: number;
  y: number;
  file: DocumentFile | null;
  onClose: () => void;
  onOpen: () => void;
  onRename: () => void;
  onDownload: () => void;
  onDelete: () => void;
  onGetInfo: () => void;
}) {
  useEffect(() => {
    const handler = () => onClose();
    window.addEventListener("click", handler);
    window.addEventListener("contextmenu", handler);
    return () => {
      window.removeEventListener("click", handler);
      window.removeEventListener("contextmenu", handler);
    };
  }, [onClose]);

  if (!file) return null;

  const items = [
    { label: file.type === "folder" ? "Oeffnen" : "Anzeigen", icon: Eye, action: onOpen },
    ...(file.type !== "folder"
      ? [{ label: "Herunterladen", icon: Download, action: onDownload }]
      : []),
    { label: "Umbenennen", icon: Pencil, action: onRename },
    { label: "Informationen", icon: Info, action: onGetInfo },
    { label: "---", icon: null, action: () => {} },
    { label: "Loeschen", icon: Trash2, action: onDelete, danger: true },
  ];

  return (
    <div
      className="fixed z-[100] bg-white/95 backdrop-blur-xl border border-gray-200 rounded-lg shadow-xl py-1 min-w-[200px]"
      style={{ left: x, top: y }}
      onClick={(e) => e.stopPropagation()}
    >
      {items.map((item, i) =>
        item.label === "---" ? (
          <div key={i} className="h-px bg-gray-200 my-1" />
        ) : (
          <button
            key={i}
            className={`w-full text-left px-3 py-[6px] text-[13px] flex items-center gap-2 transition-colors ${
              (item as any).danger
                ? "text-red-600 hover:bg-red-50"
                : "text-gray-700 hover:bg-blue-500 hover:text-white"
            }`}
            onClick={() => {
              item.action();
              onClose();
            }}
          >
            {item.icon && <item.icon className="w-4 h-4" />}
            {item.label}
          </button>
        )
      )}
    </div>
  );
}

// ======= MAIN COMPONENT =======
export default function DocumentsPage() {
  const [files, setFiles] = useState<DocumentFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewingFile, setViewingFile] = useState<DocumentFile | null>(null);
  const [showTemplateMenu, setShowTemplateMenu] = useState(false);
  const [editingFile, setEditingFile] = useState<DocumentFile | null>(null);
  const [editingPage, setEditingPage] = useState<DocumentFile | null>(null);
  const [editingPageFullscreen, setEditingPageFullscreen] = useState(false);
  const [collaboraFile, setCollaboraFile] = useState<DocumentFile | null>(null);
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [showSidebar, setShowSidebar] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [navHistory, setNavHistory] = useState<(string | null)[]>([null]);
  const [navIndex, setNavIndex] = useState(0);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; file: DocumentFile } | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);
  const [sidebarWidth, setSidebarWidth] = useState(220);
  const [isResizing, setIsResizing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const initialized = useRef(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  const router = useRouter();

  // ---- Data loading ----
  const reloadFiles = useCallback(async () => {
    const res = await fetch("/api/documents");
    if (res.ok) setFiles(await res.json());
  }, []);

  useEffect(() => {
    async function loadDocuments() {
      try {
        const res = await fetch("/api/documents");
        if (res.ok) {
          const data = await res.json();
          if (data.length === 0 && !initialized.current) {
            initialized.current = true;
            for (const folder of rootFolders) {
              await fetch("/api/documents", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: folder.name, type: "folder", parentId: null }),
              });
            }
            await reloadFiles();
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
  }, [reloadFiles]);

  // ---- Navigation ----
  const navigateTo = useCallback(
    (folderId: string | null) => {
      setCurrentFolderId(folderId);
      setSelectedIds(new Set());
      const newHistory = navHistory.slice(0, navIndex + 1);
      newHistory.push(folderId);
      setNavHistory(newHistory);
      setNavIndex(newHistory.length - 1);
    },
    [navHistory, navIndex]
  );

  const goBack = useCallback(() => {
    if (editingPage) {
      setEditingPage(null);
      return;
    }
    if (navIndex > 0) {
      const newIndex = navIndex - 1;
      setNavIndex(newIndex);
      setCurrentFolderId(navHistory[newIndex]);
      setSelectedIds(new Set());
    }
  }, [navIndex, navHistory, editingPage]);

  const goForward = useCallback(() => {
    if (navIndex < navHistory.length - 1) {
      const newIndex = navIndex + 1;
      setNavIndex(newIndex);
      setCurrentFolderId(navHistory[newIndex]);
      setSelectedIds(new Set());
    }
  }, [navIndex, navHistory]);

  // ---- Computed ----
  const folderContents = useMemo(() => {
    let items = files.filter(
      (f) =>
        (currentFolderId ? f.parentId === currentFolderId : f.parentId === null) &&
        f.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    // Sort: folders first, then by field
    items.sort((a, b) => {
      if (a.type === "folder" && b.type !== "folder") return -1;
      if (a.type !== "folder" && b.type === "folder") return 1;
      let cmp = 0;
      switch (sortField) {
        case "name":
          cmp = a.name.localeCompare(b.name, "de");
          break;
        case "type":
          cmp = a.type.localeCompare(b.type);
          break;
        case "size":
          cmp = a.size - b.size;
          break;
        case "updatedAt":
          cmp = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return items;
  }, [files, currentFolderId, searchQuery, sortField, sortDir]);

  const getBreadcrumb = useCallback(
    (folderId: string | null): DocumentFile[] => {
      if (!folderId) return [];
      const path: DocumentFile[] = [];
      let current = files.find((f) => f.id === folderId);
      while (current) {
        path.unshift(current);
        current = files.find((f) => f.id === current?.parentId);
      }
      return path;
    },
    [files]
  );

  const breadcrumb = getBreadcrumb(currentFolderId);

  const selectedFile = useMemo(() => {
    if (selectedIds.size === 1) {
      const id = Array.from(selectedIds)[0];
      return files.find((f) => f.id === id) || null;
    }
    return null;
  }, [selectedIds, files]);

  // ---- Tree ----
  const rootFiles = useMemo(() => files.filter((f) => f.parentId === null && f.type === "folder"), [files]);

  const toggleExpand = useCallback((id: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // Auto-expand breadcrumb path
  useEffect(() => {
    if (currentFolderId) {
      const path = getBreadcrumb(currentFolderId);
      setExpandedFolders((prev) => {
        const next = new Set(prev);
        path.forEach((f) => next.add(f.id));
        return next;
      });
    }
  }, [currentFolderId, getBreadcrumb]);

  // ---- Helpers ----
  const formatSize = (bytes: number): string => {
    if (bytes === 0) return "--";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const getFileType = (filename: string): DocumentFile["type"] => {
    const ext = filename.split(".").pop()?.toLowerCase() || "";
    if (["docx", "doc"].includes(ext)) return "docx";
    if (["xlsx", "xls", "csv"].includes(ext)) return "xlsx";
    if (["pptx", "ppt"].includes(ext)) return "pptx";
    if (ext === "pdf") return "pdf";
    if (["txt", "md"].includes(ext)) return "txt";
    if (["jpg", "jpeg", "png", "gif", "bmp", "webp", "svg"].includes(ext)) return "image";
    return "other";
  };

  const getKindLabel = (type: string) => {
    switch (type) {
      case "folder": return "Ordner";
      case "docx": return "Word-Dokument";
      case "xlsx": return "Excel-Tabelle";
      case "pptx": return "Praesentation";
      case "pdf": return "PDF-Dokument";
      case "txt": return "Textdatei";
      case "image": return "Bild";
      default: return "Dokument";
    }
  };

  const getFileIcon = (type: string, size: number = 4) => {
    const cls = `w-${size} h-${size}`;
    switch (type) {
      case "folder": return <Folder className={`${cls} text-blue-400`} />;
      case "page": return <FileText className={`${cls} text-[#0066FF]`} />;
      case "docx": return <FileText className={`${cls} text-blue-600`} />;
      case "xlsx": return <FileSpreadsheet className={`${cls} text-green-600`} />;
      case "pptx": return <FileIcon className={`${cls} text-orange-500`} />;
      case "pdf": return <FileIcon className={`${cls} text-red-500`} />;
      case "image": return <FileImage className={`${cls} text-purple-500`} />;
      case "txt": return <FileCode className={`${cls} text-gray-500`} />;
      default: return <FileIcon className={`${cls} text-gray-400`} />;
    }
  };

  const isEditable = (type: DocumentFile["type"]) =>
    ["docx", "xlsx", "pptx", "odt", "ods", "odp"].includes(type);

  // ---- File operations ----
  const processFile = async (file: globalThis.File): Promise<Partial<DocumentFile>> => {
    const type = getFileType(file.name);
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        if (type === "image" || type === "pdf") {
          resolve({ name: file.name, type, size: file.size, fileData: result.split(",")[1], mimeType: file.type });
        } else if (type === "docx" || type === "txt") {
          const content =
            type === "txt"
              ? `<p>${result.replace(/\n/g, "</p><p>")}</p>`
              : `<h1>${file.name.replace(".docx", "")}</h1><p>Document loaded from ${file.name}</p>`;
          resolve({ name: file.name, type, size: file.size, content });
        } else {
          resolve({ name: file.name, type, size: file.size, fileData: result.split(",")[1], mimeType: file.type });
        }
      };
      reader.onerror = reject;
      if (type === "txt") reader.readAsText(file);
      else reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = event.target.files;
    if (!uploadedFiles || uploadedFiles.length === 0) return;
    setIsUploading(true);
    setUploadProgress(0);
    const total = uploadedFiles.length;
    for (let i = 0; i < total; i++) {
      try {
        const processed = await processFile(uploadedFiles[i]);
        await fetch("/api/documents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...processed, parentId: currentFolderId }),
        });
        setUploadProgress(Math.round(((i + 1) / total) * 100));
      } catch (error) {
        console.error("Error processing file:", uploadedFiles[i].name, error);
      }
    }
    await reloadFiles();
    setIsUploading(false);
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCreatePage = async () => {
    const res = await fetch("/api/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Neue Seite",
        type: "page",
        parentId: currentFolderId,
        content: "",
        size: 0,
      }),
    });
    const created = await res.json();
    if (created?.id) {
      router.push(`/documents/page-edit/${created.id}`);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    await fetch("/api/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newFolderName.trim(), type: "folder", parentId: currentFolderId, size: 0 }),
    });
    await reloadFiles();
    setNewFolderName("");
    setIsCreateFolderOpen(false);
  };

  const handleDelete = async (fileId: string) => {
    if (!confirm("Moechten Sie dieses Element wirklich loeschen?")) return;
    await fetch(`/api/documents/${fileId}`, { method: "DELETE" });
    await reloadFiles();
    setSelectedIds((prev) => { const next = new Set(prev); next.delete(fileId); return next; });
    if (viewingFile?.id === fileId) setViewingFile(null);
    if (editingFile?.id === fileId) setEditingFile(null);
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Moechten Sie ${selectedIds.size} Element(e) wirklich loeschen?`)) return;
    for (const id of selectedIds) {
      await fetch(`/api/documents/${id}`, { method: "DELETE" });
    }
    await reloadFiles();
    setSelectedIds(new Set());
  };

  const handleView = (file: DocumentFile) => setViewingFile(file);

  const handleEdit = (file: DocumentFile) => {
    const collaboraTypes = ["docx", "xlsx", "pptx", "odt", "ods", "odp"];
    if (collaboraTypes.includes(file.type)) setCollaboraFile(file);
    else if (file.type === "docx" || file.type === "xlsx") setEditingFile(file);
    else handleView(file);
  };

  const handleSaveEdit = async (content: string | any[][]) => {
    if (!editingFile) return;
    const updateData: any = {};
    if (typeof content === "string") updateData.content = content;
    else updateData.sheetData = content;
    await fetch(`/api/documents/${editingFile.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updateData),
    });
    await reloadFiles();
    setEditingFile(null);
  };

  const handleDownload = (file: DocumentFile) => {
    if (file.fileData) {
      const mimeType = file.mimeType || "application/octet-stream";
      const byteString = atob(file.fileData);
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
      const blob = new Blob([ab], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      a.click();
      URL.revokeObjectURL(url);
    } else if (file.content && file.type === "docx") {
      const html = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>${file.name}</title></head><body>${file.content}</body></html>`;
      const blob = new Blob([html], { type: "application/msword" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name.replace(".docx", ".doc");
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleRename = async (id: string, newName: string) => {
    if (!newName.trim()) return;
    await fetch(`/api/documents/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });
    await reloadFiles();
    setRenamingId(null);
  };

  const handleMove = async (fileId: string, targetFolderId: string) => {
    await fetch(`/api/documents/${fileId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ parentId: targetFolderId }),
    });
    await reloadFiles();
  };

  const goToTemplate = (kind: string) => {
    setShowTemplateMenu(false);
    router.push(`/documents/templates/${kind}`);
  };

  // ---- Selection ----
  const handleSelect = useCallback(
    (file: DocumentFile, e: React.MouseEvent) => {
      if (e.metaKey || e.ctrlKey) {
        setSelectedIds((prev) => {
          const next = new Set(prev);
          if (next.has(file.id)) next.delete(file.id);
          else next.add(file.id);
          return next;
        });
      } else if (e.shiftKey && selectedIds.size > 0) {
        const lastId = Array.from(selectedIds).pop()!;
        const ids = folderContents.map((f) => f.id);
        const lastIdx = ids.indexOf(lastId);
        const curIdx = ids.indexOf(file.id);
        const [start, end] = lastIdx < curIdx ? [lastIdx, curIdx] : [curIdx, lastIdx];
        setSelectedIds(new Set(ids.slice(start, end + 1)));
      } else {
        setSelectedIds(new Set([file.id]));
      }
    },
    [selectedIds, folderContents]
  );

  const handleDoubleClick = useCallback(
    (file: DocumentFile) => {
      if (file.type === "folder") navigateTo(file.id);
      else if (file.type === "page") setEditingPage(file);
      else handleView(file);
    },
    [navigateTo]
  );

  // ---- Keyboard ----
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (renamingId || isCreateFolderOpen || viewingFile || editingFile || editingPage || editingPageFullscreen) return;

      if (e.key === "Backspace" && !e.metaKey) {
        e.preventDefault();
        if (currentFolderId) {
          const parent = files.find((f) => f.id === currentFolderId);
          navigateTo(parent?.parentId ?? null);
        }
      }
      if (e.key === "Delete" || (e.key === "Backspace" && e.metaKey)) {
        if (selectedIds.size > 0) handleDeleteSelected();
      }
      if (e.key === "Enter" && selectedIds.size === 1) {
        const file = files.find((f) => f.id === Array.from(selectedIds)[0]);
        if (file) handleDoubleClick(file);
      }
      if (e.key === "a" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSelectedIds(new Set(folderContents.map((f) => f.id)));
      }
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const ids = folderContents.map((f) => f.id);
        if (ids.length === 0) return;
        const currentIdx = selectedIds.size > 0 ? ids.indexOf(Array.from(selectedIds).pop()!) : -1;
        const nextIdx = e.key === "ArrowDown"
          ? Math.min(currentIdx + 1, ids.length - 1)
          : Math.max(currentIdx - 1, 0);
        setSelectedIds(new Set([ids[nextIdx]]));
      }
      if (e.key === " " && selectedIds.size === 1) {
        e.preventDefault();
        setShowPreview((p) => !p);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [currentFolderId, files, selectedIds, folderContents, renamingId, isCreateFolderOpen, viewingFile, editingFile, navigateTo, handleDoubleClick, handleDeleteSelected]);

  // ---- Sort ----
  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("asc"); }
  };

  const SortIndicator = ({ field }: { field: SortField }) =>
    sortField === field ? (
      sortDir === "asc" ? <ArrowUp className="w-3 h-3 inline ml-1" /> : <ArrowDown className="w-3 h-3 inline ml-1" />
    ) : null;

  // ---- Drag & Drop ----
  const handleDragStart = (e: React.DragEvent, fileId: string) => {
    e.dataTransfer.setData("text/plain", fileId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, folderId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverFolderId(folderId);
  };

  const handleDragLeave = () => setDragOverFolderId(null);

  const handleDrop = async (e: React.DragEvent, targetFolderId: string) => {
    e.preventDefault();
    setDragOverFolderId(null);
    const fileId = e.dataTransfer.getData("text/plain");
    if (fileId && fileId !== targetFolderId) {
      await handleMove(fileId, targetFolderId);
    }
  };

  // ---- Sidebar resize ----
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    const startX = e.clientX;
    const startWidth = sidebarWidth;
    const onMove = (ev: MouseEvent) => {
      const newWidth = Math.max(160, Math.min(400, startWidth + ev.clientX - startX));
      setSidebarWidth(newWidth);
    };
    const onUp = () => {
      setIsResizing(false);
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }, [sidebarWidth]);

  // Focus rename input
  useEffect(() => {
    if (renamingId && renameInputRef.current) {
      renameInputRef.current.focus();
      const dotIdx = renameValue.lastIndexOf(".");
      renameInputRef.current.setSelectionRange(0, dotIdx > 0 ? dotIdx : renameValue.length);
    }
  }, [renamingId, renameValue]);

  // ---- RENDER ----
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <RotateCcw className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-white rounded-xl border border-gray-200 overflow-hidden select-none">
      {/* ===== TOOLBAR ===== */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-200 bg-gray-50/80 shrink-0">
        {/* Navigation */}
        <div className="flex items-center gap-0.5">
          <button
            onClick={goBack}
            disabled={navIndex <= 0}
            className="p-1.5 rounded-md hover:bg-black/5 disabled:opacity-30 disabled:cursor-default transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={goForward}
            disabled={navIndex >= navHistory.length - 1}
            className="p-1.5 rounded-md hover:bg-black/5 disabled:opacity-30 disabled:cursor-default transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {/* Breadcrumb */}
        <div className="flex items-center gap-0.5 text-[13px] text-gray-500 min-w-0 flex-1">
          <button
            onClick={() => { setEditingPage(null); navigateTo(null); }}
            className={`px-2 py-1 rounded hover:bg-black/5 transition-colors shrink-0 ${
              !currentFolderId && !editingPage ? "text-gray-900 font-medium" : ""
            }`}
          >
            Dokumente
          </button>
          {breadcrumb.map((folder, i) => (
            <div key={folder.id} className="flex items-center min-w-0">
              <ChevronRight className="w-3 h-3 text-gray-400 shrink-0" />
              <button
                onClick={() => { setEditingPage(null); navigateTo(folder.id); }}
                className={`px-2 py-1 rounded hover:bg-black/5 transition-colors truncate max-w-[160px] ${
                  i === breadcrumb.length - 1 && !editingPage ? "text-gray-900 font-medium" : ""
                }`}
              >
                {folder.name}
              </button>
            </div>
          ))}
          {editingPage && (
            <div className="flex items-center min-w-0">
              <ChevronRight className="w-3 h-3 text-gray-400 shrink-0" />
              <span className="px-2 py-1 text-gray-900 font-medium truncate max-w-[200px]">
                {editingPage.name}
              </span>
              <button
                onClick={() => setEditingPageFullscreen(true)}
                className="ml-2 flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-white bg-[#0066FF] hover:bg-blue-700 rounded-md transition-colors"
              >
                <Edit3 className="w-3 h-3" />
                Bearbeiten
              </button>
            </div>
          )}
        </div>

        {/* Right toolbar */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Suchen"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-44 pl-8 pr-3 py-1.5 text-[13px] bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
            />
          </div>

          <div className="w-px h-5 bg-gray-200 mx-1" />

          {/* View modes */}
          <button
            onClick={() => setViewMode("grid")}
            className={`p-1.5 rounded-md transition-colors ${viewMode === "grid" ? "bg-gray-200" : "hover:bg-black/5"}`}
            title="Symbole"
          >
            <Grid3X3 className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-1.5 rounded-md transition-colors ${viewMode === "list" ? "bg-gray-200" : "hover:bg-black/5"}`}
            title="Liste"
          >
            <List className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={() => setViewMode("columns")}
            className={`p-1.5 rounded-md transition-colors ${viewMode === "columns" ? "bg-gray-200" : "hover:bg-black/5"}`}
            title="Spalten"
          >
            <Columns3 className="w-4 h-4 text-gray-600" />
          </button>

          <div className="w-px h-5 bg-gray-200 mx-1" />

          {/* Toggle sidebar */}
          <button
            onClick={() => setShowSidebar((p) => !p)}
            className={`p-1.5 rounded-md transition-colors ${showSidebar ? "bg-gray-200" : "hover:bg-black/5"}`}
            title="Seitenleiste"
          >
            <SidebarIcon className="w-4 h-4 text-gray-600" />
          </button>

          {/* Toggle preview */}
          <button
            onClick={() => setShowPreview((p) => !p)}
            className={`p-1.5 rounded-md transition-colors ${showPreview ? "bg-gray-200" : "hover:bg-black/5"}`}
            title="Vorschau"
          >
            <Eye className="w-4 h-4 text-gray-600" />
          </button>

          <div className="w-px h-5 bg-gray-200 mx-1" />

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            multiple
            className="hidden"
            accept=".docx,.xlsx,.pptx,.pdf,.txt,.jpg,.jpeg,.png"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="p-1.5 rounded-md hover:bg-black/5 transition-colors disabled:opacity-50"
            title="Hochladen"
          >
            {isUploading ? (
              <RotateCcw className="w-4 h-4 text-gray-600 animate-spin" />
            ) : (
              <Upload className="w-4 h-4 text-gray-600" />
            )}
          </button>
          <button
            onClick={handleCreatePage}
            className="p-1.5 rounded-md hover:bg-black/5 transition-colors"
            title="Neue Seite"
          >
            <FileText className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={() => setIsCreateFolderOpen(true)}
            className="p-1.5 rounded-md hover:bg-black/5 transition-colors"
            title="Neuer Ordner"
          >
            <Plus className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Upload progress bar */}
      {isUploading && (
        <div className="h-1 bg-gray-100 shrink-0">
          <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
        </div>
      )}

      {/* ===== MAIN BODY ===== */}
      <div className="flex flex-1 min-h-0">
        {/* ---- SIDEBAR ---- */}
        {showSidebar && (
          <>
            <div
              className="shrink-0 bg-gray-50/50 border-r border-gray-200 overflow-y-auto py-2"
              style={{ width: sidebarWidth }}
            >
              {/* Favourites */}
              <div className="px-3 mb-1">
                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Favoriten</span>
              </div>
              <div className="px-1 mb-3">
                <button
                  onClick={() => navigateTo(null)}
                  className={`w-full flex items-center gap-2 px-2 py-[3px] rounded-md text-[13px] transition-colors ${
                    currentFolderId === null
                      ? "bg-blue-500/15 text-blue-700 font-medium"
                      : "text-gray-700 hover:bg-black/5"
                  }`}
                >
                  <Home className="w-4 h-4 text-blue-400" />
                  <span>Dokumente</span>
                </button>
              </div>

              {/* Folder tree */}
              <div className="px-3 mb-1">
                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Inhalt</span>
              </div>
              <div className="px-1">
                {rootFiles
                  .sort((a, b) => a.name.localeCompare(b.name, "de"))
                  .map((file) => (
                    <TreeNode
                      key={file.id}
                      file={file}
                      files={files}
                      currentFolderId={currentFolderId}
                      onNavigate={navigateTo}
                      onOpenFile={handleDoubleClick}
                      expandedFolders={expandedFolders}
                      toggleExpand={toggleExpand}
                    />
                  ))}
              </div>
            </div>

            {/* Resize handle */}
            <div
              className={`w-[3px] shrink-0 cursor-col-resize hover:bg-blue-400/40 transition-colors ${
                isResizing ? "bg-blue-400/60" : ""
              }`}
              onMouseDown={handleResizeStart}
            />
          </>
        )}

        {/* ---- CONTENT ---- */}
        <div
          ref={contentRef}
          className="flex-1 min-w-0 overflow-auto bg-white"
          onClick={(e) => {
            if (!editingPage && e.target === e.currentTarget) setSelectedIds(new Set());
          }}
          onContextMenu={(e) => {
            if (e.target === e.currentTarget) {
              e.preventDefault();
            }
          }}
        >
          {editingPage ? (
            /* Page Preview */
            <div className="h-full overflow-y-auto">
              <div className="max-w-[720px] mx-auto px-8 py-10">
                <h1 className="text-[2rem] font-bold text-gray-900 mb-8">{editingPage.name}</h1>
                {editingPage.content ? (
                  <div
                    className="prose prose-sm max-w-none text-gray-700 leading-relaxed"
                    style={{ fontSize: "15px", lineHeight: "1.8" }}
                    dangerouslySetInnerHTML={{ __html: editingPage.content }}
                  />
                ) : (
                  <p className="text-gray-400 text-sm">Diese Seite ist noch leer. Klicke &quot;Bearbeiten&quot; um Inhalte hinzuzufügen.</p>
                )}
              </div>
            </div>
          ) : folderContents.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <FolderOpen className="w-16 h-16 mb-3 text-gray-200" />
              <p className="text-sm mb-1">Dieser Ordner ist leer</p>
              <p className="text-xs text-gray-300">Dateien hierher ziehen oder hochladen</p>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded-md text-gray-600 transition-colors"
                >
                  Hochladen
                </button>
                <button
                  onClick={handleCreatePage}
                  className="px-3 py-1.5 text-xs bg-[#0066FF] hover:bg-blue-700 rounded-md text-white transition-colors"
                >
                  Neue Seite
                </button>
                <button
                  onClick={() => setIsCreateFolderOpen(true)}
                  className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded-md text-gray-600 transition-colors"
                >
                  Neuer Ordner
                </button>
              </div>
            </div>
          ) : viewMode === "grid" ? (
            /* ---- GRID VIEW ---- */
            <div className="p-4 grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-1">
              {folderContents.map((file) => (
                <div
                  key={file.id}
                  className={`flex flex-col items-center p-3 rounded-lg cursor-default transition-colors ${
                    selectedIds.has(file.id)
                      ? "bg-blue-500/10 ring-1 ring-blue-400/30"
                      : "hover:bg-gray-50"
                  } ${dragOverFolderId === file.id ? "ring-2 ring-blue-400 bg-blue-50" : ""}`}
                  draggable={file.type !== "folder"}
                  onDragStart={(e) => handleDragStart(e, file.id)}
                  onDragOver={file.type === "folder" ? (e) => handleDragOver(e, file.id) : undefined}
                  onDragLeave={file.type === "folder" ? handleDragLeave : undefined}
                  onDrop={file.type === "folder" ? (e) => handleDrop(e, file.id) : undefined}
                  onClick={(e) => handleSelect(file, e)}
                  onDoubleClick={() => handleDoubleClick(file)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSelectedIds(new Set([file.id]));
                    setContextMenu({ x: e.clientX, y: e.clientY, file });
                  }}
                >
                  <div className="mb-1.5">
                    {file.type === "folder" ? (
                      <Folder className="w-12 h-12 text-blue-400" />
                    ) : file.type === "image" && file.fileData ? (
                      <img
                        src={`data:${file.mimeType};base64,${file.fileData}`}
                        alt={file.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                    ) : (
                      <div className="w-12 h-12 flex items-center justify-center">
                        {getFileIcon(file.type, 10)}
                      </div>
                    )}
                  </div>
                  {renamingId === file.id ? (
                    <input
                      ref={renameInputRef}
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onBlur={() => handleRename(file.id, renameValue)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleRename(file.id, renameValue);
                        if (e.key === "Escape") setRenamingId(null);
                      }}
                      className="text-[11px] text-center w-full bg-white border border-blue-400 rounded px-1 py-0.5 focus:outline-none"
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span className="text-[11px] text-center text-gray-800 leading-tight w-full truncate px-1">
                      {file.name}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : viewMode === "list" ? (
            /* ---- LIST VIEW ---- */
            <table className="w-full text-[13px]">
              <thead className="sticky top-0 bg-gray-50/95 backdrop-blur-sm z-10 border-b border-gray-200">
                <tr>
                  <th
                    className="text-left py-1.5 px-3 font-medium text-gray-500 cursor-pointer hover:text-gray-800 select-none"
                    onClick={() => toggleSort("name")}
                  >
                    Name <SortIndicator field="name" />
                  </th>
                  <th
                    className="text-left py-1.5 px-3 font-medium text-gray-500 cursor-pointer hover:text-gray-800 select-none w-32"
                    onClick={() => toggleSort("updatedAt")}
                  >
                    Geaendert <SortIndicator field="updatedAt" />
                  </th>
                  <th
                    className="text-left py-1.5 px-3 font-medium text-gray-500 cursor-pointer hover:text-gray-800 select-none w-28"
                    onClick={() => toggleSort("size")}
                  >
                    Groesse <SortIndicator field="size" />
                  </th>
                  <th
                    className="text-left py-1.5 px-3 font-medium text-gray-500 cursor-pointer hover:text-gray-800 select-none w-36"
                    onClick={() => toggleSort("type")}
                  >
                    Art <SortIndicator field="type" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {folderContents.map((file) => (
                  <tr
                    key={file.id}
                    className={`border-b border-gray-100 cursor-default transition-colors ${
                      selectedIds.has(file.id)
                        ? "bg-blue-500 text-white"
                        : "hover:bg-gray-50"
                    } ${dragOverFolderId === file.id ? "ring-2 ring-blue-400 ring-inset" : ""}`}
                    draggable={file.type !== "folder"}
                    onDragStart={(e) => handleDragStart(e, file.id)}
                    onDragOver={file.type === "folder" ? (e) => handleDragOver(e, file.id) : undefined}
                    onDragLeave={file.type === "folder" ? handleDragLeave : undefined}
                    onDrop={file.type === "folder" ? (e) => handleDrop(e, file.id) : undefined}
                    onClick={(e) => handleSelect(file, e)}
                    onDoubleClick={() => handleDoubleClick(file)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedIds(new Set([file.id]));
                      setContextMenu({ x: e.clientX, y: e.clientY, file });
                    }}
                  >
                    <td className="py-1.5 px-3">
                      <div className="flex items-center gap-2 min-w-0">
                        {getFileIcon(file.type, 4)}
                        {renamingId === file.id ? (
                          <input
                            ref={renameInputRef}
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onBlur={() => handleRename(file.id, renameValue)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleRename(file.id, renameValue);
                              if (e.key === "Escape") setRenamingId(null);
                            }}
                            className="text-[13px] bg-white text-gray-900 border border-blue-400 rounded px-1 py-0 focus:outline-none flex-1 min-w-0"
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <span className="truncate">{file.name}</span>
                        )}
                      </div>
                    </td>
                    <td className={`py-1.5 px-3 ${selectedIds.has(file.id) ? "text-white/70" : "text-gray-500"}`}>
                      {format(new Date(file.updatedAt), "dd.MM.yyyy HH:mm", { locale: de })}
                    </td>
                    <td className={`py-1.5 px-3 tabular-nums ${selectedIds.has(file.id) ? "text-white/70" : "text-gray-500"}`}>
                      {file.type === "folder" ? "--" : formatSize(file.size)}
                    </td>
                    <td className={`py-1.5 px-3 ${selectedIds.has(file.id) ? "text-white/70" : "text-gray-500"}`}>
                      {getKindLabel(file.type)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            /* ---- COLUMN VIEW ---- */
            <ColumnView
              files={files}
              currentFolderId={currentFolderId}
              selectedIds={selectedIds}
              onNavigate={navigateTo}
              onSelect={handleSelect}
              onDoubleClick={handleDoubleClick}
              onContextMenu={(e, file) => {
                e.preventDefault();
                e.stopPropagation();
                setSelectedIds(new Set([file.id]));
                setContextMenu({ x: e.clientX, y: e.clientY, file });
              }}
              getFileIcon={getFileIcon}
              getBreadcrumb={getBreadcrumb}
            />
          )}
        </div>

        {/* ---- PREVIEW PANEL ---- */}
        {showPreview && (
          <div className="w-[260px] shrink-0 border-l border-gray-200 bg-gray-50/50 p-4 overflow-y-auto">
            {selectedFile ? (
              <div className="flex flex-col items-center">
                <div className="mb-3">
                  {selectedFile.type === "image" && selectedFile.fileData ? (
                    <img
                      src={`data:${selectedFile.mimeType};base64,${selectedFile.fileData}`}
                      alt={selectedFile.name}
                      className="w-32 h-32 object-cover rounded-lg shadow-sm"
                    />
                  ) : selectedFile.type === "folder" ? (
                    <Folder className="w-20 h-20 text-blue-400" />
                  ) : (
                    <div className="w-20 h-20 flex items-center justify-center">
                      {getFileIcon(selectedFile.type, 16)}
                    </div>
                  )}
                </div>
                <h3 className="text-[13px] font-semibold text-gray-900 text-center mb-1 break-all">
                  {selectedFile.name}
                </h3>
                <p className="text-[11px] text-gray-400 mb-4">{getKindLabel(selectedFile.type)}</p>

                <div className="w-full space-y-2 text-[12px]">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Groesse</span>
                    <span className="text-gray-700 tabular-nums">{formatSize(selectedFile.size)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Erstellt</span>
                    <span className="text-gray-700">
                      {format(new Date(selectedFile.createdAt), "dd.MM.yyyy", { locale: de })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Geaendert</span>
                    <span className="text-gray-700">
                      {format(new Date(selectedFile.updatedAt), "dd.MM.yyyy", { locale: de })}
                    </span>
                  </div>
                  {selectedFile.type !== "folder" && (
                    <div className="pt-3 flex flex-col gap-1.5">
                      <button
                        onClick={() => handleView(selectedFile)}
                        className="w-full text-left px-2 py-1.5 rounded text-[12px] bg-blue-500 text-white hover:bg-blue-600 transition-colors text-center"
                      >
                        Anzeigen
                      </button>
                      {isEditable(selectedFile.type) && (
                        <button
                          onClick={() => handleEdit(selectedFile)}
                          className="w-full text-left px-2 py-1.5 rounded text-[12px] bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors text-center"
                        >
                          Bearbeiten
                        </button>
                      )}
                      <button
                        onClick={() => handleDownload(selectedFile)}
                        className="w-full text-left px-2 py-1.5 rounded text-[12px] bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors text-center"
                      >
                        Herunterladen
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : selectedIds.size > 1 ? (
              <div className="text-center text-gray-400 text-[13px] pt-8">
                {selectedIds.size} Elemente ausgewaehlt
              </div>
            ) : (
              <div className="text-center text-gray-300 text-[13px] pt-8">
                Keine Auswahl
              </div>
            )}
          </div>
        )}
      </div>

      {/* ===== STATUS BAR ===== */}
      <div className="flex items-center justify-between px-3 py-1 border-t border-gray-200 bg-gray-50/80 text-[11px] text-gray-400 shrink-0">
        <span>
          {folderContents.length} Element{folderContents.length !== 1 ? "e" : ""}
          {selectedIds.size > 0 && ` — ${selectedIds.size} ausgewaehlt`}
        </span>
        <span>
          {files.filter((f) => f.type !== "folder").length} Dateien, {files.filter((f) => f.type === "folder").length} Ordner insgesamt
        </span>
      </div>

      {/* ===== CONTEXT MENU ===== */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          file={contextMenu.file}
          onClose={() => setContextMenu(null)}
          onOpen={() => handleDoubleClick(contextMenu.file)}
          onRename={() => {
            setRenamingId(contextMenu.file.id);
            setRenameValue(contextMenu.file.name);
          }}
          onDownload={() => handleDownload(contextMenu.file)}
          onDelete={() => handleDelete(contextMenu.file.id)}
          onGetInfo={() => {
            setSelectedIds(new Set([contextMenu.file.id]));
            setShowPreview(true);
          }}
        />
      )}

      {/* ===== DIALOGS ===== */}

      {/* Create Folder */}
      <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Neuer Ordner</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <Input
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Ordnername"
              autoFocus
              onKeyDown={(e) => { if (e.key === "Enter") handleCreateFolder(); }}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateFolderOpen(false)}>
                Abbrechen
              </Button>
              <Button onClick={handleCreateFolder} className="bg-blue-500 hover:bg-blue-600">
                Erstellen
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View File */}
      <Dialog open={!!viewingFile} onOpenChange={() => setViewingFile(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                {viewingFile && getFileIcon(viewingFile.type, 5)}
                {viewingFile?.name}
              </span>
              <div className="flex gap-2">
                {viewingFile && isEditable(viewingFile.type) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setViewingFile(null);
                      viewingFile && handleEdit(viewingFile);
                    }}
                  >
                    <Edit3 className="w-3 h-3 mr-1" /> Bearbeiten
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => viewingFile && handleDownload(viewingFile)}>
                  <Download className="w-3 h-3 mr-1" /> Download
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {viewingFile?.type === "image" && viewingFile.fileData && (
              <img
                src={`data:${viewingFile.mimeType};base64,${viewingFile.fileData}`}
                alt={viewingFile.name}
                className="max-w-full max-h-[60vh] mx-auto"
              />
            )}
            {viewingFile?.type === "pdf" && viewingFile.fileData && (
              <iframe
                src={`data:${viewingFile.mimeType};base64,${viewingFile.fileData}`}
                className="w-full h-[60vh]"
                title={viewingFile.name}
              />
            )}
            {viewingFile?.type === "docx" && viewingFile.content && (
              <div
                className="border rounded-lg p-8 bg-white min-h-[400px] prose max-w-none"
                dangerouslySetInnerHTML={{ __html: viewingFile.content }}
              />
            )}
            {viewingFile?.type === "xlsx" && viewingFile.sheetData && (
              <ExcelViewer sheetData={viewingFile.sheetData} />
            )}
            {viewingFile?.type === "other" && (
              <div className="text-center p-12 text-gray-500">
                <FileIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>Vorschau nicht verfuegbar</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Editor */}
      <Dialog open={!!editingFile} onOpenChange={(open) => { if (!open) setEditingFile(null); }}>
        <DialogContent className="max-w-6xl h-[95vh] p-0 overflow-hidden" aria-description="Document editor">
          <DialogTitle className="sr-only">{editingFile?.name || "Editor"}</DialogTitle>
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

      {/* Collabora */}
      {collaboraFile && (
        <CollaboraEditor
          fileId={collaboraFile.id}
          fileName={collaboraFile.name}
          onClose={() => setCollaboraFile(null)}
        />
      )}

      {/* Fullscreen Page Editor */}
      {editingPageFullscreen && editingPage && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col">
          {/* Top bar */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 bg-white shrink-0">
            <button
              onClick={async () => {
                setEditingPageFullscreen(false);
                // Reload the page content to show updated preview
                const res = await fetch(`/api/documents/${editingPage.id}`);
                if (res.ok) {
                  const updated = await res.json();
                  setEditingPage(updated);
                }
                reloadFiles();
              }}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowUp className="w-4 h-4 -rotate-90" />
              Zurück zur Vorschau
            </button>
            <span className="text-xs text-gray-400">{editingPage.name}</span>
          </div>
          {/* Editor */}
          <div className="flex-1 min-h-0">
            <PageEditor
              initialContent={editingPage.content || ""}
              title={editingPage.name}
              onTitleChange={async (t) => {
                setEditingPage((prev) => prev ? { ...prev, name: t } : prev);
                await fetch(`/api/documents/${editingPage.id}`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ name: t }),
                });
              }}
              onSave={async (html) => {
                setEditingPage((prev) => prev ? { ...prev, content: html } : prev);
                await fetch(`/api/documents/${editingPage.id}`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ content: html }),
                });
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ===== COLUMN VIEW COMPONENT =====
function ColumnView({
  files,
  currentFolderId,
  selectedIds,
  onNavigate,
  onSelect,
  onDoubleClick,
  onContextMenu,
  getFileIcon,
  getBreadcrumb,
}: {
  files: DocumentFile[];
  currentFolderId: string | null;
  selectedIds: Set<string>;
  onNavigate: (id: string | null) => void;
  onSelect: (file: DocumentFile, e: React.MouseEvent) => void;
  onDoubleClick: (file: DocumentFile) => void;
  onContextMenu: (e: React.MouseEvent, file: DocumentFile) => void;
  getFileIcon: (type: string, size?: number) => React.ReactNode;
  getBreadcrumb: (id: string | null) => DocumentFile[];
}) {
  // Build column chain: root -> breadcrumb folders -> current folder contents
  const breadcrumb = getBreadcrumb(currentFolderId);
  const columns: { parentId: string | null; items: DocumentFile[] }[] = [];

  // Root column
  columns.push({
    parentId: null,
    items: files.filter((f) => f.parentId === null).sort((a, b) => {
      if (a.type === "folder" && b.type !== "folder") return -1;
      if (a.type !== "folder" && b.type === "folder") return 1;
      return a.name.localeCompare(b.name, "de");
    }),
  });

  // Breadcrumb columns
  for (const folder of breadcrumb) {
    columns.push({
      parentId: folder.id,
      items: files.filter((f) => f.parentId === folder.id).sort((a, b) => {
        if (a.type === "folder" && b.type !== "folder") return -1;
        if (a.type !== "folder" && b.type === "folder") return 1;
        return a.name.localeCompare(b.name, "de");
      }),
    });
  }

  const breadcrumbIds = new Set(breadcrumb.map((f) => f.id));

  return (
    <div className="flex h-full overflow-x-auto">
      {columns.map((col, ci) => (
        <div key={ci} className="min-w-[220px] max-w-[280px] border-r border-gray-200 overflow-y-auto shrink-0">
          {col.items.map((file) => {
            const isInPath = breadcrumbIds.has(file.id) || currentFolderId === file.id;
            const isSelected = selectedIds.has(file.id);
            const hasChildren = file.type === "folder" && files.some((f) => f.parentId === file.id);

            return (
              <div
                key={file.id}
                className={`flex items-center gap-2 px-3 py-1.5 text-[13px] cursor-default transition-colors ${
                  isSelected
                    ? "bg-blue-500 text-white"
                    : isInPath
                    ? "bg-blue-100/60 text-gray-900"
                    : "hover:bg-gray-50 text-gray-800"
                }`}
                onClick={(e) => {
                  onSelect(file, e);
                  if (file.type === "folder") onNavigate(file.id);
                }}
                onDoubleClick={() => onDoubleClick(file)}
                onContextMenu={(e) => onContextMenu(e, file)}
              >
                {getFileIcon(file.type, 4)}
                <span className="flex-1 truncate">{file.name}</span>
                {hasChildren && (
                  <ChevronRight className={`w-3 h-3 shrink-0 ${isSelected ? "text-white/70" : "text-gray-400"}`} />
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
