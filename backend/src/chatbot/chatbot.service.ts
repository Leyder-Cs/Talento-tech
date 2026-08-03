import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { ChatbotAiService } from './chatbot-ai.service';

export interface ProductHit {
  id: string;
  name: string;
  slug: string;
  price: number;
  stock: number;
  imageUrl: string;
}

export interface ChatbotResponse {
  text: string;
  type: 'text' | 'products';
  products?: ProductHit[];
}

@Injectable()
export class ChatbotService {
  private readonly logger = new Logger(ChatbotService.name);

  constructor(
    private prisma: PrismaService,
    private aiService: ChatbotAiService,
  ) {}

  async processMessage(text: string): Promise<ChatbotResponse> {
    const lower = text.toLowerCase().trim();

    /* ── try AI classification first ── */
    const ai = await this.aiService.classify(text);

    if (ai) {
      this.logger.debug(`AI classified: "${ai.intent}"`);

      switch (ai.intent) {
        case 'search': {
          const terms =
            ai.terms.length > 0
              ? ai.terms
              : this.extractSearchTerms(lower);
          if (terms.length > 0) {
            return this.searchProducts(terms, text);
          }
          // If AI says search but no terms, show general help
          return {
            type: 'text',
            text: '🤔 Puedes preguntarme por productos específicos como moringa, café, aceites, cremas, o suplementos. ¿Qué te gustaría conocer?',
          };
        }

        case 'greeting':
          return {
            type: 'text',
            text: '¡Hola! 👋 Soy el asistente virtual de YARAK. ¿En qué puedo ayudarte? Puedes preguntarme sobre productos, precios, stock, envíos, pagos o contacto.',
          };

        case 'shipping':
          return {
            type: 'text',
            text: '📦 Realizamos envíos a todo el país. El tiempo de entrega es de 2 a 5 días hábiles. Para confirmar disponibilidad en tu ciudad, escríbenos por WhatsApp.',
          };

        case 'payment':
          return {
            type: 'text',
            text: '💰 Aceptamos pagos por transferencia bancaria, Nequi, Daviplata y efectivo contra entrega (según ciudad). Los precios los puedes ver en cada producto.',
          };

        case 'contact':
          return {
            type: 'text',
            text: '📱 Puedes contactarnos directamente por WhatsApp. El botón está disponible en cada producto. ¡Respondemos rápido!',
          };

        case 'returns':
          return {
            type: 'text',
            text: '🔄 Contamos con garantía de satisfacción. Si tienes algún problema con tu pedido, escríbenos por WhatsApp dentro de los 5 días siguientes a la entrega.',
          };

        case 'general':
          // Fall through to keyword matching
          break;
      }
    }

    /* ── fallback: keyword matching (AI disabled or returned general/null) ── */
    const intents = this.detectIntent(lower);

    if (intents.product_search || intents.stock_check || intents.price_inquiry) {
      const terms = this.extractSearchTerms(lower);
      if (terms.length > 0) {
        return this.searchProducts(terms, text);
      }
    }

    if (intents.category_browse) {
      const categoryTerm = this.extractCategoryTerm(lower);
      if (categoryTerm) {
        return this.searchByCategory(categoryTerm);
      }
    }

    if (intents.greeting) {
      return {
        type: 'text',
        text: '¡Hola! 👋 Soy el asistente virtual de YARAK. ¿En qué puedo ayudarte? Puedes preguntarme sobre productos, precios, stock, envíos, pagos o contacto.',
      };
    }

    if (intents.shipping) {
      return { type: 'text', text: '📦 Realizamos envíos a todo el país. El tiempo de entrega es de 2 a 5 días hábiles. Para confirmar disponibilidad en tu ciudad, escríbenos por WhatsApp.' };
    }

    if (intents.payment) {
      return { type: 'text', text: '💰 Aceptamos pagos por transferencia bancaria, Nequi, Daviplata y efectivo contra entrega (según ciudad). Los precios los puedes ver en cada producto.' };
    }

    if (intents.contact) {
      return { type: 'text', text: '📱 Puedes contactarnos directamente por WhatsApp. El botón está disponible en cada producto. ¡Respondemos rápido!' };
    }

    if (intents.returns) {
      return { type: 'text', text: '🔄 Contamos con garantía de satisfacción. Si tienes algún problema con tu pedido, escríbenos por WhatsApp dentro de los 5 días siguientes a la entrega.' };
    }

    const fallbackTerms = this.extractSearchTerms(lower);
    if (fallbackTerms.length > 0) {
      return this.searchProducts(fallbackTerms, text);
    }

    return {
      type: 'text',
      text: '🤔 No estoy seguro de poder ayudarte con eso. ¿Puedo orientarte sobre envíos, pagos, productos o cómo hacer un pedido? También puedes contactarnos directamente por WhatsApp.',
    };
  }

  /* ── intent detection ── */

