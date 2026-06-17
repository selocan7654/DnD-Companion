# DnD Companion Platform — Backend Spec

> **Doküman amacı:** NestJS backend'in klasör yapısını, modül mimarisini, middleware pipeline'ını, guard/policy katmanını, exception handling'i, validation stratejisini, WebSocket gateway'ini, email/upload servislerini ve environment variable'ları tanımlar. Kodlama agent'ı bu dokümanı okuyarak backend kodunu eksiksiz üretir.

---

## 1. Klasör Yapısı

```
apps/api/
├── src/
│   ├── main.ts                         # Bootstrap, global pipes/filters/prefix
│   ├── app.module.ts                   # Root module
│   │
│   ├── auth/                           # Kimlik doğrulama modülü
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── strategies/
│   │   │   └── jwt.strategy.ts         # Passport JWT strategy
│   │   ├── dto/
│   │   │   ├── register.dto.ts
│   │   │   ├── login.dto.ts
│   │   │   ├── refresh.dto.ts
│   │   │   ├── verify-email.dto.ts
│   │   │   ├── password-reset-request.dto.ts
│   │   │   └── password-reset-confirm.dto.ts
│   │   └── tokens/
│   │       └── token.service.ts        # JWT üretimi, refresh token yönetimi
│   │
│   ├── users/                          # Kullanıcı modülü
│   │   ├── users.module.ts
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   └── dto/
│   │       └── update-profile.dto.ts
│   │
│   ├── campaigns/                      # Kampanya modülü
│   │   ├── campaigns.module.ts
│   │   ├── campaigns.controller.ts
│   │   ├── campaigns.service.ts
│   │   ├── members/
│   │   │   ├── members.controller.ts
│   │   │   └── members.service.ts
│   │   ├── invite/
│   │   │   ├── invite.controller.ts
│   │   │   └── invite.service.ts
│   │   ├── dm-notes/
│   │   │   ├── dm-notes.controller.ts
│   │   │   └── dm-notes.service.ts
│   │   └── dto/
│   │       ├── create-campaign.dto.ts
│   │       ├── update-campaign.dto.ts
│   │       ├── create-dm-note.dto.ts
│   │       └── reorder-notes.dto.ts
│   │
│   ├── characters/                     # Karakter modülü
│   │   ├── characters.module.ts
│   │   ├── characters.controller.ts
│   │   ├── characters.service.ts
│   │   └── dto/
│   │       ├── create-character.dto.ts
│   │       ├── update-character.dto.ts
│   │       ├── update-live-fields.dto.ts
│   │       ├── assign-campaign.dto.ts
│   │       └── update-visibility.dto.ts
│   │
│   ├── homebrew/                       # Homebrew modülü
│   │   ├── homebrew.module.ts
│   │   ├── homebrew.controller.ts
│   │   ├── homebrew.service.ts
│   │   └── dto/
│   │       ├── create-homebrew.dto.ts
│   │       └── update-homebrew.dto.ts
│   │
│   ├── collections/                    # Koleksiyon modülü
│   │   ├── collections.module.ts
│   │   ├── collections.controller.ts
│   │   └── collections.service.ts
│   │
│   ├── reference/                      # Resmi 5e referans verisi (read-only)
│   │   ├── reference.module.ts
│   │   ├── reference.controller.ts
│   │   └── reference.service.ts
│   │
│   ├── admin/                          # Admin modülü
│   │   ├── admin.module.ts
│   │   ├── admin-users.controller.ts
│   │   ├── admin-content.controller.ts
│   │   ├── admin.service.ts
│   │   └── dto/
│   │       └── change-role.dto.ts
│   │
│   ├── uploads/                        # Dosya yükleme modülü
│   │   ├── uploads.module.ts
│   │   ├── uploads.controller.ts
│   │   ├── uploads.service.ts
│   │   └── dto/
│   │       └── presign-request.dto.ts
│   │
│   ├── websocket/                      # WebSocket gateway
│   │   ├── websocket.module.ts
│   │   ├── websocket.gateway.ts
│   │   └── websocket.guard.ts
│   │
│   ├── email/                          # Email servisi
│   │   ├── email.module.ts
│   │   └── email.service.ts
│   │
│   ├── common/                         # Paylaşılan altyapı kodu
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts
│   │   │   ├── roles.guard.ts
│   │   │   └── email-verified.guard.ts
│   │   ├── decorators/
│   │   │   ├── public.decorator.ts
│   │   │   ├── roles.decorator.ts
│   │   │   ├── require-verified-email.decorator.ts
│   │   │   └── current-user.decorator.ts
│   │   ├── policies/
│   │   │   ├── campaign.policy.ts
│   │   │   ├── character.policy.ts
│   │   │   ├── homebrew.policy.ts
│   │   │   └── policy.types.ts
│   │   ├── filters/
│   │   │   └── global-exception.filter.ts
│   │   ├── interceptors/
│   │   │   └── logging.interceptor.ts
│   │   ├── pipes/
│   │   │   └── parse-uuid.pipe.ts
│   │   └── prisma/
│   │       ├── prisma.module.ts
│   │       └── prisma.service.ts
│   │
│   └── config/
│       └── env.validation.ts           # Env var validasyonu (Zod/Joi)
│
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── seed-data/
│       ├── spells.json
│       ├── monsters.json
│       ├── feats.json
│       ├── backgrounds.json
│       ├── magic-items.json
│       └── subclasses.json
│
├── test/                               # Integration testler
│   ├── auth.e2e-spec.ts
│   ├── campaigns.e2e-spec.ts
│   ├── characters.e2e-spec.ts
│   ├── homebrew.e2e-spec.ts
│   └── admin.e2e-spec.ts
│
├── Dockerfile
├── .env.example
└── nest-cli.json
```

