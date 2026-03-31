import { NextRequest, NextResponse } from 'next/server';
import { llm } from '@/lib/llm/client';
import { generateSOAJustificationPrompt, SOAContext } from '@/lib/llm/prompts/soa';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      controlCode: string;
      controlTitle: string;
      context: SOAContext;
      companyContext?: string;
    };

    const { controlCode, controlTitle, context, companyContext } = body;

    if (!controlCode || !controlTitle) {
      return NextResponse.json(
        { error: 'controlCode und controlTitle sind erforderlich' },
        { status: 400 }
      );
    }

    // Merge companyContext into the SOAContext so the prompt can reference it
    const enrichedContext: SOAContext = {
      ...context,
      companyContext: companyContext ?? context.companyContext,
    };

    const prompt = generateSOAJustificationPrompt(controlCode, controlTitle, enrichedContext);

    const response = await llm.complete(prompt, {
      temperature: 0.5,
      maxTokens: 1024,
    });

    return NextResponse.json({
      justification: response.content.trim(),
      provider: llm.getProvider(),
    });
  } catch (error) {
    console.error('SOA Generation Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unbekannter Fehler' },
      { status: 500 }
    );
  }
}
