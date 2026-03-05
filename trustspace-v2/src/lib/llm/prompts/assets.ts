// Asset Management Prompts

export interface AssetSuggestionContext {
  industry: string;
  companyType: string;
  companySize?: string;
}

export function generateAssetSuggestionPrompt(context: AssetSuggestionContext): string {
  return `Als ISMS-Experte für ISO 27001, analysiere das folgende Unternehmen und schlage typische Assets vor.

**Unternehmensprofil:**
- Branche: ${context.industry}
- Unternehmenstyp: ${context.companyType}
${context.companySize ? `- Unternehmensgröße: ${context.companySize}` : ''}

**Aufgabe:**
Generiere eine Liste typischer primärer und sekundärer Assets für dieses Unternehmen.

**Primäre Assets** (Informationen und Prozesse):
- Kundendaten, Geschäftsgeheimnisse, etc.

**Sekundäre Assets** (unterstützend):
- Hardware, Software, Personal, etc.

Für jedes Asset schlage vor:
1. Name des Assets
2. Typ (primary/secondary)
3. Kategorie (information, process, hardware, software, personnel)
4. Empfohlener Schutzbedarf (CIA: Vertraulichkeit/Integrität/Verfügbarkeit auf Skala 1-5)

Antworte im JSON-Format:
{
  "primaryAssets": [
    {"name": "...", "category": "...", "confidentiality": 4, "integrity": 5, "availability": 3}
  ],
  "secondaryAssets": [
    {"name": "...", "category": "...", "confidentiality": 3, "integrity": 4, "availability": 4}
  ]
}`;
}
