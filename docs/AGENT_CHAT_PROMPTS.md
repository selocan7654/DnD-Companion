# Agent Chat Prompt Dizini — DnD Companion (Tam Liste)

> Her blok = **ayrı Cursor chat**. Kopyala-yapıştır. Detay spec `docs/` ve `@5x-phase-*` içinde — prompt'ta tekrarlanmaz.
>
> **Sıra:** P0 → P1 → P2 (ops.) → Faz 1 (1.1–1.6) → G1 → Faz 2 ‖ Faz 3 → G2, G3 → Faz 4 → G4 → Faz 5 → G5
>
> Agent `main`'e merge etmez. Commit için açıkça iste.

---

## İndeks (43 chat)

| ID | Chat adı | Branch |
|----|----------|--------|
| P0 | Doc drift | `docs/api-path-drift-fix` |
| P1 | Skill hijyeni | `chore/skill-hygiene-dnd` |
| P2 | Meta sync | `docs/agent-meta-sync` |
| 1.1–1.6 | Faz 1 iterasyonları | phase .mdc tablosu |
| G1 | Faz 1 audit | — |
| 2.1–2.8 | Faz 2 iterasyonları | phase .mdc tablosu |
| G2 | Faz 2 audit | — |
| 3.1–3.7 | Faz 3 iterasyonları | phase .mdc tablosu |
| G3 | Faz 3 audit | — |
| 4.1–4.7 | Faz 4 iterasyonları | phase .mdc tablosu |
| G4 | Faz 4 audit | — |
| 5.1–5.6 | Faz 5 iterasyonları | phase .mdc tablosu |
| G5 | Faz 5 audit | — |
| H1–H5 | İnsan gate (sen) | — |

---

# ÖN HAZIRLIK

## P0 — Doc drift düzeltmesi

**Chat adı:** `P0 — API path drift fix`

```
@docs/03_API_CONTRACTS.md @docs/10_IMPLEMENTATION_ROADMAP.md @docs/08_TESTING_STRATEGY.md @docs/mimari-kararlar.md

Görev: Spec drift düzeltmesi — kod yazma yok, yalnızca docs.

1) docs/10 Bölüm 3: Eski path'leri docs/03 ile hizala:
   - GET /api/health → GET /api/v1/health
   - /api/auth/* → /api/v1/auth/* (tüm auth endpoint tablosu)

2) docs/08: msw/mock veya örnek HTTP path'lerinde /api/auth/* varsa /api/v1/auth/* yap.

3) mimari-kararlar.md Bölüm 18: [AUTH-OPEN-2] kapat.
   - Karar: email_verified_at = NULL iken tüm yazma eylemleri EmailVerifiedGuard ile engellenir (docs/07 §4).
   - [A-005] metnine supersede notu veya kısa güncelleme ekle.

Kural: docs kazanır; yeni endpoint uydurma.
Özet: hangi dosyalar güncellendi.
```

---

## P1 — Skill hijyeni

**Chat adı:** `P1 — Skill hygiene DnD`  
**Branch:** `chore/skill-hygiene-dnd`

```
@.cursor/skills/phase-creator/docs-map.md @.cursor/skills/rules-architect/SKILL.md @.cursor/skills/rules-architect/reference.md @.cursor/skills/phase-controller/SKILL.md @.cursor/skills/phase-controller/verification-matrix.md @.cursor/skills/phase-controller/reference.md @.cursor/rules/45-write-architectural-decision.mdc

Görev: .cursor/skills/ Lean/FastAPI/KTİ kalıntılarını DnD'ye uyumla. Uygulama kodu yok.

1) .cursor/skills/add-process-type/ klasörünü sil (bu projede yok).

2) phase-creator/docs-map.md:
   - Docs/ → docs/
   - FastAPI, SQLAlchemy, lean-design-system, docs/processes/, docs/adr/ → NestJS, Prisma, mimari-kararlar.md

3) rules-architect/SKILL.md + reference.md: DnD docs yapısına uyum

4) phase-controller/*: Docs/11_UAT.md → kaldır veya "MVP'de yok, opsiyonel"; Docs/ → docs/

5) 45-write-architectural-decision.mdc ile çelişen docs/adr talimatı kalmasın.

Yapma: apps/ kodu, faz .mdc yeniden yazımı, P0 dışı docs spec değişikliği.
Özet tablo: dosya → değişiklik.
```

