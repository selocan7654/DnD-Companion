# DnD Companion Platform — Testing Strategy

> **Doküman amacı:** Test piramidini, framework seçimlerini, yetkilendirme test matrisini, test data factory'lerini, CI gate kurallarını ve coverage hedeflerini tanımlar. Kodlama agent'ı bu dokümanı okuyarak her endpoint ve bileşen için hangi testlerin yazılması gerektiğini, testlerin nasıl yapılandırılacağını ve PR merge koşullarını bilir.

---

## 1. Test Felsefesi ve Piramit

Proje ücretsiz bir hobi/topluluk projesidir. Test stratejisi **pragmatik ve odaklı** tutulur — her satıra test yazmak yerine, hata maliyeti yüksek olan katmanlara yoğunlaşılır.

**Öncelik sırası:**

1. **Backend integration testleri** — En yüksek öncelik. Yetkilendirme kuralları, auth akışları ve veri bütünlüğü. Gerçek veritabanına karşı çalışır.
2. **Backend unit testleri** — Policy fonksiyonları, utility'ler, service iş mantığı. Mock ile izole çalışır.
3. **Frontend component testleri** — Kritik UI bileşenleri (form validation, auth guard davranışı, koşullu render).
4. **E2E testler** — MVP'de **yoktur**. Playwright/Cypress gibi browser-based test paketi ileride eklenebilir.

Bu sıralama bilinçlidir: yetkilendirme hatası (yetkisiz kullanıcının başka birinin campaign'ini silmesi) bir UI render hatasından çok daha maliyetlidir.

---

## 2. Test Framework ve Araçlar

### 2.1 Backend (NestJS)

| Araç | Kullanım |
|---|---|
| **Jest** | Test runner ve assertion kütüphanesi (NestJS varsayılanı) |
| `@nestjs/testing` | NestJS modül/servis test utility'leri |
| `supertest` | HTTP endpoint integration testleri |
| Prisma Client | Integration testlerde gerçek DB'ye bağlanır |
| `argon2` | Test user'ları için şifre hash üretimi |

**Jest yapılandırması (`apps/api/jest.config.ts`):**

```typescript
export default {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: { '^.+\\.(t|j)s$': 'ts-jest' },
  collectCoverageFrom: ['**/*.(t|j)s', '!**/*.module.ts', '!main.ts'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  setupFilesAfterSetup: ['./test/setup.ts'],
};
```

Integration testler ve unit testler aynı `*.spec.ts` uzantısını kullanır. Dosya konumuna göre ayrışır: `src/campaigns/campaigns.service.spec.ts` (unit), `src/campaigns/campaigns.controller.spec.ts` (integration — supertest ile HTTP isteği yapar).

### 2.2 Frontend (React + Vite)

| Araç | Kullanım |
|---|---|
| **Vitest** | Test runner (Vite ile native uyumlu, Jest API uyumlu) |
| `@testing-library/react` | Component render ve DOM sorgulama |
| `@testing-library/user-event` | Kullanıcı etkileşimi simülasyonu |
| `@testing-library/jest-dom` | DOM assertion matcher'ları |
| `msw` (Mock Service Worker) | API mock'lama (RTK Query testleri için) |

**Vitest yapılandırması (`apps/web/vitest.config.ts`):**

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    css: false,
  },
});
```

---

## 3. Backend Unit Testleri

### 3.1 Kapsam

Unit testler service katmanı iş mantığını ve policy fonksiyonlarını kapsar. Veritabanı erişimi mock'lanır.

**Test edilecek katmanlar:**

- **Policy fonksiyonları** (`common/policies/`) — `CampaignPolicy.canRead()`, `CharacterPolicy.canUpdate()` vb. Her policy fonksiyonu için tüm koşul dalları test edilir.
- **Service iş mantığı** — Homebrew publish/unpublish geçişleri, invite token üretimi, refresh token rotation mantığı, son admin koruması.
- **Utility fonksiyonları** — Pagination helper, slug üretimi, dosya boyut/MIME validasyonu.

### 3.2 Mock Stratejisi

Prisma Client mock'lanır — gerçek DB'ye bağlanılmaz:

```typescript
// test/prisma-mock.ts
import { PrismaClient } from '@prisma/client';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';

