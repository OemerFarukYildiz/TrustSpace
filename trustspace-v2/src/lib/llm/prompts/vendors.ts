// Vendor Assessment Prompts

export interface VendorInfoContext {
  vendorName: string;
  services: string;
  category: string;
}

export function generateVendorWebSearchPrompt(context: VendorInfoContext): string {
  return `Recherchiere öffentlich verfügbare Informationen über den folgenden Dienstleister.

**Dienstleister:** ${context.vendorName}
**Kategorie:** ${context.category}
**Eingesetzte Dienste:** ${context.services}

**Gesuchte Informationen:**
1. Trust Center / Security-Seite URL
2. Zertifizierungen (ISO 27001, SOC 2, etc.)
3. Datenschutzbeauftragter oder Sicherheitskontakt
4. DSGVO-Konformitätshinweise
5. Unterauftragsverarbeiter (Sub-processors)

Antworte im JSON-Format:
{
  "trustCenterUrl": "...",
  "certifications": ["ISO 27001", "SOC 2"],
  "dpoContact": "...",
  "gdprCompliant": true/false,
  "notes": "..."
}

Wenn Informationen nicht verfügbar sind, verwende null oder leere Arrays.`;
}

export function generateVendorAssessmentSummaryPrompt(assessments: { question: string; answer: string; comment?: string }[]): string {
  const assessmentText = assessments.map((a, i) => 
    `${i + 1}. ${a.question}\n   Antwort: ${a.answer}${a.comment ? `\n   Kommentar: ${a.comment}` : ''}`
  ).join('\n\n');

  return `Erstelle eine Zusammenfassung der Lieferantenbewertung basierend auf den folgenden Antworten.

**Fragen und Antworten:**
${assessmentText}

**Aufgabe:**
1. Berechne einen Gesamtscore (Prozentsatz der "Yes"-Antworten, "Partial" zählt als 0.5)
2. Erstelle eine kurze Bewertung (2-3 Sätze)
3. Empfehle eine Entscheidung (Freigegeben / Bedingt freigegeben / Nicht freigegeben)

Antworte im JSON-Format:
{
  "score": 85,
  "scoreLabel": "Gut",
  "assessment": "...",
  "recommendation": "Freigegeben",
  "risks": ["Risiko 1", "Risiko 2"]
}`;
}

export function generateVendorAutofillPrompt(companyName: string): string {
  return `Recherchiere oeffentlich verfuegbare Informationen ueber das folgende Unternehmen und gib strukturierte Daten zurueck.

**Unternehmen:** ${companyName}

**Gesuchte Informationen:**
1. Offizielle Website-URL
2. Hauptsitz (Adresse, Land)
3. Branche / Kategorie
4. Ungefaehre Mitarbeiterzahl (Bereich: 1-10, 11-50, 51-200, 201-1000, 1001-5000, 5000+)
5. Gruendungsjahr (falls bekannt)
6. Angebotene Dienstleistungen/Produkte
7. Zertifizierungen (ISO 27001, SOC 2, etc.)
8. DSGVO-Konformitaet (ja/nein/unbekannt)
9. Trust Center oder Security-Seite URL
10. Domain fuer Logo (z.B. "telekom.de")

Antworte NUR im JSON-Format:
{
  "website": "https://...",
  "address": "...",
  "country": "Deutschland",
  "category": "IT-Dienstleistung",
  "employeeCount": "201-1000",
  "foundedYear": 2005,
  "services": "...",
  "certifications": ["ISO 27001", "SOC 2"],
  "gdprCompliant": true,
  "trustCenterUrl": "https://...",
  "logoDomain": "example.com",
  "dpoContact": "datenschutz@example.com"
}

Wenn Informationen nicht verfuegbar sind, verwende null.`;
}
