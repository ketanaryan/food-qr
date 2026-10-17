# Hotel White Bliss — Master Architecture & Feature Ledger
**Document Version:** 1.0.0  
**Last Updated:** October 17, 2026  
**System Repository:** `ketanaryan/food-qr`  
**Purpose:** Permanent single-source-of-truth record of all implemented features, system architecture, database security, cryptographic protocols, and core engineering invariants. Any AI assistant or developer working on this codebase MUST read and respect this ledger before modifying features to prevent regressions or repetitive re-implementations.

---

## 1. System Overview & Technology Stack

Hotel White Bliss is an enterprise-grade digital dining, POS, KDS, and restaurant management platform developed specifically for high-rush hospitality operations in India.

* **Core Framework:** Next.js 16.1.3 (App Router, Turbopack, Edge Middleware, TypeScript 5)
* **Frontend UI:** React 19.2.3, Tailwind CSS 4, Radix UI primitives, Motion 12, Lucide Icons
* **Database & Storage:** Supabase PostgreSQL with Row Level Security (RLS) & Supabase Storage
* **Cryptography Engine:** W3C Web Crypto API (`globalThis.crypto.subtle`) — 100% native Edge Runtime compatible, zero `node:crypto` dependencies in edge/middleware code
* **Receipt & Invoice Generation:** jsPDF with autotable (Standard 80mm thermal receipt layout & WhatsApp digital invoicing)
* **Mobile / Handheld:** Progressive Web App (PWA) with manifest and Capacitor 8.5 Android support for waiter APKs

---

## 2. Complete Station & Feature Matrix

### Station 1: Guest QR Dining Experience
* **Routes:** `/table/[id]`, `/table/[id]/checkout`, `/table/[id]/orders`, `/menu`
* **Features:**
  1. **Cryptographic QR Tokens:** Guest table access requires a signed token (`/table/1?token=<10-char-hmac>`) derived from `TABLE_SECRET_KEY`. Prevents off-site unauthorized ordering.
  2. **Dietary Filtering:** Strict `ALL`, `VEG`, and `NON_VEG` toggle pills that dynamically hide non-veg dishes and irrelevant categories.
  3. **Fast Navigation & Search:** Sticky category pills with smooth scrolling and instant search by dish name or ingredient.
  4. **Cooking Customization:** Guest cooking instructions (e.g., "Less spicy, extra crispy") stored with cart items.
  5. **Server-Side Price Defense:** `/api/orders` matches all incoming cart items against the authoritative database `menu` table. Client-side price tampering in POST requests is blocked.
  6. **Live Order Tracking:** Real-time visual status timeline (`received` -> `preparing` -> `ready` -> `served` -> `billing` -> `completed`).
  7. **UPI Payment Gateway:** Generates an on-screen dynamic UPI payment QR and clickable deep link (`upi://pay?pa=...&pn=Hotel+White+Bliss&am=...&cu=INR`).
  8. **Google Review Prompt:** Displays dynamic review dialog upon dining completion.

### Station 2: Floor Captain Tablet
* **Route:** `/captain`
* **Features:**
  1. **Persistent Captain Selector:** Floor captains select their profile (`Rahul`, `Manoj`, `Vikram`, `Suresh`); session persists across app restarts.
  2. **Floor Section Tabs:** Filter tables by area (`All`, `Ground Floor`, `AC Family Room`, `Garden`, `Rooftop`).
  3. **Visual Table States:** Dynamic status indicators (`Free`, `Occupied`, `Billing`).
  4. **Fast KOT Punching:** Instant search, category pills, custom off-menu dish support with manual pricing, and captain cooking instructions prefixed with captain name.
  5. **Desk Coordination:** One-click "Send Bill Request to Cashier" which sets table status to `billing` and triggers cashier counter alerts.
  6. **Direct Table Settlement:** Allows floor staff to settle tables directly at table via Cash or UPI and capture customer phone number.

