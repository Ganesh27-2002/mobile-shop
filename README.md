# Mobile Shop

Full-stack e-commerce mobile shop platform built with Node.js, Express, React, Vite, Sequelize ORM, PostgreSQL, and JWT Authentication.

---

## Project Structure

```
mobile-shop/
├── backend/
│   ├── config/
│   │   └── config.js
│   ├── migrations/
│   │   ├── 20260912000001-create-users.js
│   │   ├── 20260912000002-create-categories.js
│   │   ├── 20260912000003-create-products.js
│   │   ├── 20260912000004-create-carts.js
│   │   ├── 20260912000005-create-cart-items.js
│   │   ├── 20260912000006-create-addresses.js
│   │   ├── 20260912000007-create-orders.js
│   │   ├── 20260912000008-create-order-items.js
│   │   └── 20260912000009-create-payments.js
│   ├── seeders/
│   │   ├── 20260912000001-seed-users.js
│   │   ├── 20260912000002-seed-categories.js
│   │   └── 20260912000003-seed-products.js
│   ├── src/
│   │   ├── config/
│   │   │   └── database.ts
│   │   ├── controllers/
│   │   │   ├── addressController.ts
│   │   │   ├── adminController.ts
│   │   │   ├── authController.ts
│   │   │   ├── cartController.ts
│   │   │   ├── categoryController.ts
│   │   │   ├── checkoutController.ts
│   │   │   ├── orderController.ts
│   │   │   └── productController.ts
│   │   ├── middleware/
│   │   │   ├── adminMiddleware.ts
│   │   │   ├── authMiddleware.ts
│   │   │   └── errorMiddleware.ts
│   │   ├── models/
│   │   │   ├── Address.ts
│   │   │   ├── Cart.ts
│   │   │   ├── CartItem.ts
│   │   │   ├── Category.ts
│   │   │   ├── index.ts
│   │   │   ├── Order.ts
│   │   │   ├── OrderItem.ts
│   │   │   ├── Payment.ts
│   │   │   ├── Product.ts
│   │   │   └── User.ts
│   │   ├── routes/
│   │   │   ├── addressRoutes.ts
│   │   │   ├── adminRoutes.ts
│   │   │   ├── authRoutes.ts
│   │   │   ├── cartRoutes.ts
│   │   │   ├── categoryRoutes.ts
│   │   │   ├── checkoutRoutes.ts
│   │   │   ├── orderRoutes.ts
│   │   │   └── productRoutes.ts
│   │   ├── services/
│   │   │   ├── addressService.ts
│   │   │   ├── authService.ts
│   │   │   ├── cartService.ts
│   │   │   ├── categoryService.ts
│   │   │   ├── checkoutService.ts
│   │   │   ├── orderService.ts
│   │   │   ├── paymentService.ts
│   │   │   └── productService.ts
│   │   ├── types/
│   │   │   ├── address.ts
│   │   │   ├── auth.ts
│   │   │   ├── checkout.ts
│   │   │   └── order.ts
│   │   ├── utils/
│   │   │   ├── jwt.ts
│   │   │   └── pricing.ts
│   │   ├── validators/
│   │   │   ├── addressValidator.ts
│   │   │   ├── authValidator.ts
│   │   │   └── orderValidator.ts
│   │   └── server.ts
│   ├── .env
│   ├── .env.example
│   ├── .sequelizerc
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── public/
│   │   └── images/
│   │       └── products/ (16 local smartphone images)
│   ├── src/
│   │   ├── components/
│   │   │   ├── CartItem.tsx
│   │   │   ├── Navbar.tsx
│   │   │   ├── PlaceholderPage.tsx
│   │   │   ├── ProductCard.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   ├── context/
│   │   │   ├── AuthContext.tsx
│   │   │   └── CartContext.tsx
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   └── useCart.ts
│   │   ├── pages/
│   │   │   ├── AddressesPage.tsx
│   │   │   ├── CartPage.tsx
│   │   │   ├── CheckoutPage.tsx
│   │   │   ├── HomePage.tsx
│   │   │   ├── LoginPage.tsx
│   │   │   ├── OrderConfirmationPage.tsx
│   │   │   ├── OrdersPage.tsx
│   │   │   ├── ProductDetailsPage.tsx
│   │   │   ├── ProductsPage.tsx
│   │   │   ├── ProfilePage.tsx
│   │   │   └── SignupPage.tsx
│   │   ├── services/
│   │   │   ├── addressService.ts
│   │   │   ├── api.ts
│   │   │   ├── authService.ts
│   │   │   ├── cartService.ts
│   │   │   ├── checkoutService.ts
│   │   │   ├── orderService.ts
│   │   │   └── productService.ts
│   │   ├── types/
│   │   │   ├── address.ts
│   │   │   ├── auth.ts
│   │   │   ├── cart.ts
│   │   │   ├── checkout.ts
│   │   │   ├── order.ts
│   │   │   └── product.ts
│   │   ├── utils/
│   │   │   ├── formatters.ts
│   │   │   └── token.ts
│   │   ├── App.css
│   │   ├── App.tsx
│   │   ├── index.css
│   │   └── main.tsx
│   ├── .env
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
├── tests/
│   ├── addresses/
│   │   └── addresses.spec.ts
│   ├── api/
│   │   ├── addresses.spec.ts
│   │   ├── auth.spec.ts
│   │   ├── cart.spec.ts
│   │   ├── checkout.spec.ts
│   │   ├── orders.spec.ts
│   │   └── products.spec.ts
│   ├── auth/
│   │   ├── login.spec.ts
│   │   ├── logout.spec.ts
│   │   ├── protected-routes.spec.ts
│   │   └── signup.spec.ts
│   ├── cart/
│   │   └── cart.spec.ts
│   ├── checkout/
│   │   └── checkout.spec.ts
│   ├── products/
│   │   └── products.spec.ts
│   └── smoke.spec.ts
│
├── .gitignore
├── package.json
├── playwright.config.ts
└── README.md
```

