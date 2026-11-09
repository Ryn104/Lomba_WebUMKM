# UMKM Web Builder — Project Documentation

> A SaaS platform that lets Indonesian small businesses (UMKM) build a store website without coding, manage products, track finances, and run an offline point-of-sale — all from one dashboard.

---

## 1. Overview

| Item | Value |
|---|---|
| Project name | `umkm-web-builder` |
| Package version | `1.0.0` |
| Product name | UMKM Builder |
| Platform domain | `umkm.rtrwstudio.online` (configurable) |
| Default store URL | `<platform-domain>/<store-slug>` |
| UI language | Indonesian |
| App type | Single Page Application (SPA) |
| Primary market | Indonesian UMKM (micro, small, medium businesses) |

Each registered user owns one store (`1 user = 1 store`) with its own public website, dashboard, finance ledger, and POS.

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| UI framework | React 18 (`react`, `react-dom`) |
| Build tool | Vite 5 |
| Language | JavaScript / JSX (ES modules, no TypeScript) |
| Styling | Tailwind CSS 3 + PostCSS + Autoprefixer |
| Routing | React Router DOM 6 |
| Backend / BaaS | Supabase (`@supabase/supabase-js`) — Auth, PostgreSQL, Storage |
| Drag & drop | `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` |
| Charts | Recharts |
| Maps | Leaflet + React Leaflet |
| Icons | Lucide React |
| Notifications | React Hot Toast |
| Deployment | Any static SPA host (Vercel config + Netlify/Cloudflare `_redirects` included) |

---

## 3. Feature Summary

### Public / Marketing
- **Landing page** with hero, feature grid, "how it works", and CTA.
- **Storefront** at `/:slug` rendering the store's published, visible sections.
- Optional platform watermark on the storefront for free-plan stores.

### Authentication & Account
- Email/password login and registration.
- **OTP-based registration**: a 6-digit code is emailed first; name and password are saved only after verification.
- Google OAuth sign-in and account linking/unlinking.
- Forgot-password and reset-password flows.
- Account profile page (name, phone, avatar) with unsaved-change guards.
- Account security page (password change, connected providers, email verification status).

### Store Dashboard
- **Overview**: product count, monthly income/expense, today's sales, 7-day chart, low-stock list, recent transactions.
- **Products**: CRUD products, categories, image upload, active toggle, stock, selling/cost price.
- **Discounts**: percent or nominal discounts, per-product or store-wide, date ranges.
- **Finance**: income/expense records, monthly summary, category breakdown, CSV export.
- **Settings**: store name, description, WhatsApp, logo. Slug is immutable after creation.
- **Subscription management**: active plan, renewal date, payment history/invoices, upgrade/downgrade, usage meters.

### Web Builder (`/builder`)
- Section-based drag-and-drop editor using dnd-kit.
- Section types: **Hero, Tentang Kami (About), Produk, Galeri, Testimoni, Kontak (Contact)**.
- Real-time desktop/mobile preview.
- Per-section property editor (text, images, colors, alignment, columns, map location).
- Global primary color.
- Save to `store_sections`, publish/unpublish, unsaved-changes indicator.
- Products and active discounts are pulled automatically into the Products section.
- Expired accounts are limited to 4 builder sections; active plans are unlimited.

### POS / Cashier (`/pos`)
- Product catalog with search and category filter.
- Cart with quantity controls and automatic discount calculation.
- Payment methods: **Tunai (cash), QRIS, Transfer**.
- Cash change calculation and quick-pay buttons.
- Atomic checkout via the `create_pos_transaction` RPC: creates transaction + items, decrements stock, records income.
- Printable receipt modal.

### Admin Platform (`/admin`)
- Overview: stores, users, live stores, monthly revenue, estimated MRR, growth chart, expiring subscriptions.
- **Users**: search, role changes (admin/umkm), activate/deactivate/delete stores, CSV export.
- **Subscriptions**: filter by plan, manage plan/renewal manually (complimentary access).
- **Purchases**: subscription invoice history, filters, CSV export.
- **Growth**: registration and store growth charts.

---

## 4. User Roles

| Role | Description | Access |
|---|---|---|
| `umkm` | Store owner (default) | Own store dashboard, builder, POS, account pages |
| `admin` | Platform administrator | Admin dashboard, all stores/users, subscription overrides |

Admin is granted manually via SQL (see setup).

---