---

## P2 — Meta + roadmap pointer (opsiyonel)

**Chat adı:** `P2 — Router meta sync`  
**Branch:** `docs/agent-meta-sync`

```
@CLAUDE.md @.cursor/rules/00-project-identity.mdc @docs/10_IMPLEMENTATION_ROADMAP.md

Görev: Agent yönlendirici meta — kod yok.

1) 00-project-identity.mdc: "49 kural" → güncel .mdc sayısı veya doğru ifade.

2) CLAUDE.md: .mdc sayısı güncel; phase-controller çıktısı *-fix.mdc (fix-reports varsayılan yok).

3) docs/10 Bölüm 8: Faz 1–3 tablolarına @50-phase-01, @51-phase-02, @52-phase-03 + 48-git-phase-branch pointer.

Minimal diff.
```

---

# FAZ 1 — Auth & Altyapı

## 1.1 — Monorepo + Docker + CI

**Chat adı:** `Faz 1 — İterasyon 1`  
**Branch:** `chore/monorepo-scaffold-ci`  
**Önkoşul:** P0 (önerilir)

```
@50-phase-01-auth-infra @48-git-phase-branch @docs/10_IMPLEMENTATION_ROADMAP.md @docs/09_DEV_WORKFLOW.md

Faz 1 — İterasyon 1: Monorepo scaffold + Docker Compose + CI

48-git-phase-branch: main → chore/monorepo-scaffold-ci

Yalnızca 50-phase-01 İterasyon 1 blueprint. Plan modu yok.

Teslim: pnpm monorepo (apps/api, apps/web, packages/shared), TS, ESLint, Prettier, Husky, docker-compose Postgres16+Redis7, .env.example, GitHub Actions CI, minimal api/web shell.

Yok: Prisma, auth, auth UI.

Stop: docker compose up -d; pnpm install; lint typecheck test build yeşil.
PR özeti + test planı. main merge yok.
```

---

## 1.2 — Backend core + Prisma + shared + seed

**Chat adı:** `Faz 1 — İterasyon 2`  
**Branch:** `feat/prisma-users-shared-seed`  
**Önkoşul:** 1.1 merge

```
@50-phase-01-auth-infra @48-git-phase-branch @docs/02_DATABASE_SCHEMA.md @docs/04_BACKEND_SPEC.md @docs/03_API_CONTRACTS.md

Faz 1 — İterasyon 2: Backend core + Prisma + shared + seed

Branch: feat/prisma-users-shared-seed

Yalnızca İterasyon 2. API prefix /api/v1.

Teslim: NestJS bootstrap, global filter/pipe, Pino, request ID, Prisma users+refresh_tokens, packages/shared enums+auth Zod, idempotent admin seed, GET /api/v1/health.

Yok: auth endpoints, auth FE.

Stop: prisma migrate dev + seed; curl health 200; lint typecheck test yeşil.
```

---

## 1.3 — Auth backend + integration testler

**Chat adı:** `Faz 1 — İterasyon 3`  
**Branch:** `feat/auth-backend-endpoints`  
**Önkoşul:** 1.2 merge

```
@50-phase-01-auth-infra @48-git-phase-branch @40-add-new-endpoint @43-add-authorization-policy @docs/03_API_CONTRACTS.md @docs/07_SECURITY_IMPLEMENTATION.md @docs/08_TESTING_STRATEGY.md

Faz 1 — İterasyon 3: Auth backend + integration testler

Branch: feat/auth-backend-endpoints

Yalnızca İterasyon 3. EmailService stub; rate limit İterasyon 5.

Teslim: 8 auth endpoint, JWT, refresh rotation+reuse, JwtAuthGuard, EmailVerifiedGuard, integration testler (auth ≥%95).

Güvenlik: password_hash response yok; "Invalid email or password"; refresh httpOnly cookie.

Stop: pnpm --filter api test -- --ci --coverage; lint typecheck test yeşil.
```

---

## 1.4 — Auth frontend

**Chat adı:** `Faz 1 — İterasyon 4`  
**Branch:** `feat/auth-frontend-pages`  
**Önkoşul:** 1.3 merge

