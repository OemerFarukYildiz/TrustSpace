"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
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
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PageEditorProps {
  initialContent?: string;
  onSave: (html: string) => void;
  title: string;
  onTitleChange: (title: string) => void;
  readOnly?: boolean;
}

// ─── Slash Command State ──────────────────────────────────────────────────────

interface SlashItem {
  label: string;
  description: string;
  icon: React.ReactNode;
  action: (editor: ReturnType<typeof useEditor>) => void;
}

const SLASH_ITEMS: SlashItem[] = [
  {
    label: "Überschrift 1",
    description: "Große Abschnittsüberschrift",
    icon: <Heading1 className="w-4 h-4" />,
    action: (editor) =>
      editor?.chain().focus().deleteRange(editor.state.selection).toggleHeading({ level: 1 }).run(),
  },
  {
    label: "Überschrift 2",
    description: "Mittlere Abschnittsüberschrift",
    icon: <Heading2 className="w-4 h-4" />,
    action: (editor) =>
      editor?.chain().focus().deleteRange(editor.state.selection).toggleHeading({ level: 2 }).run(),
  },
  {
    label: "Überschrift 3",
    description: "Kleine Abschnittsüberschrift",
    icon: <Heading3 className="w-4 h-4" />,
    action: (editor) =>
      editor?.chain().focus().deleteRange(editor.state.selection).toggleHeading({ level: 3 }).run(),
  },
  {
    label: "Aufzählung",
    description: "Ungeordnete Liste",
    icon: <List className="w-4 h-4" />,
    action: (editor) =>
      editor?.chain().focus().deleteRange(editor.state.selection).toggleBulletList().run(),
  },
  {
    label: "Nummerierte Liste",
    description: "Geordnete Liste",
    icon: <ListOrdered className="w-4 h-4" />,
    action: (editor) =>
      editor?.chain().focus().deleteRange(editor.state.selection).toggleOrderedList().run(),
  },
  {
    label: "Aufgabenliste",
    description: "Liste mit Checkboxen",
    icon: <ListChecks className="w-4 h-4" />,
    action: (editor) =>
      editor?.chain().focus().deleteRange(editor.state.selection).toggleTaskList().run(),
  },
  {
    label: "Code-Block",
    description: "Monospace Code-Bereich",
    icon: <Code className="w-4 h-4" />,
    action: (editor) =>
      editor?.chain().focus().deleteRange(editor.state.selection).toggleCodeBlock().run(),
  },
  {
    label: "Tabelle",
    description: "3x3 Tabelle einfügen",
    icon: <TableIcon className="w-4 h-4" />,
    action: (editor) => {
      // Delete the slash char first, then insert table
      const { from } = editor!.state.selection;
      editor
        ?.chain()
        .focus()
        .deleteRange({ from: from - 1, to: from })
        .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
        .run();
    },
  },
  {
    label: "Trennlinie",
    description: "Horizontale Linie",
    icon: <Minus className="w-4 h-4" />,
    action: (editor) => {
      const { from } = editor!.state.selection;
      editor
        ?.chain()
        .focus()
        .deleteRange({ from: from - 1, to: from })
        .setHorizontalRule()
        .run();
    },
  },
  {
    label: "Bild",
    description: "Bild per URL einfügen",
    icon: <ImageIcon className="w-4 h-4" />,
    action: (editor) => {
      const { from } = editor!.state.selection;
      editor?.chain().focus().deleteRange({ from: from - 1, to: from }).run();
      const url = window.prompt("Bild-URL eingeben:");
      if (url) {
        editor?.chain().focus().setImage({ src: url }).run();
      }
    },
  },
];

// ─── Text Style Dropdown ──────────────────────────────────────────────────────

const TEXT_STYLES = [
  { label: "Absatz", value: "paragraph", icon: <Type className="w-3.5 h-3.5" /> },
  { label: "Überschrift 1", value: "h1", icon: <Heading1 className="w-3.5 h-3.5" /> },
  { label: "Überschrift 2", value: "h2", icon: <Heading2 className="w-3.5 h-3.5" /> },
  { label: "Überschrift 3", value: "h3", icon: <Heading3 className="w-3.5 h-3.5" /> },
];

