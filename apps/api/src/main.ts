import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') ?? ['http://localhost:3000'],
    credentials: true,
  });

  app.setGlobalPrefix('api');

  const port = Number(process.env.PORT ?? 3001);
  if (!Number.isFinite(port) || port <= 0) {
    throw new Error(
      `Invalid PORT "${process.env.PORT ?? ''}". Remove any manual PORT variable in Railway — the platform sets it automatically.`,
    );
  }

  await app.listen(port, '0.0.0.0');
  Logger.log(`Listening on 0.0.0.0:${port}`, 'Bootstrap');
}

bootstrap().catch((err: unknown) => {
  Logger.error('Failed to start API', err instanceof Error ? err.stack : err);
  process.exit(1);
});