export type MockPrismaClient = DeepMockProxy<PrismaClient>;

export const createMockPrisma = (): MockPrismaClient => mockDeep<PrismaClient>();
```

External servisler (email, S3) her zaman mock'lanır — unit testler dış servise bağımlı olmaz:

```typescript
// campaigns/campaigns.service.spec.ts
describe('CampaignsService', () => {
  let service: CampaignsService;
  let prisma: MockPrismaClient;

  beforeEach(async () => {
    prisma = createMockPrisma();
    const module = await Test.createTestingModule({
      providers: [
        CampaignsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get(CampaignsService);
  });

  describe('regenerateInviteToken', () => {
    it('should generate a new token and invalidate the old one', async () => {
      const campaign = createTestCampaignData({ ownerId: 'user-1' });
      prisma.campaign.findUnique.mockResolvedValue(campaign);
      prisma.campaign.update.mockResolvedValue({ ...campaign, inviteToken: 'new-token' });

      const result = await service.regenerateInviteToken('campaign-1', 'user-1');

      expect(result.inviteToken).not.toBe(campaign.inviteToken);
      expect(prisma.campaign.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'campaign-1' },
          data: expect.objectContaining({ inviteToken: expect.any(String) }),
        }),
      );
    });
  });
});
```

### 3.3 Policy Test Örnekleri

```typescript
// common/policies/campaign.policy.spec.ts
describe('CampaignPolicy', () => {
  const admin = { id: 'admin-1', role: Role.ADMIN } as AuthUser;
  const owner = { id: 'owner-1', role: Role.USER } as AuthUser;
  const member = { id: 'member-1', role: Role.USER } as AuthUser;
  const outsider = { id: 'outsider-1', role: Role.USER } as AuthUser;
  const campaign = { ownerId: 'owner-1' } as Campaign;
  const memberIds = ['owner-1', 'member-1'];

  describe('canRead', () => {
    it('ADMIN can read any campaign', () => {
      expect(CampaignPolicy.canRead(admin, campaign, [])).toBe(true);
    });
    it('owner (DM) can read own campaign', () => {
      expect(CampaignPolicy.canRead(owner, campaign, memberIds)).toBe(true);
    });
    it('member can read campaign', () => {
      expect(CampaignPolicy.canRead(member, campaign, memberIds)).toBe(true);
    });
    it('outsider cannot read campaign', () => {
      expect(CampaignPolicy.canRead(outsider, campaign, memberIds)).toBe(false);
    });
  });

  describe('canUpdate', () => {
    it('only owner can update', () => {
      expect(CampaignPolicy.canUpdate(owner, campaign)).toBe(true);
      expect(CampaignPolicy.canUpdate(member, campaign)).toBe(false);
    });
    it('ADMIN can update any campaign', () => {
      expect(CampaignPolicy.canUpdate(admin, campaign)).toBe(true);
    });
  });
});
```

---

## 4. Backend Integration Testleri

### 4.1 Kapsam

Integration testler HTTP endpoint'lerini uçtan uca test eder: HTTP isteği → controller → service → gerçek veritabanı → HTTP yanıtı. `supertest` ile NestJS uygulamasına gerçek HTTP istekleri gönderilir.

### 4.2 Test Veritabanı Kurulumu

Integration testler **gerçek PostgreSQL** veritabanına karşı çalışır. Docker Compose ile ayrı bir test DB instance'ı ayağa kaldırılır:

```yaml
# docker-compose.test.yml
services:
  test-db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: dnd_companion_test
      POSTGRES_USER: test
      POSTGRES_PASSWORD: test
    ports:
      - "5433:5432"
    tmpfs: /var/lib/postgresql/data  # RAM'de çalışır, hızlı
