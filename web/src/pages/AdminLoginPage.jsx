import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch } from '../api/client.js'

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('admin123')
  const [password, setPassword] = useState('admin@123')
  const [message, setMessage] = useState('')

  async function handleAdminLogin() {
    setMessage('')
    try {
      await apiFetch('/api/admin/login', {
        method: 'POST',
        body: { username, password },
      })
      navigate('/admin')
    } catch (e) {
      setMessage(e.message)
    }
  }

  function handleCancel() {
    navigate('/')
  }

  return (
    <div className="app-shell">
      <div className="card" style={{ maxWidth: 520, margin: '0 auto' }}>
        <div className="section" style={{ alignItems: 'center' }}>
          <h2 style={{ margin: 0 }}>Admin Login</h2>
          <div style={{ width: 360, background: 'rgba(255,255,255,0.10)', borderRadius: 18, padding: 16 }}>
            <label>Username</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)} />
            <div style={{ height: 10 }} />
            <label>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>

          {message ? (
            <div className="message" style={{ width: 360, background: 'rgba(231,76,60,0.18)', color: '#ffcccc' }}>
              {message}
            </div>
          ) : null}

          <div className="row" style={{ justifyContent: 'center', marginTop: 12 }}>
            <button
              onClick={handleAdminLogin}
              style={{ background: 'linear-gradient(to bottom, #2ecc71, #27ae60)' }}
            >
              Login
            </button>
            <button onClick={handleCancel} className="danger">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

