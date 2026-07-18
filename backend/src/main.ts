import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  // All HTTP routes live under /api (matches the frontend's VITE_API_BASE_URL).
  app.setGlobalPrefix('api');

  // Validate + strip unknown properties on every request body.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );

  const origins = config.get<string>('CORS_ORIGINS');
  app.enableCors({
    origin: origins ? origins.split(',').map((o) => o.trim()) : true,
    credentials: true,
  });

  const port = config.get<number>('PORT') ?? 3000;
  await app.listen(port);
  Logger.log(`Smart Queue API ready on http://localhost:${port}/api`, 'Bootstrap');
}

bootstrap();