---

## 2. NestJS Modül Mimarisi

### Pattern

Her kaynak tipi kendi NestJS modülünde yaşar. Modül içi yapı:

- **Controller:** HTTP endpoint'lerini tanımlar, DTO validasyonu yapar, service'e delege eder. İş mantığı controller'da bulunmaz.
- **Service:** İş mantığını barındırır, Prisma Client ile veritabanı işlemlerini yürütür, policy kontrollerini çağırır.
- **DTO:** Request body validasyonu için `class-validator` decorator'lı sınıflar.

Ayrı repository katmanı kullanılmaz — Prisma Client doğrudan service'lere inject edilir. Gerekçe: Prisma zaten bir abstraction katmanıdır, ek repository karmaşıklık ekler.

### PrismaService

```typescript
// common/prisma/prisma.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

`PrismaModule` global olarak tanımlanır (`@Global()`), tüm modüller `PrismaService`'i inject edebilir.

### Root Module

```typescript
// app.module.ts
@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UsersModule,
    CampaignsModule,
    CharactersModule,
    HomebrewModule,
    CollectionsModule,
    ReferenceModule,
    AdminModule,
    UploadsModule,
    WebsocketModule,
    EmailModule,
  ],
})
export class AppModule {}
```

---

## 3. Middleware Pipeline (Request Lifecycle)

Her HTTP isteği şu sırayla işlenir:

```
Request
  → Global Prefix (/api/v1)
  → LoggingInterceptor (request başlangıç logu)
  → JwtAuthGuard (@Public değilse token doğrulama)
  → EmailVerifiedGuard (@RequireVerifiedEmail varsa email kontrolü)
  → RolesGuard (@Roles varsa rol kontrolü)
  → ValidationPipe (DTO validasyonu)
  → Controller method
  → Service (iş mantığı + policy kontrolleri)
  → Response
  → LoggingInterceptor (response bitiş logu)
  → GlobalExceptionFilter (hata varsa)