// ─── Toolbar Button ───────────────────────────────────────────────────────────

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
  const [textStyleOpen, setTextStyleOpen] = useState(false);
  const textStyleRef = useRef<HTMLDivElement>(null);

  // Slash command state
  const [slashOpen, setSlashOpen] = useState(false);
  const [slashIndex, setSlashIndex] = useState(0);
  const [slashQuery, setSlashQuery] = useState("");
  const slashRef = useRef<HTMLDivElement>(null);
  const [slashCoords, setSlashCoords] = useState({ top: 0, left: 0 });

  const filteredSlash = SLASH_ITEMS.filter((item) =>
    item.label.toLowerCase().includes(slashQuery.toLowerCase())
  );

  // ── Editor Setup ──────────────────────────────────────────────────────────

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        horizontalRule: false,
      }),
      Placeholder.configure({ placeholder: "Schreibe hier..." }),
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
    ],
    content: initialContent || "",
    editable: !readOnly,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      setSaveStatus("saving");
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        onSave(editor.getHTML());
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2000);
      }, 1500);
    },
  });

  // ── Slash Command Logic ───────────────────────────────────────────────────

  useEffect(() => {
    if (!editor) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (slashOpen) {
        if (event.key === "ArrowDown") {
          event.preventDefault();
          setSlashIndex((i) => (i + 1) % filteredSlash.length);
          return;
        }
        if (event.key === "ArrowUp") {
          event.preventDefault();
          setSlashIndex((i) => (i - 1 + filteredSlash.length) % filteredSlash.length);
          return;
        }
        if (event.key === "Enter") {
          event.preventDefault();
          if (filteredSlash[slashIndex]) {
            filteredSlash[slashIndex].action(editor);
            setSlashOpen(false);
          }
          return;
        }
        if (event.key === "Escape") {
          setSlashOpen(false);
          return;
        }
        // Typing after "/" — update query
        if (event.key === "Backspace") {
          setSlashQuery((q) => {
            const next = q.slice(0, -1);
            if (next === "" && q === "") {
              setSlashOpen(false);
            }
            return next;
          });
          return;
        }
        if (event.key.length === 1) {
          setSlashQuery((q) => q + event.key);
          setSlashIndex(0);
        }
        return;
      }

      if (event.key === "/") {
        // Delay to let tiptap insert the character first
        setTimeout(() => {
          const { state } = editor;
          const { from } = state.selection;
          const textBefore = state.doc.textBetween(Math.max(0, from - 10), from, "\n");
          const isLineStart = /(\n|^)$/.test(textBefore.slice(0, -1));

          // Get cursor DOM position
          const domSelection = window.getSelection();
          if (domSelection && domSelection.rangeCount > 0) {
            const range = domSelection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            const editorEl = editor.view.dom.closest(".editor-scroll-container");
            const containerRect = editorEl?.getBoundingClientRect() ?? { top: 0, left: 0 };
            setSlashCoords({
              top: rect.bottom - containerRect.top + 4,
              left: rect.left - containerRect.left,
            });
          }

          if (isLineStart || true) {
            setSlashQuery("");
            setSlashIndex(0);
            setSlashOpen(true);
          }
        }, 10);
      }
    };

    const editorDom = editor.view.dom;
    editorDom.addEventListener("keydown", handleKeyDown, true);
    return () => editorDom.removeEventListener("keydown", handleKeyDown, true);
  }, [editor, slashOpen, slashIndex, filteredSlash]);

  // Close slash menu on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (slashRef.current && !slashRef.current.contains(e.target as Node)) {
        setSlashOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close text style dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (textStyleRef.current && !textStyleRef.current.contains(e.target as Node)) {
        setTextStyleOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Helpers ───────────────────────────────────────────────────────────────

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

  const currentStyle = getCurrentTextStyle();

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full bg-white">
      {/* ── Toolbar ────────────────────────────────────────────────────── */}
      {!readOnly && (
        <div className="sticky top-0 z-20 bg-white border-b border-gray-200">
          <div className="flex items-center gap-0.5 px-4 py-1.5 overflow-x-auto scrollbar-none">
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

            <ToolbarSeparator />

            {/* Lists */}
            <ToolbarButton
              onClick={() => editor?.chain().focus().toggleBulletList().run()}
              active={editor?.isActive("bulletList")}
              title="Aufzählung"
            >
              <List className="w-3.5 h-3.5" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor?.chain().focus().toggleOrderedList().run()}
              active={editor?.isActive("orderedList")}
              title="Nummerierte Liste"
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

            {/* Table & Rule */}
            <ToolbarButton onClick={handleInsertTable} title="Tabelle einfügen (3×3)">
              <TableIcon className="w-3.5 h-3.5" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor?.chain().focus().setHorizontalRule().run()}
              title="Trennlinie"
            >
              <Minus className="w-3.5 h-3.5" />
            </ToolbarButton>

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

            <ToolbarSeparator />

            {/* Highlight */}
            <ToolbarButton
              onClick={() => editor?.chain().focus().toggleHighlight().run()}
              active={editor?.isActive("highlight")}
              title="Hervorheben"
            >
              <Highlighter className="w-3.5 h-3.5" />
            </ToolbarButton>

            {/* Save status — pushed to right */}
            <div className="ml-auto pl-4 flex items-center shrink-0">
              {saveStatus === "saving" && (
                <span className="text-xs text-gray-400 animate-pulse">Speichert...</span>
              )}
              {saveStatus === "saved" && (
                <span className="text-xs text-green-600 flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  Gespeichert
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Scrollable Editor Area ──────────────────────────────────────── */}
      <div className="editor-scroll-container relative flex-1 overflow-y-auto">
        <div className="max-w-[800px] mx-auto px-8 py-10 pb-32">
          {/* Title */}
          <input
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Seitentitel"
            readOnly={readOnly}
            className={cn(
              "w-full text-[2rem] font-bold text-gray-900 placeholder:text-gray-300",
              "border-none outline-none bg-transparent mb-6 leading-tight",
              "caret-[#0066FF] resize-none",
              readOnly && "cursor-default"
            )}
          />

          {/* Slash Command Menu */}
          {slashOpen && !readOnly && (
            <div
              ref={slashRef}
              className="absolute z-50 bg-white border border-gray-200 rounded-lg shadow-xl w-64 overflow-hidden"
              style={{
                top: slashCoords.top,
                left: Math.max(0, slashCoords.left),
              }}
            >
              <div className="px-3 py-2 border-b border-gray-100">
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                  Inhaltstyp einfügen
                </p>
              </div>
              {filteredSlash.length === 0 ? (
                <div className="px-3 py-3 text-sm text-gray-400">Keine Ergebnisse</div>
              ) : (
                <div className="py-1 max-h-72 overflow-y-auto">
                  {filteredSlash.map((item, i) => (
                    <button
                      key={item.label}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        item.action(editor);
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
                          "flex-shrink-0 w-7 h-7 rounded-md border border-gray-200 flex items-center justify-center",
                          i === slashIndex
                            ? "border-[#0066FF]/30 bg-[#0066FF]/5 text-[#0066FF]"
                            : "bg-gray-50 text-gray-500"
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

          {/* Tiptap Editor */}
          <EditorContent
            editor={editor}
            className="prose-editor"
          />

          {/* Toolbar handles all formatting - no bubble menu needed */}
        </div>
      </div>

      {/* ── Embedded Prose Styles ───────────────────────────────────────── */}
      <style>{`
        /* ── Editor content prose styles ── */
        .prose-editor .tiptap {
          outline: none;
          min-height: 320px;
          font-size: 15px;
          line-height: 1.75;
          color: #1a1a1a;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        /* Placeholder */
        .prose-editor .tiptap p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          color: #c0c0c0;
          pointer-events: none;
          float: left;
          height: 0;
        }

        /* Headings */
        .prose-editor .tiptap h1 {
          font-size: 1.875rem;
          font-weight: 700;
          color: #111827;
          margin: 1.5rem 0 0.75rem;
          line-height: 1.25;
          letter-spacing: -0.02em;
        }
        .prose-editor .tiptap h2 {
          font-size: 1.375rem;
          font-weight: 600;
          color: #1f2937;
          margin: 1.25rem 0 0.5rem;
          line-height: 1.3;
          letter-spacing: -0.01em;
        }
        .prose-editor .tiptap h3 {
          font-size: 1.125rem;
          font-weight: 600;
          color: #374151;
          margin: 1rem 0 0.4rem;
          line-height: 1.4;
        }

        /* Paragraph */
        .prose-editor .tiptap p {
          margin: 0.35rem 0;
        }

        /* Strong / Em */
        .prose-editor .tiptap strong { font-weight: 600; }
        .prose-editor .tiptap em { font-style: italic; }
        .prose-editor .tiptap u { text-decoration: underline; text-underline-offset: 2px; }
        .prose-editor .tiptap s { text-decoration: line-through; color: #9ca3af; }

        /* Links */
        .prose-editor .tiptap a {
          color: #0066FF;
          text-decoration: underline;
          text-underline-offset: 2px;
          cursor: pointer;
        }
        .prose-editor .tiptap a:hover { color: #0052cc; }

        /* Lists */
        .prose-editor .tiptap ul,
        .prose-editor .tiptap ol {
          padding-left: 1.5rem;
          margin: 0.5rem 0;
        }
        .prose-editor .tiptap ul { list-style-type: disc; }
        .prose-editor .tiptap ol { list-style-type: decimal; }
        .prose-editor .tiptap li { margin: 0.2rem 0; }
        .prose-editor .tiptap li > p { margin: 0; }

        /* Task List */
        .prose-editor .tiptap ul[data-type="taskList"] {
          list-style: none;
          padding-left: 0;
        }
        .prose-editor .tiptap ul[data-type="taskList"] li {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          margin: 0.3rem 0;
        }
        .prose-editor .tiptap ul[data-type="taskList"] li > label {
          display: flex;
          align-items: center;
          flex-shrink: 0;
          margin-top: 2px;
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

        /* Blockquote */
        .prose-editor .tiptap blockquote {
          border-left: 3px solid #0066FF;
          background: #f0f7ff;
          padding: 0.75rem 1rem;
          margin: 0.75rem 0;
          border-radius: 0 6px 6px 0;
          color: #374151;
          font-style: italic;
        }

        /* Inline code */
        .prose-editor .tiptap code {
          background: #f3f4f6;
          border: 1px solid #e5e7eb;
          border-radius: 4px;
          padding: 0.1em 0.35em;
          font-size: 0.875em;
          font-family: "SF Mono", "Fira Code", Consolas, monospace;
          color: #dc2626;
        }

        /* Code block */
        .prose-editor .tiptap pre {
          background: #1e1e2e;
          border-radius: 8px;
          padding: 1rem 1.25rem;
          margin: 0.75rem 0;
          overflow-x: auto;
        }
        .prose-editor .tiptap pre code {
          background: transparent;
          border: none;
          padding: 0;
          color: #cdd6f4;
          font-size: 0.875rem;
          line-height: 1.6;
          font-family: "SF Mono", "Fira Code", Consolas, monospace;
        }

        /* Horizontal rule */
        .prose-editor .tiptap hr {
          border: none;
          border-top: 2px solid #e5e7eb;
          margin: 1.25rem 0;
        }

        /* Highlight */
        .prose-editor .tiptap mark {
          background-color: #fef08a;
          border-radius: 2px;
          padding: 0 2px;
          color: inherit;
        }

        /* Images */
        .prose-editor .tiptap img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
          margin: 0.75rem 0;
          display: block;
        }
        .prose-editor .tiptap img.ProseMirror-selectednode {
          outline: 2px solid #0066FF;
          outline-offset: 2px;
        }

        /* Tables */
        .prose-editor .tiptap table {
          width: 100%;
          border-collapse: collapse;
          margin: 0.75rem 0;
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
        }
        .prose-editor .tiptap td {
          padding: 0.55rem 0.875rem;
          border: 1px solid #e5e7eb;
          vertical-align: top;
        }
        .prose-editor .tiptap tr:hover td { background: #f9fafb; }
        .prose-editor .tiptap .selectedCell::after {
          background: rgba(0, 102, 255, 0.08);
          content: "";
          left: 0;
          right: 0;
          top: 0;
          bottom: 0;
          pointer-events: none;
          position: absolute;
          z-index: 2;
        }
        .prose-editor .tiptap td,
        .prose-editor .tiptap th {
          position: relative;
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

        /* Focus ring on the editor itself */
        .prose-editor .tiptap:focus {
          outline: none;
        }

        /* Bubble menu animation */
        .bubble-menu {
          animation: bubbleIn 0.12s ease-out;
        }
        @keyframes bubbleIn {
          from { opacity: 0; transform: translateY(4px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* Hide scrollbar utility */
        .scrollbar-none::-webkit-scrollbar { display: none; }
        .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
