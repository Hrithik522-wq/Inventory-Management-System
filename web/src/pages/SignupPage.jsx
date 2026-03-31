import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch } from '../api/client.js'

export default function SignupPage() {
  const navigate = useNavigate()
  const [name, setName] = useState('HR')
  const [email, setEmail] = useState('newuser@example.com')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')

  async function handleSignUp() {
    setMessage('')
    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      setMessage('Please fill in all fields')
      return
    }
    if (password !== confirmPassword) {
      setMessage('Passwords do not match')
      return
    }

    try {
      await apiFetch('/api/signup', {
        method: 'POST',
        body: { name: name.trim(), email: email.trim(), password },
      })
      navigate('/')
    } catch (e) {
      setMessage(e.message)
    }
  }

  function handleBack() {
    navigate('/')
  }

  return (
    <div className="app-shell">
      <div className="card" style={{ maxWidth: 520, margin: '0 auto' }}>
        <div className="section" style={{ alignItems: 'center' }}>
          <h2 style={{ margin: 0 }}>Create Account</h2>
          <div style={{ width: 360, background: 'rgba(255,255,255,0.15)', borderRadius: 18, padding: 16 }}>
            <label>Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} />
            <div style={{ height: 10 }} />
            <label>Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} />
            <div style={{ height: 10 }} />
            <label>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <div style={{ height: 10 }} />
            <label>Confirm Password</label>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          </div>

          {message ? (
            <div className="message" style={{ width: 360, background: 'rgba(231,76,60,0.18)', color: '#ffcccc' }}>
              {message}
            </div>
          ) : null}

          <div className="row" style={{ justifyContent: 'center', marginTop: 12 }}>
            <button onClick={handleSignUp}>Sign Up</button>
            <button onClick={handleBack} className="secondary">
              Back to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

