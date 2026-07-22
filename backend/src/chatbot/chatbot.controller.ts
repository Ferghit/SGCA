import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ChatbotService } from './chatbot.service';
import { ChatDto } from './dto/chat.dto';

@UseGuards(JwtAuthGuard)
@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Post('chat')
  chat(@Body() dto: ChatDto, @Request() req: any) {
    return this.chatbotService.chat(dto, req.user);
  }
}
