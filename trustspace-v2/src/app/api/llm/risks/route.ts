import { NextRequest, NextResponse } from 'next/server';
import { llm } from '@/lib/llm/client';
import { generateRiskSuggestionPrompt, RiskSuggestionContext } from '@/lib/llm/prompts/risks';

export async function POST(req: NextRequest) {
  try {
    const { assetName, assetType, assetCategory, industry } = await req.json() as RiskSuggestionContext;

    if (!assetName || !assetType) {
      return NextResponse.json(
        { error: 'assetName and assetType required' },
        { status: 400 }
      );
    }

    const prompt = generateRiskSuggestionPrompt({ assetName, assetType, assetCategory, industry });
    
    const response = await llm.complete(prompt, {
      temperature: 0.7,
      maxTokens: 2000,
    });

    // Try to parse JSON response
    let suggestions;
    try {
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        suggestions = JSON.parse(jsonMatch[0]);
      }
    } catch {
      // If JSON parsing fails, return raw content
    }

    return NextResponse.json({
      suggestions,
      raw: response.content,
      provider: llm.getProvider(),
    });
  } catch (error) {
    console.error('Risk Suggestion Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
