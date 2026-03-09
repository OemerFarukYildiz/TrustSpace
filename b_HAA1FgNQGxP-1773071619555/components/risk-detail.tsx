"use client"

import { useState } from "react"
import {
  X,
  ChevronRight,
  AlertTriangle,
  Plus,
  Trash2,
  TrendingDown,
  Calculator,
  Info,
  History,
  ShieldCheck,
  Check,
} from "lucide-react"
import {
  type Risk,
  type Measure,
  getRiskBgClass,
  getMeasureStatusColor,
  getMeasureStatusLabel,
} from "@/lib/risk-data"
import { cn } from "@/lib/utils"
import { MeasureSelector } from "./measure-selector"

type DetailTab = "informationen" | "berechnung" | "massnahmen" | "historie"

export function RiskDetail({
  risk,
  onClose,
}: {
  risk: Risk
  onClose: () => void
}) {
  const [activeTab, setActiveTab] = useState<DetailTab>("informationen")
  const [showMeasureSelector, setShowMeasureSelector] = useState(false)
  const [currentMeasures, setCurrentMeasures] = useState<Measure[]>(risk.measures)

  const handleAddMeasures = (measures: Measure[]) => {
    setCurrentMeasures(measures)
    setShowMeasureSelector(false)
  }

  const handleRemoveMeasure = (measureId: string) => {
    setCurrentMeasures((prev) => prev.filter((m) => m.id !== measureId))
  }

  if (showMeasureSelector) {
    return (
      <MeasureSelector
        selectedMeasures={currentMeasures}
        onConfirm={handleAddMeasures}
        onClose={() => setShowMeasureSelector(false)}
      />
    )
  }

  return (
    <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50 flex justify-end">
      <div className="w-full max-w-2xl bg-card shadow-2xl border-l border-border flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-foreground">
              {risk.id.toUpperCase()} {" \u2013 "} {risk.beschreibung.split(" ").slice(0, 3).join(" ")}
            </h2>
            <div className="flex items-center gap-2">
              <button type="button" className="p-1.5 hover:bg-muted rounded-md transition-colors text-muted-foreground">
                <ChevronRight className="h-4 w-4" />
              </button>
              <span className={cn("px-2.5 py-1 rounded-full text-xs font-semibold", getRiskBgClass(risk.risikoStufe))}>
                {risk.bruttoRisiko.toFixed(2)}
              </span>
              <button type="button" onClick={onClose} className="p-1.5 hover:bg-muted rounded-md transition-colors text-muted-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Asset:</span>
            <span className="font-medium text-primary">{risk.asset}</span>
            <span className="ml-auto text-xs text-emerald-600 font-medium flex items-center gap-1">
              <Check className="h-3 w-3" /> Gespeichert
            </span>
          </div>
        </div>

        {/* Tab Navigation - NEW: 4 tabs instead of 3 */}
        <div className="flex border-b border-border">
          {[
            { id: "informationen" as const, label: "Informationen", icon: Info },
            { id: "massnahmen" as const, label: `Maßnahmen (${currentMeasures.length})`, icon: ShieldCheck },
            { id: "berechnung" as const, label: "Berechnung", icon: Calculator },
            { id: "historie" as const, label: "Historie", icon: History },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium transition-colors border-b-2",
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "informationen" && (
            <InformationenTab risk={risk} />
          )}
          {activeTab === "massnahmen" && (
            <MassnahmenTab
              measures={currentMeasures}
              onAddMeasure={() => setShowMeasureSelector(true)}
              onRemoveMeasure={handleRemoveMeasure}
            />
          )}
          {activeTab === "berechnung" && (
            <BerechnungTab risk={risk} />
          )}
          {activeTab === "historie" && (
            <HistorieTab />
          )}
        </div>
      </div>
    </div>
  )
}

function InformationenTab({ risk }: { risk: Risk }) {
  return (
    <div className="space-y-6">
      {/* Risk Score Overview */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-muted/50 rounded-lg border border-border">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Bruttorisiko</span>
          <div className="flex items-center gap-2 mt-2">
            <span className={cn("text-2xl font-bold", risk.bruttoRisiko >= 15 ? "text-red-600" : risk.bruttoRisiko >= 10 ? "text-amber-600" : "text-emerald-600")}>
              {risk.bruttoRisiko.toFixed(2)}
            </span>
            <span className={cn("px-2 py-0.5 rounded text-xs font-medium", getRiskBgClass(risk.risikoStufe))}>
              {risk.risikoStufe}
            </span>
          </div>
        </div>
        <div className="p-4 bg-muted/50 rounded-lg border border-border">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Nettorisiko</span>
          <div className="flex items-center gap-2 mt-2">
            {risk.nettoRisiko !== null ? (
              <>
                <span className={cn("text-2xl font-bold", risk.nettoRisiko >= 15 ? "text-red-600" : risk.nettoRisiko >= 10 ? "text-amber-600" : "text-emerald-600")}>
                  {risk.nettoRisiko.toFixed(2)}
                </span>
                <span className={cn("px-2 py-0.5 rounded text-xs font-medium", getRiskBgClass(risk.nettoRisikoStufe || "Mittel"))}>
                  {risk.nettoRisikoStufe}
                </span>
                <TrendingDown className="h-4 w-4 text-emerald-500 ml-auto" />
              </>
            ) : (
              <span className="text-sm text-muted-foreground">Noch nicht berechnet</span>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="text-sm font-medium text-foreground block mb-2">Beschreibung</label>
        <div className="border border-border rounded-lg p-4 bg-card min-h-[100px] text-sm text-foreground">
          {risk.beschreibung}
        </div>
        <span className="text-xs text-muted-foreground mt-1 block">{risk.beschreibung.length}/500</span>
      </div>

      {/* Meta Info */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Verantwortlich</span>
          <div className="flex items-center gap-2 mt-2">
            <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium">
              {risk.verantwortlich.split(" ").map(n => n[0]).join("")}
            </div>
            <span className="text-sm font-medium text-foreground">{risk.verantwortlich}</span>
          </div>
        </div>
        <div>
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Review Datum</span>
          <p className="text-sm font-medium text-foreground mt-2">{risk.reviewDatum}</p>
        </div>
      </div>
    </div>
  )
}

function MassnahmenTab({
  measures,
  onAddMeasure,
  onRemoveMeasure,
}: {
  measures: Measure[]
  onAddMeasure: () => void
  onRemoveMeasure: (id: string) => void
}) {
  return (
    <div className="space-y-4">
      {/* Header with add button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{"Verknüpfte Maßnahmen (SoA)"}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {measures.length === 0
              ? "Noch keine Maßnahmen zugewiesen"
              : `${measures.length} Maßnahmen zugewiesen`}
          </p>
        </div>
        <button
          type="button"
          onClick={onAddMeasure}
          className="flex items-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          {"Maßnahmen verwalten"}
        </button>
      </div>

      {/* Wirksamkeit overview */}
      {measures.length > 0 && (
        <div className="p-4 bg-muted/50 rounded-lg border border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Durchschnittliche Wirksamkeit
            </span>
            <span className="text-sm font-semibold text-foreground">
              {Math.round(measures.reduce((acc, m) => acc + m.wirksamkeit, 0) / measures.length)}%
            </span>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{
                width: `${Math.round(measures.reduce((acc, m) => acc + m.wirksamkeit, 0) / measures.length)}%`,
              }}
            />
          </div>
          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <span className="text-xs text-muted-foreground">
                {measures.filter(m => m.status === "umgesetzt").length} Umgesetzt
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />
              <span className="text-xs text-muted-foreground">
                {measures.filter(m => m.status === "teilweise").length} Teilweise
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-blue-500" />
              <span className="text-xs text-muted-foreground">
                {measures.filter(m => m.status === "geplant").length} Geplant
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
              <span className="text-xs text-muted-foreground">
                {measures.filter(m => m.status === "offen").length} Offen
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Measures list */}
      {measures.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
            <AlertTriangle className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">{"Keine Maßnahmen zugewiesen"}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {"Fügen Sie Maßnahmen hinzu, um das Nettorisiko berechnen zu können."}
          </p>
          <button
            type="button"
            onClick={onAddMeasure}
            className="mt-4 flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            {"Maßnahmen hinzufügen"}
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {measures.map((measure) => (
            <div
              key={measure.id}
              className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg hover:border-primary/30 transition-colors group"
            >
              <div className="flex-shrink-0 w-14 text-xs font-mono font-semibold text-primary">
                {measure.code}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{measure.title}</p>
                <p className="text-xs text-muted-foreground">{measure.category}</p>
              </div>
              <span className={cn("flex-shrink-0 px-2 py-0.5 rounded text-xs font-medium", getMeasureStatusColor(measure.status))}>
                {getMeasureStatusLabel(measure.status)}
              </span>
              <div className="flex-shrink-0 w-12 text-right">
                <span className="text-xs font-medium text-foreground">{measure.wirksamkeit}%</span>
              </div>
              <button
                type="button"
                onClick={() => onRemoveMeasure(measure.id)}
                className="flex-shrink-0 p-1 opacity-0 group-hover:opacity-100 hover:bg-red-50 text-red-500 rounded transition-all"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function BerechnungTab({ risk }: { risk: Risk }) {
  return (
    <div className="space-y-6">
      {/* Score Display */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-foreground">Score:</span>
          <span className={cn("px-3 py-1 rounded-full text-sm font-semibold", getRiskBgClass(risk.risikoStufe))}>
            {risk.bruttoRisiko.toFixed(2)}
          </span>
          <span className="flex items-center gap-1 text-sm font-medium">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <span className={risk.risikoStufe === "Hoch" ? "text-amber-600" : "text-foreground"}>
              {risk.risikoStufe}
            </span>
          </span>
        </div>
        <button type="button" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
          Risiko berechnen
        </button>
      </div>

      {/* Brutto vs Netto comparison */}
      {risk.nettoRisiko !== null && (
        <div className="p-5 bg-muted/50 rounded-lg border border-border">
          <h4 className="text-sm font-semibold text-foreground mb-4">{"Brutto- vs. Nettorisiko"}</h4>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">Bruttorisiko</span>
                <span className="font-medium text-foreground">{risk.bruttoRisiko.toFixed(2)}</span>
              </div>
              <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-red-400"
                  style={{ width: `${(risk.bruttoRisiko / 25) * 100}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">Nettorisiko</span>
                <span className="font-medium text-foreground">{risk.nettoRisiko.toFixed(2)}</span>
              </div>
              <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-400"
                  style={{ width: `${(risk.nettoRisiko / 25) * 100}%` }}
                />
              </div>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Risikoreduktion durch Maßnahmen</span>
            <span className="text-sm font-semibold text-emerald-600">
              {`-${Math.round(((risk.bruttoRisiko - risk.nettoRisiko) / risk.bruttoRisiko) * 100)}%`}
            </span>
          </div>
        </div>
      )}

      {/* Beschreibung */}
      <div>
        <label className="text-sm font-medium text-foreground block mb-2">Beschreibung</label>
        <div className="border border-border rounded-lg p-4 bg-card min-h-[80px] text-sm text-muted-foreground">
          {risk.beschreibung || "Beschreibung eingeben"}
        </div>
      </div>
    </div>
  )
}

function HistorieTab() {
  const events = [
    { date: "10. Feb 2026", action: "Nettorisiko berechnet", user: "Max Müller", type: "berechnung" },
    { date: "08. Feb 2026", action: "2 Maßnahmen hinzugefügt (A8.9, A8.7)", user: "Anna Schmidt", type: "massnahme" },
    { date: "05. Feb 2026", action: "Risikobewertung aktualisiert", user: "Max Müller", type: "berechnung" },
    { date: "01. Feb 2026", action: "3 Maßnahmen hinzugefügt", user: "Thomas Weber", type: "massnahme" },
    { date: "15. Jan 2026", action: "Risiko erstellt", user: "Julia Hoffmann", type: "erstellt" },
  ]

  return (
    <div className="space-y-1">
      {events.map((event, i) => (
        <div key={`${event.date}-${i}`} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
          <div className="flex-shrink-0 mt-0.5">
            <div className={cn(
              "h-2 w-2 rounded-full",
              event.type === "berechnung" ? "bg-primary" : event.type === "massnahme" ? "bg-emerald-500" : "bg-muted-foreground"
            )} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">{event.action}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-muted-foreground">{event.date}</span>
              <span className="text-xs text-muted-foreground">{"•"}</span>
              <span className="text-xs text-muted-foreground">{event.user}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