```

**Test lifecycle:**

```typescript
// test/setup.ts
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const prisma = new PrismaClient({
  datasourceUrl: process.env.TEST_DATABASE_URL,
});

beforeAll(async () => {
  // Migration'ları test DB'ye uygula
  execSync('npx prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: process.env.TEST_DATABASE_URL },
  });
});

afterEach(async () => {
  // Her test sonrası tüm tabloları temizle (sıralama FK'lara göre)
  await prisma.$transaction([
    prisma.auditLog.deleteMany(),
    prisma.collectionItem.deleteMany(),
    prisma.campaignMember.deleteMany(),
    prisma.character.deleteMany(),
    prisma.homebrewItem.deleteMany(),
    prisma.dmNote.deleteMany(),
    prisma.refreshToken.deleteMany(),
    prisma.campaign.deleteMany(),
    prisma.user.deleteMany(),
  ]);
});

afterAll(async () => {
  await prisma.$disconnect();
});
```

Her test kendi verisini factory'ler ile oluşturur (Bölüm 7), test sonrası temizlenir. Testler birbirinden izoledir.

### 4.3 Auth Helper

Integration testlerde authenticated istek göndermek için yardımcı fonksiyon:

```typescript
// test/auth-helper.ts
export async function loginAsUser(
  app: INestApplication,
  email: string,
  password: string,
): Promise<{ accessToken: string; refreshCookie: string }> {
  const response = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email, password });

  return {
    accessToken: response.body.accessToken,
    refreshCookie: response.headers['set-cookie']?.[0] ?? '',
  };
}

