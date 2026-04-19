import { Allow } from 'class-validator';

export class LogoutDto {
  @Allow()
  refreshToken: string;
}
