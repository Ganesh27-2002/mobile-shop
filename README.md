# Mobile Shop — Full-Stack E-Commerce Platform

A production-grade, full-stack smartphone e-commerce web application featuring role-based access control, dynamic catalog browsing, multi-step checkout with simulated payments, order lifecycle tracking, customer address book, administrative management portal, and a 317-test automated Playwright suite with GitHub Actions CI/CD.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Project Structure](#project-structure)
3. [Environment Setup & Installation](#environment-setup--installation)
4. [Pre-Seeded Demo Credentials](#pre-seeded-demo-credentials)
5. [Complete API Endpoints Reference](#complete-api-endpoints-reference)
   - [Public Endpoints](#public-endpoints)
   - [Customer Protected Endpoints](#customer-protected-endpoints)
   - [Admin Protected Endpoints](#admin-protected-endpoints)
6. [Frontend Route Directory](#frontend-route-directory)
   - [Customer Storefront](#customer-storefront)
   - [Admin Portal](#admin-portal)
7. [Order Lifecycle & Status Transitions](#order-lifecycle--status-transitions)
8. [Automated Testing Suite (317 Tests)](#automated-testing-suite-317-tests)
9. [GitHub Actions CI/CD Pipeline](#github-actions-cicd-pipeline)

---

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite 8, React Router 7, Vanilla CSS design tokens (responsive glassmorphism dark-mode UI).
- **Backend**: Node.js 20+, Express 4, TypeScript, Sequelize ORM 6, PostgreSQL 16, Winston Logger, Zod validation, bcryptjs, JSON Web Tokens (JWT).
- **Testing**: Playwright Test 1.50+ (317 E2E UI and REST API integration tests).
- **CI/CD**: GitHub Actions with automated containerized PostgreSQL 16 services.

---

## Project Structure

```
mobile-shop/
├── .github/
│   └── workflows/
│       └── ci.yml                         # Automated GitHub Actions CI pipeline
├── backend/
│   ├── config/
│   │   └── config.js                      # Sequelize CLI database configuration
│   ├── migrations/                        # 10 Database Migrations
│   │   ├── 20260912000001-create-users.js
│   │   ├── 20260912000002-create-categories.js
│   │   ├── 20260912000003-create-products.js
│   │   ├── 20260912000004-create-carts.js
│   │   ├── 20260912000005-create-cart-items.js
│   │   ├── 20260912000006-create-addresses.js
│   │   ├── 20260912000007-create-orders.js
│   │   ├── 20260912000008-create-order-items.js
│   │   ├── 20260912000009-create-payments.js
│   │   └── 20260913000001-add-order-lifecycle-fields.js
│   ├── seeders/                           # Base Database Seeders
│   │   ├── 20260912000001-seed-users.js
│   │   ├── 20260912000002-seed-categories.js
│   │   └── 20260912000003-seed-products.js
│   ├── src/
│   │   ├── config/
│   │   │   ├── constants.ts               # Order status rules & image allowlist
│   │   │   └── database.ts                # Sequelize connection & authentication
│   │   ├── controllers/                   # Express route controllers
│   │   │   ├── addressController.ts
│   │   │   ├── adminCategoryController.ts
│   │   │   ├── adminController.ts
│   │   │   ├── adminCustomerController.ts
│   │   │   ├── adminDashboardController.ts
│   │   │   ├── adminInventoryController.ts
│   │   │   ├── adminOrderController.ts
│   │   │   ├── adminProductController.ts
│   │   │   ├── authController.ts
│   │   │   ├── cartController.ts
│   │   │   ├── categoryController.ts
│   │   │   ├── checkoutController.ts
│   │   │   ├── orderController.ts
│   │   │   └── productController.ts
│   │   ├── middleware/                    # Auth, Admin RBAC, Error & Winston loggers
│   │   │   ├── adminMiddleware.ts
│   │   │   ├── authMiddleware.ts
│   │   │   └── errorMiddleware.ts
│   │   ├── models/                        # Sequelize TypeScript Data Models
│   │   │   ├── Address.ts
│   │   │   ├── Cart.ts
│   │   │   ├── CartItem.ts
│   │   │   ├── Category.ts
│   │   │   ├── Order.ts
│   │   │   ├── OrderItem.ts
│   │   │   ├── Payment.ts
│   │   │   ├── Product.ts
│   │   │   ├── User.ts
│   │   │   └── index.ts                   # Model associations & foreign keys
│   │   ├── routes/                        # Express API route modules
│   │   │   ├── addressRoutes.ts
│   │   │   ├── adminRoutes.ts             # Consolidated Admin RBAC routes
│   │   │   ├── authRoutes.ts
│   │   │   ├── cartRoutes.ts
│   │   │   ├── categoryRoutes.ts
│   │   │   ├── checkoutRoutes.ts
│   │   │   ├── orderRoutes.ts
│   │   │   └── productRoutes.ts
│   │   ├── services/                      # Business logic layer
│   │   ├── types/                         # TypeScript interfaces and contracts
│   │   ├── utils/
│   │   │   ├── jwt.ts
│   │   │   ├── logger.ts                  # Centralized Winston logger
│   │   │   └── pricing.ts
│   │   ├── validators/                    # Zod input schemas
│   │   └── server.ts                      # Express application entry point
│   ├── .env.example
│   ├── .sequelizerc
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── public/
│   │   └── images/
│   │       └── products/                  # 16 High-quality smartphone images
│   ├── src/
│   │   ├── components/
│   │   │   ├── AdminLayout.tsx            # Full-bleed admin portal navigation shell
│   │   │   ├── AdminRoute.tsx             # Role-based route guard for admins
│   │   │   ├── CartItem.tsx
│   │   │   ├── Navbar.tsx                 # Storefront responsive navbar
│   │   │   ├── ProductCard.tsx
│   │   │   └── ProtectedRoute.tsx         # Customer auth route guard
│   │   ├── context/
│   │   │   ├── AuthContext.tsx            # Global JWT session state
│   │   │   └── CartContext.tsx            # Cart counter and items state
│   │   ├── pages/
│   │   │   ├── admin/                     # Admin Portal Pages
│   │   │   │   ├── AdminCategoriesPage.tsx
│   │   │   │   ├── AdminCustomersPage.tsx
│   │   │   │   ├── AdminDashboardPage.tsx
│   │   │   │   ├── AdminInventoryPage.tsx
│   │   │   │   ├── AdminOrderDetailPage.tsx
│   │   │   │   ├── AdminOrdersPage.tsx
│   │   │   │   └── AdminProductsPage.tsx
│   │   │   ├── AddressesPage.tsx
│   │   │   ├── CartPage.tsx
│   │   │   ├── CheckoutPage.tsx
│   │   │   ├── HomePage.tsx               # Flagship customer storefront homepage
│   │   │   ├── LoginPage.tsx
│   │   │   ├── OrderConfirmationPage.tsx
│   │   │   ├── OrdersPage.tsx
│   │   │   ├── OrderTrackingPage.tsx      # Milestone timeline tracking & cancellation
│   │   │   ├── ProductDetailsPage.tsx
│   │   │   ├── ProductsPage.tsx
│   │   │   ├── ProfilePage.tsx
│   │   │   └── SignupPage.tsx
│   │   ├── services/                      # Axios frontend API services
│   │   ├── App.css                        # Complete design system tokens & UI styles
│   │   ├── App.tsx                        # Master route configuration & layout bifurcator
│   │   ├── main.tsx
│   │   └── index.css
│   ├── .env.example
│   ├── package.json
│   └── vite.config.ts
│
├── tests/                                 # 33 Playwright Test Files (317 Tests)
│   ├── addresses/
│   ├── admin/                             # 9 Admin UI & security test suites
│   ├── api/                               # 13 REST API integration test suites
│   ├── auth/                              # 4 Authentication test suites
│   ├── cart/
│   ├── checkout/
│   ├── orders/                            # Tracking and cancellation tests
│   ├── products/
│   └── smoke.spec.ts                      # Frontend & API smoke tests
│
├── .gitignore
├── package.json                           # Root Playwright test execution scripts
└── playwright.config.ts                   # Playwright configuration with webServer
```

---

## Environment Setup & Installation

### 1. Prerequisites

Ensure the following tools are installed on your machine:
- **Node.js**: `v20.x` or `v22.x` (LTS recommended)
- **PostgreSQL**: `v16.x`
- **Git**: `v2.x+`
- **npm**: `v10.x+`

---

### 2. Clone the Repository

```bash
git clone https://github.com/your-username/mobile-shop.git
cd mobile-shop
```

---

### 3. Install Dependencies

Install dependencies across the root, backend, and frontend workspaces:

```bash
# 1. Install root Playwright dependencies
npm install

# 2. Install backend dependencies
cd backend
npm install

# 3. Install frontend dependencies
cd ../frontend
npm install
cd ..
```

---

### 4. Configure Backend Environment (`backend/.env`)

Create a `.env` file in the `backend/` directory:

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` with your PostgreSQL credentials:

```ini
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# PostgreSQL Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mobile_shop
DB_USER=postgres
DB_PASSWORD=your_postgres_password

# JWT Authentication
JWT_SECRET=your_super_secret_jwt_key_here_3.0
JWT_EXPIRES_IN=1d
```

---

### 5. Configure Frontend Environment (`frontend/.env`)

Create a `.env` file in the `frontend/` directory:

```bash
cp frontend/.env.example frontend/.env
```

Ensure `VITE_API_URL` points to the backend API:

```ini
VITE_API_URL=http://localhost:5000/api
```

---

### 6. Initialize PostgreSQL Database & Run Migrations

1. Ensure PostgreSQL service is running on your machine.
2. Create the target database (e.g., using `psql`):
   ```sql
   CREATE DATABASE mobile_shop;
   ```
3. Run Sequelize database migrations:
   ```bash
   cd backend
   npm run db:migrate
   ```
4. Seed base data (admin user, customer users, 5 brand categories, and 16 initial smartphones):
   ```bash
   npm run db:seed
   cd ..
   ```

---

### 7. Run the Application Locally

#### Option A: Running with Dev Servers
Open two separate terminal windows:

**Terminal 1 (Backend API Server)**:
```bash
cd backend
npm run dev
# Server runs on http://localhost:5000
# API Health: http://localhost:5000/api/health
```

**Terminal 2 (Frontend Client)**:
```bash
cd frontend
npm run dev
# Frontend runs on http://localhost:5173
```

#### Option B: Automatic Management via Playwright
When running automated tests via Playwright (`npm test`), Playwright's built-in `webServer` automatically launches both the frontend and backend servers, waits for `/api/health` and port 5173 to become available, executes the test suite, and cleanly tears them down.

---

## Pre-Seeded Demo Credentials

The database seeder (`npm run db:seed`) provides pre-configured credentials:

| Role | Email | Password | Permissions |
|---|---|---|---|
| **Admin** | `admin@mobileshop.com` | `Admin@123` | Full access to `/admin` portal, customer management, inventory controls, order transitions, and product CRUD. |
| **Customer 1** | `john.doe@example.com` | `Customer@123` | Storefront customer account with cart, order history, and saved address book. |
| **Customer 2** | `jane.smith@example.com` | `Customer@123` | Secondary customer account for multi-user isolation testing. |

---

## Complete API Endpoints Reference

All endpoints are prefixed with `/api`.

### Public Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | System & PostgreSQL database connection status. |
| `POST` | `/auth/signup` | Register a new customer user account. |
| `POST` | `/auth/login` | Authenticate user and receive JWT Bearer token. |
| `GET` | `/products` | Paginated product list with search (`?search=`), category filter (`?category=`), sort (`?sort=`), and page limit (`?page=&limit=`). |
| `GET` | `/products/:id` | Retrieve product details by UUID or slug. |
| `GET` | `/categories` | Retrieve all active product categories. |

---

### Customer Protected Endpoints

*Requires header: `Authorization: Bearer <token>` (enforced by `authMiddleware`)*

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/auth/me` | Retrieve profile of the authenticated user. |
| `GET` | `/cart` | Retrieve the authenticated user's cart and items. |
| `POST` | `/cart` | Add an item to the cart with inventory stock validation. |
| `PUT` | `/cart/items/:id` | Update quantity of an item in the cart. |
| `DELETE` | `/cart/items/:id` | Remove an item from the cart. |
| `GET` | `/addresses` | List all saved delivery addresses for the user. |
| `POST` | `/addresses` | Create a new delivery address (auto-default if first). |
| `GET` | `/addresses/:id` | Retrieve a single delivery address by ID. |
| `PUT` | `/addresses/:id` | Update an existing delivery address. |
| `PATCH` | `/addresses/:id/default` | Set an address as the default delivery address. |
| `DELETE` | `/addresses/:id` | Delete an address (auto-reassigns default if deleted). |
| `GET` | `/checkout/summary` | Calculate total order amounts, items, and delivery snapshot. |
| `POST` | `/orders` | Place order (supports `COD` & `CARD` with atomic stock decrement). |
| `GET` | `/orders` | List order history for the authenticated user. |
| `GET` | `/orders/:id` | Retrieve detailed order receipt with immutable snapshots. |
| `GET` | `/orders/:id/tracking` | Get real-time milestone stepper status and cancellation eligibility. |
| `POST` | `/orders/:id/cancel` | Cancel an eligible order (`PLACED`, `PENDING`, `CONFIRMED`, `PROCESSING`) with atomic inventory restoration. |

---

### Admin Protected Endpoints

*Requires header: `Authorization: Bearer <token>` with `role: "ADMIN"` (enforced by `authMiddleware` + `adminMiddleware`)*

#### Admin Dashboard
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/admin/test` | Test endpoint validating admin role authorization. |
| `GET` | `/admin/dashboard` | KPI analytics (total revenue, total orders, customers, low stock count). |

#### Admin Products Management
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/admin/products` | Paginated product list with search, brand filtering, and status filters. |
| `POST` | `/admin/products` | Create a new smartphone record with image assignment. |
| `GET` | `/admin/products/:id` | Retrieve single product details with category. |
| `PUT` | `/admin/products/:id` | Update product details, price, discount, or category. |
| `PATCH` | `/admin/products/:id/status` | Toggle product active/inactive visibility status. |
| `PATCH` | `/admin/products/:id/stock` | Quick-adjust inventory stock level for a product. |
| `DELETE` | `/admin/products/:id` | Delete product (rejected with 400 if historic orders exist). |
| `GET` | `/admin/products/images` | Allowed local image asset paths for product cards. |

#### Admin Inventory
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/admin/inventory` | Inventory tracking table highlighting stock counts and low-stock alerts. |

#### Admin Categories Management
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/admin/categories` | List all product brand categories with product counts. |
| `POST` | `/admin/categories` | Create a new brand category. |
| `GET` | `/admin/categories/:id` | Retrieve single category details. |
| `PUT` | `/admin/categories/:id` | Update category name, description, or slug. |
| `DELETE` | `/admin/categories/:id` | Delete category (rejected if products are assigned to it). |

#### Admin Orders Management
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/admin/orders` | Filtered list of all customer orders with status filter and search. |
| `GET` | `/admin/orders/:id` | Complete order detail view with timeline milestones and customer snapshot. |
| `PATCH` | `/admin/orders/:id/status` | Advance order status along validated state machine transitions. |

#### Admin Customers Management
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/admin/customers` | List all customer accounts, registration dates, and total orders placed. |
| `GET` | `/admin/customers/:id` | Retrieve customer profile and comprehensive order history. |

---

## Frontend Route Directory

The application features a decoupled architecture separating the customer storefront from the administrative operations portal.

### Customer Storefront

| Route | Protection | Page Description |
|---|---|---|
| `/` | Public | Modern flagship hero banner, brand explorer, curated smartphone collections, flash deal spotlight, and buyer testimonials. |
| `/products` | Public | Smartphone catalog with instant text search, brand filter pills, sorting allowlist, and pagination. |
| `/products/:id` | Public | Product details page with image preview, stock status badge, specs, and Add to Cart button. |
| `/cart` | Dynamic | Shopping cart table with quantity increment/decrement, price totals, and checkout CTA. |
| `/login` | Public | User authentication page with email and password validation. |
| `/signup` | Public | Customer account registration page. |
| `/addresses` | Protected | Delivery address book (Add, Edit, Delete, and Set Default). |
| `/checkout` | Protected | 3-step checkout with address selection, simulated COD/Card payment, and order summary. |
| `/order-confirmation/:orderId` | Protected | Order receipt with payment status, delivery address snapshot, and purchased items. |
| `/orders` | Protected | Customer order history list with status badges and receipt links. |
| `/orders/:id/tracking` | Protected | Order tracking page with milestone timeline stepper and safe cancellation button. |
| `/profile` | Protected | Customer profile dashboard with quick links and direct admin switch button (for admins). |

---

### Admin Portal

*All `/admin/*` routes are protected by `<AdminRoute>` and rendered within the dedicated full-bleed `<AdminLayout />` without storefront navigation.*

| Route | Protection | Page Description |
|---|---|---|
| `/admin` | Admin | Executive dashboard with metrics, revenue counters, order statistics, and recent activity. |
| `/admin/products` | Admin | Product management table with search, filter, stock adjustment modal, and "+ Add New Smartphone" form. |
| `/admin/categories` | Admin | Brand category manager with inline editing, deletion checks, and item counts. |
| `/admin/inventory` | Admin | Dedicated inventory status table with low-stock warning indicators and quick replenishment. |
| `/admin/orders` | Admin | Master orders overview table with status filtering and customer search. |
| `/admin/orders/:id` | Admin | Order inspection detail view with status transition controls (`CONFIRMED`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED`). |
| `/admin/customers` | Admin | Customer directory with user account metadata, phone numbers, and past purchase counts. |

---

## Order Lifecycle & Status Transitions

Orders adhere to a deterministic state machine enforcing valid status progressions:

```
                  ┌─────────────┐
                  │   PLACED    │
                  └──────┬──────┘
                         │
                         ▼
                  ┌─────────────┐
                  │  CONFIRMED  │
                  └──────┬──────┘
                         │
                         ▼
                  ┌─────────────┐
                  │ PROCESSING  │
                  └──────┬──────┘
                         │
                         ▼
                  ┌─────────────┐
                  │   SHIPPED   │
                  └──────┬──────┘
                         │
                         ▼
                  ┌─────────────┐
                  │  DELIVERED  │  (Terminal)
                  └─────────────┘

       * Cancellation allowed from PLACED, CONFIRMED, or PROCESSING:
       [PLACED / CONFIRMED / PROCESSING] ──► [CANCELLED] (Terminal + Auto Stock Restored)
```

- **Stock Decrement**: Executed atomically via Sequelize transaction during checkout (`POST /api/orders`).
- **Stock Restoration**: If an order is cancelled via customer request or admin action (`POST /api/orders/:id/cancel` or `PATCH /api/admin/orders/:id/status`), quantities are refunded back to the `products.stock` table inside an atomic database transaction.

---

## Automated Testing Suite (317 Tests)

The application includes an automated test suite implemented with Playwright, covering both REST API integration and End-to-End browser UI workflows across 33 test files.

### Test Directory Summary

| Category | Files | Tests | Coverage Scope |
|---|---|---|---|
| **Smoke** | `tests/smoke.spec.ts` | 3 | Frontend heading, navigation landmarks, and `/api/health` endpoint. |
| **API Suites** | `tests/api/*.spec.ts` (13 files) | 165 | REST APIs: Auth, Products, Categories, Cart, Addresses, Checkout, Orders, Tracking, Cancellation, Admin RBAC, Admin Products, Admin Orders, Admin Inventory, Admin Dashboard, Admin Customers. |
| **Auth UI** | `tests/auth/*.spec.ts` (4 files) | 18 | Sign in, Sign up, Sign out, Protected route redirects, and token expiration. |
| **Storefront UI**| `tests/products/`, `tests/cart/`, `tests/addresses/`, `tests/checkout/` | 54 | Smartphone catalog search/filter/sort, cart persistence, address management, and checkout. |
| **Orders UI** | `tests/orders/*.spec.ts` (2 files) | 9 | Timeline stepper rendering, milestone completion, and cancellation dialogs. |
| **Admin UI** | `tests/admin/*.spec.ts` (9 files) | 68 | Admin security RBAC, Admin Categories, Admin Products CRUD, Quick Stock modals, Inventory tables, Admin Orders status advancement, and Admin Customers list. |
| **Total** | **33 test files** | **317 tests** | **100% Automated Coverage** |

### Running Tests Locally

```bash
# Run the complete test suite (all 317 tests in serial)
npm test

# Run tests in headed browser mode (watch browser execution)
npm run test:headed

# Run a specific test suite
npx playwright test tests/admin/admin-security.spec.ts
npx playwright test tests/api/products.spec.ts
npx playwright test tests/orders/order-tracking.spec.ts

# View interactive HTML test report
npm run test:report
```

---

## GitHub Actions CI/CD Pipeline

The repository includes a GitHub Actions workflow in [`.github/workflows/ci.yml`](file:///c:/Users/Ganesh/Desktop/mobile-shop/.github/workflows/ci.yml) that executes on every push and pull request targeting `main` and `develop`.

### Pipeline Stages:
1. **Containerized PostgreSQL 16 Service**: Spins up a fresh, isolated PostgreSQL database container (`mobile_shop_test`) with health checking (`pg_isready`).
2. **Dependency Installation**: Runs `npm ci` across root, `./backend`, and `./frontend`.
3. **Database Migrations & Seeders**: Executes `npm run db:migrate` followed by `npm run db:seed`.
4. **TypeScript & Bundle Verification**: Runs `npm run build` in `./backend` (`tsc`) and `./frontend` (`tsc -b && vite build`).
5. **Playwright Browser Provisioning**: Installs browser binaries (`npx playwright install --with-deps && npx playwright install chrome`).
6. **Pre-flight Health Verification**: Runs `tests/smoke.spec.ts` to confirm server startup and health check response.
7. **Full Test Suite Execution**: Executes all 317 tests via `npm test`.
8. **Artifact Upload**: Uploads `playwright-report/` and `test-results/` artifacts retained for 30 days.

---

## License

This project is licensed under the MIT License.
