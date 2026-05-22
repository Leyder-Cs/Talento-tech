import api from './axios.config';

export interface BotProduct {
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
  products?: BotProduct[];
}

export const chatbotService = {
  sendMessage: (text: string) =>
    api.post<ChatbotResponse>('/chatbot/message', { text }).then((r) => r.data),
};
