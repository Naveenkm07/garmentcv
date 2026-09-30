import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
      const res = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          username: email,
          password: password,
        })
      })
      if (!res.ok) {
        throw new Error('Login failed')
      }
      const data = await res.json()
      localStorage.setItem('token', data.access_token)
      navigate('/dashboard')
    } catch (err) {
      alert('Login failed. Please check credentials.')
    }
  }

  const handleRegister = async (e: React.MouseEvent) => {
    e.preventDefault()
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
      const res = await fetch(`${apiUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role: 'OPERATOR' })
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.detail || 'Registration failed')
      }
      alert('Registration successful! Please sign in.')
    } catch (err: any) {
      alert(err.message)
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '400px' }}>
        <h2 style={{ marginBottom: '24px', textAlign: 'center' }}>Login to GarmentCV</h2>
        
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Email</label>
            <input 
              type="email" 
              className="input-field" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="operator@store.com"
              required 
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Password</label>
            <input 
              type="password" 
              className="input-field" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required 
            />
          </div>
          <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
            <button type="submit" className="btn btn-primary" style={{ padding: '12px', flex: 1 }}>
              Sign In
            </button>
            <button type="button" onClick={handleRegister} className="btn" style={{ padding: '12px', flex: 1, background: 'rgba(255,255,255,0.1)', color: 'white' }}>
              Register
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