```

### Bootstrap (`main.ts`)

```typescript
async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,           // DTO'da olmayan alanları sil
    forbidNonWhitelisted: true, // DTO'da olmayan alan varsa hata fırlat
    transform: true,           // Plain object → DTO class instance
  }));

  // Global exception filter
  app.useGlobalFilters(new GlobalExceptionFilter());

  // CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL,
    credentials: true, // refresh cookie için
  });

  // Cookie parser (refresh token cookie'si için)
  app.use(cookieParser());

  // Helmet (HTTP güvenlik başlıkları)
  app.use(helmet({
    contentSecurityPolicy: false, // CSP ayrıca yapılandırılır
    crossOriginEmbedderPolicy: false,
  }));

  // Static file serving (frontend build)
  app.useStaticAssets(join(__dirname, '..', '..', 'web', 'dist'), {
    prefix: '/',
  });

  await app.listen(process.env.PORT || 3000);
}
```

---

## 4. Authentication Guard

### JwtAuthGuard

Tüm endpoint'ler varsayılan olarak authentication gerektirir. Public endpoint'ler `@Public()` decorator ile işaretlenir.

```typescript
// common/guards/jwt-auth.guard.ts
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;
    return super.canActivate(context);
  }
}
```

`JwtAuthGuard` global olarak `APP_GUARD` ile kaydedilir:

```typescript
// app.module.ts
providers: [
  { provide: APP_GUARD, useClass: JwtAuthGuard },
  { provide: APP_GUARD, useClass: EmailVerifiedGuard },
  { provide: APP_GUARD, useClass: RolesGuard },
],
```

### JWT Strategy

```typescript
// auth/strategies/jwt.strategy.ts
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET,
      ignoreExpiration: false,
    });
  }

  async validate(payload: { sub: string; role: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        isActive: true,
        emailVerifiedAt: true,
      },
    });

    if (!user || !user.isActive) throw new UnauthorizedException();

    return user; // req.user'a atanır
  }
}
```

JWT payload: `{ sub: userId, role: 'USER' | 'ADMIN', iat, exp }`. Access token ömrü 15 dakika, HS256.

### Decorators

```typescript
// @Public() — auth gerektirmeyen endpoint'ler
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

// @Roles('ADMIN') — rol kısıtlama
export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

// @RequireVerifiedEmail() — email doğrulama zorunlu
export const REQUIRE_VERIFIED_KEY = 'requireVerified';
export const RequireVerifiedEmail = () => SetMetadata(REQUIRE_VERIFIED_KEY, true);

// @CurrentUser() — controller method parametresinde req.user
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    return ctx.switchToHttp().getRequest().user;
  },
);
```

### EmailVerifiedGuard

`@RequireVerifiedEmail()` decorator'ı olan endpoint'lerde `email_verified_at != NULL` kontrolü yapar. Doğrulanmamış kullanıcıya `403` döner.

```typescript
@Injectable()
export class EmailVerifiedGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requireVerified = this.reflector.getAllAndOverride<boolean>(
      REQUIRE_VERIFIED_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requireVerified) return true;

    const user = context.switchToHttp().getRequest().user;
    if (!user) return true; // Public endpoint, JwtAuthGuard zaten geçirmiş

    if (!user.emailVerifiedAt) {
      throw new ForbiddenException('Email verification required');
    }
    return true;
  }
}
```

### Kullanım Örneği

```typescript
@Controller('campaigns')
export class CampaignsController {
  @Post()
  @RequireVerifiedEmail()
  create(@CurrentUser() user, @Body() dto: CreateCampaignDto) {
    return this.campaignsService.create(user.id, dto);
  }

  @Get(':id')
  // Auth gerekli (global guard), ama email doğrulama gerektirmez
  findOne(@CurrentUser() user, @Param('id', ParseUUIDPipe) id: string) {
    return this.campaignsService.findOne(id, user);
  }
}

@Controller('reference')
export class ReferenceController {
  @Get('spells')
  @Public() // Auth gerektirmez
  findAllSpells(@Query() query: ListQueryDto) {
    return this.referenceService.findSpells(query);
  }
}
```

---

## 5. Authorization / Policy Katmanı

### Genel Yaklaşım

Yetki kontrolleri service katmanında policy fonksiyonları çağrılarak yapılır. Her kaynak tipi (campaign, character, homebrew) kendi policy dosyasına sahiptir.

Policy fonksiyonları, DB'den kaynak bilgisini alır ve kullanıcının yetkili olup olmadığını belirler. Yetkisiz ise exception fırlatır.

### Policy Fonksiyonu Pattern

```typescript
// common/policies/campaign.policy.ts
export class CampaignPolicy {
  // Kampanyayı sadece DM ve üyeler görüntüleyebilir
  static canRead(user: AuthUser, campaign: Campaign & { members: CampaignMember[] }): boolean {
    if (user.role === 'ADMIN') return true;
    if (campaign.ownerId === user.id) return true;
    return campaign.members.some(m => m.userId === user.id);
  }

