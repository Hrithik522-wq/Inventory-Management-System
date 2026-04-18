import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { apiFetch } from '../api/client.js'

export default function Navbar() {
  const navigate = useNavigate()

  async function handleLogout() {
    try {
      await apiFetch('/api/logout', { method: 'POST' })
    } catch {
      // ignore
    }
    window.location.href = '/'
  }

  return (
    <nav className="navbar">
      <div style={{ fontWeight: 800, fontSize: '1.2em', letterSpacing: '1px' }}>STOCKXPERT</div>
      <div className="nav-links">
        <NavLink to="/inventory" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Home</NavLink>
        <NavLink to="/purchases" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Purchase Details</NavLink>
        <NavLink to="/ai-prediction" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>AI Prediction</NavLink>
        <NavLink to="/contact" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Contact</NavLink>
        <NavLink to="/admin/login" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Admin Panel</NavLink>
      </div>
      <div>
        <button onClick={handleLogout} className="danger" style={{ padding: '8px 16px', fontSize: '0.9em' }}>Logout</button>
      </div>
    </nav>
  )
}
