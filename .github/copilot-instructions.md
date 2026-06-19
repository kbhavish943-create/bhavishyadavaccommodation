# AI Agent Instructions for my-website

## Project Overview
A full-stack web application with **multi-layer payment processing** (Razorpay + Stripe), contact forms, product catalog, and user authentication via Firebase. Three distinct implementations coexist for backend: Express.js (Node), standalone PHP, and legacy api.php.

## Architecture at a Glance

### Frontend (Next.js + TypeScript)
- **Port:** 3001
- **Key Dirs:** `frontend/pages`, `frontend/components`, `frontend/lib`
- **Frameworks:** Next.js 13, React 18, Tailwind CSS, Firebase Auth
- **Entry:** `frontend/pages/_app.tsx` wraps all pages with `Layout` component
- **Payment Handling:** `frontend/pages/payment.tsx` (Razorpay + Stripe) and `frontend/pages/checkout.tsx` (Stripe)

### Backend (Polyglot - Choose One Per Task)
1. **Express.js/Node (Primary):**
   - **Port:** 3000
   - **Entry:** `server/index.js`
   - **Routes:** `server/routes/{contacts,payment}.js`
   - **Payment APIs:** Razorpay create-order, verify, Stripe payment-intent, webhook handlers
   - **Database:** MySQL via `mysql2` package

2. **PHP (Legacy + Payment Gateways):**
   - **Root level:** `api.php` (contact form handler)
   - **Payment dir:** `php-payments/` (Razorpay + Stripe integration)
   - **Files to know:** `razorpay_create_order.php`, `stripe_create_session.php`, webhook handlers
   - **Dependencies:** Razorpay SDK (v2.9), Stripe SDK (v12), phpdotenv (v5.5)

### Database
- **Type:** MySQL 8.0+
- **Schema:** `database-schema.sql` (primary reference)
- **ORM:** Prisma (schema at `prisma/schema.prisma`) — though not actively used in backend
- **Key Tables:** `users`, `contacts`, `orders`, `products`, `orders_items`, `refunds`, `disputes`, `webhook_logs`
- **Critical Pattern:** All payment operations store webhook logs for audit trail

## Critical Data Flows

### Contact Form Submission
```
frontend/pages/index.tsx → POST /api/contacts → server/routes/contacts.js → MySQL.contacts table
```

### Razorpay Payment Flow
```
1. frontend payment.tsx → POST /api/razorpay/create-order → server/index.js
2. Server calls Razorpay SDK → returns order_id
3. Frontend opens Razorpay modal with order_id
4. User pays in modal
5. Razorpay webhook → POST /api/razorpay/webhook → server verifies signature → logs webhook_logs, updates orders table
6. Frontend redirected to success.html or cancel.html
```

### Stripe Payment Flow (Two Variants)
- **Modern:** `payment.tsx` → create payment intent → Stripe.js handles card details → webhook confirms
- **Legacy:** `stripe_create_session.php` → Stripe Checkout Session → redirect to Stripe hosted checkout

## Developer Workflows

### Running Locally
```bash
# Terminal 1: Frontend
cd frontend
npm install  # First time only
npm run dev  # Runs on http://localhost:3001

# Terminal 2: Backend (Express)
cd server
npm install  # First time only
npm run dev  # Uses nodemon, restarts on file changes; PORT=3000

# Terminal 3: MySQL
# Start MySQL service (Windows: Services app or `net start MySQL80`)
# Import database: `mysql -u root < database-schema.sql`
```

### Environment Setup
- **Frontend:** `frontend/.env.local` (NEXT_PUBLIC_* for Firebase, Stripe public keys)
- **Backend:** `server/.env` (PORT, DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, Razorpay/Stripe secrets)
- **PHP:** `.env` at root (same gateway secrets as Node backend)
- **Reference:** See SETUP_GUIDE.md for complete variable list

### Building & Deployment
- **Frontend:** `npm run build` (Next.js static export or Vercel deployment)
- **Backend:** No build step; `npm start` runs `server/index.js` directly
- **PHP:** Requires PHP server (Apache/Nginx with PHP-FPM)

## Project-Specific Patterns & Conventions

