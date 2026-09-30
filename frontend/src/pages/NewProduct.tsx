import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function NewProduct() {
  const navigate = useNavigate()
  
  const [formData, setFormData] = useState({
    sku: '',
    product_code: '',
    name: '',
    category_id: '',
    brand: '',
    color: '',
    size_label: '',
    similarity_group_id: ''
  })
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
      const payload = {
        ...formData,
        category_id: formData.category_id ? parseInt(formData.category_id, 10) : null
      }
      
      const token = localStorage.getItem('token')
      const res = await fetch(`${apiUrl}/api/products`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.detail || 'Failed to create product')
      }
      
      // Go to some product detail page or back to dashboard
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="animate-fade-in">
      <h1 style={{ marginBottom: '8px' }}>New Product</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>Enter product details to create a new record.</p>

      <div className="glass-panel" style={{ maxWidth: '600px' }}>
        {error && <div style={{ color: 'var(--danger)', marginBottom: '16px', padding: '12px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '4px' }}>{error}</div>}
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>SKU *</label>
            <input 
              type="text" 
              name="sku"
              className="input-field" 
              value={formData.sku}
              onChange={handleChange}
              required 
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Name</label>
              <input 
                type="text" 
                name="name"
                className="input-field" 
                value={formData.name}
                onChange={handleChange}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Product Code</label>
              <input 
                type="text" 
                name="product_code"
                className="input-field" 
                value={formData.product_code}
                onChange={handleChange}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Brand</label>
              <input 
                type="text" 
                name="brand"
                className="input-field" 
                value={formData.brand}
                onChange={handleChange}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Category ID</label>
              <input 
                type="number" 
                name="category_id"
                className="input-field" 
                value={formData.category_id}
                onChange={handleChange}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Color</label>
              <input 
                type="text" 
                name="color"
                className="input-field" 
                value={formData.color}
                onChange={handleChange}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Size Label</label>
              <input 
                type="text" 
                name="size_label"
                className="input-field" 
                value={formData.size_label}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Similarity Group ID</label>
            <input 
              type="text" 
              name="similarity_group_id"
              className="input-field" 
              value={formData.similarity_group_id}
              onChange={handleChange}
            />
          </div>

          <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
            <button 
              type="button" 
              className="btn" 
              onClick={() => navigate('/dashboard')}
              style={{ padding: '12px 24px', background: 'transparent', border: '1px solid var(--border-color)', color: 'white' }}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ padding: '12px 24px' }}
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
