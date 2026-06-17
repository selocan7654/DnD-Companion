# DnD Companion Platform — Mimari Kararlar Dokümanı

> **Versiyon:** 1.1
> **Son güncelleme:** 2026-06-14
> **Durum:** ✅ Tüm bölümler (1-18) tamamlandı. 3 yüksek/orta öncelikli açık karar (Bölüm 18) deployment platformu netleşince kapatılacak.
> **Amaç:** Bu doküman `.md` ve `.mdc` dosyalarının tamamının referans alacağı tek doğruluk kaynağıdır. Tüm mimari ve iş kuralı kararları buraya işlenir.

---

## İçindekiler

- [1. Proje Kimliği ve Kapsam](#1-proje-kimliği-ve-kapsam)
- [2. Kullanıcı Havuzu ve Ölçek](#2-kullanıcı-havuzu-ve-ölçek)
- [3. Kimlik Doğrulama ve Kullanıcı Yapısı](#3-kimlik-doğrulama-ve-kullanıcı-yapısı)
- [4. Yetkilendirme Mimarisi](#4-yetkilendirme-mimarisi)
- [5. Roller ve Yetki Yönetimi](#5-roller-ve-yetki-yönetimi)
- [6. Süreç (Workflow) Mimarisi](#6-süreç-workflow-mimarisi)
- [7. Görev Yönetimi](#7-görev-yönetimi)
- [8. Doküman Yönetimi](#8-doküman-yönetimi)
- [9. Admin Panelleri](#9-admin-panelleri)
- [10. Güvenlik ve KVKK](#10-güvenlik-ve-kvkk)
- [11. Denetim (Audit Log)](#11-denetim-audit-log)
- [12. Entegrasyonlar](#12-entegrasyonlar)
- [13. Bildirim Sistemi](#13-bildirim-sistemi)
- [14. Tech Stack](#14-tech-stack)
- [15. Altyapı ve Operasyon](#15-altyapı-ve-operasyon)
- [16. Test Stratejisi](#16-test-stratejisi)
- [17. Kod Organizasyonu ve Agent Kuralları](#17-kod-organizasyonu-ve-agent-kuralları)
- [18. Açık Kararlar — Tamamlanması Gerekenler](#18-açık-kararlar--tamamlanması-gerekenler)

---

## 1. Proje Kimliği ve Kapsam

**Karar [P-001]:** Proje, D&D 5e (tüm resmi yayınlanmış kaynak kitaplar — PHB, DMG, XGtE, TCoE, FToD ve diğerleri) için ücretsiz, açık, topluluk odaklı bir kampanya ve karakter yönetim platformudur. Konsept, D&D Beyond'un campaign/character/homebrew akışları ile 5e.tools'un DM Screen konseptinin birleşimidir.

**Karar [P-002]:** Proje kod adı / İngilizce tanımlayıcı: `dnd-companion` (klasör, repo, env prefix vb. için kullanılacak). Görünen ad "DnD Companion Platform". (ACTION-FIRST — itiraz edersen değiştiririz.)

**Karar [P-003]:** Ürün modeli — **"global read, scoped write"**: Tüm kullanıcı tarafından üretilen içerikler (campaign, character, homebrew) varsayılan olarak diğer kullanıcılar tarafından görüntülenebilir; ancak güncelleme/silme yetkisi içeriğin sahibine (veya ilgili campaign'in DM'ine, karakterler için) aittir. Bu, multi-tenant izolasyon modeli değildir — tek bir global içerik havuzu vardır, izolasyon "yazma" katmanında uygulanır. Detaylı yetki kuralları [AUTH-NNN] ve [R-NNN] bölümlerinde işlenecektir.

> Not: "Campaign'lerin herkese görünür olması" ile "campaign'e davetli olmayan kullanıcıların campaign içeriğini görmesi" arasındaki sınır Bölüm 4/5'te netleştirilecek — şimdilik prensip olarak kayda geçirildi, [AUTH-OPEN-1] olarak takip edilecek.

**Karar [P-004]:** Platform stratejisi — Tek bir responsive web uygulaması (masaüstü + mobil tarayıcı). Native mobil uygulama MVP kapsamı dışıdır.

**Karar [P-005]:** Monetizasyon — Yok. Proje tamamen ücretsiz ve açık bir topluluk projesidir; ödeme/abonelik altyapısı MVP'de yer almaz (bkz. [I-NNN] entegrasyonlar bölümünde ödeme entegrasyonu da yer almayacak).

**Karar [P-006]:** MVP kapsamı — Kullanıcının belirttiği tüm özellikler (campaign oluşturma/yönetimi, karakter oluşturma/yönetimi/character builder, DM Screen, homebrew oluşturma/paylaşma/koleksiyon sistemi, admin paneli, tüm resmi 5e kural verisi) **tek bir MVP fazında** ele alınacaktır. Hedef ölçek (10.000+ kullanıcı) nedeniyle Tech Stack (§14) ve Altyapı (§15) kararları bu ölçeği baştan destekleyecek şekilde alınacaktır.

**Karar [P-007]:** Hedef persona — İki fonksiyonel persona: **Dungeon Master (DM)** ve **Player (Oyuncu)**. Bunlar sistem rolü değildir (sistem rolleri `Admin`/`User`, bkz. [R-NNN]); bir kullanıcının bir campaign'i oluşturması onu o campaign'in DM'i yapar, davet kabul etmesi onu o campaign'in Player'ı yapar. Aynı kullanıcı bir campaign'de DM, başka birinde Player olabilir.

**Karar [P-008]:** Dil/Lokalizasyon — Arayüz dili sadece İngilizce (`en`). Çoklu dil desteği MVP kapsamı dışıdır, [P-OPEN] olarak not edilmedi çünkü kapsam dışı bırakıldı, açık karar değil.

**Karar [P-009]:** Coğrafya / regülasyon — Hedef coğrafya ABD/Global; KVKK/GDPR gibi özel regülasyon uyumu MVP önceliği değildir (hobi/topluluk projesi). Bununla birlikte temel veri gizliliği iyi pratikleri (şifreleme, güvenli kimlik doğrulama vb.) Bölüm 10'da standart olarak uygulanacaktır.

**Terminoloji Kilidi (İlk Kayıtlar):**
| Türkçe | English |
| --- | --- |
| Kampanya | Campaign |
| Karakter | Character |
| Ev yapımı içerik / Ev kuralı | Homebrew (content) |
| Yönetici Ekranı (oyun sırası hatırlatıcıları) | DM Screen |
| Sistem Referans Belgesi / Resmi kural verisi | SRD / Official Content | D&D 5e'nin resmi yayınlanmış kural verisi (tüm kaynak kitaplar) |
| Koleksiyon (beğenilen homebrew'lerin listesi) | Collection |
| Davet bağlantısı | Invite link |

---

## 2. Kullanıcı Havuzu ve Ölçek

**Karar [S-001]:** Hedef ölçek — Büyük ölçek (D&D Beyond benzeri, 10.000+ kayıtlı kullanıcı hedefi). Kullanım deseni "orta yoğunluk": gün boyunca dağılmış karakter görüntüleme/düzenleme trafiği + akşam/hafta sonu yoğunlaşan oyun seansları (campaign + DM Screen aktif kullanımı). Altyapı (§15) ve veritabanı/cache kararları (§14) bu profile göre boyutlandırılacaktır; kesin eşzamanlı kullanıcı sayısı erken aşamada net değildir, bu nedenle horizontal-scale edilebilir bir mimari ([TS-NNN]/[INF-NNN]) hedeflenir.

**Karar [S-002]:** Gerçek-zamanlılık ihtiyacı — Sınırlı kapsamlı real-time: DM Screen'de oyuncu karakterlerinin **seçili "canlı alanlar"** (örn. Current HP, Temporary HP, Conditions/durum etiketleri, Death Save durumu) WebSocket/SSE tabanlı anlık güncelleme ile DM'e iletilir. Karakter sayfasının diğer tüm alanları (envanter, yetenekler, açıklamalar vb.) standart request/refresh (polling değil, kullanıcı eylemiyle yeniden yükleme) ile senkronize olur. "Canlı alan" listesi [W-NNN] veya ilgili data modelinde (§14 Tech Stack altında real-time transport seçimiyle birlikte) netleştirilecektir.

**Karar [S-003]:** Misafir (anonim) erişim modeli — Kimlik doğrulaması yapılmamış ziyaretçiler şu içerikleri görüntüleyebilir: (a) Resmi 5e kural içeriği (statik referans, [I-001]), (b) `public` olarak işaretlenmiş paylaşılan homebrew içerikleri ve homebrew galerisi (`/homebrew`). Campaign sayfaları, karakter sayfaları, "my-campaigns", "my-characters", "my-creations", "my-collection" gibi kullanıcıya özel sayfalar ve davet akışına katılım **kimlik doğrulaması (authentication) gerektirir**. Bu route-guard kuralları [AUTH-NNN] içinde tanımlanacaktır.

**Karar [S-004]:** Coğrafya / veri ikametgâhı — [P-009] ile uyumlu: özel coğrafi kısıtlama yok, tek bölgeli (single-region) altyapı ile başlanır ([INF-NNN]'de bölge seçimi netleştirilecektir).

---

## 3. Kimlik Doğrulama ve Kullanıcı Yapısı

**Karar [A-001]:** Kimlik doğrulama yöntemi — Email + şifre (klasik form-based auth). Şifreler hash'lenerek saklanır (algoritma ve detaylar [SEC-NNN]'de belirlenecek). Oturum yönetimi (JWT vs session cookie) [AUTH-NNN]/[SEC-NNN]'de netleştirilecektir.

**Karar [A-002]:** MFA — MVP kapsamında **yoktur**. İleride opsiyonel TOTP eklenebilir; bu bir gelecek-fazı notu olarak [P-OPEN] yerine sadece bilgi notu olarak burada tutulur, açık karar değildir (karar verildi: yok).

**Karar [A-003]:** `User` veri modeli (master data, tek tablo — [P-003]/[A-004] ile uyumlu):

| Alan | Tip | Açıklama |
| --- | --- | --- |
| `id` | UUID (PK) | |
| `email` | string, unique | Giriş kimliği |
| `username` | string, unique | Görünen ad / profil URL'si için kullanılır |
| `password_hash` | string | bkz. [SEC-NNN] |
| `avatar_url` | string, nullable | |
| `role` | enum: `USER` \| `ADMIN` | bkz. [R-001] |
| `email_verified_at` | timestamp, nullable | bkz. [A-005] |
| `created_at` / `updated_at` | timestamp | |

**Karar [A-004]:** Master data / organizasyon yapısı — **Tek bir global `users` tablosu**, tenant/organizasyon kavramı yoktur ([P-003] ile uyumlu). `Campaign` bir tenant değildir; sadece bir içerik kaydıdır ve `owner_id` (DM) ile ilişkilendirilir.

**Karar [A-005]:** Email doğrulama — Kayıt sonrası email doğrulama linki gönderilir. `email_verified_at = NULL` iken **tüm yazma eylemleri** `EmailVerifiedGuard` ile engellenir (`403` + `EMAIL_NOT_VERIFIED`); doğrulanmamış kullanıcılar yalnızca misafir seviyesinde public içerik okuyabilir (detay: `docs/07_SECURITY_IMPLEMENTATION.md` Bölüm 4). Okuma endpoint'leri `@SkipEmailVerification()` ile istisna tanımlanır. **Güncelleme (2026-06-17):** Önceki ACTION-FIRST metni ([AUTH-OPEN-2] — kısmi kısıtlama listesi) supersede edildi; açık karar kapatıldı.

**Karar [A-006]:** Şifre sıfırlama — Standart "email ile sıfırlama linki" akışı (ACTION-FIRST). Email gönderimi altyapısı [N-NNN]/[INF-NNN] içinde ele alınacaktır.

---

## 4. Yetkilendirme Mimarisi

**Karar [AUTH-001]:** Yetkilendirme modeli — **Hibrit: Sistem Rolü (RBAC) + Sahiplik/İlişki Bazlı Erişim (Ownership/Relationship-based, "ReBAC-lite")**. İki katman:
1. **Sistem rolü katmanı:** `ADMIN` rolü, tüm kaynaklar üzerinde sahiplik kontrolünü bypass eder (bkz. [AUTH-008], [R-001]).
2. **Sahiplik/ilişki katmanı:** `USER` rolündeki kullanıcılar için her kaynak tipi (`Campaign`, `Character`, `Homebrew`) kendi sahiplik/ilişki kurallarına göre erişim alır (bkz. [AUTH-005]–[AUTH-007]).

**Karar [AUTH-002]:** Yetki çözümleme stratejisi — **Runtime, cache'siz**. Her okuma/yazma isteğinde, ilgili kaynağın sahiplik (`owner_id`) ve/veya campaign ilişkisi (`campaign.dm_id`, `campaign_members`) bilgisi DB'den indeksli sorgu ile alınır ve istek atan kullanıcı ile karşılaştırılır. Gerekçe: kurallar tek-satır + index lookup düzeyinde basit; cache invalidation riski (üyelikten çıkarılan kullanıcının stale cache ile erişime devam etmesi) bu ölçekte (10k+ kullanıcı, orta yoğunluk [S-001]) kabul edilen DB yükünden daha maliyetlidir. İleride hedefli cache eklenmesi gerekirse yeni bir karar olarak eklenir (mevcut karar supersede edilmeden).

**Karar [AUTH-003]:** Guard/enforcement mekanizması — Yetki kontrolleri backend'de **merkezi bir authorization middleware/guard katmanında** uygulanır; controller/route handler'lar policy fonksiyonlarını çağırır (`can(user, action, resource)` deseni). Frontend yetki kontrolleri (buton/aksiyon gizleme) sadece UX amaçlıdır, **güvenlik sınırı backend'dedir**. Klasör yapısı detayı [CODE-NNN]'de.

**Karar [AUTH-004]:** Campaign görünürlük (read) kuralı — Bir campaign'in **tüm içeriği** (temel bilgiler, DM Screen notları, üye/oyuncu listesi, campaign'e bağlı karakterler) **sadece o campaign'in DM'i (owner) ve `campaign_members` tablosunda kayıtlı Player'lar** tarafından görüntülenebilir. Davetli olmayan kullanıcılar campaign'i listede göremez, doğrudan URL ile de erişemez (403/404). Bu, [P-003]'teki "global read" prensibinin **Campaign kaynağı için istisnasıdır** — istisna burada açıkça kayda geçirilmiştir, [P-003] metni bu istisnaya atıfta bulunacak şekilde güncellenecektir.

> [P-003] güncelleme notu: "global read, scoped write" prensibi `Character` (kurallara göre) ve `Homebrew` (varsayılan public) kaynakları için geçerlidir; `Campaign` kaynağı tamamen üyelik bazlı (private) görünürlüğe sahiptir.

**Karar [AUTH-005]:** Character görünürlük (read) kuralı — Bir karakterin görünürlüğü iki kuralın **OR**'udur:
1. Karakterin `visibility` alanı `PUBLIC` ise → herkes (misafir dahil, [S-003]) görüntüleyebilir. Varsayılan değer `PRIVATE`'dir, sahibi değiştirebilir.
2. Karakter bir campaign'e atanmışsa (`campaign_id` set) → `visibility` değerinden bağımsız olarak, o campaign'in DM'i ve diğer üyeleri (campaign_members) karakteri görüntüleyebilir (oyun masası ihtiyacı — DM ve takım arkadaşları birbirinin sayfasını görmelidir).

Bunların dışında (private + campaign'e atanmamış veya ilgisiz kullanıcı) karakter sadece sahibi tarafından görüntülenebilir.

**Karar [AUTH-006]:** Character-Campaign ilişkisi — **1:1, opsiyonel** (basit model). `Character.campaign_id` nullable FK. Bir karakter aynı anda **en fazla bir** campaign'e atanabilir; atanmamış (`campaign_id = NULL`) karakterler "bağımsız" karakterlerdir ve sadece [AUTH-005] kural 1'e göre görünür.

**Karar [AUTH-007]:** Yazma (update/delete) yetki matrisi — Aşağıdaki tablo `USER` rolü için geçerlidir (`ADMIN` için bkz. [AUTH-008]):

| Kaynak | Kim güncelleyebilir/silebilir |
| --- | --- |
| `Campaign` | Sadece `Campaign.owner_id == user.id` (DM, oluşturan kişi). Player'lar campaign'i güncelleyemez. |
| `Character` | (a) `Character.owner_id == user.id` (karakterin sahibi/oyuncusu), **VEYA** (b) karakter bir campaign'e atanmışsa ve `Character.campaign.dm_id == user.id` (o campaign'in DM'i). |
| `Homebrew` (her türü: background, feat, magic item, monster, spell, subclass) | Sadece `Homebrew.owner_id == user.id`. |
| `User` (kendi profili) | Sadece kendi hesabı (`User.id == user.id`) — email, şifre, avatar vb. |

Cross-ref: [AUTH-006] (campaign-character ilişkisi), [R-002] (Player/DM kavramının rol değil ilişki olduğu).

**Karar [AUTH-008]:** Admin override — `ADMIN` rolündeki kullanıcılar, [AUTH-007]'deki tüm sahiplik kontrollerini bypass ederek **tüm** `Campaign`, `Character`, `Homebrew` ve `User` kayıtlarını görüntüleyebilir, güncelleyebilir ve silebilir (Admin Panel üzerinden, bkz. [AP-NNN]). Bu bypass, [AUTH-002]'deki runtime check'in bir parçası olarak `user.role == ADMIN` kontrolü ile en üst seviyede uygulanır (policy fonksiyonunun ilk adımı).

**Karar [AUTH-009]:** Campaign üyelik modeli — `campaign_members` join tablosu (`campaign_id`, `user_id`, `joined_at`). DM, `Campaign.owner_id` alanı ile temsil edilir ve bu tabloya **ayrıca eklenmez** (DM zaten örtük üyedir). Davet akışı [W-NNN]'de süreç olarak detaylandırılacaktır.

---

## 5. Roller ve Yetki Yönetimi

**Karar [R-001]:** Sistem rolleri — İki sistem rolü vardır: `ADMIN` ve `USER` (`User.role` enum, bkz. [A-003]). Yeni kayıt olan her kullanıcı varsayılan olarak `USER` rolüyle oluşturulur.

**Karar [R-002]:** "DM" ve "Player" bir sistem rolü **değildir** — bunlar [P-007]'de tanımlandığı gibi, kullanıcının bir `Campaign` ile ilişkisinden doğan **bağlamsal (contextual) konumlardır**: `Campaign.owner_id == user.id` → o campaign'de DM; `campaign_members` tablosunda kayıt → o campaign'de Player. Aynı kullanıcı farklı campaign'lerde farklı konumlarda olabilir. Yetki kuralları [AUTH-007]/[AUTH-009]'da bu ilişkilere dayanır.

**Karar [R-003]:** ADMIN rolü ataması — İlk admin hesabı, deployment sırasında bir **seed script / env değişkeni** ile oluşturulur (`SEED_ADMIN_EMAIL` gibi, detay [INF-NNN]). Sonrasında, sadece mevcut bir `ADMIN`, Admin Panel üzerinden ([AP-NNN]) başka bir kullanıcının rolünü `USER` ↔ `ADMIN` arasında değiştirebilir. Bir admin kendi rolünü `USER`'a düşürebilir ancak sistemde **en az bir ADMIN kalması zorunludur** (son admin rolünü düşüremez — bu kural backend'de zorlanır).

**Karar [R-004]:** Yetki sabitleri — Roller (`ADMIN`/`USER`) ve eylem türleri (`create`/`read`/`update`/`delete` + kaynak tipi: `campaign`/`character`/`homebrew`/`user`) kod tabanında merkezi bir enum/constant dosyasında tutulur (örn. `permissions.ts` veya backend dilinin karşılığı); [AUTH-003]'teki policy fonksiyonları bu sabitleri referans alır. Klasör konumu [CODE-NNN]'de netleştirilecektir.

---

## 6. Süreç (Workflow) Mimarisi

Bu ürün ağırlıklı olarak CRUD'dur; gerçek bir state machine sadece Homebrew yaşam döngüsünde vardır. Diğer akışlar (davet, campaign'e karakter atama) basit token/ilişki işlemleridir, dört katmanlı açıklama gerektirmeyecek kadar basittir ama netlik için kayda geçirilmiştir.

**Karar [W-001]:** Campaign davet linki — Token tabanlı, **tekrar kullanılabilir ve yenilenebilir** link.
- **Data:** `campaigns.invite_token` (string, unique, nullable — `NULL` = davet kapalı/devre dışı).
- **Backend:** `POST /campaigns/:id/invite/regenerate` (sadece DM, [AUTH-007]) yeni rastgele token üretir, eskisini geçersiz kılar (eski linkler artık çalışmaz). `POST /campaigns/:id/invite/disable` token'ı `NULL` yapar. `POST /invite/:token/join` — **authentication zorunlu** ([S-003]); token geçerliyse ve kullanıcı zaten üye/DM değilse `campaign_members`'a satır eklenir.
- **UI:** Campaign sayfasında (sadece DM'e görünür) "Invite Link" alanı: kopyala / yenile / devre dışı bırak butonları. Linke tıklayan giriş yapmış kullanıcıya "Bu campaign'e katılmak istiyor musunuz?" onay ekranı gösterilir.

**Karar [W-002]:** Karakter durumu (status) yok — Karakterler "taslak/tamamlandı" gibi bir duruma sahip değildir; D&D Beyond modeline benzer şekilde **her zaman düzenlenebilir bir sheet**'tir. Character builder, sheet'in farklı bir görünüm modu olarak ele alınır (aynı veri, farklı UI sekmesi). Cross-ref: [AUTH-007].

**Karar [W-003]:** Homebrew yayınlama süreci — **2 durumlu state machine: `DRAFT` → `PUBLISHED`** (ve geri: `PUBLISHED` → `DRAFT`, "unpublish").

  - **Anlamı:** Bir homebrew içerik oluşturulduğunda varsayılan olarak `DRAFT`'tır — sadece sahibi görür ve kendi karakterlerinde kullanabilir. Sahip "Publish" eylemiyle içeriği `PUBLISHED` yapar: bu noktadan sonra `/homebrew` galerisinde herkese (misafir dahil, [S-003]) görünür ve diğer kullanıcılar bunu kendi `Collection`'larına ekleyebilir. Sahip isterse `PUBLISHED` içeriği `DRAFT`'a geri alabilir ("unpublish") — bu, galeriden kaldırır ve yeni koleksiyon eklemelerini durdurur, ancak **içeriği daha önce koleksiyonuna eklemiş kullanıcılar erişimini kaybetmez** (referans korunur, UI'da "yazar tarafından yayından kaldırıldı" rozeti gösterilebilir).
  - **Backend:** `PATCH /homebrew/:id/publish` ve `/unpublish` — sadece sahibi ([AUTH-007]). `GET /homebrew` (galeri) sadece `status = PUBLISHED` kayıtları döner; misafir erişimine açıktır ([S-003]).
  - **Data:** `homebrew_items.status` enum (`DRAFT` \| `PUBLISHED`), `homebrew_items.published_at` (timestamp, nullable). `collection_items` join tablosu (`user_id`, `homebrew_item_id`, `added_at`) — `status` değerinden bağımsız olarak referansı tutar.
  - **UI:** "My Creations" sayfasında her öğenin yanında Draft/Published rozeti + toggle butonu. `/homebrew` galerisi sadece Published öğeleri listeler. "My Collection" sayfası, owner tarafından unpublish edilmiş öğeleri de (rozetle) gösterir.

**Karar [W-004]:** Karaktere campaign atama akışı — Bir kullanıcı [W-001] ile bir campaign'e katıldığında (veya zaten üyeyken), "My Characters" sayfasından mevcut bir karakterini o campaign'e **atayabilir** (`Character.campaign_id` set edilir) ya da campaign bağlamından doğrudan yeni karakter oluşturabilir (builder'da campaign önceden seçili gelir). Bir karakter [AUTH-006] uyarınca aynı anda yalnızca bir campaign'e atanabilir; başka bir campaign'e atanmak istenirse önce mevcut atama kaldırılmalıdır (`campaign_id = NULL`).

---

## 7. Görev Yönetimi

> ⚪ Bu bölüm proje sahibi talimatıyla kapsam dışı bırakıldı (gerekçe: projede atama/durum bazlı bir "task/ticket" kavramı yok; DM Screen içeriği [D-NNN]/[W-NNN]'de basit not/widget olarak ele alınır).

---

## 8. Doküman Yönetimi

**Karar [D-001]:** Yüklenebilir dosya türleri (MVP) — Sadece görsel: kullanıcı **avatar**'ı, **karakter portresi**, **campaign banner görseli**, **homebrew item görseli** (sihirli eşya/yaratık/alt sınıf vb. için tek görsel). Diğer dosya türleri (PDF, ses vb.) MVP kapsamı dışıdır.

**Karar [D-002]:** Depolama — **S3-uyumlu object storage** (AWS S3 veya Cloudflare R2 — kesin sağlayıcı [INF-NNN]'de) + CDN, **public-read** bucket/erişim politikası. Gerekçe: görseller hassas veri değildir, [P-003]'teki "global read" prensibiyle uyumludur; signed URL karmaşıklığına gerek yoktur.

**Karar [D-003]:** Meta-veri modeli — Ayrı bir "files/media" tablosu **kullanılmaz**; her görsel, ait olduğu varlığın üzerinde bir URL alanı olarak tutulur:
- `users.avatar_url` (bkz. [A-003])
- `characters.portrait_url`
- `campaigns.banner_url`
- `homebrew_items.image_url`

Gerekçe: MVP'de görseller arası ilişki/yeniden kullanım (deduplication) gereksinimi yok; basitlik önceliklidir.

**Karar [D-004]:** Upload akışı — **Presigned URL** deseni: İstemci backend'den ilgili kaynak için presigned PUT URL ister (`POST /uploads/presign`, authentication zorunlu), dosyayı doğrudan object storage'a yükler, ardından dönen public URL'i ilgili varlığın `*_url` alanına `PATCH` ile kaydeder. Gerekçe: büyük dosyaların app sunucusu üzerinden proxy edilmesini önler, [S-001]'deki ölçek hedefiyle uyumludur.

**Karar [D-005]:** Validasyon — Sadece `image/png`, `image/jpeg`, `image/webp` MIME tipleri kabul edilir; maksimum dosya boyutu **5 MB**. Hem presign isteğinde (content-type kontrolü) hem de istemci tarafında (önizleme öncesi) doğrulanır. Magic-byte/içerik doğrulaması (uzantı sahteciliğine karşı) [SEC-NNN]'de detaylandırılacaktır.

**Karar [D-006]:** Virüs tarama — MVP kapsamında **yoktur** (hobby/topluluk projesi, [P-005]/[P-009] ile uyumlu — özel regülasyon önceliği yok). Risk azaltımı [D-005]'teki MIME/boyut/magic-byte kontrolleriyle sınırlıdır. Bu bir açık karar değildir — bilinçli olarak MVP dışı bırakılmıştır.

**Karar [D-007]:** Görsel yeniden boyutlandırma — MVP'de **istemci tarafında** (upload öncesi, tarayıcıda) maksimum boyuta küçültme yapılır (ACTION-FIRST, örn. avatar 512x512, portre/banner 1600px genişlik). Sunucu taraflı image processing/CDN-transform pipeline'ı MVP kapsamı dışıdır.

---

## 9. Admin Panelleri

**Karar [AP-001]:** Admin Panel ekranları (sadece `ADMIN` rolüne görünür, [R-001]/[AUTH-008]):
1. **Kullanıcı Yönetimi** — tüm kullanıcıları listele/ara, rol değiştir ([R-003]), deaktive et/yeniden aktive et ([AP-002]).
2. **Campaign Yönetimi** — tüm campaign'leri listele/ara (üyelik kısıtlaması olmadan, [AUTH-004] bypass), görüntüle, düzenle, sil.
3. **Character Yönetimi** — tüm karakterleri listele/ara (`visibility`'den bağımsız, [AUTH-005] bypass), görüntüle, düzenle, sil.
4. **Homebrew Yönetimi** — tüm homebrew içeriklerini (her tür) listele/ara (`status`'tan bağımsız, [W-003] bypass), görüntüle, düzenle, sil, publish/unpublish durumunu değiştir.

**Karar [AP-002]:** Kullanıcı "silme" = **soft delete (deaktivasyon)**. `User.is_active` (boolean, default `true`). Admin bir kullanıcıyı deaktive ettiğinde:
- `is_active = false` olur, kullanıcı **giriş yapamaz** (login endpoint'i kontrol eder).
- Kullanıcının içerikleri (campaign/character/homebrew) **veritabanında kalır**, silinmez.
- Deaktive kullanıcıya ait içerikler, [AUTH-004]/[AUTH-005]/[W-003] görünürlük kurallarında **diğer normal kullanıcılardan gizlenir** (sahibinin `is_active = false` olması, içeriği başkalarına göstermeme için ek bir koşuldur). `ADMIN` bu içerikleri Admin Panel'den görmeye devam eder.
- Admin işlemi **geri alınabilir** (`is_active = true` ile yeniden aktive edilebilir); içerikler otomatik olarak tekrar görünür hale gelir.

**Karar [AP-003]:** Kullanıcı askıya alma (suspend, ban) — MVP kapsamında **yoktur** ([AP-002]'deki deaktivasyon bu ihtiyacı karşılar). Açık bir karar değildir, bilinçli olarak kapsam dışıdır.

**Karar [AP-004]:** İçerik (Campaign/Character/Homebrew) silme — Admin tarafından yapılan içerik silme işlemleri **hard delete**'tir (kullanıcı silme [AP-002]'den farklı olarak — içerikler genellikle kişisel veri değil, oyun verisidir). Cascade kuralları (örn. bir campaign silinince `campaign_members` ve atanmış karakterlerin `campaign_id`'si nasıl davranır) [TS-NNN]/veri modeli detaylandırmasında netleştirilecektir; varsayılan: campaign silinince `campaign_members` satırları silinir, karakterlerin `campaign_id` alanı `NULL`'a düşer (karakterler silinmez).

**Karar [AP-005]:** Audit log ekranı — MVP'de **yoktur**. Bölüm 11 (Denetim/Audit Log) ile birlikte değerlendirilecek bir açık karardır → [AUD-OPEN-1] (Bölüm 18'e işlenecek).

---

## 10. Güvenlik ve KVKK

> **Hedef güvenlik seviyesi:** OWASP ASVS **L1** (temel düzey). [P-005]/[P-009] ile uyumlu: ücretsiz/hobi proje, özel regülasyon (KVKK/GDPR tam uyum) hedefi yok, ancak kullanıcı hesapları ve şifreler bulunduğundan temel iyi pratikler (kimlik doğrulama, oturum, transport, input validation, secrets) eksiksiz uygulanır.

### 10.1 Kimlik Doğrulama & Şifre Güvenliği

**Karar [SEC-001]:** Şifre hash algoritması — **Argon2id** (modern, ASVS L1 önerisi), minimum parametreler: `memory=19MB, iterations=2, parallelism=1` (OWASP önerisi, kullanılan dilin kütüphane defaultlarına göre ayarlanır). `password_hash` alanı dışında şifre **hiçbir zaman** loglanmaz veya API yanıtında dönmez.

**Karar [SEC-002]:** Şifre politikası — Minimum **8 karakter**, karmaşıklık kuralı (büyük/küçük harf/sembol zorunluluğu) **yok** (NIST SP 800-63B ile uyumlu — kullanıcı deneyimini bozan kompleks kurallar yerine uzunluk önceliklidir). Yaygın/sızdırılmış şifre kontrolü (örn. HaveIBeenPwned API) MVP'de **yoktur**, [SEC-OPEN-1] (🟢 düşük öncelik) olarak işaretlenmiştir.

**Karar [SEC-003]:** Login hata mesajları — Email/şifre hatalarında **genel mesaj** ("Invalid email or password") döner; hangi alanın hatalı olduğu (email mevcut değil vs şifre yanlış) belirtilmez (account enumeration önleme).

### 10.2 Oturum Yönetimi (JWT)

**Karar [SEC-004]:** Oturum modeli — **JWT access token + refresh token** ikilisi:
- **Access token:** Ömür **15 dakika**, imzalama algoritması **HS256** (tek backend servisi, [TS-NNN]; mikroservis ihtiyacı doğarsa RS256'ya geçiş yeni bir karar olarak eklenir). İstemci tarafında **memory'de** tutulur (localStorage/sessionStorage **kullanılmaz** — XSS ile token çalınmasını önlemek için), `Authorization: Bearer` header ile gönderilir.
- **Refresh token:** Ömür **30 gün**, `httpOnly`, `Secure`, `SameSite=Strict` cookie'de saklanır. Backend'de hash'lenerek DB'de tutulur (token çalınması durumunda iptal edilebilmesi için).

**Karar [SEC-005]:** Refresh token rotation — Her refresh işleminde **yeni refresh token üretilir, eski token geçersiz kılınır** (rotation). Geçersiz/kullanılmış bir refresh token tekrar kullanılmaya çalışılırsa ("reuse detection"), bu kullanıcının **tüm aktif refresh token'ları iptal edilir** (olası çalıntı token senaryosuna karşı tüm cihazlardan çıkış).

**Karar [SEC-006]:** CSRF — Sadece `/auth/refresh` endpoint'i cookie tabanlıdır; `SameSite=Strict` ayarı bu endpoint için CSRF riskini pratikte ortadan kaldırır (cross-site istekler cookie'yi taşımaz). Diğer tüm endpoint'ler `Authorization: Bearer` header kullanır (cookie'siz), bu nedenle ek bir CSRF token mekanizmasına gerek yoktur.

### 10.3 Transport & HTTP Güvenlik Başlıkları

**Karar [SEC-007]:** HTTPS — Tüm trafik HTTPS üzerinden zorunlu kılınır (HTTP → HTTPS redirect, [INF-NNN]'de altyapı seviyesinde). `Strict-Transport-Security: max-age=31536000; includeSubDomains` header'ı eklenir.

**Karar [SEC-008]:** HTTP güvenlik başlıkları (ACTION-FIRST varsayılanlar):
| Header | Değer |
| --- | --- |
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Content-Security-Policy` | Başlangıç: `default-src 'self'; img-src 'self' <cdn-domain> data:; connect-src 'self' <api-domain>` — frontend stack belirlendikten sonra ([TS-NNN]) inline-script ihtiyacına göre nonce/hash eklenecek şekilde detaylandırılır. |

**Karar [SEC-009]:** CORS — API, sadece frontend'in origin'ine (env var ile yapılandırılan allowlist, örn. `https://app.dnd-companion.com`) izin verir; `Access-Control-Allow-Credentials: true` sadece `/auth/refresh` için gereklidir (cookie taşıyan tek endpoint).

### 10.4 Input Validation, Rate Limiting & Dosya Güvenliği

**Karar [SEC-010]:** Input validation — Tüm API endpoint'leri için **schema-based validation** ([TS-NNN]'de seçilecek kütüphane, örn. Zod/Joi/Pydantic) zorunludur; doğrulanmamış input controller'a ulaşmaz. SQL injection riski ORM/parametrik sorgular ile (bkz. [TS-NNN]) bypass edilmez — raw SQL string concatenation yasaktır ([CODE-NNN]'e agent yasağı olarak eklenecek).

**Karar [SEC-011]:** Rate limiting — Brute-force koruması: `/auth/login`, `/auth/register`, `/auth/password-reset` endpoint'leri için IP başına **5 istek / 15 dakika** sınırı (örn. Redis tabanlı sliding-window). Aşılırsa `429 Too Many Requests`. Genel API için global bir rate limit ([INF-NNN]'de reverse proxy/CDN seviyesinde) ayrıca uygulanır.

**Karar [SEC-012]:** Dosya yükleme güvenliği — [D-005]'e ek olarak: yüklenen görsellerin **magic-byte (içerik) doğrulaması** yapılır (uzantı/MIME header'a güvenilmez). SVG formatı **kabul edilmez** (script injection riski) — [D-005]'teki kabul edilen formatlar (`png`/`jpeg`/`webp`) bu riski zaten dışlar, burada teyit edilmiştir.

### 10.5 Secrets, Veri Sınıflandırma & KVKK-benzeri Haklar

**Karar [SEC-013]:** Secrets yönetimi — Tüm secret'lar (DB bağlantı bilgisi, JWT imzalama anahtarı, S3/R2 anahtarları, SMTP bilgileri) **environment variable** olarak tutulur, repo'da `.env` dosyası **commit edilmez** (`.env.example` ile şablon sağlanır). Production secret'ları deployment platformunun secret store'unda tutulur ([INF-NNN]).

**Karar [SEC-014]:** Veri sınıflandırması — `email` ve `password_hash` alanları **PII/hassas** kabul edilir: `email` sadece hesap sahibi ve `ADMIN`'e API yanıtlarında döner (diğer kullanıcılara `username` + `avatar_url` görünür); `password_hash` **hiçbir zaman** API yanıtında dönmez. Diğer tüm veri (campaign/character/homebrew içerikleri) oyun verisi olarak sınıflandırılır, [AUTH-NNN] görünürlük kuralları geçerlidir.

**Karar [SEC-015]:** Hesap silme (kullanıcı talebiyle) — Kullanıcı, hesap ayarlarından **kendi hesabını deaktive edebilir** (self-service, [AP-002] ile aynı mekanizma — `is_active = false`). Tam kalıcı silme (hard delete, "right to erasure" benzeri) MVP'de yoktur; talep gelirse Admin manuel olarak değerlendirir. Bu, [P-009]'daki "KVKK/GDPR tam uyum hedefi yok" kararıyla uyumludur ve [SEC-OPEN-2] (🟢 düşük öncelik) olarak not edilmiştir.

### 10.6 Bağımlılık ve CI Güvenliği

**Karar [SEC-016]:** Dependency scanning — CI pipeline'ında otomatik bağımlılık güvenlik taraması (örn. `npm audit` / Dependabot / Snyk free tier) çalıştırılır; **kritik (critical) seviye** zafiyetler build'i kırar (cross-ref [TEST-NNN]/[INF-NNN]).

---

## 11. Denetim (Audit Log)

**Karar [AUD-001]:** Audit log kapsamı — MVP'de **sadece `ADMIN` eylemleri** loglanır:
- Bir kullanıcının rolünün değiştirilmesi (`USER` ↔ `ADMIN`, [R-003]).
- Bir kullanıcının deaktive/reaktive edilmesi ([AP-002]).
- Admin'in, sahibi olmadığı bir `Campaign`/`Character`/`Homebrew` kaydını düzenlemesi veya silmesi ([AP-001]/[AP-004]).

Normal kullanıcıların kendi içerikleri üzerindeki işlemleri (kendi campaign'ini düzenleme vb.) loglanmaz — bu, [AUD-OPEN] kapsamına alınmamıştır, bilinçli olarak MVP dışıdır.

**Karar [AUD-002]:** Audit log şeması — `audit_logs` tablosu:

| Alan | Tip | Açıklama |
| --- | --- | --- |
| `id` | UUID (PK) | |
| `actor_id` | UUID (FK → users) | İşlemi yapan ADMIN |
| `action` | enum | `ROLE_CHANGED`, `USER_DEACTIVATED`, `USER_REACTIVATED`, `CONTENT_EDITED`, `CONTENT_DELETED` |
| `target_type` | enum | `USER`, `CAMPAIGN`, `CHARACTER`, `HOMEBREW` |
| `target_id` | UUID | Etkilenen kaydın ID'si |
| `metadata` | JSONB | Değişiklik detayları (örn. `{"old_role": "USER", "new_role": "ADMIN"}`) |
| `created_at` | timestamp | |

**Karar [AUD-003]:** Tamper-evidence (chain hash) — MVP'de **uygulanmaz** (ASVS L1, [P-009]). `audit_logs` tablosuna uygulama katmanında **UPDATE/DELETE yasaktır** (sadece INSERT) — bu, append-only davranışı için yeterli kabul edilmiştir. Chain-hash mekanizması [AUD-OPEN-2] (🟢 düşük öncelik) olarak not edilmiştir.

**Karar [AUD-004]:** Görüntüleme — MVP'de dedicated bir Admin Panel ekranı **yoktur** ([AP-005]/[AUD-OPEN-1] ile aynı açık karar). Veri DB'de tutulur, gerektiğinde doğrudan sorgu ile incelenebilir; UI eklenmesi ileride [AUD-OPEN-1]'i kapatır.

**Karar [AUD-005]:** Retention — Süresiz saklanır (hacim düşük — sadece admin eylemleri). Otomatik silme/arşivleme politikası MVP'de yoktur.

---

## 12. Entegrasyonlar

**Karar [I-001]:** D&D 5e kural verisi — **Tüm yayınlanmış 5e içeriği import edilir** (kendi DB'mizde tutulur). Veri kaynakları (dnd5e.wikidot.com, Open5e ve benzeri topluluk referansları) üzerinden hazırlanan JSON dosyaları, tek seferlik bir seed/import script'i ile `spells`, `monsters`, `classes`, `subclasses`, `feats`, `backgrounds`, `magic_items`, `races` gibi tablolara yüklenir. Kapsam: Player's Handbook (PHB), Dungeon Master's Guide (DMG), Xanathar's Guide to Everything (XGtE), Tasha's Cauldron of Everything (TCoE), Fizban's Treasury of Dragons (FToD), Van Richten's Guide to Ravenloft (VRGR), Mordenkainen Presents: Monsters of the Multiverse (MPMM) ve diğer resmi 5e kaynakları. Runtime'da **dış API bağımlılığı yoktur** ([S-001] ölçek hedefiyle uyumlu). Homebrew içerikler ([W-003]) bu tablolarla aynı şemada, `source` alanı ile ayrışır: resmi içerikler kitap kodunu (`PHB`, `XGTE`, `TCOE`, `DMG`, `FTOD`, `VRGR`, `MPMM` vb.), kullanıcı içerikleri `HOMEBREW` değerini taşır. Arama/filtreleme tek sorguda resmi+homebrew içeriği kapsar, `source` filtresi ile kitap bazlı daraltma yapılabilir. Lisans/atıf sorumluluğu deployment sahibine aittir; kod tabanında atıf mekanizması (About sayfası, footer) hazır bırakılır.

**Karar [I-002]:** Email gönderimi — **Gmail SMTP** (kullanıcının kendi Google hesabı, App Password ile). Şifre sıfırlama ([A-006]) ve email doğrulama ([A-005]) email'leri bu SMTP üzerinden gönderilir. SMTP kimlik bilgileri [SEC-013] (env var/secret store) ile yönetilir. Ölçek/limit konuları için ek bir not talep edilmemiştir.

---

## 13. Bildirim Sistemi

> ⚪ Bu bölüm proje sahibi talimatıyla kapsam dışı bırakıldı (gerekçe: in-app bildirim sistemi ihtiyacı yok; transactional email akışları [I-002], [A-005], [A-006] ile yeterince kapsanıyor).

---

## 14. Tech Stack

**Karar [TS-001]:** Genel mimari — **Monorepo**, iki ayrı paket: `apps/web` (frontend), `apps/api` (backend). Tüm kod **TypeScript**'tir (uçtan uca tip güvenliği).

**Karar [TS-002]:** Backend framework — **NestJS**. Gerekçe: decorator-based Guard/Interceptor mekanizması [AUTH-003]'teki merkezi policy katmanı ile doğrudan örtüşür; modüler yapı (her kaynak tipi — campaign/character/homebrew/user — kendi modülü) büyük ölçekli kod tabanını organize eder; built-in `@nestjs/websockets` (Socket.io adapter) [TS-004] ile, `class-validator` ise [SEC-010]'daki input validation ile doğal uyumludur.

**Karar [TS-003]:** Veritabanı + ORM — **PostgreSQL + Prisma**. Gerekçe: ilişkisel veri (User/Campaign/Character/CampaignMember) için güçlü FK/ilişki desteği + JSONB alanları (homebrew'in tip-bazlı esnek alanları, örn. bir `magic-item`'in özellikleri ile bir `spell`'in özellikleri farklı şema gerektirir) için Prisma'nın `Json` tipi kullanılır. Prisma migration'ları şema değişikliklerini versiyonlar.

**Karar [TS-004]:** Real-time transport — **WebSocket (Socket.io)**, NestJS `@nestjs/websockets` gateway üzerinden. [S-002]'deki "canlı alanlar" (HP, durum etiketleri, death save) için kullanılır. Oda (room) modeli: her campaign bir Socket.io room'udur (`campaign:<id>`); bir karakterin canlı alanı güncellendiğinde, ilgili `campaign:<id>` room'una event yayınlanır, sadece o campaign'in DM'i ve üyeleri dinler (room'a katılım [AUTH-004]/[AUTH-009]'daki üyelik kontrolüyle doğrulanır).

**Karar [TS-005]:** API stili — **REST**. Kaynaklar: `/users`, `/campaigns`, `/campaigns/:id/members`, `/characters`, `/homebrew/:type` (background/feat/magic-item/monster/spell/subclass), `/reference/*` (resmi 5e kural verisi, read-only, [I-001]).

**Karar [TS-006]:** Frontend framework — **React + Vite**.

**Karar [TS-007]:** Frontend state yönetimi — **Redux Toolkit**, API çağrıları için **RTK Query** (Redux Toolkit'in resmi data-fetching katmanı — ayrı bir TanStack Query'ye gerek bırakmaz, cache/invalidation Redux store ile entegre). ACTION-FIRST: RTK Query eklentisi, itiraz edersen ayrı bir HTTP client (axios) + manuel thunk'lara döneriz.

**Karar [TS-008]:** UI kit / styling — **Tailwind CSS + shadcn/ui**.

**Karar [TS-009]:** Validation — Backend: `class-validator` + `class-transformer` (NestJS DTO'ları, [SEC-010] ile uyumlu). Frontend: **React Hook Form + Zod** (ACTION-FIRST) — özellikle karakter builder gibi çok adımlı/karmaşık formlar için.

**Karar [TS-010]:** Auth kütüphaneleri — `@nestjs/passport` + `passport-jwt` (JWT strategy, [SEC-004]), şifre hashleme için `argon2` (npm paketi, [SEC-001]).

**Karar [TS-011]:** Frontend routing — **React Router**.

**Karar [TS-012]:** Monorepo tooling — **pnpm workspaces** (Turborepo veya benzeri ek araç **yok**, ACTION-FIRST — basitlik önceliklendirildi; proje büyürse build-cache ihtiyacı yeni bir karar olarak eklenebilir).

---

## 15. Altyapı ve Operasyon

**Karar [INF-001]:** Deployment platformu (backend + PostgreSQL + Redis + object storage) — **Henüz belirlenmedi**, proje sahibi geliştirme ilerledikten sonra karar verecek. → [INF-OPEN-1] (🟠 yüksek öncelik) olarak Bölüm 18'e işlenmiştir. Mimari, platform-agnostik tutulur (Docker container'lar ile paketlenir — ACTION-FIRST — böylece Railway/Render/Fly.io/AWS gibi seçeneklerin hepsiyle uyumlu kalır).

**Karar [INF-002]:** Frontend hosting — Backend ile **aynı platformda statik hosting** (ayrı bir Vercel/Netlify gibi servis kullanılmaz). NestJS, derlenen frontend build çıktısını (`apps/web/dist`) statik dosya olarak serve eder (ACTION-FIRST — basitlik ve [INF-001] kararına bağımlılığı azaltmak için tek deployment birimi).

**Karar [INF-003]:** CI/CD — **GitHub Actions**. Pipeline: lint → test (bkz. [TEST-NNN]) → build → (manuel onay gate) → deploy. Deploy adımının somut konfigürasyonu [INF-001] netleşince tamamlanacaktır; standing rule [TEST-NNN]'de tanımlı: "agent kullanıcı onayı olmadan main'e merge etmez / production'a deploy etmez".

**Karar [INF-004]:** Environment stratejisi — **Üç ortam**: `development` (lokal), `staging`, `production`. Her ortamın kendi PostgreSQL veritabanı, Redis instance'ı ve object storage bucket'ı (veya bucket prefix'i) vardır; ortamlar arası veri sızıntısı olmaz. Env değişkenleri ortam başına ayrı tutulur ([SEC-013]).

**Karar [INF-005]:** Redis kullanımı — Redis, şu amaçlarla kullanılır: (1) [SEC-011] rate limiting (login/register/password-reset sayaçları), (2) [TS-004] Socket.io horizontal scaling için Redis adapter (birden fazla backend instance'ı arasında WebSocket event yayını). Redis'in barındırılacağı yer [INF-001]'e bağımlıdır.

**Karar [INF-006]:** Loglama — Backend, **structured JSON logging** kullanır (NestJS built-in Logger veya `pino`, ACTION-FIRST). Loglar stdout'a yazılır; toplama/retention stratejisi [INF-001] platformuna bağlı olarak belirlenecektir → [INF-OPEN-2] (🟢 düşük öncelik).

**Karar [INF-007]:** Hata izleme (error tracking) — **Sentry** (ücretsiz tier, ACTION-FIRST) entegre edilir; frontend ve backend hatalarını yakalar. İtiraz edersen kaldırırız.

**Karar [INF-008]:** Backup / PITR — Veritabanı yedekleme stratejisi (otomatik snapshot sıklığı, point-in-time-recovery) [INF-001]'deki managed Postgres sağlayıcısının sunduğu opsiyonlara bağlıdır → [INF-OPEN-3] (🟠 yüksek öncelik, kullanıcı verisi içerdiği için MVP öncesi netleşmeli).

---

## 16. Test Stratejisi

**Karar [TEST-001]:** Test framework — Frontend: **Vitest + Testing Library**. Backend: **Jest** (NestJS varsayılanı). Ağır/yavaş bir E2E test paketi (örn. Playwright tüm akışlar) MVP'de **yoktur** (ACTION-FIRST — hobi projesi, odaklı unit/integration testler önceliklidir).

**Karar [TEST-002]:** Yetkilendirme testleri zorunluluğu — [AUTH-007] yetki matrisindeki **her kural** (kim hangi kaynağı güncelleyebilir/silebilir + [AUTH-008] admin bypass + [AUTH-004]/[AUTH-005] görünürlük kuralları) için backend **integration testleri zorunludur**. Bu testler olmadan ilgili endpoint'e ait PR merge edilemez (bkz. [TEST-003], [CODE-NNN]). Test matrisi en az şu kombinasyonları kapsar: sahibi/sahibi-olmayan kullanıcı, campaign DM'i/DM-olmayan üye, `ADMIN`/`USER`, deaktive kullanıcı ([AP-002]).

**Karar [TEST-003]:** CI test gate'i — GitHub Actions'ta (bkz. [INF-003]) **lint + type-check (tsc) + unit/integration testler** "required status check" olarak ayarlanır; bu kontroller geçmeden `main`'e merge **engellenir**.

---

## 17. Kod Organizasyonu ve Agent Kuralları

**Karar [CODE-001]:** Monorepo klasör yapısı (pnpm workspaces, [TS-012]):

```
apps/
  web/        # React + Vite frontend ([TS-006])
  api/        # NestJS backend ([TS-002])
packages/
  shared/     # Ortak entity tipleri, enum'lar, izin sabitleri [R-004], Zod şemaları [TS-009]
```

**Karar [CODE-002]:** `packages/shared` içeriği — Frontend ve backend arasında çoğaltılmayan tek doğruluk kaynağı:
- Entity tip tanımları (Prisma'dan türetilen veya el yazımı `User`, `Campaign`, `Character`, `HomebrewItem` arayüzleri).
- Enum'lar: `Role` (`ADMIN`/`USER`, [R-001]), `HomebrewStatus` (`DRAFT`/`PUBLISHED`, [W-003]), `CharacterVisibility` (`PUBLIC`/`PRIVATE`, [AUTH-005]), homebrew alt tipleri (`background`/`feat`/`magic-item`/`monster`/`spell`/`subclass`).
- İzin/eylem sabitleri ([R-004]) — `can()` policy fonksiyonlarının referans aldığı `Action`/`Resource` enum'ları.
- Form/validation Zod şemaları ([TS-009]) — karakter builder, campaign oluşturma, homebrew formları için backend DTO'ları ile **aynı şema** frontend form validasyonunda kullanılır (tek tanım, çift kullanım).

**Karar [CODE-003]:** Backend modül yapısı (`apps/api/src/`) — Her kaynak tipi kendi NestJS modülünde: `auth/`, `users/`, `campaigns/`, `characters/`, `homebrew/` (alt klasörler: `backgrounds/`, `feats/`, `magic-items/`, `monsters/`, `spells/`, `subclasses/`), `reference/` (read-only resmi 5e kural verisi, [I-001]), `admin/` ([AP-NNN]). Ortak guard/decorator/policy kodu `common/` altında (`common/guards/`, `common/decorators/`, `common/policies/` — [AUTH-003]).

**Karar [CODE-004]:** Agent yasakları — Bu projede kod üreten/düzenleyen bir AI agent (Cursor) şu kurallara **kesinlikle uymalıdır**:
1. **Raw SQL / string concatenation yasak** — tüm DB erişimi Prisma Client üzerinden ([SEC-010]).
2. **Token'lar localStorage/sessionStorage'da saklanmaz** — access token memory'de, refresh token httpOnly cookie'de ([SEC-004]).
3. **Her yazma (POST/PATCH/PUT/DELETE) endpoint'i bir authorization guard'a sahip olmalıdır** — guard'sız endpoint commit edilemez ([AUTH-003]).
4. **`password_hash` alanı hiçbir DTO/response'ta yer almaz**; `email` alanı sadece `User.id == requester.id` veya `requester.role == ADMIN` durumunda response'a dahil edilir ([SEC-014]).
5. **SVG dosya yükleme kabul edilmez** — sadece `png`/`jpeg`/`webp` ([D-005], [SEC-012]).
6. **[AUTH-007] yetki matrisindeki her kural için integration test zorunludur**; testsiz yetki kuralı merge edilemez ([TEST-002]).
7. **`main` branch'ine doğrudan push yasaktır** — her değişiklik feature branch + PR ile gelir ([CODE-005]).
8. Agent, bu dokümanda ([mimari-kararlar.md]) **henüz karar verilmemiş (Bölüm 18, açık kararlar)** bir konuda varsayım yaparak ilerlemez; belirsizlik varsa kullanıcıya sorar veya açık bir TODO/yorum bırakır.

**Karar [CODE-005]:** Git workflow — **Conventional Commits** (`feat:`, `fix:`, `chore:`, `refactor:`, `test:`, `docs:` önekleri). Her değişiklik bir **feature branch**'te yapılır, **Pull Request** ile `main`'e gelir; `main`'e doğrudan push **yasaktır** ([CODE-004].7). PR, [TEST-003]'teki CI gate'lerini geçmeden merge edilemez.

---

## 18. Açık Kararlar — Tamamlanması Gerekenler

Aşağıdaki kararlar henüz alınmamıştır. **Bu kararlar tamamlanmadan ilgili kod parçalarının geliştirilmesine başlanmamalıdır** (🔴/🟠 öncelikli olanlar için).

| ID | Konu | Öncelik | Bağımlılık / Not |
| --- | --- | --- | --- |
| `[INF-OPEN-1]` | Deployment platformu (backend+DB+Redis+storage) seçimi | 🟠 Yüksek | [INF-001]. Geliştirme Docker ile platform-agnostic ilerleyebilir; production öncesi netleşmeli. [INF-OPEN-2], [INF-OPEN-3], [D-002] sağlayıcısı buna bağımlı. |
| `[INF-OPEN-3]` | Backup / Point-in-Time-Recovery stratejisi | 🟠 Yüksek | [INF-008]. Kullanıcı verisi (hesaplar, campaign/character verisi) içerdiği için MVP canlıya çıkmadan önce netleşmeli. [INF-OPEN-1]'e bağımlı. |
| `[AUD-OPEN-1]` | Admin Panel'de audit log görüntüleme ekranı | 🟢 Düşük | [AP-005]/[AUD-004]. Veri modeli ([AUD-002]) MVP'de mevcut, sadece UI eksik. |
| `[AUD-OPEN-2]` | `audit_logs` için chain-hash tamper-evidence mekanizması | 🟢 Düşük | [AUD-003]. |
| `[SEC-OPEN-1]` | Sızdırılmış şifre kontrolü (HaveIBeenPwned API entegrasyonu) | 🟢 Düşük | [SEC-002]. |
| `[SEC-OPEN-2]` | Kullanıcı talebiyle tam/kalıcı hesap silme ("right to erasure") | 🟢 Düşük | [SEC-015]. [P-009] ile uyumlu — MVP'de soft-delete yeterli kabul edildi. |
| `[INF-OPEN-2]` | Log aggregation/retention stratejisi | 🟢 Düşük | [INF-006]. [INF-OPEN-1]'e bağımlı. |

---

## Versiyon Geçmişi

| Versiyon | Tarih      | Açıklama      |
| -------- | ---------- | ------------- |
| 1.0      | 2026-06-14  | Tüm bölümler (1-18) tamamlandı. İlk komple sürüm. |
| 1.1      | 2026-06-14  | [I-001] veri kaynağı SRD'den tüm resmi 5e içeriğine genişletildi. [P-001], [P-006] güncellendi. Source enum kitap bazlı genişletildi. |
| 1.2      | 2026-06-17  | [AUTH-OPEN-2] kapatıldı; [A-005] güncellendi (`EmailVerifiedGuard` — tüm yazma eylemleri). |

---

## Nasıl Kullanılır?

Bu doküman **canlı bir dokümandır** — kararlar netleştikçe güncellenecektir. Her yeni karar için:

1. İlgili bölüme karar eklenir (Karar ID formatı: `[KATEGORI-SIRA]`).
2. Karar açıksa Bölüm 18'e `[KATEGORI-OPEN-N]` olarak öncelik etiketiyle yazılır; kapandığında listeden silinir.
3. Versiyon geçmişine not düşülür.

`.md` ve `.mdc` dokümanları oluşturulurken bu dokümandaki karar ID'leri **referans** olarak kullanılır. Böylece hiçbir kural boşlukta kalmaz, her kural bir mimari karara bağlıdır. Bu doküman `project-doc-architect` skill'inin girdisidir.
