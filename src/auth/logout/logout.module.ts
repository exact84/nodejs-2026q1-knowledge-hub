import { Module } from '@nestjs/common';
import { LogoutService } from './logout.service';
import { LogoutController } from './logout.controller';
import { UsersModule } from 'src/users/users.module';
import { TokensModule } from 'src/auth/tokens/tokens.module';

@Module({
  imports: [UsersModule, TokensModule],
  controllers: [LogoutController],
  providers: [LogoutService],
})
export class LogoutModule {}
