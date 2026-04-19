import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { SignupService } from './signup.service';
import { SignupDto } from './dto/signup.dto';
import { Public } from '../public.decorator';
import { AUTH_THROTTLE_OPTIONS } from '../auth.constants';

@Public()
@UseGuards(ThrottlerGuard)
@Controller('auth/signup')
export class SignupController {
  constructor(private readonly signupService: SignupService) {}

  @Post()
  @Throttle(AUTH_THROTTLE_OPTIONS)
  create(@Body() signupDto: SignupDto) {
    return this.signupService.signup(signupDto);
  }
}
