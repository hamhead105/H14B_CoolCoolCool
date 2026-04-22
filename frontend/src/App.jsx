import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import BuyerDashboard from './pages/BuyerDashboard';
import SellerDashboard from './pages/SellerDashboard';
import ProductsPage from './pages/ProductsPage';
import SpecialsPage from './pages/SpecialsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import ProductListingPage from './pages/ProductListingPage';
import CartPage from './pages/CartPage';
import BuyerOrdersPage from './pages/BuyerOrdersPage';
import OrderDetailsPage from './pages/OrderDetailsPage';
import OrdersPage from './pages/OrdersPage';
import SettingsPage from './pages/SettingsPage';
import InvoicePage from './pages/InvoicePage';
import DespatchAdvicePage from './pages/DespatchAdvicePage';



// ── Auth helpers ─────────────────────────────────────────────
export function getToken() { return localStorage.getItem('token'); }
export function getRole() { return localStorage.getItem('role'); }
export function getUserId() {
  const role = getRole();
  return role === 'seller' ? localStorage.getItem('sellerId') : localStorage.getItem('buyerId');
}
export function logout() { localStorage.clear(); window.location.href = '/login'; }

// ── Protected route wrapper ──────────────────────────────────
function ProtectedRoute({ children, requiredRole }) {
  const token = getToken();
  const role = getRole();
  if (!token) return <Navigate to="/login" replace />;
  if (requiredRole && role !== requiredRole) return <Navigate to="/login" replace />;
  return children;
}

// ── App ──────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/orders/:orderId/invoice" element={<InvoicePage />} />
        <Route path="/orders/:orderId/despatch-advice" element={<DespatchAdvicePage />} />

        {/* Buyer */}
        <Route path="/buyer/dashboard" element={
          <ProtectedRoute requiredRole="buyer"><BuyerDashboard /></ProtectedRoute>
        } />
        <Route path="/products" element={
          <ProtectedRoute><ProductsPage /></ProtectedRoute>
        } />
        <Route path="/specials" element={
          <ProtectedRoute><SpecialsPage /></ProtectedRoute>
        } />
        <Route path="/products/:id" element={
          <ProtectedRoute><ProductDetailPage /></ProtectedRoute>
        } />
        <Route path="/cart" element={
          <ProtectedRoute requiredRole="buyer"><CartPage /></ProtectedRoute>
        } />

        {/* Seller */}
        <Route path="/seller/dashboard" element={
          <ProtectedRoute requiredRole="seller"><SellerDashboard /></ProtectedRoute>
        } />
        <Route path="/seller/products" element={
          <ProtectedRoute requiredRole="seller"><ProductListingPage /></ProtectedRoute>
        } />
        <Route path="/buyer/orders" element={
          <ProtectedRoute requiredRole="buyer"><BuyerOrdersPage /></ProtectedRoute>
        } />
        <Route path="/orders" element={
          <ProtectedRoute requiredRole="seller"><OrdersPage /></ProtectedRoute>
        } />
        <Route path="/orders/:orderId" element={<OrderDetailsPage />} />
        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}