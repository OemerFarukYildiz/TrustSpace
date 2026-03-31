"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useMemo,
} from "react";
import { useEditor, EditorContent, Extension } from "@tiptap/react";
import { Node, mergeAttributes } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Heading from "@tiptap/extension-heading";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import CodeBlock from "@tiptap/extension-code-block";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Highlight from "@tiptap/extension-highlight";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  ListChecks,
  Link as LinkIcon,
  Image as ImageIcon,
  Code,
  Table as TableIcon,
  Minus,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Highlighter,
  ChevronDown,
  Check,
  Type,
  Heading1,
  Heading2,
  Heading3,
  Trash2,
  LayoutGrid,
  Info,
  AlertTriangle,
  CheckCircle,
  XCircle,
  LayoutDashboard,
  ShieldAlert,
  FileText,
  Building2,
  Search,
  ClipboardList,
  Users,
  Bug,
  BookOpen,
  GripVertical,
  Undo2,
  Redo2,
  Hash,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Props Interface ──────────────────────────────────────────────────────────

interface PageEditorProps {
  initialContent?: string;
  onSave: (html: string) => void;
  title: string;
  onTitleChange: (title: string) => void;
  readOnly?: boolean;
}

// ─── Module Mention Data ──────────────────────────────────────────────────────

interface MentionItem {
  id: string;
  label: string;
  route: string;
  icon: React.ReactNode;
}

const MENTION_ITEMS: MentionItem[] = [
  { id: "dashboard", label: "Dashboard", route: "/dashboard", icon: <LayoutDashboard className="w-3.5 h-3.5" /> },
  { id: "risks", label: "Risiken & Assets", route: "/risks", icon: <ShieldAlert className="w-3.5 h-3.5" /> },
  { id: "soa", label: "SOA", route: "/soa", icon: <BookOpen className="w-3.5 h-3.5" /> },
  { id: "documents", label: "Dokumente", route: "/documents", icon: <FileText className="w-3.5 h-3.5" /> },
  { id: "vendors", label: "Lieferanten", route: "/vendors", icon: <Building2 className="w-3.5 h-3.5" /> },
  { id: "findings", label: "Findings", route: "/findings", icon: <Search className="w-3.5 h-3.5" /> },
  { id: "audits", label: "Audits", route: "/audits", icon: <ClipboardList className="w-3.5 h-3.5" /> },
  { id: "employees", label: "Mitarbeiter", route: "/employees", icon: <Users className="w-3.5 h-3.5" /> },
  { id: "vulnerabilities", label: "Schwachstellen", route: "/vulnerabilities", icon: <Bug className="w-3.5 h-3.5" /> },
];

// ─── Callout Node Extension ───────────────────────────────────────────────────

type CalloutType = "info" | "warning" | "success" | "error";

const CALLOUT_STYLES: Record<CalloutType, { bg: string; border: string; icon: React.ReactNode; label: string }> = {
  info:    { bg: "#eff6ff", border: "#3b82f6", icon: <Info className="w-4 h-4" />,          label: "Info" },
  warning: { bg: "#fffbeb", border: "#f59e0b", icon: <AlertTriangle className="w-4 h-4" />, label: "Hinweis" },
  success: { bg: "#f0fdf4", border: "#22c55e", icon: <CheckCircle className="w-4 h-4" />,   label: "Erfolg" },
  error:   { bg: "#fef2f2", border: "#ef4444", icon: <XCircle className="w-4 h-4" />,       label: "Fehler" },
};

const CalloutNode = Node.create({
  name: "callout",
  group: "block",
  content: "block+",
  defining: true,
  isolating: false,

  addAttributes() {
    return {
      type: {
        default: "info",
        parseHTML: (el) => el.getAttribute("data-callout-type"),
        renderHTML: (attrs) => ({ "data-callout-type": attrs.type }),
      },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-callout-type]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { class: "callout-block" }), 0];
  },

  // No custom keyboard shortcuts - let Tiptap handle everything natively
});

// ─── Slash Command Data ───────────────────────────────────────────────────────

interface SlashItem {
  label: string;
  description: string;
  icon: React.ReactNode;
  keywords?: string[];
  action: (editor: ReturnType<typeof useEditor>, slashFrom: number) => void;
}

