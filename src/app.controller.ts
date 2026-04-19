import { Controller, Get, Redirect } from '@nestjs/common';
import { Public } from './auth/public.decorator';

@Controller()
export class AppController {
  @Public()
  @Get()
  @Redirect('/doc', 302)
  redirect(): void {}
}
