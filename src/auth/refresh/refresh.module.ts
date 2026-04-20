import { Module } from '@nestjs/common';
import { RefreshService } from './refresh.service';
import { RefreshController } from './refresh.controller';
import { UsersModule } from 'src/users/users.module';
import { TokensModule } from 'src/auth/tokens/tokens.module';

@Module({
  imports: [UsersModule, TokensModule],
  controllers: [RefreshController],
  providers: [RefreshService],
})
export class RefreshModule {}
