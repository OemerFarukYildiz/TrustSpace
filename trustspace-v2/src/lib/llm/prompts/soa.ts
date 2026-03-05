// SOA (Statement of Applicability) Prompts

export interface SOAContext {
  organizationName: string;
  industry: string;
  assets: string[];
  existingDocuments: string[];
}

export function generateSOAJustificationPrompt(
  controlCode: string,
  controlTitle: string,
  context: SOAContext
): string {
  return `Generiere eine Begründung für das ISO 27001:2022 Control im Statement of Applicability (SOA).

**Control:** ${controlCode} - ${controlTitle}

**Kontext:**
- Unternehmen: ${context.organizationName}
- Branche: ${context.industry}
- Wichtige Assets: ${context.assets.join(', ') || 'Nicht spezifiziert'}
- Vorhandene Dokumente/Richtlinien: ${context.existingDocuments.join(', ') || 'Keine Angabe'}

**Aufgabe:**
Schreibe eine kurze, prägnante Begründung (2-4 Sätze), warum dieses Control anwendbar (applicable) ist und wie es im Unternehmen umgesetzt wird. Die Begründung soll:
- Auf die Branche und Assets eingehen
- Konkret und nachvollziehbar sein
- ISO 27001 Audit-tauglich formuliert sein

Antworte NUR mit der Begründung, ohne Einleitung oder zusätzlichen Text.`;
}

export function generateSOAChatPrompt(controlCode: string, controlTitle: string): string {
  return `Du bist ein ISMS-Berater für ISO 27001. Du hilfst bei der Erstellung des Statement of Applicability (SOA).

Aktuelles Control: ${controlCode} - ${controlTitle}

Stelle dem Nutzer gezielte Fragen, um eine passende Begründung für dieses Control zu erstellen. Frage nach:
1. Welche Assets werden von diesem Control betroffen?
2. Gibt es bereits umgesetzte Maßnahmen?
3. Welche Risiken werden dadurch adressiert?

Sei professionell, präzise und hilfreich.`;
}
