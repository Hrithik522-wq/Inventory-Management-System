import React from 'react'
import Navbar from './Navbar.jsx'
import Footer from './Footer.jsx'

export default function AppLayout({ children }) {
  return (
    <div className="layout-container">
      <Navbar />
      <div className="layout-content">
        {children}
      </div>
      <Footer />
    </div>
  )
}
