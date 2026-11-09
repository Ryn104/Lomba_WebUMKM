# AI Project Context — UMKM Web Builder

> Paste this file into any AI assistant so it understands this codebase before helping.
> For fuller documentation see `PROJECT.md`; for setup see `README.md`.

---

## 1. What this project is

**UMKM Web Builder** (package: `umkm-web-builder`) is a SaaS platform for Indonesian micro/small businesses (UMKM). Each user registers, creates **one store**, and gets:

- A **public storefront** at `/{slug}`
- A **drag-and-drop website builder**
- A **store dashboard** (products, discounts, finance, subscription)
- An **offline point-of-sale (POS/cashier)**
- A **platform admin panel**

UI language is **Indonesian**. Currency is **Rupiah**, timezone **Asia/Jakarta**.
Hardcoded platform domain: `umkita.rtrwstudio.online` (`PLATFORM_DOMAIN` in `src/lib/supabase.js`).

Relationship: `1 user = 1 store` (enforced by app logic and DB triggers).

---

## 2. Tech stack

| Layer | Choice |
|---|---|
| Framework | React 18 + JSX (JavaScript, **no TypeScript**) |
| Build | Vite 5 |
| Styling | Tailwind CSS 3 + PostCSS + Autoprefixer |
| Routing | React Router DOM 6 |
| Backend | Supabase (Auth, PostgreSQL, Storage) |
| Drag & drop | `@dnd-kit/core`, `sortable`, `utilities` |
| Charts | Recharts |
| Maps | Leaflet + React Leaflet |
| Icons | Lucide React + React Icons |
| Toasts | React Hot Toast |
| Deploy | Static SPA (Vercel / Netlify / Cloudflare) |

Scripts: `npm run dev` (port 5173), `npm run build` (→ `dist/`), `npm run preview`.
There is **no lint or test script**.

---

## 3. Directory map

```
index.html, vite.config.js, tailwind.config.js, postcss.config.js, vercel.json
.env / .env.example              # Supabase URL/key + platform domain (see §7)
supabase/schema.sql              # Authoritative DB: tables, RLS, triggers, RPC, storage
supabase/migrations/             # Incremental SQL changes (apply after schema.sql)
docs/AI-UIUX-SPEC.md             # Product/UI-UX spec
PROJECT.md                       # Detailed project documentation
public/                          # logos + _redirects (SPA fallback)
dist/                            # Production build output (generated, do not edit)

src/
├─ main.jsx                      # Root: BrowserRouter > ThemeProvider > AuthProvider > App + Toaster
├─ App.jsx                       # Top-level route table + Supabase setup notice
├─ index.css                     # Tailwind layers + component classes (.btn-*, .card, .input)
├─ context/
│  ├─ AuthContext.jsx            # Session, profile, OTP register, OAuth, Google profile sync
│  └─ ThemeContext.jsx           # Light/dark mode for the app UI
├─ hooks/
│  ├─ useMyStore.js              # Loads signed-in user's single store
│  └─ useSubscription.js         # Trial/plan state, limits, upgrade, cancel, invoices
├─ lib/
│  ├─ supabase.js                # Client, PLATFORM_DOMAIN, BUCKET, uploadImage()
│  ├─ plans.js                   # Single source of truth: plans, prices, limits
│  └─ utils.js                   # Rupiah/date format, slugify, discount math, reserved slugs
├─ pages/                        # One file per route (see §4)
├─ components/
│  ├─ ui/                        # Field, Modal, Sidebar, ImageUpload, MoneyInput, Avatar, ConfirmModal, ...
│  ├─ onboarding/                # OnboardingStepper, StoreStep, PlanStep (3-step wizard)
│  ├─ builder/                   # CreateStore, SectionEditor, SortableItem, LayoutPicker, DevicePreview, themes.js
│  ├─ store-front/               # sectionDefs.js, SectionRenderer.jsx, HeaderFooter, categoryIcons, socialPlatforms
│  ├─ store-dashboard/           # Overview (+overview/), Products, Discounts, Finance (+finance/), StoreSettings
│  ├─ subscription/              # UpgradeModal, PlanCards, ComparePlansModal, TrialBanner, DunningBanner, ...
│  └─ admin/                     # AdminOverview, Users, Subscriptions, Purchases, Growth, modals, utils
```

---

## 4. Routes

**Public**
| Route | Page |
|---|---|
| `/` | `LandingPage` |
| `/login` | `LoginPage` |
| `/register` | `RegisterPage` (OTP flow) |
| `/lupa-password` | `ForgotPasswordPage` |
| `/reset-password` | `ResetPasswordPage` |
| `/:slug` | `StoreFront` (public store site) |

**Authenticated — store owner (`role = umkm`)**
| Route | Page |
|---|---|
| `/onboarding` | 3-step onboarding wizard (`userOnly`) |
| `/dashboard` | Overview |
| `/dashboard/produk` | Products |
| `/dashboard/diskon` | Discounts |
| `/dashboard/keuangan` | Finance |
| `/dashboard/langganan` | Subscription |
| `/dashboard/profil` | Account profile |
| `/dashboard/pengaturan` | Account security + store settings |
| `/builder` | Web builder |
| `/builder/tema` | Theme gallery (protected, not `userOnly`) |
| `/pos` | Cashier |

