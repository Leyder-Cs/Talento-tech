import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { chatbotService, type BotProduct } from '../../services/chatbot.service';

interface Message {
  type: 'user' | 'bot';
  text: string;
  products?: BotProduct[];
}

const quickSuggestions = [
  { label: 'Productos', text: '¿Qué productos tienen?' },
  { label: 'Envíos', text: 'Cómo son los envíos' },
  { label: 'Pagos', text: 'Formas de pago' },
  { label: 'Disponibilidad', text: 'Hay stock de moringa' },
];

export function Chatbot() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      type: 'bot',
      text: '¡Hola! 👋 Soy el asistente virtual de L-Health. ¿En qué puedo ayudarte? Puedes preguntarme sobre productos, precios, stock, envíos o pagos.',
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = { type: 'user', text: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await chatbotService.sendMessage(text.trim());

      const botMsg: Message = {
        type: 'bot',
        text: response.text,
        products: response.type === 'products' ? response.products : undefined,
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          type: 'bot',
          text: '😕 Disculpa, tuve un problema al procesar tu mensaje. ¿Puedes intentarlo de nuevo?',
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuickSuggestion = (text: string) => {
    handleSend(text);
  };

  const handleProductClick = (slug: string) => {
    setIsOpen(false);
    navigate(`/catalog/${slug}`);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gray-800 rounded-full shadow-lg hover:bg-gray-700 transition-all duration-300 flex items-center justify-center text-white hover:scale-110"
      >
        {isOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        )}
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 bg-gray-900 rounded-2xl shadow-2xl border border-gray-800 overflow-hidden animate-slideUp">
          <div className="bg-gray-800 p-4">
            <h3 className="text-white font-semibold">Asistente L-Health</h3>
            <p className="text-gray-400 text-xs">¡Pregúntame lo que necesites!</p>
          </div>

          <div className="h-80 overflow-y-auto p-4 space-y-3 bg-gray-900">
            {messages.map((msg, i) => (
              <div key={i}>
                <div
                  className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-line ${
                      msg.type === 'user'
                        ? 'bg-accent text-white rounded-br-md'
                        : 'bg-gray-800 text-gray-200 shadow-sm rounded-bl-md'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>

                {/* Product cards inline */}
                {msg.products && msg.products.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {msg.products.map((product) => (
                      <button
                        key={product.id}
                        onClick={() => handleProductClick(product.slug)}
                        className="w-full flex items-center gap-3 bg-gray-800/70 rounded-xl p-2.5 border border-gray-700 hover:border-accent/50 hover:bg-gray-800 transition-all text-left"
                      >
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-12 h-12 rounded-lg object-cover flex-shrink-0 bg-gray-700"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" fill="%23374151" rx="6"/><text x="24" y="28" text-anchor="middle" fill="%239CA3AF" font-size="14">📦</text></svg>';
                          }}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-200 truncate">
                            {product.name}
                          </p>
                          <p className="text-xs text-accent font-semibold">
                            ${product.price.toLocaleString('es-CO')}
                          </p>
                          <p
                            className={`text-xs ${
                              product.stock > 0 ? 'text-green-400' : 'text-red-400'
                            }`}
                          >
                            {product.stock > 0
                              ? `${product.stock} en stock`
                              : 'Agotado'}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-800 rounded-2xl px-4 py-2.5 shadow-sm">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {messages.length === 1 && (
            <div className="px-4 py-2 flex gap-2 flex-wrap bg-gray-800/50 border-t border-gray-700">
              {quickSuggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleQuickSuggestion(s.text)}
                  className="px-3 py-1 text-xs font-medium bg-gray-800 border border-gray-700 rounded-full hover:bg-gray-700 hover:border-accent text-gray-300 transition-colors"
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}

          <div className="p-3 border-t border-gray-700 bg-gray-900">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend(input)}
                placeholder="Escribe tu pregunta..."
                className="flex-1 px-4 py-2 text-sm bg-gray-800 border border-gray-700 text-gray-200 placeholder-gray-500 rounded-full focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              />
              <button
                onClick={() => handleSend(input)}
                disabled={!input.trim() || isTyping}
                className="w-9 h-9 bg-accent text-white rounded-full flex items-center justify-center hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19V5m0 0l-7 7m7-7l7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
