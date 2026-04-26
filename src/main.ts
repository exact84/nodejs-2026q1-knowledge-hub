import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import 'dotenv/config';
import { PublicUserInterceptor } from './common/interceptors/public-user.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { AppLogger } from './logger/logger.service';
import { HttpLoggingInterceptor } from './common/interceptors/http-logging.interceptor';
import { flushWriteQueue } from './logger/file-rotator.util';

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
  app.useGlobalInterceptors(
    app.get(HttpLoggingInterceptor),
    new PublicUserInterceptor(),
  );
  app.useGlobalFilters(app.get(HttpExceptionFilter));

  const config = new DocumentBuilder()
    .setTitle('Knowledge Hub API')
    .setDescription('REST API for users, articles, categories and comments')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('doc', app, document);

  const server = await app.listen(PORT);

  const gracefulShutdown = async (signal: string) => {
    const logger = app.get(AppLogger);

    logger.log(`Received ${signal}. Starting graceful shutdown...`);

    const timeout = setTimeout(() => {
      logger.error('Shutdown timeout exceeded. Forcing exit.');
      process.exit(1);
    }, 5000);

    timeout.unref();

    try {
      await new Promise<void>((resolve, reject) => {
        server.close((err?: Error) => {
          if (err) return reject(err);
          resolve();
        });
      });

      await flushWriteQueue();

      clearTimeout(timeout);

      logger.log('Log queue flushed. Shutdown complete.');
      process.exit(0);
    } catch (err) {
      logger.error('Graceful shutdown failed');
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

bootstrap();