**Admin only (`role = admin`)**
`/admin`, `/admin/pengguna`, `/admin/langganan`, `/admin/pembelian`, `/admin/pertumbuhan`, `/admin/profil`, `/admin/pengaturan`

**Auth/onboarding routing:** login sends admins to `/admin`, users with a store that has not finished onboarding (or no store) to `/onboarding`, otherwise to `/dashboard`. `StoreDashboard` redirects users without a store to `/onboarding`; `BuilderPage`, `POSPage`, and `ThemeGalleryPage` still fall back to the legacy `CreateStore` form. `ProtectedRoute` enforces auth; `adminOnly` requires `profile.role === 'admin'`; `userOnly` blocks admins from store pages.

---

## 5. Database (Supabase / PostgreSQL)

Tables in `supabase/schema.sql`:

| Table | Purpose |
|---|---|
| `profiles` | `id` (FK `auth.users`), `full_name`, `email`, `phone`, `avatar_url`, `avatar_path`, `role` (`admin`/`umkm`) |
| `stores` | `owner_id`, `name`, `slug` (unique), `description`, `logo_url`, `whatsapp`, `theme` JSONB, `is_published`, `is_active` |
| `store_sections` | `store_id`, `type`, `position`, `content` JSONB, `is_visible` |
| `categories` | `store_id`, `name`, `icon` (added by migration) |
| `products` | `store_id`, `category_id`, `name`, `price`, `cost_price`, `stock`, `image_url`, `is_active` |
| `discounts` | `store_id`, `product_id` (null = all), `type` (`percent`/`nominal`), `value`, dates, `is_active` |
| `transactions` | POS/online sales header |
| `transaction_items` | Sale line items |
| `finances` | Ledger: `type` (`income`/`expense`), category, amount, note, date, `transaction_id` |

Key functions/triggers:
- `handle_new_user()` — creates `profiles` row on signup; latest migration also copies Google name/avatar
- `is_admin()`, `owns_store(id)` — RLS helpers
- `protect_profile_role()` — blocks role/email self-escalation
- `create_pos_transaction(...)` — **atomic** checkout: transaction + items + stock decrement + finance income
- `prevent_admin_store()` / `prevent_admin_with_store()` — admin accounts cannot own a store
- `admin_list_user_files(uuid)` / `admin_delete_user(uuid)` — admin-only account deletion (storage files + auth user cascade)
- Storage bucket `store-assets` (public read, authenticated upload; avatars under `avatars/<uid>/`; admin delete policy)

**RLS:** public read of published+active stores and their sections/categories/products/discounts; finance and transactions are owner(+admin) only; owners write only their own rows.

> Apply **all** of `schema.sql`, then every file in `supabase/migrations/`:
> `20261028_account_profile.sql`, `20261107_admin_no_store.sql`, `20261108_google_profile_sync.sql`, `20261108_onboarding_state.sql`.
> The onboarding migration marks existing stores as onboarded and adds `categories.icon`.

---

## 6. Core architecture

1. `main.jsx` mounts `BrowserRouter → ThemeProvider → AuthProvider → App` + themed `Toaster`.
2. `AuthContext` initializes the Supabase session, loads `profiles`, and syncs missing Google name/avatar from OAuth metadata without overwriting manual avatars.
3. `useMyStore` fetches the owner's single (oldest) store; pages choose between onboarding/CreateStore/dashboard.
4. **New-user flow:** register → OTP verify → `/onboarding` (StoreStep → PlanStep → done). Completion sets `stores.theme.onboarding_done = true` without clobbering subscription data.
5. Builder and storefront **share** `sectionDefs.js` + `SectionRenderer.jsx`, so editor preview and live site match.
6. Store sections are ordered rows in `store_sections`. Section types are fixed in SQL: **hero, about, products, gallery, testimonials, contact** (plus header/footer config).
7. Products/discounts are queried per store and merged into the Products section at render time.
8. POS calls the `create_pos_transaction` RPC so stock, transaction, and finance stay consistent.
9. **Subscription and onboarding state live inside `stores.theme` (JSONB)** — no dedicated tables. `useSubscription` normalizes it.

### Theme / builder extras
- `src/components/builder/themes.js` defines 4 business presets: **fashion, fnb, beauty, creative**, each with primary color, font, and per-section layout variants. `resolveTheme(store)` merges preset + stored overrides.
- Layout variants (hero/about/products/gallery/testimonials/contact/header/footer) are chosen via `LayoutPicker` and saved in `content.layout`; header/footer layouts in `stores.theme.headerLayout` / `footerLayout`.
- Categories support an icon key (`categories.icon`) chosen via `CategoryIconPicker`.

---

## 7. Environment variables

`.env` (copy from `.env.example`):
```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=...
VITE_PLATFORM_DOMAIN=localhost:5173   # prod: umkm.rtrwstudio.online
```
If Supabase vars are missing, `App.jsx` shows a setup notice (app still renders).
Note: `PLATFORM_DOMAIN` is currently **hardcoded** in `src/lib/supabase.js` and the env value is ignored.
Never use the Supabase `service_role` key in frontend code.