## 5. Routes

| Route | Page | Access |
|---|---|---|
| `/` | Landing page | Public |
| `/login` | Login | Public |
| `/register` | Register (OTP flow) | Public |
| `/lupa-password` | Forgot password | Public |
| `/reset-password` | Reset password | Public (requires recovery session) |
| `/dashboard` | Store dashboard — Overview | Authenticated |
| `/dashboard/produk` | Products | Authenticated |
| `/dashboard/diskon` | Discounts | Authenticated |
| `/dashboard/keuangan` | Finance | Authenticated |
| `/dashboard/langganan` | Subscription management | Authenticated |
| `/dashboard/pengaturan` | Store settings | Authenticated |
| `/dashboard/profil` | Account profile | Authenticated |
| `/dashboard/pengaturan-akun` | Account security | Authenticated |
| `/builder` | Web builder | Authenticated |
| `/pos` | Cashier / POS | Authenticated |
| `/admin` | Admin overview | Admin only |
| `/admin/pengguna` | Admin users | Admin only |
| `/admin/langganan` | Admin subscription status | Admin only |
| `/admin/pembelian` | Admin purchases | Admin only |
| `/admin/pertumbuhan` | Admin growth | Admin only |
| `/:slug` | Public storefront | Public |

Users without a store are shown the **CreateStore** wizard when opening `/dashboard`, `/builder`, or `/pos`.

---

## 6. Project Structure

```
Lomba_WebUMKM/
├─ index.html                  # Vite entry HTML (fonts, favicon)
├─ package.json
├─ vite.config.js
├─ tailwind.config.js          # Brand (emerald), surface, border, status colors
├─ postcss.config.js
├─ vercel.json                 # SPA rewrite to index.html
├─ .env.example                # Supabase URL/key + platform domain
├─ README.md                   # Setup + workflow (Indonesian)
├─ PROJECT.md                  # This document
├─ docs/
│  └─ AI-UIUX-SPEC.md          # Product & UI/UX specification
├─ public/
│  ├─ logo.png / logo2.png / logo3.png
│  └─ _redirects               # Netlify/Cloudflare SPA fallback
├─ supabase/
│  ├─ schema.sql               # Tables, triggers, RPC, RLS, storage bucket
│  └─ migrations/
│     └─ 20261028_account_profile.sql
├─ src/
│  ├─ main.jsx                 # React root, Router, AuthProvider, Toaster
│  ├─ App.jsx                  # Route table + setup notice
│  ├─ index.css                # Tailwind layers, CSS variables, component classes
│  ├─ context/
│  │  └─ AuthContext.jsx       # Session, profile, auth helpers
│  ├─ hooks/
│  │  ├─ useMyStore.js         # Fetch the signed-in user's store
│  │  └─ useSubscription.js    # Plan state, limits, upgrade/cancel, invoices
│  ├─ lib/
│  │  ├─ supabase.js           # Client, PLATFORM_DOMAIN, BUCKET, uploadImage
│  │  └─ utils.js              # Rupiah/date formatting, slugify, discounts, etc.
│  ├─ components/
│  │  ├─ ui/                   # Field, Modal, Sidebar, ImageUpload, MoneyInput, ...
│  │  ├─ builder/              # CreateStore, SectionEditor, SortableItem, LocationPicker
│  │  ├─ store-front/          # sectionDefs, SectionRenderer
│  │  ├─ store-dashboard/      # Overview, Products, Discounts, Finance, StoreSettings
│  │  ├─ subscription/         # UpgradeModal, ComparePlansModal, banners, limit modals
│  │  └─ admin/                # Admin overview/users/subscriptions/purchases/growth
│  └─ pages/
│     ├─ LandingPage.jsx
│     ├─ LoginPage.jsx
│     ├─ RegisterPage.jsx
│     ├─ ForgotPasswordPage.jsx
│     ├─ ResetPasswordPage.jsx
│     ├─ StoreDashboard.jsx
│     ├─ BuilderPage.jsx
│     ├─ POSPage.jsx
│     ├─ StoreFront.jsx
│     ├─ AdminDashboard.jsx
│     ├─ SubscriptionPage.jsx
│     ├─ AccountProfilePage.jsx
│     └─ AccountSecurityPage.jsx
└─ dist/                       # Production build output
```

---

## 7. Architecture & Data Flow

