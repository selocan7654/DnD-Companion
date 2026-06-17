# Phase Controller — Referans Şablonları

Fix `.mdc` iskeleti (varsayılan tek çıktı). Spec detayı **kopyalanmaz** — path + bölüm referansı.

> **Varsayılan:** Yalnızca `.cursor/rules/NN-phase-XX-<slug>-fix.mdc`. `docs/fix-reports/` **teklif etme**; kullanıcı açıkça istemedikçe yazma.

---

## Dosya adlandırma

| Artefakt | Path | Örnek | Varsayılan |
| -------- | ---- | ----- | ---------- |
| Fix planı | `.cursor/rules/NN-phase-XX-<slug>-fix.mdc` | `.cursor/rules/53-phase-04-dm-screen-admin-fix.mdc` | ✅ Evet |
| Fix raporu (opsiyonel) | `docs/fix-reports/Faz-XX-<slug>-fix-report.md` | `docs/fix-reports/Faz-04-dm-screen-fix-report.md` | ❌ Hayır — açık istek gerekir |

- `XX`: roadmap faz numarası (sıfır dolgulu: `04`)
- `<slug>`: kaynak faz dosyasından (`dm-screen-admin`, `auth-infra`)
- `NN`: kaynak faz `.mdc` ile **aynı** prefix numarası

---

## Fix Report şablonu (opsiyonel — kullanıcı açıkça istemedikçe kullanma)

Aşağıdaki şablon yalnızca kullanıcı `docs/fix-reports/` çıktısı istediğinde uygulanır. Varsayılan akışta bulgular fix `.mdc` **Audit bulguları** bölümüne gömülür.

```markdown
# Faz XX Fix Raporu — <Başlık>

> **Tarih:** YYYY-MM-DD  
> **Auditor:** phase-controller skill  
> **Branch:** `<branch-adı>`  
> **Kaynak faz kuralı:** `.cursor/rules/NN-phase-XX-<slug>.mdc`  
> **Genel durum:** PASS | PASS_WITH_GAPS | FAIL

---

## 1. Executive Summary

| Metrik | Değer |
| ------ | ----- |
| BLOCKER | 0 |
| HIGH | 0 |
| MEDIUM | 0 |
| LOW | 0 |
| INFO | 0 |
| Done Definition (uyumlu / toplam) | 0 / 0 |

**Özet:** … (2–4 cümle — en kritik gap'ler)

**Human Gate hazır mı?** Evet / Hayır — gerekçe

---

## 2. Audit Kapsamı

### Dahil

- Done Definition (kaynak faz `.mdc`)
- Explicit Don'ts
- Scope + Files NOT touched (scope creep)
- `docs/10` §Faz XX deliverable
- [docs-map minimum set — faz tipine göre]

### Hariç

- Sonraki faz deliverable'ları
- UAT (`docs/11_UAT.md` — MVP'de yok; dahil edilmediyse)

### Read-only komutlar

| Komut | Sonuç |
| ----- | ----- |
| `pnpm lint` | ✅ / ❌ |
| `pnpm typecheck` | ✅ / ❌ |
| `pnpm --filter api test` | ✅ / ❌ |

---

## 3. Done Definition Matrisi

| # | Madde (kaynak) | Durum | Bulgu ID |
| --- | -------------- | ----- | -------- |
| 1 | … | ✅ / ❌ / ➖ | F-XX-001 |

---

## 4. Bulgular

### F-XX-001 [BLOCKER][MISSING] <kısa başlık>

**Boyut:** API Contract  
**Beklenen:** `docs/03_API_CONTRACTS.md` §… — `GET /api/v1/campaigns`  
**Gözlemlenen:** Endpoint tanımlı değil  
**Kanıt:** `rg '@Controller.*campaigns'` — 0 eşleşme  
**Fix iterasyonu:** Fix İterasyon 1  
**Önerilen aksiyon:** … (yönlendirme — agent fix oturumunda uygular)

---

### F-XX-002 [HIGH][SECURITY] …

(repeat)

---

## 5. Explicit Don'ts Kontrolü

| Don't (kaynak faz .mdc) | Durum | Bulgu ID |
| ----------------------- | ----- | -------- |
| Guard'sız yazma endpoint | ✅ | — |

---

## 6. Scope Creep (EXTRA)

| Dosya / alan | Neden faz dışı | Bulgu ID |
| ------------ | -------------- | -------- |
| … | Files NOT touched ihlali | F-XX-00N |

---

## 7. Human Gate Notları

`docs/10` §1 — controller otomatik işaretlemez.

(UAT: `docs/11_UAT.md` MVP'de yok — bu bölüm yalnızca kullanıcı UAT audit istediyse doldurulur.)

---

## 8. Sonraki Adımlar

1. `@NN-phase-XX-<slug>-fix` + 「Faz XX — Fix İterasyon 1」
2. BLOCKER kapat → `@phase-controller` regression (opsiyonel)
3. Human Gate (`docs/10` §1)

---

_Rapor phase-controller skill ile üretilmiştir; uygulama kodu değiştirilmemiştir._
```

---

## Fix Phase `.mdc` şablonu

