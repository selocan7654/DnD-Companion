# DnD Companion Platform — Frontend Spec

> **Doküman amacı:** React frontend'in klasör yapısını, routing'ini, state yönetimini, form stratejisini, WebSocket client'ını, responsive tasarım yaklaşımını ve erişim kontrolü mekanizmalarını tanımlar. Kodlama agent'ı bu dokümanı okuyarak frontend kodunu eksiksiz üretir.

---

## 1. Klasör Yapısı

```
apps/web/src/
├── main.tsx                        # Entry point, Provider'lar
├── App.tsx                         # Router tanımı
│
├── routes/
│   └── index.tsx                   # Tüm route tanımları (React Router)
│
├── layouts/
│   ├── PublicLayout.tsx            # Header + footer, auth yok
│   ├── AppLayout.tsx               # Sidebar/nav + header, auth zorunlu
│   └── AdminLayout.tsx             # Admin navigasyon
│
├── pages/                          # Route-level sayfa bileşenleri
│   ├── auth/
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   ├── VerifyEmailPage.tsx
│   │   ├── PasswordResetRequestPage.tsx
│   │   └── PasswordResetConfirmPage.tsx
│   ├── campaigns/
│   │   ├── CampaignListPage.tsx
│   │   ├── CampaignDetailPage.tsx
│   │   ├── CampaignCreatePage.tsx
│   │   └── CampaignEditPage.tsx
│   ├── characters/
│   │   ├── CharacterListPage.tsx
│   │   ├── CharacterDetailPage.tsx
│   │   ├── CharacterBuilderPage.tsx
│   │   └── CharacterEditPage.tsx
│   ├── homebrew/
│   │   ├── HomebrewGalleryPage.tsx
│   │   ├── HomebrewDetailPage.tsx
│   │   ├── HomebrewCreatePage.tsx
│   │   ├── HomebrewEditPage.tsx
│   │   └── MyCreationsPage.tsx
│   ├── collections/
│   │   └── MyCollectionPage.tsx
│   ├── dm-screen/
│   │   └── DmScreenPage.tsx
│   ├── reference/
│   │   ├── ReferenceListPage.tsx
│   │   └── ReferenceDetailPage.tsx
│   ├── profile/
│   │   └── ProfilePage.tsx
│   ├── admin/
│   │   ├── AdminUsersPage.tsx
│   │   ├── AdminCampaignsPage.tsx
│   │   ├── AdminCharactersPage.tsx
│   │   └── AdminHomebrewPage.tsx
│   ├── invite/
│   │   └── InvitePage.tsx
│   └── errors/
│       ├── NotFoundPage.tsx
│       └── ServerErrorPage.tsx
│
├── features/                       # Feature-bazlı bileşenler ve logic
│   ├── auth/
│   │   └── AuthGuard.tsx
│   ├── campaigns/
│   │   ├── CampaignCard.tsx
│   │   ├── InviteLinkManager.tsx
│   │   └── MemberList.tsx
│   ├── characters/
│   │   ├── CharacterSheet.tsx
│   │   ├── CharacterCard.tsx
│   │   ├── builder/
│   │   │   ├── RaceClassTab.tsx
│   │   │   ├── AbilityScoresTab.tsx
│   │   │   ├── BackgroundTab.tsx
│   │   │   ├── EquipmentTab.tsx
│   │   │   ├── SpellsTab.tsx
│   │   │   └── ReviewTab.tsx
│   │   └── LiveFieldsBadge.tsx
│   ├── dm-screen/
│   │   ├── PlayerCharacterPanel.tsx
│   │   ├── DmNotesPanel.tsx
│   │   └── LiveFieldCard.tsx
│   ├── homebrew/
│   │   ├── HomebrewCard.tsx
│   │   ├── HomebrewForm.tsx
│   │   └── StatusBadge.tsx
│   └── collections/
│       └── CollectionToggle.tsx
│
├── components/                     # Genel UI bileşenleri (shadcn/ui üzerine)
│   ├── ui/                         # shadcn/ui bileşenleri (button, input, card, dialog, vb.)
│   ├── Pagination.tsx
│   ├── SearchInput.tsx
│   ├── FilterBar.tsx
│   ├── DataTable.tsx
│   ├── EmptyState.tsx
│   ├── LoadingSpinner.tsx
│   ├── Toast.tsx
│   ├── ConfirmDialog.tsx
│   ├── ImageUpload.tsx
│   └── EmailVerificationBanner.tsx
│
├── store/                          # Redux Toolkit
│   ├── index.ts                    # configureStore
│   ├── authSlice.ts                # Auth state (user, access token)
│   └── api/
│       ├── baseApi.ts              # RTK Query createApi (base)
│       ├── authApi.ts
│       ├── campaignsApi.ts
│       ├── charactersApi.ts
│       ├── homebrewApi.ts
│       ├── collectionsApi.ts
│       ├── referenceApi.ts
│       ├── adminApi.ts
│       └── uploadsApi.ts
│
├── hooks/                          # Custom hooks
│   ├── useAuth.ts                  # Auth state erişimi
│   ├── useWebSocket.ts             # Socket.io client yönetimi
│   ├── useDebounce.ts              # Auto-save debounce
│   └── usePagination.ts            # Cursor pagination hook
│
├── lib/                            # Utility'ler
│   ├── socket.ts                   # Socket.io client instance
│   ├── imageResize.ts              # Client-side görsel küçültme
│   └── formatters.ts               # Tarih, sayı formatları
│
└── styles/
    └── globals.css                 # Tailwind base + shadcn/ui theme
```