```
@50-phase-01-auth-infra @48-git-phase-branch @41-add-new-screen @docs/05_FRONTEND_SPEC.md @docs/06_SCREEN_CATALOG.md @docs/07_SECURITY_IMPLEMENTATION.md

Faz 1 — İterasyon 4: Auth frontend

Branch: feat/auth-frontend-pages

Yalnızca İterasyon 4.

Teslim: S-LOGIN, S-REGISTER, S-VERIFY-EMAIL, S-PW-RESET-REQ, S-PW-RESET-CONF, S-SESSION-EXPIRED; authSlice; baseApi reauth; ProtectedRoute/PublicOnlyRoute; shadcn temel; dashboard placeholder.

Yok: localStorage token; campaign/character.

Stop: api+web dev manuel login; Vitest guard/form; lint typecheck test yeşil.
```

---

## 1.5 — Rate limit + EmailService

**Chat adı:** `Faz 1 — İterasyon 5`  
**Branch:** `feat/auth-rate-limit-email`  
**Önkoşul:** 1.4 merge

```
@50-phase-01-auth-infra @48-git-phase-branch @docs/07_SECURITY_IMPLEMENTATION.md @docs/04_BACKEND_SPEC.md @docs/08_TESTING_STRATEGY.md

Faz 1 — İterasyon 5: Rate limiting + EmailService + test tamamlama

Branch: feat/auth-rate-limit-email

Yalnızca İterasyon 5.

Teslim: Redis rate limit login/register/password-reset 5/15dk/IP; gerçek SMTP EmailService; auth integration matrisi tam.

Stop: rate limit + email testleri; pnpm test yeşil.
```

---

## 1.6 — Stabilizasyon

**Chat adı:** `Faz 1 — İterasyon 6`  
**Branch:** `fix/faz1-ci-stabilization`  
**Önkoşul:** 1.5 merge

```
@50-phase-01-auth-infra @48-git-phase-branch @docs/10_IMPLEMENTATION_ROADMAP.md

Faz 1 — İterasyon 6: Stabilizasyon (opsiyonel)

Branch: fix/faz1-ci-stabilization

CI fix, coverage gap, docs/10 Faz 1 çıktı kriterleri. Yeni feature yok.

Stop: full CI yeşil; Faz 1 checklist tamam.
```

---

## G1 — Faz 1 gap audit

**Chat adı:** `G1 — Faz 1 phase-controller`

```
@phase-controller @50-phase-01-auth-infra @docs/10_IMPLEMENTATION_ROADMAP.md

phase-controller — read-only audit. Faz 1. Branch: main (veya son faz branch).

Çıktı: .cursor/rules/50-phase-01-auth-infra-fix.mdc (onay sonrası).
Docs/fix-reports/ yok.

BLOCKER/HIGH özet + fix chat önerileri.
```

**Fix chat kalıbı:**

```
@50-phase-01-auth-infra-fix @48-git-phase-branch

Faz 1 fix — [BULGU_ADI]

Yalnızca fix.mdc maddeleri. Yeni feature yok.
Branch: fix/faz1-[kisa-ad]
```

---

## H1 — İnsan gate Faz 1 (sen — agent değil)

- [ ] Register → verify → login → refresh → logout manuel
- [ ] CI yeşil
- [ ] docs/10 Faz 1 çıktı kriterleri
- [ ] G1 fix PR'ları merge
- [ ] Sonraki: Faz 2.1 ve/veya Faz 3.1

---

# FAZ 2 — Campaign & Character

**Önkoşul:** Faz 1 H1 tamam. Faz 3 ile paralel yapılabilir.

## 2.1 — Prisma genişletme

**Chat adı:** `Faz 2 — İterasyon 1`  
**Branch:** `feat/faz2-prisma-campaign-character`

```
@51-phase-02-campaign-character @48-git-phase-branch @42-add-prisma-migration @docs/02_DATABASE_SCHEMA.md @docs/01_DOMAIN_MODEL.md

Faz 2 — İterasyon 1: Prisma campaign/character schema

Branch: feat/faz2-prisma-campaign-character

Yalnızca İterasyon 1 blueprint. Plan modu yok.

Teslim: campaigns, campaign_members, characters, dm_notes migration; shared character/campaign Zod.

Yok: campaign/character API, FE.

Stop: prisma migrate dev; seed uyumlu; lint typecheck test yeşil.
```

---

## 2.2 — Campaign backend

**Chat adı:** `Faz 2 — İterasyon 2`  
**Branch:** `feat/faz2-campaign-backend`

