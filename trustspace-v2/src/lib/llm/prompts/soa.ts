// SOA (Statement of Applicability) Prompts

export interface SOAContext {
  organizationName: string;
  industry: string;
  assets: string[];
  existingDocuments: string[];
  controlDescription?: string;
  companyContext?: string;
}

export function generateSOAJustificationPrompt(
  controlCode: string,
  controlTitle: string,
  context: SOAContext
): string {
  const companyContextSection = context.companyContext
    ? `\n- Unternehmensspezifische Tools/Prozesse: ${context.companyContext}`
    : '';

  const controlDescriptionSection = context.controlDescription
    ? `\n**Control-Beschreibung (was umgesetzt werden soll):**\n${context.controlDescription}\n`
    : '';

  return `Generiere eine professionelle Begründung für das ISO 27001:2022 Control im Statement of Applicability (SOA).

**Control:** ${controlCode} - ${controlTitle}
${controlDescriptionSection}
**Kontext:**
- Unternehmen: ${context.organizationName}
- Branche: ${context.industry}
- Wichtige Assets: ${context.assets.join(', ') || 'Nicht spezifiziert'}
- Vorhandene Dokumente/Richtlinien: ${context.existingDocuments.join(', ') || 'Keine Angabe'}${companyContextSection}

**Aufgabe:**
Schreibe eine prägnante, audit-taugliche Begründung (3-5 Sätze), warum dieses Control anwendbar (applicable) ist und wie es im Unternehmen konkret umgesetzt wird. Die Begründung soll:
- Direkt auf die Control-Beschreibung eingehen und erklären, wie das Unternehmen die Anforderung erfüllt
- Konkrete Tools, Prozesse oder Maßnahmen nennen, sofern im Kontext angegeben
- Auf die Branche und betroffene Assets eingehen
- ISO 27001 Audit-tauglich und präzise formuliert sein
- Wenn kein Unternehmensname bekannt ist, [Firmenname einfügen] als Platzhalter verwenden

Antworte NUR mit der Begründung, ohne Einleitung, Überschriften oder zusätzlichen Text.`;
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