---

## 2. Routing

### Route Tanımları

| Path | Sayfa | Layout | Auth | Açıklama |
|---|---|---|---|---|
| `/login` | LoginPage | Public | 🔓 | |
| `/register` | RegisterPage | Public | 🔓 | |
| `/verify-email` | VerifyEmailPage | Public | 🔓 | Query: `?token=` |
| `/reset-password/request` | PasswordResetRequestPage | Public | 🔓 | |
| `/reset-password/confirm` | PasswordResetConfirmPage | Public | 🔓 | Query: `?token=` |
| `/` | CampaignListPage (redirect) | App | 🔑 | Dashboard / ana sayfa |
| `/campaigns` | CampaignListPage | App | 🔑 | |
| `/campaigns/new` | CampaignCreatePage | App | 🔑 | |
| `/campaigns/:id` | CampaignDetailPage | App | 🔑 | |
| `/campaigns/:id/edit` | CampaignEditPage | App | 🔑 | |
| `/campaigns/:id/dm-screen` | DmScreenPage | App | 🔑 | |
| `/characters` | CharacterListPage | App | 🔑 | |
| `/characters/new` | CharacterBuilderPage | App | 🔑 | |
| `/characters/:id` | CharacterDetailPage | Mixed | Değişken | Public karakter → 🔓 |
| `/characters/:id/edit` | CharacterEditPage | App | 🔑 | |
| `/homebrew` | HomebrewGalleryPage | Public | 🔓 | Galeri |
| `/homebrew/:id` | HomebrewDetailPage | Mixed | Değişken | Published → 🔓 |
| `/homebrew/new` | HomebrewCreatePage | App | 🔑 | |
| `/homebrew/:id/edit` | HomebrewEditPage | App | 🔑 | |
| `/my-creations` | MyCreationsPage | App | 🔑 | |
| `/my-collection` | MyCollectionPage | App | 🔑 | |
| `/reference` | ReferenceListPage | Public | 🔓 | |
| `/reference/:type` | ReferenceListPage | Public | 🔓 | Tip filtreli |
| `/reference/:type/:id` | ReferenceDetailPage | Public | 🔓 | |
| `/invite/:token` | InvitePage | App | 🔑 | |
| `/profile` | ProfilePage | App | 🔑 | |
| `/admin/users` | AdminUsersPage | Admin | 👑 | |
| `/admin/campaigns` | AdminCampaignsPage | Admin | 👑 | |
| `/admin/characters` | AdminCharactersPage | Admin | 👑 | |
| `/admin/homebrew` | AdminHomebrewPage | Admin | 👑 | |
| `*` | NotFoundPage | Public | 🔓 | 404 |

### Route Guard Bileşenleri

```typescript
// features/auth/AuthGuard.tsx
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" replace />;

  return <>{children}</>;
}

// Email doğrulama banner'ı (block etmez, bilgilendirir)
function EmailVerificationBanner() {
  const { user } = useAuth();
  if (!user || user.emailVerifiedAt) return null;

  return (
    <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2 text-sm">
      Email adresinizi doğrulayın. Doğrulanmadan kampanya oluşturma, karakter oluşturma
      ve homebrew paylaşma gibi özellikler kullanılamaz.
    </div>
  );
}

// Admin guard
function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (user?.role !== 'ADMIN') return <Navigate to="/" replace />;
  return <>{children}</>;
}
```