---

## API Endpoints Overview

| Method | Endpoint | Protection | Description |
|---|---|---|---|
| `GET` | `/api/health` | Public | System & PostgreSQL database health check |
| `POST` | `/api/auth/signup` | Public | Register new customer user |
| `POST` | `/api/auth/login` | Public | Authenticate user & receive JWT token |
| `GET` | `/api/auth/me` | JWT (`authMiddleware`) | Retrieve logged-in user profile |
| `GET` | `/api/admin/test` | JWT + Admin (`adminMiddleware`) | Test endpoint for admin role authorization |
| `GET` | `/api/products` | Public | Paginated product list with search, filter, and sort |
| `GET` | `/api/products/:id` | Public | Single product details with category |
| `GET` | `/api/categories` | Public | Active categories list |
| `GET` | `/api/cart` | JWT (`authMiddleware`) | Retrieve or initialize authenticated user's shopping cart |
| `POST` | `/api/cart` | JWT (`authMiddleware`) | Add product to cart with stock validation & atomic transaction |
| `PUT` | `/api/cart/items/:id` | JWT (`authMiddleware`) | Update cart item quantity with ownership & stock validation |
| `DELETE` | `/api/cart/items/:id` | JWT (`authMiddleware`) | Remove cart item from authenticated user's cart |
| `GET` | `/api/addresses` | JWT (`authMiddleware`) | List all saved delivery addresses for user |
| `POST` | `/api/addresses` | JWT (`authMiddleware`) | Create new delivery address (auto default if first) |
| `GET` | `/api/addresses/:id` | JWT (`authMiddleware`) | Get single delivery address |
| `PUT` | `/api/addresses/:id` | JWT (`authMiddleware`) | Update delivery address |
| `PATCH` | `/api/addresses/:id/default` | JWT (`authMiddleware`) | Set address as default delivery address |
| `DELETE` | `/api/addresses/:id` | JWT (`authMiddleware`) | Delete delivery address with automatic default reassignment |
| `GET` | `/api/checkout/summary` | JWT (`authMiddleware`) | Real-time checkout calculation, items, address, and pricing |
| `POST` | `/api/orders` | JWT (`authMiddleware`) | Place order with atomic transaction, dummy payment, inventory decrement, and cart clearing |
| `GET` | `/api/orders` | JWT (`authMiddleware`) | List all past orders for logged-in user with status and preview |
| `GET` | `/api/orders/:id` | JWT (`authMiddleware`) | Detailed order receipt with item snapshots, payment status, and shipping snapshot |