  private detectIntent(lower: string) {
    return {
      greeting: /\b(hola|buenos?\s*(días|dias|tardes)|buenas?|saludos?|hey|qué\s*tal|que\s*tal)/i.test(lower),
      product_search:
        /\b(busco|quiero|necesito|venden|tienen|hay\s*producto|recomiendas|sugieres|muestra|productos?)/i.test(lower) ||
        this.hasProductKeyword(lower),
      stock_check: /\b(stock|disponible|disponibilidad|agotado|hay\s*unidad|inventario)/i.test(lower),
      price_inquiry: /\b(precio|cuanto\s*cuesta|cuánto\s*cuesta|costó|costó|costo|vale|cuesta|precios?)/i.test(lower),
      category_browse:
        /\b(categoría|categoria|categorías|categorias|suplementos|naturales|tipo\s*de\s*producto|línea|linea)/i.test(
          lower,
        ),
      shipping: /\b(envío|envio|entrega|domicilio|despacho|envían|envian|llevan|pedido\s*llega)/i.test(lower),
      payment: /\b(pago|pagar|transferencia|nequi|daviplata|efectivo|contra\s*entrega|formas?\s*de\s*pago)/i.test(lower),
      contact: /\b(contacto|whatsapp|teléfono|telefono|llamar|asesor|ayuda|comunicar)/i.test(lower),
      returns: /\b(devolución|devolucion|garantía|garantia|cambio|reembolso|reclamo|queja)/i.test(lower),
    };
  }

  /* ── keyword-based product detection (no actual product names) ── */

  private hasProductKeyword(lower: string): boolean {
    const productKeywords = [
      'moringa',
      'café',
      'cafe',
      'proteína',
      'proteina',
      'té',
      'te',
      'aceite',
      'crema',
      'ungüento',
      'unguento',
      'jabón',
      'jabon',
      'champú',
      'shampoo',
      'suplemento',
      'colágeno',
      'colageno',
      'vitamina',
      'vitaminas',
      'infusión',
      'infusion',
      'aromática',
      'aromatica',
      'capsula',
      'cápsula',
      'capsulas',
    ];
    return productKeywords.some((k) => lower.includes(k));
  }

  /* ── extract meaningful search terms ── */

  private extractSearchTerms(lower: string): string[] {
    const stopWords = new Set([
      'hola',
      'buenos',
      'días',
      'dias',
      'tardes',
      'buenas',
      'por',
      'favor',
      'gracias',
      'quiero',
      'necesito',
      'busco',
      'venden',
      'tienen',
      'hay',
      'me',
      'puedes',
      'ayudar',
      'saber',
      'consultar',
      'precio',
      'cuanto',
      'cuesta',
      'vale',
      'costó',
      'costo',
      'stock',
      'disponible',
      'agotado',
      'sobre',
      'algún',
      'algun',
      'un',
      'una',
      'el',
      'la',
      'los',
      'las',
      'lo',
      'de',
      'del',
      'para',
      'con',
      'sin',
      'es',
      'son',
      'tiene',
      'tipo',
      'alguna',
    ]);

    const words = lower
      .replace(/[¿?¡!,.]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !stopWords.has(w));

    // Deduplicate while preserving order
    return [...new Set(words)];
  }

  /* ── database queries ── */