Güvenlik sınırı backend'dedir — frontend guard'lar sadece UX amaçlıdır.

---

## 3. Layout Sistemi

### PublicLayout

Auth gerektirmeyen sayfalar için. Basit header (logo + Login/Register butonları) + footer (lisans atfı).

```
┌─────────────────────────────────┐
│  Logo        Login | Register   │  ← Header
├─────────────────────────────────┤
│                                 │
│         Page Content            │
│                                 │
├─────────────────────────────────┤
│  Attribution | About            │  ← Footer
└─────────────────────────────────┘
```

### AppLayout

Auth zorunlu sayfalar için. Sol sidebar (masaüstü) veya bottom nav (mobil) + üst header (kullanıcı menüsü).

**Masaüstü (lg+):**
```
┌──────┬──────────────────────────┐
│      │  Breadcrumb    User Menu │  ← Header
│  Nav │──────────────────────────│
│      │                          │
│  Bar │      Page Content        │
│      │                          │
└──────┴──────────────────────────┘
```

**Mobil (< lg):**
```
┌─────────────────────────────────┐
│  ☰ Menu         User Avatar    │  ← Header
├─────────────────────────────────┤
│                                 │
│         Page Content            │
│                                 │
├─────────────────────────────────┤
│  🏰  ⚔️  📖  🧪  👤            │  ← Bottom Nav
└─────────────────────────────────┘
```

Sidebar navigasyon öğeleri:
- Campaigns (🏰)
- Characters (⚔️)
- Reference (📖)
- Homebrew Gallery (🧪)
- My Creations
- My Collection
- Profile

### AdminLayout

AppLayout'u genişletir. Sidebar'da ek admin bölümü:
- Admin: Users
- Admin: Campaigns
- Admin: Characters
- Admin: Homebrew

`role = ADMIN` olmayan kullanıcılara bu bölüm görünmez.

---

## 4. State Yönetimi (Redux Toolkit + RTK Query)

### Store Yapısı

```typescript
// store/index.ts
import { configureStore } from '@reduxjs/toolkit';
import { baseApi } from './api/baseApi';
import authReducer from './authSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [baseApi.reducerPath]: baseApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(baseApi.middleware),
});
```

### authSlice

```typescript
// store/authSlice.ts
interface AuthState {
  user: User | null;
  accessToken: string | null;
}

const authSlice = createSlice({
  name: 'auth',
  initialState: { user: null, accessToken: null } as AuthState,
  reducers: {
    setCredentials: (state, action: PayloadAction<{ user: User; accessToken: string }>) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
    },
    clearCredentials: (state) => {
      state.user = null;
      state.accessToken = null;
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) Object.assign(state.user, action.payload);
    },
  },
});
```

Access token memory'de (Redux store) tutulur — localStorage/sessionStorage yasaktır.

### Base API (RTK Query)

```typescript
// store/api/baseApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const baseQuery = fetchBaseQuery({
  baseUrl: '/api/v1',
  credentials: 'include', // refresh cookie gönderimi
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.accessToken;
    if (token) headers.set('Authorization', `Bearer ${token}`);
    return headers;
  },
});

// 401 alındığında refresh dene, başarısızsa logout
const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  if (result.error?.status === 401) {
    const refreshResult = await baseQuery(
      { url: '/auth/refresh', method: 'POST' },
      api,
      extraOptions,
    );

    if (refreshResult.data) {
      api.dispatch(setCredentials({
        user: api.getState().auth.user,
        accessToken: (refreshResult.data as any).data.accessToken,
      }));
      result = await baseQuery(args, api, extraOptions);
    } else {
      api.dispatch(clearCredentials());
    }
  }

  return result;
};

export const baseApi = createApi({
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    'Campaign', 'CampaignList',
    'Character', 'CharacterList',
    'Homebrew', 'HomebrewList', 'MyCreations',
    'Collection',
    'DmNote',
    'AdminUsers', 'AdminContent',
    'User',
  ],
  endpoints: () => ({}),
});
```

### Tag Invalidation Stratejisi

| Mutation | Invalidate Tags |
|---|---|
| Campaign create/update/delete | `CampaignList`, `Campaign:{id}` |
| Campaign join/leave | `CampaignList`, `Campaign:{id}` |
| Character create/update/delete | `CharacterList`, `Character:{id}` |
| Character live update | `Character:{id}` (veya optimistic) |
| Homebrew create/update/delete | `HomebrewList`, `MyCreations`, `Homebrew:{id}` |
| Homebrew publish/unpublish | `HomebrewList`, `MyCreations`, `Homebrew:{id}` |
| Collection add/remove | `Collection` |
| DM Note CRUD | `DmNote:{campaignId}` |

