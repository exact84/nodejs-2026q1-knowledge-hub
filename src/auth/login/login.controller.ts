import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { LoginService } from './login.service';
import { LoginDto } from './dto/login.dto';
import { Public } from '../public.decorator';
import { AUTH_THROTTLE_OPTIONS } from '../auth.constants';

@Public()
@UseGuards(ThrottlerGuard)
@Controller('auth/login')
export class LoginController {
  constructor(private readonly loginService: LoginService) {}

  @Post()
  @Throttle(AUTH_THROTTLE_OPTIONS)
  login(@Body() loginDto: LoginDto) {
    return this.loginService.login(loginDto);
  }
}
