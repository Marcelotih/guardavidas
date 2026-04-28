import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Login } from './components/Login'
import { Dashboard } from './components/Dashboard'
import { CheckIn } from './components/CheckIn'
import { CheckOut } from './components/CheckOut'
import { Historico } from './components/Historico'
import { AdminDashboard } from './components/AdminDashboard'

function RotaSV({ children }) {
  const token = localStorage.getItem('token')
  return token ? children : <Navigate to="/login" replace />
}

function RotaAdmin({ children }) {
  const token = localStorage.getItem('tokenAdmin')
  return token ? children : <Navigate to="/login" replace />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Salva-vidas */}
        <Route path="/dashboard" element={<RotaSV><Dashboard /></RotaSV>} />
        <Route path="/checkin"   element={<RotaSV><CheckIn /></RotaSV>} />
        <Route path="/checkout"  element={<RotaSV><CheckOut /></RotaSV>} />
        <Route path="/historico" element={<RotaSV><Historico /></RotaSV>} />

        {/* Admin */}
        <Route path="/admin" element={<RotaAdmin><AdminDashboard /></RotaAdmin>} />

        {/* Histórico também acessível pelo admin */}
        <Route path="/admin/historico" element={<RotaAdmin><Historico /></RotaAdmin>} />

        {/* Redireciona raiz */}
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App