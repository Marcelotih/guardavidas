import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Inicio } from './components/Inicio'
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
        {/* Início público */}
        <Route path="/" element={<Inicio />} />
        <Route path="/login" element={<Login />} />

        {/* Salva-vidas */}
        <Route path="/dashboard" element={<RotaSV><Dashboard /></RotaSV>} />
        <Route path="/checkin"   element={<RotaSV><CheckIn /></RotaSV>} />
        <Route path="/checkout"  element={<RotaSV><CheckOut /></RotaSV>} />
        <Route path="/historico" element={<RotaSV><Historico /></RotaSV>} />

        {/* Admin */}
        <Route path="/admin" element={<RotaAdmin><AdminDashboard /></RotaAdmin>} />
        <Route path="/admin/historico" element={<RotaAdmin><Historico /></RotaAdmin>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App