1. `main.jsx` mounts `BrowserRouter` → `AuthProvider` → `App`, plus the global toast container.
2. `AuthContext` initializes the Supabase session, loads the `profiles` row, and exposes auth helpers.
3. `ProtectedRoute` gates dashboard/builder/POS routes; `adminOnly` additionally requires `profile.role === 'admin'`.
4. `useMyStore` loads the owner's store; if none exists, pages render `CreateStore`.
5. The builder and storefront share `SectionRenderer` + `sectionDefs`, so the preview matches the live site.
6. Products/discounts are queried per store and merged with builder sections at render time.
7. POS calls a single Postgres RPC to keep transaction, stock, and finance updates atomic.
8. Subscription state is stored in `stores.theme.subscription` (JSONB) and normalized by `useSubscription`.

---

## 8. Database Schema (Supabase / PostgreSQL)

| Table | Purpose | Key columns |
|---|---|---|
| `profiles` | User profiles | `id` (FK auth.users), `full_name`, `email`, `phone`, `avatar_url`, `avatar_path`, `role` (`admin`/`umkm`) |
| `stores` | Store/tenant | `owner_id`, `name`, `slug` (unique), `description`, `logo_url`, `whatsapp`, `theme` (JSONB), `is_published`, `is_active` |
| `store_sections` | Builder config | `store_id`, `type` (`hero`/`about`/`products`/`gallery`/`testimonials`/`contact`), `position`, `content` (JSONB), `is_visible` |
| `categories` | Product categories | `store_id`, `name` |
| `products` | Store products | `store_id`, `category_id`, `name`, `description`, `price`, `cost_price`, `stock`, `image_url`, `is_active` |
| `discounts` | Promotions | `store_id`, `product_id` (null = all), `name`, `type` (`percent`/`nominal`), `value`, `start_date`, `end_date`, `is_active` |
| `transactions` | POS/online sales | `store_id`, `invoice_no`, `subtotal`, `discount_total`, `total`, `paid`, `change_amount`, `payment_method`, `source` |
| `transaction_items` | Sale line items | `transaction_id`, `product_id`, `product_name`, `price`, `qty`, `discount`, `subtotal` |
| `finances` | Ledger | `store_id`, `type` (`income`/`expense`), `category`, `amount`, `note`, `date`, `transaction_id` |

### Database functions / triggers
- `handle_new_user()` — creates a `profiles` row on `auth.users` insert.
- `is_admin()` — checks the current user's admin role.
- `owns_store(store_id)` — checks store ownership for RLS.
- `protect_profile_role()` — prevents non-admins from changing their role or `profiles.email`.
- `create_pos_transaction(...)` — atomic POS checkout (transaction + items + stock decrement + finance income), invoice format `INV-YYMMDD-HHMISS-xxxx` in Asia/Jakarta.
- Storage bucket `store-assets` (public read; authenticated uploads; avatars scoped to `avatars/<uid>/`).

### Row Level Security
- Published + active stores, sections, categories, products, and discounts are publicly readable.
- Finance and transaction data are private to the owner (admins may read).
- Owners manage only their own rows via `owns_store()`.
- Profile reads are self-or-admin; profile role changes are admin-only.

---

## 9. Subscription Model

Plans are defined client-side and persisted as JSON under `stores.theme.subscription`.

| Plan | Monthly | Yearly (per month) | Key limits |
|---|---|---|---|
| **Basic** | Rp10.000 | Rp8.000 | 10 products, all sections, no watermark, 2 GB media, unlimited POS, CSV export |
| **Bisnis** | Rp30.000 | Rp24.000 | 30 products, all sections, no watermark, custom domain, 10 GB media, unlimited POS, CSV export |
| **Pro** | Rp50.000 | Rp40.000 | Everything in Bisnis + advanced finance & profit/loss, 25 GB media, unlimited POS |

Implementation notes:
- `useSubscription` exposes `plan`, `limits`, `upgrade`, `cancelSubscription`, `dismissPromo`, and invoices.
- Checkout is simulated in the client (`UpgradeModal`) and records an invoice in the subscription JSON; there is no live payment gateway integration.
- Admins can grant complimentary plan access through `SubscriptionAdminModal`.
- New stores start with a 30-day Basic trial; Kasir POS has no monthly quota on any plan.
- Enforcement points: product limit (Basic 10, Bisnis 30, Pro unlimited) in `Products.jsx`, section limit in `BuilderPage.jsx`, watermark in `StoreFront.jsx`, advanced finance in `Finance.jsx`.