  // Kampanyayı sadece DM güncelleyebilir/silebilir
  static canWrite(user: AuthUser, campaign: Campaign): boolean {
    if (user.role === 'ADMIN') return true;
    return campaign.ownerId === user.id;
  }
}
```

```typescript
// common/policies/character.policy.ts
export class CharacterPolicy {
  static canRead(user: AuthUser | null, character: CharacterWithRelations): boolean {
    // Public karakter → herkes
    if (character.visibility === 'PUBLIC') return true;
    // Giriş yapmamış → sadece public
    if (!user) return false;
    // Admin → her zaman
    if (user.role === 'ADMIN') return true;
    // Sahibi → her zaman
    if (character.ownerId === user.id) return true;
    // Kampanyaya atanmış → kampanya üyeleri
    if (character.campaignId && character.campaign) {
      if (character.campaign.ownerId === user.id) return true;
      return character.campaign.members.some(m => m.userId === user.id);
    }
    return false;
  }

  static canWrite(user: AuthUser, character: CharacterWithRelations): boolean {
    if (user.role === 'ADMIN') return true;
    if (character.ownerId === user.id) return true;
    // Kampanya DM'i
    if (character.campaignId && character.campaign) {
      return character.campaign.ownerId === user.id;
    }
    return false;
  }
}
```

### Service'de Kullanım

```typescript
// campaigns/campaigns.service.ts
async findOne(campaignId: string, user: AuthUser) {
  const campaign = await this.prisma.campaign.findUnique({
    where: { id: campaignId },
    include: { members: true },
  });

  if (!campaign || !CampaignPolicy.canRead(user, campaign)) {
    throw new NotFoundException(); // 404 — kaynağın varlığını gizle
  }

  return campaign;
}

async update(campaignId: string, user: AuthUser, dto: UpdateCampaignDto) {
  const campaign = await this.prisma.campaign.findUnique({
    where: { id: campaignId },
  });

  if (!campaign) throw new NotFoundException();

  if (!CampaignPolicy.canWrite(user, campaign)) {
    throw new ForbiddenException(); // 403 — kendi kaynağında yetki hatası
  }

  return this.prisma.campaign.update({
    where: { id: campaignId },
    data: dto,
  });
}
```

### Yetki Çözümleme

Her okuma/yazma isteğinde, kaynağın sahiplik ve ilişki bilgisi DB'den indeksli sorgu ile alınır. Cache kullanılmaz — kurallar basit ve index lookup düzeyindedir. Cache invalidation riski (üyelikten çıkarılan kullanıcının stale cache ile erişime devam etmesi) bu ölçekte kabul edilen DB yükünden daha maliyetlidir.

### Deaktive Kullanıcı Kontrolü

`is_active = false` olan kullanıcıların içerikleri diğer kullanıcılardan gizlenir. Bu kontrol, liste sorgularında Prisma `where` koşulu olarak eklenir:

```typescript
// Kampanya listelerken, sahibi deaktive olan kampanyaları gizle
where: {
  owner: { isActive: true }, // deaktive kullanıcının kampanyaları gizli
  // ... diğer koşullar
}
```

ADMIN sorguları bu koşulu atlar.

---

## 6. Exception Handling

### Global Exception Filter

```typescript
// common/filters/global-exception.filter.ts
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    let statusCode = 500;
    let error = 'Internal Server Error';
    let message = 'An unexpected error occurred';
    let details = null;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exResponse = exception.getResponse();

      if (typeof exResponse === 'object' && exResponse !== null) {
        error = (exResponse as any).error || HttpStatus[statusCode];
        message = (exResponse as any).message || message;
        details = (exResponse as any).details || null;
      } else {
        message = String(exResponse);
      }
    }

    // Validation hatalarını details'a dönüştür
    if (statusCode === 400 && Array.isArray(message)) {
      details = message.map(msg => ({ field: null, issue: msg }));
      message = 'Validation failed';
    }

    // 500 hatalarını logla (Sentry + structured log)
    if (statusCode >= 500) {
      // logger.error(...)
    }

    response.status(statusCode).json({
      statusCode,
      error,
      message,
      ...(details && { details }),
    });
  }
}
```

### Custom Business Exceptions

```typescript
// common/exceptions
export class LastAdminException extends UnprocessableEntityException {
  constructor() {
    super('Cannot remove the last admin from the system');
  }
}