---

## 5. RTK Query API Tanımları

Her API modülü `baseApi.injectEndpoints()` ile genişletilir:

```typescript
// store/api/campaignsApi.ts
export const campaignsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCampaigns: builder.query<PaginatedResponse<CampaignListItem>, ListQuery>({
      query: (params) => ({ url: '/campaigns', params }),
      providesTags: ['CampaignList'],
    }),

    getCampaign: builder.query<Campaign, string>({
      query: (id) => `/campaigns/${id}`,
      providesTags: (result, error, id) => [{ type: 'Campaign', id }],
    }),

    createCampaign: builder.mutation<Campaign, CreateCampaignDto>({
      query: (body) => ({ url: '/campaigns', method: 'POST', body }),
      invalidatesTags: ['CampaignList'],
    }),

    updateCampaign: builder.mutation<Campaign, { id: string; body: UpdateCampaignDto }>({
      query: ({ id, body }) => ({ url: `/campaigns/${id}`, method: 'PATCH', body }),
      invalidatesTags: (result, error, { id }) => ['CampaignList', { type: 'Campaign', id }],
    }),

    deleteCampaign: builder.mutation<void, string>({
      query: (id) => ({ url: `/campaigns/${id}`, method: 'DELETE' }),
      invalidatesTags: ['CampaignList'],
    }),

    // ... invite, members endpoints
  }),
});

export const {
  useGetCampaignsQuery,
  useGetCampaignQuery,
  useCreateCampaignMutation,
  useUpdateCampaignMutation,
  useDeleteCampaignMutation,
} = campaignsApi;
```

Diğer API dosyaları (characters, homebrew, collections, reference, admin, uploads) aynı pattern'i takip eder.

---

## 6. Authentication Flow (Frontend)

### Login Akışı

1. Kullanıcı login formunu doldurur.
2. `POST /auth/login` çağrılır.
3. Başarılı → `setCredentials({ user, accessToken })` dispatch edilir.
4. Refresh token httpOnly cookie'de set edilir (tarayıcı otomatik yönetir).
5. Kullanıcı `/campaigns`'e yönlendirilir.

### Token Yenileme

RTK Query'nin `baseQueryWithReauth` wrapper'ı 401 aldığında otomatik `POST /auth/refresh` çağırır. Yeni access token store'da güncellenir, orijinal istek tekrar denenir.

### Sayfa Yenilemede Oturum Koruması

Access token memory'de olduğu için sayfa yenilendiğinde kaybolur. Uygulama açıldığında:

```typescript
// App.tsx veya main.tsx
function App() {
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // Refresh token cookie'si varsa yeni access token al
    fetch('/api/v1/auth/refresh', { method: 'POST', credentials: 'include' })
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => {
        store.dispatch(setCredentials({
          accessToken: data.data.accessToken,
          user: data.data.user, // refresh endpoint user bilgisini de dönebilir
        }));
      })
      .catch(() => {
        // Refresh token yok veya geçersiz — kullanıcı giriş yapmamış
      })
      .finally(() => setIsInitializing(false));
  }, []);

  if (isInitializing) return <LoadingSpinner fullScreen />;
  return <RouterProvider router={router} />;
}
```

### Logout

1. `POST /auth/logout` çağrılır.
2. `clearCredentials()` dispatch edilir.
3. Socket.io bağlantısı kapatılır.
4. `/login`'e yönlendirilir.

---

## 7. Form Stratejisi

### React Hook Form + Zod

Tüm formlar React Hook Form ile yönetilir. Validation şemaları `packages/shared` altındaki Zod şemalarını kullanır.

```typescript
// Kampanya oluşturma formu
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createCampaignSchema } from '@dnd-companion/shared';

function CampaignCreatePage() {
  const form = useForm({
    resolver: zodResolver(createCampaignSchema),
    defaultValues: { name: '', description: '', setting: '' },
  });

  const [createCampaign, { isLoading }] = useCreateCampaignMutation();

  const onSubmit = async (data) => {
    const result = await createCampaign(data);
    if ('data' in result) navigate(`/campaigns/${result.data.id}`);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* shadcn/ui form bileşenleri */}
    </form>
  );
}
```

### Character Builder — Tab Yapısı

Character Builder, karakter sheet'in guided tab görünümüdür. Ayrı bir wizard değildir — tüm tab'lar aynı form state'ini paylaşır ve her tab aynı karakter kaydını günceller.