export function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}
```

### 4.4 Integration Test Örneği

```typescript
// campaigns/campaigns.controller.spec.ts
describe('POST /campaigns', () => {
  let app: INestApplication;
  let ownerToken: string;
  let unverifiedToken: string;

  beforeAll(async () => {
    // NestJS app başlat, factory'ler ile kullanıcı oluştur
    const owner = await createTestUser({ emailVerifiedAt: new Date() });
    const unverified = await createTestUser({ emailVerifiedAt: null });
    ownerToken = (await loginAsUser(app, owner.email, 'password')).accessToken;
    unverifiedToken = (await loginAsUser(app, unverified.email, 'password')).accessToken;
  });

  it('201 — verified user creates campaign', async () => {
    const res = await request(app.getHttpServer())
      .post('/campaigns')
      .set(authHeader(ownerToken))
      .send({ name: 'Dragon Hunt', description: 'A perilous quest' });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Dragon Hunt');
    expect(res.body.ownerId).toBeDefined();
  });

  it('403 — unverified user cannot create campaign', async () => {
    const res = await request(app.getHttpServer())
      .post('/campaigns')
      .set(authHeader(unverifiedToken))
      .send({ name: 'Should Fail' });

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('EMAIL_NOT_VERIFIED');
  });

  it('401 — unauthenticated request rejected', async () => {
    const res = await request(app.getHttpServer())
      .post('/campaigns')
      .send({ name: 'No Auth' });

    expect(res.status).toBe(401);
  });
});
```

---

## 5. Yetkilendirme Test Matrisi (Zorunlu)

Bu bölümdeki testler **zorunludur**. İlgili endpoint'e ait PR, bu test kombinasyonları olmadan merge edilemez.

### 5.1 Test Aktörleri

Her yetkilendirme testi aşağıdaki aktörleri kapsar:

| Aktör | Açıklama |
|---|---|
| `ADMIN` | Sistem admin'i (`role = ADMIN`) |
| `owner` | Kaynağın sahibi (campaign DM'i, karakter sahibi, homebrew sahibi) |
| `member` | Campaign üyesi (player), kaynak sahibi değil |
| `otherUser` | Hiçbir ilişkisi olmayan doğrulanmış kullanıcı |
| `unverified` | Email doğrulanmamış kullanıcı (`email_verified_at = NULL`) |
| `deactivated` | Deaktive edilmiş kullanıcı (`is_active = false`) |
| `guest` | Giriş yapmamış (token yok) |

### 5.2 Campaign Endpoint Test Matrisi

| Endpoint | ADMIN | owner (DM) | member | otherUser | unverified | deactivated | guest |
|---|---|---|---|---|---|---|---|
| `POST /campaigns` | 201 | 201 | 201 | 201 | **403** | **401** | **401** |
| `GET /campaigns` (list) | 200 (tümü) | 200 (sahip) | 200 (üye) | 200 (boş) | 200 (boş) | **401** | **401** |
| `GET /campaigns/:id` | 200 | 200 | 200 | **403** | **403** | **401** | **401** |
| `PATCH /campaigns/:id` | 200 | 200 | **403** | **403** | **403** | **401** | **401** |
| `DELETE /campaigns/:id` | 200 | 200 | **403** | **403** | **403** | **401** | **401** |
| `POST /campaigns/:id/invite/regenerate` | 200 | 200 | **403** | **403** | **403** | **401** | **401** |
| `POST /campaigns/:id/members/:uid/remove` | 200 | 200 | **403** | **403** | **403** | **401** | **401** |

### 5.3 Character Endpoint Test Matrisi

| Endpoint | ADMIN | owner | DM (campaign) | member (campaign) | otherUser | unverified | guest |
|---|---|---|---|---|---|---|---|
| `POST /characters` | 201 | 201 | 201 | 201 | 201 | **403** | **401** |
| `GET /characters/:id` (public) | 200 | 200 | 200 | 200 | 200 | 200 | 200 |
| `GET /characters/:id` (private, no campaign) | 200 | 200 | **403** | **403** | **403** | **403** | **403** |
| `GET /characters/:id` (private, in campaign) | 200 | 200 | 200 | 200 | **403** | **403** | **403** |
| `PATCH /characters/:id` | 200 | 200 | 200 (DM) | **403** | **403** | **403** | **401** |
| `DELETE /characters/:id` | 200 | 200 | 200 (DM) | **403** | **403** | **403** | **401** |

### 5.4 Homebrew Endpoint Test Matrisi

| Endpoint | ADMIN | owner | otherUser | unverified | guest |
|---|---|---|---|---|---|
| `POST /homebrew` | 201 | 201 | 201 | **403** | **401** |
| `GET /homebrew` (galeri, published) | 200 | 200 | 200 | 200 | 200 |
| `GET /homebrew/my-creations` | 200 | 200 | **403** | **403** | **401** |
| `GET /homebrew/:id` (published) | 200 | 200 | 200 | 200 | 200 |
| `GET /homebrew/:id` (draft) | 200 | 200 (sahip) | **404** | **404** | **404** |
| `PATCH /homebrew/:id` | 200 | 200 | **403** | **403** | **401** |
| `DELETE /homebrew/:id` | 204 | 204 | **403** | **403** | **401** |
| `PATCH /homebrew/:id/publish` | 200 | 200 | **403** | **403** | **401** |
| `PATCH /homebrew/:id/unpublish` | 200 | 200 | **403** | **403** | **401** |
| Resmi içerik (`source != HOMEBREW`) PATCH/DELETE | **200** | **403** | **403** | **403** | **401** |

### 5.4.1 Collection Endpoint Test Matrisi

| Endpoint | ADMIN | owner | otherUser | unverified | guest |
|---|---|---|---|---|---|
| `GET /collections` | 200 | 200 (kendi) | **403** | **403** | **401** |
| `POST /collections/:homebrewItemId` (published) | 201 | 201 | 201 | **403** | **401** |
| `POST /collections/:homebrewItemId` (draft) | **404** | **404** | **404** | **403** | **401** |
| `POST /collections/:homebrewItemId` (duplicate) | **409** | **409** | **409** | **403** | **401** |
| `DELETE /collections/:homebrewItemId` | 204 | 204 | **403** | **403** | **401** |

### 5.4.2 Reference Endpoint Test Matrisi

| Endpoint | ADMIN | verified USER | guest |
|---|---|---|---|
| `GET /reference/spells` | 200 | 200 | 200 |
| `GET /reference/spells/:id` | 200 | 200 | 200 |
| `GET /reference/monsters` (+ diğer tipler) | 200 | 200 | 200 |
| `GET /reference/classes` | 200 | 200 | 200 |
| `GET /reference/races` | 200 | 200 | 200 |
| `GET /reference/spells/:id` (geçersiz id) | **404** | **404** | **404** |

Reference endpoint'leri yazma işlemi içermez; yalnızca public read testleri yeterlidir.

### 5.5 User / Admin Endpoint Test Matrisi

| Endpoint | ADMIN | self | otherUser | guest |
|---|---|---|---|---|
| `GET /users/me` | 200 (full) | 200 (full) | — | **401** |
| `GET /users/:id` (public) | 200 (full) | 200 (full) | 200 (public only) | 200 (public only) |
| `PATCH /users/me` | 200 | 200 | — | **401** |
| `PATCH /users/me/password` (doğru current) | 204 | 204 | — | **401** |
| `PATCH /users/me/password` (yanlış current) | **401** | **401** | — | **401** |
| `POST /users/me/deactivate` | 204 | 204 | — | **401** |
| `PATCH /admin/users/:id/role` | 200 | — | **403** | **401** |
| `POST /admin/users/:id/deactivate` | 200 | — | **403** | **401** |
| `POST /admin/users/:id/reactivate` | 200 | — | **403** | **401** |
| Son admin rolünü düşürme | **422** (`LAST_ADMIN`) | — | — | — |

### 5.5.1 Deaktive Kullanıcı İçerik Gizleme Testleri

| Senaryo | Beklenen |
|---|---|
| Deaktive kullanıcının campaign'i — normal USER list/read | **404** (varlık gizleme) |
| Deaktive kullanıcının character/homebrew'i — normal USER | **404** veya listede yok |
| Aynı kaynaklar — ADMIN `GET /admin/*` | **200** |
| Reaktivasyon sonrası — normal USER | Kayıt tekrar görünür |

### 5.5.2 Self-Service Deaktivasyon Testleri

| Senaryo | Beklenen |
|---|---|
| `POST /users/me/deactivate` — authenticated self | **204**; `is_active=false` |
| Deaktivasyon sonrası login | **403** veya **401** (deaktive) |
| Deaktivasyon sonrası refresh | **401** (token iptal) |
| Deaktivasyon sonrası `GET /users/me` | **401** |
| Guest `POST /users/me/deactivate` | **401** |

Dosya: `apps/api/src/users/users.auth.spec.ts`.

### 5.5.3 Upload Presign Test Matrisi

| Senaryo | Beklenen |
|---|---|
| Authenticated `POST /uploads/presign` — geçerli png/jpeg/webp | **200** + `uploadUrl`, `publicUrl` |
| Guest presign | **401** |
| `contentType: image/svg+xml` | **400** |
| `contentType` allowlist dışı | **400** |
| `fileSize` > 5 MB | **400** |

Dosya: `apps/api/src/uploads/uploads.auth.spec.ts`.

### 5.7 WebSocket Gateway Test Matrisi

| Senaryo | Beklenen |
|---|---|
| Geçerli JWT ile bağlantı | Bağlantı kabul |
| Geçersiz/expired token | Disconnect |
| `join-campaign` — üye/DM | Room'a katılım; `joined-campaign` ack |
| `join-campaign` — outsider | `error` event, `code: FORBIDDEN` |
| `PATCH …/live` sonrası room dinleyicisi | `character:live-update` alır |
| Deaktive kullanıcı WS bağlantısı | Disconnect (handshake reddi) |

Dosya: `apps/api/src/websocket/websocket.gateway.spec.ts` (veya `test/websocket.gateway.spec.ts`).

### 5.6 Test Implementasyon Kuralı

Her matris hücresi bir `it()` bloğuna karşılık gelir. Testler şu yapıda organize edilir:

```typescript
// campaigns/campaigns.auth.spec.ts
describe('Campaign Authorization', () => {
  describe('DELETE /campaigns/:id', () => {
    it('200 — ADMIN can delete any campaign', async () => { /* ... */ });
    it('200 — owner (DM) can delete own campaign', async () => { /* ... */ });
    it('403 — member cannot delete campaign', async () => { /* ... */ });
    it('403 — otherUser cannot delete campaign', async () => { /* ... */ });
    it('403 — unverified user cannot delete campaign', async () => { /* ... */ });
    it('401 — deactivated user is rejected', async () => { /* ... */ });
    it('401 — guest is rejected', async () => { /* ... */ });
  });
});
```

Dosya isimlendirme: `*.auth.spec.ts` — yetkilendirme testleri diğer integration testlerden ayrı dosyada tutulur, kolay tanınır ve PR review'da hızla kontrol edilir.

---

## 6. Frontend Testleri

### 6.1 Component Testleri

Testing Library ile component render ve kullanıcı etkileşimi test edilir. Özellikle test edilecek bileşenler:

| Bileşen / Alan | Test Edilecek Davranış |
|---|---|
| Login formu | Validation hataları, başarılı submit, genel hata mesajı gösterimi |
| Register formu | Şifre uzunluk kontrolü, email format, username uniqueness hatası |
| Character builder tabs | Tab geçişleri, form state korunması, Zod validation |
| Koşullu UI render | Doğrulanmamış kullanıcıda disabled butonlar, DM olmayan kullanıcıda gizli invite butonu |
| Auth guard (route) | Unauthenticated kullanıcının login'e yönlendirilmesi |
| Error boundary | API 500 hatasında fallback UI |

### 6.2 Test Örneği

```typescript
// components/CampaignCard.test.tsx
import { render, screen } from '@testing-library/react';
import { CampaignCard } from './CampaignCard';

