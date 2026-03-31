import React from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

import LoginPage from './pages/LoginPage.jsx'
import SignupPage from './pages/SignupPage.jsx'
import AdminLoginPage from './pages/AdminLoginPage.jsx'
import InventoryPage from './pages/InventoryPage.jsx'
import AdminPanelPage from './pages/AdminPanelPage.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/inventory" element={<InventoryPage />} />
      <Route path="/admin" element={<AdminPanelPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

