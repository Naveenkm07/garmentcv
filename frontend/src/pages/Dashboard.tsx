import { useState, useEffect } from 'react'
import { Activity, CheckCircle, Clock, AlertTriangle } from 'lucide-react'

interface Product {
  id: number
  sku: string
  name: string | null
  status: string
  created_at: string
}

interface Stats {
  total: number
  pending_review: number
  completed: number
  low_confidence: number
}

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

function computeStats(products: Product[]): Stats {
  return {
    total: products.length,
    pending_review: products.filter((p) => p.status === 'REVIEW_REQUIRED').length,
    completed: products.filter((p) => p.status === 'COMPLETED' || p.status === 'VERIFIED').length,
    // low_confidence products are those stuck in REVIEW_REQUIRED; CV pipeline will refine this later
    low_confidence: products.filter((p) => p.status === 'REVIEW_REQUIRED').length,
  }
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentProducts, setRecentProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    fetch(`${API_URL}/api/products?limit=200`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error(`API error ${r.status}`)
        return r.json()
      })
      .then((data: Product[]) => {
        setStats(computeStats(data))
        // Show 5 most recent
        setRecentProducts([...data].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5))
        setLoading(false)
      })
      .catch((e) => {
        setError(e.message)
        setLoading(false)
      })
  }, [])

  const STATUS_LABEL: Record<string, string> = {
    DRAFT: 'Draft',
    CAPTURING: 'Capturing',
    PROCESSING: 'Processing',
    REVIEW_REQUIRED: 'Review Required',
    VERIFIED: 'Verified',
    COMPLETED: 'Completed',
    REJECTED: 'Rejected',
  }

  return (
    <div className="animate-fade-in">
      <h1 style={{ marginBottom: '8px' }}>Dashboard</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>Welcome back. Here is today's overview.</p>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: '12px', padding: '12px 18px', marginBottom: '24px', color: 'var(--danger)' }}>
          Could not load live data: {error}
        </div>
      )}

      <div className="grid-cards" style={{ marginBottom: '32px' }}>
        <div className="glass-panel">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ color: 'var(--text-muted)' }}>Total Products</h3>
            <Activity color="var(--primary-color)" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
            {loading ? '…' : stats?.total ?? 0}
          </div>
        </div>

        <div className="glass-panel">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ color: 'var(--text-muted)' }}>Pending Review</h3>
            <Clock color="var(--warning)" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
            {loading ? '…' : stats?.pending_review ?? 0}
          </div>
        </div>

        <div className="glass-panel">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ color: 'var(--text-muted)' }}>Completed</h3>
            <CheckCircle color="var(--success)" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
            {loading ? '…' : stats?.completed ?? 0}
          </div>
        </div>

        <div className="glass-panel">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ color: 'var(--text-muted)' }}>Low Confidence</h3>
            <AlertTriangle color="var(--danger)" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
            {loading ? '…' : stats?.low_confidence ?? 0}
          </div>
        </div>
      </div>

      <div className="glass-panel">
        <h3 style={{ marginBottom: '16px' }}>Recent Products</h3>
        {loading && <p style={{ color: 'var(--text-muted)' }}>Loading…</p>}
        {!loading && recentProducts.length === 0 && (
          <p style={{ color: 'var(--text-muted)' }}>No products yet. Create the first one!</p>
        )}
        {!loading && recentProducts.length > 0 && (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                {['SKU', 'Name', 'Status', 'Created'].map((h) => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, fontSize: '13px' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentProducts.map((p, i) => (
                <tr key={p.id} style={{ borderBottom: i < recentProducts.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                  <td style={{ padding: '10px 14px', fontWeight: 'bold', fontFamily: 'monospace' }}>{p.sku}</td>
                  <td style={{ padding: '10px 14px' }}>{p.name ?? <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                  <td style={{ padding: '10px 14px', fontSize: '13px' }}>{STATUS_LABEL[p.status] ?? p.status}</td>
                  <td style={{ padding: '10px 14px', color: 'var(--text-muted)', fontSize: '13px' }}>
                    {new Date(p.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
