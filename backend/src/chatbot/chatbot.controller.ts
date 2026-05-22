import { Controller, Post, Body } from '@nestjs/common';
import { ChatbotService, ChatbotResponse } from './chatbot.service';
import { ChatMessageDto } from './dto/chat-message.dto';

@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Post('message')
  async processMessage(@Body() dto: ChatMessageDto): Promise<ChatbotResponse> {
    return this.chatbotService.processMessage(dto.text);
  }
}