describe('CampaignCard', () => {
  it('shows edit button only for campaign owner', () => {
    render(
      <CampaignCard
        campaign={{ id: '1', name: 'Test', ownerId: 'user-1' }}
        currentUserId="user-1"
      />,
    );
    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
  });

  it('hides edit button for non-owner', () => {
    render(
      <CampaignCard
        campaign={{ id: '1', name: 'Test', ownerId: 'user-1' }}
        currentUserId="user-2"
      />,
    );
    expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument();
  });
});
```

### 6.3 RTK Query Mock Stratejisi

API mock'lama için **MSW (Mock Service Worker)** kullanılır. MSW, gerçek network seviyesinde istekleri yakalar — RTK Query'nin cache, invalidation ve retry davranışları doğal şekilde test edilir:

```typescript
// test/mocks/handlers.ts
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/campaigns', () => {
    return HttpResponse.json({
      data: [{ id: '1', name: 'Test Campaign' }],
      meta: { nextCursor: null, hasMore: false },
    });
  }),

  http.post('/api/v1/auth/login', async ({ request }) => {
    const body = await request.json();
    if (body.email === 'valid@test.com') {
      return HttpResponse.json({ accessToken: 'mock-token', user: { id: '1' } });
    }
    return HttpResponse.json(
      { error: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
      { status: 401 },
    );
  }),
];
```

```typescript
// test/setup.ts
import { setupServer } from 'msw/node';
import { handlers } from './mocks/handlers';

