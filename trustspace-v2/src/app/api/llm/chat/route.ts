import { NextRequest, NextResponse } from 'next/server';
import { llm } from '@/lib/llm/client';

export async function POST(req: NextRequest) {
  try {
    const { messages, options } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array required' },
        { status: 400 }
      );
    }

    const response = await llm.chat(messages, options);

    return NextResponse.json({
      content: response.content,
      provider: llm.getProvider(),
    });
  } catch (error) {
    console.error('LLM Chat Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