```
@51-phase-02-campaign-character @48-git-phase-branch @40-add-new-endpoint @43-add-authorization-policy @docs/03_API_CONTRACTS.md @docs/07_SECURITY_IMPLEMENTATION.md @docs/08_TESTING_STRATEGY.md

Faz 2 — İterasyon 2: Campaign backend

Branch: feat/faz2-campaign-backend

Yalnızca İterasyon 2. campaign.policy + campaigns.auth.spec.ts zorunlu.

Teslim: Campaign CRUD, invite regenerate/disable, join token, members; yetkisiz → 404.

Stop: campaign integration testler yeşil; lint typecheck test.
```

---

## 2.3 — Character backend

**Chat adı:** `Faz 2 — İterasyon 3`  
**Branch:** `feat/faz2-character-backend`

```
@51-phase-02-campaign-character @48-git-phase-branch @40-add-new-endpoint @43-add-authorization-policy @docs/03_API_CONTRACTS.md @docs/08_TESTING_STRATEGY.md

Faz 2 — İterasyon 3: Character backend

Branch: feat/faz2-character-backend

Yalnızca İterasyon 3. character.policy + characters.auth.spec.ts.

Teslim: Character CRUD, campaign atama, visibility PUBLIC/PRIVATE, live fields PATCH (WS Faz 4).

Stop: character auth matrix testleri yeşil.
```

---

## 2.4 — DM Notes backend

**Chat adı:** `Faz 2 — İterasyon 4`  
**Branch:** `feat/faz2-dm-notes-backend`

```
@51-phase-02-campaign-character @48-git-phase-branch @40-add-new-endpoint @43-add-authorization-policy @docs/03_API_CONTRACTS.md

Faz 2 — İterasyon 4: DM Notes backend

Branch: feat/faz2-dm-notes-backend

Yalnızca İterasyon 4. DM-only yazma; üye read.

Teslim: dm-notes CRUD + sıralama; policy + integration test.

Stop: dm-notes testleri yeşil.
```

---

## 2.5 — Campaign frontend

**Chat adı:** `Faz 2 — İterasyon 5`  
**Branch:** `feat/faz2-campaign-frontend`

```
@51-phase-02-campaign-character @48-git-phase-branch @41-add-new-screen @docs/05_FRONTEND_SPEC.md @docs/06_SCREEN_CATALOG.md

Faz 2 — İterasyon 5: Campaign frontend

Branch: feat/faz2-campaign-frontend

Yalnızca İterasyon 5.

Teslim: S-CAMP-LIST, S-CAMP-NEW, S-CAMP-DETAIL, S-CAMP-EDIT, invite link manager; RTK Query campaignsApi.

Stop: manuel campaign oluştur+davet; Vitest; lint typecheck test.
```

---

## 2.6 — Character builder

**Chat adı:** `Faz 2 — İterasyon 6`  
**Branch:** `feat/faz2-character-builder`

```
@51-phase-02-campaign-character @48-git-phase-branch @41-add-new-screen @22-frontend-forms @docs/05_FRONTEND_SPEC.md @docs/06_SCREEN_CATALOG.md

Faz 2 — İterasyon 6: Character builder

Branch: feat/faz2-character-builder

Yalnızca İterasyon 6.

Teslim: S-CHAR-BUILDER çok tablı form, auto-save, POST→PATCH.

Yok: campaign atama UI, visibility toggle (2.7).

Stop: builder kayıt/yükleme manuel; form validation testleri.
```

---

## 2.7 — Character list/detail/edit + campaign atama

**Chat adı:** `Faz 2 — İterasyon 7`  
**Branch:** `feat/faz2-character-pages`

```
@51-phase-02-campaign-character @48-git-phase-branch @41-add-new-screen @docs/06_SCREEN_CATALOG.md @docs/05_FRONTEND_SPEC.md

Faz 2 — İterasyon 7: Character list/detail/edit + campaign atama

Branch: feat/faz2-character-pages

Yalnızca İterasyon 7.

Teslim: S-CHAR-LIST, S-CHAR-DETAIL, S-CHAR-EDIT; campaign atama; visibility; /edit → /builder redirect.

Stop: uçtan uca karakter+campaign atama manuel.
```

---

## 2.8 — Stabilizasyon

**Chat adı:** `Faz 2 — İterasyon 8`  
**Branch:** `fix/faz2-auth-matrix-stabilization`

