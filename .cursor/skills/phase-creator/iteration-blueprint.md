# İterasyon Blueprint — Uygulama Hazır Plan Şablonu

Bu dosya her faz `.mdc` içindeki **tek bir iterasyonun** zorunlu yapısıdır. Amaç: geliştirici agent'ın **Plan moduna geçmeden** aynı netlikte çalışması; spec `docs/` içinde kalır, iterasyon **ne yapılacağını** ve **hangi doc bölümünün neden okunacağını** taşır.

**Altın kural:** Spec detayı kopyalanmaz → `docs/<dosya>` §bölüm + uygulama notu. İterasyon, doc'u okumadan kod yazılamayacak kadar somut olmalı.

---

## Context window disiplini

Her iterasyon **tek chat / tek PR** içinde bitmeli. Aşağıdakilerden biri varsa iterasyonu böl:

| Sinyal | Eylem |
| ------ | ----- |
| 8+ dosya oluştur/güncelle | Alt iterasyona böl |
| 2+ katman (ör. API + FE) aynı iterasyonda | Katman başına iterasyon (istisna: net dikey dilim ve ≤6 dosya) |
| 4+ farklı `docs/` dosyasından bağımsız domain | Böl veya docs güncellemesini önceki iterasyona al |
| Integration + unit + migration + IaC aynı anda | En fazla 2 tür iş bir iterasyonda |
| Stop checklist 10+ madde | İşi küçült |

**Hedef boyut:** 3–8 uygulama adımı; 4–12 dosya; agent yalnızca **Docs okuma sırası**ndaki bölümleri okur — tüm spec değil.

---

## Zorunlu iterasyon iskeleti

Her iterasyon aşağıdaki bölümlerin **tamamını** içerir. Eksik bölüm = iterasyon tamamlanmamış sayılır.

````markdown
### İterasyon N — <2–5 kelime özet>

**Hedef:** <ölçülebilir tek cümle — merge sonrası ne değişmiş olacak>

**Teslim çıktısı:**
- <somut artefakt: dosya, endpoint, migration, workflow, test suite>

**Önkoşullar:**
- [ ] İterasyon N-1 Stop tamam
- [ ] <DB migration, env, branch vb.>

**Docs okuma sırası:** (yalnızca bunları oku — sırayla)
1. `docs/10_IMPLEMENTATION_ROADMAP.md` §<N.M> — iterasyon kapsamı
2. `docs/03_API_CONTRACTS.md` §<x> — <neden: request/response/error>
3. `docs/07_SECURITY_IMPLEMENTATION.md` §<y> — <neden: guard, audit, rate limit>
4. …

**Uygulama planı:**
1. <İlk adım — hangi dosyada ne pattern>
2. <İkinci adım — bağımlılık sırası>
3. …
4. Test ve doğrulama adımı

**Dosya kapsamı:**

| İşlem | Path |
| ----- | ---- |
| Oluştur | `apps/api/...` |
| Güncelle | `packages/shared/...` |
| Dokunma | `…` (sonraki iterasyon / başka faz) |

**Spec → kod eşlemesi:**

| Gereksinim | Docs referansı | Uygulama notu |
| ---------- | -------------- | ------------- |
| Login 401 pasif kullanıcı | `docs/03` §2.1 | `is_active=false` → `UNAUTHORIZED` |
| Audit aynı transaction | `docs/07` §9 | `AuditService` commit öncesi |
| … | … | … |

**Kalite kapıları:** (`docs/08_TESTING_STRATEGY.md` + ilgili glob rule)
- [ ] Pozitif senaryo testi
- [ ] En az bir deny testi (RBAC / validation / parse hatası)
- [ ] `pnpm lint` + `pnpm typecheck` + ilgili test yeşil
- [ ] Coverage: <modül> ≥<% hedef from 04-quality-gates>

**Bu iterasyonda yok:**
- <scope creep önleme — özellikle sonraki iterasyon / faz>

**Risk / dikkat:**
- <bilinen edge case, sık yapılan hata, doc-kod boşluğu uyarısı>

**Stop:**
- [ ] <komut veya smoke adımı>
- [ ] <test komutu>
- [ ] PR/onay → İterasyon N+1
````

Son iterasyonda Stop son satırı: `Faz N Done Definition; roadmap işareti.`

---

## Docs referans formatı

Tutarlı ve tıklanabilir:

```
`docs/<DOSYA>.md` §<numara veya başlık> — <1 cümle: bu iterasyonda neden okunur>
```

Örnekler:
- `` `docs/03_API_CONTRACTS.md` §2 Auth — login/refresh/logout contract ve error code'lar ``
- `` `docs/06_SCREEN_CATALOG.md` — S-USER-LIST, S-USER-EDIT (permission + form state) ``
- `` `docs/02_DATABASE_SCHEMA.md` — users tablosu, index ve FK isimleri ``

**Yasak:** `docs/03'ü oku`, `API spec`, `backend spec` (path/bölüm yok).

**Zorunlu:** Her uygulama planı maddesi en az bir Docs referansına bağlanır veya "mevcut pattern" için `` `docs/04` §X `` gösterilir.

---

## Uygulama planı yazım kuralları

Plan modu kalitesi için her madde:

1. **Fiil + nesne + konum** — "Auth router'da `POST /auth/login` ekle (`apps/api/routers/auth.py`)"
2. **Pattern kaynağı** — "Mevcut `campaigns` controller guard + policy pattern'i (`docs/04` §5)"
3. **Sıra** — migration → model → service → router → test
4. **Doğrulama gömülü** — son maddeler test komutu içerir