### Station 3: Kitchen Display System (KDS)
* **Route:** `/kitchen`
* **Features:**
  1. **Live KOT Cards:** Real-time incoming order tickets showing table number, order number, timestamp, item quantities, and special cooking notes.
  2. **Ticket Aging Timer:** Dynamic color-coded timers alerting kitchen staff to tickets pending over 15 minutes.
  3. **One-Tap Progression:** Kitchen staff click to advance items from `preparing` -> `ready` -> `served`.
  4. **Audio Notifications:** Automatic chime cues for incoming KOTs.

### Station 4: Cashier Counter Desk & POS Billing
* **Routes:** `/cashier`, `/pos`, `/bill/[ids]`
* **Features:**
  1. **Live Table Matrix:** Real-time table status grid showing free, occupied, and billing tables.
  2. **Multi-KOT Unified Invoice Consolidation (`src/lib/orderConsolidation.ts`):** Automatically merges multiple separate KOTs punched for a single table during one dining session into a unified single invoice with consolidated item counts and single GST calculation.
  3. **Statutory Tax Calculations:**
     - Food Subtotal
     - Central GST (CGST) @ 2.5%
     - State GST (SGST) @ 2.5%
     - Optional Service Charge (SC) @ 5%
     - Grand Total = Subtotal - Discount + GST (5%) + Service Charge
  4. **Multiple Tender Types:** Supports `CASH`, `UPI`, and `SPLIT` payments (custom cash portion + UPI portion).
  5. **Customer CRM Capture:** Captures guest mobile number on checkout for automatic loyalty logging.
  6. **Thermal Receipt Printing:** Generates 80mm thermal receipt with restaurant header, GSTIN, FSSAI, itemized table, tax breakdown, and printed UPI QR.
  7. **WhatsApp Digital Invoicing:** Generates link `/bill/[ids]` with pre-formatted WhatsApp share text.
  8. **End-of-Day Cash Drawer Reconciliation (Day Close / Z-Report):**
     - Shift opening float tracking (default ₹2,000).
     - Automated calculation of System Cash, System UPI, Gross Sales, Net Sales, Tax, and SC.
     - Cashier denomination counter: breakdown of ₹500, ₹200, ₹100, ₹50, ₹20, ₹10 notes, and coins.
     - Expected Cash vs Physical Cash discrepancy calculation (`BALANCED`, `OVERAGE`, `SHORTAGE`).
     - Persistent storage in database and resilient local backup.

### Station 5: Executive Management Backoffice
* **Routes:** `/admin`, `/admin/dashboard`, `/admin/sales`, `/admin/crm`, `/admin/menu`, `/admin/qr`, `/admin/reservations`, `/admin/attendo`
* **Features:**
  1. **Executive Login Guard:** Owner authentication with 15-minute brute-force lockout after 5 failed attempts.
  2. **Executive Dashboard (`/admin/dashboard`):** Real-time revenue KPIs (Gross Revenue, Net Food Sales, GST Collected, Service Charge, Total Orders, Average Order Value, Top Dish), 7-day trend chart, and consolidated order stream.
  3. **Sales & Tax Audit (`/admin/sales`):**
     - Date filters (Today, Yesterday, Current Month, Custom Range) with local timezone safety.
     - Complete itemized bill history with tax breakdown.
     - CSV Financial Export with all GST, SC, and revenue columns.
     - **Z-Reports Tab:** History of all finalized End-of-Day cash reconciliation reports with variance badges and detailed audit modal.
  4. **Customer CRM & Loyalty (`/admin/crm`):**
     - Aggregates dining profiles by guest phone number.
     - Multi-KOT deduplication: multiple KOTs in one sitting count as exactly 1 visit.
     - Guest classification badges: `New`, `Loyal`, `VIP`.
     - Direct WhatsApp re-engagement button.
  5. **Menu Control (`/admin/menu`):** Create, update, toggle availability, and set pricing for dishes across categories.
  6. **Table QR Studio (`/admin/qr`):** Visual floor section editor and batch cryptographic QR code generator with printable sticker sheet.
  7. **Reservation Desk (`/admin/reservations`):** Online reservation queue with one-click WhatsApp confirmation.
  8. **Staff Attendance & Payroll (`/admin/attendo`):** MTD days calculation, projection, and salary payroll estimates.