```
@51-phase-02-campaign-character @48-git-phase-branch @docs/08_TESTING_STRATEGY.md @docs/10_IMPLEMENTATION_ROADMAP.md

Faz 2 — İterasyon 8: Stabilizasyon

Branch: fix/faz2-auth-matrix-stabilization

AUTH-007 campaign+character matrisi tamamlama, CI fix. Yeni feature yok.

Stop: docs/10 Faz 2 çıktı kriterleri; CI yeşil.
```

---

## G2 — Faz 2 gap audit

```
@phase-controller @51-phase-02-campaign-character @docs/10_IMPLEMENTATION_ROADMAP.md

phase-controller read-only. Faz 2. Branch: main.

Çıktı: 51-phase-02-campaign-character-fix.mdc (onay sonrası).
```

---

## H2 — İnsan gate Faz 2

- [ ] DM campaign + invite + player join
- [ ] Character builder + campaign atama
- [ ] Yetki test matrisi yeşil
- [ ] G2 fix merge

---

# FAZ 3 — Homebrew, Collection, Reference

**Önkoşul:** Faz 1 H1. Faz 2 ile paralel.

## 3.1 — Prisma + seed iskelet

**Chat adı:** `Faz 3 — İterasyon 1`  
**Branch:** `feat/faz3-prisma-homebrew-seed-skeleton`

```
@52-phase-03-homebrew-reference @48-git-phase-branch @42-add-prisma-migration @docs/02_DATABASE_SCHEMA.md @docs/01_DOMAIN_MODEL.md

Faz 3 — İterasyon 1: Prisma homebrew + seed iskelet

Branch: feat/faz3-prisma-homebrew-seed-skeleton

Yalnızca İterasyon 1.

Teslim: homebrew_items, collection_items; shared homebrew Zod şemaları; seed iskelet.

Stop: migrate dev; lint typecheck test.
```

---

## 3.2 — Homebrew backend

**Chat adı:** `Faz 3 — İterasyon 2`  
**Branch:** `feat/faz3-homebrew-backend`

```
@52-phase-03-homebrew-reference @48-git-phase-branch @40-add-new-endpoint @43-add-authorization-policy @docs/03_API_CONTRACTS.md @docs/08_TESTING_STRATEGY.md

Faz 3 — İterasyon 2: Homebrew backend

Branch: feat/faz3-homebrew-backend

Yalnızca İterasyon 2. homebrew.policy + homebrew.auth.spec.ts.

Teslim: CRUD, publish/unpublish, JSONB Zod validation, galeri read published.

Stop: homebrew integration testler yeşil.
```

---

## 3.3 — Collection + Reference backend

**Chat adı:** `Faz 3 — İterasyon 3`  
**Branch:** `feat/faz3-collection-reference-backend`

```
@52-phase-03-homebrew-reference @48-git-phase-branch @40-add-new-endpoint @docs/03_API_CONTRACTS.md @docs/08_TESTING_STRATEGY.md

Faz 3 — İterasyon 3: Collection + Reference backend

Branch: feat/faz3-collection-reference-backend

Yalnızca İterasyon 3.

Teslim: collections CRUD; reference/* read-only; collection.auth + reference testleri.

Stop: testler yeşil.
```

---

## 3.4 — Homebrew frontend

**Chat adı:** `Faz 3 — İterasyon 4`  
**Branch:** `feat/faz3-homebrew-frontend`

```
@52-phase-03-homebrew-reference @48-git-phase-branch @41-add-new-screen @docs/06_SCREEN_CATALOG.md @docs/05_FRONTEND_SPEC.md

Faz 3 — İterasyon 4: Homebrew frontend

Branch: feat/faz3-homebrew-frontend

Yalnızca İterasyon 4.

Teslim: galeri, detay, create/edit, My Creations, publish toggle.

Stop: misafir galeri read; verified user create manuel.
```

---

## 3.5 — Collection + Reference frontend

**Chat adı:** `Faz 3 — İterasyon 5`  
**Branch:** `feat/faz3-collection-reference-frontend`

```
@52-phase-03-homebrew-reference @48-git-phase-branch @41-add-new-screen @docs/06_SCREEN_CATALOG.md

Faz 3 — İterasyon 5: Collection + Reference frontend

Branch: feat/faz3-collection-reference-frontend

Yalnızca İterasyon 5.

Teslim: My Collection; reference spells/monsters/items sayfaları (read-only).

Stop: koleksiyon ekle/çıkar manuel.
```

