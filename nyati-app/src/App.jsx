import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import SEIndex from './pages/SEIndex'
import QEIndex from './pages/QEIndex'
import HODDashboard from './pages/HODDashboard'
// ✅ AdminPanel import ho raha hai aapke pages folder se
import AdminPanel from './pages/AdminPanel'

function ProtectedRoute({ children, allowedRole }) {
  const user = JSON.parse(localStorage.getItem('nyati_user') || '{}')
  if (!user.role) return <Navigate to="/" replace />
  if (allowedRole && user.role !== allowedRole) return <Navigate to="/" replace />
  return children
}

// ✅ Agar already logged in hai toh seedha role page pe bhejo
function LoginRoute() {
  const user = JSON.parse(localStorage.getItem('nyati_user') || '{}')
  if (user.role === 'SE') return <Navigate to="/se" replace />
  if (user.role === 'QE') return <Navigate to="/qe" replace />
  if (user.role === 'ADMIN') return <Navigate to="/admin" replace />
  if (user.role === 'HOD') return <Navigate to="/hod" replace />
  return <Login />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 1. Login Page */}
        <Route path="/" element={<LoginRoute />} />

        {/* 2. Site Engineer Route */}
        <Route path="/se" element={
          <ProtectedRoute allowedRole="SE">
            <SEIndex />
          </ProtectedRoute>
        } />

        {/* 3. Quality Engineer Route */}
        <Route path="/qe" element={
          <ProtectedRoute allowedRole="QE">
            <QEIndex />
          </ProtectedRoute>
        } />

        {/* 4. ✅ ADMIN PANEL PERMANENT ROUTE (Jo aapne manga tha) */}
        {/* Isko access karne ke liye user ka role 'ADMIN' hona zaroori hai */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRole="ADMIN">
            <AdminPanel />
          </ProtectedRoute>
        } />
        <Route path="/hod" element={
          <ProtectedRoute allowedRole="HOD">
            <HODDashboard />
          </ProtectedRoute>
        } />
        {/* 5. Catch-all: Agar koi galat link ho toh Login pe wapas */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App