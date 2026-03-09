"use client"

import { useState } from "react"
import {
  ChevronDown,
  ArrowUpDown,
  Filter,
  Shield,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react"
import { risks, getRiskBgClass, type Risk } from "@/lib/risk-data"
import { cn } from "@/lib/utils"

type TabType = "alle-risiken" | "massnahmen-status"

export function RiskTable({ onSelectRisk }: { onSelectRisk: (risk: Risk) => void }) {
  const [activeTab, setActiveTab] = useState<TabType>("alle-risiken")
  const [expandedRow, setExpandedRow] = useState<string | null>(null)

  return (
    <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
      {/* Tab Navigation - NEW: Additional tab for measures status */}
      <div className="flex items-center border-b border-border">
        <button
          type="button"
          onClick={() => setActiveTab("alle-risiken")}
          className={cn(
            "flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors border-b-2",
            activeTab === "alle-risiken"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <Shield className="h-4 w-4" />
          Alle Risiken
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("massnahmen-status")}
          className={cn(
            "flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors border-b-2",
            activeTab === "massnahmen-status"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <ShieldCheck className="h-4 w-4" />
          {"Maßnahmen & Berechnung"}
        </button>
        <div className="ml-auto pr-4 flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{risks.length} Risiken</span>
        </div>
      </div>

      {activeTab === "alle-risiken" ? (
        <AllRisksView onSelectRisk={onSelectRisk} expandedRow={expandedRow} setExpandedRow={setExpandedRow} />
      ) : (
        <MeasuresStatusView onSelectRisk={onSelectRisk} />
      )}
    </div>
  )
}

function AllRisksView({
  onSelectRisk,
  expandedRow,
  setExpandedRow,
}: {
  onSelectRisk: (risk: Risk) => void
  expandedRow: string | null
  setExpandedRow: (id: string | null) => void
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="w-10 p-3" />
            <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <span className="flex items-center gap-1">Asset <ArrowUpDown className="h-3 w-3" /></span>
            </th>
            <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <span className="flex items-center gap-1">Bezeichnung</span>
            </th>
            <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <span className="flex items-center gap-1">Verantwortlich <Filter className="h-3 w-3" /></span>
            </th>
            <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <span className="flex items-center gap-1">Review <ArrowUpDown className="h-3 w-3" /></span>
            </th>
            <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <span className="flex items-center gap-1">Datum <ArrowUpDown className="h-3 w-3" /></span>
            </th>
            <th className="text-right p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <span className="flex items-center justify-end gap-1">Brutto <Filter className="h-3 w-3" /></span>
            </th>
            <th className="text-right p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <span className="flex items-center justify-end gap-1">Netto <Filter className="h-3 w-3" /></span>
            </th>
          </tr>
        </thead>
        <tbody>
          {risks.map((risk) => (
            <tr
              key={risk.id}
              className="border-b border-border hover:bg-muted/30 transition-colors cursor-pointer group"
              onClick={() => onSelectRisk(risk)}
            >
              <td className="p-3">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setExpandedRow(expandedRow === risk.id ? null : risk.id)
                  }}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ChevronDown className={cn("h-4 w-4 transition-transform", expandedRow === risk.id && "rotate-180")} />
                </button>
              </td>
              <td className="p-3">
                <span className="text-sm font-medium text-primary hover:underline">{risk.asset}</span>
              </td>
              <td className="p-3">
                <span className="text-sm text-muted-foreground truncate max-w-[400px] block">{risk.bezeichnung}</span>
              </td>
              <td className="p-3">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
                    {risk.verantwortlich.split(" ").map(n => n[0]).join("")}
                  </div>
                  <span className="text-sm text-foreground">{risk.verantwortlich}</span>
                </div>
              </td>
              <td className="p-3 text-sm text-muted-foreground">{risk.reviewDatum}</td>
              <td className="p-3 text-sm text-muted-foreground">{risk.datum}</td>
              <td className="p-3 text-right">
                <span className={cn("inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold", getRiskBgClass(risk.risikoStufe))}>
                  {risk.bruttoRisiko.toFixed(2)}
                </span>
              </td>
              <td className="p-3 text-right">
                {risk.nettoRisiko !== null ? (
                  <span className={cn("inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold", getRiskBgClass(risk.nettoRisikoStufe || "Mittel"))}>
                    {risk.nettoRisiko.toFixed(2)}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">--</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function MeasuresStatusView({ onSelectRisk }: { onSelectRisk: (risk: Risk) => void }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Risiko</th>
            <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Asset</th>
            <th className="text-center p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{"Maßnahmen"}</th>
            <th className="text-center p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Berechnungsstatus</th>
            <th className="text-right p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Brutto</th>
            <th className="text-right p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Netto</th>
            <th className="text-center p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Reduktion</th>
          </tr>
        </thead>
        <tbody>
          {risks.map((risk) => {
            const reduktion = risk.nettoRisiko !== null
              ? Math.round(((risk.bruttoRisiko - risk.nettoRisiko) / risk.bruttoRisiko) * 100)
              : null

            return (
              <tr
                key={risk.id}
                className="border-b border-border hover:bg-muted/30 transition-colors cursor-pointer"
                onClick={() => onSelectRisk(risk)}
              >
                <td className="p-3">
                  <span className="text-sm font-medium text-foreground">{risk.id.toUpperCase()}</span>
                </td>
                <td className="p-3">
                  <span className="text-sm text-primary hover:underline">{risk.asset}</span>
                </td>
                <td className="p-3 text-center">
                  <div className="flex items-center justify-center gap-2">
                    {risk.measureCount === 0 ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <AlertCircle className="h-3 w-3" />
                        Keine
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                        <CheckCircle2 className="h-3 w-3" />
                        {risk.measureCount} zugewiesen
                      </span>
                    )}
                  </div>
                </td>
                <td className="p-3 text-center">
                  {risk.risikoBerechnet === "netto" ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                      <CheckCircle2 className="h-3 w-3" />
                      Nettorisiko berechnet
                    </span>
                  ) : risk.risikoBerechnet === "brutto" ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                      <Clock className="h-3 w-3" />
                      Nur Bruttorisiko
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      <ShieldAlert className="h-3 w-3" />
                      Nicht berechnet
                    </span>
                  )}
                </td>
                <td className="p-3 text-right">
                  <span className={cn("inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold", getRiskBgClass(risk.risikoStufe))}>
                    {risk.bruttoRisiko.toFixed(2)}
                  </span>
                </td>
                <td className="p-3 text-right">
                  {risk.nettoRisiko !== null ? (
                    <span className={cn("inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold", getRiskBgClass(risk.nettoRisikoStufe || "Mittel"))}>
                      {risk.nettoRisiko.toFixed(2)}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">--</span>
                  )}
                </td>
                <td className="p-3 text-center">
                  {reduktion !== null ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-emerald-500"
                          style={{ width: `${reduktion}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-emerald-700">{`-${reduktion}%`}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">--</span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
