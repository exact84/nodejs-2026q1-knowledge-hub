import { Controller, Post, Body } from '@nestjs/common';
import { SignupService } from './signup.service';
import { SignupDto } from './dto/signup.dto';
import { Public } from '../public.decorator';

@Public()
@Controller('auth/signup')
export class SignupController {
  constructor(private readonly signupService: SignupService) {}

  @Post()
  create(@Body() signupDto: SignupDto) {
    return this.signupService.signup(signupDto);
  }
}
