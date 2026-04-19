import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ArticlesModule } from './articles/articles.module';
import { UsersModule } from './users/users.module';
import { CategoriesModule } from './categories/categories.module';
import { CommentsModule } from './comments/comments.module';
import { SignupModule } from './auth/signup/signup.module';
import { LoginModule } from './auth/login/login.module';

@Module({
  imports: [
    ArticlesModule,
    UsersModule,
    CategoriesModule,
    CommentsModule,
    SignupModule,
    LoginModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