export const server = setupServer(...handlers);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

---

## 7. Test Data Factory

Test verisini tekrar tekrar elle yazmak yerine, deterministik factory fonksiyonları kullanılır. Her factory varsayılan değerler üretir, parametrelerle override edilebilir.

```typescript
// test/factories/user.factory.ts
import { hash } from 'argon2';
import { PrismaClient, Role } from '@prisma/client';

const DEFAULT_PASSWORD = 'Test1234';

let counter = 0;

export async function createTestUser(
  prisma: PrismaClient,
  overrides: Partial<{
    email: string;
    username: string;
    password: string;
    role: Role;
    isActive: boolean;
    emailVerifiedAt: Date | null;
  }> = {},
) {
  counter++;
  const passwordHash = await hash(overrides.password ?? DEFAULT_PASSWORD);

  return prisma.user.create({
    data: {
      email: overrides.email ?? `testuser${counter}@test.com`,
      username: overrides.username ?? `testuser${counter}`,
      passwordHash,
      role: overrides.role ?? Role.USER,
      isActive: overrides.isActive ?? true,
      emailVerifiedAt: overrides.emailVerifiedAt ?? new Date(),
    },
  });
}
```

```typescript
// test/factories/campaign.factory.ts
export async function createTestCampaign(
  prisma: PrismaClient,
  ownerId: string,
  overrides: Partial<{ name: string; description: string; inviteToken: string | null }> = {},
) {
  counter++;
  return prisma.campaign.create({
    data: {
      name: overrides.name ?? `Test Campaign ${counter}`,
      description: overrides.description ?? 'A test campaign',
      ownerId,
      inviteToken: overrides.inviteToken ?? `invite-token-${counter}`,
    },
  });
}
```