---

## 10. Environment Variables

Create `.env` from `.env.example`:

```env
VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_PLATFORM_DOMAIN=localhost:5173
```

- `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` — from Supabase → Project Settings → API.
- `VITE_PLATFORM_DOMAIN` — display domain for store URLs (production: `umkm.rtrwstudio.online`).
- If Supabase is not configured, the app renders a setup notice banner.

---

## 11. Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# edit .env with your Supabase credentials

# 3. Apply the database schema
#    Open Supabase SQL Editor and run the entire supabase/schema.sql
#    Then run supabase/migrations/20261028_account_profile.sql if upgrading.

# 4. Run the dev server
npm run dev
```

### Create an admin
1. Register normally via `/register`.
2. In Supabase SQL Editor:
   ```sql
   update public.profiles set role = 'admin' where email = 'your-email@example.com';
   ```
3. Open `/admin`.

For easier local development, disable **Confirm email** in Supabase → Authentication → Providers → Email.

### Supabase Auth configuration
- Enable the **Google** provider for OAuth login/linking.
- Add your site URL and redirect URLs (`/reset-password`, `/dashboard/pengaturan-akun?google_link=1`) under Authentication → URL Configuration.
- Manual identity linking must be enabled for "Sambungkan Google" to work.

---

## 12. Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server on port 5173 |
| `npm run build` | Build production assets to `dist/` |
| `npm run preview` | Preview the production build locally |

There is no configured lint or test script in `package.json`.

---

## 13. Deployment

- Build with `npm run build`; serve the `dist/` directory.
- SPA fallback is preconfigured:
  - `vercel.json` rewrites all paths to `/index.html`.
  - `public/_redirects` covers Netlify/Cloudflare Pages.
- Point the `umkm` subdomain DNS to the host and set `VITE_PLATFORM_DOMAIN`.
- Add the production URL to Supabase Auth → URL Configuration.

---

## 14. Design System & Conventions

- **Brand color:** emerald (`brand-*`, primary `#047857`), replacing the earlier indigo spec.
- **Font:** Poppins (Tailwind default), with Inter/Baloo 2 loaded in `index.html`.
- **Styling:** Tailwind utility classes plus reusable component classes in `src/index.css` (`btn-primary`, `btn-secondary`, `btn-ghost`, `card`, `input`, `label`, badges).
- **Layout:** dark slate sidebar on desktop, drawer on mobile; sticky headers.
- **Formatting:** Rupiah via `Intl.NumberFormat('id-ID')`, Indonesian dates, Asia/Jakarta timestamps.
- **UX principles:** mobile-first, simple Indonesian copy, instant toast feedback, informative empty states, confirmations for destructive actions.
- **Unsaved-change protection:** builder, profile, and logout flows warn before discarding changes.

---

## 15. Notable Implementation Details & Caveats

- **Subscription data lives in `stores.theme.subscription`**, not in dedicated tables. Admin and store dashboards both read/write this JSON.
- **No real payment gateway**: upgrade checkout is simulated client-side and stores an invoice record.
- **Section limit mismatch:** `useSubscription` reports `maxSections: 3`, but `BuilderPage` enforces 4 sections (`sections.length >= 4`) and the subscription page displays `/3`. This should be reconciled.
- **`is_email_registered` RPC** is called during registration (`AuthContext`) but is not defined in `supabase/schema.sql`; it must exist in the Supabase project or registration will fail.
- **README is partially outdated**: it describes only the original feature set, while subscription, account profile/security, forgot/reset password, and admin subscription screens are now implemented.
- **`useMyStore` selects one store** (oldest) even though the schema allows multiple stores per owner; the product currently assumes one store per user.
- **`store_sections.type`** is constrained in SQL to the six section types; adding a new section type requires a schema change.
- **Slugs** are immutable after store creation (`StoreSettings` disables the field) and validated against reserved routes in `src/lib/utils.js`.
- **Images** are uploaded to the public `store-assets` bucket; profile avatars use the `avatars/<uid>/` path and are owner-scoped by storage policy.

---

## 16. Related Documents

- `README.md` — original setup and workflow guide (Indonesian).
- `docs/AI-UIUX-SPEC.md` — full product and UI/UX specification, including subscription and template ideas.
- `supabase/schema.sql` — authoritative database schema.