export class AlreadyMemberException extends ConflictException {
  constructor() {
    super('User is already a member of this campaign');
  }
}

export class InvalidInviteTokenException extends NotFoundException {
  constructor() {
    super('Invalid or disabled invite link');
  }
}

export class EmailNotVerifiedException extends ForbiddenException {
  constructor() {
    super('Email verification required for this action');
  }
}
```

---

## 7. Validation

### DTO Pattern

Her endpoint'in request body'si bir DTO sınıfı ile validate edilir. `class-validator` decorator'ları kullanılır.

```typescript
// campaigns/dto/create-campaign.dto.ts
import { IsString, IsOptional, MaxLength, MinLength } from 'class-validator';

export class CreateCampaignDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  setting?: string;
}
```

### Homebrew Data Validation (Zod)

Homebrew'lerin `data` JSONB alanı tipe göre farklı şema gerektirir. `class-validator` iç içe JSONB yapıları için yetersizdir; bu alanlar service katmanında Zod ile validate edilir.

```typescript
// homebrew/homebrew.service.ts
import { spellDataSchema, monsterDataSchema, featDataSchema } from '@dnd-companion/shared';

async create(userId: string, dto: CreateHomebrewDto) {
  // Tipe göre data validasyonu
  const schema = this.getDataSchema(dto.type);
  const parsed = schema.safeParse(dto.data);
  if (!parsed.success) {
    throw new BadRequestException({
      message: 'Invalid data for this homebrew type',
      details: parsed.error.issues.map(i => ({
        field: `data.${i.path.join('.')}`,
        issue: i.message,
      })),
    });
  }

  return this.prisma.homebrewItem.create({
    data: {
      ...dto,
      source: 'HOMEBREW',
      ownerId: userId,
      status: 'DRAFT',
      data: parsed.data,
    },
  });
}

private getDataSchema(type: HomebrewType) {
  const schemas = {
    SPELL: spellDataSchema,
    MONSTER: monsterDataSchema,
    FEAT: featDataSchema,
    BACKGROUND: backgroundDataSchema,
    MAGIC_ITEM: magicItemDataSchema,
    SUBCLASS: subclassDataSchema,
  };
  return schemas[type];
}
```

Zod şemaları `packages/shared/schemas/homebrew/` altında tanımlanır — frontend ve backend aynı şemayı kullanır.

### Query Parametreleri

Liste endpoint'lerinin query parametreleri ortak bir DTO ile validate edilir:

```typescript
// common/dto/list-query.dto.ts
export class ListQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsUUID()
  cursor?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  @Transform(({ value }) => parseInt(value))
  limit?: number = 20;

  @IsOptional()
  @IsString()
  sort?: string;

  @IsOptional()
  @IsIn(['asc', 'desc'])
  order?: 'asc' | 'desc' = 'desc';
}
```

---

## 8. Logging

### Yapılandırma

Structured JSON logging, stdout'a yazılır. NestJS built-in Logger veya Pino kullanılır.

```typescript
// main.ts (Pino kullanımı)
import { Logger } from 'nestjs-pino';