**Tab'lar:**

| Tab | İçerik | Alanlar |
|---|---|---|
| 1. Race & Class | Tür, sınıf, alt sınıf seçimi | `race`, `className`, `subclass`, `level` |
| 2. Ability Scores | 6 ability score, point buy veya manuel giriş | `abilityScores` |
| 3. Background & Details | Arka plan, hizalama, isim, notlar | `background`, `alignment`, `name`, `notes` |
| 4. Equipment | Ekipman listesi, zırh, silah | `equipment`, `armorClass` |
| 5. Spells | Bilinen/hazırlanan büyüler, slot'lar (sınıf gerektiriyorsa) | `knownSpells`, `spellSlots` |
| 6. Review | Tüm alanların özet görünümü, HP hesaplama | `hitPointsMax`, `hitPointsCurrent`, `speed`, `proficiencyBonus` |

**Auto-Save:** Her tab'da alan değiştiğinde (on blur / on change) debounced PATCH isteği gönderilir. Kayıt butonu yoktur — değişiklikler otomatik kaydedilir.

```typescript
// hooks/useAutoSave.ts
function useAutoSave(characterId: string) {
  const [updateCharacter] = useUpdateCharacterMutation();
  const debouncedUpdate = useDebounce((data: Partial<Character>) => {
    updateCharacter({ id: characterId, body: data });
  }, 500);

  return debouncedUpdate;
}
```

### Homebrew Formu

Homebrew `type`'a göre `data` alanı farklı form alanları gösterir. `type` seçildikten sonra ilgili form bölümü render edilir.

```typescript
function HomebrewForm({ type }: { type: HomebrewType }) {
  switch (type) {
    case 'SPELL': return <SpellDataForm />;
    case 'MONSTER': return <MonsterDataForm />;
    case 'FEAT': return <FeatDataForm />;
    case 'BACKGROUND': return <BackgroundDataForm />;
    case 'MAGIC_ITEM': return <MagicItemDataForm />;
    case 'SUBCLASS': return <SubclassDataForm />;
  }
}
```

---

## 8. WebSocket Client

### Socket.io Client

```typescript
// lib/socket.ts
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function connectSocket(accessToken: string) {
  if (socket?.connected) return socket;

  socket = io(window.location.origin, {
    auth: { token: accessToken },
    transports: ['websocket'],
  });

  socket.on('connect_error', (err) => {
    console.error('Socket connection error:', err.message);
  });

  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}

export function getSocket() {
  return socket;
}
```

### useWebSocket Hook

```typescript
// hooks/useWebSocket.ts
function useWebSocket(campaignId: string | undefined) {
  const { accessToken } = useAuth();
  const dispatch = useDispatch();

  useEffect(() => {
    if (!campaignId || !accessToken) return;

    const socket = connectSocket(accessToken);

    socket.emit('join-campaign', { campaignId });

    socket.on('character:live-update', (data: LiveUpdatePayload) => {
      // RTK Query cache'ini güncelle (optimistic update yerine server push)
      dispatch(
        charactersApi.util.updateQueryData('getCharacter', data.characterId, (draft) => {
          if (data.fields) {
            Object.assign(draft.data, data.fields);
          } else {
            draft.data[data.field] = data.value;
          }
        })
      );
    });

    socket.on('campaign:member-joined', (data) => {
      // Campaign member listesini invalidate et
      dispatch(campaignsApi.util.invalidateTags([{ type: 'Campaign', id: campaignId }]));
    });

    socket.on('campaign:member-left', (data) => {
      dispatch(campaignsApi.util.invalidateTags([{ type: 'Campaign', id: campaignId }]));
    });

    return () => {
      socket.emit('leave-campaign', { campaignId });
      socket.off('character:live-update');
      socket.off('campaign:member-joined');
      socket.off('campaign:member-left');
    };
  }, [campaignId, accessToken]);
}
```

DM Screen ve Campaign Detail sayfalarında `useWebSocket(campaignId)` çağrılır.

---

## 9. Responsive Tasarım

### Tailwind Breakpoints (Mobile-First)

Tailwind varsayılan breakpoint'ları kullanılır:

| Prefix | Min Width | Kullanım |
|---|---|---|
| (none) | 0px | Mobil (default) |
| `sm` | 640px | Büyük telefon |
| `md` | 768px | Tablet |
| `lg` | 1024px | Küçük masaüstü |
| `xl` | 1280px | Masaüstü |

Özel breakpoint eklenmez.

