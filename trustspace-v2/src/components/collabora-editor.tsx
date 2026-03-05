"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Loader2 } from "lucide-react";

interface CollaboraEditorProps {
  fileId: string;
  fileName: string;
  onClose: () => void;
}

export function CollaboraEditor({ fileId, fileName, onClose }: CollaboraEditorProps) {
  const [editorUrl, setEditorUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadEditor() {
      try {
        const res = await fetch("/api/collabora", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileId }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to load editor");
        }

        const data = await res.json();
        setEditorUrl(data.url);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    loadEditor();
  }, [fileId]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading Collabora Online...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md">
          <h3 className="text-lg font-semibold text-red-600 mb-2">Error</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-semibold">Collabora Online</span>
          <span className="text-gray-400">|</span>
          <span className="text-gray-300">{fileName}</span>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} className="text-white hover:bg-gray-800">
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Editor iframe */}
      {editorUrl && (
        <iframe
          src={editorUrl}
          className="flex-1 w-full h-full bg-white"
          allow="fullscreen"
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-downloads"
        />
      )}
    </div>
  );
}
