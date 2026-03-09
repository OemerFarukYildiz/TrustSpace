export interface Measure {
  id: string
  code: string
  title: string
  category: string
  status: "umgesetzt" | "teilweise" | "geplant" | "offen"
  wirksamkeit: number // 0-100
}

export interface Risk {
  id: string
  asset: string
  bezeichnung: string
  verantwortlich: string
  reviewDatum: string
  datum: string
  bruttoRisiko: number
  nettoRisiko: number | null
  risikoStufe: "Kritisch" | "Hoch" | "Mittel" | "Niedrig"
  nettoRisikoStufe: "Kritisch" | "Hoch" | "Mittel" | "Niedrig" | null
  beschreibung: string
  measures: Measure[]
  measureCount: number
  risikoBerechnet: "brutto" | "netto" | "keine"
}

export const allMeasures: Measure[] = [
  // A5 - Organisatorische Kontrollen
  { id: "a5-1", code: "A5.1", title: "Informationssicherheitsrichtlinien", category: "A5 Organisatorische Kontrollen", status: "umgesetzt", wirksamkeit: 85 },
  { id: "a5-2", code: "A5.2", title: "Rollen und Verantwortlichkeiten", category: "A5 Organisatorische Kontrollen", status: "umgesetzt", wirksamkeit: 90 },
  { id: "a5-3", code: "A5.3", title: "Aufgabentrennung", category: "A5 Organisatorische Kontrollen", status: "teilweise", wirksamkeit: 60 },
  { id: "a5-4", code: "A5.4", title: "Verantwortlichkeiten des Managements", category: "A5 Organisatorische Kontrollen", status: "umgesetzt", wirksamkeit: 80 },
  { id: "a5-5", code: "A5.5", title: "Kontakt mit Behörden", category: "A5 Organisatorische Kontrollen", status: "geplant", wirksamkeit: 0 },
  { id: "a5-6", code: "A5.6", title: "Kontakt mit Interessengruppen", category: "A5 Organisatorische Kontrollen", status: "offen", wirksamkeit: 0 },
  { id: "a5-7", code: "A5.7", title: "Bedrohungsintelligenz", category: "A5 Organisatorische Kontrollen", status: "teilweise", wirksamkeit: 45 },
  { id: "a5-8", code: "A5.8", title: "Informationssicherheit im Projektmanagement", category: "A5 Organisatorische Kontrollen", status: "umgesetzt", wirksamkeit: 75 },
  { id: "a5-9", code: "A5.9", title: "Inventar der Informationen und zugehörigen Vermögenswerte", category: "A5 Organisatorische Kontrollen", status: "umgesetzt", wirksamkeit: 88 },
  { id: "a5-10", code: "A5.10", title: "Zulässige Nutzung von Informationen", category: "A5 Organisatorische Kontrollen", status: "umgesetzt", wirksamkeit: 70 },
  { id: "a5-16", code: "A5.16", title: "Identitätsmanagement", category: "A5 Organisatorische Kontrollen", status: "umgesetzt", wirksamkeit: 82 },
  { id: "a5-17", code: "A5.17", title: "Informationen zur Authentifizierung", category: "A5 Organisatorische Kontrollen", status: "umgesetzt", wirksamkeit: 90 },
  { id: "a5-18", code: "A5.18", title: "Zugangsrechte", category: "A5 Organisatorische Kontrollen", status: "teilweise", wirksamkeit: 65 },
  { id: "a5-19", code: "A5.19", title: "Informationssicherheit in Lieferantenbeziehungen", category: "A5 Organisatorische Kontrollen", status: "geplant", wirksamkeit: 0 },
  { id: "a5-20", code: "A5.20", title: "Behandlung von Informationssicherheit in Lieferantenvereinbarungen", category: "A5 Organisatorische Kontrollen", status: "offen", wirksamkeit: 0 },
  { id: "a5-21", code: "A5.21", title: "Umgang mit der Informationssicherheit in der IKT-Lieferkette", category: "A5 Organisatorische Kontrollen", status: "teilweise", wirksamkeit: 40 },
  { id: "a5-22", code: "A5.22", title: "Überwachung und Änderungsmanagement von Lieferantendienstleistungen", category: "A5 Organisatorische Kontrollen", status: "offen", wirksamkeit: 0 },

  // A6 - Personenbezogene Kontrollen
  { id: "a6-1", code: "A6.1", title: "Sicherheitsüberprüfung", category: "A6 Personenbezogene Kontrollen", status: "umgesetzt", wirksamkeit: 85 },
  { id: "a6-2", code: "A6.2", title: "Beschäftigungsbedingungen", category: "A6 Personenbezogene Kontrollen", status: "umgesetzt", wirksamkeit: 90 },
  { id: "a6-3", code: "A6.3", title: "Sensibilisierung und Schulung", category: "A6 Personenbezogene Kontrollen", status: "teilweise", wirksamkeit: 55 },
  { id: "a6-4", code: "A6.4", title: "Maßregelungsprozess", category: "A6 Personenbezogene Kontrollen", status: "umgesetzt", wirksamkeit: 80 },
  { id: "a6-5", code: "A6.5", title: "Verantwortlichkeiten nach Beendigung", category: "A6 Personenbezogene Kontrollen", status: "geplant", wirksamkeit: 0 },
  { id: "a6-6", code: "A6.6", title: "Vertraulichkeits- oder Geheimhaltungsvereinbarungen", category: "A6 Personenbezogene Kontrollen", status: "umgesetzt", wirksamkeit: 92 },
  { id: "a6-7", code: "A6.7", title: "Fernarbeit", category: "A6 Personenbezogene Kontrollen", status: "teilweise", wirksamkeit: 60 },
  { id: "a6-8", code: "A6.8", title: "Meldung von Informationssicherheitsereignissen", category: "A6 Personenbezogene Kontrollen", status: "umgesetzt", wirksamkeit: 78 },

  // A7 - Physische Kontrollen
  { id: "a7-1", code: "A7.1", title: "Physische Sicherheitsperimeter", category: "A7 Physische Kontrollen", status: "umgesetzt", wirksamkeit: 88 },
  { id: "a7-2", code: "A7.2", title: "Physischer Zutritt", category: "A7 Physische Kontrollen", status: "umgesetzt", wirksamkeit: 85 },
  { id: "a7-3", code: "A7.3", title: "Sicherung von Büros, Räumen und Einrichtungen", category: "A7 Physische Kontrollen", status: "teilweise", wirksamkeit: 70 },
  { id: "a7-4", code: "A7.4", title: "Physische Sicherheitsüberwachung", category: "A7 Physische Kontrollen", status: "umgesetzt", wirksamkeit: 82 },

  // A8 - Technologische Kontrollen
  { id: "a8-1", code: "A8.1", title: "Benutzerendgeräte", category: "A8 Technologische Kontrollen", status: "umgesetzt", wirksamkeit: 75 },
  { id: "a8-2", code: "A8.2", title: "Privilegierte Zugriffsrechte", category: "A8 Technologische Kontrollen", status: "teilweise", wirksamkeit: 65 },
  { id: "a8-3", code: "A8.3", title: "Beschränkung des Informationszugriffs", category: "A8 Technologische Kontrollen", status: "umgesetzt", wirksamkeit: 80 },
  { id: "a8-4", code: "A8.4", title: "Zugriff auf Quellcode", category: "A8 Technologische Kontrollen", status: "umgesetzt", wirksamkeit: 90 },
  { id: "a8-5", code: "A8.5", title: "Sichere Authentifizierung", category: "A8 Technologische Kontrollen", status: "umgesetzt", wirksamkeit: 88 },
  { id: "a8-6", code: "A8.6", title: "Kapazitätssteuerung", category: "A8 Technologische Kontrollen", status: "teilweise", wirksamkeit: 50 },
  { id: "a8-7", code: "A8.7", title: "Schutz gegen Schadsoftware", category: "A8 Technologische Kontrollen", status: "umgesetzt", wirksamkeit: 92 },
  { id: "a8-8", code: "A8.8", title: "Management technischer Schwachstellen", category: "A8 Technologische Kontrollen", status: "teilweise", wirksamkeit: 60 },
  { id: "a8-9", code: "A8.9", title: "Konfigurationsmanagement", category: "A8 Technologische Kontrollen", status: "teilweise", wirksamkeit: 55 },
  { id: "a8-10", code: "A8.10", title: "Löschung von Informationen", category: "A8 Technologische Kontrollen", status: "geplant", wirksamkeit: 0 },
  { id: "a8-11", code: "A8.11", title: "Datenmaskierung", category: "A8 Technologische Kontrollen", status: "offen", wirksamkeit: 0 },
  { id: "a8-12", code: "A8.12", title: "Verhinderung von Datenlecks", category: "A8 Technologische Kontrollen", status: "teilweise", wirksamkeit: 45 },
  { id: "a8-15", code: "A8.15", title: "Protokollierung", category: "A8 Technologische Kontrollen", status: "umgesetzt", wirksamkeit: 85 },
  { id: "a8-16", code: "A8.16", title: "Überwachungsaktivitäten", category: "A8 Technologische Kontrollen", status: "umgesetzt", wirksamkeit: 78 },
]