---

## 3.6 — 5e seed data

**Chat adı:** `Faz 3 — İterasyon 6`  
**Branch:** `feat/faz3-official-5e-seed-data`

```
@52-phase-03-homebrew-reference @48-git-phase-branch @docs/01_DOMAIN_MODEL.md @docs/02_DATABASE_SCHEMA.md @docs/10_IMPLEMENTATION_ROADMAP.md

Faz 3 — İterasyon 6: 5e seed data

Branch: feat/faz3-official-5e-seed-data

Yalnızca İterasyon 6.

Teslim: resmi 5e referans JSON seed; idempotent prisma seed; source=OFFICIAL.

Stop: seed tekrar çalıştırma hatasız; reference API dolu.
```

---

## 3.7 — Stabilizasyon

**Chat adı:** `Faz 3 — İterasyon 7`  
**Branch:** `fix/faz3-stabilization`

```
@52-phase-03-homebrew-reference @48-git-phase-branch @docs/10_IMPLEMENTATION_ROADMAP.md

Faz 3 — İterasyon 7: Stabilizasyon

Branch: fix/faz3-stabilization

CI, arama/filtre bug fix. Yeni feature yok.

Stop: Faz 3 çıktı kriterleri; CI yeşil.
```

---

## G3 — Faz 3 gap audit

```
@phase-controller @52-phase-03-homebrew-reference @docs/10_IMPLEMENTATION_ROADMAP.md

phase-controller read-only. Faz 3.

Çıktı: 52-phase-03-homebrew-reference-fix.mdc (onay sonrası).
```

---

## H3 — İnsan gate Faz 3

- [ ] Homebrew draft/publish + galeri (misafir)
- [ ] Collection + reference browse
- [ ] 5e seed yüklü
- [ ] G3 fix merge

---

# FAZ 4 — DM Screen, WS, Admin

**Önkoşul:** Faz 2 H2 + Faz 3 H3.

## 4.1 — WebSocket + live PATCH

**Chat adı:** `Faz 4 — İterasyon 1`  
**Branch:** `feat/faz4-ws-gateway-live`

```
@53-phase-04-dm-screen-admin @48-git-phase-branch @47-websocket-live-fields @16-backend-websocket @docs/03_API_CONTRACTS.md @docs/04_BACKEND_SPEC.md

Faz 4 — İterasyon 1: WebSocket gateway + live PATCH

Branch: feat/faz4-ws-gateway-live

Yalnızca İterasyon 1. Redis WS adapter.

Teslim: join-campaign room auth; PATCH live fields; live-fields-updated broadcast.

Stop: gateway smoke; live PATCH integration (tam matris 4.6).
```

---

## 4.2 — DM Screen frontend

**Chat adı:** `Faz 4 — İterasyon 2`  
**Branch:** `feat/faz4-dm-screen-frontend`

```
@53-phase-04-dm-screen-admin @48-git-phase-branch @41-add-new-screen @docs/06_SCREEN_CATALOG.md @docs/05_FRONTEND_SPEC.md

Faz 4 — İterasyon 2: DM Screen frontend

Branch: feat/faz4-dm-screen-frontend

Yalnızca İterasyon 2.

Teslim: S-DM-SCREEN; useWebSocket; live HP/conditions/death saves; DM notes panel.

Stop: iki tarayıcıda live sync manuel.
```

---

## 4.3 — Admin backend + audit

**Chat adı:** `Faz 4 — İterasyon 3`  
**Branch:** `feat/faz4-admin-backend`

```
@53-phase-04-dm-screen-admin @48-git-phase-branch @17-backend-admin-audit @40-add-new-endpoint @docs/03_API_CONTRACTS.md @docs/02_DATABASE_SCHEMA.md

Faz 4 — İterasyon 3: Admin backend + audit

Branch: feat/faz4-admin-backend

Yalnızca İterasyon 3. audit_logs INSERT-only.

Teslim: admin users/campaigns/characters/homebrew endpoints; RolesGuard ADMIN; audit append.

Stop: admin.auth.spec başlangıç; lint typecheck test.
```

---

## 4.4 — Admin frontend

**Chat adı:** `Faz 4 — İterasyon 4`  
**Branch:** `feat/faz4-admin-frontend`