```typescript
// test/factories/character.factory.ts
export async function createTestCharacter(
  prisma: PrismaClient,
  ownerId: string,
  overrides: Partial<{
    name: string;
    visibility: CharacterVisibility;
    campaignId: string | null;
    level: number;
  }> = {},
) {
  counter++;
  return prisma.character.create({
    data: {
      name: overrides.name ?? `Test Character ${counter}`,
      ownerId,
      visibility: overrides.visibility ?? CharacterVisibility.PRIVATE,
      campaignId: overrides.campaignId ?? null,
      level: overrides.level ?? 1,
      race: 'Human',
      className: 'Fighter',
      abilityScores: { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 },
      maxHp: 10,
      currentHp: 10,
      temporaryHp: 0,
      armorClass: 10,
      speed: 30,
      proficiencyBonus: 2,
      conditions: [],
      deathSaves: { successes: 0, failures: 0 },
    },
  });
}
```

```typescript
// test/factories/homebrew.factory.ts
export async function createTestHomebrew(
  prisma: PrismaClient,
  ownerId: string,
  overrides: Partial<{
    name: string;
    type: HomebrewType;
    status: HomebrewStatus;
    data: Record<string, unknown>;
  }> = {},
) {
  counter++;
  return prisma.homebrewItem.create({
    data: {
      name: overrides.name ?? `Test Homebrew ${counter}`,
      ownerId,
      type: overrides.type ?? HomebrewType.FEAT,
      source: Source.HOMEBREW,
      status: overrides.status ?? HomebrewStatus.DRAFT,
      data: overrides.data ?? { description: 'A test homebrew item' },
    },
  });
}
```

**Kullanım:**

```typescript
// integration test'te
const dm = await createTestUser(prisma, { emailVerifiedAt: new Date() });
const player = await createTestUser(prisma, { emailVerifiedAt: new Date() });
const campaign = await createTestCampaign(prisma, dm.id);
await prisma.campaignMember.create({
  data: { campaignId: campaign.id, userId: player.id },
});
const character = await createTestCharacter(prisma, player.id, {
  campaignId: campaign.id,
  visibility: CharacterVisibility.PRIVATE,
});
```

---

## 8. CI Test Gate

GitHub Actions CI pipeline'ında aşağıdaki kontroller **required status check** olarak ayarlanır. Bu kontroller geçmeden `main` branch'ine merge **engellenir**.

### 8.1 Pipeline Adımları