export const risks: Risk[] = [
  {
    id: "b009",
    asset: "Productive Provisioning of Software/Service",
    bezeichnung: "b009-configuration-errors-productive-provisioning-of-software-service",
    verantwortlich: "Max Müller",
    reviewDatum: "1 Dezember 2026",
    datum: "1 August 2025",
    bruttoRisiko: 18.0,
    nettoRisiko: 9.5,
    risikoStufe: "Hoch",
    nettoRisikoStufe: "Mittel",
    beschreibung: "Konfigurationsfehler bei der produktiven Bereitstellung von Software und Services können zu Sicherheitslücken führen.",
    measures: [allMeasures[30], allMeasures[31], allMeasures[34], allMeasures[35], allMeasures[36]],
    measureCount: 5,
    risikoBerechnet: "netto",
  },
  {
    id: "b010",
    asset: "Sprint Planning & Execution",
    bezeichnung: "b010-insufficient-availability-of-personnel-sprint-planning-execution",
    verantwortlich: "Anna Schmidt",
    reviewDatum: "8 Dezember 2026",
    datum: "1 August 2025",
    bruttoRisiko: 10.02,
    nettoRisiko: null,
    risikoStufe: "Mittel",
    nettoRisikoStufe: null,
    beschreibung: "Unzureichende Verfügbarkeit von Personal kann die Sprint-Planung und -Ausführung gefährden.",
    measures: [allMeasures[17], allMeasures[18], allMeasures[19]],
    measureCount: 3,
    risikoBerechnet: "brutto",
  },
  {
    id: "b006",
    asset: "IT Backup and Recovery",
    bezeichnung: "b006-failure-or-malfunction-of-service-provider-it-backup-and-recovery",
    verantwortlich: "Thomas Weber",
    reviewDatum: "4 Dezember 2026",
    datum: "1 August 2025",
    bruttoRisiko: 12.0,
    nettoRisiko: 6.0,
    risikoStufe: "Mittel",
    nettoRisikoStufe: "Niedrig",
    beschreibung: "Ausfall oder Fehlfunktion des Dienstleisters für IT-Backup und Recovery.",
    measures: [allMeasures[0], allMeasures[1], allMeasures[7], allMeasures[8], allMeasures[25], allMeasures[26], allMeasures[34]],
    measureCount: 7,
    risikoBerechnet: "netto",
  },
  {
    id: "b004",
    asset: "IT Backup and Recovery",
    bezeichnung: "b004-inadequate-emergency-management-it-backup-and-recovery",
    verantwortlich: "Lisa Koch",
    reviewDatum: "1 Dezember 2026",
    datum: "1 August 2025",
    bruttoRisiko: 12.0,
    nettoRisiko: null,
    risikoStufe: "Mittel",
    nettoRisikoStufe: null,
    beschreibung: "Unzureichendes Notfallmanagement bei IT-Backup und Recovery.",
    measures: [],
    measureCount: 0,
    risikoBerechnet: "keine",
  },
  {
    id: "b017",
    asset: "Security Software Management",
    bezeichnung: "b017-malicious-programs-security-software-management",
    verantwortlich: "Peter Braun",
    reviewDatum: "8 Dezember 2026",
    datum: "1 August 2025",
    bruttoRisiko: 6.66,
    nettoRisiko: 3.2,
    risikoStufe: "Niedrig",
    nettoRisikoStufe: "Niedrig",
    beschreibung: "Schadprogramme im Bereich Security Software Management.",
    measures: [allMeasures[33], allMeasures[34], allMeasures[35], allMeasures[36]],
    measureCount: 4,
    risikoBerechnet: "netto",
  },
  {
    id: "b024",
    asset: "IT Access & Identity Management",
    bezeichnung: "b024-unauthorized-use-of-equipment-or-applications-it-access-identity-management",
    verantwortlich: "Sarah Wagner",
    reviewDatum: "1 Dezember 2026",
    datum: "1 August 2025",
    bruttoRisiko: 13.32,
    nettoRisiko: 7.8,
    risikoStufe: "Hoch",
    nettoRisikoStufe: "Mittel",
    beschreibung: "Unbefugte Nutzung von Geräten oder Anwendungen im IT Access & Identity Management.",
    measures: [allMeasures[10], allMeasures[11], allMeasures[12], allMeasures[29], allMeasures[30], allMeasures[31]],
    measureCount: 6,
    risikoBerechnet: "netto",
  },
  {
    id: "b010b",
    asset: "IT Access & Identity Management",
    bezeichnung: "b010-insufficient-availability-of-personnel-it-access-identity-management",
    verantwortlich: "Michael Fischer",
    reviewDatum: "1 Dezember 2026",
    datum: "1 August 2025",
    bruttoRisiko: 9.99,
    nettoRisiko: null,
    risikoStufe: "Mittel",
    nettoRisikoStufe: null,
    beschreibung: "Unzureichende Verfügbarkeit von Personal im IT Access & Identity Management.",
    measures: [allMeasures[17], allMeasures[18]],
    measureCount: 2,
    risikoBerechnet: "brutto",
  },
  {
    id: "b001",
    asset: "IT Access & Identity Management",
    bezeichnung: "b001-violation-of-laws-regulations-data-protection-it-access-identity-management",
    verantwortlich: "Julia Hoffmann",
    reviewDatum: "8 Dezember 2026",
    datum: "1 August 2025",
    bruttoRisiko: 3.33,
    nettoRisiko: 1.5,
    risikoStufe: "Niedrig",
    nettoRisikoStufe: "Niedrig",
    beschreibung: "Verstoß gegen Gesetze, Vorschriften, Datenschutzbestimmungen im IT Access & Identity Management.",
    measures: [allMeasures[0], allMeasures[1], allMeasures[3], allMeasures[10], allMeasures[11], allMeasures[12], allMeasures[29], allMeasures[30]],
    measureCount: 8,
    risikoBerechnet: "netto",
  },
]

