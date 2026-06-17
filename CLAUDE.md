# CLAUDE.md — DnD Companion

> Bu proje **`.cursor/rules/*.mdc`** altında tanımlı kural seti ile yönetilir.
> Bu dosya always-apply + glob + göreve-bağlı kuralların **yönlendiricisidir**.
> **Spec tek doğruluk kaynağı:** `docs/`. `.mdc` ile docs çelişirse **docs kazanır**; rule güncellenir.

---

## ⚙️ Çalışma Protokolü — Her Görevde

1. **Her zaman geçerli (00–04)** — özet aşağıda; tereddütte ilgili tam `.mdc` oku.
2. **Dosyaya dokunmadan önce** glob tablosundan eşleşen kuralları oku.
3. **Görev prosedürüyse** (endpoint, ekran, migration…) how-to tablosundan ilgili `4x` kuralı oku.
4. **Faz çalışmasıysa** (`Faz N — İterasyon M`) önce `48-git-phase-branch`, sonra ilgili `5x-phase-*.mdc` oku.
5. Spec detayı için `docs/` path'ine git — rule'da kopyalanmış tablo arama.

> **Verimlilik:** 35 `.mdc` dosyasının tamamını okuma. Yalnızca dokunduğun dosya + görev tipine uygun kurallar yeterli. Faz kuralları: `50-phase-01` … `54-phase-05-upload-production`.

---

## 📌 Her Zaman Geçerli (00–04 özet)

Tam metin: `.cursor/rules/00-project-identity.mdc` … `04-quality-gates.mdc`.

### [00] Proje Kimliği

- D&D 5e kampanya/karakter yönetimi; D&D Beyond + 5e.tools DM Screen konsepti; hobi/topluluk — monetizasyon yok.
- Agent mimari karar **almaz**; `docs/` + `docs/mimari-kararlar.md` tek kaynak.
- Stack pin'li: TypeScript, pnpm, NestJS + Prisma + PostgreSQL, Redis, Socket.io, React + Vite + RTK Query, Tailwind + shadcn/ui.
- Monorepo: `apps/api`, `apps/web`, `packages/shared`; FE build NestJS'ten statik serve.
- Erişim: misafir (referans + published homebrew), doğrulanmış USER (CRUD), ADMIN (bypass).
- Campaign tamamen private; DM/Player sistem rolü değil — kampanya ilişkisinden doğar.
- MVP dışı kod yazma: MFA, E2E, dice/combat tracker, monetizasyon, hard delete, audit UI.

### [01] Kodlama Felsefesi

- Akış: docs oku → feature branch → minimal diff → test → PR → insan onayı.
- Bir oturum = bir PR; `main` merge / production deploy / faz geçişi kullanıcı onayı olmadan yapılmaz.
- Bölüm 18 açık kararlarda varsayım yok — sor veya `// TODO: [KONU] — mimari karar gerekiyor`.
- Yetki içeren endpoint → integration test aynı PR'da zorunlu; E2E MVP'de yok.
- Minimal diff: drive-by refactor yok; shared tipler `packages/shared`'da tek tanım.
- Spec tablosunu rule/chat'e kopyalama — path + bölüm referansı yeterli.
- Faz çalışması: `Faz N — İterasyon M` + `@5x-phase-*` + `48-git-phase-branch`.

### [02] Dil ve İsimlendirme

- UI metinleri **yalnızca İngilizce**; kod İngilizce (camelCase / PascalCase); i18n yok.
- API path kebab-case (`/api/v1/campaigns`); hata `error` SCREAMING_SNAKE, `message` İngilizce.
- Commit/branch/PR İngilizce Conventional Commits (`feat(campaigns): …`).
- Prisma DB snake_case → TS camelCase; enum SCREAMING_SNAKE.
- Shared enum/Zod/policy sabitleri `packages/shared`'da tek kaynak.
- Login/register genel hata: enumeration yok (`Invalid email or password`).
- WS event adları kebab-case; JSON payload camelCase.

### [03] Güvenlik Tabanı

- Hedef OWASP ASVS L1; her değişiklikte **6 zorunlu kontrol** (atlanmaz).
- Yazma endpoint: guard + policy; frontend gizleme ≠ güvenlik.
- Yalnızca Prisma Client; raw SQL / string concat yasak.
- Access token memory; refresh httpOnly+Secure+SameSite cookie; localStorage/sessionStorage yasak.
- `password_hash` response/log yok; `email` yalnızca sahip veya ADMIN.
- Upload: png/jpeg/webp, max 5 MB, magic-byte; SVG yasak; DTO validation zorunlu.
- Yetkisiz kaynak → 404; kendi kaynağında yetki → 403; yetki değişikliği → integration test.

