import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import BuyerDashboard from './pages/BuyerDashboard';
import SellerDashboard from './pages/SellerDashboard';
import ProductsPage from './pages/ProductsPage';
import ProductListingPage from './pages/ProductListingPage';
import CartPage from './pages/CartPage';
import OrdersPage from './pages/OrdersPage';
import DespatchPage from './pages/DespatchPage';

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

        {/* Buyer */}
        <Route path="/buyer/dashboard" element={
          <ProtectedRoute requiredRole="buyer"><BuyerDashboard /></ProtectedRoute>
        } />
        <Route path="/products" element={
          <ProtectedRoute><ProductsPage /></ProtectedRoute>
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
        <Route path="/orders" element={
          <ProtectedRoute requiredRole="seller"><OrdersPage /></ProtectedRoute>
        } />
        <Route path="/orders/:id/despatch" element={
          <ProtectedRoute requiredRole="seller"><DespatchPage /></ProtectedRoute>
        } />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}