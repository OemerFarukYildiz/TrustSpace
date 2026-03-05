import { NextRequest, NextResponse } from 'next/server';
import { llm } from '@/lib/llm/client';
import { generateSOAJustificationPrompt, SOAContext } from '@/lib/llm/prompts/soa';

export async function POST(req: NextRequest) {
  try {
    const { controlCode, controlTitle, context } = await req.json() as {
      controlCode: string;
      controlTitle: string;
      context: SOAContext;
    };

    if (!controlCode || !controlTitle) {
      return NextResponse.json(
        { error: 'controlCode and controlTitle required' },
        { status: 400 }
      );
    }

    const prompt = generateSOAJustificationPrompt(controlCode, controlTitle, context);
    
    const response = await llm.complete(prompt, {
      temperature: 0.7,
      maxTokens: 500,
    });

    return NextResponse.json({
      justification: response.content.trim(),
      provider: llm.getProvider(),
    });
  } catch (error) {
    console.error('SOA Generation Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