**Auth setup:** enable Google provider for OAuth; add Site/Redirect URLs (`/reset-password`, `/dashboard/pengaturan`); enable manual identity linking. For local dev, disable email confirmation.

**Make an admin:** register, then in SQL Editor:
```sql
update public.profiles set role = 'admin' where email = 'you@example.com';
```
(Admin must not own a store — delete the store first, or create the admin account without a store.)

---

## 8. Subscription plans & trial

Defined in `src/lib/plans.js` (single source of truth). Plans: `basic`, `bisnis`, `pro`. There is **no free plan**; new stores get a **30-day Basic trial**.

| Plan | Monthly | Yearly (per month) | Limits |
|---|---|---|---|
| Basic | Rp10.000 | Rp8.000 | 10 products, unlimited sections, no watermark, 2 GB media, unlimited POS, CSV export |
| Bisnis | Rp30.000 | Rp24.000 | 30 products, unlimited sections, 10 GB media, custom domain, unlimited POS, CSV export |
| Pro | Rp50.000 | Rp40.000 | Everything in Bisnis + advanced finance & profit/loss, 25 GB media, unlimited POS |

- Statuses: `trial` / `active` / `expired` (`billingMode`: `trial` / `active` / `complimentary` / `expired`). Trial uses `basic` limits.
- Trial starts at store creation (30 days), or on demand via `startTrial()`. After it ends, `useSubscription` reports `expired`.
- Checkout is **simulated client-side** (no payment gateway). Upgrades write an invoice into `stores.theme.subscription`.
- Enforcement points: product limit (`Products.jsx`), 4-section limit for expired accounts (`BuilderPage.jsx`), watermark (`StoreFront.jsx`, `HeaderFooter.jsx`), advanced finance (`Finance.jsx`), CSV export for all plans (`Finance.jsx`).
- Admins can grant complimentary plans via `SubscriptionAdminModal`.

---

## 9. Conventions & design system

- **Brand color:** emerald (`brand-*`, primary `#047857`). Dark app theme supported via `ThemeContext` / `ThemeToggle`.
- **Font:** Poppins base; Inter/Baloo 2 loaded in `index.html`. Storefronts use per-theme fonts.
- Reuse CSS component classes from `src/index.css`: `btn-primary`, `btn-secondary`, `btn-ghost`, `card`, `input`, `label`, badges.
- Layout: dark slate sidebar on desktop, drawer on mobile; sticky headers. Dashboard/admin scopes use `.store-scope` / `.ad-scope` for local styling.
- Format money with `Intl.NumberFormat('id-ID')`; Indonesian dates; Asia/Jakarta timestamps.
- Mobile-first, simple Indonesian copy, toast feedback, explicit empty states, confirm destructive actions.
- Guard unsaved changes (builder, profile, logout).
- Slugs are immutable after creation and validated against reserved routes in `src/lib/utils.js`.

---

## 10. Known caveats / gotchas (verify before changing)

- **No real payments** — subscription checkout only records an invoice.
- **Subscription/onboarding live in `stores.theme`**, not tables; store and admin panels both read/write this JSON.
- **Trial uses Basic features for 30 days**; there is no `gratis` plan. `planOf('gratis')` falls back to Basic.
- **Section limit** now comes from plan limits (all unlimited); only **expired** accounts are capped at 4 sections in `BuilderPage.jsx`. Old `/3` copy may linger in docs.
- **POS has no monthly quota on any plan**; POS quotas were removed from `plans.js`.
- **`is_email_registered` RPC** is called during registration but is **not** in `schema.sql`; it must exist in the Supabase project or registration fails.
- **One store per user** in practice (`useMyStore` picks the oldest) even though schema allows many.
- **`store_sections.type`** is a SQL CHECK constraint — adding a section type requires a migration.
- **Admin + store are mutually exclusive** (DB triggers from `20261107_admin_no_store.sql`).
- **Admin account deletion** relies on `admin_list_user_files` / `admin_delete_user`; older projects must apply the latest `schema.sql` functions.
- **`categories.icon`** requires `20261108_onboarding_state.sql`.
- **`PLATFORM_DOMAIN` is hardcoded** and the env var is commented out.
- `PROJECT.md` and `README.md` may lag behind newer features (onboarding, plans, theme gallery, admin guards).
- `dist/` is generated output — never edit directly.

---

## 11. How an AI should work on this repo

- Match existing patterns: plain JSX, functional components, hooks, Tailwind utility classes, Indonesian UI text.
- Check neighboring components before adding a new UI pattern; reuse `src/components/ui/*`.
- Do not introduce TypeScript or a new state library.
- When changing storefront rendering, edit `sectionDefs.js` / `SectionRenderer.jsx` so builder + public site stay in sync.
- When changing plans/limits, edit `src/lib/plans.js` and verify all enforcement points.
- SQL changes go in `supabase/migrations/` (timestamp-prefixed) and must respect RLS.
- Run `npm run build` to verify after changes (no test/lint suite exists).
- Never commit secrets; `.env` is gitignored.
