# Docs Güncelleme Haritası — Phase Creator

Faz onayından sonra `docs/` güncellemelerinde **tek doğruluk kaynağı** bu haritadır. `docs/10_IMPLEMENTATION_ROADMAP.md` Bölüm 9 (Doküman Yaşam Döngüsü) ile uyumlu.

**Altın kural:** Kod/spec çelişkisi → önce `docs/` güncelle, sonra `.mdc` yaz. Spec `docs/` içinde kalır; `.mdc` iterasyonları **plan-modu kalitesinde uygulama adımları** + `docs/<dosya>.md` §pointer taşır ([iteration-blueprint.md](iteration-blueprint.md)).

---

## Çekirdek dokümanlar (numaralı)

| Dosya                                | Ne zaman güncelle                             | Tipik içerik                                    |
| ------------------------------------ | --------------------------------------------- | ----------------------------------------------- |
| `docs/00_PROJECT_OVERVIEW.md`        | MVP kapsamı / non-goal değişimi (nadir)       | In-scope / out-of-scope madde                   |
| `docs/01_DOMAIN_MODEL.md`            | Yeni entity, state machine, domain terim      | Entity diyagramı, geçiş tablosu                 |
| `docs/02_DATABASE_SCHEMA.md`         | Tablo/kolon/index/enum/migration              | Prisma model, migration, constraint             |
| `docs/03_API_CONTRACTS.md`           | Yeni/değişen endpoint                         | Request/response, error code                    |
| `docs/04_BACKEND_SPEC.md`            | Yeni servis pattern, guard, modül yapısı      | NestJS modül konvansiyonu                       |
| `docs/05_FRONTEND_SPEC.md`           | Route ağacı, global FE pattern, lib           | React Router, RTK Query, Tailwind + shadcn/ui   |
| `docs/06_SCREEN_CATALOG.md`          | Yeni ekran veya kritik UX değişikliği         | `S-*` ID, permission, state'ler                 |
| `docs/07_SECURITY_IMPLEMENTATION.md` | Auth, token, rate limit, yeni control         | Bölüm + threat model notu                       |
| `docs/08_TESTING_STRATEGY.md`        | Yeni test türü, coverage hedefi               | Jest/Vitest journey, risk seviyesi              |
| `docs/09_DEV_WORKFLOW.md`            | CI/CD, release, branch, agent kuralları       | Süreç değişikliği                               |
| `docs/10_IMPLEMENTATION_ROADMAP.md`  | **Her yeni/güncellenen faz**                  | Faz başlığı, §N.M alt maddeleri, durum          |

---

## Faz tipine göre minimum doküman seti

Aşağıdaki satırlar **minimum**; faz kapsamına göre ek satırlar ekle. Güncellenmeyen dosyaları taslakta **"Dokunulmaz"** olarak listele.

| Faz tipi               | Zorunlu docs                                       | Sık eklenen                       |
| ---------------------- | -------------------------------------------------- | --------------------------------- |
| **DB / schema**        | 02, 01 (entity), 10                                | 03 (DTO alanları)                 |
| **Backend API**        | 03, 02, 04, 07, 10                                 | 01, 08 (integration test)         |
| **Frontend ekran**     | 06, 05, 03 (read contract), 10                     | 07 (XSS/CSP notu)                 |
| **Full-stack feature** | 01, 02, 03, 05, 06, 10                             | 04, 07, 08                        |
| **Yetki / policy**     | 01, 03, 04, 06, 07, 10                             | 02 (yoksa permission tablosu yok) |
| **UI / component**     | 05, 06 (etkilenen), 10                             | shadcn/ui pattern notu            |
| **Infra / IaC**        | 10, 09                                             | `docs/mimari-kararlar.md`         |
| **WebSocket / live**   | 03, 04, 10                                         | 02, 07, 08                        |
| **Güvenlik sertleştirme** | 07, 08, 10                                      | 03, 09                            |
| **Performans**         | 08, 10, 04                                         | 02 (index)                        |

---

## Yardımcı / özel dosyalar

| Dosya                       | Ne zaman                                                                   |
| --------------------------- | -------------------------------------------------------------------------- |
| `docs/mimari-kararlar.md`   | Mimari karar, stack sapması, güvenlik modeli değişimi (`45-write-architectural-decision.mdc`) |
| `packages/shared/`          | Ortak enum, Zod şema, permission sabitleri — API/FE değişince senkron    |

**Mimari karar:** Ayrı `docs/adr/` klasörü **yok** — tüm kararlar `docs/mimari-kararlar.md` Bölüm 1–18 içinde `[KATEGORI-NNN]` ID ile kayıtlı.

---

## Güncelleme disiplini

1. **Önce oku:** İlgili dosyada mevcut bölümü `Grep` ile bul; aynı yapıda ekle (kopyala-yapıştır kalıbı).
2. **Screen Catalog:** `S-<DOMAIN>-<ACTION>` ID'si mevcut dosyada var mı kontrol et; yoksa tam bölüm ekle (route, permission, form, state'ler, **İngilizce** UI metinleri).
3. **API Contracts:** Endpoint başına request/response envelope + error code listesi.
4. **Roadmap:** `## 3. Faz Detayları` altında `### Faz N — …` + **§N.1…N.K** alt maddeleri; her alt madde bir `.mdc` iterasyonunun `Hedef` + `docs/10` referansına karşılık gelir.
5. **Tutarlılık:** Aynı terim tüm dosyalarda aynı (enum, permission, ekran ID, route path).
6. **Özet çıktı:** Güncelleme bitince kullanıcıya tablo: dosya → değişen bölüm (1 satır).

---

## docs vs .mdc — içerik ayrımı

**Yalnızca `docs/` içinde (kopyalanmaz):**

- Tam API request/response örnekleri → `docs/03_API_CONTRACTS`
- Ekran alan listesi ve UX state → `docs/06_SCREEN_CATALOG`
- Tablo/kolon tanımı → `docs/02_DATABASE_SCHEMA`
- Entity lifecycle → `docs/01_DOMAIN_MODEL`

**`.mdc` iterasyonunda kalır** ([iteration-blueprint.md](iteration-blueprint.md)):

- Uygulama planı (plan-modu adımları)
- Docs okuma sırası (`docs/X.md` §Y — neden)
- Spec → kod eşlemesi (pointer + uygulama notu, spec metni değil)
- Dosya kapsamı tablosu (≤12 satır)
- Kalite kapıları, Risk, Stop komutları

**Faz üst seviyesi `.mdc`:** Goal, Feature branch, çalışma modeli, Required Context, Done Definition, Explicit Don'ts.
