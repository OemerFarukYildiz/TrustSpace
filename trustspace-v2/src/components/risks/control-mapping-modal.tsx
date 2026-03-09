"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface Control {
  id: string;
  code: string;
  title: string;
  description?: string | null;
  isApplicable: boolean;
}

interface ControlMappingModalProps {
  riskThreatId: string;
  currentControlIds: string[];
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

const CATEGORY_FILTERS = [
  { label: "Alle", value: "" },
  { label: "A.5", value: "A.5" },
  { label: "A.6", value: "A.6" },
  { label: "A.7", value: "A.7" },
  { label: "A.8", value: "A.8" },
];

export function ControlMappingModal({
  riskThreatId,
  currentControlIds,
  isOpen,
  onClose,
  onSaved,
}: ControlMappingModalProps) {
  const [controls, setControls] = useState<Control[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchControls = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/controls");
      if (!res.ok) throw new Error("Failed to fetch controls");
      const data = await res.json();
      setControls(data);
    } catch (error) {
      console.error("Failed to fetch controls:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchControls();
      setSelectedIds(new Set(currentControlIds));
      setSearch("");
      setCategoryFilter("");
    }
  }, [isOpen, fetchControls, currentControlIds]);

  const toggleControl = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const removeControl = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const filteredControls = useMemo(() => {
    return controls.filter((c) => {
      if (categoryFilter && !c.code.startsWith(categoryFilter)) return false;
      if (search) {
        const term = search.toLowerCase();
        return (
          c.code.toLowerCase().includes(term) ||
          c.title.toLowerCase().includes(term)
        );
      }
      return true;
    });
  }, [controls, search, categoryFilter]);

  const selectedControls = useMemo(() => {
    return controls.filter((c) => selectedIds.has(c.id));
  }, [controls, selectedIds]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/risk-threats/${riskThreatId}/controls`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ controlIds: Array.from(selectedIds) }),
      });

      if (!res.ok) throw new Error("Failed to save");

      onSaved();
      onClose();
    } catch (error) {
      console.error("Failed to save control mapping:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[800px] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Controls zuordnen</DialogTitle>
          <DialogDescription>
            Ordnen Sie ISO 27001 Controls dieser Bedrohung zu.{" "}
            {selectedIds.size} Control{selectedIds.size !== 1 ? "s" : ""}{" "}
            ausgewählt.
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <Input
          placeholder="Controls durchsuchen..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-2"
        />

        {/* Two-column layout */}
        <div className="flex-1 grid grid-cols-2 gap-4 min-h-0 overflow-hidden">
          {/* Left: available controls */}
          <div className="flex flex-col border rounded-md overflow-hidden">
            <div className="p-2 border-b bg-muted/50">
              <div className="flex gap-1 flex-wrap">
                {CATEGORY_FILTERS.map((cat) => (
                  <Button
                    key={cat.value}
                    variant={categoryFilter === cat.value ? "default" : "outline"}
                    size="sm"
                    className="h-6 text-xs px-2"
                    onClick={() => setCategoryFilter(cat.value)}
                  >
                    {cat.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-auto">
              {loading ? (
                <div className="flex items-center justify-center h-40 text-muted-foreground">
                  Laden...
                </div>
              ) : filteredControls.length === 0 ? (
                <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
                  Keine Controls gefunden
                </div>
              ) : (
                <div className="divide-y">
                  {filteredControls.map((control) => {
                    const isSelected = selectedIds.has(control.id);
                    return (
                      <label
                        key={control.id}
                        className={`flex items-start gap-3 p-2 cursor-pointer hover:bg-muted/50 transition-colors ${
                          isSelected ? "bg-blue-50 dark:bg-blue-950/30" : ""
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleControl(control.id)}
                          className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-muted-foreground">
                              {control.code}
                            </span>
                          </div>
                          <span className="text-sm leading-tight line-clamp-2">
                            {control.title}
                          </span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right: selected controls as chips */}
          <div className="flex flex-col border rounded-md overflow-hidden">
            <div className="p-2 border-b bg-muted/50">
              <span className="text-sm font-medium">
                Zugeordnete Controls ({selectedIds.size})
              </span>
            </div>

            <div className="flex-1 overflow-auto p-2">
              {selectedControls.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  Noch keine Controls ausgewählt
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {selectedControls.map((control) => (
                    <Badge
                      key={control.id}
                      variant="secondary"
                      className="flex items-center gap-1 pr-1 max-w-full"
                    >
                      <span className="font-mono text-xs">{control.code}</span>
                      <span className="truncate text-xs">
                        {control.title}
                      </span>
                      <button
                        onClick={() => removeControl(control.id)}
                        className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Abbrechen
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Speichert..." : "Speichern"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
