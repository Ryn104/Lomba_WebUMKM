# AI Project Context — UMKM Web Builder

> Paste this file into any AI assistant so it understands this codebase before helping.
> For full details see `PROJECT.md`; for setup see `README.md`.

---

## 1. What this project is

**UMKM Web Builder** (package: `umkm-web-builder`) is a SaaS platform for Indonesian micro/small businesses (UMKM). Each user registers, creates **one store**, and gets:

- A **public storefront** at `/{slug}`
- A **drag-and-drop website builder**
- A **store dashboard** (products, discounts, finance, settings, subscription)
- An **offline point-of-sale (POS/cashier)**
- A **platform admin panel**

UI language is **Indonesian**. Currency is **Rupiah**, timezone **Asia/Jakarta**.
Hardcoded platform domain: `umkita.rtrwstudio.online` (`PLATFORM_DOMAIN` in `src/lib/supabase.js`).

Relationship: `1 user = 1 store` (enforced by app logic and admin trigger).

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
| Icons | Lucide React |
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
├─ main.jsx                      # Root: BrowserRouter > ThemeProvider > AuthProvider
├─ App.jsx                       # Top-level route table
├─ index.css                     # Tailwind layers + component classes (.btn-*, .card, .input)
├─ context/
│  ├─ AuthContext.jsx            # Session, profile, auth helpers (login, OTP register, OAuth)
│  └─ ThemeContext.jsx           # Light/dark mode for the app UI
├─ hooks/
│  ├─ useMyStore.js              # Loads signed-in user's store
│  └─ useSubscription.js         # Plan, limits, upgrade/cancel, invoices
├─ lib/
│  ├─ supabase.js                # Client, PLATFORM_DOMAIN, BUCKET, uploadImage()
│  └─ utils.js                   # Rupiah/date format, slugify, discount math, reserved slugs
├─ pages/                        # One file per route (see §4)
└─ components/
   ├─ ui/                        # Field, Modal, Sidebar, ImageUpload, MoneyInput, Avatar, ...
   ├─ builder/                   # CreateStore, SectionEditor, SortableItem, LayoutPicker, themes.js
   ├─ store-front/               # sectionDefs.js, SectionRenderer.jsx, HeaderFooter
   ├─ store-dashboard/           # Overview, Products, Discounts, Finance, StoreSettings
   ├─ subscription/              # UpgradeModal, ComparePlans, banners, limit modals
   └─ admin/                     # AdminOverview, Users, Subscriptions, Purchases, Growth + modals
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
| `/dashboard` | Overview |
| `/dashboard/produk` | Products |
| `/dashboard/diskon` | Discounts |
| `/dashboard/keuangan` | Finance |
| `/dashboard/langganan` | Subscription |
| `/dashboard/profil` | Account profile |
| `/dashboard/pengaturan` | Account security / store settings |
| `/builder` | Web builder |
| `/builder/tema` | Theme gallery (theme presets) |
| `/pos` | Cashier |

**Admin only (`role = admin`)**
`/admin`, `/admin/pengguna`, `/admin/langganan`, `/admin/pembelian`, `/admin/pertumbuhan`

Users with no store get the `CreateStore` wizard on dashboard/builder/POS routes.
`ProtectedRoute` enforces auth; `adminOnly` additionally requires `profile.role === 'admin'`.
Uses `userOnly` so admins cannot open store pages.

---

## 5. Database (Supabase / PostgreSQL)

Tables in `supabase/schema.sql`:

| Table | Purpose |
|---|---|
| `profiles` | `id` (FK `auth.users`), `full_name`, `email`, `phone`, `avatar_url`, `avatar_path`, `role` (`admin`/`umkm`) |
| `stores` | `owner_id`, `name`, `slug` (unique), `description`, `logo_url`, `whatsapp`, `theme` JSONB, `is_published`, `is_active` |
| `store_sections` | `store_id`, `type`, `position`, `content` JSONB, `is_visible` |
| `categories` | `store_id`, `name` |
| `products` | `store_id`, `category_id`, `name`, `price`, `cost_price`, `stock`, `image_url`, `is_active` |
| `discounts` | `store_id`, `product_id` (null = all), `type` (`percent`/`nominal`), `value`, dates, `is_active` |
| `transactions` | POS/online sales header |
| `transaction_items` | Sale line items |

Key functions/triggers:
- `handle_new_user()` — creates `profiles` row on signup
- `is_admin()`, `owns_store(id)` — RLS helpers
- `protect_profile_role()` — blocks role/email self-escalation
- `create_pos_transaction(...)` — **atomic** checkout: transaction + items + stock decrement + finance income
- `prevent_admin_store()` / `prevent_admin_with_store()` — admin accounts cannot own a store (migration `20261107_admin_no_store.sql`)
- Storage bucket `store-assets` (public read, authenticated upload; avatars under `avatars/<uid>/`)

**RLS:** public read of published+active stores and their sections/products/discounts; finance and transactions are owner(+admin) only; owners write only their own rows.

> Apply **all** of `schema.sql`, then every file in `supabase/migrations/` (currently `20261028_account_profile.sql`, `20261107_admin_no_store.sql`).

---

## 6. Core architecture