---

## Frontend Routes

| Path | Protection | Description |
|---|---|---|
| `/` | Public | Landing page with Hero, Live Health Monitor, and Featured Mobiles |
| `/products` | Public | Smartphone Catalog with Search, Category Filter, Sort, and Pagination |
| `/products/:id` | Public | Smartphone Details Page with interactive quantity selector & Add to Cart |
| `/cart` | Dynamic | Full shopping cart with item table, quantity controls, and summary card |
| `/addresses` | Protected | Delivery address book with Add, Edit, Delete, and Set Default |
| `/checkout` | Protected | 3-step checkout with address selection, simulated COD/Card payment, and line-item review |
| `/order-confirmation/:orderId` | Protected | Order receipt with payment confirmation, snapshot address, and order items |
| `/orders` | Protected | Order history list with status badges, price breakdown, and receipt links |
| `/login` | Public | User sign-in page |
| `/signup` | Public | User registration page |
| `/profile` | Protected | User profile with quick action tiles to Orders, Addresses, and Cart |
| `/admin` | Protected (Admin) | Admin dashboard (Step 8) |

---

## Manual Testing with Windows PowerShell

### 1. Authenticate and Get Token
```powershell
$loginRes = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method POST -ContentType "application/json" -Body '{"email":"john.doe@example.com","password":"Customer@123"}'
$token = $loginRes.data.token
$headers = @{ Authorization = "Bearer $token" }
```

### 2. Save Delivery Address (`POST /api/addresses`)
```powershell
$addrRes = Invoke-RestMethod -Uri "http://localhost:5000/api/addresses" -Method POST -Headers $headers -ContentType "application/json" -Body '{"fullName":"John Doe","phone":"9876543210","addressLine1":"Flat 4B, Galaxy Heights","city":"Mumbai","state":"Maharashtra","postalCode":"400001","country":"India","isDefault":true}'
$addressId = $addrRes.data.id
```

### 3. Fetch Checkout Summary (`GET /api/checkout/summary`)
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/checkout/summary" -Method GET -Headers $headers
```

### 4. Place Order with COD (`POST /api/orders`)
```powershell
$orderRes = Invoke-RestMethod -Uri "http://localhost:5000/api/orders" -Method POST -Headers $headers -ContentType "application/json" -Body (@{ addressId = $addressId; paymentMethod = "COD" } | ConvertTo-Json)
$orderId = $orderRes.data.order.id
```

### 5. View Order Receipt (`GET /api/orders/:id`)
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/orders/$orderId" -Method GET -Headers $headers
```

---

## Running Automated Tests

Run the complete 170-test Playwright suite across all application features:

```powershell
# Run entire test suite (170 tests)
npx playwright test

# Run Address API & UI tests (23 tests)
npx playwright test tests/api/addresses.spec.ts tests/addresses/addresses.spec.ts

# Run Checkout & Order API & UI tests (52 tests)
npx playwright test tests/api/checkout.spec.ts tests/api/orders.spec.ts tests/checkout/checkout.spec.ts

# Open HTML test report
npx playwright show-report
```
