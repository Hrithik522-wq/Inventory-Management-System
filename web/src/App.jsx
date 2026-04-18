import React from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

import LoginPage from './pages/LoginPage.jsx'
import SignupPage from './pages/SignupPage.jsx'
import AdminLoginPage from './pages/AdminLoginPage.jsx'
import InventoryPage from './pages/InventoryPage.jsx'
import AdminPanelPage from './pages/AdminPanelPage.jsx'

import PurchasePage from './pages/PurchasePage.jsx'
import AIPredictionPage from './pages/AIPredictionPage.jsx'
import ContactPage from './pages/ContactPage.jsx'
import AppLayout from './components/AppLayout.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />
      
      <Route path="/inventory" element={<AppLayout><InventoryPage /></AppLayout>} />
      <Route path="/purchases" element={<AppLayout><PurchasePage /></AppLayout>} />
      <Route path="/ai-prediction" element={<AppLayout><AIPredictionPage /></AppLayout>} />
      <Route path="/contact" element={<AppLayout><ContactPage /></AppLayout>} />
      <Route path="/admin" element={<AppLayout><AdminPanelPage /></AppLayout>} />
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

