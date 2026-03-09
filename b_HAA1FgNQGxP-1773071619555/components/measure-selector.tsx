"use client"

import { useState, useMemo } from "react"
import {
  X,
  Search,
  Check,
  ChevronDown,
  ChevronRight,
  Filter,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react"
import {
  type Measure,
  allMeasures,
  getMeasureStatusColor,
  getMeasureStatusLabel,
} from "@/lib/risk-data"
import { cn } from "@/lib/utils"

interface MeasureSelectorProps {
  selectedMeasures: Measure[]
  onConfirm: (measures: Measure[]) => void
  onClose: () => void
}

export function MeasureSelector({
  selectedMeasures,
  onConfirm,
  onClose,
}: MeasureSelectorProps) {
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<Set<string>>(
    new Set(selectedMeasures.map((m) => m.id))
  )
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(["A5 Organisatorische Kontrollen", "A6 Personenbezogene Kontrollen", "A7 Physische Kontrollen", "A8 Technologische Kontrollen"])
  )
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const categories = useMemo(() => {
    const cats = new Map<string, Measure[]>()
    for (const m of allMeasures) {
      if (!cats.has(m.category)) cats.set(m.category, [])
      cats.get(m.category)!.push(m)
    }
    return cats
  }, [])

  const filteredCategories = useMemo(() => {
    const result = new Map<string, Measure[]>()
    for (const [cat, measures] of categories) {
      const filtered = measures.filter((m) => {
        const matchesSearch =
          search === "" ||
          m.code.toLowerCase().includes(search.toLowerCase()) ||
          m.title.toLowerCase().includes(search.toLowerCase())
        const matchesStatus =
          statusFilter === "all" || m.status === statusFilter
        return matchesSearch && matchesStatus
      })
      if (filtered.length > 0) result.set(cat, filtered)
    }
    return result
  }, [categories, search, statusFilter])

  const toggleMeasure = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(category)) next.delete(category)
      else next.add(category)
      return next
    })
  }

  const selectAllInCategory = (category: string) => {
    const measures = filteredCategories.get(category)
    if (!measures) return
    setSelected((prev) => {
      const next = new Set(prev)
      const allSelected = measures.every((m) => next.has(m.id))
      if (allSelected) {
        for (const m of measures) next.delete(m.id)
      } else {
        for (const m of measures) next.add(m.id)
      }
      return next
    })
  }

  const handleConfirm = () => {
    const selectedMeasures = allMeasures.filter((m) => selected.has(m.id))
    onConfirm(selectedMeasures)
  }

  const selectedCount = selected.size
  const totalCount = allMeasures.length

  return (
    <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50 flex justify-end">
      <div className="w-full max-w-2xl bg-card shadow-2xl border-l border-border flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3 mb-4">
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 hover:bg-muted rounded-md transition-colors text-muted-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h2 className="text-lg font-semibold text-foreground">{"Maßnahmen auswählen (SoA)"}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {`${selectedCount} von ${totalCount} Maßnahmen ausgewählt`}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="ml-auto p-1.5 hover:bg-muted rounded-md transition-colors text-muted-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Search and Filter */}
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Maßnahmen suchen (z.B. A5.16 oder Identität)..."
                className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
              />
            </div>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none pl-8 pr-8 py-2.5 rounded-lg border border-border bg-card text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors cursor-pointer"
              >
                <option value="all">Alle Status</option>
                <option value="umgesetzt">Umgesetzt</option>
                <option value="teilweise">Teilweise</option>
                <option value="geplant">Geplant</option>
                <option value="offen">Offen</option>
              </select>
              <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex items-center gap-3 mt-3">
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-xs text-muted-foreground">
                {allMeasures.filter(m => m.status === "umgesetzt").length} Umgesetzt
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-amber-500" />
              <span className="text-xs text-muted-foreground">
                {allMeasures.filter(m => m.status === "teilweise").length} Teilweise
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-blue-500" />
              <span className="text-xs text-muted-foreground">
                {allMeasures.filter(m => m.status === "geplant").length} Geplant
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-red-500" />
              <span className="text-xs text-muted-foreground">
                {allMeasures.filter(m => m.status === "offen").length} Offen
              </span>
            </div>
          </div>
        </div>

        {/* Measures List */}
        <div className="flex-1 overflow-y-auto">
          {Array.from(filteredCategories.entries()).map(([category, measures]) => {
            const isExpanded = expandedCategories.has(category)
            const selectedInCat = measures.filter((m) => selected.has(m.id)).length
            const allSelectedInCat = selectedInCat === measures.length

            return (
              <div key={category} className="border-b border-border last:border-b-0">
                {/* Category Header */}
                <div className="flex items-center gap-2 px-6 py-3 bg-muted/40 sticky top-0 z-10">
                  <button
                    type="button"
                    onClick={() => toggleCategory(category)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => selectAllInCategory(category)}
                    className={cn(
                      "h-4 w-4 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0",
                      allSelectedInCat
                        ? "bg-primary border-primary"
                        : selectedInCat > 0
                          ? "border-primary bg-primary/20"
                          : "border-border"
                    )}
                  >
                    {allSelectedInCat && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
                    {!allSelectedInCat && selectedInCat > 0 && (
                      <div className="h-1.5 w-1.5 rounded-sm bg-primary" />
                    )}
                  </button>
                  <span className="text-sm font-semibold text-foreground flex-1">
                    {category}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {selectedInCat}/{measures.length} {"ausgewählt"}
                  </span>
                </div>

                {/* Category Items */}
                {isExpanded && (
                  <div className="divide-y divide-border/50">
                    {measures.map((measure) => {
                      const isSelected = selected.has(measure.id)
                      return (
                        <button
                          type="button"
                          key={measure.id}
                          onClick={() => toggleMeasure(measure.id)}
                          className={cn(
                            "w-full flex items-center gap-3 px-6 py-3 transition-colors text-left",
                            isSelected
                              ? "bg-primary/5"
                              : "hover:bg-muted/30"
                          )}
                        >
                          {/* Checkbox */}
                          <div
                            className={cn(
                              "h-5 w-5 rounded border-2 flex items-center justify-center transition-all flex-shrink-0",
                              isSelected
                                ? "bg-primary border-primary"
                                : "border-border hover:border-primary/50"
                            )}
                          >
                            {isSelected && (
                              <Check className="h-3 w-3 text-primary-foreground" />
                            )}
                          </div>

                          {/* Code */}
                          <span className="text-xs font-mono font-bold text-primary w-12 flex-shrink-0">
                            {measure.code}
                          </span>

                          {/* Title */}
                          <span className="text-sm text-foreground flex-1 min-w-0">
                            {measure.title}
                          </span>

                          {/* Status badge */}
                          <span
                            className={cn(
                              "flex-shrink-0 px-2 py-0.5 rounded text-xs font-medium",
                              getMeasureStatusColor(measure.status)
                            )}
                          >
                            {getMeasureStatusLabel(measure.status)}
                          </span>

                          {/* Wirksamkeit */}
                          <div className="flex-shrink-0 flex items-center gap-1.5 w-16 justify-end">
                            <div className="w-8 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full bg-primary"
                                style={{ width: `${measure.wirksamkeit}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground w-8 text-right">
                              {measure.wirksamkeit}%
                            </span>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-muted/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <span className="text-sm text-foreground font-medium">
              {`${selectedCount} Maßnahmen ausgewählt`}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors bg-transparent"
            >
              Abbrechen
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="px-6 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Aktualisieren
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