### Kritik Layout Adaptasyonları

**Karakter Sheet:**
- Masaüstü (lg+): 2-3 sütunlu grid. Sol: ability scores + HP + AC. Orta: skills + features. Sağ: equipment + spells.
- Mobil: Tek sütun stack. Bölümler collapse edilebilir accordion olarak.

**DM Screen:**
- Masaüstü (lg+): Sol panel: oyuncu karakterleri grid (canlı alanlar). Sağ panel: DM notları.
- Mobil: Tab ile geçiş — "Players" tab ve "Notes" tab.

**Homebrew Galeri:**
- Masaüstü: 3-4 sütun kart grid + sol filtre sidebar.
- Mobil: Tek sütun kart listesi, filtre drawer (Sheet bileşeni).

**Kampanya Detay:**
- Masaüstü: Banner + bilgiler üstte, üyeler ve karakterler yan yana grid.
- Mobil: Tek sütun stack.

### shadcn/ui Bileşen Kullanımı

Temel UI bileşenleri shadcn/ui'dan kullanılır:
- `Button`, `Input`, `Textarea`, `Select`, `Checkbox`, `Switch`
- `Card`, `Dialog`, `Sheet` (mobil drawer), `Tabs`
- `Table` (admin listeleri), `Badge` (durum etiketleri)
- `DropdownMenu` (kullanıcı menüsü), `Command` (arama)
- `Toast` (bildirimler), `Skeleton` (loading states)
- `Accordion` (mobil karakter sheet bölümleri)

---

## 10. Error Handling (Frontend)

### RTK Query Error Handling

```typescript
// Global error handler (middleware veya component)
function ErrorToast() {
  const { error } = useSelector(state => state.api);

  useEffect(() => {
    if (error) {
      if (error.status === 403 && error.data?.message?.includes('Email verification')) {
        toast.warning('Bu işlem için email doğrulaması gerekli.');
      } else if (error.status === 429) {
        toast.error('Çok fazla istek gönderdiniz. Lütfen bekleyin.');
      } else if (error.status >= 500) {
        toast.error('Sunucu hatası oluştu. Lütfen tekrar deneyin.');
      } else if (error.data?.message) {
        toast.error(error.data.message);
      }
    }
  }, [error]);
}
```

### Form Validation Error Gösterimi

Backend'den dönen validation hataları (`details` array) form alanlarının altında gösterilir:

```typescript
// API hatalarını form alanlarına eşle
if (error?.data?.details) {
  error.data.details.forEach(({ field, issue }) => {
    if (field) form.setError(field, { message: issue });
  });
}
```

---

## 11. Image Upload Flow

### Client-Side Resize

Upload öncesi tarayıcıda görsel küçültme yapılır:

```typescript
// lib/imageResize.ts
export async function resizeImage(
  file: File,
  maxWidth: number,
  maxHeight: number,
): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let { width, height } = img;

      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
      }

      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob) => resolve(blob!), file.type, 0.85);
    };
    img.src = URL.createObjectURL(file);
  });
}
```

**Boyut limitleri:**
- Avatar: 512x512
- Karakter portresi: 1600px genişlik
- Campaign banner: 1600px genişlik
- Homebrew görseli: 1600px genişlik

### Upload Akışı

1. Kullanıcı dosya seçer.
2. Client-side MIME kontrolü (png/jpeg/webp).
3. Client-side resize.
4. `POST /uploads/presign` ile presigned URL al.
5. `PUT` ile dosyayı doğrudan object storage'a yükle.
6. Dönen `publicUrl`'i ilgili kaynağın `*_url` alanına `PATCH` ile kaydet.

```typescript
// components/ImageUpload.tsx
async function handleUpload(file: File, purpose: string) {
  const maxDim = purpose === 'avatar' ? 512 : 1600;
  const resized = await resizeImage(file, maxDim, maxDim);

  const { data: presign } = await getPresignedUrl({
    contentType: file.type,
    purpose,
    fileName: file.name,
  });

  await fetch(presign.uploadUrl, {
    method: 'PUT',
    body: resized,
    headers: { 'Content-Type': file.type },
  });

  return presign.publicUrl;
}
```

---

## 12. Erişim Kontrolü (Frontend)

Frontend erişim kontrolü sadece UX amaçlıdır — güvenlik sınırı her zaman backend'dedir.

### Koşullu UI Kuralları

