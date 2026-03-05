import { NextRequest, NextResponse } from 'next/server';
import { llm } from '@/lib/llm/client';
import { generateVendorWebSearchPrompt, VendorInfoContext } from '@/lib/llm/prompts/vendors';

export async function POST(req: NextRequest) {
  try {
    const { vendorName, services, category } = await req.json() as VendorInfoContext;

    if (!vendorName) {
      return NextResponse.json(
        { error: 'vendorName required' },
        { status: 400 }
      );
    }

    const prompt = generateVendorWebSearchPrompt({ vendorName, services, category });
    
    const response = await llm.complete(prompt, {
      temperature: 0.3,
      maxTokens: 1000,
    });

    // Try to parse JSON response
    let info;
    try {
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        info = JSON.parse(jsonMatch[0]);
      }
    } catch {
      // If JSON parsing fails, return raw content
    }

    return NextResponse.json({
      info,
      raw: response.content,
      provider: llm.getProvider(),
    });
  } catch (error) {
    console.error('Vendor Info Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
