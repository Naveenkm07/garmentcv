
import { Outlet, NavLink, Navigate, useNavigate } from 'react-router-dom'
import { LayoutDashboard, PlusCircle, Camera, Box, LogOut } from 'lucide-react'

export default function Layout() {
  const navigate = useNavigate()
  const token = localStorage.getItem('token')
  
  if (!token) {
    return <Navigate to="/login" replace />
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/login')
  }
  return (
    <div className="layout-container">
      <aside className="sidebar">
        <div style={{ padding: '0 24px 32px', fontSize: '1.2rem', fontWeight: 'bold', color: 'white' }}>
          GarmentCV
        </div>
        
        <nav style={{ flex: 1 }}>
          <NavLink to="/dashboard" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
            <LayoutDashboard size={20} /> Dashboard
          </NavLink>
          <NavLink to="/products/new" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
            <PlusCircle size={20} /> New Product
          </NavLink>
          <NavLink to="/catalog" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
            <Box size={20} /> Catalog
          </NavLink>
          <NavLink to="/calibration" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
            <Camera size={20} /> Calibration
          </NavLink>
        </nav>

        <div style={{ padding: '24px' }}>
          <button onClick={handleLogout} className="btn" style={{ width: '100%', background: 'rgba(255,255,255,0.1)', color: 'white' }}>
            <LogOut size={16} style={{ marginRight: '8px' }} /> Logout
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}