```yaml
# .github/workflows/ci.yml
name: CI

on:
  pull_request:
    branches: [main]

jobs:
  lint-and-typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: pnpm install --frozen-lockfile
      - run: pnpm -r run lint
      - run: pnpm -r run typecheck    # tsc --noEmit

  backend-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_DB: dnd_companion_test
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
        ports: ["5432:5432"]
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      redis:
        image: redis:7-alpine
        ports: ["6379:6379"]
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: pnpm install --frozen-lockfile
      - run: cd apps/api && npx prisma migrate deploy
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/dnd_companion_test
      - run: pnpm --filter api test -- --coverage
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/dnd_companion_test
          TEST_DATABASE_URL: postgresql://test:test@localhost:5432/dnd_companion_test
          REDIS_URL: redis://localhost:6379
          JWT_SECRET: test-secret-minimum-32-characters-long
          FRONTEND_URL: http://localhost:5173

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter web test -- --coverage

  security-audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: pnpm install --frozen-lockfile
      - run: pnpm audit --audit-level=critical
```

### 8.2 Merge Kuralları

| Kontrol | Geçmezse |
|---|---|
| Lint (ESLint) | PR merge edilemez |
| Type-check (tsc --noEmit) | PR merge edilemez |
| Backend unit + integration testler | PR merge edilemez |
| Frontend component testler | PR merge edilemez |
| Security audit (critical level) | PR merge edilemez |

`main` branch'ine doğrudan push yasaktır. Her değişiklik feature branch + PR ile gelir.

---

## 9. Coverage Hedefleri

### 9.1 Genel Yaklaşım

Coverage metrikleri takip edilir ve CI'da raporlanır, ancak genel coverage oranı için **hard gate (minimum eşik) uygulanmaz**. Gerekçe: hobi projesinde genel coverage gate'i düşük değerli testlerin yazılmasını teşvik eder; odaklı testler daha değerlidir.

### 9.2 İstisnalar — Zorunlu Yüksek Coverage

Aşağıdaki alanlarda **%100 branch coverage** hedeflenir ve PR review'da kontrol edilir:

| Alan | Gerekçe |
|---|---|
| `common/policies/` (tüm policy fonksiyonları) | Yetkilendirme hatasının maliyeti çok yüksek — yetkisiz erişim |
| `auth/` modülü (login, register, refresh, verify, reset) | Kimlik doğrulama hataları güvenlik açığı oluşturur |
| `common/guards/` (JwtAuthGuard, EmailVerifiedGuard, RolesGuard) | Guard bypass'ı tüm güvenlik katmanını devre dışı bırakır |

Bu alanlar dışında coverage, PR review'da **code review** ile değerlendirilir — reviewer, kritik iş mantığının test edildiğinden emin olur.

### 9.3 Coverage Raporlama

```json
// apps/api/jest.config.ts (ek)
{
  "coverageThreshold": {
    "./src/common/policies/": {
      "branches": 100,
      "functions": 100,
      "lines": 100
    },
    "./src/auth/": {
      "branches": 95,
      "functions": 95,
      "lines": 95
    },
    "./src/common/guards/": {
      "branches": 100,
      "functions": 100,
      "lines": 100
    }
  }
}
```

---

## 10. E2E Test Notu

Playwright, Cypress veya benzeri browser-based E2E test paketi MVP kapsamında **yoktur**. Bu bilinçli bir karardır: hobi projesi için odaklı backend integration testleri ve component testleri yeterli koruma sağlar; E2E paketinin kurulum ve bakım maliyeti MVP'de karşılığını bulmaz.

İleride eklenecekse öncelik sırası:

1. Auth flow (register → verify → login → refresh → logout)
2. Campaign oluşturma → davet linki → katılım → karakter atama
3. Homebrew oluşturma → publish → galeri → koleksiyon

Bu akışlar backend integration testleriyle zaten kapsanmıştır; E2E testler frontend + backend entegrasyonunu tarayıcıda doğrular.