| Koşul | UI Davranışı |
|---|---|
| `user == null` (misafir) | Login/Register butonları gösterilir, nav kısıtlı |
| `emailVerifiedAt == null` | Sarı banner gösterilir, yazma butonları disabled + tooltip |
| Kampanya DM'i değil | "Edit", "Delete", "Invite" butonları gizli |
| Karakter sahibi değil (ve DM değil) | "Edit", "Delete" butonları gizli |
| Homebrew sahibi değil | "Edit", "Delete", "Publish/Unpublish" butonları gizli |
| `role != ADMIN` | Admin navigasyon bölümü gizli |
| Deaktive kullanıcının içerikleri | Normal kullanıcıya gösterilmez (API zaten dönmez) |

### useAuth Hook

```typescript
// hooks/useAuth.ts
export function useAuth() {
  const { user, accessToken } = useSelector((state: RootState) => state.auth);

  return {
    user,
    accessToken,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'ADMIN',
    isEmailVerified: !!user?.emailVerifiedAt,
    isLoading: false, // initial refresh sırasında true
  };
}
```

---

## 13. Erişilebilirlik (a11y)

Platform, WCAG 2.1 Level AA temel gereksinimlerini karşılar. Hobi projesi olarak tam denetim (audit) yapılmasa da aşağıdaki kurallar her bileşende zorunludur.

### Klavye Navigasyon

