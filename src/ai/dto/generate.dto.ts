import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class GenerateRequest {
  @ApiProperty({ example: 'Say Hello!' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(10_000)
  prompt: string;

  @ApiProperty({ example: 'session-123' })
  @IsString()
  @IsOptional()
  @MaxLength(128)
  sessionId?: string;
}

export class GenerateResponse {
  result: string;
}
