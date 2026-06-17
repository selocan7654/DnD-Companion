# DnD Companion Platform — Dev Workflow

> **Doküman amacı:** Geliştirme ortamının sıfırdan kurulumunu, Git iş akışını, CI/CD pipeline'ını, veritabanı migration prosedürünü, seed script yapısını ve kod kalitesi araçlarını tanımlar. Kodlama agent'ı bu dokümanı okuyarak geliştirme sürecini eksiksiz yönetir.

---

## 1. Geliştirme Ortamı Gereksinimleri

Aşağıdaki araçlar geliştirici makinesinde kurulu olmalıdır:

| Araç | Minimum Sürüm | Doğrulama Komutu |
|---|---|---|
| Node.js | 20 LTS | `node -v` |
| pnpm | 9.x | `pnpm -v` |
| Docker Desktop | 4.x | `docker --version` |
| Docker Compose | v2 (Docker Desktop ile gelir) | `docker compose version` |
| Git | 2.40+ | `git --version` |

Editör: VS Code önerilir. Önerilen eklentiler `.vscode/extensions.json` dosyasında tanımlıdır: ESLint, Prettier, Prisma, Tailwind CSS IntelliSense.

---

## 2. Lokal Ortam Kurulumu (Sıfırdan Çalışır Hale Gelme)

Aşağıdaki adımlar, repo'yu klonladıktan sonra uygulamayı çalışır hale getirmek için yeterlidir:

```bash
# 1. Repo'yu klonla
git clone <repo-url> dnd-companion
cd dnd-companion

# 2. Bağımlılıkları yükle
pnpm install

# 3. Environment dosyasını oluştur
cp .env.example .env
# .env dosyasını düzenle: DB bağlantı bilgisi, JWT secret, SMTP vb.

# 4. Altyapı servislerini başlat (PostgreSQL + Redis)
docker compose up -d

# 5. Veritabanı migration'larını çalıştır
pnpm --filter api prisma migrate dev

# 6. Seed verisi yükle (admin hesabı + resmi 5e kural verisi)
pnpm --filter api prisma db seed

# 7. Backend'i başlat (hot-reload)
pnpm --filter api dev

# 8. Frontend'i başlat (ayrı terminal, hot-reload)
pnpm --filter web dev
```

Backend varsayılan olarak `http://localhost:3000`, frontend `http://localhost:5173` adresinde çalışır. Frontend, API isteklerini Vite proxy üzerinden backend'e yönlendirir (`vite.config.ts` içinde `/api` → `http://localhost:3000` proxy kuralı).

---

## 3. Docker Compose Yapısı

`docker-compose.yml` dosyası sadece altyapı servislerini (PostgreSQL, Redis) çalıştırır. Backend ve frontend host makinede çalışır (hot-reload ve hata ayıklama kolaylığı için).

```yaml
# docker-compose.yml
version: "3.8"

services:
  postgres:
    image: postgres:16-alpine
    container_name: dnd-companion-db
    restart: unless-stopped
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: dnd_user
      POSTGRES_PASSWORD: dnd_local_pass
      POSTGRES_DB: dnd_companion
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U dnd_user -d dnd_companion"]
      interval: 5s
      timeout: 3s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: dnd-companion-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redisdata:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5

volumes:
  pgdata:
  redisdata:
```

Faydalı komutlar:

| Komut | Açıklama |
|---|---|
| `docker compose up -d` | Servisleri arka planda başlat |
| `docker compose down` | Servisleri durdur (volume korunur) |
| `docker compose down -v` | Servisleri durdur + volume sil (temiz başlangıç) |
| `docker compose logs -f postgres` | PostgreSQL loglarını izle |

---

## 4. Environment Variables