### Station 6: Enterprise Inventory Management & Procurement Suite
* **Routes:** `/admin/inventory`, `/api/admin/inventory`
* **Features:**
  1. **Raw Material & Ingredient Master:** Tracks categories (Dairy, Grocery, Meat/Poultry, Vegetables, Beverages, Packaging, Spices, Bakery). Live stock quantity, unit of measurement (kg, L, pcs, pkt), minimum safety stock threshold, reorder point, unit cost (₹), and preferred vendor.
  2. **Stock Inward & Goods Receiving:** Real-time inward entry recording invoice/challan number, supplier name, quantity received, purchase price, total amount, and payment status (`PAID` or `CREDIT/UDHAR`).
  3. **Vendor Khata & Accounts Payable:** Comprehensive supplier ledger tracking pending credit, total paid, and net balance. Includes partial payment settlement logging and 1-Click WhatsApp Khata Ledger Statement generation directly to vendors.
  4. **Kitchen Wastage & Spoilage Logging:** Tracks wasted/spoiled ingredients with categorization (`SPOILED`, `EXPIRED`, `BURNT_PREP`, `SPILLAGE`), financial loss valuation (₹), and chef/staff accountability notes.
  5. **Recipe Bill of Materials (BOM) & Real-Time Auto-Depletion Engine:** Links menu items (e.g., Paneer Tikka Masala, Jeera Rice, Cold Coffee) to multiple raw ingredients. Upon dining order placement via guest QR or captain/POS, `/api/orders` automatically triggers `depleteStockForOrderItems()`, reducing stock levels in real time and creating `CONSUMPTION` logs.
  6. **Daily Stock Closing & Theft/Leakage Reconciliation Audit:** Compares Expected Stock (`Opening + Inward - Order Consumed - Wastage`) against Physical Count. Calculates quantity variance, financial variance loss (₹), and automatically flags discrepancies with severity (`MATCH`, `LOW_DISCREPANCY`, `HIGH_VARIANCE_THEFT_ALERT`).
  7. **1-Click WhatsApp Purchase Order Generator:** Aggregates low-stock items into a structured WhatsApp procurement message with quantities, estimated cost, and direct `https://wa.me/?text=...` link for suppliers.
  8. **Multi-Workstation Live Sync:** Backed by `/api/admin/inventory` with PostgreSQL schema (`supabase/inventory_schema.sql`) and resilient local persistence (`data/inventory-store.json`), featuring live sync status indicator badge in the admin navigation.

---

## 3. Cryptography & Authentication Architecture

### Edge-Native Web Crypto (`src/lib/ownerAuth.ts`, `src/lib/staffAuth.ts`)
* **Zero Node.js Crypto Dependency:** All hashing and token creation is performed via `globalThis.crypto.subtle`. Works identically across Vercel Edge Runtime, Turbopack, Node.js server, and Android WebViews.
* **Session Tokens:**
  - **Owner Token:** `wbo_<64-char-hex>` created via HMAC-SHA256(`wb_owner_v3:${email}`, `TABLE_SECRET_KEY`).
  - **Staff Token:** `wb_staff_<64-char-hex>` created via HMAC-SHA256(`wb_staff_v3:${user}:${pwd}`, `TABLE_SECRET_KEY`).
* **Password Storage:** Salted PBKDF2-SHA256 with 100,000 iterations (`${salt}:${hash}`).
* **Timing-Attack Resistance:** `timingSafeEqualStr` enforces constant-time XOR comparison for all tokens and secret values.
* **HttpOnly Session Cookies:**
  - `owner_session`: 30-day (Remember Me) or 12-hour session.
  - `staff_session`: 365-day persistent session for staff Android APKs and tablets.
