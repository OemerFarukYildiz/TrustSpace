import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Vollständiger BSI / ISO 27001 Risikoszenarien-Katalog B001-B047
const RISK_SCENARIOS = [
  { code: "B001", name: "Verstoß gegen Gesetze / Vorschriften, Datenschutzbestimmungen, Unternehmensvorgaben / Standards", category: "compliance" },
  { code: "B003", name: "Unzureichende Schulung/Einweisung der Mitarbeiter", category: "operational" },
  { code: "B004", name: "Unzureichendes Notfall-Management", category: "operational" },
  { code: "B005", name: "Nichterfüllung von Produktanforderungen / Fehlentwicklung", category: "strategic" },
  { code: "B006", name: "Ausfall oder Störung von Dienstleister", category: "operational" },
  { code: "B007", name: "Unzureichende Vertragsregelungen", category: "compliance" },
  { code: "B008", name: "Fehlerhafte Nutzung oder Administration von Geräten und Systemen", category: "technical" },
  { code: "B009", name: "Konfigurationsfehler", category: "technical" },
  { code: "B010", name: "Unzureichende Personalverfügbarkeit", category: "operational" },
  { code: "B011", name: "Feuer", category: "environmental" },
  { code: "B012", name: "Wasser", category: "environmental" },
  { code: "B013", name: "Negative Standortfaktoren (Umwelt, Großereignisse, etc.)", category: "environmental" },
  { code: "B014", name: "Ausfall Versorgung (Strom, Wasser, etc.)", category: "environmental" },
  { code: "B015", name: "Ausfall oder Störung von Kommunikationsnetzen", category: "technical" },
  { code: "B016", name: "Sabotage, Vandalismus (Geräte und Datenträger)", category: "technical" },
  { code: "B017", name: "Schadprogramme", category: "technical" },
  { code: "B018", name: "Diebstahl / Verlust von Geräten, Datenträgern oder Dokumenten", category: "technical" },
  { code: "B019", name: "Unberechtigte Wiederherstellung von Informationen", category: "technical" },
  { code: "B020", name: "Daten aus zweifelhaften Quellen", category: "operational" },
  { code: "B021", name: "Manipulation von Hard- oder Software oder Informationen", category: "technical" },
  { code: "B022", name: "Hard- und Software-Fehler", category: "technical" },
  { code: "B024", name: "Unautorisierter Gebrauch von Geräten oder Anwendungen", category: "technical" },
  { code: "B025", name: "Verstoß gegen Urheberrechte und Lizenzen", category: "compliance" },
  { code: "B026", name: "Vertragsverletzungen", category: "compliance" },
  { code: "B027", name: "Unbefugtes Eindringen in Räumlichkeiten", category: "technical" },
  { code: "B028", name: "Fehlender Informationsfluss / Dokumentenlenkung (einschließlich fehlender Berichterstellung)", category: "operational" },
  { code: "B029", name: "Spionage, Abhören", category: "technical" },
  { code: "B030", name: "Nötigung, Erpressung, Korruption", category: "compliance" },
  { code: "B031", name: "Fehlerhafte oder verspätete Wareneingangsprüfung / Materialprüfung", category: "operational" },
  { code: "B032", name: "Fehlerhafte Teile in Produktion oder Lieferung", category: "operational" },
  { code: "B033", name: "Produktionsausfall durch fehlende Instandhaltung", category: "operational" },
  { code: "B034", name: "Produktionsprozess nicht serientauglich / fehlerhafte Freigabe", category: "operational" },
  { code: "B035", name: "Fehlerhafte Prüfmittelverwaltung / -überwachung", category: "operational" },
  { code: "B036", name: "Terminverzug in Entwicklung oder Produktion / Unzureichende Fehleranalyse / Wiederholfehler", category: "operational" },
  { code: "B037", name: "Hohe Folgekosten durch Fehler", category: "financial" },
  { code: "B038", name: "Lieferantenprobleme (Lieferverzug, Falschlieferung, Konkurs, Standortverlagerung, Kapazitätsengpässe)", category: "operational" },
  { code: "B039", name: "Schlechte Lieferantenleistung (Qualität, Kommunikation, Umsetzung Korrekturmaßnahmen)", category: "operational" },
  { code: "B040", name: "Fehlerhafte Dokumentation", category: "operational" },
  { code: "B041", name: "Schlechte Personalplanung / -auswahl", category: "operational" },
  { code: "B042", name: "Eskalation beim Kunden (Imageverlust, Auftragsentzug, Vertragsstrafen)", category: "strategic" },
  { code: "B043", name: "Unzureichende KVP / Verbesserungsmanagement", category: "operational" },
  { code: "B044", name: "Fehlende Managementbewertung, Ziele, Kennzahlen", category: "strategic" },
  { code: "B045", name: "Unzureichende externe Kommunikation", category: "operational" },
  { code: "B046", name: "Unzureichende interne Kommunikation", category: "operational" },
  { code: "B047", name: "Unklare Verantwortlichkeiten / Aufbauorganisation", category: "operational" },
];

// POST /api/seed/threats - Seed alle B001-B047 Risikoszenarien
export async function POST() {
  try {
    // Lösche vorhandene und erstelle komplett neu
    await prisma.riskThreat.deleteMany({});
    await prisma.threatScenario.deleteMany({});

    const created = [];

    for (const scenario of RISK_SCENARIOS) {
      const newThreat = await prisma.threatScenario.create({
        data: {
          code: scenario.code,
          name: scenario.name,
          description: scenario.name,
          category: scenario.category,
          organizationId: "default",
        },
      });
      created.push(newThreat);
    }

    return NextResponse.json({
      message: `${created.length} Risikoszenarien erfolgreich geladen`,
      count: created.length,
      scenarios: created.map((t) => ({ code: t.code, name: t.name })),
    });
  } catch (error) {
    console.error("Failed to seed threats:", error);
    return NextResponse.json({ error: "Failed to seed threats" }, { status: 500 });
  }
}

// GET /api/seed/threats - Prüfe ob Szenarien existieren
export async function GET() {
  try {
    const count = await prisma.threatScenario.count();
    const threats = await prisma.threatScenario.findMany({
      select: { code: true, name: true, category: true },
      orderBy: { code: "asc" },
    });
    return NextResponse.json({ count, seeded: count > 0, threats });
  } catch (error) {
    console.error("Failed to check threats:", error);
    return NextResponse.json({ error: "Failed to check threats" }, { status: 500 });
  }
}