function getSlashItems(): SlashItem[] {
  return [
    {
      label: "Überschrift 1",
      description: "Große Abschnittsüberschrift",
      icon: <Heading1 className="w-4 h-4" />,
      keywords: ["h1", "heading", "überschrift"],
      action: (editor, slashFrom) => {
        if (!editor) return;
        editor.chain().focus()
          .deleteRange({ from: slashFrom, to: editor.state.selection.from })
          .toggleHeading({ level: 1 })
          .run();
      },
    },
    {
      label: "Überschrift 2",
      description: "Mittlere Abschnittsüberschrift",
      icon: <Heading2 className="w-4 h-4" />,
      keywords: ["h2", "heading", "überschrift"],
      action: (editor, slashFrom) => {
        if (!editor) return;
        editor.chain().focus()
          .deleteRange({ from: slashFrom, to: editor.state.selection.from })
          .toggleHeading({ level: 2 })
          .run();
      },
    },
    {
      label: "Überschrift 3",
      description: "Kleine Abschnittsüberschrift",
      icon: <Heading3 className="w-4 h-4" />,
      keywords: ["h3", "heading", "überschrift"],
      action: (editor, slashFrom) => {
        if (!editor) return;
        editor.chain().focus()
          .deleteRange({ from: slashFrom, to: editor.state.selection.from })
          .toggleHeading({ level: 3 })
          .run();
      },
    },
    {
      label: "Aufzählung",
      description: "Ungeordnete Liste",
      icon: <List className="w-4 h-4" />,
      keywords: ["bullet", "list", "liste", "aufzählung"],
      action: (editor, slashFrom) => {
        if (!editor) return;
        editor.chain().focus()
          .deleteRange({ from: slashFrom, to: editor.state.selection.from })
          .toggleBulletList()
          .run();
      },
    },
    {
      label: "Nummerierte Liste",
      description: "Geordnete Liste mit Nummern",
      icon: <ListOrdered className="w-4 h-4" />,
      keywords: ["numbered", "ordered", "nummeriert"],
      action: (editor, slashFrom) => {
        if (!editor) return;
        editor.chain().focus()
          .deleteRange({ from: slashFrom, to: editor.state.selection.from })
          .toggleOrderedList()
          .run();
      },
    },
    {
      label: "Aufgabenliste",
      description: "Liste mit Checkboxen",
      icon: <ListChecks className="w-4 h-4" />,
      keywords: ["task", "todo", "checkbox", "aufgabe"],
      action: (editor, slashFrom) => {
        if (!editor) return;
        editor.chain().focus()
          .deleteRange({ from: slashFrom, to: editor.state.selection.from })
          .toggleTaskList()
          .run();
      },
    },
    {
      label: "Code-Block",
      description: "Monospace Code-Bereich",
      icon: <Code className="w-4 h-4" />,
      keywords: ["code", "snippet", "programmierung"],
      action: (editor, slashFrom) => {
        if (!editor) return;
        editor.chain().focus()
          .deleteRange({ from: slashFrom, to: editor.state.selection.from })
          .toggleCodeBlock()
          .run();
      },
    },
    {
      label: "Tabelle",
      description: "3×3 Tabelle einfügen",
      icon: <TableIcon className="w-4 h-4" />,
      keywords: ["table", "tabelle", "grid"],
      action: (editor, slashFrom) => {
        if (!editor) return;
        editor.chain().focus()
          .deleteRange({ from: slashFrom, to: editor.state.selection.from })
          .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
          .run();
      },
    },
    {
      label: "Trennlinie",
      description: "Horizontale Linie",
      icon: <Minus className="w-4 h-4" />,
      keywords: ["hr", "divider", "separator", "linie"],
      action: (editor, slashFrom) => {
        if (!editor) return;
        editor.chain().focus()
          .deleteRange({ from: slashFrom, to: editor.state.selection.from })
          .setHorizontalRule()
          .run();
      },
    },
    {
      label: "Bild",
      description: "Bild per URL einfügen",
      icon: <ImageIcon className="w-4 h-4" />,
      keywords: ["image", "bild", "foto", "url"],
      action: (editor, slashFrom) => {
        if (!editor) return;
        editor.chain().focus()
          .deleteRange({ from: slashFrom, to: editor.state.selection.from })
          .run();
        const url = window.prompt("Bild-URL eingeben:");
        if (url) editor.chain().focus().setImage({ src: url }).run();
      },
    },
    {
      label: "Info-Box",
      description: "Blaue Info-Callout-Box",
      icon: <Info className="w-4 h-4 text-blue-500" />,
      keywords: ["info", "callout", "box", "hinweis"],
      action: (editor, slashFrom) => {
        if (!editor) return;
        editor.chain().focus()
          .deleteRange({ from: slashFrom, to: editor.state.selection.from })
          .insertContent({
            type: "callout",
            attrs: { type: "info" },
            content: [{ type: "paragraph", content: [{ type: "text", text: "Info-Text..." }] }],
          })
          .run();
      },
    },
    {
      label: "Hinweis-Box",
      description: "Gelbe Warnung-Callout-Box",
      icon: <AlertTriangle className="w-4 h-4 text-amber-500" />,
      keywords: ["warning", "warnung", "hinweis", "achtung"],
      action: (editor, slashFrom) => {
        if (!editor) return;
        editor.chain().focus()
          .deleteRange({ from: slashFrom, to: editor.state.selection.from })
          .insertContent({
            type: "callout",
            attrs: { type: "warning" },
            content: [{ type: "paragraph", content: [{ type: "text", text: "Hinweis-Text..." }] }],
          })
          .run();
      },
    },
    {
      label: "Erfolg-Box",
      description: "Grüne Erfolg-Callout-Box",
      icon: <CheckCircle className="w-4 h-4 text-green-500" />,
      keywords: ["success", "erfolg", "ok", "grün"],
      action: (editor, slashFrom) => {
        if (!editor) return;
        editor.chain().focus()
          .deleteRange({ from: slashFrom, to: editor.state.selection.from })
          .insertContent({
            type: "callout",
            attrs: { type: "success" },
            content: [{ type: "paragraph", content: [{ type: "text", text: "Erfolg-Text..." }] }],
          })
          .run();
      },
    },
    {
      label: "Fehler-Box",
      description: "Rote Fehler-Callout-Box",
      icon: <XCircle className="w-4 h-4 text-red-500" />,
      keywords: ["error", "fehler", "rot", "kritisch"],
      action: (editor, slashFrom) => {
        if (!editor) return;
        editor.chain().focus()
          .deleteRange({ from: slashFrom, to: editor.state.selection.from })
          .insertContent({
            type: "callout",
            attrs: { type: "error" },
            content: [{ type: "paragraph", content: [{ type: "text", text: "Fehler-Text..." }] }],
          })
          .run();
      },
    },
  ];
}

const ALL_SLASH_ITEMS = getSlashItems();

// ─── Text Style Config ────────────────────────────────────────────────────────

const TEXT_STYLES = [
  { label: "Absatz", value: "paragraph", icon: <Type className="w-3.5 h-3.5" /> },
  { label: "Überschrift 1", value: "h1", icon: <Heading1 className="w-3.5 h-3.5" /> },
  { label: "Überschrift 2", value: "h2", icon: <Heading2 className="w-3.5 h-3.5" /> },
  { label: "Überschrift 3", value: "h3", icon: <Heading3 className="w-3.5 h-3.5" /> },
];

// ─── Sub-Components ───────────────────────────────────────────────────────────

function ToolbarButton({
  onClick,
  active,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      disabled={disabled}
      title={title}
      aria-label={title}
      aria-pressed={active}
      className={cn(
        "relative inline-flex items-center justify-center w-7 h-7 rounded-[5px] text-sm transition-all duration-100 select-none",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066FF]/40",
        "disabled:opacity-40 disabled:cursor-not-allowed",
        active
          ? "bg-[#0066FF]/10 text-[#0066FF]"
          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
      )}
    >
      {children}
    </button>
  );
}

function ToolbarSeparator() {
  return <div className="w-px h-5 bg-gray-200 mx-1 shrink-0" />;
}

// ─── Callout Renderer (React) ─────────────────────────────────────────────────