const app = await NestFactory.create(AppModule, { bufferLogs: true });
app.useLogger(app.get(Logger));
```

### Log Formatı

```json
{
  "level": "info",
  "time": "2026-06-14T10:00:00.000Z",
  "requestId": "uuid",
  "method": "POST",
  "url": "/api/v1/campaigns",
  "statusCode": 201,
  "duration": 45,
  "userId": "uuid"
}
```

### Hassas Veri Kuralları

Aşağıdaki alanlar hiçbir zaman loglanmaz:
- `password`, `password_hash`, `newPassword`
- `accessToken`, `refreshToken`, `token_hash`
- `email` (sadece hata debug'ı için, production'da maskelenir)

Pino `redact` özelliği ile otomatik maskeleme yapılır:

```typescript
PinoModule.forRoot({
  pinoHttp: {
    redact: ['req.headers.authorization', 'req.body.password', 'req.body.newPassword'],
  },
});
```

### Logging Interceptor

Her isteğin başlangıç ve bitiş logunu oluşturur:

```typescript
// common/interceptors/logging.interceptor.ts
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const requestId = uuidv4();
    req.requestId = requestId;
    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - start;
        // log: { requestId, method, url, statusCode, duration, userId }
      }),
    );
  }
}
```

---

## 9. WebSocket Gateway

### Gateway Tanımı

```typescript
// websocket/websocket.gateway.ts
@WebSocketGateway({
  cors: { origin: process.env.FRONTEND_URL, credentials: true },
})
export class WebsocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token;
      if (!token) throw new Error('No token');

      const payload = this.jwtService.verify(token);
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, username: true, isActive: true },
      });

      if (!user || !user.isActive) throw new Error('Invalid user');

      client.data.userId = user.id;
      client.data.username = user.username;
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    // Cleanup: client otomatik olarak tüm room'lardan ayrılır
  }

  @SubscribeMessage('join-campaign')
  async handleJoinCampaign(client: Socket, payload: { campaignId: string }) {
    const userId = client.data.userId;
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: payload.campaignId },
      include: { members: { select: { userId: true } } },
    });

    if (!campaign) {
      client.emit('error', { event: 'join-campaign', message: 'Campaign not found', code: 'NOT_FOUND' });
      return;
    }

    const isMember = campaign.ownerId === userId ||
                     campaign.members.some(m => m.userId === userId);

    if (!isMember) {
      client.emit('error', { event: 'join-campaign', message: 'Not a member', code: 'FORBIDDEN' });
      return;
    }

    client.join(`campaign:${payload.campaignId}`);
    client.emit('joined-campaign', { campaignId: payload.campaignId });
  }

  @SubscribeMessage('leave-campaign')
  handleLeaveCampaign(client: Socket, payload: { campaignId: string }) {
    client.leave(`campaign:${payload.campaignId}`);
  }

  // Service'ler tarafından çağrılır (DI ile inject)
  broadcastLiveUpdate(campaignId: string, data: LiveUpdatePayload) {
    this.server.to(`campaign:${campaignId}`).emit('character:live-update', data);
  }

  broadcastMemberJoined(campaignId: string, data: MemberPayload) {
    this.server.to(`campaign:${campaignId}`).emit('campaign:member-joined', data);
  }

  broadcastMemberLeft(campaignId: string, data: MemberPayload) {
    this.server.to(`campaign:${campaignId}`).emit('campaign:member-left', data);
  }
}
```

### Redis Adapter (Horizontal Scaling)

Birden fazla backend instance'ı arasında WebSocket event yayını için Socket.io Redis adapter kullanılır:

```typescript
// websocket/websocket.module.ts
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

