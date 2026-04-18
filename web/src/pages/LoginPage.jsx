import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch } from '../api/client.js'

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')

  async function handleLogin() {
    setMessage('')
    try {
      const data = await apiFetch('/api/login', {
        method: 'POST',
        body: { email, password },
      })
      if (data?.ok) {
        navigate('/inventory')
      }
    } catch (e) {
      setMessage(e.message)
    }
  }

  function handleSignUp() {
    navigate('/signup')
  }

  function handleAdmin() {
    navigate('/admin/login')
  }

  return (
    <div className="app-shell">
      <div className="card" style={{ maxWidth: 520, margin: '0 auto' }}>
        <div className="section" style={{ alignItems: 'center' }}>
          <h1 style={{ margin: 0 }}>STOCKXPERT</h1>
          <h2 style={{ margin: 0 }}>Login</h2>
          <div style={{ width: 360, background: 'rgba(255,255,255,0.15)', borderRadius: 18, padding: 16 }}>
            <label>Email</label>
            <input
              value={email}
              autoComplete="off"
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
            <div style={{ height: 10 }} />
            <label>Password</label>
            <input
              type="password"
              value={password}
              autoComplete="new-password"
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
          </div>

          {message ? (
            <div className="message" style={{ width: 360, background: 'rgba(231,76,60,0.18)', color: '#ffcccc' }}>
              {message}
            </div>
          ) : null}

          <div className="row" style={{ justifyContent: 'center', marginTop: 12 }}>
            <button onClick={handleLogin}>Login</button>
            <button onClick={handleSignUp} className="secondary">
              Sign Up
            </button>
            <button onClick={handleAdmin} style={{ background: 'linear-gradient(to bottom, #2ecc71, #27ae60)' }}>
              Admin Panel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

