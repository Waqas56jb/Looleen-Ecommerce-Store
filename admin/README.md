# LOOKS — Admin Panel (`/admin`)

Back-office for the LOOKS Saudi beauty & salon store. React 19 + Vite + TypeScript + Tailwind CSS v4 + React Router 7 + Zustand + Recharts.
This phase runs entirely on **mock data** persisted in the browser — no backend, database or payment gateway is connected.

```bash
cd admin
npm install
npm run dev      # http://localhost:5174
npm run build    # type-check + production build
```

**Demo login:** `admin@beautystore.sa` / `Admin@123` (Mohammed B Amr — Super Admin)

## Architecture

```
UI (pages, components)
  ↓
hooks (useAsync, useListState …)
  ↓
services/*  ← the ONLY data layer the UI calls (Promise-based, simulated latency)
  ↓
store/db.ts ← mock database: one persisted Zustand store per collection (localStorage `admin_*`)
  ↓
data/seed/* ← deterministic seed data (products & brands shared with the storefront catalog)
```

To connect the real backend, replace the function bodies in `src/services/*.ts` with HTTP calls returning the same types.
Services already record activity-log entries and notifications on mutations, mirroring what the server will do.

| Folder | Purpose |
|---|---|
| `src/config/store.ts` | Store name, currency, VAT, shipping defaults, cities, payment methods |
| `src/types/` | All admin domain types |
| `src/data/catalog/` | Products, brands, categories and images shared with `/client` |
| `src/data/seed/` | Orders, customers, reviews, returns, coupons, campaigns, banners, analytics … |
| `src/services/` | Mock API (products, catalog, inventory, orders, customers, moderation, marketing, analytics, system, auth) |
| `src/components/ui/` | Design-system components (DataTable, forms, overlays, StatCard, Money …) |
| `src/i18n/` | English + Arabic (`en.ts`, `ar.ts`, `pages/<area>.ts`) with full RTL |
| `src/utils/permissions.ts` | Frontend role → permission map (server enforces later) |

## Persistence keys

`admin_auth`, `admin_ui` (language, sidebar), `admin_products`, `admin_orders`, `admin_inventory`, `admin_customers`, `admin_settings`, `admin_notifications`, `admin_activity`, … — reset everything from **Settings → General → Reset demo data**.