```
@53-phase-04-dm-screen-admin @48-git-phase-branch @41-add-new-screen @docs/06_SCREEN_CATALOG.md @docs/05_FRONTEND_SPEC.md

Faz 4 — İterasyon 4: Admin frontend

Branch: feat/faz4-admin-frontend

Yalnızca İterasyon 4.

Teslim: admin layout; user/campaign/character/homebrew yönetim ekranları; ADMIN-only routes.

Stop: admin login ile CRUD manuel.
```

---

## 4.5 — Deaktivasyon filtreleri + LAST_ADMIN

**Chat adı:** `Faz 4 — İterasyon 5`  
**Branch:** `feat/faz4-deactivate-filters`

```
@53-phase-04-dm-screen-admin @48-git-phase-branch @17-backend-admin-audit @43-add-authorization-policy @docs/07_SECURITY_IMPLEMENTATION.md

Faz 4 — İterasyon 5: Deaktivasyon filtreleri + LAST_ADMIN

Branch: feat/faz4-deactivate-filters

Yalnızca İterasyon 5.

Teslim: deaktive user içerik gizleme; admin deactivate/reactivate; LAST_ADMIN 422.

Stop: policy unit + ilgili integration testler.
```

---

## 4.6 — WS + admin integration tests

**Chat adı:** `Faz 4 — İterasyon 6`  
**Branch:** `test/faz4-ws-admin-auth`

```
@53-phase-04-dm-screen-admin @48-git-phase-branch @docs/08_TESTING_STRATEGY.md @35-testing

Faz 4 — İterasyon 6: WS + admin integration tests

Branch: test/faz4-ws-admin-auth

Yalnızca İterasyon 6.

Teslim: docs/08 §5.5–5.7 matrisi; WS join yetki; audit INSERT doğrulama.

Stop: pnpm --filter api test -- --ci yeşil.
```

---

## 4.7 — Stabilizasyon

**Chat adı:** `Faz 4 — İterasyon 7`  
**Branch:** `fix/faz4-stabilization`

```
@53-phase-04-dm-screen-admin @48-git-phase-branch @docs/10_IMPLEMENTATION_ROADMAP.md

Faz 4 — İterasyon 7: Stabilizasyon

Branch: fix/faz4-stabilization

CI fix, WS edge cases. Yeni feature yok.

Stop: Faz 4 çıktı kriterleri; CI yeşil.
```

---

## G4 — Faz 4 gap audit

```
@phase-controller @53-phase-04-dm-screen-admin @docs/10_IMPLEMENTATION_ROADMAP.md

phase-controller read-only. Faz 4.

Çıktı: 53-phase-04-dm-screen-admin-fix.mdc (onay sonrası).
```

---

## H4 — İnsan gate Faz 4

- [ ] DM Screen live sync
- [ ] Admin panel 4 kaynak tipi
- [ ] Deaktivasyon + LAST_ADMIN
- [ ] G4 fix merge

---

# FAZ 5 — Upload, Profil, Production

**Önkoşul:** Faz 4 H4. `[INF-OPEN-1]` kapanmadan cloud deploy yok.

## 5.1 — Upload presign + resize

**Chat adı:** `Faz 5 — İterasyon 1`  
**Branch:** `feat/faz5-upload-presign`

```
@54-phase-05-upload-production @48-git-phase-branch @40-add-new-endpoint @docs/03_API_CONTRACTS.md @docs/07_SECURITY_IMPLEMENTATION.md

Faz 5 — İterasyon 1: Upload presign + resize flow

Branch: feat/faz5-upload-presign

Yalnızca İterasyon 1. SVG yasak; png/jpeg/webp max 5MB.

Teslim: POST presign; client resize; avatar/portrait/banner/homebrew purpose.

Stop: upload flow manuel; MIME testleri.
```

---

## 5.2 — Profil sayfası

**Chat adı:** `Faz 5 — İterasyon 2`  
**Branch:** `feat/faz5-profile`

```
@54-phase-05-upload-production @48-git-phase-branch @41-add-new-screen @docs/06_SCREEN_CATALOG.md @docs/03_API_CONTRACTS.md

Faz 5 — İterasyon 2: Profil sayfası

Branch: feat/faz5-profile

Yalnızca İterasyon 2. DangerZone yok (5.5).

Teslim: S-PROFILE; PATCH me; password change; avatar; users.auth.spec me matrisi.

Stop: profil güncelleme manuel.
```

---

## 5.3 — Hata sayfaları + Sentry