### Payment Integration Pattern
- Both gateways implemented in parallel (Razorpay in Node/PHP, Stripe in Node/PHP)
- **Critical:** Webhook signature verification **must** happen before any database write
- **Razorpay verification:** HMAC-SHA256 of order_id|amount|secret
- **Stripe verification:** `stripe.webhooks.constructEvent()` with signature header
- Order status transitions: `pending` → `paid`/`failed` → stored in webhook_logs for audit

### Database Conventions
- **Soft deletes:** Not used; use `readStatus`/`active` boolean flags
- **Timestamps:** All tables have `createdAt`, `updatedAt` (auto-managed)
- **Foreign keys:** Explicit `userId` references with `onDelete: SetNull` strategy
- **Indexes:** Added on frequently queried columns (userId, paymentStatus, createdAt)

### API Response Format (Express)
```javascript
// Success
res.json({ success: true, data: { ... } })

// Error
res.status(500).json({ error: 'message', success: false })
```

### Frontend Component Structure
- Pages are server-side rendered; use `getServerSideProps` for data fetching
- Layout component (`Layout.tsx`) wraps all pages for header/nav/footer
- Use `NEXT_PUBLIC_*` env vars only in client-side code
- Firebase auth state managed in context or hooks (see `firebase.ts`)

## Integration Points & External Dependencies

### Firebase
- **Config:** `frontend/lib/firebase.ts` (initialized from `NEXT_PUBLIC_` env vars)
- **Usage:** Auth module only (no Firestore in current production build despite schema)
- **Sign-in methods:** Email/Password, Google OAuth

### Stripe
- **Node SDK:** `stripe` package in `server/package.json`
- **Frontend SDK:** `@stripe/stripe-js`, `@stripe/react-stripe-js`
- **Public key:** Required in `NEXT_PUBLIC_STRIPE_PUBLIC_KEY`
- **Webhook secret:** Store as `STRIPE_WEBHOOK_SECRET` in `.env`
- **Webhook endpoint URL:** Configure in Stripe dashboard (e.g., `https://yourapi.com/api/payment/webhook`)

### Razorpay
- **Node SDK:** `razorpay` package (v2.9.0)
- **PHP SDK:** Via Composer (`razorpay/razorpay`)
- **Keys:** `RAZORPAY_KEY_ID` (public), `RAZORPAY_KEY_SECRET` (private, server-only)
- **Webhook endpoint:** Configured in Razorpay dashboard

### MySQL Connection Pattern
```javascript
// Node: via mysql2 package in db.js
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});
```

## Common Pitfalls & Solutions

| Issue | Solution |
|-------|----------|
| Port 3000/3001 already in use | Use `lsof -i :3000` (Mac/Linux) or Task Manager (Windows); kill process or change PORT env var |
| Firebase config not loading | Verify `NEXT_PUBLIC_FIREBASE_API_KEY` is in `.env.local`; next dev reads at build time |
| Webhook verification fails | Check signature calculation order: `order_id\|amount\|secret` for Razorpay; use `stripe.webhooks.constructEvent()` for Stripe |
| MySQL connection refused | Confirm MySQL service running; check `DB_HOST`, `DB_USER`, `DB_PASSWORD` in `.env` |
| Stripe charge succeeds but order not created | Webhook not configured or secret mismatch; test via Stripe dashboard event resend |

## File Reference for Common Tasks

| Task | Key Files |
|------|-----------|
| Add new contact form field | `frontend/pages/index.tsx`, `server/routes/contacts.js`, `database-schema.sql` (contacts table) |
| Add new Razorpay webhook event | `server/index.js` (POST /api/razorpay/webhook) + `database-schema.sql` (webhook_logs) |
| Add new Stripe event | `server/routes/payment.js` (webhook router), Stripe dashboard configuration |
| Fix payment gateway credential | `.env` file (NODE backend), `.env` (PHP backend) — must match Stripe/Razorpay dashboards |
| Deploy to production | See `DEPLOYMENT_GUIDE.md` (Vercel for frontend, AWS for backend) |
| Test locally without gateway | Use mock responses in tests; both Razorpay & Stripe have test mode APIs |

---

**Last Updated:** December 2024  
**Architecture Version:** Multi-payment (Razorpay + Stripe), Polyglot backend (Node + PHP)
