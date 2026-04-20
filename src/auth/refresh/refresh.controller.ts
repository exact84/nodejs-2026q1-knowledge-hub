import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { RefreshService } from './refresh.service';
import { RefreshDto } from './dto/refresh.dto';
import { Public } from '../public.decorator';

@Public()
@Controller('auth/refresh')
export class RefreshController {
  constructor(private readonly refreshService: RefreshService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  refresh(@Body() refreshDto: RefreshDto) {
    return this.refreshService.refresh(refreshDto);
  }
}