// Gateway'de afterInit:
async afterInit(server: Server) {
  const pubClient = createClient({ url: process.env.REDIS_URL });
  const subClient = pubClient.duplicate();
  await Promise.all([pubClient.connect(), subClient.connect()]);
  server.adapter(createAdapter(pubClient, subClient));
}
```

---

## 10. Email Service

### Gmail SMTP Yapılandırması

```typescript
// email/email.service.ts
@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS, // Gmail App Password
      },
    });
  }

  async sendVerificationEmail(to: string, token: string) {
    const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
    await this.transporter.sendMail({
      from: `"DnD Companion" <${process.env.SMTP_USER}>`,
      to,
      subject: 'Verify your email - DnD Companion',
      html: `<p>Click <a href="${verifyUrl}">here</a> to verify your email.</p>`,
    });
  }

  async sendPasswordResetEmail(to: string, token: string) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    await this.transporter.sendMail({
      from: `"DnD Companion" <${process.env.SMTP_USER}>`,
      to,
      subject: 'Reset your password - DnD Companion',
      html: `<p>Click <a href="${resetUrl}">here</a> to reset your password. This link expires in 1 hour.</p>`,
    });
  }
}
```

Email gönderim hatası kullanıcı akışını engellemez — hata loglanır, kullanıcıya kayıt/reset başarılı mesajı yine döner.

---

## 11. Upload Service

### S3-Uyumlu Presigned URL Üretimi

```typescript
// uploads/uploads.service.ts
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class UploadsService {
  private s3: S3Client;

  constructor() {
    this.s3 = new S3Client({
      region: process.env.S3_REGION,
      endpoint: process.env.S3_ENDPOINT, // Cloudflare R2 uyumluluğu için
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY,
        secretAccessKey: process.env.S3_SECRET_KEY,
      },
    });
  }

  async generatePresignedUrl(dto: PresignRequestDto, userId: string) {
    // MIME validation
    const allowedTypes = ['image/png', 'image/jpeg', 'image/webp'];
    if (!allowedTypes.includes(dto.contentType)) {
      throw new BadRequestException('Only PNG, JPEG, and WebP images are allowed');
    }

    const key = `${dto.purpose}/${userId}/${uuidv4()}-${dto.fileName}`;

    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: key,
      ContentType: dto.contentType,
      ContentLength: 5 * 1024 * 1024, // max 5 MB
    });

    const uploadUrl = await getSignedUrl(this.s3, command, { expiresIn: 600 });
    const publicUrl = `${process.env.S3_PUBLIC_URL}/${key}`;

    return { uploadUrl, publicUrl, expiresIn: 600 };
  }
}
```

---

## 12. Scheduled Jobs

### Refresh Token Temizliği

Süresi dolmuş veya iptal edilmiş refresh token'lar günde bir kez temizlenir:

```typescript
// auth/tokens/token-cleanup.service.ts
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class TokenCleanupService {
  constructor(private prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async cleanupExpiredTokens() {
    const result = await this.prisma.refreshToken.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { isRevoked: true },
        ],
      },
    });
    // log: { message: 'Cleaned up refresh tokens', count: result.count }
  }
}
```

NestJS `@nestjs/schedule` paketi kullanılır; `ScheduleModule.forRoot()` AppModule'a import edilir.

---

## 13. Environment Variables

Tüm environment variable'lar `.env` dosyasında tutulur, repo'ya commit edilmez. `.env.example` şablon olarak sağlanır.

| Değişken | Açıklama | Örnek |
|---|---|---|
| `NODE_ENV` | Ortam | `development`, `staging`, `production` |
| `PORT` | API port | `3000` |
| `DATABASE_URL` | PostgreSQL bağlantı | `postgresql://user:pass@localhost:5432/dnd_companion` |
| `REDIS_URL` | Redis bağlantı | `redis://localhost:6379` |
| `JWT_SECRET` | JWT imzalama anahtarı | `random-256-bit-secret` |
| `JWT_ACCESS_EXPIRY` | Access token ömrü | `15m` |
| `JWT_REFRESH_EXPIRY` | Refresh token ömrü | `30d` |
| `FRONTEND_URL` | Frontend origin (CORS + email linkleri) | `http://localhost:5173` |
| `SMTP_USER` | Gmail SMTP kullanıcı | `yourapp@gmail.com` |
| `SMTP_PASS` | Gmail App Password | `xxxx xxxx xxxx xxxx` |
| `S3_REGION` | Object storage bölge | `auto` |
| `S3_ENDPOINT` | S3/R2 endpoint | `https://xxx.r2.cloudflarestorage.com` |
| `S3_ACCESS_KEY` | S3 erişim anahtarı | |
| `S3_SECRET_KEY` | S3 gizli anahtar | |
| `S3_BUCKET` | Bucket adı | `dnd-companion-uploads` |
| `S3_PUBLIC_URL` | CDN public URL | `https://cdn.dnd-companion.com` |
| `SENTRY_DSN` | Sentry hata izleme | `https://xxx@sentry.io/xxx` |
| `SEED_ADMIN_EMAIL` | İlk admin email (seed) | `admin@dnd-companion.com` |
| `SEED_ADMIN_PASSWORD` | İlk admin şifre (seed) | |

### Env Validation

Uygulama başlatılırken env variable'lar validate edilir. Eksik veya geçersiz değer → uygulama başlamaz:

```typescript
// config/env.validation.ts
import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production']),
  PORT: z.string().transform(Number).default('3000'),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('30d'),
  FRONTEND_URL: z.string().url(),
  SMTP_USER: z.string().email(),
  SMTP_PASS: z.string().min(1),
  S3_REGION: z.string().default('auto'),
  S3_ENDPOINT: z.string().url(),
  S3_ACCESS_KEY: z.string().min(1),
  S3_SECRET_KEY: z.string().min(1),
  S3_BUCKET: z.string().min(1),
  S3_PUBLIC_URL: z.string().url(),
  SENTRY_DSN: z.string().optional(),
  SEED_ADMIN_EMAIL: z.string().email().optional(),
  SEED_ADMIN_PASSWORD: z.string().min(8).optional(),
});
```
