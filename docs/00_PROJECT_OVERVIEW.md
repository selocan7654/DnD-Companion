# DnD Companion Platform — Proje Genel Bakış

> **Doküman amacı:** Projenin ne olduğunu, kime hitap ettiğini, neleri kapsadığını ve hangi teknik/iş kısıtları altında geliştirildiğini tek bir yerde özetler. Kodlama agent'ı bu dokümanı okuyarak projenin bağlamını, sınırlarını ve başarı kriterlerini anlar.

---

## 1. Proje Tanımı

DnD Companion Platform, Dungeons & Dragons 5th Edition (tüm resmi yayınlanmış kaynak kitaplar — PHB, DMG, XGtE, TCoE, FToD ve diğerleri) için ücretsiz, açık, topluluk odaklı bir kampanya ve karakter yönetim web uygulamasıdır. D&D Beyond'un campaign/character/homebrew akışlarını 5e.tools'un DM Screen konseptiyle birleştirir. Proje bir hobi/topluluk projesidir; monetizasyon yoktur, ticari bir ürün değildir.

**Proje kod adı:** `dnd-companion` (repo adı, klasör yapısı, environment variable prefix'i ve tüm teknik referanslarda bu isim kullanılır).

**Görünen ad:** DnD Companion Platform.

---

## 2. Hedef Personalar

Platform iki fonksiyonel personaya hizmet eder:

**Dungeon Master (DM):** Kampanya oluşturan, yöneten, oyunculara davet linki gönderen, DM Screen üzerinden oyun seansını takip eden kullanıcı. Bir kampanyayı oluşturan kişi otomatik olarak o kampanyanın DM'idir.

**Player (Oyuncu):** Davet linki ile bir kampanyaya katılan, karakter oluşturup kampanyaya atayan, oyun sırasında karakter sheet'ini güncelleyen kullanıcı.

DM ve Player bir **sistem rolü değildir** — bunlar kullanıcının bir kampanya ile olan ilişkisinden doğan bağlamsal konumlardır. Aynı kullanıcı bir kampanyada DM, başka bir kampanyada Player olabilir. Sistemde yalnızca iki rol vardır: `ADMIN` ve `USER`.

---

## 3. MVP Kapsam Özeti

MVP tek bir fazda teslim edilir; aşağıdaki tüm özellik alanları bu fazın parçasıdır:

| Özellik Alanı | Açıklama |
|---|---|
| **Kullanıcı Hesap Yönetimi** | Email + şifre ile kayıt/giriş, email doğrulama, şifre sıfırlama, profil düzenleme (username, avatar) |
| **Campaign Yönetimi** | Campaign oluşturma, düzenleme, silme; davet linki üretme/yenileme/devre dışı bırakma; üye listesi görüntüleme |
| **Karakter Yönetimi & Builder** | D&D 5e karakter sheet'i oluşturma/düzenleme/silme; guided tab-based Character Builder; karakter görünürlüğü (public/private); kampanyaya atama |
| **DM Screen** | Kampanyaya atanmış karakterlerin canlı alanlarını (HP, durum etiketleri, death saves) gerçek zamanlı izleme; DM notları |
| **Homebrew Sistemi** | 6 alt tipte (background, feat, magic item, monster, spell, subclass) homebrew içerik oluşturma; draft/published yaşam döngüsü; herkese açık homebrew galerisi |
| **Koleksiyon Sistemi** | Kullanıcının beğendiği homebrew içerikleri kendi koleksiyonuna eklemesi/çıkarması |
| **Resmi 5e Referans Verisi** | Tüm resmi D&D 5e kaynak kitaplarındaki verilerin (spells, monsters, classes, subclasses, feats, backgrounds, magic items, races) import edilmiş kopyası; read-only referans sayfaları |
| **Admin Paneli** | Kullanıcı yönetimi (listeleme, rol değiştirme, deaktivasyon), campaign/character/homebrew yönetimi (listeleme, düzenleme, silme) |

---

## 4. Kapsam Dışı Bırakılanlar

Aşağıdakiler bilinçli olarak MVP kapsamı dışındadır — bunlar için kod üretilmez, UI tasarlanmaz:

- Native mobil uygulama (iOS/Android)
- Monetizasyon, ödeme, abonelik altyapısı
- Çoklu dil desteği (arayüz sadece İngilizce)
- KVKK/GDPR tam uyum (hobi projesi; temel güvenlik iyi pratikleri uygulanır)
- In-app bildirim sistemi (push notification, bildirim çanı vb.)
- Multi-Factor Authentication (MFA/TOTP)
- Görev yönetimi (task/ticket sistemi)
- Sızdırılmış şifre kontrolü (HaveIBeenPwned)
- Kalıcı hesap silme (hard delete / right to erasure — soft delete yeterli)
- Audit log admin panel ekranı (veri modeli mevcut, UI post-MVP)
- Audit log chain-hash tamper-evidence mekanizması
- Dice roller, initiative tracker, combat tracker (DM Screen ek widget'ları)
- Full-text search (PostgreSQL ILIKE ile basit arama yeterli)
- Sunucu taraflı görsel işleme (image resize/crop pipeline)
- E2E test paketi (Playwright vb.)

---

## 5. Ölçek ve Performans Hedefleri

| Metrik | Hedef |
|---|---|
| Kayıtlı kullanıcı | 10.000+ |
| Kullanım deseni | Orta yoğunluk — gün boyunca dağılmış karakter görüntüleme/düzenleme + akşam/hafta sonu yoğunlaşan oyun seansları |
| Eşzamanlı kullanıcı | Kesin sayı erken aşamada belirsiz; horizontal-scale edilebilir mimari hedeflenir |
| Real-time | Sınırlı kapsam — sadece DM Screen canlı alanları (current HP, temporary HP, conditions, death saves) WebSocket ile anlık güncellenir |
| Coğrafya | Tek bölge (single-region), özel coğrafi kısıtlama yok |

Mimari, yatay ölçeklenebilir olacak şekilde tasarlanır: stateless backend (JWT), Redis-backed WebSocket adapter, managed PostgreSQL.

---

## 6. Erişim Modeli

Platform üç erişim katmanına sahiptir:

| Katman | Kim | Görebildikleri | Yapabildikleri |
|---|---|---|---|
| **Misafir** (anonim + email doğrulanmamış kullanıcı) | Giriş yapmamış ziyaretçiler **ve** `email_verified_at = NULL` olan kayıtlı kullanıcılar | Resmi 5e referans sayfaları, `PUBLISHED` homebrew galerisi | Sadece görüntüleme — hiçbir yazma/oluşturma/katılma eylemi yapamaz |
| **Doğrulanmış USER** | `email_verified_at != NULL` ve `role = USER` olan kullanıcılar | Yukarıdakilere ek olarak: kendi campaign'leri ve üyesi olduğu campaign'ler, kendi karakterleri, `PUBLIC` karakterler, kendi homebrew'leri, kendi koleksiyonu | Campaign oluşturma/düzenleme, karakter oluşturma/düzenleme, homebrew oluşturma/yayınlama, koleksiyon yönetimi, kampanyaya katılma, profil düzenleme |
| **ADMIN** | `role = ADMIN` olan kullanıcılar | Tüm içerikler (sahiplik/üyelik kısıtlaması yok) | Yukarıdakilere ek olarak: tüm kullanıcıları/içerikleri listeleme/düzenleme/silme, rol değiştirme, kullanıcı deaktive/reaktive etme |

**Önemli kurallar:**
- Campaign'ler tamamen private'tır — sadece DM ve üyeler görür; davetli olmayan kullanıcılar URL ile bile erişemez.
- Karakterler varsayılan `PRIVATE`'tır; sahibi `PUBLIC` yapabilir. Campaign'e atanmış karakterler, campaign üyeleri tarafından görünürlük ayarından bağımsız görüntülenebilir.
- Homebrew içerikler `DRAFT` (sadece sahip görür) veya `PUBLISHED` (herkes görür) durumundadır.

---

## 7. Teknik Stack Özeti

| Katman | Teknoloji |
|---|---|
| Dil | TypeScript (uçtan uca) |
| Monorepo | pnpm workspaces |
| Backend | NestJS |
| Veritabanı | PostgreSQL + Prisma ORM |
| Cache / Rate Limit / WS Adapter | Redis |
| Real-time | Socket.io (NestJS WebSocket Gateway) |
| Frontend | React + Vite |
| State Yönetimi | Redux Toolkit + RTK Query |
| UI Kit / Styling | Tailwind CSS + shadcn/ui |
| Form Validation | React Hook Form + Zod (frontend), class-validator + class-transformer (backend) |
| Auth | Passport JWT + Argon2 |
| Routing (frontend) | React Router |
| Hata İzleme | Sentry (ücretsiz tier) |
| API Stili | REST |

---

## 8. Altyapı Özeti

**Geliştirme ortamı:** Docker Compose ile lokal ortamda tüm servisler (NestJS API, PostgreSQL, Redis) ayağa kaldırılır. Docker Desktop yeterlidir.

**Deployment platformu:** Henüz belirlenmedi. Mimari platform-agnostic tutulur (Docker container olarak paketlenir). Railway, Render, Fly.io veya AWS gibi seçeneklerle uyumludur.

**Frontend hosting:** Backend ile aynı deployment biriminde; NestJS, derlenmiş frontend build çıktısını (`apps/web/dist`) statik dosya olarak serve eder. Ayrı bir Vercel/Netlify kullanılmaz.

**CI/CD:** GitHub Actions. Pipeline: lint → type-check → test → build → (manuel onay) → deploy.

**Ortamlar:** Üç ortam kullanılır: `development` (lokal Docker), `staging`, `production`. Her ortamın kendi PostgreSQL, Redis ve object storage kaynağı vardır.

**Object Storage:** S3-uyumlu (AWS S3 veya Cloudflare R2), public-read bucket. Avatar, karakter portresi, campaign banner, homebrew görseli saklanır.

**Backup:** Managed PostgreSQL sağlayıcısında günlük otomatik snapshot + minimum 7 gün Point-in-Time Recovery (PITR) zorunludur.

**Loglama:** Structured JSON logging, stdout'a yazılır. Platform'un log drain mekanizması kullanılır.

---

## 9. Kısıtlar ve Varsayımlar

| Kısıt | Detay |
|---|---|
| Arayüz dili | Sadece İngilizce (`en`) |
| Coğrafya | Tek bölge, ABD/Global hedef |
| Güvenlik seviyesi | OWASP ASVS L1 (temel düzey) |
| Regülasyon | KVKK/GDPR tam uyum hedefi yok; temel veri gizliliği iyi pratikleri uygulanır |
| Lisans | Resmi D&D 5e verileri tüm yayınlanmış kaynak kitaplardan import edilir. Lisans/atıf sorumluluğu deployment sahibine aittir; kod tabanında atıf mekanizması (About sayfası, footer) hazır bırakılır |
| Dosya türleri | Sadece görseller (PNG, JPEG, WebP), maksimum 5 MB |
| Şifre politikası | Minimum 8 karakter, karmaşıklık kuralı yok (NIST SP 800-63B uyumlu) |
| DB erişimi | Tüm veritabanı erişimi Prisma Client üzerinden; raw SQL / string concatenation yasak |
| Token saklama | Access token memory'de, refresh token httpOnly cookie'de; localStorage/sessionStorage yasak |
| Git workflow | Conventional Commits, feature branch + PR, main'e doğrudan push yasak |

---

## 10. Başarı Kriterleri

MVP'nin "tamamlandı" sayılması için aşağıdaki tüm maddelerin çalışır durumda olması gerekir:

1. **Kullanıcı kayıt ve giriş** — Email + şifre ile kayıt, email doğrulama linki, giriş, şifre sıfırlama, profil düzenleme (username, avatar) çalışır.
2. **Campaign CRUD + davet** — Campaign oluşturma, düzenleme, silme; davet linki üretme/yenileme/devre dışı bırakma; linke tıklayan kullanıcının kampanyaya katılması çalışır.
3. **Karakter CRUD + Builder** — Karakter oluşturma (guided tab builder), düzenleme, silme; görünürlük toggle (public/private); kampanyaya atama/çıkarma çalışır.
4. **DM Screen** — Kampanyaya atanmış karakterlerin canlı alanları (current HP, temp HP, conditions, death saves) WebSocket ile anlık olarak DM ekranına yansır; DM notları oluşturma/düzenleme/silme çalışır.
5. **Homebrew CRUD + galeri** — 6 alt tipte homebrew oluşturma, draft/published yaşam döngüsü, public galeri, arama/filtreleme çalışır.
6. **Koleksiyon** — Kullanıcı, published homebrew'leri koleksiyonuna ekleyebilir/çıkarabilir; unpublished öğeler rozetle gösterilir.
7. **Resmi 5e referans verisi** — Seed script ile yüklenen tüm resmi D&D 5e verileri (spells, monsters, classes, subclasses, feats, backgrounds, magic items, races — PHB, XGtE, TCoE ve diğer kaynak kitaplardan) read-only olarak görüntülenebilir, kaynak kitap bazlı filtrelenebilir.
8. **Admin paneli** — Kullanıcı listeleme/rol değiştirme/deaktive etme, campaign/character/homebrew listeleme/düzenleme/silme çalışır.
9. **Yetkilendirme** — Tüm erişim kuralları (sahiplik, campaign üyeliği, admin bypass, misafir kısıtlamaları) backend'de enforce edilir ve integration testlerle kapsanır.
10. **CI pipeline** — lint + type-check + test adımları GitHub Actions'ta yeşil; main'e merge CI gate'i geçmeden engellenir.

---

## 11. Terminoloji Sözlüğü

| Türkçe | English | Açıklama |
|---|---|---|
| Kampanya | Campaign | Bir DM'in oluşturduğu, oyuncuların davet ile katıldığı oyun grubu |
| Karakter | Character | Bir oyuncunun D&D 5e kurallarına göre oluşturduğu oyun karakteri |
| Ev yapımı içerik | Homebrew | Kullanıcı tarafından oluşturulan özel oyun içeriği (spell, monster, feat vb.) |
| Yönetici Ekranı | DM Screen | DM'in oyun sırasında kullandığı, oyuncu karakterlerinin durumlarını canlı izlediği ve notlarını tuttuğu ekran |
| Resmi kural verisi | Official Content / Reference Data | Tüm resmi D&D 5e kaynak kitaplarından import edilen kural verisi (PHB, DMG, XGtE, TCoE vb.) |
| Koleksiyon | Collection | Kullanıcının beğendiği homebrew içerikleri topladığı kişisel liste |
| Davet bağlantısı | Invite Link | DM'in kampanyasına oyuncu davet etmek için ürettiği tekrar kullanılabilir token tabanlı URL |
| Canlı alanlar | Live Fields | DM Screen'de WebSocket ile anlık güncellenen karakter verileri (HP, conditions, death saves) |
