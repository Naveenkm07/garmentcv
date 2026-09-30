import { useState, useEffect } from 'react'
import { Package, Search, Filter } from 'lucide-react'

interface Product {
  id: number
  sku: string
  name: string | null
  brand: string | null
  color: string | null
  size_label: string | null
  status: string
  created_at: string
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'rgba(255,255,255,0.2)',
  CAPTURING: 'rgba(59,130,246,0.3)',
  PROCESSING: 'rgba(245,158,11,0.3)',
  REVIEW_REQUIRED: 'rgba(239,68,68,0.3)',
  VERIFIED: 'rgba(16,185,129,0.2)',
  COMPLETED: 'rgba(16,185,129,0.4)',
  REJECTED: 'rgba(239,68,68,0.15)',
}

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export default function Catalog() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('token')
    fetch(`${API_URL}/api/products?limit=200`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error(`Failed to load products (${r.status})`)
        return r.json()
      })
      .then((data: Product[]) => {
        setProducts(data)
        setLoading(false)
      })
      .catch((e) => {
        setError(e.message)
        setLoading(false)
      })
  }, [])

  const filtered = products.filter((p) => {
    const q = search.toLowerCase()
    return (
      p.sku.toLowerCase().includes(q) ||
      (p.name ?? '').toLowerCase().includes(q) ||
      (p.brand ?? '').toLowerCase().includes(q)
    )
  })

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <h1>Product Catalog</h1>
        <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
          {loading ? '…' : `${filtered.length} product${filtered.length !== 1 ? 's' : ''}`}
        </span>
      </div>
      <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
        Browse and search all registered garments.
      </p>

      {/* Search bar */}
      <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', padding: '12px 20px' }}>
        <Search size={18} color="var(--text-muted)" />
        <input
          className="input-field"
          style={{ flex: 1, background: 'transparent', border: 'none', padding: 0 }}
          placeholder="Search by SKU, name or brand…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Filter size={18} color="var(--text-muted)" />
      </div>

      {loading && (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
          Loading products…
        </div>
      )}

      {error && (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '48px', color: 'var(--danger)' }}>
          {error}
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '48px' }}>
          <Package size={48} color="var(--text-muted)" style={{ marginBottom: '16px' }} />
          <p style={{ color: 'var(--text-muted)' }}>
            {search ? 'No products match your search.' : 'No products yet. Create the first one!'}
          </p>
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                {['SKU', 'Name', 'Brand', 'Color', 'Size', 'Status', 'Created'].map((h) => (
                  <th key={h} style={{ padding: '14px 18px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, fontSize: '13px' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => (
                <tr
                  key={p.id}
                  style={{
                    borderBottom: i < filtered.length - 1 ? '1px solid var(--border-color)' : 'none',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLTableRowElement).style.background = 'rgba(255,255,255,0.04)')}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLTableRowElement).style.background = 'transparent')}
                >
                  <td style={{ padding: '14px 18px', fontWeight: 'bold', fontFamily: 'monospace' }}>{p.sku}</td>
                  <td style={{ padding: '14px 18px' }}>{p.name ?? <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                  <td style={{ padding: '14px 18px' }}>{p.brand ?? <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                  <td style={{ padding: '14px 18px' }}>{p.color ?? <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                  <td style={{ padding: '14px 18px' }}>{p.size_label ?? <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                  <td style={{ padding: '14px 18px' }}>
                    <span style={{
                      padding: '3px 10px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      background: STATUS_COLORS[p.status] ?? 'rgba(255,255,255,0.1)',
                    }}>
                      {p.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td style={{ padding: '14px 18px', color: 'var(--text-muted)', fontSize: '13px' }}>
                    {new Date(p.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
