import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import SEIndex from './pages/SEIndex'
import QEIndex from './pages/QEIndex'
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
        <Route path="/" element={<LoginRoute />} />
        <Route path="/se" element={
          <ProtectedRoute allowedRole="SE">
            <SEIndex />
          </ProtectedRoute>
        } />
        <Route path="/qe" element={
          <ProtectedRoute allowedRole="QE">
            <QEIndex />
          </ProtectedRoute>
        } />
        <Route path="/admin" element={
          <ProtectedRoute allowedRole="ADMIN">
            <AdminPanel />
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  )
}

export default App