// Risk Assessment Prompts

export interface RiskSuggestionContext {
  assetName: string;
  assetType: string;
  assetCategory: string;
  industry: string;
}

export function generateRiskSuggestionPrompt(context: RiskSuggestionContext): string {
  return `Als Risk Manager für ISO 27001, analysiere das folgende Asset und schlage typische Risiken vor.

**Asset:**
- Name: ${context.assetName}
- Typ: ${context.assetType}
- Kategorie: ${context.assetCategory}
- Branche: ${context.industry}

**Aufgabe:**
Generiere 3-5 typische Risiken, die dieses Asset betreffen könnten. Für jedes Risiko:
1. Titel (kurz, prägnant)
2. Beschreibung (1-2 Sätze)
3. Einschätzung der Eintrittswahrscheinlichkeit (1-5)
4. Einschätzung des Schadensausmaßes (1-5)
5. Passende ISO 27001 Controls (A.5.x, A.6.x, etc.)

Berücksichtige typische Bedrohungen für die Branche ${context.industry}.

Antworte im JSON-Format:
{
  "risks": [
    {
      "title": "...",
      "description": "...",
      "probability": 3,
      "impact": 4,
      "recommendedControls": ["A.5.1", "A.8.2"]
    }
  ]
}`;
}

export function generateControlRecommendationPrompt(riskTitle: string, riskDescription: string): string {
  return `Als ISMS-Experte für ISO 27001, empfehle passende Controls für das folgende Risiko.

**Risiko:** ${riskTitle}
**Beschreibung:** ${riskDescription}

**Aufgabe:**
Empfehle 2-4 relevante ISO 27001:2022 Controls aus den Kategorien A.5-A.8, die dieses Risiko adressieren.

Für jedes Control:
1. Control-Code (z.B. A.5.1)
2. Kurze Begründung, warum es passt

Antworte im JSON-Format:
{
  "recommendedControls": [
    {"code": "A.5.1", "reason": "..."}
  ]
}`;
}
