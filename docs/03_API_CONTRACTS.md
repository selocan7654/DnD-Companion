# DnD Companion Platform — API Contracts

> **Doküman amacı:** Tüm REST endpoint'lerini, WebSocket event'lerini, hata taksonomisini, pagination/filtreleme konvansiyonlarını ve rate limiting kurallarını tanımlar. Kodlama agent'ı bu dokümanı okuyarak controller'ları, DTO'ları ve gateway'leri eksiksiz üretir.

---

## 1. Genel Konvansiyonlar

### Base URL

```
/api/v1
```

Tüm endpoint'ler bu prefix altındadır. Örnekler: `/api/v1/auth/login`, `/api/v1/campaigns`.

### Request / Response Formatı

- Content-Type: `application/json` (dosya upload hariç — presigned URL ile doğrudan object storage'a yüklenir)
- Tüm response body'leri JSON formatındadır
- Boş response: `204 No Content` (body yok)

### Authentication Header

Korumalı endpoint'ler `Authorization: Bearer <access_token>` header'ı gerektirir. Access token memory'de tutulur (localStorage/sessionStorage yasak).

Aşağıdaki tablolarda **Auth** sütunu:
- 🔓 = Public (auth gerektirmez)
- 🔑 = Auth required (email doğrulanmış kullanıcı)
- 🔑⚠️ = Auth required, email doğrulama kontrol edilmez (sadece login durumu yeterli — profil görüntüleme gibi)
- 👑 = Admin only (`role = ADMIN`)

### Pagination (Cursor-Based)

Tüm liste endpoint'leri cursor-based pagination kullanır.

**Request parametreleri:**

| Parametre | Tip | Default | Açıklama |
|---|---|---|---|
| `cursor` | string | — | Son öğenin ID'si (ilk sayfa için gönderilmez) |
| `limit` | integer | 20 | Sayfa başına öğe sayısı (max 50) |

**Response formatı:**

```json
{
  "data": [...],
  "nextCursor": "uuid-of-last-item | null",
  "hasMore": true
}
```

`nextCursor = null` ve `hasMore = false` ise son sayfadır.

### Search / Filter / Sort

Liste endpoint'leri standart query parametreleri kabul eder:

| Parametre | Açıklama | Örnek |
|---|---|---|
| `search` | Ad/başlık'ta ILIKE arama | `?search=dragon` |
| `sort` | Sıralama alanı | `?sort=name` |
| `order` | Sıralama yönü | `?order=asc` (default: `desc`) |
| Filtreler | Endpoint'e göre değişir | `?type=SPELL&source=PHB` |

Desteklenen `sort` alanları her endpoint'in altında belirtilir.

### Standart Response Envelope (Başarılı)

Tekil kayıt:
```json
{
  "data": { ... }
}
```

Liste:
```json
{
  "data": [...],
  "nextCursor": "...",
  "hasMore": true
}
```

---

## 2. Hata Taksonomisi

### Error Response Envelope

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "details": [
    { "field": "name", "issue": "Name is required" },
    { "field": "level", "issue": "Level must be between 1 and 20" }
  ]
}
```

`details` alanı sadece validation hatalarında (400/422) bulunur; diğer hatalarda `null` veya yoktur.

### HTTP Status Code Kullanımı

| Code | Kullanım |
|---|---|
| `200 OK` | Başarılı GET, PATCH, PUT |
| `201 Created` | Başarılı POST (kaynak oluşturma) |
| `204 No Content` | Başarılı DELETE, body'siz işlemler |
| `400 Bad Request` | Validation hatası, malformed request |
| `401 Unauthorized` | Auth token eksik veya geçersiz |
| `403 Forbidden` | Yetki yetersiz (doğru token ama izin yok) |
| `404 Not Found` | Kaynak bulunamadı veya erişim yok (yetki gizleme: yetkisiz kullanıcıya 404 dön, kaynağın varlığını ifşa etme) |
| `409 Conflict` | Çakışma (örn. zaten üye, email/username zaten kayıtlı) |
| `422 Unprocessable Entity` | Semantik hata (format doğru ama iş kuralı ihlali) |
| `429 Too Many Requests` | Rate limit aşıldı |
| `500 Internal Server Error` | Beklenmeyen sunucu hatası |

### Yetki Gizleme Kuralı

Kullanıcının erişim yetkisi olmadığı bir kaynağa URL ile eriştiğinde **404 döner, 403 değil**. Gerekçe: kaynağın varlığını ifşa etmemek (örn. "bu kampanya var ama erişimin yok" bilgisi sızdırılmaz). İstisna: kullanıcının kendi kaynağında yetki hatası (örn. Player kampanyayı güncellemeye çalıştığında) → `403 Forbidden`.

### Auth Hata Mesajları

Login hatalarında genel mesaj döner: `"Invalid email or password"`. Hangi alanın hatalı olduğu belirtilmez (account enumeration önleme).

---

## 3. Auth Endpoints (`/auth`)

| Method | Path | Auth | Açıklama |
|---|---|---|---|
| POST | `/auth/register` | 🔓 | Yeni kullanıcı kaydı |
| POST | `/auth/login` | 🔓 | Giriş, JWT token üretimi |
| POST | `/auth/refresh` | Cookie | Access token yenileme |
| POST | `/auth/logout` | 🔑⚠️ | Çıkış, refresh token iptal |
| POST | `/auth/verify-email` | 🔓 | Email doğrulama token'ı ile doğrulama |
| POST | `/auth/password-reset/request` | 🔓 | Şifre sıfırlama linki gönderimi |
| POST | `/auth/password-reset/confirm` | 🔓 | Yeni şifre belirleme |

### POST `/auth/register`

**Request:**
```json
{
  "email": "player@example.com",
  "username": "player42",
  "password": "minimum8chars"
}
```

**Validation:** email format, username 3-50 karakter (alfanumerik + tire/alt çizgi), password min 8 karakter.

**Response (201):**
```json
{
  "data": {
    "id": "uuid",
    "email": "player@example.com",
    "username": "player42",
    "role": "USER",
    "emailVerifiedAt": null,
    "createdAt": "2026-06-14T10:00:00Z"
  }
}
```

**Side effect:** Email doğrulama linki gönderilir (SMTP). Token URL formatı: `{FRONTEND_URL}/verify-email?token=<random-token>`.

**Errors:** `409` email veya username zaten kayıtlı.

### POST `/auth/login`

**Request:**
```json
{
  "email": "player@example.com",
  "password": "minimum8chars"
}
```

**Response (200):**
```json
{
  "data": {
    "accessToken": "jwt-access-token",
    "user": {
      "id": "uuid",
      "email": "player@example.com",
      "username": "player42",
      "role": "USER",
      "avatarUrl": null,
      "emailVerifiedAt": "2026-06-14T10:05:00Z"
    }
  }
}
```

**Side effect:** Refresh token `httpOnly`, `Secure`, `SameSite=Strict` cookie'de set edilir. Token hash'i DB'de saklanır.

**Errors:** `401` genel mesaj ("Invalid email or password"). `403` kullanıcı deaktive (`is_active = false`).

### POST `/auth/refresh`

Auth: Cookie'deki refresh token. `Authorization` header kullanılmaz.

**Response (200):**
```json
{
  "data": {
    "accessToken": "new-jwt-access-token"
  }
}
```

**Side effect:** Refresh token rotation — yeni refresh token üretilir, eski geçersiz kılınır, yeni cookie set edilir. Kullanılmış/geçersiz token tekrar kullanılırsa kullanıcının tüm refresh token'ları iptal edilir (reuse detection).

**Errors:** `401` refresh token geçersiz/expired/kullanılmış.

### POST `/auth/logout`

**Response:** `204 No Content`

**Side effect:** Mevcut refresh token DB'de iptal edilir. Cookie temizlenir.

### POST `/auth/verify-email`

**Request:**
```json
{
  "token": "email-verification-token"
}
```

**Response (200):**
```json
{
  "data": { "message": "Email verified successfully" }
}
```

**Side effect:** `email_verified_at = now()` set edilir.

**Errors:** `400` token geçersiz/expired.

### POST `/auth/password-reset/request`

**Request:**
```json
{
  "email": "player@example.com"
}
```

**Response:** `200` her durumda (email var/yok fark etmez — account enumeration önleme).

```json
{
  "data": { "message": "If an account with this email exists, a reset link has been sent" }
}
```

**Side effect:** Email mevcutsa şifre sıfırlama linki gönderilir.

### POST `/auth/password-reset/confirm`

**Request:**
```json
{
  "token": "reset-token",
  "newPassword": "newsecurepassword"
}
```

**Response (200):**
```json
{
  "data": { "message": "Password reset successfully" }
}
```

**Side effect:** Şifre güncellenir, tüm refresh token'lar iptal edilir (tüm cihazlardan çıkış).

**Errors:** `400` token geçersiz/expired.

---

## 4. User Endpoints (`/users`)

| Method | Path | Auth | Açıklama |
|---|---|---|---|
| GET | `/users/me` | 🔑⚠️ | Kendi profili |
| PATCH | `/users/me` | 🔑 | Profil güncelleme |
| PATCH | `/users/me/password` | 🔑 | Şifre değiştirme (mevcut şifre doğrulamalı) |
| POST | `/users/me/deactivate` | 🔑 | Hesap deaktivasyonu (self-service) |
| GET | `/users/:id` | 🔓 | Public kullanıcı bilgisi (username + avatar) |

### GET `/users/me`

**Response (200):**
```json
{
  "data": {
    "id": "uuid",
    "email": "player@example.com",
    "username": "player42",
    "avatarUrl": "https://cdn.example.com/avatars/...",
    "role": "USER",
    "isActive": true,
    "emailVerifiedAt": "2026-06-14T10:05:00Z",
    "createdAt": "2026-06-14T10:00:00Z"
  }
}
```

### PATCH `/users/me`

**Request** (partial update):
```json
{
  "username": "newname42",
  "avatarUrl": "https://cdn.example.com/avatars/new.jpg"
}
```

Güncellenebilir alanlar: `username`, `avatarUrl`. Email ve şifre değişikliği ayrı endpoint'ler gerektirir (MVP'de email değişikliği yoktur).

**Errors:** `409` username zaten kayıtlı.

### PATCH `/users/me/password`

**Request:**
```json
{
  "currentPassword": "oldpassword123",
  "newPassword": "newsecurepassword"
}
```

**Validation:** `newPassword` min 8 karakter. `currentPassword` mevcut hash ile Argon2id doğrulanır.

**Response:** `204 No Content`

**Errors:** `401` mevcut şifre hatalı (genel mesaj — enumeration yok). `400` validation.

**Side effect:** Başarılı şifre değişikliğinde tüm refresh token'lar iptal edilir (diğer oturumlar sonlanır).

### POST `/users/me/deactivate`

**Response:** `204 No Content`

**Side effect:** `is_active = false`, tüm refresh token'lar iptal edilir.

### GET `/users/:id`

**Response (200)** — Public bilgi, herkes görebilir:
```json
{
  "data": {
    "id": "uuid",
    "username": "player42",
    "avatarUrl": "https://..."
  }
}
```

`email` alanı dönmez (PII). Deaktive kullanıcılar için `404`.

---

## 5. Campaign Endpoints (`/campaigns`)

| Method | Path | Auth | Açıklama |
|---|---|---|---|
| POST | `/campaigns` | 🔑 | Kampanya oluşturma |
| GET | `/campaigns` | 🔑 | Kullanıcının kampanyalarını listeleme (DM + üye) |
| GET | `/campaigns/:id` | 🔑 | Kampanya detayı (DM veya üye) |
| PATCH | `/campaigns/:id` | 🔑 | Kampanya güncelleme (sadece DM) |
| DELETE | `/campaigns/:id` | 🔑 | Kampanya silme (sadece DM) |
| POST | `/campaigns/:id/invite/regenerate` | 🔑 | Davet linki yenileme (sadece DM) |
| POST | `/campaigns/:id/invite/disable` | 🔑 | Davet linki devre dışı bırakma (sadece DM) |
| GET | `/campaigns/:id/members` | 🔑 | Üye listesi (DM veya üye) |
| DELETE | `/campaigns/:id/members/:userId` | 🔑 | Üye çıkarma (sadece DM) veya ayrılma (kendi userId) |

### POST `/campaigns`

**Request:**
```json
{
  "name": "Curse of Strahd Campaign",
  "description": "A gothic horror adventure...",
  "setting": "Barovia"
}
```

**Response (201):**
```json
{
  "data": {
    "id": "uuid",
    "name": "Curse of Strahd Campaign",
    "description": "A gothic horror adventure...",
    "bannerUrl": null,
    "setting": "Barovia",
    "ownerId": "user-uuid",
    "inviteToken": null,
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

### GET `/campaigns`

Kullanıcının DM olduğu ve üye olduğu kampanyaların birleşik listesi.

**Query parametreleri:** `search`, `cursor`, `limit`.

**Response item'leri ek bilgi içerir:**
```json
{
  "id": "uuid",
  "name": "...",
  "setting": "...",
  "bannerUrl": "...",
  "role": "DM | PLAYER",
  "memberCount": 5,
  "createdAt": "..."
}
```

### GET `/campaigns/:id`

DM veya üye olmayan kullanıcıya `404` döner.

**Response** kampanya detayı + üye sayısı + atanmış karakter sayısı.

### PATCH `/campaigns/:id`

Sadece DM. Güncellenebilir alanlar: `name`, `description`, `bannerUrl`, `setting`.

### DELETE `/campaigns/:id`

Sadece DM. Cascade: members silinir, characters `campaign_id = NULL`, dm_notes silinir.

**Response:** `204 No Content`.

### POST `/campaigns/:id/invite/regenerate`

Sadece DM. Yeni rastgele token üretir, eski link geçersiz olur.

**Response (200):**
```json
{
  "data": {
    "inviteToken": "new-random-token",
    "inviteUrl": "https://app.dnd-companion.com/invite/new-random-token"
  }
}
```

### POST `/campaigns/:id/invite/disable`

Sadece DM. `invite_token = NULL`.

**Response:** `204 No Content`.

### GET `/campaigns/:id/members`

DM veya üye. Pagination yok (kampanya üye sayısı düşük).

**Response (200):**
```json
{
  "data": [
    {
      "userId": "uuid",
      "username": "player42",
      "avatarUrl": "...",
      "joinedAt": "...",
      "role": "DM | PLAYER"
    }
  ]
}
```

DM, `role: "DM"` olarak listenin başında yer alır (DB'den değil, response'ta `owner_id` kontrolü ile eklenir).

### DELETE `/campaigns/:id/members/:userId`

İki kullanım:
1. DM bir Player'ı çıkarır (`userId != currentUser.id`, sadece DM yetkisi)
2. Player kendisi ayrılır (`userId == currentUser.id`)

DM kendini çıkaramaz (kampanya silmesi gerekir).

**Side effect:** Çıkarılan/ayrılan kullanıcının kampanyaya atanmış karakterlerinin `campaign_id = NULL` olur.

**Response:** `204 No Content`.

---

## 6. Campaign Join (`/invite`)

| Method | Path | Auth | Açıklama |
|---|---|---|---|
| GET | `/invite/:token` | 🔑 | Davet bilgisi görüntüleme (onay ekranı için) |
| POST | `/invite/:token/join` | 🔑 | Kampanyaya katılma |

### GET `/invite/:token`

**Response (200):**
```json
{
  "data": {
    "campaignId": "uuid",
    "campaignName": "Curse of Strahd Campaign",
    "dmUsername": "dungeonmaster99",
    "memberCount": 4
  }
}
```

**Errors:** `404` token geçersiz/devre dışı.

### POST `/invite/:token/join`

**Response (201):**
```json
{
  "data": {
    "campaignId": "uuid",
    "joinedAt": "..."
  }
}
```

**Errors:** `404` token geçersiz. `409` zaten üye veya DM.

---

## 7. Character Endpoints (`/characters`)

| Method | Path | Auth | Açıklama |
|---|---|---|---|
| POST | `/characters` | 🔑 | Karakter oluşturma |
| GET | `/characters` | 🔑 | Kullanıcının karakterlerini listeleme |
| GET | `/characters/:id` | Değişken | Karakter detayı (görünürlük kurallarına tabi) |
| PATCH | `/characters/:id` | 🔑 | Karakter güncelleme (sahibi veya kampanya DM'i) |
| DELETE | `/characters/:id` | 🔑 | Karakter silme (sahibi veya kampanya DM'i) |
| PATCH | `/characters/:id/campaign` | 🔑 | Kampanyaya atama/çıkarma (sadece sahibi) |
| PATCH | `/characters/:id/visibility` | 🔑 | Görünürlük değiştirme (sadece sahibi) |
| PATCH | `/characters/:id/live` | 🔑 | Canlı alan güncelleme (sahibi veya DM) |

### POST `/characters`

**Request:**
```json
{
  "name": "Thorin Ironforge",
  "race": "Dwarf",
  "className": "Fighter",
  "subclass": "Battle Master",
  "level": 5,
  "background": "Soldier",
  "campaignId": "uuid-or-null"
}
```

`campaignId` gönderilirse kullanıcının o kampanyanın üyesi/DM'i olması gerekir.

**Response (201):** Tam karakter objesi.

### GET `/characters`

Kullanıcının kendi karakterleri (`owner_id == currentUser.id`).

**Query:** `search`, `cursor`, `limit`, `campaignId` (filtre).

### GET `/characters/:id`

**Görünürlük kuralları:**
- `visibility = PUBLIC` → 🔓 herkes (misafir dahil)
- Kampanyaya atanmış → 🔑 kampanya DM'i ve üyeleri
- Diğer → 🔑 sadece sahibi
- ADMIN → her zaman erişebilir

Yetkisiz erişim: `404`.

**Response (200):** Tam karakter objesi. `password_hash`, `email` gibi hassas alanlar owner bilgisinde yer almaz — sadece `ownerId`, `ownerUsername`, `ownerAvatarUrl`.

### PATCH `/characters/:id`

Sahibi veya kampanya DM'i. Tüm karakter alanları güncellenebilir (canlı alanlar dahil, ama canlı alanlar için `/live` endpoint'i tercih edilir).

**Request** (partial update):
```json
{
  "level": 6,
  "hitPointsMax": 52,
  "abilityScores": { "STR": 18, "DEX": 14, "CON": 16, "INT": 10, "WIS": 12, "CHA": 8 }
}
```

### DELETE `/characters/:id`

Sahibi veya kampanya DM'i. Hard delete.

**Response:** `204 No Content`.

### PATCH `/characters/:id/campaign`

Sadece sahibi. Kampanyaya atama veya atamayı kaldırma.

**Request:**
```json
{
  "campaignId": "uuid | null"
}
```

`campaignId` set edilirken: kullanıcının kampanya üyesi/DM'i olması gerekir. Karakter zaten başka kampanyada ise önce `null` gönderilmeli.

**Errors:** `409` karakter zaten bir kampanyaya atanmış. `403` kullanıcı kampanya üyesi değil.

### PATCH `/characters/:id/visibility`

Sadece sahibi.

**Request:**
```json
{
  "visibility": "PUBLIC | PRIVATE"
}
```

### PATCH `/characters/:id/live`

Sahibi veya kampanya DM'i. Canlı alanları günceller ve WebSocket event yayınlar.

**Request** (sadece canlı alanlar):
```json
{
  "hitPointsCurrent": 25,
  "temporaryHitPoints": 5,
  "deathSaves": { "successes": 1, "failures": 0 },
  "conditions": ["Poisoned"]
}
```

Herhangi bir canlı alan güncellenebilir, hepsinin gönderilmesi gerekmez (partial update).

**Side effect:** Karakter bir kampanyaya atanmışsa, `campaign:<campaignId>` WebSocket room'una `character:live-update` event'i yayınlanır.

**Response (200):** Güncellenen canlı alanlar.

---

## 8. Homebrew Endpoints (`/homebrew`)

| Method | Path | Auth | Açıklama |
|---|---|---|---|
| POST | `/homebrew` | 🔑 | Homebrew içerik oluşturma |
| GET | `/homebrew` | 🔓 | Galeri (published içerikler + resmi veriler) |
| GET | `/homebrew/my-creations` | 🔑 | Kullanıcının kendi homebrew'leri |
| GET | `/homebrew/:id` | Değişken | İçerik detayı |
| PATCH | `/homebrew/:id` | 🔑 | İçerik güncelleme (sadece homebrew sahibi) |
| DELETE | `/homebrew/:id` | 🔑 | İçerik silme (sadece homebrew sahibi) |
| PATCH | `/homebrew/:id/publish` | 🔑 | Yayınlama (DRAFT → PUBLISHED) |
| PATCH | `/homebrew/:id/unpublish` | 🔑 | Yayından kaldırma (PUBLISHED → DRAFT) |

### POST `/homebrew`

**Request:**
```json
{
  "name": "Sword of the Phoenix",
  "type": "MAGIC_ITEM",
  "description": "A flaming longsword...",
  "imageUrl": null,
  "data": {
    "rarity": "Very Rare",
    "type": "Weapon (longsword)",
    "attunement": true,
    "attunement_requirement": null,
    "properties": "You gain a +2 bonus...",
    "charges": 3,
    "recharge": "dawn"
  }
}
```

`source` otomatik olarak `HOMEBREW` set edilir. `data` alanı `type`'a göre Zod ile validate edilir.

**Response (201):** Tam içerik objesi, `status: "DRAFT"`.

### GET `/homebrew` (Galeri)

🔓 Public — misafir dahil herkes erişebilir.

Sadece `status = PUBLISHED` olan kayıtları döner (resmi + homebrew birlikte).

**Query parametreleri:**

| Parametre | Açıklama | Örnek |
|---|---|---|
| `search` | İsimde ILIKE arama | `?search=fire` |
| `type` | Alt tip filtresi | `?type=SPELL` |
| `source` | Kaynak filtresi | `?source=PHB` veya `?source=HOMEBREW` |
| `sort` | Sıralama | `name`, `createdAt` (default: `createdAt`) |
| `order` | Yön | `asc`, `desc` (default: `desc`) |
| `cursor`, `limit` | Pagination | |

**Response item:**
```json
{
  "id": "uuid",
  "name": "Fireball",
  "type": "SPELL",
  "source": "PHB",
  "status": "PUBLISHED",
  "description": "A bright streak...",
  "imageUrl": null,
  "ownerUsername": null,
  "createdAt": "..."
}
```

Resmi içeriklerde `ownerUsername = null`. Homebrew'lerde oluşturanın username'i gösterilir.

### GET `/homebrew/my-creations`

🔑 Kullanıcının kendi homebrew'leri (DRAFT + PUBLISHED). `source = HOMEBREW` ve `owner_id = currentUser.id`.

**Query:** `search`, `type`, `status` (DRAFT|PUBLISHED), `cursor`, `limit`.

### GET `/homebrew/:id`

**Görünürlük:**
- `status = PUBLISHED` → 🔓 herkes
- `status = DRAFT` → 🔑 sadece sahibi
- ADMIN → her zaman

**Response (200):** Tam içerik objesi (`data` JSONB dahil).

### PATCH `/homebrew/:id`

Sadece `source = HOMEBREW` ve `owner_id == currentUser.id`. Resmi içerikler güncellenemez.

**Request** (partial update):
```json
{
  "name": "Updated Name",
  "description": "...",
  "data": { ... }
}
```

`type` ve `source` değiştirilemez.

### DELETE `/homebrew/:id`

Sadece homebrew sahibi. Resmi içerikler silinemez.

Hard delete. Cascade: ilişkili `collection_items` silinir.

**Response:** `204 No Content`.

### PATCH `/homebrew/:id/publish`

Sadece sahibi. `DRAFT → PUBLISHED`. `email_verified_at` zorunlu.

**Response (200):**
```json
{
  "data": { "id": "uuid", "status": "PUBLISHED", "publishedAt": "..." }
}
```

**Errors:** `422` zaten published. `403` email doğrulanmamış.

### PATCH `/homebrew/:id/unpublish`

Sadece sahibi. `PUBLISHED → DRAFT`.

Mevcut `collection_items` referansları korunur (silinmez).

**Response (200):**
```json
{
  "data": { "id": "uuid", "status": "DRAFT" }
}
```

---

## 9. Collection Endpoints (`/collections`)

| Method | Path | Auth | Açıklama |
|---|---|---|---|
| GET | `/collections` | 🔑 | Kullanıcının koleksiyonu |
| POST | `/collections/:homebrewItemId` | 🔑 | Koleksiyona ekleme |
| DELETE | `/collections/:homebrewItemId` | 🔑 | Koleksiyondan çıkarma |

### GET `/collections`

**Query:** `search`, `type`, `cursor`, `limit`.

**Response item'leri ek bilgi içerir:**
```json
{
  "homebrewItemId": "uuid",
  "name": "Fireball",
  "type": "SPELL",
  "source": "PHB",
  "status": "PUBLISHED",
  "isUnpublished": false,
  "ownerUsername": null,
  "addedAt": "..."
}
```

`isUnpublished = true`: sahibi tarafından yayından kaldırılmış ama referans korunan öğe. UI'da "Yazar tarafından yayından kaldırıldı" rozeti gösterilir.

### POST `/collections/:homebrewItemId`

Sadece `status = PUBLISHED` olan öğeler eklenebilir.

**Response:** `201 Created`.

**Errors:** `409` zaten koleksiyonda. `404` öğe bulunamadı veya published değil.

### DELETE `/collections/:homebrewItemId`

**Response:** `204 No Content`.

---

## 10. DM Note Endpoints (`/campaigns/:id/dm-notes`)

| Method | Path | Auth | Açıklama |
|---|---|---|---|
| GET | `/campaigns/:id/dm-notes` | 🔑 | Kampanya DM notlarını listeleme (sadece DM) |
| POST | `/campaigns/:id/dm-notes` | 🔑 | DM notu oluşturma (sadece DM) |
| PATCH | `/campaigns/:id/dm-notes/:noteId` | 🔑 | DM notu güncelleme (sadece DM) |
| DELETE | `/campaigns/:id/dm-notes/:noteId` | 🔑 | DM notu silme (sadece DM) |
| PATCH | `/campaigns/:id/dm-notes/reorder` | 🔑 | Notları yeniden sıralama (sadece DM) |

### GET `/campaigns/:id/dm-notes`

Sadece kampanyanın DM'i. `sort_order` sırasında döner. Pagination yok (not sayısı düşük).

### POST `/campaigns/:id/dm-notes`

**Request:**
```json
{
  "title": "Session 5 Notes",
  "content": "## Key NPCs\n- Strahd: ...",
  "sortOrder": 0
}
```

### PATCH `/campaigns/:id/dm-notes/:noteId`

**Request** (partial):
```json
{
  "title": "Updated Title",
  "content": "Updated content..."
}
```

### PATCH `/campaigns/:id/dm-notes/reorder`

**Request:**
```json
{
  "noteIds": ["uuid-3", "uuid-1", "uuid-2"]
}
```

Verilen sırada `sort_order` değerleri güncellenir (0, 1, 2...).

---

## 11. Reference Data Endpoints (`/reference`)

🔓 Tüm reference endpoint'leri public — misafir dahil herkes erişebilir. Bunlar read-only endpoint'lerdir; resmi 5e verisi üzerinde yazma işlemi yapılmaz (admin hariç — admin `/admin` endpoint'lerini kullanır).

| Method | Path | Açıklama |
|---|---|---|
| GET | `/reference/spells` | Spell listesi |
| GET | `/reference/spells/:id` | Spell detayı |
| GET | `/reference/monsters` | Monster listesi |
| GET | `/reference/monsters/:id` | Monster detayı |
| GET | `/reference/feats` | Feat listesi |
| GET | `/reference/feats/:id` | Feat detayı |
| GET | `/reference/backgrounds` | Background listesi |
| GET | `/reference/backgrounds/:id` | Background detayı |
| GET | `/reference/magic-items` | Magic item listesi |
| GET | `/reference/magic-items/:id` | Magic item detayı |
| GET | `/reference/subclasses` | Subclass listesi |
| GET | `/reference/subclasses/:id` | Subclass detayı |
| GET | `/reference/classes` | Sınıf listesi (sabit referans, JSONB'den değil) |
| GET | `/reference/races` | Tür/species listesi (sabit referans) |

### Liste Endpoint'leri

Tüm liste endpoint'leri aynı query parametrelerini kabul eder:

| Parametre | Açıklama |
|---|---|
| `search` | İsimde ILIKE arama |
| `source` | Kaynak kitap filtresi (PHB, XGTE vb.) |
| `cursor`, `limit` | Pagination |
| `sort`, `order` | Sıralama |

Ek filtreler tipe göre:
- Spells: `level`, `school`, `class` (hangi sınıf kullanabilir)
- Monsters: `challengeRating`, `creatureType`, `size`
- Subclasses: `parentClass`
- Magic Items: `rarity`

### Detay Endpoint'leri

Tam `data` JSONB alanını içerir.

**Not:** Reference endpoint'leri, `homebrew_items` tablosundan `source != HOMEBREW` koşuluyla sorgular. Homebrew galeri endpoint'i (`/homebrew`) ise tüm source'ları kapsar.

### Classes ve Races

D&D 5e sınıf ve tür listesi `homebrew_items` tablosunda tutulmaz — bunlar karakter oluşturma formundaki dropdown'lar için sabit referans verisidir. İki seçenek:

**Seçenek (tercih edilen):** `packages/shared/constants/` altında sabit array olarak tutulur, API endpoint'i bu sabitleri döner. Avantaj: DB sorgusu gerektirmez, deployment ile birlikte gelir.

```typescript
// packages/shared/constants/classes.ts
export const DND_CLASSES = [
  { name: 'Barbarian', hitDie: 12, primaryAbility: 'STR', savingThrows: ['STR', 'CON'] },
  { name: 'Bard', hitDie: 8, primaryAbility: 'CHA', savingThrows: ['DEX', 'CHA'] },
  // ... 13 sınıf (Artificer dahil)
];

// packages/shared/constants/races.ts
export const DND_RACES = [
  { name: 'Dwarf', speed: 25, size: 'Medium', source: 'PHB' },
  { name: 'Elf', speed: 30, size: 'Medium', source: 'PHB' },
  // ... tüm türler
];
```

---

## 12. Admin Endpoints (`/admin`)

Tüm admin endpoint'leri `role = ADMIN` gerektirir. 👑

### User Management

| Method | Path | Açıklama |
|---|---|---|
| GET | `/admin/users` | Tüm kullanıcıları listeleme |
| GET | `/admin/users/:id` | Kullanıcı detayı (email dahil) |
| PATCH | `/admin/users/:id/role` | Rol değiştirme |
| POST | `/admin/users/:id/deactivate` | Deaktive etme |
| POST | `/admin/users/:id/reactivate` | Reaktive etme |

#### GET `/admin/users`

**Query:** `search` (email/username), `role`, `isActive`, `cursor`, `limit`, `sort`, `order`.

**Response item:** Tam user objesi (email dahil).

#### PATCH `/admin/users/:id/role`

**Request:**
```json
{
  "role": "ADMIN | USER"
}
```

**Kural:** Sistemde en az bir ADMIN kalması zorunlu — son admin rolünü düşüremez (`422`).

**Side effect:** `audit_logs`'a `ROLE_CHANGED` kaydı eklenir.

#### POST `/admin/users/:id/deactivate`

**Side effect:** `is_active = false`, refresh token'lar iptal. `audit_logs`'a `USER_DEACTIVATED` kaydı.

#### POST `/admin/users/:id/reactivate`

**Side effect:** `is_active = true`. `audit_logs`'a `USER_REACTIVATED` kaydı.

### Content Management

| Method | Path | Açıklama |
|---|---|---|
| GET | `/admin/campaigns` | Tüm kampanyalar (üyelik kısıtlaması yok) |
| GET | `/admin/campaigns/:id` | Kampanya detayı |
| PATCH | `/admin/campaigns/:id` | Kampanya düzenleme |
| DELETE | `/admin/campaigns/:id` | Kampanya silme (hard delete) |
| GET | `/admin/characters` | Tüm karakterler (visibility bypass) |
| PATCH | `/admin/characters/:id` | Karakter düzenleme |
| DELETE | `/admin/characters/:id` | Karakter silme |
| GET | `/admin/homebrew` | Tüm homebrew (status bypass) |
| PATCH | `/admin/homebrew/:id` | Homebrew düzenleme (resmi içerikler dahil) |
| DELETE | `/admin/homebrew/:id` | Homebrew silme |
| PATCH | `/admin/homebrew/:id/status` | Status değiştirme (publish/unpublish) |

Tüm admin yazma işlemleri `audit_logs`'a `CONTENT_EDITED` veya `CONTENT_DELETED` olarak loglanır.

Admin listeleme endpoint'leri, normal endpoint'lerdeki görünürlük/üyelik kısıtlamalarını bypass eder.

---

## 13. Upload Endpoint (`/uploads`)

| Method | Path | Auth | Açıklama |
|---|---|---|---|
| POST | `/uploads/presign` | 🔑 | Presigned PUT URL üretimi |

### POST `/uploads/presign`

**Request:**
```json
{
  "contentType": "image/png",
  "purpose": "avatar | portrait | banner | homebrew-image",
  "fileName": "my-character.png"
}
```

**Validation:**
- `contentType`: sadece `image/png`, `image/jpeg`, `image/webp`
- Dosya boyutu: max 5 MB (presigned URL'de content-length kısıtı)
- SVG kabul edilmez

**Response (200):**
```json
{
  "data": {
    "uploadUrl": "https://storage.example.com/bucket/path?X-Amz-Signature=...",
    "publicUrl": "https://cdn.example.com/path/uuid-filename.png",
    "expiresIn": 600
  }
}
```

İstemci `uploadUrl`'e PUT ile dosyayı yükler, ardından `publicUrl`'i ilgili kaynağın `*_url` alanına PATCH ile kaydeder.

---

## 14. WebSocket Events

### Transport

Socket.io, NestJS `@nestjs/websockets` gateway üzerinden. Bağlantı URL: `wss://api.dnd-companion.com` (veya geliştirmede `ws://localhost:3000`).

### Authentication

Socket handshake'te access token gönderilir:

```typescript
const socket = io('wss://api.example.com', {
  auth: { token: accessToken }
});
```

Gateway'de JWT doğrulanır. Geçersiz/expired token → bağlantı reddedilir.

### Room Modeli

Her kampanya bir Socket.io room'udur: `campaign:<campaignId>`.

**Room'a katılım:** Client `join-campaign` event'i gönderir, gateway kullanıcının kampanya üyesi/DM'i olduğunu doğrular ve room'a ekler.

**Room'dan ayrılma:** Client `leave-campaign` event'i gönderir veya bağlantı kesildiğinde otomatik ayrılır.

### Event'ler

#### Client → Server

| Event | Payload | Açıklama |
|---|---|---|
| `join-campaign` | `{ campaignId: string }` | Kampanya room'una katılım isteği |
| `leave-campaign` | `{ campaignId: string }` | Room'dan ayrılma |

#### Server → Client (Room Broadcast)

| Event | Payload | Açıklama |
|---|---|---|
| `character:live-update` | `{ characterId, characterName, field, value, updatedBy }` | Canlı alan güncellemesi |
| `campaign:member-joined` | `{ userId, username, avatarUrl }` | Yeni üye katıldı |
| `campaign:member-left` | `{ userId, username }` | Üye ayrıldı/çıkarıldı |

### `character:live-update` Payload Detayı

```json
{
  "characterId": "uuid",
  "characterName": "Thorin Ironforge",
  "field": "hitPointsCurrent",
  "value": 25,
  "updatedBy": "player42"
}
```

`field` değerleri: `hitPointsCurrent`, `temporaryHitPoints`, `deathSaves`, `conditions`.

Birden fazla canlı alan aynı anda güncellenirse her biri için ayrı event yayınlanır veya toplu payload gönderilir:

```json
{
  "characterId": "uuid",
  "characterName": "Thorin Ironforge",
  "fields": {
    "hitPointsCurrent": 25,
    "conditions": ["Poisoned", "Prone"]
  },
  "updatedBy": "player42"
}
```

İki format da kabul edilir; tercih: toplu payload (daha az event, daha az network overhead).

### Hata Handling

Gateway hataları `error` event'i ile client'a iletilir:

```json
{
  "event": "join-campaign",
  "message": "Not a member of this campaign",
  "code": "FORBIDDEN"
}
```

---

## 15. Rate Limiting

### Auth Endpoint'leri (Brute-Force Koruması)

| Endpoint | Limit | Pencere | Aşıldığında |
|---|---|---|---|
| `POST /auth/login` | 5 istek | 15 dakika | `429 Too Many Requests` |
| `POST /auth/register` | 5 istek | 15 dakika | `429` |
| `POST /auth/password-reset/request` | 5 istek | 15 dakika | `429` |

Limit IP adresi başınadır. Redis sliding-window counter ile uygulanır.

### Global API Limit

Reverse proxy / CDN seviyesinde (deployment platformuna bağlı) genel API rate limit uygulanır. Uygulama katmanında ek global limit MVP'de yoktur.

### Rate Limit Response

```
HTTP/1.1 429 Too Many Requests
Retry-After: 900
```

```json
{
  "statusCode": 429,
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Try again in 15 minutes."
}
```
