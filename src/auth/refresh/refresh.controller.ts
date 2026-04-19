import { Body, Controller, Post } from '@nestjs/common';
import { RefreshService } from './refresh.service';
import { RefreshDto } from './dto/refresh.dto';

@Controller('auth/refresh')
export class RefreshController {
  constructor(private readonly refreshService: RefreshService) {}

  @Post()
  refresh(@Body() refreshDto: RefreshDto) {
    return this.refreshService.refresh(refreshDto);
  }
}
