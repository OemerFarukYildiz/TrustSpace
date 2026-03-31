"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import PageEditor from "@/components/page-editor";
import { ArrowLeft, Loader2 } from "lucide-react";

interface DocPage {
  id: string;
  name: string;
  content: string | null;
  parentId: string | null;
}

export default function PageEditPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [doc, setDoc] = useState<DocPage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/documents/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setDoc(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  async function handleSave(html: string) {
    await fetch(`/api/documents/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: html }),
    });
  }

  async function handleTitleChange(title: string) {
    setDoc((prev) => (prev ? { ...prev, name: title } : prev));
    await fetch(`/api/documents/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: title }),
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <p className="text-gray-400">Seite nicht gefunden</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Minimal top bar */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b border-gray-100 px-4 py-2 flex items-center gap-3">
        <button
          onClick={() => router.push("/documents")}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <span className="text-sm text-gray-400 truncate">{doc.name}</span>
      </div>

      <PageEditor
        initialContent={doc.content || ""}
        onSave={handleSave}
        title={doc.name}
        onTitleChange={handleTitleChange}
      />
    </div>
  );
}
