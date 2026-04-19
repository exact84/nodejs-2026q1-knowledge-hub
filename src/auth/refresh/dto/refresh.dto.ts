import { Allow } from 'class-validator';

export class RefreshDto {
  @Allow()
  refreshToken: string;
}
