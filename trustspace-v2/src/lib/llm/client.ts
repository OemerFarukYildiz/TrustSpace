// LLM Client Abstraction Layer
// Supports: Ollama (local), Claude, OpenAI

type LLMProvider = 'ollama' | 'claude' | 'openai';

interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface LLMOptions {
  temperature?: number;
  maxTokens?: number;
  model?: string;
}

interface LLMResponse {
  content: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

class LLMClient {
  private provider: LLMProvider;

  constructor() {
    this.provider = (process.env.LLM_PROVIDER as LLMProvider) || 'ollama';
  }

  async chat(messages: LLMMessage[], options?: LLMOptions): Promise<LLMResponse> {
    switch (this.provider) {
      case 'ollama':
        return this.callOllama(messages, options);
      case 'claude':
        return this.callClaude(messages, options);
      case 'openai':
        return this.callOpenAI(messages, options);
      default:
        throw new Error(`Unknown LLM provider: ${this.provider}`);
    }
  }

  async complete(prompt: string, options?: LLMOptions): Promise<LLMResponse> {
    return this.chat([{ role: 'user', content: prompt }], options);
  }

  private async callOllama(messages: LLMMessage[], options?: LLMOptions): Promise<LLMResponse> {
    const baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    const model = options?.model || process.env.OLLAMA_MODEL || 'llama3.2';

    const response = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages,
        stream: false,
        options: {
          temperature: options?.temperature ?? 0.7,
          num_predict: options?.maxTokens ?? 2048,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Ollama error: ${error}`);
    }

    const data = await response.json();
    return {
      content: data.message?.content || '',
    };
  }

  private async callClaude(messages: LLMMessage[], options?: LLMOptions): Promise<LLMResponse> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY not set');
    }

    const systemMessage = messages.find(m => m.role === 'system');
    const chatMessages = messages.filter(m => m.role !== 'system');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: options?.model || 'claude-3-5-sonnet-20241022',
        max_tokens: options?.maxTokens ?? 4096,
        temperature: options?.temperature ?? 0.7,
        system: systemMessage?.content,
        messages: chatMessages,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Claude error: ${error}`);
    }

    const data = await response.json();
    return {
      content: data.content?.[0]?.text || '',
      usage: data.usage,
    };
  }

  private async callOpenAI(messages: LLMMessage[], options?: LLMOptions): Promise<LLMResponse> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY not set');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: options?.model || 'gpt-4o-mini',
        messages,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 4096,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI error: ${error}`);
    }

    const data = await response.json();
    return {
      content: data.choices?.[0]?.message?.content || '',
      usage: data.usage,
    };
  }

  getProvider(): LLMProvider {
    return this.provider;
  }
}

export const llm = new LLMClient();
export type { LLMMessage, LLMOptions, LLMResponse };