**Chat adı:** `Faz 5 — İterasyon 3`  
**Branch:** `feat/faz5-errors-sentry`

```
@54-phase-05-upload-production @48-git-phase-branch @docs/06_SCREEN_CATALOG.md @docs/04_BACKEND_SPEC.md @docs/09_DEV_WORKFLOW.md

Faz 5 — İterasyon 3: Hata sayfaları + Sentry

Branch: feat/faz5-errors-sentry

Yalnızca İterasyon 3.

Teslim: S-404, S-500; Sentry BE+FE; SENTRY_DSN env; PII scrub.

Stop: error boundary + Sentry test event (dev).
```

---

## 5.4 — Production Dockerfile + kalite

**Chat adı:** `Faz 5 — İterasyon 4`  
**Branch:** `chore/faz5-docker-production`

```
@54-phase-05-upload-production @48-git-phase-branch @30-infrastructure @docs/09_DEV_WORKFLOW.md @docs/10_IMPLEMENTATION_ROADMAP.md

Faz 5 — İterasyon 4: Production Dockerfile + kalite geçişi

Branch: chore/faz5-docker-production

Yalnızca İterasyon 4. Platform-specific deploy config YOK ([INF-OPEN-1]).

Teslim: multi-stage Dockerfile; FE build + API; docker build çalışır; full CI yeşil.

Stop: docker build; pnpm lint typecheck test build.
```

---

## 5.5 — Self-service deaktivasyon

**Chat adı:** `Faz 5 — İterasyon 5`  
**Branch:** `feat/faz5-self-deactivate`

```
@54-phase-05-upload-production @48-git-phase-branch @docs/03_API_CONTRACTS.md @docs/07_SECURITY_IMPLEMENTATION.md @docs/08_TESTING_STRATEGY.md

Faz 5 — İterasyon 5: Self-service deaktivasyon + testler

Branch: feat/faz5-self-deactivate

Yalnızca İterasyon 5.

Teslim: PATCH deactivate; S-PROFILE DangerZone+modal; login reddi; users.auth.spec deactivate matrisi.

Stop: deactivate integration testler yeşil.
```

---

## 5.6 — Stabilizasyon + deployment hazırlık

**Chat adı:** `Faz 5 — İterasyon 6`  
**Branch:** `fix/faz5-stabilization`

```
@54-phase-05-upload-production @48-git-phase-branch @docs/10_IMPLEMENTATION_ROADMAP.md @docs/09_DEV_WORKFLOW.md

Faz 5 — İterasyon 6: Stabilizasyon + deployment hazırlık

Branch: fix/faz5-stabilization

MVP son düzeltmeler; .env.example tam; açık karar varsayımı yok.

Stop: Faz 5 çıktı kriterleri; full CI yeşil.
```

---

## G5 — Faz 5 / MVP gap audit

```
@phase-controller @54-phase-05-upload-production @docs/10_IMPLEMENTATION_ROADMAP.md @docs/00_PROJECT_OVERVIEW.md

phase-controller read-only. Faz 5 / MVP tamamlama.

Çıktı: 54-phase-05-upload-production-fix.mdc (onay sonrası).
```

---

## H5 — İnsan gate MVP (sen)

- [ ] docs/00 Bölüm 10 başarı kriterleri
- [ ] docs/10 Bölüm 9 Human Gate tam checklist
- [ ] `[INF-OPEN-1]` deployment kararı (deploy öncesi)
- [ ] `[INF-OPEN-3]` backup/PITR (canlı öncesi)
- [ ] G5 fix merge
- [ ] Production deploy — **manuel onay** (agent deploy etmez)

---

# Genel fix chat kalıbı (tüm fazlar)

```
@[NN]-phase-[XX]-[slug]-fix @48-git-phase-branch

Faz [N] fix — [BULGU_KISA_ADI]

Yalnızca fix.mdc maddelerini kapat. Scope dışı feature yok.
Branch: fix/faz[N]-[kisa-ad]

Stop: ilgili testler + CI yeşil.
```

---

# Notlar

- Her iterasyonun tam blueprint'i: `.cursor/rules/5x-phase-*.mdc` ilgili **İterasyon M** bölümü.
- `@` ile yalnızca prompt'taki dosyaları attach et.
- Paralel: Faz 2 ve Faz 3 ayrı chat zincirleri; Faz 4 öncesi ikisi de H gate geçmeli.
