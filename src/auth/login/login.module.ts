import { Module } from '@nestjs/common';
import { LoginService } from './login.service';
import { LoginController } from './login.controller';
import { UsersModule } from 'src/users/users.module';
import { TokensModule } from 'src/auth/tokens/tokens.module';

@Module({
  imports: [UsersModule, TokensModule],
  controllers: [LoginController],
  providers: [LoginService],
})
export class LoginModule {}
