import { existsSync } from 'fs';
import { join } from 'path';

import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Logger } from 'nestjs-pino';
import cookieParser from 'cookie-parser';
import type { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';

import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { initSentry } from './common/sentry/init-sentry';

initSentry();

function resolveStaticRoot(): string | null {
  const candidates = [join(__dirname, '..', 'public'), join(__dirname, '..', '..', 'web', 'dist')];

  for (const candidate of candidates) {
    if (existsSync(join(candidate, 'index.html'))) {
      return candidate;
    }
  }

  return null;
}

function configureSpaFallback(app: NestExpressApplication, staticRoot: string): void {
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      next();
      return;
    }

    const path = req.path;
    if (path.startsWith('/api/') || path.startsWith('/socket.io')) {
      next();
      return;
    }

    if (/\.\w+$/.test(path)) {
      next();
      return;
    }

    res.sendFile(join(staticRoot, 'index.html'), (err) => {
      if (err) {
        next(err);
      }
    });
  });
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));

  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new GlobalExceptionFilter());

  app.enableCors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  });

  app.use(cookieParser());
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    }),
  );

  const staticRoot = resolveStaticRoot();
  if (staticRoot) {
    app.useStaticAssets(staticRoot, { index: false });
    configureSpaFallback(app, staticRoot);
  }

  const port = process.env.API_PORT ? Number(process.env.API_PORT) : 3000;
  await app.listen(port);
}

void bootstrap();
