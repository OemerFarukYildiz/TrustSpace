"use client"

import { useState } from "react"
import {
  Shield,
  LayoutDashboard,
  FileText,
  Settings,
  ChevronDown,
  Bell,
  Search,
  BarChart3,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingDown,
} from "lucide-react"
import { risks, type Risk } from "@/lib/risk-data"
import { RiskTable } from "@/components/risk-table"
import { RiskDetail } from "@/components/risk-detail"
import { cn } from "@/lib/utils"

export default function Page() {
  const [selectedRisk, setSelectedRisk] = useState<Risk | null>(null)

  const totalRisks = risks.length
  const highRisks = risks.filter((r) => r.risikoStufe === "Hoch" || r.risikoStufe === "Kritisch").length
  const withMeasures = risks.filter((r) => r.measureCount > 0).length
  const nettoCalculated = risks.filter((r) => r.risikoBerechnet === "netto").length

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col flex-shrink-0">
        <div className="p-5 border-b border-sidebar-border">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
              <Shield className="h-4 w-4 text-sidebar-primary-foreground" />
            </div>
            <span className="text-sm font-bold text-sidebar-foreground tracking-tight">ISMS Manager</span>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-0.5">
          {[
            { icon: LayoutDashboard, label: "Dashboard", active: false },
            { icon: Shield, label: "Risikomanagement", active: true },
            { icon: FileText, label: "SoA / Controls", active: false },
            { icon: BarChart3, label: "Reports", active: false },
            { icon: Settings, label: "Einstellungen", active: false },
          ].map((item) => (
            <button
              key={item.label}
              type="button"
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                item.active
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-full bg-sidebar-accent flex items-center justify-center text-xs font-medium text-sidebar-foreground">
              MM
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-sidebar-foreground truncate">Max Mustermann</p>
              <p className="text-xs text-sidebar-foreground/50 truncate">Administrator</p>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-sidebar-foreground/50" />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="h-14 border-b border-border bg-card flex items-center justify-between px-6 flex-shrink-0">
          <div className="flex items-center gap-3">
            <h1 className="text-sm font-semibold text-foreground">Risikomanagement</h1>
            <span className="text-xs text-muted-foreground">/</span>
            <span className="text-xs text-muted-foreground">{"Risikoübersicht"}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Suche..."
                className="pl-8 pr-3 py-1.5 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 w-48"
              />
            </div>
            <button type="button" className="relative p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground">
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {/* Page Header */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-foreground text-balance">{"Risikoübersicht"}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {"Verwalten und überwachen Sie alle identifizierten Risiken mit ihren Maßnahmen und Berechnungen."}
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Gesamt Risiken</span>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-2xl font-bold text-foreground mt-2">{totalRisks}</p>
              <p className="text-xs text-muted-foreground mt-1">Aktive Risiken im System</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{"Hohe/Kritische"}</span>
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              </div>
              <p className="text-2xl font-bold text-amber-600 mt-2">{highRisks}</p>
              <p className="text-xs text-muted-foreground mt-1">{"Erfordern sofortige Aufmerksamkeit"}</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{"Mit Maßnahmen"}</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </div>
              <p className="text-2xl font-bold text-emerald-600 mt-2">{withMeasures}</p>
              <p className="text-xs text-muted-foreground mt-1">{`${totalRisks - withMeasures} ohne Maßnahmen`}</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Netto berechnet</span>
                <TrendingDown className="h-4 w-4 text-primary" />
              </div>
              <p className="text-2xl font-bold text-primary mt-2">{nettoCalculated}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <Clock className="h-3 w-3 text-amber-500" />
                <p className="text-xs text-muted-foreground">{`${totalRisks - nettoCalculated} ausstehend`}</p>
              </div>
            </div>
          </div>

          {/* Risk Table */}
          <RiskTable onSelectRisk={setSelectedRisk} />
        </main>
      </div>

      {/* Risk Detail Panel */}
      {selectedRisk && (
        <RiskDetail
          risk={selectedRisk}
          onClose={() => setSelectedRisk(null)}
        />
      )}
    </div>
  )
}
