import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { ArticlesModule } from './articles/articles.module';
import { UsersModule } from './users/users.module';
import { CategoriesModule } from './categories/categories.module';
import { CommentsModule } from './comments/comments.module';
import { SignupModule } from './auth/signup/signup.module';
import { LoginModule } from './auth/login/login.module';
import { RefreshModule } from './auth/refresh/refresh.module';
import { LogoutModule } from './auth/logout/logout.module';
import { TokensModule } from './auth/tokens/tokens.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RbacGuard } from './auth/rbac.guard';
import { AUTH_THROTTLE_LIMIT, AUTH_THROTTLE_TTL_MS } from './auth/auth.constants';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: AUTH_THROTTLE_TTL_MS,
        limit: AUTH_THROTTLE_LIMIT,
      },
    ]),
    ArticlesModule,
    UsersModule,
    CategoriesModule,
    CommentsModule,
    SignupModule,
    LoginModule,
    RefreshModule,
    LogoutModule,
    TokensModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RbacGuard,
    },
  ],
})
export class AppModule {}