**İyi madde:** `audit_logs` INSERT — admin eylemlerinde append-only (`docs/07`); önce `audit.service.spec.ts` unit test.

**Kötü madde:** `Auth'u implement et.`

---

## Spec → kod eşlemesi tablosu

Docs'taki her kritik gereksinim için bir satır. Kopyalama değil — **pointer + uygulama kararı**.

| Ne zaman satır ekle | Örnek |
| ------------------- | ----- |
| Endpoint | Method, path, RBAC, error code |
| Ekran | `S-*` ID, route, permission |
| Tablo/migration | Tablo adı, enum, index |
| Güvenlik | Rate limit, audit event_type, secret handling |
| Test | Deny senaryosu, coverage hedefi |

Boş tablo yalnızca saf scaffold/CI iterasyonlarında kabul edilir; o durumda **Kalite kapıları** yine dolu olmalı.

---

## Tam örnek (kısaltılmış — Auth endpoints)

```markdown
### İterasyon 3 — Auth Endpoints (1.3)

**Hedef:** `POST /api/v1/auth/login`, `POST /api/v1/auth/refresh`, `POST /api/v1/auth/logout` çalışır; integration test login→refresh→logout yeşil.

**Teslim çıktısı:**
- `apps/api/src/auth/` — controller, service, DTO
- `auth.controller.spec.ts` (integration)
- Refresh cookie httpOnly+Secure+SameSite

**Önkoşullar:**
- [ ] İterasyon 2 Stop (JWT + Argon2id unit testleri yeşil)
- [ ] `users` tablosu Prisma migration uygulanmış

**docs okuma sırası:**
1. `docs/10_IMPLEMENTATION_ROADMAP.md` §1.3 — kapsam ve Stop
2. `docs/03_API_CONTRACTS.md` §2 — request/response, cookie/header, error code
3. `docs/07_SECURITY_IMPLEMENTATION.md` §3 — JWT süreleri; §2 — rate limit auth endpoint
4. `docs/04_BACKEND_SPEC.md` §auth — controller + guard kalıbı
5. `docs/08_TESTING_STRATEGY.md` — auth integration test beklentisi

**Uygulama planı:**
1. `auth/dto/login.dto.ts` — `class-validator`; `docs/03` §2 alanları birebir
2. `auth/auth.service.ts` — Argon2id verify, token pair; deaktive kullanıcı reddi
3. `auth/auth.controller.ts` — üç endpoint; logout refresh revoke
4. Rate limit auth route'lara (`docs/07` §2)
5. `auth.controller.spec.ts` — pozitif akış + wrong password + inactive user deny

**Dosya kapsamı:**

| İşlem | Path |
| ----- | ---- |
| Oluştur | `auth/auth.controller.ts`, `auth/dto/*.dto.ts`, `auth/auth.service.ts`, `auth/auth.controller.spec.ts` |
| Güncelle | `auth/auth.module.ts` |
| Dokunma | User CRUD (İterasyon 4), password reset (sonraki iterasyon) |

**Spec → kod eşlemesi:**

| Gereksinim | docs referansı | Uygulama notu |
| ---------- | -------------- | ------------- |
| Login body email+password | `docs/03` §2.1 | `class-validator` `@IsEmail()` |
| Hatalı şifre | `docs/03` §2.1 | Genel mesaj; enumeration yok |
| Refresh rotation | `docs/03` §2.2 | Eski refresh geçersiz |
| Auth rate limit | `docs/07` §2 | 5 req/15 dk/IP |

**Kalite kapıları:**
- [ ] Integration: login→refresh→logout
- [ ] Deny: inactive user, bad password
- [ ] `pnpm --filter api test auth` yeşil
- [ ] Auth modülü coverage ≥%95 (`04-quality-gates`)

**Bu iterasyonda yok:** User CRUD, password reset, frontend RTK Query wiring

**Risk / dikkat:** `password_hash` response veya log'a sızmamalı (`docs/07`)

**Stop:**
- [ ] `pnpm --filter api test auth`
- [ ] `pnpm lint` + `pnpm typecheck`
- [ ] PR/onay → İterasyon 4
```

---

## İterasyon bölme karar ağacı

```
Faz kapsamı net mi?
├─ Hayır → önce docs/10 güncelle, sonra iterasyonları yaz
└─ Evet → katman sırası: altyapı → domain → API → UI → E2E
    └─ Her katman için:
        ├─ Tek sorumluluk (1 bounded context)
        ├─ Dosya kapsamı ≤12
        └─ docs okuma ≤5 dosya, her biri belirli §
            └─ Aşılıyorsa → İterasyon N.a / N.b veya N+1
```

---

## phase-creator doğrulama (iterasyon başına)

- [ ] 9 zorunlu bölüm dolu (Hedef … Stop)
- [ ] docs okuma sırası ≤5 dosya; her satırda § veya `S-*`
- [ ] Uygulama planı ≥3 somut adım
- [ ] Spec → kod tablosu ≥3 satır (veya scaffold istisnası belgelenmiş)
- [ ] Dosya kapsamı "Dokunma" dolu
- [ ] Stop'ta çalıştırılabilir komut var
- [ ] Plan moduna tekrar ihtiyaç bırakmıyor — agent doğrudan koda geçebilir
