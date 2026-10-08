# LOOKS — Customer Storefront (`/client`)

Premium Saudi beauty & salon e-commerce frontend. React 19 + Vite + TypeScript + Tailwind CSS v4 + React Router 7 + Zustand.
This phase runs entirely on **mock data** — no backend, database or payment provider is connected.

```bash
cd client
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production build to dist/
npm run preview  # serve the production build
```

## Demo credentials

| Flow | Value |
|---|---|
| Phone login (any Saudi mobile) | OTP **123456** |
| Email login | `noura@example.com` + any password of 6+ characters |
| Coupons | `WELCOME10` (10%), `BEAUTY15` (15%, min 300 SAR), `SALON20` (20%, min 500 SAR) |

## Structure

```
src/
  config/store.ts     Store name, currency, VAT, shipping rules, contact, cities, payment methods
  types/              All domain types (Product, Brand, Order, CartItem, …)
  data/               Mock data: 117 products, 45 brands, categories, reviews, orders, offers, images
  services/           Promise-based mock API — the only layer the UI uses for data
  store/              Zustand stores (cart, wishlist, auth, account, checkout, ui) persisted to localStorage
  i18n/               en.ts / ar.ts (shared) + pages/<area>.ts (page strings), useT() hook
  components/         common/, layout/, product/, home/, category/, brand/, cart/, checkout/, account/, auth/, reviews/, search/, static/
  layouts/            MainLayout, AccountLayout
  pages/              One file per route (account pages in pages/account/)
```

## Connecting the backend later

UI components never read the mock arrays directly. Replace the bodies of the functions in
`src/services/*.ts` (productService, catalogService, searchService, reviewService, authService, orderService)
with HTTP calls that return the same types — no component changes are needed.
Cart lines store a price snapshot; the server should re-price on checkout.

## Branding

- Store name, tagline and contact details: `src/config/store.ts`
- Logo: `src/components/common/Brand.tsx` → `Logo` (text wordmark styled after the client logo; swap for an `<img>` when the vector file is ready). The client's logo photo is in `public/logo.jpeg`.
- Colors, fonts, animations: design tokens in `src/index.css` (`@theme`)
- Images: `src/data/images.ts` (curated Unsplash photos; replace with real product photography)