1. `main.jsx` mounts `BrowserRouter → ThemeProvider → AuthProvider → App` + themed `Toaster`.
2. `AuthContext` initializes the Supabase session and loads the `profiles` row.
3. `useMyStore` fetches the owner's single store; if absent, pages render `CreateStore`.
4. Builder and storefront **share** `sectionDefs.js` + `SectionRenderer.jsx`, so the editor preview and live site match.
5. Store sections are ordered rows in `store_sections`. Section types are fixed in SQL: **hero, about, products, gallery, testimonials, contact** (plus header/footer config).
6. Products/discounts are queried per store and merged into the Products section at render time.
7. POS calls the `create_pos_transaction` RPC so stock, transaction, and finance stay consistent.
8. **Subscription state is stored inside `stores.theme.subscription` (JSONB)** — no dedicated tables. `useSubscription` normalizes it.

### Theme / builder extras
- `src/components/builder/themes.js` defines 4 business presets: **fashion, fnb, beauty, creative**, each with a primary color and per-section layout variants.
- Layout variants (hero/about/products/gallery/testimonials/contact/header/footer) are chosen via `LayoutPicker` and saved in `content.layout`.
- Storefront also supports header/footer layout choices.

---

## 7. Environment variables

`.env` (copy from `.env.example`):
```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=...
VITE_PLATFORM_DOMAIN=localhost:5173   # prod: umkita.rtrwstudio.online
```
If Supabase vars are missing, `App.jsx` shows a setup notice (app still renders).
Note: `PLATFORM_DOMAIN` is currently hardcoded in `src/lib/supabase.js` and the env value is commented out.
Never use the Supabase `service_role` key in frontend code.

**Auth setup:** enable Google provider for OAuth; add Site/Redirect URLs (`/reset-password`, `/dashboard/pengaturan-akun?google_link=1`); enable manual identity linking. For local dev, disable email confirmation.

**Make an admin:** register, then in SQL Editor:
```sql
update public.profiles set role = 'admin' where email = 'you@example.com';
```
(Admin must not own a store — delete the store first, or create the admin account without a store.)

---

## 8. Subscription plans

| Plan | Monthly | Yearly (per month) | Limits |
|---|---|---|---|
| Gratis | Rp0 | — | 10 products, 3 sections, watermark, no advanced finance |
| Bisnis | Rp79.000 | Rp63.000 | Unlimited products/sections, no watermark, 5 GB media, 500 POS/month |
| Pro | Rp149.000 | Rp119.000 | Bisnis + advanced finance & CSV export, 20 GB media, unlimited POS |

- Checkout is **simulated client-side** (no real payment gateway). Upgrades write an invoice into `stores.theme.subscription`.
- Enforcement: product limit (`Products.jsx`), section limit (`BuilderPage.jsx`), watermark (`StoreFront.jsx`), advanced finance (`Finance.jsx`).
- Admins can grant complimentary plans via `SubscriptionAdminModal`.

---

## 9. Conventions & design system

- **Brand color:** emerald (`brand-*`, primary `#047857`). Dark app theme supported via `ThemeContext` / `ThemeToggle`.
- **Font:** Poppins base; Inter/Baloo 2 loaded in `index.html`.
- Reuse CSS component classes from `src/index.css`: `btn-primary`, `btn-secondary`, `btn-ghost`, `card`, `input`, `label`, badges.
- Layout: dark slate sidebar on desktop, drawer on mobile; sticky headers.
- Format money with `Intl.NumberFormat('id-ID')`; Indonesian dates; Asia/Jakarta timestamps.
- Mobile-first, simple Indonesian copy, toast feedback, explicit empty states, confirm destructive actions.
- Guard unsaved changes (builder, profile, logout).
- Slugs are immutable after creation and validated against reserved routes in `src/lib/utils.js`.

---

## 10. Known caveats / gotchas (verify before changing)

- **No real payments** — subscription checkout only records an invoice.
- **Subscription lives in `stores.theme.subscription`**, not tables; both store and admin panels read/write this JSON.
- **Section limit mismatch:** `useSubscription` returns `maxSections: 3`, but `BuilderPage` historically enforced 4 — reconcile when touching this.
- **`is_email_registered` RPC** is called during registration but is **not** in `schema.sql`; it must exist in the Supabase project or registration fails.
- **One store per user** in practice (`useMyStore` picks the oldest) even though schema allows many.
- **`store_sections.type`** is a SQL CHECK constraint — adding a section type requires a migration.
- **Admin + store are mutually exclusive** (DB triggers from `20261107_admin_no_store.sql`).
- `PROJECT.md` and `README.md` may lag behind newer features (theme gallery, admin guards).
- `dist/` is generated output — never edit directly.

---

## 11. How an AI should work on this repo

- Match existing patterns: plain JSX, functional components, hooks, Tailwind utility classes, Indonesian UI text.
- Check neighboring components before adding a new UI pattern; reuse `src/components/ui/*`.
- Do not introduce TypeScript or a new state library.
- When changing storefront rendering, edit `sectionDefs.js` / `SectionRenderer.jsx` so builder + public site stay in sync.
- SQL changes go in `supabase/migrations/` (timestamp-prefixed) and must respect RLS.
- Run `npm run build` to verify after changes (no test/lint suite exists).
- Never commit secrets; `.env` is gitignored.
