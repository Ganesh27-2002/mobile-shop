import { Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar.js';
import { ProtectedRoute } from './components/ProtectedRoute.js';
import { HomePage } from './pages/HomePage.js';
import { LoginPage } from './pages/LoginPage.js';
import { SignupPage } from './pages/SignupPage.js';
import { ProfilePage } from './pages/ProfilePage.js';
import { ProductsPage } from './pages/ProductsPage.js';
import { ProductDetailsPage } from './pages/ProductDetailsPage.js';
import { CartPage } from './pages/CartPage.js';
import { AddressesPage } from './pages/AddressesPage.js';
import { CheckoutPage } from './pages/CheckoutPage.js';
import { OrderConfirmationPage } from './pages/OrderConfirmationPage.js';
import { OrdersPage } from './pages/OrdersPage.js';
import { PlaceholderPage } from './components/PlaceholderPage.js';
import './App.css';

function App() {
  return (
    <div className="app-container">
      {/* Dynamic Navbar */}
      <Navbar />

      {/* Routed Main Content */}
      <main className="main-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* Product Catalog & Details (Public) */}
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/:id" element={<ProductDetailsPage />} />

          {/* Shopping Cart */}
          <Route path="/cart" element={<CartPage />} />

          {/* Protected Routes (Addresses, Checkout, Confirmation, Orders, Profile) */}
          <Route
            path="/addresses"
            element={
              <ProtectedRoute>
                <AddressesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <CheckoutPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/order-confirmation/:orderId"
            element={
              <ProtectedRoute>
                <OrderConfirmationPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <OrdersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          {/* Step 8 Admin */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <PlaceholderPage
                  title="Admin Dashboard"
                  description="Manage smartphone catalogs, stock inventories, orders, and customer accounts."
                  icon="🛡️"
                  stepName="Coming in Step 8"
                />
              </ProtectedRoute>
            }
          />

          {/* 404 Fallback */}
          <Route
            path="*"
            element={
              <PlaceholderPage
                title="Page Not Found"
                description="The page you are looking for does not exist or has been moved."
                icon="🔍"
                stepName="404 Not Found"
              />
            }
          />
        </Routes>
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <p>&copy; {new Date().getFullYear()} Mobile Shop. All rights reserved. Step 7 Checkout & Order Management.</p>
      </footer>
    </div>
  );
}

export default App;
