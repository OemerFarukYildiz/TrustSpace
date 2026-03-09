// Risk Management V2 Prompts - Quantitative Methodik

export interface RiskV2Context {
  assetName: string;
  assetCategory: string;
  assetDescription?: string;
  replacementCost?: number;
  revenueImpact?: number;
  industry?: string;
}

export function generateQuantitativeRiskPrompt(context: RiskV2Context): string {
  return `Du bist ein Experte fuer quantitatives Risikomanagement (FAIR-Methodik). Identifiziere Risiken fuer das folgende Asset.

**Asset:** ${context.assetName}
**Kategorie:** ${context.assetCategory}
${context.assetDescription ? `**Beschreibung:** ${context.assetDescription}` : ''}
${context.replacementCost ? `**Wiederbeschaffungskosten:** ${context.replacementCost} EUR` : ''}
${context.revenueImpact ? `**Umsatzauswirkung pro Tag:** ${context.revenueImpact} EUR` : ''}
${context.industry ? `**Branche:** ${context.industry}` : ''}

**Aufgabe:**
Identifiziere 3-5 relevante Risiken mit quantitativer Bewertung.

Fuer jedes Risiko:
- **Wahrscheinlichkeit** (1-10): Wie wahrscheinlich tritt das Risiko ein?
  1-2: Sehr unwahrscheinlich (< 1% pro Jahr)
  3-4: Unwahrscheinlich (1-10% pro Jahr)
  5-6: Moeglich (10-30% pro Jahr)
  7-8: Wahrscheinlich (30-60% pro Jahr)
  9-10: Sehr wahrscheinlich (> 60% pro Jahr)

- **Auswirkung** (1-10): Wie schwer ist der Schaden?
  1-2: Minimal (< 1.000 EUR)
  3-4: Gering (1.000 - 10.000 EUR)
  5-6: Moderat (10.000 - 100.000 EUR)
  7-8: Erheblich (100.000 - 1.000.000 EUR)
  9-10: Katastrophal (> 1.000.000 EUR)

- **SLE** (Single Loss Expectancy): Geschaetzte Schadenshoehe in EUR
- **ARO** (Annual Rate of Occurrence): Erwartete Haeufigkeit pro Jahr (z.B. 0.1 = alle 10 Jahre)

Antworte im JSON-Format:
{
  "risks": [
    {
      "title": "...",
      "description": "...",
      "riskCategory": "operational|strategic|compliance|financial|technical",
      "threatSource": "internal|external|environmental",
      "vulnerability": "...",
      "bruttoProbability": 5,
      "bruttoImpact": 7,
      "singleLossExpectancy": 250000,
      "annualRateOccurrence": 0.2,
      "riskTreatment": "mitigate|accept|transfer|avoid",
      "treatmentSuggestion": "..."
    }
  ]
}`;
}

export function generateTreatmentPlanPrompt(
  riskTitle: string,
  riskDescription: string,
  currentScore: number,
  sle?: number
): string {
  return `Du bist ein ISMS-Berater. Erstelle einen Massnahmenplan fuer das folgende Risiko.

**Risiko:** ${riskTitle}
**Beschreibung:** ${riskDescription}
**Aktueller Risikoscore:** ${currentScore}/100
${sle ? `**Geschaetzte Schadenshoehe (SLE):** ${sle} EUR` : ''}

**Aufgabe:**
Erstelle einen konkreten Massnahmenplan mit:

1. **Sofortmassnahmen** (Quick Wins, innerhalb 1 Woche)
2. **Kurzfristige Massnahmen** (1-3 Monate)
3. **Langfristige Massnahmen** (3-12 Monate)

Fuer jede Massnahme:
- Beschreibung
- Erwartete Risikoreduktion (in %)
- Geschaetzte Kosten
- Verantwortlicher Bereich

Antworte im JSON-Format:
{
  "treatmentPlan": "Zusammenfassende Beschreibung des Plans...",
  "measures": [
    {
      "phase": "sofort|kurzfristig|langfristig",
      "title": "...",
      "description": "...",
      "riskReduction": 20,
      "estimatedCost": 5000,
      "responsibleArea": "IT|Management|HR|Operations"
    }
  ],
  "expectedNettoScore": 35,
  "expectedNettoSLE": 100000
}`;
}
