import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ArticlesModule } from './articles/articles.module';
import { UsersModule } from './users/users.module';
import { CategoriesModule } from './categories/categories.module';
import { CommentsModule } from './comments/comments.module';
import { SignupModule } from './auth/signup/signup.module';

@Module({
  imports: [
    ArticlesModule,
    UsersModule,
    CategoriesModule,
    CommentsModule,
    SignupModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