Tüm secret'lar environment variable olarak tutulur. Repo'da `.env` dosyası **commit edilmez** (`.gitignore`'da yer alır). `.env.example` dosyası şablon olarak sağlanır.

### `.env.example` Şablonu

```env
# ── Veritabanı ──
DATABASE_URL="postgresql://dnd_user:dnd_local_pass@localhost:5432/dnd_companion?schema=public"

# ── Redis ──
REDIS_URL="redis://localhost:6379"

# ── JWT ──
JWT_ACCESS_SECRET="change-me-access-secret-min-32-chars"
JWT_REFRESH_SECRET="change-me-refresh-secret-min-32-chars"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="30d"

# ── SMTP (Gmail App Password) ──
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="DnD Companion <your-email@gmail.com>"

# ── Object Storage (S3-uyumlu) ──
S3_ENDPOINT="https://your-s3-endpoint"
S3_BUCKET="dnd-companion-uploads"
S3_REGION="auto"
S3_ACCESS_KEY="your-access-key"
S3_SECRET_KEY="your-secret-key"
S3_PUBLIC_URL="https://your-cdn-or-public-url"

# ── Uygulama ──
APP_URL="http://localhost:5173"
API_PORT=3000
NODE_ENV="development"

# ── Seed ──
SEED_ADMIN_EMAIL="admin@dnd-companion.local"
SEED_ADMIN_PASSWORD="admin-local-password"

# ── Sentry (opsiyonel, development'da boş bırakılabilir) ──
SENTRY_DSN=""
```

### Ortam Başına Ayrım

| Değişken Grubu | Development | Staging | Production |
|---|---|---|---|
| `DATABASE_URL` | Lokal Docker Postgres | Managed Postgres (staging) | Managed Postgres (production) |
| `REDIS_URL` | Lokal Docker Redis | Managed Redis (staging) | Managed Redis (production) |
| `JWT_*_SECRET` | Sabit test değeri | Rastgele üretilmiş | Rastgele üretilmiş, secret store'da |
| `S3_*` | Lokal MinIO veya gerçek bucket | Staging bucket | Production bucket |
| `SENTRY_DSN` | Boş | Staging DSN | Production DSN |
| `NODE_ENV` | `development` | `staging` | `production` |

Production secret'ları deployment platformunun secret store'unda tutulur (env var olarak inject edilir). Hiçbir ortamın secret'ı repo'da veya CI log'larında açık metin olarak yer almaz.

---

## 5. Git Workflow

### Branch Stratejisi

Tek ana branch: `main`. Her değişiklik bir **feature branch**'te yapılır, **Pull Request** ile `main`'e merge edilir. `main`'e doğrudan push **yasaktır** (GitHub branch protection rule ile zorlanır).

### Branch İsimlendirme Konvansiyonu

```
<type>/<kisa-aciklama>

Örnekler:
feat/campaign-crud
feat/character-builder-step-navigation
fix/auth-guard-bypass-on-public-routes
chore/docker-compose-healthcheck
refactor/homebrew-service-extract-validation
test/campaign-membership-auth-matrix
docs/api-contracts-websocket-events
```

### Conventional Commits

Her commit mesajı şu formattadır:

```
<type>(<scope>): <açıklama>

Tipler:
feat     → Yeni özellik
fix      → Hata düzeltmesi
chore    → Build/config değişikliği (kullanıcıyı etkilemeyen)
refactor → Davranış değiştirmeyen kod yeniden yapılandırması
test     → Test ekleme/düzeltme
docs     → Doküman değişikliği

Scope (opsiyonel): etkilenen modül
  auth, users, campaigns, characters, homebrew, reference, admin,
  uploads, websocket, common, web, shared, ci, db

Örnekler:
feat(campaigns): add invite link regeneration endpoint
fix(auth): prevent refresh token reuse after rotation
test(characters): add ownership guard integration tests
chore(ci): add dependency scanning step
refactor(homebrew): extract JSONB validation to shared schema
docs(api): update WebSocket event payload format
```

---

## 6. Pull Request Süreci

### PR Açma

Her PR şu bilgileri içerir (`.github/pull_request_template.md` ile şablonlanır):

```markdown
## Ne değişti?
[Kısa açıklama — ne eklendi/değişti/kaldırıldı]

## Neden?
[Motivasyon — hangi sorunu çözüyor veya hangi özelliği ekliyor]

## Nasıl test edildi?
- [ ] Unit testler eklendi/güncellendi
- [ ] Integration testler eklendi/güncellendi (yetki kuralı içeriyorsa zorunlu)
- [ ] Manuel test yapıldı (hangi senaryolar)

## Kontrol listesi
- [ ] Conventional commit formatına uygun
- [ ] `pnpm lint` hatasız geçiyor
- [ ] `pnpm typecheck` hatasız geçiyor
- [ ] Yetki kuralı değişikliği varsa → auth test matrisi güncel
- [ ] Yeni env variable eklendiyse → `.env.example` güncellendi
- [ ] Migration eklendiyse → seed script hâlâ çalışıyor
```

### Merge Kuralları

- CI pipeline'daki tüm required status check'ler (lint, type-check, test) geçmelidir; geçmeden merge **engellenir**.
- Yetki kuralı (guard/policy) içeren değişiklikler, ilgili integration testleri olmadan merge edilemez.
- Merge stratejisi: **Squash merge** (temiz commit geçmişi için). PR başlığı commit mesajı olarak kullanılır (Conventional Commits formatında).
- Agent (Cursor/Claude Code), kullanıcı onayı olmadan `main`'e merge etmez ve production'a deploy etmez.

---

## 7. CI/CD Pipeline (GitHub Actions)

### Pipeline Yapısı

```yaml
# .github/workflows/ci.yml
name: CI

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm --filter api exec tsc --noEmit
      - run: pnpm --filter web exec tsc --noEmit

  test-backend:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: test_user
          POSTGRES_PASSWORD: test_pass
          POSTGRES_DB: dnd_companion_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd "pg_isready -U test_user"
          --health-interval 5s
          --health-timeout 3s
          --health-retries 5
      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 5s
          --health-timeout 3s
          --health-retries 5
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter api prisma migrate deploy
        env:
          DATABASE_URL: postgresql://test_user:test_pass@localhost:5432/dnd_companion_test
      - run: pnpm --filter api test -- --ci --coverage
        env:
          DATABASE_URL: postgresql://test_user:test_pass@localhost:5432/dnd_companion_test
          REDIS_URL: redis://localhost:6379
          JWT_ACCESS_SECRET: ci-test-access-secret-32chars-min
          JWT_REFRESH_SECRET: ci-test-refresh-secret-32chars-min
          NODE_ENV: test

  test-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter web test -- --ci --coverage

  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm audit --audit-level=critical
        continue-on-error: false

  build:
    needs: [lint, test-backend, test-frontend, security]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter web build
      - run: pnpm --filter api build
```

### Required Status Checks

GitHub repository ayarlarında `main` branch'i için şu check'ler **required** olarak işaretlenir:

- `lint`
- `test-backend`
- `test-frontend`
- `security`
- `build`

Bu check'lerden herhangi biri başarısız olursa PR merge edilemez.

### Deploy

Deploy adımı bu pipeline'da yer almaz — deployment platformu henüz belirlenmemiştir (`[INF-OPEN-1]`). Platform seçildikten sonra `build` job'ından sonra bir `deploy` job'ı eklenir. Deploy job'ı **manuel onay gate'i** (`environment: production` + GitHub Environment approval) içerir; otomatik production deploy'u yapılmaz.

---

## 8. Veritabanı Migration Prosedürü

### Migration Araçları

Prisma Migrate kullanılır. Migration dosyaları `apps/api/prisma/migrations/` altında versiyonlanır ve repo'ya commit edilir.

### Geliştirme Ortamında Migration

```bash
# Şema değişikliği yap (schema.prisma düzenle)
# Migration oluştur + uygula:
pnpm --filter api prisma migrate dev --name <migration-adi>

# Örnekler:
pnpm --filter api prisma migrate dev --name add-campaign-setting-field
pnpm --filter api prisma migrate dev --name create-dm-notes-table
```

`migrate dev` komutu: migration SQL dosyası oluşturur, lokal veritabanına uygular ve Prisma Client'ı yeniden üretir. Migration adı `kebab-case` ile yazılır, değişikliği özetler.

### Staging / Production Ortamında Migration

```bash
# Mevcut migration'ları uygula (yeni migration oluşturmaz):
pnpm --filter api prisma migrate deploy
```

`migrate deploy` komutu: henüz uygulanmamış migration dosyalarını sırayla çalıştırır. Yeni migration üretmez, sadece mevcut dosyaları uygular. CI/CD pipeline'ında deploy adımının parçası olarak çalıştırılır.

### Rollback Prosedürü

Prisma Migrate'in otomatik rollback mekanizması yoktur. Migration geri almak gerektiğinde:

1. Sorunlu migration'ın tersini yapan yeni bir migration yazılır (`migrate dev --name revert-xxx`).
2. Migration "failed" durumunda kalırsa: `pnpm --filter api prisma migrate resolve --rolled-back <migration-adi>` ile migration durumu "rolled back" olarak işaretlenir, ardından düzeltici migration oluşturulur.
3. Kritik veri kaybı riski varsa: managed Postgres'in Point-in-Time Recovery özelliği kullanılır (aşağıdaki Backup bölümüne bakınız).

### Migration PR Kuralları

- Her migration değişikliği ayrı bir PR'da gelir (diğer feature değişiklikleriyle karışmaması için mümkün olduğunca).
- PR açıklamasında migration'ın ne yaptığı (hangi tablo/alan ekleniyor/değişiyor/siliniyor) açıkça belirtilir.
- Migration uygulandıktan sonra seed script'in hâlâ hatasız çalıştığı doğrulanır.

---

## 9. Seed Script

Seed script (`apps/api/prisma/seed.ts`) iki iş yapar: ilk admin hesabını oluşturur ve resmi D&D 5e kural verisini yükler.

### İlk Admin Hesabı

```typescript
// Pseudo-kod — seed.ts içinde
const adminEmail = process.env.SEED_ADMIN_EMAIL;
const adminPassword = process.env.SEED_ADMIN_PASSWORD;

// Idempotent: email zaten varsa atla
const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
if (!existing) {
  const hash = await argon2.hash(adminPassword);
  await prisma.user.create({
    data: {
      email: adminEmail,
      username: 'admin',
      passwordHash: hash,
      role: 'ADMIN',
      emailVerifiedAt: new Date(), // Admin doğrulanmış kabul edilir
      isActive: true,
    },
  });
}
```

`SEED_ADMIN_EMAIL` ve `SEED_ADMIN_PASSWORD` env var'ları `.env` dosyasında tanımlıdır. Production'da güçlü şifre kullanılır ve seed sonrası şifre değiştirilir.

### Resmi 5e Kural Verisi

Tüm resmi D&D 5e kaynak kitaplarından (PHB, DMG, XGtE, TCoE, FToD, VRGtR, MPMM vb.) derlenen kural verisi JSON dosyalarından yüklenir:

```
apps/api/prisma/seed-data/
├── spells.json          # ~500+ spell
├── monsters.json        # ~300+ monster
├── classes.json         # 13 class + subclass'lar
├── races.json           # 30+ race
├── feats.json           # 80+ feat
├── backgrounds.json     # 30+ background
├── magic-items.json     # 300+ magic item
└── subclasses.json      # 120+ subclass
```

Her JSON dosyası, `homebrew_items` tablosunun şemasına uygun kayıt dizisi içerir. `source` alanı kitap kodunu taşır (`PHB`, `XGTE`, `TCOE` vb.), `owner_id` `NULL`'dır (resmi içerik), `status` `PUBLISHED`'dır.

```typescript
// Pseudo-kod — seed.ts içinde
const spellsData = JSON.parse(fs.readFileSync('prisma/seed-data/spells.json', 'utf-8'));

for (const spell of spellsData) {
  await prisma.homebrewItem.upsert({
    where: {
      name_type_source: { name: spell.name, type: 'SPELL', source: spell.source },
    },
    update: { data: spell.data, description: spell.description },
    create: {
      name: spell.name,
      type: 'SPELL',
      source: spell.source,
      ownerId: null,
      status: 'PUBLISHED',
      description: spell.description,
      data: spell.data,
    },
  });
}
```

Seed script **idempotent** çalışır: `upsert` kullanarak mevcut kayıtları günceller, yeni kayıtları ekler. Tekrar çalıştırılması mevcut kullanıcı verisini bozmaz.

### Seed Çalıştırma

```bash
# İlk kurulum veya veri güncellemesi:
pnpm --filter api prisma db seed

# package.json'da seed komutu:
# "prisma": { "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts" }
```

---

## 10. Kod Kalitesi Araçları

### ESLint

Monorepo kökünde tek bir ESLint yapılandırması (`eslint.config.js`), TypeScript kuralları + React kuralları:

```javascript
// eslint.config.js (flat config)
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['apps/web/**/*.{ts,tsx}'],
    plugins: { react, 'react-hooks': reactHooks },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-function-return-type': 'off',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  {
    ignores: ['**/dist/**', '**/node_modules/**', '**/coverage/**'],
  }
);
```

### Prettier

```json
// .prettierrc
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "endOfLine": "lf"
}
```

### Husky + lint-staged (Pre-commit Hook)

```json
// package.json (root)
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md,yml,yaml}": ["prettier --write"]
  }
}
```

```bash
# Kurulum (repo ilk klonlandığında pnpm install ile otomatik çalışır):
# package.json scripts: "prepare": "husky"

# .husky/pre-commit
pnpm lint-staged
```

Her commit öncesi değiştirilen dosyalarda lint + format otomatik çalışır. CI'da aynı kurallar tekrar doğrulanır.

### VS Code Ayarları

```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "typescript.preferences.importModuleSpecifier": "relative"
}
```

```json
// .vscode/extensions.json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "Prisma.prisma",
    "bradlc.vscode-tailwindcss"
  ]
}
```

---

## 11. Backup ve Veri Güvenliği

### Production Backup Gereksinimleri

Production ortamında managed PostgreSQL sağlayıcısından şu özellikler beklenir:

- **Günlük otomatik snapshot** — en az günde bir tam yedek.
- **7 gün Point-in-Time Recovery (PITR)** — herhangi bir ana geri dönüş imkânı.
- **Yedeklerin farklı bölgede saklanması** — sağlayıcının sunduğu düzeyde.

Bu gereksinimler deployment platformu seçildiğinde doğrulanır. Managed Postgres hizmetlerinin büyük çoğunluğu (Railway, Render, Neon, AWS RDS, Supabase) bu temel düzeyi karşılar.

### Lokal Geliştirme

Lokal ortamda yedekleme gerekmez — Docker volume yeterlidir. Temiz başlangıç gerektiğinde `docker compose down -v` ile volume silinir, `migrate dev` + `seed` ile sıfırdan kurulur.

### Migration Sonrası Kurtarma

Hatalı bir migration production'a uygulandığında kurtarma sırası:

1. Uygulamayı maintenance moduna al (varsa) veya deploy'u durdur.
2. Migration'ın tersini yapan düzeltici migration yazılıp test edilir.
3. Düzeltici migration uygulanır.
4. Veri kaybı olduysa ve düzeltici migration yetersizse: PITR ile migration öncesi ana geri dönülür, ardından düzeltilmiş migration uygulanır.

---

## 12. Monorepo Script Referansı

Sık kullanılan pnpm komutları:

| Komut | Açıklama |
|---|---|
| `pnpm install` | Tüm bağımlılıkları yükle |
| `pnpm --filter api dev` | Backend'i geliştirme modunda başlat |
| `pnpm --filter web dev` | Frontend'i geliştirme modunda başlat |
| `pnpm --filter api test` | Backend testlerini çalıştır (Jest) |
| `pnpm --filter web test` | Frontend testlerini çalıştır (Vitest) |
| `pnpm --filter api test -- --watch` | Backend testlerini izleme modunda çalıştır |
| `pnpm --filter web test -- --watch` | Frontend testlerini izleme modunda çalıştır |
| `pnpm lint` | Tüm projeyi lint'le |
| `pnpm --filter api prisma migrate dev --name <ad>` | Yeni migration oluştur + uygula |
| `pnpm --filter api prisma migrate deploy` | Mevcut migration'ları uygula (staging/prod) |
| `pnpm --filter api prisma db seed` | Seed verisi yükle |
| `pnpm --filter api prisma studio` | Prisma Studio'yu aç (DB görsel arayüzü) |
| `pnpm --filter api build` | Backend'i derle |
| `pnpm --filter web build` | Frontend'i derle (dist/ çıktısı) |
| `pnpm audit --audit-level=critical` | Kritik güvenlik açıklarını tara |

Root `package.json` içinde kısayol script'leri tanımlanır:

```json
{
  "scripts": {
    "dev:api": "pnpm --filter api dev",
    "dev:web": "pnpm --filter web dev",
    "test": "pnpm --filter api test && pnpm --filter web test",
    "lint": "eslint .",
    "typecheck": "pnpm --filter api exec tsc --noEmit && pnpm --filter web exec tsc --noEmit",
    "build": "pnpm --filter web build && pnpm --filter api build",
    "prepare": "husky"
  }
}
```

---

## 13. Production Docker Build

MVP production artefaktı platform-agnostik multi-stage `Dockerfile` ile üretilir. Agent **belirli bir cloud sağlayıcıya deploy etmez** — yalnızca image build ve lokal smoke doğrular.

### Dockerfile Konumu

Repo kökünde `Dockerfile` (veya `apps/api/Dockerfile` — implementasyon tek kaynak seçer; `docs/10` §7.6 ile uyumlu).

### Build Komutları

```bash
# Production image oluştur
docker build -t dnd-companion:latest .

# Smoke (container başlat — env inject gerekir)
docker run --rm -p 3000:3000 \
  -e DATABASE_URL=... \
  -e REDIS_URL=... \
  -e JWT_ACCESS_SECRET=... \
  -e JWT_REFRESH_SECRET=... \
  -e FRONTEND_URL=... \
  -e S3_ENDPOINT=... \
  -e S3_BUCKET=... \
  -e S3_ACCESS_KEY=... \
  -e S3_SECRET_KEY=... \
  -e S3_PUBLIC_URL=... \
  dnd-companion:latest
```

Container içinde migration: deploy öncesi `pnpm prisma migrate deploy` (CI/CD veya platform start command) — `migrate dev` production'da **yasak**.

### Image İçeriği

- `apps/api/dist` — NestJS build
- `apps/web/dist` — statik FE (`public/` veya `ServeStaticModule` path)
- `prisma/` — migration dosyaları
- Production `node_modules` (builder stage'den)

### Deployment Hazırlık Checklist (İnsan Gate)

Platform seçilmeden agent tamamlayabilecekleri:

- [ ] `docker build` başarılı
- [ ] `pnpm lint && pnpm typecheck && pnpm test && pnpm build` yeşil
- [ ] `.env.example` tüm zorunlu key'leri listeler (`SENTRY_DSN` opsiyonel)
- [ ] `[INF-OPEN-1]` kapanana kadar platform-specific config **yazılmaz**