### [04] Kalite Kapıları

- CI sırası: lint → type-check → test → security audit → build — hepsi merge gate.
- Test piramidi: BE integration (en yüksek) → BE unit → FE component; E2E yok.
- Hard coverage: `policies/` ve `guards/` %100; `auth/` ≥ %95.
- Integration test: gerçek Postgres, factory + `afterEach` truncate.
- a11y: WCAG 2.1 AA temel (klavye, ARIA, focus-visible, modal trap).
- Migration PR'da seed yeşil; yeni env → `.env.example` güncelle.
- Agent `main` merge ve production deploy onaysız yapmaz.

---

## 🗂 Glob Yönlendirme (10–35)

Birden fazla desen eşleşebilir — **hepsini uygula**. Çelişki → docs kazanır.

### Backend (10–17)

| Dosya deseni | Kural | Kısa tetik |
| --- | --- | --- |
| `apps/api/**/*.ts` (spec/test hariç) | `10-backend-general` | Pipeline, modül yapısı, envelope, logging |
| `apps/api/src/auth/**`, JWT/email guard'lar | `11-backend-auth` | JWT, refresh rotation, Argon2id, rate limit |
| `common/policies/**`, `common/guards/**`, `common/decorators/**`, `packages/shared/**/permissions*`, `policy*` | `12-backend-authorization` | `can()`, 404/403, ADMIN bypass |
| `campaigns/`, `characters/`, `homebrew/`, `collections/`, `users/`, `reference/`, `uploads/`, `email/` | `13-backend-domain-modules` | Domain modül iş mantığı |
| `apps/api/**/*.controller.ts` | `14-backend-controllers` | Decorator stack, ince controller |
| `apps/api/prisma/**`, `**/*.service.ts`, `common/prisma/**` | `15-backend-database-prisma` | Schema, migration, Prisma erişimi |
| `apps/api/src/websocket/**` | `16-backend-websocket` | Socket.io, room join, live fields |
| `apps/api/src/admin/**`, `roles.guard.ts` | `17-backend-admin-audit` | ADMIN panel, audit INSERT-only |

### Frontend (20–25)

| Dosya deseni | Kural | Kısa tetik |
| --- | --- | --- |
| `apps/web/src/**` | `20-frontend-general` | Klasör yapısı, Redux auth, WS client |
| `routes/**`, `App.tsx`, `layouts/**`, `pages/**` | `21-frontend-routes` | Router, guard (UX), lazy load, title |
| `*Form*.tsx`, `pages/**/new/**`, `edit/**`, `features/**/builder/**` | `22-frontend-forms` | RHF + Zod, builder, auto-save |
| `store/**`, `useAuth.ts`, `usePagination.ts` | `23-frontend-rtk-query` | RTK Query, tag invalidation, reauth |
| `components/**`, `features/**` | `24-frontend-components` | shadcn/ui, feature vs component |
| `apps/web/**/*.tsx` | `25-frontend-a11y` | WCAG, klavye, ARIA, focus |

### Altyapı ve Test (30, 35)

| Dosya deseni | Kural | Kısa tetik |
| --- | --- | --- |
| `docker-compose*.yml`, `Dockerfile*`, `.github/**`, `infrastructure/**` | `30-infrastructure` | Compose, CI, migration/seed, env |
| `**/*.{test,spec}.{ts,tsx}`, `**/test/**`, `jest.config.*`, `vitest.config.*` | `35-testing` | Jest/Vitest, factory, auth matrisi |

### Bilinçli örtüşmeler

| Dosya | Kurallar |
| --- | --- |
| `*.controller.ts` | 10 + 14 |
| `*.service.ts` | 10 + 13 + 15 |
| `common/policies/*` | 12 |
| `auth/*` | 10 + 11 |
| `apps/web/**/*.tsx` | 20 + 25 |

---

## 🛠 How-To Yönlendirme (40–48)

Agent-requestable — görev başında ilgili prosedürü oku.

