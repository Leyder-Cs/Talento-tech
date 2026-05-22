import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';

const AI_TIMEOUT = 2000; // 2s max per provider — SDKs have their own retry logic, we cut fast

export interface AiClassification {
  intent:
    | 'search'
    | 'greeting'
    | 'shipping'
    | 'payment'
    | 'contact'
    | 'returns'
    | 'general';
  /** Search terms extracted from user message (only for search intent) */
  terms: string[];
}

/** Simple timeout helper — rejects if the promise takes too long */
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms),
    ),
  ]);
}

@Injectable()
export class ChatbotAiService {
  private readonly logger = new Logger(ChatbotAiService.name);

  private geminiModel: ReturnType<GoogleGenerativeAI['getGenerativeModel']> | null = null;
  private openai: OpenAI | null = null;

  // Circuit breakers: skip a provider after it fails to avoid waiting on timeouts
  private geminiAvailable = true;
  private openaiAvailable = true;

  constructor(private config: ConfigService) {
    const geminiKey = this.config.get<string>('GEMINI_API_KEY');
    if (geminiKey) {
      try {
        const genAi = new GoogleGenerativeAI(geminiKey);
        this.geminiModel = genAi.getGenerativeModel({
          model: 'gemini-2.0-flash',
          generationConfig: {
            temperature: 0.1,
            responseMimeType: 'application/json',
          },
        });
        this.logger.log('Gemini AI initialized');
      } catch (err) {
        this.logger.warn(`Gemini init failed: ${(err as Error).message}`);
      }
    }

    const openaiKey = this.config.get<string>('OPENAI_API_KEY');
    if (openaiKey) {
      try {
        this.openai = new OpenAI({ apiKey: openaiKey, timeout: AI_TIMEOUT, maxRetries: 0 });
        this.logger.log('OpenAI initialized');
      } catch (err) {
        this.logger.warn(`OpenAI init failed: ${(err as Error).message}`);
      }
    }

    if (!geminiKey && !openaiKey) {
      this.logger.warn(
        'No AI keys configured (GEMINI_API_KEY / OPENAI_API_KEY) — chatbot falls back to keyword matching',
      );
    }
  }

  /** Returns null if all AI providers fail (fallback to keywords) */
  async classify(text: string): Promise<AiClassification | null> {
    /* ── try Gemini first ── */
    if (this.geminiModel && this.geminiAvailable) {
      const result = await this.tryGemini(text);
      if (result) return result;
    }

    /* ── fallback to OpenAI ── */
    if (this.openai && this.openaiAvailable) {
      const result = await this.tryOpenAI(text);
      if (result) return result;
    }

    return null;
  }

  /* ── Gemini provider ── */

  private buildPrompt(text: string): string {
    return `Eres un clasificador de intenciones para un e-commerce de productos naturales y salud (L-Health).

Clasifica el mensaje del usuario en UNA de estas intenciones:
- "search": el usuario busca productos específicos (ej: "moringa", "crema dental", "qué venden para la digestión"). Extrae 1-3 términos de búsqueda relevantes.
- "greeting": saludo inicial (ej: "hola", "buenos días").
- "shipping": preguntas sobre envíos, domicilios, entregas.
- "payment": preguntas sobre pagos, transferencias, métodos de pago.
- "contact": quiere contactar por WhatsApp o hablar con un asesor.
- "returns": devoluciones, garantías, cambios, reclamos.
- "general": cualquier otra cosa no contemplada.

Responde SOLO con un JSON válido con los campos "intent" y "terms".
Para intents que no son "search", terms debe ser un array vacío.

Ejemplos:
Mensaje: "hola buenos días"
{"intent": "greeting", "terms": []}

Mensaje: "cuánto cuesta la moringa en cápsulas"
{"intent": "search", "terms": ["moringa", "cápsulas"]}

Mensaje: "hay crema dental natural?"
{"intent": "search", "terms": ["crema dental"]}

Mensaje: "cómo hago para pagar con nequi"
{"intent": "payment", "terms": []}

Mensaje: "${text}"`;
  }

  private async tryGemini(text: string): Promise<AiClassification | null> {
    try {
      const result = await withTimeout(
        this.geminiModel!.generateContent(this.buildPrompt(text)),
        AI_TIMEOUT,
        'Gemini',
      );
      const raw = result.response.text();
      const parsed: AiClassification = JSON.parse(raw);

      if (!parsed.intent || !Array.isArray(parsed.terms)) {
        throw new Error('Invalid response format');
      }

      this.logger.debug(`Gemini: "${parsed.intent}" [${parsed.terms.join(', ')}]`);
      return parsed;
    } catch (err) {
      this.logger.warn(`Gemini failed: ${(err as Error).message}`);
      this.geminiAvailable = false;
      return null;
    }
  }

  /* ── OpenAI provider ── */

  private async tryOpenAI(text: string): Promise<AiClassification | null> {
    try {
      const completion = await withTimeout(
        this.openai!.chat.completions.create({
          model: 'gpt-4o-mini',
          temperature: 0.1,
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'system',
              content:
                'Eres un clasificador de intenciones. Responde SOLO con JSON: {"intent": "...", "terms": [...]}. Intents: search, greeting, shipping, payment, contact, returns, general. Para "search", extrae 1-3 términos de búsqueda. Para otros intents, terms vacío.',
            },
            {
              role: 'user',
              content: text,
            },
          ],
        }),
        AI_TIMEOUT,
        'OpenAI',
      );

      const raw = completion.choices[0]?.message?.content;
      if (!raw) throw new Error('Empty response');

      const parsed: AiClassification = JSON.parse(raw);

      if (!parsed.intent || !Array.isArray(parsed.terms)) {
        throw new Error('Invalid response format');
      }

      this.logger.debug(`OpenAI: "${parsed.intent}" [${parsed.terms.join(', ')}]`);
      return parsed;
    } catch (err) {
      this.logger.warn(`OpenAI failed: ${(err as Error).message}`);
      this.openaiAvailable = false;
      return null;
    }
  }
}
