import { Module } from '@nestjs/common';
import { ChatbotController } from './chatbot.controller';
import { ChatbotService } from './chatbot.service';
import { ChatbotAiService } from './chatbot-ai.service';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [ChatbotController],
  providers: [ChatbotService, ChatbotAiService, PrismaService],
})
export class ChatbotModule {}