  private async searchProducts(
    terms: string[],
    originalText: string,
  ): Promise<ChatbotResponse> {
    if (terms.length === 0) {
      return {
        type: 'text',
        text: '🤔 Puedes preguntarme por productos específicos como moringa, café, aceites, cremas, o suplementos. ¿Qué te gustaría conocer?',
      };
    }

    /* ── build per-term field matchers ── */
    const insensitive = { mode: 'insensitive' as const };
    const nameContains = (t: string) => ({ name: { contains: t, ...insensitive } });
    const shortDescContains = (t: string) => ({ shortDescription: { contains: t, ...insensitive } });
    const anyFieldContains = (t: string) => ({
      OR: [
        { name: { contains: t, ...insensitive } },
        { shortDescription: { contains: t, ...insensitive } },
        { description: { contains: t, ...insensitive } },
        { benefits: { contains: t, ...insensitive } },
        { ingredients: { contains: t, ...insensitive } },
      ],
    });

    /* ── TIER 0: ALL terms in name (AND) ── */
    if (terms.length >= 2) {
      const andNameProducts = await this.prisma.product.findMany({
        where: {
          active: true,
          AND: terms.map((t) => nameContains(t)),
        },
        include: {
          images: { where: { isPrimary: true }, take: 1 },
          category: true,
        },
        take: 5,
      });
      if (andNameProducts.length > 0) {
        return this.buildProductResponse(andNameProducts, originalText.trim(), true);
      }
    }

    /* ── TIER 1: ALL terms in name OR shortDescription (AND) ── */
    if (terms.length >= 2) {
      const andNameShortProducts = await this.prisma.product.findMany({
        where: {
          active: true,
          AND: terms.map((t) => ({
            OR: [nameContains(t), shortDescContains(t)],
          })),
        },
        include: {
          images: { where: { isPrimary: true }, take: 1 },
          category: true,
        },
        take: 5,
      });
      if (andNameShortProducts.length > 0) {
        return this.buildProductResponse(andNameShortProducts, originalText.trim(), true);
      }
    }

    /* ── TIER 2: EACH term in name (OR, deduplicated) ── */
    const orNameProducts = await this.prisma.product.findMany({
      where: {
        active: true,
        OR: terms.map((t) => nameContains(t)),
      },
      include: {
        images: { where: { isPrimary: true }, take: 1 },
        category: true,
      },
      take: 8,
    });

    if (orNameProducts.length > 0) {
      return this.buildProductResponse(orNameProducts, originalText.trim(), false);
    }

    /* ── TIER 3: EACH term anywhere (OR, deduplicated) ── */
    const orAnyProducts = await this.prisma.product.findMany({
      where: {
        active: true,
        OR: terms.map((t) => anyFieldContains(t)),
      },
      include: {
        images: { where: { isPrimary: true }, take: 1 },
        category: true,
      },
      take: 5,
    });

    if (orAnyProducts.length > 0) {
      return this.buildProductResponse(orAnyProducts, 'lo que buscas', false);
    }

    /* ── TIER 4: nada — mostrar destacados como sugerencia ── */
    const featured = await this.prisma.product.findMany({
      where: { active: true, featured: true },
      include: {
        images: { where: { isPrimary: true }, take: 1 },
        category: true,
      },
      take: 4,
    });

    if (featured.length > 0) {
      return this.buildProductResponse(
        featured,
        'No encontré resultados exactos, pero estos productos pueden interesarte',
        false,
      );
    }

    /* ── TIER 5: realmente no hay nada ── */
    return {
      type: 'text',
      text: '😕 No encontré productos relacionados. Tenemos moringa, café, aceites naturales, cremas y suplementos. ¿Quieres probar con otro nombre?',
    };
  }

  private async searchByCategory(categoryTerm: string): Promise<ChatbotResponse> {
    const categories = await this.prisma.category.findMany({
      where: {
        OR: [
          { name: { contains: categoryTerm, mode: 'insensitive' } },
          { slug: { contains: categoryTerm, mode: 'insensitive' } },
        ],
      },
      take: 1,
    });

    const category = categories[0];
    if (!category) {
      return {
        type: 'text',
        text: 'No encontré esa categoría. Nuestras categorías principales son: suplementos, aceites naturales, cuidado personal y tés. ¿Quieres explorar alguna?',
      };
    }

    const products = await this.prisma.product.findMany({
      where: { active: true, categoryId: category.id },
      include: {
        images: { where: { isPrimary: true }, take: 1 },
        category: true,
      },
      take: 5,
    });

    if (products.length === 0) {
      return {
        type: 'text',
        text: `La categoría "${category.name}" no tiene productos activos por el momento. ¿Quieres ver otras opciones?`,
      };
    }

    return this.buildProductResponse(products, `categoría ${category.name}`, true);
  }

  private buildProductResponse(products: any[], context: string, exact: boolean): ChatbotResponse {
    // Deduplicate by id
    const seen = new Set<string>();
    const hits: ProductHit[] = [];
    for (const p of products) {
      if (seen.has(p.id)) continue;
      seen.add(p.id);
      const primaryImage = p.images?.[0];
      hits.push({
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: p.price,
        stock: p.stock,
        imageUrl: primaryImage
          ? `/api/uploads/product-image/${primaryImage.id}`
          : '/placeholder.png',
      });
      if (hits.length >= 5) break;
    }

    const count = hits.length;
    const intro = exact
      ? `Encontré ${count} ${count === 1 ? 'producto' : 'productos'} relacionado${count === 1 ? '' : 's'} con "${context}":`
      : `${context}:`;

    const suggestions = hits
      .slice(0, 4)
      .map((p) => `${p.name} — $${p.price.toLocaleString('es-CO')}`)
      .join('\n');

    return {
      type: 'products',
      text: `${intro}\n\n${suggestions}\n\nHaz clic en cualquier producto para ver más detalles.`,
      products: hits,
    };
  }

  private extractCategoryTerm(lower: string): string | null {
    // Direct category name mentions
    const directMatches = ['suplementos', 'aceites', 'cremas', 'ungüentos', 'tés', 'tes', 'jabones', 'cápsulas', 'capsulas', 'vitaminas'];
    for (const m of directMatches) {
      if (lower.includes(m)) return m;
    }

    // Generic "categoría de X" patterns
    const match = lower.match(/categorí[as]\s*(?:de\s*)?(\w+)/i);
    if (match) return match[1];

    return null;
  }
}
