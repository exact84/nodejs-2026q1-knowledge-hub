import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class GenerateRequest {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(10_000)
  prompt: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  sessionId: string;
}

export class GenerateResponse {
  result: string;
}