| Görev türü | Kural | Ne zaman |
| --- | --- | --- |
| Yeni REST endpoint | `40-add-new-endpoint` | POST/PATCH/GET/DELETE `/api/v1` |
| Yeni ekran (S-*) | `41-add-new-screen` | Route, page, RTK Query, form, a11y |
| Prisma migration | `42-add-prisma-migration` | `schema.prisma` değişikliği |
| Yetki / policy | `43-add-authorization-policy` | `canRead`/`canUpdate`, guard, 404/403 |
| Refactor (davranış aynı) | `44-refactor-to-pattern` | Anti-pattern temizliği, policy extract |
| Mimari karar (ADR) | `45-write-architectural-decision` | Stack pin, açık karar kapatma |
| Kırmızı test / CI fix | `46-fix-failing-test` | Jest, Vitest, coverage gate |
| DM Screen live fields | `47-websocket-live-fields` | WS gateway, PATCH /live, Redis adapter |
| Faz implementasyonu | `48-git-phase-branch` | `Faz N — İterasyon M`, feature branch, PR |

---

## 🚦 Faz Yönlendirme (50–54)

**Durum:** Faz 1–5 kural dosyaları `.cursor/rules/` altında mevcut; `@phase-controller` gap audit henüz yapılmadı (`*-fix.mdc` yok).

Mesajda **「Faz N — İterasyon M」** belirt; kod öncesi `48-git-phase-branch` uygula; sonra ilgili `@5x-phase-XX-slug` invoke et.

| Faz | Kural dosyası | Roadmap başlığı |
| --- | --- | --- |
| 1 | `50-phase-01-auth-infra.mdc` | Temel Altyapı ve Kimlik Doğrulama |
| 2 | `51-phase-02-campaign-character.mdc` | Campaign ve Karakter CRUD |
| 3 | `52-phase-03-homebrew-reference.mdc` | Homebrew, Koleksiyon ve Referans Verisi |
| 4 | `53-phase-04-dm-screen-admin.mdc` | DM Screen, Real-time ve Admin Panel |
| 5 | `54-phase-05-upload-production.mdc` | Dosya Yükleme, Profil ve Prodüksiyon Hazırlığı |

Faz bağımlılığı: 2 ‖ 3 (paralel, Faz 1 sonrası) → 4 → 5. Detay: `docs/10_IMPLEMENTATION_ROADMAP.md` Bölüm 2–7.

Implementasyon sonrası gap audit: `@phase-controller` skill → `.cursor/rules/*-fix.mdc` (varsayılan çıktı; `docs/fix-reports/` yalnızca açık istekle).

---

## 📚 docs/ — Nihai Kaynak

| Dosya | Ne zaman oku |
| --- | --- |
| `docs/00_PROJECT_OVERVIEW.md` | Bağlam, MVP sınırları, başarı kriterleri |
| `docs/01_DOMAIN_MODEL.md` | Entity, iş kuralı, state machine |
| `docs/02_DATABASE_SCHEMA.md` | Prisma şema, migration |
| `docs/03_API_CONTRACTS.md` | Endpoint, hata envelope, WS event |
| `docs/04_BACKEND_SPEC.md` | NestJS modül, guard, filter |
| `docs/05_FRONTEND_SPEC.md` | Route, state, form, a11y |
| `docs/06_SCREEN_CATALOG.md` | Ekran ID (`S-*`), UX state |
| `docs/07_SECURITY_IMPLEMENTATION.md` | Auth akışı, token, rate limit |
| `docs/08_TESTING_STRATEGY.md` | Test piramidi, coverage |
| `docs/09_DEV_WORKFLOW.md` | Git, CI, seed, lokal kurulum |
| `docs/10_IMPLEMENTATION_ROADMAP.md` | Faz sırası, oturum planı, insan gate |
| `docs/mimari-kararlar.md` | Pin'li karar ID'leri, açık kararlar (Bölüm 18) |

> Yeni faz veya spec değişikliği → **önce docs güncelle**, sonra ilgili `.mdc` referansını doğrula.

---

## 🔁 Yer Konumu

| Konum | İçerik |
| --- | --- |
| `.cursor/rules/` | Tüm `.mdc` kuralları (numara = dosya öneki) |
| `CLAUDE.md` | Bu router — kural metni tekrarlamaz |
| `.cursor/skills/phase-creator/` | Faz `.mdc` üretim skill'i |
| `.cursor/skills/phase-controller/` | Faz sonrası gap audit skill'i |

Örnek: `14` → `14-backend-controllers.mdc`; görev → `@40-add-new-endpoint`.
