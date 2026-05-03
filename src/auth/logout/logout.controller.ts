import { Body, Controller, Post } from '@nestjs/common';
import { LogoutService } from './logout.service';
import { LogoutDto } from './dto/logout.dto';

@Controller('auth/logout')
export class LogoutController {
  constructor(private readonly logoutService: LogoutService) {}

  @Post()
  logout(@Body() logoutDto: LogoutDto) {
    return this.logoutService.logout(logoutDto);
  }
}
