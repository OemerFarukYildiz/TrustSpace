import { NextRequest } from "next/server";

interface ControlSummary {
  code: string;
  title: string;
  description?: string;
  justification?: string;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY nicht konfiguriert" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { messages, controls } = await req.json() as {
    messages: { role: string; content: string }[];
    controls: ControlSummary[];
  };

  if (!messages || !Array.isArray(messages)) {
    return new Response(JSON.stringify({ error: "messages array erforderlich" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Build controls context: include full justification text so the AI can read and edit them
  const allControls = controls || [];
  const withJustification = allControls.filter((c) => c.justification);
  const withoutJustification = allControls.filter((c) => !c.justification);

  const controlsWithText = withJustification
    .map((c) => `[${c.code}] ${c.title}\nBegründung: ${c.justification}`)
    .join("\n\n");

  const controlsWithout = withoutJustification
    .map((c) => `[${c.code}] ${c.title}`)
    .join("\n");

  const systemPrompt = `Du bist der TrustSpace SOA-Assistent für ISO 27001:2022. Du hilfst bei der Erstellung und Bearbeitung des gesamten Statement of Applicability (SOA).

STATISTIK: ${allControls.length} Controls gesamt, ${withJustification.length} mit Begründung, ${withoutJustification.length} ohne.

=== CONTROLS MIT BEGRÜNDUNG ===
${controlsWithText || "(keine)"}

=== CONTROLS OHNE BEGRÜNDUNG ===
${controlsWithout || "(keine)"}

DEINE AUFGABEN:
1. Du KENNST alle Begründungen oben. Wenn der Nutzer sagt "ersetze [Firmenname] durch XY GmbH" oder "passe die Begründungen an", dann tu das für ALLE relevanten Controls.
2. Wenn der Nutzer Tools/Software/Prozesse/Infrastruktur nennt, identifiziere alle relevanten Controls und schlage passende Begründungen vor - sowohl neue als auch Verbesserungen bestehender.
3. Wenn du mehr Infos brauchst, frage gezielt nach.
4. Begründungen sollen audit-tauglich, professionell und konkret sein.
5. Bearbeite immer so viele Controls wie möglich in einer Antwort.

FORMAT für Vorschläge (kann mehrfach pro Antwort vorkommen):
===UPDATE_START===
CONTROL: A.X.Y
JUSTIFICATION: Die vollständige neue Begründung hier...
===UPDATE_END===

Erkläre kurz was du änderst, dann liefere die Updates. Wenn es viele Updates sind, mach sie in Batches (max 8 pro Antwort) und sag dem Nutzer er soll "weiter" schreiben für den nächsten Batch.`;

  console.debug(`SOA Global Chat: controls=${(controls || []).length}, messages=${messages.length}`);

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4096,
      temperature: 0.4,
      system: systemPrompt,
      messages,
      stream: true,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Anthropic API Fehler:", response.status, errorText);
    return new Response(JSON.stringify({ error: errorText }), {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(response.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