export function getRiskColor(score: number): string {
  if (score >= 15) return "hsl(0 72% 55%)" // destructive/red
  if (score >= 10) return "hsl(35 85% 55%)" // warning/orange
  if (score >= 5) return "hsl(50 85% 50%)" // yellow
  return "hsl(160 55% 45%)" // success/green
}

export function getRiskBgClass(stufe: string): string {
  switch (stufe) {
    case "Kritisch": return "bg-red-100 text-red-800"
    case "Hoch": return "bg-orange-100 text-orange-800"
    case "Mittel": return "bg-amber-100 text-amber-800"
    case "Niedrig": return "bg-emerald-100 text-emerald-800"
    default: return "bg-muted text-muted-foreground"
  }
}

export function getMeasureStatusColor(status: Measure["status"]): string {
  switch (status) {
    case "umgesetzt": return "bg-emerald-100 text-emerald-800"
    case "teilweise": return "bg-amber-100 text-amber-800"
    case "geplant": return "bg-blue-100 text-blue-800"
    case "offen": return "bg-red-100 text-red-800"
  }
}

export function getMeasureStatusLabel(status: Measure["status"]): string {
  switch (status) {
    case "umgesetzt": return "Umgesetzt"
    case "teilweise": return "Teilweise"
    case "geplant": return "Geplant"
    case "offen": return "Offen"
  }
}
