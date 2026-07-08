import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { LoggerModule } from 'nestjs-pino';

import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';
import { CampaignsModule } from './campaigns/campaigns.module';
import { CharactersModule } from './characters/characters.module';
import { HomebrewModule } from './homebrew/homebrew.module';
import { CollectionsModule } from './collections/collections.module';
import { ReferenceModule } from './reference/reference.module';
import { WebsocketModule } from './websocket/websocket.module';
import { EmailVerifiedGuard } from './common/guards/email-verified.guard';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import {
  AUTH_THROTTLE_LIMIT,
  AUTH_THROTTLE_TTL_MS,
} from './common/throttle/auth-throttle.constants';
import { PrismaModule } from './common/prisma/prisma.module';
import { validateEnv, EnvConfig } from './config/env.validation';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
      validate: validateEnv,
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService<EnvConfig, true>) => ({
        throttlers: [
          {
            name: 'auth',
            ttl: AUTH_THROTTLE_TTL_MS,
            limit: AUTH_THROTTLE_LIMIT,
          },
        ],
        storage: new ThrottlerStorageRedisService(configService.get('REDIS_URL', { infer: true })),
      }),
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        redact: [
          'req.headers.authorization',
          'req.body.password',
          'req.body.newPassword',
          'req.body.currentPassword',
        ],
        autoLogging: false,
      },
    }),
    PrismaModule,
    HealthModule,
    AuthModule,
    CampaignsModule,
    CharactersModule,
    HomebrewModule,
    CollectionsModule,
    ReferenceModule,
    WebsocketModule,
    AdminModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: EmailVerifiedGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