* **Next.js Middleware (`src/middleware.ts`):** Intercepts `/admin/*`, `/cashier`, `/pos`, `/captain`, `/kitchen`, and `/api/admin/*`, routing unauthorized requests to respective login screens.

---

## 4. Database & Row Level Security (RLS) Matrix

The PostgreSQL database on Supabase operates under defense-in-depth Row Level Security configured in [`supabase/lockdown_rls.sql`](file:///c:/Users/KETAN/Documents/antigravity/dazzling-shannon/qr-menu/supabase/lockdown_rls.sql):

| Table | Operation | Role Permitted | Policy Name | Details |
| :--- | :--- | :--- | :--- | :--- |
| `hotel_settings` | SELECT / ALL | `service_role` only | `Deny public access on hotel_settings` | Prevents anon clients from dumping owner auth or day-close reports |
| `orders` | SELECT | `anon`, `authenticated` | `Allow public read orders` | Allows KDS, POS, Cashier, and Table live status to view orders |
| `orders` | INSERT | `anon`, `authenticated` | `Allow public insert orders` | Allows guest QR dining orders and staff KOT creation |
| `orders` | UPDATE | `service_role` only | `Deny direct anon updates on orders` | Prevents guest clients from marking orders paid or tampering status |
| `orders` | DELETE | `service_role` only | `Deny direct anon deletes on orders` | Blocks deletion of order records |
| `menu` | SELECT | `anon`, `authenticated` | `Allow public read menu` | Public browsing of menu items and prices |
| `menu` | INSERT / UPDATE / DELETE | `service_role` only | `Deny anon mutations on menu` | Menu changes strictly restricted to authenticated admin routes |
| `inventory_items` | ALL | `service_role` only | `Service role full access on inventory_items` | Manages raw ingredients master and stock quantities |
| `inventory_purchases` | ALL | `service_role` only | `Service role full access on inventory_purchases` | Inward stock purchases and invoices |
| `inventory_vendors` | ALL | `service_role` only | `Service role full access on inventory_vendors` | Vendor khata and accounts payable |
| `inventory_logs` | ALL | `service_role` only | `Service role full access on inventory_logs` | Audit trail of inward, consumption, and wastage |
| `inventory_recipes` | ALL | `service_role` only | `Service role full access on inventory_recipes` | Recipe Bill of Materials linking menu items to ingredients |
| `inventory_reconciliations` | ALL | `service_role` only | `Service role full access on inventory_reconciliations` | Daily stock closing audits and physical variance records |

---

## 5. API Endpoints Catalog

| Endpoint | Method | Required Auth | Purpose |
| :--- | :--- | :--- | :--- |
| `/api/auth/staff-login` | POST | None (PIN/Password) | Authenticates staff (`1234` or admin credentials) and issues `staff_session` |
| `/api/auth/owner-login` | POST | None (Owner Email/Password) | Authenticates owner and issues dual `owner_session` + `staff_session` |
| `/api/auth/owner-status` | GET | Session Cookie | Returns `{ authenticated, isOwner, isStaff }` |
| `/api/auth/change-credentials` | POST | Owner Cookie | Updates owner email and password with PBKDF2 salted hash |
| `/api/auth/owner-logout` | POST | Session Cookie | Clears owner and staff cookies |
| `/api/orders` | POST | Table Token OR Staff | Places dining order with server-side price verification and IP rate limiting |
| `/api/orders/update` | POST | Staff OR Guest Token | Advances order status, requests table bill, or settles bill (CASH/UPI/SPLIT) |
| `/api/reserve` | POST | None (IP rate limited) | Creates guest reservation with phone & IP rate limiting (max 5/hr per IP) |
| `/api/admin/day-close` | GET | Staff OR Owner | Fetches live sales and cash reconciliation statistics for specified date |
| `/api/admin/day-close` | POST | Staff OR Owner | Saves End-of-Day Z-Report with cash denominations and variance |
| `/api/admin/inventory` | GET / POST | Staff OR Owner | Comprehensive inventory management (inward, wastage, vendor khata, reconciliation, recipe BOM, stock depletion) |
| `/api/admin/menu` | POST | Staff OR Owner | Strict schema-whitelisted menu mutations (`insert`, `update`, `delete`) |
| `/api/admin/tables` | GET / POST | Staff OR Owner | Manages floor sections and generates table cryptographic tokens |
| `/api/admin/captains` | GET / POST | Staff OR Owner | Manages floor captain roster |
| `/api/admin/upload-bill` | POST | Staff OR Owner | Sanitized PDF upload for bill storage |
| `/api/bill/[filename]` | GET | Public | Secure redirect to Supabase storage PDF bills |

---

## 6. Required Environment Variables

All variables documented in [`.env.example`](file:///c:/Users/KETAN/Documents/antigravity/dazzling-shannon/qr-menu/.env.example):

* `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL (Public)
* `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anon key (Public)
* `SUPABASE_SERVICE_ROLE_KEY`: Supabase secret service role key (Server-only, bypasses RLS)
* `TABLE_SECRET_KEY`: 256-bit cryptographic HMAC secret (Server-only)
* `OWNER_EMAIL`: Default `owner@hotelwhitebliss.com`
* `OWNER_PASSWORD`: Default `WhiteBliss@2026`
* `ADMIN_USERNAME`: Default `admin`
* `ADMIN_PASSWORD`: Default `aryan123`

---

## 7. Critical Invariants (DO NOT BREAK)

1. **Async Auth Calls:** `isStaffAuthorized(req)` and `isOwnerAuthorized(req)` are asynchronous and return `Promise<boolean>`. **Always `await` them**. Calling them without `await` evaluates to a truthy Promise object.
2. **Zero `node:crypto` in Edge:** Do not import `crypto` from `node:crypto` or `crypto` in files imported by `src/middleware.ts` or edge routes. Use `globalThis.crypto.subtle`.
3. **No Direct `dangerouslySetInnerHTML`:** Keep React native JSX escaping to prevent Stored or Reflected XSS.
4. **Server-Side Price Validation:** Do not trust price sent in request body from `/api/orders`. Always recalculate total against database `menu` table.
5. **Multi-KOT Consolidation:** Do not count KOTs as separate visits in CRM. Always use `consolidateOrders` from `src/lib/orderConsolidation.ts`.
6. **Local Persistence Fallback:** Tables, captains, orders, and day-close reports use hybrid storage via `src/lib/ordersStore.ts` (try Supabase first; if table, network, or service key is absent, fallback gracefully to resilient local cache). Never remove the fallback logic.
7. **Recipe BOM & Order Stock Depletion:** All order insertions in `/api/orders` trigger `depleteStockForOrderItems()`. If raw ingredients reach zero or are depleted, order creation must still succeed (non-blocking fallback) while raising kitchen depletion alerts.

---

## 8. Git Commit Log

* `bc65c65`: `feat(inventory): add Bakery category, interactive physical count audit, cost loss & fuzzy BOM matching`
* `08020bb`: `docs(ledger): record Station 6 Enterprise Inventory Management suite, BOM depletion & vendor khata`
* `ef933f4`: `feat(inventory): enterprise inventory management suite, live recipe order depletion & vendor procurement`
* `76044f1`: `feat(billing): End-of-Day Cash Drawer Reconciliation (Z-Report / Day Close)`
* `24b62cf`: `feat(orders): Multi-KOT bill consolidation and guest dining UX enhancements`
* `b984555`: `security(db): PostgreSQL Row-Level Security lockdown policies and Vercel env template`
* `c0616e6`: `security(auth): Edge-native Web Crypto API, HMAC-SHA256 sessions, PBKDF2 hashing & rate limiting`
* `a13818c`: `docs: add Master Architecture & Feature Ledger (PROJECT_LEDGER.md)`
* `78de373`: `feat(orders): resilient hybrid order persistence and multi-party rush concurrency support`