- Tüm interaktif öğeler (buton, link, input, select, checkbox, tab) Tab sırası ile erişilebilir.
- Modal açıldığında focus modal içine kilitlenir (focus trap). `Escape` ile kapatılır (SessionExpiredModal hariç — o kapatılamaz).
- Dropdown menüler `ArrowDown` / `ArrowUp` ile gezilir, `Enter` ile seçilir, `Escape` ile kapatılır.
- Character Builder tab'ları `ArrowLeft` / `ArrowRight` ile geçiş yapar.
- "Skip to main content" linki her sayfanın ilk fokuslanabilir öğesidir (görünmez, focus'ta görünür).

### ARIA Kuralları

| Bileşen | ARIA Niteliği |
|---|---|
| Sidebar navigasyon | `<nav aria-label="Main navigation">` |
| Admin sidebar | `<nav aria-label="Admin navigation">` |
| Modallar | `role="dialog"`, `aria-modal="true"`, `aria-labelledby` heading'e bağlı |
| Alert mesajları | `role="alert"`, `aria-live="assertive"` |
| Toast bildirimleri | `role="status"`, `aria-live="polite"` |
| Loading spinner | `aria-label="Loading"`, `role="status"` |
| HP bar | `role="progressbar"`, `aria-valuenow`, `aria-valuemin="0"`, `aria-valuemax` |
| Death save slotları | Her slot `aria-label="Death save success 1 of 3"` gibi açıklayıcı |
| İkon butonlar (metin yok) | `aria-label` zorunlu (örn. `aria-label="Delete character"`) |
| Form alanları | `<label>` ile eşleştirilmiş veya `aria-label` tanımlı. Hata durumunda `aria-invalid="true"` + `aria-describedby` hata mesajına bağlı |
| Tablo sıralama | Sıralanabilir sütun header'ı `aria-sort="ascending"` / `"descending"` / `"none"` |
| Skeleton (loading) | `aria-hidden="true"` (ekran okuyucu atlasın) |
| Breadcrumb | `<nav aria-label="Breadcrumb">`, `aria-current="page"` aktif öğede |
| Tab group | `role="tablist"`, her tab `role="tab"`, panel `role="tabpanel"`, `aria-selected` |

### Renk ve Kontrast

- Metin kontrast oranı minimum 4.5:1 (normal metin), 3:1 (büyük metin / 18px+ bold).
- Durum renkleri (yeşil/sarı/kırmızı) tek başına anlam taşımaz — her renk yanında metin veya ikon eşlik eder.
- HP bar: rengin yanında sayısal değer her zaman gösterilir.
- Badge'ler: renk + metin birlikte kullanılır.
- Focus indicator: Tailwind `ring` utility ile en az 2px görünür outline. `outline-none` tek başına kullanılmaz — her zaman `focus-visible:ring-2` eşlik eder.

### Ekran Okuyucu

- Sayfa başlıkları (`<title>`) her route'ta dinamik olarak güncellenir: "My Campaigns — DnD Companion".
- Sayfa geçişlerinde `aria-live` region ile "Page loaded" gibi bilgilendirme yapılır.
- Dekoratif görseller (banner, placeholder) `aria-hidden="true"` veya boş `alt=""` ile işaretlenir.
- Anlamlı görseller (karakter portresi, avatar) `alt` ile tanımlanır.

### Form Erişilebilirliği

- Her input bir `<label>` ile eşleştirilir (shadcn/ui `FormField` bunu otomatik yapar).
- Hata durumunda: alan `aria-invalid="true"`, hata mesajı `aria-describedby` ile bağlanır, focus hataya taşınır.
- Submit butonunda loading state'inde `aria-busy="true"` + disabled.
- Gerekli alanlar `aria-required="true"` ile işaretlenir.

---

## 14. Performans ve Web Vitals

### Hedef Metrikler (Lighthouse)

| Metrik | Hedef | Açıklama |
|---|---|---|
| **LCP** (Largest Contentful Paint) | < 2.5s | Ana içerik elementi yüklenmesi |
| **FID** (First Input Delay) | < 100ms | İlk kullanıcı etkileşimi gecikmesi |
| **CLS** (Cumulative Layout Shift) | < 0.1 | Görsel kayma skoru |
| **FCP** (First Contentful Paint) | < 1.8s | İlk anlamlı pixel |
| **TTI** (Time to Interactive) | < 3.5s | Tam etkileşime hazır |

Hedefler masaüstü Lighthouse simulated throttling ile ölçülür. Mobil hedefler %30 toleransla kabul edilir.

### Code Splitting ve Lazy Loading

Route bazlı code splitting `React.lazy` + `Suspense` ile uygulanır:

```typescript
const CampaignDetailPage = lazy(() => import('./pages/CampaignDetailPage'));
const CharacterBuilderPage = lazy(() => import('./pages/CharacterBuilderPage'));
const DmScreenPage = lazy(() => import('./pages/DmScreenPage'));
const AdminUsersPage = lazy(() => import('./pages/AdminUsersPage'));

// Router'da:
<Suspense fallback={<LoadingSpinner />}>
  <Route path="/campaigns/:id" element={<CampaignDetailPage />} />
</Suspense>
```

Admin sayfaları, Character Builder ve DM Screen özellikle ağır bileşenler içerdiğinden lazy loading zorunludur.

### Bundle Optimizasyonu

- Vite `build.rollupOptions.output.manualChunks` ile vendor chunk'ları ayrılır: `react-vendor` (React, React DOM, React Router), `redux-vendor` (Redux Toolkit, RTK Query), `ui-vendor` (shadcn/ui bileşenleri, Tailwind runtime).
- `lodash` kullanımı tree-shake edilebilir import ile: `import debounce from 'lodash/debounce'` (top-level `import _ from 'lodash'` yasak).
- Kullanılmayan shadcn/ui bileşenleri import edilmez — sadece kullanılanlar.

### Görsel Optimizasyon

- Avatar ve karakter portreleri: `<img loading="lazy">` ile yüklenir (viewport dışındayken yüklenmez).
- Galeri ve liste kartlarında görseller `aspect-ratio` ile sabitlenir → CLS önlenir.
- Banner görselleri: `<img fetchpriority="high">` ile öncelikli yüklenir (LCP öğesi olabilir).
- Object storage'dan gelen görsellerde CDN cache header'ları kullanılır (`Cache-Control: public, max-age=31536000`).

### RTK Query Cache Optimizasyonu

- `keepUnusedDataFor`: varsayılan 60 saniye. Referans verileri (seyrek değişir) için 300 saniye.
- `refetchOnMountOrArgChange`: false (cache varsa tekrar fetch etme, RTK Query varsayılanı).
- `refetchOnReconnect`: true (bağlantı kopup geldiğinde güncel veri al).
- WebSocket push ile güncellenen veriler (DM Screen canlı alanlar) cache'e doğrudan yazılır — ayrıca refetch yapılmaz.

### Debounce ve Throttle

| Bileşen | Strateji | Süre |
|---|---|---|
| Arama input'ları | Debounce | 300ms |
| Character Builder auto-save | Debounce | 500ms |
| Window resize handler | Throttle | 200ms |
| Infinite scroll trigger | Throttle | 200ms |
| WebSocket reconnect | Exponential backoff | 1s, 2s, 4s, 8s (maks 30s) |

### Prefetch Stratejisi

- Campaign listesinde kart hover'ında `prefetch` ile kampanya detayını önceden yükle (`usePrefetch` RTK Query hook).
- Homebrew galerisinde kart hover'ında detay prefetch.
- Sidebar'da aktif olmayan navigasyon öğelerinin route chunk'larını idle time'da prefetch etme (`requestIdleCallback`).
