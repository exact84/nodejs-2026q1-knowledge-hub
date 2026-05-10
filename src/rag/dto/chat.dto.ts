import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class RagChatRequest {
  @ApiProperty({
    example: 'How does Docker help backend developers?',
  })
  @IsString()
  question: string;

  @ApiProperty({
    required: false,
    example: 'conversation-123',
  })
  @IsOptional()
  @IsString()
  conversationId?: string;
}

export class RagChatResponse {
  answer: string;

  sources: Array<{
    articleId: string;
    articleTitle: string;
    relevantChunk: string;
  }>;

  conversationId: string;
}