Kaynak: `phase-creator/reference.md` iskeleti — remediation odaklı adaptasyon.

````markdown
---
description: '[Faz N Fix] <Başlık> gap remediation — <K> fix iterasyon/chat (<grup1> → <grup2>). Mesajda "Faz N — Fix İterasyon M" belirt. Audit: phase-controller YYYY-MM-DD.'
---

# Faz N Fix: <Başlık>

## Goal

Aşağıdaki **Audit bulguları** bölümündeki gap'leri kapat. BLOCKER=0, HIGH=0 hedeflenir; MEDIUM/LOW fix iterasyonlarına veya bilinçli defer'e ayrılır. **Yeni feature yok** — yalnızca gap kapatma.

**Kaynak faz:** `.cursor/rules/NN-phase-XX-<slug>.mdc`  
**Audit durumu:** PASS_WITH_GAPS (YYYY-MM-DD)

## Feature branch (fix)

Fix oturumları kaynak faz branch'inde veya dedicated fix branch'te:

**Önerilen branch:** `fix/F<N>-<slug>` veya mevcut `feat/F<N>-<slug>`

**Stop (Fix İterasyon 1, kod öncesi):** [ ] Audit bulguları okundu; [ ] BLOCKER listesi net; [ ] branch checkout.

## Bu fix'in çalışma modeli

Tek sohbette tüm fix'ler tamamlanmayabilir. Her session: `@NN-phase-XX-<slug>-fix` + **「Faz N — Fix İterasyon M」**.

---

## Audit bulguları (tek kaynak)

| ID | Severity | Tip | Başlık | Kanıt |
| --- | --- | --- | --- | --- |
| F-XX-001 | BLOCKER | … | … | `path:satır` veya spec § |

**Explicit Don'ts:** ✅/❌ özet

---

### Fix İterasyon 1 — <BLOCKER / Security>

**Hedef:** F-XX-001, F-XX-002 kapat.

**Yapılacaklar:**

1. … (rapordaki Önerilen aksiyon'dan)
2. …

**Kapatılacak bulgular:** F-XX-001, F-XX-002

**Minimum bağlam:**

- Bu dosya §Audit bulguları (F-XX-001, …)
- `docs/03_API_CONTRACTS.md` §…
- `.cursor/rules/03-security-baseline.mdc`

**Bu fix iterasyonda yok:** FE polish, sonraki faz scope.

**Stop:** [ ] F-XX-001, F-XX-002 kanıtlandı; [ ] ilgili test yeşil. PR/onay → Fix İterasyon 2.

---

### Fix İterasyon 2 — <HIGH / Backend>

(repeat)

---

## Required Context

- Bu fix `.mdc` §Audit bulguları — tüm F-XX-NNN
- `.cursor/rules/NN-phase-XX-<slug>.mdc` — orijinal Done Definition
- İlgili `docs/03`, `06`, `07`, `08` bölümleri (bulgularda listelenen)

## Fix Done Definition

| Bulgu ID | Severity | Kapatıldı |
| -------- | -------- | --------- |
| F-XX-001 | BLOCKER | [ ] |
| F-XX-002 | HIGH | [ ] |

### Kalite kapıları

- [ ] `pnpm lint` + `pnpm typecheck` green
- [ ] Faz Done Definition maddeleri (orijinal) spot-check
- [ ] BLOCKER = 0
- [ ] Regression audit (`@phase-controller`) veya developer onayı

## Explicit Don'ts

- Yeni feature / sonraki faz deliverable ekleme
- Audit raporunu "PASS" diye elle yazmadan kapatma
- Orijinal faz scope genişletme
- Fix sırasında `docs/` spec'i kod uydurmak (spec doğruysa kod fix; spec yanlışsa `docs/mimari-kararlar.md` ayrı oturum — `45-write-architectural-decision.mdc`)

## Deferred (bilinçli erteleme)

| Bulgu ID | Gerekçe | Hedef |
| -------- | ------- | ----- |
| F-XX-010 | LOW — Faz N+1 scope | Faz N+1 |

---

Fix done → `@phase-controller` regression audit → Human Gate.
````

---

## Bulgu ID ↔ Fix iterasyon eşleme kuralları

1. Her BLOCKER ayrı veya tek "Fix İterasyon 1 — BLOCKER" grubunda
2. Aynı dosya/modüldeki HIGH bulguları bir iterasyonda topla (1 chat ≈ 1 PR)
3. LOW/INFO — `Deferred` tablosu veya son fix iterasyonu
4. Fix Done Definition tablosu rapordaki **tüm** BLOCKER+HIGH içermeli

---

## İyi vs kötü bulgu yazımı

**İyi:**

```markdown
### F-04-003 [HIGH][TEST_GAP] Campaign read deny integration test yok

**Beklenen:** Done Definition — non-member campaign read → 404
**Gözlemlenen:** Integration test dosyası yok
**Kanıt:** Glob `**/campaigns.controller.spec.ts` deny senaryosu yok; `docs/06` S-CAMPAIGN-DETAIL
```

**Kötü:**

```markdown
### Eksik testler var

Campaign testleri yetersiz olabilir.
```
