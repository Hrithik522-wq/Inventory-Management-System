import React, { useState } from 'react'
import { apiFetch } from '../api/client.js'

export default function ContactPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [messageText, setMessageText] = useState('')
  const [feedback, setFeedback] = useState('')

  async function handleSubmit() {
    setFeedback('')
    if (!name || !email || !messageText) {
      setFeedback('All fields are required.')
      return
    }

    try {
      await apiFetch('/api/contact', {
        method: 'POST',
        body: { name, email, message: messageText }
      })
      setFeedback('Success! Your message has been sent.')
      setName('')
      setEmail('')
      setMessageText('')
    } catch(e) {
      setFeedback(e.message)
    }
  }

  return (
    <div className="section" style={{ padding: '0 24px', maxWidth: 600, margin: '40px auto' }}>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <h2 style={{ margin: 0 }}>Contact Us</h2>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 800, color: 'var(--text)' }}>Hrithik</div>
            <div style={{ fontSize: '0.9em', color: 'var(--info)' }}>stocxpertinventory@gmail.com</div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label>Name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Hrithik Pandey" />
          </div>
          <div>
            <label>Email</label>
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="stocxpertinventory@gmail.com" />
          </div>
          <div>
            <label>Message</label>
            <textarea
              style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 10, border: 'none', outline: 'none', background: 'rgba(255,255,255,0.95)', minHeight: 120, fontFamily: 'inherit' }}
              value={messageText}
              onChange={e => setMessageText(e.target.value)}
              placeholder="Your message here..."
            />
          </div>
          <button onClick={handleSubmit} style={{ alignSelf: 'flex-start' }}>Send Message</button>
        </div>
        {feedback && (
          <div className="message" style={{ marginTop: 16, background: feedback.startsWith('Success') ? 'rgba(46,204,113,0.2)' : 'rgba(231,76,60,0.2)' }}>
            {feedback}
          </div>
        )}
      </div>
    </div>
  )
}