function CalloutBlock({
  type,
  children,
}: {
  type: CalloutType;
  children: React.ReactNode;
}) {
  const style = CALLOUT_STYLES[type];
  return (
    <div
      className="callout-block-react my-3 flex gap-3 rounded-lg px-4 py-3"
      style={{ background: style.bg, borderLeft: `3px solid ${style.border}` }}
    >
      <span className="flex-shrink-0 mt-0.5" style={{ color: style.border }}>
        {style.icon}
      </span>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

// ─── Word Count ───────────────────────────────────────────────────────────────

function getWordCount(html: string): number {
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  if (!text) return 0;
  return text.split(" ").filter(Boolean).length;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PageEditor({
  initialContent = "",
  onSave,
  title,
  onTitleChange,
  readOnly = false,
}: PageEditorProps) {
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [wordCount, setWordCount] = useState(0);
  const [headings, setHeadings] = useState<{ level: number; text: string; id: string }[]>([]);
  const [showToc, setShowToc] = useState(true);

  // Text style dropdown
  const [textStyleOpen, setTextStyleOpen] = useState(false);
  const textStyleRef = useRef<HTMLDivElement>(null);

  // Slash command state — store the "from" position where "/" was typed
  const [slashOpen, setSlashOpen] = useState(false);
  const [slashFrom, setSlashFrom] = useState(0);
  const [slashIndex, setSlashIndex] = useState(0);
  const [slashQuery, setSlashQuery] = useState("");
  const [slashCoords, setSlashCoords] = useState({ top: 0, left: 0 });
  const slashMenuRef = useRef<HTMLDivElement>(null);

  // @ mention state
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionFrom, setMentionFrom] = useState(0);
  const [mentionIndex, setMentionIndex] = useState(0);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionCoords, setMentionCoords] = useState({ top: 0, left: 0 });
  const mentionMenuRef = useRef<HTMLDivElement>(null);

  // Table context menu
  const [tableMenuOpen, setTableMenuOpen] = useState(false);
  const tableMenuRef = useRef<HTMLDivElement>(null);

  // Scroll state for toolbar shadow
  const [scrolled, setScrolled] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // ── Filtered lists ──────────────────────────────────────────────────────

  const filteredSlash = useMemo(() => {
    if (!slashQuery) return ALL_SLASH_ITEMS;
    const q = slashQuery.toLowerCase();
    return ALL_SLASH_ITEMS.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        (item.keywords ?? []).some((k) => k.includes(q))
    );
  }, [slashQuery]);

  const filteredMentions = useMemo(() => {
    if (!mentionQuery) return MENTION_ITEMS;
    const q = mentionQuery.toLowerCase();
    return MENTION_ITEMS.filter((m) => m.label.toLowerCase().includes(q));
  }, [mentionQuery]);

  // ── Get cursor DOM coordinates ──────────────────────────────────────────

  const getCursorCoords = useCallback(
    (containerEl: Element | null): { top: number; left: number } => {
      const domSel = window.getSelection();
      if (!domSel || domSel.rangeCount === 0) return { top: 0, left: 0 };
      const range = domSel.getRangeAt(0).cloneRange();
      range.collapse(true);
      const rect = range.getBoundingClientRect();
      const containerRect = containerEl?.getBoundingClientRect() ?? { top: 0, left: 0 };
      return {
        top: rect.bottom - containerRect.top + 4,
        left: Math.max(0, rect.left - containerRect.left),
      };
    },
    []
  );

  // ── Editor ─────────────────────────────────────────────────────────────

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        horizontalRule: false,
      }),
      Placeholder.configure({
        placeholder: "Drücke '/' für Befehle oder fange einfach an zu schreiben...",
      }),
      Heading.configure({ levels: [1, 2, 3] }),
      Image.configure({ inline: false, allowBase64: true }),
      Link.configure({ openOnClick: false, autolink: true }),
      CodeBlock,
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      HorizontalRule,
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Highlight.configure({ multicolor: false }),
      CalloutNode,
    ],
    content: initialContent || "",
    editable: !readOnly,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setWordCount(getWordCount(html));
      setSaveStatus("saving");
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        onSave(html);
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2500);
      }, 1500);
    },
  });

  // ── Keyboard handler for slash + mention menus ──────────────────────────
  // IMPORTANT: We use the non-capture phase so we only intercept when menus
  // are open, and we do NOT block normal editing keystrokes when menus are closed.

  useEffect(() => {
    if (!editor) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // This handler is ONLY attached when slashOpen or mentionOpen is true

      // ── Slash menu handling ─────────────────────────────────────────────
      if (slashOpen) {
        if (event.key === "ArrowDown") {
          event.preventDefault();
          setSlashIndex((i) => (i + 1) % Math.max(1, filteredSlash.length));
          return;
        }
        if (event.key === "ArrowUp") {
          event.preventDefault();
          setSlashIndex((i) =>
            (i - 1 + Math.max(1, filteredSlash.length)) % Math.max(1, filteredSlash.length)
          );
          return;
        }
        if (event.key === "Enter") {
          event.preventDefault();
          const item = filteredSlash[slashIndex];
          if (item) {
            item.action(editor, slashFrom);
            setSlashOpen(false);
          }
          return;
        }
        if (event.key === "Escape") {
          event.preventDefault();
          setSlashOpen(false);
          return;
        }
        // Backspace: if query is empty, close menu; otherwise let editor handle it
        // and update our query mirror on next tick
        if (event.key === "Backspace") {
          if (slashQuery === "") {
            setSlashOpen(false);
            // Let Tiptap handle the actual backspace (delete the "/")
            return;
          }
          // Let the editor handle backspace, update our query by reading the doc after
          setTimeout(() => {
            if (!editor) return;
            const { from } = editor.state.selection;
            const currentSlashFrom = slashFrom;
            if (from <= currentSlashFrom) {
              setSlashOpen(false);
              return;
            }
            const query = editor.state.doc.textBetween(currentSlashFrom, from, "");
            // Strip the "/" at the beginning (slashFrom points to the char after "/")
            setSlashQuery(query);
            setSlashIndex(0);
          }, 0);
          return;
        }
        // Don't intercept other keys — let the editor receive them and update query
        if (event.key.length === 1 && !event.ctrlKey && !event.metaKey) {
          // Let the editor handle the character, then sync query
          setTimeout(() => {
            if (!editor) return;
            const { from } = editor.state.selection;
            if (from < slashFrom) {
              setSlashOpen(false);
              return;
            }
            const query = editor.state.doc.textBetween(slashFrom, from, "");
            setSlashQuery(query);
            setSlashIndex(0);
          }, 0);
        }
        return; // fall through to editor for the actual character
      }

      // ── Mention menu handling ───────────────────────────────────────────
      if (mentionOpen) {
        if (event.key === "ArrowDown") {
          event.preventDefault();
          setMentionIndex((i) => (i + 1) % Math.max(1, filteredMentions.length));
          return;
        }
        if (event.key === "ArrowUp") {
          event.preventDefault();
          setMentionIndex((i) =>
            (i - 1 + Math.max(1, filteredMentions.length)) % Math.max(1, filteredMentions.length)
          );
          return;
        }
        if (event.key === "Enter") {
          event.preventDefault();
          const item = filteredMentions[mentionIndex];
          if (item) insertMention(item);
          return;
        }
        if (event.key === "Escape") {
          event.preventDefault();
          setMentionOpen(false);
          return;
        }
        if (event.key === "Backspace") {
          if (mentionQuery === "") {
            setMentionOpen(false);
            return;
          }
          setTimeout(() => {
            if (!editor) return;
            const { from } = editor.state.selection;
            if (from <= mentionFrom) {
              setMentionOpen(false);
              return;
            }
            const query = editor.state.doc.textBetween(mentionFrom, from, "");
            setMentionQuery(query);
            setMentionIndex(0);
          }, 0);
          return;
        }
        if (event.key.length === 1 && !event.ctrlKey && !event.metaKey) {
          setTimeout(() => {
            if (!editor) return;
            const { from } = editor.state.selection;
            if (from < mentionFrom) {
              setMentionOpen(false);
              return;
            }
            const query = editor.state.doc.textBetween(mentionFrom, from, "");
            setMentionQuery(query);
            setMentionIndex(0);
          }, 0);
        }
        return;
      }
    };

    // ONLY attach listener when a menu is actually open
    if (!slashOpen && !mentionOpen) return;

    const editorDom = editor.view.dom;
    editorDom.addEventListener("keydown", handleKeyDown);
    return () => editorDom.removeEventListener("keydown", handleKeyDown);
  }, [editor, slashOpen, slashFrom, slashQuery, filteredSlash, mentionOpen, mentionFrom, mentionQuery, filteredMentions]);

  // ── Watch editor updates to detect "/" and "@" triggers ────────────────

  useEffect(() => {
    if (!editor || readOnly) return undefined;

    const handleTransaction = () => {
      // Only fire when menus are closed to avoid re-triggering
      if (slashOpen || mentionOpen) return;

      const { state } = editor;
      const { from } = state.selection;

      // Check the character just typed
      if (from < 1) return;
      const charBefore = state.doc.textBetween(Math.max(0, from - 1), from, "");

      if (charBefore === "/") {
        const container = editor.view.dom.closest(".editor-scroll-container");
        const coords = getCursorCoords(container);
        setSlashCoords(coords);
        setSlashFrom(from); // position AFTER the "/"
        setSlashQuery("");
        setSlashIndex(0);
        setSlashOpen(true);
      }

      if (charBefore === "@") {
        const container = editor.view.dom.closest(".editor-scroll-container");
        const coords = getCursorCoords(container);
        setMentionCoords(coords);
        setMentionFrom(from); // position AFTER the "@"
        setMentionQuery("");
        setMentionIndex(0);
        setMentionOpen(true);
      }
    };

    editor.on("transaction", handleTransaction);

    // Extract headings for TOC
    const extractHeadings = () => {
      const h: { level: number; text: string; id: string }[] = [];
      editor.state.doc.descendants((node, pos) => {
        if (node.type.name === "heading") {
          h.push({
            level: node.attrs.level as number,
            text: node.textContent,
            id: `heading-${pos}`,
          });
        }
      });
      setHeadings(h);
    };
    editor.on("update", extractHeadings);
    extractHeadings(); // initial

    return () => {
      editor.off("transaction", handleTransaction);
      editor.off("update", extractHeadings);
    };
  }, [editor, readOnly, slashOpen, mentionOpen, getCursorCoords]);

  // ── Insert mention as a link chip ───────────────────────────────────────

  const insertMention = useCallback(
    (item: MentionItem) => {
      if (!editor) return;
      const { from } = editor.state.selection;
      // Delete the "@" + any query text
      const deleteFrom = mentionFrom - 1; // include the "@"
      editor
        .chain()
        .focus()
        .deleteRange({ from: deleteFrom, to: from })
        .insertContent(
          `<a href="${item.route}" class="mention-chip" data-mention="${item.id}">${item.label}</a>`
        )
        .run();
      setMentionOpen(false);
    },
    [editor, mentionFrom]
  );

  // ── Close menus on outside click ────────────────────────────────────────

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const t = e.target as globalThis.Node | null;
      if (slashMenuRef.current && t && !slashMenuRef.current.contains(t)) {
        setSlashOpen(false);
      }
      if (mentionMenuRef.current && t && !mentionMenuRef.current.contains(t)) {
        setMentionOpen(false);
      }
      if (textStyleRef.current && t && !textStyleRef.current.contains(t)) {
        setTextStyleOpen(false);
      }
      if (tableMenuRef.current && t && !tableMenuRef.current.contains(t)) {
        setTableMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Scroll shadow ───────────────────────────────────────────────────────

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const onScroll = () => setScrolled(el.scrollTop > 4);
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  // ── Toolbar helpers ─────────────────────────────────────────────────────

  const getCurrentTextStyle = useCallback(() => {
    if (!editor) return TEXT_STYLES[0];
    if (editor.isActive("heading", { level: 1 })) return TEXT_STYLES[1];
    if (editor.isActive("heading", { level: 2 })) return TEXT_STYLES[2];
    if (editor.isActive("heading", { level: 3 })) return TEXT_STYLES[3];
    return TEXT_STYLES[0];
  }, [editor]);

  const handleInsertLink = useCallback(() => {
    if (!editor) return;
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("URL eingeben:", prev ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().unsetLink().run();
    } else {
      editor.chain().focus().setLink({ href: url }).run();
    }
  }, [editor]);

  const handleInsertImage = useCallback(() => {
    if (!editor) return;
    const url = window.prompt("Bild-URL eingeben:");
    if (url) editor.chain().focus().setImage({ src: url }).run();
  }, [editor]);

  const handleInsertTable = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }, [editor]);

  const handleDeleteTable = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().deleteTable().run();
    setTableMenuOpen(false);
  }, [editor]);

  const isInTable = editor?.isActive("table") ?? false;
  const currentStyle = getCurrentTextStyle();

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full bg-white">

      {/* ── Toolbar ──────────────────────────────────────────────────────── */}
      {!readOnly && (
        <div
          className={cn(
            "sticky top-0 z-20 bg-white border-b border-gray-200 transition-shadow duration-150",
            scrolled && "shadow-sm"
          )}
        >
          <div className="flex items-center gap-0.5 px-3 py-1.5 overflow-x-auto scrollbar-none flex-wrap min-h-[40px]">

            {/* Undo / Redo */}
            <ToolbarButton
              onClick={() => editor?.chain().focus().undo().run()}
              disabled={!editor?.can().undo()}
              title="Rückgängig (Ctrl+Z)"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor?.chain().focus().redo().run()}
              disabled={!editor?.can().redo()}
              title="Wiederholen (Ctrl+Shift+Z)"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </ToolbarButton>

            <ToolbarSeparator />

            {/* Text Style Dropdown */}
            <div className="relative" ref={textStyleRef}>
              <button
                onMouseDown={(e) => {
                  e.preventDefault();
                  setTextStyleOpen((v) => !v);
                }}
                className={cn(
                  "inline-flex items-center gap-1.5 h-7 px-2 rounded-[5px] text-xs font-medium",
                  "text-gray-700 hover:bg-gray-100 transition-colors duration-100",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066FF]/40"
                )}
              >
                <span className="flex items-center gap-1">
                  {currentStyle.icon}
                  <span className="hidden sm:inline max-w-[80px] truncate">{currentStyle.label}</span>
                </span>
                <ChevronDown className="w-3 h-3 opacity-60" />
              </button>

              {textStyleOpen && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg border border-gray-200 shadow-lg z-50 py-1 overflow-hidden">
                  {TEXT_STYLES.map((style) => {
                    const isActive = currentStyle.value === style.value;
                    return (
                      <button
                        key={style.value}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          if (style.value === "paragraph") {
                            editor?.chain().focus().setParagraph().run();
                          } else if (style.value === "h1") {
                            editor?.chain().focus().toggleHeading({ level: 1 }).run();
                          } else if (style.value === "h2") {
                            editor?.chain().focus().toggleHeading({ level: 2 }).run();
                          } else if (style.value === "h3") {
                            editor?.chain().focus().toggleHeading({ level: 3 }).run();
                          }
                          setTextStyleOpen(false);
                        }}
                        className={cn(
                          "w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors",
                          isActive
                            ? "bg-[#0066FF]/5 text-[#0066FF]"
                            : "text-gray-700 hover:bg-gray-50"
                        )}
                      >
                        <span className={cn("text-gray-400", isActive && "text-[#0066FF]")}>
                          {style.icon}
                        </span>
                        <span
                          className={cn(
                            "font-medium",
                            style.value === "h1" && "text-base",
                            style.value === "h2" && "text-sm",
                            style.value === "h3" && "text-xs"
                          )}
                        >
                          {style.label}
                        </span>
                        {isActive && <Check className="w-3.5 h-3.5 ml-auto text-[#0066FF]" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <ToolbarSeparator />

            {/* Text Formatting */}
            <ToolbarButton
              onClick={() => editor?.chain().focus().toggleBold().run()}
              active={editor?.isActive("bold")}
              title="Fett (Ctrl+B)"
            >
              <Bold className="w-3.5 h-3.5" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor?.chain().focus().toggleItalic().run()}
              active={editor?.isActive("italic")}
              title="Kursiv (Ctrl+I)"
            >
              <Italic className="w-3.5 h-3.5" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor?.chain().focus().toggleUnderline().run()}
              active={editor?.isActive("underline")}
              title="Unterstrichen (Ctrl+U)"
            >
              <UnderlineIcon className="w-3.5 h-3.5" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor?.chain().focus().toggleStrike().run()}
              active={editor?.isActive("strike")}
              title="Durchgestrichen"
            >
              <Strikethrough className="w-3.5 h-3.5" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor?.chain().focus().toggleHighlight().run()}
              active={editor?.isActive("highlight")}
              title="Hervorheben"
            >
              <Highlighter className="w-3.5 h-3.5" />
            </ToolbarButton>

            <ToolbarSeparator />

            {/* Lists */}
            <ToolbarButton
              onClick={() => editor?.chain().focus().toggleBulletList().run()}
              active={editor?.isActive("bulletList")}
              title="Aufzählung (Ctrl+Shift+8)"
            >
              <List className="w-3.5 h-3.5" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor?.chain().focus().toggleOrderedList().run()}
              active={editor?.isActive("orderedList")}
              title="Nummerierte Liste (Ctrl+Shift+9)"
            >
              <ListOrdered className="w-3.5 h-3.5" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor?.chain().focus().toggleTaskList().run()}
              active={editor?.isActive("taskList")}
              title="Aufgabenliste"
            >
              <ListChecks className="w-3.5 h-3.5" />
            </ToolbarButton>

            <ToolbarSeparator />

            {/* Insert */}
            <ToolbarButton
              onClick={handleInsertLink}
              active={editor?.isActive("link")}
              title="Link einfügen"
            >
              <LinkIcon className="w-3.5 h-3.5" />
            </ToolbarButton>
            <ToolbarButton onClick={handleInsertImage} title="Bild einfügen">
              <ImageIcon className="w-3.5 h-3.5" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
              active={editor?.isActive("codeBlock")}
              title="Code-Block"
            >
              <Code className="w-3.5 h-3.5" />
            </ToolbarButton>

            <ToolbarSeparator />

            {/* Table with submenu */}
            <div className="relative" ref={tableMenuRef}>
              <button
                onMouseDown={(e) => {
                  e.preventDefault();
                  if (isInTable) {
                    setTableMenuOpen((v) => !v);
                  } else {
                    handleInsertTable();
                  }
                }}
                title={isInTable ? "Tabellen-Optionen" : "Tabelle einfügen (3×3)"}
                className={cn(
                  "inline-flex items-center gap-0.5 h-7 px-1.5 rounded-[5px] text-sm transition-all duration-100 select-none",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066FF]/40",
                  isInTable
                    ? "bg-[#0066FF]/10 text-[#0066FF]"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <TableIcon className="w-3.5 h-3.5" />
                {isInTable && <ChevronDown className="w-3 h-3 opacity-60" />}
              </button>

              {tableMenuOpen && isInTable && (
                <div className="absolute top-full left-0 mt-1 w-52 bg-white rounded-lg border border-gray-200 shadow-lg z-50 py-1 overflow-hidden">
                  <div className="px-3 py-1.5 border-b border-gray-100">
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                      Tabelle
                    </p>
                  </div>
                  {[
                    {
                      label: "Zeile vor einfügen",
                      action: () => { editor?.chain().focus().addRowBefore().run(); setTableMenuOpen(false); },
                    },
                    {
                      label: "Zeile nach einfügen",
                      action: () => { editor?.chain().focus().addRowAfter().run(); setTableMenuOpen(false); },
                    },
                    {
                      label: "Spalte vor einfügen",
                      action: () => { editor?.chain().focus().addColumnBefore().run(); setTableMenuOpen(false); },
                    },
                    {
                      label: "Spalte nach einfügen",
                      action: () => { editor?.chain().focus().addColumnAfter().run(); setTableMenuOpen(false); },
                    },
                    {
                      label: "Zeile löschen",
                      action: () => { editor?.chain().focus().deleteRow().run(); setTableMenuOpen(false); },
                    },
                    {
                      label: "Spalte löschen",
                      action: () => { editor?.chain().focus().deleteColumn().run(); setTableMenuOpen(false); },
                    },
                  ].map((item) => (
                    <button
                      key={item.label}
                      onMouseDown={(e) => { e.preventDefault(); item.action(); }}
                      className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
                    >
                      {item.label}
                    </button>
                  ))}
                  <div className="border-t border-gray-100 mt-1 pt-1">
                    <button
                      onMouseDown={(e) => { e.preventDefault(); handleDeleteTable(); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Tabelle löschen
                    </button>
                  </div>
                </div>
              )}
            </div>

            <ToolbarButton
              onClick={() => editor?.chain().focus().setHorizontalRule().run()}
              title="Trennlinie"
            >
              <Minus className="w-3.5 h-3.5" />
            </ToolbarButton>

            {/* Delete table button — visible only when inside table */}
            {isInTable && (
              <>
                <ToolbarSeparator />
                <ToolbarButton
                  onClick={handleDeleteTable}
                  title="Tabelle löschen"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-500" />
                </ToolbarButton>
              </>
            )}

            <ToolbarSeparator />

            {/* Text Align */}
            <ToolbarButton
              onClick={() => editor?.chain().focus().setTextAlign("left").run()}
              active={editor?.isActive({ textAlign: "left" })}
              title="Linksbündig"
            >
              <AlignLeft className="w-3.5 h-3.5" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor?.chain().focus().setTextAlign("center").run()}
              active={editor?.isActive({ textAlign: "center" })}
              title="Zentriert"
            >
              <AlignCenter className="w-3.5 h-3.5" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor?.chain().focus().setTextAlign("right").run()}
              active={editor?.isActive({ textAlign: "right" })}
              title="Rechtsbündig"
            >
              <AlignRight className="w-3.5 h-3.5" />
            </ToolbarButton>

            {/* Save status */}
            <div className="ml-auto pl-2 flex items-center shrink-0 gap-1.5">
              {saveStatus === "saving" && (
                <span className="text-xs text-gray-400 animate-pulse">Speichert...</span>
              )}
              {saveStatus === "saved" && (
                <span className="text-xs text-emerald-600 flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  Gespeichert
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Editor + TOC ──────────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0">
      <div
        className="editor-scroll-container relative flex-1 overflow-y-auto"
        ref={scrollContainerRef}
      >
        <div className="max-w-[720px] mx-auto px-8 py-10 pb-40">

          {/* Title */}
          <input
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Seitentitel"
            readOnly={readOnly}
            className={cn(
              "w-full text-[2rem] font-bold text-gray-900 placeholder:text-gray-300",
              "border-none outline-none bg-transparent mb-8 leading-tight block",
              "caret-[#0066FF]",
              readOnly && "cursor-default pointer-events-none"
            )}
          />

          {/* Slash Command Menu */}
          {slashOpen && !readOnly && (
            <div
              ref={slashMenuRef}
              className="absolute z-50 bg-white border border-gray-200 rounded-xl shadow-xl w-[260px] overflow-hidden"
              style={{ top: slashCoords.top, left: Math.max(0, slashCoords.left) }}
            >
              <div className="px-3 py-2 border-b border-gray-100 flex items-center gap-2">
                <Hash className="w-3 h-3 text-gray-400" />
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                  Inhaltstyp einfügen
                </p>
              </div>
              {filteredSlash.length === 0 ? (
                <div className="px-3 py-4 text-sm text-gray-400 text-center">
                  Keine Ergebnisse für &quot;{slashQuery}&quot;
                </div>
              ) : (
                <div className="py-1 max-h-72 overflow-y-auto">
                  {filteredSlash.map((item, i) => (
                    <button
                      key={item.label}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        if (editor) item.action(editor, slashFrom);
                        setSlashOpen(false);
                      }}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors",
                        i === slashIndex
                          ? "bg-[#0066FF]/5 text-[#0066FF]"
                          : "text-gray-700 hover:bg-gray-50"
                      )}
                    >
                      <span
                        className={cn(
                          "flex-shrink-0 w-7 h-7 rounded-lg border flex items-center justify-center",
                          i === slashIndex
                            ? "border-[#0066FF]/30 bg-[#0066FF]/5 text-[#0066FF]"
                            : "border-gray-200 bg-gray-50 text-gray-500"
                        )}
                      >
                        {item.icon}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{item.label}</p>
                        <p className="text-[11px] text-gray-400 truncate">{item.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* @ Mention Menu */}
          {mentionOpen && !readOnly && (
            <div
              ref={mentionMenuRef}
              className="absolute z-50 bg-white border border-gray-200 rounded-xl shadow-xl w-[220px] overflow-hidden"
              style={{ top: mentionCoords.top, left: Math.max(0, mentionCoords.left) }}
            >
              <div className="px-3 py-2 border-b border-gray-100 flex items-center gap-2">
                <LayoutGrid className="w-3 h-3 text-gray-400" />
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                  Modul verlinken
                </p>
              </div>
              {filteredMentions.length === 0 ? (
                <div className="px-3 py-4 text-sm text-gray-400 text-center">Nicht gefunden</div>
              ) : (
                <div className="py-1">
                  {filteredMentions.map((item, i) => (
                    <button
                      key={item.id}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        insertMention(item);
                      }}
                      className={cn(
                        "w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors",
                        i === mentionIndex
                          ? "bg-[#0066FF]/5 text-[#0066FF]"
                          : "text-gray-700 hover:bg-gray-50"
                      )}
                    >
                      <span
                        className={cn(
                          "flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center",
                          i === mentionIndex
                            ? "bg-[#0066FF]/10 text-[#0066FF]"
                            : "bg-gray-100 text-gray-500"
                        )}
                      >
                        {item.icon}
                      </span>
                      <span className="text-sm font-medium truncate">{item.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tiptap Editor */}
          <div className="relative group/editor">
            {/* Drag handle — shown on block hover via CSS */}
            <div className="drag-handle-container" aria-hidden="true" />
            <EditorContent editor={editor} className="prose-editor" />
          </div>
        </div>

        {/* Word count */}
        <div className="sticky bottom-0 right-0 flex justify-end pointer-events-none">
          <div className="pointer-events-auto px-4 py-2">
            <span className="text-[11px] text-gray-400 tabular-nums">
              {wordCount} {wordCount === 1 ? "Wort" : "Wörter"}
            </span>
          </div>
        </div>
      </div>

      {/* ── Table of Contents Sidebar ──────────────────────────────────── */}
      {headings.length > 0 && showToc && (
        <div className="w-56 shrink-0 border-l border-gray-100 overflow-y-auto hidden xl:block">
          <div className="sticky top-0 px-4 py-6">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Inhalt
            </p>
            <nav className="space-y-0.5">
              {headings.map((h, i) => (
                <button
                  key={`${h.id}-${i}`}
                  onClick={() => {
                    // Scroll to heading in editor
                    const el = scrollContainerRef.current?.querySelector(
                      `h${h.level}`
                    );
                    if (!el) {
                      // Find by iterating all headings
                      const all = scrollContainerRef.current?.querySelectorAll(
                        `h1, h2, h3`
                      );
                      all?.[i]?.scrollIntoView({ behavior: "smooth", block: "center" });
                    } else {
                      const all = scrollContainerRef.current?.querySelectorAll(
                        `h1, h2, h3`
                      );
                      all?.[i]?.scrollIntoView({ behavior: "smooth", block: "center" });
                    }
                  }}
                  className={cn(
                    "block w-full text-left text-[12px] py-1 rounded hover:bg-gray-50 transition-colors truncate",
                    h.level === 1 && "font-semibold text-gray-700 pl-2",
                    h.level === 2 && "text-gray-600 pl-5",
                    h.level === 3 && "text-gray-400 pl-8"
                  )}
                >
                  {h.text || "Untitled"}
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}
      </div>

      {/* ── Prose & Editor Styles ────────────────────────────────────────── */}
      <style>{`
        /* ─── Core editor ─── */
        .prose-editor .tiptap {
          outline: none;
          min-height: 400px;
          font-size: 15px;
          line-height: 1.8;
          color: #1a1a1a;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Inter", sans-serif;
          caret-color: #0066FF;
        }

        /* ─── Placeholder ─── */
        .prose-editor .tiptap > p.is-editor-empty:first-child::before,
        .prose-editor .tiptap p.is-empty::before {
          content: attr(data-placeholder);
          color: #c4c4c4;
          pointer-events: none;
          float: left;
          height: 0;
          font-style: normal;
        }

        /* ─── Headings ─── */
        .prose-editor .tiptap h1 {
          font-size: 1.875rem;
          font-weight: 700;
          color: #111827;
          margin: 1.75rem 0 0.625rem;
          line-height: 1.25;
          letter-spacing: -0.025em;
        }
        .prose-editor .tiptap h1:first-child { margin-top: 0; }
        .prose-editor .tiptap h2 {
          font-size: 1.375rem;
          font-weight: 600;
          color: #1f2937;
          margin: 1.5rem 0 0.5rem;
          line-height: 1.3;
          letter-spacing: -0.015em;
        }
        .prose-editor .tiptap h3 {
          font-size: 1.125rem;
          font-weight: 600;
          color: #374151;
          margin: 1.25rem 0 0.375rem;
          line-height: 1.4;
        }

        /* ─── Paragraph ─── */
        .prose-editor .tiptap p {
          margin: 0.3rem 0;
        }
        .prose-editor .tiptap p + p {
          margin-top: 0.3rem;
        }

        /* ─── Inline marks ─── */
        .prose-editor .tiptap strong { font-weight: 600; }
        .prose-editor .tiptap em { font-style: italic; }
        .prose-editor .tiptap u {
          text-decoration: underline;
          text-underline-offset: 2px;
        }
        .prose-editor .tiptap s {
          text-decoration: line-through;
          color: #9ca3af;
        }

        /* ─── Links ─── */
        .prose-editor .tiptap a {
          color: #0066FF;
          text-decoration: underline;
          text-underline-offset: 2px;
          cursor: pointer;
          border-radius: 2px;
          transition: color 0.1s;
        }
        .prose-editor .tiptap a:hover { color: #0052cc; }

        /* Mention chips */
        .prose-editor .tiptap a.mention-chip {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          background: #eff6ff;
          color: #0066FF;
          border: 1px solid #bfdbfe;
          border-radius: 4px;
          padding: 0 5px;
          font-size: 0.875em;
          font-weight: 500;
          text-decoration: none;
          cursor: pointer;
          transition: background 0.1s;
        }
        .prose-editor .tiptap a.mention-chip:hover {
          background: #dbeafe;
        }

        /* ─── Lists ─── */
        .prose-editor .tiptap ul,
        .prose-editor .tiptap ol {
          padding-left: 1.625rem;
          margin: 0.5rem 0;
        }
        .prose-editor .tiptap ul { list-style-type: disc; }
        .prose-editor .tiptap ol { list-style-type: decimal; }
        .prose-editor .tiptap li {
          margin: 0.15rem 0;
          padding-left: 0.25rem;
        }
        .prose-editor .tiptap li > p { margin: 0; }
        .prose-editor .tiptap ul ul,
        .prose-editor .tiptap ol ol,
        .prose-editor .tiptap ul ol,
        .prose-editor .tiptap ol ul {
          margin: 0;
        }

        /* ─── Task List ─── */
        .prose-editor .tiptap ul[data-type="taskList"] {
          list-style: none;
          padding-left: 0;
        }
        .prose-editor .tiptap ul[data-type="taskList"] li {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          margin: 0.3rem 0;
          padding-left: 0;
        }
        .prose-editor .tiptap ul[data-type="taskList"] li > label {
          display: flex;
          align-items: center;
          flex-shrink: 0;
          margin-top: 3px;
        }
        .prose-editor .tiptap ul[data-type="taskList"] li > label input[type="checkbox"] {
          width: 15px;
          height: 15px;
          border-radius: 3px;
          border: 1.5px solid #d1d5db;
          cursor: pointer;
          accent-color: #0066FF;
        }
        .prose-editor .tiptap ul[data-type="taskList"] li > div {
          flex: 1;
          min-width: 0;
        }
        .prose-editor .tiptap ul[data-type="taskList"] li[data-checked="true"] > div p {
          color: #9ca3af;
          text-decoration: line-through;
        }

        /* ─── Blockquote ─── */
        .prose-editor .tiptap blockquote {
          border-left: 3px solid #0066FF;
          background: #f0f7ff;
          padding: 0.75rem 1rem;
          margin: 0.75rem 0;
          border-radius: 0 6px 6px 0;
          color: #374151;
          font-style: italic;
        }
        .prose-editor .tiptap blockquote p { margin: 0; }

        /* ─── Inline Code ─── */
        .prose-editor .tiptap code {
          background: #f3f4f6;
          border: 1px solid #e5e7eb;
          border-radius: 4px;
          padding: 0.1em 0.35em;
          font-size: 0.875em;
          font-family: "SF Mono", "Fira Code", Consolas, monospace;
          color: #dc2626;
        }

        /* ─── Code Block ─── */
        .prose-editor .tiptap pre {
          background: #1e1e2e;
          border-radius: 10px;
          padding: 1rem 1.25rem;
          margin: 0.875rem 0;
          overflow-x: auto;
        }
        .prose-editor .tiptap pre code {
          background: transparent;
          border: none;
          padding: 0;
          color: #cdd6f4;
          font-size: 0.875rem;
          line-height: 1.65;
          font-family: "SF Mono", "Fira Code", Consolas, monospace;
        }

        /* ─── Horizontal Rule ─── */
        .prose-editor .tiptap hr {
          border: none;
          border-top: 2px solid #e5e7eb;
          margin: 1.5rem 0;
          border-radius: 1px;
        }
        .prose-editor .tiptap hr.ProseMirror-selectednode {
          border-top-color: #0066FF;
        }

        /* ─── Highlight ─── */
        .prose-editor .tiptap mark {
          background-color: #fef08a;
          border-radius: 2px;
          padding: 0 2px;
          color: inherit;
        }

        /* ─── Images ─── */
        .prose-editor .tiptap img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
          margin: 0.875rem 0;
          display: block;
        }
        .prose-editor .tiptap img.ProseMirror-selectednode {
          outline: 2px solid #0066FF;
          outline-offset: 2px;
          border-radius: 8px;
        }

        /* ─── Tables ─── */
        .prose-editor .tiptap table {
          width: 100%;
          border-collapse: collapse;
          margin: 1rem 0;
          font-size: 0.9rem;
          overflow: hidden;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
          table-layout: fixed;
        }
        .prose-editor .tiptap th {
          background: #f9fafb;
          font-weight: 600;
          text-align: left;
          padding: 0.6rem 0.875rem;
          border: 1px solid #e5e7eb;
          color: #374151;
          font-size: 0.8125rem;
          letter-spacing: 0.01em;
        }
        .prose-editor .tiptap td {
          padding: 0.5rem 0.875rem;
          border: 1px solid #e5e7eb;
          vertical-align: top;
        }
        .prose-editor .tiptap tr:hover td { background: #f9fafb; }
        .prose-editor .tiptap td,
        .prose-editor .tiptap th { position: relative; }
        .prose-editor .tiptap .selectedCell::after {
          background: rgba(0, 102, 255, 0.07);
          content: "";
          left: 0; right: 0; top: 0; bottom: 0;
          pointer-events: none;
          position: absolute;
          z-index: 2;
        }
        .prose-editor .tiptap .column-resize-handle {
          background-color: #0066FF;
          bottom: -2px;
          pointer-events: none;
          position: absolute;
          right: -1px;
          top: 0;
          width: 2px;
        }
        .prose-editor .tiptap .tableWrapper {
          overflow-x: auto;
        }

        /* ─── Callout Blocks ─── */
        .prose-editor .tiptap div[data-callout-type] {
          display: flex;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          margin: 0.875rem 0;
          border-radius: 8px;
          border-left-width: 3px;
          border-left-style: solid;
        }
        .prose-editor .tiptap div[data-callout-type] > p { margin: 0; }
        .prose-editor .tiptap div[data-callout-type="info"] {
          background: #eff6ff;
          border-left-color: #3b82f6;
          color: #1e3a5f;
        }
        .prose-editor .tiptap div[data-callout-type="warning"] {
          background: #fffbeb;
          border-left-color: #f59e0b;
          color: #78350f;
        }
        .prose-editor .tiptap div[data-callout-type="success"] {
          background: #f0fdf4;
          border-left-color: #22c55e;
          color: #14532d;
        }
        .prose-editor .tiptap div[data-callout-type="error"] {
          background: #fef2f2;
          border-left-color: #ef4444;
          color: #7f1d1d;
        }

        /* ─── Focus ─── */
        .prose-editor .tiptap:focus {
          outline: none;
        }

        /* ─── Selection ─── */
        .prose-editor .tiptap ::selection {
          background: rgba(0, 102, 255, 0.15);
        }

        /* ─── Drag handle (visual indicator on left) ─── */
        .prose-editor .tiptap > * {
          position: relative;
          transition: background 0.08s;
        }
        .prose-editor .tiptap > *:hover::before {
          content: "";
          position: absolute;
          left: -28px;
          top: 50%;
          transform: translateY(-50%);
          width: 16px;
          height: 20px;
          background-image: url("data:image/svg+xml,%3Csvg width='10' height='16' viewBox='0 0 10 16' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='2' cy='2' r='1.5' fill='%23d1d5db'/%3E%3Ccircle cx='8' cy='2' r='1.5' fill='%23d1d5db'/%3E%3Ccircle cx='2' cy='8' r='1.5' fill='%23d1d5db'/%3E%3Ccircle cx='8' cy='8' r='1.5' fill='%23d1d5db'/%3E%3Ccircle cx='2' cy='14' r='1.5' fill='%23d1d5db'/%3E%3Ccircle cx='8' cy='14' r='1.5' fill='%23d1d5db'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: center;
          opacity: 0;
          transition: opacity 0.15s;
          cursor: grab;
        }
        .prose-editor:hover .tiptap > *:hover::before {
          opacity: 1;
        }

        /* ─── Scrollbar ─── */
        .scrollbar-none::-webkit-scrollbar { display: none; }
        .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }

        /* ─── Floating menu animations ─── */
        @keyframes menuIn {
          from { opacity: 0; transform: translateY(6px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
