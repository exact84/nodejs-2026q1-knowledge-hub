import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import 'dotenv/config';
import { PublicUserInterceptor } from './common/interceptors/public-user.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { AppLogger } from './logger/logger.service';

async function bootstrap(): Promise<void> {
  const PORT = process.env.PORT || 4000;
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(AppLogger));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalInterceptors(new PublicUserInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());

  const config = new DocumentBuilder()
    .setTitle('Knowledge Hub API')
    .setDescription('REST API for users, articles, categories and comments')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('doc', app, document);

  await app.listen(PORT);
}

bootstrap();
