import { NextRequest, NextResponse } from 'next/server';
import { llm } from '@/lib/llm/client';
import { generateAssetSuggestionPrompt, AssetSuggestionContext } from '@/lib/llm/prompts/assets';

export async function POST(req: NextRequest) {
  try {
    const { industry, companyType, companySize } = await req.json() as AssetSuggestionContext;

    if (!industry || !companyType) {
      return NextResponse.json(
        { error: 'industry and companyType required' },
        { status: 400 }
      );
    }

    const prompt = generateAssetSuggestionPrompt({ industry, companyType, companySize });
    
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
    console.error('Asset Suggestion Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
