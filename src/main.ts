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
  const logger = app.get(AppLogger);

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
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      'access-token',
    )
    .addSecurityRequirements('access-token')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('doc', app, document);

  await app.listen(PORT);

  let isShuttingDown = false;

  const gracefulShutdown = async (
    signal: string,
    options?: {
      level?: 'error' | 'warn' | 'log' | 'debug' | 'verbose';
      error?: unknown;
      exitCode?: number;
    },
  ) => {
    if (isShuttingDown) {
      return;
    }

    isShuttingDown = true;

    logger.log(`Received ${signal}. Starting graceful shutdown...`);

    const timeout = setTimeout(() => {
      logger.error('Shutdown timeout exceeded. Forcing exit.');
      process.exit(1);
    }, 5000);

    timeout.unref();

    try {
      const level = options?.level;
      const originalError = options?.error;
      const exitCode = options?.exitCode ?? 0;

      if (originalError instanceof Error) {
        const trace = originalError.stack;
        if (level === 'error') {
          logger.error(
            `${signal}: ${originalError.message}`,
            trace,
            'Bootstrap',
          );
        }
      } else if (originalError !== undefined) {
        const normalized = String(originalError);
        if (level === 'error') {
          logger.error(`${signal}: ${normalized}`, undefined, 'Bootstrap');
        }
      }

      await app.close();

      await flushWriteQueue();

      clearTimeout(timeout);

      logger.log('Log queue flushed. Shutdown complete.');
      process.exit(exitCode);
    } catch (err) {
      logger.error(
        'Graceful shutdown failed',
        err instanceof Error ? err.stack : undefined,
        'Bootstrap',
      );
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on(
    'uncaughtException',
    (error) =>
      void gracefulShutdown('FATAL uncaughtException', {
        level: 'error',
        error,
        exitCode: 1,
      }),
  );
  process.on(
    'unhandledRejection',
    (reason) =>
      void gracefulShutdown('unhandledRejection', {
        level: 'error',
        error: reason,
        exitCode: 1,
      }),
  );
}

bootstrap();
