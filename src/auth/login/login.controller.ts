import { Controller, Post, Body } from '@nestjs/common';
import { LoginService } from './login.service';
import { LoginDto } from './dto/login.dto';
import { Public } from '../public.decorator';

@Public()
@Controller('auth/login')
export class LoginController {
  constructor(private readonly loginService: LoginService) {}

  @Post()
  login(@Body() loginDto: LoginDto) {
    return this.loginService.login(loginDto);
  }
}
