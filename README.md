# Zarro — Multi-brand Beauty E-commerce

A full-stack e-commerce app for selling beauty products from multiple brands.

**Stack:** React (Vite) · Node.js/Express · MySQL · JWT + bcrypt auth · Axios/REST · Tailwind CSS

## What's included

**User panel**
- Register / login / logout (JWT); suspended accounts are blocked at login
- Browse, search, and filter products by category and brand
- Product detail pages with gallery and related products, showing discount pricing
- Cart persisted in MySQL: add / update quantity / remove
- Checkout with customer info + shipping details, and payment method selection (Cash on delivery, Visa, Mastercard, EasyPaisa, JazzCash)
- Order history and order status tracking (Pending → Confirmed → Processing → Shipped → Delivered, or Cancelled), plus payment status
- Responsive layout (mobile / tablet / desktop)

**Admin panel** (`/admin`, requires an admin account)
- Secure admin login (same JWT auth, gated by role)
- Dashboard with product / user / order counts and revenue
- Add / edit / soft-delete products, with image upload (multipart) or an image URL
- Manage categories and brands
- View all customer orders, view order detail, change order status
- Manage users: view accounts, promote/demote admin role, suspend/reactivate

**Products** have: name, description, brand, category, price, discount price, stock, image, and status (active/inactive).

**Orders** capture: customer info (name/email/phone), line items with quantity and price, subtotal/shipping/total, shipping address, payment method, payment status, and order status.

## Project structure

```
zarro/
  backend/
    controllers/       route handlers
    routes/             REST routes
    middleware/          auth, admin-only, file upload
    services/
      paymentService.js  orchestrates providers, records transactions
      providers/          one file per payment provider (mock + live placeholder)
    database/           schema.sql, seed.js
    uploads/             uploaded product/brand images (served at /uploads)
  frontend/            React (Vite) app — user panel + admin panel
```

## 1. Set up the database

```bash
mysql -u root -p < backend/database/schema.sql
```

Creates `zarro_db`, all tables (including `payment_transactions`), and seeds 4 brands, 4 categories, and 12 sample products.

## 2. Backend setup

```bash
cd backend
cp .env.example .env
# edit .env with your MySQL credentials, a strong JWT_SECRET, and payment settings
npm install
npm run seed     # creates the admin account: admin@zarro.com / Admin@123
npm run dev       # starts the API on http://localhost:5000
```

## 3. Frontend setup

```bash
cd frontend
npm install
npm run dev        # starts the app on http://localhost:5173
```

## 4. Log in

- **Customer:** register a new account from the app.
- **Admin:** `admin@zarro.com` / `Admin@123` — visit `/admin` after logging in.

## Payments — how the placeholder is structured

`PAYMENTS_MODE=test` (the default) routes every checkout through mock providers in `backend/services/providers/`, so the full order → payment → status flow can be built and demoed before real gateway access exists:

- `cardProvider.js` is shared by Visa and Mastercard; `walletProvider.js` is shared by EasyPaisa and JazzCash.
- Each provider implements `initiate()` and `verify()`. In test mode they simulate a gateway round trip and return a mock reference; in `PAYMENTS_MODE=live` they currently throw with a clear "not configured yet" error — replace that block with the real gateway call once you have credentials.
- **No raw card number or CVV is ever accepted by the backend.** `paymentController.js` rejects any request containing `cardNumber`/`cvv`; a real integration should tokenize card details client-side via the gateway's own hosted-fields SDK and send only that token.
- Every payment attempt is recorded in `payment_transactions` (provider, mode, gateway reference, status, raw response) — never card data — and updates the parent order's `payment_status`.
- API keys are read from environment variables (`VISA_API_KEY`, `EASYPAISA_MERCHANT_ID`, etc. — see `.env.example`) and are `null` until you fill them in.

To add a real gateway: implement the "Live mode placeholder" branch in the relevant provider file, set `PAYMENTS_MODE=live`, and fill in its env vars.

## Image uploads

`POST /api/products` and `PUT /api/products/:id` accept `multipart/form-data` with an `image` field (via `multer`, see `middleware/uploadMiddleware.js`); files are stored in `backend/uploads/` and served at `http://localhost:5000/uploads/<filename>`. A generic `POST /api/uploads` endpoint is also available for images not tied to a product (e.g. a brand logo) — it returns `{ url }` to save wherever needed. Max file size 5MB; jpg/jpeg/png/webp/gif only.

## API overview

| Method | Route | Description |
|---|---|---|
| POST | /api/auth/register, /api/auth/login | Register / log in |
| GET/PUT | /api/auth/me | Current user profile |
| GET | /api/products | List (search, category, brand, price, sort, pagination) |
| GET | /api/products/:slug | Product detail |
| POST/PUT/DELETE | /api/products | Admin: create/edit/soft-delete (multipart for images) |
| GET | /api/products/admin/all | Admin: all products incl. inactive |
| GET/POST/PUT/DELETE | /api/categories, /api/brands | List / admin manage |
| GET/POST/PUT/DELETE | /api/cart | Manage the logged-in user's cart |
| POST | /api/orders | Place an order |
| GET | /api/orders, /api/orders/:id | My orders / order detail |
| GET | /api/orders/admin/all | Admin: all orders |
| GET | /api/orders/admin/stats | Admin: dashboard summary |
| PUT | /api/orders/:id/status | Admin: update order status |
| GET | /api/users, /api/users/:id | Admin: list/view users |
| PUT | /api/users/:id/status, /api/users/:id/role | Admin: suspend/reactivate, promote/demote |
| POST | /api/payments/initiate | Start a payment for an order (test-mode mock unless PAYMENTS_MODE=live) |
| POST | /api/payments/verify | Re-check a payment's status with the provider |
| GET | /api/payments/order/:orderId | Payment transaction history for an order |
| POST | /api/uploads | Admin: generic image upload, returns `{ url }` |

## Notes for production

- Replace `JWT_SECRET` with a long random value and never commit `.env`.
- Fill in real provider credentials and implement each provider's live-mode branch before setting `PAYMENTS_MODE=live` — do not ship "always succeeds" mock logic to production.
- Uploaded images are stored on local disk under `backend/uploads/` — for multi-server deployments, swap this for S3 or similar object storage.
- Add request rate limiting and stricter input validation (e.g. `express-validator`, already a dependency) before going live.
